import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import { decodeBody } from '../../2026-09-05-c0-core/reference/record-body.mjs';
import { ordinaryRecord } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { parsePlan as independentPlan } from '../../2026-09-05-c0-core/reference/lens-resolver.mjs';
import { cat,hash,string,option,A,B,planBody } from './fixture.mjs';
const artifact=JSON.parse(readFileSync(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',import.meta.url)));
const types=Object.fromEntries(artifact.groups.flatMap(g=>g.members.map(m=>[m.name,m.temporaryTypeSchemaId])));
// Breaks: accepting substituted identity/unknown exact Type, loose OPTION/UTF-8,
// local references, rich names certified by the ASCII arm, or permissive Plans.
test('exact candidate codecs preserve structure and reject ambiguous bytes',async()=>{
  const p=await import('../files-profile.mjs');
  for(const g of artifact.groups){const ids=derive(Buffer.from(g.groupHex,'hex')).ids;for(const m of g.members)if(p.TYPES[m.name])assert.equal(p.TYPES[m.name],ids[m.memberIndex]);}
  const bodies={
    'ObjectGenesis/1':cat(A,hash('salt'),'01',hash('efs2/files/meaning/file/1')),
    'BindingSet/1':cat(hash('p'),hash('s'),hash('r'),option(hash('target')),'00','00'),
    'BindingTombstone/1':cat(hash('p'),hash('s'),hash('r'),'00'),
    'DirectoryEntry/1':cat(hash('root'),string('note.txt'),hash('child'),'00'),
    'DirectoryWhiteout/1':cat(hash('root'),string('note.txt')),
    'PublicFilesMountConfig/1':cat(option(hash('ns')),hash('content'),'00','00'),
    'MountDescriptor/1':cat(hash('root'),hash('profile'),hash('config')),
    'ResolutionPlan/1':planBody([{principal:A},{principal:B,tier:1}]),
  };
  for(const [name,body] of Object.entries(bodies)){
    const type=types[name],id=ordinaryRecord(type,body),got=p.assessRecord(id,type,body);assert.equal(got.status,'ACCEPTED',name);assert.equal(got.type,name);
    const group=artifact.groups.find(g=>g.members.some(m=>m.name===name)),schema=parseGroup(Buffer.from(group.groupHex,'hex'),{knownTypes:Object.values(types)}).members.find(m=>m.name===name);
    assert.deepEqual(got.raw.fields,decodeBody(schema,body).fields,name+' independent descriptor slices');
    assert.equal(p.assessRecord(hash('substitution'),type,body).reason,'RECORD_ID_MISMATCH');
    const extra=cat(body,'00');assert.equal(p.assessRecord(ordinaryRecord(type,extra),type,extra).status,'MALFORMED');
  }
  const unknown=hash('unknown exact Type');assert.equal(p.assessRecord(ordinaryRecord(unknown,'0x'),unknown,'0x').status,'UNSUPPORTED');
  for(const body of [cat(hash('root'),string('x'),hash('child'),'02'),cat('00'.repeat(32),string('x'),hash('child'),'00'),cat(hash('root'),'0001ff',hash('child'),'00')])assert.equal(p.assessRecord(ordinaryRecord(types['DirectoryEntry/1'],body),types['DirectoryEntry/1'],body).status,'MALFORMED');
  for(const n of ['note.txt','a-0_'])assert.equal(p.nameAssessment(n).status,'ACCEPTED');
  for(const n of ['', '.', '..','a/b','a\\b','a\u0000','x'.repeat(256)])assert.equal(p.nameAssessment(n).status,'MALFORMED');
  for(const n of ['Trip','é',' a'])assert.equal(p.nameAssessment(n).status,'UNSUPPORTED');
  const valid=planBody([{principal:A},{principal:B,tier:1}]);
  const variants=[valid,'0x',cat(valid,'00')];
  for(const [at,value] of [[2,2],[3,3],[4,2],[5,1],[6,1],[10,1],[132,1],[134,1],[142,1]]){const b=Buffer.from(valid.slice(2),'hex');b[at]=value;variants.push('0x'+b.toString('hex'));}
  const portable=x=>({...x,...(x.entries?{entries:x.entries.map(e=>({...e,reserved:[...e.reserved]}))}:{})});
  for(const b of variants){const want=independentPlan(types['ResolutionPlan/1'],b),got=p.parsePlan(types['ResolutionPlan/1'],b);assert.deepEqual(portable(got),portable(want));}
  const malformed=[
    [planBody([{principal:B},{principal:A}]),8],
    [planBody([{principal:A},{principal:A,tier:1}]),9],
    [planBody([{principal:A},{principal:B,tier:1}],{combiner:0}),11],
    [planBody([{principal:A}],{combiner:2,k:0}),6],
    [planBody([]),7],
    [planBody(Array.from({length:65},(_,i)=>({principal:hash('principal/'+i),tier:i}))),7],
  ];
  const strict=Buffer.from(planBody([{principal:A},{principal:B}]).slice(2),'hex');strict[4]=1;malformed.push(['0x'+strict.toString('hex'),12]);
  for(const [body,code] of malformed){assert.equal(p.parsePlan(types['ResolutionPlan/1'],body).code,code);assert.equal(independentPlan(types['ResolutionPlan/1'],body).code,code);}
});
