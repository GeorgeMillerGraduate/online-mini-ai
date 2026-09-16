'use strict';
(() => {
  const $=id=>document.getElementById(id),storageKey='jenga-mini-ai-v1';
  let chats=[],activeId,controller=null,generating=false,pendingView=null,renderScheduled=false;
  const isMobile=matchMedia('(max-width:768px)').matches;
  if(isMobile)$('historyPanel').open=false;
  let api;
  try{api=new URL(window.JENGA_AI_CONFIG.API_BASE_URL);if(!['http:','https:'].includes(api.protocol))throw Error();api=api.href.replace(/\/$/,'');}catch{api=null;}
  function notice(text){$('notice').textContent=text;$('notice').hidden=!text;}
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved&&Array.isArray(saved.chats)){
      chats=saved.chats.filter(c=>typeof c.id==='string'&&Array.isArray(c.messages)).slice(0,20).map(c=>({...c,messages:c.messages.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-100).map(m=>({...m,content:m.content.slice(0,65536),status:m.status==='generating'?'stopped':m.status}))}));activeId=saved.activeId;
    }
  }catch{notice('Browser storage is unavailable. This chat will last until you close the page.');}
  function current(){return chats.find(c=>c.id===activeId);}
  function save(){try{localStorage.setItem(storageKey,JSON.stringify({chats,activeId}));}catch{notice('Could not save chats on this device. You can still chat in this tab.');}}
  function title(c){return c.messages.find(m=>m.role==='user')?.content.slice(0,55)||'New conversation';}
  function list(){
    $('chatList').replaceChildren();
    for(const c of chats){const b=document.createElement('button');b.type='button';b.textContent=title(c);b.title=title(c);b.className=c.id===activeId?'selected':'';b.setAttribute('aria-pressed',String(c.id===activeId));b.disabled=generating;b.addEventListener('click',()=>{activeId=c.id;save();render();if(isMobile)$('historyPanel').open=false;});$('chatList').append(b);}
  }
  function newChat(){if(generating)return;const existing=chats.find(c=>!c.messages.length);if(existing)activeId=existing.id;else{const c={id:crypto.randomUUID(),messages:[]};chats.unshift(c);chats=chats.slice(0,20);activeId=c.id;}save();render();$('composer').focus();}
  function messageView(m){
    const article=document.createElement('article');article.className='message '+m.role;
    const header=document.createElement('header'),avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=m.role==='user'?'Y':'J';avatar.setAttribute('aria-hidden','true');header.append(avatar,document.createTextNode(m.role==='user'?'You':'Jenga Mini AI'));
    const body=document.createElement('div');body.className='body';if(m.role==='user')body.textContent=m.content;else body.append(JengaMarkdown.render(m.content||'…'));
    article.append(header,body);
    if(m.status==='stopped'||m.status==='error'||m.finishReason==='length'){const note=document.createElement('div');note.className='message-note';note.textContent=m.status==='stopped'?'Generation stopped.':m.status==='error'?'Reply interrupted. You can retry.':'Reply reached the length limit. Ask a follow-up to continue.';article.append(note);}
    return {article,body};
  }
  function render(){
    const messages=current()?.messages||[];$('welcome').hidden=messages.length>0;$('messages').replaceChildren();for(const m of messages)$('messages').append(messageView(m).article);list();$('retry').hidden=generating||!messages.some(m=>m.role==='user');$('clearChat').disabled=generating||!messages.length;$('transcript').scrollTop=$('transcript').scrollHeight;
  }
  function setBusy(value){generating=value;$('send').hidden=value;$('stop').hidden=!value;$('composer').disabled=value;$('newChat').disabled=value;$('clearChat').disabled=value;$('clearAll').disabled=value;$('retry').hidden=value;$('generationStatus').textContent=value?'Generating…':'Ready for your question';list();}
  function history(){
    const all=current().messages;let start=all.length-1,chars=all[start].content.length;
    // Only complete prior turns enter the small context. The server also measures tokens.
    while(start>=2&&all[start-1].role==='assistant'&&all[start-2].role==='user'&&all[start-1].status==='complete'&&all.length-(start-2)<=25){const extra=all[start-1].content.length+all[start-2].content.length;if(chars+extra>14000)break;chars+=extra;start-=2;}
    return all.slice(start).map(({role,content})=>({role,content}));
  }
  function paint(m){
    if(renderScheduled)return;renderScheduled=true;
    requestAnimationFrame(()=>{renderScheduled=false;if(!pendingView)return;const t=$('transcript'),nearBottom=t.scrollHeight-t.scrollTop-t.clientHeight<130;pendingView.body.replaceChildren(JengaMarkdown.render(m.content||'…'));if(nearBottom)t.scrollTop=t.scrollHeight;});
  }
  async function generate(){
    if(generating)return;
    if(!api){notice('Set a valid API_BASE_URL in js/config.js first.');return;}
    if(location.protocol==='https:'&&api.startsWith('http:')){notice('This page uses HTTPS. Set API_BASE_URL to your HTTPS AI server address in js/config.js.');return;}
    const messages=history(),reply={role:'assistant',content:'',status:'generating'};
    current().messages.push(reply);notice('');setBusy(true);render();pendingView=messageView(reply);$('messages').lastElementChild.replaceWith(pendingView.article);
    controller=new AbortController();const timeout=setTimeout(()=>controller?.abort('timeout'),135000);let done=false;
    try{
      const response=await fetch(api+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,stream:true}),signal:controller.signal});
      if(!response.ok){let data;try{data=await response.json();}catch{}throw Error(data?.error||`Server returned ${response.status}.`);}
      if(!response.headers.get('content-type')?.includes('text/event-stream'))throw Error('The server returned an unexpected response. Check the API URL.');
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      while(true){const {value,done:ended}=await reader.read();if(ended)break;buffer+=decoder.decode(value,{stream:true});if(buffer.length>131072)throw Error('Invalid response stream.');let cut;
        while((cut=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,cut).trim();buffer=buffer.slice(cut+1);if(!line.startsWith('data:'))continue;const event=JSON.parse(line.slice(5));
          if(event.type==='delta'){reply.content+=event.text;if(reply.content.length>65536)throw Error('Response is too long.');paint(reply);}
          if(event.type==='meta'&&event.trimmedMessages)notice('Earlier messages were left out to fit the small model’s memory.');
          if(event.type==='error')throw Error(event.error);
          if(event.type==='done'){done=true;reply.finishReason=event.finishReason;}
        }
      }
      if(!done||!reply.content.trim())throw Error('The response ended early. Please retry.');reply.status='complete';
    }catch(error){
      if(controller.signal.aborted){reply.status='stopped';notice(controller.signal.reason==='timeout'?'The server took too long. Please retry.':'Generation stopped. You can retry the response.');}
      else{reply.status='error';notice(error instanceof TypeError?'Cannot reach the AI server. Check its address, HTTPS and allowed origins, then retry.':error.message);}
    }finally{clearTimeout(timeout);controller.abort();controller=null;pendingView=null;setBusy(false);save();render();$('composer').focus();checkHealth();}
  }
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();const content=$('composer').value.trim();if(!content||generating)return;current().messages.push({role:'user',content});$('composer').value='';$('composer').style.height='';save();render();generate();});
  $('composer').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('chatForm').requestSubmit();}});
  $('composer').addEventListener('input',()=>{$('composer').style.height='auto';$('composer').style.height=Math.min($('composer').scrollHeight,160)+'px';});
  $('stop').addEventListener('click',()=>controller?.abort('user'));
  $('retry').addEventListener('click',()=>{if(generating)return;while(current().messages.at(-1)?.role==='assistant')current().messages.pop();if(current().messages.length)generate();});
  $('newChat').addEventListener('click',newChat);
  $('clearChat').addEventListener('click',()=>{if(generating||!confirm('Clear this conversation?'))return;current().messages=[];notice('');save();render();});
  $('clearAll').addEventListener('click',()=>{if(generating||!confirm('Delete all chats saved in this browser?'))return;chats=[];newChat();notice('Saved chats deleted.');});
  document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{$('composer').value=b.dataset.prompt;$('composer').focus();}));
  $('menuButton').addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuButton').setAttribute('aria-expanded',String(open));});
  async function checkHealth(){
    const label=$('connection');
    try{
      if(!api)throw Error();if(location.protocol==='https:'&&api.startsWith('http:'))throw Error();
      const r=await fetch(api+'/api/health',{signal:AbortSignal.timeout(4000)}),data=await r.json();if(!r.ok||data.status!=='ready')throw Error();label.textContent=data.busy?'Model busy':'Connected';label.dataset.state='ready';
    }catch{label.textContent='Offline · reconnect';label.dataset.state='offline';}
  }
  $('connection').addEventListener('click',checkHealth);
  if(!current())newChat();else render();checkHealth();
})();
