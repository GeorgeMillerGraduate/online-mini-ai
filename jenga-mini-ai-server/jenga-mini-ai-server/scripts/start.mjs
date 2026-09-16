import {readFile,access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {root,config,llamaURL} from '../server/config.mjs';
import {createAPI} from '../server/api.mjs';
let child,api,stopping=false;
async function stop(code=0){
  if(stopping)return;stopping=true;
  api?.close();api?.closeAllConnections();
  if(child&&child.exitCode===null){child.kill('SIGTERM');setTimeout(()=>{if(child.exitCode===null)child.kill('SIGKILL');},3000).unref();}
  process.exitCode=code;
}
try{
  const location=JSON.parse(await readFile(path.join(root,'runtime/location.json'),'utf8'));
  const binary=path.resolve(root,location.binary);await access(binary);await access(config.model);
  // Never attach to an unrelated model process already using this port.
  const net=await import('node:net');const probe=net.createServer();
  await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(config.llamaPort,'127.0.0.1',()=>probe.close(resolve));});
  child=spawn(binary,['--model',config.model,'--host','127.0.0.1','--port',String(config.llamaPort),'--ctx-size',String(config.context),'--parallel','1','--threads',String(config.threads),'--n-gpu-layers','0','--jinja','--alias','jenga-mini','--no-webui','--cors-origins','http://internal.invalid','--no-cors-credentials'],{stdio:'inherit',cwd:path.dirname(binary),env:{...process.env,LLAMA_API_KEY:config.llamaKey}});
  child.on('error',e=>{console.error('Could not launch model:',e.message);stop(1);});
  child.on('exit',code=>{if(!stopping){console.error('Model process exited:',code);stop(1);}});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
  let ready=false;
  for(let i=0;i<120&&!stopping;i++){
    try{ready=(await fetch(llamaURL+'/health',{signal:AbortSignal.timeout(1000)})).ok;}catch{}
    if(ready)break;await new Promise(r=>setTimeout(r,1000));
  }
  if(!ready)throw new Error('Model did not become ready within two minutes.');
  api=createAPI();await new Promise((resolve,reject)=>{api.once('error',reject);api.listen(config.port,config.host,resolve);});
  console.log(`\nJenga Mini AI ready: http://${config.host}:${config.port}/api/health\nCtrl+C stops both services.\n`);
}catch(e){console.error('Startup failed:',e.message,'\nRun the installer first; see README for troubleshooting.');await stop(1);}
