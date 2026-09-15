/** Application profile experiment, not a family registry or a generic View ABI.
 * The supported exact identities/rule hashes are caller-reviewed release pins.
 * ASCII + LF is this fixture's text domain, NOT an EFS restriction. */
export const NOTE_SHAPES=Object.freeze({v1:'lab/type/note-ascii/v1',v11:'lab/type/note-ascii/v1.1',v2:'lab/type/note-ascii/v2'});
export const V2_ADAPTER='lab/note-v2-to-text/1';
const magic={v1:'4e545631',v11:'4e543131',v2:'4e545632'};

export function createNoteReader({ethers:e,sdk,profiles}) {
  const pins=Object.fromEntries(Object.entries(profiles).map(([key,pin])=>{
    if(!NOTE_SHAPES[key]||!e.isHexString(pin.typeId,32)||!e.isHexString(pin.ruleHash,32)||pin.ruleHash===e.ZeroHash)throw Error('NOTE_PROFILE');
    return [key,Object.freeze({...pin})];
  }));
  const eq=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
  return Object.freeze({async readNote(args) {
    const source=await sdk.readTypedRecord(args);
    const response=(knowledge,reason,value=null,projection=null)=>Object.freeze({basis:source.basis,knowledge,coverage:source.coverage,
      value,projection,source,...(reason?{reason}:{})});
    if(source.knowledge!=='PRESENT')return response(source.knowledge,source.reason);
    if(source.coverage!=='COMPLETE')return response('UNKNOWN','SOURCE_PARTIAL');
    const raw=source.value,key=Object.keys(pins).find(k=>eq(pins[k].typeId,raw.typeId));
    if(!key)return response('UNSUPPORTED','EXACT_TYPE'); // labels never grant compatibility
    if(!eq(raw.descriptor?.ruleId,pins[key].ruleHash)||!eq(raw.descriptor?.shape,e.id(NOTE_SHAPES[key])))return response('INVALID','PROFILE');
    let text,title,kind=1;
    try {
      const bytes=e.getBytes(raw.body);
      if(bytes.length<7||e.hexlify(bytes.slice(0,4)).slice(2)!==magic[key])throw Error();
      const offset=key==='v2'?5:4;if(key==='v2')kind=bytes[4];
      const size=bytes[offset]*256+bytes[offset+1],start=offset+2,end=start+size;
      if(size<1||size>1024||end>bytes.length||(kind!==1&&kind!==2))throw Error();
      const ascii=(part,lf)=>{if([...part].some(b=>!(b>=32&&b<=126)&&!(lf&&b===10)))throw Error();return e.toUtf8String(part);};
      text=ascii(bytes.slice(start,end),true);
      if(key==='v11'){
        if(bytes[end]===0){if(bytes.length!==end+1)throw Error();}
        else if(bytes[end]===1){const n=bytes[end+1];if(!n||n>64||bytes.length!==end+2+n)throw Error();title=ascii(bytes.slice(end+2),false);}
        else throw Error();
      }else if(bytes.length!==end)throw Error();
    }catch{return response('INVALID','LAYOUT');}
    if(key==='v2'&&args.adapter!==V2_ADAPTER)return response('UNSUPPORTED','ADAPTER_REQUIRED');
    if(kind===2&&args.allowLoss!==true)return response('UNSUPPORTED','EMPHASIS_REQUIRES_EXPLICIT_LOSS');
    const projection=Object.freeze({id:key==='v2'?V2_ADAPTER:`lab/note-${key}-text/1`,sourceType:raw.typeId,
      view:'lab/note-text-view/1',loss:kind===2?'LOSSY':'NONE',losses:Object.freeze(kind===2?['emphasis']:[]),
      omittedFields:Object.freeze(title===undefined?[]:['title'])});
    return response('PRESENT',null,Object.freeze({text}),projection);
  }});
}
