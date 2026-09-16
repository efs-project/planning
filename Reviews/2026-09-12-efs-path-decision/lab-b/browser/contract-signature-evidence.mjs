/** Standalone ERC1271 companion. Existing served SDK modules do not import this.
 * No ECDSA recovery, destination authority, current-wallet historical query or
 * authenticated foreign-chain profile. A local acceptance anchor is explicit
 * external trust in an independently selected archive receipt, not packet data. */
import {ACTION,INTENT,READ_SET,EXECUTION,archiveProfile} from './guarded-archive.mjs';
export const CONTEXT=`tuple(uint256 chainId,address ledger,uint64 publication,uint64 firstAdmission,uint64 basis,${INTENT} intent,${EXECUTION} execution,address store,bytes32 walletCodehash,bytes32 evidenceHash)`;
export const BUNDLE=`tuple(${CONTEXT} context,bytes actions,bytes reads,bytes signature)`;
export const STORE_ABI=['function evidence(address,uint64) view returns(tuple(bytes32 digest,bytes32 walletCodehash,bytes32 profile,bytes32 evidenceHash,address carrier,bytes signature))'];
export const ARCHIVE_ABI=[`function retain(${BUNDLE},bool) returns(bytes32)`,`function bundle(bytes32) view returns(${BUNDLE})`,
  'function receipts(bytes32) view returns(uint8 grade,address importer,uint64 retainedAt,address envelope,address reads,address signature)',
  'function source() view returns(address)','function sourceCodehash() view returns(bytes32)','function implementation() view returns(address)',
  'function implementationCodehash() view returns(bytes32)','function execution() view returns(bytes32)'];
const need=(ok,code)=>{if(!ok)throw Error(`ERC1271_${code}`);};
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const raw=x=>typeof x==='string'&&/^0x(?:[0-9a-f]{2})*$/i.test(x);
export const signatureProfile=e=>e.id('efs.lab.erc1271/1:ordinary-deployed:4096:300000:static:exact32:pre-publication');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
function named(e,type,value){
  const p=typeof type==='string'?e.ParamType.from(type):type;
  if(p.baseType==='tuple')return Object.fromEntries(p.components.map((c,i)=>[c.name,named(e,c,value[i])]));
  if(p.baseType==='array')return Array.from(value,x=>named(e,p.arrayChildren,x));
  return typeof value==='bigint'?String(value):value;
}
export function verifyContractSignatureBundle(e,b,{acceptanceAnchor}={}){
  need(b&&b.context,'BUNDLE');const c=b.context,coder=e.AbiCoder.defaultAbiCoder(),p=archiveProfile(e);
  const hash=(t,v)=>e.keccak256(coder.encode(t,v));
  for(const [value,min,max] of [[b.actions,352,18496],[b.reads,224,10592],[b.signature,0,4096]])
    need(raw(value)&&(value.length-2)/2>=min&&(value.length-2)/2<=max,'BOUNDS');
  const actions=coder.decode([ACTION+'[]'],b.actions)[0],rs=coder.decode([READ_SET],b.reads)[0];
  need(actions.length>0&&actions.length<=64&&eq(coder.encode([ACTION+'[]'],[actions]),b.actions),'ACTIONS');
  const n=rs.principalIds.length,m=rs.positions.length;
  need(n<=64&&m<=4&&(n===0)===(m===0)&&rs.expectedHeads.length===n*m&&eq(coder.encode([READ_SET],[rs]),b.reads),'READS');
  for(const items of [rs.principalIds,rs.positions])need(items.every(x=>!eq(x,e.ZeroHash))&&new Set(items.map(x=>x.toLowerCase())).size===items.length,'READS');
  need(BigInt(c.chainId)>0n&&BigInt(c.publication)>0n&&BigInt(c.firstAdmission)>0n&&!eq(c.ledger,e.ZeroAddress)
    &&!eq(c.intent.author,e.ZeroAddress)&&!eq(c.store,e.ZeroAddress)&&!eq(c.walletCodehash,e.ZeroHash),'CONTEXT');
  need(eq(hash(['bytes32','uint256','address'],[e.id('efs.lab.realm-origin/2'),c.chainId,c.ledger]),c.intent.realmOrigin),'ORIGIN');
  need(eq(hash(['bytes32',READ_SET],[e.id('efs.lab.read-set/2:ordered-first-binding'),rs]),c.intent.readSetHash),'READ_HASH');
  need(eq(c.execution.origin,c.intent.realmOrigin)&&eq(hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],
    [e.id('efs.lab.execution-set/2'),p.layoutId,p.legacyDomain,p.guardedDomain,c.execution]),c.intent.executionSet),'EXECUTION');
  const actionsHash=e.keccak256(b.actions),digest=e.keccak256(e.concat(['0x1901',p.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[
    e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)'),c.intent,actionsHash])]));
  need(eq(hash(['bytes32','address','address','uint64','bytes32','bytes32','bytes32','bytes32'],[
    e.id('efs.lab.contract-signature-evidence/1'),c.store,c.ledger,c.publication,digest,signatureProfile(e),c.walletCodehash,e.keccak256(b.signature)]),c.evidenceHash),'EVIDENCE_JOIN');
  const principalId=hash(['bytes32','uint256','bytes32','address'],[e.id('efs2/principal/1'),2,c.intent.realmOrigin,c.intent.author]);
  const packetHash=hash([BUNDLE],[b]);let grade='RETAINED_UNVERIFIED_SOURCE';
  if(acceptanceAnchor){
    // The anchor must be supplied out of band. A grade or receipt embedded in b
    // is deliberately ignored; a copied packet cannot authenticate itself.
    const a=acceptanceAnchor;
    need(a.profile==='efs.lab.local-1271-acceptance/1'&&eq(a.packetHash,packetHash)&&eq(a.ledger,c.ledger)
      &&String(a.chainId)===String(c.chainId)&&eq(a.executionSet,c.intent.executionSet)
      &&eq(a.implementation,c.execution.implementation)&&eq(a.implementationCodeHash,c.execution.implementationCodeHash)
      &&eq(a.store,c.store)&&raw(a.storeCodeHash)&&e.getBytes(a.storeCodeHash).length===32
      &&!eq(a.storeCodeHash,e.ZeroHash)&&e.isAddress(a.archive)&&!eq(a.archive,e.ZeroAddress)
      &&raw(a.archiveCodeHash)&&e.getBytes(a.archiveCodeHash).length===32&&!eq(a.archiveCodeHash,e.ZeroHash),'ACCEPTANCE_ANCHOR');
    grade='PINNED_LOCAL_LEDGER_ACCEPTED';
  }
  return {packetHash,digest,principalId,actionsHash,signatureBytes:e.getBytes(b.signature).length,grade,authority:'NONE',
    historicalMeaning:grade==='PINNED_LOCAL_LEDGER_ACCEPTED'?'SELECTED_LOCAL_SOURCE_ACCEPTED_AT_PUBLICATION':'SOURCE_ACCEPTANCE_NOT_AUTHENTICATED',
    currentWalletValidity:'NOT_CHECKED',foreignConsensus:'NOT_PROVEN',walletDependencyHistory:'NOT_PROVEN',bodyCoverage:'NOT_INCLUDED'};
}
export function encodeContractSignaturePublication(e,{intent,actions,bodies,reads,signature}){
  need(raw(signature)&&e.getBytes(signature).length<=4096,'SIGNATURE_BOUND');
  return new e.Interface([`function executeGuarded1271(${INTENT},${ACTION}[],bytes[],${READ_SET},bytes)`])
    .encodeFunctionData('executeGuarded1271',[intent,actions,bodies,reads,signature]);
}
export function encodeContractSignatureRetention(e,b,local=false){
  verifyContractSignatureBundle(e,b);
  return new e.Interface(ARCHIVE_ABI).encodeFunctionData('retain',[b,local]);
}

/** Explicit profile pins are independently selected configuration, never taken
 * from the evidence being verified. No global account support or wallet journal. */
export function createContractSignatureCompanion({ethers:e,rpc,ledger,ledgerAbi,profile}){
  const li=new e.Interface(ledgerAbi),si=new e.Interface(STORE_ABI),ai=new e.Interface(ARCHIVE_ABI);
  const coder=e.AbiCoder.defaultAbiCoder();
  const pin=async()=>{const b=await rpc('eth_getBlockByNumber',['latest',false]);need(b?.hash,'BASIS');return {blockHash:b.hash,tag:{blockHash:b.hash,requireCanonical:true}};};
  const call=async(address,api,fn,args,basis)=>api.decodeFunctionResult(fn,await rpc('eth_call',[{to:address,data:api.encodeFunctionData(fn,args)},basis.tag]));
  const lc=(fn,args,basis)=>call(ledger,li,fn,args,basis);
  async function checkProfile(context,basis){
    need(profile&&eq(profile.ledger,ledger)&&eq(context.ledger,ledger)&&String(profile.chainId)===String(context.chainId),'SOURCE_PIN');
    need(String(BigInt(await rpc('eth_chainId',[])))===String(profile.chainId),'CHAIN_PIN');
    need(eq(e.keccak256(await rpc('eth_getCode',[ledger,basis.tag])),profile.ledgerCodeHash),'SOURCE_CODE');
    const current=(await lc('implementationSelf',[],basis))[0];
    const reviewed=profile.implementations.find(x=>eq(x.address,current));need(reviewed,'CURRENT_IMPLEMENTATION');
    need(eq(e.keccak256(await rpc('eth_getCode',[current,basis.tag])),reviewed.codeHash),'CURRENT_IMPLEMENTATION');
    const old=profile.implementations.find(x=>eq(x.address,context.execution.implementation)&&eq(x.codeHash,context.execution.implementationCodeHash));
    need(old&&eq(old.signatureStore.address,context.store),'HISTORICAL_IMPLEMENTATION');
    for(const dep of [old,{address:old.support.address,codeHash:old.support.codeHash},old.signatureStore])
      need(eq(e.keccak256(await rpc('eth_getCode',[dep.address,basis.tag])),dep.codeHash),'DEPENDENCY_CODE');
    return old;
  }
  async function exportPublication(publication){
    const basis=await pin(),ev=await lc('evidence',[publication],basis),pc=(await lc('publicationContext',[publication],basis))[0];
    need(Number(ev[1])===3&&Number(ev[2])===0&&Number(pc.authorizationProfile)===3&&Number(pc.principalKind)===2&&Number(pc.intentFormat)===2,'PROOF_KIND');
    need(Number(ev[3])>0&&Number(ev[3])<=64&&BigInt(ev[4])>0n&&BigInt(ev[6])<2n**160n,'EVIDENCE_SHAPE');
    const store=e.getAddress(e.dataSlice(ev[6],12)),ke=(await call(store,si,'evidence',[ledger,publication],basis))[0];
    need(eq(ke.profile,signatureProfile(e))&&eq(ke.evidenceHash,ev[5])&&eq(ke.digest,pc.intentDigest),'TYPED_EVIDENCE');
    const actions=[];
    for(let leaf=0;leaf<Number(ev[3]);leaf++){
      const row=await lc('admission',[BigInt(ev[4])+BigInt(leaf)],basis);
      need(Number(row[1])===leaf&&BigInt(row[2])===BigInt(publication),'ADMISSION_SEQUENCE');
      const a={kind:Number(row[0]),typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash};
      if(a.kind===1){a.typeId=row[7];a.bodyHashOrRecordId=row[6];}
      else if(a.kind===2){a.typeId=(await lc('record',[row[6]],basis))[0];a.bodyHashOrRecordId=row[6];}
      else if(a.kind===3||a.kind===4){const position=(await lc('bindingPosition',[row[3]],basis))[0];[a.purpose,a.subject,a.role]=await lc('positionCell',[position],basis);a.expectedRevision=Number(row[4]);if(a.kind===3)a.target=row[6];}
      else if(a.kind===5)a.salt=row[6];else if(a.kind===6)a.target=row[6];else need(false,'ACTION_KIND');actions.push(a);
    }
    const execution=named(e,EXECUTION,(await lc('executionInfo',[pc.executionSet],basis))[0]);
    const intent={realmId:(await lc('realmId',[],basis))[0],realmOrigin:execution.origin,executionSet:pc.executionSet,author:ev[0],nonce:String(ev[7]),deadline:String(ev[8]),acceptanceProfile:ev[10],indexObligations:ev[11],readSetHash:pc.readSetHash};
    const b={context:{chainId:String(BigInt(await rpc('eth_chainId',[]))),ledger,publication:String(publication),firstAdmission:String(ev[4]),basis:String(ev[9]),intent,execution,store,walletCodehash:ke.walletCodehash,evidenceHash:ke.evidenceHash},
      actions:coder.encode([ACTION+'[]'],[actions]),reads:(await lc('readSetBytes',[pc.readSetHash],basis))[0],signature:ke.signature};
    const verified=verifyContractSignatureBundle(e,b);
    need(eq(verified.digest,pc.intentDigest)&&eq(verified.principalId,pc.principalId)&&eq(verified.actionsHash,ev[12]),'SOURCE_JOIN');
    if(profile)await checkProfile(b.context,basis);
    return plain(b);
  }
  async function acceptanceAnchor({archive,archiveCodeHash,packetHash}){
    const basis=await pin();need(eq(e.keccak256(await rpc('eth_getCode',[archive,basis.tag])),archiveCodeHash),'ARCHIVE_PIN');
    const ac=(fn,args=[])=>call(archive,ai,fn,args,basis);
    const b=named(e,BUNDLE,(await ac('bundle',[packetHash]))[0]),v=verifyContractSignatureBundle(e,b),old=await checkProfile(b.context,basis);
    need(eq(packetHash,v.packetHash)&&Number((await ac('receipts',[packetHash]))[0])===2,'LOCAL_RECEIPT');
    need(eq((await ac('source'))[0],ledger)&&eq((await ac('sourceCodehash'))[0],profile.ledgerCodeHash)
      &&eq((await ac('implementation'))[0],old.address)&&eq((await ac('implementationCodehash'))[0],old.codeHash)
      &&eq((await ac('execution'))[0],b.context.intent.executionSet),'ARCHIVE_SOURCE_PIN');
    return {profile:'efs.lab.local-1271-acceptance/1',packetHash,ledger,chainId:b.context.chainId,executionSet:b.context.intent.executionSet,
      implementation:old.address,implementationCodeHash:old.codeHash,store:old.signatureStore.address,storeCodeHash:old.signatureStore.codeHash,
      archive,archiveCodeHash,observedBlock:basis.blockHash,trust:'INDEPENDENTLY_SELECTED_LOCAL_RECEIPT_NOT_FOREIGN_CONSENSUS_PROOF'};
  }
  return {exportPublication,acceptanceAnchor};
}
