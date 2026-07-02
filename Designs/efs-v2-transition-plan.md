# EFS v2 transition plan — guardrails, sequence, and the last freeze

**Status:** draft
**Target repos:** planning, contracts, sdk
**Depends on:** [[deterministic-ids]], [[efs-v2-holistic-redesign]]
**Supersedes:** — (on acceptance: supersedes the 2026-06-01 never-change-frozen-schemas commitment ([[Decisions]]) and the v1 UID set in `contracts/docs/SEPOLIA_FREEZE_TABLE.md` (2026-06-11 registration))
**Reviewers:** —
**Last touched:** 2026-07-01

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk

## Problem

v1's freeze took roughly six weeks end-to-end (late May → June 11), with a 79-finding holistic review. Reopening it is the single most expensive ceremony EFS has, and an unbounded "holistic redesign" is the classic second-system trap. This plan makes the v2 window survivable: guardrails first, then a sequence in which the **verification infrastructure — not the contract diff — is the schedule driver**, ending in one batched freeze publicly committed as the last before mainnet.

## Proposal

### 1. Guardrails (in force before any design work continues)

1. **Framing ban.** Every v2 argument measures against the SHIPPED baseline (Tier-0 layered multiAttest per [[write-ux-options-ranked]]: 2–3 popups common case; burner: 0 popups). The 13-attestation/4-popup framing is a strawman and is banned. v2's justification is permanent properties (replicability, verifiability, atomicity); popup count is a corollary.
2. **Change budget.** The freeze bundle is [[efs-v2-holistic-redesign]] §1, closed at James's sign-off. Anything discovered later joins a v3 list that ships never (mainnet) or in this ceremony only by displacing an item of equal size — no net growth.
3. **Design timebox.** Two weeks from bundle sign-off to Codex freeze-candidate, with a James frame-review at the end of week 1 (the Lists lesson: the v1 LIST design ran ~18 review rounds before a frame-level correction from James reset it — frame corrections must arrive at round 1, not round 17). Breach consequence: a timebox overrun is itself a §1.5(b) checkpoint event.
4. **One freeze.** All schema-string changes — including any independent wishes (e.g. the DATA salt field would ride even a v2-rejection world) — ship in this single ceremony, publicly committed as the last pre-mainnet freeze.
5. **Abort/reopen triggers, pre-committed.** Abort v2 (fall back to: salt-field-only reservation + PathRegistry overlay + in-account 7702 routine) if: (a) the Codex external review finds a derivation flaw with no v1-domain fix, (b) the verification-gate estimate exceeds 6 weeks of remaining work at the week-3 checkpoint (owner: James; venue: the week-3 checkpoint entry in [[Decisions]]), or (c) a real publisher/partner deadline materializes that the freeze would miss and James rules it decisive. **Partial shed:** if trigger (b) nears, the holistic bundle's before-burn items (§1.3–1.4, and §1.5's mechanism) may be shed from the ceremony to later pre-burn upgrades without loss; §1.1/1.2/1.6 cannot. Symmetric reopen trigger (if v2 is aborted): a confirmed cold-key archival publisher requirement, or cross-chain replication becoming a committed product property.

### 2. Sequence

**Phase 0 — James decisions (gate: bundle signed).** The open-questions blocks of [[deterministic-ids]] and [[efs-v2-holistic-redesign]] **in full**: the coupled duplicate-policy × replication-model decision, PIN/TAG targetKind model, typed-literal seed set, virtual-anchor key set, LIST target modes, ADR-0033 raw-UID containers, blinded-disclosure vehicle, visibility-TAG mechanism, bundle boundary, and §2 convention sign-off/delegation. Nothing downstream starts until the blocks are answered — each is a derivation input, an Etched schema string, or an Etched validation rule.

**Phase 1 — the Codex (gate: external adversarial review of the spec as a standalone artifact).** Write the frozen ID-derivation + wire-format spec, whose closed table of contents is [[deterministic-ids]] §13.5 (the two enumerations are reconciled by reference — that list is canonical): all constant tables with preimages (domains, kind tags, claim-role tags, target-kind tags, datatype tags) + slot-key word layouts, derivation formulas + golden vectors, canonical-name profile (pinned Unicode version) + per-datatype encodings, schema strings + per-schema resolver semantics (duplicate/existence/refUID rules, kind-attachment matrix), EAS behavioral pin (bytecode hash + semantics), state-walk procedure, read-path semantics, contentHash/chunk-format conventions, hash-migration playbook. The review must be independent of this design lineage — derivation rules propagate by imitation: four of twelve exploration perspectives copied the forSchema-in-preimage flaw unchallenged ([[2026-07-01-v2-adversarial-review]]).

**Phase 2 — `@efs/ids` (gate: cross-language differential fuzz green).** Zero-dependency TS package + pure Solidity library implementing the Codex; golden vectors as the shared test corpus. Ships before any resolver code so contracts and SDK import one implementation.

**Phase 3 — contracts (gate: invariant suite green + CI gas snapshot).** Resolver rewrites (per-kind duplicate policy, registry-at-hook-time existence, refUID equality, virtual reserved-key anchors, typed literals, slot IDs), object registry in EFSIndexer (write-once, resolver-gated, retiring `_nameToAnchor`), `_indexGlobal` keep/demote, event set v2, router classification (registry probe first, precedence frozen). **Contract inventory for this phase:** Edge/Mirror/List/ListEntry/Alias resolvers, EFSIndexer, EFSRouter. **Deliberately deferred to the Phase-4 parallel track (redeployable surfaces):** EFSFileView, EFSSortOverlay, ListReader (~1.9k lines) re-key on EFS ids; SystemAccount's hand-encoded ANCHOR payloads and deploy/seed scripts rework land in Phase 5; the packages/nextjs debug UI is NOT ported — it stays on v1 as the fallback baseline (§4) and retires when the SDK demo replaces it (James may instead order a port as Phase-4-parallel work). Phase 5's state-walk gate and devnet smoke tests need only the minimal read surface named here. Invariant/property tests per [[deterministic-ids]] §13 are freeze-blocking, not nice-to-have. Devnet proxies make iteration cheap until the burn.

**Phase 4 — SDK (gate: one-tx integration test replaying the full write against real resolvers).** Delete the SymbolicRef/layered-submit machinery (single multiAttest builder replaces it); plan/simulate/commit surface with IDs visible at every stage; SDK-owned salt lifecycle; batch gas ceiling (~15M) + mandatory pre-flight `eth_call` simulation; visibility-TAG follow-up tx; CREATE2 chunk-factory path for large files. **Keep**: the reads/fetch-verify engine, capability detection (still wanted for gasless/paymaster and future session keys), wallet adapters. The unmerged SDK write-layer PR is superseded in place — per James, the SDK is in flux and cheap to change now; harvest its receipt/error/progress design, which carries over.
Parallel: conventions batch from [[efs-v2-holistic-redesign]] §2 (dirnodes, move doctrine + ADR-0050 resolution spec, encrypted-file conventions, link grammar, author-first lenses, lens-as-LIST, mirror fallback, enumeration re-basing) — these are docs + view/SDK work off the critical path.

**Phase 5 — seed, devnet, Codex genesis (gate: pin check + state-walk reconstruction test + v1 disposition).** Re-deploy against the pinned fork; regenerate `deployedContracts.ts`; devnet (26001993) reset + weekly-reset notice; SystemAccount writes the Codex at `/.well-known/spec` as its first file; the [[deterministic-ids]] §13.5 acceptance test (fresh implementation: golden vectors + state-walk + path-to-bytes + verify) proves the archival read path. **Sepolia v1 disposition:** enumerate attestations under the nine v1 schema UIDs (excluding SystemAccount/seed/James writes); if zero third-party attestations, record the query result in the freeze ADR; if any exist, offer a re-attestation courtesy under v2 IDs. State the v1 deployment's fate (abandoned in place vs tombstoned via a final SystemAccount notice; buildathon site repointed or retired) and banner the v1 public write path for the transition.

**Phase 6 — the freeze ceremony (gate: James).** Review-squad holistic pass (the v1 pattern), Safe-keyed CREATE3 deploys, schema registration, UID table regeneration, public last-freeze commitment. New-workstream designs ([[efs-v2-holistic-redesign]] §3: signing surface, trust-root stewardship, temporal provenance, web interop) proceed as ordinary name-first designs after the freeze — none of them touch Etched surfaces except the ERC-7730 artifact, which ships alongside the ceremony.

### 3. Estimate (honest)

Codex + review ~2 weeks; `@efs/ids` + contracts ~2–3 weeks (write-path contracts only; view re-key + read surface ride the Phase-4 parallel track — if views must stay on the critical path, widen to ~3–4 weeks); SDK + conventions ~1–2 weeks (parallel); seed + ceremony ~1 week. **6–8 weeks wall-clock with the multi-agent setup, of which the contract diff is the easy part** — the Codex review and the invariant/fuzz infrastructure are the drivers. The security lens's judgment stands: a bare one-month estimate is optimistic against the audit surface being created; budget verification as first-class work.

### 4. What happens to in-flight work

- **Tier-0 debug-UI batching**: stays live until v2 lands; it is the fallback narrative and the measured baseline.
- **SDK `chore/scaffold` branch**: write layer superseded (see Phase 4); reads, errors, receipts, detection carry forward.
- **EFSWriter / 7702 in-account routine**: paused, not deleted — post-v2 it returns as gasless/session-key enhancement (one popup → zero popups), no longer as the atomicity mechanism.
- **efs-account-system (B′)**: unchanged and complementary; v2 removes its write-path dependency, keeping identity/recovery/session-keys as its own track.
- **Hackathon assets**: the buildathon wind-down decision stands ([[Decisions]] 2026-07-01); v2 does not chase that audience — per the demand finding, the discoverability workstream ([[efs-v2-holistic-redesign]] §3.4) is the demand lever.

## Open questions

- [ ] Confirm the abort/reopen triggers (§1.5) — these are pre-commitments and only James can make them.
- [ ] Who performs the Codex external review (fresh agent lineage minimum; outside human reviewer if available)?
- [ ] Devcon/timeline collision check: does a 6–8 week window conflict with any date James is holding?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

PR tracking (fill at implementation):

```
- [ ] contracts#NNN — Codex ADR + resolvers + registry
- [ ] contracts#NNN — events v2 + index keep/demote
- [ ] sdk#NNN — @efs/ids
- [ ] sdk#NNN — write-layer replacement
- [ ] planning — conventions batch (per-doc)
```
