// Offline supplement only. The frozen auditor proves transaction/observation joins;
// this file reconciles summaries and pins. No RPC, compilation, or file writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {keccak256,version}=require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
const RUN='/tmp/efs-c-controls-paid-20260914.MCwNJk';
const REPO='/Users/james/Code/EFS/planning-warroom-c-run';
const LAB=REPO+'/Reviews/2026-09-12-efs-path-decision/lab-c';
const PREP='/tmp/efs-c-control-independent-prep-20260913.MkbdXi';
const ARTIFACTS='/tmp/efs-c-readiness-build-20260913.NoPDle/out';
const RUNNER=LAB+'/script/rollback-control.mjs';
const AUDITOR=PREP+'/audit.mjs';
const EXPECTATIONS=PREP+'/expectations.json';
const EXPECTATION_SHA='2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e';
const COMMIT='2ca7349e5d683c3ff10651c0fc106c10da946145';
const ARMS=['scale7','lateIndex','calibration'];
const ROLES=['ImportLib','IndexModule','Ledger','PassAcceptor','QuoteAcceptorV1','Producer'];
const sha=b=>createHash('sha256').update(b).digest('hex');
const eq=(a,b,label)=>assert.deepEqual(a,b,label);
const lower=x=>{assert.equal(typeof x,'string');return x.toLowerCase();};
const one=(xs,label)=>{eq(xs.length,1,label+' must have one raw result');return xs[0];};
const result=r=>{assert(r.response&&!Object.hasOwn(r.response,'error'));assert(Object.hasOwn(r.response,'result'));return r.response.result;};
const qty=x=>{assert.match(x,/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/);return BigInt(x);};
const rows=(raw,method)=>raw.filter(r=>r.request.method===method);
const keys=(obj,want,label)=>eq(Object.keys(obj).sort(),[...want].sort(),label);

export function reconcileGas(raw,report,expected) {
  const receipts=rows(raw,'eth_getTransactionReceipt').map(result).filter(x=>x!==null);
  const txs=rows(raw,'eth_getTransactionByHash').map(result).filter(x=>x!==null);
  eq(receipts.length,27,'27 non-null receipts');eq(txs.length,27,'27 retained transactions');
  const used=new Set(), gas={deployment:{},setup:{},control:{}};
  const take=receipt=>{const hash=lower(receipt.transactionHash);assert(!used.has(hash),'gas receipt reused');used.add(hash);return qty(receipt.gasUsed).toString();};
  const byInput=t=>{
    const tx=one(txs.filter(x=>lower(x.from)===lower(t.from)&&x.to!==null&&lower(x.to)===lower(t.to)&&qty(x.nonce)===BigInt(t.nonce)&&lower(x.input)===lower(t.data)),'setup/control transaction');
    return one(receipts.filter(r=>lower(r.transactionHash)===lower(tx.hash)),'setup/control receipt');
  };
  for(const name of ARMS){
    const e=expected.arms[name];keys(Object.fromEntries(e.deployment.map(d=>[d.role,true])),ROLES,'six deployment roles');
    gas.deployment[name]={};gas.setup[name]={};
    for(const d of e.deployment)gas.deployment[name][d.role]=take(one(receipts.filter(r=>r.contractAddress!==null&&lower(r.contractAddress)===lower(d.address)),name+'/'+d.role+' deployment address'));
    eq(e.setupTransactions.map(t=>t.label),['attach','prefix']);
    for(const t of e.setupTransactions)gas.setup[name][t.label]=take(byInput(t));
    gas.control[name]=take(byInput(e.attempt));
  }
  eq(used.size,27);eq(report.gas,gas,'all 27 gas entries from raw receipts');
  return {receipts:used.size,gas};
}

export function reconcileChain(raw,report,expected) {
  // The frozen auditor checks strict request ordering. The unique gas-price
  // query closes startup; later block/nonce reads belong to transaction work.
  const gasPrice=one(rows(raw,'eth_gasPrice'),'startup gas-price boundary');
  const startup=raw.filter(r=>r.request.id<gasPrice.request.id);
  for(const send of rows(raw,'eth_sendRawTransaction'))assert(send.request.id>gasPrice.request.id,'send before startup boundary');
  const get=method=>result(one(rows(startup,method),'startup '+method));
  const genesis=one(rows(startup,'eth_getBlockByNumber').filter(r=>r.request.params[0]==='0x0'),'startup genesis header');
  const header=result(genesis), author=lower(expected.arms.scale7.attempt.from);
  eq(qty(get('eth_chainId')).toString(),expected.chain.chainId);
  eq(qty(get('eth_blockNumber')).toString(),expected.chain.genesisBlock);
  eq(qty(header.timestamp).toString(),expected.chain.genesisTimestamp);
  const accounts=get('eth_accounts').map(lower), needed=new Set([author]);
  for(const name of ARMS)needed.add(lower(expected.arms[name].setupTransactions[0].from));
  for(const address of needed){
    assert(accounts.includes(address),'sealed account absent');
    const nonce=one(rows(startup,'eth_getTransactionCount').filter(r=>lower(r.request.params[0])===address&&r.request.params[1]==='latest'),'initial account nonce');
    eq(qty(result(nonce)),0n);
  }
  const chain={chainId:qty(get('eth_chainId')).toString(),genesisBlock:qty(header.number).toString(),genesisHash:header.hash,genesisTimestamp:qty(header.timestamp).toString(),gasPrice:(qty(result(gasPrice))*2n+1n).toString(),author};
  eq(report.chain,chain,'chain summary from startup raw replies');return chain;
}

export function reconcileRaw(raw,report) {
  // Runner stats count JSON.stringify(envelope) UTF-8 bytes, NOT JSONL newlines.
  const stats={envelopes:raw.length,bytes:raw.reduce((n,r)=>n+Buffer.byteLength(JSON.stringify(r)),0),maxEnvelopes:4096,maxBytes:16*1024*1024};
  assert(stats.envelopes<=stats.maxEnvelopes&&stats.bytes<=stats.maxBytes);
  eq(report.raw,stats,'literal runner raw-summary accounting');return stats;
}

export function reconcileSource(report,pins,expected) {
  eq(expected.source.commit,COMMIT);eq(pins.expectations,EXPECTATIONS);eq(pins.artifacts,ARTIFACTS);eq(pins.preparation,EXPECTATION_SHA);
  assert.match(pins.source,/^[0-9a-f]{40}$/,'sealed runner source commit');
  eq(report.source,{expectedCommit:expected.source.commit,runner:pathToFileURL(RUNNER).href,artifactRoot:pins.artifacts,expectationsPath:pins.expectations,expectationsSha256:pins.preparation},'source summary vs sealed pins');
  return {compiledSourceCommit:expected.source.commit,runnerCommit:pins.source,runner:RUNNER};
}

export function reconcileGates(report) {
  // This checks honest reporting, not success evidence. CLI runs the pinned auditor
  // first. Calling this helper alone proves no transactions or state observations.
  eq(report.failure,null);
  eq(report.gates,{independentExpectations:true,exactRawReplies:true,staticMinedLinked:true,fullSuite:'UNVERIFIED by this runner',bParity:'NOT CLAIMED',stateProof:'NOT PROVIDED'},'gate declarations remain narrow');
}

export function reconcileSummaries(raw,report,expected,pins) {
  const gas=reconcileGas(raw,report,expected),chain=reconcileChain(raw,report,expected),stats=reconcileRaw(raw,report),source=reconcileSource(report,pins,expected);
  reconcileGates(report);
  return {gas,chain,raw:stats,source}; // Deliberately no standalone PASS assertion.
}

export function verifyPins(pins,expected) {
  eq(version,'6.15.0');eq(pins.preparation,EXPECTATION_SHA);eq(pins.expectations,EXPECTATIONS);eq(pins.artifacts,ARTIFACTS);
  const mandatory=[EXPECTATIONS,PREP+'/prepare.mjs',PREP+'/runtime.mjs',AUDITOR,PREP+'/preparation.test.mjs',PREP+'/preparation-details.json',PREP+'/assumptions.md',LAB+'/foundry.toml',RUNNER,LAB+'/script/rollback-control.test.mjs',RUN+'/launch.mjs',RUN+'/seal-pins.mjs',RUN+'/supplemental-check.mjs',RUN+'/supplemental-check.test.mjs','/tmp/efs-c-control-preparation-review-20260914.md','/tmp/efs-c-control-runner-review-20260913.md','/tmp/efs-c-controls-launch-review-20260914.md'];
  for(const file of mandatory)assert(Object.hasOwn(pins.files,file),'missing mandatory file pin '+file);
  for(const [file,hash] of Object.entries(pins.files)){assert(path.isAbsolute(file));assert.match(hash,/^[0-9a-f]{64}$/);eq(sha(fs.readFileSync(file)),hash,'pinned file '+file);}
  eq(pins.files[EXPECTATIONS],EXPECTATION_SHA);
  for(const [file,hash] of Object.entries({...expected.source.sourceSha256,...expected.source.artifactSha256}))eq(pins.files[file],hash,'sealed expected source/artifact inventory '+file);
  eq(expected.source.preparationSha256.prepare,pins.files[PREP+'/prepare.mjs']);
  eq(expected.source.preparationSha256.runtime,pins.files[PREP+'/runtime.mjs']);
  assert.match(pins.source,/^[0-9a-f]{40}$/);
  const committedRunner=execFileSync('git',['show',pins.source+':'+path.relative(REPO,RUNNER)],{cwd:REPO,maxBuffer:4*1024*1024});
  eq(sha(committedRunner),pins.files[RUNNER],'runner bytes belong to sealed runner commit');
  const artifacts=Object.keys(expected.source.artifactSha256), sourcePaths=new Set();eq(artifacts.length,6);
  const artifactNames=ROLES.map(role=>ARTIFACTS+'/'+(ROLES.indexOf(role)<3?role+'.sol':'FixtureActors.sol')+'/'+role+'.json');
  eq([...artifacts].sort(),artifactNames.sort(),'all six exact artifact paths');
  for(const file of artifacts){
    const artifact=JSON.parse(fs.readFileSync(file)),meta=typeof artifact.metadata==='string'?JSON.parse(artifact.metadata):artifact.metadata;
    eq(meta.compiler.version,'0.8.30+commit.73712a01','compiler version');eq(meta.settings.optimizer,{enabled:true,runs:200},'optimizer');eq(meta.settings.viaIR,true,'viaIR');eq(meta.settings.evmVersion,'cancun','EVM target');
    const role=path.basename(file,'.json');eq(meta.settings.compilationTarget,{[ROLES.indexOf(role)<3?'src/'+role+'.sol':'test/FixtureActors.sol']:role},'compilation target');
    assert(Object.keys(meta.sources).length>0);
    for(const [name,entry] of Object.entries(meta.sources)){
      const resolved=path.resolve(LAB,name.startsWith('@latticexyz/')?'vendor/'+name:name);
      assert(Object.hasOwn(expected.source.sourceSha256,resolved),'unsealed compiler source '+name);
      eq(lower(keccak256(fs.readFileSync(resolved))),lower(entry.keccak256),'compiler source hash '+name);sourcePaths.add(resolved);
    }
  }
  return {pinnedFiles:Object.keys(pins.files).length,artifacts:6,compilerSourceFiles:sourcePaths.size,ethers:version};
}

export async function checkPacket(packet,pinsPath) {
  const pinBytes=fs.readFileSync(pinsPath),pins=JSON.parse(pinBytes),expBytes=fs.readFileSync(pins.expectations);
  eq(sha(expBytes),EXPECTATION_SHA);const expected=JSON.parse(expBytes),verified=verifyPins(pins,expected);
  const rawBytes=fs.readFileSync(path.join(packet,'raw.jsonl')),reportBytes=fs.readFileSync(path.join(packet,'report.json'));
  assert(rawBytes.length<=16*1024*1024,'raw file bound');
  const raw=rawBytes.toString().trimEnd().split('\n').map(x=>JSON.parse(x)),report=JSON.parse(reportBytes);
  const {audit}=await import(pathToFileURL(AUDITOR).href);
  const evidence=audit(raw,report,expected); // Existing immutable implementation.
  eq(evidence.status,'PASS_RPC_OBSERVED');
  const summaries=reconcileSummaries(raw,report,expected,pins);
  return {schema:'efs-lab-c/supplemental-summary-audit/1',status:'PASS_RPC_OBSERVED_SUMMARIES',verified,summaries,observationAudit:evidence,inputSha256:{pins:sha(pinBytes),expectations:sha(expBytes),raw:sha(rawBytes),report:sha(reportBytes),auditor:pins.files[AUDITOR],supplement:pins.files[RUN+'/supplemental-check.mjs']},limitations:['Requires trusted pre-run pins and reviewed fault semantics; does not authenticate chain state or independently reproduce compilation.','Compiler metadata and every referenced source hash are checked, not a fresh compiler execution.','Gas is receipt gas for these controls, not normal product prices or feature parity.']};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const [packet,pinsPath]=process.argv.slice(2);assert(packet&&pinsPath,'usage: supplemental-check.mjs RESULT_DIRECTORY PINS_JSON');console.log(JSON.stringify(await checkPacket(packet,pinsPath),null,2));}
  catch(error){console.log(JSON.stringify({schema:'efs-lab-c/supplemental-summary-audit/1',status:'FAIL_OR_GAP',failure:error.stack},null,2));process.exitCode=1;}
}
