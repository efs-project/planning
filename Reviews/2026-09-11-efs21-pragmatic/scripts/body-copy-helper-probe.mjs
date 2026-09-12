// Two actual cold-transaction helper calls: retained intended performance RED, then candidate comparison.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {withUpgrade} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {encodeGroup,derive} from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import {AbiCoder,Interface,keccak256,toBeHex,ZeroHash} from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const mode=process.argv[2];assert(['red','candidate'].includes(mode));
assert(process.env.EFS_TEST_BUILD_ROOT,'explicit isolated coherent build required');
const output=fileURLToPath(new URL('../evidence/body-copy-helper-'+mode+'.json',import.meta.url));
assert(!existsSync(output),'exclusive evidence');
const iface=new Interface([
 'function compileGroup(bytes) view returns ((bytes32 groupHash,bytes32 rawHash,(bytes32 typeId,bytes cacheBytes)[] types,bytes32[] dependencies))',
 'function prepareRecord(bytes,bytes32,bytes,bytes32,bytes32,(bytes32 setType,bytes32 tombstoneType,bytes32 withdrawalType),bool) pure returns ((tuple(uint8 roleIndex,uint8 targetClass,bytes32 expectedType,bytes32 targetId,uint16 leafIndex)[] references,bytes32[] occurrenceKeys,tuple(uint8 kind,bytes32 purpose,bytes32 subject,bytes32 fieldRole,uint8 targetKind,bytes32 targetA,uint16 targetLeaf,bool predecessorPresent,tuple(bytes32 envelopeId,uint16 leafIndex) predecessor) effect))'
]);
const abi=AbiCoder.defaultAbiCoder(),raw='0x'+encodeGroup([{name:'CopyProbe/1',meaning:'',qualifier:'00'.repeat(32),fields:[{name:'data',kind:'BYTES',max:8190}],roles:[],indexes:[],constraints:[]}]).toString('hex');
const typeId=derive(Buffer.from(raw.slice(2),'hex')).ids[0],body='0x1ffe'+'a7'.repeat(8190);
let cleanup;
const result=await withUpgrade(async lab=>{
 cleanup=lab.cleanup;const helper=lab.expected.execution.helper;
 const compiled=iface.decodeFunctionResult('compileGroup',await lab.rpc('eth_call',[{to:helper,data:iface.encodeFunctionData('compileGroup',[raw])},'latest']))[0];
 assert.equal(compiled.types[0].typeId,typeId);
 const rid=keccak256(abi.encode(['bytes32','bytes32','bytes32'],[keccak256(Buffer.from('efs2/record/1')),typeId,keccak256(body)]));
 const data=iface.encodeFunctionData('prepareRecord',[compiled.types[0].cacheBytes,typeId,body,rid,toBeHex(65536,32),[ZeroHash,ZeroHash,ZeroHash],false]);
 const calls=[];
 for(let i=0;i<2;i++){
  const receipt=await lab.receipt(await lab.send(data,helper),'cold identical helper '+i);assert.equal(receipt.status,'0x1');
  const tx=await lab.rpc('eth_getTransactionByHash',[receipt.transactionHash]);assert.equal(tx.input,data);
  const returned=await lab.rpc('eth_call',[{to:helper,data},receipt.blockNumber]);
  calls.push({receipt,transaction:tx,rawTransaction:await lab.rpc('eth_getRawTransactionByHash',[receipt.transactionHash]),returned});
 }
 assert.equal(calls[0].returned,calls[1].returned);
 return {mode,raw,typeId,body,data,cacheBytes:compiled.types[0].cacheBytes,helper,helperCode:await lab.rpc('eth_getCode',[helper,'latest']),resources:lab.resources,calls};
},{profile:'base',watchdogMs:180000});
result.cleanup=cleanup;assert(cleanup.stopped&&cleanup.cacheRemoved);
const baseline=mode==='red'?result:JSON.parse(readFileSync(new URL('../evidence/body-copy-helper-red.json',import.meta.url)));
result.strictReduction=BigInt(result.calls[1].receipt.gasUsed)<BigInt(baseline.calls[0].receipt.gasUsed);
if(mode==='candidate'){
 assert.equal(result.data,baseline.data);assert.equal(result.calls[0].returned,baseline.calls[0].returned);
 assert.notEqual(result.helperCode,baseline.helperCode,'actual helper must change');
}
writeFileSync(output,JSON.stringify(result,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n',{flag:'wx'});
console.log(output,result.calls.map(x=>String(BigInt(x.receipt.gasUsed))),result.cleanup);
assert(result.strictReduction,'predeclared strict reduction versus paid old-helper baseline');
