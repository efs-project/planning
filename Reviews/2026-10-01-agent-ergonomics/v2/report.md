# EFS v2 from an agent's seat — evidence and recommendations

**Date:** 2026-10-01 · **Author:** Claude (Opus 5.5, Claude Code desktop) · **Kind:** read-only evidence pass. No shared design, implementation repo or prototype file was edited. This folder is local and unversioned, like the other `*.local.md` notes at the workspace root.

**Prompt source.** [Jeffrey Emanuel on X, 2026-08-30](https://x.com/doodlestein/status/2094288037458882668), read directly. The idea: put yourself in the driver's seat as the agent operating the system. Ask what would let *you* understand and control it accurately with the least expenditure of resources. Then make it agent-intuitive, agent-ergonomic and agent-accretive: one coherent tower of linked abstractions rather than a pile of parts. I treated it as a lens, not as evidence. I followed the Codex-drafted brief except where noted.

## 1. What I inspected and ran

| Thing | Revision |
|---|---|
| Planning vault (`planning/`, main) | `cb7b340` |
| Prototype: `planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b`, branch `codex/efs-warroom-b-run` | `4fbea63` (2026-09-24). Its 74 untracked files are commit-message drafts; no tracked edits. |
| sdk-v2 `chore/s0-scaffold` / client-v2 `c0-bootstrap` | `a37630d` / `c47cdb5` (read only) |
| Toolchain | Node 24.11.0, forge/anvil 1.7.1, solc 0.8.30 |

**Isolation.** I ran nothing in the shared worktree:

- I exported the prototype with `git archive 4fbea63 <lab-b path> | tar -x -C <scratch>` and ran everything there.
- Each test spawned its own Anvil on a free port and cleaned it up. The pre-existing Anvil (pid 50361, port 62229) was never touched.

I attempted a browser click-through of the UI, but the environment blocked the launch. Human-side observations below come from reading the UI source, not from clicking through it.

**Reproduce** (from a scratch export of `lab-b` at `4fbea63`):

```sh
npm ci                                   # 0.9 s
forge build --offline                    # 5 min 57 s cold (via-IR, 135 files, 369 lint warnings)
forge test --offline                     # 816/816 pass, 65 suites, 0.7 s
EFS_ETHERS_PATH=$PWD/node_modules/ethers FOUNDRY_OUT=$PWD/out \
  node --test --test-concurrency=2 browser/*.test.mjs script/*.test.mjs
cp <this folder>/probes/*.mjs browser/
EFS_ETHERS_PATH=$PWD/node_modules/ethers PROBE_OUT=probe.json node --test browser/zz-agent-probe.test.mjs
EFS_ETHERS_PATH=$PWD/node_modules/ethers PROBE_OUT=probe2.json node --test browser/zz-agent-probe2.test.mjs
```

**JS suite result.** Without `FOUNDRY_OUT`: 342 pass, 15 fail, 1 skip of 358 tests. With `FOUNDRY_OUT` set, 6 of the failing files recover. The remaining 9 failures need preconditions that aren't documented:

- the `EFS_QUERY_INPUT` input file;
- a real git checkout (one test calls `git rev-parse HEAD`);
- an archive wrapper pinned to a different build (`DESCRIBED_ARCHIVE_WRAPPER_RUNTIME`).

I found no evidence that these are product defects. They are a runnability problem.

**Agent probes.** I wrote two probes against the public SDK only. Code is in `probes/`, raw output in `results/`. They cover:

- discovery from the manifest;
- create through the full lifecycle;
- two agents racing to edit the same file;
- the raw chain revert behind that race;
- four invalid names;
- RPC cost of a simple read;
- whether state survives a restart;
- history;
- a send that never broadcasts.

A separate read-only sub-agent timed six "fresh developer agent" questions against the vault and the new repos (§2B).

## 2. Observed vs intended vs unknown

### A. An agent *using* EFS (prototype SDK)

| Situation | Observed | Intended / design | Verdict |
|---|---|---|---|
| Create → read back | `prepare → authorize → submit → reconcile` gave `EFFECTS_VERIFIED`. Effects were re-verified from chain state, not from the receipt. 142 RPCs, all local. | Same | **Works; preserve** |
| Missing name | `readPlacement('nope.txt')` returned `knowledge: ABSENT, coverage: COMPLETE`, i.e. proven absence | Same: never infer absence from uncertainty | **Works; preserve** |
| Two agents edit the same file from one basis | Winner: `EFFECTS_VERIFIED`. Loser: throws `Error('COMPACT_READSET_DRIFT')` with no fields and no cause. The chain's own answer, `E_READSET_STALE(positionIndex=0, principalIndex=0)`, sits in `err.rpcError.data` on the raw call and decodes in one line with the manifest ABI. The SDK never decodes revert data anywhere (0 uses outside tests). | Solidity errors are deliberately parameterized (`E_CAS(key, expected, have)`, `E_REF_TYPE(leaf, slot, expected, have)`, …) | **Gap: diagnosis is discarded** |
| Bad names `Notes.TXT`, `../escape`, 256×`a`, `café.txt` | All four give the identical `COMPACT_NAME_GRAMMAR` | The design debates ASCII vs Unicode names (P2/N1–N3), so users will hit this | **Gap** |
| Error surface overall | **149 distinct `COMPACT_*` codes**, all thrown as bare strings, with no catalog and no retry class. The UI shows `error.message` raw, so humans see the same codes. | The sdkv2 plan asks for "structured results … redacted diagnostics" | **Gap (agent and human)** |
| Wallet rejects before broadcast (EIP-1193 `4001`) | Journaled as `BROADCAST_UNKNOWN`. Retrying the *same* signed plan silently does nothing (0 sends; it short-circuits to reconcile). A fresh plan reuses the same nonce and lands. The abandoned plan then reports `BROADCAST_UNKNOWN` **forever**, although the chain proves it can never land; a stale broadcast reverts. | Recovery without duplicate writes (M2) | **Safe but not live:** an agent polling `reconcile` never terminates |
| Restart / hand to another agent | Journal entries reconcile across SDK instances (existing tests). Contexts, plans and continuations are per-instance capabilities: a foreign or JSON-serialized context gives `COMPACT_CONTEXT`. A fresh instance's `pin()` costs **95 RPCs** (73 `eth_call`, 18 `eth_getCode`). | Deliberate (capability safety) | **Fine, but undocumented** what survives a restart. The 95-call re-pin matters on rate-limited public RPC. |
| Schema discovery | `capabilities()` self-describes, which is good. Type *names* exist only in the local 118 KB manifest. `readTypeDescriptor` on the core `content` Type returns `knowledge: OPAQUE_LEGACY`. History rows carry `profile: "legacy-inline"`. | Described, self-identifying Types | **Partial.** "Legacy" labels on current v2 profiles also mislead. |
| Uncertainty vocabulary | At least 8 parallel vocabularies: `knowledge` (PRESENT/ABSENT/MASKED/UNKNOWN/VERIFIED/OPAQUE_LEGACY), `coverage`, `nameCoverage`/`kindCoverage`, `queryKnowledge`/`queryCoverage`, `scanStatus`, content `state` (7 values), write `status` (5), tag `assessment` (4), `receiptAttribution`. `listFolderPage` deliberately has *no* generic value/knowledge/coverage fields. August's `ResultV0` tried to unify this but was too heavy and was not carried forward. | One qualified result | **Each is principled; the set is not legible** |
| Agent-ready facade | `browser/drive-projection.integration.test.mjs` has a ~30-line `drive()` facade with plain verdicts: `PRESENT`, `ABSENT_PROVEN`, `UNKNOWN(reason)`, `NOT_A_FILE`, `BYTES_UNAVAILABLE`, `OPEN_VERIFIED`. It never collapses UNKNOWN into ABSENT. | Not a public API; it lives in a test | **Best agent surface in the repo, buried** |

### B. An agent *developing* EFS (sub-agent audit, read-only)

| Question | Files / words | Outcome |
|---|---|---|
| What is the next v2 task; is real-code work authorized? | 11 / ~7,500 | Low confidence. G0 is an unchecked box (`prototype-delivery-checklist.md:47`), yet `Open-Decisions.md` says "Ask now: 0". The decisions pending in the 09-26 init plans never reach the generator. |
| Where is the prototype, which commit, how do I test it? | 9 / ~8,000 | `planning/AGENTS.md` doesn't mention it. Kanban cites `44db867`, which is historical. No `npm test`. The full test command appears only under a "historical" heading in `browser/README.md`. The `lab-b/README.md` header still says "52 passed … measure.mjs NOT executed". |
| Define Lens, Realm, Principal, Binding, Placement, Admission, Basis, Coverage | 7 / ~6,000 | Only 3 of the 8 are in `Glossary.md`. Placement and Coverage appear 0 times; Placement is defined only in `lab-b/LABELS.md`. About 45 terms of art appear in the first three spine docs. |
| New repos onboarding | 10 / ~4,500 | Clear and well enforced, but no single verify-all command: sdk-v2 `check` excludes Solidity, and client-v2 `check` excludes build, e2e and repro. Prototype lessons are prose only; conformance vectors are deferred (F3). |
| Process cost of one small vault change | 5 / ~4,700 | About 12 steps. Handoff state is split across 5 places. |
| Clutter | — | 87 + 74 untracked `.codex-*` commit drafts; 16 `planning-*` worktrees with no liveness record; the 09-26 init-plan handoffs (including the `4fbea63` pin) are **uncommitted**. |

The efsv2 `README.md` "Read this on a phone" section is about 20 reverse-chronological dated paragraphs. That is a news feed, not a map. The checklist is the real entry point, and it is good.

**Unknowns:**

- I didn't verify real-browser rendering or the long-lived-tab behavior of the UI.
- I didn't test public RPC or a real wallet (correctly out of scope).
- I didn't establish whether the 9 precondition-bound JS tests pass in their original worktree.
- The Files application layer has 28 `test/Files*.sol` files living under `test/`. I couldn't confirm whether the contracts-v2 module split already plans to move it.

## 3. The five most valuable improvements

The theme: EFS already *knows* the precise answer in almost every case — the chain, the journal and the read layer all carry it. The losses happen at the last hop, where the answer is handed to an agent or a person. Each fix makes that hop lossless. Each one helps humans as much as agents.

### 1. Structured, actionable errors end to end
**Example:** the race loser gets `COMPACT_READSET_DRIFT` while the chain says `E_READSET_STALE(0,0)`. Four different name violations all give one code.

**Change:** `EfsError { code, retry: 'reprepare' | 'resubmit' | 'wait' | 'none', details, cause }`:

- decode revert data with the ABI already in the manifest;
- give `check(cond, code)` (the single choke point) an optional `details` argument;
- generate a code catalog (meaning + retry class) from source and check it in CI. The sdk-v2 placeholder check already shows the pattern.

**Existing mechanisms:** parameterized Solidity custom errors; `rpcError` retention in the transport; the `check`/`fail` helpers.

**Tradeoff:** codes and detail fields become public API. Keep them stable and versioned.

**Tests:**

- the race loser gets `code: READSET_DRIFT`, `retry: reprepare`, and `details` naming the position and principal;
- each name violation yields a distinct rule (`UPPERCASE`, `NON_ASCII`, `DOT_SEGMENT`, `TOO_LONG`);
- the catalog check fails on an undocumented code.

### 2. Make write reconciliation converge to a terminal state
**Example:** probe 2. A rejected send stays `BROADCAST_UNKNOWN` forever, and re-submitting is a silent no-op.

**Change:**

- On an EIP-1193 `4001` or another *pre-broadcast* failure, journal `NOT_SENT` and allow re-submit of the same signed plan. Keep `BROADCAST_UNKNOWN` for genuinely ambiguous errors.
- In `reconcile`, if `publicationOf(id) == 0` and the author's nonce is already past `plan.intent.nonce`, report `NOT_ADMITTED_NONCE_CONSUMED`. If the pinned timestamp is past `deadline`, report `EXPIRED`. Both are terminal and qualified by basis.

**Existing mechanisms:** `nonces()`, `deadline`, `publicationOf`. All are already read during preflight.

**Tradeoff:** "terminal" holds only at a canonical basis. On public chains, add the finality qualifier the design already carries.

**Tests:** probe 2 as a regression test. Also: a never-landing plan reaches a terminal state within one `reconcile` after the nonce is consumed, and a stale broadcast still reverts.

### 3. One small result rule, plus the drive facade promoted to the plain-answer layer
**Example:** at least 8 parallel uncertainty vocabularies. The clearest surface is the `drive()` helper hidden in a test.

**Change, for sdk-v2 rather than the prototype:**

- every public read returns `{ value, knowledge, coverage, basis, reason? }`, with method-specific detail beside it, never instead of it;
- one table lists each state, what it means, and what to do next;
- ship `drive()`-style verdicts as a documented helper over that rule. This is the read model the planned CLI/MCP adapters should expose first.
- rename the "legacy" labels on current profiles.

**Explicitly not** a revival of `ResultV0`'s 9 kinds × 11 subject kinds.

**Tradeoff:** a verdict layer can tempt callers to ignore qualifications. So the helper must never return ABSENT unless coverage is COMPLETE, and it always carries `reason`.

**Tests:**

- a conformance test that every public read carries the envelope;
- a property test that a verdict is `ABSENT_PROVEN` only when coverage is COMPLETE;
- the drive test re-run against the promoted helper.

### 4. Make "what is true now" cheap and machine-checked in the vault
**Example:** it took 11 files and about 7.5k words to learn the next task. Entry docs disagree about which repos exist. The decision roll-up is green but blind. Glossary lacks Binding, Placement, Admission, Basis and Coverage.

**Change, reusing existing mechanisms only:**

- add G0 and the 09-26 init-plan decisions to the owner-decision inboxes so `open-decisions.sh` sees them;
- add `Retirements.md` rows for the stale phrases (`sdk/ … unmerged`, `chore/scaffold … in flight`, `successor directories absent`) so `needs-integration.sh` catches regressions;
- add glossary stubs linking to their defining sections;
- replace the efsv2 README news feed with a link to the checklist plus a short dated index;
- add a worktree-liveness listing to `stale-cards.sh`;
- `.gitignore` the `.codex-*` drafts;
- commit or label the uncommitted init-plan handoffs.

**Tradeoff:** these are vault edits, so they belong to the v2 PM / publishing role, not to this pass.

**Test, the agent-native part:** keep the six audit questions as a **repeatable onboarding benchmark**. Re-run them with a fresh agent after each vault reorganization and track files/words to answer. Today's baseline is 7–11 files and 4.5k–8k words per question.

### 5. One command that runs everything, and prototype lessons carried as executable scenarios
**Example:**

- no `npm test` in the prototype;
- 15 of 358 tests fail without undocumented env;
- `FOUNDRY_OUT` is defaulted in some files and required in others;
- `EFS_ETHERS_PATH` is mandatory for tests even though `npm ci` installs ethers and `workbench-chain` auto-resolves it;
- a 6-minute cold build;
- neither new repo has a verify-all command;
- lessons like "proven absence ≠ unknown", "race loser must re-prepare" and "no duplicate broadcast" live only in prose.

**Change:**

- in the prototype checklist (doc only), record the exact full-suite command and its env;
- in the new repos, add `check:all` / `verify`;
- seed sdk-v2's conformance corpus with **agent-journey scenarios** written against the public API only (the two probes here are a starting draft). They then survive the prototype → sdk-v2 rewrite unchanged, which is the "accretive" part.

**Tradeoff:** scenario tests are slower than unit tests, so keep them a separate lane, the way each test already owns its Anvil.

**Test:** CI runs `verify` from a clean checkout with no env other than what's documented.

**Deliberately not recommended:**

- Building the MCP adapter earlier. The existing plan is sound, but an MCP tool that returns `COMPACT_READSET_DRIFT` or `BROADCAST_UNKNOWN` forever is an agent trap; do 1–3 first.
- New Core nouns, or any change to Core semantics.

## 4. What already works well and should be kept

- **The write lifecycle:**
  - a plan is bound to its creating SDK instance;
  - the signer is recovered and checked before submit;
  - a write-ahead journal precedes the send;
  - duplicate broadcast is impossible;
  - effects are re-verified from chain state (`EFFECTS_VERIFIED`);
  - a stale broadcast reverts rather than double-writing.

  This is exactly what an agent needs to act safely.
- **Qualified reads:** proven absence (`ABSENT` + `COMPLETE`) is kept distinct from `UNKNOWN`. The UI refuses to infer an empty folder ("No qualified directory or empty folder is inferred").
- **Content safety:** external bytes are fetched only after explicit per-origin consent, and HTML/SVG stay inert downloads. This matters for agents reading untrusted content.
- **Test isolation and speed:** each test owns its Anvil on a free port; 816 Solidity tests run in 0.7 s.
- **Parameterized Solidity custom errors.** `capabilities()` self-description.
- **The delivery checklist's discipline:** three finish lines, stable IDs, "a checked item needs exact source/build identity". Also the generated `Open-Decisions.md` (the mechanism is good; its inputs lag).
- **The new repos' docs:** sdk-v2's machine-checked `LIMITATIONS.md`, and client-v2's short, enforced `AGENTS.md`.

## 5. Handoff to owning roles

- **sdk-dev (sdk-v2):** items 1, 2, 3 and 5, as S1 acceptance criteria. Start from `probes/` as the first conformance scenarios. The contexts-are-capabilities design stays; document what survives a restart.
- **web-client-dev (client-v2):** render errors from the item-1 catalog with the retry class, not raw codes. Same verdict table as item 3.
- **contracts-dev:** treat parameterized custom errors as an ABI commitment in M1. Consider self-describing names for core Types so discovery doesn't depend on a local manifest. Confirm where the Files application layer (`test/Files*.sol`) lands in the module split.
- **v2 PM / vault publisher:** item 4. Also add the full prototype test command and env to `prototype-implementation-plan.md`. Adopt the onboarding benchmark.
