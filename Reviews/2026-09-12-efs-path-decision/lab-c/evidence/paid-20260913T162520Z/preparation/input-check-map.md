# C-native input/check map (draft, not a seal)

Source: exact `2ca7349e5d683c3ff10651c0fc106c10da946145`; only `src/` and the
`MeasurementConsumer.sol` / `FixtureActors.sol` declaration sources, and compiler
artifacts at `/tmp/efs-c-readiness-build-20260913.NoPDle/out` were used.
The neutral manifest and shared paid appendix define the logical expectations.
No candidate runner, fixture builder/seeder, result packet, run output or chain
was read. No non-scratch files changed. Evidence ceiling remains RPC_OBSERVED.

## Minimal interface

One arm-input JSON manifest can carry constructor args, precomputed addresses,
linked/immutable-patched code hashes, typed payloads/actions, signed intents,
exact field-order arrays and named expected checks. A root-owned hook executes
only these sealed inputs; a second root-owned hook verifies qualified raw facts.
No further semantic framework is needed for preparation.

The run controller has now confirmed the exact CREATE order, Type shapes, Item
payloads, coordinates, action schedule, nonces/deadlines, list budget and outer
callers. Their independently derived vectors and deterministic public-test A1/A2
signatures are recorded in [c-native-inputs.json](./c-native-inputs.json), SHA256
`16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`.
That final signed JSON supersedes this draft's open-input wording; no physical
choice remains open in this positive typed-joined preparation. Live deployment
and basis verification remain required; see [handoff](./reviewed-input-handoff.md).

## Offline dependency order (not a CREATE nonce allocation)

1. Obtain public account 0 deployer, 1 AUTHOR_A and 3 paid caller addresses from
   the fixed public test mnemonic; do not retain mnemonic/private keys in outputs.
2. Assign all eight role addresses from confirmed deployer CREATE nonces.
3. Patch ImportLib runtime self address (32-byte slot at byte offset 39).
4. Patch IndexModule deployer and poisonConcept immutables; hash runtime.
5. Link Ledger ImportLib slots and patch index, indexCodehash and realmId; hash
   runtime. This runtime hash is coreCodeCommitment and enters every EOA intent.
6. Patch LensReader ledger/index immutables. PassAcceptor, QuoteAcceptorV1,
   Producer and MeasurementConsumer have no runtime immutable references.
7. Set Ledger constructor index_; set LensReader constructor ledger_/index_;
   IndexModule.attach(Ledger) is an additional deployer transaction, not a
   deployment. Its nonce position must not silently displace a CREATE allocation.
8. Check independently deployed runtime/attachment facts before fixture publication.

The JSON declaration map gives exact compiler-derived link and immutable offsets
and complete ABI field orders. Offsets are byte offsets; address immutables are
left-zero-padded 32-byte values. Code size excludes constructor args.

## Native formulas (abi.encode unless explicitly marked)

- EOA principal = keccak(uint8(1), bytes32(0), EOA address).
- origin = keccak(keccakUTF8("efs2/origin/1"), uint256(31337), Ledger address).
- AUTHOR_B principal = keccak(uint8(2), origin, Producer address).
- realmId = keccak(keccakUTF8("efs2/realm/1"), uint256(31337), Ledger address).
- File subject = keccak(keccakUTF8("efs2/subject/1"), AUTHOR_A principal, chosen salt).
- Type body = abi.encode(bytes32 shape, bytes32[] refTypes, bytes32 acceptorRuntimeHash).
- Type id = keccak(TYPE_META, keccak(Type body)), where
  TYPE_META = keccakUTF8("efs2/lab-c/type-meta/2").
- Record body = abi.encode(bytes32[] orderedRefs, bytes payload).
- Record id = keccak(Type id, keccak(Record body)).
- Quote payload = abi.encode(uint256 mantissa, uint8(6), uint64(1800000000), bytes32 note).
  The note commitment rule must be pinned; the neutral note bytes are
  0x7265666572656e63652071756f7465 ("reference quote").
- Binding key = keccak(author, purpose, subject, role).
- Scope key = keccak(purpose, scope).
- Name = keccakUTF8("eth-usdc") per PlacementExpect declaration.
- Lens hash = keccak(bytes32[] principals, uint8 mode); ORDERED mode = 0.
- actionsHash = keccak(abi.encode(Action[])); publicationId = keccak(author, uint64 nonce, actionsHash).
- Publication EIP-712 domain has name "EFS Lab C", version "1", NO chainId or
  verifyingContract fields. Realm and runtime-code replay binding reside inside
  PublicationIntent together with author, nonce, deadline, acceptanceProfile,
  indexObligations and actionsHash. See EfsTypes.sol for exact typehash string.

## Initial check boundary

After deployment/attachment and before any Type, Item, Pair or A1 publication:
highWater = 0; author Nonces = 0; exact future fixture Records, Types, Subjects,
Bindings and Evidence are absent; relevant index entries are empty; rulesEpoch
= 1 and indexGeneration = 1. Do not assert every table empty: schemas and Coverage
rows are constructor state. After reciprocal attachment, mandatory-family coverage
is COMPLETE through 0. Check Ledger's index/indexCodehash and IndexModule's
ledger/ledgerCodehash, actual code hashes, realmId, reader attachments and caller
roles at a qualified prepublication basis.

## Publication and post-B1 checks

The admission frontier advances by exactly the number of successfully admitted
actions, starting at zero. A publication firstAdmission is prior frontier + 1.
Each action gets one sequential ordinal. Derive these from the independently
sealed action schedule, not a receipt or candidate highWater answer.

A1 must mint the File if not already present, admit Quote A1, bind A HEAD at CAS
revision 0, create exactly one A FOLDER placement at CAS revision 0, and assert
the File tag. A2 admits Quote A2 and updates only A HEAD with expectedRevision 1.
B1 originates through Producer.publish, admits Quote B1 and creates only B HEAD
at expectedRevision 0. It creates no FOLDER or tag effect. Other prerequisite
Type/Item/Pair actions and the folder coordinate must be explicitly scheduled.

Post-B1 expected heads are A2 and B1; A history retains A1,A2, B history B1;
the placement binding remains A1's publication, A principal, proofKind 2,
revision 1. Both selected publication evidence cells remain sourceGrade 0 and
importOf zero; EOA proofKind 2 retains valid signature bytes, Producer proofKind
1 has zero v/r/s. Realm and core-code commitments must match the qualified basis.

Paid Expect and PlacementExpect exact shapes are in the JSON. The four rows use
one sealed post-B1 frontier and two ORDERED principal arrays [A,B] / [B,A].
A-first expects Quote A2 / head revision 2 / mantissa 2502000000 / proofKind 2.
B-first expects Quote B1 / head revision 1 / mantissa 2501000000 / proofKind 1.
Both must check Quote -> Pair -> ETH Item then USDC Item, exact Types and all
neutral Quote fields. List additionally checks one raw placement, one selected
item, COMPLETE/end position, A1 provenance and mandatory coverage through basis.
Point placement provenance is joined outside paid point execution.

Unknown until later controller evidence: exact prepublication and post-B1 block
hash/number/state snapshot, actual deployed runtime verification, publication
execution evidence and paid transaction blocks. A receipt alone never fills a
missing semantic check. Rollback trigger remains a separately sealed open input.
