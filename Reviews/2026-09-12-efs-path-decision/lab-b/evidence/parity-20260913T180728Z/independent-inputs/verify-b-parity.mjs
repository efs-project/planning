/** Read-only offline QA of independently generated vectors; no RPC/compiler/results. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { derivePaidVectors, verifyPaidAbi } from './generate-b-parity.mjs';
const require = createRequire(import.meta.url);
const { AbiCoder, keccak256, toUtf8Bytes, getCreateAddress } = require('ethers');
const abi = AbiCoder.defaultAbiCoder();
const inputPath = new URL('./b-parity-inputs.json', import.meta.url);
const p = JSON.parse(readFileSync(inputPath));
const neutral = JSON.parse(readFileSync(p.neutralPin.path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(readFileSync(new URL('./generate-b-parity.mjs', import.meta.url))), p.generatorSha256);
assert.equal(sha(readFileSync(p.neutralPin.path)), p.neutralPin.sha256);
assert.deepEqual(derivePaidVectors({inputs:p.baselineInputs, coordinates:p.coordinates, runtime:p.runtime, neutral}), {inputs:p.inputs, rows:p.paidRows});
const ex = 'bytes32,bytes32,address,uint8,bytes32,bytes32,bytes32,uint256,uint8,uint64,bytes32,uint64,uint32';
const plx = 'bytes32,bytes32,address,uint8,uint64,uint256';
const sel = 'uint64,uint64,uint64,bytes32,bytes32,bytes32,bytes32,uint32,uint64,uint64,address,uint8,bytes32,bytes32,bytes32,uint256,uint8,uint64,bytes32';
const pl = 'bytes32,address,uint8,uint32,uint64,uint64,uint64,uint8,uint64,uint64,uint64,uint64,bool,bool';
const topic0 = keccak256(toUtf8Bytes(`PaidResult(bytes32,bytes32,(${sel}),(${pl}))`));
for (const row of p.paidRows) {
  const list = row.operation === 'PAID_LIST';
  const mode = row.lens === 'LENS_A_FIRST' ? 'A_FIRST' : 'B_FIRST';
  const e = p.inputs.expect[mode];
  const signature = list ? `paidList(address[],(${ex}),(${plx}))` : `paidPoint(address[],(${ex}))`;
  const selector = keccak256(toUtf8Bytes(signature)).slice(0, 10);
  const headWords = list ? 20 : 14;
  const head = abi.encode(['uint256', ...ex.split(','), ...(list ? plx.split(',') : [])], [headWords * 32, ...Object.values(e), ...(list ? Object.values(p.inputs.placementExpect) : [])]);
  const tail = abi.encode(['uint256', 'address', 'address'], [2, ...p.inputs.lenses[row.lens]]);
  assert.equal(row.data, selector + head.slice(2) + tail.slice(2));
  assert.equal((row.data.length - 2) / 2, list ? 740 : 548);
  const selectionWords = abi.encode(sel.split(','), Object.values(row.selection));
  const placementWords = abi.encode(pl.split(','), Object.values(row.placement));
  assert.equal(row.expectedEvent.data, row.commitment + selectionWords.slice(2) + placementWords.slice(2));
  assert.equal(row.expectedEvent.topics[0], topic0);
  const kind = keccak256(toUtf8Bytes(list ? 'paid/list' : 'paid/point'));
  assert.equal(row.expectedEvent.topics[1], kind);
  assert.equal(row.commitmentPreimage, kind + selectionWords.slice(2) + placementWords.slice(2));
  assert.equal(row.commitment, keccak256(row.commitmentPreimage));
  assert.equal(row.expectedReturn, row.commitment + selectionWords.slice(2) + (list ? placementWords.slice(2) : ''));
  if (!list) assert.equal(placementWords, `0x${'0'.repeat(14 * 64)}`);
  assert.equal(row.selection.selectedRevision, mode === 'A_FIRST' ? '2' : '1');
  assert.equal(row.to, p.runtime.targets.joinedConsumer.address);
}
for (const [name, target] of Object.entries(p.runtime.targets)) {
  assert.equal(keccak256(target.expectedRuntime), target.runtimeCodehash, name);
  assert.equal(keccak256(target.expectedInitcode), target.initcodeHash, name);
  assert.equal((target.expectedRuntime.length - 2) / 2, target.runtimeBytes);
  assert.equal((target.expectedInitcode.length - 2) / 2, target.initcodeBytes);
  assert.equal(getCreateAddress({from:p.runtime.deployer,nonce:target.nonce}).toLowerCase(), target.address);
  for (const sub of target.substitutions) for (const start of sub.offsets) assert.equal(`0x${target.expectedRuntime.slice(2+start*2,2+(start+32)*2)}`,sub.value);
}
for (const artifact of Object.values(p.artifactPins)) assert.equal(sha(readFileSync(artifact.path)), artifact.sha256);
for (const source of Object.values(p.sourcePins)) assert.equal(sha(readFileSync(source.path)), source.sha256);
for (const helper of Object.values(p.helpers)) assert.equal(sha(readFileSync(helper.path)), helper.sha256);
const artifact = JSON.parse(readFileSync(p.artifactPins['src/JoinedConsumer.sol:JoinedConsumer'].path));
verifyPaidAbi(artifact.abi);
const mutate = fn => { const altered = structuredClone(artifact.abi); fn(altered); assert.throws(() => verifyPaidAbi(altered), /ABI mismatch/); };
mutate(a => a.find(x=>x.name==='paidPoint').inputs[1].components.pop());
mutate(a => a.find(x=>x.name==='paidList').inputs[1].components.at(-1).type='uint64');
mutate(a => a.find(x=>x.name==='paidPoint').outputs[1].components.push({name:'unknown',type:'bytes32'}));
mutate(a => a.find(x=>x.name==='PaidResult').inputs[0].indexed=false);
mutate(a => a.find(x=>x.name==='PaidResult').inputs[3].components.at(-1).type='uint8');
console.log(JSON.stringify({result:'PASS_OFFLINE_INPUT_QA', rows:p.paidRows.length, deployments:Object.keys(p.runtime.targets).length, abiMutationRefusals:5, inputSha256:sha(readFileSync(inputPath)), generatorSha256:p.generatorSha256,
  joinedConsumer:{address:p.runtime.targets.joinedConsumer.address,runtimeBytes:p.runtime.targets.joinedConsumer.runtimeBytes,runtimeCodehash:p.runtime.targets.joinedConsumer.runtimeCodehash,initcodeBytes:p.runtime.targets.joinedConsumer.initcodeBytes,initcodeHash:p.runtime.targets.joinedConsumer.initcodeHash},
  calldataSelectors:p.paidRows.map(x=>({row:x.row,selector:x.data.slice(0,10),commitment:x.commitment}))},null,2));
