# Finish the Files prototype

> **For agentic workers:** Use superpowers:subagent-driven-development. Continue the already authorized prototype; do not reopen the architecture tournament.

**Goal:** Leave James a running, coherent local Files browser and a finite, evidence-backed handoff to production development.

**Completed bounded pass:** [[prototype-finish-results-20260917|Results, limitations and next steps]],
code `44db867`; independent final review and scoped fix re-review approved.
This is local prototype completion, not every long-term EFS requirement or public launch.

**Architecture:** Keep the compact Ledger, mandatory index, qualified SDK, and static SPA. Complete application workflows above the existing guarded operations; no new kernel noun or permanent deployment. The existing prototype worktree remains the code home.

**Tech Stack:** Solidity/Foundry, ethers, JavaScript modules, Vite.

**Spec:** [[files-workbench-20260916]], [[placement-release-plan-20260917]], and James's September17 instruction to finish the remaining prototype work. Earlier owner instructions require v1 behaviors without copying v1 code, dark/static SPA, normal wallet access, honest full-action cost estimates and bounded practical validation.

## Global Constraints

- Work in the existing `codex/efs-warroom-b-run` worktree. Documentation goes to planning/main. Do not migrate the prototype or create production repositories.
- Preserve UNKNOWN/PARTIAL/CONFLICT and transaction-time guards. Receipt inclusion is not effect success.
- No public transactions, paid uploads, wallet approvals on James's behalf, or Fable use. Prepared user-operated payment flows may be implemented but not represented as exercised payments.
- UI60627, RPC8545, chain31337; Vite and chain lifecycles remain separate. No required application server or browser secret in static output.
- No direct v1 implementation reuse. Use bounded tests and one meaningful local-chain journey, not another broad test campaign.
- Mandatory indexes and ordinary EVM code/gas limits remain enabled. Further Core changes need a concrete failing workflow.
- Workers use Astra High. No nested subagents. Parent handles independent review and running demo.
- No native browser alert/confirm/prompt dialogs or automated focus-stealing. James reported a hidden-tab replacement confirmation disrupting his typing; use explicit inline confirmations and keep background checks nonintrusive.

### Task 1: Complete ordinary Files workflows

**Files:** Existing `lab-b/browser/compact-sdk.mjs`, `compact-sdk-v2.mjs`, `app.mjs`, `index.html`; new focused `files-workflows.mjs` and integration check as needed. Paths are relative to `Reviews/2026-09-12-efs-path-decision/` in the prototype worktree.

**Interfaces:** Keep `prepare → authorize → submit → reconcile`. New links/copies/restore must retain existing exact profiles and destination guards. A composite workflow reports each real transaction and does not claim cross-transaction atomicity.

- [x] Add guarded `linkPlacement`: a second name to the same File or Directory, no content rewrite; refuse self-links and occupied destination without explicit replacement.
- [x] Add `copyFile`: a new File identity with the selected immutable bytes/descriptor, not the original tags/history; preserve external locators and ciphertext without fetching/decrypting. Live providers are link-only unless explicitly snapshotted.
- [x] Add bounded chain-derived revision history at one pinned basis and a continuation/partial result. Restore is a new successor, not a rollback of history. Do not keep relying only on browser-witnessed revisions.
- [x] Add bounded recursive **release of my placements** as an explicit preview then sequential guarded work: never erase records/other authors, stop on unknown/stale state, handle aliases/cycles once, leave unprocessed rows visible. Root placement last. This does not mean global graph deletion or unseen concurrent descendants.
- [x] Wire clear browser controls for link/copy/history/restore and recursive release; preserve ordinary hide versus release. Demonstrate collision refusal and explicit replacement.
- [x] Surface ASSERT/DENY/SILENT tag controls only through the exact existing stance profile when safely integrated; generic legacy tag buttons must not pretend to be stance semantics. If integration requires a separate planner/journal path, document the precise next task rather than bypass verification. **Task3 closes this seam.**
- [x] Run a focused real-chain workflow that checks copied versus linked identity, cold history/restore, occupied destination, recursive own-placement release and lower-author survival. Commit exact source paths; report commands, gas, omissions and source revision.

### Task 2: Finish practical costs and wallet/storage boundaries

**Files:** `lab-b/browser/files-view.mjs`, `app.mjs`, new isolated fee module; economics snapshot/refresh script; `wallet-session.mjs` and existing workbench bootstrap only where necessary.

**Interfaces:** Fee models consume actual journal transaction data and receipts. L1/Base/Arbitrum estimates disclose snapshot, execution, data/operator charges, missing components and excluded storage payments. No invented ZKsync total.

- [x] Price Ethereum L1 plus Base and Arbitrum using current primary-source formulas and public fee observations. Fail to a qualified subtotal/unknown when prerequisites are missing. Include representative transaction serialization and compression uncertainty where relevant; never submit transactions to those chains.
- [x] Render useful per-action and total estimates by default, with source/date and component details. Keep the floating widget and no setup requirement.
- [x] Qualify browser journal/history storage by the local chain's genesis hash as well as chain ID and Ledger address. Fresh deterministic Anvil deployments must not show old receipts as current spending; preserve old storage, do not delete it.
- [x] Resolve local wallet approval friction if possible with an explicitly development-only, local unlocked-account payer. Portable author signature and payer remain distinct; static/public builds retain normal wallet submission unless an actual transport is configured.
- [x] Evaluate a user-operated Arweave upload adapter. No silent spending or claim that the temporary byte fixture is durable. If an upload needs an external wallet/funding decision, retain working AR/IPFS URI registration and give James the exact prerequisite; do not invent a permanent-storage guarantee. **Paid adapter is not implemented or tested; external upload then verified URI registration remains available.**
- [x] Run focused fee and wallet checks and a static build. Commit exact paths; preserve honest payment/approval evidence.

**Implementation evidence for Task2:** fee/storage research is retained in the session's research note before implementation. Use the September17 Base Fjord size-only practical bound and Arbitrum uncompressed-data scenario as offline defaults, with current captured fee/FX timestamps. Missing data remains unknown. Exact public calldata estimation is opt-in. The browser's local sponsored mode may use an unlocked Anvil payer through the local RPC after checking loopback, chain, deployment, and Anvil identity; it must be disabled in static builds and visibly described as a development subsidy. It does not change author signatures or grant a production relayer authority.

### Task 3: Integrate exact tag stance into the Files journey

**Files:** `lab-b/browser/compact-sdk.mjs`, `tag-stance-profile.mjs`, a small SDK stance adapter if useful, `app.mjs`, and focused integration checks. Existing workbench required index already commits the validator; no Core change is needed.

**Interfaces:** Use the existing SDK-owned `prepare → authorize → submit → reconcile` lifecycle and the existing exact stance profile. Never insert a standalone planner output directly into the journal or reinterpret legacy generic bindings as stances. Research map: `/tmp/efs-stance-ui-integration-20260917.md` during this run; source pointers belong in the final report.

- [x] Authenticate exact profile/validator through the pinned required index; unsupported manifests fail closed without changing legacy compatibility.
- [x] Add explicit ASSERT, DENY and SILENT operations and exact point reads; include author/Lens and selected-revision HEAD guards. First ASSERT/DENY wins; silence falls through; unknown earlier evidence does not become absence.
- [x] Wire clear browser controls, exact File/selected-revision/Directory subjects, and same-basis folder filtering. Do not run the old joined reader's legacy tag predicate in exact mode. Keep unknown matches visible and coverage honest.
- [x] Keep legacy seeded labels visibly separate or seed fresh exact labels; no silent migration. Global inverse/history browsing is not implied by folder filtering.
- [x] Replace the existing native collision confirmations with explicit inline choices; retain replacement/CAS safety without `confirm()`. Make editor presentation nonmodal and remove automatic focus so background tests cannot interrupt James. This is an owner-directed correction discovered during this pass, not cosmetic expansion.
- [x] Run one bounded real-chain sequence covering both Lens orders, deny versus silence, selected-revision drift, and normal journal/reconcile. Check static build compatibility. Commit exact source paths and report limits.

### Task 4: Repair the exercised IPFS retrieval dependency

**Reason:** Actual public sample retrieval failed during this pass. Both configured gateways (`ipfs.io`, `dweb.link`) returned429 and a September21 sunset header; these are not independent durable fallbacks. See [official announcement](https://discuss.ipfs.tech/t/changes-to-ipfs-io-and-dweb-link-gateways/20328).

**Files:** `lab-b/browser/external-content.mjs`, app carrier wiring and transport configuration, and `script/external-content-fixtures.mjs` as needed. No new Core/profile meaning or backend.

- [x] Replace the retiring defaults with a tested, configurable HTTPS gateway path. The existing public sample was retrieved from `https://gateway.pinata.cloud/ipfs/` with its exact retained length and digest. Preserve the option to replace providers; this is an observed working transport, not an availability guarantee. Inspection of `@helia/verified-fetch` found additional discovery/default-provider scope; defer that larger CID/DAG-verifying adapter rather than installing it implicitly.
- [x] Preserve opt-in public retrieval, abort/time/byte bounds, inert previews and exact EFS descriptor fingerprint checks. No credentials, uploads, pinning, private-data forwarding or silent service-worker installation. Any additional provider visibility is disclosed with the fetch permission.
- [x] Keep ordinary configurable HTTPS gateway fallback distinct from a CID/DAG-verified result. Never make a gateway's returned bytes alone a proof of IPFS identity or permanent availability.
- [x] Exercise the same existing public sample and static build; record the actual transport/provider and limits. Missing providers remain unavailable, not an absent file. Run focused adapter controls, not an IPFS conformance campaign.
- [x] Add a short current quickstart at the top of `browser/README.md`: build pinned contracts, run chain and Vite separately, static build/host commands, stable defaults and important carrier/payment limits. Keep the dated experiments below as history, not the first-run instructions.

The live generated transport configuration can change without resetting the
chain or rewriting its immutable carrier descriptor. Fetch permission must make
the configured gateway visible. EFS fingerprint verification remains distinct
from CID/DAG verification and permanent hosting.

### Task 5: Integrate, run, and hand off

- [x] Deploy the matched current contracts on a fresh owned, pruned local chain; start Vite60627. Do not reuse stale manifest or exceed ordinary contract caps.
- [x] Click through core navigation, ordered fallback, file bytes, create/edit/link/copy/tag/filter/history/restore/release. Run the new composite workflow against real contracts and record any hard limits.
- [x] Run focused regressions, static production build and independent scoped review of changed source. Fix consequential findings.
- [x] Publish a short working/limited/unproven matrix and clean-slate repo/contract/SDK plan on planning/main, code on its existing branch. Clearly identify any remaining paid/public-network or owner-operated checks. Leave the browser running and provide the exact URL.

The finish line is a practical local prototype, not a public launch, a universal wallet adapter, native foreign-chain consensus verification, or frozen century-long bytes.
