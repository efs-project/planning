import test from 'node:test';
test('typed directory unknown kind qualifies membership without claiming an empty folder',()=>{
  assert.equal(folderState({knowledge:'PRESENT',coverage:'COMPLETE',nameCoverage:'COMPLETE',kindCoverage:'PARTIAL',value:[{kind:'unknown'}]}).kind,'partial');
});
import assert from 'node:assert/strict';
import * as ethers from 'ethers';
import {folderState, filterRows, canOpen, estimateUsd, receiptTotals} from './files-view.mjs';
import * as view from './files-view.mjs';
test('exhaustive filtered empty query is not described as an empty folder',()=>{
  const state=folderState({knowledge:'ABSENT',coverage:'COMPLETE',nameCoverage:'COMPLETE',kindCoverage:'COMPLETE',filtered:true,value:[]});
  assert.match(state.label,/No matches/);assert.doesNotMatch(state.label,/folder is empty/);
});

const costSnapshot = {ethUsd:3000,asOf:'2026-09-14T19:45:15Z',source:'https://example.com/snapshot',networks:[
  {id:'ethereum',label:'Ethereum',gasGwei:2,extraUsd:0},
  {id:'optimism',label:'Optimism',gasGwei:1,extraUsd:0},
  {id:'base',label:'Base',gasGwei:0.01,extraUsd:0},
  {id:'arbitrum',label:'Arbitrum',gasGwei:1,extraUsd:0},
  {id:'zksync',label:'ZKsync',gasGwei:1,extraUsd:0},
]};
const costEntry = (digit,gasUsed,operation='create',status='EFFECTS_VERIFIED') => ({
  transactionHash:'0x'+digit.repeat(64),plan:{operation},status,
  ...(gasUsed===undefined?{}:{receipt:{gasUsed,status:status==='REVERTED'?'0x0':'0x1'}}),
});

test('cost projection leads with Base and maps old config by ID without changing edited assumptions', () => {
  assert.equal(typeof view.costPresentation,'function');
  const edited=structuredClone(costSnapshot); edited.networks[2].gasGwei=0.02;
  const actual=view.costPresentation([costEntry('1','100000')],edited);
  assert.deepEqual(actual.columns,['Action','Gas','Ethereum L1','Base','Arbitrum','ZKsync']);
  assert.match(actual.headline,/unavailable/);
  assert.equal(actual.total.base,null,'missing calldata is not a complete Base fee');
  assert.ok(Math.abs(actual.total.models.base.executionUsd-0.006)<1e-12);
  assert.equal(actual.total.ethereum,0.6);
  assert.equal(actual.total.zksync,null);
  assert.deepEqual(actual.networks.map(n=>[n.id,n.index]),[['ethereum',0],['base',1],['arbitrum',2]]);
  assert.equal(edited.networks.length,5);
  assert.equal(edited.networks[2].gasGwei,0.02);
});

test('recent action table includes unknown and reverted receipts, deduplicates hashes, and qualifies the total', () => {
  assert.equal(typeof view.costPresentation,'function');
  const entries=[costEntry('1','100000'),costEntry('1','0x186a0'),costEntry('2','21000','remove','REVERTED'),costEntry('3',undefined,'edit','SUBMITTED')];
  const actual=view.costPresentation(entries,costSnapshot);
  assert.equal(actual.rows.length,3);
  assert.equal(actual.rows[1].gas,21000n);
  assert.equal(actual.rows[2].base,null);
  assert.equal(actual.total.gas,121000n);
  assert.equal(actual.total.label,'Known subtotal');
  assert.match(actual.headline,/unavailable.*1 unknown/);
  assert.equal(typeof view.renderCostTable,'function');
  const html=view.renderCostTable(actual);
  assert.match(html,/<th scope="col">Action<\/th>/);
  assert.match(html,/REVERTED/);
  assert.match(html,/SUBMITTED/);
  assert.match(html,/Unknown/);
  assert.match(html,/Known subtotal/);
  assert.equal((html.match(/Not measured/g)??[]).length,4);
});

test('no receipts or missing assumptions never imply measured zero spending', () => {
  assert.equal(typeof view.costPresentation,'function');
  assert.equal(view.costPresentation([],costSnapshot).headline,'Base estimate unavailable · no receipts');
  assert.equal(view.costPresentation([costEntry('1','100000')],null).total.base,null,'calldata missing even with new defaults');
  assert.equal(view.costPresentation([costEntry('1','100000')],{...costSnapshot,ethUsd:null}).total.base,null);
  assert.equal(estimateUsd('100000',{id:'zksync',gasGwei:1,extraUsd:0},3000),null);
  assert.equal(estimateUsd('100000',{gasGwei:null,extraUsd:0},3000),null);
});

test('contradictory observations render once as unknown and table text cannot inject markup', () => {
  assert.equal(typeof view.costPresentation,'function');
  const actual=view.costPresentation([costEntry('1','2','<img src=x onerror=alert(1)>'),costEntry('1','3')],costSnapshot);
  assert.equal(actual.rows.length,1);
  assert.equal(actual.rows[0].gas,null);
  const html=view.renderCostTable(actual);
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img/);
  assert.match(html,/Unknown/);
});

test('recent rows are bounded but totals cover every unique recorded action', () => {
  const entries=Array.from({length:7},(_,i)=>costEntry(String(i+1),'100000'));
  const actual=view.costPresentation(entries,costSnapshot);
  assert.equal(actual.rows.length,5);
  assert.equal(actual.total.gas,700000n);
  assert.ok(Math.abs(actual.total.models.base.executionUsd-0.021)<1e-12);
  const tiny=view.costPresentation([costEntry('1','1')],costSnapshot);
  assert.match(view.renderCostTable(tiny),/&lt; \$0.0001/);
  assert.doesNotMatch(tiny.headline,/\$0\.0000/);
});

test('full fee rows and totals disclose components and mixed receipt or calldata gaps',()=>{
  const good={...costEntry('1','100000'),receiptAttribution:'RPC_MATCHED_DIRECT_PLAN',transaction:{to:'0x'+'12'.repeat(20),data:'0x'+'ab'.repeat(175),value:'0'}};
  const complete=view.costPresentation([good],undefined,ethers);
  assert.ok(complete.total.base>0);
  assert.match(complete.headline,/practical/);
  assert.match(view.renderCostTable(complete),/operator/);
  assert.match(view.renderCostTable(complete),/scenario/);
  const incomplete=view.costPresentation([good,costEntry('2','100000')],undefined,ethers);
  assert.equal(incomplete.total.base,null,'one unavailable posting cost cannot be a complete total');
  assert.ok(incomplete.total.models.base.knownScenarioUsd>0);
  assert.equal(view.receiptTotals([{...good,receiptAttribution:'MISMATCH'}]).gas,null);
  assert.equal(view.costPresentation([good,{...good,transaction:{...good.transaction,data:'0x00'}}],undefined,ethers).total.base,null,'contradictory calldata for one hash is not a fee estimate');
});

test('overflowing edited assumptions remain unknown instead of displaying infinite dollars', () => {
  assert.equal(estimateUsd('100000',{gasGwei:1e308,extraUsd:0},3000),null);
});

test('unknown and partial zero-row observations never become empty folders', () => {
  for (const [knowledge, coverage] of [['UNKNOWN','UNKNOWN'],['UNKNOWN','PARTIAL'],['ABSENT','PARTIAL'],['CONFLICT','COMPLETE']]) {
    assert.notEqual(folderState({knowledge,coverage,value:[]}).kind, 'empty');
  }
  assert.equal(folderState({knowledge:'ABSENT',coverage:'COMPLETE',value:[]}).kind, 'empty');
});

test('known members survive unavailable or invalid names', () => {
  const rows = [{file:'a',name:{knowledge:'UNKNOWN',value:null}},{file:'b',name:{knowledge:'INVALID',value:null}}];
  assert.equal(folderState({knowledge:'PRESENT',coverage:'COMPLETE',nameCoverage:'PARTIAL',value:rows}).kind, 'partial');
  assert.equal(filterRows(rows, {search:'notes'}).rows.length, 2);
  assert.equal(filterRows(rows, {search:'notes'}).uncertain, 2);
});

test('tag filter distinguishes File from revision and retains unevaluated subjects', () => {
  const rows = [
    {file:'a',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{assessment:'PRESENT'},revisionTag:{assessment:'NOT_PRESENT'}}}},
    {file:'b',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{assessment:'NOT_PRESENT'},revisionTag:{assessment:'PRESENT'}}}},
    {file:'c',point:{knowledge:'UNKNOWN',coverage:'PARTIAL',value:{}}},
  ];
  assert.deepEqual(filterRows(rows,{tag:true,scope:'file'}).rows.map(r=>r.file), ['a','c']);
  assert.deepEqual(filterRows(rows,{tag:true,scope:'revision'}).rows.map(r=>r.file), ['b','c']);
  assert.deepEqual(filterRows(rows,{tag:true,scope:'either'}).rows.map(r=>r.file), ['a','b','c']);
  assert.equal(filterRows(rows,{tag:true,scope:'file'}).uncertain, 1);
});
test('location tags filter the folder/name slot, not its current File', () => {
  const rows=[
    {file:'old',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{assessment:'NOT_PRESENT'},revisionTag:{assessment:'NOT_PRESENT'},locationTag:{assessment:'PRESENT'}}}},
    {file:'new',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{assessment:'PRESENT'},revisionTag:{assessment:'NOT_PRESENT'},locationTag:{assessment:'NOT_PRESENT'}}}},
    {file:'unread',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{locationTag:{assessment:'UNKNOWN'}}}},
  ];
  assert.deepEqual(filterRows(rows,{tag:true,scope:'placement'}).rows.map(r=>r.file),['old','unread']);
  assert.equal(filterRows(rows,{tag:true,scope:'placement'}).uncertain,1);
});
test('tag presentation and fallback filters keep unknown masked and N/A distinct',()=>{
  assert.equal(typeof view.tagLabel,'function');
  for(const [tag,label] of [[{},'unknown'],[{present:false,evaluated:true},'unknown'],[{assessment:'UNKNOWN'},'unknown'],
    [{assessment:'NOT_APPLICABLE'},'not applicable'],[{assessment:'NOT_PRESENT'},'absent'],
    [{assessment:'NOT_PRESENT',selection:{status:2}},'masked'],[{assessment:'PRESENT'},'present']])assert.equal(view.tagLabel(tag),label);
  const row=(file,fileTag,revisionTag,name={knowledge:'PRESENT',value:'notes'})=>({file,name,point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag,revisionTag}}});
  const rows=[row('positive',{assessment:'PRESENT'},{assessment:'UNKNOWN'}),row('unknown',{present:false,evaluated:true},{assessment:'NOT_APPLICABLE'}),
    row('negative',{assessment:'NOT_PRESENT'},{assessment:'NOT_APPLICABLE'})];
  assert.deepEqual(filterRows(rows,{tag:true}).rows.map(r=>r.file),['positive','unknown']);
  assert.equal(filterRows(rows,{tag:true}).uncertain,1,'known-positive OR stays a known match');
  assert.equal(filterRows([row('name-no',{assessment:'UNKNOWN'},null,{knowledge:'PRESENT',value:'other'})],{search:'notes',tag:true}).rows.length,0);
  assert.equal(filterRows([row('tag-no',{assessment:'NOT_PRESENT'},{assessment:'NOT_APPLICABLE'},{knowledge:'UNKNOWN'})],{search:'notes',tag:true}).rows.length,0,'a known false AND operand excludes even when the other operand is unknown');
});

test('only qualified selected bytes can be opened or downloaded', () => {
  for (const knowledge of ['UNKNOWN','INVALID','MASKED','CONFLICT','ABSENT']) {
    assert.equal(canOpen({knowledge,coverage:'COMPLETE',value:{revision:{document:'0x61'}}}),false);
  }
  assert.equal(canOpen({knowledge:'PRESENT',coverage:'PARTIAL',value:{revision:{document:'0x61'}}}),false);
  assert.equal(canOpen({knowledge:'PRESENT',coverage:'COMPLETE',value:{revision:{document:'0x61'}}}),true);
});

test('network estimate uses measured gas, gwei, ETH USD and explicit extra fee only', () => {
  assert.equal(estimateUsd('100000', {gasGwei:2,extraUsd:0.01}, 3000), 0.61);
  assert.equal(estimateUsd(null, {gasGwei:2,extraUsd:0.01}, 3000), null);
  assert.equal(estimateUsd('100000', {gasGwei:-1,extraUsd:0}, 3000), null);
  assert.equal(estimateUsd('200000', {gasGwei:2,extraUsd:0.01}, 3000, 2), 1.22);
});

test('cost totals deduplicate receipts, include reverted gas, and retain unknown costs', () => {
  const hash = n => '0x'+n.repeat(64);
  const receipt = (n,gasUsed,status='0x1') => ({transactionHash:hash(n),receipt:{transactionHash:hash(n),gasUsed,status}});
  const rows = [receipt('1','0x186a0'),receipt('1','100000'),receipt('2','21000','0x0'),
    {transactionHash:hash('3'),status:'SUBMITTED'},receipt('4','not-gas')];
  const summary = receiptTotals(rows);
  assert.equal(summary.gas,121000n);
  assert.equal(summary.transactions.length,2);
  assert.equal(summary.unknown,2);
  assert.equal(receiptTotals([]).gas,null,'no receipts is not measured zero spending');
});

test('contradictory receipts for one hash do not become a fabricated total', () => {
  const hash='0x'+'a'.repeat(64);
  const result=receiptTotals([{transactionHash:hash,receipt:{gasUsed:'2'}},{transactionHash:hash,receipt:{gasUsed:'3'}}]);
  assert.equal(result.gas,null);
  assert.equal(result.transactions.length,0);
  assert.equal(result.unknown,1);
});

test('parseable damaged journal hashes become unknown cost without breaking the screen', () => {
  const result=receiptTotals([{transactionHash:123,receipt:{gasUsed:'21000'}},
    {transactionHash:'0x'+'a'.repeat(64),receipt:{transactionHash:123,gasUsed:'21000'}}]);
  assert.equal(result.gas,null);
  assert.equal(result.unknown,2);
});
