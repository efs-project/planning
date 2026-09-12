// Actual frozen and candidate helper contracts; public ABI byte/error differential, not a second validator.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {withUpgrade} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {encodeGroup} from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import {AbiCoder,Interface,keccak256,toBeHex,ZeroHash} from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
assert(process.env.EFS_TEST_BUILD_ROOT,'isolated canonical candidate build required');
const output=new URL('../evidence/body-copy-helper-differential.json',import.meta.url);assert(!existsSync(output));
const frozen=JSON.parse(readFileSync(new URL('../evidence/body-copy-control-helper.json',import.meta.url)));
const iface=new Interface(frozen.abi),abi=AbiCoder.defaultAbiCoder();
const schema='tuple(bytes32 typeId,bytes32 blobHash,uint32 maxBodyBytes,tuple(uint8 kind,uint8 innerKind,uint16 widthOrMax,uint32 maxBodyBytes,uint32 references,uint32 skipReads,bytes descriptor)[] fields,tuple(uint8 targetClass,bytes32 expectedType,uint8 fieldIdx)[] roles,tuple(uint8 kind,uint8 target)[] indexes,tuple(uint8 kind,uint8 fieldIdx,int256 min,int256 max)[] constraints)';
const author='0x'+'ff'.repeat(32),ids=[ZeroHash,ZeroHash,ZeroHash],cases=[],groups=[];
function candidateBody(s,set){return '0x'+s.fields.map((f,i)=>{
 const k=Number(f.kind),w=Number(f.widthOrMax);
 if(k===1)return '00';
 if(k>=2&&k<=4){let n=0n;for(const c of s.constraints)if(c.kind===1n&&c.fieldIdx===BigInt(i)&&c.min>0n)n=c.min;return toBeHex(n,w).slice(2);}
 if(k===5||k===6)return w===0?'0000':'000178';
 if(k===7||k===9)return author.slice(2);
 if(k===8)return author.slice(2)+'0011';if(k===10)return '00120020'+author.slice(2);if(k===11)return '0000';
 if(k===14)return set&&i===3?'01'+author.slice(2):'00';throw Error('uncovered retained field '+k);
}).join('');}
let cleanup;
const result=await withUpgrade(async lab=>{
 cleanup=lab.cleanup;const fresh=lab.expected.execution.helper;
 const deployed=await lab.receipt(await lab.send(frozen.creation),'frozen helper differential deployment');assert.equal(deployed.status,'0x1');
 const old=deployed.contractAddress;assert.equal(await lab.rpc('eth_getCode',[old,'latest']),frozen.runtime);
 const currentCode=await lab.rpc('eth_getCode',[fresh,'latest']);assert.notEqual(currentCode,frozen.runtime);
 async function invoke(to,data){try{return{ok:true,bytes:await lab.rpc('eth_call',[{to,data},'latest'])};}catch(e){assert.match(e.data??'',/^0x[0-9a-f]+$/);return{ok:false,bytes:e.data};}}
 async function compile(name,raw){const data=iface.encodeFunctionData('compileGroup',[raw]),a=await invoke(old,data),b=await invoke(fresh,data);assert(a.ok);assert.deepEqual(b,a,name+' exact caches');groups.push({name,raw,data,result:a});return iface.decodeFunctionResult('compileGroup',a.bytes)[0];}
 async function prepare(name,type,body,expected=true,cache=type.cacheBytes){
  const rid=keccak256(abi.encode(['bytes32','bytes32','bytes32'],[keccak256(Buffer.from('efs2/record/1')),type.typeId,keccak256(body)]));
  const outputs=[];
  for(const bodyOnly of [false,true]){const data=iface.encodeFunctionData('prepareRecord',[cache,type.typeId,body,rid,author,ids,bodyOnly]),a=await invoke(old,data),b=await invoke(fresh,data);assert.deepEqual(b,a,name+' bodyOnly='+bodyOnly);assert.equal(a.ok,expected,name);cases.push({name,bodyOnly,data,result:a});outputs.push(a);}
  if(expected){const full=iface.decodeFunctionResult('prepareRecord',outputs[0].bytes)[0],only=iface.decodeFunctionResult('prepareRecord',outputs[1].bytes)[0];assert.deepEqual(only.references.toArray(true),full.references.toArray(true));assert.equal(only.occurrenceKeys.length,0);assert.equal(only.effect.kind,0n);}
 }
 const retained=JSON.parse(readFileSync(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',import.meta.url)));
 for(const [g,group]of retained.groups.entries()){
  const compiled=await compile('retained-'+g,'0x'+group.groupHex);
  if(g===1)for(let i=0;i<3;i++)ids[i]=compiled.types[i].typeId;
  for(const [i,type]of compiled.types.entries()){const s=abi.decode([schema],type.cacheBytes)[0],body=candidateBody(s,type.typeId===ids[0]);await prepare('retained-'+g+'-'+i,type,body);await prepare('retained-'+g+'-'+i+'-trailing',type,body+'ff',false);}
 }
 const base={name:'BodyCopyNested/1',meaning:'',qualifier:'00'.repeat(32),roles:[],indexes:[],constraints:[]};
 const specs=[
  {...base,fields:[{name:'f',kind:'ARRAY',max:2,inner:{name:'',kind:'STRUCT',members:[{name:'a',kind:'BOOL'},{name:'b',kind:'OPTION',inner:{name:'',kind:'UINT',width:2}}]}}]},
  {...base,name:'BodyCopyMap/1',fields:[{name:'f',kind:'MAP',max:2,key:{name:'',kind:'STRING',max:3},value:{name:'',kind:'BOOL'}}]},
  {...base,name:'BodyCopyRange/1',fields:[{name:'f',kind:'INT',width:1}],constraints:[{kind:1,fieldIdx:0,min:-2,max:2}]}
 ];
 const compiled=await compile('nested-map-constraint','0x'+encodeGroup(specs).toString('hex'));
 const inputs=[['0002010112340000','0000'],['000200017a010002616100','0000'],['fe','02']];
 const bad=[['0003','00010102','00010200','0001010112','0000ff'],['0002000261610000017a01','000200017a0000017a01','0003','000100017a02','00010002c08000'],['fd','03']];
 for(let i=0;i<3;i++){for(const body of inputs[i])await prepare('custom-'+i+'-'+body,compiled.types[i],'0x'+body);for(const body of bad[i])await prepare('custom-'+i+'-'+body,compiled.types[i],'0x'+body,false);}
 // Forged descriptor cache is a private helper input, not an admissible registered Type.
 const forged=abi.decode([schema],compiled.types[0].cacheBytes)[0].toArray(true);forged[3][0][6]='0x000166ff';
 await prepare('private-forged-descriptor',compiled.types[0],'0x0000',false,abi.encode([schema],[forged]));
 return{controlCommit:frozen.commit,old,fresh,oldRuntime:frozen.runtime,newRuntime:currentCode,deployed,groups,cases,resources:lab.resources};
},{profile:'base',watchdogMs:180000});
result.cleanup=cleanup;assert(cleanup.stopped&&cleanup.cacheRemoved);
writeFileSync(output,JSON.stringify(result,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n',{flag:'wx'});
console.log('exact public helper cases',cases.length,'groups',groups.length,'cleanup',cleanup);
