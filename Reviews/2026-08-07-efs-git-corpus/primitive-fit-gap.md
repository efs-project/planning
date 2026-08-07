# EFS Git — current-primitive fit/gap analysis

**Status:** deep-dive analysis, 2026-08-07. Maps every capability the Git workload needs onto the current v2 primitive set (five-kind tag-core + envelope + authority lane + lens family + clientv2 surfaces), and names the genuine gaps. Verdict up front: **the generic substrate expresses this workload; no Git-shaped kernel surface is needed.** The gaps are profile/SDK/client work plus two riders on already-open decision/evidence items.

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git

## 1. Capability-by-capability map

| Git workload need | v2 primitive that supplies it | Fit | Residual gap |
|---|---|---|---|
| Stable repository identity | owner+salt DATA identity ([[codex-kinds]]; [[deterministic-ids]] math) | **native** | none — `GitRepoGenesisV1` is an ordinary DATA body |
| Repo naming/discovery | PINs, folders, `describe`, ENS bindings, petnames | **native** | none; discovery ≠ authority already ruled |
| Mutable ref state | per-author cardinality-1 claims under a shared key-anchor + the mandatory cross-author indexes; per-author supersession chains (`priorClaimId` read ABI) | **fits, with the shape named honestly** — slots are author-scoped, so canonical heads are always a profile-derived multi-author read; `getSlot` never answers "current head" and generic surfaces render ref claims as opaque profile data | full CAS/ordering semantics are the `GIT-REF/1` profile (state-model §4) — GATE/1-scale spec work, not a free ride on LWW |
| Atomic multi-ref transaction | envelope batch atomicity (single-revert scope) + profile-level transaction commitments (`txnRoot`/`refCount`) for the subset-carried case | **native + two body fields** (E4) | fold treats txn completeness as an applicability precondition (state-model §4) |
| Replay-resistant ordering | authority-lane admission ordinals + first-authoritative-admission rule + receipts ([[kel]] §8), plus in-claim predecessor witnesses and transaction commitments (profile fields) | **native if P-1 adopts** | **rider on P-1**; predecessor/txn fields are profile body content, not kernel surface |
| Maintainer sets / branch protection | Roster + Plan + THRESHOLD combiner + policy epoch ([[lens-spec]] §2–3) | **strong fit** | a `GIT-REF/1` profile must be specified (new profile in the LP-1 family, like GATE/1 — profiles are the *intended* extension point) |
| Force-push audit + recovery | slot supersession history + full-body spine + retention rule over containers | **native + one policy** | retention rule (P-G5) is placement-layer policy, not kernel |
| Object storage | placement tier: mirrors reserved key, Arweave/EthStorage/HTTP adapters, [[large-file-uploads]] machinery | **native direction** | container/closure conventions (storage doc); adapters are SDK work |
| Content-hash lookup | adopted `contentHash → file` index (owner ruling item 13) | **native** | LFS oids are sha256 — direct fit |
| Anonymous fast reads | four-rung guest ladder G0→G1→G2→G3, LP-5 G1 default; deep-link resolver (clientv2 #1) | **designed** (G1 verifies page authorship/bytes; currency/completeness need G2+ or attestations) | AMBIENT/1 is owed (CR-3) and this workload now *also* blocks on it — pressure, not new surface |
| Draft→publish honesty | journal/outbox/pending ladder ([[persistence-and-sync]] D4) | **exact fit** | commit/publish states map onto existing ladder vocabulary; no new states needed (wiki doc §3) |
| Page identity across renames | DATA identity + `movedTo` redirect rows | **native** (E11 shows Git cannot do this) | sidecar convention text |
| Proposals/reviews/releases | ordinary claims + the portable-schemas pass's descriptor work | **fits the neighboring pass's interface** | minimal object set defined here (wiki doc §6); schemas ride that pass, not this one |
| Agent Skill releases + capability diff | GATE/1 profile (LP-6), install ceremony, capability-diff install ledger (clientv2 #6) | **designed** | release-claim convention binding (repoId, commit, manifest hash) |
| Walk-away export | `.efs-bundle` (delegated normative spec, "walk-away vehicle") + Git bundles (E1/E2) | **converging** | the Git profile of `.efs-bundle` must be an input to that delegated spec |
| Read-only mount | [[mountable-filesystem-semantics]] | **compatible** | published workspace state projects; working trees stay client-local (they are Tier-B journal state) |
| Local/offline mode | P-11 chain-free mode + rung labels | **designed** | degraded fold rungs (state-model §4) |

## 2. The five kinds are sufficient — spot-check

- **Genesis/descriptor** → DATA. **Refs** → per-author cardinality-1 claims under `(repoId, refName)` key-anchor TAGDEFs, folded across authors by the profile. **Proposals/reviews** → claims targeting the proposal ref + DATA bodies. **Releases** → claims with VAL/REF rows binding OIDs and manifest hashes. **Vocabulary** (`efs.git/*` keys: `policy`, `checkpoint`, `proposal`, `release`, `mergeOf`) → user-key TAGDEFs in the conventions registry — the registry the fs-pass already commissioned. Nothing needs a sixth kind; nothing needs a reserved genesis row (no `efs.git/*` key requires kernel enforcement — all semantics are read-side profile rules, exactly where [[fs-pass-synthesis]] puts schema).

## 3. Genuine gaps (all non-kernel)

| # | Gap | Owner | Class |
|---|---|---|---|
| G-1 | `GIT-REF/1` profile spec: the deterministic fold, typed vocabulary, applicability rules, degraded rungs, vectors | lens-family profile work (post-LP-1) | Durable spec |
| G-2 | Closure-manifest + container conventions (`ClosureManifestV1`, checkpoint cadence, retention rule) | SDK/placement + conventions registry | Durable spec |
| G-3 | Gateway reference implementation: smart-HTTP v2 + `receive-pack` intake → outbox → reconciliation (`update-ref --stdin`, E5); rebuildable-cache discipline | new component (the one substantial build) | software |
| G-4 | Stock-push credential ceremony (SSH/token ↔ actor grant / pending-signature outbox) | SDK/client | Durable UX |
| G-5 | ed25519 actor suite (would let SSH keys *be* actor keys) | KEL rider — flag, don't assume | KEL decision input |
| G-6 | Ref-claim admission cost at wiki cadence | E2 rider (gas snapshot fixture: N-page publish envelope) | evidence |
| G-7 | Browser-side Git limits (phones, big histories) | prototype evidence (prior-art lane + spike) | evidence |
| G-8 | Two-device same-author `seq` collision applies to ref claims | already-filed protocol gap ([[persistence-and-sync]] OQ-1) — Git adds a concrete fixture | existing gap, new fixture |
| G-9 | Derived-head attestation convention (`refs/efs/attest` + signed fold-state claims): bounds fold reader cost, gives G1/stock readers a spot-checkable currency hint | SDK/gateway convention + conventions registry | Durable spec |

## 4. What EFS uniquely contributes (the differentiation sentence, tested)

Against every layer of the kickoff's candidate differentiation:

- *Git supplies native objects and revision mechanics* — confirmed; reuse wholesale (E1–E5, E9–E10).
- *Storage networks retain bytes* — confirmed; EthStorage/Arweave/HTTP behind adapters ([[2026-08-05-ethstorage-deep-dive]] boundary).
- *EFS supplies portable repository identity* — no surveyed system has host-independent repo identity + rotatable authority (Radicle's RID comes closest but binds to its delegate set and network; GoE binds to a contract address).
- *…evolving authority* — KEL rotation/recovery/org succession is beyond every forge surveyed.
- *…authenticated ref history* — Git itself cannot (E6); forges keep it privately; Radicle signs current state, and its replay incident shows why an external total order matters.
- *…storage-placement evidence* — closure-before-advertise + container digests + mirror claims; GoE's two named defects (mutable pack keys, no closure proof) are exactly this layer missing.
- *…plural recovery + reader policy* — per-author claim preservation + policy-derived heads = Radicle-style plural views with lens-grade policy typing.
- *…clean exit* — Git bundle + `.efs-bundle` sidecar, rebuildable gateways.

The sentence survives. The one place it would *collapse* (per the EthStorage review's warning): if an "EFS repo" were just an EthStorage key + branded UI. The state model prevents that by construction — every EthStorage-specific value lives in replaceable placement receipts.

Two free alignments the lanes surfaced: EFS-hosted commits/trees/blobs are already valid **SWHIDs** (ISO/IEC 18670:2025 hashes git-identically), so citation interop and a Software Heritage cold backstop cost nothing; and the market is moving toward this shape — Block's **Buzz** (July 2026) ships git-on-nostr with exactly the "signed history survives the host" pitch, on a weaker ordering/identity substrate than EFS has ([prior-art/nostr-and-p2p-git](./prior-art/nostr-and-p2p-git.md) §3).
