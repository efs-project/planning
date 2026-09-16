// Generated evidence only: freeze exact stage source/artifacts before a fit change.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Interface}=require(process.env.EFS_ETHERS_PATH);
const stage=process.argv[2];if(!/^[a-z0-9-]+$/.test(stage??''))throw Error('stage required');
const root=path.resolve(import.meta.dirname,'..');
const out=process.env.FOUNDRY_OUT;
const files=['test/TagStanceProfile.sol','test/TagStanceProfile.t.sol','test/FilesCarrierProfile.sol','test/FilesLiveIndex.sol','test/LiveFilesProfile.sol','foundry.toml'];
const sources=Object.fromEntries(files.map(p=>{const text=fs.readFileSync(path.join(root,p),'utf8');return [p,{text,sha256:crypto.createHash('sha256').update(text).digest('hex')}];}));
const zero='0x'+'00'.repeat(32),addr='0x'+'11'.repeat(20);
const artifacts={};
for(const name of ['TagStanceIndex','TagStanceValidator']){
  const p=path.join(out,'TagStanceProfile.sol',`${name}.json`);if(!fs.existsSync(p))continue;
  const a=JSON.parse(fs.readFileSync(p));const iface=new Interface(a.abi);
  const dummy=type=>type.baseType==='array'?Array.from({length:type.arrayLength},()=>dummy(type.arrayChildren)):type.type==='address'?addr:type.type==='bytes'?'0x'+'01'.repeat(295):zero;
  const args=iface.fragments.find(f=>f.type==='constructor').inputs.map(dummy);
  const encoded=iface.encodeDeploy(args);
  artifacts[name]={artifact:a,constructorShapeArgs:args,constructorShapeEncoding:encoded,runtimeBytes:(a.deployedBytecode.object.length-2)/2,
    creationBytes:(a.bytecode.object.length-2)/2,constructorBytes:(encoded.length-2)/2,initcodeBytes:(a.bytecode.object.length+encoded.length-4)/2};
}
const packet={stage,base:'6cffa376b51f058053cecb7a5268d97083ec94d2',note:'Shape-only constructor args, not a deployment; descriptor body actual length checked by fixture.',sources,artifacts};
const output=path.join(import.meta.dirname,`${stage}-snapshot.json.gz`);fs.writeFileSync(output,gzipSync(JSON.stringify(packet,null,2)));
console.log(JSON.stringify(Object.fromEntries(Object.entries(artifacts).map(([n,a])=>[n,{runtime:a.runtimeBytes,creation:a.creationBytes,args:a.constructorBytes,initcode:a.initcodeBytes}]))));
