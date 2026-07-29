# Live probe — first-hand observations (2026-07-29, agent-driven browser)

All observed directly in a fresh browser session, no account, macOS desktop viewport 1280x720.

## Marketing surfaces (ardrive.io)

- Headline: "Pay Once. Store Forever." Sub: "Store files, apps, and pages with no subscriptions."
- Claims observed on landing page: "Unlimited Storage … no upload limits or storage caps" (tension with pay-per-byte reality), "18,000,000+ files stored", "No collection of personal data", comparison table including "Data available even if ArDrive disappears", "Inactive accounts never deleted", "The ArDrive app will outlive the company".
- Feature marketing: end-to-end encryption, permanent publishing ("sites with unbreakable links"), version tracking, file licensing (CC/UDL at upload), site/app hosting, content streaming/playlists, NFT metadata.
- Persona list marketed at: archivists, family historians, journalists, photographers, filmmakers, educators, students, designers, developers, communities.
- Testimonials: Myna Accountants (business records), RTFKT migration (Sam Cardillo), BT (NFT projects).

## Pricing page (ardrive.io/pricing, live Turbo rates 2026-07-29)

- **$29.69/GiB** one-time; slider example: **10 GB = $276.54** ("ONE-TIME COST").
- "Uploads under 100 KB are free."
- Fee framing: "File Size" charge + "Network Fee" ("paid to permanently store your data across hundreds of network nodes worldwide").
- In-app calculator (app.ardrive.io welcome screen) simultaneously showed **1 GB = $23.68564897 USD** — two different numbers visible to the same user in the same minute (GiB vs GB units and/or different rate source; either way a cost-disclosure inconsistency between marketing and app).
- Comparison table pits one-time payment against subscription clouds; "Private encryption often unavailable; risk of data leaks" (vs "Top-level encryption").

## App first-run (app.ardrive.io, v2.85.0 shown on welcome screen)

- Flutter/CanvasKit web app. Cold load: several seconds of black splash with logo before any UI; a second visit still took multiple seconds to interactive.
- **Accessibility: the page exposes an EMPTY accessibility tree** (browser a11y snapshot returned "empty page"). Canvas-rendered UI, no DOM semantics. Screen readers get nothing by default.
- Welcome screen: "Welcome to ArDrive — Are you an existing user or a new user?" → [Log In] / [Sign Up]. Version 2.85.0 printed on screen. Left panel rotates marketing cards + live price calculator.
- **Sign Up path:** "To use ArDrive you need a wallet. A wallet is a new way to log in. Instead of creating usernames and passwords, just connect your wallet." → [Create a Wallet] / "I already have a wallet". Wallet-first framing is explicit and honest; no email/social option was visible on this screen in this session.
- **Log In / Import Wallet path:** modal "Import Wallet — You can import your wallet by entering an existing seed phrase or keyfile." Seed-phrase text input + Continue, or "Use Keyfile" button. (No extension-wallet button appeared in this session; possibly only shown when the Wander extension is detected — unverified.)
- Did not proceed past these screens (no account/wallet created).

## Share-link recipient experience

- Took a public file view link of the documented format from ArDrive's own materials (`https://app.ardrive.io/#/file/95b2228e-fafe-4b09-aba7-a968b1954f28/view`, from the ArDrive/OpenSea blog era) and opened it twice, warm and cold: **both times the app landed on the Welcome/login screen; the shared file never rendered.**
  - CORRECTED INTERPRETATION (after the sharing lane read the router source): the current app *does* serve shared-file pages to anonymous visitors (`shared_file_page.dart`; router permits anonymous file/drive views). So this is not a login wall — this specific old file link fails to resolve (deleted-from-index/unresolvable UUID or resolution error) and the app's failure mode is a **silent bounce to the welcome screen with no "file not found" message**. Still a real finding, re-scoped: (a) an ArDrive-blog-distributed "forever" link no longer opens; (b) the error UX for a dead share link is indistinguishable from never having had a link at all.
- **Support-surface decay observed the same day:** `help.ardrive.io` (the Zendesk help center Google still indexes, including the File Sharing article) no longer resolves — DNS `ENOTFOUND`. `docs.ardrive.io` now redirects to ArFS developer docs on `docs.ar.io`. A user following Google results for "ArDrive file sharing help" hits a dead domain.

## Repo and hosting observations (first-hand, 2026-07-29)

- **app.ardrive.io is served via Google Firebase Hosting.** Two independent confirmations: (1) the `ardriveapp/ardrive-web` repo contains a `firebase.json` Hosting deploy config (`"hosting": {"public": "build/web", "rewrites": [{"source": "**", "destination": "/index.html"}]}`); (2) a live fetch of `https://app.ardrive.io/__/firebase/init.json` (Firebase Hosting's reserved namespace) returns an active project config (`authDomain: ardrive-web.firebaseapp.com`, `projectId: ardrive-web`, plus a Google Analytics `measurementId: G-YBJVL2GJ13`). The presence of a measurementId in the config does not by itself prove analytics is actively collecting — noted against, not asserted against, the "No collection of personal data" marketing claim.
- **v2.86.0 version bump committed the day of this research:** the repo's latest commit at probe time was `chore(version): bump version to 2.86.0 (#2171)`, dated 2026-07-29 15:42 −0400 — while the live welcome screen still showed v2.85.0. Actively developed, release imminent.

## Takeaways for EFS (from live probes alone)

1. **Link grammar is a permanence surface.** ArDrive's bytes are permanent but its app links rot. EFS deep-link grammar (`#efs1.` fragments, web3:// paths) must be versioned-forever from day one; an EFS citation link opening the minimal viewer must be treated as an Etched-tier compatibility promise.
2. **Two price quotes for the same thing in the same minute** is exactly the cost-disclosure sloppiness EFS must not have at the signing ceremony: one canonical cost pipeline, one unit (GiB or GB, pick), shown identically in marketing calculator and pre-sign summary.
3. **Canvas-rendered app = a11y zero.** Validates the surface-mode ruling (Shell owns real DOM; apps accessible by construction). Any temptation to canvas-render the EFS Files app should be treated as disqualifying.
4. **The "outlives the company" claim needs receipts.** ArDrive markets app-outlives-company while its help domain is already dead and its docs redirect — the gap between claim and observable operational care is a positioning opening for EFS ("our client is a pinned, content-addressed generation you can boot without us" is checkable, not marketing).
5. Wallet-first onboarding copy ("a wallet is a new way to log in") is decent teaching copy — short, honest, no jargon. Worth matching in tone at EFS first-run.
