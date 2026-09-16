/** Number-pinned fallback is bracketed by independently re-read block hashes.
 * Getters are discovery hints only; every retained word is verified from trie
 * bytes by the independent companion before export returns. */
import {PROFILE,nativeKeys,verifyNativePacket,parseCancunHeader} from '../browser/native-proof.mjs';
const need=(ok,why)=>{if(!ok)throw Error(`EXPORT_${why}`);};
export function rawCancunHeader(e,b){
  const integer=x=>BigInt(x)===0n?'0x':e.toBeHex(BigInt(x));
  const raw=e.encodeRlp([b.parentHash,b.sha3Uncles,b.miner,b.stateRoot,b.transactionsRoot,b.receiptsRoot,b.logsBloom,
    integer(b.difficulty),integer(b.number),integer(b.gasLimit),integer(b.gasUsed),integer(b.timestamp),b.extraData,b.mixHash,b.nonce,
    integer(b.baseFeePerGas),b.withdrawalsRoot,integer(b.blobGasUsed),integer(b.excessBlobGas),b.parentBeaconBlockRoot]);
  need(e.keccak256(raw)===b.hash,'HEADER_HASH');parseCancunHeader(e,raw);return raw;
}
export async function exportNative({ethers:e,rpc,source,ledgerAbi,publication}){
  const start=performance.now(),api=new e.Interface(ledgerAbi),block=await rpc('eth_getBlockByNumber',['latest',false]);
  const tag={blockHash:block.hash,requireCanonical:true},call=async(fn,args=[])=>api.decodeFunctionResult(fn,await rpc('eth_call',[{to:source.ledger,data:api.encodeFunctionData(fn,args)},tag]));
  need(e.keccak256(await rpc('eth_getCode',[source.ledger,tag]))===source.codeHash,'CODE_PROFILE');
  const [physical,namespace]=await call('readSetStorageProfile');
  need(physical===e.id('efs.lab.read-set-storage/2:root15-legacy-first:namespaced-stop-code:all-new')&&namespace===e.id('efs.lab.ledger.read-set-carriers/1'),'READSET_PROFILE');
  const ev=await call('evidence',[publication]),[context]=await call('publicationContext',[publication]);
  need(ev[1]===1n&&ev[3]===1n&&context.intentFormat===2n,'SINGLE_GUARDED_NATIVE');
  const row=await call('admission',[ev[4]]);need(row[0]===1n,'PUBLISH');
  const recordId=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),row[7],row[6]]));
  const record=await call('record',[recordId]),[reads]=await call('readSetBytes',[context.readSetHash]);
  // The checked Ledger getter supports both legacy root15 dynamic bytes and the
  // namespaced STOP-code carrier. Root15 zero is never an absence conclusion.
  const publicationId=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),context.principalId,context.intentDigest]));
  const keys=nativeKeys(e,publication,ev[4],context.executionSet,publicationId,recordId,ev[0]);
  let proof,fallback=false,fallbackError;
  try{proof=await rpc('eth_getProof',[source.ledger,keys,tag]);}
  catch(error){
    if(![-32602,-32601].includes(error.rpcError?.code))throw error;
    fallback=true;fallbackError=error.rpcError;
    need((await rpc('eth_getBlockByNumber',[block.number,false])).hash===block.hash,'PRE_FALLBACK_REORG');
    proof=await rpc('eth_getProof',[source.ledger,keys,block.number]);
  }
  need((await rpc('eth_getBlockByNumber',[block.number,false])).hash===block.hash,'POST_PROOF_REORG');
  need(proof.storageProof.length===30,'PROOF_KEY_COUNT');
  const packet={profile:PROFILE,source,witness:{checkpoint:String(BigInt(block.number)),publication:String(publication),body:record[3],reads,
    accountProof:proof.accountProof,slots:proof.storageProof.map(s=>({key:e.toBeHex(BigInt(s.key),32),nodes:s.proof}))},header:rawCancunHeader(e,block)};
  // RPC response ordering is not authority; reorder by exact unique requested
  // keys and reject duplicates/unknowns before any inclusion validation.
  const byKey=new Map(packet.witness.slots.map(s=>[s.key.toLowerCase(),s]));need(byKey.size===30&&keys.every(k=>byKey.has(k)),'PROOF_KEYS');
  packet.witness.slots=keys.map(k=>byKey.get(k));
  let verified;
  try{verified=verifyNativePacket(e,packet);}catch(error){error.packet=packet;error.rpcProof=proof;throw error;}
  return {packet,diagnostics:{fallback,fallbackError,elapsedMs:performance.now()-start,blockNumber:String(BigInt(block.number)),blockHash:block.hash,
    proofBytes:verified.proofBytes,proofNodes:verified.proofNodes,maxPath:Math.max(proof.accountProof.length,...proof.storageProof.map(p=>p.proof.length)),
    maxNode:Math.max(...[proof.accountProof,...proof.storageProof.map(p=>p.proof)].flat().map(n=>(n.length-2)/2)),
    rpcConvenienceIgnored:['value','storageHash','codeHash','nonce','balance'],readSetProfile:physical,readsBytes:(reads.length-2)/2,bodyBytes:(record[3].length-2)/2}};
}
