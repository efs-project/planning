# EFS Arcade — launch catalog plan

**Status:** draft
**Target repos:** planning, content
**Depends on:** [[playable-archive-requirements]], [[curation-and-social]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/content #topic/games #topic/arcade

Scope note: everything here is a **proposal of this pass** under the CONDITIONAL GO / demo-scope frame (labeled public demo on the v1 Sepolia stack, 2026-09-11), not an owner ruling. The corpus grades cited below: A = primary verified, B = strong secondary, C = uncertain.

---

## 1. Inclusion policy — the objective half (quality bar)

From [research-catalog-candidates-and-rights.md](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §5. All seven must hold for a game to enter the arcade catalog (F-Droid-style: objective criteria first, human review second — see [[curation-and-social]]):

1. A stranger plays **≥2 minutes** unprompted.
2. Comprehensible in **≤10 seconds** without instructions.
3. Has a **score/goal/failure state and restart**.
4. Works on **touch**, OR is explicitly badged **desktop**.
5. **License permits rehosting** (clearly-redistributable / redistributable-with-notices), notices preserved.
6. Name clears a **trademark sniff test** (registry pass before launch — corpus grade B/C on individual marks, ~1 hr USPTO TESS check outstanding).
7. Loads **<5 s on 4G**.

Catalog size target: **12–18 games** (below ~10 looks like a demo; above ~20 dilutes curation and breaks the September clock — corpus §5). Target mix: **≥40% touch-playable** (majority-mobile traffic; only 1 of the current 15 has touch handlers — corpus §1, grade A).

## 2. Launch list proposal (this pass)

Actions: **keep** = already seeded, stays · **inline-fork** = license-permitted single-file build via the pipeline in §5 (MIT/Unlicense js13k dist builds only) · **build-then-verify** = must build from source first, then pipeline · **stretch** = attempt, cut without guilt · **deferred** = post-September folder-bundle lane. Size class: XS ≤20 KB · S ≤64 KB · M ≤256 KB (inlined single file). Licenses grade A (license file / GitHub API read) per corpus §3 unless noted.

| # | Game | Action | Input | Size | License | Provenance source |
|---|---|---|---|---|---|---|
| 1 | Dante | keep (flagship) | keys + **touch** | S | MIT | content/ (js13k 2022 winner) |
| 2 | Tiny Yurts | keep | pointer/**touch** | XS | MIT | content/ (js13k 2023 4th) |
| 3 | Infernal Sigil | keep, **rename back** from "Infernal Throne" (restore upstream name; local rename muddies provenance) | keys — **desktop** | M | MIT | content/ (js13k 2022) |
| 4 | Norman the Necromancer | inline-fork (dist in js13kGames org mirror; author repo has no committed dist) | mouse+keys — verify touch, else **desktop** | XS–S | **Unlicense** | danprince repo + org mirror (js13k 2022 2nd) |
| 5 | Casual Crusade | inline-fork | mouse/**touch** | XS–S | MIT | anttihaavikko (js13k 2023 3rd) |
| 6 | 13th Floor | inline-fork if org-mirror dist exists, else build-then-verify | keys/mouse — **desktop** | XS–S | MIT | roblouie (js13k 2024 winner) |
| 7 | Witchcat | inline-fork | keys — **desktop** | XS–S | MIT | jonathan-vallet (js13k 2025 3rd) |
| 8 | 13 Steps to Escape | inline-fork | keys — **desktop** | XS–S | MIT | jonathan-vallet (js13k 2024 4th) |
| 9 | Q1K3 | inline-fork | keys+mouse — **desktop-only** | XS–S | MIT + zlib (Sonant-X) | phoboslab (js13k 2021 viral) |
| 10 | Underrun | inline-fork (repo-root playable, small multi-file) | keys; touch controls reported [C — verify] | S | MIT + zlib | phoboslab |
| 11 | Astray | stretch inline-fork (non-js13k folder, vendored Three.js/Box2D; defer to folder lane if inlining balloons) | keys — **desktop** | M+ | Unlicense | wwwtyro |
| 12 | 2048 | **stretch** folder→inline attempt (owner-frame allowance: only if the spike proves it) | keys + **swipe** | S | MIT | gabrielecirulli — THE anchor title |
| 13 | Hextris | **class U until its actual LICENSE file is read** (GitHub API returns NOASSERTION; only the README says GPL — grade B; per the rights policy U = treated as permission-required, nothing published). Minutes of work to resolve; if GPL confirms, build-then-verify fork stripping the CDN calls **and publish our pinned modified source tree** (see GPL note below) | **touch**/keys | S | U → likely GPL-3.0 | Hextris/hextris |
| 14 | Super Castle Game | build-then-verify fill (GPL: ship license + source link) | keys/pointer [C] | S | GPL-3.0 | mvasilkov (js13k 2023 7th) |
| — | A Dark Room | **deferred** — folder lane (MPL-2.0 file-level notices; cult classic, mobile-perfect) | all (text) | folder | MPL-2.0 | doublespeakgames |
| — | Sandspiel / Orb.farm | **deferred** — folder lane (WASM; stub upload backend) | **touch** | folder | MIT | maxbittker |
| — | HexGL | **deferred** — folder lane (tens of MB of assets) | keys/touch | folder | MIT | BKcore |

Touch math on the live candidates: Dante, Tiny Yurts, Casual Crusade, 2048(stretch), Underrun[C], Hextris(**now class U** — cannot be counted until its license resolves) = **4–6 of 12–14** — the ≥40% target is *at risk*, not held: it needs Underrun's touch to verify AND (2048 or a resolved Hextris) to land. If both slip, promote a deferred touch title or pull a Tier-2 touch fill (hello wordl, MIT — never marketed as "Wordle") before cutting the touch bar. Desktop-only games get an explicit badge (bar #4), never silent mobile breakage.

**GPL/AGPL note (post-review, supersedes the "license + source link" shorthand):** for any *modified* GPL/AGPL conveyance (Hextris-if-confirmed, Super Castle Game, Slay the Web forks), a link to upstream is **not** the Corresponding Source of the modified version — the arcade must publish its own pinned modified source tree (the fork repo at the exact commit, referenced in manifest + receipt) and accept the ongoing source-availability duty for as long as it conveys the object form. The permanence angle sharpens this: bytes may be served indefinitely, so the source tree must be similarly durable (same repo, same pinning posture). The prior open question on GPL sufficiency is resolved in this direction.

Seeding cost is a non-issue: ~11–13M gas ≈ 0.013–0.015 ETH per game on the measured IPFS-mirror path, vs 682 SepoliaETH in the deployer ([verification-write-costs-and-gasless.md](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) §1, §3, grade A). No game fits the 4 KB `data:` inline cap and Sepolia lacks `/transports/data` anyway — all launch titles are IPFS-mirror (+ optional SSTORE2 later).

## 3. Existing-15 disposition

Per corpus §1–2 (grade A local reads; TM grades A for Tetris/Doodle Jump, B/C for the rest pending registry pass):

| File(s) | Disposition |
|---|---|
| dante.html, tiny-yurts.html | **Keep** in arcade catalog (launch #1–2) |
| infernal-throne.html | **Keep, rename** to upstream "Infernal Sigil" (launch #3) |
| tetris.html | **Drop from every public catalog** — name AND look-and-feel exposure (*Tetris Holding v. Xio*, grade A); renaming does not clear a faithful clone. Exclude from arcade and study collection both. **And stop distributing it ourselves** (post-review): unpin from the operator's Kubo node and revoke the curator's own MIRROR attestation + placement PIN — manifest removal alone leaves the operator serving the highest-risk file from his own infrastructure. On-chain attestation *values* are immutable and stay; the operator's own distribution and bindings end. Same unpin+revoke treatment for any other dropped TM-risk file. |
| doodle-jump, frogger, bomberman, puzzle-bobble, breakout, missile-command, pong | TM-risk names (Lima Sky / Konami / Taito / Atari). **Not in arcade** (weak tutorial demos anyway). If retained in the study collection, **rename to generic mechanical names** at re-seed time (e.g. "brick-blast", "hopper", "road-crosser"). |
| snake, helicopter, sokoban, block-dude (+ renamed set above) | **Study collection**: relabel the straker tutorial set as a labeled "how games are made — study collection" **dataset outside the arcade catalog** (own path, own manifest, honest framing as teaching demos). Sokoban: verify level-pack provenance before inclusion [C]. Block Dude: rename if kept. |

This keeps the arcade's "genuinely fun games" promise honest (3 of 15 survive it — corpus bottom line) without discarding the corpus or its on-chain history.

## 4. Source-of-truth resolution (content/ vs seeded datasets/ drift)

Verified state ([verification-games-deployment.md](../../Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md) §4, grade A): the Jun-23 seed ran from the `datasets/web-games/` staging copy; `content/datasets/web-games/` was edited Jun-26; **6 games differ** (bomberman, doodle-jump, frogger, infernal-throne, pong, tetris) plus README and manifest — **on-chain bytes are the pre-fix versions**. Zero receipts committed anywhere (0/9 on the corpus scorecard).

Proposed process (this pass):

1. **`content/datasets/web-games/` is canonical.** The `datasets/` staging copy is a build input, never hand-edited; a manifest sha-256 digest in the receipt makes drift mechanically detectable.
2. **No re-seeding until the seeder contentHash fix lands** — the datasets-seeder fix is THE gate before any further durable seeding (reconciliation order in [verification-contenthash-writers.md](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md); the live /games PROPERTYs carry keccak256, not canonical `f1220<sha256>`, grade A).
3. After the fix: **re-seed only the changed + renamed files** (new DATA + MIRROR + canonical contentHash). Old DATAs remain on chain (immutable by design); the file anchor is **superseded via re-PIN** to the new DATA — the standard replace flow. Dropped titles (tetris, pong) get no new PIN and no manifest entry.
4. **Every seed run emits a committed receipt** (`RECEIPT.md` next to `manifest.json`, machine-generated per the 9-element convention in verification-games-deployment §7: chain, UIDs, per-file contentHash+algorithm, txs/blocks, signer, **seeder git commit — hard-fail on dirty tree**, pin custody, manifest digest, idempotency note). The Jun-23 run's tooling version is permanently unrecoverable; that mistake is not repeated.
5. Unchanged files are skipped by the seeder's existing idempotence plan — this re-run doubles as the **unchanged-rerun idempotence** differentiator demo (no re-pins, no re-txs).

## 5. Inline-fork pipeline spec

Purpose: turn js13k dist builds into single-file `PlayablePackage` profile-1 entries with full provenance. This is a **license-permitted fork with notices**, not scraping.

**Eligibility (all required):** license permits modification + redistribution (September: **MIT or Unlicense only**; GPL titles go build-then-verify with license + source link shipped); upstream has a dist build (author repo or js13kGames org mirror) at a pinnable revision; no server dependency.

**Steps (per game):**
1. Fetch upstream dist at a **pinned commit SHA** (never a branch tip).
2. Inline sibling JS/CSS into `index.html`; embed images/audio/fonts as `data:` URIs. No external requests may remain.
3. **Offline verification:** the file runs from a local static serve with network disabled; zero outbound requests (this is also the sandbox-iframe compatibility check — `allow-scripts` only, per [[playable-archive-requirements]]).
4. Prepend an HTML comment header: title, author, upstream repo URL, commit SHA, SPDX license + full license text, transform description ("inlined from dist, no logic changes"), pipeline version.
5. Compute sha-256 → canonical `f1220<sha256>` contentHash (post-fix seeder only, §4.2).
6. Emit a **portable manifest entry**: name, slug, author, license, upstream URL + SHA, input badges (touch/keys/mouse, desktop-only flag), size, contentHash, mirrors. The manifest is what a second operator rebuilds from.

Anything failing step 3 falls out of September scope (folder lane) — no exceptions, no `allow-same-origin` workarounds.

## 6. Tier-3 permission-required outreach — the first community-curation campaign

Targets (no license granted; authors plausibly amenable — corpus §3 Tier 3, grade A on "no license" reads): **CLAWSTRIKE** (Rémi Vansteelandt — js13k 2025 winner), **DR1V3N WILD** (Frank Force — his other games are GPL/MIT), **Ghosted** (Jani Nykänen), **Coup Ahoo** (Antti Haavikko — his 2023 entry is MIT), **The Way of the Dodo** (Jesper Rasmussen), **Onslaught Arena** (Lost Decade Games).

- **James sends personally** (shared-account norms don't apply here; author trust is the asset), **only after the D-gated consent template is approved** (rights doc §1.4 informed-permanence language; a "sure, go ahead" without the disclosure does not qualify and would burn the only pre-launch outreach cycle on re-consents). Template + tone per the honest-pitch rules in [research-communities-and-outreach.md](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md) §6.1: permanence + provenance + attribution, chain stated plainly (js13k ran a NEAR/IPFS category — the one non-crypto-averse beachhead, grade A).
- **Opt-out promise, worded honestly (post-review — the <48h clock was unrunnable with the sender away):** *"Nothing of yours is published before September; any removal request is honored before publication, and always within 48h of my return (back Aug 30). After publication, removal means permanent unlisting from our catalog — published bytes cannot be deleted (see the rights policy)."* Hard rule: **no courtesy-note title is seeded until its author's response window has closed.** Never use the corpus's "want yours added or removed?" phrasing — it implies a deletion the architecture cannot perform.
- **Timing:** send by **Aug 14**; the away window is the response window; process replies Sept 1–5.
- **Thresholds (post-review recut — the corpus's 15-contact framing mixed consequential and costless asks):** the pass/kill metric is the **6 consequential Tier-3 permission asks** (U8): **≥2 written grants = supply signal; 0/6 grants AND zero curation-labor evidence (T3/Norman) = kill signal.** Courtesy-note responses (the other ~9 contacts) are tracked separately as a process metric and count toward nothing.
- Pipeline precondition, made schedulable (post-review): the **receipts-free Norman dry run (curation steps 1–5, 7) lands in Week 0 before any send**; the receipts steps (6, 8) are explicitly deferred to the Week-3 seed and the outreach email says a yes lands in a working intake pipeline with publication in early September.

## 7. Post-launch cadence

- **One verified game per week** through October — this is the retention experiment (does a stable catalog with a heartbeat bring players back?), and it keeps the curation workflow warm rather than a launch-day one-off. Supply: Tier-2 fills (hello wordl, Slay the Web, Clumsy Bird), Tier-3 yeses, r/opensourcegames submissions.
- **Folder-bundle lane is the #1 unlock.** Every household-name open web game is a multi-file folder (10/10 of the marquee non-js13k titles — corpus §4, grade A); the corpus verdict is that **2048 + A Dark Room alone likely outdraw everything else combined**. The lane (multi-file PlayablePackage profile, folder anchoring, MPL notice handling) is the first post-September content feature, feeding A Dark Room, Sandspiel, Orb.farm, HexGL, 2048-if-the-stretch-missed.
- Registry pass (USPTO TESS) on all final launch names before the site is public — closes the grade-B/C trademark holes.

## Open questions

- [ ] 2048 stretch: does the build spike prove folder→inline for 2048 specifically, or does it wait for the folder lane? (Owner call once spike results exist.)
- [ ] Underrun touch controls: verify on a real phone (grade C claim) — the ≥40% touch target leans on it.
- [ ] Study collection: keep the renamed TM-risk demos at all, or ship study collection as straker-tutorial-only (snake/sokoban/helicopter/block-dude) and drop the rest entirely?
- [ ] Sokoban level-pack provenance (original 1982 Thinking Rabbit levels are copyrighted) — verify before study-collection inclusion.
- [x] GPL fills — **resolved post-review: ship the pinned modified source tree** (see the GPL/AGPL note in §2); "license + source link" alone is insufficient for modified conveyance.
- [ ] Q1K3's name: does "Q1K3" (evoking Quake) clear the trademark sniff test, or does it need the same rename treatment? Include in the TESS pass.
- [ ] Tier-3 send date vs site readiness: is a demo page (not the full arcade) enough context to attach to the Aug-14 outreach emails?
- [ ] Who runs the USPTO TESS pass and by when (est. 1 hr)?

## Pre-promotion checklist

- [ ] All Open questions resolved or deferred
- [ ] Target repos confirmed
- [ ] Depends on chain accepted
- [ ] No AGENT-Q comments remain
- [ ] One review round completed
