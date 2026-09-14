/** Disposable loopback-only fixture. No fork, implicit installation, unlimited
 * contract sizes, full traces, or persisted Anvil history. All filenames and
 * file contents enter through real Ledger transactions, never through config. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createServer} from 'node:net';

const lab = fileURLToPath(new URL('../',import.meta.url));
const mnemonic = 'test test test test test test test test test test test junk';
const json = value => JSON.stringify(value,(_,v) => typeof v === 'bigint' ? String(v) : v,2);
const delay = ms => new Promise(r => setTimeout(r,ms));
export async function loadEthers() {
  if (!process.env.EFS_ETHERS_PATH) throw new Error('Set EFS_ETHERS_PATH to the existing ethers v6 package directory; no install is automatic.');
  const entry = join(resolve(process.env.EFS_ETHERS_PATH),'lib.esm/index.js');
  const e = await import(pathToFileURL(entry)); assert(e.version.startsWith('6.')); return e;
}
async function freePort() {
  const server = createServer(); await new Promise((ok,no) => {server.once('error',no);server.listen(0,'127.0.0.1',ok);});
  const port = server.address().port; await new Promise(ok => server.close(ok)); return port;
}
export async function createEnvironment({artifactDirectory=process.env.FOUNDRY_OUT ?? join(lab,'out'),useLive=process.env.EFS_LISTING_MODE!=='audit',
  protocol='compact-legacy-v1',deployment='direct',hardfork='cancun'}={}) {
  assert(['compact-legacy-v1','compact-guarded-v2'].includes(protocol),'supported fixture protocol');
  assert(['direct','proxy'].includes(deployment),'supported fixture deployment');
  assert(['cancun','prague'].includes(hardfork),'supported fixture hardfork');
  assert(deployment==='direct'||protocol==='compact-guarded-v2','proxy refuses legacy signed ingress');
  const e = await loadEthers(), dir = await mkdtemp(join(tmpdir(),'efs-compact-demo-'));
  const port = await freePort(), rpcUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.env.ANVIL_BIN ?? 'anvil',[
    '--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork',hardfork,
    '--gas-limit','30000000','--gas-price','2000000000','--prune-history','256',
    '--transaction-block-keeper','512','--cache-path',join(dir,'anvil-cache'),'--quiet',
  ],{stdio:['ignore','ignore','pipe']});
  let nodeError='', closed=false;
  child.stderr.on('data',chunk => {nodeError=(nodeError+chunk).slice(-8000);});
  child.on('error',error => {nodeError=String(error);});
  const close = async () => {
    if (closed) return; closed=true;
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await Promise.race([new Promise(ok=>child.once('exit',ok)),delay(3000)]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
  };
  const metrics = {calls:0,requestBytes:0,responseBytes:0,byMethod:{}};
  let requestId=0;
  const rpc = async (method,params=[]) => {
    const id=++requestId, body=JSON.stringify({jsonrpc:'2.0',id,method,params});
    ++metrics.calls; metrics.requestBytes+=Buffer.byteLength(body); metrics.byMethod[method]=(metrics.byMethod[method]??0)+1;
    const response=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body,signal:AbortSignal.timeout(20_000)});
    const text=await response.text(); metrics.responseBytes+=Buffer.byteLength(text);
    assert(response.ok,`RPC HTTP ${response.status}`); const data=JSON.parse(text);
    if(data.error) throw Object.assign(new Error(`${method}: ${data.error.message}`),{rpcError:data.error});
    assert.equal(data.id,id,'RPC response ID'); return data.result;
  };
  try {
    const until=Date.now()+10_000;
    while(true) {
      try {assert.equal(await rpc('eth_chainId'), '0x7a69');break;}
      catch(error) {if(Date.now()>until || child.exitCode !== null)throw new Error(`Anvil did not start: ${nodeError || error.message}`); await delay(50);}
    }
    const wallets=Object.fromEntries(['deployer','alice','bob'].map((name,index)=>[name,e.HDNodeWallet.fromPhrase(mnemonic,undefined,`m/44'/60'/0'/0/${index}`)]));
    const transactions=[], contracts={}, pending=new Map();
    // Enqueue never waits for success: ordering/type-4 tests must observe actual
    // mined receipts independently, including transactions that revert.
    const enqueue = async (label,tx,who='deployer') => {
      const wallet=wallets[who]; assert(wallet,'known disposable signer');
      const gasLimit=BigInt(tx.gasLimit??15_000_000n);
      assert(gasLimit>0n&&gasLimit<=16_777_216n,'target-compatible transaction gasLimit <= 16777216');
      const nonce=tx.nonce??Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
      const type=tx.type??0;
      const raw=await wallet.signTransaction({to:tx.to??null,data:tx.data??'0x',value:BigInt(tx.value??0),
        nonce,chainId:31337,type,gasLimit,
        ...(type===4?{authorizationList:tx.authorizationList,maxFeePerGas:2_000_000_000n,maxPriorityFeePerGas:1_000_000_000n}
          :{gasPrice:2_000_000_000n})});
      const hash=e.keccak256(raw), observed=await rpc('eth_sendRawTransaction',[raw]); assert.equal(observed,hash);
      pending.set(hash,{label,tx:{...tx,data:tx.data??'0x'},who,raw}); return hash;
    };
    const observe = async hash => {
      const already=transactions.find(row=>row.transactionHash===hash); if(already)return already;
      const {label,tx,who,raw}=pending.get(hash)??{}; assert(tx,'owned enqueued transaction');
      let receipt; const deadline=Date.now()+20_000;
      while(!(receipt=await rpc('eth_getTransactionReceipt',[hash]))) {assert(Date.now()<deadline,'receipt timeout');await delay(20);}
      const [block,chainTx]=await Promise.all([rpc('eth_getBlockByHash',[receipt.blockHash,false]),rpc('eth_getTransactionByHash',[hash])]);
      assert.equal(receipt.transactionHash,hash); assert.equal(chainTx.blockHash,receipt.blockHash);
      assert.equal(block.transactions[Number(BigInt(receipt.transactionIndex))],hash);assert.equal(chainTx.input,tx.data);
      const row={label,signer:who,transactionHash:hash,blockHash:receipt.blockHash,blockNumber:BigInt(receipt.blockNumber).toString(),
        gasUsed:BigInt(receipt.gasUsed).toString(),effectiveGasPriceWei:BigInt(receipt.effectiveGasPrice).toString(),
        calldataBytes:e.getBytes(tx.data).length,type:Number(BigInt(chainTx.type)),gasLimit:BigInt(chainTx.gas).toString(),rawTransaction:raw,
        status:BigInt(receipt.status)===1n?'SUCCESS':'REVERTED',receipt};
      transactions.push(row); await writeFile(join(dir,'transactions.json'),json(transactions));
      assert(BigInt(row.gasUsed)<=BigInt(row.gasLimit)&&BigInt(row.gasLimit)<=16_777_216n,'receipt gas within target transaction cap');
      return row;
    };
    const send = async (label,tx,who='deployer') => {
      const hash=await enqueue(label,tx,who),row=await observe(hash);
      assert.equal(row.status,'SUCCESS',label);return hash;
    };
    const artifact = async (file,name) => JSON.parse(await readFile(join(artifactDirectory,file,`${name}.json`),'utf8'));
    const call = async (name,fn,args=[],block='latest') => {
      const c=contracts[name]; const iface=new e.Interface(c.abi);
      return iface.decodeFunctionResult(fn,await rpc('eth_call',[{to:c.address,data:iface.encodeFunctionData(fn,args)},block]));
    };
    const transact = async (name,fn,args=[],label=`${name}/${fn}`,who='deployer') => {
      const c=contracts[name];return send(label,{to:c.address,data:new e.Interface(c.abi).encodeFunctionData(fn,args)},who);
    };
    const deploy = async (key,file,name,args=[]) => {
      const a=await artifact(file,name), iface=new e.Interface(a.abi), data=a.bytecode.object+iface.encodeDeploy(args).slice(2);
      assert(e.getBytes(data).length<=49152,`${name} initcode size`);
      const hash=await send(`deploy/${key}`,{data});
      const receipt=await rpc('eth_getTransactionReceipt',[hash]), address=receipt.contractAddress;
      const code=await rpc('eth_getCode',[address,{blockHash:receipt.blockHash,requireCanonical:true}]);
      assert(code!=='0x' && e.getBytes(code).length<=24576,`${name} runtime size`);
      const template=e.getBytes(a.deployedBytecode.object),actual=e.getBytes(code), patched=new Set();
      assert.equal(actual.length,template.length);
      for(const refs of Object.values(a.deployedBytecode.immutableReferences??{}))for(const ref of refs)for(let i=0;i<ref.length;i++)patched.add(ref.start+i);
      for(let i=0;i<actual.length;i++)if(!patched.has(i))assert.equal(actual[i],template[i],`${name} runtime byte ${i}`);
      contracts[key]={address,abi:a.abi,codeHash:e.keccak256(code),runtimeBytes:actual.length,initcodeBytes:e.getBytes(data).length,
        constructorArgs:args,transactionHash:hash};
      return address;
    };
    const registry=await deploy('registry','TypeRegistry.sol','TypeRegistry');
    const realm=e.id('compact-browser-local/20260914');
    let ledger;
    if(deployment==='proxy') {
      const v1=await deploy('implementationV1','Ledger.sol','Ledger',[registry,realm]);
      await deploy('implementationV2','Ledger.sol','Ledger',[registry,realm]);
      ledger=await deploy('proxy','UpgradeProxy.sol','UpgradeProxy',[v1]);
      contracts.ledger={...contracts.proxy,abi:contracts.implementationV1.abi};
    } else ledger=await deploy('ledger','Ledger.sol','Ledger',[registry,realm]);
    const rootRule=await deploy('rootRule','FilesJoinedProfile.sol','FilesRootRule');
    const rootShape=e.id('lab/type/files-joined-root/1');
    const root=(await call('registry','typeIdOf',[rootShape,rootRule,[]]))[0];
    await transact('registry','register',[rootShape,rootRule,[]]);
    const childRule=await deploy('childRule','FilesJoinedProfile.sol','FilesChildRule',[root]);
    const childShape=e.id('lab/type/files-joined-child/1');
    const childType=(await call('registry','typeIdOf',[childShape,childRule,[e.ZeroHash]]))[0];
    await transact('registry','register',[childShape,childRule,[e.ZeroHash]]);
    const nameRule=await deploy('nameRule','FilesNamesProfile.sol','FilesNameRule');
    const nameShape=e.id('lab/type/files-name-raw-ascii/1'),name=(await call('registry','typeIdOf',[nameShape,nameRule,[]]))[0];
    await transact('registry','register',[nameShape,nameRule,[]]);
    const ruleHashes={root:contracts.rootRule.codeHash,child:contracts.childRule.codeHash,name:contracts.nameRule.codeHash};
    const index=await deploy('index',useLive?'FilesLiveIndex.sol':'FilesNamesProfile.sol',useLive?'FilesLiveNamesIndex':'FilesNamesIndex',
      [ledger,root,childType,ruleHashes.root,ruleHashes.child,name,ruleHashes.name]);
    await transact('ledger','setIndexModule',[index]);
    const lens=await deploy('lens',useLive?'FilesLiveIndex.sol':'LensReader.sol',useLive?'FilesLiveLens':'LensReader',[ledger,index]);
    const files=await deploy('files','FilesJoinedConsumer.sol','FilesJoinedConsumer',[ledger,lens,index,root,childType,ruleHashes.root,ruleHashes.child]);
    await deploy('names','FilesNamesProfile.sol','FilesNameReader',[ledger,ledger,name,ruleHashes.name]);
    await deploy('application','FilesApplication.sol','FilesApplication',[ledger,files,wallets.alice.address,wallets.alice.address,wallets.alice.address,e.id('approved')]);
    const folder=e.id('compact-demo/root'), archive=e.id('compact-demo/archive');
    const manifest={chainId:'31337',listing:useLive?'live-positive':'audit',folder,folders:[folder,archive],authors:{alice:wallets.alice.address,bob:wallets.bob.address},
      contracts:Object.fromEntries(['ledger','index','lens','registry','files','names'].map(k=>[k,contracts[k]])),
      types:{root,child:childType,name},ruleHashes};
    if(protocol==='compact-guarded-v2') {
      manifest.protocol=protocol;
      manifest.executionFamily={origin:(await call('ledger','realmOrigin'))[0],realmId:realm,
        layoutId:(await call('ledger','layoutId'))[0],domainSeparator:(await call('ledger','domainSeparator'))[0],
        guardedDomainSeparator:(await call('ledger','guardedDomainSeparator'))[0],
        implementations:(deployment==='proxy'?['implementationV1','implementationV2']:['ledger']).map(k=>({address:contracts[k].address,codeHash:contracts[k].codeHash}))};
    }
    await writeFile(join(dir,'manifest.json'),json(manifest));
    const createJournal=async key=>{
      assert(/^[a-z0-9-]+$/.test(key));const base=join(dir,`journal-${key}`);await mkdir(base,{recursive:true});
      const path=id=>{assert(/^0x[0-9a-f]{64}$/i.test(id));return join(base,`${id}.json`);};
      return {async put(entry){const p=path(entry.id);await writeFile(p+'.tmp',json(entry));await rename(p+'.tmp',p);},
        async get(id){try{return JSON.parse(await readFile(path(id),'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}};
    };
    const writeReport=async (name,value)=>{assert(/^[a-z0-9-]+$/.test(name));const path=join(dir,`${name}.json`);
      await writeFile(path,json({...value,sourceArtifacts:resolve(artifactDirectory),contracts,evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF'}));console.log(`Report: ${path}`);return path;};
    return {ethers:e,dir,port,rpcUrl,rpc,metrics,manifest,contracts,wallets,transactions,send,enqueue,observe,call,transact,deploy,close,createJournal,writeReport};
  } catch(error) {await close();throw error;}
}
