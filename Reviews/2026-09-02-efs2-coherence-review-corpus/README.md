# 2026-09-02 — EFS 2.0 coherence and MVP-readiness review corpus

**Status:** preserved lane record for the [top-down coherence and MVP-readiness review](../2026-09-02-efs2-coherence-and-mvp-readiness-review.md); dated research output, not a design, ruling, or owner packet
**Commissioned by:** @james via the PM prompt "EFS 2.0 — top-down coherence and MVP-readiness review"
**Method:** one lead reviewer orchestrating parallel read-only lanes over the whole design surface, then seam hunters, direction judges, and a two-lens adversarial verification pass over the blocking findings
**Authority:** observations and reviewer interpretations only. Nothing here adopts a mechanism, freezes bytes, authorizes a repository or implementation, or answers an owner question. Existing design gates decide what survives.

#status/done #kind/review #repo/planning #topic/efsv2 #topic/coherence #pass/2026-09-02-coherence-review

## What this corpus is

The review read `Designs/` in full (all sets plus the root documents), the Stage A B0 corpus, the 2026-08-13 evidence round, the Git/forge corpus, the 2026-06/07 review record, every ruling ledger and decision inbox, the three sibling code repositories (v1, read-only clones), and the four unmerged planning branches that `main` does not show. This folder preserves what each lane actually found, so a later agent can check the report against its inputs rather than trusting the synthesis.

The report is the synthesis and governs how the round should be cited. Where a lane map and the report disagree, the report is the corrected reading — with one exception noted below.

## Layout

| Path | What it holds |
|---|---|
| `README.md` | This file: method, lane index, limits, and citation rules |
| `findings-ledger.md` | Every clustered finding with its repair class, owning set, MVP relevance, verification verdict, and source lanes |
| `maps/` | One map per reader lane: per-document standing, neighbour assumptions, decided/undecided/drift, defects, solid-now vs settle-first vs cut |
| `seams/` | Seam reports, direction judgements, the never-decided ledger, and the MVP-cut synthesis |

## Reader lanes (`maps/`)

| Lane | Covered |
|---|---|
| `R1-efsv2-spine` | EFS 2.0 README, constitution, core candidate, rulings, inbox, freeze gates, transition plan, pass syntheses, ops doctrine, substrate decision |
| `R2-efsv2-types-ids-onchain` | Layered Type/Data ABI, deterministic IDs, codex envelope/kinds/kernel, on-chain completeness and graph queries, portable-schema handoffs |
| `R3-efsv2-files` | Hierarchical files and folders, mountable filesystem semantics, FS-pass docs, large-file uploads |
| `R4-efsv2-identity-lens-privacy` | KEL, identity, lens specs, read-lens spec, lens gotchas, privacy pass and reservations |
| `R5-efsv2-context-requirements` | Assumptions and requirements ledger, human overview, Ethereum-first and Solana frames, playable archive, client-OS pressure report |
| `R6-stageA-overview` | Stage A status, report, PM directive, B0 overview, bakeoff spec, traceability, proposed spine edits, intake, standards audit, carry-in register |
| `R7a-stageA-b0-ids-envelope-principal-realm` | B0 encoding and IDs, authorship envelope, Principal authority, Realm admission |
| `R7b-stageA-b0-indexes-lens-binding-locators` | B0 indexes, Lens, Binding, content Locators, harness and fixtures, vectors and falsifiers |
| `R8-wco-product-mvp-privacy` | Web Client/OS README, product constitution and roadmap, MVP and acceptance, privacy and agents |
| `R9-wco-architecture-runtime-profiles` | Architecture and modules, app runtime and direct launch, system profiles and generations |
| `R10-wco-technology-standards-typeabi` | Technology foundation, Web platform standards profile, Ethereum standards and interop, Type/Data ABI boundary pressure |
| `R11a-clientv2-thesis-kernel-boot` | July client/OS round: thesis, kernel capability model, boot and profiles, shell and sessions, system surfaces, open questions |
| `R11b-clientv2-packages-wallet-sdk-threat` | July client/OS round: packages and updates, persistence and sync, wallet and actions, SDK boundaries, file-browser requirements, third-party app model, agent-native, network privacy, threat model |
| `R12-open-web-app-store` | App Store README, architecture, inbox, and the 2026-08-22 Type/Data ABI pressure fixture (re-executed by the lane) |
| `R13-media-library` | Media README, infrastructure, Booru app, Plex/Jellyfin app, query and indexing, rulings, inbox, and the 2026-08-14 intake |
| `R14-arcade` | All twelve Arcade design documents plus the 2026-08-07 deep dive and corpus README |
| `R15-efs15-evidence` | EFS 1.5 README, requirements and boundaries, ID candidate, and the v2-to-1.5 deep dive and disposition ledger |
| `R16-git-forge` | 2026-08-07 Git deep dive and corpus, GoE deep dive, the credibly-neutral-forge brainstorm |
| `R17-sdk-and-mounts` | Root `Designs/sdk-*.md`, `clientv2/sdk-boundaries`, mountable filesystem semantics, repo map, and the three sibling code repositories |
| `R18-evidence-round` | The 2026-08-13 evidence round, its correction register, the venue/runner/Arcade corpora, the IPFS-stewardship review, and the Base native-AA review |
| `R19-process-rulings-ledger` | `Decisions.md`, `Retirements.md`, the generated `Open-Decisions.md`, `Owner-Inbox.md`, every folder inbox and rulings ledger, the 28 owner directions, Kanban, Milestones, Glossary, authority doctrine, and a read-only run of both audit scripts |
| `R20-older-reviews` | Cypherpunk OS audit, century storage, KEL foundation, lens architecture and scale, v2 adversarial, carrier decision, 2026-06-10 holistic review |
| `R21-readiness-week-branch` | `origin/codex/v2-readiness-week`: EXP-C0/v0 control, sealed traces, cross-lane acceptance, spine rewrites, the V2-C1 build-start packet |
| `R22-sdkv2-branch` | `origin/codex/sdkv2-pm`: the EFS v2 SDK design set and its two 2026-08-22 founder rulings |
| `R23-data-explorer-branch` | `origin/codex/data-explorer-pm`: the Data Explorer product set |
| `R24-lab-tournament-branch` | `origin/lab/2026-08-26-fable-consumer-tournament`: fixture corpus, oracle, Solidity SUT, differential agreement, law-completion breaks |

## Seam and judgement lanes (`seams/`)

| Lane | Question | Verdict |
|---|---|---|
| `S1-appstore-x-os-x-types` | Does the App Store hand the OS what the OS thinks it receives, and on which Type arm? | strained |
| `S2-arcade-x-appstore-x-runtime` | Does Arcade use its neighbours' objects and runner lanes? | strained |
| `S3-media-x-types-x-indexes` | Can the Core index budget carry the media query ladder? | strained |
| `S4-git-x-types-x-core` | Does the Git corpus's mechanism survive the greenfield reset? | strained |
| `S5-clientv2-assumptions-changed` | What still depends on July client behaviour the OS spine retired? | strained |
| `S6-sdk-and-mount-spread` | Is there one coherent SDK and mount story? | **broken** |
| `S7-efsv2-object-model-coherence` | Do the six current Core documents describe one object model? | strained |
| `S8-evidence-bindings-vs-design` | Has the 2026-08-13 evidence been absorbed by the designs it binds? | strained |
| `S9-confirmed-then-unreadable` | Does the design answer the failure shape four lanes converged on? | strained |
| `S10-concrete-defect-verification` | Are the dated 2026-08-13 defects still true, and are they moot? | mixed; the writer chain is worse than reported and is not moot |
| `S11-decided-but-docs-disagree` | Every owner ruling versus every current document | strained, trending broken on the process side |
| `S13-never-decided` | What does every set assume that nobody decided or owns? | 11 unowned MVP-blocking items |
| `J1-mvp-first` | Can two or three engineers ship the File Browser from this surface? | mostly-right-but-overscoped |
| `J2-cypherpunk-risk-first` | Do the 50-year promises hold on the venue class named? | mostly-right-but-overscoped |
| `J3-adoption-first` | Who uses this in year one and why? | mostly-right-but-overscoped |

The MVP-cut synthesis and the branch-aware readiness judgement were folded into the report itself (§6, §8, §9) rather than run as separate lanes; the three judges each supplied a proposal and the branch maps supplied the branch-aware correction.

## Method

1. **Fan-out.** Each reader lane received the same brief (read-only on the vault; cite file and heading; respect each folder README's current-versus-historical layering; separate the repair classes; route every finding to an owning set; propose nothing for adoption; verify rather than inherit dated defects) plus a lane-specific document list and question set. Lanes wrote a full map and returned a structured summary.
2. **Seams.** Seam lanes read the maps of both sides and then went back to the sources, so no seam claim rests on a summary.
3. **Judgement.** Three independent judges with deliberately different lenses (ship-it engineering, long-horizon cypherpunk risk, product adoption) and a never-decided sweep ran over the full map set; a fourth judge re-ran the question after the branch evidence landed.
4. **Verification.** Every candidate finding was clustered by underlying problem. The clusters the lanes rated **blocking** were then attacked by two independent verifiers: one testing textual accuracy and currency (does the cited text say this; is the document current; is it already dispositioned somewhere), one testing materiality and classification (is this worth acting on; is the repair class and owning set right; does it block the MVP). Findings refuted by either lens, or shown to be already dispositioned, were dropped; where a lens re-classified a surviving finding, the ledger follows the lens. Non-blocking clusters were **not** put through this pass — they carry the corroboration of independent lanes converging on them and nothing more, and `findings-ledger.md` marks each such row "not separately verified".

## Honest limits

- **Point in time.** Every claim is as of 2026-09-02/03 against `main` at `234c3e6` plus the three Devcon commits to `8ae846a`, and the four branches at the commits named in the report.
- **No live chain access.** The session proxy blocks public Sepolia RPC (HTTP 403 on CONNECT), so on-chain claims about the v1 deployment — the 67 non-canonical content hashes, devnet contract state, pin custody, faucet deployment — could not be checked and are labelled `UNVERIFIABLE` rather than repeated.
- **Reading depth varies.** The eight Stage A subsystem chapters were read in full by their lanes; `harness-and-fixtures.md` and `vectors-and-falsifiers.md` were read at fixture-list and falsifier-list depth. The 166 KB lens-architecture review was read at executive-summary, freeze-ledger and cost-table depth. Some very large product documents were read at section depth as each lane's map records.
- **Branch material is proposal-stage.** The four unmerged branches were read as evidence of project state, not as adopted design. `main` remains the coordination surface; the review's process findings say so.
- **Verification is not uniform.** Only the blocking clusters were adversarially verified. Treat an unverified row's citation as a pointer to check before acting on it.
- **Lane maps are not independently re-audited.** They are preserved as produced, including their occasional overreach. Where a later lane corrected an earlier one — most notably `S7` correcting the `R1`/`R2` claim that the candidate and the layered Type proposal use two different `RecordId` preimages, when both reduce to the same B0 formula written at different levels of detail — the correction is recorded in `findings-ledger.md` and the report follows the correction.
- **Two session interruptions.** Usage limits interrupted the run twice; affected lanes were re-run from cache. Lane counts, failures and re-runs are recorded above and in the report's method section.

## Citation rules

1. Current owner rulings and the owning decision inboxes establish project authority; nothing in this corpus outranks them.
2. The report governs the round's scoped synthesis.
3. `findings-ledger.md` governs individual findings, including their verification verdicts.
4. Lane maps and seam reports supply method, breadth, and counter-evidence.

Before using any dated external fact from this round for deployment, a public claim, or a funding statement, refresh it from its primary source. This corpus makes the reasoning recoverable; it does not make point-in-time facts timeless.
