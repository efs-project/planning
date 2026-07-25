# Authority model — grades from mechanics, the L1 pointer judged, and the N1 decomposition

**Lane:** authority-model centerpiece, 2026-07-25 joined KEL × authority × lens filesystem reconciliation pass
**Charge owned:** rulings 3, 4, and 7 of the pass framing, plus the N1 decomposition that makes the owner packet answerable
**Status:** reconciliation input; nothing here is ceremony-final
**Inputs (read in full or per charge):** [[README]], [[owner-decision-inbox]], [[owner-rulings]], [[human-overview]], [[kel]], [[assumptions-and-requirements]], [[ethereum-first-efs-and-os]], [[solana]] §§6.5–6.6/8/12, [[large-file-uploads]], [use-cases](./use-cases.md), [aa-inversion](./aa-inversion.md)
**Sibling lanes built on, not redone:** [aa-inversion](./aa-inversion.md) (the residual R1–R7 and its §6.2 pointer shapes), [use-cases](./use-cases.md) (the register, §5.8 raw-material map, J4)

#status/draft #kind/review #repo/planning #topic/efsv2 #topic/kel #topic/authority

> **How to read this file.** §1 solves the authority-strength puzzle by derivation, not enumeration: four premises, three theorems, one corollary; the grades fall out, and the two-grade hypothesis is judged against them. §2 designs the minimal L1 pointer and then judges it (justify-or-unnecessary, as ruling 4 demands). §3 is the N1 decomposition — seven axes, each independently answerable, with the coherence map onto [[assumptions-and-requirements#9. Coherent KEL architecture choices|Options A–D]] and [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive|Shapes A–E]]. §4 separates the four old N1A bundle riders. §5 runs the adversarial set against this model's own answers. Every question for James lives only in "## Decisions for James."

---

## 0. Verdict in one page

1. **The two-grade hypothesis survives — because it is a theorem, not a product choice.** The weak grade (`PORTABLE-EVIDENCE`) is exactly what signatures can promise anywhere with zero setup; the strong grade (`AUTHORITY-ADMITTED`) is exactly what an admission-ordered witness co-located with the author's KEL can promise; nothing in between is a stable third *authorization* grade (§1.4). Two refinements sharpen it without breaking it: (i) the evidence lane with a venue ordinal is a mechanically real intermediate — **ordered evidence** ("existed by ordinal N," authorization unchecked) — which deserves a read-vocabulary label and the already-designed promotion path, but no new kernel machinery and no user-facing authority tier; (ii) `SNAPSHOT@H`/`CURRENT@H` are the *portable and freshness forms of the strong grade*, i.e. positions on an orthogonal freshness axis, never a third authority grade ([[assumptions-and-requirements#10. Proposed authorization/evidence-basis grades]]).

2. **The strength ceiling without a privileged chain is precisely: per-principal-relative, full-strength.** Rejecting post-revocation backdating requires one ordering domain **per principal** (the co-location corollary, §1.2), not one chain for everyone. Multiple realms can each mint full-strength grades for their own resident principals. What "no single privileged chain" actually costs is not backdating protection — it is *discovery* (which realm speaks for this principal?) and *cross-realm uniformity*. That cost is the entire content of the pointer question (§2) and axes AX-2/AX-4 (§3).

3. **The L1 pointer is judged: unnecessary in the v2 baseline, conditionally.** Under a fixed profile it has zero consumers ([use-cases §5.8](./use-cases.md)); under genesis-committed homes its durable-discovery half is already inside the identity word ([[kel#4.4 Born-KEL identity]]); it becomes *constitutive* only under movable per-principal homes — and there its security ceiling is exactly the KEL that governs it: **a pointer can never be stronger than the recovery machinery of the identity it points for** (§2.3). The genuinely-owner residue is the re-home product promise, which [use-cases J4](./use-cases.md) already isolated; this lane consolidates it with the security analysis as Decision A5.

4. **The FS-vs-OS venue question largely dissolves under the co-location corollary** (§3, AX-4): the filesystem does *not* require the social/OS layer's venue, but strong-grade writes by a principal require that principal's KEL to be co-resident with the admitting realm. A shared social identity anchored elsewhere participates in a realm-local filesystem at snapshot/evidence grade. The remaining owner question is a product-acceptance question, not an architecture fork.

How this page breaks: if the reader flattens the grade axes back into one Boolean `valid`, or treats the ordered-evidence intermediate as a user-facing promise tier, every honest boundary below turns into security theater. The multi-axis result model ([[human-overview#7. The seams that must be closed]] seam 7) is load-bearing for everything here.

---

## 1. The authority-strength puzzle, solved from mechanics

### 1.1 The threat, stated exactly

Alice's phone holds actor key `A1` under a scoped grant for principal `P` at `authEpoch e` ([[kel#7. Actor and session authorization]]). The phone is stolen at wall-clock time `t0`. Alice revokes the grant; the revocation is admitted at her KEL's ordering domain at ordinal `r`. At `t1 > t0`, the thief uses `A1` to sign a malicious record whose author-controlled fields (`order`, `claimedAt`) claim it was created before `r`. The record's bytes are indistinguishable from an honest pre-theft record.

The question of ruling 7: for each authority grade, what can a reader *reject*, and with what evidence — and, with no single privileged chain, how strong can the rejection be?

### 1.2 What rejecting backdating structurally requires — the derivation

Premises (each already an adopted or ratified-direction statement; cited):

- **P1.** A signature proves that a key signed exact bytes; it carries no trustworthy creation time ([[kel#8.2 Admission-time ruling]]; [[assumptions-and-requirements#3. Recommended cross-pass baseline, pending ratification]]).
- **P2.** `order` is author-controlled ordering and `claimedAt` is testimony; neither is authority or chronology (R-D9, [[assumptions-and-requirements#Records and kernel]]; [[owner-decision-inbox#Q1 — Rename `seq` to `order`|Q1]]/[[owner-decision-inbox#Q2 — Always include `claimedAt`|Q2]]).
- **P3.** Revocation is an event at a definite position `r` in some ordering domain `D_K` — the domain that orders the principal's KEL ([[kel#6. Event state machine]]).
- **P4.** From P1+P2: a record honestly created before `r` and a record backdated after `r` by the same key are **byte-identical artifact classes**. The thief holds the same key and free choice of every author-controlled field.

**Theorem 1 (impossibility at the portable-evidence floor).** No verifier examining only the artifact plus signed KEL history can distinguish the two classes in P4: any acceptance function over identical inputs accepts both or neither. Portable evidence alone can therefore be graded at most "signed by a key that was *at some time* authorized" — never "authorized when created." This is structural, not an implementation gap; no amount of signature sophistication (threshold, PQ, account-layer attestation — [aa-inversion §3.3](./aa-inversion.md)) changes the input set.

**Theorem 2 (what suffices: an existence witness ordered against the KEL).** Let `W` be a third party that observed the record (or a commitment to it) at position `w` in an ordering domain `D_W`. If `D_W = D_K`, or a *verifiable order embedding* `D_W → D_K` exists, then a reader can evaluate `w < r`: a record witnessed before the revocation cannot have been created after it. A record *not* witnessed before `r` cannot earn the claim — it may be honest-but-unwitnessed, and it is correctly downgraded; that availability cost is irreducible and must be stated plainly ([[kel#9. Current versus historical verification]]: "This is unavoidable").

**Theorem 3 (ordering is necessary but not sufficient; authorization needs the check).** `w < r` proves the key was not-yet-revoked; "authorized" is richer: scope, kind/definition sets, resource ceilings, epoch, expiry, ancestry revocation, counters ([[kel#7.2 Grant certificate]]). Someone must evaluate the full grant check *as of `w`*. Two mechanically distinct ways:

- **(a) Check at admission, persist the result.** The witness runs the check in the admission transaction and stores an immutable receipt (`EnvelopeAuthReceipt` + `ClaimAdmission`, [[kel#8.2 Admission-time ruling]]). The result is O(1)-readable forever, contract-consumable ([[kel#15. Tier-1 ABI and grades]]), and survives log pruning because it is state ([[owner-rulings]] 2026-07-10 full-body-spine reasoning). The receipt is the **state-materialization of an otherwise-archival fact** — this is why admission-time checking is forced: the chains-persist ruling assumes state persistence and current queryability, deliberately *not* century-scale archival history ([aa-inversion §6.1](./aa-inversion.md)).
- **(b) Order existence only; readers re-derive.** The witness merely logs ordered existence; the reader retroactively replays state-enumerable KEL/grant history up to `w`. Client-feasible, unbounded for contracts (violates bounded-read invariant 8, [[kel#1. Constitutional invariants]]), and multiplies independent-implementation risk of the grant check across every reader.

EFS needs (a) for the strong grade. But (b) is not discarded — **it is exactly the evidence lane** ([[kel#8.3 Confluence boundary]]): admission to the evidence lane at a venue ordinal is mechanically (b) without the check. The two-lane kernel is not an implementation convenience; it is the pair of mechanically distinct witness services this derivation produces.

**Corollary (co-location).** Independent chains do not form a total order — Solana slots and Ethereum blocks have no verifiable mutual embedding ([[solana#6.6 Authority and sovereignty]]); wall-clock timestamps give only an approximate embedding with adversarially manipulable skew. Therefore the strong-grade witness must be the **same ordering domain as the principal's KEL**. Strong grade ⇒ record admission co-ordered with KEL state, per principal. Three consequences:

1. The strong grade needs one ordering domain *per principal*, not one privileged chain for the world. Realms can each be full-strength for their residents (feeds AX-2).
2. A filesystem realm cannot mint strong-grade admissions for a principal whose KEL lives elsewhere — at best snapshot-grade against a proven foreign basis (answers the technical half of the FS-vs-OS question; feeds AX-4).
3. Cross-domain "witnessed on X before revoked on Y" is at best a timestamp heuristic and must never earn the strong grade (feeds the grade table below).

### 1.3 The witness services, enumerated

The complete ladder of witness service that any topology can offer, with what each buys:

| # | Witness service | What it proves | What it cannot prove | Kernel machinery needed |
|---|---|---|---|---|
| W0 | none (signature only) | key signed exact bytes; internal self-consistency of `prev`/`order` chains | any time; any authorization; any absence | none |
| W1 | existence timestamp in a *foreign* domain (anchor on another chain, transparency log, OpenTimestamps-class) | existed-by-T in that domain's clock | strict order against the KEL domain (no embedding); authorization | none — an ordinary record/checkpoint on some venue |
| W2 | ordered existence in the *same* domain as the KEL (**evidence lane**) | existed-by-ordinal-N, strictly comparable to `r` | authorization-at-N (unchecked); slot effects | evidence-lane admission + venue ordinal (`admittedAt`-class, [[owner-decision-inbox#Decide after evidence — do not answer yet|E3]]) |
| W3 | ordered existence + admission-time authorization check + persisted receipt (**authority lane**) | actor/grant valid at ordinal N; slot effects applied under the principal | nothing beyond its domain's own integrity; see §1.7 | the authority lane: check + `AuthReceipt`/`ClaimAdmission` in state ([[kel#8.2 Admission-time ruling]]) |

W1 and W2 differ only in whether the embedding into `D_K` is exact; W2 and W3 differ only in whether the check ran. Promotion W2→W3 exists and is exactly once per claim ([[kel#8.1 Required signed seam]] first-authoritative-admission rule). This ladder is the mechanical content behind the chain-free product ladder (local → replicated → witnessed → chain-authoritative, [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]).

### 1.4 The grades that fall out — and the two-grade hypothesis judged

Mapping the ladder to the ratified-direction grade vocabulary ([[assumptions-and-requirements#10. Proposed authorization/evidence-basis grades]]; kel.md aliases in parentheses, [[kel#15. Tier-1 ABI and grades]]):

- **`PORTABLE-EVIDENCE`** (`PORTABLE-SIGNATURE-ONLY`) = W0, optionally annotated with W1 existence bounds. The zero-setup grade — works on any chain, any store, no ceremony (pass ruling 3's "bare works anywhere").
- **Ordered evidence** = W2: `PORTABLE-EVIDENCE` + a same-domain existence ordinal. **Refinement 1:** this deserves a read-vocabulary label (proposal: `EVIDENCE-ORDERED@N`) because it has a crisp mechanical meaning and real consumers (G-LEGAL-1's existence-by-basis proof, [use-cases §2.8](./use-cases.md)) — but it is **not a third authorization grade**: authorization remains policy-dependent, it is upgradeable via promotion, and surfacing it as an authority tier would invite exactly the false-accept/false-reject dilemma of §1.6.
- **`AUTHORITY-ADMITTED`** (`HOME-ADMITTED-AUTH`) = W3. The strong grade.
- **`SNAPSHOT@H` / `CURRENT@H`** = W3 facts *carried or observed* elsewhere/later: a portable `AuthProof` against a finalized basis, or a live home read under a freshness policy. **Refinement 2:** these are the portable and freshness *forms* of the strong grade — the freshness axis of the multi-axis result, orthogonal to authorization. Treating "receipt-carrying evidence replicated elsewhere" as a third grade (the candidate the charge names) would double-count: the replica adds no authorization fact, only a staleness qualifier. This is why two suffice.

**Judgment on the two-grade hypothesis (pass ruling 3): validated as a floor/ceiling theorem, refined twice, not beaten.** No stable third *authorization* grade exists between W0 and W3, because the only mechanical difference W2 adds (ordering without checking) is upgradeable and policy-incomplete, and the only difference replication adds is freshness. Every read shows its grade: that requirement (R-AU6, [use-cases §5.2](./use-cases.md)) becomes "every read exposes the tuple `(authorization grade, existence bound, freshness basis, completeness)`," never one collapsed word. [aa-inversion §6.4](./aa-inversion.md) reached the same floor/ceiling conclusion by inversion; this section supplies the missing derivation and the intermediate's precise status.

### 1.5 What each grade can reject, and the evidence each rejection needs

The strong grade's structure is **default-deny**: a backdated record is not *detected* — it simply never acquires the grade, because the only thing that could confer it (a pre-`r` admission) cannot be forged retroactively. No detection machinery is added; in particular this does **not** reopen the rejected on-chain collision bit, which addressed a different problem (same-slot equivocation TOCTOU, [[owner-rulings]] 2026-07-15 item F) and stays settled.

| Reader holds | Can reject | Cannot reject | Evidence the rejection needs |
|---|---|---|---|
| W0 artifact only | forged signatures; tampered bytes; wrong-suite witnesses; internally inconsistent `prev` chains | **any backdating**; any revoked-actor use; any absence claim | the artifact + suite spec ([[kel#5.5 Canonical event and signature transcript]]) |
| W0 + signed KEL history | records by *never-authorized* keys; records naming epochs that never existed | backdating across a revocation (Theorem 1); withheld-head games (§5.3) | the KEL event chain — itself withholdable |
| W1 anchor | claims of creation *after* the anchor time | creation-time claims *before* the anchor; authorization | the anchor + its domain's clock; cross-domain order is heuristic only |
| W2 ordered evidence | "created after ordinal N" claims, exactly | authorization at N (must re-derive, client-only) | the evidence-lane ordinal + state-enumerable KEL to N |
| W3 receipt (at home) | **all post-revocation backdating**: no primary admission before `r` ⇒ no strong grade, mechanically | pre-revocation-window forgeries (§1.7); home-integrity failures (§1.7) | `getPrimaryAdmission(claimId)` + receipt — O(1) state reads ([[kel#15. Tier-1 ABI and grades]]) |
| W3 proof (anywhere) | same as above, as-of basis H | anything after H (staleness) | `AuthProof`: receipt + account/storage proof + finalized basis `(chainId, block, stateRoot, finality checkpoint)` ([[kel#8.2 Admission-time ruling]]) |

### 1.6 What the weak grade structurally cannot promise

Stated as promises, for the product copy and the lens vocabulary — each with the theorem that forbids it:

1. **Cannot promise anti-backdating** (Theorem 1). A weak-grade reader facing a revoked grant must choose policy: accept all evidence-only records from that grant (false-accepts the thief) or reject all (false-rejects honest unadmitted work). **The dilemma is the weak grade**; the strong grade dissolves it by making witnessing available before revocation, not by better examination.
2. **Cannot promise definite revocation or current control** — any KEL copy may be stale; "current" without a named basis is meaningless (rule 6, [[assumptions-and-requirements#2. Vocabulary: do not mix these categories]]).
3. **Cannot promise absence or completeness** — evidence chains are withholdable (§5.3; R-L6).
4. **Cannot promise newest-head** — replay of old signed heads is undetectable without a remembered basis or witness ([use-cases journey (d) break](./use-cases.md); [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]] freshness bootstrap).
5. **Can promise, honestly and forever:** exact bytes, key-binding, internal order consistency, and every claim *as a claim*. This is a real product (chain-free mode's rows 1–8, [use-cases §4](./use-cases.md)) and must never be marketed as less than it is or more.

### 1.7 How the strong grade breaks — its own honest limits

- **Pre-revocation window.** Everything the thief signs and gets admitted between theft and revocation carries genuine receipts. Irreducible in any design ([use-cases journey (c)](./use-cases.md)); mitigations are operational (fixed expiries, narrow ceilings, `DISAVOW_INTERVAL` advisory overlay that never mutates base grades — [[kel#6. Event state machine]]).
- **The grade inherits its domain's integrity, not its liveness.** A censoring realm cannot forge receipts, but it can refuse admission — starving a principal of the strong grade (not of evidence). Liveness is an E1 measurement axis (force inclusion, censorship), not a grade property; see §5.5.
- **Receipt semantics inherit the admitting code basis.** A receipt is only as meaningful as the frozen kernel that minted it; hence R-K12 (single active kernel, atomic succession, old receipts stay verifiable) and the no-mutable-verifier rule ([[kel#4.5 Home topology: canonical locator plus co-located authority]]; [[solana#6.5 Proofs, finality, and honest grades]] program-mutability trap).
- **Finality is an input, not a product.** `AUTHORITY-ADMITTED` observed before finalization can reorg away; the proof form binds a finalized basis, and gate reads fail closed on unfinalized/unknown bases (R-K9, R-X3).

---

## 2. The L1 pointer/index candidate — designed, then judged

Ruling 4 requires this lane to design the minimal durable L1 pointer and justify it or prove it unnecessary. [aa-inversion §6.2](./aa-inversion.md) priced the three shapes (fixed profile / genesis-committed / updatable pointer); this section supplies the concrete minimal design and the security analysis, then renders judgment. It does not redo the shrink test.

### 2.1 The minimal design

```text
HomePointer registry (Ethereum L1, immutable, adminless):

  pointer[principal: bytes32] -> HomeClaimV1 {
    realmRef,        // chainId + immutable kernel/registry identity + code basis version
    pointerNonce,    // strictly increasing per principal
    status,          // ACTIVE | RETARGET_PENDING | SEALED
    eligibleAtBlock  // L1 delay gate for pending retargets
  }

  commit[principal] -> bytes32   // append-once LegacyUpgradeCommitmentV1 for bare EOAs
                                 // (the kel §4.2 row, re-homed here)
```

This is a **pointer, not a state copy** (ruling 4's own framing): it names where the authoritative record/KEL/slot/index graph lives; it stores none of it. A "fixed authority domain" that stored KEL or receipts on L1 while records live elsewhere would recreate the cross-chain join [[assumptions-and-requirements#D-2 — What sovereignty and authority scope is acceptable?|D-2]] warns against — deliberately excluded.

**Who may write.**

- *Inception:* a born-KEL principal's first entry must match the `authorityHomeRef` already committed inside its identity word ([[kel#4.4 Born-KEL identity]]) — the registry can verify the digest, so inception writes are permissionless-submittable and unforgeable. A bare/address-shaped principal writes through the append-once commitment + reveal path ([[kel#4.2 First-use legacy upgrade commitment]]), or receives the protocol default home with no entry at all.
- *Retarget (re-home):* requires a proof that the **source home authorized departure** — a finalized `MIGRATE_PREPARE`-class KEL event at the current home, under precommitted-next or recovery authority ([[kel#4.5 Home topology: canonical locator plus co-located authority]] phase 1) — followed by the L1 delay window, during which the committed veto/recovery clause can cancel. The pointer never accepts a bare "principal's key says move": pointer-update authority is **delegated to the home being left**, so the registry never becomes an independent authority root.

**Update rule:** two-phase, mirroring [[kel#4.5 Home topology: canonical locator plus co-located authority|kel §4.5]] but reduced to the locator's own transitions (`ACTIVE → RETARGET_PENDING → ACTIVE'`), with the source sealed at cutover and no phase in which two realms may admit. **Cost profile:** one L1 transaction at inception (sponsorable; the write is a signed object anyone can submit) and one per retarget; zero L1 cost on the read path for same-realm readers (the realm knows itself); one L1 proof verification for cross-realm readers establishing "which realm is authoritative for P." **Registry succession:** immutable versions with principal-authorized, proof-carrying transitions and an archival version-chain resolver — the hard unsolved problem [[kel#4.5 Home topology: canonical locator plus co-located authority|kel §4.5]] flags as a freeze blocker; it does not get easier by shrinking the registry.

### 2.2 Squatting and poisoning

- **Born-KEL principals: unsquattable.** The entry must reproduce the home commitment inside the identity digest; registering someone else's principal requires their genesis preimage and inception witnesses. Poisoning reduces to signature forgery.
- **Bare/address-shaped principals: the exposed class.** Any entry requires proof of key possession — which the thief also has. Pre-theft, the append-once commitment is the only asymmetry-creating device (thief cannot replace it, cannot reveal it without the committed factors). Post-theft with no commitment, the first-inception race is cryptographically symmetric and must be labeled so (`LEGACY-HOME-CONTESTED`, [[kel#15. Tier-1 ABI and grades]]); no registry design fixes symmetric key knowledge ([[kel#19. Loose ends resolved]] "thief inception").
- **Garbage/spam entries:** entries are per-principal-keyed and possession-gated; the spam surface is the submitter's own principals — paid, bounded, harmless (consistent with the permissionless-pool posture, [[large-file-uploads#James rulings (2026-07-07)]] #2).

### 2.3 Thief-declares-a-different-home — does the pointer close it, and what closes pointer theft

Per topology (this is the §1 co-location result meeting the locator):

| Topology | The attack | Closed by |
|---|---|---|
| Fixed single profile | does not exist — there is no home choice to lie about | construction |
| Genesis-committed home | **closed structurally**: re-homing a digest principal changes the principal ([aa-inversion §3.2](./aa-inversion.md)); the thief can only mint a *different* identity | construction |
| Per-principal movable, **no locator** | **unclosable**: the `home` row is an ordinary forgeable claim ([[human-overview#7. The seams that must be closed]] seam 9); two realms answer `CURRENT` for one principal; readers partition on which they asked — R-K11 violated | nothing — this combination is incoherent (§3.8) |
| Per-principal movable, **with the pointer** | reduced to **pointer theft**: the thief must win a retarget, which requires source-home KEL authority + L1 delay + veto window | the KEL authority ladder (precommitted next > veto > recovery > current, [[kel#6. Event state machine]]) + monitors + L1 finality |

**The pointer-theft theorem:** the pointer's update rule delegates to the source home's KEL, therefore **the pointer can never be stronger than the recovery machinery of the identity it points for**. A thief who fully wins KEL control (compromises the next-state commitment or the recovery quorum) wins the pointer with the same stroke; re-homing then becomes part of the theft playbook, gated only by the same delay/veto machinery as recovery itself. The pointer adds discovery canonicality; it adds zero *authority* security. Anyone proposing it as a security upgrade is selling theater.

### 2.4 What breaks without it

- Under a **fixed profile**: nothing. Discovery *is* the profile; the use-case register finds zero consumers (R-XC3, [use-cases §5.8](./use-cases.md)).
- Under **genesis-committed homes**: nothing for discovery (it is inside the ID; a reader of the principal word knows the realm). What is genuinely absent is same-principal re-home — leaving a realm means a successor identity with a signed continuity claim (the D-6 recommended arm, [[assumptions-and-requirements#D-6 — If D-2 permits per-principal homes, is same-principal cross-chain migration a v2 requirement?|D-6]]).
- Under **movable per-principal homes**: everything — discovery has no canonical answer, the thief-declares-home attack opens (§2.3 row 3), lens resolution cannot even group principals by home ([[human-overview#7. The seams that must be closed]] seam 15). The pointer is **constitutive** of that topology, not an optional accessory. This kills the framing of "pointer yes/no" as an independent question: it is a dependent variable of AX-2.

### 2.5 Alternatives, enumerated

1. **Fixed single profile** — no locator needed (Option B, [[assumptions-and-requirements#9. Coherent KEL architecture choices]]).
2. **Realm-qualified identities** — no *global* answer needed: authority is always stated as `CURRENT-in-realm-R`; a principal resident in two realms is two qualified answers, reader policy picks (R-K11's own framing; Shape C, [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive]]).
3. **Genesis-committed home** — discovery inside the ID; degenerate form of the pointer with immutable semantics and zero L1 machinery.
4. **Social discovery** (follow graphs, name systems, `home` hint rows) — fine as *cache/UX*, never authority: forgeable by exactly the thief the question is about ([[human-overview#7. The seams that must be closed]] seam 9's advisory-only rule).

### 2.6 T1 and T2, reconciled explicitly

**T1 — chains-don't-die vs transient-L2/L3 stranding.** The two claims operate on different objects, and both sibling lanes converged on the same split this lane confirms: the adopted assumption covers **data/read persistence** on any venue (records admitted on X stay readable on X; old links never break — [use-cases §6 T1](./use-cases.md)); it was ruled with Ethereum-class venues in mind and says nothing about whether an arbitrary two-year-old L3 is an acceptable **authority home** ([aa-inversion §6.1](./aa-inversion.md); [[owner-rulings]] 2026-07-23 records James's own "L1 expensive / L2s transient" objection as an E1 matter). This lane adds the authority-side consequence: home-quality decline (censorship, fee spikes, operator exit with state intact) is a **liveness** degradation of the strong grade, never an integrity one (§1.7) — reads, exports, and evidence continue; only *new strong-grade admissions* suffer. Therefore the honest reconciliation is a scope statement, surfaced as the venue-class rider on Decision A5: either the persistence assumption is qualified per venue class for authority homes, or strong-grade homes are restricted to the venue class the assumption covers. Not silently picked.

**T2 — the pointer vs the cross-chain stop-rule.** The stop-rule is a research stop-rule, not a prohibition ([[owner-rulings]] 2026-07-23 correction), so the pointer was argued on merits above, not assumed away. The argument's outcome: the pointer is unjustified by any gathered or generated use case ([use-cases §6 T2](./use-cases.md)), unnecessary under two of three coherent topologies, constitutive under the third, and security-neutral everywhere (§2.3). The stop-rule survives as posture; the pointer survives as a fully-designed candidate on the shelf, activated only by an owner choice of the movable-home topology or the re-home promise.

### 2.7 Judgment

**Unnecessary in the v2 baseline — conditionally, and the condition is exactly one owner choice.** If James does not promise same-principal re-home (Decision A5 = arm A), the pointer has no consumer under any recommended topology: fixed-profile needs nothing, genesis-committed carries its own discovery. If James promises re-home (arm B), the updatable pointer (or an equivalent canonical locator) becomes required v2 surface and brings its full bill: L1 registration economics, adminless registry succession (unsolved), the two-phase no-dual-admission machinery, and the pointer-theft surface bounded by recovery strength. The write-once discovery-only variant (arm C) buys a permanent public "where did P anchor" fact for merged multi-realm views at freeze-byte cost for a NICE ([use-cases J4-C](./use-cases.md)). Recommendation and reason trail live in Decision A5, consolidated with [use-cases J4](./use-cases.md) and [aa-inversion J-4](./aa-inversion.md), which this section supersedes-in-form (their substance is preserved; the security analysis is new).

---

## 3. The N1 decomposition

### 3.0 Method

The held N1 ([[owner-decision-inbox#N1 — Strong authority without a cross-chain empire]]) bundles at least six choices plus the 2026-07-23 FS-vs-OS venue question ([[owner-rulings]] 2026-07-23). An axis is *independent* if it can be answered while every other axis stays open, and *genuine* if different answers produce different frozen surface or different product promises. Each axis below states: what it decides, what it does NOT decide, options with concrete examples, couplings (proved independent or named), recommendation + confidence, and the evidence class (E1/E2/E10-style) that would change it. The riders (inbox axis 6) are §4. Venue selection is deliberately kept out (AX-6 = E1, evidence-gated).

### AX-1 — Does the strong grade exist? (admission-time authority; = D-1 / R-K3)

- **Decides:** whether the kernel has the authority lane at all — receipts, the two-lane split, admission-time grant checks ([[human-overview#7. The seams that must be closed]] seam 3).
- **Does NOT decide:** where the witness lives (AX-2), how many realms exist, which venue (AX-6), whether bare users must register (they never do — the evidence lane is unconditional).
- **Options:** **(a) Yes** — G-PKG-1's stolen-publisher-backdates-a-release attack is rejectable; the archive can state "this release was authorized when admitted" forever. **(b) No** — read-time evaluation only; the Friday-signature-claiming-Monday problem stays permanently ambiguous ([[assumptions-and-requirements#D-1 — Do we require definitive protection from post-revocation backdating?|D-1]]); the kernel stays confluent and simpler; Option A of the ledger.
- **Coupling:** if (b), AX-2 and AX-3 largely evaporate (no witness to place) and the grade vocabulary collapses to W0–W2. All other axes are conditional on this one — it is the root of the decision tree ([[assumptions-and-requirements#8. The KEL decision tree]]).
- **Recommendation: (a) Yes — HIGH confidence.** Three independent lines now converge: the mechanics derivation (§1.2: nothing weaker rejects backdating), the account-layer inversion (no substitute exists or is coming — [aa-inversion §3.3](./aa-inversion.md)), and the use-case corpus (G-PKG/G-ORG/UC-V are MUST-grade forcing classes — [use-cases R-AU3](./use-cases.md)). **Evidence that would change it:** only a product ruling that EFS ships no package/org/gate class — no measurement can, since the claim is structural.

### AX-2 — Witness topology: realm-qualification + how many realms, who picks

- **Decides:** the semantics of `CURRENT` (R-K11), whether a locator exists (§2.4), lens fan-out shape (seam 15), and the bare-principal default-home rule (seam 9's three options).
- **Does NOT decide:** the venue (AX-6), the cross-realm consumption promise (AX-3), portability breadth (AX-5).
- **The decomposition insight that makes this answerable:** the semantic rule and the shipping count are separable. **Adopt realm-qualified authority as an invariant now** — every authority answer names its realm and basis; no unqualified global `CURRENT` exists (this is R-K11 promoted from "needs decision" to the rule that *every* option below obeys). Then the remaining choice is only: *how many realms does v2 ship, and is one privileged?* — which is far smaller than "choose a topology":
  - **(a) One realm shipped, extension-ready** — the fixed profile as the *first and reference realm*, not a metaphysical singleton (Option B read through Shape C's lens; the §17 first-prototype hypothesis, [[assumptions-and-requirements#17. Current first-prototype hypothesis]]). Example: v2 = one measured EVM realm; a later Solana realm is a conformance question, not a redesign.
  - **(b) Permissionless independent realms at launch** (N1B; Shape C) — realm discovery, realm-qualified grades, and explicit non-interoperability ship day one. Example: an L3 community runs its own EFS with local strong grades immediately.
  - **(c) Per-principal homes, genesis-committed** (Option C) — each principal names its realm inside its identity; multi-realm clients group by home. Example: Alice-on-Base and Bob-on-Arbitrum in one lens = two realm reads.
  - **(d) Per-principal movable homes + locator** (Option D; [[kel#4.5 Home topology: canonical locator plus co-located authority]]) — the demoted maximal profile; constitutively requires §2's pointer.
- **Coupling:** (d) forces the pointer (§2.4) and the 50-home fan-out bill (H-K5); (a) makes AX-4's cross-realm case hypothetical until a second realm exists; the bare-arm sub-choice (default home for unregistered bare principals vs sponsored registration vs evidence-only — seam 9) exists under every option and is settled by D-4's recommended arm (evidence-only until admitted) — record it with AX-2, not as its own axis.
- **Recommendation: realm-qualified invariant + (a) — MEDIUM-HIGH confidence.** (a) is the smallest strong-authority machine ([[assumptions-and-requirements#Option B — one fixed EFS authority domain for one protocol profile]]), the use-case asymmetry supports it (strong-grade-needing classes want one stable venue — [use-cases §6 T4](./use-cases.md)), and the realm-qualified invariant keeps (b) reachable without resigning anything. (c) is the natural *upgrade written into the ID derivation* and costs nothing to keep reserved. (d) stays research (H-K1–H-K4). **Evidence that would change it:** E1 measurement showing the chosen profile's fees/censorship are unacceptable for ordinary journeys (pushes toward (b)/(c)); a real product demand for realm sovereignty at launch (pushes toward (b)).

### AX-3 — Cross-realm consumption promise (= D-3)

- **Decides:** what a *foreign contract* may consume: nothing / explicit adapters + fully-specified local commitments / live remote authority.
- **Does NOT decide:** client behavior (clients can always verify remote realms under R-X2/R-X3 — that is not in question) or replication (mechanically free, [use-cases R-XC2](./use-cases.md)).
- **Options with example:** **(a)** clients verify; foreign contracts need an installed adapter or owner-pinned commitment with named updater/trust/rollback/freshness (R-X5/R-X7) — a Base contract consuming a Solana-realm fact does so through a disclosed oracle, or not at all. **(b)** EFS commits to live foreign-contract verification — a bridge/light-client platform per supported pair, funded as its own product ([[assumptions-and-requirements#D-3 — What cross-chain contract promise do we make?|D-3]] second arm).
- **Coupling:** genuinely independent of AX-2 (any topology needs this answer the moment two realms or one realm + one foreign consumer exist). Contradiction guard: AX-1=(b) + AX-3=(b) is incoherent (live-verifying an authority that does not exist).
- **Recommendation: (a) — HIGH confidence.** Zero use-case consumers for (b) (R-CR4 DEFERRED with none forcing, [use-cases §5.5](./use-cases.md)); physics does the rest ([[assumptions-and-requirements#1. The direct answer about chains and KEL homes]]). **Evidence that would change it:** a real application requiring synchronous foreign-contract authority (A-2's own reopen condition).

### AX-4 — Do the filesystem and the social/OS layer share an authority venue?

- **Decides:** whether a realm-local EFS can be self-sufficient while identity/social anchoring lives elsewhere — the 2026-07-23 question ([[owner-rulings]] 2026-07-23 UNDECIDED hypothesis).
- **What the mechanics already answer (no owner input needed):** the co-location corollary (§1.2) splits the question. The *filesystem* — records, slots, indexes, byte pool — is realm-local by construction; nothing about files requires any other chain. The *strong authority grade* is per-principal co-located: an FS realm mints `AUTHORITY-ADMITTED` only for principals whose KEL is resident there. A shared social identity anchored on realm Y therefore participates in FS realm X at **snapshot/evidence grade** — its records are admissible to X's evidence lane, its authority provable via `AuthProof@H` from Y, never live-strong on X. "FS works on any chain with zero dependency on another chain" and "one global identity" reconcile exactly here: both hold, at different grades, and R-K11's realm-qualification keeps them from colliding.
- **What remains genuinely owner:** the product-acceptance half — is snapshot-grade participation acceptable for cross-realm identities on realm-local filesystems? The use-case evidence says yes for files and browsing (weak/snapshot suffices for G-FILES/G-PHOTO/G-SCI — [use-cases §6 T4](./use-cases.md)) and no for package/gate classes (which need resident strong grade). Concretely: Alice's mainstream social identity can *read and be cited* everywhere; to *publish releases* on an L3's package registry at strong grade she enrolls a resident KEL (a persona/org principal on that realm) or the registry accepts snapshot-grade with a freshness policy.
- **Coupling:** consumes AX-1 (grades) and AX-2's invariant (realm-qualification); independent of AX-3 (client-side snapshot verification needs no contract adapter). This axis is where [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive|Shapes C/E]] live.
- **Recommendation: adopt the co-residency rule as the technical answer ("no shared venue required; strong grade is co-resident; cross-realm identity participates at snapshot grade") — HIGH confidence on the rule (it is §1's corollary); MEDIUM on the product default** (which classes demand resident grade is a per-class lens/gate policy, extendable later). **Evidence that would change it:** a demonstrated need for live cross-realm strong grade — which would reopen AX-3(b), not this axis.

### AX-5 — Portability breadth: what does "EFS supports X" mean

- **Decides:** the standards posture — one required Ethereum profile with extension-ready seams / several supported realms / any conforming deployment ([[owner-decision-inbox#N1 — Strong authority without a cross-chain empire]] axis 5).
- **Does NOT decide:** topology (AX-2) or venue (AX-6); this is about conformance surface and product wording (including J2's `nativeProgramReadable` wording, [use-cases J2](./use-cases.md)).
- **Options:** **(a)** one required, measured profile + Ring-1 portable constitution + conformance-tested extension seams ([[ethereum-first-efs-and-os#9. Standards strategy]]; the §5 restraint rule: portable abstraction only where two real implementations need the same semantics). **(b)** several realms supported at launch. **(c)** "any conforming deployment" as a v2 claim — support-matrix inflation with no second implementation pressure-testing the bytes.
- **Recommendation: (a) — HIGH confidence**; matches the adopted six-capability separation ([[owner-rulings]] 2026-07-22) and the Solana judgment (L1/L2 first, L3 gated — [[solana#Executive judgment]]). **Evidence:** a second conforming implementation passing the falsification plan ([[solana#11. Falsification plan]]) is what upgrades (a) toward (b) — not a decision, a demonstration.

### AX-6 — Venue selection (named, not asked)

E1 remains evidence-gated exactly as held ([[owner-decision-inbox#Decide after evidence — do not answer yet]]): admission/rotation/recovery cost, finality, force inclusion, proof latency, RPC/state-reconstruction independence, and — added by T1 — the venue-class qualification for authority homes (§2.6). No recommendation is offered without the measurements; per [[owner-rulings]] 2026-07-23, "none of the chain/authority space is measurement-backed yet."

### 3.8 Coherence map

Which axis combinations are coherent, mapped to [[assumptions-and-requirements#9. Coherent KEL architecture choices|Options A–D]] and [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive|Shapes A–E]]:

| AX-1 | AX-2 | AX-3 | Maps to | Coherent? |
|---|---|---|---|---|
| No | — | (a) | Option A (portable-capability KEL); Shape D flavor | coherent, weak: no anti-backdating anywhere; kills G-PKG-class promises |
| Yes | one realm (a) | (a) | Option B; Shapes A/B; §17 first-prototype hypothesis | **coherent — recommended comparison baseline** |
| Yes | independent realms (b) | (a) | N1B; Shape C; the FS-vs-OS shape | coherent; discovery + realm-qualified grades are the price |
| Yes | genesis-committed (c) | (a) | Option C; Shape B/C hybrid | coherent; re-home = successor identity |
| Yes | movable + pointer (d) | (a) | Option D; kel.md maximal | coherent only with the full §2 bill funded; research track |
| Yes | movable, **no** locator | — | — | **contradictory** (§2.3 row 3: thief-declares-home unclosable; R-K11 violated) |
| No | — | (b) | — | **contradictory** (live-verifying nonexistent authority) |
| Yes | (a) | — + pointer built | — | **contradictory in practice** (pointer with zero consumers; freeze bytes for nothing — [use-cases §5.8](./use-cases.md)) |
| Yes | any | (b) | D-3 second arm | coherent but unfunded: a bridge platform per pair; no forcing use case |

The AX-4 co-residency rule and AX-5(a) are compatible with every coherent row — they are orthogonal, as claimed.

---

## 4. The rider axes (the old N1A bundle, now separable)

These four rode inside N1A ([[owner-decision-inbox#N1 — Strong authority without a cross-chain empire]] "The previous N1A bundle also included") and must never again be adopted as a side effect of a topology answer. Each is one choice, one recommendation, one trail. They are bundled as Decision A6 below — four separately-codeable items.

### 4.1 Legacy-EOA upgrade commitment — default posture

**Choice:** is the first-use salted upgrade commitment ([[kel#4.2 First-use legacy upgrade commitment]]) default-on at onboarding, opt-in, or absent? **Recommendation: default-on with an explicitly degraded, loudly-labeled skip.** It is the only pre-theft asymmetry available to a bare principal (§2.2); the honest cost is the lost-preimage/lost-factors availability risk, which the client mitigates by exporting and testing the recovery kit before committing (D-K13's validation condition). Venue-parametric re-cut required: the commitment row lives in the authority-domain registry under AX-2(a), on L1 only under AX-2(d) ([aa-inversion §5](./aa-inversion.md) §4.2 row). Trail: [[kel#23. Decisions for James]] item 3, [[assumptions-and-requirements#Secondary KEL choices after D-1 through D-7|D-K13]], [aa-inversion ledger 8](./aa-inversion.md).

### 4.2 Smart-account-only inception

**Choice:** may a deployed Safe/4337 account incept a born-KEL principal with one direct registry call? **Recommendation: yes — the deployed account itself calls (registry observes `msg.sender == account`), appointing portable EFS keys; ERC-1271/6492 remain banned from canonical inception and envelope/KEL verification.** One deliberately chain-local `msg.sender` fact at birth; never ongoing control (that is [aa-inversion J-3](./aa-inversion.md)'s question — accounts coordinate, KEL key material controls). Trail: [[kel#12. Ethereum account compatibility]], [[kel#23. Decisions for James]] item 4, [[assumptions-and-requirements#Secondary KEL choices after D-1 through D-7|D-K14]].

### 4.3 Personal non-transferability vs organization succession

**Choice:** are personal principals saleable/transferable? **Recommendation: no — personal principals are non-transferable; organizations rotate controllers (control succession is not identity sale); any future transfer feature is a separate explicit design.** Reputation transfer would make identity history a saleable asset, poisoning every provenance claim the archive exists to preserve. Trail: [[kel#11.4 Names]], [[kel#23. Decisions for James]] item 5, [[assumptions-and-requirements#Secondary KEL choices after D-1 through D-7|D-K15]].

### 4.4 Signature-suite succession

**Choice:** how do future suites (P-256 activation, PQ) become *authoritative* under immutable kernels? **Recommendation: the D-7 first arm — a frozen same-domain successor mechanism: exactly one active kernel at any basis, atomic cutover, old receipts stay verifiable, explicit user transition, no mutable verifier administrator.** Consume ERC-7913-shaped stateless verifiers as pinned-spec implementations, never as the spec ([aa-inversion §4.1](./aa-inversion.md)); evidence renewal (RFC-4998 posture) covers aging *records* regardless, since account-layer PQ agility only ever migrates current control ([aa-inversion §2 row 8](./aa-inversion.md)). Trail: [[assumptions-and-requirements#D-7 — How should future signature suites become authoritative?|D-7]], R-K10/R-K12, [[kel#14. Post-quantum and century evidence]].

---

## 5. How it breaks — the adversarial set run against this model

### 5.1 Stolen key + backdate, at every grade

Covered exhaustively in §1.5's table; residuals restated without cushioning: **weak grade — the attack succeeds** whenever the reader's policy accepts evidence-only records from onceauthorized keys, and the only alternative policy false-rejects honest work (§1.6.1). **Ordered evidence — the attack succeeds for authorization** (existence bounds hold; the thief's *pre-theft-dated* claims are refuted only if the record was never evidence-admitted before `r`). **Strong grade — the attack fails after `r` and succeeds inside the pre-revocation window** with genuine receipts; expiry ceilings and the advisory disavow overlay bound, never erase, that window (§1.7).

### 5.2 Thief races the honest re-home

Under AX-2(a)/(c): no race exists (nothing to re-home / re-home changes the principal). Under AX-2(d): the race is decided by the KEL authority ladder inside the L1 delay window; a thief holding only the current hot key loses to precommitted-next and to the veto clause; a thief who owns recovery wins everything including the pointer (§2.3's theorem) — which is the honest reason recovery composition (E10) is the real security budget, not the locator. Monitors are load-bearing: an unwatched delay is detection theater ([[owner-decision-inbox#Decide at launch or when resourcing exists|L4]]; [[kel#22. Verification and external-review gates]] item 10).

### 5.3 Withheld or hidden KEL heads

A verifier shown events `1..k` cannot know `k+1` exists ([aa-inversion §3.1](./aa-inversion.md)). At the home: absence is provable at a basis (state-materialized head + `eventCount`); withholding is an RPC attack answered by proofs or multiple providers (E-1/O-1). Off-home: any snapshot is honest only as `@H`; a gate consuming `SNAPSHOT@H` beyond its freshness policy fails closed (R-K9). The evidence lane cannot detect withholding at all — stated in §1.6.3, no machinery pretends otherwise. Residual: a home realm that *itself* suppresses a principal's new events presents a stale-but-internally-consistent state to everyone; only cross-realm anchors/checkpoints of the head (W1-class, cheap, already expressible as ordinary records) make that visible. Worth a Durable convention; not kernel surface.

### 5.4 Stale cross-chain snapshot presented as current

The grade vocabulary is the defense, and it is only as good as its enforcement points: every result carries `(grade, basis, freshness)` (R-X3); `SNAPSHOT@H` never upgrades to `CURRENT` by transport or prestige ([[solana#8. Main traps this architecture must prevent]] authority laundering); GATE profiles fail closed on stale-beyond-policy ([[assumptions-and-requirements#10. Proposed authorization/evidence-basis grades]]). Break of the defense itself: a client UI that renders the tuple as one green checkmark reintroduces the lie — a lens/OS conformance item (R-AU6), named for the lens lane.

### 5.5 A realm operator censoring admissions

Integrity holds (no forged receipts); liveness fails: the principal cannot mint new strong-grade records there. Degradation path: evidence lane elsewhere + later promotion; exports continue; reads continue (chains-don't-die covers the read side — §2.6 T1). Escape hatches are venue properties E1 must measure (force inclusion, direct submission, relayer diversity — E-2). Under AX-2(d) the *product* answer is re-home; under (a)/(c) it is successor-identity or waiting out the censor. This is the strongest honest argument *for* the re-home promise — it belongs in Decision A5's trail, weighed against §2.3's finding that the pointer adds no authority security.

### 5.6 Two realms both claiming CURRENT for one principal (R-K11)

Under the realm-qualified invariant (AX-2), the unqualified claim is definitionally invalid — there are only `CURRENT-in-R1` and `CURRENT-in-R2`, and a reader's lens picks or displays both. For one principal: genesis-committed homes make dual residency impossible by construction; bare uncommitted principals contested across realms are honestly `LEGACY-HOME-CONTESTED` (§2.2); movable homes resolve through the pointer's single L1 answer at a basis. The mount consequence: a mounted path must name its realm in the mount descriptor, and a merged multi-realm view must render realm labels or it lies ([use-cases R-XC1](./use-cases.md); [[mountable-filesystem-semantics]] realm/view identity blind spot in [[ethereum-first-efs-and-os#Joined blind spots to keep visible]]).

### 5.7 Recovery-flow social engineering

The recovery path is the highest-value con target because it legitimately overrides current keys. Defenses in the model: committed (not enumerable) guardian sets with per-leaf salts, delay + veto priority, no current-key cancel-alone, monitors, and `RECOVERY-PENDING` freezing new grants while records arriving mid-window stay `DISPUTED-INTERVAL` ([[kel#10. Recovery]]). Residuals stated plainly: a socially-engineered *quorum* wins by design (recovery is intentionally powerful — [[kel#21. Failure register]]); helper/vendor factors concentrate phishing surface; and whether ordinary people can run this safely is E10's acceptance gate, not a designer's claim. The J-2 locus question (how much of this machine EFS owns vs consumes) is held at [aa-inversion J-2](./aa-inversion.md) — this lane adds only: whatever the locus, the `DISPUTED-INTERVAL` grading must survive, because it is the only thing that makes the contested window *visible to readers* rather than merely survivable by the owner.

### 5.8 Malicious public data into a kernel-facing daemon

Authority-model-specific instances: (i) forged `home`/locator *hint rows* steering a resolver to a hostile realm — hints are cache only, never authority (§2.5.4); (ii) adversarial `AuthProof` bundles with oversized witnesses / wrong-basis proofs — bounded parsing, size caps before verification ([[kel#22. Verification and external-review gates]] item 12); (iii) account-state metadata consumed by adapters as if authoritative — never; account state is untrusted input ([aa-inversion §5](./aa-inversion.md) failure-register additions); (iv) grant-certificate floods against the admission checker — protocol maxima on ancestry depth and certificate size ([[kel#7.2 Grant certificate]]).

### 5.9 Mount check (pass rule 9) and the T3 touchpoint

**Mount:** every authority answer used by the resolver is a bounded state read (Tier-1 ABI, [[kel#15. Tier-1 ABI and grades]]); grades are closed enums projectable to `user.efs.*` within the bounded-metadata profile; reading requires no wallet or key (verification is pure over public state + bundles); `RECOVERY-PENDING`/`DISPUTED-INTERVAL` subtrees render stale-at-basis, never absent (the [aa-inversion §6.5](./aa-inversion.md) line item, seconded); and §5.6 adds the realm-labeling rule for merged views. No choice in this file forces the mount to lie or block — checked per axis.

**T3:** the authority model's own artifacts (KEL events, grants at first use, receipts, admission leaves) are small state-tier objects under the full-body spine, never DA-tier — so the authority lane is indifferent to the large-file tier reconciliation ([use-cases §6 T3](./use-cases.md) owns it). One elegant consequence worth recording: the large-file mechanism is grade-compatible for free — the *manifest envelope* is one ordinary admission (strong grade covers every committed byte transitively via `chunksRoot`), while chunk submission needs **no authority at all** (admitted iff bytes prove against the author-committed root, submitter ignored — [[large-file-uploads]]). Authorization happens exactly once, at the only place it means anything.

---

## Reconciliation ledger

Existing choices/requirements this lane touches, disposed explicitly:

1. **Two-grade authority hypothesis (pass ruling 3)** — **validated-and-refined**: floor/ceiling theorem (§1.4); refinements = the `EVIDENCE-ORDERED@N` read label (no kernel surface) and the freshness-axis status of `SNAPSHOT@H`/`CURRENT@H`. Not beaten; no third authorization grade earns a place, shown why.
2. **R-K3 / D-1 (anti-backdating)** — **still James's; evidence strengthened to structural**: §1.2 shows nothing weaker suffices and nothing external will supply it ([aa-inversion §3.3](./aa-inversion.md) concurring). Presented as Decision A1.
3. **R-K11 (no dual unqualified CURRENT)** — **elevated**: from "needs sovereignty decision" to the realm-qualified invariant every coherent AX-2 option obeys (§3 AX-2); the residual owner choice shrinks to shipping count + privilege.
4. **D-2 / D-3** — **restated** as AX-2 / AX-3 with the semantic-rule-vs-shipping-count split; recommendations preserved from the ledger (Option B first prototype; adapters-only), now with the coherence map (§3.8).
5. **kel.md §4.5 / §18 fork 8 (per-principal L1 locator + migration ruled inside kel.md)** — **remains demoted / superseded-in-place**: restated as AX-2(d) + §2's designed-but-shelved pointer; the §2.3 pointer-theft theorem is new adverse evidence (the locator adds discovery, zero authority security).
6. **kel.md §23 decision 1 (ratify §4.5 topology)** — **superseded** by this decomposition (the inbox's own demand); do not re-ask as written.
7. **N1A prior recommendation** — **superseded as a bundle**: its live content is distributed across AX-1..AX-5 + §4 riders; adopting any single axis no longer silently adopts the rest ([[owner-rulings]] 2026-07-23 correction complied with).
8. **Cross-chain stop-rule (2026-07-23 correction: research stop-rule, UNDECIDED)** — **respected, argued not assumed**: §2.6 T2; pointer judged on merits, kept as shelf candidate.
9. **Chains-don't-die (2026-07-10)** — **still-valid, scope-sharpened**: data/read persistence everywhere; authority-home venue-class membership is **newly-exposed** as the E1/A5 rider (§2.6 T1), concurring with both sibling lanes.
10. **No on-chain collision bit; closed sets + challenge windows (2026-07-15 item F)** — **still-valid, untouched**: §1.5 explicitly distinguishes default-deny backdating rejection from equivocation detection; nothing here reopens the bit.
11. **`act` provenance-only; KEL grants authorize** — **still-valid**; the grade tables treat `act` as display everywhere.
12. **Mandatory indexing / on-chain = metadata-exposed** — **still-valid, consumed**: receipts, grant materializations, and pointer entries are public graph metadata by construction; disclosure-preview posture (E11) unchanged.
13. **Bare-EOA zero state; passkey-sync + cold factor baseline; personas as separate KELs** — **still-valid**; bare-arm behavior recorded under AX-2 as D-4's recommended arm (evidence-only until admitted; stealth actors never authorize gates).
14. **Read-lens-spec grade list** — **superseded-pending-replacement** (per [[README]]); §1.4's axis tuple `(authorization, existence bound, freshness, completeness)` is this lane's input to the replacement vocabulary; do not append KEL states into one dominance list ([[human-overview#7. The seams that must be closed]] seam 7).
15. **human-overview seam 9 (bare/stealth authority-grade rule + home candidates)** — **advanced**: the three candidate resolutions map onto AX-2's bare-arm; recommended = evidence-only until admission (D-4), default home only under AX-2(a) where it is the profile.
16. **[aa-inversion](./aa-inversion.md) J-1/J-2/J-3** — **endorsed unchanged** (residual boundary; recovery locus; account-as-controller no). **J-4 and [use-cases](./use-cases.md) J4** — **consolidated and superseded-in-form** by Decision A5 (substance preserved; §2's security analysis added).
17. **use-cases §5.8 claim ("no MUST-grade requirement forces cross-chain machinery")** — **attacked as instructed and survives**: this lane's derivation independently finds the strong grade is realm-local per principal (co-location corollary), so no MUST class crosses realms; the only pressure found is §5.5's censored-principal case, which motivates re-home as a *product* promise, not as MUST machinery.
18. **FS-vs-OS venue hypothesis (2026-07-23)** — **largely dissolved technically** (AX-4 co-residency rule); residual product-acceptance question carried into Decision A4.
19. **E1/E2/E10/E11 evidence gates** — **unchanged**; E1 gains the venue-class rider (item 9); no measurement performed or pretended here.
20. **Mount requirement (2026-07-22)** — **checked and passed** per axis (§5.9); realm-labeling rule added for merged views.

---

## Decisions for James

Under the 2026-07-23 sequencing hold, these are the **revalidated decomposition** the held N1 asked for — inputs to the packet, answerable individually, never as one bundled code. Each is one axis; none silently adopts another. Reply codes like `A1a` work per item.

### A1 — Adopt the strong grade (admission-time authority)?

**Example:** a package registry's publisher key is stolen and revoked; the thief signs a plausible "old stable release" dated last year. With the strong grade, that release can never acquire authorized status — no admission receipt predates the revocation. Without it, every reader's policy must choose between trusting the thief and rejecting honest unadmitted history — forever.

- **A1a — Yes: build the two-lane kernel (evidence lane + authority lane with receipts). Recommended, high confidence.** The rejection is structural (§1.2 Theorems 1–3): nothing weaker works, and the account layer cannot and will not supply it ([aa-inversion §3.3](./aa-inversion.md), §4.3 falsifiers).
- **A1b — No: read-time evaluation only.** Simpler, fully confluent kernel; the Friday-claims-Monday record stays permanently ambiguous, and G-PKG/G-ORG-class promises are withdrawn from the mission.

Trail: §1 entire; [[assumptions-and-requirements#D-1 — Do we require definitive protection from post-revocation backdating?|D-1]]; [[kel#8.2 Admission-time ruling]]; [use-cases R-AU3](./use-cases.md).

### A2 — Adopt realm-qualified authority as an invariant, and ship one realm first?

**Example:** "Is this Alice's current key?" is never answerable bare — only "current *in realm R at basis H*." A community L3 can then run its own EFS with full local strong grades later, without EFS ever having promised one global unqualified truth.

- **A2a — Adopt the invariant + ship exactly one measured realm, extension-ready. Recommended, medium-high confidence.** Smallest strong-authority machine; matches the use-case asymmetry; keeps independent realms reachable without re-freezing (§3 AX-2).
- **A2b — Adopt the invariant + launch permissionless realms day one.** Sovereignty first; pays realm discovery, grade complexity, and non-interoperability immediately.
- **A2c — Genesis-committed per-principal homes at launch.** Individual venue choice inside the ID; multi-realm client fan-out from day one.
- **A2d — Movable per-principal homes.** The maximal profile; activates the §2 pointer as required surface with its full bill. Research-track recommendation stands.

Trail: §1.2 corollary; §3 AX-2 + §3.8; [[assumptions-and-requirements#D-2 — What sovereignty and authority scope is acceptable?|D-2]], [[assumptions-and-requirements#17. Current first-prototype hypothesis|§17]]; R-K11; [use-cases §6 T4](./use-cases.md).

### A3 — Cross-realm consumption promise

**Example:** a Base lending contract wants to consume a fact whose authority home is elsewhere. Under A3a it does so only through an explicitly installed adapter or an owner-pinned commitment whose updater/trust/rollback/freshness are disclosed — or not at all.

- **A3a — Clients verify remote realms; foreign contracts need explicit adapters/local commitments. Recommended, high confidence.** Zero use-case consumers for more; physics agrees.
- **A3b — Commit to live foreign-contract verification.** A funded bridge/light-client platform per supported pair; name the application first.

Trail: §3 AX-3; [[assumptions-and-requirements#D-3 — What cross-chain contract promise do we make?|D-3]], R-X5/R-X7; [use-cases R-CR4](./use-cases.md).

### A4 — Accept the co-residency rule for FS-vs-OS venues?

**Example:** Alice's mainstream identity anchors on the reference realm. She browses and is cited on a hobby L3's filesystem freely (snapshot grade); to publish strong-grade releases on that L3's registry she enrolls a resident principal there, or the registry's gate accepts snapshot-grade under a freshness policy.

- **A4a — Adopt: the filesystem never requires the social layer's venue; strong grade is co-resident per principal; cross-realm identities participate at snapshot/evidence grade, with per-class gate policy deciding what suffices. Recommended.** This is the mechanical consequence of §1.2, not a preference; adopting it closes the 2026-07-23 hypothesis with no architecture fork.
- **A4b — Require one shared authority venue for all EFS deployments.** Restores one-venue uniformity; forfeits realm-local self-sufficiency (Shapes C/E) and contradicts A2b/c/d.

Trail: §3 AX-4; [[owner-rulings]] 2026-07-23 UNDECIDED hypothesis; [[ethereum-first-efs-and-os#8. Coherent architecture shapes to keep alive|Shapes C/E]].

### A5 — Re-home promise and the pointer's disposition (consolidates [use-cases J4](./use-cases.md) + [aa-inversion J-4](./aa-inversion.md))

**Example:** Alice anchored strong-grade authority on L2 X; years later X's sequencer censors her (her data stays readable forever). Does EFS promise she can move her *authority home* to Y with the same principal — or is the honest answer "evidence portable forever; authority home was a commitment; continue as a successor identity with a signed handoff"?

- **A5a — Re-home not promised in v2; genesis-committed home (fixed profile as the degenerate case); pointer stays a designed, unbuilt shelf candidate (§2). Recommended.** Zero use-case consumers pay for the pointer; thief-re-home never exists; the pointer would add discovery only, never authority security (§2.3 theorem); censorship is mitigated by evidence-lane + successor-identity (§5.5).
- **A5b — Re-home promised → build the minimal updatable pointer (§2.1)** with its bill: L1 registration economics, adminless registry succession (unsolved), no-dual-admission machinery, pointer-theft surface bounded by recovery strength.
- **A5c — Write-once discovery pointer only.** Permanent "where did P anchor" fact for merged multi-realm views; freeze bytes for a NICE.

**Rider (T1 scope):** whichever arm — does chains-don't-die qualify authority homes by venue class, or is any venue an acceptable anchor with E1 measuring candidates? Surfaced, not picked (§2.6 T1).

Trail: §2 entire; ruling 4's justify-or-unnecessary discharged at §2.7; [[kel#4.5 Home topology: canonical locator plus co-located authority]]; H-K1–H-K4; [use-cases J4](./use-cases.md); [aa-inversion §6.2](./aa-inversion.md).

### A6 — The four rider axes (answer individually; never as a topology side effect)

- **A6a — Legacy-EOA upgrade commitment default-on** (degraded skip allowed, kit-tested first). Recommended (§4.1).
- **A6b — Smart-account direct inception allowed; 1271/6492 banned from canonical authority.** Recommended (§4.2).
- **A6c — Personal principals non-transferable; org control succession.** Recommended (§4.3).
- **A6d — Frozen same-domain suite-successor mechanism; no mutable verifier admin.** Recommended (§4.4).

Trail: §4; [[kel#23. Decisions for James]] items 3–5; D-K13/14/15; D-7.

---

## Confidence

**VERIFIED (read directly from the cited documents this pass):** every adopted ruling cited from [[owner-rulings]] (chains-don't-die scope, 2026-07-15 items, 2026-07-16 recovery baseline, 2026-07-22 mount + six capabilities, 2026-07-23 corrections and the FS-vs-OS hypothesis); the held N1 text and its six-axis demand plus the settled/superseded lists in [[owner-decision-inbox]]; kel.md's full design surface including the correction banner, §4–§10 mechanics, §15 vocabulary, §20–§23; the ledger's R-rows, A-rows, H-rows, Options A–D, D-1..D-16, §17 hypothesis in [[assumptions-and-requirements]]; Shapes A–E, the restraint rule, §11 sequence and stop-rules in [[ethereum-first-efs-and-os]]; Solana §§6.5–6.6/8/12; the large-file rulings and mechanism; both sibling lanes' registers, verdicts, and James-items.

**PLAUSIBLE (this lane's analysis; falsifiable by the critic and later lanes):** the §1.2 derivation's framing as premises/theorems (each premise is verified doctrine; the *derivation structure* and the claim that it exhausts the mechanism space are mine); the §1.3 witness-ladder completeness (W0–W3 as the *only* mechanically distinct services — the strongest claim in §1, attack it by exhibiting a witness service not reducible to these); the two-refinements judgment on the two-grade hypothesis (§1.4); the §2.1 minimal pointer design and the §2.3 pointer-theft theorem; the §2.7 conditional-unnecessary judgment; the AX-2 semantic-rule-vs-shipping-count split and the §3.8 coherence/contradiction assignments; the AX-4 dissolution claim; the §5 residual-risk statements.

**Could not verify:** any cost, gas, latency, or fan-out number — nothing in the chain/authority space is measurement-backed (E1/E2/E6/E10 open, per [[owner-rulings]] 2026-07-23), and this file adds no pretend numbers; whether a real consumer exists for the `EVIDENCE-ORDERED@N` label beyond G-LEGAL-1/UC-V (two named; more would strengthen E3); the practical adequacy of cross-realm anchor conventions against §5.3's realm-suppression residual (a Durable-convention sketch, unprototyped); whether adminless registry succession for the A5b pointer is solvable at all (kel.md flags it as a freeze blocker; no design exists); the behavioral claim that users will tolerate snapshot-grade participation on foreign realms (A4's product half — an E10-class usability question, not derivable).
