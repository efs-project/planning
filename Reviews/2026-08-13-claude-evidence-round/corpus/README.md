# Recovered Claude evidence corpus

**Status:** complete mechanical recovery of the 2026-08-13 research outputs; evidence, not authority

#status/done #kind/research #repo/planning #pass/claude-evidence-round

This directory preserves every distinct completed research memo produced by the
four Claude agents commissioned for the round and their delegated workers.
It exists because the original summary compressed most of the sources,
measurements, hashes, commands, caveats, and negative results into a short PM
record.

## Recovery result

- **55** completed-result notifications were present in the session log.
- Exact-result deduplication produced **30** distinct memos totaling **848,254**
  source-result characters before HTML-entity decoding (**847,353** after).
- **25** notification copies were omitted; no distinct report was omitted.
- The later spend-limit failure for browser task `ac93d20095385c963` contained
  no result and does not invalidate its earlier completed memo.
- Both Arcade falsification outputs are retained because their contents differ.

Each memo carries its completion timestamp, Claude task ID, canonical JSONL
line, and original character count. Bodies are preserved except for disclosed
normalizations: rendered HTML entities were decoded, machine-local
workspace/scratch roots were replaced by `EFS_WORKSPACE` or
`DISCARDED_SCRATCH`, and one whitespace-only blank line was cleaned in the
dead-chain/RaaS memo.

## Reading map

| Family | Curated reports | Supporting evidence |
|---|---|---|
| [Arcade](arcade/) | [falsification pass 1](arcade/arcade-falsification-pass-1.md), [Andromeda reproduction](arcade/andromeda-evidence-reproduction.md), [falsification pass 2](arcade/arcade-falsification-pass-2.md) | Two guest-UX comparisons and two catalog-loss studies |
| [Runner](runner/) | [measured browser matrix](runner/browser-runner-measurements.md) | Standards/vendor synthesis plus Chrome Android, WebKit/iOS, and Firefox/Gecko research |
| [Venue](venue/) | [Commons/Realm matrix](venue/commons-realm-venue-matrix.md), [L1 incidents and dead data](venue/l1-incidents-and-dead-data.md) | Sixteen reports covering costs, governance, force inclusion, node operation, incidents, dead chains, RaaS, bridges, state/blob retention, L3s, and ZK venues |

The six links in the “Curated reports” column are the reports promoted into the
round summary. This is a reading distinction, not execution ancestry: only four
agents were launched directly; the L1 report was a venue sub-lane and the two
falsification passes came from two stops of one task.

## Authority and use

These reports retain their authors' recommendations and candidate criteria for
provenance. They do **not** select a venue, stop or resize Arcade, clear
Andromeda for publication, choose runner policy, reopen a superseded design, or
create an owner question. Current design-folder inboxes and rulings remain the
only authority for those choices.

## Manifest

### Arcade — 7 reports

| File | Role | Task | Completed | Original chars |
|---|---|---|---|---:|
| [six-flow-polished-portals.md](arcade/six-flow-polished-portals.md) | supporting | `ab75d10f3d5bf554c` | 04:26:20Z | 29,546 |
| [six-flow-hn-js13k-itch.md](arcade/six-flow-hn-js13k-itch.md) | supporting | `a60ae8bde3f275038` | 04:26:24Z | 23,308 |
| [flash-era-catalog-loss.md](arcade/flash-era-catalog-loss.md) | supporting | `affdd0ac9089f2c56` | 04:27:39Z | 26,181 |
| [indie-jam-catalog-loss.md](arcade/indie-jam-catalog-loss.md) | supporting | `a581572e71fbe296c` | 04:29:07Z | 34,615 |
| [arcade-falsification-pass-1.md](arcade/arcade-falsification-pass-1.md) | curated | `a681870a67a4a744a` | 04:30:45Z | 24,582 |
| [andromeda-evidence-reproduction.md](arcade/andromeda-evidence-reproduction.md) | curated | `a117ae51d1ad0e2cb` | 04:31:39Z | 21,334 |
| [arcade-falsification-pass-2.md](arcade/arcade-falsification-pass-2.md) | curated | `a681870a67a4a744a` | 04:35:18Z | 23,695 |

### Runner — 5 reports

| File | Role | Task | Completed | Original chars |
|---|---|---|---|---:|
| [chrome-android-docs.md](runner/chrome-android-docs.md) | supporting | `a6139248ba3c10a1b` | 04:51:05Z | 24,468 |
| [webkit-ios-docs.md](runner/webkit-ios-docs.md) | supporting | `a3dcdfae8c32966fa` | 04:51:59Z | 36,575 |
| [firefox-gecko-docs.md](runner/firefox-gecko-docs.md) | supporting | `ace89b7b69f932c6c` | 05:01:07Z | 33,549 |
| [sandbox-spec-and-vendor-docs.md](runner/sandbox-spec-and-vendor-docs.md) | supporting | `a9fd883caece165c7` | 05:06:16Z | 58,750 |
| [browser-runner-measurements.md](runner/browser-runner-measurements.md) | curated | `ac93d20095385c963` | 05:06:56Z | 16,578 |

### Venue/L1 — 18 reports

| File | Role | Task | Completed | Original chars |
|---|---|---|---|---:|
| [state-rent-and-storage-cost.md](venue/state-rent-and-storage-cost.md) | supporting | `a57510bbb58842079` | 04:27:51Z | 23,355 |
| [l3-and-appchain-venues.md](venue/l3-and-appchain-venues.md) | supporting | `a99f3bc6f67b70911` | 04:29:11Z | 42,437 |
| [operations-and-node-independence.md](venue/operations-and-node-independence.md) | supporting | `a3c284e1197680ea8` | 04:30:38Z | 35,399 |
| [zk-rollup-venues.md](venue/zk-rollup-venues.md) | supporting | `ae1950cdcedda5efc` | 04:31:20Z | 37,494 |
| [chain-death-case-studies.md](venue/chain-death-case-studies.md) | supporting | `ad8839beaac943a0a` | 04:31:48Z | 22,471 |
| [l2-censorship-and-force-inclusion.md](venue/l2-censorship-and-force-inclusion.md) | supporting | `a856e2d5d02583db5` | 04:33:12Z | 27,639 |
| [protocol-and-security.md](venue/protocol-and-security.md) | supporting | `a66c9083ed7d23197` | 04:33:43Z | 21,333 |
| [zk-venue-incidents.md](venue/zk-venue-incidents.md) | supporting | `a9cbc5ba06d8e1c1e` | 04:35:37Z | 18,912 |
| [fee-snapshots.md](venue/fee-snapshots.md) | supporting | `a18c6a86ced3c0769` | 04:40:22Z | 16,095 |
| [venue-incident-history.md](venue/venue-incident-history.md) | supporting | `a50f28a45ca639180` | 04:43:55Z | 35,228 |
| [dead-chains-and-raas-risk.md](venue/dead-chains-and-raas-risk.md) | supporting | `a14ec6f91b3516f9d` | 04:47:14Z | 42,290 |
| [l1-incidents-and-dead-data.md](venue/l1-incidents-and-dead-data.md) | curated | `ad19d3f637c98f56a` | 04:52:38Z | 26,686 |
| [state-expiry-and-storage-rent.md](venue/state-expiry-and-storage-rent.md) | supporting | `ac15a813425c979c1` | 04:55:28Z | 11,291 |
| [chain-steward-economics-and-raas-policy.md](venue/chain-steward-economics-and-raas-policy.md) | supporting | `a46de4ff17b6fed0b` | 04:56:39Z | 14,445 |
| [bridge-trust-and-withdrawal-delays.md](venue/bridge-trust-and-withdrawal-delays.md) | supporting | `a26aacc6f234f578b` | 04:56:41Z | 12,564 |
| [governance-economics.md](venue/governance-economics.md) | supporting | `acd4994444261e343` | 04:57:09Z | 45,054 |
| [fees-bridges-steward-economics.md](venue/fees-bridges-steward-economics.md) | supporting | `ad63191f6f2d6e1bf` | 05:00:53Z | 24,814 |
| [commons-realm-venue-matrix.md](venue/commons-realm-venue-matrix.md) | curated | `a923cd0e6397887e9` | 05:08:41Z | 37,566 |

All completion times are on 2026-08-13 UTC. The task-specific headers contain
the canonical JSONL line numbers needed to reproduce each extraction.
