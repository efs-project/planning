import test from 'node:test';
import assert from 'node:assert/strict';
import * as sdk from './compact-sdk.mjs';
test('exact live revision dispatch never treats every descriptor as immutable carrier content',()=>{
  assert.equal(typeof sdk.filesRevisionProfile,'function','missing exact revision dispatch');
  const types={root:'0x01',child:'0x02',carrierRoot:'0x03',carrierChild:'0x04',liveRoot:'0x05',liveChild:'0x06'};
  assert.equal(sdk.filesRevisionProfile(types,'0x01'),'legacy-inline');
  assert.equal(sdk.filesRevisionProfile(types,'0x03'),'carrier-v1');
  assert.equal(sdk.filesRevisionProfile(types,'0x05'),'live-quote-v1');
  assert.equal(sdk.filesRevisionProfile(types,'0x06'),'live-quote-v1');
  assert.equal(sdk.filesRevisionProfile(types,'0x07'),'unsupported');
  assert.equal(sdk.filesRevisionProfile({root:'0x01'},undefined),'unsupported');
});
