# EFS Arcade — unknowns and experiments ledger

**Status:** draft
**Target repos:** planning
**Depends on:** [[product-and-communities]], [[september-plan]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

> **Initial-pass ledger:** recut this list against the one-game Andromeda slice and the EFS 1.5 application-profile boundary in [[Designs/arcade/README]] before treating an item as current work.

One ledger for every load-bearing unknown. Rules: an unknown with a cheap test gets the test, not an owner question; owner-gated items live in [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]], not here. The T1–T7 recruitment experiments (thresholds + kill signal) are specified in the [communities lane](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md) §5 and referenced below.

Status legend: `open` · `testing` · `resolved(→where)` · `blocked(on)`.

| ID | Area | Unknown | Current belief | Falsifier | Cheapest test | Owner | Target | Status |
|---|---|---|---|---|---|---|---|---|
| U1 | product | Do guests return after novelty fades? | Doubtful — spiky link traffic, ~zero week-4 retention expected | **Privacy-compatible form (post-review):** returning-guest share, measured by a first-party local-only counter that self-reports an anonymous aggregate bucket ("nth visit: 1 / 2–3 / 4+") with no per-visitor server profile — the raw "≥20 distinct guests tracked across weeks" metric violated the no-surveillance rule as written. Falsifier: returning-share bucket ≈ 0 in weeks 3–6 (wider error bars accepted as the price of the privacy rule; the measurement design is disclosed on the about page and named as boundary-test-3 exception (b)) | Instrument at launch; 30-day readout | agents (build), James (read) | Oct 11 | open |
| U2 | community | Will named creators opt in with informed permanence? | Plausible for js13k alumni; unproven | 0/6 consequential Tier-3 grants (half of the recut kill signal; courtesy notes count toward nothing) | T1: 6 Tier-3 permission asks + courtesy notes, sent only after the D-gated consent template is approved | James sends | emails Aug 14; verdict Sep 15 | open |
| U3 | community | Does volunteer curation labor exist? | Unknown; Flashpoint proves the labor pool exists *somewhere* | 0 completed volunteer curations in 2 weeks (other half of kill signal) | T3: one honest call in r/opensourcegames + LibreGaming | James posts, agents prep | post-launch window | open |
| U4 | technical | Does the /arcade guest path hold on live Sepolia under load? | Yes with dedicated RPC + build-baked catalog; stock explorer observably fails | Spike can't render catalog+game reliably from clean browsers | G0 build spike + synthetic 100-visitor replay | agents | Aug 14 | testing (spike scheduled) |
| U5 | technical | Do all launch games actually run inside `sandbox="allow-scripts"` srcDoc (opaque origin, no localStorage)? | Yes for js13k-class canvas games; unverified per title | Any launch-list game breaks or silently needs storage/network | Smoke every candidate in the exact shipping iframe; record the tuple | agents | Aug 29 | open |
| U6 | content | Can the inline-fork pipeline produce 12–18 launch-quality games in the window? | Yes — each js13k dist ≈ hours | Pipeline yields <12 by G1 | Run pipeline on 3 games in Week 0; extrapolate | agents | Aug 14 | open |
| U7 | rights | Do final launch names clear a trademark registry pass? | Mostly — corpus grades B/C | Any live mark on a launch name | 1-hour USPTO TESS pass on the final list | agents draft, James eyeballs | Aug 30 | open |
| U8 | rights | Will PR-class authors grant written redistribution with permanence language? | Unknown; DR1V3N WILD author's other repos are GPL/MIT — likely | 0/6 Tier-3 grants | Include 6 Tier-3 asks inside T1 batch | James sends | Sep 15 | open |
| U9 | economic | Does free-tier RPC + caching survive 1k visitors/day? | Yes if browse is zero-RPC and game reads are cached | Rate-limit errors in launch telemetry | Synthetic load vs the baked key pre-launch; telemetry after | agents | Sep 5 | open |
| U10 | operational | Faucet drain rate on real Sepolia within caps? | Caps (0.01/drip, 0.03/addr, 20/min/IP) bound it; rotation accepted | Reserve floor hit in <1 week | Monitor first 2 weeks; documented kill switch | James (owns key) | Sep 25 | blocked(D6) |
| U11 | operational | giscus spam/abuse volume manageable solo? | Yes — GitHub OAuth friction + GitHub mod tools | >30 min/day moderation load sustained | Launch telemetry + moderation log | James | Oct 11 | blocked(D2) |
| U12 | product | Does the mirror-kill differentiator land with ordinary viewers? | Unknown — it's the whole EFS pitch | Test viewers can't restate why it mattered | Show the video cut to 3–5 normies; ask them to restate it | James | Sep 9 | open |
| U13 | technical | Sepolia gas spikes (>10 gwei days) breaking star/drip UX? | Occasional; drip buys 6–8 stars at 1.2 gwei, 10× fewer at spikes | Star failure rate >20% on launch week | Gas histogram check + graceful "come back later" copy | agents | Sep 5 | open |
| U14 | community | Does the D7 Sepolia answer survive technical-audience contact? | Untested — the #1 predicted objection | Top HN comment is "this is a grift/testnet lol" and sticks | T5: Show HN with the answer up front | James posts | post-launch | blocked(D7) |
| U15 | technical | Is the seeder's unchanged-rerun truly zero-tx after the hash fix? | Designed-yes; format change breaks naive compare (verified risk) | Second run emits any tx/pin | Double-run on fork, then live (acceptance item 14) | agents | Sep 3 | open |
| U16 | operational | Pin durability beyond the single VPS Kubo node? | SPOF today (verified) | VPS loss makes any mirror 404 | Add a second pin (Pinata free fits <500 files; count first) + document | agents | Aug 29 | open |
| U17 | v2 | Is a portable-ID forwarding story credible enough to promise stable URLs across the v2 recut? | Open — v2 reopens frozen-schema/portable-ID ground | v2 recut ships with no resolvable path for 2026 links | Named failing acceptance test routed in [[v2-pressure-and-migration]] | v2 designs (not Arcade) | — | open |
| U18 | product | Comment/star conversion: do guests *do* anything? | Unknown; T6 threshold ≥2% attempt, ≥50% complete | Below threshold in weeks 1–3 | T6 instrumentation on 5 game pages | agents | Oct 1 | blocked(D2/D6) |

## Standing experiments (from the corpus, run as designed)

- **T1** creator opt-in (recut: scored on the 6 consequential Tier-3 asks — ≥2 written grants = supply signal; courtesy notes tracked separately, non-scoring) · **T2** js13k organizer reply · **T3** volunteer curation (≥3 in 2 weeks) · **T4** r/WebGames single-game post (≥60% session-start; sentiment not distrust-dominated) · **T5** Show HN objection-shape · **T6** comment conversion · **T7** preservationist trust interviews (≥2/3 restate the permanence model accurately).
- **Kill signal (standing, recut post-review):** **0/6 consequential Tier-3 grants and zero curation-labor evidence** (T3 + the Week-0 Norman dry run) → the arcade has the wrong first community; trigger the PIVOT review regardless of traffic. (The original "T1 <2/15" mixed 9 costless courtesy notes into the denominator, which made both the pass and the kill nearly untriggerable — courtesy notes now count toward nothing.) **Timing caveat:** the corpus framed this as a pre-MVP gate; under this calendar it reads at/after launch — a knowing deviation recorded in [[september-plan]] §7, partially mitigated by the Week-0 Norman labor evidence.

## Open questions

- [ ] Confirm owners/dates once D1–D7 are ruled (several rows are `blocked(Dx)`).

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
