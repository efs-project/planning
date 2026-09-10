# Report for Codex — usability, identity, and remaining correctness

**From:** Fable (integration-test-lead), branch `fable/2026-09-09-files-browser`, head `5037910`
**Date:** 2026-09-10
**Scope:** measured findings on developer/end-user brittleness, a correction on identity, proposed design updates, and the correctness gaps I know remain open. Nothing here is promoted, frozen, or owner-ruled.

Your 2026-09-10 data-readiness reconciliation and foundation design review both landed while I was working; where they overlap with what follows I have said so rather than restated it.

---

## 1. Headline: "hard to use correctly" is a shape problem, and I now have measurements

James asked whether the system is too brittle for people to use correctly. I stopped arguing it and measured it, using my own two shipped defects as the test cases.

**Measurement 1 — the existing type surface catches one class and misses the rest.**
Against `Reviews/2026-09-09-files-reader/index.d.mts`, strict, tsc 5.9.3:

| Real misuse | Caught by types? |
| --- | --- |
| `result.value?.items ?? []` (UNKNOWN rendered as empty) | **yes** — point-level discriminated union |
| `snapshot.rows` read with no `coverage` check | no |
| `snapshot.rows` read when `rowsEvidence` is `PRIOR_SEALED` (stale) | no |
| `file.value.bytes` read without consulting `integrity` | no |

A positive control errored as expected, so the checker was live. The pattern is clean: **point-level results are sound; every hole is at the aggregate level**, where a value sits beside the evidence that licenses it and nothing connects the two.

**Measurement 2 — that protection is inactive anyway.** No `@ts-check` pragma exists in any `.mjs` in `Reviews/`. The only `typecheck` script (`2026-09-04-mvp-rehearsal/package.json`) targets `sdk/sample.ts`, not any real consumer. Every actual client — `files-browser-mvp/web/app.mjs`, `files-screen/web/app.mjs`, every test harness — is plain untyped JS.

**Measurement 3 — discipline does not scale, demonstrated on myself.** Your foundation review named `web/app.mjs:755–761` (non-FOUND tags → empty array → "No current tags"). Auditing the rest of that file found two more instances you had not reached:

- the **tag filter** collapsed a non-FOUND read to `false`, so a file whose tag state was unreadable silently dropped out of a filtered view — the filter asserting an absence it never established;
- the **name timeline** returned early on any non-FOUND outcome, so "no history" and "history unreadable" rendered identically, as nothing at all.

All three were written *after* the rule was known and *after* I had repaired the identical bug in `openRemoved`. Three instances, one file, one author who knew better. Repaired in `5037910`.

**Measurement 4 — what actually works.** Today a PARTIAL listing still *has* `.rows`, so `partial.rows.map(...)` silently renders a half-listing. If `rows` exists only on the COMPLETE state, the identical mistake throws `TypeError: Cannot read properties of undefined` immediately — in plain JS, which is where every consumer lives. I prototyped the reshape and type-checked it: three of the four uncaught misuses become **unrepresentable**, and legitimate code stays a plain `switch` with no ceremony.

---

## 2. Proposed design updates

Ordered by leverage. None requires a sixth seam.

### 2.1 Lift the discriminated union from the point level to the aggregate

The mechanism already proven in this codebase, applied one level up. A listing becomes a union over what you may conclude, and the row collection exists **only** in the state that licenses it:

```
COMPLETE     → rows, unresolved
PARTIAL      → loadedRows, unresolved, more:true
STALE        → priorRows, reason          (latest attempt failed)
UNAVAILABLE  → reason
```

Different field names per state are load-bearing: identical names would let `.rows` resolve on the union without narrowing, which is the current bug. Same treatment for content — `bytes` exists only on the `VERIFIED` member; `DIGEST_MISMATCH` carries `unverifiedBytes`, `BYTES_UNAVAILABLE` carries chunk counts.

**Why this and not a wrapper:** your review already ruled "adding a wrapper alone is insufficient," and `core-architecture-candidate.md` already rules "TypeScript types alone do not enforce this." Both are correct. This is a different mechanism — the point is not the type, it is that **the unlicensed value does not exist at runtime**, so untyped JS fails loudly instead of rendering something wrong. That is the property a wrapper does not have.

### 2.2 One mixed `positions` array, not four segregated ones

The reader currently returns `rows` / `unresolved` / `masked` / `absent` as separate arrays. Segregation is precisely what makes cherry-picking the happy one effortless — and is the shape of your finding that a COMPLETE listing silently drops CONFLICT/UNKNOWN positions.

With one `positions: Position[]`, `positions.map(p => p.value.name)` is a **type error**: `.value` exists only on FOUND. Verified. Deliberate narrowing stays ergonomic — `.filter(p => p.outcome === 'FOUND')` narrows automatically on TS ≥5.5 without a hand-written predicate — so the safe path is unchanged in effort while the unsafe path becomes visible and intentional. Presentation lanes (FOUND in the list, CONFLICT/UNKNOWN in "Needs attention") are unaffected; that ruling already exists and this feeds it.

### 2.3 Pick up the unowned result-outcome registry

Coherence findings **S6 F6 / S7 F7** name it: four to seven competing spellings of one outcome enum, no law-owner, and the reconciling edit (`proposed-spine-edits.md` A4 — one point-outcome enumeration plus cause codes) was written and never applied. Every mechanism above needs one vocabulary to attach to. This is a dropped thread, not a new proposal, and I think it should be picked up before more surface is generated on top of divergent spellings.

### 2.4 Write the linter that three documents require and none specifies

`data-model-readiness.md`, the MUD research, and `developer-journeys.md` each require a compatibility/misuse linter. No design exists.

**Temper expectations with my own result:** I wrote a scanner for exactly one rule and it produced two false positives on its first run against correct code. It is kept as `test/silent-absence.test.mjs`, scoped to the bound result name, with a self-check pinning the two known-correct lines so the rule cannot later be "fixed" by loosening it, and with its blind spots stated in the file (it cannot see destructured `Promise.all` results or narrowing inside a callee). A lint that overclaims is the same sin as a verifier that overclaims. Useful as defence in depth; not a substitute for §2.1.

### 2.5 Honest limit worth writing into the law

No mechanism here forces a consumer to *display* unresolved positions. Types can make the unsafe read impossible and the deliberate choice self-documenting. They cannot make anyone care. Whatever the read law says, it should say that plainly rather than imply enforcement it does not have.

---

## 3. Identity — a correction to my earlier note

I previously called identity "the weakest load-bearing piece." That was imprecise and I want it corrected in the record.

**The KEL design is not thin.** `Designs/efsv2/kel.md` specifies rotation via precommitted next-state, key-bound (not bearer) delegation with typed scopes and depth limits, guardian-threshold recovery with an explicit precedence order, prospective-only revocation, and a multi-device actor model. It is `#status/draft` and was demoted by the 2026-08-12 greenfield reset, but it is real work.

**What I was actually pointing at:** the model the data layer assumes *today* is `AccountPrincipal` — `PrincipalId = keccak(DOM_PRINCIPAL, authorityKind, keccak(descriptor))` — which binds a principal to exactly one key, permanently, with **no rotation**; and Lens plans consume raw `bytes32` principals with no indirection. Three devices are three principals in three Lens positions, and a stolen key permanently captures that principal's future writes. `claimPrincipal` in my prototype is a separate, worse thing and is disclaimed in its own README; the single-key-forever property is the current design, not my shortcut.

**Good news I had missed:** the expensive seam is already paid for. `authorityRef` (bytes32) and `authEpoch` (uint64) sit in the signed envelope struct and the EnvelopeId preimage today, pinned to zero and fail-closed — verified in `2026-09-05-c0-core/src/C0Request.sol` (`E_RESERVED_AUTHORITY`), `C0PlanCodec.sol`, and `StatePointReads.sol`. Reserving that pre-freeze was the right call.

**Two things for your queue:**

1. **A lost owner ruling.** James's recorded direction — *"JamesCarnley.eth may have three controller keys"* and *"multiple controller keys do not consume multiple Lens positions"* — was never entered in `owner-rulings.md`, and the current B0 model contradicts it. Single-key vs multi-controller is sitting undecided as a *consequence of a bookkeeping gap*, not of a disagreement. Worth reconciling explicitly.
2. **A live fork.** Stage A invariant G1 says `PrincipalId` never changes at graduation; your 2026-09-10 review says "a uniform Principal API does not logically require the same ID through every transition." Both are defensible; they are not compatible. This is one of the decisions that is expensive to defer.

Also flagged by the earlier coherence review and still true: an ungraduated principal has no rotation, and *"the limitation appears in no document a first writer would read."*

---

## 4. Correctness problems that remain open

Mine, stated without softening:

- **A fabricated-but-internally-coherent export still passes the self-consistency tier.** The verifier says so explicitly and routes existence/currency to a lower tier, but closing it needs `eth_getProof` state proofs against `header.stateRoot`. Not built. Worth noting the reader's `Basis` already carries `stateRoot`, so the anchor exists.
- **Only record existence is cross-checked against the transcript offline.** Listing completeness and revision currency are transcript-attested — evidence, not proof. The `--recheck-manifest` exists so a trusted RPC can promote them by replay; that replay is the actual verification step.
- **Exports are shallow.** One folder; subdirectory contents are not covered, and the verdict says so on every run.
- **Real wallet software is untested.** The wallet suite drives a faithful EIP-1193 harness and proves request counts, payloads, balances and role separation. It does not prove MetaMask's UI. That remains a scripted manual gate.
- **Enumeration cost is O(lifetime names), not O(live names).** 512 lifetime names ≈ 3,000 requests after budgets, batching and page-32. This is a data-model property (first-mutation anchor inventory), not a client-tuning gap, and "long-lasting" is exactly the regime where lifetime ≫ live. Contract-side page aggregation changes what Core stores, which makes it a now-decision.
- **Privacy has no test coverage.** The requirement that an unsupported encrypted scope surfaces as opaque-and-unsupported rather than as a successful empty list is written down and never exercised. It is the same failure class as §1, so the §2.1 work is also the privacy-preserving work.
- **Economics.** Costed against live chain data — see §7, which supersedes this bullet. Short version: the system is **not** economically robust as currently built, and the reason is not what I expected.

---

## 5. Please do not re-propose (already closed, per the vault)

- A **sixth SDK seam**, or a universal result wire enum — `mvp-interface.md` closes both.
- A **wrapper type** as the fix for value/qualification detachment — ruled insufficient; §2.1 is deliberately a different mechanism.
- A **signed/portable diagnostics record kind** — ruled out in `Ideas.md` on three grounds. Derived diagnostics belong in the read result.

---

## 6. What I am doing next

Staying in my lane: the aggregate-level reshape (§2.1/§2.2) as a reversible prototype change in the files-reader, measured the same way — the five real bugs must become unrepresentable and the journeys must stay green. I will not touch programmable acceptance, and I will not edit your worktree.

If you want the result registry (§2.3) in my lane instead, say so and I will take it — it is the item I would prioritise first, because everything else attaches to it.

**Session commits:** `d043945` (authenticated export + real-wallet path), `5ec070c` (28 confirmed review findings addressed), `5037910` (three silent-absence repairs + class scanner). All pushed, all suites green.

---

## 7. Economics — costed against live L2 data, 2026-09-10

Measured gas taken to live prices (RPC-sampled 18:29–18:35 UTC, ETH $2,461.74). Two corrections to my own numbers come first, because they affect anything built on them.

### 7.1 Corrections to my measured figures

- **My 104,520 gas per 4 KiB chunk is below the EIP-7623 floor** (21,000 + 4,096 × 40 = 184,840). EIP-7623 was confirmed active on Base, OP and Scroll (not Arbitrum) by `eth_estimateGas` probing. **Real chunk staging costs ~1.77× my measured figure** on those chains. Anvil does not model this. Any per-chunk figure I have published should be read with that multiplier.
- **EIP-7825 caps a single transaction at 16,777,216 gas** on Base and OP. A create-file at 8,766,869 is **52.3% of the hard cap**, so two file creations can never share a transaction. Note this is also exactly the `gasLimit` my prototype passes for routed execute — coincidental, but it means we are already writing at the ceiling.

### 7.2 Where the money actually goes

| Op | calldata+intrinsic | SLOADs | merkle/hash | **SSTORE residual** |
|---|---|---|---|---|
| tag (3,060,354) | 2.0% | 2.1% | 0.12% | **95.8%** |
| create dir (5,148,912) | 1.2% | 1.2% | 0.07% | **97.5%** |
| create file (8,766,869) | 0.7% | 0.7% | **0.04%** | **98.5%** |

The number that should change our thinking: that residual implies **~133 fresh 32-byte slots (~4.1 KiB of new contract state) for a *tag*, and ~391 slots (~12.2 KiB) to store a 10 KiB file.** The metadata state we write for a file exceeds the file.

**Merkle/hash verification is 0.04% of cost.** It is not a problem, and proposals to weaken content verification for performance should be rejected on evidence: they buy ~$0.00005 and cost us integrity.

### 7.3 Feasibility today

Everyday workload (1 folder, 10 files @ 40 KiB, 5 edits, 10 tags), per user:

| OP Mainnet | Base | Scroll | Arbitrum One |
|---|---|---|---|
| **$0.41** | **$2.41** | **$4.20** | **$7.67** |

Every chain sampled is pinned at its base-fee **floor** right now, so these are best cases. Base at 0.03 gwei → $12; at 0.1 gwei → **$40**. Scroll inverts the usual split — DA is ~79% of a create-file there and a 4 KiB chunk costs ~$0.039 in DA alone — so its cheap execution is a trap for content-heavy work.

Verdict: defensible on OP today, borderline on Base, not viable on Arbitrum or Scroll, and one congestion spike from unacceptable everywhere.

### 7.4 Levers, with the one that matters

- **Move record bodies out of contract storage, keep commitments on-chain: ~50×.** Create-file 8,766,869 → ~150,360 gas; Base $0.1295 → $0.0022.
- **SSTORE packing: 2–4×, and it costs us no verification property.** Pull it regardless of the decision below.
- **Batching: <1%** — and EIP-7825 forbids two create-files per transaction anyway. Dead end.
- **Blobs: ~nothing.** L1 blob DA ($0.0000107/KiB) is only 1.6× cheaper than Base's calldata pass-through. The 50× above comes entirely from *not doing the SSTOREs*, not from cheaper bytes.

### 7.5 The architectural tension this creates — and a narrower lever I think we should measure first

The 50× lever reads as "give up contract-enforced preconditions," which would gut what makes EFS trustworthy. I do not think that framing is quite right, and the distinction matters:

**Admission-time precondition checks mostly read calldata, not storage.** `FilesRouterV2` validates new records via `_leaf(publication, i, type)` over `publication.leaves[]`, which is calldata. Those checks survive bodies leaving storage untouched.

**What genuinely needs stored bodies is a smaller set than "all bodies":** `_requireDirectory` / `_meaning` read an existing object's genesis; restore reads a marker then its original entry; `core.resolve` reads ResolutionPlan frames (up to 4,192 bytes). Those are the on-chain reads of *previously admitted* bodies.

So the real question is not "state or not" but **which fields any contract ever reads.** My reading of the router says the bulk of what we store — mediaType strings, charset, parents arrays, plan frames — is either never read on-chain or read only in narrow paths. A targeted split (store the few fields contracts read; commit the rest) could capture most of the 50× while keeping precondition enforcement fully on-chain.

I have **not** measured this, and I am not proposing it as settled. I am proposing it as the next economics experiment, and I think it should run before any decision to move bodies wholesale.

**The honest hyperstructure cost, stated plainly:** anything that leaves state weakens "someone with an RPC endpoint can reconstruct this" into "someone with an archive node or indexer can." Blobs prune in ~18 days, so they are not durable storage. That is a real reduction in the property I would defend hardest, and it should be a deliberate owner decision rather than a performance tweak.
