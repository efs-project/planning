# Ideas

A lightweight parking lot for future ideas, "we should do X someday" drops, and things-to-account-for that aren't decisions, work, or full explorations yet. Keep entries short. The PM curates this and surfaces items when they become relevant.

**Lifecycle:** raw idea here → when worth real exploration, spawn a [[Brainstorms/README|Brainstorm]] → when designed, a `Designs/` doc. Mark an idea `→ [[link]]` when it graduates, or strike it if dropped (with a why). This is NOT for decisions ([[Decisions]]), pending James-asks ([[For-James]]), or active work ([[Kanban]]).

---

## Open

### Retro OS and playful shell themes
*(James, 2026-07-23)*

Explore optional nostalgic theme packs for the Client v2 **Session Shell**: old operating systems, consoles, games, terminal UIs, and early-web styles. Besides being fun and distinctive, radically different themes could stress-test whether the Shell's tokens and components are genuinely reusable.

Not active work. Revisit when the Client v2 Shell/theme layer is being specified or prototyped. Preserve the trust boundary: themes may change app and Session Shell presentation, but must not restyle security-critical **System Chrome** or weaken accessibility, readability, and trusted-surface cues. Related: [[Designs/clientv2/kernel-capability-model]], [[Designs/clientv2/shell-and-sessions]], and [[Designs/clientv2/locale-and-accessibility]].

<details>
<summary>Hacker News reference collection (deduplicated)</summary>

**Classic desktop/windowing**

- [98.css](https://jdan.github.io/98.css/) ([repo](https://github.com/jdan/98.css)) — Windows 98
- [win95.css](https://alexbsoft.github.io/win95.css/) ([repo](https://github.com/AlexBSoft/win95.css)) — Windows 95
- [XP.css](https://botoxparty.github.io/XP.css/) ([repo](https://github.com/botoxparty/XP.css)) — Windows XP
- [7.css](https://khang-nd.github.io/7.css/) ([repo](https://github.com/khang-nd/7.css)) — Windows 7
- [system.css](https://sakofchit.github.io/system.css/) ([repo](https://github.com/sakofchit/system.css)) — classic Apple System
- [os-gui](https://github.com/1j01/os-gui)
- [windows-95-ui-kit](https://github.com/themesberg/windows-95-ui-kit)
- [retro-css-shell-demo](https://github.com/andersevenrud/retro-css-shell-demo)
- [React95](https://github.com/arturbien/React95)
- [window98-html-css-js](https://github.com/lolstring/window98-html-css-js)
- [hackertosh.css](https://github.com/anthmn/hackertosh.css)
- [csswin10](https://github.com/jianzhongli/csswin10)
- [Renkbench](https://github.com/lachsfilet/Renkbench)
- [classic.css](https://github.com/npjg/classic.css)
- [platinum](https://github.com/robbiebyrd/platinum)
- [new-dawn](https://github.com/npjg/new-dawn)
- [retro-desktop](https://github.com/ritenv/retro-desktop)

**Consoles and games**

- [PSone.css](https://micah5.github.io/PSone.css/) ([repo](https://github.com/micah5/PSone.css)) — PlayStation
- [NES.css](https://nostalgic-css.github.io/NES.css/) ([repo](https://github.com/nostalgic-css/NES.css))
- [SNES.css](https://snes-css.sadlative.com/)
- [CS 1.6 UI](https://cs16.samke.me/)
- [The Sims CSS](https://thesimscss.inbn.dev/)
- [Xbox 360 UI](https://irv77.github.io/Xbox360UI/)
- [Dreamyard DS](https://css.ds.dreamyard.xyz/)

**Early web, terminal, and typography**

- [BOOTSTRA.386](https://bootstra386.com/) ([repo](https://github.com/kristopolous/BOOTSTRA.386))
- [Geo Bootstrap](https://code.divshot.com/geo-bootstrap/)
- [Tufte CSS](https://edwardtufte.github.io/tufte-css/)
- [terminal.css](https://github.com/Gioni06/terminal.css)
- [TuiCss](https://github.com/vinibiavatti1/TuiCss)
- [C64CSS3](https://github.com/RoelN/c64css3)
- [After Dark CSS](https://github.com/bryanbraun/after-dark-css)

</details>

### HTMX for third-party OS app UI
*(James, 2026-07-14)*

Consider whether **HTMX can be used from the Web Worker-based third-party app UI model**. Evaluate the fit with the Ring-3 worker / Shell-owned surface boundary, including what an HTMX-style interaction model would need from the renderer and whether it preserves the no-ambient-network and capability constraints.

Not a commitment to adopt HTMX; revisit when specifying or prototyping third-party app UI.

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
