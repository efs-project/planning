/** Bounded local integration + matched offchain-size cost experiment. Optional
 * --serve retains only this newly created browser/Anvil for owner interaction. */
import assert from 'node:assert/strict';
import {startWorkbench} from './workbench-browser.mjs';
import {publicExternalSamples} from './external-content-fixtures.mjs';
import {describeExternal,createExternalLoader} from '../browser/external-content.mjs';
import {encodeDescriptor} from '../browser/compact-content.mjs';
const wb=await startWorkbench(),{env,sdk,run,seed}=wb;
try{
  const authors=Object.values(env.manifest.authors),context=await sdk.pin();
  const loadCarrier=createExternalLoader({gateways:env.manifest.externalGateways});
  const reads=[];
  for(let i=0;i<seed.externalSamples.length;i++){
    const result=await sdk.readContent({file:seed.externalSamples[i].file,authors,context,loadCarrier});
    assert.equal(result.state,'AVAILABLE_VERIFIED');assert.equal(result.descriptor.locator,publicExternalSamples[i].locator);
    assert.equal(result.bytes.length,publicExternalSamples[i].length);
    const noGateway=await sdk.readContent({file:seed.externalSamples[i].file,authors,context,loadCarrier:createExternalLoader({gateways:{}})});
    assert.equal(noGateway.state,'UNAVAILABLE');
    const badGateway=await sdk.readContent({file:seed.externalSamples[i].file,authors,context,loadCarrier:async()=>new Uint8Array(publicExternalSamples[i].length)});
    assert.equal(badGateway.state,'CORRUPT');
    reads.push({locator:result.descriptor.locator,bytes:result.bytes.length,digest:result.descriptor.digest,state:result.state,unavailable:noGateway.state,corrupt:badGateway.state});
  }
  const costs=[];let snapshot=await env.rpc('evm_snapshot',[]);
  for(const length of [1024,1048576,16777216]){
    const descriptor=await describeExternal(new Uint8Array(length),{locator:'ar://'+'A'.repeat(43)}),before=env.transactions.length;
    const plan=await run('create',{folder:seed.docs.file,name:'cost-control.bin',salt:env.ethers.id('external-matched-cost'),content:{descriptor}});
    costs.push({payloadBytes:length,descriptorBytes:encodeDescriptor(descriptor).length,actions:plan.actions.length,
      transactions:env.transactions.slice(before).map(({gasUsed,calldataBytes,status})=>({gasUsed,calldataBytes,status}))});
    assert.equal(await env.rpc('evm_revert',[snapshot]),true);snapshot=await env.rpc('evm_snapshot',[]);
  }
  assert(costs.every(c=>c.descriptorBytes===240&&c.actions===costs[0].actions));
  const report=await env.writeReport('external-content-report',{reads,costs,qualification:'LOCAL_RPC_OBSERVED; EFS_SHA256_NOT_AR_OR_IPFS_PROTOCOL_PROOF',
    profileTradeoff:'Required scalar/digest index is coupled to descriptor ABI word3 algorithm, word4 length, word5 digest. Compact external header retains these offsets at192 bytes; this limits savings and is not a permanent protocol ruling.'});
  console.log(JSON.stringify({report,reads,costs,dir:env.dir,anvilPid:env.anvilPid}));
  if(!process.argv.includes('--serve'))await wb.close();
  else{process.once('SIGINT',()=>wb.close());process.once('SIGTERM',()=>wb.close());}
}catch(error){await wb.close();throw error;}
