// One bounded follow-up to the Task2 paid packet: fresh retained 64x4 guard
// preimage plus one full-eight-reference/four-scalar/digest publication.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createEnvironment} from './compact-environment.mjs';
const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true});
const {ethers:e,contracts:c}=env,abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const tuple='tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)';
const hash=rs=>e.keccak256(abi.encode(['bytes32',tuple],[e.id('efs.lab.read-set/2:ordered-first-binding'),rs]));
const priorAttribution=[];let finding,failure,support;
try{
  // Derive the original run's retention/dedup attribution from signed calldata,
  // transaction order and successful receipts; this is not a new chain read.
  const prior=JSON.parse(gunzipSync(await readFile(new URL('../core-closeout-index-replay-20260915/paid.json.gz',import.meta.url))));
  const iface=new e.Interface(prior.contracts.core.abi),retained=new Map();
  for(const tx of prior.transactions.filter(x=>x.label.startsWith('guard-'))){
    const decoded=iface.parseTransaction(e.Transaction.from(tx.rawTransaction)),rs=decoded.args[4];
    const key=hash(rs),length=e.getBytes(abi.encode([tuple],[rs])).length;
    priorAttribution.push({label:tx.label,transactionHash:tx.transactionHash,readSetHash:key,principals:rs[0].length,positions:rs[1].length,encodedBytes:length,existingReadSetBytesBefore:retained.get(key)??0,preimageReused:retained.has(key),basis:'derived from retained signed calldata and successful transaction order'});
    retained.set(key,length);
  }
  const register=async(label,refs=[])=>{const shape=e.id(label),[id]=await env.call('registry','typeIdOf',[shape,e.ZeroAddress,refs]);await env.transact('registry','register',[shape,e.ZeroAddress,refs]);return id;};
  const target=await register('fresh-joint/target'),source=await register('fresh-joint/eight',Array(8).fill(target));
  const specs=[{typeId:source,scalars:[{kind:2,word:8},{kind:1,word:11},{kind:2,word:12},{kind:1,word:13}],digest:{enabled:true,word:10,algorithmWord:9,algorithm:e.toBeHex(1,32)}}];
  await env.deploy('core','Ledger.sol','Ledger',[c.registry.address,e.id('replay/fresh-joint')]);
  await env.deploy('active','ProfiledIndexModule.sol','ProfiledIndexModule',[c.core.address,specs]);await env.transact('core','setIndexModule',[c.active.address]);
  const targets=[];
  for(let i=0;i<8;i++){const body=abi.encode(['uint256'],[i+1]);targets.push(e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),target,e.keccak256(body)])));await env.transact('core','publish',[target,body]);}
  const principalIds=Array.from({length:64},(_,i)=>e.toBeHex(i+1,32)),positions=Array.from({length:4},(_,i)=>e.id(`fresh-joint-position/${i}`)),expectedHeads=[];
  for(const position of positions)for(const principal of principalIds)expectedHeads.push((await env.call('core','headSnapshot',[principal,position]))[0]);
  const rs={principalIds,positions,expectedHeads},readSetHash=hash(rs);
  assert.equal((await env.call('core','readSetHash',[rs]))[0],readSetHash);
  const existingReadSetBytesBefore=e.getBytes((await env.call('core','readSetBytes',[readSetHash]))[0]).length;assert.equal(existingReadSetBytesBefore,0);
  const body=abi.encode(['bytes32[8]','uint256','uint256','bytes32','bytes32','uint256','bytes32'],[targets,1,1,e.toBeHex(101,32),e.toBeHex(201,32),301,e.toBeHex(401,32)]);
  const actions=[{kind:1,typeId:source,bodyHashOrRecordId:e.keccak256(body),purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z}];
  const before=Array.from(await env.call('core','counts')).map(String),nonce=(await env.call('core','nonces',[env.wallets.deployer.address]))[0],execution=(await env.call('core','executionSet'))[0];
  const tx=await env.enqueue('guard-fresh-joint-64x4-full-eight-fields',{to:c.core.address,data:new e.Interface(c.core.abi).encodeFunctionData('executeGuarded',[actions,[body],nonce,execution,rs]),gasLimit:15_000_000});
  const receipt=await env.observe(tx),after=Array.from(await env.call('core','counts')).map(String),retainedReadSetBytesAfter=e.getBytes((await env.call('core','readSetBytes',[readSetHash]))[0]).length;
  finding={label:tx.label,status:receipt.status,gasUsed:receipt.gasUsed,readSetHash,principals:64,positions:4,bodyBytes:e.getBytes(body).length,references:8,scalars:4,digests:1,existingReadSetBytesBefore,retainedReadSetBytesAfter,preimageReused:false,before,after};
  if(receipt.status==='SUCCESS'){
    assert.equal(Number(after[0]),Number(before[0])+1);assert.equal(retainedReadSetBytesAfter,10592);
    const id=e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),source,e.keccak256(body)]));
    const stored=await env.call('core','record',[id]);assert.equal(stored[3],body);assert.equal((await env.call('active','lastProcessed'))[0],BigInt(after[0]));
  }else{assert.deepEqual(after,before);assert.equal(retainedReadSetBytesAfter,0);}
  const [address,pin]=await env.call('core','publicationSupportIdentity'),code=await env.rpc('eth_getCode',[address,'latest']);
  support={address,pin,codehash:e.keccak256(code),runtimeBytes:e.getBytes(code).length};assert.equal(support.pin,support.codehash);
}catch(error){failure={message:error.message,stack:error.stack};throw error;}
finally{
  try{
    const sources={};for(const path of ['src/Ledger.sol','src/PublicationSupport.sol','src/IndexModule.sol','src/IndexReplaySource.sol','src/Interfaces.sol','script/core-index-replay-joint.mjs'])sources[path]=createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex');
    const report={status:failure?'FAILED':'COMPLETE',failure,finding,priorAttribution,support,sources,contracts:c,transactions:env.transactions,historyPolicy:env.historyPolicy,evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF'};
    const output=new URL('../core-closeout-index-replay-20260915/',import.meta.url);await mkdir(output,{recursive:true});
    await writeFile(new URL(failure?`failed-${env.port}-fresh-joint.json.gz`:'fresh-joint.json.gz',output),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
    console.log(JSON.stringify({status:report.status,failure,finding,priorAttribution,support},null,2));
  }finally{await env.close();}
}
