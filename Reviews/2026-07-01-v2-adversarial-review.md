# 2026-07-01 — v2 deterministic-IDs adversarial review record

**Context:** Before drafting [[deterministic-ids]], [[efs-v2-holistic-redesign]], and [[efs-v2-transition-plan]], twelve independent agent perspectives were run against the deterministic-EFS-IDs proposal and the holistic-redesign question, followed by a completeness critic that adjudicated their contradictions. This file is the durable record the three designs cite. It is a synthesis transcribed from the live review session (agent transcripts were session-local); claims below are reconstructed from the structured outputs captured that day, not from memory.

**Method:** three adversarial perspectives (kill-technical, kill-strategic, steelman-status-quo) + nine design lenses (filesystem-theory, graph-database, cypherpunk-privacy, archival-100yr, evm-engineering, developer-experience, end-user-product, economics-liveness, security-adversarial) + one completeness critic. A second pass (five doc reviewers + per-finding adversarial verifiers, 42 agents) then reviewed the drafted designs; its 27 confirmed findings were applied to the docs on the same day.

## Headline verdicts

- **kill-technical** — could NOT kill the core mechanism (verified EAS multiAttest semantics against vendored source: groups in order, `_db` written before each group's hooks, per-item hook order, whole-tx revert on failure). Produced four load-bearing gaps, all specifiable: dual-identity slot equivocation (→ refUID equality rule + EAS-UID-alias rejection), unspecified duplicate policy (→ per-kind split), registry too thin (→ id→firstUID), opportunistic-refUID split-brain (→ zero index authority).
- **kill-strategic** — argued do-not-build-now: the Forever Files buildathon (wound down 2026-07-01 for low turnout despite a shipped 2–3-popup path and zero-click concierge) falsified clicks-as-bottleneck; the v1 freeze ceremony cost ~6 weeks; the six-lane write-UX ranking had parked deterministic IDs as Tier-5/v2. Conceded the physics is permanent and pre-wrote the conditions under which v2 wins. Its concessions (permanent-properties justification, guardrails, one-final-freeze, banned strawman framing) are adopted wholesale in the designs.
- **steelman-status-quo** — best case for keeping EAS-UID identity: self-verifying records, universal refUID walkability, EFSWriter/7702 one-click for the B′ smart-account user, and a PathRegistry overlay capturing portable *names* additively. Conceded the two deciding points: plain-EOA single-tx atomicity and portable *references* (dataId) have no overlay substitute.
- **Nine lenses** — all net-positive on deterministic IDs; each contributed must-haves now embedded in the designs (dirnodes, move doctrine, typed literals, slot IDs, kind tags, Codex self-hosting, mirror-repair fallback, clear-signing, salt rules, encrypted-file conventions, link grammar, lens-as-LIST, enumeration re-basing).

## Attacks that failed (and why — kill-technical + security-adversarial)

- Precompute-squat / front-run of another's dataId/listId — resolver derives from `attestation.attester`; a copied salt yields the attacker's own id.
- Path-hash dictionary surveillance — anchor names are already cleartext in ANCHOR calldata; hashing adds zero new leak (blinded/salted variants are where privacy genuinely lives).
- Address-namespace grinding — 2^96 keccak work for a targeted 12-zero-byte prefix.
- Cross-domain/cross-kind hash collisions — fixed-width domain-separated preimages; requires a keccak collision.
- Foreign-schema resolver bypass — resolvers already reject non-canonical schemas (UnknownEdgeSchema / WrongSchema / self-derived UIDs); registry writes keep the gate.
- Resolver reentrancy — hooks call only trusted contracts, onlyEAS-gated, non-payable.
- Gas-limit truncation mid-DAG / partial batches — multiAttest is atomic; any hook failure reverts everything.
- Delegated-attestation replay to steal a salted id — EIP-712 domain binds chainId + EAS address; per-attester nonces.
- Encoding malleability — all-fixed-width words with pre-hashed names; degenerate cases (root, empty names) resolver-rejected.
- Registry state-growth DoS — attacker-paid at full attestation gas, no amplification.

## The imitation warning (why the Codex needs external review)

The original sketch hashed `forSchema` — a deployment-contingent EAS schema UID — into anchorId. **Four of the twelve perspectives (kill-technical, cypherpunk-privacy, archival-100yr, and the sketch-endorsing parts of filesystem-theory) copied that derivation without challenging it**; only graph-database and security-adversarial independently flagged it (→ abstract kind tags, adopted). Derivation rules propagate by imitation, not scrutiny. Hence the standing requirement: the Codex is reviewed as a standalone artifact by a lineage independent of its authors.

## The trusted-chain-list punt (three findings, one undesigned authority)

kill-technical (cross-chain claim scoping), security-adversarial (same-address squat on legacy-CREATE contract accounts — the Optimism/Wintermute precedent), and evm-engineering (cross-chain coherence prerequisites) each discharged a real finding onto "clients maintain a trusted-chain list" — an authority with no owner, update mechanism, or succession plan. The critic flagged this as a top gap; it is now the trust-root-stewardship workstream ([[efs-v2-holistic-redesign]] §3.2), alongside the fork doctrine (chain-independent IDs make an ETH/ETC-style split yield two universes with identical IDs and diverging claims).

## Critic adjudications carried into the designs

1. Proceed, but justify on permanent properties; popup count demoted to corollary (kill-strategic's frame concession).
2. Duplicate policy: idempotent-accept for shared kinds, REVERT for owned kinds (against graph-database's uniform-no-op position; the salt-reuse merge is the worse failure).
3. Salt entropy: ≥128-bit CSPRNG or keyed derivation; public-input-derived salts forbidden (against graph-database's deterministic-salt retries; retry convergence via persisted WritePlan salt).
4. refUID: security-adversarial's middle path — permitted with enforced equality, zero index authority (against kill-technical's outright rejection and the legibility camp's unconditional must-have).
5. Kind tags over concrete schema UIDs in preimages — "the highest-blast-radius single decision in the derivation spec."
6. Atomicity honesty: guarantee scoped to the dependency DAG; visibility TAGs out-of-batch; large files = 2 signatures same block.
7. Virtual anchors: permitted only as a closed reserved-key carve-out (against the three "one existence rule, no exceptions" must-haves; orphan hazard structurally absent for point-lookup-only objects).
8. Typed literals ride the freeze (graph-database's "truest now-or-never item"; the others' silence was omission, not disagreement).
9. Blinded-anchor disclosure: additive claim, never registry mutation (reconciling cypherpunk's reveal-later capability with write-once registry).

**Critic gaps** (now [[efs-v2-holistic-redesign]] §3): the signing surface (one signature = unscoped namespace authority; ERC-7730 clear-signing), trust-root stewardship + fork doctrine, temporal provenance under replication, inbound web interoperability. **Overweighted per the critic:** mempool front-running of batches (closed by one rule; the write plane is an L2 anyway), L1 gas micro-accounting, easscan legibility loss.

## Second pass (doc review, same day)

Five reviewers (spec-precision, cold-reader-2126, implementer-feasibility, strategic-compliance, fresh-derivation-attack) + adversarial verification of every blocking/major finding: 27 confirmed, all applied. The freeze-blocking catches: salted-anchor inner hash lacked domain separation (constructive one-id/two-names equivocation → `DOMAIN_ANCHOR_SALTED`); blinded-disclosure rule contradicted the duplicate policy (→ dedicated disclosure schema, four form-orderings in the invariant matrix); virtual-anchor carve-out was unverifiable from a bare definitionId under keccak one-wayness (→ `defParentId`/`defKeyHash` payload words with recompute-and-compare); slotId/targetKind/datatypeTag constants were unpinned (the exact class the forSchema mistake lives in); the §13.5 self-hosted Codex list failed its own OAIS from-zero reconstruction test (→ closed ToC + executable acceptance test); movedTo collided with ADR-0050's kind=3 relatedVersion (→ kind=4); and the core doc's own Problem section carried the banned 13-attestation strawman framing (→ rewritten against the shipped baseline).
