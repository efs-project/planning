# Contract workflow lab execution report

Executed 2026-09-04 local Chicago date. This is **efs-lab/1**, NOT EFS Core,
SR-17, C0 genesis/admission, production security, or any C0 M0 pass.

**Latest snapshot:** 24/24 Solidity tests including 128 fuzz cases; Core runtime
15,624 bytes, carrier 1,658 bytes, consumer 2,604 bytes. Independent findings
closed after the helper/mask hardening at the end of this report. The earlier
counts and size table below are intermediate historical snapshots, not the
final totals. See [README](README.md) for the joined browser/SDK verification.

## Implemented and verified

- One immutable-owner `EfsLab` state owner, constructor-deployed separate
  `EfsLabBytes` accepting writes only from that exact Core.
- Stable directory/file nodes, ASCII names, collision rejection, file-head CAS,
  immutable previous-linked revisions, append-only complete bounded listings.
- Strict schema descriptors (up to eight fields): u64, bool, bytes32, bounded
  ASCII, exact-schema references to existing typed records. Schema/record
  identities, inventory and exact payloads are state-readable.
- Real EIP712 owner writes through a distinct submitter, direct-owner transaction
  writes, same-owner session grants with owner signatures, scope, operation mask,
  expiry, write/byte budgets, nonces and revocation. Low-s witness rules enforced.
- Exact operation bytes and signatures retained per admitted receipt. Session
  approval/grant and receipt-count registration/revocation boundaries preserve
  prior authorization reconstruction even when revocation follows in one block.
- One mutable transaction boundary encloses semantic state, receipts, nonces,
  grant consumption and byte storage. No arbitrary external validators or proxy.

Fresh verification: **18/18 Foundry tests passed**, including **128 fuzz cases**
for exact payload/range reads. Dedicated cases cover collision/CAS rollback,
wrong signer/domain/payload, replay, expiry, short/high-s signature, session scope,
budget/exhaustion/revocation/substitution, existing-but-wrong-schema reference,
strict truncation/trailing/bool errors, same-block historical grant evidence,
empty/missing/range semantics, depth cap and normal runtime code limits.

A late-rejection test uses the verified `receiptCount` storage slot to reach the
4096-receipt bound without 4096 setup transactions. Rejection after byte-store
mutation restores Core placement/inventory/nonce AND the separate carrier. This
is disclosed test-only fault injection, not a production setter.

## Actual size and gas observations

Solidity0.8.30, Cancun, via-IR, optimizer200; Foundry1.7.1. No code-size override.

| Contract | Runtime bytes | Initcode bytes | Runtime margin |
|---|---:|---:|---:|
| EfsLab | 15,638 | 18,249 | 8,938 |
| EfsLabBytes | 1,658 | 1,702 | 22,918 |

The focused four-test gas report observed maximum `execute` call816,797 gas;
`executeDirect` call698,700; grant registration262,690; revoke65,699;
schema registration124,608. These maxima include only the small test samples,
and call sets contain rejection cases: averages are not useful write estimates.
Combined deployment observation3,863,185 gas. These are Foundry laboratory call
observations, not representative fee claims or complete transaction/intrinsic/
large-file budgets. The 16,384-byte laboratory file cap remains unmeasured at
the full bound; no valid C0 cap or production budget is selected.

## Reproduce

Set `EFS_LAB_SOLC` to the locally installed native solc0.8.30 executable.

```sh
forge test --use "$EFS_LAB_SOLC" --offline -vv
forge test --use "$EFS_LAB_SOLC" --offline --gas-report
forge build --use "$EFS_LAB_SOLC" --offline --sizes --skip test --skip script
```

Generated consumer artifacts: `out/EfsLab.sol/EfsLab.json` and
`out/EfsLabBytes.sol/EfsLabBytes.json`. Source ABI/formulas and shortcuts are in
[contracts-design.md](contracts-design.md).

## Findings and limitations

- Test-first root failed with the expected identity assertion, then passed;
  eight positive workflow tests initially failed on explicit unimplemented ABI
  stubs. Additional adversarial tests pressure the completed paths.
- **Formatter hazard:** Foundry's `forge fmt` removed braces around an outer
  nested owner/session `if` and rebound its `else`, changing authorization.
  Six tests immediately failed. Explicit multi-line braced branches restored
  the intended behavior, and the full18-test suite passed again. Do not accept
  formatting without rerunning authorization tests and reviewing changed branches.
- Timestamp-expiry lint warnings are expected: deadlines are chain timestamp
  policy, not exact wall-clock guarantees. A sandbox warning prevented writing
  Foundry's shared signature cache; compilation/tests succeeded without it.
- No full C0 codecs, TypeSchemaGroup admission, Principal model, BindingScope,
  Lens/Route/Mount model, ChunkTree proof tree, capabilities, finality mechanism,
  permissionless users, managed accounts, recovery, rename/move/delete or migration.
- Laboratory schema identity commits the descriptor only; it is not a nominal
  semantic Type system. Exact-schema references prevent accidental shape mismatch,
  but do not establish semantic compatibility. Schemas cannot be recursive.
- All pages/reads require one caller-pinned block basis. RPC observations alone
  are not Ethereum account/storage proofs. Direct-authorship receipts retain no
  independent signature; verify their transaction sender externally and do not
  label them portable or equivalent to retained EIP712 evidence.
- Expired/revoked session history is reconstructible from immutable approval,
  boundaries and sequential receipts. An independent reader must actually replay
  prior counters and verify witnesses; a stored signer/digest is not an oracle.
- Payloads are retained twice (carrier and exact receipt operation bytes), making
  reconstruction simple but storage-heavy. Optimize only with a measured evidence
  comparison; do not silently drop reconstructibility.
- Session operation deadline must not exceed grant expiry; keys cannot change
  author, escape target ancestry, widen operation mask, or reuse grant nonce.
- Solidity tests do not establish real wallet prompt counts, browser permissions,
  user-visible correctness, deployed production compatibility or security audit.

No secrets, public deployments, new repos or commits were created by this lane.

## Onchain helper/consumer extension — executed

Added compile-in `consumer/LabRead.sol` and actual `LabReadConsumer`. This is a
stateless consumer example, not an SDK authority contract. It requires explicit
Core runtime hash/runId/profile, performs fixed60,000-gas staticcalls, and checks
returndata size before allocating/copying. Exact tuple/dynamic-layout checks
precede interpretation. `currentFile` returns current revision/content;
`score` verifies exact schema, Record and content hashes before decoding a u64.
It never reports absence from missing/reverting/malformed dependency calls.

Test-first stub failed the two intended assertions (`actual file`, `typed
score`). Real implementation now passes **3/3 consumer tests**, including real
Core reads, code/run/profile/schema mismatch and malicious reverting,4096-byte
oversized, short malformed and gas-exhausting providers. Combined fresh run:
**21/21 tests passed, including128 fuzz cases**.

Consumer runtime2,604 bytes, initcode2,630; the helper's compiler-generated57-byte
library artifact is not deployed by this design. Deployment observation616,249
gas. Focused consumer gas report: `currentFile` maximum65,502 (includes the
gas-burning adversary), `score` maximum27,220, within the disclosed local call
sample. Those are method-call observations, not full transaction cost/finality.
Artifact: `out/LabReadConsumer.sol/LabReadConsumer.json`. Helper is compiled via
its importing test/consumer; `forge test` builds it even though it is outside src/.

Remaining limits: only one file head and one exact u64 typed scalar; no arbitrary
schema decoder, path scan, finality proof or complete Solidity SDK. A caller with
insufficient total gas can still run out of gas; the bounded subcall does not
promise invulnerability to the caller's own undersized budget.

## Isolated formatter reproduction

Reproduced without touching working Core again, using a fresh standalone scratch
file. `forge --version`:1.7.1, commit
`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`, dist build2026-05-08.
Command: `forge fmt /private/tmp/efs-lab-formatter-repro.sol`.

Exact input function:

```solidity
function select(bool ownerPath, bool authorized) external pure returns(uint8 result) {
    if(ownerPath) { if(!authorized) revert(); }
    else result=3;
    return result;
}
```

Actual formatted output:

```solidity
function select(bool ownerPath, bool authorized) external pure returns (uint8 result) {
    if (ownerPath) if (!authorized) revert();
    else result = 3;
    return result;
}
```

The output binds `else` to the nearest inner `if`, whereas the input's braces
bind it to the outer `if`. This isolated output confirms the formatter
transformation independently of concurrent repository edits. The initial Core fix used
explicit multi-line braces around both branches and the nested condition.

## Independent-review hardening — latest verification

The current fully multiline braced dispatch survived two formatting passes on a
separate copied workspace; the original one-line-input defect above remains
reproducible, but corruption of that fully multiline form was not reproduced.
Nevertheless dispatch now calls `_authorizeOwner` or `_authorizeSession`, with
no nested `if` in either dispatch branch. This eliminates dangling-else risk
structurally rather than relying on preservation of the multiline braces.

Added three least-privilege session tests for masks1/2/4 (mkdir/create/revise).
Each proves its allowed operation works and the other two are rejected without
consuming grant nonce/budget or mutating existing semantic state. No ABI or
permission semantics changed.

Fresh authoritative run: **24/24 tests passed**, including128 payload/range fuzz
cases. Fresh separate-copy run, after **two `forge fmt` passes** on copied Core:
**24/24 tests passed**, including128 fuzz cases. The shared source was not
formatted during this review pass. Commands used a temporary standalone copy of
src/, test-sol/, consumer/ and foundry.toml, with the same native solc0.8.30.

The helper refactor changes code hashes and reduces Core runtime to**15,624
bytes**, initcode**18,235 bytes**; carrier remains1,658/1,702 and consumer
2,604/2,630. Earlier size/gas figures above are explicitly the initial pre-refactor
observations. Rebuild/redeploy local runs and refresh pinned runtime hashes when
consuming this source revision.
