import { Contract, Interface, TypedDataEncoder, concat, id, keccak256, toQuantity, verifyTypedData } from 'ethers';
import type { JsonRpcProvider, Signer } from 'ethers';
import { hash, typeId, ruleId } from './codec.ts';
export const CORE_ABI=[
 'function registerType(bytes32 descriptor,bytes kinds,(bytes32 codeHash,bytes32 semanticConfig,uint8 mode,uint32 gasLimit) rule) returns(bytes32)',
 'function activate(bytes32 typeId,address hook,bytes32 localConfig) returns(bytes32)',
 'function hashPlan((address author,address executor,uint256 nonce,uint256 deadline,(bytes32 typeId,bytes32 activationId,bytes body,uint256 value)[] items) plan) view returns(bytes32)',
 'function execute((address author,address executor,uint256 nonce,uint256 deadline,(bytes32 typeId,bytes32 activationId,bytes body,uint256 value)[] items) plan,bytes signature) payable returns(bytes32[])',
 'function getReceipt(bytes32) view returns((bool accepted,address author,bytes32 typeId,bytes32 bodyHash,bytes32 ruleId,bytes32 activationId,bytes32 basis,bytes32 planId,uint256 index,uint256 blockNumber,uint256 chainId,address core,address submitter))',
 'function getBody(bytes32) view returns(bytes)',
 'function getType(bytes32) view returns((bool exists,bytes32 descriptor,bytes kinds,bytes32 ruleId,(bytes32 codeHash,bytes32 semanticConfig,uint8 mode,uint32 gasLimit) rule))',
 'function getActivation(bytes32) view returns((bool exists,bytes32 typeId,address hook,bytes32 localConfig))',
 'function nonces(address) view returns(uint256)'
];
const iface=new Interface(CORE_ABI);
export type Item={typeId:string;activationId:string;body:string;value:bigint};
export type Plan={author:string;executor:string;nonce:bigint;deadline:bigint;items:Item[]};
export type Context={chainId:bigint;core:string};
export type Basis=Context&{blockNumber:number;blockHash:string};
const types={Plan:[{name:'author',type:'address'},{name:'executor',type:'address'},{name:'nonce',type:'uint256'},{name:'deadline',type:'uint256'},{name:'itemsHash',type:'bytes32'}]};
function signing(context:Context,plan:Plan) {
 const itemHashes=plan.items.map(i=>hash(['bytes32','bytes32','bytes32','bytes32','uint256'],[id('Item(bytes32 typeId,bytes32 activationId,bytes32 bodyHash,uint256 value)'),i.typeId,i.activationId,keccak256(i.body),i.value]));
 return {domain:{name:'EFS Acceptance Lab',version:'1',chainId:context.chainId,verifyingContract:context.core},types,value:{author:plan.author,executor:plan.executor,nonce:plan.nonce,deadline:plan.deadline,itemsHash:keccak256(concat(itemHashes))}};
}
export function planWrite(context:Context,input:Plan,sourceReads:unknown[]) {
 const plan=structuredClone(input); if(!plan.items.length||plan.items.length>8) throw Error('plan item bound');
 for(const item of plan.items) Object.freeze(item); Object.freeze(plan.items); Object.freeze(plan);
 const sig=signing(context,plan);
 const digest=TypedDataEncoder.hash(sig.domain,sig.types,sig.value);
 return Object.freeze({context:Object.freeze({...context}),plan,digest,rawPlan:iface.encodeFunctionData('execute',[plan,'0x']),sourceReads:structuredClone(sourceReads),predictedReceiptIds:plan.items.map((_,i)=>hash(['bytes32','bytes32','uint256'],[id('efs.acceptance.receipt.v1'),digest,i])),stage:'PLANNED',effect:'UNKNOWN' as const});
}
export type Planned=ReturnType<typeof planWrite>;
export async function authorize(planned:Planned,signer:Signer) {
 const s=signing(planned.context,planned.plan),signature=await signer.signTypedData(s.domain,s.types,s.value);
 if(verifyTypedData(s.domain,s.types,s.value,signature).toLowerCase()!==planned.plan.author.toLowerCase()) throw Error('wrong signer');
 return {planned,signature,path:'RELAYED_EOA',stage:'PREPARED',effect:'UNKNOWN' as const};
}
export function direct(planned:Planned) {return {planned,signature:'0x',path:'DIRECT_EOA_TRANSACTION_AUTHORSHIP',stage:'PREPARED',effect:'UNKNOWN' as const};}
export type Prepared=ReturnType<typeof direct>;
export function recoverAuthor(p:Prepared) {const s=signing(p.planned.context,p.planned.plan);return verifyTypedData(s.domain,s.types,s.value,p.signature);}
export async function submit(prepared:Prepared,submitter:Signer,options:{exactRetry?:boolean}={}) {
 const core=new Contract(prepared.planned.context.core,CORE_ABI,submitter);
 const value=options.exactRetry?0n:prepared.planned.plan.items.reduce((n,i)=>n+i.value,0n);
 const tx=await core.execute(prepared.planned.plan,prepared.signature,{value});
 const evmReceipt=await tx.wait();
 return {prepared,transactionHash:tx.hash,rawSubmittedCalldata:tx.data,evmReceipt,submittedBy:await submitter.getAddress(),exactRetry:options.exactRetry??false,stage:'MINED',effect:'UNKNOWN' as const};
}
export function scopedPage(query:unknown) {return {query,support:'UNSUPPORTED',coverage:'UNKNOWN',outcome:'UNKNOWN',reason:'Standalone lab has no scoped-page implementation'};}
export async function pinBasis(provider:JsonRpcProvider,context:Context,blockNumber?:number):Promise<Basis> {
 const block=await provider.send('eth_getBlockByNumber',[blockNumber===undefined?'latest':toQuantity(blockNumber),false]);
 if(!block) throw Error('BASIS_UNAVAILABLE');
 return {...context,blockNumber:Number(BigInt(block.number)),blockHash:block.hash};
}
async function checkBasis(provider:JsonRpcProvider,basis:Basis) {
 const [chain,block]=await Promise.all([provider.send('eth_chainId',[]),provider.send('eth_getBlockByNumber',[toQuantity(basis.blockNumber),false])]);
 if(BigInt(chain)!==basis.chainId||!block||block.hash!==basis.blockHash) throw Error('BASIS_DISAGREEMENT');
}
async function call(provider:JsonRpcProvider,basis:Basis,method:string,args:unknown[]) {
 const input=iface.encodeFunctionData(method,args);
 const output=await provider.send('eth_call',[{to:basis.core,data:input},toQuantity(basis.blockNumber)]);
 return {value:iface.decodeFunctionResult(method,output)[0],raw:{method,input,output,blockNumber:basis.blockNumber,blockHash:basis.blockHash}};
}
export async function exactRead(provider:JsonRpcProvider,basis:Basis,receiptId:string) {
 const evidence:unknown[]=[];
 const qualification={basis,support:'SUPPORTED_EXACT_ACCEPTANCE_RECEIPT',authority:'TRUSTED_LOCAL_RPC_NO_STATE_PROOF',currentness:'AT_PINNED_BASIS_ONLY',finality:'LOCAL_UNFINALIZED',coverage:'EXACT_RECEIPT_ONLY',currentPolicy:'NOT_EVALUATED'};
 try {
  await checkBasis(provider,basis);
  const r=await call(provider,basis,'getReceipt',[receiptId]); evidence.push(r.raw);
  const receipt=r.value.toObject();
  if(!receipt.accepted) return {...qualification,outcome:'UNKNOWN',receipt:undefined,reason:'NO_ACCEPTED_RECEIPT_OBSERVED_NOT_ABSENCE_PROOF',evidence};
  const t=await call(provider,basis,'getType',[receipt.typeId]); evidence.push(t.raw);
  const info=t.value;
  const rule={codeHash:info.rule.codeHash,semanticConfig:info.rule.semanticConfig,mode:Number(info.rule.mode),gasLimit:Number(info.rule.gasLimit)};
  if(!info.exists||typeId(info.descriptor,info.kinds,rule)!==receipt.typeId||ruleId(rule)!==receipt.ruleId||receipt.chainId!==basis.chainId||receipt.core.toLowerCase()!==basis.core.toLowerCase()||receipt.blockNumber>BigInt(basis.blockNumber)||hash(['bytes32','bytes32','uint256'],[id('efs.acceptance.receipt.v1'),receipt.planId,receipt.index])!==receiptId) throw Error('RECEIPT_IDENTITY_MISMATCH');
  await checkBasis(provider,basis);
  return {...qualification,outcome:'FOUND',receipt,typeInfo:info,validation:'IDENTITY_VERIFIED_HISTORICAL_ACCEPTANCE',evidence};
 } catch(error) {return {...qualification,outcome:'UNKNOWN',receipt:undefined,reason:String(error),evidence};}
}
export async function verifiedBody(provider:JsonRpcProvider,basis:Basis,receiptId:string) {
 const exact=await exactRead(provider,basis,receiptId),evidence=[...exact.evidence];
 if(exact.outcome!=='FOUND'||!exact.receipt) return {exact,evidence,integrity:'NOT_EVALUATED',availability:'UNKNOWN',returnedBytes:undefined};
 try {
  const b=await call(provider,basis,'getBody',[receiptId]); evidence.push(b.raw); await checkBasis(provider,basis);
  if(keccak256(b.value)!==exact.receipt.bodyHash) return {exact,evidence,integrity:'FAILED',availability:'AVAILABLE',returnedBytes:b.value};
  return {exact,evidence,integrity:'VERIFIED_EXACT_BODY',availability:'AVAILABLE',returnedBytes:b.value,verifiedBytes:b.value as string};
 } catch(error) {return {exact,evidence,integrity:'NOT_EVALUATED',availability:'UNKNOWN',reason:String(error),returnedBytes:undefined};}
}
export async function readBack(provider:JsonRpcProvider,journey:{prepared:Prepared;submittedBy?:string;exactRetry?:boolean},basis:Basis) {
 const p=journey.prepared.planned,reads=[];
 try {
  if(basis.core.toLowerCase()!==p.context.core.toLowerCase()||basis.chainId!==p.context.chainId) throw Error('CONTEXT_DISAGREEMENT');
  await checkBasis(provider,basis);
  for(const [i,item] of p.plan.items.entries()) {
   const b=await verifiedBody(provider,basis,p.predictedReceiptIds[i]); reads.push(b);
   const r=b.exact.receipt;
   if(b.integrity!=='VERIFIED_EXACT_BODY'||!r||r.author.toLowerCase()!==p.plan.author.toLowerCase()||r.typeId!==item.typeId||r.activationId!==item.activationId||r.planId!==p.digest||r.index!==BigInt(i)||b.verifiedBytes!==item.body||(!journey.exactRetry&&journey.submittedBy&&r.submitter.toLowerCase()!==journey.submittedBy.toLowerCase())) throw Error('PLANNED_EFFECT_MISMATCH');
  }
  await checkBasis(provider,basis);
  return {journey,basis,reads,stage:'READ_BACK_VERIFIED',effect:'COMMITTED',applicationBasis:'RETAINED_OPAQUE_HOOK_COMMITMENT_NOT_INDEPENDENT_ORACLE'};
 } catch(error) {return {journey,basis,reads,stage:'READ_BACK_INCOMPLETE',effect:'UNKNOWN',reason:String(error)};}
}
