/** Local workbench wallet helpers. No key import, mainnet faucet or relayer. */
const local=hostname=>['127.0.0.1','localhost','[::1]'].includes(hostname);
export function journalPrefix(manifest,genesisHash){
  if(!/^0x[0-9a-f]{64}$/i.test(genesisHash??''))throw Error('Cannot qualify journal without a valid genesis hash.');
  return `efs-compact:${manifest.chainId}:${manifest.contracts.ledger.address.toLowerCase()}:${genesisHash.toLowerCase()}:`;
}
/** No keys or production relayer: one bounded zero-value call to this local Ledger. */
export async function sendLocalSponsoredTransaction({development,config,pageUrl,rpc,keccak256,ethers,genesisHash,transaction,beforeSend=()=>{}}){
  if(development!==true||config.localSponsor===false)throw Error('Local sponsor is development-only.');
  assertLocalConfig(config,pageUrl);
  const ledger=config.manifest.contracts.ledger;
  if(transaction.to?.toLowerCase()!==ledger.address.toLowerCase()||BigInt(transaction.value??0)!==0n
    ||!/^0x(?:[0-9a-f]{2}){4,}$/i.test(transaction.data??''))throw Error('Sponsor only pays zero-value Ledger calls.');
  if(transaction.data.slice(0,10).toLowerCase()!==new ethers.Interface(ledger.abi).getFunction('executeGuardedSigned').selector)
    throw Error('Sponsor only submits guarded signed intents, never direct author calls or Ledger administration.');
  const [chain,client,genesis,code,accounts]=await Promise.all([
    rpc('eth_chainId'),rpc('web3_clientVersion'),rpc('eth_getBlockByNumber',['0x0',false]),
    rpc('eth_getCode',[ledger.address,'latest']),rpc('eth_accounts')]);
  if(BigInt(chain)!==BigInt(config.manifest.chainId)||!/anvil/i.test(client)
    ||!genesisHash||genesis?.hash?.toLowerCase()!==genesisHash.toLowerCase()
    ||code==='0x'||keccak256(code).toLowerCase()!==ledger.codeHash.toLowerCase())throw Error('Local sponsor chain or deployment changed.');
  const from=accounts?.[0];if(!/^0x[0-9a-f]{40}$/i.test(from??''))throw Error('Local Anvil has no unlocked payer.');
  const tx={to:transaction.to,data:transaction.data,value:'0x0',from};
  const gas=BigInt(await rpc('eth_estimateGas',[tx])),cap=16777216n;
  if(gas<=0n||gas>cap)throw Error('Local sponsor gas cap exceeded.');
  const padded=(gas*120n+99n)/100n;
  await beforeSend(); // Route/wallet changes still abort before the one broadcast.
  return rpc('eth_sendTransaction',[{...tx,gas:'0x'+(padded>cap?cap:padded).toString(16)}]);
}
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
  const balance=BigInt(await rpc('eth_getBalance',[address,'latest'])),target=10n**18n;
  if(balance>=target)return balance;
  await rpc('anvil_setBalance',[address,'0x'+target.toString(16)]);
  // Setting Anvil state alone does not advance the head. MetaMask can keep
  // displaying its old balance until its block tracker observes a new block.
  await rpc('evm_mine');
  const funded=BigInt(await rpc('eth_getBalance',[address,'latest']));
  if(funded<target)throw Error('Local test balance was not funded. Reconnect to try again.');
  return funded;
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
