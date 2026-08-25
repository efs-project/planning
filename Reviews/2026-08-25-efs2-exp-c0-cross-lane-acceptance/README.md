# EXP-C0/v0 cross-lane source-lock acceptance

**Status:** completed static serialized-consumption review;
`technicalDisposition = RECOMMEND-GO-CODE`,
`recommendedOwnerAnswer = YES`, `ownerDecision = PENDING`, and
`goCodeAuthorized = false`; no protocol, freeze, deployment, durability, or
production authorization

#status/done #kind/review #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/readiness

## Verdict

The SDK and no-wallet Data Explorer independently consumed byte-identical
`EXP-C0/v0` source-lock receipts and the same five serialized Core inputs. Their
committed role reports pass the bounded static checks without a P0/P1 truth or
read-ABI mismatch. V2-C1 is therefore answerable with
`technicalDisposition = RECOMMEND-GO-CODE` and
`recommendedOwnerAnswer = YES`.

This is a technical recommendation, not the answer. `ownerDecision = PENDING`
and `goCodeAuthorized = false` until James records a ruling. The verified
evidence is still disposable, nonconformant, non-durable, nondeployable, and not
production-ready, with zero complete literal replays of the 61 sealed traces.

The review proves only committed serialized consumption. It does not prove the
Explorer E1a or E1b direct-read gates, a runtime dependency trace, the full G6
developer/product program, ceremony-final bytes, or century-scale fitness.

## Exact evidence

- Core packet: `b9088d6a24f4d40bcca6ba300523b25cc7c608d2`
- SDK packet: `57d04f85ae2687ee8ea63d945378df5a9a6492a5`
- Explorer packet: `8d90ecbf85390f1151fa1b2dbf93852a1bfc8448`
- byte-identical source-lock receipt SHA-256:
  `c750a63b248d5a9a24d591046aa439d4e1b2eb07b127d49d734700b3048a2858`
- SDK role-report SHA-256:
  `ef8ba1b09f42f8287b2e4ab9a87ef30a6e3d2e5af98cccb7f2bf06c2c1799f7b`
- Explorer role-report SHA-256:
  `094c87a0650390065976dd51f097946eefb6be0c128d54861f2ee70fc914d1b3`

`acceptance-v0.json` is a compact, environment-free review artifact. The
checker uses `git show <commit>:<path>` rather than live worktrees. It verifies
both committed receipts and role reports, compares each lane's five vendored
serialized inputs against the exact five Core files at the pinned Core commit,
and rejects role/order, receipt, report, source-binding, P0/P1, or authority
mutations.

Run:

```sh
node Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/check-acceptance.mjs
node --test Reviews/2026-08-25-efs2-exp-c0-cross-lane-acceptance/*.test.mjs
```

## Nonadoption boundary

This review does not alter or repin the locked Core handoff, consumer contract,
vectors, generators, Type bytes, Result ABI, IDs, domains, limits, contract
topology, SDK package API, Explorer UI, Realm, chain, address, or deployment.
Candidate engineering remains unauthorized while `ownerDecision = PENDING` and
`goCodeAuthorized = false`; `GO-FREEZE` and `GO-DEPLOY` remain later, separate
ceremonies.
