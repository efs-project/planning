// Independent finite archive interpreter. No RPC, index postings, reader,
// browser SDK, token-label table or authorization/replay API is imported.
import assert from 'node:assert/strict';
export function rebuildArchive(a,e){
  if(!a.profileBytes||!a.profileHash)return {status:'PARTIAL',reason:'opaque profile; retained bytes are not meaning'};
  const abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
  const hash=(t,v)=>e.keccak256(abi.encode(t,v));
  const record=(t,b)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
  const position=(p,s,c)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,c]);
  const cfgType='tuple(bytes32 tokenType,bytes32 tokenRuleHash,bytes tokenDescriptor,bytes32 conceptType,bytes32 conceptHash,bytes32 directoryType,bytes32 directoryHash,bytes32[6] revisions,bytes32[6] revisionHashes)';
  assert.equal(e.keccak256(a.profileBytes),a.profileHash);
  const [version,purpose,family,cfg,tokens,words,offsets,widths,masks]=abi.decode(['bytes32','bytes32','bytes32',cfgType,'bytes32[3]','uint256[3]','uint8[6]','uint16[6]','uint8[6]'],a.profileBytes);
  if(version!==e.id('TagStance/1:own-cutoff:exact-retained:directed-parent:unbind-silent:withdraw-not-retract'))return {status:'PARTIAL',reason:'unsupported meaning version'};
  const descriptor=e.getBytes(cfg.tokenDescriptor),labelLength=descriptor[88]*256+descriptor[89];
  const label=e.toUtf8String(descriptor.slice(90,90+labelLength)),mapping=Object.fromEntries([...label.matchAll(/(\d+)=(ASSERT|DENY|SILENT)/g)].map(m=>[m[1],m[2]]));
  if(Object.keys(mapping).length!==3||!label.startsWith('TagStanceToken/1:'))return {status:'PARTIAL',reason:'opaque retained token meaning'};
  const typeIds=[cfg.tokenType,cfg.conceptType,cfg.directoryType,...cfg.revisions];
  for(const id of typeIds){
    const t=a.types[id];if(!t)return {status:'PARTIAL',reason:'missing Type preimage'};
    assert.equal(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),t.shape,hash(['bytes32[]'],[t.refs]),t.ruleHash]),id);
  }
  for(const [id,pin] of [[cfg.tokenType,cfg.tokenRuleHash],[cfg.conceptType,cfg.conceptHash],[cfg.directoryType,cfg.directoryHash],...cfg.revisions.map((id,i)=>[id,cfg.revisionHashes[i]])])assert.equal(a.types[id].ruleHash,pin);
  assert.equal(a.types[cfg.tokenType].shape,hash(['bytes32','bytes'],[e.id('efs.lab.described-shape/1'),cfg.tokenDescriptor]));
  for(const [id,r] of Object.entries(a.records)){
    assert.equal(record(r.type,r.body),id);const first=a.admissions[Number(r.first)-1];assert(first&&first.kind===1&&first.b===r.type&&first.target===e.keccak256(r.body));
  }
  for(let i=0;i<3;i++){
    if(!a.records[tokens[i]])return {status:'PARTIAL',reason:'missing exact token bytes'};
    assert.equal(record(cfg.tokenType,abi.encode(['uint256'],[words[i]])),tokens[i]);assert(mapping[String(words[i])]);
  }
  for(const cell of Object.values(a.cells))assert.equal(position(cell.p,cell.s,cell.c),cell.position);
  const created=new Map(),facts=[];
  for(let i=0;i<a.admissions.length;i++){
    const f=a.admissions[i];assert.equal(BigInt(f.at),BigInt(i+1));const context=a.contexts[f.publication];assert(context);
    const author=context.principalId;
    if(f.kind===5)created.set(hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),author,f.target]),BigInt(f.at));
    if(f.kind===3||f.kind===4){assert(a.cells[f.ordinal]);facts.push({...f,...a.cells[f.ordinal],author,at:BigInt(f.at),revision:BigInt(f.expected)+1n});}
  }
  const classify=(id,origin)=>{
    if(created.has(id)&&created.get(id)<=origin)return {kind:1,file:id};
    const r=a.records[id];if(!r||BigInt(r.first)>origin)return {kind:0,file:Z};
    if(r.type===cfg.directoryType){assert(e.getBytes(r.body).length===32&&created.has(r.body)&&created.get(r.body)<BigInt(r.first));return {kind:4,file:Z};}
    const k=cfg.revisions.indexOf(r.type);if(k<0)return {kind:0,file:Z};
    const bytes=e.getBytes(r.body),off=Number(offsets[k]);assert(bytes.length>=32*(off+1)&&bytes.length<=8192);
    if(widths[k]!==0n)assert.equal(bytes.length,Number(widths[k]));
    const file=e.hexlify(bytes.slice(off*32,(off+1)*32));assert(created.has(file)&&created.get(file)<BigInt(r.first));
    if(k%2){const parent=a.records[e.hexlify(bytes.slice(0,32))];assert(parent&&BigInt(parent.first)<BigInt(r.first));
      const pk=cfg.revisions.indexOf(parent.type);assert(pk>=0&&(Number(masks[k])&(1<<pk)));const po=Number(offsets[pk]);
      assert.equal(e.hexlify(e.getBytes(parent.body).slice(po*32,(po+1)*32)),file);}
    return {kind:2,file};
  };
  const observation=f=>!f?'UNTOUCHED':f.kind===4?'SILENT':mapping[String(words[tokens.indexOf(f.target)])]??'UNKNOWN';
  const statements=facts.filter(f=>f.p===purpose).map(f=>{
    const concept=a.records[f.c];assert(concept&&concept.type===cfg.conceptType&&BigInt(concept.first)<f.at);
    const bytes=e.getBytes(concept.body);assert(bytes.length>=33&&bytes.length<=160&&e.hexlify(bytes.slice(0,32))!==Z&&bytes.slice(32).every(v=>v>=32&&v<=126));
    if(f.kind===3)assert(a.records[f.target]&&BigInt(a.records[f.target].first)<f.at);
    return {author:f.author,concept:f.c,subject:f.s,intrinsicFile:classify(f.s,f.at-1n).file,stance:observation(f),basis:String(f.at),position:f.position,revision:String(f.revision)};
  });
  function query(principals,q,origin){
    origin=BigInt(origin);const heads=new Map(),inventories=new Map();
    for(const f of facts){if(f.at>origin)continue;heads.set(`${f.author}/${f.position}`,f);if(f.p!==purpose)continue;
      const list=inventories.get(f.author)??[];if(!list.some(v=>v.position===f.position))list.push(f);inventories.set(f.author,list);}
    const head=file=>{
      const pos=position(e.id('efs2/purpose/head/1'),file,Z),all=principals.map(p=>heads.get(`${p}/${pos}`)).filter(Boolean);
      if(q.diagnosticHead&&all.length>1)return {status:3,target:Z};const f=all[0];return {status:f?(f.kind===3?1:2):0,target:f?.target??Z};
    };
    let exact=q.exact;if(q.direction===1&&q.mode===3){const h=head(exact);assert.equal(h.status,1);exact=h.target;}
    const counts=[],rows=[],seen=new Set();let rawTotal=0;
    for(const p of principals){
      const list=(inventories.get(p)??[]).filter(f=>q.direction===1?f.s===exact:f.c===exact);counts.push(list.length);rawTotal+=list.length;
      for(const candidate of list){
        if(seen.has(candidate.position))continue;seen.add(candidate.position);
        const r={subject:candidate.s,concept:candidate.c,intrinsicFile:Z,author:Z,token:Z,stance:0,assessment:2,revision:0,admission:0,headStatus:0};
        for(const author of principals){const f=heads.get(`${author}/${candidate.position}`),o=observation(f);
          if(o==='UNTOUCHED'||o==='SILENT')continue;
          Object.assign(r,{author,token:f.target,stance:o==='ASSERT'?1:o==='DENY'?2:0,assessment:o==='ASSERT'?1:o==='DENY'?2:0,revision:String(f.revision),admission:String(f.at)});break;}
        const {kind,file}=classify(r.subject,origin);r.intrinsicFile=file;
        if(r.assessment!==0){if(kind===0)r.assessment=0;
          else if(q.mode===3&&kind===2){const h=head(file);r.headStatus=h.status;if(h.status===3||h.status===4)r.assessment=0;else if(h.status!==1||h.target!==r.subject)r.assessment=3;}
          else if(kind!==q.mode)r.assessment=3;}
        rows.push(r);
      }
    }
    const pin=hash(['string','bytes32','uint64','bytes32[]','bytes32','bytes32','uint64[]'],['efs.tag-retained-prefix/1',a.profileHash,origin,principals,q.direction===1?purpose:family,exact,counts]);
    return {rows,rawTotal,counts,pin};
  }
  function diagnose(principals,subject,concept,basis,includeHead){
    const origin=BigInt(basis[0]),identity=classify(subject,origin),c=a.records[concept];
    assert(origin<=BigInt(a.counts[0])&&basis[4]===a.realm&&basis[5]===a.profileHash);
    assert(identity.kind!==0&&c?.type===cfg.conceptType&&BigInt(c.first)<=origin&&(!includeHead||identity.file!==Z));
    const at=(author,pos,head)=>{
      const f=facts.findLast(f=>f.author===author&&f.position===pos&&f.at<=origin);
      if(!f)return {author,target:Z,revision:0,admission:0,kind:1};
      const kind=head?(f.kind===3?6:7):f.kind===4?5:({ASSERT:2,DENY:3,SILENT:4}[observation(f)]??0);
      return kind===0?{author,target:Z,revision:0,admission:0,kind:0}:{author,target:f.kind===4?Z:f.target,revision:String(f.revision),admission:String(f.at),kind};
    };
    const stances=principals.map(p=>at(p,position(purpose,subject,concept),false));
    const heads=includeHead?principals.map(p=>at(p,position(e.id('efs2/purpose/head/1'),identity.file,Z),true)):[];
    const touched=heads.filter(o=>o.kind===6||o.kind===7);
    return {basis,subject,concept,intrinsicFile:identity.file,stances,heads,complete:[...stances,...heads].every(o=>o.kind!==0),
      stanceDisagreement:stances.some(o=>o.kind===2)&&stances.some(o=>o.kind===3),headDisagreement:touched.some(o=>o.kind!==touched[0].kind||o.target!==touched[0].target)};
  }
  return {status:'COMPLETE',mapping,statements,query,diagnose,authority:'retained source observations only; no destination or original-author replay authorization'};
}
