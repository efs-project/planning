# EFS v1 through an agent's eyes — evidence and recommendations

2026-10-01 · Claude (Opus 5.5) in Claude Code · evaluation only: no repo, vault or design edits; no public-chain writes.

## The lens applied

The X post (@doodlestein, fetched through the fxtwitter mirror because x.com returns 402) is a follow-up prompt for a *freshly planned* project. It asks the agent to:

- make the system "agent-intuitive, agent-ergonomic, and agent-accretive";
- sit in the driver's seat;
- treat it as one coherent "tower of linked abstractions" that is legible to an agent and wastes as few resources as possible;
- then rewrite the design docs to match.

I used the first half as the evaluation lens and skipped the "rewrite the docs" half, as your brief asked.

I scored v1 against four questions:

1. Can an agent find out what is true?
2. Can it find what exists?
3. Can it act safely and repeatably?
4. Can it recover when something goes wrong?

## 1. What I inspected and ran

### Revisions

| Repo | Revision | Notes |
|---|---|---|
| contracts | `c6b4075` (origin/main = local main, last commit 2026-06-25) | Unmerged doc fix exists on `origin/pm/stale-guidance-2026-07-23` |
| sdk | `15314ce` (origin/main) | Merges PR #1 `chore/scaffold` and PR #6. Your local checkout is on the already-merged branch `docs/readme-and-sepolia-comment`; local `main` (`3147786`) is one merge behind |
| planning | `cb7b340` | Read only |
| client | `85796b3` | Read only, not exercised (marked legacy) |

All execution happened in throwaway `git clone --shared` copies in the session scratchpad: `c-dev`, `c-agent`, `sdk-x` and `sdk-me`. The real checkouts were not modified. Another agent's anvil on port 62229 was left alone.

### Developer loop

**contracts** (`c-dev`):

| Step | Result | Time |
|---|---|---|
| `yarn install --immutable` | ok | 41 s |
| `yarn hardhat:test` | **659 passing, 23 pending, 0 failing** | 1:54 |
| `hardhat:lint --max-warnings=0`, `hardhat:check-types`, `next:lint --max-warnings=0`, `next:check-types` | all pass | — |
| Next.js unit tests | 156/156 | — |
| `yarn docs:check` | OK | — |

Of the 23 pending tests, 22 are fork-only (they need `MAINNET_FORKING_ENABLED=true`, CreateX and an archive RPC) and 1 needs `RUN_SLOW_TESTS=true`.

**sdk** (`sdk-x`):

| Step | Result | Time |
|---|---|---|
| install, build, typecheck | ok | 6 s / 10 s / 4 s |
| `pnpm test` | TS **853 passed, 4 skipped**; forge **79/79** | 27 s |
| biome | 116 files clean | — |
| attw, publint | green | — |
| size-limit | 55.24 of 69 kB | — |
| `check-deployment-drift.mjs` | passes (needs network) | — |
| knip | fails with 15 unused exports (CI runs it as `\|\| true`) | — |

### Agent-user loop

**Live Sepolia, read-only.** I used the SDK against the public RPC `ethereum-sepolia-rpc.publicnode.com`, with probe scripts in `scratchpad/sdk-me/packages/sdk/probe/`:

- `explore.mjs`: cold listing
- `discover*.mjs`: author discovery through raw views
- `read*.mjs`: reads, info, mirrors, redirects

**Disposable local fork.** `c-agent` ran:

```
yarn fork --port 8617
LOCALHOST_RPC_URL=http://127.0.0.1:8617 EFS_CLIENT_PATH=/nonexistent yarn deploy
```

The fork pins block 10691000. Deploy plus seed took 172 s. I then used the SDK with Hardhat's publicly known test account #1:

| Script | What it tests |
|---|---|
| `local.mjs` | Wiring the SDK to the local deployment |
| `write1.mjs` | Write, read-back, overwrite, identical rewrite, error cases |
| `collide.mjs` | A file and a folder with the same name |
| `interrupt.mjs` | Aborting mid-write, then a naive retry |
| `router.mjs` | Reading the same paths through `web3://` |
| `gas*.mjs` | Transaction and gas cost per write shape |

The fork was stopped afterwards. To reproduce, rerun the fork and deploy commands above, then run `node probe/<script>.mjs` from `sdk-me/packages/sdk`. The scratchpad lives in /private/tmp and may be cleaned up; say if you want the probes copied somewhere permanent.

**Documentation audit.** A read-only sweep covered terminology, status claims, how to discover EAS UIDs, and whether the documented write sequences match what the code does.

## 2. Observed vs documented vs unknown

### A. Cold discovery: EFS looks almost empty to a new agent (observed)

**What the default client shows.** A read-only `createEfsClient({ publicClient })` on live Sepolia lists `/` as just `transports/` and `tags/`. `/tags` is empty, and the whole walk took 1.6 s.

**What is actually there.** `EFSIndexer.getChildren(root)` shows 9 entries from 4 attesters:

- `/README.md` (`0xaCf4…`)
- `/games`, `/cypherpunk`, `/standards`, `/whitepapers` and `/EFS-logo.png` (`0x11Cb…`)
- `/agents` (`0x4F1a…`)
- `/tags` and `/transports` (the system account)

The default lens hides 7 of the 9. This follows from the lens design and is not a bug, but **nothing tells the agent that other content exists**. The `FileNotFound` for `/README.md` says only "under the resolving lens".

**What it took to find them.** I had to go below the SDK:

- `efs.raw.indexer` for `getChildren`
- `efs.eas.getAttestation` for each child
- decoding the ANCHOR data by hand

The SDK's vendored indexer ABI has no `getAttestationsBySchema*` or `getChildrenByAttester`, so the global per-schema enumeration paths the contract does offer can't be reached through `efs.raw` (the call threw `AbiFunctionNotFoundError`).

### B. Real v1 content often can't be read (observed, live Sepolia)

- **Arcade and showcase files fail the strict reads.** `/README.md`, `/games/*` and `/cypherpunk/*` under the `0x11Cb…` lens all return `verification: 'malformed-claim'`. So the README's own one-liner (`readText`) throws `MalformedClaim`, and `fs.overview('/')` throws too because of the root README. `fs.read` still returns the bytes. This matches the known keccak-contentHash seeding problem; the heal in contracts PR #48 has evidently not been run.
- **The Nanda agent's files have no bytes anywhere.** `/agents/nanda-town-agent/*.json` (attester `0x4F1a…`, 5 files) are placed and have contentType, size and name properties, but **zero MIRROR attestations from anyone**. They show up in `list`, but `read` fails. The error has code `'EfsError'` and the message "all mirrors failed: (no mirrors provided)". The generic code means an agent can't branch on it, and the message doesn't say "this file has no published bytes". I don't know which tool wrote these files; nothing in the vault names `nanda-town-agent`.
- **Reads over IPFS are slow.** `fs.read('/games/pong.html')` took 23 s through the IPFS mirror; most other reads took 0.5–2 s.

### C. Writes work but are expensive, not idempotent, and can't resume (observed, local fork)

**Normal behaviour:**
- `fs.write('/agent-probe/notes/hello.txt')` creates the 2 missing parent folders and needs 8 blocks and 6 confirmations (24 s).
- Reading back with the wallet as the default lens returns `matches-author`. `list`, `info` and `web3://` all agree.

**Cost per write shape** (gas on the local Hardhat fork, which runs pre-Glamsterdam pricing):

| Shape | Transactions | Gas |
|---|---|---|
| New 1 KB file in an existing folder | 5 | 9.22M |
| New 1 KB file, 3 new folders | 9 | 14.46M |
| Overwrite of a 1 KB file | 5 | 8.48M |
| 1 KB file with an external `ipfs://` mirror | 3 | 8.09M |

Per-transaction breakdown for the first shape:

| Transaction | Gas |
|---|---|
| SSTORE2 chunk | 0.27M |
| Per-file storage manager CREATE | 0.87M |
| DATA layer | 0.91M |
| Anchor, mirror and property layer | 3.67M |
| PIN layer | 3.49M |

About 7M of the 9.2M is the per-file metadata: contentType, contentHash and size, each stored as its own key-anchor + PROPERTY + PIN triple. The bytes themselves are a small part of the cost.

**An identical rewrite is not idempotent.** Rewriting the same bytes at the same path costs another 5 transactions and creates a new DATA UID.

**Interrupting a write leaves a file that lists but won't read.** I aborted after layer 3 of 5. The SDK raised `WriteNotSentError` (code `PartialBatchFailure`). Its message is excellent: it names layer 4, lists the 4 unsent attestations, says 10 already landed, and says "don't retry, recover from `landed`". But:

1. The file then **appears in `list` and returns `FileNotFound` on read**. That is the "confirms but unreadable" shape again.
2. There is no tool to "recover from `landed`". `resume` throws `NotImplemented`, and `landed` is a `Map`, so `toJSON` drops it.
3. The **naive retry succeeded**. It reused the folder and file anchor, and orphaned 8 attestations plus a storage contract. So the warning ("can revert on permanent duplicate anchors") is worse than what actually happened, and the correct agent action was in fact "retry".
4. There's no dry run: `fs.preview` and `efs.batch` both throw `NotImplemented`.

**A file and a folder can share a name.** Writing a file at `/agent-probe/notes`, where a folder already exists, succeeded. The listing then shows both `file:notes` and `dir:notes`. The SDK and the router both resolve the path to the file. I believe this is by design (the anchor's `forSchema` split), but it's surprising.

**Address-shaped options are inconsistent across namespaces** (observed):

| Namespace | `lens` accepts |
|---|---|
| `fs.*` | `Lens \| Address` |
| `mirrors` / `graph.tags` / `sorts` | `Address \| Address[]` |
| `props` | `Address` only |

Passing the README-recommended `Lens` object to `mirrors.list` throws a raw `TypeError: attesters.map is not a function`.

**Some methods take a path, others a UID:**
- `graph.tags.add` and `redirects.canonical` need UIDs; the `fs` methods take paths.
- Passing a path to `redirects.canonical` gives a viem "bytes16 vs bytes32" error.
- The SDK has no public "path → anchor UID" method.
- `tags.add` with an unknown label says "You passed `createParents: false`", which I hadn't.

**Errors outside the write path are uneven** (SDK agent, observed):
- Read-path RPC failures come out as raw viem errors with no `.code`.
- Seven different write-failure classes share the code `PartialBatchFailure`.
- Only `NotImplemented` has a structured `alternative` field.

On the plus side, the write-path messages are very good. `PayloadTooLarge` tells you exactly which two options to use, and `InvalidAnchorName` cites the spec.

### D. Developer onboarding: the auto-loaded docs describe the wrong project state (observed)

**`contracts/AGENTS.md` and the files it auto-loads:**
- `contracts/AGENTS.md:3`, auto-loaded via `CLAUDE.md`, says "Pre-launch, devnet target April 19, 2026 … no real data created yet".
- It still calls `client/` the "Production web client" (also `sdk/AGENTS.md:31`) and lists the past OnionDAO milestone. It never mentions v2.
- `QUESTIONS.md` (auto-loaded) keeps the proxy-pattern question open, although ADR-0048 decided it and Sepolia ships it.
- `LAUNCH_CHECKLIST.md` still says April, with 55 boxes unchecked.
- **A fix already exists** on the unmerged `origin/pm/stale-guidance-2026-07-23` (`959cde2`).

**SDK status claims:**
- `sdk/README.md:5` and `sdk/docs/specs/overview.md:3` say "scaffold".
- `packages/sdk/README.md:5` contradicts its own line 63.
- `examples/` is empty although the README calls them "runnable consumers".
- The README quickstart uses `createEfsClient`, which ADR-0019 deprecates; the `@deprecated` tag is attached to the wrong symbol, so editors don't warn.
- `planning/AGENTS.md:89` ("in flight, `chore/scaffold`"), `client/AGENTS.md` ("unmerged") and `Milestones.md:66` still describe the SDK as unmerged, although it has been merged since PR #1. `Onboarding/repo-map.md` is correct.

**Three conflicting accounts of how many transactions a write takes:**

| Source | Claim |
|---|---|
| `specs/04` | one `multiAttest` (impossible, because UIDs are only known after mining) |
| `specs/overview.md` | ~5 transactions, with `data:` URIs inline for ≤4 KB |
| SDK overview | ~2–3 signatures |

What I observed was 3–9 transactions, and the SDK never writes `data:` URIs.

**Two sources disagree on Sepolia view addresses (spot-checked).** The Sepolia block in `deployedContracts.ts` has router `0x4EF2…` and fileView `0x141D…`. `CHAINS.md`, `deployments/sepolia/*.json` and the SDK registry have `0x44D5…` and `0x76B1…`. `contracts/AGENTS.md:160` names `deployedContracts.ts` as the source of truth; the SDK says "NEVER `deployedContracts.ts`". This suggests the explorer reads pre-hardening views on Sepolia. I inferred that and did not verify it in a browser.

**The CI gate set isn't written down in one place:**
- AGENTS.md omits `--max-warnings=0`, `docs:check`, the Next.js unit tests and `deploy-pin-check`, and it suggests `yarn format`, which rewrites files.
- The Next.js test gate appears only in `.github/workflows/lint.yaml`.
- CI's lint job runs `yarn chain & yarn deploy` on port 8545.

**`yarn deploy` has a hidden side effect.** It runs `scripts/push-to-client.js`, which overwrites `../client/src/libefs/generated/deployedContracts.ts` whenever that directory exists. No `.md` file mentions this. I avoided it with `EFS_CLIENT_PATH=/nonexistent`.

**Wiring the SDK to a local fork takes about 40 lines of glue** (I did it in `local.mjs`):
- Read 9 schema UIDs from 3 contracts' getters.
- Collect 12 addresses.
- Spread the built-in map yourself, because `deployments` replaces the map rather than merging into it; passing only `{31337: …}` silently drops Sepolia.

Addresses aren't validated until the first call. There is no `deploymentFromChain(indexerAddress)` helper.

**Contract reverts are opaque.** Anchor validation uses 19 `return false` paths, which surface as EAS's generic `InvalidAttestation()`. EFSIndexer also defines its own `InvalidAttestation()`, so the decoded name is ambiguous. `DuplicateFileName()` and `AnchorTooDeep()` carry no parameters. The SDK's own pre-validation (for example of names) mostly covers this for SDK users.

**Terminology drift** (documentation audit):
- "lens" has 4 meanings, "overview" 3, "overlay" 3, "system" 2.
- The Glossary describes DATA as `contentHash + size`, but the schema is empty.
- ANCHOR's field is named `anchorSchema=` in specs but `forSchema` on-chain.
- `/transports/onchain` serves `web3://`.
- `resolvePath` finds only generic folders, which no spec mentions. Files need `resolveAnchor(…, DATA_SCHEMA_UID)`, so the `resolvePath` examples in `specs/04` return 0 for files.

### Unknowns
- I didn't run the Next.js explorer, the fork-only contract tests, the SDK `fork.test.ts`, or the client.
- I don't know who wrote the Nanda files, or whether the Nanda and Arcade product paths read through the SDK or the explorer.
- All gas figures are pre-Glamsterdam.

## 3. The five most valuable improvements

The 2026-08-07 ruling makes v1 + SDK the supported bridge for Nanda and Arcade. The 2026-08-08 ruling makes v2 a greenfield design with no v1 compatibility, and declares v1 data disposable. So these are ranked by **how much they help an agent working on Nanda or Arcade now, relative to their cost**. Only 1, 2 and 3 justify real v1 code work; 4 and 5 are partly lessons for v2.

### 1. One truthful, machine-checked status layer

**Problem.** Every auto-loaded entry document currently tells a fresh agent something false: pre-launch, production client, scaffold, unmerged, decision still open. The cheapest way for an agent to do better work is to stop it believing the wrong thing at minute one.

**Existing mechanisms:**
- the unmerged `pm/stale-guidance-2026-07-23` branch
- `yarn docs:check`
- the SDK's `check-deployment-drift.mjs`
- the planning vault's `Retirements.md` and `needs-integration.sh`

**Do:**
- Merge or redo the stale-guidance branch.
- Give each repo's AGENTS.md a short "Status as of <date>: v1 bridge for Nanda/Arcade; v2 is greenfield; see planning Decisions 2026-08-07/08" block, written once and kept up to date.
- Fix the three conflicting write-cost claims to match the measured 3–9 transactions.
- Make one Sepolia address record authoritative. Regenerate the Sepolia block of `deployedContracts.ts`, or document that the explorer must not use it.
- Add `yarn verify` and `pnpm verify` scripts that run exactly the CI gate set, port-parameterised.
- Document `push-to-client.js`, or make it opt-in.

**Tradeoff.** Documentation work in a repo whose future is limited. It is still worth doing because it's small and every agent session pays for the stale version.

**Tests:**
- `docs:check` fails when the Sepolia addresses in `deployedContracts.ts` ≠ `CHAINS.md`.
- `docs:check` greps the entry docs for retired phrases taken from `Retirements.md` (e.g. "devnet target April", "Production web client", "Status: scaffold").
- CI asserts `verify` invokes the same steps as the workflows.

### 2. Make "listed" imply "readable", and make breakage visible

**Problem.** The three shapes an agent actually hits on v1 data — malformed claims on the Arcade and showcase files, no mirrors on the Nanda files, and interrupted writes — all look the same: the entry shows up in `ls` but reading it fails. This is the dominant EFS bug shape you've already identified, so it's worth catching systematically.

**Existing mechanisms:**
- `verification` states (`malformed-claim`, `no-claim`, `matches-author`)
- `TrustDescriptor`
- fail-closed reads (`readText`) next to the lenient `read`
- contracts PR #48 (seeder fix + heal)

**Do:**
- Run PR #48's heal, or reseed, since v1 data is declared disposable.
- Add an opt-in `fs.check(path)` / `list(path, { health: true })` that classifies each entry as `ok | no-bytes | malformed-claim | unplaced-anchor | fetch-failed` with a reason string.
- Give "no mirrors" its own error code (e.g. `NoMirrors`) with a message like "the writer never published bytes; ask <attester>".
- Make `fs.overview` fall back to the lenient read rather than throwing.

**Tradeoff.** A health check means fetching the bytes, so it must stay opt-in and bounded. It only reports problems; it can't fix data written by another tool.

**Tests:** use local-fork fixtures for each broken shape — a PIN with no MIRROR, a keccak claim, and an interrupt after layer 3. For each, assert the `check` classification, the error code, and that the overview still renders.

### 3. Writes as plan → apply → reconcile

**Problem.** An agent can't currently:
- see what a write will cost (`preview` is `NotImplemented`);
- skip a no-op (an identical rewrite costs 5 transactions);
- resume after an interruption: `resume` is `NotImplemented`, `landed` is a `Map` that JSON drops, and the error tells it not to retry even though retrying works.

**Existing mechanisms.** The write is already an explicit graph:
- `buildFileWriteGraph`
- step ids
- `landed`
- per-layer `onProgress`
- `WriteReceipt.steps`
- `serializeWriteReceipt`
- reuse of existing parent anchors via `resolveOrPlanParents`
- the idempotent `efs.index(uid)` repair

Most of the machinery is there; it just isn't exposed.

**Do:**
- Expose `fs.plan(path, bytes, opts)`, returning the layers, attestation kinds, transaction count, an estimated gas cost, and which steps the chain already satisfies. That *is* `preview`.
- Have `write` reconcile before each layer: skip a step if an equivalent attestation already exists for the same attester, slot and content.
- Return `{ unchanged: true }` with the existing receipt when the active placement already has the same contentHash and properties.
- Serialize `landed` as a plain object.
- Reword the partial-write error so its advice matches reality ("calling `write` again is safe and completes the missing layers").

**Tradeoff.** Reconciling costs some extra reads per write. Treating identical content as a no-op prevents deliberately re-attesting the same bytes, so offer a `force: true` option. This is a moderate SDK change, and it pays off only while Nanda and Arcade actually write through the SDK.

**Tests** (local fork):
- Abort after layer k for every k, call `write` again, then assert the file reads `matches-author` and the newly minted attestations are exactly the missing ones.
- An identical rewrite mints 0 attestations.
- `plan()`'s transaction count equals the transactions actually mined, for the four shapes in §2C.
- `JSON.parse(toJSON(err)).landed` round-trips.

### 4. Discovery as a first-class, clearly non-trust read

**Problem.** A cold agent can't learn that content exists outside its lens without leaving the SDK.

**Existing mechanisms:**
- `EFSIndexer.getChildren` (all attesters)
- `containsAttestations(anchor, attester)`
- `getAnchorsBySchema`
- `getAttestationsBySchemaAndAttester`
- the explorer's default-lens work on `contracts-main-default-lenses`

**Do:**
- Add `fs.authors(path)` — the attesters who have entries under a path, bounded and paged.
- Add `list(path, { lens: 'any' })`, labelled `trust: 'unfiltered'`.
- When `FileNotFound` occurs under the default lens, attach an opt-in hint: "3 other attesters have entries at this path: `fs.authors('/')`".
- Vendor the missing indexer views into `efs.raw`.

**Tradeoff.** This creates a spam-shaped surface. It has to stay visibly separate from lens resolution, so that discovering content never silently means trusting it. That separation is also what keeps a human in control of whose content they see. Scans must be bounded.

**Tests:** on a fork, attester B writes `/x` and a read-only client then:
- gets `FileNotFound` with the hint;
- sees B in `authors('/')`;
- still can't read `/x` until it uses `lens: B`.

### 5. One input vocabulary and one error vocabulary across the SDK

**Problem.** The `lens` option has three different types across namespaces, and some methods take paths while others take UIDs, with no public path→UID resolver. Wrong-shaped input surfaces as raw `TypeError` or viem errors. Error codes collide, and local-chain wiring is a manual chore.

**Existing mechanisms:**
- `resolveLens`
- `resolvePathToAnchor`, which is exported but not on the client
- `EfsError.code`
- `classifyError`
- the `NotImplemented.alternative` field

**Do:**
- Accept `Lens | Address | Address[]` everywhere through one normalizer.
- Accept a `Target = path | UID` and resolve it.
- Expose `fs.resolve(path) → { anchorUID, dataUID, placementUID }`.
- Validate input at the boundary and throw `InvalidArgument` with the expected shape.
- Give each error class a unique code, and have `classifyError` wrap read-path RPC failures as `RpcError`.
- Add `deploymentFromIndexer(publicClient, indexerAddress)`, which reads every UID and address from on-chain getters.
- Make `deployments` merge into the built-in map rather than replacing it.

**Tradeoff.** This changes the public API, which is allowed pre-1.0 and is mostly additive. If Nanda and Arcade don't depend on these namespaces, treat it mainly as a v2 lesson.

**Tests:**
- A table test that calls every namespace with every lens form.
- A test that every public method rejects wrong-kind input with an `EfsError`.
- Error codes are unique per class.
- `deploymentFromIndexer` on a fork equals the hand-built config.

## 4. What already works and should be kept

- **Write errors are excellent.** They name the problem precisely, give the next step, and are honest about partial state (`WriteNotSentError` lists the layer, the unsent attestations and how many landed). This is the model to copy everywhere else.
- **Lens resolution is consistent.** The SDK and the `web3://` router agreed on every path I checked, including the file/folder name collision. `ReadResult` carries `resolvedBy`, `trust` and `via`, so attribution is always explicit.
- **Verification is clearly split.** `read` returns bytes plus a verdict; `readText` fails closed. Results carry status words an agent can branch on.
- **Receipts and refs are explicit about type and origin:**
  - `DataRef` vs `PathRef` (distinct types)
  - `profile: 'efs/v1'` and `chainId` stamped on refs
  - write receipts that separate `roles` (author, signer, payer)
- **Input validation happens before any transaction.** Name checks and the size cap fire before anything is sent.
- **Unfinished features are honest.** `NotImplemented` includes an alternative, and reserved config options throw instead of being silently ignored.
- **The test and gate infrastructure is in good shape.** Both suites are fast and green. The pinned fork gives reproducible addresses, the seed is idempotent, the multi-port workflow for parallel agents works as documented, and the deployment-drift and docs checks exist.
- **Humans can inspect everything.** Every record is a public EAS attestation, and the router serves `web3://`.

## 5. Where each finding belongs

**Worth fixing in v1** (it is the Nanda/Arcade bridge):
- §3.1 stale entry docs, Sepolia address source, verify script, `push-to-client` disclosure (all cheap)
- §3.2 heal or reseed the malformed and mirrorless data, add a `NoMirrors` error code, add a health check
- §3.3 reconcile-on-retry and a no-op rewrite, plus `plan` if Nanda or Arcade write through the SDK
- the `Lens` crash in `mirrors.list`, which is a one-line normalizer fix

**Lessons for v2** (send to the efsv2 Core, SDK v2 and contracts-v2 owners as recommendations):

- **(a) Per-file metadata cost.** Storing each file property as its own anchor + PROPERTY + PIN triple was about 75% of the gas for a 1 KB file. Measure metadata cost before committing to the record shape.
- **(b) Idempotent writes from the start.** Make writes idempotent and reconcilable as a protocol and SDK property — deterministic identities, plan/apply, "already satisfied" detection — rather than bolting resume on later.
- **(c) "Listed implies readable".** Make this a stated invariant with a test.
- **(d) Discovery is not trust.** Keep them as distinct, named operations.
- **(e) Machine-readable truth.** Have one status and deployment manifest that every repo's docs and the SDK are generated from or checked against; this matches the SDK-v2 plan's "single artifact" thread.
- **(f) Errors as API.** Unique codes, structured `next` and `alternative` fields, and no raw library errors crossing the boundary.
- **(g) One normalizer per input concept** (lens, target, path) across every namespace.
- **(h) A real adapter surface.** v2 adapters (CLI, MCP) should come with a `describe()` / capabilities manifest and JSON output. The SDK-v2 Kanban card already lists native, CLI, MCP and HTTP adapters, and the v1 experience (about 10 ad-hoc scripts and 40 lines of wiring) confirms it's needed.

**Not worth pursuing:**
- Changing v1 contract errors or schemas (deployed, frozen, and v1 data is disposable).
- Reducing v1's transaction count (it's bound by the protocol: UIDs only exist after mining).
- Building a v1 CLI or MCP (v2 is already planning adapters).
- A full terminology cleanup across v1 specs and ADRs. Fix only the auto-loaded entry docs and the Glossary's wrong DATA definition; the Kanban card "Fix contracts spec drift" already covers the rest if anyone wants it.
- Rethinking the lens-visibility default itself (it's by design; discovery is the fix).
