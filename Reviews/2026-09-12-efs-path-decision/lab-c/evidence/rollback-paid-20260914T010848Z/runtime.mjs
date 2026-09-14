// Root-authorized C-only scratch adapter. Complete substitution, no masks or chain reads.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {AbiCoder,keccak256,toUtf8Bytes}=require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
const abi=AbiCoder.defaultAbiCoder(),bytes=x=>(x.length-2)/2;
const empty=x=>assert.deepEqual(x??{},{});
export function instantiate({artifact,sourceName,contractName,immutableValues,libraryAddress,constructorTypes,constructorArgs}){
 assert.deepEqual(artifact.metadata.settings.compilationTarget,{[sourceName]:contractName});empty(artifact.metadata.settings.libraries);
 const ast=artifact.ast;assert.equal(ast.nodeType,'SourceUnit');assert.equal(ast.absolutePath,sourceName);
 const targets=ast.nodes.filter(n=>n.nodeType==='ContractDefinition'&&n.name===contractName);assert.equal(targets.length,1);
 const target=targets[0],declarations=target.nodes.filter(n=>n.nodeType==='VariableDeclaration'&&n.stateVariable&&n.mutability==='immutable');
 const names=new Map(declarations.map(n=>[String(n.id),n.name]));assert.equal(new Set(names.values()).size,names.size);
 const expectedNames=contractName==='IndexModule'?['deployer','poisonConcept']:contractName==='Ledger'?['index','indexCodehash','realmId']:contractName==='ImportLib'?['library_deploy_address']:[];
 assert.deepEqual(Object.keys(immutableValues).sort(),expectedNames.slice().sort(),'immutable value inventory');
 if(contractName==='ImportLib'){assert.equal(target.contractKind,'library');assert.equal(names.size,0);names.set('library_deploy_address','library_deploy_address');}
 else assert.deepEqual([...names.values()].sort(),expectedNames.slice().sort(),'AST immutable inventory');
 const refs=artifact.deployedBytecode.immutableReferences??{};assert.deepEqual(Object.keys(refs).sort(),[...names.keys()].sort(),'compiler immutable reference inventory');
 for(const value of Object.values(immutableValues))assert.match(value,/^0x[0-9a-fA-F]{64}$/);
 const actualCtor=artifact.abi.find(x=>x.type==='constructor')?.inputs.map(x=>x.type)??[];assert.deepEqual(actualCtor,constructorTypes);
 const patches=[];
 const patchSection=(section,includeImmutables)=>{
  const original=artifact[section].object;assert.equal(typeof original,'string');assert(original.startsWith('0x')&&original.length%2===0);
  const changes=[];const links=artifact[section].linkReferences??{};
  if(contractName==='Ledger'){
   assert.deepEqual(Object.keys(links),['src/ImportLib.sol']);assert.deepEqual(Object.keys(links['src/ImportLib.sol']),['ImportLib']);
   const spans=links['src/ImportLib.sol'].ImportLib;assert.equal(spans.length,1);assert.match(libraryAddress,/^0x[0-9a-fA-F]{40}$/);
   for(const span of spans){assert.equal(span.length,20);changes.push({...span,name:'ImportLib',value:libraryAddress,kind:'link'});}
  }else empty(links);
  if(includeImmutables)for(const [id,spans]of Object.entries(refs)){
   assert(Array.isArray(spans)&&spans.length>0);if(id==='library_deploy_address'){assert.equal(spans.length,1);assert.equal(spans[0].start,39,'retained compiler self-address location');}
   for(const span of spans){assert.equal(span.length,32);changes.push({...span,name:names.get(id),astId:id,value:immutableValues[names.get(id)],kind:'immutable'});}
  }
  changes.sort((a,b)=>a.start-b.start);let result=original;
  for(const [i,c]of changes.entries()){
   assert(Number.isSafeInteger(c.start)&&c.start>=0&&c.start+c.length<=bytes(original),'patch range');if(i)assert(changes[i-1].start+changes[i-1].length<=c.start,'patch overlap');
   const from=2+c.start*2,to=from+c.length*2,placeholder=original.slice(from,to);
   if(c.kind==='link')assert.equal(placeholder,'__$'+keccak256(toUtf8Bytes('src/ImportLib.sol:ImportLib')).slice(2,36)+'$__','exact qualified library placeholder');else assert.equal(placeholder,'00'.repeat(32),'nonzero immutable placeholder');
   assert.equal(c.value.length,2+c.length*2);result=result.slice(0,from)+c.value.slice(2).toLowerCase()+result.slice(to);patches.push({section,...c,original:placeholder});
  }
  assert.match(result,/^0x(?:[0-9a-fA-F]{2})+$/,'no unresolved bytecode placeholder');
  // Every byte outside reviewed spans is literally preserved, not excluded from comparison.
  let cursor=2;for(const c of changes){const stop=2+c.start*2;assert.equal(result.slice(cursor,stop),original.slice(cursor,stop));cursor=stop+c.length*2;}assert.equal(result.slice(cursor),original.slice(cursor));
  return result.toLowerCase();
 };
 const creation=patchSection('bytecode',false),runtime=patchSection('deployedBytecode',true),constructorSuffix=abi.encode(constructorTypes,constructorArgs).toLowerCase(),initcode=creation+constructorSuffix.slice(2);
 return {constructorTypes,constructorArgs,constructorSuffix,patches,initcode,runtime,initcodeHash:keccak256(initcode),initcodeBytes:bytes(initcode),runtimeCodehash:keccak256(runtime),runtimeBytes:bytes(runtime)};
}
