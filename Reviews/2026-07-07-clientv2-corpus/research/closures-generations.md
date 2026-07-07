# Content-addressed system closures, profiles, generations, rollback — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** closures-generations. **Date:** 2026-07-07.

Lane question: how do deployed systems name a bootable closure, pin its transitive dependency graph, manage generations/rollback against user data, decide what GC keeps alive, and express "follow latest vs open exact version" — and what should the EFS client v2's user-owned, content-addressed OS profiles steal, avoid, or invent.

---

## 1. WHAT EXISTS TODAY (shipped)

### 1.1 Nix: the closure as the unit of everything

- **Naming a bootable closure.** NixOS builds the *entire* system — kernel, initrd, /etc contents, services, activation scripts, bootloader install script — into one derivation, `system.build.toplevel`: "a derivation that depends on essentially all other system configuration options"; the result is a single store path whose transitive reference closure IS the operating system. Switching = building the new toplevel, running its `bin/switch-to-configuration switch|boot`, which atomically repoints the profile symlink and writes a bootloader menu entry per generation. (nixos.org manual; fzakaria "NixOS; what's in a rebuild?", 2020-09; search.nixos.org `system.build.toplevel`.)
- **Crucial caveat: Nix store paths are input-addressed, not output-content-addressed.** The path hash is over the build *recipe*, not the produced bytes. That is exactly why the binary-cache trust model needs signatures: a `.narinfo` carries `NarHash`, `References`, and an Ed25519 `Sig` that must match a key in `trusted-public-keys` before a substitute is accepted (NixOS wiki "Binary Cache"; nix.dev "Configure Nix to use a custom binary cache"). One central key (cache.nixos.org) anchors most of the ecosystem's trust. Content-addressed derivations (RFC 0062, `__contentAddressed = true`) would let outputs verify themselves and allow "multiple users to share a store without trusting each other," but they remain **experimental in 2025** with an open stabilization milestone and no Hydra support (NixOS/nix milestone #35; wiki.nixos.org/Ca-derivations; fzakaria "Demystifying Nix's Intensional Model", 2025-03-08).
- **Lock graphs: flake.lock.** `flake.lock` is a single flat JSON graph, isomorphic to the input dependency graph. Each node stores `original` (the unlocked, "follow-this-branch" specification from flake.nix), `locked` (exact `rev` + **`narHash`** — a content hash of the fetched tree — plus `lastModified`), and its `inputs` mapping. Two properties matter: (a) **locks are transitive and authoritative** — "if a lock file exists and is up to date, Nix will not look at the lock files of dependencies"; (b) **`follows`** lets the root graft one input over another's input (`inputs.nixops.inputs.nixpkgs.follows = "dwarffs/nixpkgs"`) to deduplicate diamond dependencies. Note `narHash` makes locked inputs *content-verified* even though the store is input-addressed. (Nix manual 2.28, `nix3-flake`, fetched 2026-07-07.)
- **Follow-latest vs open-exact.** Three-layer indirection: registry alias (`nixpkgs`) → unlocked ref (`github:NixOS/nixpkgs/nixos-24.05`, follows a branch) → locked ref (`rev` + `narHash`, exact). `nix flake update` re-resolves originals; the lock is the reproducibility artifact you commit. This original/locked split is the cleanest shipped answer to "follow vs pin."
- **Profiles/generations/rollback.** A profile is a symlink to a numbered sequence of generations (`/nix/var/nix/profiles/system-42-link` → store path). Every successful rebuild appends a generation; `nix-env --rollback` / NixOS boot menu selects an older one; activation is an atomic symlink swap. **All profile generations are automatically GC roots** — "as long as old generations reference a package, it will not be deleted; we wouldn't be able to do a rollback otherwise." (Nix manual, nix-env rollback/delete-generations; Nix Pills ch. 11.)
- **GC.** Liveness = reachability from roots (profiles, `/nix/var/nix/gcroots`, `result` symlinks, running processes). `nix-collect-garbage -d` deletes *all old generations of all profiles* first, then sweeps — i.e., **cleanup policy directly trades against rollback depth** (Nix manual, garbage collection).
- **Closure transport, offline.** `nix-copy-closure` / `nix-store --export|--import` move a full closure over SSH or a USB stick; a closure is a self-contained transferable artifact. Trap: **`nix-store --export` drops signatures** (NixOS/nix issue #2450, open for years) — provenance doesn't automatically travel with bytes.
- **User data vs system state: `system.stateVersion`.** Generations roll back *code and config defaults*, never mutable data (PostgreSQL databases, home dirs). `stateVersion` pins "what release's on-disk data formats my state was created under" so upgrades don't auto-migrate stateful services destructively; changing it carelessly "can lead to irreversible data loss," and it is explicitly *not* part of the rollback mechanism (NixOS wiki FAQ; Mayflower "Safe service upgrades using system.stateVersion", 2021-01-28). The lesson: **data-schema version is a separate axis from system generation** and must be tracked explicitly.

### 1.2 Guix: same skeleton, stronger provenance + authenticated channels

- **Channels + `guix describe` + `time-machine`.** Channels are Git repos; `guix describe --format=channels` emits the exact commit set of the running Guix — a lockfile you can hand to `guix time-machine -C channels.scm -- <cmd>` to re-materialize the *entire toolchain and package graph* at that instant, "bit for bit" (Guix manual "Replicating Guix", "Invoking guix time-machine"; hpc.guix.info reproducible-research posts 2021–2023). Pinning the channel set pins *all of Guix itself*, not just app deps — deeper than flake.lock, which pins inputs but not the Nix evaluator.
- **Limits of time travel:** cannot go earlier than v0.16.0 (2018-12, when the channel mechanism appeared), and old revisions get **no security patches** — "careless use of `guix time-machine` opens the door to security vulnerabilities" (Guix manual, fetched 2026-07-07). Old generations are a liability surface, not just a convenience.
- **Authenticated channels (shipped 2020-07).** `.guix-authorizations` is an in-repo list of authorized committer key fingerprints; the invariant: *a commit is authentic iff signed by a key listed in the `.guix-authorizations` of each of its parents*. Trust bootstraps from a **channel introduction** (commit hash + signer fingerprint baked into the client), and forks simply publish their own introduction. `guix pull` also enforces **fast-forward-only updates** against the last `guix describe` state to block downgrade attacks, and warns when fetching from mirrors. Explicitly compared to TUF and judged a better fit for Git-native source distribution (Guix blog "Securing updates", 2020-07-01). This is the closest shipped analog to EFS's author-signed, introduction-anchored trust: **trust is anchored in keys and history, not in the serving venue**.
- **System generations.** `guix system reconfigure` appends a generation; GRUB gets an "old generations" submenu; `guix system roll-back` / `switch-generation` mirror Nix; deleting generations reinstalls the bootloader menu. `/run/current-system` embeds **provenance metadata** (channels + config file), so `guix system describe` can tell you how to rebuild the generation you are running (Guix manual "Invoking guix system", 1.5.0).

### 1.3 OSTree / atomic desktops / bootc: image granularity, boot-time selection

- **Naming.** An OSTree deployment is identified by **commit checksum** (SHA-256 of the content tree) and lives at `/ostree/deploy/$stateroot/deploy/$checksum.$serial`; each deployment gets a Boot Loader Spec entry `ostree-$stateroot-$checksum.$serial.conf` whose `ostree=` karg tells the initramfs which tree to chroot into. Refs (branch names) are the "follow" layer; checksums are the "exact" layer — deliberately Git-shaped (ostreedev deployment docs, fetched 2026-07-07).
- **State split, made physical.** `/usr` read-only; **`/etc` gets a 3-way merge** per deployment (old defaults × your live /etc × new defaults) so local config survives upgrades; **`/var` is shared per stateroot and never touched by OSTree**. Staged deployments delay the /etc merge to shutdown (`ostree-finalize-staged.service`) to avoid losing late edits. (Same source.)
- **Rollback UX.** rpm-ostree always keeps ≥2 deployments; every operation stages, nothing changes until reboot; pick the old entry in GRUB or `rpm-ostree rollback` to make it permanent. **`ostree admin pin <index>`** marks a known-good deployment immune to the default keep-2 pruning — the shipped answer to "GC ate my rollback target" (Bluefin admin guide; daal.cloud rpm-ostree cheatsheet).
- **bootc (CNCF Sandbox 2025-01-21).** OS delivered as a standard OCI container image; `bootc upgrade`/`switch`/`rollback`; rollback "swaps the bootloader ordering to the previous boot entry"; changes staged by default. Universal Blue/Bluefin runs this at desktop scale and *encourages pinning by date tag* with signature policy enforced: `bootc switch ghcr.io/projectbluefin/bluefin:stable-20241027 --enforce-container-sigpolicy` (bootc.dev docs; Bluefin admin docs; LWN "Bootc for workstation use", 2025). Registry tags are mutable ("follow"); digests/date-tags are the pin. Fedora is testing **sealed/signed atomic desktop images** (Fedora Magazine, 2025).

### 1.4 Android / ChromeOS: A/B slots, boot-success health gates, and the user-data wall

- **A/B slots.** Two copies of every bootable partition; `update_engine` writes the idle slot in the background, verifies partition hashes, runs post-install, marks the new slot active. **"If an OTA update is applied but fails to boot, the device will reboot back into the old partition and remains usable"**; fallback stops once the new system calls `markBootSuccessful()`. **Userdata is a single partition, never duplicated** — updates stream, and user data survives failed updates untouched (source.android.com/docs/core/ota/ab, fetched 2026-07-07). Virtual A/B (snapshot-based, mandatory from Android 13) keeps the same contract with less flash (source.android.com/docs/core/ota/virtual_ab; esper.io 2022).
- **Anti-rollback ≠ rollback.** Android Verified Boot 2.0 keeps `stored_rollback_indexes[]`; once bumped, *older signed images refuse to boot* — security anti-downgrade deliberately destroys the user's ability to go back (AVB README). Post-install migration steps "run under the old kernel's constraints" and are the fragile, non-atomic part.
- **ChromeOS.** Same A/B autoupdater lineage. Enterprise **version pinning** holds fleets at ≤ a version (only back to n-3 supported); **enterprise rollback works but wipes all local data** — devices powerwash (cryptographic erase) as part of rolling back, because forward-migrated profile state can't be trusted under old code (support.google.com rollback + powerwash docs; chromium.org Powerwash design doc). This is the starkest statement of the generation/user-data conflict: ChromeOS chose "rollback = wipe."

### 1.5 systemd sysupdate / UKI / ParticleOS

- `systemd-sysupdate` does A/B-style updates over *files, directories, or partitions* driven by declarative transfer files; version discovery by pattern; **`InstancesMax=`** governs how many old versions are retained (i.e., an explicit knob unifying GC and rollback depth); downloads verified against SHA256SUMS (+ signature with `--verify`) (man systemd-sysupdate, fetched 2026-07-07). UKIs bundle kernel+initrd+cmdline into one signed EFI binary — the bootable unit becomes a single verifiable file (ArchWiki UKI).
- **ParticleOS** (systemd's experimental distro, FOSDEM 2025): image-based, immutable `/usr` A/B partitions, built with mkosi, and — notably for EFS — **users build and sign their own images with their own keys** instead of trusting vendor signatures. User-owned root of trust for the OS image is a live, current idea (github.com/systemd/particleos; FOSDEM 2025 slides).

### 1.6 Browser-native pieces that already exist

- **Import map `integrity`** shipped: Chrome 127 (2024) and Safari 18 — you can now map every ES module URL to an SRI hash inside the import map, giving a page a *verifiable module closure* without a bundler (Shopify engineering post, 2024; blink-dev Intent to Ship).
- **Browser storage is the store, and its GC is eviction.** All origin storage (IndexedDB, Cache API, OPFS) is **best-effort by default; under pressure the browser evicts whole origins LRU-first**, skipping origins granted `navigator.storage.persist()`. Chromium auto-grants/denies persist() on engagement heuristics; Firefox prompts (MDN "Storage quotas and eviction criteria", current). Any browser-OS generation store must treat eviction as the adversary GC it cannot fully control.
- **IPFS naming split:** CID = immutable exact version; IPNS name (key-derived, signed records) or DNSLink = mutable "follow" pointer; propagation is slow (~60s DHT, DNS TTLs) and pinning is what makes bytes durable (docs.ipfs.tech/concepts/ipns; blog.ipfs.tech "The State of Dapps on IPFS").

---

## 2. WHAT IS EMERGING (proposals / drafts / betas, with status)

- **Isolated Web Apps (WICG explainer, active 2024–2026; shipping progressively on ChromeOS/Chrome for enterprise).** The browser-native "app closure": all resources packed in a **Signed Web Bundle** with an Integrity Block; app identity = `isolated-app://` URL derived from the *signing public key* (no DNS); an **update manifest URL** is polled (4–6 h) for new versions; **downgrade protection** via required monotonically-increasing `version` or signature timestamps; storage is keyed to the key hash so upgrades retain state. Key rotation is essentially unsolved — key = identity (WICG/isolated-web-apps README, fetched 2026-07-07; chromeos.dev IWA docs; Chrome enterprise force-install docs). This is the closest existing thing to "a link that names a verifiable bootable app closure," and it chose *key-addressed identity + version monotonicity*, not content-addressed identity.
- **importmap.lock (proposal, 2026-01-19).** A lockfile-for-the-web: import map + integrity (shipped) + PURL package identity + dependency-graph metadata (proposed, tool-consumed) — motivated by EU CRA SBOM mandates (nesbitt.io). Independent confirmation that "the web needs a closure manifest" is becoming mainstream.
- **Nix CA-derivations stabilization** — still open (milestone #35), years in. Output-addressing retrofitted onto an input-addressed store is *hard*; EFS gets to start output-addressed.
- **Fedora "sealed" atomic desktop images / bootc image signing maturation** (Fedora Magazine test images, 2025; bootc CNCF Sandbox 2025-01) — image-mode Linux converging on signed, digest-pinned, A/B-rollback desktops.
- **Determinate Nix 3.0 (2025-03) vs Lix "de-facto flakes v1" (2024–2025):** two implementations now offer *different* "stable" flakes, after RFC 136 (approved 2023-08) promised incremental official stabilization that still hasn't finished. The pinning format itself became a fork axis (discourse.nixos.org Determinate Nix 3.0; NixOS/SC-election-2024 issue #112; NixOS/rfcs PR #136).

---

## 3. WHAT WOULD BE AN EFS-SPECIFIC INVENTION

Nothing shipped combines all of: (a) output-content-addressed closure naming, (b) author-signed *records* (not venues) as the "follow" pointer, (c) per-viewer trust (lenses) deciding *whose* "latest" you follow, (d) offline-first generations in evictable browser storage, (e) forkable/shareable user-owned profiles as first-class data. Specifically new ground:

1. **A closure manifest as an EFS record** — one signed record whose payload names Kernel CID, Shell CID, import map (with per-module integrity), app package CIDs, policy documents, and SDK version range. The manifest CID *is* the generation name. No shipped system makes the OS closure a portable, citable, author-signed graph node.
2. **Lens-resolved channels.** "Follow latest" in every studied system trusts a venue (branch, registry tag, update URL) or a single vendor key. EFS can make "latest" = *first-attester-wins across MY trusted-author list*, with read grades (LIVE/STALE/EQUIVOCAL) attached to the resolution itself. Nobody has venue-relative, honestly-graded update channels.
3. **Composed generation grades.** A generation resolved from N pointers/records needs a *composite* freshness/trust grade ("built from 2 STALE inputs, 1 EQUIVOCAL") — no precedent; read grades exist per-record in EFS but not per-closure.
4. **Rollback as a user right under permanence.** Android/ChromeOS treat downgrade as an attack; EFS wants it as a right. Splitting *security anti-rollback* (never auto-follow a pointer that moves backward; Guix fast-forward rule) from *user rollback* (local choice among locally verified generations, always allowed) is an EFS-specific synthesis.

---

## 4. LESSONS AND TRAPS from deployed systems

1. **The flakes trap: ship the pinning format half-frozen and the ecosystem forks.** RFC 49 was withdrawn yet flakes shipped as "experimental"; seven years of limbo, then RFC 136 (2023-08) tried incremental stabilization; meanwhile Determinate unilaterally declared flakes stable (3.0, 2025-03) and Lix froze its own "v1" — the *reproducibility format itself* became incompatible across implementations. Also: flakes bundled pinning + new CLI + eval caching + registry into one take-it-or-leave-it feature, "a Python 3 situation." Freeze a *small* closure-manifest format early; version it; don't bundle.
2. **GC and rollback are the same budget.** `nix-collect-garbage -d` deletes exactly the generations that made rollback possible; rpm-ostree keeps only 2 deployments unless you `ostree admin pin`; sysupdate's `InstancesMax` makes the trade explicit. In a browser, eviction does this *to you*: best-effort origins get LRU-evicted wholesale. Any design that doesn't name its retention policy will silently lose rollback targets.
3. **Rollback stops at mutable state.** OSTree never touches `/var`; Android never duplicates userdata; NixOS generations don't roll back databases (hence `stateVersion`); ChromeOS enterprise rollback *powerwashes*. Forward data migrations are the one-way door inside every "atomic" system. The atomic part is easy; the migration boundary is the product problem.
4. **Input-addressed naming creates a signing bottleneck.** Because Nix store paths don't verify their own contents, the whole ecosystem hangs off `trusted-public-keys` for binary caches — one dominant key, and signatures that don't even survive `nix-store --export` (issue #2450). CA-derivations, the fix, has been "almost stable" for ~5 years. Start output-addressed; make provenance travel *with* the artifact.
5. **Health-gated activation beats manual rollback.** Android's slot metadata (`bootable`/`successful`, fallback until `markBootSuccessful()`) means a bad update self-heals without user action; post-install hooks running "under the old kernel's constraints" are the documented fragile spot. Guix/Nix rely on a human picking a GRUB entry. A browser OS should gate "generation successful" on Kernel+Shell actually reaching healthy state.
6. **Key-as-identity has no rotation story.** IWAs derive app identity (and storage keying!) from the signing key; lose or leak the key and identity + user data binding are gone. Guix's answer — in-history authorization files + introductions — allows committer sets to evolve. EFS should bind closures to EFS identity (smart account / KEL reservation), not raw bundle keys.

---

## 5. EFS TRANSLATION — opinionated recommendations for client v2

1. **Make the generation a single content-addressed manifest record ("system closure manifest"), NixOS-toplevel-style.** One EFS DATA record (well-known schema) whose payload pins: Kernel package CID, Shell package CID, full import map with per-module `integrity` (shipped platform feature: Chrome 127/Safari 18 — use it as the enforcement layer), app package CIDs + manifests, policy docs (network grants, locale packs), OS SDK version range. The manifest's deterministic EFS id / content CID *is* the generation name; a hyperlink or PIN to it names a bootable OS. Everything reachable from it is the closure; nothing outside it loads.
2. **Adopt flake.lock's `original`/`locked` split verbatim.** Each entry in the manifest carries both the *follow spec* (e.g., "Shell = latest `efs-shell` from author X under lens L, channel `stable`") and the *lock* (exact CID + size). Upgrade = re-resolve originals through the lens → produce a NEW manifest; rollback = activate an old manifest. Keep the lock graph flat and authoritative (never re-consult dependencies' own locks at boot). Support a `follows`-style override so two apps sharing a library can be deduplicated deliberately.
3. **Two-layer naming, lens-resolved on the mutable layer.** Exact = CID (self-verifying, no signature needed for integrity). Follow = an EFS record ("channel pointer") naming the latest manifest, resolved *through the user's lens* with read grades surfaced. This replaces: registry tags (bootc/docker, mutable and forgeable), IPNS (single-key), update_manifest_url (single vendor URL). Adopt Guix's **fast-forward rule for auto-follow**: never auto-advance to a manifest whose version/seq is lower than the last seen; a backward move renders the channel EQUIVOCAL-grade and requires explicit user action. User-initiated rollback among locally stored generations is always allowed — downgrade-as-attack and rollback-as-right are different operations on different surfaces.
4. **Generations = append-only local sequence + Android-style health gate + pinning.** Keep current + previous always (A/B minimum); mark a generation `successful` only after Bootstrapper→Kernel→Shell reach a healthy checkpoint; on boot failure auto-fall back to last-successful (this *is* the Rescue Shell trigger). Give users `pin` (ostree admin pin analog) exempting a generation from retention pruning, and an explicit `keep last N` knob (sysupdate `InstancesMax` analog). Record guix-describe-style provenance in each generation: which channel records, which lens state, which resolution produced it — so any generation is auditable and re-derivable.
5. **Treat browser eviction as the GC and generations as its roots.** All cached packages/modules/bytes live in Cache API/OPFS keyed by CID; liveness = reachability from retained generation manifests; sweep everything else. Call `navigator.storage.persist()` at install and *show the answer honestly* — if persistence is denied, the OS must display "generations are best-effort; the browser may evict them" rather than promising offline boot it can't keep. Never evict the running or last-successful generation's closure while any other data remains.
6. **Hard wall between generation state and user data, with an explicit migration ledger.** OS rollback must never touch the write journal, keys, drafts, or app data (Android userdata lesson). Adopt a `stateVersion` analog: every app/Shell declares its data-schema version; the Kernel keeps a ledger of "store X migrated to schema v by generation G." Rolling back across a migration boundary triggers a real warning ("app data was migrated forward; old Shell may misread it") and, where declared, a down-migration hook — never ChromeOS's silent wipe, never silent corruption. Use an OSTree-style 3-way merge (old defaults × user's current settings × new defaults) for settings/policy across generations instead of clobbering.
7. **Closures are exportable, forkable artifacts.** Support offline export of a generation (manifest + all bytes, e.g., CAR file) — the nix-copy-closure move — and make provenance/signature records part of the export so trust survives transport (the `--export` signature-loss trap). Fork = author a new manifest referencing mostly the same CIDs; sharing a profile is just sharing a link — but importing one must run the full install/capability-diff flow (a shared Shell profile is a Trojan vector, per the handoff's Shell warnings).
8. **Freeze the manifest schema early, tiny, and versioned.** The flakes lesson: this format is the thing third parties (alternative Shells, forks, tooling) will depend on immediately; a half-stable format invites Determinate-vs-Lix-style ecosystem forks of the *EFS OS itself*. Ship v1 with an explicit `manifestVersion`, minimal required fields, defined unknown-field behavior, and a written deprecation policy.

---

## 6. Where EFS v2 protocol design conflicts with / under-supports this lane

1. **No composite read grade for multi-record resolutions.** Read grades are per-record; a booted generation is resolved from many records (channel pointers, package records, byte availability). The client needs a normative *composition rule* ("generation grade = worst of inputs, venue-qualified") or every Shell invents its own honesty. Candidate home: read-lens-spec.
2. **Bootability vs BYTES-\* grades.** Large packages ride EFSBytes/chunks with their own grades, but "is this closure fully materialized locally = bootable offline" is a closure-level predicate over many byte sets. Protocol gives per-object grades; the OS needs an all-or-nothing closure-completeness notion, plus partial-closure UX ("catalog cached, 3 packages missing").
3. **REVOKE vs pinned generations offline.** A user pinned to a revoked (vulnerable/malicious) Kernel manifest may never see the revocation offline. Needs a stated boot-time revocation-check policy with venue-qualified "last checked" for boot artifacts specifically — and a decision on whether REVOKED-grade closures may still be user-booted (permanence says bytes exist; safety says warn loudly). Guix documents the same hazard for time-machine; EFS should document, not hide, it.
4. **Private/local profiles vs public permanent records.** Publishing an OS profile (apps, policies, locale packs) is a fingerprinting/surveillance gift, and EFS records are public and permanent. Generations must be local-first (journal) with *optional* publication; if users want cross-device profile sync, the protocol under-supports encrypted or private records — currently this forces either publicity or no sync. Needs an efsv2 note.
5. **Manifest shape: LIST is too weak.** A closure needs *typed roles* (kernel/shell/importmap/app/policy), integrity metadata, and version fields; a generic LIST of PINs under-specifies this. It should be a frozen well-known DATA schema (+ TAGDEF namespace for channels), or codex-kinds should say how roles attach to LIST members. Also worth checking: seq/admit-both semantics give channel pointers a total order the client can use for the fast-forward rule — confirm the envelope `seq` is usable as the monotonic version (IWA-style downgrade protection) without new protocol surface.

---

## Sources (fetched/checked 2026-07-07)

**Nix**
- https://nix.dev/manual/nix/2.28/command-ref/new-cli/nix3-flake.html (flake.lock structure, original/locked, follows, registry) — Nix 2.28 manual, 2025
- https://github.com/NixOS/rfcs/pull/136 (incremental flakes/CLI stabilization; approved 2023-08)
- https://github.com/nixos/rfcs/pull/49 (original flakes RFC, withdrawn)
- https://github.com/NixOS/SC-election-2024/issues/112 (flake stabilization positions, Determinate vs Lix branching; 2024)
- https://discourse.nixos.org/t/determinate-nix-3-0/61202 (Determinate Nix 3.0, flake stability guarantee; 2025-03)
- https://wiki.nixos.org/wiki/Ca-derivations + https://github.com/NixOS/nix/milestone/35 (CA derivations experimental; stabilization open, 2025)
- https://github.com/NixOS/rfcs/blob/master/rfcs/0062-content-addressed-paths.md (RFC 0062)
- https://fzakaria.com/2025/03/08/demystifying-nix-s-intensional-model (input- vs content-addressing; 2025-03-08)
- https://nix.dev/manual/nix/2.18/command-ref/nix-env/rollback (generations/rollback)
- https://nix.dev/manual/nix/2.28/package-management/garbage-collection.html + https://nixos.org/guides/nix-pills/11-garbage-collector.html (GC roots, generations as roots)
- https://nixos.wiki/wiki/Binary_Cache + https://nix.dev/guides/recipes/add-binary-cache.html (narinfo Sig, trusted-public-keys)
- https://github.com/NixOS/nix/issues/2450 (export drops signatures)
- https://nixos.org/manual/nix/stable/package-management/copy-closure (closure transport)
- https://search.nixos.org/options?show=system.build.toplevel + https://fzakaria.com/2020/09/06/nixos-what-s-in-a-rebuild (system closure, switch-to-configuration; 2020-09)
- https://nixos.wiki/wiki/FAQ/When_do_I_update_stateVersion + https://nixos.mayflower.consulting/blog/2021/01/28/nextcloud-stateversion/ (stateVersion semantics; 2021-01-28)

**Guix**
- https://guix.gnu.org/manual/en/html_node/Invoking-guix-time_002dmachine.html (time-machine, v0.16.0 floor, security caveat)
- https://guix.gnu.org/manual/1.5.0/en/html_node/Replicating-Guix.html (guix describe, channel pinning)
- https://guix.gnu.org/blog/2020/securing-updates/ (.guix-authorizations, introductions, fast-forward anti-downgrade; 2020-07-01)
- https://guix.gnu.org/manual/1.5.0/en/html_node/Invoking-guix-system.html (system generations, GRUB submenu, provenance)

**OSTree / bootc / Universal Blue**
- https://ostreedev.github.io/ostree/deployment/ (deployment naming, stateroot, /etc 3-way merge, /var, BLS entries, staged finalize)
- https://bootc.dev/bootc/upgrades.html + https://github.com/bootc-dev/bootc (upgrade/switch/rollback; CNCF Sandbox 2025-01-21)
- https://docs.projectbluefin.io/administration/ (ostree admin pin, date-tag pinning, --enforce-container-sigpolicy)
- https://lwn.net/Articles/1042708/ (bootc for workstations; 2025)
- https://fedoramagazine.org/sealed-atomic-desktops-test-images/ (sealed images; 2025)

**Android / ChromeOS**
- https://source.android.com/docs/core/ota/ab (A/B slots, markBootSuccessful, userdata not duplicated, post-install constraints)
- https://source.android.com/docs/core/ota/virtual_ab (Virtual A/B; Android 13 mandate per https://www.esper.io/blog/android-13-virtual-ab-requirement)
- https://android.googlesource.com/platform/external/avb/+/master/README.md (AVB 2.0 stored_rollback_indexes)
- https://support.google.com/chrome/a/answer/12569990 (enterprise rollback wipes local data; last-3-versions rollback protection)
- https://support.google.com/chrome/a/answer/3168106 (version pinning, n-3 limit)
- https://www.chromium.org/chromium-os/chromiumos-design-docs/powerwash/ (powerwash cryptographic erase)

**systemd / ParticleOS**
- https://man7.org/linux/man-pages/man8/systemd-sysupdate.8.html (A/B transfers, InstancesMax, SHA256SUMS verify)
- https://github.com/systemd/particleos + https://archive.fosdem.org/2025/events/attachments/fosdem-2025-4057-particleos-can-we-make-lennart-poettering-run-an-image-based-distribution-/slides/238384/ParticleO_ZevZimi.pdf (user-signed images, /usr A/B; FOSDEM 2025)
- https://x86.lol/generic/2024/08/28/systemd-sysupdate.html (NixOS + repart + sysupdate; 2024-08-28)

**Browser-native**
- https://github.com/WICG/isolated-web-apps/blob/main/README.md (Signed Web Bundles, key-derived isolated-app:// identity, update manifest, monotonic-version downgrade protection)
- https://chromeos.dev/en/web/isolated-web-apps + https://support.google.com/chrome/a/answer/9367354 (IWA install/update cadence 4–6 h; enterprise)
- https://shopify.engineering/shipping-support-for-module-script-integrity-in-chrome-safari (import map integrity; Chrome 127, Safari 18; 2024)
- https://nesbitt.io/2026/01/19/importmap-lock.html (importmap.lock proposal; 2026-01-19)
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (best-effort vs persist(), LRU origin eviction)
- https://docs.ipfs.tech/concepts/ipns/ + https://blog.ipfs.tech/dapps-ipfs/ (CID vs IPNS/DNSLink, pinning)
