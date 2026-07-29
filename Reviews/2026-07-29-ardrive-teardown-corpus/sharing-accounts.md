# ArDrive Teardown — Lane: Accounts, Identity, Sharing, Permissions

Research date: 2026-07-29. Sources: live ardrive.io / app code (ardriveapp/ardrive-web, `dev` branch), GitHub release notes and issues, docs.ar.io, and Wayback Machine captures of the now-offline help.ardrive.io Zendesk help center. Where a claim comes from code rather than docs, that is stated.

## Summary

ArDrive has no accounts in the web2 sense: an "account" is an Arweave wallet, full stop — but by mid-2026 they have made "wallet" surprisingly ecumenical, with deterministic Arweave-wallet derivation from MetaMask (Ethereum) and Phantom/Solflare (Solana) signatures, in-app wallet creation, and seed-phrase/keyfile import. Identity is resolved cross-chain (ArNS primary names, ENS, SNS, with avatars) and displayed identity-first in the profile UI. Sharing is capability-URL based: public items share a plain app link; private items embed the raw AES drive/file key in the URL fragment. Recipients need no account to view or download, which is genuinely better than most web3 apps. But that is where the good news ends: there is no permission model at all — no read-only vs. edit distinction (everything shared is read-only by physics; only the owner's wallet can ever write), no folder sharing, no revocation, no expiry, no "shared with me" that survives a device change, no teams, no comments, and a password that "can never be changed or recovered." The one genuine delegation primitive in the stack — Turbo credit spend-approvals — lives outside the ArDrive app. The support ecosystem contracted in 2025: the mobile app was sunset in October 2025 and the Zendesk help center was decommissioned the same month, with support consolidated to Discord and docs.ar.io.

## Findings

### 1. What an "account" is

An ArDrive account is exactly an Arweave wallet keypair; there is no server-side account record, no email option, and no custodial tier. The archived help center is explicit: "your wallet … cannot be recovered by ArDrive" (help.ardrive.io, "How Do Keyfile and Seed Phrase Login Work?", article dated 2023-07-19, Wayback capture accessed 2026-07-29).

Login options on the current login screen (from `lib/authentication/login/views/prompt_wallet_view.dart`, dev branch, accessed 2026-07-29):

- **Continue with Arweave** — Wander (formerly ArConnect) browser extension.
- **Continue with Ethereum** — MetaMask. Signing two messages deterministically derives an Arweave wallet from the Ethereum wallet (help article "Log Into ArDrive: MetaMask Wallet", 2024-04-17, Wayback). The button only appears if the extension is detected, which itself generated a confused bug report (ardrive-web issue #2069, Sept 2025).
- **Continue with Solana** — Phantom or Solflare, shipped in v2.82.0 (2026-06-17): "Deterministic Arweave wallet derivation from Solana signature," with a wallet-picker modal when both extensions are installed.
- **Import Wallet** — 12-word seed phrase or Arweave keyfile (JSON JWK).
- **Create a Wallet** — in-app generation of seed phrase + downloadable keyfile (shipped in ArDrive 2.6, per permaweb.news, 2023).

**Password semantics are a standout policy decision.** At first login the user creates a password that encrypts the wallet locally for the session/device. The in-app copy (l10n `app_en.arb`): "Your password can never be changed or recovered. Please keep it safe!" — with the developer note "the password cannot be changed as it is the one of the wallet." The password participates in private-drive key derivation, so it is cryptographically load-bearing, not just a session lock; there is no rotation, ever. For MetaMask-derived wallets the 2024 help article warned that "entering a different password will prevent access to the newly created Arweave wallet. It can not be changed or recovered by an administrator." The 2026 profile-card copy instead stresses determinism ("Your Arweave wallet is deterministic — it will always be the same when you sign in with the same Ethereum wallet," `profile_card.dart`). These two framings are in tension; I could not fully verify whether current cross-chain derivation still incorporates the password or only uses it as local encryption. Flagged as unresolved.

**No email, no custodial option, no recovery.** The closest thing to an email touchpoint was credit **gifting**: gift.ardrive.io let anyone buy Turbo credits with a card and email a redemption code; the recipient created a wallet and redeemed it (help article "Gifting Credits", 2023-12-14, Wayback). Notably, v2.82.0 (2026-06-17) "Remove[d] gift section from profile dropdown," and current docs.ar.io language says gifting is "not currently possible" — the feature appears to have been quietly walked back. Sources conflict on its current status.

### 2. Profile names, avatars, identity display

ArDrive went from raw addresses to a fairly rich cross-chain identity layer:

- **ArNS primary names**: the app resolves the AR.IO Name System primary name for a wallet and shows it instead of the address, with the name's logo/avatar if set (`ARNSRepository.getPrimaryName(..., getLogo: true)` in `owner_field.dart`; ArNS primary names docs at docs.ar.io/guides/primary-names, accessed 2026-07-29). Names are registered/managed in AR.IO's separate arns.ar.io app, not inside ArDrive — ArDrive only displays them.
- **Cross-chain names** (v2.82.0, 2026-06-17): ".sol name resolution (SNS/Bonfida) with PFP; .eth name resolution (ENS/ensdata) with PFP; deterministic pixel-grid avatar with wallet-type colored ring." So an Ethereum user who logs in with MetaMask sees their ENS name and avatar in ArDrive.
- **Identity-first profile dropdown** (v2.82.0): avatar + name/address + account stats at top; a wallets accordion shows both the source chain address (ETH/SOL with Etherscan/Solscan links) and the derived Arweave address (Viewblock link).
- **Owner identity on shared content**: the shared-file page shows the owner's address resolved to an ArNS name + logo, linking to `https://<name>.<gateway>` (`owner_field.dart`). Fallback is the truncated raw address.

Counterpoint: identity of *uploads* is leaky. Open issue #1717 (2024-04-17, still open, zero responses as of 2026-07-29) reports that wallet-paid data items appear "signed by an ardrive-owned key" with the actual file owner nowhere in tags — the uploader couldn't prove which wallet uploaded their own data.

### 3. Multi-device and session handling

- **Owned drives roam automatically**: because all ArFS metadata is on-chain, logging in with the same wallet on any device rediscovers all drives. Private drives additionally need the (unchangeable) password. Login flow copy celebrates this: "We found your drives!" for returning users (v2.82.0 notes).
- **The cost is sync**: every device rebuilds a local index (Drift/IndexedDB) from gateway GraphQL. This was painful enough that v2.85.0 (2026-07-03) is almost entirely a sync overhaul — "Incremental syncs (no changes) reduced from 130 GraphQL calls / 376 seconds to 3 calls / <1 second." Read that again: before July 2026, opening the app with no changes could take six minutes of sync. v2.80.0 (2026-05-14) added "disable auto sync" and per-drive syncing as mitigations, and fixed "drives would start as empty when using Wander."
- **Attached (other people's) drives do not roam.** Attach state lives in the local database only; nothing on-chain records that you attached someone's drive. "Import user's attached drives on new devices" was filed as issue #10 in August 2020 and closed without shipping. On a new device you must re-attach from the link/ID — i.e., "shared with me" is per-device and lossy.
- **Sessions**: keyfile/seed users unlock with their password each session; the encrypted wallet stays on-device "until you opt to forget wallet" (keyfile help article, 2023). Extension-wallet users re-authenticate via the extension. Private drive keys are held in memory for the session (v2.57.2, 2024-11-19). Mobile had biometric unlock; mobile is dead (below). No concurrent-session management for the account itself (the "session expired/concurrent session" warnings in v2.78.0 relate to payment top-up flows).
- **Multi-account is unsupported**: "login with multiple wallets and switch between them" is an open, unanswered feature request (issue #1776, 2024-07-02).

### 4. Sharing

Link anatomy, verified from source (`lib/utils/link_generators.dart`, accessed 2026-07-29):

| What | Link |
|---|---|
| Public drive | `{origin}/#/drives/{driveId}?name={driveName}` |
| Private drive | `{origin}/#/drives/{driveId}?name={driveName}&driveKey={base64}` |
| Public file | `{origin}/#/file/{fileId}/view` |
| Private file | `{origin}/#/file/{fileId}/view?fileKey={base64}` |

Observations:

- **Keys ride in the URL, but in the fragment.** Everything after `/#/` (Flutter hash routing) never reaches the server in the HTTP request, so the gateway/app host doesn't see the key. But the full key sits in chat logs, browser history, and anything that unfurls the URL. The help center's entire mitigation was a warning: "Make sure you know & trust who you're sharing your Private Drive & Files with… It is not recommended to share Private Drives & Files on public platforms" (Drive Sharing article, updated 2023-11-04, Wayback).
- **No revocation, no expiry, no scoping — and none possible.** "They will have access to the file forever" (File Sharing article, 2023-06-14). The same article promised "the option to limit the spread of link sharing in future versions of ArDrive"; three years later nothing shipped. Because the ciphertext is permanent on Arweave, a leaked file/drive key is an irreversible compromise — there is no re-encrypt, no rotate, no unshare. This is the sharpest policy edge of building sharing on immutable storage, and ArDrive's product answer is a sentence of copy.
- **Folders cannot be shared.** "Sharing is only for Public Drives, Private Drives, and individual files. Folders cannot be shared at this time" (File Sharing article; still true as far as I can verify in the current code — only drive and file link generators exist). The sanctioned workaround for public content is creating a **manifest** ("a special kind of file that maps any number of Arweave transactions to friendly path names," in-app copy), which yields a gateway-served folder-like URL.
- **ArNS names as share URLs**: since v2.52.0 (2024-09-17) users can assign ArNS names and undernames to public files and manifests, producing human-readable permanent links (`https://name.gateway.tld`) instead of 43-character transaction IDs. This is a genuinely distinctive sharing feature — friendly, permanent, gateway-agnostic URLs.
- **Links hit the app + a gateway.** The share link opens app.ardrive.io (or ardrive.net, a gateway-served permaweb deployment of the same app — which returned an HTTP 504 on first request when I tested it on 2026-07-29, then loaded; an open issue #2115 asks, unanswered, which of the two sites is official). File bytes come from the configured data gateway — default switched to turbo-gateway.com with fallback to the AR.IO gateway list and arweave.net (v2.82.0). Power users can also just copy the raw data-tx gateway URL from the file details.

**Recipient experience (no account needed).** A recipient clicking a file link gets a dedicated shared-file page: file name, size, preview, Download button, revision history, license info, and owner identity (ArNS name/avatar or address) — no login wall (`shared_file_page.dart`; router allows anonymous viewing of shared files and public drives, `app_router_delegate.dart`). Private links decrypt in-browser with the fragment key, labeled "This file is encrypted." A logged-in recipient of a drive link gets an **Attach Drive** flow (ID + name + key pre-filled from the link) that mounts the drive read-only in their sidebar under a "Shared Drives" section. Attach is also manual: paste a drive ID (and key if private) — used for cross-referencing any drive you know the ID of.

### 5. Permissions and collaboration: there are none

Blunt version: ArDrive is strictly single-owner. Every ArFS write must be signed by the drive owner's wallet, so:

- No write-sharing, no editor role, no shared drives with roles, no teams product, no organization/business tier (nothing in app, site, or docs as of 2026-07-29).
- "Allow users to share write access of a drive to other users… enable users to collaborate on a single drive with people they trust" was filed as **issue #12 in August 2020** — the second-oldest feature request in the repo — and closed in October 2020 without shipping. Six years later nothing equivalent exists.
- No comments, no annotations, no shared editing, no activity feed of collaborators (there are only file revision histories of the single owner).
- "Sharing" in ArDrive always means read access. The read/write asymmetry is total: reads are capability-URLs anyone can hold; writes are the owner's wallet alone.

The one real delegation primitive in the wider stack is **Turbo credit sharing**: a credit holder can create a signed Credit Share Approval authorizing another wallet to spend some of their credits, with optional expiry; approvals are revocable by the owner only, and shared credits can't be re-shared (docs.ar.io "Paying for Uploads"/Turbo credit-sharing docs, accessed 2026-07-29). That's payment delegation, not data permissions — and it surfaces in console.ar.io and the Turbo CLI/SDK rather than the ArDrive app UI.

### 6. What users ask for, and the support ecosystem

The public GitHub tracker is sparse (17 open issues; support historically flowed to Zendesk and Discord), but the asks that exist map cleanly to the gaps above: write-sharing/collaboration (#12, 2020), attached-drive portability across devices (#10, 2020), multi-wallet login (#1776, 2024, open), uploader identity on-chain (#1717, 2024, open), name-based drive URLs (#196, 2021, open). Ecosystem churn is its own finding:

- **Mobile app sunset**: announced October 2025, removed from Google Play 2025-10-08, unsupported after 2025-10-30; ArDrive told users to use the web app / install it as a PWA (ardrive.io/mobile; @ardriveapp on X, 2025-10-10). The desktop sync app died years earlier; product is now web + CLI.
- **Help center decommissioned**: help.ardrive.io no longer resolves in DNS (checked 2026-07-29), and v2.75.0 (2025-10-31) "Remove[d] Zendesk links and references." docs.ardrive.io now redirects to docs.ar.io. Support is Discord plus AR.IO's docs — noticeably developer-slanted; the user-facing how-to layer effectively lives only in Wayback captures now.
- **Forced private-drive migration**: when Wander deprecated its `signature()` API, every private drive keyed under the old scheme required an on-chain upgrade (ArFS v0.15, shipped in ArDrive v2.68.0, 2025-05-29; docs.ar.io "Upgrading Private Drives", accessed 2026-07-29). Users get a "Update Private Drives" modal warning drives "need to be updated to continue using them in the future." A third-party wallet's API decision forced a migration ceremony on all private-drive owners — an instructive systemic risk of binding encryption keys to wallet-extension signing behavior.

## Strengths

Where ArDrive is genuinely better than typical web3 apps:

1. **No-account recipient flow.** Share links open a clean viewer with preview, download, license, and owner identity — no wallet, no login, no modal begging you to connect. Most web3 apps fail this; ArDrive nails it.
2. **Cross-chain onboarding without bridges or new extensions.** "Continue with Ethereum/Solana" deterministically deriving a permanent Arweave identity from a signature is a low-friction, honest solution — no custodial middle, keyfile exportable afterward.
3. **Identity display done properly**: ArNS + ENS + SNS resolution with avatars, deterministic fallback avatars, source-chain and derived addresses both visible with explorer links. Better name-resolution breadth than most single-chain apps.
4. **ArNS names on files/manifests** — human-readable, permanent, gateway-portable share URLs are something Dropbox can't offer and most dApps haven't thought about.
5. **Honest copy.** "Anyone can access this private drive using the link above" at the moment of sharing, and "your password can never be changed" at signup. Brutal, but not misleading.

## Weaknesses / user pain

1. **No permission model whatsoever.** Single-owner writes, read-only shares, nothing else — the top collaboration request has been open-then-closed since 2020. No teams offering after six years suggests it's structural (ArFS ties writes to one wallet), not just unprioritized.
2. **Irrevocable sharing with no mitigations.** Key-in-URL with no expiry, no scope, no revocation, and permanent ciphertext means one wrong paste is forever. The promised link-spread controls (2023) never shipped.
3. **No folder sharing** — a bread-and-butter operation missing since launch; manifest workaround is public-only and a separate mental model.
4. **"Shared with me" is device-local.** Attached drives don't follow the user; recipients must keep links or re-attach per device. Known since issue #10 (2020).
5. **Password rigidity**: unchangeable, unrecoverable, cryptographically load-bearing. Combined with the Wander-driven forced migration of private drives, the account layer has repeatedly exported infrastructure churn to end users.
6. **Sync tax on every device**: minutes-long syncs until the v2.85 overhaul (2026-07); empty-drive bugs when using Wander (fixed v2.80).
7. **Ecosystem contraction and confusion**: mobile dead, help center dead (docs now developer-slanted at docs.ar.io), two official-looking app domains (app.ardrive.io vs ardrive.net) with an unanswered GitHub issue asking which is real, and the gateway-served one 504ing intermittently.

## Implications for the EFS file browser

1. **Ship a no-wallet viewer route first-class.** ArDrive proves the recipient page (preview + download + provenance, zero login) is the highest-leverage sharing surface. EFS Files should render any shared file/folder to a wallet-less visitor via a plain URL — and can beat ArDrive by making *folders* shareable day one.
2. **Adopt capability URLs, but design revocation/expiry in from the start.** ArDrive's key-in-fragment pattern is the right transport instinct, and its permanence makes leaks irreversible — their single biggest policy hole. EFS's mutable on-chain layer can genuinely differentiate: revocable grants, expiring links, re-keying — things ArDrive cannot retrofit.
3. **Make "shared with me" on-chain identity state, not device state.** ArDrive's local-only attach is a 2020-vintage known gap. EFS attachments/pins should live with the persona so shares roam across devices automatically.
4. **Permissions are open ground.** Nothing in the entire Arweave product stack offers multi-user write, roles, or teams; the only delegation is payment-side (Turbo credit approvals — itself a pattern worth stealing for EFS gas/spend delegation). EFS's account model can make read/write ACLs a headline differentiator rather than parity work.
5. **Resolve names everywhere, from day one.** ArDrive resolves ArNS + ENS + SNS with avatars and shows owner identity on every shared artifact; EFS Files should treat ENS resolution with avatar fallbacks as table stakes and ensure the true uploader is always verifiable (ArDrive has an open issue because it isn't).
6. **Don't make credentials cryptographically load-bearing without a rotation story.** ArDrive's unchangeable password and the wallet-API-deprecation migration are cautionary tales for binding encryption to wallet signatures over immutable data; EFS persona/key design should assume rotation and recovery are product requirements, not nice-to-haves.

## Sources

- https://help.ardrive.io/hc/en-us/articles/5300084402331-File-Sharing — article updated 2023-06-14; Wayback capture 2025-06-23; accessed 2026-07-29 (domain no longer resolves)
- https://help.ardrive.io/hc/en-us/articles/5300085135643-Drive-Sharing — updated 2023-11-04; Wayback capture 2025-06-23; accessed 2026-07-29
- https://help.ardrive.io/hc/en-us/articles/15412384724251-How-Do-Keyfile-and-Seed-Phrase-Login-Work — 2023-07-19; Wayback; accessed 2026-07-29
- https://help.ardrive.io/hc/en-us/articles/24857004268827-Log-Into-ArDrive-MetaMask-Wallet — 2024-04-17; Wayback; accessed 2026-07-29
- https://help.ardrive.io/hc/en-us/articles/21253961723931-Gifting-Credits — 2023-12-14; Wayback; accessed 2026-07-29
- https://github.com/ardriveapp/ardrive-web — releases v2.52.0 (2024-09-17), v2.57.2 (2024-11-19), v2.68.0 (2025-05-29), v2.75.0 (2025-10-31), v2.78.0 (2026-02-19), v2.80.0 (2026-05-14), v2.82.0 (2026-06-17), v2.83.0 (2026-06-24), v2.85.0 (2026-07-03); accessed 2026-07-29
- https://github.com/ardriveapp/ardrive-web/blob/dev/lib/utils/link_generators.dart — share-link anatomy; accessed 2026-07-29
- https://github.com/ardriveapp/ardrive-web/blob/dev/lib/components/owner_field.dart and profile_card.dart — identity resolution/display; accessed 2026-07-29
- GitHub issues: ardriveapp/ardrive-web #10, #12, #14 (2020); #196 (2021); #1717, #1776 (2024, open); #2069 (2025); #2115 (2026, open); accessed 2026-07-29
- https://ardrive.io/mobile and https://x.com/ardriveapp/status/1976697325369311485 — mobile sunset, Oct 2025; accessed 2026-07-29
- https://docs.ar.io/build/advanced/arfs and https://docs.ar.io/build/advanced/arfs/upgrading-drives — ArFS docs and private-drive upgrade; accessed 2026-07-29
- https://docs.ar.io/guides/primary-names — ArNS primary names; accessed 2026-07-29
- Turbo credit sharing: docs.ar.io "Paying for Uploads" / ardriveapp/turbo-sdk README; accessed 2026-07-29
- https://ardrive.net — gateway-served app deployment (504 then load observed 2026-07-29); https://app.ardrive.io — primary app
- https://permaweb.news/ardrive-launches-ardrive-2-6-wallet-creation-seedphrase-login-and-ardrive-turbo — in-app wallet creation (2023); accessed 2026-07-29
