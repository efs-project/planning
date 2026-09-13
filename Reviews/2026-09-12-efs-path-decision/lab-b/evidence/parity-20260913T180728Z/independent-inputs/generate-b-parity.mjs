/** Offline, independent pre-chain B parity vectors. No RPC, compiler, candidate runner or result reads. */
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveBInputs, deriveBReadCoordinates } from '/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-vectors-b.mjs';
import { deriveBRuntimeTargets } from '/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-runtime-b.mjs';
import { deriveBChecks } from '/Users/james/Code/EFS/planning-warroom-oracle/Reviews/2026-09-12-efs-path-decision/lab-oracle/paid-checks-b.mjs';
const require = createRequire(import.meta.url);
const { AbiCoder, Interface, keccak256, toUtf8Bytes } = require('ethers');
const abi = AbiCoder.defaultAbiCoder();
const ZERO = `0x${'0'.repeat(64)}`;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const check = (condition, reason) => { if (!condition) throw new Error(reason); };
const equal = (actual, expected, reason) => check(JSON.stringify(actual) === JSON.stringify(expected), reason);
const words = declaration => declaration.split(',').map(field => field.trim().split(' '));
const fields = {
  Expect: words('bytes32 subject,bytes32 expectedHead,address selectedAuthor,uint8 selectedProofKind,bytes32 pairId,bytes32 itemA,bytes32 itemB,uint256 mantissa,uint8 scale,uint64 observedAt,bytes32 noteCommitment,uint64 basisAdmission,uint32 expectedRevision'),
  PlacementExpect: words('bytes32 folder,bytes32 nameRole,address actor,uint8 proofKind,uint64 publication,uint256 budget'),
  Selection: words('uint64 basisAdmission,uint64 indexGeneration,uint64 rulesEpoch,bytes32 coreCodeCommitment,bytes32 lensId,bytes32 subject,bytes32 selectedHead,uint32 selectedRevision,uint64 selectedAdmission,uint64 selectedPublication,address selectedAuthor,uint8 selectedProofKind,bytes32 pairId,bytes32 itemA,bytes32 itemB,uint256 mantissa,uint8 scale,uint64 observedAt,bytes32 note'),
  Placement: words('bytes32 position,address actor,uint8 proofKind,uint32 revision,uint64 admission,uint64 publication,uint64 basisAdmission,uint8 pageStatus,uint64 rawTotal,uint64 scanned,uint64 hydrations,uint64 selectedSoFar,bool mutated,bool ended'),
};
const tuple = name => `tuple(${fields[name].map(field => field.join(' ')).join(',')})`;
const iface = new Interface([
  `function paidPoint(address[] lensPrincipals,${tuple('Expect')} e) returns (bytes32 commitment,${tuple('Selection')} selection)`,
  `function paidList(address[] lensPrincipals,${tuple('Expect')} e,${tuple('PlacementExpect')} p) returns (bytes32 commitment,${tuple('Selection')} selection,${tuple('Placement')} placement)`,
  `event PaidResult(bytes32 indexed kind,bytes32 commitment,${tuple('Selection')} selection,${tuple('Placement')} placement)`,
]);

export function verifyPaidAbi(artifactAbi) {
  const actual = new Interface(artifactAbi);
  for (const name of ['paidPoint', 'paidList', 'PaidResult']) {
    const expected = name === 'PaidResult' ? iface.getEvent(name) : iface.getFunction(name);
    const observed = name === 'PaidResult' ? actual.getEvent(name) : actual.getFunction(name);
    // Full declarations retain tuple names/order/types and indexed/anonymous semantics;
    // JSON fragments differ only in ethers' false-vs-omitted non-indexed event marker.
    equal(observed?.format('full'), expected.format('full'), `ABI mismatch ${name}`);
  }
}

export function derivePaidVectors({ inputs, coordinates, runtime, neutral }) {
  // Use the neutral revision label and primary Ledger per-author binding increment, not admission ordinal.
  const revised = structuredClone(inputs);
  for (const mode of ['A', 'B']) {
    const label = neutral.rows.find(row => row.row === `POINT_${mode}_FIRST`)?.selectedRevision;
    const revision = ({ A2: '2', B1: '1' })[label];
    check(revision && label === (mode === 'A' ? 'A2' : 'B1'), `Unknown neutral revision ${label}`);
    equal(revision, inputs.ordinals[mode === 'A' ? 'aHeadRevision' : 'bHeadRevision'], 'Ordinal derivation disagrees');
    revised.expect[`${mode}_FIRST`].expectedRevision = revision;
  }
  const result = [];
  for (const row of neutral.rows.filter(row => row.operation.startsWith('PAID_'))) {
    const mode = row.lens === 'LENS_A_FIRST' ? 'A' : row.lens === 'LENS_B_FIRST' ? 'B' : null;
    check(mode, 'Unknown lens');
    const e = revised.expect[`${mode}_FIRST`];
    const isList = row.operation === 'PAID_LIST';
    const kind = keccak256(toUtf8Bytes(isList ? 'paid/list' : 'paid/point'));
    const selection = {
      basisAdmission: inputs.ordinals.postB1Frontier,
      indexGeneration: inputs.ordinals.indexGeneration,
      rulesEpoch: inputs.ordinals.registryEpoch,
      coreCodeCommitment: runtime.targets.ledger.runtimeCodehash,
      lensId: coordinates.lensIds[row.lens], subject: e.subject, selectedHead: e.expectedHead,
      selectedRevision: e.expectedRevision,
      selectedAdmission: inputs.ordinals[mode === 'A' ? 'aHeadAdmission' : 'bHeadAdmission'],
      selectedPublication: mode === 'A' ? '3' : '4',
      selectedAuthor: e.selectedAuthor, selectedProofKind: e.selectedProofKind,
      pairId: e.pairId, itemA: e.itemA, itemB: e.itemB,
      mantissa: e.mantissa, scale: e.scale, observedAt: e.observedAt, note: e.noteCommitment,
    };
    const placement = isList ? {
      position: coordinates.positions.PLACEMENT_SWAPS_ETH_USDC,
      actor: inputs.roles.AUTHOR_A.address, proofKind: '2',
      revision: inputs.ordinals.placementRevision, admission: inputs.ordinals.placementAdmission,
      publication: inputs.ordinals.placementPublication, basisAdmission: inputs.ordinals.postB1Frontier,
      pageStatus: '2', rawTotal: '1', scanned: '1',
      // One A candidate load; B-first additionally probes the earlier B principal for masking.
      hydrations: mode === 'A' ? '1' : '2', selectedSoFar: '1', mutated: false, ended: true,
    } : Object.fromEntries(fields.Placement.map(([type, name]) => [name, type === 'bool' ? false : type === 'bytes32' ? ZERO : type === 'address' ? ZERO_ADDRESS : '0']));
    const commitmentPreimage = abi.encode(['bytes32', tuple('Selection'), tuple('Placement')], [kind, selection, placement]);
    const commitment = keccak256(commitmentPreimage);
    const method = isList ? 'paidList' : 'paidPoint';
    const args = [inputs.lenses[row.lens], e, ...(isList ? [inputs.placementExpect] : [])];
    const returnValues = [commitment, selection, ...(isList ? [placement] : [])];
    const calldata = iface.encodeFunctionData(method, args);
    const expectedReturn = iface.encodeFunctionResult(method, returnValues);
    const event = iface.encodeEventLog(iface.getEvent('PaidResult'), [kind, commitment, selection, placement]);
    check((expectedReturn.length - 2) / 2 === (isList ? 34 : 20) * 32, 'Return length');
    check((event.data.length - 2) / 2 === 34 * 32 && event.topics.length === 2, 'Event shape');
    equal(event.data, abi.encode(['bytes32', tuple('Selection'), tuple('Placement')], [commitment, selection, placement]), 'Static event word encoding');
    result.push({ row: row.row, operation: row.operation, lens: row.lens, from: inputs.roles.paidCaller.address,
      to: runtime.targets.joinedConsumer.address, data: calldata, expectedReturn,
      expectedEvent: { address: runtime.targets.joinedConsumer.address, ...event },
      commitment, commitmentPreimage, selection, placement,
      calldataKeccak256: keccak256(calldata), returnKeccak256: keccak256(expectedReturn), eventDataKeccak256: keccak256(event.data) });
  }
  equal(result.map(row => row.row), ['POINT_A_FIRST', 'LIST_A_FIRST', 'POINT_B_FIRST', 'LIST_B_FIRST'], 'Exact four paid rows');
  return { inputs: revised, rows: result };
}

export function generate(config) {
  const ethersPackage = '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/package.json';
  const ethersPackageSha256 = sha256(readFileSync(ethersPackage));
  equal(ethersPackageSha256, '957d5092241ed59860532077633008c49852b98b384493bb0f04225a414eb601', 'Pinned ethers package differs');
  equal(require('ethers').version, '6.15.0', 'Pinned ethers version differs');
  equal(process.version, 'v26.0.0', 'Pinned Node version differs');
  const git = (...args) => execFileSync('git', ['-C', config.sourceRoot, ...args], { encoding: 'utf8' }).trim();
  equal(git('rev-parse', 'HEAD'), config.sourceCommit, 'Source HEAD differs from supplied pin');
  equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Tracked source diff not empty');
  const neutralBytes = readFileSync(config.neutralPath);
  const neutral = JSON.parse(neutralBytes);
  const artifacts = {}, sourceAsts = {}, artifactPins = {};
  for (const [source, contracts] of Object.entries({
    'src/TypeRegistry.sol': ['TypeRegistry'], 'src/LabHarness.sol': ['MockAcceptor', 'FailingIndexModule', 'Actor', 'Consumer', 'Reconstructor'],
    'src/LabAcceptors.sol': ['QuoteAcceptor', 'LabelAcceptor', 'MinBodyAcceptor'], 'src/Ledger.sol': ['Ledger'],
    'src/IndexModule.sol': ['IndexModule'], 'src/LensReader.sol': ['LensReader'],
    'src/JoinedConsumer.sol': ['StatelessConsumer', 'JoinedConsumer'], 'test/Falsify.t.sol': ['StrictQuoteAcceptor'],
  })) {
    for (const contract of contracts) {
      const key = `${source}:${contract}`;
      const path = config.artifactPaths?.[key] ?? join(config.artifactRoot, source.split('/').at(-1), `${contract}.json`);
      const bytes = readFileSync(path);
      const artifact = JSON.parse(bytes);
      if (typeof artifact.metadata === 'string') artifact.metadata = JSON.parse(artifact.metadata);
      artifacts[key] = artifact;
      artifactPins[key] = { path, sha256: sha256(bytes), compiler: artifact.metadata?.compiler, settings: artifact.metadata?.settings };
      const ast = artifact.ast ?? (config.sourceAstPaths?.[source] ? JSON.parse(readFileSync(config.sourceAstPaths[source])) : null);
      check(ast, `Missing AST ${source}; no inference from runtime substitutions allowed`);
      if (sourceAsts[source]) equal(sourceAsts[source], ast, `AST disagreement ${source}`);
      sourceAsts[source] = ast;
    }
  }
  verifyPaidAbi(artifacts['src/JoinedConsumer.sol:JoinedConsumer'].abi);
  const runtime = deriveBRuntimeTargets({ artifacts, sourceAsts, neutral });
  const options = { neutral, runtimeCodehashes: runtime.runtimeCodehashes };
  const baselineInputs = deriveBInputs(options);
  const coordinates = deriveBReadCoordinates(options);
  const checks = deriveBChecks({ inputs: baselineInputs, coordinates, targets: Object.fromEntries(Object.entries(runtime.targets).map(([name, target]) => [name, { address: target.address, runtime: target.expectedRuntime }])) });
  const paid = derivePaidVectors({ inputs: baselineInputs, coordinates, runtime, neutral });
  const sourcePins = {};
  for (const source of [...Object.keys(sourceAsts), 'src/Keys.sol']) {
    const path = join(config.sourceRoot, source);
    const bytes = readFileSync(path);
    sourcePins[source] = { path, sha256: sha256(bytes), keccak256: keccak256(bytes) };
    for (const [key, artifact] of Object.entries(artifacts)) {
      const metadataHash = artifact.metadata?.sources?.[source]?.keccak256;
      if (metadataHash) equal(metadataHash, sourcePins[source].keccak256, `Metadata/source mismatch ${key} ${source}`);
    }
  }
  const helpers = {};
  const base = '/Users/james/Code/EFS/planning-warroom-oracle';
  for (const name of ['paid-vectors-b.mjs', 'paid-runtime-b.mjs', 'paid-checks-b.mjs']) {
    const rel = `Reviews/2026-09-12-efs-path-decision/lab-oracle/${name}`;
    const bytes = readFileSync(join(base, rel));
    const baseline = execFileSync('git', ['-C', base, 'show', `600b1e8:${rel}`]);
    check(bytes.equals(baseline), `Independent baseline changed ${name}`);
    helpers[name] = { path: join(base, rel), sha256: sha256(bytes), baseline: '600b1e8ab97e9cffac086e3f3199c45869c86071' };
  }
  const output = { scope: 'INDEPENDENT_OFFLINE_PRECHAIN_INPUTS_NOT_CHAIN_EVIDENCE', generatedAt: new Date().toISOString(),
    sourceCommit: config.sourceCommit, sourcePins, artifactPins, helpers,
    neutralPin: { path: config.neutralPath, sha256: sha256(neutralBytes) },
    generatorSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    dependency: { ethersVersion: require('ethers').version, entry: require.resolve('ethers'), packagePath: ethersPackage, packageSha256: ethersPackageSha256,
      nodeVersion: process.version, nodeExecutable: process.execPath, nodeExecutableSha256: sha256(readFileSync(process.execPath)) },
    abi: Object.fromEntries(['paidPoint', 'paidList', 'PaidResult'].map(name => [name, (name === 'PaidResult' ? iface.getEvent(name) : iface.getFunction(name)).format('json')])),
    runtime, baselineInputs, inputs: paid.inputs, coordinates, rawChecks: checks, paidRows: paid.rows,
    assumptions: ['Unchanged independent CREATE schedule: public deployer index0, AUTHOR_A index1, paidCaller index3; actorB nonce9; joinedConsumer nonce25.',
      'Setup action order from independently authored baseline schedule, not candidate fixture code or result packet.',
      'B label A2 is physical per-author binding revision2; B1 is physical per-author binding revision1, never cross-arm ordinal equivalence.',
      'All four rows run at postB1 admissions12 / registry epoch8 / index generation0; chain basis/snapshot must be sealed independently before semantic calls.',
      'No transaction or chain result has been read; code derived from source-pinned compiler artifacts, no local compilation.',
      ...checks.unverified], };
  const path = join(fileURLToPath(new URL('.', import.meta.url)), 'b-parity-inputs.json');
  writeFileSync(path, `${JSON.stringify(output, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ path, sha256: sha256(readFileSync(path)), rows: paid.rows.length, targets: Object.keys(runtime.targets).length }));
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  check(process.argv.length === 3, 'Usage: NODE_PATH=<pinned ethers node_modules> node generate-b-parity.mjs <config.json>');
  generate(JSON.parse(readFileSync(process.argv[2])));
}
