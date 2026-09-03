# EFS v2 SDK — current MVP-C0 spine

**Status:** draft set — bounded interface contraction; no package, ABI, implementation, deployment, or permanent profile is authorized
**Target repos:** planning, sdk, client
**Depends on:** [[../efsv2/disposable-mvp-profile]], [[../efsv2/mvp-c0-genesis-manifest]]
**Consumers:** [[../web-client-os/mvp0-acceptance]], [[../data-explorer/README]]
**Inputs:** useful seam evidence distilled from `origin/codex/sdkv2-pm` at `57d04f85ae2687ee8ea63d945378df5a9a6492a5`; its legacy result/experiment wire shapes, package topology, and branch-local rulings are not imported
**Reviewers:** —
**Last touched:** 2026-09-03

#status/draft #kind/design #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/read-path #topic/coherence

## Read this on a phone

**Verdict:** MVP-C0 needs five shared semantic seams and no larger SDK
surface: exact read, scoped page read, verified byte read,
plan/authorize/submit, and canonical read-back.

Generated conveniences may make those seams pleasant, but the SDK always
retains the exact canonical bytes and the complete qualification/evidence
surface from [[../efsv2/disposable-mvp-profile]]. It does not invent another
universal result enum or reinterpret the ordered genesis in
[[../efsv2/mvp-c0-genesis-manifest]].

The normal write target is one relayed-EOA wallet prompt for the exact C0
`WritePlan`. Direct EOA is a separately labelled one-transaction-prompt
fallback. Same-Principal session operation reaches zero routine wallet prompts
only after the bootstrap EOA's bounded revocable grant is canonical and
independently read back; linked first-use totals retain setup/grant prompts.
Wallet, relay, bundler, user-operation, and transaction acknowledgements are
progress evidence, never semantic success.

## Current contract

[[mvp-interface]] owns the contracted interface and product boundary:

1. the SDK owns canonical codecs, deterministic planning, authorization
   verification, submission adapters, evidence retention, and canonical
   read-back;
2. File Browser owns the first thin guest/read/write journey; and
3. [[../data-explorer/README|Data Explorer]] owns a separate general typed-data
   workspace and consumes the shared Inspector/view contract without becoming
   a route gateway or a second write stack.

The interface is a disposable MVP-C0 consumer contract. Passing it can support
the next experiment; it cannot freeze protocol bytes, Type/query identity,
Principal semantics, carrier policy, numeric limits, packages, or a product
release.

## Documents in this set

| Document | Owns |
|---|---|
| `README.md` | Current scope, authority boundary, and routing |
| [[mvp-interface]] | Five semantic seams, typed product results, prompt paths, and implementation ownership |

## Explicitly outside this contraction

- an open schema interpreter or universal oversized wire envelope;
- package/repository topology, code generation policy, helper deployment, or
  public compatibility promises;
- permanent Type, QueryProfile, Principal, authorization, carrier, limit, or
  result encodings; and
- production SDK, File Browser, Data Explorer, public deployment, or durable
  user data.

## Open questions

No new owner choice is requested by this contraction. Upstream MVP-C0 evidence
gates remain open in [[../efsv2/disposable-mvp-profile]] and
[[../efsv2/mvp-c0-genesis-manifest]].

## Pre-promotion checklist

- [ ] All upstream MVP-C0 evidence gates are resolved or explicitly deferred
- [ ] `**Target repos:**` confirmed
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one independent review confirms all five seams preserve the imported result and receipt laws
- [ ] The project owner reviews the product ownership split
