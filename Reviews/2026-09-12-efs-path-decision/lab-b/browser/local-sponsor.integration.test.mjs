import test from 'node:test';
import assert from 'node:assert/strict';
import {startWorkbench} from '../script/workbench-browser.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {sendLocalSponsoredTransaction,signPlanIntent,journalPrefix} from './wallet-session.mjs';
import {costPresentation} from './files-view.mjs';

test('disposable Anvil payer carries one portable wallet intent without wallet tx approval or author funds',async()=>{
  const workbench=await startWorkbench({serve:false,rpcPort:0});
  let provider;
  try{
    const {env,config}=workbench,{ethers:e,rpc}=env,owner=e.Wallet.createRandom();
    const counts={signatures:0,walletTransactions:0};
    const injected={request:async({method,params=[]})=>{
      if(['eth_accounts','eth_requestAccounts'].includes(method))return [owner.address];
      if(method==='eth_signTypedData_v4'){
        counts.signatures++;const value=JSON.parse(params[1]);delete value.types.EIP712Domain;
        return owner.signTypedData(value.domain,value.types,value.message);
      }
      if(method==='eth_sendTransaction'){counts.walletTransactions++;throw Error('Wallet payment must not be requested');}
      return rpc(method,params);
    }};
    provider=new e.BrowserProvider(injected,'any',{cacheTimeout:-1});
    const signer=await provider.getSigner(),genesisHash=(await rpc('eth_getBlockByNumber',['0x0',false])).hash;
    const prefix=journalPrefix(config.manifest,genesisHash),entries=new Map();
    const journal={get:async id=>entries.get(prefix+id),put:async entry=>entries.set(prefix+entry.id,entry)};
    const sdk=createFilesCompactSdk({ethers:e,manifest:config.manifest,rpc,journal});
    const plan=await sdk.prepare({operation:'create',name:'sponsored.txt',salt:e.id('sponsored-test'),document:'Author and payer are distinct.',author:owner.address,authors:[owner.address]});
    const signed=await sdk.authorize(plan,(digest,p)=>signPlanIntent({signer,plan:p,digest,ethers:e}));
    const submission=await sdk.submit(signed,transaction=>sendLocalSponsoredTransaction({development:true,config,pageUrl:'http://127.0.0.1:60627/',rpc,ethers:e,keccak256:e.keccak256,genesisHash,transaction}));
    let outcome=await sdk.reconcile(submission.id);
    if(!outcome.receipt)outcome=await sdk.reconcile(submission.id); // one read-only recovery, never rebroadcast
    assert.equal(outcome.status,'EFFECTS_VERIFIED',outcome.error);
    assert.equal(outcome.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN');
    assert.deepEqual(counts,{signatures:1,walletTransactions:0});
    assert.equal(await rpc('eth_getBalance',[owner.address,'latest']),'0x0');
    const tx=await rpc('eth_getTransactionByHash',[outcome.transactionHash]);
    assert.notEqual(tx.from.toLowerCase(),owner.address.toLowerCase());
    assert.equal(tx.from.toLowerCase(),env.wallets.deployer.address.toLowerCase());
    const view=costPresentation([outcome],undefined,e);
    assert.ok(view.total.base>0&&view.total.arbitrum>0&&view.total.ethereum>0);
    console.log(JSON.stringify({kind:'EIP1193_HARNESS_NOT_METAMASK_UI',genesisHash,author:owner.address,payer:tx.from,counts,
      transactionHash:outcome.transactionHash,gasUsed:outcome.receipt.gasUsed,status:outcome.status,
      modelUsd:{ethereum:view.total.ethereum,base:view.total.base,arbitrum:view.total.arbitrum}}));
  }finally{await provider?.destroy();await workbench.close();}
});
