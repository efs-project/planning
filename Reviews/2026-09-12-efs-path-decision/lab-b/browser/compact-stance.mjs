import {createTagStancePlanner,reduceStances} from './tag-stance-profile.mjs';

// Point-only adapter. Its caller authenticates the manifest's required index
// and supplies a fixed block-hash call closure. No journal or signing bypass.
export async function createCompactStance({e,call,code,invoke,ledgerAbi,ledgerAddress,context}){
  const Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder();
  const eq=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
  const check=(ok,why)=>{if(!ok)throw Error('COMPACT_STANCE_'+why);};
  const hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const scalar=async(k,f,args=[]) => (await call(k,f,args))[0];
  const [address,codeHash,profileHash]=await Promise.all(['stanceValidator','stanceValidatorHash','tagProfileHash'].map(f=>scalar('index',f)));
  const runtime=await code(address);check(runtime!=='0x'&&eq(e.keccak256(runtime),codeHash),'VALIDATOR_CODE');
  const iface=new e.Interface([
    'function ledger() view returns(address)',
    'function profileBytes() view returns(bytes)',
    'function validate((uint8 kind,uint64 admission,bytes32 author,bytes32 recordId,bytes32 typeId,bytes32 scopeKey,bytes32 bindingKey,uint64 bindingOrdinal,bytes32 target,bytes32 oldTarget,bool freshBinding,bool oldLive) effect) view returns(bytes32)',
  ]);
  const validator=(fn,args=[])=>invoke(address,iface,fn,args);
  check(eq((await validator('ledger'))[0],ledgerAddress),'VALIDATOR_LEDGER');
  const planner=createTagStancePlanner({ethers:e,ledgerAbi,profileHash,pinned:true,call:(key,fn,args=[])=>
    key==='stanceValidator'?validator(fn,args):call(key==='tagIndex'?'index':key,fn,args)});
  async function read(args){
    const q=await planner.inspect(args),observations=[];
    for(const principal of args.principals){
      try{
        const key=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),principal,q.coordinate]);
        const h=await call('ledger','head',[key]),state=Number(h[0]);
        const observation={author:principal,target:h[5],revision:String(h[1]),admission:String(h[2]),basis:context};
        if(state===0){check(h[1]===0n&&h[2]===0n&&eq(h[5],Z),'UNTOUCHED');observations.push({...observation,kind:'UNTOUCHED'});continue;}
        check((state===1||state===2)&&h[1]>0n&&h[2]>0n&&h[2]<=BigInt(context.admission),'HEAD_UNAVAILABLE');
        const a=await call('ledger','admission',[h[2]]),position=await scalar('ledger','bindingPosition',[h[4]]);
        const publication=await scalar('ledger','publicationContext',[a[2]]),cell=await call('ledger','positionCell',[position]);
        check(Number(a[0])===(state===1?3:4)&&a[4]+1n===h[1]&&a[3]===h[4]&&eq(position,q.coordinate)
          &&eq(publication.principalId,principal)&&eq(cell[0],q.purpose)&&eq(cell[1],q.subject)&&eq(cell[2],q.concept),'HEAD_INTEGRITY');
        if(state===2){check(eq(h[5],Z),'TOMBSTONE');observations.push({...observation,kind:'TOMBSTONE',purpose:'stance'});continue;}
        const token=q.tokens.findIndex(t=>eq(t,h[5]));check(token>=0&&eq(a[6],h[5]),'TOKEN');
        const scope=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/vk/binding-scope/1'),principal,q.purpose,q.subject]);
        await validator('validate',[{kind:3,admission:h[2],author:principal,recordId:Z,typeId:Z,scopeKey:scope,bindingKey:key,
          bindingOrdinal:h[4],target:h[5],oldTarget:Z,freshBinding:false,oldLive:false}]);
        observations.push({...observation,kind:['ASSERT','DENY','SILENT'][token]});
      }catch(error){observations.push({author:principal,kind:'UNKNOWN',reason:error.message,basis:context});}
    }
    return {...q,...reduceStances(observations),observations};
  }
  return {planner,read};
}

// Hydrates only already-enumerated folder rows at the caller's one context.
// No inverse inventory or whole-folder coverage claim is made here.
export async function hydrateExactStances({sdk,row,concept,authors,context}){
  const read=scope=>sdk.readStance({subject:row.file,scope,concept,authors,context});
  const stable=await read(row.kind==='directory'?'directory':'file');
  const point=row.point,selection=point?.value?.selection,record=point?.value?.revision;
  const unknown=reason=>({value:{subject:null,concept,assessment:'UNKNOWN',knowledge:'UNKNOWN',exactStance:true,
    selection,reason,observations:[]}});
  let revision=row.kind==='directory'?{value:{assessment:'NOT_APPLICABLE'}}:unknown('NO_QUALIFIED_SELECTED_REVISION');
  // The displayed point owns HEAD policy. A conflict, mask or unverified
  // header must not become an ordered selection just to read its tags.
  if(row.kind==='file'&&point?.knowledge==='PRESENT'&&selection?.status===1&&record?.recordId
    &&selection.target?.toLowerCase()===record.recordId.toLowerCase()
    &&(record.knowledge===undefined||record.knowledge==='PRESENT')){
    revision=await read('selectedRevision');
    if(revision.value.subject?.toLowerCase()!==record.recordId.toLowerCase())revision=unknown('SELECTED_REVISION_MISMATCH');
  }
  // Location testimony is a separate exact FOLDER coordinate. Missing or
  // unqualified names must not become a negative tag result.
  const location=row.name?.knowledge==='PRESENT'&&row.folder
    ?await sdk.readStance({scope:'placement',folder:row.folder,name:row.name.value,concept,authors,context})
    :unknown('PLACEMENT_NAME_UNAVAILABLE');
  return {...row,point:{...row.point,value:{...row.point?.value,fileTag:stable.value,
    revisionTag:revision.value,locationTag:location.value}}};
}
