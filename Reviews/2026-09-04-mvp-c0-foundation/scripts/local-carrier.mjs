// Local laboratory orchestration only. Never accepts an external RPC or wallet.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { ContractFactory, FetchRequest, JsonRpcProvider, keccak256 } from 'ethers';
import { encodeDeployment, experimentCommitment } from '../reference/run-codec.mjs';

export const FILE_CAP=16384n, RANGE_CAP=4096n, TX_GAS=29000000n;
export const syntheticSeed='0x'+'55'.repeat(32), syntheticType='0x'+'11'.repeat(32);
const zero='0x'+'00'.repeat(32);
export function artifact(source,name=source) {
  return JSON.parse(readFileSync(new URL(`../out/${source}.sol/${name}.json`,import.meta.url)));
}
export async function transact(method,...args) {
  const transaction=await method.send(...args,{gasLimit:TX_GAS});
  const receipt=await transaction.wait(1,10000);
  assert.equal(receipt.status,1); assert(receipt.gasUsed<TX_GAS);
  return receipt;
}
async function freePort() {
  const server=createServer();
  await new Promise((resolve,reject)=>{ server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
  const port=server.address().port;
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  return port;
}
export async function withLocalCarrier(action) {
  const port=await freePort();
  const child=spawn('anvil',['--host','127.0.0.1','--port',String(port),'--hardfork','cancun','--chain-id','31337','--gas-limit','30000000','--accounts','1','--no-cors','--quiet'],{stdio:'ignore'});
  let spawnError; child.on('error',error=>{spawnError=error;});
  let provider;
  const exited=()=>child.exitCode!==null||child.signalCode!==null||spawnError;
  const kill=()=>{ if(!exited()) child.kill('SIGKILL'); };
  const onSignal=()=>{kill(); process.exit(130);};
  process.once('exit',kill); process.once('SIGINT',onSignal); process.once('SIGTERM',onSignal);
  const watchdog=setTimeout(()=>{kill();},90000);
  try {
    const url=`http://127.0.0.1:${port}`;
    let ready=false;
    for(let attempt=0;attempt<100&&!ready;++attempt) {
      if(exited()) throw new Error('Local Anvil exited before readiness');
      try {
        const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(500)});
        ready=(await response.json()).result==='0x7a69';
      } catch { /* bounded loopback-only startup retry */ }
      if(!ready) await delay(100);
    }
    assert(ready,'Local Anvil startup timed out');
    const request=new FetchRequest(url); request.timeout=5000;
    provider=new JsonRpcProvider(request,31337,{staticNetwork:true,cacheTimeout:-1});
    provider.pollingInterval=50;
    const signer=await provider.getSigner(0);
    const block=await provider.getBlock('latest');
    assert.equal(block.gasLimit,30000000n);
    const deploy=async (source,args=[])=>{
      const compiled=artifact(source);
      const contract=await new ContractFactory(compiled.abi,compiled.bytecode.object,signer).deploy(...args,{gasLimit:TX_GAS});
      const transaction=contract.deploymentTransaction();
      const receipt=await transaction.wait(1,10000);
      assert.equal(receipt.status,1); assert(receipt.gasUsed<TX_GAS);
      const runtime=await provider.getCode(await contract.getAddress());
      assert(runtime.length>2&&(runtime.length-2)/2<=24576,'normal EIP-170 runtime bound');
      return {contract,initCodeHash:keccak256(transaction.data),runtimeCodeHash:keccak256(runtime),runtimeBytes:(runtime.length-2)/2};
    };
    const codecDeployment=await deploy('CodecHarness');
    const hostDeployment=await deploy('CarrierHost');
    const host=hostDeployment.contract;
    const carrierDeployment=await deploy('MvpC0StateByteStore',[syntheticSeed,await host.getAddress(),FILE_CAP,RANGE_CAP]);
    const carrier=carrierDeployment.contract;
    // CREATE transactions, not CREATE2: zero salts are synthetic placeholders, not provenance.
    const deployment={experimentSeed:syntheticSeed,coreAddress:await host.getAddress(),coreCreate2Salt:zero,coreInitCodeHash:hostDeployment.initCodeHash,coreRuntimeCodeHash:hostDeployment.runtimeCodeHash,byteStoreAddress:await carrier.getAddress(),byteStoreCreate2Salt:zero,byteStoreInitCodeHash:carrierDeployment.initCodeHash,byteStoreRuntimeCodeHash:carrierDeployment.runtimeCodeHash};
    const deploymentBytes=encodeDeployment(deployment), commitment=experimentCommitment(deployment);
    return await action({provider,signer,host,carrier,codec:codecDeployment.contract,deployment,deploymentBytes,commitment,blockGasLimit:block.gasLimit,
      runtime:{codec:codecDeployment.runtimeCodeHash,host:hostDeployment.runtimeCodeHash,carrier:carrierDeployment.runtimeCodeHash},
      runtimeBytes:{codec:codecDeployment.runtimeBytes,host:hostDeployment.runtimeBytes,carrier:carrierDeployment.runtimeBytes}});
  } finally {
    clearTimeout(watchdog); provider?.destroy();
    if(!exited()) {
      child.kill('SIGTERM');
      for(let attempt=0;attempt<20&&!exited();++attempt) await delay(50);
      kill();
    }
    process.removeListener('exit',kill); process.removeListener('SIGINT',onSignal); process.removeListener('SIGTERM',onSignal);
  }
}
