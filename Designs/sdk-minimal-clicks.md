---
title: SDK minimal-clicks (batched single-signature writes)
status: investigating
tags: [status/draft, sdk, ux, contracts-coordination]
related: [[sdk-architecture]]
---

# SDK minimal-clicks: one-signature EFS writes

> Sub-investigation of [[sdk-architecture]]. **Goal:** a single logical EFS write (create/pin a file) should cost the end user **one wallet click**, ideally on a plain MetaMask EOA — not ~8. This page establishes whether a viable path exists with no obvious blocker, and produces a concrete ask for the schema-freeze dev (time-sensitive against the Sepolia freeze).

## Why this matters

Fewer clicks is a top product priority (James, 2026-06-10). The SDK owns the UX work. This may require a small contract/resolver affordance, so it must be settled **while the schema-freeze dev is reshaping resolvers** — not after the burn.

## The verified crux

EAS computes each attestation's UID from fields that include `attestation.time` = `block.timestamp` (`@ethereum-attestation-service/eas-contracts/contracts/EAS.sol:697–709`, the `_getUID` function). **A UID therefore cannot be known until the tx is mined.**

Consequence: if attestation **B** in a single logical write must carry attestation **A**'s UID in its `refUID`, and both are created in the same write, then B cannot be signed in the same batch as A (A's UID is unknowable at signing time). That forces sequential transactions = multiple clicks.

- **One signature is possible** via a single `EAS.multiAttest` tx (many attestations, one approval, **works on plain MetaMask** — no EIP-5792/4337 required) **IF** the write contains no intra-batch UID-refUID dependency.
- EFS anchors are **path-derived `bytes32`** (ADR-0030), so references *to anchors* are likely already predictable (computable client-side, no UID needed). The suspect edges are content/placement links like **DATA → PIN**.

**So the whole question reduces to:** can a single EFS write be expressed as N attestations whose cross-references are all *predictable* ids (path/content-derived), with **zero** intra-batch UID-refUID? If yes → one `multiAttest` → one click. If a few edges genuinely need a UID-refUID, what is the minimal resolver/schema affordance that removes them?

## Investigation (2026-06-10, 3-agent deep pass against real source)

**Verdict: VIABLE, no hard blocker — in two tiers. 8 clicks → ~2–3 with zero contract change (ship now); → 1 needs one resolver affordance (raise with the schema-freeze dev now).**

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

The only *correct* route to 1 click is changing the write's **shape**, not weakening a link: **self-placing DATA** — fold "these bytes" and "they live here" into a single attestation, so the write has *no forward UID reference at all* (placement is intrinsic to the same attestation; nothing needs to point at DATA's not-yet-known UID). This sidesteps the timestamp problem instead of corrupting semantics. It's a resolver/placement redesign (freeze-dev's domain), resolver-only if it fits the frozen schemas. **Note:** ADR-0049 (empty DATA) does **not** already solve this — it removed *content* from DATA's identity but the identity is still the time-mixed UID (ADR-0049:12,22).

**Future direction — write-through identity contract = the account-group, write-side.** A "contract that lets keys on a list write through it" (James) is the same primitive as the multi-device key-set (read-side, [[sdk-architecture]] §2). Caveat: writing *through* a contract makes the contract the EAS attester → identity collapse. It works as an identity layer only if EFS *resolves the contract's writes back to the user* via key-set/`webOfTrust[]` membership (the contract is an authorized member, not a hijacker). Real new primitive — v2+, not hackathon. Captured so it's not lost.

## The ask for the schema-freeze dev (time-sensitive — before burn)

1. **[resolver-only, the one that buys 1-click]** Can `EdgeResolver` resolve a PIN→DATA (and PIN→PROPERTY) edge by an **attester-supplied deterministic id** rather than the mined `refUID`, so the client can compute all edge targets at sign time and submit the whole write as one `multiAttest`? This is resolver logic, inside the proxy window (ADR-0048), touches no frozen UID. Trade-off to weigh: the orphan-index risk if relaxing/replacing the eager `InvalidTarget` guard (`EdgeResolver.sol:211`).
2. **[do NOT pursue]** Content-hash binding for DATA — ADR-0049:14 already rejected hash-as-identity; don't reopen it.
3. **[clarify]** Confirm whether "one tx, target known at *mine* time" (cheaper) suffices for any path, or whether one-signature truly requires "target known at *sign* time" (the deterministic-id design). One-signature requires sign-time.

## Decisions / status

- **Status:** viability confirmed. **Tier 1 (2–3 clicks, no contract change) is the beta default.** Tier 2 (1 click) gated on the resolver affordance above — pursue with the schema-freeze dev opportunistically, do **not** block beta on it.
- Cross-write batching (many files at once) via EIP-5792/4337 is an orthogonal, additive win — layer the same DAG approach across files.
