---
title: SDK minimal-clicks (batched single-signature writes)
status: active
tags: [status/review, sdk, ux, contracts-coordination]
related: [[sdk-architecture]]
target-repos: [sdk, contracts]
last-touched: 2026-06-18
---

# SDK minimal-clicks: one-signature EFS writes

> Sub-investigation of [[sdk-architecture]]. **Goal:** a single logical EFS write (create/pin a file) should cost the end user **one wallet click**, ideally on a plain MetaMask EOA — not ~8. This page establishes whether a viable path exists with no obvious blocker, and produces a concrete ask for the schema-freeze dev (time-sensitive against the Sepolia freeze).

## Update 2026-06-18 — freeze landed; one click is the target (greenlit)

Two things changed since the 2026-06-10 verdict below, which **reopens and overturns its "2 clicks is the floor / no contracts ask" conclusion**:

1. **The schema freeze landed** (contracts `21b737c`): the canonical 9-schema set is fixed (incl. the reshaped empty DATA per ADR-0049 and the new REDIRECT). The write graph is now stable to design against — see *The write steps* below.
2. **James (2026-06-18) greenlit a contracts change and restated the attester rule:** improve write UX *as long as the attester stays the user's wallet or the third-party app's contract* (lenses key on the attester). A contracts change is explicitly on the table.

**New verdict: one signature IS achievable with attester = the user, and without reopening any frozen schema** — via an on-chain *write routine* (the long-scaffolded `EFSWriter`/`EFSLib`, today empty stubs) that threads the real mined UIDs in-memory **inside the user's own call context** (an EIP-7702 / ERC-4337 smart account, or a third-party app contract). It's the `SystemAccount.bootstrap` pattern, run *as the user* instead of as a system relay.

This does **not** contradict the rejections below — it is a third path they didn't consider:
- It is **not** *self-placing DATA* (still rejected: reopens ADR-0049, and MIRROR still needs the DATA UID).
- It is **not** a *shared gateway* (still rejected: a shared contract as attester collapses identities / breaks lenses). The routine runs **as the user** — `msg.sender` at each `eas.attest` is the user's own account/app contract, so EAS records the user as attester. The 2026-06-10 analysis already endorsed smart-accounts-as-attester for *identity*; this connects that to *one-click writes*.
- It does **not** rely on off-chain UID prediction (fragile — EAS folds `block.timestamp`+bump into every UID); the routine reads each real UID on-chain mid-transaction.

**Tier 1 below (SDK-only, ~2–3 clicks, any wallet incl. plain MetaMask) remains the fallback** for wallets without 7702/5792.

## Why this matters

Fewer clicks is a top product priority (James, 2026-06-10). The SDK owns the UX work. This may require a small contract/resolver affordance, so it must be settled **while the schema-freeze dev is reshaping resolvers** — not after the burn.

## The verified crux

EAS computes each attestation's UID from fields that include `attestation.time` = `block.timestamp` (`@ethereum-attestation-service/eas-contracts/contracts/EAS.sol:697–709`, the `_getUID` function). **A UID therefore cannot be known until the tx is mined.**

Consequence: if attestation **B** in a single logical write must carry attestation **A**'s UID in its `refUID`, and both are created in the same write, then B cannot be signed in the same batch as A (A's UID is unknowable at signing time). That forces sequential transactions = multiple clicks.

- **One signature is possible** via a single `EAS.multiAttest` tx (many attestations, one approval, **works on plain MetaMask** — no EIP-5792/4337 required) **IF** the write contains no intra-batch UID-refUID dependency.
- EFS anchors are **path-derived `bytes32`** (ADR-0030), so references *to anchors* are likely already predictable (computable client-side, no UID needed). The suspect edges are content/placement links like **DATA → PIN**.

**So the whole question reduces to:** can a single EFS write be expressed as N attestations whose cross-references are all *predictable* ids (path/content-derived), with **zero** intra-batch UID-refUID? If yes → one `multiAttest` → one click. If a few edges genuinely need a UID-refUID, what is the minimal resolver/schema affordance that removes them?

## Investigation (2026-06-10, 3-agent deep pass against real source)

**Verdict (validated 2026-06-10): 8 clicks → ~2–3, SDK-only, zero contract change. This is the floor.** One-click was investigated (self-placing DATA) and **rejected** — MIRROR→DATA must stay UID-static, and the change would reopen an Etched ADR (0049). **No schema-freeze dependency for click-reduction.**

### The real write graph (steady-state, source: `CreateItemModal.tsx::handleSubmit` File branch + `EFSIndexer.sol` + `EdgeResolver.sol`)

A single file write is ~8 attestations. Key correction to an earlier assumption: **anchors are NOT path-derived.** An anchor's id is the **EAS attestation UID** stored under `_nameToAnchor[parent][name][schema] = attestation.uid` (`EFSIndexer.sol:401`), and that UID embeds `block.timestamp` (`EAS.sol:704`). So *nothing* in a write has a client-computable id ahead of mining.

Dependency DAG (→ = "references by mined UID"):

```
DATA (B, refUID 0x0) ──▶ contentType-key-ANCHOR (C) ──▶ property-binding-PIN (E ──▶ also PROPERTY D)
DATA (B) ──▶ MIRROR (F)
DATA (B) ──▶ placement-PIN (G ──▶ also file-ANCHOR A)
PROPERTY (D, refUID 0x0) ──▶ E
```

**DATA's UID is the hub** — MIRROR, placement-PIN, and the contentType chain all reference it by mined UID. The chain `B → C → E` is **3 layers deep**; a minimal file (DATA + placement + mirror, no contentType) is **2 deep**.

### Why one client-side `multiAttest` can't do it today

EAS *does* let a later attestation in a `multiAttest` reference an earlier one in the same call — each is written to `_db` before the next is processed (`EAS.sol:465`), and the existence check (`EAS.sol:467-471`, mirrored at `EdgeResolver.sol:209-211`) passes. **The only blocker is sign-time:** to put DATA's UID into the placement-PIN's `refUID` *calldata you sign*, you must know it — but the UID hashes `block.timestamp` (+ a collision `bump`), unknowable until mined. One signature commits to fixed calldata, so a same-batch forward reference can't be filled in.

→ **The signature floor without a contract change = the DAG depth (~2–3), not 1.** Within a layer everything is independent; across layers you must serialize because layer N+1's calldata needs layer N's mined UIDs.

### ❌ The trap to avoid

The in-code `EFSUploadGateway` "batch-wrapper" idea (a contract that mints DATA, captures the UID in memory, threads it into the dependent PINs) **makes the gateway `msg.sender`/attester** (`EAS.sol:149`) — collapsing every user into one identity and breaking lenses/cardinality-1 PINs. It is the same attribution bug from Q5. Delegated attestation (`multiAttestByDelegation`) keeps the user as attester but costs **one signature per attestation** — no win. So neither rescues one-click. Rule it out.

## The two viable tiers

**Tier 1 — ~2–3 clicks, ships now, no contract change, any wallet (incl. plain MetaMask).** The SDK serializes the write into one `multiAttest` per DAG layer: layer 0 (DATA, PROPERTY, independent anchors) → read mined UIDs from the receipt → layer 1 (MIRROR, placement-PIN, key-anchor) → layer 2 (property-binding-PIN). The user clicks once per layer. **8 → 2 for a minimal file, 8 → 3 with contentType metadata.** User stays attester throughout. This is the beta default.

**Tier 2 — 1 click. Correctness guardrail (James, 2026-06-10): do NOT get here by coordinate-resolving static links.** The DATA-binding edges (MIRROR→DATA, placement PIN→DATA) are *semantically static* — they mean "these exact bytes," and pointing them at a path would be silent corruption the moment the data changes (see the static-vs-dynamic rule in [[sdk-architecture]] §5). So the earlier "resolve edges by path-coordinate" framing is **rejected for these edges** — it would invite that bug. **2 clicks is the principled floor for the current write shape**, because anything binding to DATA's specific bytes must reference DATA's UID, which exists only after minting.

### One-click was investigated and rejected — 2 clicks is the floor (validated 2026-06-10)

> **Superseded by the 2026-06-18 update above.** The rejection here is scoped to *self-placing DATA* and *shared gateways* — both still correctly rejected. One click via the **user-context `EFSWriter` routine** (a smart account / app contract running the threading routine as the user) is now the target. The reasoning below remains valid for the two forms it actually rejected.

The candidate 1-click route was **self-placing DATA** (fold "these bytes" + "they live here" into one attestation, removing the forward UID reference). A validation pass against the frozen contracts found it **NOT-VIABLE**, for two independent reasons:

1. **MIRROR re-introduces the blocker regardless.** `MirrorResolver.onAttest` requires its `refUID` to resolve to a DATA attestation of `DATA_SCHEMA_UID` (`MirrorResolver.sol:110,115`) — mirror→DATA is UID-static by the correctness rule (it means "these *exact* bytes"). So even with self-placing DATA, any write that includes a mirror still needs DATA's mined UID → still ≥2 signatures.
2. **It would reopen an Etched invariant.** Welding placement into DATA overturns ADR-0049's "DATA is pure identity" and destroys DATA's path-agnostic hardlink property ("multiple paths can reference the same DATA"). That's a Tier-1 ADR reversal to save *one* signature versus a plain two-`multiAttest` batch that needs zero frozen-surface changes.

**Conclusion: there is no cheap one-click win, and therefore no time-sensitive ask for the schema-freeze dev.** The pragmatic floor is **Tier 1, ~2–3 clicks, SDK-only, no contract change.** True intrinsic-placement is filed as **post-burn FUTURE_WORK** if UX data ever justifies reopening it.

### Write-through identity contract — rejected (folds into smart accounts)

The "contract that lets keys on a list write through it" was validated adversarially and **does not hold up as an identity primitive**: resolving "contract → user" via membership is only injective when the contract is *per-user* — and a per-user contract that attests under its own address **is just a smart account**, which EAS already records as the attester natively (via ERC-1271). A *shared* (team/DAO) contract is non-injective (many users list it → its writes are unattributable) and collides on cardinality-1 PINs. ERC-4337 + ERC-7579 SmartSessions already deliver "many keys, one identity, scoped batched writes" better. **The genuine team/shared case is a different thing — a *shared content space*: an org list/lens whose members each attest under their *own* address, aggregated at read time** (which is exactly EFS's existing lens/`webOfTrust[]` model — no new primitive).

## The write steps (frozen-schema attestation graph)

One logical "save this file" = ~13 attestations across 6 frozen schemas in a 4-layer dependency DAG. **Both the SDK serializer (Tier 1) and the on-chain routine (Tier 2) build the *same* graph** — they differ only in how UIDs are threaded (across txs vs. in-memory in one tx).

**Pre-existing (resolve before building; never authored per-write):** the parent folder ANCHOR, the `/transports/<scheme>` transport anchor (for MIRROR), the 9 schema UIDs, and any missing parent path nodes (`mkdir -p`).

| # | Layer | Attestation | Schema (frozen field string) | refUID | revocable | fresh references |
|---|---|---|---|---|---|---|
| 1 | L1 | DATA | `''` (empty) | `0x0` | false | — (the content-identity hub) |
| 2 | L2 | file-ANCHOR | ANCHOR `string name, bytes32 forSchema` | parent folder anchor (pre-existing) | false | — |
| 3 | L2 | MIRROR | `bytes32 transportDefinition, string uri` | **DATA** | true | DATA; `transportDefinition` = pre-existing `/transports/*` |
| 4 | L2 | key-ANCHOR ×N | ANCHOR | **DATA** | false | DATA (one per reserved key: contentType, contentHash, size) |
| 5 | L2 | PROPERTY ×N | `string value` | `0x0` | false | — (interned value; one per key) |
| 6 | L3 | placement-PIN | PIN `bytes32 definition` | **DATA** | true | `definition` = **file-ANCHOR**; refUID = **DATA** |
| 7 | L3 | binding-PIN ×N | PIN `bytes32 definition` | **PROPERTY** | true | `definition` = **key-ANCHOR**; refUID = **PROPERTY** |
| 8 | L3 | visibility-TAG ×M | TAG `bytes32 definition, int256 weight` | pre-existing ancestor | true | one per uncovered ancestor folder |

`recipient = 0`, `expirationTime = 0`, `value = 0` throughout. The L3 PINs are the deepest edges because each references **two** fresh L2 siblings at once (an anchor as `definition`, a DATA/PROPERTY as `refUID`).

**Frozen `onAttest` constraints to honor (any violation reverts the whole tx):** DATA rejects refUID≠0 / revocable / non-empty data (EFSIndexer); PROPERTY must be refUID=0 + non-revocable (ADR-0052); ANCHOR requires an existing parent within `MAX_ANCHOR_DEPTH`; `MIRROR.transportDefinition` must descend from the wired `/transports` anchor; binding/placement PINs are cardinality-1 (supersede the author's *own* prior PIN, never others').

**Hardlink / dedup short-circuits (collapse layers, → 1 signature even in Tier 1):** re-uploading identical bytes, or "add an existing file at a new path," reuses the on-chain DATA and reduces the write to a **single placement PIN**. The SDK planner detects this via a trusted-`contentHash` PROPERTY lookup *before* building the graph.

## Tier 2 — the `EFSWriter` routine (one signature)

**Mechanism.** Implement the scaffolded `@efs/solidity` routine (`EFSWriter`/`EFSLib`, today all `revert NotImplemented`) so it composes the graph above — sequential `eas.attest` calls, threading each returned UID into the next call's `refUID`/`definition` **in memory, within one transaction** — exactly `SystemAccount.bootstrap`'s proven pattern, minus the system-relay scoping. Because the routine is `internal`/inlined (or DELEGATECALL'd), `msg.sender` at each `eas.attest` is the **caller**, so EAS records the caller as attester.

**Who runs it (every option preserves attester = user/app):**
- **Third-party app contract** — inherits the compile-in routine; the app contract is the attester (ADR-0003; James-approved). One tx.
- **EIP-7702 user EOA** — the user's EOA delegates to (or DELEGATECALLs) a deployed shared write-library; the routine runs with `msg.sender` = the user's EOA → user is attester. One tx, one signature.
- **ERC-4337 smart account** — same, via a userOp.

**SDK orchestration (`efs.fs.write` / `efs.batch()`):**
1. **Plan** — resolve pre-existing deps (parent anchor, transports anchor, schema UIDs); run the dedup/hardlink short-circuit.
2. **Build** the layered graph above.
3. **Detect** capabilities (`wallet_getCapabilities`): EIP-7702 delegation + EIP-5792 `sendCalls`.
4. **If capable → Tier 2:** point the user's account at the routine; submit as one `wallet_sendCalls` (one approval; wallet may sponsor gas). Attester = user.
5. **Else → Tier 1 fallback:** one `multiAttest` per DAG layer (L1 → read mined UIDs → L2 → L3) — ~2–3 signatures, attester = user. Never a relayer.
6. **Report** one progress/result; decode resolver reverts (`MissingParent`, `InvalidTarget`, `NotFound`) into actionable errors.

## The contracts ask (now non-empty — supersedes the earlier "None")

To unlock Tier 2:
- **Implement `EFSWriter`/`EFSLib`** so it composes the file-write graph with in-memory UID threading (model: `SystemAccount.bootstrap`). Currently pure stubs (`EFSLib.sol` bodies all `revert NotImplemented`).
- **Optionally deploy a shared write-library** the 7702/4337 account DELEGATECALLs, so non-app wallet users get one click without compiling anything.
- Both are **addable post-freeze**: the routine is not a frozen schema and its address is baked into no UID (same redeployable-upgradeable-layer rationale as the views/router). Per the boundary rule, this design spawns the contracts change + an SDK ADR for the compile-in slice.

## Open questions

- [ ] **Shared write-library vs compile-in-only.** Ship a deployed shared `EFSWriter` library (so plain 7702 EOAs get one click with no app code) or rely on app contracts + the compile-in source for v1? (Leaning: deploy the shared library — it's what makes one-click real for ordinary wallet users.)
- [ ] **7702/5792 wallet coverage at launch.** Which target wallets actually expose `wallet_sendCalls` + 7702 delegation in our launch window? Drives how often Tier 1 (fallback) is hit in practice.
- [ ] **Revocation/supersede UX.** PIN replacement (re-pin, move, delete) has the same dependent-UID shape; confirm the routine + Tier-1 serializer cover it, not just create.
- [ ] **Gas sponsorship.** If a 5792 wallet offers a paymaster, do we surface gasless writes, or stay neutral (out of scope for v1)?

## Pre-promotion checklist

- [ ] Open questions resolved or explicitly deferred
- [ ] `target-repos: [sdk, contracts]` confirmed
- [ ] Contracts owner signs off that the `EFSWriter` routine is addable post-freeze as described (no frozen-surface impact)
- [ ] One round of `#status/review` with James / another agent
- [ ] Spawns: `contracts#NNN` (implement EFSWriter + optional shared library), `sdk` ADR (compile-in slice + write orchestration)

## Decisions / status

- **Status: `#status/review`.** Tier 1 (~2–3 clicks, SDK-only, any wallet) ships now as the fallback. **Tier 2 (one click, attester = user) is the target, greenlit 2026-06-18**, and now *does* carry a contracts ask (implement `EFSWriter`/`EFSLib` + optional shared write-library) — addable post-freeze.
- Superseded from 2026-06-10: "2 clicks is the floor" and "no contracts ask" (those held only under no-contract-change + plain-MetaMask assumptions). Still rejected: self-placing DATA (reopens ADR-0049) and shared-gateway/write-through-identity (attester bug — use the user-context routine instead).
- Cross-write batching (many files at once) via EIP-5792/4337 remains an orthogonal additive win — layer the same approach across files.
