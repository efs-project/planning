// Small profile-specific client. RPC observations are not cryptographic state proofs.
import {graphIdentity,qualifyGraph,sourceProfile} from './qualification.mjs';
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
export function createClient(E, config, {onAction = () => {}, initialActions = []} = {}) {
  validateConfig(config);
  const graphId=graphIdentity(E,config);
  const canonical=sourceProfile(config.dependencyProfile).canonical;
  const observedBases=new Set();
  const abi = E.AbiCoder.defaultAbiCoder(), iface = new E.Interface(config.abi);
  const metrics = {httpRequests:0, logicalRpcCalls:0, responseBytes:0};
  let requestId = 0;
  const unresolvedStatus=s=>['SUBMITTING','SUBMISSION_UNKNOWN','VERIFICATION_UNKNOWN'].includes(s);
  const statuses=['SUBMITTING','SUBMISSION_UNKNOWN','VERIFICATION_UNKNOWN','MINED_UNVERIFIED','REVERTED','COMMITTED'];
  if(!Array.isArray(initialActions))throw Error('Malformed saved journal');
  const seen=new Set();
  for(const a of initialActions){
    if(!a||!statuses.includes(a.status)||!E.isHexString(a.hash,32)||seen.has(a.hash)||!E.isHexString(a.calldata)||E.keccak256(a.calldata)!==a.calldataHash||typeof a.verifyEffect!=='boolean'||(a.gasUsed!==null&&!/^\d+$/.test(a.gasUsed))||(a.receipt!==null&&a.receipt?.transactionHash!==a.hash))throw Error('Malformed saved journal; unresolved safety state cannot be discarded');
    seen.add(a.hash);
  }
  const pending=initialActions.filter(a=>unresolvedStatus(a.status));
  let submitting=false;
  for(const a of pending){validateId(a.hash);if(a.status==='SUBMITTING')a.status='SUBMISSION_UNKNOWN';}
  const unresolved=()=>pending.slice();
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
    const graph=await qualifyGraph(E,config,rpc,block.number);
    if(graph.graphId!==graphId)throw Error('Observation graph identity mismatch');
    const closing=await rpc('eth_getBlockByNumber',[block.number,false]);
    if(closing?.hash!==block.hash)throw Error('Stale observation block hash');
    observedBases.add(block.number+':'+block.hash);
    return {chainId:String(BigInt(chain)),genesisHash:genesis.hash,kernel:config.kernel,codeHash,deploymentBlockHash:config.deploymentBlockHash,blockNumber:block.number,blockHash:block.hash,...graph,qualification:'Source-pinned dependency graph RPC-observed; not a state proof'};
  }
  async function checkBasis(basis) {
    if (!basis || basis.chainId !== String(config.chainId) || basis.genesisHash !== config.genesisHash || basis.kernel !== config.kernel || basis.codeHash !== config.codeHash || basis.deploymentBlockHash !== config.deploymentBlockHash) throw Error('Observation identity mismatch');
    if(basis.graphId!==graphId||graphIdentity(E,config)!==graphId||basis.profileId!==config.profileId||basis.dependencyProfile!==config.dependencyProfile)throw Error('Observation graph identity mismatch');
    if(!observedBases.has(basis.blockNumber+':'+basis.blockHash)){
      const actual=await observe(basis.blockNumber);
      if(actual.blockHash!==basis.blockHash)throw Error('Stale observation block hash');
    }
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
    if(canonical){const payload=E.getBytes(bytes);if(payload.length>4094)throw Error('Payload exceeds 4094-byte canonical profile');return E.hexlify(E.concat([E.toBeHex(payload.length,2),payload]));}
    if (E.getBytes(bytes).length > 4032) throw Error('Payload exceeds 4032-byte inline profile');
    return abi.encode(['bytes'],[bytes]);
  };
  // Exact Types choose representation; unknown Types retain record() byte access only.
  const representation = typeId => {
    validateId(typeId);
    if(typeId.toLowerCase()===config.bytesType?.toLowerCase())return canonical?'canonical-u16-bytes':'canonical';
    if(canonical)return null;
    if(typeId.toLowerCase()===config.rawType?.toLowerCase())return 'raw';
    return null;
  };
  const payloadLimit = typeId => {
    const kind=representation(typeId);
    if(!kind)throw Error('Unknown Type payload codec; exact record bytes only');
    return kind==='canonical-u16-bytes'?4094:kind==='raw'?4096:4032;
  };
  const encodePayload = (typeId,bytes) => {
    const limit=payloadLimit(typeId);
    if(E.getBytes(bytes).length>limit)throw Error(`Payload exceeds ${limit}-byte inline profile`);
    return representation(typeId)==='raw'?E.hexlify(bytes):body(bytes);
  };
  const decodePayload = (typeId,exact) => {
    const kind=representation(typeId);
    if(!kind)throw Error('Unknown Type payload codec; exact record bytes only');
    if(E.getBytes(exact).length>4096)throw Error('Body exceeds 4096-byte inline profile');
    if(kind==='raw')return E.getBytes(exact);
    if(kind==='canonical-u16-bytes'){
      const b=E.getBytes(exact),length=b.length>=2?b[0]*256+b[1]:-1;
      if(length<0||length>4094||length!==b.length-2)throw Error('Invalid canonical u16 bytes body');
      return b.slice(2);
    }
    try{
      const payload=abi.decode(['bytes'],exact)[0];
      if(body(payload)!==E.hexlify(exact))throw Error('noncanonical framing');
      return E.getBytes(payload);
    }catch{throw Error('Invalid canonical ABI bytes body');}
  };
  const recordId = (typeId, exactBody) => canonical
    ? E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),validateId(typeId),E.keccak256(exactBody)]))
    : E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),validateId(typeId),exactBody]));
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
  async function sendData(label,data,to,phase='action',verifyEffect=false) {
    if(submitting||pending.length)throw Error('Reconcile the unresolved action before submitting another write');
    submitting=true;let action;
    try{
    await observe();
    // Never accept user keys. This public, disposable key comes from our fresh-world config.
    if (config.devPrivateKey !== E.toBeHex(0xef521,32)) throw Error('Only the fixed public disposable development signer is allowed');
    const wallet = new E.Wallet(config.devPrivateKey);
    const nonce = Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
    const raw = await wallet.signTransaction({chainId:31337,nonce,gasLimit:GAS_LIMIT,gasPrice:2000000000n,data,...(to?{to}:{})});
    const hash=E.keccak256(raw);
    action={label,phase,hash,to,calldata:data,verifyEffect,gasUsed:null,calldataBytes:(data.length-2)/2,calldataHash:E.keccak256(data),receipt:null,status:'SUBMITTING'};
    pending.push(action);onAction(action);
    const returnedHash=await rpc('eth_sendRawTransaction',[raw]);
    if(returnedHash!==hash)throw Error('Submission hash mismatch');
    let receipt;
    for (let i=0;i<200;i++) { receipt = await rpc('eth_getTransactionReceipt',[hash]); if (receipt) break; await new Promise(r=>setTimeout(r,50)); }
    if(!receipt)throw Error('Receipt unavailable');
    await settle(action,receipt);
    if(action.status==='REVERTED')throw Object.assign(Error('Transaction reverted; gas retained in journal'),{action});
    return action;
    }catch(error){
      if(action&&pending.includes(action))throw markUnknown(action,error);
      throw error;
    }finally{submitting=false;}
  }
  function markUnknown(action,error){
    action.status=action.receipt?'VERIFICATION_UNKNOWN':'SUBMISSION_UNKNOWN';
    action.error=error.message;onAction(action);
    return Object.assign(Error(`${action.status}: ${action.hash}. Reconcile read-only before any new write. ${error.message}`),{hash:action.hash,status:action.status,action});
  }
  async function settle(action,receipt){
    if(receipt.transactionHash!==action.hash)throw Error('Receipt hash mismatch');
    action.receipt=receipt;action.gasUsed=BigInt(receipt.gasUsed).toString();
    action.status=receipt.status==='0x1'?'MINED_UNVERIFIED':'REVERTED';
    if(receipt.status==='0x1'&&action.verifyEffect){
      if(action.to!==config.kernel||E.keccak256(action.calldata)!==action.calldataHash)throw Error('Saved action identity mismatch');
      const decoded=iface.parseTransaction({data:action.calldata});
      await verifyWrite(action,decoded.name,decoded.args);
    }
    pending.splice(pending.indexOf(action),1);delete action.error;onAction(action);return action;
  }
  async function reconcile(){
    if(submitting)throw Error('Wait for the current submission attempt');
    const action=pending[0];if(!action)return {status:'NO_UNRESOLVED_ACTION'};
    try{
      await observe();
      const receipt=await rpc('eth_getTransactionReceipt',[action.hash]);
      if(!receipt){action.status='SUBMISSION_UNKNOWN';onAction(action);return action;}
      return await settle(action,receipt);
    }catch(error){throw markUnknown(action,error);}
  }
  async function write(method,args,label=method) {
    return sendData(label,iface.encodeFunctionData(method,args),config.kernel,'action',true);
  }
  async function verifyWrite(action,method,args) {
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
  return {rpc,observe,checkBasis,call,list,record,recordId,body,representation,payloadLimit,encodePayload,decodePayload,write,sendData,reconcile,unresolved,metrics,iface,config};
}
