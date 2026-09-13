// Offline exact-byte comparison with pre-chain independent inputs. RPC_OBSERVED, not a state proof.
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Transaction } from '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const run='/tmp/efs-b-parity-paid-20260913.KJ23qU';
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync(`${run}/pins.json`));
assert.equal(sha(readFileSync(pins.independentInputs)),pins.independentInputSha256);
const p=JSON.parse(readFileSync(pins.independentInputs));
const lower=x=>x?.toLowerCase();
function response(env,method){assert.equal(env.request.jsonrpc,'2.0');assert.equal(env.request.method,method);assert.equal(env.response.jsonrpc,'2.0');assert.equal(env.response.id,env.request.id);assert(!env.response.error);return env.response.result;}
function audit(packet){
  assert.equal(packet.failure,null);assert.deepEqual(packet.executedCells,['joined/paid-slice']);
  const c=packet.cells['joined/paid-slice'];assert.equal(c.error,null);
  const transactions=[...packet.setupTransactions,...c.transactions];assert.equal(transactions.length,34);
  const signed=[];
  for(const t of transactions){
    const tx=Transaction.from(t.rawTransaction);
    const r=response(t.rpc.getTransactionReceipt,'eth_getTransactionReceipt');
    const h=response(t.rpc.getBlockByHash,'eth_getBlockByHash');
    const actual=response(t.rpc.getTransactionByHash,'eth_getTransactionByHash');
    assert.equal(response(t.rpc.sendRawTransaction,'eth_sendRawTransaction'),tx.hash);
    assert.equal(t.rpc.sendRawTransaction.request.params[0],t.rawTransaction);
    assert.equal(t.hash,tx.hash);assert.equal(actual.hash,tx.hash);assert.equal(r.transactionHash,tx.hash);
    assert.equal(lower(tx.from),lower(actual.from));assert.equal(lower(tx.from),lower(t.from));
    assert.equal(lower(tx.to),lower(actual.to));assert.equal(tx.data,actual.input);assert.equal(tx.chainId,31337n);
    assert.equal(BigInt(actual.nonce),BigInt(tx.nonce));assert.equal(BigInt(actual.gas),tx.gasLimit);
    assert.equal(h.hash,r.blockHash);assert.equal(actual.blockHash,r.blockHash);assert.equal(actual.blockNumber,r.blockNumber);assert.equal(h.number,r.blockNumber);
    assert.equal(actual.transactionIndex,r.transactionIndex);assert.equal(h.transactions[Number(r.transactionIndex)],tx.hash);
    assert.equal(Number(r.status),1);assert.equal(BigInt(h.gasLimit),30000000n);assert(BigInt(r.gasUsed)<=tx.gasLimit);assert(BigInt(h.gasUsed)<=30000000n);
    assert.equal(BigInt(h.gasUsed),BigInt(r.cumulativeGasUsed));assert.equal(BigInt(t.receipt.gasUsed),BigInt(r.gasUsed));
    signed.push({label:t.label,hash:tx.hash,gas:BigInt(r.gasUsed).toString(),status:1,block:r.blockNumber});
  }
  for(const target of Object.values(p.runtime.targets)){
    const matches=transactions.filter(t=>lower(t.rpc.getTransactionReceipt.response.result.contractAddress)===target.address);
    assert.equal(matches.length,1);const t=matches[0];assert.equal(t.data.toLowerCase(),target.expectedInitcode);assert.equal(Number(t.nonce),target.nonce);
  }
  const seal=JSON.parse(readFileSync(`${run}/independent-observations/${pins.runId}-afterB1.json`)).context.checkpoint;
  const paid=[];
  for(const e of p.paidRows){
    const label=`paid/${e.operation==='PAID_LIST'?'list':'point'}-${e.lens==='LENS_A_FIRST'?'a':'b'}-first`;
    const ts=c.transactions.filter(t=>t.label===label);assert.equal(ts.length,1);const t=ts[0];
    assert.equal(lower(t.from),e.from);assert.equal(lower(t.to),e.to);assert.equal(t.data,e.data);
    const r=t.rpc.getTransactionReceipt.response.result,h=t.rpc.getBlockByHash.response.result;
    assert.equal(BigInt(r.blockNumber),BigInt(seal.blockNumber)+1n);assert.equal(Number(r.transactionIndex),0);
    assert.equal(h.parentHash,seal.blockHash);assert.equal(BigInt(h.timestamp),BigInt(seal.timestamp)+1n);assert.deepEqual(h.transactions,[t.hash]);
    const reads=c.raw.filter(x=>x.stage===`paid-replay:${label}`);assert.equal(reads.length,1);const read=reads[0];
    assert.equal(read.request.params[1],r.blockNumber);assert.equal(read.blockHash,r.blockHash);
    const call=read.request.params[0];assert.equal(lower(call.from),e.from);assert.equal(lower(call.to),e.to);assert.equal(call.data,e.data);
    assert.equal(response(read,'eth_call'),e.expectedReturn);assert.equal(read.returnData,e.expectedReturn);
    const logs=r.logs.filter(l=>lower(l.address)===e.to);assert.equal(logs.length,1);
    assert.equal(logs[0].data,e.expectedEvent.data);assert.deepEqual(logs[0].topics,e.expectedEvent.topics);
    const rows=c.rows.filter(row=>row.label===label);assert.equal(rows.length,1);assert.equal(rows[0].gas,BigInt(r.gasUsed).toString());
    paid.push({row:e.row,label,gas:BigInt(r.gasUsed).toString(),hash:t.hash,calldataMatches:true,returnMatches:true,eventMatches:true,commitment:e.commitment});
  }
  const operations=c.rows.filter(row=>row.gas).map(row=>{const tx=transactions.find(t=>t.hash===row.hash);assert(tx);const gas=BigInt(tx.rpc.getTransactionReceipt.response.result.gasUsed).toString();assert.equal(row.gas,gas);return{label:row.label,gas};});
  return{grade:'RPC_OBSERVED',source:pins.source,inputSha256:pins.independentInputSha256,transactions:signed.length,deployedTargets:Object.keys(p.runtime.targets).length,paidRows:paid,operations,signedTransactions:signed,setupGas:signed.slice(0,26).reduce((s,r)=>s+BigInt(r.gas),0n).toString(),qualification:'Offline signature/receipt/header and exact independently prepared paid-output consistency. No authenticated header/state proof, matched rollback, portable import or complete Files qualification. Restored paid branches are alternatives, not one canonical bill.'};
}
const packet=JSON.parse(readFileSync(`${run}/measure.json`));
const result=audit(packet);
const wrongMetadata=structuredClone(packet);wrongMetadata.setupTransactions.find(t=>t.to).data='0x';assert.throws(()=>audit(wrongMetadata),'unbound setup transaction metadata must be rejected');
const wrongReturn=structuredClone(packet);wrongReturn.cells['joined/paid-slice'].raw.find(r=>r.stage==='paid-replay:paid/point-a-first').response.result='0x';assert.throws(()=>audit(wrongReturn));
const wrongLog=structuredClone(packet);wrongLog.cells['joined/paid-slice'].transactions.at(-1).rpc.getTransactionReceipt.response.result.logs[0].data='0x';assert.throws(()=>audit(wrongLog));
const wrongGas=structuredClone(packet);wrongGas.cells['joined/paid-slice'].rows.find(r=>r.label==='paid/point-a-first').gas='1';assert.throws(()=>audit(wrongGas));
result.mutationChecks=['wrong raw return rejected','wrong receipt log rejected','wrong displayed gas rejected'];
writeFileSync(`${run}/audit.json`,`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({transactions:result.transactions,deployments:result.deployedTargets,paidRows:result.paidRows,operations:result.operations,setupGas:result.setupGas,mutationChecks:result.mutationChecks},null,2));

