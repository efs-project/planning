# Package, update, and supply-chain trust — research digest
**Corpus:** 2026-07-07-clientv2-corpus. **Agent lane:** package-trust. **Date:** 2026-07-07.

Decision-grade digest for EFS client v2: how the world does package/update trust today, what is emerging, what keeps failing, and how it maps onto content-addressed app packages on EFS with lens-based channels, generation rollback, and zero-power installs.

---

## 1. What exists today (shipped)

### 1.1 TUF — the reference design for update metadata

TUF spec v1.0.34, last modified 2026-01-22. The load-bearing ideas, all of which the EFS client should either adopt or consciously map onto EFS primitives:

- **Four top-level roles**: `root` (delegates trust to the other roles' keys), `targets` (signs the actual file list — hashes + sizes; can delegate subtrees to other roles), `snapshot` (version numbers of all targets metadata — kills mix-and-match), `timestamp` (small, frequently re-signed pointer to the latest snapshot — kills freeze/replay). Separation exists so the hot online key (timestamp) is worthless alone and the valuable keys (root, targets) stay offline.
- **Thresholds**: every role has k-of-n signing thresholds; duplicate signatures from one key don't count.
- **Root rotation**: clients walk intermediate `root.json` versions, each signed by *both* the previous root keys and its own — self-healing chain of custody without out-of-band redistribution.
- **Attack taxonomy** the spec explicitly defends against: rollback (version monotonicity, client keeps a high-watermark), freeze (metadata expiration timestamps), mix-and-match (snapshot consistency), fast-forward (version caps + recovery procedure), arbitrary install (hash + signature).
- **Consistent snapshots**: version- or hash-prefixed filenames so the repo can publish while clients read — trivially satisfied by content addressing.

Deployments: Docker Notary/TUF, Uptane (automotive OTA, ~one-third of new US cars per TUF project docs), Sigstore's own trust root. **PyPI's PEP 458 (TUF for PyPI) is the cautionary tale**: accepted ~2020, still unshipped as of mid-2026. The ops burden (ceremonies, online signing infra, metadata serving) stalled it for years; PyPI instead shipped Trusted Publishing (OIDC) and PEP 740 attestations. RSTUF ("TUF as a service", OpenSSF incubating, 1.0 RC in 2025) exists precisely because deploying raw TUF is hard.

### 1.2 Sigstore — keyless signing + transparency logs

- **Fulcio** issues short-lived certs binding an OIDC identity (e.g., a GitHub Actions workflow) to an ephemeral key; **Rekor** is the append-only transparency log; the **trust root is distributed via TUF** with periodic public root-signing ceremonies (sigstore/root-signing).
- **Rekor v2 GA 2025-10-10**: rebuilt on tile-based logs (Trillian Tessera), *annual shards* with explicit URLs (`log2025-1.rekor.sigstore.dev`) distributed via TUF — deliberately copying Certificate Transparency's deployment model. Simplifications: entry types reduced to `hashedrekord` + DSSE, search index dropped, log no longer stores attestations (users persist them), few-second batching latency in exchange for witnessing/cheaper ops. Lesson: even the flagship transparency log had to shrink scope to stay operable.
- **npm provenance** (Sigstore-backed) GA 2023-10-03: links a published package to source repo + build workflow. **npm Trusted Publishing (OIDC) GA 2025-07-31**: no long-lived publish tokens; provenance generated automatically.
- **PyPI attestations (PEP 740)** live 2024-11-14, default-on for Trusted Publishing via the official action; PGP signatures previously removed.

### 1.3 SLSA v1.1 (April 2025)

Build track L0–L3: L1 = provenance exists (forgeable), L2 = provenance signed by a hosted build platform, L3 = builds isolated, signing keys unreachable from user build steps. SLSA is the vocabulary the ecosystem converged on for "how much can this provenance be trusted"; npm/PyPI provenance is SLSA-provenance formatted.

### 1.4 Reproducible builds

- Debian: >95% of packages in trixie reproducible; `reproduce.debian.net` (rebuilderd) continuously rebuilds nearly all architectures (2025 reports).
- **Go**: toolchain builds are perfectly reproducible and independently verified (`go.dev/rebuild`); gorebuild lets anyone verify on any platform (since Go 1.21).
- **F-Droid**: ~21% of ~4,061 main-repo apps reproducible as of 2025 (visible badge since 2025-05-21); reproducibility lets F-Droid ship the *developer's* signature after independently rebuilding from source — provenance *and* upstream identity. Build infra rearchitected onto Buildbot in 2025.
- Frontend JS bundles: Vite/Rollup outputs are mostly deterministic given locked deps; nothing in the ecosystem *verifies* this routinely today — an EFS opportunity.

### 1.5 Store review models

- **F-Droid vs Play**: F-Droid builds from public source recipes (provenance-strong, 1–5 days publish latency, small catalog); Play accepts developer binaries (scale-strong, provenance-weak). Neither review model survived determined attackers; provenance vs scale is the real axis.
- **Chrome Web Store + Manifest V3**: MV3's core security move is the **remotely-hosted-code ban** — all executable code must be in the reviewed package, because attackers repeatedly shipped a clean extension then flipped behavior post-review via remote code. MV2 fully disabled July 2025. Review still failed repeatedly (see §3): review-once + silent auto-update is the structural hole.
- **Chrome's capability-diff-on-update semantic**: when an extension update's *permission warnings* differ from what was granted, Chrome **disables the extension until the user approves** the new permissions. Diffing is done on human-meaning warning messages, not raw permission strings (messageless/collapsed permissions don't trigger). This is the best shipped precedent for update capability diffs.
- **Android permission history**: the pre-6.0 install-time model **auto-granted new permissions on update if they fell in an already-approved permission group** — documented as abusable (apps silently widening access via updates; MSR 2020 "Automatically Granted Permissions in Android apps"). Android 6 (2015) moved to runtime permissions largely to kill silent escalation; group-level auto-grant *within* runtime prompts is still criticized as a residual hole (2026 arXiv follow-ups). Lesson: never infer consent for broadened authority from an old grant.
- **Android app identity**: identity = signing cert; APK Signature Scheme v3 added *proof-of-rotation lineage* (old key attests new key) because key-bound identity without rotation was unbearable; v3.1 fixed rotation targeting problems. Identity-by-raw-key always eventually needs a lineage mechanism.

### 1.6 Web app update semantics

- **Service worker lifecycle**: new SW installs but **waits** until all controlled tabs close/navigate; `skipWaiting()+clients.claim()` gives "refresh to update" but risks a half-old/half-new app (lazy chunks from the old build 404 or mismatch). SPAs don't navigate, so update checks must be manual. The platform's atomicity unit is "one SW version controls one client set" — the closest browser-native thing to a generation.
- **Version skew is a recognized product problem**: Vercel Skew Protection (GA 2024-03-19, default for new projects 2024-11-19) pins each client session to its deployment ID and routes API/asset requests to that exact deployment for up to the deployment lifetime. That is: *the industry fix for skew is content-addressed, immutable deployments + client-side version pinning* — exactly the EFS profile/generation model.
- **Meta Code Verify (2022, still maintained)**: browser extension comparing WhatsApp/Messenger/Instagram web JS against a hash manifest published to Cloudflare as a third-party "source of truth" — page-wide SRI with an external witness. Proof that "verify the web app you were served" is real but currently requires an extension and a bilateral trust deal.

---

## 2. What is emerging (proposals, drafts, betas)

- **Isolated Web Apps (IWA)** — Chrome, dev-preview/enterprise stage. Apps packaged as **Signed Web Bundles**; **app identity = Web Bundle ID derived from the signing public key**; update via a developer-hosted **Web Update Manifest** with versions and **release channels**; Chrome 143 (2025) gates policy-installed IWAs behind a Google-managed allowlist; Chrome 150 extends Windows enterprise support. **No key rotation yet** (Oct 2024 chromeos.dev: rebinding bundle ID to a new key is "planned… last resort") — identity is brittle-key-bound today. Status: real, shipping, but closed and enterprise-first; not a distribution channel a sovereign web OS can rely on.
- **WAICT** (Web Application Integrity, Consistency, Transparency) — cross-vendor draft (Mozilla, Cloudflare; discussed at Real World Crypto 2026): enforce integrity over an entire web app via a manifest committed to a transparency log. **WEBCAT** (Freedom of the Press Foundation, beta-bound, May 2026 update): blocking enforcement — page load aborts if content doesn't match the signed, transparency-logged manifest; independent ACM WebConf 2026 evaluation called it the broadest-guarantee tool surveyed. Earlier root: Daniel Huigens' (Proton) Source Code Transparency proposal (W3C 2023). This lane is converging on exactly the EFS client's need: *verifiable web app closures with transparency*, but browser-native enforcement is years out.
- **Dependency cooldowns as default**: pnpm 11 ships `minimumReleaseAge` **default 1440 min (24h)** (first major package manager to default-on); npm/yarn/bun grew equivalents in 2025–2026. Analysis across ten major attacks: eight had exploitation windows under one week — a 1–3 day cooldown blocks most compromises because detection is fast but installation is faster.
- **RSTUF 1.0** (OpenSSF incubating, RC 2025): TUF-as-a-service; PyPI/RubyGems exploring adoption.
- **npm registry hardening (post-Shai-Hulud, Sept–Dec 2025)**: classic tokens revoked entirely 2025-12-09; write-token default life 7 days, max 90; TOTP 2FA deprecated toward FIDO; trusted publishing pushed as the norm. The registry is converging on "no long-lived ambient publish credentials exist at all."
- **TUF TAP-8** (draft): self-rotation for non-root roles.

---

## 3. Incidents and deployment lessons (why things failed)

- **event-stream (2018)**: burned-out maintainer handed npm publish rights to a volunteer who shipped `flatmap-stream` malware targeting one Bitcoin wallet's build. Lessons: ownership transfer is invisible to consumers; "the package name stayed the same" is not identity continuity; npm reacted only after virality.
- **XZ Utils backdoor (CVE-2024-3094, found 2024-03-29)**: ~2.6-year social-engineering campaign; "Jia Tan" earned maintainership, shipped a backdoor via build scripts + test-blob payloads, and tried to blind oss-fuzz. Caught by one engineer noticing 500ms of SSH latency. Lessons: review and provenance don't help when the *legitimate signer* is the attacker; maintainer burnout is a structural attack surface; build-time obfuscation defeats source review — reproducible, minimal, inspectable build paths matter.
- **polyfill.io (June 2024)**: the *domain* was sold; new owner (Funnull) injected malware into 110k+ sites that hot-linked `cdn.polyfill.io`. Lesson: any mutable-name dependency (domain, CDN, tag) is a standing transfer of code-execution authority to whoever controls the name tomorrow. Content addressing is the structural fix.
- **chalk/debug etc. (2025-09-08)**: 18 packages, ~2.6B combined weekly downloads, hijacked via a 2FA-reset phish (`npmjs.help`); payload was a browser crypto-clipper rewriting wallet addresses in fetch/XHR responses. Caught in ~2 hours; ~$66 stolen. Lessons: blast radius is instant and enormous; detection is fast (cooldowns work); *crypto users are the priority target* — directly relevant to a wallet-mediated OS.
- **Shai-Hulud worm (2025-09-15; 2.0 in Nov 2025)**: first large self-replicating npm worm — stolen npm tokens in dev environments auto-published trojaned versions of every package the victim could touch; TruffleHog-harvested secrets dumped to public GitHub repos; 500+ packages; CISA alert 2025-09-23. Lesson: ambient long-lived publish credentials + automated publish = exponential propagation. The fix that worked: kill long-lived tokens, require human-bound (FIDO/OIDC) publishing.
- **Cyberhaven + ~30 more Chrome extensions (2024-12-24)**: OAuth *consent* phishing (not credential theft — MFA irrelevant) gave attackers Web Store publish rights; malicious versions auto-updated to ~2.6M users within hours over Christmas. Lessons: the store's auto-update channel is the attack's distribution arm; publish authority is the crown jewel; consent/authorization flows are phishable even with hardware 2FA on authentication.
- **GlassWorm (2025-10-17, resurfaced Nov–Dec 2025)**: self-propagating VS Code/OpenVSX extension worm hiding code in **invisible Unicode** (variation selectors, PUA); used the **Solana blockchain as un-take-downable C2**; harvested npm/GitHub creds and 49 wallet extensions; deployed SOCKS proxies + hidden VNC. Lessons: (a) review tooling must normalize/flag invisible Unicode and homoglyphs; (b) *permanent chains will be used as C2 and malware distribution — EFS included*; the client must never equate "on EFS" with "endorsed", and must expect abuse-hosting pressure.
- **Transparency-without-monitoring lessons**: CT succeeded (17B+ certs logged, Levchin Prize 2024) but **gossip/auditing never deployed** — clients don't cross-check STHs; split-view attacks remain theoretically open; the ecosystem is only now adding witnessing (Rekor v2, tiled logs). **Mozilla's Firefox binary transparency design (2017) never shipped.** **PEP 458 accepted but unshipped for ~6 years.** Lesson: elegant transparency/metadata designs die on operational cost; whoever designs EFS channels must budget the boring parts (monitors, ceremonies, expiry re-signing) or design them out.

---

## 4. Traps distilled

1. **Review-once + silent auto-update = post-install betrayal.** Every store incident above weaponized the update channel after trust was earned. Updates are the threat surface, not installs.
2. **Auto-granting broadened authority on update** (Android permission groups) — silent escalation; Chrome's disable-until-approved is the correct semantic.
3. **Identity bound to a raw signing key** (IWA today; Android pre-v3) — key loss/compromise destroys or hijacks app identity; lineage/rotation must exist from day one.
4. **Mutable-name dependencies and remote code** (polyfill.io; MV3 ban rationale) — any fetch-by-name at runtime is an unbounded future grant.
5. **Ambient long-lived publish credentials** (Shai-Hulud, event-stream, Cyberhaven) — publishing must be a deliberate, human-bound, high-ceremony act.
6. **Transparency theater** — logs/metadata nobody monitors, roles nobody re-signs, specs nobody ships (CT gossip, PEP 458, Firefox BT). Assume only mechanisms with a funded, automatic operational loop actually protect anyone.

---

## 5. What would be EFS-specific invention

- **Update channels as lenses/curator lists** with read-grade-labeled freshness — no deployed system does trust-ordered, viewer-chosen, first-attester-wins update channels. Closest cousins: F-Droid repos (user-added repos = curator choice), TUF delegations (publisher-chosen, not viewer-chosen).
- **Chain admission as the transparency log** — every release record is already in a globally-witnessed append-only structure with unforgeable timestamps; no Rekor needed. Novel: transparency is *default*, monitoring is the missing half.
- **Zero-power install** — "run anything, grant nothing" as the default execution posture; no store precedent (stores conflate distribution, review, and authority).
- **Generation rollback against permanent records** — every version of everything remains fetchable forever; rollback is a read, not a restore. No precedent system has this; TUF actively *prevents* rollback, so the two must be reconciled explicitly (attacker rollback vs user rollback).
- **Signed-envelope releases** — a release is an EIP-712 envelope record; publish authority = wallet/smart-account signature via the Kernel, aligning with where the ecosystem is heading (token-less, human-bound publishing) but with self-sovereign rather than OIDC identity.

---

## 6. EFS translation — opinionated recommendations

### 6.1 App identity: address + lineage, hash for versions, names never
Canonical app identity should be the tuple **(author smart-account address, app-root record/claimId)**. Version identity = package content hash (DATA + manifest records). Names (paths, TAGDEFs, ENS) are petnames/discovery only — never identity. This dodges the IWA trap (identity = raw pubkey, no rotation) because EFS identity is B′, an address whose keys rotate under account abstraction; it inherits Android v3's lineage insight for free. Signer changes (app transferred to a new address) must be a **loud, blocking capability-diff event** in the Shell — the event-stream lesson made visible.

### 6.2 Map TUF roles onto EFS records instead of importing TUF wholesale
- `targets` → per-app **release records** (DATA manifest: package hash/CID closure, version, OS SDK range, declared capabilities/endpoints, provenance links).
- `snapshot` → the channel's **LIST head** (consistent view of current releases; kills mix-and-match across apps in one channel).
- `timestamp` → **freshness beacon**: a tiny record with `expiresAt` re-signed on a cadence by the channel author. The envelope's `expiresAt` word gives TUF-timestamp semantics natively; an expired beacon ⇒ channel reads grade **STALE** ⇒ the client must refuse *auto*-update and say why (freeze-attack defense with honest labeling).
- `root` → the **user's lens entry** for that channel (trust is delegated by the viewer, not a repo root ceremony). Curator key compromise recovery = lens edit + REVOKE sweep; document this ops recipe before shipping channels.
- **Thresholds**: offer channel tiers — auto-install requires k-of-n independent curator attestations (TAGs from distinct authors); 1-of-1 channels are manual-install-only. This is a client policy layered above lens resolution (see gap G1).

### 6.3 Rollback: separate the attack from the feature
Keep a **local monotonic high-watermark per channel** (TUF-style) so no resolver/venue can present an old release as current; older-but-LIVE releases render as SUPERSEDED-for-this-channel. User-driven generation rollback stays first-class — permanent records make it free — but rolls back **through** the ledger: rollback to a version with a known-vulnerability deny fact warns explicitly. Handle fast-forward (compromised curator publishes absurd version) with the same recovery recipe as key compromise.

### 6.4 Updates: Chrome semantics + pnpm cooldowns + skew atomicity
- **Disable-until-approved capability diffs**: an update requesting broader capabilities/endpoints/signers than granted either runs under the *old* grants (attenuate if manifest allows) or blocks until approved. Same-authority updates may auto-apply per channel policy. Diff on human-meaning (Chrome's warning-diff insight), and include network-origin diffs as first-class.
- **Default cooldown 24–72h** measured from **chain admission time** — unforgeable, unlike registry timestamps; attackers cannot backdate. Manual override with a loud warning; emergency-fix path = extra curator attestations, not cooldown bypass by default.
- **Atomic generations**: an OS profile/app package is one content-addressed closure; never serve mixed-version chunks (the SPA skew trap). Adopt Vercel's insight natively: pin each running app instance to its closure hash; switching generations is an explicit, user-consented reload — which is also the no-forced-upgrade guarantee.

### 6.5 Zero-power install shifts review to grant-time
Running any content-addressed app with zero grants should be permissionless and safe (SES compartment, no ambient anything). All trust signals — curator attestations, provenance records, cooldown age, reproducibility badge, audit TAGs — gate **grants**, not execution. First-grant UX shows the app's trust dossier; this is where F-Droid-style provenance badges live.

### 6.6 Provenance and the OS's own trust root
- App packages carry optional **provenance records** (TAG linking package DATA → source CID + builder attestation, SLSA-style); the Shell shows "reproducible from source: verified by N rebuilders" as a graded signal, following F-Droid (developer-signature + independent rebuild) and Go (anyone-can-verify).
- The official client itself: reproducible build, release records + provenance on EFS, and a **pinned root-of-trust** (genesis manifest / profile hash) with a documented, ceremony-style rotation path — the first fetch through an HTTP/IPFS gateway is the untrusted step, exactly TUF's root.json bootstrap problem. WEBCAT/WAICT are the standards to watch and eventually align with for browser-enforced verification.

### 6.7 Publishing is a high-risk action class
Release publication = Kernel-mediated signature with human-readable preflight (files changed, capability/endpoint/signer diffs vs previous version); no long-lived publish authority exists anywhere in the OS (the npm 2025 lesson made architecture); agents may *prepare* releases but never flush them without human approval. Package intake tooling normalizes and flags invisible Unicode/homoglyphs (GlassWorm) in manifests, names, and code.

### 6.8 Expect EFS to host malware; make honesty the defense
Permanent storage + un-take-downable distribution means malicious packages, C2 payloads, and phishing apps will live on EFS forever. The defenses are the ones the protocol already claims: nothing runs with authority by default, discovery ≠ endorsement labels, deny facts propagate through lenses, and the Shell never renders "found on EFS" as "safe". Build the **channel-monitor** role (an app/service watching channels for equivocation, mass-publish anomalies, revocation floods) — transparency without monitors protected no one (§3).

---

## 7. Pressure back into EFS v2 designs (gaps)

- **G1 — No threshold semantics in lens resolution.** First-attester-wins is 1-of-n by trust order; TUF-grade channels want k-of-n independent attestations before a release is auto-installable, and read grades cannot express "LIVE but below threshold". Client can layer policy above lenses, but a normative "quorum" annotation (or a blessed pattern in ops-doctrine) would prevent every client inventing incompatible thresholds.
- **G2 — Rollback/fast-forward and curator-compromise recovery are client folklore.** SUPERSEDED exists, but per-channel monotonic high-watermarks, version caps, and the REVOKE-sweep + lens-repair recovery recipe after curator key compromise are undefined. Needs an ops-doctrine section: "update channels: freeze, rollback, fast-forward, recovery."
- **G3 — Revocation freshness floor for auto-update.** An offline client with a stale lens/deny view will treat a later-revoked release as LIVE-at-checkpoint and may auto-install it honestly-labeled. Auto-update policy needs a normative "deny-set no older than T" gate (venue-qualified), distinct from general read freshness.
- **G4 — Install-time closure verification for chunked packages.** Large-upload (EFSBytes, BYTES-* grades) intersects app install: define all-or-nothing closure verification (every chunk of every dep verified before first run) so partial availability can't yield half-verified apps.
- **G5 — No first-class app concept.** Paths/TAGDEFs are reusable and vanity paths aren't ownership; the identity tuple (§6.1), name-squatting defenses in discovery, and signer-change surfacing all live in the client with zero protocol support. At minimum, bless one identity convention in apps-cookbook so third-party clients agree on what "the same app" means.

---

## Sources (dated)

- TUF specification v1.0.34 (2026-01-22): https://theupdateframework.github.io/specification/latest/
- TUF roles/metadata docs: https://theupdateframework.io/docs/metadata/
- TAP-8 key rotation: https://github.com/theupdateframework/taps/blob/master/tap8.md
- PEP 458 (accepted; unshipped as of 2026): https://peps.python.org/pep-0458/
- PEP 458 status thread (2022): https://discuss.python.org/t/pep-458-current-status-and-next-steps-feedback-requested/17211
- RSTUF (OpenSSF incubating; 1.0 RC 2025): https://openssf.org/projects/repository-service-for-tuf/ ; https://repository-service-tuf.readthedocs.io/
- Sigstore security model / TUF root: https://docs.sigstore.dev/about/security/
- Sigstore root-signing: https://github.com/sigstore/root-signing-practice
- Rekor v2 GA (2025-10-10): https://blog.sigstore.dev/rekor-v2-ga/
- npm provenance GA (2023-10-03): https://blog.sigstore.dev/npm-provenance-ga/
- npm trusted publishing GA (2025-07-31): https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/
- npm docs — trusted publishers / provenance: https://docs.npmjs.com/trusted-publishers/ ; https://docs.npmjs.com/generating-provenance-statements/
- GitHub npm security plan (2025-09): https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/
- npm token hardening changelogs (2025-09-29, 2025-11-05): https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/ ; https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/
- PyPI attestations / PEP 740 (2024-11-14): https://blog.pypi.org/posts/2024-11-14-pypi-now-supports-digital-attestations/ ; https://peps.python.org/pep-0740/ ; https://blog.trailofbits.com/2024/11/14/attestations-a-new-generation-of-signatures-on-pypi/
- SLSA v1.1 (2025-04): https://slsa.dev/spec/v1.1/requirements ; https://slsa.dev/spec/v1.0/levels
- Reproducible Builds monthly reports (2025): https://reproducible-builds.org/reports/2025-04/ ; https://reproducible-builds.org/reports/2025-10/
- Go reproducible toolchains: https://go.dev/blog/rebuild ; https://go.dev/rebuild
- F-Droid reproducible builds: https://f-droid.org/docs/Reproducible_Builds/ ; visibility post (2025-05-21): https://f-droid.org/2025/05/21/making-reproducible-builds-visible.html ; signing-keys post (2023-09-03): https://f-droid.org/en/2023/09/03/reproducible-builds-signing-keys-and-binary-repos.html ; F-Droid in 2025 (2026-01-23): https://f-droid.org/en/2026/01/23/fdroid-in-2025-strengthening-our-foundations-in-a-changing-mobile-landscape.html
- Chrome MV3 remote-code ban: https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3 ; https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- Chrome permission warnings / disable-on-escalation: https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings ; https://chromium.googlesource.com/chromium/src/+/lkgr/extensions/docs/permissions.md
- Android runtime permissions: https://source.android.com/docs/core/permissions/runtime_perms
- "Automatically Granted Permissions in Android apps" (MSR 2020): https://dl.acm.org/doi/10.1145/3379597.3387469
- Android permission-group risk follow-up (2026): https://arxiv.org/html/2605.27667v1
- APK signature scheme v3 lineage / v3.1: https://source.android.com/docs/security/features/apksigning/v3 ; https://source.android.com/docs/security/features/apksigning/v3-1
- Service worker lifecycle / update handling: https://web.dev/service-worker-lifecycle/ ; https://developer.chrome.com/docs/workbox/handling-service-worker-updates
- Vercel Skew Protection (GA 2024-03-19; default 2024-11-19): https://vercel.com/blog/version-skew-protection ; https://vercel.com/docs/skew-protection ; https://vercel.com/changelog/skew-protection-is-now-enabled-by-default-for-new-projects
- IWA docs: https://developer.chrome.com/docs/iwa/introduction ; https://github.com/WICG/isolated-web-apps/blob/main/README.md ; signing keys (2024-10): https://chromeos.dev/en/posts/managing-isolated-web-apps-signing-keys ; allowlist (Chrome 143, 2025): https://developer.chrome.com/docs/iwa/allowlist
- Meta Code Verify (2022-03-10): https://engineering.fb.com/2022/03/10/security/code-verify/ ; https://blog.cloudflare.com/cloudflare-verifies-code-whatsapp-web-serves-users/
- Source Code Transparency (W3C 2023): https://www.w3.org/2023/03/secure-the-web-forward/talks/source-code-transparency.html
- WEBCAT paper (2025): https://eprint.iacr.org/2025/797 ; status + WAICT (2026-05-04): https://securedrop.org/news/webcat-update-independent-evaluation-waict-and-a-growing-team/
- Mozilla Binary Transparency (2017 design, never shipped): https://wiki.mozilla.org/Security/Binary_Transparency
- CT reality check (gossip/auditing gaps): https://educatedguesswork.org/posts/transparency-part-2/ ; Cloudflare Azul tiled CT log (2025): https://blog.cloudflare.com/azul-certificate-transparency-log/
- event-stream post-mortems (2018): https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident ; https://snyk.io/blog/a-post-mortem-of-the-malicious-event-stream-backdoor/
- XZ backdoor social engineering (2024): https://securelist.com/xz-backdoor-story-part-2-social-engineering/112476/
- polyfill.io attack (2024-06-25): https://sansec.io/research/polyfill-supply-chain-attack ; https://blog.qualys.com/vulnerabilities-threat-research/2024/06/28/polyfill-io-supply-chain-attack
- chalk/debug compromise (2025-09-08): https://semgrep.dev/blog/2025/chalk-debug-and-color-on-npm-compromised-in-new-supply-chain-attack/ ; https://vercel.com/blog/critical-npm-supply-chain-attack-response-september-8-2025 ; https://www.wiz.io/blog/widespread-npm-supply-chain-attack-breaking-down-impact-scope-across-debug-chalk
- Shai-Hulud worm (2025-09; 2.0 2025-11): https://unit42.paloaltonetworks.com/npm-supply-chain-attack/ ; https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem ; https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/
- Cyberhaven extension compromise (2024-12-24): https://www.cyberhaven.com/engineering-blog/cyberhavens-preliminary-analysis-of-the-recent-malicious-chrome-extension ; https://blog.sekoia.io/targeted-supply-chain-attack-against-chrome-browser-extensions/ ; https://secureannex.com/blog/cyberhaven-extension-compromise/
- GlassWorm (2025-10-17; return 2025-12): https://www.koi.ai/blog/glassworm-first-self-propagating-worm-using-invisible-code-hits-openvsx-marketplace ; https://thehackernews.com/2025/12/glassworm-returns-with-24-malicious.html
- pnpm supply-chain security / minimumReleaseAge (pnpm 11 default 24h): https://pnpm.io/supply-chain-security ; https://socket.dev/blog/pnpm-11-adds-new-supply-chain-protection-defaults ; https://cooldowns.dev/
