import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { withFilesScreen } from './screen-fixture.mjs';
import { comparable } from '../../2026-09-09-files-reader/test/oracle.mjs';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const hash=x=>createHash('sha256').update(x).digest('hex');
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const ordered=rows=>rows.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));
const settled=page=>page.waitForFunction(()=>document.querySelector('main')?.dataset.state==='settled');
const rows=page=>page.locator('[data-result]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.dataset.result)));
test('identity/gzip delivery preserves actual qualified reads and measures encoded/decoded cost',{timeout:300000},async()=>{
  const executablePath=process.env.EFS_LAB_CHROMIUM;
  const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const report={kind:'SAME_DATA_HTTP_DELIVERY_NOT_WAN_SPEEDUP',samples:[],decodedResources:[],browser:browser.version(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),exclusions:['WAN bandwidth/latency','physical phone','browser-process cold start','production serving','compression of RPC','v1 parity','directory scalability']};
  try{await withFilesScreen(async screen=>{
    report.resources=screen.lab.resources;report.basis=screen.truths.get('agreement').basis;
    report.blockHash=screen.truths.get('agreement').snapshot.basis.hash;
    const truth=ordered(screen.truths.get('agreement').inventory(screen.config.mounts.aFirst).results);
    const errors=[],external=[];let requestControl,resourceControl;
    for(const delayMs of [0,50])for(let sample=0;sample<3;sample++)for(const delivery of sample%2?['gzip','identity']:['identity','gzip']){
      screen.setDelay(delayMs);screen.setDelivery(delivery);
      const context=await browser.newContext({viewport:{width:1280,height:900}});
      try{
        await context.addInitScript(()=>{window.walletTouches=0;Object.defineProperty(window,'ethereum',{get(){window.walletTouches++;throw Error('guest touched wallet');}});});
        const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==screen.url)external.push(r.url());});
        const start=screen.trace.length,t0=performance.now();await page.goto(screen.url+'/?snapshot=agreement&lens=aFirst');await settled(page);
        const navigationToRowsMs=performance.now()-t0,firstEnd=screen.trace.length;
        assert.equal((await rows(page)).length,4);assert.equal(await page.locator('#coverage').textContent(),'Partial listing');
        const t1=performance.now();await page.locator('#more').click();await settled(page);const continuationMs=performance.now()-t1;
        // Independent comparisons happen after the measured DOM-visible interval.
        assert.deepEqual(ordered(await rows(page)),truth);assert.equal(await page.locator('#coverage').textContent(),'Listing complete');
        assert.equal(await page.locator('main').getAttribute('data-block'),String(report.basis.blockNumber));
        assert.equal(await page.locator('main').getAttribute('data-revision'),String(report.basis.realmRevisionId));
        assert.equal(await page.evaluate(()=>window.walletTouches),0);
        const observed=screen.trace.slice(start),first=screen.trace.slice(start,firstEnd),more=screen.trace.slice(firstEnd);
        assert(observed.every(r=>r.endedMs!==null&&!r.error));
        for(const r of observed)if(['eth_call','eth_getCode','eth_getStorageAt'].includes(r.method))assert.deepEqual(r.params.at(-1),{blockHash:report.blockHash,requireCanonical:true});
        const acquisition=observed.map(r=>json([r.method,r.params,r.bytes])).sort();
        if(requestControl)assert.deepEqual(acquisition,requestControl,'same request multiset, basis and accepted result lengths');else requestControl=acquisition;
        const resources=await page.evaluate(()=>[...performance.getEntriesByType('navigation'),...performance.getEntriesByType('resource')].filter(r=>new URL(r.name).pathname!=='/rpc').map(r=>({path:new URL(r.name).pathname,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,transferSize:r.transferSize,duration:r.duration})));
        const shape=resources.map(r=>[r.path,r.decodedBodySize]).sort(([a],[b])=>a.localeCompare(b));
        // /config adds one character when injectedDelayMs changes 0 -> 50.
        if(delayMs===0){if(resourceControl)assert.deepEqual(shape,resourceControl);else resourceControl=shape;}
        const total=key=>resources.reduce((n,r)=>n+r[key],0);
        if(delivery==='identity')assert.equal(total('encodedBodySize'),total('decodedBodySize'));
        else assert(total('encodedBodySize')<total('decodedBodySize')/2,'compression reduces bytes, not validation');
        report.samples.push({delayMs,sample,delivery,navigationToRowsMs,continuationMs,first:{requests:first.length,jsonResultBytes:first.reduce((n,r)=>n+r.bytes,0)},continuation:{requests:more.length,jsonResultBytes:more.reduce((n,r)=>n+r.bytes,0)},totals:{encodedBodySize:total('encodedBodySize'),decodedBodySize:total('decodedBodySize'),transferSize:total('transferSize')},resources});
      }finally{await context.close();}
    }
    // Fetch and byte-compare every actual browser resource between delivery arms,
    // outside all timers. Node fetch returns decoded bytes; never trust only size.
    screen.setDelay(0);
    for(const [path] of resourceControl){
      screen.setDelivery('identity');const a=await fetch(screen.url+path,{headers:{'accept-encoding':'gzip'}}),bytes=Buffer.from(await a.arrayBuffer());
      assert.equal(a.headers.get('content-encoding'),null);
      screen.setDelivery('gzip');const b=await fetch(screen.url+path,{headers:{'accept-encoding':'gzip'}}),decoded=Buffer.from(await b.arrayBuffer());
      assert.deepEqual(decoded,bytes,path);assert.equal(b.headers.get('content-encoding'),bytes.length>=1024?'gzip':null);
      report.decodedResources.push({path,bytes:bytes.length,sha256:hash(bytes),contentEncoding:b.headers.get('content-encoding'),contentLength:Number(b.headers.get('content-length'))});
    }
    assert.equal(errors.length,0,json(errors));assert.equal(external.length,0,json(external));
    report.checks={samples:report.samples.length,byteComparedResources:report.decodedResources.length,identicalRPCMultisets:true,canonicalHashPinned:true,oracleMatched:true,walletTouches:0,pageErrors:errors,externalRequests:external};
    report.sourcePins={};
    for(const path of ['scripts/server.mjs','scripts/serve.mjs','test/delivery.browser.mjs','test/screen-fixture.mjs','web/app.mjs','web/listing-presentation.mjs','web/rpc-source.mjs','web/index.html','web/files.css','../2026-09-09-files-reader/index.mjs','../2026-09-09-files-reader/reader-scope.mjs','../2026-09-09-files-reader/files-reader.mjs','../2026-09-09-files-reader/files-profile.mjs','../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'])report.sourcePins[path]=hash(await readFile(new URL('../'+path,import.meta.url)));
    if(process.env.EFS_FILES_DELIVERY_EVIDENCE==='1')await writeFile(new URL('../evidence/delivery.json',import.meta.url),json(report)+'\n',{flag:'wx'});
    console.log(json({checks:report.checks,samples:report.samples.map(({resources,...r})=>r)}));
  });}finally{await browser.close();}
});
