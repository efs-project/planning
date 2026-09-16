/** Real local-chain journey through ethers BrowserProvider with a disposable
 * EIP-1193 signer harness. NOT evidence of clicking MetaMask's extension UI. */
import assert from 'node:assert/strict';
import {loadEthers,createReadTransport} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
import {requestLocalNetwork,verifyWalletEnvironment,fundLocalWallet,signPlanIntent} from '../browser/wallet-session.mjs';
const configUrl=process.argv[2];
assert(/^http:\/\/127\.0\.0\.1:\d+\/config\.json$/.test(configUrl),'explicit owned local config URL');
const config=await(await fetch(configUrl)).json(),e=await loadEthers(),rpc=createReadTransport({url:config.rpcUrl});
const owner=e.Wallet.createRandom(),address=owner.address,counts={signatures:0,transactions:0};
const ethereum={request:async({method,params=[]})=>{
  if(['eth_accounts','eth_requestAccounts'].includes(method))return [address];
  if(method==='eth_signTypedData_v4'){
    assert.equal(params[0].toLowerCase(),address.toLowerCase());const data=JSON.parse(params[1]);delete data.types.EIP712Domain;
    counts.signatures++;return owner.signTypedData(data.domain,data.types,data.message);
  }
  if(method==='eth_sendTransaction'){
    const tx=params[0];assert.equal(tx.from.toLowerCase(),address.toLowerCase());assert.equal(tx.to.toLowerCase(),config.manifest.contracts.ledger.address.toLowerCase());
    counts.transactions++;return rpc('eth_sendRawTransaction',[await owner.signTransaction({to:tx.to,data:tx.data,
      chainId:BigInt(config.manifest.chainId),nonce:Number(BigInt(await rpc('eth_getTransactionCount',[address,'pending']))),
      type:0,gasLimit:BigInt(tx.gas),gasPrice:BigInt(await rpc('eth_gasPrice'))})]);
  }
  return rpc(method,params);
}};
await requestLocalNetwork({ethereum,config,pageUrl:configUrl});
await verifyWalletEnvironment({ethereum,config,rpc,keccak256:e.keccak256});
await fundLocalWallet({config,pageUrl:configUrl,address,rpc});
const provider=new e.BrowserProvider(ethereum,'any',{cacheTimeout:-1}),signer=await provider.getSigner();
const entries=new Map(),journal={get:async id=>entries.get(id),put:async value=>entries.set(value.id,value)};
const sdk=createFilesCompactSdk({ethers:e,manifest:config.manifest,rpc,journal}),authors=[address,...Object.values(config.manifest.authors)];
const results=[];
async function run(operation,args){
  await verifyWalletEnvironment({ethereum,config,rpc,keccak256:e.keccak256});
  const plan=await sdk.prepare({operation,author:address,authors,...args});
  const signed=await sdk.authorize(plan,(digest,p)=>signPlanIntent({signer,plan:p,digest,ethers:e}));
  let txHash;
  await sdk.submit(signed,async tx=>{
    const gas=BigInt(await rpc('eth_estimateGas',[{...tx,from:address}]));
    const sent=await signer.sendTransaction({...tx,chainId:BigInt(config.manifest.chainId),gasLimit:gas*120n/100n});txHash=sent.hash;return sent;
  });
  const outcome=await sdk.reconcile(plan.id);assert.equal(outcome.status,'EFFECTS_VERIFIED');
  const receipt=await rpc('eth_getTransactionReceipt',[txHash]);results.push({operation,gas:Number(BigInt(receipt.gasUsed)),status:outcome.status});return plan;
}
const suffix=address.slice(2,10).toLowerCase();
const folder=await run('createDirectory',{name:'wallet-'+suffix,salt:e.id('wallet-folder/'+suffix)});
const file=await run('create',{folder:folder.file,name:'hello.txt',salt:e.id('wallet-file/'+suffix),document:'Written with an injected-wallet protocol.'});
await run('edit',{file:file.file,document:'Wallet edit verified.'});
assert.equal(e.toUtf8String((await sdk.readContent({file:file.file,authors,context:await sdk.pin()})).bytes),'Wallet edit verified.');
await run('addTag',{file:file.file,scope:'file',conceptLabel:'wallet-test',conceptNamespace:config.manifest.folder});
await run('rename',{folder:folder.file,file:file.file,fromFolder:folder.file,fromName:'hello.txt',name:'renamed.txt'});
await run('move',{folder:folder.file,file:file.file,fromFolder:folder.file,fromName:'renamed.txt',name:'wallet-'+suffix+'.txt',toFolder:config.manifest.folder});
await run('remove',{folder:config.manifest.folder,file:file.file,name:'wallet-'+suffix+'.txt'});
await run('restorePlacement',{folder:config.manifest.folder,file:file.file,name:'wallet-'+suffix+'.txt',replace:true});
assert.equal((await sdk.readPlacement({folder:config.manifest.folder,name:'wallet-'+suffix+'.txt',authors,context:await sdk.pin()})).knowledge,'PRESENT');
assert.equal(counts.signatures,8);assert.equal(counts.transactions,8);
console.log(JSON.stringify({kind:'EIP1193_HARNESS_NOT_METAMASK_UI',author:address,counts,results},null,2));
await provider.destroy();
