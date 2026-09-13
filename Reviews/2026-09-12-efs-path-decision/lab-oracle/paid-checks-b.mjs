/** Independent pre-run B raw-read mapping. No RPC, files, candidate imports or decoded Lens replies. */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AbiCoder, Interface, keccak256, toUtf8Bytes, zeroPadValue } = require('ethers');
const abi = AbiCoder.defaultAbiCoder();
const ZERO = `0x${'0'.repeat(64)}`;
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
const hashText = text => keccak256(toUtf8Bytes(text));
const hashTuple = (types, values) => keccak256(abi.encode(types, values));
const word = value => abi.encode(['uint256'], [value]);
const bytes32 = value => typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value);
const address = value => typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value);
const requireThat = (condition, label) => { if (!condition) throw new Error(`B_CHECKS:${label}`); };
const equal = (actual, expected, label) => requireThat(JSON.stringify(actual) === JSON.stringify(expected), label);
const ORDINALS = {
  placementAdmission: '7', placementPublication: '2', placementRevision: '1',
  aHeadAdmission: '10', aHeadRevision: '2', bHeadAdmission: '12', bHeadRevision: '1',
  postB1Frontier: '12', registryEpoch: '8', indexGeneration: '0',
};
const FRONTIER = { admissions: '12', records: '6', bindings: '4', publications: '4' };
const REQUIRED_TARGETS = ['ledger', 'registry', 'index', 'acceptor', 'quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor'];
const signatures = new Interface([
  'function counts() view returns (uint64,uint64,uint64,uint64)',
  'function indexModule() view returns (address)',
  'function epoch() view returns (uint64)',
  'function typeInfo(bytes32) view returns (bool,address,bytes32,address,bytes32,uint8,uint16)',
  'function refTypes(bytes32) view returns (bytes32[])',
  'function generation() view returns (uint64)',
  'function coreCodeCommitment() view returns (bytes32)',
  'function realmId() view returns (bytes32)',
  'function realmOrigin() view returns (bytes32)',
  'function principalOf(address) view returns (bytes32)',
  'function head(bytes32) view returns (uint8,uint32,uint64,uint64,uint64,bytes32)',
  'function postingHead(bytes32) view returns (uint64,uint64,uint64,uint16)',
  'function postingAt(bytes32,uint64) view returns (uint64)',
  'function coverage(bytes32,bytes32) view returns (uint8,uint64,uint64)',
  'function attachedFrom() view returns (uint64)',
  'function lastProcessed() view returns (uint64)',
  'function lastPublication() view returns (uint64)',
  'function gapped() view returns (bool)',
  'function record(bytes32) view returns (bytes32,uint64,uint32,bytes)',
  'function subjectCreatedAt(bytes32) view returns (uint64)',
  'function admission(uint64) view returns (uint8,uint16,uint64,uint64,uint32,bool,bytes32,bytes32)',
  'function bindingPosition(uint64) view returns (bytes32)',
  'function positionCell(bytes32) view returns (bytes32,bytes32,bytes32)',
  'function evidence(uint64) view returns (address,uint8,uint8,uint16,uint64,bytes32,bytes32,uint64,uint64,uint64,bytes32,bytes32,bytes32)',
  'function isImported(uint64) view returns (bool)',
]);

function validate({ inputs, coordinates, targets }) {
  requireThat(inputs && coordinates && targets, 'required inputs, coordinates and targets');
  for (const label of REQUIRED_TARGETS) {
    const target = targets[label];
    requireThat(target && address(target.address), `target address ${label}`);
    requireThat(typeof target.runtime === 'string' && /^0x(?:[0-9a-f]{2})+$/.test(target.runtime), `target runtime ${label}`);
  }
  requireThat(new Set(REQUIRED_TARGETS.map(label => targets[label].address)).size === REQUIRED_TARGETS.length, 'distinct targets');
  equal(targets.ledger.address, coordinates.deployment?.ledger?.address, 'Ledger deployment address');
  for (const [name, expected] of Object.entries(ORDINALS)) equal(inputs.ordinals?.[name], expected, `ordinal ${name}`);
  equal(coordinates.frontier, FRONTIER, 'frontier');
  const core = keccak256(targets.ledger.runtime);
  equal(coordinates.realmOrigin, hashTuple(['uint256', 'bytes32'], [31337, core]), 'runtime origin');
  equal(coordinates.realmId, hashText('lab/realm/1'), 'realmId');
  const a = inputs.roles?.AUTHOR_A?.address;
  const b = inputs.roles?.actorB?.address;
  requireThat(address(a) && address(b) && a !== b, 'distinct author addresses');
  const principals = {
    AUTHOR_A: zeroPadValue(a, 32),
    AUTHOR_B: hashTuple(['bytes32', 'uint256', 'bytes32', 'address'], [hashText('efs2/principal/1'), 2, coordinates.realmOrigin, b]),
  };
  equal(coordinates.principals, principals, 'principals');
  equal(inputs.subject?.creatorPrincipal, principals.AUTHOR_A, 'creator principal');
  equal(inputs.subject?.salt, hashText('joined/FILE_QUOTE'), 'subject salt');
  const file = hashTuple(['bytes32', 'bytes32', 'bytes32'], [hashText('efs2/subject/1'), principals.AUTHOR_A, inputs.subject.salt]);
  equal(inputs.subject.FILE_QUOTE, file, 'subject identity');
  const folder = hashText('/swaps');
  const name = hashText('eth-usdc');
  equal(inputs.placementExpect?.folder, folder, 'placement folder');
  equal(inputs.placementExpect?.nameRole, name, 'placement name');
  equal(inputs.placementExpect?.actor, a, 'placement actor');
  equal(inputs.placementExpect?.proofKind, '2', 'placement proof kind');
  equal(inputs.placementExpect?.publication, '2', 'placement publication');
  const positionRows = [
    ['HEAD_FILE_QUOTE', 'HEAD', file, ZERO],
    ['PLACEMENT_SWAPS_ETH_USDC', 'FOLDER', folder, name],
    ['TAG_MARKET', 'TAG', file, hashText('market')],
  ];
  for (const [label, purposeName, subject, role] of positionRows) {
    const purpose = hashText(`efs2/purpose/${purposeName.toLowerCase()}/1`);
    equal(coordinates.purposes?.[purposeName], purpose, `purpose ${purposeName}`);
    equal(coordinates.positions?.[label], hashTuple(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [hashText('efs2/position/1'), purpose, subject, role]), `position ${label}`);
  }
  for (const author of ['A', 'B']) {
    const principal = principals[`AUTHOR_${author}`];
    for (const [label, position] of [['HEAD', 'HEAD_FILE_QUOTE'], ['PLACEMENT', 'PLACEMENT_SWAPS_ETH_USDC'], ['TAG', 'TAG_MARKET']]) {
      equal(coordinates.bindings?.[`${author}_${label}`], hashTuple(['bytes32', 'bytes32', 'bytes32'], [hashText('efs2/binding/1'), principal, coordinates.positions[position]]), `binding ${author}_${label}`);
    }
    const scopeKey = hashTuple(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [hashText('efs2/vk/binding-scope/1'), principal, coordinates.purposes.FOLDER, folder]);
    equal(coordinates.scopes?.[`${author}_FOLDER_SWAPS`], { scopeKey, scopeList: posting(10, scopeKey) }, `scope ${author}`);
  }
  // Rebuild descriptor identities in dependency order from independently pinned
  // runtime bytes. A caller-provided Type ID does not define the expected row.
  const typeIds = {};
  const typeRows = [];
  for (const [label, shape, rule, additionalPolicy, refNames] of [
    ['QUOTE', 'quote', 'quoteRule', true, []],
    ['BINARY', 'binary', null, false, []],
    ['ITEM', 'item', null, false, []],
    ['PAIR', 'pair', 'pairRule', true, ['ITEM', 'ITEM']],
    ['QUOTE_J', 'quote-joined', 'quoteAcceptor', false, ['PAIR']],
    ['LABEL', 'label', 'labelAcceptor', false, []],
  ]) {
    const refs = refNames.map(name => typeIds[name]);
    const ruleId = rule ? keccak256(targets[rule].runtime) : ZERO;
    const id = hashTuple(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [hashText('efs2/type/1'), hashText(`lab/type/${shape}/1`), hashTuple(['bytes32[]'], [refs]), ruleId]);
    equal(inputs.types?.[label], id, `Type identity ${label}`);
    typeIds[label] = id;
    typeRows.push({ label, id, refs, info: [true, rule ? targets[rule].address : ZERO_ADDRESS, ruleId, additionalPolicy ? targets.acceptor.address : ZERO_ADDRESS, additionalPolicy ? keccak256(targets.acceptor.runtime) : ZERO, refs.length, additionalPolicy ? 2 : 1] });
  }
  for (const [label, typeName, length] of [['ITEM_ETH', 'ITEM', 32], ['ITEM_USDC', 'ITEM', 32], ['PAIR_ETH_USDC', 'PAIR', 96], ['QUOTE_A1', 'QUOTE_J', 160], ['QUOTE_A2', 'QUOTE_J', 160], ['QUOTE_B1', 'QUOTE_J', 160]]) {
    const record = inputs.fixture?.[label];
    requireThat(record && bytes32(record.typeId) && bytes32(record.id), `record identifiers ${label}`);
    equal(record.typeId, inputs.types?.[typeName], `record Type ${label}`);
    requireThat(typeof record.body === 'string' && new RegExp(`^0x[0-9a-f]{${length * 2}}$`).test(record.body), `record bytes ${label}`);
    equal(record.id, hashTuple(['bytes32', 'bytes32', 'bytes32'], [hashText('efs2/record/1'), record.typeId, keccak256(record.body)]), `record identity ${label}`);
  }
  return { core, positionRows, typeRows };
}

function posting(kind, key) {
  return hashTuple(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [hashText('efs2/pk/1'), ZERO, kind, 0, key]);
}

/** Exact pre-run arm checks. Public evidence rows intentionally assert only named ABI words. */
export function deriveBChecks(options = {}) {
  const { core, positionRows, typeRows } = validate(options);
  const { inputs: i, coordinates: c, targets } = options;
  const check = (label, target, method, args, result) => ({
    label, to: targets[target].address, data: signatures.encodeFunctionData(method, args), expected: signatures.encodeFunctionResult(method, result),
  });
  const basis = [
    check('registryEpoch', 'registry', 'epoch', [], [8]),
    check('indexGeneration', 'index', 'generation', [], [0]),
    check('coreCodeCommitment', 'ledger', 'coreCodeCommitment', [], [core]),
    check('realmId', 'ledger', 'realmId', [], [c.realmId]),
    check('ledger.indexModule', 'ledger', 'indexModule', [], [targets.index.address]),
  ];
  for (const { label, id, refs, info } of typeRows) {
    basis.push(check(`typeInfo.${label}`, 'registry', 'typeInfo', [id], info));
    basis.push(check(`refTypes.${label}`, 'registry', 'refTypes', [id], [refs]));
  }
  const beforeFixture = [check('counts', 'ledger', 'counts', [], [0, 0, 0, 0]), ...basis];
  const afterB1 = [check('counts', 'ledger', 'counts', [], [12, 6, 4, 4]), ...basis];
  afterB1.push(
    check('realmOrigin', 'ledger', 'realmOrigin', [], [c.realmOrigin]),
    check('principalA', 'ledger', 'principalOf', [i.roles.AUTHOR_A.address], [c.principals.AUTHOR_A]),
    check('principalB', 'ledger', 'principalOf', [i.roles.actorB.address], [c.principals.AUTHOR_B]),
    check('aPlacement', 'ledger', 'head', [c.bindings.A_PLACEMENT], [1, 1, 7, 0, 2, i.subject.FILE_QUOTE]),
    check('bPlacementAbsent', 'ledger', 'head', [c.bindings.B_PLACEMENT], [0, 0, 0, 0, 0, ZERO]),
    check('aHead', 'ledger', 'head', [c.bindings.A_HEAD], [1, 2, 10, 6, 1, i.fixture.QUOTE_A2.id]),
    check('bHead', 'ledger', 'head', [c.bindings.B_HEAD], [1, 1, 12, 0, 4, i.fixture.QUOTE_B1.id]),
    check('aTag', 'ledger', 'head', [c.bindings.A_TAG], [1, 1, 8, 0, 3, i.subject.FILE_QUOTE]),
    check('subjectCreatedAt', 'ledger', 'subjectCreatedAt', [i.subject.FILE_QUOTE], [4]),
  );
  for (const author of ['A', 'B']) {
    const scope = c.scopes[`${author}_FOLDER_SWAPS`];
    afterB1.push(check(`scope${author}`, 'index', 'postingHead', [scope.scopeList], author === 'A' ? [1, 1, 2, 1] : [0, 0, 0, 0]));
    afterB1.push(check(`scope${author}.coverage`, 'index', 'coverage', [hashText('efs2/family/scope/1'), scope.scopeKey], [2, 1, 12]));
  }
  afterB1.push(check('scopeA.entry0', 'index', 'postingAt', [c.scopes.A_FOLDER_SWAPS.scopeList, 0], [2]));
  // Coordinator's explicitly pre-run B-only marker convention: bind the tagged
  // stable File to itself at (TAG, FILE_QUOTE, hash('market')). Not a protocol rule.
  const tagScope = hashTuple(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [hashText('efs2/vk/binding-scope/1'), c.principals.AUTHOR_A, c.purposes.TAG, i.subject.FILE_QUOTE]);
  const tagScopeList = posting(10, tagScope);
  afterB1.push(
    check('aTag.scope', 'index', 'postingHead', [tagScopeList], [1, 1, 3, 1]),
    check('aTag.scope.entry0', 'index', 'postingAt', [tagScopeList, 0], [3]),
    check('aTag.scope.coverage', 'index', 'coverage', [hashText('efs2/family/scope/1'), tagScope], [2, 1, 12]),
  );
  for (const [method, value] of [['attachedFrom', 1], ['lastProcessed', 12], ['lastPublication', 4], ['gapped', false]]) {
    afterB1.push(check(`index.${method}`, 'index', method, [], [value]));
  }
  for (const [label, key, ordinals] of [['aHead', c.bindings.A_HEAD, [6, 10]], ['bHead', c.bindings.B_HEAD, [12]], ['aPlacement', c.bindings.A_PLACEMENT, [7]], ['aTag', c.bindings.A_TAG, [8]]]) {
    const list = posting(8, key);
    afterB1.push(check(`${label}.history`, 'index', 'postingHead', [list], [ordinals.length, ordinals.length, ordinals.at(-1), 1]));
    ordinals.forEach((ordinal, index) => afterB1.push(check(`${label}.history.entry${index}`, 'index', 'postingAt', [list, index], [ordinal])));
  }
  for (const [ordinal, position] of [[1, c.positions.HEAD_FILE_QUOTE], [2, c.positions.PLACEMENT_SWAPS_ETH_USDC], [3, c.positions.TAG_MARKET], [4, c.positions.HEAD_FILE_QUOTE]]) {
    afterB1.push(check(`bindingPosition.${ordinal}`, 'ledger', 'bindingPosition', [ordinal], [position]));
  }
  for (const [label, purpose, subject, role] of positionRows) afterB1.push(check(`position.${label}`, 'ledger', 'positionCell', [c.positions[label]], [c.purposes[purpose], subject, role]));
  for (const [label, ordinal, leaf, publication] of [['ITEM_ETH', 1, 0, 1], ['ITEM_USDC', 2, 1, 1], ['PAIR_ETH_USDC', 3, 2, 1], ['QUOTE_A1', 5, 1, 2], ['QUOTE_A2', 9, 0, 3], ['QUOTE_B1', 11, 0, 4]]) {
    const record = i.fixture[label];
    afterB1.push(check(`record.${label}`, 'ledger', 'record', [record.id], [record.typeId, ordinal, 1, record.body]));
    afterB1.push(check(`admission.${ordinal}`, 'ledger', 'admission', [ordinal], [1, leaf, publication, 0, 0, false, keccak256(record.body), record.typeId]));
  }
  afterB1.push(check('admission.4', 'ledger', 'admission', [4], [5, 0, 2, 0, 0, false, i.subject.salt, ZERO]));
  for (const [ordinal, leaf, publication, binding, revision, target] of [
    [6, 2, 2, 1, 0, i.fixture.QUOTE_A1.id], [7, 3, 2, 2, 0, i.subject.FILE_QUOTE],
    [8, 4, 2, 3, 0, i.subject.FILE_QUOTE],
    [10, 1, 3, 1, 1, i.fixture.QUOTE_A2.id], [12, 1, 4, 4, 0, i.fixture.QUOTE_B1.id],
  ]) afterB1.push(check(`admission.${ordinal}`, 'ledger', 'admission', [ordinal], [3, leaf, publication, binding, revision, false, target, ZERO]));

  // evidence() is a static 13-word public tuple. No arbitrary masks or guessed
  // signatures: unknown fields remain retained-but-unasserted by the controller.
  for (const [publication, actor, proofKind, leafCount, first, nonce] of [
    [2, i.roles.AUTHOR_A.address, 2, 5, 4, 0],
    [3, i.roles.AUTHOR_A.address, 2, 2, 9, 1],
    [4, i.roles.actorB.address, 1, 2, 11, 0],
  ]) {
    const equals = { 0: zeroPadValue(actor, 32), 1: word(proofKind), 3: word(leafCount), 4: word(first), 7: word(nonce) };
    if (proofKind === 1) Object.assign(equals, { 2: ZERO, 5: ZERO, 6: ZERO });
    afterB1.push({ label: `publication.${publication}`, to: targets.ledger.address, data: signatures.encodeFunctionData('evidence', [publication]), expectedWords: { byteLength: 416, equals } });
    afterB1.push(check(`publication.${publication}.notImported`, 'ledger', 'isImported', [publication], [false]));
  }
  return {
    checks: { beforeFixture, afterB1 }, initial: { registryEpoch: '8' },
    checkpoint: { frontier: { ...FRONTIER }, indexGeneration: '0', registryEpoch: '8', coreCodeCommitment: core, realmId: c.realmId },
    evidenceCeiling: 'RPC_OBSERVED',
    unverified: [
      'Signed publication v/r/s and independent signature recovery are not verified by these word assertions.',
      'Publication execution basis, deadlines, acceptanceProfile, indexObligations and actionsHash are retained but not asserted.',
      'Bootstrap publication 1 author evidence is not asserted; its three records/admissions are checked.',
      'No authenticated state proof, portable contract-origin proof, paid row selection check, rollback control or finalist eligibility is established.',
    ],
  };
}
