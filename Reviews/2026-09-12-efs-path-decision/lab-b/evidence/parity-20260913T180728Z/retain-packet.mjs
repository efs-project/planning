// Byte-preserving retention of this completed local experiment; no RPC or source edits.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdirSync,copyFileSync,writeFileSync,constants} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const run='/tmp/efs-b-parity-paid-20260913.KJ23qU';
const inputs='/tmp/efs-b-parity-inputs-20260913.AHqH23';
const build='/tmp/efs-b-parity-build-20260913.lcAzU1';
const repo='/Users/james/Code/EFS/planning-warroom-b-run';
const target=join(repo,'Reviews/2026-09-12-efs-path-decision/lab-b/evidence/parity-20260913T180728Z');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(readFileSync(join(run,'pins.json')));
const audit=JSON.parse(readFileSync(join(run,'audit2.json')));
const launch=JSON.parse(readFileSync(join(run,'launch-record.json')));
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),pins.source);
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:repo,encoding:'utf8'}).trim(),'');
assert.equal(sha(readFileSync(join(inputs,'b-parity-inputs.json'))),pins.independentInputSha256);
assert.equal(audit.transactions,34);assert.equal(audit.deployedTargets,17);assert.equal(audit.paidRows.length,4);
assert.equal(audit.mutationChecks.length,4);assert.equal(launch.success,true);assert(launch.anvil.stoppedAt);
const pairs=[];
for(const name of ['README.md','pins.json','arm-b.json','assemble.mjs','launch.mjs','launch-record.json','launch.log','measure.json','lab-addresses.json','audit-original.mjs','audit-red.mjs','audit.mjs','audit.json','audit2.json','retain-packet.mjs']) pairs.push([join(run,name),name]);
for(const dir of ['controller','independent-observations']) for(const name of readdirSync(join(run,dir)).sort()) pairs.push([join(run,dir,name),`${dir}/${name}`]);
for(const name of ['b-parity-inputs.json','generate-b-parity.mjs','verify-b-parity.mjs','source-assumption-map.md','config.json']) pairs.push([join(inputs,name),`independent-inputs/${name}`]);
for(const name of ['red.mjs','red.json','red.log','red.diff','green.mjs','green.json','green.diff','green-focused.log','green-full.log','green2.mjs','green2.json','green2.diff','green2-focused.log','green2-full.log','green2-node.log','green2-sizes.log']) pairs.push([join(build,name),`verification/${name}`]);
for(const name of ['efs-b-parity-review-20260913.md','efs-b-parity-prechain-review-20260913.md','efs-b-parity-packet-review-20260913.md','efs-bc-parity-cost-interpretation-20260913.md']) pairs.push([join('/tmp',name),`reviews/${name}`]);
const buildManifest=JSON.parse(readFileSync(join(build,'green2.json')));
for(const [name,hash] of Object.entries(buildManifest.artifactHashes)) assert.equal(sha(readFileSync(join(build,'green-out',name))),hash);
for(const [name,hash] of Object.entries(buildManifest.sourceHashes)) assert.equal(sha(readFileSync(join(repo,'Reviews/2026-09-12-efs-path-decision/lab-b',name))),hash);
mkdirSync(target,{recursive:false});
const hashes={};let bytes=0;
for(const [source,relative] of pairs){
  const destination=join(target,relative);mkdirSync(dirname(destination),{recursive:true});
  copyFileSync(source,destination,constants.COPYFILE_EXCL);
  const copy=readFileSync(destination);hashes[relative]=sha(copy);bytes+=copy.length;
  assert.equal(hashes[relative],sha(readFileSync(source)));
}
writeFileSync(join(target,'SHA256.json'),`${JSON.stringify(hashes,null,2)}\n`,{flag:'wx'});
console.log(JSON.stringify({target,source:pins.source,files:pairs.length,bytes,grade:audit.grade,transactions:audit.transactions,paidRows:audit.paidRows.map(({row,gas})=>({row,gas})),qualification:'Copied and hash-verified. Not state-proof, rollback, import or full-Files qualification.'},null,2));
