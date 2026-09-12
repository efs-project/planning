// Pre-integration capability REDs: real source selector and actual existing client.
import test from 'node:test';
import assert from 'node:assert/strict';
import {E} from '../scripts/world.mjs';
import {createClient,ZERO} from '../sdk/client.mjs';
import {sourceProfile,graphIdentity} from '../sdk/qualification.mjs';
const config={rpc:'http://127.0.0.1:1',chainId:31337,genesisHash:ZERO,codeHash:ZERO,deploymentBlockHash:ZERO,kernel:'0x'+'1'.repeat(40),abi:[],bytesType:E.id('canonical'),rawType:E.id('raw'),quoteType:E.id('uint'),graph:{}};
test('actual source selector supports explicit canonical ref-free profile',()=>{
  const profile=sourceProfile('canonical-ref-free-v1');
  const canonical={...config,abi:profile.filesAbi,registryAbi:profile.canonical.registryAbi,errorAbi:profile.errorAbi,rawType:undefined,bytesType:profile.canonical.defaultGroup.ids[1],quoteType:profile.canonical.defaultGroup.ids[0],representation:profile.canonical.representation,defaultGroupId:profile.canonical.defaultGroup.groupHash,dependencyProfile:'canonical-ref-free-v1',profileId:profile.id};
  assert.doesNotThrow(()=>graphIdentity(E,canonical));
});
test('historical client retains ABI framing as an explicit canonical difference',()=>{
  const client=createClient(E,{...config,dependencyProfile:'current',profileId:sourceProfile('current').id});
  assert.notEqual(client.encodePayload(config.bytesType,'0x'),'0x0000');
  assert.notEqual(client.encodePayload(config.bytesType,'0xef008000'),'0x0004ef008000');
});
