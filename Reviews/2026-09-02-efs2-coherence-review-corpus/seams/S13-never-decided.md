# S13 — Never decided: the definitive UNDECIDED ledger (2026-09-02)

Lane: S13-never-decided · Vault the planning vault read-only · Inputs: all 22 Phase 1 reader maps (R1–R20) plus direct reads of `Open-Decisions.md`, both owner-decision inboxes, `Designs/web-client-os/README.md`, `Designs/web-client-os/mvp-and-acceptance.md`, `Designs/efsv2/core-architecture-candidate.md`, `Kanban.md`, and spot verifications listed in §9. Every item below names the vault file and heading/line; "R-n" marks the reader map that first surfaced it. Inference is marked.

---

## 0. Headline

`Open-Decisions.md` (generated 2026-08-21) says **Ask now: 0**. That is mechanically true and substantively false. The write-capable File Browser MVP that the owner directed on 2026-08-14 (`Designs/web-client-os/README.md` §Direct owner direction, item 2) depends on **eleven things that no document decides and no queue carries**, and on a further seven that are decided in substance but recorded nowhere the vault's own process recognises. The pattern is uniform: each design set assumes a neighbour owns the item; the neighbour either does not exist (`sdk` v2 on `main`, OS Drives, Git/forge, EAP, Nanda), is held (arcade, clientv2), or has a queue whose taxonomy cannot express the item (`scripts/open-decisions.sh` `classify()` has buckets for decide-now / after-evidence / at-launch / settled / delegated / superseded / mirror — none for "authorize" or "name the container"). The efsv2 inbox banner says "The current work is to prototype" while the client set says nothing may start "before explicit experiment authorization" (`Designs/web-client-os/README.md` §Current work sequence steps 3 and 10) — two contradictory assumptions about who may start, with nobody reconciling them.

Sorting the candidate list the task named into the three classes:

- **(a) genuinely never decided, nobody owns — 11 MVP-relevant items:** Sepolia deployer/upgrade key and Realm churn ceremony; genesis Type registration for the dev Realm; the byte carrier and who pays; the SDK v2 package boundary on `main`; the repository container for the first code; Stage B authorization and owner; complete directory enumeration primitive; the MVP Principal shape (single-key vs multi-controller); which acceptance sections are MVP-required; the Arcade slice's placement/sequencing; Sepolia data at testnet deprecation (and the orphaned "chains don't die" assumption behind it). Plus non-MVP: OS Drives owner, Git/forge owner, Devcon demo content.
- **(b) deliberately deferred with a named gate — 5 items:** Type identity Variant A/B (V2-E4/E8/F1 + owner-rulings 2026-08-12 "50-year bakeoff question"); Realm descriptor (V2-E5); Commons venue process (V2-E7 + constitution open question); Web Client vs OS one-package (owner-rulings 2026-08-12 "Open, not ruled" + V2-E6); `TypeSchema` vs `TypeRevision` name (candidate open question "after the Fable review" — a gate that has already passed unanswered).
- **(c) decided but unrecorded — 7 items:** the MVP wallet stack (decided by three agent docs, never stated, never costed, never put to James); the repository rename plan (WCO-11 vs `core/os/drive` vs `contracts/sdk/webclient/drive` — three incompatible answers); the Files write authority model (two signatures per write, inherited from the candidate, cost never acknowledged); Sepolia-first as a "ratified" claim; directions 1–28 as a whole; the 2026-07-02/07/25 outcome rulings (permissionless byte pool, no free tier, everyone pays, on-chain files first-class); the 2026-07-22 support-matrix sequencing that WCO-2 silently overrode.

The single owner decision that would move the MVP from "Ask now: 0" to buildable is one packet, not eleven: authorize a disposable Stage B slice + the File Browser fixture, name the repository and the Realm and the deployer key, pick B0 as the control Type arm, accept or reject the two-signature EOA ceremony, and name a carrier profile for small bytes. §7 writes that packet out.

---

## 1. Method and the three classes

"Undecided" here means: a design document *assumes* a value, mechanism, owner, or sequence; the assumption is load-bearing for at least one set; and no ruling (`Designs/efsv2/owner-rulings.md`, `Decisions.md`, `Designs/media-library/owner-rulings.md`) or direct owner direction (`Designs/web-client-os/README.md` §Direct owner direction, items 1–28) settles it. For every item I record:

1. **What is assumed and by which sets** (file:heading or line).
2. **Whether any decision queue carries it** — checked against `Open-Decisions.md` (Ask now 0; V2-E1…E8, V2-F1, V2-F2, MEDIA-E2/E3 waiting; MEDIA-L1/L2 scheduled; arcade D1–D7 and clientv2 held), `Designs/efsv2/owner-decision-inbox.md`, `Designs/owner-decision-inbox.md`, `Owner-Inbox.md` (FJ-4, FJ-5).
3. **Class:** (a) never decided and unowned; (b) deferred with a named gate (cite the gate); (c) decided but unrecorded (cite where the decision actually lives and which doc contradicts it).
4. **Who should own it** (set or `owner`).
5. **Whether it blocks the write-capable File Browser MVP** as defined in `Designs/web-client-os/mvp-and-acceptance.md` §Outcome (guest read + New folder / New file / Publish revision).

The brief's fixed context (Stage B unrun; no EFS 2.0 code in any repo; three Kanban In Flight cards expired) was taken as given and spot-verified where a claim below leans on it.

---

## 2. Summary table

| # | Item | Class | Queue carries it? | Owner (should) | Blocks File Browser MVP? |
|---|---|---|---|---|---|
| U1 | Who deploys/upgrades the Realm contracts on Sepolia, under what key, and how Realm churn is handled while "debugging the evolving contracts" | (a) | No. V2-E5 covers the descriptor, not the ceremony | efsv2 (V2-E5) + owner (key custody) | **Yes** |
| U2 | How Type Schemas reach the dev Realm and who ships the genesis Type set (incl. `BindingScope` "at Realm genesis") | (a) — Stage A SR-17 has an answer, unadopted | No | efsv2 (V2-E5 + Files) | **Yes** |
| U3 | Byte carrier for "create file from local bytes" and who pays | (a) | No. Only pre-greenfield storage direction (07-10) | owner (permanence fork) + efsv2 costing + web-client-os fixture | **Yes** |
| U4 | SDK v2 package boundary and repository; where the Files resolver and the write seam live | (a) + vault-process (design exists only on unmerged branch `codex/sdkv2-pm`) | No | sdk + owner (merge/visibility) | **Yes** |
| U5 | The repository container for the first EFS 2.0 code (`core/os/drive` vs `contracts/sdk/webclient/drive` vs disposable worktree) | (c) WCO-11 decided the end-state; the *first* container is (a) | No (Kanban: "deliberately unchosen") | owner + vault-process (`Decisions.md`) | **Yes** |
| U6 | Stage B release, owner, and program (9-cell bakeoff vs monolith plan); who may start prototypes | (a) | No — and `classify()` has no "authorize" bucket | PM + owner | **Yes** |
| U7 | Complete directory enumeration primitive (`BindingScope` vs smaller declared index), or an explicitly labelled PARTIAL-listing MVP | (a) | No inbox entry; only LP-2's "must earn separate mechanism" | efsv2 (Files + Core) | **Yes** for read-after-create listing; a labelled PARTIAL MVP is allowed but unchosen |
| U8 | MVP Principal shape: single-key `AccountPrincipal/1` (B0) vs the multi-controller Principal in direction 7's example | (a) — V2-E1 predates direction 7 | V2-E1 partially; direction 7 not fed back | owner via V2-E1 | **Yes** (scoping) |
| U9 | The MVP wallet stack (injected EIP-6963/1193 EOA, two EIP-712 signatures per op, sequential/5792, no sponsorship, ERC-1271 reported `UNSUPPORTED`) | (c) decided by agents, never stated or costed | No; README header says "no wallet stack ... authorized" | web-client-os + sdk, owner sign-off | **Yes** (ceremony budget) |
| U10 | Files write authority: `AdmissionIntent` vs same-sender; `EXPERIMENTAL_DIRECT_CORE` vs `UNSUPPORTED`; certified writes needing `RoutedAdmissionIntent/1` | (c) candidate decided two artifacts; consequence undecided | V2-E1/E3 loosely | efsv2 + web-client-os | **Yes** (ceremony shape) |
| U11 | Which of acceptance sections A–J are MVP-required; the reference device/host fixture for time budgets | (a) | No (web-client-os has no queue) | web-client-os | **Yes** for an honest "done"; device fixture: no |
| U12 | Whether the Arcade slice precedes, accompanies, or follows the File Browser; its client placement | (a) neighbours disagree | Arcade D1–D7 held; V2-E6 text stale; FJ-4 lapsing | owner via V2-E6 + web-client-os PM | No for File Browser; **yes** for any Arcade slice |
| U13 | Sepolia data at testnet deprecation; scope of "chains don't die" for Realms; what "qualifying Realm" means | (a) orphaned assumption | No — Stage A A2 packet filed nowhere; D7 held | owner (via V2-E5/E7) | No for dev MVP; **yes** for any permanence/Devcon claim |
| U14 | What the Devcon demo will be | (b)/(a) — "None locked" by design; rests on v1 Sepolia | No (Milestones, not a queue) | owner | No |
| U15 | Who owns OS Drives / native mounts (a V2-F2 release gate) | (a) | No | owner/vault-process | No (mounts deferred); release gate: yes |
| U16 | Who owns Git/forge; disposition of GD-1…GD-5; revision engine for Markdown | (a) | No — GD-1…GD-5 in no queue, no superseded list | owner/vault-process | No |
| U17 | Type identity Variant A vs B (and the third arm, layered-C); which arm the dev Realm mints | (b) gate V2-E4/E8/F1; owner answer "not interpretable" was lost | Yes (V2-E4/E8/F1) | efsv2 Stage B → owner; re-ask WCO-12 | No for a disposable slice on B0; **yes** for the client's stated "MVP critical path" |
| U18 | Realm descriptor format; policy-hook grammar; `ERC1271_VERIFY_GAS` placeholder that makes `RealmId` uncomputable | (b) gate V2-E5 | Yes (V2-E5) | efsv2 | Official MVP: yes; disposable fixture: stub allowed |
| U19 | Commons venue process | (b) gate V2-E7 + constitution open question | Yes (V2-E7) | efsv2 → owner | No (explicitly) |
| U20 | Web Client and OS one package or two | (b) owner-rulings 08-12 "Open, not ruled"; V2-E6 | Yes (V2-E6) | web-client-os → owner | No |
| U21 | `TypeSchema` vs `TypeRevision` (three vocabularies, two `RecordId` preimages) | (b) gate "after the Fable review" — passed unanswered | No | efsv2 (editorial) | Minor (SDK needs a name now) |
| U22 | Sepolia-first as a ratified ruling | (c) WCO-10 only | No | vault-process (ledger) | No |
| U23 | Directions 1–28 as rulings; web-client-os has no owner queue | (c) | No — structurally invisible | vault-process + owner | Process-blocking |
| U24 | 2026-07-02/07/25 outcome rulings never ledgered (permissionless byte pool, no takedown, everyone pays, on-chain files first-class, chains-as-drives) | (c) | No | owner + vault-process | Partly (the "who pays" half of U3) |
| U25 | 2026-07-22 "support matrix before choosing the MVP" — never written; silently overridden by WCO-2 | (c)/(a) | No | owner + efsv2 | No, but it is the missing artifact that would answer U11 |
| U26 | Gas budget under the EIP-8037 schedule | (b) V2-E4 exists but names no 8037 scenario | Yes (V2-E4) | efsv2 Stage B | No on Sepolia; yes for freeze |
| U27 | Data Explorer class: trusted base or first module | (a) | No | web-client-os | Yes-ish (decides whether the module model is on the MVP path) |
| U28 | Unicode pin 16.0 vs 17.0.0; `originRef` bytes for ERC-1271 Principals | (a) | No | efsv2 + Files | Minor |

---

## 3. Class (a) — genuinely never decided and nobody owns

### U1 — Who deploys and upgrades the Realm contracts on Sepolia, under what key, and how Realm churn is handled

**Assumed by:** the MVP write path assumes a deployed Core on Sepolia exists and that the client can "debug the evolving contracts" (`Designs/web-client-os/README.md` §Direct owner direction item 2: "It needs deliberately basic folder and file creation/writes so the client can also debug the evolving contracts"). `Designs/web-client-os/mvp-and-acceptance.md` §Development venue: "Sepolia is the definite first development Commons". The Ownership table assigns "Realm bootstrap" to EFS v2 (`Designs/web-client-os/README.md` §Ownership boundaries row "Core and Realm").

**What exists:** `Designs/efsv2/core-architecture-candidate.md` §Realm defines `RealmId`/`RealmRevision` and says "The exact descriptor and upgrade boundary remain a bakeoff target". Stage A `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md` line 352: "obtaining it out-of-band is above Core"; §7 U-1/U-3 forbid semantic change under one `RealmId` ("breaking = new Realm"), and `RealmSuccessor/1` is named at line 1422 but never defined; `InitConfig/1` carries no deployer identity (R7a §4, §8 item 4). The v1 precedent (Safe-keyed CREATE3 + SystemAccount, `Kanban.md` Done line 71; `Decisions.md` 2026-06-11) is v1 and cannot be inherited (`Decisions.md` 2026-08-08). `Designs/efsv2/README.md` §Hard holds allows "Upgradeable prototype contracts" but says nothing about who holds the key.

**Consequence (inference):** every semantic iteration of the evolving contracts is a new `RealmId` with no in-protocol successor pointer; the client must own a Realm list; nobody owns the ceremony that mints it or the key that upgrades it.

**Queue:** none. V2-E5 (`Designs/efsv2/owner-decision-inbox.md` §V2-E5) asks for "a self-contained Realm descriptor for a fresh L3, EOA and ERC-1271 admission, historical implementation/authority basis, finality observation, upgrade semantics" — the descriptor, not the deployment ceremony or key custody. **Owner:** efsv2 (V2-E5) for the ceremony; `owner` for key custody. **MVP-blocking: yes.** Sources: R7a F14, R6 §7 item 2.

### U2 — How Type Schemas reach the dev Realm, and who ships the genesis Type set

**Assumed by:** `Designs/efsv2/hierarchical-files-and-folders.md` §3.1 line 369 ("The exact generic schema/blob and TypeSchemaId are a B0 freeze obligation"), §5.2 line 699 ("`BindingScope` must exist at Realm genesis"), §1.2 lines 121–123 ("No permanent Files Type bytes may be minted until V2-E1 closes"); `Designs/web-client-os/mvp-and-acceptance.md` §Operation sequence (create directory = `ObjectGenesis + ... DirectoryEntry + name-slot bind`) needs those Types to exist on the Realm the client opens.

**What exists:** `Designs/efsv2/core-architecture-candidate.md` §Type Schema says only that a Schema is "not identified by a registry transaction". `Designs/efsv2/layered-type-system-and-data-abi.md` says "Permissionless Type publication" without naming an operation (R2 §2.3 item 4). Stage A SR-17 (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md` lines 315–317, 350: intrinsic bootstrap meta-Type `TypeSchemaGroup/1`, "not a second Core primitive") is the only on-ramp — and "No Stage A proposal is adopted into `Designs/efsv2/`" (`Reviews/2026-08-13-efs2-stage-a-corpus/STATUS.md` line 46).

**Queue:** none. **Owner:** efsv2 (V2-E5 + Files). **MVP-blocking: yes** — a dev-Realm genesis manifest (Core profile + Files Types + `BindingScope` + route config) is needed before a single write. Sources: R2 F3, R3 F1, R7a §8 item 5.

### U3 — Byte carrier for "create file from local bytes", and who pays

**Assumed by:** `Designs/web-client-os/README.md` item 2 (basic file creation); `Designs/web-client-os/mvp-and-acceptance.md` §Content publication failure boundaries ("Admission succeeding while all carriers fail leaves a real FileRevision with `BYTES_UNAVAILABLE` ... That is an honest inspectable failure, not a passing file-create acceptance result") and §C ("verifies the committed bytes from a named carrier").

**What exists:** `mvp-and-acceptance.md` §Open questions: "Which exact byte carrier and retention receipt can support clean-browser file read-back without becoming correctness authority?" — open. No web-client-os doc names a carrier (grep for Arweave/pin/4844 across the set: zero, R8 §3.2). `Designs/efsv2/hierarchical-files-and-folders.md` §7 models bytes as `ChunkTree` + plural `Locator` claims and selects nothing. Stage A `chapters/b0-content-locators.md` makes state-tier custody an "optional venue module" (line 757) and says `CHUNK_SIZE_DEFAULT` "cannot reach state-tier custody" (line 767). The only owner direction is pre-greenfield: `Designs/efsv2/owner-rulings.md` §2026-07-10 Storage ("on-chain (durable) + Arweave (permanent off-chain) now ... on-chain > Arweave > grant-pinned IPFS > volunteer IPFS"), which the 2026-08-12 reset classes as mechanism-level. `Reviews/2026-08-24-ipfs-maintainership-transition.md` §Consequences: "A direct guest path cannot depend on a public utility" — ruling out the v1 default (public gateway → one-node pin). Who pays: `mvp-and-acceptance.md` line 196 names a `payerOrSponsor` role and §Content publication requires the plan to name "price, mutable Locator, and cleanup limitation" — but no payer profile, sponsorship path, or faucet exists in any current doc (grep: `sponsor|paymaster|faucet|gasless` in `mvp-and-acceptance.md` hits only the role field, line 196).

**Queue:** none. **Owner:** `owner` (product/permanence fork) with efsv2 costing and a web-client-os fixture. **MVP-blocking: yes.** Sources: R3 F6, R8 F5, R18 F9.

### U4 — The SDK v2 package boundary and repository

**Assumed by:** `Designs/web-client-os/mvp-and-acceptance.md` §Required write behavior ("Lazily load the selected wallet connector, identity/controller resolver, action planner, signer ceremony, submitter"; "A raw EOA may be normalized by the SDK into a zero-setup account Principal"); `Designs/web-client-os/ethereum-standards-and-interop.md` §SDK and EFS v2 pressure packet puts "Protocol SDK" as lowest owner on all seven rows; `Designs/web-client-os/architecture-and-modules.md` §Product and repository boundaries lines 1181–1195 (Protocol SDK / Shared Reader modules / Web Client / OS runtime SDK) and line 1178 "final repository placement should follow the EFS v2 SDK/repository design"; `Designs/efsv2/hierarchical-files-and-folders.md` line 2276 "sdk — canonical codec/resolver/view/citation/acquisition APIs".

**What exists on `main`:** nothing. Every root `Designs/sdk-*.md` is v1/EAS (`Designs/README.md` §Review banner: "not EFS 2.0 inputs by default"; `Designs/owner-decision-inbox.md` lines 85–86: "none of that settles the EFS 2.0 SDK"). The only EFS v2 SDK design — `Designs/sdkv2/` (11 files incl. `exp-c0-mvp-packet.md`, `owner-rulings.md`) — exists solely on remote branch `codex/sdkv2-pm` (`git ls-remote --heads origin` verified 2026-09-02: `codex/data-explorer-pm`, `codex/sdkv2-pm`, `codex/v2-readiness-week`, `lab/2026-08-26-fable-consumer-tournament`, `main`), with no PR, invisible to `Designs/README.md`, `Kanban.md`, `Open-Decisions.md`, and tri-sync. Four `main` docs cite it by permalink to commit `4d3e736` (`Designs/open-web-app-store/README.md` line 205, `architecture.md` line 7, `Designs/media-library/media-infrastructure.md` line 182, `Reviews/2026-08-22-web-client-os-eip-erc-screen/README.md` line 142). Three placements for the Files resolver, none chosen (R17 F15); the write seam (submit/receipt/read-back) is split three ways (R17 F12).

**Queue:** none. **Owner:** sdk + `owner` (merge/visibility decision). **MVP-blocking: yes.** Sources: R17 F1/F3/F12/F15, R10 F3, R8 F19, R9 F14, R11b F9, R12 F1.

### U5 — The repository container for the first EFS 2.0 code

**Assumed by:** every set assumes *some* repository will hold the disposable Stage B slice and the File Browser fixture. Four incompatible answers coexist: WCO-11 (`Designs/web-client-os/README.md` item 11: "rename legacy repos to `*-v1` and reclaim `contracts`, `sdk`, `webclient`, and `drive` ... No rename or repository creation is authorized in this pass"); `Designs/efsv2/hierarchical-files-and-folders.md` header line 5 "Proposed new repos: core, os, drive; contracts/client remain legacy evidence"; `docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` line 11–12 "Create a new sibling repository, provisionally named `core/`"; the PM's Stage A directive allowing "a disposable contracts worktree/branch" (R6 §7 item 2); and `Kanban.md` line 19 "Implementation repository is deliberately unchosen". `Designs/web-client-os/README.md` §Explicit non-authorizations forbids "a new `webclient`, `os`, `sdk`, `core`, or `drive` repository".

**Class:** the *end-state* names are (c) — decided by WCO-11 but recorded only in a draft README, not `Decisions.md`, and contradicted by the Files header (DRIFT, R1 F18, R3 F12). The *first* container — where disposable code goes this month — is (a). **Queue:** none. **Owner:** `owner` + vault-process. **MVP-blocking: yes.** Sources: R1 F18, R3 F12, R6 §7, R19 F8.

### U6 — Stage B release, owner, and program; who may start prototypes

**Assumed by:** `Designs/efsv2/README.md` §Build order step 2 ("Implement two disposable Core prototypes"); the Kanban Core card ("next: execute disposable Stage B ... no owner ask", `Kanban.md` line 43, expired 2026-08-16); `Designs/efsv2/owner-decision-inbox.md` banner ("The current work is to prototype and pressure-test the candidate"). The client set assumes the opposite: `Designs/web-client-os/README.md` §Current work sequence step 3 ("after explicit experiment authorization"), step 10 ("do not scaffold or begin product implementation without explicit authorization").

**What exists:** `Reviews/2026-08-13-efs2-stage-a-corpus/pm-stage-a-directive.md` "Stop after Stage A for review" — no PM release recorded anywhere (`Decisions.md` has no Stage A/B entry; R6 §7). Two competing Stage B programs: the 9-cell bakeoff (`chapters/bakeoff-spec.md`) and the superpowers monolith plan (`docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md`, which cites a "partial Stage B monolith [that] left only 4,707 runtime bytes" — line 15 — an artifact that exists in no repository, UNVERIFIABLE). The Stage B corpus also needs the B0-successor delta (BindingScope at genesis, Unicode pin, `RoutedAdmissionIntent`) before minting or every measured cell is invalidated (`chapters/bakeoff-spec.md` §6.2 "Any corpus change invalidates every previously measured cell").

**Queue:** none — and structurally cannot be: `scripts/open-decisions.sh` `classify()` (lines 59–72, verified) maps only "decide now / after evidence / at launch / already settled / delegated / superseded / answer in-route to"; an authorization has no bucket. **Owner:** PM + `owner`. **MVP-blocking: yes.** Sources: R6 §7, R19 F8.

### U7 — Complete directory enumeration primitive

**Assumed by:** `Designs/web-client-os/mvp-and-acceptance.md` §Invariants 4 ("A directory is `COMPLETE` only when the scope index existed from Realm genesis ... every unique Principal in the active mount-local `namespacePlan` reaches a terminal page") and §EFS v2 pressure matrix row "Complete directory listing — **Proposed dependency**"; `Designs/efsv2/hierarchical-files-and-folders.md` §5.2 `KIND_BINDING_SCOPE = 0x0a`, line 699 "`BindingScope` must exist at Realm genesis"; `Designs/open-web-app-store/architecture.md` lines 847–852 (finite catalog reconstruction rides the same primitive); `Designs/efsv2/system-constitution.md` §Honest reads lines 205–209 (complete, hard-bounded enumeration required).

**What exists:** `Designs/efsv2/README.md` §Focused Files proposal: "Complete listing and certified filesystem writes depend on the draft's generic `BindingScope` and executor/operation-bound consent experiments; neither is current B0." `Designs/efsv2/core-architecture-candidate.md` §Indexes offers "current Binding point reads with complete Realm-local absence at a basis" only; §Lens: "Wide directory enumeration ... remain OS/client work". Stage A is silent (zero hits for BindingScope in the corpus, gaps G-2..G-5 do not name it — R7b CF-1). `Designs/web-client-os/README.md` §Open questions asks whether "a smaller generic declared-index contract" suffices. `mvp-and-acceptance.md` §C allows the listing to "remain visibly qualified with the exact missing coverage while showing the separately proven point result" — i.e. a labelled-PARTIAL MVP is permitted — but no doc chooses it.

**Queue:** none. `Designs/efsv2/owner-decision-inbox.md` LP-2 only says "wide sorted enumeration must earn separate mechanism and budget". **Owner:** efsv2 (Files + Core jointly). **MVP-blocking: yes** for read-after-create listing; the labelled-PARTIAL path is available and undecided. Sources: R1 F3, R3 F2, R7b CF-1, R12 F6.

### U8 — The MVP Principal shape: single-key vs multi-controller

**Assumed by:** `Designs/web-client-os/README.md` item 7 ("A Principal may have a mutable default/main controller account ... `JamesCarnley.eth` may have three controller keys") and item 8 ("Multiple controller keys do not consume multiple Lens positions; key authorization belongs inside Principal verification"); `mvp-and-acceptance.md` §Identity and authority context ("For a managed Principal, the user may choose a local/private default controller account").

**What exists:** `Designs/efsv2/core-architecture-candidate.md` §Principal: MVP = `AccountPrincipal/1` from "an immutable authority reference"; "Later managed Principals may add ... multiple actors, delegation, rotation". Stage A `chapters/b0-principal-authority.md` §6.3: "an ungraduated `AccountPrincipal` has **no rotation**"; in B0 three keys are three `PrincipalId`s and three Lens entries (R7a F1, R7b CF-3); FX-LENS benchmarks 64 single-key Principals, never a multi-key one. `Designs/efsv2/owner-rulings.md` §2026-08-12 "Open, not ruled: whether every author-facing API uses `PrincipalId`"; V2-E1 (reconciled 2026-08-12) predates direction 7 and does not record it. `mvp-and-acceptance.md` §Deliberately deferred: "ERC-1271 claims until a fixed smart-account fixture passes; an EOA-only adapter must report `ERC1271_UNSUPPORTED`" — which makes the MVP EOA-only, i.e. one key = one Principal, silently.

**Queue:** V2-E1 carries the uniform-vs-tagged question; nothing carries "does the MVP need a managed Principal". **Owner:** `owner` via V2-E1. **MVP-blocking: yes** (scoping; if EOA-only is accepted, direction 7's example is a later slice and should be said). Sources: R1 F11, R4 F3, R7a F1, R7b CF-3, R8 F18.

### U11 — Which acceptance sections are MVP-required; the reference device

**Assumed by:** `Designs/web-client-os/mvp-and-acceptance.md` §Honest definition of done: "The MVP itself is done only when all required acceptance fixtures pass" — without naming which of A–J are required; only H, I, J carry "architecture fixture, not a requirement" labels while G lists ~20 Service-Worker/generation fixtures the same doc defers (§Deliberately deferred "Service Worker dependence"). Every time budget names "the reference mid-tier device", defined nowhere; the selection is an open question in three places (`README.md` §Open questions box 1; `product-constitution-and-roadmap.md` §Open questions; `mvp-and-acceptance.md` §Open questions box 6) with no owner.

**Queue:** none — `Designs/web-client-os/` has no `owner-decision-inbox.md` (folder listing verified: 11 design files only). **Owner:** web-client-os. **MVP-blocking: yes** for an honest "done"; the device fixture: no (defer numeric time budgets). Sources: R8 F10/F11, R11b F14, R9 F1.

### U12 — Whether the Arcade slice precedes, accompanies, or follows the File Browser

**Assumed by (contradictory):** `Designs/efsv2/owner-decision-inbox.md` V2-E6: "Build a clean-browser direct guest File Browser plus one verified Arcade view behind an adapter"; `Designs/efsv2/README.md` §Build order step 6: "build the narrow direct Web Client/File Browser + one-game Arcade slice behind an adapter"; `Designs/efsv2/system-constitution.md` §Open questions: "Does the first Web Client ship only read-only Files plus one Arcade view, or also explicit writes?" — versus `Designs/web-client-os/mvp-and-acceptance.md` §Deliberately deferred ("Arcade Play") and §F ("Guest bundles contain no wallet, package installer, full Shell, Arcade"), `app-runtime-and-direct-launch.md` lines 855–864 (Arcade fixture "only after separate disposable-experiment authorization"), `product-constitution-and-roadmap.md` line 247 ("Arcade detail/Play" is Near-term), and `Designs/arcade/README.md` §Current direction ("Client/OS placement and runner/network permissions remain open. The owner queue is held").

**What exists:** the Arcade recut the README calls "the highest-leverage next action" has not happened (last commit 2026-08-13; Kanban Backlog line 20 with no claim/expiry). `Owner-Inbox.md` FJ-4 (ETHOnline, "conservative September 3 cutoff" — the day after this review) defaults to "the one-game Arcade verified-artifact/fallback trace"; `ETHOnline-2026.md` §Follow-ups: "Freeze the actual demo acceptance trace before implementation; the one-game trace above is the default, not an adopted scope ruling." The evidence round found zero uniquely-EFS-specific benefits for the tested catalog (`Reviews/2026-08-13-claude-evidence-round/README.md` §Arcade falsification; `CORRECTIONS.md` scopes it as hypothesis challenge, not STOP).

**Queue:** Arcade D1–D7 HELD (`Open-Decisions.md`); V2-E6 text stale; FJ-4 lapsing. **Owner:** `owner` via V2-E6 with the web-client-os PM. **MVP-blocking:** no for the File Browser; **yes** for any Arcade slice. Sources: R14 F8, R8 F3, R1 F15, R18 F6, R19 F15.

### U13 — Sepolia data at testnet deprecation; "chains don't die" for Realms; "qualifying Realm"

**Assumed by:** `Designs/efsv2/owner-rulings.md` §2026-07-10 "ADOPTED (James): assume a blockchain persists indefinitely and stays queryable ... DROP ... chain-death machinery" — whose payoff ("home-chain-authoritative + home chain always queryable") depended on the home chain that 2026-08-12 removed ("does not ... revive a global home chain"). The current spine targets "a fresh qualifying L3" (`system-constitution.md` §Architecture-level acceptance tests row "Fresh qualifying L3"; line 38, 303, 353) with "qualifying" undefined in both spine docs (R1 F8, R18 F8). Sepolia is "neither a Core dependency nor a ruling for a permanent/canonical Commons venue" (WCO-10).

**What exists:** for v1 data, `Decisions.md` 2026-08-08 says it "is disposable and may be reseeded"; `Designs/efsv2/efs-v2-transition-plan.md` Phase 5 "Sepolia v1 disposition" is July and voided. For v2 dev data on Sepolia, **no document says anything**. `Designs/arcade/owner-decision-inbox.md` D7 (held) proposes "Sepolia is a long-lived testnet whose retirement is a named migration event the portable manifests are designed for" — a v1-era paragraph. The evidence round documents Goerli/Ropsten/Rinkeby/Kovan dead, Holesky frozen, Polygon zkEVM sunset (`Reviews/2026-08-13-claude-evidence-round/README.md` §Realm, venue, and L1 evidence) and leaves Sepolia's validator permissioning "unresolved" (`CORRECTIONS.md` line 27). Stage A proposed spine edit A2 ("Qualifying Realms and source availability", `UNAVAILABLE_SOURCE_BASIS`) is "a candidate owner decision" filed in `corpus/proposed-spine-edits.md` — not in any inbox; 0 of 16 spine edits applied (R6 §3).

**Queue:** none (D7 held; A2 unfiled; V2-E5/E7 texts predate the evidence). **Owner:** `owner` via V2-E5/E7. **MVP-blocking:** no for a dev MVP; **yes** for any permanence claim, including the Devcon demo (U14). Sources: R1 F5, R5 F3, R18 F7/F8, R19 F5, R20 F1.

### U14 — What the Devcon demo will be

**What exists:** `Devcon/README.md` (status 2026-08-11): proposal submitted ("Who Can Turn Off Your Ethereum App? A Full-Stack Walk-Away Test"), "using live EFS on Sepolia and its independently reproducible proof as the case study"; §After submission: "Preserve the boundary: v1 is live Sepolia evidence; v2 and the cypherpunk OS remain active design work unless their status changes before the talk"; "Never make conference Wi-Fi, a faucet, a fresh transaction, or one RPC the demo's single point of failure." `Milestones.md` §Devcon presentation: "Hard requirements — None locked. James will add them when the v2 research and implementation shape are concrete enough"; "talk delivery scope remains unlocked until acceptance"; decisions "expected by the end of September". The §Current inputs still names `Designs/clientv2/README.md` as "The Client v2 design set" (stale, R19 F12).

**Class:** (b) deliberately unlocked, owned by James, gated on speaker acceptance. The tension worth naming (inference): the submitted case study is the v1 Sepolia system that the 2026-08-08 ruling calls disposable and that `Kanban.md` line 62 stopped supporting; the "independently reproducible proof" rests on the 67 non-canonical hashes / one-node pin facts the brief marks UNVERIFIABLE; no v2 artifact will exist by November on the current sequencing (Stage B unrun, MVP unauthorized). **Queue:** none (Milestones is not a queue; no FJ item). **Owner:** `owner`. **MVP-blocking:** no.

### U15 — Who owns OS Drives / native mounts

**Assumed by:** `Designs/web-client-os/README.md` line 7 ("@os-drives-pm boundary review (2026-08-14)") and §Ownership boundaries row "Native mounts ... OS Drives owns native handles, host aliases, projection behavior, errors, metadata projection, daemons, packaging, and three-host validation"; `mvp-and-acceptance.md` lines 449, 853; `web-platform-standards-and-forward-profile.md` line 266; `Designs/media-library/plex-jellyfin-app.md` §Tentative technical shape needs "a local media agent/home server" the same lane would own (R13 F11).

**What exists:** no `Designs/*drive*` folder, no Kanban card, no agent-status entry, no `authority.md` scope (R3 F3, R8 F15, R17 F6). The projection design lives in `Designs/efsv2/hierarchical-files-and-folders.md` §10; the adopted 2026-07-22 ruling (`owner-rulings.md` §2026-07-22) makes three-host validation "a data-model gate" and V2-F2 names "mounted-filesystem traces" as a first-release gate (R17 F8). **Queue:** none. **Owner:** `owner`/vault-process. **MVP-blocking:** no (mounts deferred); the V2-F2 release gate: yes.

### U16 — Who owns Git/forge; GD-1…GD-5; the Markdown revision engine

**What exists:** no `Designs/git-forge/`; the Kanban card claimed 2026-08-14 expired 2026-08-17 with one commit and no artifact (`Kanban.md` lines 36–37); the owner packet GD-1…GD-5 from `Reviews/2026-08-07-efs-git-deep-dive.md` §6 appears in no live queue, no superseded list, and no hold record (grep: zero hits in both inboxes, `Open-Decisions.md`, `Owner-Inbox.md`; R16 F4). The corpus is written against the July kernel with no greenfield banner (R16 F1); Stage A silently chose *both* Git-native and `WikiPageRev/1` histories for the same bytes (R16 F3) while Files has `FileRevision/1` with merges. Neighbours delegate to a "Git/Forge PM" (`Designs/web-client-os/README.md` §Ownership boundaries; `Designs/open-web-app-store/README.md` line 122). **Queue:** none. **Owner:** `owner`/vault-process. **MVP-blocking:** no.

### U27 — Data Explorer: trusted base or first module

`Designs/web-client-os/architecture-and-modules.md` draws Data Explorer as a Layer-3 App (line 80), calls it "part of the MVP critical closure" (lines 305–308), `BootGeneration` (lines 632–633) does not list it, and "guest entry" doubles as the confined `guestEntry` mode needing an all-denied `GrantDecisionGeneration` (lines 334–336, 910). The answer decides whether any `ModuleDescriptor`/slot/grant machinery is on the MVP path. **Queue:** none. **Owner:** web-client-os. Source: R9 F13.

### U28 — Small unowned engineering constants on the MVP path

`UNICODE_PIN = 16.0` (Stage A `chapters/b0-encoding-and-ids.md` line 408) vs 17.0.0 (`hierarchical-files-and-folders.md` §2.1 lines 125–127) — two current proposals, no reconciliation (R7a F7). `originRef` byte layout for `CONTRACT_ERC1271` Principals marked both "dependsOn Lane 4" and "CLOSED" in different chapters (R7a F3). `ERC1271_VERIFY_GAS = MEASUREMENT_PENDING` makes the Authority Codex unmintable and therefore every `RealmId` uncomputable (`chapters/b0-principal-authority.md` §3.8 lines 879, 896–902; R7a F5) — trivially settled, unowned outside Stage B. **Owner:** efsv2. **MVP-blocking:** minor, except the gas constant, which blocks a conformant `RealmId`.

---

## 4. Class (b) — deliberately deferred with a named gate

### U17 — Type identity Variant A vs B (and arm C)

**Gate:** `Designs/efsv2/owner-rulings.md` §2026-08-12: "Whether canonical index declarations are inside semantic Type identity or in a separately identified profile is a 50-year bakeoff question, not ruled by this API direction"; `Designs/efsv2/system-constitution.md` §Open questions bullet 4; `core-architecture-candidate.md` §Type Schema ("this prose does not choose by accident"); V2-E4 / V2-E8 / V2-F1 in `Designs/efsv2/owner-decision-inbox.md` ("Awaiting evidence" per `Open-Decisions.md`).

**Why it is still on this ledger:** (i) three arms exist, not two — B0-A, Stage-A F4 "SPLIT-ID", and the layered Architecture C — with no document mapping F4↔C (R2 §3.1); (ii) the Files proposal the MVP builds on is B0-only while the README's "current Type-system proposal" is the layered arm (R2 F2); (iii) the client packet claims arm-neutrality but is written in C vocabulary (R10 F1); (iv) `Designs/web-client-os/README.md` item 12: "The latest owner response was not interpretable, so this set infers no choice" — **an owner answer exists and was lost, and no queue re-asks it** (R19 F16). **Owner:** efsv2 Stage B → `owner`; re-ask WCO-12 now. **MVP-blocking:** no for a disposable slice built on B0 as the control arm (R2's recommendation); **yes** for the client's own "MVP critical path" as written (`Designs/web-client-os/README.md` §Current work sequence step 3: "freeze only the symbolic inputs in [[type-data-abi-boundary-pressure]]" — which requires "a frozen-for-the-experiment B0 control and layered candidate descriptor/body vector closure from the Type lane", a deliverable no efsv2 doc names; R10 F2).

### U18 — Realm descriptor format

**Gate:** V2-E5 (`Designs/efsv2/owner-decision-inbox.md` §V2-E5); `core-architecture-candidate.md` §Open questions "Define the Realm descriptor and admission/finality observation split"; `system-constitution.md` §Open questions bullet 7. Stage A `chapters/b0-realm-admission.md` §2 proposes `RealmDescriptor/1` (unadopted). Residue inside the gate: the policy hook has no grammar, null spelling, or error codes (`initialPolicyCommitment` "MUST be nonzero" with no parameter set — R7a F4); `ERC1271_VERIFY_GAS` placeholder (U28). **Owner:** efsv2. **MVP-blocking:** the official MVP requires the guest route to parse "Realm descriptor and revision/code/admission basis" (`mvp-and-acceptance.md` §Required guest behavior) — yes; a disposable fixture may pin a labelled stub.

### U19 — Commons venue process

**Gate:** V2-E7 ("Do not select a chain yet. First turn the adopted cypherpunk/CROPS boundary into a measurable venue matrix"); `system-constitution.md` §Open questions "What is the first Commons candidate evaluation process? No venue choice is needed for Core or the direct Web Client"; `owner-rulings.md` §2026-08-12 "No Commons home chain is selected ... Core design and direct guest reads do not wait for this choice". The evidence round produced a matrix with disqualifiers D1–D8 (`Reviews/2026-08-13-claude-evidence-round/corpus/venue/commons-realm-venue-matrix.md` §5) that V2-E7's text (reconciled 2026-08-12) has not absorbed; no exit/notice threshold exists (`exit window`: zero hits in `Designs/`, R18 F2). **Owner:** efsv2 → `owner`. **MVP-blocking:** no, by ruling.

### U20 — Web Client and OS: one package or two

**Gate:** `owner-rulings.md` §2026-08-12 "Open, not ruled: ... whether the direct Web Client and EFS OS are one package or distinct products"; V2-E6 "how it is packaged relative to EFS OS". The product set has a working answer — "one layered, versioned module graph with several boot profiles, not ... two independently implemented products" (`Designs/web-client-os/README.md` §Current recommendation) and "one Web platform workspace with separately buildable entrypoints ... `apps/webclient/` ... `apps/os/` added only with an authorized OS slice" (`architecture-and-modules.md` §Greenfield repository, lines 1146–1157) — that has not been fed back to V2-E6. **Owner:** web-client-os → `owner` ratification. **MVP-blocking:** no (the MVP is the `webclient` entrypoint either way).

### U21 — `TypeSchema` vs `TypeRevision`

**Gate:** `core-architecture-candidate.md` §Open questions: "Decide the developer name (`TypeSchema`, `TypeDefinition`, or another term) after the Fable review; `TypeRevision` is not presumed." The Fable review (Stage A, 2026-08-13) ran; the name was not decided; three vocabularies and two `RecordId` preimages now coexist in current docs: `TypeSchema` (`README.md`, candidate), `TypeSchemaId` (`hierarchical-files-and-folders.md`), `TypeRevisionId` with `RecordId = H(DOM_RECORD, TypeRevisionId, H(canonicalBody))` (`layered-type-system-and-data-abi.md` line 380; `web-client-os/type-data-abi-boundary-pressure.md` `EfsTypeRevision`) versus `RecordId = H(domain, typeSchemaId, canonicalBody)` (candidate §Record). **Owner:** efsv2 (editorial; the SDK needs one name now). **MVP-blocking:** minor. Sources: R1 F4, R2 F1, R10 F10.

### U26 — Gas budget under EIP-8037

**Gate:** V2-E4. But the gate's text names no post-Glamsterdam schedule, `8037` has zero hits in `Designs/` and in the Stage A corpus, and every Stage A gas row assumes today's SSTORE schedule (R2 F5, R7a F2, R7b CF-10, R18 F1). Owner-ruled obligations ("full-body spine — PAY IT", `owner-rulings.md` §2026-07-15 item 17) are the exposed term. **Owner:** efsv2 Stage B. **MVP-blocking:** no on Sepolia; yes for the freeze path.

---

## 5. Class (c) — decided but unrecorded (and where docs still disagree)

### U9 — The MVP wallet stack

**Decided in substance by:** `Designs/web-client-os/mvp-and-acceptance.md` §Required write behavior ("sign the authored `PublicationEnvelope` and the Realm-bound `AdmissionIntent` separately because every Files operation selects Binding leaves"), §Deliberately deferred ("ERC-1271 claims until a fixed smart-account fixture passes; an EOA-only adapter must report `ERC1271_UNSUPPORTED`"), §C (EIP-6963 → EIP-1193; "EIP-5792 capability absence selects an explicit sequential fallback"); `ethereum-standards-and-interop.md` §Submission (EIP-5792 "Preferred supported-wallet adapter", EIP-7702 "Design for; disabled by default", ERC-4337 "Design for"); no sponsorship/relayer/paymaster/faucet path in any current doc (grep verified: `mvp-and-acceptance.md` hits only the `payerOrSponsor` role field).

**Not recorded anywhere as a decision:** `Designs/web-client-os/README.md` header: "no repository, runtime ABI, module profile, **wallet stack**, or product implementation is authorized"; WCOS-R14 says "connect a supported wallet" without defining supported. Nobody has written the sentence "the first official product is an injected-EOA, two-signatures-per-operation, self-funded-gas path", costed it against v1's measured bar (`Designs/sdk-minimal-clicks.md` line 16: "a single logical EFS write ... should cost the end user one wallet click"), or asked James whether a Sepolia-faucet-dependent EOA path is acceptable — the exact problem the v1 buildathon solved with a faucet PR and a burner session (`Decisions.md` 2026-06-23). **Owner:** web-client-os + sdk, `owner` sign-off. **MVP-blocking: yes.** Sources: R10 F6, R11b F3/F4, R3 F16, R7a F16, R4 F11.

### U10 — Files write authority: `AdmissionIntent` vs same-sender

**Decided by the candidate:** `mvp-and-acceptance.md` §Operation sequence: "an implicit 'same sender' B0 admission path is insufficient: the user must explicitly authorize both the authored publication and the Realm-bound admission/CAS effects"; Stage A SR-12 (`chapters/b0-overview.md` lines 341–345): implicit-sender intent "is legal only when the selected set contains none of the three kernel-effect Types". **Contested:** `Designs/efsv2/hierarchical-files-and-folders.md` §8.2 lines 1161–1167: B0 `AdmissionIntent/1` "is bearer authorization to Core. It does not name an executor ... No `/1` operation may be reported as `FILES_PRECONDITION_CERTIFIED`" → `RoutedAdmissionIntent/1` proposed (not B0); `ethereum-standards-and-interop.md` §Typed actions says a write profile that cannot name its consumer "is `UNSUPPORTED`" while `product-constitution-and-roadmap.md` Slice B and `type-data-abi-boundary-pressure.md` label the same state `EXPERIMENTAL_DIRECT_CORE` with `PLAN_READY` (R10 F18). The consequence — two wallet signatures per folder create — is stated in no chapter and costed nowhere (R7a F16, R11b F4). **Owner:** efsv2 (V2-E1/E3) + web-client-os. **MVP-blocking: yes** (ceremony shape).

### U22 — Sepolia-first as a ratified ruling

`Designs/efsv2/README.md` §Current status: "James has ratified the greenfield direction ... Sepolia is the first development Commons"; `Kanban.md` line 42 "James ratified ... Sepolia first for development". `Designs/efsv2/owner-rulings.md` contains no Sepolia entry (grep verified: zero hits); §2026-08-12 says only "No Commons home chain is selected". The sole owner-attributed source is WCO-10 in a draft README. UNVERIFIABLE whether said 2026-08-12 or 2026-08-14. **Owner:** vault-process. Sources: R1 F14, R8 F14, R19 F4.

### U23 — Directions 1–28 as rulings; no web-client-os queue

All 28 directions live only in `Designs/web-client-os/README.md` §Direct owner direction ("supplied directly by James from 2026-08-14 through 2026-08-23"), with no `— ruled by @james, date` marker, contrary to `Onboarding/authority.md` §Recording a ruling and James's own 2026-07-16 direction ("ALL owner decisions in ONE canonical place going forward", `owner-rulings.md` §2026-07-16 META). The folder has no `owner-decision-inbox.md`/`owner-rulings.md` (verified), so `scripts/open-decisions.sh` cannot see it. Directions 2, 7, 8, 9, 10 bind Core and contradict live efsv2 text (V2-E1 "not frozen until the comparison proves it"; V2-E6 "Then decide whether the first Web Client also needs writes"; `system-constitution.md` §Open questions last bullet; `README.md` §Build order step 6). The README's own "Upstream synchronization note (2026-08-14)" says "The EFS v2 PM has the exact reconciliation handoff" — no such handoff exists in the vault, and the constitution/candidate have no commit after 2026-08-13. **Owner:** vault-process + `owner`. Sources: R19 F2/F3, R8 F2, R10 F5, R11a F1.

### U24 — July outcome rulings never ledgered

`Designs/efsv2/large-file-uploads.md` §James rulings (2026-07-07): "Fully permissionless byte pool — RULED ... there is no protocol takedown"; "L2/L3-first, L1 for the exceptional"; `Designs/efsv2/efs-substrate-decision.md` §5 (2026-07-02): permanent archive, "everyone pays their own writes, no free tier"; `Decisions.md` 2026-07-25 pointer: "large on-chain files are first-class v2 (James overrode the PM's defer-bytes rec)", "chains render like drives", "the design thread ratifies these into owner-rulings" — `owner-rulings.md` begins 2026-07-10 and has no 2026-07-25 section. After the 2026-08-12 reset ("supersedes earlier mechanism-level rulings, not the problems they were solving") nobody can say which of these outcome-level rulings bind EFS 2.0. The "everyone pays / no free tier" half directly shapes U3 and U9. **Owner:** `owner` + vault-process. Sources: R3 F7, R5 F4, R19 F7.

### U25 — The 2026-07-22 support-matrix sequencing

`owner-rulings.md` §2026-07-22 Research sequencing: "reconcile the owner inbox, write the short constitution and explicit support matrix, and only then choose the MVP. The matrix should distinguish required, extension-ready, experimental, and explicitly unsupported behavior." Reaffirmed 2026-07-23. WCO-2 chose the MVP; the matrix was never written (grep: only the ruling, July `ethereum-first-efs-and-os.md`, and Stage A `proposed-spine-edits.md` C9 "fold into output 7 or retire — flag for PM"). No supersession note. This missing matrix is the artifact that would answer U11. **Owner:** `owner` + efsv2. Sources: R1 F2, R19 F1.

### U5 (end-state names) — see §3.

---

## 6. Why "Ask now: 0" is true and misleading

1. **No "authorize" bucket.** `scripts/open-decisions.sh` `classify()` (lines 59–72) recognises decide-now / after-evidence / at-launch / settled / delegated / superseded / mirror. Every active spine ends in "after explicit experiment authorization"; Stage B has been "unrun" since 2026-08-13 with the card expired; an authorization nobody asked for cannot appear on the page.
2. **The set with the newest owner directions has no queue.** `Designs/web-client-os/` has no inbox/rulings file; its eight README open questions, the lost WCO-12 answer, and the wallet-stack non-decision are invisible by construction.
3. **The held queues hide live dependencies.** Arcade D1–D7 carry dead deadlines (Aug 14, Aug 29) and the recut the hold promised never happened, while `Owner-Inbox.md` FJ-4 defaults to the Arcade slice with a Sept 3 cutoff. clientv2's "no July client/OS question is currently answerable" is false after WCO-19/26/17 (R11a §6, R19 F9).
4. **The evidence gates wait on work nobody owns.** V2-E1…E8 all say "after Stage B/prototype"; the Stage B owner expired 2026-08-16; nothing in Under Review or Blocked names the blocker.
5. **Two contradictory assumptions about who may start** — efsv2 inbox banner ("The current work is to prototype") vs web-client-os steps 3/10 ("after explicit experiment authorization") — with no reconciliation.

Sources: R19 §8, R6 §7.

---

## 7. The one packet that would unblock the write-capable File Browser

Proposal, not adoption. One "Decide now" item in `Designs/efsv2/owner-decision-inbox.md` (the only queue whose recording rule already covers Core, Files, and the Web Client), or failing that `Owner-Inbox.md` FJ-6:

1. **Authorize** a disposable Stage B slice (B0 only, Engine α, `SIZE_6` compile gate, run-once V2-E2 point benchmark) plus the exact-Type File Browser fixture (guest read + `New folder` / `New file` / `Publish revision`) as throwaway code, cut *after* the B0-successor delta (BindingScope at genesis, one Unicode pin, `RoutedAdmissionIntent` kind) so the frozen-corpus rule does not force a re-run. (U6)
2. **Name the container:** the repository (WCO-11 `contracts/sdk/webclient/drive` vs `core/os/drive` vs a disposable worktree) and record it in `Decisions.md`; the Realm (a local fresh L3 per V2-E5, or Sepolia per WCO-10); and who deploys/upgrades it under which key, with "each semantic iteration = new RealmId + client-owned Realm list" stated. (U1, U5)
3. **Pick B0 (Variant A) as the MVP control Type arm in writing**, label all Type bytes disposable, mint the dev-Realm genesis manifest (Core profile + Files Types + `BindingScope` + route config via SR-17), and route the arm choice to Stage B. **Re-ask WCO-12.** (U2, U17)
4. **Accept or reject the EOA-only two-signature ceremony** for the MVP, with its cost stated against the v1 one-click bar, and say whether a faucet-dependent EOA path is acceptable; if rejected, file a Core pressure packet for one-signature own-EOA Binding writes (SR-12 change). Report `ERC1271_UNSUPPORTED`; single-key Principal for the MVP; direction 7's multi-controller example deferred to the managed-Principal round. (U8, U9, U10)
5. **Name a carrier profile for small bytes** (e.g. on-chain state tier for ≤ one chunk + one funded independent pin + one archival locator, labelled), make the IPFS carrier-extinction trace a named MVP acceptance test, and say who pays. (U3, U24)
6. **Choose point-resolve + labelled-PARTIAL listing** as the MVP read-after-create contract, with `BindingScope` as the Stage B experiment, so the MVP does not silently depend on an unadopted index. (U7)
7. **Name which acceptance sections are MVP-required** (A–F) and move G–J to the OS docs. (U11)
8. **Record WCO-2/7/8/9/10 in `Designs/efsv2/owner-rulings.md`** with dates and the recorder's-wording caveat; update V2-E1/E2/E6 and the constitution's last open question; give web-client-os an inbox and a rulings file; add an `authority.md` scope row. (U22, U23)
9. **Keep Arcade as a Core/Web-Client fixture only** until the recut happens; do not let FJ-4 default it into a product slice. (U12)
10. **State the Devcon boundary explicitly:** the November case study is v1 Sepolia evidence unless a v2 disposable slice exists by then; no v2 permanence claim; Sepolia retirement wording owned by V2-E5/E7, not Arcade D7. (U13, U14)

---

## 8. Solid now / settle first / cut

**Solid enough to build a disposable slice on now** (consistent across the spine, Stage A, and the product sets): the 2026-08-08/08-12 rulings; Record ≠ Occurrence ≠ Admission ≠ Binding ≠ Lens; full-`bytes32 PrincipalId`; `UNKNOWN` never absence; the `EXPERIMENTAL_DIRECT_CORE / protocolConformance=false / filesPreconditionCertified=false` labelling discipline (`mvp-and-acceptance.md` §Operation sequence); the cold-browser guest journey and its eight invariants; the `ResourceOutcome`/`ByteOutcome`/`PlanOutcome` law; Stage A SR-1/SR-3/SR-12/SR-14/SR-16/SR-17 as a fixed comparison baseline; the Files object/name/revision shape over B0 primitives; the one-way `PackageHandoff` boundary.

**Settle first (in this order):** U6 (authorize and own Stage B); U5 + U1 (container, Realm, key); U17-as-control-arm + U2 (B0 pinned, genesis manifest); U9 + U10 + U8 (ceremony and Principal scope); U3 (carrier and payer); U7 (listing contract); U11 (required sections); U23/U22 (record the directions). Then, before any permanence claim: U13, U18's policy grammar, U26.

**Cut from the MVP** (already deferred by someone, listed so nobody re-imports them): the 9-cell bakeoff cells F2/F3/F5/F7/X17 from the MVP path; Views/QueryProfiles/`SEMANTIC_VIEW`; managed Principals/KEL/recovery; certified `FilesRouter` writes; Lens beyond a small Plan; three-host mount adapters (keep Phase 0 vectors); OS-preservation and Wasm/WIT fixtures in `mvp-and-acceptance.md` §H; the per-change guidance ledger/CI gate; Service-Worker generation fixtures in §G; the Arcade product slice; the Git wiki as a second revision engine; Media and App Store product lanes (both defer to V2-F2).

---

## 9. Unverifiable from here

- Whether "Sepolia first" was said on 2026-08-12 (omitted from the ruling) or 2026-08-14 (WCO-10); which of WCO-1…28 James said on which date; whether the "exact reconciliation handoff" exists in chat.
- What the "not interpretable" owner response on the Type/query axis actually said.
- The "partial Stage B monolith ... 4,707 runtime bytes" (`docs/superpowers/plans/2026-08-14-efs2-core-files-foundation.md` line 15) — no artifact in any repository.
- Whether `codex/sdkv2-pm` (head `57d04f8`, 2026-08-25) will be merged; the EXP-C0 Core lock it cites.
- Sepolia validator permissioning (`CORRECTIONS.md` line 27: unresolved); whether Sepolia has a published deprecation date.
- Whether James answered FJ-4 outside the vault before 2026-09-03.
- Devcon speaker acceptance (decisions expected end of September).

Verified directly this pass: `Designs/web-client-os/` has 11 design files and no inbox/rulings file; `scripts/open-decisions.sh` `classify()` bucket set; `owner-rulings.md` has zero Sepolia hits; `b0-realm-admission.md` lines 352 and 1422; `b0-overview.md` SR-17 lines 315–350; `hierarchical-files-and-folders.md` line 699; `CORRECTIONS.md` line 27; `ethereum-standards-and-interop.md` lines 254–259 (7702 "disabled by default"), no sponsorship path in `mvp-and-acceptance.md`; `git ls-remote --heads origin` branch list; `Devcon/README.md`, `Milestones.md` §Devcon, `ETHOnline-2026.md` §Follow-ups/Guardrails; `Decisions.md` 2026-08 entries; `Owner-Inbox.md` FJ-4/FJ-5.
