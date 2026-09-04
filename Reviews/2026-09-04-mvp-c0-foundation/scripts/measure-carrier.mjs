import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getBytes, hexlify, keccak256 } from 'ethers';
import { chunkTree, recoverFile, verifiedRange } from '../reference/chunk-tree.mjs';
import { artifact, FILE_CAP, RANGE_CAP, TX_GAS, syntheticSeed, syntheticType, transact, withLocalCarrier } from './local-carrier.mjs';

export async function measureCarrier(env) {
  const {provider,carrier,host,deploymentBytes,commitment}=env;
  const address=await carrier.getAddress();
  assert.equal(await carrier.entryCount(),0n,'measurement requires a fresh carrier');
  await transact(host.initialize,address,deploymentBytes,syntheticType,false);
  await transact(host.setContext,syntheticSeed,commitment,syntheticType,3);
  const samples=[];
  for(const inputBytes of [0,1,4096,8192,12289]) {
    let original=Buffer.from(Array.from({length:inputBytes},(_,i)=>i%251));
    const contentDigest=keccak256(original), tree=chunkTree(original,syntheticType);
    const before=await carrier.totalStoredBytes();
    const write=await transact(host.put,address,tree.recordId,tree.body,original);
    original.fill(0); original=null;
    const blockTag=write.blockNumber;
    const recovered=await recoverFile(carrier,syntheticType,tree.recordId,{blockTag,maxBytes:Number(FILE_CAP)});
    assert.equal(keccak256(recovered.data),contentDigest);
    const rangeOffset=inputBytes>4096?4094:0;
    const rangeLength=Math.min(Number(RANGE_CAP),inputBytes-rangeOffset);
    const expectedRange=verifiedRange(syntheticType,tree.recordId,recovered.body,recovered.data,rangeOffset,rangeLength);
    const rawRead=async (method,args)=>{
      const data=carrier.interface.encodeFunctionData(method,args);
      return provider.send('eth_call',[{to:address,data,gas:'0x'+TX_GAS.toString(16)},'0x'+blockTag.toString(16)]);
    };
    const fullResult=await rawRead('read',[tree.recordId]);
    const rangeResult=await rawRead('readRange',[tree.recordId,rangeOffset,rangeLength]);
    const fullPayload=carrier.interface.decodeFunctionResult('read',fullResult)[0];
    const rangePayload=carrier.interface.decodeFunctionResult('readRange',rangeResult)[0];
    assert.equal(fullPayload,hexlify(recovered.data)); assert.equal(rangePayload,hexlify(expectedRange));
    // Deliberately sent local transactions supply receipt gas, not estimated gas.
    // This is measurement plumbing: ordinary application reads use eth_call above.
    const fullRead=await transact(carrier.read,tree.recordId);
    const rangeRead=await transact(carrier.readRange,tree.recordId,rangeOffset,rangeLength);
    const storedPayloadBytes=await carrier.totalStoredBytes();
    assert.equal(storedPayloadBytes-before,BigInt(inputBytes));
    samples.push({inputBytes,chunkSize:tree.chunkSize,chunkCount:tree.chunkCount,recordId:tree.recordId,contentKeccak256:contentDigest,
      writeGasUsed:String(write.gasUsed),fullReadGasUsed:String(fullRead.gasUsed),rangeReadGasUsed:String(rangeRead.gasUsed),
      writeTransactionHash:write.hash,fullReadTransactionHash:fullRead.hash,rangeReadTransactionHash:rangeRead.hash,
      writeBlock:write.blockNumber,fullReadBlock:fullRead.blockNumber,rangeReadBlock:rangeRead.blockNumber,
      uniqueEntries:String(await carrier.entryCount()),storedPayloadBytes:String(storedPayloadBytes),
      fullReadPayloadBytes:getBytes(fullPayload).length,fullReadAbiResultBytes:getBytes(fullResult).length,
      rangeOffset,rangeLength,rangeReadPayloadBytes:getBytes(rangePayload).length,rangeReadAbiResultBytes:getBytes(rangeResult).length,
      recoveryVerified:recovered.verified,recoveryBlock:blockTag});
  }
  const metadata=artifact('MvpC0StateByteStore').metadata;
  const compilerMetadata=typeof metadata==='string'?JSON.parse(metadata):metadata;
  const toolchain={node:process.version,ethers:JSON.parse(readFileSync(new URL('../node_modules/ethers/package.json',import.meta.url))).version,
    anvil:execFileSync('anvil',['--version'],{encoding:'utf8'}).trim(),solc:compilerMetadata.compiler.version,
    evmVersion:compilerMetadata.settings.evmVersion,optimizer:compilerMetadata.settings.optimizer,viaIR:compilerMetadata.settings.viaIR};
  assert.equal(toolchain.node,'v26.0.0'); assert.equal(toolchain.ethers,'6.15.0');
  assert.match(toolchain.anvil,/1\.7\.1/); assert.match(toolchain.anvil,/4072e48705af9d93e3c0f6e29e93b5e9a40caed8/);
  assert.match(toolchain.solc,/^0\.8\.30\+commit\.73712a01$/); assert.equal(toolchain.evmVersion,'cancun');
  assert.deepEqual(toolchain.optimizer,{enabled:true,runs:200}); assert.equal(toolchain.viaIR,true);
  return {scope:'COMPONENT_ONLY_NOT_VALID_GENESIS_OR_CAP_SELECTION',generatedAt:new Date().toISOString(),
    toolchain,chainId:31337,hardfork:'cancun',blockGasLimit:String(env.blockGasLimit),transactionGasLimit:String(TX_GAS),
    codeSizeLimitBytes:24576,configuredFileCapBytes:Number(FILE_CAP),configuredRangeCapBytes:Number(RANGE_CAP),
    runtimeCodeHashes:env.runtime,runtimeCodeBytes:env.runtimeBytes,
    deploymentMethod:'Local CREATE transactions; synthetic seed/Type and placeholder CREATE2 salts. Host is a permissionless TEST DOUBLE, not Core.',
    gasMetric:'Observed receipt gasUsed including transaction intrinsic gas; write includes host forwarding. Full/range reads are deliberately sent local transactions, not eth_estimateGas. Product reads remain RPC eth_call.',
    byteMetric:'storedPayloadBytes is the carrier counter for unique payload bytes only, not storage slots, metadata, inventory, or total state growth. ABI result sizes are decoded hex-result byte counts, not JSON-RPC wire sizes.',
    readBasis:'Serialized RPC state observations pinned to the write block; original buffers overwritten and dropped before recovery. No events used for reconstruction. No account/storage/Merkle proof verification.',
    coverage:{writeFullReadRangeRead:'MEASURED',fullFileRecovery:'VERIFIED_COMPONENT_ONLY',ethereumStateProofs:'NOT_RUN',coldReadProofAndClientMemoryBudget:'NOT_RUN',fullCoreOverhead:'NOT_RUN',formalCapSelection:'NOT_RUN',validExperimentSeed:'NOT_DERIVED',completeTypesCodexCapabilitiesAndGenesis:'NOT_RUN',authenticAdmissionSignaturesAndBrowserJourneys:'NOT_RUN',totalStorageFootprint:'NOT_MEASURED',jsonRpcWireBytes:'NOT_MEASURED'},
    totals:{uniqueEntries:String(await carrier.entryCount()),storedPayloadBytes:String(await carrier.totalStoredBytes())},samples};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const cwd=fileURLToPath(new URL('..',import.meta.url));
  execFileSync('forge',['build','--use',process.env.EFS_C0_SOLC||'solc','--offline'],{cwd,stdio:'inherit'});
  const report=await withLocalCarrier(measureCarrier);
  const output=new URL('../artifacts/carrier-measurements.json',import.meta.url);
  mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
  writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('Generated artifacts/carrier-measurements.json from observed local receipts and state reads.');
}
