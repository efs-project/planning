import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import {withWorld,E,ROOT} from '../scripts/world.mjs';
import {seed} from '../scripts/benchmark.mjs';
const serverModule=await import('../scripts/server.mjs').catch(()=>({}));
test('browser filesystem loop writes contracts, reloads history, uploads bytes, and surfaces RPC failure', {timeout:180000}, async()=>{
  assert.equal(typeof serverModule.withServer,'function');
  await withWorld(async w=>{
    await seed(w);
    return serverModule.withServer(w.config,async url=>{
      assert.equal((await fetch(url+'/../../AGENTS.md')).status,404);
      assert.equal((await fetch(url+'/toString')).status,404);
      assert.equal((await fetch(url+'/config.json',{method:'POST'})).status,405);
      const browser=await chromium.launch({headless:true});
      try {
        const page=await browser.newPage({viewport:{width:1280,height:900}});
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(url);await page.getByRole('button',{name:'Documents',exact:true}).click();
        await page.getByLabel('New name').fill('<notes>%2F.txt');await page.getByLabel('New text').fill('first bytes');await page.getByRole('button',{name:'Create text file',exact:true}).click();
        await page.getByRole('button',{name:'<notes>%2F.txt',exact:true}).click();
        await page.getByLabel('File text').fill('second bytes');await page.getByRole('button',{name:'Save revision',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('#file-state').textContent.includes('Revision 2'));
        await page.getByLabel('Rename to').fill('renamed.txt');await page.getByRole('button',{name:'Rename file',exact:true}).click();
        await page.getByRole('button',{name:'Reload canonical state',exact:true}).click();
        await page.reload();
        await page.getByRole('button',{name:'renamed.txt',exact:true}).click();
        await page.waitForFunction(()=>!document.querySelector('#file-text').disabled);
        assert.equal(await page.getByLabel('File text').inputValue(),'second bytes');
        await page.getByRole('button',{name:'Show history',exact:true}).click();
        await page.getByRole('button',{name:'Open revision 1',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('#history-bytes').textContent.includes('first bytes'));
        assert.match(await page.locator('#history-bytes').textContent(),/first bytes/);
        await page.screenshot({path:ROOT+'evidence/browser.png',fullPage:true});
        await page.getByLabel('New name').fill('nested');await page.getByRole('button',{name:'Create folder',exact:true}).click();
        await page.getByRole('button',{name:'nested',exact:true}).click();
        await page.getByLabel('Upload file').setInputFiles({name:'raw.bin',mimeType:'application/octet-stream',buffer:Buffer.from([0,1,255,2])});
        await page.getByRole('button',{name:'Upload bytes',exact:true}).click();await page.getByRole('button',{name:'raw.bin',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('#file-state').textContent.includes('Verified 4 bytes'));
        assert.match(await page.locator('#file-state').textContent(),/not UTF-8/);
        page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Unlink file',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('#listing-state').textContent.includes('Empty directory'));
        const id=(await w.client.call('resolve',[w.config.namespace,['Documents','renamed.txt'].map(n=>E.toUtf8Bytes(n))])).value;
        assert.equal((await w.client.call('fileInfo',[id])).value.revision,3n);
        await page.getByRole('button',{name:'Gas & modelled cost',exact:true}).click();assert.match(await page.locator('#gas-drawer').textContent(),/MODEL/);
        await page.screenshot({path:ROOT+'evidence/gas-drawer.png',fullPage:true});
        await page.route(w.config.rpc,route=>route.abort());await page.getByRole('button',{name:'Reload canonical state',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('#error').textContent.length>0);
        assert.equal(await page.locator('#listing-state').textContent(),'Read failed — no empty-state claim');
        assert.deepEqual(errors,[]);
        return {browser:'passed'};
      } catch(error) {for(const p of browser.contexts().flatMap(c=>c.pages())) console.error('Browser failure state:',await p.locator('body').innerText());throw error;} finally {await browser.close();}
    });
  });
});
