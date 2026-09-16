import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadEthers} from '../script/compact-environment.mjs';
import {decodeDescribedType,decodeDescribedBody,verifyPortableDeclaration} from './described-type-reader.mjs';
import {checkTypeSidecarBudget} from './guarded-archive.mjs';
const e=await loadEthers();
for(const filename of ['controller-unseen-fixture.json','controller-unseen-referenced-fixture.json']){
  const v=JSON.parse(await readFile(new URL('../core-closeout-types-20260915/'+filename,import.meta.url)));
  test('post-freeze independent literal '+v.name,async()=>{
    assert.equal(createHash('sha256').update(await readFile(new URL('./described-type-reader.mjs',import.meta.url))).digest('hex'),v.frozenDecoderSha256);
    const d=decodeDescribedType(e,v.descriptor,v.wrapperRuntimeHash);
    assert.equal(d.typeId,v.typeId);assert.equal(d.shape,v.shape);assert.deepEqual(d.refTypes,v.refTypes);assert.equal(d.declarationDigest,v.declarationDigest);
    assert.equal(verifyPortableDeclaration(e,d,v.declarationSignature),v.creator);
    for(const b of v.bodies){
      const r=decodeDescribedBody(e,d,b.body);assert.equal(r.recordId,b.recordId);
      for(let i=0;i<v.fields.length;i++){
        const f=v.fields[i],actual=r.fields[i],expected=b.expected[f.name];
        assert.equal(actual.id,f.fieldId);assert.equal(actual.semanticId,f.semanticId);assert.equal(actual.kind,f.kind);
        if(f.optional){assert.equal(actual.present,expected.present);assert.equal(actual.value,expected.present?expected.value:null);}
        else assert.equal(typeof expected==='boolean'?actual.value:String(actual.value),expected);
      }
    }
    for(const b of v.invalidBodies??[])assert.throws(()=>decodeDescribedBody(e,d,b.body));
    for(const b of v.invalidAdmissions??[])assert.equal(decodeDescribedBody(e,d,b.body).referenceMeaning,'NOT_ESTABLISHED','parser must not pretend to prove referenced state');
  });
}
test('archive aggregate code budget refuses many individually valid-size Type sidecars',()=>{
  assert.deepEqual(checkTypeSidecarBudget([{ruleCode:'0x00',described:{descriptor:'0x01'}}]),{descriptors:1,code:1,other:0});
  assert.throws(()=>checkTypeSidecarBudget(Array.from({length:171},()=>({ruleCode:'0x'+'00'.repeat(24576)}))),/AGGREGATE/);
  assert.throws(()=>checkTypeSidecarBudget([{ruleCode:'0x',described:{descriptor:'0x'+'00'.repeat(4097)}}]),/BOUNDS/);
});
