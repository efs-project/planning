/** Small exact-width diagnostic: no storage writes, gas-cap raises or traces. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEnvironment} from './compact-environment.mjs';
import {seedJoinedScale,sourcePins} from './measure-joined.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
export async function diagnoseJoinedRead({environment=createEnvironment,pinSource=sourcePins,matrix=[32,64].flatMap(width=>[32,16,8,4,1].map(budget=>[width,budget]))}={}){
const env=await environment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append',benchmarkHistory:true});
try {
  const started=performance.now();
  const report={status:'RUNNING',runDirectory:env.dir,sourcePins:await pinSource(env),recipe:'32 actual live entries; empty authors before Alice; no mining during each pinned diagnostic',reads:[],rpcHistory:env.historyPolicy};
  const seed=await seedJoinedScale(env,{live:32,lifetime:0,denseAuthors:0});
  await env.deploy('pagePaid','FilesPageReader.sol','FilesPagePaid');
  const e=env.ethers,joined=new e.Interface(env.contracts.joined.abi),paid=new e.Interface(env.contracts.pagePaid.abi);
  assert(matrix.length<=10&&matrix.every(([width,budget])=>[1,8,32,64].includes(width)&&[32,16,8,4,1].includes(budget)),'bounded diagnostic matrix');
  for(const [width,budget] of matrix){
    const failures=[],rpc=async(method,params)=>{try{return await env.rpc(method,params);}catch(error){failures.push({method,params,message:error.message,rpcError:error.rpcError});throw error;}};
    const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc}),context=await sdk.pin();
    const authors=[...Array.from({length:width-1},(_,i)=>e.getAddress('0x'+e.id('sparse-empty-'+i).slice(-40))),env.wallets.alice.address];
    const start=performance.now(),before={...env.metrics},page=await sdk.listFolderPage({folder:seed.liveFolder,authors,context,budget,concept:seed.concept,tagScope:'revision'});
    const row={width,budget,context,coverage:page.queryCoverage,scanned:page.scanned,rows:page.pageRows.length,ms:performance.now()-start,
      rpc:Object.fromEntries(['calls','httpRequests','httpBatches','requestBytes','responseBytes'].map(k=>[k,env.metrics[k]-before[k]])),failures};report.reads.push(row);
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
  report.status='PASS';report.elapsedMs=performance.now()-started;report.metrics=env.metrics;
  report.deployments=env.manifest.contracts;await env.writeReport('joined-read-diagnostic',report);console.log('READ_DIAGNOSTIC '+env.dir);
  return report;
}finally{await env.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await diagnoseJoinedRead();
