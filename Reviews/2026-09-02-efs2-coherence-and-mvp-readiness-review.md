# EFS 2.0 — top-down coherence and MVP-readiness review

**Status:** finished review record; point-in-time (2026-09-02/03); proposes freely and adopts nothing. No freeze, repository, runtime ABI, venue, product scope, or implementation is authorized by this document, and nothing here answers an owner question.
**Commissioned by:** @james, via the PM prompt "EFS 2.0 — top-down coherence and MVP-readiness review"
**Agent:** @efs2-coherence-review (harness claude-code), 2026-09-02/03
**Method:** read-only reader lanes over the whole design surface, twelve seam and cross-cutting lanes including a never-decided sweep, three direction judges with deliberately different lenses, and a two-lens adversarial verification pass over the blocking findings. Full method, counts and limits: §11.
**Corpus:** [`2026-09-02-efs2-coherence-review-corpus/`](./2026-09-02-efs2-coherence-review-corpus/README.md) — every lane map, seam report, judgement, and the [findings ledger](./2026-09-02-efs2-coherence-review-corpus/findings-ledger.md)
**Reviewed tip:** `main` at `8ae846a`; branches `codex/v2-readiness-week@2573f08`, `codex/sdkv2-pm@57d04f8`, `codex/data-explorer-pm@8d90ecb`, `lab/2026-08-26-fable-consumer-tournament@70d78a5`

#status/done #kind/review #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/coherence #topic/requirements #pass/2026-09-02-coherence-review

## 0. The answer on a phone

**Does the design hold together?** At the concept level, yes, and better than the volume suggests. Every current document uses the same algebra — a Record is author-neutral exact content, an Occurrence is who published it, Admission is what a Realm accepted, a Binding is one Principal's current answer, a Lens is one reader's policy — and no seam is conceptually unsound. Three independent judges, given deliberately different lenses, returned the same verdict: **mostly right, over-scoped**.

**Can you start the MVP James directed on 2026-08-14 — an official write-capable File Browser?** Not honestly, yet, and not because anything needs more design. Six engineering choices the write path depends on are written down nowhere on `main`: how a directory is listed completely, where a created file's bytes live, which Principal shape the write path uses, how many signatures a folder costs, which Type arm the first Realm mints, and three unminted constants that make every `RealmId` uncomputable. There is also no EFS 2.0 SDK design on `main`, and the write journey lazily loads one. Each of these needs one page that *chooses*, not another pass.

**Can you start a disposable, nondeployable candidate now?** Yes — and on unmerged branches the project already did. `codex/v2-readiness-week` carries an executed JavaScript and Solidity control with vectors and measured Lens gas, a build-start packet whose technical disposition is `RECOMMEND-GO-CODE`, and the vault's only answerable owner item (**V2-C1**). `main` does not have any of it, and `main`'s generated roll-up says **Ask now: 0**.

**The one structural fault** is not a contradiction in the design. It is that authority and progress are recorded where nothing can see them. Twenty-eight owner directions live only in a draft README; the Core ruling ledger stops on 2026-08-12; Stage A's sixteen proposed spine edits were never applied; the reconciliation handoff the client set promises does not exist; and more than 50,000 lines of the most advanced work sit on four branches invisible to every script the vault uses to answer "what is open". Two engineers reading two spines today would build two different products, and both would be right about what they read.

**The one item with a date on it.** Yesterday's commits accepted the Devcon talk and locked its hard requirements, which commit to demonstrating "independent retrieval and verification, including corruption and unavailability" over the public EFS Sepolia system. Chasing that path through the code found something worse than the known hash defect: the only writer that mints durable values emits a non-conformant bare hash, its verifier has no callers, the one conformant implementation is stranded on a branch whose merge was stopped, and under that implementation every durable value reads as *malformed* rather than merely wrong. The seeder that would re-mint the corpus is in no repository, so "v1 data is disposable and may be reseeded" currently has no reseeder. This is not a protocol problem and not on the MVP path, but it has a November date and an owner who is not the Core lane. §1 has the chain.

**What I would cut:** the nine-cell bakeoff as an MVP prerequisite, the layered Type arm's View/QueryProfile machinery, FilesRouter and certified writes, managed Principals and KEL, the sandboxed-app lanes, the OS-preservation track, the modern-Web guidance apparatus as a build gate, roughly two-thirds of the MVP acceptance document, Arcade as a product, Media, the App Store, Git as a first product, and native mounts. Every cut keeps a named seam; §6 says which.

## 1. Where the design process actually is

| Set | Standing on `main` | Maturity | The honest one-line read |
|---|---|---|---|
| `efsv2/` spine | current | draft, untouched since the 2026-08-13 import | Sound shape; three weeks behind its own inputs; three Type vocabularies; five constitutional promises with no primitive |
| Stage A B0 corpus | proposal-only evidence | red-teamed spec; Stage B unrun on `main` | The most internally cohesive artifact in the vault. Zero of its 16 spine edits applied; complete directory enumeration missing from its own gap register |
| `hierarchical-files-and-folders.md` | current (`#status/review`) | reviewed proposal | Coherent on B0; needs two primitives B0 does not have, one of them genesis-or-never |
| `layered-type-system-and-data-abi.md` | current, README-designated "the focused Type proposal" | draft, zero reviewers | A third vocabulary; the owner's answer on this axis was lost and never re-asked |
| Identity / Lens / privacy (July) | historical | evidence | Correctly demoted. The sensitivity policy layer James named as a deliverable is designed nowhere |
| `web-client-os/` | current spine | draft; peer-agent reviewed, no owner sign-off | The most internally coherent product set. Scope inflation, and it is the only place the owner's authority is recorded |
| `open-web-app-store/` | current | draft, reviewed | Its boundary with the OS is genuinely settled on both sides. Not on the MVP path; over-scoped for anything shipping this year |
| `media-library/` | current | draft, reviewed | Coherent and honest about its own limits. Later lane; two Core asks hide inside generic wording |
| `arcade/` | current correction over a 2026-08-07 launch plan | draft, unreviewed | Most bodies still narrate the superseded launch plan — seven of twelve name the September date or the 12–18-game catalog outright; every gate date has passed; the falsification is unanswered; nobody owns placement |
| Git / forge | no design folder | 2026-08-07 research, pre-reset | Flagship workload whose corpus assumes the retired July kernel; its owner packet is in no queue; its card expired with zero output |
| SDK (`Designs/sdk-*.md`) | v1 docs marked `review` | historical | No EFS 2.0 SDK design on `main`. The real one is on an unmerged branch four current documents cite by permalink |
| OS Drives / mounts | adopted requirement (2026-07-22) | no folder, owner, or queue | Correctly deferred from the MVP; a release gate with nobody behind it |
| `efs15/`, `clientv2/` | historical | evidence | Cleanly labelled at the folder level; six of 23 `clientv2` files carry no historical marker in their header block, and three current documents still route to retired mechanisms |
| Unmerged branches | not on `main` | executed control + build-start packet | Where the project actually is. Converts evidence gates into delegated defaults; carries the only answerable owner decision |

### Verifying rather than inheriting the dated defects

The PM asked that the 2026-08-13 defects be re-checked, not repeated.

| Claim, as of 2026-08-13 | Status 2026-09-02 | How it was checked |
|---|---|---|
| `verifyContentHash` has zero callers | **Still true** at contracts `c6b4075`: defined at `packages/nextjs/utils/efs/transports.ts:111`, referenced nowhere in contracts, client, or the SDK `chore/scaffold` branch | grep across all three clones |
| 67 durable Sepolia files carry non-canonical hashes | **Count unverifiable here** (RPC blocked), **but the code state is verified and worse than the original report** — see below | four RPC endpoints attempted; writer chain traced across all three clones |
| IPFS pins sit on one VPS node | **Unverifiable**; no pinning configuration exists in any repository | grep |
| The Sepolia faucet is built but not deployed | **Consistent with the repo**: faucet UI components exist in the explorer; there is no faucet contract source and no deployment artifact under `packages/hardhat/deployments` | file listing |
| Devnet 26001993 has no contracts | **Unverifiable** (RPC); the explorer still configures it as a target | grep |

**No EFS 2.0 code exists in any sibling repository.** `contracts` is v1 at 2026-06-25, `client` was marked legacy on 2026-07-23, and `sdk`'s default branch contains only a licence. The only executed v2 code in the project is on the readiness branch and the orphan lab branch.

### The content-hash chain, and why it stopped being a v1 footnote yesterday

Chasing the hash defect end to end turned up something sharper than the original report, and every step below I re-checked myself in the clones.

The canonical form is ratified: `contracts/specs/10-file-metadata-encoding.md` and ADR-0064 are **Accepted**, ratified 2026-06-20, and require a multibase-`base16` multihash — sha2-256, `f1220…` — and say writers MUST emit it. The writer that actually mints durable values does not. `packages/nextjs/lib/efs/uploadOnchainFile.ts` calls `computeContentHash`, which is a bare `keccak256`, and binds the result as a **non-revocable** property. Its sibling verifier `verifyContentHash` sits directly beneath it with zero callers. Across the whole contracts monorepo, `multihash`, `multibase` and `f1220` appear only three times, all inside one design document that records the discrepancy rather than fixing it.

The repository's own `FUTURE_WORK.md` names the escape hatch: the separate `client` repository is "the conformant writer that matters at launch". It is not. At `client` HEAD the entire source tree is 17 files and contains no hashing code at all, and the same commit marks the client legacy.

The one conformant implementation does exist: the SDK scaffold branch has `hashContent` returning `f1220` plus sha2-256, wired into its fetch paths, with tests and its own accepted ADR. Its default branch is a licence file, and the v1 SDK merge work was stopped by the 2026-08-08 greenfield ruling. So the fix is written, tested, and unreachable.

The consequence nobody has written down: under that conformant reader, a bare `0x` keccak value decodes to nothing and is reported as a **malformed claim** — not a mismatch, not tampering. Every durable Sepolia content hash is unverifiable by construction rather than merely wrong.

And the seeder of record — the tool that would emit the canonical form and re-mint the corpus — is in no cloned repository. `Designs/arcade/README.md` already says it "was never merged". That matters because it hollows out the escape hatch everyone has been leaning on: the 2026-08-08 ruling says v1 data "is disposable and may be reseeded", and that is only true if a reseeder exists.

**Why this is now urgent rather than archival.** I had written that these defects were moot for EFS 2.0. They are not. On 2026-09-02 — the three commits that landed on `main` while this review was running — the Devcon talk was **accepted and participation confirmed**, and `Milestones.md` moved from "Hard requirements: None locked" to five locked requirements. The accepted presentation shape commits to using "the public EFS Sepolia system as the working example" and to "**demonstrate independent retrieval and verification, including corruption and unavailability**", with "a preverified offline fallback for the live demonstration".

That is precisely the path that has no verifier with a caller, whose durable values are malformed under the only conformant reader, whose bytes depend on pin custody the vault itself describes as one machine, and which cannot be reseeded because the seeder is in no repository. The talk is in November. This is not a protocol problem and it is not on the MVP critical path, but it is the one item in this review with an external date attached, and it belongs to whoever owns the Devcon demo rather than to the Core lane.

The narrower Arcade items keyed to the dead 2026-09-11 launch — comments, catalog rights, name and domain, faucet stand-up — are genuinely moot, as is re-binding the 67 existing hashes. The writer and seeder half is not.

## 2. The structural fault: authority and progress recorded where nothing can see them

Every lane converged on this independently. It is a `vault-process` and `owner` problem before it is a design problem, and it is the reason two spines describe two products.

**Owner directions 1–28 exist only inside a draft design README.** `Designs/web-client-os/README.md` §"Direct owner direction recorded for this round" carries 28 requirements "supplied directly by James from 2026-08-14 through 2026-08-23", with no `ruled by` marker and no per-item dates. `Designs/efsv2/owner-rulings.md` ends 2026-08-12; `Decisions.md` ends 2026-08-13; `Designs/web-client-os/` has neither an inbox nor a rulings file, so `scripts/open-decisions.sh` — which discovers queues by finding `owner-decision-inbox.md` — cannot see the set at all. Directions 2, 7, 8, 9 and 10 bind Core: the write-capable MVP, the uniform `PrincipalId` surface, the 64-Principal Lens target, rich Unicode/NFC names, and Sepolia as the first development Commons. By the vault's own recording rule they belong in the Core ledger, and by James's own 2026-07-16 direction ("ALL owner decisions in ONE canonical place going forward") they cannot live in two.

**The Core spine still contradicts the owner on what defines the MVP.** `system-constitution.md` §Open questions asks "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?" — answered by direction 2 nineteen days ago. `V2-E6` still says "Then decide whether the first Web Client also needs writes". `efsv2/README.md` build-order step 6 describes a read slice plus a one-game Arcade view. The client README's own "Upstream synchronization note (2026-08-14)" concedes the drift and says "The EFS v2 PM has the exact reconciliation handoff"; no such handoff exists anywhere in the vault, and no commit has touched the constitution or the candidate since the 2026-08-13 import.

**Stage A proposed sixteen spine edits and none was applied.** A1–A4, B1–B2, C1–C9 and D1 carry verbatim old and new text and route most edits to "PM applies". None of the new wording appears in the spine. The corpus's own seven-row contradiction ledger therefore remains live — including the resolver outcome vocabulary, which is a contract-facing ABI question and not prose: the constitution lists five outcomes in mixed case, the engineering kickoff lists four, the candidate folds `UNSUPPORTED` into `UNKNOWN`, and B0 pins exactly five with cause codes.

**The vault's own drift detector is disarmed, and its green light is vacuous.** `Retirements.md` is the input to `needs-integration.sh`, the script whose whole purpose is to produce the "decided but not yet integrated" work order — the vault built it precisely because a carrier ruling took sixteen days to reach the Kanban card. Its Active table has been empty since 2026-08-12. So the script reports "No active retirements — nothing to integrate", which is exactly what it told me when I started this review, and which means nothing at all: no ruling or direction since 2026-08-12 has been given a retirement phrase, so there is nothing for it to look for. The audit passes because the question was never asked. The three drift items in this section are precisely what it would have caught.

The same applies to the spine silence, stated precisely: since the reconciliation handoff was promised on 2026-08-14, three commits have touched `Designs/efsv2/`, and all three *added new drafts* — hierarchical Files, the layered Type proposal, and one spine touch. None of them modified the constitution, the core architecture candidate, the decision inbox, or the ruling ledger, which all still sit at the 2026-08-13 import.

**"Ask now: 0" is structurally blind.** `scripts/open-decisions.sh` classifies decide-now, after-evidence, at-launch, settled, delegated and superseded. There is no bucket for an *authorization*. Every spine ends in "after explicit experiment authorization"; the client set's non-authorizations forbid every candidate repository name; the Core Kanban card expired 2026-08-16 annotated "no owner ask"; Stage A's own status says no prototype has executed the corpus. The single decision that would start work has no place on `main` to live, so the generated page is mechanically correct and substantively false.

**Four unmerged branches hold the project's actual state.** `codex/v2-readiness-week` (4 ahead, 7 behind) rewrites the README, constitution, candidate and inbox; adds `mvp-build-start-packet.md`, `v2-contract-readiness-program.md`, `owner-guide.md` and four `exp-c0-v0-*` profiles; adds an executed control under `Reviews/2026-08-25-efs2-exp-c0-v0-control/` with JavaScript and Solidity implementations, tests and vectors; and converts V2-E1 through V2-E4 from "compare and return evidence" into delegated candidate defaults with measured backing — including a point `ResolutionPlan` at 1/8/32/64 Principals measured at 30,504 / 92,369 / 314,759 / 616,577 gas on first resolve. That measurement carries its own honest scope, which anyone quoting it must carry too: a disposable monolithic mapping-backed resolver only, excluding intrinsic gas, calldata pricing, plan registration, cross-contract calls, and production storage topology. `codex/sdkv2-pm` holds the only EFS 2.0 SDK design set plus two 2026-08-22 founder rulings (an SDK PM mandate, and a 100-year preservation horizon) that `main` records nowhere. `codex/data-explorer-pm` holds a separate first-party product lane James directed on 2026-08-22, whose write-capable arm names the same three operations as the web-client-os MVP. The orphan `lab/2026-08-26-fable-consumer-tournament` reports 119/119 differential agreement between an independent Python oracle and a Solidity system under test across 16 Types, 36 Records and 119 cases, and finds that pinning an exact Type costs about 0.05% of gas while the flexible arms are the expensive ones.

The three non-orphan branches are source-locked to each other by exact commit and digest: the SDK and Explorer lanes pin the readiness lane's Core commit, the readiness lane's acceptance checker names their exact heads and report hashes, and lanes that re-computed those digests found every one matching byte for byte. So the three branches are cryptographically bound to each other and to nothing on `main`. That has a consequence nobody has recorded: the readiness branch cannot merge alone without stranding its own top-line evidence, because its checker resolves objects that live only on the other two remote branches. Three PM lanes, one shared source lock, and no merge choreography written down anywhere.

The readiness branch's honesty discipline is unusually good — it records zero executable trace replays, marks every gate partial, and states that code is not authorized — and every symbolic count and digest a lane could recompute checked out exactly. But its executable evidence is **not reproducible from the vault**. The control's model module resolves `ethers` through a require rooted at a sibling `contracts` checkout *outside the repository*, and the folder carries no manifest or lockfile. Running the suite from the vault, as its own README instructs, gives 11 passes and 41 failures out of 52. I ran it myself and got exactly that. The measurements are real, and a reader who has only the vault cannot reproduce them — which is the project's own "confirmed, then unreadable" failure shape, turned on its own evidence.

I also tested whether being unmerged is a technical problem: it is not. `git merge-tree` shows every one of the three non-orphan branches merges into `main` with conflicts **only** in the append-only coordination files — `Daily Notes/agent-status.md` for all three, plus `Reviews/README.md` for the Data Explorer branch. Pairwise they conflict only on those files plus the generated `Open-Decisions.md` and the `Designs/README.md` content map. There is no design-content conflict anywhere. The branches are unmerged for process reasons, and the fix is mechanical.

**Rulings superseded in substance without a marker.** "Chains don't die" (2026-07-10) was adopted when a single always-queryable home chain was the payoff; 2026-08-12 removed the home chain and made "a qualifying EVM Realm" — any fresh L3 — the unit. The venue evidence calls the assumption "empirically false for L3s". The ruling has never been re-scoped or retired, and is still cited as a live guarantee in the Git corpus requirements ledger, the Virtual OS Museum deep dive, and two Stage A chapters. Separately: the 2026-07-22 "write the support matrix, then choose the MVP" direction was overridden by direction 2 with no note and the matrix was never written; the 2026-08-07 v1-bridge entries in `Decisions.md` carry no reversal marker after 2026-08-08 reversed them; and the 2026-07-25 framing rulings were never ratified into any ledger.

**Routing.** `vault-process`: record directions 2/7/8/9/10 in the Core ledger with dates and the recorder's-wording caveat; give `web-client-os/` an inbox and rulings file and an `authority.md` scope row; add an authorization bucket to the roll-up; disposition the sixteen Stage A edits; mark the superseded entries; and put one pointer on `main` naming the four branches until each is merged or retired. `owner`: only the merge-or-hold decision and V2-C1 itself need James.

## 3. The seams

The PM named the seams where trouble was expected. They were right about where, and mostly wrong about severity: eight are strained, two are broken, none is conceptually incoherent.

| Seam | Verdict | What holds | What is strained or broken |
|---|---|---|---|
| App Store × OS × Types | strained | `PackageHandoff`, `ResolvedPackageSet`, `ResolutionReceipt`, `RuntimeRequest`, and the `InstallBindingGeneration`/`InstallStatusLedger` split carry identical names, semantics and authority on both sides, cross-confirmed by both PMs on 2026-08-15; the cross-set anchors resolve | The Type layer beneath is undecided on both sides: the Store maps to B0 in prose while its only executed fixture ran on the layered arm, and the OS adapter claims arm-neutrality in layered vocabulary. `PackageRelease`'s version label is label-in in prose, testimony in its own requirement, label-out in the fixture, and identity-bearing under both Core arms. The Store's Core-shaped asks are filed in no efsv2 queue, against its own routing rule. `UpdateTrustState` is handed to the OS and undefined there |
| Arcade × App Store × runtime | strained | Shared laws agree everywhere: explicit Play, exact bytes before execution, plural locators with tampered-primary rejection, curator selection as attributable evidence, no Arcade-specific Core primitive | Traffic is one-way. Arcade cites none of its three current neighbours, carries a v1 vocabulary in its bodies and an efs15-era one in its banner, and routes settled runner questions to July documents. It sells "verified" Play from an open-egress frame that the runtime spine strips of exact-execution qualification. Four neighbour-authored Arcade traces disagree on Release identity and on the fixture artifact. Sequencing against the File Browser is stated five inconsistent ways |
| Media × Types × index budget | strained (later lane) | The query ladder is arm-neutral in wording; its first rungs ride obligations the owner already ruled; onchain-first with The Graph last survives the reset via a dated media ruling | The two mechanisms media needs beyond the baseline are each gated on the other side, and the only workload that would prove them is in no Stage B fixture. Nobody has priced a post: from B0's own hypotheses a high-percentile 100-tag post exceeds both the per-transaction gas cap and the envelope leaf bound. `TagAssertion` has two incompatible shapes inside the set. The README still depends on historical `clientv2` and on a specification outside the vault |
| Git/forge × Types × Core | strained | The constitution and B0 already supply one mechanism for the Git trace — a push transaction Record plus per-ref Binding CAS in one atomic envelope — and Stage A's fixture honours the 2026-08-07 forge-expressibility obligation at specification level | The corpus's read-time ref fold is a *different* mechanism built on superseded July premises, and neither document cites the other. B0 Binding heads are Principal-scoped, so the two-contributor race the fold existed to solve cannot occur as modelled, and nothing says whose Principal owns a canonical ref. One Markdown page has three unreconciled revision models. The owner packet vanished from every queue with no hold record |
| clientv2 assumptions the OS spine changed | strained | The OS README's audit table dispositions the July round row by row, twenty rows, and is honest about what it retires | The retirement is clean; the *propagation* is not. Two live product sets and eight efsv2 documents still stand on assumptions the spine retired, and the record of the retirement exists only as prose in one draft README. Where July had mechanism the spine kept one-line duties: no trusted-ceremony rendering rule, no per-write prompt budget, no first-visit disclosure, and no threat model for the MVP |
| SDK and mounts | **broken** | The three-host read-only mount requirement is owner-adopted, correctly wired into Files, and correctly deferred from the MVP | Every current set leans on an SDK no document on `main` designs. The Files resolver, the plan→sign→submit→receipt→read-back seam, and the result vocabulary are each placed three different ways. Two steps the MVP journey names — normalizing an EOA into a zero-setup Principal, and compiling an action plan from trusted schemas — are specified nowhere. Thirteen root SDK documents still read as live. OS Drives has no owner, folder, or queue |
| efsv2 internal object model | strained | Identical concept algebra across all six current documents; Stage A's cross-chapter ID preimages were re-checked and are consistent | The MVP write journey and Files are written against B0 names the declared spine either never mentions or marks optional. The README's "current Type proposal" uses a third vocabulary and the README mislabels it. `BindingScope` — required by the constitution, by an adopted owner ruling, by Files and by the MVP — exists in no Core document and in no gap register, and by Files' own rule it is genesis-or-never |
| Evidence-round bindings | strained | The *shape* of three of five load-bearing findings is already in the design: blobs are not custody, a sandbox is not a network cage, `UNKNOWN` is never absence | None of the *numbers* were absorbed. `8037`, `22 fps`, `exit window` and `97,920` have zero hits under `Designs/`. The three gates the round was routed to were last reconciled the day before it landed and were never amended. The Etched "no body elision" promise is unconditional while every surveyed L2 can change the execution environment with zero notice |
| "Confirmed, then unreadable" | strained | The design already speaks the evidence's language, and the honest-outcome vocabulary is the right countermeasure | Of the eight dependencies a reader needs one year after a Sepolia write, only two are declared with a reconstruction path. The one the evidence shows dying first — a queryable endpoint — is the least declared. Sepolia is named the first development Commons in five documents and testnet lifecycle is acknowledged in none of them |
| `main` × the unmerged branches | **broken** | The three non-orphan branches are internally coherent, cryptographically source-locked to each other, and merge into `main` with conflicts only in append-only files | `main` does not describe the project. Its roll-up says "Ask now: 0" while a branch holds a live owner decision; its Core spine still asks a question a branch answered the other way; the only SDK design and two founder rulings live only on a branch four `main` documents cite by permalink; and the readiness branch cannot merge alone without stranding evidence that lives on the other two. Three PM lanes, one shared source lock, no merge choreography recorded anywhere |

### The five evidence bindings, one row each

The PM named these as the findings most likely to get lost. They were checked one at a time against the documents each one binds, in the corrected wording of the round's own `CORRECTIONS.md` rather than the original memo wording.

| Binding | Absorbed into the design? | What is still owed |
|---|---|---|
| **Blob retention** — about 18.2 days is the guaranteed window; commitments persist, bytes do not | **Yes**, in every current document. `large-file-uploads.md` reserves the blob tier and the owner's item 16 puts file bytes at the ephemeral DA tier; the client set states plainly that blob retention is not EFS custody | Stage A's custody table still folds blob DA into `CHAIN_HISTORY`, and `large-file-uploads.md` carries no provenance classification |
| **Upgrade and exit** — no surveyed L2 met a 30-day bar under all upgrade paths, and several keep zero-delay emergency paths | **Partly.** The axis exists in the V2-E7 gate and in the constitution's review criteria | No threshold, and no statement that the no-elision and state-readability promises are per-Realm and conditional on that Realm's upgrade authority. The phrase `exit window` has zero hits under `Designs/` |
| **EIP-8037** — roughly 4.9× for a net-new storage slot, pending a real benchmark and unverified L2 adoption | **No.** Zero hits for `8037` under `Designs/` or the Stage A corpus | Stage A prices every write against the current schedule from memory. The gas snapshot needs two schedule columns, and L2 adoption needs to become a column on the venue gate |
| **Safari runner** — no process isolation for an opaque sandboxed iframe, throttled to about 22 frames per second, measured n=1 on one machine | **Shape yes, numbers no.** The hang, egress and self-navigation residuals are in the runtime document in substance | The measured frame and timer caps and the fullscreen-attribute inversion appear nowhere, and nothing cites the measurement. Arcade's smoke tuple has no Safari or iOS row |
| **Arcade falsification** — zero EFS-specific benefits for the tested catalog, twice, by independent methods | **Pointer only**, from the Arcade README's link list | The README's promise sentence is the falsified hypothesis restated as a promise. The recut has no owner, and the held decision was never re-asked as fixture-versus-pilot |

Three of the five are absorbed in shape. None of the five is absorbed as a number. That distinction is the whole of the evidence seam: the design learned the lesson and never wrote down the measurement, so nothing downstream can be checked against it.

### The dependency walk worth reading twice

For a file published on Sepolia through the MVP and opened a year later, the reader needs: a queryable endpoint at a usable basis; Sepolia still existing and not frozen; the Realm descriptor; the contract code, read ABI and Codex constants; the Type Schema bytes and their meaning; a byte carrier; the client release and its bootstrap origin; and index state. Two of those eight are declared as dependencies with a reconstruction path. The rest are implicit. That is the exact failure shape four evidence lanes converged on, and the design's answer to it is currently a vocabulary rather than a fixture.

## 4. Findings by repair class

The full ledger with per-finding verification verdicts, evidence, and source lanes is in the corpus: [`findings-ledger.md`](./2026-09-02-efs2-coherence-review-corpus/findings-ledger.md). The classes the PM asked for are kept strictly separate there, because they need different repairs:

- **WRONG** — a design statement that is incorrect, unsound, or internally contradictory. Someone edits the text.
- **UNDECIDED** — assumed by one or more sets, decided and owned by nobody. Someone chooses, and it is usually not James.
- **DRIFT** — the owner decided, and documents still say otherwise. Someone propagates, and `Retirements.md` should carry the phrase.
- **MISSING** — nobody designed it. Someone writes it.
- **DIRECTION** — the direction itself is questionable or over-scoped. §5.
- **DEFECT** — a concrete checkable fact that is wrong or stale.
- **CUT** — scope to drop or park. §6.
- **UNVERIFIABLE** — could not be checked from this session. §10.

### Where the work lands

The lanes produced 623 candidate findings before clustering and verification. Their distribution is itself a finding, because it says who has to do what:

| Owning set | Blocking | MVP-relevant | WRONG | UNDECIDED | DRIFT | MISSING | DIRECTION | DEFECT | CUT | UNVERIFIABLE | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `efsv2` | 24 | 135 | 21 | 62 | 37 | 41 | 12 | 47 | 7 | 8 | 235 |
| `vault-process` | 12 | 37 | | 1 | 12 | 6 | | 63 | | 8 | 90 |
| `owner` | 21 | 52 | 1 | 39 | 7 | 10 | 11 | 1 | 2 | 3 | 74 |
| `web-client-os` | 6 | 52 | 5 | 21 | | 25 | 5 | 3 | 12 | 1 | 72 |
| `arcade` | 1 | 29 | 6 | 1 | 12 | 6 | | 9 | 5 | 1 | 40 |
| `sdk` | 4 | 24 | | 8 | 7 | 9 | 1 | 8 | 3 | | 36 |
| `git-forge` | 1 | 10 | | 8 | 7 | 2 | 2 | 1 | 2 | 2 | 24 |
| `media-library` | 1 | 13 | 4 | 3 | 5 | 2 | | 5 | 2 | | 21 |
| `open-web-app-store` | | 5 | 2 | 1 | | 4 | 1 | 2 | 4 | 2 | 16 |
| `data-explorer` | | 5 | | | 1 | | | 4 | 2 | | 7 |
| `clientv2` | | 2 | | | 3 | | | 2 | | | 5 |
| `efs15` | | | | | | | | 2 | | 1 | 3 |
| **All** | **70** | **364** | **39** | **144** | **91** | **105** | **32** | **147** | **39** | **26** | **623** |

Three shapes stand out. `vault-process` is 63 of 90 `DEFECT` — hygiene, not disagreement, and mostly cheap. `owner` is 39 of 74 `UNDECIDED` — James's queue is short but every item on it is currently invisible to the queue machinery. And `efsv2` carries the bulk of everything, which is correct for a Core lane but means it is also the bottleneck: it owns 24 of the 70 blocking candidates and cannot resolve most of them without the two decisions above it.

`data-explorer` appears as an owning set only because a branch carries a product set that `main` has never seen. That row is itself the process finding in §2, restated as an arithmetic.

Note the honest caveat: these are candidates, and this table counts them before clustering. Many describe the same underlying problem found by several lanes independently. The ledger carries the clustered set, with the verification verdicts on the blocking rows.

### The ten distinct blockers

Read against the MVP, the blocking candidates collapse into ten problems, and only two of them are about the protocol:

1. **Complete directory listing has no Core primitive** — required by the constitution, by the 2026-07-22 mount ruling, by Files, and by the MVP's read-after-create criterion; absent from B0 and from Stage A's own gap register; genesis-or-never for whichever Realm the MVP mints. `efsv2`.
2. **No byte carrier for a created file** — the MVP's own open question; the inherited default is a public gateway to a single pin, which the IPFS-stewardship review rules out as a critical path; the only storage direction is a superseded pre-greenfield ruling; who pays is unrecorded. `owner` with `efsv2` costing.
3. **No EFS 2.0 SDK on `main`** — every set calls one; the real design is on an unmerged branch that four current documents cite. `sdk` and `vault-process`.
4. **Nobody is authorized to build, and the process cannot represent an authorization** — §2. `owner` and `vault-process`.
5. **The Principal shape for writes is unowned** — direction 7's worked example describes a multi-controller Principal; Core offers a single-key account Principal with no rotation, where three keys are three Principals; the stolen-key consequence is written nowhere a first writer would see it. `owner` via V2-E1.
6. **Type arm and genesis Type registration** — the axis is explicitly unruled and the owner's answer was lost; Files silently assumes one arm; no document says how a Type reaches a Realm or who ships the dev-Realm genesis set. `efsv2`.
7. **Twenty-eight directions unledgered and the spine three weeks behind** — §2. `vault-process`.
8. **No repository and no Realm deployment or churn ceremony** — four documents name four different containers; nobody owns the key; every semantic iteration is a new `RealmId` with no successor pointer. `owner`.
9. **The write ceremony costs two wallet signatures per operation, and no document says so** — it follows from the candidate's own admission rules, is inherited unacknowledged by the client, and is worse than the v1 one-click bar it replaces. `efsv2` with `web-client-os`.
10. **Arcade's placement and sequencing are stated five ways with no owner** — and one deadline (ETHOnline) was defaulting to an Arcade slice whose recut has not happened. `owner`.

## 5. Direction: the honest read

Three judges, `mostly-right-but-overscoped` from all three, for different reasons.

**Right, and worth defending.** The greenfield reset with no v1 compatibility. A standalone Core in one EVM Realm with Commons optional and nothing an operator runs as authority. Guest read before any wallet. Full state-readable bodies, mandatory automatic indexing, honest `UNKNOWN`, and second-implementation reconstruction — precisely the countermeasures to the failure class the evidence found. Locators as plural claims, never identity; blobs never custody. The risk-bearer chooses the Lens; discovery never authorizes execution. And a write-capable File Browser as the contract-debugging harness is the right call: a read-only first product would give Core no pressure at all.

**Right in intent, wrong in execution.** Every fork is kept alive for a freeze that is months away — eight candidate rows, nine bakeoff cells, nine Type experiments, Files "experiment arms". For a freeze that is discipline; for an MVP it is the enemy. Four of the nine cells answer questions no owner gate asks, while the two gates a product actually needs are not cells at all. The MVP acceptance document is 929 lines of which the write path is about 80, and its definition of done never says which sections are required. The modern-Web guidance gate front-loads a ledger schema and a CI check before the first line of guest-read code. The 2026-07-22 sequencing was inverted without a note, and the target-community research James commissioned on 2026-07-29 — which produced a ranked shortlist and a six-gate go/no-go rule — is consumed by nothing: the MVP document names no user, community, steward or audience.

**Wrong, or unkeepable as written.** Six things, and these are the uncomfortable ones.

*The permanence promise is per-Realm and operator-conditional, and nobody has told the owner.* The unit of deployment is "a fresh qualifying L3"; "qualifying" is defined nowhere; that is the class the evidence found mortal. The simplifying assumption that made this coherent was adopted in a home-chain world that no longer exists.

*"Independent reconstruction" cannot re-verify who signed.* B0 deliberately does not persist the main envelope witness, so a second implementation reconstructs that this Core *said* an author signed — not the signature. That is a "PAY IT"-class trade and it was never put to James.

*The storage-heavy promises are priced against a schedule that is leaving.* The mandatory index bundle is dominated by new storage writes by construction; every Stage A gas figure is schedule arithmetic; EIP-8037 appears nowhere in `Designs/` or the corpus; and at the evidence round's qualified figure a maximum-size Record body would exceed the per-transaction gas cap. No gas snapshot exists seven weeks after the owner named it the blocker to final sign.

*The first write-capable product silently re-introduces "stolen key means permanent capture".* Directory entries are Principal-owned compare-and-set heads, an ungraduated account Principal has no rotation, and the limitation appears in no document a first writer would read.

*Arcade as a "possible founding product/community pilot" is not supportable on the evidence the project itself gathered.* The falsification found zero benefits it could classify as uniquely EFS-specific for the tested catalog; the README still leads with a beat its own product document calls parity; the community shortlist does not contain it. Arcade is a good Core fixture and a poor first product, and saying so plainly costs nothing.

*The readiness branch's delegated-defaults regime chooses on axes the owner reserved, and reverses one of his directions.* It selects a flat exact nominal Type with separately identified query profiles — a position on the Type-identity axis that three owner records call open, and that direction 12 explicitly leaves unchosen after his answer was lost. More consequentially, it deletes the constitution's open question about whether the first client writes and replaces it with a **read-only-first** product loop, and it deletes `V2-E6` outright with no disposition row. Direction 2 says the opposite in the owner's own words: the first MVP must be an official write-capable File Browser, with basic creation "so the client can also debug the evolving contracts". A branch cannot resolve an owner question by deleting it and answering the other way.

The regime's stated authority is that a 2026-08-23 work direction lets agents make reversible engineering selections while the owner travels. That authorization appears nowhere in the vault. Choosing a compiler version, a storage layout or a test harness is squarely inside what agents may decide; choosing the Type identity axis and inverting the first product are not, and the vault's own 2026-07-23 decision system draws that line.

So V2-C1, which is formally the best-constructed owner item anyone has written — four separated fields, literal reply forms, an explicit non-authorization list — would in practice have James ratifying the Type axis and a read-first product order alongside the thing it says it is asking. That is a wording fix, not an objection to the work, which remains the most concrete thing the project has produced.

**One thing nobody is asking that they should.** Three first-party products now claim overlapping first slices: the File Browser (direction 2), the Data Explorer's write-capable arm (branch), and the readiness branch's "Explorer plus minimum Files profile" vertical. They share a Reader, an action-plan boundary, and three operations. Either they are one product with two shells, or the project is building two. No document decides, and the decision is cheap today and expensive in a month.

## 6. What I would cut

Every cut names the seam it keeps.

**efsv2.** The nine-cell bakeoff beyond B0 as an MVP prerequisite — keep the corpus manifest and its axis pins. Views, view bindings, query-profile and view-query-profile machinery — keep one exact-Type name and one `RecordId` preimage. FilesRouter, routed admission intents, and certified exclusive-create/rename/move, roughly a thousand lines — keep the three non-conformance labels bound into plan and receipt. Managed Principals, KEL, recovery, ERC-1271 and ERC-6492, the P-256 and RSA verifier kinds, and the verifier VM — keep the authority-kind enum append-only and the envelope's authority reservation. On-chain best-locator selection, the historical unique-by-Type cursor, and compound index specs. Cross-Realm portability, the second admission-intent version, and the undefined Recognition Record — keep the Realm id inside the intent's signing domain. The rich-Unicode certification arm — publish NFC names as exact bytes only, and keep one Unicode pin. **Revocation-aware live counts cannot be cut silently**: the 2026-07-15 ruling says "PAY for it" and the constitution forbids silent deletion, so that one is an explicit owner ask, not an engineering trim.

**web-client-os.** Acceptance sections G8–21, H, I and J; the air-gapped dual rebuild and per-release image retention; multi-script IME conformance catalogs; agent-delegation fixtures; the client-side 64-Principal measurement (consume the Core result instead); the per-change guidance trace, the five ledgers and the evidence CI gate (keep the two census files and one retained snapshot); about thirty of the thirty-nine "required forward" web rows; the control-pack bakeoff and page-component comparator, for a product with roughly five controls. Of the three architecture documents, keep the trust root, the Reader Kernel and the raw rescue; keep the rest as reserved names.

**arcade.** Comments in every form, the on-chain star and faucet, the pull-request curation repository, the twelve-to-eighteen-game catalog and outreach, the hash remediation, brand and sponsorship, the September video and calendar. Keep one Core-level Andromeda trace as a Stage B fixture, and rewrite the README's promise sentence to what is actually tested.

**media-library and open-web-app-store.** Both out of the MVP; both already defer to the first-product gate. Keep the shared exact-bytes vocabulary and the settled handoff names.

**git-forge.** The wiki as first product; the ref fold as written; browser-side Git; the stock-push gateway; SHA-256 migration; the skills-registry rider. Keep Markdown history, compare and restore over file-revision parents inside the File Browser as the natural extension of "publish revision".

**sdk.** The Solidity SDK, the deterministic Type compiler, the conformance program, and every account-abstraction one-signature mechanism inherited from v1 — all of it was built to shave attestation prompts that no longer exist. Keep five seams: read-exact, read-page, read-bytes, plan-sign-submit, read-back, plus the result law.

**mounts.** Native adapters as an MVP deliverable. Keep the shared resolver contract and the three-host acceptance trace.

## 7. Solid enough to build on now

- **The B0 identity discipline**: two-level IDs and the closed domain table; the packed body codec with its error codes; the Type-schema group formula and recursion rules; the publication envelope with a chain-free signing digest; the admission intent with two-dimensional nonce lanes and expected revisions; the four-state occurrence lifecycle with idempotent retry and no resurrection; the account Principal with EOA and contract-signature paths and the delegated-account rule; the Realm and Realm-revision formulas; and the state-only reconstruction walk. One lane re-checked every cross-chapter preimage and found one consistent object model. That is enough to code against.
- **The Binding compare-and-set state machine**, the single page and cursor ABI with a fail-closed completeness enum, the revocation-aware count with exactly-once decrement, and the point-read resolution plan with its three combiners.
- **The exact-bytes vocabulary** — chunk tree with verification, artifact closure, representation binding — already reused unchanged by Files, Media, the App Store and the Web Client.
- **The Files object shape**: stable object genesis plus charter binding, directory entries and whiteouts as binding targets, immutable file revisions with a file-head binding. The MVP's three operations map onto these exactly.
- **The guest-read journey and the result law**: the outcome vocabulary, `UNKNOWN` never meaning absence, bytes-unavailable as an honest failure, per-locator tampering, and the experimental-direct-Core labelling discipline that keeps a disposable build from claiming conformance. This is the most reusable thing the client set produced and it depends on no open bakeoff.
- **The App Store to OS handoff** and the install-binding/status-ledger split — genuinely settled on both sides, in writing, by both PMs.
- **The two greenfield rulings**, the three-host mount requirement as an acceptance gate, the media rulings, and the evidence round's authority posture and correction register.
- **On the branches, as evidence**: the control's vectors and differential tests, the tournament's 119/119 agreement and its finding that exact-Type pinning is essentially free while flexible arms are expensive, and the measured Lens gas curve.

## 8. What must be settled first

| # | Decision | Who | Where | Why it cannot wait |
|---|---|---|---|---|
| S1 | **One authorization packet**: a disposable Stage B slice on B0 plus the File Browser fixture as throwaway code; the repository; the Realm (local fresh L3 first, Sepolia second); the deployer key; and the rule that each semantic iteration is a new Realm with a client-owned Realm list. If the readiness branch merges, this *is* V2-C1 with its bundled defaults made visible | James | a Decide-now item in `Designs/efsv2/owner-decision-inbox.md`, or `Owner-Inbox.md` | Nothing starts, and the roll-up cannot show it |
| S2 | **Build the B0 control arm**, every Type byte disposable and visibly so in its domain strings; one Type-object name across Core, Files, the client and the SDK; re-ask the lost Type-axis question separately | efsv2 PM; James only for the re-ask | efsv2 | Two vocabularies and one silent choice |
| S3 | **Complete listing for the MVP**: mint the scope index into the disposable Realm at genesis, or ship point-resolve with a labelled partial listing — and say which | efsv2 with web-client-os | efsv2 (no item exists) | Adding it later can never claim complete old directories |
| S4 | **The write ceremony**: accept two signatures per operation in one sentence, or amend the admission rule so an own-key sender may carry its own binding leaves | efsv2 with web-client-os; James informed | efsv2 | The dominant UX cost is currently invisible |
| S5 | **The byte carrier**: Realm state custody for small files, which inherits the Realm's fate and satisfies the carrier-extinction trace by construction, plus one funded independent pin and an honest failure otherwise; and who pays | James, with efsv2 costing | efsv2 (new item) | Blocks file creation, and the September carrier watch has no owner |
| S6 | **The Principal for the MVP**: single-key account Principal; direction 7's multi-controller example is a later slice; write the key-loss paragraph and the graduate-without-rewriting-history falsifier | James for scope, efsv2 for text | V2-E1 | Before anyone but the author uses the write path |
| S7 | **Mint three constants**: the contract-signature verification gas figure, a null policy encoding with error codes, and one Unicode pin | efsv2 Stage B lead | corpus manifest | Trivial, unowned, and every Realm id is uncomputable without them |
| S8 | **The SDK**: merge or retire the SDK branch, and put one SDK MVP surface on `main` | James for merge-or-hold; sdk for the document | `Designs/README.md`; a new sdk queue | The write fixture needs codecs nothing on `main` owns |
| S9 | **"Chains don't die", per Realm**: define "qualifying", label MVP receipts and links as development-testnet, and adopt, edit or reject the per-Realm re-scoping Stage A already drafted | James, one sentence, via efsv2 | V2-E5/E7 and the ruling ledger | Every permanence sentence is conditional on it |
| S10 | **Ledger hygiene and a fenced acceptance list** — §2's repairs, plus naming which acceptance sections are MVP-required | PM; web-client-os PM | vault-process; web-client-os | Otherwise "done" is undefined and two teams build two products |

Not first, but not optional before any public claim or steward conversation: the one gas snapshot under both schedules against a named venue; the envelope-witness persistence decision; the Arcade recut as fixture-versus-pilot; and naming the first user, or saying plainly that there is none yet and the File Browser is a harness.

## 9. A proposed MVP slice

Proposal only.

One static, self-hostable File Browser. Guest read of a public folder or file on an explicit Realm; then, after explicit promotion, new folder, new file with small bytes in state custody, and publish revision. EOA only. One disposable Realm with every domain string visibly experimental. NFC names, uncertified. The B0 control arm. Plans of one to eight Principals. Nothing else.

Order: mint the three constants and one disposable corpus with the scope index at genesis, and stand up one atomic Core on a local fresh L3 with the write entrypoint and the read ABI, with golden vectors in two languages. Then an SDK package with exactly the five seams and the result law. Then the guest reader against the local chain, then the same bytes on Sepolia. Then write promotion, the signing ceremony, canonical read-back and receipts, and a clean-browser reopen. Then a clean-room second reader that rebuilds Types, Records, Occurrences, Bindings and the listing from state alone. Then the gas snapshot under both schedules, and a Realm-churn drill in which every link into the retired Realm reports unsupported or unknown and never empty.

Behind adapters: the Type vocabulary, the Realm descriptor, the byte carrier, the wallet stack, and the Lens size. Frozen for the experiment only, and visibly so in the bytes. Explicitly not: certified writes, rename/move/delete, contract signatures, managed Principals, views and query profiles, the bakeoff, cross-Realm anything, Arcade, mounts, Media, the App Store, Git, service workers, the guidance ledger, and any permanence claim about Sepolia.

The readiness branch's own milestone program is close to this in substance. The three differences that matter are the first vertical, the Type arm, and making the bundled defaults visible in the owner packet.

## 10. What could not be verified

- Live Sepolia and devnet state: the non-canonical content hashes, devnet contracts, pin custody, faucet deployment. The session proxy blocks public RPC.
- The Stage A claim that a partial Stage B monolith compiled to a specific runtime size: no artifact exists in the vault or any repository, and it sits oddly beside "Stage B has not run".
- Whether the branch control and lab test suites pass as reported. The branch reader lanes were asked to execute them read-only; the corpus records what they found.
- Sepolia validator permissioning, which the evidence round's own correction register leaves unresolved.
- Point-in-time venue, fee and account-abstraction facts dated 2026-08-12/13, which need refreshing before any public claim.

## 11. Method and limits

Twenty-two reader lanes over `main` and four over the unmerged branches; twelve seam and cross-cutting lanes; three direction judges with deliberately different lenses; a never-decided sweep; and a two-lens adversarial verification pass over the clusters the lanes rated blocking, one lens testing textual accuracy and currency, the other materiality and classification, each trying to refute the finding, with refuted and already-dispositioned findings recorded rather than deleted.

Verification was not run over every cluster, and the ledger says so row by row. The blocking clusters were attacked because they are the ones a decision would rest on; the rest carry only the corroboration of independent lanes converging on them. A ledger row marked "not separately verified" is a citation to check, not an established fact.

Every lane was read-only on the vault and wrote to a scratchpad; every finding carries file-and-heading citations; seam lanes returned to the sources rather than trusting a summary; and the dated defects were re-checked rather than inherited. Where a later lane corrected an earlier one — most notably a claim that the candidate and the layered Type proposal use two different Record identity preimages, when both reduce to the same formula written at different levels of detail — the correction is recorded in the ledger and this report follows it.

Limits: two session usage interruptions delayed several lanes, which were re-run from cache, and the reviewing model changed partway through, so lane outputs are not all from one model. Reading depth varies by lane and each map records its own: the eight Stage A subsystem chapters were read in full, the harness and falsifier chapters at list depth, and the 166 KB lens-architecture review at summary and cost-table depth. No live chain state was reachable. The four branches were read as evidence of project state, not as adopted design.

**The constraint this review was commissioned under, in the words it was given:**

> Propose freely; adopt nothing. Owner rulings go through the decision inbox and James. Nothing here authorizes a freeze, a repository, a runtime ABI, or an implementation.

It held. No design body, decision inbox, ruling ledger, Kanban card, or requirement was edited by this round; the only writes were this report, its corpus, the Reviews index entry, and one agent-status line.
