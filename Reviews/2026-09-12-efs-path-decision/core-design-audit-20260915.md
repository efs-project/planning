# EFS v2 core audit: what still prevents a finished prototype

September 15, 2026 · v2 PM · core-audit-20260915

**Status:** audit findings and prototype closeout recommendation; no protocol choice, requirement waiver, public deployment or production-repository authority.

**September16 final closeout:** the findings below describe the pinned audit source, not defects all still present at today's HEAD. [[core-closeout-results-20260915|The final results ledger]] records the completed bounded six-packet pass through `c9cc15b`, including clean-build integrated costs and the [[core-closeout-final-review-20260916|single independent combined review]]. No Critical/Important defect was identified in the inspected scope; six nonblocking evidence/test findings remain explicit. Ordered acceptance, required index/replay, query progress, described Types, wallet authority, live Files, stance tags and bounded native proofs work within their stated profiles. Wide reads remain costly, native recovery's tested joint maximum refuses, and exact archive/build compatibility plus public-environment/product breadth remain gates. The [[compact-mvp-build-plan-20260914|real-code handoff]] is now the next-step map. Historical red fixtures below explain why the work was done; they are not an instruction to reopen the completed pass or a claim that the full product is finished.

## Bottom line

**Keep the compact Ledger / separate required index direction, but do not call
the core prototype finished.** Normal Files operations work. The remaining risk
is in composing those operations under concurrency, maximum valid inputs,
developer-written rules, evolving indexes, and different authority/Type profiles.
This audit found four reproducible limitations that the successful small
journeys did not expose. They justify more targeted core work, not another
three-road architecture tournament or more UI polish.

This is the current whole-core risk map. The September 14 feasibility and
September 15 recovery reports remain valid **within their measured scopes**;
their completion labels are not whole-prototype completion. Read this before
dispatching only the previously suggested live-file experiment.

## Scope and evidence

Inspected canonical planning `943da3f9a713db54d17cf7fb87113dece9da9391` and compact
prototype `23a331e468102512d01acbf422dbf8a9349ee7b3`. The constitution and current
owner rulings outrank the explicitly historical assumptions ledger.

Two independent read-only specialists completed economics and longevity reviews.
A third read/write lane returned source findings but did not complete its review;
the parent inspected the relevant paths and wrote/ran the reproductions below.
This is a focused engineering audit, not a completed independent security audit.
An additional read-only evidence reviewer found no Critical/Important error in
the report or reproductions. Its minor request to assert the observed filter
success/exhaustion pattern and zero matches was applied; the final focused
five-check rerun reproduced the same measurements. No general suite was rerun.

New code consists only of disposable `test/CoreAcceptanceAudit.t.sol` and
`test/CoreReadCostAudit.t.sol` under the existing compact lab. No Ledger, registry,
index, SDK, browser or owner-demo behavior changed. Five focused Foundry checks
reproduce open limitations; **their passing means the limitations were reproduced,
not that the system passed these requirements**. The initial long-name setup
failed unexpectedly, and its trace identified index callback exhaustion.

Reproduce from `Reviews/2026-09-12-efs-path-decision/lab-b/` in the existing
prototype worktree, using run-specific output/cache paths:

```sh
forge test --match-path 'test/Core*Audit.t.sol' --match-test test_audit_ -vv
```

Compiler: Solidity 0.8.30, optimizer 200, via-IR, Cancun. Foundry setup is an
unconstrained fixture, not a deployable production contract or priced transaction.
The measured reads are separately fenced at 15M gas, with setup-warmed state.
They are not cold receipts, L2 fee estimates or runtime-size evidence.

Source paths below are relative to the compact lab. Retained baseline receipts
remain pinned to their earlier packets; this audit did not rerun that campaign.
The prototype's `core-audit-20260915/` packet retains the complete five-check
output and the initial long-name failure trace, with their different scopes.

## Four newly reproduced problems

### A1 — Indexed validation does not see the same ordered prefix as direct records

**High priority: acceptance/API semantics before extraction.**

An ordinary mandatory rule checks the required by-Type index with COMPLETE
coverage and accepts only when the count is zero. Two distinct records of that
Type in one publication are both accepted. The same rule correctly rejects a
second, separate publication. Both resulting records and index entries exist.

`Ledger._run` applies leaves in order, but `_counters` and the index update only
in `_endPublication` (`src/Ledger.sol:555–601,648–658`). Direct referenced Records
can see earlier leaves; `IndexModule.coverage/postingHead` still describes the
previous committed prefix (`src/IndexModule.sol:101–153`). This is not broken
EVM rollback or a false claim about that old prefix. It is a missing contract
between transaction validation and index-backed queries. The same pattern can
affect uniqueness, quotas and game inventory rules.

**Required closeout:** choose and enforce the validation read model. Options
include prefix-aware query/context support, staged index maintenance, or a
separate final-state invariant phase. Merely documenting the surprise or forbidding
all useful state-dependent rules does not meet the developer goal. Each option
must preserve same-batch references, mandatory no-bypass validation, isolation
from external observers and atomic rollback. A rule deliberately using pre-state
must identify that fact; it cannot be advertised as checking post-batch uniqueness.

### A2 — A legal filename can fail an ordinary native placement

**High priority: accepted input and mandatory callback budgets disagree.**

A 255-byte lowercase ASCII Name passes its Type validator and is retained.
Binding a File under that name then fails `E_INDEX(0x)` even with 15M caller gas.
The trace shows `FilesCarrierIndex.onAdmission` exhausts the fixed **350,000-gas**
single-action callback. A short-name placement succeeds; the failed binding
rolls back. A legitimate two-action Name-plus-placement publication succeeds
under the existing 500,000 callback allowance and supplies the next test fixture.
No limit was raised and no index check bypassed.

Root: `src/Ledger.sol:889–896` budgets `200k + 150k × action count`, while the
stacked Files index performs name loading/copying/validation and other work whose
cost also depends on inputs (`test/FilesNamesProfile.sol:20–62,90–110` and derived
Files indexes). More gas on the outer transaction does not increase this cap.

**Required closeout:** eliminate demonstrated redundant work and price a
joint callback envelope for each supported profile/operation. Prove maximum
legal names work for native single-action writes and normal signed batches.
Padding a batch with extra actions is a diagnostic, not an acceptable fix.
Do not quietly shorten the filename requirement or inflate the venue cap.

### A3 — Valid substring filtering has a major compute cliff

**High priority: the row budget is not a gas budget.**

The actual joined reader uses nested substring loops after loading Names and
selected HEADs (`test/FilesPageReader.sol:129–146`). The fixture has 32 valid
255-byte names, two selected principals, and no tag joins. The difficult negative
query is 127 `a` bytes followed by `b`; control is `zz`. Both are permitted inputs.

| Candidate budget | Short-negative warm call gas | Difficult-negative result at 15M |
| --- | ---: | --- |
| 1 | 414,852 | succeeds, 5,835,900 gas |
| 4 | 1,400,857 | exhausts allowance |
| 8 | 2,722,688 | exhausts allowance |
| 32 | 10,698,852 | exhausts allowance |

These are measured call-region diagnostics, including caller overhead, not paid
transaction receipts. State warming does not rescue the failing cases. This
does not prove the irreducible cost of filtering: the substring algorithm and
byte-copy loops are implementation choices. Nor does it establish that tag-only
queries have this particular substring cost.

**Required closeout:** a bounded linear-search implementation or a clearly
separated search profile, followed by actual paid cold reads with joint bounds
on selectors, candidates, name lengths and requested joins. Preserve unknown
rows and coverage; a failed/partial search cannot become a verified empty answer.
Keep the promised tag/filter floor explicit if substring search moves client-side.

### A4 — Unrelated writes invalidate continued paid listings

**High priority: current-state query liveness, not just performance.**

Reproduction: read page one of a two-file folder; publish unrelated binary data;
request page two. Old basis fails `E_BASIS`; replacing it with the new basis fails
`E_CONTINUATION`. The folder and its Files did not change. Current guards require
the global admission frontier to match (`src/LensReader.sol:155–175`,
`test/FilesPageReader.sol:43–58`). This check is correct for the implemented dense,
mutable inventory, but gives no progress guarantee under continuous Realm writes.

The test uses actual contract calls with intervening Ledger state changes, not
historical-RPC mocks; it is not a measured three-transaction paid scan. Existing
successful full traversals did not interleave writes. A browser may keep reading
an old block via a suitable RPC. A paid contract cannot obtain arbitrary old
EVM storage merely by requesting that block number.

**Required closeout:** separate bounded single-transaction point/path reads,
current pagination, and authenticated complete multi-transaction queries.
Evaluate query-local versions for unrelated-write progress and a maintained
aggregate or versioned/snapshot index for genuinely changing scopes. A paid
accumulator must authenticate its prefix, not trust a user-supplied cursor hash.
Do not promise continuous-write snapshot completion using the current API.

## Other material gaps

| Gap | What is known | What is not yet earned |
| --- | --- | --- |
| Complete mandatory index bundle | Required scope/history/binding-backlink/by-Type/by-author and Files-specific live/reference families exist; a separate selective-reference fixture works. | One coherent generic Type/index declaration with every retained owner obligation, eight-reference/hot-key pressure, and full joint write/read pricing. A declaration method is not maintained data. |
| Populated index evolution | Compatible populated Ledger proxy upgrades work. Late index attachment honestly reports PARTIAL. | Bounded backfill and concurrent-write catch-up to independently verified COMPLETE. `attachedFrom` is immutable, `gapped` never clears, and `bumpGeneration` is not a backfill implementation (`IndexModule.sol:48–87,129–145`). |
| General Types and old-app compatibility | Exact Type/record IDs, checked refs and three hand-coded Note versions/projections work. | Generic recoverable schema/codec descriptors and independent interpretation of a third-party Type. `Keys.sol`/`LabBase.sol` explicitly use opaque shape commitments, not an implemented schema language. Reading known fields does not authorize edits that ignore new restrictions. |
| Mutable validation dependencies | Mandatory bounded STATICCALL code is pinned and always invoked on publish/reuse. Historical acceptance is distinct from new action authority. | A real RPG-like predicate with cold references, mutable dependency changes and atomic application effects. Codehash does not pin storage or transitive calls. A portable historical acceptance claim is not automatic destination revalidation. |
| Smart accounts and native provenance | EOA signatures and native `msg.sender` authorship work locally; signed EOA evidence can be preserved by someone else. | ERC-1271 signed ingress/history and authenticated native source provenance. Native calls are not the same demonstration as smart-wallet signature validation. Current archive/export is EOA-only. |
| Practical reconstruction | Anyone can retain EOA-signed evidence without gaining Alice's authority. Nine fresh EOA approvals restore exact identities in unused destination namespaces. | Selective project import, populated-namespace merge, withdrawal mapping and contract-authored evidence. Fresh approvals are needed for the measured editable reconstruction, **not** for already-demonstrated EOA evidence preservation. Universal copy/attribution must not silently become universal edit authority. |
| Permissionless participation | Independently deployable experimental Realms; exact mandatory rules cannot be silently removed. | Normal unrelated-developer Type registration: current registry is admin-only. Plural Realms help exit but are not equivalent to permissionless participation in each Realm. Testnet upgrade/admin disclosure is not permanent neutrality. |
| Live-backed Files | A reviewed descriptor/revision/index/reader plan exists. | Actual provider-only updates, bounded paid consumption and immutable snapshots. It cannot also invent per-update EFS history or automatically maintain changing-value indexes without observing those updates. |
| Public access and fees | Cold local reads need no private EFS data server. Qualified failures and source-off EOA verification work. | Usable public-provider cold access, historical-basis support and all-in network fees. The current ordinary guarded write recipe uses roughly 256–277 HTTP requests; immutable cache/batching is feasibility work, not cosmetic polish. |

The current Ledger runtime is 24,173 bytes, leaving 403 below the tested 24,576
limit. Modular decomposition is ordinary engineering, not a reason to abandon
the data model; nevertheless, extending this nearly full module without an
explicit storage/call/authority boundary is not a credible default plan.

## Where gas becomes unacceptable

Retained **whole local receipts** for the matched guarded 41-byte Files recipe:
create **2,259,447**, edit **1,191,659**, stable-File tag **812,657**, revision tag
**998,511**, rename **1,324,819**, native application read/check/write **1,201,820**.
See [[compact-core-feasibility-20260914]] for exact source/calldata pins. These
are not measurements of this audit's HEAD or the newer carrier/recovery recipe.

The earlier approximately 50k-per-tag engineering target in the owner's ruling
has **not** been established for a complete standalone guarded tag action.
Do not compare a marginal index append with a whole signed publication and call
the difference solved. We still owe a same-guarantee cost decomposition.

Dominant risks:

- **New permanent bytes on every update:** Record payloads, evidence and full
  guard-set ABI preimages. A maximum 64-principal × four-coordinate read-set
  contains 256 expected heads before framing; changing heads defeats dedup.
- **Mandatory index fan-out plus conservative reserve:** a retained 55-action
  setup failed `E_GAS` after spending 9.19M under a 15M transaction allowance.
  Nominal maxima of 64 actions, eight refs and 8KiB bodies are not a promise that
  their Cartesian product fits. Splitting an atomic operation changes its semantics.
- **Low-selectivity, wide-Lens reads:** work follows examined candidates and
  author probes, not result count. Existing 64-principal/1,000-candidate filtered
  traversal needs 250 pages; a complete negative query may be the expensive case.
- **Bulk recovery:** nine-claim archive plus editable reconstruction is 24.42M
  across transactions before setup. The archive is an optional recovery route,
  not a surcharge every normal write automatically pays. Forced prefix replay
  and per-claim approvals are also practical costs, not only gas.
- **Frequency:** an occasional portable document is a different product from
  duplicating every swap, game tick or autosave. Live contract-backed Files are
  the most important untested alternative for the latter, not a proven saving yet.

**No measured irreducible EFS overhead floor exists yet.** Keep attribution,
history, validation and required discovery priced, but do not call ABI duplication,
per-word payload storage, repeated profile checks or naive search fundamental.
Nor is a raw MUD table cell a matched equivalent of a fully named, portable,
history-bearing File. Compare shared guarantees and count omitted features.

We must not rely on future EVM upgrades making this cheaper. The currently
review-stage [EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) and
[EIP-8038](https://eips.ethereum.org/EIPS/eip-8038) propose higher state-related
charges; they are not deployed facts. EIP-8037 also changes resource accounting,
so multiplying today's total gas and comparing it mechanically with today's
transaction cap would be misleading. Use explicit schedule scenarios.

Execution gas is also not the complete L2 bill. For example, Base separately
documents execution and L1-data fees and a serialized-transaction fee oracle.
Use the [network fee model](https://docs.base.org/specifications/transactions/network-fees),
not a localhost receipt multiplied by one advertised gas price.

## What is impossible under the stated mechanisms

These are boundaries, not reasons to discard EFS:

1. An arbitrary unbounded scan/validator cannot be guaranteed to fit a bounded
   transaction. Contracts calling `view` functions still pay their execution
   cost; [Solidity's gas-limit guidance](https://docs.soliditylang.org/en/latest/security-considerations.html#gas-limit-and-loops)
   explicitly covers this distinction.
2. A no-snapshot current-state cursor cannot promise the same complete historical
   answer while its basis continually changes. Persist/version the needed state,
   prove a snapshot, use an aggregate, or state the weaker supported guarantee.
3. Ordinary public-EVM code cannot privately inspect plaintext it cannot see.
   Ciphertext validity and client decryption are feasible; stronger ZK/FHE/TEE
   profiles change mechanisms/costs and are not secretly supplied by a schema.
4. A hash cannot retrieve the last lost copy of bytes or regenerate a destroyed
   sole decryption key. Preservation/custody and recovery policy remain necessary.
5. A native destination contract cannot infer authenticated foreign-chain history
   or current authority from an RPC transcript or matching contract address alone.
   A verified proof/finality profile or explicitly trusted witness is required.
6. Arbitrary future fields cannot be automatically interpreted with unchanged
   meaning by an old application. Explicit compatible projections can preserve
   supported views; unknown permissions/restrictions must not silently disappear.
7. Registering a live file once cannot provide a free permanent EFS revision and
   complete current-value index for every later provider update. Someone must
   retain/observe the facts needed for those additional guarantees.

None proves that bounded contract filesystem operations, programmable validation,
portable attributed data, private payloads or explicit version evolution are
impossible. The combination and execution profile must be stated accurately.

## Finite prototype finish line

These are six bounded engineering packets, not six new architecture projects.
Keep one coherent compact implementation. Each packet ends with retained inputs,
one ordinary journey, decisive negative controls, actual relevant costs, and
either a met requirement or an explicit unresolved owner tradeoff. A documented
unsupported feature does not count as meeting a retained requirement.

| Order | Packet | Exit evidence |
| --- | --- | --- |
| 1 | Acceptance/read-phase contract | Fix A1 under a stated model; same-batch refs, singleton/quota, one RPG equipment/dependency rule and final application effects compose and roll back correctly. No admission path bypasses the rule. |
| 2 | Complete index manifest and evolution | List the actual required/declared families once. One independent eight-ref/hot-key Type exercises publish/reuse/withdrawal and equality/reverse lookup. A populated replacement index backfills/catches up without false COMPLETE or broken writers. Price mandatory obligations before requesting an owner reduction. |
| 3 | Honest joint resource envelope | Fix A2/A3; measure native/signed create/edit/rename/tag, coupled body/ref/guard maxima and 1/8/64-principal paid reads. Decompose fresh/rewritten slots, evidence, data and indexes; test one same-guarantee compact/code-backed representation. Keep venue caps unchanged. Publish supported atomic operations, not independent input maxima. |
| 4 | Busy-Realm contract utility | Resolve A4 for the supported contract-query floor. Unrelated writes must not starve the selected design. Implement the typed live-backed File with real provider updates, paid consumer, unavailable provider and explicit immutable snapshot. Compare complete costs against duplicate EFS writes. |
| 5 | Identity, Type and preservation closure | One unrelated developer's self-describing Type, compatible/breaking old reader, EOA and smart/native authority profiles, authenticated source evidence and explicit destination authorization. Reuse existing encrypted/external fixtures for source-off retention without secret/absence overclaims. Demonstrate what can be copied without Alice; do not require lost-key editable takeover unless a prior recovery policy exists. |
| 6 | Integrated practical receipt | One cold Files journey and native app against the final joint profile; same-basis batching/cache with version/failure controls; scoped public-RPC access and current network fee accounting without a private EFS server. Before extraction, separate supported MVP behavior from unfinished production/permanence work in one manifest. |

Packets 1–4 are the immediate core engineering priority. Packet 5 contains
first-class goals, not optional marketing; it must be resolved or explicitly
carried as an MVP limitation by the owner, not silently deferred by an agent.
It does not require implementing every identity suite, every chain or arbitrary
codec language before useful development can start. Packet 6 is a pragmatic
acceptance check, not a frontend hardening campaign. No paid service, API key,
public deployment or production repo is authorized by this audit.

**Ready for real-code extraction** means these interfaces, resource envelopes
and retained-goal limitations are explicit and supported by the decisive traces.
It does not mean all production code or a century of security proofs exists.
Production SDK ergonomics, wallet integration, Unicode policy, packaging,
deployment governance, independent implementation/security audit and permanent
freeze still have their own delivery gates. Do not use those as an excuse to
keep this prototype growing indefinitely.

## What should change in our working method

We tested successful bounded features more thoroughly than their interactions.
In particular: quiet-Realm traversal substituted for concurrent contract
pagination; small Names substituted for the accepted Name domain; finite Note
adapters substituted for generic Type-tooling evidence; and identity-preserving
EOA reconstruction risked sounding like general source proof. The remedy is one
requirements-to-workload matrix, the six packets above and concise checkpoints.

No immediate owner questionnaire is needed to repair known waste or test these
mechanisms. Bring James only measured forks: the exact onchain query floor that
cannot be delivered within an agreed envelope; retention/authority evidence and
its price; or a required index that changes affordability. Do not accept an
expensive result merely because the demo fits a generous local block.
