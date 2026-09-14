#!/usr/bin/env node
// DISPOSABLE LAB. Root-owned launch only. No compilation, installation or external RPC.
// Usage: EFS_ETHERS_PATH=... FOUNDRY_OUT=... EFS_LAB_SCRATCH=... 
// EFS_ARCHIVE_COMPILER_INPUT=<exact build-info or standard-JSON input> 
// node script/measure-portable-archive.mjs --anvil --out /tmp/<owned-run>/archive.json
// Summary is only an index into the raw sidecar. Root must independently check it.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, realpathSync, statSync, statfsSync,
    existsSync, mkdtempSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';

const ACTION = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)';
const INTENT = 'tuple(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations)';
const TYPE = 'PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)';
const CHECKS = ['sameDigest', 'sameActionHash', 'sameHeader', 'samePostings', 'blobExactBytes', 'completeTransactions'];
const SIZES = [1, 2, 64];
const CANDIDATES = ['packed', 'codeblob'];
const TIMESTAMP = 1_800_000_100;
const MNEMONIC = 'test test test test test test test test test test test junk';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n';
const qty = value => '0x' + BigInt(value).toString(16);
const lower = value => value === null ? null : value.toLowerCase();
const isTmp = path => path.startsWith('/tmp/') || path.startsWith('/private/tmp/');
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

export function parseArgs(argv) {
    assert(argv.length === 3 && argv[0] === '--anvil' && argv[1] === '--out',
        'arguments: only --anvil --out <absolute temporary file> permitted');
    assert(isAbsolute(argv[2]) && isTmp(resolve(argv[2])), 'output must be an absolute temporary path');
    return { out: resolve(argv[2]) };
}

export async function snapshotBranches(rpc, visit) {
    let snapshot = await rpc('evm_snapshot', []);
    assert(typeof snapshot === 'string' && /^0x[0-9a-f]+$/i.test(snapshot), 'snapshot failed');
    for (const n of SIZES) for (const candidate of CANDIDATES) {
        const id = `${n}/${candidate}`;
        assert.equal(await rpc('evm_revert', [snapshot], id), true, 'revert failed');
        const previousSnapshot = snapshot;
        snapshot = await rpc('evm_snapshot', [], id);
        assert(typeof snapshot === 'string' && /^0x[0-9a-f]+$/i.test(snapshot), 'snapshot failed');
        await visit({ id, n, candidate, previousSnapshot, snapshot, timestamp: TIMESTAMP });
    }
}

export function chooseRepresentation(cells, checks) {
    if (!CHECKS.every(key => checks[key] === true)) return 'UNMEASURED';
    for (const n of SIZES) for (const candidate of CANDIDATES) {
        const c = cells[n]?.[candidate];
        if (!c || !/^[1-9][0-9]*$/.test(c.retainGas) || !Array.isArray(c.actionAtPaidGas) ||
            c.actionAtPaidGas.length !== 2 || !c.actionAtPaidGas.every(g => /^[1-9][0-9]*$/.test(g))) return 'UNMEASURED';
        if (candidate === 'codeblob' && c.blobRuntimeBytes !== 65 + 288 * n) return 'UNMEASURED';
    }
    return [2,64].every(n => BigInt(cells[n].codeblob.retainGas) < BigInt(cells[n].packed.retainGas)) ? 'codeblob' : 'packed';
}

function domain(e) {
    return e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],
        [e.id('EIP712Domain(string name,string version)'), e.id('EFS2-RoadB-Lab'), e.id('1')]));
}

export function createFixtures(e) {
    const coder = e.AbiCoder.defaultAbiCoder();
    const author = new e.Wallet(e.toBeHex(0xA11CE, 32));
    return SIZES.map(n => {
        const actions = Array.from({ length: n }, (_, i) => ({ kind: 1, typeId: e.id('archive/measure/type/1'),
            bodyHashOrRecordId: e.id(`archive-body-${n}-${i}`), purpose: e.ZeroHash, subject: e.ZeroHash,
            role: e.ZeroHash, target: e.ZeroHash, expectedRevision: 0, salt: e.ZeroHash }));
        const intent = { realmId: e.id('archive/measure/realm/1'), coreCodeCommitment: e.id('archive/measure/core/1'),
            author: author.address, nonce: n, deadline: 1, acceptanceProfile: e.id('archive/measure/acceptance/1'),
            indexObligations: e.id('archive/measure/index/1') };
        const encodedActions = coder.encode([ACTION + '[]'], [actions]);
        const actionsHash = e.keccak256(encodedActions);
        const structHash = e.keccak256(coder.encode(['bytes32', INTENT, 'bytes32'], [e.id(TYPE), intent, actionsHash]));
        const digest = e.keccak256(e.concat(['0x1901', domain(e), structHash]));
        const signature = author.signingKey.sign(digest).serialized;
        assert.equal(e.recoverAddress(digest, signature), author.address);
        return { n, intent, actions, encodedActions, actionsHash, digest, signature, bodies: [] };
    });
}

export function verifyTransaction(e, entry) {
    const { rawTransaction, hash, expected, transaction: tx, receipt: r, block: b } = entry;
    const decoded = e.Transaction.from(rawTransaction);
    assert.equal(e.keccak256(rawTransaction), hash);
    assert.equal(decoded.hash, hash);
    assert.equal(tx.hash, hash);
    assert.equal(r.transactionHash, hash);
    for (const field of ['from', 'to']) {
        assert.equal(lower(decoded[field]), lower(expected[field]));
        assert.equal(lower(tx[field]), lower(expected[field]));
        assert.equal(lower(r[field]), lower(expected[field]));
    }
    for (const field of ['nonce', 'value', 'chainId']) {
        assert.equal(BigInt(decoded[field]), BigInt(expected[field]));
        assert.equal(BigInt(tx[field]), BigInt(expected[field]));
    }
    assert.equal(lower(decoded.data), lower(expected.data));
    assert.equal(lower(tx.input), lower(expected.data));
    assert.equal(BigInt(r.status), 1n, 'failed receipt');
    assert(BigInt(r.gasUsed) > 0n);
    assert.equal(r.blockHash, b.hash);
    assert.equal(tx.blockHash, b.hash);
    assert.equal(r.blockNumber, b.number);
    assert.equal(tx.blockNumber, b.number);
    assert.equal(tx.transactionIndex, r.transactionIndex);
    assert.equal(b.transactions[Number(BigInt(r.transactionIndex))], hash);
    for (const log of r.logs) {
        assert.equal(log.transactionHash, hash);
        assert.equal(log.blockHash, b.hash);
        assert.equal(log.blockNumber, b.number);
        assert.equal(log.transactionIndex, r.transactionIndex);
        assert.notEqual(log.removed, true);
    }
    return true;
}

function filesBelow(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(d => {
        const p = join(dir, d.name);
        assert(!d.isSymbolicLink(), `symlink not allowed in source/scratch: ${p}`);
        return d.isDirectory() ? filesBelow(p) : [p];
    });
}

function resourceCheck(scratch) {
    const fs = statfsSync(scratch, { bigint: true });
    const free = fs.bavail * fs.bsize;
    const used = filesBelow(scratch).reduce((sum, p) => sum + BigInt(statSync(p).size), 0n);
    assert(free >= 50n * 1024n ** 3n, '50 GiB reserve required');
    assert(used <= 15n * 1024n ** 3n, '15 GiB scratch cap exceeded');
    return { freeBytes: free.toString(), scratchBytes: used.toString() };
}

function captureBuild(e, lab, artifactDir, inputPath) {
    const inputBytes = readFileSync(inputPath);
    const envelope = JSON.parse(inputBytes);
    const input = envelope.input ?? envelope;
    assert.equal(input.language, 'Solidity');
    assert.equal(input.settings.viaIR, true);
    assert.equal(input.settings.optimizer.enabled, true);
    assert.equal(input.settings.optimizer.runs, 200);
    assert.equal(input.settings.evmVersion, 'cancun');
    const sources = {};
    for (const [key, value] of Object.entries(input.sources)) {
        const path = resolve(lab, key);
        assert(path.startsWith(lab + '/') && typeof value.content === 'string', 'compiler source must map to this lab');
        const actual = readFileSync(path);
        assert.equal(actual.toString('utf8'), value.content, `compiler source drift: ${key}`);
        sources[key] = { sha256: sha(actual), keccak256: e.keccak256(actual), bytes: actual.length };
    }
    const artifacts = {};
    for (const [name, file, contract] of [
        ['packed', 'SignedClaimArchive.sol', 'SignedClaimArchivePacked'],
        ['codeblob', 'SignedClaimArchive.sol', 'SignedClaimArchiveCodeBlob'],
        ['consumer', 'ArchiveReadConsumer.sol', 'ArchiveReadConsumer']]) {
        const path = join(artifactDir, file, contract + '.json');
        const bytes = readFileSync(path), a = JSON.parse(bytes);
        const metadata = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
        assert(metadata.compiler.version.startsWith('0.8.30+'), 'compiler version must be 0.8.30');
        if (envelope.solcVersion) assert.equal(envelope.solcVersion, '0.8.30');
        for (const [key, source] of Object.entries(metadata.sources)) assert.equal(sources[key]?.keccak256, source.keccak256, `artifact source mismatch: ${key}`);
        assert.equal(metadata.settings.viaIR, true);
        assert.equal(metadata.settings.optimizer.runs, 200);
        assert.equal(metadata.settings.evmVersion, 'cancun');
        assert(/^0x[0-9a-f]+$/i.test(a.bytecode.object), 'unlinked or empty creation bytecode');
        const compiled = envelope.output?.contracts?.[name === 'consumer' ? 'test/ArchiveReadConsumer.sol' : 'src/SignedClaimArchive.sol']?.[contract];
        if (envelope.output) {
            assert(compiled, `build-info output absent for ${contract}`);
            assert.equal('0x' + compiled.evm.bytecode.object, a.bytecode.object, 'artifact not from captured compiler output');
            assert.equal('0x' + compiled.evm.deployedBytecode.object, a.deployedBytecode.object);
        }
        artifacts[name] = { path, sha256: sha(bytes), abi: a.abi, creation: a.bytecode.object,
            runtime: a.deployedBytecode.object, immutableReferences: a.deployedBytecode.immutableReferences ?? {}, metadata };
    }
    return { compilerInputFile: inputPath, compilerInputFileSha256: sha(inputBytes), input,
        compilerVersion: envelope.solcVersion ?? '0.8.30', compilerLongVersion: envelope.solcLongVersion ?? null,
        sources, artifacts };
}

function captureSources(lab) {
    const git = args => execFileSync('git', args, { cwd: lab, encoding: 'utf8', timeout: 10_000, maxBuffer: 16 * 1024 * 1024 });
    const files = [join(lab, 'foundry.toml'), ...['src','test','script'].flatMap(d => filesBelow(join(lab, d)))];
    const inventory = Object.fromEntries(files.filter(p => /\.(sol|mjs|toml)$/.test(p)).sort().map(p => {
        const bytes = readFileSync(p); return [relative(lab, p), { sha256: sha(bytes), bytes: bytes.length }];
    }));
    return { commit: git(['rev-parse','HEAD']).trim(), dirtyDiffSha256: sha(git(['diff','--binary','HEAD'])),
        dirtyAndNewInventory: git(['status','--porcelain=v1','--untracked-files=all']), inventory };
}

async function freePort() {
    const server = createServer();
    await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
    const port = server.address().port;
    await new Promise(ok => server.close(ok));
    return port;
}

function patchedRuntime(e, artifact) {
    const bytes = e.getBytes(artifact.runtime);
    for (const refs of Object.values(artifact.immutableReferences)) for (const ref of refs) {
        assert.equal(ref.length, 32, 'unexpected immutable shape');
        bytes.set(e.getBytes(domain(e)), ref.start);
    }
    return e.hexlify(bytes);
}

export async function main(argv = process.argv.slice(2)) {
    const options = parseArgs(argv);
    const lab = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
    for (const key of ['EFS_ETHERS_PATH','FOUNDRY_OUT','EFS_LAB_SCRATCH','EFS_ARCHIVE_COMPILER_INPUT']) assert(process.env[key], `${key} required; no install/build fallback`);
    const scratch = realpathSync(process.env.EFS_LAB_SCRATCH);
    assert(isTmp(scratch) && scratch !== '/private/tmp' && scratch !== '/tmp', 'scratch must be a specific owned temporary directory');
    const outputParent = realpathSync(dirname(options.out));
    assert(outputParent === scratch || outputParent.startsWith(scratch + '/'), 'output must stay in owned scratch');
    const out = join(outputParent, options.out.split('/').at(-1));
    const rawPath = out + '.raw.json';
    assert(!existsSync(out) && !existsSync(rawPath), 'refuse to overwrite existing evidence');
    const e = createRequire(import.meta.url)(realpathSync(process.env.EFS_ETHERS_PATH));
    assert(e.version.startsWith('6.'), 'ethers v6 required');
    const artifactDir = realpathSync(process.env.FOUNDRY_OUT);
    assert(artifactDir.startsWith(scratch + '/'), 'artifacts must live in the owned scratch');
    const build = captureBuild(e, lab, artifactDir, realpathSync(process.env.EFS_ARCHIVE_COMPILER_INPUT));
    const source = captureSources(lab);
    const fixtures = createFixtures(e); // freeze every signed workload before any transaction or chain starts
    const deployer = e.HDNodeWallet.fromPhrase(MNEMONIC, undefined, "m/44'/60'/0'/0/0");
    const importer = e.HDNodeWallet.fromPhrase(MNEMONIC, undefined, "m/44'/60'/0'/0/1");
    assert.notEqual(importer.address, fixtures[0].intent.author);
    fixtures.forEach(f => { f.caller = importer.address; });
    const packet = { schema: 'efs-lab-b/archive-representation/1', evidenceLevel: 'OWNED_LOCAL_RPC_OBSERVATION',
        status: 'UNMEASURED', startedAt: new Date().toISOString(), source, build, fixtures, rpc: [], transactions: [],
        branches: [], deployments: {}, resources: resourceCheck(scratch), chain: {}, runtime: { node: process.version, ethers: e.version } };
    const summary = { evidenceLevel: packet.evidenceLevel, status: 'UNMEASURED', alias: 'packed', source,
        build: { solc: '0.8.30', viaIR: true, optimizerRuns: 200, evm: 'cancun' }, deployments: {}, cells: {}, checks: {}, rawSidecar: rawPath };
    const runDir = mkdtempSync(join(scratch, 'archive-chain-'));
    const logFd = openSync(join(runDir, 'anvil.log'), 'wx');
    let child, childClosed, closed = false, activeBranch = 'setup', rpcId = 0, watchdog;
    const abort = new AbortController();
    const stop = () => { if (child && !closed) child.kill('SIGKILL'); };
    const signal = () => { abort.abort(Error('run interrupted')); stop(); };
    process.once('SIGINT', signal); process.once('SIGTERM', signal);
    process.once('exit', stop);
    try {
        const port = await freePort();
        const args = ['--host','127.0.0.1','--port',String(port),'--hardfork','cancun','--chain-id','31337',
            '--gas-limit','30000000','--accounts','2','--prune-history','128','--cache-path',join(runDir,'cache'),
            '--timestamp','1800000000','--no-cors','--quiet','--mnemonic',MNEMONIC];
        child = spawn('anvil', args, { stdio: ['ignore',logFd,logFd] });
        childClosed = new Promise(ok => { child.once('error', error => { packet.chain.spawnError = error.message; }); child.once('close', (code, sig) => { closed = true; packet.chain.exitCode = code; packet.chain.exitSignal = sig; ok(); }); });
        packet.chain = { pid: child.pid, args, runDir, port };
        watchdog = setTimeout(() => { abort.abort(Error('five-minute watchdog expired')); stop(); }, 300_000);
        const url = `http://127.0.0.1:${port}`;
        const rpc = async (method, params, branch = activeBranch) => {
            abort.signal.throwIfAborted();
            const request = { jsonrpc: '2.0', id: ++rpcId, method, params };
            const observation = { branch, request };
            packet.rpc.push(observation);
            try {
                const response = await fetch(url, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(request),
                    signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)]) });
                assert(response.ok, `RPC HTTP ${response.status}`);
                const bytes = await response.text(); assert(bytes.length <= 2_000_000, 'RPC response bound exceeded');
                observation.response = JSON.parse(bytes);
                assert.equal(observation.response.id, request.id); assert.equal(observation.response.jsonrpc, '2.0');
                assert(!observation.response.error, json(observation.response.error));
                assert(Object.hasOwn(observation.response, 'result'), 'RPC missing result');
                return observation.response.result;
            } catch (error) { observation.failure = error.message; throw error; }
        };
        let ready = false;
        for (let i = 0; i < 100; ++i) {
            assert(!closed && !packet.chain.spawnError, 'owned Anvil failed to start');
            try { assert.equal(await rpc('eth_chainId', []), '0x7a69'); ready = true; break; } catch { abort.signal.throwIfAborted(); await sleep(50); }
        }
        assert(ready, 'owned Anvil startup timeout');
        const coder = e.AbiCoder.defaultAbiCoder();
        const interfaces = Object.fromEntries(Object.entries(build.artifacts).map(([name, a]) => [name, new e.Interface(a.abi)]));
        const addresses = {};
        const seenHashes = new Set();
        const send = async (label, wallet, to, data, gasLimit) => {
            const nonce = Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'latest'])));
            const expected = { from: wallet.address, to, nonce, data, value: '0', chainId: '31337' };
            const rawTransaction = await wallet.signTransaction({ to, nonce, data, value: 0, chainId:31337, type:0, gasPrice:2_000_000_000n, gasLimit });
            const hash = e.keccak256(rawTransaction);
            assert(!seenHashes.has(hash), 'duplicate transaction inventory'); seenHashes.add(hash);
            const entry = { branch: activeBranch, label, expected, rawTransaction, hash };
            packet.transactions.push(entry);
            assert.equal(await rpc('eth_sendRawTransaction',[rawTransaction]), hash);
            for (let i = 0; i < 100; ++i) {
                entry.receipt = await rpc('eth_getTransactionReceipt',[hash]);
                if (entry.receipt) break;
                await sleep(50);
            }
            assert(entry.receipt, 'missing receipt');
            entry.transaction = await rpc('eth_getTransactionByHash',[hash]);
            entry.block = await rpc('eth_getBlockByHash',[entry.receipt.blockHash,false]);
            assert(entry.transaction && entry.block, 'missing transaction or block header');
            verifyTransaction(e, entry);
            return entry;
        };
        const codeAt = async (address, block) => {
            const basis = { blockHash: block.hash, requireCanonical:true };
            const code = await rpc('eth_getCode',[address,basis]);
            assert(/^0x[0-9a-f]+$/i.test(code), 'missing runtime code');
            return { address, blockHash:block.hash, blockNumber:block.number, code, codehash:e.keccak256(code), runtimeBytes:e.getBytes(code).length };
        };
        for (const name of ['packed','codeblob','consumer']) {
            const tx = await send(`deploy/${name}`, deployer, null, build.artifacts[name].creation, 15_000_000n);
            const address = e.getCreateAddress({ from:deployer.address, nonce:tx.expected.nonce });
            assert.equal(lower(tx.receipt.contractAddress), lower(address)); addresses[name] = address;
            const runtime = await codeAt(address, tx.block);
            assert.equal(runtime.code, patchedRuntime(e, build.artifacts[name]), 'deployed runtime differs from compiler artifact');
            assert(runtime.runtimeBytes <= 24_576, 'EIP-170 runtime bound');
            packet.deployments[name] = { transactionHash:tx.hash, ...runtime };
            summary.deployments[name] = { gasUsed:BigInt(tx.receipt.gasUsed).toString(), runtimeBytes:runtime.runtimeBytes, codehash:runtime.codehash, transactionHash:tx.hash };
        }
        const baseline = await rpc('eth_getBlockByNumber',['latest',false]);
        packet.baseline = baseline;
        await snapshotBranches(rpc, async branch => {
            activeBranch = branch.id;
            packet.branches.push(branch);
            branch.baseline = await rpc('eth_getBlockByNumber',['latest',false]);
            assert.equal(branch.baseline.hash, baseline.hash, 'snapshot does not restore identical post-deployment state');
            const f = fixtures.find(x => x.n === branch.n), iface = interfaces[branch.candidate], address = addresses[branch.candidate];
            await rpc('evm_setNextBlockTimestamp',[branch.timestamp]);
            const retained = await send('retain', importer, address, iface.encodeFunctionData('retainSignedClaim',[f.intent,f.actions,f.signature,[]]),15_000_000n);
            assert.equal(Number(BigInt(retained.block.timestamp)), branch.timestamp);
            branch.retentionHash = retained.hash;
            branch.retentionBasis = { blockHash:retained.block.hash, blockNumber:retained.block.number };
            const logs = retained.receipt.logs.filter(l => lower(l.address) === lower(address));
            assert.equal(logs.length, 1, 'exactly one archive retention event');
            const event = iface.parseLog(logs[0]);
            assert.equal(event.name, 'ClaimRetained'); assert.equal(event.args.claimId, f.digest); assert.equal(Number(event.args.leafCount), branch.n);
            const location = event.args.vectorLocation;
            branch.vectorLocation = location;
            branch.runtime = {};
            for (const name of ['packed','codeblob','consumer']) {
                branch.runtime[name] = await codeAt(addresses[name], retained.block);
                assert.equal(branch.runtime[name].code, packet.deployments[name].code, 'archive/consumer code changed');
            }
            if (branch.candidate === 'codeblob') {
                branch.blob = await codeAt(location, retained.block);
                assert.equal(branch.blob.code, '0x00' + f.encodedActions.slice(2));
                assert.equal(branch.blob.runtimeBytes, 65 + 288 * branch.n);
            } else assert.equal(location, e.ZeroAddress);
            branch.calls = [];
            const observe = async (fn, args) => {
                const calldata = iface.encodeFunctionData(fn,args);
                const basis = { blockHash:retained.block.hash, requireCanonical:true };
                const returnData = await rpc('eth_call',[{ to:address, data:calldata },basis]);
                branch.calls.push({ fn,args,to:address,calldata,returnData,...branch.retentionBasis });
                return returnData;
            };
            const claim = await observe('claim',[f.digest]);
            const sig = e.Signature.from(f.signature);
            const expectedHeader = coder.encode([INTENT,'bytes32','uint16','bytes32','bytes32','uint8','uint64','uint8','address','uint64'],
                [f.intent,f.actionsHash,branch.n,sig.r,sig.s,sig.v,0,1,importer.address,branch.timestamp]);
            assert.equal(claim, expectedHeader, 'raw claim header differs from signed fixture');
            const rebuilt = [];
            for (let leaf = 0; leaf < branch.n; ++leaf) {
                const raw = await observe('actionAt',[f.digest,leaf]);
                assert.equal(raw, coder.encode([ACTION],[f.actions[leaf]]));
                rebuilt.push(coder.decode([ACTION],raw)[0]);
                const recordId = e.keccak256(coder.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),f.actions[leaf].typeId,f.actions[leaf].bodyHashOrRecordId]));
                assert.equal(await observe('signedRecordClaimCount',[recordId]), coder.encode(['uint64'],[1]));
                assert.equal(await observe('signedRecordClaimAt',[recordId,0]), coder.encode(['bytes32','uint16'],[f.digest,leaf]));
                assert.equal(await observe('selectedRecord',[f.digest,leaf]), coder.encode(['bytes32','bytes32','bool','bytes'],[recordId,f.actions[leaf].typeId,false,'0x']));
            }
            assert.equal(e.keccak256(coder.encode([ACTION + '[]'],[rebuilt])), f.actionsHash);
            branch.paidReads = [];
            for (const [index,leaf] of [0,branch.n-1].entries()) {
                await rpc('evm_setNextBlockTimestamp',[branch.timestamp+index+1]);
                const tx = await send(`read/${index}/${leaf}`, importer, addresses.consumer,
                    interfaces.consumer.encodeFunctionData('readAction',[address,f.digest,leaf]),1_000_000n);
                assert.equal(tx.receipt.logs.length, 1, 'one paid-read event');
                assert.equal(lower(tx.receipt.logs[0].address), lower(addresses.consumer));
                const event = interfaces.consumer.parseLog(tx.receipt.logs[0]);
                assert.equal(event.name,'ActionRead'); assert.equal(event.args.claimId,f.digest); assert.equal(Number(event.args.leaf),leaf);
                assert.equal(event.args.actionHash,e.keccak256(coder.encode([ACTION],[f.actions[leaf]])));
                branch.paidReads.push({ leaf,transactionHash:tx.hash,blockHash:tx.block.hash,gasUsed:BigInt(tx.receipt.gasUsed).toString() });
            }
            summary.cells[branch.n] ??= {};
            summary.cells[branch.n][branch.candidate] = { retainGas:BigInt(retained.receipt.gasUsed).toString(),
                retentionHash:retained.hash, actionAtPaidGas:branch.paidReads.map(r => r.gasUsed),
                paidReadHashes:branch.paidReads.map(r => r.transactionHash), ...(branch.blob ? { blobRuntimeBytes:branch.blob.runtimeBytes,blobCodehash:branch.blob.codehash } : {}) };
            resourceCheck(scratch);
        });
        assert.equal(packet.transactions.length,21); assert.equal(seenHashes.size,21);
        assert.equal(packet.transactions.filter(t => t.label.startsWith('deploy/')).length,3);
        assert.equal(packet.transactions.filter(t => t.label === 'retain').length,6);
        assert.equal(packet.transactions.filter(t => t.label.startsWith('read/')).length,12);
        assert.deepEqual(captureSources(lab),source,'source changed during owned run');
        summary.checks = Object.fromEntries(CHECKS.map(key => [key,true]));
        summary.candidateRecommendation = chooseRepresentation(summary.cells,summary.checks);
        assert.notEqual(summary.candidateRecommendation,'UNMEASURED');
        packet.status = summary.status = 'CANDIDATE_CHECKED_AWAITING_INDEPENDENT_REVIEW';
    } catch (error) {
        packet.failure = { message:error.message,stack:error.stack }; summary.failure = error.message;
        summary.candidateRecommendation = 'UNMEASURED'; process.exitCode = 1;
    } finally {
        clearTimeout(watchdog); stop();
        if (childClosed) await childClosed;
        packet.chain.stopped = !child || closed;
        closeSync(logFd);
        process.removeListener('SIGINT',signal); process.removeListener('SIGTERM',signal); process.removeListener('exit',stop);
        packet.finishedAt = new Date().toISOString();
        const raw = json(packet); assert(Buffer.byteLength(raw) < 64 * 1024 * 1024,'raw sidecar exceeds 64 MiB bound');
        writeFileSync(rawPath,raw,{ flag:'wx' });
        summary.rawSidecarSha256 = sha(raw);
        summary.chainStopped = packet.chain.stopped;
        writeFileSync(out,json(summary),{ flag:'wx' });
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
