# To Codex — what happened since your 2026-09-10 intake, what I ruled, what I want next

**From:** James · **Date:** 2026-09-10 · **Re:** `Reviews/2026-09-10-next-foundation-round/` (your `fable-prompt.md`, `codex-prompt.md`, README at `1c5c374` on `codex/mvp-c0-coherence`)

I never sent your Fable prompt. Instead I spent the day with Fable on the
economics, indexing, tags and an "index layer" question, and a lot moved. Your
intake corrections were right; the measured numbers that replace the guesses
now exist. Read the four documents below, tell me where you disagree, and then
we prototype — I expect prototyping to tell us more than another design round.

## Where the work is

Branch `fable/2026-09-09-files-browser` at `12597df` (your intake read it at
`0132e35`). Everything is under `Reviews/2026-09-09-files-browser-mvp/`:

| Document | One line |
| --- | --- |
| `gas-engineering-2026-09-10.md` | measured cost anatomy of a v2 write (tag 2,838,264 gas / 94 distinct slots; SSTORE 46.8%, SLOAD 21.5%, interpreter 28.2%); 12× EAS, 47× ENS; ablation of the unqueryable posting families = 1.26×; lazy-aggregate pattern; Merkle-root-only ruled out |
| `indexing-and-state-2026-09-10.md` | the ten posting families in plain terms; the per-principal directory ordinal already in the kind-10 scope list; bitmap index for my four queries on both gas schedules; state tiers; MUD verdict; dedup and bytecode storage; static-id answer (§4a) |
| `tag-system-2026-09-10.md` | a tag is a concept record (commons + namespaced profiles); every string is a binding; grouping ≠ inference; `TagSet` with DENY; read-time expansion; booru evidence; costs |
| `index-layer-2026-09-10.md` | indexes declared later and crowd-backfilled are safe iff hooked at declaration, per-(family, scope) coverage frontier, reverting reads; six kernel facts verified; K10 (Etched); the v1 sort overlay re-homed as verified snapshot runs |
| `research-2026-09-10/` | every research strand, architect memo and judge report, verbatim, with provenance headers |

Rulings are in `Designs/efsv2/owner-rulings.md` under **2026-09-10**.

## Your intake corrections — status

- **"98.5% SSTORE is a residual, not attribution."** Correct. Fable re-measured with opcode-level traces (`anvil --steps-tracing`): SSTORE 46.8%, SLOAD 21.5%, interpreter/ABI plumbing 28.2%, keccak 0.9% (MEASURED, gas-engineering §2).
- **"104,520 for a fresh 4 KiB chunk is inconsistent."** Correct — it was the idempotent-restage path. Fresh staging measured at 3.01M (MEASURED, gas-engineering §1).
- **"Batching impossibility not established."** Measured instead: cost scales per record (~1.42M/leaf for a 2-leaf tag, ~1.28M/leaf for a 4-leaf directory create); batching amortises only the 21,000 intrinsic.
- **"391 slots / 50× not verified."** The tag is 94 distinct slots (MEASURED, 104 SSTOREs). A second run reports 3,060,354 / ~133 slots; consistent with first-tag-in-scope, but **unreconciled** — the slot-level profile is next step 1.
- **SSTORE2 as a comparison arm, not a dependency.** Agreed and measured: EthFS repeat write 5,158,527 → 5,186 (MEASURED); `EXTCODECOPY` ≈ 2.7k per KB vs 67,200 for 32 cold SLOADs (ESTIMATED). Plus a fact that changes every arm: **EIP-8037/8038 (Scheduled for Glamsterdam, verified today on eips.ethereum.org): fresh slot 22,100 → 110,020; rewrite 5,000 → 12,100; code deposit 200 → 1,530/byte; reads unchanged.** Every cost table now carries both schedules.

## What I ruled today (and what I only leaned on)

- **A / B / C — delegated to engineering** (finish the posting families as bitmaps over the directory ordinal; chunk-level content dedup via a content-only salt plus one pointer slot; record bodies and chunks as bytecode). Direction to measure and prototype; nothing freezes a protocol choice.
- **D-A — ruled.** On-chain, catalog placement (`/clouds/nimbus`) never makes nimbus-tagged items answer a `clouds` query; only an explicit `implies` edge can. Graph-enhanced search may expand on child/implication metadata.
- **D-B — ruled.** One global concept id per canonical string (`NFC → lowercase → space→underscore`); the folding rule is frozen once chosen.
- **D-C — direction.** v1's signed weight (+1 "is nsfw", −1 "is NOT nsfw") survives as assert/deny polarity on the same concept, never a separate tag.
- **D-E — ruled.** ≈ 50k gas per tag at the floor today (≈ 220k under Glamsterdam) is the design target; booru-density bulk seeding by one payer is out of scope; thousands of taggers per item is fine (per-attester columns; reads scale with the reader's lens, not the crowd).
- **D-D — pending, now reduced to one ratification** (below). My 2026-07-15 "mandatory automatic indexing" ruling stands until I answer.

**Leaning, not ruled — I want your view before I decide:**

| Item | Proposal | For | Against |
| --- | --- | --- | --- |
| D-D final form | presence families (kinds 1/3/4/5/6/8/10) total and automatic for every record; predicate families declared as records, attached by the Type author (writers pay) or by a principal to its own scopes, backfillable by anyone; kernel reports the covered interval; strict readers revert outside it | keeps "no per-writer opt-out" literally; removes ~20% of every write and the 110k-per-fresh-slot exposure on lists nobody reads; incompleteness is typed, never silent | a family left out by a Type author needs a paid (now bounded, crowd-payable) backfill; two-tier rule to explain; Stage-A "every declared index is automatic" text needs updating |
| K10 | the kind-10 scope entry stores the **binding-key ordinal** instead of the admission ordinal | every directory walk (listing, backfill, lens resolution) drops from ≈ 30–60k to ≈ 9.5–15k per entry; makes 512-entry backfill chunks fit EIP-7825 | **Etched; must precede `initialize()`**; audit pages that hydrate from the first admission ordinal need one extra read (kind-8 word 0); it is a C0 kernel change — your lane |
| ROSTER | a per-directory placer roster ("who has ever placed into D") | contracts can enumerate a directory's Lens candidates; today "all principals who placed into D" has no on-chain answer | one fresh slot per (principal, directory) at first placement (22,100 / 110,020), forever; grows with sprayers; **cannot be added later**, so "no" is also permanent |
| D-9 | sorted pages choice A: bounded candidates + client materialisation, sorts as L2 snapshot runs verified in O(n) | no live sorted structures (68–127k/insert, Glamsterdam-hostile); anyone builds runs chunk by chunk; assumed downstream since July | contracts wanting live top-N must merge runs or pin materialised runs (+707k per 256-entry chunk); B would give contract sorted pages at a per-write cost we have not measured |

## What I want from you

1. **Review the four documents against your C0 coherence work and flag conflicts.** In particular: `byteCommitment` is now enforced in `FilesRouterV2` (fail-closed — any new content-carrying op kind must set it; `integration-notes.md`); K10 as a pre-`initialize()` change; the mandatory-indexing narrowing versus Stage-A's "every declared index is materialized automatically"; whether `alive` is a genesis kernel family or the tag system's `HEAD_LIVE`; the two measured tag figures.
2. **Say which parts of your `fable-prompt.md` still stand.** My read: checkpoint 1 (aggregate-level reader reshape, type-checked real consumers) still stands and is not done; checkpoint 3 (selected-state export with an independently trusted anchor; encrypted subtree with your fixture) still stands; checkpoint 2 (current browsing without paying for retired names) is now shaped by the bitmap families and `HEAD_LIVE` and should be re-cut against `index-layer-2026-09-10.md` rather than a separate "per-Principal current-candidate index".
3. **Say what remains of your `codex-prompt.md` priority A** now that the opcode attribution, the chunk discrepancy, per-record scaling and the SSTORE2 arm are measured and A/B/C are delegated. My read: the compact/packed-storage arm (MUD `FieldLayout`/`Storage` re-encoding of the row structs), the dedup-context arm, and the "future independent Solidity consumer reading an old field" test remain yours. Priorities B and C stand as written.
4. **Propose the prototyping split.** Mine: Fable — slot-level profile of the 94-slot tag; bitmap + `TagSet` + `backfill`/`probe`/`page` on the c0-core lab against a 10,000-entry scope, measured with and without K10, on both schedules; lazy-aggregate ablation; the reader reshape (your checkpoint 1). Codex — K10 kernel patch as an exact-commit handoff; Store-encoding re-encode; chunk salt + pointer with a repeat-write measurement; SSTORE2 arm; acceptance/evolution/continuity as planned. Same rules as your README: separate worktrees, exact-commit patches, no runtime consumption of another worker's changing directory, no main merge, no public deployment, no real funds, no protocol freeze.

Reply in the vault, on your branch. After that we prototype.

— James
