# Reviews

Analysis, critique, and build-record artifacts produced by review/architecture agents. Top-level artifacts are date-prefixed files or folders (`YYYY-MM-DD-<slug>`); nested companion filenames may be descriptive. These are point-in-time outputs — reference them as history; the canonical decisions they fed into live in the relevant repo's ADRs and in [[Decisions]].

## Contents

### Schema-freeze build record (2026-06-02) — the contracts schema-freeze design arc
These four are one cohesive set (plan → critique → synthesis → blueprint) behind the Sepolia schema freeze. Canonical decisions landed as `contracts/docs/adr/` ADR-0048–0055 + the `schema-freeze` branch freeze table.
- [`2026-06-02-schema-freeze-build-plan.md`](./2026-06-02-schema-freeze-build-plan.md) — implementation plan (r2)
- [`2026-06-02-schema-freeze-plan-critique.md`](./2026-06-02-schema-freeze-plan-critique.md) — critique synthesis of the plan
- [`2026-06-02-contracts-api-review-synthesis.md`](./2026-06-02-contracts-api-review-synthesis.md) — contracts + API review synthesis
- [`2026-06-02-sepolia-deployment-blueprint.md`](./2026-06-02-sepolia-deployment-blueprint.md) — Sepolia deployment blueprint (mainnet-forward)

### Workspace holistic review (2026-06-10)
- [`2026-06-10-holistic-review.md`](./2026-06-10-holistic-review.md) — all-four-repos review (security / gas / architecture / dev-UX / user-UX / hygiene), 79 findings with stable IDs (`SEC-*`, `GAS-*`, `ARCH-*`, `DX-*`, `UX-*`, `ENG-*`). Tracked via the "Act on holistic review" Kanban card.

### EFS v2 lens architecture review (2026-07-11)

- [`2026-07-11-efsv2-lens-architecture-and-scale-review.md`](./2026-07-11-efsv2-lens-architecture-and-scale-review.md) — foundational lens/trust review: typed compiled policy model, 50–256-principal on-chain cost analysis, canonical identifiers/encoding, privacy/UX, freeze ledger, and adversarial test plan. Supporting Foundry model in [`2026-07-11-efsv2-lens-review-corpus/`](./2026-07-11-efsv2-lens-review-corpus/).

### EFS v2 KEL and account foundation (2026-07-11)

- [`2026-07-11-kel-identity-foundation-review.md`](./2026-07-11-kel-identity-foundation-review.md) — deep identity/account verdict: freeze-breaking flaws in the old reservation, candidate comparison, native-EFS architecture, UX and cross-system consequences, owner choices, and external gates.
- [`2026-07-11-kel-research-corpus/`](./2026-07-11-kel-research-corpus/) — archived precedent, Ethereum-account/passkey, cryptographic red-team, and integration/completeness research behind the canonical `Designs/efsv2/kel.md` draft.

### Base native account abstraction impact (2026-07-19)

- [`2026-07-19-base-native-aa-impact.md`](./2026-07-19-base-native-aa-impact.md) — point-in-time review of Base's EIP-8130/Cobalt announcement against EFS v1 write attribution, the v2 envelope/KEL boundary, SDK/client submission rails, sponsorship, and large uploads; recommends a Vibenet compatibility spike while keeping Draft EIP constants out of Etched EFS formats.

### Vocdoni, Ethereum, EFS, and Chicago voting (2026-07-24)

- [`2026-07-24-chicago-voting-vocdoni/`](./2026-07-24-chicago-voting-vocdoni/) — deep review of legacy Vochain and DAVINCI, ZK/encryption and EVM/L2 behavior, Illinois/Chicago feasibility, alternatives, a bounded EFS sidecar architecture, pilot gates, and the supporting audio/evidence record.
- [`folder-poll-question-resolution.md`](./2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution.md) — follow-up answers for decentralized folder polling: social-poll versus governance-vote defaults, role and privacy boundaries, EFS v2 authority/snapshot/enumeration gates, current DAVINCI maturity, economics, vendor questions, and acceptance tests.

### ArDrive product teardown (2026-07-29)

- [`2026-07-29-ardrive-product-teardown.md`](./2026-07-29-ardrive-product-teardown.md) — product/UX teardown of ArDrive (the shipped drive app on Arweave): onboarding, pricing disclosure, file management, sharing/permissions, private-drive ceremonies, publishing/ArNS, takedown reality and centralization map, company momentum, the mainstream-drive baseline, the dweb-drive graveyard, and the Arweave OS vacuum. Feeds `Designs/clientv2/file-browser-requirements.md`. Architecture layer deliberately excluded (covered by `Brainstorms/2026-07-21-codex-arfs-ardrive-competitive-architecture.md`).
- [`2026-07-29-ardrive-teardown-corpus/`](./2026-07-29-ardrive-teardown-corpus/README.md) — 12 dated research-lane reports plus the live app probe and the shipped app's extracted UI string evidence.

### Wikifreedia, plural knowledge, and EFS (2026-07-29)

- [`2026-07-29-wikifreedia-plural-knowledge-and-efs.md`](./2026-07-29-wikifreedia-plural-knowledge-and-efs.md) — deep review of Wikifreedia/NIP-54: plural signed entries, protocol and product control planes, live relay corpus, openness/credible-neutrality scorecard, history and safety lessons, alternatives, and a non-canonical EFS pressure test.
- [`2026-07-29-wikifreedia-corpus/`](./2026-07-29-wikifreedia-corpus/README.md) — primary-project evidence, sixteen precedent projects grouped by layer, EFS crosswalk, dated live observations, and a content-free 411-event manifest.

### Ethereum-aligned voting alternatives and EFS (2026-07-28)

- [`2026-07-28-voting/`](./2026-07-28-voting/) — current primary-source comparison of MACI v3, Semaphore, Snapshot, OpenZeppelin Governor, Shutter, Interfold/CRISP, DAVINCI, Belenios, ElectionGuard and Decidim; includes per-project reports, an EFS backend profile, a use-case decision matrix and a synthetic validation program.
- [`comparison.md`](./2026-07-28-voting/comparison.md) — direct MACI maturity/ideology/EFS verdict, best system by use case, coordinator-free research directions and pilot sequence.
- [`efs-integration.md`](./2026-07-28-voting/efs-integration.md) — backend-neutral EFS voting profile and the generic EFS v2 requirements exercised by voting.

### EFS target communities (2026-07-29)

- [`2026-07-29-target-communities/`](./2026-07-29-target-communities/) — source-indexed research across visual galleries and boorus, adult creators, public/research data, wikis and fandom, open hardware, games/mods/speedruns, music/zines and dead platforms; includes the steward-calibrated five-community validation shortlist, broad opportunity map, adversarial review, gallery/data/package fixtures, product requirements and candidate first apps.
- [`opportunity-map.md`](./2026-07-29-target-communities/opportunity-map.md) — canonical comparison: wiki migrations, public-data rescue, open hardware, mod maintainers and a creator-controlled illustration collective, all explicitly unvalidated until a real steward commits.
- [`requirements-and-first-apps.md`](./2026-07-29-target-communities/requirements-and-first-apps.md) — gallery and cross-community acceptance tests, current-design pressure, serving boundaries and demo proposals.

### Virtual OS Museum deep dive — playable-archive pressure test (2026-07-29)

- [`2026-07-29-virtual-os-museum-deep-dive.md`](./2026-07-29-virtual-os-museum-deep-dive.md) — architecture-pressure pass on the Virtual OS Museum (Andrew Warkentin's 1,700-install VM museum) and the entire browser-OS-emulation field, against EFS v2 generic primitives and the client v2 kernel: what the museum is, why one-click matters, which OS classes actually run in browsers (measured: System 7 in <2 s on 1.4 MB), licensing/neutrality reality, parity + better-than-parity verdicts, PAF tightening proposals, no-protocol-gap finding, and a legally-clean staged demo plan. Extends `Designs/efsv2/playable-archive-requirements.md`; N5 and runner-lane decisions preserved as undecided.
- [`2026-07-29-virtual-os-museum-corpus/`](./2026-07-29-virtual-os-museum-corpus/README.md) — 7 evidence lanes (history, architecture teardown incl. live apt-repo inspection, licensing, 3 runtime surveys, first-hand hands-on probe) + 6 synthesis docs (feasibility matrix, feature matrix, EFS coverage/gap ledger, threats, vertical slice, open questions), all source-graded and dated.

### EthStorage and EFS boundary (2026-08-05)

- [`2026-08-05-ethstorage-deep-dive.md`](./2026-08-05-ethstorage-deep-dive.md) — current EthStorage architecture, economics, proof and governance boundaries; `web3://`, FlatDirectory, W3Drive/dBlog, and verified-frontend evidence; the candidate EFS-above-EthStorage differentiation thesis; OS/product-boundary constraints; claim safety; and a falsifiable integration/walk-away program. It selects no carrier or v2 design.
- [`2026-08-05-ethstorage-corpus/`](./2026-08-05-ethstorage-corpus/README.md) — pinned-source protocol/product reports, EFS comparison and gap ledger, and the validation program future storage designers should rerun before adopting, partnering with, or positioning against EthStorage.

### GoE / Git on Ethereum (2026-08-05)

- [`2026-08-05-goe-deep-dive.md`](./2026-08-05-goe-deep-dive.md) — separate teardown of GoE's released CLI, remote helper, contracts, and live Sepolia use: what Git transport it already solves, why it is not yet a credibly neutral forge, its production-readiness gates, and the reuse/build decision rule.
- [`2026-08-05-goe-corpus/`](./2026-08-05-goe-corpus/README.md) — Git-helper and contract behavior, deployment evidence, security/trust gates, and a candidate portable Git profile/library plus Markdown-workspace acceptance suite.

### EFS Git deep dive — neutral hosting, Git-backed wikis, and the ref-transaction fold (2026-08-07)

- [`2026-08-07-efs-git-deep-dive.md`](./2026-08-07-efs-git-deep-dive.md) — dedicated from-scratch pass on EFS Git: verdict that the EFS Wiki workspace (not a GitHub clone) is the first product; the `GIT-REF/1` admission-ordered ref-transaction fold as the zero-kernel-surface answer to replay-safe atomic multi-ref CAS; the exact Git/EFS canonical-state boundary; reuse-vs-build ledger; a five-item owner packet (GD-1…GD-5); unknowns and kill conditions. Riders on P-1/E2/Q3 only; no kernel asks, no carrier adopted.
- [`2026-08-07-efs-git-corpus/`](./2026-08-07-efs-git-corpus/README.md) — requirements ledger, state model, primitive fit/gap, storage/closure/recovery, wiki + collaboration objects, four candidate architectures, threat/economics, fifteen grounding traces, freeze-impact table, prototype plan + acceptance suite, thirteen primary-source prior-art lanes, twelve first-hand Git fixture experiments, and the verbatim adversarial-review record.

### EFS v2 to 1.5 bridge deep dive (2026-08-07)

- [`2026-08-07-efs-v2-to-15-deep-dive.md`](./2026-08-07-efs-v2-to-15-deep-dive.md) — contraction pass after dropping portable data from the near-term bridge: recommends an additive sibling EAS profile with stable DataId lineages, body-bound RecordVersionIds, four semantic roles, explicit receipt folding, honest reads/trust source, and one immutable shared router over a bounded on-chain Type/Shape/binding descriptor; keeps Arcade identities above the core; proves 1.5 is viable but not an SDK alias and defines the finite freeze/fork package.
- [`2026-08-07-efs-v2-to-15-corpus/`](./2026-08-07-efs-v2-to-15-corpus/README.md) — v2 disposition ledger, actual-v1/live-Sepolia feasibility and migration boundary, Arcade/Nanda/Git/wiki/file/schema traces, and the integrated adversarial review record.

### EFS 2.0 Core engineering pass — Stage A corpus (2026-08-13)

- [`2026-08-13-efs2-stage-a-corpus/`](./2026-08-13-efs2-stage-a-corpus/) — Fable 5's Stage A of the commissioned EFS 2.0 core engineering pass ([[fable-efs2-core-engineering-kickoff]]): intake audit, the B0 baseline chapter set with seam pins SR-1..SR-18, bakeoff/harness/vector/traceability specs, and the evidence corpus (standards audit, carry-in register, intake + red-team findings, proposed spine edits). **Read [`STATUS.md`](./2026-08-13-efs2-stage-a-corpus/STATUS.md) first — the repair round was cut off mid-flight, so no chapter is review-ready.** Nothing landed into the EFS 2.0 spine; no shared design file was edited.
