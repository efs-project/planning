import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import {E,withWorld,artifact} from '../scripts/world.mjs';
import {withServer} from '../scripts/server.mjs';
test('browser explicitly creates/converts representations, preserves Type on edit and exports binary/empty/unknown bytes',{timeout:180000},async()=>{
  await withWorld(async w=>{
    const c=w.client;await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
    await withServer(w.config,async url=>{
      const browser=await chromium.launch({headless:true});
      try{
        const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
        await page.getByRole('button',{name:'Create text file',exact:true}).waitFor();
        assert.equal(await page.locator('#create-representation').count(),1,'creation representation must be explicit');
        const ready=()=>page.waitForFunction(()=>!document.querySelector('#reload').disabled);
        const opened=rev=>page.waitForFunction(r=>document.querySelector('#file-state').textContent.includes('Revision '+r)&&!document.querySelector('#reload').disabled,rev);
        const downloaded=async()=>{
          const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download bytes',exact:true}).click();
          const stream=await(await pending).createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks);
        };
        for(const kind of ['canonical','raw']){
          await ready();await page.locator('#create-representation').selectOption(kind);
          await page.getByLabel('New name').fill(kind+'.txt');await page.getByLabel('New text').fill('first '+kind);
          await page.getByRole('button',{name:'Create text file',exact:true}).click();await opened(1);
          await page.getByLabel('File text').fill('second '+kind);await page.getByRole('button',{name:'Save revision',exact:true}).click();await opened(2);
          const id=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes(kind+'.txt')])).value;
          const record=await c.record((await c.call('fileInfo',[id])).value.recordId);
          assert.equal(record.value.typeId,kind==='raw'?w.config.rawType:w.config.bytesType,'default edits keep original Type');
          await page.reload();await page.getByRole('button',{name:kind+'.txt',exact:true}).click();await opened(2);
          assert.equal((await downloaded()).toString(),'second '+kind);
          await page.getByRole('button',{name:'Show history',exact:true}).click();await ready();
          await page.getByRole('button',{name:'Open revision 1',exact:true}).click();await ready();
          assert.match(await page.locator('#history-bytes').textContent(),new RegExp('first '+kind));
        }
        await page.locator('#edit-representation').selectOption('canonical');
        await page.getByRole('button',{name:'Convert representation',exact:true}).click();await opened(3);
        const id=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes('raw.txt')])).value;
        assert.equal((await c.record((await c.call('fileInfo',[id])).value.recordId)).value.typeId,w.config.bytesType);
        await page.getByRole('button',{name:'Show history',exact:true}).click();await ready();
        await page.getByRole('button',{name:'Open revision 1',exact:true}).click();await ready();assert.match(await page.locator('#history-bytes').textContent(),/first raw/);
        for(const kind of ['canonical','raw'])for(const [name,buffer] of [['empty',Buffer.alloc(0)],['binary',Buffer.from([239,0,255,128,0])]]){
          await page.locator('#create-representation').selectOption(kind);
          await page.getByLabel('Upload file').setInputFiles({name:kind+'-'+name+'.bin',mimeType:'application/octet-stream',buffer});
          await page.getByRole('button',{name:'Upload bytes',exact:true}).click();await opened(1);
          assert.deepEqual(await downloaded(),buffer);
          if(name==='binary')assert.match(await page.locator('#file-state').textContent(),/not UTF-8/);
        }
        const ti=new E.Interface(artifact('ExactTypeRegistry').abi),descriptor=E.toUtf8Bytes('unfamiliar raw descriptor');
        const validator=w.provenance.runtimes.RawBytesValidator;
        const unknown=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[E.id('EFS21_TYPE_V1'),E.keccak256(descriptor),validator.codeHash]));
        await c.sendData('unknown Type',ti.encodeFunctionData('register',[descriptor,validator.address]),(await c.call('types')).value);
        await c.write('createFile',[root,E.toUtf8Bytes('unknown'),unknown,'0x616263']);
        await page.reload();await page.getByRole('button',{name:'unknown',exact:true}).click();await opened(1);
        assert.match(await page.locator('#file-state').textContent(),/Unknown Type/);
        assert.equal(await page.getByLabel('File text').inputValue(),'');
        assert.equal(await page.locator('#save').isVisible(),false);assert.equal(await page.locator('#convert').isVisible(),false);
        assert.deepEqual(await downloaded(),Buffer.from('abc'));
        assert.deepEqual(errors,[]);
      }finally{await browser.close();}
    });return {};
  });
});
