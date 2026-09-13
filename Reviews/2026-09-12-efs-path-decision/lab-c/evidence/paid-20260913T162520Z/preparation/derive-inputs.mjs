// Offline one-fixture vector derivation; no provider, RPC, runner, fixture, or result inputs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='/tmp/efs-c-readiness-build-20260913.NoPDle/out';
const src='/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c';
const cast=(...args)=>execFileSync('/Users/james/.foundry/bin/cast',args,{encoding:'utf8',maxBuffer:4e6}).trim();
const abi=(types,args)=>cast('abi-encode',`f(${types})`,...args.map(String));
const call=(sig,args=[])=>cast('calldata',sig,...args.map(String));
const hash=x=>cast('keccak',x);
const utf8=x=>'0x'+Buffer.from(x).toString('hex');
const h=x=>hash(utf8(x));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const z='0x'+'00'.repeat(32), word=x=>'0x'+BigInt(x).toString(16).padStart(64,'0');
const hx=x=>x.startsWith('0x')?x.slice(2):x;
const array=x=>'['+x.join(',')+']';
const tuple=x=>'('+x.join(',')+')';
const pack=(types,args)=>'0x'+types.split(',').map((t,i)=>{const a=args[i];let n=t==='address'?20:t.startsWith('bytes')?Number(t.slice(5)):Number(t.slice(4))/8; return (String(a).startsWith('0x')?hx(a):BigInt(a).toString(16)).padStart(n*2,'0');}).join('');
// Public Anvil test fixture only. No private key is exported, saved, or printed.
const signPublicTestDigest=digest=>cast('wallet','sign','--no-hash','--mnemonic',Array(11).fill('test').concat('junk').join(' '),'--mnemonic-index','1',digest);
const accounts=Object.fromEntries([['deployer',0],['authorA',1],['paidCaller',3]].map(([role,index])=>[role,{index,path:`m/44'/60'/0'/0/${index}`,address:cast('wallet','address','--mnemonic','test test test test test test test test test test test junk','--mnemonic-index',String(index))}]));
const allocation=[['ImportLib','ImportLib.sol',0],['IndexModule','IndexModule.sol',1],['Ledger','Ledger.sol',2],['LensReader','LensReader.sol',4],['PassAcceptor','FixtureActors.sol',5],['QuoteAcceptorV1','FixtureActors.sol',6],['Producer','FixtureActors.sol',7],['MeasurementConsumer','MeasurementConsumer.sol',8]];
const deployment={};
for(const [role,file,nonce] of allocation){const artifactPath=`${base}/${file}/${role}.json`;const raw=fs.readFileSync(artifactPath);const artifact=JSON.parse(raw);deployment[role]={nonce,address:cast('compute-address',accounts.deployer.address,'--nonce',String(nonce)).match(/0x[0-9a-fA-F]{40}/)[0],artifactPath,artifactSha256:sha(raw),artifact,patches:[]};}
const addr=r=>deployment[r].address;
const origin=hash(abi('bytes32,uint256,address',[h('efs2/origin/1'),31337,addr('Ledger')]));
const realm=hash(abi('bytes32,uint256,address',[h('efs2/realm/1'),31337,addr('Ledger')]));
const principal=(kind,o,a)=>hash(abi('uint8,bytes32,address',[kind,o,a]));
const principals={bootstrap:principal(2,origin,accounts.deployer.address),A:principal(1,z,accounts.authorA.address),B:principal(2,origin,addr('Producer'))};
function patch(bytes,start,length,value){return bytes.slice(0,2+start*2)+hx(value).padStart(length*2,'0')+bytes.slice(2+(start+length)*2);}
for(const [role] of allocation){const d=deployment[role];let runtime=d.artifact.deployedBytecode.object;let creation=d.artifact.bytecode.object;
  for(const [path,libs] of Object.entries(d.artifact.bytecode.linkReferences||{}))for(const [lib,offsets]of Object.entries(libs))for(const p of offsets){creation=patch(creation,p.start,p.length,addr(lib));d.patches.push({section:'creation',...p,name:lib,value:addr(lib)});}
  for(const [path,libs] of Object.entries(d.artifact.deployedBytecode.linkReferences||{}))for(const [lib,offsets]of Object.entries(libs))for(const p of offsets){runtime=patch(runtime,p.start,p.length,addr(lib));d.patches.push({section:'runtime',...p,name:lib,value:addr(lib)});}
  const values=role==='ImportLib'?{library_deploy_address:addr(role)}:role==='IndexModule'?{'3835':accounts.deployer.address,'3837':z}:role==='Ledger'?{'4429':addr('IndexModule'),'4431':deployment.IndexModule.runtimeKeccak,'4433':realm}:role==='LensReader'?{'5090':addr('Ledger'),'5093':addr('IndexModule')}:{};
  for(const [id,offsets]of Object.entries(d.artifact.deployedBytecode.immutableReferences||{}))for(const p of offsets){if(!values[id])throw new Error(`Unknown immutable ${role}:${id}`);runtime=patch(runtime,p.start,p.length,values[id]);d.patches.push({section:'runtime',...p,name:id,value:word(values[id])});}
  d.constructorTypes=role==='IndexModule'?'bytes32':role==='Ledger'?'address':role==='LensReader'?'address,address':'';
  d.constructorArgs=role==='IndexModule'?[z]:role==='Ledger'?[addr('IndexModule')]:role==='LensReader'?[addr('Ledger'),addr('IndexModule')]:[];
  d.constructorSuffix=d.constructorTypes?abi(d.constructorTypes,d.constructorArgs):'0x';
  d.creationKeccak=hash(creation);d.initCodeKeccak=hash(creation+hx(d.constructorSuffix));d.runtimeKeccak=hash(runtime);
  d.creationBytes=(creation.length-2)/2;d.initCodeBytes=d.creationBytes+(d.constructorSuffix.length-2)/2;d.runtimeBytes=(runtime.length-2)/2;
  d.byteSource={creation:'artifact.bytecode.object + listed creation link patches + constructorSuffix',runtime:'artifact.deployedBytecode.object + listed runtime link and immutable patches'};
}
const core=deployment.Ledger.runtimeKeccak;
const constants={TYPE_META:h('efs2/lab-c/type-meta/2'),PROFILE:h('efs2/lab-c/acceptance/2'),OBLIGATIONS:h('efs2/lab-c/index-obligations/1'),HEAD:h('efs2/lab-c/purpose/head'),FOLDER:h('efs2/lab-c/purpose/folder'),TAG:h('efs2/lab-c/purpose/tag'),COUNTER:h('efs2/lab-c/counter/admissions')};
const coord={salt:h('typed-file'),folder:h('/swaps'),name:h('eth-usdc'),tag:h('market'),note:h('reference quote')};
coord.file=hash(abi('bytes32,bytes32,bytes32',[h('efs2/subject/1'),principals.A,coord.salt]));
const types={};
function typ(name,refs,rule){const shape=h(name),ruleHash=deployment[rule].runtimeKeccak,body=abi('bytes32,bytes32[],bytes32',[shape,array(refs),ruleHash]);return {name,shape,refTypes:refs,acceptor:addr(rule),mandatoryRule:ruleHash,body,id:hash(abi('bytes32,bytes32',[constants.TYPE_META,hash(body)]))};}
types.Item=typ('Item',[],'PassAcceptor');types.Pair=typ('Pair',[types.Item.id,types.Item.id],'PassAcceptor');types.Quote=typ('Quote',[types.Pair.id],'QuoteAcceptorV1');types.Bytes=typ('Bytes',[],'PassAcceptor');
const records={};
function rec(type,refs,payload){const body=abi('bytes32[],bytes',[array(refs),payload]);return {typeId:type.id,refs,payload,body,id:hash(abi('bytes32,bytes32',[type.id,hash(body)]))};}
records.ETH=rec(types.Item,[],utf8('ETH'));records.USDC=rec(types.Item,[],utf8('USDC'));records.Pair=rec(types.Pair,[records.ETH.id,records.USDC.id],'0x');
for(const [name,mantissa]of [['A1',2500000000],['A2',2502000000],['B1',2501000000]])records[name]={...rec(types.Quote,[records.Pair.id],abi('uint256,uint8,uint64,bytes32',[mantissa,6,1800000000,coord.note])),mantissa};
const actionTypes='uint8,bytes32,uint8,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,bytes32';
const actionKeys=['kind','typeId','digestKind','digest','purpose','subject','role','target','expectedRevision','salt'];
const act=over=>Object.assign({kind:0,typeId:z,digestKind:0,digest:z,purpose:z,subject:z,role:z,target:z,expectedRevision:0,salt:z},over);
const declare=t=>act({kind:1,typeId:constants.TYPE_META,digestKind:1,digest:hash(t.body),target:word(t.acceptor)});
const record=r=>act({kind:2,typeId:r.typeId,digestKind:1,digest:hash(r.body)});
const bind=(purpose,subject,role,target,expectedRevision=0)=>act({kind:4,purpose,subject,role,target,expectedRevision});
const subject=act({kind:3,subject:coord.file,salt:coord.salt});
const publications={};let frontier=0;
function pub(name,author,nonce,proofKind,actions,bodies){const a=actions.map(x=>tuple(actionKeys.map(k=>x[k]))),actionsHash=hash(abi(`(${actionTypes})[]`,[array(a)]));const publicationId=hash(abi('bytes32,uint64,bytes32',[author,nonce,actionsHash]));const p={author,nonce,deadline:0,acceptanceProfile:constants.PROFILE,indexObligations:constants.OBLIGATIONS,actions,bodies,proofKind,actionsHash,publicationId,basis:frontier,firstAdmission:frontier+1,leafCount:actions.length};frontier+=actions.length;p.frontier=frontier;publications[name]=p;return p;}
pub('BOOTSTRAP',principals.bootstrap,1,1,Object.values(types).map(declare).concat([records.ETH,records.USDC,records.Pair].map(record)),Object.values(types).map(t=>t.body).concat([records.ETH.body,records.USDC.body,records.Pair.body]));
pub('A1',principals.A,1,2,[subject,record(records.A1),bind(constants.HEAD,coord.file,z,records.A1.id),bind(constants.FOLDER,coord.folder,coord.name,coord.file),bind(constants.TAG,coord.file,coord.tag,word(1))],['0x',records.A1.body,'0x','0x','0x']);
pub('A2',principals.A,2,2,[record(records.A2),bind(constants.HEAD,coord.file,z,records.A2.id,1)],[records.A2.body,'0x']);
pub('B1',principals.B,1,1,[record(records.B1),bind(constants.HEAD,coord.file,z,records.B1.id)],[records.B1.body,'0x']);
const intentType=`(bytes32,uint64,uint64,bytes32,bytes32,(${actionTypes})[])`;
const domain=hash(abi('bytes32,bytes32,bytes32',[h('EIP712Domain(string name,string version)'),h('EFS Lab C'),h('1')]));
const intentHash=h('PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,bytes32 author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)');
for(const [name,p]of Object.entries(publications)){p.intentTuple=tuple([p.author,p.nonce,p.deadline,p.acceptanceProfile,p.indexObligations,array(p.actions.map(a=>tuple(actionKeys.map(k=>a[k]))))]);p.intentAbi=abi(intentType,[p.intentTuple]);p.intentDigest=hash('0x1901'+hx(domain)+hx(hash(abi('bytes32,bytes32,bytes32,bytes32,uint64,uint64,bytes32,bytes32,bytes32',[intentHash,realm,core,p.author,p.nonce,0,constants.PROFILE,constants.OBLIGATIONS,p.actionsHash]))));
  p.target=name==='B1'?addr('Producer'):addr('Ledger');p.caller=accounts.deployer.address;
  if(p.proofKind===2){const raw=signPublicTestDigest(p.intentDigest);p.signature={v:Number.parseInt(raw.slice(130,132),16),r:raw.slice(0,66),s:'0x'+raw.slice(66,130),raw,signer:accounts.authorA.address};if(![27,28].includes(p.signature.v))throw new Error('signature v');const verified=cast('wallet','verify','--no-hash','--address',accounts.authorA.address,p.intentDigest,raw);if(!verified.includes('Validation succeeded.'))throw new Error('signature verification: '+verified);p.signature.verification=verified;}else p.signature={v:0,r:z,s:z};
  p.calldata=p.proofKind===2?call(`publishSigned(${intentType},bytes[],(uint8,bytes32,bytes32))`,[p.intentTuple,array(p.bodies),tuple([p.signature.v,p.signature.r,p.signature.s])]):name==='B1'?call(`publish(address,${intentType},bytes[])`,[addr('Ledger'),p.intentTuple,array(p.bodies)]):call(`publishNative(${intentType},bytes[])`,[p.intentTuple,array(p.bodies)]);
  p.calldataStatus='EXACT';
}
const bindingKey=(author,purpose,subject,role)=>hash(abi('bytes32,bytes32,bytes32,bytes32',[author,purpose,subject,role]));
const bindings={AHead:{author:principals.A,purpose:constants.HEAD,subject:coord.file,role:z,target:records.A2.id,revision:2,admission:14,history:[10,14]},BHead:{author:principals.B,purpose:constants.HEAD,subject:coord.file,role:z,target:records.B1.id,revision:1,admission:16,history:[16]},Placement:{author:principals.A,purpose:constants.FOLDER,subject:coord.folder,role:coord.name,target:coord.file,revision:1,admission:11,history:[11]},Tag:{author:principals.A,purpose:constants.TAG,subject:coord.file,role:coord.tag,target:word(1),revision:1,admission:12,history:[12]}};
for(const b of Object.values(bindings))b.key=bindingKey(b.author,b.purpose,b.subject,b.role);
const scopes={head:hash(abi('bytes32,bytes32',[constants.HEAD,coord.file])),folder:hash(abi('bytes32,bytes32',[constants.FOLDER,coord.folder])),tag:hash(abi('bytes32,bytes32',[constants.TAG,coord.tag]))};
const expectationTypes='bytes32,bytes32,uint32,bytes32,uint8,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,uint256,uint8,uint64,bytes32,uint64';
const paid=[];
for(const [label,selected,order]of [['A_FIRST','A2',[principals.A,principals.B]],['B_FIRST','B1',[principals.B,principals.A]]])for(const kind of ['POINT','LIST']){
const p=publications[selected],b=bindings[selected==='A2'?'AHead':'BHead'];const lens={principals:order,mode:0};const lensTuple=tuple([array(order),0]);const lensHash=hash(abi('bytes32[],uint8',[array(order),0]));
const e={subject:coord.file,expectedHead:records[selected].id,selectedRevision:b.revision,selectedAuthor:p.author,selectedProofKind:p.proofKind,quoteType:types.Quote.id,pairType:types.Pair.id,itemType:types.Item.id,pairId:records.Pair.id,itemA:records.ETH.id,itemB:records.USDC.id,mantissa:records[selected].mantissa,scale:6,observedAt:1800000000,noteCommitment:coord.note,basisAdmission:frontier};
const placement={folder:coord.folder,name:coord.name,actor:principals.A,proofKind:2,publicationId:publications.A1.publicationId,revision:1,budget:10};
const sig=kind==='POINT'?`paidPoint(address,address,(bytes32[],uint8),(${expectationTypes}))`:`paidList(address,address,(bytes32[],uint8),(${expectationTypes}),(bytes32,bytes32,bytes32,uint8,bytes32,uint32,uint32))`;
const args=[addr('LensReader'),addr('Ledger'),lensTuple,tuple(Object.values(e))];if(kind==='LIST')args.push(tuple(Object.values(placement)));
const selection={basisAdmission:16,indexGeneration:1,rulesEpoch:1,coreCodeCommitment:core,realmId:realm,lensHash,subject:coord.file,selectedHead:records[selected].id,selectedRevision:b.revision,selectedAdmission:b.admission,selectedBindingKey:b.key,selectedPublication:p.publicationId,selectedAuthor:p.author,selectedProofKind:p.proofKind,selectedSourceGrade:0,quoteFirstAdmission:p.firstAdmission,pairId:records.Pair.id,itemA:records.ETH.id,itemB:records.USDC.id,mantissa:records[selected].mantissa,scale:6,observedAt:1800000000,note:coord.note};
const placementObserved={folder:coord.folder,name:coord.name,target:coord.file,actor:principals.A,revision:1,admission:11,bindingKey:bindings.Placement.key,publicationId:publications.A1.publicationId,proofKind:2,sourceGrade:0,basisAdmission:16,pageStatus:1,rawTotal:1,scanned:1,hydrated:label==='A_FIRST'?4:5,selected:1,endPosition:1,ended:true,coverageStatus:1,coverageThrough:16};
const selTypes='uint64,uint32,uint32,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,uint64,bytes32,bytes32,bytes32,uint8,uint8,uint64,bytes32,bytes32,bytes32,uint256,uint8,uint64,bytes32';
const placeTypes='bytes32,bytes32,bytes32,bytes32,uint32,uint64,bytes32,bytes32,uint8,uint8,uint64,uint8,uint32,uint32,uint32,uint32,uint32,bool,uint8,uint64';
if(kind==='POINT')for(const [k,v]of Object.entries(placementObserved))placementObserved[k]=typeof v==='boolean'?false:typeof v==='string'?z:0;
const kindHash=h(kind==='POINT'?'road-c/measurement/paid-point/2':'road-c/measurement/paid-list/2');
const sv=tuple(Object.values(selection)),pv=tuple(Object.values(placementObserved));
const commitment=hash(abi(`bytes32,(${selTypes}),(${placeTypes})`,[kindHash,sv,pv]));
paid.push({row:kind+'_'+label,caller:accounts.paidCaller.address,target:addr('MeasurementConsumer'),lens,lensHash,expect:e,...(kind==='LIST'?{placementExpect:placement}:{}),calldata:call(sig,args),expectedSelection:selection,expectedPlacement:placementObserved,expectedCommitment:commitment,expectedReturn:kind==='POINT'?abi(`bytes32,(${selTypes})`,[commitment,sv]):abi(`bytes32,(${selTypes}),(${placeTypes})`,[commitment,sv,pv]),expectedEvent:{indexedKind:kindHash,data:abi(`bytes32,(${selTypes}),(${placeTypes})`,[commitment,sv,pv])}});
}
const tables={};for(const file of ['LedgerTables.sol','IndexTables.sol']){const text=fs.readFileSync(`${src}/src/tables/${file}`,'utf8');for(const match of text.matchAll(/library (\w+) \{([\s\S]*?)(?=\nlibrary |$)/g)){const id=match[2].match(/_tableId = ResourceId.wrap\((0x[0-9a-f]+)\)/)?.[1];const layout=match[2].match(/_fieldLayout =\s*FieldLayout.wrap\((0x[0-9a-f]+)\)/)?.[1]||(match[2].includes('_fieldLayout = LAYOUT_ONE_DYNAMIC')?'0x0000000100000000000000000000000000000000000000000000000000000000':null);if(id&&layout)tables[match[1]]={id,layout,target:file==='LedgerTables.sol'?addr('Ledger'):addr('IndexModule')};}}
const reads=[];const lengths=n=>word(BigInt(n)|(BigInt(n)<<56n));
function row(label,table,key,stat,dyn='0x',masked=[]){const t=tables[table];const n=(dyn.length-2)/2;const staticBytes=Number.parseInt(t.layout.slice(2,6),16);if((stat.length-2)/2!==staticBytes)throw new Error(`static length ${label} ${(stat.length-2)/2} != ${staticBytes}`);
const data=call('getRecord(bytes32,bytes32[],bytes32)',[t.id,array([key]),t.layout]);const response=abi('bytes,bytes32,bytes',[stat,lengths(n),dyn]);const pre=abi('bytes,bytes32,bytes',['0x'+'00'.repeat(staticBytes),z,'0x']);reads.push({label,target:t.target,table,key,calldata:data,initialExpected:pre,postB1Expected:response,...(masked.length?{postB1Mask:{uncheckedStaticByteRanges:masked,uncheckedReturnByteRanges:masked.map(x=>({...x,start:x.start+128})),reason:'EOA signature not supplied; compare all other bytes. Require independent recovery against intentDigest before treating authorship verified.'}}:{})});}
for(const [i,t]of Object.values(types).entries()){row(`TypeRecord:${t.name}`,'Records',t.id,pack('bytes32,uint64',[constants.TYPE_META,i+1]),t.body);row(`Type:${t.name}`,'Types',t.id,pack('address,bytes32,uint64',[t.acceptor,t.mandatoryRule,i+1]),'0x'+t.refTypes.map(hx).join(''));}
for(const [name,ordinal]of [['ETH',5],['USDC',6],['Pair',7],['A1',9],['A2',13],['B1',15]]){const r=records[name];row(`Record:${name}`,'Records',r.id,pack('bytes32,uint64',[r.typeId,ordinal]),r.body);}
row('FileSubject','Subjects',coord.file,pack('bytes32,bytes32,uint64',[principals.A,coord.salt,8]));
for(const [name,b]of Object.entries(bindings)){row(`Binding:${name}`,'Bindings',b.key,pack('bytes32,uint32,uint64',[b.target,b.revision,b.admission]));row(`History:${name}`,'BindingHistory',b.key,'0x',pack(b.history.map(()=>'uint64').join(','),b.history));}
for(const [name,p]of Object.entries(publications)){
for(const [i,a]of p.actions.entries())row(`Admission:${name}:${i}`,'Admissions',word(p.firstAdmission+i),pack('bytes32,'+actionTypes,[p.publicationId,...actionKeys.map(k=>a[k])]));
const ev=pack('bytes32,uint8,bytes32,bytes32,uint8,uint64,uint64,bytes32,bytes32,bytes32,uint64,uint16,uint64,bytes32,bytes32,bytes32,uint8',[p.author,p.proofKind,p.signature.r,p.signature.s,p.signature.v,p.nonce,0,p.acceptanceProfile,p.indexObligations,p.actionsHash,p.firstAdmission,p.leafCount,p.basis,realm,core,z,0]);row(`Evidence:${name}`,'Evidence',p.publicationId,ev);
}
row('Nonce:bootstrap','Nonces',principals.bootstrap,pack('uint64',[1]));row('Nonce:A','Nonces',principals.A,pack('uint64',[2]));row('Nonce:B','Nonces',principals.B,pack('uint64',[1]));row('AdmissionFrontier','Counters',constants.COUNTER,pack('uint64',[16]));
row('Scope:HEAD','Scopes',scopes.head,'0x',pack('bytes32,bytes32,bytes32,bytes32,bytes32,bytes32',[principals.A,z,bindings.AHead.key,principals.B,z,bindings.BHead.key]));
row('Scope:FOLDER','Scopes',scopes.folder,'0x',pack('bytes32,bytes32,bytes32',[principals.A,coord.name,bindings.Placement.key]));
row('Scope:TAG','Scopes',scopes.tag,'0x',pack('bytes32,bytes32,bytes32',[principals.A,coord.file,bindings.Tag.key]));
const identityReads=[];function view(target,sig,types,value,args=[]){identityReads.push({target:addr(target),calldata:call(sig,args),label:target+'.'+sig,expected:abi(types,value)});}
view('Ledger','realmId()','bytes32',[realm]);view('Ledger','realmOrigin()','bytes32',[origin]);view('Ledger','coreCodeCommitment()','bytes32',[core]);view('Ledger','index()','address',[addr('IndexModule')]);view('Ledger','indexCodehash()','bytes32',[deployment.IndexModule.runtimeKeccak]);view('Ledger','rulesEpoch()','uint32',[1]);view('IndexModule','ledger()','address',[addr('Ledger')]);view('IndexModule','ledgerCodehash()','bytes32',[core]);view('IndexModule','generation()','uint32',[1]);view('LensReader','ledger()','address',[addr('Ledger')]);view('LensReader','index()','address',[addr('IndexModule')]);
const basisReads=[{label:'Ledger.highWater()',target:addr('Ledger'),calldata:call('highWater()'),initialExpected:abi('uint64',[0]),postB1Expected:abi('uint64',[16])},{label:'IndexModule.coverage(FAMILY_SCOPES,folderScope)',target:addr('IndexModule'),calldata:call('coverage(bytes32,bytes32)',[h('efs2/lab-c/index/scopes'),scopes.folder]),initialExpected:abi('uint8,uint64',[1,0]),postB1Expected:abi('uint8,uint64',[1,16])}];
const sources=['src/EfsTypes.sol','src/ActionLib.sol','src/Ledger.sol','src/IndexModule.sol','src/LensReader.sol','src/tables/LedgerTables.sol','src/tables/IndexTables.sol','test/MeasurementConsumer.sol','test/FixtureActors.sol','vendor/@latticexyz/store/src/EncodedLengths.sol'].map(path=>({path,sha256:sha(fs.readFileSync(`${src}/${path}`))}));
for(const d of Object.values(deployment)){d.abiCanonicalSha256=sha(JSON.stringify(d.artifact.abi));delete d.artifact;}
if(frontier!==16 || paid.length!==4)throw new Error('derivation invariant');
const neutralPath='/Users/james/Code/EFS/planning/Reviews/2026-09-12-efs-path-decision/paid-neutral-expectations.json';
const result={kind:'C_NATIVE_POSITIVE_TYPED_JOINED_INPUTS',status:'DRAFT_FOR_ROOT_REVIEW_NOT_EXECUTED_SEAL',sourceRevision:'2ca7349e5d683c3ff10651c0fc106c10da946145',evidenceCeiling:'RPC_OBSERVED',neutralExpectation:{path:neutralPath,sha256:sha(fs.readFileSync(neutralPath))},sources,accounts,chainId:31337,deployment,attachment:{deployerNonce:3,target:addr('IndexModule'),calldata:call('attach(address)',[addr('Ledger')])},realm,origin,core,principals,constants,coordinates:coord,types,records,publications,frontiers:{initial:0,BOOTSTRAP:7,A1:12,A2:14,B1:16},bindings,scopes,paid,identityReads,basisReads,rawReadChecks:reads,gates:['Source/artifact/deployment hashes and these vectors require root review and timestamp/hash sealing before publication.','A1/A2 use independent offline deterministic public-test-account1 signatures over the independently derived intent digests; all outer publication callers are public test account0.','Verify actual deployed runtimes against reconstructed hashes and retain prepublication qualified block before publishing anything.','Capture exact post-B1 block/hash/snapshot separately before paid calls; no chain-state proof is established.','Rollback trigger is outside this positive-only preparation task and remains an explicit later gate.'],staleSourceComment:'EfsTypes top-level PRINCIPAL_CONTRACT comment mentions coreCodeCommitment; concrete realmOrigin implementation uses chainId and Ledger address.'};
process.stdout.write(JSON.stringify(result)+'\n');
