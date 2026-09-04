# Portable EFS agent-role system

**Status:** implementation/review evidence for the owner-approved operating-document system; no EFS protocol adoption or runtime permission grant.
**Date:** 2026-09-03

Start with the live [role roster](../../Agents/README.md) and [launch contract](../../Agents/launch.md), not this research folder. Roles are professional responsibilities shared across harnesses; they are not running tasks, human authority, private memory, or an orchestration service.

## Evidence map

| File | Purpose |
|---|---|
| [design.md](./design.md) | Approved scope, chosen structure, boundaries, non-goals and acceptance requirements. |
| [implementation-plan.md](./implementation-plan.md) | The bounded documentation and read-only helper implementation tasks. |
| [research.md](./research.md) | Official harness loading sources and empirical/engineering context, with evidence limits. |
| [scenario-review.md](./scenario-review.md) | Fresh-context eight-scenario instruction probe; restricted Claude capability-check outcome. |
| [verification.md](./verification.md) | Helper behavioral tests, structural checks, runtime versions and explicit limits. |

## Review outcomes

Two pre-implementation experts reviewed platform portability and local responsibility/authority boundaries. The document implementation then received an independent task review. That review found one mutable public-query policy embedded in the Media SOUL; commit `979dad6` replaced it with a route to the assigned source revision's media/Core rulings. Scoped re-review confirmed the issue addressed with no new breakage. No underlying media policy changed.

The fresh-context probe handled all eight synthetic cases consistently with the documented ownership, review-only, collision, source-revision and handoff boundaries. This is interpretation evidence, not an automatic permission or locking guarantee. Native Claude/Antigravity role startup is not established by the probe; see its explicit limits and the [harness matrix](../../Agents/harnesses.md).

## What to watch in real use

For the next few ordinary tasks, note whether these files reduce extra orientation questions, wrong-role/wrong-source starts, handoff restart work, duplicated edits, and failures at contracts/SDK/client seams. Use existing task notes, not a new telemetry service. There is no measured productivity improvement claim yet. If a rule adds process without avoiding a real failure, simplify it through the existing owner/role maintenance path.
