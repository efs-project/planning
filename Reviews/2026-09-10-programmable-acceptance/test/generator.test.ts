import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('generator rejects duplicate fields, invalid names, unsupported kinds and ambiguous declarations', async () => {
  assert.ok(existsSync(new URL('../generator/generate.mjs', import.meta.url)), 'generator is implemented');
  const { validate, parseDeclaration } = await import('../generator/generate.mjs');
  const valid = { name:'Test', version:'1', fields:[{name:'n',kind:'uint256'}], rule:null };
  assert.doesNotThrow(() => validate([valid]));
  for (const fields of [[],[{name:'n',kind:'string'}],[{name:'n',kind:'uint256'},{name:'n',kind:'bool'}],[{name:'constructor',kind:'bool'}]])
    assert.throws(() => validate([{...valid,fields}]));
  assert.throws(() => validate([valid,valid]));
  assert.throws(() => validate([{...valid, unexpected:true}]));
  assert.throws(() => validate([{...valid,name:'makeCodec'}]));
  assert.throws(() => parseDeclaration('{"name":"One","name":"Two"}'), /duplicate/);
});

test('generated named-field codecs preserve canonical bodies and refuse old-editor unknown exact types', async () => {
  assert.ok(existsSync(new URL('../generated/Outfit.ts', import.meta.url)), 'generated helpers exist');
  const { Outfit } = await import('../generated/Outfit.ts');
  const { OutfitV2 } = await import('../generated/OutfitV2.ts');
  const zero = '0x'+'00'.repeat(32);
  const r = Outfit.registration('0x'+'11'.repeat(32), {});
  const body = Outfit.encode({species:1n,shirt:1n,pants:1n});
  assert.equal(body, '0x'+('0'.repeat(63)+'1').repeat(3));
  assert.deepEqual(Outfit.decode(body), {species:1n,shirt:1n,pants:1n});
  assert.throws(() => Outfit.encode({species:1n,shirt:1n,pants:1n,hidden:2n} as any), /fields/);
  assert.throws(() => Outfit.decode(body+'00'), /canonical/);
  const revised = OutfitV2.registration();
  assert.notEqual(r.typeId,revised.typeId);
  assert.throws(() => Outfit.edit(revised.typeId,r,{species:1n,shirt:1n,pants:1n},zero), /UNKNOWN_EXACT_TYPE/);
  assert.throws(() => Outfit.edit(revised.typeId,{...r,typeId:revised.typeId},{species:1n,shirt:1n,pants:1n},zero), /UNKNOWN_EXACT_TYPE/);
  assert.equal(Outfit.edit(r.typeId,r,{species:1n,shirt:1n,pants:1n},zero).body,body);
  const { encodeFields, decodeFields } = await import('../sdk/codec.ts');
  const fields = [{name:'who',kind:'address'},{name:'ok',kind:'bool'}] as const;
  const mixed = encodeFields(fields,{who:'0x'+'12'.repeat(20),ok:true});
  assert.equal(decodeFields(fields,mixed).ok,true);
  assert.throws(() => decodeFields(fields,'0x'+'ff'.repeat(32)+'0'.repeat(63)+'2'), /canonical/);
});

test('regeneration check compares complete deterministic outputs', () => {
  assert.ok(existsSync(new URL('../generator/generate.mjs', import.meta.url)), 'generator is implemented');
  execFileSync(process.execPath,['generator/generate.mjs','--check'],{cwd:new URL('..',import.meta.url)});
  const descriptor=JSON.parse(readFileSync(new URL('../generated/descriptors.json',import.meta.url),'utf8'));
  assert.equal(descriptor.find((d:any)=>d.name==='Outfit').fields.length,3);
});
