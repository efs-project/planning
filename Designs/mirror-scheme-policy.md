# Mirror URI scheme policy: remove the scheme gate

**Status:** review
**Target repos:** contracts, sdk, client
**Depends on:** —
**Supersedes:** — (drives a contracts ADR superseding ADR-0023)
**Reviewers:** —
**Last touched:** 2026-06-19 — sdk-designer

#status/review #kind/design

## Problem

EFS mirrors carry a retrieval URI (`ipfs://…`, `https://…`, `web3://…`). `MirrorResolver.onAttest` today enforces a **hardcoded scheme allowlist** (`_isAllowedScheme`, ADR-0023): only 11 known prefixes are accepted; everything else reverts. Surfaced while building the SDK write path:

1. **Closed to the future.** A new transport scheme (`hypercore://`, some 2030 content-addressed protocol) cannot be a mirror without a contract change. The `/transports/*` anchor registry (ADR-0011) is already the *extensible* place to declare transports; the scheme allowlist is a redundant, inextensible second gate. A credibly-neutral archive should not pre-decide which protocols may ever exist.
2. **Blocks the zero-infra ergonomic.** `data:` is rejected, so a small file cannot be inlined as a self-contained mirror.

We resolve this while no real data depends on the behavior. The deployed contracts are live on Sepolia (9 schemas frozen, addresses in `contracts/docs/CHAINS.md`), and the schema-freeze owner holds the resolver upgrade keys with **no burn timeline** (kernel can change until audited) — so the fix is available indefinitely, not deadline-gated.

## Proposal

### The core realization

A scheme allow/denylist is the **wrong mechanism for an immutable contract** — independent of *which* schemes you'd pick:

1. **Not the security boundary.** An *allowed* `https://`/`ipfs://` mirror can serve `text/html` with `<script>` just as easily as `data:`/`javascript:`. A client that renders fetched mirror bytes in its trusted origin is vulnerable regardless of scheme. The real control is **client-side render isolation**, mandatory for *every* transport.
2. **Not robustly enforceable.** A prefix check is trivially evaded — case (`JaVaScript:`), zero-width / control chars (`java​script:`), whitespace, percent-encoding. Correct enforcement needs full URI normalization: gas-heavy, error-prone, and — immutable — un-patchable against the next evasion.
3. **Can't anticipate the future.** A denylist can't know tomorrow's dangerous scheme; an allowlist forecloses tomorrow's legitimate protocol.

So the gate blocks honest typos of exact strings while delivering no real security and no durable guarantee.

### Decision: remove the scheme gate entirely

`MirrorResolver.onAttest` stops checking the URI scheme. Any URI is accepted provided it passes the **robust, structural** checks the kernel can actually enforce:

- **References a real transport** — `transportDefinition` is a descendant of `/transports/` (`_isDescendantOfTransports`, unchanged). The good, extensible gate: a new protocol = author a `/transports/<scheme>` anchor (permissionless, additive).
- **Within length** — `MAX_URI_LENGTH` (ADR-0022, ~8 KB), unchanged. Also bounds inline `data:`.

`_isAllowedScheme` is **deleted**. Scheme policy and the real safety control move to the **upgradeable** layer (client + SDK), where they can be normalized and patched as browsers evolve. `data:`, `web3://`, and any future `scheme://` all just work.

> **Client rendering-isolation requirement (normative, the real boundary).** A client MUST treat all fetched mirror content as untrusted and MUST NOT render it in the trusted application origin. Active content (HTML/JS/SVG) renders only inside a sandbox — a `sandbox`ed `<iframe>` on a separate origin with a restrictive CSP, and/or a compartment (SES / LavaMoat) for code execution. This holds for **every** transport, because `https://`/`ipfs://` serve active content too.

### Why the freeze is NOT broken (the cheap path)

`MirrorResolver` runs **behind an ERC1967 proxy** (ADR-0048, "proxy-ready resolvers — burn to immutable"). The **proxy address** is hashed into the `MIRROR` schema UID — not the implementation. So removing the scheme check is an **implementation upgrade behind the existing proxy**: proxy address unchanged → `MIRROR` schema UID unchanged → the 9-schema freeze set, `CHAINS.md` addresses, `deployedContracts.ts`, client, and SDK fixtures all **untouched**. Safe-gated `upgradeTo`; the freeze owner holds the keys (no burn timeline). ADR-0048 is not superseded (the freeze *set* is intact); ADR-0023 is superseded.

### Per-repo slices

- **contracts** — ADR-0056 (drafted, supersedes ADR-0023): delete `_isAllowedScheme` and its `onAttest` call; keep ancestry + length. Ship as a proxy impl upgrade. Flip tests; update `specs/02` §Mirror + `specs/overview.md`.
- **sdk** — the SDK's transport handling (`mirror/transport.ts`, `TransportName` in `types.ts`) becomes permissive: a mirror URI is valid unless the SDK can't fetch it; unknown-but-allowed schemes are accepted on write and gracefully skipped (no handler) on read, not hard-rejected. Enables the `web3://`/`data:` write defaults. The SDK is also where any *render-time* scheme caution lives (it can normalize + refuse to hand active content to a naive renderer) — patchable, unlike the kernel. An SDK ADR records the slice.
- **client** — owns the rendering-isolation requirement above. Tracked as a **client launch-blocker**, not implicit.

## Open questions

- [x] **Denylist membership** → **resolved: no scheme gate at all.** The robustness/immutability/evasion arguments defeated any scheme list (deny or allow).
- [x] **`data:` size bound** → resolved: `MAX_URI_LENGTH` (ADR-0022, ~8 KB) already caps it; the SDK steers larger content to `web3://`/off-chain mirrors.
- [x] **Burn status** → resolved: freeze owner confirms no burn timeline, keys held until audited → proxy impl-upgrade path available indefinitely; not deadline-gated.
- [ ] **Batched bundle reads (confirmed requirement; tracked in the SDK read-surface design, not this doc):** view-layer functions returning many values in one `eth_call` — `getProperties(dataUID, names[], attester) → string[]` and a `getFileInfo(anchorUID, lenses[]) → { exists, dataUID, resolvedBy, contentType, size, name }` bundle — so on-chain clients (and the SDK's `info`) read a metadata bundle in one round-trip instead of the per-field `getActivePinTarget → eas.getAttestation → decode` dance. Non-frozen view layer (freely redeployable). Supersedes the earlier single-value `getActivePropertyValue` nice-to-have.

## Pre-promotion checklist

- [x] Open questions resolved or explicitly deferred
- [x] `**Target repos:**` confirmed (contracts, sdk, client)
- [x] Freeze-safety confirmed (proxy impl upgrade; freeze owner holds keys)
- [ ] Client rendering-isolation requirement accepted as a client launch-blocker
- [ ] One round of `#status/review` with another agent or human comment

## Implementation notes

Land order: contracts ADR-0056 accepted → `MirrorResolver` impl upgrade behind proxy + tests (handoff to schema-freeze owner) → SDK transport-policy flip + `web3://`/`data:` write defaults → client sandbox hardening tracked separately.

```
- [ ] contracts#NNN — MirrorResolver: remove scheme gate (proxy impl upgrade) + tests + spec
- [ ] sdk#NNN — permissive transport policy + web3:// / data: write defaults
- [ ] client#NNN — mirror-content render isolation (sandbox + CSP)
```
