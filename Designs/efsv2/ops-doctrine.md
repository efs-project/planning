# v2 — Operations doctrine: lenses, relayers, expiry, censorship, liability

**Status:** draft
**Target repos:** planning, sdk, contracts
**Depends on:** [[codex-envelope]], [[codex-kinds]], [[read-lens-spec]]
**Base text:** [ops-economics-honesty.md](../../Reviews/2026-07-07-efsv2-corpus/ops-economics-honesty.md) + [attack-ops.md](../../Reviews/2026-07-07-efsv2-corpus/attack-ops.md) (red team: holds with mandatory repairs; the one conditional-fatal — checkpoint dependency — resolves via the adjudicated reading, below)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/planning #repo/sdk

## Adopted core (unamended)

- **Lenses:** protocol ships NO default lens (a genesis lens would be Etched reputation); clients ship defaults under conformance rules C1–C5 (disclosed, published-on-EFS as forkable lens objects, ejectable, no unknown-fallthrough, untrusted-labeled); lens manifests at `/.well-known/lens`; starter packs. Honest oligopoly posture: **EFS guarantees cheap exit, not plural equilibrium** — monoculture is monitored (canary via the observable proxies of amendment 10 — the as-stated read-share metric is unmeasurable) and answered by stewardship, never protocol machinery.
- **Relayers:** the **mortality invariant is format-level** — no signed byte ever names a submission channel; relayer death is a UX event, never a data/identity event. Admission = per-identity budgets × borrowed-scarcity credentials (PoW prohibited by the Laurie–Clayton evidence); policy machine-readable at `/.well-known/relayer`. **2026-07-19 Base native-AA note:** EIP-8130 payer signatures / ERC-8168-style payer services can be another capability class behind this endpoint and can remove EntryPoint/bundler machinery on supporting venues; they do not remove sponsor budgets, abuse controls, privacy disclosure, or fallback obligations, and never enter the signed EFS envelope. See [[Reviews/2026-07-19-base-native-aa-impact]].
- **Censorship floor, stated with costs:** real on Stage-1+ rollups with working force-inclusion (delay-not-denial); recursive/absent on L3s and validiums; permissionless submission means a censor must stop *every* submitter, not just the author. The trusted-chain list gains a force-inclusion column. [Force-inclusion mechanics figures marked *training-knowledge — verify* in the base text; verification is a freeze-gate item.]
- **Expiry:** MUST live inside the signed record bytes (`expiresAt` claim-body word — the stripped-expiry-copy attack disqualified property placement); storage clock-free, reads clock-aware; **STALE is a first-class read grade distinct from REVOKED**; the renewal ladder (pre-signed future-TID rungs, kernel future-bound; dead-man's switch; revoke-all via precomputed claimIds — pre-revocation legal per the envelope ruling).
- **Kernel spam posture:** nothing new needed or permitted — gas meters, index shape contains (TAGDEF global enumeration demoted from birth), lenses defend.
- **Operator-liability tier table:** direction-correct, jurisdiction-unverified; legal review before publication.

## Amendments (normative — the red team's repairs)

1. **Checkpoint reading resolved (E6, the conditional fatal):** checkpoints are **ordinary reserved-key claims** (author-signed state root + through-seq under the ADDRESS container) with **zero kernel machinery and no head-currency/fork-choice semantics ever**. §3's grading apparatus survives as *informational grade bounds*. The silent dependency is now explicit; *James's one-line ratification tracked in [[freeze-gates]]*.
2. **Key compromise enters the doctrine (D4):** expiry is useless against a thief (attacker renews); revocation becomes a same-key signing war (latest seq wins); duplicity only fires on same-seq conflicts; bare-EOA v2 has no rotation. The register gains the *same-key war* entry; §3.7's "certain" gains the footnote **"certainly this key"**; scoped keys/rotation named as the reserved KEL's first purchase; the dominant package-registry attack (account takeover) is answered honestly: out-of-band lens distrust + advisory deny-lists, nothing stronger until the KEL.
3. **Freshness horizons are grade-flipping (D1):** a checkpoint older than the per-lens horizon H ⇒ **UNKNOWN-CURRENCY**, not decorated LIVE; MUST-pull-home-chain for safety-class gate reads; default H in hours for the 30–90-day expiry class.
4. **Deny-semantics ship now (D3):** advisory deny-claims as ordinary claims + the normative client-side deny-filter composition convention (allow-shaped first-attester-wins cannot express deny); the package-registry yank is the forcing example. Full composition rules in [[read-lens-spec]].
5. **Expiry doctrine split by mutability (D2):** expiry is *inappropriate for immutable version claims* (registries will rationally set expiry=0; a cron failure must not left-pad the ecosystem) and *appropriate for mutable pointers*; the reader-side horizon is the layer that works without publisher cooperation.
6. **Renewal ladder restricted (D5):** prohibited for the safety-critical class (it inverts fail-safe: affirm-to-live becomes deny-to-kill, and a recovered author races their own pre-signed freshness); ladder rungs chain `prev` to each other as a declared side-chain (the stale-prev de-contiguation is routed to the envelope's prev-is-evidence-only fence).
7. **Revoke-selective sequencer (C1):** "home-chain certain" = *certainty over admitted state*; the SDK broadcasts REVOKEs multi-venue by default (revokes are self-verifying; anyone can submit); register entry added.
8. **EQUIVOCAL read grade added (E1):** duplicity evidence covering an (author,seq) region means no claim from that region grades LIVE — multi-value display, lens-level resolution; grade specced in [[read-lens-spec]].
9. **Curation-bribery register entry (B1):** buying lens membership buys reach *and* (where lens-vouching gates sponsorship) sponsored gas — fixes: bulk-revocable vouching, paid-inclusion disclosure required in lens manifests, per-viewer desertion as the honest counter.
10. **Canary made measurable (A1):** the default-read concentration metric is unmeasurable as stated — reads are client-side, off-chain, private; nobody can observe them. Replaced with observable proxies, admitted as lossy: (a) on-chain lens LIST subscription counts / entry-graph concentration (public by construction — the one genuinely new measurement EFS enables vs email); (b) shipped-default manifests of known clients (public, enumerable under C2); (c) gateway serving-lens disclosures (C1). The canary is a proxy; concentration can hide below it.

## Open questions

- [ ] Checkpoint reading ratification (shared with [[codex-envelope]] amendment 5).
- [ ] Force-inclusion + TLS/ACME figures independent verification (freeze-gate).
- [ ] Operator-liability legal review scheduling.
- [ ] **Client-OS pressure (2026-07-07):** [[client-os-pressure-report]] P6 requests an "update channels" doctrine section (high-watermarks, fast-forward, curator-compromise recovery recipe, deny-set freshness floor for auto-update, k-of-n quorum convention, funded channel-monitor role, pre-KEL key-compromise playbook) and P9(a) an explicit local-state-tier ruling.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Read-grade tables reconciled verbatim with [[read-lens-spec]]
- [ ] At least one round of `#status/review` with another agent or human comment
