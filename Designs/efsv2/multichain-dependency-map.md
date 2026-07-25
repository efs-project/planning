# EFS v2 — Multi-chain requirements + use-case dependency map

**Status:** draft — deliverable 3 of the 2026-07-25 joined pass
**Target repos:** planning
**Depends on:** [[joined-pass-synthesis]], [[owner-decision-inbox]]
**Base text:** [use-cases §5](../../Reviews/2026-07-25-joined-fs-pass-corpus/use-cases.md) (the tagged requirements register) as verified and amended by [critic §5](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)
**Last touched:** 2026-07-25

#status/draft #kind/design #repo/planning #topic/efsv2

The register tags every requirement by capability axis (portable-artifact / authority / query-completeness / byte-availability / contract-readability / host-projection) and locality (LOCAL-OK / CHAIN / XCHAIN). This map is the roll-up James asked for: what forces cross-chain machinery, what the L1 pointer would actually serve, and what local-only mode loses.

## 1. What forces the L1 pointer — verified: nothing at MUST grade

The claim "no MUST-grade requirement forces cross-chain machinery" was independently attacked by the authority lane and **stood** ([critic §5](../../Reviews/2026-07-25-joined-fs-pass-corpus/critic.md)). The pointer's only real consumers, with the critic's three amendments applied:

| Consumer | Grade | Notes |
|---|---|---|
| Movable-home topology (per-principal homes) | conditional — constitutive | Only exists if [[owner-decision-inbox]] P-5 chooses a movable-home arm; under the recommended fixed/genesis-committed arm **nothing forces the pointer** — its one surviving consumer is the NICE-grade merged-view bootstrap in row 3 (hint convention first; A5c write-once pointer only as fallback). |
| The re-home promise | conditional | = P-5's b-arms. **Corrected (D-4): even then the pointer serves voluntary venue switching only — it cannot deliver censorship escape** (re-homing starts with an admission at the censoring home). |
| Merged multi-realm view *bootstrap discovery* | NICE | **Stronger than first mapped (D-3):** a genesis-committed home is checkable from the principal word, never extractable from it — so un-hinted discovery for a merged view is a real NICE-grade consumer, served by the digest-checkable hint convention first and the write-once A5c pointer only as fallback. |
| Censorship escape | — | **Removed from every justification column (D-4).** |

**Free capability, not machinery (D-5):** rollup pairs sharing L1 settlement already have a verifiable coarse cross-realm existence/freshness bound (batch-commitment ordering) — available without any pointer; sovereign pairs remain heuristic-only.

## 2. What depends on cross-chain machinery

- **R-XC1 (read a foreign drive):** client-side composition — mount two drives side by side; no protocol machinery.
- **R-XC2 (replicate evidence to another chain):** mechanically trivial — chain-free envelopes re-submit anywhere; replicated copies stay labeled AS-OF. (Citing across drives rides R-XC1 + the five-part view identity in [[joined-pass-synthesis]] JR-6.)
- **R-CR4 (foreign contract consumes EFS authority):** deferred with **zero forcing cases** — explicit adapters/pinned commitments when a consumer appears ([[owner-decision-inbox]] P-3).
- **R-AU8 / R-XC3 (same principal authoritative on several realms):** topology-dependent — only the movable/multi-home arms need it; realm-qualified authority (R-K11, elevated) is the invariant under every arm.

## 3. What local-only mode loses — the ten structural losses

From [local-mode §6](../../Reviews/2026-07-25-joined-fs-pass-corpus/local-mode.md), verified against [[ethereum-first-efs-and-os#6. Does the OS work without blockchain?]]: the register's L1–L10 — freshness · completeness/absence (the fourth absence source narrows this to signer-trust grade; venue-grade closure still needs a chain) · canonical order · strong-grade backdating rejection · contract composability · permissionless durability · neutral admission · discovery · revocation-aware live counts · permissionless completion — **plus the ledger's added row: schema/shape verification as enforcement** (locally it is per-basis testimony only; nothing forces the next writer). Each row in the lane file carries the structural why + the cheapest upgrade rung. The flip side — what only on-chain EFS provides — is the product story: local = sovereign, free, private; on-chain = shared, composable, strong.

## 4. Register holes owed (critic §5)

- H1: add the **promotion-across-revocation** row (journey (c) × (d) intersection; the D-1 rule).
- H2: add the **bare→KEL identity-continuity** rider to R-AU2 (in-place upgrade preserves the word; fresh principal = new namespace + redirect).
- H3: the row-by-row byte-check of the register against [[assumptions-and-requirements]] §4 (classification-level check done; row-level owed).

## Open questions

- [ ] None owner-facing — P-5 and P-3 in [[owner-decision-inbox]] are where the conditional rows above get decided.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] H1/H2/H3 landed in the register
- [ ] At least one round of `#status/review` with another agent or human comment
