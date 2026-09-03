# R10 — Web Client/OS spine: technology foundation, Web standards profile, Ethereum standards, Type/Data ABI boundary

**Lane:** R10-wco-technology-standards-typeabi
**Vault HEAD read:** `234c3e6` (2026-08-30, "pm: route AO PermawebOS competitive deep dive"); shallow clone, 50 commits reachable.
**Read-only:** nothing under the planning vault was touched.

## 1. Where this set sits

The four lane docs are the "how do we build it" layer of the Web Client/OS spine, written 2026-08-14 → 2026-08-23 by
agent lanes after James supplied 28 numbered directions (`Designs/web-client-os/README.md` §"Direct owner direction
recorded for this round"). Two of them (`web-platform-standards-and-forward-profile.md`,
`ethereum-standards-and-interop.md`) are design maps over reproducible evidence screens in `Reviews/`. One
(`technology-foundation.md`) turns owner direction into a concrete tooling and delivery posture. One
(`type-data-abi-boundary-pressure.md`) is the client's pressure packet against the efsv2 layered Type proposal.

Cohesion inside the four docs is high: the same laws recur (selection is not authority; transport is not
verification; maturity is not a veto; nothing 2026-specific in a public contract). Cohesion with the neighbours is
weaker in three places: (a) the Type/Data ABI adapter claims arm-neutrality but is written in the layered proposal's
vocabulary; (b) the "Protocol SDK" that both the Ethereum and Type docs lean on is designed nowhere in the current
vault; (c) the owner directions the set follows are recorded only in the set's own README, while the efsv2 ruling
ledger and inbox still list the same items as open.

All four docs are `#status/draft`. Each carries same-day agent "Reviewers" lines; none has had a `#status/review`
round with a second agent or human (every pre-promotion checklist leaves that box unchecked).

## 2. Document-by-document

### 2.1 `Designs/web-client-os/technology-foundation.md`

**Standing:** current, `#status/draft`, "owner-directed product posture plus dated implementation recommendations;
no repository, dependency installation, or product implementation is authorized" (header). Last touched 2026-08-23;
git shows commits 2026-08-14 (`89f3638`), 2026-08-22 (`5efc8a1`), 2026-08-23.

**Summary.** Sets a "no application framework, not no libraries" posture (§"Recommended foundation at a glance").
Selects as *product* surface: semantic HTML/CSS, ES modules, Custom Elements/Shadow DOM/`ElementInternals`, TC39
Signals (`Signal.State`/`Signal.Computed` + polyfill), Web App Manifest, four delivery profiles (static core,
stable-origin PWA, immutable-CID, independent rescue), BCP 47/ECMA-402/MF2 i18n, WCAG 2.2 AA, Core Wasm + WIT for
non-DOM modules. Keeps as *dated replaceable* recommendations: Lit (inside nontrivial elements only if the Minimal
Viewer benchmark earns it), Web Awesome Core (pinned/self-hosted, behind `--efs-*` tokens; `<wa-page>` is a
benchmark/optional Session Shell), Vite 8/Rolldown, pnpm, TypeScript erasable-syntax, Biome, Vitest, Playwright.
Defines the "Modern Web guidance and evidence gate" (§): a 6-rank evidence ladder, a 6-step per-change contribution
trace, five required repository artifacts and a `verify:web-evidence` CI gate. Defines the Service Worker generation
model (`NetworkBootstrapGeneration`, `WorkerBootstrapGeneration`, `AppReleaseGeneration`, `ActivationHealthLease`),
seven offline states, storage-role table, the 50-year build/release retention floor, eleven "Required experiments
before implementation selection" and a falsifier list.

**Terms it defines:** `--efs-*` tokens, `efs-*` custom-element namespace, `efs-shell-layout`,
`NetworkBootstrapGeneration`, `WorkerBootstrapGeneration`, `AppReleaseGeneration`, `AcceptedAppState`,
`LocalSelectionState`, `ActivationHealthLease`, `ReleaseClosure`, `BuildPlatformDescriptor`,
`UNSUPPORTED_WEB_PROFILE`, `SHELL_OFFLINE_READY`/`RESOURCE_RETAINED_VERIFIED`/`RESOURCE_NOT_RETAINED`/
`CACHED_STALE`/`DRAFT_LOCAL`/`SIGNED_QUEUED`/`OFFLINE_ACTION_UNSUPPORTED`, `GUIDANCE_UNAVAILABLE`,
`NO_GUIDANCE_MATCH`, `NO_WEB_SURFACE_CHANGE`, `verify:web-evidence` (name provisional), `standardsStatus`,
`productCriticality`, `profileDisposition`, `experimentalExitCondition`.

### 2.2 `Designs/web-client-os/web-platform-standards-and-forward-profile.md`

**Standing:** current, `#status/draft`, "no browser matrix, package, polyfill, repository, build target, or product
implementation is frozen or authorized". Evidence: `Reviews/2026-08-23-web-platform-standards-screen/README.md`
(`#status/done`). Single commit `1565041` 2026-08-23.

**Summary.** "Forward by design, qualified in execution" (§Decision frame). Reports the census (807 W3C
`browser-specs` + 294 TC39 + 35 ECMA-402 + 61 Wasm + 31 WASI = 1,228 rows). Defines seven disposition words
(§Disposition language), twelve "product laws", an illustrative `EfsWebProfileV0` ledger shape, nine named product
profiles (Guest Reader, Forward Shell, Installed/Offline, Secure Worker App, Opaque Full-Web App, Parallel Compute,
Media/GPU/ML, Agent, Rescue), then ~40 disposition tables across HTML/DOM, navigation, CSS, ECMAScript, scheduling,
storage, security, Wasm/WASI, agents, a11y/i18n, network, device portals. Ends with negative selections, a 10-item
acceptance program, and an open-research list.

**Terms it defines:** `EfsWebProfileV0` (`profileId`, `standardsSnapshot[]`, `requiredFeatures[]`,
`optionalFeatures[]`, `forbiddenFeatures[]`), disposition vocabulary (Durable baseline / Required forward /
Enhancement / Specialized profile / Watch / Negative evidence / Out of generic scope), `EfsAgentSurface`,
`RunnerRealization` (referenced), the nine profile names above.

**Notable:** it contains zero occurrences of "Safari", "iOS" or "WebKit" (grep), although owner direction 15 is
explicitly about iOS/Safari and WCOS-R42 names real Safari/iOS as measured profiles.

### 2.3 `Designs/web-client-os/ethereum-standards-and-interop.md`

**Standing:** current, `#status/draft`, "no EIP/ERC adapter, chain profile, signature profile, contract change, or
public API is frozen". Evidence: `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` (`#status/done`).
Commit `e4180cc` 2026-08-23.

**Summary.** Screens 1,561 source files / 1,195 canonical proposals at pinned EIPs `f767a1e` / ERCs `9c718c7`.
Seven product laws (proposal status ≠ support; chain ≠ Realm; Locator ≠ identity; transport ≠ verification; dynamic
authority is basis-qualified; discovery never performs the action; completeness needs finite scope). Places Ethereum
interop as "a family of versioned adapters around the Reader and action systems" with seven illustrative boundaries.
Baseline rows for the direct reader and MVP write lane: EIP-155/695, 1898, 234, 658, ERC-7950 (reads); EIP-1193,
6963 (wallet); EIP-712/ERC-191 (signing); EIP-5792 preferred with sequential fallback (submission); 2718/2930/1559
(tx vocabulary). "Design for": ERC-1271 (MVP claim fixture-gated), 6492, 7913, EIP-7951, ERC-4337, EIP-7702
("disabled by default"). Watch/negative: 7702 via App data (ERC-7902), 5749, 3074/2711/2938 rejected. Defines
`QualifiedEthereumBasis`, `ProviderSession`, `SignatureEvidence`, `AuthorizationConsumptionProfile`,
`ActionAuthorityRoles`, `QualifiedExternalResource`. Files/Type pressure section, privacy/cross-chain/agent sections,
history/DA consequences, 18 MVP acceptance additions, an SDK/EFS v2 pressure packet ("No new generic Core primitive
is requested"), a 9-item research queue, rejected shortcuts and promotion falsifiers.

**Terms it defines:** the six object names above plus typed outcomes `INVALID_AT_BASIS`, `VERIFIER_UNAVAILABLE`,
`HISTORICAL_STATE_UNAVAILABLE`, `UNSUPPORTED_SCHEME`, `UNKNOWN`; `defaultAccount` as UX preference; `chainId:txHash:tx`
citation form.

### 2.4 `Designs/web-client-os/type-data-abi-boundary-pressure.md`

**Standing:** current, `#status/draft`, "design-only adapter and fixture packet; no Type bytes, executable experiment,
public data, protocol conformance, or product implementation is authorized". Commit `b2de89f` 2026-08-22.

**Summary.** Verdict (§Outcome): the layered Type proposal can support the File Browser "only behind one finite,
versioned, EFS-owned consumer adapter"; recommends approach **A** "Finite exact-Type adapter" as MVP/control, **B**
"Pinned Data View adapter" as disposable comparator, rejects **C** generic schema-driven UI. Defines the
`FilesConsumerAdapterV0` call surface and `FilesConsumerAdapterDescriptor`, `DecodedExactRecord<T>`, nine app-facing
DTOs, the exhaustive `ResourceOutcome<T>` (PRESENT/PARTIAL/UNKNOWN/ABSENT/MASKED/CONFLICT/INVALID/UNSUPPORTED),
`ByteOutcome` (six variants) with `LocatorAttempt.outcome`, `PlanOutcome` (seven variants), `ActionPlan/0`,
`ActionReceipt/0`, a layer-leakage verdict table, three reusable Type controls, a symbolic pin (`R, RR, B0, B1, RC, M,
PN, PC, PM?, P, A, AP0`), 20 fixture rows `TDAB-G1…P1`, the `FileRevisionFixture/1 -> /2` evolution case, a validator
family table, two Core pressure packets (bounded complete Binding enumeration; executor/operation-bound consent), ten
feedback items to the Type owner, and a "Morning verdict": proceed with the adapter recommendation, do not start the
executable fixture, do not ask for a Type/Core permanence choice.

**Terms it defines:** everything listed above, plus `EfsTypeRevision`/`EfsTypeRevisionRef`, `ViewRevisionId` (as the
persisted name for "Data View"), `FilesViewSnapshot`, `PresentationPlan`, `ConsumerAdapterProfile`,
`ViewInventorySnapshot`, `IN_TYPE | DETACHED_COMPARATOR`, `EXPERIMENTAL_DIRECT_CORE`, `protocolConformance`,
`filesPreconditionCertified`, `EvidenceHandle`, `EffectOutcome` registry, `INTERACTIVE | GATE | BACKGROUND |
ACTION_PLAN` read purposes.

### 2.5 `Designs/efsv2/layered-type-system-and-data-abi.md` (neighbour, read fully)

**Standing:** current per `Designs/efsv2/README.md` §"Current technical candidate" ("a review/experiment target, not
an adopted Type system or frozen byte format") and its own header ("proposal and disposable experiment target; not
adopted or frozen"). Last touched 2026-08-14 (`5d1242e`), i.e. two days *after* `core-architecture-candidate.md`
(2026-08-12).

**Summary.** Four candidate architectures: A bundled exact Type (B0 control), B structural (rejected), **C layered
exact Type plus bounded Views (recommended comparison target)**, D open ontology (rejected). C's identifiers:
`SemanticSpecId`, `LogicalShapeId`, `RepresentationId`, `ViewRevisionId`, `TypeRevisionId`, `RecordId`,
`QueryProfileId`, `ViewQueryProfileId`. Four contract consumption modes (`EXACT`, `PINNED_VIEW_SET`,
`SEMANTIC_VIEW`, `LENS_CURATED_VIEW`), a directional compatibility algebra, evolution rules, projections,
`InterfaceRevision/1`/`WorldProfile/1`, `TypePackageRelease/1`, Files-catalog aliases, T1–T9 experiments, kill
criteria, nine open questions ("None of these is an immediate owner decision").

**Terms defined:** all identifiers above; `ConsumerProfile`; `TypeSuccessor`, `TypeFamilyMembership`,
`TypeEquivalence`, `TraitClaim`, `ConformanceResult`, `DeprecationNotice`; `ExecutionManifestId`; the M/D/C physical
arms.

### 2.6 `Designs/web-client-os/README.md` (neighbour, read fully)

**Standing:** current authority map for the set; `#status/draft`; last touched 2026-08-26 (`a354435`). Owns
directions 1–28, the layered boot graph, the documents table, the "Mandatory modern-Web guidance gate", the authority
map, the historical `clientv2` audit, ownership boundaries, work sequence, non-authorizations, open questions and
pre-promotion checklist.

### 2.7 Evidence reviews (skimmed)

- `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` — `#status/done`. Counts (949+612=1,561 files;
  584+611=1,195 canonical; status table sums to 1,195) and `corpus-index.tsv` SHA-256
  `4315e018…995f` **reproduce at HEAD** (`shasum -a 256`). Line 142 cites `Designs/sdkv2/ethereum-standards-census.md`
  at GitHub commit `4d3e736` — that path does not exist at HEAD and the commit is not in this clone.
- `Reviews/2026-08-23-web-platform-standards-screen/README.md` — `#status/done`. 1,228 rows (807/294/35/61/31) and
  `corpus-index.tsv` SHA-256 `f5a7bd45…ecfb1b` **reproduce at HEAD**. Honest about limits: the W3C TR response "was not
  retained in this vault, so the dated 1,236/288 observation is not independently reconstructible". The
  `selected-status-ledger.tsv` pins TC39 Signals = Stage 1, Temporal = Stage 4 (2026-05), Explicit Resource
  Management = Stage 4 (2026-05).

## 3. Lane question 1 — what the client assumes about the Type/Data ABI

**What the client assumes.** `type-data-abi-boundary-pressure.md` §Outcome: (1) one adapter profile pins "a finite
exact Type/package closure"; (2) "generated codecs validate exact protocol bodies and preserve raw canonical bytes";
(3) Reader and Files Resolver return "one shared discriminated outcome algebra"; (4) a bounded Data View is only a
comparator; (5) every write plan binds one trusted operation interface. `architecture-and-modules.md`
§"Type/Data-ABI consumer boundary" restates it and adds: "This is an exact-Type-first adapter recommendation, not
adoption of the layered proposal or its bytes." `mvp-and-acceptance.md` §I (lines 690–748) turns it into acceptance
checkboxes. `README.md` direction 12: "The Type/query-identity axis remains open ... this set infers no choice."

**Does the layered doc agree?** Yes on the consumer side. `layered-type-system-and-data-abi.md` §EXACT ("The
contract accepts a finite set of exact `TypeRevisionId`s and generated decoders. This is the safest mode") and
§"Candidate responsibility boundary" ("SDK and code generation: ... generated Solidity/TS/Rust; unknown
preservation; catalog UX; adapters") match approach A. The layered doc's own open question 1 ("Do first-class
bounded Data Views earn permanent Core inclusion over exact-Type-only Core plus generated consumer adapters?") is the
same question the client's T4 comparator asks.

**Does the Stage A B0 bundled-Type arm agree?** Partially, and here the client packet is not as neutral as it says.
`core-architecture-candidate.md` §Type Schema defines `TypeSchema` and says: "Variant A hashes semantic meaning,
shape, validation, reference roles, and canonical index obligations into one `TypeSchemaId` ... Variant B separates
semantic `TypeId`, encoding `ShapeId`, validation/admission profile, and `IndexProfileId` ... Both must be
implemented against the same fixtures; this prose does not choose by accident." The layered doc §A says of the
bundled arm: "an index or representation improvement changes the Type and all subsequent Record IDs."

The client packet's contract, however, is written in Variant-B/Architecture-C nouns:

- `FilesConsumerAdapterDescriptor.requiredExactTypeQueries[] { queryProfileRef ... }` and
  `acceptedViewProjections[] { viewRevisionRef, viewBindingCommitmentRef, bindingPlacement: IN_TYPE |
  DETACHED_COMPARATOR }` (§Candidate adapter contract);
- `TDAB-E1`: "Version 2 receives a new `LogicalShapeId`, `RepresentationId` and `TypeRevisionId`. If the v1
  normative semantic commitment already defined the optional language axis, the experiment may retain its
  `SemanticSpecId`" and step 7 "If an exact-Type index is needed for v2, it receives a new QueryProfile and remains
  `PARTIAL` until exact backfill coverage" (§Disposable evolution fixture);
- `TDAB-Q1` and `ViewInventorySnapshot` exist only under C's `ViewQueryProfileId`.

Under Variant A there is no separate `QueryProfile`, no `SemanticSpecId`/`LogicalShapeId` split, and an index change
*is* a new Type; steps 1 and 7 of the evolution fixture cannot be executed as written. The packet says (§Authority
and non-adoption boundary) "This packet uses symbolic profile and Type references so neither arm becomes a de facto
SDK ABI" and mvp-and-acceptance open question (line 912) repeats "no choice is inferred" — but the descriptor and
fixture *do* encode the C-shape as the only one with named fields. **Inference:** the app-facing DTOs and
`ResourceOutcome` law are genuinely arm-neutral; the descriptor and E1/Q1 fixtures are not. Finding F1.

**Naming drift.** `core-architecture-candidate.md` §Type Schema: "Working replacement for the confusing name
`TypeRevision`" → `TypeSchema`; `efsv2/README.md`: "`TypeSchema` is the current plain-language name; older files
call similar concepts `TypeRevision`"; `system-constitution.md` §"What is deliberately not frozen": "the name
`TypeRevision` or any exact Type schema". The layered doc (two days newer) and the entire client packet use
`TypeRevisionId`/`EfsTypeRevisionRef`. Finding F10.

**Result law.** `ResourceOutcome<T>`/`ByteOutcome`/`PlanOutcome` are the client's strongest, most reusable
contribution. They depend on no Type arm and are consistent with `system-constitution.md` line 88–92 (constitution
§8 honesty) and with `hierarchical-files-and-folders.md` `profileValidationGrade`. Nothing in efsv2 defines a
competing outcome enum, so this is a de facto client-owned law that efsv2 should either adopt or answer. It is
solid enough to build on.

**What gates a first fixture.** `type-data-abi-boundary-pressure.md` §Future disposable experiment gate requires
"a frozen-for-the-experiment B0 control and layered candidate descriptor/body vector closure from the Type lane" and
"two independently implemented exact codec/validator results". `README.md` §Current work sequence step 3 makes
"freeze only the symbolic inputs in [[type-data-abi-boundary-pressure]]" the *MVP critical path*. `Open-Decisions.md`
shows V2-E4, V2-E8, V2-F1 "Waiting on evidence"; the brief confirms Stage B has not run. So the client MVP fixture
cannot begin until efsv2 produces frozen-for-experiment Type/Files inputs — a deliverable no efsv2 doc names as
such (the layered doc's T1 produces vectors, but "frozen-for-experiment" is a client-side term). Finding F2.

## 4. Lane question 2 — Ethereum standards, Principal model, SDK, and where the MVP wallet stack is decided

**Selections in `ethereum-standards-and-interop.md`** (all "Baseline" unless noted):

| Concern | Selection | Where |
|---|---|---|
| Exact reads | EIP-155/695 chain ID; EIP-1898 block-hash pinning ("Pin every supported dependent state call to one block hash"); EIP-234 logs by block hash; EIP-658 status; ERC-7950 `chainId:txHash:tx` export; EIP-1186 proofs optional/fixture-gated | §Qualified reads and citations |
| Wallet/provider | EIP-6963 discovery only after `Connect controller`; EIP-1193 narrow adapter, provider treated as adversarial; EIP-2255 design-for; EIP-5749 "Do not select"; EIP-1102 `enable()` rejected; ERC-7846 watch; SIWE optional hosted-service adapter | §Explicit wallet connection |
| Signatures | EIP-712 typed domain binding chain/Realm/action/nonce/expiry/Principal/signer; ERC-1271 design-for, "MVP claim fixture-gated"; ERC-6492, ERC-7913, EIP-7951 design-for; ERC-8111 encoding watch | §Typed actions, signatures |
| Submission | EIP-5792 "Preferred supported-wallet adapter" with "Explicit sequential submission remains the honest fallback"; ERC-4337 design-for; EIP-7702 "Design for; disabled by default", `chain_id = 0` rejected; 7579/6900/8130/8141/8197 watch; ERC-7902 negative | §Submission and account execution |
| URI/content | ENS/contenthash/ERC-4804/ERC-3668/ERC-5219 optional adapters; ERC-681/1328/831 compatibility; MIME never activates code | §Names and URI-shaped resources |
| Agents | ERC-8001 optional adapter; 8004/8257/8273 watch; 8196/8183 App adapter; 8199 negative | §Agent interoperability |

All 47 status labels I spot-checked (1186, 1474, 2696, 2700, 5593, 3085, 3326, 7867, 7896, 7950, 8001, 8126, 8196,
7857, 7786, 5164, 7813, 8111, 7677, 7930, 7828, 8152, 7945, 5169, 5018, 1900, 8100, 7846, 8019, 7749, 7739, 7730,
6865, 7754, 8004, 8257, 8273, 8183, 8199, 7951, 7913, 6492, 1271, 5792, 7702, 4337, 7562) match the pinned
`corpus-index.tsv` `status` column. The doc's maturity labelling is sound.

**Does it match the efsv2 Principal model?** Yes at the level the constitution states.
`system-constitution.md` lines 130–147: "Semantic author, signing actor/account, submitter/relayer, and payer are
distinct roles"; "EOA and ERC-1271 authorship must work in a fresh supported Realm"; "The current candidate exposes
one `PrincipalId` semantic author surface and represents an EOA or smart account as a zero-setup account Principal".
The Ethereum doc's `ActionAuthorityRoles` (semantic Principal / controller-authorization / signer descriptor /
account sender / 7702 authority / outer sender / submitter / payer / requesting App) is a superset that adds AA roles
the constitution reserves as "extension requirements" (line 138). Owner direction 7 (`web-client-os/README.md`) is
followed literally: "The mutable `defaultAccount` is only a routing/UX preference. The actual signer may be an EOA
account, contract-account verifier, verifier-plus-key descriptor, P-256 key profile ...".

But V2-E1 is not ruled: `owner-decision-inbox.md` §V2-E1 "James's preference is one semantic Principal surface; it
is not frozen until the comparison proves it honest and simpler"; `owner-rulings.md` 2026-08-12 "Open, not ruled:
whether every author-facing API uses `PrincipalId`". The client README's "Upstream synchronization note (2026-08-14)"
admits this and says "The EFS v2 PM has the exact reconciliation handoff". Nineteen days later the ledger is
unchanged. Finding F5.

**Does it match the SDK material?** No, and it cannot: every `Designs/sdk-*.md` is v1/EAS. `Designs/README.md`
§Review banner: "The pre-v2 SDK corpus ... their EAS UID identity, wallet/Lens defaults, and write graph are not
EFS 2.0 inputs by default." `sdk-wallet-architecture.md` (2026-06-20) builds on viem, EAS `multiAttestByDelegation`,
an in-account 7702 implementation + ERC-7579 executor module as the "ideal one-sig targets", and a client-run
delegated relayer for gas; `sdk-write-ux.md` says "embedded/programmatic 7702 FIRST"; `sdk-architecture.md`
§batch: "EIP-5792 `wallet_sendCalls` — Preferred path." The Ethereum doc keeps only the 5792 preference and the
1193/1271 boundary; it reverses the 7702 stance ("disabled by default"; Apps "never supply raw authorizations or
delegation code") and drops the relayer/paymaster sponsorship axis entirely (no sponsorship, gasless or faucet path
appears in `ethereum-standards-and-interop.md` or `mvp-and-acceptance.md`; the only "payer" mention is a role field).
Both positions are defensible; the point is that **no EFS 2.0 SDK design exists** to carry the seven responsibilities
the Ethereum doc assigns to "Protocol SDK" (§SDK and EFS v2 pressure packet table; §Architectural placement:
"The future Protocol SDK owns canonical Ethereum encodings, low-level RPC and contract calls, runtime validation,
signature primitives, and raw evidence"). The `Designs/sdkv2/ethereum-standards-census.md` that four current docs
cite at commit `4d3e736` is absent (`ls Designs/` has no `sdkv2/`; `git cat-file -t 4d3e736` fails; shallow clone,
so UNVERIFIABLE upstream). Findings F3, F4.

**Where is the MVP wallet stack actually decided?** Nowhere labelled as a decision, but it is decided in substance:

- `README.md` header: "no repository, runtime ABI, module profile, **wallet stack**, or product implementation is
  authorized".
- `product-constitution-and-roadmap.md` WCOS-R14: "a user can connect a supported wallet" — "supported" undefined.
- `mvp-and-acceptance.md` §Required write behavior (lines 62–79): "Lazily load the selected wallet connector";
  "Under the current candidate, sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent`
  separately because every Files operation selects Binding leaves"; §Deliberately deferred: "ERC-1271 claims until
  a fixed smart-account fixture passes; an EOA-only adapter must report `ERC1271_UNSUPPORTED`"; §C Official writes
  (lines 373–410): EIP-6963 → EIP-1193, `accountsChanged`/`chainChanged` fencing, EIP-5792 with sequential fallback,
  ERC-7950 export.
- `ethereum-standards-and-interop.md` Baseline rows as tabulated above.

Net: **the MVP wallet stack is an injected EIP-6963/1193 EOA, two EIP-712 signatures per Files operation
(Envelope + AdmissionIntent), sequential submission with optional 5792 batching, no smart accounts, no sponsorship,
no 7702.** Nobody has written that sentence, costed it against v1's measured "2–3 popups" problem
(`sdk-minimal-clicks.md`, `sdk-write-ux.md` §"The constraint"), or asked whether a Sepolia-faucet-dependent EOA path
is acceptable for the first official product. Finding F6. (`Decisions.md` 2026-06-23 shows the v1 buildathon needed
a faucet PR and later a burner session precisely for this.)

**One internal seam.** `ethereum-standards-and-interop.md` §Typed actions: "If the current Core/adapter profile
cannot name that consumer and prove the rule, the write profile is `UNSUPPORTED`; EIP-712 does not fill the gap."
`hierarchical-files-and-folders.md` §8.2: "Current B0 `AdmissionIntent/1` is bearer authorization to Core. It does
not name an executor or commit to the complete routed operation ... No `/1` operation may be reported as
`FILES_PRECONDITION_CERTIFIED`." `product-constitution-and-roadmap.md` Slice B and `type-data-abi-boundary-pressure.md`
§Core pressure packet 2 label the same state `EXPERIMENTAL_DIRECT_CORE`, `protocolConformance=false`,
`filesPreconditionCertified=false` with `PLAN_READY`. Whether the B0 intent's Core-consumed nonce satisfies the
Ethereum doc's "authoritative consumer + ordered effect commitment" rule (so the profile is experimental-but-ready)
or fails it (so the profile is `UNSUPPORTED`) is not stated in either doc. Finding F18.

## 5. Lane question 3 — owner-directed vs dated; MVP cuts; 50-year vs speed

**Owner-directed (cite `README.md` §Direct owner direction numbers):** Signals (14, also `technology-foundation.md`
§Decision frame bullet 3), Web Components (18), PWA/installable/responsive (16), forward standards and
no-lowest-common-denominator (15, 28), i18n/a11y from first slice (17), 50-year standards surface (13), opt-in
upgrades (19), Nix/Guix-style generations (20–22), Wasm/WIT/Component/WASI foundation (23), guidance gate (24),
EIP/ERC deliberate use (27), Web standards census (28). `README.md` §Working recommendations in this draft confirms:
"The standards-first surface, Signals direction, forward-browser posture, installability, responsive/global use and
offline/online outcome separation are owner-directed product requirements".

**Evaluation-directed, not selected:** Lit and Web Awesome incl. `<wa-page>` (18: "Seriously evaluate ... but make
each earn its bounded place").

**Dated agent recommendations (2026-08-14 baseline, `architecture-and-modules.md` §Reversible tooling
recommendation; `technology-foundation.md` §Greenfield build and release posture):** Vite 8/Rolldown, pnpm, strict
TypeScript erasable-syntax, Biome + `tsc`, Stylelint, Nu HTML Checker, Vitest, Playwright, axe-core, TypeDoc, DTCG
token format, MF2 subset interpreter, Web Awesome Core as default control pack with Fluent WC v3 / Lion as
challengers, Google Modern Web Guidance snapshot `460e553`. `README.md` §Explicit non-authorizations: "installing
or freezing an exact Signals polyfill, Lit, Web Awesome, Vite, pnpm, TypeScript, test, i18n, PWA, runner or other
dependency/profile" is not authorized.

**For an MVP (guest read + New folder / New file / Publish revision), what to cut:**

1. The per-change guidance/evidence gate, five repository ledgers and `verify:web-evidence` CI (F7) — keep the
   census TSVs as a lookup and one `EfsWebProfileV0` page naming engines.
2. ~39 "required"-class forward rows (F8) — keep HTML, CSS Grid/container queries/logical properties, ESM, Fetch/
   Streams, IndexedDB, WebCrypto L1, hash routing, Manifest metadata; defer Navigation API, Popover/commands,
   Temporal, `using`, Storage Buckets, OPFS, Trusted Types enforcement, Service Worker, WebAuthn, WebTransport,
   Speculation Rules, Storage Buckets.
3. The i18n/a11y *release* matrix (F13) — keep `lang`/`dir`, logical CSS, message IDs, NFC/bidi isolation,
   `Intl` for display, one `en` pack; defer MF2 runtime, pseudo-locale generators, multi-script real-IME release
   fixtures, manual switch-access passes across three engines.
4. The per-release 50-year retention floor (F14) — keep lockfile + retained dependency archives + one reproducible
   rebuild; defer base-image/VM/rootfs retention, `BuildPlatformDescriptor`, dual air-gapped rebuilds.
5. Web Awesome/Fluent/Lion bakeoff and `<wa-page>` comparator — the MVP has ~5 controls (name field, buttons,
   dialog, progress, list); native elements suffice; run the bakeoff at Slice D/E.
6. Wasm/WIT/Component/WASI (direction 23) — already outside MVP per `product-constitution-and-roadmap.md`
   §Feature horizons; keep only the non-DOM Worker seam.
7. `technology-foundation.md` §Required experiments 1–11 — only #4 (static/PWA generation fixture, minus SW parts)
   and #5 (storage/recovery) touch the MVP; the rest gate later slices.

**Does the 50-year direction conflict with shipping quickly?** Not in its technology content — semantic HTML, CSS,
ESM, Custom Elements and plain-data boundaries are also the fastest way to ship a small file browser without a
framework. The conflict is in the *ceremony* the docs attach to it: eleven pre-selection experiments, the guidance
lock/ledger/receipt machinery, per-release base-image retention and dual rebuilds, and the global-use release
fixtures. Those are what make the first build slow. `technology-foundation.md` §Decision frame itself says "Fifty
years is a dependency and interface strategy, not a promise that an unchanged 2026 binary or toolchain will run
everywhere in 2076" — the cuts above follow that sentence rather than the retention section.

Two residual tensions to name: (a) selecting a **Stage 1** proposal (Signals) as "future JavaScript" means that if
the proposal stalls, the polyfill becomes a permanent EFS-maintained state framework — exactly what direction 13
says a 2026 library must not become (F9); (b) Web Awesome Core is "Lit-based" (`technology-foundation.md`
§Current control-pack comparison), so choosing it pre-selects Lit for the write/OS path regardless of the
native-vs-Lit Minimal Viewer benchmark the docs treat as independent (F21).

## 6. Lane question 4 — is the guidance gate + census a reasonable precondition for a first build?

**Plainly: the census is a reasonable and already-finished reference; the gate as elaborated is a process
precondition that should be deferred.**

What exists and is solid: both corpus screens are `#status/done`, the TSVs and their SHA-256 hashes reproduce at
HEAD, the selected-status ledger has a regression test (`build-index.test.mjs`), and status labels in the design docs
match the index. Re-running the census "before a Web Profile release" (`web-platform-standards-and-forward-profile.md`
§Acceptance program 1) is cheap and correct.

What is a process gate: `README.md` §Current work sequence step 2 — "Before any authorized Web experiment or
implementation, retain the selected guidance snapshot, reproduce or deliberately refresh the pinned standards
census, instantiate the EFS feature/profile evidence ledgers and put the native-first review fields in the
repository contribution path." `technology-foundation.md` §Required contribution trace (six steps for "each
applicable change", author *and* independent reviewer), §Reproducible repository boundary (agent rule, guidance
lock, standards-evidence lock/closure, feature-policy ledger with ~14 fields per row, browser-profile ledger,
evidence receipts keyed by build digest, `verify:web-evidence` that "rejects incomplete matrices"). `type-data-abi-
boundary-pressure.md` TDAB-P1 and §Future disposable experiment gate require the retained closure "before any UI or
generated document is created" — even for a disposable, offline Type fixture. `web-platform-standards-and-forward-
profile.md` §Acceptance program adds ten matrices.

Owner direction 24 is one sentence: "Every authorized Web Client/OS implementation task must use the pinned modern-Web
guidance and standards-evidence gate ... Guidance is build-time evidence, never runtime code or product authority."
It was prompted (README §Mandatory modern-Web guidance gate) by a Hacker News observation that "coding models can lag
newly Baseline web-platform features". The proportionate response to that risk is a pinned guidance snapshot the
implementing agent reads and a reviewer who checks for stale idioms — not a ledger schema and CI gate that precede the
first line of product code. The elaboration is agent-authored; relaxing it needs the owner only because direction 24
says "every". Finding F7. The right MVP shape: keep (i) the two census TSVs, (ii) one retained guidance snapshot with
its licence, (iii) a one-page `EfsWebProfileV0` naming exact engines and the ~8 features the MVP actually uses;
defer the per-change trace, ledgers and CI gate to the first post-MVP profile release.

## 7. Lane question 5 — internal contradictions and unreconciled statements

| # | Statement A | Statement B | Assessment |
|---|---|---|---|
| C1 | `README.md` direction 15: "A current lag in one browser—especially iOS/Safari—does not veto the architecture" | `web-platform-standards-and-forward-profile.md` has zero mentions of Safari/iOS/WebKit; `product-constitution-and-roadmap.md` WCOS-R42 lists "real desktop Safari, real iOS Safari" as measured profiles; `technology-foundation.md` line 598: "Current Chromium, Gecko and WebKit ... still remain required evidence" | Not contradictory (no veto ≠ no testing), but the set never names which engines must pass the **Guest Reader** profile *fully* vs be sent to `UNSUPPORTED_WEB_PROFILE`/rescue. The census doc's own open item: "exact first `EfsWebProfileV0` feature and engine/AT matrix". UNDECIDED (F11). |
| C2 | Direction 15/28: lag is not a veto | `Reviews/2026-08-13-claude-evidence-round/README.md` §Browser-runner evidence: "a three-second busy loop in the opaque child froze Safari's host page"; "~22 animation frames per second" (Safari 26.5.2, n=1) | The measured Safari result is an *isolation* failure, not a feature lag. `web-platform-standards-and-forward-profile.md` §Named product profiles "Opaque Full-Web App" lists "renderer DoS" as a residual but cites no measurement; `app-runtime-and-direct-launch.md` does not cite it either (grep). Evidence not bound (F12). Not MVP-relevant. |
| C3 | Direction 28: "Standards maturity ... is not a conservative veto" | `web-platform-standards-and-forward-profile.md` §Disposition language: every "Required forward" feature needs "a named reduced/unsupported/rescue outcome"; §Acceptance program 2 "Disable each required-forward/enhancement feature independently"; "'Required forward' does not mean an unsupported parser may encounter unknown syntax in the guest-critical bundle" | Coherent as doctrine: "required" means "full profile uses it; unsupported engines get an explicit negative outcome". The cost is that ~39 required rows each carry a fallback and a kill-matrix fixture (F8). Not a contradiction; an over-wide scope. |
| C4 | `README.md` direction 12 and `mvp-and-acceptance.md` line 912: Type/query axis open, "no choice is inferred" | `type-data-abi-boundary-pressure.md` descriptor fields `queryProfileRef`, `viewRevisionRef`; TDAB-E1 mints `LogicalShapeId`/`RepresentationId`/`SemanticSpecId`; step 7 "receives a new QueryProfile" | The adapter contract and fixture presuppose Architecture C's split identifiers. WRONG (F1). |
| C5 | `README.md` header: "no ... wallet stack ... is authorized" | `mvp-and-acceptance.md` §C and `ethereum-standards-and-interop.md` Baseline rows fix EIP-6963/1193 EOA + two EIP-712 signatures + 5792/sequential | Decided in substance, unlabelled, uncosted. UNDECIDED-by-omission (F6). |
| C6 | `ethereum-standards-and-interop.md`: write profile is `UNSUPPORTED` if no named consumer proves the consumption rule | `product-constitution-and-roadmap.md` Slice B / `type-data-abi-boundary-pressure.md` packet 2: same state is `EXPERIMENTAL_DIRECT_CORE`, `PLAN_READY` | Two labels, no reconciling sentence (F18). |
| C7 | `owner-rulings.md` 2026-08-12: "Open, not ruled: whether every author-facing API uses `PrincipalId`"; `owner-decision-inbox.md` V2-E1 "Decide after evidence" | `README.md` direction 7: "The client uses one uniform `PrincipalId` surface"; WCOS-R18; `mvp-and-acceptance.md` §Identity | Directions 1–28 are owner text but live only in a design README; the recording rule (`owner-decision-inbox.md` §Recording rule step 1) sends answers to `owner-rulings.md`. DRIFT/vault-process (F5). |
| C8 | `technology-foundation.md` §Where Lit earns a place: Lit enters only if "the fixed benchmark earns it" | §Current control-pack comparison: Web Awesome Core is "Lit-based"; §Critical-path: Web Awesome is outside the guest closure but inside the write path | Choosing Web Awesome pre-decides Lit for the write/OS path; the two bakeoffs are not independent (F21, minor). |
| C9 | `core-architecture-candidate.md`: `TypeSchema` replaces "the confusing name `TypeRevision`" | `layered-type-system-and-data-abi.md` and all four client docs: `TypeRevisionId`/`EfsTypeRevisionRef` | Naming drift inside efsv2, inherited by the client (F10, minor). |
| C10 | `technology-foundation.md` §Decision frame: 50 years is "a dependency and interface strategy" | §Greenfield build and release posture: every release retains "an immutable complete base image/VM/rootfs including every base layer" plus two air-gapped rebuilds | Not a contradiction; the second is the ceremony the first says isn't the point (F14). |

## 8. Neighbour assumptions

| This set assumes (where) | About | Neighbour says | Agrees? |
|---|---|---|---|
| Exact `TypeRevisionId`-style identities exist and a finite accepted set is honest under either arm (`type-data-abi-boundary-pressure.md` §Outcome, §Three boundary approaches) | efsv2 Type | `layered-type-system-and-data-abi.md` §EXACT; `core-architecture-candidate.md` §Type Schema Variant A/B "Both must be implemented against the same fixtures" | yes on the concept; **no** on the vocabulary (§3 above) |
| `BindingScope` and executor/operation-bound consent are the two generic Core pressures (`type-data-abi-boundary-pressure.md` §Core pressure packets 1–2) | efsv2 Files | `hierarchical-files-and-folders.md` §5 "Complete directory enumeration: BindingScope", §8.2 FilesRouter / `RoutedAdmissionIntent/1`; `efsv2/README.md`: "neither is current B0" | yes |
| Uniform `PrincipalId` + zero-setup account Principal + separate signer descriptor (`ethereum-standards-and-interop.md` §Submission; `mvp-and-acceptance.md` §Identity) | efsv2 Core | `system-constitution.md` lines 140–147 (candidate); `owner-rulings.md` 2026-08-12 "Open, not ruled"; V2-E1 waiting | candidate yes; ruling **no** |
| Sepolia is the first development Commons; chain ≠ Realm (`ethereum-standards-and-interop.md` law 2; `README.md` direction 10) | efsv2 Realm/venue | `efsv2/README.md` §Current status; `owner-rulings.md` 2026-08-12 "No Commons home chain is selected" | yes |
| A "Protocol SDK" owns encodings, RPC, validation, signature primitives, raw evidence (`ethereum-standards-and-interop.md` §Architectural placement, §SDK pressure packet; `architecture-and-modules.md` §Product and repository boundaries) | sdk | No EFS 2.0 SDK design exists; `Designs/README.md` marks all `sdk-*.md` as pre-v2 evidence; `Designs/sdkv2/` absent | **no** (missing) |
| The July client set is evidence only (`README.md` §Historical evidence retained) | clientv2 | `Designs/clientv2/README.md` "Greenfield product-layer correction (2026-08-12): this set is evidence" | yes |
| `PackageHandoff` is one-way and carries no grants (`README.md` §Ownership boundaries) | open-web-app-store | not opened in this lane | unknown |
| The shared outcome algebra serves "later native adapters" (`type-data-abi-boundary-pressure.md` §Outcome 3) | mounts / OS Drives | `mountable-filesystem-semantics.md` not opened in this lane; `owner-rulings.md` 2026-07-22 requires honest absence vs `UNKNOWN` on three hosts | plausibly yes; unverified |
| Safari opaque-iframe behaviour is a named residual (`web-platform-standards-and-forward-profile.md` §Named product profiles) | evidence round | `Reviews/2026-08-13-claude-evidence-round/README.md` §Browser-runner evidence has the measurement; design docs don't cite it | partial |
| WebMCP is a projection over an EFS agent contract (`web-platform-standards-and-forward-profile.md` §Agents) | privacy-and-agents | `privacy-and-agents.md` line 474 "optional page-tool discovery/invocation adapter over the EFS-owned tool contract" | yes |

## 9. Decided / undecided / disagreements

### Decided (with ruling location)

| Item | Where recorded | Docs that still disagree |
|---|---|---|
| EFS 2.0 is the one greenfield successor; no v1 compat | `Decisions.md` 2026-08-08; `owner-rulings.md` 2026-08-12 | none in this lane |
| Core / optional Commons / clients boundary; Sepolia first dev Commons; direct guest File Browser required | `owner-rulings.md` 2026-08-12 | none |
| Standards-first, Signals, Web Components, PWA/responsive, forward-browser posture, i18n/a11y foundations, 50-year surface, opt-in upgrades, Wasm/WIT foundation, guidance gate, EIP and Web census (directions 13–18, 19–24, 27–28) | `Designs/web-client-os/README.md` §Direct owner direction | `owner-rulings.md` (not carried) |
| Uniform `PrincipalId` client surface; 64-Principal Lens target; NFC names (directions 7–9) | `Designs/web-client-os/README.md` §Direct owner direction | `owner-rulings.md` 2026-08-12 "Open, not ruled"; `owner-decision-inbox.md` V2-E1/E2 |
| Type/query-identity axis is explicitly **not** decided (direction 12) | `Designs/web-client-os/README.md` | `type-data-abi-boundary-pressure.md` vocabulary leans C (F1) |
| Lit, Web Awesome, Vite, pnpm, polyfill versions are dated recommendations, not selections | `README.md` §Working recommendations; §Explicit non-authorizations | none |
| Both corpus screens complete at pinned revisions | `Reviews/2026-08-22-…/README.md`, `Reviews/2026-08-23-…/README.md` (`#status/done`), hashes reproduce | none |

### Undecided (owner suggestion, blocks MVP?)

| Item | Suggested owner | Blocks MVP |
|---|---|---|
| Type/query identity arm (V2-E4/E8/F1) and the "frozen-for-experiment" Type/Files inputs the client fixture needs | efsv2 | yes |
| Which engines must pass the Guest Reader *full* profile (first `EfsWebProfileV0` engine matrix) | web-client-os, with owner input on who gets rescue | yes (acceptance definition) |
| The MVP wallet stack as a labelled decision (EOA-only, two signatures per op, no sponsorship) and its UX cost | web-client-os + sdk, owner sign-off | yes |
| V2-E1 Principal surface at Core level | efsv2 | partly (client can proceed on the candidate) |
| Who owns an EFS 2.0 SDK design and whether `Designs/sdkv2/` exists upstream | sdk / owner | yes |
| `EXPERIMENTAL_DIRECT_CORE` vs `UNSUPPORTED` for B0 `AdmissionIntent/1` | web-client-os + efsv2 | minor |
| Lit in the Minimal Viewer; Web Awesome vs Fluent vs Lion; `<wa-page>` | web-client-os (experiments 1–3) | no |
| Service Worker in the MVP | web-client-os (`technology-foundation.md` §Open evidence questions) | no (deferred) |
| Exact Signals proposal revision/polyfill | web-client-os | no |
| CAIP/ENSIP/WalletConnect pins before freezing chain/Realm serialization (`ethereum-standards-and-interop.md` §Research queue 8) | web-client-os + efsv2 | no |

## 10. Defects and stale facts

**Verified at HEAD**
- `Reviews/2026-08-22-web-client-os-eip-erc-screen/corpus-index.tsv` SHA-256 = `4315e018d019c409b56e4cb2b60ca708b7dc32d4768faad2a7f4f0293502995f` (matches README); 1,562 lines = header + 1,561.
- `Reviews/2026-08-23-web-platform-standards-screen/corpus-index.tsv` SHA-256 = `f5a7bd453d10a2f1fe21066ac628e0080ed31465a704bce2f300b3e558eecf1b` (matches README); 1,229 lines = header + 1,228; 807+294+35+61+31 = 1,228.
- 47 EIP/ERC status labels in `ethereum-standards-and-interop.md` match the TSV `status` column.
- All wiki-links I relied on resolve: `Reviews/2026-08-26-module-plugin-systems-pressure/README.md`,
  `architecture-and-modules.md#Configuration objects` (line 623), `system-profiles-and-generations.md#WebAssembly,
  WIT, Component Model and WASI foundation` (line 937), `technology-foundation.md#Modern Web guidance and evidence
  gate` (line 86), `selected-status-ledger.tsv`, `source-lock.tsv`, all `Designs/efsv2/*` dependencies, WCOS-R42 and
  WCOS-R65 (product-constitution lines 205, 238).
- The eleven files in `Designs/web-client-os/` match the README "Documents in this set" table.

**Defects**
- D1. `Designs/sdkv2/ethereum-standards-census.md` at commit `4d3e736` is cited by
  `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md:142`, `Designs/media-library/media-infrastructure.md:182`,
  `Designs/open-web-app-store/README.md:205`, `Designs/open-web-app-store/architecture.md:7`. No `Designs/sdkv2/`
  exists at HEAD; commit not reachable in this clone (F4). Whether it exists on GitHub: UNVERIFIABLE.
- D2. `owner-rulings.md` "Last touched 2026-08-12" and the efsv2 inbox "Last reconciled 2026-08-12" do not carry the
  2026-08-14 → 08-23 owner directions (F5).
- D3. `web-platform-standards-and-forward-profile.md` has no Safari/iOS/WebKit mention (F11/F12).
- D4. Type noun: `TypeSchema` (core candidate, efsv2 README) vs `TypeRevisionId` (layered doc, client set) (F10).

**Unverifiable from here (external facts the docs assert; the vault pins its own snapshots so they are at least
internally dated)**
- Vite 8 / Rolldown release (`technology-foundation.md` §Builder comparison).
- `<wa-page>` "moved from Pro to Core in Web Awesome 3.5.0" (§Explicit `<wa-page>` assessment).
- Google Modern Web Guidance tree `460e553` / package `0.0.184`, `DISABLE_TELEMETRY=1`, licence split.
- Temporal and Explicit Resource Management Stage 4 in May 2026 (ledger rows say so; pinned `tc39/proposals@600a427`).
- WASI 0.3.1 released; WebAssembly 3.0 completed September 2025.
- ECMA-429 "Minimum Common Web Platform API" existence/number.
- `EIP-7702` live since Pectra 2025-05-07 (asserted in `sdk-architecture.md`, historical).

## 11. Solid now / settle first / cut

**Solid enough to build on now**
- The exhaustive outcome laws `ResourceOutcome<T>` / `ByteOutcome` / `PlanOutcome` / `LocatorAttempt.outcome`
  (`type-data-abi-boundary-pressure.md` §Qualified outcome algebra) and the nine app-facing DTOs — arm-neutral,
  consistent with the constitution's honesty rule, and the only shared vocabulary the Web, agent and future native
  consumers have.
- Guest boot laws: no wallet import/probe/6963 event; EIP-1898/234 exact-basis reads; RPC miss ≠ absence
  (`ethereum-standards-and-interop.md` §MVP acceptance additions bullets 1, 4; `mvp-and-acceptance.md` §A).
- The EIP/ERC and Web census as *reference*: pinned, reproducible, status-correct.
- The standards-first application surface itself: semantic HTML, native CSS Grid/container queries/logical
  properties, ESM, hash routing, Custom Elements with plain-data APIs, Web App Manifest metadata, IndexedDB with
  versioned records, WebCrypto L1 (`technology-foundation.md` §Recommended foundation; `web-platform-…` "Durable
  baseline" rows).
- The role-separation schema `ActionAuthorityRoles` and the `defaultAccount`-is-preference rule (`ethereum-standards-
  and-interop.md` §Submission), which matches the constitution's role list.
- The SW/generation model's *negative* rules (no `skipWaiting`/`clients.claim`, SW never in guest or write
  correctness) — worth keeping as constraints even while the SW itself is deferred.

**Must be settled first**
- Frozen-for-experiment Type/Files inputs and the B0-vs-layered arm question (F1, F2) — the client MVP critical path
  is defined as this freeze.
- A one-sentence, owner-visible MVP wallet stack decision with its two-signature UX cost (F6).
- Who owns the EFS 2.0 SDK design (F3).
- The Guest Reader engine floor (F11).
- Reconciliation of directions 1–28 into the ruling ledger or an explicit statement that the client README is a
  second ruling location (F5).

**Cut for the MVP**
- Per-change guidance trace, five ledgers, `verify:web-evidence` CI (F7).
- ~30 of the ~39 required-forward rows (F8).
- MF2 runtime, pseudo-locale generators, multi-script/IME release fixtures, three-engine manual AT passes per
  release (F13).
- Base-image/VM retention, `BuildPlatformDescriptor`, dual air-gapped rebuilds per release (F14).
- Control-pack bakeoff, `<wa-page>` comparator, native-vs-Lit benchmark until the UI exceeds native controls.
- Wasm/WIT/Component/WASI, SES/LavaMoat, opaque-iframe lanes (already deferred by the horizons table; restated so the
  MVP acceptance list in `mvp-and-acceptance.md` §J stays "non-regression only").
- EIP-1186 proofs, ERC-1271/6492/7913/P-256/WebAuthn verifier fixtures, EIP-7702 fixture, agent-listing fixtures
  (`ethereum-standards-and-interop.md` §MVP acceptance additions bullets 5, 10–11, 18) — keep as later-slice fixtures.

## 12. Candidate findings

**F1 — WRONG, important, MVP-relevant, owner: web-client-os (neighbour efsv2).** The Type/Data ABI consumer
adapter claims arm-neutrality but is written in Architecture-C vocabulary. `type-data-abi-boundary-pressure.md`
§Authority and non-adoption boundary: "This packet uses symbolic profile and Type references so neither arm becomes a
de facto SDK ABI." Yet §Candidate adapter contract gives `FilesConsumerAdapterDescriptor` the fields
`requiredExactTypeQueries[] { queryProfileRef ... }` and `acceptedViewProjections[] { viewRevisionRef,
viewBindingCommitmentRef, bindingPlacement }`, and §Disposable evolution fixture step 1 says "Version 2 receives a new
`LogicalShapeId`, `RepresentationId` and `TypeRevisionId` ... otherwise ... a new `SemanticSpecId` is mandatory", step
7 "If an exact-Type index is needed for v2, it receives a new QueryProfile". Under the B0/Variant-A control
(`core-architecture-candidate.md` §Type Schema: Variant A "hashes semantic meaning, shape, validation, reference
roles, and canonical index obligations into one `TypeSchemaId`"; `layered-type-system-and-data-abi.md` §A: "an index
or representation improvement changes the Type and all subsequent Record IDs") none of those identifiers exist
separately and an index change is a new Type. `README.md` direction 12 and `mvp-and-acceptance.md` line 912 say "no
choice is inferred". The app-facing DTOs and outcome law are neutral; the descriptor and TDAB-E1/Q1 are not. Fix:
give the descriptor a B0 arm (single `typeSchemaRef`, no `queryProfileRef`) and write E1 twice, or state that the
packet only pressures Architecture C.

**F2 — UNDECIDED, blocking, MVP-relevant, owner: efsv2.** The client MVP critical path is gated on inputs efsv2 has
not scheduled. `Designs/web-client-os/README.md` §Current work sequence step 3: "MVP critical path: freeze only the
symbolic inputs in [[type-data-abi-boundary-pressure]], then ... convert its guest read and official ... write
journeys into one disposable exact-Type fixture against the current Core/Files candidates." `type-data-abi-boundary-
pressure.md` §Future disposable experiment gate requires "a frozen-for-the-experiment B0 control and layered candidate
descriptor/body vector closure from the Type lane" and "two independently implemented exact codec/validator results".
`Open-Decisions.md` (2026-08-21): V2-E4, V2-E8, V2-F1 "Waiting on evidence"; Stage B has not run (brief). No efsv2 doc
names "frozen-for-experiment" inputs as a deliverable (the layered doc's T1 produces vectors but not a freeze). The
client cannot start its first fixture until efsv2 does this; nobody owns it.

**F3 — MISSING, important, MVP-relevant, owner: sdk (neighbours web-client-os, efsv2).** No EFS 2.0 SDK design
exists, yet the client set assigns it the load-bearing work. `ethereum-standards-and-interop.md` §Architectural
placement: "The future Protocol SDK owns canonical Ethereum encodings, low-level RPC and contract calls, runtime
validation, signature primitives, and raw evidence"; §SDK and EFS v2 pressure packet table puts "Protocol SDK" or
"SDK" as lowest owner on all seven rows; §Research queue 1 "SDK conformance fixture". `type-data-abi-boundary-
pressure.md` §Generated protocol/codegen surface: "The Protocol SDK and generator need exact, raw-preserving bindings".
`architecture-and-modules.md` §Product and repository boundaries has a "Protocol SDK" row. `Designs/README.md`
§Review banner: "The pre-v2 SDK corpus ... not EFS 2.0 inputs by default"; every `Designs/sdk-*.md` is v1/EAS
(2026-06-20). `Designs/sdkv2/` does not exist. The brief confirms no EFS 2.0 code in any repo.

**F4 — DEFECT, minor, owner: vault-process (neighbours sdk, open-web-app-store, media-library).** Four current
files link `https://github.com/efs-project/planning/blob/4d3e736…/Designs/sdkv2/ethereum-standards-census.md`
(`Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md:142`, `Designs/media-library/media-infrastructure.md:182`,
`Designs/open-web-app-store/README.md:205`, `Designs/open-web-app-store/architecture.md:7`). The path is absent at HEAD
and `git cat-file -t 4d3e736` fails in this clone. UNVERIFIABLE whether the commit exists upstream; either way the
vault's own copy of a load-bearing census is missing or the links are dead.

**F5 — DRIFT, important, MVP-relevant, owner: vault-process (neighbours efsv2, owner).** Owner directions 1–28
(2026-08-14 → 08-23) exist only in `Designs/web-client-os/README.md` §Direct owner direction. `Designs/efsv2/owner-
rulings.md` (append-only ledger, "Last touched 2026-08-12") does not carry them and its last entry says "Open, not
ruled: whether every author-facing API uses `PrincipalId`", while direction 7 says "The client uses one uniform
`PrincipalId` surface". `owner-decision-inbox.md` V2-E1 remains "Decide after evidence"; its §Recording rule step 1
says owner answers go to `owner-rulings.md`. The README's own "Upstream synchronization note (2026-08-14)" admits the
gap and delegates to "The EFS v2 PM"; 19 days later nothing moved. Same for directions 8 (64-Principal Lens), 9 (NFC
names), 14 (Signals). Either the ledger is stale or the README is a second ruling location — the vault's process
says it cannot be.

**F6 — UNDECIDED, important, MVP-relevant, owner: web-client-os (neighbours sdk, owner).** The MVP wallet stack is
decided in substance but never stated or costed. `README.md` header: "no ... wallet stack ... is authorized";
WCOS-R14 says "connect a supported wallet" without defining supported. `mvp-and-acceptance.md` §Required write
behavior: "sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent` separately because every
Files operation selects Binding leaves"; §Deliberately deferred: "ERC-1271 claims until a fixed smart-account fixture
passes; an EOA-only adapter must report `ERC1271_UNSUPPORTED`"; §C: EIP-6963 → EIP-1193, EIP-5792 with sequential
fallback. `ethereum-standards-and-interop.md`: EIP-7702 "disabled by default", ERC-4337 "design for", no sponsorship/
relayer/paymaster path anywhere. So the first official product is an injected-EOA, two-signatures-per-operation,
self-funded-gas path — a step back from the v1 measured "2–3 popups" problem (`sdk-write-ux.md` §"The constraint";
`sdk-minimal-clicks.md`) and the v1 buildathon's faucet/burner workarounds (`Decisions.md` 2026-06-23). Nobody has
written that sentence or asked the owner whether it is acceptable.

**F7 — DIRECTION, important, MVP-relevant, owner: web-client-os (owner sign-off needed).** The modern-Web guidance
gate is over-scoped for a first build. Direction 24 is one sentence ("must use the pinned modern-Web guidance and
standards-evidence gate"). `technology-foundation.md` §Required contribution trace expands it to six steps per change
by "the author and an independent reviewer"; §Reproducible repository boundary requires a guidance lock, a
standards-evidence lock/closure, a ~14-field feature-policy ledger, a browser-profile ledger, evidence receipts and a
`verify:web-evidence` gate that "rejects incomplete matrices, expired experimental reviews and missing result/build
digests". `README.md` §Current work sequence step 2 makes this a precondition "Before any authorized Web experiment
or implementation"; `type-data-abi-boundary-pressure.md` §Future disposable experiment gate requires the closure
"before any UI or generated document is created" even for an offline Type fixture. The census is done and
reproducible; the ledger/gate should follow the first profile release, not precede the first line of code.

**F8 — CUT, important, MVP-relevant, owner: web-client-os.** The required-forward surface is far wider than the MVP.
`web-platform-standards-and-forward-profile.md` carries ~39 "required"-class rows (Navigation API/URLPattern, Popover/
invokers/`CloseWatcher`, import-map integrity, container queries, cascade layers/`@scope`/nesting, Color 4/5,
Text 3/4, containment, Temporal, Explicit Resource Management, Transferable Streams, `scheduler.postTask`, Web
Locks, OPFS, Storage Buckets, StorageManager, Manifest, Service Worker, CSP L3, Trusted Types, SRI 2, Permissions
Policy, COOP/COEP, WebCrypto L2, WebAuthn, GPC, Pointer Events 3, Input Events 2, MF2, WebTransport …). §Disposition
language obliges each with "a named reduced/unsupported/rescue outcome" and §Acceptance program 2 with an independent
kill-matrix run. A guest read plus three writes needs roughly eight of them. The rest should be relabelled
"post-MVP forward" so the acceptance program does not scale with the census.

**F9 — DIRECTION, minor, owner: owner (neighbour web-client-os).** A Stage 1 proposal is the selected state
primitive. `README.md` direction 14 and `technology-foundation.md` §Signals: "load one exact audited polyfill ... a
second EFS-specific observable/store abstraction is not [allowed]". The ledger pins Signals at "Stage 1"
(`selected-status-ledger.tsv`); `web-platform-…` law 1: "Standards maturity is not product value". If the proposal
stalls, the polyfill becomes a permanent EFS-maintained state framework — exactly what direction 13 says a 2026
library must not be. The docs bound the blast radius ("Signals never cross a durable or authority boundary";
proposal-revision adapter allowed), so severity is minor, but the owner should know the bet is on a Stage 1 API.

**F10 — WRONG, minor, owner: efsv2 (neighbour web-client-os).** Two current efsv2 docs name the exact-Type noun
differently and the client inherited the replaced one. `core-architecture-candidate.md` §Type Schema (2026-08-12):
"Working replacement for the confusing name `TypeRevision`" → `TypeSchema`; `efsv2/README.md`: "`TypeSchema` is the
current plain-language name"; `system-constitution.md` §What is deliberately not frozen: "the name `TypeRevision`".
`layered-type-system-and-data-abi.md` (2026-08-14) uses `TypeRevisionId` throughout; `type-data-abi-boundary-
pressure.md` defines `EfsTypeRevision`, `exactTypeRevisionRef`; `mvp-and-acceptance.md` §I "exact Type revisions".

**F11 — UNDECIDED, important, MVP-relevant, owner: web-client-os (owner input).** No document names which engines
must pass the Guest Reader profile fully. `README.md` direction 15: "A current lag in one browser—especially
iOS/Safari—does not veto the architecture; unsupported engines receive an explicit reduced/unsupported outcome or
rescue path". `technology-foundation.md` line 594: a profile "is allowed to reject an inadequate engine with
`UNSUPPORTED_WEB_PROFILE` and a link to the basic/rescue reader". WCOS-R42 lists Chromium, Firefox, WebKit
automation, real desktop Safari, real iOS Safari, Android as *measured* profiles but sets no pass floor.
`web-platform-standards-and-forward-profile.md` never mentions Safari/iOS/WebKit and lists "exact first
`EfsWebProfileV0` feature and engine/AT matrix" as open. Product success measure 1 ("A stranger can open an exact
public folder") is unmeasurable until someone says whether iPhone Safari gets the full Guest Reader or the rescue
page.

**F12 — MISSING, minor, owner: web-client-os.** The only engine-specific hazard the vault has measured is not bound
into the runtime docs. `Reviews/2026-08-13-claude-evidence-round/README.md` §Browser-runner evidence: "a three-second
busy loop in the opaque child froze Safari's host page for the same period"; "about 22 animation frames per second
while its host ran 60" (Safari 26.5.2, n=1). `web-platform-standards-and-forward-profile.md` §Named product profiles
"Opaque Full-Web App" lists "direct egress/renderer DoS remain named residuals" with no citation; `app-runtime-and-
direct-launch.md` mentions Safari only for egress tests (lines 935, 1109). Direction 15's "lag is not a veto" covers
feature lag, not an isolation failure; the docs should say which class this is. Not MVP-relevant (iframes deferred).

**F13 — CUT, important, MVP-relevant, owner: web-client-os.** The i18n/a11y *release floor* exceeds "foundations
from the first slice" (direction 17). `technology-foundation.md` §Locale and message contract: "Freeze a tested EFS
function subset [of MessageFormat 2] and interpret/compile it with pinned client-owned code"; immutable language-pack
manifests with translator provenance; §Accessibility release floor: "manual desktop and mobile screen-reader/keyboard/
switch/zoom passes across current Chromium, Gecko and WebKit"; "Real release fixtures include Arabic/Hebrew,
Japanese/Chinese/Korean IMEs, an Indic script, Thai, Turkish casing, German expansion". Foundations for the MVP are
`lang`/`dir`, logical CSS, message IDs, NFC/bidi isolation, `Intl` for display and one `en` pack; the MF2 runtime and
multi-script release matrix are post-MVP.

**F14 — CUT, important, owner: web-client-os.** Per-release 50-year retention is ceremony, not the direction.
`technology-foundation.md` §Greenfield build and release posture: every release retains "either an immutable complete
base image/VM/rootfs including every base layer or a reproducible source/bootstrap path", a `BuildPlatformDescriptor`,
and "Two clean network-disabled rebuilds from only the retained closure must succeed ... at least one begins from that
retained environment on a fresh compatible host"; §Required experiments 8 "Cold reconstruction fixture". §Decision
frame already says fifty years "is a dependency and interface strategy, not a promise that an unchanged 2026 binary or
toolchain will run everywhere in 2076". MVP: lockfile + retained dependency archives + one reproducible CI rebuild.

**F18 — WRONG, minor, MVP-relevant, owner: web-client-os (neighbour efsv2).** Two labels for one write state.
`ethereum-standards-and-interop.md` §Typed actions: "If the current Core/adapter profile cannot name that consumer and
prove the rule, the write profile is `UNSUPPORTED`; EIP-712 does not fill the gap." `hierarchical-files-and-folders.md`
§8.2: B0 `AdmissionIntent/1` "is bearer authorization to Core. It does not name an executor or commit to the complete
routed operation ... No `/1` operation may be reported as `FILES_PRECONDITION_CERTIFIED`." `product-constitution-and-
roadmap.md` Slice B and `type-data-abi-boundary-pressure.md` §Core pressure packet 2 label that state
`EXPERIMENTAL_DIRECT_CORE`, `protocolConformance=false`, `filesPreconditionCertified=false` and let planning return
`PLAN_READY`. Neither doc says whether Core's nonce consumption satisfies the "authoritative consumer + ordered effect
commitment" rule for the *Files* effect. One sentence would reconcile them; without it the MVP write lane is
simultaneously permitted and `UNSUPPORTED`.

**F20 — MISSING, minor, owner: web-client-os (neighbour efsv2).** Route chain identity has no pinned pass.
`ethereum-standards-and-interop.md` §Cross-chain identity: "EFS needs a separate pinned CAIP/chain-identity pass before
freezing public chain/Realm serialization. Friendly labels such as `sepolia` remain replaceable route-table inputs";
§Research queue 8 lists CAIP/ENSIP/WalletConnect pins as future work. `mvp-and-acceptance.md` §Cold-browser guest
journey uses `https://efs.eth.limo/#/sepolia/myfolder/file.jpg`. Acceptable for an MVP with one route-table entry;
must not be frozen as the public link grammar.

**F21 — DIRECTION, minor, owner: web-client-os.** The control-pack and renderer bakeoffs are presented as
independent but are coupled. `technology-foundation.md` §Where Lit earns a place gates Lit on the Minimal Viewer
benchmark; §Current control-pack comparison describes Web Awesome Core as an "Active MIT Lit-based project" and the
default; §Critical-path keeps Web Awesome outside the guest closure but inside the write path. Selecting Web Awesome
therefore ships Lit in the write/OS path whatever the viewer benchmark says. Say so, or run the control-pack bakeoff
first.
