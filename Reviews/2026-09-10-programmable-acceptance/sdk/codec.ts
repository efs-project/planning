import { AbiCoder, id, keccak256, ZeroHash } from 'ethers';
export type Field = {readonly name:string; readonly kind:'uint256'|'address'|'bytes32'|'bool'};
export type Rule = {codeHash:string;semanticConfig:string;mode:number;gasLimit:number};
export type Declaration = {name:string;version:string;fields:readonly Field[];rule:null|{artifact:string;label:string;config:readonly Field[];local:readonly Field[];mode:number;gasLimit:number}};
export type Registration = {descriptor:string;kinds:string;rule:Rule;typeId:string;config:Record<string,unknown>};
export const abi = AbiCoder.defaultAbiCoder();
export const hash = (types:readonly string[], values:readonly unknown[]) => keccak256(abi.encode(types,values));
export function ruleId(r:Rule):string { return r.mode===0 ? ZeroHash : hash(['bytes32','bytes32','bytes32','uint8','uint32'],[id('efs.acceptance.rule.v1'),r.codeHash,r.semanticConfig,r.mode,r.gasLimit]); }
export function typeId(descriptor:string,kinds:string,rule:Rule):string {
  return hash(['bytes32','bytes32','bytes32','bytes32'],[id('efs.acceptance.type.v1'),descriptor,hash(['bytes32','bytes'],[id('efs.acceptance.shape.v1'),kinds]),ruleId(rule)]);
}
export function encodeFields(fields:readonly Field[], value:Record<string,unknown>):string {
  const keys=Object.keys(value);
  if(keys.length!==fields.length||fields.some(f=>!Object.hasOwn(value,f.name))) throw Error('exact named fields required');
  for(const f of fields) {
    const v=value[f.name];
    if(f.kind==='uint256'&&(typeof v!=='bigint'||v<0n||v>=2n**256n)) throw Error('uint256 requires bounded bigint');
    if(f.kind==='bool'&&typeof v!=='boolean') throw Error('bool requires boolean');
  }
  return abi.encode(fields.map(f=>f.kind),fields.map(f=>value[f.name]));
}
export function decodeFields(fields:readonly Field[],body:string):Record<string,unknown> {
  if(!/^0x[0-9a-fA-F]*$/.test(body)||body.length!==2+64*fields.length) throw Error('noncanonical body length');
  try {
    const values=abi.decode(fields.map(f=>f.kind),body);
    const result=Object.fromEntries(fields.map((f,i)=>[f.name,values[i]]));
    if(encodeFields(fields,result).toLowerCase()!==body.toLowerCase()) throw Error('noncanonical body words');
    return result;
  } catch(cause) { throw Error('noncanonical body words',{cause}); }
}
export function makeCodec<T extends Record<string,unknown>, C extends Record<string,unknown>, L extends Record<string,unknown>>(declaration:Declaration, descriptor:string) {
  const kinds='0x'+declaration.fields.map(f=>({uint256:'00',address:'01',bytes32:'02',bool:'03'}[f.kind])).join('');
  const registration=(codeHash=ZeroHash,config={} as C):Registration=> {
    let rule:Rule={codeHash:ZeroHash,semanticConfig:ZeroHash,mode:0,gasLimit:0};
    if(declaration.rule) {
      const spec=declaration.rule;
      if(codeHash===ZeroHash) throw Error('mandatory rule requires chosen nonzero code hash; artifact trust is checked during setup');
      const encoded=encodeFields(spec.config,config);
      const semanticConfig=spec.config.length ? keccak256('0x'+id(spec.label).slice(2)+encoded.slice(2)) : id(spec.label);
      rule={codeHash,semanticConfig,mode:spec.mode,gasLimit:spec.gasLimit};
    }
    return {descriptor,kinds,rule,typeId:typeId(descriptor,kinds,rule),config:structuredClone(config)};
  };
  const requireRegistration=(candidate:Registration)=> {
    try {
      const expected=registration(candidate.rule.codeHash,candidate.config as C);
      if(candidate.descriptor!==descriptor||candidate.kinds!==kinds||candidate.typeId!==expected.typeId||candidate.rule.codeHash!==expected.rule.codeHash||candidate.rule.semanticConfig!==expected.rule.semanticConfig||candidate.rule.mode!==expected.rule.mode||candidate.rule.gasLimit!==expected.rule.gasLimit) throw Error('declaration rule mismatch');
    } catch(cause) {throw Error('UNKNOWN_EXACT_TYPE: registration does not satisfy this declaration',{cause});}
  };
  return {declaration,descriptor,kinds,registration,localConfig:(value:L)=>keccak256(encodeFields(declaration.rule?.local??[],value)),
    encode:(value:T)=>encodeFields(declaration.fields,value),
    decode:(body:string)=>decodeFields(declaration.fields,body) as T,
    item:(registration:Registration,value:T,activationId=ZeroHash,funding=0n)=>{requireRegistration(registration);return {typeId:registration.typeId,activationId,body:encodeFields(declaration.fields,value),value:funding};},
    edit:(exactType:string,registration:Registration,value:T,activationId:string,funding=0n)=> {
      requireRegistration(registration);
      if(exactType!==registration.typeId) throw Error('UNKNOWN_EXACT_TYPE: old editor refuses before preparing a write');
      return {typeId:exactType,activationId,body:encodeFields(declaration.fields,value),value:funding};
    }
  };
}
