// Disposable paid evidence. All transactions <=15M; the managed loopback keeps
// 256 states/512 transaction blocks and uses a run-specific cache. No traces.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
// Historical350k evidence requires its original source/artifacts, not a fixture
// switch against current FOUNDRY_OUT. Reject it before loading any resources.
const stage=process.argv[2]??'finite';
if(stage!=='finite')throw new Error('Only finite mode is supported; historical old350k evidence is retained, not reproducible with current artifacts.');
const {createEnvironment}=await import('./compact-environment.mjs');
const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true});
const {ethers:e,contracts:c}=env,abi=e.AbiCoder.defaultAbiCoder();
const h=(types,values)=>e.keccak256(abi.encode(types,values));
const pk=(t,k,o,v)=>h(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),t,k,o,v]);
const rid=(t,b)=>h(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
const output=join(new URL('../core-closeout-index-20260915/',import.meta.url).pathname);
const observations=[];
try{
  const register=async(label,refs=[])=>{
    const shape=e.id(label),[id]=await env.call('registry','typeIdOf',[shape,e.ZeroAddress,refs]);
    await env.transact('registry','register',[shape,e.ZeroAddress,refs],`register/${label}`);return id;
  };
  const targetType=await register('index-paid/target');
  const sourceType=await register('index-paid/eight',Array(8).fill(targetType));
  await env.deploy('testCore','Ledger.sol','Ledger',[c.registry.address,e.id('index-paid')]);
  const scalar=(kind,word)=>({kind,word});
  const specs=[{typeId:sourceType,scalars:[scalar(2,8),scalar(1,11),scalar(2,12),scalar(1,13)],digest:{enabled:true,word:10,algorithmWord:9,algorithm:e.toBeHex(1,32)}}];
  await env.deploy('standaloneProfile','IndexFieldProfile.sol','IndexFieldProfile',[specs]);
  await env.deploy('testIndex','ProfiledIndexModule.sol','ProfiledIndexModule',[c.testCore.address,specs]);
  await env.transact('testCore','setIndexModule',[c.testIndex.address],'attach-profile');
  const targets=[];
  for(let i=0;i<8;i++){
    const b=abi.encode(['uint256'],[i+1]);targets.push(rid(targetType,b));
    await env.transact('testCore','publish',[targetType,b],`seed-target/${i}`);
  }
  const publishObserved=async(label,body,fn='publish',args=[sourceType,body])=>{
    const before=await env.call('testCore','counts');
    const hash=await env.enqueue(label,{to:c.testCore.address,data:new e.Interface(c.testCore.abi).encodeFunctionData(fn,args),gasLimit:15_000_000});
    const receipt=await env.observe(hash);const after=await env.call('testCore','counts');
    observations.push({label,before,after,status:receipt.status,gasUsed:receipt.gasUsed});
    if(receipt.status==='REVERTED')assert.deepEqual(Array.from(after),Array.from(before),'whole publication rollback');
    return receipt;
  };
  const body=(refs,n)=>abi.encode(['bytes32[8]','uint256','uint256','bytes32','bytes32','uint256','bytes32'],[refs,n,1,e.toBeHex(99,32),e.toBeHex(51,32),52,e.toBeHex(53,32)]);
  const firstBody=body(targets,17),firstId=rid(sourceType,firstBody);
  const cold=await publishObserved('cold-eight-plus-four-scalars-digest',firstBody);
  assert.equal(cold.status,'SUCCESS');
  if(cold.status==='SUCCESS'){
    for(let i=0;i<8;i++)assert.equal((await env.call('testIndex','postingAt',[pk(sourceType,11,i,targets[i]),0]))[0],9n);
    assert.equal((await env.call('testIndex','digestCoverage',[e.ZeroHash,e.toBeHex(1,32)]))[0],2n,'global finite profile coverage');
    assert.equal((await env.call('testIndex','digestCoverage',[e.ZeroHash,e.toBeHex(99,32)]))[0],0n,'unknown digest algorithm');
    for(let n=2;n<=6;n++){
      const tx=await publishObserved(`hot-shared-insert/${n}`,body(targets,16+n));assert.equal(tx.status,'SUCCESS');
    }
    const repeated=body(Array(8).fill(targets[0]),33);assert.equal((await publishObserved('eight-distinct-roles-one-target',repeated)).status,'SUCCESS');
    for(let role=0;role<8;role++){
      const head=await env.call('testIndex','postingHead',[pk(sourceType,11,role,targets[0])]);
      assert.equal(head[0],role===0?7n:1n);assert.equal(head[2],15n);
    }
    const guarded=body(targets,44),empty={principalIds:[],positions:[],expectedHeads:[]};
    const action={kind:1,typeId:sourceType,bodyHashOrRecordId:e.keccak256(guarded),purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash};
    const nonce=(await env.call('testCore','nonces',[env.wallets.deployer.address]))[0],execution=(await env.call('testCore','executionSet'))[0];
    assert.equal((await publishObserved('guarded-full-eight-plus-fields',guarded,'executeGuarded',[[action],[guarded],nonce,execution,empty])).status,'SUCCESS');
    assert.equal((await publishObserved('deduplicated-republish',firstBody)).status,'SUCCESS');
    assert.equal((await env.call('testCore','record',[firstId]))[2],2n);
    const execute=async(label,actions)=>publishObserved(label,'0x','execute',[actions,actions.map(()=> '0x'),(await env.call('testCore','nonces',[env.wallets.deployer.address]))[0]]);
    const reuse={...action,kind:2,bodyHashOrRecordId:firstId};
    assert.equal((await execute('reuse-first-record',[reuse])).status,'SUCCESS');
    const withdrawal={...action,kind:6,typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,target:e.toBeHex(9,32)};
    assert.equal((await execute('withdraw-original-occurrence',[withdrawal])).status,'SUCCESS');
    assert.deepEqual(Array.from(await env.call('testIndex','postingHead',[pk(e.ZeroHash,12,0,firstId)])).slice(0,3),[3n,2n,18n]);
    assert.deepEqual(Array.from(await env.call('testIndex','postingHead',[pk(sourceType,13,0,e.ZeroHash)])).slice(0,2),[8n,8n]);
    assert.deepEqual(Array.from(await env.call('testIndex','postingHead',[pk(sourceType,11,0,targets[0])])).slice(0,2),[8n,8n]);
    const wrong=abi.encode(['bytes32[8]','uint256','uint256','bytes32','bytes32','uint256','bytes32'],[targets,100,2,e.toBeHex(99,32),e.toBeHex(51,32),52,e.toBeHex(53,32)]);
    assert.equal((await publishObserved('malformed-digest-algorithm-rollback',wrong)).status,'REVERTED');
  }
  // A second exact Type shows the eight-reference-only cost without fields.
  const plainType=await register('index-paid/eight-no-fields',Array(8).fill(targetType));
  const plainBody=abi.encode(['bytes32[8]'],[targets]);
  const plain=await publishObserved('cold-eight-without-fields',plainBody,'publish',[plainType,plainBody]);
  assert.equal(plain.status,'SUCCESS');
  {
    const t=env.manifest.types,salt=e.id('paid/ciphertext-file'),principal=(await env.call('ledger','principalOf',[env.wallets.deployer.address]))[0];
    const file=h(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
    await env.transact('ledger','create',[salt],'files/create');
    const emptyBody=abi.encode(['bytes32'],[e.sha256('0x')]),emptyId=rid(t.bytes,emptyBody);
    await env.transact('ledger','publish',[t.bytes,emptyBody],'files/empty-bytes');
    const digest=e.sha256(e.toUtf8Bytes('ciphertext commitment; bytes not fetched'));
    const descriptor=abi.encode(['bytes32','uint256','uint256','uint256','uint256','bytes32','uint256','uint256','bytes32','uint256','bytes32'],[emptyId,1,1,1,17,digest,0,1,e.ZeroHash,1,e.ZeroHash]);
    const descriptorId=rid(t.content,descriptor);
    await env.transact('ledger','publish',[t.content,descriptor],'files/descriptor-ciphertext-digest');
    const revision=abi.encode(['bytes32','bytes32'],[descriptorId,file]),revisionId=rid(t.carrierRoot,revision);
    await env.transact('ledger','publish',[t.carrierRoot,revision],'files/revision');
    await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),file,e.ZeroHash,revisionId,0],'files/head');
    const label=e.hexlify(e.toUtf8Bytes('a'.repeat(255)));
    await env.transact('ledger','publish',[t.name,label],'files/name255');
    await env.transact('ledger','bind',[e.id('efs2/purpose/folder/1'),env.manifest.folder,e.keccak256(label),file,0],'files/native-name255-final');
    const descriptorFirst=(await env.call('ledger','record',[descriptorId]))[1],revisionFirst=(await env.call('ledger','record',[revisionId]))[1];
    const digestKey=pk(e.ZeroHash,15,0,h(['bytes32','bytes32'],[e.toBeHex(1,32),digest]));
    assert.equal((await env.call('index','postingAt',[digestKey,0]))[0],descriptorFirst);
    assert.equal((await env.call('index','postingAt',[pk(t.carrierRoot,11,0,descriptorId),0]))[0],revisionFirst);
    assert.equal((await env.call('lens','resolve',[[env.wallets.deployer.address],e.id('efs2/purpose/head/1'),file,e.ZeroHash]))[1],revisionId);
    const selected=await env.call('lens','resolve',[[env.wallets.deployer.address],e.id('efs2/purpose/folder/1'),env.manifest.folder,e.keccak256(label)]);
    assert.equal(selected[1],file);
    observations.push({label:'digest-descriptor-revision-Lens-selected-File',descriptorId,descriptorFirst,revisionId,revisionFirst,file,selected:Array.from(selected)});
  }
  const [profileAddress]=await env.call('testIndex','fieldProfile');
  const profileCode=await env.rpc('eth_getCode',[profileAddress,'latest']);
  await env.deploy('postingProbe','CoreIndexMaterialization.t.sol','PostingProbe',[c.testCore.address]);
  for(let i=1;i<=6;i++)await env.transact('postingProbe','append',[e.id('posting-cost'),i,true],`standalone-posting/${i}`);
  const paths=['src/IndexModule.sol','src/IndexFieldProfile.sol','src/ProfiledIndexModule.sol','src/IndexSource.sol','src/IndexWork.sol','src/Keys.sol','src/Ledger.sol','src/PublicationSupport.sol','src/Interfaces.sol','src/SelectiveReferenceIndexModule.sol','test/ProfiledFilesIndex.sol','test/FilesJoinedProfile.sol','test/FilesNamesProfile.sol','test/FilesLiveIndex.sol','test/FilesDirectoryProfile.sol','test/FilesCarrierProfile.sol','script/core-index-materialization.mjs','script/compact-environment.mjs'];
  const sources=Object.fromEntries(await Promise.all(paths.map(async p=>[p,createHash('sha256').update(await readFile(new URL('../'+p,import.meta.url))).digest('hex')])));
  const report={stage,observations,sources,profile:{address:profileAddress,runtimeBytes:e.getBytes(profileCode).length,codehash:e.keccak256(profileCode)},contracts:c,historyPolicy:env.historyPolicy,transactions:env.transactions,evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF'};
  await mkdir(output,{recursive:true});
  await writeFile(join(output,'finite-paid.json.gz'),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
  console.log(JSON.stringify({stage,observations,contracts:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,{runtime:v.runtimeBytes,initcode:v.initcodeBytes}]))},(_,v)=>typeof v==='bigint'?String(v):v,2));
}finally{await env.close();}
