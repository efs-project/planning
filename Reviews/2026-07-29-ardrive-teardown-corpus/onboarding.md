# ArDrive Teardown — Lane: Onboarding & First-Run Experience

Research date: 2026-07-29. Primary evidence: a live walkthrough of app.ardrive.io **v2.85.0** in a clean browser (no wallet extensions), the open-source `ardriveapp/ardrive-web` repo (UI strings and flow code on `master`), GitHub release notes (v2.78–v2.85, Feb–Jul 2026), current docs.ar.io pages, and Wayback captures of the now-dead help.ardrive.io Zendesk. Where the live app and historical docs disagree, both are stated with dates.

## Summary

ArDrive's onboarding is wallet-first with no email, social, or custodial option of any kind — and it is, by web3 standards, genuinely good: a brand-new user with a credit card (or a file under 100 KiB, which is free) can go from ardrive.io to a permanently stored file in roughly 3–6 minutes without ever buying AR tokens, passing KYC, or installing an extension. The app creates an Arweave wallet in-browser, explains seed phrase/keyfile/password in plain-English microcopy, and has replaced the old "re-enter 4 random seed words" quiz with a single self-attestation checkbox, trading ceremony rigor for speed. The sharp edges are real, though: the non-resettable private-drive password is introduced at step two with a terrifying and under-explained warning ("can never be changed, reset, or recovered"); the login screen hides wallet options (MetaMask, Wander, Phantom/Solflare) unless the extension is already installed, so a clean browser shows only "Import Wallet" — and the "Sign Up" button confusingly lands on a screen titled "Sign in"; returning-user login was punished by catastrophic sync times (376 seconds for a no-change sync) until fixes shipped in July 2026; and the support surface is rotting — help.ardrive.io and gift.ardrive.io no longer resolve, docs.ardrive.io redirects into AR.IO's docs, and the mobile app was killed in October 2025. The pattern EFS should copy is the free-first-file funnel plus fiat top-up plus chain-derived multi-device recovery ("We found your drives!"); the pattern to avoid is unrecoverable secondary secrets and orphaned onboarding infrastructure.

## Findings

### 1. The front door (ardrive.io → app.ardrive.io)

ardrive.io's single CTA is "Get Started" → app.ardrive.io; messaging is "Pay Once. Store Forever.", "no subscriptions" (accessed 2026-07-29). The app's welcome screen (v2.85.0, observed live) shows "Welcome to ArDrive — Are you an existing user or a new user?" with **Log In** and **Sign Up**, next to a marketing carousel and a **live price calculator**: 1 GB = $23.69 USD, translated into human units ("≈ 586 pictures, 5,286 files, 15 HD videos, 489 songs"). Putting permanent-storage pricing in human units on the login screen itself is a smart, honest move — though $23.69/GB with zero explanation of *why* (permanent endowment economics) invites sticker shock. Note the Turbo payment API quoted 1 GiB = **$29.69** the same day (payment.ardrive.io/v1/rates, 2026-07-29) — the fiat rate embeds a markup over the raw rate shown in the calculator; the delta is not explained anywhere in the UI.

### 2. Sign-up options: wallet-only, adaptively rendered

There is **no email, Google, phone, or custodial signup at all** (observed 2026-07-29). The options are:

- **Create a wallet in-app** (12-word seed → Arweave keyfile), no extension needed.
- **Import Wallet**: paste a seed phrase or upload a keyfile (the only two options visible in a clean browser).
- **Extension wallets — rendered only when detected**: "Continue with MetaMask" appears only if MetaMask is installed (confirmed by ArDrive contributor in GitHub issue #2069, Sept 2025: "The 'Continue with MetaMask' button only appears when MetaMask is detected"); same adaptive pattern for Wander/ArConnect and, since v2.82.0 (June 17, 2026), Solana's **Phantom and Solflare** (with deterministic Arweave-wallet derivation from a Solana signature, .sol/.eth name resolution). Smart wallet detection was introduced for payments in v2.78.0 (Feb 2026) listing MetaMask, Coinbase, Rainbow, Brave, Phantom, Solflare, ArConnect/Wander.

Two blunt criticisms. First, adaptive rendering means a new user researching "can I use my MetaMask?" sees no evidence in the UI that it's possible — it produced at least one confused GitHub issue. Second, the labeling is sloppy: clicking **Sign Up** lands on a screen titled "Sign in using one of the options below" whose primary button is "Import Wallet" — new users must find the small "I'm a new user" text link below it. The Log In button leads to the *same* screen. The existing/new fork at the front door is thus partially fake.

### 3. Wallet creation and the seed-phrase ceremony (current flow, v2.85.0)

Observed live (2026-07-29), the new-user path is:

1. "I'm a new user" → education screen: *"To use ArDrive you need a wallet. A wallet is a new way to log in. Instead of creating usernames and passwords, just connect your wallet."* → **Create a Wallet**.
2. Wallet generates immediately ("Setting up your account. This may take a moment" — a few seconds).
3. **"Secure Your Wallet"** modal: set + confirm a password. Exact copy: *"This password is used to encrypt your private files, and can never be changed, reset, or recovered. Be sure to store it somewhere safe."* The generated wallet address is shown as a chip with an ✕ (discard/start-over).
4. **Wallet backup screen** (from `wallet_created_view.dart` on master): the seed phrase is displayed blurred until revealed, with copy button; a keyfile **download** card ("Please store your seedphrase and download your keyfile to secure locations to continue. If you log out, you will need at least one of these to log back in."); a 3-card explainer carousel — "What is a Seed Phrase?", "What is a Keyfile?", "About security" (*"Losing them means permanent loss of access to your funds as we don't retain your wallet"*). The gate to proceed is a **checkbox**: *"I have safely backed-up a copy of my wallet."*
5. First-run education slides (from `app_en.arb`): "Welcome to the Permaweb" (*"your personal permanent hard drive. Store your data securely for at least 200 years"*), "Pay Per File, Not Per Month", "Total Privacy Control" → **"Dive in"**.

The 2023-era flow (help-center article of July 17, 2023, Wayback capture 2025-04-21; corroborated by a July 2023 Medium walkthrough) forced users to **re-enter 4 randomly chosen seed words** before the keyfile download, and put the seed ceremony *before* the password. The current flow reversed the order (password first) and downgraded verification to self-attestation. Faster, but nothing now proves the user actually saved anything before they hold a wallet whose loss is permanent.

### 4. The password problem

The password is not a login password in the web2 sense. Per the archived "ArDrive Password" help article (updated 2024-07-29): it encrypts the wallet at rest on-device and serves as **entropy for private-drive encryption**; it is never uploaded; and *"This password cannot be reset or changed if you make a Private Drive during your session… If this password is lost, you will not be able to decrypt your Private Drive data!"* Accounts with only public drives can use a different password on each device/login.

This is the single most dangerous moment in ArDrive onboarding, and the product handles it poorly: the warning fires at step 2, before the user has any concept of "private files" (private drives haven't been introduced yet), in one sentence of modal body text, with no follow-up ceremony, no strength meter shown in our observation, and no later opportunity to rotate it. A user who treats it like a normal account password — as decades of web2 have trained them to — and later creates a private drive has silently armed a data-loss trap. (To be fair: the alternative they chose — never storing the password server-side — is the honest cryptographic tradeoff; the sin is the presentation, not the architecture.)

### 5. Funding and the free path to first upload

- **Uploads under 100 KiB are free** and require no top-up, no signature, no funding at all (docs.ar.io "Paying for Uploads," accessed 2026-07-29; ardrive.io/pricing says "Uploads under 100 KB are free"). The allowance was 500 KB in mid-2023 (Medium walkthrough, July 2023) — it has shrunk.
- **Drive/folder creation is free**: metadata transactions show *"Cost: 0 AR — This small transaction is free thanks to Turbo"* (`app_en.arb`). So a brand-new, unfunded user can create a drive and upload small files end-to-end at $0.
- **Fiat**: card top-up via Stripe inside the app; presets $10/$25/$50/$75, minimum $5 card payment, $10,000 max (`topup_estimation_bloc.dart`). Credits are pegged to storage purchasing power, don't expire, and "no additional fees when credits are spent."
- **Crypto**: 8+ tokens (AR, ARIO, SOL, ETH, USDC, POL, KYVE) with published top-up fees: **ARIO 0%, KYVE 50%, everything else 35%** (docs.ar.io, accessed 2026-07-29) — a naked incentive to use the house token; the fiat markup is not itemized in-app.
- **Blocked-state copy** when unfunded: "You do not have sufficient funds to upload Files at this time. Please go to the top up page to add funds to your account."
- **AR tokens are never required** for the mainstream path — the 2023 "Fund Your Wallet" article's exchange/KYC/SimpleSwap instructions are now the legacy fallback, not the default.
- **Credit gifting/sharing**: credits could be gifted to an *email address* (gift.ardrive.io, help article Dec 2023) and shared wallet-to-wallet with spend caps/expiry (docs.ar.io credit sharing — pitched explicitly for onboarding: "Give new users free upload power for trials"). But **gift.ardrive.io no longer resolves** (checked 2026-07-29); the sharing feature lives on in AR.IO's console/CLI.

### 6. Time-to-first-upload

Counted from the observed flow: landing → Sign Up → Create a Wallet (seconds) → password → backup screen (reveal seed, download keyfile, tick checkbox) → 3 slides → empty state ("You have no personal or attached drives. Click the 'new' button to add some!") → name a drive (free tx) → upload. For a file ≤100 KiB: **~3–6 minutes, zero payment, zero identity**. With a card top-up: add ~2–4 minutes (Stripe form; credits credited "right away" per in-app copy). This is dramatically better than the 2021-era Arweave baseline (buy AR on an exchange with KYC, wait for confirmations) and better than most web3 apps, which stall at "install an extension first."

### 7. First-run education about permanence

Permanence messaging is consistent and front-loaded: "Permanent data storage" on the login carousel, "at least 200 years" in slide 1, "Pay Per File, Not Per Month" in slide 2. What's notably **missing** at upload time (per UI strings) is a hard "this cannot be deleted, ever — are you sure?" interstitial for first uploads; permanence is marketed as a benefit but its irreversibility as a *risk* (you cannot un-publish a mistakenly uploaded tax return) is not surfaced in the moment that matters. The old help center carried the caveats; the help center is now dead (see §9).

### 8. Second device / recovery

- Recovery inputs: **seed phrase or keyfile only** (plus extension wallets where applicable). Nothing else exists — no email reset, by design.
- On import, ArDrive **discovers your drives from the chain**: v2.82.0 added "Welcome Back" and *"We found your drives!"* copy for returning users. This is the genuinely great part of on-chain filesystems: the second-device story requires no sync setup, no server account — state is derived.
- The pain was performance. Until this month, returning-user login was brutal: an **incremental no-change sync made 130 GraphQL calls and took 376 seconds**; password validation alone took 9.7s. The v2.83–v2.85 releases (June 24 – July 3, 2026) rebuilt the sync pipeline (now 3 calls, <1s incremental; password validation 0.3s). ArDrive shipped a multi-minute login for heavy users for years and only just fixed it.
- Seed-phrase import is also compute-heavy (Arweave RSA keygen from mnemonic); v2.82 added "This may take a moment" dialogs to paper over it. Keyfile import is fast; the mobile deprecation notice explicitly tells users to carry the **keyfile** to web/PWA.
- Private drives on a new device require the original, unresettable password (§4).

### 9. Ecosystem/platform decay visible during onboarding

- **help.ardrive.io (Zendesk) no longer resolves** (checked 2026-07-29; last Wayback capture Oct 2025). Years of getting-started articles are gone unless the user knows about the Wayback Machine.
- **docs.ardrive.io now redirects** to docs.ar.io/build/advanced/arfs — ArDrive's docs were folded into AR.IO's developer docs, which are gateway/SDK-oriented, not end-user onboarding material.
- **ardrive.io/faq, /apps, /download 404** (2026-07-29).
- **ArDrive Mobile was discontinued Oct 30, 2025** (removed from Google Play Oct 8, 2025): "We haven't seen the level of usage and traction needed…resources better focused on the web version." The APK was archived on Arweave; users told to use keyfile + web/PWA. iOS never got a full public release.
- Corporate/context: founded 2020 by Phil Mataras (PDS → AR.IO), ~$17M raised March 2022; AR.IO launched mainnet + ARIO TGE (token now an SPL token on **Solana**); the app carries a "Solana Migration" banner since v2.80 (May 2026) and pushes fee-free ARIO top-ups. Onboarding thus now leans toward Solana-wallet users as a first-class cohort — a strange-bedfellows pivot for an Arweave product, and a moving target for anyone documenting "how do I log in."
- The web app is **Flutter canvas-rendered**: the accessibility tree is empty (observed via automation, 2026-07-29 — the page exposes no DOM elements). Screen-reader and assistive-tech users are effectively locked out of onboarding unless Flutter's hidden a11y mode is triggered; automated testing and password managers also struggle.

## Strengths

1. **Fastest crypto-free path to permanent storage in the ecosystem**: card-funded credits (min $5) or a flat-out free ≤100 KiB upload, no AR purchase, no KYC, no extension, no email. Most web3 apps still can't do "first success in 5 minutes on a clean browser"; ArDrive can.
2. **In-app wallet creation with honest plain-English education** — the seed/keyfile/password explainer cards are well-written, and generating the wallet *before* asking the user to understand it (progressive disclosure) is the right order.
3. **Chain-derived account recovery**: import a seed on any device and the app finds your drives — no account server, no sync configuration. "We found your drives!" is the payoff moment of the whole architecture.
4. **Price transparency in human units at the front door** (live calculator: 1 GB ≈ $X ≈ 586 pictures), plus free metadata transactions so trying the product costs nothing.
5. **Adaptive wallet detection** keeps the login screen minimal instead of the usual 12-logo wallet wall.
6. **Anonymity by default**: no email capture anywhere in the funnel — genuinely privacy-preserving onboarding, not just marketing.
7. **Credit sharing/gifting** as an onboarding primitive (fund a teammate/student wallet with caps and expiry) — a pattern almost nobody else in storage has.

## Weaknesses / user pain

1. **The unresettable password is a data-loss landmine**, presented in one sentence, before the user knows what a private drive is, with no rotation path ever. Web2 instincts actively sabotage users here.
2. **Backup ceremony downgraded to a checkbox** — nothing verifies the seed/keyfile was actually saved; combined with (1), the two credentials that gate everything are the two weakest moments of the flow.
3. **Misleading fork labels**: Sign Up → a screen titled "Sign in"; "Import Wallet" as the login verb; extension options invisible until installed (documented user confusion in GH #2069).
4. **Returning-user login was appalling until July 2026** (376s no-change sync, 9.7s password validation), i.e., during the entire period most current reviews were written; second-session experience is only now acceptable.
5. **Fee opacity and token steering**: 35% top-up fee on most crypto vs 0% on the house token, fiat markup not itemized (calculator says $23.69/GB while the fiat rate endpoint returns $29.69/GiB the same day), and ~$24/GB sticker price with no in-context endowment explanation.
6. **Onboarding infrastructure rot**: dead help center domain, dead gifting domain, 404ing FAQ/download pages, docs absorbed into a developer portal, mobile app killed for lack of traction. The funnel's supporting surfaces are visibly decaying even while the core app improves.
7. **Flutter-canvas web app**: no accessible DOM (screen readers, password managers, browser autofill and automated QA all degraded), sluggish input handling on the login screens.
8. **Permanence framed only as a feature, not a hazard** — no irreversibility confirmation at first upload; the shrinking free tier (500 KB → 100 KiB) also quietly moved the goalposts.

## Implications for the EFS file browser

1. **Beat 5 minutes to first file, with a $0 path.** ArDrive proves the funnel: free small writes + free namespace/metadata ops + fiat top-up for the rest. EFS's gasless faucet-drip is the analog — treat "first file on chain in under 5 minutes on a clean browser, no crypto purchased" as the acceptance test for Files.
2. **Never introduce an unrecoverable secondary secret.** ArDrive's non-resettable private-drive password is the anti-pattern: one wallet credential is enough. If EFS adds client-side encryption, derive keys from the wallet (or a rotatable, re-encryptable key) rather than a second forever-password; if a hard secret is unavoidable, gate it with a real ceremony at the moment the user creates private content, not at signup.
3. **Make chain-derived recovery the hero moment.** "Log in on any device and we found your drives" is the strongest UX argument for an on-chain FS — but ArDrive shipped it slow for years. EFS should design Files for indexer-backed instant hydration (progressive listing, cached manifests) so second-device login feels like seconds, not a sync.
4. **Adaptive auth with a visible catalog.** Detect installed wallets like ArDrive does, but list undetected options greyed-out with "install" hints — avoid the "where's my MetaMask button?" confusion. Offer an in-app/embedded wallet path for promptless new users (aligns with the EFS personas ruling) so the empty-browser case still converts.
5. **Price in human units at the point of decision, fees itemized.** Copy the front-door calculator idea (cost ≈ photos/videos), but show the fee/markup breakdown ArDrive hides, and surface permanence/irreversibility as an explicit confirmation on first write — EFS mirrors (ar://, web3://) differ in permanence semantics and the browser should say so.
6. **Don't let onboarding surfaces rot.** ArDrive's dead help/gift/FAQ domains show how auxiliary web2 infrastructure becomes the weakest link of a "permanent" product. Keep EFS onboarding docs in one place (ideally served from EFS itself — dogfooding as durability) rather than scattering Zendesk/marketing subdomains.

## Sources

- Live walkthrough of https://app.ardrive.io (v2.85.0), clean Chromium profile, accessed 2026-07-29 — welcome screen, Sign Up/Log In fork, Import Wallet modal (seed/keyfile only), wallet-education screen, "Secure Your Wallet" password modal (exact copy), price calculator (1 GB = $23.68564897 USD).
- https://ardrive.io/ and https://ardrive.io/pricing/ (accessed 2026-07-29) — "Get Started" CTA, "Uploads under 100 KB are free," calculator.
- https://github.com/ardriveapp/ardrive-web — `releases.atom` (v2.85.0 2026-07-03; v2.84.0 2026-06-26; v2.83.0 2026-06-24; v2.82.0 2026-06-17 Solana login/"We found your drives!"; v2.80.0 2026-05-14 Solana banner/Wander; v2.78.0 2026-02-19 crypto top-up/smart wallet detection); sync/password performance numbers from v2.83–v2.85 notes (accessed 2026-07-29).
- Repo source (master, accessed 2026-07-29): `lib/authentication/login/views/wallet_created_view.dart` (backup screen, checkbox, explainer copy); `lib/turbo/topup/blocs/topup_estimation_bloc.dart` (presets 10/25/50/75, min $5 card, max $10,000); `lib/l10n/app_en.arb` (onboarding slides, empty state, "Cost: 0 AR…free thanks to Turbo," insufficient-funds copy).
- GitHub issue ardriveapp/ardrive-web#2069 (2025-09-04) — MetaMask button only rendered when extension detected (contributor comment).
- https://docs.ar.io/build/upload/turbo-credits (accessed 2026-07-29) — 100 KiB free allowance, unauthenticated free uploads, top-up fee table (ARIO 0% / KYVE 50% / others 35%), credit sharing; https://docs.ardrive.io/ now redirects here (accessed 2026-07-29).
- https://payment.ardrive.io/v1/rates (accessed 2026-07-29) — 1 GiB = $29.69 USD fiat rate.
- Wayback captures of help.ardrive.io (domain dead as of 2026-07-29): "Create an Arweave Wallet with ArDrive" (article dated 2023-07-17, capture 2025-04-21 — old seed-confirmation flow); "ArDrive Password" (updated 2024-07-29, capture 2025-08-03 — cannot be reset/changed, private-drive entropy); "Fund Your Wallet" (2023-07-19, capture 2025-07-16 — Turbo vs AR-token paths); "Gifting Credits" (2023-12-14, capture 2025-10-14 — gift.ardrive.io, which no longer resolves 2026-07-29).
- https://web.archive.org/web/20251026010800/https://ardrive.io/mobile — mobile app discontinued 2025-10-30, removed from Play Store, keyfile → web/PWA (live URL 404s 2026-07-29).
- Subterranean, "Using the new ArDrive Turbo…" Medium, 2023-07-29 — 2023-era signup walkthrough (4-word seed quiz, $10 minimum, 500 KB free tier then).
- The Block, "Arweave-based 'permanent cloud' storage network AR.IO launches mainnet and TGE"; ar.io/articles/what-is-the-ario-token (ARIO as SPL token on Solana); Crunchbase/press for the 2022 ~$17M raise and 2020 founding by Phil Mataras.
- cryptoadventure.com "ArDrive Review 2026" (2026-02-21) — third-party framing of Turbo as checkout-like; key-management risk listed as primary con.
