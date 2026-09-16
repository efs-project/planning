// Standalone explicit experimental profile. Not in the owner-served graph.
export function reduceStances(observations,{closed=true}={}){
  for(const o of observations){
    if(o.kind==='UNTOUCHED'||o.kind==='SILENT'||o.kind==='TOMBSTONE'&&o.purpose==='stance')continue;
    if(o.kind==='ASSERT'||o.kind==='DENY')return {assessment:o.kind==='ASSERT'?'PRESENT':'NOT_PRESENT',author:o.author,stance:o.kind,basis:o.basis};
    if(o.kind==='TOMBSTONE'&&o.purpose==='legacy')return {assessment:'NOT_PRESENT',author:o.author,stance:'MASK',basis:o.basis};
    return {assessment:'UNKNOWN',author:o.author??null,stance:null,basis:o.basis};
  }
  return {assessment:closed?'NOT_PRESENT':'UNKNOWN',author:null,stance:null};
}

export function createTagStancePlanner({ethers:e,call,ledgerAbi,profileHash}){
  const Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder(),iface=new e.Interface(ledgerAbi),plans=new WeakSet();
  const check=(ok,why)=>{if(!ok)throw Error(why);},eq=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
  const hash=(types,values)=>e.keccak256(coder.encode(types,values)),scalar=async(name,fn,args=[]) => (await call(name,fn,args))[0];
  const position=(p,s,r)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
  const recordId=(t,b)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
  const configType='tuple(bytes32 tokenType,bytes32 tokenRuleHash,bytes tokenDescriptor,bytes32 conceptType,bytes32 conceptHash,bytes32 directoryType,bytes32 directoryHash,bytes32[6] revisions,bytes32[6] revisionHashes)';
  const blank={typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0n,salt:Z};
  const frozen=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;};
  async function prepare(args,stance,supplied=false){
    const start=(await call('ledger','counts'))[0],execution=await scalar('ledger','executionSet');
    const bytes=await scalar('stanceValidator','profileBytes');
    check(profileHash&&eq(e.keccak256(bytes),profileHash)&&eq(await scalar('tagIndex','tagProfileHash'),profileHash),'PROFILE_UNAVAILABLE');
    const [version,purpose,family,cfg,tokens,words,offsets,widths,masks]=coder.decode(['bytes32','bytes32','bytes32',configType,'bytes32[3]','uint256[3]','uint8[6]','uint16[6]','uint8[6]'],bytes);
    check(eq(version,e.id('TagStance/1:own-cutoff:exact-retained:directed-parent:unbind-silent:withdraw-not-retract'))
      &&eq(purpose,e.id('efs.lab/tag-stance/1'))&&eq(family,e.id('efs.lab/tag-role-inventory/1')),'PROFILE_UNSUPPORTED');
    const read=async id=>{
      const [type,first,,body]=await call('ledger','record',[id]);
      check(first>0n&&first<=start&&eq(recordId(type,body),id),'RECORD_UNAVAILABLE');return {type,first,body};
    };
    for(let i=0;i<3;i++){
      const token=await read(tokens[i]);check(eq(token.type,cfg.tokenType)&&token.body===coder.encode(['uint256'],[i+1])&&words[i]===BigInt(i+1),'TOKEN_PROFILE');
    }
    check(eq(e.keccak256(await scalar('registry','descriptorBytes',[cfg.tokenType])),e.keccak256(cfg.tokenDescriptor)),'TOKEN_DESCRIPTOR');
    const principal=await scalar('ledger','principalOf',[args.author]);check(eq(principal,e.zeroPadValue(e.getAddress(args.author),32)),'KEY_AUTHOR_ONLY');
    const principals=args.principals;
    check(Array.isArray(principals)&&principals.length>0&&principals.length<=64&&new Set(principals.map(x=>x.toLowerCase())).size===principals.length
      &&principals.every(x=>/^0x[0-9a-f]{64}$/i.test(x)&&!eq(x,Z))&&principals.some(p=>eq(p,principal)),'CLOSED_LENS');
    const exists=async f=>{const at=await scalar('ledger','subjectCreatedAt',[f]);return at>0n&&at<=start;};
    const revision=async id=>{
      const r=await read(id),kind=cfg.revisions.findIndex(t=>eq(t,r.type));check(kind>=0,'SUBJECT_CLASS');
      const offset=Number(offsets[kind]),body=e.getBytes(r.body);check(body.length>=32*(offset+1)&&body.length<=8192&&(Number(widths[kind])===0||body.length===Number(widths[kind])),'REVISION_SHAPE');
      const file=e.hexlify(body.slice(offset*32,(offset+1)*32));check(await exists(file),'FILE_UNAVAILABLE');
      check((await scalar('ledger','subjectCreatedAt',[file]))<r.first,'REVISION_ORDER');
      if(kind%2){const parent=await read(e.hexlify(body.slice(0,32))),pk=cfg.revisions.findIndex(t=>eq(t,parent.type));
        check(pk>=0&&(Number(masks[kind])&(1<<pk))!==0&&parent.first<r.first,'REVISION_PARENT');
        const po=Number(offsets[pk]);check(eq(e.hexlify(e.getBytes(parent.body).slice(po*32,(po+1)*32)),file),'FILE_MISMATCH');}
      return file;
    };
    let subject=args.subject,intrinsicFile=Z,selectionClaim='STABLE_SUBJECT',headPosition;
    if(supplied){intrinsicFile=await revision(subject);selectionClaim='EXACT_SUPPLIED_REVISION_NOT_CURRENT';}
    else if(args.scope==='file'||args.scope==='selectedRevision'){
      check(await exists(subject),'SUBJECT_CLASS');intrinsicFile=subject;
      if(args.scope==='selectedRevision'){
        headPosition=position(e.id('efs2/purpose/head/1'),subject,Z);let selected;
        for(const p of principals){const h=await call('ledger','head',[hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),p,headPosition])]);if(h[0]!==0n){check(h[0]===1n,'HEAD_UNAVAILABLE');selected=h[5];break;}}
        check(selected,'HEAD_UNAVAILABLE');subject=selected;check(eq(await revision(subject),intrinsicFile),'FILE_MISMATCH');selectionClaim='SELECTED_REVISION_GUARDED';
      }
    }else if(args.scope==='directory'){
      const r=await read(subject);check(eq(r.type,cfg.directoryType)&&e.getBytes(r.body).length===32&&await exists(r.body),'SUBJECT_CLASS');
    }else throw Error('EXPLICIT_SUBJECT_SCOPE');
    if(args.claimedFile!==undefined)check(eq(args.claimedFile,intrinsicFile),'FILE_MISMATCH');
    const actions=[],bodies=[];let concept=args.concept;
    const validConcept=body=>{const b=e.getBytes(body);return b.length>=33&&b.length<=160&&!eq(e.hexlify(b.slice(0,32)),Z)&&b.slice(32).every(v=>v>=32&&v<=126);};
    if(args.conceptLabel!==undefined){
      check(args.concept===undefined&&/^0x[0-9a-f]{64}$/i.test(args.conceptNamespace),'CONCEPT_INPUT');
      const body=e.concat([args.conceptNamespace,e.toUtf8Bytes(args.conceptLabel)]);check(validConcept(body),'CONCEPT_SHAPE');concept=recordId(cfg.conceptType,body);
      actions.push({...blank,kind:1,typeId:cfg.conceptType,bodyHashOrRecordId:e.keccak256(body)});bodies.push(body);
    }else{const r=await read(concept);check(eq(r.type,cfg.conceptType)&&validConcept(r.body),'CONCEPT_PROFILE');}
    const coordinate=position(purpose,subject,concept),key=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),principal,coordinate]);
    const head=await call('ledger','head',[key]);
    actions.push({...blank,kind:3,purpose,subject,role:concept,target:tokens[stance-1],expectedRevision:head[1]});bodies.push('0x');
    const positions=headPosition?[headPosition,coordinate]:[coordinate],expectedHeads=[];
    for(const pos of positions)for(const p of principals)expectedHeads.push(await scalar('ledger','headSnapshot',[p,pos]));
    const readSet={principalIds:[...principals],positions,expectedHeads};
    const actionsHash=hash([iface.getFunction('execute').inputs[0]],[actions]);
    const intent={realmId:await scalar('ledger','realmId'),realmOrigin:await scalar('ledger','realmOrigin'),executionSet:execution,author:e.getAddress(args.author),
      nonce:await scalar('ledger','nonces',[args.author]),deadline:BigInt(args.deadline??Math.floor(Date.now()/1000)+3600),acceptanceProfile:await scalar('ledger','acceptanceProfileOf',[actions]),
      indexObligations:await scalar('ledger','indexObligations'),readSetHash:await scalar('ledger','readSetHash',[readSet])};
    const digest=await scalar('ledger','guardedIntentDigest',[intent,actionsHash]);
    check((await call('ledger','counts'))[0]===start&&eq(await scalar('ledger','executionSet'),execution),'BASIS_DRIFT');
    const plan=frozen({operation:['assertStance','denyStance','retractToSilent'][stance-1],selectionClaim,subject,intrinsicFile,concept,profileHash,basis:start,intent,readSet,actions,bodies,actionsHash,digest,
      nativeData:iface.encodeFunctionData('executeGuarded',[actions,bodies,intent.nonce,execution,readSet])});plans.add(plan);return plan;
  }
  async function sign(plan,signDigest){
    check(plans.has(plan),'OWNED_PLAN');check(eq(await scalar('ledger','executionSet'),plan.intent.executionSet),'EXECUTION_DRIFT');
    for(let i=0;i<plan.readSet.positions.length;i++)for(let j=0;j<plan.readSet.principalIds.length;j++){
      check(eq(await scalar('ledger','headSnapshot',[plan.readSet.principalIds[j],plan.readSet.positions[i]]),plan.readSet.expectedHeads[i*plan.readSet.principalIds.length+j]),'READSET_DRIFT');
    }
    check(await scalar('ledger','nonces',[plan.intent.author])===plan.intent.nonce,'NONCE_DRIFT');
    const signature=e.Signature.from(await signDigest(plan.digest)).serialized;check(eq(e.recoverAddress(plan.digest,signature),plan.intent.author),'SIGNER_MISMATCH');
    return {signature,data:iface.encodeFunctionData('executeGuardedSigned',[plan.intent,plan.actions,plan.bodies,plan.readSet,signature])};
  }
  return Object.freeze({assertStance:a=>prepare(a,1),denyStance:a=>prepare(a,2),retractToSilent:a=>prepare(a,3),
    assertSuppliedRevision:a=>prepare(a,1,true),denySuppliedRevision:a=>prepare(a,2,true),retractSuppliedRevisionToSilent:a=>prepare(a,3,true),sign});
}
