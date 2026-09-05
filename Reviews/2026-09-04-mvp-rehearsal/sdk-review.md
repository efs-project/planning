# Independent SDK review

**Status:** closed — all findings resolved in the disposable `efs-lab/1` workflow subset; not a C0, production, or protocol-conformance review

**Reviewed:** `sdk/index.js`, `sdk/index.d.ts`, `test/sdk-unit.test.mjs`, and `test/integration.test.mjs`

**Verification:** initial `npm test` passed 25/25 tests on 2026-09-04. After the repair, `node --test test/sdk-authority.test.mjs` passed its focused authority regression and `npm run typecheck` passed. The implementation delta and new negative test were independently inspected.

## Resolution

- **Resolved:** canonical success now requires both independently observed state and `authority=AUTHORIZED_AT_BASIS`. State that matches while authority is unknown or contradictory remains separately visible as `stateEffect=OBSERVED_AT_BASIS`, but cannot become `READ_BACK_VERIFIED` or `effect=COMMITTED`.
- **Resolved:** relayed authority now derives from the recovered owner signature and stored-signer equality rather than assigning an affirmative grade unconditionally.
- **Resolved:** `CanonicalReadBack` and its comparison variants are declared in TypeScript, `readBack` returns that interface, `canonicalOperation` requires its non-defaultable fields, and the sample passes a strict NodeNext TypeScript check.
- **Resolved follow-up:** exact schema reads and `validateTypedPayloadAtBasis` now recompute the descriptor-derived schema ID before exposing trusted decoded/validated content. A valid-shaped descriptor substituted under another requested ID remains `FOUND` evidence but has no trusted value, is `validation=INVALID` and `integrity=FAILED`, and retains the observed descriptor, computed ID and raw RPC bytes. The focused substitution regression passed independently.

The original findings are retained below as review history. They are no longer open.

## Findings

### P1 — canonical success does not require recovered authority

`readBack` deliberately removes every `authority.*` check from `effectChecks`, then returns `stage: READ_BACK_VERIFIED` and `effect: COMMITTED` solely from the remaining checks (`sdk/index.js:1196-1219`). Thus a direct read-back whose transaction body is unavailable leaves `authority=UNKNOWN` (`sdk/index.js:1128-1140`) yet may still return canonical success. A contradictory session/owner authority result can likewise produce `UNAUTHORIZED_PROVEN` alongside `effect=COMMITTED`.

The qualification axes should remain distinct, but the MVP0 success gate requires the operation's receipts and historical authority to bind to the same operation before the workflow reports read-back-verified success. Either make the returned state explicitly “effect observed, authority unproved,” or require the relevant authority checks for `READ_BACK_VERIFIED` in this workflow. Add fault cases for unavailable/substituted direct transactions and contradictory stored signer/grant evidence.

### P1 — relayed authority is marked authorized even when its stored signer check fails

For mode 2, the SDK verifies the witness against the configured owner, appends the separate `storedReceipt.signer === owner` check, and then unconditionally assigns `AUTHORIZED_AT_BASIS` (`sdk/index.js:1077-1080`). A dishonest or internally inconsistent provider response therefore receives an affirmative authority grade instead of `UNAUTHORIZED_PROVEN` or `UNKNOWN`.

The exact pinned lab runtime makes this contradiction impossible on an honest chain, but RPC observations are explicitly untrusted and no state proof is verified. Derive the grade from every required authority check, as the session branch already does, and retain the contradiction as evidence.

### P2 — the TypeScript contract erases the most important read-back result

`readBack` is declared as `Promise<Record<string, unknown>>` (`sdk/index.d.ts:138`), so consumers cannot safely discriminate `CanonicalReadBack`, its stage, comparison, effect, qualification, recovered receipt, or typed unknown reason. This undercuts the report's claim of a TypeScript-facing five-seam contract precisely at the semantic-success seam.

Declare a `CanonicalReadBack` interface/discriminated result. Also tighten `canonicalOperation`: its declaration accepts `Partial<Operation>` (`sdk/index.d.ts:152`) although runtime canonicalization requires `deadline`; a compile-only TypeScript consumer test would catch this mismatch. The report already acknowledges that no compiler gate exists.

## Non-findings / retained strengths

- Semantic calls pin EIP-1898 block hashes and verify supplied Core/byte-store runtime hashes plus `runId`, `rootId`, `owner`, and byte-store address before decoding.
- Exact `Missing()` is distinguished from provider/revert failure; pages preserve partial coverage; corrupt returned bytes remain available-but-integrity-failed.
- Session historical reconstruction is bounded and preserves registration, revocation, nonce, write, byte, expiry, signer, and ancestry checks. The defect is how those checks gate the top-level success result, not their absence.
