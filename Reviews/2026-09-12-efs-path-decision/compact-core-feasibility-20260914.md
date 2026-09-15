# Compact EFS: what the core experiments actually establish

September 14–15, 2026 · v2 PM · compact-completion-20260914

**Status:** completed core feasibility pass; independently reviewed at `abf0ab1`.
Prototype evidence and conditional build recommendation, not a permanent protocol freeze.

## The answer in plain English

**The compact design is a credible foundation for an upgradeable MVP. It is not
yet a cheap general-purpose replacement for every application's storage.**
We have working evidence for durable typed data, ordinary Files operations,
ordered Lenses, atomic collaboration by contracts, cold recovery and explicit
Type evolution. The experiments found real limits and defects; several were
fixed without changing the data model. Other limits must remain visible.

My recommendation is one implementation path: **compact Ledger + separate
required index + reusable application profiles + qualified SDK + static SPA**.
Do not resume the three-road tournament or freeze the design for decades now.
Start with reversible testnet code, preserve the decisive experiments, and make
remaining guarantees explicit before a permanent release.

This is the core handoff for [[compact-mvp-build-plan-20260914]]. It does not
silently add another UI, host or general software-hardening gate. James explicitly
deferred those for this prototype. No production repository or public deployment
was created, and the existing owner demo was not reset or upgraded underneath him.

## What works, and what that means

| Capability | Evidence-backed conclusion | Important boundary |
| --- | --- | --- |
| Ordinary filesystem operations | Create/edit, nested directories, rename/move, remove/restore, retained names/history and File/revision tags work against contracts. | Directories are a typed graph. Bounded Lens reads detect cycles; global tree acyclicity is not enforced. Removal is not destruction of immutable history. |
| Lenses | Bob first, then Alice works; a higher-priority mask stops fallback. Conflicts and unknowns remain distinguishable. | A wide filtered listing is substantially more expensive than a known-path or exact-record read. |
| Contract collaboration | An unrelated application reads a selected revision, checks approval, publishes its own child and changes its own HEAD atomically. | Its authorship is the application, not the human who called it. This is not a claim that durable per-swap/per-tick writes are economical. |
| Validation and composition | Exact Types identify descriptors and mandatory validator code; checked references and developer-written predicates reject malformed data before admission. Additional Realm policy has separate activation history. | Code identity alone does not pin mutable dependencies. Historical validation is not eternal current authorization. The lab registry is admin-controlled, not permissionless production onboarding. |
| Type evolution | Three real Note Types exercise mandatory rules, a compatible text projection, and an explicit breaking/lossy adapter; contracts can consume them. | A v1-only app does not automatically recognize an unknown v1.1 Type. The paid Note example is direct-Ledger only; upgrade-aware generic consumers remain work. |
| Upgrades and identity | Populated compatible proxy upgrades and rollback retain stable origin/authorship while changing execution identity; stale signed plans are refused. Real delegation changes are exercised. | This does not establish arbitrary storage migrations, production upgrade governance or key recovery. The lab proxy is not an audited deployment recommendation. |
| Independent access | Cold contract reads recover names and bytes without a private EFS data server or the writer's journal. | RPC observations are not authenticated source-state proofs. A pinned multi-page read still needs an RPC capable of serving its historical basis. |
| Portable evidence | After cold export and source shutdown, another party can retain signed claims on a distinct chain and verify retained bytes/Type/reference material offline. | Archive retention is not guarded Core import, source-state proof, or complete live-namespace migration under original authors. Archive-only reads lack separately retained interpretation material. |
| Carriers and privacy | Exact onchain/external bytes, corruption/unavailability and bounded encrypted-content opening are exercised; missing keys do not imply an empty file. | External permanence, private metadata and key recovery are not solved. Contracts cannot fetch IPFS/HTTP/Arweave bytes without an onchain carrier or transaction-supplied bytes. |

The Note experiment uses small ASCII layouts to test semantics, not to prescribe
the production text format. All three maximum supported bodies were admitted.
Prototype filenames also have a deliberately limited raw-ASCII grammar; the
production Unicode/normalization policy is not selected by these fixtures.
An initially wasteful copy loop exceeded the unchanged validator budget; using
bounded Cancun `MCOPY` brought the standalone rule estimate from 524,085 to
258,944 gas, and actual maximum publications succeeded. Those numbers include
standalone-call intrinsic gas and are not publication receipts. This is a clear
example of an implementation limitation rather than an expressive-type failure.

## What it costs

These are **whole local transaction receipts**, not test-function gas and not
all-in dollar fees on Base or another public network. The compared Files recipe
is the same guarded-direct 41-byte document in the packet committed at `2975ba7`; deployment,
additional carriers and other profiles must be priced separately.
Its raw cost report names starting HEAD `4dec0c9`; the packet retains the measured
source/runtime pins. The packet commit is not a claim that every embedded run's
HEAD field equals it, nor a new benchmark of the later final branch.

| Operation | Receipt gas | Calldata bytes |
| --- | ---: | ---: |
| Named File create | 2,259,447 | 2,852 |
| Edit | 1,191,659 | 1,796 |
| Tag the stable File | 812,657 | 1,156 |
| Tag the selected revision | 998,511 | 1,316 |
| Rename to a fresh name | 1,324,819 | 2,148 |
| Native application read/check/write | 1,201,820 | 228 |

The new raw Note examples are smaller operations, **not cheaper equivalents of
creating a complete named File**. They cost 530,416–817,998 gas for tiny bodies,
and 1,447,309–1,523,694 for the maximum roughly-1KiB bodies. The first publication
initializes shared state, so these are not matched comparisons between versions.
Paid tiny Note reads cost 122,495–123,396 gas; the maximum v1 read costs 414,604.
These Note receipts are pinned to `035f9b9`; later JS qualification fixes do not
become new gas measurements.

**This is feasible for occasional durable shared data; the bill is still
substantial.** Affordability depends on the actual chain and workload. No result
here proves an irreducible overhead floor, nor that future EVM improvements will
make a high-frequency write-heavy application affordable. No requirement is
silently waived to produce these numbers.

## The performance cliffs we found

1. **Lifetime-name churn is no longer the normal listing cost.** The required
   live-placement inventory handled 10,000 lifetime names with one remaining
   live placement by scanning that one live entry. History remains retained;
   the ordinary listing need not replay it.
2. **Wide Lenses still multiply work.** A corrected 32-entry/tag-filter recipe
   at `9248feb` costs 4.66M / 11.34M / 8.81M / 8.60M gas for a paid first segment
   across 1 / 8 / 32 / 64 authors, using candidate budgets 32 / 32 / 8 / 4.
   Those rows do different amounts of work and are not a speedup comparison.
   Large pages actually failed; an `eth_call` succeeding does not prove the
   same operation fits a paid transaction. No gas ceiling was raised.
3. **Browser reads fit bounded pages, not arbitrary global scans.** The earlier
   1,000-live-entry campaign at `2975ba7` required 65 / 72 / 282 / 564 cold HTTP
   requests for full filtered traversal across those Lens widths, excluding
   the separate pin. Local full traversals took about 0.4–1.4 seconds, which is
   not a public-RPC latency or quota forecast. Global tag/author search still
   requires an explicit indexed domain and coverage, not “all of Ethereum.”
4. **The current SDK over-reads during writes.** The matched named operations
   use roughly 250–280 logical RPC/HTTP requests across preparation/submission/
   reconciliation. Repeated profile verification and serial transport explain
   much of that. Same-basis batching and safe immutable-metadata caching are
   promising implementation work, not measured savings. Do not cache away
   execution-version, authority or canonical-block checks.
5. **The maximum archive payload does not fit one transaction.** 64 actions,
   the maximum read set and 8,192 body bytes exhaust the 16,777,216-gas cap.
   Staging the same evidence succeeds: 12,342,925 + 9,078,577 = **21,421,502 gas**,
   plus one-time deployment and separate retention of the Type/rule/reference
   bundle. Trying the failed one-shot first adds another 16,777,216 gas.
   Ordinary smaller claims are separately measured; this is not their price.
6. **Core has little code-size headroom.** Ledger runtime is 24,173 bytes,
   leaving 403 bytes under the tested 24,576-byte limit. Readers, profiles and
   the archive already live outside it. Production decomposition must preserve
   storage/authorization/execution boundaries; a diamond or proxy is not by
   itself evidence of safe upgrades.

Classification: ordinary bounded workflows **work**; SDK transport, storage
representation and maximum archive retry logic **need optimization**; giant
in-transaction multi-author scans and one-shot maximum archive retention are
**impractical in the measured regime**. Production fees, full migration and the
other capabilities below remain **unproven**, not secretly impossible.

## What remains core work

These are not all reasons to delay creating testnet repositories. They are
named requirements that must not disappear behind an “MVP ready” label.

- **Live destination migration with original attribution.** Design and exercise
  guarded Core import separately from the archive. Preserve original claims,
  run destination acceptance rules, reject unauthorized HEAD changes, handle
  conflicts/replay, and define reconstruction of names/history. A new Bob-authored
  publication after import is not this capability. This is the most important
  remaining portability experiment before claiming a complete portable filesystem.
- **High-frequency contract-backed files.** Exercise one path pointing to an
  application's existing state, as proposed in [[../2026-09-12-efs21-live-contract-files]].
  Measure a third-party read and explicit snapshot. Distinguish a live result
  from immutable history; this avoids duplicate writes only if that tradeoff is
  acceptable. No such integrated live-provider result is claimed by this pass.
- **Real-network economics and access.** Price the complete chosen L2 transaction
  including data/operator charges; measure public RPC cold-start, batching,
  quotas and historical-basis availability. Keep a keyless guest path. This is
  needed before calling the experience practical for users, not another local
  synthetic timing campaign.
- **Production authority and portability guarantees.** Specify registration and
  upgrade administration, smart-account/key recovery, and the boundary between
  observed native contract attribution and authenticated source-state proofs.
  Do not call the current admin registry or EOA signature archive the final
  permissionless/hyperstructure answer.
- **Application acceptance dependency semantics.** Stateless rules are clear;
  mutable game-state predicates need an explicit historical basis and current
  action checks. The Note control does not prove arbitrary future rule programs
  fit its budget. Unknown future Types need deliberate support/projection policy.

## The smallest real-code build

Use the existing [[compact-mvp-build-plan-20260914#2. Establish the real code layout after owner approval|repo map]],
after repository/deployment approval. Do not copy the entire experiment tree.

1. **Contracts:** extract TypeRegistry, Ledger and the separate required index;
   preserve atomic rollback, stable origins and versioned execution commitments.
   Put bounded readers and reusable Files/Directory/Name/carrier validators in
   periphery. They are shared deployments, not a new contract per File. Keep the
   claim archive optional and distinct from current-state ownership. Plan module
   boundaries before adding more Ledger code.
2. **SDK:** expose qualified `read` and `prepare → authorize → submit → reconcile`.
   Carry values with their basis/provenance/coverage, preserve source bytes under
   projections, and reduce transport amplification without weakening checks.
   Keep onchain consumer helpers explicit about the calling contract's authority.
3. **SPA + Files vertical:** build guest browse/open, create/edit, rename/move,
   remove/restore, ordered Lens and tags on that one SDK. Add the real wallet and
   durable operation journal here, not as more disposable prototype polish.
4. **Public testnet acceptance:** one fresh contract consumer plus original-author
   migration, end-to-end costs and a short owner walkthrough. A tiny Arcade policy
   exercise can then pressure the public API; it should add no Arcade-specific
   Core nouns. Continue upgradeable iteration; permanence is a later explicit gate.

## Engineering choices made during this pass

These are reversible experiment rulings, not owner-ratified permanent limits.
They are recorded here so costs and sacrifices do not disappear with agent context.

1. Full bounded read-set preimages retained in state — more storage gas; a
   code-backed representation can be compared without dropping reconstruction.
2. Legacy v1 signed/import ingress refused on the new proxy — narrower ingress;
   old direct deployments remain separate and truthful.
3. Signed target-compatible gas limit capped at 16,777,216 — possibly overstrict
   for another explicit execution profile; not a universal future Core limit.
4. Lens-relative Directory graph/cycle handling, not global tree enforcement —
   global acyclicity would require additional traversal/membership policy.
5. No ordinary plaintext edit after decrypting — less editor convenience until
   explicit re-encryption/declassification exists.
6. No public plaintext fingerprint in the encrypted profile — loses public
   plaintext-hash dedup/search; metadata privacy is still not supplied.
7. Setup batches reduced to live4/churn12 — more setup transactions/time.
8. Smaller run-owned benchmark history — less old RPC history in disposable
   runs, not deletion of retained Ledger evidence or the owner's demo.
9. Segment exhaustion separated from full-query completeness — explicit
   consumer/traversal bookkeeping.
10. Wide-Lens candidate budgets reduced after real failures — more pages/HTTP.
11. Explicit pageRows/traversal API instead of a generic COMPLETE terminal
    suffix — API changes; an empty last page cannot mean an empty whole query.
12. Definite match required for PRESENT — uncertain candidates stay visible but
    UNKNOWN, requiring a conservative query accumulator.
13. Type/rule/reference closure retained in an export bundle, not a second archive
    registry — another artifact must survive; archive-only interpretation is PARTIAL.

## Evidence and reproduction

Source workspace: `planning-warroom-b-run`, branch `codex/efs-warroom-b-run`.
The code/evidence remain in that authorized prototype worktree; this report lives
on planning/main. No whole prototype migration is implied. Canonical files below
are relative to its `Reviews/2026-09-12-efs-path-decision/lab-b/` directory:

- Stable identity/guards: `f2a086f`; guarded SDK/delegation: `dfea63f`.
- Directory lifecycle: `0fcb9dd`; carrier/Concept/privacy fix: `4dec0c9`.
- Joined pages: `9248feb`; larger source-pinned campaign and matched costs:
  `2975ba7`, `joined-reads-20260914/`.
- Cold archive and actual staging receipts: `e397df9`; required zero-reference
  completeness correction: `3ffa279`, `guarded-archive-20260914/`.
- Actual Note Types/rules/paid receipts: `035f9b9`, `note-types-20260914/`;
  reviewed availability-qualification fix: `abf0ab1`. Missing history/reorg
  remains UNKNOWN, corrupt bytes INVALID.

Independent focused reruns cover the new work: 23 archive Solidity checks and
four cold/offline cases, then four JS-fix cases; 42 Note/shared-SDK cases including
real publications and paid reads. Earlier accepted task evidence is source-pinned
in the build plan; it is not relabelled as a new all-features suite run. Raw signed
transactions, source hashes and size checks back the gas statements. Reuse those
decisive controls in the real repositories; do not preserve every prototype test,
UI fixture, benchmark setup helper or duplicate implementation as product code.

The independent final review of `67f92c5..abf0ab1` inspected the actual joins
between execution identity/guards, native application writes, live inventory and
Lens coverage, Type acceptance/projection, and source-gone archive retention.
It found no new Critical/Important defect in that scope and approved this
conditional handoff. This was a focused source review, not a security audit or
another exhaustive test run. Its one cost-provenance clarification is incorporated
above. Original-author live migration remains the highest-value unfinished core
experiment. The full local review/ledger remain retained in the prototype's
`.superpowers/sdd/compact-mvp-build-plan-20260914/`; no evidence cleanup was performed.

Final code checkpoint `abf0ab1ed151a2f23ca039572eb4fa54a692f7df` is **locally
committed**, not represented here as pushed or merged. Canonical planning prose
is published separately on main. The owner browser remains its earlier retained
deployment; it was not silently replaced with the latest experimental contract
set. All new verification chains were closed.
