// Run before remapping/product changes. Never overwrites historical evidence.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {SOURCE_GRAPHS} from '../sdk/source-graphs.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const sourceCommit='4cb004273982411d4699fa15d388750638cd1358';
const path=root+'contracts/test/fixtures/native-kernel-4cb0042.json';
const graphPath=root+'contracts/test/fixtures/source-graph-4cb0042.json';
assert(!existsSync(path)&&!existsSync(graphPath),'exclusive new control outputs');
const a=JSON.parse(readFileSync(root+'contracts/out/NativeKernel.sol/NativeKernel.json'));
const metadata=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
assert.deepEqual(metadata.settings.remappings,[],'freeze before remapping change');
for(const [name,pin]of Object.entries(metadata.sources)){
  const git=spawnSync('git',['show',sourceCommit+':Reviews/2026-09-11-efs21-pragmatic/contracts/'+name],{cwd:root});
  assert.equal(git.status,0);assert.equal(E.keccak256(git.stdout),pin.keccak256,name);
}
assert.deepEqual(metadata.sources,SOURCE_GRAPHS.current.sources);
assert.equal(a.deployedBytecode.object,SOURCE_GRAPHS.current.templates.NativeKernel.runtime);
const artifact={...a,metadata,sourceCommit,creationBytecodeHash:E.keccak256(a.bytecode.object)};
const graph={...SOURCE_GRAPHS.current,selection:'baseline-4cb0042',sourceCommit};
graph.id=E.keccak256(E.toUtf8Bytes(JSON.stringify({...graph,id:undefined})));
writeFileSync(path,JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});
writeFileSync(graphPath,JSON.stringify(graph,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({sourceCommit,creationBytecodeHash:artifact.creationBytecodeHash,graphId:graph.id,artifactHash:E.keccak256(readFileSync(path)),graphHash:E.keccak256(readFileSync(graphPath))}));
