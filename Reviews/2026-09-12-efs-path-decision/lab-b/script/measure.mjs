#!/usr/bin/env node
// Road B lab — matrix measurement. DISPOSABLE LAB, NO PROTOCOL CLAIM.
// DO NOT RUN without the coordinator's heavy-run lease (README.md, TODO.md).
//
// Usage (after `forge build`):
//   node script/measure.mjs --anvil                       # spawns a finite-history Cancun Anvil, deploys, runs, kills
//   node script/measure.mjs --rpc http://127.0.0.1:8545 --deploy
//   node script/measure.mjs --rpc URL --addresses out/lab-addresses.json
// Options: --out <file.json>  --mnemonic "<12 words>"  --skip-without-index
//
// Prints receipt gas per operation for the authorship x selection matrix
// ({native, signed} x {single, two authors under a lens}), the freshness controls
// (contract-fresh-body with a proved pre-absence, contract-existing-body, exact retry),
// the paid consumer reads, the with/without-index-module delta and the interaction term
//   interaction = cost(both) - cost(authorship) - cost(selection) + cost(neither).
// Fresh-slot counts are NOT derived here (no storage tracing): the JSON carries the
// design's ESTIMATED counts, labelled as such.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const ETHERS_CANDIDATES = [
  process.env.EFS_ETHERS_PATH,
  '/Users/james/Code/EFS/planning/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
  '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers',
].filter(Boolean);
const ethersPath = ETHERS_CANDIDATES.find((p) => existsSync(p));
if (!ethersPath) throw new Error('ethers v6 not found; set EFS_ETHERS_PATH to a node_modules/ethers directory');
const { JsonRpcProvider, HDNodeWallet, ContractFactory, Contract, AbiCoder, keccak256, hexlify, toBeHex, zeroPadValue, toUtf8Bytes } =
  require(ethersPath);

const root = fileURLToPath(new URL('..', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? true : all[i + 1]] : [])).filter((x) => x.length));
const MNEMONIC = args.mnemonic || process.env.EFS_LAB_MNEMONIC || 'test test test test test test test test test test test junk';
const WATCHDOG_MS = 20 * 60 * 1000;

// ---------------------------------------------------------------- exact payload controls (run-manifest.md)
const FIX = {
  quote3000: { bytes: zeroPadValue(toBeHex(3000n), 32), keccak: '0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552' },
  quote3100: { bytes: zeroPadValue(toBeHex(3100n), 32), keccak: '0x5a25a1af59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3' },
  file41a: { bytes: hexlify(new Uint8Array(41).fill(0x61)), keccak: '0xe27c263ce61bca70e9ff7d3182fc124c8dcfee2a4656e5c746ceb433a2558911' },
  file41b: { bytes: hexlify(new Uint8Array(41).fill(0x62)), keccak: '0x1882de08a178ebf3827d787e4086d8b2e14a81a8cf3b7b42f2e1458831646f3a' },
};
for (const [label, f] of Object.entries(FIX)) assert.equal(keccak256(f.bytes), f.keccak, `fixture ${label} hash check`);

// ---------------------------------------------------------------- identities (byte-for-byte Keys.sol)
const coder = AbiCoder.defaultAbiCoder();
const DOM = (s) => keccak256(toUtf8Bytes(s));
const ZERO = zeroPadValue('0x00', 32);
const principal = (addr) => zeroPadValue(addr, 32);
const recordId = (typeId, body) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOM('efs2/record/1'), typeId, keccak256(body)]));
const subjectId = (creatorPrincipal, salt) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOM('efs2/subject/1'), creatorPrincipal, salt]));
const position = (p, s, r) => keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM('efs2/position/1'), p, s, r]));
const T = { QUOTE: DOM('lab/type/quote/1'), BINARY: DOM('lab/type/binary/1'), ITEM: DOM('lab/type/item/1'), PAIR: DOM('lab/type/pair/1'), QUOTE_J: DOM('lab/type/quote-joined/1') };
const P = { HEAD: DOM('efs2/purpose/head/1'), FOLDER: DOM('efs2/purpose/folder/1'), TAG: DOM('efs2/purpose/tag/1') };
const name = (s) => keccak256(toUtf8Bytes(s));
const REALM = DOM('lab/realm/1');
const ACTION_T = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
const act = (o) => ({ kind: 0, typeId: ZERO, bodyHashOrRecordId: ZERO, purpose: ZERO, subject: ZERO, role: ZERO, target: ZERO, expectedRevision: 0, salt: ZERO, ...o });
const aCreate = (salt) => act({ kind: 5, salt });
const aPublish = (typeId, body) => act({ kind: 1, typeId, bodyHashOrRecordId: keccak256(body) });
const aBind = (purpose, subject, role, target, rev) => act({ kind: 3, purpose, subject, role, target, expectedRevision: rev });
const aUnbind = (purpose, subject, role, rev) => act({ kind: 4, purpose, subject, role, expectedRevision: rev });
const actionsHash = (actions) => keccak256(coder.encode([ACTION_T], [actions]));

// ---------------------------------------------------------------- chain
async function freePort() {
  const srv = createServer();
  await new Promise((res, rej) => { srv.once('error', rej); srv.listen(0, '127.0.0.1', res); });
  const port = srv.address().port;
  await new Promise((res) => srv.close(res));
  return port;
}
let anvil;
async function startAnvil() {
  const port = await freePort();
  // finite history, no steps tracing, loopback only
  anvil = spawn('anvil', ['--host', '127.0.0.1', '--port', String(port), '--hardfork', 'cancun', '--chain-id', '31337',
    '--gas-limit', '30000000', '--accounts', '4', '--prune-history', '256', '--no-cors', '--quiet',
    '--mnemonic', MNEMONIC], { stdio: 'ignore' });
  const kill = () => { if (anvil && anvil.exitCode === null) anvil.kill('SIGKILL'); };
  process.once('exit', kill);
  process.once('SIGINT', () => { kill(); process.exit(130); });
  setTimeout(() => { console.error('watchdog: 20 minutes elapsed, killing anvil'); kill(); process.exit(124); }, WATCHDOG_MS).unref();
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(500) }); if ((await r.json()).result === '0x7a69') return url; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('anvil did not start');
}
const artifact = (file, nameOf) => JSON.parse(readFileSync(new URL(`../out/${file}.sol/${nameOf}.json`, import.meta.url), 'utf8'));
async function deployAll(provider, deployer) {
  const dep = async (file, nameOf, ...ctor) => {
    const a = artifact(file, nameOf);
    const c = await new ContractFactory(a.abi, a.bytecode.object, deployer).deploy(...ctor);
    await c.waitForDeployment();
    const rc = await provider.getTransactionReceipt(c.deploymentTransaction().hash);
    return { c, gas: rc.gasUsed, runtimeBytes: ((await provider.getCode(await c.getAddress())).length - 2) / 2 };
  };
  const registry = await dep('TypeRegistry', 'TypeRegistry');
  const acceptor = await dep('LabHarness', 'MockAcceptor');
  const ledger = await dep('Ledger', 'Ledger', await registry.c.getAddress(), REALM);
  const index = await dep('IndexModule', 'IndexModule', await ledger.c.getAddress());
  const lens = await dep('LensReader', 'LensReader', await ledger.c.getAddress(), await index.c.getAddress());
  const actorA = await dep('LabHarness', 'Actor', await ledger.c.getAddress());
  const actorB = await dep('LabHarness', 'Actor', await ledger.c.getAddress());
  const consumer = await dep('LabHarness', 'Consumer', await lens.c.getAddress());
  const recon = await dep('LabHarness', 'Reconstructor');
  const setup = [];
  setup.push(await send(provider, ledger.c.setIndexModule(await index.c.getAddress()), 'setup: attach index module'));
  setup.push(await send(provider, registry.c.register(T.QUOTE, await acceptor.c.getAddress(), []), 'setup: register QUOTE'));
  setup.push(await send(provider, registry.c.register(T.BINARY, ZERO.slice(0, 42), []), 'setup: register BINARY'));
  setup.push(await send(provider, registry.c.register(T.ITEM, ZERO.slice(0, 42), []), 'setup: register ITEM'));
  setup.push(await send(provider, registry.c.register(T.PAIR, await acceptor.c.getAddress(), [T.ITEM, T.ITEM]), 'setup: register PAIR'));
  setup.push(await send(provider, registry.c.register(T.QUOTE_J, await acceptor.c.getAddress(), [T.PAIR]), 'setup: register QUOTE_J (one checked Pair ref)'));
  return { registry, acceptor, ledger, index, lens, actorA, actorB, consumer, recon, setup };
}
async function send(provider, txPromise, label, expectFail = false) {
  const tx = await txPromise;
  const rc = await provider.waitForTransaction(tx.hash);
  if (!expectFail) assert.equal(rc.status, 1, `${label}: reverted`);
  else assert.equal(rc.status, 0, `${label}: expected a revert`);
  return { label, gas: rc.gasUsed.toString(), status: rc.status, hash: tx.hash, block: rc.blockNumber };
}
const FAIL_GAS = { gasLimit: 3_000_000n };

// ---------------------------------------------------------------- authors: native (Actor contract) and signed (EOA wallet)
async function signedCall(provider, ledger, wallet, actions, bodies, overrides = {}) {
  const block = await provider.getBlock('latest');
  const intent = {
    realmId: await ledger.realmId(), coreCodeCommitment: await ledger.coreCodeCommitment(), author: wallet.address,
    nonce: await ledger.nonces(wallet.address), deadline: BigInt(block.timestamp + 3600),
    acceptanceProfile: await ledger.acceptanceProfileOf(actions), indexObligations: await ledger.indexObligations(), ...overrides,
  };
  const types = { PublicationIntent: ['realmId:bytes32', 'coreCodeCommitment:bytes32', 'author:address', 'nonce:uint64', 'deadline:uint64', 'acceptanceProfile:bytes32', 'indexObligations:bytes32', 'actionsHash:bytes32'].map((f) => { const [n, t] = f.split(':'); return { name: n, type: t }; }) };
  const sig = await wallet.signTypedData({ name: 'EFS2-RoadB-Lab', version: '1' }, types, { ...intent, actionsHash: actionsHash(actions) });
  return ledger.executeSigned(intent, actions, bodies, sig);
}
function author(kind, who, ledgerWith) {
  // returns { address, run(actions, bodies, overrides) }
  if (kind === 'native') return { address: who.target ?? who.address, kind, run: (actions, bodies, o = {}) => (o.nonce !== undefined ? who.executeWithNonce(actions, bodies, o.nonce, o.tx ?? {}) : who.execute(actions, bodies, o.tx ?? {})) };
  return { address: who.address, kind, run: (actions, bodies, o = {}) => signedCall(ledgerWith.provider, ledgerWith.ledger, who, actions, bodies, o) };
}

// ---------------------------------------------------------------- the matrix
async function runCell(ctx, cellName, fixture, primary, secondary, opts = {}) {
  const { provider, ledger, consumer, lens } = ctx;
  const rows = [];
  const body1 = fixture === 'quote' ? FIX.quote3000.bytes : FIX.file41a.bytes;
  const body2 = fixture === 'quote' ? FIX.quote3100.bytes : FIX.file41b.bytes;
  const typeId = fixture === 'quote' ? T.QUOTE : T.BINARY;
  const salt = keccak256(toUtf8Bytes(`${cellName}/${fixture}`));
  const subj = subjectId(await ledger.principalOf(primary.address), salt); // origin-qualified for contract authors
  const folder = name(`/${cellName}/${fixture}`);
  const nameHash = name('entry');
  const r1 = recordId(typeId, body1); const r2 = recordId(typeId, body2);
  // create = one logical action: subject + record + head + placement
  rows.push(await send(provider, primary.run([aCreate(salt), aPublish(typeId, body1), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], ['0x', body1, '0x', '0x']), `${cellName}/${fixture}/create`));
  // edit = fresh body + CAS head rebind
  rows.push(await send(provider, primary.run([aPublish(typeId, body2), aBind(P.HEAD, subj, ZERO, r2, 1)], [body2, '0x']), `${cellName}/${fixture}/edit`));
  let lensArr = [primary.address];
  if (secondary) {
    // competing author: own head on the shared subject and own placement under the same name
    rows.push(await send(provider, secondary.run([aPublish(typeId, body1), aBind(P.HEAD, subj, ZERO, r1, 0), aBind(P.FOLDER, folder, nameHash, subj, 0)], [body1, '0x', '0x']), `${cellName}/${fixture}/create-competing`));
    lensArr = [primary.address, secondary.address];
  }
  // paid consumer reads (receipt gas, not eth_call)
  if (fixture === 'quote') rows.push(await send(provider, consumer.readQuote(lensArr, P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve`));
  else rows.push(await send(provider, consumer.readHead(lensArr, P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve`));
  if (secondary) rows.push(await send(provider, consumer.readHead([secondary.address, primary.address], P.HEAD, subj, ZERO), `${cellName}/${fixture}/read-resolve-second-first`));
  if (opts.noIndex) return rows; // without the module, list/history are UNKNOWN by construction (not measured as reads)
  rows.push(await send(provider, consumer.readList(lensArr, P.FOLDER, folder, 16), `${cellName}/${fixture}/read-list`));
  rows.push(await send(provider, consumer.readHistory(primary.address, position(P.HEAD, subj, ZERO), 1_000_000), `${cellName}/${fixture}/read-history-asof`));
  // eth_call counterpart (not a paid budget) for the browser row
  const est = await lens.resolve.estimateGas(lensArr, P.HEAD, subj, ZERO);
  rows.push({ label: `${cellName}/${fixture}/eth_call-resolve-estimate`, gas: est.toString(), status: 'estimate' });
  return rows;
}

async function freshnessControls(ctx, actor) {
  const { provider, ledger } = ctx;
  const rows = [];
  const body = zeroPadValue(toBeHex(424242n), 32);
  const id = recordId(T.QUOTE, body);
  const before = await ledger.record(id);
  assert.equal(before[1], 0n, 'pre-absence: the exact Record must not exist yet');
  rows.push({ label: 'pre-absence check', proof: 'eth_call record(id).firstAdmission == 0 at the block before the write', block: await provider.getBlockNumber() });
  rows.push(await send(provider, actor.publish(T.QUOTE, body), 'contract-fresh-body (Actor.publish, proved absent just before)'));
  rows.push(await send(provider, actor.publish(T.QUOTE, body), 'contract-existing-body (same bytes: new occurrence, no new Record)'));
  const actions = [aPublish(T.QUOTE, zeroPadValue(toBeHex(777n), 32))];
  const nonce = await ledger.nonces(await actor.getAddress());
  rows.push(await send(provider, actor.executeWithNonce(actions, [zeroPadValue(toBeHex(777n), 32)], nonce), 'batch under explicit nonce'));
  rows.push(await send(provider, actor.executeWithNonce(actions, [zeroPadValue(toBeHex(777n), 32)], nonce, FAIL_GAS), 'exact-operation retry (reverts AlreadyAdmitted)', true));
  return rows;
}

async function failureRows(ctx, actor) {
  const { provider, acceptor, ledger } = ctx;
  const rows = [];
  const items = [zeroPadValue(toBeHex(1n), 32), zeroPadValue(toBeHex(2n), 32)];
  rows.push(await send(provider, actor.publish(T.ITEM, items[0]), 'ITEM_ETH'));
  rows.push(await send(provider, actor.publish(T.ITEM, items[1]), 'ITEM_USDC'));
  const ids = items.map((b) => recordId(T.ITEM, b));
  const pair = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], ids[1], 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, pair), 'PAIR_ETH_USDC (two checked refs)'));
  const wrong = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], recordId(T.QUOTE, FIX.quote3000.bytes), 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, wrong, FAIL_GAS), 'checked ref: wrong Type (reverts)', true));
  const missing = coder.encode(['bytes32', 'bytes32', 'uint256'], [ids[0], name('nowhere'), 1n]);
  rows.push(await send(provider, actor.publish(T.PAIR, missing, FAIL_GAS), 'checked ref: missing target (reverts)', true));
  rows.push(await send(provider, actor.bind(P.HEAD, name('x'), ZERO, ids[0], 7, FAIL_GAS), 'stale CAS (reverts)', true));
  rows.push(await send(provider, acceptor.set(1, 0), 'setup: acceptor rejects'));
  rows.push(await send(provider, actor.publish(T.QUOTE, zeroPadValue(toBeHex(5n), 32), FAIL_GAS), 'failed acceptance (whole publication reverts)', true));
  rows.push(await send(provider, acceptor.set(0, 0), 'setup: acceptor accepts'));
  return rows;
}

async function main() {
  const t0 = Date.now();
  const rpc = args.anvil ? await startAnvil() : args.rpc || 'http://127.0.0.1:8545';
  const provider = new JsonRpcProvider(rpc, undefined, { staticNetwork: true });
  const wallets = [0, 1, 2, 3].map((i) => HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/60'/0'/0/${i}`).connect(provider));
  const deployer = wallets[0];
  const report = { profile: 'road-b-lab/1', claim: 'disposable lab, no protocol claim', rpc, chainId: (await provider.getNetwork()).chainId.toString(), node: process.version, evm: 'cancun', compiler: '0.8.30 (verify from out/ metadata)', optimizerRuns: 200, viaIR: true, startedAt: new Date(t0).toISOString(), setup: [], cells: {}, controls: [], failures: [], withoutIndex: [], interaction: {}, estimatedFreshSlots: {} };
  let d;
  if (args.addresses) {
    const addrs = JSON.parse(readFileSync(args.addresses, 'utf8'));
    const at = (file, nameOf, addr) => ({ c: new Contract(addr, artifact(file, nameOf).abi, deployer) });
    d = { registry: at('TypeRegistry', 'TypeRegistry', addrs.registry), acceptor: at('LabHarness', 'MockAcceptor', addrs.acceptor), ledger: at('Ledger', 'Ledger', addrs.ledger), index: at('IndexModule', 'IndexModule', addrs.index), lens: at('LensReader', 'LensReader', addrs.lens), actorA: at('LabHarness', 'Actor', addrs.actorA), actorB: at('LabHarness', 'Actor', addrs.actorB), consumer: at('LabHarness', 'Consumer', addrs.consumer), recon: at('LabHarness', 'Reconstructor', addrs.recon), setup: [] };
  } else {
    d = await deployAll(provider, deployer);
    report.deployment = Object.fromEntries(await Promise.all(Object.entries(d).filter(([k]) => k !== 'setup').map(async ([k, v]) => [k, { address: await v.c.getAddress(), gas: v.gas?.toString(), runtimeBytes: v.runtimeBytes }])));
    report.setup = d.setup;
    mkdirSync(new URL('../out/', import.meta.url), { recursive: true });
    writeFileSync(new URL('../out/lab-addresses.json', import.meta.url), JSON.stringify(Object.fromEntries(Object.entries(report.deployment).map(([k, v]) => [k, v.address])), null, 2));
  }
  const ctx = { provider, ledger: d.ledger.c, acceptor: d.acceptor.c, consumer: d.consumer.c, lens: d.lens.c, index: d.index.c };
  const nativeA = author('native', d.actorA.c); nativeA.address = await d.actorA.c.getAddress();
  const nativeB = author('native', d.actorB.c); nativeB.address = await d.actorB.c.getAddress();
  const signedA = author('signed', wallets[1], ctx);
  const signedB = author('signed', wallets[2], ctx);
  const cells = { neither: [nativeA, null], authorship: [signedA, null], selection: [nativeA, nativeB], both: [signedA, signedB] };
  for (const fixture of ['quote', 'binary']) for (const [cell, [p, s]] of Object.entries(cells)) report.cells[`${cell}/${fixture}`] = await runCell(ctx, cell, fixture, p, s);
  report.controls = await freshnessControls(ctx, d.actorA.c);
  report.failures = await failureRows(ctx, d.actorA.c);
  const rec = await d.recon.c.reconstruct(await d.ledger.c.getAddress(), 1n);
  report.reconstruction = { publication: 1, matches: rec[4], recovered: rec[3] };
  if (!args['skip-without-index']) {
    await send(provider, d.ledger.c.setIndexModule(ZERO.slice(0, 42)), 'setup: detach index module');
    report.withoutIndex = await runCell(ctx, 'neither-noindex', 'quote', nativeA, null, { noIndex: true });
    await send(provider, d.ledger.c.setIndexModule(await d.index.c.getAddress()), 'setup: re-attach index module (coverage is now PARTIAL: gapped)');
  }
  for (const fixture of ['quote', 'binary']) for (const op of ['create', 'edit', 'read-resolve', 'read-list']) {
    const g = (cell) => BigInt(report.cells[`${cell}/${fixture}`].find((r) => r.label.endsWith(`/${op}`))?.gas ?? 0);
    report.interaction[`${fixture}/${op}`] = { neither: g('neither').toString(), authorship: g('authorship').toString(), selection: g('selection').toString(), both: g('both').toString(), interaction: (g('both') - g('authorship') - g('selection') + g('neither')).toString() };
  }
  report.estimatedFreshSlots = { label: 'ESTIMATED from the design table, not traced', 'create (native, 4 actions)': '5 evidence + 1 pubId + 2..3 record + 1 subject + 4..6 admission + 2x(2 head + 1 bindingPosition + 3 positionCell) + index appends', 'create (signed)': 'as native + 2 (r, s)', 'edit': '3 record + 2..3 admission + head rewrite + index appends' };
  report.finishedAt = new Date().toISOString();
  report.caveats = ['Local Anvil receipts under the lab profile; not an L2 fee quote and not an equivalent-guarantee comparison until the coordinator\'s fixture map is applied.', 'Fresh-slot counts are estimates; no storage tracing was run.', 'Cold access sets per transaction; already-initialized lists where the label says so.'];
  const text = Object.entries(report.cells).flatMap(([cell, rows]) => rows.map((r) => `${cell.padEnd(20)} ${r.label.padEnd(60)} ${String(r.gas).padStart(10)} ${r.status}`)).join('\n');
  console.log(text);
  console.log(JSON.stringify(report.interaction, null, 2));
  if (args.out) writeFileSync(args.out, JSON.stringify(report, null, 2) + '\n');
  else console.log(JSON.stringify(report, null, 2));
  if (anvil) anvil.kill('SIGKILL');
}
main().catch((e) => { console.error(e); if (anvil) anvil.kill('SIGKILL'); process.exit(1); });
