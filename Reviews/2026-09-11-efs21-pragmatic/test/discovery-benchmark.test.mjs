import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E} from '../scripts/world.mjs';
import {discoveryWorkload} from '../scripts/discovery-benchmark.mjs';

// Without the completeness guard, a 65-position inventory is silently labelled complete at 64.
test('discovery benchmark accepts complete 64-position inventory and rejects an incomplete 65-position page',{timeout:120000},async()=>{
  for(const directories of [27,28]) {
    const result=await withWorld(async w=>{
      const c=w.client;
      await c.write('ensureRoot',[],'pre-existing root');
      const root=(await c.call('rootId',[w.config.namespace])).value;
      for(let i=0;i<directories;i++) await c.write('createDirectory',[root,E.toUtf8Bytes('pre-existing-'+i)],'pre-existing directory '+i);
      // The workload adds 36 files; root + directories + files is exactly 64 or 65.
      if(directories===28) {
        await assert.rejects(()=>discoveryWorkload(w,'no-profile'),/source inventory page is incomplete/);
      } else {
        const measured=await discoveryWorkload(w,'no-profile');
        const scan=measured.reads.find(read=>read.label==='complete all-created source scan');
        assert.equal(scan.sourceCount,64);
        assert.equal(scan.members,33);
      }
      return {};
    });
    assert.equal(result.cleanup.cacheRemoved,true);
  }
});
