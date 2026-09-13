# C MUD Store-only: independently gated paid slice

September 13, 2026, 16:25 UTC · disposable local `RPC_OBSERVED` evidence;
not an architecture selection, authenticated state proof or full-Files price

The C positive slice executed successfully: signed typed publication, a real
contract's competing head, mandatory indexing, and paid Solidity reads under
both author orderings. It used independently prepared bytes, checked before
fixture writes and again before the paid reads. The measured EFS-on-MUD adapter
is not a cheap escape hatch: its current create/edit/read path costs more than
the compact bespoke candidate. That is a result about these implementations,
not an inherent tax of MUD or a reason to drop unpriced EFS requirements.

## Actual receipt gas

| Operation | B compact EFS | C MUD-backed EFS |
| --- | ---: | ---: |
| A1: signed File create, fresh Quote, head, one placement and tag | 1,614,433 | 2,400,503 |
| A2: signed fresh Quote and head update, preserving A1 | 658,913 | 1,112,430 |
| B1: contract-originated fresh Quote and competing head, no new placement | 796,542 | 1,275,405 |
| Paid selected graph point read, A-first | 153,636 | 252,517 |
| Paid one-entry listing plus selected graph, A-first | 246,606 | 391,043 |
| Paid selected graph point read, B-first | 153,884 | 252,457 |
| Paid one-entry listing plus selected graph, B-first | 254,283 | 405,632 |

B evidence/source is qualified in [[b-gated-paid-results-20260913]]. Both arms
use A's one folder placement while selecting A2 or B1 as content. C's result
bytes and event match its independently prepared exact answers; B's prior
report still identifies its output interpretation as candidate self-checking.
The same useful journey does not mean identical consumer checks or storage
obligations: do not interpret these differences as feature-normalized overhead.

C uses generic framed bodies and MUD tables; B uses specialized fixed layouts.
C's consumer checks more source/publication context and emits more observation
words. These differences, decoder/read paths, required index choices and setup
must be reconciled before claiming a same-guarantee ratio. No log overhead is
subtracted. A one-entry listing says nothing about 1,000 entries or lifetime
name churn; these joined reads are not bare-slot getters. No current-dollar
price, raw-MUD baseline or saving versus fuller v2 is claimed.

The bounded source comparison identifies three concrete qualifications:
C keeps full action/evidence rows where B packs and shares coordinates;
their by-author/by-Type/backlink index obligations differ rather than one
strictly subsuming the other; C validates more binding coordinates, publication
context and per-record admission basis in its paid consumer. These costs are
not isolated by the current receipts. Before choosing from ratios, reconcile
which checks/discovery obligations are required in both, rather than deleting
checks simply to make one number lower.
[[paid-read-parity-next-gate]] identifies the bounded follow-through: B can
tighten revision, admission-basis and coordinate/cursor provenance checks using
existing getters, without redesigning Core or copying every C-only field.

One possible C follow-on is narrow: LensReader already resolves placement
admission/key, discards them from its page item, and the consumer resolves
again. Carrying that provenance through could remove duplicate work without
dropping its checks. Source references: C `src/LensReader.sol:179` and `:295`,
`test/MeasurementConsumer.sol:514`; B's corresponding consumer gets the
admission from its page. No saving is measured, and this cannot fix the write
or point-read gap by itself. It is an optional challenge, not a new blocker
or an authorization to keep optimizing past the provisional deadline.

Separate C costs: eight deployments **29,780,466** gas total; index attachment
**69,974**; the seven-action setup publishing four Types and two Items/their
Pair **3,667,483**. This setup is not B's Items/Pair-only row. Deployment includes
ImportLib, which these calls do not exercise, plus the fixture Producer and
measurement consumer. Ledger alone deploys at **11,972,902**; it is one
transaction below the normal 30M block limit, not the whole deployment total.
The extra exact A1 retry reverted as expected at **63,046** gas; it is not the
matched mandatory-rule/index rollback control.

## Validation and limits

- Each of two independent controller stages passed 76 checks: eight full
  runtimes, 11 identity reads, two basis reads, 50 raw rows, and chain/header
  checks. There are no masked state comparisons.
- The runner compares its local encodings with the independently prepared
  BOOTSTRAP/A1/A2/B1 and four paid-call bytes, then sends those pinned bytes.
  A's publication signatures were generated and recovered offline before
  genesis, not signed retrospectively to fit a result.
- All four paid transactions restore the same post-B1 block 13, execute as
  the only transaction of their respective block 14, and use seal timestamp
  plus one. Their caller is the unrelated public-test account 3.
- Root independently reconstructed signed transaction hashes/senders and
  checked all **18** retained transaction/receipt/header joins, reported gas,
  deployment initcode hashes and runtime hashes. Changed receipt-hash and
  reported-gas mutations reject. These checks do not authenticate headers.
- The source gate passed independent review and **83/83 Node tests**. It reuses
  unchanged Solidity/artifacts from the separately retained **80/80 Forge**
  readiness run; no new compilation was needed. Every deployed runtime and
  complete initcode fits ordinary limits. Ledger runtime is 23,204 bytes;
  the paid consumer is 15,445.

Independent packet review passed: full deployment bytes, publication events,
both controller transcripts, exact paid returns/logs and restore/replay ordering
agree with the sealed inputs. This is not merely trusting the runner's PASS.
Scope still
excludes matched rollback, marginal placement, portable contract-origin import,
source-state proofs, broader file operations, historical interpretation after
rule/account/Core changes, browser/RPC scale and churn. None is waived.
[[portable-evidence-next-gate]] adds the specific shared recovery challenge:
keep original evidence without replaying an old destination-incompatible batch.

Two source-review followups are nonblocking for this exact run: the standalone
runner checks loopback too late, so this run used only the separately reviewed
launcher that creates/overrides an owned loopback endpoint; a watchdog kill may
lose partial child observations, but cannot create an ACK. Before broader reuse,
move URL refusal ahead of any runner RPC. Neither issue affected this run.

## Pins and retention

Runner source: `58dd3d78e8efa8e4490b035bdde5502b75adc9e3`, branch
`codex/efs-warroom-c-run`. Compiled Solidity source:
`2ca7349e5d683c3ff10651c0fc106c10da946145`. Input SHA256:
`16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c`.
Controller SHA256:
`9338e35288adc11b0a310f50244fb5295e48c64d482f1174bc1c4cfdba598a53`.
Run ID `c-paid-20260913T162520552Z`; Solc 0.8.30 / Cancun / via-IR /
optimizer 200 / no CBOR; Node 26.0.0; Anvil 1.7.1 at `4072e487`.

The owned chain ran **16:25:20–16:25:22 UTC**, PID 59382, and stopped cleanly.
Heavy slot released; scratch 7.5 MB and free disk 274 GiB. Claude's original
B/C checkouts remain untouched. Raw evidence and independent preparation are
retained at evidence-only commit `c6fce9d5afaefca1071b09340fe4a1468477b6e4`
on the C prototype branch at
`lab-c/evidence/paid-20260913T162520Z/`: 30 copied files plus their byte/hash
inventory, including source/packet/cost reviews and independent generators.
The raw Anvil log retains original trailing whitespace; only that exact file
is excluded from whitespace checks. Historical absolute local paths remain
unchanged; reproduction elsewhere needs path remapping and the pinned rebuild.
Source and report pins remain distinct from the evidence-only addition.
