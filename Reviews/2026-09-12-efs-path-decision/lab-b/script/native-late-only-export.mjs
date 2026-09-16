/** A fresh exporter process; input deliberately has no old header/proof/root or
 * checkpoint packet. Requires only current RPC, selected source, ABI and P. */
import {readFile} from 'node:fs/promises';
import {loadEthers,createReadTransport} from './compact-environment.mjs';
import {exportNative} from './native-proof-export.mjs';
const input=JSON.parse(await readFile(process.argv[2],'utf8'));
if(Object.keys(input).sort().join(',')!=='ledgerAbi,publication,rpcUrl,source')throw Error('LATE_INPUT_SCHEMA');
const result=await exportNative({ethers:await loadEthers(),rpc:createReadTransport({url:input.rpcUrl}),...input});
console.log(JSON.stringify(result));
