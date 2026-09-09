// Test-only publication encoder. No runtime Files decoder/resolver imports.
import assert from 'node:assert/strict';
import { publication, groupLeaf, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { ordinaryRecord } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
export { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
export const cat=(...parts)=>'0x'+parts.map(p=>p.replace(/^0x/,'')).join('');
export const hash=s=>keccak256(Buffer.from(s));
export const tag=(d,s)=>keccak256(cat(hash('efs2/'+d+'/1'),hash(s)));
export const A=word(0xffffffffffffn),B=word(0xbbbbbbbbbbbbbbbbn);
export const C=Object.freeze({profile:hash('efs.fixture.files-public-ascii-read/1'),planScope:hash('efs.fixture.files-plan-scope/1'),lens:hash('efs2/lens-semantics/b0/1'),charter:tag('purpose','objects/publisher-charter/1'),name:tag('purpose','files/name-slot/1')});
export const role=name=>tag('fieldrole',name);
export const position=(purpose,subject,r)=>keccak256(cat(hash('efs2/position/1'),purpose,subject,r));
export const key=(a,purpose,subject,r)=>keccak256(cat(hash('efs2/binding/1'),a,position(purpose,subject,r)));
export const scopeKey=(a,root)=>keccak256(cat(hash('efs2/vk/binding-scope/1'),a,C.name,root));
export const purposeScope=(kind,root)=>keccak256(cat(hash('efs2/plan-purpose/1'),tag('purpose','files/'+kind+'-plan/1'),keccak256(cat(C.planScope,C.profile,root))));
export const string=s=>cat(Buffer.byteLength(s).toString(16).padStart(4,'0'),Buffer.from(s).toString('hex'));
export const option=v=>v?cat('01',v):'0x00';
export function planBody(entries,{combiner=1,k=0,profile=C.lens,purpose=word(0)}={}) {
  const b=Buffer.alloc(98+64*entries.length);b.writeUInt16BE(b.length-2);b[2]=1;b[3]=combiner;b.writeUInt16BE(k,6);b.writeUInt16BE(entries.length,8);
  Buffer.from(purpose.slice(2),'hex').copy(b,34);Buffer.from(profile.slice(2),'hex').copy(b,66);
  entries.forEach((e,i)=>{Buffer.from(e.principal.slice(2),'hex').copy(b,98+64*i);b.writeUInt16BE(e.tier??0,130+64*i);});return '0x'+b.toString('hex');
}
export async function mountedFixture(lab) {
  const types=Object.fromEntries(lab.inputs.candidates.groups.flatMap(g=>g.members.map(m=>[m.descriptor.name,m.temporaryTypeSchemaId])));
  let nonce=30000;const heads=new Map(),leaves=[];
  const leaf=(name,body)=>{const x={typeId:types[name],body};leaves.push(x);return x;};
  const id=x=>ordinaryRecord(x.typeId,x.body);
  async function admit(xs,revisions=[],principal=A){const p=publication(xs,nonce++,{principal,revisions});assert.equal((await lab.publish(p)).receipt.status,'0x1');return p;}
  for(const g of lab.inputs.candidates.groups)await admit([groupLeaf(lab.inputs.meta,'0x'+g.groupHex)]);
  async function mutate(principal,purpose,subject,r,target,{tombstone=false,occurrence=false}={}){
    const k=key(principal,purpose,subject,r),prev=heads.get(k);
    const predecessor=prev?cat(prev.p.envelopeId,'0000'):null;
    const body=cat(purpose,subject,r,...(tombstone?[option(predecessor)]:[occurrence?'00':option(target),occurrence?option(target):'00',option(predecessor)]));
    const x=leaf(tombstone?'BindingTombstone/1':'BindingSet/1',body),p=await admit([x],[[0,prev?.revision??0]],principal);
    heads.set(k,{p,revision:(prev?.revision??0)+1});return p;
  }
  async function object(label,meaning='file',{charter=true,publisher=A,firstTombstone=false}={}){
    const x=leaf('ObjectGenesis/1',cat(publisher,hash('files-reader-fixture/salt/'+label),option(hash('efs2/files/meaning/'+meaning+'/1'))));await admit([x]);const node=id(x);
    if(charter||firstTombstone)await mutate(publisher,C.charter,node,word(1),node,{tombstone:firstTombstone});return node;
  }
  const root=await object('trip','directory'),fileA=await object('file-a'),fileB=await object('file-b');
  const plans={},mounts={};
  async function mount(root,view='aFirst',{file=false,profile=C.profile,namespacePurpose,contentPurpose,metadata=null,property=null,namespacePresent=!file}={}){
    const sources=view==='aFirst'?[{principal:A,tier:0},{principal:B,tier:1}]:view==='bFirst'?[{principal:B,tier:0},{principal:A,tier:1}]:[{principal:A},{principal:B}];
    const ns=leaf('ResolutionPlan/1',planBody(sources,{combiner:view==='exact'?0:1,purpose:namespacePurpose??purposeScope('namespace',root)}));
    const content=leaf('ResolutionPlan/1',planBody([{principal:A}],{purpose:contentPurpose??purposeScope('content',root)}));
    await admit([ns,content]);
    const config=leaf('PublicFilesMountConfig/1',cat(option(namespacePresent?id(ns):null),id(content),option(metadata),option(property)));await admit([config]);
    const m=leaf('MountDescriptor/1',cat(root,profile,id(config)));await admit([m]);return {id:id(m),plan:id(ns),config:id(config),content:id(content)};
  }
  for(const v of ['aFirst','bFirst','exact']){const m=await mount(root,v);mounts[v]=m.id;plans[v]=m.plan;}
  async function claim(principal,name,child=fileA,{parent=root,encodedName=name,override=null,target=null,tombstone=false,whiteout=false,occurrence=false}={}){
    if(tombstone)return mutate(principal,C.name,parent,role(name),null,{tombstone:true});
    let targetId=target;
    if(!targetId){const e=leaf(whiteout?'DirectoryWhiteout/1':'DirectoryEntry/1',cat(parent,string(encodedName),...(whiteout?[]:[child,option(override)])));const p=await admit([e]);targetId=occurrence?cat(p.envelopeId,'0000'):id(e);}
    await mutate(principal,C.name,parent,role(name),targetId,{occurrence});return targetId;
  }
  const entryA=await claim(A,'note.txt',fileA);
  return {lab,types,leaves,heads,leaf,id,admit,object,mutate,mount,claim,root,fileA,fileB,entryA,mounts,plans};
}
