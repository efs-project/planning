# v2 — Identity: bare-EOA now, succession reserved with a deadline

**Status:** draft
**Target repos:** contracts, sdk, planning
**Depends on:** [[codex-envelope]], [[codex-kernel]]
**Base text:** [identity.md](../../Reviews/2026-07-07-efsv2-corpus/identity.md) + [attack-identity.md](../../Reviews/2026-07-07-efsv2-corpus/attack-identity.md) (red team: **no fatal**; all byte-exact claims independently reproduced; eleven serious findings in the register (A1–A3, B1/B2, C1, D1/D2, E1/E2, F1) — ten amended below; E2 is homed in [[codex-kernel]]'s read-ABI/state-walk section)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/contracts #repo/sdk

> **2026-07-11 KEL foundation ruling — historical baseline; not freeze-safe as written.** [[kel]] supersedes this document for KEL and account architecture. Bare EOA remains the zero-setup state, but the later-peer/read-time model, root `ADD_KEY`/`REMOVE_KEY`, `nextKeysDigest`, `recovered == author` actor model, public persona-fleet workaround, and ~2030 implementation deferral do not survive the deeper pass. Where the two documents conflict, use [[kel]] and the supporting [identity-foundation review](../../Reviews/2026-07-11-kel-identity-foundation-review.md). Do not cut identity/envelope vectors from this older text.

## Adopted core (unamended)

- **v2 ships bare-EOA identity** (key = identity; the degenerate single-event KEL); nothing in the round forces building more — but the reservation now has a **deadline** (below).
- **Frozen now:** the bytes32 identity-word shape taxonomy — address-shaped live; digest-shaped reserved and rejected with `ReservedAuthorShape`; the **ID-SHAPE-1 re-salt rule** makes digest words never address-shaped *by specification* (an invariant, not a 2^96 grinding argument). The v2 admission predicate (canonical low-S secp256k1, chain-free EIP-712, constant domain separator). TID layout with device bits + SeqOccupied-is-not-duplicity semantics (amended to admit-both per the envelope ruling). Reserved Codex sections with computed constants and golden vectors: KEL events (position-scoped monotone key windows, pre-rotation, **single-sig authorship** — KEL thresholds govern key events only, never record verification), algoTags (secp256k1 / p256 / p256.webauthn / PQ pattern), strict WebAuthn profile (un-reservable only after vectors from ≥2 real authenticator families — envelope amendment 7), successor/DISAVOW tags, epoch-table schema.
- **Succession is IN-PLACE:** a KEL incepts for the existing address-shaped word (namespace and owned objects never rewrite), deployed later as a **peer kernel + frozen union-read + inception-demotion rules**; an in-kernel registry slot is rejected (a pre-wired address is a master key).
- **No ERC-1271 anywhere, ever** (chain-bound, state-dependent — the antithesis of the portable artifact). Orgs: raw cold keys + org-as-lens-list doctrine; rotation at the lens layer until the KEL ships.
- **PQ posture:** anchored records degrade to existed-before-epoch; unanchored shoebox envelopes become hearsay post-CRQC; **bare-EOA identities have no PQ path — the KEL must ship ~2030** (NIST deprecation 2030 / disallowance 2035). The KEL is a *dated obligation*, not an open hedge — *James ratification in [[freeze-gates]]*.

## Amendments (normative — the red team's register)

1. **Consequence-table completions (A1–A3):** LOSS row adds *permanent KEL-lockout* — in-place inception requires a signature by the bound address, so a lost key = scheduled full identity death at E(secp256k1), not merely "no future writes." THEFT row adds *KEL-launch escalation* — undetected theft converts to permanent protocol-blessed capture at KEL launch (thief incepts + pre-rotates; the victim's own subsequent writes then grade unauthenticated-post-inception): detection-before-inception is the security-critical window and the doctrine says so loudly. ENCRYPTION row added with the coupling rule (gap G9): **key-wrap targets MUST be independent of the identity key** — otherwise THEFT = retroactive decryption of the entire archive (the system's only non-monotone consequence) and LOSS = the author loses their own data. This is the one normative sentence the reserved encryption conventions need now.
2. **Successor convention hardened (B1/B2 + K7):** the `successor` reserved row is **demoted to reserved-not-active** (succession ships with the KEL — an active row pre-KEL is a blessed key-theft migration path). The interim client-layer convention: exactly ONE targetKind (OPAQUE — the ADDRESS+OPAQUE pair occupied two PIN slots and broke cardinality-1 exactly where it's load-bearing), publish-successor-pair-at-identity-creation (makes thief pairs visible slot supersessions and de-forges the "strongest available" grade), bidirectional pair required, never auto-followed, hostile MUST-NOT-authorize Codex language.
3. **Org realism rewrite (C1):** the Debian/TUF/PGP analogy inverted (those roots have rotation/threshold/expiry — precisely the machinery v2 lacks). Named residual: **multisig-native DAOs have no m-of-n authorship path at year-0** (threshold-authorship lockout, distinct from smart-wallet-user exclusion). Doctrine: per-era org key + proactive successor pair + org-as-lens-list; this counts toward the KEL pull-forward trigger.
4. **Rotation-locality FM added (D1):** post-KEL rotation is fail-open and chain-local forever — the demoted bare key remains a valid author on every inception-ignorant chain (including chains born after rotation), and year-0 Etched kernels' slot state is bare-rule-consumable by contracts forever. Same accepted-limit class as withheld-REVOKE; now in the failure-mode register with the inception-replicates-with-data doctrine.
5. **KEL-fork rule frozen now (D2):** two chains holding two different valid inceptions for one address word (the FM-2 thief-race run in parallel) ⇒ identity reads grade **KEL-CONTESTED** (a reserved KEL-era grade name in [[read-lens-spec]] §2, deliberately distinct from the v2 record-level CONTESTED); post-fork envelopes are excluded from slot supersession — parallel to the record-level tie-break, freezable as read-layer text today.
6. **Reserved-kind admission rejection restated** (E1, partially overclaimed — envelope §5.7 already intrinsic-rejects unknown/reserved kinds): the closed-list `ReservedKindTag` rule is cited here so the reserved KEL record-stream is provably unpollutable pre-launch.
7. **PQ deadline restated as a five-conjunct stack (F1):** identity survival at E(secp256k1) requires ALL of — (1) KEL shipped + externally reviewed + adopted; (2) a NIST-final PQ scheme; (3) an EVM verifier/precompile for it on the chains that matter (EF targets ~2029 for L1; L2s lag); (4) the PQ algoTag minted (deliberately deferred until (2)+(3) exist); (5) the author actually rotated — or pre-rotated and revealed — to PQ keys comfortably before E, because a classical pre-rotation target revealed after E is forgeable at reveal (the mempool-reveal race). "Ideally PQ-capable" becomes **necessarily**; the 3–4-year runway is adequate only if the PQ-verifier ecosystem holds EF's schedule — a dependency EFS does not control.
8. **Vector regeneration note:** the identity golden vectors were computed against the arch-B envelope sketch; they regenerate against [[codex-envelope]]'s final struct (flagged in the base; easy to miss — now a freeze-gate line item).

## What only James can move

The KEL dated obligation (~2030), and the acceptance that smart-contract-only wallet users (no exportable EOA key) are excluded from authorship at year-0 — judged acceptable for the crypto-native launch population, but it is an unmeasured adoption cost and is stated as such.

## Open questions

- [ ] KEL dated-obligation ratification (~2030, CRQC-conditional) — [[freeze-gates]].
- [ ] FM-2 mitigation room: `metaHash` reserved for a PLC-style priority/challenge window — deliberately NOT frozen now; confirm the deferral.
- [ ] **Client-OS pressure (2026-07-07):** [[client-os-pressure-report]] P4 — (a) actor/delegation dimension: reserve a sibling slot for delegated/attenuated signing + an on-behalf-of convention, or rule attribution client-only forever; (b) put P-256 (0x02)/WebAuthn (0x03) un-reservation on a schedule with an owner (EIP-7951 is live on L1; the client's key-custody ladder is capped until this lands).
- [ ] **Org-as-lens-list → persona fleets (validated 2026-07-07):** extend the org-as-lens-list doctrine to per-user *persona* fleets with **owner-authored labels** ([[wallet-and-actions]] §Linking). Normative point to state: **removal is prospective un-endorsement, not retroactive disavowal** — the "was-me-until-block-N, thief-after-N" partition needs the KEL validity-window / pre-rotation (reinforces the THEFT row and the same-key-war entry). Owner-key theft is fleet-wide, which raises the primary's custody bar.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Identity vectors regenerated against the final envelope struct
- [ ] At least one round of `#status/review` with another agent or human comment
