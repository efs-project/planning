# EXP-C0/v0 — `HELLO_FILES_V0` vertical handoff trace

**Status:** draft — exact disposable integration trace; **NON-DURABLE** and
**NON-CONFORMANT**
**Target repos:** planning; disposable Core, SDK, and Data Explorer fixtures
**Depends on:** [[exp-c0-v0-data-structure-profile]],
[[exp-c0-v0-result-api-profile]],
[[exp-c0-v0-codec-domain-bounds-vector-contract]],
[[mvp-build-start-packet]], [[hierarchical-files-and-folders]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-08-25

#status/draft #kind/design #repo/planning #topic/efsv2 #topic/readiness #topic/files

## Why this trace exists

The 61-trace semantic seal tests individual laws. `HELLO_FILES_V0` tests one
literal product story across every first-build boundary so Core, SDK, and
Explorer cannot each pass with mutually incompatible assumptions. It is not a
62nd sealed Core trace and does not increase
`exactExecutableTraceReplayCount`. It is a disposable integration handoff.

The trace is successful only when the same retained bytes and commitments flow
from an explicit launch configuration through Realm state, generic Types,
admission, Binding/query/Lens reads, byte acquisition, SDK projection, and a
no-wallet Explorer Inspector. No layer may reconstruct a friendlier object and
discard the literal input.

## Fixture story

An EOA Principal publishes a small file containing exactly `hello efs v2\n`.
The fixture already carries one root Directory and one File Object. One atomic
two-leaf Publication admits:

1. a `DirectoryFileEntryC0/1` Record binding the UTF-8 name `hello.txt` under the
   root Directory to the File Object; and
2. a `FileRevisionC0/1` Record binding that File Object to the exact byte digest,
   length, and content-type bytes.

The same Operation creates the two Binding heads. The first name-slot mutation
also appends exactly one directory-scoped BindingScope row. Automatic
exact-Type and typed-reference postings make the entry and revision discoverable
without an application-private index. A one-Principal ResolutionPlan resolves
both heads. The primary byte source returns corrupt bytes; an eligible fallback
returns the exact bytes and digest. A state-only projection reconstructs every
identity-, interpretation-, authority-, and query-bearing collection. The story
performs no carriage withdrawal, so collection 16 is explicitly empty rather
than populated with an invented Operation.

## Exact application Types

The trace uses ordinary flat Types under the selected `ABI_TUPLE_V0` law:

```text
DirectoryObjectGenesisC0/1 {
  1 creatorPrincipalId: BYTES required exactly 32
  2 salt: BYTES required max 64
  3 charter: BYTES required max 128
}

FileObjectGenesisC0/1 {
  1 creatorPrincipalId: BYTES required exactly 32
  2 salt: BYTES required max 64
  3 charter: BYTES required max 128
}

DirectoryFileEntryC0/1 {
  1 parent: RECORD_ID required EXACT_TYPE_RECORD(DirectoryObjectGenesisC0/1)
  2 name: BYTES required max 255
  3 child: RECORD_ID required EXACT_TYPE_RECORD(FileObjectGenesisC0/1)
  4 childIsDirectory: BOOL required = false
}

FileRevisionC0/1 {
  1 file: RECORD_ID required EXACT_TYPE_RECORD(FileObjectGenesisC0/1)
  2 contentDigest: BYTES required max 64       // exactly Keccak-256 in C0/v0
  3 byteLength: U64 required
  4 contentType: BYTES required max 128
}
```

Core structural validation proves canonical bodies and exact Type-pinned Record
references after recomputing all four Types and Records. The stable File and
Directory bodies contain no human label: creator Principal, explicit salt, and
charter make retry/copy portable while rename creates only a new entry/Binding.
Creator bytes alone prove no control. The generated validator therefore also
requires the genesis creator claim to match the signed Publication semantic
author and source actor whose entry/revision leaves reference those genesis
Records. It proves `childIsDirectory=false`, `nameRole(name)==fieldRole`, and
Keccak-256 over the exact file bytes. Algorithm agility is successor-profile
work, never reinterpretation of this C0/v0 field. Application validation cannot
change Record identity or silently become admission authority.

Every Type is carried in kind 3 as its exact canonical outer
`(uint16 codecVersion, bytes payloadBytes)` envelope. The machine-readable
fixture separately retains those raw envelopes, payloads, IDs, and semantic
support grades, and both consumer adapters point to the same map. A future
canonical codec could therefore be copied and identified without being
mis-decoded as v0; it would remain visibly unsupported and semantically
incomplete, and C0 admission would reject it without effect.

## Full-width positions and complete scope

The name Binding position is:

```text
PositionKey(
  PURPOSE_FILES_NAME_SLOT_V1: bytes32,
  rootDirectoryRecordId: bytes32,
  nameRole("hello.txt"): bytes32
)
```

Its scope row is keyed by
`(publisherPrincipalId, PURPOSE_FILES_NAME_SLOT_V1,
rootDirectoryRecordId, scopeOrdinal)` and yields the full-width name role. The
File revision head uses `PURPOSE_FILES_REVISION_HEAD_V1`, the File Record ID,
and `FILE_REVISION_ROLE_V1`. A global per-Principal scope or a truncated
purpose/role fails this trace because it cannot prove a complete directory or
recover the exact Binding key.

## Stage contract

| Stage | Required retained input/output | Failure that must stay visible |
|---|---|---|
| H0 launch | canonical OriginLineage and bounded ComponentDescriptor preimages; separate retained runtime code bytes; explicit chain namespace/reference/genesis, Core address/code hash, dependencies/routing/admin/powers, Realm/bootstrap/revision, read mode, canonical SourceDescriptor and ByteReadRequest preimages | any dropped unknown field, mismatched cross-link, code/hash drift, or missing config is `UNSUPPORTED`/`UNKNOWN`, never ambient `latest` |
| H1 portable data | exact raw Type envelopes plus codec/payload/ID grades, four Record bodies/IDs, two-leaf PublicationSet, source witness | malformed envelope/body/reference or unsupported Type admission rejects without Realm effect |
| H2 authorization | exact AdmissionPlan/effects, destination witness, Principal descriptor, verifier profile/transcript, payer/cost commitment | a valid source witness is not destination authority; submission is not effect |
| H3 atomic state | one Operation, two Admissions, two Binding heads/histories, one directory scope row, counters and postings | any invalid leaf/effect leaves equal complete projection roots |
| H4 query | exact-Type `DirectoryFileEntryC0` name-field query with a domain-separated exact-bytes key, plus distinct typed parent/child backlinks at one generation/high-water/basis | an arbitrary key, wrong field/Type/value, or empty/short/partial page never proves absence |
| H5 Lens | immutable one-Principal Plans, nonzero field roles, derived Positions, exact RequiredPointInputs, and ordered same-basis probes for name and revision heads | unrelated raw Position, outside-Plan Principal, zero role, unknown/conflict/unsupported/mixed basis stops without fallback |
| H6 bytes | literal `BYTES` Result plus raw request/source preimages and ordered corrupt-primary and verified-fallback evidence whose selected observer basis exactly equals the Result | endpoint eligibility cannot be invented; corrupt bytes or stronger self-grading never become verified/proved/semantic absence |
| H7 reconstruction | 57 canonical entries across 27 populated collections, `WITHDRAWALS` explicitly empty, and the exact projection count/root | omitted Principal/profile/Plan/witness/descriptor, invented withdrawal, or reordered row fails |
| H8 SDK | literal Results, canonical bytes, raw Type-envelope/evidence handles, exact façade validation, query cursor and acquisition receipt | DTO convenience cannot replace raw truth or merge bases |
| H9 Explorer | direct guest route, Files list/detail and universal Inspector showing basis, validation, authority, coverage, effect and acquisition attempts | no wallet, account, Commons, hosted indexer, OS boot or hidden fixture injection |

H0 exports the exact six-field `RealmBootstrap` named by the data profile:
`originLineage`, `genesisCommitment`, `coreCommitment`,
`initialRevisionCommitment`, `initialRevisionId`, and `disclosedPowers`. A wider
derivation-only object may cross-check the independent transition model, but it
is not Realm state and is not serialized. The launch validator recomputes the
initial commitment from the exact generation-zero `RealmRevision`, derives the
Realm ID from the stored bootstrap coordinates, and then recomputes and checks
the exact `initialRevisionId`.

## Observation rule

The fake-reader arm uses `SOURCE_OBSERVED`: it retains a nonzero block hash and
state root plus source/request evidence, but claims no authenticated proof,
canonicality, or finality. The JSON pins the complete
`SourceObservationEvidenceV0`, its canonical ABI bytes, and
`H(D("EFS2/EXP-C0/V0/SOURCE_OBSERVATION_EVIDENCE"), u16(0), evidence)`.
The exact HELLO packet pins `SOURCE_REPORTED`, proof kind/scope `NONE`, an
absent proof-scope commitment, and `AVAILABLE`; mutating to a stronger known
grade or proof fails. Acquisition and observation retain and recompute the
literal SourceDescriptor and ByteReadRequest bytes. Endpoint eligibility is in
the endpoint commitment, and the selected verified fallback matches the final
Result basis in all five coordinates while failed earlier candidates may
differ. The attempts retain `uint64` freshness without Number narrowing. The later direct-reader arm may graduate to
`AUTHENTICATED_OBSERVER` only after it independently authenticates the header,
state root, Core address/key derivation, and exact proof scope. Both arms bind
all dependent reads to one basis; matching block numbers are insufficient.

## SDK and Explorer handoff

The SDK owns exact codecs, ID derivation, Result/cursor preservation, generated
application validators, verified-byte acquisition, and the injected Reader
interface. The Data Explorer owns navigation, table/list/raw/provenance views,
Inspector presentation, local workspace state, and extension surfaces. It does
not redefine Core semantics or use its UI model as reconstruction truth.

The first Explorer fixture is read-only. Candidate write UX begins only after
the same Plan/signature/submission/effect separation is visible through the
read-back path.

## Pass and stop conditions

Pass requires one machine-readable fixture whose IDs/digests are recomputed by
the Core control, whose JSON alone contains every canonical projection entry,
declared-empty kind, acquisition packet/final link, and source-observation
packet needed for independent reconstruction, whose raw Type and Result
adapters are consumed unchanged by the SDK fixture, and whose Explorer model
retains every qualified field. The composition test
must mutate at least the launch basis, Type, Record reference, Plan, Binding
role/scope, cursor, Lens Plan, primary bytes, fallback eligibility, projection
entry, and raw Result commitment.

Stop and return to design if any mutation is accepted, if a complete listing
requires an opaque index, if a direct RPC observation must pretend to be an
authenticated proof, if the Type language needs application code inside Core,
or if reconstructing authority requires bytes absent from the declared
projection.

## Reopened before production

The fixture does not freeze the Type meanings, Files profile, hashes/codecs,
chain, address, source, page/Lens cap, contract topology, SDK package API,
Explorer UI, or deployment. It earns candidate engineering confidence only.

## Pre-promotion checklist

- [x] Machine-readable fixture and mutation control attached at
  `Reviews/2026-08-25-efs2-exp-c0-v0-control/hello-files-v0.json`
- [x] Generated clean-room contract pins the exact HELLO bytes, payload hash,
  Result/Bytes ABI and decoded axes, Type envelope corpus, consumer pointers,
  dependency ceilings, and nonadoption/receipt rules
- [ ] Core, SDK, and Explorer consume the same source lock
- [ ] Direct-reader arm replaces the fake Reader without semantic divergence
- [ ] Every declared collection reconstructs from state
- [ ] At least one `#status/review` pass
