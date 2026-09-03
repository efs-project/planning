# R24 — `origin/lab/2026-08-26-fable-consumer-tournament` (orphan lab branch)

Reader lane R24-lab-tournament-branch. Reviewed 2026-09-03 against the read-only worktree at
`/tmp/.../scratchpad/branches/lab-tournament` and against `main` at the planning vault.
Branch-only paths are prefixed `lab-tournament:`. Nothing in any worktree or in the planning vault
was modified; all reproduction was done in a throwaway copy under the scratchpad.

## 0. What this branch is, mechanically

- **Orphan.** `git merge-base main origin/lab/2026-08-26-fable-consumer-tournament` returns nothing.
- **6 commits, not 50** (`git rev-list --count` = 6), all 2026-08-26, all authored
  `James Carnley <JamesCarnley@gmail.com>` with trailer `Agent: fable-5 / Co-authored-by: Claude Fable 5 /
  Harness: claude-code`:
  `89091a4` seal (HYPOTHESES + MANIFEST only, 214 lines) → `a6bb2c4` fixtures/oracle/SUT/119-case diff →
  `1e51245` morning report + rejected ledger + measurements → `2d0514b` EVO-100 + HASHES →
  `a72fb30` path-safe corpus builder → `70d78a5` overnight2 seam tournament.
- 57 files, ~4,700 lines of executable Python + Solidity plus 5 markdown reports. No `Designs/`,
  no `Reviews/`, no vault file of any kind. It is a self-contained lab, not a design set.
- Every file carries the banner `**DISPOSABLE** · protocolConformance=false · notAdopted=true ·
  goCodeAuthorized=false` (`lab-tournament:MANIFEST.md` line 3; repeated in every source header).

**Maturity of the set: `historical-evidence`.** It is a dated, self-labelled disposable experiment
record. It is not a design, not a proposal, not adopted, and its own manifest forbids treating it as any
of those. The correct vault home is a `Reviews/` corpus, not `Designs/`.

## 1. Lane question 1 — which specification did it test, and what did the source lock pin?

`lab-tournament:MANIFEST.md` §"Authority source-lock (recorded before work began, 2026-08-26)":

> Planning vault `/Users/james/Code/EFS/planning-v2-readiness`: HEAD
> `2573f08b170bf3eb855ad5a68c31ee7b0215272d` … branch `codex/v2-readiness-week`, **working tree clean**.

Verified: `git cat-file -t 2573f08` resolves, `git branch -a --contains 2573f08` → only
`remotes/origin/codex/v2-readiness-week`. **The lab locked to the readiness branch, not to `main`.**

The lock pins exactly **five** authority files by sha256 (`MANIFEST.md` table):
`AGENTS.md`, `Designs/efsv2/owner-decision-inbox.md`, `Designs/efsv2/v2-contract-readiness-program.md`,
`Designs/efsv2/layered-type-system-and-data-abi.md`, `Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md`.
It records owner state at lock: "`V2-C1` pending, `goCodeAuthorized=false`,
`technicalDisposition=RECOMMEND-GO-CODE`. Gate vector G0–G6 all `PARTIAL`."

Toolchain lock: forge 1.7.1, solc 0.8.30, EVM `osaka`, optimizer 200, via-IR, Python 3.14.4 stdlib,
macOS Darwin 25.5.0.

**What it did NOT read.** `git ls-tree 2573f08` confirms the locked tree also contained
`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-*.md` (all nine), `Designs/efsv2/system-constitution.md`,
`core-architecture-candidate.md`, `owner-rulings.md`, `README.md`, and
`Designs/efsv2/hierarchical-files-and-folders.md` (byte-identical to `main`; `git diff main 2573f08 --
Designs/efsv2/hierarchical-files-and-folders.md` is empty). None of these is in the read list.

Consequence: **the tournament pressure-tested a prose reconstruction the lab wrote for itself**
(`lab-tournament:HYPOTHESES.md` §"Comparator arms — pre-registered acceptance semantics": "This prose is
the single shared spec for oracle and SUT"), aligned to the C0/v0 disposable codec selections
(`MANIFEST.md` §"Alignment with EXP-C0/v0 (read-only)"), **not the Stage A B0 candidate**. Every
"law-completion break" is therefore a gap in the lab's own model, and must be re-checked against B0
before it is called a gap in the design. Section 4 below does that re-check.

**Codec divergence from `main`.** The lab's body law is
`abi.encode(uint16 codecVersion, bytes payload)` with codec 0 = `ABI_TUPLE_V0`, canonical =
decode-then-byte-identical-re-encode (`MANIFEST.md` §Alignment; `HYPOTHESES.md` §"Comparator arms",
"Common substrate"). `main`'s Stage A pins the opposite:
`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md` §2.1 line 302 —
"**Chosen for B0: (a) schema-directed fixed-width packed word encoding ("MC/1 wire form")**" — and
line 308 — "Delta from raw `abi.encode`: bodies are PACKED … No varints, no self-describing type heads,
no floats, no indefinite lengths … one packed, big-endian, fixed-width, **offset-free** byte layout."
The readiness branch's control agrees with the lab, not with Stage A
(`readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` lines 111, 136:
"`abi.encode(uint16 codecVersion, bytes payloadBytes)` wire", "The selected generic `ABI_TUPLE_V0`
mapping"). See finding **F24-3**.

## 2. Lane question 2 — exactly what was measured, with numbers

### 2.1 Differential agreement: 119/119, and what the two sides actually are

- Corpus: **16 Types, 36 Records, 119 cases, 16 state-script steps, 9 callback cases**
  (`lab-tournament:fixtures/corpus.json`; regenerated here by
  `python3 fixtures/build_corpus.py` → `types=16 records=36 cases=119 state=16 cb=9`).
- **Reproduced byte-identically on a different machine and a different Python (3.11.15 vs the lab's
  3.14.4):** `corpus.json` sha256 `e872cc2f…8f6e515`, matching `fixtures/SHA256SUMS` and
  `lab-tournament:HASHES.md`. `oracle/oracle_results.json` re-derived to sha256 `a29c8515…7ea3`, matching
  the seal. `evo100_closure.json` `1da7333a…` and `evo100_receipt_py.json` `bb01fd95…` likewise.
- Sides: pure-Python oracle `oracle/oracle.py` (328 lines, its own decoder + `abi_min` re-encoder) vs
  Solidity `sut/src/Codec.sol` (138 lines, "inline-checked (NOT re-encode based) so it shares no logic
  with the Python oracle") + `sut/src/Consumers.sol` (282 lines).
- Comparison: `harness/diff.py` (31 lines) — re-run here: `cases 119  agree 119  mismatch 0`.
- Arms per `RESULTS/result_matrix.json`: `N_EXACT 19, N_PRED 19, ARCH 17, N_SEMISS 11, N_SEMPIN 11,
  N_FIN 10, A_EXACT/A_FIN/A_PRED/A_SEMISS/A_SEMPIN 6 each, N_SEMOPEN 2` = 119.
- Round-1: **14 of 119 disagreed** (`RESULTS/failure-corpus/round1_mismatches.json`), triaged
  10 ORACLE_BUG (cluster A: the oracle compared binding *names* against a set of binding *IDs*) and
  4 GENUINE_FINDING (cluster B: `N_PRED` on 5-field notes — oracle accepted, SUT rejected)
  (`RESULTS/failure-corpus/round1_triage.md`).
- Also recorded: **19/19** effects/callback/realm rows (`RESULTS/effects_results.json`) and **6/6**
  lens/partial/withdrawal rows (`RESULTS/lens_partial_results.json`).

### 2.2 Attack acceptances (the H3 result)

`MORNING-REPORT.md` §3: "EXACT 0, FINITE_SET 0, SEMPIN 0, SEMISS 1 (stolen-key twin), PRED 2 (units twin
+ hidden delegate)". Verified against `RESULTS/result_matrix.json` + `oracle/oracle_results.json`:
`A_PRED.r_act_twin=EFFECT`, `A_PRED.r_act_v2_deleg=EFFECT`, `A_SEMISS.r_act_twin=EFFECT`;
`A_EXACT/A_FIN/A_SEMPIN` produce `EFFECT` only on the two honest records. Correct.
(Wording slip: "of 6 hostile action cases" — there are 6 action *records*, 4 of them hostile.)

### 2.3 Gas (`RESULTS/gas_results.json`, verbatim)

| arm | cold | warm |
|---|---|---|
| `N_EXACT` | 97,170 | 97,153 |
| `N_FIN` | 97,220 | 97,203 |
| `N_SEMPIN` | 97,783 | 97,766 |
| `N_SEMISS` | 99,596 | 97,579 |
| `N_PRED` | **102,389** | 102,372 |
| `A_EXACT` | 66,880 | 66,880 |
| `A_FIN` | 66,930 | 66,930 |
| `A_PRED` | **72,240** | 72,240 |
| code | `Consumers` 10,337 B · `MiniLens` 364 B · `envelope.calldata.r_note_ok` 320 B | |

`MORNING-REPORT.md` §3 draws from these: "**Pinning a TypeId costs ≈0.05%**". That 0.05% is
97,220 / 97,170 — the EXACT→FINITE_SET delta, both of which pin. The pinned-vs-unpinned deltas the file
actually supports are **+5.4 %** on notes (102,389 / 97,170) and **+8.0 %** on actions
(72,240 / 66,880), in the direction the report intends but an order of magnitude larger. See **F24-15**.
Two further numbers in the same paragraph — "Guarded callback overhead: honest 22.5k; returndata-bomb
contained at 122k" — appear in **no** committed artifact; `sut/test/Effects.t.sol` lines 98 and 111 emit
them as `emit log_named_uint` console lines only.

### 2.4 EVO-100 (`RESULTS/evo100.md`, `fixtures/evo100.py`, `sut/test/Evo100.t.sol`)

100 Types = **16 carried from the corpus + 84 explicitly synthetic** ("scale-only/{i}: synthetic closure
member"). Python 3 cold runs → 100/100, Solidity 3 cold runs → 100/100, **common rollup
`0xb8fe7249a387ba6af09c8dac567bd5366445bf582027970af9733019879d0fd7`** in both receipts. Reproduced here
for the Python side. The Python arm's "reconstruction" is
`type_id(t["meaning"], t["fields"]) == t["typeId"]` where `t["typeId"]` was written from those same two
inputs 40 lines earlier — a determinism check, not a reconstruction from independent bytes (**F24-13**).
The load-bearing part is the cross-runtime rollup match, plus the honestly disclosed seed bug:
"the first run's rollups diverged because the Python fold seeded with empty bytes while Solidity seeded
with a zero word" (`RESULTS/evo100.md`).

### 2.5 The five law-completion breaks (`overnight2/SEAMS-REPORT.md`)

Workflow `wf_3151a28d-4e2`: 9 agents = 3 build lanes × (1 builder + 2 adversaries). Builders:
`lane-completeness/completeness_engine.py` (508 lines), `lane-lineage/lineage_upgradable.py` (295),
`lane-anylink/any_link_model.py` (428). Six adversary scripts. All pure Python; **all six re-run here
and all reproduce their printed verdicts.**

1. **Merged absence leak** — `merge_results` emitted `PARTIAL/ABSENT` with `proves_absence()=True` on
   empty pages, and the verdict was order-dependent on identical inputs.
   Reproduced: `merge_results([A_absent, B_unknown]) = <PARTIAL/ABSENT …> proves_absence=True` vs
   `merge([B_unknown, A_absent]) … proves_absence=False`.
   Law: *"a merged result may prove absence only if every input was COMPLETE on the same basis."*
2. **Domain-blind basis** — two shards differing only in whether the query domain was closed collided
   on identical basis tuples (`gen=17, cmt=81bfec37…`), bypassing the mixed-basis refusal. Reproduced.
   Law: *"the basis commitment must bind the declared Type set and the domain-closure flag"* (a
   `domainCommitment` inside the postings basis).
3. **Lineage precision** — Object anchoring gives 5/5 recall but resolves 30/30 ordered pairs,
   **precision 0.167**, accepting time-reversed edges. Reproduced.
   Law: *"a lineage link = stable Object anchor (continuity) + exact parent recordId
   (precision/direction). A pair, not a substitution."*
4. **UNVERIFIED flood** — 100,000 attacker `UNVERIFIED` links admitted against one victim;
   `BACKLINK_CAP=64` protected only the *verified* index. Reproduced (at 50,000 in the U2 arm).
   Law: the UNVERIFIED escape hatch needs its own admission bound and a capped, evictable index.
5. **Work ≠ nodes** — traversal reported `visited=1024 (MAX_NODES)` while performing 101,059 operations
   with a 100,001-frame stack. Reproduced: `PEAK stack/frontier size : 100,000`.
   Law: traversal bounds must cap **edges examined and stack depth**, not visited nodes.

Net verdicts: "No seam falsified the architecture. All five breaks are **law-completion requirements**."

### 2.6 The rejected ledger (`RESULTS/rejected-ledger.md`)

Seven demotions/kills, each with the kill criterion and the exact evidence key:
`EAS_LIKE_CALLBACK` naive **KILLED** (`callback.naive.revert=ACTION_DEAD`, `…gasgrief=OOG_DEAD`);
guarded **DEMOTED** to Realm-local admission policy (`callback.mutable.reinterpretation=ANSWER_CHANGED`);
`CONSUMER_PREDICATE` shape-prefix **KILLED** for effectful consumers; exact-shape flavour **DEMOTED**
("it is EXACT in disguise"); `SEMANTIC_VIEW` issuer-gated **DEMOTED to explicit opt-in, never default**;
ungated `SEMANTIC_VIEW` **KILLED** (`N_SEMOPEN.r_twin.forge=ACCEPT`); address-keyed validator meaning
**KILLED** (`address.meaning.mutated=ADDRESS_NOT_MEANING` while `address.identity.stable=IDENTITY_UNCHANGED`).
Survivors: `EXACT`, `FINITE_SET`, `SEMANTIC_VIEW` consumer-pinned, issuer-gated for inert reads only,
`ARCH` with unconditional raw retention, guarded-callback pattern as Realm-local policy.

**This ledger is the single most useful artifact on the branch.** It is the only place in the whole vault
(main or branch) where an architecture arm is retired against a named, mechanically applied criterion with
a machine-checkable evidence key.

## 3. Per-document summary and standing

| file | lines / size | what it is | standing |
|---|---|---|---|
| `lab-tournament:HYPOTHESES.md` | 140 | pre-registration: H1–H5, pre-registered expectations E-H1..E-PRED, five comparator arms with acceptance semantics, four-result H4 vocabulary, corpus plan, attack classes, kill criteria, stop conditions | **sealed before work** (`89091a4` contains only this + MANIFEST). Genuine pre-registration; the strongest methodological feature of the branch. |
| `lab-tournament:MANIFEST.md` | 74 | source-lock (5 files, sha256), toolchain lock, C0 alignment, independence declaration with an honest limit ("both are written by the same agent (Fable) in one night"), other-agents state, and a flagged rule violation | sealed at `89091a4`; accurate where checkable. |
| `lab-tournament:MORNING-REPORT.md` | ~12 KB | verdict table for H1–H5, artifact paths, headline numbers, SDK implications 1–5, Explorer implications, "Owner questions: **None**", one recommended next experiment (T4/G2) | the branch's synthesis. Several claims outrun the committed artifacts — F24-9, F24-11, F24-12, F24-15. |
| `lab-tournament:RESULTS/rejected-ledger.md` | 7 rows | demotion register with kill criteria and evidence keys | **solid**; every key resolves to a row in `effects_results.json` or `result_matrix.json`. Unsealed (F24-8). |
| `lab-tournament:overnight2/SEAMS-REPORT.md` | ~5 KB | night-2 seam tournament: 3 builders vs 6 adversaries, the five breaks, "What held", freeze-text demands | synthesis. Contradicted in two places by its own committed scripts — F24-5, F24-6. Sealed. |
| `lab-tournament:fixtures/{build_corpus,evo100,abi_min,keccak}.py` + `corpus.json` | 298/91/80/71 | deterministic sealed corpus generator and closure | **solid, independently reproduced here.** `build_corpus.py` fails its own recorded hash (F24-8). |
| `lab-tournament:oracle/oracle.py` | 328 | independent Python decoder + five read arms + five effect arms + ARCH | **solid, reproduced byte-identically.** Contains the hardcoded `ACT_V2` special case (F24-10). |
| `lab-tournament:sut/src/{Codec,Consumers,Effects}.sol` | 138/282/174 | generic schema-driven `ABI_TUPLE_V0` decoder, the arms, and an equip/treasury state machine with callbacks | **cannot be rebuilt from the branch** (`sut/lib/forge-std/` is gitignored and absent; no forge/solc here) — F24-12. `Consumers.sol` dispatches on caller-supplied type-name strings (F24-10). |
| `lab-tournament:sut/test/{Tournament,Effects,LensGas,Evo100}.t.sol` | 68/165/154/109 | the runners that emit the four result JSONs | several rows are unconditional string literals (F24-11). `Evo100.t.sol` and `LensGas.t.sol` are unsealed. |
| `lab-tournament:RESULTS/failure-corpus/*` | 3 files | the preserved 14-case round-1 divergence + triage | **model behaviour**: preserved before any fix, exactly as `HYPOTHESES.md` §"Stop conditions" required. Unsealed. |
| `lab-tournament:overnight2/lane-*/` | 12 files, ~2,500 lines | three builder models and six adversary scripts | **solid and reproducible**; I re-ran all six adversaries. One prints a verdict the report does not carry (F24-5) and one an extra break (F24-6). |
| `lab-tournament:HASHES.md` | 4 KB | the seal | **1 of 33 entries fails**; 12 present files are unsealed, including the entire Solidity output set (F24-8). |

## 4. Lane question 3 — do the five breaks correspond to main-branch findings?

| lab break | nearest `main` design statement | already stated on `main`? | integrated anywhere? |
|---|---|---|---|
| **1. Merged absence leak** | `SA/chapters/b0-lens.md` §6 T2/T7/T10 ("`ABSENT` (proved: every missing head is proven absent)"), §6.2 line 500 "**Anti-fallthrough**: a tier is passed over only on *proved absence*", §7.3 line 707 "`UNKNOWN` never degrades to `ABSENT`", line 614 `REASON_COVERAGE_PARTIAL … # never ABSENT`; `b0-indexes.md` line 1326 "An initial (`cursor == 0`) `COMPLETE` with empty `items` proves the index answer is empty", line 1330 "Whole-query absence requires the complete cursor chain" | **Partly — for one source.** The invariant exists for point reads and for a single index's cursor chain. There is **no cross-source merge rule anywhere in B0**: grep for `merge`/`combin` in `b0-indexes.md` returns 3 hits, none a composition law. | **No.** Not on `main`, not on `readiness` (`git grep -il tournament origin/codex/v2-readiness-week` → one unrelated hit, `layered-type-system-and-data-abi.md:229` "symmetric architecture tournament"). |
| **2. Domain-blind basis** | `SA/chapters/b0-realm-admission.md` §2.5 lines 259–264: `RealmRevisionId = keccak256(abi.encode(DOM_REALM_REVISION, realmId, keccak256(revisionDescriptorBytes)))` with `revisionDescriptorBytes = abi.encode(revisionOrdinal, implementationCodehash, policyCommitment, upgradeAuthorityRef, activatedAtBlock)`; `b0-indexes.md` line 1166 `bytes32 realmBasis; // RealmRevisionId under which the page was computed` | **No.** The basis binds the Realm's code, policy and ordinal; it binds **neither the declared Type/index set nor any domain-closure flag**. The nearest guard is `b0-indexes.md` line 1611 "Undeclared/invalid is not absence" and line 1339 "'declaring an index later' cannot imply complete historical absence" — prose rules, not a commitment field. | **No.** This is the executable form of `SA/chapters/vectors-and-falsifiers.md` AA-5 (line 1143, "**PARTIAL-backfill-reads-as-absence** … ABORT-ARM (F4)") and of R7b CF-R7b-1's closing sentence ("adding a kind after genesis is exactly the PARTIAL-backfill-reads-as-absence hazard"). AA-5's vector class is single-index coverage; it does not cover merge composition or basis collision. |
| **3. Lineage pair rule** | `Designs/efsv2/hierarchical-files-and-folders.md` §3.4 lines 449–464: `FileRevision/1 { node ref(object ObjectGenesis/1) … parents array(max=8, ref(record self)) }` with "parents are unique and bytewise sorted; **every parent names the same File Object**" | **Yes, verbatim, and it predates the lab** (last touched `02bdae9`, 2026-08-14) **and it was inside the source-locked tree** (identical at `2573f08`). `SEAMS-REPORT.md` §"What this means for the 100-year freeze" claims "None of these existed in prose before tonight" — false for this one. | n/a — already on `main`. The lab independently *falsifies the anchor-only alternative*, which is real corroborating value. |
| **4. UNVERIFIED flood** | B0 has **no UNVERIFIED link class**: `SA/chapters/b0-realm-admission.md` line 806 "Forward references (j > k) are rejected (`E_REF_UNSATISFIED`)"; grep for `unverified` across the Stage A chapters returns only content-locator prose about gateway bytes | **N/A by construction.** B0 forbids the mechanism the break attacks. | **No** — and it should not be. This is a reserved-seam note for any future late-binding/cross-Realm reference class, not freeze text for B0. |
| **5. Work ≠ nodes** | `SA/chapters/b0-indexes.md` §4 fan-out `C(leaf) = 3 + 2·refInstances + valueSpecs ≤ 43`, `F_MAX = 44`; `b0-content-locators.md` `MAX_CLOSURE_WALK_DEPTH = 16`, `MAX_CLOSURE_MEMBERS = 16` | **Partly.** B0's write-side caps are edge-shaped already. The break bites on the *read/walk* side, which B0 pushes to the client tier (`hierarchical-files-and-folders.md` lines 1066–1077 "client-bounded enumeration"). | **No.** Belongs in the SDK/client walker contract, not in Core freeze text. |

**Against the other main-branch findings the task named:**

- **Complete directory enumeration / `BindingScope`** (R7b CF-R7b-1, blocking + MVP): the lab does not
  touch it. Breaks 1–2 *sharpen* it — they are the first executed demonstration that "declare an index
  after genesis" plus "merge two sources" produces a false proof of absence — but the lab has no Binding,
  no directory, no `BindingScope`, and its `SEAMS-REPORT` never names them.
- **Two-signature writes / ERC-1271 gas** (R1 F11, R10 F6): **completely untouched.** There is no
  `ecrecover`, no `ECDSA`, no `vm.sign` anywhere on the branch (grep over `sut/src/*.sol`,
  `oracle/oracle.py`, `fixtures/*.py`). The "stolen issuer key" is the JSON string `"issuer-stolen"`, and
  both implementations define `ISSUER_SIGNED = {b for b in bindings if b.auth in ("issuer","issuer-stolen")}`
  (`oracle/oracle.py` line 163; `sut/flatten.py` `ISSUER_BINDINGS`). H2's headline result is therefore a
  restatement of the fixture's own definition, not a cryptographic finding (**F24-14**).
- **PARTIAL-backfill-reads-as-absence**: see break 1/2 above — the lab's strongest genuine contribution.
- **Lens tombstone fall-through**: `lens_partial_results.json` records `lens.unknown.first=UNKNOWN_STOP`,
  `lens.conflict.stops=STOPPED`, `lens.absent.then.found=FOUND_FALLBACK` — the same three transitions
  `b0-lens.md` §6.2/§7.3 already pins. **Corroboration of an existing invariant**, in a 364-byte
  `MiniLens`, not a new finding. It does not exercise `BindingTombstone/1`, `OccStatus`, or
  no-resurrection (`b0-binding.md` §3.4), so R7b's tombstone material is untouched.
- **ERC-1271 gas** (`b0-principal-authority.md` line 662, `ERC1271_VERIFY_GAS` "200,000 measurement
  candidate; not frozen"): untouched. The lab measures no verifier.
- **`DIGEST_EQ` digest lookup** (R7b CF-R7b-4, WRONG + MVP): untouched. No digest index, no
  `lookupByDigest`, no content Types on the branch.
- **Source-unavailability result shape** (`b0-content-locators.md` §12 "Honest behavior when a source
  basis is unavailable"): the lab's kill criterion "unavailable→invalid/absent/success coercion"
  (`HYPOTHESES.md` §"Kill criteria") is the same rule, and `MORNING-REPORT.md` §4 item 3 —
  "SDK must return admission receipts as (realmId, policyRev, stateBasis, result) tuples — **never a bare
  boolean**" — is a clean, quotable statement of it. Corroboration, not resolution.

**Net:** the lab **resolves no main-branch finding** and **worsens none**. It corroborates three existing
invariants (Lens anti-fall-through, the Files lineage pair rule, honest-unavailability), independently
falsifies two arms `main` never wrote down (anchor-only lineage, ungated semantic views), and contributes
**two genuinely new requirements** (merge-composition absence law; `domainCommitment` in the basis) that
sit on the exact seam R7b already flagged as blocking.

## 5. Lane question 4 — is the lab referenced anywhere?

Greps run 2026-09-03:

- `main`: `tournament`, `freeze-seam`, `EVO-100`, `lab/2026-08-26`, `fable-consumer`, `law-completion`,
  `119/119`, `SEMPIN`, `rejected-ledger` — **every hit is inside this review's own output**
  (`Reviews/2026-09-02-efs2-coherence-and-mvp-readiness-review.md` lines 8, 95, 233;
  `Reviews/2026-09-02-efs2-coherence-review-corpus/{README.md:52, maps/R17…:5, seams/S13…:102,
  seams/S10…:327, seams/S5…:475}`). **Zero hits in `Designs/`, `Kanban.md`, `Open-Decisions.md`,
  `Decisions.md`, `Milestones.md`, `Reviews/README.md`, or any pre-existing `Reviews/` corpus.**
- `origin/codex/v2-readiness-week`: one hit for `tournament`, unrelated
  (`Designs/efsv2/layered-type-system-and-data-abi.md:229`). Zero for everything else.
- `origin/codex/sdkv2-pm`, `origin/codex/data-explorer-pm`: **zero hits for every pattern.**
- `Daily Notes/agent-status.md` §"## 2026-08-26" carries exactly **one** line, from
  `@web-client-os-pm`. There is no Fable tournament line. `AGENTS.md` line 55 makes it mandatory:
  "**Append one dated line to `Daily Notes/agent-status.md` per work session** — it's how the swarm sees
  state without reading `git log`". `lab-tournament:MANIFEST.md` §"Other agents' state at lock"
  acknowledges the omission and asserts the mission rule wins.

**So: yes, this evidence is invisible to the coordination surface.** The vault's own mechanism for one
session to see another's state has no record that the lab ran, the branch has no PR, and
`scripts/open-decisions.sh` cannot see it. The direct cost is measurable: the readiness branch's own gap
list is stale because of it — `readiness:Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` line 293
lists "A generic Solidity `ABI_TUPLE_V0` runtime parser and a wider multi-Type" under **Remaining work**,
and `lab-tournament:sut/src/Codec.sol` + `Consumers.sol` are exactly that, executed over 16 Types, six
days earlier on the same codec (**F24-16**).

## 6. What this set assumes about its neighbours, and whether they agree

| assumption | about | where stated | neighbour agrees? |
|---|---|---|---|
| The C0/v0 `ABI_TUPLE_V0` envelope + canonical decode-then-re-encode is the body law to test | efsv2 / readiness | `MANIFEST.md` §"Alignment with EXP-C0/v0"; `HYPOTHESES.md` §"Common substrate" | **readiness: yes** (`readiness:…exp-c0-v0-control/README.md` 111, 136). **main Stage A: no** — `b0-encoding-and-ids.md` §2.1 picks packed offset-free MC/1 and names `abi.encode` as the rejected delta. |
| Realm admission returns a `(realmId, policyRev, stateBasis, result)` receipt, never a bare boolean | efsv2 | `MORNING-REPORT.md` §4 item 3; `HYPOTHESES.md` §"Four separate results" | **yes** — `b0-indexes.md` line 1166 `realmBasis`, `b0-lens.md` line 654 `realmRevisionId`, `b0-principal-authority.md` line 586 `(PrincipalId, AuthorityBasisWord[, contractCodehash], RealmRevisionId, …)`. |
| The Lens combiner must never treat UNKNOWN/CONFLICT as absence; "the stop rule is 6 lines and must not be 'simplified'" | efsv2 | `MORNING-REPORT.md` §4 item 4 | **yes** — `b0-lens.md` §6.2 line 500, §7.3 lines 706–707. Already a DERIVED INVARIANT there (`b0-lens.md` line 1012, JR-1). |
| Anchoring alone does not solve revision lineage; the pair (anchor + exact parent) does | efsv2 (Files) | `SEAMS-REPORT.md` break 3 | **yes, and `main` got there first** — `hierarchical-files-and-folders.md` §3.4 lines 449–464. |
| "Production coordinates `BLOCKED_BY_CORE_INPUT` (V2-F1 owns them)" | owner / efsv2 | `MANIFEST.md` line 12 | **yes** — `Open-Decisions.md` lists V2-F1 as waiting-on-evidence; nothing here claims a byte, ID or cap. |
| No owner question arises from this work | owner | `MORNING-REPORT.md` §6 "**None.**" | **contested.** The lab itself made a spec choice (predicate acceptance pins exact shape, `round1_triage.md` cluster B) and asserts five freeze-text requirements, none of which has an owner or a queue. |
| The lab may skip the vault's agent-status rule | vault-process | `MANIFEST.md` §"Other agents' state at lock" | **no** — `AGENTS.md` line 55; `Onboarding/authority.md` recording rules. |

## 7. Decided vs undecided vs docs-disagree-with-a-ruling

**Decided (and correctly honoured here):** nothing is adopted; no protocol bytes, canonical Type IDs,
freeze claims or owner decisions are produced (`MANIFEST.md` lines 5–13) — consistent with the brief's
"Propose freely; adopt nothing" and with `Open-Decisions.md` **Ask now: 0**. The greenfield ruling is
not engaged (the lab has no v1 surface). The `V2-C1` / `goCodeAuthorized=false` state is recorded at lock
and explicitly not changed.

**Undecided, surfaced only here:**
1. Whether the merge-composition absence law and the `domainCommitment` field enter the B0 index/basis
   design (owner: efsv2; MVP-relevant via CF-R7b-1).
2. Whether `CONSUMER_PREDICATE` acceptance pins exact shape — decided *by the lab* in
   `round1_triage.md` cluster B, recorded nowhere else.
3. Issuer-key lifecycle policy for semantic bindings ("rerun SEMISS with a *Realm-revisioned* issuer
   registry", `MORNING-REPORT.md` H2 row) — efsv2 + owner if it touches Principals.
4. Whether the guarded-callback pattern is admissible as Realm-local admission policy
   (`rejected-ledger.md` row 2) — efsv2; `b0-lens.md` CF-8 (`vectors-and-falsifiers.md` line 1110) says
   a contract Lens read calling arbitrary authority callbacks is a REDESIGN-B0 falsifier, so the two
   need reconciling.

**Docs disagreeing with a ruling:** none — the branch touches no ruling. It disagrees with a *pin*:
`ABI_TUPLE_V0` vs `b0-encoding-and-ids.md` §2.1's MC/1 selection (F24-3), and it disagrees with its own
scripts twice (F24-5, F24-6).

## 8. Concrete defects and stale facts (verified, not inherited)

1. `HASHES.md` line 8 records `b0263e40…40ab  fixtures/build_corpus.py`; the committed file hashes
   `16256db73a9cd12a730f7a6369b8616191e9abb14c20e9ddaded5f9595c3aa12` ≠ that value. `sha256sum -c` over the whole seal: **32 OK, 1 FAILED.** Cause: `a72fb30`
   ("make corpus builder path-safe") edited the file after `2d0514b` wrote `HASHES.md`.
2. 12 committed files are absent from the seal, including **every Solidity output**:
   `sut/sut_results.json`, `sut/effects_results.json`, `sut/lens_partial_results.json`,
   `sut/evo100_receipt_sol.json`, `sut/sut_cases.json`, plus `harness/diff.py`,
   `RESULTS/rejected-ledger.md`, `RESULTS/failure-corpus/*`, `sut/test/{Evo100,LensGas}.t.sol`,
   `sut/flatten.py`, `fixtures/SHA256SUMS`, `fixtures/evo100_fields.json`.
3. `sut/lib/forge-std/` is in `.gitignore` and absent; no forge invocation log is committed; no
   `forge` or `solc` is present in this environment. The Solidity half of every headline is a frozen
   JSON I cannot regenerate. The Python half I regenerated byte-identically.
4. `MORNING-REPORT.md` §3 "Guarded callback overhead: honest 22.5k; returndata-bomb contained at 122k" —
   no artifact; console `emit log_named_uint` only (`sut/test/Effects.t.sol` lines 98, 111).
5. `MORNING-REPORT.md` §1 H1 "**0 of 119 verdicts and 0 identities changed** under any current-state
   change" — `sut/test/Tournament.t.sol` runs the 119-case loop exactly once
   (`test_runTournamentAndWriteResults`); there is no replay after `vm.etch`, withdrawal or policy
   revision. The backing is two rows in `effects_results.json` plus one in `lens_partial_results.json`.
6. `effects_results.json` rows `tworealms.recordId.shared = "SAME_ID"` and
   `address.identity.stable = "IDENTITY_UNCHANGED"` are computed in the test body from string literals
   (`sut/test/Effects.t.sol` lines 133–139, 149–150: `recordId = keccak256(abi.encode("DOM_RECORD", typeId,
   keccak256(env)))` compared to an identical recomputation). `callback.guarded.bomb = "CONTAINED"` is an
   unconditional literal (line 110). H4's "two-Realm split" evidence involves no Realm implementation.
7. `harness/diff.py` compares only `outcome`; `def norm(o): return o` is dead code, and `sut_results.json`
   rows carry `{id, consumer, outcome}` only. `MORNING-REPORT.md` §4 item 2 — "error symbols
   (`E_ABSENT_NONZERO`, `E_NONCANON_OFFSET`, …) matched across languages" — is **not measured** by the
   differential; the SUT never emits a symbol into the compared artifact.
8. `oracle/oracle.py` line 287 `if RECORDS[recname]["type"] == "ACT_V2": return ("DECODE_ONLY", …)` and
   `sut/src/Consumers.sol` line ~210 `if (keccak256(bytes(recType)) == keccak256(bytes("ACT_V2"))) return
   "DECODE_ONLY";` are the same stipulation in two languages, and both sides are handed the type *name*
   by `sut/flatten.py` (`recTypes`) rather than deriving it. `A_SEMISS.r_act_v2_deleg = DECODE_ONLY` is
   the answer written into both implementations.
9. `SEAMS-REPORT.md` §"What held": "no self-class forward successor rule can resolve old→new without a
   hash fixed point or ambient/latest acceptance … Anchoring is the only path."
   `overnight2/lane-lineage/verify_seam_direction_pred.py` (committed, sealed, re-run here) prints:
   "LANE RESULT: **FALSIFIED (headline conclusion)** … 2. A predecessor-aware self-class rule (the
   corpus's OWN N_PRED arm) resolves the seam 5/5 with 0 breaks, NO hash fixed point, NO ambient/latest".
10. `SEAMS-REPORT.md` §"What held": "Dangling VERIFIED links denied at admission."
    `overnight2/lane-anylink/verify_unverified_unbounded.py` ATTACK U4 (re-run here) prints
    "decoy admitted with zero byte/type validation : ADMITTED … resolve(decoy, VERIFIED) : PRESENT …
    attacker got VERIFIED/PRESENT for a junk target? : True". That is a **sixth** break, reported as five.
11. `MORNING-REPORT.md` §3 "Pinning a TypeId costs ≈0.05%" is the EXACT→FINITE_SET delta
    (97,220/97,170); the pinned-vs-unpinned deltas in the same file are +5.4 % and +8.0 %. The number has
    already propagated into `Reviews/2026-09-02-efs2-coherence-and-mvp-readiness-review.md` lines 95 and
    233 ("pinning an exact Type costs about 0.05% of gas").
12. `RESULTS/evo100.md` "100/100 TypeIds recomputed from descriptor bytes alone" — `fixtures/evo100.py`
    recomputes from the same `(meaning, fields)` pair it used to write `typeId` a few lines earlier, and
    84 of the 100 are synthetic (`"scale-only/{i}: synthetic closure member"`).

## 9. Lane question 5 — solid, disposable, and how the vault should record it

**Solid evidence (keep, cite, reuse):**
- The **sealed corpus + oracle**: reproducible byte-for-byte across machines and Python versions. This is
  a ready-made conformance corpus for any `ABI_TUPLE_V0` implementation.
- The **rejected-architecture ledger** with per-arm kill criteria and evidence keys.
- The **generic Solidity `ABI_TUPLE_V0` schema-driven parser** (`sut/src/Codec.sol`) — the artifact the
  readiness control lists as remaining work.
- The **five (six) law-completion breaks**, each backed by a re-runnable script. Breaks 1–2 are the
  branch's most valuable output for `main`.
- The **preserved round-1 failure corpus** and its triage discipline.
- The **EVO-100 cross-runtime rollup match** (Python and Solidity agree on one 32-byte fold over 100
  TypeIds) and the disclosed seed-encoding bug — a real cross-language receipt-spec lesson.
- The **pre-registration** itself: `HYPOTHESES.md` sealed in its own commit before any code.

**Disposable (do not carry forward):**
- Every fixture-local ID, domain tag, cap and constant (`TRANSFER_CAP`, `RECIPIENT`, `ISSUER`,
  `DOM_*` = `EFSLAB/TOURN-2026-08-26/*`).
- All absolute gas numbers — the report itself says "Absolute values are inflated by the deliberately
  unoptimized generic decoder and string dispatch; only deltas are meaningful."
- The RPG/science/notes narrative corpus as a *design* input; it is a test vehicle, not a Type proposal.
- The 84 synthetic EVO-100 Types.
- The `EAS_LIKE_CALLBACK` machinery beyond the one-line verdict in the ledger.
- The duplicated `RESULTS/` copies of `sut/*.json` (identical bytes, two paths).

**How the vault should record it — the 2026-08-13 evidence-round pattern, exactly.**
`Reviews/2026-08-13-claude-evidence-round/` has `README.md` (status line "corrected, fully recovered
dated research record; not a design, ruling, or owner packet", commissioner, method, authority) +
`CORRECTIONS.md` (a two-column register "Original compression or raw claim | Durable wording", with the
standing instruction "When a raw memo conflicts with this register, cite the raw observation with the
qualification here—not its broader analyst conclusion") + `corpus/`. Recommendation:

1. Land the branch content as **`Reviews/2026-08-26-efs2-consumer-tournament/`** with the same three
   parts: `README.md`, `CORRECTIONS.md`, `corpus/` (fixtures, oracle, SUT, results, overnight2).
2. `CORRECTIONS.md` must carry at minimum these rows, all verified above:
   "119/119 differential agreement" → *agreement after 10 oracle bug-fixes and one alignment of the
   oracle to the SUT on the single genuine semantic disagreement; the round-1 corpus is preserved*;
   "5 law-completion breaks" → *six; U4 (self-granted VERIFIED existence proof) is in the committed
   script and not in the report*; "None of these existed in prose before tonight" → *the lineage pair
   rule is `hierarchical-files-and-folders.md` §3.4 lines 449–464, dated 2026-08-14 and inside the
   source-locked tree*; "Anchoring is the only path" → *contradicted by the branch's own
   `verify_seam_direction_pred.py`*; "Pinning a TypeId costs ≈0.05%" → *that is the EXACT→FINITE_SET
   delta; pinned-vs-unpinned is +5.4 % / +8.0 %*; "0 of 119 verdicts changed under any current-state
   change" → *the 119 cases were run once; three targeted checks back the claim*; "EVO-100 cold
   reconstruction 100/100" → *determinism + cross-runtime rollup agreement over the generator's own
   inputs; 84 of 100 Types synthetic*; "error symbols matched across languages" → *not measured; the
   differential compares a five-symbol outcome alphabet only*; "the two implementations share no
   acceptance function" → *both hardcode the same `ACT_V2` type-name special case and both are handed
   the type name by the flattener*; "stolen issuer key" → *a JSON label; no signature is verified
   anywhere on the branch*.
3. `README.md` must state the codec scope in the first screen: **this corpus tests `ABI_TUPLE_V0`, which
   `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md` §2.1 rejects for B0.**
4. Re-seal: regenerate `HASHES.md` over every committed file, or delete the stale line; vendor or pin
   `forge-std` and commit the forge run log so the Solidity half is reproducible.
5. Append the missing `Daily Notes/agent-status.md` line under `## 2026-08-26` (AGENTS.md line 55).
6. Route breaks 1–2 into `Designs/efsv2/owner-decision-inbox.md` as evidence against V2-F1 / the F4 cell,
   and cross-reference `vectors-and-falsifiers.md` AA-5, which now has an executed failure mode.

## 10. Solid now / settle first / cut, for an MVP

**Solid now (buildable on today):**
- The sealed 119-case corpus and the Python oracle as an SDK conformance harness for the C0/v0 codec.
- `sut/src/Codec.sol` as the generic Solidity `ABI_TUPLE_V0` parser the readiness control lacks.
- The rejected-architecture ledger as the standing answer to "why not EAS-style callbacks / open semantic
  views / shape predicates" — it is decision-grade for H3 by its own vocabulary.
- The SDK implications 3–5 (receipt tuples not booleans; verbatim
  `FOUND/ABSENT_PROVED/UNKNOWN/CONFLICT/UNSUPPORTED`; raw handle always retrievable) — each already has a
  `main` counterpart, so they are corroboration an SDK lane can cite without adopting anything.

**Settle first (before this evidence is quoted in an owner packet):**
1. The codec scope contradiction (`ABI_TUPLE_V0` vs MC/1) — otherwise every canonicality result here is
   quoted against a wire form B0 does not use.
2. Whether the merge-composition absence law and the `domainCommitment` enter B0 — this is the one place
   the lab moves an MVP-blocking main finding (CF-R7b-1 / AA-5).
3. The correction register above, before any number leaves the branch. The 0.05 % figure has already
   escaped into `Reviews/2026-09-02-efs2-coherence-and-mvp-readiness-review.md`.
4. Whether the branch merges at all, and under whose authority — it is an orphan with no PR and no
   agent-status line.

**Cut for an MVP:**
- Breaks 4–5 (UNVERIFIED bound, work-vs-node traversal caps): B0 has no UNVERIFIED class and pushes
  walking to the client; record them as reserved-seam notes, not freeze text.
- The recommended next experiment (T4/G2 integrated mutation+query state machine) as a *lab* — its
  content should be folded into the Stage B harness, not run again as a standalone overnight lab.
- The RPG/science/notes narrative corpus as anything other than test data.
- The `EAS_LIKE_CALLBACK` arm beyond its ledger row.

## 11. Unverifiable from here
- Everything on the Solidity side: `sut_results.json`, `gas_results.json`, `effects_results.json`,
  `lens_partial_results.json`, `evo100_receipt_sol.json`. No `forge`/`solc` in this environment and
  `sut/lib/forge-std/` is gitignored. The Python half was fully reproduced.
- The toolchain lock (forge 1.7.1 commit `4072e487…`, solc 0.8.30, EVM `osaka`, Python 3.14.4,
  Darwin 25.5.0).
- The claim in `MANIFEST.md` that "`experiments/` contains 16 sibling labs from concurrent agents" — no
  `experiments/` tree exists in the planning repo on any branch.
- Whether `HYPOTHESES.md` was genuinely written before any prior lab was read; the commit ordering is
  consistent with the claim (`89091a4` contains only the two seal files) but ordering is not proof.
