import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {loadEthers} from '../script/compact-environment.mjs';
import {auditPacket} from './query-audit.mjs';
const e=await loadEthers(),abi=e.AbiCoder.defaultAbiCoder();
const original=JSON.parse(gunzipSync(await readFile(new URL('query-paid-final2.json.gz',import.meta.url))));
test('original finite packet passes semantic audit',()=>assert.equal(auditPacket(original,e).publications,114));
test('native leaf and evidence hash cannot disagree with raw native calldata',()=>{
  const p=structuredClone(original),f=p.archive.admissions.at(-1),ev=p.archive.evidence[f.publication],c=p.archive.cells[f.ordinal];
  f.expected=String(BigInt(f.expected)+1n);
  const iface=new e.Interface(p.contracts.ledger.abi),a={kind:f.kind,typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:c.p,subject:c.s,role:c.c,target:f.target,expectedRevision:f.expected,salt:e.ZeroHash};
  ev[12]=e.keccak256(abi.encode([iface.getFunction('execute').inputs[0]],[[a]]));
  assert.throws(()=>auditPacket(p,e));
});
function mutateLog(p,contractKey,event,change){
  const iface=new e.Interface(p.contracts[contractKey].abi),address=p.contracts[contractKey].address.toLowerCase();
  const rows=p.rawTransactions.trim().split('\n').map(JSON.parse);
  for(const row of rows)for(const log of row.receipt.logs){
    if(log.address.toLowerCase()!==address)continue;
    let parsed;try{parsed=iface.parseLog(log);}catch{continue;}if(parsed?.name!==event)continue;
    change(log,parsed,iface,row);p.rawTransactions=rows.map(JSON.stringify).join('\n')+'\n';return;
  }throw Error('fixture event missing');
}
test('Published emitter is the pinned Ledger',()=>{
  const p=structuredClone(original);mutateLog(p,'ledger','Published',log=>log.address=p.contracts.tagReader.address);
  assert.throws(()=>auditPacket(p,e));
});
test('publication receipt destination agrees with raw Ledger destination',()=>{
  const p=structuredClone(original);mutateLog(p,'ledger','Published',(_l,_p,_i,row)=>row.receipt.to=p.contracts.tagReader.address);
  assert.throws(()=>auditPacket(p,e));
});
test('Published event context cannot name a different author',()=>{
  const p=structuredClone(original);mutateLog(p,'ledger','Published',(log,x,iface)=>{const args=Array.from(x.args);args[2]=p.contracts.tagReader.address;Object.assign(log,iface.encodeEventLog('Published',args));});
  assert.throws(()=>auditPacket(p,e));
});
test('paid Rows event cannot be replaced by a different attributed row',()=>{
  const p=structuredClone(original);mutateLog(p,'query1','Rows',(log,x,iface)=>{
    const rows=abi.decode([p.rowAbi],x.args.encodedRows)[0].map(r=>Array.from(r));rows[0][5]=2n;
    Object.assign(log,iface.encodeEventLog('Rows',[x.args.session,abi.encode([p.rowAbi],[rows])]));
  });assert.throws(()=>auditPacket(p,e));
});
for(const [name,index,value] of [['commitment',5,e.ZeroHash],['progress',0,0n],['completion',6,false]])test(`paid ${name} event must match reconstructed prefix`,()=>{
  const p=structuredClone(original);mutateLog(p,'query1','Progress',(log,x,iface)=>{const args=Array.from(x.args);args[index]=value;Object.assign(log,iface.encodeEventLog('Progress',args));});
  assert.throws(()=>auditPacket(p,e));
});
test('paid Work event must match retained step metrics',()=>{
  const p=structuredClone(original);mutateLog(p,'query1','Work',(log,x,iface)=>{const args=Array.from(x.args);args[0]++;Object.assign(log,iface.encodeEventLog('Work',args));});
  assert.throws(()=>auditPacket(p,e));
});
test('query step budget is joined to calldata',()=>{const p=structuredClone(original);p.queries[0].steps[0].budget=1;assert.throws(()=>auditPacket(p,e));});
test('refused step cannot be relabeled successful',()=>{const p=structuredClone(original);p.queries.at(-1).steps[1].status='SUCCESS';assert.throws(()=>auditPacket(p,e));});
test('amended reader diagnostic packet passes and a changed paid diagnostic is rejected',async()=>{
  const p=JSON.parse(gunzipSync(await readFile(new URL('query-fix1-diagnostic.json.gz',import.meta.url))));
  assert.equal(auditPacket(p,e).diagnostics,4);
  mutateLog(p,'tagReader','DiagnosticRecorded',(log,x,iface)=>{
    const d=Array.from(abi.decode([p.diagnosticAbi],x.args.encodedDiagnostic)[0]);d[7]=false;
    Object.assign(log,iface.encodeEventLog('DiagnosticRecorded',[abi.encode([p.diagnosticAbi],[d])]));
  });assert.throws(()=>auditPacket(p,e));
});
