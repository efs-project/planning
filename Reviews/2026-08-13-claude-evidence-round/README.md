# 2026-08-13 — Claude evidence round (5 lanes)

**Status:** reference — dated research record, not a design or a ruling
**Commissioned by:** @james via @pm, 2026-08-12, from work maps drafted by the Codex EFS PM and the Arcade agent
**Method:** 4 top-level Opus 5 agents + delegated sub-lanes, read-only, ~800k tokens
**Boundaries honored:** no venue selected, no Realm identity defined, no EFS contracts designed, no Arcade design doc or owner inbox touched, nothing written outside this folder

#status/reference #kind/research #repo/planning #repo/contracts #repo/client

## The convergent finding

Four lanes, different domains, one conclusion: **the dominant failure is not chain death or byte loss — it is "confirmed, then unreadable."** This is the bug class the vault already names, arrived at independently by each lane.

- **Venue lane:** "The threat you are actually buying insurance against is not chain death. It is confirmed, then unreadable."
- **L1-incidents lane:** blobs expire in ~18 days (measured); history expiry shipped 2025-07-08; testnet read paths evaporate while chains still run.
- **Falsification lane:** "every case died at the index layer, not the storage layer."
- **Case-study lane:** ldjam.com — bytes fine, SPA index dead, Internet Archive holds 3.8 KB shells.

## Lane 1 — Arcade differentiation falsification (ran twice, independent methods)

**Verdict both times: 0 EFS-SPECIFIC benefits.** (8 or 9 of 10 conventional-baseline-sufficient, 1–2 unresolved, depending on run.)

- The Arcade's own `mvp-architecture.md` concedes it: manifest is chain-free ("No required chain values"), "manifest is the index; chain is provenance, not availability", J13 reconstruction is `git clone`, "deleting every receipt leaves a valid, re-seedable dataset."
- The proposed catalog needs no rescuing: js13kGames is 2,503 public repos, the aggregate repo has 42 forks, and Software Heritage archives GitHub continuously with content-addressed SWHIDs, free and unasked.
- **EFS is currently behind the baseline on its own signature property** — `verifyContentHash` has zero callers (verified: declared once at `contracts/packages/nextjs/utils/efs/transports.ts:111`), 67 durable Sepolia files carry non-canonical keccak hashes, pins sit on one VPS Kubo node.
- The one non-baseline property (claim discoverability anchored to the object) **is not blockchain-specific** — Nostr NIP-54 + NIP-51 ship it today.
- **Possible STOP-trigger:** `Designs/arcade/product-and-communities.md` §6 says stop if "the differentiator demo cannot be made user-visible." The memo argues 4 of 5 demo beats are baseline parity and the 5th is unexpressible in a single-operator site.
- **Scope caveat (PM):** the verdict is explicitly "for the catalog it actually proposes." js13k-class games are the least endangered software on the internet. This may be a *catalog* problem rather than an EFS problem — which is what the target-community research is built to test.

## Lane 2 — Andromeda Invaders evidence reproduction

**Artifact is clean; the vault's claim about it was not evidenced until now.** "Mobile-capable, rights-clean" entered by direction ~2026-08-08 without an evidence pass.

VERIFIED: no build step (curl + clone + `cmp` identical); zero outbound requests and zero storage over 70s runtime; runs in `sandbox="allow-scripts"` opaque origin (answers ledger U5); MIT; all assets generated (canvas `fillRect`, oscillators, hardcoded FONTMAP) — no image, audio, or font files exist.

Four unresolved, none agent-rulable:
1. **Font glyph provenance** — only third-party asset; CC0 claim downstream of an ambiguous IBM/Verite ROM chain. OWNER-OR-COUNSEL. Cheap fix: redraw ~40 glyphs.
2. **Custody is one operator four times over** — susam.net, github.io, codeberg.page, npm all his. Independent *archival* custody does exist (Software Heritage + Wayback hold the exact bytes).
3. **"0.9.0" maps to two different byte sequences** (web vs npm/tag); in-game constant says 0.8.0. **Pin by digest, never version.**
4. **MIT permission-notice completeness** if shipping `invaders.html` alone. Fix: include `LICENSE.md` in the closure.

MISSING: the USPTO name pass `rights-safety-and-operations.md` §2.3 requires has not been run.

## Lane 3 — Browser-runner behavior matrix (measured, macOS)

Chrome 151.0.7922.109 · Safari 26.5.2 · Brave 151. **Firefox, iOS Safari, and Chrome Android entirely unmeasured** (unavailable on the machine); touch and gamepad input never exercised.

- **Safari has no process isolation for opaque sandboxed iframes.** A 3s busy loop in the child froze the host page for 3.0s. Chrome: 51ms (out-of-process, confirmed via CDP). Adding `allow-same-origin` removes Chrome's isolation too.
- **Safari throttles sandboxed children to ~22 fps** while the host runs 60. Tracks cross-origin-ness, not the sandbox attribute — cannot be opted out of. Chrome: no throttling.
- **Fullscreen trap:** in Safari, `allowfullscreen` alone works; `allow="fullscreen"` alone fails; **both together fails** — the modern attribute overrides and disables the legacy one. Reproduced 3×. Chrome accepts either.
- **Self-navigation is uncontained** — `location.href` to an external https URL navigates in both engines, and the landing document **inherits the sandbox and opaque origin** (server-verified `Origin: null`). Directly relevant to Andromeda's info-screen behavior.
- **The sandbox does not stop network egress** — `fetch(mode:'no-cors')` sends; WebSockets work ungated; blob/`data:` Workers alive. A no-egress guarantee is CSP, not `sandbox`.
- **A child renderer crash gives the parent no event** — detection needs your own watchdog.
- Storage uniformly dead in opaque origins; Safari silently accepts cookie writes that go nowhere where Chrome throws (the confirms-but-unreadable shape again).
- Spec sub-lane: **user activation flows to all ancestors unconditionally, to descendants only when same-origin.** One rule governing audio, fullscreen, and pointer-lock; documented by no vendor. iOS: fullscreen is iPad-only (still, at Safari 27 beta); pointer lock never.

## Lane 4 — Commons/Realm venue evidence

- **Optimism deleted its own users' event logs** (Jan–Jul 2021, "cannot be fully recovered", "errantly deleted during an infra cleanup"). Documented by OP.
- **"Onchain DA" ≠ permanently retrievable.** Arbitrum/Base/OP post blobs; retention is 4096 epochs ≈ 18.2 days. Beyond that, re-derivability rests on Blobscan and commercial providers, not Ethereum.
- **No venue clears a 30-day exit window.** Every L2 is "None" — instant, no-notice authority over bridge and state-root logic. L1 is the only venue with no upgrade key at all.
- **Cost:** 200k-gas write 2026-08-13 — L1 $0.020, Arbitrum $0.0076, Base $0.0023, OP $0.00038. The same write cost **$23.43 in Dec 2024** (~1,000× swing). **EIP-8037 (Scheduled for Glamsterdam) takes new SSTORE 20,000 → 97,920 gas**, repricing EFS's storage-heavy design ~4.9×.
- **L3s fail adopted requirements by construction** — AnyTrust: "a node cannot reconstruct chain state from parent-chain data alone" (Arbitrum's own docs). ~96 archived vs 107 live chains; $85.2M stranded; 8/8 dead chains probed had deleted DNS.
- **L1's own weaknesses:** Teku at 53.86% of consensus clients; 41% of blocks via OFAC-censoring relays; no force-inclusion mechanism (FOCIL declined for Glamsterdam).
- **Redstone is the sharpest EFS-shaped case:** alt-DA; Lattice's notice says contract assets "will not be recoverable"; 22.107 ETH sits in an unpaused portal because the DA is gone and nobody can build the storage proof.
- **Do not cite `l2fees.info`** — measured 190 days stale, L1 figures ~300–520× off.

## Lane 5 — L1 track record and dead-data precedents (measured)

- **L1 liveness is not the risk.** 5,103 sampled windows: no contiguous halt >59 min as a rigorous upper bound; longest observed inter-block gap post-Merge is **96 seconds**. Two finality pauses ever (~25 and ~54 min, May 2023), both self-healing.
- **Same bug class twice** — May 2023 and Dec 2025, same client (Prysm), 31 months apart; survived by client diversity, not protocol robustness.
- **State-rewrite risk retired:** one rewrite (DAO 2016); **EIP-999 withdrawn** — Ethereum declined to rewrite state over ~500k frozen ETH.
- **Never put durable data in blobs.** Measured: 45-day-old slots return blob bytes, 60+ days return HTTP 403. A 6-month-old type-3 tx still carries its `blobVersionedHashes` — the commitments are permanent, the bytes are gone.
- **Testnet death pattern, measured:** Goerli — 8 public RPCs tried, zero working; explorer returns Cloudflare 522 (DNS resolves, origin decommissioned, so naive health checks report it healthy). Ropsten/Rinkeby/Kovan/Holesky explorers: no DNS A record. **No shutdown announcement ever addressed data preservation.** The official archive registry lists none of the dead testnets, and one of its *listed live mirrors* has no DNS record.
- Live mainnets lose explorers too: Fantom Opera and Polygon zkEVM both running, both canonical explorer domains NXDOMAIN.

## Open questions for the owner (surfaced, not decided)

1. **Does an Etched kernel tolerate a mutable machine underneath it?** Answering "no" collapses the venue set to L1 immediately. Answering "yes" means naming whose keys can change EFS's execution environment.
2. **What does "reconstructible" mean** — from venue state, or from the venue's parent after the venue dies? Different bars, different venues. `R-M2` does not currently say which.
3. **Is "chains don't die" retained, scoped, or retired?** Defensible for L1, arguable for top L2s, empirically false for L3s.
4. **Durability or reach?** They point opposite ways (L1 vs Base). The Core/Commons split permits different answers — if stated explicitly.
5. **Does the L1 pointer reopen on new grounds?** Retired correctly on censorship-escape; the **discovery-and-tombstone** argument is new and independent.
6. **How much fee-regime variance can EFS carry?** ~1,000× swing in 20 months, plus EIP-8037.
7. **Arcade framing** — does the falsification result change the Arcade's rationale, and is the STOP trigger met?

## Honest limits of this round

Firefox / iOS Safari / Chrome Android unmeasured. No JavaScript executed in the falsification lane (no game actually played). GitHub Pages' own failure modes were flagged by both falsification runs as under-tested — partially closed by the case-study lane (Nintendo's 8,535-repo single-notice takedown; account suspension with no counter-notice; 1 GB Pages cap), which also confirmed content-addressing does **not** escape DMCA or sanctions (Tornado Cash). Sepolia's permissioned-validator status is asserted by one lane and listed as unverified by another — **unresolved**. Degen's reported 2026-08-31 sunset is secondary-source only.
