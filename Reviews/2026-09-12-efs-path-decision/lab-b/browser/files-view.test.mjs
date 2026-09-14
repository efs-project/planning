import test from 'node:test';
import assert from 'node:assert/strict';
import {folderState, filterRows, canOpen, estimateUsd, receiptTotals} from './files-view.mjs';

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
    {file:'a',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{evaluated:true,present:true},revisionTag:{evaluated:true,present:false}}}},
    {file:'b',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{fileTag:{evaluated:true,present:false},revisionTag:{evaluated:true,present:true}}}},
    {file:'c',point:{knowledge:'UNKNOWN',coverage:'PARTIAL',value:{}}},
  ];
  assert.deepEqual(filterRows(rows,{tag:true,scope:'file'}).rows.map(r=>r.file), ['a','c']);
  assert.deepEqual(filterRows(rows,{tag:true,scope:'revision'}).rows.map(r=>r.file), ['b','c']);
  assert.deepEqual(filterRows(rows,{tag:true,scope:'either'}).rows.map(r=>r.file), ['a','b','c']);
  assert.equal(filterRows(rows,{tag:true,scope:'file'}).uncertain, 1);
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
