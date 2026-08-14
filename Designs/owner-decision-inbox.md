# Designs — owner decision inbox

**Status:** reference — decision packet; no choice is adopted until James answers and it is recorded in the owning history
**Audience:** James first; designers second
**Last reconciled:** 2026-08-14

#status/reference #kind/decision #repo/planning

> **Start here for design decisions.** This page owns choices about loose designs in `Designs/`. Each design subfolder owns its own queue:
>
> - [EFS v2 + OS decisions](./efsv2/owner-decision-inbox.md)
> - [Client v2 decisions](./clientv2/owner-decision-inbox.md)
> - [EFS Arcade decisions](./arcade/owner-decision-inbox.md) *(initial D1–D7 packet awaits post-pass reconciliation; do not batch-answer it)*
> - [Open Web App Store decisions](./open-web-app-store/owner-decision-inbox.md) *(nothing to decide yet; evidence gates stay in the architecture)*
>
> A question appears in only one live queue. Linked design documents provide detail; unchecked boxes in them are not automatically James decisions.

> **Greenfield correction (2026-08-12):** R1–R4 and ER1–ER2 below are v1
> packet history, not live choices. The active EFS 2.0 evidence gates are in
> [the EFS 2.0 inbox](./efsv2/owner-decision-inbox.md). Do not revive v1 SDK,
> devnet, redirect-default, EOL, onboarding, or write-rail work as a successor
> dependency.

## Superseded questions — do not ask

### R1 — What should agents do with the pre-v2 SDK design corpus?

**Example:** `efs.fs.read('/x')` and value-first DTOs may survive. “Identity = EAS UID/address,” connected-wallet lens defaults, and the old write DAG conflict with v2's native envelopes, stable principals, and KEL.

> **Re-cut 2026-08-08 (sdk-designer):** the 2026-08-07 v1-bridge ruling ([[Decisions]]) changed the facts under this question. The SDK now SHIPS the corpus's API shell as the explicit **EFS v1 profile** (SDK ADR-0019: `createEfsV1Client`, `profile: 'efs/v1'` stamps + versioned serializers on every persisted artifact, write-side `lens`→`author`, `@efs/solidity/src/v1/`), with EAS-specific mechanics scoped to v1 surfaces — i.e. R1B's carve-out is implemented in code, not just marked in prose. The v2-breaks analysis (8-agent pass, 2026-08-07) confirmed the split line: verbs/errors/receipts/fetch-verify/trust seams carry to v2; `efs.eas`/schema UIDs/write DAG/address lenses are v1-only by construction. What remains OWNER-level is only the corpus LABELING: mark the pre-v2 SDK design docs as "v1-profile design of record" (not v2 input) so future agents read them with the right frame.

- **R1B — Carve out an API shell now. Recommended (now implemented — confirming ratifies the label).** Promote only demonstrably substrate-neutral names and shapes; explicitly exclude identity, lenses, writes, and storage mechanics.
- **R1A — Hold and reconcile.** Mark the corpus provisional/legacy. Reuse good API ideas only after the v2 constitution and record model land. (Now conflicts with the v1-bridge ruling — the shell is live for Nanda/Arcade.)
- **R1C — Promote it unchanged.** Fastest on paper, but it would canonize assumptions v2 is replacing.

**Why now:** `#status/review` otherwise looks near-canonical to future agents. Details: [[sdk-v1-bridge-v2-compat-asks]] (the v2-side asks), [[sdk-architecture#Open Questions]], [[efs-account-system]], [[sdk-wallet-architecture]], and [the EFS v2 queue](./efsv2/owner-decision-inbox.md).

### R2 — Devnet (26001993): re-provision to mirror Sepolia, or independent profile?

**Fact found (2026-08-07 probes):** the live devnet does NOT mirror Sepolia — fork-local addresses, different schema UIDs, and the fork pin (10,691,000) predates the freeze blocks, so it structurally can't inherit the frozen contracts. The SDK dropped its broken built-in `DEVNET` entry (ADR-0018; override-only, clear error).

- **R2A** — re-provision the devnet with the Safe-keyed CREATE3 ceremony + deterministic views so addresses/UIDs genuinely mirror Sepolia (restores the zero-config on-ramp).
- **R2B** — accept fork-local addressing; contracts#43 ships an independently generated devnet profile the SDK consumes. **Default if unanswered** (it rides existing #43 work).

### R3 — `followRedirects` default before durable REDIRECT seeding

specs/09 makes symlink-following normative for a conformant reader (the router will auto-follow); the SDK ships opt-in `false`. Decide the conformant default **before durable symlinks are seeded** — flipping later changes what existing paths resolve to.

- **R3A** — default ON at `D_MAX=16` (spec-conformant reader). 
- **R3B** — keep opt-in `false` until the client ships and real symlink usage exists. **Default if unanswered.**

### R4 — v1 EOL shape once v2 + the import tool exist

- **R4A** — `createEfsV1Client` goes archive-read-only (maintenance-frozen; Sepolia v1 stays readable forever). **Default if unanswered — matches the "bridge" framing.**
- **R4B** — delete v1-profile code at v2 launch (bridge apps must migrate immediately).

## Superseded questions — do not ask

### ER1 — Account/onboarding default

**Example:** a MetaMask user later adds a passkey. The wallet address should not accidentally become the permanent identity if KEL is meant to rotate keys beneath a logical principal.

- **A:** reuse a detected wallet/account;
- **B:** provision an EFS/Cyphos account;
- **C:** offer both with one recommended default.

**Historical recommendation:** choose only after authority and recovery evidence.
The current greenfield work is [V2-E1](./efsv2/owner-decision-inbox.md#v2-e1--principal-surface) and
[V2-E5](./efsv2/owner-decision-inbox.md#v2-e5--realm-bootstrap-and-authority-history).
Historical input: [[efs-account-system#Decisions for James]].

### ER2 — First one-click write integration

**Example:** publishing one package may require several dependent records. Which rail can safely make that feel like one action across real wallets?

- **A:** embedded programmable EIP-7702 path;
- **B:** ERC-7579 smart account;
- **C:** direct-wallet fallback first.

**Recommendation after evidence:** choose the path with the widest verified coverage after the native v2 write graph is known. Do not inherit the old EAS-specific recommendation automatically. Details: [[sdk-write-ux#Open questions]], [[sdk-wallet-architecture#Open questions (post-review residue)]], and [[sdk-minimal-clicks#Open questions]].

## Already settled — do not ask again

- The brainstorm system was approved; promotion mechanics are agent/process work. See [[brainstorm-system]] and [[Decisions]].
- SDK architecture Q1–Q6 and the old core read-surface shape were settled within
  v1. R1 is superseded; none of that settles the EFS 2.0 SDK or identity model.
- Permissive locator schemes plus verify-before-render and confinement remain
  evidence-backed outcomes; exact implementation follows the reusable
  verifier/runner evidence gate, not an assumed EFS OS boundary.
- Specifications live in their owning repository. A cross-repo mirror remains dormant until a concrete CI need appears.

## Delegated to agents

Agents should choose reversible implementation details, record their rationale, and escalate only a real permanence or product tradeoff. Current examples include per-item partial errors for paginated reads, cache keys, enum names, relayer wire format, package placement, and feasibility spikes.

## Dormant or historical — not live queues

- [[efs-account-system]]'s smart-account-as-identity premise and the later
  logical-actor/KEL work are both historical evidence. EFS 2.0 has reopened the
  exact Principal, actor, rotation, and recovery mechanism.
- [[sdk-one-signature-writes]] and the later native-envelope recut are both
  historical evidence. EFS 2.0 is re-testing portable Publication Envelopes,
  immutable context sharing, and one-call admission independently.
- [[cross-repo-reference-mirror]] stays blocked until a concrete CI need exists.
- Old web3, BytesStore, mirror, and SDK checkboxes are implementation verification or lifecycle cleanup unless promoted back into this inbox.

## Recording rule

This page has no live answer code. New EFS 2.0 rulings belong in
[[efsv2/owner-rulings]] through the EFS 2.0 queue; historical questions stay
unchanged except for explicit supersession notes.
