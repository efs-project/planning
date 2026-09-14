// One finite, pre-signed local experiment. This module never starts a chain.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, readdirSync, mkdirSync, openSync, writeSync, fsyncSync, closeSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildInitializationChecks, buildStateChecks, buildPublicationChecks } from './required-query-state.mjs';
import { LIMITS, INPUT_SHA256, assertPermit, assertObservation, createReplay, normalizeRpcUrl } from './required-query-audit.mjs';
const require=createRequire(import.meta.url);
const {Transaction,Interface,AbiCoder,keccak256,recoverAddress,getCreateAddress,version}=require(process.env.EFS_ETHERS_PATH??'ethers');
const scriptDir=dirname(fileURLToPath(import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const hex=value=>'0x'+BigInt(value).toString(16);
const lower=value=>value===null?null:value.toLowerCase();
const CURSOR='(address reader,address ledger,bytes32 ledgerCodehash,address index,bytes32 indexCodehash,bytes32 realmOrigin,bytes32 sourceType,uint8 referenceOrdinal,bytes32 target,uint64 basisAdmission,uint64 moduleGeneration,uint64 position)';
const PAGE=`(bytes32[] records,uint32 scanned,uint32 headerReads,uint32 bodyReads,uint64 rawTotal,uint8 status,${CURSOR} next)`;
const consumer=new Interface([`function paidIncomingQuotes(address reader,bytes32 pair,uint64 basis,uint32 budget,${CURSOR} cursor) returns (${PAGE} page)`]);
const abi=AbiCoder.defaultAbiCoder();
const SETTINGS={chainId:'31337',genesisTimestamp:'1800000000',blockGasLimit:'30000000',transactionType:0,gasPrice:'2000000000',deployGas:'15000000',setupAndPublicationGas:'8000000',pageGas:'5000000',deadline:'2000000000'};

export function buildRunPlan(input){
  assert.equal(input.schema,'efs-required-query/independent-inputs/1');assert.equal(input.launchReady,false,'offline input must stay false');assert.deepEqual(input.settings,SETTINGS);assert.deepEqual(input.missingData,[]);
  assert.equal(input.transactions.length,82);assert.equal(input.accounts.length,4);
  const nonces=[0,0,0,0],maxima=[0n,0n,0n,0n],counts={deployment:0,setup:0,publication:0,page:0};
  for(const [index,tx]of input.transactions.entries()){
    assert.equal(tx.block,index+1);assert(Object.hasOwn(counts,tx.kind));counts[tx.kind]++;
    assert.equal(tx.from,input.accounts[tx.account]?.address);assert.equal(tx.nonce,nonces[tx.account]++);
    assert.equal(tx.chainId,'31337');assert.equal(tx.type,0);assert.equal(tx.value,'0');assert.equal(tx.expectedStatus,1);assert.equal(tx.gasPrice,'2000000000');
    assert.equal(tx.gas,tx.kind==='deployment'?'15000000':tx.kind==='page'?'5000000':'8000000');
    const signed=Transaction.from(tx.signedRaw);
    assert.equal(signed.serialized,tx.signedRaw);assert.equal(signed.hash,tx.transactionHash);assert.equal(lower(signed.from),tx.from);assert.equal(lower(signed.to),tx.to);assert.equal(signed.data,tx.data);assert.equal(signed.nonce,tx.nonce);assert.equal(signed.type,0);
    for(const [actual,expected]of [[signed.value,tx.value],[signed.chainId,tx.chainId],[signed.gasLimit,tx.gas],[signed.gasPrice,tx.gasPrice]])assert.equal(actual,BigInt(expected));
    maxima[tx.account]+=BigInt(tx.gas)*BigInt(tx.gasPrice)+BigInt(tx.value);
    const arm=input.arms[tx.arm];assert(arm,'known arm');
    if(tx.kind==='deployment'){
      const deployment=arm.deployment.find(d=>d.role===tx.label);assert(deployment);assert.equal(tx.data,deployment.initcode);assert.equal(keccak256(tx.data),deployment.initcodeHash);
      assert.equal(lower(getCreateAddress({from:tx.from,nonce:tx.nonce})),tx.deploymentAddress);assert.equal(tx.deploymentAddress,deployment.address);assert.equal(tx.deploymentAddress,arm.addresses[tx.label]);
      const runtime=arm.runtimes[tx.label];assert.equal(runtime.runtime,deployment.runtime);assert.equal(keccak256(runtime.runtime),runtime.runtimeCodehash);assert.equal((runtime.runtime.length-2)/2,runtime.runtimeBytes);
    }
    if(tx.kind==='publication'){
      const pub=arm.publications.find(p=>p.name===tx.publication);assert(pub);assert.equal(tx.data,pub.calldata);assert.equal(lower(recoverAddress(pub.digest,pub.signature.serialized)),tx.from);assert.equal(keccak256(pub.actionsAbi),pub.actionsHash);
    }
    if(tx.kind==='page'){
      assert.equal(tx.account,3);assert.equal(tx.to,arm.addresses.consumer);
      const page=arm.pages[tx.basisLabel]?.[tx.pageIndex-1];assert(page);assert.equal(page.index,tx.pageIndex);assert.equal(page.basisLabel,tx.basisLabel);assert.equal(tx.basis,page.call.basis);
      assert.equal(tx.data,page.calldata);assert.equal(page.calldata,consumer.encodeFunctionData('paidIncomingQuotes',[page.call.reader,page.call.pair,page.call.basis,page.call.budget,page.call.cursor]));
      assert.equal(page.encodedPage,abi.encode([PAGE],[page.page]));assert.equal(keccak256(page.encodedPage),page.pageCommitment);assert.equal(page.encodedPageBytes,(page.encodedPage.length-2)/2);assert.equal(page.expectedEvent.data,page.pageCommitment);
      assert.equal(page.expectedEvent.topic0,'0xc62b96c5da53c15ed9d229c4557720f2eaa237c0890bd599ecbb001901f5c73f');
    }
  }
  assert.deepEqual(counts,{deployment:21,setup:11,publication:25,page:25});
  const steps=[];
  const add=(label,kind,method,params,more={})=>steps.push({label,kind,method,params,...more});
  add('preflight/chain','exact','eth_chainId',[],{expected:'0x7a69'});
  add('preflight/blockNumber','exact','eth_blockNumber',[],{expected:'0x0'});
  add('header/0','header','eth_getBlockByNumber',['0x0',false],{block:0});
  input.accounts.forEach((account,index)=>{
    add(`preflight/nonce/${index}`,'exact','eth_getTransactionCount',[account.address,'0x0'],{expected:'0x0'});
    add(`preflight/balance/${index}`,'balance','eth_getBalance',[account.address,'0x0'],{minimum:maxima[index].toString()});
  });
  function probes(tx,phase,checks){for(const p of checks)add(`${tx.arm}/${tx.block}/${phase}/${p.label}`,'checkpoint','eth_call',[{to:p.to,data:p.data},hex(tx.block)],{expected:p.expected});}
  const state=(tx,n,typesAdmitted=true)=>probes(tx,`state${n}`,buildStateChecks(input,tx.arm,n,{typesAdmitted}));
  const init=(tx,typesAdmitted=true)=>probes(tx,'initialization',buildInitializationChecks(input,tx.arm,{typesAdmitted}));
  for(const [index,tx]of input.transactions.entries()){
    const label=`${tx.arm}/${tx.block}/${tx.kind}/${tx.label}`;
    const page=tx.kind==='page'?input.arms[tx.arm].pages[tx.basisLabel][tx.pageIndex-1]:null;
    function pageCall(phase,block){add(`${label}/${phase}`,'pageCall','eth_call',[{from:tx.from,to:tx.to,data:tx.data,value:hex(tx.value),gas:hex(tx.gas),gasPrice:hex(tx.gasPrice)},hex(block)],{expected:page.encodedPage});}
    if(page)pageCall('pre',tx.block-1);
    add(`${label}/send`,'send','eth_sendRawTransaction',[tx.signedRaw],{expected:tx.transactionHash,tx:index});
    add(`${label}/receipt`,'receipt','eth_getTransactionReceipt',[tx.transactionHash],{tx:index,...(page?{page}:{})});
    add(`header/${tx.block}`,'header','eth_getBlockByNumber',[hex(tx.block),false],{block:tx.block,tx:index});
    add(`${label}/transaction`,'transaction','eth_getTransactionByHash',[tx.transactionHash],{tx:index});
    if(tx.kind==='deployment')add(`${label}/runtime`,'runtime','eth_getCode',[tx.deploymentAddress,hex(tx.block)],{expected:input.arms[tx.arm].runtimes[tx.label].runtime});
    if(tx.block===12||tx.block===47){init(tx);state(tx,0);}
    if(tx.block===65){init(tx,false);state(tx,0,false);}
    if(tx.block===68)init(tx);
    if(tx.kind==='publication'){
      probes(tx,`publication/${tx.publication}`,buildPublicationChecks(input,tx.arm,tx.publication));
      state(tx,tx.publication==='types'?0:Number(tx.publication.slice(6)));
    }
    if(page){pageCall('post',tx.block);state(tx,8);}
  }
  assert.equal(new Set(steps.map(s=>s.label)).size,steps.length,'unique finite labels');
  const maximumRequests=steps.length+82*(LIMITS.maxReceiptPolls-1);
  assert(maximumRequests<=LIMITS.maxRequests,'offline request inventory exceeds cap');
  return {steps,expectedTransactions:82,expectedPages:25,minimumRequests:steps.length,maximumRequests,maximumRawBytes:LIMITS.maxRawBytes};
}

export function runtimeSourceHashes(){
  const files=[...['required-query.mjs','required-query-audit.mjs','required-query-state.mjs'].map(f=>join(scriptDir,f)),realpathSync(process.execPath),...Object.keys(require.cache)];
  return Object.fromEntries([...new Set(files)].sort().map(file=>[file,hash(readFileSync(file))]));
}
export function verifyInputSources(input){
  const pins={...input.source.inputFileSha256,...input.source.localScriptSha256,[input.source.schedule]:input.source.scheduleSha256,[input.source.preflight]:input.source.preflightSha256};
  for(const [file,expected]of Object.entries(pins))assert.equal(hash(readFileSync(file)),expected,`input source pin ${file}`);
  for(const [file,expected]of Object.entries(input.source.sourceKeccak256))assert.equal(keccak256(readFileSync(file)),expected,`input source keccak ${file}`);
  assert.equal(process.version,input.source.node,'Node version pin');assert.equal(version,input.source.ethers,'ethers version pin');
  // Relevant tracked script edits must be reviewed and committed before launch.
  execFileSync('git',['diff','--quiet','HEAD','--',...['required-query.mjs','required-query-audit.mjs','required-query-state.mjs'].map(f=>join(scriptDir,f))],{cwd:scriptDir});
  return Object.keys(pins).length;
}

export function createTransport({rpcUrl,authorize,persist,limits={}}){
  rpcUrl=normalizeRpcUrl(rpcUrl);assert.equal(typeof authorize,'function');assert.equal(typeof persist,'function');
  const caps={...LIMITS,...limits};
  for(const [key,value]of Object.entries(caps))assert(Object.hasOwn(LIMITS,key)&&Number.isSafeInteger(value)&&value>0&&value<=LIMITS[key],'transport cap cannot increase');
  let id=0,rawBytes=0,failed=false;
  async function request(step){
    assert(!failed,'transport stopped after failure');
    let entry,persistenceAttempted=false;
    try{
      authorize();assert(id<caps.maxRequests,'request cap');
      const request={jsonrpc:'2.0',id:++id,method:step.method,params:step.params};
      assert(['eth_chainId','eth_blockNumber','eth_getBalance','eth_getTransactionCount','eth_getBlockByNumber','eth_getTransactionByHash','eth_getTransactionReceipt','eth_sendRawTransaction','eth_call','eth_getCode'].includes(step.method),'unsupported method');
      const body=JSON.stringify(request),requestBytes=Buffer.byteLength(body);
      assert(rawBytes+requestBytes<=caps.maxRawBytes,'raw request cap');rawBytes+=requestBytes;
      entry={id,label:step.label,request,responseText:'',responseBytes:0,status:0};
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(new Error('request timeout')),caps.requestTimeoutMs);
      let chunks=[],received=0;
      try{
        const response=await fetch(rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body,signal:controller.signal,redirect:'error'});entry.status=response.status;
        assert(response.body,'response body required');
        for await(const chunk of response.body){
          const data=Buffer.from(chunk),available=Math.min(caps.maxResponseBytes-entry.responseBytes,caps.maxRawBytes-rawBytes);
          received+=data.length;const kept=data.subarray(0,Math.max(0,available));chunks.push(kept);entry.responseBytes+=kept.length;rawBytes+=kept.length;
          if(kept.length!==data.length){controller.abort();throw new Error('response/raw byte cap exceeded');}
        }
      }finally{
        clearTimeout(timer);const raw=Buffer.concat(chunks,entry.responseBytes);entry.responseText=raw.toString('utf8');entry.observedResponseBytes=received;
        // RPC is UTF-8 JSON; a non-ASCII/truncated invalid sequence is a failure,
        // not a byte-count substitution that could bypass the cap.
        if(!Buffer.from(entry.responseText,'utf8').equals(raw)){entry.responseBase64=raw.toString('base64');throw new Error('invalid UTF-8 raw response');}
      }
      persistenceAttempted=true;persist(entry);
      const value=assertObservation(step,entry,id);
      return {entry,value};
    }catch(error){failed=true;if(entry&&!persistenceAttempted){entry.failure=String(error.message);persistenceAttempted=true;persist(entry);}throw error;}
  }
  return {request};
}

export function persistJournalEntry(journal,entry,transcript,{write=writeSync,sync=fsyncSync}={}){
  const line=Buffer.from(JSON.stringify(entry)+'\n','utf8');
  assert.equal(write(journal,line),line.length,'short journal write');
  sync(journal);transcript.push(entry);
}

export async function run({inputPath,permit,permitPath,rpcUrl,out}){
  const inputBytes=readFileSync(inputPath),inputHash=hash(inputBytes);assert.equal(inputHash,INPUT_SHA256,'sealed input SHA256');
  const input=JSON.parse(inputBytes);const plan=buildRunPlan(input);const sourceHashes=runtimeSourceHashes();
  if(permitPath)permit=JSON.parse(readFileSync(permitPath));
  const authorize=()=>assertPermit(permit,inputHash,sourceHashes,rpcUrl,Date.now());authorize();
  verifyInputSources(input);assert.deepEqual(runtimeSourceHashes(),sourceHashes,'dependency inventory stable');
  out=resolve(out);assert(!existsSync(out)||readdirSync(out).length===0,'output directory must be empty');
  mkdirSync(out,{recursive:true});
  const journal=openSync(join(out,'transcript.jsonl'),'wx'),transcript=[];
  const persist=entry=>persistJournalEntry(journal,entry,transcript);
  const replay=createReplay(input,plan),transport=createTransport({rpcUrl,authorize,persist});
  try{
    writeFileSync(join(out,'run-plan.json'),JSON.stringify(plan,null,2),{flag:'wx'});
    writeFileSync(join(out,'source-hashes.json'),JSON.stringify(sourceHashes,null,2),{flag:'wx'});
    while(replay.next()){const {entry}=await transport.request(replay.next());replay.consume(entry);}
    const result=replay.finish();writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
  }catch(error){writeFileSync(join(out,'failure.json'),JSON.stringify({status:'FAILED_NO_RETRY',error:String(error.stack),retainedEntries:transcript.length},null,2),{flag:'wx'});throw error;}
  finally{closeSync(journal);}
}
async function main(){
  const args=process.argv.slice(2),options={};assert.equal(args.length,8,'usage: --input JSON --permit JSON --rpc URL --out EMPTY_DIRECTORY');
  for(let i=0;i<args.length;i+=2){assert(['--input','--permit','--rpc','--out'].includes(args[i]));assert(!Object.hasOwn(options,args[i]));options[args[i]]=args[i+1];}
  const result=await run({inputPath:options['--input'],permitPath:options['--permit'],rpcUrl:options['--rpc'],out:options['--out']});process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)main().catch(error=>{process.stderr.write(String(error.stack)+'\n');process.exitCode=1;});
