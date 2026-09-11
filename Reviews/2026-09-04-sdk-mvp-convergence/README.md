# SDK MVP convergence — September five seams / August comparison

**Status:** bounded design review and disposable representation probe; no Core,
runtime, wallet, browser, cryptographic or protocol conformance claim
**Date:** 2026-09-04
**Author:** sdk-pm / Codex / session `01a02a24-01b3-7f12-9f2e-887aea66e9e8`
**Authority:** James's overnight convergence authorization, relayed by v2 PM;
design and narrow disposable experiments only. No V2-C1 ruling, production,
public deployment, durable data, or change to another lane's sources.

## Verdict

Keep September's operation-specific result families. Their prose already
requires lossless evidence; a universal August `ResultV0` wire is unnecessary.
The useful contraction is a small product projection over an inspectable,
exportable evidence closure, not a smaller set of facts.

One concrete ambiguity needs repair before an adapter is implemented:
`AuthorizedWrite` cannot require **Core-accepted authorization** before
submission. The direct EOA one-transaction path exposes the problem most
clearly, but Core acceptance is post-admission for all three paths. Separate
local preflight/signature/grant verification from the later Core receipt.

No owner choice is needed to fix that timing or retain evidence. Do not reopen
the permanent Type/query, Principal, carrier or result-wire bakeoffs here.

## Exact inputs and scope

Paths below are relative to the planning repository at the named commit, not
to a mutable worktree. `git show <commit>:<path>` retrieves each input.

| Key | Exact commit | Inputs / standing |
|---|---|---|
| S | `12ef4c5b929759c87fcf4886a1619734a6f9a044` | September `Designs/sdkv2/{README,mvp-interface}.md`; `Designs/efsv2/{disposable-mvp-profile,mvp-c0-genesis-manifest}.md`; `Designs/web-client-os/mvp0-acceptance.md`. Selected B0 bundled disposable control, not frozen. |
| A | `57d04f85ae2687ee8ea63d945378df5a9a6492a5` | August `Designs/sdkv2/exp-c0-mvp-packet.md`, SDK README/queue/rulings; `Reviews/2026-08-25-sdkv2-exp-c0-mvp/` packet/checkers. Independent serialized consumption, not five-seam execution. |
| R | `2573f08b170bf3eb855ad5a68c31ee7b0215272d` | August readiness `Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` and vector/test inventory. Broader partial-invariant comparison; not interchangeable with S. |
| E | `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448` | `Reviews/2026-08-25-data-explorer-exp-c0-consumption/README.md`. Five-artifact independent intake; E1a unproved, E1b/runtime trace NOT_RUN. |
| A0 | `b9088d6a24f4d40bcca6ba300523b25cc7c608d2` | Actual serialized Core source consumed by A and E. R is a later readiness tip, not permission to relabel A/E consumption as that later source. |

Existing source-lock/decode/recommit tests were **not rerun**. Their retained
claims were inspected. The only new execution is the small probe below.
Source refs were available after fetch; A's owned worktree started clean.
Only this review directory changes. No main/source-design/status/roster edits.

## Profile discrimination is mandatory, not an inferred conversion

S uses `efs2/mvp-c0/2026-09-03`, random run ID, source/toolchain commitments,
the final experiment commitment and derived `c0ProfileId`. The run's manifest
also binds Core/carrier code, genesis receipt, Route, capabilities and limits.
Those are distinct from the envelope's `profile=1` and `coreProfileId`.

`TypeProfileRef.BUNDLED_B0_C0 {typeSchemaId}` is S's supported arm.
`SPLIT_FUTURE` is reserved/undecodable, not a place to stuff A's QueryProfile.
Never synthesize `queryProfileId=typeSchemaId`, reuse A's codec/enum numbers,
or call either profile simply "C0" at the import boundary. Retain A as opaque
comparison evidence; explicitly reject an unsupported semantic adapter.

## Field and raw-evidence crosswalk

**R:** reusable semantic assertion or technique. **P:** exact data/encoding is
profile-specific. **M:** new September vector/execution evidence is missing
from the inspected August SDK intake. R does not mean a vector passes S.

| Field / fact | August A | September destination and preservation rule | Disposition |
|---|---|---|---|
| Operation and result identity | `ResultV0.kind`, `protocolResultAbi` and encoded tuple/commitment | Name S/run/operation family and retain `evidenceCommitment` with exact backing; do not replace the raw source with a DTO, invent a universal result commitment, or import A's wire ABI. | R/P |
| Exact point | `presence`, subject/finite domain | Imported `outcome=FOUND/ABSENT_PROVEN/UNKNOWN/CONFLICT`, exact chain/Realm/Core/profile/subject/key; selected `value` only for FOUND, conflict candidates remain evidence. Old `MASKED`, `OPAQUE`, `NOT_APPLICABLE` are not direct enum synonyms. Preserve source fact plus reason/qualification or declare translation unsupported. | R/P/M |
| Read basis | Realm/revision/execution/high-water; observer block/hash/root/source | Retain committed semantic basis and each claim's evidence basis. Observation source, requested/observed finality, freshness, canonicality and evidence kind survive as evidence, even when not direct `PointResult` fields. A block tag or provider assertion is not a proof. | R/P/M |
| Coverage / support / validation | Independent axes; `SEMANTICALLY_VALID`, `UNPROVEN`, etc. | S's `COMPLETE/PARTIAL/UNKNOWN`, support, and `VALID/INVALID/UNKNOWN` with exact reason/evidence. No blind synonym table across profiles. Unsupported interpretation does not make obtained raw bytes invalid or absent. | R/P/M |
| Authority / lifecycle / selection | Authority, lifecycle and selection axes | Preserve S authority and currentness; retain admission, withdrawal, mask/conflict/selection provenance separately where acquired. Do not erase historical facts merely because S has fewer top-level axes. No forced use of out-of-scope lifecycle operations. | R/P |
| Precision | Decimal-string uint64 / BigInt, exact bytes32 Principal | Keep each declared width, including S nonceKey uint192, nonceSeq/notAfter uint64, masks and revisions. BigInt locally or canonical decimal boundary; never JS Number narrowing or low-160 Principal identity. | R/P/M |
| Page request and cursor | Source fixture has 9 coordinates; serialized cursor has a different 11-coordinate representation | S exact scope/Type bundle, ordering, bound, coverage request, high-water/revision and committed basis, plus opaque continuation. Retain capability/activation evidence where applicable. No invented separate mutable QueryProfile in bundled B0. | R/P/M |
| Page response / closure | Empty partial, stale cursor; raw page/payload | Qualified items, every obtained page and source attempt, opaque continuation and closure evidence. Terminal/empty is not complete. Mixed basis remains comparison/UNKNOWN, never a merged inventory. | R/M |
| File / revision / bytes | Record and Bytes payload with digest/availability | Distinct File Object, FileRevision, ChunkTree/digest/geometry, selected range, Route, carrier handle/code/capability, Locator and manifest limits. No carrier handle replaces semantic identity. | R/P/M |
| Acquisition | Serialized expected/observed digest, eligibility, ordinal, observer basis, outcome | Every bounded eligible attempt, exact raw response bytes when obtained (including failed-integrity bytes), source/basis and integrity decision. Corrupt response stays AVAILABLE + RETURNED + FAILED; only independently verified bytes reach rendering. A pre-acquisition limit rejection records the cause, not invented response bytes. | R/P/M |
| Plan and sources | Plan-signature, account/submission and canonical effect categories | Exact unsigned publication, ordered bodies/Record IDs, predicted envelope/Occurrences, C0 effects/CAS, WritePlan and component preimages/digests; source reads with full qualification. Friendly preview is not the signed object. | R/P/M |
| Write role/evidence | Author/signer/controller/submitter/payer and three receipt categories | Actual signer, Principal, relayer/submitter/payer, selected witness profile, executor/code, grant and admission basis; separate receipt meanings below. No requirement for a point result on a write-stage object. | R/P/M |
| Effect / recovery | `COMMITTED/NOT_COMMITTED_PROVEN/UNKNOWN/NOT_APPLICABLE` and raw receipt | Keep vocabulary but use S's proof rule: every planned effect independently read back at a committed basis. Proven revert/unchanged state is distinct from local rejection. Raw EVM success alone never proves effect. | R/P/M |
| Reconstruction / raw closure | `projectionIntegrity`, missing member; exact raw Type/Result/Bytes | Keep omission/substitution/duplicate/order diagnostics and original commitments under their source profile. Export source reads, plan, receipts, raw unknown data and dependencies. A dangling inspect handle means unavailable evidence, not a complete export. | R/P/M |
| Faults / reasons | Stable detail codes/raw diagnostics/attempts | Preserve typed cause and exact observation. No timeout, exhausted bound, unsupported capability, failed proof or transport null becomes absence/success. Code numbers remain run-specific. | R/P/M |

The narrow product façade need not repeat all columns. Its evidence handle must
resolve them and their raw backing without relying on the original component,
mutable cache, signer or submitter memory. Physical deduplication is fine;
semantic omission is not. Missing backing remains a qualified partial export.
The probe rejects incomplete export; that does not authorize hiding already
observed partial results in the real UI.

## Receipt timing and lineage crosswalk

| Evidence | Earliest honest stage / preserved meaning | Not interchangeable with |
|---|---|---|
| Source reads, exact unsigned publication, C0 effects and WritePlan | PLANNED; full source qualifications, predictions, CAS, roles, limits, expiry and exact commitments | signature, admission, or observed post-state |
| Local preflight / signature verification | Pre-submit; named local check, exact digest, verifier/profile and read basis | Core-accepted authorization |
| Composite EOA publication witness | Normal path: one EIP-712 signature over the C0 WritePlan; retained unsigned envelope and composite basis | separate chain-free envelope signature / detachable authorship |
| Same-Principal grant/session evidence | Grant approval, registration and independent grant read-back precede zero-wallet-prompt routine writes; actual signer remains distinct | new Principal/Plan/head key; today's grant state replacing historical admission authority |
| Direct EOA | One transaction invocation can authorize and submit; no preceding WritePlan signature. Retain `DIRECT_EOA_TRANSACTION_AUTHORSHIP`, same plan/calldata and tx evidence | fabricated portable signature or premature Core receipt |
| Transport submission / EVM | Submission/ACK/ambiguity and separately inclusion/revert with tx hash, block/index and source evidence | admission, finality, byte availability or product success |
| Core authorization and admission/effects | After Core acceptance; bind selected Occurrences, plan, authority basis, CAS/index/carrier effects and receipts | pre-submit local authorization or independent read-back |
| Canonical read-back | New exact/page/byte reads and per-planned-effect comparison at committed basis; retain entire earlier lineage | just a final success DTO, future availability, or timeless finality |
| Prompt/provider accounting | Linked setup, routine, grant, revocation and lifecycle logs; normal 1 signature prompt, direct 1 tx prompt, granted session 0 routine wallet calls/prompts | setup treated as free; zero prompts treated as zero signatures/checks |

### Required clarification for the coordinating PM (no source edit here)

S `mvp-interface.md` lines 63–64 says `SubmittedWrite = AuthorizedWrite + ...`
with a prior authorship/authorization receipt. Imported C0 §4.2 defines an
authorization receipt as **Core accepted** the witness. Immediately after a
direct wallet returns a transaction hash but before execution, that receipt
does not exist. A literal implementation must fabricate it, add an illegal
signature ceremony, or reject the valid direct path.

Proposed replacement wording:

> Pre-submit authorization evidence records local checks and any witness
> actually obtained; it does not claim Core acceptance. Direct EOA approval
> and submission may share one provider invocation. Core authorization and
> admission receipts are attached only when observed. Each stage retains the
> unchanged plan, its source evidence and prior journey, without fabricating
> inapplicable witnesses or treating a missing receipt as success.

Also make the terse `CanonicalReadBack` family explicitly retain its prior
journey/evidence handle. Existing non-loss prose already requires this; it is
a clarification, not new semantics. Do not add another mandatory wire enum.

## Existing vector disposition — assertions are not execution

| Existing input | Reusable portion | Profile-specific / missing evidence |
|---|---|---|
| A `RESULT_POINT_FOUND_V0` | Exact decode/re-encode/commit method and raw/wide-number retention | A ABI/domain/IDs/enum codes stay A-only; S absent/conflict/unsupported/basis-failure vectors missing. |
| A `Q1C_EMPTY_PARTIAL_PAGE` | Empty plus PARTIAL must not become absence | Source checker tests field presence; no pagination execution. S complete BindingScope closure, interruption and zero-row cases missing. |
| A `Q4A_STALE_CURSOR` | Revision/high-water/activation/basis cannot be silently changed | Source fixture checks coordinate presence, not resume rejection. R has separate cursor invariant code; do not count it as SDK or S execution. |
| A `X0B_BYTES_UNAVAILABLE` | Semantic presence is independent of byte availability | Its coarse `bytes=UNAVAILABLE` is not S's returned-byte axis. S range geometry, carrier and attempt vectors missing. |
| A HELLO `semanticFacts.acquisition` / Bytes payload | Recompute digest; retain mismatch then matching attempt | Attempts are serialized observations, not fetching done by A's checker. S exact carrier/range/eligibility and M0-05 execution missing. |
| A codec-0/opaque codec-1 Type envelopes | Exact unknown bytes remain exportable, not understood | A codecs/2048-byte cap/Type-ID preimage and split model not S values. New S unknown-Type vector/adapter required. |
| A `X1_DROPPED_SUBMISSION_CHANNEL` | ACK is not canonical effect; retain linked receipts | Strings `linked/acknowledged/unobserved` are not executed crypto or receipts. S three path traces, prompt totals and digest vectors missing. |
| A `B1_STALE_CAS_ZERO_EFFECT`, `RESULT_MUTATION_REJECTED_SAME_ROOT_V0` | Require proof of noncommit rather than infer it from failure | Literal pre-post-equal or equal serialized roots is not SDK independent read-back. S pinned state/receipt proof missing. |
| A `RESULT_BOOTSTRAP_COMMITTED_CHANGING_ROOT_V0` | Bootstrap lacks ordinary OperationId; preserve that distinction | A roots/ABI cannot stand in for S G11 seal, G12 exact-block proof or later activation receipt. |
| A `Z1A_RECONSTRUCTION_MISSING_REQUIRED_ITEM` | Missing item is partial/unknown, never complete | No actual state collection/rebuild here; S complete archive, independent second reader and cold reopen missing. |
| R Plan/Effect/Operation, query/projection controls | Digest-mutation and finite-domain test techniques | Different split profile, 28-collection registry, caps, cursor ABI and effect IDs. README labels partial-invariant control, exact executable trace replay count zero. No S conformance reuse. |
| E five-file consumption | Independent serialized consumer, unknown/raw projection retention | Same A0 source, not S. E1a unproved; E1b NOT_RUN. Neither a real browser nor a real September SDK integration is established. |

A reports 5 artifacts, 4 Result encodings, 6 Type envelopes and 13 mutations.
Its actual checker recomputes selected bytes/digests and checks pinned
projections; it does not execute providers, authorization, pagination or a
canonical read-back. Preserve this accomplishment at that exact ceiling.

## Minimum ergonomic API — illustrative, unpublished

Prefer two pure Files planners, one explicit write executor with observable
stages, one recovery/read-back operation and one raw-capable exact inspector.
Keep the three lower-level read seams available to the consumer/Inspector.

```text
files.planCreateFile(context, {parent, name, exactBytes}) -> PlannedWrite
files.planPublishRevision(context, {file, expectedHead, exactBytes}) -> PlannedWrite
writes.execute(planned, explicitPathAndPorts) -> OperationProgress
writes.readBack(operationEvidence, committedBasis) -> CanonicalReadBack
inspectExact(exactReference, context) -> ExactReadResult
readExact / readPage / readBytes remain the common underlying seams
```

`context` is explicit: selected S/run/manifest, chain/Realm/Core/Route,
namespace/content Plans, accepted bundled Type/capabilities, committed read
basis, source ports, and run-local limits. No wallet in reads or planning.
Planner signer/payer/executor/nonce/expiry inputs cannot be silently selected
later: path or context changes invalidate/rebuild the plan before approval.

- **Create file:** plan the exact File Object/charter, ChunkTree, initial
  FileRevision, DirectoryEntry, name-slot and file-head Binding effects and
  carrier bytes. Expose name/CAS qualifications and
  `EXPERIMENTAL_DIRECT_CORE`, `filesPreconditionCertified=false`; do not
  pretend the one-Principal experiment certifies general Files exclusivity.
- **Publish revision:** pin the same File/Principal/head author-key, expected
  revision and prior immutable FileRevision; preserve both resolution Plan
  IDs. Stale CAS rejects. It never auto-rebases, switches author, widens a
  grant or silently signs again. Keep the old revision independently readable.
- **Inspect unknown future Type:** use known transport/outer framing only.
  Retain exact raw Type/body/reference and profile tag, source and basis.
  Requested unsupported interpretation yields `UNKNOWN` with
  `support=UNSUPPORTED`, with no invented decoded `value`. A successful raw
  storage lookup is separate qualified evidence, not semantic understanding.
  Opaque export needs no schema engine, registry fetch, wallet or OS boot.
- **Execute:** select normal EOA, direct EOA or same-Principal session
  explicitly. One call may encapsulate the direct prompt, but distinct logical
  stages and receipt meanings remain visible. Progress is never named
  semantic success; reorg/lost receipt recovery is explicit and replay-safe.

## New disposable probe and limits

`evidence-closure-probe.mjs` is a synthetic representation adapter, not SDK
runtime or C0 code. It takes a typed product-stage projection plus declared
backward evidence references and exports the reachable raw/metadata closure.
The prototype throws diagnostic errors on incomplete export; this is not the
proposed public result/error API. Its node bound is laboratory-only.

Test-first RED baseline required `CORE_ACCEPTED` before projecting a stage:
9 tests failed, including the direct pre-submit/submitted counterexamples.
GREEN removed that false prerequisite and retained dependency closure;
9 tests passed on Node `v26.0.0`:

```sh
node --test Reviews/2026-09-04-sdk-mvp-convergence/evidence-closure-probe.test.mjs
node --check Reviews/2026-09-04-sdk-mvp-convergence/evidence-closure-probe.mjs
node --check Reviews/2026-09-04-sdk-mvp-convergence/evidence-closure-probe.test.mjs
```

Cases exercise direct preparation/submission without invented Core receipt;
prior journey and unknown/raw/wide-number preservation through JSON export;
missing backing, root/child profile substitution and wrong run rejection;
immutable capture rather than mutable aliases; and node-limit failure.
There is no S canonical codec, real run ID/Realm, Type interpreter, proof,
signature verification, actual page fetch, carrier verification, wallet,
browser worker/storage, EVM or complete state reconstruction in this probe.
It copies facts; it neither authenticates them nor proves a malicious source
declared every necessary reference. Raw bytes are fixture hex, not C0 wire
vectors. Passing demonstrates one representation option, not correctness of
the facts, all five seams, or a century-capable archival format.

Independent read-only reviewers separately checked A vector scope and S result
families. Both support keeping the smaller families; S review independently
identified the pre-submit/Core-authorization ambiguity and lineage shorthand.

## One next implementation-sized deliverable

**One unpublished S-run-pinned create-file vertical adapter fixture**, consuming
the coordinating Core lane's exact C0 serialized packet, not its implementation:
qualified source reads -> deterministic create-file plan -> synthetic local
relayed-EOA submission -> independent exact/page/byte read-back -> export/reimport
the complete evidence closure. Include one unknown-Type raw inspection and
negative mutations of plan field, CAS, page basis, acquired bytes, receipt
lineage and Type/run discriminator. No browser UI or public package is needed.

Entry needs exact S run-manifest/Type/WritePlan/CAS/cursor/carrier/read/receipt
bytes plus independently derived expected outputs. These are missing execution
inputs, not permission to fill in new Core bytes. Coordinate supply through
v2 PM; after they exist this is one bounded SDK implementer packet. Direct
fallback and granted-session revision then reuse the adapter and add their
distinct evidence/prompt tests; they are not declared passing by the first arm.

Exit requires exact preimage/digest parity, raw/qualifier/receipt retention,
every expected effect independently matched, no false absence or success and
explicit unresolved conditions. A failing point remains visible and blocks
only the corresponding experimental claim. No genuine owner decision is
required by this lane; permanent choices remain in their existing queues.
