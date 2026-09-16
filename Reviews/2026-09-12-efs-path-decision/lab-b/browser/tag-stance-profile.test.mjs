import test from 'node:test';
import assert from 'node:assert/strict';
import {reduceStances} from './tag-stance-profile.mjs';

// Literal expectations: generic first-found reduction would fail silence and
// missing-discriminant cases. Author is the stance author, never token publisher.
for(const [name,observations,want] of [
  ['silent falls through',[{author:'A',kind:'SILENT'},{author:'B',kind:'ASSERT'}],['PRESENT','B','ASSERT']],
  ['deny wins',[{author:'A',kind:'DENY'},{author:'B',kind:'ASSERT'}],['NOT_PRESENT','A','DENY']],
  ['unknown blocks',[{author:'A',kind:'UNKNOWN'},{author:'B',kind:'ASSERT'}],['UNKNOWN','A',null]],
  ['untouched is not denial',[{author:'A',kind:'UNTOUCHED'},{author:'B',kind:'UNTOUCHED'}],['NOT_PRESENT',null,null]],
  ['new tombstone silent',[{author:'A',kind:'TOMBSTONE',purpose:'stance'},{author:'B',kind:'ASSERT'}],['PRESENT','B','ASSERT']],
  ['legacy tombstone masks',[{author:'A',kind:'TOMBSTONE',purpose:'legacy'},{author:'B',kind:'ASSERT'}],['NOT_PRESENT','A','MASK']],
  ['missing discriminant unknown',[{author:'A'},{author:'B',kind:'ASSERT'}],['UNKNOWN','A',null]],
  ['unqualified tombstone unknown',[{author:'A',kind:'TOMBSTONE'},{author:'B',kind:'ASSERT'}],['UNKNOWN','A',null]],
])test(name,()=>{const r=reduceStances(observations);assert.deepEqual([r.assessment,r.author,r.stance],want);});

test('an open Lens never proves absence',()=>assert.equal(reduceStances([{kind:'SILENT'}],{closed:false}).assessment,'UNKNOWN'));
