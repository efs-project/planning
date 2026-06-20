# EFS SDK — Review backlog (tracked work)

**Status:** review
**Source:** [[sdk-architecture]] · the 5-pass comprehensive review at `sdk/docs/reviews/2026-06-19-comprehensive-review.md`
**Last touched:** 2026-06-20 (extracted from the 2026-06-19 review so the open P-items aren't lost)

#status/review #kind/design #repo/sdk #repo/planning

---

This tracks the **open** findings from the 2026-06-19 comprehensive review so they survive as
work, not just prose in a review file. It is the planning-vault pointer; the per-slice
implementation choices land as **SDK ADRs** in the `sdk/` repo (boundary rule, `docs/adr/README.md`).
See the **Implemented vs Designed** manifest in [[sdk-architecture]] for what is built today.

## P1 — fix before relying on it (correctness, docs, trust)

These are small and clear; they gate "production-trustworthy," not "feature-complete." Several are
already reflected as warnings in the manifest.

| # | Item | Where | Kind |
|---|---|---|---|
| 1 | `info().verified` reports `matches-author` without hashing bytes → must be `unchecked` | `reads/file.ts:280-284` | correctness (false trust signal) |
| 2 | Written files don't appear in the author's own lens listing — ancestor-walk visibility TAGs not emitted on Tier-1 write | `writes/graph.ts` | correctness |
| 3 | Provenance read swallows RPC errors to a zero pin (`.catch(() => {pinUID: ZERO_UID})`) → distinguish absence from RPC failure | `reads/file.ts:133-145` | correctness |
| 4 | Package `README.md` quickstart shows the OLD API (`read`→`fetch`); first snippet doesn't compile — regenerate + add a `tsc` doctest. `docs/specs/overview.md` prose stale the same way | `README.md`, `docs/specs/overview.md` | docs |
| 5 | No-wallet/no-lens read throws `LensRequired` — ship a `SYSTEM_LENS` default so a public file reads in one line (router already falls back) | lens resolution | DX / consistency |
| 6 | `list({ excludes })` throws `InvalidDirectoryQuery` though it's a typed, documented option with `SAFETY_EXCLUDES` exported — wire it or remove from the public type | `reads/directory.ts`, `reads/list.ts` | present-but-throwing trap |
| 7 | `CallStatus` / `OperationKind` are CLOSED unions pinned to EIP-5792's evolving wire format — add the `| (string & {})` open tail | `types.ts` | 50-yr type durability |
| 8 | `EfsContracts` / `EfsSchemaUIDs` require all keys → every future primitive is a breaking change on the `deployments` override path — make additive keys optional | `chain/deployments.ts` | 50-yr type durability |
| 9 | `assertDeploymentIntegrity` checks bytecode presence only, not schema-UID match (TODO) — the read model's trust root is unverified; 1.0 blocker | `deployments.ts:110-117` | security/trust gate |
| 10 | Dead default IPFS gateway `cloudflare-ipfs.com` (decommissioned 2024-08) — drop it; keep `ipfs.io`/`dweb.link`; consider `trustless-gateway.link` | mirror gateway defaults | standards |

## P2 — completeness build-out (the roadmap to "do everything")

All additive; the builders are mechanical (`graph.ts`/`writes/graph.ts` prove the pattern). Rough priority:

1. **Edge/value writes:** `graph.tags.{add,remove}`, `props.{set,get,list}`, `graph.pins.{place,unplace}`.
2. **Finish the escape hatches first** (cheap, de-risks the rest): pre-wired `efs.raw.{indexer,router,fileView,…}`; `efs.eas.{attest,multiAttest,revoke,getAttestation}`; `efs.decode` round-trip bridge.
3. **Lists + sorts** (LIST/LIST_ENTRY contracts ready to wrap): `lists.{entries,get,create,add}`, `sorts.{read,process}`. *(Note: SORT_INFO is deferred from the frozen 9, so `sorts.*` is gated on that schema shipping.)*
4. **Mirrors add/remove, overview/setOverview, container browsing (ADR-0033), `versions.ancestors`.**
5. **Solidity SDK** read wrappers + tag/property/list writers (today: write-only, 2 of 9 schemas).
6. **Batch / preview / resume** — the headline one-signature UX; resume is type-present but behavior-absent today.
7. Deferred-OK but flag: REDIRECT (write + multi-hop read resolution), WHITEOUT (ADR-0055), multi-chunk on-chain.

## P3 — polish

`info` over-fetches `getActivePinSlot` on the pure-bytes path · `DirEntry` uses `DataUID` for an anchor
(add an `AnchorUID` brand) · `NotImplemented` messages are dead ends (add `alternative`/`tracking`) ·
ship a `bigint` JSON serializer for TanStack/Next · `MAX_LENSES` duplicated · `package.json` drop redundant
`"module"` · SSRF DNS-rebinding gap (opt-in resolve-and-pin for Node) · EFSLib `contentHash` comment
contradicts ADR-0006 (bare digest) · top-level export list dumps ~40 internal symbols into the package root.

## Resolved during the review (not backlog — recorded so it isn't re-litigated)

- **`createParents` default `true`** — kept (object-storage mental model; misplacement is recoverable via a cheap re-PIN). Zero-cost future mitigation: `preview()` lists folders to be created before signing.

## Recommended sequence (from the review)

1. Correctness + quick durability/docs wins (P1 #1, #3, #4, #7, #10 + the `verified` fix).
2. Visibility-TAG fix (#2) — the built write flow needs it.
3. `SYSTEM_LENS` default (#5) + `excludes` trap (#6).
4. Schema-UID integrity assertion (#9) — 1.0 trust blocker.
5. Escape hatches → edge/value writes → lists/sorts (the completeness roadmap).
6. Tier-2 one-signature writes + the bigger primitives as separate slices.
