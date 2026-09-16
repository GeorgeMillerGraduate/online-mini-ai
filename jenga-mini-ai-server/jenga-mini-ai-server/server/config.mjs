import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
if (existsSync(path.join(root,'.env'))) process.loadEnvFile(path.join(root,'.env'));
function integer(name, fallback, min, max) {
  const n=Number(process.env[name] ?? fallback);
  if (!Number.isInteger(n)||n<min||n>max) throw new Error(`Invalid ${name}: expected ${min}–${max}`);
  return n;
}
export const config={
  llamaKey:process.env.LLAMA_API_KEY||randomBytes(32).toString('hex'),
  host:process.env.API_HOST||'127.0.0.1', port:integer('API_PORT',3001,1024,65535),
  llamaPort:integer('LLAMA_PORT',8081,1024,65535),
  origins:new Set((process.env.ALLOWED_ORIGIN||'https://jenga-code.com').split(',').concat((process.env.DEV_ORIGINS??'http://localhost:8000,http://127.0.0.1:8000').split(',')).map(x=>x.trim()).filter(Boolean)),
  trustProxy:process.env.TRUST_LOCAL_PROXY==='true',
  context:integer('CONTEXT_SIZE',4096,1024,32768), output:integer('MAX_OUTPUT_TOKENS',512,32,2048),
  timeout:integer('REQUEST_TIMEOUT_MS',120000,1000,600000),rate:integer('RATE_LIMIT_PER_MINUTE',10,1,1000),
  threads:integer('THREADS',4,1,128), model:path.resolve(root,process.env.MODEL_PATH||'models/Qwen_Qwen3-0.6B-Q4_K_M.gguf'),
  system:process.env.SYSTEM_PROMPT||'You are Jenga Mini AI, a helpful small self-hosted assistant. Be concise and admit uncertainty. You cannot browse, access files, or execute code.'
};
if(config.output+256>=config.context)throw new Error('Context must exceed output by at least 256 tokens.');
if(config.origins.has('*')||config.origins.has('null'))throw new Error('Use explicit HTTP(S) origins.');
export const llamaURL=`http://127.0.0.1:${config.llamaPort}`;
