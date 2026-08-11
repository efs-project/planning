# ETHOnline 2026 opportunity

Operational record for the ETHGlobal opportunity James surfaced on 2026-08-10.
This is a way to test and show EFS, not a new EFS milestone or permission to bend
the greenfield successor design around a hackathon.

**Status (2026-08-11):** tracked; no application or project submission is
recorded yet.

## Live timing and evidence

- [ETHOnline 2026](https://ethglobal.com/events/ethonline2026) is an
  asynchronous ETHGlobal hackathon running **September 4–16, 2026**. Its
  event-specific route was intermittently returning a 404 on August 11, while
  the [official events listing](https://ethglobal.com/events) still exposed the
  event and its current metadata.
- The current official event-listing metadata, refreshed 2026-08-11, gives a
  hacker signup deadline of **September 6 at 17:00 UTC (12:00 CDT)**. An earlier
  PM capture of the event-specific page on 2026-08-10 showed **September 3 at
  10:59 PM CDT**. Use September 3 only as a conservative internal cutoff and
  recheck the live application before relying on either timestamp.
- That same 2026-08-10 event-page capture gave a project deadline of
  **September 13 at 12:00 PM EDT (11:00 AM CDT)**, before the advertised event
  end. The current event page is not rendering that detail, so it is only a
  conservative internal cutoff until the participant rules are live again.
- The [announcement James shared](https://x.com/ethglobal/status/2086863835991028111)
  introduced continuity paths that allow an existing open-source project to
  enter as **From Scratch**, **Extend Open Source**, or **Ship a Feature**.
- The 2026-08-10 snapshot advertised **$100,000** in prizes and listed 0G, The
  Graph, Ledger, Hedera, 1inch, World, Uniswap Foundation, and Chainlink. Sponsor
  criteria were still incomplete. It also said teams may have 1–5 people and
  enter at most three sponsor prizes; recheck all three rules before choosing
  any integration.
- AI tools were allowed in the captured rules, but generated work must be
  attributed. Spec-driven work should include the relevant prompts, specs, and
  planning artifacts, and an agent-only project may not qualify. Preserve a
  clean baseline showing what existed before the event, James's material work
  and decisions, and what was built during it.

Dates, sponsor tracks, and rules are event-controlled and may move. The official
event surface wins over this snapshot.

## Why it may be useful for EFS

Applying preserves an option to put one already-needed product trace in front
of Ethereum builders and storage/indexing sponsors. The best current fit is the
bounded one-game Arcade verified-artifact pressure trace below. It follows the
2026-08-08 greenfield ruling in [[Decisions]], not the superseded v1/1.5 Arcade
architecture still present in the initial research corpus:

1. An anonymous visitor opens a game page and explicitly presses Play.
2. The client resolves an exact artifact closure and expected digest.
3. It has at least two locators or carriers for those exact bytes.
4. A tampered or unavailable primary is rejected; a matching fallback loads.
5. A second implementation can reconstruct the same object and evidence without
   a private database.

This tells a coherent EFS story—portable identity, exact bytes, plural
availability, honest verification, and a normie-friendly read path—without
claiming the successor contracts are frozen or deployed.

Tentative sponsor fits, only after their actual prize rules are published:

- **0G:** a replaceable artifact carrier, never EFS identity or canonical truth.
- **The Graph:** optional read/index acceleration, never the only reconstruction
  path or authority.
- **World / Ledger:** weaker fits unless the final slice genuinely needs their
  identity or signing properties.

Use at most one sponsor integration that improves the slice. Skip a bounty that
would distort the product or Genesis design.

## Follow-ups

- [ ] James chooses `FJ-4` in [[Owner-Inbox]]: apply or deliberately skip.
- [ ] If applying, submit by the internal **September 3** cutoff and record the
  confirmation/application URL here.
- [ ] Recheck the live participant rules, continuity-track eligibility, sponsor
  prizes, team-size rule, AI-attribution rule, and project deadline.
- [ ] Record a pre-event baseline commit and a narrow event worktree/branch or
  folder so existing work and event work are distinguishable.
- [ ] Freeze the actual demo acceptance trace before implementation; the
  one-game trace above is the default, not an adopted scope ruling.
- [ ] Preserve prompts/specs and third-party code/assets with attribution and
  rights evidence.
- [ ] If entering a sponsor track, choose no more than one integration and write
  down why it is useful without that sponsor's prize.
- [ ] Submit before the verified project cutoff and retain the public showcase
  URL, demo, repository commit, and judging feedback.

## Guardrails

- No revival of v1/EAS merely to meet the event.
- No durable Arcade seed before the successor ID/data-model gates pass.
- No event-driven freeze of Genesis contracts or IDs.
- Product work may use a provisional stamped adapter; the demo must label it.
- No mainnet, production, or September delivery promise is implied.
