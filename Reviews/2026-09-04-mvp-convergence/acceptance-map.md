# Nine-test MVP0 execution map

**Status:** read-only execution-readiness mapping; all nine Core/browser journeys remain unrun
**Basis:** September `12ef4c5` plus this run's declared-Type-order and grant-lane repairs.
**Review:** temporary contracts-handoff reviewer; integrated by v2-pm after the original Web Client / OS lane was superseded by James's newer assignment.

The [nine existing tests](../../Designs/web-client-os/mvp0-acceptance.md) and
[five SDK seams](../../Designs/sdkv2/mvp-interface.md) retain their scope.
Every row requires the same activated G0–G12 run and exact independent expected
values. The SDK under test cannot be its own oracle. Every result retains raw
bytes, domain/basis, qualification axes and causal evidence.

| Test | Core/SDK inputs | Independent expectation | Wallet calls/prompts | Missing executable artifact |
|---|---|---|---|---|
| M0-01 | Manifest, Route/Mount/Plans, exact/scope reads, genesis BindingScope | Nested-folder direct route works without Commons/indexer/OS/Explorer; exact evidence stays inspectable | Zero; throwing wallet stub untouched | Clean-browser route plus dependency/provider trace |
| M0-02 | Exact File/Revision, ChunkTree/digest, carrier full/range reads | Body and nontrivial range verify independently; identity/availability/integrity remain distinct | Zero | Measured carrier fixture, independent range verifier and presentation trace |
| M0-03 | Scope pages, continuation and closure evidence | Required missing page preserves observed entries with partial coverage; no false absence/negative cache | Zero | Page fault injector and continuation/coverage/cache assertions |
| M0-04 | Exact/page reads with required basis, capabilities and history | Missing evidence yields qualified UNKNOWN; never substitutes latest, an empty result or another Realm | Zero | Basis/capability/history faults and no-semantic-fallback traces |
| M0-05 | Eligible-source policy and ordered acquisition attempts | Corrupt primary is available/returned but integrity-failed; only same-content verified fallback renders; no fallback means unavailable bytes, not absent File | Zero | Controlled carriers with tamper/removal and presentation assertions |
| M0-06 | Small-file plan, composite EOA witness, separate receipts, atomic effects/read-back | Exact predicted File/charter/Revision/entries/Bindings/bytes; effect stays unknown until matching read-back | Exactly one routine EIP-712 prompt; no transaction prompt; full method list retained | Real relayed CREATE_SMALL_FILE with digest-linked provider log, receipts and independent post-state |
| M0-07 | Direct EOA validation, directory/charter/name-slot effects/read-back | New empty directory resolves/lists correctly; chain-local authorship and non-certified route stay explicit | Exactly one routine transaction prompt; no prior signature request | Unavailable-relay/typed-data direct CREATE_DIRECTORY plus atomicity/read-back assertions |
| M0-08 | Grant approval/session witness, lane mapping, admission-time budgets/revocation, CAS | Same Principal/Plans/File/head key; new revision advances head while old is readable; isolated invalid attempts do not mutate | Zero routine calls/prompts; session signature and complete setup/revocation logs retained | Actual grant/session verifier and stale-CAS/substitution/replay/expiry/revocation/scope/budget corpus |
| M0-09 | State-only exact/page/byte reconstruction of prior three mutations | Cold reopen reproduces identities, selected revisions and verified bytes at cited bases | Zero | Cleared-state browser run over actual prior receipts and independent reconstruction |

## Do not confuse readiness with execution

The eight [seam-law tests](./seam-laws.test.mjs) are synthetic counterexamples
and a narrow corrected model. They are not any of the nine journeys above.
They do not establish Type parsing, encoded group-order rejection, signatures,
nonce sequencing, budgets, Solidity execution, browser UX or reconstruction.

G4 fixtures must encode declared member indexes and SR-17 SELF/GROUP_REF
sentinels before deriving IDs. Session fixtures must enforce lane zero for
normal/direct EOA and permanent per-Principal grant ownership of every nonzero
session lane, including after revocation/expiry.

For M0-06–08 retain linked setup, routine and revocation logs with incremental,
full first-use and lifecycle totals. Numeric setup totals need observation;
they cannot be manufactured from the routine one/one/zero prompt targets.

The useful build order is codecs and independent vectors, measured bootstrap
and first local write/read-back, SDK consumption of those actual artifacts,
then a separately authorized thin File Browser. This table adds no product
implementation or deployment authority.
