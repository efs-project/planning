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

The candidate 1-click route was **self-placing DATA** (fold "these bytes" + "they live here" into one attestation, removing the forward UID reference). A validation pass against the frozen contracts found it **NOT-VIABLE**, for two independent reasons:

1. **MIRROR re-introduces the blocker regardless.** `MirrorResolver.onAttest` requires its `refUID` to resolve to a DATA attestation of `DATA_SCHEMA_UID` (`MirrorResolver.sol:110,115`) — mirror→DATA is UID-static by the correctness rule (it means "these *exact* bytes"). So even with self-placing DATA, any write that includes a mirror still needs DATA's mined UID → still ≥2 signatures.
2. **It would reopen an Etched invariant.** Welding placement into DATA overturns ADR-0049's "DATA is pure identity" and destroys DATA's path-agnostic hardlink property ("multiple paths can reference the same DATA"). That's a Tier-1 ADR reversal to save *one* signature versus a plain two-`multiAttest` batch that needs zero frozen-surface changes.

**Conclusion: there is no cheap one-click win, and therefore no time-sensitive ask for the schema-freeze dev.** The pragmatic floor is **Tier 1, ~2–3 clicks, SDK-only, no contract change.** True intrinsic-placement is filed as **post-burn FUTURE_WORK** if UX data ever justifies reopening it.

### Write-through identity contract — rejected (folds into smart accounts)

The "contract that lets keys on a list write through it" was validated adversarially and **does not hold up as an identity primitive**: resolving "contract → user" via membership is only injective when the contract is *per-user* — and a per-user contract that attests under its own address **is just a smart account**, which EAS already records as the attester natively (via ERC-1271). A *shared* (team/DAO) contract is non-injective (many users list it → its writes are unattributable) and collides on cardinality-1 PINs. ERC-4337 + ERC-7579 SmartSessions already deliver "many keys, one identity, scoped batched writes" better. **The genuine team/shared case is a different thing — a *shared content space*: an org list/lens whose members each attest under their *own* address, aggregated at read time** (which is exactly EFS's existing lens/`webOfTrust[]` model — no new primitive).

## The ask for the schema-freeze dev

**None.** The validation closed the one-click routes (static-link correctness + ADR-0049 being Etched), so there is **no contracts coordination required** for click-reduction. Tier 1 is entirely SDK-side. (Earlier drafts proposed a resolver affordance; it's withdrawn.)

## Decisions / status

- **Status: settled. Tier 1 (~2–3 clicks, SDK-only, no contract change) is the answer for v1 and beyond.** No schema-freeze dependency. One-click (self-placing DATA) deferred to post-burn FUTURE_WORK; write-through-identity-contract dropped (use smart accounts).
- Cross-write batching (many files at once) via EIP-5792/4337 is an orthogonal, additive win — layer the same per-DAG-layer `multiAttest` approach across files.
