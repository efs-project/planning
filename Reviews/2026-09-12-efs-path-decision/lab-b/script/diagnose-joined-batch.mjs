// Bounded replay of retained failed setup input, never a storage trace or Core edit.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from './compact-environment.mjs';
const input=process.argv[2];assert(input,'retained failed run directory required');
const old=JSON.parse(await readFile(join(input,'manifest.json'),'utf8'));
const records=(await readFile(join(input,'transactions.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);
const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append'});
try{
  for(const key of Object.keys(old.contracts)){assert.equal(env.manifest.contracts[key].address,old.contracts[key].address);assert.equal(env.manifest.contracts[key].codeHash,old.contracts[key].codeHash);}
  const setup=records.filter(row=>row.label.startsWith('setup/'));
  for(const row of setup.filter(row=>row.status==='SUCCESS')){
    assert.equal(env.ethers.keccak256(row.rawTransaction),row.transactionHash);
    const tx=env.ethers.Transaction.from(row.rawTransaction);await env.send('replay/'+row.label,{to:tx.to,data:tx.data,gasLimit:tx.gasLimit},row.signer);
  }
  const failed=setup.find(row=>row.status==='REVERTED');assert(failed);const tx=env.ethers.Transaction.from(failed.rawTransaction);
  assert.equal(env.ethers.keccak256(failed.rawTransaction),failed.transactionHash);
  let observation;try{await env.rpc('eth_call',[{from:tx.from,to:tx.to,data:tx.data,gas:env.ethers.toQuantity(tx.gasLimit)},'latest']);assert.fail('failed input unexpectedly succeeded');}
  catch(error){assert(error.rpcError);observation=error.rpcError;}
  const decoded=new env.ethers.Interface(env.contracts.ledger.abi).parseError(observation.data);
  assert.equal(decoded.name,'E_GAS','explicit reserve guard, not an unrelated callback rejection');
  await env.writeReport('batch-reserve-diagnostic',{input,failedTransaction:failed.transactionHash,failedReceipt:failed.receipt,failedGasUsed:failed.gasUsed,
    signedGasLimit:String(tx.gasLimit),preStateAdmissions:String((await env.call('ledger','counts'))[0]),observation,decoded:{name:decoded.name,selector:decoded.selector,args:Array.from(decoded.args)},
    profile:'exact retained contract addresses/code hashes; real pre-state setup replay; bounded eth_call; no storage traces'});
}finally{await env.close();}
