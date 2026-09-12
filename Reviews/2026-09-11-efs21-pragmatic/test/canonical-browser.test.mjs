import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import {withWorld,E} from '../scripts/world.mjs';
import {withServer} from '../scripts/server.mjs';
test('canonical browser single exact Type lifecycle, binary/empty downloads and real failure states',{timeout:180000},async()=>{
 await withWorld(async w=>{
  const c=w.client;await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
  await c.sendData('quote3000',new E.Interface(w.artifact('QuoteProducer').abi).encodeFunctionData('publish',[3000,0]),w.producer);
  await withServer(w.config,async url=>{
   const browser=await chromium.launch({headless:true});
   try{
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    const ready=()=>page.waitForFunction(()=>!document.querySelector('#reload').disabled);
    const opened=revision=>page.waitForFunction(r=>document.querySelector('#file-state').textContent.includes('Revision '+r)&&!document.querySelector('#reload').disabled,revision);
    const click=name=>page.getByRole('button',{name,exact:true}).click();
    await ready();
    assert.deepEqual(await page.locator('#create-representation option').evaluateAll(xs=>xs.map(x=>x.value)),['canonical-u16-bytes']);
    await page.getByLabel('New name').fill('notes.txt');await page.getByLabel('New text').fill('first bytes');await click('Create text file');await opened(1);
    assert.equal(await page.locator('#convert').isVisible(),false);
    await page.getByLabel('File text').fill('second bytes');await click('Save revision');await opened(2);
    await page.getByLabel('Rename to').fill('renamed.txt');await click('Rename file');await opened(3);await page.reload();await click('renamed.txt');await opened(3);
    assert.equal(await page.getByLabel('File text').inputValue(),'second bytes');
    await click('Show history');await ready();await click('Open revision 1');await ready();assert.match(await page.locator('#history-bytes').textContent(),/first bytes/);
    const id=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes('renamed.txt')])).value;
    for(let revision=1;revision<=3;revision++)assert.equal((await c.record((await c.call('revisionAt',[id,revision])).value.recordId)).value.typeId,w.config.bytesType);
    // A second actual writer advances the head after the browser's observation.
    await c.write('editFile',[id,3,w.config.bytesType,c.encodePayload(w.config.bytesType,E.toUtf8Bytes('external bytes'))]);
    await page.getByLabel('File text').fill('stale bytes');await click('Save revision');await ready();assert.match(await page.locator('#error').textContent(),/revert/i);assert.equal((await c.call('fileInfo',[id])).value.revision,4n);
    await click('Reload canonical state');await ready();
    const downloaded=async()=>{const p=page.waitForEvent('download');await click('Download bytes');const stream=await(await p).createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks);};
    for(const [name,buffer]of [['binary.bin',Buffer.from([239,0,255,128,0])],['empty.bin',Buffer.alloc(0)]]){
     await page.getByLabel('Upload file').setInputFiles({name,mimeType:'application/octet-stream',buffer});await click('Upload bytes');await opened(1);assert.deepEqual(await downloaded(),buffer);
     const f=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes(name)])).value;const record=await c.record((await c.call('fileInfo',[f])).value.recordId);assert.equal(record.value.typeId,w.config.bytesType);assert.equal(E.getBytes(record.value.body).length,buffer.length+2);
     page.once('dialog',d=>d.accept());await click('Unlink file');await ready();assert.equal((await c.call('fileInfo',[f])).value.live,false);
    }
    await page.locator('details.diagnostics > summary').click();await click('Read producer /swaps/eth-usdc');await ready();assert.match(await page.locator('#quote-state').textContent(),/3000 at revision 1/);
    await page.route(w.config.rpc,route=>route.abort());await click('Reload canonical state');await ready();assert.equal(await page.locator('#listing-state').textContent(),'Read failed — no empty-state claim');assert(await page.locator('#error').textContent());assert.deepEqual(errors,[]);
   }finally{await browser.close();}
  });return {};
 },{kernelArtifact:'canonical-ref-free-v1'});
});
