import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePath,encodePath,decodePath} from './compact-paths.mjs';
const present=(kind,target)=>({knowledge:'PRESENT',coverage:'COMPLETE',value:{kind,target,selection:{author:'alice',revision:2,admission:'9',target}}});
const sdk={readDirectory:async()=>({knowledge:'PRESENT',coverage:'COMPLETE'}),readPlacement:async({folder,name})=>{
  if(name==='masked')return {knowledge:'MASKED',coverage:'COMPLETE',value:{selection:{author:'bob',revision:3,admission:'10'}}};
  if(name==='unknown')return {knowledge:'UNKNOWN',coverage:'PARTIAL',value:{target:'lost'}};
  if(name==='invalid')return {knowledge:'INVALID',coverage:'PARTIAL',value:{target:'bad'}};
  return folder==='root'&&['a','alias'].includes(name)?present('directory','a'):folder==='a'&&name==='back'?present('directory','root'):
    folder==='a'&&name==='file'?present('file','file-id'):{knowledge:'ABSENT',coverage:'COMPLETE',value:{}};
}};
const run=(segments,budget=32)=>resolvePath({sdk,root:'root',segments,principals:['alice','bob'],context:{blockHash:'pinned'},budget});
test('exact ASCII path codec round trips and rejects normalization and ambiguous segments',()=>{
  assert.equal(encodePath(['photos','image.bin']),'/photos/image.bin');assert.deepEqual(decodePath('/photos/image.bin'),['photos','image.bin']);
  assert.deepEqual(decodePath('/'),[]);
  for(const path of ['/A','/a//b','/a/','/%2e','/a%2fb','/%2561','/%61','/..','/a?b','/a#b'])assert.throws(()=>decodePath(path));
  for(const segments of [['A'],['.'],['..'],['a/b'],[''],['a'.repeat(256)],['a\0']])assert.throws(()=>encodePath(segments));
});
test('bounded route returns identity and every selected edge provenance without a parent dictionary',async()=>{
  const r=await run(['a','file']);assert.equal(r.status,'PRESENT');assert.equal(r.target,'file-id');assert.equal(r.kind,'file');
  assert.equal(r.trail.length,2);assert.equal(r.trail[0].selection.author,'alice');assert.equal(r.trail[1].selection.admission,'9');
  assert.equal(r.basis.blockHash,'pinned');assert.deepEqual(r.principals,['alice','bob']);
});
test('aliases are valid routes but repeated directory on the same route is a cycle',async()=>{
  assert.equal((await run(['alias','file'])).status,'PRESENT');const cycle=await run(['a','back']);
  assert.equal(cycle.status,'CYCLE');assert.equal(cycle.trail.length,2);assert.equal(cycle.target,'root');
});
test('absent masked unknown invalid non-directory and budget exhaustion remain distinct',async()=>{
  for(const [segments,status] of [[['missing'],'ABSENT'],[['masked'],'MASKED'],[['unknown'],'UNKNOWN'],[['invalid'],'INVALID'],[['a','file','x'],'NON_DIRECTORY']])assert.equal((await run(segments)).status,status);
  const partial=await run(['a','file'],2);assert.equal(partial.status,'PARTIAL');assert.equal(partial.trail.length,1);assert.equal(partial.coverage,'PARTIAL');
});
test('root-only path still requires one nonempty explicit Lens and truthful coverage',async()=>{
  for(const lens of [{},{principals:[]},{principals:['alice'],authors:['bob']}])await assert.rejects(()=>resolvePath({sdk,root:'root',segments:[],context:{},...lens}),/PATH_LENS/);
  const partialSdk={...sdk,readPlacement:async()=>({...present('directory','a'),coverage:'PARTIAL'})};
  assert.equal((await resolvePath({sdk:partialSdk,root:'root',segments:['a'],principals:['alice'],context:{}})).status,'PARTIAL');
});
