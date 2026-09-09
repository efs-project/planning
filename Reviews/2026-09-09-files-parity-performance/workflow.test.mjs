import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { compileUpgrade, withUpgrade } from '../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { AbiCoder, keccak256 } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const moduleUrl = new URL('./workflow.mjs', import.meta.url);
const baselineUrl = new URL('./baseline.json', import.meta.url);
const A = '0x'+'0'.repeat(52)+'ffffffffffff';
const B = '0x'+'0'.repeat(48)+'bbbbbbbbbbbbbbbb';
const abi = AbiCoder.defaultAbiCoder();
const hash = s => keccak256(Buffer.from(s));
const purpose = s => keccak256(abi.encode(['bytes32','bytes32'],[hash('efs2/purpose/1'),hash(s)]));
const role = s => keccak256(abi.encode(['bytes32','bytes32'],[hash('efs2/fieldrole/1'),hash(s)]));
const key = (author,p,s,r) => keccak256(abi.encode(['bytes32','bytes32','bytes32'],[hash('efs2/binding/1'),author,keccak256(abi.encode(['bytes32','bytes32','bytes32','bytes32'],[hash('efs2/position/1'),p,s,r]))]));
const textField = hex => Buffer.from(hex.slice(6),'hex').toString();

// Break: no lifecycle implementation, or a synthetic success replacing real publications.
test('lifecycle API exists before the real-state workflow can run', async () => {
  const workflow = existsSync(moduleUrl) ? await import(moduleUrl) : {};
  assert.equal(typeof workflow.runFileLifecycle, 'function');
});

// Break: a successful lifecycle alone allowing incomplete resource provenance
// or invented read/deployment measurements into the saved baseline.
test('saved evidence gate requires pinned provenance and bounded resource measurements', async t => {
  const { encodeReport } = await import(moduleUrl);
  const saved=JSON.parse(readFileSync(baselineUrl,'utf8'));
  assert.doesNotThrow(()=>encodeReport(saved));
  const missing=[
    'resources.sourceCommit','resources.trackedDiffHash','resources.compilerBinaryHash','resources.compiler',
    'resources.compiler.version','resources.settings','resources.settings.optimizer','resources.settings.optimizer.runs',
    'resources.settings.metadata','resources.settings.compilationTarget','resources.settings.evmVersion','resources.settings.viaIR',
    'resources.settings.libraries','resources.settings.remappings','resources.versions','resources.versions.anvil',
    'resources.compilerInputHash','resources.compilerOutputHash','resources.dependencyLockHash','resources.supportSourcePins',
    'resources.artifactPins','resources.artifactPins.ProxyAdmin','resources.inputPins.groups','resources.inputPins.intrinsic',
    'workflowSourcePins','workflowSourcePins.workflow.mjs','resources.deployment','resources.deployment.coreProxy',
    'resources.deployment.UpgradeAdmissionLibrary.runtimeBytes','resources.deployment.UpgradeAdmissionLibrary.initcodeBytes',
    'resources.runtimeCeiling','resources.initcodeCeiling','resources.txGasCeiling','reads','reads.availability',
    'reads.scope','reads.rpcCalls','reads.jsonResultBytes','reads.core','reads.execution','checkpoints.3.retainedDigest',
  ];
  const locate=(r,path)=>{
    // Dotted source filenames are map keys, not nested object paths.
    if(path==='workflowSourcePins.workflow.mjs')return [r.workflowSourcePins,'workflow.mjs'];
    const keys=path.split('.');return [keys.slice(0,-1).reduce((o,k)=>o[k],r),keys.at(-1)];
  };
  for(const path of missing) await t.test('reject missing '+path,()=>{
    const broken=structuredClone(saved),[owner,key]=locate(broken,path);delete owner[key];
    assert.throws(()=>encodeReport(broken),'missing '+path);
  });
  for(const [label,mutate] of [
    ['malformed compiler hash',r=>r.resources.compilerBinaryHash='not-a-hash'],
    ['empty compiler version',r=>r.resources.compiler.version=''],
    ['empty input groups',r=>r.resources.inputPins.groups=[]],
    ['missing input group',r=>r.resources.inputPins.groups.pop()],
    ['malformed input group',r=>r.resources.inputPins.groups[0]='bad'],
    ['empty workflow pins',r=>r.workflowSourcePins={}],
    ['empty deployment rows',r=>r.resources.deployment={}],
    ['runtime beyond ceiling',r=>r.resources.deployment.UpgradeAdmissionLibrary.runtimeBytes=24577],
    ['initcode beyond ceiling',r=>r.resources.deployment.coreProxy.initcodeBytes=49153],
    ['raised runtime ceiling',r=>r.resources.runtimeCeiling=24577],
    ['raised gas ceiling',r=>r.resources.txGasCeiling='16777217'],
    ['invalid checkpoint digest',r=>r.checkpoints[3].retainedDigest='bad'],
    ['invalid read outcome',r=>r.reads.availability='VERIFIED'],
    ['negative read count',r=>r.reads.rpcCalls=-1],
    ['fractional read bytes',r=>r.reads.jsonResultBytes=1.5],
    ['inconsistent read count',r=>r.reads.rpcCalls++],
    ['unavailable reads without reason',r=>r.reads={availability:'UNAVAILABLE'}],
  ]) await t.test('reject '+label,()=>{const broken=structuredClone(saved);mutate(broken);assert.throws(()=>encodeReport(broken),label);});
  await t.test('accept explicitly unavailable reads with a reason',()=>{
    const unavailable=structuredClone(saved);unavailable.reads={availability:'UNAVAILABLE',reason:'Reader counters unavailable for this evidence source.'};
    assert.doesNotThrow(()=>encodeReport(unavailable));
  });
});

// Breaks: wrong author/parent/name/head, erased revisions, lost upgrade data,
// atomic CAS loss publishing a partial placement, or history masquerading as current tags.
test('real lifecycle survives an upgrade with exact authored heads, immutable history and gas bounds', { timeout: 300000 }, async t => {
  if (!existsSync(moduleUrl)) { assert.fail('runFileLifecycle implementation missing'); }
  const { runFileLifecycle, encodeReport, exportBaseline, nonTimingOutcomes } = await import(moduleUrl);
  compileUpgrade();
  let report, cleanup;
  await withUpgrade(async lab => { cleanup = lab.cleanup; report = await runFileLifecycle(lab); });
  assert.equal(cleanup.stopped, true);
  report.cleanup = cleanup;
  assert.equal(report.checkpoints.every(c => c.outcome === 'VERIFIED'), true);
  assert.equal(report.ids.createdFile, report.ids.movedFile);
  assert(report.operations.every(op => BigInt(op.gasUsed) <= 16777216n));
  for (const phase of ['U1','U2']) {
    const ids = report.ids[phase];
    const checkpoint = name => report.checkpoints.find(c => c.name === phase+'/'+name);
    const head = (c,p,s,r,a=A) => c.heads[key(a,p,s,r)];
    const record = (c,id) => c.entries.find(e => e.recordId === id);
    const created = checkpoint('created'), edited = checkpoint('edited'), renamed = checkpoint('renamed'), moved = checkpoint('moved');
    for (const id of [ids.root,ids.destination]) {
      const root = record(created,id);
      assert.equal(root.fields[0], A);
      assert.equal(root.fields[2], '0x01'+hash('efs2/files/meaning/directory/1').slice(2));
      assert.equal(head(created,purpose('objects/publisher-charter/1'),id,'0x'+'0'.repeat(63)+'1').target,id);
    }
    assert.equal(record(created,ids.file).fields[2],'0x01'+hash('efs2/files/meaning/file/1').slice(2));
    assert.equal(record(created,ids.file).principal,A);
    assert.equal(head(created,purpose('objects/publisher-charter/1'),ids.file,'0x'+'0'.repeat(63)+'1').target,ids.file);
    assert.equal(head(edited,purpose('files/revision-head/1'),ids.file,role('files/current-revision/1')).target,ids.revision2);
    assert.equal(record(edited,ids.revision1).fields[0],ids.file);
    assert.equal(record(edited,ids.revision2).fields[0],ids.file);
    assert.equal(record(edited,ids.revision2).fields[5],'0x0001'+ids.revision1.slice(2));
    assert.equal(textField(record(created,ids.originalEntry).fields[1]),'note.txt');
    assert.equal(record(created,ids.originalEntry).fields[2],ids.file);
    const oldHead = head(renamed,purpose('files/name-slot/1'),ids.root,role('note.txt'));
    assert.equal(oldHead.target,ids.renameWhiteout);
    assert.equal(record(renamed,oldHead.target).fields.length,2);
    assert.equal(record(renamed,oldHead.target).fields[0],ids.root);
    assert.equal(textField(record(renamed,oldHead.target).fields[1]),'note.txt');
    const renameHead = head(renamed,purpose('files/name-slot/1'),ids.root,role('field-notes.txt'));
    assert.equal(record(renamed,renameHead.target).fields[2],ids.file);
    assert.equal(textField(record(renamed,renameHead.target).fields[1]),'field-notes.txt');
    const source = head(moved,purpose('files/name-slot/1'),ids.root,role('field-notes.txt'));
    const destination = head(moved,purpose('files/name-slot/1'),ids.destination,role('field-notes.txt'));
    assert.equal(source.target,ids.moveWhiteout);
    assert.deepEqual(record(moved,source.target).fields,[ids.root,'0x000f'+Buffer.from('field-notes.txt').toString('hex')]);
    assert.equal(destination.target,ids.movedEntry);
    assert.deepEqual(record(moved,ids.movedEntry).fields.slice(0,3),[ids.destination,'0x000f'+Buffer.from('field-notes.txt').toString('hex'),ids.file]);
    assert.equal(head(checkpoint('name-retracted'),purpose('files/name-slot/1'),ids.root,role('note.txt')).state,2);
    const tagPurpose = hash('efs.fixture.tag-current/1'), tagRole = hash('efs.fixture.tag/ocean');
    const both = checkpoint('tagged-both'), untagged = checkpoint('untagged-a'), retagged = checkpoint('retagged-a');
    assert.deepEqual(both.entries.filter(e => e.recordId === ids.tagAssertion).map(e => e.principal),[A,B]);
    assert.equal(head(untagged,tagPurpose,ids.file,tagRole,A).state,2);
    assert.equal(head(untagged,tagPurpose,ids.file,tagRole,B).state,1);
    assert.equal(head(untagged,tagPurpose,ids.file,tagRole,B).target,ids.tagAssertion);
    assert.deepEqual(retagged.entries.filter(e => e.recordId === ids.tagAssertion).map(e => e.principal),[A,B,A]);
    assert.equal(new Set(retagged.entries.filter(e => e.recordId === ids.tagAssertion).map(e=>e.occurrenceId)).size,3);
    assert.equal(retagged.histories[key(A,tagPurpose,ids.file,tagRole)].length,3);
    assert.equal(head(retagged,tagPurpose,ids.file,tagRole,A).revision,'3');
    assert.equal(head(retagged,tagPurpose,ids.file,tagRole,B).revision,'1');
    const rejected = report.operations.find(op => op.name === phase+'/stale-rename');
    assert.equal(rejected.status,'REJECTED');
    assert.equal(rejected.rejection.name,'ErrCasRevision');
    assert.deepEqual(rejected.rejection.args,[key(A,purpose('files/name-slot/1'),ids.root,role('note.txt')),'1','2']);
    assert.equal(rejected.rejection.preflight,rejected.rejection.mined);
    assert.equal(checkpoint('before-stale').retainedDigest,checkpoint('after-stale').retainedDigest);
    let previous=checkpoint('retagged-a');
    const scaleSalts=[];
    for (const n of [1,2,4,8]) {
      assert.equal(report.operations.find(op=>op.name===phase+'/scale-'+n).leafCount,n);
      const scaled=checkpoint('scale-'+n);
      assert.equal(BigInt(scaled.counts[0])-BigInt(previous.counts[0]),BigInt(n));
      const fresh=scaled.entries.slice(previous.entries.length);
      assert.equal(fresh.length,n);
      assert(fresh.every(e=>e.principal===A && e.fields[0]===A && e.fields[2]==='0x00'));
      scaleSalts.push(...fresh.map(e=>e.fields[1]));previous=scaled;
    }
    assert.equal(new Set(scaleSalts).size,15);
  }
  assert.equal(report.checkpoints.find(c=>c.name==='before-upgrade').retainedDigest,report.checkpoints.find(c=>c.name==='after-upgrade').retainedDigest);
  assert.equal(report.checkpoints.find(c=>c.name==='terminal').revision,'2');
  assert.equal(report.reads.availability,'MEASURED');
  assert(report.reads.rpcCalls > 0 && report.reads.jsonResultBytes > 0);

  await t.test('evidence encoder refuses missing or non-verified checkpoints and missing receipts', () => {
    assert.doesNotThrow(()=>encodeReport(report));
    for(const mutate of [r=>r.checkpoints.pop(),r=>r.checkpoints[0].outcome='UNKNOWN',r=>r.operations.pop(),r=>delete r.operations[0].gasUsed,r=>delete r.resources.sourcePins,r=>r.resources.sourcePins={},r=>delete r.checkpoints[2].heads,r=>r.terminalSnapshot.counts[0]='0']) {
      const broken=structuredClone(report); mutate(broken); assert.throws(()=>encodeReport(broken));
    }
    const huge=structuredClone(report);huge.extra='x'.repeat(2*1024*1024);assert.throws(()=>encodeReport(huge),/bounded/);
    assert.equal(exportBaseline(report,{EFS_FILES_PERF_EVIDENCE:'0'}),false);
  });
  if(existsSync(baselineUrl)) assert.deepEqual(nonTimingOutcomes(report),nonTimingOutcomes(JSON.parse(readFileSync(baselineUrl,'utf8'))));
  exportBaseline(report,process.env);
  t.diagnostic(JSON.stringify({operations:report.operations.length,checkpoints:report.checkpoints.length,gas:report.operations.filter(o=>o.category==='metadata').map(o=>[o.name,o.gasUsed]),reads:report.reads}));
});
