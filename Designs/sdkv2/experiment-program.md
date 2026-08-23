# EFS v2 SDK adversarial experiment program

**Status:** draft — executable evaluation design; this document does not authorize production implementation or deployment
**Target repos:** planning, sdk, contracts, client
**Depends on:** [[README]], [[architecture-candidate]], [[developer-journeys]], [[ethereum-standards-census]], [[../efsv2/layered-type-system-and-data-abi]], [[../web-client-os/mvp-and-acceptance]]
**Reviewers:** @offchain-precedents (2026-08-22), @onchain-precedents (2026-08-22), @local-authority (2026-08-22)
**Last touched:** 2026-08-22

#status/draft #kind/design #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2 #topic/onchain #topic/read-path

## Purpose

This program tries to kill unsafe SDK assumptions before they become public
APIs, canonical bytes, package identities, or deployed dependencies. Every run
uses an explicitly disposable protocol/profile label and exact retained input
closure. Passing an experiment is evidence for review, not owner adoption,
conformance, or permission to publish permanent data.

The numerical thresholds below are **proposed conservative experiment
tripwires**, not EFS protocol limits. They are fixed in each run packet before
measurement so a disappointing result cannot move the goalposts.

## Shared fixture closure

Every arm uses the same minimal but hostile fixture set:

1. one small nominal Type with scalar, optional, repeated, byte, Unicode,
   literal, and typed-reference fields;
2. one additive revision, one representationally different revision, one
   semantically incompatible revision, and an unknown future extension;
3. valid boundary values plus malformed lengths/offsets, duplicate or
   non-canonical encodings, depth/element/byte limit edges, cyclic references,
   missing descriptor bytes, and tampered payloads;
4. Records, authored Occurrences, a Realm admission history, current and
   withdrawn Bindings, conflict, Lens/ResolutionPlan inputs, and declared
   QueryProfile pages;
5. exact Core/direct-source answers and deliberately stale, incomplete,
   reordered, duplicated, and dishonest indexer/cache answers;
6. human and agent action plans with distinct author, signer/controller,
   submitter, payer, beneficiary, and admitter roles; and
7. honest and lying EIP-1193/6963 providers, EIP-1898/234 pinned reads,
   pruned history, fork/config disagreement, EOA/ERC-1271/ERC-6492/ERC-4337/
   EIP-7702/ERC-7913/P-256 paths with signature verification kept separate from
   account/delegation/submission authorization, and modern typed transaction/
   wallet-call receipts; and
8. three Solidity workloads: exact point read/verify, bounded reference query,
   and write/admission precondition verification, plus contract Lens consumers
   over 1/8/32/64 full-width Principals and conservative/Cancun/Prague/Osaka
   execution profiles.

The closure includes source descriptors, profile assumptions, raw fixtures,
expected result axes, generators, compiler/toolchain identities, build inputs,
outputs, hashes, licenses/provenance, and a command-independent explanation of
how to reproduce the run.

## Evaluation matrix

| ID | Question and arms | Required evidence | Pass gate | Stop / redesign condition |
|---|---|---|---|---|
| **S0 — experimental isolation** | Can all three architecture arms run without manufacturing permanent-looking EFS v2 identities? | Artifact headers/manifests, fixture UI, log and package inspection | Every ID, ABI, package, address and result is stamped with the exact disposable profile/commit and an explicit non-production warning | Any artifact can be copied or published as apparently canonical without its experimental profile; stop the run and fix isolation first |
| **S1 — independent canonical codec** | Do two implementations with no shared codec code produce the same bytes/IDs and reject the same invalid corpus? | TS implementation A, independent implementation B in another language/runtime, Solidity vectors, differential/property tests | 100% byte/ID match on accepted vectors; 100% same accept/reject class on normative malformed vectors; no identity derived from partial reserialization | One unexplained byte/ID/acceptance discrepancy blocks profile and generator work; do not paper over it with an adapter |
| **S2 — Type evolution and compiler DX** | Compare bundled exact B0, layered candidate, runtime arm A, generated arm B, and hybrid arm C for define/evolve/generate workflows | Timed task scripts, manual-field/hash/network-call count, compatibility reports, output manifests | Zero manual hash/ID calculation; zero mutable network reads; deterministic outputs; no more View/query commands than B0 and fewer manual derived fields; every compatibility claim is directional and multi-axis | Layered/hybrid path requires an open ontology walk, hidden registry fetch, more manual commands than B0, or one green compatibility badge that hides a failing axis |
| **S3 — raw and unknown survival** | Can old/offline/browser/server runtimes receive, inspect, store, clone, export, relay, and later decode future evidence? | Nested unknowns through decode, DTO mapping, worker transfer, structured clone, Cache/IndexedDB, JSON escape, server queues and archive export | Exact original bytes and context hash survive every declared lossless path; lossy paths refuse evidence-preserving claims; unknown remains distinct from invalid/empty | Any default path discards or reserializes unknown bytes while retaining an apparently valid identity/result |
| **S4 — qualified result algebra** | Can direct source, cache, indexer, byte source and Lens contradictions be reconciled without state collapse? | Mutation matrix across present/partial/unknown/absent/masked/conflict/invalid/unsupported, byte outcomes, pages, explicit block-hash basis and coverage; same-basis cursor chains with reorder/duplicate/omit/fork mutations | 100% expected class/axis match; only complete exact negative basis creates `ABSENT`; only that absence or a retained selected-whiteout/policy `MASKED` result enters a protocol negative cache without changing status; one cursor chain never crosses basis and detects every duplicate/omission; ordering and source removal do not change truth | Timeout, revert, omission, unsupported version, missing helper, unavailable/tampered bytes, incomplete/cross-basis page, duplicate/omitted row, or local presentation mask becomes empty/false/absent/complete or a protocol negative-cache entry |
| **S5 — offline reconstruction and exit** | Can a clean-room implementation rebuild exact selected state after publisher and infrastructure loss, both from an exported closure and independently from declared Realm state plus retained byte carriers? | Retained closure; direct bounded collection of state-readable Types, Records, Occurrences, admissions, declared indexes and current folds; network disabled after collection; original package registry/indexer/gateway/cache/generator site removed; differential rebuild | Zero mutable network requests during replay; closure and direct-state arms yield the same exact object commitments and selected state; missing bytes/history remain explicitly unavailable/partial; no event-only or hidden inventory dependency | Any historic decode, Type resolution, basis proof, inventory or state selection requires a mutable alias, original service, package registry, current SDK package, hidden cache/indexer, event-only recovery, or preassembled closure not derivable from declared Realm state |
| **S6 — action, account, and authority parity** | Do human UI, headless agent, EOA, ERC-1271, ERC-6492, ERC-4337, EIP-7702, ERC-7913/P-256 and contract paths inspect, clear-sign and bind their distinct verification/authorization/submission commitments to the same exact EFS plan/effects? | EIP-712 plan/digest and experimental ERC-7730 descriptor snapshots; EOA/1271/6492/7913/P-256 signature-verification receipts; separately recomputed transaction/calls, ERC-4337 `userOpHash`, EIP-7702 chain/address/nonce tuple and wallet/bundler receipts; P-256 high-`s`/low-`s` mutations; signer role permutations; code/delegate/factory/EntryPoint drift; persistent and non-persistent counterfactual modes; relayer/payer swaps; mutation/replay/admission/read-back attacks; distinct bytes32 Principals sharing the same low 160 bits | Human/agent renderers retain the same EFS plan/effect commitment; each strategy-specific digest/tuple is independently recomputed and explicitly bound to it rather than claimed equal; descriptor mutation cannot change signed calldata; SDK-produced P-256 action signatures satisfy the declared low-`s` policy and compatibility high-`s` evidence is marked noncanonical; verification APIs never persist counterfactual state; every receipt retains exact strategy/basis/code/factory evidence; any post-review/profile/account/delegate change invalidates authority; full-width Principals remain distinct; authored, signature-verified, account-authorized, wallet/bundler accepted, submitted, admitted and read-back outcomes remain separate | Ambient signer selection, digest/receipt conflation, plan/clear-signing substitution after review, raw signature bytes used as action/replay identity, permanent classification from code presence, persistent counterfactual preparation in verify APIs, counterfactual simulation treated as authority, app-requested raw 7702 authorization, signer/author/admitter collapse, low-160 Principal collision, relayer substitution changing identity, or transaction/bundle success presented as canonical product success |
| **S7 — browser/server/agent cost** | Does the hybrid runtime preserve the direct guest and replaceable-environment boundary? | Browser guest route, worker, Node/server and headless agent builds; bundle graph and performance trace | The **combined guest route** stays within current Web Client provisional budget: at most 250 KiB compressed unless a 250–400 KiB exception is justified; parse/execute at most 150 ms on the named profile; no long task over 50 ms; unrequested wallet/write/OS/agent bytes and runtime generation requests are exactly zero | SDK architecture alone makes the useful guest route exceed/fail those gates or touches wallet/profile/Commons/indexer/OS before useful pinned data |
| **S8 — generated Solidity safety** | Can exact generated leaf libraries and the bounded generic probe handle all valid/hostile inputs with headroom across the required contract Lens sizes and execution profiles? | Pinned solc standard JSON, exact compiler/optimizer/EVM/metadata settings, every optimized deployable consumer/probe target's size, contract Lens fixtures over 1/8/32/64 full-width Principals, conservative/Cancun/Prague/Osaka variants, cold/warm gas, no-code `STATICCALL` success, bounded success/revert returndata, fuzz/property corpus and call graph | Every deployable consumer/probe target—not a library artifact—stays under 18,432 runtime bytes and 36,864 initcode bytes; every loop/allocation/call/returndata copy has an exact prechecked bound; valid probes finish within 300,000 gas; no-code/empty return cannot produce a semantic positive; declared bound excess or max+1 returndata returns a typed bounded result; malformed EFS evidence returns `INVALID`; malformed outer ABI may revert at the decoder but never produces a semantic positive/absence; 100,000 seeded malformed cases per Type and every 1/8/32/64 Lens produce no unbounded OOG/panic or Principal truncation | Threshold reached, missing bound, semantic result from structural probe, no-code call, dynamic registry/callback/delegatecall, unbounded returndata/revert copy, full-width Principal truncation, unexplained bytecode delta, absent-opcode/precompile acceptance, one cross-language mismatch, malformed acceptance, state collapse after decoder revert, or adversarial work outside declared budget |
| **S9 — helper and deployment bakeoff** | Does a direct stateless helper materially beat generated inline code without adding authority, deployment ambiguity or availability dependence? | Same three workloads, consumer deployment plus 1/10/100/1,000 reads, cold/warm/nested traces, full deployment manifest, independently recomputed CREATE2 address, factory/code/profile/dependency verification, local fallback, helper/dependency absence/mismatch/proxy attacks | Declare one objective before the run: **gas lane:** P95 end-to-end gas is both at least 20% and 25,000 gas lower and lifecycle gas breaks even by 100 reads; or **size lane:** consumer runtime is at least 15% smaller in all three workloads, P95 gas regresses no more than 10%, and lifecycle gas breaks even by 1,000 reads. Also: caller caps forwarded gas at 200,000, traced helper gas stays within that cap, a predeclared post-call reserve remains, traces show at most two external target accounts/calls, exact compiler/initcode/runtime/factory/dependency/basis/reproducibility/fallback checks pass | Neither lane clears; helper is required for correctness/absence/authorization; conventional address or registry substitutes for exact factory/runtime proof; an undeclared or identity/basis-unqualified mutable/proxy dependency appears; helper-owned mutable truth/currentness or mutable selection registry appears; code/dependency/basis mismatch or absence is hidden; no identical generated fallback; actual cold/warm/nested trace or caller reserve fails |
| **S10 — capability/downgrade attacks** | Can negotiation reject a lying ERC-165 contract, EIP-6963 provider, EIP-7910 config, wallet capability or ERC-4337 bundler, unknown transaction type/required bit, fork/opcode/precompile/history mismatch, ERC-7562 validation-scope/stake/reputation mismatch, directional/unit limit mismatch, helper/dependency substitution, proxy/delegate change, forged revert/result, wrong media type and nearest-version downgrade? | Cross-language accepted-versus-observed profile fixtures and adversarial providers/contracts/transports/bundlers with raw ERC-7562/7769 error cases | Every case becomes the exact applicable `INVALID`, `UNSUPPORTED`, `UNKNOWN`, provider/history/basis/infrastructure failure or conflict before semantic/state-changing use; bundler stake/reputation/acceptance remains infrastructure evidence; raw unknown envelopes survive; `UNKNOWN` is reserved for genuinely unobservable state; fallback requires a newly selected tuple and, for writes, a new plan/authorization | Provider/config/capability/bundler reputation or acceptance string/interface ID/semver/media type/registry/address answer silently upgrades acceptance or changes codec/authority/completeness; unknown bytes are discarded; forged or commitment-mismatched input is accepted; known unsupported behavior is mislabeled unknown |
| **S11 — optional EAS carrier** | Can v2-shaped evidence round-trip through EAS without inheriting EAS identity/policy or indexer assumptions? | Exact chain/EAS address, accepted schema text/UID/resolver/revocable tuple, attestation bytes, direct reads, generated decode, and mutable/proxy resolver-policy attacks | Direct EAS read and generated payload decode agree; the supplied valid UID/tuple exactly matches the accepted tuple; EFS raw evidence is preserved; resolver/admission and EAS identity remain qualified carrier evidence | A different valid schema UID/tuple is accepted; resolver policy/code changes are hidden; proxy/mutable resolver, indexer completeness dependency, `SchemaEncoder` bytes treated as EFS canonical, or implied v1 migration promise |
| **S12 — replacement drill** | Can a new implementer replace provider/EVM library, wallet/account adapter, runtime, compiler, indexer, cache and release tooling and regenerate identical evidence-facing behavior? | Clean-room instructions, archived source/spec/vector/tool closure, and at least two substituted components including one Ethereum transport/account or compiler/deployment component | Exact canonical vectors/results/receipts/manifests remain; differences are confined to documented transport/performance details; no package name, class identity, provider brand, registry or conventional factory address leaks into durable data | Replacement changes identity, status, authority, basis, completeness, raw bytes, plan digest, signature receipt or deployment manifest, or requires the original team/service/provider/registry |
| **S13 — CapabilityRPC parity and confinement** | Can one semantic lifecycle source generate MessagePort/structured-clone, WIT, and agent bindings for confined apps without forcing either direct first-party guest product through the Kernel? | Separate negotiation/grant/effect authorization; endpoint/audience or delegated handles; identical operation/result/fault/receipt vectors; exact canonical plan binding across clone/WIT/JSON; directional budgets/deadlines; admission/start/commit authorization points; open/epoch/invoke/progress/cancel/revoke/close races; durable outcome recovery; byte-range streaming/backpressure/restart/resume; forbidden-capability probes | All bindings reproduce the same exact effect-plan/result/receipt commitments and explicit feature/limit differences; every invocation/effect checks grant version and epoch; stale handles and race outcomes are unambiguous or `EFFECT_UNKNOWN`; channel loss supports scoped recovery; apps use no raw signer/secret/effective grant/Kernel/provider SPI; direct Web Client/OS and Data Explorer guest boots both omit CapabilityRPC | Compatibility handshake becomes authority; copyable string is a bearer grant; transport representation changes authorized bytes; unbounded buffer/copy; cancel implies rollback; stale session succeeds; committed effect becomes false success/absence after lost receipt; confined app needs private SPI; ordinary UI imports Type/Data-ABI internals; either direct guest product waits on the Kernel |
| **S14 — cross-product semantic-adapter parity** | Can one common lossless adapter serve the Web Client/OS direct Files/shell and the independent general typed-data Data Explorer without merging their product models or semantic drift? | Depend on, do not replace, the reviewed Data Explorer E1b sealed-fake-to-real direct-guest packet and facts crosswalk at exact local-only commit `08bb5f2906191f0d87624d9a6ecc6788a8b2754d`, including a cold-browser real-adapter run, index-free rerun and complete browser/network trace; then run the same hostile Core/Files/query/byte/action fixture through distinct Web/Files and Explorer generated façades; reuse S6 plan/digest cases; compare retained evidence, common outer discriminants and axes, diagnostics, DTO projections and dependency graphs; compare attempted byte locator/range, commitment, verification method/result, verified byte/range identity and unavailable/tampered/policy-blocked/unknown state; compare exact plan commitment and semantic/profile tuple, roles/authorization basis, effect/receipt commitment and final qualified effect outcome | The direct Explorer trace has zero wallet/account/Commons/indexer/catalog/OS/profile/warm-cache dependency; product DTOs, views, navigation and additive presentation fields may differ; the common outer outcome discriminant and every required axis remain unchanged and each façade preserves, without replacing, merging or reinterpreting, `UNKNOWN`, `PARTIAL`, `ABSENT`, `MASKED`, `CONFLICT`, `INVALID`, `UNSUPPORTED`, byte state, currentness, coverage, authority and basis; exact raw bytes/identity, byte-verification evidence and action/effect commitments match; Web remains directly useful for Files/shell; Explorer remains useful beyond Files; neither imports Type/Data-ABI machinery, selects a hidden provider or creates a second resolver/verifier | Missing/failed E1b proof; any direct-guest hidden dependency; any raw/evidence loss; discriminant, semantic-axis, byte-integrity/availability or plan/effect mismatch; omission becomes absence/completeness; either product must adopt the other's state/navigation model; Explorer is reduced to a File Browser panel; Web must boot Explorer; a product/indexer becomes semantic authority; or a second resolver/verifier/result law appears |
| **S15 — Ethereum standards/profile conformance** | Can the SDK use the selected EIPs/ERCs without turning proposal status, provider/wallet metadata, account class, helper address, receipt or registry into EFS truth? | Exact source snapshots; accepted/observed execution, RPC/read, wallet/account, signature and deployment profile vectors; block-hash-pinned multi-call/page/log runs; provider failover/fork/history loss; separate EOA/1271/6492/7913/P-256 signature receipts and transaction/4337/7702/wallet authorization/submission receipts; ERC-7562/7769 liar-bundler cases; P-256 high-`s`/low-`s` pairs; EIP-712/ERC-7730 mutation pairs; conservative/Cancun/Prague/Osaka bytecode; returndata bombs; deterministic factory/dependency drift | Every advertised standard has an exact capability gate, raw-preserving unsupported path, authority caveat, falsifier and removable fallback; logical reads stay on one basis; each carrier-specific digest/tuple is recomputed and bound to the exact EFS plan without receipt conflation; account strategy drift forces re-verification; SDK-produced P-256 action signatures meet the declared low-`s` policy and raw signature bytes never identify actions; verification APIs are non-persistent; submission layers remain distinct from canonical effect; absent opcode/precompile/history/factory is typed unsupported/unavailable; no draft proposal bytes enter a stable API | Final/status/chain ID/provider name/config/capability/address/code/registry/receipt implies support or truth; unknown transaction/proposal data is discarded; clear-signing differs from signed plan; carrier-specific digest is presented as EFS plan-signature verification; persistent counterfactual prepare occurs in a verify API; app requests arbitrary raw 7702 authorization; high-`s`/low-`s` mutation changes action identity; returndata can OOG; helper cannot be removed; one standard becomes required to reconstruct EFS evidence |
| **S16 — resolved-filesystem host conformance** | Can the common SDK Files seam produce the same qualified read-only resolved filesystem contract for Linux, macOS and Windows adapters without owning native mounts? | Golden route/name/collision fixtures; stable handles/snapshots; verified full/range reads; pagination; unavailable/tampered/unknown bytes; bounded metadata; portable-name collisions; control/export surface; three native adapter traces supplied by their owners | All hosts expose the same qualified semantic outcomes, byte/range identity, collision rules and lossless control evidence; platform-specific errors map without becoming absence; native lifecycle remains outside SDK ownership | Host-specific resolver/verifier/result law; silent path collision; stale handle reads another basis; range mismatch; `UNKNOWN` becomes `ENOENT`; native adapter requires product UI, wallet or indexer truth; SDK takes ownership of OS mount implementation |

## Solidity-specific attack corpus

The onchain lanes must demonstrate at least:

1. a contract lying about ERC-165 support;
2. a callee forging a custom error or returning result-like revert bytes;
3. malformed ABI offsets/lengths and extreme allocation/work pressure;
4. unchanged helper address with a changed proxy implementation;
5. unchanged helper code reading a changed/undeclared Core, EAS, proxy or other
   dependency/basis, and a mutable registry repointing a codec, Type, or helper;
6. a different valid EAS schema UID/tuple than the accepted tuple, plus a
   separately mutable or proxy-backed resolver policy;
7. omitted event/indexer item under an open basis;
8. unknown required Type feature presented to an old consumer;
9. cold and nested helper calls exhausting the declared budget;
10. compiler metadata/path/settings changes producing different code hash; and
11. reentrancy/callback attempts against any read/write adapter surface;
12. no-code `STATICCALL` success plus success and revert returndata at zero,
    limit and limit-plus-one bytes;
13. pre-Cancun/Prague/Osaka execution of generated code that expects newer
    opcodes or precompiles, plus a lying EIP-7910 provider;
14. EIP-7702 delegation, redelegation, clearing, second-level delegation and
    code/hash drift between plan, signature verification and submission;
15. ERC-6492 counterfactual factory/simulation divergence and attempted side
    effects presented as authorization;
16. CREATE2/factory address, initcode, salt, runtime and dependency mutations;
    and
17. contract Lens plans over 1/8/32/64 full-width Principals, including two
    Principals with identical low 160 bits;
18. EFS EIP-712 digest, ERC-4337 `userOpHash`, EIP-7702 authorization tuple and
    submitted transaction/calls mutated independently to prove explicit binding
    without equality or receipt conflation;
19. ERC-7562 validation-scope/stake/reputation errors from an honest and lying
    ERC-7769 bundler; and
20. EIP-7951 P-256 high-`s`/low-`s` equivalent signatures, malformed points and
    the declared canonicality/identity policy.

## Exact stop conditions before production implementation

Production SDK work must not begin while any of these is true:

1. The relevant Core/Type/Record/Occurrence/Realm/authority/Binding/Lens/query
   semantics, bytes, IDs, result ABI, limits, module boundary, and upgrade/
   coexistence behavior are not in an owner-reviewed freeze candidate.
2. The freeze candidate lacks two independent canonical encoders/decoders and
   cross-language vectors that match byte-for-byte and reject the same
   normative invalid corpus.
3. Raw/unknown evidence is lost by any default supported environment or the
   SDK hashes/signs reserialized partial views.
4. Any expected read state, byte state, authority, basis, coverage,
   currentness, conflict, or unsupported condition is collapsed into absence,
   false, empty, success, or a negative cache entry.
5. Complete absence/enumeration cannot be proved under an exact finite basis
   for every API that claims it.
6. Any code generator needs an unretained network input, produces
   non-deterministic output, or lacks full source/toolchain/output manifests.
7. Offline reconstruction needs the original publisher, registry, package,
   hosted indexer/gateway, mutable alias, helper, or SDK team.
8. Signer/controller/author/submitter/payer/admitter roles or inspected action
   effects are not exact and mutation-safe across human, agent and contract
   paths.
9. Guest integration fails the named Web Client byte/performance/no-auth
   budgets, or server/agent integrations require ambient capabilities.
10. Solidity code reaches the S8 headroom tripwires, has unbounded work, fails
    the malformed corpus, or depends on generic runtime interpretation.
11. A deployed helper is required for correctness or has mutable/upgradeable
    semantics. Failure of S9 simply removes the helper lane; it does not block
    a passing generated-inline SDK.
12. Any unresolved critical/high security finding can alter bytes, identity,
    authority, validation, completeness, currentness, bounds, signature intent,
    or reconstruction.
13. The design and relevant protocol specifications have not passed the normal
    owner promotion/freeze ceremony. Passing code or tests alone is not
    adoption.
14. Any advertised Ethereum standard lacks an exact specification snapshot,
    accepted/observed capability gate, raw-preserving unsupported path,
    security falsifier, authority caveat, replacement path, or S15 evidence;
    any draft proposal-specific bytes have leaked into the stable public API.

An OS App SDK or generated capability binding has one additional scoped stop:
it cannot enter production until S13 passes for every binding it claims to
support. Failure there does not force the wallet-free protocol/Files guest path
through CapabilityRPC; it blocks the confined-app surface instead.

Any first-party product façade over the common lossless adapter has a separate
scoped stop: it cannot enter production until S14 passes for every semantic
axis and operation it exposes. Passing S14 proves parity of the shared seam;
it does not merge Web Client/OS and Data Explorer ownership, adopt either
product DTO, or freeze protocol bytes.

Any resolved-filesystem SDK contract has a separate scoped stop: it cannot
claim cross-platform conformance until S16 passes on Linux, macOS and Windows.
That gate does not transfer native mount implementation to the SDK PM.

## Proposed post-review queue for this week

These are the highest-leverage next runs after the founder reviews the
architecture arm and each exact disposable run packet is fixed. They are not
executed or authorized merely by this document.

### Week-1A — compiler contract spike

Use one small Type plus its additive and incompatible revisions. Produce
manifested TypeScript and Solidity outputs, docs, vectors, compatibility/bound
reports, and two independent codec results. Exercise unknown/raw survival.

**Exit artifact:** one evidence packet comparing arms A/B/C and listing every
manual input, network input, output hash, mismatch, unsupported feature, and
profile assumption. Destroy/relabel outputs if S0 or S1 fails.

### Week-1B — Solidity three-arm cost and attack spike

Implement only enough disposable code to measure generated inline leaf,
structural probe, and direct stateless helper against the three workloads and
S8–S10 and S15 attack corpus under conservative, Cancun, Prague and Osaka
profiles. Include bounded-returndata, absent-opcode/precompile, delegation,
factory and dependency-drift cases. No deployment to a durable/shared network.

**Exit artifact:** compiler packet, size/gas distributions, cold/warm/nested
traces, fuzz seeds, helper lifecycle break-even, code hashes, and a keep/kill
decision for each onchain arm.

### Week-1C — result, basis, and reconstruction harness

Use injected direct/indexer/cache/byte sources and the complete mutation
matrix. Remove publisher, network, registry, current generator, and original
indexer; then reconstruct and compare exact selected state. Render the same
write plan for human and agent paths and mutate every authority-sensitive
field. Run both retained-closure and direct-state collection/rebuild arms, and
pin multi-call/page/log observations to one explicit block hash.

**Exit artifact:** outcome transition table, negative-cache proof, zero-network
reconstruction trace, raw-byte survival hashes, plan/digest parity, and every
remaining Core pressure packet.

## Evidence packet format

Every experiment report contains:

- exact question, arms, predeclared thresholds, and stop conditions;
- authority standing and non-goals;
- retained input closure and provenance;
- environment/tool/compiler/source/dependency identities;
- commands plus machine-readable raw measurements and seeds;
- expected versus observed qualified results;
- output artifacts, hashes, size/gas/performance distributions;
- security failures and unresolved unknowns;
- result: `SUPPORTED_FOR_NEXT_EXPERIMENT`, `FALSIFIED`, `INCONCLUSIVE`, or
  `BLOCKED_BY_CORE_INPUT`—never `EFS_V2_CONFORMANT`; and
- the smallest next experiment or owner choice, if any.

## Open questions

- [ ] Are the S8/S9 draft tripwires appropriate for the first representative
  workloads, or should a pre-run packet replace them with stricter values?
- [ ] Which second language/runtime gives the most independent canonical codec
  evidence without sharing an implementation stack?
- [ ] Which exact three application Types best cover Files, Git/Markdown, agent
  and contract-consumption pressure after the one-Type bootstrap fixture?
- [ ] Which security reviewers and clean-room implementers are independent
  enough for the freeze gate?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
