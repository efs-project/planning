import test from 'node:test';
import assert from 'node:assert/strict';
import {compileUpgrade,withUpgrade} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {startEnvironment,compileRouter} from '../scripts/environment.mjs';

test('guest relay accepts only the existing pinned checked Record read path and retains refusals',{timeout:180000},async()=>{
  compileUpgrade();compileRouter();
  await withUpgrade(async lab=>{
    const env=await startEnvironment(lab,{write:false,sponsor:false});
    try{
      const block=await lab.rpc('eth_getBlockByNumber',['latest',false]);
      const pin={blockHash:block.hash,requireCanonical:true};
      const id=lab.iface.decodeFunctionResult('recordIdAt',await lab.rpc('eth_call',[{to:lab.core,data:lab.iface.encodeFunctionData('recordIdAt',[1])},pin]))[0];
      const current=lab.readIface.encodeFunctionData('getRecordsCurrent',[[id]]);
      const expected=await lab.rpc('eth_call',[{to:lab.core,data:current},pin]);
      const [basis]=lab.readIface.decodeFunctionResult('getRecordsCurrent',expected);
      const checked=lab.readIface.encodeFunctionData('getRecordsChecked',[basis,[id]]);
      const request=async(method,params)=>{
        const response=await fetch(env.server.url+'/rpc',{method:'POST',headers:{origin:env.server.url,'content-type':'application/json'},body:JSON.stringify({method,params})});
        return{status:response.status,body:await response.json()};
      };
      for(const data of[current,checked]){
        const result=await request('eth_call',[{to:lab.core,data},pin]);
        assert.equal(result.status,200);assert.equal(result.body.result,expected);
      }
      for(const[method,params]of[
        ['eth_call',[{to:'0x0000000000000000000000000000000000000001',data:checked},pin]],
        ['eth_call',[{to:lab.core,data:checked,from:lab.core},pin]],
        ['eth_call',[{to:lab.core,data:'0xdeadbeef'},pin]],
        ['eth_call',[{to:lab.core,data:checked},'pending']],
        ['eth_sendRawTransaction',['0x00']],
      ]){const r=await request(method,params);assert.equal(r.status,400);assert.equal(r.body.error,'request refused');}
      const malformed=await request('eth_call',[{to:lab.core,data:checked.slice(0,10)},pin]);
      assert.equal(malformed.status,502,'Core ABI validator, not relay success, rejects missing arguments');
    }finally{await env.server.close();}
  },{profile:'reads',watchdogMs:150000});
});
