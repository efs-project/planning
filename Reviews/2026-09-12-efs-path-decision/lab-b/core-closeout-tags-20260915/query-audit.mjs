// Source-off audit: no source RPC, original index or browser SDK token labels.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadEthers} from '../script/compact-environment.mjs';
import {rebuildArchive} from './query-archive.mjs';
globalThis.fetch=()=>{throw Error('SOURCE_RPC_DISABLED');};
export function auditPacket(packet,e){
const abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
assert(packet.complete&&!packet.error&&packet.chain.closed&&(!packet.matchedSigned||packet.matchedSigned.chain.closed));
const hash=(t,v)=>e.keccak256(abi.encode(t,v));
const txRows=p=>p.rawTransactions.trim().split('\n').map(JSON.parse);
const raw=txRows(packet),twinRaw=packet.matchedSigned?txRows(packet.matchedSigned):[],sizes={},authorities=[];
const address=(a,b)=>assert.equal(e.getAddress(a),e.getAddress(b));
const events=(row,iface,emitter)=>row.receipt.logs.filter(l=>l.address.toLowerCase()===emitter.toLowerCase()).map(l=>iface.parseLog(l)).filter(Boolean);
const unique=(items,why)=>{assert.equal(items.length,1,why);return items[0];};
function physical(p,rows){
  assert.equal(new Set(rows.map(r=>r.transactionHash)).size,rows.length);
  for(const row of rows){
    const tx=e.Transaction.from(row.rawTransaction);assert.equal(tx.hash,row.transactionHash);assert.equal(tx.hash,row.receipt.transactionHash);address(tx.from,row.receipt.from);
    assert.equal(tx.to?.toLowerCase()??null,row.receipt.to?.toLowerCase()??null);assert.equal(tx.gasLimit,15000000n);assert(BigInt(row.gasUsed)<=15000000n);
    assert.equal(BigInt(row.gasUsed),BigInt(row.receipt.gasUsed));assert.equal(row.status,BigInt(row.receipt.status)===1n?'SUCCESS':'REVERTED');
    assert.equal(row.blockHash,row.receipt.blockHash);assert.equal(BigInt(row.blockNumber),BigInt(row.receipt.blockNumber));
    for(const log of row.receipt.logs){assert.equal(log.transactionHash,tx.hash);assert.equal(log.blockHash,row.receipt.blockHash);assert.equal(BigInt(log.blockNumber),BigInt(row.receipt.blockNumber));assert.equal(log.transactionIndex,row.receipt.transactionIndex);assert.equal(log.removed,false);}
    if(row.status==='REVERTED')assert.equal(row.receipt.logs.length,0);
  }
  for(const [key,c] of Object.entries(p.contracts)){
    assert(c.runtimeCode,'every deployment retains its runtime, including late consumers');assert.equal(e.keccak256(c.runtimeCode),c.codeHash);
    const row=rows.find(r=>r.transactionHash===c.transactionHash),tx=e.Transaction.from(row.rawTransaction);assert.equal(row.status,'SUCCESS');
    assert.equal(e.getCreateAddress({from:tx.from,nonce:tx.nonce}),e.getAddress(c.address));assert.equal(e.getBytes(tx.data).length,c.initcodeBytes);assert.equal(e.getBytes(c.runtimeCode).length,c.runtimeBytes);
    assert(c.initcodeBytes<=49152&&c.runtimeBytes<=24576);
    const name=key==='tagIndex'?'TagStanceIndex':key==='stanceValidator'?'TagStanceValidator':key==='finalValidator'?'FilesFinalValidator':key==='tagLens'?'TagStanceLens':key==='tagReader'?'TagStanceReader':/^query\d+$/.test(key)?'TagStanceQueryAccumulator':null;
    if(name){
      const artifact=packet.artifacts[name];assert.equal(tx.data,artifact.bytecode.object+new e.Interface(artifact.abi).encodeDeploy(c.constructorArgs).slice(2));
      const expected=e.getBytes(artifact.deployedBytecode.object),actual=e.getBytes(c.runtimeCode),mutable=new Set();
      for(const refs of Object.values(artifact.deployedBytecode.immutableReferences??{}))for(const r of refs)for(let i=r.start;i<r.start+r.length;i++)mutable.add(i);
      assert.equal(expected.length,actual.length);for(let i=0;i<actual.length;i++)if(!mutable.has(i))assert.equal(actual[i],expected[i]);
      sizes[key]={runtime:c.runtimeBytes,actualInitcode:c.initcodeBytes,gas:row.gasUsed,codeHash:c.codeHash};
    }
  }
  for(const d of p.dependencies)assert.equal(e.keccak256(d.code),d.hash);
  for(const s of Object.values(p.archive.readSets)){assert.equal(s.code,'0x00'+s.raw.slice(2));assert.equal(e.keccak256(s.code),s.codeHash);}
}
function authority(p,rows){
  const a=p.archive,iface=new e.Interface(p.contracts.ledger.abi),actionsType=iface.getFunction('execute').inputs[0],readType=iface.getFunction('readSetHash').inputs[0];
  const fields=['realmId:bytes32','realmOrigin:bytes32','executionSet:bytes32','author:address','nonce:uint64','deadline:uint64','acceptanceProfile:bytes32','indexObligations:bytes32','readSetHash:bytes32','actionsHash:bytes32'].map(x=>{const [name,type]=x.split(':');return {name,type};});
  for(const [pub,ev] of Object.entries(a.evidence)){
    const row=unique(rows.filter(r=>r.status==='SUCCESS'&&events(r,iface,p.contracts.ledger.address).some(x=>x.name==='Published'&&String(x.args.publication)===pub)),'one Ledger receipt links each publication');
    const tx=e.Transaction.from(row.rawTransaction),context=a.contexts[pub],leaves=a.admissions.filter(f=>f.publication===pub),actions=[];
    address(tx.to,p.contracts.ledger.address);
    const logs=events(row,iface,p.contracts.ledger.address),published=unique(logs.filter(x=>x.name==='Published'),'one Published event').args;
    assert.equal(String(published.publication),pub);address(published.author,ev[0]);assert.equal(published.proofKind,BigInt(ev[1]));
    assert.equal(published.firstAdmission,BigInt(ev[4]));assert.equal(published.leafCount,BigInt(ev[3]));
    assert.equal(leaves.length,Number(ev[3]));assert.equal(String(leaves[0].at),String(ev[4]));
    for(let i=0;i<leaves.length;i++){
      const f=leaves[i];assert.equal(f.leaf,i);assert.equal(BigInt(f.at),BigInt(ev[4])+BigInt(i));
      const action={kind:f.kind,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
      if(f.kind===1){action.typeId=f.b;action.bodyHashOrRecordId=f.target;}
      else if(f.kind===2){action.typeId=a.records[f.target].type;action.bodyHashOrRecordId=f.target;}
      else if(f.kind===3||f.kind===4){const c=a.cells[f.ordinal];action.purpose=c.p;action.subject=c.s;action.role=c.c;action.expectedRevision=f.expected;if(f.kind===3)action.target=f.target;}
      else if(f.kind===5)action.salt=f.target;else assert.fail('unsupported archive action');actions.push(action);
    }
    const actionsHash=hash([actionsType],[actions]);assert.equal(actionsHash,ev[12]);assert.equal(context.principalId,e.zeroPadValue(e.getAddress(ev[0]),32));
    const decoded=iface.parseTransaction({data:tx.data});
    assert(decoded);assert.equal(iface.encodeFunctionData(decoded.fragment,decoded.args),tx.data,'canonical calldata');
    assert.equal(Number(context.principalKind),1);assert.equal(Number(context.authorizationProfile),Number(ev[1]));
    let suppliedActions,bodies;
    if(Number(ev[1])===1){
      address(tx.from,ev[0]);const blank={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z},v=decoded.args;
      switch(decoded.name){
        case 'publish':suppliedActions=[{...blank,kind:1,typeId:v[0],bodyHashOrRecordId:e.keccak256(v[1])}];bodies=[v[1]];break;
        case 'create':suppliedActions=[{...blank,kind:5,salt:v[0]}];bodies=['0x'];break;
        case 'bind':suppliedActions=[{...blank,kind:3,purpose:v[0],subject:v[1],role:v[2],target:v[3],expectedRevision:v[4]}];bodies=['0x'];break;
        case 'unbind':suppliedActions=[{...blank,kind:4,purpose:v[0],subject:v[1],role:v[2],expectedRevision:v[3]}];bodies=['0x'];break;
        case 'execute':case 'executeGuarded':suppliedActions=v[0];bodies=v[1];assert.equal(v[2],BigInt(ev[7]));break;
        default:assert.fail(`unsupported native entry point ${decoded.name}`);
      }
      assert.equal(Number(context.intentFormat),decoded.name==='executeGuarded'?2:1);
      if(decoded.name==='executeGuarded')assert.equal(v[3],context.executionSet);
    }
    else{
      assert.equal(Number(ev[1]),2,'only retained ECDSA signed profile supported');assert.equal(Number(context.intentFormat),2);
      assert.equal(decoded.name,'executeGuardedSigned');assert.equal(hash([actionsType],[decoded.args[1]]),actionsHash);
      suppliedActions=decoded.args[1];bodies=decoded.args[2];
      const intent=Object.fromEntries(iface.getFunction('executeGuardedSigned').inputs[0].components.map((c,i)=>[c.name,decoded.args[0][i]]));
      const digest=e.TypedDataEncoder.hash({name:'EFS2-RoadB-Lab',version:'2'},{IntentV2:fields},{...intent,actionsHash});
      assert.equal(digest,context.intentDigest);assert.equal(e.recoverAddress(digest,decoded.args[4]),e.getAddress(ev[0]));
      assert.equal(e.Signature.from({r:ev[5],s:ev[6],v:Number(ev[2])}).serialized,decoded.args[4]);
      assert.equal(intent.realmId,a.realm);assert.equal(intent.realmOrigin,a.origin);assert.equal(intent.executionSet,context.executionSet);
      for(const [key,index] of [['author',0],['nonce',7],['deadline',8],['acceptanceProfile',10],['indexObligations',11]])assert.equal(String(intent[key]).toLowerCase(),String(ev[index]).toLowerCase());
    }
    assert.equal(abi.encode([actionsType],[suppliedActions]),abi.encode([actionsType],[actions]),'raw calldata actions equal retained admissions');
    assert.equal(bodies.length,actions.length);
    const admitted=logs.filter(x=>x.name==='Admitted');assert.equal(admitted.length,actions.length);
    for(let i=0;i<actions.length;i++){
      const x=actions[i],f=leaves[i],event=admitted[i].args;assert.equal(event.author,context.principalId);assert.equal(event.admission,BigInt(f.at));
      let scope,record=Z;
      if(x.kind===1){assert.equal(e.keccak256(bodies[i]),x.bodyHashOrRecordId);record=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),x.typeId,x.bodyHashOrRecordId]);assert.equal(a.records[record].body,bodies[i]);scope=x.typeId;}
      else if(x.kind===2){scope=x.typeId;record=x.bodyHashOrRecordId;}
      else if(x.kind===3||x.kind===4){scope=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/vk/binding-scope/1'),context.principalId,x.purpose,x.subject]);if(x.kind===3)record=x.target;}
      else if(x.kind===5)scope=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),context.principalId,x.salt]);
      if(x.kind!==1&&x.kind!==2)assert.equal(bodies[i],'0x');assert.equal(event.scope,scope);assert.equal(event.recordId,record);
    }
    assert.equal(published.publicationId,Number(context.intentFormat)===2?hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),context.principalId,context.intentDigest]):hash(['address','uint64','bytes32'],[ev[0],ev[7],actionsHash]));
    if(Number(context.intentFormat)===2){
      const checked=unique(logs.filter(x=>x.name==='ReadSetChecked'),'one guarded readset event').args;
      assert.equal(String(checked.publication),pub);assert.equal(checked.readSetHash,context.readSetHash);
      const saved=a.readSets[context.readSetHash];assert(saved);const reads=abi.decode([readType],saved.raw)[0];
      assert.equal(hash(['bytes32',readType],[e.id('efs.lab.read-set/2:ordered-first-binding'),reads]),context.readSetHash);
      const supplied=decoded.name==='executeGuardedSigned'?decoded.args[3]:decoded.args[4];assert.equal(abi.encode([readType],[supplied]),saved.raw);
      const intent={realmId:a.realm,realmOrigin:a.origin,executionSet:context.executionSet,author:ev[0],nonce:ev[7],deadline:ev[8],acceptanceProfile:ev[10],indexObligations:ev[11],readSetHash:context.readSetHash};
      assert.equal(e.TypedDataEncoder.hash({name:'EFS2-RoadB-Lab',version:'2'},{IntentV2:fields},{...intent,actionsHash}),context.intentDigest);
    }else assert.equal(logs.filter(x=>x.name==='ReadSetChecked').length,0);
    authorities.push({publication:pub,author:context.principalId,proof:Number(ev[1]),actions:leaves.length,transaction:row.transactionHash});
  }
}
physical(packet,raw);authority(packet,raw);if(packet.matchedSigned){physical(packet.matchedSigned,twinRaw);authority(packet.matchedSigned,twinRaw);}
const rebuilt=rebuildArchive(packet.archive,e);assert.equal(rebuilt.status,'COMPLETE');
assert.equal(rebuildArchive({...packet.archive,profileBytes:null},e).status,'PARTIAL');
const missing=structuredClone(packet.archive);delete missing.types[packet.fixture.configuration[1][4]];assert.equal(rebuildArchive(missing,e).status,'PARTIAL');
const opaque=structuredClone(packet.archive);opaque.profileBytes='0x'+'00'.repeat(32)+opaque.profileBytes.slice(66);opaque.profileHash=e.keccak256(opaque.profileBytes);
assert.equal(rebuildArchive(opaque,e).status,'PARTIAL');
const qType='tuple(uint8 direction,uint8 mode,bytes32 exact,bool diagnosticHead)',bType='tuple(uint64 admission,uint64 generation,uint64 epoch,bytes32 execution,bytes32 realm,bytes32 profile)';
for(const q of packet.queries){
  const independent=rebuilt.query(q.principals,q.query,q.basis[0]);assert.equal(independent.rawTotal,q.oracle.rawTotal);assert.equal(independent.pin,q.oracle.pin);
  assert.equal(abi.encode([packet.rowAbi],[independent.rows]),abi.encode([packet.rowAbi],[q.rows]));
  const c=packet.contracts[q.key],deployment=e.Transaction.from(raw.find(r=>r.transactionHash===c.transactionHash).rawTransaction);
  const consumer=new e.Interface(c.abi),constructorTypes=consumer.deploy.inputs;
  assert.equal(abi.encode(constructorTypes,c.constructorArgs),abi.encode(constructorTypes,[packet.contracts.tagReader.address,packet.contracts.tagReader.codeHash,q.principals,q.query,q.basis,q.session]));
  assert.equal(q.basis[5],packet.profileHash);assert.equal(q.basis[4],packet.archive.realm);
  let commitment=hash(['string','address','address','bytes32','address','bytes32','bytes32[]',qType,bType],['efs.tag-owned-origin/1',c.address,deployment.from,q.session,packet.contracts.tagReader.address,packet.contracts.tagReader.codeHash,q.principals,q.query,q.basis]);
  commitment=hash(['bytes32','bytes32','uint64'],[commitment,independent.pin,independent.rawTotal]);
  const rowType=e.ParamType.from(packet.rowAbi).arrayChildren,paidRows=[];let scanned=0n,present=0n,unknown=0n,complete=false;
  const calls=raw.filter(r=>e.Transaction.from(r.rawTransaction).to?.toLowerCase()===c.address.toLowerCase());assert.deepEqual(calls.map(r=>r.transactionHash),q.steps.map(s=>s.hash));
  for(const step of q.steps){
    assert(!complete,'no steps after completion');const row=unique(calls.filter(r=>r.transactionHash===step.hash),'one paid step'),tx=e.Transaction.from(row.rawTransaction);
    address(tx.from,deployment.from);address(tx.to,c.address);assert.equal(step.status,row.status);assert.equal(String(step.gas),row.gasUsed);assert.equal(step.label,row.label);
    assert.equal(step.profileHash,packet.profileHash);assert.equal(step.readerHash,packet.contracts.tagReader.codeHash);assert.equal(step.lensHash,packet.contracts.tagLens.codeHash);
    assert.equal(tx.data,consumer.encodeFunctionData('step',[q.session,step.budget]),'owned step calldata');
    if(row.status==='REVERTED'){assert(step.budget<1||step.budget>256,'supported retained query refusal reason');assert(packet.refusals.some(r=>r.hash===step.hash));continue;}
    const logs=events(row,consumer,c.address);assert.equal(row.receipt.logs.length,3);assert.equal(logs.length,3);
    const rowsEvent=unique(logs.filter(x=>x.name==='Rows'),'one Rows event').args,progress=unique(logs.filter(x=>x.name==='Progress'),'one Progress event').args,work=unique(logs.filter(x=>x.name==='Work'),'one Work event').args;
    assert.equal(rowsEvent.session,q.session);const rows=abi.decode([packet.rowAbi],rowsEvent.encodedRows)[0];
    assert.equal(scanned,BigInt(step.scannedBefore));const remaining=BigInt(independent.rawTotal)-scanned;scanned+=remaining<BigInt(step.budget)?remaining:BigInt(step.budget);
    assert.equal(scanned,BigInt(step.scannedAfter));
    for(const r of rows){paidRows.push(r);if(r.assessment===1n)present++;if(r.assessment===0n)unknown++;commitment=hash(['bytes32','bytes32'],[commitment,e.keccak256(abi.encode([rowType],[r]))]);}
    complete=scanned===BigInt(independent.rawTotal);
    assert.deepEqual(Array.from(progress),[scanned,BigInt(independent.rawTotal),BigInt(paidRows.length),present,unknown,commitment,complete]);
    assert.deepEqual(Array.from(work),['prefixProbes','historyProbes','joins','observedCurrent'].map(k=>BigInt(step[k])));
    let current=0n;const ledgerInterface=new e.Interface(packet.contracts.ledger.abi);
    for(const earlier of raw.slice(0,raw.indexOf(row)))for(const log of events(earlier,ledgerInterface,packet.contracts.ledger.address))if(log.name==='Published')current=log.args.firstAdmission+log.args.leafCount-1n;
    assert.equal(work.observedCurrent,current);assert(work.observedCurrent>=BigInt(q.basis[0]));
  }
  assert.equal(abi.encode([packet.rowAbi],[paidRows]),abi.encode([packet.rowAbi],[independent.rows]));
  assert.equal(commitment,q.commitment);assert.equal(q.complete,complete);assert(complete);assert.equal(q.absent,present===0n&&unknown===0n);
}
for(const refusal of packet.refusals){
  const row=unique(raw.filter(r=>r.transactionHash===refusal.hash),'one refusal receipt');assert.equal(row.status,'REVERTED');assert.equal(row.gasUsed,String(refusal.gas));
  if(refusal.plan){const tx=e.Transaction.from(row.rawTransaction);address(tx.to,packet.contracts.ledger.address);address(tx.from,refusal.plan.intent.author);assert.equal(tx.data,refusal.plan.nativeData);}
  else assert(packet.queries.some(q=>q.steps.some(s=>s.hash===refusal.hash&&s.status==='REVERTED')));
}
for(const d of packet.diagnostics??[]){
  const row=unique(raw.filter(r=>r.transactionHash===d.hash),'one diagnostic receipt'),tx=e.Transaction.from(row.rawTransaction),c=packet.contracts.tagReader,iface=new e.Interface(c.abi);
  assert.equal(row.status,'SUCCESS');assert.equal(row.gasUsed,String(d.gas));assert.equal(row.label,d.label);address(tx.to,c.address);
  assert.equal(tx.data,iface.encodeFunctionData('recordDiagnostic',d.args));assert.equal(d.profileHash,packet.profileHash);assert.equal(d.readerHash,c.codeHash);assert.equal(d.lensHash,packet.contracts.tagLens.codeHash);
  const logs=events(row,iface,c.address);assert.equal(row.receipt.logs.length,1);const log=unique(logs.filter(x=>x.name==='DiagnosticRecorded'),'one diagnostic event');
  const expected=abi.encode([packet.diagnosticAbi],[rebuilt.diagnose(...d.args)]);
  assert.equal(log.args.encodedDiagnostic,expected);assert.equal(d.encoded,expected);
}
const result={pass:true,sourceOff:true,networkDisabled:true,transactions:raw.length+twinRaw.length,publications:authorities.length,sourcePins:Object.keys(packet.sources).length,
  profileHash:packet.profileHash,meaning:rebuilt.mapping,statements:rebuilt.statements,queries:packet.queries.length,diagnostics:packet.diagnostics?.length??0,sizes,
  gas:{main:raw.reduce((x,r)=>x+BigInt(r.gasUsed),0n).toString(),matchedSignedFixture:twinRaw.reduce((x,r)=>x+BigInt(r.gasUsed),0n).toString()},
  authority:'Local RPC-observed admission plus retained direct native/ECDSA evidence, not a remote state proof or original-author destination permission',
  controls:{missingProfile:'PARTIAL opaque',missingType:'PARTIAL',allRuntimeCaptures:true,exactQueriesAndCommitments:true,nativeCalldataAdmissionJoin:true,ledgerEmitterContextJoin:true,consumerReceiptCalldataJoin:true}};
return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const e=await loadEthers(),label=process.argv[2]??'query-paid-final2';assert(/^[a-z0-9-]+$/.test(label));
  const packet=JSON.parse(gunzipSync(await readFile(new URL(`${label}.json.gz`,import.meta.url))));
  const revision=process.argv[3];if(revision)assert(/^[0-9a-f]{40}$/.test(revision),'exact archived source revision');
  for(const [path,pin] of Object.entries(packet.sources)){const b=revision?execFileSync('git',['show',`${revision}:Reviews/2026-09-12-efs-path-decision/lab-b/${path}`]):await readFile(path);assert.equal(e.keccak256(b),pin.keccak256);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);}
  const result=auditPacket(packet,e);
  result.sourceVerification=revision??'current-files';
  result.verifier={auditSHA256:createHash('sha256').update(await readFile(new URL('query-audit.mjs',import.meta.url))).digest('hex'),archiveSHA256:createHash('sha256').update(await readFile(new URL('query-archive.mjs',import.meta.url))).digest('hex')};
  await writeFile(new URL(`${label}-fix1-audit.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,statements:result.statements.length},null,2));
}
