# Holistic Workspace Review — 2026-06-10

**Scope:** all four repos (`contracts/`, `sdk/`, `client/`, `planning/`) plus workspace root, with emphasis on contracts. Dimensions: security, gas efficiency, end-user UX, external-developer UX, 100-year design completeness, engineering hygiene.

**Method:** six parallel expert review agents (Solidity security auditor, gas reviewer, protocol architect, dev-UX reviewer, end-user-UX reviewer, cross-repo hygiene reviewer), findings verified against source with file:line references, synthesized here. 79 findings total.

**How to use this report (for agents):**
- Each finding has a stable ID (`SEC-*`, `GAS-*`, `ARCH-*`, `DX-*`, `UX-*`, `ENG-*`). Reference IDs in PRs/commits when fixing.
- Check the **⚠ schema-freeze caveat** below before acting on any schema-related finding.
- Findings are *reports*, not landed decisions. Anything touching an Etched surface or contradicting an ADR goes through the escalation tiers in `contracts/docs/agent-workflow.md` (Tier 1/2). Several findings explicitly need ADRs — don't just patch.
- Permanence tier is noted where it matters. "Etched" = unfixable after mainnet; prioritize accordingly.

---

## ⚠ Critical caveat: the schema-freeze branch

Five of the six review agents read the **`main`-derived checkouts**. The cross-repo agent (ENG findings) discovered that the real schema source of truth currently lives on the unmerged **`schema-freeze` branch** (28 commits, checked out at `/Users/james/Code/EFS/.wt-schema-freeze`), which:

- Makes `DATA`'s field string **empty** (ADR-0049) — main still registers `"bytes32 contentHash, uint64 size"`.
- **Adds REDIRECT** as a 9th schema (`AliasResolver.sol`), **drops BLOB and NAMING**, defers SORT_INFO.
- Introduces `deploy/lib/schemas.ts` as the golden-vector schema source.
- Adds ADR-0048 (proxies + burn-to-immutable, superseding ADR-0030's framing), ADR-0049, ADR-0050.

**Before acting on any finding tagged `[verify-vs-freeze]`, re-check it against the schema-freeze branch.** In particular: ARCH-2 (contentHash algorithm — may be moot or transformed if DATA's fields moved), ARCH-12/DX-6 (BLOB/NAMING — likely resolved by the drop, but main's kernel constructor still bakes BLOB_SCHEMA_UID), ARCH-1 (MirrorResolver allowlist — confirm whether the freeze branch touched it), SEC/GAS findings against `EFSIndexer`/`EdgeResolver` (confirm the code didn't move), and the upgradeability QUESTIONS.md entry (ENG-6, already decided by ADR-0048).

---

## Top priorities

### P0 — before James signs the freeze table / before Sepolia deploy

1. **ENG-1 — REDIRECT field-width drift in the human sign-off path.** Planning vault (`For-James.md`, `Decisions.md`, `agent-status.md`) says `bytes32 target, uint8 kind`; the canonical freeze artifacts (`AliasResolver.sol`, `SEPOLIA_FREEZE_TABLE.md`, ADR-0050, `schemas.ts`) say `uint16 kind`. The field string hashes into a permanent UID. Reconcile with James explicitly before signature.
2. **ENG-2 — merge `schema-freeze` → main** (or banner main loudly). Until then every agent reading main bakes in the wrong schema story.
3. **ARCH-1 — transports are not actually extensible.** ADR-0011 promises permissionless new transports; ADR-0023's scheme allowlist is hardcoded in MirrorResolver, which is **not redeployable** (address baked into MIRROR's schema UID). Needs a superseding ADR + data-driven scheme validation before the freeze. `[verify-vs-freeze]`
4. **DX-4 — EdgeResolver emits zero events.** PIN/TAG placement and silent PIN supersession cannot be reconstructed from logs; subgraphs are impossible without per-edge `eth_call`s. Events are Etched once deployed. Add `EdgePinned/EdgeTagged/EdgeRevoked` (+ enrich `AnchorCreated` with `name`, `DataCreated` with `size`, `MirrorCreated` with `uri`) before Sepolia-freeze if those deploys are meant to be subgraph-indexed, and certainly before mainnet.
5. **ARCH-3 — schema extensibility decision is misfiled.** `FUTURE_WORK.md` itself says "worth considering before mainnet — once frozen, no longer possible," but it's not on `LAUNCH_CHECKLIST.md`. Promote it (and the forward-compatible-event-schema item) to explicit decide-before-freeze gates; record a "no" as an ADR if declined.
6. **GAS-3 — unbounded scan in `getChildrenByAddressList` / `getAnchorsBySchemaAndAddressList`** (`EFSIndexer.sol:569-586, 732-749`). `pageSize` bounds results, not work; a spammed directory makes the path unbrowsable via RPC caps. EFSIndexer is not redeployable — must land before freeze. (Security-relevant too: griefable read-DoS.)
7. **SEC-1 — Content-Type header injection on the primary serving path.** `EFSRouter.sol:367,374,378,407` emit attester-supplied `contentType` unsanitized (the external-body branch sanitizes; the web3:// and raw-bytes branches don't). Fix by sanitizing inside `_getContentType`.
8. **GAS-1 / GAS-2 / GAS-14 — kernel write-path waste that freezes forever.** Duplicate global index (~25k/attestation), dead `_anchorSchemaOf` write (22k/anchor), always-false guard SLOADs. Pure wins, ABI-stable, but storage-layout changes — must happen pre-deploy.
9. **ARCH-12 / DX-6 — undocumented registered schemas.** Main registers BLOB + NAMING with zero spec/ADR; specs say "nine schemas." Likely resolved by the freeze branch dropping them — but main's `EFSIndexer` constructor still takes `BLOB_SCHEMA_UID` as an immutable. Resolve the kernel-constructor question explicitly. `[verify-vs-freeze]`
10. **ARCH-2 — no hash-algorithm identifier on contentHash.** keccak256-forever is assumed, never written down. Either add an algorithm byte pre-freeze or ADR the acceptance + recovery path. `[verify-vs-freeze — DATA field string changed to empty on the freeze branch; find where contentHash now lives]`

### P1 — pre-mainnet (Etched-adjacent, but not blocking the Sepolia freeze)

- **ARCH-8** — deployer EOA as permanent default lens of last resort (key loss/compromise = default view frozen/hijacked; no ADR).
- **ARCH-4** — `web3://addr:chainId` mirror URIs: chainId written but never validated by the router; no fork/L2 semantics ADR.
- **ARCH-5** — EAS dependency register ADR (enumerate every hard coupling + failure mode; verify mainnet EAS immutability in writing).
- **ARCH-6 + ARCH-15** — cold-bootstrap manifest: ENS name for router/indexer + publish conventions/spec manifest *as EFS content* at genesis.
- **ARCH-10** — content-neutrality/moderation doctrine ADR (kernel neutral, lenses/gateways curate, mirror-revocation playbook). Currently zero written coverage.
- **ARCH-11 / UX-6** — anchor-name encoding: no UTF-8 validation, no length cap, no normalization convention → permanent homoglyph/undisplayable names. On-chain floor (length/UTF-8 well-formedness) must be decided pre-freeze; NFC convention can be a client ADR.
- **ARCH-13** — canonical router identity should be an ENS name, not an address, or every shared URL rots on router redeploy.
- **DX-5 / DX-15 / GAS-17** — publish canonical Solidity interfaces (three drifting inline `IEFSIndexer` copies exist today); standardize custom errors across the external surface.
- **DX-9** — converge three pagination idioms; fix `_sliceUIDsFiltered` revert-vs-empty inconsistency (`EFSIndexer.sol:880` vs `:844`); document the `0`-cursor restart trap and 20-lens silent truncation.
- **SEC-3** — permissionless `index()` poisons append-only per-attester indices under any anchor (bounded by viewer sovereignty, but bloat is permanent); consider schema-gating propagation + add the missing depth guard in `_indexGlobal` (`EFSIndexer.sol:955-975`).
- **SEC-5** — `SchemaNameIndex` is last-write-wins squattable; keep out of trusted client paths or scope writes.
- **ARCH-16** — quantified 100-year index-growth model so caps are defended numbers.
- **ARCH-7** — one paragraph in specs/03: state is the source of truth; events are an EIP-4444-expiring convenience; document the state-walk recovery procedure.

### P2 — hackathon-critical UX (OnionDAO window is open now; all client/SDK-side)

- **UX-2 (Critical)** — resumable uploads: persist upload session keyed by contentHash; honor `dataByContentKey` dedup (code reads it then ignores it, contradicting spec 04 §1); stop minting duplicate DATA + orphaned PROPERTY chains on retry.
- **UX-1** — pre-commit cost disclosure (tx count, gas/$ estimate, large-file nudge).
- **UX-3 / GAS-8 / DX-8** — batch via `eas.multiAttest` per DAG layer (validated 2–3 tx floor in `planning/Designs/sdk-minimal-clicks.md`); fix spec 04 §1's overstated "single atomic multiAttest" claim; bake `onProgress`/`resume` into the SDK `pinFile` signature now while it's a stub.
- **UX-4** — lens mental-model explainer + named system lenses + "which lens won" indicator. Also resolve the QUESTIONS.md multi-lens merge-semantics question (default A).
- **UX-5** — verify fetched bytes against attested contentHash; verified/unverified/mismatch badges. Belongs in the SDK read path per the SDK-boundary direction.
- **UX-13** — Sepolia gas preflight (estimate full tx set vs balance, not balance===0) + faucet guidance.
- **UX-7** — default NSFW exclude-set on; tag autocomplete from `/tags/`.
- **UX-9** — surface visibility-TAG failures (currently console-only) + "repair visibility" affordance.
- **UX-10** — client-side mirror failover by transport priority before erroring; humane error copy.

### P3 — hygiene and lower-priority items

Everything else below, notably: ENG-3 (worktree references), ENG-5 (dual LICENSE), ENG-6 (stale QUESTIONS.md), ENG-7 (slipped milestone doc), ENG-8 (reversed For-James-tomorrow recommendation), ENG-9/10/11 (stale AGENTS/links), ENG-12 (Scaffold-ETH leftovers), ENG-13 (unversioned 14MB dataset), ENG-17 (unpushed planning commit, load-bearing stash), GAS-4..7, GAS-9..16, SEC-2/4/6/7/8, DX-1/2/3/7/10/11/12/13/14, UX-8/11/12/14, ARCH-9/14.

---

## Cross-cutting themes

1. **The split-brain is the meta-risk.** The most dangerous findings (ENG-1, ENG-2, ARCH-12/DX-6) are all the same disease: the permanent-UID source of truth lives on an unmerged branch while main, the specs, and the planning vault each tell different stories — *days before a human signs a permanent freeze table*. Reconcile before anything else.
2. **Events are the forgotten Etched surface.** The repo's permanence culture covers schemas, indices, and ABIs well, but DX-4/DX-14 show event design got far less rigor — and events freeze just as hard. The lists subsystem (`ListResolver`/`ListEntryResolver` events) is the in-repo model of doing it right.
3. **The retry/partial-failure path is the worst user moment and nobody owns it.** UX-2 + DX-8 + GAS-8 are one problem: the 10-tx upload has no session persistence, no dedup honoring, no batching, no resume token — at the protocol's single highest-leverage trust moment. The SDK (currently all stubs) is the right owner; bake it into the frozen API shape now.
4. **Several "permissionless extensibility" promises are actually frozen.** ARCH-1 (transports), ARCH-8 (default lens), ARCH-13 (router URLs) — each has an ADR promising flexibility whose implementation etches the opposite.
5. **Read-path DoS budget discipline is inconsistent.** EFSFileView phase-0 has a scan budget (good); EFSIndexer's address-list getters don't (GAS-3); the phase-0 budget itself ignores lens-count multiplication (GAS-13); EdgeResolver has an unbounded N+1 view (SEC-8). One pass to unify "bounded work per eth_call" everywhere.
6. **Docs point external developers at a private vault.** DX-10: sdk READMEs, NatSpec, and specs all link `efs-project/planning` for load-bearing design rationale. Inline public summaries before any external audience arrives.

---

## Full findings

### Security (SEC) — auditor read all in-scope Solidity fully

#### SEC-1: Router emits unsanitized `Content-Type` on web3:// and raw-bytes paths (header injection) — **Medium**
`contracts/packages/hardhat/contracts/EFSRouter.sol:367,374,378,407`. The external-body branch sanitizes via `_sanitizeHeaderValue` (L309); the SSTORE2 branch and raw-bytes fallback emit `_getContentType`'s value verbatim (decoded at L945). A lensed attester's PROPERTY with CR/LF/quote bytes can split/smuggle headers at the EIP-5219→HTTP gateway. **Fix:** sanitize once inside `_getContentType`.

#### SEC-2: `EFSFileView.getDataMirrors` is lens-blind and scheme-unvalidated — **Low**
`EFSFileView.sol:503-539` enumerates via lens-blind `getReferencingAttestations`. Anyone can attest a MIRROR onto a popular DATA; naive clients following returned URIs without filtering by `attester` fetch attacker content. **Fix:** attester-scoped variant or required `attesters[]` param + NatSpec warning that the result MUST be lens-filtered.

#### SEC-3: Permissionless `index()` poisons append-only per-attester indices — **Low** (Etched)
`EFSIndexer.sol:1025-1058` (`index`), `913-977` (`_indexGlobal`). Any attestation with `refUID` at a victim's anchor (even under a non-EFS schema) walks parents to root, appending to `_childrenByAttester[parent][attacker]` and setting `_containsAttestations[*][attacker]`. Bounded by viewer sovereignty (only viewers lensing the attacker see it) but the bloat is permanent and breadth-unbounded. `_indexGlobal`'s walk also lacks the explicit `MAX_ANCHOR_DEPTH` guard `_propagateContains` has (L265). **Fix:** consider schema-gating propagation in the `index()` path; add the defensive depth guard.

#### SEC-4: Malformed `?lenses=` entries silently become `address(0)` no-op slots — **Informational**
`EFSRouter.sol:822-852, 257-267`. No security impact (address(0) can't attest) but masks user error and plants a sentinel in a security-relevant array. **Fix:** skip address(0) when building the lens list, or document.

#### SEC-5: `SchemaNameIndex` is last-write-wins, permissionless — display-name squatting — **Low**
`SchemaNameIndex.sol:20-36`. Anyone can overwrite any schema's human-readable name. **Fix:** scope writes (registrant-only or first-write-wins) if shipped as a trusted label source; otherwise document as untrusted, keep out of trusted client paths.

#### SEC-6: TAG swap-and-pop defensive revert is unreachable (EAS never deletes) — **Informational**
`EdgeResolver.sol:463-497`. Correct revert-over-corrupt choice; would only self-DoS the revoker's own tx. **Fix:** none; add an `// AGENT-NOTE` that the branch is unreachable.

#### SEC-7: No per-(DATA, attester) mirror cap; write side unbounded, reads page-capped — **Informational**
`MirrorResolver.sol:61-85`; cap at `EFSRouter.sol:881` (500). An attester can push a valid high-priority mirror past the 500-scan window — but only within their own lens. **Fix (optional):** cap mirrors per slot or scan web3:// first.

#### SEC-8: `getActiveTargetsByAttesterAndSchema` unbounded N+1 EAS reads — **Informational**
`EdgeResolver.sol:726-747`. Caller-supplied `len` with no max; per-entry external `getAttestation`. **Fix:** document a recommended max consistent with MAX_PAGE caps.

**Security coverage notes:** all core + legacy contracts read fully; sdk `EFSLib`/`EFSWriter` confirmed all-revert scaffolds (no live surface). Lens-scoping in the router (`_findDataAtPath`, `_getBestMirrorURI`, `_getContentType`) verified correctly attester-scoped. Legacy resolvers (Topic/Property/File/Blob) are no-op stubs **not registered by current deploy scripts** — confirm they're excluded from the mainnet registration set. EFSSortOverlay's `nonReentrant` guard around external `ISortFunc` calls is present and correct.

### Gas (GAS) — quantified; none violate ADR-0009 append-only

| ID | Title | Impact | Path | Location | Notes |
|---|---|---|---|---|---|
| GAS-1 | `_sentAttestations` ≡ `_schemaAttesterAttestations` duplicate index | **High** ~25–27k/attestation | write-hot | EFSIndexer.sol:123,126,920-922 | Delete one; back all getters with survivor. ABI unchanged. |
| GAS-2 | `_anchorSchemaOf` write-only mapping (no reader anywhere) | **High** 22.1k/anchor | write-hot | EFSIndexer.sol:160,345 | Delete or actually use; don't freeze a dead slot. |
| GAS-3 | Unbounded scan in address-list getters | **High** (read-DoS) | read-view | EFSIndexer.sol:569-586,732-749 | Add scan budget + resumable cursor. Kernel not redeployable — pre-freeze. |
| GAS-4 | Partner constants via external call per resolver hook | Med ~10–20k/upload | write-hot | EdgeResolver.sol:263,328; MirrorResolver.sol:66,74 | Cache as constructor immutables; hoist `transportsAnchorUID` SLOAD out of loop. |
| GAS-5 | Definition attestation fetched twice per edge attest | Med ~5–10k/edge | write-hot | EdgeResolver.sol:503-518,262 | Return classification + schema from `_validateDefinition`. |
| GAS-6 | `index(uid)` re-reads attestation the resolver already holds | Med ~3–5k × ~5/upload | write-hot | EFSIndexer.sol:1025-1028 + 3 callers | Add gated `indexFromResolver(Attestation calldata)`. |
| GAS-7 | `SlotEntry.pinUID` redundant with `_activeEdge` | Med ~22k/fresh PIN | write-hot | EdgeResolver.sol:117-124,389-390 | Shrink slot to `targetID`; derive pinUID. |
| GAS-8 | ~10 separate txs; `multiAttest` unexploited | Med-High ~250–350k/upload | user-write | spec overview upload flow | Client/SDK change; batch per DAG layer. = UX-3/DX-8. |
| GAS-9 | PROPERTY values not content-deduped | Med ~1 attestation/upload | user-write | EFSIndexer.sol:379-387 | needs-ADR (analog of ADR-0004). |
| GAS-10 | `_allReferencing` global history index — no on-chain reader | Med ~25k × ~8/upload | write-hot | EFSIndexer.sol:144,932 | needs-ADR (public API removal). Decide before freeze. |
| GAS-11 | Router config in storage not immutables; ignores own cached `dataSchemaUID` | Med ~10–20k/request | read-view | EFSRouter.sol:94-98,827,836-839,866,932 | Router is redeployable — easy. |
| GAS-12 | 4 external calls per directory item | Med (dominates listing) | read-view | EFSFileView.sol:346-358,165-167,328 | Add batched `getAnchorMeta` kernel getter; cache schema UIDs as immutables. |
| GAS-13 | Phase-0 scan budget ignores lens count — ~90M gas worst case | Med-High | read-view | EFSFileView.sol:190,269-292 | Scale budget by `attesters.length`. |
| GAS-14 | Always-false freshness guards on new-anchor branch | Low-Med ~4.2k/anchor | write-hot | EFSIndexer.sol:352,356 | Drop the reads; keep the writes. |
| GAS-15 | Storage-based reentrancy guard; `SortConfig` wastes a slot | Low-Med ~17–19k/call | write-hot | EFSSortOverlay.sol:49-55,89-95 | tstore/tload guard; reorder struct. |
| GAS-16 | Mirror-scan quadratic memory blowup under 500-cap (8KB URIs) | Low-Med | read-view | EFSRouter.sol:884-921 | Document vs harden (early-exit when only web3:// can win). |
| GAS-17 | Require strings vs custom errors, mixed | Low | deploy | EFSIndexer.sol:193+ , ListResolver, ListReader, SchemaNameIndex, EdgeResolver:154-156 | = DX-15. Revert strings are explicitly not-Etched. |
| GAS-18 | Legacy `Indexer.sol` memory-copy slicer (contract appears unused) | Low | cold | Indexer.sol:327 | Prune with ENG-12 sweep. NB: `Indexer` IS deployed by 01_indexer.ts:140 per ENG-12 — reconcile before pruning. |
| GAS-19 | Bytecode sizes all comfortably under 24KB | Info | deploy | — | EFSIndexer 14.9KB; headroom for GAS-3/12 additions. |

### 100-year architecture (ARCH)

#### ARCH-1: Transports cannot actually be added permissionlessly — **Blocker-before-mainnet** `[verify-vs-freeze]`
ADR-0011 ("new transports are just new Anchor attestations… no contract upgrade") vs ADR-0023's hardcoded allowlist in `MirrorResolver._isAllowedScheme` (MirrorResolver.sol:112-116) — and MirrorResolver is not redeployable (address baked into MIRROR's UID). In 2060 a successor transport can't get a MIRROR attested at all without orphaning every existing MIRROR. **Fix:** superseding ADR; data-driven scheme validation (validate URI prefix against a `schemePrefix` PROPERTY on the transport-definition anchor, keeping byte-level injection sanitization generic).

#### ARCH-2: No hash-algorithm identifier on contentHash — **Should-fix-pre-mainnet** `[verify-vs-freeze]`
keccak256-forever assumed, nowhere documented; fixed bytes32 precludes longer digests; a future hash break allows content substitution within compromised/dead lenses via mirror injection. **Fix:** `uint8 hashAlg` before freeze, or an explicit keccak-forever ADR with the recovery path. NOTE: ADR-0049 (freeze branch) made DATA's field string empty — find where contentHash now lives and re-target this finding.

#### ARCH-3: No schema-version/extensibility marker; the known escape hatch is misfiled — **Blocker (the decision)**
None of the registered field strings carries a version/reserved field. `FUTURE_WORK.md` §"Schema extensibility escape hatch" says decide before mainnet, but it's absent from LAUNCH_CHECKLIST's pre-mainnet conversations. Same class: "Forward-compatible event schema" item. **Fix:** promote both to LAUNCH_CHECKLIST gates; ADR the outcome either way.

#### ARCH-4: `:chainId` in web3:// mirror URIs written but never validated — **Should-fix-pre-mainnet**
Client writes `web3://${addr}:${chainId}` (CreateItemModal.tsx:942; spec overview step 3); `EFSRouter._parseContractFromWeb3URI` (EFSRouter.sol:498-533) parses 40 hex chars and ignores the suffix, then `extcodecopy`s the local chain. Wrong bytes across forks/L2s; no EIP-4804/6860 reconciliation. **Fix:** ADR the URI grammar incl. chainId semantics; router skips mirrors whose declared chainId ≠ `block.chainid`.

#### ARCH-5: EAS hard couplings unenumerated, no failure analysis — **Should-fix-pre-mainnet**
Couplings found: EAS+SchemaRegistry constructor addresses everywhere; resolver addresses hashed into all schema UIDs; the kernel itself calls `eas.attest()` for auto-tags (ADR-0033 §3); EAS recipient/refUID/revocationTime semantics load-bearing in PIN/TAG/LIST. ADR-0032 covers it in one sentence and says "six schemas" (stale). **Fix:** "EAS dependency register" ADR; verify mainnet EAS's own immutability in writing.

#### ARCH-6: Cold-bootstrap is one address from complete — **Should-fix-pre-mainnet**
Strengths: post-`wireContracts` the Indexer exposes schema UIDs + partner addresses; NAMING gives on-chain names; `web3://<router>/<schemaUID>` self-describes. Gaps: nothing commits to how an archaeologist finds the indexer/router (no ENS plan, no genesis manifest); LIST/ListReader/FileView/Router not discoverable from the hub; specs/ADRs not archived inside EFS. **Fix:** canonical ENS records + genesis manifest published as EFS content + "reconstruct-from-chain-only" launch test. (Combine with ARCH-15.)

#### ARCH-7: EIP-4444 history expiry breaks the documented event-reconstruction path — **Fixable-later**
specs/03 promises subgraph reconstruction from events; post-expiry that's "…if you have an archive." Design is actually resilient (state is source of truth). **Fix:** one paragraph in specs/03 demoting events to expiring convenience + document the state-walk recovery procedure.

#### ARCH-8: Deployer EOA is the permanent default lens of last resort — **Should-fix-pre-mainnet**
ADR-0016; `EFSRouter.sol:819-840` falls back to immutable `indexer.DEPLOYER()`. Key loss freezes the default view forever; compromise silently hijacks it. No rotation/multisig/dead-man story; tradeoff unwritten. **Fix:** decide the final-fallback identity deliberately (multisig/EIP-1271 attester, burned identity with seed content, or 404) and ADR it.

#### ARCH-9: No lens key-rotation story; ENS-name lenses are time-unstable — **Fixable-later, document pre-mainnet**
Lost curator key = decades of curation frozen; `?lenses=alice.eth` re-resolves at view time so ENS turnover silently swaps the trusted attester. **Fix:** normative "share hex, never ENS, in archival URLs" client rule; social-layer successor/delegation convention (e.g. reserved `successor` PROPERTY) ADR'd before curator ecosystems form.

#### ARCH-10: Illegal content / moderation / RTBF tension unaddressed in writing — **Should-fix-pre-mainnet**
Zero discussion in specs/docs (grep-verified); only a planning brainstorm touches it. The architecture's answer (neutral kernel; lenses/gateways/mirror-revocation curate) is coherent but exists nowhere as doctrine; gateway operators and the system-lens tier carry undocumented exposure; permanent anchor *names* can themselves be abusive. **Fix:** "content neutrality and moderation boundary" ADR pre-mainnet.

#### ARCH-11: Anchor names — no UTF-8 validation, no normalization, no length cap — **Should-fix-pre-mainnet**
ADR-0025 passes high-bit bytes through; 255-byte cap unenforced; NFC/NFD forms of "café" are distinct permanent anchors; Cyrillic/Latin homoglyphs (= UX-6). Validation lives in Etched `EFSIndexer.onAttest`. **Fix:** length cap + UTF-8 well-formedness pre-freeze; ADR the client NFC-normalization convention.

#### ARCH-12: Eleven schemas registered, specs say nine; BLOB baked into kernel undocumented — **Should-fix-pre-mainnet** `[verify-vs-freeze]`
`deploy/01_indexer.ts:46-59` registers BLOB + NAMING; neither in specs/ADRs; `BLOB_SCHEMA_UID` is an EFSIndexer constructor immutable participating in native-schema routing (:1037,:1082). Freeze branch drops them — but the kernel constructor question remains. Also: dead contracts (TopicResolver, FileResolver, PropertyResolver, BlobResolver, legacy Indexer, YourContract) blur the audited surface. **Fix:** document-or-remove decision; sweep dead contracts before any audit engagement (= ENG-12; reconcile GAS-18's note that legacy `Indexer` IS deployed).

#### ARCH-13: web3:// URL permanence depends on the router address — the one contract designed to be replaced — **Should-fix-pre-mainnet**
Every shared `web3://<routerAddr>/…` link embeds the address; redeploying (the designated escape hatch) rots all prior URLs. EIP-4804 supports ENS in web3:// URLs; no plan commits to it. **Fix:** ADR canonical router identity = ENS name (and address the name's own 100-year custody).

#### ARCH-14: Gas-schedule/Verge exposure survivable only via redeployability that isn't documented as the mitigation — **Fixable-later**
eth_call budgets, extcodecopy pricing, code-readability assumptions live in ADR rationale numbers, but the reads all sit in redeployable stateless contracts — the actual mitigation, never stated. SSTORE2's dependence on legacy-code extcodecopy semantics is the one storage assumption with no on-chain escape hatch (transport redundancy is the answer). **Fix:** "Ethereum-evolution posture" section enumerating which assumptions live where.

#### ARCH-15: Social-layer conventions not chain-readable — **Fixable-later**
Reserved PROPERTY keys, weight semantics, effective-TAG, lens waterfall, intrinsic-key derivation all live only in repo markdown. A 100-year client author can recover contracts but not meaning. **Fix:** genesis conventions manifest as EFS content under a well-known path (with ARCH-6).

#### ARCH-16: Append-only growth has no quantified century model — **Documented-tradeoff-with-gap**
ADR-0009 + FUTURE_WORK document the tradeoff qualitatively only. Hot-folder reads degrade with lifetime churn, not live size; state-expiry proposals hit these arrays first. **Fix:** back-of-envelope sizing doc (10/50/100-year horizons) so caps are defended numbers; record in an ADR.

**ARCH strengths (don't re-litigate):** the permanence-tier culture itself; cardinality-in-the-schema-UID (ADR-0041); state-not-events as source of truth; the deliberate Etched/redeployable split; century-scale field sizing instincts (uint256 maxEntries, int256 weight, pure-identity entries); viewer sovereignty as the coherent moderation answer (it just needs writing down — ARCH-10).

### External developer UX (DX)

#### DX-1: TS SDK is 100% stubs; advertised quickstart cannot run — **High**
`sdk/packages/sdk/src/index.ts` — every export throws `NotImplemented`; examples all "planned". Expected pre-launch, but gate discoverability: don't publish (or publish with a loud non-functional banner) until `read`/`pinFile` work; land `examples/ts-quickstart` with the first real implementation.

#### DX-2: SDK shape missing fetch/mirror-resolution/hashing — contradicts the SDK boundary — **High**
`index.ts:66-73`: `read()` returns a ref, never bytes; no `fetchContent`, no transport priority resolution, no `message/external-body` handling, no `hashContent`; `eas` typed `unknown`. The file header calls this shape "the load-bearing part we don't want to break later" — and it's missing the load-bearing half. **Fix:** add `fetch(ref, opts)` (or lazy `EfsFile`), `hashContent`, typed `eas` against vendored viem ABIs, *now while it's free*.

#### DX-3: No chain/address/schema-UID discovery story — **High**
`EfsClientConfig` has no chain/addresses; the address source of truth (`deployedContracts.ts`) lives unpublished inside the contracts repo's debug-UI workspace; `@efs/solidity` ships no constants. **Fix:** publish `@efs/sdk/deployments` (generated in CI from `deployedContracts.ts`); `EFSAddresses` library or canonical ENS for Solidity.

#### DX-4: EdgeResolver emits zero events — subgraphs cannot index file placement — **High** (Etched at deploy)
See P0 #4. Full detail: EAS's `Attested` carries no definition/weight/target; PIN supersession is fully silent; `AnchorCreated` omits `name`, `DataCreated` omits `size`, `PropertyCreated` omits value/link, `MirrorCreated` omits URI. Lists subsystem events are the model. **Fix:** `EdgePinned(definition idx, attester idx, targetSchema idx, target, pinUID, supersededPinUID)`, `EdgeTagged(…, weight)`, `EdgeRevoked(…)`; enrich the kernel events.

#### DX-5: No canonical Solidity interfaces; repo's own inline copies already drift — **Medium**
Only IListReader/ISortFunc exist; EFSRouter and EFSFileView declare *different* partial `IEFSIndexer`s; EdgeResolver a third. **Fix:** extract full interfaces into `interfaces/`, make internal contracts import them, republish via `@efs/solidity`.

#### DX-6: Schema-as-API docs insufficient to integrate from docs alone — **Medium** `[verify-vs-freeze]`
Field strings hash into UIDs but specs/02 quotes exact strings only for LIST/LIST_ENTRY; the rest live in deploy scripts; BLOB/NAMING registered but undocumented. **Fix:** canonical table (name, exact quoted string, resolver, revocable, UID formula) in specs/02. Freeze branch's `schemas.ts` is the right source — generate the doc table from it.

#### DX-7: Cross-repo Solidity duplication is a when-not-if drift bomb — **Medium**
No drift *today* (sdk solidity is stubs) but ADR-0003 plans hardcoded UIDs in the SDK with no codegen/CI bridge to the contracts repo. Pragma mismatch: contracts pin `0.8.26`, sdk `^0.8.28` — mutually incompilable (= ENG-14). **Fix:** generate `EFSConstants.sol` from contracts deploy output; sdk CI recomputes UIDs and compares to the pinned-fork `deployedContracts.ts`; align pragmas (`^0.8.26` floor).

#### DX-8: 10-tx upload has no SDK affordances for progress/partial failure — **Medium**
`pinFile(path, content): Promise<DataRef>` — no progress callback, no resume token, no failure model; rationale doc is in the private vault. **Fix:** `pinFile(path, content, { onProgress?, resume?: UploadReceipt })` with serializable durable steps; document that contentHash dedup makes retries safe. (= UX-2/UX-3/GAS-8.)

#### DX-9: Three pagination idioms; footguns in two — **Medium**
(a) opaque cursors (good, ADR-0036); (b) `uint256 nextCursor` where 0 = both start and end → infinite-loop trap (`EFSIndexer.sol:551-592`); (c) `start/length` slices where `_sliceUIDsFiltered` reverts past-end (:880) but `_sliceUIDs` returns `[]` (:844). Plus `_parseAddressList` silently truncates lenses > 20. **Fix:** converge on opaque cursors for new views; make past-end behavior consistent; NatSpec the traps; SDK hides all three behind one AsyncIterator.

#### DX-10: Docs defer to a private planning vault; quickstart inaccuracies — **Medium**
sdk README/package READMEs/overview spec/EFSLib NatSpec all link the (private) vault for the load-bearing architecture; quickstart lacks `chain`, references undeclared `walletClient`, describes `read` as returning content. **Fix:** inline a 1-page public summary into `docs/specs/overview.md`; CI-compile docs snippets.

#### DX-11: Stale ADR cross-reference in sdk code — **Low**
`index.ts:14` cites "(ADR-0004, pending)" for the error model; ADR-0004 is npm Trusted Publishing. **Fix:** correct pointer or write the error-model ADR.

#### DX-12: `message/external-body` pattern unabstracted and undocumented for web devs — **Low**
HTTP 200 + empty body + RFC-1521 header will silently break fetch-based code. **Fix:** SDK fetch path parses and follows it; worked example in SDK docs.

#### DX-13: Six UID species, all bare `bytes32`/`0x${string}` — **Low**
SDK brands Lens/DataRef/PathRef but not UID kinds; wrong-UID-kind is the dominant integration bug class (FileView NatSpec already warns of decode garbage). **Fix:** branded TS UID types; consider `type DataUID is bytes32` UDVTs in published interfaces.

#### DX-14: `EfsFilePinned` event shape won't support path-filtered indexing — **Low**
`EFSWriter.sol:15` — unindexed dynamic `string path`. **Fix:** `(bytes32 indexed pathHash, bytes32 indexed dataUID, string path, bytes32 pinUID)`. Cheap now, Etched after consumers deploy.

#### DX-15: Mixed revert styles across the public surface — **Low**
= GAS-17. Standardize custom errors; keep names in published interfaces so consumers can typed-catch.

**DX verdict:** scaffolding quality (CI, changesets, OIDC, dual ESM/CJS) is excellent; the frozen API shape is missing its most load-bearing pieces; the biggest external-dev risks live in the *contracts* repo (eventless edges, undocumented schemas, no published interfaces) and become Etched at mainnet.

### End-user UX (UX)

#### UX-1: Upload starts with zero cost/tx-count disclosure — **High** (upload)
`CreateItemModal.tsx` handleSubmit ~L621-900. User learns chunk count after committing, cost one popup at a time; only guard is the 24MB cap. **Fix:** pre-submit preview (chunk count, tx count, gas×price estimate, large-file nudge ≥~100KB). Highest-leverage trust moment in the product.

#### UX-2: Failed upload not resumable; retry re-pays nearly everything and mints permanent orphans — **Critical** (upload)
State lives in component memory. Retry re-deploys all chunks + manager, creates a **duplicate DATA** (code reads `dataByContentKey` then ignores it — contradicts spec 04 §1 step 2; explicit at CreateItemModal.tsx:998-1000), recreates the non-revocable PROPERTY chain. Half-uploaded file is invisible (no PIN), money spent, nothing shown. **Fix:** persist upload session (contentHash → chunk addresses, manager, DATA UID, steps) in localStorage; skip completed steps on resume; honor dedup; "Resume" action in BackgroundOpsDrawer; distinct resume-vs-name-collision copy.

#### UX-3: Wallet-popup fatigue — one tx per attestation, no batching — **High** (upload)
Spec 04 §1 claims "atomic upload via single multiAttest" — overstated (intra-batch UID refs are unsignable per `planning/Designs/sdk-minimal-clicks.md`, which validates a 2–3 tx floor). **Fix:** batch per DAG layer now; fix spec 04 §1 wording. (= GAS-8, DX-8.)

#### UX-4: Lenses — the core mental model — explained nowhere user-facing — **High** (browse)
Only surface is a "👥 N lenses" chip listing truncated hex. Deployer-fallback surprise unaddressed; first-attester-wins invisible (ties to open QUESTIONS.md merge-semantics item). **Fix:** named system lenses + one-sentence explainer + first-visit dismissible intro + "which lens won" on preview. Resolve the merge-semantics question (default A) before hackathon users hit it.

#### UX-5: Fetched content never verified against attested contentHash — **High** (trust)
`FileBrowser.tsx` ~L617-635 renders gateway bytes unverified despite having the hash; defeats the core integrity promise. **Fix:** verify post-fetch; verified/unverified/MISMATCH badges; mismatch = error state. Belongs in the SDK read path.

#### UX-6: Homoglyph name spoofing + missing attester provenance in listings — **Medium** (trust)
ASCII-only blocklist (CreateItemModal.tsx:57-72); full Unicode passes → `раypal.pdf` vs `paypal.pdf` as distinct permanent anchors; grid icon/type label trusts attested contentType. **Fix:** confusable detection, per-row attester provenance, magic-bytes sniffing vs claimed type. Protocol side = ARCH-11.

#### UX-7: No default NSFW suppression despite the on-chain convention existing — **Medium** (trust)
ADR-0042 weight<0 suppression only applies inside manual filters; no default exclude-set; no tag autocomplete. **Fix:** default exclude (nsfw) + "N items hidden" affordance + autocomplete from `/tags/`. Decide before hackathon content arrives.

#### UX-8: Production client is a different, dead product — **Critical** (launch-readiness; known-stale, drift enumerated)
`client/src/*` implements a TOPIC/messages forum: hardcoded MESSAGE_SCHEMA, Reply/Like are console.log stubs, no ANCHOR/DATA/PIN/TAG/lenses/router integration, wallet hardcodes `hardhat` chain while kernel hardcodes Sepolia EAS, no upload UI, prompt()/alert() flows, N+1 sequential getAttestation per tree node. **Fix:** treat as a rewrite against the nextjs explorer feature set + SDK (= ENG-4); the explorer is the de-facto reference implementation, minus its IA leaks (UX-11).

#### UX-9: Visibility-TAG failures swallowed → "I uploaded and can't see it" — **Medium** (errors)
Ancestor-walk catch is console-only (CreateItemModal.tsx:1272-1274, 742-744); success toast still fires; folders never appear in the uploader's lens. **Fix:** surface as warning in ops drawer + one-click "fix visibility" repair; self-diagnosis on empty folders where the user has pinned content.

#### UX-10: Unreachable content → raw error strings; no mirror failover — **Medium** (errors)
Preview uses the single best mirror; dead gateway = verbatim "Gateway returned 503…" with no fallback through remaining lens-scoped mirrors (the whole point of multiple MIRRORs). **Fix:** iterate mirrors by transport priority before erroring; plain-language error copy; optional HEAD-check badges in MirrorsPanel.

#### UX-11: Protocol nouns leak into user-visible copy — **Low (devtool) / High if copied into production**
"Creating DATA attestation…", "Binding contentType PROPERTY via PIN…", empty state "Topic is empty" (stale pre-rename vocabulary). **Fix:** user-language progress log with a technical-details toggle; retire Topic* naming.

#### UX-12: Read-path performance — chunked preview and tag filtering scale poorly; pagination not block-pinned — **Medium**
2MB file = ~85 sequential eth_calls + per-byte pushes on the main thread; tag filters fan out N_lenses × N_tags reads; spec 04 §18 blockNumber pinning unimplemented in hooks. **Fix:** typed-array concat, parallel chunk reads, multicall tag checks, pin blockNumber per browse session. Long-term: SDK's job.

#### UX-13: Gas-funding story is devnet-only; Sepolia hackathon users hit a wall — **Medium** (identity)
Autofund is 31337-only (correct); preflight checks balance === 0 only — 0.001 ETH starts a 40-tx upload and dies midway (compounding UX-2); no faucet guidance. Read-only no-wallet browsing works correctly (solid). **Fix:** estimate full planned tx set vs balance (ties into UX-1); Sepolia faucet guidance.

#### UX-14: Lit client baseline a11y/web-quality debts — **Low**
prompt()/alert() dialogs, mouse-only tree spans, hardcoded light-theme hex breaking dark mode. Moot given the rewrite (UX-8) but must not seed it.

**UX verdict:** not launch-ready for end users; the entire journey rides on a debug UI lacking cost disclosure, survivable failure, and the lens explainer. Hackathon minimum bar: UX-1 + UX-2 + UX-13 + UX-4 + UX-5 — all client/SDK-side, none blocked on the schema freeze.

### Cross-repo engineering hygiene (ENG)

#### ENG-1: REDIRECT field width drift — vault says `uint8 kind`, freeze artifacts say `uint16 kind` — **High**
Canonical: `.wt-schema-freeze/.../AliasResolver.sol:81`, `docs/SEPOLIA_FREEZE_TABLE.md:21`, ADR-0050, `deploy/lib/schemas.ts` → `uint16`. Vault: `planning/For-James.md:7`, `Decisions.md:33`, `Daily Notes/agent-status.md:68` → `uint8` (agent-status even says "James's pick … only uint8 kind frozen"). The human gate is signing the table; every summary he decides from records a different type. **Fix:** confirm intended width with James before signature; correct whichever side is wrong; one sentence in For-James noting the widening and why.

#### ENG-2: Frozen schema set diverges from main — two live definitions of DATA and the set — **High**
Main registers 7 schemas incl. `DATA = "bytes32 contentHash, uint64 size"`, BLOB, NAMING; freeze branch: 9 schemas, DATA = "", REDIRECT added, BLOB/NAMING dropped, SORT_INFO deferred. Schema strings additionally duplicated as literals across ~10 test files + `ListEntryResolver.sol:72`. **Fix:** merge schema-freeze → main as critical-path hygiene; banner main until then; post-merge, single-source from `schemas.ts` and delete literal copies.

#### ENG-3: `.wt-schema-freeze` is NOT stale — it's the unmerged critical path with broken pointers — **Medium**
Worktree holds branch `schema-freeze`; vault references dead branch `arch-review` and dead path `.wt-arch-review`; untracked `deployments/` inside; root AGENTS.md doesn't mention it. A cleanup pass could destroy in-flight state (a worktree wipe has already lost files once per the vault). **Fix:** update vault references; mention in root AGENTS.md; commit/remove untracked dir; `git worktree repair`.

#### ENG-4: client is a full generation behind (TOPIC-era) — beyond "outdated" — **Medium**
`contractConstants.ts` has TOPIC/FILE/BLOB schemas + TopicResolver address; deployedContracts from 2026-04-07 with 6 of 12 contracts. Rewrite-scale, not sync-scale (= UX-8). **Fix:** record honestly in client/AGENTS.md; exclude "client UI" as a near-term hackathon participant path or scope the rewrite; rebuild on `@efs/sdk` per the SDK boundary.

#### ENG-5: Two license files, different copyright holders — **Medium**
`contracts/LICENCE` = MIT BuidlGuidl 2023 (Scaffold-ETH leftover); `contracts/LICENSE` = MIT EFS Project 2025; both tracked. **Fix:** keep LICENSE; move BuidlGuidl notice to THIRD_PARTY_NOTICES; delete LICENCE.

#### ENG-6: QUESTIONS.md carries two "blocking" tier-2 questions ~8 weeks stale; one already decided — **Medium**
Proxy-pattern question superseded by ADR-0048 (freeze branch). **Fix:** move proxy question to Resolved → ADR-0048; get James's pick on multi-lens merge semantics or formally adopt default A and move to decisions.md.

#### ENG-7: OnionDAO hard requirements 9 days past "must ship before 2026-06-01", zero boxes checked — **Medium**
Milestones.md stale layer (Kanban itself is alive, cards claimed 2026-06-10); ".sol file list freeze" wording already decided-stale; two Backlog drift cards describe already-fixed drift. **Fix:** re-date requirements gated on the freeze-table signature; update wording; close superseded cards.

#### ENG-8: For-James-tomorrow.md contains a reversed recommendation — **Low**
Recommends freezing DATA as `bytes32 contentHash, uint64 size`; ADR-0049 decided the opposite (empty). **Fix:** archive with tombstone → ADR-0049.

#### ENG-9: Root AGENTS.md + EFS.code-workspace predate the sdk repo — **Low**
Map says "(sdk/ ← future)"; workspace lists only client+contracts. **Fix:** update map, add sdk+planning to workspace, mention the worktree.

#### ENG-10: Broken link in planning/AGENTS.md — **Low**
`./Designs/design-system.md` → renamed `0001-design-system.md` at promotion; "No designs have been promoted yet" note also stale. All other relative links across all 8 AGENTS/CLAUDE files verified resolving.

#### ENG-11: client/CLAUDE.md contradicts actual lint setup — **Low**
Claims no lint configured; `.eslintrc.cjs`, lint script, and CI lint gate all exist. **Fix:** update Commands section.

#### ENG-12: Scaffold-ETH leftovers — **Low**
Delete `YourContract.sol`/`.ts`, `TopicResolver.sol`/`.ts` (no deploy script references); rename `se-2` packages post-freeze-merge. NOT leftovers: `MockChunkedFile.sol` (active router-test fixture), `Indexer.sol` (deployed by 01_indexer.ts:140 — note tension with GAS-18's "appears unused"; verify before pruning).

#### ENG-13: 14MB hackathon reference dataset outside all version control — **Medium**
`/Users/james/Code/EFS/datasets/crypto-whitepapers/` — license-vetted go-live deliverable, single copy, no repo, pinning still gated on James's credentials. **Fix:** git-init or fold into planning until pinned.

#### ENG-14: Three package managers / lint stacks / node floors — deliberate but undocumented; one real seam — **Low**
The seam: contracts pin solc `0.8.26`; `@efs/solidity` requires `^0.8.28` → mutually incompilable (= DX-7). **Fix:** paragraph in root AGENTS.md declaring per-repo toolchains intentional; SDK ADR choosing minimum solc (`^0.8.26` covers contracts) before first publish; align client on sdk stack when it modernizes.

#### ENG-15: CI healthy; deploy-pin-check real; client CI lint-only — **Low**
contracts CI: lint+types+docs-check, tests, deploy-pin-check verified present and matching AGENTS.md. sdk CI: full + foundry + changesets + OIDC. Gaps: client CI runs no build/tsc; no direct tests for BlobResolver/ImportHelper/PropertyResolver/SchemaNameIndex. **Fix:** add build to client CI on wake; note untested resolvers as freeze-adjacent test debt.

#### ENG-16: Secrets hygiene — clean — **Informational**
No committed .env; key-pattern sweep clean; only hardcoded key is the universally-known Hardhat dev account #0 as localhost fallback.

#### ENG-17: Git state — unpushed vault commit, load-bearing stash, branch clutter — **Low**
planning is ahead-1 of origin (the brain's latest state unpushed — defeats multi-agent coordination); contracts `stash@{0}` holds "preserved" PR-protocol edits awaiting James; ~15 local branches incl. six `pr-6*` variants. **Fix:** push planning; `git stash branch` the stash; prune dead branches.

**Per-repo health:** contracts = active, well-gated, split-brained (the freeze branch). sdk = healthiest (clean scaffold, ADR discipline, all-stub by intent). client = hibernating, an architecture generation behind. planning = alive and the best coordination artifact, but carries the most dangerous drift (ENG-1) plus an unpushed HEAD. root = stale map + unversioned deliverable + disguised critical-path worktree.

---

## Known conflicts between findings (resolve during fix work)

- **GAS-18 vs ENG-12 on `Indexer.sol`:** GAS-18 says "no deploy script references this"; ENG-12 says it IS deployed at `01_indexer.ts:140`. Verify which is true on the freeze branch before pruning anything.
- **UX-3 vs spec 04 §1:** the spec's "atomic single multiAttest" claim is contradicted by the validated 2–3-tx floor in `sdk-minimal-clicks.md`. The spec is the thing to fix (Tier 2: spec/code disagreement — surface, don't guess).
- **Anything ARCH/SEC/GAS says about DATA fields, BLOB, NAMING, SORT_INFO, or upgradeability** is main-branch truth; the freeze branch may have moved the ground (see caveat at top).

## Suggested fix sequencing for agents

1. **Reconciliation pass (planning + contracts, ~1 day):** ENG-1 → James; ENG-2 merge; ENG-3/6/7/8/9/10/17 doc+git hygiene sweep (one PR per repo).
2. **Pre-freeze kernel PR (Etched discipline, ADRs first):** GAS-1, GAS-2, GAS-3, GAS-14, SEC-1, SEC-3 depth guard, DX-9 slice consistency, GAS-17/DX-15 custom errors — single coordinated EFSIndexer/EdgeResolver/Router pass with invariant tests.
3. **Pre-freeze decision ADRs (human-gated):** ARCH-1, ARCH-2, ARCH-3, ARCH-8, ARCH-12 (with freeze-branch verification), DX-4 event schema.
4. **SDK shape PR (cheap now, expensive later):** DX-2, DX-3, DX-8, DX-13, DX-11 — all signature/type changes to stubs.
5. **Hackathon UX sprint (nextjs explorer):** UX-2, UX-1, UX-13, UX-4, UX-5, UX-9, UX-10, UX-7 — none blocked on the freeze.
6. **Pre-mainnet backlog:** remaining ARCH items (4,5,6,9,10,11,13,14,15,16), SEC-2/5/7, GAS-4..7/9..13/15/16, DX-5/6/7/10/12/14, ENG-4 client rewrite.

---

*Review conducted 2026-06-10 by six parallel Claude agents (security, gas, architecture, dev-UX, user-UX, cross-repo), orchestrated and synthesized by Claude Fable 5. Findings verified against source at time of writing; line numbers reference the main-branch checkouts under `/Users/james/Code/EFS/` except where the schema-freeze worktree is named explicitly.*
