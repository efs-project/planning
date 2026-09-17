import test from 'node:test';
import assert from 'node:assert/strict';
import * as ethers from 'ethers';
import * as fees from './fee-model.mjs';

const entry={transaction:{to:'0x'+'12'.repeat(20),data:'0x'+'ab'.repeat(175),value:'0'}};
test('decimal gas input is exact at wei precision, bounded and fails closed',()=>{
  const economics=fees.resolveEconomics();
  for(const [input,want] of [['0.000000015',15n],['1.5e-8',15n],[0.000000015,15n],['0',0n],['.006',6000000n],['1.0000000000',1000000000n],['9007199.254740993',9007199254740993n],['0.0000000001',null],['-1',null],['NaN',null],['Infinity',null],['',null],['1x',null],['0x10',null],['1e999999',null],['1'.repeat(300),null]]){
    economics.networks[0].gasGwei=input;
    assert.equal(fees.modelAction(entry,1n,economics,ethers).ethereum.executionWei,want,String(input));
  }
});
test('Fjord offline practical data bound matches captured oracle, including the floor',()=>{
  assert.deepEqual(fees.baseDataFee(219),{floorWei:1208961210n,scenarioWei:2559496613n});
  assert.equal(fees.baseDataFee(1000).scenarioWei,10488057663n);
  assert.equal(fees.baseDataFee(10000).scenarioWei,101858655986n);
});
test('full-action models separate execution data and operator without L1 calldata double count',()=>{
  const model=fees.modelAction(entry,100000n,fees.resolveEconomics(),ethers);
  assert.equal(model.ethereum.executionWei,9729670000000n);
  assert.equal(model.ethereum.scenarioWei,9729670000000n);
  assert.equal(model.base.operatorWei,0n);
  assert.equal(model.base.unsignedBytes,219);
  assert.equal(model.base.scenarioWei,602559496613n);
  assert.equal(model.arbitrum.dataWei,11289912480n);
  assert.equal(model.arbitrum.scenarioWei,2011889912480n);
});
test('missing receipt, calldata, fee inputs or serialization never become all-in zero',()=>{
  assert.equal(fees.modelAction(entry,null,fees.resolveEconomics(),ethers).base.scenarioWei,null);
  const incomplete=fees.modelAction({},100000n,fees.resolveEconomics(),ethers);
  assert.equal(incomplete.base.scenarioWei,null);
  assert.equal(incomplete.base.executionWei,600000000000n);
  assert.equal(incomplete.arbitrum.scenarioWei,null);
  const economics=fees.resolveEconomics();economics.baseInputs=null;
  assert.equal(fees.modelAction(entry,100000n,economics,ethers).base.scenarioWei,null);
});
test('known legacy defaults refresh in memory while deliberate edits and explicit unknowns survive',()=>{
  const old={asOf:'2026-09-14T19:45:15Z',ethUsd:2544.385,networks:[{id:'ethereum',gasGwei:0.0953168,extraUsd:0},{id:'base',gasGwei:0.02,extraUsd:1}]};
  const value=fees.resolveEconomics(old);
  assert.equal(value.ethUsd,2450.845);
  assert.equal(value.networks.find(n=>n.id==='ethereum').gasGwei,0.0972967);
  assert.equal(value.networks.find(n=>n.id==='base').gasGwei,0.02);
  assert.equal(value.networks.find(n=>n.id==='base').extraUsd,1);
  assert.equal(old.ethUsd,2544.385);
  assert.equal(fees.resolveEconomics({...old,ethUsd:null}).ethUsd,null);
});
