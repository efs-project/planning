# EFS Arcade — September 11 execution plan

**Status:** draft
**Target repos:** planning, contracts, content, sdk, devnet
**Depends on:** [[mvp-architecture]], [[catalog-plan]], [[curation-and-social]], [[player-security-model]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #repo/contracts #repo/content #repo/sdk #repo/devnet #topic/games #topic/arcade

Worked backward from **Fri 2026-09-11** with the verified repo state of 2026-08-07. Hard constraint: James is away **~2 weeks in the second half of August** (owner to confirm exact dates — assumed ~Aug 15–29 below) and is the sole reviewer, promoter, and outreach identity. The plan front-loads everything only James can do into **Week 0 (Aug 8–14)** and gives the away window to agent-executable build work.

## 1. The demo and the video story

One 3–4 minute video (plus the live site) that tells this story:

1. *"Here's a link a friend sent me"* — phone, fresh browser: `/arcade/<slug>` loads fast; art, controls, license, provenance visible; **no account, no wallet, no boot**. (Suite items 1–4.)
2. One **Play** click → fetch progress → *"verified ✓"* → the game runs. (Item 5.)
3. *"The host just died"* — kill the primary **attested mirror** live (a second attested mirror must exist — M5); Play again → the fallback mirror serves; **bytes verify identically**. Then the tamper demo: a corrupted mirror is **rejected before execution**. (Item 6.) **Honesty note:** these two beats are parity-with-baseline plus on-chain identity — a signed manifest + IPFS fallback can do them too; say so rather than oversell.
4. *"Nobody owns the shelf"* — **the EFS-only beat**: a second, clearly-labeled attester publishes a competing playlist/curation claim over the *same on-chain game identities*, live, without touching the operator's site or database — and a reader chooses that lens. (Item 19. If no genuine outsider exists by filming day, the second identity is disclosed as demo-operated; the *unprompted* version stays where it belongs, in validation-bar test 4.)
5. *"Who says this game is safe and fun?"* — the game page shows attributable curation: tested-state claim, license evidence, the curator's on-chain publication receipt. (Items 3, 10, 18.)
6. *"Anyone can rebuild this whole site"* — run the reconstruction script from public records on a clean machine; same catalog appears. (Item 16.)
7. Guest reads comments; stars the game via the one-click burner flow; the star count is on-chain. (Item 9; the star doubles as item 19 evidence.)
8. Honest close: what EFS guarantees vs what the current operator supplies (item 18); Sepolia scoped plainly per D7.

## 2. Scope

**Must-have (demo fails without):**
- M1 `/arcade` + `/arcade/<slug>` static routes, guest-fast (no scaffold boot storm; dedicated RPC baked) — [[mvp-architecture]]
- M2 File deep links actually play: explicit-Play page per game (fixes the verified deep-link dead end)
- M3 Verify-before-execute (f1220 sha-256) + mirror fallback ladder with timeouts + tamper rejection
- M4 Launch catalog 12–18 rights-clean games per [[catalog-plan]] (TM drops/renames executed; inline-fork pipeline for js13k builds)
- M5 Seeder contentHash fix (**the gate** — [reconciliation step 1](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md)) + content/-vs-seeded drift resolved + re-seed with **≥2 attested mirrors per launch title** (June attested exactly one; item 6's fallback demo is meaningless without a second — adversarial-review finding, accepted) + **canonical `f1220` re-bind for every launch title including unchanged keepers** (so on-chain PROPERTY is the verify source) + **committed receipts** + idempotent re-run proof (items 13–14)
- M6 Comments read path per the owner's D2 choice (default: giscus embed) + permanence-honest write path
- M7 Curation workflow exercised end-to-end on ≥1 real candidate (Norman the Necromancer) with all artifacts captured (items 10–12)
- M8 Rights/complaint/unlisting process published ([[rights-safety-and-operations]]) + "what EFS guarantees vs operator supplies" page (item 18)

**Should-have:** S1 on-chain star via burner (needs Sepolia faucet stood up — env + container, no new code); S2 reconstruction script packaged for a stranger; S3 mobile polish pass ≥40% touch-playable; S4 unsupported-package error lane (item 20); S5 `--rebind-hash` remediation of the 67 legacy hashes.

**Stretch:** X1 native "on-chain guestbook" on one flagship game; X2 2048 inline-fork attempt; X3 study-collection page for the straker set; X4 `/transports/data` anchor on Sepolia.

**Explicitly later:** folder-bundle (multi-file) lane; emulation; multiplayer; ratings/achievements; app-store anything; native comments as primary loop; devnet redeploy; SDK as the runtime dependency (the arcade-pin patch proceeds as its own PR thread).

## 3. Calendar and critical path

**Week 0 — Aug 8–14 (James present; decisions + sends + spike).**
- James (≤1 day total, batched): rule on [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]] D1–D7 (comments approach, name/domain, catalog TM actions, GO framing, remediation approval, faucet, Sepolia wording); buy domain; **approve the T1 consent template** (drafted by agents to the rights doc's §1.4 informed-permanence bar — no send before the template is approved; counsel once-over or an explicit owner risk-acceptance recorded), then send the T1 creator-permission emails (6 consequential Tier-3 asks + courtesy notes, honestly worded per [[catalog-plan]] §6); T2 js13k is a **short awareness note only** — the jam runs ~Aug 13–Sep 13, so the partnership ask waits for post-jam with the live site attached; check FUTO status (already submitted 2026-07-29 — monitor, don't resend); confirm away dates.
- Agents: **build spike** proving M1+M2+M3 skeleton on the live chain (this is GO condition 2 — result before James leaves); seeder fix + drift resolution PR (M5 groundwork); catalog pipeline scaffold on 3 games (U6); curation repo + policy drafts; **run the receipts-free Norman exercise** (curation steps 1–5 and 7 — steps 6/8 are blocked on D4/M5 and marked deferred) so Tier-3 yeses land in a demonstrably working pipeline and one kill-signal input (T3-adjacent labor evidence) exists pre-launch.
- **Gate G0 (Aug 14):** spike verdict + decisions recorded + Norman dry-run artifacts exist. If the spike fails its week, RESIZE now (see §6).

**Away window — ~Aug 15–29 (agents build; nothing public happens).**
- Catalog production: inline forks + provenance + smoke tests for the 12–18 list; artwork/fallback cards.
- M6 comments integration per D2; S1 faucet + star (code side); M7 curation dry-run artifacts; M8 policy pages; S2 reconstruction script; acceptance-suite harness (items 1–20 as a checklist with evidence links).
- Every PR lands on branches; James reviews asynchronously only if he chooses — the plan does not depend on it.
- **Gate G1 (Aug 29):** all must-haves code-complete on branches; acceptance items 1–8 pass on a staging build.

**Week 3 — Aug 30–Sep 5 (James back; integrate + seed).**
- James reviews/merges the branch stack (his real bottleneck — budget ≥2 days); executes D5: seed run with fixed seeder → receipts committed → idempotence re-run → optional S5 rebind.
- End-to-end acceptance run on the deployed site (fresh iOS Safari + Android Chrome, items 1–20); fix list.
- **Gate G2 (Sep 5):** ≥17/20 acceptance items passing with evidence; allowed misses per the protected-set rule in §5 (never 4–7, 20, or 13–16).

**Week 4 — Sep 6–11 (polish + video + launch).**
- Polish + copy + honest-limits page; record the §1 video; publish site + video **Sep 11**.
- First distribution tests only after launch, per [[product-and-communities]] §5: one r/WebGames game post (T4), Show HN when the Sepolia answer is rehearsed (T5). No spray.

**Critical path:** D-decisions → seeder fix → catalog production → seed+receipts → acceptance → video. The one human bottleneck is James's Week-3 review block; everything else parallelizes to agents.

## 4. Who does what

- **Only James:** owner decisions; domain/brand; all outreach sends (his identity, T1/T2/FUTO); merge approvals; the seed execution from the curator EOA; the video voiceover; launch posts.
- **Agents/contributors:** all build work above; catalog forks + tests; policy drafts; acceptance harness; receipts tooling; reconstruction script; draft outreach copy for James to send.

## 5. Weekly evidence gates

| Gate | Date | Evidence required | Miss → |
|---|---|---|---|
| G0 | Aug 14 | Spike plays a verified game from Sepolia via /arcade route; D1–D7 recorded; consent template approved; sends out; Norman dry-run artifacts exist | RESIZE scope now |
| G1 | Aug 29 | Must-haves code-complete; items 1–8 pass on staging | Cut S-items, then RESIZE order |
| G2 | Sep 5 | ≥17/20 acceptance (suite in §8) with evidence; seed receipts committed. **The allowed misses may never include the protected set:** play gate (4), verified Play (5), tamper+fallback (6), sandbox probes (7), unsupported-package fail-closed (20), or the receipts/portability block (13–16) | Slip launch ≤1 week before cutting M3/M5 — never ship unverified Play |
| G3 | Sep 11 | Site + video public; funnel instrumented | — |

## 6. Go / resize / pivot / stop

Adopted from [[product-and-communities]] §6 verbatim. Operational additions: RESIZE order is curation-UI → comments-write → star; **never** the guest fast path, verified Play, or receipts. A launch slip of ≤1 week is preferred over shipping any security or receipts miss. PIVOT/STOP reviews are calendared at launch+30 and launch+60 against the 7-test validation bar.

## 7. Demo-scope honesty (post-adversarial-review)

The corpus's GO-AS-DEMO-ONLY definition was "no community claims, no launch marketing beyond a share test." This plan **adds back**: a brand + purchased domain, Open Collective/GitHub Sponsors rails, the published complaints process, a funded public faucet, the r/WebGames + Show HN posts, and a weekly content cadence. Each is defensible (the rails cost ~nothing and take weeks to stand up later; the posts *are* the recruitment tests T4/T5; the cadence *is* the U1 retention experiment) — but together they incur most costs of a product launch under a label that pre-discounts bad results. So they are enumerated in D1 as explicit owner choices, and one outcome is **pre-registered as disconfirming even at demo scope**: *if, 30 days after launch, the guest funnel shows near-zero repeat visits AND zero unprompted outside contributions of any kind (game, comment, playlist, mirror, correction) despite T4+T5 having run, the demo has failed its purpose and the PIVOT/STOP review runs early* — "it was only a demo" is not an accepted defense against that result.

**Kill-signal timing caveat (accepted deviation):** the corpus framed the T1+T3 kill signal as a *pre-MVP* gate; under this calendar T1's verdict (Sep 15) and T3's call land at/after launch. This is a knowing deviation — partially mitigated by the Week-0 Norman dry run (labor evidence) — and the kill signal converts to an early-PIVOT trigger rather than a launch blocker. Stated here so nobody discovers it as a surprise.

## 8. Acceptance suite (canonical — all item numbers everywhere refer to this list)

1. A fresh iOS Safari or Android Chrome visitor follows a direct link and sees a useful catalog or game page without login, wallet, KEL, signing prompt, or full OS boot.
2. The page looks intentionally designed for games, not like a raw file explorer.
3. Every game card exposes title, description, artwork or fallback, tags, controls, device/input compatibility, source, license, and tested state.
4. Opening the page never executes game code.
5. One intentional Play click performs fetch, digest verification, and launch — in that order.
6. A tampered mirror is rejected before execution, and a valid alternate mirror can succeed (requires ≥2 attested mirrors — M5).
7. A hostile fixture cannot access parent DOM, client storage, wallet, EFS writes, top navigation, or undeclared network destinations.
8. Exit and restart controls remain outside game-controlled pixels and work during play.
9. A visitor can read bounded comments without an account and write through the selected identity path.
10. A real candidate proceeds through the selected curation workflow and appears in the default catalog.
11. A broken, duplicate, malicious, or rights-questionable candidate is handled coherently (reason classes, labels, unlisting).
12. Modified artifacts preserve upstream identity, license, patch/build evidence, and resulting digest.
13. Deployment receipts identify chain, path/curator lens, UIDs, CIDs and mirrors, transactions, blocks, signer, and tooling version.
14. An unchanged publication rerun performs no unnecessary pins or transactions.
15. Portable manifests contain no required v1 chain address or UID.
16. A second operator can understand and reconstruct the catalog without an undocumented EFS-operated database.
17. At least one prospective outside curator and several ordinary players can use the product without coaching.
18. The demo explains what EFS guarantees separately from what the current Arcade operator supplies.
19. At least one EFS-specific contribution, curation, mirror, test, or reconstruction behavior is visibly demonstrated (the curator-plurality beat is the strongest form).
20. Multi-file games fail with a clear unsupported-package result unless an explicitly experimental lane is enabled.

(Player-security's extra integrity sweep is tracked as **A1** in [[player-security-model]] §7 — an addition, not a renumbering.)

## 9. Contingencies

- **Spike fails on RPC reliability** → same-origin caching proxy on the devnet VPS in front of the dedicated key (half-day, [[mvp-architecture]] trust table).
- **Faucet stand-up slips** → S1 star degrades to "stretch"; comments (giscus) unaffected; demo item 9 still passes via giscus.
- **Catalog production runs behind** → launch floor is 12 games; the js13k inline pipeline is the buffer (each additional game ≈ hours, not days).
- **A rights question emerges on a launch game** → drop it; the floor has slack; never launch with an unresolved rights flag (STOP trigger otherwise).
- **James's away window moves** → G0 scope is date-anchored to *departure*, not Aug 14; recompute gates from the confirmed dates.

## Open questions

- [ ] Exact away dates (recomputes G0/G1).
- [ ] D1–D7 rulings (→ [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]]).
- [ ] Whether the Devcon talk wants a live demo or the video (affects week-4 polish priorities only).

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
