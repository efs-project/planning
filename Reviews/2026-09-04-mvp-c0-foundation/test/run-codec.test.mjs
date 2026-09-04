import test from 'node:test';
import assert from 'node:assert/strict';
import { AbiCoder, keccak256, toUtf8Bytes } from 'ethers';
import { encodeSeed, decodeSeed, experimentSeed, encodeDeployment, decodeDeployment, experimentCommitment, c0ProfileId } from '../reference/run-codec.mjs';

// Synthetic values only: neither a valid genesis manifest nor measured limits.
const h = n => '0x' + n.toString(16).padStart(64, '0');
const a = n => '0x' + n.toString(16).padStart(40, '0');
const seed = () => ({ namespace: 'efs2/mvp-c0/2026-09-03', runId: h(1), sourceCommitments: [{label:'a',digest:h(2)}, {label:'b',digest:h(3)}], toolchainCommitments: [{label:'node',digest:h(4)}], chainConfigCommitment:h(5), deploymentFactoryAddress:a(6), coreCreate2Salt:h(0), byteStoreCreate2Salt:h(0), coreCreationCodeTemplateHash:h(7), byteStoreCreationCodeTemplateHash:h(8), codexConstantsHash:h(9), indexCapabilityRoot:h(10), orderedTypeGroupRoot:h(11), schemaAuthorAddress:a(12), bootstrapAuthorAddress:a(13), byteMeasurementReportHash:h(14), maxStateFileBytes:8192n, maxReadRangeBytes:4096n, transactionGasMargin:0n, stateGrowthMargin:1n, destructionPolicyHash:h(15) });
const deployment = () => ({experimentSeed:h(1), coreAddress:a(2), coreCreate2Salt:h(0), coreInitCodeHash:h(3), coreRuntimeCodeHash:h(4), byteStoreAddress:a(5), byteStoreCreate2Salt:h(0), byteStoreInitCodeHash:h(6), byteStoreRuntimeCodeHash:h(7)});
// Hand-built packed expectations, independent of either encoder.
const seedHex = () => '0x0016656673322f6d76702d63302f323032362d30392d3033' + h(1).slice(2) + '000200000023000161'+h(2).slice(2)+'00000023000162'+h(3).slice(2)+'00010000002600046e6f6465'+h(4).slice(2)+h(5).slice(2)+a(6).slice(2)+h(0).slice(2).repeat(2)+[7,8,9,10,11].map(x=>h(x).slice(2)).join('')+a(12).slice(2)+a(13).slice(2)+h(14).slice(2)+'0000000000002000000000000000100000000000000000000000000000000001'+h(15).slice(2);
const deploymentHex = () => '0x'+[h(1),a(2),h(0),h(3),h(4),a(5),h(0),h(6),h(7)].map(x=>x.slice(2)).join('');
const hashDomain = (name, values) => keccak256(AbiCoder.defaultAbiCoder().encode(values.map(()=> 'bytes32'), [keccak256(toUtf8Bytes(name)), ...values.slice(1)]));

test('seed fixed-width order matches hand-packed fixture and round trips', () => {
  assert.equal(encodeSeed(seed()), seedHex());
  assert.deepEqual(decodeSeed(seedHex()), seed());
});
test('deployment is exactly 264 packed bytes and round trips', () => {
  assert.equal(encodeDeployment(deployment()), deploymentHex());
  assert.equal((deploymentHex().length-2)/2,264);
  assert.deepEqual(decodeDeployment(deploymentHex()),deployment());
});
test('strict decoders reject every truncated prefix and trailing byte', () => {
  for (const [decode, bytes] of [[decodeSeed,seedHex()],[decodeDeployment,deploymentHex()]]) {
    for(let i=2;i<bytes.length;i+=2) assert.throws(()=>decode(bytes.slice(0,i)),`prefix ${i}`);
    assert.throws(()=>decode(bytes+'00'));
    assert.throws(()=>decode(bytes+'f'));
  }
});
test('namespace, commitment lengths, labels, digest and ordering are strict', () => {
  const variants = [[], Array.from({length:65},(_,i)=>({label:String(i),digest:h(1)})), [{label:'',digest:h(1)}], [{label:'a'.repeat(65),digest:h(1)}], [{label:'é',digest:h(1)}], [{label:'a b',digest:h(1)}], [{label:'a',digest:h(0)}], [{label:'b',digest:h(1)},{label:'a',digest:h(2)}], [{label:'a',digest:h(1)},{label:'a',digest:h(2)}]];
  for(const field of ['sourceCommitments','toolchainCommitments']) for(const value of variants) assert.throws(()=>encodeSeed({...seed(),[field]:value}));
  assert.throws(()=>encodeSeed({...seed(),namespace:'efs2/mvp-c0/2026-09-04'}));
  assert.throws(()=>decodeSeed(seedHex().replace('65667332','66667332')));
  // Corrupt elementLength, count, and a label directly in otherwise valid bytes.
  for(const [offset,value] of [[56,'0000'],[56,'0041'],[58,'00000022'],[58,'00000024'],[96,'00'],[103,'61']]) {
    const b=Buffer.from(seedHex().slice(2),'hex'); Buffer.from(value,'hex').copy(b,offset); assert.throws(()=>decodeSeed('0x'+b.toString('hex')));
  }
});
test('required zero fields and equal authors/addresses reject', () => {
  for(const [key,value] of Object.entries(seed())) if(typeof value==='string' && value.startsWith('0x') && !key.endsWith('Salt')) assert.throws(()=>encodeSeed({...seed(),[key]:'0x'+'0'.repeat(value.length-2)}),key);
  for(const [key,value] of Object.entries(deployment())) if(!key.endsWith('Salt')) assert.throws(()=>encodeDeployment({...deployment(),[key]:'0x'+'0'.repeat(value.length-2)}),key);
  assert.throws(()=>encodeSeed({...seed(),bootstrapAuthorAddress:seed().schemaAuthorAddress}));
  assert.throws(()=>encodeDeployment({...deployment(),byteStoreAddress:deployment().coreAddress}));
  assert.throws(()=>encodeSeed({...seed(),maxStateFileBytes:0n}));
  assert.throws(()=>encodeSeed({...seed(),maxReadRangeBytes:0n}));
  assert.throws(()=>encodeSeed({...seed(),maxReadRangeBytes:8193n}));
});
test('u64 max survives exactly; negative, overflow and all Numbers reject', () => {
  const max=(1n<<64n)-1n;
  for(const key of ['maxStateFileBytes','maxReadRangeBytes','transactionGasMargin','stateGrowthMargin']) {
    assert.equal(decodeSeed(encodeSeed({...seed(),maxStateFileBytes:max,[key]:max}))[key],max);
    for(const value of [-1n,1n<<64n,1,Number.MAX_SAFE_INTEGER+1,'01','-1','1.0','1e3']) assert.throws(()=>encodeSeed({...seed(),[key]:value}));
  }
  assert.equal(decodeSeed(encodeSeed({...seed(),transactionGasMargin:max.toString()})).transactionGasMargin,max);
  for(const value of ['0x01','0x'+'1'.repeat(66),'not hex']) assert.throws(()=>encodeDeployment({...deployment(),experimentSeed:value}));
});
test('source and toolchain changes affect seed; every deployment field affects commitment', () => {
  for(const field of ['sourceCommitments','toolchainCommitments']) {
    assert.notEqual(experimentSeed({...seed(),[field]:[{label:'changed',digest:h(42)}]}),experimentSeed(seed()));
    assert.notEqual(experimentSeed({...seed(),[field]:seed()[field].map((x,i)=>i?x:{...x,digest:h(42)})}),experimentSeed(seed()));
  }
  for(const [key,value] of Object.entries(deployment())) assert.notEqual(experimentCommitment({...deployment(),[key]:value.length===42?a(42):h(42)}),experimentCommitment(deployment()),key);
});
test('original ABI domain formulas are retained, not packed struct hashes alone', () => {
  const seedHash=hashDomain('efs2/mvp-c0/experiment-seed/1',[null,keccak256(seedHex())]);
  const finalHash=hashDomain('efs2/mvp-c0/experiment-deployment/1',[null,h(1),keccak256(deploymentHex())]);
  assert.equal(experimentSeed(seed()),seedHash);
  assert.equal(experimentCommitment(deployment()),finalHash);
  assert.equal(c0ProfileId(finalHash),hashDomain('efs2/mvp-c0/profile/1',[null,finalHash]));
  assert.throws(()=>c0ProfileId(h(0)));
});

test('maximum commitment count and label width accept canonical unsigned ASCII order', () => {
  const entries=Array.from({length:64},(_,i)=>({label:`a${i.toString().padStart(2,'0')}`.padEnd(64,'z'),digest:h(i+1)}));
  const s={...seed(),sourceCommitments:entries,toolchainCommitments:entries};
  assert.deepEqual(decodeSeed(encodeSeed(s)),s);
  const ordered=['-','.','/','0','A','Z','_','a','a/','aa','z'].map(label=>({label,digest:h(1)}));
  assert.deepEqual(decodeSeed(encodeSeed({...seed(),sourceCommitments:ordered})).sourceCommitments,ordered);
  assert.throws(()=>encodeSeed({...seed(),sourceCommitments:[{label:'aa',digest:h(1)},{label:'a',digest:h(1)}]}));
});

test('decoder validates all required fields and cap relationships, not just framing', () => {
  const zeroAt=(bytes,offset,width)=>{ const b=Buffer.from(bytes.slice(2),'hex'); b.fill(0,offset,offset+width); return '0x'+b.toString('hex'); };
  for(const [offset,width] of [[24,32],[65,32],[104,32],[148,32],[180,32],[212,20],[296,32],[328,32],[360,32],[392,32],[424,32],[456,20],[476,20],[496,32],[528,8],[536,8],[560,32]]) assert.throws(()=>decodeSeed(zeroAt(seedHex(),offset,width)),`seed ${offset}`);
  for(const [offset,width] of [[0,32],[32,20],[84,32],[116,32],[148,20],[200,32],[232,32]]) assert.throws(()=>decodeDeployment(zeroAt(deploymentHex(),offset,width)),`deployment ${offset}`);
  let b=Buffer.from(seedHex().slice(2),'hex'); b.copy(b,476,456,476); assert.throws(()=>decodeSeed('0x'+b.toString('hex')));
  b=Buffer.from(deploymentHex().slice(2),'hex'); b.copy(b,148,32,52); assert.throws(()=>decodeDeployment('0x'+b.toString('hex')));
  b=Buffer.from(seedHex().slice(2),'hex'); b.writeBigUInt64BE(8193n,536); assert.throws(()=>decodeSeed('0x'+b.toString('hex')));
});
