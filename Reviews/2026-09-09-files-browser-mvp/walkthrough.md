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
- Open `vacation`, **New note** → `plan.md`, type some text → Approve twice
  (one approval publishes the metadata atomically, one stages the bytes —
  both are counted; nothing is hidden).
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

## 5 · Export and upgrade (3 min)

- **Export folder** downloads a JSON bundle (files + evidence + basis). Verify
  it with no server running:
  `node scripts/verify-export.mjs ~/Downloads/efs-export-*.json`
  — the bytes re-hash offline against their on-chain commitments.
- In the terminal, type `u` + Enter: the **populated** contracts upgrade
  U1 → U2 in place (same addresses). Back in the browser hit **Read again**:
  everything is still there, the footer shows *host revision 2*, old
  revisions still open, and a new note still works.

## What you are looking at (honesty box)

- Guest reads: zero prompts, zero wallet code paths (tests assert it).
- Writes: **simulated approvals** with disposable local keys plus a synthetic
  operator co-signature. Authorization and all preconditions (occupied names,
  stale edits, folder cycles, restore collisions) are enforced **by the
  router contract**, not the UI — the tests submit around the UI to prove it.
- This is an upgradeable local testnet prototype. No immutable-hyperstructure
  claim, no real wallet, no public deployment, no frozen protocol bytes.

## Commands

| What | Command (from `Reviews/2026-09-09-files-browser-mvp`) |
|---|---|
| Start (with upgrade key) | `node scripts/run.mjs --upgrade` |
| Reset | Ctrl+C, then start again |
| All contract + SDK tests | `node --test test/router.test.mjs test/reader-extensions.test.mjs` |
| Browser journeys (real Chromium) | `node --test test/journeys.browser.mjs` |
| Verify an export offline | `node scripts/verify-export.mjs <file>` |
| Router unit build | `cd contracts && forge build` |
