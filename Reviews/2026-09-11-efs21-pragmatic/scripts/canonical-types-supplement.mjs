// Additive review-boundary corpus; original 22-group/30-body golden is untouched.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {encodeBlob,encodeGroup,derive} from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import {decodeBody} from '../../2026-09-05-c0-core/reference/record-body.mjs';
const base={meaning:'Supplemental canonical registry boundary corpus',specDigest:null,qualifier:'00'.repeat(32),roles:[],indexes:[],constraints:[]};
const schema=(name,field,extra={})=>({...base,name:'Supplement/'+name,fields:[field],...extra});
const bool=name=>({name,kind:'BOOL'}),uint=name=>({name,kind:'UINT',width:1});
const array=(name,max,inner)=>({name,kind:'ARRAY',max,inner});
const struct=(name,members)=>({name,kind:'STRUCT',members});
const option=(name,inner)=>({name,kind:'OPTION',inner});
const range=(min,max,fieldIdx=0)=>({kind:1,fieldIdx,min,max});
const role={name:'target',targetClass:1,expectedType:'ANY',fieldIdx:0};
const members64=Array.from({length:64},(_,i)=>bool('f'+String(i).padStart(2,'0')));
const valid={
 digest:schema('Digest', {name:'digest',kind:'DIGEST'}),
 depth4:schema('Depth4',array('items',2,struct('',[array('flags',2,bool(''))]))),
 struct64:schema('Struct64',struct('item',members64)),
 array1024:schema('Array1024',array('items',1024,uint(''))),
 range:schema('Range',uint('value'),{constraints:[range(1,3)]}),
};
const invalid={
 depth5:schema('Depth5',array('items',2,struct('',[array('flags',2,option('',bool('')))]))),
 array1025:schema('Array1025',array('items',1025,uint(''))),
 struct0:schema('Struct0',struct('item',[])),
 struct65:schema('Struct65',struct('item',[...members64,bool('f64')])),
 constraintRange:schema('BadRange',uint('value'),{constraints:[range(4,3)]}),
 constraintField:schema('BadField',uint('value'),{constraints:[range(1,3,1)]}),
 constraintKind:schema('BadKind',uint('value'),{constraints:[{kind:99,fieldIdx:0}]}),
 constraintBool:schema('BoolRange',bool('value'),{constraints:[range(1,3)]}),
 nestedRefStruct:schema('NestedRefStruct',array('items',1,struct('',[{name:'ref',kind:'REF'}])),{roles:[role]}),
 nestedRefOption:schema('NestedRefOption',option('value',option('',{name:'',kind:'REF'})),{roles:[role]}),
 nestedRefNamed:schema('NestedRefNamed',option('value',{name:'notAnonymous',kind:'REF'}),{roles:[role]}),
};
export function supplement(){
 const groups=Object.entries({...valid,...invalid}).map(([name,member])=>{
  const raw=encodeGroup([member]),identity=derive(raw);let parsed=null,error=null;
  try{parsed=parseGroup(raw);}catch(e){error=e.message;}
  const accepted=name in valid;assert.equal(!!parsed,accepted,'independent schema oracle '+name);
  return {name,raw:E.hexlify(raw),...identity,blobs:[E.hexlify(encodeBlob(member))],members:[member],valid:accepted,oracleError:error};
 });
 const cases=[
  ['unsupportedDigest','digest','0xffff0000',false],['digest17','digest','0x00110014'+'ab'.repeat(20),true],
  ['depth4','depth4','0x0001000101',true],['depth4Empty','depth4','0x0000',true],
  ['depth4InnerCount','depth4','0x00010003010101',false],['depth4OuterCount','depth4','0x0003',false],['depth4Truncated','depth4','0x00010001',false],
  ['struct64','struct64','0x'+'01'.repeat(64),true],['structShort','struct64','0x'+'01'.repeat(63),false],['structTrailing','struct64','0x'+'01'.repeat(65),false],
  ['array1024','array1024','0x0400'+'01'.repeat(1024),true],['array1025','array1024','0x0401'+'01'.repeat(1025),false],['arrayEmpty','array1024','0x0000',true],
  ['rangeMin','range','0x01',true],['rangeBelow','range','0x00',false],
 ];
 const outcomes=cases.map(([name,group,body,valid])=>{
  const g=groups.find(g=>g.name===group);let accepted=true,error=null;
  try{decodeBody(parseGroup(E.getBytes(g.raw)).members[0],body);}catch(e){accepted=false;error=e.code;}
  assert.equal(accepted,valid,'independent body oracle '+name);
  return {name,group,body,valid,error,recordId:E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),g.ids[0],E.keccak256(body)]))};
 });
 return {format:'efs21-canonical-types-supplement/1',groups,outcomes};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const value=JSON.stringify(supplement(),null,2)+'\n',path=fileURLToPath(new URL('../contracts/test/fixtures/canonical-types-supplement.json',import.meta.url));
 if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8'),value);else writeFileSync(path,value);
 console.log(JSON.stringify({groups:supplement().groups.length,outcomes:supplement().outcomes.length,hash:E.keccak256(E.toUtf8Bytes(value))}));
}
