# Names can be required and recovered without a Core dictionary

September14. Disposable compact-B Files profile experiment. Final whole-suite
execution passed169/169; same-source normal-size build and final independent
review passed. Source `a3fb54e0c362ff59fdffd00254ca08b82172a69f` and evidence
`1829dad1b2172aea4931864c538429e030361c94` are pushed on the existing authorized
`codex/efs-warroom-b-run` prototype branch.
This is contract-side evidence, not a cold browser or production Files release.

## What it establishes

An ordinary exact Name Type retains filename bytes. Its content hash is the
placement role, so a reader derives the Name Record ID directly from the pinned
Type and role. No global filename dictionary or per-File mutable name is needed.
One File can have multiple differently named placements; another File can reuse
a vacated name without inheriting the first File's identity or tags.

The existing required index callback enforces name retention for this profile's
folder placements. A signed batch or direct generic BIND without its Name
rejects atomically. Name publication may follow BIND in the same atomic action
vector: the callback sees the final state. Previously retained names can be
reused without another name occurrence. Existing required parent and scope
maintenance continues to work. No existing Core or index module was changed.

The bounded reader returns actual verified bytes, not a friendly fixture label.
It checks the placement, exact Type/rule, body identity and actual Core record
header at the specified current execution basis. Withdrawal of the final Name
occurrence leaves its retained bytes readable, without selection fallthrough.
Bad or unavailable name responses do not erase known folder membership.

## Tests changed the implementation

The original six-test source was frozen through behavioral RED (1 pass, 5
intended failures) and GREEN (6/6). Independent review then found that correct
name bytes with a plausible but false earlier admission could pass the source
adapter. A separately disclosed seventh regression reproduced that failure.
The correction compares Type, first admission and byte length to the actual
Ledger header before returning FOUND. All seven pass in the final full suite.
Original six test bodies were not weakened or replaced.

With Solidity0.8.30, Cancun, viaIR and optimizer200, normal runtime/compiler
initcode bytes are8,341/12,562 for the derived Names index,4,845/6,122 for the
name reader and741/767 for the Name rule. Core remains17,280/17,670. No raised
application size limit was used. Compiler initcode excludes constructor
arguments. Oversized Foundry test harness warnings do
not describe those deployable modules; these sizes are not paid gas prices.

The full suite has169 executions:135 distinct cases plus34 inherited repeats.
Source digest:
`b0ba64c292576b615a7193c07728643a96d81f55cd1b8c831a38abaf12567140`.
Final profile SHA256:
`4201fd5908180c5f95d836563a8deae908d7208179b4fe3b211c73ff323ac48e`.
Final tests SHA256:
`7e89b47991e49a51344fd4ab00f202927133afa48fbffe4df2afd47658b0e616`.
Independent final review SHA256:
`5cf4275a8c98bbee9b0463d9dbb597a928679466abda1ebef6039d8139487524`.

The retained `lab-b/files-names-20260914/` packet contains47 compressed payloads,
complete historical compiler inputs/outputs and source inventories, actual
gate reports, preflight, plan and independent review. Root verified the exact
inventory and all gzip/raw hashes:88,581,907raw →11,739,009gzip bytes.
Manifest SHA256:
`6eba61b0c6e4a845dfd2c5ed27a3aad3213b7b276b909b544d8fd4f33516e10f`.

## Deliberate limits and next step

- Names use a disposable1–255-byte lowercase ASCII subset, not Unicode or a
  frozen ecosystem grammar. This lab's raw-hash role differs from the fuller
  hierarchy draft's domain-separated role; they must not be silently mixed.
- One folder ID is explicitly mounted as `/`. This does not prove nested path
  ancestry, directory kinds, mounting policy or a working cold browser.
- The caller supplies independently qualified placement membership. The name
  helper does not select Lens authors, authenticate block/state roots or prove
  complete named listings. MISSING means a missing source response, not proven
  Core absence; unknown names remain visible as unresolved member rows.
- The source call has a100,000-gas cap and416-byte output buffer. Source review
  and these cases are not exhaustive ABI fuzzing or a maximum-batch budget proof.
- No paid run was repeated. Earlier hashed-name Files prices do **not** include
  this additional required name action/callback/reader, and test-function gas is
  not an action price. The attached required module is part of the testnet
  profile; replacement authority has not been removed.

Next connect this tested dependency to the small cold guest Files journey in
[[sdk-explorer-build-boundary-20260914]], retain placement/HEAD provenance in
the adapter, and separately price the complete named action. That is a concrete
integration task, not evidence that another Core noun is necessary.
