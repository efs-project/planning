# 2026-07-10 — On-chain completeness audit

**Context:** After the backlink regression finding ([[onchain-graph-queries]]), James ruled: all core functionality must work on-chain, no dependence on The Graph, every off-chain deferral explicit + signed off. This pass audited **every** core capability against that rule. Deliverable: [[onchain-completeness]]. Corpus (9 files): `planning/Reviews/2026-07-10-onchain-audit-corpus/`.

**Method:** 6 domain auditors (graph queries, filesystem ops, read/lens resolution, identity/content, the durability/events axis, the full keep/demote re-audit — each verifying against v1 code file:line and v2 docs §) → 2 red teams (attack the "on-chain" claims; attack the "off-chain is fine" rulings) → completeness critic. Four auditors hit the structured-output cap on *return* but their files were written intact; the critic worked from files.

## Headline results

- **The point-read core is genuinely, strongly on-chain** — every basic FS/identity/currency op a contract is handed a key for (path resolve, getSlot, isRevoked, getValue, containment, membership, single deny/act check, web3:// byte serving) is Tier 1, matching or exceeding v1. Half the mission is delivered.
- **The reverse/enumeration/count layer is on-chain-*durable* but not on-chain-*queryable* as specced.** The audit's central conceptual advance: "on-chain" is three axes — **durability** (survives EIP-4444 pruning; the spine handles it), **queryability** (a bounded reader answers from a *keyed index*, not a 100-year scan), **composability** (a contract answers in bounded gas). The keep/demote line conflated them — it marked demoted indices "spine-recoverable" and read that as complete, when it only means durable. **"Recover it by scanning all of history" and "trust The Graph" differ only in who you trust, not in cost.**
- **The deep structural defect (the headline freeze change):** the reverse-index postings word carries the *target* but **no predicate (`definitionId`) and no revocation bit.** So even restoring the backlink index leaves predicate-filtered reverse queries O(all-postings-at-X) and live counts attacker-inflatable — exactly the queries contracts most want. The word must be redesigned before freeze.
- **Five confirmed regressions** (v1 on-chain → v2 dropped): general backlink, predicate-filtered reverse (deepest, under-priced), address-target backlink, best-of-N mirror ranking (a direct hit on the no-infra web3:// pitch — and the state to fix it is *already kept*), self-enumeration (mis-labeled "analytics"; it's account recovery). Plus two now-or-never gaps v1 never had (LIST reverse-membership, REDIRECT cited-by).
- **The contingency cascade** both red teams flagged: on every open freeze item, the gas-cheapest do-nothing is the Tier-3 outcome — so under budget-silence EFS ships needing The Graph for backlinks, directory listing, self-restore, list-membership, cited-by, and currency gating. The fix is to price the whole reverse/index/spine bundle as **one gas snapshot** and sign the aggregate.

## The deliverable

[[onchain-completeness]] carries: the three-axis model, the full capability×tier matrix (strong core / contested reverse / analytics), **the explicit 18-item James sign-off list** (11 must-fix-or-conditional, 5 legit-defer, 2 meta-gates), the corrected keep/demote line, the 5 regressions, and **The Line** (the crisp on-chain/off-chain rule). Threaded into fs-pass-freeze-reservations (B4 redesign, B5 reopen) and fs-pass-synthesis / onchain-graph-queries.

## What needs James

The 18-item sign-off list, delivered as ONE gas bundle (full-body spine + a predicate-carrying, address/list/redirect/author-keyed, revocation-aware reverse index). The two meta-gates — full-body spine (not objects-only) and no-body-elision as an Etched invariant — sit under everything and must be explicit signatures, never budget defaults.
