/** Independent disposable WIRE1 reader. Written from WIRE.md and literal
 * vectors, not the Solidity parser or publisher encoder. No RPC, schema-name
 * table, custom execution, source admission or compatibility inference. */
const requireThat=(ok,code,coverage='INVALID')=>{
  if(!ok)throw Object.assign(new Error(`DESCRIBED_${code}`),{coverage,code});
};
const equals=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const frozen=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
function input(e,hex,max,kind){
  requireThat(hex!==undefined&&hex!==null,`${kind}_MISSING`,'PARTIAL');
  requireThat(typeof hex==='string'&&/^0x(?:[0-9a-f]{2})*$/i.test(hex),`${kind}_HEX`);
  requireThat((hex.length-2)/2<=max,`${kind}_BOUND`);
  return e.getBytes(hex);
}
function cursor(e,bytes){
  let at=0;
  const take=n=>{requireThat(at+n<=bytes.length,'TRUNCATED');const b=bytes.slice(at,at+n);at+=n;return b;};
  const hex=n=>e.hexlify(take(n));
  const uint=n=>BigInt(hex(n));
  return {take,hex,uint,number:n=>Number(uint(n)),end:()=>requireThat(at===bytes.length,'TRAILING')};
}
function hash(e,types,values){return e.keccak256(e.AbiCoder.defaultAbiCoder().encode(types,values));}

export function decodeDescribedType(e,descriptor,wrapperRuntimeHash){
  const bytes=input(e,descriptor,4096,'DESCRIPTOR');
  requireThat(bytes.length>=90,'DESCRIPTOR_HEADER');
  const c=cursor(e,bytes),version=c.number(1),profile=c.number(1),customAbi=c.number(1),count=c.number(1);
  requireThat(version===1&&profile===1,'VERSION','UNSUPPORTED');
  requireThat(count<=16,'FIELD_COUNT');
  const creator=e.getAddress(c.hex(20)),namespace=c.hex(32),customRuntimeHash=c.hex(32),semanticLength=c.number(2);
  requireThat(!equals(creator,e.ZeroAddress)&&!equals(namespace,e.ZeroHash),'NAMESPACE');
  requireThat(customAbi===(equals(customRuntimeHash,e.ZeroHash)?0:1),'CUSTOM_ABI','UNSUPPORTED');
  requireThat(semanticLength>0,'SEMANTICS_MISSING');
  const semanticBytes=c.hex(semanticLength),fields=[],refTypes=[],ids=new Set();let pastReferences=false;
  for(let i=0;i<count;i++){
    const id=c.hex(32),semanticId=c.hex(32),kind=c.number(1),optional=c.number(1),width=c.number(2),lower=c.uint(32),upper=c.uint(32),referenceType=c.hex(32);
    requireThat(!equals(id,e.ZeroHash)&&!equals(semanticId,e.ZeroHash)&&!ids.has(id),'FIELD_ID');ids.add(id);
    requireThat(optional<=1,'OPTIONAL_FLAG');
    requireThat(kind>=1&&kind<=8,'KIND','UNSUPPORTED');
    if(kind===1){
      requireThat(!pastReferences&&optional===0&&width===32&&lower===0n&&upper===0n&&!equals(referenceType,e.ZeroHash),'REFERENCE_DESCRIPTOR');
      refTypes.push(referenceType);requireThat(refTypes.length<=8,'REFERENCE_COUNT');
    }else{
      pastReferences=true;requireThat(equals(referenceType,e.ZeroHash),'IRRELEVANT_REFERENCE');
      if(kind===2)requireThat(width===32&&lower===0n&&upper===0n,'BYTES32_DESCRIPTOR');
      else if(kind===3)requireThat(width>=1&&width<=32&&lower<=upper&&upper<(1n<<BigInt(width*8)),'UINT_DESCRIPTOR');
      else if(kind===4)requireThat(width===1&&lower===0n&&upper===1n,'BOOL_DESCRIPTOR');
      else if(kind===5)requireThat(width===1&&lower<=upper&&upper<=255n,'ENUM_DESCRIPTOR');
      else requireThat(width===0&&lower<=upper&&upper<=8192n,'VARIABLE_DESCRIPTOR');
    }
    fields.push({id,semanticId,kind,optional:optional===1,width,lower:String(lower),upper:String(upper),referenceType});
  }
  c.end();
  requireThat(typeof wrapperRuntimeHash==='string'&&/^0x[0-9a-f]{64}$/i.test(wrapperRuntimeHash)&&!equals(wrapperRuntimeHash,e.ZeroHash),'WRAPPER_HASH');
  const shape=hash(e,['bytes32','bytes'],[e.id('efs.lab.described-shape/1'),descriptor]);
  const typeId=hash(e,['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape,hash(e,['bytes32[]'],[refTypes]),wrapperRuntimeHash]);
  const declarationDigest=hash(e,['bytes32','bytes32'],[e.id('efs.lab.portable-type-declaration/1'),typeId]);
  return frozen({descriptor:descriptor.toLowerCase(),version,profile,customAbi,creator,namespace,customRuntimeHash,semanticBytes,fields,refTypes,
    wrapperRuntimeHash,shape,typeId,declarationDigest,interpretationCoverage:'COMPLETE',semanticTruth:'NOT_PROVEN'});
}

export function decodeDescribedBody(e,descriptor,body){
  // Re-derive rather than trust a caller-modifiable decoded object.
  const d=decodeDescribedType(e,descriptor?.descriptor,descriptor?.wrapperRuntimeHash);
  const bytes=input(e,body,8192,'BODY'),c=cursor(e,bytes),fields=[],references=[];
  for(const f of d.fields){
    let present=true,value;
    if(f.optional){const p=c.number(1);requireThat(p===0||p===1,'PRESENCE');present=p===1;}
    if(!present)value=null;
    else if(f.kind===1||f.kind===2){value=c.hex(32);if(f.kind===1)references.push({recordId:value,typeId:f.referenceType});}
    else if(f.kind<=5){
      const n=c.uint(f.width);requireThat(n>=BigInt(f.lower)&&n<=BigInt(f.upper),'VALUE_RANGE');
      value=f.kind===3?String(n):f.kind===4?n===1n:Number(n);
    }else{
      const length=c.number(2);requireThat(BigInt(length)>=BigInt(f.lower)&&BigInt(length)<=BigInt(f.upper),'LENGTH_RANGE');
      const raw=c.take(length);
      if(f.kind===6)value=e.hexlify(raw);
      else {requireThat(raw.every(b=>(b>=32&&b<=126)||(f.kind===7&&b===10)),'TEXT_DOMAIN');value=String.fromCharCode(...raw);}
    }
    fields.push({...f,present,value});
  }
  c.end();
  return frozen({typeId:d.typeId,recordId:hash(e,['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),d.typeId,e.keccak256(body)]),
    body:body.toLowerCase(),fields,references,interpretationCoverage:'COMPLETE',referenceMeaning:'NOT_ESTABLISHED',
    customValidity:d.customAbi===0?'NOT_APPLICABLE':'NOT_EXECUTED',sourceAdmission:'NOT_PROVEN',authority:'NONE'});
}

export function verifyPortableDeclaration(e,descriptor,signature){
  const d=decodeDescribedType(e,descriptor?.descriptor,descriptor?.wrapperRuntimeHash),bytes=input(e,signature,65,'DECLARATION');
  requireThat(bytes.length===65&&(bytes[64]===27||bytes[64]===28),'SIGNATURE');
  requireThat(BigInt(e.hexlify(bytes.slice(32,64)))<=0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n,'SIGNATURE_HIGH_S');
  const signer=e.recoverAddress(d.declarationDigest,signature);
  requireThat(equals(signer,d.creator),'DECLARATION_SIGNER');return signer;
}
