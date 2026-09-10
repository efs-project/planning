import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { Outfit } from '../generated/Outfit.ts';
import { inspect } from '../web/inspector.ts';
import { id } from 'ethers';

test('actual Chromium renders hostile labels inert and displays fields, rule and retained basis',async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage();
  const descriptor={...Outfit.declaration,descriptor:Outfit.descriptor,name:'<img src=x onerror="globalThis.pwned=1">',fields:Outfit.declaration.fields.map((f,i)=>({...f,name:i===0?'<script>globalThis.pwned=1</script>':f.name}))};
  await page.setContent(inspect({typeId:id('type'),descriptor,body:Outfit.encode({species:1n,shirt:1n,pants:1n}),receipt:{basis:'historical basis 42'},basis:{blockNumber:42,blockHash:id('block')},effect:'UNKNOWN'}));
  assert.equal(await page.locator('img,script').count(),0);
  assert.equal(await page.evaluate(()=>Object.hasOwn(globalThis,'pwned')),false);
  const text=await page.locator('body').innerText();
  for(const expected of ['<img src=x','<script>globalThis.pwned=1</script>','shirt','pants','outfit.compatibility.v1','historical basis 42','UNTRUSTED_DISPLAY_METADATA','NOT_EVALUATED']) assert.ok(text.includes(expected),expected);
  await page.setContent(inspect({typeId:id('unknown'),body:'0x1234',receipt:{},basis:{},effect:'UNKNOWN'}));
  assert.ok((await page.locator('body').innerText()).includes('UNKNOWN_EXACT_TYPE — editing refused'));
 } finally {await browser.close();}
});
