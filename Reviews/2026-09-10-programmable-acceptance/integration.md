# Integration boundary for Fable and the real testnet

**Status:** proposed integration contract; this laboratory has not modified or
integrated with the pinned Files Core.

## Ownership

Fable continues export/recovery and real-wallet work on its own branch. This
branch adds only a separate acceptance lab and scoped design evidence. Do not
merge all historical design/runtime branches to obtain it. The experiment starts
at `92f2d6b` and the complete delta lives on `codex/programmable-acceptance`.
Initial implementation commits are `496eb1d`, `a44362e`, `bfe7f0e`; subsequent
review corrections are required, not optional polish. Use the final branch head
reported with publication, not those initial commits alone.

For evaluation in Fable's own checkout, import the complete new
`Reviews/2026-09-10-programmable-acceptance/` directory from that final head and
read its README. It has no source dependency on Fable's export/wallet/browser
increment. Do not transfer `node_modules`, ignored compiler outputs, local
evidence captures or an active chain environment. The small design note/README
link and dated agent status are coordination changes, not runtime dependencies.
No shared runtime Core or SDK source was changed by this lane.

## Smallest implementation sequence

1. **Contracts:** port only the authenticated acceptance/context/receipt seam into
   the real shared writer. Integrate actual Type structure and staged references,
   then add Outfit and PaidClaim as application fixtures. Preserve the populated
   testnet-upgrade mechanism; this immutable lab is not its replacement.
2. **SDK:** put declaration-required rule checks and generated encoders behind
   existing exact-Type bindings and five seams. Extract narrow read/registration
   interfaces: the lab's generated Solidity currently imports concrete Core, and
   the independent consumer needed a tiny read-interface extension. Keep receipt
   provenance/canonical ABI checks; don't use transaction success as effect proof.
3. **Files + wallet join (Fable lane):** use one authorized publication plan and
   independent canonical read-back through the normal browser workflow. Add
   acceptance to that plan rather than signing a second bespoke hook message.
   Port the independent consumer as a contract-level canary, not a browser
   dependency.
4. **Integration gate:** run the joined regressions below and an export/reload/
   independent reconstruction trace. Only then label the actual testnet boundary
   integrated. Permanent byte/ID policy and public deployment remain separately
   authorized choices.

## What an integration must preserve

1. Attach the mandatory rule commitment to the actual exact Type identity
   contract. The lab's finite flat representation is not a substitute for the
   real structural validator, automatic indexes or finite reference rules.
2. Make the shared Core commit boundary enforce the rule for every new accepted
   occurrence and application transition. A router-only check is insufficient
   while direct/operator/import/migration paths can confer the same acceptance.
3. Pin the rule's local activation in the authorized WritePlan. Retain existing
   publication, route/controller consent and atomic effect commitments. Do not
   add a second wallet signature just to call the acceptance hook.
4. Reuse Core-authenticated Principal/actor/submitter context. The lab's intrinsic
   account author is not the arbitrary first-claim Principal fixture or a
   complete managed identity/session/smart-wallet implementation.
5. Store the historical rule/activation/application basis alongside the accepted
   occurrence and preserve it through upgrades. No ordinary reader needs to call
   arbitrary validator code to prove historical acceptance.
6. Integrate atomic stateful effects, exact-value accounting and rollback with
   actual Binding/index/receipt writes. The lab proves only its own state and
   dependent contracts, not unmodified C0 storage branches.
7. Keep raw structural reads visibly distinct from accepted application actions.
   A generic relation to an old Outfit cannot make an Equip transition accepted.
8. Let generated helpers compose the existing five SDK seams and Inspector
   evidence. Do not make the Files browser depend on this lab's harness or static
   fixture keys. Fable owns export proof-chain and real-wallet integration.

The lab's named “equip the previous Outfit” helper solves a concrete same-plan
hash cycle: including a receipt ID derived from the plan inside that same plan
would be recursive. Its zero-reference encoding is explicitly a fixture rule
semantics, not a new generic reference primitive. Map it deliberately to the
real publication's indexed/staged reference model during integration; do not
adopt a magic zero across unrelated application Types.

## Required joined regression before real implementation is accepted

Repeat invalid direct/import/reuse/controller/batch writes, hook spoofing,
same-plan retry/fresh value, same-batch uniqueness and late rollback against the
actual upgradeable Core, including privileged migration/bootstrap entrypoints.
Then run the normal create/edit/rename/remove/restore/tag Files trace, populated
upgrade and independent read-back. Ensure no failed acceptance leaves a Binding,
index, carrier/accounting or receipt effect. Show one real wallet authorization
path with funding and staging accounted separately.

Those tests are integration work, not grounds to discard the existing passing
Files evidence or claim this standalone lab completed the whole MVP.
