#!/usr/bin/env node
// vectors/verify-fixture-map-b.mjs — Road B lab. DISPOSABLE LAB, CANDIDATE-AUTHORED, NO PROTOCOL CLAIM.
// Recomputes every derivable `worked` value of vectors/fixture-map-b.json from the formulas and the RAW INPUTS stored in
// that file (no chain, no build, no candidate contract is asked anything) and exits non-zero on any mismatch. It is a
// self-consistency check of the candidate's own map: the independent run controller must re-derive the map with its own
// implementation (sdk-fixture.md appendix, pre-run pins 2 and 4) and must not copy expected answers from this file, from
// the map, or from any result packet.
//   node vectors/verify-fixture-map-b.mjs                       verify: prints one line per value, then PASS n/n or FAIL
//   node vectors/verify-fixture-map-b.mjs --emit                author step: fill every derivable `worked` value in place
//   node vectors/verify-fixture-map-b.mjs --codehashes <f.json> also derive the build-dependent values from the CONTROLLER's
//                                                               runtime codehashes { quoteRule, pairRule, quoteAcceptor,
//                                                               ledger } (each = keccak256 of the deployed runtime code);
//                                                               with --emit those values are filled too — never commit them
// ethers v6 from EFS_ETHERS_PATH (fallbacks: the runner's default paths).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const CANDIDATES = [
  process.env.EFS_ETHERS_PATH,
  '/Users/james/Code/EFS/planning/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
  '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
].filter(Boolean);
const ethersPath = CANDIDATES.find((p) => existsSync(p));
if (!ethersPath) {
  console.error('ethers v6 not found; set EFS_ETHERS_PATH to a node_modules/ethers directory');
  process.exit(2);
}
const { AbiCoder, keccak256, toUtf8Bytes, HDNodeWallet, getCreateAddress, zeroPadValue, toBeHex } = require(ethersPath);
const coder = AbiCoder.defaultAbiCoder();
const MAP_PATH = fileURLToPath(new URL('./fixture-map-b.json', import.meta.url));
const args = process.argv.slice(2);
const emit = args.includes('--emit');
const chIdx = args.indexOf('--codehashes');
const codehashes = chIdx >= 0 ? JSON.parse(readFileSync(args[chIdx + 1], 'utf8')) : null;
const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
const I = map.inputs;

// ---------------------------------------------------------------- the formulas (each cited in fixture-map-b.json / FIXTURE-MAP.md)
const DOM = (s) => keccak256(toUtf8Bytes(s));
const enc = (types, values) => coder.encode(types, values);
const ZERO = zeroPadValue('0x00', 32);
const word = (n) => toBeHex(BigInt(n), 32);
const typeIdOf = (shape, refs, ruleId) => keccak256(enc(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_TYPE), shape, keccak256(enc(['bytes32[]'], [refs])), ruleId]));
const recordId = (t, body) => keccak256(enc(['bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_RECORD), t, keccak256(body)]));
const subjectId = (creator, salt) => keccak256(enc(['bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_SUBJECT), creator, salt]));
const position = (purpose, subject, role) => keccak256(enc(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_POSITION), purpose, subject, role]));
const binding = (principal, pos) => keccak256(enc(['bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_BINDING), principal, pos]));
const scopeKey = (principal, purpose, subject) => keccak256(enc(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM(I.tags.DOM_SCOPE), principal, purpose, subject]));
const posting = (t, kind, ordinal, valueKey) => keccak256(enc(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [DOM(I.tags.DOM_POSTING), t, kind, ordinal, valueKey]));
const scopeList = (key) => posting(ZERO, 10, 0, key);
const eoaPrincipal = (address) => zeroPadValue(address, 32);
const contractPrincipal = (realmOrigin, address) => keccak256(enc(['bytes32', 'uint256', 'bytes32', 'address'], [DOM(I.tags.DOM_PRINCIPAL), 2n, realmOrigin, address]));
const lensId = (lens) => keccak256(enc(['address[]'], [lens]));
const quoteBody = (pairId, mantissa) => enc(['bytes32', 'uint256', 'uint8', 'uint64', 'bytes32'], [pairId, BigInt(mantissa), I.quote.scale, BigInt(I.quote.observedAt), DOM(I.strings.NOTE_BYTES_UTF8)]);

function compute(ch) {
  const c = {};
  for (const [k, v] of Object.entries(I.tags)) c[`constants.${k}`] = DOM(v);
  for (const [k, v] of Object.entries(I.purposes)) c[`constants.PURPOSE_${k}`] = DOM(v);
  c['constants.REALM_ID'] = DOM(I.realm);
  c['constants.NOTE_COMMITMENT'] = DOM(I.strings.NOTE_BYTES_UTF8);
  c['constants.FOLDER_SWAPS'] = DOM(I.strings.FOLDER_SWAPS);
  c['constants.NAME_ETH_USDC'] = DOM(I.strings.NAME_ETH_USDC);
  c['constants.CONCEPT_MARKET'] = DOM(I.strings.CONCEPT_MARKET);
  c['constants.SALT_FILE_QUOTE'] = DOM(I.strings.SALT_FILE_QUOTE);
  for (const [k, v] of Object.entries(I.shapes)) c[`types.${k}.shape`] = DOM(v);
  c['types.ITEM.refsHash'] = keccak256(enc(['bytes32[]'], [[]]));
  c['types.ITEM.ruleId'] = ZERO;
  const ITEM = typeIdOf(DOM(I.shapes.ITEM), [], ZERO);
  c['types.ITEM.typeId'] = ITEM;
  c['types.PAIR.refsHash'] = keccak256(enc(['bytes32[]'], [[ITEM, ITEM]]));
  const bodyEth = enc(['uint256'], [BigInt(I.items.ITEM_ETH)]);
  const bodyUsdc = enc(['uint256'], [BigInt(I.items.ITEM_USDC)]);
  const itemEth = recordId(ITEM, bodyEth);
  const itemUsdc = recordId(ITEM, bodyUsdc);
  c['records.ITEM_ETH.body'] = bodyEth;
  c['records.ITEM_ETH.id'] = itemEth;
  c['records.ITEM_USDC.body'] = bodyUsdc;
  c['records.ITEM_USDC.id'] = itemUsdc;
  const pairBody = enc(['bytes32', 'bytes32', 'uint256'], [itemEth, itemUsdc, BigInt(I.items.pairPayload)]);
  c['records.PAIR_ETH_USDC.body'] = pairBody;
  const wallet = (i) => HDNodeWallet.fromPhrase(I.mnemonic, undefined, I.derivationPath.replace('<index>', String(i))).address;
  for (const [role, i] of Object.entries(I.walletIndices)) c[`wallets.${role}.address`] = wallet(i);
  const deployer = wallet(I.walletIndices.deployer);
  for (const d of I.deployments) c[`deployment.${d.key}.address`] = getCreateAddress({ from: deployer, nonce: d.nonce });
  const A = wallet(I.walletIndices.AUTHOR_A);
  const actorB = getCreateAddress({ from: deployer, nonce: I.deployments.find((d) => d.key === 'actorB').nonce });
  const principalA = eoaPrincipal(A);
  c['principals.AUTHOR_A.principal'] = principalA;
  const subj = subjectId(principalA, DOM(I.strings.SALT_FILE_QUOTE));
  c['subjects.FILE_QUOTE.id'] = subj;
  const HEAD = DOM(I.purposes.HEAD), FOLDER = DOM(I.purposes.FOLDER), TAG = DOM(I.purposes.TAG);
  const swaps = DOM(I.strings.FOLDER_SWAPS), nameRole = DOM(I.strings.NAME_ETH_USDC), market = DOM(I.strings.CONCEPT_MARKET);
  const headPos = position(HEAD, subj, ZERO), swapsPos = position(FOLDER, swaps, nameRole), tagPos = position(TAG, subj, market);
  c['positions.HEAD_FILE_QUOTE'] = headPos;
  c['positions.PLACEMENT_SWAPS_ETH_USDC'] = swapsPos;
  c['positions.TAG_MARKET'] = tagPos;
  c['bindings.A_HEAD'] = binding(principalA, headPos);
  c['bindings.A_PLACEMENT'] = binding(principalA, swapsPos);
  c['bindings.A_TAG'] = binding(principalA, tagPos);
  c['scopes.A_FOLDER_SWAPS.scopeKey'] = scopeKey(principalA, FOLDER, swaps);
  c['scopes.A_FOLDER_SWAPS.scopeList'] = scopeList(scopeKey(principalA, FOLDER, swaps));
  c['lenses.LENS_A_FIRST.id'] = lensId([A, actorB]);
  c['lenses.LENS_B_FIRST.id'] = lensId([actorB, A]);
  c['constants.WORD_ONE'] = word(1);
  if (ch) {
    const need = ['quoteRule', 'pairRule', 'quoteAcceptor', 'ledger'];
    for (const k of need) if (!ch[k]) throw new Error(`--codehashes: missing ${k}`);
    c['types.PAIR.ruleId'] = ch.pairRule;
    const PAIR = typeIdOf(DOM(I.shapes.PAIR), [ITEM, ITEM], ch.pairRule);
    c['types.PAIR.typeId'] = PAIR;
    c['types.QUOTE_J.ruleId'] = ch.quoteAcceptor;
    c['types.QUOTE_J.refsHash'] = keccak256(enc(['bytes32[]'], [[PAIR]]));
    const QUOTE_J = typeIdOf(DOM(I.shapes.QUOTE_J), [PAIR], ch.quoteAcceptor);
    c['types.QUOTE_J.typeId'] = QUOTE_J;
    const pairId = recordId(PAIR, pairBody);
    c['records.PAIR_ETH_USDC.id'] = pairId;
    for (const [label, m] of [['QUOTE_A1', I.quote.mantissaA1], ['QUOTE_A2', I.quote.mantissaA2], ['QUOTE_B1', I.quote.mantissaB1]]) {
      const body = quoteBody(pairId, m);
      c[`records.${label}.body`] = body;
      c[`records.${label}.id`] = recordId(QUOTE_J, body);
    }
    const realmOrigin = keccak256(enc(['uint256', 'bytes32'], [BigInt(I.chainId), ch.ledger]));
    c['principals.AUTHOR_B.realmOrigin'] = realmOrigin;
    const principalB = contractPrincipal(realmOrigin, actorB);
    c['principals.AUTHOR_B.principal'] = principalB;
    c['bindings.B_HEAD'] = binding(principalB, headPos);
    c['scopes.B_FOLDER_SWAPS.scopeKey'] = scopeKey(principalB, FOLDER, swaps);
    c['scopes.B_FOLDER_SWAPS.scopeList'] = scopeList(scopeKey(principalB, FOLDER, swaps));
  }
  return c;
}

// ---------------------------------------------------------------- walk the map: every object carrying `derivable` is a value leaf
function leaves(node, path = [], out = []) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    if (Object.prototype.hasOwnProperty.call(node, 'derivable')) out.push({ path: path.join('.'), node });
    else for (const [k, v] of Object.entries(node)) leaves(v, [...path, k], out);
  }
  return out;
}
const computed = compute(codehashes);
const lower = (v) => String(v).toLowerCase();
let ok = 0;
let fail = 0;
const lines = [];
for (const { path, node } of leaves(map)) {
  const have = Object.prototype.hasOwnProperty.call(computed, path);
  if (node.derivable === true || (codehashes && have)) {
    if (!have) { fail++; lines.push(`FAIL ${path}: no recomputation for a derivable value`); continue; }
    if (emit) { node.worked = computed[path]; ok++; lines.push(`emit ${path}`); continue; }
    if (node.worked === null || node.worked === undefined) { fail++; lines.push(`FAIL ${path}: worked value missing (author step: --emit)`); continue; }
    if (lower(node.worked) === lower(computed[path])) { ok++; lines.push(`ok   ${path}`); }
    else { fail++; lines.push(`FAIL ${path}: worked ${node.worked} != recomputed ${computed[path]}`); }
  } else if (node.worked !== null && node.worked !== undefined) {
    fail++;
    lines.push(`FAIL ${path}: a build-dependent value carries a worked value without --codehashes (never commit build values into the map)`);
  } else {
    lines.push(`skip ${path}: requires ${node.requires}`);
  }
}
if (emit) writeFileSync(MAP_PATH, JSON.stringify(map, null, 2) + '\n');
console.log(lines.join('\n'));
console.log(fail ? `FAIL: ${fail} problem(s), ${ok} ok` : `PASS ${ok}/${ok} derivable values recomputed from formulas + raw inputs${codehashes ? ' (build-dependent values derived from the supplied codehashes)' : ''}`);
process.exit(fail ? 1 : 0);
