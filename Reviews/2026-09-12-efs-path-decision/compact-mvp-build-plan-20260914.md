# From the compact prototype to real EFS code

September 14, 2026 · v2 PM recommendation · no repository/deployment authority implied.

**One path: compact Ledger + separate required index + explicit Files profiles
+ qualified SDK + static SPA.** The [[compact-prototype-results-20260914|working
prototype and measurements]] now support that choice. Keep the fuller prototype
and MUD comparison as reference evidence; stop maintaining parallel product roads.

We do not need another hundred design pages before implementation. The two
foundation changes below are now tested in the prototype; the remaining work is
a sequenced vertical build. “Ready to code” is not “freeze for 100 years.”

**Completion checkpoint, September 15, 01:15 UTC:** code worktree
`codex/efs-warroom-b-run` at `4dec0c9` has independently reviewed stable
identity/execution context, bounded transaction-time read assertions and the
shared guarded Files SDK. 262 Solidity executions and 97 Node executions pass,
including real mined-order controls, populated compatible proxy activation and
rollback, same-block historical recovery, and actual Prague delegation
install/change/clear. Recursive storage-layout comparison preserves the original
13 roots. Review also caught and fixed two recovery defects: available receipts
were hidden by failed EFS reads, and malformed local envelopes could be persisted
as UNKNOWN. Ordinary typed Directory/navigation is now implemented and reviewed:
274 Solidity and 113 combined Node executions passed, followed by 67 covering
tests for the JS-only route fixes. A real browser created a nested file, renamed
and moved its parent, then cold-recovered the unchanged child. Browser testing
also caught and fixed stale same-document routing; direct paths, Back/Forward
and malformed-route refusal now work, including superseded-read/signing guards.
Binary/carrier profiles and retained Concept labels are now implemented and
reviewed: 300 Solidity and 144 Node executions pass, with an independent rerun of
300 Solidity and 62 covering Node tests. Real browser uploads/open of a PNG work
both onchain and through the explicitly selected external byte fixture; the
existing binary/empty/maximum-inline controls preserve exact bytes. Missing,
malformed and wrong keys remain distinct from absent data. Review caught and
fixed a silent plaintext-edit downgrade after decryption; the safe prototype
editor is read-only for encrypted files. A fresh exact content profile also
removes publicly guessable plaintext hashes, retaining ciphertext integrity and
AES-GCM authentication. Names, sizes and media metadata remain public. These are
reversible prototype engineering choices, not private metadata or key-recovery
guarantees. Ledger ABI and code are unchanged by the carrier work.
Joined-scale reads are active; guarded signed-claim export, durable
cooperating-tab host and the exact-Type Note example remain.
The existing owner browser and chain are preserved. UI labels Alice → Bob / Bob →
Alice and uses a Base-first drawer with Ethereum L1/Base execution models and an
explicitly unmeasured ZKsync column. No production repository or public testnet
was created; software-signed local transactions do not establish real-wallet
approval counts, total public-network fees or native cross-chain source proofs.

## 1. Close two foundation gates in the existing prototype

### A. Stable identity, honest execution versions

**Prototype status:** implemented and independently reviewed at `f2a086f`, with
the guarded SDK and actual upgrade/delegation controls accepted at `dfea63f`.
The following problem describes the earlier baseline, not an open defect in
that tested control. Production packaging and stronger native source proofs
remain separate work.

**Baseline problem:** native contract identity depended on `chainId + Ledger
codehash`; a new implementation can change whose binding history a reader sees.
Conversely, putting this Ledger behind a proxy and continuing to hash only the
proxy runtime would fail to identify implementation changes. A constructor-time
caller has no runtime code yet. The narrow EIP-7702 marker fix solves none of
those general cases.

**Engineering proposal to validate, not frozen bytes:** give a Realm instance
a stable origin identity; store explicit principal kind/identity with authored
evidence; keep a separately versioned execution-set commitment for signing and
reader expectations. Do not infer historical identity from today's account code.
Reject ambiguous constructor-time native ingress initially unless a specific
safe classification is demonstrated. Recovery/delegation must change authority
under an explicit profile, not silently rewrite old authorship.

**Done when:** populate signed/native Files, tags, masks and history; upgrade
the test deployment; keep identities and old reads; refuse stale signed plans;
exercise delegation install/change/clear and constructor calls; make a clean
reader distinguish old and new execution context. Run at least one real
Prague-compatible 7702 authorization fixture. Select the testnet upgrade
mechanism against these invariants; a diamond/UUPS proxy is not the invariant.

Also test mutable acceptor dependencies: exact Type code identity, immutable
parameters, activation policy and admission basis must not be conflated.
Admission validity may depend on current game state, but old evidence must say
what was checked then. Do not market codehash as a proof of the whole dependency graph.

### B. Transaction-time dependencies, not only browser preflight

**Prototype status:** implemented and independently reviewed through `dfea63f`.
The controls mine both transaction orders and check zero partial effects. These
assertions freeze declared positions, not unknown future names or whole-graph
membership; Directory traversal therefore reports Lens-relative cycles rather
than promising a globally acyclic tree.

**Baseline problem:** a user can sign an edit/move while looking at Bob's revision or
placement. Bob can change it after preflight but before inclusion. Own authored
HEAD CAS does not necessarily guard the selected source.

**Engineering proposal to validate:** include bounded read/precondition
assertions in the authorized atomic operation. Pin exact expected authored
heads/selection domain, destination placement expectation, policy and required
execution obligations. Check them during execution before effects. Keep native
helper contracts authored by the calling application, not a shared proxy identity.

**Done when:** queue two competing transactions, mine them in either order,
prove intended success or explicit stale-plan refusal with no partial effects;
test destination-name races, mask changes and profile activation. Recovery
reconciles the original signed operation and never silently re-signs it.
Measure additional gas. The current app's same-transaction read/check/write is
useful precedent, not proof that the EOA flow already has these assertions.

These are bounded engineering work, not questions James must answer unaided.
If either experiment forces a real requirement sacrifice, return one concise
decision with an example and measured tradeoff. Otherwise keep moving to the
next approved implementation slice.

## 2. Establish the real code layout after owner approval

Keep **planning/main** as the design/coordination vault; existing code experiments
stay in their current location until their work is finished. Production repo
names should be confirmed rather than created speculatively. Do not overwrite
the deployed v1 contracts or old SDK/client repositories.

| Boundary | Initial contents / responsibilities |
| --- | --- |
| Contracts repository | `src/core/` Ledger/TypeRegistry/identity and execution context; `src/index/` mandatory inventories, coverage and optional extension hooks; `src/readers/` bounded Lens/Files readers; `src/profiles/` Files, Directory, Name and carrier descriptors; `test/{unit,integration,invariant,gas}/`; deployment/upgrade scripts and machine-readable manifests. |
| SDK repository/package | TypeScript transport/read context; discriminated qualified results; Files/Directory operations; prepare/authorize/submit/reconcile; durable journal and wallet adapters; exact Type/profile codecs; imported evidence verification. Separate Solidity-facing helpers/read interfaces preserve caller identity. |
| Web Client / OS SPA | Static build with config and optional RPC selection; browser-only cache; permissions/wallet/connectivity; shared pending-operation lifecycle. No required EFS-hosted data API. |
| Data Explorer / Files app | Navigation, listing/filtering, inspector/history, tags and carrier/opaque presentation over the SDK. Modular views/extensions later; no private reimplementation of Lens or validity semantics. |
| Arcade first slice | One tiny app reads typed items, checks a policy such as compatible outfit equipment, and publishes/rejects a state transition. Use it to attack the same public API, not invent Arcade-specific Core nouns. |

Use the existing PM responsibilities and small handoff documents. A dedicated
production Contracts/Dev task is useful once real repositories exist; no new
permanent agent orchestration system is needed for this prototype.

## 3. Build one vertical, in this order

1. **Port the tested kernel/index contracts and the two gate fixes.** Preserve
   exact rejection, rollback, masking and evidence tests; add populated testnet
   upgrades and storage-layout checks from the start. Mandatory index failure
   rejects the write. Optional index failure reports its coverage honestly.
2. **Finish ordinary Directory/Name/Carrier profiles.** Create a folder, nest it,
   rename/move it, reuse an old path, detect cycles/invalid parents and preserve
   stable File identity. Pin name/normalization policy. Keep body identity separate
   from current locations. Small onchain bytes are one carrier, not the universal
   payload store. Add an external content-addressed carrier, unavailable/corrupt
   bytes, and an encrypted/opaque case with no false empty result. Tag labels and
   concept identity need retained public meaning, not only this demo's hashed text.
3. **Deliver bounded joined read pages.** Return names, selected revision/header,
   provenance and requested tag assessments at one basis. The live candidate
   inventory already exists; optimize expensive joins/transport before inventing
   another storage model. Benchmark 1,000 live files, 10,000 lifetime names and
   1/8/32/64 authors, including a selected-revision tag filter. Define operation
   budgets from measurements; budget exhaustion returns PARTIAL/continuation.
   Global tag/author discovery needs an explicit domain and index coverage.
4. **Turn the adapter into the elegant SDK.** `read → qualified result` and
   `prepare → authorize → submit → reconcile`; hosts should not juggle internal
   Record/Admission/Binding rows. Keep value, provenance and completeness in one
   result object; type-narrow before access. Test cross-tab journal concurrency,
   response loss, reorgs, pruning, nonce/CAS/policy drift and transaction replacement.
   Add a Note v1/v1.1 compatible reader example and an intentionally breaking v2
   with an explicit adapter; do not infer safety from version numbers.
5. **Complete the SPA Files journey with a real wallet.** Guest cold-open, create
   directory/file, edit, rename, move, remove/restore, Lens switch, tags/filter,
   content/history and portability export/import. Instrument actual approvals;
   support one visible authorization where the selected wallet/relayer path can
   honestly provide it. Failure/unknown outcomes must remain visible and recoverable.
6. **Price and demonstrate a public testnet slice.** Whole transactions, calldata,
   L1-data/operator charges, latency and RPC work, not local execution models alone.
   Check the target's per-transaction cap separately from its block budget:
   [EIP-7825](https://eips.ethereum.org/EIPS/eip-7825) and
   [current Base limits](https://docs.base.org/specifications/transactions/throughput-and-limits)
   specify 16,777,216 gas per ordinary transaction. The prototype's 30M local
   block ceiling alone is not a target-network compatibility check.
   Add the small Arcade or contract-backed live-value use case after Files works.
   Show source-preserving signed import into a second fresh deployment, separately
   from native source proofs and destination permission. Ship a clean static artifact
   without demo keys. No mainnet permanence until the explicit freeze review.

This sequence can overlap SDK/Explorer work with contract gate tests because
the qualified API boundaries are already clear. It should not spawn another
broad parallel architecture exercise. Compiler/Anvil work remains serialized
and disk-bounded; scoped Astra High/Extra High workers handle implementation,
with Max reserved for architecture/integration judgments.

## 4. What is a product decision, and what is not?

**No new decision blocks the two disposable engineering gates.** The preferred
boundary is durable interoperable shared data, plus separately qualified live
contract views for high-frequency state. That does not waive historical records.

James must eventually approve repository creation, the first public testnet and
its admin/upgrade posture, the launch feature scope and permanent guarantees.
One consequential portability choice is whether an initial public testnet can
clearly expose native contract provenance as RPC-observed while stronger
cross-chain native proof support remains a separately tracked requirement.
Do not treat that as permission to call native data fully proof-portable.

Before asking for a sacrifice, measure the direct alternative. Keep private
data, arbitrary application types, contract utility and independent access on
the requirements list even when a first demo has an honest narrower scope.

**Exit criterion:** one integrated Files/SDK/contracts build with stated limits,
adversarial controls and real transaction prices; no unresolved identity or
atomic-write ambiguity hidden under an MVP-ready label. That is a concrete
starting foundation, not a promise that future applications cannot find new bugs.
