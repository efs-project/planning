import test from 'node:test';
import assert from 'node:assert/strict';
import { presentListing } from '../web/listing-presentation.mjs';
const state=(patch={})=>({rows:[],unresolved:[],masked:[],absent:[],coverage:'PARTIAL',qualification:{status:'QUALIFIED'},...patch});
const row=(outcome,index)=>({outcome,fieldRole:outcome+'-'+index,...(outcome==='FOUND'?{value:{name:'file-'+index}}:{})});
test('synthetic presentation keeps four files primary and accounts for every one of 67 positions',()=>{
  const input=state({rows:Array.from({length:4},(_,i)=>row('FOUND',i)),absent:Array.from({length:60},(_,i)=>row('ABSENT',i)),masked:[row('MASKED',0)],unresolved:[row('CONFLICT',0),row('UNKNOWN',0)],coverage:'COMPLETE'});
  const before=JSON.stringify(input),p=presentListing(input);
  assert.equal(p.files.length,4);assert.equal(p.attention.length,2);assert.equal(p.history.length,61);assert.equal(p.checked,67);
  assert.equal(new Set([...p.files,...p.attention,...p.history].map(r=>r.fieldRole)).size,67);
  assert.match(p.summary,/4 current files/);assert.match(p.summary,/67 source positions checked/);assert.match(p.summary,/2 placements need attention/);
  assert.equal(JSON.stringify(input),before,'presentation does not rewrite evidence');assert.equal(p.files[0],input.rows[0]);
});
test('zero files never means empty while discovery is partial or evidence is unresolved',()=>{
  assert.match(presentListing(state({absent:[row('ABSENT',0)]})).summary,/No current files found yet\. Scan incomplete; more may remain/);
  assert.match(presentListing(state({coverage:'COMPLETE',masked:[row('MASKED',0)]})).summary,/^No current files\./);
  const unresolved=presentListing(state({coverage:'COMPLETE',unresolved:[row('UNKNOWN',0)]}));
  assert.match(unresolved.summary,/No usable files found; 1 placement needs attention/);assert.doesNotMatch(unresolved.summary,/No current files\./);
});
test('stopped prefix stays explicitly historical and unexpected outcomes have no file affordance',()=>{
  const p=presentListing(state({rows:[row('FOUND',0)],absent:[row('ABSENT',0)],qualification:{status:'UNAVAILABLE'},rowsEvidence:'PRIOR_SEALED',reason:'budget'}));
  assert.match(p.summary,/Latest attempt failed: budget/);assert.match(p.summary,/prior sealed rows only/);assert.match(p.summary,/1 current file/);assert.equal(p.checked,2);
  const unknown=presentListing(state({unresolved:[row('FUTURE_UNKNOWN',0)]}));assert.equal(unknown.files.length,0);assert.equal(unknown.attention.length,1);
});
