# v2 — Application cookbook (informative)

**Status:** draft
**Target repos:** planning, sdk
**Depends on:** [[codex-kinds]], [[read-lens-spec]]
**Base text:** [app-grounding-consumer-apps.md](../../Reviews/2026-07-07-efsv2-corpus/app-grounding-consumer-apps.md) + [app-grounding-infra.md](../../Reviews/2026-07-07-efsv2-corpus/app-grounding-infra.md) — the first record-level grounding of the tag-core + native-kernel model against ten real applications
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/planning #repo/sdk

## Verdict summary (ten apps, none blocked)

| App | Verdict | The wart / the fix |
|---|---|---|
| Personal file browser/site | **works** | model's home turf; SDK rename/update verbs; vanity-name education (address containers are the canonical personal namespace) |
| Blog + stranger comments | works-with-warts | cross-author inbox read → the discovery index ([[codex-kernel]] amendment 9); comments = commenter-owned DATA + TAG into a parallel comments container; attachment matrix relaxed ([[codex-kinds]] amendment 8) |
| Social feed | works-with-warts | per-author feeds + TAG-slot like/follow algebra excellent; notifications/counts = indexer lane; no-session-keys pushes social identities toward app-held hot keys (named cost; KEL-era session keys are the fix) |
| Photo archive (1000 photos) | works-with-warts | catalog superb; bulk bytes out of scope by ruling; hinges on sign-one-root / submit-in-chunks (blessed below) |
| Curated collections + lens subscription | **works** | strongest fit; lens pin-and-diff + freshness conventions |
| NFT/token metadata | **works** | needs state-resident bodies (ruled), primary-mirror PIN (ruled — dual-role mirrors), chain-relative web3:// mirror URIs + **frozen CREATE2 chunk-store recipe** (records travel; stores must land at identical addresses) |
| DAO document store | works-with-warts | threshold custody of one org EOA (pure-signature portable); rotating-signer authorization is the KEL's first real customer; m-of-n authorship lockout named ([[identity]] amendment 3) |
| Package registry | works-with-warts | **the stress case**: expiry-as-death rejected → stale-not-dead + declared-home pull-latest + advisory deny-lists (the decentralized yank); appendOnly LIST charter survives tag-core *because* this app needs it; account-takeover is the dominant threat and is answered honestly ([[ops-doctrine]] amendment 2) |
| Web archive mirror | **works** | best fit; ceiling is bulk-byte economics (unmeasured — gas gate) |
| Dapp structured records | **works** | cheapest fit; on-chain consumer surface stays point-lookup-shaped; gating uses closed author sets, never lens fallback |

Both flagged traps (PIN/TAG split; DATA owned) were independently re-confirmed from the app side. String-only properties passed all ten — with the named re-check trigger (an on-chain numeric-consumer marketplace app) still standing.

## Blessed patterns (normative-adjacent; SDK implements)

1. **Bulk ingest / split submission:** sign ONE Merkle root over the whole write DAG; submit via `submitSubset` in chunks across transactions; partial-admission semantics are first-class (per-record independence + parents-first dependency rule); idempotent resume by claimId skip.
2. **Stranger-write economics:** commenter signs (author = commenter), host community-relayer pays; per-identity budgets; the ~$0.001 ceiling remains a measured-gate assumption, not a fact.
3. **Mutable documents:** new DATA + re-PIN + `supersededBy` reserved-key edge (dual-role: PIN designated successor, TAG additional); old links resolve with SUPERSEDED grade.
4. **Comments/annotation attachment:** parallel container under the target's tagId with generic children (post-relaxation); enumeration via the discovery index; moderation = host lens.
5. **Package registry:** names = TAGDEFs (unowned; exclusivity from lenses/curation, squatting inert); versions = immutable placements + appendOnly LIST ledger + lockfiles; yank = revoke placement (gone from new resolution; DATA + integrity survive for lockfiles) + advisory deny-claims; installers pull-latest-before-trust from declared home.
6. **NFT metadata:** tokenURI composes from `getSlot` (primary mirror PIN) + SSTORE2 bytes on the NFT's own chain; replication = re-submit records + re-deploy chunk stores via the frozen CREATE2 recipe → identical addresses, URIs resolve unchanged.
7. **Copied-L3 config (the Microsoft case):** copy the subtree's envelopes + proofs; destination kernel verifies + registers; contracts read natively; currency is a labeled snapshot (checkpoint claim if present); safety-critical consumers use expiry + pull-home.

## What the grounding sent back up (all adopted upstream)

Discovery index → [[codex-kernel]]; split submission → [[codex-envelope]]/[[codex-kernel]]; attachment relaxation, expiresAt, home/successor rows → [[codex-kinds]]; stale-not-dead + deny-lists + freshness horizons → [[ops-doctrine]]/[[read-lens-spec]]; CREATE2 chunk recipe → [[codex-kernel]] genesis/deploy conventions.

## Open questions

- [ ] None James-level; the gas-measurement gate ([[freeze-gates]]) holds two verdicts hostage (NFT 10k-collection, web-archive 10k-URL economics).
- [ ] **Client-OS pressure (2026-07-07):** [[client-os-pressure-report]] P7/P5 request blessed patterns: app-package convention (identity tuple, manifest hash, atomic resolve-closure-at-pinned-root), per-record risk-class taxonomy for batch preflights, `.efs-bundle` portable format, and signed language/font-pack records with lens-endorsed translations. **P13** requests a **social-app blessed pattern** (feed/comment ordering by venue admission not claimed-TID, replies cite the exact version, render supersession/edit history, grade cross-chain replicas as incomplete) so EFS-Twitter/forum/wiki devs don't re-derive the back-dating/edit-gaslight defenses badly.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Re-walk the ten apps once vectors + gas snapshot exist (verdicts confirmed against measured numbers)
- [ ] At least one round of `#status/review` with another agent or human comment
