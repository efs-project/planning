// Fresh offline process: only retained evidence, generic reader, and ethers.
import {loadEthers} from '../script/compact-environment.mjs';
import {verifyGuardedClaim} from '../browser/guarded-archive.mjs';
import * as described from '../browser/described-type-archive.mjs';
const e=await loadEthers();let bytes='';
for await(const chunk of process.stdin){bytes+=chunk;if(Buffer.byteLength(bytes)>32*1024*1024)throw Error('OFFLINE_INPUT_BOUND');}
const bundles=JSON.parse(bytes),results=[];
for(const bundle of bundles)results.push(await verifyGuardedClaim(e,bundle,{described}));
console.log(JSON.stringify(results));
