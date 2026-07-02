---
title: Debug-UI minimal-clicks — shipped (historical record)
status: done
tags: [status/done, debug-ui, ux]
related: [[write-ux-options-ranked]], [[efs-account-system]]
target-repos: [contracts (packages/nextjs)]
last-touched: 2026-06-23
---

# Debug-UI minimal-clicks — SHIPPED

**Merged: contracts PR #36** ("debug-ui: batch EFS writes via layered multiAttest (minimal clicks)"),
2026-06-23, branched off PR #30 ("Debug UI: Sepolia + 3-network switcher", also merged 2026-06-23).

## What shipped (the validated Tier-1 technique, ported into the Next.js debug UI)
- **Layered `multiAttest`** — one `multiAttest` per DAG dependency layer, threading mined UIDs between layers
  (mirrors the SDK's `submitLayeredTier1`). File-write attestations **11 → 3–4 popups**.
- **Pipelined SSTORE2 chunk deploys** — fire all chunk deploys, await receipts together (independent deploys) →
  storage latency collapses from N×~12s to ~1–2 blocks.
- **`data:` URI mirror** for small files (≤~4–6 KB) — bytes inline in the MIRROR attestation → zero storage
  deploys. (Required a `/transports/data` anchor; a Durable touch recorded in `contracts/docs/decisions.md`.)
- De-duped `CreateItemModal`'s file branch onto the shared `submitLayered` engine (D2 "full win").

## Settled facts (why this is the floor, not 1 popup)
- EAS v1.3.0 UID embeds `block.timestamp` ⇒ UIDs can't be precomputed ⇒ a plain EOA can't collapse the dependent
  DAG into one `multiAttest`; layered (one tx/layer) is the floor.
- `multiAttest` = ONE MetaMask popup (one `eth_sendTransaction`); EIP-5792 atomic batching on injected MetaMask
  EOAs is one-confirmation-per-batch, not promptless. True 0-popup needs a smart account + session key — see
  [[efs-account-system]].

## Honest popup math (as claimed in the PR)
- Overview save (small markdown): ~10–15 → ~6–7; attestation portion alone 11 → 3–4.
- Paste-link (no storage): ~8 → 3. "3" assumes steady-state (ancestors tagged); first upload into a new subtree
  adds one visibility-TAG layer (→ 4).
- 1 MB on-chain file: ~11 min → ~75s (pipelined); clicks still one-per-chunk (a one-tx storage factory would fix
  that — deferred per ADR-0057/0061).

## Where the broader effort lives
- Full options map: [[write-ux-options-ranked]].
- Promptless/0-popup + identity (the next layer): [[efs-account-system]].
