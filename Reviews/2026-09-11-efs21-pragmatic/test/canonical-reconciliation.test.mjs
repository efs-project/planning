import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E} from '../scripts/world.mjs';
import {createClient} from '../sdk/client.mjs';

// Coverage of already-implemented recovery, not a claim of a pre-existing product bug.
for(const method of ['createFile','editFile'])test(`canonical ${method} saved unresolved actions reconcile read-only after submission and verification loss`,async()=>{
 const outcome=await withWorld(async w=>{
  await w.client.write('ensureRoot',[]);const root=(await w.client.call('rootId',[w.config.namespace])).value;
  const type=w.config.bytesType,abi=E.AbiCoder.defaultAbiCoder();
  let file,revision=1n;
  if(method==='editFile')file=(await w.client.write('createFile',[root,E.toUtf8Bytes('edit target'),type,'0x000101'])).fileId;
  const original=globalThis.fetch,journal=[];let mode='healthy',submitted=false,sends=0,expectedHash;const requests=[];
  const onAction=action=>{const index=journal.findIndex(a=>a.hash===action.hash);if(index<0)journal.push(action);else journal[index]=action;};
  globalThis.fetch=async(url,options)=>{
   const request=JSON.parse(options.body);requests.push(request.method);
   if(request.method==='eth_sendRawTransaction'){
    ++sends;expectedHash=E.keccak256(request.params[0]);const response=await original(url,options);submitted=true;
    if(mode==='submit'){await response.text();throw Error('lost canonical content submission response after acceptance');}return response;
   }
   if(request.method==='eth_call'&&mode==='verify'&&submitted)throw Error('interrupted canonical content verification');
   return original(url,options);
  };
  try{
   let client=createClient(E,w.config,{onAction});
   for(const [failure,body,payload]of [['submit','0x0004ef008000','0xef008000'],['verify','0x0000','0x']]){
    const args=method==='createFile'?[root,E.toUtf8Bytes('resumed '+failure),type,body]:[file,revision,type,body];
    const expectedId=E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),type,E.keccak256(body)]));
    const expectedRevision=method==='createFile'?1n:revision+1n,before=sends;
    mode=failure;submitted=false;
    await assert.rejects(()=>client.write(method,args),e=>e.hash===expectedHash&&e.status===(failure==='submit'?'SUBMISSION_UNKNOWN':'VERIFICATION_UNKNOWN'));
    const saved=JSON.parse(JSON.stringify(journal));assert.equal(saved.at(-1).hash,expectedHash);assert.equal(saved.at(-1).verifyEffect,true);assert.equal(saved.at(-1).status,failure==='submit'?'SUBMISSION_UNKNOWN':'VERIFICATION_UNKNOWN');
    assert.equal(sends,before+1);assert.equal(client.unresolved().length,1);
    client=createClient(E,w.config,{initialActions:saved,onAction});
    await assert.rejects(()=>client.write('ensureRoot',[]),/Reconcile/);assert.equal(sends,before+1);
    mode='healthy';const start=requests.length;const result=await client.reconcile();
    assert.equal(result.status,'COMMITTED');assert.equal(result.hash,expectedHash);if(method==='editFile')assert.equal(result.fileId,file);
    assert.equal(result.content.recordId,expectedId);assert.equal(result.content.typeId,type);assert.equal(result.content.bodyHash,E.keccak256(body));
    assert.equal(result.basis.blockNumber,result.receipt.blockNumber);assert.equal(result.basis.blockHash,result.receipt.blockHash);
    assert.equal(sends,before+1);assert.equal(client.unresolved().length,0);assert.equal(journal.at(-1).status,'COMMITTED');
    const allowed=new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_call','eth_getTransactionReceipt']);
    assert(requests.slice(start).every(name=>allowed.has(name)),'reconciliation is RPC reads only, never resend');
    // Independent client at the exact receipt basis, not the resumed verifier's content summary.
    const basis=await w.client.observe(result.receipt.blockNumber);
    const info=(await w.client.call('fileInfo',[result.fileId],basis)).value;
    assert.equal(info.revision,expectedRevision);assert.equal(info.recordId,expectedId);assert.equal(info.owner,w.config.namespace);assert(info.live&&!info.directory);
    if(method==='createFile')assert.equal((await w.client.call('lookup',[w.config.namespace,root,args[1]],basis)).value,result.fileId);
    const record=(await w.client.call('readRecord',[expectedId],basis)).value;
    assert.equal(record.typeId,type);assert.equal(record.body,body);
    const bytes=E.getBytes(record.body);assert.equal(bytes[0]*256+bytes[1],bytes.length-2);assert.equal(E.hexlify(bytes.slice(2)),payload);
    assert.equal((await w.client.call('revisionAt',[result.fileId,expectedRevision],basis)).value.recordId,expectedId);
    revision=expectedRevision;
   }
   return {};
  }finally{globalThis.fetch=original;}
 },{kernelArtifact:'canonical-ref-free-v1'});
 assert(outcome.cleanup.stopped&&outcome.cleanup.cacheRemoved);
});
