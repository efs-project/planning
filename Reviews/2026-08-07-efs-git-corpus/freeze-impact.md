# EFS Git — freeze-impact table

**Status:** deep-dive analysis, 2026-08-07. What this workload asks of each layer, split between generic substrate requirements (freeze-relevant) and Durable SDK/library/client/gateway behavior (iterable forever). Headline: **the recommended architecture adds nothing to the Etched surface.** Its substrate needs are riders on items already in front of James or already delegated.

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git

## Generic substrate — riders on existing items (no new surface)

| Existing item | Git rider | Nature |
|---|---|---|
| **P-1** (authority lane + admission receipts) | ref-transaction replay resistance at the strongest grade *consumes* admission ordinals; Git/wiki joins packages/orgs/votes as a forcing use-case class. If P-1 = no, candidate B degrades to venue-local order (candidate-A grades) — disclosed, not fatal | decision input, already queued |
| **E2** (aggregate kernel cost snapshot) | add one fixture: an N-page wiki publish envelope (ref claims + closure commitment rows) priced at realistic cadence; the dual-digest leaf row already listed in E2 covers P-G2's cost | evidence rider |
| **Q3** (public collab = revision DAGs + curation; held) | this pass is evidence *for* the Q3A arm — a Git workspace is exactly a revision-DAG + curation system; the five H-Q3 read-hooks map onto proposal/history/diff reads. Q3 remains James's to answer; nothing here answers it silently | evidence toward a held item |
| **AMBIENT/1** (owed, CR-3) | wiki guest reads block on it like every guest product; adds pressure, no new surface | owed work, unchanged owner |
| **`.efs-bundle` normative spec** (delegated) | the Git profile (checkpoint bundle + increments + sidecar) becomes that spec's hardest fixture and an input | delegated technical gate, unchanged owner |
| **Conventions registry** (commissioned by fs-pass) | `efs.git/*` TAGDEF vocabulary (policy, checkpoint, proposal, release, mergeOf) registers there | commissioned follow-up, unchanged owner |
| **Persistence OQ-1** (two-device seq) | ref claims add a concrete collision fixture | existing filed gap |
| **E2 placement-cost sibling** | per-publish *container placement* (byte-market cost/latency on the publish path) is outside E2's kernel-gas scope — priced by an M1/M5 fixture instead | evidence rider, named so it is not silently absent |
| **KEL suites** | optional rider: an ed25519 actor suite would let SSH keys be actor keys directly; flagged for the KEL owner, not assumed by any milestone | KEL decision input |

## Explicitly NOT requested from the kernel

- No `GIT_REPO`/`REF` kinds; no sixth record kind.
- No state-dependent (CAS) admission behavior; no ancestry verification on-chain.
- No reserved `efs.git/*` genesis rows (user-key TAGDEFs suffice — no kernel enforcement needed).
- No per-object on-chain commitments for repo objects.
- No new protocol grade words: existing ladder + rung + guest vocabularies carry every Git state; the profile-internal states this pass names (`TRUNCATED-TXN`, `ANCESTRY-VIOLATION`, conflicted-publish) are `GIT-REF/1` vocabulary — Durable profile output, not kernel or read-grade surface ([wiki-and-collab](./wiki-and-collab.md) §3).

## Durable (iterate freely, never freeze-bound)

| Artifact | Owner class |
|---|---|
| `GIT-REF/1` profile spec + two-implementation vector suite (GATE/1-scale state machine — sized honestly) | lens-family profile (post-LP-1), SDK |
| Derived-head attestation convention (`refs/efs/attest`, G-9) | SDK/gateway + conventions registry |
| `ClosureManifestV1`, container conventions, checkpoint cadence, retention policy shapes | SDK/placement + conventions registry |
| Gateway reference implementation (smart-HTTP v2, receive-pack intake→outbox, LFS batch API, rebuildable caches) | new component, ordinary software |
| Carrier adapters (bare-Git/HTTPS, EthStorage/GoE behind its production gates, Arweave, OPFS) | SDK |
| Stock-push credential ceremony; CI session-grant recipe | client/SDK UX |
| Wiki editor, two-versions conflict UI, history/compare/restore surfaces | clientv2 (Files-constitution rules apply) |
| `ProposalV1`/`ProposalStatusV1`/`SkillReleaseV1` schemas | portable-schemas pass interface (its R1–R10 requirements apply; nothing decided for it here) |
| Page-identity sidecar convention | SDK/client convention |

## Sequencing note

Nothing in this workload needs to precede the coordinated envelope/kernel recut, and nothing in the recut forecloses it — provided P-1's receipts/ordinals land as designed and the E2 fixture rides the same snapshot. The one cross-pass ordering: the portable-schemas pass should see `ProposalV1`/`SkillReleaseV1` as candidate workloads for its schema/validator machinery (its trace 5 "package manifest" is nearly `SkillReleaseV1`).
