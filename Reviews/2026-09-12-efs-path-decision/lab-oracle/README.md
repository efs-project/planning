# Disposable independent lab oracle

This directory contains an experiment-only offchain checker for the EFS path
decision. It is not an SDK, Core implementation, ABI recommendation, state
proof verifier, or protocol-byte proposal.

## Independence seal

Candidate-neutral expectations were frozen before inspecting candidate B's
manifest, ABI, structs, or verifier implementation.

- planning source: `32ed292af887455e690991d2fd642bebd4f47fef`
- oracle-boundary blob: `035aa6d9cb0dcd96517234a7ef1a160b45481abf`
- sdk-fixture blob: `4a2864fc4670cf548f1efa7340041df0fec2b803`
- files-journey blob: `0c2aecc059e05e2251f06343c351ec3653b09ace`
- run-manifest blob: `0994c7125c5488d408a2519fdad45b91cd656ac0`
- neutral-expectations blob: `a9d6c9afb5f51d0f786e006b7b5df667ae69710e`
- frozen-before-candidate-inspection: `true`

The CLI recomputes and enforces the last two Git blob identities before any
comparison. It also checks that the parsed objects are exactly the objects from
those bytes. Supplying a mutually consistent replacement profile and
expectations file is therefore rejected rather than becoming a new oracle.
This local input seal does not prove that the candidate source commit was
deployed or that any observation packet is genuine.

The oracle may later transcribe candidate B's public manifest and ABI/struct
declarations. It must not read, copy, import, or execute the candidate's
Reconstructor, intent-digest implementation, measurement script, SDK/helper,
or verifier tests.

Candidate-public material was subsequently read from source commit
`727291aac717f4c4e38e9049e8c9328da94389b8` only:

- `MANIFEST.draft.json` blob `46efa03d08408230d198c87000f396ee2fb24e12`
- `src/Interfaces.sol` blob `3155357f6d3e58c910828df2eb798ecb53ea24f9`
- public-profile transcription blob `06106fe3bc717ed4638612f2ef8b90d502c705b8`
- independent hand-vectors blob `c58df6c533509109bd33c2e8ad44a15a609304aa`

That material declares Record and subject identity framing. It does not declare
the ordered `Action` and `PublicationIntent` fields/types, action/body array
framing, complete EIP-712 domain field set and values, or a candidate signature
vector. Action commitment, signed digest, and signed-plan binding therefore
remain `UNSUPPORTED`; the checker does not guess them. Generic supplied-digest
ECDSA recovery is tested separately and is not candidate authorization.

A later compiled ABI was inspected only through its `abi` JSON field and is
recorded as `profile-b-dcc7b94.abi-declarations.json`. It belongs to source
`dcc7b946d2ac8dfcf22103069127a9d1809df974`, not the sealed `727291a` profile.
Its tuple declarations and selectors do not supply the missing action-array,
domain, replay, or principal rules and therefore upgrade no oracle axis.

## Evidence boundary

Raw observations, independently derived outcomes, and candidate-native claims
remain separate. Missing authenticated input leaves only the affected axis
`UNKNOWN` or `UNSUPPORTED`. A retained RPC response is an observation, not an
authenticated state proof. Source acceptance is not destination admission;
receipt success is not canonical semantic effect; and an unknown submission is
never permission for a blind retry.

Every present proof-shaped observation must name its source, claimed proof
grade, basis role, and exact block hash. Source and destination anchors are
separate and each must state chain, block, Realm, provenance, and the
availability or explicit unavailability of header, runtime, account-proof, and
storage-proof material. The fresh-destination fixture rejects identical
source/destination chain-and-Realm authority, and all packets reject cross-basis
observations. It does
not yet verify headers or Ethereum state proofs, so a structurally bound packet
is still reported as `STRUCTURALLY_BOUND_UNAUTHENTICATED`; packet-supplied
booleans, rows, receipts, evidence arrays, and proof-grade strings cannot yield
`VALID`, `ACCEPTED`, `ADMITTED`, `SUCCESS`, or `COMMITTED`.

The implemented boundary is intentionally narrow:

- Record and subject identities are independently recomputed from pinned
  public framing and can be `MATCH` or `MISMATCH`.
- Generic EOA recovery is a standalone cryptographic control. Candidate action
  commitment, typed digest, and signed-plan authorization remain `UNSUPPORTED`.
  Both digest-byte and signature-byte mutation controls are exercised.
- Reference validation, source acceptance, destination admission, submission,
  and receipt observations are retained raw but evaluate to `UNKNOWN` until an
  independent proof verifier and proof-bearing packet profile are pinned.
- Canonical effect, query coverage, and destination selection remain
  `UNSUPPORTED` because their required-effect/query/selection closure is not
  pinned. Candidate-supplied matching rows cannot complete that closure.
- The cost helper requires matched actor, action shape, body size, state regime,
  exact current/before/after operation commitments, before/after bases,
  provenance, occurrence deltas, effect commitments, and state delta. It can
  classify supplied controls as fresh, existing, retry, or inconsistent, but
  labels them `UNAUTHENTICATED_INPUT`; the sealed report keeps cost truth
  `UNKNOWN`.

Raw inputs, raw observations, candidate claims, and evaluated results are all
retained separately. Every axis in the frozen neutral list must be explicitly
claimed, including honest `UNKNOWN` and `UNSUPPORTED` outcomes. A missing claim
is a `MISSING_CLAIM` discrepancy; an unfamiliar claim axis becomes
`UNSUPPORTED_CLAIM_AXIS`. Neither is silently skipped.

The checker uses Node built-ins and ethers 6.15.0 only for cryptographic
primitives. It performs no RPC, network, chain, build, or package-install work.
The current tests use synthetic raw observations; they are not evidence that a
Road B deployment or joined fixture passed.

## Commands

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/oracle.test.mjs

NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node Reviews/2026-09-12-efs-path-decision/lab-oracle/check.mjs \
  packet.json profile-b.public.json neutral-expectations.json
```

The absolute `NODE_PATH` is run-local evidence for this machine, not a portable
project dependency path. The CLI emits deterministic JSON, exits `0` only when
every frozen required axis is explicitly claimed and no claim contradicts the
limited oracle (including honest `UNKNOWN` and `UNSUPPORTED`), and exits `1`
for a malformed packet or discrepancy. Its packet shape and status vocabulary
are lab-local. Exit `0` is not a candidate pass, deployment proof,
semantic-effect proof, or production-readiness result.

## RPC_OBSERVED bounded probe

This second checker is a separately named raw-byte consistency probe. Its scope
was frozen from planning commit `d5b4c58e74f6532d9f170d7533e177c608f9cb90`,
`oracle-boundary.md` blob `bf4aa1b90b6f7559f66a0fadb13059c95dd2bd57`,
and `rpc-observed-expectations.json` before opening the retained candidate
packet or its compiled ABI artifacts. The frozen RPC expectation blob is
`1fbe87f6b2bf1d095bb0979997573439a6c2bd88`. The original expectations and strict
proof-result implementation stay unchanged at blobs
`a9d6c9afb5f51d0f786e006b7b5df667ae69710e`,
`c875a0ed7923c5175c0f5691770aa5be7eab24e0`, and
`c45264e0a1e98ea59c789428172d629dd19d4f5b`.

Under an explicit `RPC_OBSERVED` assumption, the probe may decode retained raw
calldata/return bytes with separately pinned public ABI declarations, recompute
supported Record IDs, and compare target, selector, arguments, basis, revision,
selected target, scalar, and listing count with the frozen matrix. Its only
outcomes are `OBSERVED_MATCH`, `OBSERVED_MISMATCH`, `UNKNOWN`, and
`UNSUPPORTED`. None establishes RPC honesty, block inclusion/canonicality,
runtime or storage truth, source authority, exact Type meaning, complete
workflow execution, semantic `COMMITTED`, or a candidate pass.

The frozen two-cell matrix requires both `native-one` and `signed-one` to begin
with the quote3000 and quote3100 control Records observed absent and the three
specified Consumer fields (`lastTarget`, `lastRevision`, and `lastValue`) at
zero; create quote3000; edit the same subject HEAD to a distinct quote3100
Record at revision 2; return that Record/revision/scalar 3100 from the paid
quote read; and list exactly one selected name. It did not freeze the other
four Consumer getters, target addresses, or query coordinates. Only synthetic
tests may supply those as a separately marked, caller-provided independent
vector; the retained candidate packet receives no such pins. Candidate decoded
summaries, `pre`/`post`, `consumerChecks`, labels, and pass flags are inert
retained data, never expected answers.

Implementation plan:

1. Seal and commit these expectations before inspecting packet or ABI details.
2. Hash the retained packet; read only its raw observation data. Hash the four
   authorized `dcc7b94` artifacts and extract only their `.abi` fields into a
   lab-local profile.
3. Add failing tests for exact successful decoding plus raw-byte, selector,
   target, basis, omission, conflict, and fake-summary mutations.
4. Implement a new `rpc-observed` module and CLI without importing, modifying,
   or weakening `oracle.mjs` or `check.mjs`.
5. Run the checker on the current retained packet (keeping the superseded
   partial input only as omission pressure), store candidate-packet results
   separately from synthetic test totals, verify strict-file hashes, obtain
   independent review, and commit only `lab-oracle/` files.

The authorized ABI-only transcription is
`rpc-observed-profile-dcc7b94.json` blob
`6345c2246e287e9676f714491ce8aebf673f754a`. It contains selected declarations
needed by this matrix from four artifacts and pins each whole artifact by
SHA-256 and Git blob. No metadata, bytecode, AST, source, measurement helper,
or candidate verifier was used. The ABI can describe byte layouts; it cannot
prove that an address ran that code or supply missing enum, Type, body-codec,
proxy, or deployment authority.

The initial partial packet remains registered only as incomplete-input
pressure:

- `measure1-partial.json`: 162,855 bytes; SHA-256
  `0a46b75442b30aec9401e6341d5a5ca3ed6a3413f308da21732bb97a9db445e8`;
  Git blob `f6d25f3f6dec11dd4ffabf5407dd53114383eda5`.
- It retains 77 call tuples per frozen cell, but no literal JSON-RPC envelope,
  method, or request/response ID. It is superseded as the current measurement
  input.

The candidate-designated current packet is `measure2-a16d7d4.json` at local evidence commit
`322b3204a743cb2806e114cd4b0ec544076e3c48`: 971,697 bytes; SHA-256
`7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce`;
Git blob `1a38f6493510760ae1b97f6188d2548c795350a8`. It is still incomplete for the
frozen oracle requirements. The committed independent result is
`measure2-a16d7d4.rpc-observed.report.json`; it is deliberately separate from
the synthetic test runner.

### Current packet result — not a pass

| Cell / axis | `native-one/quote` | `signed-one/quote` |
|---|---|---|
| transport correlation | `UNKNOWN` | `UNKNOWN` |
| ABI surface-target consistency | `UNKNOWN` | `UNKNOWN` |
| write tuple/Record consistency | `UNSUPPORTED` | `OBSERVED_MATCH` |
| quote body scalar semantics | `UNSUPPORTED` | `UNSUPPORTED` |
| baseline Record absence | `UNKNOWN` | `UNKNOWN` |
| seven-getter Consumer control | `UNKNOWN` | `UNKNOWN` |
| paid quote target/revision/value | `UNSUPPORTED` | `UNKNOWN` |
| listing count and coordinates | `UNKNOWN` | `UNKNOWN` |

Across those 16 axes the packet result is 1 `OBSERVED_MATCH`, 0
`OBSERVED_MISMATCH`, 11 `UNKNOWN`, and 4 `UNSUPPORTED`. The sole match is
signed write tuple consistency: each canonical calldata action array contains
one action committing a recomputed Record body hash and a separate action
targeting that Record for one shared subject, with raw expected revision fields
0 then 1, in successful-receipt order. Action kinds and cross-action semantics
remain unsupported. Receipt status and its supplied block hash remain
unauthenticated observations, not inclusion or semantic effect.
The body ABI remains opaque `bytes`, so the checker does not infer that either
raw body *means* quote 3000 or 3100.

The packet itself is the only source of its Ledger/Consumer addresses and
`readQuote`/`readList` coordinates. Those values are reported but cannot serve
as their own expectations, so both target-consistency axes and the supported
Consumer read/control/list axes remain `UNKNOWN`. The raw Consumer getter bytes
also omit a per-call block hash; a receipt or sealed-state hash sharing the
same block number is never joined in to manufacture one. Internally agreeing
decoded getter values therefore do not upgrade an axis.

The native writer selector `0x70f8b526` is absent from every authorized ABI;
that path is therefore not reverse-engineered from labels. Baseline block 16
has raw Consumer getters but no correlatable raw `Ledger.record` returns, so
Record absence is `UNKNOWN` in both cells even where later signed Record IDs
are computable. The raw call tuples omit literal JSON-RPC request/response
envelopes, IDs, methods, and per-call sources, leaving transport correlation
`UNKNOWN`. The checker rejects malformed `cells`, expected-cell, `raw`, and
`transactions` containers or entries; explicitly malformed call-byte fields;
duplicate JSON object keys;
ABI-decodable trailing bytes; request/response disagreement; failed receipts;
target or coordinate substitution against test-only independent pins; and
stage-order violations. Its 79 synthetic tests are mutation controls, not
candidate evidence. All
authenticated chain truth, source/runtime authority, exact Type semantics, and
complete workflow effect remain `UNKNOWN` or `UNSUPPORTED`; `candidatePass` is
always `NOT_EVALUATED`.

### RPC_OBSERVED commands

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/rpc-observed.test.mjs

NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node Reviews/2026-09-12-efs-path-decision/lab-oracle/check-rpc-observed.mjs \
  PACKET.json \
  Reviews/2026-09-12-efs-path-decision/lab-oracle/rpc-observed-profile-dcc7b94.json \
  Reviews/2026-09-12-efs-path-decision/lab-oracle/rpc-observed-expectations.json
```

The new CLI seals its profile and expectation blobs before decoding. It exits
`0` when no supported raw-byte check disagrees, `1` when at least one observed
byte check disagrees, and `2` for malformed or substituted sealed inputs.
`UNKNOWN` and `UNSUPPORTED` are honest non-success states and do not by
themselves make the tool process fail. Exit `0`, synthetic test success, and
zero observed mismatches are none of: authenticated RPC, inclusion, canonical
effect, exact Type meaning, complete workflow evidence, or candidate pass.

## Independent signature binding

This third, separately named light probe independently encodes the public Road
B `Action[]` ABI, derives its actions hash, derives the declared EIP-712 domain
separator and `Intent` digest, and recovers an exact 65-byte, low-`s`, 27/28 EOA
signature. Candidate-published hashes, encodings, and recovered-address fields
are comparison targets only. The probe does not import or execute candidate
code.

The interpretation profile was frozen in
`signature-binding-profile-dcc7b94.json` at Git blob
`4ca8bb1262992028238505d9c5071a14b189179f`. It pins only these public inputs:

- Road B `PROFILE.md` at published commit `885d9f9`, Git blob
  `ca39c29416ffa79231e48a52bef1e5403f563198`;
- Road B `vectors/profile-b.json` at the same commit, Git blob
  `8d92f5806911d50427901cda12441f65c74bc309`;
- candidate source association
  `dcc7b946d2ac8dfcf22103069127a9d1809df974`.

The positive vector has 14 independent comparisons, all `MATCH`, and recovers
the declared author as `VALID` cryptographic binding. The 27-test suite changes
and reorders actions, changes every Intent field, substitutes a wrong signer,
mutates the signature, exercises malformed widths and integer ranges, rejects
high-`s` and invalid-`v` forms, and keeps body/action shape checks distinct from
signature recovery. In particular, changing a body without changing its signed
action leaves the EOA signature valid while body commitment and declared static
shape fail.

The optional retained-call check canonically decodes and re-encodes only the
two `executeSigned` calldata values in the pinned `signed-one` packet, then
recomputes their action hashes, digests, and recovered authors. Both byte
bindings match and both EOA recoveries are valid. Its only ABI input is the
existing ABI-only profile at Git blob
`6345c2246e287e9676f714491ce8aebf673f754a`; its packet is commit
`322b3204a743cb2806e114cd4b0ec544076e3c48`, Git blob
`1a38f6493510760ae1b97f6188d2548c795350a8`, and SHA-256
`7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce`.
This does not authenticate the packet or its receipt fields, identify deployed
runtime code, prove nonce or account authority, establish Realm admission, or
establish inclusion or canonical semantic effect; those outcomes remain
explicitly `UNKNOWN`.

The current declared EIP-712 domain binds only `name` and `version`. It omits
`chainId` and `verifyingContract`, so replay-domain completeness is `PARTIAL`.
The experiment records that missing binding without redesigning the candidate.
Valid cryptography is not runtime/state authorization, and this result neither
adopts the candidate's Type semantics nor yields a candidate pass.

```sh
NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node --test Reviews/2026-09-12-efs-path-decision/lab-oracle/signature-binding.test.mjs

NODE_PATH=/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules \
  node Reviews/2026-09-12-efs-path-decision/lab-oracle/signature-binding.mjs \
  Reviews/2026-09-12-efs-path-decision/lab-oracle/signature-binding-profile-dcc7b94.json
```

The deterministic short output is retained as
`signature-binding-dcc7b94.report.json`; a test requires it to equal direct CLI
output byte for byte. Its `candidatePass` remains `NOT_EVALUATED`.
