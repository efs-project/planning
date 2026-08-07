# EFS Git — thin prototype plan and executable acceptance suite

**Status:** deep-dive plan, 2026-08-07. Design-research output; **not implementation authorization.** Milestones are ordered so each falsifies the biggest open risk it can reach; candidate A's artifacts are milestones 1–2, candidate B completes at 5.

#kind/review #status/done #repo/planning #topic/git

## Milestones

**M1 — Identity + archive slice (candidate A floor).** Import a real Markdown-heavy repo; mint genesis/descriptor records on devnet; produce checkpoint container + `ClosureManifestV1`; place on two carriers (plain HTTPS + one other); stock `git clone` from a gateway serving the reconstructed bare repo. *Falsifies:* container/manifest conventions, descriptor shape.

**M2 — Ref transactions + fold.** Implement `GIT-REF/1` twice (TypeScript + one other language); admit ref claims on devnet (evidence lane first; authority lane when available); run the vector suite: CAS races; replay in all three cases (re-carriage of admitted claims / late first admission / ABA via delete→recreate, force-back, and tag-move); primary-vs-supplemental receipt handling; torn-envelope and relayer-subset (`TRUNCATED-TXN`) cases; refname-grammar and D/F-conflict fixtures; epoch rollback; force/restore incl. the policy-epoch recovery ceremony; non-fast-forward ADVANCE flagged `ANCESTRY-VIOLATION` by the object-bearing verifier; cross-venue claims staying evidence-grade; degraded rungs. *Falsifies:* the deterministic-fold bet — the recommendation's keystone.

**M3 — Stock write path.** Gateway intake for *all* stock pushes is refs/for-style (`proc-receive` reports the proposal/pending result via `option` lines; the gateway **never reports `ok` on a `refs/heads/*` command it hasn't authoritatively applied** — receive-pack's synchronous report-status semantics leave no honest third option); direct-publish is reserved for EFS-aware clients that can wait for countersign+admission. One authorized publish and one atomic two-ref publish end-to-end; CI push via session grant. *Falsifies:* P-G8's no-gateway-signing ceremony and the intake trilemma's resolution.

**M4 — Walk-away drill (trace T14).** Kill every service from M1–M3; independent operator rebuilds clone+browse+history from chain + carriers using only public specs. Timed, recorded, repeated after changes. *Falsifies:* G-EXIT.

**M5 — Wiki vertical.** Browser editor (sparse working set, OPFS), publish/propose/accept/restore flows, G1 guest page/history/diff views (honesty split per wiki doc §4), two-versions conflict UI. Ten-user dogfood on a real wiki (the planning vault's public notes are a candidate corpus). **Measured exit criteria:** conflict rate (the transplanted <1 % figure is a lower bound — offline sessions and batching widen windows), publish→guest-visible latency against a stated budget, per-publish placement cost, and proposer-funding flow actually exercised (who paid). *Falsifies:* browser-Git feasibility + the whole UX bet.

**M6 — Skills rider.** One skills repo, two releases (one capability-broadening), GATE-connected install diff (trace T15).

## Executable acceptance suite

Adopted from the GoE pressure test (its core-Git / portability / workspace / GoE-compat sections stand) plus this pass's additions; every item is a scripted, repeatable check:

### Core Git
1. SHA-1 and SHA-256 repos round-trip byte-exact (OIDs unchanged) through import→publish→export.
2. Anonymous stock clone/fetch, no wallet, no helper.
3. Authorized stock push; atomic two-ref push rejected wholly on one stale ref (E4 parity); a relayer-carried subset of a multi-ref envelope derives `TRUNCATED-TXN`, never a partial application.
4. Tags (annotated + lightweight), branch delete, default-branch selection.
5. Thin/malformed/oversized/bomb packs rejected at intake with named errors (E8 + limits, WARN/INFO fsck checks raised); materialization surfaces (diff/render/working-set) run under fan-out/depth budgets against a git-bomb fixture (detonation happens at materialization, not admission — security lane).
6. Repack to a different layout → clean clone equivalence (E3 parity).
7. LFS round trip incl. pointer-only clone.

### Portability & neutrality
8. `repoId` stable across: gateway swap, carrier swap, EthStorage→alternate migration (validation-program Phase-D shape).
9. Authority rotation + full recovery without identity change (trace T11).
10. Clean-room rebuild ≤ documented hours, no EFS-operated anything (trace T14).
11. Displaced-history recovery after force-push (trace T9); displaced closure retrievable N days later.
12. Two independent gateways derive identical canonical refs from the same chain state (fold determinism in production shape).
13. Replay in all three T7 cases: re-carriage of an admitted claim is a kernel no-op; a late-first-admitted stale envelope is admitted-never-applied, visibly attributed; ABA recurrence is refused by the predecessor witness.
14. Bytes-unavailable renders as availability failure, never absence (C-2 conformance); a head advertised with unplaced closure is refused at gateway intake and flagged by verifiers, and the branch recovers via the policy-epoch ceremony.
14b. Stock `git clone` output is served with `refs/efs/attest` present, and `git efs-verify` over that clone reproduces the fold verdict — the unverified-rung mitigation exists and works.

### Wiki
15. Edit→publish ≤ 2 user actions after typing; publish-to-guest-visible latency measured and honest.
16. Same-or-adjacent-sentence concurrent edit → two-versions UI, merged result correct (trace T3); edits separated by an untouched sentence → silent clean merge (E9b parity).
17. Rename keeps old moving links resolving (redirect) and old citations exact (trace T5).
18. Restore = revert commit; history shows both (trace T8); no force accepted on the canonical branch (H-10).
19. Offline: 3 commits offline, one batched publish, honest ladder throughout (trace T6).
20. Account-free-reader proposal→acceptance loop end-to-end (trace T2), **with the funding path pinned and exercised** (self-paid or sponsored-with-ceilings — whichever the design adopts).
21. Export to Forgejo and re-import: zero object/OID loss (trace T13).

### Skills
22. Release pin, capability diff on broadened update, disable-until-approved (trace T15).

## Evidence gates consumed (not owned) by this plan

- E2 fixture prices the wiki publish envelope (before M5 sign-off).
- EthStorage/GoE adapters remain behind the documented production-review gates; M1 uses plain HTTPS + one reviewed carrier if that gate hasn't passed.
- Browser-Git feasibility numbers from the prior-art lane bound M5's client scope before it starts.
