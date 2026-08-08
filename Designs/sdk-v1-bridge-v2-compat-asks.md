# SDK v1 bridge — the cheap v2 commitments that keep it importable

**Status:** review
**Target repos:** planning (asks on the v2 design), sdk (already implemented on its side)
**Depends on:** [[Decisions]] 2026-08-07 (v1-bridge ruling), `Designs/efsv2/` (the reopened corpus), SDK ADR-0019 (the v1 profile boundary, implemented)
**Reviewers:** —
**Last touched:** 2026-08-07 — sdk-designer

#status/review #kind/design #repo/planning #repo/sdk

## Problem

The 2026-08-07 v1-bridge ruling supports v1 + the SDK for Nanda/Arcade **without** making v1 the v2 baseline, and asks that v1-specific mechanics stay isolated so product evidence pressure-tests v2 without defining it. The SDK side is done (ADR-0019: `createEfsV1Client`, `profile: 'efs/v1'` stamps on every persisted artifact, versioned serializers that fail closed on foreign profiles, the write-side `lens`→`author` rename, `@efs/solidity/src/v1/`). What remains is the OTHER side of the boundary: a short list of cheap, mostly-one-sentence commitments the v2 design can adopt **now** that convert "real data accumulates on v1, then v2 severs it" from an unbounded liability into a bounded, mechanical import. None of these constrain v2's architecture — they were extracted from the v2 corpus itself (each is something a v2 doc already gestures at).

These are ASKS on the v2 design, routed here (not written into `Designs/efsv2/`) so the PM can fold them into the packet discipline at the right moments.

## The asks, by leverage

1. **Commit a deterministic v1→v2 identity mapping** — the single highest-value item. Adopt the EAS→EFS preservation-wrapper direction ([[fable-handoff-portable-schemas-and-validators]] §"Real EAS compatibility directions": deterministic, origin-scoped wrapper IDs), specialized to the nine Sepolia v1 schema UIDs, published in the Codex. Upgrade [[efs-v2-transition-plan]] Phase 5's "re-attestation courtesy" to this committed rule. With it, every v1 ref the bridge apps persist has a permanent v2 name and dual support collapses to a one-shot import tool. The SDK's `profile: 'efs/v1'`-stamped refs are exactly what the wrapper would consume.
2. **Ratify the reserved-key names verbatim** — `contentType`, `contentHash`, `size`, `name`, `contentEncryption`, `mirrors`, and the five redirect row names are already enumerated in [[codex-kernel]]'s genesis manifest with v1's exact strings; one sentence stating "these are the v1 strings, frozen" keeps the SDK's typed metadata slots stable across profiles.
3. **contentHash encoding: the conflict is now RESOLVED in practice — ratify it.** The SDK moved to the contracts-ratified multibase-multihash form (`f1220…`, specs/10 / SDK ADR-0016), and [[deterministic-ids]] §13.5 item 8 freezes "the contentHash multibase-multihash convention" — the two now agree. Ask: the Codex convention should admit sha2-256/`f1220` as the (or a) legal encoding so imported v1 claims carry over verbatim.
4. **Freeze the identity-word shape taxonomy** ([[identity]]: address-shaped words live, digest-shaped reserved, the re-salt rule) so a v1 `Address` embeds losslessly as a v2 principal word — this is what lets every Address-typed SDK field widen in place instead of forking.
5. **Ratify that all v2 logical IDs stay exactly `bytes32`** (true in every draft formula) — SDK handles/brands/receipts stay wire-shaped across profiles.
6. **Extend the v1 flat-lens import rule beyond URLs** — [[lens-spec]] §10 commits `?lenses=` arrays importing as one `PRIORITY_FIRST_PRESENT` source revision; extend it to any v1 ordered attester list (the SDK `Lens` object), so bridge-app lens configs replay into v2 Plans mechanically.
7. **Pin the kernel read-ABI selector set early** ([[codex-kernel]] §read ABI — already designed as Etched) so a v2 read adapter can be prototyped against a stable target while admission semantics reconcile.
8. **Seed v2's freshness-basis vocabulary from the SDK's shipped TrustDescriptor terms** (`current` / `as-of` / `stale` + source kinds + `ReadBasis`) rather than minting disjoint words — v1 results then embed into v2's 6+1 grades as the degenerate live-read case.
9. **Keep the envelope stock-wallet-signable** through the KEL recut (`eth_signTypedData_v4` already red-team-verified for the baseline struct) so the SDK's EIP-1193 boundary needs no new wallet capability.
10. **Name the venue/realm vocabulary now** (what a stamped ref calls its chain/venue/basis) so v1-profile stamps use the words v2 keeps.

## SDK-side open questions for James (small, non-blocking)

- **Devnet plan** (SDK ADR-0018 depends): re-provision 26001993 to genuinely mirror Sepolia (Safe-keyed CREATE3 + deterministic views), or accept fork-local addressing with an independently generated devnet profile via contracts#43? The SDK removed its broken built-in DEVNET entry either way (the live devnet has different addresses AND schema UIDs; the fork pin predates the freeze blocks); the answer decides what re-adds it.
- **`followRedirects` default before durable REDIRECT seeding**: specs/09 makes symlink-following normative for a conformant reader (the router will auto-follow); the SDK ships opt-in `false` for now. Decide the conformant default before durable symlinks are seeded.
- **v1 EOL nuance**: "bridge" implies v1 goes archive-read-only once v2 + the import tool exist — confirm that's the shape (it decides whether v1-profile code is maintenance-frozen or deletable).

## Open questions

- [ ] Which of asks 1–10 the PM routes into the efsv2 packet now vs at the recut (ask 1 is the one with a real deadline: before meaningful Nanda/Arcade data accumulates).

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
