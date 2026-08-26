# MORNING REPORT — Evolution and Immutable Consumer Tournament (2026-08-26)

**DISPOSABLE** · `protocolConformance=false` · `notAdopted=true` · `goCodeAuthorized=false`

Lab: `experiments/efs2-consumer-tournament-2026-08-26/`, standalone local repo,
branch `lab/2026-08-26-fable-consumer-tournament`, commits `89091a4` (seal) →
`a6bb2c4` (tournament). Nothing pushed, merged, deployed, or written to the
vault. All IDs fixture-local; production coordinates `BLOCKED_BY_CORE_INPUT`.
Authority source-lock: planning-v2-readiness @ `2573f08` (clean), see
`MANIFEST.md`. Toolchain: forge 1.7.1, solc 0.8.30, EVM osaka, optimizer 200,
via-IR; Python 3.14.4 stdlib.

## 1. Verdict table (one screen)

| # | Hypothesis | Strongest attack thrown | Result | Remaining unknown | Smallest next test |
|---|---|---|---|---|---|
| H1 | Exact immutable Types/Records preserve historical interpretation | Withdrawal, Realm policy revision, validator-code mutation (vm.etch), realm disagreement | **SUPPORTED_FOR_NEXT_EXPERIMENT** — 0 of 119 verdicts and 0 identities changed under any current-state change (`withdraw.current.vs.historical=SEPARATED`, `address.identity.stable`) | reorg/finality basis not modeled | add an observer-basis coordinate to one receipt and replay under a simulated reorg |
| H2 | Bounded semantic Views let inert consumers understand compatible future Types | Same-shape twin under stolen issuer key; exactConstant author forge; caller-supplied binding | **SUPPORTED for inert consumers, with the trust cost now measured** — consumer-pinned bindings (SEMPIN) took 0 attack acceptances but cannot see future Types (pin set frozen at deploy); issuer-gated (SEMISS) accepts honest future NOTE_1_1 AND the stolen-key twin — extension ≡ delegated trust to a key, mechanically indistinguishable | none for the mechanism itself; the open question is issuer-key lifecycle policy | rerun SEMISS with a *Realm-revisioned* issuer registry so key rotation/compromise is basis-qualified |
| H3 | Effectful consumers should default to EXACT / finite audited set | gwei/wei units twin (`A_PRED.r_act_twin=EFFECT`); hidden delegate field (`A_PRED.r_act_v2_deleg=EFFECT`); stolen-key twin (`A_SEMISS.r_act_twin=EFFECT`) | **SUPPORTED** — every non-pinning arm executed at least one hostile effect; EXACT/FINITE_SET/SEMPIN executed zero across all 119 cases | none | none — decision-grade |
| H4 | Portable validity, Realm admission, current effect, consumer acceptance stay separate | Same record admitted by Realm A, denied by Realm B; admitted-then-withdrawn; Type-valid-but-policy-denied equip | **SUPPORTED** — same `recordId`, different receipts binding realm/policy/basis; withdrawal flips current effect only; grandfathered equip survives policy rev 2 | full receipt ABI (basis coordinates) is C0/M-work | fold this fixture into the C0 receipt vectors |
| H5 | App Types + Realm behavior suffice; no app Core nouns, no callbacks in portable validity | RPG equip + treasury on ONE action model; notes; science twins; callback grief suite | **SUPPORTED** — everything expressed with ordinary Types + policy; naive callback died to revert/grief; guarded callback contained mechanics but `ANSWER_CHANGED` under mutation (portable validity cannot ride a callback) | media/large-content not in this corpus | none for the claim as scoped |

**Differential bottom line: 119/119 case agreement** between the independent
Python oracle and Solidity SUT (after a preserved 14-case round-1 divergence:
10 oracle bugs, 4 = a genuine predicate-underdetermination finding), plus 19/19
effects/callback/realm checks and 6/6 lens/partial/withdrawal checks.

## 2. Artifact paths

- Source-lock + non-adoption: `MANIFEST.md` · pre-registration: `HYPOTHESES.md`
- Sealed corpus (16 Types, 36 Records, 119 cases): `fixtures/corpus.json`, sha256 in `fixtures/SHA256SUMS`
- Oracle: `oracle/oracle.py` → `oracle/oracle_results.json`
- Solidity SUT: `sut/src/{Codec,Consumers,Effects}.sol`, tests `sut/test/*.t.sol`
- Machine-readable matrix: `RESULTS/result_matrix.json` (+ `effects_results.json`, `lens_partial_results.json`, `sut_results.json`)
- Gas/code-size: `RESULTS/gas_results.json` · failure corpus: `RESULTS/failure-corpus/`
- Rejected arms with exact kill criteria: `RESULTS/rejected-ledger.md`

## 3. Headline numbers

- Attack acceptances by effectful arm (of 6 hostile action cases): EXACT 0,
  FINITE_SET 0, SEMPIN 0, SEMISS 1 (stolen-key twin), PRED 2 (units twin +
  hidden delegate). Read-side twins: N_PRED and N_SEMISS accept the
  command-execution twin; N_EXACT/N_FIN/N_SEMPIN reject.
- Science pair: byte-identical meters/seconds payloads share NO TypeId; only
  shape-keyed arms confuse them. Three byte-identical twin pairs confirmed.
- Gas (disposable harness, relative deltas only): note decode+verdict ~97.2k
  (EXACT) vs ~97.8k (SEMPIN) vs ~102.4k (PRED); action ~66.9k (EXACT/FIN) vs
  ~72.2k (PRED). **Pinning a TypeId costs ≈0.05%; the "flexible" arms are the
  expensive ones.** Guarded callback overhead: honest 22.5k; returndata-bomb
  contained at 122k (no memory blowup). Consumers runtime code 10,337 B.
  Absolute values are inflated by the deliberately unoptimized generic decoder
  and string dispatch; only deltas are meaningful.
- State machine: atomic two-leaf equip leaves NO partial effect on leaf
  failure; CAS conflict rejects; replay after dropped response returns the
  original receipt with no double effect; policy rev 2 denies new equips while
  grandfathering existing state.
- Unknown data: archive stored raw bytes for 17/17 records including unknown
  codec and every malformed mutant; no arm dropped unknown bytes; empty
  PARTIAL page never proved absence; UNKNOWN/CONFLICT never fell through the
  lens combiner.

## 4. SDK implications

1. **Exact decode**: generated per-Type decoders with the canonical
   decode-then-re-encode (or inline-canonical) law; both implementation styles
   agreed on all 119 cases — the law is implementable both ways.
2. **Portable validation**: schema-driven generic validation is expressible in
   ~200 lines of Solidity (Codec.sol) and Python; error symbols
   (`E_ABSENT_NONZERO`, `E_NONCANON_OFFSET`, …) matched across languages.
3. **Realm assessment**: SDK must return admission receipts as
   (realmId, policyRev, stateBasis, result) tuples — never a bare boolean —
   or the two-Realm split becomes invisible.
4. **Lens acceptance**: expose `FOUND/ABSENT_PROVED/UNKNOWN/CONFLICT/
   UNSUPPORTED` verbatim; the combiner stop rule is 6 lines and must not be
   "simplified" by treating UNKNOWN as absent.
5. **Raw-preserving diagnostics**: every reject carries a symbol and the raw
   envelope stays retrievable; the SDK should never surface a decoded-only
   view without the raw handle (matches C0's raw-map rule).

## 5. Explorer implications

- Exact vs following/current: show a record's *historical* verdict and its
  *current* effect (withdrawn/superseded/policy-denied) as two fields; never
  overwrite one with the other (`withdraw.current.vs.historical=SEPARATED`).
- Required vs optional unknown: NOTE_1_1-style optional inert extensions are
  displayable under an issuer/pinned view; NOTE_1_2-style required
  processing-critical fields must render as "unsupported revision — raw
  available", not as a degraded Note.
- Partial/unknown/conflict: an empty PARTIAL page must render as "incomplete",
  never as "none found".
- Raw access and loss display: the NOTE_2_0 lossy projection decodes but loses
  blocks structure; if a View is lossy, the Explorer must badge it and link the
  raw bytes.

## 6. Owner questions

**None.** Every fork surfaced tonight is evidence-decidable engineering
(issuer-registry basis-qualification, receipt ABI, predicate codegen policy).
No two-viable-irreversible product-value choice emerged.

## 7. One recommended next experiment

**T4/G2 integrated mutation+query state machine, differential (pure model vs
monolithic Solidity SUT)**: QueryProfile activation from `PENDING` through
partial backfill to state-derived terminal completion, with cursor
invalidation, mixed-basis rejection, empty-partial pages, and dead-posting
dilution — reusing tonight's corpus Types. It is the largest remaining
unmeasured seam between the Type layer (now pressured twice) and the Realm
layer (C0-pressured), and it gates the honest-completeness promise that every
consumer arm above assumes.
