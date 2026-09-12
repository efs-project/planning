import test from 'node:test';
import assert from 'node:assert/strict';
import {E} from '../scripts/world.mjs';
import {createClient,ZERO} from '../sdk/client.mjs';
import {sourceProfile} from '../sdk/qualification.mjs';
const p=sourceProfile('canonical-ref-free-v1'),d=p.canonical.defaultGroup;
const config={rpc:'http://127.0.0.1:1',chainId:31337,genesisHash:ZERO,codeHash:ZERO,deploymentBlockHash:ZERO,kernel:'0x'+'1'.repeat(40),abi:p.filesAbi,registryAbi:p.canonical.registryAbi,errorAbi:p.errorAbi,bytesType:d.ids[1],quoteType:d.ids[0],graph:{},dependencyProfile:p.selection,profileId:p.id,representation:p.canonical.representation,defaultGroupId:d.groupHash};
test('actual canonical client preserves exact u16 payloads, limits and Record identity',()=>{
 const c=createClient(E,config);
 for(const [payload,body]of [['0x','0x0000'],['0x00','0x000100'],['0xef008000','0x0004ef008000'],['0x010000','0x0003010000']]){
  assert.equal(c.encodePayload(config.bytesType,payload),body);assert.equal(c.body(payload),body);assert.equal(E.hexlify(c.decodePayload(config.bytesType,body)),payload);
 }
 assert.equal(c.payloadLimit(config.bytesType),4094);assert.equal(c.representation(config.bytesType),'canonical-u16-bytes');
 assert.equal(E.getBytes(c.encodePayload(config.bytesType,new Uint8Array(4094))).length,4096);
 assert.throws(()=>c.encodePayload(config.bytesType,new Uint8Array(4095)),/4094/);
 for(const body of ['0x','0x00','0x0002ff','0x000001','0xef008000',E.AbiCoder.defaultAbiCoder().encode(['bytes'],['0x'])])assert.throws(()=>c.decodePayload(config.bytesType,body),/u16/);
 assert.throws(()=>c.decodePayload(config.quoteType,'0x0000'),/Unknown Type/);
 const body=E.AbiCoder.defaultAbiCoder().encode(['uint256'],[3000]);
 assert.equal(c.recordId(config.quoteType,body),E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),config.quoteType,E.keccak256(body)])));
});
test('canonical config never guesses old representation labels or Types',()=>{
 for(const changed of [{representation:'canonical'},{representation:'raw'},{rawType:config.bytesType},{bytesType:E.id('wrong')},{defaultGroupId:E.ZeroHash},{profileId:E.ZeroHash},{abi:[]},{registryAbi:[]},{errorAbi:[]}])assert.throws(()=>createClient(E,{...config,...changed}),/profile|Type|representation|graph/i);
});
