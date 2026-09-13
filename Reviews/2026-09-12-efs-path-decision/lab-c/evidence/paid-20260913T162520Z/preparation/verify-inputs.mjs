import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const path='/tmp/efs-c-independent-prep-20260913.DM1226/c-native-inputs.json';
const d=JSON.parse(fs.readFileSync(path));let checks=0;
const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cast=(...a)=>execFileSync('/Users/james/.foundry/bin/cast',a,{encoding:'utf8',maxBuffer:2e6}).trim();
const src='/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c';
check(execFileSync('git',['-C','/Users/james/Code/EFS/planning-warroom-c-run','rev-parse','HEAD'],{encoding:'utf8'}).trim(),d.sourceRevision);
for(const s of d.sources)check(sha(fs.readFileSync(`${src}/${s.path}`)),s.sha256);
for(const x of Object.values(d.deployment)){
  const raw=fs.readFileSync(x.artifactPath);check(sha(raw),x.artifactSha256);const a=JSON.parse(raw);check(sha(JSON.stringify(a.abi)),x.abiCanonicalSha256);
  let creation=a.bytecode.object,runtime=a.deployedBytecode.object;
  for(const p of x.patches){const value=p.value.slice(2).padStart(p.length*2,'0');check(value.length,p.length*2);if(p.section==='runtime')runtime=runtime.slice(0,2+p.start*2)+value+runtime.slice(2+(p.start+p.length)*2);else creation=creation.slice(0,2+p.start*2)+value+creation.slice(2+(p.start+p.length)*2);}
  check(cast('keccak',runtime),x.runtimeKeccak);check(cast('keccak',creation),x.creationKeccak);check(cast('keccak',creation+x.constructorSuffix.slice(2)),x.initCodeKeccak);
  check((runtime.length-2)/2,x.runtimeBytes);check((creation.length-2)/2,x.creationBytes);
}
const abi=JSON.parse(fs.readFileSync(d.deployment.MeasurementConsumer.artifactPath)).abi;
const canonical=x=>x.type.startsWith('tuple')?'('+x.components.map(canonical).join(',')+')'+x.type.slice(5):x.type;
for(const p of d.paid){const method=abi.find(x=>x.name===(p.row.startsWith('POINT')?'paidPoint':'paidList'));check(cast('sig',method.name+'('+method.inputs.map(canonical).join(',')+')'),p.calldata.slice(0,10));check(Object.keys(p.expect).length,16);check(Object.keys(p.expectedSelection).length,23);check(Object.keys(p.expectedPlacement).length,20);if(p.placementExpect)check(Object.keys(p.placementExpect).length,7);check(p.expect.basisAdmission,16);check((p.expectedReturn.length-2)/2,p.row.startsWith('POINT')?24*32:44*32);check((p.expectedEvent.data.length-2)/2,44*32);}
let frontier=0;for(const [name,p] of Object.entries(d.publications)){check(p.basis,frontier);check(p.firstAdmission,frontier+1);check(p.leafCount,p.actions.length);check(p.bodies.length,p.actions.length);frontier+=p.actions.length;check(p.frontier,frontier);check(p.caller,d.accounts.deployer.address);check(p.calldataStatus,'EXACT');if(p.proofKind===2){
  check([27,28].includes(p.signature.v),true);check(BigInt(p.signature.s)<=0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n,true);check(cast('wallet','verify','--no-hash','--address',d.accounts.authorA.address,p.intentDigest,p.signature.raw).startsWith('Validation succeeded.'),true);
  check(cast('wallet','sign','--no-hash','--mnemonic',Array(11).fill('test').concat('junk').join(' '),'--mnemonic-index','1',p.intentDigest),p.signature.raw);
  const evidence=d.rawReadChecks.find(x=>x.label===`Evidence:${name}`);check(evidence.postB1Mask,undefined);const raw=evidence.postB1Expected;check('0x'+raw.slice(2+161*2,2+193*2),p.signature.r);check('0x'+raw.slice(2+193*2,2+225*2),p.signature.s);check(Number.parseInt(raw.slice(2+225*2,2+226*2),16),p.signature.v);
}}
check(frontier,16);
for(const r of d.rawReadChecks){check(r.calldata.slice(0,10),'0x419b58fd');check(BigInt('0x'+r.initialExpected.slice(2,66)),96n);check(BigInt('0x'+r.postB1Expected.slice(2,66)),96n);check(r.postB1Mask,undefined);}
check(d.publications.A1.actions[3].purpose,d.constants.FOLDER);check(d.publications.B1.actions.filter(x=>x.purpose===d.constants.FOLDER).length,0);
console.log(JSON.stringify({status:'OFFLINE_INPUT_QA_ONLY',checks,manifestSha256:sha(fs.readFileSync(path)),manifestBytes:fs.statSync(path).size,rawReadChecks:d.rawReadChecks.length,paidRows:d.paid.length,chainCalls:0}));
