# Decisions

Append-only one-line decisions log. Mirrors the pattern in `contracts/docs/decisions.md`: small calls agents (or James) made that future agents should know about, but that don't merit a full design or ADR.

**When to add:** Tier 2 or Tier 3 decision you made (per [[Onboarding/escalation]]). One line, date-stamped, with rationale.

**When NOT to add:** Tier 1 decisions or decisions that change a design — those need a real design (or supersede a design).

**Format:**

```
- YYYY-MM-DD (@agent or @james): one-line decision and short rationale [optional: links to context]
```

**Pruning.** Periodically (or when the file approaches ~500 lines), promote stabilized patterns to a real design and delete the original entries with a pointer. Mark reversed/irrelevant decisions or delete outright. Pruning is itself a Tier 3 task; log the pruning pass as one entry.

---

## 2026-05

- 2026-05-21 (@james via chat): **AI project-manager role is expected of agents.** Agents working in this vault should proactively keep James informed and prod when a deadline is at risk or something is being forgotten. The vault is the documentation surface that makes this possible — the proactive part still needs a mechanism (scheduled check-ins, etc.). Open Tier-2 question: how to wire this up (cron-style scheduled agent? per-session review prompts? something else?).
- 2026-05-21 (@james via chat): **SDK scope clarification.** EFS proper = the kernel, graph, and other contracts — immutable, simple, do their job. EFS SDK = a separate set of **upgradeable** API wrappers around the contracts to make dev usage easier. **Contracts are not part of the SDK.** Devs can call contracts directly if their APIs are good enough; the SDK provides convenience + options + ongoing improvements. SDK is owned by the EFS team and can change freely; contracts cannot.
- 2026-05-21 (@james via chat): **SDK design needs a dedicated AI thread.** Lots of design work to do; do not start implementation without a landed SDK architecture design. The Kanban entry "Design: on-chain + off-chain SDK architecture" is the placeholder; that design session is a separate thread James will initiate.
- 2026-05-21 (@james via chat): **For OnionDAO MVP**, only the on-chain and off-chain SDKs are required. The client SDK (iframe integrations, OS-type stuff) is a later concern. Re-prioritized in Kanban.
- 2026-05-21 (@james via chat): **Data-loss tolerance is phase-dependent.** On Sepolia (pre-mainnet), data may still be lost in rare cases but we try REAL HARD not to. Once we release to mainnet, data loss becomes a critical issue. Hackathon entrants at OnionDAO should be told this. Captured in [[Milestones#OnionDAO hackathon (2026-06-01 → 2026-06-30)]].
- 2026-05-21 (@james via chat): **OnionDAO hackathon (2026-06-01)** locked as next major milestone. Two tracks (datasets, SDK builds). Self-funded prizes. Schema spec freeze + contract `.sol` list freeze + Sepolia deploy + SDK MVP are hard prerequisites. See [[Milestones]] for scope.
- 2026-05-21 (@claude-opus-4.7): `_MOC.md` naming abandoned in favor of plain `README.md` per folder. README is universally understood, GitHub auto-renders, avoids PKM jargon. Captured inline in [[design-system]] § Folder READMEs.
- 2026-05-21 (@claude-opus-4.7): `Misc/` folder dropped from the planning vault layout. Uncategorized notes go to `Daily Notes/` instead. IA review consensus: miscellany folders rot. Captured in [[design-system]] § Directory layout.
- 2026-05-21 (@claude-opus-4.7): Specs stay in their owning repo (`contracts/specs/`, future `client/specs/`, future `sdk/specs/`). `/efs/` colocation removed the access-pain that motivated the alternative. Cross-cutting EFS knowledge lives in `planning/Architecture/` and `Glossary.md`. Resolves the previously-deferred "where do specs live" question.
