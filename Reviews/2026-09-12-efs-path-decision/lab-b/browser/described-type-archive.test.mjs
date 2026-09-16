import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadEthers} from '../script/compact-environment.mjs';
import * as reader from './described-type-reader.mjs';
const e=await loadEthers(),vectors=JSON.parse(await readFile(new URL('../core-closeout-types-20260915/vectors.json',import.meta.url)));
const api=await import('./described-type-archive.mjs').catch(x=>{if(x.code==='ERR_MODULE_NOT_FOUND')return {};throw x;});
const wrapper=JSON.parse(await readFile(`${process.env.FOUNDRY_OUT}/DescribedTypeProfile.sol/DescribedTypeRule.json`));
const address=e.getAddress('0x'+'12'.repeat(20));
function sidecar(v=vectors.vectors[1]){return {typeId:v.typeId,present:true,shape:v.shape,ruleId:vectors.wrapperRuntimeHash,refTypes:v.refTypes,ruleCode:wrapper.deployedBytecode.object,
  described:{status:2,descriptor:v.descriptor,declaration:v.declarationSignature,wrapperInitcode:wrapper.bytecode.object,wrapperAddress:address,
    chainId:'31337',registry:address,custom:e.ZeroAddress,allowedLedger:e.ZeroAddress,bindingId:e.ZeroHash,bindingPreimage:'0x',bindingSignature:'0x',customCode:'0x'}};}
test('sidecar verifies meaning separately from opaque references and joins every retained authorization byte',()=>{
  assert.equal(typeof api.verifyDescribedSidecar,'function');
  const t=sidecar();assert.equal(api.verifyDescribedSidecar(e,t).coverage,'COMPLETE');
  for(const edit of [t=>t.described.descriptor+='00',t=>t.described.declaration=vectors.vectors[2].declarationSignature,t=>t.ruleCode='0x00',t=>t.described.wrapperInitcode='0x00',
    t=>t.described.custom=address,t=>t.described.bindingId=e.id('changed'),t=>t.refTypes=[e.id('changed')],t=>t.shape=e.id('changed')]){
    const bad=structuredClone(t);edit(bad);assert.throws(()=>api.verifyDescribedSidecar(e,bad));
  }
  delete t.described;assert.equal(api.verifyDescribedSidecar(e,t).coverage,'PARTIAL');
  t.described={status:0};assert.equal(api.verifyDescribedSidecar(e,t).coverage,'OPAQUE_LEGACY');
  const future=sidecar(vectors.invalidDescriptors[0]);assert.equal(api.verifyDescribedSidecar(e,future).coverage,'UNSUPPORTED');
});
test('consumer exact projection needs approval and explicit rich loss; reads never authorize old writes',()=>{
  assert.equal(typeof api.projectDescribedText,'function');
  const [v1,additive,rich,restricted]=vectors.vectors.slice(1,5);
  const decoded=v=>reader.decodeDescribedBody(e,reader.decodeDescribedType(e,v.descriptor,vectors.wrapperRuntimeHash),v.bodies.at(-1).body);
  const field=e.toBeHex(1,32),view=e.id('consumer/text-view'),p1={sourceType:v1.typeId,targetView:view,projectionId:e.id('consumer/v1'),textField:field};
  const p11={...p1,sourceType:additive.typeId,projectionId:e.id('consumer/v11')};
  const oldDisplay=({text})=>'display: '+text;
  assert.equal(oldDisplay(api.projectDescribedText(e,decoded(additive),{targetView:view,approved:[p1,p11]}).value),'display: hi');
  assert.equal(api.projectDescribedText(e,decoded(additive),{targetView:view,approved:[p1,p11]}).omitted.length,1);
  assert.throws(()=>api.projectDescribedText(e,decoded(additive),{targetView:view,approved:[p1]}),/UNAPPROVED/);
  const adapter={...p1,sourceType:rich.typeId,projectionId:e.id('consumer/rich-to-text'),adapter:'drop-emphasis',loss:'emphasis discarded'};
  assert.throws(()=>api.projectDescribedText(e,decoded(rich),{targetView:view,approved:[adapter]}),/LOSS/);
  assert.equal(api.projectDescribedText(e,decoded(rich),{targetView:view,approved:[adapter],adapter:'drop-emphasis',acceptLoss:true}).loss,'emphasis discarded');
  assert.throws(()=>api.projectDescribedText(e,decoded(restricted),{targetView:view,approved:[p1],compatibleWith:v1.typeId}),/UNAPPROVED/);
  for(const newer of [additive,rich,restricted])assert.throws(()=>api.assertExactWriter(newer.typeId,[v1.typeId]),/WRITER/);
  assert.equal(api.assertExactWriter(v1.typeId,[v1.typeId]),true);
});
