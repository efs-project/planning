import test from 'node:test';
import assert from 'node:assert/strict';
import {withServer} from '../scripts/server.mjs';
import {get} from 'node:http';

// Catches per-request asset/config reads and partially available startup.
test('static server snapshots closed assets and config before listening', async () => {
  const config={world:'original',nested:{value:1}};
  let source=Buffer.from('private fixture'),reads=0;
  await withServer(config,async url=>{
    const before=await (await fetch(url+'/app.mjs')).text();
    source.fill(120);config.nested.value=2;
    assert.equal(await (await fetch(url+'/app.mjs')).text(),before);
    assert.equal(before,'private fixture');
    assert.equal((await (await fetch(url+'/config.json')).json()).nested.value,1);
    assert.equal(reads,8);
    assert.equal((await fetch(url+'/app.mjs',{method:'POST'})).status,405);
    assert.equal((await fetch(url+'/not-a-route')).status,404);
    assert.equal(await new Promise((resolve,reject)=>get(url,{headers:{host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject)),403);
    assert.equal((await fetch(url)).headers.get('cache-control'),'no-store');
  },{loadAsset:async()=>{reads++;return source;}});
  let listened=false;
  await assert.rejects(()=>withServer({},async()=>{listened=true;},{loadAsset:async()=>{throw Error('missing fixture');}}),/missing fixture/);
  assert.equal(listened,false);
});
