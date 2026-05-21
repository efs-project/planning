# Designs — Map of Content

Hand-curated index of designs in this folder. Organized by **status** then by **target repo**. Update in the same commit as design status changes (part of the tri-sync invariant).

For automated rollups by status, see `../_Index.base` (Obsidian Bases view; configured by James).

---

## In flight

### Draft

| Design | Target repos | Notes |
|---|---|---|
| [[design-system]] | `planning` | Meta-design for this vault. Currently in draft; will become `0001-design-system.md` at promotion. |

### Review

*(none)*

### Ready for promotion

*(none)*

## Deferred / blocked

| Design | Target repos | Blocked on |
|---|---|---|
| [[cross-repo-reference-mirror]] | `planning`, `contracts` | `#blocked-on/concrete-CI-need` — `/efs/` colocation removed the primary use case; will resurface if CI needs cross-repo ADR access. |

## Accepted (numbered, in implementation)

*(none yet — promotion ceremony has not run)*

## Landed

*(none)*

## Abandoned / rejected

*(none)*

---

## By target repo

| Repo | Designs |
|---|---|
| `planning` | [[design-system]], [[cross-repo-reference-mirror]] |
| `contracts` | [[cross-repo-reference-mirror]] |
| `client` | *(none)* |
| `sdk` | *(none)* |
