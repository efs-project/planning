import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureReader, DEFAULT_LIMITS } from '../reader-scope.mjs';
import { spawnSync } from 'node:child_process';

// Break: invalid caller configuration schedules network work or accepts unbounded limits.
test('invalid manifests and relaxed budgets fail before transport', async () => {
  let requests = 0;
  const source = {identity:'fixture',epoch:1,request:async()=>{requests++;throw Error('unexpected transport');}};
  for (const expected of [undefined, {}, {components:Array(33).fill({})}]) {
    const opened = await createFixtureReader({source,context:{expected}}).open({blockTag:'latest'});
    assert.equal(opened.status,'UNAVAILABLE');
    assert.match(opened.reason,/manifest/);
    assert.deepEqual(opened.evidence,[]);
  }
  assert.equal(requests,0);
  assert(Object.isFrozen(DEFAULT_LIMITS));
});

// Break: the shared runtime secretly requires Node globals or builtin modules.
test('module and crypto dependency load in a browser-like realm without Node APIs', () => {
  const script=`
    import {readFileSync} from 'node:fs';
    import vm from 'node:vm';
    const context=vm.createContext({TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout,performance,structuredClone});
    context.self=context;
    const modules=new Map();
    const load=url=>{if(!modules.has(url))modules.set(url,new vm.SourceTextModule(readFileSync(new URL(url),'utf8'),{context,identifier:url}));return modules.get(url);};
    const runtime=load(${JSON.stringify(new URL('../reader-scope.mjs',import.meta.url).href)});
    await runtime.link((specifier,from)=>{if(!specifier.startsWith('.'))throw Error('non-browser module '+specifier);return load(new URL(specifier,from.identifier).href);});
    await runtime.evaluate();
    const r=await runtime.namespace.createFixtureReader({}).open();
    if(r.status!=='UNAVAILABLE')throw Error('missing fail-closed export');
  `;
  const result=spawnSync(process.execPath,['--experimental-vm-modules','--disable-warning=ExperimentalWarning','--input-type=module','-e',script],{encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+result.stderr);
});
