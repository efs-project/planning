import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadEthers} from '../script/compact-environment.mjs';
const e=await loadEthers();
const vectors=JSON.parse(await readFile(new URL('../core-closeout-types-20260915/vectors.json',import.meta.url)));
const api=await import('./described-type-reader.mjs').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
const descriptor=v=>api.decodeDescribedType(e,v.descriptor,vectors.wrapperRuntimeHash);
const mutate=(hex,offset,bytes)=>e.hexlify(Uint8Array.from(e.getBytes(hex),(b,i)=>i>=offset&&i<offset+bytes.length?bytes[i-offset]:b));
const rowOffset=v=>90+Number(BigInt(e.dataSlice(v.descriptor,88,90)));

// Losing any field/constraint, treating absence as an empty unit, or deriving
// identities from another profile must break these literal-oracle assertions.
test('independent finite reader consumes every literal field and exact identity',()=>{
  assert.equal(typeof api.decodeDescribedType,'function','finite descriptor reader is missing');
  assert.equal(typeof api.decodeDescribedBody,'function','finite body reader is missing');
  for(const v of vectors.vectors){
    const d=descriptor(v);
    assert.equal(d.shape,v.shape);assert.equal(d.typeId,v.typeId);assert.deepEqual(d.refTypes,v.refTypes);
    assert.equal(d.declarationDigest,v.declarationDigest);
    assert.equal(api.verifyPortableDeclaration(e,d,v.declarationSignature),vectors.creator);
    for(const b of v.bodies){
      const r=api.decodeDescribedBody(e,d,b.body);
      assert.deepEqual(r.fields.map(f=>f.value),b.values);assert.equal(r.recordId,b.recordId);
      assert.equal(r.interpretationCoverage,'COMPLETE');assert.equal(r.referenceMeaning,'NOT_ESTABLISHED');
    }
  }
});
test('malformed and unsupported never become valid empty data',()=>{
  assert.equal(typeof api.decodeDescribedType,'function');
  for(const v of vectors.invalidDescriptors)assert.throws(()=>descriptor(v));
  for(const b of vectors.invalidBodies)assert.throws(()=>api.decodeDescribedBody(e,descriptor(vectors.vectors.find(v=>v.name===b.vector)),b.body));
  for(const missing of [undefined,null]){
    assert.throws(()=>api.decodeDescribedType(e,missing,vectors.wrapperRuntimeHash),x=>x.coverage==='PARTIAL');
    assert.throws(()=>api.decodeDescribedBody(e,descriptor(vectors.vectors[0]),missing),x=>x.coverage==='PARTIAL');
  }
  assert.throws(()=>descriptor(vectors.invalidDescriptors[0]),x=>x.coverage==='UNSUPPORTED');
  assert.throws(()=>descriptor({...vectors.vectors[0],descriptor:'0x'}),x=>x.coverage==='INVALID');
  assert.throws(()=>descriptor({...vectors.vectors[0],descriptor:'0x0'}));
  assert.throws(()=>api.decodeDescribedBody(e,descriptor(vectors.vectors[0]),'0x00'));
});
test('canonical descriptor rejects duplicates, trailing bytes, irrelevant bits and invalid bounds',()=>{
  assert.equal(typeof api.decodeDescribedType,'function');
  const v=vectors.vectors.at(-1),o=rowOffset(v),bad=[];
  bad.push(mutate(v.descriptor,3,[17]),mutate(v.descriptor,1,[2]),mutate(v.descriptor,2,[1]));
  bad.push(mutate(v.descriptor,4,new Uint8Array(20)),mutate(v.descriptor,24,new Uint8Array(32)));
  bad.push(mutate(v.descriptor,88,[0,0]),v.descriptor+'00',mutate(v.descriptor,o+164,e.getBytes(e.dataSlice(v.descriptor,o,o+32))));
  bad.push(mutate(v.descriptor,o+32,new Uint8Array(32)),mutate(v.descriptor,o+65,[1]));
  bad.push(mutate(v.descriptor,o+164+68,[1]),mutate(v.descriptor,o+164+132,[1]));
  bad.push(mutate(v.descriptor,o+2*164+67,[0]),mutate(v.descriptor,o+2*164+100,[1]));
  bad.push(mutate(v.descriptor,o+3*164+131,[2]),mutate(v.descriptor,o+4*164+130,[1]));
  bad.push(mutate(v.descriptor,o+5*164+67,[1]),mutate(v.descriptor,o+5*164+130,[0xff]));
  bad.push(mutate(v.descriptor,o+7*164+65,[2]),mutate(v.descriptor,o+7*164+64,[1]));
  for(const bytes of bad)assert.throws(()=>descriptor({...v,descriptor:bytes}));
  assert.throws(()=>descriptor({...v,descriptor:v.descriptor+'00'.repeat(4097)}));
  assert.throws(()=>api.decodeDescribedBody(e,descriptor(v),'0x'+'00'.repeat(8193)));
});
test('portable declaration rejects changed type, high s, noncanonical v and signature absence',()=>{
  assert.equal(typeof api.verifyPortableDeclaration,'function');
  const v=vectors.vectors[1],d=descriptor(v),other=vectors.vectors[2];
  for(const signature of ['0x',undefined,other.declarationSignature,mutate(v.declarationSignature,64,[0]),mutate(v.declarationSignature,32,new Uint8Array(32).fill(255))]){
    assert.throws(()=>api.verifyPortableDeclaration(e,d,signature));
  }
});
