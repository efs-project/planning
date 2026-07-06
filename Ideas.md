# Ideas

A lightweight parking lot for future ideas, "we should do X someday" drops, and things-to-account-for that aren't decisions, work, or full explorations yet. Keep entries short. The PM curates this and surfaces items when they become relevant.

**Lifecycle:** raw idea here → when worth real exploration, spawn a [[Brainstorms/README|Brainstorm]] → when designed, a `Designs/` doc. Mark an idea `→ [[link]]` when it graduates, or strike it if dropped (with a why). This is NOT for decisions ([[Decisions]]), pending James-asks ([[For-James]]), or active work ([[Kanban]]).

---

## Open

### Burner wallets for transactionless interactions + multi-wallet identity in lenses
*(James, 2026-06-21)*

People should be able to use **burner wallets for transactionless interactions** — browse, read, and curate without funding a wallet or sending gas. Reads are already gasless (view/`eth_call`); the harder part is letting a burner *participate* (curate, signal, intend-to-write) without on-chain txs — e.g. EIP-712 signed intent that's relayed/batched later (ties to the SDK's one-signature/batch + AA-ready Submitter seam).

**The structural requirement James flagged:** one user can have **multiple wallets** (main + burners), so the **Lens system must treat a set of wallets as one identity**. Concretely: **wallet *lists* as lens arguments** — functions that take a single lens/attester address should accept a list, so a user's combined view (all their addresses) resolves as one.

**Threads this connects to (for whoever designs it):**
- Lenses are *already* composable (`?lenses=alice.eth,bob.eth`) — "my wallets = the lenses I trust as myself" is partly expressible today; the gap is a first-class "these N addresses are ME" grouping.
- Holistic review **ARCH-9** (no lens key-rotation story; lost/rotated curator key freezes decades of curation) — same family: identity that spans keys over time.
- SDK on-chain identity model (`read(path)=address(this)`, `readAs(path,who)`, Aave-style `onBehalfOf`, EIP-712 + ERC-1271) — the multi-wallet-as-one-principal question lives here.
- Burner key custody / "share hex not ENS in archival URLs" (ARCH-9) — burners are ephemeral keys; how do they map to a durable user identity?

Not blocking. A candidate for a dedicated brainstorm/design (likely an SDK + lens-model concern). **Update 2026-07-01:** the *burner-session* half **shipped** — contracts **PR #39 "instant Sepolia burner session"** merged to `main` (chain-aware burner + network persistence). **Update 2026-07-05 — graduated into EFS v2 →** [[deterministic-ids]] + [[efs-v2-holistic-redesign]]. Fable's v2 identity work directly takes up both threads: the **identity crux** splits *authorization* (live, chain-bound — the B′ account, ERC-1271/4337/7702) from *authorship* (eternal, chain-free key signatures + key-event log), and **named lenses (lens-as-LIST)** give the "these addresses are ME / a curator I follow" grouping without editing URLs. Transactionless/one-popup writes fall out of v2's deterministic one-tx parents-first batches. Watch the v2 designs; this parking-lot entry is now tracked there.
