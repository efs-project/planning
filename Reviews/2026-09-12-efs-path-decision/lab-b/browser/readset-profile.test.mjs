import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {Script} from 'node:vm';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {gzipSync} from 'node:zlib';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import {verifyGuardedClaim} from './guarded-archive.mjs';

const writeProfileEvidence=(path,bytes)=>writeFile(path,bytes,{flag:'wx'});

test('read-set evidence output refuses replacement of an existing explicit path',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'efs-readset-evidence-')),path=join(dir,'explicit.json.gz');
  await writeProfileEvidence(path,Buffer.from('original packet'));
  await assert.rejects(writeProfileEvidence(path,Buffer.from('replacement packet')),{code:'EEXIST'});
  assert.equal(await readFile(path,'utf8'),'original packet');
});

// Execute the actual browser transport boundary without app bootstrap, DOM,
// imports, UI or stored state. Tests exercise its behavior, not source spelling.
async function browserRpc(rpcUrl,fetcher=fetch){
  const app=await readFile(new URL('./app.mjs',import.meta.url),'utf8');
  const body=app.slice(app.indexOf('async function rpc('),app.indexOf('\nasync function run('));
  return new Script(`${body}\nrpc`).runInNewContext({fetch:fetcher,performance,TextEncoder,AbortSignal,
    state:{config:{rpcUrl},rpc:{calls:0,bytes:0,ms:0,errors:0}}});
}

test('browser transport preserves typed EVM errors without manufacturing metadata for HTTP failures',async()=>{
  const rpc=await browserRpc('http://127.0.0.1:1',async(_url,request)=>({ok:true,text:async()=>JSON.stringify({
    jsonrpc:'2.0',id:JSON.parse(request.body).id,error:{code:3,message:'execution reverted',data:'0x'}})}));
  await assert.rejects(rpc('eth_call',[]),error=>error.message==='execution reverted'&&error.rpcError?.code===3&&error.rpcError?.data==='0x');
  const http=await browserRpc('http://127.0.0.1:1',async()=>({ok:false,status:503,text:async()=>''}));
  await assert.rejects(http('eth_call',[]),error=>error.message==='RPC HTTP 503'&&!error.rpcError);
});

test('recognized legacy relabel cannot bypass an actual carrier implementation declaration',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2'});t.after(()=>env.close());
  const {ethers:e,manifest,rpc}=env,selector=e.id('readSetStorageProfile()').slice(0,10);
  const relabeled=JSON.parse(JSON.stringify(manifest));
  for(const implementation of relabeled.executionFamily.implementations){
    implementation.readSetStorage={profile:e.id('efs.lab.read-set-storage/1:root15-bytes'),namespace:e.ZeroHash};
    delete implementation.publicationSupport;
  }
  const implementation=manifest.executionFamily.implementations[0];
  assert.equal(e.keccak256(await rpc('eth_getCode',[implementation.address,'latest'])),implementation.codeHash);
  for(const mode of ['declaration','unavailable','malformed-success','undefined-success'])await t.test(mode,async()=>{
    let probes=0;
    const sdk=createGuardedCompactSdk({ethers:e,manifest:relabeled,rpc:async(method,params)=>{
      if(method==='eth_call'&&params[0].data.startsWith(selector)){
        probes++;
        assert.equal(params[0].to.toLowerCase(),implementation.address.toLowerCase());
        assert.equal(params[1].requireCanonical,true);assert.match(params[1].blockHash,/^0x[0-9a-f]{64}$/i);
        if(mode==='unavailable')throw Error('profile endpoint unavailable');
        if(mode==='malformed-success')return '0x';
        if(mode==='undefined-success')return undefined;
      }
      return rpc(method,params);
    }});
    await assert.rejects(sdk.pin(),mode==='declaration'?/READSET_PROFILE_UNSUPPORTED/:undefined);
    assert.equal(probes,1,'legacy label must not skip the actual implementation probe');
  });
});

test('new read-set profile must be explicit and a failed exact probe cannot downgrade to legacy',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2'});t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,copy=()=>JSON.parse(JSON.stringify(manifest));
  const options=m=>({ethers:e,manifest:m,rpc,journal:{get:async()=>null,put:async()=>{}}});
  const bad=copy();bad.executionFamily.implementations[0].readSetStorage={profile:e.id('unsupported'),namespace:e.ZeroHash};
  assert.throws(()=>createGuardedCompactSdk(options(bad)),/READSET_PROFILE/);
  const missing=copy();delete missing.executionFamily.implementations[0].readSetStorage;
  await assert.rejects(createGuardedCompactSdk(options(missing)).pin(),/READSET_PROFILE_UNSUPPORTED/);
  const wrongRoot=copy();wrongRoot.executionFamily.implementations[0].readSetStorage.namespace=e.id('wrong-root');
  assert.throws(()=>createGuardedCompactSdk(options(wrongRoot)),/READSET_PROFILE/);
  const wrongSupport=copy();wrongSupport.executionFamily.implementations[0].publicationSupport.codeHash=e.id('wrong-support');
  await assert.rejects(createGuardedCompactSdk(options(wrongSupport)).prepare({operation:'create',author:wallets.alice.address,
    authors:[wallets.alice.address],name:'support',salt:e.id('support'),document:'support'}),/READSET_SUPPORT_UNSUPPORTED/);
  const selector=e.id('readSetStorageProfile()').slice(0,10);
  for(const error of [Error('physical profile unavailable'),Object.assign(Error('execution reverted'),{rpcError:{code:3,data:'0x'}})]){
    let probes=0;
    const sdk=createGuardedCompactSdk({...options(manifest),rpc:async(method,params)=>{
      if(method==='eth_call'&&params[0].data.startsWith(selector)){probes++;throw error;}
      return rpc(method,params);
    }});
    await assert.rejects(sdk.prepare({operation:'create',author:wallets.alice.address,authors:[wallets.alice.address],name:'a',salt:e.id('a'),document:'a'}));
    assert.equal(probes,1,'declared-new failures must not become legacy');
  }
});

test('actual old browser transport and mixed family qualify old new downgrade restore per implementation',{
  timeout:120000,skip:!process.env.EFS_READSET_BASELINE_OUT,
},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',artifactDirectory:process.env.EFS_READSET_BASELINE_OUT});
  t.after(()=>env.close());
  const {ethers:e,manifest,wallets}=env,plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
  const rpc=await browserRpc(env.rpcUrl),journal=await env.createJournal('profile-fix1');
  const saved=plain(manifest);
  for(const impl of saved.executionFamily.implementations){delete impl.readSetStorage;delete impl.publicationSupport;}
  const client=(m=saved,transport=rpc)=>createGuardedCompactSdk({ethers:e,manifest:m,rpc:transport,journal});
  const old=saved.executionFamily.implementations[0],selector=e.id('readSetStorageProfile()').slice(0,10);
  const observed=[];
  const oldSdk=client(saved,async(method,params)=>{
    try{return await rpc(method,params);}
    catch(error){if(method==='eth_call'&&params[0].data.startsWith(selector))observed.push({address:params[0].to,block:params[1],error:error.rpcError});throw error;}
  });
  assert.equal((await oldSdk.pin()).execution.implementation.toLowerCase(),old.address.toLowerCase());
  assert.equal(observed.length,1);assert.equal(observed[0].address.toLowerCase(),old.address.toLowerCase());
  assert.equal(observed[0].error.code,3);assert.equal(observed[0].error.data,'0x');assert.equal(observed[0].block.requireCanonical,true);
  // These are failures at the genuine old implementation, not a new-runtime
  // label check. No generic provider error may be mistaken for selector absence.
  for(const [name,error] of [
    ['bare-message',Error('execution reverted')],['timeout',Error('request timed out')],
    ['wrong-code',Object.assign(Error('execution reverted'),{rpcError:{code:-32000,data:'0x'}})],
    ['nonempty-revert',Object.assign(Error('execution reverted'),{rpcError:{code:3,data:'0x1234'}})],
    ['missing-revert-data',Object.assign(Error('execution reverted'),{rpcError:{code:3}})],
  ])await t.test(name,async()=>{
    const unavailable=client(saved,async(method,params)=>{
      if(method==='eth_call'&&params[0].data.startsWith(selector))throw error;
      return rpc(method,params);
    });
    await assert.rejects(unavailable.pin());
  });
  const publish=async(sdk,label)=>{
    const plan=await sdk.prepare({operation:'create',author:wallets.alice.address,authors:[wallets.alice.address],
      name:label+'.txt',salt:e.id(label),document:label});
    const signed=await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>env.send(label,tx,'alice'));
    assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');return plan;
  };
  const legacy=await publish(oldSdk,'legacy-profile-fix1'),legacyBytes=(await env.call('ledger','readSetBytes',[legacy.intent.readSetHash]))[0];
  const artifact=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'Ledger.sol','Ledger.json'),'utf8'));
  const abi=new e.Interface(artifact.abi),data=artifact.bytecode.object+abi.encodeDeploy([env.contracts.registry.address,manifest.executionFamily.realmId]).slice(2);
  assert(e.getBytes(data).length<=49152);
  const tx=await env.send('deploy/profile-fix1-carrier',{data}),receipt=await env.rpc('eth_getTransactionReceipt',[tx]);
  const address=receipt.contractAddress,runtime=await env.rpc('eth_getCode',[address,{blockHash:receipt.blockHash,requireCanonical:true}]);
  assert.equal(e.getBytes(runtime).length,24126);
  env.contracts.next={address,abi:artifact.abi,codeHash:e.keccak256(runtime)};
  const [profile,namespace]=await env.call('next','readSetStorageProfile'),[support,codeHash]=await env.call('next','publicationSupportIdentity');
  const mixed=plain(saved);mixed.contracts.ledger.abi=artifact.abi;
  mixed.executionFamily.implementations.push({address,codeHash:e.keccak256(runtime),readSetStorage:{profile,namespace},publicationSupport:{address:support,codeHash}});
  // Old saved entries intentionally omit new fields under a shared new ABI.
  const sdk=client(mixed),executions=[(await sdk.pin()).executionSet];
  await env.transact('proxy','upgradeTo',[address],'profile-fix1/upgrade');
  executions.push((await sdk.pin()).executionSet);
  const fresh=await publish(sdk,'carrier-profile-fix1'),freshBytes=(await env.call('ledger','readSetBytes',[fresh.intent.readSetHash]))[0];
  const publication=(await env.call('ledger','publicationOf',[fresh.publicationId]))[0];
  const bundle=await sdk.exportPublication({publication});
  assert.equal((await verifyGuardedClaim(e,bundle)).sourceAdmission,'NOT_PROVEN');
  await env.transact('proxy','upgradeTo',[old.address],'profile-fix1/downgrade');
  executions.push((await sdk.pin()).executionSet);
  assert.equal((await env.call('ledger','readSetBytes',[legacy.intent.readSetHash]))[0],legacyBytes);
  assert.equal((await env.call('ledger','readSetBytes',[fresh.intent.readSetHash]))[0],'0x');
  await assert.rejects(sdk.exportPublication({publication}),/ARCHIVE_READSET_MISSING/);
  const historical=await client(mixed).reconcile(fresh.id);assert.equal(historical.status,'EFFECTS_VERIFIED','exact committed new execution still qualifies');
  await env.transact('proxy','upgradeTo',[address],'profile-fix1/restore');
  executions.push((await sdk.pin()).executionSet);assert.equal(new Set(executions).size,4);
  assert.equal((await env.call('ledger','readSetBytes',[fresh.intent.readSetHash]))[0],freshBytes);
  assert.equal((await sdk.exportPublication({publication})).readSetBytes,freshBytes);
  const sourcePins={};for(const file of ['compact-sdk-v2.mjs','app.mjs','readset-profile.test.mjs'])sourcePins[file]=e.keccak256(await readFile(new URL(file,import.meta.url)));
  const evidence={sourcePins,base:'f1c4c8d64bc82f49c2870e532e29fa3596a2b3a4',historicalArtifactBase:'6869e2680d75521de851eaa67631cc05a1eb35a9',
    pid:env.anvilPid,port:env.port,history:env.historyPolicy,savedManifest:saved,mixedManifest:mixed,observedLegacyRefusal:observed[0],executions,
    legacyReadSetHash:legacy.intent.readSetHash,carrierReadSetHash:fresh.intent.readSetHash,legacyBytesHash:e.keccak256(legacyBytes),carrierBytesHash:e.keccak256(freshBytes),
    downgradeCurrentArchive:'ARCHIVE_READSET_MISSING',downgradeCommittedReconciliation:historical.status,restoreExactBytes:true,transactions:env.transactions};
  // Ordinary verification belongs to this run's temp directory. Publishing a
  // durable packet requires an explicit new path; exclusive create forbids reuse.
  const output=process.env.EFS_READSET_PROFILE_EVIDENCE_OUT??join(env.dir,'readset-profile.json.gz');
  await writeProfileEvidence(output,gzipSync(JSON.stringify(plain(evidence),null,2)));
  t.diagnostic(`Read-set profile evidence: ${output}`);
});
