# Packages, channels, generations, rollback
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[codex-kinds]], [[codex-envelope]], [[apps-cookbook]], [[ops-doctrine]], [[identity]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

## What this rules

Elaborates thesis ruling **F4** (EFS is the registry; lenses are the channels) and the **closure manifest** adopted primitive into buildable shapes: the record schemas, the manifest format, the generation lifecycle, the rollback semantics, the update pipeline, the client's own distribution, and the failure-mode register. Evidence: Reviews/2026-07-07-clientv2-corpus/research/package-trust.md, Reviews/2026-07-07-clientv2-corpus/research/closures-generations.md, Reviews/2026-07-07-clientv2-corpus/research/webos-precedents.md. The one-line thesis restated: **updates are the threat surface, not installs** — every store incident in the corpus weaponized the update channel after trust was earned, so this design spends its entire trust budget on the update path and makes install free (zero-power).

---

## 1. The registry is EFS itself — record shapes — research-grounded

No registry server, no store, no publish tokens. Every concept below is ordinary Etched records read through [[read-lens-spec]] machinery.

| Concept | Record shape | Notes |
|---|---|---|
| **App root** | owned DATA, minted once; body = app charter `{name hint, initial publishing author, appRootVersion:1, links}` | the identity anchor; never re-minted for the same app |
| **Package manifest** | DATA; body = canonical CBOR of the CML tri-partition manifest (per F8: `program`/`use`/`config`/`facets`) + `dataSchemaVersion` + declared endpoints + OS SDK range | manifest hash is part of app identity (F8); canonical form ⇒ one hash |
| **Bundle bytes** | DATA + EFSBytes chunks; byte-level CID recorded in the package manifest | large uploads per [[apps-cookbook]] blessed pattern 1 (sign-one-root, submit-in-chunks) |
| **Release** | **immutable placement**: PIN at key `v<semver>` under the app's releases container, `expiresAt = 0`, plus an entry in the author's appendOnly release-ledger LIST | expiry is *inappropriate* for immutable version claims ([[ops-doctrine]] amendment 5); permanence is correct; badness is answered by deny facts |
| **Channel ledger** | curator-owned **appendOnly LIST**; entries = TAGs targeting release-manifest dataIds | appendOnly entries require `expiresAt == 0` ([[codex-kinds]] amendment 1) — this is why the ledger and the beacon are *separate records*, see below |
| **Channel head** | PIN at key `head` under the channel container; VAL body = `(ledgerIndex, releaseClaimId, manifestDataId)`; **`expiresAt` = beacon period** | the mutable "latest" pointer; expiry appropriate for mutable pointers (ops amendment 5) |
| **Freshness beacon** | = the channel head's `expiresAt`, re-signed on cadence. Curators who want cadence without moving the head re-assert the same head at a new seq | expired head ⇒ STALE ⇒ GATE reads **stop** (RR5) ⇒ **auto-update refuses, with an honest label** — TUF's freeze-attack defense, natively |
| **Curator attestation** | TAG by a curator under their `attests/<channel>` TAGDEF, target = release manifest dataId, weight = tier code | the quorum unit (§5); revocable; bulk-revocable per ops amendment 9 |
| **Provenance record** | TAG linking package DATA → source CID + builder attestation (SLSA-style predicate in VAL body); independent rebuilders publish reproducibility TAGs | F-Droid/Go pattern: "reproducible from source, verified by N rebuilders" as a graded signal, never a green badge |
| **Deny fact** | advisory TAG per [[read-lens-spec]] §3.4, `expiresAt = 0` (vulnerabilities don't heal) | the decentralized yank; un-deny = REVOKE |

**The TUF mapping, finalized** (mechanism [research-grounded], constants [reasoned]):

| TUF role | EFS realization | Freshness instrument |
|---|---|---|
| root | the **user's lens entry** for the channel | pin-and-diff (§4.5 of read-lens-spec); lens repair = root rotation |
| targets | release manifest DATA + immutable placement PIN | none — permanent by design |
| snapshot | channel ledger (appendOnly LIST) + head PIN | ledger ordering by min-`(seq, recordDigest)` kills mix-and-match |
| timestamp | the head PIN's `expiresAt` | expired ⇒ STALE ⇒ manual-only |
| thresholds | k-of-n curator attestation TAGs, evaluated client-side | §5 |

One deliberate divergence from thesis F4's shorthand: "channel = LIST head + freshness beacons" conflates two records that the Codex forbids fusing — appendOnly ledger entries must carry `expiresAt == 0`, so the expiring beacon cannot *be* a ledger entry. The split above (permanent ledger + expiring head) is the compliant elaboration.

## 2. App identity and signer change — research-grounded

**App identity = `(authorIdentityWord, appRootDataId)`.** Never the signing-key hash (IWA's key-as-identity has no rotation story), never a vanity path (paths are petnames; squatting is inert per [[apps-cookbook]]). Version identity = package manifest hash. The canonical manifest hash participates in identity per F8, so "same app, tampered manifest" is a different app.

**Signer-change reality under [[identity]]:** v2 is bare-EOA; there is *no rotation* until the KEL (~2030), and the `successor` row is reserved-not-active — it MUST NOT authorize anything. The package-trust digest's premise that "EFS identity is B′, whose keys rotate under account abstraction" is **stale** and rejected here. Consequences:

- **Legitimate transfer** = the new author mints a new app root, the old author publishes a `movedTo` edge from the old app root and a final release-ledger entry saying so, and curators re-attest under the new tuple. The client treats it as a **new app inheriting nothing**: grants do not carry over; the user approves a migration explicitly.
- **Any change of publishing author on a channel is the loudest diff class** — blocking, never auto-approved, rendered by System Chrome with the event-stream lesson made visible. UI copy: *"The publisher of Notes changed from alice.eth to 0x9f2… This is how account takeovers look. Notes stays on its current version and will not update until you approve."*
- **Key theft is the same-key war** (ops amendment 2): the thief renews, re-asserts, counter-supersedes. Expiry and revocation do not defend; the working defenses are deny facts (presence-shaped, work when the author is hostile — read-lens-spec §3.4 rule 6) and lens-level distrust. Detection-before-KEL-inception is the security-critical window and install UX says so in the trust dossier.

## 3. The closure manifest — research-grounded

One content-addressed DATA record naming the whole bootable system. The manifest's id **is** the generation name and a shareable hyperlink (generation/closure link class, F12). Schema frozen small, versioned, with defined unknown-field behavior — the flakes lesson: this format is what alternative Shells and forks depend on immediately.

```ts
type Role = 'kernel' | 'shell' | 'system-chrome' | 'rescue-shell' | 'importmap'
          | 'app' | 'policy' | 'locale-pack' | 'font-pack' | 'render-service';

interface FollowSpec {                     // the "original" — how this entry tracks upstream
  channel: { curator: Hex32; ledgerListId: Hex32 };  // resolved under the user's lens
  constraint?: string;                     // semver range
  policy: 'auto' | 'manual';               // auto requires §5 gates
}

interface ClosureEntry {
  role: Role;
  name: string;                            // petname within this manifest only
  original: FollowSpec | null;             // null = hand-pinned, never auto-followed
  locked: {                                // the exact pin — flake.lock's split, verbatim
    packageId: Hex32;                      // DATA id of the package manifest
    releaseClaimId: Hex32;                 // the admitted placement claim
    contentCid: string;                    // byte-level CID of the bundle
    byteLength: number;
  };
}

interface ClosureManifest {
  manifestVersion: 1;                      // unknown version ⇒ refuse to boot (fail closed)
  osSdkRange: string;
  entries: ClosureEntry[];                 // flat and authoritative; deps' own locks never re-consulted at boot
  importMap: ImportMapWithIntegrity;       // ONE boot import map; per-module SRI integrity —
                                           // native in Chrome 127+/Safari 18+; the enforcement layer for ES modules
  capabilityTableHash: Hex32;              // snapshot of the wiring diagram (F8); rolls back with the generation
  provenance: {                            // guix-describe analog: how to re-derive this generation
    channelHeads: Array<{ ledgerListId: Hex32; headClaimId: Hex32; asOfSeq: string }>;
    lensVersion: Hex32;                    // pinned lens entry-set hash
    resolvedAt: string;
  };
}
```

Rules: **unknown `role` ⇒ the manifest is unbootable by this client version** (fail closed — a role you can't verify is a hole you can't see); unknown *optional* fields are ignored and preserved. Integrity enforcement is layered: import-map `integrity` for every ES module where native; everything else (WASM, packs, app bundles, policy docs) is hash-verified by the Kernel before instantiation — SES worker blobs are built only from verified bytes. Nothing outside the closure loads, ever. A `follows`-style dedup override (two apps sharing a library) is supported in the resolver, recorded in provenance, never implicit.

## 4. Generations — research-grounded

A generation is a **local, journal-recorded activation** of a closure manifest: `{n, manifestId, provenanceRef, activatedAt, health: staged|booting|successful|failed, pinned: bool}`. Append-only; activation is atomic (SW-mediated pointer swap — the browser's "one SW version controls one client set" is the native atomicity unit; never serve mixed-version chunks, the Vercel skew lesson).

- **Health-gated activation** (Android `markBootSuccessful` pattern): a generation grades `successful` only after (1) Bootstrapper verified every closure hash, (2) Kernel worker reached ready and opened the journal, (3) System Chrome rendered, (4) the Session Shell passed the watchdog — [[shell-and-sessions]] owns the constants: `markSessionHealthy()` within 20s of Kernel handshake + first composited frame, crash loop = ≥3 crashes in 10 minutes. Failure ⇒ automatic fallback to last-successful; if that also fails ⇒ **Rescue Shell** (whose closure is a permanent GC root, present in every manifest as `role: 'rescue-shell'`).
- **Retention:** current + previous **always** (A/B minimum); default keep last 3; user pins (`ostree admin pin` analog) exempt generations from pruning; an explicit keep-N knob (sysupdate `InstancesMax` analog). GC and rollback are the same budget — the policy is *named in the UI*, never silent.
- **GC-roots over browser storage:** all packages/modules/bytes live in Cache API/OPFS keyed by CID; **liveness = reachability from retained generation manifests + Rescue Shell + pins**; everything else sweeps. The journal and signed bundles are Tier B user data behind the hard wall (§6) — never GC candidates.
- **persist() honesty:** call `navigator.storage.persist()` at install and **display the answer**. If denied: *"Your browser may evict the OS and its history. Rollback targets are best-effort until you install to Home Screen / grant persistence."* Boot-time wipe detection (generation sentinels + `estimate()` deltas) emits the Shell-visible eviction event per the thesis honesty doctrine. Never evict the running or last-successful closure while any other cached data remains.
- **Export/fork:** a generation exports offline as manifest + all bytes + envelopes + proofs + covering checkpoints (CAR-style). Signatures travel *with* the export (the `nix-store --export` signature-loss trap, avoided by construction — envelopes are self-verifying). Importing a shared profile always runs the full install review + capability diff: **a shared closure is a Trojan vector until diffed** (FM-U13).

## 5. The update flow — research-grounded mechanics; reasoned constants

Pipeline: `discovered → cooldown → quorum-check → deny-check → diff-review → staged → activated → successful | rolled-back`. Staging resolves `original` specs through the lens, produces a **new manifest**, fetches and verifies the full closure (all-or-nothing — no half-verified apps, FM-U10), and waits for the activation moment (explicit reload/boot; no forced anything).

- **Zero-power install is the headline.** Running any content-addressed app with zero grants is always safe; curation, provenance, cooldown age, and deny facts gate *grants and auto-update*, never execution. Install copy: *"Installing gives this app nothing. It can't touch your files, your network, or your identity until you hand it something."* First-grant shows the trust dossier (attestations, provenance grade, cooldown age, deny status).
- **k-of-n curator quorum for auto-update:** auto-apply requires attestation TAGs on the exact release manifest from **k distinct curator authors already in the viewer's channel lens** — designation is the sybil defense: sybils must be individually trusted-in by the user before they count. Defaults [reasoned]: `k = 2` for app channels, `k = 3` for the OS's own closure roles (kernel/shell/system-chrome/importmap/policy). **1-of-1 channels are manual-install-only, permanently.** Read grades cannot express "LIVE but below threshold" — quorum is client policy layered above resolution (pressure item G1).
- **Cooldown, 24–72h (default 48h), measured from admission — with a correction to F4's claim.** Envelope TIDs are past-datable without bound ([[codex-envelope]]: only future-dating is bounded), so `tidTime` is **gameable** and MUST NOT anchor the cooldown. The unforgeable instant is the **block timestamp of the admission event** at a venue the client trusts for this read; the fallback is the client's own first-observation time, which is strictly later and therefore fail-safe. A release whose tidTime is much older than its earliest observable admission gets a "backdated" flag in the dossier. Emergency-fix path: k+2 attestations may shorten cooldown to 6h — never to zero, and never by cooldown bypass alone. Manual install may always ignore cooldown, with a loud warning.
- **Deny-freshness gate:** auto-apply additionally requires a deny-set view **no older than 24h** (venue-qualified); staler ⇒ defer with the label *"can't confirm this release hasn't been withdrawn — security view is N hours old."* Release resolution is a **safety-class GATE read**: MUST-pull the publisher's home chain when reachable (read-lens-spec §5.4; the §9.B worked example is this exact flow), fail closed when not.
- **Disable-until-approved diffs (Chrome's shipped semantic):** an update that broadens capability ceilings, adds/changes endpoints, changes signer, or changes manifest schema either keeps running the **old version under old grants** or, where the manifest allows, runs the new version attenuated to old grants — and never auto-applies. Diffs render in human meaning (Chrome's warning-diff insight), with network-origin diffs first-class. Same-authority updates auto-apply per channel policy after cooldown + quorum + deny gates.
- **Publishing is a high-risk action class:** release publication is a Kernel-mediated signature with preflight (files changed; capability/endpoint/signer diffs vs previous), no long-lived publish authority exists anywhere in the OS, and intake tooling normalizes/flags invisible Unicode and homoglyphs (GlassWorm) in names, manifests, and code.

### 5.1 Update discovery under no-ambient-HTTP — research-grounded

There is no update poller. Channel freshness derives from the **single jittered per-venue head/checkpoint fetch** (F5 traffic discipline) through granted endpoint capabilities — per-app polling would deanonymize the app list from traffic shape. Hot channel state (ledgers, heads, attestation sets, deny sets) distributes as **content-addressed signed snapshots queried locally** (the OCSP→CRLite pattern): a curator-signed digest record the client fetches once and resolves against offline. With **no endpoint grant at all**, update status is `UNKNOWN — no network capability`, never "up to date" (honesty doctrine addition 1). Sneakernet lane: channel snapshots and full closures import from files; imported channel state carries the offline bundle's grade ceiling (read-lens-spec §5.1 last column) and can never satisfy the deny-freshness gate for auto-apply.

## 6. Rollback — research-grounded

Two different operations on two different surfaces — the corpus's sharpest synthesis:

- **User rollback is a right.** Rolling back among **locally verified** generations is always allowed — permanence makes it a read, not a restore. Verification is local (closure completeness + hashes at activation), independent of current channel state; a REVOKED or STALE channel cannot strand you on a generation you already hold.
- **Auto-follow never moves backward** (Guix fast-forward rule). The client keeps a **per-channel monotonic high-watermark**: `(highest ledger position seen, head claim (seq, recordDigest))`, where ledger position is the appendOnly LIST's stable min-`(seq, recordDigest)` ordering — not tidTime, not semver strings. A head pointing at a lower position or lower slot pair renders the channel **suspect-backward** (client state, deliberately *not* a protocol grade word), auto-update suspends, and the recovery recipe (§8) is offered. A revoked head empties its slot without resurrection (empty-on-revoke): clients keep running their current generation and display "channel withdrawn" — a yank is never an auto-rollback.
- **Deny facts on rollback targets warn, never block (for humans).** *"You're rolling back to a version that 2 of your security sources advise against (RCE — GHSA-xxxx). It will run with its previous grants. Continue?"* — typed confirmation for deny-marked targets. Agents get the GATE behavior: flat refusal, no break-glass without a human at System Chrome.
- **Migration ledger — rollback stops at mutable state, honestly.** Every app/Shell declares `dataSchemaVersion` (the `system.stateVersion` analog). The Kernel keeps a ledger: `{storeId, fromSchema, toSchema, byGeneration, at, downMigrationRef?}`. Rolling back across a migration boundary triggers a real warning — *"Notes migrated its data forward at generation 41. Generation 39 may misread it. Export first?"* — offering proceed / export / cancel, and runs the declared down-migration where one exists. **Never ChromeOS's silent powerwash, never silent corruption.** OS rollback never touches the journal, keys, drafts, outbox, or app data (the Android userdata wall); settings/policy merge across generations 3-way (old defaults × user's current × new defaults, the OSTree /etc pattern).

## 7. The client's own distribution — research-grounded

The OS eats this dog food; its own closure roles ride the same channels with `k = 3`.

1. **Reproducible builds:** deterministic Vite/Rollup output from locked deps, verified in CI; independent rebuilders publish reproducibility TAGs (the F-Droid/Go move — anyone can verify; nothing in the JS ecosystem does this routinely, so it is a visible first).
2. **Provenance on EFS:** release records + SLSA-style provenance TAGs (source CID + builder attestation) on the OS packages themselves; the trust dossier for the OS is the same dossier apps get.
3. **TOFU + self-pinning SW (the default lane):** the *first* load of the Bootstrapper is a TOFU event on whatever origin/gateway served it — stated loudly, exactly TUF's untrusted-root bootstrap. After first pin, the service worker serves only bytes matching the pinned closure; OS updates flow through §5's pipeline (quorum, cooldown, diffs), and the SW never self-updates outside it.
4. **Boot-time closure verification:** the Bootstrapper verifies Kernel/Shell/System-Chrome CIDs and the import map's integrity set against the pinned manifest **before executing any of them** (the Bybit lesson: display-vs-served divergence is caught at the boot boundary, not trusted from the gateway).
5. **IWA-convertible packaging:** bundle layout kept convertible to a Signed Web Bundle for the hardened enterprise lane; identity remains the EFS tuple — the IWA signing key is a packaging detail, divergence documented (key-as-identity is the trap we refuse).
6. **WAICT/WEBCAT tracked** as the standards path to browser-*enforced* closure verification; align the manifest so adoption is a format change, not a redesign. Chain admission is already our transparency log; **monitoring is the half we must fund** (§8, §9 FM-U12) — transparency without monitors protected no one.

## 8. Curator-compromise recovery — the runbook ships BEFORE channels — research-grounded

Written now because every precedent wrote it after the incident. This is a System Chrome guided flow plus a published recipe, not a wiki page.

1. **Detect.** Channel monitoring splits in two ([[web-os-thesis]] Amendment 13). The client-side checks ship at launch as duties of the courier/sync system service ([[system-surfaces]] #19): equivocation detection on curator (author, seq) regions, backward-head detection, deny-fact/revocation-flood alerting, and beacon cadence breaks — on the channels this user subscribes to; alerts are Shell events. The **global first-party observatory** (cross-user monitoring, mass-publish detection, ecosystem alerting) is an uncommissioned workstream, not a launch service.
2. **Contain.** Duplicity evidence anywhere ⇒ the channel grades EQUIVOCAL ⇒ **auto-update suspends globally for that channel by protocol behavior, not by anyone's decision** (RR3: never LIVE, at any venue). The monitor rebroadcasts the portable duplicity proof to every venue it can reach.
3. **REVOKE-sweep.** The curator (or co-curators for their own attestations) enumerate hostile claimIds — head PINs, attestation TAGs — and REVOKE each. Pre-revocation is legal (revokes may land before targets replicate), and the SDK broadcasts revokes multi-venue by default (ops amendment 7). Revoked heads read EMPTY; clients hold their current generation.
4. **Deny facts.** Security authors publish advisory TAGs (`expiresAt = 0`) against the hostile release dataIds and claimIds — this works even if the thief still holds the curator key, which is the whole point of deny-shape (§3.4 rule 6).
5. **Lens repair = root rotation.** Users (or the curator federation's published successor entry) update the lens: distrust the compromised word, add the new curator word. Pin-and-diff prompts on the addition (fail-safe asymmetry). No rotation exists at the key layer until the KEL — the lens layer is the rotation story, and this step is why.
6. **Re-attest + re-key the channel.** The new curator starts a **new ledger** (new LIST); a channel-succession edge (`movedTo` on the old channel container) is published but **never auto-followed** — users approve the migration in System Chrome. Watermarks restart with the new ledger; the old channel's watermark is retained to keep refusing its backward heads.
7. **Publish the incident record** (a permanent, citable post-mortem on EFS) and keep the monitor pointed at the dead channel — thieves re-use warm keys.

**Honest residual:** if the thief holds the *only* curator key of a 1-of-1 channel, recovery is pure lens desertion — which is exactly why 1-of-1 channels never auto-update (§5) and why the same-key-war caveat (read-lens-spec §2.5) is printed in every channel dossier.

## 9. Update-channel failure-mode register

| # | Failure mode | Defense | Residual |
|---|---|---|---|
| FM-U1 | Freeze attack — venue serves stale channel as current | beacon expiry ⇒ STALE ⇒ GATE stops; label "no renewal known to this venue (age X)" | user may manually install stale-labeled release |
| FM-U2 | Rollback attack — venue presents old head as current | per-channel monotonic high-watermark; fast-forward-only auto-follow | first-contact venue can serve an old-but-internally-consistent view until a fresher venue is read |
| FM-U3 | Fast-forward attack — compromised curator publishes absurd version | cooldown + quorum + §8 runbook; watermark reset only via explicit channel succession | window between publish and detection; bounded by cooldown |
| FM-U4 | Mix-and-match across apps in one channel | ledger ordering + closure manifest locks the exact set; staging is all-or-nothing | — |
| FM-U5 | Capability escalation smuggled in an update | disable-until-approved diff on capabilities/endpoints/signer/schema | habituation; mitigated by rarity (diffs only on real changes) |
| FM-U6 | Signer swap / account takeover of publisher | loudest blocking diff class (§2); deny facts; same-key-war honesty | pre-detection installs; no key rotation until KEL |
| FM-U7 | Cooldown gaming via backdated TIDs | cooldown anchored to admission-event block time / first observation, never tidTime; backdated flag | needs read-surface support (pressure item) |
| FM-U8 | Stale deny view auto-installs a withdrawn release | 24h deny-freshness gate + MUST-pull home for safety-class GATE reads | offline installs consciously degrade to manual with labels |
| FM-U9 | Browser eviction destroys rollback targets | persist() honesty, pins, current+previous never evicted first, export lane | best-effort origins can still lose depth; the UI says so |
| FM-U10 | Half-verified closure (partial chunk availability) | all-or-nothing closure verification before first run; BYTES-UNAVAILABLE fails the GATE (RR12) | availability ≠ verifiability; needs closure-completeness predicate (pressure item) |
| FM-U11 | Curation bribery / paid inclusion | lens manifests disclose paid-inclusion policy (ops amendment 9); quorum counts only user-designated curators | disclosure is only as good as desertion pressure |
| FM-U12 | Curator death / channel monoculture / nobody monitoring | beacon lapse ⇒ STALE ⇒ manual-only (graceful); client-side monitor checks as courier duties at launch (equivocation, backward-head, deny-flood on subscribed channels); Rescue Shell + pinned generations as steward-mortality hedge | the global observatory (cross-user, mass-publish, ecosystem alerting) is uncommissioned; monitoring must stay funded — the CT/PEP-458 lesson |
| FM-U13 | Malicious shared profile / closure link (Trojan generation) | import always runs install review + capability diff; zero-power default; hand-pinned entries never auto-follow | user can approve anything; System Chrome makes the diff legible |
| FM-U14 | "On EFS" read as endorsement; permanent malware hosting | discovery ≠ endorsement labels; deny propagation; no positive-trust badges | permanence guarantees hostile bytes exist forever; honesty is the defense |

### Agent lens

Agents (F9) may **discover** updates, run the channel monitor, prepare staged updates, draft releases, and compile trust dossiers — all GATE-context reads (they *act* on answers; STALE/UNKNOWN/EQUIVOCAL stop them mechanically per §3.3 of [[read-lens-spec]]). Agents may **never**: approve a capability/endpoint/signer diff, shorten or cross a cooldown, satisfy quorum, publish a release, or roll back across a deny fact or migration boundary — install/update/publish/rollback-with-warnings are T3/T5 checkpoints that are never satisfiable by an agent alone. "The user told me to update it" is not a grant; the grant is the System Chrome ceremony. The channel monitor is the flagship *good* agent workload: read-only, budgeted, receipted, and its alerts land as Shell events, not as actions.

### Honesty obligations

- Channel state always renders with its grade and venue: an expired beacon is *"no renewal known to this venue (age X)"* off-home, *"curator let this lapse"* only on a live home read (RR4 — STALE is never rendered as REVOKED or "abandoned").
- "Update available" carries venue + as-of age; **no endpoint grant ⇒ `UNKNOWN — no network capability`, never "up to date"** (the NO-TRANSPORT distinction from the thesis honesty doctrine).
- The trust dossier uses negative indicators only: deny hits, EQUIVOCAL curators, missing provenance, backdated flags. No green checkmarks, ever; reproducibility renders as "verified by N rebuilders," a count, not a badge.
- persist() denial, eviction events, and retention-policy consequences ("keeping 3 generations ≈ N MB; the browser may still evict") are user-visible, not buried.
- Rollback warnings state exactly what is known and its currency: deny facts with their advisory authors and grades, migration boundaries with dates and generations.
- A yanked channel head renders as *"withdrawn by curator"* — the running generation is never destabilized, and the wording never implies the local copy became unsafe *because* it was unlisted.

## Open questions

- [ ] **Quorum constants + launch curators** [open] — k=2 apps / k=3 OS roles are argued, not tested; and who are the day-one curators? (Shared with the thesis open question.)
- [ ] **Cooldown anchor plumbing** [open] — admission-event block timestamps are not on the frozen read ABI (`getSlot` carries no admission time); decide: bless an event-log/receipt SDK recipe, or press for read-surface support. FM-U7 depends on it. (Filed as an efsv2 pressure item.)
- [ ] **Channel-succession convention** [open] — `movedTo` on the channel container is proposed here; needs an [[apps-cookbook]] blessing so third-party clients agree what channel migration looks like.
- [ ] **Publish-or-local for closure manifests** [open] — a published OS profile is a fingerprinting gift (apps, policies, locale packs) and EFS records are public and permanent; default is local-first with optional publication, but cross-device profile sync then has no protocol home (encrypted-record gap; pressure item).
- [ ] **Emergency-fix constants** [reasoned→open] — k+2 attestations / 6h floor are placeholders; red-team the incentive to routinize the emergency lane.
- [ ] **Retention defaults** [open] — keep-3 + pins is a guess; needs real size numbers per generation before the knob's default is set.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain verified ([[web-os-thesis]] rulings unchanged; [[read-lens-spec]] §0 pins P5/P7/P11 unmoved; [[codex-kinds]] amendment 1 unchanged)
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
