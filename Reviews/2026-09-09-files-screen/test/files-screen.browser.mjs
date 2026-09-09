import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { withFilesScreen } from './screen-fixture.mjs';
import { comparable } from '../../2026-09-09-files-reader/test/oracle.mjs';
import { role } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { writeFile,mkdir,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const executablePath=process.env.EFS_LAB_CHROMIUM;
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const ordered=xs=>xs.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));
async function settled(page){await page.waitForFunction(()=>document.querySelector('main')?.dataset.state==='settled');}
async function complete(page){await settled(page);while(await page.locator('#more').isVisible()){await page.locator('#more').click();await settled(page);}}
async function rows(page){return page.locator('[data-result]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.dataset.result)));}

test('real guest SPA matches retained Core observations and exposes qualified, accessible progress',{timeout:300000},async()=>{
  const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
  const errors=[],external=[],report={kind:'LIVE_GUEST_FILES_SCREEN_NOT_PUBLIC_C0',samples:[],checks:[],snapshots:{},exclusions:['physical phone','WAN percentiles','finality','content bytes','wallet writes','full v1 parity']};
  try{await withFilesScreen(async screen=>{
    const {url,config,truths,trace}=screen;
    report.resources=screen.lab.resources;report.configBytes=Buffer.byteLength(json(config));
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    await context.addInitScript(()=>{window.walletTouches=0;Object.defineProperty(window,'ethereum',{get(){window.walletTouches++;throw Error('guest touched wallet');}});});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==url)external.push(r.url());});
    await page.goto(url);await settled(page);
    assert.equal(await page.locator('#coverage').textContent(),'Partial listing');
    assert.equal((await rows(page)).length,4);assert.equal(await page.evaluate(()=>window.walletTouches),0);
    await page.locator('#more').focus();await page.keyboard.press('Enter');await settled(page);
    assert.equal(await page.locator('#coverage').textContent(),'Listing complete');
    assert.equal(await page.locator(':focus').getAttribute('data-why'),role('n3.txt'));
    report.checks.push('partial-to-complete and keyboard Load more focus');
    for(const snapshot of config.snapshots){
      report.snapshots[snapshot.id]={basis:truths.get(snapshot.id).basis,blockHash:truths.get(snapshot.id).snapshot.basis.hash};
      for(const lens of ['aFirst','bFirst','exact']){
        await page.locator('#snapshot').selectOption(snapshot.id);await page.locator('#lens').selectOption(lens);await complete(page);
        const actual=await rows(page),expected=truths.get(snapshot.id).inventory(config.mounts[lens]).results;
        assert.deepEqual(ordered(actual),ordered(expected),snapshot.id+'/'+lens);
        assert.equal(await page.locator('main').getAttribute('data-block'),String(truths.get(snapshot.id).basis.blockNumber));
        assert.equal(await page.locator('main').getAttribute('data-revision'),String(truths.get(snapshot.id).basis.realmRevisionId));
      }
    }
    report.checks.push('all seven pinned observations × three Lenses match independent full reconstruction');
    await page.locator('#snapshot').selectOption('disagree');await page.locator('#lens').selectOption('exact');await complete(page);
    const conflict=page.locator('[data-role="'+role('note.txt')+'"]');assert.equal(await conflict.getAttribute('data-outcome'),'CONFLICT');
    assert.match(await conflict.innerText(),/Unresolved position/);assert.doesNotMatch(await conflict.innerText(),/note.txt/);
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await conflict.locator('button').click();assert(await page.locator('#why').isVisible());
      assert.equal(await page.locator('#identity-details').getAttribute('open'),null);
      assert.equal(await page.locator('#identity-details dd').first().isVisible(),false,'exact IDs start collapsed');
      await page.locator('#identity-details summary').click();assert.equal(await page.locator('#identity-details dd').first().isVisible(),true);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.keyboard.press('Escape');assert.equal(await page.locator(':focus').getAttribute('data-why'),role('note.txt'));
    }
    report.checks.push('320/390px explanation reachable, Escape restores opener, no page overflow');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>document.documentElement.style.fontSize='200%');
    assert.equal(await page.locator('.row-title').first().evaluate(n=>getComputedStyle(n).fontSize),'32px','row text really doubles');
    assert.equal(await page.locator('label').first().evaluate(n=>getComputedStyle(n).fontSize),'28px','control labels really double');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await conflict.locator('button').click();assert(await page.locator('#why').isVisible());
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.keyboard.press('Escape');await page.evaluate(()=>document.documentElement.style.fontSize='');
    report.checks.push('200% text at 390px retains explanation and avoids page overflow');
    await page.setViewportSize({width:1280,height:900});await conflict.locator('button').click();
    screen.setDelay(50);await page.locator('#lens').selectOption('aFirst');
    assert.equal(await page.locator('#why').isVisible(),false);assert.equal((await rows(page)).length,0);
    await page.locator('#lens').selectOption('bFirst');await complete(page);await page.waitForTimeout(150);
    assert.deepEqual(ordered(await rows(page)),ordered(truths.get('disagree').inventory(config.mounts.bFirst).results));
    report.checks.push('context switch immediately clears selection; late old-Lens reads stay inert');
    screen.setDelay(0);
    // A selected-record transport fault must not be sold as a complete empty folder.
    const selector=screen.lab.readIface.getFunction('getRecord').selector,entry=screen.f.entryA.slice(2);
    await page.route('**/rpc',async route=>{const body=route.request().postDataJSON();if(body.method==='eth_call'&&body.params[0].data===selector+entry)return route.fulfill({status:502,contentType:'application/json',body:json({error:'injected missing selected Entry'})});return route.continue();});
    await page.locator('#snapshot').selectOption('agreement');await page.locator('#lens').selectOption('aFirst');await settled(page);
    const failed=await rows(page);assert(failed.some(r=>r.outcome==='UNKNOWN'));assert(failed.some(r=>r.outcome==='FOUND'));
    assert.doesNotMatch(await page.locator('#status').innerText(),/empty folder/i);await page.unroute('**/rpc');
    report.checks.push('missing selected Entry produces unresolved evidence, not empty or fallback');
    await page.locator('#refresh').click();await settled(page);
    const prefix=ordered(await rows(page));
    const pageSelector=screen.lab.readIface.getFunction('pagePostingsHydrated').selector;
    let releaseFailure,enteredFailure;
    const failureGate=new Promise(resolve=>{releaseFailure=resolve;}),failureEntered=new Promise(resolve=>{enteredFailure=resolve;});
    await page.route('**/rpc',async route=>{const body=route.request().postDataJSON();if(body.method==='eth_call'&&body.params[0].data.startsWith(pageSelector)){enteredFailure();await failureGate;return route.fulfill({status:502,contentType:'application/json',body:json({error:'injected continuation failure'})});}return route.continue();});
    await page.locator('#more').click();await failureEntered;
    await page.locator('[data-why]').first().click();assert.equal(await page.locator('#why').isVisible(),true);
    releaseFailure();await settled(page);
    assert.equal(await page.locator('#why').isVisible(),false,'listing transition invalidates the open prior explanation');
    assert.equal(await page.locator('#coverage').textContent(),'Read unavailable');
    assert.match(await page.locator('#status').innerText(),/prior sealed rows only/);
    assert.deepEqual(ordered(await rows(page)),prefix);assert.equal(await page.locator('#more').isVisible(),false);
    await page.locator('[data-why]').first().click();assert.match(await page.locator('#why-body').innerText(),/prior sealed rows/);
    const attempts=Number((await page.locator('#rpc-details summary').innerText()).match(/\d+/)[0]);await page.locator('#rpc-details summary').click();
    assert.equal(JSON.parse(await page.locator('#rpc-details pre').innerText()).length,attempts,'one immutable evidence snapshot');
    await page.keyboard.press('Escape');
    await page.unroute('**/rpc');report.checks.push('failed continuation retains labeled prior sealed prefix, never stale COMPLETE');
    await context.close();
    for(const delayMs of [0,50])for(let sample=0;sample<3;sample++){
      screen.setDelay(delayMs);const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage();
      await ctx.addInitScript(()=>{window.walletTouches=0;Object.defineProperty(window,'ethereum',{get(){window.walletTouches++;throw Error('guest touched wallet');}});});
      p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(new URL(r.url()).origin!==url)external.push(r.url());});
      const start=trace.length,t0=performance.now();await p.goto(url+'/?snapshot=agreement&lens=aFirst');await settled(p);
      const firstMs=performance.now()-t0,firstEnd=trace.length;
      assert.equal((await rows(p)).length,4);assert.equal(await p.locator('#coverage').textContent(),'Partial listing');
      const t1=performance.now();await p.locator('#more').click();await settled(p);const moreMs=performance.now()-t1;
      assert.deepEqual(ordered(await rows(p)),ordered(truths.get('agreement').inventory(config.mounts.aFirst).results));
      const observed=trace.slice(start),first=trace.slice(start,firstEnd),more=trace.slice(firstEnd);
      assert(observed.every(x=>x.endedMs!==null&&!x.error));
      assert.equal(await p.evaluate(()=>window.walletTouches),0);
      const resources=await p.evaluate(()=>[...performance.getEntriesByType('navigation'),...performance.getEntriesByType('resource')].map(x=>({name:new URL(x.name).pathname,transferSize:x.transferSize,encodedBodySize:x.encodedBodySize,decodedBodySize:x.decodedBodySize,duration:x.duration})));
      report.samples.push({delayMs,sample,navigationToRowsMs:firstMs,continuationMs:moreMs,first:{requests:first.length,jsonResultBytes:first.reduce((s,x)=>s+x.bytes,0)},continuation:{requests:more.length,jsonResultBytes:more.reduce((s,x)=>s+x.bytes,0)},resources:resources.filter(x=>x.name!=='/rpc')});
      if(sample===0&&delayMs===0&&process.env.EFS_FILES_SCREEN_EVIDENCE){
        const dir=new URL('../evidence/',import.meta.url);await mkdir(dir,{recursive:true});await p.screenshot({path:new URL('desktop.png',dir).pathname,fullPage:true});
        await p.setViewportSize({width:390,height:844});await p.locator('[data-why]').first().click();await p.screenshot({path:new URL('phone.png',dir).pathname,fullPage:true});
      }
      await ctx.close();
    }
    assert.equal(errors.length,0,json(errors));assert.equal(external.length,0,json(external));report.checks.push('zero page errors, external requests or wallet access');
    report.browser=browser.version();report.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    report.sourcePins={};for(const p of ['scripts/server.mjs','test/screen-fixture.mjs','test/files-screen.browser.mjs','web/app.mjs','web/rpc-source.mjs','web/index.html','web/files.css'])report.sourcePins[p]=createHash('sha256').update(await readFile(new URL('../'+p,import.meta.url))).digest('hex');
    if(process.env.EFS_FILES_SCREEN_EVIDENCE){await mkdir(new URL('../evidence/',import.meta.url),{recursive:true});await writeFile(new URL('../evidence/browser.json',import.meta.url),json(report)+'\n');}
    console.log(json({checks:report.checks,samples:report.samples.map(({resources,...x})=>x),browser:report.browser}));
  });}finally{await browser.close();}
});
