# B Signed-Claim Archive Implementation Plan

> **Execution:** use `superpowers:subagent-driven-development` in the existing B successor, one implementer per task and root-run gates. Root owns review, compiler/chain leases and exact-file publication. Workers do not spawn subagents, compile, launch a chain or change Git state without a specific root lease. Preserve all existing prototype workspaces. This is disposable evidence, not protocol adoption.

**Goal:** Add the reviewed EOA signed-claim archive seam to Road B, prove the three portability failures in one joined semantic test, and choose packed rows versus an immutable code vector using matched paid measurements.

**Architecture:** A new contract beside `Ledger` verifies the existing B `PublicationIntent` digest and retains the complete immutable logical `Ledger.Action[]`, claim-local body coverage, a global Record-ID body cache, and append-only signed-claim postings. It never calls or edits `Ledger`; selected bytes reach the destination only through an ordinary, separately authorized `Ledger.publish`/`execute` call. Task 1 lands the semantic archive on packed rows; Task 2 adds the code-blob representation, performs a receipt-based comparison, and makes `SignedClaimArchive` inherit the evidence-backed winner.

**Tech Stack:** Solidity 0.8.30, Foundry (`via_ir`, Cancun, optimizer 200), the lab's hand-declared `Vm`, Node.js plus ethers v6 only for ABI/signing in the bounded paid runner.

**Spec:** `planning/Reviews/2026-09-12-efs-path-decision/b-portable-evidence-seam-20260914.md`, read with `portable-evidence-next-gate.md`; implementation base is successor HEAD `1d8356c9de86a488c950abcb3f9f4d17a6126510`, an artifact-only descendant of source pin `b94b57c405ef18b7f259cbd636d685ff96738ce7`. The required-query comparison is complete and independently reviewed PASS; do not rerun it.

## File map

- Create `Reviews/2026-09-12-efs-path-decision/lab-b/src/SignedClaimArchive.sol`: common archive semantics, packed candidate, immutable-code-vector candidate, and final `SignedClaimArchive` alias. Do not modify `Ledger.sol`, `Keys.sol`, or any Core file.
- Create `Reviews/2026-09-12-efs-path-decision/lab-b/test/SignedClaimArchive.t.sol`: the joined three-case semantic test, signature/vector/body/posting/boundary tests, and representation-equivalence tests.
- Create `Reviews/2026-09-12-efs-path-decision/lab-b/test/ArchiveReadConsumer.sol`: test-only paid `actionAt` consumer that emits the returned action hash; it must not store state.
- Create `Reviews/2026-09-12-efs-path-decision/lab-b/script/measure-portable-archive.mjs`: owned-Anvil, sealed-state receipt comparison; output goes only to run-owned `/tmp`.
- Do not update `README.md`, planning reviews, manifests, or selection docs in this implementation. Root publishes the later plan/report on planning `main` after independent output review.

## Root-resolved execution paths

Before running any snippet, root resolves and validates these **absolute** paths once: `efs_archive_tree` (existing B successor), `efs_archive_lab` (its `Reviews/2026-09-12-efs-path-decision/lab-b`), `efs_archive_ethers` (the already-installed ethers-v6 directory) and `efs_archive_node` (the validated Node 26 executable). Snippets use these variables and do not assume the caller's working directory. Missing paths or wrong versions stop the gate; do not install or silently substitute dependencies.

## Global constraints

- Preserve the exact existing types `Ledger.Intent` (7 static ABI words) and `Ledger.Action` (9 static ABI words), `actionsHash = keccak256(abi.encode(actions))`, B `INTENT_TYPEHASH`, and B domain `EIP712Domain(string name,string version)` with name `EFS2-RoadB-Lab`, version `1`.
- `claimId` is the EIP-712 digest. The only positive proof label is `AUTHOR_SIGNATURE_VERIFIED`; it is never source admission, destination admission, typed acceptance, current validity, authority over a destination binding, or an adoption claim.
- EOA signed claims only. Empty signature fails explicitly as `E_SOURCE_UNSUPPORTED`; every other non-65-byte signature fails `E_SIGNATURE`. Enforce low-`s`, `v` 27/28, nonzero recovery, and recovery equal to `source.author`; never query `author.code.length`.
- Bounds are fixed: 1..64 actions; exactly 65 signature bytes; 0..64 body inputs; at most 8,192 aggregate raw body bytes; `msg.data.length <= 37_316` for retention and `<= 18_468` for attachment. These are safety envelopes, not affordability claims.
- Bounded ABI returns remain: `claim` 512 bytes, `actionAt` 288, count 32, posting 64, and `selectedRecord` at most 8,352 bytes.
- Body inputs are unique, in range, and point only to `PUBLISH` or `REUSE`. Validate count, aggregate raw length, duplicates, leaf kinds, and calldata ceiling before copying, hashing, or writing any body.
- For `PUBLISH`, the claimed Record ID is `Keys.recordFromHash(typeId, bodyHashOrRecordId)`; for `REUSE`, it is `bodyHashOrRecordId`. In either case attachment succeeds only when `Keys.record(typeId, body) == recordId`.
- The global cache is `{bool exists; bytes data}` by Record ID so an empty body is representable. Coverage remains a per-claim `uint64` bitmap: bytes cached by claim B do not cover claim A until A explicitly attaches them. Correct reattachment is a no-write; no body or vector is overwritten.
- Creation appends exactly one `(claimId, leaf)` posting for every `PUBLISH`/`REUSE`; retries do not append or redeploy/rewrite a vector. `signedRecordClaim*` reports signed claims only. `signedRecordClaimAt(recordId, ordinal)` is zero-based (`0 <= ordinal < count`), matching B's existing posting getters.
- Expiration is retained and hashed but never blocks archival. Signed realm, code commitment, acceptance profile, and index obligations remain claims, not re-proved facts.
- Do not enforce Ledger action shape, Type existence, references, acceptance, or current policy in the archive. Those may make destination admission fail, but they do not invalidate an authentic signed claim.
- No `Ledger` action, nonce change, acceptance check, binding/CAS, mint, withdrawal, Core change, new trusted ingress, new signature scheme, SDK, or production integration belongs here.
- Destination publication is a separate transaction under current rules and its actual caller is the destination author. Never forward it through the archive.
- Required-query receipts favor B selective and independent output review passed. This experiment does not select B for production or waive missing historical native/source-state proof.
- One root-owned compiler/Anvil slot only; every heavy gate needs a finite root lease, run-owned output **and cache**, process cleanup, a 50 GiB free-disk reserve and 15 GiB total owned-scratch ceiling. Existing successful baseline evidence is retained, not rerun as orientation. Root pins the actual Node 26 and installed ethers-v6 path; no dependency install or implicit toolchain change.
- A Task-1-only handoff still requires the full B regression suite. A timeout before that gate means incomplete/unverified, not a completed archive.

---

### Task 1: Land the packed semantic archive and the joined portability test

**Files:**

- Create: `Reviews/2026-09-12-efs-path-decision/lab-b/src/SignedClaimArchive.sol`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-b/test/SignedClaimArchive.t.sol`
- Reuse unchanged: `src/Ledger.sol`, `src/Keys.sol`, `test/LabBase.sol`

**Interfaces:**

- Consumes exactly:

```solidity
Ledger.Intent
Ledger.Action
ledger.PUBLISH() == 1 // instance getter, used only by tests
ledger.REUSE() == 2 // instance getter, used only by tests
Ledger.intentDigest(Intent, bytes32)
Keys.record(bytes32, bytes)
Keys.recordFromHash(bytes32, bytes32)
```

- Produces the approved callable ABI:

```solidity
contract SignedClaimArchive {
    enum ProofLevel { NONE, AUTHOR_SIGNATURE_VERIFIED }
    struct BodyInput { uint16 leaf; bytes body; }

    function retainSignedClaim(
        Ledger.Intent calldata source,
        Ledger.Action[] calldata actions,
        bytes calldata signature,
        BodyInput[] calldata bodies
    ) external returns (bytes32 claimId);
    function attachBodies(bytes32 claimId, BodyInput[] calldata bodies) external;
    function claim(bytes32 claimId) external view returns (
        Ledger.Intent memory source, bytes32 actionsHash, uint16 leafCount,
        bytes32 r, bytes32 s, uint8 v, uint64 bodyCoverage,
        ProofLevel proof, address firstImporter, uint64 retainedAt
    );
    function actionAt(bytes32 claimId, uint16 leaf) external view returns (Ledger.Action memory);
    function selectedRecord(bytes32 claimId, uint16 leaf)
        external view returns (bytes32 recordId, bytes32 typeId, bool claimBodyAttached, bytes memory body);
    function signedRecordClaimCount(bytes32 claimedRecordId) external view returns (uint64);
    function signedRecordClaimAt(bytes32 claimedRecordId, uint64 ordinal)
        external view returns (bytes32 claimId, uint16 leaf);
}
```

- Add only these diagnostic errors/constants; do not add stronger proof states:

```solidity
error E_BOUNDS(uint8 code); // 1 actions, 2 body count, 3 aggregate bytes, 4 calldata
error E_SIGNATURE();
error E_SOURCE_UNSUPPORTED();
error E_UNKNOWN_CLAIM(bytes32 claimId);
error E_LEAF(uint16 leaf);
error E_BODY_LEAF(uint16 leaf);
error E_BODY_MISMATCH(uint16 leaf, bytes32 expected, bytes32 actual);
uint256 public constant MAX_ACTIONS = 64;
uint256 public constant MAX_BODY_INPUTS = 64;
uint256 public constant MAX_BODY_BYTES_PER_CALL = 8192;
uint256 public constant MAX_RETAIN_CALLDATA = 37_316;
uint256 public constant MAX_ATTACH_CALLDATA = 18_468;
```

- Internal packed vector row is exactly eight storage words, not the naive nine:

```solidity
struct PackedAction {
    uint256 meta; // kind uint8 @ bit 0; expectedRevision uint32 @ bit 8
    bytes32 typeId;
    bytes32 bodyHashOrRecordId;
    bytes32 purpose;
    bytes32 subject;
    bytes32 role;
    bytes32 target;
    bytes32 salt;
}
```

- Common retained state uses exactly these fields; do not add authority/currentness fields or a second mutable copy of the vector:

```solidity
struct ClaimCell {
    Ledger.Intent source;
    bytes32 actionsHash;
    bytes32 r;
    bytes32 s;
    uint64 bodyCoverage;
    uint64 retainedAt;
    address firstImporter;
    uint16 leafCount;
    uint8 v;
    ProofLevel proof; // existence is proof == AUTHOR_SIGNATURE_VERIFIED
}
struct CachedBody { bool exists; bytes data; }
struct Posting { bytes32 claimId; uint16 leaf; }
```

- [ ] **Step 0: Root verifies the pinned successor before any edit**

```sh
test "$(git -C "$efs_archive_tree" rev-parse HEAD)" = \
  1d8356c9de86a488c950abcb3f9f4d17a6126510
git -C "$efs_archive_tree" status --short
```

Expected: the pin matches. Preserve the unrelated untracked `.codex-*` files and the now-committed `required-query-paid-20260914/` packet; do not clean, stash, or stage them.

- [ ] **Step 1: Write the joined failing semantic test first**

Create `SignedClaimArchiveTest is LabBase`; deploy `SignedClaimArchive` in `setUp`. For the initial RED gate, create only a compiling public-ABI stub with the named types/constants/errors and empty implementations. This lets real assertions fail because retention is absent, not because an import is missing. No archive implementation precedes the observed RED gate. Add a helper that signs an arbitrary source intent with the existing B helper and asserts the archive digest matches Ledger before retention:

```solidity
function retain(uint64 sourceNonce, Ledger.Action[] memory actions, SignedClaimArchive.BodyInput[] memory bodies)
    internal returns (bytes32 id, Ledger.Intent memory intent, bytes memory sig)
{
    (intent, sig) = signed(PK_A, ledger, sourceNonce, actions);
    bytes32 h = keccak256(abi.encode(actions));
    id = archive.retainSignedClaim(intent, actions, sig, bodies);
    require(id == ledger.intentDigest(intent, h), "claim id is exact B digest");
}
```

Write one `test_joined_diverged_cas_current_rejection_and_missing_body()` with these exact phases:

1. Advance `eoaA`'s destination `HEAD` for a File to revision 1 with one nonce-0 `ledger.executeSigned` batch containing valid target publication and binding. Then retain its nonce-1 signed full vector `[PUBLISH selected, BIND HEAD expectedRevision=0, PUBLISH unrelated]` with only the selected body. For the failed replay pass three body entries: selected bytes, empty binding bytes, and an empty placeholder for the unavailable unrelated body. The first valid publication reaches the stale binding before leaf 2. Require `Ledger.E_CAS` (preferably exact key, expected 0, actual 1), not just any revert. Snapshot/hash the **full** `ledger.head(bindingKey)` return, counts and source/importer nonces; archive retention and failed replay must leave them unchanged. `headOf` alone omits fields and is insufficient for this assertion.
2. Obtain the selected bytes through `archive.selectedRecord` and publish them separately through `ledger.publish`. That function returns a **Record ID**, not a publication ordinal. Snapshot the fourth `ledger.counts()` result before/after, require it advances exactly once, use the new ordinal for `ledger.evidence`, and require returned Record ID equals the selected Record ID. Destination evidence names `address(this)`, not `intent.author`. The full pre-existing head stays unchanged; ordinary admission effects are expected. Do not call the archive as a forwarding writer.
3. Retain a second signed `PUBLISH(QUOTE, rejectedBody)` claim, flip the mutable destination policy to reject, and assert ordinary `ledger.publish(QUOTE, rejectedBody)` fails `Ledger.E_POLICY_REJECTED`. While the policy is **still rejecting**, destructure `claim(secondId)` and check `AUTHOR_SIGNATURE_VERIFIED`, immutable header/vector, retained body, coverage and discovery postings. Snapshot counts, full head and source/importer nonces immediately before the failed publish and require equality afterward. Restore the test policy only after these archive reads. No claim getter returns a struct on which `.proof` may be called.
4. For the original three-action claim, assert selected leaf 0 is attached and unrelated leaf 2 is explicitly unattached with `body.length == 0`. Clone then omit a leaf, mutate a leaf, and reorder the complete action vector; calling `retainSignedClaim` with the original signature and **zero BodyInputs** must fail `E_SIGNATURE` in all three cases. The test must say in its assertion text that unavailable action tuples—not merely bodies—remain unsupported.

- [ ] **Step 2: Add focused failing tests for every bounded invariant**

Use these exact test names and assertions so review can map them to the seam:

```solidity
test_signature_rejects_empty_bad_v_high_s_wrong_author_and_expired_is_archivable()
test_retry_keeps_first_importer_vector_and_posting_counts()
test_any_account_can_complete_claim_without_changing_first_importer()
test_conflicting_same_nonce_signed_claims_remain_distinct()
test_claim_local_coverage_requires_explicit_attachment_after_global_cache_hit()
test_valid_empty_body_is_present_and_attached()
test_reuse_rejects_conflicting_type_or_body()
test_leaf_63_round_trips_and_wrong_leaf_reverts()
test_staged_attachments_only_set_requested_bits()
test_maximum_vector_and_exact_calldata_ceilings()
test_rejects_zero_actions_65_actions_65_bodies_duplicate_body_leaf_and_8193_bytes()
test_arbitrary_signed_tuples_and_unknown_type_are_claims_not_admissions()
test_record_postings_are_per_leaf_even_for_repeated_record_id()
```

For the exact-ceiling test, construct 64 `PUBLISH` actions and 64 bodies whose raw lengths are 129 bytes for 63 leaves and 65 bytes for one leaf (total 8,192; every length is 1 modulo 32). Assert `abi.encodeCall(retainSignedClaim, ...).length == 37_316`; append one zero byte and low-level call it to assert `E_BOUNDS(4)`. After retaining, assert the equivalent maximum `attachBodies` calldata is 18,468 bytes and an appended byte fails `E_BOUNDS(4)`. Assert leaf 63 equals the original nine fields and `keccak256(abi.encode(rebuiltActions)) == claim.actionsHash`.

For claim-local coverage, retain claim A without bodies, retain claim B for the same Record with the body, then assert A remains uncovered and returns no bytes until an `ArchiveActor` helper contract calls `attachBodies(A, ...)`; assert A's `firstImporter` remains the original caller. Use a **test-local** minimal cheatcode interface for `record`/`accesses` to require an empty write-slot set for a fully attached correct attachment retry and an identical retention retry. When setting A's uncovered claim bit after the global-cache hit, require no cached-byte slots are written. No brittle gas constant and no `LabBase.sol` edits. Posting counts remain one per PUBLISH/REUSE **leaf**, including repeated Record IDs within a claim, and unchanged by either retry.

The arbitrary-tuple test uses nonzero values in all seven bytes32 fields, a high-bit nonzero uint32 revision and an unknown but representable uint8 kind. Construct an Intent manually and sign through `signIntent` (do not ask Ledger's current acceptance-profile helper to accept the invalid tuple). Retain with no bodies, reconstruct every field and actionsHash, and show an unknown-Type PUBLISH is discoverable only as a signed claim. No Ledger admission is implied. Carry these exact fixtures into both representation tests in Task 2.

Explicitly include nonempty 64-byte and 66-byte signatures, zero recovery, bad v/high-s/wrong author, non-record body leaves and out-of-range leaves. The empty signature alone is `E_SOURCE_UNSUPPORTED`; other malformed signatures are `E_SIGNATURE`. Keep local log-recording/access-recording interfaces and actors in the new test file.

- [ ] **Step 3: Root runs the red gate before implementation**

Root only, in a fresh run-owned build directory:

```sh
cd "$efs_archive_lab"
efs_archive_run=$(mktemp -d /tmp/efs-b-archive-red.XXXXXX)
FOUNDRY_OUT="$efs_archive_run/out" FOUNDRY_CACHE_PATH="$efs_archive_run/cache" forge test --use 0.8.30 --offline --match-contract SignedClaimArchiveTest -vv
```

Expected: compilation succeeds; the joined test fails at its real archive/digest assertion against the non-implementing stub. A missing import, syntax error, unavailable compiler or unrelated failure is not the RED result. Root records the exact failing assertion before authorizing implementation.

- [ ] **Step 4: Implement the minimal common archive plus packed vector**

Implement `SignedClaimArchiveBase` for all validation, digest, body cache, coverage, getters, and postings. Implement `_storeVector`/`_loadAction` virtually; `SignedClaimArchivePacked` writes/reads the eight-word `PackedAction`. Initially make the exact public name a one-line alias:

```solidity
contract SignedClaimArchive is SignedClaimArchivePacked {}
```

Digest code must be byte-for-byte equivalent to Ledger, but local so the archive does not trust a mutable/external Ledger call:

```solidity
bytes32 private constant INTENT_TYPEHASH = keccak256(
    "PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)"
);
bytes32 private immutable DOMAIN_SEPARATOR = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version)"),
    keccak256("EFS2-RoadB-Lab"),
    keccak256("1")
));
function _intentDigest(Ledger.Intent memory x, bytes32 actionsHash) private view returns (bytes32) {
    bytes32 sh = keccak256(abi.encode(INTENT_TYPEHASH, x.realmId, x.coreCodeCommitment,
        x.author, x.nonce, x.deadline, x.acceptanceProfile, x.indexObligations, actionsHash));
    return keccak256(abi.encodePacked(hex"1901", DOMAIN_SEPARATOR, sh));
}
```

Retention order is fixed: calldata/action/signature/body-input bounds; compute `actionsHash`/digest; split and verify the EOA signature; validate all body descriptors without writes; if new, write immutable header/vector and append record postings once; then attach validated bodies and set only this claim's bits. If the claim exists, skip header/vector/postings but still permit missing correct bodies to be attached. Never reject solely because `block.timestamp > source.deadline`.

For each body input, derive `recordId` from the signed action, compute `actual = Keys.record(action.typeId, input.body)`, and revert on mismatch before any cache write. Use two passes: the first validates every descriptor and hash; the second performs cache/bitmap writes. If cache exists, do not assign `data`; only set the claim bit if absent. `selectedRecord` must return cached bytes only when that claim's bit is set.

- [ ] **Step 5: Root runs focused compile/test and ABI gates**

```sh
cd "$efs_archive_lab"
efs_archive_run=$(mktemp -d /tmp/efs-b-archive-task1.XXXXXX)
FOUNDRY_OUT="$efs_archive_run/out" FOUNDRY_CACHE_PATH="$efs_archive_run/cache" forge build --use 0.8.30 --offline --sizes
FOUNDRY_OUT="$efs_archive_run/out" FOUNDRY_CACHE_PATH="$efs_archive_run/cache" forge test --use 0.8.30 --offline --match-contract SignedClaimArchiveTest -vv
FOUNDRY_OUT="$efs_archive_run/out" FOUNDRY_CACHE_PATH="$efs_archive_run/cache" forge inspect SignedClaimArchive abi | rg 'retainSignedClaim|attachBodies|claim|actionAt|selectedRecord|signedRecordClaimCount|signedRecordClaimAt'
FOUNDRY_OUT="$efs_archive_run/out" FOUNDRY_CACHE_PATH="$efs_archive_run/cache" forge test --use 0.8.30 --offline -vv
```

Expected: build exit 0; all archive and full regression tests pass; all seven approved functions appear. Record actual runtime size; do not call it affordable or production-ready. Root may combine the targeted and full run when the latter reports the same archive tests; do not duplicate identical passing gates merely for ceremony.

---

### Task 2: Compare packed rows with immutable code vectors and select the alias

**Files:**

- Modify: `Reviews/2026-09-12-efs-path-decision/lab-b/src/SignedClaimArchive.sol`
- Modify: `Reviews/2026-09-12-efs-path-decision/lab-b/test/SignedClaimArchive.t.sol`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-b/test/ArchiveReadConsumer.sol`
- Create: `Reviews/2026-09-12-efs-path-decision/lab-b/script/measure-portable-archive.mjs`

**Interfaces:**

- `SignedClaimArchivePacked` and `SignedClaimArchiveCodeBlob` inherit the identical common external ABI and semantics from Task 1.
- The code-vector payload is `hex"00" || abi.encode(actions)`. The leading STOP byte avoids an executable or EIP-3541-sensitive first byte. For 64 actions its runtime is exactly `1 + 32 + 32 + 64*288 = 18_497` bytes, below EIP-170's 24,576-byte limit.
- First action starts at code offset `65`; action `leaf` starts at `65 + 288*leaf`. `_loadAction` copies exactly 288 bytes and `abi.decode`s them as `Ledger.Action`.
- `ArchiveReadConsumer.readAction(address archive, bytes32 claimId, uint16 leaf)` calls `actionAt`, computes `keccak256(abi.encode(action))`, emits `ActionRead(claimId, leaf, actionHash)`, and writes no storage.

- [ ] **Step 1: Add the code-blob representation and equivalence tests**

Add a private deployment carrier whose constructor returns runtime bytes, plus a mapping from claim ID to blob address:

```solidity
contract ActionCodeBlob {
    constructor(bytes memory encodedActions) {
        bytes memory runtime = bytes.concat(hex"00", encodedActions);
        assembly ("memory-safe") { return(add(runtime, 32), mload(runtime)) }
    }
}

contract SignedClaimArchiveCodeBlob is SignedClaimArchiveBase {
    mapping(bytes32 => address) private _vector;
    function _storeVector(bytes32 claimId, Ledger.Action[] calldata actions) internal override {
        _vector[claimId] = address(new ActionCodeBlob(abi.encode(actions)));
    }
    function _loadAction(bytes32 claimId, uint16 leaf) internal view override returns (Ledger.Action memory x) {
        bytes memory raw = new bytes(288);
        address blob = _vector[claimId];
        assembly ("memory-safe") { extcodecopy(blob, add(raw, 32), add(65, mul(leaf, 288)), 288) }
        x = abi.decode(raw, (Ledger.Action));
    }
}
```

Use the plain `CREATE` shown above; the existing-claim branch prevents a retry from deploying a second blob. Test that retry leaves the original event-derived blob address and codehash unchanged. Do not add a destroy/call surface to the blob.

Add `test_packed_and_codeblob_reconstruct_identical_1_2_64_vectors()` and, for each size, assert every field of every `actionAt`, `keccak256(abi.encode(rebuilt))`, claim header, posting, selected Record, empty-body handling, and coverage bitmap are identical. Assert a 64-action blob code size of 18,497 by emitting the vector address in a neutral `ClaimRetained(claimId, vectorLocation, leafCount)` event (`vectorLocation=address(0)` for packed); the event is observation only and no proof label.

- [ ] **Step 2: Write the bounded paid runner**

Model it on the existing lab runner's safe mechanics, but keep it independent and small. It must refuse external `--rpc`; accept only `--anvil --out <absolute tmp path>`, spawn one Cancun Anvil on a free loopback port with finite history and a run-owned `--cache-path`, use a 5-minute watchdog, and kill it in `finally`.

After deploying both candidates plus `ArchiveReadConsumer`, take one `evm_snapshot`. For each vector size `1`, `2`, `64`, revert/re-snapshot before each candidate so both start from the identical post-deployment state; require each revert/snapshot succeeds. Pin the same explicit retention timestamp for each candidate and record it, so `retainedAt` comparisons are meaningful. Capture every branch-local observation **before** its revert and identify it by branch/cell plus block hash, not a reused block number. Use the same signed intent, action bytes, no bodies, and caller for both. The summary below is an index into the raw evidence, never the evidence itself:

```json
{
  "source": {"commit":"b94b57c405ef18b7f259cbd636d685ff96738ce7","dirtyDiffSha256":"..."},
  "build": {"solc":"0.8.30","viaIR":true,"optimizerRuns":200,"evm":"cancun"},
  "deployments": {"packed":{"gasUsed":"...","runtimeBytes":"...","codehash":"..."},"codeblob":{"gasUsed":"...","runtimeBytes":"...","codehash":"..."}},
  "cells": {
    "1": {"packed":{"retainGas":"...","actionAtPaidGas":"..."},"codeblob":{"retainGas":"...","actionAtPaidGas":"...","blobRuntimeBytes":353,"blobCodehash":"..."}},
    "2": {},
    "64": {}
  },
  "checks": {"sameDigest":true,"sameActionHash":true,"sameHeader":true,"samePostings":true,"blobExactBytes":true}
}
```

`blobRuntimeBytes` must equal `1 + 64 + 288*N`, so the values are 353, 641, and 18,497. Fetch and retain `eth_getCode` for each code blob; assert it equals `0x00 || abi.encode(actions)`. `actionAtPaidGas` is the receipt gas of `ArchiveReadConsumer.readAction` for leaf 0 and leaf `N-1`; report both, never subtract an estimated consumer overhead. Also record archive deployment receipts separately from per-claim retention.

Retain a bounded raw sidecar sufficient for independent recomputation, without copying the large required-query workload:

- Hash the actual new files (including untracked files), full compiler inputs/settings and artifact creation/runtime bytes; an ordinary Git diff hash is not enough. Record actual source base and dirty/new-file inventory.
- Capture each fixture's exact Intent, full Action vector/encoding, original signature, caller and expected claim digest. Snapshot branch identifiers and the explicitly pinned timestamp are part of the evidence.
- For all three deployments, six retentions and twelve paid reads, retain signed raw envelopes, derived hashes, transaction objects, complete receipts/logs and matching block headers. Independently join hash/from/to/nonce/data/value/chainId, receipt status/block/hash/log fields and unique inventory. Size 1 still has two distinct paid-read receipts even though both request leaf 0. Missing or failed transactions invalidate the comparison.
- Capture basis-qualified raw `claim`, **all** `actionAt`, count/posting and relevant `selectedRecord` calls. Independently rebuild vector/hash/signature and expected header/postings; never trust `sameHeader` or `samePostings` booleans supplied by the runner.
- Retain basis-qualified `eth_getCode` for both archives, consumer and each blob. Match blob addresses to `ClaimRetained` from the correct archive, then compare exact bytes with STOP plus the independently encoded vector. Match each paid-read event to the consumer, intended claim/leaf and independently encoded action hash.
- Root independently recomputes receipt totals and the predeclared choice from the raw packet. Report **OWNED_LOCAL_RPC_OBSERVATION**, not authenticated source admission or state proof. Missing/mismatched evidence keeps packed and the comparison UNMEASURED. This is a no-body vector-retention/read comparison, not pricing body retention, the three-action joined recovery, or destination admission.

- [ ] **Step 3: Root runs compiler, semantic, and paid gates**

```sh
cd "$efs_archive_lab"
efs_archive_run=$(mktemp -d /tmp/efs-b-archive-paid.XXXXXX)
export FOUNDRY_OUT="$efs_archive_run/out"
export FOUNDRY_CACHE_PATH="$efs_archive_run/cache"
export EFS_LAB_SCRATCH="$efs_archive_run"
forge build --use 0.8.30 --offline --sizes
forge test --use 0.8.30 --offline --match-contract SignedClaimArchiveTest -vv
EFS_ETHERS_PATH="$efs_archive_ethers" \
  "$efs_archive_node" script/measure-portable-archive.mjs --anvil --out "$efs_archive_run/archive-representation.json"
```

Expected: build/test exit 0; JSON checks all true; all six retain receipts and twelve first/last-leaf paid-read receipts exist; the 64-leaf blob is 18,497 bytes. Root validates the resolved existing ethers-v6 directory and Node executable first; do not install dependencies as part of this seam.

- [ ] **Step 4: Apply the reversible representation decision and rerun the finite gate**

Use this predeclared rule: choose code blob only if (a) all equivalence/code-byte checks pass, (b) the 64-leaf blob deploys under EIP-170, and (c) code blob has strictly lower `retainGas` than packed at both size 2 and the bound size 64 (the joined portability case itself has three action tuples, including its binding). Otherwise keep packed. Disclose size-1 retain gas and both paid-read figures even if they point the other way; do not average, extrapolate, or claim a universal gas win.

Set exactly one alias:

```solidity
contract SignedClaimArchive is SignedClaimArchiveCodeBlob {}
// or, if the declared rule does not pass:
contract SignedClaimArchive is SignedClaimArchivePacked {}
```

Then rerun `forge build --sizes`, the targeted archive test, and the complete existing `forge test --use 0.8.30 --offline -vv`. Root inspects the JSON independently before any report. If any matched receipt/check is missing, retain the packed alias and report the representation claim as **UNMEASURED** rather than inferring from slot counts.

- [ ] **Step 5: Root stages exact implementation paths only after all gates pass**

```sh
cd "$efs_archive_tree"
git status --short
git add Reviews/2026-09-12-efs-path-decision/lab-b/src/SignedClaimArchive.sol \
        Reviews/2026-09-12-efs-path-decision/lab-b/test/SignedClaimArchive.t.sol \
        Reviews/2026-09-12-efs-path-decision/lab-b/test/ArchiveReadConsumer.sol \
        Reviews/2026-09-12-efs-path-decision/lab-b/script/measure-portable-archive.mjs
git diff --cached --check
git diff --cached --name-only
```

Expected staged names are exactly those four; the pre-existing `.codex-*` files and committed `required-query-paid-20260914/` packet remain untouched. Root handles any commit/publish operation and later planning-main report after independent output review.

## Completion boundary

Completion proves only an immutable, bounded EOA signed-claim archive, claim-local selected-body recovery, append-only claim discovery, and the three joined adversarial outcomes in this disposable Road B lab. Historical native/contract source proof remains explicitly `UNSUPPORTED`; source admission, accepted typed membership, current validity, destination authority/binding, production SDK/API adoption, finalist selection, and protocol affordability remain unclaimed.

**14:00 UTC cutoff:** Task 1 is the required working semantic deliverable **only after its full regression and task review pass**. If Task 2 cannot finish with complete matched receipts and root review before the cutoff, stop after Task 1 with the packed alias; state exactly that packed-versus-codeblob gas and the codeblob choice remain **UNMEASURED**, and do not weaken or postpone any semantic test. If Task 1's required gates themselves are incomplete, hand it off as incomplete/unverified, not completed.
