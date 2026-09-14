# B-first portable evidence seam (design preparation only)

Status: **PROPOSED / UNMEASURED**; query-first, not a B selection or feature waiver. Source basis: B HEAD `acbfaf70339b73cd03e937158dd015eb37491b21`; cited files had no concurrent diff.

## Smallest coherent seam and proof level

Add a separate `SignedClaimArchive` retaining an EOA-authored B `PublicationIntent`, its **complete ordered `Action[]`**, signature, and sparse record bodies. It performs no Ledger action, acceptance, binding/CAS, mint, withdrawal, or source-admission assertion. Any account may retain/complete a claim; importer is not source author.

Only positive label: `AUTHOR_SIGNATURE_VERIFIED`, meaning the existing B EIP-712 signature verifies over the full vector. It never means `SOURCE_ADMISSION_PROVED`, `DESTINATION_ADMITTED`, `ACCEPTED_TYPED_RECORD`, or `CURRENTLY_VALID`. Signed context fields are claims, not re-proved facts. Expiration remains hashed but does not block archival.

Native/contract-authored historical source proof remains `UNSUPPORTED`: no bounded source-state/finality witness exists here. Reject missing signatures; do not infer historical EOA/native status from current code length.

## Proposed contract/API

Reuse B's `Ledger.Intent` and `Ledger.Action` ABI and exact EIP-712 domain (`EFS2-RoadB-Lab`, version `1`), typehash and digest—no new signature/proof framework.

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

`actionsHash = keccak256(abi.encode(actions))`; `claimId` is the EIP-712 digest, not B's publication ID. Require 1..64 actions and 65 signature bytes; reject high-`s`, bad `v`, zero/wrong recovery. Never query author code length. Conflicting same-nonce signatures remain distinct: admission is unknown.

Before body copying/hashing/writes, require at most 64 inputs, unique in-range `PUBLISH`/`REUSE` leaves, at most 8,192 aggregate raw bytes, and the calldata ceiling below. Same-call duplicates revert; reattaching an already attached correct body is an idempotent no-write; never overwrite.

For `PUBLISH`, derive `recordId = Keys.recordFromHash(typeId, bodyHashOrRecordId)`; for `REUSE`, use its signed claimed ID. Attachment requires `Keys.record(typeId, body) == recordId`. A global cache stores `{bool exists; bytes data}` by Record ID, so valid empty bodies are representable. Separately, each claim has its own 64-bit attachment bitmap: another claim populating the global cache must not make this claim's bit true. `selectedRecord` returns cached bytes only when that leaf's bit is set. A later explicit correct attachment may set the bit without rewriting bytes.

Atomic obligations: immutable header/full logical vector; claim-local coverage; global body cache; and one append-only `(claimId,leaf)` posting per `PUBLISH`/`REUSE` claim. Creation appends once; retries never duplicate. `signedRecordClaim*` means claims—not Ledger occurrences, typed membership, endorsements, or validity. The archive does no shape/Type/reference acceptance. Unknown/invalid Types or missing references may be signed claims but never archive-labeled accepted Records; Ledger separately rejects invalid/unknown admissions.

Leave physical vector representation for one packed-row versus immutable-codeblob measurement, preserving exact hash reconstruction and fixed-offset `actionAt`. Do not mandate 576 naive Action slots or assume storage `bytes` is cheaper.

## Destination authority and recovery

`selectedRecord` only recovers evidence/bytes. The importer submits a one-action destination `PUBLISH(typeId,keccak256(body))` through ordinary ingress. Exact Type and referenced Records must exist (or be separately admitted); current rule, dependency/state, policy and index checks run. Destination author is its actual caller, not source signer. Record identity survives; source subject/binding authority does not.

Replay no source `CREATE`, binding/CAS, withdrawal, or unrelated record. New bindings need current authority/CAS. Admission **as** source author still needs that author's destination authorization; liveness is removed only from retention and importer-authored recovery.

No Core change is needed. Atomic forwarded-author admission needs a new trusted Core surface and is out of scope. A shared digest library changes Ledger runtime commitment; cross-check archive constants against `Ledger.intentDigest` instead.

## One joined adversarial test

1. **Diverged CAS:** retain a full signed batch after the destination head advanced; recover/admit only its selected body and prove all heads/revisions stay unchanged. Destination evidence names the importer.
2. **Today's rejection:** retain the claim, then make the separate destination publish fail a state-dependent policy/dependency. Archive state survives and carries no source-admission/current-validity label.
3. **Missing unrelated body:** retain a two-file full vector with only A's body. A recovers; B is explicitly unattached. Omitting/mutating/reordering an action breaks signature verification; unavailable action **tuples** remain unsupported.

Add focused edges: claim A initially lacks bytes, claim B attaches the same Record, A remains uncovered until explicit attachment; valid empty body; conflicting REUSE Type/body; leaf 63; wrong leaf; retries/posting counts; maximum vector; aggregate overflow; and staged attachments.

## Root assumptions, exact limits, anchors

Current fixed assumptions: static 7-word Intent, static 9-word Action, max 64 actions, exactly 65 signature bytes, max 64 BodyInputs, and max 8,192 aggregate body bytes per call. ABI padding makes exact enforced calldata ceilings:

- `retainSignedClaim`: `4 + 320 + (32 + 64*288) + 128 + (32 + 64*32 + 64*96 + 10,176) = 37,316` bytes.
- `attachBodies`: `4 + 64 + (32 + 64*32 + 64*96 + 10,176) = 18,468` bytes.
- Bounded returns: `claim` 512 bytes; `actionAt` 288; count 32; posting 64; `selectedRecord` at most 8,352 ABI bytes.

The `10,176` term is the maximum padded body sum when 64 body lengths total 8,192 bytes (1,984 bytes maximum independent padding). These are experimental safety envelopes, not protocol affordability claims. Deployment, verification, representation, storage, posting, read and destination-admission costs are all **UNMEASURED**.

Primary anchors: gate `portable-evidence-next-gate.md:6-23,29-58`; signatures/digest `Ledger.sol:229-257,735-807` and `LedgerEvidence.t.sol:31-82`; whole-batch import `Ledger.sol:260-329` and `LedgerImport.t.sol:75-137`; identity/body `Keys.sol:74-80`, `Ledger.sol:479-572,833-845`; native limit `Ledger.sol:267-297`, `LedgerImport.t.sol:139-161`.

Next executable step, only after required-query selection: the joined test plus the one packed-vs-codeblob representation/cost comparison.

Root disposition, September14: independent scoped design re-review marked all three important findings and the physical-storage caution addressed. Exact ABI/return ceilings independently checked. This proposal remains unimplemented/unmeasured and follows the required-query comparison; no stronger portability guarantee or permanent profile is adopted.
