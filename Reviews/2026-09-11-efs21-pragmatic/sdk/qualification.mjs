import {SOURCE_GRAPHS} from './source-graphs.mjs';

export function sourceProfile(selection) {
  const profile=SOURCE_GRAPHS[selection];
  if(!profile)throw Error('Missing or unsupported source-backed dependency profile');
  return profile;
}
export function graphIdentity(E,config) {
  const profile=sourceProfile(config.dependencyProfile);
  if(config.profileId!==profile.id||!config.graph)throw Error('Source profile or dependency graph missing/mismatched');
  return E.keccak256(E.toUtf8Bytes(JSON.stringify({profileId:profile.id,graph:config.graph,bytesType:config.bytesType,quoteType:config.quoteType,rawType:config.rawType??null})));
}
export async function qualifyGraph(E,config,rpc,blockNumber) {
  const profile=sourceProfile(config.dependencyProfile),graphId=graphIdentity(E,config),g=config.graph;
  const registry=profile.templates.ExpandedTypeRegistry?'ExpandedTypeRegistry':'ExactTypeRegistry';
  const roles={NativeKernel:profile.targetName,NavigationIndex:'NavigationIndex',types:registry,BytesValidator:'BytesValidator',Uint256Validator:'Uint256Validator'};
  if(profile.templates.DiscoveryIndex)roles.DiscoveryIndex='DiscoveryIndex';
  if(profile.templates.BodyWriter)roles.BodyWriter='BodyWriter';
  if(profile.templates.RawBytesValidator)roles.RawBytesValidator='RawBytesValidator';
  if(profile.split){roles.NativeRecordKernel='NativeRecordKernel';roles.RecordInventoryIndex='RecordInventoryIndex';}
  if(Object.keys(g).length!==Object.keys(roles).length||g.NativeKernel!==config.kernel)throw Error('Dependency graph shape mismatch');
  for(const role of Object.keys(roles))if(!E.isAddress(g[role]))throw Error('Malformed dependency address: '+role);
  if(new Set(Object.values(g).map(a=>a.toLowerCase())).size!==Object.keys(g).length)throw Error('Dependency accounts must be distinct');
  const code=Object.fromEntries(await Promise.all(Object.keys(roles).map(async role=>[role,await rpc('eth_getCode',[g[role],blockNumber])])));
  const hash=Object.fromEntries(Object.entries(code).map(([role,value])=>[role,E.keccak256(value)]));
  const owner=profile.split?g.NativeRecordKernel:g.NativeKernel;
  const values={NativeKernel:{navigation:g.NavigationIndex,types:g.types,discovery:g.DiscoveryIndex,discoveryCodeHash:hash.DiscoveryIndex,bodyWriter:g.BodyWriter,bodyWriterCodeHash:hash.BodyWriter,recordKernel:g.NativeRecordKernel,recordInventory:g.RecordInventoryIndex,recordKernelCodeHash:hash.NativeRecordKernel,navigationCodeHash:hash.NavigationIndex},NativeRecordKernel:{types:g.types,recordInventory:g.RecordInventoryIndex,bodyWriter:g.BodyWriter,bodyWriterCodeHash:hash.BodyWriter,inventoryCodeHash:hash.RecordInventoryIndex},NavigationIndex:{kernel:g.NativeKernel,recordInventory:g.RecordInventoryIndex},RecordInventoryIndex:{kernel:owner},DiscoveryIndex:{kernel:g.NativeKernel,navigation:g.NavigationIndex,types:g.types},BodyWriter:{kernel:owner}};
  for(const [role,name] of Object.entries(roles)){
    const template=profile.templates[name];let expected=template.runtime;
    for(const [key,refs] of Object.entries(template.immutables)){
      const value=values[role]?.[key];if(!value)throw Error(`Unmapped compiler immutable ${role}.${key}`);
      for(const ref of refs){if(ref.length!==32)throw Error('Unexpected compiler immutable width');const start=2+ref.start*2;expected=expected.slice(0,start)+E.zeroPadValue(value,32).slice(2)+expected.slice(start+64);}
    }
    if(code[role]!==expected)throw Error('Source-backed runtime identity mismatch: '+role);
  }
  const links=[['NativeKernel','navigation','NavigationIndex'],['NativeKernel','types','types'],['NavigationIndex','kernel','NativeKernel']];
  if(roles.DiscoveryIndex)links.push(['NativeKernel','discovery','DiscoveryIndex'],['DiscoveryIndex','kernel','NativeKernel'],['DiscoveryIndex','navigation','NavigationIndex'],['DiscoveryIndex','types','types']);
  if(profile.split)links.push(['NativeKernel','recordKernel','NativeRecordKernel'],['NativeKernel','recordInventory','RecordInventoryIndex'],['NativeRecordKernel','types','types'],['NativeRecordKernel','bodyWriter','BodyWriter'],['NativeRecordKernel','recordInventory','RecordInventoryIndex'],['RecordInventoryIndex','kernel','NativeRecordKernel'],['NavigationIndex','recordInventory','RecordInventoryIndex']);
  await Promise.all(links.map(async([from,method,to])=>{
    const i=new E.Interface([`function ${method}() view returns (address)`]);
    const raw=await rpc('eth_call',[{to:g[from],data:i.encodeFunctionData(method)},blockNumber]);
    if(i.decodeFunctionResult(method,raw)[0].toLowerCase()!==g[to].toLowerCase())throw Error(`Dependency link mismatch: ${from}.${method}`);
  }));
  const types=[['bytesType','BytesValidator','EFS21 canonical ABI bytes v1'],['quoteType','Uint256Validator','EFS21 exact ABI uint256 v1']];
  if(roles.RawBytesValidator)types.push(['rawType','RawBytesValidator','EFS21 exact raw bytes v1']);
  const ti=new E.Interface(['function typeInfo(bytes32) view returns ((bytes32 schemaHash,address validator,bytes32 codeHash))']);
  await Promise.all(types.map(async([key,role,descriptor])=>{
    const schema=E.keccak256(E.toUtf8Bytes(descriptor));
    const id=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[E.id('EFS21_TYPE_V1'),schema,hash[role]]));
    if(config[key]!==id)throw Error('Selected exact Type identity mismatch: '+key);
    const raw=await rpc('eth_call',[{to:g.types,data:ti.encodeFunctionData('typeInfo',[id])},blockNumber]);
    const info=ti.decodeFunctionResult('typeInfo',raw)[0];
    if(info.schemaHash!==schema||info.codeHash!==hash[role]||info.validator.toLowerCase()!==g[role].toLowerCase())throw Error('Registry validator binding mismatch: '+key);
  }));
  return {graphId,profileId:profile.id,dependencyProfile:config.dependencyProfile};
}
