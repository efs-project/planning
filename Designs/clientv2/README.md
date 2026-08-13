# EFS clients and OS — historical v2 round map

This directory preserves the official-client/Web-OS round produced on
2026-07-07: 14-lane researched foundation → thesis with fork rulings → thirteen
model docs → amendments → [[client-os-pressure-report]]. Evidence corpus:
[Reviews/2026-07-07-clientv2-corpus/](../../Reviews/2026-07-07-clientv2-corpus/README.md).

> **Greenfield product-layer correction (2026-08-12):** this set is evidence,
> not one automatically adopted client architecture. The active boundary is:
> EFS Core; reusable reader/File Browser/presentation/runner modules; a
> self-hostable direct EFS Web Client with a guest path; optional EFS OS; and
> optional Commons. A fresh qualifying L3 read must not boot the OS or require
> Commons.
> Reconcile the thesis after the direct Files/Arcade slice; see
> [[../efsv2/system-constitution]].

**Reading order for James:** [EFS 2.0](../efsv2/README.md) first. Return here
only for OS/client evidence or the held [owner decision inbox](./owner-decision-inbox.md).

**Historical-round reading order:** [[fable-client-v2-handoff]] (the mandate) →
[[web-os-thesis]] (the July thesis and its internal amendments) → the relevant
model docs → [[open-questions]] → [[client-os-pressure-report]]. None of that
sequence outranks the current greenfield rulings.

## Historical thesis layer

| Doc | What it proposed in the July round |
|---|---|
| [[web-os-thesis]] | The thesis, rejected/adopted-within-that-round OS assumptions, ring architecture, fork recommendations F1–F13, amendments, honesty doctrine, non-goals, and naming frame. These are evidence until revalidated. |
| [Ethereum-first EFS and OS](../efsv2/ethereum-first-efs-and-os.md) | **Research frame, not a ruling:** explores how an Ethereum-native EFS profile and a broader local-first OS can coexist, then contract through comparable vertical slices. |

## Model docs (each elaborates named forks; thesis wins on conflict)

| Doc | Rules | Forks |
|---|---|---|
| [[kernel-capability-model]] | The Ring-3 cage (SES-in-Worker + CSP asymmetry), render surface modes + surface-mode schema v0, capability table/ports/membranes, manifests, resolvers/runners, the `efs.*` re-cut, quotas, admin tier | F1, F2, F8 |
| [[shell-and-sessions]] | System Chrome / Session Shell split, shell-contract@1, modes, Rescue Shell + health gates, the full secure-ceremony spec (R0–R3 risk routing), prompt budget, first-run truth orientation | F3 |
| [[boot-and-profiles]] | Link taxonomy + `#efs1.` fragment grammar, capability links, the boot pipeline + cold-start budgets, generation links, profile import review | F11, F12, F4-boot |
| [[packages-and-updates]] | Package/channel/release records, closure manifests, generations + rollback + migration ledger, k-of-n auto-update, cooldowns, capability diffs, our own distribution, curator-compromise recovery | F4 |
| [[persistence-and-sync]] | Protection tiers A–D, storage engine picks, single-writer discipline, the journal, cache metadata, eviction/loss honesty, backup/escrow, Sync Center | F7 |
| [[wallet-and-actions]] | Personas, key custody ladder, the signing ceremony (summary/digest/risk classes), outbox/flush, signed-bundle custody + abort artifacts, submission rails | F6, F7 |
| [[network-privacy]] | Endpoint capabilities + privacy classes, broker enforcement, verified reads (Helios), OHTTP posture, traffic-shape invariants, endpoint onboarding, privacy center | F5 |
| [[locale-and-accessibility]] | LocaleHandle + entropy budget, two-track rendering, language/font packs, input/IME, `<efs-identifier>`, WCAG 2.2 AA floor, offline translation | F10 |
| [[agent-native]] | Agent-session principal, plan→dry-run→approve→execute→receipt pipeline, trifecta invariant, mandates/budgets, agent surfaces, bridges-as-exhaust, evaluation tasks | F9 |
| [[system-surfaces]] | The full surface map with trust classes, v2-launch vs later, per-surface honesty obligations, retention-app question | cross-cutting |
| [[threat-model]] | Assets, adversaries, attack trees, mitigations, residual-risk honesty table, truth-trap conformance items, incident response | cross-cutting |
| [[sdk-boundaries]] | `@efs/sdk` vs `@efs/os-sdk` for the native-envelope era, dual-target app pattern, one-IDL contracts, versioning, conformance suites | F8, dev platform |
| [[research-digest]] | Consolidated research findings with dated primary sources; exists/emerging/invention split; standards watch list | evidence |

## Consolidation

| Doc | What it holds |
|---|---|
| [owner decision inbox](./owner-decision-inbox.md) | Held evidence inventory. It has no live James-facing choice until the direct client/Files slice produces a real fork. |
| [[open-questions]] | James-level decisions, per-doc open questions index, recommended next investigations (spikes/prototypes) |
| [[client-os-pressure-report]] (in `efsv2/`) | The twelve pressure clusters on the protocol set; P1/P2/P4c/P11 are freeze-window-relevant |

## Inputs (pre-round, kept for provenance)

[[fable-client-v2-handoff]], [[os-research-compass-for-fable]], [[agent-native-os-compass-for-fable]], [[fable-client-v2-kickoff-prompt]].

## Competitive input (2026-07-29)

| Doc | What it holds |
|---|---|
| [[file-browser-requirements]] | Feature bar for the Files app (§20 of [[system-surfaces]]) derived from the ArDrive teardown + mainstream-drive baseline: MATCH/DIFFER/SKIP buckets, the first drawing of lenses-in-a-file-UI, mount-compatibility constraints, and acceptance tests. Evidence: [Reviews/2026-07-29-ardrive-product-teardown.md](../../Reviews/2026-07-29-ardrive-product-teardown.md) + corpus. |
| [2026-08-13 browser-runner evidence](../../Reviews/2026-08-13-claude-evidence-round/README.md#browser-runner-evidence) | Dated macOS measurements for sandboxed frames plus WebKit, Gecko, and Chrome-Android documentation reports. This is partial runner evidence only: it does not complete the separate Worker/CSP cage spike, establish mobile behavior, or select permissions or policy. |

## Next research round

| Handoff | Purpose |
|---|---|
| [[fable-third-party-app-model-handoff]] | Deep comparison of WASM/WASI/Components, Blazor/.NET, HTMX-inspired and typed UI, JS/SES, iframe compatibility, and other third-party app models. No runner, ABI, or UI model is selected. |

## Status

Everything remains `#status/draft`. The original set was written 2026-07-07 by
fable-5 and internally reconciled within its own assumptions. It is now a
client/OS research corpus, not the active product architecture. The next pass
starts from the direct guest Web Client + shared Files + optional OS boundary,
then selectively revalidates capability, sandbox, offline, account, and app
ideas against measured slices.
