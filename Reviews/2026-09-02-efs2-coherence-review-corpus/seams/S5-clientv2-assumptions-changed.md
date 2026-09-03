# S5 — clientv2 assumptions the OS spine changed

**Lane:** S5-clientv2-assumptions-changed
**Reviewer:** seam hunter, 2026-09-03
**Verdict:** **strained** — the retirement itself is clean and well-argued; the *propagation* of it is not. Two live product sets and eight efsv2 docs still stand on assumptions the spine retired, and the record of the retirement lives only in one draft README's prose.
**Scope:** every current doc outside `Designs/clientv2/` that relies on a July client assumption the `Designs/web-client-os/README.md` audit table retired, revised or replaced.

---

## 0. What the OS spine actually retired

`Designs/web-client-os/README.md` §"Historical Client/OS audit" (lines 379–400) is the authoritative
disposition of the July `clientv2/` corpus. Twenty rows. The ones that *changed* an assumption:

| Row (README line) | Historical area | Disposition |
|---|---|---|
| 382 | One coherent Web-OS thesis for every entry | **Revise** → route-shaped boot profiles |
| 383 | `Bootstrapper -> Kernel -> System Chrome -> Shell -> Apps` | **Simplify and retain** → `BIOS -> Reader Kernel -> Minimal Viewer Shell` is the guest path |
| 386 | Fixed rings and one mandatory runner/cage set | **Retire as architecture** → trust classes + named runner lanes |
| 387 | July package/channel/catalog model | **Replace at the generic boundary** → App Store `PackageHandoff` |
| 389 | Nix/Guix closure/profile analogy | **Retain requirements, replace mechanisms** |
| 390 | `gx` link auto-boots another person's generation | **Retire** → inert Inspect, then explicit Try/Adopt/Fork/Activate |
| 391 | Full profile/private-store/package hydration before useful UI | **Retire** |
| 393 | Persona/wallet/action separation | **Revise** → uniform `PrincipalId` |
| 396 | Fragment grammar, handler grammar, exact package schema, surface schema | **Retire as inherited bytes** |
| 397 | Lit, Vite, Web Awesome, HTMX, import maps, native Signals | **Revise and separate by permanence** |
| 398 | `os/` repository and historical SDK split | **Retire as assumed topology** |
| 399 | Built-in Rescue Shell inside the browser origin | **Revise** → add out-of-origin rescue |

Rows 381, 384, 385, 388, 392, 394, 395, 400 are **Retain** and create no drift.

Underneath the table, `README.md:357-361` names the July set as "the deep source for capabilities,
secure ceremonies, offline journals, package generations, network privacy, accessibility,
internationalization, agents, threats, SDK boundaries, and exit." Two of those named sources —
**secure ceremonies** and **threats** — have no disposition row and no consuming document (see F4, F5).
So does the July Files feature bar (F3).

---

## 1. Who still relies on a retired assumption

### Live dependencies (the drift)

| Doc | Citation | Retired thing it relies on | Class |
|---|---|---|---|
| `Designs/media-library/README.md:5` | `**Depends on:** [[Designs/efsv2/README]], [[Designs/clientv2/README]]` (Last touched 2026-08-14, line 7) | the whole July client set, as a **dependency**, not evidence | DRIFT — F1 |
| `Designs/arcade/player-security-model.md:16` | "The clientv2 kernel's 'no iframe-hosted app logic' rule … routed to the v2 pressure report — **not decided here**" | row 386 (fixed rings / one cage set) | DRIFT — F2 |
| `Designs/arcade/v2-pressure-and-migration.md:40, 65` | "The clientv2 kernel forbids iframe-hosted app logic (Ring-3 = SES worker…)" stated as current | row 386 | DRIFT — F2 |
| `Designs/arcade/v2-pressure-and-migration.md:63` | §2c routes the ruling ask "+ the clientv2 owner inbox" | a **HELD** inbox (`Open-Decisions.md:21`) | DRIFT — F2 |
| `Designs/efsv2/playable-archive-requirements.md:5` | `**Depends on:** … [[../clientv2/packages-and-updates]], [[../clientv2/kernel-capability-model]], [[../clientv2/shell-and-sessions]], [[../clientv2/persistence-and-sync]]` | rows 386, 387, 384/399 | DRIFT — F7 |
| `Designs/efsv2/playable-archive-requirements.md:168, 270` | "The current client v2 kernel forbids iframe-hosted app logic, so v2 must either approve this isolated compatibility lane explicitly or defer" | row 386 | DRIFT — F2/F7 |
| `Designs/efsv2/mountable-filesystem-semantics.md:5` | `**Depends on:** … [persistence and sync](../clientv2/persistence-and-sync.md)` | row 392 (mechanisms deferred) — and this doc carries an *adopted* outcome (`efsv2/README.md:102`) | DRIFT — F14 |
| `Designs/efsv2/solana.md:5` | `**Depends on:** … [SDK boundaries](../clientv2/sdk-boundaries.md)` | row 398 | DRIFT — F14 |
| `Designs/efsv2/lens-spec.md:92`, `lens-pass-synthesis.md:60, 82` | assign a **CLIENT** obligation to amend `../clientv2/boot-and-profiles` for link grammar / fragment placement / `pr`/`gx`/`gf`/`a`/`sy`/`k` classes under GL-9 | rows 390, 396 | MISSING — F15 |
| `Designs/efsv2/{codex-kernel:58, read-lens-spec:559, freeze-gates:73, identity:40, apps-cookbook:45, ops-doctrine:38, large-file-uploads:93, efs-substrate-decision:70}` | eight unchecked `- [ ] **Client-OS pressure (2026-07-07):**` TODO boxes | P1–P13 asks from a July round with no current owner | MISSING — F7 |
| `Milestones.md:33-35` | "The Client v2 design set is `Designs/clientv2/README.md`" — file refreshed 2026-09-02 | the whole set, presented as current | DRIFT — F9 |
| `Kanban.md:51-52` (Under Review, "no expiry") | "Awaiting review of the `#status/draft` requirements doc" — `file-browser-requirements` in `Designs/clientv2/` | the File Browser feature bar, parked in a retired folder | MISSING — F3 |
| `Designs/owner-decision-inbox.md:11-14` | routes design decisions to efsv2 / clientv2 / arcade / app-store | names the **held** clientv2 queue; omits `web-client-os` entirely | MISSING — F8 |

### Harmless historical citations (correctly framed — no finding)

- `Designs/open-web-app-store/README.md:95-103` — filed under "**Historical inputs retained as evidence**", and it names what does *not* survive: "Its DATA/PIN/TAG/LIST, registry, channel, identity, and quorum mechanics are not current"; "The July claims that 'lenses are channels' and zero-grant execution is 'always safe' do not survive as current architecture." **This is the model every other set should copy.**
- `Designs/media-library/plex-jellyfin-app.md:421-432` — cites `clientv2/persistence-and-sync` and `clientv2/file-browser-requirements` under "Evidence reused", then states: "Client-v2 documents are historical evidence under the current direct Web Client/optional OS reset; their databases and implementation choices are not selected by this design." Correct. (Which makes the set's own README header, F1, the odd one out.)
- `Designs/web-client-os/{system-profiles-and-generations:6, privacy-and-agents:7, app-runtime-and-direct-launch:6}` — all label clientv2 docs `**Inputs:** … (historical evidence)`.
- `Designs/efsv2/human-overview.md:6` — cites the client v2 set as a technical source; `efsv2/README.md:98` files this doc as "Historical synthesis until rewritten from the new constitution". Consistent.
- `Reviews/2026-07-*` and `Reviews/2026-08-07-*` corpora — dated research; no finding.

### Clean retirements (verified, no live dependency anywhere)

- **`#efs1.` fragment grammar** — zero occurrences outside `Designs/clientv2/`.
- **`gx` link auto-boot** — `web-client-os/system-profiles-and-generations.md:1411-1420` *explicitly* supersedes it and states the replacement sequence `Open -> Inspect -> {Try | Adopt | Fork | Plan Activate}`. Exemplary.
- **`@efs/os-sdk`** — zero occurrences outside `Designs/clientv2/`.
- **Rescue Shell** — appears only in the audit row itself (`README.md:399`); `technology-foundation.md` carries the replacement (in-origin last-known-good + `Independent rescue` profile, line 610).
- **System Chrome** — retained, and *re-defined* in the current spine at `architecture-and-modules.md:275-288` ("System Chrome is conserved authority UI, not general desktop layout"). Not drift; but see F11 for one rule that names it and lives nowhere.

---

## 2. Findings

### F1 — media-library declares the retired set a live dependency and never names the active spine
**DRIFT · blocking · MVP-relevant · owner: media-library**

`Designs/media-library/README.md:5` reads `**Depends on:** [[Designs/efsv2/README]], [[Designs/clientv2/README]]`,
last touched 2026-08-14 (line 7). `Designs/clientv2/README.md:8-17` says of itself: "this set is evidence,
not one automatically adopted client architecture … The active product architecture and requirements now
live in `[[../web-client-os/README]]`."

`web-client-os` appears **zero times** in the entire `Designs/media-library/` folder. Yet the set's proposed
build order (`README.md:202-204`) opens with "**Booru Slice 1:** read-only guest gallery … safety-before-fetch
and a disposable search provider" — which is precisely the `GuestRead` boot profile the spine owns
(`web-client-os/README.md:201-206`). And `web-client-os/README.md:570` makes "App Store, Files/Core, Drives,
Arcade, **Media**, Git/Forge, EAP, and Nanda owners have reviewed their boundary slices" a pre-promotion
checkbox — unchecked, and from the media side there is nothing to review against.

The correct pattern already exists on an unmerged branch:
`data-explorer:Designs/data-explorer/README.md:5-6` reads
`**Depends on:** … [[Designs/web-client-os/README]] …` / `**Inputs:** [[Designs/clientv2/README]]`.

**Fix:** swap the header to depend on `Designs/web-client-os/README` and demote clientv2 to `**Inputs:**`
(the set's own `plex-jellyfin-app.md:430-432` already knows the rule); then run the Media↔Web-Client boundary
review both sets ask for.

---

### F2 — the Arcade's blocking runner question routes to three dead targets, and the spine already answered it
**DRIFT · important · owner: arcade + web-client-os**

`Designs/arcade/player-security-model.md:16`: "**This is a deliberately isolated v1 compatibility runner —
NOT a v2 Ring-3 app** … The clientv2 kernel's 'no iframe-hosted app logic' rule and whether v2 approves a
legacy-direct lane are routed to the v2 pressure report ([client-os-pressure-report]) — **not decided here**."

The same premise is asserted as current in `arcade/v2-pressure-and-migration.md:40` ("The clientv2 kernel
forbids iframe-hosted app logic (Ring-3 = SES worker; iframes = render service for untrusted *documents*
only)") and `:65`, and restated in `efsv2/playable-archive-requirements.md:168` and its open question at `:270`.

All three routing targets are dead or held:
- `Designs/efsv2/client-os-pressure-report.md` — `**Last touched:** 2026-07-07`, `**Reviewers:** —`, and absent
  from the efsv2 evidence map (`efsv2/README.md:93-111`);
- `clientv2/kernel-capability-model` — historical evidence by `clientv2/README.md:8-17`;
- the clientv2 owner inbox (`v2-pressure-and-migration.md:63` §2c) — **HELD** (`Open-Decisions.md:21`).

Meanwhile the spine answered it. `web-client-os/README.md:386` retires "Fixed rings and one mandatory
runner/cage set" **as architecture**, and `app-runtime-and-direct-launch.md:29-30` names lane 3 of 5:
"an opaque-origin iframe lane for Apps that need their own full DOM and Web runtime", with the residual
stated honestly at `:932` ("**Full-Web residual:** a malicious opaque iframe probes network…").

So the Arcade is holding a decision that the current owner already made in its favour, and its escalation
path terminates in a held inbox. This is not a contradiction of substance — arcade's own container analysis
(`player-security-model.md:16`, §3) reaches the same place — it is a routing failure that keeps a demo-scope
security posture labelled "undecided" while the architecture that would license it exists.

**Fix:** `web-client-os` states the disposition of the "no iframe-hosted app logic" rule explicitly (retired
with row 386; replaced by the iframe lane and its named residuals). `arcade` re-points
`player-security-model.md:16` and `v2-pressure-and-migration.md` §2c at `app-runtime-and-direct-launch`, and
`efsv2` closes or re-homes `playable-archive-requirements.md:270`.

---

### F3 — the File Browser MVP was specified without the vault's only File Browser requirements document
**MISSING · blocking · MVP-relevant · owner: web-client-os**

Owner direction 2 (`web-client-os/README.md:44-47`): "The first MVP must be an official write-capable File
Browser." The set that defines it — `mvp-and-acceptance.md` and `product-constitution-and-roadmap.md` —
contains **zero** references to `clientv2`, to ArDrive, or to `file-browser-requirements` (verified by grep).
The audit table (README:381-400) has no disposition row for it either.

`Designs/clientv2/file-browser-requirements.md` (166 lines, `Last touched 2026-07-29`) is the ArDrive-teardown
feature bar: MATCH/DIFFER/SKIP buckets, the first drawing of lenses-in-a-file-UI (J9), mount-compatibility
constraints (J10), and **19 measurable acceptance tests**. It is still sitting in `Kanban.md:51-52` under
**Under Review**, "Awaiting review of the `#status/draft` requirements doc … no expiry".

Concrete, MVP-shaped material that the current acceptance set does not carry:
- **A2 completion receipt** — "Silent partial ingest is the single worst archival failure; it must be
  structurally impossible to mistake for success" (enumerated report, per-item digest, retry-all).
- **A14 audience disclosure at every write commit** + a first-publish acknowledged interstitial — "A first-run
  user must be structurally unable to publish a tax return believing it private."
- **A11 pre-commit disclosure** — "every size ceiling and fee … traces to an in-product disclosure shown
  *before* the action bound by it (no source-code-only limits, no embedded fees)".
- **Test 1** (clean browser → first published file < 5 min, $0, no token purchase), **test 3** (stranger's link,
  zero login prompts, dead link renders a named error), **test 8** (two viewers, two truths + one-click
  "why this file", "neither sees the other's winner rendered as absence").

This is a *consumption* gap, not a contradiction: `WCOS-R17` (`product-constitution-and-roadmap.md:161`) and
`mvp-and-acceptance.md:71` already require previewing "public permanence" per action. But the spine's
acceptance fixtures A–J were written without reading the one document that says what a drive product must do
to be credible.

**Fix:** add an audit row for `file-browser-requirements` with an explicit disposition; fold the surviving
MATCH/DIFFER items and acceptance tests into `mvp-and-acceptance.md` §Scope floor / §Acceptance fixtures;
close the Kanban card.

---

### F4 — the secure signing ceremony spec and the prompt budget have no home in the current spine
**MISSING · blocking · MVP-relevant · owner: web-client-os**

`clientv2/README.md:40` assigns `shell-and-sessions` "the full secure-ceremony spec (R0–R3 risk routing),
prompt budget, first-run truth orientation". The spec is real and specific:
- `shell-and-sessions.md:158-161` — **R0 quiet** / **R1 picker** / **R2 ceremony** (the eight checkpoints,
  Chrome modal, interaction-gated) / **R3 external** ("Primary-author signatures; spends ≥ user limit …
  Wallet clear-signing (ERC-7730) or passkey step-up; Shell-only confirm **disallowed**");
- `:143` — interaction gating: no default-focused accept, confirm disabled 500 ms (R2) / 3 s (R3-preview),
  `InputEventActivationProtector`, long diffs require scroll-to-end;
- `:144` — the Chrome mark, framed as a negative indicator only;
- `:163` — "Prompt budget doctrine" (the UAC-fatigue lesson from
  `Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md:49`: "a correct secure surface is undone by
  prompting too often").

The spine keeps the **requirement** — `README.md:384` "Security ceremonies stay conserved"; `WCOS-R17`
(:161) "Before signing, the client shows exact Realm, roles, Records, IDs/digests … permanence/privacy
effects … fees, and failure risks"; `WCOS-R25` (:173) "high-risk confirmation uses a recognizably isolated
browser/wallet/native/external surface" — and re-homes System Chrome at
`architecture-and-modules.md:275-288`. But **"prompt budget" appears zero times in `Designs/web-client-os/`**,
and no document there specifies risk classes, thresholds, or interaction gating.

This bites the MVP immediately. `mvp-and-acceptance.md:207-225` sequences a single file create as
`… -> trusted human or delegated-agent review -> sign PublicationEnvelope -> sign Realm-bound AdmissionIntent
-> submit publish()` — up to three authorizations plus a connect, per file. Nothing budgets, classes, or gates
them, and `:263-268` requires the plan to name "each carrier contacted, disclosed data, retention claim,
price, mutable Locator, and cleanup limitation" on top. Ceremony fatigue is the predictable outcome, and the
July round already wrote the countermeasure.

**Fix:** port R0–R3 and the prompt budget into the spine — either a new `web-client-os/ceremonies-and-authorization.md`
or a section under `architecture-and-modules` §Layer 1.5 — mapped onto the three MVP write operations.

---

### F5 — first-run truth orientation was dropped without a decision
**MISSING · important · MVP-relevant · owner: web-client-os**

`clientv2/shell-and-sessions.md:178-186` specifies three first-run screens then teach-at-the-checkpoint:
**Permanent ink** ("EFS writes are permanent … 'Delete' here means unlist", acknowledge to continue),
**Whose word counts** (lenses), **Your mark** (Chrome mark setup) — plus deferred inline cards including
"**permanence re-affirmation** inside the first Publish ceremony (typed confirmation of the word 'publish')".

`Designs/web-client-os/` contains **zero** occurrences of "first-run"/"first run", and the requirement ledger
(`product-constitution-and-roadmap.md:134-197`, WCOS-R1…R39) has no first-run row. The MVP is public-by-default
permanent writes performed by a first-time user; `mvp-and-acceptance.md:71` requires previewing "public
permanence" per action, which is a different control from a one-time acknowledged orientation.

This is not WRONG — the spine may deliberately cut it — but no document records a cut, so it reads as an
oversight rather than a choice.

**Fix:** add a WCOS-R row for first-run orientation, or record it as an explicit `CUT` in the audit table with
the residual named.

---

### F6 — `os-pass-handoff.md` is a contract addressed to an OS pass that never read it
**MISSING · important · owner: efsv2 (re-file) + web-client-os (accept or decline)**

`Designs/efsv2/os-pass-handoff.md:11`: "This is the contract the next OS pass designs against: what the FS
layer now guarantees, what it never will, and what the OS pass must adjudicate next." Its §"What you must
adjudicate next" assigns ten items to the OS pass: the pending/confirmed/final taxonomy; **the lens-object
encoding** ("you are its biggest consumer — co-own it with the SDK"); GATE consumption of folds/snapshots;
S0–S3 risk classes composed with `act` dual-attribution in preflights; Trash/undelete surfaces with the
"deletions are public history" disclosure; conflict-copy UX for `EQUIVOCAL` and self-concurrent multi-device
merges; private-by-default onboarding (born-shreddable files); the device-enrollment ceremony; snapshot/restore
over the basis/manifest tri-split; and the venue-selection doctrine.

Grep of `Designs/web-client-os/`: zero hits for `os-pass-handoff`, "pending/confirmed/final", "conflict-copy",
"device enrollment", "Trash"/"undelete", "shreddable", "lens-object", "venue-selection", "S0–S3".
`EQUIVOCAL` appears only as a profile-resolution status (`app-runtime-and-direct-launch.md:157`), never as a
Files conflict case. The handoff is also absent from the efsv2 evidence map (`efsv2/README.md:93-111`), so it
is neither current nor filed as evidence.

One of the ten is independently covered and *better*: `WCOS-R19` (`product-constitution-and-roadmap.md:162`)
defines a richer ladder — "Planned, authorized, signed, queued, submitted, admitted, finality-pending,
finalized, reverted, rejected, and `UNKNOWN`". That makes the point sharper, not softer: the spine
re-derived one item independently and left nine unclaimed.

Caveat: `os-pass-handoff` is a July FS-pass artifact and several of its guarantees (`admittedAt`,
`submitSubset`, the salted family) sit on July mechanisms the greenfield ruling reopened. The right move is
**disposition**, not blind adoption.

**Fix:** `efsv2` files or retires the handoff with an explicit note on which asks are dead under the greenfield
ruling; `web-client-os` accepts or declines each of the remaining nine, in writing.

---

### F7 — two efsv2 July docs are load-bearing for a neighbour but appear in no current index
**MISSING · important · owner: efsv2**

`Designs/efsv2/client-os-pressure-report.md` (`Last touched 2026-07-07`, `Reviewers: —`) and
`Designs/efsv2/playable-archive-requirements.md` (`Last touched 2026-07-23`, `Reviewers: -`) appear neither in
the efsv2 README's current-document list nor in its evidence map (`efsv2/README.md:93-111`). They are orphans.

Yet `arcade/player-security-model.md:16` routes a live undecided security question to the first, and
`arcade/README.md:54` plus `v2-pressure-and-migration.md:40,65` treat PAF-5 in the second as binding.
`playable-archive-requirements.md:5` in turn lists four *retired* clientv2 docs as `**Depends on:**`.

Downstream, eight efsv2 documents still carry unchecked owner-less TODO boxes labelled
`- [ ] **Client-OS pressure (2026-07-07):**` — `codex-kernel.md:58`, `read-lens-spec.md:559`,
`freeze-gates.md:73`, `identity.md:40`, `apps-cookbook.md:45`, `ops-doctrine.md:38`,
`large-file-uploads.md:93`, `efs-substrate-decision.md:70`. Most of the underlying asks were in fact
adjudicated (`os-pass-handoff.md` §"P1–P13 adjudications"), so the boxes are stale as well as unowned.

**Fix:** file both documents in the evidence map with a one-line disposition, note that P1–P13 were adjudicated
in `os-pass-handoff`, and either tick or delete the eight stale boxes.

---

### F8 — the active spine has no owner queue, and 28 owner directions are in no ledger
**MISSING · blocking · owner: vault-process + owner**

`Designs/web-client-os/` has **no `owner-decision-inbox.md` and no `owner-rulings.md`**.
`Open-Decisions.md:78-85` ("Queue health") lists `arcade`, `clientv2`, `efsv2`, `media-library`,
`open-web-app-store`, `Designs (root)` — no `web-client-os`. `Designs/owner-decision-inbox.md:11-14`
routes design decisions to four sub-queues (efsv2, **clientv2**, arcade, app-store), omitting both
`web-client-os` and `media-library`.

`Designs/efsv2/owner-rulings.md` ends at 2026-08-12. The newest entry in `Decisions.md` is 2026-08-13.
The 28 owner directions dated **2026-08-14 → 2026-08-23** — the directions that actually retired the July
assumptions — exist only as prose in a `#status/draft` product README (`web-client-os/README.md:37-171`).
This is unchanged on the readiness branch: `diff Designs/efsv2/owner-rulings.md
readiness:Designs/efsv2/owner-rulings.md` is empty.

This is the *mechanical cause* of F1, F2 and F9. A neighbouring PM asking "is this July assumption still live?"
has no ledger to consult; the only answer is a table buried at line 379 of a draft README in a set their own
README does not link. `Open-Decisions.md` is generated from `owner-decision-inbox.md` files, so a set without
one is structurally invisible to the vault's own "what needs deciding" view.

**Fix:** create `Designs/web-client-os/owner-decision-inbox.md` (even at zero live items, so the queue exists
and the generator sees it); record directions 1–28 in a ruling ledger — `Designs/web-client-os/owner-rulings.md`
per the "one queue owns each item" rule; add `web-client-os` and `media-library` to
`Designs/owner-decision-inbox.md`'s routing list.

---

### F9 — `Milestones.md`, refreshed 2026-09-02, still calls the retired set "The Client v2 design set"
**DRIFT · important · owner: vault-process**

`Milestones.md:33-35`: "The Client v2 design set is `[[Designs/clientv2/README]]`. Its exact app lane,
rendering ABI, and implementation target remain evidence-gated." `web-client-os` appears nowhere in the file.
The document is current — `:16-17` records "talk accepted and participation confirmed 2026-09-02".

`Designs/README.md:63` gets it right ("Active product-layer spine … The July `clientv2/` set is historical
evidence"), so the vault contradicts itself about which document is the client design, in the one file a
reader consults for project orientation before a Devcon presentation.

**Fix:** point `Milestones.md` at `Designs/web-client-os/README` and describe clientv2 as retained evidence.

---

### F10 — the clientv2 hold is stale in framing; four of its five questions were answered by direction, not evidence
**UNDECIDED · important · owner: owner + vault-process (+ web-client-os to re-home OS1)**

`Designs/clientv2/owner-decision-inbox.md` holds on this condition: "recut only after direct guest
Files/Arcade and Core-reader evidence creates a real product fork", and instructs: "Do not revive N2,
OS1/OS2, E7/E8, L1–L7, or CL1/CL2 in the meantime."

Against the 2026-08-14 → 08-23 directions:

| Held question | Status | Evidence |
|---|---|---|
| **N2** — Client v2 as one Web OS ("Revalidate its least-authority, rollback, truthful-grade, and no-ambient-authority outcomes against the new split") | **Answered** — that revalidation *is* the audit table | direction 3 (`web-client-os/README.md:48-51`); audit rows `:382-383`; least-authority/rollback retained at `:385, :388` |
| **OS2** — Agent foundations | **Answered at direction level** | direction 6 (`:58`); row `:394`; `privacy-and-agents.md` |
| **E7/E8** — Browser lanes and rendering | **Architecture answered**; measurement still gated | direction 26 (`:150-155`); row `:386`; `app-runtime-and-direct-launch.md:21-33` |
| **L1–L7 / CL1-CL2** — update trust, endpoint defaults, name, translation scope | **Partially answered** | direction 19 (`:107-124`, opt-in upgrades); direction 10 (`:75-77`, Sepolia); direction 17 (`:100-103`, i18n foundational). Product name and sovereign-endpoint tooling remain open |
| **OS1** — Mainstream authorship onboarding ("Exact onboarding waits for the Principal/account and Web Client write slices") | **Precondition now met — question is live and unowned** | direction 7 (`:61-69`, uniform `PrincipalId`); `mvp-and-acceptance.md:180-205` is the write slice |

So the hold's *conclusion* is still right (ask James nothing) but its *framing* is inverted: it is now
suppressing the one question that became live, while forbidding revival of four that the spine already
revived and answered on owner direction rather than on the evidence the hold demanded. Nothing anywhere in
the vault specifies key custody, backup or recovery for the first write-capable user — and
`clientv2/file-browser-requirements.md` A15 states the constraint plainly: "v1 must not ship any credential
whose loss unrecoverably destroys access … and a recovery path for the primary credential must exist."

**Fix:** close the clientv2 hold as **superseded by the `web-client-os` audit table** (not "answered"), and
re-home OS1 — onboarding, key custody, backup and recovery for the write-capable File Browser — into the new
`web-client-os` owner queue from F8. Classification is UNDECIDED, not WRONG: no set has claimed onboarding
and no owner has been asked.

---

### F11 — the AV-19 downgrade-install defence names a surface, and neither owning set carries it
**MISSING · important · owner: web-client-os + open-web-app-store**

`Designs/efsv2/lens-read-gotchas.md:38` states the attack and the rule: "a hostile page shows you an *old,
vulnerable* version, you click install, and the bouncer says yes … The rule: the install ceremony
**re-derives the real current release under the GATE's own rules, in System Chrome, discarding the page's
ordering** (AV-19)." `lens-spec.md:47` repeats it as rule 6 of the current lens routing entry point.

`Designs/open-web-app-store/` — which owns install per `web-client-os/README.md:412` — has zero hits for
"install ceremony", "System Chrome", "downgrade", or "current release". `Designs/web-client-os/` — which owns
System Chrome — has zero hits for AV-19 or install-time downgrade. `WCOS-R24`/`R25`
(`product-constitution-and-roadmap.md:172-173`) cover launch nomination and conserved authority, but not
release-currency re-derivation at install.

A named attack with a named defence, stated in an efsv2 spec, consumed by neither of the two sets that would
implement it.

**Fix:** `web-client-os` adds the re-derivation obligation to the System Chrome install ceremony;
`open-web-app-store` records the GATE re-derivation rule in its update/trust section.

---

### F12 — the clientv2 README miscounts the pressure clusters (twelve vs thirteen)
**DEFECT · minor · owner: clientv2**

`Designs/clientv2/README.md:59` — "The **twelve** pressure clusters on the protocol set; P1/P2/P4c/P11 are
freeze-window-relevant". `Designs/efsv2/client-os-pressure-report.md` carries thirteen (`## P1.` … `## P13.`),
and `Designs/efsv2/os-pass-handoff.md:11` confirms: "The FS pass adjudicated the OS pressure report (**P1–P13**)".
P13 ("Timestamp-free ID: the application-layer footguns nobody wrote down") is the one dropped from the count,
and it is exactly the cluster that generated live obligations in `read-lens-spec.md:559`,
`apps-cookbook.md:45`, and the P13 social-app blessed pattern in `os-pass-handoff`.

Low stakes, but this is the line a reader uses to check whether coverage is complete.

---

### F13 — "Ring 3" is now a live homonym with one retired sense
**DEFECT · minor · owner: web-client-os (declare retired) + arcade (stop using it)**

Sense A — the SES-worker app cage: `arcade/player-security-model.md:16` ("NOT a v2 Ring-3 app"),
`arcade/v2-pressure-and-migration.md:40` ("Ring-3 = SES worker"),
`efsv2/playable-archive-requirements.md:168`. Retired as architecture by `web-client-os/README.md:386`.
Sense B — a standards layer: `Designs/efsv2/ethereum-first-efs-and-os.md:275` "### Ring 3 — OS and adapter
standards", entirely unrelated and not retired.

One retired meaning is still used by live product docs to justify a security posture; the other is live.
Any reader grepping "Ring 3" gets both.

---

### F14 — two efsv2 docs list retired clientv2 docs under `Depends on:`, one of them carrying an adopted outcome
**DRIFT · minor · owner: efsv2**

`Designs/efsv2/mountable-filesystem-semantics.md:5` — `**Depends on:** … [persistence and sync](../clientv2/persistence-and-sync.md)`.
This matters more than the usual stale link because `efsv2/README.md:102` files that document as the
"**Adopted** three-host read-only outcome and projection acceptance gates" — an adopted product outcome
resting on a set the audit disposes as "Retain, defer mechanisms" (`web-client-os/README.md:392`).

Same shape, lower stakes: `Designs/efsv2/solana.md:5` — `**Depends on:** … [SDK boundaries](../clientv2/sdk-boundaries.md)`,
retired as assumed topology at `web-client-os/README.md:398`.

**Fix:** demote both to `**Evidence:**` and, for the mount doc, name the current owner of the persistence
requirements (`web-client-os/technology-foundation.md` storage/recovery sections).

---

### F15 — the lens pass left a CLIENT amendment obligation on a retired document
**MISSING · minor · owner: web-client-os (accept/decline) + efsv2 (re-point)**

`Designs/efsv2/lens-pass-synthesis.md:82`: "**CLIENT:** amend [boot-and-profiles](../clientv2/boot-and-profiles.md)
(link grammar + fragment placement); attack the OS link classes (`pr`/`gx`/`gf`/`a`/`sy`/`k`) under 'a hostile
link may waste your time; it may never spend your trust' (GL-9)". `lens-spec.md:92` repeats it; `:60` lists
`?lenses=`/`?deny=` arrays among retired phrasings "incl. the amendment obligation on boot-and-profiles".

`web-client-os` retires the fragment/handler grammar as inherited bytes (`README.md:396`) and supersedes `gx`
(`system-profiles-and-generations.md:1411-1420`), but never records that it discharged or dropped this
obligation. Grep of `Designs/web-client-os/`: zero hits for `GL-9` or the link-class set. So a named
adversarial invariant from the lens pass — a hostile link may waste time but never spend trust — has no
current consumer, even though route-shaped boot from untrusted links is the spine's central mechanism.

---

## 3. Verdict and routing

**Strained.** The retirement is genuinely well done: the audit table is honest about what is a requirement
versus a mechanism, `gx` is superseded by name with a replacement sequence, System Chrome is re-defined rather
than assumed, and the App Store shows how a neighbour should cite the July set. Nothing in the seam is
*wrong*. What fails is propagation. The retirement was recorded in one draft README, never entered a ruling
ledger, and the set that owns it has no queue — so two live product sets (media, arcade) and one efsv2 corner
still stand on retired assumptions, three named July requirements the spine said it retained (secure
ceremonies, threats, the Files feature bar) have no consuming document, and a July FS→OS contract addressed
to "the OS pass" was never opened by the OS pass.

Nothing here blocks *starting* the MVP. F4 (ceremony spec + prompt budget) and F3 (the File Browser feature
bar) block *finishing* it honestly, because the MVP's own acceptance set cannot currently tell you how many
authorizations a file create is allowed to cost or what a credible drive product must do.

| Set | Action |
|---|---|
| `web-client-os` | F3 fold in the File Browser feature bar + add an audit row; F4 port R0–R3 and the prompt budget into the spine; F5 add a first-run row or record an explicit CUT; F2 state the disposition of the "no iframe-hosted app logic" rule; F6 accept or decline the nine unclaimed OS-pass items; F11 add install-time release re-derivation to System Chrome; F13 declare "Ring 3" retired; F15 accept or decline the GL-9 link-class obligation |
| `media-library` | F1 depend on `web-client-os/README`, demote clientv2 to Inputs, run the Media↔Web-Client boundary review |
| `arcade` | F2 re-point `player-security-model.md:16` and `v2-pressure-and-migration.md` §2c at `app-runtime-and-direct-launch`; drop "Ring-3" (F13) |
| `efsv2` | F7 file or retire `client-os-pressure-report` + `playable-archive-requirements` and clear eight stale Client-OS-pressure boxes; F6 re-file `os-pass-handoff`; F14 demote two `Depends on:` entries to Evidence; F15 re-point the CLIENT obligation |
| `open-web-app-store` | F11 record the GATE re-derivation rule at install (otherwise this set is the model everyone else should copy) |
| `vault-process` | F8 create the `web-client-os` queue and add it + `media-library` to the root inbox routing list; F9 fix `Milestones.md`; F3 close the stale ArDrive Kanban card |
| `owner` | F8 record directions 1–28 in a ruling ledger rather than a draft README; F10 close the clientv2 hold as superseded and answer whether onboarding/key-recovery (OS1) is in or out of the File Browser MVP |
| `clientv2` | F12 correct "twelve" to thirteen (historical, but it is the coverage check a reader runs) |

## 4. Branch check

- `readiness` — does not touch `client-os-pressure-report`, `os-pass-handoff` or `playable-archive-requirements`;
  `Designs/efsv2/owner-rulings.md` is byte-identical to main, so F8 stands unresolved there. Its
  `mvp-build-start-packet.md` (2026-08-25) — the candidate MVP build-start packet — contains **no** reference to
  `web-client-os`, `clientv2` or "File Browser", so the branch proposes an MVP start without naming the
  owner-directed File Browser MVP or the set that owns it. That widens F8 rather than fixing it.
- `data-explorer` — **partially resolves the pattern behind F1** by example:
  `Designs/data-explorer/README.md:5-6` depends on `web-client-os/README` and files `clientv2/README` under
  `**Inputs:**`; `architecture-and-state.md:5` and `views-extensions-and-capabilities.md:5` depend on
  `web-client-os/architecture-and-modules`. This is the citation shape media-library should adopt.
- `sdkv2`, `lab-tournament` — no clientv2-assumption content bearing on this seam.
- All four remain unmerged and invisible to `Open-Decisions.md`, which compounds F8.

## 5. Not verified from here

- Whether James intends the clientv2 hold to be closed, or intends OS1 (onboarding, key custody, recovery) to
  be in or out of the File Browser MVP. Both are owner questions, not inference targets.
- Whether the July ceremony thresholds (R3's default 0.05 ETH-equivalent, the 500 ms / 3 s gating) survive as
  numbers. F4 asks for the *structure* to be re-homed; the constants are a separate measurement question that
  `shell-and-sessions.md:207` already flags as open.
