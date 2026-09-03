# R17 — SDK and OS-drives / mounts lane map

**Lane:** R17-sdk-and-mounts · **Reviewer:** Claude Fable 5.1 · **Date:** 2026-09-02
**Scope:** root `Designs/sdk-*.md` and companions, `Designs/clientv2/sdk-boundaries.md`, `Designs/efsv2/mountable-filesystem-semantics.md`, `Designs/web-client-os/README.md`, `Onboarding/repo-map.md`, `Designs/README.md`, plus the neighbours and sibling repos needed to answer the six lane questions.
**Vault state read:** the planning vault on `main` (shallow clone, 50 commits, oldest 2026-08-13 `c48f252`, HEAD `234c3e6`). GitHub `efs-project/planning` `main` head `8ae846a`; non-main branches `codex/sdkv2-pm` (`57d04f8`, 2026-08-25), `codex/data-explorer-pm` (`8d90ecb`, 2026-08-25), `codex/v2-readiness-week` (`2573f08`, 2026-08-25), `lab/2026-08-26-fable-consumer-tournament` (`70d78a5`).

---

## 0. Headline

On `main` there is **no EFS 2.0 SDK design**. Every root `Designs/sdk-*.md` file is a June 2026 v1/EAS-era design (Status `review`, no historical banner in the file itself), `clientv2/sdk-boundaries.md` is July native-envelope evidence held historical by `clientv2/README.md`, and the current spines (`web-client-os/*`, `efsv2/hierarchical-files-and-folders.md`) name a "Protocol SDK" / "SDK result-model lane" that nobody on `main` owns or specifies. The actual EFS 2.0 SDK design set — `Designs/sdkv2/` (11 files: PM charter, hybrid architecture candidate, developer journeys, experiment program, an Ethereum-standards census, an owner-rulings file recording a 2026-08-22 founder mandate, and a 2026-08-25 `EXP-C0` MVP packet) — exists **only on branch `codex/sdkv2-pm`**; four `main` documents cite it by commit URL as "dated evidence", and `Designs/README.md` on `main` has no row for it. OS Drives / native mounts have an **adopted owner requirement** (three-host read-only mount, 2026-07-22) and a July semantics doc that current Files work correctly preserves, but **no design folder, Kanban card, inbox, Glossary term, or authority-roster entry**; the only concrete artifact is an unrouted Rust `../drive/` implementation plan in `docs/superpowers/plans/`. The SDK/mount surface is coherent at the level of *stated outcomes* and badly disconnected at the level of *who owns the seam the Web Client MVP will call*. Sibling code is entirely v1/EAS and is reusable only as patterns.

---

## 1. Documents read — summary, standing, defined terms

Standing legend: **current** (active spine input) · **historical** (evidence only; README/banner says so) · **superseded** (own banner says so) · **evidence-only** · **reference**.

| # | Document | Own status line | Folder README standing | My standing call |
|---|---|---|---|---|
| 1 | `Designs/README.md` | — (content map) | — | reference |
| 2 | `Designs/sdk-architecture.md` | `**Status:** review` (Last touched 2026-06-20) | Review: "Historical SDK API surface. Identity substrate superseded by EFS 2.0." | historical (no banner in file) |
| 3 | `Designs/sdk-read-surface.md` | review (2026-06-19) | Review: "Read API shape." | historical (no marker anywhere) |
| 4 | `Designs/sdk-write-ux.md` | review (2026-06-20) | "Historical v1 write-UX evidence; its old ER2 is superseded." | historical |
| 5 | `Designs/sdk-wallet-architecture.md` | review (2026-06-20) | "Historical v1 wallet/account evidence…" | historical |
| 6 | `Designs/sdk-review-backlog.md` | review (2026-06-20) | "Reconciled build backlog for the SDK." | historical (no marker) |
| 7 | `Designs/sdk-vs-client-responsibilities.md` | review (2026-06-20) | "Boundary between SDK and client." | historical (no marker) |
| 8 | `Designs/sdk-minimal-clicks.md` | review (2026-06-18) | "V1 batched single-signature writes (shipped evidence)…" | historical |
| 9 | `Designs/sdk-one-signature-writes.md` | superseded (banner: by sdk-write-ux) | Superseded | superseded (by another v1 doc) |
| 10 | `Designs/sdk-v1-bridge-v2-compat-asks.md` | review (2026-08-07) | **not in content map** | **reads as live v2 input** — see F3 |
| 11 | `Designs/web3-bytesstore-sdk-followup.md` | handoff (2026-06-20) | Superseded/handed off | historical |
| 12 | `Designs/write-ux-options-ranked.md` | review (2026-06-22) | listed under Superseded | historical; status/map mismatch (F5) |
| 13 | `Designs/efs-account-system.md` | review (2026-06-23) | "Historical one-smart-account identity proposal…" | historical |
| 14 | `Designs/mirror-scheme-policy.md` | review (2026-06-19) | Review (contracts) | historical v1 contracts policy |
| 15 | `Designs/web3-standards-compliance.md` | review (2026-06-19) | Review (contracts) | historical v1 contracts policy |
| 16 | `Designs/cross-repo-reference-mirror.md` | draft, `#blocked-on/concrete-CI-need` | Deferred/blocked | reference |
| 17 | `Designs/clientv2/sdk-boundaries.md` | draft (2026-07-22) | clientv2/README banner 2026-08-12: evidence | historical |
| 18 | `Onboarding/repo-map.md` | — | — | reference, **stale** (F10) |
| 19 | `Designs/web-client-os/README.md` | draft set (2026-08-26) | Draft (active spine) | current |
| 20 | `Designs/efsv2/mountable-filesystem-semantics.md` | draft (2026-07-22) | efsv2/README evidence map: "Adopted three-host read-only outcome and projection acceptance gates" | adopted outcome + superseded mechanism prose (F7) |

### 1.1 Per-document paragraphs and exact terms

**Designs/README.md** — Folder quick-start plus the hand-curated content map. `§Content map → Review` opens with a banner: "The pre-v2 SDK corpus… their EAS UID identity, wallet/Lens defaults, and write graph are not EFS 2.0 inputs by default. There is no live R1 owner choice." Rows list 10 SDK/contracts docs under Review and 3 under Superseded. Terms: status vocabulary, `DESIGN-NNNN`, tri-sync invariant ("Updated in the same commit as design status changes"). The `[[design-system]]` link resolves via the `aliases:` frontmatter of `Designs/0001-design-system.md`. **Missing row:** `sdk-v1-bridge-v2-compat-asks` (grep of `Designs/README.md` returns nothing).

**sdk-architecture.md** (155 KB, 1,450 lines) — The June v1 SDK master design: two deliverables (`@efs/sdk` TypeScript, `@efs/solidity` compile-in library), MUST/NICE/DEFERRED tables M1–M16/N1–N10/D1–D7 (§Requirements), an "Implemented vs Designed" manifest dated 2026-06-20 against `chore/scaffold`, resource namespaces `efs.fs/graph/props/lists/sorts/lenses/batch()/eas/raw/decode`, the eight-verb naming contract, `efs.batch()` mechanism selection (`WriteMechanism` = `'sequential' | 'eip5792' | 'erc4337' | 'gateway'`, `BatchReceipt`, `OperationResult`, opt-in `EFSUploadGateway`), the Solidity `EFSLib`/`EFSWriter`/`EFSReader` surface, "Identity, lenses & the signer model (decided 2026-06-10)" (lens = ADR-0039 hierarchy `connectedAddress → viewedAddress → webOfTrust[] → systemLenses[]`, `MAX_LENSES = 20`, `DataRef` vs `PathRef`/`AnchorRef`), Open Questions Q1–Q6 all RESOLVED, and a ten-entry revision log. Its banner is a 2026-06-19 contracts-side note ("EFS is live on Sepolia … 9 schemas frozen … 10 contracts"), not a historical banner; the doc closes `§Open Questions` with "One call left for James: promote vs. revise." Internal stale facts: `§efs.batch()` "Design note on content hashing" still says contentHash is "a bare SHA-256 digest… SDK ADR-0006", superseded by SDK ADR-0016 multibase-multihash (`sdk` repo `packages/sdk/src/content/hash.ts` header; `sdk-v1-bridge-v2-compat-asks.md` ask 3).

**sdk-read-surface.md** — Value-first read verbs `read/readText/readBytes/readJson/locate/info/getProperties/exists/list`, `EfsFile`, `FileInfo` with non-projectable provenance (`resolvedBy`, `verified: VerificationStatus` = matches-author | no-claim | malformed-claim | mismatch | revoked | unchecked), `ReadOpts{lens, fields, expand, verify}`, `ExpandToken` (depth 2), `EfsList.byPage/.toArray({limit})`, error matrix (`NotFound`, `Revoked`, `ContentHashMismatch`, `MalformedClaim`), viem multicall batching, proposed view additions `getFileInfo(anchor, lenses)` / `getProperties(dataUID, names[], attester)`. Marked authoritative over sdk-architecture for reads. Says "SDK fetch path must use lens-scoped `getDataMirrorsByAttester`", which sdk-architecture's 2026-06-20 revision entry contradicts ("there is no `getDataMirrorsByAttester`"). The *value-first + fail-closed verify + provenance-not-projectable* posture is the one idea here that survives into v2 vocabulary (`Resolved<T>`, `ResultV0`).

**sdk-write-ux.md** — "AA-native" v1 write UX: the EAS UID embeds `block.timestamp` so a ~13-attestation dependent DAG cannot be one static batch; one-signature requires an in-account routine (EIP-7702 impl / ERC-7579 executor module over `EFSLib.writeFile`), per-write EIP-712 `FileWrite` auth, security invariants, Tier-1 `submitWriteTier1` universal fallback. Entirely EAS-attester-bound.

**sdk-wallet-architecture.md** — Capability-based submitter architecture: `AccountProfile`, public `AccountCapabilities{kind, canOneSig, gasless, sponsored}`, `Submitter`/`AccountAdapter` seams, `Tier1Submitter`/`Eip5792Submitter`/`InAccountSubmitter`, sponsorship modes (delegated relayer via `multiAttestByDelegation`, ERC-7677 paymaster), `efs.account.{capabilities, foreignDelegation, revokeDelegation}`. Security section: "`EFSLib.writeFile` has NO authentication … never a user-EOA delegate target." EAS-bound.

**sdk-review-backlog.md** — P1/P2/P3 items from the 2026-06-19 comprehensive review; most P2 struck through as done on `chore/scaffold` (edge writes, escape hatches, lists, Solidity lib, REDIRECT); `batch()` "type-present, behavior-absent". Pure v1 build ledger.

**sdk-vs-client-responsibilities.md** — Ownership matrix: SDK never holds keys/servers/DOM/policy; client owns wallet, render sandbox (ADR-0056 launch-blocker), off-chain pinning, sponsorship infra; SDK provides seams (`createEfsClient({sponsorship:{mode, endpoint}})`). Vocabulary is EAS (delegated attestation, 7702 tuple). `clientv2/sdk-boundaries.md` §"The ownership matrix, re-cut for v2" explicitly lists which rows "die".

**sdk-minimal-clicks.md** — The click-count investigation: DAG L1 DATA → L2 file-ANCHOR/MIRROR/key-ANCHOR/PROPERTY → L3 placement-PIN/binding-PIN → visibility-TAG; Tier 1 = one `multiAttest` per layer (2–3 signatures, shipped in contracts PR #36); Tier 2 = user-context `EFSWriter` routine (one signature, "greenlit 2026-06-18", never built). The Designs/README row calls it "batched single-signature writes (shipped evidence)"; the shipped tier is 2–3 signatures.

**sdk-one-signature-writes.md** — Superseded banner (2026-06-20, by sdk-write-ux). Records why the first `EFSWriterDelegate` draft was wrong (wallets only delegate to their own delegator; a bare-auth delegate is an exploit). Terms: `EFSWriterDelegate` (cancelled), `eip5792` stage via `sendCalls({atomicRequired:true})`.

**sdk-v1-bridge-v2-compat-asks.md** — Status review, 2026-08-07, `#repo/planning #repo/sdk`. "ASKS on the v2 design": (1) commit a deterministic v1→v2 identity mapping ("EAS→EFS preservation-wrapper… specialized to the nine Sepolia v1 schema UIDs"), (2) ratify v1 reserved-key strings verbatim, (3) admit `f1220` sha2-256 contentHash, (4) freeze the identity-word taxonomy so a v1 `Address` embeds losslessly, (5) keep all v2 logical IDs `bytes32`, (6) extend the v1 flat-lens import rule, (7) pin the kernel read-ABI selector set, (8) seed v2 freshness vocabulary from the SDK's `TrustDescriptor`, (9) keep the envelope stock-wallet-signable, (10) name venue/realm vocabulary. Terms: `profile: 'efs/v1'`, `createEfsV1Client`, SDK ADR-0019. Depends on `[[Decisions]] 2026-08-07 (v1-bridge ruling)` — which `Decisions.md` line 23 (2026-08-08) reversed the next day.

**web3-bytesstore-sdk-followup.md** — Contracts→SDK handoff for the ERC-5219 `EFSBytesStore` (constructor `(address[] chunks, string contentType_)`, creation bytecode sha256 `a7093cc6…4b6d`, selectors, EIP-7617 `web3-next-chunk` pagination, keep the direct chunk reader in `src/mirror/web3.ts`). Precise, v1-only.

**write-ux-options-ranked.md** — Six-lane ranked map of every click/latency option (Tier 0 shipped in PR #36; Tier 1a 7702+5792 routine; Tier 2 OP-Stack L2; Tier 3 CREATE2 chunk factory; Tier 4 off-chain attestations; Tier 5 content-addressed DATA "reopens ADR-0049"; Tier 6 rejected). Terms: two-axis frame (clicks vs latency vs gas), attester invariant. Links `[[Decisions-debug-ui-minimal-clicks]]` (resolves to the vault-root file).

**efs-account-system.md** — "user = ONE smart-account address" (B′ model), session keys as "the burner", passkey Route A/B, onboarding invariants, group identity via `canWrite(addr)`. Explicitly contradicted by current direction 7/8 (`PrincipalId` with multiple controller keys, keys not consuming Lens positions — `web-client-os/README.md` lines 61–71) and by efsv2 V2-E1 (uniform-Principal experiment open).

**mirror-scheme-policy.md** — Remove the `_isAllowedScheme` gate in `MirrorResolver.onAttest` (ADR-0056 supersedes ADR-0023); keep `/transports/*` ancestry + `MAX_URI_LENGTH`; normative client render-isolation requirement. Contracts v1; proxy-impl upgrade path.

**web3-standards-compliance.md** — Make the on-chain byte store standards-compliant (`resolveMode() → "5219"`, `request()`); `EFSRouter` already standard. Contracts v1.

**cross-repo-reference-mirror.md** — A `planning/Reference/` read-only ADR mirror via GitHub Actions; blocked since 2026-05-21 because `/efs/` colocation removed the need. Reference only; root `README.md` line 60 still says "A `Reference/` folder is planned but not built".

**clientv2/sdk-boundaries.md** — July "two-SDK doctrine": `@efs/sdk` (pure protocol: record building for five kinds, `@efs/sdk/ids`, envelope assembly, RR1–RR12 resolver, honesty-string catalog, pending-state ladder, submission seams) vs `@efs/os-sdk` (Ring-3 veneer: `efs.read/outbox/pick/surface/storage/locale/actions/meta/crypto`), private Kernel/Shell, dual-target `EfsHost`, `@efs/dev`, one IDL → four artifacts, wire-major versioning, conformance C1–C3 in `@efs/conformance`. Depends on `[[web-os-thesis]]`, `[[read-lens-spec]]`, `[[codex-envelope]]`, `[[codex-kinds]]`, `[[deterministic-ids]]` — all superseded July mechanisms per `efsv2/README.md` §Evidence map. `clientv2/README.md` banner (2026-08-12): "this set is evidence, not one automatically adopted client architecture." `web-client-os/README.md` §Historical Client/OS audit row "`os/` repository and historical SDK split — **Retire as assumed topology**".

**Onboarding/repo-map.md** — Sibling repo layout and "What's authoritative where". Says "Client v2 lives in `planning/Designs/clientv2/`" and lists `planning/Designs/clientv2/` as the authority for "Current Client v2 architecture and open choices" — stale since 2026-08-12. Describes `sdk/` as "unmerged pre-v2 SDK implementation; legacy input" (correct). No mention of the proposed `core`/`os`/`drive` repos or the SDK `chore/scaffold` branch.

**web-client-os/README.md** — Active product spine (last touched 2026-08-26). Reviewers line 7 includes "@os-drives-pm boundary review (2026-08-14)". Direct owner directions 1–28 (line 41 ff.): 2 (MVP = write-capable File Browser), 7 (uniform `PrincipalId`, separate signer descriptor), 8 (64-Principal Lens), 9 (rich Unicode/NFC names, reversible host aliases), 11 ("rename legacy repos to `*-v1` and reclaim `contracts`, `sdk`, `webclient`, and `drive` for active v2. No rename or repository creation is authorized"), 27 (EIP/ERC at "replaceable client, SDK, wallet…" boundaries). Mermaid (lines 177–200): Reader Kernel = "Realm reader, Files resolver, artifact verifier"; write slice = "identity, wallet, planner, signer, submitter" with "canonical read-back + receipt". §Ownership boundaries (line 406–414): "Native mounts | Consumption of shared resolver results only… | OS Drives owns native handles, host aliases, projection behavior, errors, metadata projection, daemons, packaging, and three-host validation". §Explicit non-authorizations (line 498): no "`webclient`, `os`, `sdk`, `core`, or `drive` repository". §Open questions (lines 521–546) end "No item currently needs an owner ruling."

**efsv2/mountable-filesystem-semantics.md** — Owner requirement box (line 13): "EFS v2 must expose a useful read-only mounted filesystem on Linux, macOS, and Windows. Linux FUSE is one adapter…". Primary validation target (line 23). Conceptual `EfsMountDescriptor{root, lens, evidenceSources, byteSources, basis: 'PINNED'|'FOLLOW'|…, completenessPolicy: 'REQUIRE_PROVEN'|'ALLOW_GRADED', writeActor?, journal?, publishPolicy?, cachePolicy}` (lines 73–84, "conceptual, not an API proposal"). §2 mapping table (lines 119–133) uses July terms: "Directory | TAGDEF structural namespace node", "Extended metadata | namespaced VAL/TAG edges", "Union/overlay | `PRIORITY_FIRST_PRESENT` … WHITEOUT". §3.3 "Path-derived TAGDEF identity makes directory rename special" with `movedTo`. §3.5 `LookupResult = PRESENT | ABSENT_PROVEN | UNKNOWN` (line 238–242), strict vs snapshot mount. §4 platform-neutral contract (lines 303–314), candidate adapters libfuse3 / macFUSE-FSKit / WinFsp (lines 319–324), operation mapping table. §5 `user.efs.*` xattr projection, `~efs` control entry. §7 `efsd` core sketch. §10 Durable-not-Etched profile items 1–15 (lines 522–541). §11 Phase 0–4 with Phase 2 = required milestone and acceptance criteria (584–609). §12 falsification tests 1–17 (+18–24 writable). §Open questions (670–700) all unchecked. Depends on `[[fs-pass-synthesis]]`, `[[codex-kinds]]`, `[[read-lens-spec]]`, `[[assumptions-and-requirements]]`, `../clientv2/persistence-and-sync.md`.

### 1.2 Neighbour documents consulted (cited, not fully mapped)

`Designs/efsv2/README.md` (evidence map rows 102–103; Build order step 5 "prepare the freeze bundle and contracts/SDK plan"; Hard holds), `Designs/efsv2/owner-rulings.md` (§2026-07-22 lines 104–120, 136), `Designs/efsv2/owner-decision-inbox.md` (V2-E6 line 54; V2-F2 lines 89–91; P-16 lines 171–174; N5 267–270), `Designs/efsv2/system-constitution.md` line 316, `Designs/efsv2/hierarchical-files-and-folders.md` (lines 4–9, 34–36, 58–61, 118–124, 494–550, 565–593, 695–697, 2171–2190, 2263–2279), `Designs/web-client-os/architecture-and-modules.md` (lines 142–160, 1144–1201), `Designs/web-client-os/mvp-and-acceptance.md` (275–277, 285–288, 821–836, 853, 868–872, 895–901), `Designs/web-client-os/ethereum-standards-and-interop.md` (112–118, 539–575, 582–597), `Designs/web-client-os/product-constitution-and-roadmap.md` line 246, `Designs/owner-decision-inbox.md` (18–48), `Designs/clientv2/README.md`, `Decisions.md` lines 23–25, 35, `Kanban.md`, `Open-Decisions.md`, `Glossary.md`, `Onboarding/authority.md`, `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md` line 67, `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` lines 141–149, `docs/superpowers/plans/2026-08-14-efs2-{core-files-foundation,files-sdk-web,files-readonly-mounts}.md`, and (via GitHub API, branch-only) `Designs/sdkv2/{README,owner-rulings,owner-decision-inbox,sdk-pm-charter,architecture-candidate,developer-journeys,exp-c0-mvp-packet}.md`.

---

## 2. Lane question 1 — Is there a current EFS 2.0 SDK design? What must an MVP SDK provide?

### 2.1 What exists

- **On `main`: nothing current.** The root `Designs/sdk-*.md` corpus is v1 (`Designs/README.md` §Review banner: "not EFS 2.0 inputs by default"). `clientv2/sdk-boundaries.md` is July evidence (`clientv2/README.md` banner). `Designs/owner-decision-inbox.md` lines 18–21: "R1–R4 and ER1–ER2 below are v1 packet history, not live choices… Do not revive v1 SDK… as a successor dependency."
- **On branch `codex/sdkv2-pm` (not merged):** `Designs/sdkv2/` with `README.md` ("EFS v2 SDKs — current design spine… founder-authorized SDK experience and experiment program"), `sdk-pm-charter.md`, `architecture-candidate.md` (arms A/B/C; recommends arm C "raw runtime plus exact façades"; §Logical module boundaries: model, codec, type compiler, validation, client/reconstruct, consumer adapter/codegen, actions, transport adapters, ethereum adapter, signature verification, account authorization/submission, deployment tooling, Solidity source set, testkit), `developer-journeys.md` (journey map; §3 `ReadContext`; §4 `construct -> validate -> plan -> simulate -> clear-sign -> authorize -> submit -> receipt/finality -> canonical read-back`), `experiment-program.md`, `ethereum-standards-census.md`, `web-client-os-boundary-pressure.md`, `research-precedents.md`, `owner-rulings.md` (two rulings dated 2026-08-22: SDK PM mandate with `Designs/sdkv2/` as source spine; 100-year preservation correction), `owner-decision-inbox.md` (SDK-E1…E6, SDK-F1/F2, settled SDK-S1/S2, superseded SDK-P1 "current `sdk/` packages as the v2 baseline… do not define EFS v2", SDK-P2), and — added 2026-08-25 — `exp-c0-mvp-packet.md` ("turn the sealed `EXP-C0` semantic result law into the smallest buildable, disposable SDK slice"; `ResultV0` outer contract; operation families `readExact / readPage / readBytes / plan / verifyPlanSignature / authorizeAndSubmit / recoverEffect / reconstruct`).
- The branch's own `README.md` §Current phase says: "This pass does not claim a Kanban card… The next gate is owner review of the recommended experimental arm." `Designs/README.md` at commit `4d3e736` had an `sdkv2/` row; `Designs/README.md` on `main` does not.

### 2.2 What an MVP SDK must provide, and where each piece is (or is not) specified today

MVP = `web-client-os/mvp-and-acceptance.md`: guest read of nested folder/file + create folder, create file, publish revision, plus agent parity (journeys table lines 283–288).

| MVP SDK capability | Specified on `main`? | Where / standing | Gap |
|---|---|---|---|
| **Realm reader** (explicit `ReadContext`, block-hash-pinned basis, coverage/completeness, `UNKNOWN`) | Named, not specified | `architecture-and-modules.md` §Layer 1A table (Protocol SDK / Realm Reader rows, line 151–152); `ethereum-standards-and-interop.md` §SDK and EFS v2 pressure packet (line 539 ff.: "Exact Ethereum read basis | Protocol SDK + Reader"); `mvp-and-acceptance.md` pressure matrix row "Explicit Realm and pinned read basis — Candidate; exact bootstrap/finality bytes open" (line 823) | No API/result contract on `main`. Branch `developer-journeys.md` §3 gives an illustrative `ReadContext`; branch `exp-c0-mvp-packet.md` gives `ResultV0`. Core-side: `core-architecture-candidate.md` is a candidate, no ABI. |
| **Files resolver** (point lookup, complete-or-qualified listing, revisions, `MountDescriptor/1`, `FilesRouteConfig/1`) | Semantics yes, API no | `hierarchical-files-and-folders.md` §1.2 ("The SDK, Web Client, OS, and mounts share one resolver core"), §3.4–3.5, §4; `Target repos: planning, sdk` | Complete listing needs `BindingScope` — "Proposed dependency… not current B0" (`mvp-and-acceptance.md` line 826; `efsv2/README.md` lines 86–88). Exact bytes gated on V2-E1 (`hierarchical-files` lines 121–124). |
| **Type codecs** (finite exact-Type adapter, raw-preserving generated codecs) | Proposed, undecided | `type-data-abi-boundary-pressure.md` (finite exact-Type consumer adapter); `efsv2/layered-type-system-and-data-abi.md` ("review/experiment target, not an adopted Type system"); owner direction 12: "The Type/query-identity axis remains open" | Branch arm C proposes a deterministic Type compiler; nothing on `main` decides hand-written vs generated. |
| **Signing** (`PrincipalId` + signer descriptor; EOA / ERC-1271; plan digest) | Directed, mechanism open | Direction 7 (`web-client-os/README.md` lines 61–68); `mvp-and-acceptance.md` row "Uniform identity and historical signer verification — Owner direction; exact Core mechanism and default-account storage open" (line 824); efsv2 V2-E1 uniform-Principal experiment | **Blocks MVP writes** until V2-E1 closes; no SDK-side signing contract on `main`. Historical `sdk-wallet-architecture.md` is EAS-bound. |
| **Submission** (EIP-1193 provider, tx / EIP-5792 / 4337 adapters) | Named as adapters | `ethereum-standards-and-interop.md` adapter table ("Submission adapter | Exact transaction/call-batch construction, status, monitoring"); direction 27 | No contract; branch journeys "Authorize account submission" only. |
| **Receipts** (`ActionPlan`/`ActionReceipt`, effect ladder) | Illustrative only | `mvp-and-acceptance.md` row "Structured actions and receipts | generic `ActionPlan`/`ActionReceipt` | Client/SDK requirement; current names illustrative" (line 834); Stage A gate G-5 "Pending/outbox data must never render as admitted/confirmed → **SDK result-model lane**" (`Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md` line 67) | The "SDK result-model lane" G-5 names has no owner or document on `main`; branch `exp-c0-mvp-packet.md` defines the C0 effect axis `COMMITTED / NOT_COMMITTED_PROVEN / UNKNOWN / NOT_APPLICABLE`. |
| **Read-after-write** (canonical read-back at a pinned later basis) | Required, unproven | `mvp-and-acceptance.md` lines 275–277: "Read-after-create succeeds only when the authoritative listing/index path returns the admitted name at the pinned later basis"; open question line 899–901; `web-client-os/README.md` open question lines 524–526 | Depends on `BindingScope` or "a smaller generic declared-index contract" — undecided (efsv2 owns). |
| **Byte acquisition/verification** (locators, verified ranges, corrupt-primary rejection) | Semantics yes | `hierarchical-files` §1.2 "byte acquisition and host projection rules"; `mountable-filesystem-semantics.md` §4 `read(handle, offset, length) -> verified bytes`; `architecture-and-modules.md` Artifact Reader row | Only piece where v1 code is a usable pattern (`sdk` `mirror/{fetch,transport,ssrf}.ts`). |

**Plain statement:** every seam the MVP client will call is named on `main` and specified nowhere on `main`. The specification work exists, but on an unmerged branch whose existence `main` acknowledges only through four "dated evidence" hyperlinks and whose founder mandate is recorded only in a branch-only `owner-rulings.md`.

---

## 3. Lane question 2 — Who owns OS Drives / native mounts?

### 3.1 What is decided

- **Adopted requirement:** `Designs/efsv2/owner-rulings.md` §2026-07-22 "Cross-platform read-only mounted EFS — REQUIRED" (line 108: "must expose a useful read-only mounted filesystem on Linux, macOS, and Windows… through ordinary command-line tools and each platform's normal graphical file manager"), line 109 ("Linux FUSE is an adapter… Current leading candidates are libfuse3, macFUSE/FSKit, and WinFsp"), line 110 (read-only common profile), line 114 (separate from Solana), line 136 (still adopted after the 2026-08-12 correction; "open axes… under held N1 and N5").
- **Constitution row:** `system-constitution.md` line 316 "Three-host mount | One golden pinned view works through shell and normal GUI on Linux, macOS, and Windows…".
- **Freeze gate:** `efsv2/owner-decision-inbox.md` V2-F2 (lines 89–91): first permanent release only after "…large-content, and mounted-filesystem traces"; P-16 (171–174): "The adopted three-host read-only mount outcome survives. Exact snapshot/live product profiles remain evidence-gated"; N5 (267–270): mounts are one of the joint pressure tests.
- **Not MVP:** `product-constitution-and-roadmap.md` line 246 lists "native mounts" in the MVP exclusion column; `mvp-and-acceptance.md` line 96 likewise. `web-client-os/README.md` §Ownership boundaries line 413 assigns everything native to "OS Drives".

### 3.2 Is it connected to hierarchical-files-and-folders?

Yes, tightly and correctly: `hierarchical-files-and-folders.md` line 5 "Proposed new repos: core, os, drive"; line 7 Inputs include `[[mountable-filesystem-semantics]]`; line 8 Authority "…the adopted Linux/macOS/Windows read-only outcome"; line 9 "it does not supersede [[mountable-filesystem-semantics]]'s adopted three-host outcome or acceptance tests"; §Problem lines 34–36 ("A browser, contract-aware client, Linux mount, macOS mount, and Windows mount must agree"); §1.2 lines 118–119 ("The SDK, Web Client, OS, and mounts share one resolver core. An adapter may not invent a different logical tree"); §14 step 5 "Three-host read-only adapters: one shared resolver core through Linux, macOS, and Windows acceptance corpora"; pre-promotion checklist "Linux, macOS, and Windows read-only golden fixture passes"; §Implementation notes "os/mount — shared resolver integration + Linux/macOS/Windows adapters". `Kanban.md` Backlog card for hierarchical-files: "one Web/OS/Linux/macOS/Windows resolver contract… proposed core/os/drive repos are not yet initialized".

### 3.3 Is there an owner?

**No.** Evidence of absence (all checked 2026-09-02 on `main`):
- No `Designs/os-drives/`, `Designs/drive/`, or `Designs/mounts/` folder (`ls Designs/`).
- No Kanban card mentions drives, mounts, or an OS Drives PM except inside the hierarchical-files card text (`grep -n -i "sdk\|mount\|drive" Kanban.md`).
- No `owner-decision-inbox.md` for drives; `Designs/owner-decision-inbox.md` routes only efsv2, clientv2, arcade, open-web-app-store queues.
- `Glossary.md` has no "Mount", "MountDescriptor", "Drive", "OS Drives", or "Protocol SDK" entry (only `ENOENT`, `Resolved view`, `UNKNOWN`, `xattr` entries that point at `mountable-filesystem-semantics`).
- `Onboarding/authority.md` scopes are `* · promotion · vault-process · designs/efsv2 · designs/clientv2 · grants · milestones` — no drives/sdk/web-client-os scope.
- `Daily Notes/agent-status.md` has no `@os-drives-pm` line (grep). The handle appears only in `web-client-os/README.md` line 7 and `architecture-and-modules.md` line 7 as a reviewer, and in `mvp-and-acceptance.md` line 449/853, `web-platform-standards-and-forward-profile.md` line 266 as "the OS Drives PM's lane".
- The only concrete drive artifact is `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md` (245 lines; "Create a dedicated native `drive/` repository after name confirmation. Its Rust core… thin libfuse3/macFUSE/WinFsp adapters"; Tasks 1–8), committed in `02bdae9` (2026-08-14 "design: draft hierarchical Files foundation") together with `2026-08-14-efs2-core-files-foundation.md` (`../core/`, Foundry/Solidity 0.8.34/Bun/Rust) and `2026-08-14-efs2-files-sdk-web.md` (`../sdk/packages/v2/` + `../os/`). Nothing in the vault links to `docs/superpowers/plans/` (grep; the only `docs/superpowers` hits are media-library links into an `experiments/` tree outside the vault), the folder is outside `Designs/` so tri-sync and the content map ignore it, and the root `README.md` directory table does not list `docs/`.

**Conclusion:** the mount requirement is decided and correctly woven into the Files spine; the *lane* (owner, queue, glossary, repo) is missing. The `@os-drives-pm` reviewer name is a phantom role.

### 3.4 A terminology collision the Glossary does not resolve

"Mount" now denotes two things in current efsv2 documents: (a) the host-side mount of `mountable-filesystem-semantics.md` (`EfsMountDescriptor` with `root/lens/evidenceSources/byteSources/basis/completenessPolicy`, `efsd`, `mount(root, lens/policy revision, …)` in §4), and (b) the Core Record Type `MountDescriptor/1 { rootNode, profileId, configRef }` of `hierarchical-files-and-folders.md` §3.4 — "the extensible authority boundary" for a subtree's namespace/content Plans, with `mountOverride`, `FILES_PUBLIC_MOUNT_PROFILE_V1`, `PublicFilesMountConfig/1`, `ExternalFilesLinkConfig/1`, and `FilesRouteConfig/1.rootMount`. The drive plan uses both senses ("Mount one exact EVM EFS Files view…" and "Mount/config graphs, Binding heads"). Neither sense is in `Glossary.md`.

---

## 4. Lane question 3 — What happened to `Designs/sdkv2/ethereum-standards-census.md` at `4d3e736`?

Commands run in the planning vault:
- `git log --all --oneline -- Designs/sdkv2` → **empty**.
- `git show 4d3e736 --stat` → `fatal: ambiguous argument '4d3e736': unknown revision` (the clone is shallow: `.git/shallow` present; 50 commits; oldest `c48f252` 2026-08-13).
- `git log --all -S sdkv2` → only `e4180cc`, `bda3a88`, `da0aec2` (2026-08-22/23), which **add hyperlinks** to the census (`Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` line 142; `Designs/media-library/media-infrastructure.md` line 182; `Designs/open-web-app-store/README.md` line 205 and `architecture.md` line 7).

GitHub API (read-only):
- `GET commits/4d3e736524ca…` → exists: 2026-08-23T03:09:47Z, "design: add Ethereum standards profiles to SDK v2" (Agent: codex-gpt-5), 9 files, all under `Designs/sdkv2/` plus a one-line `Designs/README.md` change; `ethereum-standards-census.md` **added** (272 lines) in that commit.
- `GET contents/Designs/sdkv2?sha=4d3e736` → 10 files (README, architecture-candidate, developer-journeys, ethereum-standards-census, experiment-program, owner-decision-inbox, owner-rulings, research-precedents, sdk-pm-charter, web-client-os-boundary-pressure).
- `GET commits?path=Designs/sdkv2` on default branch → `[]`; `GET contents/Designs/sdkv2` on `main` → not found; commit search `hash:4d3e736…` on default branch → 0 results.
- `GET commits?sha=codex/sdkv2-pm` → the branch contains `55fe3c2` (2026-08-22 "design: draft EFS v2 SDK experience spine"), `7551da3`, `f606bc7`, `76dda04` ("sync: merge current planning spine into SDK branch"), **`4d3e736`**, `9cad5f9` (2026-08-25 "sync: reconcile SDK MVP with EXP-C0 result law"), `57d04f8` (2026-08-25 "design: consume exact Core source lock in SDK lane"). `Designs/sdkv2/` at the branch head has 11 files (adds `exp-c0-mvp-packet.md`).
- Sibling: `codex/data-explorer-pm` holds `Designs/data-explorer/` (8 files) — the "local-only planning commit `08bb5f2…`" the sdkv2 README cites as its Data Explorer input; `codex/v2-readiness-week` holds `b9088d6` (2026-08-25 "design: source-lock disposable EFS v2 Core handoff… independently reproducible JavaScript and Solidity controls") and `2573f08` (2026-08-25 "design: recommend EFS v2 candidate engineering… Route V2-C1 as the one answerable build-start choice").

**Report:** the census was never deleted; it was never on `main`. `main` merges *into* these branches ("sync: merge current planning main…"), never the reverse. Four `main` documents consume the census as evidence via a commit-pinned GitHub URL (which works because GitHub keeps the blob), but the design set, its two owner rulings, its inbox, and its MVP packet are invisible to a `main`-only reader and to every vault script (`open-decisions.sh`, `tri-sync-check.sh`, content map). The PM's own 2026-08-21 rule (`f4605d9` "pm: enforce remote-visible handoffs": "verify the intended commit is reachable from the named remote ref") is satisfied — remote-visible, not main-visible.

---

## 5. Lane question 4 — Banners and content-map accuracy for the root SDK docs

| Doc | Historical/v1 banner in the file? | README row accurate? | Reads as live v2 input? |
|---|---|---|---|
| sdk-architecture | **No** (only a 2026-06-19 contracts note; ends "promote vs. revise") | Yes ("Historical…") | Partly — `#status/review`, Q1–Q6 "RESOLVED", awaiting James |
| sdk-read-surface | No | **No marker** ("Read API shape") | Yes, if read alone |
| sdk-write-ux | No | Yes | Partly |
| sdk-wallet-architecture | No | Yes | Partly |
| sdk-review-backlog | No | **No marker** ("Reconciled build backlog") | Yes |
| sdk-vs-client-responsibilities | No | **No marker** | Yes |
| sdk-minimal-clicks | No | Row inaccurate ("single-signature… shipped"; shipped tier is 2–3 signatures, `batch()` never built per sdk-architecture §Implemented vs Designed) | Partly |
| sdk-one-signature-writes | Yes (superseded by a v1 doc, not by v2) | Yes | No |
| **sdk-v1-bridge-v2-compat-asks** | No | **Missing from content map** | **Yes — explicitly "ASKS on the v2 design"** |
| web3-bytesstore-sdk-followup | No (Status handoff) | Yes | No |
| write-ux-options-ranked | No | Listed "Superseded" but file is `**Status:** review` / `#status/review` | Partly |
| efs-account-system | No | Yes | Partly (its B′ "user = one smart-account address" contradicts direction 7/8) |
| mirror-scheme-policy | No | Contracts row; no v1 marker | Partly |
| web3-standards-compliance | No | Contracts row; no v1 marker | Partly |
| clientv2/sdk-boundaries | Folder banner only | Folder row says historical | No |

The owner-level item that would have fixed this — "mark the pre-v2 SDK design docs as 'v1-profile design of record'" (`Designs/owner-decision-inbox.md` §R1 re-cut 2026-08-08, line 30) — was declared "v1 packet history, not live choices" on 2026-08-12 (line 18–21) without the labels ever being applied. The tri-sync script (`scripts/tri-sync-check.sh`) checks only prose-vs-tag, so "review" docs that the README calls historical pass green.

---

## 6. Lane question 5 — Sibling repositories

| Repo | State inspected | What it is | Reusable for a v2 MVP without importing v1 identity/EAS? |
|---|---|---|---|
| `sdk` (sibling clone) | `main` = LICENSE only; `chore/scaffold` fetched (HEAD `37badc4`, 2026-08-09; 346 files; `packages/sdk/src` ≈ 20.9k LOC, `test` ≈ 17.3k LOC; `packages/solidity/src/v1` ≈ 1.9k LOC; 19 ADRs; `docs/specs/overview.md` "EFS … built on EAS attestations") | The v1 SDK the root docs describe, hardened through 2026-08-09 (ADR-0019 v1-profile boundary: `createEfsV1Client`, `profile: 'efs/v1'`, `@efs/solidity/src/v1/`). `packages/sdk/src/index.ts` header: "Resource-namespaced client… `efs.eas.*` (viem-native EAS)". `grep -c "attest|EAS|schemaUID"` hits every `src` file. | **Patterns only.** Reusable ideas: `reads/source.ts` `ReadBasis{chainId, blockNumber?, blockHash?, finality?, asOf?}` + injected `ReadSource`/`ReadSourceCapabilities` (matches the v2 "exact read basis" need); `mirror/{fetch,transport,ssrf,web3}.ts` verified-bytes acquisition with gateway fallback and SSRF guard; `artifacts.ts` profile-stamped fail-closed serializers; `errors.ts` typed code tree; `writes/submitter.ts` detect→select→submit seam shape. **Not reusable:** `names/segment.ts` (v1 percent-encoding grammar; direction 9 chooses rich Unicode/NFC + reversible aliases), `content/hash.ts` (v1 specs/10 multihash convention), `lenses/resolve.ts` (address lenses vs Principal Lens), `writes/*` (13-attestation EAS DAG), `eas/*`, `chain/abi/*`, `chain/deployments.ts` (frozen-9 schema UIDs), all Solidity. Matches the docs: `sdk-architecture` manifest and ADR-0019 describe exactly this surface. |
| `contracts` (sibling clone) | HEAD `c6b4075` 2026-06-25 | Hardhat/Scaffold-ETH-2 EAS resolvers (`EFSIndexer`, `EdgeResolver`, `MirrorResolver`, `ListResolver`, `AliasResolver`, `WhiteoutResolver`, `EFSBytesStore`, `EFSRouter`, `EFSFileView`, `ListReader`, `SystemAccount`), 68 ADRs, `specs/01–10`, Sepolia deployment records. The only "V2"-named files are test mocks (`contracts/test/Mock*V2.sol`). | No. Matches `mirror-scheme-policy.md`, `web3-standards-compliance.md`, `web3-bytesstore-sdk-followup.md` (ADR-0056/0057/0063/0064 present). Zero EFS 2.0 code. |
| `client` (sibling clone) | HEAD `85796b3` 2026-07-23 "docs: mark the v1 client as legacy" | 2.5k LOC Lit + `@ethereum-attestation-service/eas-sdk` + ethers/viem; hard-coded Sepolia EAS addresses in `src/kernel/kernel.ts`. | No. Matches `repo-map.md` "outdated v1 Vite/Lit client". |

Where a v2 SDK would live is itself contested: `docs/superpowers/plans/2026-08-14-efs2-files-sdk-web.md` Task 1 creates `../sdk/packages/v2/` "without reusing its v1 EAS model" plus a `no-v1-imports.test.ts`; `web-client-os/README.md` direction 11 says reclaim `sdk` after renaming legacy repos `*-v1`; branch `Designs/sdkv2/owner-decision-inbox.md` SDK-E2 says package topology is decided only "after logical boundaries are proved".

---

## 7. Lane question 6 — Cuts, and the one missing document

### 7.1 Cut from the SDK/mount surface for the MVP
1. **Solidity SDK** (`@efs/solidity`, generated per-Type Solidity leaves, helper bakeoff SDK-E3) — no MVP journey in `mvp-and-acceptance.md` needs a contract consumer.
2. **Type compiler / generated-package topology** (SDK-E1/E2, P3 per-Type packages) — hand-write the handful of Files/1 codecs the File Browser needs behind the finite exact-Type adapter of `type-data-abi-boundary-pressure.md`.
3. **OS runtime SDK / `@efs/os-sdk` / CapabilityRPC / one-IDL** (`clientv2/sdk-boundaries.md`; SDK-E6) — the MVP has no third-party apps.
4. **Conformance program C1–C3, `@efs/conformance`, `@efs/dev`** — keep golden vectors, drop the certification machinery.
5. **AA one-signature machinery** (7702 routine, 4337 modules, 5792 batching, sponsorship/relayer/paymaster seams from `sdk-write-ux`, `sdk-wallet-architecture`, `write-ux-options-ranked`, `efs-account-system`) — MVP = one explicitly selected EIP-1193 provider, one signer descriptor, plain transactions; these designs were built to shave EAS attestation popups that do not exist in v2.
6. **Native mounts** — post-MVP by every current doc; keep as a Stage B / V2-F2 evidence trace, not an MVP deliverable.
7. **Data Explorer as an SDK consumer** — branch-only product; not on `main`.
8. **The Ethereum standards census as a gate** — keep as dated evidence; the MVP needs EIP-1193/1898/712 and nothing more.

### 7.2 Keep (the five seams)
Wallet-free Realm reader with explicit basis · Files resolver + honest listing (`UNKNOWN`/`PARTIAL` distinct) · verified byte acquisition · one write path `plan → sign → submit → canonical read-back` with a receipt that never says "confirmed" before read-back (Stage A G-5) · a minimal exact-Type codec set.

### 7.3 The missing document
A **main-visible, owner-routed "EFS 2.0 SDK MVP contract"** — one page under `Designs/efsv2/` (or a landed `Designs/sdkv2/`) that (a) names the five seams above with their result shapes, (b) binds each to the Core/Files Types and ABI it depends on and the efsv2 gate that unblocks it (V2-E1 for signing, `BindingScope`/declared-index for read-after-create), (c) records who owns it and where its queue is, (d) states what is cut. The branch's `exp-c0-mvp-packet.md` + `README.md` §Authority map are 80% of that document; the remaining 20% is landing them on `main`, recording the 2026-08-22 founder rulings in `Decisions.md`/the efsv2 rulings file, adding the content-map row, and either regenerating `Open-Decisions.md` or stating why SDK-E1…E6 are not asks. A companion three-line stub for OS Drives (owner, queue, glossary entries for both senses of "Mount") would close the mount side.

---

## 8. Neighbour assumptions

| This set assumes… | About | Where | Neighbour agrees? | Note |
|---|---|---|---|---|
| "The SDK, Web Client, OS, and mounts share one resolver core" | Files (efsv2) | `web-client-os/README.md` Design principle 6 "No semantic forks"; `mvp-and-acceptance.md` line 853 | **yes** | `hierarchical-files-and-folders.md` §1.2 lines 118–119 says exactly this. |
| The Protocol SDK owns "canonical Ethereum encodings, low-level RPC… signature primitives, and raw evidence" | SDK | `ethereum-standards-and-interop.md` lines 112–118; `architecture-and-modules.md` line 151, 1185 | **unknown** | No SDK design on `main` accepts or rejects the assignment; branch `sdk-pm-charter.md` §What the SDK PM owns matches it. |
| "final repository placement should follow the EFS v2 SDK/repository design" | SDK | `architecture-and-modules.md` line 1177–1179 | **no (on main)** | That design exists only on `codex/sdkv2-pm`; SDK-E2 leaves topology open. |
| OS Drives owns native handles, aliases, projection, daemons, packaging, three-host validation | mounts | `web-client-os/README.md` line 413; `mvp-and-acceptance.md` line 853 | **unknown** | No OS Drives artifact on `main` accepts the assignment (§3.3). |
| Rich Unicode/NFC canonical names + reversible Linux/macOS/Windows aliases | Files + mounts | direction 9 (`web-client-os/README.md` lines 72–74) | **yes** | `hierarchical-files` §2 (`CommonHostAlias/1` gate); `mountable-filesystem-semantics.md` §3.7 "Portable names need an explicit projection profile". |
| Read-after-create requires an authoritative listing at a pinned later basis | Core/Files | `mvp-and-acceptance.md` lines 275–277 | **yes, unproven** | `hierarchical-files` §6/§14 `BindingScope`; `efsv2/README.md` lines 86–88 "neither is current B0". |
| Uniform `PrincipalId`, multiple controller keys not consuming Lens positions | Core/Principal | directions 7–8 | **partially** | efsv2 V2-E1 experiment open; `hierarchical-files` lines 121–124 "not owner law". `efs-account-system.md` (historical) assumes the opposite (one smart-account address). |
| Mounts are post-MVP but pre-first-permanent-release | efsv2 | `product-constitution-and-roadmap.md` line 246 | **yes** | `efsv2/owner-decision-inbox.md` V2-F2 lines 89–91. |
| v2 should commit to a deterministic v1→v2 identity mapping, `bytes32` IDs, v1 reserved-key strings, `f1220` contentHash | Core | `sdk-v1-bridge-v2-compat-asks.md` asks 1–5 | **no** | `Decisions.md` line 23 (2026-08-08): "no v1 support, compatibility, migration, coexistence, or legacy-read requirement"; `efsv2/README.md` Hard holds. |
| A mount's directories are TAGDEF nodes, metadata are VAL/TAG edges, deletion is a global WHITEOUT, rename uses `movedTo` | Core/Files | `mountable-filesystem-semantics.md` §2 table lines 119–133, §3.3 | **no** | `hierarchical-files` line 9 supersedes "path-derived TAGDEF, redirect/moved-to, global whiteout-object, and DATA/file-hybrid mechanisms"; keeps only the three-host outcome and acceptance tests. |
| `@efs/sdk` builds records of "five kinds + two ops", `claimId = keccak256(DOMAIN_CLAIM_V1,…)`, RR1–RR12 resolver | Core | `clientv2/sdk-boundaries.md` §`@efs/sdk` | **no** | `efsv2/README.md` §Evidence map: `deterministic-ids`/`codex-envelope`/`codex-kinds`/`codex-kernel` "superseded as an automatic baseline". |
| The SDK's ~2–3-signature Tier-1 write is what v2 clients inherit | Core/SDK | `Designs/README.md` row for sdk-minimal-clicks ("no successor mechanism inherited") | **yes** | Correctly disclaimed; the Kanban Done card "Retired the v1-only `EFSUploadGateway` wrapper task" agrees. |

---

## 9. Decided / undecided / disagreements

### Decided (ruling location)
- Three-host read-only mount required; FUSE is an adapter; writable mounts later — `Designs/efsv2/owner-rulings.md` §2026-07-22 (lines 108–110). Preserved at 136 and in `system-constitution.md` line 316.
- Greenfield successor, no v1 compatibility/migration/bridge — `Decisions.md` line 23 (2026-08-08). Docs that disagree: `sdk-v1-bridge-v2-compat-asks.md` (all ten asks), `Designs/owner-decision-inbox.md` §R1 "Details:" pointer (line 36), sdk repo `docs/adr/0019` Consequences ("a committed v1→v2 wrapper mapping… tracked in the vault").
- v1 SDK is legacy evidence, not a merge target — `Decisions.md` line 35 (2026-07-27), reaffirmed by the Kanban Done card "Stopped v1 SDK support/merge work for Nanda + Arcade" after the one-day 2026-08-07 reversal (`Decisions.md` line 25).
- MVP is a write-capable File Browser; guest read wallet-free — `web-client-os/README.md` direction 2 and §Authority map.
- No repository creation authorized; eventual `*-v1` rename and reclaim of `contracts/sdk/webclient/drive` — direction 11; `architecture-and-modules.md` lines 1197–1201; `mvp-and-acceptance.md` 868–872. Docs that disagree: the three `docs/superpowers/plans/2026-08-14-*.md` prescribe `../core/`, `../os/`, `../drive/`, `../sdk/packages/v2/` (they say "confirm before initializing" but are written as executable task lists).
- Mounts excluded from the MVP vertical — `product-constitution-and-roadmap.md` line 246.

### Undecided (suggested owner)
- Who owns the EFS 2.0 SDK on `main` and where its queue lives (the branch names an "SDK PM" and records a founder mandate that `main` does not) — **owner** (@james) → then `sdk`.
- Whether `Designs/sdkv2/` (and `Designs/data-explorer/`) land on `main`, and whether SDK-E1…E6 are asks — **vault-process**.
- Who owns OS Drives; where the `drive/` plan belongs; Glossary entries for both senses of "Mount" — **owner** → `efsv2`.
- Signing/Principal seam for MVP writes (V2-E1) — **efsv2**; blocks MVP writes.
- Complete listing / read-after-create mechanism (`BindingScope` vs smaller declared-index contract) — **efsv2**; blocks MVP acceptance.
- Type codec strategy for the MVP (hand-written finite adapter vs generated) — **efsv2** (direction 12 says the axis is open) with `sdk` input.
- Where v2 SDK code lives (`sdk/packages/v2` vs reclaimed `sdk` vs new repo) — **owner**; low urgency until an experiment is authorized.
- Whether `mountable-filesystem-semantics.md` gets a correction banner separating adopted outcome from superseded mechanism prose — **efsv2**.

### Disagreements with rulings still standing in docs
- `sdk-v1-bridge-v2-compat-asks.md` vs 2026-08-08 greenfield ruling (F3).
- `efs-account-system.md` "user = ONE smart-account address" vs direction 7/8 uniform `PrincipalId` with multiple controllers (historical, but unbannered).
- `mountable-filesystem-semantics.md` §2/§3.3 July mechanisms vs `hierarchical-files` supersession (F7).
- `Onboarding/repo-map.md` "Current Client v2 architecture… `planning/Designs/clientv2/`" vs `clientv2/README.md` 2026-08-12 banner (F10).

---

## 10. Concrete defects and stale facts

1. `Designs/README.md` content map: no row for `sdk-v1-bridge-v2-compat-asks.md` (file exists, Status review, `#repo/planning #repo/sdk`). Tri-sync invariant ("Updated in the same commit as design status changes") is violated in spirit; `scripts/tri-sync-check.sh` cannot see it.
2. `Designs/README.md` lists `write-ux-options-ranked` under "Superseded / handed off" while the file says `**Status:** review` / `#status/review`.
3. `Designs/README.md` row for `sdk-minimal-clicks`: "V1 batched single-signature writes (shipped evidence)" — the shipped tier is 2–3 signatures (`sdk-minimal-clicks.md` §The two viable tiers; `sdk-architecture.md` manifest row "`efs.batch()`… type-present, behavior-absent").
4. `sdk-architecture.md` §`efs.batch()` "content hashing… bare SHA-256… SDK ADR-0006" is superseded by ADR-0016 (`sdk` repo `content/hash.ts` header; `sdk-v1-bridge-v2-compat-asks.md` ask 3). `sdk-read-surface.md` names `getDataMirrorsByAttester`, which `sdk-architecture.md` revision log 2026-06-20 says "there is no…".
5. `Onboarding/repo-map.md` §Current phase / §What's authoritative where: clientv2 presented as current Client v2 authority; no `core`/`os`/`drive`; no `web-client-os`.
6. `docs/superpowers/plans/2026-08-14-efs2-{core-files-foundation,files-sdk-web,files-readonly-mounts}.md`: three executable implementation plans (repos, tech stacks, file trees) referenced by nothing in the vault, outside `Designs/`, outside the root README's directory table, conflicting with "No repository creation is authorized" (`web-client-os/README.md` line 498; `hierarchical-files` §Implementation notes "No durable implementation is authorized by this draft").
7. `mountable-filesystem-semantics.md` Depends-on chain (`fs-pass-synthesis`, `codex-kinds`, `read-lens-spec`) is entirely superseded July material; `#status/draft` dated 2026-07-22 with all 24 open-question boxes unchecked, while five current docs cite it as "adopted".
8. `Glossary.md`: no `Mount`, `MountDescriptor/1`, `EfsMountDescriptor`, `OS Drives`, `Protocol SDK`, `ReadContext`, `ActionReceipt` entries although every current spine uses them.
9. `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md` line 67 routes gate G-5 to an "SDK result-model lane" that has no owner/document on `main`.
10. `Designs/owner-decision-inbox.md` line 36 still says "Details: [[sdk-v1-bridge-v2-compat-asks]] (the v2-side asks)" under a question the same file declares superseded (line 18–21).
11. `Open-Decisions.md` is generated 2026-08-21 ("Ask now: 0"); branch `codex/v2-readiness-week` commit `2573f08` (2026-08-25) says it "Route[s] V2-C1 as the one answerable build-start choice" — not reflected on `main` (UNVERIFIABLE whether that is an ask or a recommendation; see §13).

Wiki-links checked and resolving: `[[design-system]]` (alias in `0001-design-system.md`), `[[Decisions-debug-ui-minimal-clicks]]` (vault root), `[[Reviews/2026-07-19-base-native-aa-impact]]`, `[[fable-handoff-portable-schemas-and-validators]]`, `[[efs-v2-transition-plan]]`, `[[codex-kernel]]`, `[[deterministic-ids]]`, `[[lens-spec]]`, `[[web-os-thesis]]`, `[[read-lens-spec]]`, `[[codex-envelope]]`, `[[codex-kinds]]`, `[[apps-cookbook]]`, `[[solana]]`, `[[fable-third-party-app-model-handoff]]`. Ambiguous: `[[identity]]` (two files: `Designs/efsv2/identity.md` and `Reviews/2026-07-07-efsv2-corpus/identity.md`). The GitHub `blob/4d3e736…/Designs/sdkv2/ethereum-standards-census.md` URLs are live (blob reachable) but point outside `main`.

---

## 11. Solid enough to build on now vs settle first

**Solid now**
- The mount *outcome*: `owner-rulings.md` §2026-07-22 + `mountable-filesystem-semantics.md` §4 contract, §11 Phase 2 acceptance criteria and §12 tests 1–17, and `hierarchical-files` §14 step 5. These are implementation-ready acceptance gates for a later `drive/` lane.
- The read-side SDK *posture*: wallet-free, explicit basis, `UNKNOWN`/`PARTIAL`/absence distinct, raw bytes retained — consistently stated in `web-client-os` (`architecture-and-modules.md` §Layer 1A; `ethereum-standards-and-interop.md` §SDK pressure packet), `hierarchical-files` §1.2, Stage A G-5, and the branch `ResultV0`. The v1 `ReadBasis`/`ReadSource` seam is a usable pattern.
- Verified byte acquisition semantics (locator attempts, range verification, corrupt-primary rejection) — `mountable-filesystem-semantics.md` §4/§9, `hierarchical-files` §1.2, v1 `mirror/*` as a code pattern.
- The SDK/client responsibility *test* ("if it requires a secret, a long-running process, a DOM, or a product decision, it is not the SDK's") — `sdk-vs-client-responsibilities.md` §The principle, carried verbatim by `clientv2/sdk-boundaries.md` and matched by the branch charter.

**Settle first (before an MVP SDK can be specified)**
1. Land or explicitly hold the branch `Designs/sdkv2/` set and record its 2026-08-22 rulings on `main` (F1).
2. V2-E1 Principal/signer seam (blocks every write journey).
3. Complete listing / read-after-create mechanism (`BindingScope` or smaller).
4. Type-codec strategy for the finite MVP Type set (direction 12).
5. Owner + queue for OS Drives; Glossary "Mount" disambiguation.
6. Apply the v1-profile labels to the root SDK corpus and retire `sdk-v1-bridge-v2-compat-asks.md` (F3/F4).

---

## 12. Candidate findings

**F1 — The only EFS 2.0 SDK design set lives on an unmerged branch; `main` cites it as evidence and records none of its owner rulings.** `DEFECT` (vault-process), also `MISSING` on main · blocking · MVP-relevant.
`Designs/sdkv2/` (11 files) exists only on `codex/sdkv2-pm` (head `57d04f8`, 2026-08-25); `GET contents/Designs/sdkv2` on `main` → not found; `git log --all -- Designs/sdkv2` → empty. Its `owner-rulings.md` records "RULED (James, EFS Founder)… 2026-08-22 — SDK PM mandate… `Designs/sdkv2/` selected as the current source spine" and the "century-preservation correction"; neither appears in `Decisions.md` or `Designs/efsv2/owner-rulings.md`. `Designs/README.md` at `4d3e736` had an `sdkv2/` row; `main`'s does not. Four `main` docs consume it: `Designs/open-web-app-store/README.md` line 205, `architecture.md` line 7, `Designs/media-library/media-infrastructure.md` line 182, `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` line 142.

**F2 — Every SDK seam the Web Client MVP calls is named on `main` and specified nowhere on `main`; nobody owns it.** `UNDECIDED` · blocking · MVP-relevant · owner: `owner` → `sdk`.
`architecture-and-modules.md` line 151 ("Protocol SDK | IDs, canonical codecs, runtime validators, Core ABI, proofs…"), line 1177–1179 ("final repository placement should follow the EFS v2 SDK/repository design"), `mvp-and-acceptance.md` line 834 ("`ActionPlan`/`ActionReceipt` … current names illustrative"), `Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md` line 67 ("G-5 … SDK result-model lane"), `hierarchical-files-and-folders.md` line 4 (`Target repos: planning, sdk`) and §1.2. `Onboarding/authority.md` has no SDK scope; `Kanban.md` has no SDK card since the Done card "Stopped v1 SDK support/merge work".

**F3 — `sdk-v1-bridge-v2-compat-asks.md` still asks v2 to adopt v1 compatibility commitments that the 2026-08-08 ruling forbids, is unbannered, and is missing from the content map.** `DRIFT` · important · MVP-relevant (it would re-import EAS UIDs/`bytes32`/v1 key strings into Core) · owner: `sdk` + `vault-process`.
File `**Status:** review`, "The asks, by leverage" 1–10 (ask 1: "Commit a deterministic v1→v2 identity mapping… specialized to the nine Sepolia v1 schema UIDs"). `Decisions.md` line 23: "no v1 support, compatibility, migration, coexistence, or legacy-read requirement". `Designs/owner-decision-inbox.md` line 36 still routes to it. `grep sdk-v1-bridge Designs/README.md` → nothing.

**F4 — The "label the pre-v2 SDK corpus as v1-profile design of record" owner item was superseded without ever being applied; 13 root SDK docs still read as `review`-status live designs.** `DRIFT` · important · MVP-relevant (agents will inherit EAS shapes) · owner: `sdk` / `vault-process`.
`Designs/owner-decision-inbox.md` line 30 ("What remains OWNER-level is only the corpus LABELING") vs lines 18–21 (2026-08-12: "v1 packet history, not live choices"). `sdk-architecture.md` §Open Questions ends "One call left for James: promote vs. revise"; no root SDK file carries a historical banner except `sdk-one-signature-writes.md` (superseded by another v1 doc). `Designs/README.md` rows for `sdk-read-surface`, `sdk-review-backlog`, `sdk-vs-client-responsibilities` carry no historical marker.

**F5 — Content-map and status defects in `Designs/README.md`.** `DEFECT` · minor · owner: `vault-process`.
`write-ux-options-ranked` listed "Superseded" while the file is `#status/review`; `sdk-minimal-clicks` row says "single-signature writes (shipped evidence)" while the doc's shipped tier is 2–3 signatures and `sdk-architecture.md` §Implemented vs Designed marks `batch()` "type-present, behavior-absent"; `sdk-v1-bridge-v2-compat-asks` absent. `scripts/tri-sync-check.sh` checks prose-vs-tag only, so these pass green.

**F6 — OS Drives / native mounts have an adopted requirement but no owner, folder, queue, Glossary term, or authority scope; the only artifact is an unrouted Rust `drive/` implementation plan outside `Designs/`.** `MISSING` · important · not MVP-blocking (mounts are post-MVP) but blocks V2-F2 · owner: `owner` → `efsv2`.
`web-client-os/README.md` line 7 ("@os-drives-pm boundary review") and line 413 (OS Drives owns native handles…); `Designs/` has no drives folder; `Kanban.md`, `Glossary.md`, `Onboarding/authority.md`, `Daily Notes/agent-status.md` have no drives entry; `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md` ("Create a dedicated native `drive/` repository… Rust core… libfuse3/macFUSE/WinFsp") is referenced by nothing (`grep -rn "superpowers/plans"`), committed in `02bdae9`.

**F7 — `mountable-filesystem-semantics.md` is cited as the adopted mount outcome but its body still specifies superseded July mechanisms without a correction banner.** `DRIFT` · important · MVP-relevant only via the shared resolver contract · owner: `efsv2`.
Depends on `[[fs-pass-synthesis]]`, `[[codex-kinds]]`, `[[read-lens-spec]]`; §2 table lines 119–133 ("Directory | TAGDEF structural namespace node", "Extended metadata | namespaced VAL/TAG edges", "WHITEOUT"); §3.3 "Path-derived TAGDEF identity… `movedTo`". `hierarchical-files-and-folders.md` line 9 supersedes exactly those mechanisms while keeping "the adopted three-host outcome or acceptance tests"; `efsv2/README.md` line 102 cites the doc as "Adopted three-host read-only outcome and projection acceptance gates". `assumptions-and-requirements.md` got a correction banner; this doc did not.

**F8 — "Mount" means two different things in current efsv2 documents and the Glossary defines neither.** `WRONG` (terminology) · important · owner: `efsv2`.
`mountable-filesystem-semantics.md` lines 73–84 `EfsMountDescriptor` (host mount: root, lens, evidenceSources, byteSources, basis, completenessPolicy, journal) vs `hierarchical-files-and-folders.md` §3.4 `MountDescriptor/1 { rootNode, profileId, configRef }` (a Core Record Type: "the extensible authority boundary" with `mountOverride`, `FILES_PUBLIC_MOUNT_PROFILE_V1`, `FilesRouteConfig/1.rootMount`). `docs/superpowers/plans/2026-08-14-efs2-files-readonly-mounts.md` uses both senses. `grep -n -i "^## .*mount\|MountDescriptor" Glossary.md` → nothing.

**F9 — Three executable implementation plans in `docs/superpowers/plans/` prescribe repositories and toolchains the spines say are unauthorized, and disagree with each other and with the branch SDK set on where v2 SDK code lives.** `DEFECT` / `DIRECTION` · important · owner: `vault-process` / `efsv2`.
`2026-08-14-efs2-core-files-foundation.md` ("Create a new sibling repository, provisionally named `core/`… Foundry, Solidity 0.8.34…"), `2026-08-14-efs2-files-sdk-web.md` (Task 1: `../sdk/packages/v2/`, `../os/`), `2026-08-14-efs2-files-readonly-mounts.md` (`../drive/`). `web-client-os/README.md` line 498 "does not authorize… a new `webclient`, `os`, `sdk`, `core`, or `drive` repository"; direction 11 rename-and-reclaim; branch `Designs/sdkv2/owner-decision-inbox.md` SDK-E2 "Choose public package count/names only after logical boundaries are proved".

**F10 — `Onboarding/repo-map.md` is stale on which client design is current.** `DEFECT` · minor · owner: `vault-process`.
§Current phase: "Client v2 lives in `planning/Designs/clientv2/`"; §What's authoritative where: "Current Client v2 architecture and open choices | `planning/Designs/clientv2/` and its owner inbox". `Designs/clientv2/README.md` banner (2026-08-12): "The active product architecture and requirements now live in [[../web-client-os/README]]". No `core`/`os`/`drive`/`web-client-os` mention.

**F11 — Sibling code is entirely v1/EAS; only read-basis, byte-acquisition, serializer, and error-tree *patterns* are reusable; the docs' described surface matches the code.** `CUT` · important · MVP-relevant · owner: `sdk`.
`sdk` `chore/scaffold` HEAD `37badc4` (2026-08-09): every `packages/sdk/src` file references EAS/attestations/schema UIDs; `docs/adr/0019` "the factory name IS the profile… `createEfsV1Client`"; `packages/solidity/src/v1/*`. Reusable patterns: `reads/source.ts` (`ReadBasis`, `ReadSource`), `mirror/{fetch,transport,ssrf,web3}.ts`, `artifacts.ts`, `errors.ts`. Not reusable: `names/segment.ts` (v1 percent-encoding vs direction 9), `content/hash.ts`, `lenses/resolve.ts`, `writes/*`, `eas/*`, `chain/*`, Solidity. `contracts` HEAD `c6b4075` and `client` HEAD `85796b3` contain no v2 code (only `Mock*V2.sol` test doubles).

**F12 — The SDK surface designed across `clientv2/sdk-boundaries.md` and the branch `sdkv2/` set is an order of magnitude larger than the five seams the MVP needs.** `CUT` / `DIRECTION` · important · MVP-relevant · owner: `sdk` / `owner`.
`clientv2/sdk-boundaries.md`: `@efs/os-sdk` nine namespaces, `@efs/dev`, `@efs/conformance` C1–C3, one-IDL-four-artifacts; branch `architecture-candidate.md` §Logical module boundaries (14 modules), Type compiler, per-Type Solidity leaves, helper bakeoff, century replacement drills; SDK-E1…E6 experiments. `mvp-and-acceptance.md` journeys (lines 283–288) need: wallet-free read with basis, Files resolver with honest listing, verified bytes, one plan→sign→submit→read-back path with a receipt, a finite codec set.

**F13 — MVP writes cannot be specified for any SDK until V2-E1 (Principal/signer) closes; every current doc says so, none names it as the SDK blocker.** `UNDECIDED` · blocking · MVP-relevant · owner: `efsv2`.
`web-client-os/README.md` direction 7; `mvp-and-acceptance.md` line 824 ("exact Core mechanism and default-account storage open"); `hierarchical-files-and-folders.md` lines 121–124 ("No permanent Files Type bytes may be minted until V2-E1 closes"); historical `sdk-wallet-architecture.md` / `efs-account-system.md` assume EAS `attester`/one smart account.

**F14 — Stale internal facts in the historical SDK docs.** `DEFECT` · minor · owner: `sdk`.
`sdk-architecture.md` §`efs.batch()` "bare SHA-256… SDK ADR-0006" vs SDK ADR-0016 multibase (`content/hash.ts`; `sdk-v1-bridge` ask 3); `sdk-read-surface.md` "`getDataMirrorsByAttester`" vs `sdk-architecture.md` revision log 2026-06-20 "there is no `getDataMirrorsByAttester`". Harmless unless the docs are mined as evidence.

**F15 — Branch-only Stage B-like artifacts and a routed "V2-C1 build-start choice" contradict `main`'s "Ask now: 0 / Stage B not run" state.** `UNVERIFIABLE` · important · owner: `vault-process` / `owner`.
`codex/v2-readiness-week` `b9088d6` (2026-08-25 "source-lock disposable EFS v2 Core handoff… independently reproducible JavaScript and Solidity controls") and `2573f08` ("Route V2-C1 as the one answerable build-start choice"); `codex/sdkv2-pm` `57d04f8` ("independent SDK checker… passes exact hash… mutation checks"); `Designs/sdkv2/exp-c0-mvp-packet.md` "The first serialized Core-consumer packet is now source-locked and consumed." `Open-Decisions.md` generated 2026-08-21 says Ask now: 0. I could not open the artifacts from this clone; whether they are "EFS 2.0 code" or a live ask is unverifiable here.

---

## 13. Unverifiable from here

- Contents and nature of the `EXP-C0` artifacts (`Reviews/2026-08-23-efs2-exp-c0-semantic-seal`, `Reviews/2026-08-25-sdkv2-exp-c0-mvp/`) on the non-main branches; whether `V2-C1` is now an owner ask.
- Whether James has read or ratified anything in `Designs/sdkv2/` beyond the two 2026-08-22 rulings the branch itself records.
- Whether `@os-drives-pm` was a real harness role with output elsewhere (no trace on `main`).
- Whether the `sdk` `chore/scaffold` test suite still passes (not run; read-only).
