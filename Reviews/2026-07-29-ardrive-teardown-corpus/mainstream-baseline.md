# Mainstream Drive Baseline: What Users Assume a File Browser Must Do

Lane report for the ArDrive competitive teardown / EFS "Files" app requirements. Researched 2026-07-29 against live sources (Google Drive, Dropbox, OneDrive, iCloud Drive, Proton Drive). All claims dated; conflicts flagged inline.

## Summary

By 2026 the consumer "drive" category has converged so hard that its core feature set is invisible to users — it is simply what the word "drive" means. That set is: hierarchical folders with instant rename/move/drag-drop; multi-file and folder upload with progress; rich previews (30+ formats at Google's level, including streamed video); filename search with filters plus full-text and OCR content search; per-person sharing with viewer/commenter/editor roles plus anyone-with-link URLs; a trash can with a ~30-day undelete window; version history measured in weeks; desktop sync with placeholder "files on demand"; and mobile apps with offline pinning and photo backup. The pricing anchor is equally converged: free 2–15 GB to start, ~$10/month for 2 TB (≈$5/TB/month), with 2026's twist being storage bundled into AI subscriptions (Google's AI Pro tier now leads with Gemini + 5 TB). Two findings matter most for EFS. First, several identity-defining features — true delete, cheap implicit versioning, free-feeling writes, server-side content indexing — are structurally hostile to permanent/on-chain storage, and silence about their absence reads as brokenness; they need deliberate, honest reframing. Second, Proton Drive is the existence proof that users accept capability loss (no content search, password-reset data loss, slower sync) when the product explains *why* in plain language at the moment of impact and pushes safety rails (recovery phrase) at onboarding. Proton also proves the market tolerates roughly a 2–4× price premium and a feature lag of years — but not the absence of folders, previews, sharing, or trash. That is the credibility floor EFS Files must clear.

## Findings

### 1. Upload/download ergonomics

- **Drag-and-drop of files *and* folders** (preserving structure) into the browser window is universal (Drive, Dropbox, OneDrive web). Users do not think of this as a feature.
- **Max file sizes** set the ceiling of what "a drive" handles: Google Drive 5 TB per file, Dropbox 2 TB (but web uploads above ~375 GB risk timeouts — Dropbox tells you to use the desktop app), OneDrive 250 GB ([MASV file-size roundup](https://massive.io/file-transfer/file-size-limits/), [Dropbox help](https://help.dropbox.com/sync/upload-limitations), accessed 2026-07-29). Practical lesson: the *web* upload path is fragile everywhere above tens of GB; desktop clients own big files.
- **Progress + resumability**: visible per-file progress with cancel is table stakes; silent resumable upload is expected from desktop/mobile clients, tolerated as missing on web.
- **Folder download as ZIP** is the universal answer to "download a folder" (Drive zips server-side, with size/count limits users grumble about).
- **Background/batch behavior**: uploads continue while the user navigates elsewhere in the app; blocking modal uploads read as amateur.

### 2. Folder model

- Real hierarchical folders, instant rename/move (optimistic UI — the operation *appears* instant even though the backend is eventually consistent), cut/copy/paste and drag-to-move, multi-select with shift/cmd-click, right-click context menus, breadcrumbs. List and grid views with sortable columns. This whole cluster is identity-defining.
- Google killed multi-parent files in 2020 in favor of **shortcuts** — the market has settled on single-parent trees plus link/shortcut objects, which happens to match what an on-chain anchor model can do cheaply.
- Segregation of spaces is standard: My Drive vs Shared-with-me vs Shared Drives (team-owned), OneDrive personal vs SharePoint libraries. Users expect "stuff shared with me" not to pollute their own tree.
- Cosmetic organization: starred/favorites, folder colors (Drive), pinned/recent sections on the home screen. "Recents" as a landing surface is now the default home in Drive, OneDrive, and iCloud.

### 3. Search (including content search and OCR)

- **Filename search with filters** (type, owner, date, location) is the floor.
- **Full-text content search is assumed** in the mainstream: Google Drive indexes text inside documents, and quietly OCRs images and scanned PDFs so search "sees" words in scans ([labnol Drive search guide](https://www.labnol.org/internet/google-drive-search-tips/29508), accessed 2026-07-29). OneDrive's 2026 overhaul adds OCR for PDFs natively ([PCWorld on OneDrive Copilot](https://www.pcworld.com/article/2900371/onedrive-gets-copilot-ai-features-like-file-comparisons-and-summaries.html), 2026). Dropbox offers full-text search on paid plans and "search by meaning" via Dash.
- **2026 shift — AI answers over search results**: "Ask Gemini in Drive" went GA in April 2026, with AI Overviews summarizing search results with citations ([Google Workspace Updates, 2026-04](https://workspaceupdates.googleblog.com/2026/04/ask-gemini-in-drive-now-generally-available.html); [9to5Google, 2026-03-10](https://9to5google.com/2026/03/10/google-drive-ai-overviews/)). Microsoft is shipping Copilot summarize/compare/agents inside OneDrive; Dropbox Dash does universal AI search. Natural-language "find/summarize my stuff" is rapidly moving from differentiator to expectation.
- **Proton Drive is the counterexample**: because content and filenames are E2EE, search is effectively filename-only, and community threads through 2025 complain it's poor even at that (folder must be visited before contents index) ([Proton UserVoice full-text search request](https://protonmail.uservoice.com/forums/945460-general-ideas/suggestions/49554038-proton-drive-full-text-search); [cyberly.org](https://www.cyberly.org/en/does-proton-drive-support-file-search/index.html), accessed 2026-07-29). Users complain but stay — because Proton explains the tradeoff.

### 4. Previews

- Google Drive previews **30+ file types** without opening an app: Office and Google formats, PDF, images, video (server-transcoded streaming with scrubbing), audio, text/code, archives, Photoshop/Illustrator ([TNW on Drive previews](https://thenextweb.com/news/google-drive-now-lets-you-preview-and-flip-through-over-30-file-types-including-documents-photos-and-videos); [Google support: files you can store](https://support.google.com/drive/answer/37603), accessed 2026-07-29). Dropbox is comparable, including CAD on some plans.
- The user expectation: click a file → see it immediately, arrow-key through siblings, thumbnail grids for images. Video that streams (not "download to view") is part of the identity. "No preview available" is read as the product failing, even when the format is obscure.

### 5. Sharing and permissions

- The canonical model is **Viewer / Commenter / Editor per person + link-based sharing** ("anyone with the link", org-scoped, or invited-only) ([Overdrive on Drive permission levels](https://www.overdrive.tools/blog/google-drive-permissions-explained), accessed 2026-07-29). OneDrive: view / edit / review + block-download. Dropbox: view/comment/download-but-not-edit gradations.
- **Link hygiene features are paid-tier norms, not universal**: expiring links (Google: Workspace only; Dropbox: Professional+; OneDrive: Microsoft 365), password-protected links (Dropbox paid, OneDrive paid — Google has *never* shipped password links) ([Dropbox link permissions help](https://help.dropbox.com/share/set-link-permissions); [Peony on Drive password protection](https://www.peony.ink/blog/yes-you-can-how-to-password-protect-a-google-drive-folder), accessed 2026-07-29).
- Google made **permission inheritance mandatory** for shared folders in Sept 2025 — files always inherit the parent folder's permissions ([mspoweruser Drive permissions guide](https://mspoweruser.com/google-drive-sharing-permissions-explained-a-detailed-guide/), accessed 2026-07-29). The industry is converging on folder-scoped ACLs as the mental model.
- Supporting flows users expect: request-access on a 403, notify-on-share emails, "shared with me" inbox, ownership transfer.

### 6. Versioning windows

- **Google Drive**: uploaded (non-native) files keep up to 100 revisions / 30 days, with a per-version "Keep forever" flag; Google-native docs keep history indefinitely ([Google Drive help: activity & versions](https://support.google.com/drive/answer/2409045), accessed 2026-07-29).
- **Dropbox**: 30 days (Basic/Plus/Family), 180 days (Professional/Standard/Essentials), 365 days (Advanced/Enterprise), plus a paid Extended Version History add-on; also "Rewind" to roll a whole folder back ([Dropbox version history overview](https://help.dropbox.com/delete-restore/version-history-overview), accessed 2026-07-29).
- **OneDrive/SharePoint**: default 500 versions per file ([Microsoft Learn version limits](https://learn.microsoft.com/en-us/sharepoint/document-library-version-history-limits), accessed 2026-07-29).
- **iCloud Drive**: effectively none — restores recover only the last-saved version ([Eclectic Light on iCloud recovery](https://eclecticlight.co/2023/07/20/backing-up-icloud-icloud-recovery-and-document-versions/), 2023). Proof that a mainstream drive can survive with weak versioning, but it is a documented pain point.
- **Proton Drive** markets version recovery "up to 10 years" on paid plans — using long retention as a *premium selling point* ([cloudwards Proton review](https://www.cloudwards.net/review/proton-drive/), accessed 2026-07-29).

### 7. Trash / undelete

- Every mainstream drive has a trash with a defined window: Google 30 days then auto-purge (policy since 2020-10-13; trashed items still count against quota) ([Workspace Updates announcement](https://workspaceupdates.googleblog.com/2020/09/drive-trash-auto-delete-30-days.html)); Dropbox 30/180/365 days by plan ([Dropbox data retention](https://help.dropbox.com/account-settings/data-retention-policy)); OneDrive personal 30 days, business 93 ([Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/4942816/version-history-first-second-stage-recycle-bin-que)); iCloud 30 days ([Apple support](https://support.apple.com/guide/icloud/recover-deleted-files-mmae56ea1ca5/icloud)). All accessed 2026-07-29.
- Two distinct user expectations bundled here: (a) **undo protection** — "I deleted the wrong thing, get it back," and (b) **true removal** — "when I empty trash it is *gone*" (privacy, embarrassment, legal). Mainstream drives satisfy both. Permanent storage can only ever satisfy (a) — see Implications.

### 8. Sync clients, mobile, offline

- Desktop sync (Windows/macOS) with **placeholder files / "on-demand" hydration** is the modern norm: OneDrive Files On-Demand, Dropbox Smart Sync, Drive for desktop streaming mode. Selective sync everywhere. Dropbox and OneDrive do **block-level delta sync** (only changed ~4 MB blocks re-upload); Google Drive does not, and reviewers measured Dropbox ~11× faster on large-file re-saves in 2026 tests ([cloudwards 3-way comparison](https://www.cloudwards.net/dropbox-vs-google-drive-vs-onedrive/), accessed 2026-07-29). Conflict handling = "conflicted copy" files, not merge.
- **Mobile apps** with per-file/folder offline pinning, automatic camera/photo backup, in-app document scanner (Drive and Dropbox both scan-to-PDF), and OS file-picker integration (iOS Files app / Android SAF) are assumed. iCloud's entire identity is OS-level integration.
- For EFS's web-OS context: full sync clients are out of scope for a browser-first product, but users will still ask "where's the desktop app?" — Proton took years to ship theirs and was hammered in reviews for it.

### 9. Collaboration presence

- Real-time co-editing with live cursors, comments with @mentions, and an Activity dashboard (who viewed, when — Workspace accounts) define the Google tier ([Google Docs activity help](https://support.google.com/docs/answer/7378739), accessed 2026-07-29). Drive even shows real-time presence badges on *Microsoft Office* files to prevent edit collisions.
- This is the least transferable part of the baseline: it belongs to the docs-suite layer, not the file-browser layer. Dropbox thrives without owning an editor (it badges and integrates instead). A file browser needs *awareness* affordances (who has access, what changed recently, activity feed) more than live cursors.

### 10. Pricing psychology — the anchor EFS prices get compared against

- **Free tier as the front door**: Google 15 GB, OneDrive 5 GB, iCloud 5 GB, Dropbox 2 GB, Proton up to 5 GB. Nobody pays to try a drive.
- **The 2 TB / ~$10 anchor**: Google One 2 TB $9.99/mo, iCloud+ 2 TB $9.99/mo, Dropbox Plus 2 TB $9.99/mo per the live plans page (accessed 2026-07-29; note third-party comparisons still quote $11.99 month-to-month — the $9.99 figure is likely annual-billing; treat Dropbox as $10–12) ([dropbox.com/plans](https://www.dropbox.com/plans); [allaboutcookies pricing guide](https://allaboutcookies.org/cloud-storage-pricing)). Microsoft plays a different game: Microsoft 365 Personal ≈ $7–10/mo for 1 TB *plus Office* — storage as a bundle sweetener.
- **2026 shift — storage merged into AI subscriptions**: Google folded One into AI tiers; AI Pro is $19.99/mo for **5 TB** plus Gemini, YouTube Premium Lite, etc., with 50%-off first-year promos ([Nasdaq on Google One 2026 pricing](https://www.nasdaq.com/articles/google-one-cuts-2-tb-and-ai-pro-annual-plans-50-new-2026-subscribers); [9to5Google](https://9to5google.com/2026/06/09/google-one-best-subscription-value-ai/), accessed 2026-07-29). Effective anchor: **$4–5/TB/month, trending down**, with AI framed as the thing you're actually buying.
- **The mental model is rent, not purchase.** Users think "$X/month," never "$/GB-forever." ArDrive/Arweave's pay-once-store-forever endowment is the inverse model and *cannot win a naive per-month comparison* in year one; it only wins framed as archival insurance ("cheaper than 20 years of subscriptions; survives you canceling"). EFS inherits this exact framing problem for anything stored via paid permanence mirrors.
- **Proton's premium proves privacy pricing tolerance**: Drive Plus 200 GB at $2.99–4.99/mo, Unlimited 500 GB at $9.99 — roughly 2–4× worse $/GB than Google — and it sells ([proton.me/pricing](https://proton.me/pricing); [BAIZAAR plan breakdown](https://baizaar.tools/proton-drive-pricing-plans-2026/), accessed 2026-07-29). Users pay a bounded premium for a *legible* value (privacy). Verifiability/permanence can plausibly command a similar bounded premium — not an unbounded one.

### 11. Proton Drive's UX for explaining E2EE limits (the reframing playbook)

Proton is the best live example of shipping a drive that is *structurally worse* at table-stakes features and surviving:

- **Onboarding pushes safety rails**: recovery phrase (12 words) offered at signup; support docs and in-product prompts hammer "set a recovery method or lose your data" ([proton.me/support/recovery-phrase](https://proton.me/support/recovery-phrase), accessed 2026-07-29).
- **Consequences explained at the moment of impact**: reset your password without a data-recovery method and the UI shows the encrypted-garbage state with a notification that data "couldn't be decrypted," linking to recovery docs ([proton.me/support/recover-encrypted-messages-files](https://proton.me/support/recover-encrypted-messages-files), accessed 2026-07-29). They do not hide the failure mode; they name it.
- **Absent features get a reason, not silence**: no content search "because we can't read your files" is a brag, not an apology. The limitation is converted into evidence of the core promise.
- **They backfill the gap over time** (E2EE Docs/Sheets collaboration shipped 2024–25, CLI in 2026, 10-year version history) rather than pretending the gap doesn't exist ([proton.me/drive/roadmap](https://proton.me/drive/roadmap), accessed 2026-07-29).

### 12. The prioritized checklist

**Tier 1 — identity-defining (missing = "this is not a drive"):**
1. Hierarchical folders; rename/move/delete that *feels* instant (optimistic UI)
2. Drag-drop upload of files and folders, with progress and multi-select
3. Download file; download folder as ZIP
4. Previews: images, PDF, video (streamed), audio, text/code at minimum; thumbnail grid
5. Filename search with type/date filters
6. Sharing: per-person viewer/editor + copyable link; a comprehensible "shared with me" space
7. Trash/undelete affordance with a stated window (or an honest replacement — see below)
8. Works on mobile (responsive web at minimum), list/grid + sort, Recents surface

**Tier 2 — strong expectations (absence is noticed and needs an answer):**
9. Full-text content search
10. Version history with a stated window
11. Commenter role; expiring links; block-download
12. Offline access / desktop sync story
13. Starred/favorites, activity feed ("what changed"), notify-on-share
14. Photo/camera backup (consumer segment only)

**Tier 3 — 2026 differentiators hardening into expectations:**
15. AI: natural-language search, summarize/ask-about-file (Gemini/Copilot/Dash all shipped this)
16. OCR of scans into the search index
17. Password links, granular link analytics
18. Real-time presence/co-editing (docs-layer, not file-layer)

**Structurally hard for permanent/on-chain storage — must be deliberately reframed, never silently absent:**
- **True delete** (trash → gone): impossible on Arweave-class permanence; achievable only as unlink/hide at the index layer. Needs Proton-style honest copy at the moment of deletion ("this removes it from your drive; bytes already published to permanent mirrors cannot be unpublished").
- **Cheap implicit versioning**: mainstream versioning is free and automatic; on-chain every mutation costs a transaction. Flip it: immutability means history is *native* — sell "every version, forever, cryptographically ordered" as the premium version of Dropbox's 30 days.
- **Free-feeling writes**: renames/moves/uploads costing gas breaks the "instant and free" reflex. Requires sponsored/gasless paths (EFS's faucet-drip hackathon priority is exactly right) and batching.
- **Server-side content indexing/OCR**: no operator to index for you; same boat as Proton. Client-side indexing or opt-in indexer services, with the limitation explained as a property of the trust model.
- **Sync clients and placeholders**: enormous engineering surface; out of scope for a web OS initially, but the question needs a roadmap answer.

## Strengths (what the incumbents do genuinely well)

- **Invisible reliability**: uploads resume, previews always render, search returns in milliseconds across millions of files. Two decades of polish; users' baseline is *zero* perceived failure.
- **Optimistic, latency-hiding UI**: every mutation appears instant regardless of backend consistency. This is the single most copyable lesson for a chain-backed browser.
- **Permission model legibility**: viewer/commenter/editor + link scope is understood by non-technical users worldwide. Do not invent a new vocabulary.
- **Safety nets layered by default**: trash + versions + (business) rewind means user error is almost never fatal. Users have unlearned fear of the delete key.
- **Pricing simplicity**: one number per month, one big storage number. Nobody is asked to price bytes×time.
- **Proton specifically**: converting limitations into trust signals, and onboarding that treats key recovery as a first-class flow, not a footnote.

## Weaknesses / user pain (in the mainstream baseline itself)

- **Rent forever, own nothing**: stop paying Google and your 3 TB is hostage; account termination (policy violation, lockout) is catastrophic and well-documented in user horror stories. This is EFS's strongest wedge.
- **Quota anxiety and dark patterns**: Google counts trash against quota and nags constantly; free tiers exist to convert via fear of loss.
- **Version/trash windows are silently short**: users discover the 30-day limits only when it's too late; support threads asking "what plan keeps versions longer than 30 days" are evergreen ([Google Docs community thread](https://support.google.com/docs/thread/170263651)).
- **Platform lock-in mechanics**: proprietary formats (Google-native docs don't really "download"), sync clients that fight each other, iCloud's Apple-only gravity.
- **Search opacity**: OCR/content indexing works "sometimes" (2 MB limits, format caveats) with no user-visible model of what is and isn't indexed.
- **AI bundling resentment**: 2026 price restructures push AI on users who wanted storage ([Android Authority on Google One AI pricing concern](https://www.androidauthority.com/google-one-ai-prices-concern-3668896/), accessed 2026-07-29).

## Implications for the EFS file browser

1. **Clear Tier 1 before anything clever.** Folders, drag-drop upload, previews, ZIP download, filename search, share links, and a Recents surface are the credibility floor. Every crypto-native feature shown before this floor is cleared codes the product as "web3 demo," not "drive."
2. **Latency is the identity threat, not features.** Mainstream drives taught users that rename/move/delete are instant. EFS must do optimistic UI over pending transactions everywhere — commit in the background, reconcile on failure — or it will feel broken even when it's working exactly as designed.
3. **Ship a trash can anyway.** Implement unlink/hide with a trash-like surface and restore, and write Proton-grade copy for the permanence boundary: what leaves your view vs what can never leave a permanent mirror. Silence here is the single worst option — users *will* test delete on day one.
4. **Make immutability the versioning story.** "Version history: forever" is a headline feature mainstream drives literally cannot match (Dropbox sells 365 days as enterprise-grade). The UI should expose version timelines as a flagship, not bury the fact that edits append.
5. **Copy the permission vocabulary, map it honestly.** Use viewer/editor language for what EFS ACLs/anchors actually support; where public-chain visibility means "viewer = everyone," say so at share time, the way Proton says "we can't reset without your recovery phrase."
6. **Price against the $5/TB/month anchor explicitly.** Any paid permanence flow should show the subscription-equivalent math ("one-time X ≈ Y years of Google One") because that's the only frame users have. Never make a user price bytes×time themselves.
7. **Plan the search story now.** No server operator means no free content indexing — Proton's filename-only search is their most-complained-about gap. Decide early: client-side index, opt-in indexer service, or honest filename-only v1 with the trust-model explanation attached.
8. **AI-assisted search/summarize is becoming table stakes** (Gemini in Drive GA 2026, Copilot in OneDrive, Dropbox Dash). EFS doesn't need it at launch, but the roadmap needs an answer for "ask my drive a question" that doesn't leak the trust story.

## Sources

- https://support.google.com/drive/answer/2409045 — Drive version history (accessed 2026-07-29)
- https://support.google.com/docs/thread/170263651 — user thread on 30-day version limits (accessed 2026-07-29)
- https://help.dropbox.com/delete-restore/version-history-overview — Dropbox version windows (accessed 2026-07-29)
- https://help.dropbox.com/account-settings/data-retention-policy — Dropbox deleted-file retention (accessed 2026-07-29)
- https://help.dropbox.com/delete-restore/extended-version-history — Dropbox EVH add-on (accessed 2026-07-29)
- https://learn.microsoft.com/en-us/sharepoint/document-library-version-history-limits — OneDrive/SharePoint 500-version default (accessed 2026-07-29)
- https://learn.microsoft.com/en-us/answers/questions/4942816/version-history-first-second-stage-recycle-bin-que — OneDrive recycle-bin windows (accessed 2026-07-29)
- https://support.apple.com/guide/icloud/recover-deleted-files-mmae56ea1ca5/icloud — iCloud 30-day recovery (accessed 2026-07-29)
- https://eclecticlight.co/2023/07/20/backing-up-icloud-icloud-recovery-and-document-versions/ — iCloud last-version-only limitation (2023-07-20)
- https://workspaceupdates.googleblog.com/2020/09/drive-trash-auto-delete-30-days.html — Drive trash auto-delete policy (2020-09)
- https://www.dropbox.com/plans — live Dropbox pricing (accessed 2026-07-29; $9.99/2TB shown, third parties quote $11.99 month-to-month — flagged as billing-cycle ambiguity)
- https://www.nasdaq.com/articles/google-one-cuts-2-tb-and-ai-pro-annual-plans-50-new-2026-subscribers — Google One 2026 AI-tier restructure and promos
- https://9to5google.com/2026/06/09/google-one-best-subscription-value-ai/ — Google AI Pro 5 TB $19.99 bundle (2026-06-09)
- https://www.androidauthority.com/google-one-ai-prices-concern-3668896/ — AI-bundling pricing concern (accessed 2026-07-29)
- https://allaboutcookies.org/cloud-storage-pricing — cross-provider 2 TB pricing (accessed 2026-07-29)
- https://proton.me/pricing — Proton plan pricing (accessed 2026-07-29)
- https://baizaar.tools/proton-drive-pricing-plans-2026/ — Proton 2026 plan breakdown (accessed 2026-07-29)
- https://proton.me/support/recovery-phrase — recovery phrase UX (accessed 2026-07-29)
- https://proton.me/support/recover-encrypted-messages-files — password-reset data-loss UX (accessed 2026-07-29)
- https://proton.me/drive/roadmap — Proton Drive roadmap/CLI (accessed 2026-07-29)
- https://protonmail.uservoice.com/forums/945460-general-ideas/suggestions/49554038-proton-drive-full-text-search — full-text search demand (accessed 2026-07-29)
- https://www.cyberly.org/en/does-proton-drive-support-file-search/index.html — Proton filename-search limits (accessed 2026-07-29)
- https://www.labnol.org/internet/google-drive-search-tips/29508 — Drive search/OCR behavior (accessed 2026-07-29)
- https://workspaceupdates.googleblog.com/2026/04/ask-gemini-in-drive-now-generally-available.html — Ask Gemini in Drive GA (2026-04)
- https://9to5google.com/2026/03/10/google-drive-ai-overviews/ — Drive AI Overviews (2026-03-10)
- https://www.pcworld.com/article/2900371/onedrive-gets-copilot-ai-features-like-file-comparisons-and-summaries.html — OneDrive 2026 Copilot/OCR overhaul
- https://blog.dropbox.com/topics/product/introducing-AI-powered-tools — Dropbox Dash (accessed 2026-07-29)
- https://www.cloudwards.net/dropbox-vs-google-drive-vs-onedrive/ — block-level sync / 2026 sync-speed tests (accessed 2026-07-29)
- https://massive.io/file-transfer/file-size-limits/ — provider max file sizes (accessed 2026-07-29)
- https://help.dropbox.com/sync/upload-limitations — Dropbox 375 GB web-upload caveat (accessed 2026-07-29)
- https://support.google.com/drive/answer/37603 — Drive storable/previewable types (accessed 2026-07-29)
- https://thenextweb.com/news/google-drive-now-lets-you-preview-and-flip-through-over-30-file-types-including-documents-photos-and-videos — 30+ preview formats
- https://www.overdrive.tools/blog/google-drive-permissions-explained — Drive permission roles (accessed 2026-07-29)
- https://mspoweruser.com/google-drive-sharing-permissions-explained-a-detailed-guide/ — 2025 mandatory permission inheritance (accessed 2026-07-29)
- https://help.dropbox.com/share/set-link-permissions — Dropbox link password/expiry by plan (accessed 2026-07-29)
- https://support.google.com/docs/answer/7378739 — Activity dashboard / presence (accessed 2026-07-29)
- https://www.cloudwards.net/review/proton-drive/ — Proton 10-year version history claim (accessed 2026-07-29)
