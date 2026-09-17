# Finish the Files prototype

> **For agentic workers:** Use superpowers:subagent-driven-development. Continue the already authorized prototype; do not reopen the architecture tournament.

**Goal:** Leave James a running, coherent local Files browser and a finite, evidence-backed handoff to production development.

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

### Task 1: Complete ordinary Files workflows

**Files:** Existing `lab-b/browser/compact-sdk.mjs`, `compact-sdk-v2.mjs`, `app.mjs`, `index.html`; new focused `files-workflows.mjs` and integration check as needed. Paths are relative to `Reviews/2026-09-12-efs-path-decision/` in the prototype worktree.

**Interfaces:** Keep `prepare → authorize → submit → reconcile`. New links/copies/restore must retain existing exact profiles and destination guards. A composite workflow reports each real transaction and does not claim cross-transaction atomicity.

- [ ] Add guarded `linkPlacement`: a second name to the same File or Directory, no content rewrite; refuse self-links and occupied destination without explicit replacement.
- [ ] Add `copyFile`: a new File identity with the selected immutable bytes/descriptor, not the original tags/history; preserve external locators and ciphertext without fetching/decrypting. Live providers are link-only unless explicitly snapshotted.
- [ ] Add bounded chain-derived revision history at one pinned basis and a continuation/partial result. Restore is a new successor, not a rollback of history. Do not keep relying only on browser-witnessed revisions.
- [ ] Add bounded recursive **release of my placements** as an explicit preview then sequential guarded work: never erase records/other authors, stop on unknown/stale state, handle aliases/cycles once, leave unprocessed rows visible. Root placement last. This does not mean global graph deletion or unseen concurrent descendants.
- [ ] Wire clear browser controls for link/copy/history/restore and recursive release; preserve ordinary hide versus release. Demonstrate collision refusal and explicit replacement.
- [ ] Surface ASSERT/DENY/SILENT tag controls only through the exact existing stance profile when safely integrated; generic legacy tag buttons must not pretend to be stance semantics. If integration requires a separate planner/journal path, document the precise next task rather than bypass verification.
- [ ] Run a focused real-chain workflow that checks copied versus linked identity, cold history/restore, occupied destination, recursive own-placement release and lower-author survival. Commit exact source paths; report commands, gas, omissions and source revision.

### Task 2: Finish practical costs and wallet/storage boundaries

**Files:** `lab-b/browser/files-view.mjs`, `app.mjs`, new isolated fee module; economics snapshot/refresh script; `wallet-session.mjs` and existing workbench bootstrap only where necessary.

**Interfaces:** Fee models consume actual journal transaction data and receipts. L1/Base/Arbitrum estimates disclose snapshot, execution, data/operator charges, missing components and excluded storage payments. No invented ZKsync total.

- [ ] Price Ethereum L1 plus Base and Arbitrum using current primary-source formulas and public fee observations. Fail to a qualified subtotal/unknown when prerequisites are missing. Include representative transaction serialization and compression uncertainty where relevant; never submit transactions to those chains.
- [ ] Render useful per-action and total estimates by default, with source/date and component details. Keep the floating widget and no setup requirement.
- [ ] Resolve local wallet approval friction if possible with an explicitly development-only, local unlocked-account payer. Portable author signature and payer remain distinct; static/public builds retain normal wallet submission unless an actual transport is configured.
- [ ] Evaluate a user-operated Arweave upload adapter. No silent spending or claim that the temporary byte fixture is durable. If an upload needs an external wallet/funding decision, retain working AR/IPFS URI registration and give James the exact prerequisite; do not invent a permanent-storage guarantee.
- [ ] Run focused fee and wallet checks and a static build. Commit exact paths; preserve honest payment/approval evidence.

### Task 3: Integrate, run, and hand off

- [ ] Deploy the matched current contracts on a fresh owned, pruned local chain; start Vite60627. Do not reuse stale manifest or exceed ordinary contract caps.
- [ ] Click through core navigation, ordered fallback, file bytes, create/edit/link/copy/tag/filter/history/restore/release. Run the new composite workflow against real contracts and record any hard limits.
- [ ] Run focused regressions, static production build and independent scoped review of changed source. Fix consequential findings.
- [ ] Publish a short working/limited/unproven matrix and clean-slate repo/contract/SDK plan on planning/main, code on its existing branch. Clearly identify any remaining paid/public-network or owner-operated checks. Leave the browser running and provide the exact URL.

The finish line is a practical local prototype, not a public launch, a universal wallet adapter, native foreign-chain consensus verification, or frozen century-long bytes.
