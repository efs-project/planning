// Frozen declarative inputs; independent parser/body reader remain unchanged.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {encodeBlob,encodeGroup,derive} from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import {decodeBody} from '../../2026-09-05-c0-core/reference/record-body.mjs';
export const abi=E.AbiCoder.defaultAbiCoder();
const base={meaning:'Disposable canonical native Files bridge',specDigest:null,qualifier:'00'.repeat(32),roles:[],indexes:[],constraints:[]};
const schema=(name,fields,extra={})=>({...base,name,fields,...extra});
export const descriptors={
  defaults:[schema('CanonicalNativeQuote/1',[{name:'value',kind:'UINT',width:32}]),schema('CanonicalNativeBytes/1',[{name:'payload',kind:'BYTES',max:4094}])],
  bool:[schema('Bool/1',[{name:'flag',kind:'BOOL'}])],
  constrained:[schema('Constrained/1',[{name:'number',kind:'INT',width:2}],{constraints:[{kind:1,fieldIdx:0,min:-3,max:7}]})],
  option:[schema('Option/1',[{name:'value',kind:'OPTION',inner:{name:'',kind:'UINT',width:1}}])],
  array:[schema('Array/1',[{name:'values',kind:'ARRAY',max:2,inner:{name:'',kind:'UINT',width:1}}])],
  map:[schema('Map/1',[{name:'entries',kind:'MAP',max:2,key:{name:'',kind:'UINT',width:1},value:{name:'',kind:'BOOL'}}])],
  text:[schema('Text/1',[{name:'text',kind:'STRING',max:16}])],
  digest:[schema('Digest/1',[{name:'digest',kind:'DIGEST'}])],
  principal:[schema('PrincipalClaim/1',[{name:'claim',kind:'PRINCIPAL'}])],
  struct:[schema('Struct/1',[{name:'tuple',kind:'STRUCT',members:[{name:'flag',kind:'BOOL'},{name:'number',kind:'UINT',width:2}]}])],
  index:[schema('Index/1',[{name:'value',kind:'UINT',width:32}],{indexes:[{kind:1,target:0}]})],
  digestIndex:[schema('DigestIndex/1',[{name:'digest',kind:'DIGEST'}],{indexes:[{kind:3,target:0}]})],
};
for(const [name,field,cls,expected]of [
  ['ref',{name:'ref',kind:'REF'},1,'ANY'],['self',{name:'ref',kind:'REF'},1,'SELF'],
  ['external',{name:'ref',kind:'REF'},1,'12'.repeat(32)],['occref',{name:'ref',kind:'OCCREF'},4,'ANY'],
  ['optionalRef',{name:'ref',kind:'OPTION',inner:{name:'',kind:'REF'}},1,'ANY'],
  ['zeroArrayRef',{name:'ref',kind:'ARRAY',max:0,inner:{name:'',kind:'REF'}},1,'ANY'],
])descriptors[name]=[schema(name+'/1',[field],{roles:[{name:'target',targetClass:cls,expectedType:expected,fieldIdx:0}]})];
descriptors.sibling=[schema('Sibling/1',[{name:'ref',kind:'REF'}],{roles:[{name:'target',targetClass:1,expectedType:'GROUP_REF:1',fieldIdx:0}]}),...descriptors.bool];
descriptors.secondUnsupported=[...descriptors.bool,...descriptors.optionalRef];
descriptors.boundary=[schema('CacheBoundary/1',Array.from({length:64},(_,i)=>({name:`flag${String(i).padStart(2,'0')}${'a'.repeat(58)}`,kind:'BOOL'})),{meaning:''})];
descriptors.aggregate=Array.from({length:16},(_,i)=>schema(`G${String(i).padStart(2,'0')}`,Array.from({length:64},(_,j)=>({name:`f${String(j).padStart(2,'0')}`,kind:'BOOL'})),{meaning:''}));
export const frame=payload=>E.hexlify(E.concat([E.toBeHex(E.getBytes(payload).length,2),payload]));
export const cases=[
 ['quote0','defaults',0,abi.encode(['uint256'],[0]),true],['quote3000','defaults',0,abi.encode(['uint256'],[3000]),true],
 ['uintMax','defaults',0,abi.encode(['uint256'],[E.MaxUint256]),true],['shortUint','defaults',0,'0x01',false],['trailingUint','defaults',0,'0x'+'00'.repeat(33),false],
 ['emptyBytes','defaults',1,'0x0000',true],['bytes','defaults',1,frame('0xef008000'),true],['badBytes','defaults',1,'0x0002ff',false],['trailingBytes','defaults',1,'0x000001',false],
 ['bool','bool',0,'0x01',true],['bool2','bool',0,'0x02',false],['minInt','constrained',0,'0xfffd',true],['lowInt','constrained',0,'0xfffc',false],['maxInt','constrained',0,'0x0007',true],['highInt','constrained',0,'0x0008',false],
 ['optionAbsent','option',0,'0x00',true],['optionPresent','option',0,'0x0109',true],['option2','option',0,'0x02',false],
 ['array','array',0,'0x00020102',true],['arrayTooMany','array',0,'0x0003010203',false],
 ['map','map',0,'0x000201000201',true],['mapDuplicate','map',0,'0x000201000101',false],['mapUnordered','map',0,'0x000202000101',false],
 ['text','text',0,'0x00026869',true],['invalidUtf8','text',0,'0x0001ff',false],
 ['digest','digest',0,'0x00120020'+'ab'.repeat(32),true],['badDigest','digest',0,'0x00120001ab',false],
 ['principalClaim','principal',0,'0x'+'ff'.repeat(32),true],['struct','struct',0,'0x010102',true],['shortStruct','struct',0,'0x01',false],
];
export function fixtures(){
 const groups=Object.fromEntries(Object.entries(descriptors).map(([name,members])=>{
  const raw=encodeGroup(members),ids=derive(raw);const parsed=parseGroup(raw,{knownTypes:name==='external'?['0x'+'12'.repeat(32)]:[]});
  assert.equal(parsed.groupHash,ids.groupHash);assert.deepEqual(parsed.ids,ids.ids);
  return [name,{raw:E.hexlify(raw),...ids,members,blobs:members.map(x=>E.hexlify(encodeBlob(x)))}];
 }));
 assert.equal(E.getBytes(groups.boundary.raw).length,4356);assert.equal(E.getBytes(groups.aggregate.raw).length,7010);
 const outcomes=cases.map(([name,group,member,body,valid])=>{
  const g=groups[group];let accepted=true,error=null;
  try{decodeBody(parseGroup(E.getBytes(g.raw)).members[member],body);}catch(e){accepted=false;error=e.code;}
  assert.equal(accepted,valid,name);
  return {name,group,member,body,valid,error,recordId:E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),g.ids[member],E.keccak256(body)]))};
 });
 const inventory=JSON.parse(readFileSync(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',import.meta.url)));
 const kernel=derive(Buffer.from(inventory.groups[1].groupHex,'hex')).ids.slice(0,3);
 const intrinsic=derive(encodeGroup([schema('TypeSchemaGroup/1',[{name:'groupBytes',kind:'BYTES',max:8190}],{meaning:''})])).ids[0];
 return {format:'efs21-canonical-types-fixtures/1',groups,outcomes,reserved:[...kernel,intrinsic]};
}
export function generate(check=false){
 const f=fixtures(),root=fileURLToPath(new URL('../contracts/test/fixtures/',import.meta.url));
 const outputs={
  [root+'canonical-types-golden.json']:JSON.stringify(f,null,2)+'\n',
  [root+'CanonicalFixtures.sol']:'// SPDX-License-Identifier: MIT\npragma solidity 0.8.30;\n// Generated from canonical-types-fixtures.mjs; independent parser/body oracle checked.\nlibrary CanonicalFixtures {\n'+Object.entries(f.groups).map(([name,g])=>`    function group_${name}() internal pure returns (bytes memory) { return hex"${g.raw.slice(2)}"; }`).join('\n')+'\n'+f.reserved.map((id,i)=>`    bytes32 internal constant RESERVED_${i} = ${id};`).join('\n')+'\n}\n'
 };
 for(const [path,value]of Object.entries(outputs)){if(check)assert.equal(readFileSync(path,'utf8'),value,path);else writeFileSync(path,value);}
 console.log(JSON.stringify({groups:Object.keys(f.groups).length,outcomes:f.outcomes.length,goldenHash:E.keccak256(E.toUtf8Bytes(outputs[root+'canonical-types-golden.json']))}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)generate(process.argv.includes('--check'));
