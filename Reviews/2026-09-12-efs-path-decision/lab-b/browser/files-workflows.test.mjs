import test from 'node:test';
import assert from 'node:assert/strict';
import {previewOwnPlacementRelease,executeOwnPlacementRelease} from './files-workflows.mjs';

test('release outcomes always retain non-atomic scope including unverified reconciliation',async()=>{
  for(const status of ['EFFECTS_VERIFIED','UNKNOWN','THROW']){
    const sdk={pin:async()=>({}),readPlacement:async()=>({knowledge:'PRESENT',value:{position:'root/name',folder:'root',target:'file',kind:'file',selection:{revision:1}}}),
      prepare:async()=>({id:'plan'}),authorize:async plan=>plan,submit:async plan=>plan,
      reconcile:async()=>{if(status==='THROW')throw Error('interrupted');return {status};}};
    const preview=await previewOwnPlacementRelease({sdk,author:'author',folder:'root',name:'name'});
    const result=await executeOwnPlacementRelease({sdk,preview});
    assert.equal(result.atomic,false,status);assert.equal(result.retained,preview.retained,status);
    assert.equal(result.status,status==='EFFECTS_VERIFIED'?'COMPLETE':'PARTIAL');
    assert.equal(result.pending.length,status==='EFFECTS_VERIFIED'?0:1);
  }
});
