# Road B — a compact EFS foundation

**Author:** Fable (Claude Fable 5.1, claude-code, role `integration-test-lead`), Claude lane 1. **Written independently** before reading `mud-source-preflight.md`, any Road A/C material or the `efs21` evidence beyond the README §5 headline numbers (5.06M fuller create; 627,672 / 198,745 native). **Status:** v1.2 (v1 written 2026-09-12 ~23:50 UTC; v1.1 fixes 2026-09-12 23:56 UTC; v1.2 adds §9, the second falsifier round on authority and Type identity, 2026-09-13 08:19 UTC) — v0 (`c8ec8d1`) plus §8, the answers to the [[road-b-review|independent review]]'s five falsifiers and its comparison correction, aligned to [[sdk-fixture]] and [[files-journey]]. Cost centers remain ESTIMATED; the evidence extractor's ledger is pending and will replace §2's slot counts with the qualified control numbers. Nothing here waives an outcome; §5 names every place where the compact design changes a guarantee's *shape* and asks for that to be judged, not assumed.

## 1. Architecture in one paragraph

> **Coordinator reading note, September 13:** this document preserves the
> independently written v0/v1 proposal and test specifications, not a claim
> that the lab implements them all. The first completed receipt diagnostics
> are `322b320`; current evidence, costs and missing guarantees are in the
> [[README#Coordinator checkpoint|shared checkpoint]]. In particular, exact
> Types, native-import authority, joined consumption and cold-readable names
> are not established by the cheaper hash-placement run.

Keep every durable fact EFS promises and delete the machinery that exists to *predict* or *re-derive* those facts. Three contracts with one responsibility each: a **Ledger** that admits typed, content-addressed records under an authenticated author, runs the Type's mandatory acceptance, and writes the minimum durable set (record, admission, binding head with revision, the required discovery lists, backlinks, history) in one pass with no journal; an **Index module** (separate contract) that owns every optional index with per-index coverage and is attached through a single post-admission hook; and a **Lens reader** (library plus raw slot getters) that resolves paths and lists scopes under an ordered set of trusted principals for both contracts and a static browser. Identity comes from content (record id = hash of type and body) and from position (a File's stable identity is its head binding key), so nothing needs a dry run to know its ids in advance. Two ingress shapes, one evidence shape: a contract or EOA writes natively (`msg.sender` is the author; portability proof is a chain-state witness) or through a signed envelope (relayable; portability proof is the signature). Both land the same admission row, labelled with which proof they carry.

```
             native call (msg.sender)          signed envelope (relayed)
                       \                          /
                        v                        v
  +--------------------- Ledger (ingestion kernel) -----------------------+
  | 1 validate: ids, refs exist+typed, CAS revision, Type acceptance hook |
  | 2 write:    Record | Admission | Binding(head,rev,prev) | Scope list  |
  |             Backlink list | History list                              |
  | 3 emit:     Admitted(author, scope, recordId, admission)             |
  +-----------------------------+----------------------------------------+
                                | post-admission hook (one call)
                    +-----------v-----------+      +--------------------------+
                    | Index module (config, |      | Lens reader (library +   |
                    | coverage, backfill)   |      | extsload-style getters)  |
                    +-----------------------+      +--------------------------+
                                                         ^            ^
                                                  consuming contract   static browser (eth_call only)
```

## 2. What is persisted, and why each fact is there

| durable fact | shape (ESTIMATED slots) | outcome it serves | fuller-model counterpart |
| --- | --- | --- | --- |
| Record: typeId, body, first admission | 3 + body words | portable data identity; dedup by id | RecordRow (same) |
| Admission: author, proof kind, ordinal, basis | 2 | independently checkable authorship; source admission ≠ destination authority | Envelope (10 words) + Admission + Lifecycle + Batch |
| Binding head: target, revision, previous admission | 2 | stable File identity, CAS, rename/move/remove without erasing evidence | BindingRow (2) + kind-8 posting |
| History list per binding (packed 5 per word) | ~0.4 fresh amortized | as-of reads for contracts (bisection), restore | kind 8 |
| Scope list per folder / tag scope (packed) | ~0.4 fresh amortized + rewrite | required discovery: complete listing with a count | kind 10 |
| Backlink list per target (packed) | ~0.4 fresh amortized | "what points at me", tags-on-file across authors, Lens joins | kinds 5/6 |
| Author nonce / Type cell (cache as code) | rewrite / 3 once per Type | replay protection; acceptance | Authority + TypeRow |
| **not persisted:** journal, canonical envelope bytes, per-record occurrence list, ordinal mirrors, by-type/by-author/field/digest lists | — | moved to events + Index module (declared, coverage-reported) | ~90 slots per file today |

A small note or quote create is therefore about **10–14 fresh slots** in v0 (revised to 16–20 in §8; ESTIMATED), a rebind about 3–4 slots plus history and scope rewrites. The qualified comparison points, from the retained evidence ledger (`lab-b/evidence-extract-2026-09-12.md`, every number cited to its source; all MEASURED receipts, none rerun):

| operation | fuller control `ebc7d54` | native `b8c2775` | what the native arm lacks for the same row |
| --- | ---: | ---: | --- |
| create (41-byte content incl. staging / 32-byte quote) | 5,064,132 (metadata 4,914,763) | 627,672 | signed/portable authorship, Lenses, references, acceptance, restore |
| edit (three-record incl. staging / quote edit) | 2,667,640 | 295,135 | same |
| contract-authored update (native) | not on the fuller routed path | 198,745 | the ledger flags this row as a different ordered workload; verify before pricing |
| steady tag / binding rebind | 1,814,915 / 1,559,525 | rename 246,508 | same |
| paid point read by a contract | 175,658–293,455 (≈120k of it basis checks) | 80,613 | qualification and Lens selection |

The native arm keeps `msg.sender`-only authority, a chain-bound File id, one owner/placement/revision counter, immutable revision history and a mandatory navigation plus by-Type inventory; it has no principals, Lenses, references, acceptance hooks, restore or upgrades. Road B aims to retain the fuller guarantee set with fewer persisted facts; whether it does so is the comparison's open question, not established by construction. My September 11 figures (7.69M create, 2.50M tag) came from a kernel six fresh-genesis revisions older than the control and are withdrawn; the "5.5M v2.1" figure quoted in chat has no retained provenance and is not used here.

## 3. API example (illustrative)

```solidity
// producer contract: native authorship, one logical action
bytes32 rec = efs.publish(QUOTE_TYPE, abi.encode(price, block.timestamp));          // content-addressed id
efs.bind(PATH_PURPOSE, keccak256("/swaps/eth-usdc"), rec, expectedRevision);       // CAS; history kept

// unrelated consumer: Lens = [uniswapAddr] (single trusted author), no off-chain approver
(bytes32 rec2, uint32 rev) = lens.resolve([uniswapAddr], PATH_PURPOSE, keccak256("/swaps/eth-usdc"));
(uint256 price,) = abi.decode(efs.body(rec2), (uint256, uint256));
// folder listing from a contract, complete by construction:
(bytes32[] memory entries, uint64 count) = lens.list([communityA, communityB], FOLDER, folderId, 0, 50);
```

```ts
// browser, public RPC, eth_call only
const head = await lens.resolve([a, b], PATH, subject);       // selected among competing heads
const history = await lens.history(a, PATH, subject, {asOf});  // no archive node, no logs
```

Reused: the v2 identity rules (record/envelope/type ids), the Type schema compiler and acceptance semantics, the Lens plan semantics, the type-cache-as-code result, the index-layer lab's coverage/probe machinery (becomes the Index module). Custom: the single-pass ledger (replaces the journal), the native ingress path, the extsload-style getters, the events.

## 4. Strongest objection (and what I concede)

**Portable contract authorship is not solved by any road, including this one.** A native admission carries no signature; its portability proof is a chain-state witness of the source admission, which a destination cannot verify without a proof of the source chain's state. The compact design makes this honest by labelling the proof kind on every admission, but it does not manufacture portability for contract authors. Second objection: removing the journal moves Type acceptance into the write path; a developer hook is untrusted code inside admission. Mitigation is structural (view-only hook, bounded gas, results committed before any write, whole-publication revert), and it is exactly what the discriminating experiment must attack. Third: history-as-a-packed-list keeps as-of reads cheap for contracts but is an always-on cost some Types never need; I keep it because it cannot be backfilled later.

## 5. Guarantee-shape changes to be judged (not waived)

1. "Rebuild the whole store from state alone" becomes "walk admissions from state, or fold events": still possible, slower, and the by-type/by-author/digest lists are declared indexes with coverage, not kernel facts.
2. Envelope canonical bytes are not stored; the signed envelope's hash and the author's proof kind are. Withdrawal-by-author and reference-to-envelope checks use the admission row instead.
3. A File's identity is its head binding key rather than a separate genesis record; charter rules live in the Type and the scope, not in a per-file record. If a per-file charter turns out to be load-bearing (Lens plans per object), it returns as one record, not three.

## 6. The discriminating experiment

Build the Ledger and Lens reader only (no Index module beyond the hook), on a fresh chain, with the matched 32-byte quote and 41-byte binary fixtures. Run the protocol's **authorship × selection matrix** — {native, signed} × {single author, two competing authors under a Lens} — plus: a checked reference that must reject wrong-Type and missing targets through direct, batch and dedup entrypoints; a stale CAS; a failed acceptance that must roll back the whole publication; a folder listing read by a consuming contract; an as-of history read. Report receipts, fresh slots, the paid consumer-read gas, and the interaction term `cost(both) − cost(authorship) − cost(selection) + cost(neither)`.

**Kill conditions.** If "both" lands within ~20% of the fuller model's matched operation, representation is not the saving and Road A should win. If any entrypoint bypasses acceptance or a failed acceptance leaves state, the design is ineligible regardless of gas. If two-author selection cannot be read completely by a contract without an off-chain party, the required-discovery outcome fails.

## 7. Classification

Demonstrated (elsewhere, reused): identities, type cache as code, index coverage/probe semantics, Lens selection semantics. Designed but untested: single-pass ledger, native+signed dual ingress, history/scope/backlink packed lists in this shape, extsload getters. Unsupported by design: contract-author portability without a state witness. Unknown: the actual interaction term; whether the acceptance hook can be view-only for every promised rule.

## What Road B needs from the coordinator

1. The frozen fixture (quote, binary, two authors, reference case) and its independent expected outputs.
2. Agreement that the matrix in §6 is the compact slice for the hour-8 shortlist.
3. A bounded run slot after the shortlist: one Anvil, finite history, run-owned scratch under 2 GB.
4. Codex's position on §5.2 (envelope bytes) before I build it.

## 8. v1 — answers to the review (specifications with proposed tests)

**Correction accepted first.** The matched control `ebc7d54` already applies writes directly with EVM rollback; Road B claims **no journal-removal saving**. What Road B tests is the *fact set and its representation*: fewer durable rows per logical action, packed lists, no ordinal mirrors, evidence stored once per publication. My native/signed × one/two-author matrix is an ingress and multiplicity test; the protocol's capability ablation (neither / authorship / selection / both) is a separate run and both are kept in §6.

**8.1 Stable File identity (falsifier 1; Codex's portability point).** A File is a *subject*, minted once at create and shared by every author. The id is a **logical claim the creator signs**, not a deployment-local ordinal: `subjectId = keccak("efs2/subject/1", creator, creatorSalt)` where `creatorSalt` is a value the creator chooses and commits inside the signed create action (a per-creator counter is a convenient default, but it is part of the signed action bytes, never read from chain state). The same signed action therefore mints the same `subjectId` on any deployment that admits it, which is what export/import must show for `F` (files-journey J1–J3 plus sdk-fixture steps 7–8). Three binding kinds hang off the subject, each independently changeable: **placement** `(author, FOLDER, folderId, nameHash) → subjectId`, **head** `(author, HEAD, subjectId) → recordId`, and **tag** `(author, TAG, subjectId | recordId, concept)`. Rename and move rebind placements; edits rebind heads; `F` never changes and `G` created later at the old path is a new subject with a different salt. Tests: `id(F)` constant through rename → move → `G` at `/drafts/note.txt`; `project_efs` follows `F`, `approved` follows only `RA`; no ghost at the old name; **and `id(F)` identical after export to a fresh Realm and import through its real path.**

**8.2 Authorship closure and what a signature binds (falsifier 2; Codex's binding point).** The signed preimage is EIP-712 over **the complete action vector and its execution context**, not over record ids alone: `PublicationIntent(realmId, coreCodeCommitment, author, nonce, deadline, acceptanceProfile, indexObligations, actionsHash)` where `actionsHash = keccak(abi.encode(actions[]))` and each action is the full tuple `(kind, typeId, bodyHash | recordId, purpose, subject, role, target, expectedRevision, salt)`. Record ids are *derived* from actions (`keccak(typeId, bodyHash)`), so nothing an action does — placement, head, tag, CAS precondition, order, subject salt — is outside the signature. Test under the SAME signature: change a name, a target, a subject, an expected revision, the action order, or the realm/code context → every variant must be rejected before any write. One **Evidence cell per publication** stores `{author, proofKind, sig (r, s, v), nonce, deadline, acceptanceProfile, indexObligations, actionsHash, firstAdmission, leafCount, basis}`; the Admission rows (one per action, `firstAdmission .. +leafCount`) each carry the action's effect fields (kind, purpose, subject, role, target, expectedRevision, salt, recordId). **Independent reconstruction:** a clean reader re-encodes the actions from those rows in order, recomputes `actionsHash` and the typed-data digest, and verifies the signature against the retained `(r, s, v)` — with no calldata, log or original client. Alice's and Bob's identical `R` are two cells and two admission runs; withdrawing Alice's occurrence touches only hers. Native ingress stores the same cell with `proofKind = native`, no signature, and the author = the calling contract; its portability proof is a **chain-state witness** of the source admission (realm, code commitment, admission ordinal, finalized state root), labelled as such and never inferred from today's account response. This is *eligible to prototype, not yet a verified closure*: the lab's export/import test is what upgrades it.

**8.3 Indexing boundary (falsifier 3; James's Sept 11 direction).** *All* query maintenance moves to a separate **IndexModule**; the Ledger ingests and calls `IndexModule.onAdmission(...)` once per publication in the same transaction; a revert there reverts the publication (mandatory-index rollback). The mandatory set the module must keep and its completeness witness: scope lists (folder placements, tag scopes; witness = head count), binding history per key, backlinks per target, **by-Type**, **by-author**, and per-record occurrence count (a counter in the record row; occurrence rows are the Admission rows themselves). Nothing promised today becomes optional; optional families are declared with `coverage(family, scope) → COMPLETE | PARTIAL(through) | UNKNOWN`. Test: two authors admit identical `R` with nothing declared, by-Type/by-author/occurrence discovery still answer; force a tag-index failure, whole publication rolls back; a later optional index reports `PARTIAL` until covered.

**8.4 Listing law (falsifier 4; Codex's page-one point).** The page reducer is the point reducer (mask beats fallthrough in lens order; a masked name hides a lower principal's same name; no-tiebreak returns `CONFLICT`, never an order winner). A page **never forces a full scan**: it consumes a bounded candidate budget and returns `items`, `scanned` (raw candidates consumed), `rawTotal` (the scope's head count, always known), `selectedSoFar`, and `status ∈ {COMPLETE, PARTIAL(progress), UNKNOWN}`; the selected total is reported only when the scan reaches the end of the raw list. Continuation is bound to `(basisAdmission, scopeKey, lensHash, position)`. An exhausted budget through dead names is `PARTIAL`, not an empty folder. The Files proposal's listing algorithm §5.3 is the oracle. Test: A masks `x`, B binds `x` and `y`, page size 1, mutate between pages, read the pages from the consumer contract and charge the candidate scans.

**8.5 Batch observation and replay law (falsifier 5).** **Ordered-prefix observation**: action *k* sees the writes of actions `< k` in the same publication (guarded sequential write prefix, whole-transaction revert on any later failure; no in-memory journal), so `I → O` in one batch succeeds and `O` referencing a wrong-Type `I` fails. Typed references require the target to exist with the expected Type *at that point*. `publicationId = keccak(author, nonce, keccak(actions))`; an exact retry reverts `AlreadyAdmitted` and creates no admissions. Acceptance is a named **view-only profile** bound to `(typeId, acceptor codehash, basis)` and recorded in the Evidence cell; one-use stateful effects are out of this slice and would need the programmable-acceptance boundary, not a claim that every rule is view-only. Dedup: reusing identical record bytes never reuses another action's authorship, admission, CAS or index effects (fixture steps 2–8 across direct, batch, import, dedup entrypoints).

**What v1 costs relative to v0 (ESTIMATED, unmeasured):** +1 subject mint per create (0 slots: derived id), +1 Evidence cell per publication (~6–7 words, replacing the per-record envelope bytes it removes), +2 mandatory lists (by-Type, by-author: shared, append-priced) and +1 counter per record. The v0 "10–14 fresh slots per small create" becomes roughly **16–20 fresh slots plus two shared appends** for a signed create with acceptance and all mandatory queries; a native rebind stays ~3–4 fresh slots plus appends. Against 5.06M for the fuller matched create and 627,672 for the native quote, that is the range the shared fixture must now test.

## 9. v1.2 — authority and Type identity (second falsifier round; lab `ca1a228`, compiled, tested, and receipt-diagnosed on six allowlisted cells)

The coordinator's second review asked whether Road B's source-origin authority and exact Type identity hold, separately from later Realm acceptance policy. Falsifying tests were written and desk-checked against the earlier Core; an observed red run against every earlier version is not established. The repaired `ca1a228` Core built and passed 43 Forge tests in the 08:50 UTC slot after restructuring the previous pin's stack-depth failure. A six-cell receipt diagnostic then ran at 09:00 UTC, retained at `5891cc5`; costs below belong to that repaired profile, not a rewrite of §2's earlier evidence. The lab's `FALSIFY.md`/`REPAIR.md` records the source history. Runtime sizes: Ledger 17,280 B (previously 16,699), TypeRegistry 3,270 B, IndexModule 4,127 B, LensReader 9,445 B.

| Falsifier | Source-review outcome on the old Core | Repair (compiled/tested; selected receipt checks below) |
|---|---|---|
| F1 native-source import (`v == 0` packet) | **unsafe by construction**: a bare claim of another principal could mint and control that principal's Subject at the destination | fail closed: `E_SOURCE_UNSUPPORTED`; this import route rejects and stores nothing. Attributed claim retention would be a separate feature, not implemented by this refusal. A temporary prototype limit, not a waiver of portability or an invented source proof |
| F2 signed-source import | **safe**: foreign principal, relabelled realm, unrelated sender and cross-entrypoint replay all refuse; nothing written | none. The `(name, version)`-only EIP-712 domain remains a separate FUTURE replay-domain item |
| F3 Type identity under re-registration | **unsafe**: in-place overwrite reinterpreted existing records' bodies | `typeId = keccak(DOM_TYPE, shape, keccak(refTypes), ruleId)`; a second registration of an existing id reverts `E_TYPE_EXISTS`; the descriptor is immutable and reconstructible |
| F4 policy vs identity, historical basis | **unsafe**: the only policy lever rewrote identity and no retained row named the rule that admitted an old record | policy table with append-only activation rows; each admission records its row (packed into the existing admission word); `acceptanceBasis(ordinal)` answers for old and new admissions |
| F5 policy activation replaces the validator | **unsafe** (found against the F3/F4 repair): `activate(T, address(0))` or a permissive acceptor admitted a body the Type's declared rule refuses, under the same id | the mandatory rule is pinned in the descriptor (its codehash is the `ruleId` in the id) and ALWAYS runs first, refusal final (`E_REJECTED`); `activate` only appends an additional Realm policy that must also accept (`E_POLICY_REJECTED`); row 1 = no additional policy; the profile folds `(typeId, ruleId, policyCodehash, epoch)` and the basis records both |

**What a codehash pins, stated not waived.** Pinning an acceptor's codehash pins its code, not its dependencies or storage: the lab's `MockAcceptor` changes behaviour under one codehash, so it is demoted to a documented mutable double installable only as additional policy, and the fixture Types use acceptors whose thresholds are immutables (part of the code, hence of the id). A test (`F5d`) demonstrates that a mutable mandatory rule keeps the same id while changing meaning. Road B does not claim production requires pure callbacks; stateful rules remain allowed when their dependency and basis semantics are declared, which is the programmable-acceptance boundary of §8.5, not a property of this slice.

**Costs observed (receipts at `ca1a228`, 2026-09-13 09:00 UTC; evidence
`measure3-ca1a228.json`).** This is a six-cell diagnostic, not a matched B/C
run or Files parity. Native/signed quote creates cost 1,226,435/1,271,630 gas;
edits 520,724/567,395. Against exact retained packet `5960336`, the respective
deltas are +9,642/+9,665 and +8,826/+8,822. These are whole-profile differences,
not a paired isolation of F5: mandatory/additional-policy calls, descriptor
reads and other source changes differ. Native storing resolve/list cost
137,909/97,725; stateless resolve/list 51,173/89,168. Adding a policy row costs
82,530; `activate(0)` 59,661; in-cell Type registration 131,287.

Selected refusal checks retain caller-qualified probes, decoded arguments,
failed receipts and unchanged getter probes: mandatory-rule rejection before
activation, after zero policy and under permissive policy (220,307 each);
additional-policy refusal; stale-signature rejection; unchanged-Type
re-registration refusal; unsupported native imports on both destination
paths. The old QUOTE admission names **row 2/mock, activation epoch 7**, while
its profile uses global epoch **8**; the new admission names **row 3/StrictQuote,
activation/global epoch 9**. Codex corrected the earlier row/epoch narration
against raw evidence; packet bytes are unchanged.

Independent offline review joined 75 signed transactions, 13 expected failed
receipts, nine explicit argument cases, 237 unchanged pre/post getter pairs,
seven basis rows and all 18 source hashes: GO for retained RPC consistency
and signature evidence, not chain-state authentication or full semantic-oracle
passage. The state-only reconstructor still reuses the profile hash. The
offline reviewer regenerated the stale profile using the separately retained
RPC epoch; that does not close state-only reconstruction after transcript loss.

**Independent review qualification (Codex, 2026-09-13 08:56 UTC).** The
mandatory-first dispatch and runner repairs are source-ready for a bounded
receipt diagnostic. `acceptanceBasis.epoch` names the policy activation-row
epoch, not the admission-time global registry epoch folded into the signed
profile; those can differ after another Type changes. The current
reconstructor reuses the retained profile hash when recovering the signature,
so independent regeneration of the complete profile is not demonstrated.
This is an evidence-completeness gap, not an additional acceptance bypass.
F5 direct negatives plus shared-path inspection do not imply a separately
executed negative for every ingress. Cost comparisons must retain these
qualifications and the mutable-validator limitation above.
