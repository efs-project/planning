import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLocalNetwork,verifyWalletEnvironment,fundLocalWallet} from './wallet-session.mjs';

const config={rpcUrl:'http://127.0.0.1:57204',manifest:{workbench:true,chainId:31337,contracts:{ledger:{address:'0x'+'12'.repeat(20),codeHash:'runtime'}}}};
const address='0x'+'34'.repeat(20),pageUrl='http://127.0.0.1:57215/';
const expected={eth_chainId:'0x7a69',eth_getBlockByNumber:{hash:'genesis'},eth_getCode:'code',web3_clientVersion:'anvil/v1',eth_getBalance:'0x0'};
const keccak256=()=> 'runtime';
test('explicit add button offers this RPC even when Hardhat has the same chain ID',async()=>{
  const calls=[];
  const ethereum={request:async({method,params})=>{calls.push({method,params});if(method==='eth_chainId')return '0x7a69';}};
  await requestLocalNetwork({ethereum,config,pageUrl,add:true});
  assert.equal(calls.find(c=>c.method==='wallet_addEthereumChain')?.params[0].rpcUrls[0],config.rpcUrl);
  assert.equal(calls.at(-1).method,'wallet_switchEthereumChain');
});
test('unknown network is added with the exact local RPC then switched',async()=>{
  const calls=[];let chain='0x1',known=false;
  const ethereum={request:async({method,params})=>{calls.push({method,params});
    if(method==='eth_chainId')return chain;
    if(method==='wallet_switchEthereumChain'){if(!known)throw Object.assign(Error('unknown'),{code:4902});chain=params[0].chainId;}
    if(method==='wallet_addEthereumChain')known=true;
  }};
  await requestLocalNetwork({ethereum,config,pageUrl});
  assert.equal(chain,'0x7a69');
  assert.equal(calls.find(c=>c.method==='wallet_addEthereumChain').params[0].rpcUrls[0],config.rpcUrl);
});
test('matching chain ID cannot hide another local chain or mismatched deployment',async()=>{
  const rpc=async m=>expected[m];
  await assert.rejects(verifyWalletEnvironment({ethereum:{request:async({method})=>method==='eth_getBlockByNumber'?{hash:'different'}:expected[method]},config,rpc,keccak256}),/different local chain/);
  await assert.rejects(verifyWalletEnvironment({ethereum:{request:async({method})=>expected[method]},config,rpc,keccak256:()=> 'wrong'}),/deployment/);
  await verifyWalletEnvironment({ethereum:{request:async({method})=>expected[method]},config,rpc,keccak256});
});
test('local faucet refuses public origins and never reduces a funded balance',async()=>{
  const calls=[],rpc=async(m,p)=>{calls.push([m,p]);return m==='eth_getBalance'?'0x'+(200n*10n**18n).toString(16):expected[m];};
  await assert.rejects(fundLocalWallet({config:{...config,rpcUrl:'https://mainnet.base.org'},pageUrl,address,rpc}),/local/);
  await assert.rejects(fundLocalWallet({config,pageUrl:'https://example.org',address,rpc}),/local/);
  await fundLocalWallet({config,pageUrl,address,rpc});
  assert.equal(calls.filter(([m])=>m==='anvil_setBalance').length,0);
  calls.length=0;
  await fundLocalWallet({config,pageUrl,address,rpc:async(m,p)=>{calls.push([m,p]);return expected[m];}});
  assert.deepEqual(calls.find(([m])=>m==='anvil_setBalance'),['anvil_setBalance',[address,'0x56bc75e2d63100000']]);
});
