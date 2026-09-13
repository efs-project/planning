# Shared SDK semantic fixture — one joined path

September 12, 2026 · SDK PM handoff for [[README|the EFS path decision sprint]] · comparison-only, carrier-neutral and disposable

## Read this first

Each eventual shortlisted implementation must run one joined story:

> a real author publishes a typed, reference-checked quote; mandatory acceptance
> and required discovery update atomically; explicit Lenses select between two
> authors; an unrelated Solidity contract consumes the selected value; then a
> clean implementation exports, imports and rechecks the retained history.

The fixture compares **observable meaning and evidence**, not matching storage.
It does not adopt a Type grammar, canonical bytes, IDs, signature format, result
ABI, Lens grammar, index structure, module graph, carrier, helper, proxy or
deployment. Capitalized outcome names below are test-harness shorthand, not
proposed production enums. Each candidate must pin its own exact executable
artifacts before integration and provide a lossless mapping to these facts.

This sprint cannot prove the project's century-preservation objective. It can
falsify a candidate that already needs a mutable private service, launders
authority, loses raw evidence or cannot reconstruct the promised meaning.

The companion [[files-journey|Files/Data Explorer journey]] extends this same
author/Lens/query law through move, path reuse, removal, restore and
revision-scoped tags. This SDK fixture does not replace that product pressure,
and its smaller File-level tag does not silently waive those cases.

## Source pins and present evidence state

- Packet basis: planning `main`
  `eedbab0d77ed99199356051351fbab999364a62a`, specifically [[README]] and
  [[overhead-and-selection]]. These define this sprint's comparison contract;
  they freeze no production architecture or protocol bytes. Recheck `main`
  before candidate integration.
- Retained controls, not newly rerun or equivalent-guarantee results: fuller
  control `ebc7d540570827c5f5052af83d2cbd80f54092a7`; native source
  `b8c27754314c97ab48c5b2454f9be05653e6b393`; native retained evidence
  `d269e5560d23af169e386f8ad92d9a5f60a9c382`.
  The fuller control already uses direct EVM rollback and shared immutable
  Envelope/Record storage, so a challenger cannot count removing an older
  journal or first introducing shared storage as a new saving.
- MUD source pressure only: `0e49b51ba934438e49c7f098e78d6e3ddf7567fb`
  as recorded in [[mud-source-preflight]]. Its documentation version is not
  assumed to identify that commit.
- Current state: no executable shared capsule, two-road shortlist, heavy run or
  performance winner is yet recorded. Equivalent portable authorship, checked
  references, mandatory acceptance and plural selection remain unpriced.

## The semantic capsule

These labels and values are frozen only for this comparison. Candidate-specific
descriptors, encodings and IDs go in the eventual run manifest.

| Fixture label | Shared meaning |
|---|---|
| `ITEM_ETH`, `ITEM_USDC` | Two admitted `Item` values. Their exact candidate IDs and bodies are recorded, not assumed equal across profiles. |
| `PAIR_ETH_USDC` | One admitted `Pair` whose two checked references resolve to `ITEM_ETH` and `ITEM_USDC` at the validation basis. |
| `FILE_QUOTE` | One stable File subject first presented at `/swaps/eth-usdc`; path identity and File identity remain separate. |
| `FILE_REPLACEMENT` | An unrelated File later placed at the vacated `/swaps/eth-usdc` path; it has different identity, body, history and tag state. |
| `QUOTE_A1` | EOA-authored stored revision: pair `PAIR_ETH_USDC`, price mantissa `2_500_000_000`, scale `6`, observation `1_800_000_000`, and the note commitment below. |
| `QUOTE_A2` | A valid EOA-authored successor to `QUOTE_A1`: price mantissa `2_502_000_000`; all other semantic fields unchanged. |
| `QUOTE_B1` | A competing producer-contract-authored revision: price mantissa `2_501_000_000`; all other semantic fields unchanged. |
| `NOTE_BYTES` | Exact bytes `0x7265666572656e63652071756f7465` (UTF-8 `reference quote`); the quote retains their content commitment and carrier evidence. UTF-8 here is fixture data, not an EFS charset choice. |
| `AUTHOR_A` | A genuine EOA author using the candidate's pinned retained signed-publication path. Actual signer, author, submitter and payer remain distinct fields even when equal. |
| `AUTHOR_B` | A deployed producer contract that actually originates its publication through the candidate's contract-author path. It has no invented EOA signature. A test-only mutable account-authentication probe is present solely for the later drift check; it is not the historical author witness. |
| `TAG_MARKET` | Required tag `market`, bound in this fixture to the stable `FILE_QUOTE` subject, not to one losing revision. Tag filtering occurs after Lens selection. |

The fixture's `Quote` meaning is the tuple `(checked Pair reference, unsigned
price mantissa, scale, observation time, note content commitment)`. That is not
a proposed Type descriptor. Before a run, each arm must publish an independent
fixture map containing its exact Type closure, body bytes, IDs, bounds and
cross-language vectors. A semantic value with no exact arm-local map is not a
measurable operation.

The retained matched 32-byte quote and 41-byte binary payloads remain
supplemental cost controls from the sprint packet. Their exact source bytes and
hashes must be copied from pinned evidence into the run manifest; neither can
substitute for this joined typed/reference/authorship journey.

### Mandatory acceptance and discovery obligations

For every ingress path, one named and pinned fixture acceptance profile must:

1. establish the quote's exact Type/profile support and structural validity;
2. resolve `PAIR_ETH_USDC` at one declared basis, check its target Type, and
   check its two `Item` references under the rule actually promised;
3. enforce scale `6`, the declared integer bounds and the stable subject/CAS
   precondition;
4. retain the author's actual evidence kind and source acceptance basis; and
5. atomically make the accepted head/history visible to the required exact,
   current-parent directory (`/swaps` initially, `/markets` after the move) and
   `market`-tag queries.

Materialized indexes and bounded reconstruction are both eligible. Either way,
the candidate must name the completeness witness, charge the work, and make a
write fail atomically if a mandatory query obligation cannot be updated. An
optional index reports its own coverage and cannot satisfy this requirement.
For this sprint, ingestion and required indexing remain separately attributable
contract responsibilities: each arm records their boundary, writer authority,
call path, rollback path and individual costs even when one transaction makes
their effects atomic. Hiding required-query work inside an undifferentiated
Ledger/Core total does not answer the comparison.

### Selection rules

Three experiment-local Lenses operate over the same qualified candidate set at
one basis:

| Lens | Expected result after `QUOTE_A2` and `QUOTE_B1` exist |
|---|---|
| `LENS_A_FIRST` | uniquely selects `QUOTE_A2` from `AUTHOR_A` |
| `LENS_B_FIRST` | uniquely selects `QUOTE_B1` from `AUTHOR_B` |
| `LENS_NO_TIEBREAK` | reports `CONFLICT` and returns both qualified candidates, with no incidental-order winner |

Opening `FILE_QUOTE`, listing its folder, filtering by `TAG_MARKET` and the
Solidity read must apply the same named Lens and basis. A list cannot reveal a
lower candidate that the point read would not select. History is a separate
explicit projection: it returns all qualified revisions with selection
annotations, or names a narrower selected-lineage projection while keeping the
losing history inspectable. A point-selection rule cannot silently erase it.

### Small lifecycle cross-check

Finalist eligibility also imports the move/path-reuse/remove/restore assertions
from [[files-journey]]. Applied to this quote, moving `FILE_QUOTE`, assigning its
old path to an unrelated replacement File, removing it and restoring it must
preserve the original File identity, authored history and `TAG_MARKET` subject.
None transfers to the replacement merely because it occupies the old path.
This cross-check may reuse the companion fixture; it need not duplicate its
payloads or prescribe a File representation here.

## One joined execution trace

Candidates may batch physical writes, deduplicate bodies or reconstruct an
index, but they must return evidence for these same logical checkpoints.

| Step | Operation | Required observable result |
|---:|---|---|
| 0 | Seal the arm-local fixture map and independent expected vectors. | Source, compiler/config/fork, deployed code, profile/Type/rule/Lens commitments, limits, semantic-to-physical map and oracle hashes are fixed before integration. |
| 1 | Admit `ITEM_ETH`, `ITEM_USDC` and `PAIR_ETH_USDC`. | Exact reads find all three; the Pair's typed references are independently checked at the recorded basis. Required query coverage is complete. |
| 2 | `AUTHOR_A` publishes `QUOTE_A1` through the signed EOA path. | Signature verification, account authorization, submission, Realm admission, index effects and canonical read-back remain separate. Independent read-back proves the intended admission/head/history/query effects. |
| 3 | `AUTHOR_A` publishes `QUOTE_A2` with a CAS against `QUOTE_A1`. | `QUOTE_A1` remains historically readable; `QUOTE_A2` becomes A's current candidate exactly once; required directory/tag results remain complete and non-duplicated. |
| 4 | `AUTHOR_B` publishes `QUOTE_B1` from the real producer contract. | Evidence says contract author and actual caller/controller under the real strategy and source basis. No EOA-signature field is fabricated or treated as empty-but-valid. Capture the producer's initially approving current-account probe separately; it is not the historical witness. The same mandatory validator and query obligations apply. |
| 5 | Read the three Lenses at one sealed basis. | A-first selects A2; B-first selects B1; no-tiebreak reports conflict. Exact read, directory page and tag-filtered page agree. |
| 6 | Move `FILE_QUOTE` to `/markets/eth-usdc`, put `FILE_REPLACEMENT` at `/swaps/eth-usdc`, remove the moved placement, then restore it. | Stable-subject reads retain A1/A2/B1 and `TAG_MARKET`; complete current folder/tag queries track the move, removal and restore; the replacement receives none of the original identity, tag or history. Each transition updates its mandatory queries atomically. |
| 7 | Pay for an unrelated Solidity consumer transaction against A-first, then B-first. | The consumer obtains and independently checks the selected typed quote, Pair commitment, author kind and result qualifications through public interfaces only. Conflict/unsupported/unknown paths expose no fabricated quote. Record receipt gas separately from `eth_call`. |
| 8 | Export a bounded source closure, clear the original SDK/frontend/cache, and reconstruct with a clean reader offline. | No mutable alias, original indexer, package registry, gateway or hidden cache is required. Raw evidence, unknown fields and every qualification survive. Missing history or bytes remains explicit. |
| 9 | Import through a fresh destination's real import path. | Source evidence is verified at its stated proof level; destination reference checks, acceptance, mandatory discovery, CAS and selection run independently and atomically. Source acceptance never becomes destination authority. |
| 10 | Activate fixture rule v2, which rejects mantissas above `2_500_000_000`, and flip the test producer's mutable account-authentication probe so it no longer approves the old claim. Repeat historical and current assessments against the separately pinned destination Core/profile. | A1/A2/B1 retain their v1 source admission and history at the original basis. A2 and B1 fail the explicit current v2 rule assessment; that does not delete them. B1's historical contract-origin evidence keeps its original proof grade and is not recomputed from the changed account probe. The current account result and destination admission/selection remain separate. An arm that cannot make one assessment reports `UNSUPPORTED` for that named check, not wildcard success. |

Within steps 2–9, exercise the direct, batch, import and dedup/reuse entrypoints.
Reusing identical Record bytes may save storage; it must not reuse authorship,
admission, CAS or required-index effects from a different action.

## Minimum result facts

Candidate-native result types may differ. The comparison harness must recover
these independent facts wherever applicable: exact subject or finite scope;
Realm/execution/profile identity; committed observation basis; presence;
support/projection; structural and target validation; author evidence and
current authority; admission; coverage; Lens selection; currentness/finality;
byte availability and integrity; action stage; per-effect result; raw evidence
and bounded diagnostics. One `valid`, `verified`, `success`, nullable value or
revert string cannot replace them.

| Case | Minimum expected facts | Forbidden collapse |
|---|---|---|
| Selected understood quote | `presence=FOUND`, `support=SUPPORTED`, relevant validation checks satisfied, `selection=SELECTED`, explicit Lens and basis, author kind/evidence retained | one unqualified decoded value |
| Proved missing exact object | `presence=ABSENT_PROVEN` only from an authoritative complete negative at the named basis | zero value, timeout, revert, cache miss or omitted row as absence |
| Missing required Pair during publication | target check is `ABSENT_PROVEN` only if actually proved; acceptance/admission is rejected; after independent pre/post read-back all planned effects are `NOT_COMMITTED_PROVEN` | accepted write, orphan head, partial mandatory index or automatic retry |
| Pair observation unavailable | target validation is `UNKNOWN`; mandatory acceptance cannot succeed; effect remains `UNKNOWN` until read-back establishes otherwise | treating uncertainty as invalid data, absence or successful admission |
| Spoofed `AUTHOR_B` claim | contract-authorship verification/authorization fails for the EOA and unrelated-contract callers; admission is rejected and read-back proves no intended effects | trusting a caller-supplied author label or copying B's historical evidence |
| Unknown Type or revision | object is `FOUND`, raw bytes remain exportable, `support=UNSUPPORTED`, projection is `OPAQUE`, semantic validation is not claimed | absence, invalid-by-default, lossy re-encoding or guessed DTO |
| Partial directory/tag/index page | useful positive items remain; `coverage=PARTIAL` with missing ranges/sources and same-basis cursor evidence | empty/complete page, proved absence or silently dropped positives |
| Lens tie | `selection=CONFLICT`, all qualified contenders/evidence retained, no selected value | first/last iteration order as truth |
| Stale CAS precondition | the planned action/precondition is `STALE` and rejected; the old value remains historical evidence and the newly observed head may itself be current at its own basis | labeling every retained value stale, rewriting history or submitting with an old precondition |
| Stale observation | a found value retains its observation basis with `currentness=STALE`; it cannot support a current absence, selection or mutation claim | converting aged evidence into current truth or deleting the positive value |
| Selected File, unavailable note carrier | File/quote stays `FOUND` and selected; `availability=UNAVAILABLE`; integrity is not claimed and no verified note bytes are exposed | absent File, empty note, or unverified bytes |
| Mandatory-index failure | admission/head/history/index effects all roll back; after exact read-back each is `NOT_COMMITTED_PROVEN` | receipt-only success or partly visible publication |
| Lost submission response | submission is `BROADCAST_UNKNOWN`; canonical effect is `UNKNOWN` until qualified read-back | automatic failure, automatic success or blind rebroadcast |
| Imported source evidence | source authorship/acceptance outcome, destination admission outcome and destination current selection are three separate facts | matching ID/hash/transcript as destination authority |

For an encrypted payload, report ciphertext/carrier availability, ciphertext
commitment integrity, plaintext/decryption authority and plaintext integrity as
separate facts. Obtained ciphertext can be present and integrity-checked while
plaintext access is denied or unknown and plaintext integrity remains
unevaluated. A corrupt returned body is available-but-integrity-failed, not
opaque and not absent.

## Illustrative TypeScript caller

This is pseudocode for usability review. Names and shapes are deliberately not
an npm API proposal.

```ts
const fixture = await sdk.fixture.open(sealedCandidateManifest)

const a1 = fixture.quote.build({
  subject: FILE_QUOTE,
  pair: PAIR_ETH_USDC,
  price: { mantissa: 2_500_000_000n, scale: 6 },
  observedAt: 1_800_000_000n,
  note: fixture.bytes.commit(NOTE_BYTES),
})

const planA = await sdk.actions.planPublication({
  realm,
  author: { kind: "eoa", principal: AUTHOR_A },
  candidate: a1,
  expectedHead: null,
  acceptanceProfile,
  requiredQueries,
})
const signedA = await eoaAdapter.authorize(planA) // exact plan; no ambient signer
const submittedA = await sdk.actions.submit(signedA, transport)
const effectA = await sdk.actions.reconcile(submittedA, { basis: sealedBasis() })
fixture.expectCommitted(effectA, ["admission", "head", "history", "directory", "tag"])

// The producer contract is the author observed by the contract ingress. It is
// not AUTHOR_A signing on the producer's behalf.
const planB = await sdk.actions.planContractPublication({
  realm,
  author: { kind: "contract", principal: AUTHOR_B },
  candidate: fixture.quoteB1(),
  expectedHead: null,
  acceptanceProfile,
  requiredQueries,
})
const submittedB = await producerContract.publish(planB.call)
const effectB = await sdk.actions.reconcile(submittedB, { basis: sealedBasis() })

const selected = await sdk.read.selectedQuote({
  realm,
  subject: FILE_QUOTE,
  lens: LENS_A_FIRST,
  basis: effectB.observationBasis,
})
if (selected.selection !== "SELECTED") return renderQualifiedOutcome(selected)
renderQuote(selected.value, selected.evidence) // raw/evidence exit still available

const exported = await sdk.portability.exportClosure({
  realm,
  subjects: [FILE_QUOTE, PAIR_ETH_USDC, ITEM_ETH, ITEM_USDC],
  lenses: [LENS_A_FIRST, LENS_B_FIRST, LENS_NO_TIEBREAK],
  basis: effectB.observationBasis,
})
const sourceCheck = await cleanReader.verifyOffline(exported)
const destination = await freshRealm.importClosure(exported, { destinationAcceptanceProfile })
compareWithoutMerging(sourceCheck, destination.admission, destination.selection)
```

The friendly builder hides record choreography, not uncertainty. Every shown
convenience must have a raw/evidence exit, and a checked importer must revalidate
objects after JSON, structured-clone, storage, worker or process boundaries.

## Illustrative independent Solidity consumer

Each arm exposes its own pinned public read ABI or a disposable adapter. The
port itself must be unprivileged and deterministic from public onchain
candidate interfaces: no fixture-seeded answers, mutable answer cache, admin
read, private storage shortcut or offchain approval. Any adapter/helper address,
code and dependencies are pinned, and its deployment plus full nested read cost
is charged. The consumer is authored separately, is not the
producer/System/admin, imports no candidate implementation library and calls no
offchain approver. Its tiny fixture decoder/oracle is independently written
from the sealed arm-local vectors rather than calling the candidate's
encoder/verifier.

```solidity
// Test-only sketch: selectors, structs, enums and encoding are not EFS API.
interface IFixtureReadPort {
    function readSelectedQuote(
        bytes32 subject,
        bytes32 lens,
        bytes32 basis
    ) external view returns (FixtureResult memory);
}

contract UnrelatedQuoteConsumer {
    error NoSelectedQuote(uint8 point, uint8 selection);

    function consume(
        IFixtureReadPort port,
        bytes32 subject,
        bytes32 lens,
        bytes32 basis
    ) external returns (bytes32 checkedValue) {
        FixtureResult memory r = port.readSelectedQuote(subject, lens, basis);
        if (r.point != POINT_FOUND || r.selection != SELECTION_SELECTED) {
            revert NoSelectedQuote(r.point, r.selection);
        }

        // Separately authored for this candidate profile and sealed vectors.
        Quote memory q = IndependentFixtureDecoder.decode(r.rawCanonicalBody);
        IndependentFixtureOracle.check(r, q, subject, lens, basis);
        return keccak256(abi.encode(q.pair, q.mantissa, q.scale, r.authorKind));
    }
}
```

The paid transaction receipt, return value, called addresses and code/profile
commitments are retained. A successful `eth_call`, adapter assertion or decoded
price alone does not pass this step.

## What must not be called equivalent

| Different profiles or evidence | Required treatment |
|---|---|
| EOA signature and native contract-originated publication | Preserve different evidence kinds, verification rules, replay domains and historical witnesses. They may support the same semantic author role; their proofs are not interchangeable. |
| Retained authored revision and live contract-backed value | Test and price separately. A live read does not gain portable content identity, snapshot history or carrier independence for free. |
| Source authorship/admission and destination admission/current authority | Preserve both. Import may reject or select differently without invalidating retained source history. |
| Current mutable account response and historical contract authorship | Historical assessment uses its pinned occurrence/witness/basis and named trust level, never today's mutable response alone. |
| Complete required query and partial/optional/offchain index | Return distinct coverage and trust obligations. An offchain indexer can accelerate but not silently become the semantic authority. |
| Candidate canonical IDs/bytes and the shared semantic labels above | Require stability within each candidate's promised profile and export/import path. Do not require cross-candidate byte equality before a protocol freeze. |
| Stored tables, reconstructed indexes and packed layouts | Compare complete write/read/rebuild costs and proof of the same query outcome; physical equality is irrelevant. |
| Browser read, `eth_call` and paid Solidity transaction | Report all separately. None substitutes for another's cost or execution evidence. |
| Direct, batch, import and dedup/reuse entrypoints | All must preserve acceptance/index/authority semantics; passing one path does not cover another. |
| Receipt inclusion and canonical semantic effect | Receipt is submission/execution evidence. Only qualified independent read-back can establish the intended EFS effects. |
| Matching hash, ID or retained RPC transcript and authenticated state proof | State the actual witness or trust assumption. Matching values do not upgrade proof level. |
| Candidate adapter and production SDK/Core API | The adapter is disposable measurement plumbing. It has no authority to set permanent names or bytes. |

## Evidence packet each arm returns

For each complete operation, return one row with: source and dirty state;
compiler/dependencies/config/fork; bytecode and deployed-code commitments;
fixture/profile/Type/rule/Lens/input pins; transaction receipt gas including
failures; paid consumer-read gas; browser RPC requests/batches/bytes/latency;
new persistent state/code accounts; carrier and proof work; required query
coverage/rebuild work; external operators and who pays; independently checked
result; and every unsupported, incomplete or unpriced obligation.

The independent report also includes:

- candidate-native raw results plus the lossless semantic mapping used above;
- the exact oracle source/hash and proof it does not import the candidate
  encoder/verifier;
- a closure inventory and a network-denied clean-reader transcript;
- source versus destination authorship, acceptance and selection assessments;
- direct/batch/import/reuse bypass results; and
- all mutation seeds, bases, receipts and post-failure state reads.

## Adversarial variants and stop conditions

Run at least: wrong-Type Pair, missing Pair, unauthorized Pair under the declared
rule, stale A-head CAS, duplicate delivery, reordered batch results, required
index failure, partial index coverage, unresolved Lens conflict, unknown Type
revision, unavailable and corrupt note carriers, lost submission response,
destination rejection and the pinned later account/rule/Core drift. Also have
an EOA and an unrelated contract submit the exact `QUOTE_B1` bytes while
claiming `AUTHOR_B`; both spoof attempts must fail contract-authorship binding,
admission and every intended effect.

A route is not an eligible equivalent finalist if any of these occurs:

1. an entrypoint bypasses mandatory acceptance, authorship or required-query
   maintenance, or a late failure leaves any intended effect partly visible;
2. the contract author is represented by an EOA signature, or historical
   validity is inferred only from today's mutable account response;
3. the Solidity consumer or adapter is privileged, serves seeded/cached answers,
   uses private storage or candidate implementation code, needs offchain
   approval, hides an unpriced dependency, or is evidenced only by `eth_call`;
4. `UNKNOWN`, `PARTIAL`, opaque, unavailable, corrupt, stale or conflicting
   evidence becomes absence, completeness, current truth or success;
5. export requires an original mutable service, loses raw/unknown evidence, or
   import treats source acceptance as destination authority;
6. the independent oracle calls the candidate encoder/verifier, exact source
   and profile pins are absent, or a receipt/transcript is overstated as an
   authenticated semantic proof;
7. a cheaper counterfactual omits a named guarantee but is ranked as equivalent;
   or
8. only isolated codecs, libraries, a substitute UI or disconnected operations
   pass. The same deployed graph must complete the joined trace.

## Inputs still intentionally unknown

- the two shortlisted roads and their exact revisions;
- permanent Type/Data-ABI grammar, canonical bytes and identity rules;
- the EOA signed envelope, Principal/controller relationship and replay domain;
- supported contract-author strategies and the durable historical witness;
- exact validator execution/activation semantics and external-condition basis;
- the permanent mandatory query set, index topology and completeness proof;
- Lens/ResolutionPlan grammar, conflict ordering and history proof format;
- production operation-specific result and bounded diagnostic types;
- export closure/proof encoding and destination import/revalidation rules;
- byte-carrier profiles, privacy/decryption semantics and availability promise;
- independent Solidity read/write ABI, generated leaf shape and any helper; and
- legal caps, affordability envelope, upgrade/coexistence rules and permanent
  deployment authority.

These are run-manifest inputs or later owner/Core decisions, not blanks an
implementer may fill silently. Before permanent freeze, the separate authority,
replay, recovery, cross-language vector, reconstruction, coexistence and
century-preservation gates in [[overhead-and-selection]] still apply.

## Appendix — criteria for the next sealed paid point/list slice

This is the disposable comparison specification for the next Road B/Road C cost
rows only. `A1`, `A2` and `B1` below are author/revision labels, not architecture
roads. Run-specific expectations must be sealed before either candidate is
connected to the read harness; this document is not itself an executed seal.
Physical Type/body/ID/signature/packing encodings remain in each arm's fixture
map. The earlier diagnostic packets are not retroactively qualified by this
appendix. Preserve the input evidence grade (`RPC_OBSERVED` for the local
transcript unless stronger authentication is independently supplied); a
bounded semantic comparison does not require a new state-proof system or
establish authenticated chain state. See [[oracle-boundary]].

At each arm's sealed post-`B1` basis there is exactly one current placement: the A flow
placed `FILE_QUOTE` at parent `/swaps`, name `eth-usdc`. Its provenance remains
`sourceStep=A1`, `actor=AUTHOR_A`, with experiment-local evidence category
`EOA_SIGNED_PUBLICATION_EFFECT`. `QUOTE_B1` adds a competing content head for
the same File; it does not create, replace or pay for a second B placement.
Both Lenses therefore discover the same placement and File. Only the selected
content head changes. Placement provenance and selected-content authorship are
always separate observations.

| Row | Independently expected abstract outcome |
|---|---|
| `A1` setup | Admit `QUOTE_A1` for `FILE_QUOTE`, establish the one A placement and make A's current head/revision `QUOTE_A1` / `A1`. Charge the placement once and disclose it separately from publication, admission and indexing even if one transaction combines them. |
| `A2` setup | CAS A's head from `QUOTE_A1` to `QUOTE_A2`; retain A1 in history; keep exactly the same placement. A2's author/evidence is `AUTHOR_A` / `EOA_SIGNED_PUBLICATION`. |
| `B1` setup | Admit `QUOTE_B1` as B's competing current head/revision `QUOTE_B1` / `B1`; keep exactly the same placement. B1's author/evidence is `AUTHOR_B` / `CONTRACT_ORIGINATED_PUBLICATION`, with no fabricated EOA signature. |
| paid point, A-first | Select File/head/revision `FILE_QUOTE` / `QUOTE_A2` / `A2`, value `2_502_000_000 @ scale 6`, and content author/evidence `AUTHOR_A` / `EOA_SIGNED_PUBLICATION`. Placement provenance remains the A1 effect. |
| paid list, A-first | Return one `/swaps` row, `eth-usdc -> FILE_QUOTE`, hydrated and checked to the same A2 selection as the point row. The bounded page is complete and has no duplicate or B placement. |
| paid point, B-first | Select File/head/revision `FILE_QUOTE` / `QUOTE_B1` / `B1`, value `2_501_000_000 @ scale 6`, and content author/evidence `AUTHOR_B` / `CONTRACT_ORIGINATED_PUBLICATION`. Placement provenance remains the A1 effect. |
| paid list, B-first | Return that same single placement row, hydrated and checked to the same B1 selection as the point row. The bounded page is complete and has no duplicate or B placement. |

Each paid row is one transaction from a pinned unrelated caller through that
arm's pinned consumer, with no privileged cache or seeded answer. Consumer
implementations and addresses may differ across arms; the caller role and
observable checks must match. Within each arm, start each paid row as the first
transaction from a clone/revert of its sealed post-B1 snapshot. Across arms,
require equivalent logical state and matched block/time and cold-transaction
controls, not identical physical snapshots, deployments or block hashes.
Record each execution block separately from that arm's semantic observation basis.
Report point and list gas separately; also report setup, deployment, code and
storage, including the single placement's once-only cost.

### Common comparison row

The following are arm-neutral evidence fields, not a proposed SDK result type:

| Field | Required content |
|---|---|
| `operation`, `lens` | `PAID_POINT` or `PAID_LIST`; `LENS_A_FIRST` or `LENS_B_FIRST`. |
| `realm`, `execution`, `profile` | Exact chain/deployment and arm profile commitments, without treating one as authority for another. |
| `observationBasis`, `executionBasis` | Exact arm-local post-B1 semantic basis plus the paid transaction's block; never an unqualified `latest`. Point/list checks within an arm use that same semantic basis. |
| `queryCoordinate` | Point: `FILE_QUOTE`. List: parent `/swaps`, name `eth-usdc`, the pinned page/window and end condition. Exact arm-local coordinate bytes stay in raw evidence. |
| `presence`, `support`, `admission`, `selection` | Separate qualified outcomes. Every successful row is found, supported, admitted and uniquely selected; a receipt cannot fill these fields. |
| `selectedFile`, `selectedHead`, `selectedRevision` | The exact labels from the table. `selectedRevision` is the fixture label `A2` or `B1`, not an assumed cross-arm ordinal; retain physical IDs/ordinals separately. |
| `selectedAuthor`, `selectedAuthorEvidenceCategory` | A-first: `AUTHOR_A` / `EOA_SIGNED_PUBLICATION`. B-first: `AUTHOR_B` / `CONTRACT_ORIGINATED_PUBLICATION`. |
| `placementCoordinate`, `placementProvenance` | PAID_LIST checks the one A placement and its source step, actor, evidence category and basis. It does not change when B-first wins content selection. A File-keyed PAID_POINT need not look up a directory; the comparison separately retains and joins the A1 placement evidence without charging that unrelated lookup to point-read gas. |
| `quoteCheck`, `pairCheck`, `itemChecks` | Independently check the selected Quote's exact fixture fields; resolve its `PAIR_ETH_USDC` reference; check the Pair Type and its ordered `ITEM_ETH` and `ITEM_USDC` references; resolve and check both Item Types at the same basis. Point and list perform the same closure checks. |
| `candidateCoverage`, `pageCoverage` | Point and list qualify the same content-selection candidate universe at the same arm-local basis; their physical witnesses and representations may differ. The list additionally establishes that its one-row placement window is `COMPLETE` with an end condition; `PARTIAL` or `UNKNOWN` is not empty or passing. This is fixture/profile-scoped coverage, not authenticated global completeness. |
| `rawEvidence`, `paidExecution` | Lossless candidate bytes/proofs and arm-local IDs, plus caller, consumer, target/code commitments, transaction, receipt status, return/revert data and gas used. |

Expected negatives are deliberately small. Fail the row if B creates a second
placement or the list duplicates the A placement; point and list select
different File/head/revision; the selected author/evidence category is laundered
into placement provenance; either read skips the Quote -> Pair -> two Items
checks; the Pair or an Item is wrong-Type, missing or unavailable but is reported
as valid; checks within an arm mix semantic bases or candidate universes; or incomplete coverage
is reported as an empty complete page. Preserve `INVALID`, `ABSENT_PROVEN`,
`UNSUPPORTED`, `PARTIAL` and `UNKNOWN` rather than fabricating a selected value.
A status-1 receipt without the abstract checks is not a pass.

Keep the small matched acceptance/index-failure rollback control required by
[[matched-cost-scope-review]]; do not import the entire finalist test suite
into this cost slice. Logical inputs and useful guarantees match across arms,
while physical body sizes, action encodings and paid implementation work are
measured and disclosed rather than forced equal. This does not alter the older
oracle profiles or their already-frozen call sets.

### Practical pre-run pins

1. Independently author and hash an expectation manifest containing the rows
   above. It contains semantic labels and outcomes only and is retained before
   opening either new rerun result packet. The already-inspected diagnostic
   packets may inform the experiment design, but cannot supply its expected
   answers or be relabelled as independently pre-sealed evidence.
2. Before fixture publication or harness integration, seal one arm-input
   manifest per candidate: clean source commit and recorded empty dirty diff; dependency,
   compiler, fork and configuration identifiers; ABI/init-code/runtime-code and
   adapter/consumer artifact hashes; profile/Type/Lens commitments; and the
   independent semantic-to-physical fixture vectors. Copy no expected answer
   or coordinate from candidate results; independently obtained deployment
   facts are handled by step 3, before semantic calls.
3. Allocate public caller roles from fixed ephemeral test accounts and record
   their addresses and derivation indices without retaining secrets. Prefer
   precomputed producer, consumer, adapter/helper and candidate target addresses
   from pinned `CREATE` nonce allocations or `CREATE2` inputs. Independently
   recorded deployment receipts plus verified runtime code are also acceptable
   if sealed before fixture publication/semantic calls, with their evidence
   grade stated. For proxies/factories pin each relevant hop and runtime code
   commitment. Deployment evidence must come from the independent run controller,
   not be extracted retrospectively from the candidate's answer packet.
4. Compute point/list coordinates from the sealed arm-local fixture map with an
   independently authored vector implementation. Pin the exact File, parent,
   name, Lens and page/window bytes before calls; do not ask a deployed candidate
   what coordinate the oracle should expect.
5. After A1/A2/B1 setup but before any paid read, seal the exact post-B1 block
   number/hash and state/snapshot identifier. Fork or revert that checkpoint for
   each paid row. Hash and timestamp the expectation, arm-input and basis seals;
   the packet may echo their hashes but may not define or repair them.

These are test-run requirements, not a new general SDK or protocol mandate.
Each arm still needs a reviewed physical fixture map, consumer implementation
and deployment/pinning procedure, and must report its real deployment cost.
No owner/protocol choice is required for this disposable slice. Missing
concrete pins remain `UNKNOWN`: a raw diagnostic may still be retained as such,
but cannot be promoted retrospectively into this pre-sealed comparison.
