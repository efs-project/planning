// Disposable local smoke: native Node + existing cast/anvil, no downloaded deps.
import fs from 'node:fs';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const cast=(...args)=>{const r=spawnSync('cast',args,{encoding:'utf8',maxBuffer:4*1024*1024});if(r.status!==0)throw Error(r.stderr);return r.stdout.trim();};
const encode=(types,...args)=>cast('abi-encode','f('+types+')',...args.map(String));
const hash=x=>cast('keccak',x);
const decode=(types,data)=>JSON.parse(cast('abi-decode','--json','f()('+types+')',data));
const word=x=>'0x'+BigInt(x).toString(16).padStart(64,'0');
const artifact=n=>JSON.parse(fs.readFileSync('out/'+n+'.sol/'+n+'.json'));
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));
const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const args=['--host','127.0.0.1','--port',String(port),'--hardfork','cancun','--silent'];
const child=spawn('anvil',args,{stdio:['ignore','pipe','pipe']});
let nodeLog='';child.stdout.on('data',x=>nodeLog+=x);child.stderr.on('data',x=>nodeLog+=x);
const rpc=async(method,params=[])=>{const r=await fetch('http://127.0.0.1:'+port,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});const j=await r.json();if(j.error)throw Error(JSON.stringify(j.error));return j.result;};
const stop=()=>{if(child.exitCode===null)child.kill('SIGTERM');};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
let summary;
try {
    let ready=false;for(let i=0;i<100;++i){try{await rpc('web3_clientVersion');ready=true;break;}catch{await new Promise(r=>setTimeout(r,50));}}
    assert(ready,'managed Anvil ready');const [from]=await rpc('eth_accounts');
    const send=async(data,to)=>{const tx=await rpc('eth_sendTransaction',[{from,data,gas:'0x1c9c380',...(to?{to}:{})}]);let receipt;for(let i=0;i<200;++i){receipt=await rpc('eth_getTransactionReceipt',[tx]);if(receipt)break;await new Promise(r=>setTimeout(r,25));}assert(receipt,'bounded receipt wait');assert.equal(receipt.status,'0x1');return receipt;};
    const deploy=async n=>{const a=artifact(n);const receipt=await send(a.bytecode.object);const code=await rpc('eth_getCode',[receipt.contractAddress,'latest']);assert.equal((code.length-2)/2,(a.deployedBytecode.object.length-2)/2);assert((code.length-2)/2<=24576);return {address:receipt.contractAddress,code,codehash:hash(code),tx:receipt.transactionHash,gasUsed:BigInt(receipt.gasUsed).toString()};};
    const helper=await deploy('PreparationHelper');
    const library=await deploy('AdmissionLibrary');
    const la=artifact('AdmissionLibrary');let expected=la.deployedBytecode.object.slice(2);
    const patches=la.deployedBytecode.immutableReferences.library_deploy_address;
    for(const p of patches){const value=library.address.slice(2).padStart(p.length*2,'0');expected=expected.slice(0,p.start*2)+value+expected.slice((p.start+p.length)*2);}
    assert.equal(library.code,'0x'+expected,'real library runtime equals compiler template plus documented own-address immutable');
    assert.notEqual(library.codehash,hash(la.deployedBytecode.object),'raw template hash is NOT deployed library identity');
    const fixture=JSON.parse(fs.readFileSync('../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json'));
    const groups=fixture.groups.map(g=>'0x'+g.groupHex);
    const blob='0001001154797065536368656d6147726f75702f31000000'+'00'.repeat(32)+'0001000a67726f75704279746573051ffe0000000000000000';
    const intrinsic='0x0001'+(blob.length/2).toString(16).padStart(4,'0')+blob;
    const realm=hash('test-realm'),revision=hash('test-revision');
    const init='('+[realm,revision,intrinsic,groups[0],groups[1]].join(',')+')';
    const ha=artifact('StatefulHarness');let linked=ha.bytecode.object.slice(2);
    const refs=ha.bytecode.linkReferences['src/AdmissionLibrary.sol'].AdmissionLibrary;
    for(const p of refs)linked=linked.slice(0,p.start*2)+library.address.slice(2)+linked.slice((p.start+p.length)*2);
    assert(!linked.includes('_'),'all compiler link references resolved');
    const constructor=encode('(bytes32,bytes32,bytes,bytes,bytes),address,bytes32,bytes32',init,helper.address,helper.codehash,library.codehash);
    const creation='0x'+linked+constructor.slice(2);assert((creation.length-2)/2<=49152);
    const cr=await send(creation);const core=cr.contractAddress;
    const call=async(signature,...values)=>rpc('eth_call',[{to:core,data:cast('calldata',signature,...values.map(String))},'latest']);
    const getter=async(signature,types,...values)=>decode(types,await call(signature,...values));
    assert.equal((await getter('admissionLibrary()','address'))[0].toLowerCase(),library.address);
    assert.equal((await getter('admissionCodehash()','bytes32'))[0],library.codehash);
    assert.equal((await getter('preparationHelper()','address'))[0].toLowerCase(),helper.address);
    assert.equal((await getter('preparationCodehash()','bytes32'))[0],helper.codehash);
    assert.deepEqual((await getter('counts()','(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)'))[0].slice(0,6),[0,0,1,0,0,0]);
    const meta=hash(encode('bytes32,bytes32,uint256',hash('efs2/typeschema/1'),hash(encode('bytes32,bytes32',hash('efs2/typeschema-group/1'),hash(intrinsic))),0));
    const objectType=fixture.groups[0].members[0].temporaryTypeSchemaId;
    const principal=word((1n<<256n)-1n);
    const groupBody='0x'+((groups[0].length-2)/2).toString(16).padStart(4,'0')+groups[0].slice(2);
    const objectBody=principal+word(0).slice(2)+'00';
    const rid=(type,body)=>hash(encode('bytes32,bytes32,bytes32',hash('efs2/record/1'),type,hash(body)));
    const ids=[rid(meta,groupBody),rid(objectType,objectBody)];
    const header='(1,'+principal+','+word(0)+',0,'+word(111)+',0)';
    const domain=hash(encode('bytes32,bytes32,bytes32',hash('EIP712Domain(string name,string version)'),hash('EFS2-Envelope'),hash('1')));
    const sh=hash(encode('bytes32,(uint16,bytes32,bytes32,uint64,bytes32,uint64),bytes32',hash('PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)'),header,hash('0x'+ids.map(x=>x.slice(2)).join(''))));
    const envelope=hash(encode('bytes32,bytes32',hash('efs2/envelope/1'),hash('0x1901'+domain.slice(2)+sh.slice(2))));
    const leaves='[(0,'+meta+','+groupBody+'),(1,'+objectType+','+objectBody+')]';
    const publication='('+envelope+','+header+',['+ids.join(',')+'],3,'+leaves+',[])';
    const verified='('+principal+',1,4660,'+word(0xabcd)+')';
    const sig='publishTrustedForTest((bytes32,uint32,uint256,bytes32),(bytes32,(uint16,bytes32,bytes32,uint64,bytes32,uint64),bytes32[],uint64,(uint16,bytes32,bytes)[],(uint16,uint32)[]))';
    const data=cast('calldata',sig,verified,publication);
    const preview=decode('(bytes32,uint64,uint64,(uint16,uint8,uint64)[])',await rpc('eth_call',[{from,to:core,data},'latest']))[0];
    assert.deepEqual(preview,[envelope,1,1,[[0,1,1],[1,1,2]]]);
    const receipt=await send(data,core);
    const counts=(await getter('counts()','(uint64,uint64,uint64,uint64,uint64,uint64,uint64,uint64)'))[0];
    assert.deepEqual(counts.slice(0,6),[2,1,7,1,2,1]);assert.equal(counts[7],0);
    const rows={records:[],types:[],envelopes:[],principals:[],admissions:[],batches:[],postings:[],occurrences:[]};
    for(let i=1;i<=counts[0];++i){const [id]=await getter('recordIdAt(uint64)','bytes32',i);const [row]=await getter('record(bytes32)','(bytes32,bytes,uint64,uint64)',id);assert.equal(id,ids[i-1]);assert.equal(rid(row[0],row[1]),id);assert.deepEqual(row,[i===1?meta:objectType,i===1?groupBody:objectBody,i,i]);rows.records.push({id,row});}
    for(let i=1;i<=counts[2];++i){const [id]=await getter('typeIdAt(uint64)','bytes32',i);const [row]=await getter('typeRow(bytes32)','(bytes32,uint16,uint64,uint64,bytes)',id);assert.equal(row[2],i);assert.equal(row[0],i===1?word(0):ids[0]);assert.equal(row[3],i===1?0:1);rows.types.push({id,row});}
    const unsigned=encode('(uint16,bytes32,bytes32,uint64,bytes32,uint64),bytes32[]',header,'['+ids.join(',')+']');
    assert.equal((await getter('envelopeIdAt(uint64)','bytes32',1))[0],envelope);
    rows.envelopes=(await getter('envelope(bytes32)','(bytes,uint64)',envelope));assert.deepEqual(rows.envelopes[0],[unsigned,1]);
    assert.equal((await getter('principalIdAt(uint64)','bytes32',1))[0],principal);
    rows.principals=await getter('principal(bytes32)','(uint64,uint64)',principal);assert.deepEqual(rows.principals[0],[1,1]);
    for(let i=1;i<=2;++i){rows.admissions.push((await getter('admissionAt(uint64)','(bytes32,uint256)',i))[0]);rows.occurrences.push((await getter('occurrence(bytes32,uint16)','(uint256)',envelope,i-1))[0]);assert.equal(rows.admissions[i-1][0],envelope);}
    rows.batches=await getter('batchAt(uint64)','(uint256,uint256,bytes32)',1);assert.equal(String(rows.batches[0][1]),'4660');assert.equal(rows.batches[0][2],word(0xabcd));
    for(let i=1;i<=counts[6];++i){const [key]=await getter('postingKeyAt(uint64)','bytes32',i);const [head]=await getter('postingHead(bytes32)','uint256',key);const n=BigInt(head)&((1n<<64n)-1n);const words=[];for(let j=0;j<Number((n+4n)/5n);++j)words.push((await getter('postingWord(bytes32,uint64)','uint256',key,j))[0]);rows.postings.push({key,head,words});}
    const byRecord=hash(encode('bytes32,bytes32,uint256,uint256,bytes32',hash('efs2/pk/1'),word(0),3,0,ids[1]));
    const posting=rows.postings.find(x=>x.key===byRecord);assert(posting);assert.equal(BigInt(posting.head),1n+(1n<<64n)+(2n<<128n));assert.equal(BigInt(posting.words[0]),2n);
    const coreCode=await rpc('eth_getCode',[core,'latest']);
    summary={status:'PASS',nodeArgs:args,nodePid:child.pid,chainId:await rpc('eth_chainId'),normalSizeLimits:true,helper:{...helper,code:undefined},library:{...library,code:undefined,templateCodehash:hash(la.deployedBytecode.object),ownAddressPatches:patches,generatedSelector:la.methodIdentifiers},core:{address:core,tx:cr.transactionHash,gasUsed:BigInt(cr.gasUsed).toString(),runtimeBytes:(coreCode.length-2)/2,runtimeCodehash:hash(coreCode),initcodeWithArgumentsBytes:(creation.length-2)/2,compilerLinkReferences:refs},publication:{tx:receipt.transactionHash,gasUsed:BigInt(receipt.gasUsed).toString(),envelope,recordIds:ids,preview,counts,rows},eventUsedForReconstruction:false};
} finally {
    stop();if(child.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>{child.kill('SIGKILL');},2000);child.once('exit',()=>{clearTimeout(t);resolve();});});
    if(summary){summary.nodeCleanup={exitCode:child.exitCode,signal:child.signalCode};console.log(JSON.stringify(summary,null,2));}
    else if(nodeLog)console.error(nodeLog);
}
