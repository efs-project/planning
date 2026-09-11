# Prototype round 1 — results (2026-09-10, evening)

**Status:** working note on the files-browser branch; not a design and not a
ruling. Three deliverables from the split agreed in
[reconciliation-with-codex-2026-09-10.md](reconciliation-with-codex-2026-09-10.md)
§3, produced by agents under the integration-test-lead's workflow; the
adversarial reviewer for this round hit a session limit, so the lead reviewed
the code by hand (findings below) and re-ran every suite before committing.
Every number is **MEASURED** (retained artifact) unless marked **ESTIMATED**.

## 1. byteCommitment classification matrix — 31 rows, 0 findings

[test/byte-commitment-matrix.test.mjs](test/byte-commitment-matrix.test.mjs),
evidence [evidence/byte-commitment-matrix.json](evidence/byte-commitment-matrix.json).
Every row is an author-signed intent, so only the router's classification
refuses. CREATE_FILE and EDIT refuse a signed **zero** commitment
(`ErrByteCommitment(expected = C(tree), got = 0)`, also mined, status 0x0), a
forged nonzero one, a substitution (intent commits to tree X, publication
carries Y), a bearer swap after signing (refused at the router before Core's
signature check), and a revision whose content ref is not the publication's
own tree leaf (`ErrTemplate(3,8)` / `(1,8)`, which fires first). Every
non-content kind (createDir, renameMove, copy, placement, remove, restore,
tag, untag) refuses a nonzero commitment and accepts zero; an unknown kind
reverts `ErrUnknownKind` before the comparison. The PM's regression — a
future content branch forgetting to set `expectedByteCommitment` — is now a
red row rather than a silent acceptance; any new content kind must add its
zero-signed row. One observation: COPY is content *by reference* and is
classified non-content; its referenced tree is bound only by
`publicationHash` inside the signed digest, so a bearer swapping it is
refused by Core (`ErrUnauthorizedPrincipal`), not by the router.

## 2. Tag joins on the object-keyed reader — K = 1,000 attesters, 4/4 pass

[test/tag-joins.test.mjs](test/tag-joins.test.mjs), evidence
[evidence/tag-joins.json](evidence/tag-joins.json).

- **A → B replacement.** 1,000 principals each routed an author-signed TAG on
  File A (58 s, mean 2,335,692 gas — below the steady tag because the
  author-neutral assertion record is shared across attesters). After the
  placer rebound the name to File B, after a second placement of A, a move, a
  remove and a restore, and one attester's untag: File B had **0** tag entries
  at every stage and File A 1,000 active (then 999 active / 1 inactive).
  Tag-filtered listings tracked the file, never the name. Tags are read
  through the lens, so the 1,000 attesters are visible only through 16
  attester lenses (a plan holds ≤ 64 sources); under a two-principal lens
  they are correctly invisible.
- **Lens masking.** Under [A > B], B's tagged file beneath A's whiteout is
  masked (not a row), and B's tagged file beneath A's untagged file resolves
  to A's file: the tag-filtered listing shows neither. Under [B > A] both show
  tagged. B's name bindings at both positions are live, so a position-keyed
  bit in B's column would have fired on both — the positional counterexample
  the PM asked for, confirmed.
- **Price of the join** (2-principal lens, loopback, `debug_traceCall` gas
  per `eth_call`): unfiltered listing ≈ 11.4 requests / 6.8 KB / 2.21M gas
  per entry; the tag filter adds **+6.30 requests, +3,764 bytes, +572,297 gas
  per entry** (execution 480,548), identical at n = 100 and 200. The join is
  two `getBindingHead` reads (≈ 299k), 0.3 `getRecord` (tagged rows only) and
  the per-row `openTags` seal (`counts` + `fixtureReadContext`, ≈ 135k and 4
  of the 6.3 requests). At **n = 1,000 the reader cannot list the directory at
  all**: the listing alone exhausts `DEFAULT_LIMITS.maxRequests` (4,096) after
  352 rows and returns PARTIAL, honestly, on both arms (ESTIMATED full cost
  ≈ 11,300 requests / 2.2 G gas unfiltered, 17,600 / 2.8 G filtered).
- **Read-side finding.** Every qualified point read costs 150–197k gas of
  which ≈ 120k is `_readBasis()` (library codehash checks plus the 21-word
  ExecutionSet row), not data; `counts()` costs 11k. The in-transaction walk
  estimate in the index-layer document (30–60k per entry) does not describe
  the read side. Two follow-ups: a batched tag read would remove ≈ 4.3 of the
  6.3 join requests per entry; the budget refusal surfaces as
  `reason: SEAL_FAILED` with the real cause only in `detail` because
  `files-reader.mjs:296` overwrites the original failure.

## 3. Generic `FIELD_EQ` family lab — matrix passes; walk measured at 56k/entry

[../2026-09-10-index-layer-lab/README.md](../2026-09-10-index-layer-lab/README.md).
One family over `DirectoryEntry/1.child` declared *after* a 1,000-placement
directory existed, attached at declaration, maintained by a write hook on the
real admission path, backfilled by chunks that derive every bit from on-chain
records (nothing from calldata). Because a populated pair cannot be upgraded
onto a different admission library (the controller pins its codehash), the
hook is an external library wrapped around the pinned kernel, and the U4
core retires the un-hooked operator path. All matrix cases pass (declare
after data; delayed backfill; writes before/during/after chunks; rebind
during build converges; racing builders with and without guard; probe
semantics; page PARTIAL-with-gap → COMPLETE; born-after-declaration scopes
need no slot; detach freezes; cursor across a rebind refused); a 1,003 ×
4-bucket oracle found 0 mismatches.

Measured on today's layout (N = 1,000, retained traces, residual 0):

| item | gas |
| --- | ---: |
| backfill per entry, hot buckets | **56,397** (24 SLOADs = 38,775; plumbing 17,522) |
| largest chunk under 16,777,216 | between 273 (landed) and 288 (out of gas) |
| K10 saving on that walk (ESTIMATED from the decomposition) | ≈ 21,400 per entry → ≈ 33–35k; chunk cap ≈ 450–490, **not 512** |
| sparse arm (64 distinct buckets, incl. slot init) | 79,054 per entry (64 fresh words) |
| hook per placement: warm bucket word / fresh word | 23,354 / 40,454 (wrapper frame self gas) |
| hook per rebind (remove / restore / direct field change) | ≈ 50–100k (≈ 23k of it the O(log N) locator; 20,000 for a new word) |
| `probe` (execution) | 19–24k (design ESTIMATED 6,300; the extra is the double delegatecall + family lookups) |
| `page`, 256 items | ≈ 420k (item materialisation, 4 bit words) |
| coverage-slot init / `declare` | ≈ 76k / ≈ 333k (the `cacheBytes` decode is 145k) |

The design's post-K10 9.5–15k per entry was wrong: the target record's small
body costs 10,500 (whole body loaded), the binding row 4,200, and ≈ 17.5k of
interpreter plumbing per entry shows in no SLOAD count. The judge's 30–60k
"today" estimate was right. N = 10,000 was **not reached**; it is queued.

**Lead's review findings** (the reviewer agent did not run): a latent
position bug when one publication first-binds two positions in the same scope
(both get the last position; no Files operation does this; must be fixed
before any kernel-level hook); withdrawal-driven tombstones are not hooked,
so "a set bit is authoritative" holds only under the Files router's operation
set; attach authority is "anyone" (lab knob).

## 4. What this changes

- The PM's counterexamples hold and are now executable regressions; the
  object-keyed reader is correct and the position-keyed bitmap is, for
  third-party tags, at most a candidate generator.
- The bitmap machinery itself (hook, backfill, coverage, reverting probe,
  basis-committing page, detach) works on a populated world and is priced.
  Its costs are 2–4× the design's estimates on every line; the K10 patch
  Codex delivered is the next measurement, on this lab, against these numbers.
- The reader's per-read `_readBasis()` overhead and its 4,096-request cap are
  the browsing bottleneck at 1,000 entries — the "current browsing" checkpoint
  the PM re-cut — and they are read-side, independent of any index.
