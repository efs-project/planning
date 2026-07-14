# EFS v2 — Owner rulings & notes (James)

**Status:** running notes — decisions/directions, NOT designs. Append-only, dated. The design docs get updated to match separately.
**Last touched:** 2026-07-10

#status/notes #kind/notes

## 2026-07-10

### Simplifying assumption: chains don't die
- **ADOPTED (James): assume a blockchain persists indefinitely and stays queryable.** The design has been carrying a lot of dead-chain hedging; drop it.
- **Apply surgically — DROP these (chain-death machinery):** year-100 "verify offline from dead-chain headers" procedures; the dead-chain fire drill *as a survival gate*; chain-mortality tiers; checkpoint-recency framed as death-insurance; any "graded/UNKNOWN after the home chain is gone" language. Removing these makes identity and currency more *definite* (you can always query the authoritative home chain).
- **KEEP — these mention chains but for OTHER reasons, not death:**
  - **Cross-chain replication / portability** — motivated by **reach + composability** (copy data to the chain where a reader/contract lives, e.g. a new L3), *not* survival. Still wanted. Cross-chain copies remain best-effort snapshots; authoritative reads go to the home chain (which now always exists — simpler).
  - **Full-body spine + no-body-elision (Etched)** — addresses **history/log pruning** (EIP-4444: chain lives, prunes logs) and possible **state-expiry**, which are separate from chain death. Keep — it's cheap insurance, and "state persists forever" is a stronger bet than "chain persists forever." James is optimistic Ethereum solves state-rent/pruned-data-availability; treat that as upside, don't *depend* on it.
- **NET effect:** KEL and currency simplify most — "home-chain-authoritative + home chain always queryable" ⇒ "is key K current for I / is claim R revoked" is a definite on-demand read, not a cross-chain freshness nightmare.
- **Follow-up (cleanup, not now):** sweep the docs (read-lens-spec, identity, ops-doctrine, codex-*) and strip dead-chain hedging language; keep the pruning/reach justifications. Do NOT do this as design work — it's an editorial pass.

### KEL — design it
- **Ruling: YES, design it.** Bare-EOA stays the day-one identity; KEL is the upgrade path (rotation, recovery, delegation, session keys, personas, org/DAO, PQ).
- **Strategic fork ruled: home-chain-authoritative + graded elsewhere** (mirrors the revocation stance; now even cleaner under chains-don't-die).
- **Discipline: run as a major adversarial track** (independent designers + dedicated crypto red-team + external review before any Etched freeze). The risk is a rushed freeze, not the decision. No schedule pressure — take the time.
- Downsides acknowledged: highest-blast-radius subsystem; reference impls (KERI/Holochain) are immature; recovery UX is a general open problem. Accepted.

### Lenses — focused pass (likely Codex)
- **Concern (James): scale.** Realistic user = ~12 own keys + ~40 friends = **50+ attesters in one lens, resolved on every directory listing.** Fear: naive first-attester-wins is O(entries × attesters) and breaks; and we over-depend on lenses (most-cited, least-tested mechanism).
- **Concrete conflict:** MAX_LENSES = 20 (ADR-0026-era) vs. the 50+ target. Revisit.
- **Ready now**, runs in parallel with privacy. Assume **stable (KEL-style) identities** per lens entry, not raw keys. Key deliverable: the **lens-object canonical encoding** (unwritten; also what lets "what I see" survive device loss).

### Public-by-default + sensitivity policy layer
- **Ruling: public by default** (network effects, shared feel). Private only for items classed **sensitive** or where the user **opts in**.
- **New named deliverable: a "sensitivity policy layer"** — OS/app declares which record-classes/paths are sensitive-by-default (credentials, private messages, health, drafts, admin config); everything else born public; sensitive folders make children sensitive by inheritance; a "make private" action for opt-in. **Client/OS convention, iterable, NOT freeze-bound.** The classifier's defaults are the tuning knob between "viral/shared" and "safe."
- **Action:** fold into the in-flight privacy pass as a named subsystem, not a footnote.

### Storage
- **Direction (James):** on-chain (durable) + Arweave (permanent off-chain) now; possible Filecoin grant for IPFS pinning; bet that bigger on-chain files become normal within ~a decade.
- **Notes:** keep the design **size-agnostic** (it is — MIRROR is transport+URI; CREATE2 chunk recipe scales); **don't design *depending* on future scaling** (the full-body spine already hedges pruning). Durability tiering: **on-chain > Arweave > grant-pinned IPFS > volunteer IPFS** (IPFS pinning decays when grants lapse; Arweave's pay-once endowment is the more durable off-chain bet). Later (convention, not freeze-bound): a durability-labeling + mirror-health ("are my mirrors alive?") convention.

### In-flight / status pointers
- Privacy pass: **launched.** On-chain-completeness bundle: **freeze-gates decision 9** (one priced gas-bundle; recommend accept). Lens pass: **prompt ready** (below / handed to Codex).
