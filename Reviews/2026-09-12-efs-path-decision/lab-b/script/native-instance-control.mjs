/** Actual second local instance with the same chain ID, deterministic Ledger
 * address and runtime; it does not inherit the first instance's history. */
import assert from 'node:assert/strict';
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {verifyNativePacket,positiveValue,positiveStorage,canonicalRlp} from '../browser/native-proof.mjs';
import {exportNative,rawCancunHeader} from './native-proof-export.mjs';
const out=process.argv[2];assert(/^core-closeout-native-20260916\/final-[1-9][0-9]*$/.test(out));
const target=`${out}/other-instance.json.gz`;assert(!(await lstat(target).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})),'EVIDENCE_OUTPUT_EXISTS');
const report=JSON.parse(gunzipSync(await readFile(`${out}/paid.json.gz`))),e=await loadEthers(),env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'direct',blockGasLimit:15000000});
const result={profile:'negative-other-instance',originalInstance:report.source.instanceId};
try{
  const genesis=await env.rpc('eth_getBlockByNumber',['0x0',false]),block=await env.rpc('eth_getBlockByNumber',['latest',false]);
  assert.equal(env.contracts.ledger.address,report.source.ledger);assert.equal(env.contracts.ledger.codeHash,report.source.codeHash);assert.notEqual(genesis.hash,report.source.instanceId);
  const source={...report.source,instanceId:genesis.hash};
  await assert.rejects(exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:report.first.publication}),/SINGLE_GUARDED_NATIVE/);
  const original=report.exports[0];
  assert.throws(()=>verifyNativePacket(e,original.packet,{...original.anchors,sourceAnchor:{...original.anchors.sourceAnchor,instanceId:genesis.hash}}),/SOURCE_ANCHOR/);
  const key=original.packet.witness.slots[0].key,proof=await env.rpc('eth_getProof',[source.ledger,[key],block.number]);
  const account=canonicalRlp(e,positiveValue(e,block.stateRoot,source.ledger,proof.accountProof));
  assert.throws(()=>positiveStorage(e,account[2],key,proof.storageProof[0].proof));
  Object.assign(result,{sameChainId:true,sameAddress:true,sameRuntime:true,genesis,header:rawCancunHeader(e,block),proof,
    absentPublicationRefused:true,oldPacketAnchorRefused:true,validNonInclusionRefused:true,contracts:env.contracts,transactions:env.transactions});
}finally{await env.close();result.closed=true;await writeFile(target,gzipSync(JSON.stringify(result,(_,v)=>typeof v==='bigint'?String(v):v,2)));}
console.log(JSON.stringify({sameChainId:result.sameChainId,sameAddress:result.sameAddress,sameRuntime:result.sameRuntime,absentPublicationRefused:result.absentPublicationRefused,oldPacketAnchorRefused:result.oldPacketAnchorRefused,validNonInclusionRefused:result.validNonInclusionRefused,closed:result.closed}));
