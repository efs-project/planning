# KEL identity-foundation research corpus — 2026-07-11

This directory is the supporting record for [[2026-07-11-kel-identity-foundation-review]] and the canonical draft [[kel]]. It archives the independent architecture lanes, current Ethereum-account research, crypto red team, and cross-system completeness review requested by the KEL deep-dive.

## Method

1. Re-read the live EFS v2 identity, envelope, kernel, lens, privacy, on-chain-completeness, freeze, and client-account corpus.
2. Run independent precedent and Ethereum-account lanes against current primary sources as of 2026-07-11.
3. Compare four candidates: KERI-faithful, did:plc-shaped, Farcaster-registry-shaped, and native EFS.
4. Attack pre-rotation, home selection, admission timing, recovery veto/capture, sessions, passkeys, threshold crypto, PQ migration, privacy, and historical evidence.
5. Trace the surviving synthesis through kernel admission, deterministic IDs, revocation, lenses, replication, time, privacy, accounts, organizations, OS UX, packages, and encrypted data.
6. Separate Etched reservations, Durable conventions, explicit rejects, executable gates, and decisions that genuinely need James.
7. Re-attack the native synthesis with three specialists; apply the no-go findings and archive them separately before handoff.

No implementation was attempted. The result deliberately blocks the prior KEL reservation from freezing.

## Files

| File | Purpose |
|---|---|
| [precedents-and-candidates](./precedents-and-candidates.md) | current precedent status, copy/avoid rulings, four candidate architectures, native synthesis |
| [ethereum-accounts-and-ux](./ethereum-accounts-and-ux.md) | Ethereum standards matrix, smart-wallet boundary, passkeys, sessions, recovery and account UX |
| [crypto-security-red-team](./crypto-security-red-team.md) | freeze-breaking findings, control/recovery/session state machine, threshold/PQ ruling, attack matrix |
| [integration-and-completeness](./integration-and-completeness.md) | kernel/read ABI ruling, cross-system impact, grades, strategic forks, freeze and verification ledger |
| [post-synthesis-specialist-audit](./post-synthesis-specialist-audit.md) | second-pass no-go review of the native synthesis; P0/P1 corrections applied and remaining freeze blockers |

## Bottom line

The old reservation has the right direction—stable identity, pre-rotation, single-signature records, thresholds for key events, no state-dependent contract signatures—but not a safe state machine. The native synthesis separates slow root control from fast actor grants, binds the complete next control state, verifies authoritative authorship at home admission, preserves a historical authorization receipt, and treats unlinkable personas as separate principals.

The specialist re-audit ruled the home model more narrowly: each principal gets one canonically selected authority home where KEL/grant state and authoritative record admission are co-located; a sparse Ethereum-L1 `HomeRegistry` selects it, and foreign venues remain snapshots/evidence. This avoids both an L1 write for every record and dishonest “instant” revocation across bridge lag. The remaining owner/engineering choice is whether to fund that locator/proof/migration machinery and accept v1's documented dead-home limit. Chains remaining queryable forever solves retrieval, not selection or ordering.
