# v2 Codex — Native kernel (Etched artifact)

**Status:** draft
**Target repos:** contracts, planning
**Depends on:** [[codex-envelope]], [[codex-kinds]]
**Base text:** [native-kernel.md](../../Reviews/2026-07-07-efsv2-corpus/native-kernel.md) + [attack-kernel.md](../../Reviews/2026-07-07-efsv2-corpus/attack-kernel.md) (red team: direction survives — the arch-D replay-as-rollback fatal is VERIFIED CLOSED for slots; five serious findings, all amended below)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/contracts

> **2026-07-11 freeze blocker — generic confluence is not sufficient for authoritative KEL authorship.** [[kel]] §§8–9 requires a KEL-aware, home-ordered admission lane that validates live actor/grant authority and persists an immutable `AuthReceipt`, plus a distinct evidence/import lane for merely portable signatures. The later peer-kernel/backward-union plan below cannot give contracts a bounded Tier-1 authorization answer or prevent removed-key backdating. Reconcile the entrypoints, state, ABI, receipt/evidence semantics, and confluence boundary before freezing this artifact.

## What this document is

The ruling layer over the kernel design. The base text was overtaken in-session by the kinds ruling and envelope spec (deliberate — parallel design, reconciled here); the amendments re-cut it to the adjudicated interfaces. Where documents disagree, the precedence is: [[codex-envelope]] > [[codex-kinds]] > this document > base text.

**Base sections overruled (not in force as written):** §2/§2.1 claimId formula + pinned envelope constants → amendment 1 + [[codex-envelope]]; §3.1 TID bound → amendment 6; §3.2/§3.5 kind dispatch + dup/cap REVERTs → amendments 2–3; §3.6 LIST evidence branch → amendment 7; §4 storage (auto-intern registry entries) → amendment 2; §4.3/§5.2 slot comparator `(seq, envelopeDigest, idx)` → `(seq, recordDigest)` (adopted core; critic C9); §5.1 revoke-target-must-exist → amendment 4; §12 module/LoC rows → amendments 2 + 11; §15 forks 1/2/5/6 → since ruled ([[codex-kinds]], amendment 12, [[freeze-gates]] A2). Full base+amendment inlining is the next iteration's first task (this doc first in the queue).

## Adopted core (unamended)

- **One Etched EFSKernel per chain**: no proxy, no admin, no constructor args — byte-identical runtime everywhere; devnet iterates behind a proxy with burn discipline (ADR-0048 pattern); everything enumerating/paged evicted to redeployable view contracts (EIP-170 as forcing function).
- **Entrypoints:** `submit` (full batch, root recomputed) and `submitSubset` (proved leaves); author only ever from signature recovery; parents-first enforced as per-record dependency-existence at validation time (never a frozen kind-order); batch atomicity by single revert scope; subset re-admission skips already-admitted claimIds (monotone replication).
- **Tombstone slot supersession** — the join-semilattice that closes arch-D's replay-as-rollback: slot points at the max-`(seq, recordDigest)` claim revoked-or-not; **revoked incumbent reads EMPTY** (adjudicated; no max-over-unrevoked fallback, no per-slot candidate arrays; author re-asserts to restore).
- **No `(author,seq)` uniqueness or duplicity state** — same-seq different-digest envelopes both admit (envelope D1); no prev-linkage, no author-head *currency machinery*, no checkpoints in kernel state (the per-chain `authorHead` index read in the Read-ABI section below is a venue-local hint, not currency — infra demand #5).
- **Enumeration spine** (`allClaims` append-only array, ~22–27k gas/record): the only way the from-state-alone reconstruction pledge is implementable (hash-keyed mappings cannot be enumerated from a state dump); full record bodies in state (EIP-4444; the infra apps' bodies-in-state demand). *James cost sign-off tracked in [[freeze-gates]]; graded fallback (objects-only spine + envelope archives) documented in base §4.2.*
- **KEL reservation** = reserved-reverting kindCodes + Codex-frozen formats/vectors + **chained successor-kernel with backward read-through**; a pre-committed registry address is rejected (unwritten code cannot be hash-pinned — a pre-wired address is a master key).
- **Genesis:** hash-pinned permissionless idempotent `initializeGenesis` under SYSTEM_AUTHOR (banned on the submit path); Codex bytes self-hosted at CREATE2-fixed chunk addresses; SystemAccount retires.
- **Canonicity:** anyone deploys via deterministic factory + fixed salt; readers verify by codehash + genesis vectors; same-address is a Schelling convenience; venue plurality splits availability, never authenticity (stated, not papered over). Non-EVM-equivalent VMs are outside the single-codehash story — documented limit.
- **EASExporter:** non-Etched, permissionless, attester = exporter, honestly-labeled derived mirror; droppable.
- **Storage layout** ERC-7201, frozen in the Codex, making `eth_getProof` point reads a documented trustless read path.

## Amendments (normative)

1. **claimId re-cut to the envelope formula** `keccak256(DOMAIN_CLAIM_V1, author, seq, recordDigest)` (the base's `H(envelopeDigest, index)` was carriage-dependent — portable revocation would only work under exact-envelope carriage). The base's anti-recordDigest objection is defeated (seq is in the hash). §2.1 candidate table re-cut.
2. **Kind table re-cut to the five-kind model** ([[codex-kinds]]): MIRROR/REDIRECT/LIST_ENTRY/PROPERTY rows deleted; **auto-intern is a first-class admission pathway** (claims minting value objects — new storage: registry entries hold normalized value bytes; parents-first story, LoC rows, gas table all re-measured, not patched).
3. **Admission-confluence invariant Etched** (the round's fatal-grade-if-unfixed cluster): no admission check reads revocable state except through the comparator; nothing permanently rejects what another kernel could accept; semantic refusals (appendOnly-revoke-second) are inert-recorded no-ops with refusal events — cap overflow is not a refusal at all: beyond-cap entries admit normally, the cap existing only as the read-time filter (envelope amendment 1 / C6). The ported v1 list dup/cap checks (which read revocable state) are deleted, superseded by slot-ified membership + read-time cap filter.
4. **Pre-revocation legal** (G-set wins): a REVOKE naming a not-yet-admitted claimId admits and stores; effectiveness is lazy at pair completion. The base's MissingDependency revert on revoke-before-target is deleted.
5. **expiresAt** is a claim-body word (envelope amendment 4); the kernel stores it opaquely, never checks it at admission (clock-free storage), exposes it in reads.
6. **TID bound corrected**: `tidMicroseconds ≤ (block.timestamp + 600) × 1e6` (the base compared microseconds to seconds — 100% rejection as written; 900s constant drops to the envelope's 600s).
7. **LIST evidence machinery deleted** (config-in-listId makes it dead code).
8. **EIP-170 measurement is a now-gate, not a fallback ladder**: the base's rung 1 (internal-library split) is a compiler no-op (internal libs inline). Compile a representative skeleton immediately; pre-adjudicate the two-artifact contingency (second Etched validator + its impact on single-codehash reader verification). Tracked in [[freeze-gates]].
9. **Container-scoped cross-author discovery index — recommended ADD** (gap G2, the consumer apps' #1 demand; two of five consumer apps are otherwise indexer-dependent for their core read): bounded per-tagId, paginated, enumeration ≠ endorsement. This is Etched index surface being decided now rather than by silence. *James cost sign-off (bundled with the spine) in [[freeze-gates]]*; the labeled degraded path (indexer-lane) is specced in [[read-lens-spec]].
10. **Genesis manifest enumerated** (gap G6): the blob contains — the Codex chunk TAGDEFs + `/.well-known/spec` placement claims; the reserved-key TAGDEF rows (mirrors, name, keyWrap, contentType, contentHash, size, contentEncryption, the five redirect rows, home, successor-reserved, checkpoint-reserved [activation pending [[freeze-gates]] A1], `/vocab/datatypes/string`); the datatype vocabulary; the genesis pseudo-header rule for genesis claimIds; chunked-init variant for low-gas-cap chains. Full manifest table to be cut in the next iteration from this enumeration.
11. **Honest size/schedule correction:** Etched-artifact-as-reviewed ≈ **2,300–2,900 LoC** (new core ~800–1,250; ported validation; spine; auto-intern), not the carrier decision's 500–900 (which holds only for the narrowest kernel-core reading). Verification plan re-budgeted accordingly — *James schedule ratification in [[freeze-gates]]*.
12. **Visibility machinery ruling** (gap G8): v1's ancestor visibility TAGs do **not** port into the kernel; folder visibility derives from the kernel's parent-walk at read/view time (the contains-walk), with the app passes' evidence that none of the ten apps consumed visibility TAGs directly. This deletes the out-of-batch TAG follow-up tx from v2 entirely. (Overturnable at Phase-0 if a directory-heavy multi-tenant grounding demands write-time visibility state.)

## Read ABI ownership (gap G5)

Etched-on-kernel (frozen selectors): `getObject(id)`, `getSlot(slotId)` (slotId derived offline per [[read-lens-spec]] P10; returns claimId + seq + recordDigest + revoked/empty disposition + expiresAt + **supersessionCount + priorClaimId** — the supersession evidence of infra demand #4b: a per-slot counter and single prior pointer, O(1) words, NOT the rejected per-slot history arrays), `getClaim(claimId)` (state-resident body bytes), `isRevoked(claimId)`, `allClaims(i)` / `claimCount()` (the spine), `getValue(propertyId)`, and `authorHead(author)` — a **per-chain index read** (highest seq admitted at this venue), a venue-local hint and never currency machinery (infra demand #5; [[read-lens-spec]] §5.4's MUST-pull depends on it). The adopted-core "no author heads" bullet is overruled to exactly that extent. Everything else — pagination, per-tagId discovery walks, lens resolution, path resolution sugar — lives in redeployable views specced by [[read-lens-spec]]. Superseded claims remain state-walkable via the spine (identity pass's 2030 union-read requirement) — per-slot history arrays are NOT kept. The authorHead mapping + the two extra slot words join the [[freeze-gates]] A2 gas bundle.

## Open questions

- [ ] Spine + discovery-index gas costs (James sign-off; ~7–15%/record + index writes) — [[freeze-gates]].
- [ ] LoC/schedule re-plan ratification — [[freeze-gates]].
- [ ] EIP-170 skeleton compile result → one or two Etched artifacts.
- [ ] **Client-OS pressure (2026-07-07):** [[client-os-pressure-report]] P1 asks three read-ABI questions before freeze: every grade state-provable via eth_getProof (no log-scan dependence), batched per-claimId admission checks, and admission-event time exposure (cooldown anchor — TIDs are backdatable).

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Representative skeleton compiled; bytecode-size row in the module table
- [ ] Tombstone-comparator convergence property-tested (join-semilattice proof executed, not argued)
- [ ] Gas snapshot replaces every estimate before any ADR cites numbers
- [ ] At least one round of `#status/review` with another agent or human comment
