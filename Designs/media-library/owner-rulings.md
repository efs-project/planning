# EFS Media Library — owner rulings

**Status:** reference — append-only media product rulings
**Target repos:** planning
**Last reconciled:** 2026-08-14

#status/reference #kind/decision #repo/planning #topic/media-library #topic/gallery #topic/onchain

This file records rulings owned by the Media Library design queue. EFS-wide
Core rulings remain in [[Designs/efsv2/owner-rulings]]. Do not copy later Core
mechanism decisions here.

## 2026-08-14

### Shared foundation with two distinct applications

- Build media as three durable tracks: shared media infrastructure, a
  Booru/Sankaku-style public tagged-gallery application, and a Plex/Jellyfin-
  style personal media application. Share identity, verification, provenance,
  derivatives, collections and exit; keep public-curation and private-playback
  product rules separate. — ruled by @james, 2026-08-14

### Onchain-first media queries; The Graph as last-resort public fallback

- Try every practical bounded public media query onchain before deferring it.
  For public derived queries that genuinely must be offchain, use The Graph as
  the first reference implementation because it targets decentralized indexing
  and is familiar to web3 developers. The Graph is an escape hatch and last
  resort, not the default or canonical media database. — ruled by @james,
  2026-08-14
- Scope clarification: this ruling concerns public derived query/search. The
  Graph is not media storage/transport, a transcode worker, an offline cache, a
  local folder scanner or a private tags/watch-state database. That boundary is
  a technical consequence of the requested products, not a reversal of the
  ruling. — recorded by @media-library-pm, 2026-08-14

The query ruling specializes, and does not replace, the EFS-wide “lean hard
on-chain” ruling in
[[Designs/efsv2/owner-rulings#On-chain sign-off — partial rulings (the 18-item list, onchain-completeness §3)]].
