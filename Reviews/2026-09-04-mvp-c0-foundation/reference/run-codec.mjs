// Disposable synthetic-run codec; no sample is valid genesis evidence.
// This implementation does not call the Solidity encoder or hash helpers.
import { AbiCoder, keccak256, toUtf8Bytes } from 'ethers';

const NAMESPACE = 'efs2/mvp-c0/2026-09-03';
const seedTail = [
  ['chainConfigCommitment',32], ['deploymentFactoryAddress',20],
  ['coreCreate2Salt',32,true], ['byteStoreCreate2Salt',32,true],
  ['coreCreationCodeTemplateHash',32], ['byteStoreCreationCodeTemplateHash',32],
  ['codexConstantsHash',32], ['indexCapabilityRoot',32], ['orderedTypeGroupRoot',32],
  ['schemaAuthorAddress',20], ['bootstrapAuthorAddress',20], ['byteMeasurementReportHash',32],
  ['maxStateFileBytes',8], ['maxReadRangeBytes',8], ['transactionGasMargin',8],
  ['stateGrowthMargin',8], ['destructionPolicyHash',32],
];
const deploymentFields = [
  ['experimentSeed',32], ['coreAddress',20], ['coreCreate2Salt',32,true],
  ['coreInitCodeHash',32], ['coreRuntimeCodeHash',32], ['byteStoreAddress',20],
  ['byteStoreCreate2Salt',32,true], ['byteStoreInitCodeHash',32], ['byteStoreRuntimeCodeHash',32],
];
function check(ok, reason) { if(!ok) throw new Error(`C0 codec: ${reason}`); }
function uint(value,width) {
  check(typeof value==='bigint'||typeof value==='string'&&/^(0|[1-9][0-9]*)$/.test(value),'integer must be BigInt or canonical decimal');
  const n=BigInt(value); check(n>=0n&&n<(1n<<BigInt(width*8)),'integer width');
  return Buffer.from(n.toString(16).padStart(width*2,'0'),'hex');
}
function hex(value,width,allowZero=false) {
  check(typeof value==='string'&&new RegExp(`^0x[0-9a-fA-F]{${width*2}}$`).test(value),'hex width');
  const bytes=Buffer.from(value.slice(2),'hex'); check(allowZero||bytes.some(x=>x!==0),'zero required field'); return bytes;
}
function ascii(value) {
  check(typeof value==='string'&&/^[\x00-\x7f]*$/.test(value),'ASCII string');
  const bytes=Buffer.from(value,'ascii'); return Buffer.concat([uint(BigInt(bytes.length),2),bytes]);
}
function commitments(values) {
  check(Array.isArray(values)&&values.length>=1&&values.length<=64,'commitment count');
  let previous=''; const parts=[uint(BigInt(values.length),2)];
  for(const {label,digest} of values) {
    check(typeof label==='string'&&/^[A-Za-z0-9._/-]{1,64}$/.test(label),'commitment label');
    check(label>previous,'commitment order'); previous=label;
    const element=Buffer.concat([ascii(label),hex(digest,32)]);
    parts.push(uint(BigInt(element.length),4),element);
  }
  return Buffer.concat(parts);
}
const fields = (value,schema) => schema.map(([name,width,zero])=>width===8?uint(value[name],width):hex(value[name],width,zero));
function validateSeed(s) {
  check(s.namespace===NAMESPACE,'namespace');
  check(s.schemaAuthorAddress.toLowerCase()!==s.bootstrapAuthorAddress.toLowerCase(),'equal authors');
  check(BigInt(s.maxReadRangeBytes)>0n&&BigInt(s.maxStateFileBytes)>0n&&BigInt(s.maxReadRangeBytes)<=BigInt(s.maxStateFileBytes),'caps');
}
export function encodeSeed(s) {
  const parts=[ascii(s.namespace),hex(s.runId,32),commitments(s.sourceCommitments),commitments(s.toolchainCommitments),...fields(s,seedTail)];
  validateSeed(s); return '0x'+Buffer.concat(parts).toString('hex');
}
class Reader {
  constructor(value) { check(typeof value==='string'&&/^0x(?:[0-9a-fA-F]{2})*$/.test(value),'hex bytes'); this.b=Buffer.from(value.slice(2),'hex'); this.p=0; }
  take(n) { check(n<=this.b.length-this.p,'truncated'); const value=this.b.subarray(this.p,this.p+n); this.p+=n; return value; }
  uint(n) { return BigInt('0x'+this.take(n).toString('hex')); }
  hex(n) { return '0x'+this.take(n).toString('hex'); }
  string(max) { const n=Number(this.uint(2)); check(n<=max,'string length'); const b=this.take(n); check(b.every(x=>x<128),'ASCII string'); return b.toString('ascii'); }
  commitments() {
    const count=Number(this.uint(2)); check(count>=1&&count<=64,'commitment count');
    const result=[]; let previous='';
    for(let i=0;i<count;++i) {
      const length=Number(this.uint(4)); check(length>=35&&length<=98,'element length');
      check(length<=this.b.length-this.p,'truncated element'); const end=this.p+length;
      const label=this.string(64); check(/^[A-Za-z0-9._/-]{1,64}$/.test(label)&&label>previous,'commitment label/order');
      previous=label; const digest=this.hex(32); check(this.p===end,'element framing'); hex(digest,32); result.push({label,digest});
    }
    return result;
  }
  fields(schema) { return Object.fromEntries(schema.map(([name,width])=>[name,width===8?this.uint(width):this.hex(width)])); }
  done() { check(this.p===this.b.length,'trailing bytes'); }
}
export function decodeSeed(bytes) {
  const r=new Reader(bytes); const namespace=r.string(22); check(namespace===NAMESPACE,'namespace');
  const s={namespace,runId:r.hex(32),sourceCommitments:r.commitments(),toolchainCommitments:r.commitments(),...r.fields(seedTail)};
  r.done(); hex(s.runId,32); fields(s,seedTail); validateSeed(s); return s;
}
export function encodeDeployment(d) {
  const parts=fields(d,deploymentFields);
  check(d.coreAddress.toLowerCase()!==d.byteStoreAddress.toLowerCase(),'equal deployment addresses');
  return '0x'+Buffer.concat(parts).toString('hex');
}
export function decodeDeployment(bytes) {
  const r=new Reader(bytes); check(r.b.length===264,'deployment length');
  const d=r.fields(deploymentFields); r.done(); fields(d,deploymentFields);
  check(d.coreAddress!==d.byteStoreAddress,'equal deployment addresses'); return d;
}
function domainHash(domain,values) {
  return keccak256(AbiCoder.defaultAbiCoder().encode(Array(values.length+1).fill('bytes32'),[keccak256(toUtf8Bytes(domain)),...values]));
}
export function experimentSeed(s) { return domainHash('efs2/mvp-c0/experiment-seed/1',[keccak256(encodeSeed(s))]); }
export function experimentCommitment(d) { return domainHash('efs2/mvp-c0/experiment-deployment/1',[d.experimentSeed,keccak256(encodeDeployment(d))]); }
export function c0ProfileId(commitment) { hex(commitment,32); return domainHash('efs2/mvp-c0/profile/1',[commitment]); }
