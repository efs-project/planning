/**
 * Independent disposable B physical vectors; not a chain-state proof.
 * Semantics: sealed paid-neutral-expectations.json, never candidate results.
 * Representation: public CONTROLLER-INTERFACE.md and FIXTURE-MAP.md formulas.
 * No candidate imports, RPC, artifact reads, mutable caches, or private keys out.
 * Runtime codehashes must be independently obtained and pre-run pinned by caller.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AbiCoder, HDNodeWallet, getCreateAddress, keccak256, toUtf8Bytes, zeroPadValue } = require('ethers');
const abi = AbiCoder.defaultAbiCoder();
const ZERO = `0x${'0'.repeat(64)}`;
const PUBLIC_MNEMONIC = 'test test test test test test test test test test test junk';
const hashText = value => keccak256(toUtf8Bytes(value));
const tupleHash = (types, values) => keccak256(abi.encode(types, values));
const domains = Object.fromEntries(['record', 'position', 'binding', 'subject', 'principal', 'type'].map(name => [name, hashText(`efs2/${name}/1`)]));
const scopeDomain = hashText('efs2/vk/binding-scope/1');
const postingDomain = hashText('efs2/pk/1');

function requireNeutral(neutral) {
  const check = (path, expected) => {
    const actual = path.split('.').reduce((value, key) => value?.[key], neutral);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`NEUTRAL_MISMATCH:${path}`);
  };
  for (const [path, value] of Object.entries({
    'fixtures.subject': 'FILE_QUOTE',
    'fixtures.quoteCommon.type': 'Quote',
    'fixtures.quoteCommon.pair': 'PAIR_ETH_USDC',
    'fixtures.quoteCommon.scale': 6,
    'fixtures.quoteCommon.observedAt': 1800000000,
    'fixtures.quoteCommon.noteBytesHex': '0x7265666572656e63652071756f7465',
    'fixtures.quoteCommon.noteUtf8': 'reference quote',
    'fixtures.pair.label': 'PAIR_ETH_USDC',
    'fixtures.pair.type': 'Pair',
    'fixtures.pair.orderedItems': ['ITEM_ETH', 'ITEM_USDC'],
    'fixtures.items': [{ label: 'ITEM_ETH', type: 'Item' }, { label: 'ITEM_USDC', type: 'Item' }],
    'fixtures.oneAPlacement.count': 1,
    'fixtures.oneAPlacement.coordinate.parent': '/swaps',
    'fixtures.oneAPlacement.coordinate.name': 'eth-usdc',
    'fixtures.oneAPlacement.coordinate.file': 'FILE_QUOTE',
    'fixtures.oneAPlacement.provenance.sourceStep': 'A1',
    'fixtures.oneAPlacement.provenance.actor': 'AUTHOR_A',
    'fixtures.oneAPlacement.provenance.evidenceCategory': 'EOA_SIGNED_PUBLICATION_EFFECT',
    'fixtures.oneAPlacement.unchangedBy': ['A2', 'B1', 'LENS_A_FIRST', 'LENS_B_FIRST'],
    'fixtures.tag.label': 'TAG_MARKET',
    'fixtures.tag.value': 'market',
    'fixtures.tag.subject': 'FILE_QUOTE',
    'paidCommon.selectedFile': 'FILE_QUOTE',
    'paidCommon.candidateCoverage.expectedHeads': ['QUOTE_A2', 'QUOTE_B1'],
    'paidCommon.candidateCoverage.historicalOnly': ['QUOTE_A1'],
    'paidCommon.candidateCoverage.sameForPointAndList': true,
    'paidCommon.listPageCoverage.rowCount': 1,
  })) check(path, value);
  for (const [label, mantissa, author, category] of [
    ['A1', 2500000000, 'AUTHOR_A', 'EOA_SIGNED_PUBLICATION'],
    ['A2', 2502000000, 'AUTHOR_A', 'EOA_SIGNED_PUBLICATION'],
    ['B1', 2501000000, 'AUTHOR_B', 'CONTRACT_ORIGINATED_PUBLICATION'],
  ]) {
    const prefix = `fixtures.quotes.QUOTE_${label}`;
    check(`${prefix}.revision`, label);
    check(`${prefix}.mantissa`, mantissa);
    check(`${prefix}.author`, author);
    check(`${prefix}.authorEvidenceCategory`, category);
  }
  if (!Array.isArray(neutral?.rows)) throw new Error('NEUTRAL_MISMATCH:rows');
  const names = ['A1_SETUP', 'A2_SETUP', 'B1_SETUP', 'POINT_A_FIRST', 'LIST_A_FIRST', 'POINT_B_FIRST', 'LIST_B_FIRST'];
  if (JSON.stringify(neutral.rows.map(row => row.row)) !== JSON.stringify(names)) throw new Error('NEUTRAL_MISMATCH:rows');
  for (const [index, mode, author, revision, category] of [
    [3, 'A', 'AUTHOR_A', 'A2', 'EOA_SIGNED_PUBLICATION'],
    [4, 'A', 'AUTHOR_A', 'A2', 'EOA_SIGNED_PUBLICATION'],
    [5, 'B', 'AUTHOR_B', 'B1', 'CONTRACT_ORIGINATED_PUBLICATION'],
    [6, 'B', 'AUTHOR_B', 'B1', 'CONTRACT_ORIGINATED_PUBLICATION'],
  ]) {
    const prefix = `rows.${index}`;
    check(`${prefix}.lens`, `LENS_${mode}_FIRST`);
    check(`${prefix}.selectedHead`, `QUOTE_${revision}`);
    check(`${prefix}.selectedRevision`, revision);
    check(`${prefix}.selectedAuthor`, author);
    check(`${prefix}.selectedAuthorEvidenceCategory`, category);
    check(`${prefix}.operation`, index % 2 ? 'PAID_POINT' : 'PAID_LIST');
    check(`${prefix}.queryCoordinate`, index % 2 ? { file: 'FILE_QUOTE' } : { parent: '/swaps', name: 'eth-usdc' });
  }
}

function checkedOptions({ neutral, runtimeCodehashes, chainId = 31337, placementBudget = '16' } = {}) {
  requireNeutral(neutral);
  if (chainId !== 31337) throw new Error('PROFILE:only the declared fresh Anvil chain 31337 is supported');
  if (typeof placementBudget !== 'string' || !/^[1-9][0-9]*$/.test(placementBudget) || BigInt(placementBudget) >= 2n ** 256n) throw new Error('BUDGET:positive canonical uint256 decimal string required');
  const hashes = {};
  for (const name of ['quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor', 'ledger']) {
    const hash = runtimeCodehashes?.[name];
    if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash) || hash.toLowerCase() === ZERO) throw new Error(`RUNTIME_CODEHASH:${name}`);
    hashes[name] = hash.toLowerCase();
  }
  return { neutral, hashes, chainId, placementBudget };
}

function deriveRoles() {
  const roles = {};
  for (const [name, derivationIndex] of [['deployer', 0], ['AUTHOR_A', 1], ['paidCaller', 3]]) {
    const address = HDNodeWallet.fromPhrase(PUBLIC_MNEMONIC, undefined, `m/44'/60'/0'/0/${derivationIndex}`).address.toLowerCase();
    roles[name] = { address, derivationIndex };
  }
  roles.actorB = { address: getCreateAddress({ from: roles.deployer.address, nonce: 9 }).toLowerCase(), deploymentNonce: 9 };
  return roles;
}

function deriveOrdinals() {
  // Declared action schedule, not observations or candidate worked ordinals.
  const transactions = [
    ['ITEM_ETH', 'ITEM_USDC', 'PAIR_ETH_USDC'],
    ['CREATE_FILE', 'QUOTE_A1', 'A_HEAD_1', 'A_PLACEMENT', 'A_TAG'],
    ['QUOTE_A2', 'A_HEAD_2'],
    ['QUOTE_B1', 'B_HEAD_1'],
  ];
  let admission = 0;
  const actions = {};
  transactions.forEach((transaction, index) => transaction.forEach(action => { actions[action] = { admission: String(++admission), publication: String(index + 1) }; }));
  return {
    placementAdmission: actions.A_PLACEMENT.admission,
    placementPublication: actions.A_PLACEMENT.publication,
    placementRevision: '1',
    aHeadAdmission: actions.A_HEAD_2.admission,
    aHeadRevision: '2',
    bHeadAdmission: actions.B_HEAD_1.admission,
    bHeadRevision: '1',
    postB1Frontier: String(admission),
    registryEpoch: String(6 + 2), // six registrations, then two activations
    indexGeneration: '0',
  };
}

/** Returns ONLY the strict beforeFixture inputs shape in the public interface. */
export function deriveBInputs(options) {
  const { neutral, hashes, placementBudget } = checkedOptions(options);
  const roles = deriveRoles();
  const types = {};
  const register = (name, shape, refs, ruleId = ZERO) => {
    const refsHash = tupleHash(['bytes32[]'], [refs]);
    types[name] = tupleHash(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [domains.type, hashText(shape), refsHash, ruleId]);
  };
  register('QUOTE', 'lab/type/quote/1', [], hashes.quoteRule);
  register('BINARY', 'lab/type/binary/1', []);
  register('ITEM', 'lab/type/item/1', []);
  register('PAIR', 'lab/type/pair/1', [types.ITEM, types.ITEM], hashes.pairRule);
  register('QUOTE_J', 'lab/type/quote-joined/1', [types.PAIR], hashes.quoteAcceptor);
  register('LABEL', 'lab/type/label/1', [], hashes.labelAcceptor);
  const fixture = {};
  const record = (label, typeId, body) => {
    fixture[label] = { typeId, body, id: tupleHash(['bytes32', 'bytes32', 'bytes32'], [domains.record, typeId, keccak256(body)]) };
  };
  // Item payload integers and Pair's trailing word are candidate representation
  // declarations. The neutral manifest requires Item Types and ordered identity.
  record('ITEM_ETH', types.ITEM, abi.encode(['uint256'], [1]));
  record('ITEM_USDC', types.ITEM, abi.encode(['uint256'], [2]));
  record('PAIR_ETH_USDC', types.PAIR, abi.encode(['bytes32', 'bytes32', 'uint256'], [fixture.ITEM_ETH.id, fixture.ITEM_USDC.id, 1]));
  const common = neutral.fixtures.quoteCommon;
  const noteCommitment = keccak256(common.noteBytesHex);
  for (const label of ['QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1']) {
    record(label, types.QUOTE_J, abi.encode(['bytes32', 'uint256', 'uint8', 'uint64', 'bytes32'], [fixture.PAIR_ETH_USDC.id, neutral.fixtures.quotes[label].mantissa, common.scale, common.observedAt, noteCommitment]));
  }
  const creatorPrincipal = zeroPadValue(roles.AUTHOR_A.address, 32).toLowerCase();
  const salt = hashText('joined/FILE_QUOTE');
  const subject = { FILE_QUOTE: tupleHash(['bytes32', 'bytes32', 'bytes32'], [domains.subject, creatorPrincipal, salt]), salt, creatorPrincipal };
  const lenses = { LENS_A_FIRST: [roles.AUTHOR_A.address, roles.actorB.address], LENS_B_FIRST: [roles.actorB.address, roles.AUTHOR_A.address] };
  const ordinals = deriveOrdinals();
  const expected = (label, selectedAuthor, selectedProofKind) => ({
    subject: subject.FILE_QUOTE,
    expectedHead: fixture[label].id,
    selectedAuthor,
    selectedProofKind,
    pairId: fixture.PAIR_ETH_USDC.id,
    itemA: fixture.ITEM_ETH.id,
    itemB: fixture.ITEM_USDC.id,
    mantissa: String(neutral.fixtures.quotes[label].mantissa),
    scale: String(common.scale),
    observedAt: String(common.observedAt),
    noteCommitment,
    basisAdmission: ordinals.postB1Frontier,
  });
  const coordinate = neutral.fixtures.oneAPlacement.coordinate;
  return {
    types, fixture, subject, roles, lenses,
    expect: { A_FIRST: expected('QUOTE_A2', roles.AUTHOR_A.address, '2'), B_FIRST: expected('QUOTE_B1', roles.actorB.address, '1') },
    placementExpect: { folder: hashText(coordinate.parent), nameRole: hashText(coordinate.name), actor: roles.AUTHOR_A.address, proofKind: '2', publication: ordinals.placementPublication, budget: placementBudget },
    ordinals,
  };
}

/** Supplemental read keys; not extra fields for strict controller inputs. */
export function deriveBReadCoordinates(options) {
  const { hashes, chainId } = checkedOptions(options);
  const inputs = deriveBInputs(options);
  const realmOrigin = tupleHash(['uint256', 'bytes32'], [chainId, hashes.ledger]);
  const principals = {
    AUTHOR_A: inputs.subject.creatorPrincipal,
    // Known prototype profile: commits chainId + Ledger runtime codehash, not
    // a general provenance rule or portable contract authorship proof.
    AUTHOR_B: tupleHash(['bytes32', 'uint256', 'bytes32', 'address'], [domains.principal, 2, realmOrigin, inputs.roles.actorB.address]),
  };
  const purposes = Object.fromEntries(['HEAD', 'FOLDER', 'TAG'].map(name => [name, hashText(`efs2/purpose/${name.toLowerCase()}/1`)]));
  const position = (purpose, subject, role) => tupleHash(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [domains.position, purpose, subject, role]);
  const positions = {
    HEAD_FILE_QUOTE: position(purposes.HEAD, inputs.subject.FILE_QUOTE, ZERO),
    PLACEMENT_SWAPS_ETH_USDC: position(purposes.FOLDER, inputs.placementExpect.folder, inputs.placementExpect.nameRole),
    TAG_MARKET: position(purposes.TAG, inputs.subject.FILE_QUOTE, hashText('market')),
  };
  const bindings = {};
  const scopes = {};
  for (const author of ['A', 'B']) {
    const principal = principals[`AUTHOR_${author}`];
    for (const [name, key] of [['HEAD', positions.HEAD_FILE_QUOTE], ['PLACEMENT', positions.PLACEMENT_SWAPS_ETH_USDC], ['TAG', positions.TAG_MARKET]]) {
      bindings[`${author}_${name}`] = tupleHash(['bytes32', 'bytes32', 'bytes32'], [domains.binding, principal, key]);
    }
    const scopeKey = tupleHash(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [scopeDomain, principal, purposes.FOLDER, inputs.placementExpect.folder]);
    scopes[`${author}_FOLDER_SWAPS`] = { scopeKey, scopeList: tupleHash(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [postingDomain, ZERO, 10, 0, scopeKey]) };
  }
  return {
    realmId: hashText('lab/realm/1'), realmOrigin,
    deployment: { ledger: { address: getCreateAddress({ from: inputs.roles.deployer.address, nonce: 4 }).toLowerCase(), deploymentNonce: 4 } },
    principals, purposes, positions, bindings, scopes,
    lensIds: Object.fromEntries(Object.entries(inputs.lenses).map(([name, lens]) => [name, tupleHash(['address[]'], [lens])])),
    frontier: { admissions: inputs.ordinals.postB1Frontier, records: String(Object.keys(inputs.fixture).length), bindings: '4', publications: '4' },
  };
}
