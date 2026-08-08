# EFS Arcade — owner decision inbox

**Status:** reference — initial packet held for post-pass reconciliation
**Target repos:** planning
**Depends on:** [[product-and-communities]], [[september-plan]]
**Last reconciled:** 2026-08-08 — merged to main; original questions held

#status/reference #kind/decision #repo/planning #topic/games #topic/arcade

The one canonical decision queue for the Arcade design set. Everything here is **asked, not adopted**; rulings get recorded per [[Onboarding/authority|authority]] and propagated. Questions research can answer are *not* here — they live in [[unknowns-and-experiments]].

> **Reconciliation hold (2026-08-08 / @pm):** do not ask D1–D7 as a batch. Later validation and James's direction changed their shared premises: Arcade is a possible founding-product pilot; Andromeda replaces Norman for the first slice; the launch proof is one game with no durable EFS write; and client placement plus runner/network permissions are unresolved. Preserve these questions as the initial-pass inventory, then recut only the decisions that still block the one-game slice.

## Decide now (target: before the away window, ~Aug 14)

### D1 — Ratify the scope: demo, not product (blocks all labeling, marketing, and gate math)
- **Why you:** it sets every public claim and the success metric; agents cannot rule on EFS's public posture.
- **Options:** **A** GO-AS-DEMO-ONLY with the GO upgrade conditions (evaluated **Sep 15**, when T1 evidence exists — an Aug-21 check was calendar-impossible) and weekly gates (**rec**) · B full product bet now · C pause Arcade (wiki first).
- **Also inside A (enumerate, don't smuggle):** this plan adds several things beyond a bare demo — brand + domain, OC/GitHub-Sponsors rails, Show HN + r/WebGames posts, weekly content cadence, a public faucet. Each is listed with its justification in [[september-plan]] §7, along with **one pre-registered outcome that counts as disconfirming even at demo scope** (30 days: near-zero repeat visits AND zero unprompted outside contributions → early PIVOT/STOP review). Approving A approves that list and that tripwire.
- **Evidence:** [[product-and-communities]] §§1–2, 6 — your own red team demoted the "playable commons" shape; the demo path is the only Sept-11-feasible one. Uncertainty: demand side is untested either way.
- **Reversible default if silent:** A. **Cost of delay:** every day unruled, agents build against an unlabeled target. **Deadline:** Aug 14 (G0).

### D2 — Comments approach (blocks away-window build)
- **Why you:** you said basic comments are part of the September product; the evidence recommends modifying that — your call, explicitly.
- **Options:** **A** giscus (GitHub Discussions) launch loop + one-click on-chain star + periodic EFS archiver (**rec**) · B Bluesky thread embed · C EFS-native as primary loop · D read-only launch.
- **Evidence:** [comments lane](../../Reviews/2026-08-07-arcade-corpus/research-comments-approaches.md) — native-as-primary fails Sept 11 on three grounds: zero-cost Sybil spam with the sole moderator away two weeks; no read indexer (50 comments ≈ 100–150 raw unbatched RPC calls, batchable to ~5–15 round trips but no batching exists in the stack today); permanent free-text from strangers is a legal/abuse exposure deserving a deliberate decision. The write *identity* path (burner) is credible today — it's spam, reads, and abuse that aren't. C's honest cost: ~6–9 focused days plus those risks.
- **Reversible default:** A (giscus is designed-reversible; the archiver makes the corpus durable; migration path documented). **Cost of delay:** M6 slips into Week 3. **Deadline:** Aug 14.

### D3 — Catalog rights actions (blocks catalog production)
- **Why you:** removing/renaming published works and demoting the straker set is a public-facing content policy act.
- **Ask:** approve (a) removing `tetris.html` from any public catalog (name **and** look-and-feel exposure per *Tetris v. Xio*) **and ceasing our own distribution of it — unpin from the operator's Kubo node + revoke the curator's own MIRROR/PIN** (post-review addition: manifest removal alone leaves us hosting the highest-risk file); (b) renaming/dropping puzzle-bobble, doodle-jump, frogger, bomberman, breakout, pong, missile-command, with the same unpin+revoke for any dropped file; (c) relabeling the 11 straker tutorials as a "study collection" outside the arcade; (d) restoring "Infernal Sigil"'s upstream name.
- **Evidence:** [catalog lane](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §§1–2 (grade A/B; USPTO pass still owed). Interned on-chain values stay (immutable); our bindings and our distribution end.
- **Reversible default:** do all four. **Deadline:** Aug 14.

### D4 — contentHash reconciliation execution (blocks the seed run)
- **Why you:** it re-binds durable Sepolia data (~134 attestations from the curator EOA) and supersedes an Accepted SDK ADR — both authority-gated acts.
- **Ask:** approve (a) the seeder fix to canonical `f1220` + digest-equivalent idempotence (**the gate** before any further durable seeding); (b) the debug-UI writer fix; (c) superseding SDK ADR-0006 per the ["arcade-pin patch"](../../Reviews/2026-08-07-arcade-corpus/verification-sdk-pr1.md); (d) the optional `--rebind-hash` remediation of the 67 legacy values during the Week-3 seed.
- **Evidence:** [hash-writers lane](../../Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md) — contamination verified on-chain; remediation digests recoverable trustlessly from the CIDv1 mirrors; FUTURE_WORK's "not a permanent-data emergency" framing is falsified.
- **Reversible default:** (a)+(b) now, (c) as its own PR thread, (d) in Week 3. **Deadline:** hard gate = before the Week-3 seed run. *(Status note, 2026-08-07 late: (c) is already in flight — a concurrent SDK session's working tree implements the `f1220` writer/verifier and adds ADR-0016 superseding ADR-0006; confirm it lands, then (c) needs no separate action.)*

### D5 — Name and domain (blocks brand, domain purchase, giscus repo)
- **Why you:** brand is yours; Form B (separate brand) is the recommended institutional shape.
- **Options:** lunch floated "Forever Arcade"/"Infinite Arcade". Caution from this pass: a name that *promises permanence* sharpens the Sepolia-testnet objection — prefer charm over eternity-claims. "EFS Arcade" as the public name is **not** recommended (couples EFS's neutrality to one catalog's choices).
- **Reversible default:** none — a name needs you. Working title stays "Arcade" internally. **Cost of delay:** domain, giscus repo, and video script all wait. **Deadline:** Aug 14.

### D6 — Stand up the Sepolia faucet (blocks the on-chain star)
- **Why you:** it runs your infrastructure and spends deployer ETH on strangers (0.01/drip, 0.03/address lifetime; deployer holds 682 SepoliaETH — verified).
- **Evidence:** [write-costs lane](../../Reviews/2026-08-07-arcade-corpus/verification-write-costs-and-gasless.md) — code merged and client-integrated; enable = compose profile + `FAUCET_CHAIN_ID=11155111` + funded key + rebuild with `NEXT_PUBLIC_FAUCET_URL`. Drain posture is the accepted devnet posture, now on real Sepolia (still testnet ETH).
- **Reversible default:** yes, with shipped caps. **Deadline:** Aug 29 (else the star demotes to stretch).

### D7 — The public Sepolia-permanence answer
- **Why you:** it is the single most predictable public objection and it is a positioning statement.
- **Ask:** approve one honest paragraph (draft in [[Reviews/2026-08-07-arcade-deep-dive|the arcade deep dive]] §7) scoping "permanent" to: records outlive any operator and are reconstructable; Sepolia is a long-lived testnet whose retirement is a named migration event the portable manifests are designed for; no eternity claims.
- **Reversible default:** the draft. **Deadline:** before any technical-audience post (Show HN).

## Decide after named evidence

- **E1 — Promote demo → product:** after 4-of-7 on the [[product-and-communities]] §7 validation bar (must include steward or creators). Review calendared launch+30/launch+60.
- **E2 — Native comments as primary:** after a read indexer exists + a spam design survives review + moderation capacity ≥2 humans.
- **E3 — Folder-bundle (multi-file) lane:** after the 2048 inline spike + week-3 guest-funnel data; it is the #1 catalog-quality unlock ([catalog lane](../../Reviews/2026-08-07-arcade-corpus/research-catalog-candidates-and-rights.md) §4).
- **E4 — PARTNER repositioning:** if js13k organizer / Flashpoint orbit / a mod collective responds with a named integration owner.
- **E5 — Institutional graduation (entity/OC beyond defaults):** at >$500/mo recurring or >2 regular co-maintainers.

## Launch choices (cheap; before Sep 11)

- **L1** Final launch list sign-off (12–18 from [[catalog-plan]]). **L2** Video script. **L3** First-post order (default: r/WebGames single game → Show HN with D7 rehearsed).

## Later (parked, with owners)

- N5 reference-app arm — stays in [[Designs/efsv2/owner-decision-inbox|the EFS v2 owner inbox]]; Arcade only feeds evidence. · App-store/monetization phases — [[sustainability-and-institutions]]. · Entity/foundation — E5. · Devnet 26001993 redeploy (currently has **no contracts** — verified). · SDK runtime adoption for the arcade — after the arcade-pin patch lands upstream.

## Settled owner guidance (context, not rulings)

From the lunch-derived brief, treated as standing product hypotheses: players are motivated by fun/convenience/discovery; preservation is the moral story; September = easy lawful browser-native games; small license-permitted forks with full provenance are acceptable; grants/donations preferred; comments are part of the desired September product (**modified path proposed via D2**); institutional lean = separate branding, foundation later.

## Open questions

- [ ] None beyond the decisions above — this file *is* the question list.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
