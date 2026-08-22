# Designs

Design proposals with lifecycle. The canonical protocol lives in [[design-system]] (this folder's own meta-design). The vault's main [README](../README.md) is the entry point. This file is the folder-local quick-start AND the curated content map.

**James:** start with the [folder-level owner decision inbox](./owner-decision-inbox.md). It routes to the current design-set inboxes and separates real owner choices from stale checkboxes and implementation work.

## Quick start (writing a new design)

1. Copy `_template.md` to `Designs/<descriptive-slug>.md`. **Do not include a number** — numbers come at promotion only.
2. Fill the front-matter (`**Status:**`, `**Target repos:**`, `**Depends on:**`).
3. Match the tag line to status: `#status/draft #kind/design #repo/<each-target>`.
4. Write the design. Open questions go in `## Open questions` as `- [ ]` checkboxes.
5. Commit: `design: draft <slug> — short title`.
6. Push.
7. When ready for review: change prose `**Status:** review`, tag `#status/review`, push.
8. When ready for promotion: fill the `## Pre-promotion checklist`, change status to `ready-for-promotion`, ask James.

See [`Onboarding/write-a-design.md`](../Onboarding/write-a-design.md) for the full walkthrough.

## File-naming

- Drafts: `<descriptive-slug>.md` — no number.
- Promoted: `NNNN-<descriptive-slug>.md` — number assigned by the human at promotion.

Reference any design as `DESIGN-NNNN` once promoted; before promotion, reference by slug or `[[wiki-link]]`.

## Wiki-link convention

Use `[[filename]]` (no extension) for in-vault references:

```markdown
see [[design-system]]
…depends on [[cross-repo-reference-mirror]]
```

Alias form when prose flows better:

```markdown
see the [[design-system|design system meta-design]]
```

Cross-repo references (ADRs, specs in dev repos) use markdown form:

```markdown
see [ADR-0041](../../contracts/docs/adr/0041-pin-tag-schema-split-for-cardinality.md)
```

---

## Content map

Hand-curated index of designs in this folder, organized by **status** then by **target repo**. Updated in the same commit as design status changes (part of the tri-sync invariant).

For automated rollups by status, see `../_Index.base` (Obsidian Bases view; configured by James).

### In flight

#### Draft

| Design | Target repos | Notes |
|---|---|---|
| **[`efsv2/`](./efsv2/) — EFS 2.0 greenfield design** | `planning`, `contracts`, `sdk`, `client` | One active successor design: standalone Core, optional Commons, direct Web Client, and optional OS. Start with the phone-readable [README](./efsv2/README.md); the Type/Record/Occurrence/Principal/Lens mechanics remain candidate work. |
| **[`web-client-os/`](./web-client-os/) — fast Web Client and modular user-owned Web OS** | `planning`, `client`, `sdk` | Active product-layer spine: route-shaped guest boot; official basic File Browser writes; `BIOS -> Kernel -> Shell -> Apps`; standards-first Signals/Web Components application foundation with a mandatory pinned modern-Web implementation-evidence gate; finite exact-Type consumer adapter with raw-preserving generated codecs and stable UI/agent DTOs; responsive installable/offline/global-use profiles; exact linkable system generations with inert inspection and local activation/rollback; Core Wasm plus WIT-shaped module boundaries; user-replaceable service slots; privacy reserves; and human/agent parity. Core/Files/Type names, canonical profile bytes, exact dependencies/module ABI, repository, and implementation remain proposal-only. The July `clientv2/` set is historical evidence. |
| **[`open-web-app-store/`](./open-web-app-store/) — permissionless software evidence graph and eventual EFS store** | `planning`, `contracts`, `sdk`, `client` | Proposed working comparison baseline for generic Project/Release identity, exact resolved package sets, immutable catalog editions, plural trust/provenance/advisory evidence, optional updates, export/reconstruction, runtime-neutral OS handoff, and the later polished store. No package bytes, Core change, registry, runtime ABI, or implementation is adopted. |
| **[`media-library/`](./media-library/) — shared media infrastructure plus Booru and Plex/Jellyfin applications** | `planning`, `contracts`, `sdk`, `client` | Owner-directed product set over generic EFS: exact media identity/verification and exit shared by a public tagged gallery and private playback library. Public queries are onchain-first; The Graph is the last-resort reference fallback after an exact measured falsifier. |
| [[brainstorm-system]] | `planning` | The `Brainstorms/` system: statuses, surfacing cap, deliberate-only pruning. Awaiting promotion. |
| **[`clientv2/`](./clientv2/) — Web Client / OS evidence set** | `planning`, `client`, `sdk` | The July Web-OS round is historical design evidence. The active boundary separates a direct guest Web Client and shared Files modules from optional EFS OS; the detailed OS architecture must re-earn adoption after the direct slice. See [clientv2/README](./clientv2/README.md). |
| **[`arcade/`](./arcade/) — the EFS Arcade design set** | `planning`, `contracts`, `client`, `content` | Initial product/MVP pass plus post-pass correction map. The 2026-08-07 research corpus is durable evidence; its demo-only framing and broad September scope are under hold while the one-game Andromeda slice proceeds behind a provisional adapter and pressure-tests EFS 2.0 Core. Entry: [arcade/README](./arcade/README.md); held queue: [arcade/owner-decision-inbox](./arcade/owner-decision-inbox.md). |

#### Review

> **The pre-v2 SDK corpus.** These files preserve useful API and operational
> evidence, but their EAS UID identity, wallet/Lens defaults, and write graph are
> not EFS 2.0 inputs by default. There is no live R1 owner choice. Reuse only
> evidence that passes the greenfield Core boundary.

| Design | Target repos | Notes |
|---|---|---|
| [[sdk-architecture]] | `sdk` | Historical SDK API surface. Identity substrate superseded by EFS 2.0. |
| [[sdk-read-surface]] | `sdk` | Read API shape. |
| [[sdk-write-ux]] | `sdk` | Historical v1 write-UX evidence; its old ER2 is superseded. |
| [[sdk-wallet-architecture]] | `sdk` | Historical v1 wallet/account evidence; its old ER1/ER2 packet is superseded. |
| [[sdk-review-backlog]] | `sdk` | Reconciled build backlog for the SDK. |
| [[sdk-vs-client-responsibilities]] | `sdk`, `client` | Boundary between SDK and client. |
| [[sdk-minimal-clicks]] | `sdk` | V1 batched single-signature writes (shipped evidence); no successor mechanism inherited. |
| [[efs-account-system]] | `sdk`, `contracts` | Historical one-smart-account identity proposal; EFS 2.0 Principal/account design is reopened. |
| [[mirror-scheme-policy]] | `contracts` | Mirror URI scheme policy; allowlist removal. |
| [[web3-standards-compliance]] | `contracts` | web3:// serving conformance. |

#### Superseded / handed off

| Design | Target repos | Notes |
|---|---|---|
| **[`efs15/`](./efs15/) — historical EAS-bridge evidence** | `planning`, `contracts`, `sdk`, `client` | Superseded implementation target preserved for universal-ID, typed-schema, admission, graph/read, exact-vector, and EAS-interoperability evidence. Do not implement its carrier prefix, sibling schemas, v1 coexistence, or ID domains. |
| [[sdk-one-signature-writes]] | `sdk` | Historical write-batching evidence; the July native-envelope replacement is also reopened. |
| [[web3-bytesstore-sdk-followup]] | `sdk` | Handed off. |
| [[write-ux-options-ranked]] | `sdk` | Historical ranked v1 write-UX options; successor write mechanics are reopened. |

#### Ready for promotion

*(none)*

### Deferred / blocked

| Design | Target repos | Blocked on |
|---|---|---|
| [[cross-repo-reference-mirror]] | `planning`, `contracts` | `#blocked-on/concrete-CI-need` — `/efs/` colocation removed the primary use case; will resurface if CI needs cross-repo ADR access. |

### Accepted (numbered, in effect)

| Design | Target repos | Notes |
|---|---|---|
| [[0001-design-system]] | `planning` | Meta-design for this vault. Canonical protocol — perpetual reference, does not progress to `landed`. Promoted 2026-05-21. |

### Landed

*(none)*

### Abandoned / rejected

*(none)*

### By target repo

| Repo | Designs |
|---|---|
| `planning` | [[0001-design-system]], [[cross-repo-reference-mirror]], [`efs15/`](./efs15/), [`efsv2/`](./efsv2/), [`web-client-os/`](./web-client-os/), [`open-web-app-store/`](./open-web-app-store/), [`media-library/`](./media-library/) |
| `contracts` | [[cross-repo-reference-mirror]], [`efs15/`](./efs15/), [`efsv2/`](./efsv2/), [`open-web-app-store/`](./open-web-app-store/), [`media-library/`](./media-library/) |
| `client` | [`web-client-os/`](./web-client-os/), [`clientv2/`](./clientv2/), [`efs15/`](./efs15/), [`efsv2/`](./efsv2/), [`open-web-app-store/`](./open-web-app-store/), [`media-library/`](./media-library/) |
| `sdk` | [`web-client-os/`](./web-client-os/), [`clientv2/`](./clientv2/), [`efs15/`](./efs15/), [`efsv2/`](./efsv2/), [`open-web-app-store/`](./open-web-app-store/), [`media-library/`](./media-library/) |
