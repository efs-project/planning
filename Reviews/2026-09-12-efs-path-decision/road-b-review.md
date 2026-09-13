# Road B independent review — preserve meaning before pricing

**Date:** 2026-09-12 · **Reviewer:** Codex bounded independent reviewer, session `warroom-road-b-review`.
**Status:** proposal review, not adoption or measured failure. Reviewed Fable's independent v0 against [[README]] and [[overhead-and-selection]], at planning `edb7fe4`; shared coordinator edits were present. No builds, chain runs or code changes.

**Verdict:** keep Road B as a plausible compact counterhypothesis, but repair the following specification gaps before treating its slot estimate as the cost of equivalent EFS. Neither seven Records nor the existing physical layout is required. A stable subject, portable evidence closure and complete queries can use smaller representations.

## Five falsifiers and the smallest useful response

### 1. A path-derived head key is not a stable File identity

**Contradiction as illustrated; repairable ambiguity in the prose.** The API binds the Record directly at `hash("/swaps/eth-usdc")`, while §5.3 calls the head binding key the File identity. Rename `/a` to `/b`: the key changes. Create a different file later at `/a`: the key repeats. Keeping the old key as the renamed object's identity instead requires distinguishing that object from the new occupant and from its current placement. Author-qualified heads also cannot by themselves identify one shared File across competing authors.

**Smallest fix/test:** choose a stable subject shared by competing authors with fresh-instance identity, plus independently changeable name placements and author-qualified heads. This need not be a genesis *Record*. Trace create F at `/a` → edit → move to `/d/b` → recreate G at `/a` → remove/restore F. Require `id(F)` unchanged, `id(G) != id(F)`, preserved history and two authors selecting revisions of F. Current [[../../Designs/efsv2/hierarchical-files-and-folders|Files proposal]] §§3–4 supplies the separation, not a mandatory storage recipe.

### 2. Hash and proof-kind are commitments, not an exportable authorship closure

**Missing specification, not a requirement to store duplicate envelope bytes.** The two-slot Admission has no explicit signature, signed preimage/context or leaf membership; its `basis` is named but undefined. §5.2 additionally mentions the envelope hash. These can point to shared immutable state; they cannot replace it. Alice and Bob publish identical R; export Alice's occurrence after clearing client caches, then withdraw only Alice's assertion. A clean destination must recover the exact signed claim and distinguish both publications without trusting the copier. A hash-only source row cannot supply missing signature/preimage bytes.

**Smallest fix/test:** define the minimum recoverable closure and its carrier, including signature domain, replay/context, occurrence membership and historical acceptance basis. Export one leaf from a two-leaf publication and independently verify it; import without promoting source acceptance into destination authority. If events/calldata are necessary, price their retention/retrieval and label the loss of state-only reconstruction and contract access to that evidence. Compact reconstruction is acceptable.

The native producer example is **genuine local contract authorship** when the producer calls Ledger itself; it is not an EOA surrogate. Its portable proof remains **untested**: identify source Realm/implementation, finalized state-root authentication and the witness proving the historical admission. Change the producer/account implementation before export; never substitute today's account-validation result for old acceptance. Native live reads and retained immutable revisions must remain different API operations.

### 3. An optional-only Index module does not establish the requested indexing boundary

**Boundary mismatch as written; query preservation untested.** Ledger owns mandatory scope/backlink/history lists while the separate Index owns only optional indexes. The sprint explicitly asks to evaluate ingestion and indexing as separate contract responsibilities. More importantly, §2 makes by-Type/by-author/occurrence lookup optional without mapping the existing automatic query obligations to an equivalent bounded state reconstruction. Moving a list is permitted; dropping its promised query is not.

**Smallest fix/test:** list each mandatory query and its owner, then route mandatory maintenance through the indexing responsibility or explicitly propose and justify a boundary exception. Declare optional indexes separately with coverage/backfill. Admit two authors' identical R without opting into anything: required Type/author/occurrence discovery must still work. Force required tag-index failure and require complete publication rollback; show a later optional index as partial until its declared coverage is complete. See [[../../Designs/efsv2/owner-rulings|August 12 ruling]] and [[../../Designs/efsv2/system-constitution|constitution]] “On-chain graph and indexes”; exact physical families remain open.

### 4. `entries, count` does not yet define truthful Lens pagination

**Untested API contract.** Let A mask name `x`, B bind `x`, and B bind `y`. `[A,B]` must not list B's hidden `x` or count two author postings as two visible names. Fetch page one, mutate a name, then fetch offset 50: without a pinned basis/cursor rule, duplicates or omissions are possible. A finite scan through dead names can return zero visible entries without proving an empty directory.

**Smallest fix/test:** define whether count means raw candidates or selected results; bind continuation to Realm revision/basis, scope and Lens; expose bounded progress and complete/partial/unknown outcomes. Use the same point reducer for listing, including explicit mask versus fallthrough semantics. Run two authors, one conflict/mask, one live name beyond the first scan page and one between-page mutation. Read the pages from a real consumer contract and charge candidate scans. The existing [[../../Designs/efsv2/hierarchical-files-and-folders|Files listing algorithm]] §5.3 is a useful oracle, not a required index layout.

### 5. Single-pass acceptance needs an explicit batch observation and replay law

**Untested; view-only hooks also leave stateful rules unsupported until extended.** Publish Item I and Outfit O referencing I in one batch: “refs exist” checked before any write can reject the valid dependency unless pending records are visible. Conversely, an already stored O accepted yesterday must not bypass today's mandatory check when a new author/action reuses it. Two same-batch one-use claims cannot both succeed merely because both view checks see the same unused right.

**Smallest fix/test:** specify ordered-prefix versus whole-plan observation, typed-reference admission requirements, exact-operation retry identity and receipt-bound rule activation/context. A guarded sequential write prefix with transaction rollback is compatible with no in-memory journal. Test I→O, wrong-Type/missing I, new-action dedup, exact retry, import, stale CAS and late mandatory-index failure. Retain view-only acceptance as a named profile; if one-use effects are promised, add and test the bounded stateful boundary described in [[../../Designs/efsv2/programmable-type-acceptance|programmable acceptance]], rather than claiming every rule is view-only.

## Comparison correction

The matched fuller control `ebc7d54` already removed its in-memory journal: Road B earns **no journal-removal saving** against it. Its 10–14 slots and gas ranges remain **estimates**, excluding any newly specified evidence/query obligations until measured. Native/signed × one/two authors is a useful ingress/multiplicity test, not the protocol's neither/authorship/selection/both capability ablation. Keep both distinctions explicit; report complete write/read/reconstruction costs before using the proposed 20% kill threshold to favor Road A.

## Label-retention review — September 13

Codex's bounded reviewer checked the returned, uncommitted `lab-b/LABELS.md`
against contract source `dcc7b94`. It is a useful experiment proposal, not an
adopted layout or measured saving. Five corrections:

- A dictionary can retain the Action/EIP-712 **formats**, but changing Ledger
  changes its checked code commitment and currently its native identity
  derivation. Do not call the signature/profile semantics unchanged.
- A body checked against a FOLDER role supplies the entry name, not its folder
  subject's preimage. Generic HEAD roles, subject IDs and tag concepts are not
  interchangeable text-label coordinates. Keep HEAD bodies empty and specify
  each display-label mapping explicitly.
- Optional preimages do not ensure readable accepted Files. Required names
  must be supplied or already retained at the admission basis, validated and
  exported/imported atomically. A relayer must not omit them while retaining
  an otherwise valid signature. Exact retries cannot backfill missing labels.
- An ordinary Label Record is per `(Type, exact bytes)`, not per placement. Its
  deterministic ID allows direct lookup without a full by-Type scan. Zero
  references/no acceptor does not enforce UTF-8 or a 255-byte cap; existence
  reuse establishes retained bytes, not a new author's acceptance. Occurrence
  withdrawal does not erase the retained Record.
- Price equivalent exact names, freshness, mandatory validation, imports and
  paid retrieval before asserting a slot ratio or reused-name premium. The
  existing Record body-storage helper is not an automatically safe dictionary
  namespace. No speculative gas-repricing estimate was adopted.

**Smallest conservative next probe:** leave Ledger unchanged, register one
fixed lab Label Type in common setup, and compare hash-only create with the
same batch plus a Label PUBLISH for exact ASCII `entry`. Include fresh label,
existing label republished, and existing label omitted; independently retrieve
and hash-check bytes through a paid consumer. This is a client-convention
filename-retention baseline, **not mandatory Files semantics**. A separately
versioned dictionary probe must earn the same readability/import guarantees
before its lower storage cost can win. Folder and tag display semantics remain
part of the joined Files gate.

## Public profile verified — September 13

The declaration/vector supplement at `885d9f9` was reviewed against exact
compiled source `dcc7b94`, not assumed to describe a future corrected profile.
ABI order/shapes, action commitment, domain/typehash/signature framing, derived
IDs, source/packet pins and literal context reconcile. The scratch vector's
registry epoch 6 was corrected to the retained setup's 5. Root reran the ethers
6.15.0 recomputation, including the mutation check: exit 0, digest
`0x777011441f54fdfbd21f90bb78ba40929169222a87982644a5b713fa50ac3074`.

Review corrected the verifier header to call it a candidate-side self-check,
not an independent helper; branch head `2824297` includes that comment-only
repair. This declares the existing name/version-only domain and other limits,
not a replay-domain repair or independent SDK validation. Runtime/code context
reconstruction is retained-input consistency, not authenticated deployment
proof. Supply the public profile/vector to the SDK reviewer; keep this
candidate-side verifier out of its implementation inputs.

## Isolated runner verification — September 13, 06:10 UTC

Fable's `e77f36d` source was copied to the explicitly owned
`codex/efs-warroom-b-run` worktree after its reserved heavy slot ended.
The original worktree is unchanged. No candidate Core or workload change
was made: `f58fc72`, `d600d37` and `155df3a` repair same-receipt-basis
readback, false-success gates and partial-run evidence retention;
`df23bbb` adds the required Solidity `unicode` prefix to one existing test
assertion message. The initial build's parser failure was in that message,
not in deployed contract logic.

Root reproduced **11/11 behavioral Node tests**, then built with pinned
offline solc 0.8.30 / Cancun / optimizer 200 / via-IR / two workers and ran
**32/32 Forge tests**, no failures or skips. Candidate deployables fit
ordinary size limits (Ledger runtime 16,699 bytes); oversized Forge test
contracts are not the deployment path. Build/test logs remain in the
run-owned `efs-road-b-run-20260913.9xQRrd` scratch directory.

The runner preflight found and required six concrete fixes: same-basis
declaration alignment, mismatches rejecting successful finalization,
expected failure selectors/state being asserted, atomic report replacement,
failure-marked watchdog/signals and early deployment evidence attachment.
Independent re-review precedes the actual chain run. These tests do not
close source-origin/import authority, exact Type identity, replay scope,
full Files parity or independent proof gates, and supply no new gas result.
