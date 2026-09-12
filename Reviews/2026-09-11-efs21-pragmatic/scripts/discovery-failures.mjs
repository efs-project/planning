import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,withWorld,artifact} from './world.mjs';

// Test-only driver/coordinator subclass. Never substitutes the kernel's immutable coordinator.
export async function failureReceipts(w) {
  const c=w.client,fixture=JSON.parse(readFileSync(ROOT+'contracts/out/Discovery.t.sol/DiscoveryFaultDriver.json'));
  const fi=new E.Interface(fixture.abi),faultArtifact=JSON.parse(readFileSync(ROOT+'contracts/out/Discovery.t.sol/FaultDiscovery.json'));
  const di=new E.Interface(faultArtifact.abi),ni=new E.Interface(artifact('NavigationIndex').abi),cases=[];
  for(const required of [true,false]) {
    const deployed=await w.rawSend('deploy test-only fault driver '+required,fixture.bytecode.object+fi.encodeDeploy([w.config.kernel]).slice(2));
    const driver=deployed.contractAddress;
    await w.rawSend('initialize fault fixture '+required,fi.encodeFunctionData('initialize',[w.config.quoteType,required]),driver);
    const index=(await c.call('index',[],undefined,driver,fi)).value,file=(await c.call('file',[],undefined,driver,fi)).value;
    const nav=w.provenance.runtimes.NavigationIndex.address,root=(await c.call('rootId',[driver])).value;
    const runtime=await c.rpc('eth_getCode',[index,'latest']);
    const rows=[];
    for(const fault of [1,2]) {
      await w.rawSend('test-only set child fault '+fault,di.encodeFunctionData('setFault',[fault]),index);
      const before=await c.observe(),info=(await c.call('fileInfo',[file],before)).value;
      const status=(await c.call('status',[driver],before,index,di)).value;
      const page=(await c.call('directoryPage',[driver,root,[E.ZeroHash,0,0],64],before,nav,ni)).value;
      const label=(required?'required':'tolerated')+(fault===1?' partial-write revert':' child OOG');
      const send=()=>c.sendData(label,fi.encodeFunctionData('change',[10+fault,info.revision]),driver);
      if(required) await assert.rejects(send); else await send();
      const action=w.actions.at(-1),basis=await c.observe();
      assert.equal(basis.blockHash,action.receipt.blockHash);
      const after=(await c.call('fileInfo',[file],basis)).value,health=(await c.call('status',[driver],basis,index,di)).value;
      assert.equal((await c.call('childWrite',[],basis,index,di)).value,0n,'actual child storage write reverted');
      if(required) {
        assert.deepEqual([...after],[...info]); assert.deepEqual([...health],[...status]);
        assert.equal((await c.call('directoryPage',[driver,root,[...page.next],64],basis,nav,ni)).value.ids.length,0);
        assert.equal((await c.call('probe',[driver,status.epoch,1,file],basis,index,di)).value,1n);
      } else {
        assert.equal(after.revision,info.revision+1n); assert.equal(health.health,3n);
        await assert.rejects(()=>c.call('probe',[driver,status.epoch,1,file],basis,index,di));
        await assert.rejects(()=>c.call('probe',[driver,status.epoch,10+fault,file],basis,index,di));
      }
      action.benchmarkCanonicalCheck={basis,kernel:[...after],profile:[...health],childWrite:'0',requiredRollback:required}; rows.push(action);
      const recovery=await c.sendData('fresh epoch rebuild '+label,fi.encodeFunctionData('recover'),driver);
      const rb=await c.observe(),rs=(await c.call('status',[driver],rb,index,di)).value;
      assert.equal(rs.health,2n); assert.equal(rs.epoch,status.epoch+1n);
      assert.equal((await c.call('probe',[driver,rs.epoch,required?1:10+fault,file],rb,index,di)).value,1n);
      recovery.benchmarkCanonicalCheck={basis:rb,profile:[...rs]}; rows.push(recovery);
    }
    // Actual outer OOG, separate from caught child OOG, propagates through the fixture's fail-closed caller.
    const before=await c.observe(),info=(await c.call('fileInfo',[file],before)).value,status=(await c.call('status',[driver],before,index,di)).value;
    const navBefore=(await c.call('directoryPage',[driver,root,[E.ZeroHash,0,0],64],before,nav,ni)).value;
    await assert.rejects(()=>c.sendData('outer OOG '+required,fi.encodeFunctionData('changeOuterOOG',[99,info.revision]),driver));
    const outer=w.actions.at(-1),basis=await c.observe();
    assert.deepEqual([...(await c.call('fileInfo',[file],basis)).value],[...info]);
    assert.deepEqual([...(await c.call('status',[driver],basis,index,di)).value],[...status]);
    assert.equal((await c.call('directoryPage',[driver,root,[...navBefore.next],64],basis,nav,ni)).value.ids.length,0);
    outer.benchmarkCanonicalCheck={basis,allThreeRollback:true};rows.push(outer);
    cases.push({required,driver,index,file,indexRuntimeHash:E.keccak256(runtime),actions:rows});
  }
  const sourcePins={...fixture.metadata.sources,...faultArtifact.metadata.sources};
  for(const [path,pin] of Object.entries(sourcePins)) assert.equal(E.keccak256(readFileSync(ROOT+'contracts/'+path)),pin.keccak256,'test fixture source pinned');
  return {standing:'Test-only source driver plus DiscoveryIndex subclass; actual EVM receipt fault isolation evidence, not production-kernel hook premium',
    setup:w.setup,cases,provenance:w.provenance,testFixture:{sourcePins,driverCreationHash:E.keccak256(fixture.bytecode.object),indexCreationHash:E.keccak256(faultArtifact.bytecode.object)},
    limitations:['Fault toggles exist only in contracts/test/Discovery.t.sol, never in production contracts','Production NativeKernel required/tolerated and malformed-return guards are separately tested with Foundry call interception','Outer OOG receipt exercises explicit 1000-gas fail-closed driver call; production kernel call guard is separately tested at low supplied gas']};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=await withWorld(failureReceipts);
  assert.equal(result.cleanup.cacheRemoved,true);
  writeFileSync(ROOT+'evidence/discovery-failures.json',JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
  console.log(JSON.stringify(result.cases.map(c=>({required:c.required,actions:c.actions.map(a=>({label:a.label,status:a.status,gasUsed:a.gasUsed}))}))));
}
