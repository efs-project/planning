# Reviews

Analysis, critique, and build-record artifacts produced by review/architecture agents. Top-level artifacts are date-prefixed files or folders (`YYYY-MM-DD-<slug>`); nested companion filenames may be descriptive. These are point-in-time outputs — reference them as history; the canonical decisions they fed into live in the relevant repo's ADRs and in [[Decisions]].

## Contents

### Joined local MVP workflow rehearsal (2026-09-04)

- [`2026-09-04-mvp-rehearsal/`](./2026-09-04-mvp-rehearsal/README.md) — real local Solidity, five-seam SDK, browser Files/data and explicit verified game launch; compiled-in Solidity consumer, adversarial checks, runtime/storage measurements and three-repo build blueprint. Uses a separate `efs-lab/1` profile: not full C0, M0 conformance, product creation, real-wallet compatibility or public deployment evidence.

### AGNTCY and shared public agent data (2026-09-03)

- [`2026-09-03-agntcy-deep-dive/`](./2026-09-03-agntcy-deep-dive/README.md) — released Directory/OASF storage, discovery and exact skill-bundle audit; Identity, SLIM, SHADI, LF governance and adoption; overlap with EFS profiles/SOUL/shared knowledge; source-pinned fidelity/current-state caveats; and one disposable conventional-baseline-versus-EFS comparison. Records interoperability opportunities without adopting an agent-specific Core primitive, runtime, public registry or new deadline.

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

- [`2026-08-13-efs2-stage-a-corpus/`](./2026-08-13-efs2-stage-a-corpus/) — completed specification/evidence Stage A of the commissioned EFS 2.0 Core engineering pass: exact candidate B0, 9-cell bakeoff, 10 fixtures, vectors/falsifiers, 151-row traceability, and preserved evidence. Start with [`stage-a-report.md`](./2026-08-13-efs2-stage-a-corpus/stage-a-report.md), then [`STATUS.md`](./2026-08-13-efs2-stage-a-corpus/STATUS.md). No proposal was applied to `Designs/efsv2/`; protocol adoption/freeze and all Stage B bytes, prototypes, executions, measurements, reconstruction, and deployment remain unclaimed.

### Claude cross-workstream evidence round (2026-08-13)

- [`2026-08-13-claude-evidence-round/`](./2026-08-13-claude-evidence-round/README.md) — corrected synthesis and routing for four directly launched research workstreams covering Arcade differentiation and Andromeda, browser-runner behavior, and Realm/Commons venue/L1 risk. All 30 distinct completed reports are preserved under [`corpus/`](./2026-08-13-claude-evidence-round/corpus/README.md); [`CORRECTIONS.md`](./2026-08-13-claude-evidence-round/CORRECTIONS.md) governs overclaims in the raw memos and original PM compression. Dated research only: no owner ask, design ruling, venue choice, Arcade disposition, publication clearance, or runner policy.

### EFS Media Library / Booru intake (2026-08-14)

- [`2026-08-14-media-library-intake/`](./2026-08-14-media-library-intake/README.md) — authority-aware product intake for a personal/public tagged-media library: a proposed common charter and roadmap, retained requirements, current standards and adapter boundaries, a smallest-fixture obligation set, generic-Core mapping, and three exact conditional falsifier traces. It adopts no first-product ordering, media schema, Core mechanism, public corpus, Realm, or implementation.
- [`product-charter-and-roadmap.md`](./2026-08-14-media-library-intake/product-charter-and-roadmap.md) — durable common promises, users/jobs, recommended personal/local-first MVP, staged exit gates, mature findings, open choices and exact Core-escalation rule.
- [`fixture-pressure-map.md`](./2026-08-14-media-library-intake/fixture-pressure-map.md) — original/derivative/video, conflicting-curator, private-relationship, duplicate/provenance and verified-retrieval obligations mapped onto current generic EFS concepts.

### Open Web App Store × layered Type/Data ABI pressure (2026-08-22)

- [`2026-08-22-open-web-app-store-type-data-abi-pressure/`](./2026-08-22-open-web-app-store-type-data-abi-pressure/) — disposable, versioned application-layer fixture for exact Projects, authored Releases, selected dependency sets, finite catalogs, plural evidence, inert runtime handoff, bounded Type/View roots and reconstruction after publisher/catalog/forge disappearance. Three fresh runs pass 71/71 checks with identical non-measurement results; no protocol bytes, Core change, resolver, runtime, public catalog or implementation is adopted.

### Web platform standards screen (2026-08-23)

- [`2026-08-23-web-platform-standards-screen/`](./2026-08-23-web-platform-standards-screen/) — reproducible 1,228-row index across the pinned W3C `browser-specs`, TC39, WebAssembly and WASI catalogs, plus a high-recall primary-family review through WHATWG, CSS, Unicode/CLDR, IETF, WPT, web-features/BCD, ARIA-AT, Open UI and WICG. It records source/reproducibility limits, selected-feature status, forward-profile implications and negative evidence; no browser target, package, polyfill, runtime, repository or implementation is adopted.

### IPFS maintainership transition and EFS impact (2026-08-24)

- [`2026-08-24-ipfs-maintainership-transition.md`](./2026-08-24-ipfs-maintainership-transition.md) — primary-source and HN-comment assessment of Shipyard's September 30 exit from IPFS maintenance and public-utility operations; distinguishes protocol survival from maintainership, persistence, gateway, routing and browser-delivery risk; confirms IPFS remains an optional EFS carrier; and routes one cold carrier-extinction acceptance trace without adopting a storage provider, protocol, or Core change.

### Debloat.dev open-source directory intake (2026-08-24)

- [`2026-08-24-debloat-directory-intake.md`](./2026-08-24-debloat-directory-intake.md) — point-in-time product and HN-comment assessment of a fast, guest-friendly open-source alternatives directory; preserves its concrete catalog, Wanted, machine-readable, curation, governance and exit lessons; and parks a curator-qualified, independently verified Open Alternatives catalog as a possible future Open Web App Store/Data Explorer fixture without importing the live database, creating a global default index, or adding an EFS Core requirement.

### DeepSeek Harness, Cordis, and modular-system pressure (2026-08-26)

- [`2026-08-26-module-plugin-systems-pressure/`](./2026-08-26-module-plugin-systems-pressure/) — pinned DeepSeek Harness and Cordis-paper/code review plus OSGi, Eclipse, VS Code/LSP, WebExtensions, Nix/Guix, Kubernetes, systemd/D-Bus, WordPress, Figma, SES and Wasm comparison; retains owned-resource lifecycle, explicit dependency, consumer-first withdrawal and transactional-reconciliation laws while rejecting a same-realm plugin framework as EFS identity, authority, confinement or production-update architecture. Adds exact direct-route, teardown, provider, conflict, crash, external-effect, cross-lane, hostile-runtime, migration, scale and provenance fixtures without adopting a runtime or Core change.

### EFS 2.0 top-down coherence and MVP-readiness review (2026-09-02)

- [`2026-09-02-efs2-coherence-and-mvp-readiness-review.md`](./2026-09-02-efs2-coherence-and-mvp-readiness-review.md) — commissioned whole-surface read of every EFS 2.0 design set, the Stage A and evidence corpora, the ruling ledgers, the sibling code repositories, and the four unmerged planning branches. Verdict: the concept algebra is coherent and the direction is mostly right but over-scoped; the structural fault is that owner authority and the project's most advanced work are recorded where the vault's own process cannot see them. Separates WRONG / UNDECIDED / DRIFT / MISSING / DIRECTION / DEFECT / CUT / UNVERIFIABLE, routes every finding to an owning set, names ten distinct blockers under the write-capable File Browser MVP, and proposes a cut list and a smallest slice. Adopts nothing; no freeze, repository, venue, or implementation is authorized.
- [`2026-09-02-efs2-coherence-review-corpus/`](./2026-09-02-efs2-coherence-review-corpus/README.md) — 26 reader-lane maps, 12 seam reports, 3 direction judgements, and the [findings ledger](./2026-09-02-efs2-coherence-review-corpus/findings-ledger.md), which carries every clustered finding with its repair class, owning set and source lanes, the adversarial-verification verdicts on the blocking rows, and the findings that were refuted or found already dispositioned.
- [`2026-09-02-efs2-coherence-and-mvp-readiness-review-errata.md`](./2026-09-02-efs2-coherence-and-mvp-readiness-review-errata.md) — controlling correction record for the review's over-broad Core-authorization, genesis/admission, complete-listing, two-signature, placeholder-constant, branch-count, and verification readings. It preserves the review and corpus as evidence and adopts no architecture, experiment, repository, deployment, or protocol decision.

### Portable EFS agent roles (2026-09-03)

- [`2026-09-03-agent-role-system/`](./2026-09-03-agent-role-system/) — owner-approved operating briefs, cross-harness instruction research, bounded implementation and fresh-context review evidence. Stable roles and explicit task handoffs do not grant authority or launch workers; native-harness tests are distinguished from document and helper validation. Start with the live [role roster](../Agents/README.md).
