/** Exact reviewed-BASE upgrade without moving/rebuilding the source root. Reuse
 * the lossless prior paid creation transaction and verify its entire metadata
 * source closure against BASE before replacing only its two constructor args. */
import assert from 'node:assert/strict';
import {readFile,writeFile,lstat} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createGuardedArchiveReader} from '../browser/guarded-archive.mjs';
import {createContractSignatureCompanion,verifyContractSignatureBundle,encodeContractSignaturePublication} from '../browser/contract-signature-evidence.mjs';
const output='core-closeout-authority-20260915/exact-base-upgrade.json.gz';
const exists=await lstat(output).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
if(exists)throw Error(`EVIDENCE_OUTPUT_EXISTS: ${output}`);
const BASE='ab55ca65bfc5ee983c829e42d421f6382ad66fa1',e=await loadEthers(),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const evidenceFile='core-closeout-types-20260915/paid-run2/paid.json.gz',evidenceBytes=await readFile(evidenceFile),prior=JSON.parse(gunzipSync(evidenceBytes));
const metadata=prior.artifacts.Ledger.metadata;
for(const [path,pin] of Object.entries(metadata.sources))assert.equal(e.keccak256(execFileSync('git',['show',`${BASE}:Reviews/2026-09-12-efs-path-decision/lab-b/${path}`])),pin.keccak256);
const original=prior.transactions.find(x=>x.label==='deploy/Ledger'),oldCreation=original.chainTx.input.slice(0,-128);
assert.equal(e.Transaction.from(original.rawTransaction).data,original.chainTx.input);assert.equal(e.Transaction.from(original.rawTransaction).hash,original.hash);
assert.equal(e.getBytes(oldCreation).length,36314); // reviewed BASE actual init36378 includes64 args
const report={base:BASE,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),priorEvidence:{path:evidenceFile,sha256:createHash('sha256').update(evidenceBytes).digest('hex'),originalTransaction:original,metadata,creationHash:e.keccak256(oldCreation)},checks:[]};
const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'direct'});
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
try{
  const args=[env.contracts.registry.address,env.manifest.executionFamily.realmId],oldData=oldCreation+coder.encode(['address','bytes32'],args).slice(2);
  const tx=await env.send('deploy/exact-BASE-Ledger',{data:oldData}),receipt=await env.rpc('eth_getTransactionReceipt',[tx]),old=receipt.contractAddress;
  const oldCode=await env.rpc('eth_getCode',[old,'latest']);assert.equal(e.getBytes(oldCode).length,24247);
  env.contracts.old={address:old,abi:env.contracts.ledger.abi,codeHash:e.keccak256(oldCode),runtimeBytes:24247,initcodeBytes:e.getBytes(oldData).length};
  const core=await env.deploy('oldProxy','UpgradeProxy.sol','UpgradeProxy',[old]);
  env.contracts.upgradeCore={...env.contracts.oldProxy,abi:env.contracts.ledger.abi};
  const index=await env.deploy('upgradeIndex','IndexModule.sol','IndexModule',[core]);
  await env.transact('upgradeCore','setIndexModule',[index]);
  const api=new e.Interface(env.contracts.ledger.abi),empty={principalIds:[],positions:[],expectedHeads:[]};
  const action=label=>[{kind:5,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:e.id(label)}];
  await env.transact('upgradeCore','execute',[action('BASE native'),['0x'],0],'BASE/native');
  async function intentFor(author,actions){return {realmId:args[1],realmOrigin:(await env.call('upgradeCore','realmOrigin'))[0],executionSet:(await env.call('upgradeCore','executionSet'))[0],author,nonce:(await env.call('upgradeCore','nonces',[author]))[0],deadline:2000000000,
    acceptanceProfile:(await env.call('upgradeCore','acceptanceProfileOf',[actions]))[0],indexObligations:(await env.call('upgradeCore','indexObligations'))[0],readSetHash:(await env.call('upgradeCore','readSetHash',[empty]))[0]};}
  const actions=action('BASE EOA'),intent=await intentFor(env.wallets.alice.address,actions),digest=(await env.call('upgradeCore','guardedIntentDigest',[intent,e.keccak256(coder.encode([api.getFunction('executeGuardedSigned').inputs[1]],[actions]))]))[0];
  await env.transact('upgradeCore','executeGuardedSigned',[intent,actions,['0x'],empty,env.wallets.alice.signingKey.sign(digest).serialized],'BASE/EOA','bob');
  const before=await Promise.all([1,2].map(async p=>({p,evidence:plain(await env.call('upgradeCore','evidence',[p])),context:plain(await env.call('upgradeCore','publicationContext',[p]))})));
  const readBefore=(await env.call('upgradeCore','readSetBytes',[intent.readSetHash]))[0];
  const manifest={...env.manifest,contracts:{...env.manifest.contracts,ledger:env.contracts.upgradeCore}};
  const reader=createGuardedArchiveReader({ethers:e,rpc:env.rpc,manifest}),oldPacket=await reader.exportPublication({publication:2});
  await env.transact('oldProxy','upgradeTo',[env.contracts.ledger.address],'exact-BASE/populated-upgrade');
  for(const b of before){assert.deepEqual(plain(await env.call('upgradeCore','evidence',[b.p])),b.evidence);assert.deepEqual(plain(await env.call('upgradeCore','publicationContext',[b.p])),b.context);}
  assert.equal((await env.call('upgradeCore','readSetBytes',[intent.readSetHash]))[0],readBefore);
  const afterPacket=await reader.exportPublication({publication:2});for(const key of ['signature','claimId','principalId','readSetBytes'])assert.equal(afterPacket[key],oldPacket[key]);
  assert.deepEqual(afterPacket.execution,oldPacket.execution);
  const wallet=await env.deploy('upgradeWallet','ContractSignatureWallet.sol','ContractSignatureWallet',[core]),wa=action('after BASE upgrade'),wi=await intentFor(wallet,wa),wd=(await env.call('upgradeCore','guardedIntentDigest',[wi,e.keccak256(coder.encode([api.getFunction('executeGuarded1271').inputs[1]],[wa]))]))[0];
  await env.transact('upgradeWallet','approve',[wd,'0x987654']);
  await env.send('after-BASE-upgrade/ERC1271',{to:core,data:encodeContractSignaturePublication(e,{intent:wi,actions:wa,bodies:['0x'],reads:empty,signature:'0x987654'})},'bob');
  const current=env.manifest.executionFamily.implementations[0],profile={ledger:core,ledgerCodeHash:env.contracts.oldProxy.codeHash,chainId:env.manifest.chainId,implementations:[{...current,support:current.publicationSupport}]};
  const companion=createContractSignatureCompanion({ethers:e,rpc:env.rpc,ledger:core,ledgerAbi:env.contracts.ledger.abi,profile});
  const bundle=await companion.exportPublication(3);assert.equal(verifyContractSignatureBundle(e,bundle).grade,'RETAINED_UNVERIFIED_SOURCE');
  const next=await env.deploy('nextWalletImplementation','Ledger.sol','Ledger',args);
  await env.transact('oldProxy','upgradeTo',[next],'all-three-proofs/populated-upgrade');
  assert.deepEqual(await companion.exportPublication(3).catch(error=>({error:String(error)})),{error:'Error: ERC1271_CURRENT_IMPLEMENTATION'});
  // Explicitly extend independently selected reviewed profile only after checking
  // the new template in env.deploy; never infer it from the historical bundle.
  const [support,codeHash]=await env.call('nextWalletImplementation','publicationSupportIdentity');
  const helper=new e.Interface(['function signatureStoreIdentity() view returns(address,bytes32)']);
  const [store,storeHash]=helper.decodeFunctionResult('signatureStoreIdentity',await env.rpc('eth_call',[{to:support,data:helper.encodeFunctionData('signatureStoreIdentity')},'latest']));
  profile.implementations.push({address:next,codeHash:env.contracts.nextWalletImplementation.codeHash,support:{address:support,codeHash},signatureStore:{address:store,codeHash:storeHash}});
  assert.deepEqual(await companion.exportPublication(3),bundle);
  for(const b of before)assert.deepEqual(plain(await env.call('upgradeCore','evidence',[b.p])),b.evidence);
  report.checks=['entire prior compiler source closure equals reviewed BASE','actual old native and EOA publications populated before upgrade','old proof/context/read-set/EOA archive bytes unchanged','new ERC1271 real wallet ingress after BASE upgrade','original wallet store survives second populated upgrade','unselected current implementation refused until explicitly selected'];
  report.oldPacket=oldPacket;report.afterPacket=afterPacket;report.walletBundle=bundle;report.oldRuntimeCode=oldCode;report.transactions=env.transactions;report.contracts=env.contracts;
}finally{await env.close();report.closed=true;await writeFile(output,gzipSync(JSON.stringify(plain(report),null,2)));}
console.log(JSON.stringify({checks:report.checks,transactions:report.transactions.length,oldRuntime:24247,oldInit:e.getBytes(oldCreation).length+64,closed:report.closed}));
