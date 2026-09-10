import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { id, ZeroHash } from 'ethers';
import { typeId } from '../sdk/codec.ts';
import { Outfit } from '../generated/Outfit.ts';
import { Equip } from '../generated/Equip.ts';

test('generated writes reject stripped and changed mandatory rules, preserving explicit parameterized configuration',()=>{
 const honest=Outfit.registration(id('code'),{}),value={species:1n,shirt:2n,pants:1n};
 for(const rule of [
  {codeHash:ZeroHash,semanticConfig:ZeroHash,mode:0,gasLimit:0},
  {...honest.rule,mode:2}, {...honest.rule,gasLimit:500000}, {...honest.rule,semanticConfig:id('wrong')}
 ]) {
  const forged={...honest,rule,typeId:typeId(honest.descriptor,honest.kinds,rule)};
  assert.throws(()=>Outfit.edit(forged.typeId,forged,value,ZeroHash),/UNKNOWN_EXACT_TYPE/);
  assert.throws(()=>Outfit.item(forged,value,ZeroHash),/UNKNOWN_EXACT_TYPE/);
 }
 const equip=Equip.registration(id('equipCode'),{outfitType:honest.typeId});
 assert.doesNotThrow(()=>Equip.item(equip,{outfitReceipt:id('receipt')},id('activation')));
 const changed={...equip,config:{outfitType:id('changed')}};
 assert.throws(()=>Equip.item(changed,{outfitReceipt:id('receipt')},id('activation')),/UNKNOWN_EXACT_TYPE/);
});

test('generator rejects both language keyword families and generated name collisions',async()=>{
 const {validate}=await import('../generator/generate.mjs');
 const valid={name:'Classroom9',version:'1',fields:[{name:'whileLoop',kind:'uint256'}],rule:null};
 for(const name of ['class','const','while','bytes','uint8','uint264','bytes33','int256','ufixed128x18','makeCodec','AT','AcceptanceCore','Fields','RuleConfig','eval','arguments','emit','indexed']) {
  assert.throws(()=>validate([{...valid,name}]),name);
  assert.throws(()=>validate([{...valid,fields:[{name,kind:'uint256'}]}]),name);
 }
 assert.doesNotThrow(()=>validate([valid,{...valid,name:'ByteCount',fields:[{name:'uint8Count',kind:'uint256'}]}]));
});

test('parameterized generation rejects config names that shadow emitted functions and locals',async(t)=>{
 const {renderDeclarations}=await import('../generator/generate.mjs');
 for(const name of ['rule','kinds','descriptor','typeId','rid','shape','keccak256','encode','decode','register']) await t.test(name,()=>{
  const declaration={name:'FeeControl',version:'1',fields:[{name:'claimKey',kind:'bytes32'}],rule:{artifact:'PaidClaimRule',label:'paid.unique.v1',config:[{name,kind:'uint256'}],local:[{name:'core',kind:'address'}],mode:2,gasLimit:250000}};
  assert.throws(()=>renderDeclarations([declaration]),/invalid rule/);
 });
});

test('representative accepted edge identifiers compile in both generated languages',async()=>{
 const {renderDeclarations}=await import('../generator/generate.mjs');
 const root=fileURLToPath(new URL('..',import.meta.url)),temp=mkdtempSync(join(tmpdir(),'efs-codegen-'));
 try {
  mkdirSync(join(temp,'generated'));
  for(const dependency of ['sdk','contracts','node_modules']) symlinkSync(join(root,dependency),join(temp,dependency));
  writeFileSync(join(temp,'package.json'),'{"type":"module"}');
  const outputs=renderDeclarations([
   {name:'Classroom9',version:'1',fields:[{name:'whileLoop',kind:'uint256'},{name:'uint8Count',kind:'uint256'},{name:'enabled',kind:'bool'},{name:'receiver',kind:'address'}],rule:null},
   {name:'FeeControl',version:'1',fields:[{name:'claimKey',kind:'bytes32'}],rule:{artifact:'PaidClaimRule',label:'paid.unique.v1',config:[{name:'fee',kind:'uint256'}],local:[{name:'core',kind:'address'}],mode:2,gasLimit:250000}},
   {name:'TypeControl',version:'1',fields:[{name:'outfitReceipt',kind:'bytes32'}],rule:{artifact:'EquipRule',label:'equip.current.v1',config:[{name:'outfitType',kind:'bytes32'}],local:[{name:'core',kind:'address'}],mode:1,gasLimit:250000}}
  ]);
  // The generator may reject an unsafe declaration, but every declaration it accepts must compile.
  for(const [index,name] of ['rule','kinds','descriptor','typeId'].entries()) {
   try {
    const candidate=renderDeclarations([{name:`ShadowControl${index}`,version:'1',fields:[{name:'claimKey',kind:'bytes32'}],rule:{artifact:'PaidClaimRule',label:'paid.unique.v1',config:[{name,kind:'uint256'}],local:[{name:'core',kind:'address'}],mode:2,gasLimit:250000}}]);
    for(const [file,body] of candidate) if(file!=='descriptors.json') outputs.set(file,body);
   } catch(error) {assert.match(String(error),/invalid rule/);}
  }
  for(const [name,body] of outputs) writeFileSync(join(temp,'generated',name),body);
  execFileSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),'--noEmit','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--allowImportingTsExtensions','--skipLibCheck',...Array.from(outputs.keys()).filter(name=>name.endsWith('.ts')).map(name=>join(temp,'generated',name))],{cwd:temp});
  execFileSync('forge',['build','--root',temp,'--contracts','generated','--use','0.8.30','--via-ir','--optimize','--evm-version','cancun'],{cwd:temp,stdio:'pipe'});
 }finally{rmSync(temp,{recursive:true,force:true});}
});

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
  const revised = OutfitV2.registration(id('revisionCode'),{});
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
