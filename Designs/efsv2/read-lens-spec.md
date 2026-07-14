# EFS v2 — Read & Lens Resolution Spec

**Status:** draft
**Target repos:** contracts, sdk, planning
**Depends on:** [[deterministic-ids]], [[fable-handoff-v2-tag-core]], [[efs-substrate-decision]]
**Supersedes:** — (consolidates and gives a home to: the read-grade vocabulary reserved in [[efs-substrate-decision]] §3.6; the v1 container-classifier leaning in [[fable-handoff-v2-tag-core]]; the read-precedence chapter mandated by `Reviews/2026-07-07-efsv2-corpus/kinds-ruling.md` §2.7/§4.2)
**Reviewers:** —
**Last touched:** 2026-07-12

#status/draft #kind/design #repo/contracts #repo/sdk #repo/planning

> **2026-07-11 KEL reconciliation required.** This document's closed KEL-era vocabulary was designed for divergent peer inceptions and read-time union. [[kel]] §15 replaces that foundation with home-admitted historical authorization, foreign snapshots, signature-only evidence, pending recovery, and disputed intervals. The ordinary record/lens rules remain useful, but the identity grades and every GATE-consumption rule are not freeze-safe until the two vocabularies and vectors are merged.
>
> **2026-07-12 lens reconciliation required.** The current architecture is a typed, scoped, reproducibly compiled `LensPolicy`, not one universal ordered author array. `PRIORITY_FIRST_PRESENT` remains one valid combiner for exclusive namespace slots. The evidence/policy/basis/grade ideas below are useful inputs, but this document is no longer a complete normative reader specification and should be replaced rather than extended by more amendment layers. See [[assumptions-and-requirements]] and the [lens architecture review](../../Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md).

> **Tier: REOPENED DURABLE DRAFT.** This document is historical design input for the replacement reader spec. It is **not** Etched kernel surface and is not currently a complete conformance authority. Its proven-absence, fail-closed, basis, and scoped-combiner insights should survive; its flat lens input, global same-order equivocation, old KEL grades, and pinned dependency claims must not.
>
> **Provenance:** commissioned as gap **G1** of the 2026-07-07 design round (`Reviews/2026-07-07-efsv2-corpus/critic.md`). It implements the critic's reconciliation rulings C4 (checkpoint = ordinary reserved-key claim), C8 (empty-on-revoke), C9 ((seq, recordDigest) comparator), C13/K6 (expiry read-rule context split), the ops repairs D1–D5/C1/E1/E2/E4/E5/B1/A3, and the kinds-ruling read obligations (§2.7, §4.1, §4.2, §4.4a/f/g/h).

## Problem

The lens model — per-viewer ordered trusted-author lists, first-attester-wins — is THE read-side primitive of the mission, and the settled direction makes the read-grade vocabulary *normative*. Yet no document designed read resolution: ops-honesty deferred deny-semantics "to the lens resolution spec"; attack-kinds K6 demanded a fallthrough context split with no home; attack-ops added grades (EQUIVOCAL, SUPERSEDED, venue-qualified STALE, bytes-unavailable) to a table no spec owned; the container classifier lost half its classes when EAS left and nobody redesigned it. Until this document exists, "normative read grades" is a phrase, and the conformance tests (anti-fallthrough, pin-and-diff, never-EQUIVOCAL-as-LIVE) have nothing to test against.

This spec defines: the closed read-grade vocabulary and how each grade is computed, rendered, and consumed; the normative lens-resolution algorithm including the expiry context split and deny-filter composition; the per-venue grade ceilings with freshness horizons; the post-EAS container classifier and URL surface; discovery-read semantics (both kernel-index and indexer-lane paths); and the resolver conformance rules with an acceptance-test list.

---

## 0. Etched dependency pins (what this Durable spec assumes is frozen)

Every rule below that consumes kernel state assumes exactly these Etched surfaces, as reconciled by the critic. If any pin changes before freeze, the flagged sections must be re-cut. **This table is the contract between the read layer and the Codex.**

| # | Pinned Etched surface | Codex owner | Reconciliation source | Sections here that break if it moves |
|---|---|---|---|---|
| P1 | Slot comparator: `winner(slot) = max over admitted claims by (seq, recordDigest) lexicographic` | Ch.4 | critic C9 (envelope form won) | §1.3, §3 |
| P2 | **Empty-on-revoke**: if the slot winner is revoked, the slot reads EMPTY — no max-over-unrevoked fallback, no resurrection; the author re-asserts to refill | Ch.4 | critic C8 (**kernel's rule won**; envelope §5.6 re-cut) | §1.3, §2 (REVOKED), §3 |
| P3 | Revocation G-set: `(revoker, claimId)` pairs, monotone, pre-revocation legal (REVOKE before target admits); effectiveness = revoker == claim.author | Ch.4 | critic C3 / ops X7 | §1.3, §2 |
| P4 | `claimId = H(DOMAIN_CLAIM_V1, author, seq, recordDigest)` — content-addressed | Ch.2 | critic C1 | §2, §3.4, §6 |
| P5 | `expiresAt` = uint64 last word of every claim body, canonical-word-checked; objects never expire; storage clock-free, reads clock-aware; kernel read surface exposes it | Ch.3 | critic C5 + K1/S7 stack | §2 (STALE), §3.2 |
| P6 | Duplicity evidence: same-(author, seq) different-digest pairs admitted (admit-both, C2), `SeqCollision` evidence events, portable proof format (two signed records at one (author, seq)) | Ch.1/Ch.4 | critic C2 | §2 (EQUIVOCAL/CONTESTED) |
| P7 | CHECKPOINT = **ordinary reserved-KEY claim** (`checkpoint` under the ADDRESS container: through-seq + state root), ZERO kernel machinery, no `latestCheckpointId`, no head-currency/fork-choice | Ch.6 (reserved-key table) | critic C4 — **pending James's one-line ratification** | §5 entirely; §9.C |
| P8 | Frozen read ABI: `getObject(id)`, `getSlot(slotId)` (returns claimId + seq + recordDigest + revoked/empty disposition + expiresAt + supersessionCount + priorClaimId), `getClaim(claimId)` (body bytes from state — bodies-in-state normative), `isRevoked(claimId)`, `allClaims(i)`/`claimCount()`, `getValue(propertyId)`, `authorHead(author)` (per-chain hint, never currency) | Ch.4 | [[codex-kernel]] Read ABI ownership (G5), adopting infra demands #2/#4b/#5 | §1, §3, §9 |
| P9 | Reserved-key table (13 rows, `successor` demoted per C10) with follow-policy + matrix-override columns; dual-role pattern (`mirrors`) defined once | Ch.5 | kinds §5 + critic C10 + K4/S10 | §4.3 |
| P10 | tagId derivation with the kind word (`H(DOMAIN_ANCHOR, parentId, keccak(name), kindTag)`); domain-separated ID constants; ID-SHAPE-1 | Ch.2 | deterministic-ids §1; identity ID-SHAPE-1 | §6 |
| P11 | Admission confluence: no admission check reads revocable state except via the slot comparator; semantic refusals are inert-recorded no-ops with refusal events; `maxEntries` becomes a **read-time filter** | Ch.3 | critic C6 (the round's #1 mandatory fix) | §3.5 |
| P12 | Container-scoped per-tagId discovery index (bounded, paginated) | Ch.4 | critic G2 — **pending James** | §7 (primary path); §7.3 is the fallback |
| P13 | Genesis blob contains system/spec objects only — **no protocol default lens, ever** | Ch.4/G6 | ops L1 | §8 |

Two pins (P7, P12) await James ratification. This spec is written so that **only §5's copied-chain column and §7's primary path degrade** if either is refused; nothing else blocks.

---

## 1. The read model (Durable; pins P1–P4, P8)

### 1.1 Actors and terms

- **Venue** — one source of admitted EFS state: a live chain, a replica chain, a cherry-picked record set, an offline bundle. Every read happens *at* a venue and every answer is venue-relative until §5 grades it.
- **Lens** `L = [a₁ … aₖ]` — the viewer's ordered trusted-author list (bytes32 identity words). Author-first default for container reads: `[containerAuthor, viewer, …]`. A lens is data (a LIST) or client config; either way it is disclosed (§8 LC1).
- **Deny set** `D = {d₁ … dₘ}` — advisory authors whose deny-shaped claims subtract *after* allow-resolution (§3.4). Unordered (any hit subtracts).
- **Read context** `ctx ∈ {GATE, INTERACTIVE}` — the K6 split. GATE = machine/gating reads: contracts, installers, CI, `?current` API views, anything that *acts* on the answer. INTERACTIVE = a human browsing with a rendering surface that can carry labels. Every conforming resolver declares its context; there is no third context and no undeclared context.
- **Position** — one `(author, key)` pair in the resolution walk. A **key** is whatever the read is about: a placement slot (path resolution), a reserved-key slot (contentType, mirrors, checkpoint…), a list-entry slot, a TAG accumulation.
- **Data class** — the expiry-doctrine class of the key being read: `safety-critical config` (30–90d expiry class), `trust/authorization` (≤1y class), `ordinary` (no expiry). Set by app/SDK convention, consumed by horizons (§5.3).

### 1.2 The two link forms (normative, from holistic §2.5 / ops U3)

- **Path form** — `web3://…/<path>` resolves under the *recipient's* lens at read time. Mutable, like a git branch.
- **Citation form** — pins `~claim:<claimId>` (or object id) + an explicit `?lenses=` chain (+ optional venue/as-of qualifiers). Reproducible, like a commit.

Share-UIs MUST expose both, defaulting to path form for browsing and citation form for referencing/quoting.

### 1.3 The slot read primitive (restates Etched pins P1–P3; the Codex owns the math)

For slot `s` at venue `V`:

```
W = argmax over { c : c ∈ admitted(V), c.slot == s } by (c.seq, c.recordDigest)   // P1
if W == ⊥            → slot is EMPTY
if (W.author, claimId(W)) ∈ revocationSet(V)                                      // P3
                     → slot is EMPTY                                              // P2: empty-on-revoke
else                 → slot holds W  (with W.expiresAt, supersessionCount, priorClaim)
```

Consequences the read layer builds on, stated once:

- **Revocation clears; it never resurrects.** A revoked incumbent does NOT yield the slot to the previous claim (no "max over unrevoked"). The author can always re-assert at a new seq. A stale REVOKE naming an already-superseded claim changes nothing (it names a non-winner).
- **Superseded claims still exist.** They are reachable by claimId (`getClaim`) and in historical enumeration; their disposition is SUPERSEDED (§2), never silently absent.
- **Slot state is a pure function of the admitted set** — identical on any venue holding the same records, in any order. What differs between venues is *which* records are admitted; §5 grades that.

---

## 2. Read-grade vocabulary (Durable; NORMATIVE, CLOSED SET)

The vocabulary has three axes plus flags. A rendered/consumed grade is the composite `(position-state | disposition, currency, flags)`. The set below is **closed for v2**: a conforming reader MUST NOT invent grades, and MUST treat an unknown grade word from a peer as UNKNOWN. Extension is by Codex/spec revision only; three names are **reserved now** for the KEL era: `UNAUTHENTICATED-POST-INCEPTION`, `KEL-UNKNOWN`, and `KEL-CONTESTED` (divergent cross-chain inceptions for one identity word — attack-identity D2: post-fork envelopes excluded from slot supersession; deliberately distinct from the v2 record-level CONTESTED grade) (identity pass §4.2 union-read rules as amended — formats reserved, not consumed by any v2 reader).

### 2.1 Position states (per lens position — computed before any claim is graded)

| State | Definition | How computed | Resolution behavior |
|---|---|---|---|
| **PRESENT(c)** | The position's slot holds an unrevoked winner `c` | §1.3 primitive | grade `c` per §2.2 |
| **PROVEN-ABSENT** | The venue *proves* no active claim at this position — either total live state (home chain) says so, or a non-inclusion proof against the author's checkpoint N says so ("absent **as of N**") | empty slot on a total-state venue; or checkpoint non-inclusion (P7) | **yield** — continue to the next lens position. This is the only state that permits fallthrough |
| **UNKNOWN** | The venue cannot answer for this author: partial copy without a covering checkpoint, unreachable state, unfetchable author data | empty slot on a non-total venue with no checkpoint coverage; any read failure | **STOP.** Return unresolved. A resolver MUST NOT fall through a lens position whose state is UNKNOWN |

**The anti-fallthrough rule, with its argument (normative):** first-attester-wins is **anti-monotone under missing data**. If position `aᵢ`'s state is UNKNOWN and the resolver falls through to `aᵢ₊₁`, then the later arrival of `aᵢ`'s data can only *retract* the served answer in favor of a more-trusted one — the resolver served an answer that better information is guaranteed not to strengthen and may reverse. Falling through on UNKNOWN silently promotes a lower-trust author: it converts a data gap into a trust transfer. Therefore: **UNKNOWN ≠ PROVEN-ABSENT, and only PROVEN-ABSENT yields.** (This is FM1 / ops C4 / the substrate decision's read-grade rule, made mechanical.)

### 2.2 Claim dispositions (per claim; dominance order top-to-bottom — first match wins)

| Grade | Definition | How computed | Rendering obligation | GATE-consumable? |
|---|---|---|---|---|
| **EQUIVOCAL** | Duplicity evidence — two validly-signed records at the claim's `(author, seq)` with different digests — is known to the resolver, from local admission OR an imported portable proof (P6). The author's log is forked at this region | check duplicity evidence for `(c.author, c.seq)`: local `SeqCollision` state/events + any presented proof pair | **NEVER rendered or served as LIVE**, at any venue, under any currency. Display all known branches as a multi-value read with the evidence; lens-level distrust is the resolution path | **NO** — fail closed |
| **CONTESTED** | The EQUIVOCAL special case where *this venue has admitted ≥2* same-`(author, seq)` records and the resolver is serving the deterministic tie-break winner (max by (seq, recordDigest)) — identity-pass grade: deterministic convergence plus an honest label, never a silent merge | ≥2 locally-admitted records at winner's `(author, seq)` | serve the tie-break winner **labeled**, with "N other versions" one interaction away. INTERACTIVE only; in GATE context this situation grades EQUIVOCAL | **NO** |
| **REVOKED** | `(c.author, claimId(c)) ∈` revocation G-set at this venue | P3 lookup | reachable only by direct claimId dereference or historical views (the slot already reads empty — P2). Display: "**author withdrew this**" — venue-qualified off home ("withdrawn as of this venue's knowledge") | **NO** (a gate may consume the *fact of revocation* as evidence, never the claim) |
| **STALE** | `c.expiresAt ≠ 0 ∧ readClock > c.expiresAt` and not revoked. Expired-not-revoked: authenticity intact, currency void | P5 word vs read clock (`block.timestamp` on-chain; wall clock off-chain) | **distinct from REVOKED, always.** Home-chain live read: "author let this lapse / went silent." Any other venue: "**no renewal known to this venue** (completeness horizon: seq N, age X)" — the global assertion "author went silent" is only assertable at a live home-chain read past expiry (attack-ops E2). Conflating STALE with REVOKED slanders dead authors and MUST NOT happen in any UI | **NO** — and in GATE context STALE **stops** resolution (§3.2) |
| **SUPERSEDED** | Not the slot winner: a higher-(seq, recordDigest) claim exists in the same slot at this venue | slot compare | historical/version views only; "superseded **at this venue** as of its admitted set" — a newer venue may know an even newer claim (as-of humility applies) | **NO** |
| **LIVE** | Admitted, slot winner, unrevoked, unexpired, no duplicity evidence — *within the venue's currency bound* (§5) | everything above passed | render plain on HOME-LIVE; **venue-qualified** ("as of seq N, age X") on any other currency. A LIVE disposition under UNKNOWN-CURRENCY MUST NOT render as plain LIVE (§5.3 grade flip) | **YES**, iff currency ∈ {HOME-LIVE, AS-OF(N) with age ≤ H} AND the deny pass (§3.4) is clean. Safety-class keys additionally require §5.4 MUST-pull |

### 2.3 Currency qualifiers (per venue × author; §5 computes them)

| Qualifier | Meaning |
|---|---|
| **HOME-LIVE** | reading the author's live home chain: certain **over admitted state** (see the §5.1 footnote — this is certainty about what the chain admitted, not about author intent under a censoring sequencer or a stolen key) |
| **AS-OF(N)** | bounded by the author's checkpoint through seq N; display N's age everywhere it qualifies a grade |
| **UNKNOWN-CURRENCY** | the venue cannot bound revocation/renewal completeness for this author: no checkpoint, checkpoint older than the applicable horizon H, or cherry-picked copy. Never rendered as LIVE |

### 2.4 Flags (orthogonal; combinable)

| Flag | Meaning |
|---|---|
| **BYTES-UNAVAILABLE** | claim authenticated, payload bytes unfetchable at this venue (storage-depth-dependent placeholder — attack-ops E4; only reachable under the events+commitments storage outcome). Render as "authentic pointer, bytes absent here"; a GATE read requiring bytes fails closed |
| **DISCOVERY** | the item came from a discovery enumeration (§7): enumeration ≠ endorsement; MUST be lens-graded before any trusted render; counts never consumable |
| **DENIED(hits)** | one or more subscribed advisory authors actively advise against this result (§3.4). GATE: fail closed. INTERACTIVE: render with the advisory labels |

### 2.5 Key-compromise honesty (normative caveat on the whole table)

Every "certain" and every "LIVE" in this spec means **certainly this key**. A compromised bare-EOA *is* the author for every rule above: it renews, re-asserts, counter-supersedes, and cannot be rotated in v2 (attack-ops D4, the "same-key war"). Expiry and revocation defend against withheld propagation and author silence — **neither defends against key compromise**. The working defenses are lens-level distrust on out-of-band evidence and third-party advisory subtraction (§3.4) — deny-lists don't care whether the author is absent or hostile. Scoped keys and rotation are the first purchase of the reserved KEL. Every conforming client's grade documentation MUST carry this paragraph or an equivalent.

---

## 3. Lens resolution algorithm (Durable; NORMATIVE)

### 3.1 Core resolution (pseudocode, normative)

```pseudo
// Resolve one key K under lens L, deny set D, context ctx, at venue V.
// Returns: Resolved(claim, grade, position) | Denied(result, hits)
//        | Stop(claim, grade, position)      // content exists but is not consumable
//        | Unresolved(position, UNKNOWN)     // anti-fallthrough stop
//        | AbsentEverywhere(bound)           // every position PROVEN-ABSENT

function resolve(K, L = [a1..ak], D, ctx, V):
  bound = strongestAbsenceBound(V)                  // certain | as-of(N) | none
  for a in L:                                       // ordered; first-attester-wins
    ps = positionState(a, K, V)                     // §2.1
    if ps is UNKNOWN:
      return Unresolved(a, UNKNOWN)                 // RR-2: never resolve UNKNOWN as absent
    if ps is PROVEN-ABSENT:
      continue                                      // the ONLY fallthrough
    c = ps.winner                                   // unrevoked by construction (P2)
    g = disposition(c, V, ctx)                      // §2.2 dominance order
    if g == EQUIVOCAL or g == CONTESTED:
      return Stop(c, g, a)                          // never LIVE; never fall through
    if g == STALE:
      if ctx == GATE:
        return Stop(c, STALE, a)                    // K6 split, machine half: STOP
      else:                                         // INTERACTIVE: label-and-render-stale
        emit render(c, STALE, venueQualified(V, c.author))
        if readerPolicy.explicitStaleFallthrough(K):   // never a default; §3.2
          continue
        return Stop(c, STALE, a)
    // g == LIVE (with currency qualifier)
    return applyDeny(Resolved(c, g, a), D, ctx)     // §3.4
  return AbsentEverywhere(bound)

function positionState(a, K, V):
  if not V.canRead(a): return UNKNOWN
  s = deriveSlot(a, K)                              // offline keccak; P10
  slot = slotRead(s, V)                             // §1.3 primitive (P1–P3)
  if slot is EMPTY or slot.winner is revoked:       // empty-on-revoke folds in here
    cur = currency(V, a)                            // §5
    if cur == HOME-LIVE:            return PROVEN-ABSENT(certain)
    if cur == AS-OF(N) and nonInclusion(a, s, N):   return PROVEN-ABSENT(asOf = N)
    return UNKNOWN                                  // absence without a bound is unknown
  return PRESENT(slot.winner)

function disposition(c, V, ctx):
  if duplicityEvidence(c.author, c.seq, V):         // P6: local OR imported proof
    if ctx == INTERACTIVE and bothBranchesAdmitted(V, c.author, c.seq):
      return CONTESTED
    return EQUIVOCAL
  if c.expiresAt != 0 and readClock(V) > c.expiresAt:
    return STALE
  cur = currency(V, c.author)                       // §5, incl. horizon flip
  return LIVE @ cur                                 // LIVE@UNKNOWN-CURRENCY ≠ plain LIVE
```

Normative properties of this algorithm:

1. **Determinism.** Same lens chain + same admitted set + same evidence + same clock ⇒ same result, every client, every time. (This is the promise the attribution UI sells — ops U2.)
2. **Verification order** (ops S4, normative for SDKs): lens-membership → signature → byte fetch. Never fetch bytes for an author the lens rejects.
3. **Precomputation is legal, verification is mandatory:** indexers MAY precompute per-(lens, key) winners; a client MUST be able to verify any precomputed winner with k′ ≤ k point reads. The SDK ships the verifier.
4. **Cost:** up to k slot probes per contested key; per-author indices make each probe O(1); early-exit dominates on typical keys. A 10k-author mega-lens over a hot namespace is an indexer workload (rule 3), not a light-client one.

### 3.2 The expiry context split (implements critic C13 / attack-kinds K6; normative)

- **GATE reads:** STALE ⇒ **stop, never fall through**. A freshness bound must never convert into a trust transfer: the author bounded this data's currency; the machine consumer does not get to substitute a lower-trust author's answer because the fuse blew. Fail closed or warn per app policy — but never resolve past it.
- **INTERACTIVE reads:** STALE ⇒ **label-and-render-stale** by default (the archive is the product; a lapsed placement is still the author's placement). Fallthrough below a STALE position happens **only by explicit reader policy** — a persistent, per-viewer, disclosed setting (same UI tier as lens ejection), never a client default, never silent. Without this split, expired claims would block harder than revoked ones and expiry becomes a passive lens-wedging lever (the Bored Squatter, K6).
- **Exit-flow doctrine** (one sentence, for SDK verbs `[→ Codex]`): an author who wants to *stop serving* a claim REVOKEs (the slot yields cleanly); expiry is a *currency fuse*, not an exit mechanism. SDK exit verbs steer to REVOKE.

### 3.3 What GATE reads may consume (the consolidated rule)

A GATE read may act on exactly:

1. `Resolved(c, LIVE @ HOME-LIVE)` with a clean deny pass;
2. `Resolved(c, LIVE @ AS-OF(N))` with `age(N) ≤ H(dataClass)` and a clean deny pass — **except** safety-class keys, which additionally require §5.4 (MUST-pull home when reachable; fail closed / warn when not);
3. `AbsentEverywhere(certain)` or `AbsentEverywhere(asOf N ≤ H)` — absence is consumable *with its bound*;
4. the *fact* of a REVOKED / EQUIVOCAL / DENIED grade as negative evidence.

Everything else — UNKNOWN, UNKNOWN-CURRENCY, STALE, CONTESTED, EQUIVOCAL content, DISCOVERY items, counts — is **not consumable by a machine gate.** Contracts never run lens fallback at all: on-chain consumers gate on *closed author sets* and point reads (infra §6.2); a lens-walking contract is an anti-pattern.

### 3.4 Deny composition (implements critic G1 action + attack-ops D3; normative)

**Why this exists:** first-attester-wins is allow-shaped; it cannot express "admit everyone in lens A EXCEPT these." Every deployed safe-consumption ecosystem (RustSec, OSV, npm audit, Bluesky labelers) is deny-shaped: third parties assert badness and tooling *subtracts*. The v2 answer — adopted so nothing kernel-side blocks — is **client-side deny-filter composition: advisory lenses subtract after allow-resolution.**

**Advisory claims are ordinary claims.** No new kernel surface: an advisory is a TAG by a security/moderation author under an advisory definition (e.g. the author's `/advisories/<feed>` TAGDEF or a conventional advisory key), `target` = the thing advised against, `weight` = severity code, body/properties carrying the notice. Because the TAG slot key is `(author, definitionId, targetId)`, **"does advisory author d advise against X" is a derivable point read** — the deny pass costs O(|D| × |matchKeys|) `getSlot`s, no enumeration.

```pseudo
function applyDeny(r: Resolved, D, ctx):
  hits = ∅
  keys = matchKeys(r.claim)     // ordered most-specific-first:
                                //   claimId(r.claim)            — this exact assertion
                                //   r.claim.targetId            — the object (dataId etc.)
                                //   slotAnchor(r.claim)         — the tagId / path node
  for d in D:
    for mk in keys:
      adv = slotRead(deriveSlot(d, advisoryKey(mk)), V)     // point read
      if adv is PRESENT:
        g = disposition(adv.winner, V, ctx)                 // advisories are graded like any claim
        if g == LIVE:                       hits += (d, adv.winner, g)
        if g == STALE and honorStale(ctx):  hits += (d, adv.winner, g)   // see rule 4
        // REVOKED advisory = withdrawn (false positive): never subtracts
        // EQUIVOCAL advisory: never subtracts as a hit; surface the duplicity evidence instead
  if hits == ∅: return r
  if ctx == GATE:        return Denied(r, hits)             // fail closed
  else:                  return r with advisoryLabels(hits) // render + label; reader policy may hide
```

Normative composition rules:

1. **Subtract-after-resolve.** The deny pass runs on the *resolved winner only*. A deny hit **never re-opens resolution** — the slot is not offered to lower lens positions. Denial is not absence: falling through a denied winner would let an advisory author rewrite the namespace with lower-trust content (trust inversion, the deny-shaped twin of the anti-fallthrough rule).
2. **Deny sets are disclosed like lenses** (LC1 applies): "this result was filtered by advisories from d₁, d₂" must be inspectable.
3. **Advisories are graded before they subtract.** A revoked advisory is withdrawn. An EQUIVOCAL advisory author is surfaced, not obeyed.
4. **Expiry asymmetry, fail-safe in the deny direction:** advisory authors SHOULD publish deny claims with `expiresAt = 0` (vulnerabilities don't heal). GATE readers SHOULD honor STALE advisories (`honorStale(GATE) = true` by default); INTERACTIVE readers label them "stale advisory."
5. **The un-deny is REVOKE.** Advisory withdrawal = the advisory author revokes; monotone, portable, propagates like any revoke.
6. **Positive-shape corollary:** advisories are *presence-shaped* signals (monotone, replication-friendly) — they work when the target author is absent, unaware, or hostile, which is exactly where author-side revoke/expiry fail (D3/D4). For the safety-critical class, deny-composition is the load-bearing layer, not a nicety.

**The forcing example** is the package-registry advisory yank — worked in §9.B.

### 3.5 Charter read-filters (implements critic C6; pins P11)

With admission-confluence Etched (semantic refusals inert, no counters in admission), two list-charter properties are **enforced at read time** by every conforming resolver:

- **maxEntries:** when enumerating an author's entries in list `listId` with charter cap `m`: order that author's entry slots by each slot's **minimum admitted (seq, recordDigest)** (a pure function of the admitted set — stable under renewal/supersession), take the first `m` slots whose current winner is non-empty. Later slots exist, are enumerable in historical/unfiltered views, and are labeled `beyond-charter-cap`. `[→ Codex Ch.3/4 formula + vectors]`
- **Refusal events are read surface:** inert-recorded refusals (`RefusedAppendOnly` etc.) are enumerable evidence; a conforming client surfaces them in the author's history view ("this revoke was refused by the list charter"), never as state.

### 3.6 Composite read rules restated from the reserved-key table (pins P9)

- **Mirror set** = PIN (primary) ∪ active TAGs under `mirrors`; the PIN is the defined primary. Consumers' fallback when the PIN slot is empty: enumerate TAGs (off-chain) or fail — never guess (kinds S1).
- **supersededBy / mutable-document reads:** "current version" = the placement slot (supersession does the work); the `supersededBy` chain is the history walk. Update-in-place mirror churn on a placed DATA is an anti-pattern flag (FM11) — a conforming client renders a placed DATA whose mirrors/contentHash were re-pointed with a version-model warning.
- **Naming:** the path TAGDEF segment name is canonical for listings; the `name` reserved VAL row is display metadata only (kinds S9).

---

## 4. Precedence & shadowing (Durable; the read-precedence chapter kinds §2.7/§4.2 mandates `[→ Codex with vectors]`)

### 4.1 Name shadowing across kinds (frozen total order per serving context)

One parent may hold the same `name` under multiple kindTags (distinct tagIds — the kind word is in the derivation, P10). The resolver picks by context, in this frozen order:

| Serving context | Trial order for segment `name` under parent `p` |
|---|---|
| **Terminal segment, byte-serving** (GET a file) | KIND_DATA → KIND_GENERIC (render listing) → KIND_LIST (render list view) |
| **Non-terminal segment, path continuation** | KIND_GENERIC → KIND_DATA (descend into file-node children — legal per kinds §4.2) → KIND_LIST |
| **Explicit kind requested** (API/prefixed) | exactly that kind, no fallback |

At each trial the full §3 resolution runs; a trial "misses" only on AbsentEverywhere — UNKNOWN still stops (a resolver MUST NOT try the next kind past an UNKNOWN position, same anti-monotonicity).

### 4.2 Sub-file paths (attack-kinds S11)

Path segments below a file node resolve normally (children under KIND_DATA are legal), but: **a child of a file node is not the file author's content** unless the same author wrote it. Conforming UIs mark the authorship boundary (the attribution chip, §4.4) — `alice.eth/statement.pdf/UPDATED-statement.pdf` renders with the child's true author, defusing the phishing shape. One hostile-child vector required. `[→ Codex]`

### 4.3 Follow policies (consumes the P9 follow-policy column)

| Row | Policy | Read-spec mechanics |
|---|---|---|
| `symlink` | auto-follow | counts against the follow budget |
| `movedTo` | auto-follow (rename primitive) | counts against the follow budget; the moved-from node renders a provenance breadcrumb |
| `supersededBy` | follow only in "latest version" mode, user-visible chain | never silently substitutes bytes for a citation-form link (citations pin) |
| `sameAs`, `relatedVersion` | **NEVER auto-followed** (vectored) | render as labeled edges only |
| `home` | advisory venue hint (§5.5); never resolution input | a lying `home` degrades to "unknown," fail-safe |
| `successor` | **demoted, reserved-not-active** (critic C10): pending the KEL, an interim successor convention is client-layer doctrine — exactly one targetKind (OPAQUE), publish-pair-at-creation, **never auto-followed, MUST NOT be consumed for authorization or authorship migration**; consumers key authorship on the original word | until the KEL ships, a `successor` claim renders as an unverified forwarding notice, nothing more |

**Follow budget (frozen constant of this spec `[→ Codex]`):** `MAX_AUTO_FOLLOWS = 8` combined (symlink + movedTo) per resolution, cycle-detected by visited-set. Exhaustion or a cycle is a **resolver error** (`UNRESOLVABLE`), not a grade — rendered as an error, never fallen through.

### 4.4 Shared-namespace legibility (ops U1/U2; normative for INTERACTIVE clients)

- **U1 attribution chip:** every resolved claim in a shared namespace shows who won and from which lens position.
- **U2 multi-claimant marker:** keys where ≥2 lens authors hold active claims are marked, with "N other versions" ordered by the viewer's own lens one interaction away. (This is *cross-author* contention — a UI marker, deliberately NOT the CONTESTED grade, which is single-author duplicity. The words must not be confused in any client string catalog.)
- **The canonical explanation** (user-facing docs, verbatim): *"You never see 'the' `/readme`; you see the `/readme` of the first author you trust who wrote one."*

### 4.5 Lens subscription hygiene (consumer app 5; ops B1)

- **Pin-and-diff:** subscribing to a published lens pins its entry-set (hash or the curator's checkpoint); clients default to **live-follow removals, prompt on additions/reorders** (fail-safe asymmetry — removals reduce trust, additions extend it).
- A cached/pinned lens copy is a *different lens*; disclose the version (stale-lens shadow, ops FM).
- Lens manifests SHOULD declare paid-inclusion policy; a lens that sells placement and says so is an ad channel, one that sells and doesn't is fraud the market punishes by desertion (B1).

---

## 5. Per-venue grade ceilings (Durable; pins P7 — the copied-chain column is void if C4 is refused)

### 5.1 THE honest table (normative for client rendering)

For a claim C by author A:

| Question | Home chain (live) | Copied chain (A's log through checkpoint N) | Cherry-picked copy (record + proof, no checkpoint) | All A's chains dead (offline bundle) |
|---|---|---|---|---|
| Authentic (A's key signed it)? | Certain¹ | Certain¹ | **Certain¹** — authenticity never degrades | Certain¹, from bytes alone |
| Exists / slot answer? | Certain, total state | Certain over admitted set (pure f(set)) | this record exists; slot context unknown | as of the bundle |
| Revoked? | **Certain² over admitted state** | "not revoked **as of seq N**" (non-inclusion vs N); freshness = N's age, displayed | **UNKNOWN — MUST NOT render as "not revoked"** | "as of last surviving checkpoint," labeled |
| Current (latest)? | certain per-author | as of N — snapshot, never feed | unknown | as of the bundle |
| Composite ceiling | LIVE @ HOME-LIVE | LIVE @ AS-OF(N) if `age(N) ≤ H`; **UNKNOWN-CURRENCY if not** (§5.3); STALE if expired | UNKNOWN-CURRENCY at best; STALE if expired | historical evidence grade: "A said this, unrevoked as of N, before epoch E" |
| Reader duty | none extra (but see ²) | display N's age; courier/pull for safety reads | upgrade to a log-scoped copy before trusting | label the grade; never simulate liveness |

¹ "Certain" = **certainly this key** (§2.5). ² **Revoke-selective-sequencer footnote (normative, attack-ops C1):** home-chain revocation certainty is certainty **over admitted state, not over author intent.** A censoring sequencer can suppress the author's REVOKE while admitting everything else; on floor-bearing chains the suppressed-revoke window is bounded by the force-inclusion delay (~hours–1 day); on floorless chains it is unbounded. Mitigation is a standing practice, not machinery: **the SDK's revoke path broadcasts multi-venue by default** — a REVOKE is self-verifying and anyone may submit it, so revoking submits home AND hands the envelope to couriers/other carrying chains in the same act.

One-line summary (docs, verbatim): **authenticity is unconditional; absence-of-revocation is a freshness claim and always carries its date; expiry is the author's fuse for readers who won't check dates.**

### 5.2 Checkpoints are ordinary claims (pins P7; critic C4)

A checkpoint is a reserved-KEY claim: PIN at key `checkpoint` under A's ADDRESS container, VAL string body encoding `(throughSeq, stateRoot)` over A's active-claim + revocation state through `throughSeq`. Zero kernel machinery: no `latestCheckpointId`, no head-currency, no fork choice. Read rules:

- A checkpoint **bounds staleness; it never proves freshness.** Competing/conflicting checkpoints are ordinary duplicity evidence (EQUIVOCAL machinery), never a resolution problem for the protocol.
- The checkpoint claim is itself graded before use: a REVOKED checkpoint bounds nothing; an EQUIVOCAL one is evidence against the author. Checkpoint age = `now − tidTime(checkpoint.seq)` — author-asserted, admission-bounded above (TID +600s rule), backdatable only against the author's own freshness grade (fail-safe).
- A checkpoint from a leaked key proves nothing about the true author's revokes (§2.5 applies).
- Non-inclusion proof format (proof of "not revoked / no newer assertion through N") is owned by the SDK & Submission spec; this spec consumes its verdict.
- Log-scoped-through-checkpoint remains the blessed replication unit; a copier shipping claims without the covering checkpoint has produced a lower-grade copy and readers grade it §5.1 col 3.

### 5.3 Freshness horizons flip grades (attack-ops D1; normative)

Every composite grade takes a **freshness horizon H**, per lens or per data class. `AS-OF(N)` with `age(N) > H` ⇒ the currency **flips to UNKNOWN-CURRENCY** — the horizon flips the grade, it does not decorate a LIVE. Default horizons (SDK/app defaults, never protocol constants):

| Data class | Default H |
|---|---|
| safety-critical config (30–90d expiry class) | **hours** (reference default: 6h) |
| trust/authorization (≤1y class) | days (reference default: 7d) |
| ordinary claims | none (∞) — checkpoint age still displayed |

The eternal-freshness default is named: no expiry + no horizon display = years-stale data rendering as fresh. Expiry is the author's fuse; checkpoint-age display is the reader's seatbelt; **they are independent and both normative.**

### 5.4 MUST-pull for safety-class gate reads (attack-ops D1 fix 2; normative)

A GATE read acting on safety-class data MUST pull the author's home chain when reachable (declared via the `home` reserved key; one RPC: `authorHead` + the specific slots + revocation lookups), and MUST degrade to UNKNOWN-CURRENCY — fail closed or warn, per app — when it is not. This is the layer that works **without publisher cooperation**, which is why it, not expiry, is the MUST (D2c). On-chain gates, which cannot pull, substitute a checkpoint-age policy (`require age(N) ≤ H`, else revert) — worked in §9.C.

### 5.5 Home declaration & migration (attack-ops C4-survivable; infra demand #5)

`home` (reserved PIN, VAL string: chainId + optional hint) declares the author's currency venue. Migration is a convention, not machinery: re-PIN `home` ("home moved to chain X as of seq N") published on the **new** venue and couriered everywhere — the old sequencer cannot stop other chains from carrying it. Readers' couriers learn the new venue; old-venue-only readers degrade to checkpoint grade, which is the honest outcome. A lying `home` misdirects a freshness check into "unknown" — fail-safe by construction.

### 5.6 Mutability doctrine split (attack-ops D2; normative wording for app guidance)

- **Immutable version claims** (`v4.2.0 = dataId/hash`): expiry **inappropriate** — permanence is correct; the threat is *badness*, answered by deny-advisories (§3.4), not staleness.
- **Mutable pointers** (`latest`, dist-tags, live config, trusted-key lists): expiry appropriate; the org-with-CI renewal persona is real; §5.3 horizons apply.
- Adoption honesty: expiry only protects ecosystems that adopt it; the reader-side horizon + deny layer work without publisher cooperation.

---

## 6. Container classifier & URL surface, post-EAS (Durable; pins P10; answers gap G4)

### 6.1 What died and what the classes now are

The v1 classifier was **Address > Schema-UID > Attestation-UID > anchor-name**. EAS is gone: the Schema-UID and Attestation-UID classes are dead. The v2 classes a 64-hex word can denote:

| Class | Shape / registry | View served |
|---|---|---|
| **ADDRESS** | `0 < uint256(w) ≤ 2^160 − 1` (top 96 bits zero) | address container (root of the author's tree) |
| **TAGDEF** (tagId) | registered in the object registry, kind = TAGDEF | container / path node |
| **DATA** (dataId) | registered, kind = DATA | file view (placement/mirrors via the owner-lens read) |
| **LIST** (listId) | registered, kind = LIST | list view (charter + filtered entries, §3.5) |
| **PROPERTY** (propertyId) | registered (interned) | value view |
| **CLAIM** (claimId) | not in the object registry; `getClaim` | single-claim view with full grade + provenance |
| **name** | anything else the author *meant* as a literal path segment | derives a child tagId under the current parent |

### 6.2 Collision-safety argument (precise)

1. **Cross-class id collisions are keccak-hard.** Every derived id commits to a distinct domain constant as the first 32-byte word of its preimage (`DOMAIN_ANCHOR`, `DOMAIN_DATA`, `DOMAIN_LIST`, `DOMAIN_PROPERTY`, `DOMAIN_CLAIM_V1`, `DOMAIN_SLOT` — P4/P10). A single word registrable/derivable in two classes requires a keccak-256 collision between preimages that differ in their first word: ~2^128 birthday work, i.e. collision-resistance of keccak itself. Consequently **the object registry can only ever hold a given id in one class**, and classifying a registered id by its registered kind is unambiguous. ClaimIds are disjoint from all objectIds by the same argument (envelope §7.1: "inert by collision-resistance, not by a check").
2. **Address vs digest:** a keccak-derived id lands in the address subspace (96 leading zero bits) with probability 2^-96; grinding one in deliberately costs ~2^96 work (deterministic-ids §1). For identity words, ID-SHAPE-1 closes even that by rule (digest-shaped identities must re-salt out of the address subspace). So "address-shaped ⇒ ADDRESS" misclassifies nothing an adversary can mint.
3. **The residual ambiguity is syntactic, not cryptographic:** a *name* whose text is 64 hex chars (anyone can name a folder with the hex spelling of an existing dataId — consumer app 2's collision). No hash argument resolves this — the grammar must (§6.3).

### 6.3 Classification precedence (normative grammar)

For each path segment `w`:

1. **An explicit prefix always wins** (§6.4). No further classification.
2. **Root position, bare word:**
   a. address-shaped (`0x` + 40 hex, or 64-hex with 24 leading zeros, nonzero) ⇒ **ADDRESS**;
   b. bare 64-hex: `getObject(w)` registered ⇒ **class = registered kind** (permanent: the registry is write-once, so a classification never changes once minted);
   c. else `getClaim(w)` present at this venue ⇒ **CLAIM view**;
   d. else ⇒ **UNKNOWN-ID view** ("not instantiated at this venue" — venue-qualified; it is NOT interpreted as a name). A root-level literal name that happens to be 64-hex requires `~name:`.
3. **Non-root position, bare word: always a NAME** — it derives the child tagId under the current parent, full stop. Direct id jumps mid-path require an explicit prefix. This single rule structurally deletes the mid-path id/name ambiguity; the SDK still warns on minting 64-hex-looking names (confusing URLs), but they are unambiguous.

### 6.4 The explicit-prefix escape hatch — SHIPS (ruling)

Prefixes (URL-safe, `~` sigil, closed set):

```
~addr:<40-or-64-hex>    ~tag:<64-hex>     ~data:<64-hex>
~list:<64-hex>          ~prop:<64-hex>    ~claim:<64-hex>    ~name:<literal>
```

Rationale for shipping it rather than precedence-only: (a) §6.2.3's residual ambiguity is otherwise resolvable only by lookup-order convention, which breaks when registry state differs across venues; (b) citation-form links (§1.2) need `~claim:` regardless; (c) `~name:` is the only escape for 64-hex literal names at root. Prefixes are Durable URL surface (gateway/SDK), not derivation input — no Etched cost. Bare forms remain legal per §6.3 precedence.

### 6.5 web3:// URL shapes (concrete, normative examples)

```
web3://<host>/<rootSegment>[/<segment>…][?query][#fragment]
```

`<host>` = the EFS router/kernel address or its ENS name on the reader's chain. Mirror-style URIs without a chainId are **chain-relative** ("this chain") per infra demand #3.

| Example | Meaning |
|---|---|
| `web3://efs.eth/0x1Ad8…11D7/docs/charter.md` | address container, named path, recipient's lens (path form) |
| `web3://efs.eth/0x1Ad8…11D7/docs/charter.md?lenses=0x1Ad8…,0xCa401…` | explicit ordered lens chain |
| `web3://efs.eth/~tag:0x3fc9…8a21/` | direct container jump (tagId), listing view |
| `web3://efs.eth/~data:0x77aa…be40` | file view of a dataId (owner-lens mirrors/props) |
| `web3://efs.eth/~claim:0x51ee…0c9d?lenses=0xA11c…&deny=0x05v1…` | **citation form**: pinned claim + explicit lens + deny set — reproducible |
| `web3://efs.eth/0xB0b…/blog/posts/why-tags.md?stale=show&grades=1` | interactive read surfacing labels |
| `web3://efs.eth/0xA11c…/vault/~name:1220ab…ff/photo.jpg` | literal 64-hex *name* segment, disambiguated |
| `…/photos/album#k=<capability>` | salted-path capability rides the **fragment** — never sent to servers or chain |

Normative query keys (closed set; unknown keys ignored): `lenses` (ordered), `deny` (unordered), `stale=show|hide` (INTERACTIVE only), `grades=1`, `asof=<seq>` (historical view), `kind=<class>` (explicit-kind context, §4.1).

---

## 7. Discovery reads (Durable; pins P12 — primary path assumes the kernel ships the index; §7.3 is the labeled fallback)

### 7.1 The read (assuming the container-scoped cross-author index ships)

```
discover(tagId, cursor, limit ≤ MAX_PAGE=256) → (entries: [(authorWord, claimId)], nextCursor)
```

- **Scope:** per-tagId — all admitted claims whose `definitionId == tagId` (placements at a file node; TAGs into a container), across all authors. Bounded and paginated; never a global scan (the index-shape doctrine: spam is absorbed at the writer's gas, poisoning is contained to the one container).
- **Order:** admission order at this venue — chain-local bookkeeping, labeled as such; never a cross-chain truth, never an input to slot resolution.
- **Grade: every entry is `DISCOVERY`-flagged.** Enumeration ≠ endorsement. Before any trusted render, each candidate MUST pass §3 grading under the viewer's lens (or be shown in the explicitly-labeled untrusted view — LC5). Discovery **counts** (N comments, N likes) are indexer artifacts and are never consumable by GATE reads.
- **Completeness:** venue-relative ("all claims admitted *here*"); a replica's discovery read carries the venue's currency qualifier like any other read.

### 7.2 What discovery may never do

Discovery output MUST NOT: enter slot resolution; promote an author into a lens; satisfy a PROVEN-ABSENT check ("nothing enumerated" ≠ proven absent — absence bounds come only from §2.1); or render unlabeled next to lens-resolved content.

### 7.3 Degraded path (if the kernel does not ship the index): the indexer lane

Identical client semantics with one downgrade: the enumeration source is an off-chain indexer over full-payload events, so results carry `DISCOVERY(INDEXED)` — **enumeration completeness = indexer trust**, and clients MUST say so ("N comments known to indexer X"). Per-item verification is unchanged and mandatory (envelope sig → author; bytes → contentHash): per-item authenticity is provable, "there are no hidden items" is not. Apps needing trustless enumeration in this mode fall back to curation (a moderator's approval LIST/TAGs — trustlessly enumerable per-author, priced per approval).

---

## 8. Conformance (Durable; NORMATIVE)

### 8.1 Default-lens client rules (LC1–LC5 — ops §1.2 C1–C5, adopted verbatim + the SDK extension)

- **LC1 (disclosure):** any shared-namespace or discovery read displays the active lens chain (whose view is this?) — including deny sets (§3.4.2) and the pinned lens version (§4.5).
- **LC2 (data, not config):** a client's shipped default lens MUST be a published lens ON EFS — inspectable, subscribable, forkable, diffable. Never opaque embedded config.
- **LC3 (eject):** replacing/removing the default is a first-class, persistent, one-interaction setting.
- **LC4 (no silent fallthrough):** on UNKNOWN (vs PROVEN-ABSENT) lens-author state, clients MUST NOT fall through — §2.1's rule, restated where it will be violated first (bootstrap UI).
- **LC5 (untrusted is labeled, not hidden):** the opt-in untrusted/discovery view is visually distinct and never the default render for a shared namespace.
- **LC6 (SDK extension — attack-ops A3):** LC2/LC3 bind the SDK and reference clients too: the SDK ships **no** default lens and **no** default relayer endpoint; reference-client defaults are published-on-EFS artifacts under the same disclosure/eject rules; example code uses placeholder endpoints that fail loudly.

### 8.2 Resolver rules (RR)

- **RR1** — a resolver implements §3.1 exactly; same inputs ⇒ same output on every conforming implementation.
- **RR2** — **never resolve UNKNOWN as absent** (anti-fallthrough; §2.1). Only PROVEN-ABSENT yields.
- **RR3** — **never serve EQUIVOCAL (or CONTESTED) as LIVE**, at any venue, under any currency, in any context.
- **RR4** — STALE display is **venue-qualified** and never conflated with REVOKED: "no renewal known to this venue (horizon N, age X)" off home; "author let this lapse" only on a live home-chain read.
- **RR5** — the K6 context split (§3.2): GATE stops on STALE; INTERACTIVE labels and renders; fallthrough only by explicit, persistent, disclosed reader policy.
- **RR6** — currency qualifiers always render with their bound (N + age); `AS-OF` past horizon H flips to UNKNOWN-CURRENCY (§5.3); a LIVE@UNKNOWN-CURRENCY never renders as plain LIVE.
- **RR7** — deny composition per §3.4: subtract-after-resolve, never re-resolve below a denied winner, advisories graded before subtracting, revoked advisory never subtracts.
- **RR8** — GATE consumption limited to §3.3's list; safety-class GATE reads obey §5.4 MUST-pull; on-chain gates use closed author sets and never walk lenses.
- **RR9** — verification order: lens → signature → bytes (never fetch bytes for a rejected author); precomputed winners verified with ≤ k point reads.
- **RR10** — discovery output honors §7.2; indexer-lane results labeled `DISCOVERY(INDEXED)` with the completeness caveat.
- **RR11** — classifier precedence per §6.3; prefixes per §6.4; registered-id classification treated as permanent.
- **RR12** — BYTES-UNAVAILABLE renders as authenticated-pointer-without-bytes; a GATE read requiring bytes fails closed.

### 8.3 Acceptance tests for a conforming reader (the suite a resolver must pass; vectors `[→ Codex Ch.7]`)

1. **Anti-fallthrough:** lens `[a₁, a₂]`, `a₁` state UNKNOWN (partial venue, no checkpoint) ⇒ Unresolved; after `a₁`'s checkpoint arrives proving absence ⇒ resolves to `a₂`. Both orders.
2. **Empty-on-revoke:** winner revoked ⇒ position PROVEN-ABSENT (home) — next author serves; the *previous superseded claim does not resurrect*; author re-assert refills.
3. **Superseded-then-revoked non-winner:** revoke naming a superseded claim ⇒ slot unchanged.
4. **STALE context split:** same expired claim: GATE ⇒ Stop(STALE); INTERACTIVE default ⇒ label-and-render; INTERACTIVE with explicit policy ⇒ fallthrough occurs and is disclosed.
5. **STALE ≠ REVOKED rendering:** distinct strings, venue-qualified off home; home-live past-expiry allows the "lapsed" wording.
6. **EQUIVOCAL never LIVE:** imported duplicity proof over (author, seq) with only one branch locally admitted ⇒ EQUIVOCAL in both contexts; both-admitted + INTERACTIVE ⇒ CONTESTED with tie-break winner = max (seq, recordDigest) and "N other versions."
7. **Deny subtraction:** LIVE winner + LIVE advisory (by claimId / by targetId / by tagId — three vectors) ⇒ GATE Denied, INTERACTIVE labeled; revoked advisory ⇒ clean; stale advisory ⇒ GATE still denies (default), INTERACTIVE labels "stale advisory"; deny hit does NOT surface a lower lens position's claim.
8. **Horizon flip:** AS-OF(N) with age ≤ H consumable; age > H ⇒ UNKNOWN-CURRENCY, GATE fail-closed, INTERACTIVE venue-qualified render. Boundary vector at age == H.
9. **MUST-pull:** safety-class GATE read on a replica with home reachable ⇒ resolver provably queried home (revoke found only at home is honored); home unreachable ⇒ fail closed with UNKNOWN-CURRENCY.
10. **Checkpoint hygiene:** revoked checkpoint bounds nothing; conflicting checkpoints ⇒ duplicity evidence, no fork choice; backdated checkpoint only worsens the author's own grade.
11. **maxEntries read-filter:** cap-m list with m+2 entry slots ⇒ first m by min-(seq, recordDigest) served, rest labeled `beyond-charter-cap`; renewal of an early entry does not evict it.
12. **Name shadowing:** `readme.md` as KIND_DATA and KIND_GENERIC under one parent ⇒ byte-serving picks DATA, path-continuation picks GENERIC; explicit `kind=` pins.
13. **Follow budget:** symlink chain of 9 ⇒ UNRESOLVABLE error (not a grade, no fallthrough); cycle ⇒ same; `relatedVersion` never followed; `successor` never followed, never authorizes.
14. **Classifier:** address-shaped word ⇒ ADDRESS; registered tagId/dataId/listId/propertyId ⇒ kind class; claimId ⇒ claim view; unregistered root 64-hex ⇒ UNKNOWN-ID (not a name); mid-path bare 64-hex ⇒ name; each `~prefix:` overrides; hostile sub-file child shows true author.
15. **Discovery:** entries DISCOVERY-flagged; lens-filtering before trusted render; counts refused by a GATE read; indexer-lane variant labeled INDEXED.
16. **Determinism:** two independent implementations, same admitted set + lens + clock + evidence ⇒ byte-identical resolution results across this whole suite.

---

## 9. Worked examples (informative but precise; each exercises the normative path)

### 9.A The blog-comments read (INTERACTIVE; consumer app 2)

Setup: Bob's post at `/0xB0b…/blog/posts/why-tags.md`; comments container `tagC = /0xB0b…/blog/comments/why-tags/`; commenters Carol (main identity) and Dave (burner). Viewer lens: author-first default `[0xB0b, viewer]`. Venue: Bob's home chain (HOME-LIVE for all authors present).

1. **Post resolve:** position (0xB0b, placement slot at the file tagId) → PRESENT; disposition LIVE @ HOME-LIVE → render plain. Attribution chip: "0xB0b via lens position 1."
2. **Comment enumeration:** `discover(tagC)` → `[(Carol, c₁), (Dave, c₂), (Spammer, c₃), …]`, all DISCOVERY-flagged.
3. **Verified section (allow-lens = Bob's approvals):** Bob TAGs approved comments under his `approved` definition. Carol's `c₁`: Bob's approval slot PRESENT, but `expiresAt` passed (Bob set 90d on approvals per the endorsement class) ⇒ approval disposition **STALE**. INTERACTIVE ⇒ `c₁` renders in "previously approved — approval stale at this venue," not in "verified." No fallthrough (no reader policy set). Dave's `c₂`: approval LIVE ⇒ verified section, chip "approved by 0xB0b."
4. **Unverified view (LC5):** `c₃` and unapproved comments render only in the labeled untrusted view, per-item signature-verified ("really by 0xSpam…; no trusted source admits it").
5. **Dave revokes `c₂`'s attach-TAG** (burner key retained): slot reads EMPTY (P2) → comment leaves current render; Bob's approval TAG now targets a claim whose placement is revoked → the approval renders with "target withdrawn by author" (REVOKED consumed as evidence, RR8).
6. **On a replica** missing Dave's revoke and with Bob's checkpoint aged 2 days: every grade above gains `AS-OF(N, 2d)`; `c₂` still shows there — venue-qualified, with N's age displayed; nothing renders as plain LIVE (RR6). Comment ordering is display-order = home-admission where available; self-asserted otherwise (FM12, cosmetic).

### 9.B The package-registry install read (GATE; infra app 3 — the deny-forcing example)

Setup: installer resolves `foo@^1.2.0`. Lens `[curator]` (name-grant: `foo → publisher P`); deny set `D = {OSV, vendor-sec}`; venue: an L3 registry mirror holding P's log through checkpoint N (age 3h); safety-class horizon H = 6h; P's `home` = Base.

1. **Candidate versions** via discovery/indexer (DISCOVERY: candidates only; semver logic client-side). Best match: `1.4.2`.
2. **Resolve `1.4.2` placement** under `[curator → P]`: PRESENT, unexpired, no duplicity ⇒ LIVE @ AS-OF(N, 3h ≤ H). *Provisionally* consumable —
3. **but this is a safety-class GATE read and home is reachable ⇒ MUST-pull (§5.4):** query Base: P **revoked** the `1.4.2` placement yesterday (RCE). Home says slot EMPTY (empty-on-revoke). The mirror's LIVE-as-of-N was true and insufficient — exactly the D1 window. Result: `1.4.2` rejected; the resolver records REVOKED-at-home as evidence.
4. **Fall back to `1.4.1`:** LIVE at home (HOME-LIVE).
5. **Deny pass (§3.4):** point reads — `getSlot(OSV, advisory(dataId₁.₄.₁))`, `…(claimId)`, `…(versionTagId)`; same for vendor-sec. One hit exists on **`1.3.0`** (not our candidate) — noted, irrelevant. `1.4.1` clean ⇒ **Resolved, consumable**. (Belt-and-braces: had P's revoke been sequencer-suppressed at home — §5.1 footnote² — the OSV advisory on `1.4.2` would still have Denied it: the deny layer works when author-side levers fail, including compromised-publisher, §2.5.)
6. **Lockfile:** installer pins `(dataId, contentHash)` — non-revocable objects; future installs verify bytes without re-resolving (pin-and-diff for machines).
7. **The `latest` dist-tag variant:** `latest` pin expired (P on vacation) ⇒ GATE hits STALE ⇒ **stop** (RR5): "dist-tag stale; specify an exact version." It does NOT fall through to any other author holding a `latest` pin lower in the lens — that would hand the tag to a squatter the moment the publisher's fuse blew.
8. **Home unreachable variant:** step 3 impossible ⇒ degrade to UNKNOWN-CURRENCY ⇒ fail closed (default) or `--allow-stale-as-of=6h` explicit override, which is a disclosed reader policy, not a default.

### 9.C The copied-L3 config read (on-chain GATE; the Microsoft walkthrough)

Setup: MSFT publishes `/0xMSFT…/config/app.json` on Base with `expiresAt = +90d` on the placement PIN; a copier replays the envelope set + MSFT's checkpoint claims onto a fresh L3; an L3 contract (`EFSGate`-style) reads it. On-chain gates cannot pull home; their seatbelt is expiry + checkpoint-age policy.

1. **Derive offline:** `tagId_file`, P's placement `slotId` — pure keccak (P10).
2. **Read:** `getSlot(slotId)` → claimId + expiresAt + supersession count; `getClaim` → body → dataId; mirrors via the `mirrors` PIN (primary, point read) → `data:` bytes in state. 3–5 point reads, no oracle. Authenticity: certain (the L3 kernel verified MSFT's signature at admission) — *certainly this key* (§2.5).
3. **Currency:** read MSFT's `checkpoint` reserved-key slot (§5.2) → throughSeq N, `age = block.timestamp − tidTime(N)` = 40 days. Contract policy for this safety-class config: `require(age ≤ 7 days)` ⇒ **reverts — fail closed.** That is the D1 grade flip executing on-chain: LIVE-as-of-40d is not consumable; UNKNOWN-CURRENCY is not decorated LIVE.
4. **A courier lands MSFT's fresh checkpoint (age 2h) + no intervening revoke:** re-read ⇒ LIVE @ AS-OF(2h) ⇒ gate passes. Expiry backstops the whole arrangement: if couriers die and MSFT goes silent, the placement goes STALE at +90d and the gate stops on its own — the author's fuse (X2), independent of the reader's seatbelt.
5. **EQUIVOCAL variant:** someone files the portable duplicity proof (two signed records at (MSFT, seq)) on the L3 ⇒ any resolver holding the evidence grades the region EQUIVOCAL ⇒ never LIVE regardless of checkpoint freshness (RR3); the off-chain operator surfaces both branches and the lens-level distrust decision. (An on-chain gate consumes duplicity only if the evidence surface is exposed to contracts — G5's read-ABI consolidation decides how much of P6 is contract-visible; flagged in §0.)
6. **Offline-bundle epilogue** (the 100-year read): chain dead, bundle = envelopes + last checkpoint. Every record re-verifies from bytes alone; the honest grade is the §5.1 last column: "MSFT said this, unrevoked as of N, before epoch E" — historical evidence, liveness never simulated.

---

## Open questions

Genuinely-James items only (everything else in this spec is decided here or pinned to Codex owners per §0):

- [ ] **P7 ratification (critic C4/E6, one sentence):** confirm "no HEAD/CHECKPOINT machinery" means no kernel head-currency/fork-choice *while CHECKPOINT survives as an ordinary reserved-key claim* readers may use as an informational grade bound. §5's copied-chain column (and §9.C) lives or dies on it. Recommendation attached: ratify — it is the only reading under which the settled direction's own "proven-absent vs unknown" clause remains checkable off the home chain.
- [ ] **P12 + enumeration-spine cost surfaces (critic James-Q2):** adopt the bounded per-tagId discovery index (§7.1) and the enumeration spine (~7–15%/record). Both are archival/verify-don't-trust properties the mission is priced on; this spec ships §7.3's labeled indexer-lane fallback either way, but two of ten grounded apps convert from indexer-dependents only under adoption.
- [ ] **Safety-class GATE default posture in the reference SDK:** §5.4 mandates fail-closed-or-warn; the reference SDK must pick ONE shipped default (recommendation: fail closed, warn requires an explicit flag). One-line taste call with ecosystem-wide default-stickiness consequences (A3-adjacent), so it is listed here rather than decided silently.
- [ ] **Client-OS pressure (2026-07-07):** [[client-os-pressure-report]] P3 requests eight revision items against this spec (UNKNOWN cause taxonomy incl. NO-TRANSPORT, PENDING-LOCAL overlay composition, composite closure grades, grade→executability, machine-readable provenance tuples, post-eviction degraded state, rendering-locale-as-lens, §6.5 lens-excerpt/link-portability grammar) and P8 a normative read-path-privacy section. **P13** adds a normative rule: *the author-asserted TID is untrusted as real time — gate on admission-time (P1) / expiry / checkpoints, never the claimed timestamp* (defuses back-dating: chaotic ordering, fake predictions, edit-after-reply). Adjudicate in the next revision pass.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (contracts: read-ABI/view contracts + EFSGate reference; sdk: resolver, deny pass, courier/revoke-broadcast, URL grammar; planning: Codex chapters receiving the `[→ Codex]` flags)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`; **§0 pin table re-verified against the reconciled Codex** (esp. P7/P12 James items, P11 confluence invariant)
- [ ] The `[→ Codex]` items handed off with vectors: name-shadowing total order (§4.1), follow budget + hostile-child vector (§4.2/§4.3), maxEntries read-filter formula (§3.5), exit-flow sentence (§3.2)
- [ ] §8.3 acceptance suite implemented against the reference resolver AND one independent implementation (test 16 requires two)
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment (this spec is Durable, not Etched, but it is the most-routed-to reader document — review by a lineage independent of the 2026-07-07 corpus authors recommended)

## Implementation notes

Implementation order: SDK resolver (§3, pure function, differential-testable) → grade rendering kit (§2 strings, venue qualifiers — one shared string catalog so RR4/STALE-vs-REVOKED wording can't fork per client) → deny pass (§3.4) → URL grammar + classifier (§6) → gateway/EFSGate reference consumers (§9.B/9.C shapes) → discovery lane per the P12 outcome. The §8.3 suite is the schedule driver, mirroring the Codex discipline: vectors before adoption, once, after the C1–C13 reconciliation lands.
