// Offline evidence audit: no chain, owner process, network or new measurements.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadEthers} from '../script/compact-environment.mjs';
const e=await loadEthers(),packet=JSON.parse(gunzipSync(await readFile(new URL('paid-final.json.gz',import.meta.url))));
assert(packet.complete&&!packet.error&&packet.chain.closed);
const raw=packet.rawTransactions.trim().split('\n').map(JSON.parse);
const sizes={};
for(const [key,name] of [['tagIndex','TagStanceIndex'],['replayIndex','TagStanceIndex'],['stanceValidator','TagStanceValidator'],['finalValidator','FilesFinalValidator']]){
  const c=packet.contracts[key],a=packet.artifacts[name],row=raw.find(r=>r.transactionHash===c.transactionHash);
  const tx=e.Transaction.from(row.rawTransaction);
  assert.equal(tx.data,a.bytecode.object+new e.Interface(a.abi).encodeDeploy(c.constructorArgs).slice(2));
  assert.equal(e.getCreateAddress({from:tx.from,nonce:tx.nonce}),e.getAddress(c.address));
  // The late replay deployment is runtime-template checked by env.deploy and
  // has its observed codehash retained, but its raw runtime was not captured by
  // the earlier snapshot loop. Do not pretend to re-audit absent raw bytes.
  if(key!=='replayIndex'){
    assert.equal(e.keccak256(c.runtimeCode),c.codeHash);
    const expected=e.getBytes(a.deployedBytecode.object),actual=e.getBytes(c.runtimeCode),immutable=new Set();
    for(const refs of Object.values(a.deployedBytecode.immutableReferences??{}))for(const ref of refs)for(let i=ref.start;i<ref.start+ref.length;i++)immutable.add(i);
    assert.equal(expected.length,actual.length);for(let i=0;i<expected.length;i++)if(!immutable.has(i))assert.equal(actual[i],expected[i]);
  }
  assert.equal(e.getBytes(tx.data).length,c.initcodeBytes);assert(c.initcodeBytes<=49152&&c.runtimeBytes<=24576);
  assert.equal(tx.gasLimit,15000000n);assert.equal(row.receipt.status,'0x1');
  sizes[key]={runtime:c.runtimeBytes,actualInitcode:c.initcodeBytes,gas:row.gasUsed,codeHash:c.codeHash,rawRuntimeRetained:!!c.runtimeCode};
}
for(const [path,pin] of Object.entries(packet.sources)){
  const b=await readFile(path);assert.equal(e.keccak256(b),pin.keccak256);assert.equal(createHash('sha256').update(b).digest('hex'),pin.sha256);
}
const config=packet.fixture.configuration;
assert.equal(packet.contracts.stanceValidator.constructorArgs[0],packet.contracts.ledger.address);
assert.deepEqual(packet.contracts.stanceValidator.constructorArgs.slice(1,6),config);
assert.equal(packet.contracts.tagIndex.constructorArgs.at(-2),packet.contracts.stanceValidator.address);
assert.equal(packet.contracts.tagIndex.constructorArgs.at(-1),packet.contracts.stanceValidator.codeHash);
const description=packet.fixture.descriptor;
assert.equal(e.getBytes(description).length,295); //90-byte header +41-byte label +164-byte field
const token=packet.contracts.stanceValidator.constructorArgs[6];
for(let i=0;i<3;i++){
  const expected=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),token,e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['uint256'],[i+1]))]));
  assert.equal(packet.fixture.tokens[i],expected);
}
for(const row of raw){assert.equal(e.keccak256(row.rawTransaction),row.transactionHash);assert(BigInt(row.gasLimit)<=15000000n);}
const result={pass:true,transactions:raw.length,successful:raw.filter(r=>r.status==='SUCCESS').length,intentionalReverts:raw.filter(r=>r.status==='REVERTED').length,
  totalGas:raw.reduce((sum,r)=>sum+BigInt(r.gasUsed),0n).toString(),sizes,sourcePins:Object.keys(packet.sources).length,
  profileBytes:e.getBytes(packet.profileBytes).length,profileHash:e.keccak256(packet.profileBytes),manifest:packet.manifest,descriptorBytes:e.getBytes(description).length,
  helperPlusIndexGas:(BigInt(sizes.stanceValidator.gas)+BigInt(sizes.tagIndex.gas)).toString(),allRequiredHelpersPlusIndexGas:(BigInt(sizes.stanceValidator.gas)+BigInt(sizes.tagIndex.gas)+BigInt(sizes.finalValidator.gas)).toString()};
await writeFile(new URL('audit.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
