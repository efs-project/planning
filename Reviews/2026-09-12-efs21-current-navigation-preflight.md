# Current Files navigation without lifetime-name scans

2026-09-12 · source preflight, not implemented or adopted · frozen full-C0 control`8688d52`

**Recommendation:** test a separate, mandatory **Files-profile current-candidate projection**. Preserve authoritative Bindings, the existing Lens and family10 history. Do not call every nonzero Binding a live file: a valid DirectoryWhiteout is deliberately Bound and can permanently hide a lower-priority entry.

This addresses a different cost from byte storage or packed posting separation. The present `openDirectory` scans family10 first-mutation anchors, validates each historical source and resolves every discovered field role. Its ordinary listing work therefore grows with lifetime names even if only two files remain. Batching those anchors does not remove that dependency.

## Minimal projection and its meaning

For each exact `(profile, principal, name-purpose, parent)` scope, keep a dense `fieldRoles[]`, inverse `positionPlusOne[fieldRole]` and generation counter. Swap-pop insertion/removal avoids holes. The profile pins the exact Files Types, name rules and relation parser; this is not generic Core knowledge or permission to reinterpret an old profile.

Classify the resulting authoritative current Binding as follows:

| Current head | Enumerate as a candidate? |
|---|---|
| DirectoryEntry | Yes. It still needs normal Files relation, child, charter and mount checks. Content is checked on subsequent file opening, not by the current directory resolver. |
| Unknown exact Type, occurrence target, malformed/mismatched relation or unsupported name | Yes. Surface unresolved results rather than silently excluding them. |
| Exact DirectoryWhiteout with valid body, matching parent/field role and supported name | No. Keep the authoritative head for Lens point reads. |
| Valid absent or tombstoned Binding | No. A tombstone is not a Whiteout: lower-source fallback can still apply. |

Do not filter candidate membership on downstream child maintenance, content availability or mount validity. Those facts can change without the name Binding changing; using them here would silently stale the index. Failure to obtain or validate the projection itself means unavailable/partial evidence, not an empty scope.

Enumerate selected sources' candidate sets, deduplicate by field role, then resolve **every emitted role through the unchanged Lens over all selected sources**. Excluded upper-source Whiteouts still participate in those point resolutions. The earliest present Binding is not a correct cross-source dedup rule: it might be an excluded Whiteout. Keep continuation dedup state or prove an earliest-*candidate*-source rule.

### The deliberately narrower completeness claim

Complete candidate enumeration can establish that every possibly visible current file position was considered at this basis. It does **not** enumerate every mask-only position or all old diagnostics. Mask-only positions and their masking diagnostics are intentionally excluded. In this exact profile a valid DirectoryWhiteout contains only parent and name, so two proven masks for the same parent/name-role have identical canonical bytes and RecordId, assuming collision resistance. Distinct malformed, mismatched or unsupported targets remain candidates and their conflicts are still evaluated. Listing all masked positions necessarily revisits them.

Expose candidate coverage and resolution outcomes separately, with a separately named mask/history audit through family10. An unresolved candidate prevents an unqualified "everything is valid/absent" conclusion even when candidate coverage is complete. Do not relabel the existing `openDirectory` diagnostics as equivalent or return an empty successful list when the projection is unsupported. This is an explicit fast-listing contract, not a silent replacement of every old listing result.

## Write, identity and read obligations

- Update after every successful relevant current-head transition: Set, explicit tombstone and withdrawal of the current head. Withdrawing a superseded occurrence does not change current membership. Pass authenticated principal/purpose/subject/field role and the resulting head, not user-asserted projection atoms.
- Classify immutable target bytes under the pinned profile. Invalid application relations remain candidates; they must not become new generic-admission rejection rules. The initial projection must be bounded and mandatory for its declared profile; a tolerated missed update cannot retain complete coverage.
- Maintain both directions of the dense mapping. Increment generation on every relevant head change, including candidate→candidate. Atomic rename changes both scopes in the same publication; late failure rolls back both projections, generations and authoritative Bindings.
- Projection/runtime/profile identity belongs in the qualified execution/read context. A proxy response asserting its own identity is not independent proof; retain the existing deployment assumptions. An unconfigured profile uses the existing historical-anchor path or explicitly reports unsupported, never zero candidates.
- Prefer fresh-genesis coverage. Late installation requires a completed family10 backfill and reconciled concurrent mutations before complete coverage; that mechanism is not supplied by a dense array alone.
- Page and resolve at one pinned state basis. Bind a cursor to projection/profile, scope, generation, offset and the read context; no mixing pages from different generations. Browser acquisition verifies its canonical header basis. A contract can check block number/state in its execution, not authenticate its own current block hash. Cross-block contract continuation must refuse relevant generation changes or use a separately designed historical mechanism.
- Retain family10/history fallback for prior profiles, historical aggregate queries and mask-only audits. No cheap historical dense-set enumeration is promised. A pinned old RPC block may work while the provider retains that state; it is not an availability guarantee.

The write price is unknown: insertions need array/inverse rows, removals may rewrite the moved role, and every relevant transition updates generation. Scope metadata packing and no-op policy should be measured, not guessed. This extra mandatory write cost must buy a demonstrated bounded read improvement. A separate projection alone does not make the remaining full-C0 writes affordable.

## Three decisive experiments

1. Thousands of prior names become valid Whiteouts; two entries remain. Compare current candidate work with the existing family10 path using identical selected sources and final Files results. Also add many **unselected** sources: ordinary listing must not scan them. Price both the extra mutation work and cold/repeated contract and browser reads; no trace-heavy mass run is necessary for the first functional test.
2. Upper Whiteout/lower Entry, tiered disagreement and threshold selection, tombstone fallback, unknown Type, occurrence target and invalid Entry relation. No false FOUND, ABSENT or COMPLETE; mask-only positions intentionally appear only in the named audit. Include an unknown target that becomes understandable only under a new profile, without rewriting old classification silently.
3. Rename/withdrawal between pages, duplicate roles across sources, candidate→candidate replacement and late rollback. Continuation stays at one pinned basis or refuses. Dense/inverse mappings and generations remain exact, including swap-pop of the first/middle/last role and re-insertion after removal.

## Source seams and sequencing

Verified at`8688d52`: `StateKernel.bindingEffect/saveBinding/withdrawal`, `BindingFold.advance/withdrawHead`, `StateLensReads.resolve/combine`, `files-reader.mjs.resolveRole/openDirectory`, and exact Files profile assessment/name-role derivation. The shared-byte implementation may change physical target access; re-pin before an implementation plan.

Independent source review approved this preflight after correcting the unrealizable different-valid-Whiteout conflict example and keeping content checks out of directory resolution. This is downstream of the [[2026-09-12-efs21-index-policy-boundary|index-policy boundary]], separate from [[2026-09-12-efs21-posting-store-plan|all-family PostingStore extraction]]. The latter preserves generic historical posting mechanics; it does not implement this current Files projection. See [[2026-09-11-efs21-overnight]].
