import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { Wallet, ZeroAddress, ZeroHash, id } from 'ethers';

test('planning snapshots intent and signatures bind activation, bytes, funding and order without effect claims',async()=>{
  assert.ok(existsSync(new URL('../sdk/adapter.ts',import.meta.url)), 'adapter implemented');
  const { planWrite, authorize, recoverAuthor, scopedPage }=await import('../sdk/adapter.ts');
  const signer=Wallet.createRandom();
  const context={chainId:31337n,core:'0x'+'11'.repeat(20)};
  const items=[{typeId:id('one'),activationId:id('activation'),body:'0x1234',value:2n},{typeId:id('two'),activationId:ZeroHash,body:'0xab',value:0n}];
  const input={author:signer.address,executor:ZeroAddress,nonce:0n,deadline:123n,items};
  const p=planWrite(context,input,[]);
  const a=await authorize(p,signer);
  assert.equal(recoverAuthor(a),signer.address);
  assert.equal(a.effect,'UNKNOWN');
  items[0].body='0x5678';
  assert.equal(p.plan.items[0].body,'0x1234');
  for(const mutation of [
    {...p.plan,items:[{...p.plan.items[0],activationId:ZeroHash},p.plan.items[1]]},
    {...p.plan,items:[{...p.plan.items[0],body:'0x5678'},p.plan.items[1]]},
    {...p.plan,items:[{...p.plan.items[0],value:3n},p.plan.items[1]]},
    {...p.plan,items:[...p.plan.items].reverse()}
  ]) assert.notEqual(recoverAuthor({...a,planned:planWrite(context,mutation,[])}),signer.address);
  assert.equal(scopedPage({scope:'all receipts'}).support,'UNSUPPORTED');
});

test('generic inspector displays descriptor and evidence safely with unknown Type editing refused', async()=>{
  assert.ok(existsSync(new URL('../web/inspector.ts',import.meta.url)), 'inspector implemented');
  const { inspect }=await import('../web/inspector.ts');
  const { Outfit }=await import('../generated/Outfit.ts');
  const reg=Outfit.registration(id('code'),{});
  const hostile={...Outfit.declaration,name:'<img src=x onerror="globalThis.pwned=1">',fields:Outfit.declaration.fields.map((f,i)=>({...f,name:i===0?'<script>globalThis.pwned=1</script>':f.name}))};
  const bundle={typeId:reg.typeId,descriptor:{...hostile,descriptor:reg.descriptor},body:Outfit.encode({species:1n,shirt:1n,pants:1n}),receipt:{basis:'known application basis',ruleId:'mandatory rule'},basis:{blockNumber:9,blockHash:id('block')},effect:'UNKNOWN'};
  const html=inspect(bundle);
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('known application basis'));
  assert.ok(html.includes('outfit.compatibility.v1'));
  assert.ok(!html.includes('<script>'));
  assert.ok(inspect({...bundle,descriptor:undefined}).includes('UNKNOWN_EXACT_TYPE'));
});
