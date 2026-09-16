/** Local workbench wallet helpers. No key import, mainnet faucet or relayer. */
const local=hostname=>['127.0.0.1','localhost','[::1]'].includes(hostname);
export function assertLocalConfig(config,pageUrl){
  const page=new URL(pageUrl),rpc=new URL(config.rpcUrl);
  if(!local(page.hostname)||!local(rpc.hostname)||page.protocol!=='http:'||rpc.protocol!=='http:'
    ||rpc.username||rpc.password||!config.manifest.workbench||![31337,31338].includes(Number(config.manifest.chainId)))
    throw Error('This setup is restricted to the disposable local EFS network.');
}
export async function requestLocalNetwork({ethereum,config,pageUrl,add=false}){
  assertLocalConfig(config,pageUrl);
  const chainId='0x'+BigInt(config.manifest.chainId).toString(16);
  const offer=()=>ethereum.request({method:'wallet_addEthereumChain',params:[{chainId,chainName:'EFS local prototype',
    nativeCurrency:{name:'Local test Ether',symbol:'ETH',decimals:18},rpcUrls:[config.rpcUrl]}]});
  if(add){
    // An existing Hardhat entry can have this chain ID but a different RPC.
    // Offer the exact endpoint even then; the caller still verifies the chain.
    await offer();
    await ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId}]});return;
  }
  if(BigInt(await ethereum.request({method:'eth_chainId'}))===BigInt(chainId))return;
  const select=()=>ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId}]});
  try{await select();}catch(error){
    if(Number(error.code??error.data?.originalError?.code)!==4902)throw error;
    await offer();
    await select();
  }
}
export async function verifyWalletEnvironment({ethereum,config,rpc,keccak256}){
  const chain=BigInt(config.manifest.chainId);
  if(BigInt(await ethereum.request({method:'eth_chainId'}))!==chain||BigInt(await rpc('eth_chainId'))!==chain)
    throw Error('Wallet network changed. Reconnect to the EFS local network.');
  // A chain ID alone does not distinguish two Anvil instances. Compare a
  // concrete current block and the exact manifest deployment before signing.
  const block=await rpc('eth_getBlockByNumber',['latest',false]);
  const walletBlock=await ethereum.request({method:'eth_getBlockByNumber',params:[block.number??'0x0',false]});
  if(!block?.hash||walletBlock?.hash!==block.hash)
    throw Error(`MetaMask is using a different local chain. Edit its local network RPC to ${config.rpcUrl}, then reconnect. Do not import a private key.`);
  const ledger=config.manifest.contracts.ledger;
  const code=await ethereum.request({method:'eth_getCode',params:[ledger.address,block.number??'latest']});
  if(code==='0x'||keccak256(code).toLowerCase()!==ledger.codeHash.toLowerCase())
    throw Error('Wallet RPC does not contain this EFS deployment. Check the RPC URL.');
}
export async function fundLocalWallet({config,pageUrl,address,rpc}){
  assertLocalConfig(config,pageUrl);
  if(!/^0x[0-9a-fA-F]{40}$/.test(address)||/^0x0{40}$/i.test(address))throw Error('Connect a wallet address first.');
  if(BigInt(await rpc('eth_chainId'))!==BigInt(config.manifest.chainId)||!/anvil/i.test(await rpc('web3_clientVersion')))
    throw Error('Test funds are only available from the owned local Anvil.');
  const balance=BigInt(await rpc('eth_getBalance',[address,'latest'])),target=100n*10n**18n;
  if(balance<target)await rpc('anvil_setBalance',[address,'0x'+target.toString(16)]);
  return balance<target?target:balance;
}
export async function signPlanIntent({signer,plan,digest,ethers:e}){
  const domain={name:'EFS2-RoadB-Lab',version:'2'},types={IntentV2:[
    'realmId:bytes32','realmOrigin:bytes32','executionSet:bytes32','author:address','nonce:uint64','deadline:uint64',
    'acceptanceProfile:bytes32','indexObligations:bytes32','readSetHash:bytes32','actionsHash:bytes32'
  ].map(v=>{const [name,type]=v.split(':');return {name,type};})};
  const value={...plan.intent,actionsHash:plan.actionsHash};
  if(e.TypedDataEncoder.hash(domain,types,value)!==digest)throw Error('Typed wallet message does not match the SDK plan.');
  return signer.signTypedData(domain,types,value);
}
export function discoverWallets(win,onUpdate){
  const entries=new Map();
  const announce=event=>{
    const d=event.detail;
    if(!d?.provider?.request||!d.info?.uuid||entries.has(d.info.uuid))return;
    entries.set(d.info.uuid,{id:d.info.uuid,name:String(d.info.name??'Wallet'),rdns:d.info.rdns,provider:d.provider});
    onUpdate([...entries.values()]);
  };
  win.addEventListener('eip6963:announceProvider',announce);
  win.dispatchEvent(new Event('eip6963:requestProvider'));
  if(!entries.size&&win.ethereum?.request){entries.set('injected',{id:'injected',name:win.ethereum.isMetaMask?'MetaMask':'Browser wallet',provider:win.ethereum});onUpdate([...entries.values()]);}
  return ()=>win.removeEventListener('eip6963:announceProvider',announce);
}
