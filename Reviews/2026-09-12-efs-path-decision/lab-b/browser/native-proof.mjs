/** Standalone native state witness. No source, wallet, validator or network calls.
 * The independent trie walk uses only Keccak and RLP primitives from supplied
 * ethers, not Solidity verification or EIP1186 convenience value/hash fields. */
import {ACTION,INTENT,READ_SET,EXECUTION,archiveProfile} from './guarded-archive.mjs';
const need=(ok,code)=>{if(!ok)throw Error(`NATIVE_${code}`);};
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const raw=x=>typeof x==='string'&&/^0x(?:[a-f0-9]{2})*$/i.test(x);
const size=x=>(x.length-2)/2;
const word=(e,n)=>e.toBeHex(n,32);
export const PROFILE='efs.lab.native-state/1:direct-immutable:guarded-single-publish:30-positive-keys:cancun';
export const ANCHOR='tuple(uint256 chainId,bytes32 instanceId,address ledger,bytes32 codeHash,bytes32 realmId,bytes32 deploymentId,bytes32 helperIdentity)';
export const WITNESS='tuple(uint64 checkpoint,uint64 publication,bytes body,bytes reads,bytes[] accountProof,tuple(bytes32 key,bytes[] nodes)[] slots)';
export const anchorHash=(e,a)=>e.keccak256(e.AbiCoder.defaultAbiCoder().encode([ANCHOR],[a]));
export function canonicalRlp(e,encoded){
  need(raw(encoded),'RLP_BYTES');const decoded=e.decodeRlp(encoded);
  need(eq(e.encodeRlp(decoded),encoded),'RLP_CANONICAL');return decoded;
}
function uint(e,encoded,max=32){
  need(typeof encoded==='string'&&size(encoded)<=max&&(encoded==='0x'||!encoded.startsWith('0x00')),'INTEGER');
  return encoded==='0x'?0n:BigInt(encoded);
}
function nodeShape(e,node){
  need(Array.isArray(node)&&(node.length===2||node.length===17),'NODE_TUPLE');
  const child=x=>{if(Array.isArray(x)){need(size(e.encodeRlp(x))<32,'EMBEDDED_SIZE');nodeShape(e,x);}else need(x==='0x'||size(x)===32,'CHILD_REFERENCE');};
  if(node.length===17){for(const x of node.slice(0,16))child(x);need(typeof node[16]==='string','BRANCH_VALUE');return;}
  need(typeof node[0]==='string'&&size(node[0])>0,'COMPACT_PATH');
  const h=node[0].slice(2),flag=Number.parseInt(h[0],16);
  need(flag<=3&&(flag%2===1||h[1]==='0'),'COMPACT_PATH');
  if(flag<2){need(h.length-(flag%2===1?1:2)>0,'EMPTY_EXTENSION');child(node[1]);}
  else need(typeof node[1]==='string'&&size(node[1])>0,'LEAF_VALUE');
}
export function positiveValue(e,root,key,proof){
  need(raw(root)&&size(root)===32&&raw(key),'TRIE_KEY');
  need(Array.isArray(proof)&&proof.length>0&&proof.length<=65,'PATH_BOUND');
  let reference=root,nibble=0;const path=e.keccak256(key).slice(2),seen=new Set();
  for(let i=0;i<proof.length;i++){
    const bytes=proof[i];need(raw(bytes)&&size(bytes)>0&&size(bytes)<=1024&&!seen.has(bytes.toLowerCase()),'NODE_BOUND_OR_DUPLICATE');seen.add(bytes.toLowerCase());
    need(eq(i===0||size(bytes)>=32?e.keccak256(bytes):bytes,reference),'NODE_HASH');
    const n=canonicalRlp(e,bytes);nodeShape(e,n);let value;
    if(n.length===17){
      if(nibble===64)value=n[16];
      else {const child=n[Number.parseInt(path[nibble++],16)];reference=Array.isArray(child)?e.encodeRlp(child):child;need(reference!=='0x','NON_INCLUSION');}
    }else{
      const compact=n[0].slice(2),flag=Number.parseInt(compact[0],16),suffix=compact.slice(flag%2===1?1:2);
      need(nibble+suffix.length<=64&&path.slice(nibble,nibble+suffix.length)===suffix,'PATH_MISMATCH');nibble+=suffix.length;
      if(flag>=2){need(nibble===64,'LEAF_KEY');value=n[1];}
      else reference=Array.isArray(n[1])?e.encodeRlp(n[1]):n[1];
    }
    if(value!==undefined){need(value!=='0x'&&i===proof.length-1,'VALUE_OR_TRAILING');return value;}
  }
  need(false,'MISSING_NODE');
}
export function positiveStorage(e,root,key,proof){
  need(raw(key)&&size(key)===32,'STORAGE_KEY');
  const value=uint(e,canonicalRlp(e,positiveValue(e,root,key,proof)));
  need(value>0n,'POSITIVE_ONLY');return value;
}
export function parseCancunHeader(e,rawHeader){
  need(raw(rawHeader)&&size(rawHeader)<=1024,'HEADER_BOUND');
  const h=canonicalRlp(e,rawHeader);need(Array.isArray(h)&&h.length===20&&h.every(x=>typeof x==='string'),'CANCUN_HEADER');
  for(const [i,n] of [[0,32],[1,32],[2,20],[3,32],[4,32],[5,32],[6,256],[13,32],[14,8],[16,32],[19,32]])need(size(h[i])===n,'HEADER_FIELD');
  need(size(h[12])<=32,'EXTRA_DATA');
  for(const i of [7,8,9,10,11,15,17,18])uint(e,h[i]);
  const number=uint(e,h[8],5);need(number>0n,'HEADER_NUMBER');
  return {number,root:h[3],hash:e.keccak256(rawHeader)};
}
export function nativeKeys(e,publication,first,execution,publicationId,recordId,author){
  const coder=e.AbiCoder.defaultAbiCoder(),map=(key,root)=>BigInt(e.keccak256(coder.encode(['bytes32','uint256'],[word(e,key),root])));
  const offsets=(base,list)=>list.map(n=>word(e,base+BigInt(n)));
  return [...offsets(map(BigInt(publication),6),[0,3,4,5,6]),...offsets(map(BigInt(publication),13),[0,1,2,3,4]),
    ...offsets(map(BigInt(execution),14),[0,1,2,3,4,5,6,7,8,9]),...offsets(map(BigInt(first),5),[0,1,2]),
    word(e,map(BigInt(publicationId),7)),...offsets(map(BigInt(recordId),2),[0,1]),word(e,1),
    word(e,BigInt(e.id('efs.lab.genesis-chain.v2'))-1n),word(e,BigInt(e.id('efs.lab.execution-revision.v2'))-1n),word(e,map(BigInt(author),11))];
}
/** Internal state decoder is exported for adversarial tests of authenticated
 * malformed state. Calling it alone is NOT a proof or trust grade. */
export function decodeNativeValues(e,a,w,v){
  const c=e.AbiCoder.defaultAbiCoder(),hash=(t,x)=>e.keccak256(c.encode(t,x)),z=e.ZeroHash,p=archiveProfile(e);
  need(v.length===30&&v.every(x=>typeof x==='bigint'&&x>0n&&x<2n**256n),'VALUES');
  const mask=n=>(1n<<BigInt(n))-1n,P=BigInt(w.publication),C=BigInt(w.checkpoint);
  need(P>0n&&P<mask(48)&&C>0n&&C<1n<<40n,'ERA');
  const author=e.getAddress(word(e,v[0]&mask(160)).slice(0,2)+word(e,v[0]&mask(160)).slice(-40));
  const A=(v[0]>>188n)&mask(48),B=v[1]>>128n,nonce=v[1]&mask(64),deadline=(v[1]>>64n)&mask(64);
  need(A>0n&&B>0n&&B<=C&&(v[1]>>168n)===0n&&v[0]===(BigInt(author)|(1n<<160n)|(1n<<172n)|(A<<188n)),'EVIDENCE');
  need(v[9]===0x020102n&&v[23]===P,'CONTEXT');
  need(raw(w.body)&&size(w.body)<=8192&&raw(w.reads)&&size(w.reads)>=224&&size(w.reads)<=10592,'PREIMAGE_BOUND');
  const reads=c.decode([READ_SET],w.reads)[0],n=reads.principalIds.length,m=reads.positions.length;
  need(eq(c.encode([READ_SET],[reads]),w.reads)&&n<=64&&m<=4&&(n===0)===(m===0)&&reads.expectedHeads.length===n*m,'READ_SET');
  for(const x of [reads.principalIds,reads.positions])need(x.every(y=>!eq(y,z))&&new Set(x.map(y=>y.toLowerCase())).size===x.length,'READ_SET');
  need(eq(hash(['bytes32',READ_SET],[e.id('efs.lab.read-set/2:ordered-first-binding'),reads]),word(e,v[7])),'READ_HASH');
  need(v[27]===BigInt(a.chainId)&&v[27]>0n&&v[28]>=v[11]&&v[11]>=1n&&v[29]>=nonce+1n&&v[29]<=mask(64),'MONOTONE');
  need((v[26]&mask(64))>=A&&(v[26]>>192n)>=P,'COUNTERS');
  const origin=hash(['bytes32','uint256','address'],[e.id('efs.lab.realm-origin/2'),a.chainId,a.ledger]);
  need(eq(origin,word(e,v[10])),'ORIGIN');
  need(eq(hash(['bytes32','uint256','bytes32','address'],[e.id('efs2/principal/1'),2,origin,author]),word(e,v[5])),'PRINCIPAL');
  for(const i of [13,15,17])need(v[i]<=mask(160),'ADDRESS_PADDING');need(v[19]<=mask(64),'GENERATION');
  const addr=i=>e.getAddress(e.toBeHex(v[i],20));
  const execution={origin,revision:v[11],shellCodeHash:word(e,v[12]),implementation:addr(13),implementationCodeHash:word(e,v[14]),
    registryAddress:addr(15),registryCodeHash:word(e,v[16]),indexAddress:addr(17),indexCodeHash:word(e,v[18]),indexGeneration:v[19]};
  need(eq(execution.implementation,a.ledger)&&eq(execution.shellCodeHash,a.codeHash)&&eq(execution.implementationCodeHash,a.codeHash),'DIRECT_PROFILE');
  need(eq(hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],[e.id('efs.lab.execution-set/2'),p.layoutId,p.legacyDomain,p.guardedDomain,execution]),word(e,v[6])),'EXECUTION');
  const normalMeta=v[20]&~(1n<<148n),activation=(v[20]>>152n)&mask(16);
  need(activation>0n&&normalMeta===(1n|(P<<20n)|(activation<<152n)),'ADMISSION');
  need(eq(e.keccak256(w.body),word(e,v[21]))&&v[22]===v[24],'BODY');
  const recordId=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),word(e,v[22]),word(e,v[21])]);
  const recordFirst=v[25]&mask(48),length=(v[25]>>48n)&mask(32),occurrences=v[25]>>80n;
  need(recordFirst>0n&&recordFirst<=A&&length===BigInt(size(w.body))&&occurrences<=mask(32),'RECORD');
  const action={kind:1,typeId:word(e,v[22]),bodyHashOrRecordId:word(e,v[21]),purpose:z,subject:z,role:z,target:z,expectedRevision:0,salt:z};
  const actionsHash=hash([ACTION+'[]'],[[action]]);need(eq(actionsHash,word(e,v[4])),'ACTION');
  const intent={realmId:a.realmId,realmOrigin:origin,executionSet:word(e,v[6]),author,nonce,deadline,acceptanceProfile:word(e,v[2]),indexObligations:word(e,v[3]),readSetHash:word(e,v[7])};
  const digest=e.keccak256(e.concat(['0x1901',p.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)'),intent,actionsHash])]));
  need(eq(digest,word(e,v[8])),'DIGEST');
  const publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),word(e,v[5]),digest]);
  const keys=nativeKeys(e,P,A,word(e,v[6]),publicationId,recordId,author);
  const claimId=hash(['bytes32','bytes32','uint64','uint64','uint64','bytes32','bytes32','uint64','uint256'],[e.id(PROFILE),anchorHash(e,a),P,A,B,digest,recordId,recordFirst,normalMeta]);
  return {keys,claimId,publicationId,principalId:word(e,v[5]),recordId,author,publication:P,firstAdmission:A,acceptanceBlock:B,checkpoint:C,digest,action,intent,execution,
    observations:{withdrawn:(v[20]&(1n<<148n))!==0n,occurrences,nonce:v[29],revision:v[28],admissions:v[26]&mask(64),publications:v[26]>>192n}};
}
export function verifyNativePacket(e,packet,{rootAnchor,sourceAnchor}={}){
  need(packet?.profile===PROFILE,'PROFILE');const a=packet.source,w=packet.witness,h=parseCancunHeader(e,packet.header);
  for(const k of ['instanceId','deploymentId','helperIdentity'])need(raw(a[k])&&size(a[k])===32&&!eq(a[k],e.ZeroHash),'SOURCE_CONTEXT');
  need(raw(w.body)&&size(w.body)<=8192&&raw(w.reads)&&size(w.reads)>=224&&size(w.reads)<=10592,'PREIMAGE_BOUND');
  need(String(h.number)===String(w.checkpoint),'CHECKPOINT');
  need(Array.isArray(w.slots)&&w.slots.length===30,'EXACT_KEYS');
  let bytes=0,nodes=0;for(const path of [w.accountProof,...w.slots.map(s=>s.nodes)]){
    need(Array.isArray(path)&&path.length>0&&path.length<=65,'PATH_BOUND');
    for(const node of path){need(raw(node)&&size(node)>0&&size(node)<=1024,'NODE_BOUND');bytes+=size(node);nodes++;}
  }
  need(bytes<=262144,'AGGREGATE_BOUND');
  const keys=w.slots.map(s=>s.key.toLowerCase());need(keys.every(k=>raw(k)&&size(k)===32)&&new Set(keys).size===30,'EXACT_KEYS');
  const account=canonicalRlp(e,positiveValue(e,h.root,a.ledger,w.accountProof));
  need(Array.isArray(account)&&account.length===4,'ACCOUNT');uint(e,account[0]);uint(e,account[1]);
  need(typeof account[2]==='string'&&size(account[2])===32&&eq(account[3],a.codeHash),'ACCOUNT_CODE');
  const values=w.slots.map(s=>positiveStorage(e,account[2],s.key,s.nodes)),d=decodeNativeValues(e,a,w,values);
  need(d.keys.every((k,i)=>eq(k,w.slots[i].key)),'KEY_RECIPE');
  const witnessId=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32',WITNESS],[e.id(PROFILE),h.root,w]));
  let rootAuthentication='UNVERIFIED',sourceExecution='UNVERIFIED';
  if(rootAnchor){
    need(eq(rootAnchor.blockHash,h.hash)&&eq(rootAnchor.stateRoot,h.root)&&String(rootAnchor.number)===String(h.number)
      &&eq(rootAnchor.instanceId,a.instanceId)&&String(rootAnchor.chainId)===String(a.chainId),'ROOT_ANCHOR');
    need(['LOCAL_CHECKPOINT','TRUSTED_FOREIGN_ROOT'].includes(rootAnchor.kind),'ROOT_KIND');
    if(rootAnchor.kind==='LOCAL_CHECKPOINT')need(e.isAddress(rootAnchor.checkpoint)&&raw(rootAnchor.checkpointCodeHash)&&size(rootAnchor.checkpointCodeHash)===32&&!eq(rootAnchor.checkpointCodeHash,e.ZeroHash),'CHECKPOINT_ANCHOR');
    rootAuthentication=rootAnchor.kind==='LOCAL_CHECKPOINT'?'LOCAL_BLOCKHASH_CHECKPOINT':'TRUSTED';
  }
  if(sourceAnchor){
    need(sourceAnchor.kind==='TRUSTED_DIRECT_DEPLOYMENT'&&eq(anchorHash(e,sourceAnchor),anchorHash(e,a)),'SOURCE_ANCHOR');
    if(rootAuthentication!=='UNVERIFIED')sourceExecution='ANCHORED_DIRECT_DEPLOYMENT';
  }
  return {...d,witnessId,stateRoot:h.root,blockHash:h.hash,integrity:'VERIFIED_POSITIVE_INCLUSION',rootAuthentication,sourceExecution,
    sourceAdmission:sourceExecution==='ANCHORED_DIRECT_DEPLOYMENT'?'HISTORICAL_ACCEPTANCE':'UNVERIFIED',bodyCoverage:'FULL_SELECTED_RECORD',
    currentness:'CHECKPOINT_OBSERVATIONS_ONLY',authority:'NONE',guardReexecution:'NOT_PROVEN',foreignConsensus:'NOT_PROVEN',proofBytes:bytes,proofNodes:nodes};
}
export function consumeNativeClaim(e,packet,anchors){
  const v=verifyNativePacket(e,packet,anchors);need(v.sourceAdmission==='HISTORICAL_ACCEPTANCE','CONSUMER_TRUST');
  return {recordId:v.recordId,principalId:v.principalId,body:packet.witness.body,bodyHash:e.keccak256(packet.witness.body),authority:'NONE',claimId:v.claimId};
}
