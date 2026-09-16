/** Disposable loopback-only fixture. No fork, implicit installation, unlimited
 * contract sizes, full traces, or persisted Anvil history. All filenames and
 * file contents enter through real Ledger transactions, never through config. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,appendFile,rename,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {createReadTransport} from './compact-read-transport.mjs';
export {createReadTransport} from './compact-read-transport.mjs';

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
  protocol='compact-legacy-v1',deployment='direct',hardfork='cancun',filesProfile,contentProfile,indexFields=false,evidenceMode='snapshot',benchmarkHistory=false,chainId=31337,transportOptions={}}={}) {
  assert([31337,31338].includes(chainId),'owned fixture chainId is 31337 or 31338');
  assert(['snapshot','append'].includes(evidenceMode),'supported evidence mode');
  assert(!benchmarkHistory||evidenceMode==='append','short history is explicit benchmark-only');
  const historyPolicy=benchmarkHistory?{states:16,transactionBlocks:32}:{states:256,transactionBlocks:512};
  assert(!contentProfile||(contentProfile==='raw-sha256-aesgcm-v2'&&filesProfile==='typed-directory-v1'),'supported content profile');
  assert(!indexFields||contentProfile==='raw-sha256-aesgcm-v2','field index requires exact carrier profile');
  assert(filesProfile===undefined||filesProfile==='typed-directory-v1','supported Files profile');
  assert(!filesProfile||(protocol==='compact-guarded-v2'&&useLive),'typed directories require guarded live profile');
  assert(['compact-legacy-v1','compact-guarded-v2'].includes(protocol),'supported fixture protocol');
  assert(['direct','proxy'].includes(deployment),'supported fixture deployment');
  assert(['cancun','prague'].includes(hardfork),'supported fixture hardfork');
  assert(deployment==='direct'||protocol==='compact-guarded-v2','proxy refuses legacy signed ingress');
  const e = await loadEthers(), dir = await mkdtemp(join(tmpdir(),'efs-compact-demo-'));
  const port = await freePort(), rpcUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.env.ANVIL_BIN ?? 'anvil',[
    '--host','127.0.0.1','--port',String(port),'--chain-id',String(chainId),'--hardfork',hardfork,
    '--gas-limit','30000000','--gas-price','2000000000','--prune-history',String(historyPolicy.states),
    '--transaction-block-keeper',String(historyPolicy.transactionBlocks),'--cache-path',join(dir,'anvil-cache'),'--quiet',
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
  const rpc=createReadTransport({url:rpcUrl,...transportOptions}),metrics=rpc.metrics;
  try {
    const until=Date.now()+10_000;
    while(true) {
      try {assert.equal(await rpc('eth_chainId'), e.toQuantity(chainId));break;}
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
        nonce,chainId,type,gasLimit,
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
      pending.delete(hash);
      if(evidenceMode==='append'){
        await appendFile(join(dir,'transactions.jsonl'),JSON.stringify(row)+'\n');
        delete row.rawTransaction; // exact input/receipt evidence stays on disk
        transactions.push(row);
      }else{transactions.push(row);await writeFile(join(dir,'transactions.json'),json(transactions));}
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
    let directoryType;
    if(filesProfile){
      const rule=await deploy('directoryRule','FilesDirectoryProfile.sol','FilesDirectoryRule');
      const shape=e.id('lab/type/files-directory/1');directoryType=(await call('registry','typeIdOf',[shape,rule,[]]))[0];
      await transact('registry','register',[shape,rule,[]]);ruleHashes.directory=contracts.directoryRule.codeHash;
    }
    const contentTypes={};
    if(contentProfile){
      const specs=[['bytes','bytes','FilesBytesRule',[],[]],['content','content','FilesContentRule',()=>[contentTypes.bytes],()=>[contentTypes.bytes]],
        ['carrierRoot','carrier-root','FilesCarrierRootRule',[],()=>[contentTypes.content]],
        ['carrierChild','carrier-child','FilesCarrierChildRule',()=>[root,childType,contentTypes.carrierRoot],()=>[e.ZeroHash,contentTypes.content]],
        ['concept','concept','FilesConceptRule',[],[]]];
      for(const [key,slug,contract,constructor,ref] of specs){
        const rule=await deploy(key+'Rule','FilesCarrierProfile.sol',contract,typeof constructor==='function'?constructor():constructor);
        const shape=e.id(`lab/type/files-${slug}/1`),refs=typeof ref==='function'?ref():ref;
        contentTypes[key]=(await call('registry','typeIdOf',[shape,rule,refs]))[0];await transact('registry','register',[shape,rule,refs]);ruleHashes[key]=contracts[key+'Rule'].codeHash;
      }
    }
    const legacyIndexArgs=[root,childType,ruleHashes.root,ruleHashes.child,name,ruleHashes.name,...(filesProfile?[directoryType,ruleHashes.directory]:[])];
    const index=await deploy('index',indexFields?'ProfiledFilesIndex.sol':contentProfile?'FilesCarrierProfile.sol':filesProfile?'FilesDirectoryProfile.sol':useLive?'FilesLiveIndex.sol':'FilesNamesProfile.sol',
      indexFields?'ProfiledFilesIndex':contentProfile?'FilesCarrierIndex':filesProfile?'FilesDirectoryIndex':useLive?'FilesLiveNamesIndex':'FilesNamesIndex',
      contentProfile?[ledger,legacyIndexArgs,Object.values(contentTypes),Object.keys(contentTypes).map(k=>ruleHashes[k])]:[ledger,...legacyIndexArgs]);
    await transact('ledger','setIndexModule',[index]);
    const lens=await deploy('lens',useLive?'FilesLiveIndex.sol':'LensReader.sol',useLive?'FilesLiveLens':'LensReader',[ledger,index]);
    const files=await deploy('files','FilesJoinedConsumer.sol','FilesJoinedConsumer',[ledger,lens,index,root,childType,ruleHashes.root,ruleHashes.child]);
    await deploy('names','FilesNamesProfile.sol','FilesNameReader',[ledger,ledger,name,ruleHashes.name]);
    if(contentProfile)await deploy('joined','FilesPageReader.sol','FilesPageReader',[ledger,lens,index]);
    await deploy('application','FilesApplication.sol','FilesApplication',[ledger,files,wallets.alice.address,wallets.alice.address,wallets.alice.address,e.id('approved')]);
    let folder=e.id('compact-demo/root'), archive=e.id('compact-demo/archive');
    if(filesProfile){
      assert.equal((await call('ledger','counts'))[0],0n,'attach required directory index before first admission');
      const salt=e.id('compact-directory/root'),principal=(await call('ledger','principalOf',[wallets.deployer.address]))[0];
      const hash=(types,values)=>e.keccak256(e.AbiCoder.defaultAbiCoder().encode(types,values));
      const seed=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
      const body=e.AbiCoder.defaultAbiCoder().encode(['bytes32'],[seed]);
      const base={kind:0,typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash};
      await transact('ledger','execute',[[{...base,kind:5,salt},{...base,kind:1,typeId:directoryType,bodyHashOrRecordId:e.keccak256(body)}],['0x',body],0],'directory/root-bootstrap');
      folder=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),directoryType,e.keccak256(body)]);
    }
    const manifest={chainId:String(chainId),listing:useLive?'live-positive':'audit',folder,folders:[folder,archive],authors:{alice:wallets.alice.address,bob:wallets.bob.address},
      contracts:Object.fromEntries(['ledger','index','lens','registry','files','names',...(contentProfile?['joined']:[])].map(k=>[k,contracts[k]])),
      types:{root,child:childType,name},ruleHashes};
    if(filesProfile){manifest.filesProfile=filesProfile;manifest.types.directory=directoryType;manifest.folders=[folder];}
    if(contentProfile){manifest.contentProfile=contentProfile;Object.assign(manifest.types,contentTypes);}
    if(protocol==='compact-guarded-v2') {
      manifest.protocol=protocol;
      manifest.executionFamily={origin:(await call('ledger','realmOrigin'))[0],realmId:realm,
        layoutId:(await call('ledger','layoutId'))[0],domainSeparator:(await call('ledger','domainSeparator'))[0],
        guardedDomainSeparator:(await call('ledger','guardedDomainSeparator'))[0],
        implementations:(deployment==='proxy'?['implementationV1','implementationV2']:['ledger']).map(k=>({address:contracts[k].address,codeHash:contracts[k].codeHash}))};
      // Exact artifact ABI selects the adapter. A failing declared new getter
      // is never retried as legacy, including on historical-artifact controls.
      for(const [i,key] of (deployment==='proxy'?['implementationV1','implementationV2']:['ledger']).entries()){
        const implementation=manifest.executionFamily.implementations[i];
        if(new e.Interface(contracts[key].abi).getFunction('readSetStorageProfile')){
          const [profile,namespace]=await call(key,'readSetStorageProfile');
          const [address,codeHash]=await call(key,'publicationSupportIdentity');
          assert.equal(e.keccak256(await rpc('eth_getCode',[address,'latest'])),codeHash,'fixed support code');
          implementation.readSetStorage={profile,namespace};implementation.publicationSupport={address,codeHash};
        }else implementation.readSetStorage={profile:e.id('efs.lab.read-set-storage/1:root15-bytes'),namespace:e.ZeroHash};
      }
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
    return {ethers:e,dir,port,anvilPid:child.pid,evidenceMode,historyPolicy,rpcUrl,rpc,metrics,manifest,contracts,wallets,transactions,send,enqueue,observe,call,transact,deploy,close,createJournal,writeReport};
  } catch(error) {await close();throw error;}
}
