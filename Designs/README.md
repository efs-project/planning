# Designs

Design proposals with lifecycle. The canonical protocol lives in [[design-system]] (this folder's own meta-design). The vault's main [README](../README.md) is the entry point. This file is the folder-local quick-start AND the curated content map.

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
| **[`efsv2/`](./efsv2/) — the v2 design set** | `planning`, `contracts`, `sdk`, `client` | Native kernel + tag-core (carrier ruled 2026-07-07), now with the 2026-07-11 [[kel]] identity/account foundation pass. The KEL pass makes the older envelope/kernel/identity labels freeze-blocked pending authority-seam and home-admission reconciliation. Entry point and current round map: [efsv2/README](./efsv2/README.md). |
| **[`clientv2/`](./clientv2/) — the official client / web OS design set** | `planning`, `client`, `sdk` | Client v2 as a web OS (round run 2026-07-07). Entry point: [[web-os-thesis]] (ruling layer + amendments) over 13 model docs; research corpus in `Reviews/2026-07-07-clientv2-corpus/`; protocol pressure fed back via [[client-os-pressure-report]] — see [clientv2/README](./clientv2/README.md). |

#### Review

*(none)*

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
| `planning` | [[0001-design-system]], [[cross-repo-reference-mirror]], [`efsv2/`](./efsv2/) |
| `contracts` | [[cross-repo-reference-mirror]], [`efsv2/`](./efsv2/) |
| `client` | [`clientv2/`](./clientv2/), [`efsv2/`](./efsv2/) |
| `sdk` | [`clientv2/`](./clientv2/), [`efsv2/`](./efsv2/) |
