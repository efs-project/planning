# EFS Arcade — v1 MVP architecture and end-to-end workflows

**Status:** draft
**Target repos:** planning, contracts, content
**Depends on:** [[playable-archive-requirements]], [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/contracts #repo/content #topic/games #topic/arcade

## Problem

The Arcade ships 2026-09-11 as a labeled public demo on the v1 Sepolia stack (this pass's proposal: CONDITIONAL GO at demo scope — not an owner ruling). The deployed explorer today cannot deliver the core promise: file deep links land on an empty grid, nothing verifies fetched bytes, one dead mirror breaks the page, and the guest boot path storms a shared RPC ([hands-on test log](../../Reviews/2026-08-07-arcade-corpus/hands-on-browser-test-log.md), grade A: in one real session a guest could not open any game at all). This doc fixes the MVP architecture: routes, guest journeys, the capability inventory with honest status labels, data shapes, RPC budget, seeding, and trust boundaries.

## Scope and non-goals

**In scope:** static-export `/arcade` + `/arcade/<slug>` routes in `contracts/packages/nextjs` (Ephemeral tier), guest read path, verify-before-execute Play flow, mirror fallback, build-baked catalog, fixed seeder + receipts, giscus comments + burner star (owner decision pending), GitHub-PR curation.

**Non-goals:** no contract changes, no new schemas, no SDK dependency for the client (SDK is post-hackathon; the "arcade-pin patch" applies to seeder tooling choice only — [verification-sdk-pr1](../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md)), no multi-file games at launch, no EFS-native comment loop as primary, no devnet target (26001993 has **no contracts deployed** — verified `eth_getCode = 0x`, [verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §3), no mainnet.

### Four-status discipline

An arcade can be four different things; conflating them is how demos get oversold. Every public statement and internal plan names which status is claimed:

| Status | Bar | Arcade 2026-09-11 |
|---|---|---|
| **Product demo** | Works for a stranger with a link; labeled as demo; honest testnet scoping | **Claimed — the only one** |
| Engineering fixture | Repeatable seeds/receipts; exercises real code paths | Partially, via receipts work here; not claimed |
| Community pilot | Outside creators/curators actually using it | Not claimed (GO condition for product upgrade) |
| N5 reference-app candidate | Evidence feeding the reference-app decision | Feeds evidence only; not the decision |

## Guest journeys (v1 target behavior)

All journeys wallet-free by construction (guest = disconnected; reads via one viem `publicClient` — [verification-routes-and-links](../../Reviews/2026-08-07-arcade-corpus/verification-routes-and-links.md) §2). "Guest", never "anonymous".

**J1 — `/arcade` catalog load.**
1. Static shell served (IPFS/eth.limo `_redirects` SPA fallback, proven for folder routes).
2. Catalog renders from the **build-baked manifest** (titles, art, tags): zero RPC.
3. Background: one `getDirectoryPageFiltered` read against the on-chain `/games` listing for provenance badges ("on-chain since block N"); failure degrades to manifest-only with a "chain view unavailable" note.
4. No wallet stack boot, no 7-read gate, no watch hooks (the pure-util path, §5).

**J2 — `/arcade/<slug>` direct link.**
1. Shell + client-side slug from `usePathname()` (ADR-0040 pattern, same as blockexplorer address pages).
2. Item detail renders from manifest entry. **No game code fetched or executed.** This replaces the explorer's broken deep link (empty grid / "hidden by exclusion filter", observed grade A).
3. Unknown slug → catalog with "not found" notice.

**J3 — Browse/filter.** Client-side over the baked manifest (tags, input support, size). If the optional on-chain listing read failed, filtering still works — manifest is the index; chain is provenance, not availability.

**J4 — Item detail without execution.** Title, art, controls, license, provenance (upstream + fork lineage), on-chain identifiers (anchor UID, DATA UID, contentHash, mirror list from receipt), size and estimated load. A "verify it yourself" expando prints the `cast`/curl recipe. Nothing runs.

**J5 — Explicit Play (preflight → fetch → verify → launch).**
1. Guest clicks **Play** (one explicit click; opening a page never executes — the anti-Poki divergence a neutral substrate requires, [hands-on log](../../Reviews/2026-08-07-arcade-corpus/hands-on-browser-test-log.md) §2).
2. Resolve `(dataUID, winningAttester)` via `EFSFileView.getFilesAtPath` (the router discards both — [verification-execution-mirrors-enumeration](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md) §1.3).
3. Enumerate that attester's mirrors via `EFSFileView.getDataMirrors`; order by the router's priority ladder.
4. Fetch first mirror with per-mirror `AbortSignal` timeout (today: no timeout at all; a black-holing gateway hangs minutes).
5. Hash assembled bytes; compare to the canonical `f1220`-sha256 contentHash **read from the on-chain PROPERTY** (the launch verify source — receipt/manifest is a cross-check, not the reference; requires M5's re-bind of canonical values for every launch title, unchanged keepers included). Mismatch → reject **before** caching, try next mirror.
6. Verified bytes → `<iframe sandbox="allow-scripts" srcDoc>` — never `allow-same-origin` (ADR-0056; matches the explorer's existing render sites). Progress UI throughout.
7. All mirrors exhausted → error card listing each mirror + failure reason, with the self-verify recipe.

**J6 — Mirror failure → verified fallback.** Subset of J5 steps 4–5; this is demo-differentiator #1 (live primary-mirror kill) and #2 (tampered mirror rejected pre-execution). Today's behavior is throw-on-first-failure with zero verification (`verifyContentHash` has **zero callers**, grade A) — both fixes are client-only.

**J7 — Comments read.** giscus embed (GitHub Discussions) on item detail; loads lazily below the fold; blocked third-party script → "comments unavailable" placeholder. Comments never gate any other journey. (Owner decision pending — see the comments design in this set; this doc only fixes the integration seam.)

**J8 — Write: star.** Guest clicks star → "Enable promptless edits" burner session (PR #39, merged) → one faucet drip → one TAG attestation. Requires the Sepolia faucet stood up (compose `faucet` profile + `FAUCET_CHAIN_ID=11155111` + `NEXT_PUBLIC_FAUCET_URL` baked at build — [verification-write-costs-and-gasless](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) §2: built and client-integrated, **almost certainly not deployed today**, grade B). Attester stays the visitor's burner — no shared relayer (v1 lens rule).

**J9 — Write: comment.** GitHub OAuth inside the giscus frame; the operator moderates in GitHub. Periodic archiver snapshots comment corpora into `/arcade` files on EFS (operator cron, §8).

**J10 — Submission → curation → publication.**
1. Contributor opens a PR against the data repo (add-game form pre-fills it), adding a **portable source manifest** entry + the game file.
2. CI: license check, single-file check, size, sha256, ASCII-safe name (SDK P1 canonicalization gap makes non-ASCII names risky — [verification-sdk-pr1](../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md) §6).
3. Curator review (F-Droid-shaped policy: objective criteria, anti-feature labels, label-don't-ban) + smoke-test tuple recorded.
4. Merge → fixed seeder `--execute` publishes to EFS under the content lens → receipt committed → site rebuild bakes the new manifest.

**J11 — Update/fork.** New bytes = new DATA UID + new mirrors; placement PIN supersedes in O(1) at the same slot (old DATA stays resolvable by UID). Fork = new slug with `forkOf`/`upstream` provenance in the manifest. No REDIRECT records in September (SDK redirect P1s unresolved; explorer has no follower).

**J12 — Correction / warning / unlisting.** Warning = anti-feature label in manifest + curator TAG on-chain. Unlisting = remove from manifest (site immediately) + curator revokes the placement PIN (chain view); interned PROPERTYs/DATA remain — permanence is honest: *unlisted, not erased*, and the item page says so.

**J13 — Export + second-operator reconstruction.** A stranger with the MIT frontend repo + committed receipts + public chain rebuilds the site: receipts name chain, UIDs, CIDs, signer, seeder commit; `git clone` → point at any Sepolia RPC + any IPFS gateway → `yarn build`. Demo-differentiator #3; #4 is the unchanged-rerun idempotence proof (§6).

## Capability table

Labels: works-today / exists-needs-integration / small-reversible-v1-change / new-arcade-app-schema / off-chain-operator-service / september-workaround / deferred / blocked-unknown / v2-only. **No capability needs `new-arcade-app-schema`** — everything rides the frozen nine + existing views; if review disagrees, that is a red flag against demo scope.

| # | Capability | Label | Grounding (corpus, grade) |
|---|---|---|---|
| 1 | Wallet-free guest reads | works-today | routes-and-links §2 (A): disconnected reads via publicClient by construction |
| 2 | Stable `/arcade` + `/arcade/<slug>` static routes | small-reversible-v1-change | routes-and-links §4 (A): pattern established 3× (explorer/blockexplorer/lists); one `_redirects` line |
| 3 | Playable file deep link | small-reversible-v1-change | routes-and-links §1 (A) + hands-on log (A): explorer deep link = empty grid today; arcade page owns the leaf view |
| 4 | Bounded catalog enumeration (on-chain listing) | works-today | execution-mirrors §3 (A): 15–50 items = 1–2 eth_calls, cursor pagination, scan budgets |
| 5 | Build-baked catalog manifest (zero-RPC browse) | small-reversible-v1-change | routes-and-links §5 (B): build script over data repo; no chain dependency |
| 6 | Item detail without execution | small-reversible-v1-change | execution-mirrors §1.2 (A): explorer auto-renders on select; arcade separates detail from Play |
| 7 | Fetch bytes (SSTORE2 chunks / gateway) | exists-needs-integration | routes-and-links §4 (A): `fetchFileContent` is already a pure util taking `{publicClient, lensAddresses, path}` |
| 8 | Verify bytes vs contentHash before execution | small-reversible-v1-change | execution-mirrors §1 (A): **absent** — zero callers of any verifier; insert at the fetch choke point + `getFilesAtPath` for `(dataUID, attester)`; no contract change |
| 9 | Mirror fallback ladder + per-mirror timeout | small-reversible-v1-change | execution-mirrors §2 (A): today 1 router-chosen URI, throw on `!ok`, no timeout; `getDataMirrors` reader already on-chain |
| 10 | Sandboxed execution (`allow-scripts`, no same-origin) | works-today | execution-mirrors §1.2 (A): both explorer render sites conform to ADR-0056 |
| 11 | Canonical `f1220` contentHash on chain for the catalog | small-reversible-v1-change (**launch-gated for catalog titles**) | contenthash-writers (A): 67 Sepolia values are 0x-keccak; the Week-3 seed re-binds canonical values for **every launch title incl. unchanged keepers** so on-chain PROPERTY is the launch verify source; full 67-file remediation stays optional |
| 12 | Rich cards from on-chain reads | deferred | execution-mirrors §3.4 (B): 70–210 sequential calls for 20 cards, no multicall anywhere; manifest makes it unnecessary |
| 13 | Multicall/http batching | deferred | execution-mirrors §3.3 (A): config-level change; only needed if #12 revives |
| 14 | giscus comments (read + write) | off-chain-operator-service | research-comments (owner decision pending); operator supplies repo + moderation |
| 15 | On-chain star via burner + drip | exists-needs-integration | write-costs §2 (A/B): PR #39 merged; faucet code done, **service not deployed**; one env + one container |
| 16 | Sepolia faucet stood up | off-chain-operator-service | write-costs §2 (B): compose profile + funded key (deployer holds 682 SepoliaETH, A) |
| 17 | EFS-native comments as primary loop | deferred | research-comments (A/C): cost fine (~0.9–1.2M gas/comment, write-costs §5) but no spam defense and no read indexer — ~100–150 raw eth_calls per 50-entry thread (Model B; 150–250 Model A), multicall-batchable to ~5–15 round trips but no batching exists anywhere today |
| 18 | Native "on-chain guestbook" (one flagship game) | exists-needs-integration (stretch) | write-costs §5 (B): PROPERTY+TAG measured unit costs; needs #15+#16 |
| 19 | Submission via GitHub PR + CI + curator review | september-workaround | curation design; osgameclones/F-Droid-shaped; migration to on-chain claims post-September |
| 20 | On-chain curation claims (curator LISTs) | deferred | LIST/LIST_ENTRY frozen and live; no September need |
| 21 | Update/fork via PIN supersession | works-today (primitive) / exists-needs-integration (tooling) | specs [overview](../../../contracts/specs/overview.md): O(1) supersession; seeder re-run is the tool |
| 22 | Unlisting via PIN revoke + manifest removal | september-workaround | games-deployment §2 (A): curator EOA controls placements; WHITEOUT not needed for own-lens removal |
| 23 | Receipts + second-operator reconstruction | small-reversible-v1-change | games-deployment §6 (A): **0/9 receipt elements committed today**; seeder must emit them (§6) |
| 24 | Unchanged-rerun idempotence | exists-needs-integration | contenthash-writers §4 (A): `decideSeedFileAction` exists but compares raw hash strings — format fix required or every file falsely re-seeds |
| 25 | Multi-file games (folder closure) | deferred | §7: profile-2 lane post-September |
| 26 | `data:` inline mirrors on Sepolia | blocked-unknown | write-costs §1 (A): `/transports/data` anchor absent on Sepolia; zero games ≤4KB anyway |
| 27 | Devnet 26001993 as a target | blocked-unknown | games-deployment §3 (A): no EFS core code at frozen addresses post-reset |
| 28 | Stable-URL forwarding across v2 schema supersession | v2-only | portable-ID story; scope the permanence claim honestly (Sepolia testnet + v1-as-evidence) |

## Data shapes: portable manifest vs v1 receipt layer

Two layers, never mixed. The **portable source manifest** (in the data repo, one entry per game) is chain-free — it must survive v2's planned schema/UID supersession and a second operator on a different chain. **No required chain values.**

```jsonc
// portable manifest entry (chain-free)
{
  "slug": "snake", "title": "Snake", "description": "…",
  "controls": "Arrow keys", "input": ["keyboard"], "tags": ["arcade","classic"],
  "license": "MIT",
  "provenance": { "upstream": "https://…", "author": "…", "forkOf": null, "forkChanges": null },
  "artwork": "art/snake.png",
  "file": "games/snake.html",
  "sha256": "808a2772…7746"          // bare digest of file bytes; f1220 prefix is an encoding, applied at seed time
}
```

The **v1 receipt/adapter layer** binds a manifest snapshot to one chain deployment, written by the seeder at `--execute` time and committed to `content/deployments/11155111/<dataset>.json` — the convention [verification-games-deployment](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §7 specifies (today's score: 0/9 elements committed; the tooling version of the June seed is permanently unrecoverable). Per receipt: chainId + EAS/Indexer addresses; anchor path + folder UID; per-file table (file-anchor UID, DATA UID, `f1220` contentHash, size, contentType, MIRROR UIDs + CIDs + upstream URIs, PIN/TAG UIDs); first/last block + tx hashes; signer + lens statement; **seeder git commit (hard-fail on dirty tree)** + exact invocation + env; pin custody + re-pin instructions; manifest sha256; idempotency note.

The site build consumes manifest + receipt; the receipt is the only place chain values live. Deleting every receipt leaves a valid, re-seedable dataset.

## Read/RPC budget and caching

Numbers from [verification-execution-mirrors-enumeration](../../Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md) §3.4 and [verification-write-costs-and-gasless](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) §6:

| Path | Cost | Plan |
|---|---|---|
| Stock explorer per visitor | ~45 block-watchers ≈ 3.75 req/s/tab; 100 visitors ≈ ~375 req/s (B) — the observed "Loading System…" failure | **Never serve the explorer to arcade guests** |
| Arcade catalog browse | ~0 RPC (baked manifest) + optional 1–2 eth_calls provenance | Cache provenance read per session |
| One Play (SSTORE2) | 1 eth_call per ~24KB chunk: 13/15 games = 1 chunk; dante 2; infernal-throne 9; +4 calls for verify resolution | Sequential is fine at this scale |
| One Play (IPFS mirror — the current Sepolia reality) | 1 router eth_call + 1 gateway fetch + 4 verify calls | Per-mirror timeout ~8s |
| RPC endpoint | Shared/public default is the predictable launch failure (A: observed 400s + `ERR_CONNECTION_CLOSED`) | Bake `NEXT_PUBLIC_SEPOLIA_RPC_URL` dedicated key at build |
| Caching | Explorer util: 50-entry/60s in-memory only | Verified bytes are content-addressed-immutable: cache post-verification with long TTL (memory + Cache API keyed by contentHash); never cache unverified bytes |

## Seeding plan (September)

Tool = the **fixed datasets seeder** (`seed-dataset.ts` lineage), not the SDK (SDK client unpinned for September; the arcade-pin patch is tracked in the reconciliation doc). Order, per [verification-contenthash-writers](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md) §4:

1. **Gate:** seeder emits `f1220`-sha256 + the `cid` PROPERTY (specs/10 §4.2); `decideSeedFileAction` compares digest-equivalence across formats so legacy keccak values don't force a false full re-seed. **No durable seeding before this lands.**
2. **Drift resolution first:** `datasets/web-games/` (seeded Jun 23) vs `content/datasets/web-games/` (edited Jun 26) differ in 6 games + manifest (A). Declare `content/` source-of-truth, reconcile with the new catalog decisions (drop tetris, TM renames, restore "Infernal Sigil"), then seed from it — one deliberate re-seed, not an accident of hash-format change.
3. **Seed + receipts:** `--execute --pin` from the curator EOA; receipt auto-written and committed to `content/deployments/11155111/`; also attest the upstream HTTPS mirrors the manifest lists (June run attested only the single IPFS mirror per file, A).
4. **Idempotence proof:** immediate re-run must plan all-skip (no re-pins, no txs) — committed as part of the receipt. This is demo-differentiator #4.
5. **`--rebind-hash` remediation (optional, no deadline):** ~134 attestations re-binding canonical `f1220` values (digests recoverable trustlessly from on-chain CIDv1 mirrors, A); old keccak strings stay interned but unbound (the ADR-0052-sanctioned outcome).
6. **Hygiene:** correct `FUTURE_WORK.md` framing, update stale trackers, refresh the stale specs snapshot inside `datasets/deploy/`.

Cost: ~11–13M gas/game (~0.013 ETH measured, A); 18-game catalog ≈ 0.25 SepoliaETH against 682 ETH deployer balance — funding is a non-issue.

## PlayablePackage seam

Internal client abstraction so multi-file support is additive, not a rewrite:

- **Profile 1 (September):** `{ profile: 1, entry: single index.html, contentHash, mirrors }`. Fetch → verify → `srcDoc`.
- Anything resolving to a folder or declaring multiple files → **clear "unsupported package" error** naming the profile, never a broken half-render.
- **Profile 2 (post-September lane):** folder closure — a manifest of member files each with its own contentHash, fetched and verified individually, assembled via a service-worker or inlining step, still `allow-scripts`-sandboxed. 2048 MAY arrive earlier as an inline-fork if the build spike proves it; that stays profile 1.

## Trust boundaries

| Layer | Chain guarantees | Operator supplies (single point of failure) |
|---|---|---|
| Catalog records | ANCHOR/DATA/PIN/PROPERTY attestations, non-revocable values, lens-scoped reads | Manifest baking, site build, domain + hosting |
| Bytes integrity | contentHash PROPERTY + CIDv1 mirror (digest verifiable by anyone) | Nothing — after J5 verification lands, a lying mirror/gateway is detected client-side. Residual: a lying **RPC** (out of scope for v1) |
| Bytes availability | Mirror URIs on-chain | IPFS pins on a **single VPS Kubo node** (A) + public gateways — one machine is the durability anchor; receipts carry re-pin instructions |
| Reads | — | Dedicated RPC key (baked); its outage degrades Play, not browse |
| Comments | Nothing (giscus) | GitHub Discussions + moderation; periodic EFS archiver snapshot is the durability hedge |
| Stars | TAG attestation by the visitor's own burner | Faucet service + funding key |
| Identity/permanence claims | Sepolia consensus — a **testnet**; say so plainly | Honest labeling; v2 portable-ID forwarding is the real answer (v2-only) |

## Open questions

- [ ] Escape or keep the root-layout EFS chrome on `/arcade` (root layout unconditionally wraps every route — routes-and-links §4)? Pathname-conditional Header/Footer vs accepting chrome.
- [x] Verify-source at launch — **resolved post-review: on-chain PROPERTY is the reference** (receipt as cross-check); M5 re-binds canonical values for all launch titles, so no legacy-tolerance path ships.
- [ ] Per-mirror timeout value and mirror-order policy (router ladder vs latency-first once verification makes order trust-irrelevant)?
- [x] Upstream mirrors — **resolved post-review: ≥2 attested mirrors per launch title is a must-have precondition of acceptance item 6** (the June seed attested exactly ONE ipfs:// mirror per file, so "kill the primary mirror" would otherwise be gateway rotation over one CID — a materially weaker claim). The Week-3 seed attests the HTTPS upstream (or a second pin location) alongside ipfs://; demo copy states whether a given fallback is a second mirror or a second gateway.
- [ ] Owner decision: comments hybrid (giscus + star) per this pass's recommendation — confirm or replace.
- [ ] Where does the giscus archiver run (cron on the VPS vs GitHub Action) and under which attester?
- [ ] `/arcade` domain + name (owner TBD) — affects `_redirects` and giscus origin allowlist.
- [ ] Sandbox: any launch title need `allow-pointer-lock`/fullscreen? (Current 15: no, grade B.)

## Pre-promotion checklist

- [ ] All Open questions resolved or explicitly deferred (cite where)
- [ ] **Target repos:** confirmed (no surprise repos at implementation time)
- [ ] **Depends on:** chain — all dependencies accepted or landed
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
