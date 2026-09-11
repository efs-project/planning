import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E} from '../scripts/world.mjs';
import {createClient} from '../sdk/client.mjs';
test('dropped submission and polling responses retain local hash, block writes and reconcile without resend',async()=>{
  await withWorld(async w=>{
    await w.client.write('ensureRoot',[]);
    const root=(await w.client.call('rootId',[w.config.namespace])).value;
    const original=globalThis.fetch, journal=[];let mode='submit',sends=0,expectedHash;
    globalThis.fetch=async(url,options)=>{
      const request=JSON.parse(options.body);
      if(request.method==='eth_sendRawTransaction'){
        sends++;expectedHash=E.keccak256(request.params[0]);const response=await original(url,options);
        if(mode==='submit'){await response.text();throw Error('injected lost submission response after node accepted');}return response;
      }
      if(request.method==='eth_getTransactionReceipt'&&mode==='poll')throw Error('injected interrupted polling');
      if(request.method==='eth_call'&&mode==='verify')throw Error('injected interrupted canonical verification');
      return original(url,options);
    };
    try{
      const onAction=a=>{const i=journal.findIndex(x=>x.hash===a.hash);if(i<0)journal.push(a);else journal[i]=a;};
      let c=createClient(E,w.config,{onAction});
      for(const [name,failure] of [['lost-submit','submit'],['lost-poll','poll'],['lost-verification','verify']]){
        mode=failure;const before=sends;
        const expectedStatus=failure==='verify'?'VERIFICATION_UNKNOWN':'SUBMISSION_UNKNOWN';
        await assert.rejects(()=>c.write('createDirectory',[root,E.toUtf8Bytes(name)]),e=>e.status===expectedStatus&&e.hash===expectedHash);
        const pending=journal.at(-1);assert.equal(pending.hash,expectedHash);if(failure==='verify')assert(BigInt(pending.gasUsed)>0n);else assert.equal(pending.gasUsed,null);assert.equal(pending.status,expectedStatus);
        assert.throws(()=>createClient(E,w.config,{initialActions:[{...pending,status:'CORRUPTED'}]}),/journal/i);
        await assert.rejects(()=>c.write('createDirectory',[root,E.toUtf8Bytes('unsafe-retry')]),/Reconcile/);assert.equal(sends,before+1);
        // Recreating the client from a saved journal must preserve the write hold.
        c=createClient(E,w.config,{initialActions:JSON.parse(JSON.stringify(journal)),onAction});
        await assert.rejects(()=>c.write('ensureRoot',[]),/Reconcile/);
        mode='healthy';let result;for(let i=0;i<50;i++){result=await c.reconcile();if(result.status==='COMMITTED')break;await new Promise(r=>setTimeout(r,20));}
        assert.equal(result.status,'COMMITTED');assert.equal(result.hash,expectedHash);assert.equal(result.basis.blockHash,result.receipt.blockHash);assert(BigInt(result.gasUsed)>0n);assert.equal(sends,before+1);
        assert.notEqual((await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes(name)])).value,'0x'+'0'.repeat(64));
        // Reflect the read-only update in the saved journal for the next cycle.
        Object.assign(journal.at(-1),result);
      }
      return {};
    }finally{globalThis.fetch=original;}
  });
});
