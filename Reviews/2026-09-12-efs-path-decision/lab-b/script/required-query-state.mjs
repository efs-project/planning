import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  AbiCoder,
  Interface,
  concat,
  getAddress,
  keccak256,
  toBeHex,
  toUtf8Bytes,
  zeroPadValue,
} = require(process.env.EFS_ETHERS_PATH ?? 'ethers');

const abi = AbiCoder.defaultAbiCoder();
const ZERO = `0x${'00'.repeat(32)}`;
const ZERO_ADDRESS = `0x${'00'.repeat(20)}`;
const B_ARMS = new Set(['bScan', 'bSelective']);
const TYPE_NAMES = ['ITEM', 'PAIR', 'QUOTE', 'OTHER'];
const DATA_RECORD_NAMES = [
  'I_ETH', 'I_USDC', 'P', 'Q', 'U1', 'A1', 'U2', 'A2', 'U3', 'B1',
  'U4', 'U5', 'U6', 'U7', 'U8', 'R1', 'A3', 'U9',
];
const B_PUBLICATIONS = ['common1', 'common2', 'common3', 'common4', 'common5', 'common6', 'common7', 'common8'];
const C_PUBLICATIONS = ['types', ...B_PUBLICATIONS];

const B_LEDGER = new Interface([
  'function counts() view returns (uint64,uint64,uint64,uint64)',
  'function nonces(address) view returns (uint64)',
  'function record(bytes32) view returns (bytes32,uint64,uint32,bytes)',
  'function admission(uint64) view returns (uint8,uint16,uint64,uint64,uint32,bool,bytes32,bytes32)',
  'function acceptanceBasis(uint64) view returns (bytes32,uint16,address,bytes32,address,bytes32,uint64,uint64)',
  'function evidence(uint64) view returns (address,uint8,uint8,uint16,uint64,bytes32,bytes32,uint64,uint64,uint64,bytes32,bytes32,bytes32)',
  'function publicationOf(bytes32) view returns (uint64)',
  'function head(bytes32) view returns (uint8,uint32,uint64,uint64,uint64,bytes32)',
  'function subjectCreatedAt(bytes32) view returns (uint64)',
  'function bindingPosition(uint64) view returns (bytes32)',
  'function positionCell(bytes32) view returns (bytes32,bytes32,bytes32)',
  'function indexModule() view returns (address)',
  'function registry() view returns (address)',
]);
const B_INDEX = new Interface([
  'function ledger() view returns (address)',
  'function attachedFrom() view returns (uint64)',
  'function generation() view returns (uint64)',
  'function gapped() view returns (bool)',
  'function lastProcessed() view returns (uint64)',
  'function lastPublication() view returns (uint64)',
  'function coverage(bytes32,bytes32) view returns (uint8,uint64,uint64)',
  'function postingHead(bytes32) view returns (uint64,uint64,uint64,uint16)',
  'function postingWord(bytes32,uint64) view returns (uint256)',
]);
const B_REGISTRY = new Interface([
  'function descriptor(bytes32) view returns (bytes32,bytes32,address,uint8,uint16,uint64)',
  'function refTypes(bytes32) view returns (bytes32[])',
  'function typeInfo(bytes32) view returns (bool,address,bytes32,address,bytes32,uint8,uint16)',
  'function epoch() view returns (uint64)',
  'function bindingRefType(bytes32,bytes32) view returns (bytes32)',
]);
const C_STORE = new Interface([
  'function getRecord(bytes32,bytes32[],bytes32) view returns (bytes,bytes32,bytes)',
  'function getFieldLayout(bytes32) view returns (bytes32)',
]);
const C_LEDGER = new Interface([
  'function highWater() view returns (uint64)',
  'function index() view returns (address)',
  'function indexCodehash() view returns (bytes32)',
  'function rulesEpoch() view returns (uint32)',
  'function realmId() view returns (bytes32)',
]);
const C_INDEX = new Interface([
  'function ledger() view returns (address)',
  'function ledgerCodehash() view returns (bytes32)',
  'function poisonConcept() view returns (bytes32)',
  'function generation() view returns (uint32)',
  'function coverage(bytes32,bytes32) view returns (uint8,uint64)',
]);

const H = (value) => keccak256(toUtf8Bytes(value));
const B_DOM_POSITION = H('efs2/position/1');
const B_DOM_BINDING = H('efs2/binding/1');
const B_DOM_SCOPE = H('efs2/vk/binding-scope/1');
const B_DOM_POSTING = H('efs2/pk/1');
const C_TYPE_META = H('efs2/lab-c/type-meta/2');
const C_COUNTER_ADMISSIONS = H('efs2/lab-c/counter/admissions');

const B_FAMILIES = {
  scope: H('efs2/family/scope/1'),
  history: H('efs2/family/history/1'),
  backlink: H('efs2/family/backlink/1'),
  'by-type': H('efs2/family/by-type/1'),
  'by-author': H('efs2/family/by-author/1'),
  'reference-position': H('efs2/family/reference-position/1'),
};
const C_FAMILIES = Object.fromEntries(
  ['scopes', 'binding-history', 'backlinks', 'by-type', 'by-author', 'occurrences', 'optional-digest']
    .map((name) => [name, H(`efs2/lab-c/index/${name}`)]),
);

const C_TABLES = {
  Records: table('Ledger', 'efs', 'Records', [32, 8], 1),
  Admissions: table('Ledger', 'efs', 'Admissions', [32, 1, 32, 1, 32, 32, 32, 32, 32, 4, 32], 0),
  Evidence: table('Ledger', 'efs', 'Evidence', [32, 1, 32, 32, 1, 8, 8, 32, 32, 32, 8, 2, 8, 32, 32, 32, 1], 0),
  Bindings: table('Ledger', 'efs', 'Bindings', [32, 4, 8], 0),
  Subjects: table('Ledger', 'efs', 'Subjects', [32, 32, 8], 0),
  Types: table('Ledger', 'efs', 'Types', [20, 32, 8], 1),
  Nonces: table('Ledger', 'efs', 'Nonces', [8], 0),
  Counters: table('Ledger', 'efs', 'Counters', [8], 0),
  Scopes: table('Index', 'efsidx', 'Scopes', [], 1),
  BindingHistory: table('Index', 'efsidx', 'BindingHistory', [], 1),
  Backlinks: table('Index', 'efsidx', 'Backlinks', [], 1),
  ByType: table('Index', 'efsidx', 'ByType', [], 1),
  ByAuthor: table('Index', 'efsidx', 'ByAuthor', [], 1),
  Occurrences: table('Index', 'efsidx', 'Occurrences', [4], 0),
  Coverage: table('Index', 'efsidx', 'Coverage', [1, 1, 8, 8], 0),
};

function table(target, namespace, name, widths, dynamicFields) {
  const idBytes = Buffer.alloc(32);
  idBytes.write('tb', 0, 'utf8');
  idBytes.write(namespace, 2, 14, 'utf8');
  idBytes.write(name, 16, 16, 'utf8');
  const layoutBytes = Buffer.alloc(32);
  layoutBytes.writeUInt16BE(widths.reduce((sum, width) => sum + width, 0), 0);
  layoutBytes[2] = widths.length;
  layoutBytes[3] = dynamicFields;
  widths.forEach((width, index) => { layoutBytes[4 + index] = width; });
  return {
    target,
    id: `0x${idBytes.toString('hex')}`,
    layout: `0x${layoutBytes.toString('hex')}`,
    staticBytes: widths.reduce((sum, width) => sum + width, 0),
    dynamicFields,
  };
}

function probe(label, iface, signature, to, args, values) {
  if (typeof label !== 'string' || label.length === 0 || label.trim() !== label) throw new Error('invalid probe label');
  const address = getAddress(to).toLowerCase();
  return {
    label,
    to: address,
    data: iface.encodeFunctionData(signature, args),
    expected: iface.encodeFunctionResult(signature, values),
  };
}

function finish(checks) {
  const labels = new Set();
  for (const check of checks) {
    if (labels.has(check.label)) throw new Error(`duplicate probe label: ${check.label}`);
    labels.add(check.label);
  }
  return checks;
}

function selectedArm(input, armName) {
  const arm = input?.arms?.[armName];
  if (!arm || arm.name !== armName || !arm.addresses || !arm.graph || !Array.isArray(arm.publications)) {
    throw new Error(`unknown arm: ${armName}`);
  }
  const expected = armName === 'c' ? C_PUBLICATIONS : B_PUBLICATIONS;
  if (arm.publications.length !== expected.length || arm.publications.some((pub, i) => pub.name !== expected[i])) {
    throw new Error(`malformed publication schedule for ${armName}`);
  }
  for (const name of DATA_RECORD_NAMES) {
    if (arm.graph.records?.[name]?.name !== name) throw new Error(`missing graph Record: ${name}`);
  }
  for (const name of TYPE_NAMES) {
    if (!arm.graph.types?.[name]?.id) throw new Error(`missing graph Type: ${name}`);
  }
  return arm;
}

function checkpoint(commonCount) {
  if (!Number.isInteger(commonCount) || commonCount < 0 || commonCount > 8) {
    throw new Error(`invalid common checkpoint: ${commonCount}`);
  }
}

function admittedTypes(options) {
  const value = options?.typesAdmitted ?? true;
  if (typeof value !== 'boolean') throw new Error('typesAdmitted must be boolean');
  return value;
}

function expectHex(value, bytes, label) {
  if (typeof value !== 'string' || !new RegExp(`^0x[0-9a-fA-F]{${bytes * 2}}$`).test(value)) {
    throw new Error(`malformed ${label}`);
  }
  return value.toLowerCase();
}

function uintBE(value, bytes, label = 'integer') {
  const n = BigInt(value);
  if (n < 0n || n >= (1n << (8n * BigInt(bytes)))) throw new Error(`${label} exceeds uint${bytes * 8}`);
  return zeroPadValue(toBeHex(n), bytes);
}

function hexLength(value) {
  return (expectHexEven(value).length - 2) / 2;
}

function expectHexEven(value) {
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error('malformed byte string');
  return value.toLowerCase();
}

function encodedLengths(byteLength) {
  const n = BigInt(byteLength);
  return zeroPadValue(toBeHex(n | (n << 56n)), 32);
}

function addressFromWord(value) {
  const word = expectHex(value, 32, 'address word');
  return getAddress(`0x${word.slice(-40)}`).toLowerCase();
}

function cRow(checks, label, arm, spec, key, staticData, dynamicData = '0x') {
  const to = spec.target === 'Ledger' ? arm.addresses.ledger : arm.addresses.index;
  const staticHex = expectHexEven(staticData);
  const dynamicHex = expectHexEven(dynamicData);
  if (hexLength(staticHex) !== spec.staticBytes) throw new Error(`wrong static width for ${label}`);
  const lengths = spec.dynamicFields === 0 ? ZERO : encodedLengths(hexLength(dynamicHex));
  checks.push(probe(label, C_STORE, 'getRecord(bytes32,bytes32[],bytes32)', to, [spec.id, [expectHex(key, 32, 'row key')], spec.layout], [staticHex, lengths, dynamicHex]));
}

function cEmptyStatic(spec) {
  return `0x${'00'.repeat(spec.staticBytes)}`;
}

function findTransactionBlock(input, armName, label) {
  const rows = input?.transactions?.filter((tx) => tx.arm === armName && tx.kind === 'publication' && tx.label === label) ?? [];
  if (rows.length !== 1 || !Number.isInteger(rows[0].block) || rows[0].block <= 0) {
    throw new Error(`missing publication block: ${armName}/${label}`);
  }
  return rows[0].block;
}

function findRegistrationBlock(input, armName, typeName) {
  const rows = input?.transactions?.filter((tx) => tx.arm === armName && tx.kind === 'setup' && tx.label === `register${typeName}`) ?? [];
  if (rows.length !== 1 || !Number.isInteger(rows[0].block)) throw new Error(`missing Type registration: ${armName}/${typeName}`);
  return rows[0].block;
}

function bPosition(purpose, subject, role) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [B_DOM_POSITION, purpose, subject, role]));
}

function bBinding(principal, position) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], [B_DOM_BINDING, principal, position]));
}

function bScope(principal, purpose, subject) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [B_DOM_SCOPE, principal, purpose, subject]));
}

function bPosting(typeId, kind, ordinal, value) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [B_DOM_POSTING, typeId, kind, ordinal, value]));
}

function cBinding(principal, purpose, subject, role) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [principal, purpose, subject, role]));
}

function cScope(purpose, subject) {
  return keccak256(abi.encode(['bytes32', 'bytes32'], [purpose, subject]));
}

function recordNameFromId(arm, id) {
  const matches = DATA_RECORD_NAMES.filter((name) => arm.graph.records[name].id.toLowerCase() === id.toLowerCase());
  if (matches.length !== 1) throw new Error(`unknown Record id: ${id}`);
  return matches[0];
}

function originalName(name) {
  if (!name.startsWith('reuse')) return name;
  const candidate = name.slice(5);
  if (!DATA_RECORD_NAMES.includes(candidate)) throw new Error(`unknown action name: ${name}`);
  return candidate;
}

function validatePublication(pub) {
  if (!Array.isArray(pub.names) || !Array.isArray(pub.actions) || !Array.isArray(pub.bodies) || !Array.isArray(pub.admissions)
      || pub.names.length !== pub.actions.length || pub.names.length !== pub.bodies.length || pub.names.length !== pub.admissions.length
      || pub.names.length === 0 || pub.lastAdmission !== pub.firstAdmission + pub.names.length - 1) {
    throw new Error(`malformed publication: ${pub.name}`);
  }
  pub.names.forEach((name, index) => {
    if (typeof name !== 'string' || pub.admissions[index]?.name !== name || pub.admissions[index]?.ordinal !== pub.firstAdmission + index) {
      throw new Error(`malformed admission inventory: ${pub.name}/${index}`);
    }
  });
}

function newBList(audit = false) {
  return { items: [], live: 0, audit };
}

function appendB(list, ordinal) {
  if (list.items.length && ordinal <= list.items.at(-1)) throw new Error('non-increasing B posting');
  list.items.push(ordinal);
  list.live += 1;
}

function foldB(input, armName, commonCount) {
  const arm = selectedArm(input, armName);
  const state = {
    arm,
    admissions: new Map(),
    records: new Map(),
    nonces: { A: 0, B: 0 },
    bindings: { A: null, B: null },
    bindingCount: 0,
    subjectAdmission: 0,
    byType: Object.fromEntries(TYPE_NAMES.map((name) => [name, newBList()])),
    byAuthor: { A: newBList(), B: newBList() },
    backlink: Object.fromEntries(['A1', 'A2', 'B1', 'A3'].map((name) => [name, newBList()])),
    history: { A: newBList(true), B: newBList(true) },
    scope: { A: newBList(true), B: newBList(true) },
    reference: { P: newBList(true), Q: newBList(true) },
    highWater: 0,
    publicationCount: 0,
  };
  for (const pub of arm.publications.slice(0, commonCount)) {
    validatePublication(pub);
    if (!['A', 'B'].includes(pub.author) || pub.nonce !== state.nonces[pub.author]) throw new Error(`invalid B nonce/author: ${pub.name}`);
    state.nonces[pub.author] = pub.nonce + 1;
    const publicationOrdinal = B_PUBLICATIONS.indexOf(pub.name) + 1;
    if (publicationOrdinal !== state.publicationCount + 1 || pub.firstAdmission !== state.highWater + 1) throw new Error(`invalid B action order: ${pub.name}`);
    pub.actions.forEach((action, index) => {
      const name = pub.names[index];
      const ordinal = pub.firstAdmission + index;
      const base = { kind: action.kind, leaf: index, publication: publicationOrdinal, bindingOrdinal: 0, expectedRevision: 0, withdrawn: false, a: ZERO, b: ZERO };
      if (action.kind === 1 || action.kind === 2) {
        const sourceName = originalName(name);
        const graphRecord = arm.graph.records[sourceName];
        if (!graphRecord || (action.kind === 1 && name !== sourceName) || (action.kind === 2 && name === sourceName)) throw new Error(`unknown action name: ${name}`);
        if (action.typeId.toLowerCase() !== graphRecord.typeId.toLowerCase()) throw new Error(`B Type mismatch: ${name}`);
        if (action.kind === 1 && (action.bodyHashOrRecordId.toLowerCase() !== graphRecord.bodyHash.toLowerCase() || pub.bodies[index].toLowerCase() !== graphRecord.body.toLowerCase())) throw new Error(`B body mismatch: ${name}`);
        if (action.kind === 2 && (action.bodyHashOrRecordId.toLowerCase() !== graphRecord.id.toLowerCase() || pub.bodies[index] !== '0x')) throw new Error(`B reuse mismatch: ${name}`);
        let row = state.records.get(graphRecord.id);
        const fresh = !row;
        if (!row) {
          row = { name: sourceName, typeId: graphRecord.typeId, firstAdmission: ordinal, occurrences: 0, body: graphRecord.body };
          state.records.set(graphRecord.id, row);
        }
        row.occurrences += 1;
        appendB(state.byType[graphRecord.type], ordinal);
        appendB(state.byAuthor[pub.author], ordinal);
        if (armName === 'bSelective' && fresh && graphRecord.type === 'QUOTE') {
          if (graphRecord.refNames.length !== 1 || !state.reference[graphRecord.refNames[0]]) throw new Error(`malformed selective reference: ${name}`);
          appendB(state.reference[graphRecord.refNames[0]], ordinal);
        }
        base.a = action.bodyHashOrRecordId;
        if (action.kind === 1) base.b = action.typeId;
      } else if (action.kind === 3) {
        if (!name.startsWith('head') || action.subject.toLowerCase() !== arm.graph.subject.toLowerCase()) throw new Error(`unknown action name: ${name}`);
        const targetName = recordNameFromId(arm, action.target);
        const position = bPosition(action.purpose, action.subject, action.role);
        const bindingKey = bBinding(arm.graph.principals[pub.author], position);
        const old = state.bindings[pub.author];
        const revision = old?.revision ?? 0;
        if (action.expectedRevision !== revision) throw new Error(`B binding revision mismatch: ${name}`);
        let bindingOrdinal = old?.bindingOrdinal;
        if (!old) {
          bindingOrdinal = ++state.bindingCount;
          appendB(state.scope[pub.author], bindingOrdinal);
        } else {
          state.backlink[old.targetName].live -= 1;
        }
        appendB(state.backlink[targetName], ordinal);
        appendB(state.history[pub.author], ordinal);
        state.bindings[pub.author] = { bindingKey, position, state: 1, revision: revision + 1, admission: ordinal, previous: old?.admission ?? 0, bindingOrdinal, target: action.target, targetName };
        base.bindingOrdinal = bindingOrdinal;
        base.expectedRevision = action.expectedRevision;
        base.a = action.target;
      } else if (action.kind === 5) {
        if (name !== 'subject' || action.salt.toLowerCase() !== arm.graph.salt.toLowerCase()) throw new Error(`unknown action name: ${name}`);
        state.subjectAdmission = ordinal;
        base.a = action.salt;
      } else {
        throw new Error(`unknown B action kind: ${action.kind}`);
      }
      state.admissions.set(ordinal, base);
      state.highWater = ordinal;
    });
    state.publicationCount = publicationOrdinal;
  }
  return state;
}

function foldC(input, commonCount, typesAdmitted) {
  const arm = selectedArm(input, 'c');
  const state = {
    arm,
    admissions: new Map(),
    records: new Map(),
    types: new Map(),
    occurrences: new Map(),
    nonces: { A: 0, B: 0 },
    bindings: { A: null, B: null },
    subject: null,
    scope: [],
    history: { A: [], B: [] },
    backlinks: Object.fromEntries(['P', 'Q', 'I_ETH', 'I_USDC', 'A1', 'A2', 'B1', 'A3'].map((name) => [name, []])),
    byType: Object.fromEntries([...TYPE_NAMES, 'TYPE_META'].map((name) => [name, []])),
    byAuthor: { A: [], B: [] },
    highWater: 0,
  };
  const pubs = typesAdmitted ? arm.publications.slice(0, commonCount + 1) : [];
  for (const pub of pubs) {
    validatePublication(pub);
    if (!['A', 'B'].includes(pub.author) || BigInt(pub.nonce) <= BigInt(state.nonces[pub.author]) || pub.firstAdmission !== state.highWater + 1) {
      throw new Error(`invalid C nonce/action order: ${pub.name}`);
    }
    state.nonces[pub.author] = pub.nonce;
    pub.actions.forEach((action, index) => {
      const name = pub.names[index];
      const ordinal = pub.firstAdmission + index;
      state.byAuthor[pub.author].push(ordinal);
      if (action.kind === 1) {
        const typeName = name.startsWith('type') ? name.slice(4) : '';
        const type = arm.graph.types[typeName];
        if (pub.name !== 'types' || !TYPE_NAMES.includes(typeName) || !type || action.typeId.toLowerCase() !== C_TYPE_META.toLowerCase()
            || action.digest.toLowerCase() !== keccak256(type.body).toLowerCase() || pub.bodies[index].toLowerCase() !== type.body.toLowerCase()) {
          throw new Error(`unknown action name: ${name}`);
        }
        const acceptor = addressFromWord(action.target);
        if (acceptor !== type.acceptor.toLowerCase()) throw new Error(`C Type acceptor mismatch: ${name}`);
        state.records.set(type.id, { name, typeId: C_TYPE_META, firstAdmission: ordinal, body: type.body });
        state.types.set(type.id, { name: typeName, acceptor, codehash: type.ruleCodehash, admission: ordinal, refTypes: type.refTypes });
        state.occurrences.set(type.id, 1);
        state.byType.TYPE_META.push(type.id);
      } else if (action.kind === 2) {
        const sourceName = originalName(name);
        const graphRecord = arm.graph.records[sourceName];
        if (!graphRecord || (action.digestKind === 1 && name !== sourceName) || (action.digestKind === 2 && name === sourceName)
            || ![1, 2].includes(action.digestKind) || action.typeId.toLowerCase() !== graphRecord.typeId.toLowerCase()) {
          throw new Error(`unknown action name: ${name}`);
        }
        if (action.digestKind === 1 && (action.digest.toLowerCase() !== graphRecord.bodyHash.toLowerCase() || pub.bodies[index].toLowerCase() !== graphRecord.body.toLowerCase())) throw new Error(`C body mismatch: ${name}`);
        if (action.digestKind === 2 && (action.digest.toLowerCase() !== graphRecord.id.toLowerCase() || pub.bodies[index] !== '0x')) throw new Error(`C reuse mismatch: ${name}`);
        const fresh = !state.records.has(graphRecord.id);
        if (fresh) {
          state.records.set(graphRecord.id, { name: sourceName, typeId: graphRecord.typeId, firstAdmission: ordinal, body: graphRecord.body });
          state.byType[graphRecord.type].push(graphRecord.id);
          for (const refName of graphRecord.refNames) {
            if (!state.backlinks[refName]) throw new Error(`unknown C reference target: ${refName}`);
            state.backlinks[refName].push(graphRecord.id);
          }
        }
        state.occurrences.set(graphRecord.id, (state.occurrences.get(graphRecord.id) ?? 0) + 1);
      } else if (action.kind === 3) {
        if (name !== 'subject' || action.salt.toLowerCase() !== arm.graph.salt.toLowerCase()) throw new Error(`unknown action name: ${name}`);
        state.subject = { creator: arm.graph.principals[pub.author], salt: action.salt, admission: ordinal };
      } else if (action.kind === 4) {
        if (!name.startsWith('head') || action.subject.toLowerCase() !== arm.graph.subject.toLowerCase()) throw new Error(`unknown action name: ${name}`);
        recordNameFromId(arm, action.target);
        const key = cBinding(arm.graph.principals[pub.author], action.purpose, action.subject, action.role);
        const old = state.bindings[pub.author];
        const revision = old?.revision ?? 0;
        if (action.expectedRevision !== revision) throw new Error(`C binding revision mismatch: ${name}`);
        const row = { key, target: action.target, revision: revision + 1, admission: ordinal, purpose: action.purpose, subject: action.subject, role: action.role };
        state.bindings[pub.author] = row;
        state.history[pub.author].push(ordinal);
        if (!old) state.scope.push(arm.graph.principals[pub.author], action.role, key);
      } else {
        throw new Error(`unknown C action kind: ${action.kind}`);
      }
      state.admissions.set(ordinal, { publicationId: pub.publicationId, ...action });
      state.highWater = ordinal;
    });
  }
  return state;
}

function addBPostingChecks(checks, arm, label, key, list) {
  const last = list.items.at(-1) ?? 0;
  checks.push(probe(`${label}.head`, B_INDEX, 'postingHead', arm.addresses.index, [key], [list.items.length, list.live, last, list.audit && list.items.length ? 1 : 0]));
  for (let offset = 0; offset < list.items.length; offset += 5) {
    let packed = 0n;
    list.items.slice(offset, offset + 5).forEach((ordinal, lane) => { packed |= BigInt(ordinal) << (48n * BigInt(lane)); });
    checks.push(probe(`${label}.word.${offset / 5}`, B_INDEX, 'postingWord', arm.addresses.index, [key, offset / 5], [packed]));
  }
}

function buildBState(input, armName, commonCount) {
  const state = foldB(input, armName, commonCount);
  const { arm } = state;
  const checks = [];
  checks.push(probe('counts', B_LEDGER, 'counts', arm.addresses.ledger, [], [state.highWater, state.records.size, state.bindingCount, state.publicationCount]));
  for (const author of ['A', 'B']) {
    const account = input.accounts[author === 'A' ? 1 : 2].address;
    checks.push(probe(`nonce.${author}`, B_LEDGER, 'nonces', arm.addresses.ledger, [account], [state.nonces[author]]));
  }
  for (const name of DATA_RECORD_NAMES) {
    const graphRecord = arm.graph.records[name];
    const row = state.records.get(graphRecord.id);
    checks.push(probe(`record.${name}`, B_LEDGER, 'record', arm.addresses.ledger, [graphRecord.id], row ? [row.typeId, row.firstAdmission, row.occurrences, row.body] : [ZERO, 0, 0, '0x']));
  }
  checks.push(probe('subject', B_LEDGER, 'subjectCreatedAt', arm.addresses.ledger, [arm.graph.subject], [state.subjectAdmission]));
  const bindAction = arm.publications[1].actions[2];
  const position = bPosition(bindAction.purpose, arm.graph.subject, bindAction.role);
  for (const author of ['A', 'B']) {
    const row = state.bindings[author];
    const key = bBinding(arm.graph.principals[author], position);
    checks.push(probe(`head.${author}`, B_LEDGER, 'head', arm.addresses.ledger, [key], row ? [row.state, row.revision, row.admission, row.previous, row.bindingOrdinal, row.target] : [0, 0, 0, 0, 0, ZERO]));
  }
  checks.push(probe('position', B_LEDGER, 'positionCell', arm.addresses.ledger, [position], state.bindingCount ? [bindAction.purpose, arm.graph.subject, bindAction.role] : [ZERO, ZERO, ZERO]));
  for (const ordinal of [1, 2]) checks.push(probe(`bindingPosition.${ordinal}`, B_LEDGER, 'bindingPosition', arm.addresses.ledger, [ordinal], [ordinal <= state.bindingCount ? position : ZERO]));
  checks.push(probe('index.lastProcessed', B_INDEX, 'lastProcessed', arm.addresses.index, [], [state.highWater]));
  checks.push(probe('index.lastPublication', B_INDEX, 'lastPublication', arm.addresses.index, [], [state.publicationCount]));
  checks.push(probe('index.gapped', B_INDEX, 'gapped', arm.addresses.index, [], [false]));
  for (const [name, family] of Object.entries(B_FAMILIES)) {
    const declared = name !== 'reference-position' || armName === 'bSelective';
    checks.push(probe(`coverage.${name}`, B_INDEX, 'coverage', arm.addresses.index, [family, ZERO], declared ? [2, 1, state.highWater] : [0, 0, 0]));
  }
  for (const name of TYPE_NAMES) addBPostingChecks(checks, arm, `posting.byType.${name}`, bPosting(arm.graph.types[name].id, 1, 0, ZERO), state.byType[name]);
  for (const author of ['A', 'B']) addBPostingChecks(checks, arm, `posting.byAuthor.${author}`, bPosting(ZERO, 4, 0, arm.graph.principals[author]), state.byAuthor[author]);
  for (const name of ['A1', 'A2', 'B1', 'A3']) addBPostingChecks(checks, arm, `posting.backlink.${name}`, bPosting(ZERO, 5, 0, arm.graph.records[name].id), state.backlink[name]);
  for (const author of ['A', 'B']) {
    const bindingKey = bBinding(arm.graph.principals[author], position);
    addBPostingChecks(checks, arm, `posting.history.${author}`, bPosting(ZERO, 8, 0, bindingKey), state.history[author]);
    const scopeKey = bScope(arm.graph.principals[author], bindAction.purpose, arm.graph.subject);
    addBPostingChecks(checks, arm, `posting.scope.${author}`, bPosting(ZERO, 10, 0, scopeKey), state.scope[author]);
  }
  for (const name of ['P', 'Q']) addBPostingChecks(checks, arm, `posting.reference.${name}`, bPosting(arm.graph.types.QUOTE.id, 11, 0, arm.graph.records[name].id), state.reference[name]);
  return finish(checks);
}

function cRecordStatic(row) {
  return row ? concat([row.typeId, uintBE(row.firstAdmission, 8)]) : cEmptyStatic(C_TABLES.Records);
}

function cTypeStatic(row) {
  return concat([row.acceptor, row.codehash, uintBE(row.admission, 8)]);
}

function cAdmissionStatic(row) {
  return concat([
    row.publicationId, uintBE(row.kind, 1), row.typeId, uintBE(row.digestKind, 1), row.digest,
    row.purpose, row.subject, row.role, row.target, uintBE(row.expectedRevision, 4), row.salt,
  ]);
}

function cEvidenceStatic(arm, pub) {
  return concat([
    pub.intent.author, uintBE(2, 1), pub.signature.r, pub.signature.s, uintBE(pub.signature.v, 1),
    uintBE(pub.intent.nonce, 8), uintBE(pub.intent.deadline, 8), pub.intent.acceptanceProfile,
    pub.intent.indexObligations, pub.actionsHash, uintBE(pub.firstAdmission, 8), uintBE(pub.names.length, 2),
    uintBE(pub.firstAdmission - 1, 8), pub.digestInput.realmId, pub.digestInput.coreCodeCommitment,
    ZERO, uintBE(0, 1),
  ]);
}

function buildCState(input, commonCount, typesAdmitted) {
  const state = foldC(input, commonCount, typesAdmitted);
  const { arm } = state;
  const checks = [];
  checks.push(probe('ledger.highWater', C_LEDGER, 'highWater', arm.addresses.ledger, [], [state.highWater]));
  cRow(checks, 'counter.admissions', arm, C_TABLES.Counters, C_COUNTER_ADMISSIONS, uintBE(state.highWater, 8));
  for (const author of ['A', 'B']) cRow(checks, `nonce.${author}`, arm, C_TABLES.Nonces, arm.graph.principals[author], uintBE(state.nonces[author], 8));
  for (const name of DATA_RECORD_NAMES) {
    const graphRecord = arm.graph.records[name];
    const row = state.records.get(graphRecord.id);
    cRow(checks, `record.${name}`, arm, C_TABLES.Records, graphRecord.id, cRecordStatic(row), row?.body ?? '0x');
    cRow(checks, `occurrence.${name}`, arm, C_TABLES.Occurrences, graphRecord.id, uintBE(state.occurrences.get(graphRecord.id) ?? 0, 4));
  }
  if (typesAdmitted) {
    for (const name of TYPE_NAMES) {
      const type = arm.graph.types[name];
      const record = state.records.get(type.id);
      const typeRow = state.types.get(type.id);
      if (!record || !typeRow) throw new Error(`missing admitted C Type: ${name}`);
      cRow(checks, `record.type${name}`, arm, C_TABLES.Records, type.id, cRecordStatic(record), record.body);
      cRow(checks, `type.${name}`, arm, C_TABLES.Types, type.id, cTypeStatic(typeRow), concat(typeRow.refTypes));
      cRow(checks, `occurrence.type${name}`, arm, C_TABLES.Occurrences, type.id, uintBE(state.occurrences.get(type.id), 4));
    }
  }
  const subjectStatic = state.subject ? concat([state.subject.creator, state.subject.salt, uintBE(state.subject.admission, 8)]) : cEmptyStatic(C_TABLES.Subjects);
  cRow(checks, 'subject', arm, C_TABLES.Subjects, arm.graph.subject, subjectStatic);
  const bindAction = arm.publications[2].actions[2];
  for (const author of ['A', 'B']) {
    const key = cBinding(arm.graph.principals[author], bindAction.purpose, arm.graph.subject, bindAction.role);
    const row = state.bindings[author];
    const staticData = row ? concat([row.target, uintBE(row.revision, 4), uintBE(row.admission, 8)]) : cEmptyStatic(C_TABLES.Bindings);
    cRow(checks, `binding.${author}`, arm, C_TABLES.Bindings, key, staticData);
  }
  const scopeKey = cScope(bindAction.purpose, arm.graph.subject);
  cRow(checks, 'posting.scope.HEAD', arm, C_TABLES.Scopes, scopeKey, '0x', concat(state.scope));
  for (const author of ['A', 'B']) {
    const key = cBinding(arm.graph.principals[author], bindAction.purpose, arm.graph.subject, bindAction.role);
    cRow(checks, `posting.history.${author}`, arm, C_TABLES.BindingHistory, key, '0x', concat(state.history[author].map((n) => uintBE(n, 8))));
  }
  for (const name of ['P', 'Q', 'I_ETH', 'I_USDC', 'A1', 'A2', 'B1', 'A3']) {
    cRow(checks, `posting.backlink.${name}`, arm, C_TABLES.Backlinks, arm.graph.records[name].id, '0x', concat(state.backlinks[name]));
  }
  for (const name of TYPE_NAMES) cRow(checks, `posting.byType.${name}`, arm, C_TABLES.ByType, arm.graph.types[name].id, '0x', concat(state.byType[name]));
  if (typesAdmitted) cRow(checks, 'posting.byType.TYPE_META', arm, C_TABLES.ByType, C_TYPE_META, '0x', concat(state.byType.TYPE_META));
  for (const author of ['A', 'B']) cRow(checks, `posting.byAuthor.${author}`, arm, C_TABLES.ByAuthor, arm.graph.principals[author], '0x', concat(state.byAuthor[author].map((n) => uintBE(n, 8))));
  for (const [name, family] of Object.entries(C_FAMILIES)) {
    const mandatory = name !== 'optional-digest';
    cRow(checks, `coverage.raw.${name}`, arm, C_TABLES.Coverage, family, concat([uintBE(mandatory ? 1 : 0, 1), uintBE(1, 1), uintBE(0, 8), uintBE(0, 8)]));
    const status = mandatory || state.highWater === 0 ? 1 : 2;
    checks.push(probe(`coverage.api.${name}`, C_INDEX, 'coverage', arm.addresses.index, [family, ZERO], [status, mandatory ? state.highWater : 0]));
  }
  return finish(checks);
}

export function buildInitializationChecks(input, armName, options = { typesAdmitted: true }) {
  const arm = selectedArm(input, armName);
  const typesAdmitted = admittedTypes(options);
  if (B_ARMS.has(armName)) {
    if (!typesAdmitted) throw new Error('B initialization requires admitted Types');
    const checks = [
      probe('ledger.indexModule', B_LEDGER, 'indexModule', arm.addresses.ledger, [], [arm.addresses.index]),
      probe('ledger.registry', B_LEDGER, 'registry', arm.addresses.ledger, [], [arm.addresses.registry]),
      probe('index.ledger', B_INDEX, 'ledger', arm.addresses.index, [], [arm.addresses.ledger]),
      probe('index.attachedFrom', B_INDEX, 'attachedFrom', arm.addresses.index, [], [1]),
      probe('index.generation', B_INDEX, 'generation', arm.addresses.index, [], [0]),
      probe('index.gapped', B_INDEX, 'gapped', arm.addresses.index, [], [false]),
      probe('registry.epoch', B_REGISTRY, 'epoch', arm.addresses.registry, [], [4]),
    ];
    TYPE_NAMES.forEach((name) => {
      const type = arm.graph.types[name];
      const registrationBlock = findRegistrationBlock(input, armName, name);
      checks.push(probe(`registry.descriptor.${name}`, B_REGISTRY, 'descriptor', arm.addresses.registry, [type.id], [type.shape, type.ruleCodehash, type.acceptor, type.refTypes.length, 1, registrationBlock]));
      checks.push(probe(`registry.refTypes.${name}`, B_REGISTRY, 'refTypes', arm.addresses.registry, [type.id], [type.refTypes]));
      checks.push(probe(`registry.typeInfo.${name}`, B_REGISTRY, 'typeInfo', arm.addresses.registry, [type.id], [true, type.acceptor, type.ruleCodehash, ZERO_ADDRESS, ZERO, type.refTypes.length, 1]));
    });
    const purpose = arm.publications[1].actions[2].purpose;
    checks.push(probe('registry.bindingRefType.HEAD', B_REGISTRY, 'bindingRefType', arm.addresses.registry, [purpose, ZERO], [ZERO]));
    return finish(checks);
  }
  if (armName !== 'c') throw new Error(`unknown arm: ${armName}`);
  const checks = [
    probe('ledger.index', C_LEDGER, 'index', arm.addresses.ledger, [], [arm.addresses.index]),
    probe('ledger.indexCodehash', C_LEDGER, 'indexCodehash', arm.addresses.ledger, [], [arm.runtimes.index.runtimeCodehash]),
    probe('ledger.rulesEpoch', C_LEDGER, 'rulesEpoch', arm.addresses.ledger, [], [1]),
    probe('ledger.realmId', C_LEDGER, 'realmId', arm.addresses.ledger, [], [arm.realmId]),
    probe('index.ledger', C_INDEX, 'ledger', arm.addresses.index, [], [arm.addresses.ledger]),
    probe('index.ledgerCodehash', C_INDEX, 'ledgerCodehash', arm.addresses.index, [], [arm.runtimes.ledger.runtimeCodehash]),
    probe('index.poisonConcept', C_INDEX, 'poisonConcept', arm.addresses.index, [], [ZERO]),
    probe('index.generation', C_INDEX, 'generation', arm.addresses.index, [], [1]),
  ];
  for (const [name, spec] of Object.entries(C_TABLES)) {
    const to = spec.target === 'Ledger' ? arm.addresses.ledger : arm.addresses.index;
    checks.push(probe(`layout.${spec.target}.${name}`, C_STORE, 'getFieldLayout', to, [spec.id], [spec.layout]));
  }
  if (typesAdmitted) {
    const state = foldC(input, 0, true);
    for (const name of TYPE_NAMES) {
      const type = arm.graph.types[name];
      const row = state.types.get(type.id);
      cRow(checks, `type.${name}`, arm, C_TABLES.Types, type.id, cTypeStatic(row), concat(row.refTypes));
    }
  }
  return finish(checks);
}

export function buildStateChecks(input, armName, commonCount, options = { typesAdmitted: true }) {
  checkpoint(commonCount);
  const typesAdmitted = admittedTypes(options);
  if (B_ARMS.has(armName)) {
    if (!typesAdmitted) throw new Error('B state requires admitted Types');
    return buildBState(input, armName, commonCount);
  }
  if (armName === 'c') {
    if (!typesAdmitted && commonCount !== 0) throw new Error('C pre-Type state is legal only at common0');
    return buildCState(input, commonCount, typesAdmitted);
  }
  selectedArm(input, armName);
}

export function buildPublicationChecks(input, armName, publicationName) {
  const arm = selectedArm(input, armName);
  const allowed = armName === 'c' ? C_PUBLICATIONS : B_PUBLICATIONS;
  const publicationIndex = allowed.indexOf(publicationName);
  if (publicationIndex < 0) throw new Error(`unknown publication: ${armName}/${publicationName}`);
  const pub = arm.publications[publicationIndex];
  validatePublication(pub);
  const checks = [];
  if (B_ARMS.has(armName)) {
    const state = foldB(input, armName, publicationIndex + 1);
    const publicationOrdinal = publicationIndex + 1;
    for (let ordinal = pub.firstAdmission; ordinal <= pub.lastAdmission; ordinal += 1) {
      const row = state.admissions.get(ordinal);
      checks.push(probe(`admission.${ordinal}`, B_LEDGER, 'admission', arm.addresses.ledger, [ordinal], [row.kind, row.leaf, row.publication, row.bindingOrdinal, row.expectedRevision, row.withdrawn, row.a, row.b]));
      if (row.kind === 1 || row.kind === 2) {
        const action = pub.actions[ordinal - pub.firstAdmission];
        const typeName = TYPE_NAMES.find((name) => arm.graph.types[name].id.toLowerCase() === action.typeId.toLowerCase());
        if (!typeName) throw new Error(`unknown B Type: ${action.typeId}`);
        const type = arm.graph.types[typeName];
        checks.push(probe(`acceptanceBasis.${ordinal}`, B_LEDGER, 'acceptanceBasis', arm.addresses.ledger, [ordinal], [type.id, 1, type.acceptor, type.ruleCodehash, ZERO_ADDRESS, ZERO, TYPE_NAMES.indexOf(typeName) + 1, findRegistrationBlock(input, armName, typeName)]));
      }
    }
    const block = findTransactionBlock(input, armName, publicationName);
    checks.push(probe(`evidence.${publicationName}`, B_LEDGER, 'evidence', arm.addresses.ledger, [publicationOrdinal], [pub.intent.author, 2, pub.signature.v, pub.names.length, pub.firstAdmission, pub.signature.r, pub.signature.s, pub.intent.nonce, pub.intent.deadline, block, pub.intent.acceptanceProfile, pub.intent.indexObligations, pub.actionsHash]));
    checks.push(probe(`publicationOf.${publicationName}`, B_LEDGER, 'publicationOf', arm.addresses.ledger, [pub.publicationId], [publicationOrdinal]));
    return finish(checks);
  }
  const commonCount = publicationName === 'types' ? 0 : B_PUBLICATIONS.indexOf(publicationName) + 1;
  const state = foldC(input, commonCount, true);
  for (let ordinal = pub.firstAdmission; ordinal <= pub.lastAdmission; ordinal += 1) {
    const row = state.admissions.get(ordinal);
    cRow(checks, `admission.${ordinal}`, arm, C_TABLES.Admissions, uintBE(ordinal, 32), cAdmissionStatic(row));
  }
  cRow(checks, `evidence.${publicationName}`, arm, C_TABLES.Evidence, pub.publicationId, cEvidenceStatic(arm, pub));
  return finish(checks);
}
