import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const label=process.argv[2];if(!/^[a-z0-9-]+$/.test(label))throw Error('explicit snapshot label required');
const names=process.argv.slice(3);const report={base:'12efe4b52c9ebbb637407c02cb25b633d576fb65',artifacts:{},sources:{},limits:{runtime:24576,initcode:49152,gas:15000000}};
for(const name of names){
  const a=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'TagStanceReader.sol',`${name}.json`)));
  report.artifacts[name]=a;
  const m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  for(const path of Object.keys(m.sources)){
    const bytes=await readFile(path);report.sources[path]={content:bytes.toString(),sha256:createHash('sha256').update(bytes).digest('hex'),keccak256:m.sources[path].keccak256};
  }
  console.log(name,'runtime',a.deployedBytecode.object.replace(/^0x/,'').length/2,'creation',a.bytecode.object.replace(/^0x/,'').length/2);
}
await writeFile(new URL(`${label}.json.gz`,import.meta.url),gzipSync(JSON.stringify(report)));
