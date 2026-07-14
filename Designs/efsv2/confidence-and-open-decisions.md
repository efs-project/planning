# v2 — Confidence ledger + open decisions (mid-iteration snapshot)

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[README]] (the efsv2 set)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/planning

> **Historical snapshot — not current design authority.** This 2026-07-07 calibration predates the KEL, privacy, filesystem, on-chain-completeness, typed-lens, and cross-chain reconciliation. In particular, `recovered == author`, flat first-attester lenses, KEL-later timing, and native foreign-chain reads do not survive as stated. Start with [[owner-rulings]], [[assumptions-and-requirements]], and [[human-overview]].

## Purpose

We are still iterating. This is a calibration snapshot: **what has survived adversarial review and is safe to build on**, vs **what is genuinely still open** — so we don't re-litigate the settled and don't sleep on the open. Everything here is overturnable with cause, but the high-confidence items form the stable base. Markers: `[verified-in-code]` (executed verification), `[reviewed]` (survived multi-agent red-team), `[ruled]` (James decided), `[needs-measurement]` (pending an experiment, not a decision), `[YOUR CALL]`.

## High confidence (the stable base)

**Substrate & authorship**
- Native kernel, not EAS. `[ruled]` `[reviewed]`
- **One chain-free EIP-712 signature over a Merkle root authorizes an arbitrarily large write; the author is recovered from the signature; anyone relays; individual records/chunks need no per-item signature and are verified incrementally on-chain.** `[verified-in-code]` — the highest-confidence thing in the design (constants recomputed, EIP-712 digest reproduced against a real wallet, Merkle construction fuzzed).
- Deterministic, client-computable, chain-free IDs (`tagId`, `dataId`, …). `[reviewed]`

**Data model**
- Tag-core: **5 record kinds** — TAGDEF, DATA, LIST, PIN, TAG — + ASSERT/REVOKE ops. PROPERTY / MIRROR / REDIRECT / LIST_ENTRY deleted, their enforcement re-homed. `[reviewed]` (3 architects + reconciler + red team + 10-app grounding, none blocked).
- PIN (cardinality-1) and TAG (cardinality-N) stay **separate** kinds; DATA is **owned** (author+salt, unforgeable) while tags/paths are **unowned** (shared Schelling points). `[reviewed]`
- **A file's identity is its DATA record, not its bytes.** On-chain and off-chain files are equally real. Identity is never content-derived (ADR-0049 preserved). `[reviewed]`

**Storage & integrity**
- One file → many mirrors. On-chain bytes are **kernel-verified** against the signed `chunksRoot`; IPFS/Arweave bytes are **transport-verified** by the CID (its own Merkle DAG); HTTPS bytes are a **claim only**. `[reviewed]`
- Large on-chain files: manifest + proof-streamed bytes to an `EFSBytes` contract, **resumable from on-chain state by anyone**. `[reviewed]` (no fatal in the core).
- Ship **tier 0** (state, contract-readable) + **tier 2** (calldata, cheap) + off-chain mirrors; **tier 1 and the blob tier are reserved, not shipped.** `[reviewed]`
- Portability = **replication** (copy records+bytes to another chain, read natively), not cross-chain proofs. `[reviewed]`

**Trust & reads**
- Lenses (per-viewer trust; first-attester-wins) + normative read grades (**proven-absent vs unknown** — never resolve missing data as no-claim). `[reviewed]`
- **No portable cross-chain "currency"** (is-this-latest/revoked); apps use author-set **expiry** for safety-critical data. `[reviewed]` (every full-currency mechanism died under red team).

**Identity**
- Bare-EOA first-class in v2; KEL / passkey / post-quantum succession **reserved** (formats frozen, machinery not built). `[reviewed]`

**Process**
- The **Codex** = the frozen Etched rulebook, self-hosted at genesis; Durable/SDK layers kept out so they can improve. Freeze requires golden vectors + independent external review + the EIP-170 skeleton compile. `[reviewed]`

## Pending measurement (not decisions — just need an experiment before freeze)

- All gas numbers → a real-L2 CI snapshot. `[needs-measurement]`
- Whether `EFSBytes` fits as one Etched contract → the EIP-170 skeleton compile (~a day). `[needs-measurement]`
- Exact reserved-key table rows + golden vectors; the ~2,300–2,900 LoC / schedule estimate. `[needs-measurement]`

## Storage/uploads decisions — RULED (James, 2026-07-07)

Full reasoning in [[large-file-uploads]] "James rulings". Summary:

1. **`contractReadable` floor — ADOPTED (renamed from `minTier`).** `[ruled]` Optional boolean; a capability floor (not a tier number) requiring bytes stored on-chain, contract-readable; read-enforced (file isn't `COMPLETE` until met). Names the non-substitutable property (contract-readability is on-chain-only; permanence is approximable off-chain). *"Replace properties with forced-on-chain DATA" — resolved not to merge: v2 already deleted the PROPERTY kind; the split is principled (content-address the verifiable, owner-address the unverifiable).*
2. **Fully permissionless byte pool — RULED, no gating.** `[ruled]` Anyone can write anything; nobody controls EFS. Protocol stays neutral; filtering is edge-only (lenses for readers/gateways, operator choice for nodes). Simplifies the design.
3. **Frozen `EFSBytes`, dev-upgradeable → mainnet-immutable — RULED.** `[ruled]` The existing burn-to-immutable pattern (ADR-0048). EIP-170 = 24 KB code limit; the compile test just confirms it fits, not a values call.
4. **L2/L3-first, L1 for exceptional — RULED.** `[ruled]` On-chain *bytes* target L2/L3; records/identity are chain-free. *Correction: replication's **mechanism** is not reserved — it falls out of author-from-signature + chain-free IDs (re-submit records, re-store on-chain bytes, off-chain mirrors travel free). Deferred = replicator **tooling**/LOCKSS guarantees + cross-chain **currency** (the honest limit). The portability **validation** (conformance harness) is unrun and is the highest-value cheap experiment.*
5. **Reserve blob tier — RULED (A).** `[ruled]`

## Still open (broader v2 freeze-time, not this thread)

The v2 freeze-time ratifications in [[freeze-gates]] §A (checkpoint reading, kernel state costs, the ~2030 KEL deadline, schedule re-plan, SDK fail-closed default, string-only scope) — for when the whole design approaches freeze, not now.

## Pre-promotion checklist

- [ ] Snapshot re-calibrated after the next round of iteration (this doc is a moving target by design)
- [ ] At least one round of `#status/review` with another agent or human comment
