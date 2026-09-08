# Upgradeable EFS foundation implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development to
> implement each reviewed task, with the specification and explicit scope.

**Goal:** exercise upgrades against the actual EFS Store and retained evidence.
**Architecture:** a namespaced EFS host and bounded carrier behind standard
Transparent proxies; a local fixture controller owns their ProxyAdmins and
append-only execution-set history. Reuse existing admission/type/Binding logic.
**Tech Stack:** Solidity 0.8.30, Foundry 1.7.1, Cancun, optimizer 200, via-IR;
OpenZeppelin contracts 5.6.1; Node 26 and ethers 6.15.0 for independent checks.
**Spec:** `README.md` in this directory and
`Designs/efsv2/testnet-files-mvp-plan.md` in the vault.

## Global Constraints

- Local disposable prototype only. No public RPC, real secrets, product repos,
  main merge, public deployment or permanent protocol/profile changes.
- Reuse StateStore/StateKernel and real Type/body/Binding validation. Do not
  replace them with a shadow filesystem or silently change existing C0 bytes.
- Existing `StateKernel.admit` remains revision-one-only; only the explicit
  new revision-aware entry accepts another positive checked ordinal.
- Operator-signed synthetic authors are labelled fixture authority, not full
  C0/portable EFS authority or real-wallet UX evidence.
- Runtime <=24,576 bytes; initcode <=49,152 bytes; each managed-chain
  transaction <=16,777,216 gas. No relaxed Anvil/Foundry production size claims.
- Preserve the pre-existing dirty Binding-read increment. Only touch the
  named shared kernel file; test helpers/configuration go in this new folder.
- A test must name the break it catches and derive expected outcomes without
  copying the implementation's results. Record meaningful red/green evidence.

### Task 1: Genuine EFS upgrade host and contract regressions

**Files:** modify `Reviews/2026-09-05-c0-core/src/StateKernel.sol` only for the
explicit revision seam. Create under this directory: `package.json`,
`package-lock.json`, `.gitignore`, `foundry.toml`, `src/UpgradeStorage.sol`,
`src/UpgradeAdmissionLibrary.sol`, `src/UpgradeableFixtureCore.sol`,
`src/UpgradeableFixtureCarrier.sol`, `test/FixtureDeployment.sol`,
`test/UpgradeFoundation.t.sol`. A focused test-fixture helper may be split into
`test/FixtureInputs.sol` to keep the test readable.

**Interfaces:** consume existing `StateKernel.Init`, `Publication`,
`VerifiedContext`, `AdmitResult` and `StateStore.Store`. Add exactly this
internal seam, preserving the original entry as the revision-one wrapper:

```solidity
function admitAtRevision(
    StateStore.Store storage s,
    VerifiedContext memory v,
    Publication memory p,
    Preparation.Config memory config,
    uint32 activeRevision
) internal returns (AdmitResult memory);
```

Reject `activeRevision == 0` or mismatch with `v.revisionOrdinal`. Retain all
existing atomic journal, validation, replay and batch packing behavior.
The new linked admission library calls this entry; the old AdmissionLibrary
continues calling the old one.

The host exposes raw read-only inventory/getters equivalent to StatefulHarness
for counts, bootstrap, records, Types, envelopes, admissions, bindings, batches
and postings. It exposes `currentRevision()` and `revisionAt(uint32)` for the
fixture execution history, retaining full ordered component identities,
activation block and the real Core admission high-water at activation. The
set ID commits this boundary. Test a U1 write and U2 activation in the same
block; block-only inference is insufficient. Every returned original batch keeps the original
revision ordinal; do not use legacy revision-one projections for new batches.

The fixture write API is:

```solidity
function executeFixture(
    StateKernel.Publication calldata publication,
    uint32 expectedRevision,
    uint64 nonce,
    uint64 deadline,
    bytes calldata signature
) external returns (StateKernel.AdmitResult memory);
```

EIP-712 name `EFS Upgrade Foundation`, version `1`, current chainId and host
proxy address. Struct:
`FixturePlan(bytes32 publicationHash,bytes32 executionSetId,uint64 nonce,uint64 deadline)`.
`publicationHash = keccak256(abi.encode(publication))`. Recover the configured
fixture operator; the actual author in the signed publication remains an
explicitly synthetic fixture author. Consume nonce only with the successful
atomic state transition. Require nonzero unexpired deadline and active expected
revision, even if the same implementation returns in a later upgrade.

For carrier data, expose a separately named operator-signed fixture operation
whose EIP-712 payload also binds exact tree ID/body/data digest, execution set,
nonce and expiry; use the existing C0ChunkTree validator, bounded upload and
immutable keyed bytes. Do not describe detached byte staging as file publication.

- [ ] Write failing contract regressions before new production logic. Start
  with the legacy revision-two rejection and the new path accepting a real
  group under revision two with the original batch packing. A reverting stub
  can make a new-interface red executable; remove the stub when implemented.
  Extend to populated U1→U2 preservation, stale-signature rejection, malformed
  body/wrong reference rollback, nonce replay, unauthorized sender, locked
  implementation, one-time bootstrap, partial endpoint upgrade and atomic
  failed upgrade. Explain the expected failure in the report.
- [ ] Implement the revision wrapper/seam without copying the kernel body.
  Implement separate ERC-7201 namespace roots for the unchanged EFS Store,
  fixture control and U2 presentation extension; verify the roots independently.
- [ ] Use actual OpenZeppelin Transparent proxies/ProxyAdmins. The test fixture
  deploys and initializes both endpoints atomically; explicit bootstrap roles
  account for factory msg.sender and actual admin creation order. Record the
  ordered Core/carrier implementation identities, fixed libraries/helper and
  expected actual ProxyAdmin/controller addresses. No public actual-admin getter
  is assumed on the stock proxy; keep source/runtime verification separate.
- [ ] From U1, guard ordinary writes using local slot/self checks and bounded
  peer/configuration reads. Compare the whole active configuration, not just
  proxy codehash. The fixture controller's normal upgrade path upgrades both
  implementations and activates their new execution set in one transaction.
  Partial/direct-upgrade test paths belong in the fixture, not the host API.
- [ ] U2 adds a persistent presentation label in its separate namespace. Old
  Types, Records, bindings, posting words, byte contents and nonce state remain.
  No arbitrary-layout-change safety or protection from malicious admins is
  claimed. Test a migration that reverts and require rollback of both proxy
  implementation changes and the activation history.
- [ ] Run focused Forge tests during iteration, the new suite once before
  committing, and the existing StateKernelTest baseline. Use the installed
  solc binary through `--offline --use` when needed. Stage exact paths only.
  Record red/green output, warnings, source changes and missing evidence in
  the task report. Commit only this task's named changes; no pushes.

### Task 2: Independent managed-chain validation and usable evidence

**Files:** create `scripts/local-upgrade.mjs`, `reference/upgrade-reader.mjs`,
`test/upgrade-chain.test.mjs`, `verification.md` and a bounded evidence-report
fixture under this directory. Update `package.json` scripts. Consume the exact
ABI emitted by Task 1; do not create another contract or authoritative store.
One additional shared change is permitted in
`Reviews/2026-09-05-c0-core/reference/state-reader.mjs`: extract its existing
batch-evidence check into an explicit callback/policy seam for the new fixture
reader, preserving the old `verifyState`/`readState` revision-one-only defaults.
All ordinary identity/body/reference/fold/index reconstruction remains shared.
Add focused tests that prove the legacy entry still rejects revision two.
Do not duplicate the 200-line reconstruction body or rewrite batch revisions
to trick the legacy verifier.

**Interfaces:** the host's raw inventory, fixture operator-signed operations,
execution history, and generated ABI/source pins. Reuse `fixtureInputs`,
`publication`, `groupLeaf` and the independent group/body decoder from the
existing experiments, but preserve revision histories instead of coercing
  them into the older verifier's revision-one contract.

Task 1's fixture history returns the complete ordered ExecutionSet, including
activation block and `activationAdmissionHigh` read from actual Core counts at
activation (initially zero). Its batch authorityBasis is the configured operator address
encoded as uint256; authorityCodehash is the actual fixture Core implementation
runtime codehash. The full execution-set ID is separately bound by the signed
plan and checked revision history. Neither field proves portable author authority.
Validate original batch revision, execution membership and admission interval
against independently checked history, never against only the current revision.
Revision r's fresh admissions occupy `(activationHigh[r], activationHigh[r+1]]`
(or through the snapshot high for the current revision). Also check nondecreasing
activation blocks, but never require U1 batches to have a strictly earlier block:
a U1 write and U2 activation can legitimately share a block. Test this case.
Bound history collection and preserve raw byte/ID checks when history is missing.

- [ ] Write failing Node tests for substituted record bytes/ID, missing
  historical revision, tampered implementation/admin evidence and a stale
  prepared operation crossing U1→U2. Expected results are literal
  `INVALID`, `UNKNOWN`, or verified exact matches, not a generic success flag.
- [ ] Build a managed loopback-only Anvil runner with its own ephemeral port,
  synthetic operator keys, normal size/gas ceilings and guaranteed cleanup.
  Link actual compiler artifacts; independently compare installed runtimes,
  immutable admin openings and actual `ProxyAdmin.owner()` at a pinned basis.
  Capture compiler/source/dependency hashes, source commit and actual receipts.
- [ ] Populate real Type groups and object/Binding/content data. Export the
  retained state, upgrade, compare unchanged legacy IDs/bytes and new execution
  history, then admit valid U2 data and reject invalid/stale/replayed actions.
  Independent reconstruction of IDs, body validation, bindings and postings
  must be exercised; the producer's getters alone are not the oracle.
  Install the four existing groups in separate bounded publications. Use the
  actual admitted `ChunkTree/1` Type as the carrier's configured treeType, not
  the small synthetic Type constant used by the contract unit fixtures.
  Include one complete small-file metadata publication after root bootstrap:
  File Object + publisher charter Binding + ChunkTree + FileRevision + revision
  head Binding + DirectoryEntry + name-slot Binding. Stage exact bytes
  separately, and measure this seven-leaf publication as one actual transaction.
  This proves structural/reference/Binding atomicity and cost, not FilesRouter
  semantic certification, `NOREPLACE`, full auth or one wallet approval.
- [ ] Record measured deployment/runtime/transaction costs and the exact
  accepted/rejected cases. Update the parent design with newly discovered
  gotchas and the next bounded Files/Lens/browser join. This task does not
  label the foundation experiment a complete Files MVP.

## Preflight and handoff

Task 1 supplies the contract ABI/runtime; Task 2 consumes it. Both touch only
the local experiment's package scripts after Task 1 finishes. Neither changes
the old Binding read files. Product/browser evolution continues after this
foundation checkpoint through a separately scoped task using the same Store.
The controller verifies evidence and requests independent review before any
completed feature-branch publication.

## Controller refinements during execution

The SDK consumer review required complete block-pinnable execution history,
not just ordinal getters. Independent-reader planning exposed the same-block
upgrade case, so Task 1 also retains the actual admission high at activation in
the signed execution commitment and tests that boundary. This is a fixture-local
extension of the planned full-history requirement, not a permanent ABI choice.
