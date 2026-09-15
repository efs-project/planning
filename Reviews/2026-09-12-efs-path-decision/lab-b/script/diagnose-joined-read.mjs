/** Small exact-width diagnostic: no storage writes, gas-cap raises or traces. */
import assert from 'node:assert/strict';
import {createEnvironment} from './compact-environment.mjs';
import {seedJoinedScale,sourcePins} from './measure-joined.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append',benchmarkHistory:true});
const report={status:'RUNNING',sourcePins:await sourcePins(env),recipe:'32 actual live entries; empty authors before Alice; no mining during each pinned diagnostic',reads:[],rpcHistory:env.historyPolicy};
try {
  const seed=await seedJoinedScale(env,{live:32,lifetime:0,denseAuthors:0});
  await env.deploy('pagePaid','FilesPageReader.sol','FilesPagePaid');
  const e=env.ethers,joined=new e.Interface(env.contracts.joined.abi),paid=new e.Interface(env.contracts.pagePaid.abi);
  for(const width of [32,64])for(const budget of [32,16,8,4,1]){
    const failures=[],rpc=async(method,params)=>{try{return await env.rpc(method,params);}catch(error){failures.push({method,params,message:error.message,rpcError:error.rpcError});throw error;}};
    const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc}),context=await sdk.pin();
    const authors=[...Array.from({length:width-1},(_,i)=>e.getAddress('0x'+e.id('sparse-empty-'+i).slice(-40))),env.wallets.alice.address];
    const start=performance.now(),page=await sdk.listFolderPage({folder:seed.liveFolder,authors,context,budget,concept:seed.concept,tagScope:'revision'});
    const row={width,budget,coverage:page.queryCoverage,scanned:page.scanned,rows:page.pageRows.length,ms:performance.now()-start,failures};report.reads.push(row);
    const args=[env.contracts.joined.address,seed.liveFolder,authors.map(a=>e.zeroPadValue(a,32)),[seed.concept,2,false,''],[context.admission,context.generation,context.epoch,context.executionSet],'0x',budget];
    const data=paid.encodeFunctionData('read',args);
    try {
      // Simulate exactly the signed transaction ceiling before sending; no cap relaxation.
      await env.rpc('eth_call',[{from:env.wallets.deployer.address,to:env.contracts.pagePaid.address,data,gas:'0x1000000'},'0x'+BigInt(context.blockNumber).toString(16)]);
      const pending=await env.enqueue(`diagnostic/paid/${width}/${budget}`,{to:env.contracts.pagePaid.address,data,gasLimit:16777216n});
      row.paid=await env.observe(pending);assert.equal(row.paid.status,'SUCCESS');
    }catch(error){row.paidCapFailure={message:error.message,rpcError:error.rpcError};}
    if(failures[0]?.params?.[0]?.data){const decoded=joined.decodeFunctionData('readPage',failures[0].params[0].data);row.failedCall={gasField:failures[0].params[0].gas??'omitted: provider default',block:failures[0].params[1],calldataBytes:(failures[0].params[0].data.length-2)/2,budget:String(decoded.at(-1))};
      try {await env.rpc('eth_call',[{...failures[0].params[0],gas:'0x1c9c380'},failures[0].params[1]]);row.explicit30M='SUCCESS';}
      catch(error){row.explicit30M={message:error.message,rpcError:error.rpcError};}
    }
    await env.writeReport('joined-read-diagnostic',report);console.log(JSON.stringify({width,budget,coverage:row.coverage,scanned:row.scanned,paidGas:row.paid?.gasUsed,failure:failures[0]?.message,paidFailure:row.paidCapFailure?.message}));
  }
  report.status='PASS';report.deployments=env.manifest.contracts;await env.writeReport('joined-read-diagnostic',report);console.log('READ_DIAGNOSTIC '+env.dir);
}finally{await env.close();}
