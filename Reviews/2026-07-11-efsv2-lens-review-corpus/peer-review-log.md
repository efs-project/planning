# EFS v2 lens review — independent review log

**Status:** integrated review record for the point-in-time lens architecture artifact; not a canonical EFS decision.

The main review was developed with independent specialist lanes for policy semantics, local-corpus coherence, on-chain algorithms/cost, precedents and UX, adversarial failure modes, and current-source verification. This file records the material challenges and their disposition so the final prose is auditable without treating intermediate drafts as decisions.

## Closure result

Final independent rechecks reported no remaining P0/P1 semantic blocker, no high/critical mismatch with the local EFS v2 corpus, and no material current-source or quantitative contradiction.

## Material challenges resolved

| Review lane | Challenge raised | Resolution in the main review |
|---|---|---|
| Policy semantics | A semantic digest was being used as though it were a fresh-client locator. | Public objects now use `LensObjectRefV1`: venue + carrier + semantic kind/digest. Mutable channels use a state-backed `LensChannelRefV1`. |
| Policy semantics | Snapshot/follow, imported rule class, and transitivity were overloaded. | Imports now have independent `referenceMode`, `importClass`, and `transitivity`; leaf/nested behavior is deterministic and cannot cross rule classes implicitly. |
| Policy semantics | One temporal interval could not represent intersected constraints from several clock domains. | `Scope` now carries a canonical conjunction of `TemporalWindow` values; identical clocks intersect and different clocks remain independent predicates. |
| Policy semantics | Advisory and discovery overlaps lacked the priority path defined for authority rules. | All three rule classes now carry class-local `rulePriority`; conflicting equal-path overlaps fail and there is no implicit cross-rule merge. |
| Policy semantics | Advisory/discovery imports were not explicitly attenuated. | Every policy-bearing edge intersects scope; class-specific applicability and stricter resource/privacy bounds are retained. |
| Policy semantics | `STALE` was incorrectly modeled as policy-neutral stored slot state. | The slot remains `PRESENT` with temporal metadata; freshness is a resolver-derived `CandidateFreshness`. |
| Policy semantics | Channel and KEL clocks were identified by naked IDs. | `ClockDomainRef` binds venue/home locator, semantics and fork policy; receipts bind the actual observation basis. |
| Corpus coherence | A predecessor/head-set redesign was initially presented as required using inaccurate permanent-pinning and undefined-revocation claims. | The review now preserves the current bounded `(seq,recordDigest)` LWW and deliberate empty-on-revoke behavior as the lowest-change baseline. Optional collision evidence and predecessor/head-set semantics are separate measured choices. |
| Corpus coherence | Channel admission depended on the update that happened to arrive first. | State validity is relative to its admitted parent; missing parents are retryable; late valid siblings are admitted; the anchor summary and authenticated state-set root are commutative. |
| Corpus coherence | A hash-referenced custom recovery policy could not be executed by the minimal kernel. | Portable v1 recovery is limited to closed, frozen kernel `recoveryProfileId` verifiers with bounded proof bodies supplied at admission. |
| Corpus coherence | Recovery could change meaning if an old-epoch sibling arrived after reset. | Recovery binds an immutable finalized checkpoint. It seals the old epoch for current selection; later old-epoch states remain admitted for audit only, while competing recoveries contest the new epoch. |
| On-chain/cost | `O(min(P,K))` ignored roster reads and rank lookup. | The review states logical work explicitly: direct priority probing versus complete lifetime-roster enumeration plus binary/merge/ordinal rank intersection under a committed cost schedule. |
| On-chain/cost | Discovery-plan cost omitted point resolution on the author-stream side. | Both formulas now include `sum R_i` over discovered unique positions; the term cancels only when the two position sets are identical. |
| On-chain/cost | Append-ordered author streams were at risk of being described as canonical pages. | They are candidate or dedup-unsorted streams only. Canonical sorted/top-N contract pages require a separate ordered index, materialized snapshot, or proof design. |
| Adversarial/privacy | A deterministic lens hash was treated as privacy. | Personal policies use opaque/keyed local handles and encrypted storage; public curation is a deliberate publication act. Dictionary, URL, calldata, RPC, cache, and recovery observers are included in the threat model. |
| Adversarial/authority | Mirror fallback risked promoting a transport provider into content authority. | Content authority resolves first; a separate transport policy selects eligible carriers and every fallback is verified against the trusted content commitment. |
| Current sources | KERI was described using an older experimental/draft maturity note. | The review now records the ToIP KERI v1.1 release dated 2026-01-21 while preserving the boundary that it is not an Ethereum/EFS standard. |

## Remaining gates, not review contradictions

- Rerun the full 50/100/256 matrix against the actual v2 kernel, including KEL/delegation, expiry, provenance ABI, write/state growth, and conservative L3 call/transaction limits.
- Choose and benchmark a century-scale current-live/compaction structure, or explicitly accept `O(history)` fresh bootstrap for append-only directory streams.
- Decide whether the lifetime `claimantsBySemanticPosition` roster earns permanent state after write/read/spam economics.
- Freeze the channel-anchor authenticated-set/checkpoint layout and its closed recovery profiles.
- Decide whether same-slot collision evidence earns Etched storage; price predecessor/head-set semantics only as a separate envelope/kernel redesign.
- Decide whether contract-native globally sorted/top-N pages are a real requirement.
- Produce cross-language canonical source/effective/compilation/receipt vectors and two independent compilers before schema freeze.

