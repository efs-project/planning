import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createTagEnvironment} from './fixture.mjs';
const report={base:'6cffa376b51f058053cecb7a5268d97083ec94d2',limits:{runtime:24576,initcode:49152,gas:15000000,hardGas:16777216},artifacts:{},sources:{}};
let env,error;
try{
  env=await createTagEnvironment();const e=env.ethers,s=env.tags,coder=e.AbiCoder.defaultAbiCoder();
  report.fixture=Object.fromEntries(Object.entries(s).filter(([,v])=>typeof v!=='function'));
  for(const [name,value] of Object.entries(env.contracts)){
    const code=await env.rpc('eth_getCode',[value.address,'latest']);assert.equal(e.keccak256(code),value.codeHash);
    value.runtimeCode=code;
  }
  for(const [file,names] of [['TagStanceProfile.sol',['TagStanceIndex','TagStanceValidator']],['FilesFinalValidator.sol',['FilesFinalValidator']],
    ['IndexReplaySource.sol',['IndexReplayDecoder']],['FilesScopeState.sol',['FilesScopeState']],['IndexFieldProfile.sol',['IndexFieldProfile']]]){
    for(const name of names){const bytes=await readFile(join(process.env.FOUNDRY_OUT,file,`${name}.json`)),a=JSON.parse(bytes);
      const m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
      assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
      for(const [path,pin] of Object.entries(m.sources)){const b=await readFile(path);assert.equal(e.keccak256(b),pin.keccak256);report.sources[path]={sha256:createHash('sha256').update(b).digest('hex'),keccak256:pin.keccak256};}
      report.artifacts[name]=a;
    }
  }
  report.dependencies=[];
  for(const key of ['replayDecoder','scopeState','fieldProfile']){const address=(await env.call('tagIndex',key))[0];const code=await env.rpc('eth_getCode',[address,'latest']);report.dependencies.push({key,address,code,codeHash:e.keccak256(code)});}
  report.profileBytes=(await env.call('stanceValidator','profileBytes'))[0];report.manifest=(await env.call('tagIndex','manifestHash'))[0];
  const bind=async(subject,c,token,revision,label,who='alice')=>env.transact('ledger','bind',[s.purpose,subject,c,s.tokens[token],revision],label,who);
  await bind(s.fileF,s.conceptC,0,0,'stance/ASSERT-fresh');
  await bind(s.fileG,s.conceptC,0,0,'stance/ASSERT-second');
  await bind(s.orphanH,s.conceptC2,0,0,'stance/same-label-distinct');
  await bind(s.fileF,s.conceptC,0,0,'stance/other-author','bob');
  await bind(s.revision2,s.conceptC,0,0,'stance/revision');
  await bind(s.directoryD,s.conceptC,0,0,'stance/directory');
  await bind(s.fileF,s.conceptC,1,1,'stance/DENY');await bind(s.fileF,s.conceptC,2,2,'stance/SILENT');await bind(s.fileF,s.conceptC,0,3,'stance/ASSERT-again');
  await env.transact('ledger','unbind',[s.purpose,s.fileF,s.conceptC,4],'stance/UNBIND-silent','alice');
  const key=s.inventory(s.principals.alice,s.conceptC);
  assert.equal((await env.call('tagIndex','postingHead',[key]))[0],4n);
  const wrong=await s.publish(env.manifest.types.token,coder.encode(['uint256'],[4]),'control/wrong-token-publish');
  const before=await env.call('ledger','counts');const data=new e.Interface(env.contracts.ledger.abi).encodeFunctionData('bind',[s.purpose,s.orphanH,s.conceptC,wrong,0]);
  const rejected=await env.observe(await env.enqueue('control/wrong-token-bind',{to:env.contracts.ledger.address,data},'alice'));
  assert.equal(rejected.status,'REVERTED');assert.deepEqual(Array.from(await env.call('ledger','counts')),Array.from(before));
  await env.deploy('replayIndex','TagStanceProfile.sol','TagStanceIndex',s.indexArgs);
  const publications=(await env.call('ledger','counts'))[3];
  for(let i=0n;i<publications;i++)await env.transact('replayIndex','replayNextPublication',[],`replay/${i+1n}`);
  assert.equal((await env.call('replayIndex','manifestHash'))[0],report.manifest);
  report.inventory=[];
  for(const principal of Object.values(s.principals))for(const concept of [s.conceptC,s.conceptC2]){
    const key=s.inventory(principal,concept),head=await env.call('tagIndex','postingHead',[key]);assert.deepEqual(Array.from(await env.call('replayIndex','postingHead',[key])),Array.from(head));
    const values=[];for(let i=0n;i<head[0];i++)values.push((await env.call('tagIndex','postingAt',[key,i]))[0]);report.inventory.push({principal,concept,key,head,values});
  }
  report.coverage=await env.call('tagIndex','coverage',[s.family,e.ZeroHash]);assert.equal(report.coverage[0],2n);
  const counts=await env.call('ledger','counts');
  await env.transact('ledger','replaceIndexWhenReady',[[env.contracts.replayIndex.address,env.contracts.tagIndex.address,counts[0],counts[3],report.manifest,env.contracts.replayIndex.codeHash,0]],'replay/checked-cutover');
  report.complete=true;
}catch(e){error=e;report.error=String(e.stack??e);}
finally{
  if(env){report.contracts=env.contracts;report.transactions=env.transactions;report.rawTransactions=await readFile(join(env.dir,'transactions.jsonl'),'utf8');
    report.costs=Object.fromEntries(env.transactions.filter(x=>x.label.startsWith('stance/')||['deploy/stanceValidator','deploy/tagIndex','deploy/finalValidator','replay/checked-cutover'].includes(x.label)).map(x=>[x.label,x.gasUsed]));
    report.chain={dir:env.dir,port:env.port,pid:env.anvilPid,history:env.historyPolicy};report.metrics=env.metrics;await env.close();report.chain.closed=true;}
  const label=process.env.EFS_TAG_EVIDENCE??'paid-final';assert(/^[a-z0-9-]+$/.test(label));
  await writeFile(new URL(`${label}.json.gz`,import.meta.url),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
}
if(error)throw error;console.log(JSON.stringify({complete:report.complete,costs:report.costs,chain:report.chain},null,2));
