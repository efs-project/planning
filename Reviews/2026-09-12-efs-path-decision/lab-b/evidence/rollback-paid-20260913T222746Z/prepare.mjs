// Pure coordinator-sealed control derivation. No RPC, compiler, candidate encoders or observed answers.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { instantiateBRuntime } from '/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.mjs';
const require = createRequire('/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.mjs');
const { AbiCoder, HDNodeWallet, getCreateAddress, keccak256, toUtf8Bytes, Interface } = require('ethers');
const abi = AbiCoder.defaultAbiCoder(), Z = '0x'+'00'.repeat(32), A0 = '0x'+'00'.repeat(20);
const enc=(t,v)=>abi.encode(t,v).toLowerCase(), hash=(t,v)=>keccak256(enc(t,v)), text=s=>keccak256(toUtf8Bytes(s));
const word=n=>enc(['uint256'],[n]), addressWord=a=>enc(['address'],[a]);
const wallet=i=>HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',undefined,`m/44'/60'/0'/0/${i}`);
const ACT='(uint8,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,bytes32)', INT='(bytes32,bytes32,address,uint64,uint64,bytes32,bytes32)';
const call=(signature,args)=>new Interface(['function '+signature]).encodeFunctionData(signature.slice(0,signature.indexOf('(')),args).toLowerCase();
const error=(signature,args)=>new Interface(['error '+signature]).encodeErrorResult(signature.slice(0,signature.indexOf('(')),args).toLowerCase();
const action=(kind,fields={})=>[kind,fields.type??Z,fields.hash??Z,fields.purpose??Z,fields.subject??Z,fields.role??Z,fields.target??Z,0,fields.salt??Z];
const publish=(type,body)=>action(1,{type,hash:keccak256(body)});
const typeId=(shape,refs,rule)=>hash(['bytes32','bytes32','bytes32','bytes32'],[text('efs2/type/1'),shape,hash(['bytes32[]'],[refs]),rule]);
const record=(type,body)=>hash(['bytes32','bytes32','bytes32'],[text('efs2/record/1'),type,keccak256(body)]);
const position=(purpose,subject,role)=>hash(['bytes32','bytes32','bytes32','bytes32'],[text('efs2/position/1'),purpose,subject,role]);
const binding=(principal,pos)=>hash(['bytes32','bytes32','bytes32'],[text('efs2/binding/1'),principal,pos]);
const posting=(type,kind,value)=>hash(['bytes32','bytes32','uint256','uint256','bytes32'],[text('efs2/pk/1'),type,kind,0,value]);
const scope=(principal,purpose,subject)=>hash(['bytes32','bytes32','bytes32','bytes32'],[text('efs2/vk/binding-scope/1'),principal,purpose,subject]);
const domain=hash(['bytes32','bytes32','bytes32'],['EIP712Domain(string name,string version)','EFS2-RoadB-Lab','1'].map(text));
const intentType=text('PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)');
const artifactRoot=process.argv[2]??'/tmp/efs-b-rollback-build-20260913.Ps480X/green-out';
const art=(file,name)=>JSON.parse(fs.readFileSync(`${artifactRoot}/${file}/${name}.json`,'utf8'));
const definitions=[['registry','TypeRegistry.sol','TypeRegistry','src/TypeRegistry.sol',[]],['quoteAcceptor','LabAcceptors.sol','QuoteAcceptor','src/LabAcceptors.sol',[]],['pairRule','LabAcceptors.sol','MinBodyAcceptor','src/LabAcceptors.sol',['uint256']],['ledger','Ledger.sol','Ledger','src/Ledger.sol',['address','bytes32']],['index','MatchedRollback.t.sol','LateRefusingIndexModule','test/MatchedRollback.t.sol',['address','bytes32']],['prefixActor','LabHarness.sol','Actor','src/LabHarness.sol',['address']]];
const artifacts=Object.fromEntries(definitions.map(([role,file,name])=>[role,art(file,name)]));
const inherited={'src/IndexModule.sol':art('IndexModule.sol','IndexModule').ast,'src/Interfaces.sol':art('Interfaces.sol','IIndexModule').ast};
const artifactPaths=[...definitions.map(([,file,name])=>`${artifactRoot}/${file}/${name}.json`),`${artifactRoot}/IndexModule.sol/IndexModule.json`,`${artifactRoot}/Interfaces.sol/IIndexModule.json`];
const sha256=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const authorWallet=wallet(1),author=authorWallet.address.toLowerCase(),principal=addressWord(author),salt=text('joined/FILE_QUOTE');
const subject=hash(['bytes32','bytes32','bytes32'],[text('efs2/subject/1'),principal,salt]);
const purposes=Object.fromEntries(['HEAD','FOLDER','TAG'].map(n=>[n,text(`efs2/purpose/${n.toLowerCase()}/1`)]));
const folder=text('/swaps'),nameRole=text('eth-usdc'),market=text('market');
const positions={HEAD:position(purposes.HEAD,subject,Z),FOLDER:position(purposes.FOLDER,folder,nameRole),TAG:position(purposes.TAG,subject,market)};
const bindings=Object.fromEntries(Object.entries(positions).map(([n,p])=>[n,binding(principal,p)]));
const realms=text('lab/realm/1');
const out={schema:'efs-lab-b/rollback-expectations/1',chain:{chainId:'31337',initialBlockNumber:'0',deadline:'2000000000'},source:{commit:'8ddd04cdb12506c663c421c3c588115ca38a93b5',evidenceCommit:'4487d7bdc43be5749e340ccd36cd2d7e70689e4b',runtimeHelperCommit:'3dfd975',ethersVersion:require('ethers').version,derivation:'production source + coordinator literal seal + neutral fixture; no candidate answers'},arms:{}};
out.source.nodeVersion=process.version;
out.source.artifactSha256=Object.fromEntries(artifactPaths.map(path=>[path,sha256(path)]));
out.source.preparationScriptSha256=sha256(new URL(import.meta.url));
for(const [armIndex,armName] of ['scale7','lateIndex','calibration'].entries()){
 const deployerIndex=armIndex+2,deployer=wallet(deployerIndex).address.toLowerCase();
 const addresses=Object.fromEntries(definitions.map(([role],nonce)=>[role,getCreateAddress({from:deployer,nonce}).toLowerCase()]));
 const poison=armName==='lateIndex'?bindings.TAG:Z;
 const immutables={registry:{admin:addressWord(deployer)},quoteAcceptor:{},pairRule:{minBody:word(96)},ledger:{registry:addressWord(addresses.registry),realmId:realms,admin:addressWord(deployer),domainSeparator:domain},index:{ledger:addressWord(addresses.ledger),admin:addressWord(deployer),attachedFrom:word(1),poisonBindingKey:poison},prefixActor:{ledger:addressWord(addresses.ledger)}};
 const constructorValues={registry:[],quoteAcceptor:[],pairRule:[96],ledger:[addresses.registry,realms],index:[addresses.ledger,poison],prefixActor:[addresses.ledger]};
 const deployment=definitions.map(([role,file,contractName,sourceName,ctor],nonce)=>{
  const artifact=artifacts[role],actualCtor=artifact.abi.find(x=>x.type==='constructor')?.inputs.map(x=>x.type)??[];
  if(JSON.stringify(ctor)!==JSON.stringify(actualCtor))throw Error('constructor drift '+role);
  const result=instantiateBRuntime({artifact,sourceAst:artifact.ast,sourceAsts:role==='index'?inherited:undefined,sourceName,contractName,immutableValues:immutables[role]});
  const initcode=(artifact.bytecode.object+enc(ctor,constructorValues[role]).slice(2)).toLowerCase();
  return {role,nonce,address:addresses[role],initcodeHash:keccak256(initcode),initcodeBytes:(initcode.length-2)/2,runtimeCodehash:result.runtimeCodehash,runtimeBytes:result.runtimeBytes};
 });
 const code=Object.fromEntries(deployment.map(d=>[d.role,d.runtimeCodehash]));
 const shapes={ITEM:text('lab/type/item/1'),PAIR:text('lab/type/pair/1'),QUOTE_J:text('lab/type/quote-joined/1')};
 const ITEM=typeId(shapes.ITEM,[],Z),PAIR=typeId(shapes.PAIR,[ITEM,ITEM],code.pairRule),QUOTE_J=typeId(shapes.QUOTE_J,[PAIR],code.quoteAcceptor),types={ITEM,PAIR,QUOTE_J};
 const itemABody=enc(['uint256'],[1]),itemBBody=enc(['uint256'],[2]),itemA=record(ITEM,itemABody),itemB=record(ITEM,itemBBody);
 const pairBody=enc(['bytes32','bytes32','uint256'],[itemA,itemB,1]),pairId=record(PAIR,pairBody);
 const quoteBody=enc(['bytes32','uint256','uint8','uint64','bytes32'],[pairId,2500000000,armName==='scale7'?7:6,1800000000,keccak256('0x7265666572656e63652071756f7465')]),quoteId=record(QUOTE_J,quoteBody);
 const prefixActions=[publish(ITEM,itemABody),publish(ITEM,itemBBody),publish(PAIR,pairBody)],prefixBodies=[itemABody,itemBBody,pairBody];
 const actions=[action(5,{salt}),publish(QUOTE_J,quoteBody),action(3,{purpose:purposes.HEAD,subject,target:quoteId}),action(3,{purpose:purposes.FOLDER,subject:folder,role:nameRole,target:subject}),action(3,{purpose:purposes.TAG,subject,role:market,target:subject})],bodies=['0x',quoteBody,'0x','0x','0x'];
 const rules={[ITEM]:Z,[PAIR]:code.pairRule,[QUOTE_J]:code.quoteAcceptor};
 const profile=xs=>xs.filter(x=>x[0]===1||x[0]===2).reduce((p,x)=>hash(['bytes32','bytes32','bytes32','bytes32','uint64'],[p,x[1],rules[x[1]],Z,3]),Z);
 const actionsHash=hash([ACT+'[]'],[actions]),prefixActionsHash=hash([ACT+'[]'],[prefixActions]),indexObligations=hash(['address','bytes32'],[addresses.index,code.index]);
 const acceptanceProfile=profile(actions),prefixProfile=profile(prefixActions),intent=[realms,code.ledger,author,0,2000000000,acceptanceProfile,indexObligations];
 const digest=keccak256('0x1901'+domain.slice(2)+hash(['bytes32', 'bytes32','bytes32','address','uint64','uint64','bytes32','bytes32','bytes32'],[intentType,...intent,actionsHash]).slice(2));
 const signature=authorWallet.signingKey.sign(digest);
 const publicationId=hash(['address','uint64','bytes32'],[author,0,actionsHash]),prefixPublicationId=hash(['address','uint64','bytes32'],[addresses.prefixActor,0,prefixActionsHash]);
 const origin=hash(['uint256','bytes32'],[31337,code.ledger]),prefixPrincipal=hash(['bytes32','uint256','bytes32','address'],[text('efs2/principal/1'),2,origin,addresses.prefixActor]);
 const setupTransactions=[['register-item',addresses.registry,'register(bytes32,address,bytes32[])',[shapes.ITEM,A0,[]]],['register-pair',addresses.registry,'register(bytes32,address,bytes32[])',[shapes.PAIR,addresses.pairRule,[ITEM,ITEM]]],['register-quote',addresses.registry,'register(bytes32,address,bytes32[])',[shapes.QUOTE_J,addresses.quoteAcceptor,[PAIR]]],['attach-index',addresses.ledger,'setIndexModule(address)',[addresses.index]],['prefix',addresses.prefixActor,`execute(${ACT}[],bytes[])`,[prefixActions,prefixBodies]]].map(([label,to,sig,args],i)=>({label,from:deployer,to,nonce:i+6,data:call(sig,args)}));
 const preBlock=11+12*armIndex,postBlock=preBlock+1;
 const queries={};
 const expected=success=>{
  const reads={};
  const add=(label,target,sig,args,returnTypes,values)=>{queries[label]={to:addresses[target],data:call(sig,args)};reads[label]=enc(returnTypes,values);};
  const scalar=(label,target,sig,args,t,v)=>add(label,target,sig,args,[t],[v]);
  add('counts','ledger','counts()',[],['uint64','uint64','uint64','uint64'],success?[8,4,3,2]:[3,3,0,1]);
  scalar('nonceA','ledger','nonces(address)',[author],'uint64',success?1:0);
  scalar('noncePrefix','ledger','nonces(address)',[addresses.prefixActor],'uint64',1);
  scalar('indexObligations','ledger','indexObligations()',[],'bytes32',indexObligations);
  scalar('indexModule','ledger','indexModule()',[],'address',addresses.index);
  scalar('subject','ledger','subjectCreatedAt(bytes32)',[subject],'uint64',success?4:0);
  scalar('publication','ledger','publicationOf(bytes32)',[publicationId],'uint64',success?2:0);
  scalar('prefixPublication','ledger','publicationOf(bytes32)',[prefixPublicationId],'uint64',1);
  const evTypes=['address','uint8','uint8','uint16','uint64','bytes32','bytes32','uint64','uint64','uint64','bytes32','bytes32','bytes32'];
  const zeroEv=[A0,0,0,0,0,Z,Z,0,0,0,Z,Z,Z];
  const signedEv=[author,2,signature.v,5,4,signature.r,signature.s,0,2000000000,postBlock,acceptanceProfile,indexObligations,actionsHash];
  const prefixEv=[addresses.prefixActor,1,0,3,1,Z,Z,0,0,preBlock,prefixProfile,indexObligations,prefixActionsHash];
  add('evidence1','ledger','evidence(uint64)',[1],evTypes,prefixEv);
  add('evidence2','ledger','evidence(uint64)',[2],evTypes,success?signedEv:zeroEv);
  const srcTypes=['bytes32','bytes32','bytes32','bytes32','bytes32','bytes32','bytes32','address','uint64','uint64','uint8','uint8'];
  for(const ordinal of [1,2]){add('sourceEvidence'+ordinal,'ledger','sourceEvidence(uint64)',[ordinal],srcTypes,[Z,Z,Z,Z,Z,Z,Z,A0,0,0,0,0]);scalar('isImported'+ordinal,'ledger','isImported(uint64)',[ordinal],'bool',false);}
  const recordTypes=['bytes32','uint64','uint32','bytes'];
  for(const [label,id,type,body,first] of [['itemA',itemA,ITEM,itemABody,1],['itemB',itemB,ITEM,itemBBody,2],['pair',pairId,PAIR,pairBody,3],['quote',quoteId,QUOTE_J,quoteBody,5]]){
   const exists=label!=='quote'||success;add('record-'+label,'ledger','record(bytes32)',[id],recordTypes,exists?[type,first,1,body]:[Z,0,0,'0x']);scalar('body-'+label,'ledger','body(bytes32)',[id],'bytes',exists?body:'0x');
  }
  const admTypes=['uint8','uint16','uint64','uint64','uint32','bool','bytes32','bytes32'];
  const admissionRows={1:[1,0,1,0,0,false,keccak256(itemABody),ITEM],2:[1,1,1,0,0,false,keccak256(itemBBody),ITEM],3:[1,2,1,0,0,false,keccak256(pairBody),PAIR],4:[5,0,2,0,0,false,salt,Z],5:[1,1,2,0,0,false,keccak256(quoteBody),QUOTE_J],6:[3,2,2,1,0,false,quoteId,Z],7:[3,3,2,2,0,false,subject,Z],8:[3,4,2,3,0,false,subject,Z]};
  for(let ord=1;ord<=8;ord++)add('admission'+ord,'ledger','admission(uint64)',[ord],admTypes,ord<=3||success?admissionRows[ord]:[0,0,0,0,0,false,Z,Z]);
  for(const [i,name] of ['HEAD','FOLDER','TAG'].entries()){
   add('head-'+name,'ledger','head(bytes32)',[bindings[name]],['uint8','uint32','uint64','uint64','uint64','bytes32'],success?[1,1,6+i,0,1+i,name==='HEAD'?quoteId:subject]:[0,0,0,0,0,Z]);
   scalar('bindingPosition'+(i+1),'ledger','bindingPosition(uint64)',[i+1],'bytes32',success?positions[name]:Z);
   add('position-'+name,'ledger','positionCell(bytes32)',[positions[name]],['bytes32','bytes32','bytes32'],success?[purposes[name],name==='FOLDER'?folder:subject,name==='HEAD'?Z:name==='FOLDER'?nameRole:market]:[Z,Z,Z]);
  }
  scalar('registryEpoch','registry','epoch()',[],'uint64',3);
  for(const [i,n]of ['ITEM','PAIR','QUOTE_J'].entries()){
   const mandatory=n==='ITEM'?A0:n==='PAIR'?addresses.pairRule:addresses.quoteAcceptor,refs=n==='ITEM'?[]:n==='PAIR'?[ITEM,ITEM]:[PAIR];
   add('typeInfo-'+n,'registry','typeInfo(bytes32)',[types[n]],['bool','address','bytes32','address','bytes32','uint8','uint16'],[true,mandatory,rules[types[n]],A0,Z,refs.length,1]);
   add('descriptor-'+n,'registry','descriptor(bytes32)',[types[n]],['bytes32','bytes32','address','uint8','uint16','uint64'],[shapes[n],rules[types[n]],mandatory,refs.length,1,armIndex*12+7+i]);
   scalar('refTypes-'+n,'registry','refTypes(bytes32)',[types[n]],'bytes32[]',refs);
   add('activation-'+n,'registry','activation(bytes32,uint16)',[types[n],1],['address','bytes32','uint64','uint64'],[A0,Z,i+1,armIndex*12+7+i]);
  }
  for(const [n,v,t]of [['lastProcessed',success?8:3,'uint64'],['lastPublication',success?2:1,'uint64'],['generation',0,'uint64'],['gapped',false,'bool'],['attachedFrom',1,'uint64']])scalar(n,'index',n+'()',[],t,v);
  for(const family of ['scope','history','backlink','by-type','by-author'])add('coverage-'+family,'index','coverage(bytes32,bytes32)',[text('efs2/family/'+family+'/1'),Z],['uint8','uint64','uint64'],[2,1,success?8:3]);
  const lists={typeITEM:[posting(ITEM,1,Z),[1,2],false],typePAIR:[posting(PAIR,1,Z),[3],false],typeQUOTE:[posting(QUOTE_J,1,Z),success?[5]:[],false],authorPrefix:[posting(Z,4,prefixPrincipal),[1,2,3],false],authorA:[posting(Z,4,principal),success?[5]:[],false],backlinkQuote:[posting(Z,5,quoteId),success?[6]:[],false],backlinkFile:[posting(Z,5,subject),success?[7,8]:[],false]};
  for(const [i,n]of ['HEAD','FOLDER','TAG'].entries()){
   lists['scope'+n]=[posting(Z,10,scope(principal,purposes[n],n==='FOLDER'?folder:subject)),success?[i+1]:[],true];
   lists['history'+n]=[posting(Z,8,bindings[n]),success?[i+6]:[],true];
  }
  for(const [n,[key,ordinals,audit]]of Object.entries(lists)){
   add('postingHead-'+n,'index','postingHead(bytes32)',[key],['uint64','uint64','uint64','uint16'],[ordinals.length,ordinals.length,ordinals.at(-1)??0,ordinals.length&&audit?1:0]);
   scalar('postingWord-'+n,'index','postingWord(bytes32,uint64)',[key,0],'uint256',ordinals.reduce((v,n,i)=>v+(BigInt(n)<<(48n*BigInt(i))),0n));
  }
  return reads;
 };
 const preReads=expected(false),postReads=expected(armName==='calibration');
 const calldata=call(`executeSigned(${INT},${ACT}[],bytes[],bytes)`,[intent,actions,bodies,signature.serialized]);
 const a1={scale:armName==='scale7'?7:6,quoteBody,quoteId,actions,bodies,actionsHash,acceptanceProfile,indexObligations,publicationId,intent:Object.fromEntries(['realmId','coreCodeCommitment','author','nonce','deadline','acceptanceProfile','indexObligations'].map((k,i)=>[k,intent[i]])),signature:signature.serialized,calldata};
 const labels={counts:'ledger.counts',nonceA:'ledger.nonce.authorA',indexModule:'ledger.indexModule',indexObligations:'ledger.indexObligations',evidence2:'ledger.evidence.2',sourceEvidence2:'ledger.sourceEvidence.2',publication:'ledger.publicationOf.a1',subject:'ledger.subject.file',registryEpoch:'registry.epoch'};
 for(let n=4;n<=8;n++)labels['admission'+n]='ledger.admission.'+n;
 for(const n of ['itemA','itemB','pair','quote'])labels['record-'+n]='ledger.record.'+n;
 for(const n of ['HEAD','FOLDER','TAG']){labels['head-'+n]='ledger.head.'+n.toLowerCase();labels['position-'+n]='ledger.position.'+n.toLowerCase();}
 for(let n=1;n<=3;n++)labels['bindingPosition'+n]='ledger.bindingPosition.'+n;
 for(const n of ['ITEM','PAIR','QUOTE_J'])for(const field of ['typeInfo','descriptor'])labels[field+'-'+n]='registry.'+field+'.'+n;
 for(const n of ['attachedFrom','lastProcessed','lastPublication','generation','gapped'])labels[n]='index.'+n;
 for(const n of ['scope','history','backlink','by-type','by-author'])labels['coverage-'+n]='index.coverage.FAMILY_'+n.toUpperCase().replaceAll('-','_');
 const listLabels={typeITEM:'itemByType',typePAIR:'pairByType',typeQUOTE:'quoteByType',authorPrefix:'prefixProducerByAuthor',authorA:'authorAByAuthor',scopeHEAD:'headScope',scopeFOLDER:'folderScope',scopeTAG:'tagScope',historyHEAD:'headHistory',historyFOLDER:'folderHistory',historyTAG:'tagHistory',backlinkQuote:'quoteBacklink',backlinkFile:'fileBacklink'};
 for(const [n,label]of Object.entries(listLabels)){labels['postingHead-'+n]='index.list.'+label+'.head';labels['postingWord-'+n]='index.list.'+label+'.word0';}
 const relabel=values=>Object.fromEntries(Object.entries(labels).map(([old,n])=>[n,values[old]]));
 const auxiliary=values=>Object.fromEntries(Object.entries(values).filter(([n])=>!Object.hasOwn(labels,n)));
 out.arms[armName]={deployerIndex,authorIndex:1,deployment,setupTransactions,types,fixture:{itemA,itemB,pairId,subject,poisonBindingKey:poison,quoteBody,quoteId,publicationId},a1,attempt:{from:author,to:addresses.ledger,nonce:armIndex,data:calldata,errorData:armName==='scale7'?error('E_REJECTED(uint256,bytes32)',[1,QUOTE_J]):armName==='lateIndex'?error('E_INDEX(bytes)',[error('E_LATE_INDEX(bytes32)',[poison])]):null,expectedStatus:armName==='calibration'?1:0},pre:{blockNumber:String(preBlock),reads:relabel(preReads),auxiliaryReads:auxiliary(preReads)},post:{blockNumber:String(postBlock),reads:relabel(postReads),auxiliaryReads:auxiliary(postReads)},readCalls:relabel(queries),auxiliaryReadCalls:auxiliary(queries)};
}
if(out.arms.scale7.attempt.errorData.length!==138||out.arms.lateIndex.attempt.errorData.length!==266)throw Error('error byte length invariant');
process.stdout.write(JSON.stringify(out,null,2)+'\n');
