# SDK acknowledgment — Core delta through `5d75309`

**Status:** consumed draft delta / design evidence only; no runtime compatibility
or protocol-adoption claim
**Date:** 2026-09-04
**Role/session:** sdk-pm / Codex / `01a02a24-01b3-7f12-9f2e-887aea66e9e8`

The original [five-seam crosswalk](./README.md) at SDK commit
`d86b6469c908036db3095d8643806ab6a766849f` remains pinned to September
`12ef4c5b929759c87fcf4886a1619734a6f9a044`. It has not been rewritten or
relabeled. This follow-up explicitly consumes Core draft changes through
`5d7530993339a0786aa41e1dbb0fd786cd450f32` on `codex/mvp-c0-coherence`.
"Current" here means reviewed through this exact commit, not every future
branch tip, an executed profile or automatic compatibility with older runs.

## Exact sources inspected

Use `git show <commit>:<path>` in the planning repository. Origin was fetched;
no worktree merge or rebase was performed.

- Diff from `12ef4c5b929759c87fcf4886a1619734a6f9a044` to
  `5d7530993339a0786aa41e1dbb0fd786cd450f32` for
  `Designs/efsv2/disposable-mvp-profile.md`,
  `Designs/efsv2/mvp-c0-genesis-manifest.md` and
  `Designs/sdkv2/mvp-interface.md`.
- At the latter commit, `Reviews/2026-09-04-mvp-convergence/README.md` and
  `seam-laws.test.mjs`, including their explicit test limitations.

There are two Core draft repairs; the SDK interface file and the declared
WritePlan fields/type string are unchanged by this delta. Unchanged fields do
**not** mean unchanged acceptance rules or interchangeable run commitments.

## SDK consequences

| Repair | Consumer/generator consequence | New evidence to retain / missing execution test |
|---|---|---|
| G4 fixes group membership order before hashing | Assign the declared left-to-right member indexes first; preserve `SELF`/`GROUP_REF(k)` sentinels and their assigned indexes in Type blobs; encode ordered group bytes, derive group hash, then derive member TypeSchemaIds. Derived IDs are outputs, never sort keys or a fixed-point search input. | Manifest ordered group inventory, original Type/group bytes, member indexes and derived commitments. Missing/duplicate/substituted/reordered encoded inventories must reject; local-reference parse/encode and independent ID vectors still require real codec tests. |
| Normal composite EOA and direct EOA use nonce lane zero | Planner selects `nonceKey=0` under those explicit paths. It must not inherit a session lane or ask for an extra signature to satisfy a stage type. Switching path invalidates/rebuilds the plan before approval. | Exact plan/profile/path and nonce-sequence evidence. Actual entrypoint enforcement of lane zero, uint192 width and replay behavior are not established by this acknowledgment. |
| Each nonzero session lane binds one grant per Principal permanently | The session planner must match the exact grant's signed nonzero uint192 lane. Select by `(bootstrapPrincipalId, nonceKey) -> grantId`, not merely session key compatibility, a truncated hash convention or a mutable alias. | Grant bytes and EOA approval witness; immutable mapping and revocation/budget/nonce evidence at admission. Two grants for the same key must not accept the same plan interchangeably. Substitution must leave head, nonce and budget unchanged. |
| No lane reuse after revocation/expiry | Never recycle an old grant's lane, reset consumption on registration replay or route an old signature to a replacement grant. Unknown mapping/history is not authority to guess or widen a grant. | Historical mapping survives alongside each admitted write's authority basis. Revocation blocks future use but does not rewrite historical authorization or the File/Principal/head identity. Expiry, replay, sequencing, width and budgets need isolated implementation tests. |
| Grant identity avoids a self-referential preimage | Derive grantId from the committed run codec without inserting that same identifier into its own preimage. Do not invent a different SDK derivation. | Exact grant codec/preimage and independent expected identifier; still an input gate for the next executable adapter. |

The retained evidence handles in the five-seam crosswalk must include these
order/index and grant-mapping facts when relevant. A smaller product DTO may
hide their display, not discard their raw backing or historical qualification.
No new universal result wrapper or WritePlan field is needed for these repairs.

## What remains unchanged or unproved

- The previous receipt-timing finding is still open in the **inspected SDK
  source**: local pre-submit checks/witnesses are not Core-accepted
  authorization. The root's two repairs do not modify that interface text.
- The original nine-case SDK representation probe remains representation
  evidence only. It does not validate ordered Type groups, grant binding,
  nonce lanes, admission, signatures, byte integrity or state proofs.
- The coordinator reports eight passing synthetic law tests and independent
  repair review. Inspection confirms the tests use synthetic member bodies
  and a narrow grant model. We did not rerun them or the completed August
  source-lock suite. They do not prove Type admission, group-reference parsing,
  encoded-reorder rejection, uint192 enforcement, expiry, nonce sequencing,
  full budgets, cryptographic signatures or browser/Core runtime behavior.
- The profile's existing non-adoption rule applies: any executed run whose
  semantics differ requires new run/experiment commitments and a fresh Realm,
  not an in-place upgrade. No executed run or signed data is created here.
- Web Client/OS's former lane was superseded by James's extension assignment.
  It is not an outstanding SDK dependency or permission to retask that PM.
  The coordinator's acceptance map is the supplied coordination artifact,
  not proof that the nine browser/Core journeys ran.

## Next deliverable and handoff

The next deliverable remains the single unpublished, run-pinned create-file
adapter fixture in the original crosswalk. Its input packet must now bind this
repaired source revision and declared group order; its normal EOA plan must use
lane zero. The subsequent same-Principal session revision arm additionally
requires the immutable grant/lane mapping, historical evidence and isolated
substitution/reuse/expiry/revocation negatives above.

No genuine new owner choice is identified. Exact codec/vector production and
SDK/Core integration remain evidence/implementation tasks within the separately
authorized disposable run. This acknowledgment adopts neither B0 nor the
August split Type/QueryProfile design as a permanent protocol decision.
