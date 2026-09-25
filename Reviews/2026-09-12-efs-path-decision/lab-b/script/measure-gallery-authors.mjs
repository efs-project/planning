/** Bounded disposable multi-author gallery measurement; never a public-RPC SLA. */
import assert from 'node:assert/strict';
import {readFile, readdir, stat, writeFile} from 'node:fs/promises';
import {execFileSync, spawn} from 'node:child_process';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEnvironment} from './compact-environment.mjs';
import {sourcePins} from './measure-joined.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

function placementPlan(count) {
  assert(Number.isInteger(count) && count > 0 && count <= 1000);
  const counts = Array.from({length: 8}, () => 0);
  for (let i = 0; i < count; i++) counts[i % 8]++;
  return {counts, overlayIndex: 0, overlayAuthor: 1};
}
const expectedTagged = count => Math.ceil(count / 2);
const lab = fileURLToPath(new URL('../', import.meta.url));
const cap = Object.freeze({wallMs: 900_000, nodeRss: 768 * 2**20, anvilRss: 1536 * 2**20,
  outputBytes: 256 * 2**20, transactions: 650, files: 1000, paidCandidates: 50, gasLimit: 16_777_216n});
const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? String(v) : v, 2);
const metricsDelta = (after, before) => Object.fromEntries(
  ['calls', 'httpRequests', 'httpBatches', 'requestBytes', 'responseBytes'].map(k => [k, after[k] - before[k]]));
const memory = () => Object.fromEntries(Object.entries(process.memoryUsage())
  .filter(([key]) => ['rss', 'heapUsed', 'heapTotal', 'external', 'arrayBuffers'].includes(key)));
async function directoryBytes(path) {
  let bytes = 0;
  for (const item of await readdir(path, {withFileTypes: true})) {
    const child = join(path, item.name);
    bytes += item.isDirectory() ? await directoryBytes(child) : (await stat(child)).size;
  }
  return bytes;
}

/** A single fixture grows from 100 to 1000 Files; the two folders share those IDs. */
export async function measureGalleryAuthors({environment = createEnvironment, firstPageOnly = false,
  rssDiscriminator = false, fullChild1000 = false} = {}) {
  assert([firstPageOnly, rssDiscriminator, fullChild1000].filter(Boolean).length <= 1,
    'one bounded mode at a time');
  const started = Date.now();
  const env = await environment({protocol: 'compact-guarded-v2', filesProfile: 'typed-directory-v1',
    contentProfile: 'raw-sha256-aesgcm-v2', evidenceMode: 'append', benchmarkHistory: true});
  const {ethers: e, manifest, wallets} = env, coder = e.AbiCoder.defaultAbiCoder(), Z = e.ZeroHash;
  const report = {status: 'RUNNING', fixture: 'actual-multi-author-gallery',
    mode: fullChild1000 ? 'fresh-1000-eight-author-child-full-cold'
      : rssDiscriminator ? 'fresh-250-child-rss-discriminator'
      : firstPageOnly ? 'fresh-1000-eight-author-first-page-only' : 'full-100-250-stop-go', runDirectory: env.dir,
    safety: {...cap, gasLimit: String(cap.gasLimit)}, history: env.historyPolicy, stages: [], checkpoints: [],
    sources: null, seedProjections: [],
    limits: ['Disposable loopback-only Anvil; no public-RPC latency or fee inference.',
      'A successful paid page is not proof that one onchain transaction can consume the whole gallery.',
      'Paid cursor advancement is supplied from an eth_call to the same pinned reader; FilesPagePaid emits only a digest.',
      'Header qualification does not fetch or verify full content bodies.']};
  const reportName = fullChild1000 ? 'gallery-authors-child-full-1000.json'
    : rssDiscriminator ? 'gallery-authors-child-rss-250.json'
    : firstPageOnly ? 'gallery-authors-first-page-1000.json' : 'gallery-authors-measurement.json';
  const persist = () => writeFile(join(env.dir, reportName), json(report));
  let abortTimer;
  const checkpoint = async (phase, n) => {
    const anvilRss = Number(execFileSync('ps', ['-o', 'rss=', '-p', String(env.anvilPid)], {encoding: 'utf8'}).trim()) * 1024;
    const row = {phase, n, elapsedMs: Date.now() - started, nodeRss: process.memoryUsage().rss,
      nodePeakRss: process.resourceUsage().maxRSS * 1024, anvilRss, outputBytes: await directoryBytes(env.dir),
      transactions: env.transactions.length};
    report.checkpoints.push(row);
    let projectedNodeRss;
    if ((firstPageOnly || fullChild1000) && phase === 'seed-one' && n % 100 === 0) {
      const baseline = report.checkpoints.find(entry => entry.phase === 'deployed');
      projectedNodeRss = baseline.nodeRss + (row.nodeRss - baseline.nodeRss) * 1000 / n;
      report.seedProjections.push({files: n, projectedNodeRss, baselineNodeRss: baseline.nodeRss});
    }
    await persist(); console.log('GALLERY_CHECKPOINT ' + JSON.stringify(row));
    assert(row.elapsedMs <= cap.wallMs && row.nodeRss <= cap.nodeRss && row.nodePeakRss <= cap.nodeRss
      && row.anvilRss <= cap.anvilRss
      && row.outputBytes <= cap.outputBytes && row.transactions <= cap.transactions, 'RUN_SAFETY_STOP');
    if (projectedNodeRss !== undefined) assert(projectedNodeRss <= cap.nodeRss, 'UNSAFE_1000_SEED_RSS_TREND');
    return row;
  };
  try {
    abortTimer = setTimeout(() => {void env.close();}, Math.max(1, cap.wallMs - (Date.now() - started)));
    report.sources = {...await sourcePins(env), measurementScriptHash: e.keccak256(
      await readFile(join(lab, 'script/measure-gallery-authors.mjs')))};
    if (rssDiscriminator || fullChild1000) report.sources.rssChildScriptHash = e.keccak256(
      await readFile(join(lab, 'script/measure-gallery-authors-child.mjs')));
    if (!rssDiscriminator && !fullChild1000) await env.deploy('pagePaid', 'FilesPageReader.sol', 'FilesPagePaid');
    const hash = (types, values) => e.keccak256(coder.encode(types, values));
    const subject = (who, salt) => hash(['bytes32', 'bytes32', 'bytes32'],
      [e.id('efs2/subject/1'), e.zeroPadValue(wallets[who].address, 32), salt]);
    const record = (type, body) => hash(['bytes32', 'bytes32', 'bytes32'],
      [e.id('efs2/record/1'), type, e.keccak256(body)]);
    const purpose = Object.fromEntries(['folder', 'head', 'tag'].map(k => [k, e.id(`efs2/purpose/${k}/1`)]));
    const base = {kind: 0, typeId: Z, bodyHashOrRecordId: Z, purpose: Z, subject: Z, role: Z,
      target: Z, expectedRevision: 0, salt: Z};
    const maxActions = Number((await env.call('ledger', 'MAX_ACTIONS'))[0]);
    let actions = [], bodies = [];
    const push = (action, body = '0x') => {
      assert(actions.length < maxActions, 'setup MAX_ACTIONS');
      actions.push({...base, ...action}); bodies.push(body);
    };
    const publish = (type, body) => {
      push({kind: 1, typeId: type, bodyHashOrRecordId: e.keccak256(body)}, body);
      return record(type, body);
    };
    const bind = (p, s, role, target) => push({kind: 3, purpose: p, subject: s, role, target});
    const flush = async (label, who = 'alice') => {
      if (!actions.length) return;
      assert(actions.length <= maxActions && env.transactions.length < cap.transactions, 'setup cap before broadcast');
      await env.transact('ledger', 'execute', [actions, bodies,
        (await env.call('ledger', 'nonces', [wallets[who].address]))[0]], label, who);
      actions = []; bodies = [];
      assert(BigInt(env.transactions.at(-1).gasUsed) <= cap.gasLimit, 'setup transaction gas cap');
    };
    const makeDirectory = async name => {
      const salt = e.id('gallery-directory/' + name), id = subject('alice', salt);
      push({kind: 5, salt});
      const directory = publish(manifest.types.directory, coder.encode(['bytes32'], [id]));
      await flush('setup/directory/' + name);
      return directory;
    };
    const folders = {one: await makeDirectory('one'), eight: await makeDirectory('eight')};
    const concept = publish(manifest.types.concept,
      e.concat([folders.one, e.toUtf8Bytes('gallery-selected-revision')]));
    await flush('setup/concept');
    const authors = [{key: 'alice', address: wallets.alice.address}];
    for (let i = 1; i < 8; i++) {
      const key = 'gallery-' + i;
      const wallet = e.HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',
        undefined, `m/44'/60'/0'/0/${i + 2}`);
      wallets[key] = wallet; authors.push({key, address: wallet.address});
      await env.send('setup/fund/' + key, {to: wallet.address, value: 10n**18n, gasLimit: 21000n});
    }
    const files = [];
    const seed = async (from, to) => {
      assert(from === files.length && to <= cap.files);
      const firstTx = env.transactions.length, firstTime = Date.now();
      for (let i = from; i < to; i++) {
        const salt = e.id('gallery-file/' + i), file = subject('alice', salt);
        const name = `gallery-${String(i).padStart(4, '0')}.txt`;
        push({kind: 5, salt});
        const revision = publish(manifest.types.root,
          e.concat([file, e.toUtf8Bytes(`gallery-content-${i}`.padEnd(41, 'x'))]));
        publish(manifest.types.name, e.hexlify(e.toUtf8Bytes(name)));
        bind(purpose.head, file, Z, revision);
        if (!firstPageOnly && !fullChild1000) bind(purpose.folder, folders.one, e.id(name), file);
        if (i % 2 === 0) bind(purpose.tag, revision, concept, file);
        files.push({file, revision, name});
        if ((i + 1) % 4 === 0 || i + 1 === to) await flush('setup/file/' + (i + 1));
        if ((i + 1) % 25 === 0 || i + 1 === to) await checkpoint('seed-one', i + 1);
      }
      // Every one of the eight signers authors actual live folder placements.
      // Alice also owns all Files/initial HEADs/tags; that is recorded separately.
      for (let author = 0; author < 8; author++) {
        const who = authors[author].key;
        for (let i = from; i < to; i++) {
          if (i % 8 !== author) continue;
          bind(purpose.folder, folders.eight, e.id(files[i].name), files[i].file);
          if (actions.length >= Math.min(16, maxActions)) await flush(`setup/placement/${author}/${i}`, who);
        }
        await flush(`setup/placement/${author}/${to}`, who);
        await checkpoint('seed-eight-author', author + 1);
      }
      if (from === 0) {
        // Same-name overlay: author 1 independently places File 0 under Alice's
        // exact role. Different HEAD revision: Alice still wins ordered selection.
        const who = authors[1].key, file = files[0];
        const competitor = publish(manifest.types.root,
          e.concat([file.file, e.toUtf8Bytes('competing-head'.padEnd(41, 'x'))]));
        bind(purpose.head, file.file, Z, competitor);
        bind(purpose.folder, folders.eight, e.id(file.name), file.file);
        await flush('setup/overlay-and-head', who);
      }
      return {elapsedMs: Date.now() - firstTime, transactions: env.transactions.length - firstTx};
    };
    const sample = async (stage, width) => {
      const folder = folders[width === 1 ? 'one' : 'eight'];
      const selectedAuthors = authors.slice(0, width).map(a => a.address);
      const rpc = (method, params) => env.rpc(method, params);
      const sdk = createFilesCompactSdk({ethers: e, manifest, rpc});
      const beforePin = {...env.metrics}, pinStart = performance.now(), context = await sdk.pin();
      const pin = {ms: performance.now() - pinStart, ...metricsDelta(env.metrics, beforePin), memoryAfter: memory()};
      const reads = [];
      for (const temperature of ['cold', 'warm']) {
        const before = {...env.metrics}, start = performance.now();
        let page, pages = 0, candidates = 0, rows = 0, firstPage;
        const seen = new Set(), qualifications = {name: {}, header: {}, revisionTag: {}, match: {}};
        do {
          const firstBefore = {...env.metrics}, pageStart = performance.now();
          page = await sdk.listFolderPage({folder, authors: selectedAuthors, context, budget: 32,
            concept, tagScope: 'revision', policy: 'ordered', continuation: page?.continuation});
          assert(['PARTIAL', 'COMPLETE'].includes(page.queryCoverage), 'joined coverage unavailable');
          if (pages === 0) firstPage = {ms: performance.now() - pageStart,
            ...metricsDelta(env.metrics, firstBefore), rows: page.pageRows.length, scanned: page.scanned,
            coverage: page.queryCoverage};
          pages++; candidates += Number(page.scanned); rows += page.pageRows.length;
          for (const row of page.pageRows) {
            const count = (which, value) => {qualifications[which][value] = (qualifications[which][value] ?? 0) + 1;};
            assert(!seen.has(row.file), 'duplicate File in joined result'); seen.add(row.file);
            count('name', row.name.knowledge); count('header', row.point.value.revision?.knowledge ?? 'NONE');
            count('revisionTag', row.point.value.revisionTag.assessment); count('match', row.match);
          }
          assert(pages <= 64 && Date.now() - started <= cap.wallMs, 'bounded full traversal');
        } while (page.continuation);
        assert.equal(page.queryCoverage, 'COMPLETE');
        assert.equal(candidates, Number(page.rawTotal), 'full candidate traversal');
        assert.equal(rows, expectedTagged(stage), 'exact selected-revision tag result count');
        for (let i = 0; i < stage; i += 2) assert(seen.has(files[i].file), 'missing expected tagged File');
        const traversalMs = performance.now() - start, memoryAfter = memory();
        global.gc?.(); const memoryAfterGC = memory();
        reads.push({temperature, pin: temperature === 'cold' ? pin : undefined,
          ms: traversalMs, ...metricsDelta(env.metrics, before), firstPage,
          pages, candidates, rows, selected: Number(page.selectedSoFar), qualifications,
          bodyBytesFetched: 0, memoryAfter, memoryAfterGC});
      }
      return {folder, authors: selectedAuthors, context, reads};
    };
    const pay = async (stage, width, sampled, candidateLimit) => {
      const paid = [], selectedAuthors = sampled.authors.map(a => e.zeroPadValue(a, 32));
      report.currentPaid = {stage, width, pages: paid};
      const query = [concept, 2, false, ''];
      const basis = [sampled.context.admission, sampled.context.generation,
        sampled.context.epoch, sampled.context.executionSet];
      const iface = new e.Interface(env.contracts.pagePaid.abi);
      let cursor = '0x', scanned = 0;
      while (scanned < candidateLimit) {
        const budget = Math.min(4, candidateLimit - scanned);
        const args = [env.contracts.joined.address, sampled.folder, selectedAuthors, query, basis, cursor, budget];
        const data = iface.encodeFunctionData('read', args);
        const before = {...env.metrics}, start = performance.now();
        assert(env.transactions.length < cap.transactions, 'paid transaction count cap');
        const hash = await env.enqueue(`paid/${stage}/${width}/${scanned}`, {to: env.contracts.pagePaid.address,
          data, gasLimit: cap.gasLimit});
        const receipt = await env.observe(hash);
        const row = {candidateStart: scanned, budget, gasUsed: receipt.gasUsed, status: receipt.status,
          transactionHash: hash, calldataBytes: receipt.calldataBytes,
          ms: performance.now() - start, ...metricsDelta(env.metrics, before)};
        paid.push(row); await persist();
        assert.equal(receipt.status, 'SUCCESS', 'PAID_READ_CLIFF');
        // The continuation commits to msg.sender. Read it with the paid
        // contract as eth_call.from, matching the subsequent signed consumer.
        const reader = new e.Interface(env.contracts.joined.abi);
        const readerArgs = [sampled.folder, selectedAuthors, query, basis, cursor, budget];
        const encoded = await env.rpc('eth_call', [{from: env.contracts.pagePaid.address,
          to: env.contracts.joined.address, data: reader.encodeFunctionData('readPage', readerArgs)}, 'latest']);
        const [page] = reader.decodeFunctionResult('readPage', encoded);
        assert(Number(page.scanned) > 0 && Number(page.scanned) <= budget, 'paid page progress');
        scanned += Number(page.scanned); cursor = page.continuation;
        if (cursor === '0x') break;
        await checkpoint('paid-page', scanned);
      }
      report.currentPaid = null;
      return {candidateLimit, candidatesScanned: scanned, pages: paid,
        gasTotal: paid.reduce((sum, row) => sum + BigInt(row.gasUsed), 0n).toString()};
    };
    await checkpoint('deployed', 0);
    if (rssDiscriminator || fullChild1000) {
      const target = fullChild1000 ? 1000 : 250;
      report.seed = await seed(0, target);
      report.seed.files = files.length;
      await checkpoint('seed-complete', target);
      const inputPath = join(env.dir, 'child-rss-input.json');
      await writeFile(inputPath, json({rpcUrl: env.rpcUrl, manifest, folders, concept,
        authors: authors.map(a => a.address), files}));
      report.children = [];
      const worker = join(lab, 'script/measure-gallery-authors-child.mjs');
      const runChild = sequence => new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--expose-gc', '--max-old-space-size=640', worker,
          inputPath, sequence], {stdio: ['ignore', 'pipe', 'pipe']});
        const result = {sequence, pid: child.pid, records: [], maxCombinedNodeRss: 0};
        report.children.push(result);
        let stdout = '', stderr = '', stopped = null;
        const kill = reason => {if (!stopped) {stopped = reason; child.kill('SIGTERM');}};
        const guard = setInterval(() => {
          try {
            const childRss = Number(execFileSync('ps', ['-o', 'rss=', '-p', String(child.pid)],
              {encoding: 'utf8'}).trim()) * 1024;
            const combined = process.memoryUsage().rss + childRss;
            result.maxCombinedNodeRss = Math.max(result.maxCombinedNodeRss, combined);
            if (combined > (fullChild1000 ? cap.nodeRss - 128 * 2**20 : cap.nodeRss))
              kill(fullChild1000 ? 'COMBINED_NODE_RSS_HEADROOM_STOP' : 'COMBINED_NODE_RSS_CAP');
            if (Date.now() - started > cap.wallMs) kill('WALL_TIME_CAP');
          } catch { /* child may have exited between polls */ }
        }, 100);
        const timeout = setTimeout(() => kill('CHILD_60S_CAP'), 60_000);
        child.stdout.on('data', chunk => {
          stdout += chunk;
          if (stdout.length > 2 * 2**20) kill('CHILD_OUTPUT_CAP');
          let end;
          while ((end = stdout.indexOf('\n')) >= 0) {
            const line = stdout.slice(0, end); stdout = stdout.slice(end + 1);
            try {const row = JSON.parse(line); result.records.push(row);
              if (row.memory?.peakRss && row.memory.peakRss + process.memoryUsage().rss
                > (fullChild1000 ? cap.nodeRss - 128 * 2**20 : cap.nodeRss))
                kill(fullChild1000 ? 'COMBINED_NODE_PEAK_HEADROOM_STOP' : 'COMBINED_NODE_PEAK_CAP');
            } catch (error) {kill('CHILD_RECORD_PARSE: ' + error.message);}
          }
        });
        child.stderr.on('data', chunk => {stderr = (stderr + chunk).slice(-4000);});
        child.on('error', error => {stopped = error.message;});
        child.on('close', async code => {
          clearInterval(guard); clearTimeout(timeout);
          result.exitCode = code; result.stopReason = stopped; result.stderr = stderr;
          result.maxCombinedNodeRss = Math.max(result.maxCombinedNodeRss,
            ...result.records.filter(row => row.memory?.peakRss)
              .map(row => row.memory.peakRss + process.memoryUsage().rss));
          try {await persist();
            assert.equal(code, 0, `read-only child ${sequence} failed: ${stopped ?? stderr}`);
            assert(result.records.at(-1)?.kind === 'complete', 'child full traversal complete');
            resolve(result);
          } catch (error) {reject(error);}
        });
      });
      await runChild(fullChild1000 ? 'eight-1000' : 'eight');
      await checkpoint('child-eight-complete', target);
      if (!fullChild1000) {
        await runChild('one-then-eight'); await checkpoint('child-sequence-complete', target);
      }
      report.status = fullChild1000 ? 'PASS_FULL_1000_CHILD' : 'PASS_RSS_DISCRIMINATOR';
      report.elapsedMs = Date.now() - started;
      report.transactionCount = env.transactions.length;
      report.setupGasTotal = env.transactions.filter(row => row.label.startsWith('setup/'))
        .reduce((sum, row) => sum + BigInt(row.gasUsed), 0n).toString();
      report.limits.push(fullChild1000
        ? 'One read-only child, full cold traversal only; no paid call or warm pass. A 128 MiB combined-Node headroom stop was enforced.'
        : 'Both children are read-only; no paid wrapper, warm pass, or 1000-File traversal in this experiment.');
      await persist(); console.log('GALLERY_REPORT ' + join(env.dir, reportName));
      return report;
    }
    if (firstPageOnly) {
      const seeded = await seed(0, 1000);
      report.setup = {files: files.length, placementAuthors: authors.map(a => a.address),
        placementCounts: placementPlan(1000).counts, extraOverlayPlacementAuthor: authors[1].address,
        headTagAuthorship: 'Alice initial HEAD and positive selected-revision tags for even Files; signer 1 has a competing untagged HEAD on File 0',
        ...seeded};
      assert.equal(files.length, 1000);
      for (let i = 0; i < 8; i++) assert(env.transactions.some(row => row.label.startsWith(`setup/placement/${i}/`)),
        `missing real placement transaction from author ${i}`);
      await checkpoint('seed-complete', 1000);
      const selectedAuthors = authors.map(a => a.address);
      const sdk = createFilesCompactSdk({ethers: e, manifest, rpc: (method, params) => env.rpc(method, params)});
      const beforePin = {...env.metrics}, pinStart = performance.now(), context = await sdk.pin();
      const pin = {ms: performance.now() - pinStart, ...metricsDelta(env.metrics, beforePin), memoryAfter: memory()};
      const beforePage = {...env.metrics}, pageStart = performance.now();
      const page = await sdk.listFolderPage({folder: folders.eight, authors: selectedAuthors, context,
        budget: 32, concept, tagScope: 'revision', policy: 'ordered'});
      const pageMs = performance.now() - pageStart;
      const qualifications = {name: {}, header: {}, revisionTag: {}, match: {}};
      for (const row of page.pageRows) {
        for (const [kind, value] of [['name', row.name.knowledge],
          ['header', row.point.value.revision?.knowledge ?? 'NONE'],
          ['revisionTag', row.point.value.revisionTag.assessment], ['match', row.match]]) {
          qualifications[kind][value] = (qualifications[kind][value] ?? 0) + 1;
        }
      }
      report.sdkFirstPage = {pin, ms: pageMs, ...metricsDelta(env.metrics, beforePage),
        folder: folders.eight, authors: selectedAuthors, budget: 32,
        coverage: page.queryCoverage, candidatesScanned: Number(page.scanned),
        rawTotal: Number(page.rawTotal), selectedSoFar: Number(page.selectedSoFar),
        rows: page.pageRows.length, qualifications, hasContinuation: Boolean(page.continuation),
        memoryAfter: memory(), bodyBytesFetched: 0};
      await checkpoint('sdk-first-page', 1000);
      assert.equal(report.sdkFirstPage.candidatesScanned, 32);
      assert.equal(report.sdkFirstPage.rawTotal, 1001);
      assert.equal(report.sdkFirstPage.coverage, 'PARTIAL');
      assert(report.sdkFirstPage.hasContinuation, 'first-page continuation required');
      const iface = new e.Interface(env.contracts.pagePaid.abi);
      const args = [env.contracts.joined.address, folders.eight,
        selectedAuthors.map(a => e.zeroPadValue(a, 32)), [concept, 2, false, ''],
        [context.admission, context.generation, context.epoch, context.executionSet], '0x', 4];
      const data = iface.encodeFunctionData('read', args);
      const paidBefore = {...env.metrics}, paidStart = performance.now();
      assert(env.transactions.length < cap.transactions, 'paid transaction count cap');
      const hash = await env.enqueue('paid/1000/8/first',
        {to: env.contracts.pagePaid.address, data, gasLimit: cap.gasLimit});
      const receipt = await env.observe(hash);
      const observed = receipt.receipt.logs.map(log => iface.parseLog(log)).find(log => log?.name === 'Observed');
      report.paidFirstPage = {budget: 4, tagScope: 'selected-revision', status: receipt.status,
        observed: observed ? {scanned: Number(observed.args.scanned), rows: Number(observed.args.rows),
          scanStatus: Number(observed.args.scanStatus), completeFromOrigin: observed.args.completeFromOrigin,
          queryAbsent: observed.args.queryAbsent, resultHash: observed.args.result} : null,
        gasUsed: receipt.gasUsed,
        transactionHash: hash, calldataBytes: receipt.calldataBytes,
        ms: performance.now() - paidStart, ...metricsDelta(env.metrics, paidBefore)};
      await checkpoint('paid-first-page', 1000);
      assert.equal(receipt.status, 'SUCCESS', 'PAID_FIRST_PAGE_CLIFF');
      assert.equal(report.paidFirstPage.observed?.scanned, 4, 'paid first page must scan four candidates');
      assert(report.paidFirstPage.observed.rows > 0, 'selected-revision paid page must return positive matches');
      report.setupGasTotal = env.transactions.filter(row => row.label.startsWith('setup/'))
        .reduce((sum, row) => sum + BigInt(row.gasUsed), 0n).toString();
      report.transactionCount = env.transactions.length;
      report.status = 'PASS_FIRST_PAGE_ONLY'; report.elapsedMs = Date.now() - started;
      report.metrics = env.metrics;
      report.limits.push('No full SDK traversal, warm pass, or paid continuation was attempted at 1000 Files.');
      await persist(); console.log('GALLERY_REPORT ' + join(env.dir, reportName));
      return report;
    }
    for (const count of [100, 250, 1000]) {
      const seeded = await seed(files.length, count), stage = {files: count, folders,
        placementAuthors: authors.map(a => a.address), placementCounts: placementPlan(count).counts,
        headTagAuthorship: 'Alice initial HEAD and positive selected-revision tags for every even File; signer 1 has competing untagged HEAD on File 0',
        setup: seeded, samples: [], paid: []};
      report.stages.push(stage);
      stage.seedCheckpoint = await checkpoint('seed-complete', count);
      for (const width of [1, 8]) {
        const sampled = await sample(count, width);
        global.gc?.(); sampled.memoryAfterSdkRelease = memory();
        stage.samples.push({width, ...sampled});
        stage.paid.push({width, ...await pay(count, width, sampled, count <= 250 && width === 8 ? cap.paidCandidates : 4)});
        await checkpoint(`read/${count}/${width}`, width);
      }
      global.gc?.(); global.gc?.();
      stage.retainedTransactionJsonBytes = Buffer.byteLength(json(env.transactions));
      stage.checkpoint = await checkpoint('stage-complete', count);
      if (count === 100) {
        report.completedStage = 100;
        const deployed = report.checkpoints.find(row => row.phase === 'deployed');
        const seedSlope = {nodeRss: stage.seedCheckpoint.nodeRss - deployed.nodeRss,
          anvilRss: stage.seedCheckpoint.anvilRss - deployed.anvilRss,
          outputBytes: stage.seedCheckpoint.outputBytes - deployed.outputBytes};
        const readOverhead = {nodeRss: stage.checkpoint.nodeRss - stage.seedCheckpoint.nodeRss,
          anvilRss: stage.checkpoint.anvilRss - stage.seedCheckpoint.anvilRss,
          outputBytes: stage.checkpoint.outputBytes - stage.seedCheckpoint.outputBytes};
        const projection = {elapsedMs: stage.checkpoint.elapsedMs + 9 * seeded.elapsedMs
            + 9 * stage.samples.reduce((sum, s) => sum + s.reads.reduce((n, r) => n + r.ms, 0), 0),
          nodeRss: deployed.nodeRss + 10 * seedSlope.nodeRss + readOverhead.nodeRss,
          anvilRss: deployed.anvilRss + 10 * seedSlope.anvilRss + readOverhead.anvilRss,
          outputBytes: deployed.outputBytes + 10 * seedSlope.outputBytes + readOverhead.outputBytes,
          transactions: deployed.transactions + 10 * (stage.checkpoint.transactions - deployed.transactions)};
        stage.stopGoProjection = {model: '10x seed slope plus one read allocation', ...projection}; await persist();
        console.log('GALLERY_100_STOP_GO ' + JSON.stringify({report: join(env.dir, 'gallery-authors-measurement.json'), projection}));
        assert(projection.elapsedMs <= cap.wallMs && projection.nodeRss <= cap.nodeRss
          && projection.anvilRss <= cap.anvilRss && projection.outputBytes <= cap.outputBytes
          && projection.transactions <= cap.transactions, 'UNSAFE_1000_TREND');
      } else if (count === 250) {
        const prior = report.stages[0].checkpoint, now = stage.checkpoint;
        const project = key => now[key] + 5 * (now[key] - prior[key]);
        const projection = {elapsedMs: project('elapsedMs'), nodeRss: project('nodeRss'),
          anvilRss: project('anvilRss'), outputBytes: project('outputBytes'),
          transactions: project('transactions')};
        stage.stopGoProjection = {model: '100-to-250 observed whole-stage slope, extended to 1000', ...projection};
        await persist();
        console.log('GALLERY_250_STOP_GO ' + JSON.stringify({report: join(env.dir, 'gallery-authors-measurement.json'), projection}));
        assert(projection.elapsedMs <= cap.wallMs && projection.nodeRss <= cap.nodeRss
          && projection.anvilRss <= cap.anvilRss && projection.outputBytes <= cap.outputBytes
          && projection.transactions <= cap.transactions, 'UNSAFE_1000_TREND');
      }
    }
    report.status = 'PASS'; report.elapsedMs = Date.now() - started;
    report.metrics = env.metrics;
    report.setupGasTotal = env.transactions.filter(row => row.label.startsWith('setup/'))
      .reduce((sum, row) => sum + BigInt(row.gasUsed), 0n).toString();
    report.transactionCount = env.transactions.length;
    await persist();
    console.log('GALLERY_REPORT ' + join(env.dir, reportName));
    return report;
  } catch (error) {
    report.status = fullChild1000 && report.children?.length ? 'PARTIAL_SAFETY_STOP' : 'STOPPED';
    report.error = error.message; report.elapsedMs = Date.now() - started;
    if (fullChild1000) {
      report.completedPages = report.children?.[0]?.records.filter(row => row.kind === 'page').length ?? 0;
      report.transactionCount = env.transactions.length;
      report.setupGasTotal = env.transactions.filter(row => row.label.startsWith('setup/'))
        .reduce((sum, row) => sum + BigInt(row.gasUsed), 0n).toString();
      report.limits.push('A partial safety stop is not terminal COMPLETE coverage or a full 1000-File result.');
    }
    report.lastTransaction = env.transactions.at(-1); await persist();
    console.error('GALLERY_REPORT ' + join(env.dir, reportName));
    throw error;
  } finally {clearTimeout(abortTimer); await env.close();}
}

if (process.argv.includes('--self-test')) {
  assert.deepEqual(placementPlan(100).counts, [13, 13, 13, 13, 12, 12, 12, 12]);
  assert.deepEqual(placementPlan(1000).counts, [125, 125, 125, 125, 125, 125, 125, 125]);
  assert.equal(expectedTagged(100), 50);
  assert.equal(expectedTagged(1000), 500);
  console.log('gallery authors plan self-test PASS');
} else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await measureGalleryAuthors({firstPageOnly: process.argv.includes('--first-page-1000'),
    rssDiscriminator: process.argv.includes('--rss-discriminator-250'),
    fullChild1000: process.argv.includes('--full-child-1000')});
}
