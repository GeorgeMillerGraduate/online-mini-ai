import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream,existsSync} from 'node:fs';
import {mkdir,readFile,rename,rm,copyFile,writeFile,readdir,chmod} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'config/downloads.json'),'utf8'));
async function hash(file){const h=createHash('sha256');for await(const c of createReadStream(file))h.update(c);return h.digest('hex');}
async function download(url,destination,expected){
  if(existsSync(destination)&&await hash(destination)===expected){console.log('Verified existing',path.basename(destination));return;}
  const temp=destination+'.part';await rm(temp,{force:true});console.log('Downloading',path.basename(destination));
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(1800000)});
    if(!response.ok)throw new Error(`Download returned HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(temp));
    if(await hash(temp)!==expected)throw new Error('SHA-256 checksum mismatch. Download was not installed.');
    await rename(temp,destination);
  }catch(e){await rm(temp,{force:true});throw e;}
}
export async function findBinary(directory){
  for(const item of await readdir(directory,{withFileTypes:true})){
    const p=path.join(directory,item.name);
    if(item.isFile()&&item.name===(process.platform==='win32'?'llama-server.exe':'llama-server'))return p;
    if(item.isDirectory()){const found=await findBinary(p);if(found)return found;}
  }
}
try{
  if(process.arch!=='x64'||!manifest.runtime[process.platform])throw new Error('Automatic binary installation supports Windows x64 and Linux x64. See README for source builds on other CPUs.');
  await mkdir(path.join(root,'models'),{recursive:true});await mkdir(path.join(root,'runtime'),{recursive:true});
  const runtime=manifest.runtime[process.platform],archive=path.join(root,process.platform==='win32'?'runtime-download.zip':'runtime-download.tar.gz');
  await download(runtime.url,archive,runtime.sha256);
  const dest=path.join(root,'runtime',manifest.llamaTag);await mkdir(dest,{recursive:true});
  // Fixed arguments only. The apostrophe escaping here is for PowerShell literals, not user shell code.
  const quote=s=>"'"+s.replaceAll("'","''")+"'";
  const extraction=process.platform==='win32'?spawnSync('powershell.exe',['-NoProfile','-Command',`Expand-Archive -LiteralPath ${quote(archive)} -DestinationPath ${quote(dest)} -Force`],{stdio:'inherit'}):spawnSync('tar',['--no-same-owner','-xzf',archive,'-C',dest],{stdio:'inherit'});
  if(extraction.error||extraction.status!==0)throw new Error('Archive extraction failed. Install tar on Linux or PowerShell on Windows.');
  const binary=await findBinary(dest);if(!binary)throw new Error('llama-server was not found in the official archive.');
  if(process.platform!=='win32')await chmod(binary,0o755);
  await writeFile(path.join(root,'runtime/location.json'),JSON.stringify({binary:path.relative(root,binary)},null,2));
  const check=spawnSync(binary,['--version'],{stdio:'inherit'});
  if(check.error||check.status!==0)throw new Error('The binary cannot run on this system. See README for missing libraries / source build.');
  await download(manifest.model.url,path.join(root,'models',manifest.model.name),manifest.model.sha256);
  if(!existsSync(path.join(root,'.env')))await copyFile(path.join(root,'.env.example'),path.join(root,'.env'));
  await rm(archive,{force:true});console.log('Installation complete. Run npm start (or start-windows.bat).');
}catch(e){console.error('Installation failed:',e.message);process.exitCode=1;}
