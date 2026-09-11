// Small profile-specific client. RPC observations are not cryptographic state proofs.
export const ZERO = '0x' + '0'.repeat(64);
export const START = [ZERO, 0, 0];
export const GAS_LIMIT = 16777216n;
export function validateId(id) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(id)) throw Error('Malformed bytes32 ID');
  return id;
}
export function validateName(name) {
  if (typeof name !== 'string' || !/^[\x20-\x7e]{1,64}$/.test(name) || name.includes('/') || name === '.' || name === '..') throw Error('Names require 1–64 printable ASCII bytes, no slash, . or ..');
  return name;
}
export function validateConfig(config) {
  const url = new URL(config.rpc);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Only a managed loopback RPC is allowed');
  if (String(config.chainId) !== '31337') throw Error('Disposable chain 31337 required');
  validateId(config.genesisHash); validateId(config.codeHash);
  validateId(config.deploymentBlockHash);
  if (!/^0x[0-9a-fA-F]{40}$/.test(config.kernel)) throw Error('Malformed kernel');
}
export function createClient(E, config, {onAction = () => {}} = {}) {
  validateConfig(config);
  const abi = E.AbiCoder.defaultAbiCoder(), iface = new E.Interface(config.abi);
  const metrics = {httpRequests:0, logicalRpcCalls:0, responseBytes:0};
  let requestId = 0;
  async function rpc(method, params = []) {
    metrics.httpRequests++; metrics.logicalRpcCalls++;
    const res = await fetch(config.rpc, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:++requestId,method,params}), signal:AbortSignal.timeout(10000)});
    if (!res.ok) throw Error(`RPC HTTP ${res.status}`);
    const body = await res.text(); metrics.responseBytes += new TextEncoder().encode(body).length;
    if (body.length > 1048576) throw Error('RPC response exceeds profile bound');
    const value = JSON.parse(body);
    if (value.error) throw Object.assign(Error(value.error.message), {data:value.error.data});
    return value.result;
  }
  async function observe(blockTag = 'latest') {
    const [chain,genesis,block] = await Promise.all([rpc('eth_chainId'),rpc('eth_getBlockByNumber',['0x0',false]),rpc('eth_getBlockByNumber',[blockTag,false])]);
    if (!block || String(BigInt(chain)) !== String(config.chainId) || genesis?.hash !== config.genesisHash) throw Error('Chain/genesis identity mismatch');
    const deployment = await rpc('eth_getBlockByNumber',[config.deploymentBlockNumber,false]);
    if (deployment?.hash !== config.deploymentBlockHash) throw Error('Deployment block identity mismatch');
    const codeHash = E.keccak256(await rpc('eth_getCode',[config.kernel,block.number]));
    if (codeHash !== config.codeHash) throw Error('Kernel code identity mismatch');
    return {chainId:String(BigInt(chain)),genesisHash:genesis.hash,kernel:config.kernel,codeHash,deploymentBlockHash:config.deploymentBlockHash,blockNumber:block.number,blockHash:block.hash,qualification:'RPC-observed; not a state proof'};
  }
  async function checkBasis(basis) {
    if (!basis || basis.chainId !== String(config.chainId) || basis.genesisHash !== config.genesisHash || basis.kernel !== config.kernel || basis.codeHash !== config.codeHash || basis.deploymentBlockHash !== config.deploymentBlockHash) throw Error('Observation identity mismatch');
    const block = await rpc('eth_getBlockByNumber',[basis.blockNumber,false]);
    if (block?.hash !== basis.blockHash) throw Error('Stale observation block hash');
  }
  async function call(method,args = [], basis, target = config.kernel, targetAbi = iface) {
    basis ??= await observe(); await checkBasis(basis);
    const data = targetAbi.encodeFunctionData(method,args);
    const raw = await rpc('eth_call',[{to:target,data},basis.blockNumber]);
    await checkBasis(basis);
    const decoded = targetAbi.decodeFunctionResult(method,raw);
    return {status:'OBSERVED', value:decoded.length === 1 ? decoded[0] : decoded, basis, returnBytes:(raw.length-2)/2};
  }
  const body = bytes => {
    if (E.getBytes(bytes).length > 4032) throw Error('Payload exceeds 4032-byte inline profile');
    return abi.encode(['bytes'],[bytes]);
  };
  const recordId = (typeId, exactBody) => E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),validateId(typeId),exactBody]));
  async function record(id,basis) {
    validateId(id); const result = await call('readRecord',[id],basis);
    if (recordId(result.value.typeId,result.value.body) !== id) throw Error('Record identity verification failed');
    return {...result,status:'VERIFIED_RECORD',value:{typeId:result.value.typeId,body:result.value.body}};
  }
  async function list(namespace,parent,{cursor=START,limit=32,basis}={}) {
    validateId(parent); const result = await call('listDirectory',[namespace,parent,cursor,limit],basis);
    const p = result.value;
    return {...result,value:{entries:p[0].map(e=>({id:e.id,owner:e.file.owner,directory:e.file.directory,live:e.file.live,revision:e.file.revision,recordId:e.file.recordId,name:E.toUtf8String(e.name)})),next:[p.next.scope,p.next.revision,p.next.offset],complete:p.complete,generation:p.next.revision.toString()}};
  }
  async function sendData(label,data,to,phase='action') {
    await observe();
    // Never accept user keys. This public, disposable key comes from our fresh-world config.
    if (config.devPrivateKey !== E.toBeHex(0xef521,32)) throw Error('Only the fixed public disposable development signer is allowed');
    const wallet = new E.Wallet(config.devPrivateKey);
    const nonce = Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
    const raw = await wallet.signTransaction({chainId:31337,nonce,gasLimit:GAS_LIMIT,gasPrice:2000000000n,data,...(to?{to}:{})});
    const hash = await rpc('eth_sendRawTransaction',[raw]);
    let receipt;
    for (let i=0;i<200;i++) { receipt = await rpc('eth_getTransactionReceipt',[hash]); if (receipt) break; await new Promise(r=>setTimeout(r,50)); }
    if (!receipt) throw Object.assign(Error('Submission unknown: receipt unavailable; reconcile hash before retry'), {hash,status:'SUBMISSION_UNKNOWN'});
    const action = {label,phase,hash,gasUsed:BigInt(receipt.gasUsed).toString(),calldataBytes:(data.length-2)/2,calldataHash:E.keccak256(data),receipt,status:receipt.status==='0x1'?'MINED_UNVERIFIED':'REVERTED'};
    onAction(action);
    if (receipt.status !== '0x1') throw Object.assign(Error('Transaction reverted; gas retained in journal'), {action});
    return action;
  }
  async function write(method,args,label=method) {
    const action=await sendData(label,iface.encodeFunctionData(method,args),config.kernel);
    if(method==='createFile'||method==='editFile')action.content={typeId:args[2],recordId:recordId(args[2],args[3]),encodedBodyBytes:E.getBytes(args[3]).length,bodyHash:E.keccak256(args[3])};
    const basis=await observe(action.receipt.blockNumber);
    if(basis.blockHash!==action.receipt.blockHash)throw Error('Receipt block changed; effect unknown');
    const requireEffect=(condition)=>{if(!condition)throw Error('Canonical effect verification failed; do not retry blindly');};
    if(method==='createFile'||method==='createDirectory'){
      const id=(await call('lookup',[config.namespace,args[0],args[1]],basis)).value;
      requireEffect(id!==ZERO);const info=(await call('fileInfo',[id],basis)).value;
      requireEffect(info.live&&info.revision===1n&&info.directory===(method==='createDirectory'));
      if(method==='createFile'){requireEffect(info.recordId===recordId(args[2],args[3]));await record(info.recordId,basis);}
      action.fileId=id;
    }else if(method==='editFile'||method==='moveFile'||method==='unlink'){
      const info=(await call('fileInfo',[args[0]],basis)).value;
      requireEffect(info.revision===BigInt(args[1])+1n&&info.live===(method!=='unlink'));
      if(method==='editFile'){requireEffect(info.recordId===recordId(args[2],args[3]));await record(info.recordId,basis);}
      if(method==='moveFile')requireEffect((await call('lookup',[config.namespace,args[2],args[3]],basis)).value===args[0]);
      action.fileId=args[0];
    }else if(method==='ensureRoot'){
      const id=(await call('rootId',[config.namespace],basis)).value;const info=(await call('fileInfo',[id],basis)).value;requireEffect(info.live&&info.directory);action.fileId=id;
    }else return action;
    action.status='COMMITTED';action.basis=basis;return action;
  }
  return {rpc,observe,checkBasis,call,list,record,recordId,body,write,sendData,metrics,iface,config};
}
