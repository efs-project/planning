# Core prototype closeout — live evidence ledger

September15,2026 · v2 PM · core-closeout-20260915

**Status:** implementation in progress. James authorized finishing the six-packet [[core-design-audit-20260915|Core audit closeout]]. This page separates reviewed fixes from work still being implemented; no whole-prototype completion or permanent protocol claim.

## Reviewed now

**Byte-work repair, source `deb2d966223bcc54ecb1776c604213ebb1c10994`:**

- A legal255-byte filename now binds as a standalone native action under the original350k index callback allowance. No batch padding or narrower Name domain.
- Verified Name bytes use bounded bulk copying. Substring filtering uses exact linear search with one pattern preparation per page.
- Difficult negative query at candidate budgets1/4/8/32 uses559,725 /1,702,298 /3,227,519 /12,423,050 warm diagnostic gas. Before repair, budget4 already exhausted15M. The32-row result is still expensive; this is not a cold paid receipt or a practical64-author guarantee.
- Mandatory rollback, unknown-row visibility, public ABI and ordinary venue caps are unchanged. A4's unrelated-write continuation failure remains reproduced until its separate repair.
- Worker focused7/7 and covering58/58 pass. Parent fresh focused-path rerun passed55/55 including inherited covering checks. Independent Astra High spec/quality review approved with no Critical/Important findings. Existing/inherited Foundry-harness warnings are disclosed; affected deployable helpers fit runtime/initcode limits.

Evidence is retained with source in `lab-b/core-closeout-bytework-20260915/` on the existing prototype branch, not copied into canonical planning as code. [[core-closeout-bytework-plan-20260915|Exact task and constraints]].

## Six-packet finish line

| Packet | Current state | Evidence still needed |
| --- | --- | --- |
| 1. Ordered acceptance and application atomicity | Implementing coherent prefix indexes plus final Files checks. | Batch singleton/live quota, eight-ref game predicate, mutable dependency, atomic app rollback, normal deployment/runtime fit. |
| 2. Full required index bundle and evolution | Concrete source preflight in progress. | Complete manifest, generic role/target references without duplicate Files appends, declaration semantics, populated replay/catch-up/cutover, joint costs. |
| 3. Resource envelope and avoidable overhead | Name/search waste repaired and reviewed. | Cold paid joint body/ref/name/Lens bounds, full required-profile callback costs and same-guarantee storage/evidence decomposition. |
| 4. Contract query progress and live-backed Files | [[core-closeout-query-plan-20260915|Query implementation plan]] ready. | Owned paid continuation, retained-origin HEAD/tag joins, scope-mutation limits, typed live provider and immutable snapshot cost comparison. |
| 5. Type interpretation, participation and authority | Type/registration preflight in progress. | Recoverable third-party descriptors/compatibility, non-griefable public registration, smart-wallet evidence, authenticated native provenance and honest private/external boundaries. |
| 6. Integrated access and complete economics | Earlier small local journeys remain source-pinned. | Final cold Files/native-app journey, bounded SDK transport, actual public-provider access and all-in network fees. |

## Engineering direction from this pass

**Ordered acceptance:** retain developer rules before each proposed leaf. After each leaf, synchronously maintain the required index so the next rule sees the same staged prefix through direct and indexed reads. A separate mandatory read-only final phase validates Name/Directory obligations, preserving Name-after-placement in one atomic batch. One jointly spent allowance and a publication/configuration lock prevent hidden gas inflation and reentrant mutation. [[core-closeout-acceptance-plan-20260915|Implementation plan]].

**Paid pagination:** preserve origin A; guard the selected folder inventory with exact mutation admissions; resolve HEAD and tags at A through retained history. This allows unrelated writes without mixing snapshots. An owning contract accumulates authenticated pages. Relevant folder mutation still invalidates the fast profile; retained-inventory historical traversal is a separate measurable alternative, not a silently stronger claim. Current mutations must revalidate their current dependency read-set.

**Public Types:** removing the admin check alone is unsafe. New registration currently bumps the global epoch, and identical rule code can have different storage in different instances. Investigate portable recoverable declarations and a finite structural interpreter without allowing a stranger to choose somebody else's local stateful rule binding. Do not require a vanished creator to freshly sign every destination merely to retain or interpret a portable Type.

No owner choice is being waived. No UI polish, production repository, public deployment, Claude/Fable usage, owner-demo change or new recurring run. One Astra High/Extra High source/build worker at a time; independent read-only specialists and scoped review run alongside it.
