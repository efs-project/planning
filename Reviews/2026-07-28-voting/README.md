---
agent: codex-gpt-5
date: 2026-07-28
status: done
anchors:
  - area: governance
  - area: efsv2
  - area: privacy
  - review: 2026-07-28-voting
source: Current alternatives review requested after the 2026-07-24 Vocdoni research
---

# Ethereum-aligned voting systems and EFS

#kind/research #status/done #repo/planning #topic/governance #topic/privacy #topic/onchain #topic/efsv2

## Answer in one page

The earlier Vocdoni work identified alternatives but did not review them deeply enough to choose an EFS architecture. This pass reviews the four user-named alternatives—MACI, ElectionGuard, Belenios and Decidim—plus the leading shortlisted Ethereum systems deeply enough for architecture and pilot selection.

The strongest near-term choices are:

- **Low-stakes opinion polling:** native public EFS polling, or Snapshot Classic if EFS needs a finished product before the native profile exists.
- **Anonymous member, public choice:** Semaphore V4.
- **Public and binding EVM governance:** OpenZeppelin Governor; Snapshot or Cactus can be replaceable interfaces.
- **Multi-plugin EVM organization and permissions:** Aragon OSx; it is the current host framework for MACI and CRISP integrations, not one ballot protocol.
- **Private and anti-collusion Ethereum voting:** MACI v3, as a bounded testnet or explicitly low-stakes pilot.
- **Hide choices only until close:** Shutter shielded voting.
- **Private EVM research without one plaintext-holding coordinator:** Interfold/CRISP first, then DAVINCI; both retain distributed liveness roles and remain pre-production choices for EFS authority.
- **Mature cryptographic organizational voting:** Belenios.
- **Paper-backed official-election research:** ElectionGuard.
- **Civic participation, deliberation and budgeting:** Decidim around a separate ballot backend.

MACI’s central tradeoff is now clear:

> Its EVM-verified ZK proofs prevent the coordinator from publishing an invented valid tally, and its revoting/key-change model is designed to undermine vote buying. The coordinator can still decrypt individual messages and can stop the poll from completing.

That makes MACI much more operationally mature as a deployable Ethereum stack than DAVINCI or Interfold/CRISP today, but less aligned with EFS’s strongest “no privileged operator” ideal. It is the leading practical private-EVM prototype, not an entirely trustless election.

EFS can integrate MACI and the other systems as replaceable evidence backends. EFS should freeze the poll rules and electorate basis, package the exact client/verifier/circuit/contract closure, preserve public proofs and result evidence, and declare remaining trust roles. Current EFS v2 authority does not let a foreign EVM result mutate a folder directly; automatic binding needs a separately adopted, fail-closed native authority adapter. Until then, use evidence-only or binding-manual results. EFS cannot remove coordinators, threshold networks, trustees, voter devices, eligibility authorities or political dispute processes.

No reviewed system is a standalone recommendation for a binding Chicago public election.

Start with [[comparison|the comparative decision]] and [[efs-integration|the EFS integration profile]].

## Project reports

### Ethereum-aligned systems

- [[maci|MACI v3]] — current release, ZK processing/tally, coordinator trust, anti-collusion model, EFS adapter and validation gates.
- [[semaphore|Semaphore V4]] — anonymous group membership and one public signal per scope; a primitive, not a secret-ballot system.
- [[snapshot|Snapshot Classic, SafeSnap, Snapshot X and Governor support]] — cheap public signaling versus newer binding paths.
- [[openzeppelin-governor|OpenZeppelin Governor and Cactus]] — mature public EVM voting and exact execution baseline.
- [[shutter-governance|Shutter Governance]] — deployed temporary ballot shielding and the distinct permanent/onchain research directions.
- [[interfold-crisp|Interfold/CRISP]] — threshold FHE/ZK secret ballots and masking design, currently Sepolia/testnet-stage.
- [[vocdoni-davinci|Vocdoni/DAVINCI comparative update]] — how the earlier deep dive changes after the current alternatives review.
- [[ethereum-candidate-notes|Ethereum candidate triage]] — Aragon OSx framework context plus SIV, Incendia, Cicada, Kite and Freedom Tool, with reasons not to treat each as the same kind of EFS ballot backend.

### Non-Ethereum comparators

- [[belenios|Belenios]] — mature verifiable organizational elections and the best non-EVM secret-ballot baseline.
- [[electionguard|ElectionGuard]] — paper-backed end-to-end election evidence and official-election research.
- [[decidim|Decidim]] — civic-process platform; current Elections is not a cryptographic ballot backend.

### Cross-system documents

- [[comparison|Comparative decision]] — category map, maturity/trust matrix, detailed MACI verdict, use-case routing and pilot sequence.
- [[efs-integration|EFS integration profile]] — backend-neutral manifest, capability declaration, v2 requirements and synthetic validation program.
- [[research-questions|Research questions]] — the shared evaluation rubric and evidence standard.
- [[../2026-07-24-chicago-voting-vocdoni/README|Original Vocdoni, Chicago and EFS review]] — Vochain/DAVINCI architecture, source evidence and public-election boundary.

## How thorough is this?

Each promoted project report checks:

- what category of system it actually is;
- ballot, identity, tally and receipt properties;
- correctness, privacy and completion trust separately;
- eligibility and uniqueness boundaries;
- exact Ethereum/EVM role;
- current repository, release, setup/audit evidence and operational use;
- ideological fit rather than only technical fit;
- the exact EFS integration boundary;
- the smallest honest pilot; and
- unresolved questions that require implementation evidence.

This is sufficient for selecting prototypes and rejecting category errors. It is not:

- an independent cryptographic or smart-contract security audit;
- deployment certification;
- legal advice or public-election approval;
- accessibility/usability validation with real voters; or
- evidence that an exact EFS integration works.

Security-vulnerability analysis is intentionally out of scope and segregated from this review. Audit coverage and setup provenance appear only where needed to judge release maturity.

The scope is deliberately not every voting product previously named anywhere in the vault. Helios, Swiss Post, CONSUL and managed election vendors did not receive full new profiles in this Ethereum-focused pass. Belenios, ElectionGuard and Decidim cover the most decision-relevant non-Ethereum comparison categories; a procurement or statutory-election study should separately evaluate those omitted systems. No omitted Ethereum candidate found in the landscape triage appears likely to overturn the present shortlist.

## Recommended next work

The next useful evidence is experimental:

1. implement one identical synthetic binary poll as native public EFS, Semaphore, MACI v3 and—when operable—Interfold/CRISP;
2. package each run using the backend-neutral EFS profile;
3. require two clean-room implementations to discover and verify the same accepted set and result;
4. rehearse coordinator/key-network/relayer/RPC/frontend failure and honest `FAILED`/`VOID` outcomes;
5. measure gas, proving time, memory, latency, package size and operator recovery;
6. validate mobile, keyboard, screen-reader, translation, low-bandwidth and interrupted flows; and
7. resolve the generic EFS external-result authority seam; then test a narrow reversible folder-config adapter only after the non-binding evidence path succeeds.

Those experiments answer whether EFS v2 is up to the task more reliably than another round of protocol marketing comparisons.
