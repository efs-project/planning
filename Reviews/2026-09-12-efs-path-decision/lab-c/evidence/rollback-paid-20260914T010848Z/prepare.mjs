// Independent C control preparation. No compiler, provider, RPC, runner or observed result inputs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {instantiate} from './runtime.mjs';
const require=createRequire(import.meta.url);
export const ethers=require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
const {AbiCoder,HDNodeWallet,getCreateAddress,keccak256,toUtf8Bytes,Interface,solidityPacked,recoverAddress}=ethers;
const abi=AbiCoder.defaultAbiCoder();
export const Z='0x'+'00'.repeat(32),ZERO_ADDRESS='0x'+'00'.repeat(20);
export const enc=(ts,vs)=>abi.encode(ts,vs).toLowerCase(),word=x=>enc(['uint256'],[x]);
export const hash=(ts,vs)=>keccak256(enc(ts,vs)),text=s=>keccak256(toUtf8Bytes(s));
export const pack=(ts,vs)=>solidityPacked(ts,vs).toLowerCase();
export const lengths=n=>word(BigInt(n)|(BigInt(n)<<56n));
const zeros=n=>'0x'+'00'.repeat(n),bytes=x=>(x.length-2)/2,cat=(...xs)=>'0x'+xs.map(x=>x.slice(2)).join('');
export const chunks=(data,n=Math.ceil(bytes(data)/32))=>Array.from({length:n},(_,i)=>'0x'+data.slice(2+i*64,2+(i+1)*64).padEnd(64,'0'));
const call=(sig,args=[])=>new Interface(['function '+sig]).encodeFunctionData(sig.slice(0,sig.indexOf('(')),args).toLowerCase();
const error=(sig,args)=>new Interface(['error '+sig]).encodeErrorResult(sig.slice(0,sig.indexOf('(')),args).toLowerCase();
export const sha=x=>createHash('sha256').update(x).digest('hex');
const wallet=i=>HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',undefined,`m/44'/60'/0'/0/${i}`);
export const LAB='/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c';
export const ART='/tmp/efs-c-readiness-build-20260913.NoPDle/out';
export const roles=[['ImportLib',0,'src/ImportLib.sol',[]],['IndexModule',1,'src/IndexModule.sol',['bytes32']],['Ledger',2,'src/Ledger.sol',['address']],['PassAcceptor',4,'test/FixtureActors.sol',[]],['QuoteAcceptorV1',5,'test/FixtureActors.sol',[]],['Producer',6,'test/FixtureActors.sol',[]]];
const actionKeys=['kind','typeId','digestKind','digest','purpose','subject','role','target','expectedRevision','salt'];
const ACTION='(uint8,bytes32,uint8,bytes32,bytes32,bytes32,bytes32,bytes32,uint32,bytes32)';
const INTENT=`(bytes32,uint64,uint64,bytes32,bytes32,${ACTION}[])`;
const action=o=>({kind:0,typeId:Z,digestKind:0,digest:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z,...o});
const aTuple=a=>actionKeys.map(k=>a[k]);
const pTuple=p=>[p.author,p.nonce,p.deadline,p.acceptanceProfile,p.indexObligations,p.actions.map(aTuple)];
export const constants={TYPE_META:text('efs2/lab-c/type-meta/2'),PROFILE:text('efs2/lab-c/acceptance/2'),OBLIGATIONS:text('efs2/lab-c/index-obligations/1'),COUNTER:text('efs2/lab-c/counter/admissions'),HEAD:text('efs2/lab-c/purpose/head'),FOLDER:text('efs2/lab-c/purpose/folder'),TAG:text('efs2/lab-c/purpose/tag')};
const recordId=(type,body)=>hash(['bytes32','bytes32'],[type,keccak256(body)]);
export const principal=(kind,origin,address)=>hash(['uint8','bytes32','address'],[kind,origin,address]);
const binding=(A,purpose,subject,role)=>hash(['bytes32','bytes32','bytes32','bytes32'],[A,purpose,subject,role]);
const scope=(purpose,subject)=>hash(['bytes32','bytes32'],[purpose,subject]);
const familyNames=['scopes','binding-history','backlinks','by-type','by-author','occurrences','optional-digest'];
const familyIds=familyNames.map(n=>text('efs2/lab-c/index/'+n));
export function readTables(){
 const tableFiles=['LedgerTables.sol','IndexTables.sol'],tables={};
 const literals={KEY_BYTES32:'0x002001005f000000000000000000000000000000000000000000000000000000',KEY_UINT64:'0x0008010007000000000000000000000000000000000000000000000000000000',LAYOUT_ONE_DYNAMIC:'0x0000000100000000000000000000000000000000000000000000000000000000',SCHEMA_BYTES32_ARRAY:'0x00000001c1000000000000000000000000000000000000000000000000000000',SCHEMA_UINT64_ARRAY:'0x0000000169000000000000000000000000000000000000000000000000000000'};
 for(const file of tableFiles){const source=fs.readFileSync(`${LAB}/src/tables/${file}`,'utf8');
  for(const match of source.matchAll(/library (\w+) \{([\s\S]*?)(?=\nlibrary |$)/g)){
   const [,name,body]=match,id=body.match(/_tableId = ResourceId.wrap\((0x[0-9a-f]{64})\)/)?.[1];if(!id)continue;
   const field=key=>{const expr=body.match(new RegExp(key+' =\\s*([^;]+);'))?.[1];assert(expr,'missing table '+key);const value=expr.match(/\.wrap\((0x[0-9a-f]{64})\)/)?.[1]??literals[expr];assert(value,'unknown table constant '+expr);return value;};
   tables[name]={id,layout:field('_fieldLayout'),keySchema:field('_keySchema'),valueSchema:field('_valueSchema'),target:file==='LedgerTables.sol'?'Ledger':'IndexModule'};
   const t=tables[name];t.staticBytes=Number.parseInt(t.layout.slice(2,6),16);t.staticFields=Number.parseInt(t.layout.slice(6,8),16);t.dynamicFields=Number.parseInt(t.layout.slice(8,10),16);assert(t.dynamicFields<=1,'unsupported multiple dynamics');
  }
 }
 assert.equal(Object.keys(tables).length,15);assert.equal(tables.Evidence.staticBytes,325);assert.equal(tables.Evidence.dynamicFields,0);
 return tables;
}
export const slot=(space,table,key)=>word(BigInt(text(space))^BigInt(keccak256(cat(table,key))));
const at=(base,i)=>word((BigInt(base)+BigInt(i))&((1n<<256n)-1n));
export function derive(details=false){
 assert.equal(ethers.version,'6.15.0','dependency version');
 const artifacts={},artifactSha256={},sourceSha256={};
 for(const [role,,sourceName]of roles){const path=`${ART}/${sourceName.split('/').at(-1)}/${role}.json`,raw=fs.readFileSync(path);artifacts[role]=JSON.parse(raw);artifactSha256[path]=sha(raw);}
 // Compiler metadata content hashes bind every transitive source used by these six artifacts.
 for(const a of Object.values(artifacts)){
  assert.equal(a.metadata.compiler.version,'0.8.30+commit.73712a01');assert.equal(a.metadata.settings.evmVersion,'cancun');assert.equal(a.metadata.settings.viaIR,true);
  for(const [name,meta]of Object.entries(a.metadata.sources)){
   const path=name.startsWith('@latticexyz/')?`${LAB}/vendor/${name}`:`${LAB}/${name}`;
   const raw=fs.readFileSync(path);assert.equal(keccak256(raw),meta.keccak256,'compiler source '+name);sourceSha256[path]=sha(raw);
  }
 }
 const tables=readTables(),authorWallet=wallet(1),authorAddress=authorWallet.address.toLowerCase(),A=principal(1,Z,authorAddress);
 const coordinates={salt:text('typed-file'),folder:text('/swaps'),name:text('eth-usdc'),tag:text('market'),note:text('reference quote')};
 coordinates.subject=hash(['bytes32','bytes32','bytes32'],[text('efs2/subject/1'),A,coordinates.salt]);
 const output={schema:'efs-lab-c/rollback-expectations/1',source:{commit:'2ca7349e5d683c3ff10651c0fc106c10da946145',successor:'c6fce9d5afaefca1071b09340fe4a1468477b6e4',artifactSha256,sourceSha256,preparationSha256:{prepare:sha(fs.readFileSync(new URL(import.meta.url))),runtime:sha(fs.readFileSync(new URL('./runtime.mjs',import.meta.url)))},node:process.version,ethers:ethers.version},chain:{chainId:'31337',genesisBlock:'0',genesisTimestamp:'1800000000',blockGasLimit:'30000000'},tables,arms:{}};
 for(const [armIndex,name]of ['scale7','lateIndex','calibration'].entries()){
  const deployerIndex=armIndex+2,deployer=wallet(deployerIndex).address.toLowerCase(),addresses=Object.fromEntries(roles.map(([r,n])=>[r,getCreateAddress({from:deployer,nonce:n}).toLowerCase()]));
  const poison=name==='lateIndex'?coordinates.tag:Z;
  const realm=hash(['bytes32','uint256','address'],[text('efs2/realm/1'),31337,addresses.Ledger]);
  const origin=hash(['bytes32','uint256','address'],[text('efs2/origin/1'),31337,addresses.Ledger]);
  const prefixPrincipal=principal(2,origin,addresses.Producer),runtimePins={};
  const deployment=roles.map(([role,nonce,sourceName,constructorTypes])=>{
   const immutableValues=role==='ImportLib'?{library_deploy_address:enc(['address'],[addresses.ImportLib])}:role==='IndexModule'?{deployer:enc(['address'],[deployer]),poisonConcept:poison}:role==='Ledger'?{index:enc(['address'],[addresses.IndexModule]),indexCodehash:runtimePins.IndexModule.runtimeCodehash,realmId:realm}:{};
   const constructorArgs=role==='IndexModule'?[poison]:role==='Ledger'?[addresses.IndexModule]:[];
   const p=instantiate({artifact:artifacts[role],sourceName,contractName:role,immutableValues,libraryAddress:addresses.ImportLib,constructorTypes,constructorArgs});runtimePins[role]=p;
   return {role,nonce,address:addresses[role],initcodeHash:p.initcodeHash,initcodeBytes:p.initcodeBytes,runtimeCodehash:p.runtimeCodehash,runtimeBytes:p.runtimeBytes};
  });
  const core=runtimePins.Ledger.runtimeCodehash,types={};
  for(const [label,refs,rule]of [['Item',[],'PassAcceptor'],['Pair',null,'PassAcceptor'],['Quote',null,'QuoteAcceptorV1']]){
   const refTypes=refs??(label==='Pair'?[types.Item.id,types.Item.id]:[types.Pair.id]),shape=text(label),mandatoryRule=runtimePins[rule].runtimeCodehash,body=enc(['bytes32','bytes32[]','bytes32'],[shape,refTypes,mandatoryRule]);
   types[label]={id:recordId(constants.TYPE_META,body),shape,refTypes,acceptor:addresses[rule],mandatoryRuleId:mandatoryRule,body};
  }
  const makeRecord=(type,refs,payload)=>{const body=enc(['bytes32[]','bytes'],[refs,payload]);return {typeId:type.id,refs,payload,body,id:recordId(type.id,body)};};
  const records={};records.ETH=makeRecord(types.Item,[],toUtf8Bytes('ETH'));records.USDC=makeRecord(types.Item,[],toUtf8Bytes('USDC'));
  // JSON retains canonical hex, not TypedArray objects.
  records.ETH.payload='0x455448';records.USDC.payload='0x55534443';
  records.Pair=makeRecord(types.Pair,[records.ETH.id,records.USDC.id],'0x');
  records.Quote=makeRecord(types.Quote,[records.Pair.id],enc(['uint256','uint8','uint64','bytes32'],[2500000000,name==='scale7'?7:6,1800000000,coordinates.note]));
  assert.equal(bytes(records.Quote.body),288);
  const declare=t=>action({kind:1,typeId:constants.TYPE_META,digestKind:1,digest:keccak256(t.body),target:enc(['address'],[t.acceptor])});
  const publish=r=>action({kind:2,typeId:r.typeId,digestKind:1,digest:keccak256(r.body)});
  const bind=(purpose,subject,role,target)=>action({kind:4,purpose,subject,role,target});
  const prefixActions=[...Object.values(types).map(declare),...[records.ETH,records.USDC,records.Pair].map(publish)],prefixBodies=[...Object.values(types).map(t=>t.body),records.ETH.body,records.USDC.body,records.Pair.body];
  const actions=[action({kind:3,subject:coordinates.subject,salt:coordinates.salt}),publish(records.Quote),bind(constants.HEAD,coordinates.subject,Z,records.Quote.id),bind(constants.FOLDER,coordinates.folder,coordinates.name,coordinates.subject),bind(constants.TAG,coordinates.subject,coordinates.tag,word(1))],bodies=['0x',records.Quote.body,'0x','0x','0x'];
  const publication=(author,acts,bs,deadline,first,basis,signed)=>{
   const intent={author,nonce:1,deadline,acceptanceProfile:constants.PROFILE,indexObligations:constants.OBLIGATIONS,actions:acts};
   const actionsHash=hash([ACTION+'[]'],[acts.map(aTuple)]),publicationId=hash(['bytes32','uint64','bytes32'],[author,1,actionsHash]);
   const domain=hash(['bytes32','bytes32','bytes32'],['EIP712Domain(string name,string version)','EFS Lab C','1'].map(text));
   const struct=hash(['bytes32','bytes32','bytes32','bytes32','uint64','uint64','bytes32','bytes32','bytes32'],[text('PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,bytes32 author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)'),realm,core,author,1,deadline,constants.PROFILE,constants.OBLIGATIONS,actionsHash]);
   const digest=keccak256(cat('0x1901',domain,struct)),s=signed?authorWallet.signingKey.sign(digest):null,signature=s?{v:s.v,r:s.r,s:s.s}:{v:0,r:Z,s:Z};
   if(s)assert.equal(recoverAddress(digest,s).toLowerCase(),authorAddress);
   const calldata=signed?call(`publishSigned(${INTENT},bytes[],(uint8,bytes32,bytes32))`,[pTuple(intent),bs,[signature.v,signature.r,signature.s]]):call(`publish(address,${INTENT},bytes[])`,[addresses.Ledger,pTuple(intent),bs]);
   return {intent,bodies:bs,signature,actionsHash,publicationId,digest,calldata,firstAdmission:first,basis,proofKind:signed?2:1};
  };
  const prefix=publication(prefixPrincipal,prefixActions,prefixBodies,0,1,0,false),a1=publication(A,actions,bodies,2000000000,7,6,true);
  const bindings={},scopes={};
  for(const n of ['head','folder','tag']){
   const purpose=constants[n.toUpperCase()],subject=n==='folder'?coordinates.folder:coordinates.subject,role=n==='head'?Z:n==='folder'?coordinates.name:coordinates.tag;
   bindings[n]={key:binding(A,purpose,subject,role),purpose,subject,role,target:n==='head'?records.Quote.id:n==='folder'?coordinates.subject:word(1)};
   scopes[n]=scope(purpose,n==='tag'?coordinates.tag:subject);
  }
  const fixture={coordinates,records,bindings,scopes,principals:{author:A,prefix:prefixPrincipal},realm,origin,core,poisonConcept:poison,prefix};
  const setupTransactions=[{label:'attach',from:deployer,to:addresses.IndexModule,nonce:3,data:call('attach(address)',[addresses.Ledger])},{label:'prefix',from:deployer,to:addresses.Producer,nonce:7,data:prefix.calldata}];
  const arm={deployerIndex,authorIndex:1,deployment,setupTransactions,types,fixture,a1,attempt:{from:authorAddress,to:addresses.Ledger,nonce:armIndex,data:a1.calldata,expectedStatus:name==='calibration'?1:0,errorData:name==='scale7'?error('Error(string)',['quote: scale must be 6']):name==='lateIndex'?error('IndexPoisoned(bytes32)',[poison]):null,returnData:name==='calibration'?enc(['bytes32','uint64'],[a1.publicationId,7]):null},readCalls:{},storageCalls:{},pre:{blockNumber:String(armIndex*9+8),reads:{},storage:{}},post:{blockNumber:String(armIndex*9+9),reads:{},storage:{}},runtimePreparation:runtimePins,rowManifest:{}};
  const stateRows=success=>{
   const rows={};
   const row=(label,table,key,staticData,dynamicData='0x',capacityData=dynamicData)=>{const t=tables[table];assert.equal(bytes(staticData),t.staticBytes,'static size '+label);assert(t.dynamicFields===1||dynamicData==='0x','unexpected dynamics');rows[label]={table,key,staticData,dynamicData,capacity:bytes(capacityData)};};
   const absent=(table)=>zeros(tables[table].staticBytes);
   Object.entries(types).forEach(([n,t],i)=>{row('TypeRecord.'+n,'Records',t.id,pack(['bytes32','uint64'],[constants.TYPE_META,i+1]),t.body);row('Type.'+n,'Types',t.id,pack(['address','bytes32','uint64'],[t.acceptor,t.mandatoryRuleId,i+1]),cat(...t.refTypes));});
   for(const [n,ord]of [['ETH',4],['USDC',5],['Pair',6],['Quote',8]]){const r=records[n],present=n!=='Quote'||success;row('Record.'+n,'Records',r.id,present?pack(['bytes32','uint64'],[r.typeId,ord]):absent('Records'),present?r.body:'0x',r.body);}
   for(const [p,present]of [[prefix,true],[a1,success]]){
    p.intent.actions.forEach((a,i)=>row('Admission.'+(p.firstAdmission+i),'Admissions',word(p.firstAdmission+i),present?pack(['bytes32','uint8','bytes32','uint8','bytes32','bytes32','bytes32','bytes32','bytes32','uint32','bytes32'],[p.publicationId,...aTuple(a)]):absent('Admissions')));
    const v=p.intent,s=p.signature;
    row('Evidence.'+(p===prefix?'prefix':'a1'),'Evidence',p.publicationId,present?pack(['bytes32','uint8','bytes32','bytes32','uint8','uint64','uint64','bytes32','bytes32','bytes32','uint64','uint16','uint64','bytes32','bytes32','bytes32','uint8'],[v.author,p.proofKind,s.r,s.s,s.v,v.nonce,v.deadline,v.acceptanceProfile,v.indexObligations,p.actionsHash,p.firstAdmission,v.actions.length,p.basis,realm,core,Z,0]):absent('Evidence'));
   }
   row('Subject.file','Subjects',coordinates.subject,success?pack(['bytes32','bytes32','uint64'],[A,coordinates.salt,7]):absent('Subjects'));
   Object.entries(bindings).forEach(([n,b],i)=>{row('Binding.'+n,'Bindings',b.key,success?pack(['bytes32','uint32','uint64'],[b.target,1,9+i]):absent('Bindings'));row('History.'+n,'BindingHistory',b.key,'0x',success?pack(['uint64'],[9+i]):'0x',zeros(8));
    const triple=pack(['bytes32','bytes32','bytes32'],[A,n==='tag'?coordinates.subject:b.role,b.key]);row('Scope.'+n,'Scopes',scopes[n],'0x',success?triple:'0x',triple);
   });
   row('Nonce.prefix','Nonces',prefixPrincipal,pack(['uint64'],[1]));row('Nonce.author','Nonces',A,pack(['uint64'],[success?1:0]));row('Counter.admissions','Counters',constants.COUNTER,pack(['uint64'],[success?11:6]));
   for(const [n,t]of Object.entries(types))row('Occurrences.Type.'+n,'Occurrences',t.id,pack(['uint32'],[1]));
   for(const [n,r]of Object.entries(records))row('Occurrences.Record.'+n,'Occurrences',r.id,pack(['uint32'],[n==='Quote'?(success?1:0):1]));
   for(const [n,key,data,capacity]of [['meta',constants.TYPE_META,cat(...Object.values(types).map(t=>t.id))],['Item',types.Item.id,cat(records.ETH.id,records.USDC.id)],['Pair',types.Pair.id,records.Pair.id],['Quote',types.Quote.id,success?records.Quote.id:'0x',records.Quote.id]])row('ByType.'+n,'ByType',key,'0x',data,capacity??data);
   row('ByAuthor.prefix','ByAuthor',prefixPrincipal,'0x',pack(Array(6).fill('uint64'),[1,2,3,4,5,6]));row('ByAuthor.author','ByAuthor',A,'0x',success?pack(Array(5).fill('uint64'),[7,8,9,10,11]):'0x',zeros(40));
   row('Backlink.ETH','Backlinks',records.ETH.id,'0x',records.Pair.id);row('Backlink.USDC','Backlinks',records.USDC.id,'0x',records.Pair.id);row('Backlink.Pair','Backlinks',records.Pair.id,'0x',success?records.Quote.id:'0x',records.Quote.id);
   familyIds.forEach((id,i)=>row('Coverage.'+familyNames[i],'Coverage',id,pack(['bool','bool','uint64','uint64'],[i<6,true,0,0])));
   return rows;
  };
  for(const stage of ['pre','post']){
   const success=stage==='post'&&name==='calibration',rows=stateRows(success),state=arm[stage];
   const read=(label,to,sig,args,returns,values)=>{assert(!arm.readCalls[label]||arm.readCalls[label].params[0].data===call(sig,args),'call drift');arm.readCalls[label]={method:'eth_call',params:[{to,data:call(sig,args)}]};state.reads[label]=enc(returns,values);};
   const store=(label,to,storageSlot,value)=>{assert(!arm.storageCalls[label]||arm.storageCalls[label].params[1]===storageSlot,'slot drift');arm.storageCalls[label]={method:'eth_getStorageAt',params:[to,storageSlot]};state.storage[label]=value;};
   for(const [label,r]of Object.entries(rows)){
    const t=tables[r.table],to=addresses[t.target];
    read('row.'+label,to,'getRecord(bytes32,bytes32[],bytes32)',[t.id,[r.key],t.layout],['bytes','bytes32','bytes'],[r.staticData,t.dynamicFields?lengths(bytes(r.dynamicData)):Z,r.dynamicData]);
    const base=slot('mud.store',t.id,r.key);chunks(r.staticData).forEach((w,i)=>store(label+'.static.'+i,to,at(base,i),w));
    if(t.dynamicFields){store(label+'.length',to,slot('mud.store.dynamicDataLength',t.id,r.key),lengths(bytes(r.dynamicData)));const dynamicBase=slot('mud.store.dynamicData',t.id,r.key);chunks(r.dynamicData,Math.ceil(r.capacity/32)).forEach((w,i)=>store(label+'.dynamic.'+i,to,at(dynamicBase,i),w));}
    arm.rowManifest[label]={table:r.table,key:r.key,staticBytes:t.staticBytes,dynamicFields:t.dynamicFields,dynamicCapacity:r.capacity};
   }
   for(const [n,t]of Object.entries(tables))for(const [method,value]of [['getFieldLayout',t.layout],['getKeySchema',t.keySchema],['getValueSchema',t.valueSchema]])read('table.'+n+'.'+method,addresses[t.target],method+'(bytes32)',[t.id],['bytes32'],[value]);
   const scalar=(label,role,sig,t,v,args=[])=>read(label,addresses[role],sig,args,[t],[v]);
   for(const [fn,t,v]of [['index','address',addresses.IndexModule],['indexCodehash','bytes32',runtimePins.IndexModule.runtimeCodehash],['realmId','bytes32',realm],['realmOrigin','bytes32',origin],['coreCodeCommitment','bytes32',core],['highWater','uint64',success?11:6],['rulesEpoch','uint32',1]])scalar('Ledger.'+fn,'Ledger',fn+'()',t,v);
   for(const [fn,t,v]of [['deployer','address',deployer],['poisonConcept','bytes32',poison],['ledger','address',addresses.Ledger],['ledgerCodehash','bytes32',core],['generation','uint32',1],['obligationsId','bytes32',constants.OBLIGATIONS]])scalar('IndexModule.'+fn,'IndexModule',fn+'()',t,v);
   for(const role of ['Ledger','IndexModule'])scalar(role+'.storeVersion',role,'storeVersion()','bytes32','0x'+Buffer.from('2.0.2').toString('hex').padEnd(64,'0'));
   familyIds.forEach((id,i)=>read('coverage.'+familyNames[i],addresses.IndexModule,'coverage(bytes32,bytes32)',[id,Z],['uint8','uint64'],[i<6?1:2,i<6?(success?11:6):0]));
  }
  assert.equal(Object.keys(arm.rowManifest).length,59,'exact touched row inventory');
  for(const field of ['reads','storage'])assert.deepEqual(Object.keys(arm.pre[field]).sort(),Object.keys(arm.post[field]).sort());
  const wireIntent=p=>({...p,nonce:String(p.nonce),deadline:String(p.deadline),actions:p.actions.map(a=>({...a,kind:String(a.kind),digestKind:String(a.digestKind),expectedRevision:String(a.expectedRevision)}))});
  const prefixWire={intent:wireIntent(prefix.intent),bodies:prefix.bodies,actionsHash:prefix.actionsHash,publicationId:prefix.publicationId,calldata:prefix.calldata};
  arm.fixture={realmOrigin:origin,realmId:realm,author:A,nativeAuthor:prefixPrincipal,fileSalt:coordinates.salt,folder:coordinates.folder,name:coordinates.name,concept:coordinates.tag,tagAssert:word(1),items:[records.ETH,records.USDC],pair:records.Pair,fileId:coordinates.subject,quote:records.Quote,bindingKeys:{HEAD:bindings.head.key,FOLDER:bindings.folder.key,TAG:bindings.tag.key},prefix:prefixWire};
  arm.a1={intent:wireIntent(a1.intent),bodies:a1.bodies,signature:a1.signature,actionsHash:a1.actionsHash,publicationId:a1.publicationId,digest:a1.digest,calldata:a1.calldata};
  if(!details){delete arm.runtimePreparation;delete arm.rowManifest;}
  output.arms[name]=arm;
 }
 return output;
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 const arm=process.argv.indexOf('--arm'),runtime=process.argv.indexOf('--runtime');let value=derive(runtime!==-1);
 if(arm!==-1)value=value.arms[process.argv[arm+1]];
 if(runtime!==-1){const a=value.arms[process.argv[runtime+1]];value={runtimePreparation:a.runtimePreparation,rowManifest:a.rowManifest};}
 if(process.argv.includes('--header'))value={...value,arms:{}};
 assert(value,'unknown output selector');process.stdout.write(JSON.stringify(value,null,2)+'\n');
}
