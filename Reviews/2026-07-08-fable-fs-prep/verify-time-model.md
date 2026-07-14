# Adversarial verification — the three-concept time model (order / claimedAt / admittedAt)

**Role:** red-team the refined time model (James 2026-07-08) against the frozen-surface docs
([[codex-envelope]], [[codex-kernel]], [[read-lens-spec]]).
**Verdict: SOUND-WITH-FIXES.** The taxonomy is coherent, non-redundant, and correctly
motivated; the `seq→order` rename is well-justified; no protocol-level attack opens via
`claimedAt` (it is inert for ordering); `admittedAt`'s per-chain nature is a feature when
properly fenced. The fixes below are integration/spec obligations and freeze-sensitivities,
not model breaks. One item is a genuine correction to a claim in the current framing (the
rename is *not* "just a name" at the wire level), and one is a latent inconsistency the new
model must reconcile (freshness is currently anchored on the untrusted field, not `admittedAt`).

Note on provenance: the three docs are dated 2026-07-07 and still say `seq` throughout; they
carry **no** `claimedAt` and **no** `admittedAt` in any body/ABI. The model under test is the
2026-07-08 refinement (captured in freeze-gates §A.8 + read-lens P1/P13). So I am checking the
refinement *against* the mechanisms in the frozen docs, and flagging every place the docs must
move to absorb it.

---

## 0. The taxonomy is complete and non-redundant (why the model is fundamentally sound)

The three fields occupy three distinct cells of (portable? × trusted-as-wall-clock? ×
ordinal-role?), and no cell is redundant:

| field | wall-clock trust | portable across chains | ordinal / comparator role |
|---|---|---|---|
| **order** (was seq) | untrusted (backdatable; capped only above) | yes (in signed Envelope struct) | **yes** — the LWW supersession key `(order, recordDigest)` |
| **claimedAt** | untrusted | yes (in signed record body) | **none** — display/provenance only |
| **admittedAt** | **trusted** (kernel-stamped) | **no** (per-chain block.timestamp) | none (must be fenced out) |

The one cell that stays deliberately **empty** is "portable AND wall-clock-trusted" — which is
the exact impossibility the whole EFS thesis is built on (no portable cross-chain currency /
"is-this-latest"). The model does not pretend to fill it. That is the core reason it holds:
`admittedAt` buys trust by surrendering portability; `order`/`claimedAt` buy portability by
surrendering wall-clock trust; the three are the honest decomposition of a thing that cannot
exist as one field. Each field answers a question the other two structurally cannot:

- **order** — "which of this author's writes to this slot wins?" (portable, deterministic).
- **claimedAt** — "when does the author *say* each batched action happened?" (survives the
  batch-collapse that would otherwise erase per-action time).
- **admittedAt** — "when did *this chain* actually admit it?" (the only trustworthy clock; the
  cooldown/freshness anchor P1 asks for, because order/claimedAt are backdatable).

---

## 1. Does `seq → order` change any mechanism, or just the name?

**Mechanism: unchanged. Wire format: broken. The "just a name / SDK detail" framing is wrong
and should be corrected before freeze.**

- **Mechanism-inert (confirmed):** every algorithm keys on the *value*, not the identifier —
  LWW comparator `(order, recordDigest)` (kernel adopted-core, C9), admit-both on collision
  (envelope D1), the `≤ now+600s` future cap (envelope amdt-6 / kernel amdt-6), `claimId =
  keccak256(DOMAIN_CLAIM_V1, author, order, recordDigest)`. Renaming the field touches none of
  these. Nothing in supersession, revocation, or admission moves.

- **Wire-breaking (the correction):** the field name lives inside the **EIP-712 typeHash
  string**. The signed struct is
  `Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)`, and the
  type hash is `keccak256("Envelope(bytes32 author,uint64 seq,...")`. Renaming `seq`→`order`
  changes that string → changes the type hash → changes the **byte-pinned envelope digest** and
  **every one of the 42 golden vectors**, all of which the red team recomputed against stock
  `eth_signTypedData_v4` *using the literal `seq`* (envelope base-text / verification-gates).
  It also changes the field label wallets render at signing time (a clear-signing plus:
  "order" reads better than "seq").

  So the honest statement is: **mechanism-inert but wire-format-breaking, hence correctly
  freeze-gated (A.8) — it must land before the envelope locks, and it forces regeneration of
  the type hash + the whole golden suite.** freeze-gates §A.8 already treats it as
  freeze-sensitive; the loose gloss "time-derivation stays an SDK detail, not the field's
  meaning" is true about the *meaning* but must not be read as "free to defer." It is not free;
  it is cheap-now/expensive-after-freeze, which is exactly why it is on the freeze gate.

**Sanity check — "order" vs "seq", and the nonce claim (both confirmed):**
- `seq` carries two false implications the design explicitly contradicts: (i) *sequential /
  dense* (a sequence number increments by 1, gaps detected) — but order is "sparse and
  NON-unique" (envelope adopted-core); (ii) *nonce-like replay-prevention*. **"order" is the
  better name.**
- The **"nonce is the wrong word" claim is correct**, and doubly so: a nonce must be (a)
  *unique* per author and (b) *gap-checked* to **forbid replay**. EFS does the opposite on all
  three counts — no `(author,seq)` uniqueness (kernel: "No `(author,seq)` uniqueness or
  duplicity state"), admit-both on collision, and it *wants* replay (cross-chain copy = re-submit
  the same envelope and have it admit identically; that is the entire portability model). Calling
  it a nonce would invert its purpose.
- **Residual naming caveat (not blocking):** "order" can still over-promise. It is *not* a
  chronology and *not* cross-author comparable — Alice's order=5 vs Bob's order=3 means nothing,
  and even for one author two writes to *different* slots with orders 5 and 3 do not imply a
  real-time sequence (batchable + backdatable). Its precise meaning is "per-author, per-slot LWW
  supersession rank." Keep `order`, but the gloss in docs should say **supersession/LWW rank**,
  not "chronological order." (`writeOrder` / `slotRank` were viable alternatives; not necessary.)

---

## 2. `claimedAt` — does per-record placement introduce any attack, ambiguity, or interaction?

### 2.1 Supersession / ordering games — CLEAN (inert by construction)
`claimedAt` is **not in any comparator**. LWW is `(order, recordDigest)`; the slot primitive
(read-lens §1.3), the maxEntries read-filter (§3.5, by min-`(seq,recordDigest)`), and the
tie-break winner of CONTESTED (§2.2, max `(seq,recordDigest)`) all ignore it. Therefore no
author can win, hold, or reorder a slot by manipulating `claimedAt`. The only surface it can
mislead is **app-level display** in timeline/journal apps that sort by it — contained, and
defused by §2.3 below. This is the single most important soundness property and it holds.

### 2.2 Backdating / framing — no *new* protocol attack, but it makes backdating first-class
The framing attack ("Alice backdates a comment to look like she said it first / predicted it"):
- Already anticipated. read-lens **P13** is verbatim: *"the author-asserted TID is untrusted as
  real time — gate on admission-time / expiry / checkpoints, never the claimed timestamp
  (defuses back-dating: chaotic ordering, fake predictions, edit-after-reply)."* `claimedAt` is
  in the **same trust class** as the TID's time-derivation, so it adds no attack the model
  didn't already carry.
- **What is genuinely new:** `claimedAt` *decouples* backdating from ordering. Backdating via
  `order` **self-defeats** — a low order loses LWW, so an attacker who backdates the ordering
  key forfeits the slot. Backdating via `claimedAt` has **no such cost** (it is not a comparator
  input), so it is a strictly more ergonomic lie. This is acceptable *only because* `admittedAt`
  exists to falsify it (§2.3). Without the trustworthy clock, `claimedAt` would be an
  unfalsifiable backdating primitive.

### 2.3 The honesty check, and its replica subtlety (FIX)
`claimedAt` is sound **iff** the read layer treats it exactly like the TID under P13 and can
cross-check it against `admittedAt`:
- Add `claimedAt` **by name** to the P13 untrusted-time rule (P13 today says "TID"; it must say
  "TID and claimedAt").
- Honesty check: `claimedAt` is falsifiable against `admittedAt` — a record whose `claimedAt`
  precedes the `admittedAt` of a causally-prior record is a detectable backdate.
- **Replica subtlety (must be specced):** the check must anchor on the **earliest / home**
  `admittedAt`, not the local replica's. A replica admits a record *late*, so replica-`admittedAt`
  is huge and a backdated `claimedAt` sails under it — **false negatives on replicas**. The
  detector must use the minimum known `admittedAt` (ideally home's) as the ceiling.
- **Cap-slack tolerance:** even on home, `order`-time may legitimately run up to **+600s ahead**
  of `admittedAt` (the future cap slack). So "`admittedAt` is the ceiling" for any author-time is
  approximate; allow the cap slack in the tolerance.
- **Cross-author / cross-chain causal order is NOT establishable by any of the three fields** —
  document as a limit. Alice-replied-to-Bob across two chains cannot be ordered by order,
  claimedAt, or (per-chain) admittedAt. That requires an **explicit citation edge** (read-lens
  §1.2 citation form: Alice's reply pins Bob's claimId). This is consistent with — indeed a
  restatement of — the "no portable cross-chain currency" thesis; surface it so app authors
  reach for citations, not timestamps.

### 2.4 Field placement in the Merkle leaf — CLEAN, with a canonicality cost (FIX)
`claimedAt` sits cleanly as an **optional trailing word of the claim body**, the *same
structural family* as `expiresAt` (envelope amdt-4: "last field of every claim body, inside the
signed bytes; objects never carry it"). It is inside the leaf preimage, authenticated
transitively via `recordsRoot` → part of `recordDigest`. **No Merkle structural change.**
Requirements the model inherits from the `expiresAt` machinery:
- **Fixed canonical order** of the trailing optional words (e.g. `…, claimedAt, expiresAt` — pin
  one order and vector it).
- **`0 = absent`** encoding (as `expiresAt` uses; `claimedAt = 0` means "no claim," not "epoch").
- **Extend the S7 canonical-word check** to `claimedAt`, and **widen the VAL-tail differential
  fuzz** — the envelope doc already calls VAL-tail canonicality "the kinds ruling's #1
  engineering risk"; a second optional trailing word enlarges that surface. Real cost, not a
  break.
- **Objects don't carry `claimedAt`** (parallel to `expiresAt`): the *action's* time lives on
  the **claim** (PIN/TAG/ASSERT), not on the TAGDEF/DATA/LIST identity object. For a journal, the
  action is the placement, so the claim-body home is correct.

### 2.5 Interaction with the collision / EQUIVOCAL machinery — CLEAN, mildly synergistic
`claimedAt` is in the body → two records identical except `claimedAt` have different
`recordDigest` → different `claimId` (distinct claims — fine). Collision/`SeqCollision`/EQUIVOCAL
is keyed on `(author, order)` only, so `claimedAt` **does not raise the collision rate**.
Better: `claimedAt` is what makes batching attractive (per-action time is preserved across the
batch-collapse), and batching **shares one `order` across many actions**, so it *reduces* the
number of distinct `order` values an author burns — i.e. it *lowers* accidental
`(author,order)`-collision / false-EQUIVOCAL risk. `claimedAt` is synergistic with the
collision-avoidance design, not adversarial to it.

### 2.6 Device-bits / future-cap interaction — none
Device bits (10-bit clockId) and the `≤ now+600s` cap both live in `order`. `claimedAt` is
orthogonal (no device bits, no cap). Within a batch, one `order` (one device's clockId) covers
N leaves, each carrying its own `claimedAt` — which can even record actions queued on *different*
devices before sync. So `claimedAt` legitimately carries *finer* provenance than `order`; that
is its reason to exist, and it does not collide with the device-bit scheme.

---

## 3. `admittedAt` per-chain — replica-divergence surprises?

**Sound, provided two things are stated that the docs do not yet state.**

### 3.1 It must be fenced OUT of every portable comparison (FIX — mirror the `prev` fence)
`admittedAt` is per-chain `block.timestamp`. The moment anyone lets it into a slot comparator,
supersession, or "which is newer" cross-chain, replicas diverge — which is *the exact reason
`order` exists*. State an explicit fence identical in spirit to the `prev` hard-fence ("signed
evidence + replication hint only; NEVER read by any kernel admission rule"):
> `admittedAt` MUST NOT enter any slot comparator, supersession decision, or cross-chain
> ordering. It is per-venue evidence only, always venue-qualified.
With that fence, there is **no divergence surprise** — the only party burned is someone who
misreads `admittedAt` as portable truth, which the fence forbids.

### 3.2 It is non-portable *by construction*, and that is correct (not a bug)
Because `admittedAt` is kernel-stamped at admission, it is **not in the signed body** → it
**cannot replicate**. A record copied to chain B gets **B's own** `admittedAt`, which answers a
legitimately *different* question — "when did *this venue* learn it" — a useful fact, not a
divergence. The trustworthy home-`admittedAt` simply does not travel with the record; recovering
it requires porting home's **state proof / checkpoint** (whose state root commits it), not just
the record. This is the same "authenticity ports, currency does not" doctrine already in
read-lens §5.1: `admittedAt` is a **currency-class** fact, so it *should* be non-portable. The
offline-bundle epilogue (§9.C step 6) already grades this honestly as "before epoch E." So:
`admittedAt` per-chain is **coherent with the settled read model**, provided it is always
venue-qualified like every other currency grade.

### 3.3 It must be STORED state, not just an event (FIX — cost, joins the gas bundle)
P1 asks for `admittedAt[claimId]`, `getProof`-provable. For that (and for the 100-year
offline-verify pledge / EIP-4444 log pruning) `admittedAt` must be a **stored per-claim state
word**, not merely emitted in a log. That is real extra storage per record and belongs in the
**freeze-gates A2 gas bundle** alongside the spine, the discovery index, and the two extra slot
words. Flag it explicitly; it is currently unpriced.

### 3.4 Latent inconsistency the new model must resolve (FIX — the one real correction)
read-lens **§5.2 and §9.C compute freshness/checkpoint age from `tidTime(checkpoint.seq)`** —
i.e. from the **untrusted `order`-derived time** (§5.2: "backdatable only against the author's
own freshness grade (fail-safe)"; §9.C step 3: `age = block.timestamp − tidTime(N)`). But the
whole point of introducing `admittedAt` (the P1 "trustworthy clock") is to give freshness a
**trustworthy** anchor. These two are not yet reconciled. The new model should route freshness
through **`admittedAt` where the claim's home is reachable** (trustworthy, per-chain), falling
back to `tidTime(order)` (untrusted, fail-safe) only when it is not. This **strengthens** §5 —
but the current spec text still anchors on the untrusted field, and freeze-gates §A.8's "three
honest concepts" summary implies `admittedAt` is *the* clock while the read spec still uses
`order`-time. Reconcile them in the next pass: name `admittedAt` as the preferred freshness
anchor in §5.2/§5.3/§9.C, with `order`-time as the labeled degraded fallback.

---

## 4. Is "order per-envelope, claimedAt per-record" coherent for a batch writing many slots?

**Yes — and this is the structural justification for `claimedAt`, not a tension.** The two live
at **different levels of the Merkle structure**: `order` is a field of the signed **Envelope**
header (one per signature/batch); `claimedAt` is a word inside each **leaf/record body**
(committed via `recordsRoot`). A batch is `Envelope(order=O, count=N, recordsRoot=…)` over leaves
`r1..rN`, each with its own `claimedAt` and each writing its own slot. There is no level at which
they compete. Batching *collapses* N actions to one `order`; the per-leaf body is the natural and
only place per-action time can survive that collapse. The Merkle tree already gives each leaf an
independent authenticated body, so the structure supports it with zero new machinery. (Aside:
leaf **position** is a second intrinsic within-batch order; a journal should sort by `claimedAt`
semantically, with position available only as a deterministic tiebreak — worth a one-line note so
clients don't fork on it.)

---

## 5. Summary of required fixes (all spec/integration, none a model break)

1. **Reframe the rename.** `seq→order` is mechanism-inert but **wire-format-breaking** (EIP-712
   typeHash string → frozen digest + 42 golden vectors + wallet label). Not "just a name / SDK
   detail." Correctly freeze-gated; regenerate the type hash and golden suite when it lands.
2. **Pin `claimedAt`'s field placement:** optional trailing claim-body word in the `expiresAt`
   family — fix the canonical trailing-word order, `0=absent`, extend the S7 canonical-word check,
   widen the VAL-tail differential fuzz (the #1 engineering risk). Objects don't carry it.
3. **Extend P13 to name `claimedAt`** and add the falsify-against-`admittedAt` honesty rule, with
   the **anchor-on-home/earliest-`admittedAt`** subtlety (replica `admittedAt` masks backdating),
   the +600s cap-slack tolerance, and the documented limit that **cross-author/cross-chain causal
   order needs citation edges**, not timestamps.
4. **Fence `admittedAt`** out of every comparator/supersession/cross-chain ordering (mirror the
   `prev` fence); always venue-qualify it; state that it is **non-portable by construction** and a
   replica stamps its own.
5. **Make `admittedAt` stored, provable state** (P1), and **price it** into the freeze-gates A2
   gas bundle.
6. **Reconcile freshness anchoring:** read-lens §5.2/§5.3/§9.C currently use untrusted
   `tidTime(order)`; route freshness through `admittedAt` where home is reachable, `order`-time as
   labeled fallback. (The one real internal inconsistency the new model surfaces.)

## 6. Confirmations requested by the task
- **"order is time-derived + capped" — CONFIRMED.** 64-bit TID: bit63=0, 53-bit microseconds,
  10-bit clockId/device bits; `tidMicroseconds ≤ (block.timestamp + 600)·1e6` (envelope
  adopted-core + amdt-6; kernel amdt-6). Past unbounded (for replication).
- **"nonce is the wrong word" — CONFIRMED.** Nonces demand uniqueness + gap-checking to *forbid*
  replay; EFS forbids none of it and *wants* replay (admit-both, no `(author,seq)` uniqueness,
  cross-chain re-submit). `seq` also wrongly implies dense/sequential. `order` is the right call;
  just don't let it imply chronology or cross-author comparability.
