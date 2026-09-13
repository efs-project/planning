// Read-only, offline preparation. Exact allowlist excludes fixtures, runners, and results.
import fs from 'node:fs';
import crypto from 'node:crypto';
const out = '/tmp/efs-c-readiness-build-20260913.NoPDle/out';
const source = '/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c';
const sha256 = x => crypto.createHash('sha256').update(x).digest('hex');
const roles = [
  ['ImportLib', 'src/ImportLib.sol'], ['IndexModule', 'src/IndexModule.sol'],
  ['Ledger', 'src/Ledger.sol'], ['LensReader', 'src/LensReader.sol'],
  ['PassAcceptor', 'test/FixtureActors.sol'], ['QuoteAcceptorV1', 'test/FixtureActors.sol'],
  ['Producer', 'test/FixtureActors.sol'], ['MeasurementConsumer', 'test/MeasurementConsumer.sol'],
];
function declarations(node, result = {}) {
  if (!node || typeof node !== 'object') return result;
  if (node.nodeType === 'VariableDeclaration' && node.mutability === 'immutable')
    result[node.id] = {name: node.name, type: node.typeDescriptions.typeString};
  for (const v of Object.values(node)) if (Array.isArray(v)) v.forEach(x=>declarations(x,result)); else if(v && typeof v==='object') declarations(v,result);
  return result;
}
const artifacts = roles.map(([role, path]) => {
  const artifactPath = `${out}/${path.split('/').at(-1)}/${role}.json`;
  const bytes = fs.readFileSync(artifactPath);
  const artifact = JSON.parse(bytes);
  const names = declarations(artifact.ast);
  const immutables = Object.entries(artifact.deployedBytecode.immutableReferences || {}).map(([id, offsets]) => ({id, declaration: names[id] || {name:id}, offsets}));
  return {role, sourcePath:path, sourceSha256:sha256(fs.readFileSync(`${source}/${path}`)), artifactPath, artifactSha256:sha256(bytes), compiler:artifact.metadata.compiler, constructor:artifact.abi.find(x=>x.type==='constructor') || {inputs:[]}, abi:artifact.abi, abiCanonicalJsonSha256:sha256(JSON.stringify(artifact.abi)), creationBytes:(artifact.bytecode.object.length-2)/2, runtimeBytes:(artifact.deployedBytecode.object.length-2)/2, creationLinkReferences:artifact.bytecode.linkReferences, runtimeLinkReferences:artifact.deployedBytecode.linkReferences, immutables};
});
const consumer = artifacts.find(x=>x.role==='MeasurementConsumer');
const point = consumer.abi.find(x=>x.name==='paidPoint');
const list = consumer.abi.find(x=>x.name==='paidList');
const observed = consumer.abi.find(x=>x.name==='PaidObserved');
const fieldOrder = Object.fromEntries([
  ['Lens',point.inputs[2].components], ['Expect',point.inputs[3].components],
  ['PlacementExpect',list.inputs[4].components], ['Selection',observed.inputs[2].components],
  ['Placement',observed.inputs[3].components],
].map(([name,fields])=>[name,fields.map(({name,type})=>({name,type}))]));
for (const artifact of artifacts) {
  artifact.abiEntries = artifact.abi.map(({type,name})=>({type,...(name?{name}:{})}));
  delete artifact.abi;
}
const result = {
  kind:'C_NATIVE_PREPARATION_DECLARATION_MAP', sourceRevision:'2ca7349e5d683c3ff10651c0fc106c10da946145',
  status:'DRAFT_NOT_AN_INPUT_SEAL', evidenceCeiling:'RPC_OBSERVED', chainCalls:0,
  independence:'Only the neutral expectation manifest, shared paid appendix, allowlisted contract source declarations and fresh compiler artifacts. No script/measure.mjs, fixture implementations, candidate result packets, or run outputs.',
  deploymentOrder:'AWAITING_ROOT_CONFIRMATION; roles order below is NOT an allocation', artifacts, fieldOrder,
  openInputChoices:['eight deployment roles and CREATE nonce order','Type shape bytes32 values (four declared Types requested)','Item payload bytes','File and folder salts or coordinates','Tag concept encoding','action order and publication grouping','author nonces and deadlines','list page budget','exact matched rollback operation and trigger'],
  expectedInitial:{admissionFrontier:0,authorNonces:0,fixtureTypes:'absent',fixtureRecords:'absent',fixtureSubjects:'absent',fixtureBindings:'absent',fixtureIndexEntries:'empty',rulesEpoch:1,indexGeneration:1},
  expectedPostB1:{frontier:'derive from sealed successful action count; do not copy from runner',currentHeads:['QUOTE_A2','QUOTE_B1'],history:['QUOTE_A1','QUOTE_A2','QUOTE_B1'],onePlacementActor:'AUTHOR_A',onePlacementSource:'A1',placementRevision:1,authorAHeadRevision:2,authorBHeadRevision:1,sourceGrade:0},
};
if(fieldOrder.Expect.length!==16 || fieldOrder.PlacementExpect.length!==7 || fieldOrder.Selection.length!==23 || fieldOrder.Placement.length!==20) throw new Error('ABI shape mismatch');
process.stdout.write(JSON.stringify(result,null,2)+'\n');
