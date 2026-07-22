# Client v2 design set — map

The official EFS client v2 ("web OS") design set, produced 2026-07-07 by the Fable client-v2 round: 14-lane researched foundation → thesis with fork rulings → thirteen model docs written against it in parallel with structured conflict-surfacing → thesis amendments → the [[client-os-pressure-report]] back into `Designs/efsv2/`. Evidence corpus: [Reviews/2026-07-07-clientv2-corpus/](../../Reviews/2026-07-07-clientv2-corpus/README.md) (research digests with dated primary sources, decision framework, worklog).

**Reading order for James:** [owner decision inbox](./owner-decision-inbox.md) → linked detail only when useful.

**Reading order for a fresh reviewer:** [[fable-client-v2-handoff]] (the mandate) → [[web-os-thesis]] (the ruling layer — F1–F13 **plus its Amendments section, which wins**) → the model docs you care about → [[open-questions]] → [[client-os-pressure-report]] (what this round asks of the protocol set).

## The ruling layer

| Doc | What it rules |
|---|---|
| [[web-os-thesis]] | The thesis, rejected/adopted OS assumptions, the ring architecture (Bootstrapper → Kernel → System Chrome → Session Shell → apps-in-Workers), fork rulings F1–F13, post-fan-out amendments, honesty doctrine, non-goals, naming frame. |

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
| [[wasm-wasi-app-platform]] | WASM-first, not WASM-only app substrate; WIT worlds, deny-by-default WASI imports, browser/native adapters, framework lanes, packaging, quotas, and evidence gates | F1, F8, app platform |
| [[research-digest]] | Consolidated research findings with dated primary sources; exists/emerging/invention split; standards watch list | evidence |

## Consolidation

| Doc | What it holds |
|---|---|
| [owner decision inbox](./owner-decision-inbox.md) | The sole live James-facing queue: examples, options, recommendations, timing, and links to detail |
| [[open-questions]] | James-level decisions, per-doc open questions index, recommended next investigations (spikes/prototypes) |
| [[client-os-pressure-report]] (in `efsv2/`) | The twelve pressure clusters on the protocol set; P1/P2/P4c/P11 are freeze-window-relevant |

## Inputs (pre-round, kept for provenance)

[[fable-client-v2-handoff]], [[os-research-compass-for-fable]], [[agent-native-os-compass-for-fable]], [[fable-client-v2-kickoff-prompt]].

## Status

Everything remains `#status/draft`. The original set was written 2026-07-07 by fable-5 and internally reconciled (parallel-authored conflicts adjudicated in thesis Amendments 1–13; cross-doc residue in [[open-questions]]). [[wasm-wasi-app-platform]] and thesis Amendment 14 were added 2026-07-22 from James's WASM/WASI platform ruling. Next: evidence spikes, coordinated EFS v2 reconciliation, and eventual promotion review.
