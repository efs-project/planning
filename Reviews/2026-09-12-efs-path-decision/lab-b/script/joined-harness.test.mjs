import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from './compact-environment.mjs';
import {seedJoinedScale} from './measure-joined.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
test('benchmark mode retains append-only real receipt/input evidence without raw transactions in memory',{timeout:30000},async t=>{
  const env=await createEnvironment({evidenceMode:'append',benchmarkHistory:true});t.after(()=>env.close());
  assert.equal(env.evidenceMode,'append','benchmark mode is explicit');
  assert.deepEqual(env.historyPolicy,{states:16,transactionBlocks:32},'explicit ephemeral benchmark RPC history');
  const records=(await readFile(join(env.dir,'transactions.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(records.length,env.transactions.length);assert(records.length>5);
  for(const [i,row] of records.entries()){
    assert.equal(env.ethers.keccak256(row.rawTransaction),row.transactionHash);assert.equal(row.transactionHash,env.transactions[i].transactionHash);
    assert.equal(env.ethers.Transaction.from(row.rawTransaction).data.length,2+row.calldataBytes*2);
    assert.equal(BigInt(row.receipt.gasUsed),BigInt(row.gasUsed));assert.equal(env.transactions[i].rawTransaction,undefined);
  }
});
test('bounded scale seed uses real transactions for live churn and contributing-author controls',{timeout:30000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append',benchmarkHistory:true});t.after(()=>env.close());
  const seed=await seedJoinedScale(env,{live:8,lifetime:24,denseAuthors:2,denseNames:2});
  assert(seed,'real seed returns its recipe and identities');
  const sdk=createFilesCompactSdk({ethers:env.ethers,manifest:env.manifest,rpc:env.rpc}),context=await sdk.pin();
  const page=async(folder,authors)=>sdk.listFolderPage({folder,authors,context,budget:32});
  const live=await page(seed.liveFolder,[env.wallets.alice.address]);assert.equal(live.rawTotal,'8');assert.equal(live.pageRows.length,8);
  const churn=await page(seed.churnFolder,[env.wallets.alice.address]);assert.equal(churn.rawTotal,'1');assert.equal(churn.pageRows[0].name.value,'lifetime-23.txt');
  const dense=await page(seed.denseFolder,seed.denseAuthors);assert.equal(dense.rawTotal,'3');assert.equal(dense.pageRows.length,1,'higher author mask hides lower competing placement');
  assert(seed.setup.every(row=>BigInt(row.gasUsed)<=16777216n));
  await env.writeReport('joined-batch-preflight',{seed,metrics:env.metrics});
});
