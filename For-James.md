# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**⭐ HIGHEST LEVERAGE — drop pinning/Arweave credentials.** Sepolia is live; the only thing between you and a *live reference dataset on EFS* (which makes the hackathon real + gives the flyer a concrete anchor) is a pinning-service key + a small-funded Arweave wallet. Hand them over → the seeding agent runs the whole pin→Arweave→attest pipeline. ~5 min.

**hackathon — HANDOUT READY (all decisions locked).** Single dataset track; prizes all-cash $100/$50/$25/$10/$10 ($195); runs Jun 23 → Jul 8, winners Jul 10; bar = 5–10 small files or a few big ones; submit-to-James judging; US-Letter color flyer; URL `buildathon.efs.eth.limo`. All copy/visual/announcement/rubric/templates done in `hackathon/` (see `hackathon/READY.md`). **Nothing blocking from me.** Your at-handout chores: publish `buildathon.efs.eth.limo`, pin Discord assets + a Sepolia faucet link, decide how the flyer reaches OnionDAO. **Open (your call, not blocking): OnionDAO-only vs open to the internet** — current setup (all-cash, generic URL, runs a full week past OnionDAO) supports going wider; decide mid-week on traction.

**Milestones wording (Tier-1, your OK):** the OnionDAO list still says *"Smart contract .sol file list freeze"* — stale per your "set stays flexible." Want me to update it? (Milestone scope = your call.)

**SDK architecture — promote or revise** → [[Designs/sdk-architecture]] at `#status/review` (~11 days). All open questions resolved; the SDK agent is already *building against it* (PR #1, CI green). So promoting it just ratifies what's being built. **(a) Promote** (PM rec — assign a number, bless the foundation) / **(b) Revise** (name what's wrong). The full reasoning trail is in the design doc; nothing's blocking your call.

## 🕐 WHEN YOU HAVE TIME (not blocking OnionDAO)

- **Start the OnionDAO onboarding + flyers discussion** — you said you'll fork a chain for this; PM will keep reminding you each session until you do (you asked not to let it slip).
- **Minimal-click write UX follow-ups:** decide whether true one-click should pursue a user-context `EFSWriter` / shared 7702 writer (vs compile-in only), and whether the debug client should default auto-sort processing off to avoid surprise MetaMask prompts. Current `codex-min-transactions` work ships Tier-1 layered `multiAttest` without blocking either call.
- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)
- Promote [[brainstorm-system]] when you're happy with it

## ℹ️ FYI (no action — details in [[Decisions]])

- **SDK build has moved fast (branch `chore/scaffold`, 2026-06-20):** reads + Tier-1 write + edge/value writes + lists (R/W) + REDIRECT + escape hatches + schema-UID integrity gate + AA-ready Submitter seam + the `@efs/solidity` compile-in lib are all built (~416+48 tests, ~27 kB gzip). Manifest in [[Designs/sdk-architecture]] + [[Designs/sdk-review-backlog]] reconciled. Two things to know (no action): a silent-data-loss-class correctness fix landed — PROPERTY key-anchors used a generic `forSchema = 0` so values were invisible to spec-conformant readers (now `PROPERTY_SCHEMA_UID`; **worth a contracts-side check for the same defect**); and **ADR-0050's redirect resolution spec is unpinned** — the SDK fail-closes on a cycle vs the ADR's lowest-UID-in-SCC, surfaced upstream as a contracts/ADR call. Still designed-only: sorts (SORT_INFO unfrozen), one-signature `batch()`, mirrors writes. (The promote/revise fork above is unchanged.)
- **Reference dataset ready: crypto whitepapers** at `/Users/james/Code/EFS/datasets/crypto-whitepapers/` — 20 coins, 7 category folders each with a README (demos folders + markdown-per-folder + files + metadata), 18 PDFs fetched + license-verified. Feeds the flyer's "interesting datasets" anchor; uploads once Sepolia's live. Glance when convenient: Tron + BNB PDFs intentionally omitted (restrictive/unclear license — link-only); Monero/Zcash included via free preprints; Litecoin + Dogecoin have no real whitepaper (markdown-only, flagged).
- **arch-review thread (freeze/deploy) started** — your 4 freeze calls captured (8 schemas: ANCHOR/PROPERTY/DATA/PIN/TAG/MIRROR/LIST/LIST_ENTRY; drop BLOB+NAMING; defer SORT_INFO; proxy-first; simple single-admin key). ADR-0048 + `contracts/docs/SEPOLIA_FREEZE_TABLE.md` on contracts branch `arch-review`. Two things will come back to you: (a) **contracts local checkout is 226 behind** with 2 uncommitted PR-review-protocol edits — left untouched; say the word to stash + fast-forward + re-apply; (b) the **frozen-UID table needs your signature** before any Sepolia registration (gate fires once the proxies are deployed).
- SDK posture decided: **(a) bare-bones read/write SDK by end of next week** (gated on Lists→Sepolia). ADR-0043 collision **resolved by the dev** (renumbered to 0045). Lists has a GO; dev started. Typed-edge gap is NOT a blocker. Local `contracts/` checkout is ~30 commits stale — `git pull` when convenient.
- **Contracts-side ADR candidates** surfaced by the identity work (the SDK can't resolve these — they're protocol-level; flagged to PM): (1) state "attester identity = address's *current controller*, not durable principal" + make ADR-0039 systemLenses trust roots immutable contracts/multisigs, not EOAs; (2) ~~verify EFS's pinned EAS accepts ERC-1271 signers~~ **VERIFIED ✅ (2026-06-10): EFS's EAS uses OZ `SignatureChecker` (`EIP1271Verifier.sol:123,157`) — smart wallets (Safe/4337/passkey) work in BOTH direct and delegated attestation. No gap; the gating risk is closed.**; (3) expose attestation provenance (timestamp/refUID/revocation) as a cross-SDK read concern. Detail in the doc's "EFS-wide implications" note.
- **ADR-0049 follow-up for the schema-freeze dev (content-hash encoding):** ADR-0049 gestured at "self-describing multihash / CID" but the encoding spec was never written. After two expert passes (James-decided 2026-06-10), the SDK standardized `contentHash` on **bare SHA-256** (lowercase hex, `sha256sum`-identical; the PROPERTY *key* is the algorithm tag — no multihash/CID/keccak). Rationale: multihash's future-proofing is illusory (readers still update per new algorithm) and the IPFS-CID interop reason is false (a CID is a Merkle-DAG root, not `sha256(bytes)`). The contract stores `contentHash` opaquely so there's **no code change** — just align ADR-0049's unwritten convention to bare SHA-256 so EFS-wide stays consistent. Full reasoning: SDK `docs/adr/0006` + `docs/specs/content-hash.md`.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

This file exists to make James's decision queue **scannable in 10 seconds**. James found a flat list of 12 mixed bullets unreadable (2026-05-28) — so the file is now sorted by what it asks of him, not by date.

Place each item in the right section:

- **⚡ DECIDE NOW** — genuine forks only. Phrase as a numbered question with lettered options and a PM recommendation. James should be able to reply "1a, 2b" and be done. Keep this section SHORT; if it has more than ~4 items, the most important ones are getting buried.
- **🕐 WHEN YOU HAVE TIME** — reviews / promotions that aren't time-critical. One line each.
- **ℹ️ FYI** — things James should know but that need no action. Collapse aggressively; one or two lines total, pointing at [[Decisions]] for detail. Do NOT let FYIs accumulate as separate bullets.

Rules:

- **Prune ruthlessly.** When James acts on an item, delete it (git history is the archive). Stale items are the enemy — they're what made this file unreadable.
- **A decision is a fork James picks.** Status updates, things-in-progress, and PM observations are NOT decisions — they go in [[Decisions]] or `Daily Notes/`, not here.
- **Empty DECIDE NOW = James has nothing blocking him.** That's the goal state.
- **WIP limit:** if DECIDE NOW has 3 awaiting-promotion items, don't queue more promotions (per [[conventions#WIP limits]]).
