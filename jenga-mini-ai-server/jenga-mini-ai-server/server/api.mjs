import http from 'node:http';
import {isIP} from 'node:net';
import {pathToFileURL} from 'node:url';
import {config, llamaURL} from './config.mjs';

class ClientError extends Error { constructor(status,message){super(message);this.status=status;} }
export function validate(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new ClientError(400,'Expected a JSON object.');
  const messages=body.messages??(typeof body.message==='string'?[{role:'user',content:body.message}]:null);
  if(!Array.isArray(messages)||!messages.length||messages.length>25)throw new ClientError(400,'Send between 1 and 25 messages.');
  let length=0;
  for(let i=0;i<messages.length;i++){
    const m=messages[i];
    if(!m||m.role!==(i%2===0?'user':'assistant')||typeof m.content!=='string'||!m.content.trim()||m.content.length>8000)
      throw new ClientError(400,'Messages must alternate user/assistant, begin and end with user, and contain 1–8000 characters each.');
    length+=m.content.length;
  }
  if(messages.at(-1).role!=='user'||length>16000)throw new ClientError(400,'End with a user message and keep history below 16000 characters.');
  if(body.stream!==undefined&&typeof body.stream!=='boolean')throw new ClientError(400,'stream must be true or false.');
  return messages.map(({role,content})=>({role,content}));
}
async function readJSON(req){
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw new ClientError(415,'Use Content-Type: application/json.');
  let size=0,chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>32768)throw new ClientError(413,'Request exceeds 32 KiB.');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ClientError(400,'Invalid JSON.');}
}
export function createAPI(){
  let busy=false, healthCache=null, healthUntil=0, healthPending=null;
  const rates=new Map();
  const cleaner=setInterval(()=>{const now=Date.now();for(const [k,v]of rates)if(v.until<now)rates.delete(k);},60000);cleaner.unref();
  const server=http.createServer(async(req,res)=>{
    const origin=req.headers.origin;
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
    const json=(status,data)=>{if(!res.destroyed&&!res.writableEnded){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}};
    if(origin&&!config.origins.has(origin))return json(403,{error:'This website origin is not allowed.'});
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
    if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
    const url=req.url?.split('?')[0];
    if(req.method==='GET'&&url==='/api/health'){
      if(Date.now()>healthUntil){
        healthPending??=fetch(llamaURL+'/health',{signal:AbortSignal.timeout(2000)}).then(r=>r.ok).catch(()=>false).then(ready=>{healthCache=ready;healthUntil=Date.now()+3000;healthPending=null;return ready;});
        await healthPending;
      }
      return json(healthCache?200:503,{status:healthCache?'ready':'offline',busy,model:'Qwen3-0.6B · Q4_K_M',selfHosted:true});
    }
    if(url!=='/api/chat')return json(404,{error:'Endpoint not found.'});
    if(req.method!=='POST')return json(405,{error:'Use POST.'});
    let ip=req.socket.remoteAddress||'unknown';
    if(config.trustProxy&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)&&isIP(req.headers['x-real-ip']||''))ip=req.headers['x-real-ip'];
    let rate=rates.get(ip);if(!rate||rate.until<Date.now()){
      if(rates.size>=10000&&!rates.has(ip))return json(503,{error:'Server is busy. Please try later.'});
      rate={count:0,until:Date.now()+60000};rates.set(ip,rate);
    }
    if(++rate.count>config.rate){res.setHeader('Retry-After',Math.ceil((rate.until-Date.now())/1000));return json(429,{error:'Too many requests. Wait a minute and try again.'});}
    const controller=new AbortController();let timer,ownsSlot=false,streaming=false;
    res.on('close',()=>controller.abort());
    try{
      const body=await readJSON(req);let messages=validate(body);
      if(busy)throw new ClientError(503,'The model is answering another chat. Please retry shortly.');
      busy=true;ownsSlot=true;
      timer=setTimeout(()=>controller.abort(),config.timeout);
      const post=async(endpoint,data)=>{
        const r=await fetch(llamaURL+endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${config.llamaKey}`},body:JSON.stringify(data),signal:controller.signal});
        if(!r.ok)throw new Error(`Model HTTP ${r.status}`);return r;
      };
      const system={role:'system',content:config.system};let trimmed=0;
      // Count the actual template tokens rather than guessing from character count.
      while(true){
        const {prompt}=await(await post('/apply-template',{messages:[system,...messages],chat_template_kwargs:{enable_thinking:false}})).json();
        if(typeof prompt!=='string')throw new Error('Invalid model template');
        const {tokens}=await(await post('/tokenize',{content:prompt,add_special:true})).json();
        if(!Array.isArray(tokens))throw new Error('Invalid tokenizer response');
        if(tokens.length<=config.context-config.output-96)break;
        if(messages.length<=1)throw new ClientError(400,'This message is too long for the small model. Please shorten it.');
        messages=messages.slice(2);trimmed+=2;
      }
      const upstream=await post('/v1/chat/completions',{
        model:'jenga-mini',messages:[system,...messages],stream:body.stream!==false,
        max_tokens:config.output,temperature:0.7,top_p:0.8,top_k:20,min_p:0,
        chat_template_kwargs:{enable_thinking:false}
      });
      if(body.stream===false){
        const data=await upstream.json();const reply=data.choices?.[0]?.message?.content;
        if(typeof reply!=='string'||!reply.trim())throw new Error('Empty model response');
        return json(200,{reply,trimmedMessages:trimmed,finishReason:data.choices[0].finish_reason});
      }
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','X-Accel-Buffering':'no'});res.flushHeaders();streaming=true;
      const emit=async(data)=>{if(res.destroyed)throw new Error('Disconnected');if(!res.write(`data: ${JSON.stringify(data)}\n\n`))await new Promise((resolve,reject)=>{const drain=()=>{cleanup();resolve();},close=()=>{cleanup();reject(new Error('Disconnected'));},cleanup=()=>{res.off('drain',drain);res.off('close',close);};res.once('drain',drain);res.once('close',close);});};
      await emit({type:'meta',trimmedMessages:trimmed});
      let buffer='',complete=false,chars=0,finishReason=null;
      const decoder=new TextDecoder();
      for await(const chunk of upstream.body){
        buffer+=decoder.decode(chunk,{stream:true});
        if(buffer.length>262144)throw new Error('Invalid model stream');
        let end;
        while((end=buffer.indexOf('\n'))>=0){
          const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);
          if(!line.startsWith('data:'))continue;
          const raw=line.slice(5).trim();
          if(raw==='[DONE]'){complete=true;continue;}
          const data=JSON.parse(raw);if(data.error)throw new Error('Model stream error');
          const choice=data.choices?.[0],delta=choice?.delta?.content;
          if(typeof delta==='string'&&delta){chars+=delta.length;if(chars>65536)throw new Error('Model output limit');await emit({type:'delta',text:delta});}
          if(choice?.finish_reason)finishReason=choice.finish_reason;
        }
      }
      if(!complete||!chars)throw new Error('Incomplete model stream');
      await emit({type:'done',finishReason});res.end();
    }catch(error){
      const message=error instanceof ClientError?error.message:controller.signal.aborted?'Generation timed out or was stopped. Please retry.':'The AI model is unavailable. Check that the server is running, then retry.';
      if(!res.destroyed){if(streaming){res.end(`data: ${JSON.stringify({type:'error',error:message})}\n\n`);}else json(error.status||503,{error:message});}
      if(!(error instanceof ClientError)&&!controller.signal.aborted)console.error('Model request failed:',error.message);
    }finally{clearTimeout(timer);controller.abort();if(ownsSlot)busy=false;}
  });
  server.maxConnections=100;
  server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
  server.on('close',()=>clearInterval(cleaner));return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createAPI();server.listen(config.port,config.host,()=>console.log(`Jenga API: http://${config.host}:${config.port}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
