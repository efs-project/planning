import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createCompactEngine, createExactReadCache} from './compact-sdk.mjs';

const ethers = await import(pathToFileURL(`${process.env.EFS_ETHERS_PATH}/lib.esm/index.js`));
const abi = ['function probe() view returns (bytes)'];
const iface = new ethers.Interface(abi);
const address = '0x0000000000000000000000000000000000000001';
const context = {blockHash: ethers.id('decode-once'), requireCanonical: true};
const encoded = iface.encodeFunctionResult('probe', ['0x1234']);

test('one validated decode per caller, with distinct Results across cache miss and hit', async () => {
  let decodes = 0, transportCalls = 0, call;
  class CountingInterface extends ethers.Interface {
    decodeFunctionResult(...args) {decodes++; return super.decodeFunctionResult(...args);}
  }
  createCompactEngine({ethers: {...ethers, Interface: CountingInterface},
    rpc: async () => {transportCalls++; return encoded;},
    manifest: {contracts: {index: {address, abi: ['function attachedFrom() view returns (uint64)']},
      probe: {address, abi}}}}, scope => {call = scope.call; return {};});
  const first = await call('probe', 'probe', [], context);
  assert.equal(first[0], '0x1234');
  assert.equal(decodes, 1, 'cache miss validates and returns the same decoded Result');
  const second = await call('probe', 'probe', [], context);
  assert.equal(second[0], '0x1234');
  assert.equal(decodes, 2, 'cache hit validates and returns one new decoded Result');
  assert.notStrictEqual(second, first, 'Results are never shared between callers');
  assert.equal(transportCalls, 1, 'the hit reuses only cached raw bytes');
  const concurrentContext = {blockHash: ethers.id('decode-once-inflight'), requireCanonical: true};
  const [third, fourth] = await Promise.all([
    call('probe', 'probe', [], concurrentContext), call('probe', 'probe', [], concurrentContext),
  ]);
  assert.equal(decodes, 4, 'each concurrent caller validates and decodes once');
  assert.notStrictEqual(third, fourth, 'inflight callers also own distinct Results');
  assert.equal(transportCalls, 2, 'inflight callers share only one raw load');
});

test('corrupt raw ABI bytes fail validation on cache miss and cache hit', async () => {
  const cache = createExactReadCache({identity: 'decode-validation'});
  const params = [{to: address, data: iface.encodeFunctionData('probe')}, context];
  const validate = raw => {
    const value = iface.decodeFunctionResult('probe', raw);
    assert.equal(ethers.checkResultErrors(value).length, 0);
  };
  await assert.rejects(cache.read('eth_call', params, async () => '0x1234', validate));
  assert.equal(cache.stats().entries, 0, 'invalid miss is never cached');
  await cache.read('eth_call', params, async () => '0x1234'); // Test-only corrupt raw cache entry.
  await assert.rejects(cache.read('eth_call', params, async () => {throw Error('unexpected load');}, validate));
  assert.equal(cache.stats().hits, 1, 'the invalid cached bytes were revalidated');
});
