import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const run='/tmp/efs-c-controls-paid-20260914.MCwNJk';
const repo='/Users/james/Code/EFS/planning-warroom-c-run';
const lab=`${repo}/Reviews/2026-09-12-efs-path-decision/lab-c`;
const prep='/tmp/efs-c-control-independent-prep-20260913.MkbdXi';
const artifacts='/tmp/efs-c-readiness-build-20260913.NoPDle/out';
const expectations=`${prep}/expectations.json`;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const source=process.argv[2];
assert.match(source,/^[0-9a-f]{40}$/);assert.equal(git(['rev-parse','HEAD']),source);
assert.equal(git(['status','--porcelain','--untracked-files=no']),'');
assert.equal(sha(readFileSync(expectations)),'2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e');
const expected=JSON.parse(readFileSync(expectations));
const files={};
for(const [path,hash] of Object.entries({...expected.source.sourceSha256,...expected.source.artifactSha256})){
 assert.equal(sha(readFileSync(path)),hash,`source/artifact pin ${path}`);files[path]=hash;
}
for(const path of Object.keys(expected.source.artifactSha256)){
 const metadata=JSON.parse(readFileSync(path)).metadata;
 assert.deepEqual(metadata.settings.optimizer,{enabled:true,runs:200});
 assert.equal(metadata.settings.evmVersion,'cancun');assert.equal(metadata.settings.viaIR,true);
 assert.equal(metadata.compiler.version,'0.8.30+commit.73712a01');
}
for(const path of [expectations,`${prep}/prepare.mjs`,`${prep}/runtime.mjs`,`${prep}/audit.mjs`,`${prep}/preparation.test.mjs`,`${prep}/preparation-details.json`,`${prep}/assumptions.md`,`${lab}/foundry.toml`,`${lab}/script/rollback-control.mjs`,`${lab}/script/rollback-control.test.mjs`,`${run}/launch.mjs`,`${run}/seal-pins.mjs`,'/tmp/efs-c-control-preparation-review-20260914.md','/tmp/efs-c-control-runner-review-20260913.md','/tmp/efs-c-controls-launch-review-20260914.md']) files[path]=sha(readFileSync(path));
for(const name of ['supplemental-check.mjs','supplemental-check.test.mjs']) files[`${run}/${name}`]=sha(readFileSync(`${run}/${name}`));
const scratchRoots=[run,prep,'/tmp/efs-b-controls-paid-20260913.00DzB4','/tmp/efs-b-rollback-build-20260913.Ps480X','/tmp/efs-b-parity-build-20260913.lcAzU1','/tmp/efs-b-parity-paid-20260913.KJ23qU','/tmp/efs-c-readiness-build-20260913.NoPDle','/tmp/efs-paid-c-run-20260913.YxKavf','/tmp/efs-b-parity-inputs-20260913.AHqH23','/tmp/efs-b-control-independent-prep-20260913.i4vLAa'];
const pins={source,preparation:sha(readFileSync(expectations)),artifacts,expectations,files,scratchRoots};
writeFileSync(`${run}/pins.json`,JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({source,files:Object.keys(files).length,pinsSha256:sha(readFileSync(`${run}/pins.json`))}));
