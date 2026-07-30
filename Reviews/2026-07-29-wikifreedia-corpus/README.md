# Wikifreedia review corpus

**Date:** 2026-07-29
**Status:** supporting evidence for [`../2026-07-29-wikifreedia-plural-knowledge-and-efs.md`](../2026-07-29-wikifreedia-plural-knowledge-and-efs.md)
**Scope:** Wikifreedia/NIP-54, comparable plural-knowledge systems, and the EFS v2/Client v2 pressure-test crosswalk

#kind/review #status/done #repo/planning #topic/efsv2 #topic/knowledge

## Contents

- [`primary-project.md`](./primary-project.md) — Wikifreedia's goal, live product, protocol, application architecture, repository history, relay-corpus snapshot, licensing, neutrality control planes, and code-level safety findings.
- [`live-observations.md`](./live-observations.md) — dated homepage headers, relay NIP-11 metadata, bounded relay-query windows, verification limits, and an event-ID-set hash for mutable observations.
- [`relay-event-manifest.jsonl`](./relay-event-manifest.jsonl) — content-free 411-record relay manifest (`id`, `pubkey`, `created_at`, raw observed `d`, and fork/defer marker tags) from which the reported corpus aggregates can be recomputed.
- [`alternatives.md`](./alternatives.md) — sixteen projects grouped by layer rather than falsely treated as direct competitors: Wikipedia, NIP-54, Federated Wiki, Encyclosphere, Ceramic, OriginTrail, Noosphere, Wikidata, Abstract Wikipedia/Wikifunctions, Hypothesis, Kialo, Pol.is, Community Notes, AllSides/Ground News, IQ.wiki, and PubPub.
- [`efs-crosswalk.md`](./efs-crosswalk.md) — current EFS draft state, candidate object trace, demonstrated ingredients, actual gaps, proposed `WF-*` pressure requirements, design questions, and boundaries against accidental canon.

## Method

The review used four evidence classes:

1. **Live product observation** on 2026-07-29: landing, Explore/topic pages, author/version pages, guest/sign-in flow, AI comparison, and the Fund.
2. **Primary source inspection** at stable revisions:
   - application `pablof7z/wiki@2d688326d4e2af1b8c457e3d80d28ecb4b7a1fd6`;
   - relay `pablof7z/wikifreedia-relay@dd5f27756cd89ed5ccd52cda215e4101cac8db49`;
   - NIP-54 at NIPs revision `6d2979b3f503a8539c983efbcdcf901bbcf9ed23` plus its original proposal discussion.
3. **Direct relay measurement:** NIP-45 counts and recursively bounded Nostr REQ windows against `wss://relay.wikifreedia.xyz`, deduplicated by event ID.
4. **Primary-source precedent review:** official policies/specifications, live project documentation, source repositories, license files, export documents, and current maturity statements.

The synthesis was then red-teamed in three independent lanes:

- primary-project claims: neutrality, licensing, adoption language, attribution, and security;
- alternative-project fairness: especially Wikipedia, maturity, openness, and layer equivalence;
- EFS crosswalk: current-vs-proposed status and whether a conclusion accidentally answered an owner-gated design question.

## Evidence boundaries

- A signature proves control of a key over bytes, not truth, uniqueness, credentials, or real-world identity.
- The relay corpus is not a traffic, retention, unique-human, or active-user dataset.
- “Multiple authors under one topic” does not prove substantive disagreement.
- Repository activity is evidence of maintenance, not adoption, governance quality, or independent operation.
- Source behavior at a pinned commit and live-product behavior are separate evidence unless a deployment attestation binds them.
- Public source without a license is not equivalent to OSI-open-source.
- Two implementations or operators are evidence toward neutrality, not proof.
- Code-level security findings were not exploited against production. They are inputs for EFS safety requirements, not a penetration-test report.
- EFS material is a dated draft/reconciliation corpus. The crosswalk distinguishes owner rulings, candidate mechanisms, open choices, and review proposals.

## Status semantics

This corpus is a point-in-time review record. It may inform later design work, but it does not:

- adopt a schema representation or generic `SCHEMA` kind;
- ratify any lens profile or LP choice;
- claim KEL, guest, preservation, or OS app-runtime work is complete;
- create a milestone or flagship-app commitment;
- promote any design.
