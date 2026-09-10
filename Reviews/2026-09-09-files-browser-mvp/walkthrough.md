# 15-minute walkthrough — the EFS Files browser, on your machine

No Solidity knowledge needed. Everything runs locally and is disposable;
stopping the process erases the whole test chain.

## Start it

```
cd Reviews/2026-09-09-files-browser-mvp
node scripts/run.mjs --upgrade
```

Wait for `EFS Files browser: http://127.0.0.1:<port>` (first start compiles the
contracts; ~30–60 s) and open that URL. **Reset at any time**: Ctrl+C and start
again — you always get a fresh world.

## 1 · Browse as a guest (2 min)

You land in `trip/` with no wallet and **0 approvals** (top right — that
counter never moves while you only read). Click **Open** on `photos/` —
breadcrumbs show `trip / photos`; click `trip` to go back. Click **Open** on
`note.txt`: the note's text appears only after its bytes were re-hashed
against the on-chain commitment ("integrity VERIFIED"). Under **History**,
open the older revision — the original text, still verifiable. Open
`photos/pixel.png`: its bytes were deliberately never staged, so the browser
says they are *unavailable* — not that the file doesn't exist.

Click **Why?** on any row to see which Lens selected which claim, at which
pinned block, with every RPC read inspectable.

## 2 · Make it yours (5 min)

Top right, switch **Guest** → **Author A (local test signer)**. This is a
clearly labeled disposable key; every approval is counted.

- **New folder** → `vacation` → Approve. Watch the result: "Committed and
  read back at block N" — success is only claimed after an independent
  re-read, never from the transaction receipt alone.
- Open `vacation`, **New note** → `plan.md`, type some text → Approve
  **once**. That single signed approval covers the whole write: the file
  record AND its byte commitment. The bytes themselves then stage as
  permissionless content-addressed transactions (you'll see "Staging bytes:
  chunk 1 of N…") — they need no further consent because they can only ever
  match the commitment you already approved. Interrupt it and the file panel
  offers **Stage missing bytes now**; only the missing chunks are sent.
- Files are no longer capped at 16 KiB: a note or upload up to 1 MiB is
  split into 4 KiB chunks under the same single approval, and read back only
  if every chunk re-hashes into the committed Merkle root.
- **Reload the page.** Everything is still there — it lives in the local
  contracts, not in the browser.
- Open `plan.md` → **Edit note** → change the text → Approve. History now
  shows two revisions; the old one still opens.

## 3 · Organize (3 min)

- **Rename** `plan.md` → `itinerary.md`. The Why? drawer shows the File
  Object id **did not change** — names move, identity doesn't.
- **Copy** it → `itinerary-v2.md` (a NEW file with the same bytes), then
  **Link** it → `itinerary-link.md` (the SAME file under a second name).
  Edit the copy: the original is untouched. That's the difference.
- **Remove** `itinerary.md`. It leaves the list and appears under **Removed
  items** — masked, not erased; the linked placement still works. **Restore**
  it. If the name is occupied you'll be asked to restore under a new name —
  nothing is ever silently overwritten.
- Try creating `Trip` (capital T): the router refuses it as *unsupported* by
  this ASCII arm — deliberately not "invalid", and never silently lowercased.

## 4 · Disagreement and tags (2 min)

- Open `itinerary.md` → **Add tag** → `ocean`. Type `ocean` into the **Tag**
  filter: the folder narrows to tagged files (the status line says the filter
  only applies to loaded rows — zero matches is not proof of zero).
- Switch the **Lens** between *A first*, *B first* and *Both agree* on the
  root `note.txt` (A and B are two claim sources seeded with real
  disagreement history). **Why?** explains each answer.
- Switch signer to **Author B**, tag the same file, switch back to A and
  remove A's tag: B's tag survives — tags are attributed, not global.

## 4b · Use a real wallet (3 min, optional)

If you have a browser wallet, add its network as `http://127.0.0.1:<the anvil
port printed at startup>`, chain id **31337**, then pick **Real wallet** in
the signer menu. What you should see:

1. The wallet asks to connect (1 request).
2. A one-time **claim** transaction binding this fixture's reserved author
   identity to your account — your account pays this one; it is setup, not a
   per-change cost.
3. From then on, **one signature request per change** — no transaction
   prompts at all — because an explicitly named local sponsor submits and
   pays. The sponsor cannot alter what you signed; it can only decline.

The counter top-right switches to counting **wallet requests**, not simulated
approvals. If no sponsor is configured, the app says **direct** up front and
prompts once per transaction — it never silently degrades from one signature
into signature-plus-transactions.

**Honest gap:** the automated suite drives a faithful EIP-1193 harness, which
proves the request counts and payloads but not a specific wallet's UI. The
manual check that remains: confirm the popup shows domain *EFS Files
Authority*, chain 31337, and that the tally matches the list above.

## 5 · Export and upgrade (3 min)

- **Export folder** downloads an authenticated bundle (records, selection,
  content, block header, path chain and the full pinned read transcript).
  Verify it with no server running:
  `node scripts/verify-export.mjs ~/Downloads/efs-export-*.json`
  Read the verdict carefully — it deliberately does **not** say "verified"
  flatly. It separates what it recomputed from the bundle's own bytes
  (record ids, chunk trees, the selection graph), what only the retained
  transcript attests (which revision is *current*, whether the listing is
  complete), and what you must confirm yourself (the chain, block hash, Core
  address and mount). Add `--recheck-manifest out.json` to get the exact
  reads to replay against any node you trust; that replay is what turns
  transcript claims into verified ones. Try tampering with a byte of
  `content` and re-running it: the bundle is refused, not downgraded.
- In the terminal, type `u` + Enter: the **populated** contracts upgrade in
  place (same addresses, next revision). Back in the browser hit **Read
  again**: everything is still there, the footer shows the new host revision,
  old revisions still open, and a new note still works.
- **Export honesty:** in a folder large enough to paginate, the Export
  button only appears once the listing reads *Listing complete* — a partial
  listing can never masquerade as a full copy.

## What you are looking at (honesty box)

- Guest reads: zero prompts, zero wallet code paths (tests assert it).
- Writes: either **simulated approvals** with disposable local keys, or a
  **real wallet**. Either way the approval is an EIP-712 author signature
  verified **on-chain by the Core** (per-account nonce, deadline, executor
  binding): replaying it, submitting it around the router, or altering the
  operation are all refused by the contracts, not the UI — the authority
  suite proves each refusal. The operator key is never served to the browser.
- What that does **not** mean: the upgraded Core still inherits the
  operator-authorized fixture entrypoint, so "every write is an author
  intent" is true of *this* user path, not of the contract as a whole. And
  author identities here are claimed first-come by whoever asks first — that
  is fixture identity, not account ownership.
- All preconditions (occupied names, stale edits, folder cycles, restore
  collisions) are enforced **by the router contract**, not the UI — the
  tests submit around the UI to prove it.
- This is an upgradeable local testnet prototype. No immutable-hyperstructure
  claim, no real wallet, no public deployment, no frozen protocol bytes.

## Commands

| What | Command (from `Reviews/2026-09-09-files-browser-mvp`) |
|---|---|
| Start (with upgrade key) | `node scripts/run.mjs --upgrade` |
| Reset | Ctrl+C, then start again |
| All contract + SDK tests | `node --test test/router.test.mjs test/reader-extensions.test.mjs` |
| Browser journeys (real Chromium) | `node --test --test-force-exit test/journeys.browser.mjs` |
| Authority gauntlet (impersonation, replay, bypass, chunks) | `node --test test/authority.test.mjs` |
| Standalone static hosting (generic server + direct RPC) | `node --test --test-force-exit test/static-hosting.browser.mjs` |
| Completeness regressions (reader + browser copy) | `node --test --test-force-exit test/completeness-regressions.test.mjs test/completeness.browser.mjs` |
| Churn / larger folders (writes evidence) | `node --test test/churn.perf.mjs` |
| Verify an export offline | `node scripts/verify-export.mjs <file>` |
| Router unit build | `cd contracts && forge build` |
