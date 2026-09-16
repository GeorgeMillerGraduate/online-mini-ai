// Local preview only; do not deploy this helper as a public server.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./',import.meta.url));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root)||!types[path.extname(file)]){res.writeHead(404);return res.end('Not found');}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(8000,'127.0.0.1',()=>console.log('Open http://127.0.0.1:8000 — Ctrl+C to stop'));
