# Red-team attack report — EFS v2 native kernel architecture

**Target:** `scratchpad/efsv2/native-kernel.md` (2026-07-07). The tasked path `kernel-arch.md` does not exist; `native-kernel.md` is the kernel architecture document and is what this report attacks.
**Cross-read for interface verification:** `envelope-replay-domain.md`, `identity.md`, `kinds-ruling.md` (same workflow, written 2–13 minutes AFTER the kernel doc), carrier decision, record-format investigation, deterministic-ids Codex, arch-B + arch-D red-team records, coupling audit, v1 `ListEntryResolver.sol` ground truth.
**Verdict up front:** the settled direction (native kernel, chain-free envelope, signature-only auth, spine, tombstone supersession, R2 succession) survives every attack I could mount — **nothing fatal to the direction**. The document as written is **not freezable**: one arch-D-class ordering bug survives in a corner the tombstone rule doesn't cover, the claimId ruling conflicts with (and is weaker than) the envelope pass's ruling, and the doc's kind table / admission model was overtaken by the kinds ruling within the same session. Each has a fix inside the design.

Severity scale: **FATAL** (breaks the settled direction) · **SERIOUS** (breaks a stated property or freeze-blocking claim; must fix before Etch) · **SURVIVABLE** (spec gap / honesty fix; cheap now, expensive after Etch).

---

## 0. The tasked verification: does tombstone supersession close the arch-D replay-as-rollback fatal?

**Arch-D's fatal** (substrate investigation): chain-order vs seq-fold contradiction — permissionless resubmission of an old record rolls back a slot.

**Verified CLOSED for slots.** I attacked §5.2 from every angle I could construct:

| Attack | Outcome |
|---|---|
| Replay old PIN (lower `seq`) after newer incumbent | comparator `(seq, envelopeDigest, idx)` keeps the newer incumbent — position is intrinsic to the record, not to admission order. No rollback. |
| Replay a revoked incumbent | claimId already admitted → SKIP. No event, no state. |
| Revoke incumbent, then replay an older unrevoked claim | older claim admits but has lower position → never becomes incumbent → **no resurrection**. This is exactly the arch-D hole, and it is closed. |
| Subset-carve a stale envelope to a fresh chain | stale placement shows Active there until the newer claim/revoke arrives — that is the priced snapshot/withheld-revoke limit, not rollback; on arrival, supersession is monotone. |
| Grind `envelopeDigest` tie-break at equal seq | affects only the author's own slot (author is inside `slotId`). Self-harm only. |
| Future-date `seq` to lock a slot (stolen key) | bounded to +900s; REVOKE targets claimId directly and is never comparator-gated, so it beats any supersession lock. Full-key compromise on a bare EOA remains identity death — priced by the KEL reservation. |

The join-semilattice argument (max position ∨ monotone revocation bit) is genuine for slot **incumbency and revoked-ness**. Two residues where the *stated* convergence invariant ("same admitted set ⇒ identical state, any order") is still violated — one serious (§2), one survivable (§8):

1. **N-set admission checks re-import the arch-D bug** — see §2. The tombstone rule protects slots; the LIST duplicate/cap checks the kernel ports verbatim from v1 read *revocable mutable state at admission time*, which is exactly the chain-order-vs-fold contradiction arch-D died of, surviving in a corner.
2. **`revokedBy` first-wins pointer** is admission-order-dependent when an author signs two distinct REVOKEs of one claim (chain A stores R1, chain B stores R2). The revoked *bit* converges; the exposed witness pointer does not. See §8.

---

## 1. SERIOUS — the kernel doc's interfaces were overtaken inside its own session (drift cluster)

The doc's §0 discipline ("if the envelope pass lands differently, the kernel adapts at the named seams and nowhere else") is the right instinct, but **several conflicts land outside the named seams**, and two of them are on rulings the kernel doc claims to own. File-timestamps: kernel 01:12, envelope pass 01:14, identity 01:14, kinds ruling 01:25. Every item below is a live cross-doc contradiction on the Etched surface:

| # | Kernel doc says | Sibling pass rules | Seam covered? | Who should win (my read) |
|---|---|---|---|---|
| D1 | `claimId = H(DOMAIN_CLAIMID_V1, envelopeDigest, idx)` — "owned here" (§2.1) | envelope pass D2: `claimId = H(DOMAIN_CLAIM_V1, author, seq, recordDigest)` — content-addressed, explicitly adjudicated against coordinate forms | **No** — contested ownership | envelope pass (see §3 below — its formula is strictly stronger) |
| D2 | separate `envelopeDigest` under `DOMAIN_ENVELOPE_V1` **plus** the EIP-712 digest | envelope pass D3: the EIP-712 digest is the *single* canonical envelope id; the parallel digest is deleted ("two names for one artifact invite implementation drift") | Partially (A3) | envelope pass — the kernel doc is itself the drift D3 warns about |
| D3 | same-`(author,seq)`-different-digest → **both admissible**, zero uniqueness state (§3.3) | identity pass §1: → **reject `SeqOccupied`**, per-chain uniqueness | No | kernel + envelope pass (2-vs-1, and `SeqOccupied` re-creates permanent cross-chain divergence: chain A admits digestA first, chain B digestB, each rejects the other forever — the exact SSB/divergence failure the kernel's own §3.3 argument closes) |
| D4 | TID bound `_tidTime(h.seq) <= block.timestamp + 900` | envelope pass: `tidTime(seq) ≤ block.timestamp_µs + 600 s`, plus `seq != 0`, bit-63-zero, 53-bit mask | A4 nominally | envelope pass — **and note the kernel doc's line as written is a unit bug**: `seq >> 10` yields *microseconds*, `block.timestamp` is *seconds*; compared raw, every honest envelope is "future-dated" and the kernel rejects 100% of submissions. Trivially caught by the first test, but this is a consensus-bearing constant drifting across three documents — precisely the class of bug the golden-vector/external-review gates exist for. Also 900 vs 600 must be one number. |
| D5 | kind set A7: objects TAGDEF/DATA/PROPERTY/LIST; claims MIRROR/PIN/TAG/LIST_ENTRY/REDIRECT; "the two open forks change the kind *table*, not kernel shape... one dispatch-table row each" | kinds ruling: **MIRROR, REDIRECT, LIST_ENTRY, PROPERTY all deleted as record kinds**; mirrors/redirects = reserved-key edges; list membership = TAG-on-LIST; PROPERTY = VAL-edge with **auto-intern**; `allowsDuplicates` deleted; `MAX_VALUE_BYTES = 8192` | A7 covers table churn, **not** shape churn | kinds ruling — and it is *not* "one dispatch row each": auto-intern means **claim admission now mints objects** (a new admission pathway: VAL-edge → derive propertyId → first-writer intern + exactly-once event + registry entry storing value bytes). §3.2's clean "objects created by object-records, claims reference them" model, the parents-first story for properties, §4 storage (registry entries carrying value bytes, `getClaim` body *reconstitution*), the §12 port rows (MirrorResolver ~150 LoC incl. transport-ancestry walk — **retired as a write gate** by the ruling; AliasResolver ~120 LoC — dies; ListEntryResolver reshape — dies into TAG), and the gas table all need re-cutting. |
| D6 | expiry "deliberately NOT a kernel field... app-layer property convention" (§5.1) | envelope pass: every claim body ends `uint64 expiresAt`; kinds ruling §4.1 confirms `expiresAt` word in PIN/TAG | No | siblings (2-vs-1, and James's settled direction leans on author-set EXPIRY as the cross-chain-revocation mitigation — a body word is what makes it verifiable from the signed bytes) |
| D7 | REVOKE admission **requires** target present (`MissingDependency` otherwise) — §5.1 rule 1 | kinds ruling class-C: out-of-order **pair-completion** — "entry-second ⇒ entry admits and the pre-existing tombstone is discarded as void", i.e. a revoke-before-target admission path exists | No | **kernel** on the mechanism (a pending-tombstone store is a spam surface and can't author-check a REVOKE whose target is absent), but then the ruling's void-tombstone branch is unreachable and its mandated golden vectors test a state that cannot occur — one of the two rules must be rewritten. |

**Why this is a finding and not process noise:** the kernel doc presents §2.1 (claimId) as an *adjudicated ruling* with a candidate table — and the candidate table **omits the formula the envelope pass ruled in** (`H(author, seq, recordDigest)`), so its "ruled" verdict was reached without evaluating the strongest candidate. Same session, same inputs, incompatible rulings on the revocation handle — the single most portability-load-bearing constant in the system. Nothing here can be "adapted at a seam later"; it must be reconciled explicitly, once, before any golden vector is cut.

**Minimal fix:** a one-pass reconciliation ruling (claimId, envelope id, seq-collision policy, TID bound + units, expiresAt placement, revoke-target-existence, the post-ruling kind table), after which the kernel doc's §2, §3.3, §5, §12, §15 are re-cut. Days of work, zero architecture change.

---

## 2. SERIOUS — the arch-D bug survives in the N-set corner: admission checks that read revocable state

**The attack.** The kernel doc ports v1 list semantics as-is: "`entryCount` — list dup/cap checks" (§4.3), "revoke = swap-and-pop, ports verbatim" (§5.2), "~270 reshaped into the N-set module" (§12). Ground truth (`ListEntryResolver.sol`): `!allowsDuplicates` → `revert DuplicateIdentity` when `_entryCount[list][identityKey][attester] != 0`; `maxEntries` → `revert ListFull` when the active array is full; **revoke decrements the count** (L316). These checks read *revocable, order-varying* state at admission time. Consequence, concretely:

- Author (honest, one device, no equivocation): writes entry E1 (identityKey K), revokes E1, writes replacement E2 (same K). All three admit on the home chain.
- Replicator carries to chain B in the order {E2} first (perfectly legal subset admission; also arises from any lazy/partial copy): E2 admits.
- Now **E1 can never be admitted on chain B** (`DuplicateIdentity` — K is active via E2), and therefore **REVOKE(E1) can never be admitted either** (kernel §5.1 rule 1: target must exist). The replicator doctrine "targets before their REVOKEs" is *unsatisfiable* here — the target itself is permanently inadmissible.
- Final admitted sets diverge **permanently and for an honest author**: home chain {E1, rev(E1), E2}, chain B {E2}. §3.2's claim "replay of envelopes is monotone and idempotent at record granularity" is **false**; the §5.2 convergence invariant ("admitting S1 ∪ S2 on both yields identical state") is unsatisfiable because S1 ∪ S2 cannot even be admitted on both. `maxEntries` has the same disease (which of cap+1 entries is rejected depends on arrival order). This is the same chain-order-vs-fold contradiction that was ruled **fatal in arch-D** — the tombstone comparator fixed it for slots and the doc did not notice the identical structure in the dup/cap checks it ported.

**Severity:** SERIOUS, not fatal — confined to list membership under dup/cap constraints; slots, registry, revocation, mirrors are all confluent. But it breaks the kernel's flagship invariant on the flagship property (permissionless replication), for honest authors, with no equivocation required.

**Fix exists inside the design (and the kinds ruling already found most of it):**
1. **Dup check → slot machinery.** For a no-duplicates membership, `(listId, identityKey, author)` is cardinality-1 — that IS a slot. The kinds ruling's LIST_ENTRY→TAG collapse does exactly this (same target = same slot = tombstone supersession, confluent by §5.2's own semilattice). Adopt it; delete `DuplicateIdentity`-class reverts entirely.
2. **Cap check → monotone or advisory.** Either count *all-ever-admitted new slots* (monotone counter, never decremented — the kinds ruling's LE6 "incremented on new-slot admission only" reads this way) and Codex-label `maxEntries` as **chain-local admission state** (arch-B already ruled this; the kernel doc dropped the label), or demote the cap to read-layer/advisory. Order-dependence then either disappears or is explicitly priced instead of silently violating the invariant.
3. **Etch the general rule the doc never states:** *no admission check may read revocable state except through the §5.2 comparator; dependency-existence checks are legal because object existence is monotone.* This is the invariant that makes the whole admission function confluent, it is checkable in the invariant suite (property test: admission of any permutation of any subset either converges or the check is Codex-labeled chain-local), and it would have caught this at design time.

---

## 3. SERIOUS — `claimId = H(envelopeDigest, idx)` is carriage-dependent and weakens the portable-revocation flagship

§2.1 correctly kills `recordDigest` alone (identical bodies collide) and arch-B's `H(author, seq, idx)` (same-seq envelope collision). But the chosen form binds a record's identity to its **carriage** (the exact envelope), and the doc never evaluates the content-addressed-per-(author,seq) form the envelope pass ruled in.

**The attack.** An author's record commonly ends up signed inside more than one envelope: SDK retry that rebuilds a batch with one more record (different `recordsRoot` ⇒ different digest), multi-device double-write, re-batching for a smaller chain. Under `H(envelopeDigest, idx)` each carriage is a **different claim**:

- Chain X received the record via envelope A; chain Y via re-signed envelope B. The author's one REVOKE names claimId-under-A. On chain Y, `claims[target]` doesn't exist → `MissingDependency` revert → **the revoke cannot land where the data actually lives** unless the exact envelope-A carriage is admitted there first (admitting yet another live copy of the thing being revoked, and requiring whoever relays the revoke to hold envelope A). §5.1's headline — "a REVOKE written once names the same claim on every chain" — is true only under exact-envelope carriage; the mission property ("no trusted copier, no author work") quietly acquires an exact-carriage precondition.
- Secondary effect: both carriages admit as independent claims — in N-sets (mirrors/tags) the author now has duplicate active entries to revoke one-by-one; in slots the comparator hides it.

Under the envelope pass's `H(author, seq, recordDigest)`: one logical record = one claimId regardless of carriage; identical re-signed records dedupe at admission; the REVOKE lands wherever *any* carriage landed. Client-computable pre-submit (author knows seq + bytes at signing). The kernel's §2.1 objection to naked `recordDigest` does not apply — `seq` is inside the hash, so deliberate same-body re-asserts at different seq stay distinct; same-body-same-seq collapsing to one claim is the *correct* dedupe, not a defect. The only cost: claimId no longer encodes intra-envelope position — and position for the comparator comes from `claims[claimId]` meta anyway (first-admitted carriage wins the meta; positions of identical-content carriages at equal seq differ only in the tie-break words, which order only the author's own slot).

**Fix:** adopt the envelope pass's formula (or produce the rebuttal §2.1 skipped). This is a one-constant change today and an unfixable fork after vectors freeze. Note the knock-on either way: with envelope-scoped claimIds, a REVOKE **cannot target a claim in its own envelope** (the target claimId depends on `envelopeDigest`, which depends on the REVOKE's own body — a keccak fixed point); with content-addressed claimIds it can. Whichever formula wins, Codex the same-envelope-revocation answer explicitly.

---

## 4. SERIOUS — LIST's evidence branch still forks the registry across chains (ordering game via subset admission)

§3.6 preserves "registry state never forks" *per chain* but not across chains. LIST is (by the doc's own admission, and confirmed by the kinds ruling: "the only owned-kind equivocation surface") the only kind where body ⊋ derivation inputs (`listId = H(DOMAIN_LIST, author, salt)`; body carries `appendOnly/targetKind/maxEntries`).

**The attack.** Author signs LIST(salt S, config C1); later (bug or malice) signs LIST(S, C2). Home chain: C1 binds, C2 → evidence. On any *new* chain, an adversary uses `submitSubset` to surgically land the C2 record first → **registry write-once binds C2 there, forever**. Now the same `listId` has `appendOnly=true, maxEntries=100` on one chain and `appendOnly=false, maxEntries=5` on another — and because LIST config **gates admission of other records** (entries by the author *and by third parties*, since lists accept foreign-author entries), honest downstream records admit on one chain and revert on the other, permanently. The registry-app "charter" (the kinds ruling's headline reason to keep LIST) is not actually a charter: which promise a subscriber's chain enforces depends on an adversary-controllable race.

Yes, only a self-equivocating author triggers it, and equivocation-to-lenses is doctrine — but here the *kernel's own admission behavior* diverges cross-chain and third parties inherit the divergence. That's a different class from "lenses adjudicate trust."

**Fix inside the design (recommended):** fold the config into the derivation — `listId = H(DOMAIN_LIST, author, salt, keccak(configBytes))`. Then body ≡ derivation inputs for every kind, same-id-different-body is **impossible by construction system-wide**, the LIST charter becomes cryptographically immutable (stronger, not weaker, for the registry app), and the entire evidence machinery (`flags.evidence`, `OwnedConflict`, `ClaimStatus.Evidence`, its duplicate-policy matrix rows) **deletes as dead code** — a simplification of the Etched surface. Cost: a config tweak mints a new listId (arguably correct: different charter = different collection) and the ID Codex gains one word in one formula — free now, impossible later. Fallback if rejected: keep the branch but Codex-label owned-LIST resolution as chain-local-binding and surface `OwnedConflict` in read views (weaker; the fork stays).

---

## 5. SERIOUS — the EIP-170 fallback ladder's first rung is a no-op

§1: "the split line is per-kind validation into `internal`-library files first, then (last resort) an external `EFSValidation` contract."

**The attack is one compiler fact:** `internal` library functions are **inlined/JUMPed into the caller's deployed bytecode**. Splitting validation into internal-library *files* changes source organization and changes the runtime size by ~zero. The only things that reduce deployed size are: external/public library functions (**DELEGATECALL** — banned by the doc's own "no delegatecall surface" mainnet doctrine), a separate external contract (the "last resort" — a second Etched artifact + call boundary), or actually cutting code (fewer custom errors, shared validation helpers, packed dispatch). So if the ~2,300–2,900 LoC Etched surface busts 24,576 bytes, the design goes **straight to the second Etched artifact** — the named first fallback does not exist. On realism: v1's EFSIndexer alone is 1,336 LoC in a system that splits across seven contracts; a single kernel carrying sig-gate + admission + all per-kind validation + tree/slot/N-set indices + ~15 event types + errors will plausibly land in the 20–26KB band with optimizer on. This is not a tail risk; it is roughly a coin flip that decides whether the Etched surface is one artifact or two, and it is discoverable in a day.

**Fix:** delete the internal-library rung from the doc; add a **bytecode-size budget line to the module table now** (compile a skeleton with representative validation early — before the Codex freezes the "one kernel address, no proxy" chapter); pre-adjudicate the external-validator design (is it Etched-paired via codehash pin? how does the reader-verification procedure of §13.2 extend to two artifacts?) so a size bust doesn't force that adjudication mid-freeze-window. Note the interaction: §13.2 canonicity currently assumes **one** `CODEX_KERNEL_CODEHASH`.

---

## 6. Attacks that FAILED (verified sound — keep these load-bearing walls)

For the synthesizer's calibration, the following held under attack:

- **Genesis forgery/front-run:** `SYSTEM_AUTHOR` hard-banned in `submit` step 2 + hash-gated idempotent `initializeGenesis` — I found no way in. Front-run is same-blob-or-revert.
- **Merkle games:** domain-separated leaf/node constants, index-committed leaves, `index < count`, strictly-increasing subset indices, low-s + claimId idempotency vs malleated resubmission — all close their respective holes.
- **Reentrancy/external-call surface:** the write path makes **zero external calls** (no hooks, no ERC-1271, precompile-only ecrecover). Cleaner than EAS by construction.
- **Registry/object rollback:** write-once + monotone object existence ⇒ dependency checks are confluent; no replay can un-create or re-bind an object on a given chain (the cross-chain LIST case in §4 is the one exception, via the evidence branch).
- **msg.sender absence:** verified — appears nowhere in auth, identity, keys, or events.
- **Deployment canonicity:** honest and correctly priced. One sharpening in the design's favor: on any single chain the spec-fixed CREATE2 address can host only one kernel, so "two authentic kernels on one chain" requires one of them to live at a *non-canonical* address — clients anchored on the Schelling address are safe by default; venue plurality is a discovery problem, not an impersonation problem. The genuinely open residual is **succession stewardship** (§13.3, flagged open): a fake "successor kernel" is cryptographically indistinguishable from a real one, which for year-0 EOA authors is harmless (signatures verify under any kernel) but means **digest-shaped identity security ultimately rests on the unresolved successor-Codex trust root** — fine to defer, but it must be resolved before the KEL tier ships, and the identity pass's CRQC deadline (~early 2030s) puts a date on it.
- **Storage growth/DoS:** spine, bodies, N-sets, tag trees are all gas-priced, author-keyed or paginated-in-views; caps bound single-record work; no third party can grow another author's read-path state. Evidence records are self-paid. Nothing worse than v1/EAS.
- **EASExporter as kernel attack surface:** none — reads public state only, zero kernel coupling, plural and non-canonical. (Exporter-side hygiene gap in §8.)

---

## 7. Gas-estimate realism (attacked; mostly honest, one self-contradiction)

- Per-component numbers check out to first order (3-slot meta = ~66k ✓; spine ~22–27k ✓; 2KB inline ≈ 1.4M ✓; ecrecover/EIP-712/fold ✓). Undercounts found: `bodies` length slot (+22k/record, so "PIN 5 words ≈ 110k" is ~132k), `nIndexPlusOne`/`entryCount`/`tagChildren` pushes presumably inside the "44–250k by kind" bucket but not itemized, event data gas for full payloads (2KB body event ≈ ~17k). None change conclusions.
- **Internal contradiction:** §3.5 claims "directionally ≈5–10% under the v2-on-EAS baseline" while its own flow row says a small 8-record file is **3.5–5.5M** against the deterministic-ids §12 baseline of **9–10M** — that is 40–60% under, not 5–10%. Either the flow numbers omit the ported index writes and visibility work (then the flow rows are wrong) or the 5–10% figure is stale from the carrier decision (then delete it). A doc carrying both invites whichever number flatters the argument. The CI gas-snapshot gate is the right remedy and is already named — but the doc should not ship two mutually inconsistent claims into review.
- The kind-collapse ruling moves this table anyway (VAL tails, no PROPERTY records, no MIRROR records): re-cut after reconciliation (§1/D5).

## LoC / verification honesty (attacked; holds, with two shaves)

- The doc's own correction of the carrier decision's "~500–900" to **~800–1,250 new / ≈2,300–2,900 Etched-as-reviewed** is the honest number and the direction vs ~4,909 v1-adjacent LoC survives. Two shaves: (a) the Etched bytecode also carries `@efs/ids` + OZ ECDSA + ERC-7201 accessors (~+150–300 effective LoC of reviewed surface, and real bytes against EIP-170 — see §5); (b) the kinds ruling shifts buckets (AliasResolver/MirrorResolver/ListEntryResolver rows die; VAL-edge + auto-intern machinery is new kernel-core, not port) — net direction unchanged, table stale.
- **3–6 weeks verification including independent external review of a novel envelope+identity composition is optimistic** — external review alone is typically 2–4 calendar weeks with scheduling latency, and the review surface is the full 2.3–2.9k Etched LoC plus the wire spec, not the 800–1,250 new lines. The abort-to-EAS ramp priced in the carrier decision is the correct hedge; the schedule text should say "3–6 weeks *after* reconciliation (§1), external review on the critical path" so the freeze window isn't planned against the best case.

---

## 8. SURVIVABLE findings (spec gaps — each cheap now, Etched later)

| # | Gap | Failure if unfixed | Minimal fix |
|---|---|---|---|
| S1 | `revokedBy` first-wins stores an order-dependent witness when two distinct REVOKEs name one claim | convergence invariant fails byte-comparison across chains; differential tests flake | store the comparator-min revoke (deterministic) or a bool + event-borne witnesses |
| S2 | `EnvelopeAdmitted` "first touch only" requires envelope-seen state that §4.4 explicitly refuses to keep | unimplementable as specced; naive impl either adds ~22k/envelope state or emits duplicates violating the stated event contract | redefine: emit per call iff ≥1 record newly admitted; log-joiners dedupe on the digest topic (the doc already concedes joins for artifact re-export) |
| S3 | Genesis claimIds undefined: no envelope ⇒ no `envelopeDigest` ⇒ `H(envelopeDigest, i)` has no input; and `initializeGenesis` is single-shot — a large blob can exceed a low-gas-limit chain's block cap, making the kernel **permanently uninitializable there** (Etched, unfixable) | genesis vectors can't be cut; canonicity check §13.2 step 2 fails on constrained chains | Codex a deterministic genesis pseudo-header (author=SYSTEM_AUTHOR, seq=0, prev=0, root over blob, count=N); make `initializeGenesis(blob, from, to)` chunked — still hash-gated + idempotent |
| S4 | REVOKE records' own `kindCode`/status unspecified; REVOKE-of-REVOKE falls in neither the revocable-claims list nor the objects list | undefined behavior on the Etched dispatch path | define: REVOKE stores a reserved kindCode; REVOKE targets naming a REVOKE are inert no-ops or `Irrevocable()` — pick one, vector it |
| S5 | Duplicate-instantiation event emission ambiguous: §3.6 says no *instantiation* event re-fires, but the duplicate claim is admitted with live visibility effects — if no per-claim event fires, **log-only sync cannot see it** and the §7 acceptance test fails for exactly the "lost race" case §3.6 protects; also unspecified whether owned byte-identical duplicates enter the spine | subgraph/state divergence on duplicates | rule: per-claim events always fire (with a duplicate flag or the object id), per-object events fire exactly once; spine membership of every admitted record stated explicitly |
| S6 | State-walk replay would re-run the TID future-bound against *replay-time* clock | year-100 replay "rejects" legitimately admitted 2030 envelopes | Codex: the replayed state-transition function excludes admission-time-only gates (TID bound; genesis sig-skip flag) |
| S7 | EASExporter can mint a mirror of a kernel-revoked claim; the mirror reads as valid on easscan until someone volunteers `syncRevocation` | stale-but-authentic-looking attestations — the exact legibility lie the exporter exists to avoid | `export()` refuses `Revoked`/`Evidence` claims or mints-and-revokes atomically; exporter README states the sync-lag honestly |
| S8 | Envelope-level atomicity is per-call only: anyone may land any dependency-coherent **subset** of a signed envelope, so an author's all-or-nothing intent is not a protocol property (it's also the rescue path for partially-invalid envelopes — double-edged) | authors/SDKs assume batch atomicity that doesn't survive third-party carriage | one honest §3.4 bullet: "envelopes are carriage, not transactions; per-call atomicity only; self-contained-unit conventions are the app-layer answer" (record-format ledger row 1 already says this — the kernel doc should too) |
| S9 | Post-freeze kind extensibility story absent: the frozen kindTag table means any new record kind = kernel succession; EAS had permissionless schemas, the kernel's answer (properties/TAGDEF conventions + reserved codes + succession) is real but unstated | "how do I add a kind in 2029?" has no documented answer; pressure to bloat the v1 kind table "just in case" | one §13 paragraph naming succession + reserved codes + app-layer property conventions as the extension ladder |
| S10 | Unbalanced-tree fold rule (odd leaf counts) not pinned in A2; author-word ≠ 0 not explicitly checked (OZ ECDSA's zero-recover revert covers it implicitly) | cross-implementation Merkle divergence; spec ambiguity | confirm the envelope pass owns both (it does — its §2/intrinsics); add the cross-reference |

---

## 9. Summary table

| Finding | Severity | Fix inside design? |
|---|---|---|
| Arch-D replay-as-rollback via slots | **closed** — verified | n/a (keep §5.2 verbatim; it is the best section of the doc) |
| Interface drift: claimId / envelope id / seq-collision / TID units+bound / kind table / auto-intern / expiresAt / revoke-target-existence vs 3 sibling passes | SERIOUS | yes — one reconciliation ruling, then re-cut §2, §3.3, §5, §12, §15 |
| N-set dup/cap checks read revocable state → confluence broken for honest authors (arch-D residue) | SERIOUS | yes — slot-ify no-dup membership (kinds ruling already does), monotone/chain-local cap, + Etch the "no admission check reads revocable state" invariant |
| claimId carriage-dependence weakens portable revocation | SERIOUS | yes — adopt envelope pass D2 formula (or publish the missing rebuttal) |
| LIST evidence branch → cross-chain registry fork, adversary-steerable via subset admission | SERIOUS | yes — config hash into listId derivation; evidence machinery then deletes |
| EIP-170 fallback ladder rung 1 is a compiler no-op | SERIOUS | yes — size budget now; pre-adjudicate the two-artifact contingency incl. §13.2 impact |
| Gas 5–10% claim contradicts own flow numbers | SURVIVABLE | yes — pick one number; CI gate already planned |
| Verification 3–6wk incl. external review optimistic | SURVIVABLE | yes — schedule after reconciliation; abort ramp already real |
| S1–S10 spec gaps | SURVIVABLE | yes — all one-liners to one-pagers |

**Bottom line:** the kernel's core mechanics — signature-only admission, the enumeration spine, tombstone supersession, hash-gated genesis, R2 chained succession, no-external-call write path — survived a genuine attempt to break them, and several (§6) are stronger than the doc sells. What must happen before anything freezes: (1) the cross-pass reconciliation (§1), (2) the confluence rule + list-semantics fix (§2), (3) the claimId adjudication redo (§3), (4) the listId derivation decision (§4), (5) a real bytecode-size number (§5). None of these threatens the settled direction; all of them are exactly the kind of thing that is free this week and Etched forever after.
