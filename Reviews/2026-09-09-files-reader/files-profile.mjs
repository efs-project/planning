// Exact disposable candidate Types and ASCII public-mount profile, not Files/1.
import { concat,hexlify,getBytes,keccak256,toUtf8Bytes } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';
export const TYPES=Object.freeze({
  'ObjectGenesis/1':'0x1dc6366ab6cc72f3602e01be571613ab84ae40288fe07000f6d5eb688c923c44',
  'ResolutionPlan/1':'0x05cc2a7f4eec5faff7e64f2f8374aca5f980d390fd4eee3b46c2f5c53853e61e',
  'BindingSet/1':'0x3d40b6b53db7885be062d89270f41085fa8c59738cbc66fe28857d0573ef3a91',
  'BindingTombstone/1':'0xd9a17f2bdf9d885520b42b39778ec88f792b9b5a4fe0851cc388b2932b31add1',
  'DirectoryEntry/1':'0x3a73cfe3e879b527c049645c5a2db3e8f4040a374a36bc5167643c2920642722',
  'DirectoryWhiteout/1':'0x05eb791f96746078774b78b919153e652df372d1e86fcf8d802fee1df3e3badb',
  'PublicFilesMountConfig/1':'0x6577b3026df6f8cbe5fd1f4709a64755b192d599f57253de6387bf79bc09a692',
  'MountDescriptor/1':'0x8ac5bdff2615f825b887f086e40fdc902edec4e99962ffa5c7db79d661623721',
  'FileRevision/1':'0x70e18fd87e4d254def230ccb1a7873c760ef95851b6e200fd3597c5fd7442bfa',
  'ChunkTree/1':'0xf6c0966e2acc9f6b1bad9ac20f07da3b00cc418aafc8481dedcdc5f35f8767e8',
  'RemovalMarker/1':'0x54edf1b86391ddfaa3baaab32b8c2792e1cffe57dbf9dcad08bdf9c0fa26ff08',
  'FileTagAssertion/1':'0x0ffb25d529c74f072934c97553c8ca80fee89d2884218dd9edb804c4fd7478b6',
});
const hash=s=>keccak256(toUtf8Bytes(s)),H=(...words)=>keccak256(concat(words));
const tag=(d,s)=>H(hash('efs2/'+d+'/1'),hash(s));
export const FIXTURE=Object.freeze({publicProfile:hash('efs.fixture.files-public-ascii-read/1'),planScopeDomain:hash('efs.fixture.files-plan-scope/1'),lensProfile:hash('efs2/lens-semantics/b0/1'),fileMeaning:hash('efs2/files/meaning/file/1'),directoryMeaning:hash('efs2/files/meaning/directory/1'),charterPurpose:tag('purpose','objects/publisher-charter/1'),namePurpose:tag('purpose','files/name-slot/1'),headPurpose:tag('purpose','files/revision-head/1'),headRole:tag('fieldrole','files/current-revision/1'),tagPurpose:tag('purpose','files/tag-current/1'),removedPurpose:tag('purpose','files/removed-item/1'),charterRole:'0x'+'0'.repeat(63)+'1'});
export const tagId=label=>tag('files-tag',label);
export const nameRole=name=>tag('fieldrole',name);
export const positionKey=(purpose,subject,fieldRole)=>H(hash('efs2/position/1'),purpose,subject,fieldRole);
export const bindingKey=(principal,purpose,subject,fieldRole)=>H(hash('efs2/binding/1'),principal,positionKey(purpose,subject,fieldRole));
export const bindingScopeKey=(principal,purpose,subject)=>H(hash('efs2/vk/binding-scope/1'),principal,purpose,subject);
export const purposeAndScope=(kind,root)=>{
  if(!['namespace','content'].includes(kind))throw Error('unsupported Files Plan purpose');
  return H(hash('efs2/plan-purpose/1'),tag('purpose','files/'+kind+'-plan/1'),H(FIXTURE.planScopeDomain,FIXTURE.publicProfile,root));
};
export const ordinaryRecord=(type,body)=>H(hash('efs2/record/1'),type,keccak256(body));
export const contentDigest=data=>keccak256(concat(['0x00',data]));
export const byteLength=data=>BigInt(getBytes(data).length);
export function nameAssessment(name){
  if(typeof name!=='string')return {status:'MALFORMED',reason:'NAME_TYPE'};
  const n=new TextEncoder().encode(name).length;
  if(!n||n>255||name==='.'||name==='..'||/[\/\\\u0000-\u001f\u007f]/u.test(name))return {status:'MALFORMED',reason:'FILES_NAME'};
  return /^[a-z0-9._-]+$/.test(name)?{status:'ACCEPTED'}:{status:'UNSUPPORTED',reason:'ASCII_NAME_PROFILE'};
}

export function assessRecord(recordId,typeId,body){
  const raw={recordId,typeId,body,fields:[]};
  try{
    if(!/^0x[0-9a-f]{64}$/i.test(recordId??'')||!/^0x[0-9a-f]{64}$/i.test(typeId??'')||!/^0x(?:[0-9a-f]{2})*$/i.test(body??''))throw Error('HEX_SHAPE');
    if(ordinaryRecord(typeId,body)!==recordId.toLowerCase())throw Error('RECORD_ID_MISMATCH');
    const type=Object.keys(TYPES).find(k=>TYPES[k]===typeId.toLowerCase());
    if(!type)return {status:'UNSUPPORTED',reason:'UNKNOWN_EXACT_TYPE',raw};
    const b=getBytes(body);let at=0;
    const take=n=>{if(at+n>b.length)throw Error('TRUNCATED');const v=b.slice(at,at+n);at+=n;return v;};
    const word=()=>hexlify(take(32));
    const ref=()=>{const v=word();if(BigInt(v)<65536n)throw Error('LOCAL_REFERENCE');return v;};
    const u16=()=>{const v=take(2);return v[0]*256+v[1];};
    const occ=()=>({envelopeId:ref(),leafIndex:u16()});
    const option=f=>{const flag=take(1)[0];if(flag>1)throw Error('OPTION_FLAG');return flag?f():null;};
    const variable=(max,text=false)=>{const n=u16();if(n>max)throw Error('FIELD_LENGTH');const v=take(n);return text?new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(v):hexlify(v);};
    const fields={};const field=(name,read)=>{const start=at;fields[name]=read();raw.fields.push(hexlify(b.slice(start,at)));};
    switch(type){
      case 'ObjectGenesis/1':field('publisher',word);field('salt',word);field('meaning',()=>option(word));break;
      case 'BindingSet/1':case 'BindingTombstone/1':
        for(const k of ['purpose','subject','fieldRole'])field(k,word);
        if(type==='BindingSet/1'){field('targetRecord',()=>option(ref));field('targetOccurrence',()=>option(occ));}
        field('predecessor',()=>option(occ));break;
      case 'DirectoryEntry/1':case 'DirectoryWhiteout/1':
        field('parent',ref);field('name',()=>variable(255,true));
        if(type==='DirectoryEntry/1'){field('child',ref);field('mountOverride',()=>option(ref));}break;
      case 'MountDescriptor/1':field('rootNode',ref);field('profileId',word);field('configRef',ref);break;
      case 'PublicFilesMountConfig/1':field('namespacePlan',()=>option(ref));field('contentPlan',ref);field('metadataPlan',()=>option(ref));field('propertyProfile',()=>option(ref));break;
      case 'ResolutionPlan/1':field('frame',()=>variable(4192));break;
      case 'ChunkTree/1':{
        const u32=()=>{const v=take(4);return v[0]*16777216+v[1]*65536+v[2]*256+v[3];};
        const u64=()=>{const v=take(8);let n=0n;for(const x of v)n=n*256n+BigInt(x);return n;};
        field('chunkSize',u32);field('chunkCount',u32);field('totalSize',u64);field('merkleRoot',word);break;
      }
      case 'RemovalMarker/1':field('entry',ref);break;
      case 'FileTagAssertion/1':field('tagId',word);field('target',ref);break;
      case 'FileRevision/1':{
        const flag=()=>{const v=take(1)[0];if(v>1)throw Error('BOOL_FLAG');return v===1;};
        field('node',ref);field('content',ref);field('mediaType',()=>variable(255,true));
        field('charset',()=>option(()=>variable(64,true)));field('executableHint',flag);
        field('parents',()=>{const n=u16();if(n>8)throw Error('PARENTS_MAX');return Array.from({length:n},ref);});break;
      }
    }
    if(at!==b.length)throw Error('TRAILING_BYTES');
    return {status:'ACCEPTED',type,fields,raw};
  }catch(error){return {status:'MALFORMED',reason:error.message,raw};}
}

// Portable literal B0 grammar, kept separate from descriptor-tree test decoder.
export function parsePlan(type,body){
  if(type?.toLowerCase()!==TYPES['ResolutionPlan/1'])return {code:1};
  if(typeof body!=='string'||!/^0x(?:[0-9a-f]{2})*$/i.test(body))return {code:2};
  const b=getBytes(body),u16=(b,i)=>b[i]*256+b[i+1];
  if(b.length<98||u16(b,0)!==b.length-2)return {code:2};
  const f=b.slice(2),n=u16(f,6);
  if(f.length!==96+64*n)return {code:2};
  if(f[0]!==1)return {code:3};const combiner=f[1];if(combiner>2)return {code:4};
  const entries=Array.from({length:n},(_,index)=>{const r=f.slice(96+64*index,160+64*index);return {principal:hexlify(r.slice(0,32)),tier:u16(r,32),flags:u16(r,34),floor:BigInt(hexlify(r.slice(36,44))),reserved:[...r.slice(44)],index};});
  if((f[2]&254)!==0||entries.some(e=>e.flags!==0))return {code:5};
  const k=u16(f,4);if(combiner===2?k===0||k>n:k!==0)return {code:6};
  if(n===0||n>64)return {code:7};
  const adjacent=entries.slice(1).map((e,i)=>[entries[i],e]);
  if(adjacent.some(([a,z])=>a.tier>z.tier||(a.tier===z.tier&&BigInt(a.principal)>=BigInt(z.principal))))return {code:8};
  if(new Set(entries.map(e=>e.principal)).size!==n)return {code:9};
  if(f[3]!==0||f.slice(8,32).some(Boolean)||entries.some(e=>e.reserved.some(Boolean)))return {code:10};
  if(combiner!==1&&entries.some(e=>e.tier!==0))return {code:11};
  if((f[2]&1)!==0&&adjacent.some(([a,z])=>a.tier===z.tier))return {code:12};
  if(entries.some(e=>e.floor!==0n))return {code:13};
  return {code:0,combiner,k,entries,purposeAndScope:hexlify(f.slice(32,64)),profile:hexlify(f.slice(64,96))};
}
