# Managed upgrade foundation verification — 2026-09-08

**Status:** independently reconstructed local fixture evidence; integrated review approved.
**Scope:** Task 2 of [the implementation plan](upgradeable-foundation-plan.md).
No product repository, public RPC, real key, public deployment or main merge.
Experimental-branch publication shares evidence, not a deployed protocol.
This is not a complete Files MVP, FilesRouter certification or portable authorship.

## Reproduce

From this directory, with the existing local Foundry/Solidity/ethers dependencies:

```sh
npm run test:upgrade
npm run evidence:upgrade
```

The first command does not overwrite the saved sample. The second replaces only
`fixtures/managed-upgrade.json`, and refuses an export larger than 2 MiB. Each
scenario starts an ephemeral-port loopback Anvil with synthetic fixture keys,
zero default accounts, ordinary Cancun code limits and bounded startup, RPC,
receipt waits and lifetime. Cleanup is tested on both success and thrown errors,
including restoring automine. No RPC URL is accepted as input.

The saved [evidence fixture](fixtures/managed-upgrade.json) includes complete raw
before/after/final inventories, source-derived runtime expectations, execution
history, exact submitted calldata and raw receipts, actual byte content,
seven-leaf/root publications, same-block ordering and resource measurements.
It can be rechecked offline using `verifyUpgradeState(snapshot, expected)` for
each member of `snapshots`; all three return `VERIFIED`. This is source-observed
RPC evidence, not an Ethereum consensus, storage-proof or historical-authority proof.

## What was actually retained

All four unchanged candidate Type groups were installed in four separate
transactions, producing 17 cached Types including the intrinsic Type. The
carrier is configured with the actual admitted `ChunkTree/1` Type:
`0xf6c0966e2acc9f6b1bad9ac20f07da3b00cc418aafc8481dedcdc5f35f8767e8`.

Root bootstrap publishes an ObjectGenesis with DIRECTORY meaning and its
publisher-qualified charter Binding. One later transaction publishes exactly:

1. FILE-meaning ObjectGenesis;
2. publisher-charter Binding targeting that Object;
3. the actual ChunkTree Record;
4. FileRevision targeting that File Object and ChunkTree;
5. revision-head Binding targeting that FileRevision;
6. DirectoryEntry from the chartered root, named `note.txt`;
7. name-slot Binding targeting that DirectoryEntry.

The meanings, purposes and roles use the formulas in
[Files §§3.1/4.1](../../Designs/efsv2/hierarchical-files-and-folders.md), with the
domain strings from the candidate
[encoding registry](../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md).
Tests assert independent literal meaning/purpose/role values, decoded author,
and independently derived Binding keys and exact current targets. Fixture salts
are deterministic and authors are synthetic; neither is a production identity recipe.

Exact bytes `EFS upgrade foundation\n` are staged separately. Before the metadata
transaction the carrier has those bytes but Core has no corresponding ChunkTree
Record. Staging is not file publication and these are not one-wallet-approval
UX measurements.

Counts are ordered Records / Envelopes / Types / Principals / admissions /
batches / posting keys / Binding keys:

| Checkpoint | Counts |
| --- | --- |
| Four groups | 4 / 4 / 17 / 1 / 4 / 4 / 7 / 0 |
| Root and seven-leaf file, U1 | 13 / 6 / 17 / 1 / 13 / 6 / 47 / 4 |
| Same retained state, U2 | 13 / 6 / 17 / 1 / 13 / 6 / 47 / 4 |
| One fresh U2 Object admission | 14 / 7 / 17 / 1 / 14 / 7 / 48 / 4 |

The entire retained EFS inventory is equal across the upgrade, excluding only
observation pins. Exact bytes, U1 consumed/unconsumed nonces, all Binding heads,
histories, lifecycle and packed posting words survive. U2 presentation labels
are independently read at the post-upgrade basis as `Core U2` and `Carrier U2`.
Original batch revision bits remain `[1,1,1,1,1,1,2]`; nothing is relabelled U2
or coerced to U1 to make reconstruction succeed.

## Source and execution verification

The runner compares every consumed compiler artifact's bytecode, links and
immutable references with the matching full compiler output. It checks metadata
source hashes against both compiler input bytes and local source files. Compiler
binary/input/output hashes, artifact hashes, source/support-code hashes, candidate
inputs, dependency lock and exact tool versions are retained. Solidity is 0.8.30,
optimizer 200, via-IR, Cancun; OpenZeppelin is 5.6.1, ethers 6.15.0, Node 26.0.0,
Foundry/Anvil 1.7.1. The code source is the approved Task 1 implementation,
`00588b4`, carried through the assigned base `ec0579d` and controller tag-canary
commit `f5256df`; the refreshed sample checkout HEAD is Task 2 `aafc5c0`. The
support-file hashes identify the then-uncommitted review polish exactly.
Preserved dirty Binding work was not
edited or promoted by this task.

Expected installed code is patched from compiler link and immutable locations,
using source-derived inputs and predicted CREATE addresses; observed code is
never copied into the expected runtime. For the stock proxy, `_admin` is opened
from the actual installed runtime at the compiler's immutable location (this
build: 32 bytes at byte offset 7), independently of the admin storage slot or
controller getter. Both real ProxyAdmin runtimes and `owner()` values, both
implementation slots/runtimes/codehashes and endpoint configurations are checked
at the same block-hash pin.

The independent execution reader checks the complete 21-word/672-byte tuple,
recomputes its ID with the `id` field zeroed, reconstructs configurations and
checks source-pinned historical component membership. Each original batch must
match its original synthetic operator basis and actual Core implementation
codehash, and occupy `(activationAdmissionHigh[r], activationAdmissionHigh[r+1]]`.
Activation blocks are nondecreasing, not strictly increasing.

A separate managed-chain scenario mines a U1 Object admission at transaction
index 0 and U2 activation at index 1 of block 11. U2 captures admission high 3;
that block's earlier batch remains revision 1 and independently verifies. No
block-only revision inference or log-based reconstruction is used.

`verifyState` and `readState` retain their revision-one-only defaults. The sole
shared change extracts an explicit batch-policy entry; identity, bodies, typed
references, folds, lifecycle and indexes share the original reconstruction.
Missing history returns `UNKNOWN`/`PARTIAL` after raw integrity checks; valid
bytes with a substituted Record ID still return `INVALID`, even without history.
History-independent batch-shape checks run before history lookup: revision zero
is intrinsically `INVALID` with either complete or absent execution history.
Missing raw snapshots and interrupted collections preserve UNKNOWN and any
attempted basis. This never manufactures ABSENT or authenticated authority.

## Actual transaction and deployment costs

All actual transaction gas limits are at most 16,777,216. The block limit is
33,554,432 solely to hold the two bounded same-block transactions. There is no
relaxed code-size flag. These are this fixture's receipt measurements, not a
general FilesRouter estimate; signature calldata can vary intrinsic gas by a
few dozen between runs. Exact sample values are in the fixture.

| Operation | Gas in the saved sample |
| --- | ---: |
| Atomic initialized proxy-pair bootstrap | 2,546,779 |
| Group 1 / Group 2 | 10,551,055 / 6,706,092 |
| Group 3 / Group 4 | 14,541,443 / 7,283,101 |
| Root Object + charter | approximately 3.24 million |
| Separate 22-byte staging | 218,668 |
| Seven-leaf metadata transaction | 14,150,093 |
| Atomic U1→U2 including both presentation migrations | 689,859 |

The sampled seven-leaf transaction has **2,627,123 gas remaining** below the cap.
The third group is more expensive than the file publication; groups cannot be
combined merely because the unit-test function can run them together.

| Component | Runtime bytes | Full initcode bytes including args |
| --- | ---: | ---: |
| FixtureDeployment | 9,402 | 9,469 |
| PreparationHelper | 18,805 | 18,831 |
| UpgradeAdmissionLibrary | 24,246 | 24,278 |
| Core U1 / U2 | 12,774 / 13,229 | 13,438 / 13,893 |
| Carrier U1 / U2 | 7,637 / 7,999 | 8,273 / 8,635 |
| Core / carrier stock proxy | 761 / 761 | 6,207 / 3,007 |
| Each actual ProxyAdmin | 879 | 1,120 |

All are below 24,576-byte runtime and 49,152-byte full-initcode ceilings.
The admission library has only **330 bytes of runtime headroom**. No Solidity
contract changes were needed for Task 2.

## Negative evidence and bounds

The managed runner requires the exact decoded revert cause (and exact CAS
arguments) from an immediate preflight of the same calldata, then an actual
failed receipt. This is stronger than status-zero alone, but is not a trace-based
proof of mined revert data. Failed operations leave the reconstructed state and
nonce behavior unchanged:

| Case | Specific cause |
| --- | --- |
| Prepared U1 operation crossing U2 | `FixtureRevision()` |
| Signed publication modified afterward | `FixtureAuthorization()` |
| Replayed consumed nonce | `FixtureNonce()` |
| Signed malformed body | `InvalidBody(1)` |
| Existing root Object used where ChunkTree Type is required | `E_REF_UNSATISFIED(0,1)` |
| Existing charter, real predecessor, stale expected revision | `ErrCasRevision(exactKey,99,1)` |

Independent snapshot mutations cover substituted valid bytes/ID, group bytes,
Binding head, posting word, proxy runtime, implementation slot, immutable admin,
actual admin owner, and historical codehash even after recomputing the set ID.
They return `INVALID`. Deleted history returns `UNKNOWN`, with raw integrity
still checked. A local test-only controller storage mutation inflates revision
count to 17: collection stops with `UNKNOWN`, rather than allocating or querying
an unbounded history. U2-only state is rejected by both legacy APIs specifically
for its revision, not an incidental mismatched authority expectation.

Limits: shared raw collection has 4,096 rows, 50,000 work units, 256 KiB per RPC
response and 16 MiB total. Execution collection permits 16 revisions, 128 RPC
operations, 64 KiB per response and 1 MiB total. The sampled final raw collection
uses 288 operations / 321,104 response bytes / 176 rows; execution uses 18
operations / 10,900 bytes. Export is bounded at 2 MiB.

## Findings for the controller / next bounded join

- Core's ABI omits linked-library/body errors. Consumers need the emitted
  Core, UpgradeAdmissionLibrary and PreparationHelper error fragments to decode
  failures such as InvalidBody, wrong-Type references and exact CAS failure.
- Foundry full compiler input can retain absolute keys for sibling imports while
  artifact metadata uses relative paths. Resolve that mapping explicitly and
  check the bytes; do not drop source comparison. Preserve original metadata in
  the artifact hashes. Checksum address spelling must not alter runtime bytes.
- Both admission high and full execution tuple are needed for same-block
  historical attribution. A current revision getter is insufficient evidence.
- The next slice should measure real atomic rename/move masks and then join
  retained Core evidence to an explicit Files Lens and browser explanation.
  Keep publisher-qualified charter/current-head selection, competing authors,
  missing/tampered inputs and exact-Type evolution visible. Measure that slice's
  actual transaction cap before adding router/auth/view overhead to this one.

This proves controlled fixture upgrades and structural/reference/Binding
atomicity, not NOREPLACE, Files authorization/route semantics, one real-wallet
approval, portable authors, malicious-admin safety, arbitrary storage-layout
compatibility, production governance or a browser Files journey.

## Controller verification and review closeout

The final integrated review covers only the new foundation increment
`83cbec4..a81d1ef`, including implementation `00588b4`, managed evidence
`aafc5c0`, correction `2b29671`, canaries and design integration. It is approved
for experimental-branch publication with **no remaining actionable findings**.
It does not approve older branch history, the separately preserved dirty
Binding-read increment, a main merge or production deployment.

The controller independently ran:

- New foundation Forge suite: **14/14 PASS**.
- Current Core Forge suite: **162/162 PASS**.
- All current Core and foundation Node files: **79/79 PASS**, including
  **11/11** managed-reader checks and both direct-host canary scenarios.
- All three retained snapshots through the independent reader offline:
  **VERIFIED / VERIFIED / VERIFIED**.
- Whitespace, design tri-sync and generated decision-rollup checks: pass.

Broad worktree runs include unfinished local Binding work. Passing those tests
does not turn that work into reviewed or remotely published code. The new
contracts and explicit shared seams have their own scoped reviews.

Task 1 and Task 2 received independent spec/quality reviews. A separate scoped
review confirmed the revision-zero classification and exact error-argument
corrections; no new breakage was found. The final reviewer inspected the whole
new increment and independently matched all 28 compiler-source pins, all 12
support pins and the dependency lock, checked saved sizes/gas and retained
histories, and found no additional issues. Reviewers did not repeat the
controller's suites or represent them as independent audit runs.

Two reversible engineering rulings were made during implementation:

1. **Share reconstruction through an explicit batch-policy extension.** This
   avoids two diverging identity/body/Binding verifiers; the old reader remains
   revision-one-only. Cost if wrong: a shared-reader regression affects both
   experiments, so legacy-default regressions are required and retained.
2. **Add admission high-water to execution activation history.** Block alone
   cannot separate an old write and later activation in the same block. Cost
   if wrong: rework this disposable tuple/reader; no permanent EFS ABI or
   deployed data depends on it.

The next gate is the existing [consumer checkpoint](consumer-checkpoint.md):
measure complete routed creation and atomic rename, then join real Bindings,
explicit Lenses, authored-current tags and the shared SDK to a static browser.
Compatibility Views, real wallets, full authority and export/recovery remain
separate acceptance work. No additional design polling is needed for this
local next slice.

## September 9 carrier-vector diagnostic

A later read-only-source probe at `219bf61` used the same source-pinned managed
runner and unchanged carrier/kernel to stage the independent
[known ChunkTree bodies](../2026-09-04-mvp-c0-foundation/fixtures/chunk-tree-known.json).
It reused literal roots/bodies and documented `i mod 251` payloads, recomputing
only RecordIds for the actual configured temporary ChunkTree Type instead of
the vector file's synthetic Type. The vector-file keccak was
`9ab1eda24dc4c46e7fecdab616d8320acb9da9a62e602da90dd13865e1bd3126`.

| Payload | Merkle chunks | Staging receipt gas | Result |
| --- | ---: | ---: | --- |
| empty | 0 | 196,555 | staged and read byte-exactly |
| hello, 5 bytes | 1 | 218,440 | staged and read byte-exactly |
| 4,097 bytes | 2 | 3,154,347 | staged and read byte-exactly |
| 8,193 bytes | 3, odd tail promoted | 6,069,510 | staged and read byte-exactly |
| 16,385 bytes | 5 | 295,786 | rejected; hasFixtureBytes remained false |

All five observations independently verified the Core/execution context.
No ChunkTree Record was admitted by staging alone. After the populated pair
upgrade, all four successful bodies still read byte-exactly. Managed node
cleanup succeeded. The source-pinned carrier declares a 16,384-byte cap; this
probe measured its over-cap refusal, not successful execution at the exact
cap. Existing gas/runtime limits were unchanged.

This ad hoc characterization did not add to the persisted Node-test total or
refresh the historical fixture JSON. Reproduction: with the existing
`compileUpgrade`/`withUpgrade` runner, iterate those five known vectors,
`ordinaryRecord(configuredTreeType,body)`, `lab.stage`, `readUpgradeState`,
`hasFixtureBytes` and exact `lab.readBytes`; then upgrade and re-read every
successful body. It is not a file-publication or real-wallet test. The fixture
validates multi-chunk geometry but stages/returns an entire small body: it does
not yet provide independent chunk ingestion, range reads or large-file UX.
