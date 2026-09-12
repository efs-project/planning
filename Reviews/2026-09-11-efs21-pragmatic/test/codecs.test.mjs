import test from 'node:test';
import assert from 'node:assert/strict';
import {E} from '../scripts/world.mjs';
import {createClient,ZERO} from '../sdk/client.mjs';
import {sourceProfile} from '../sdk/qualification.mjs';
const config={rpc:'http://127.0.0.1:1',chainId:31337,genesisHash:ZERO,codeHash:ZERO,deploymentBlockHash:ZERO,kernel:'0x'+'1'.repeat(40),abi:[],bytesType:E.id('canonical'),rawType:E.id('raw'),quoteType:E.id('uint')};
test('per-Type codecs preserve exact binary/empty payloads and reject unsupported interpretation',()=>{
  const c=createClient(E,{...config,dependencyProfile:'current',profileId:sourceProfile('current').id,graph:{}});
  assert.equal(typeof c.encodePayload,'function');
  const abi=E.AbiCoder.defaultAbiCoder();
  for(const hex of ['0x','0x00','0xef00ff8000',abi.encode(['bytes'],['0x012300'])]){
    assert.equal(c.encodePayload(config.rawType,hex),hex);
    assert.equal(c.encodePayload(config.bytesType,hex),abi.encode(['bytes'],[hex]));
    for(const typeId of [config.rawType,config.bytesType])assert.equal(E.hexlify(c.decodePayload(typeId,c.encodePayload(typeId,hex))),hex);
  }
  assert.equal(c.payloadLimit(config.rawType),4096);
  assert.equal(c.payloadLimit(config.bytesType),4032);
  assert.equal(E.getBytes(c.encodePayload(config.rawType,new Uint8Array(4096))).length,4096);
  assert.throws(()=>c.encodePayload(config.rawType,new Uint8Array(4097)),/4096/);
  assert.throws(()=>c.encodePayload(config.bytesType,new Uint8Array(4033)),/4032/);
  assert.throws(()=>c.decodePayload(config.bytesType,'0x'),/canonical/i);
  assert.throws(()=>c.decodePayload(config.bytesType,abi.encode(['bytes'],['0x01']).slice(0,-2)+'ff'),/canonical/i);
  assert.throws(()=>c.decodePayload(E.id('unknown'),'0x616263'),/Unknown Type/);
  assert.throws(()=>c.encodePayload(config.quoteType,'0x01'),/Unknown Type/);
  assert.equal(c.body('0x00'),abi.encode(['bytes'],['0x00']),'legacy body remains canonical');
});
