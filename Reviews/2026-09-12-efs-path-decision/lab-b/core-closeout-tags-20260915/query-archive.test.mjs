import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {loadEthers} from '../script/compact-environment.mjs';
import {rebuildArchive} from './query-archive.mjs';
const e=await loadEthers(),p=JSON.parse(gunzipSync(await readFile(new URL('query-paid-final2.json.gz',import.meta.url))));
const s=p.fixture,principals=[s.principals.alice,s.principals.bob],basis=['34','0','13',p.queries.at(-1).basis[3],p.archive.realm,p.profileHash];
test('independent diagnostics retain literal competing authors and origin admissions',()=>{
  const a=structuredClone(p.archive),f=a.admissions.find(f=>f.at==='34');f.target=s.tokens[1];
  const d=rebuildArchive(a,e).diagnose(principals,s.fileG,s.conceptC,basis,false);
  assert.equal(d.stances.length,2);assert.equal(d.complete,true);assert.equal(d.stanceDisagreement,true);
  assert.deepEqual(d.stances.map(o=>[o.author,o.kind,String(o.admission),String(o.revision)]),[[s.principals.alice,2,'23','1'],[s.principals.bob,3,'34','1']]);
});
test('independent diagnostics do not treat silence or unavailable token meaning as a vote',()=>{
  const a=structuredClone(p.archive),f=a.admissions.find(f=>f.at==='34');f.target=s.tokens[2];
  let d=rebuildArchive(a,e).diagnose(principals,s.fileG,s.conceptC,basis,false);
  assert.equal(d.stances.length,2);assert.equal(d.stances[1].kind,4);assert.equal(d.stanceDisagreement,false);assert.equal(d.complete,true);
  f.target=s.conceptC;d=rebuildArchive(a,e).diagnose(principals,s.fileG,s.conceptC,basis,false);
  assert.equal(d.complete,false);assert.equal(d.stances[1].kind,0);assert.equal(d.stances[1].author,s.principals.bob);
});
test('paid diagnostic archive preserves both HEAD authors at the old origin after HEAD changes',async()=>{
  const fresh=JSON.parse(gunzipSync(await readFile(new URL('query-fix1-diagnostic.json.gz',import.meta.url))));
  const d=rebuildArchive(fresh.archive,e).diagnose(...fresh.diagnostics[1].args),f=fresh.fixture;
  assert.equal(d.complete,true);assert.equal(d.stanceDisagreement,true);assert.equal(d.headDisagreement,true);
  assert.deepEqual(d.heads.map(o=>[o.author,o.target,String(o.admission),String(o.revision)]),[[f.principals.alice,f.revision1,'19','1'],[f.principals.bob,f.revision2,'20','1']]);
  const now=rebuildArchive(fresh.archive,e).diagnose(...fresh.diagnostics[3].args);
  assert.equal(now.headDisagreement,false);assert.equal(now.stanceDisagreement,false);assert.equal(now.stances[0].kind,5);assert.equal(now.stances[1].kind,3);
});
