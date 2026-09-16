// Source-off audit: no source RPC, original index or browser SDK token labels.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadEthers} from '../script/compact-environment.mjs';
import {rebuildArchive} from './query-archive.mjs';
globalThis.fetch=()=>{throw Error('SOURCE_RPC_DISABLED');};
const e=await loadEthers(),abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const label=process.argv[2]??'query-paid-final2';assert(/^[a-z0-9-]+$/.test(label));
const packet=JSON.parse(gunzipSync(await readFile(new URL(`${label}.json.gz`,import.meta.url))));
assert(packet.complete&&!packet.error&&packet.chain.closed&&packet.matchedSigned.chain.closed);
const hash=(t,v)=>e.keccak256(abi.encode(t,v));
const txRows=p=>p.rawTransactions.trim().split('\n').map(JSON.parse);
const raw=txRows(packet),twinRaw=txRows(packet.matchedSigned),sizes={},authorities=[];
for(const [path,pin] of Object.entries(packet.sources)){const b=await readFile(path);assert.equal(e.keccak256(b),pin.keccak256);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);}
function physical(p,rows){
  for(const row of rows){const tx=e.Transaction.from(row.rawTransaction);assert.equal(tx.hash,row.transactionHash);assert.equal(tx.hash,row.receipt.transactionHash);assert.equal(tx.from.toLowerCase(),row.receipt.from.toLowerCase());assert.equal(tx.gasLimit,15000000n);assert(BigInt(row.gasUsed)<=15000000n);}
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
    const row=rows.find(r=>r.status==='SUCCESS'&&r.receipt.logs.some(l=>{try{const x=iface.parseLog(l);return x?.name==='Published'&&String(x.args.publication)===pub;}catch{return false;}}));assert(row,'receipt links each retained publication');
    const tx=e.Transaction.from(row.rawTransaction),context=a.contexts[pub],leaves=a.admissions.filter(f=>f.publication===pub),actions=[];
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
    if(Number(ev[1])===1)assert.equal(tx.from,e.getAddress(ev[0]),'native attribution is the actual transaction caller in this direct EOA fixture');
    else{
      assert.equal(decoded.name,'executeGuardedSigned');assert.equal(hash([actionsType],[decoded.args[1]]),actionsHash);
      const intent=Object.fromEntries(iface.getFunction('executeGuardedSigned').inputs[0].components.map((c,i)=>[c.name,decoded.args[0][i]]));
      const digest=e.TypedDataEncoder.hash({name:'EFS2-RoadB-Lab',version:'2'},{IntentV2:fields},{...intent,actionsHash});
      assert.equal(digest,context.intentDigest);assert.equal(e.recoverAddress(digest,decoded.args[4]),e.getAddress(ev[0]));
      assert.equal(e.Signature.from({r:ev[5],s:ev[6],v:Number(ev[2])}).serialized,decoded.args[4]);
      assert.equal(intent.realmId,a.realm);assert.equal(intent.realmOrigin,a.origin);assert.equal(intent.executionSet,context.executionSet);
    }
    if(Number(context.intentFormat)===2){
      const saved=a.readSets[context.readSetHash];assert(saved);const reads=abi.decode([readType],saved.raw)[0];
      assert.equal(hash(['bytes32',readType],[e.id('efs.lab.read-set/2:ordered-first-binding'),reads]),context.readSetHash);
      const supplied=decoded.name==='executeGuardedSigned'?decoded.args[3]:decoded.args[4];assert.equal(abi.encode([readType],[supplied]),saved.raw);
      const intent={realmId:a.realm,realmOrigin:a.origin,executionSet:context.executionSet,author:ev[0],nonce:ev[7],deadline:ev[8],acceptanceProfile:ev[10],indexObligations:ev[11],readSetHash:context.readSetHash};
      assert.equal(e.TypedDataEncoder.hash({name:'EFS2-RoadB-Lab',version:'2'},{IntentV2:fields},{...intent,actionsHash}),context.intentDigest);
    }
    authorities.push({publication:pub,author:context.principalId,proof:Number(ev[1]),actions:leaves.length,transaction:row.transactionHash});
  }
}
physical(packet,raw);physical(packet.matchedSigned,twinRaw);authority(packet,raw);authority(packet.matchedSigned,twinRaw);
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
  let commitment=hash(['string','address','address','bytes32','address','bytes32','bytes32[]',qType,bType],['efs.tag-owned-origin/1',c.address,deployment.from,q.session,packet.contracts.tagReader.address,packet.contracts.tagReader.codeHash,q.principals,q.query,q.basis]);
  commitment=hash(['bytes32','bytes32','uint64'],[commitment,independent.pin,independent.rawTotal]);
  const rowType=e.ParamType.from(packet.rowAbi).arrayChildren;
  for(const r of independent.rows)commitment=hash(['bytes32','bytes32'],[commitment,e.keccak256(abi.encode([rowType],[r]))]);
  assert.equal(commitment,q.commitment);assert(q.complete);assert.equal(q.absent,independent.rows.every(r=>r.assessment!==0&&r.assessment!==1));
}
const result={pass:true,sourceOff:true,networkDisabled:true,transactions:raw.length+twinRaw.length,publications:authorities.length,sourcePins:Object.keys(packet.sources).length,
  profileHash:packet.profileHash,meaning:rebuilt.mapping,statements:rebuilt.statements,queries:packet.queries.length,sizes,
  gas:{main:raw.reduce((x,r)=>x+BigInt(r.gasUsed),0n).toString(),matchedSignedFixture:twinRaw.reduce((x,r)=>x+BigInt(r.gasUsed),0n).toString()},
  authority:'Local RPC-observed admission plus retained direct native/ECDSA evidence, not a remote state proof or original-author destination permission',
  controls:{missingProfile:'PARTIAL opaque',missingType:'PARTIAL',allRuntimeCaptures:true,exactQueriesAndCommitments:true}};
await writeFile(new URL(`${label}-audit.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,statements:result.statements.length},null,2));
