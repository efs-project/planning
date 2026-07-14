# Decision — Large On-Chain File Uploads for EFS v2

**Role:** Decision synthesizer. **Inputs:** `arch-A-manifest-native.md`, `arch-B-da-promote.md`, `arch-C-thin-kernel-auth.md`, and their red teams (`redteam-arch-A.md`, `redteam-arch-B-da-promote.md`, `redteam-arch-C.md`), read in full, against the settled substrate (codex-envelope/kernel/kinds, read-lens-spec).

**All gas/latency numbers below are the source docs' own estimates and are UNMEASURED — a CI gas snapshot on a real L2 is freeze-blocking before any number here is cited in an ADR.**

---

## 0. The reframing that makes this decidable (read this first)

The brief says "James wants to CHOOSE" among three architectures. After reading all six documents, **the three are not three mutually-exclusive base mechanisms.** They are one shared mechanism plus two orthogonal choices:

- **A and C are the SAME core mechanism** — one `eth_signTypedData_v4` over a `chunks` manifest carrying an apex-count `chunksRoot`; content-addressed SSTORE2 chunk storage; per-chunk proof verification against the signed root; a monotone presence set as the stateless resume cursor; graded partial reads. They differ on **exactly one axis: where the byte-store + chunk verifier live** — A puts them in a **sibling Etched contract** (`EFSBytes`, write-time-admission, ERC-7201-frozen layout, kernel-guaranteed reads); C puts them in a **redeployable Durable store** (`EFSFileStore`, read-time verification, codehash-canonical). This is the classic **fat-vs-thin dial**, and both docs know it (A §13-Q1 "separate `EFSBytes` vs fold into kernel"; C §14 "C vs fat kernel (A)").
- **B is not a base mechanism at all.** B states it itself: *"B is a lifecycle/transport layer, not a replacement mechanism… A's SSTORE2 store is one of B's promotion targets"* (§0, §13). B = **A's mechanism + a blob transport rail + a promotion lifecycle + an ephemeral read grade.** So B ⊇ A on Etched surface. The only genuinely new thing in B is the **blob transport rail** (and one optional `attestBlobPublication` entrypoint).

So the actual decision is **three separable questions**, not a 1-of-3 pick:

1. **The dial:** Etched byte layer (A) or Durable byte layer (C)?
2. **The rail:** ship the blob transport rail (B) now, later, or never?
3. **The lens:** which read-grade / promotion / mirror-audit layers to adopt (mostly additive)?

Answering them separately is what lets us be decisive instead of mushing three good docs into a committee compromise.

---

## 1. What the red teams actually found — real fatals vs overclaims

| Doc | Fatal to the **mechanism**? | What the red team really established |
|---|---|---|
| **A** | **NO.** The crypto core is sound and the red-teamer "could not break it": count-at-apex `n`-binding, single-leaf proof admission (reusing the envelope's already-fuzzed `verifyLeaf`), monotone bitmap, content-addressed dedup, per-chunk `n`-authentication all hold. | All findings are **framing / threat-mis-analysis / decoupling-cost / unbonded-liveness** — every one fixable inside the architecture or honest to disclose. Sharpest real ones: (i) the permanence-tier **trilemma** (one sig can't compel a tier); (ii) permissionless pool = **unattributed permanent inscription** + **byte-revocation bypass** (two §11 table entries are factually wrong); (iii) `submitChunkRun` is **novel un-fuzzed consensus crypto for ~5-15%** — drop it. |
| **B** | **Fatal to the blob RAIL, not to safety.** | The blob transport rail is **dominated on every axis** by the two options B keeps on its own menu (A-direct-SSTORE2 and Arweave-mirror-at-upload); it **breaks a fixed mission end** (self-submit floor — type-3 blob txs are infra-gated, fewer chokepoints, rescue leans on trusted blob-archives); its "bank-now-ride-the-cost-curve-to-L1-in-2030" pitch is **illusory** (blobs prune in 18 days — you cannot wait years in a blob); and `attestBlobPublication` is **net-negative** (unverifiable, pollutable, can't do its one job). **Verdict: keep B's LENS, drop B's RAIL.** This reverts to A's own posture (tier-3 reserved, ship when blob bytes are durable). |
| **C** | **NO fatal to the architecture; TWO fatals to its THESIS.** | **F1:** "thin = more permanent because it freezes less" is **false** — the chunk-Merkle construction IS the commitment, so it is **de-facto Etched** (frozen on first signature, unfixable for a dead author); C relocates the frozen crypto to a **weaker-change-controlled** tier and mislabels it "forever fixable." **F2:** from-state reconstruction is **underdetermined** — `storeAddr = CREATE2(factory, chunksRoot)` needs a store-initcode **version** that is never committed, and C requires store code to evolve; so a reconstructor with only the manifest **cannot derive the address**. C's comparative case **collapses to "a smaller kernel LoC / EIP-170 budget"** — real, but far narrower than advertised, and largely **neutralized** by the fact that A already puts its byte machinery in a *sibling* contract (so A doesn't fatten the kernel either). |

**Bottom line:** There is **no fatal flaw in the shared mechanism.** The one real fatal is to **B's blob rail** (correctly handled by reserving it). C's fatals kill its *marketing*, demoting it from "obviously best because thinnest" to "a smaller-kernel trade with genuine costs (weaker reconstruction, weaker R1, verifier plurality)." Every serious A finding is fixable in-place.

---

## 2. The decision MATRIX

Scores: **5 = Strong, 4 = Good, 3 = Adequate, 2 = Weak, 1 = Broken.** Columns A/B/C are **as-written**; **REC** is the recommended hybrid = **A-mechanism + red-team-A fixes + B-lens (rail reserved) + C-discipline**. Unweighted totals are illustrative only — the mission weights axes 2, 8, 9 heavily.

| Axis (mission-relevant) | A | B | C | **REC** | Why (post-red-team) |
|---|:--:|:--:|:--:|:--:|---|
| **1. MetaMask prompts** (self-pay & relayer) | 4 | 2 | 4 | **4** | A=C: identical arch-independent auth table (1-sig relayer; self-pay = 1 sig + N gas-confirms; session-key = 2). **B worse**: type-3 blob tx no stock wallet builds and can't ride a 5792 batch → blob post *always* delegated; B's self-submit floor is literally A's. "One signature" is honest only as **authorize** (not fund, not self-funded-unattended = 2). |
| **2. Permanence / solidity (100-yr)** | 4 | 2 | 3 | **5** | A: tier-0 bytes in SSTORE2 **state** (survives EIP-4444), **Etched-frozen** `EFSBytes` layout → strongest from-state reconstruction; but tier unbound + pledge only 0/1. **C weaker**: F2 store-version underdetermination dents reconstruction. **B weakest**: blob-only ephemeral + fractional-withhold → **permanent uncompletable partial** (a failure A/C don't have). REC: tier-0 default, anchor on the Etched-frozen layout, pledge scoped to 0/1, optional signed `minTier`. |
| **3. Gas cost** | 3 | 3 | 3 | **3** | Physics: state bytes ~258M gas/MB (SSTORE2 ~200 gas/byte) — identical across all. B's cheap *upload* is offset because blob+promote > A-direct to reach the same permanent state. Real levers (all): **L2/L3** (1-2 orders), **Arweave-mirror** tier for cold archives ($20-50/10GB). |
| **4. Forward-compat with scaling** | 4 | 2 | 4 | **5** | A: promotion ladder (no re-sign) + runtime code-limit read + reserved tier-3. C: chunkSize-as-field (its cleanest axis) but **collides with F2**. **B's primary pitch is the illusory one** (can't wait years in an 18-day blob; the cost curve that matters runs between *durable* tiers, which A/C ride identically). REC keeps keccak-Merkle as the portable commitment-of-record and reserves tier-3 for when blobs go durable. |
| **5. New Etched-surface risk** (higher = safer) | 3 | 2 | 4 | **4** | C smallest **kernel** surface (≤1 opaque row) — but frozen-**crypto** surface equals A's (F1) + **verifier plurality** (link-the-wrong-lib accepts forged chunks). A larger (sibling `EFSBytes` + `submitChunkRun` novel crypto + single global contract). **B largest** (A + `attestBlobPublication`). REC: **drop `submitChunkRun`** → `EFSBytes` has *no* novel crypto (domain-retargeted `verifyLeaf`); sibling contract keeps the kernel budget; **one** audited verifier. |
| **6. Portability** | 4 | 3 | 4 | **4** | All: chain-free envelope replays + content-addressed bytes re-prove trustlessly (real gain over v1's unsigned mirror-claim). A/C both need scoping (A: to 0/1 *sources*; C: address-derivation leans on canonical store code, F2/M3). **B**: blob-only files are **non-portable** (no bytes on the new chain) — portable only after durable promotion. |
| **7. Resumability** | 5 | 3 | 5 | **5** | A/C: the on-chain presence set **is** the stateless global resume cursor; any party finishes; original signature covers all; partial progress **durable in state with no clock**. **B worse**: 18-day clock + fractional-withhold → a partial that can **never** complete (bytes exist nowhere). Shared caveat: you can't resume bytes you don't possess (retain-until-complete SDK discipline). |
| **8. Contract-readability (R1)** | 5 | 2 | 3 | **5** | **A strongest**: kernel-/contract-guaranteed write-time admission, `isComplete` Etched-guaranteed, point read on a canonical Etched contract. **C weaker** (C concedes it): completeness is computed *by the store* → trust the codehash or pay O(n); consumers link a verifier lib (plurality). **B**: blobs aren't EVM-readable → B routes R1 to the A path anyway. |
| **9. Credible-neutrality / self-submit floor** | 4 | 1 | 3 | **4** | A/C: any-EOA floor, relayer can never become author (author-from-signature; `msg.sender` ignored) — the memory's "no shared relayer = attester" concern is resolved structurally. A caveat: permissionless pool = **unattributed permanent inscription** + **byte-revocation bypass**. C caveat (M2): byte floor needs the **canonical store pre-deployed**. **B breaks the floor** for its own rail (blob infra-gated, *fewer* chokepoints, trusted-archive rescue). REC: EFSBytes always-present + **optional manifest-gate on permanent tiers** restores attribution+revocation. |
| **Illustrative total** | **36** | **20** | **33** | **39** | Mission-weighting (permanence, R1, neutrality) widens REC/A over C and buries B's rail further. |

**How to read the matrix:** B's numbers are dragged down almost entirely by its **novel rail** (axes 1,2,4,7,8,9) — its *lens* (read grades, promotion, mirror audit) is genuinely good and is **additive** to A or C, so it doesn't need to be a base architecture. A leads on the three mission-critical axes (permanence, resumability, R1) with **fixable** weaknesses on surface-risk (5) and neutrality (9). C trades a smaller kernel (4) for measurable weakness on reconstruction (2→3), R1 (8→3), and neutrality (9→3) — and its headline advantage is largely **already captured by A's sibling-contract structure.**

---

## 3. RECOMMENDATION

**Ship Architecture A as the base mechanism — a sibling Etched `EFSBytes` byte contract fed by one signed `chunks` manifest, tier-0 SSTORE2 (bytes-in-state) as the default — with the following mandatory modifications, and adopt B's lens while reserving B's rail.**

This is a **hybrid with a clear spine: A-mechanism + B-lens + C-discipline.** Concretely:

**Take from A (the spine):** one `eth_signTypedData_v4` → `chunksRoot` (count-at-apex) → proof-verified content-addressed chunks → in-state SSTORE2 tier-0 → contract-readable, from-state reconstructible, resumable, portable. This is the only option that delivers the mission's core ask — *bytes genuinely on-chain, in state, contract-readable, permanent* — with a single audited verifier and a kernel-/contract-guaranteed completeness read.

**Apply the red-team-A fixes (mandatory, before freeze):**
1. **DROP `submitChunkRun`.** It is novel, permanent, un-upgradeable, self-admittedly-unfuzzed Merkle-batch crypto (the OZ-multiproof CVE class) for ~5-15% on the tier where bytes already dominate. Removing it leaves `EFSBytes` with **zero novel crypto** — just domain-retargeted `verifyLeaf`. Highest-value single change; re-add later behind its own review + differential fuzz only if a measured gain justifies it.
2. **SCOPE the from-state-reconstruction and portability pledges to tiers 0/1 in writing**, and **anchor reconstruction on `EFSBytes`'s ERC-7201-frozen `storeId → chunkPtr` layout** (this is A's concrete advantage over C's re-derived `CREATE2` store address — do **not** import C's address-derivation as the permanent anchor; it is F2).
3. **Fix the two false §11 entries** (revocation "not served" contradicts §7's direct `~store:` serving; permissionless-spam "no amplification" misses content-liability + attribution) and **rewrite the headline**: one signature = **consent + content-identity + commitment-durability**, *not* author-bound permanence, guaranteed completion, or a funded bill.

**Take B's lens as Durable additions (adopt), reserve B's rail (defer):**
4. **ADOPT** the `BYTES-COMPLETE@{STATE,EPHEMERAL,OFFCHAIN}` / `BYTES-PARTIAL(k,n)` / `BYTES-UNBOUND` / `CONTENT-MISMATCH` read grades + the `EPHEMERAL-BYTES` currency flag; the **permissionless, keccak-verified promotion lifecycle** (run over an off-chain byte channel or a mirror — *not* blobs); and the **mirror-liveness audit** (Filecoin-PDP-style challenge). These are transport-independent and refuse the blob-permanence trap at read time. (Requires a real read-lens amendment with vectors — closed vocabulary.)
5. **RESERVE tier-3 (blob) and do NOT ship the transport rail now. DROP `attestBlobPublication`** (keep any publication receipt off-chain). Ship the blob tier only when blob bytes become **durable** (EthStorage-style proof-of-storage or a retention protocol change) — at which point it is a **mirror tier A already supports**, not a transport-to-nowhere.

**Borrow C's discipline (the legitimate residual):**
6. Keep the **kernel delta to one opaque-decoded `chunks` row** (C's dial B), keep **`chunkSize` a runtime/field value** (never hard-code 24576; read the code-size limit at runtime for EIP-7907), and keep the byte machinery in the **sibling contract** so the kernel's EIP-170 budget is untouched. This captures C's genuine EIP-170 benefit **without** paying C's costs (verifier plurality, weaker reconstruction, read-time codehash trust).

---

## 4. The decision RULE (what must be true for each to win)

**The one genuine fork is the fat/thin byte-layer dial. The rule:**

> **Default to A's Etched sibling `EFSBytes`.** It wins whenever the mission's stated priorities hold — bytes in state, contract-readable, from-state reconstructible, verify-don't-trust with a *single* audited verifier — because on each of those axes A is strictly better than C, and A's only cost vs C (kernel size) is **already neutralized** by making `EFSBytes` a sibling contract (the kernel gets one opaque row; the byte code lives elsewhere but still Etched).
>
> **C wins only if BOTH:** (a) the EIP-170 **skeleton compile** shows `EFSBytes` *cannot* be a clean standalone Etched contract, **AND** (b) James explicitly deprioritizes **kernel-guaranteed R1 contract-readability** in favor of absolute-minimum-irreversible-*kernel*-surface, accepting read-time-verified (linked-lib) R1 with codehash trust. Absent both, C's "thinner = more permanent" case is false (red-team-C F1/F2) and A dominates.
>
> **B (the blob rail) wins only when blob bytes are durable.** Until an EthStorage-class proof-of-storage or a protocol retention change exists, the 18-day fuse + infra-gated self-submit + illusory cost-curve make the rail strictly dominated by A-direct and Arweave-mirror. When durable blobs exist, B's rail collapses into a **mirror tier A already supports** — so "adopt B later" costs no architectural rework; it is a new store + scheme.
>
> **B's lens wins now, unconditionally** — the read grades + promotion lifecycle + mirror audit are additive and transport-independent; adopt them on the A spine regardless of the dial.

**Two cross-cutting rules that hold under any dial:**
- **Permanence tier is not compellable by the current signature (the trilemma: {one signature, transparent no-resign promotion, author-bound permanence} — pick two).** If James wants the author's signature to *compel* a permanence floor, add an **optional signed `minTier`** field (default unset = promoter's choice; if set, readers withhold the "permanent" grade until it is satisfied and the paying rail commits to filling it). This resolves the trilemma **per file, at the author's discretion**, and is additive.
- **There is no content-erasure primitive for permanent bytes** — revocation hides the pointer, not the content. If "unretractable permanent unattributed bytes" is an unacceptable real-world liability, **manifest-gate the permanent tiers (0/1)** on ≥1 referencing unrevoked signed manifest, leaving ephemeral tiers open (preserves pre-staging/dedup for cheap tiers, restores attribution + byte-revocation for permanent ones). This is a **credible-neutrality-vs-liability values call** — see Open Questions.

---

## 5. The smallest EXPERIMENT that de-risks the recommendation

**One end-to-end vertical slice on an L2 testnet, deliberately excluding the parts the red teams say to drop/reserve.**

> Chunk a **~1 MB file** at the SDK-default `chunkSize` → build `chunksRoot` (count-at-apex) → **one `eth_signTypedData_v4`** over the `{DATA, chunks-manifest-PIN, placement}` envelope → a **relayer account** submits the envelope (1 tx) then streams the ~43 tier-0 chunks via **`submitChunk` only (NO `submitChunkRun`)** into a **skeleton `EFSBytes` sibling contract** → **kill the relayer at ~60%** → a **different account** reads the on-chain **bitmap / `missingChunks`** and finishes the remaining chunks → read the whole file back via **`extcodecopy`**, check `isComplete`, and verify end-to-end against `contentHash`.

This single slice simultaneously de-risks the five load-bearing uncertainties:
1. **EIP-170 skeleton compile** — proves `EFSBytes` (submitChunk/submitChunks + `verifyLeaf` + bitmap + tier-0/1 storage + point reads, minus `submitChunkRun`) fits as a standalone Etched contract → **settles the fat/thin dial's gating condition** (§4 rule (a)).
2. **CI gas snapshot on a real L2** — the freeze-blocking measurement for tier-0 per-chunk + manifest envelope; the primary economic play is L2, so measure there, not L1.
3. **Shared crypto core end-to-end** — exercises count-at-apex + single-leaf proof admission with real proofs (to be completed by the Solidity↔TS **differential fuzz** on leaf/node/count-at-apex golden vectors — the named freeze gate).
4. **The one-signature + relayer + resumable claims, concretely** — the kill-and-resume-from-a-different-account step is the sharpest, most-contested property; this proves it or breaks it.
5. **R1 readback** — `extcodecopy` + `isComplete` demonstrates the contract-readability that is A's differentiator over C.

It **excludes** `submitChunkRun`, blobs, promotion, and `attestBlobPublication` — exactly the surfaces the recommendation drops or reserves — so it tests the recommended **minimal spine** and nothing speculative. Cost: one skeleton contract + an SDK harness; a few days.

---

## 6. OPEN QUESTIONS that genuinely need James (values / priorities / economics — not analysis-resolvable)

1. **Permanence-tier trilemma — add an optional signed `minTier` "permanence floor"?** Today the *submitter* chooses the tier, so one signature authorizes but cannot *compel* in-state permanence (a permanence-first mission accepting submitter-chosen permanence + honest grade, vs. binding a floor and losing some transparent-promotion). Recommend the optional field (resolves it per-file); James decides whether it ships in v2 or is deferred.
2. **Manifest-gate the permanent tiers (0/1)?** Pure permissionless pool = maximum neutrality + pre-staging/dedup, **but** unattributed permanent unretractable inscription (CSAM/doxx/leaks in canonical state on every EFS chain) + byte-revocation bypass. Gating restores attribution + erasure-of-pointer for permanent bytes at the cost of some permissionlessness. This is a **credible-neutrality-vs-real-world-liability** call the mission's own "cypherpunk / credibly neutral" end pulls both ways on. I lean **gate permanent tiers, leave ephemeral open** — but it is James's values call.
3. **Fat/thin dial confirmation.** Recommendation is A's Etched sibling `EFSBytes`. Confirm you weight **kernel-guaranteed R1 + stronger from-state reconstruction + single audited verifier** above **absolute-minimum-irreversible-kernel-surface** (contingent on the §5 skeleton compile). If not, C is the considered fallback — but note C's "more permanent" claim is false and its reconstruction is *weaker*, not stronger.
4. **L1 vs L2 as the "SOLID" permanence anchor for LARGE files.** L1 gives the strongest 100-yr permanence but cannot afford GB-scale state; L2/L3 afford it but their *own* century-survival is less certain (an L2 that stops posting takes its SSTORE2 code with it unless reconstructed elsewhere). Which substrate does the "SOLID for 100 years" promise bind to, and is the **LOCKSS cross-chain replication obligation** (the hedge, currently unfunded) in-scope for v2 or a later phase?
5. **Blob-rail trigger.** Confirm the rule "ship tier-3 only when blob bytes are durable (EthStorage-class proof-of-storage / retention change), as a mirror tier." Is EthStorage integration something to spec now as the reserved tier-3 target, or leave tier-3 a pure reservation?

---

## 7. Which v2 Codex docs this touches — additive-now vs new frozen surface

| Codex doc | Change | Kind | Notes |
|---|---|---|---|
| **codex-envelope** | **UNCHANGED** | — | The settled auth core is untouched. The chunk tree reuses `verifyLeaf` discipline with **disjoint** domain constants (`efs.bytes.*` ≠ `efs.kernel.*`). This is the reassuring headline: **the write-authorization design never has to change.** |
| **codex-kinds** | Add the **`chunks` reserved-key row** (DATA parent, PIN, VAL struct, non-interned, **non-side-effecting**) + the `FileManifest` body layout (+ optional signed `minTier` if OQ1 says yes). | **NEW FROZEN SURFACE (Etched), minimal** | One row (13→14). Additive to the reserved-key table; per-row golden vectors + the shared reserved-key enforcement engine. |
| **codex-kernel** | **No new entrypoints, no new kernel storage.** Blesses the **second Etched artifact** (`EFSBytes`) into the doc's reserved "one or two Etched artifacts" slot (amendment 8). | **NEW FROZEN SURFACE (the sibling contract), additive** | The kernel itself is not modified — this is why the EIP-170 pressure C worries about is sidestepped. |
| **read-lens-spec** | Add `BYTES-COMPLETE@{STATE,EPHEMERAL,OFFCHAIN}` / `BYTES-PARTIAL(k,n)` / `BYTES-UNBOUND` / `CONTENT-MISMATCH` + `EPHEMERAL-BYTES` currency flag; 206-for-partial serving; mirror-liveness audit signal. | **DURABLE amendment, additive-now** | Closed-vocabulary expansion → needs a real read-lens revision with vectors (red-team-A minor). |
| **NEW: chunk-bytes spec** (`EFSBytes` contract + chunk-Merkle construction `efs.bytes.*` + `storeId = keccak(DOMAIN, chunksRoot, tier)` + tiers {0,1,2} + tier-3 reserved + golden vectors) | Create | **NEW FROZEN SURFACE (Etched) — the bulk of what's new** | ~200-350 LoC after dropping `submitChunkRun`; own EIP-170 budget + independent external review; canonical via factory + salt + genesis vectors like the kernel. |
| deterministic-ids | Extend with `manifestSlot` / `storeId` derivations | Additive | Client-computable; no mined-tx dependency. |

**Net:** mostly **additive-now** to existing docs, plus **one new frozen surface** (the byte-substrate spec + the `chunks` row). The settled envelope/auth core is untouched.

---

## 8. Freeze gates (before any of this is Etched)

1. **EIP-170 skeleton compile** of `EFSBytes` as a standalone sibling contract (settles the dial) — §5.
2. **CI gas snapshot on a real L2** (tier-0 per-chunk + manifest envelope) supersedes every number in these docs.
3. **Golden vectors + Solidity↔TS differential fuzz** on the chunk-Merkle construction (leaf/node/**count-at-apex**) — the shared crypto core; this is the surface F1 correctly identifies as de-facto permanent, so it gets Etched-grade rigor even though the *store code* around it may be a sibling contract.
4. **Reserved-key `chunks` row golden vectors** + VAL/REF differential fuzz.
5. **Independent external review of `EFSBytes`** as a standalone artifact (with `submitChunkRun` dropped, there is no novel crypto left to review beyond the domain retarget — a deliberate outcome).
6. **read-lens amendment** ratifying the new grade vocabulary with vectors.

---

## 9. One-paragraph verdict

The crypto is settled and shared; there is **no fatal mechanism flaw** in any of the three. **Architecture A is the base** — it is the only option that puts bytes genuinely in state, contract-readable, from-state reconstructible, behind a single audited verifier, which is the mission's own definition of SOLID. Make `EFSBytes` a **sibling Etched contract** (capturing C's don't-fatten-the-kernel instinct without C's verifier-plurality / weaker-reconstruction / read-time-trust costs), **drop `submitChunkRun`** (removing all novel crypto), **adopt B's read-grade + promotion lens** while **reserving the blob rail** until blob bytes are durable, and **borrow C's discipline** (one opaque kernel row, runtime `chunkSize`). Take four things to James that analysis cannot settle: the permanence-tier floor (`minTier`), whether to gate permanent tiers for attribution/erasure, confirmation of the fat/thin dial contingent on the skeleton compile, and the L1-vs-L2 permanence anchor. De-risk it all with **one L2 vertical slice** that signs once, streams tier-0 chunks with a relayer, kills it mid-upload, and finishes from on-chain state with a different account.
