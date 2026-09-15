import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from './compact-environment.mjs';
import * as measurement from './measure-joined.mjs';

test('joined runners close their real owned Anvil when source-pin preflight rejects',{timeout:120000},async t=>{
  assert.equal(typeof measurement.measureCase,'function','measurement lifecycle is independently callable');
  const diagnostic=await import('./diagnose-joined-read.mjs');
  for(const [name,run] of [['measurement',options=>measurement.measureCase('live-churn',options)],['diagnostic',diagnostic.diagnoseJoinedRead]])await t.test(name,async t=>{
    let owned;
    const environment=async options=>{owned=await createEnvironment(options);t.after(()=>owned.close());return owned;};
    const pinSource=async env=>{assert.equal(env,owned);process.kill(env.anvilPid,0);throw Error('injected source-pin failure');};
    await assert.rejects(run({environment,pinSource}),/injected source-pin failure/);
    assert.throws(()=>process.kill(owned.anvilPid,0),{code:'ESRCH'},'rejected preflight must close the actual child');
  });
});
