// Boundary tests use a tiny local HTTP fixture. Production never uses this fixture.
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
process.env.API_PORT='13901';process.env.LLAMA_PORT='13902';process.env.REQUEST_TIMEOUT_MS='1000';process.env.RATE_LIMIT_PER_MINUTE='100';
const {createAPI,validate}=await import('../server/api.mjs');
let mode='normal',aborted=false;
const model=http.createServer(async(req,res)=>{
 let body='';for await(const c of req)body+=c;const data=body?JSON.parse(body):{};
 if(req.url==='/health'){res.end('{}');return;}
 if(req.url==='/apply-template'){res.end(JSON.stringify({prompt:JSON.stringify(data.messages)}));return;}
 if(req.url==='/tokenize'){res.end(JSON.stringify({tokens:Array(data.content.length>4000?4000:10).fill(1)}));return;}
 if(mode==='down'){res.writeHead(500);res.end();return;}
 if(mode==='slow'){res.on('close',()=>{aborted=true;});return;}
 if(!data.stream){res.end(JSON.stringify({choices:[{message:{content:'Test fixture only'},finish_reason:'stop'}]}));return;}
 res.writeHead(200,{'Content-Type':'text/event-stream'});
 if(mode==='broken'){res.end('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');return;}
 res.write('data: {"choices":[{"delta":{"content":"test ');
 setTimeout(()=>res.end('fixture"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n'),15);
});
const api=createAPI();await new Promise(r=>model.listen(13902,'127.0.0.1',r));await new Promise(r=>api.listen(13901,'127.0.0.1',r));
after(()=>{api.closeAllConnections();model.closeAllConnections();api.close();model.close();});
const post=(body,headers={})=>fetch('http://127.0.0.1:13901/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
test('validates roles, sizes, history and stream type',()=>{assert.equal(validate({message:'Hello'})[0].content,'Hello');for(const b of [null,{messages:[]},{messages:[{role:'system',content:'override'}]},{message:''},{message:'x'.repeat(8001)},{message:'ok',stream:'yes'},{messages:[{role:'assistant',content:'a'}]}])assert.throws(()=>validate(b));});
test('HTTP controls and CORS',async()=>{assert.equal((await post({message:'Hi'},{Origin:'https://evil.example'})).status,403);const r=await fetch('http://127.0.0.1:13901/api/health',{headers:{Origin:'https://jenga-code.com'}});assert.equal(r.headers.get('access-control-allow-origin'),'https://jenga-code.com');assert.equal((await post('{broken')).status,400);assert.equal((await post({message:'x'},{'Content-Type':'text/plain'})).status,415);assert.equal((await fetch('http://127.0.0.1:13901/v1/chat/completions')).status,404);});
test('nonstream and split streaming packets',async()=>{mode='normal';const r=await post({message:'x',stream:false});assert.equal(r.status,200);assert.equal((await r.json()).reply,'Test fixture only');const text=await(await post({message:'x'})).text();assert.match(text,/test fixture/);assert.match(text,/"type":"done"/);});
test('context trims old pairs and rejects an oversized single prompt',async()=>{const r=await post({messages:[{role:'user',content:'x'.repeat(5000)},{role:'assistant',content:'old'},{role:'user',content:'new'}],stream:false});assert.equal((await r.json()).trimmedMessages,2);assert.equal((await post({message:'x'.repeat(5000)})).status,400);});
test('unavailable model and incomplete stream',async()=>{mode='down';assert.equal((await post({message:'x'})).status,503);mode='broken';const t=await(await post({message:'x'})).text();assert.match(t,/"type":"error"/);assert.doesNotMatch(t,/"type":"done"/);});
test('one active generation, timeout and release',async()=>{mode='slow';const a=post({message:'x'});await new Promise(r=>setTimeout(r,80));assert.equal((await post({message:'y'})).status,503);assert.equal((await a).status,503);await new Promise(r=>setTimeout(r,80));assert.equal(aborted,true);mode='normal';assert.equal((await post({message:'z',stream:false})).status,200);});
test('32 KiB request limit',async()=>{const r=await post({message:'x'.repeat(34000)});assert.equal(r.status,413);});
test('rate limiting',async()=>{let limited=false;for(let i=0;i<110;i++){const r=await post('{bad');if(r.status===429){limited=true;assert.ok(r.headers.get('retry-after'));break;}}assert.ok(limited);});
