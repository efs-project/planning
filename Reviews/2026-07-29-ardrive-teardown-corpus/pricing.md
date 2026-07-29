# ArDrive Teardown — Lane: Pricing & Cost-Disclosure UX

Research date: 2026-07-29. All live-API numbers were pulled directly from ArDrive/Turbo production services on this date. ArDrive is built by the team behind AR.IO (source code copyright "Permanent Data Solutions, Inc."; the AR.IO network launched its mainnet and ARIO token in early 2025 per The Block). Turbo is the payment/upload service; ArDrive is the consumer app on top of it.

## Summary

ArDrive sells one thing — "pay once, store forever" — and its entire pricing UX is built to make a crypto-metered, volatile, irreversible purchase feel like a normal web checkout. The mechanics are genuinely good by web3 standards: a $5-minimum Stripe card flow, a live price calculator, credits pegged to storage power rather than token price, a free tier for small files, per-upload cost display with a payment-method picker, gifting by email, and "you are not charged for failed uploads" in the ToS. But the disclosure story has real rot underneath. The marketing page says "no additional fees" while the payment API applies a 35% inclusive "Turbo Infrastructure Fee" to every card, AR, ETH, and USDC top-up (0% only if you pay in the company's own ARIO token) — a fee that is itemized nowhere in the app UI, only in developer docs and the API response. The current ToS quietly expires unspent credits 12 months after purchase — directly at odds with the anti-subscription pitch and with older help material that said 3 years. The famous "under 100 KB free" tier is now capped by a 10 MiB lifetime pool per wallet (and per IP) that marketing doesn't mention. And the headline price itself has drifted from "$6.35–8/GB" in old blog copy to roughly **$29.70 per GiB all-in today**, which makes the "pay a few cents once" onboarding copy actively misleading for anything bigger than documents. User sentiment is correspondingly bimodal: praise for the fiat UX, brutal arithmetic from skeptics ("2.2 TB quoted at $28,902… break-even against Backblaze B2 in 133 years").

## Findings

### 1. The real price, as of 2026-07-29 (live API)

Pulled directly from `payment.ardrive.io` (Turbo's production payment service):

- **1 GiB via Turbo = $29.69 USD all-in** (`GET /v1/rates` → `usd: 29.693`, accessed 2026-07-29). That is ~$30,400 for 1 TiB.
- **Raw Arweave network fee: ~11.22 AR/GiB** (`arweave.net/price/1073741824` → 11,221,408,166,728 winston) ≈ **$19.30/GiB** at AR ≈ $1.72 (CoinGecko, 2026-07-29).
- The gap is Turbo's margin: **a 35% inclusive "Turbo Infrastructure Fee" on every top-up**. `GET /v1/price/usd/1000` returns: `"name":"Turbo Infrastructure Fee","description":"Inclusive usage fee on all payments to cover infrastructure costs and payment provider fees.","operatorMagnitude":0.65` — you receive 65 cents of storage power per dollar. The same 0.65 multiplier applies to AR-token top-ups (1 AR → 0.65 credits). Effectively a **~54% markup** over the raw network fee.
- The fee schedule is disclosed only in developer docs (docs.ar.io "Paying for Uploads", accessed 2026-07-29): **ARIO token (Solana or Base): NO FEE; KYVE: 50%; all others: 35%.** "All others" includes credit cards, AR itself, ETH, SOL, USDC, POL.
- There is also a tiny per-file fee (`perDataItemFeeWinc: 11,627,907` ≈ $0.00003/file) — negligible but nonzero.

For context on drift: an old ArDrive blog ("How much does it cost to store on Arweave?", undated, ca. 2021–22, now only on Arweave mirrors) said the price "tends to fluctuate within a narrow range of **$6.35 to $8.00 per GB**." A Hacker News user in Feb 2024 was quoted **~$13/GB** ($28,902 for 2.2 TB). Today it's ~$29.7/GiB. The "pay once" price is anything but stable across time — it roughly quadrupled in four years while marketing copy stayed qualitative.

### 2. Turbo credits: purchase mechanics

- **Fiat flow:** Stripe checkout from app.ardrive.io (or console.ar.io / turbo.ar.io). In-app presets are **$10 / $25 / $50 / $75** plus "Custom Amount (min $5 – max $10,000)" (ardrive-web source, `topup_estimation_bloc.dart`: `presetAmounts = [10, 25, 50, 75]; minCardAmount = 5; maxAmount = 10000`, accessed 2026-07-29). The live checkout endpoint rejects $1 ("must be above 500 [cents]") and $20,000 ("must be below or equal to 1000000"), confirming **$5 min / $10,000 max** (payment.ardrive.io, 2026-07-29).
- The in-app top-up dialog is USD-only (`supportedCurrencies = ['usd']`), though the payment service itself quotes 10 fiat currencies (AUD, BRL, CAD, EUR, GBP, HKD, INR, JPY, SGD, USD).
- **Conversion display:** the top-up dialog shows `"USD 25.0 = 9.44 Credits ~ 0.86 GB"` — dollar → credits → storage estimate — with a "How are conversions determined?" link that opens the docs page (source: `top_up_dialog.dart` `PriceEstimateView`). **The 35% fee is never itemized**; it is silently embedded in the credits-received number. Copy reassures: "This is a one-time payment, powered by Stripe" and "Credits will be automatically added to your Turbo balance, and you can start using them right away" (app_en.arb).
- **Crypto top-ups:** AR, ETH, SOL, USDC (Ethereum/Base/Polygon), ARIO, POL, KYVE — same 35% fee except ARIO (0%) and KYVE (50%). Paying the fee-free path requires holding the company's own token, a pattern worth calling what it is: a token-utility subsidy dressed as a discount.
- **Credits are pegged to storage power, not price:** "Credits maintain a 1:1 peg of storage purchasing power as Arweave's data storage rates and token price fluctuate" (docs.ar.io, accessed 2026-07-29). 1 credit = 1 AR worth of upload power. This is genuinely good design: after purchase, the user's storage allowance can't be devalued by an AR price pump (in USD terms it *floats*, but bytes-purchasable stays fixed to the network rate).
- **Quotes expire:** Stripe checkout quotes carry a ~30-minute `quoteExpirationDate` (observed live). In-app, upload/top-up estimates refresh with "Fetching new quote..." / "Error fetching new quote, try again." strings.

### 3. Free tier: real, but silently capped now

- Marketing (ardrive.io/pricing, accessed 2026-07-29): "**Uploads under 100 KB are free.**" Docs: "Uploads under 100 KiB are completely free and do not require a prior top up."
- Live service reality (`upload.ardrive.io/v1/info`, 2026-07-29): `freeUploadLimitBytes: 107520` (= 105 KiB per item) **and** `freeTier: { lifetimeBytes: 10485760, ipBytes: 10485760 }` — a **10 MiB lifetime pool per wallet and per IP**. A test wallet returns `{"bytesRemaining":10485760}` from `GET /v1/account/free`.
- The app has fresh UI for this: "Free allowance used up — Your free upload allowance has been used up, so this action now requires Credits." / "This upload exceeds your free allowance and will need Credits or AR." (app_en.arb, accessed 2026-07-29). The client treats the allowance as advisory and fails open (source comments in `turbo_free_allowance.dart`).
- I could not find the 10 MiB lifetime cap or the per-IP cap documented on the marketing site or in docs.ar.io's user-facing pricing text — the unqualified "under 100 KB is free" claim survives while the backend now enforces a lifetime budget. The per-IP pool also means shared-IP users (offices, VPNs, campuses) exhaust each other's free tier.
- Free uploads are labeled honestly in the upload dialog: "Cost: 0 AR — This small transaction is free thanks to Turbo."

### 4. Cost disclosure before the irreversible upload (actual dialog copy)

From ardrive-web source (accessed 2026-07-29), the upload review dialog shows, before confirming:

- File list with sizes, then "**Total Size:** X".
- A payment-method selector with per-method cost: "**Cost: {n} AR**" (wallet) or "**Cost: {n} Credits**" (Turbo), plus "Wallet Balance: {x} AR" / "Turbo Balance: {y} Credits" and a "Use Turbo Credits" toggle.
- Insufficient-balance branches: "Insufficient Credit balance for purchase. **Add Credits**" / "Insufficient AR balance for purchase." / "Insufficient balance to pay for this upload. You can either … add Turbo credits to your profile…" — dead ends route into the top-up modal.
- Permanence is disclosed with unusually direct copy: "Files uploaded here will be permanently viewable by anyone on the internet. Make sure you intend on making this data public." Onboarding: "**Remember: There is no delete button (for you or us)!**", "Once uploaded, your data can't be removed.", and the cheeky "Think twice before uploading all your teenage love poetry..."

The gap: **cost at the moment of commitment is denominated only in AR or Credits — no fiat equivalent in the upload dialog.** The dollar translation exists only back in the top-up flow. A user deciding whether a 2 GB upload is "worth it" sees "Cost: 22.4 Credits," not "$59".

### 5. "Pay once, store forever" framing — and its critics

- Marketing leans entirely on subscription-fatigue psychology: "Pay once, store forever. No subscriptions, just permanent preservation and access." A comparison table contrasts "Monthly subscription fee" vs "One time payment per file," "Inactive accounts never deleted," "Data available even if ArDrive disappears," "The ArDrive app will outlive the company" (ardrive.io/pricing, accessed 2026-07-29). In-app onboarding: "Say goodbye to storage subscriptions! Instead of paying for space you don't use, just pay once to store your data forever" and "pay a few cents once" (app_en.arb). At ~$29.7/GiB, "a few cents" is only true for documents; a phone video is dollars, a photo library is hundreds.
- The economic engine is Arweave's endowment: most of the network fee is escrowed to pay for future storage, on the assumption storage costs keep declining (protocol assumes a conservative 0.5%/yr decline vs a ~30%/yr historical trend; the guaranteed floor is ~200 years, not literally forever — ArDrive's own blog and permaweb-journal explainers concede this).
- Skeptics are blunt. HN, 2024-07-02: "The Arweave endowment is just one of these crazy schemes crypto folks think up… They may as well just mint extra tokens… BTW, Arweave doesn't guarantee permanent archival – nodes are free to decide what to archive." HN, 2024-02-24: "I currently have 2.2 TB… ArDrive is quoting me $28,902. It will break even against Backblaze B2 in 133 years," with a reply computing Glacier Deep Archive break-even at ~600 years. The pattern: for bulk personal storage the one-time price loses catastrophically to monthly cloud pricing; permanence only pencils out for small, high-value, must-survive data.
- The monthly-pricing psychology comparison: $29.7 stores 1 GiB forever; $9.99/mo buys 2 TB on Google One. ArDrive wisely never puts a $/GB figure in static marketing copy — only the live calculator — which avoids sticker shock but also means no durable, quotable price anchor.

### 6. Refunds, expiry, and the fine print (live ToS, ardrive.io/tos-and-privacy, accessed 2026-07-29)

- "**All sales final.** Except where required by applicable law, all purchases of Credits are final and non-refundable." EU-style withdrawal rights are waived on issuance.
- "**Expiration. Credits expire twelve (12) months after the date of purchase.** We may, but are not obligated to, notify you before expiration. Expired Credits are forfeited…" — This is the sharpest finding in the lane. It contradicts the anti-subscription pitch (your prepaid balance is on a 1-year clock) and conflicts with older ArDrive Turbo help-center material that said credits "may expire after 3 years" (per search-indexed copies; the help center itself is gone — see below). I could not establish when the term tightened; treat "12 months, current" as verified and the history as unverified.
- "Credits are **non-transferable** and may not be sold, assigned, or exchanged. Credits cannot be redeemed for cash or exchanged for AR or any other cryptocurrency."
- "**Failed uploads.** You are not charged Credits for uploads that fail." — a genuinely user-friendly commitment.
- Permanence liability shifted wholesale to the user: "WE HAVE NO ABILITY TO DELETE FILES… YOUR UPLOADING OF ANY FILES TO THE PERMAWEB SHALL BE PERMANENT AND YOU ASSUME ALL RISKS."
- "Prices are displayed at checkout and may change at any time."

### 7. Paying in AR directly

Still supported as an alternative to credits ("This upload requires Credits or AR"). The ToS frames it as "a transaction between you and the Arweave network." The app adds the **ArDrive community tip** on AR-paid uploads — percentage read live from the ArDrive PST smart contract (`settings.fee`, set to 15% by DAO vote), minimum tip 0.01 AR (`community_oracle.dart`, accessed 2026-07-29). So AR-direct ≈ network fee + 15% (~$22.2/GiB equivalent today) vs card ≈ +35% — cheaper, but the user must self-custody AR, and nothing in the UI surfaces this trade-off; the dialog just shows two costs in two different units (AR vs Credits).

### 8. Calculator, gifting, sharing

- **Calculator:** ardrive.io/pricing embeds an "ArDrive Price Calculator — Live rates from Turbo" with presets 5 MB → 1 TB; a standalone SPA lives at prices.ardrive.io. Static copy explains the two cost drivers ("File Size" and "Network Fee"). Rates are fetched live — nothing cached or printed, so no stale-price liability, but also no offline anchor.
- **Gifting:** turbo.ar.io/gift lets anyone buy credits for an email address; recipient redeems in-app ("Redeem Your Gift", "Please confirm the email address the gift was sent to and enter the gift code", "Gift Redeemed!", plus "The code provided has already been redeemed" error paths — app_en.arb). Gifting coexists a bit awkwardly with the ToS "non-transferable" clause (gifts are new-credit purchases, not transfers, but no user reads it that way).
- **Credit sharing:** delegated spending — share credits to specific wallets with revocable approvals, spend limits and expiration (docs.ar.io "Credit Sharing", accessed 2026-07-29). Positioned for teams/onboarding/education. This is more sophisticated than anything comparable in consumer cloud storage.

### 9. Marketing site vs in-app vs docs — three different stories

- **Marketing** (ardrive.io/pricing): "you pay once… No renewals, no data caps, **and no additional fees**." False as experienced: the 35% top-up spread is a fee by any definition, and credits expire.
- **In-app**: honest about permanence, quiet about fees (embedded in conversion), cost in crypto units at upload time, fiat only at top-up time.
- **Developer docs** (docs.ar.io): the only place the fee table (0%/35%/50%) is printed.
- Meanwhile the old **help center is dead**: help.ardrive.io no longer resolves (NXDOMAIN, checked 2026-07-29) while still ranking in search results and being referenced across the web — support content migrated to docs.ar.io/ardrive.io with broken trails left behind.

## Strengths (genuinely better than typical web3)

1. **Fiat-first onboarding that actually works.** $5 minimum, card via Stripe, presets, instant credit, no gas, no token purchase required. For 2023-era web3 this was category-leading and it still is.
2. **Storage-power-pegged credits.** Users buy bytes, not a volatile token. Post-purchase, an AR price spike can't shrink what they already paid for.
3. **Cost confirmation before every irreversible action**, with per-method costs, balance display, and graceful insufficient-funds → top-up routing. Failed uploads aren't charged (in the ToS, not just a promise).
4. **Unusually honest permanence UX copy.** "There is no delete button (for you or us)!" is better disclosure than most of crypto manages.
5. **Free small-file tier** lets a new user complete the entire value loop (upload → permanent file) with zero payment — an excellent conversion design, now abuse-capped server-side with client UI that degrades gracefully.
6. **Gifting and delegated credit sharing** (limits + expiry + revocation) are real, shipped features with no consumer-cloud equivalent.
7. **Live price calculator** on the marketing site rather than stale printed prices.

## Weaknesses / user pain

1. **The 35% fee is functionally hidden.** "No additional fees" on the pricing page vs a 35% inclusive spread in the payment API is the single worst disclosure in the product. Users can only infer it by noticing $10 buys less storage than the calculator's $/GiB implies.
2. **Credits expire in 12 months**, buried in the ToS, with notification explicitly optional. This converts "pay once" into "use it or lose it" for prepaid balances and appears to have been tightened from 3 years without visible announcement (unverified).
3. **Token-steering economics:** 0% fee only in ARIO. Reasonable tokenomics; poor neutrality for a product marketed as simple consumer storage.
4. **No fiat at the decision point.** Upload dialogs price in AR/Credits; the human question "how many dollars is this?" is answered only at top-up time.
5. **Wild long-run price volatility of the "one-time" price:** ~$6–8/GB (2021-22 blog) → ~$13/GB (Feb 2024, HN) → ~$29.7/GiB (2026-07-29 live). Nothing in the product communicates that waiting or timing matters, and old $/GB claims float around the web uncorrected.
6. **Bulk storage economics are indefensible** vs Backblaze/Glacier/Google One and users do the math publicly ("break even… in 133 years"). ArDrive has no counter-positioning in-product (e.g., "put your archive-grade 1% here, not your NAS").
7. **Free-tier terms silently changed** (10 MiB lifetime per wallet and per IP) while marketing still says "under 100 KB is free" without qualification.
8. **No refunds, no cash-out, no transfer, no conversion back to AR** — combined with expiry, prepaid credits are the least user-favorable stored-value instrument this side of an airline voucher.
9. **Broken support trail:** dead help.ardrive.io domain still referenced across the web.

## Implications for the EFS file browser

1. **Never let a fee live only in the API.** If EFS (or any mirror/carrier flow, including ar:// via Turbo) has a spread between raw network cost and user price, itemize it in the payment UI: "Network fee X + service fee Y." ArDrive's "no additional fees" vs 35% reality is the trust-destroying pattern to design against.
2. **Quote fiat at the commit point.** The write/pin confirmation in Files should show token cost AND a fiat estimate, with a short-lived auto-refreshing quote (ArDrive's "Fetching new quote…" pattern is right; its credits-only denomination is not).
3. **Free-tier onboarding works — but disclose the cap.** A free allowance for small writes (EFS metadata/anchors are tiny) is the best activation lever in this category. Show remaining allowance in the UI (ArDrive added the states only after the cap bit users); expect shared-IP pools to cause support noise.
4. **If EFS ever holds prepaid balance, publish expiry/refund terms in the purchase UI itself**, not the ToS. "Credits expire in 12 months, we may not warn you" is the anti-pattern; balances that never expire are a marketable differentiator now.
5. **Sell permanence honestly and scoped.** The "pay once, store forever" pitch draws public break-even arithmetic and endowment skepticism. EFS should position ar:// mirroring as "archive-grade permanence for the files that deserve it," priced per-file with the trade-off explicit — not as cloud-storage replacement.
6. **Steal the good copy.** "There is no delete button (for you or us)", per-method cost + balance in one dialog, "you are not charged for failed uploads," and gift/delegated-spend flows are all directly portable ideas for a web-OS file browser paying for on-chain writes.

## Sources

- https://ardrive.io/pricing — marketing pricing page, calculator, comparison table (accessed 2026-07-29)
- https://ardrive.io/tos-and-privacy/ — live ToS: refunds, 12-month credit expiry, non-transferability, failed-upload policy, permanence disclaimer (accessed 2026-07-29)
- https://docs.ar.io/build/upload/turbo-credits — Turbo credits docs: fee table (ARIO 0% / KYVE 50% / others 35%), 100 KiB free, peg, credit sharing (accessed 2026-07-29)
- https://payment.ardrive.io/v1/rates, /v1/price/usd/…, /v1/price/arweave/…, /v1/top-up/checkout-session/… — live prices ($29.69/GiB), 35% "Turbo Infrastructure Fee" (operatorMagnitude 0.65), $5 min / $10,000 max, ~30-min quote expiry (queried 2026-07-29)
- https://upload.ardrive.io/v1/info — free tier limits: maxItemBytes 107,520; lifetimeBytes/ipBytes 10,485,760 (queried 2026-07-29)
- https://payment.ardrive.io/v1/account/free?address=… — per-wallet free allowance endpoint (queried 2026-07-29)
- https://arweave.net/price/1073741824 — raw network fee 11.22 AR/GiB (queried 2026-07-29); AR/USD $1.72 via CoinGecko API (2026-07-29)
- https://github.com/ardriveapp/ardrive-web (dev branch) — `lib/l10n/app_en.arb` (all quoted UI copy), `topup_estimation_bloc.dart` (presets/min/max), `top_up_dialog.dart` (conversion display), `payment_method_selector_widget.dart` (upload cost dialog copy), `turbo_free_allowance.dart` + `turbo_free_status_message.dart` (free-allowance UX), `packages/pst/.../community_oracle.dart` (community tip from contract), `misc/resources.dart` (gift/help links) (accessed 2026-07-29)
- https://github.com/ardriveapp/turbo-payment-service — payment service source, per-currency min/max constants (accessed 2026-07-29)
- https://news.ycombinator.com/item?id=39488133 — "2.2 TB… $28,902… break even against Backblaze B2 in 133 years" (2024-02-24) and Glacier Deep Archive reply
- https://news.ycombinator.com/item?id=40859447 — endowment skepticism: "crazy schemes… nodes are free to decide what to archive" (2024-07-02)
- https://permaweb-journal.arweave.net/article/storage-endowment-explained.html and ArDrive blog "Can data really be stored forever?" (Arweave mirror) — endowment mechanics, 0.5%/yr decline assumption, 200-year floor
- ArDrive blog (Arweave mirror, ca. 2021-22): "How much does it cost to store on Arweave?" — historical "$6.35–$8.00 per GB" claim
- https://cryptoadventure.com/ardrive-review-2026-permanent-storage-on-arweave-arfs-and-turbo-uploads/ — third-party review (2026-02-21)
- https://www.theblock.co/post/342404/ — AR.IO mainnet + ARIO TGE context
- help.ardrive.io — DNS NXDOMAIN (checked 2026-07-29); formerly hosted Turbo help incl. the older "may expire after 3 years" credits language (via search-indexed copies; conflict noted)
