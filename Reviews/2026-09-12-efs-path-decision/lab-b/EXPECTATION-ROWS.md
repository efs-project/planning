# B expectation rows — the appendix's seven rows mapped to `joined/paid-slice`

**CANDIDATE-AUTHORED.** This maps the seven rows of `../sdk-fixture.md` (appendix "criteria for the next sealed paid point/list slice") onto B's runner cells and rows so the independent run controller can author the sealed expectation manifest (labels and outcomes only), the B arm-input manifest and the post-B1 basis seal (pre-run pins 1–5) **without asking the deployed candidate anything**. Physical values live in `FIXTURE-MAP.md` / `vectors/fixture-map-b.json` (candidate-authored; re-derive, never copy). Source commit `9c19164`; compiled 52/52 at `2859147`. Cells run only on an owned `--anvil` chain.

## The seven rows

| # | appendix row | runner cell / row label | transaction(s) | independently expected abstract outcome (labels only) |
|---|---|---|---|---|
| 1 | `A1` setup | `joined/paid-slice` → `paid/setup/A1` (after `paid/setup/step1`) | one `Ledger.executeSigned` by AUTHOR_A: `[CREATE FILE_QUOTE, PUBLISH QUOTE_A1, BIND HEAD, BIND FOLDER /swaps eth-usdc, BIND TAG market]` (publication 2, admissions 4–8) | `QUOTE_A1` admitted for `FILE_QUOTE`; the ONE A placement exists (revision 1); A's head/revision = `QUOTE_A1` / `A1`; category `EOA_SIGNED_PUBLICATION`; placement cost charged once inside this receipt, disclosed as ESTIMATE |
| 2 | `A2` setup | `paid/setup/A2` | `executeSigned` by AUTHOR_A: `[PUBLISH QUOTE_A2, BIND HEAD expectedRevision 1]` (publication 3, admissions 9–10) | A's head `QUOTE_A1 → QUOTE_A2` (revision 2); A1 retained in history; placement unchanged; `AUTHOR_A` / `EOA_SIGNED_PUBLICATION` |
| 3 | `B1` setup | `paid/setup/B1` | `Actor(actorB).execute` (native): `[PUBLISH QUOTE_B1, BIND HEAD (B key) expectedRevision 0]` (publication 4, admissions 11–12); NO FOLDER bind | B's competing head `QUOTE_B1` / `B1`; the same single placement; `AUTHOR_B` / `CONTRACT_ORIGINATED_PUBLICATION`, no signature (v=r=s=0) |
| 4 | paid point, A-first | `paid/point-a-first` | `JoinedConsumer.paidPoint([A, B], Expect)` from the paid caller (wallet 3), first tx after revert to the seal | `FILE_QUOTE` / `QUOTE_A2` / `A2`; value `2_502_000_000 @ 6`; `AUTHOR_A` / `EOA_SIGNED_PUBLICATION`; placement provenance = the A1 effect (joined from seal replies, not charged) |
| 5 | paid list, A-first | `paid/list-a-first` | `paidList([A, B], Expect, PlacementExpect{/swaps, eth-usdc, AUTHOR_A, kind 2, A1 publication, budget 16})` | one row `eth-usdc → FILE_QUOTE`, COMPLETE + ended window over exactly one raw candidate (no duplicate, no B placement), hydrated and checked to the same A2 selection |
| 6 | paid point, B-first | `paid/point-b-first` | `paidPoint([B, A], Expect)` | `FILE_QUOTE` / `QUOTE_B1` / `B1`; value `2_501_000_000 @ 6`; `AUTHOR_B` / `CONTRACT_ORIGINATED_PUBLICATION`; placement provenance still the A1 effect |
| 7 | paid list, B-first | `paid/list-b-first` | `paidList([B, A], Expect, PlacementExpect)` | the same single A placement row, checked to the B1 selection; placement actor `AUTHOR_A` ≠ selected author `AUTHOR_B` by design |

Setup rows are ordinary receipts (setup cost class). Each paid row is the first and ONLY transaction (index 0) of block `seal + 1`, at timestamp `seal + 1` (`evm_setNextBlockTimestamp` after every `evm_revert`), retained before the next revert (`paid/ordering`).

## What each paid row retains (`rows[].abstractResult`, grade `RPC_OBSERVED`)

| abstract field | established by (retained raw reply / receipt) |
|---|---|
| `operation`, `lens` | the row's calldata (`transactions[i].data`: lens address array + `Expect` / `PlacementExpect` structs) |
| `realm`, `execution`, `profile` | `paid/seal` raw replies (`realmId`, `coreCodeCommitment`), `report.deployment` (this run's record; the sealed run uses the controller's own deployment facts), PROFILE.md |
| `observationBasis` | `paid/seal`: `Ledger.counts` (admission frontier 12), `IndexModule.generation`, `TypeRegistry.epoch`, `coreCodeCommitment` at the sealed block; the consumer pins the frontier (`BasisMismatch`) and logs its own view (`consumerObserved`) |
| `executionBasis` | the receipt + `eth_getBlockByNumber(block, false)` (block, parent hash, timestamp, tx index, tx count) |
| `queryCoordinate` | calldata bytes; labels FILE_QUOTE / `/swaps` + `eth-usdc` + budget 16 + fresh cursor + end condition |
| `presence`, `support`, `admission`, `selection` | the `PaidResult` log + the `eth_call` replay from the same caller at the receipt block, both equal to the runner's expectation (`consumerChecks` kind `paid-result`); UNKNOWN on any mismatch |
| `selectedFile/Head/Revision` (labels), `selectedPhysical` | the log's `Selection` (`subject`, `selectedHead`, `selectedRevision`, `selectedAdmission`, `selectedPublication`) joined to the fixture map's labels |
| `selectedAuthor`, `selectedAuthorEvidenceCategory` | log `selectedAuthor` / `selectedProofKind` (the consumer verified `Ledger.evidence` author, proof kind, range and signature shape) |
| `placementCoordinate`, `placementProvenance` | list rows: the log's `Placement` (position, actor, proofKind, revision, admission, publication); point rows: `paid/seal/a-placement-provenance` raw replies under the row's own lens (`placementAtSeal.byLens`) — never charged to the point |
| `quoteCheck`, `pairCheck`, `itemChecks` | log `pairId`, `itemA`, `itemB`, `mantissa`, `scale`, `observedAt`, `note` (all compared on chain against the sealed inputs) |
| `candidateCoverage`, `pageCoverage` | point: ordered-lens end condition by construction; list: log `pageStatus` 2 (COMPLETE), `rawTotal` 1, `scanned` 1, `selectedSoFar` 1, `mutated` false, `ended` true |
| `rawEvidence`, `paidExecution` | `transactions[i]` (raw tx, receipt, logs), `raw[]` stage `paid-replay` (return data), `paid/seal*` rows, caller + derivation index, targets, code commitments, gas used |

"No B placement" is established by `paid/seal/no-b-placement` (`Ledger.head(binding(B, placement))` state 0, B's `/swaps` scope list count 0, `LensReader.resolve([B], FOLDER, /swaps, eth-usdc)` ABSENT) and by the B1 calldata (two actions).

## What the controller seals BEFORE the run (labels only)

1. **Expectation manifest** — the seven rows above as semantic labels/outcomes: row → `{operation, lens, selectedFile, selectedHead, selectedRevision, value (mantissa @ scale), observedAt, noteCommitment label, selectedAuthor, selectedAuthorEvidenceCategory, placement {parent, name, actor, sourceStep, evidenceCategory}, coverage {candidate COMPLETE; page COMPLETE with one row and an end condition}}`; setup rows → the retained facts of the table. No physical id, no gas number.
2. **B arm-input manifest** (from the controller's OWN build of the pin, never from this directory): source commit `9c19164` + recorded empty dirty diff; `solc 0.8.30`, `via_ir = true`, optimizer runs 200, evm `cancun` (`foundry.toml`); ethers v6 path; Anvil argv (`script/measure.mjs:257-259`); artifact sha256 + initcode hash + runtime code hash (+ `immutableReferences` count) for `Ledger`, `TypeRegistry`, `IndexModule`, `LensReader`, `JoinedConsumer`, `MinBodyAcceptor` ×2, `QuoteAcceptor`, `LabelAcceptor`, `Actor`; profile/Type/Lens commitments (PROFILE.md; the six descriptors of `FIXTURE-MAP.md` "Types"; `LENS_A_FIRST = [AUTHOR_A, actorB]`, `LENS_B_FIRST = [actorB, AUTHOR_A]`); the independently derived semantic→physical vectors (re-derived, not copied).
3. **Caller roles** — fixed ephemeral accounts of the run mnemonic: deployer = index 0, AUTHOR_A = index 1, wallet 2 unused by this slice, paid caller = index 3 (addresses recorded, no secrets); `actorB` (AUTHOR_B, the producer) and every other contract at the precomputed CREATE addresses (`FIXTURE-MAP.md` "Deployment addresses"), or from independently retained deployment receipts + verified runtime code sealed before fixture publication.
4. **Coordinates** — FILE_QUOTE subject, `/swaps` folder hash, `eth-usdc` role, budget 16, fresh cursor, the `Expect` / `PlacementExpect` struct bytes, from the controller's vector implementation.
5. **Basis seal** — after B1, before any paid read: block number/hash/timestamp + `evm_snapshot` id (the runner records them as `paid/seal`); revert to it per paid row (`paid/ordering`); hash and timestamp all three seals outside this packet.

## What B discloses separately (never subtracted)

- **Once-only placement cost**: an ESTIMATE from the `paid/setup/A1` combined receipt (one of five actions) unless the optional paired control `joined/a1-without-placement` (identical batch minus the FOLDER bind, same pre-A1 state) is pinned; even then the difference is the controller's computation.
- **Deployment / code**: `report.deployment[*]` gas, runtime and initcode bytes per contract — production prerequisites (`TypeRegistry`, `Ledger`, `IndexModule`, `LensReader`, fixture rules) apart from diagnostic consumers (`Consumer`, `StatelessConsumer`, `Reconstructor`, `FailingIndexModule`, `MockAcceptor`, `StrictQuoteAcceptor`).
- **Setup**: `paid/setup/step1`, `A1`, `A2`, `B1` receipts (fixture prerequisites + the three author steps); registry setup (`report.setup`).
- **Storage**: ESTIMATED fresh slots only (`report.estimatedFreshSlots`); no tracing.
- **Consumer instrumentation**: the `PaidResult` log (~34 data words, ESTIMATED ~9–10k gas) inside every paid-row receipt — the measurement consumer's overhead, reported beside the read.
- **Matched rollback control**: cell `failure-rows` (`failure/failed-acceptance`, `failure/failed-mandatory-index`), referenced, not duplicated.

## Labels whose physical value cannot be derived without a run or a build

- Needs the controller's **build** (runtime codehashes), not a run: `PAIR` / `QUOTE_J` type ids, `PAIR_ETH_USDC` id, the three Quote bodies/ids, `realmOrigin`, `AUTHOR_B` principal, B's binding/scope keys (`FIXTURE-MAP.md`, last section).
- Needs the **run** (they are observations, not inputs): the sealed block hash/timestamp and snapshot id, transaction hashes, gas figures, `Ledger.evidence` signature bytes (r, s, v of A1/A2 depend on the wall-clock deadline and the signature), block-dependent `evidence.basis` (block number) and `TypeRegistry` activation block numbers. Everything else — ordinals, revisions, categories, positions, A's keys, lens ids, wallets, CREATE addresses — is fixed by the fixture and the runner's order.
