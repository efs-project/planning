# Designs — owner decision inbox

**Status:** draft decision packet; no choice is adopted until James answers and it is recorded in the owning history
**Audience:** James first; designers second
**Last reconciled:** 2026-07-21

#status/draft #kind/decision #repo/planning #blocked-on/human-decision

> **Start here for design decisions.** This page owns choices about loose designs in `Designs/`. Each design subfolder owns its own queue:
>
> - [EFS v2 + OS decisions](./efsv2/owner-decision-inbox.md)
> - [Client v2 decisions](./clientv2/owner-decision-inbox.md)
>
> A question appears in only one live queue. Linked design documents provide detail; unchecked boxes in them are not automatically James decisions.

## How to answer

Reply with a code and optional exception, for example `R1A`, or `R1B, but keep locate/read naming provisional`.

## Decide now

### R1 — What should agents do with the pre-v2 SDK design corpus?

**Example:** `efs.fs.read('/x')` and value-first DTOs may survive. “Identity = EAS UID/address,” connected-wallet lens defaults, and the old write DAG conflict with v2's native envelopes, stable principals, and KEL.

- **R1A — Hold and reconcile. Recommended.** Mark the corpus provisional/legacy. Reuse good API ideas only after the v2 constitution and record model land.
- **R1B — Carve out an API shell now.** Promote only demonstrably substrate-neutral names and shapes; explicitly exclude identity, lenses, writes, and storage mechanics.
- **R1C — Promote it unchanged.** Fastest on paper, but it would canonize assumptions v2 is replacing.

**Why now:** `#status/review` otherwise looks near-canonical to future agents. Details: [[sdk-architecture#Open Questions]], [[efs-account-system]], [[sdk-wallet-architecture]], and [the EFS v2 queue](./efsv2/owner-decision-inbox.md).

## Decide after evidence — do not answer yet

### ER1 — Account/onboarding default

**Example:** a MetaMask user later adds a passkey. The wallet address should not accidentally become the permanent identity if KEL is meant to rotate keys beneath a logical principal.

- **A:** reuse a detected wallet/account;
- **B:** provision an EFS/Cyphos account;
- **C:** offer both with one recommended default.

**Recommendation after evidence:** choose only after the KEL admission/recovery slice, wallet capability matrix, and recovery usability test. The canonical authority choice lives in [EFS v2 N1](./efsv2/owner-decision-inbox.md#n1--strong-authority-without-a-cross-chain-empire). Historical input: [[efs-account-system#Decisions for James]].

### ER2 — First one-click write integration

**Example:** publishing one package may require several dependent records. Which rail can safely make that feel like one action across real wallets?

- **A:** embedded programmable EIP-7702 path;
- **B:** ERC-7579 smart account;
- **C:** direct-wallet fallback first.

**Recommendation after evidence:** choose the path with the widest verified coverage after the native v2 write graph is known. Do not inherit the old EAS-specific recommendation automatically. Details: [[sdk-write-ux#Open questions]], [[sdk-wallet-architecture#Open questions (post-review residue)]], and [[sdk-minimal-clicks#Open questions]].

## Already settled — do not ask again

- The brainstorm system was approved; promotion mechanics are agent/process work. See [[brainstorm-system]] and [[Decisions]].
- SDK architecture Q1–Q6 and the core read-surface shape were settled. Only R1 remains an owner choice.
- Permissive mirror schemes plus mandatory render isolation are the direction; implementation follows the EFS OS security boundary.
- Specifications live in their owning repository. A cross-repo mirror remains dormant until a concrete CI need appears.

## Delegated to agents

Agents should choose reversible implementation details, record their rationale, and escalate only a real permanence or product tradeoff. Current examples include per-item partial errors for paginated reads, cache keys, enum names, relayer wire format, package placement, and feasibility spikes.

## Dormant or historical — not live queues

- [[efs-account-system]]'s smart-account-as-identity premise is historical input; v2's logical actor + KEL work supersedes it.
- [[sdk-one-signature-writes]] is superseded by the native-envelope recut.
- [[cross-repo-reference-mirror]] stays blocked until a concrete CI need exists.
- Old web3, BytesStore, mirror, and SDK checkboxes are implementation verification or lifecycle cleanup unless promoted back into this inbox.

## Recording rule

When James answers R1, record the dated ruling in `Decisions.md`, mark it here `ADOPTED`, `REJECTED`, or `DEFERRED`, and replace conflicting source checkboxes with a link to this page. The child inboxes use [[owner-rulings]] for EFS v2 constitutional history.
