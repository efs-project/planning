# v2 Codex — Envelope & replay domain (Etched)

**Status:** draft
**Target repos:** contracts, sdk, planning
**Depends on:** [[fable-handoff-v2-tag-core]], [[efs-substrate-decision]]
**Base text:** [envelope-replay-domain.md](../../Reviews/2026-07-07-efsv2-corpus/envelope-replay-domain.md) (design) + [attack-envelope.md](../../Reviews/2026-07-07-efsv2-corpus/attack-envelope.md) (red team: **no fatal**; every frozen constant independently recomputed, EIP-712 digest reproduced against stock `eth_signTypedData_v4`, Merkle construction re-implemented and fuzzed)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/contracts #repo/sdk

> **2026-07-11 freeze blocker — the signed authority seam must be re-cut before this can be Etched.** The KEL pass found that `recovered == author` cannot preserve one stable principal while a scoped device, app, P-256, WebAuthn, or PQ actor signs. [[kel]] §8 proposes the breaking `author + authorityId + authEpoch` amendment while retaining the bare-EOA zero path and one signature per record batch. The final field names, types, type hash, claim-ID interaction, and vectors remain ceremony work; the struct below is the reviewed historical baseline, not a freeze candidate.

> **2026-07-19 external evidence — EIP-8130.** Base's native-AA implementation makes actor IDs, P-256/passkey authenticators, scoped session actors, payer separation, and transaction actor context concrete enough to test now. It should inform the `authorityId`/suite adapter and vector work, but it does not close this blocker: an EIP-8130 sender signature is chain- and transaction-bound, whereas this envelope's exact actor witness must remain chain-free and carrier-independent. See [[Reviews/2026-07-19-base-native-aa-impact]].

## What this document is

The ruling layer over the base text: the base design is adopted as THE envelope/replay-domain spec — the single irreversible Etched crypto surface — **with the amendments below**, which resolve the round's cross-document contradictions (adjudicated in [critic.md](../../Reviews/2026-07-07-efsv2-corpus/critic.md)) and the red team's three serious findings. Where this document and the base text disagree, this document wins. The next iteration inlines base + amendments into one frozen chapter.

## Adopted core (unamended)

- **Signed artifact:** EIP-712 `Envelope(bytes32 author, uint64 seq, bytes32 prev, bytes32 recordsRoot, uint32 count)` under chain-free domain `("EFS","1")` — no chainId, no verifyingContract, no salt. All constants byte-pinned in the base text (independently recomputed by the red team; wallet-signable confirmed).
- **Author IN the signed struct** (fail-closed vs malleability-minted authorship; preserves the reserved KEL/P-256/digest-identity slot); kernel checks `recovered == author`; v1 additionally requires address-shaped nonzero author.
- **seq** = 64-bit TID (bit63 zero, 53-bit microseconds, 10-bit clockId/device bits), **sparse and NON-unique**: same-`(author,seq)` different-digest admits BOTH with SeqCollision evidence — never duplicity, never revert (arch-B's first-seen-wins REVERT rejected as a cross-chain convergence fatal). Identity-pass's SeqOccupied rejection is **overruled** (admit-both wins; "contested" is a read grade, not an admission rule).
- **claimId = keccak256(DOMAIN_CLAIM_V1, author, seq, recordDigest)** — content-addressed, carriage-independent. This **overrules** the kernel pass's `H(envelopeDigest, index)` (carriage-dependent: a re-signed carriage of the same logical record would get a different claimId, degrading portable revocation to exact-envelope carriage) and the kinds-ruling's REVOKE-by-coordinates (non-injective under admit-both). REVOKE body = `bytes32 claimId`. The same-envelope-revocation answer is Codex-recorded per C1: a REVOKE MAY target a sibling claim in its own envelope — claimId is content-addressed and envelope-independent (the keccak fixed-point impossibility applied only to the rejected `H(envelopeDigest, index)` formula); a record revoking *itself* stays inexpressible because REVOKEs are not claims and carry no claimId (base §7.1). Vector required.
- **prev** kept but hard-fenced: signed evidence + replication hint only; NEVER read by any kernel admission rule.
- **Single canonical envelope identifier** = the EIP-712 digest; the parallel DOMAIN_ENVELOPE digest is deleted (kernel doc re-cut accordingly).
- **Merkle:** positional tree, index-committed leaves, domain-separated record/leaf/node hash constants, odd-node **promotion**, proofs fully consumed, single-leaf proofs only (multiproofs excluded from v1 — OZ CVE precedent), N=1 root = wrapped leaf digest. ERC-7920 *shape*, not byte-compatibility.
- **Ops closed at {ASSERT=0, REVOKE=1}.** No op=2: checkpoints are NOT an op (see amendment 5).
- **Revocation = monotone G-set** of `(revoker, claimId)`, effective iff `revoker == claim.author`; admits before its target (**pre-revocation is legal** — load-bearing for cross-chain revoke replay and the renewal-ladder kill switch; this overrules the kernel pass's target-must-exist), foreign revokes inert, no un-revoke, objects unrevocable by domain disjointness.
- **Signatures:** 1-byte scheme tag + data (0x01 = 65-byte secp256k1; 0x02 P-256-raw and 0x03 WebAuthn reserved with frozen layouts); low-s, v ∈ {27,28}, no compact sigs, zero-address recovery double-blocked; ERC-1271 never admissible.
- **Future-dating bound:** `tidTime ≤ now + 600 seconds`, with tidTime converted from the TID's **microsecond** field before comparison (the kernel doc's µs-vs-seconds literal bug and its 900s constant are both corrected to the envelope's 600s-in-µs rule). Past unbounded (replication).
- **Master admission invariant (Etched):** *no admission check may read revocable state except through the slot comparator, and nothing may permanently reject what another kernel could accept* — semantic refusals are inert-recorded no-ops with refusal events; reverts only for malformed bodies, unknown/reserved kindTags, and retryable missing-dependency (parents-first) [C6 verbatim]. (This is the general form of the admission-confluence disease three red teams found in three corners — the round's one fatal-grade-if-unfixed cluster.)

## Amendments (normative)

1. **maxEntries becomes a read-time filter** (red-team B1): the admission cap gate contradicted the master invariant (two chains filling a capped list in different orders admit disjoint, never-unionable sets). Admit all entries; resolvers return the first `maxEntries` by `(seq, recordDigest)`. The LIST cap counter, its revoke-decrement question, and the convergence-theorem carve-out (b) are all deleted.
2. **listId folds in the config:** `listId = keccak256(DOMAIN_LIST_V1, author, salt, keccak256(configBytes))`. Two red teams converged independently: without this, subset submission lets an adversary steer which charter binds the write-once registry per chain. The charter becomes cryptographically immutable; the entire owned-conflict evidence machinery deletes as dead code; the envelope's only convergence carve-out disappears — **the convergence theorem now holds without exception.**
3. **Slot-on-revoke reads EMPTY** (kernel's rule wins over base-text §5.6's max-over-unrevoked fallback): no zombie resurrection, no per-slot candidate arrays; the author re-asserts to restore. Base §5.6 + FM15 re-cut; the LWW comparator is `(seq, recordDigest)` everywhere.
4. **expiresAt is a claim-body word** (last field of every claim body, inside the signed bytes; objects never carry it) — the ops pass's stripped-expiry-copy attack disqualifies property-key placement, and the kernel pass's "deliberately not a kernel field" is overruled 3-v-1. Storage is clock-free (never admission-checked); reads are clock-aware. Ships with the amendment stack: appendOnly entry edges require `expiresAt == 0` (attack-kinds K1 — otherwise born-expiring entries hollow the appendOnly guarantee); canonical-word check (S7); the context-split read rule lives in [[read-lens-spec]].
5. **Checkpoint = an ordinary reserved-key claim** (state root + through-seq under the author's ADDRESS container), **zero kernel machinery, no head-currency or fork-choice semantics ever** — this is the explicit reading that reconciles "no HEAD/CHECKPOINT machinery in frozen semantics" with the ops doctrine's informational grade bounds (attack-ops E6). *Requires James's one-line ratification* (it interprets his ruling); tracked in [[freeze-gates]].
6. **Truncation-replay is relabeled "bounded and detectable," never "closed"** (red-team B2): a relayer submitting only the pre-revocation envelope makes a foreign chain serve a revoked value as a definite answer. The defense is the read layer (home-chain-certain vs foreign-best-effort, MUST-surface expiry for safety-critical kinds — [[read-lens-spec]]), not the envelope. Marketing language updated accordingly.
7. **WebAuthn 0x03 stays reserved-only until canonicalized** (red-team B3): before un-reserving, the KEL Codex must pin a canonical challenge-extraction grammar over the UTF-8 clientDataJSON bytes, base64url-without-padding exact compare, explicit extra-member handling, and byte-exact vectors from ≥2 real authenticator families.
8. **Reserved/unknown kindTags are intrinsic-rejected** at admission (closed-list ReservedKindTag rule — already in base §5.7; restated here because the identity red team levied it).
9. **Invariant-4 split** (attack-envelope C3, adopted by the critic): *additive version-skew* (a v1 kernel rejecting a kindTag a v2 kernel accepts — recoverable by kernel upgrade; the artifact never becomes invalid) is legal; *arrival-order divergence* (unrecoverable by any upgrade) is banned. This is what makes amendment 8's ReservedKindTag rejection legal under the master invariant.

## Verification gates (freeze-blocking, from base + amendments)

The 42-vector golden suite (regenerate for amendments 1–4: claimId formula, listId config-fold, expiresAt word, empty-on-revoke) + the 14-invariant property suite, extended with: admission-confluence invariant tests (no revocable-state reads at admission; batch-shuffle; cross-kernel set-union convergence **without carve-outs**), the SeqCollision admit-both matrix, pre-revocation ordering vectors, and differential fuzz on the VAL-tail canonicality path (the kinds ruling's #1 engineering risk). Vector *numbers* await the reference implementation (`@efs/ids` successor); the enumeration is normative now. **Independent external review of this document + base text as a standalone artifact is the non-negotiable freeze gate** (the envelope's slice of the full-Etched-surface review scoped in [[freeze-gates]] B; same-lineage risk: the designer self-attacked, and the round's red team — however rigorous — shares the corpus).

## Open questions

- [ ] Amendment 5 ratification (checkpoint-as-ordinary-claim reading) — James, one line.
- [ ] PROPERTY datatype word in the VAL tail vs the string-only ruling's scope (permanent vs v2-scoped) — flagged by the base text; adjudicated in [[codex-kinds]] (string-only ratified; datatype word retained solely as interning-derivation input with `string` as the only v2 value). Confirm.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Golden vectors regenerated post-amendment and cross-language fuzz green
- [ ] Independent external review of the envelope spec passed (freeze gate)
- [ ] At least one round of `#status/review` with another agent or human comment
