# EFS v2 deep privacy pass — AUTOPSIES lane

**Date:** 2026-07-11
**Charge:** extract transferable technique and anti-lessons from real systems, each keyed to a specific EFS surface. Deep: Peergos, Fileverse (re-verification of privacy.md §7), Signal sealed sender. Brief: Skiff, MLS deployments, shielded-pool chains, consumer E2EE recovery UX, Nym.
**Method:** primary sources where reachable (project books/docs, GitHub repos and raw source files, RFC/paper abstracts, project blogs), fetched 2026-07-11. Every significant claim is tagged **[VERIFIED]** (read the primary source / reproduced the reasoning today) or **[PLAUSIBLE]** (recalled or secondary; unverified today). Could-not-verify items are named in §Confidence.
**Ground truth read first:** privacy.md, fs-pass-freeze-reservations.md, identity.md, codex-kinds.md, attack-privacy.md (all in full).

The recurring shape of this document: for each system — architecture in one paragraph, what is real vs marketing, STEAL list, REJECT list, the one lesson — with each steal/reject keyed to the EFS row or convention it informs (`keyWrap` E5, `encryptionKey` C3, `contentEncryption` E6, salted-TAGDEF family D3/D4, persona pair D2, `act` D1, padding/§H conventions, `claimedAt=0` rider, `.efs-bundle`).

---

## 1. PEERGOS — the closest architectural cousin (deep)

### Architecture in one paragraph

Peergos is a capability-based E2EE global filesystem over IPFS. Per writing keypair, all data lives in a **merkle-CHAMP**: "just a mapping from random 32 byte labels to cipher-text blobs" containing cryptree nodes and encrypted file fragments; "each 5 MiB section of a file is stored under a different random label in the champ, and similarly with large directories" [VERIFIED — book.peergos.org/architecture/champ.html]. Access control is a **cryptree** — "a tree of symmetric keys, where the holder of one key can decrypt all the descendant keys" — with **separate read and write trees**: read grants are recursive downward ("granting read access to a folder implies granting read access to all the contents of the folder recursively") and sibling-blind (a file grantee "won't be able to see any of the sibling files in the same folder (or even their names)"); write access is a simpler parallel tree where "all updates to a given subtree are signed by a corresponding writing key pair," and granting write access **moves the item to a new writing key pair** [VERIFIED — book/security/cryptree.html]. Mutability is a per-writer **mutable pointer**: "a mapping from a public key to a root hash," updated by signed `(previous, current, seq#)` compare-and-swap through the user's designated home server / IPFS node, giving total order per writer and stale-serving defense via client-cached sequence numbers [VERIFIED — book/architecture/mutable.html]. A **capability** is `{owner pubkey, writer pubkey, 32-byte champ map-key, 32-byte BAT, read key, write key}` in three grades (Mirror = fetch ciphertext, Read = decrypt, Write = modify) [VERIFIED — book/security/capabilities.html]. Login: `scrypt(password + username + public salt; N=2^17, r=8, p=1, 64 bytes)` → a login keypair + a symmetric key that decrypts a blob holding the identity keypair, social keypair, and root capability [VERIFIED — book/security/login.html]. Server-side ciphertext access is gated by **BATs** (Block Access Tokens): 32-byte secrets used S3-V4-style ("essentially repeated hmac-sha256"), bound to the requester so tokens are non-transferable, embedded in blocks under a `bats` key [VERIFIED — book/security/bats.html]. Post-quantum: unshared files are "already quantum-resistant" (hash + symmetric only); shared files use "a post-quantum hybrid of X25519 and MLKEM" [VERIFIED — book/security/quantum.html]. Social recovery: designate N-of-M friends who can jointly recover the account [PLAUSIBLE — feature listed in project descriptions; mechanism page not read]. Audits: Cure53 2019 (published PDF; findings incl. username-only password salt, PKI-lookup design) and Radically Open Security 2024 (published; "zero extreme, high, or elevated risk," 2 moderate + 6 low, all remediated) [VERIFIED — cure53.de/pentest-report_peergos.pdf exists; peergos.org 2024 audit blog post].

### Their metadata story — how, exactly

This is the part the charge asked for specifically. Peergos hides file sizes, names, and directory topology by **four stacked moves** [VERIFIED — book/security/meta.html + champ.html]:

1. **Metadata under its own key.** File metadata — "filesize, modification time, any thumbnail and mime type for files," and directory names — is encrypted under a symmetric key *distinct from* the content key. So a content-grade capability doesn't automatically leak the metadata, and vice versa.
2. **Fixed-size chunking + padding.** Files are cut into 5 MiB chunks, each "padded to a multiple of 4 KiB." Observers see only 4-KiB-granular blob sizes; all large files look like sequences of identical 5 MiB blobs.
3. **Random labels.** Every chunk sits under an independent random 32-byte label in the CHAMP. Nothing links chunk N to chunk N+1, a file to its directory, or a directory to its parent — *the link structure exists only inside ciphertext* (cryptree nodes hold the decryption path).
4. **(Planned) transport privacy.** "The metadata around access patterns will be hidden by hosting files behind a tor hidden service **once Tor is integrated**" — future tense. Even Peergos, the most metadata-paranoid design in this corpus, has not shipped network-layer access-pattern privacy [VERIFIED — meta.html, social.html both future-tense on Tor].

Social-graph handling: following = the followee shares a read capability to a directory; the request is "sent encrypted from a random single use keypair to the target user's public key," and the recipient re-encrypts locally and deletes the server copy [VERIFIED — book/security/social.html]. Single-use keypairs are their (weaker, server-mediated) cousin of stealth addresses.

### What this costs them — the price EFS refuses to pay

Peergos achieves near-total structural opacity **by having no public structure at all**. Consequences, each the negation of an EFS mission end:

- **Not verify-don't-trust for third parties.** Only capability holders can verify anything below the mutable-pointer root. An outside auditor cannot verify path → file → bytes; there is no public graph to check. EFS's promise — anyone verifies without a trusted indexer — is impossible in their model.
- **Not hyperlinkable.** No global names. A Peergos "secret link" is a capability, not a citation; the public web cannot link into Peergos content the way `web3://`/EFS paths are designed to be linked, and links die with key rotation of the enclosing subtree.
- **Not composable.** No smart contract can read a Peergos structure. Their filesystem is a client-side construct over opaque blobs.
- **Availability/ordering trust.** The mutable-pointer CAS runs through a designated home server (or authorized mirrors). It cannot equivocate *undetectably to a synchronized client* (sequence numbers), but it can withhold, and it must be up. EFS's chain-as-orderer removes exactly this role.
- **A global PKI for usernames** — a trusted append-only registry mapping usernames to identity keys [PLAUSIBLE — book has a PKI chapter; not read in full]. EFS's bare-EOA identity deliberately avoids a username authority.

This is the deepest autopsy result: **Peergos and EFS sit at opposite ends of the same design axis, and both are internally coherent.** Peergos: hide everything, verify only what you can decrypt, trust a home server for liveness. EFS: publish everything, verify everything publicly, encrypt only payloads and names. The middle — "public graph but somehow private" — is precisely the territory privacy.md §4 marks as bounded, and Peergos is the proof that closing the bound entirely means giving up the public graph.

### STEAL (each keyed to an EFS surface)

| # | Steal | EFS surface |
|---|---|---|
| P-S1 | **Metadata-key separation**: never let content-grade access imply metadata access, and never store private-file metadata in plaintext beside the ciphertext. EFS translation: a private-tier DATA asserts **no** plaintext `name`/`size`/`contentType` rows; plaintext metadata lives inside an encrypted manifest (Durable format) decrypted with the content cap. | Convention (registry text on the virtual-anchor rows + private-tier profile) — see Freeze §R1 |
| P-S2 | **Fixed-chunk + pad-to-4-KiB normalization**: uniform chunk size and coarse padding buckets so all private files look alike at the blob layer. EFS translation: private-tier EFSBytes profile — normalize chunk size, pad final chunk to bucket; per-chunk SHA-256 (C4) is chunk-size-agnostic so nothing frozen moves. | §H padding MUST + EFSBytes conventions — Freeze §R2 |
| P-S3 | **Random labels ≙ random occurrence keys.** Peergos independently converged on "the slot key must not be derivable from public inputs" — the same reasoning that produced attack-privacy A1's random-occurrence-key ruling for `keyWrap`. Treat as independent confirmation, not a task. | E5 (confirmed) |
| P-S4 | **X25519+ML-KEM hybrid for anything shared; symmetric-only needs nothing.** Identical split to EFS's PQ posture (PQ-hybrid MUST on wraps; unshared symmetric content already safe). Independent confirmation from the closest cousin. | §H PQ-hybrid MUST (confirmed) |
| P-S5 | **Deterministic re-derivation of the private tree from one secret** (their scrypt login → root capability chain). EFS already legalized HKDF-derived salts (D3) for device-loss recovery; Peergos is the existence proof that one-passphrase-to-whole-private-tree works at production quality. Their 2019 audit lesson: salt the KDF with more than the username (Cure53 finding) — EFS's HKDF derivations should bind address + context labels. | D3 wording + SDK KDF profile |
| P-S6 | **Read/write capability split** (cryptree's two trees). EFS analog: read = decryption caps; write = authorship (signature) or delegation. The `act` row (D1) is EFS's "write capability"; keep them as separate vocabularies exactly as Peergos does. | D1 doctrine (confirmed) |
| P-S7 | **Social recovery via N-of-M friends** as shipped consumer UX. Expressible in EFS today: Shamir-split recovery material, each share wrapped to a friend's `encryptionKey` via `keyWrap` TAG with random occurrence keys. | C3 + E5 + convention — Freeze §R7 |

### REJECT

| # | Reject | Why |
|---|---|---|
| P-R1 | **Server-gated ciphertext (BATs) at protocol level.** On-chain bytes are unconditionally readable by chain semantics; a "gate" on public state is theater. (BAT thinking may inform *gateway* caching policy for off-chain private mirrors — out of protocol.) | Freeze §R6 |
| P-R2 | **Home-server-mediated mutable pointers.** The chain is EFS's orderer; reintroducing a designated synchronization node reintroduces the trusted role EFS exists to delete. |
| P-R3 | **Global username PKI.** Bare-EOA is the identity ruling; a username registry is a rotation/threshold authority EFS deliberately lacks (identity.md org realism). |
| P-R4 | **Total structural opacity as default.** Forfeits verify-don't-trust, hyperlinkability, composability — the product. EFS's dual posture (public archive public; OS personal tier private-by-default *within a public graph*) is the ruled reconciliation. |

### The one lesson

**Peergos proves the full-opacity endpoint is buildable and livable — and its price list is exact: no public verification, no hyperlinks, no composability, a liveness-trusted home node.** EFS should quote that price list verbatim whenever someone asks "why not just hide the graph like Peergos": because a Peergos-shaped EFS is not an archive, it's a vault.

---

## 2. FILEVERSE — re-verification of privacy.md §7 (deep)

privacy.md §7 was written 2026-07-10 from blog/FAQ-level sources and flagged its own gaps. This section closes them from the repos, claim by claim. (The vOPRF/ZK piece is the ZK lane's; here: the E2EE/key-wrap side.)

### §7 claims: confirmed, corrected, still-open

| privacy.md §7 claim | Verdict today (2026-07-11) |
|---|---|
| Per-file symmetric key wrapped into multiple **locks** (Owner / Portal / Link) | **CONFIRMED** from the walk-away repo README: "Files employ layered encryption using three access locks — Owner Lock: decrypted using owner's private key; Portal Lock: decrypted using portal's private key; Link Lock: decrypted using unique, randomly generated link keys," each lock recovering "the underlying AES file key" [VERIFIED — github.com/fileverse/walk-away]. |
| Client-side E2EE "AES-256-GCM via Transcend's audited Penumbra streaming lib" | **CONFIRMED architecture, one caveat.** Penumbra (github.com/transcend-io/penumbra) is real: browser streaming encryption in web workers, "currently uses AES-256 in GCM mode," no practical file-size cap [VERIFIED — repo README/blog]. Fileverse's own FAQ/legacy docs: "Files are encrypted using an AES key, which is generated by encrypting the file through Penumbra" [VERIFIED — search-indexed Fileverse FAQ text]. Caveat: **I could not verify that Penumbra itself has a published security audit** — "audited" in §7 should be softened to "widely used, open-source" unless the audit is located. |
| ECIES curve "likely secp256k1 — unconfirmed" | **NOW VERIFIED — secp256k1.** `fileverse-cryptography/src/ecies/config.ts`: `import { secp256k1 } from "@noble/curves/secp256k1.js"; export const INFO = TextEncoder().encode("ECIES-AES256-GCM-SHA256"); export const CURVE = secp256k1`. Core: ephemeral keypair per encryption, ECDH → HKDF-SHA256 (info string above, ephemeral pubkey as salt input) → AES-256-GCM with random 12-byte nonce, 16-byte tag [VERIFIED — raw source read]. |
| Wallet-derived user-held keys | **CORRECTED / NUANCED.** The lock keys in the shipped walk-away path are **RSA keypairs**, not wallet keys: the backup key set is seven items — Portal Address + Owner/Portal/Member RSA public+private keypairs — and "Owner Private Key is an RSA-generated private key" [VERIFIED — walk-away README]. The crypto library also ships an RSA/AES **envelope** module (`src/webcrypto/envelope.ts`) and Argon2id + HKDF for password-path derivation [VERIFIED — repo tree + README]. Wallet-signature-derived keying may exist in the apps' login flow, but §7's "wallet-derived" is not what the recovery path shows; the newer ECIES-secp256k1 module is the wallet-compatible direction. |
| Walkaway recovery with zero Fileverse infra | **CONFIRMED**: "an open-source static page to recover and decrypt documents & spreadsheets locally, without depending on Fileverse or centralized servers," given the backup key set + fileID [VERIFIED — walk-away README]. Note what it takes: **seven key components the user must have exported ahead of time.** The walk-away test is only as good as the backup-artifact UX. |
| Audited by Nethermind / Dédalo / X41 | **CONFIRMED as claim; reports still unpublished.** FAQ lists audited repos (fileverse-cryptography, walkaway, zkovery, zk-permissions, vOPRF server) and the three firms; zk-granular-permissions README says Dédalo + Nethermind with reports "pending publication." I searched Nethermind's public-reports repo and X41's site: **no Fileverse PDFs found** [VERIFIED absence-of-evidence, 2026-07-11]. §7's "only auditor names are public" stands. |
| zk-granular-permissions "own repo honest that it leaks permission existence and update timing" | **COULD NOT RE-VERIFY the self-admission.** Today's README shows vOPRF (`@cloudflare/voprf-ts`) + OpenZeppelin Merkle tree + IPFS-stored encrypted permission data + on-chain hash — the architecture *implies* those leaks (permission-record existence and update timing are on Gnosis chain by construction), but the explicit honesty language wasn't found where I looked. The *substance* of the claim is true by inspection; the *attribution* ("their own repo says") is unconfirmed today. |
| "Deterministic key derivation → no forward secrecy; revocation = regenerate + re-encrypt everything (their repo says so)" | **COULD NOT RE-LOCATE the quote; structurally consistent.** The lock model is static long-lived keypairs wrapping a static per-file AES key — no ratchet, so no forward secrecy for wraps, and un-sharing requires re-encrypting and re-wrapping, same as EFS's forward-only law. Treat as [PLAUSIBLE] with high structural confidence, quote unlocated. |

### Architecture in one paragraph (updated)

A Portal smart contract per user/team registers content hashes and access config; encrypted blobs on IPFS (deletable) or Arweave (permanent); per-file AES key produced in the Penumbra streaming path; that file key wrapped into Owner/Portal/Link locks (RSA today; ECIES-secp256k1 + HKDF-SHA256 + AES-256-GCM in the current crypto lib); collaborative editing via client-encrypted Yjs deltas through a stateless relay (collaboration-server repo); membership privacy via vOPRF-blinded identifiers + Merkle membership (ZK lane's subject); recovery via the walk-away static page from a seven-part backup key set; account recovery experiment "zkovery" ("multiplayer security for account recovery… powered by zero knowledge proofs," Solidity) [VERIFIED — org repo listing + above].

### Real vs marketing

Real: the locks, the walk-away page, the audited-repo *list*, the crypto library (clean, noble-based, tested), the vOPRF dependency graph. Marketing-grade until proven: "audited" without published reports; "zero-knowledge" as a brand adjective on what is mostly (good) conventional E2EE plus one narrow vOPRF membership trick. Their honest core is stronger than their adjectives.

### STEAL

| # | Steal | EFS surface |
|---|---|---|
| F-S1 | **The lock triple maps 1:1 onto reserved EFS surface** — Owner Lock = the reserved self-occurrence-key escrow wrap (E5); Portal Lock = wrap to a group/team key (E5 TAG per member, or a team `encryptionKey` under an org address, C3); Link Lock = capability-in-URL-fragment (D3/D4 + read-lens §6.5). A shipping product independently derived EFS's exact wrap taxonomy. Confirmation with named row homes; nothing new to mint. | E5, C3, D3/D4 |
| F-S2 | **ECIES profile as SDK default**: secp256k1 + HKDF-SHA256 + AES-256-GCM with ephemeral keys and a fixed info string is wallet-ecosystem-native and audited-primitive-based (`@noble/*`). EFS's C3 KEM registry should mint its secp256k1 entry with exactly this shape (then the PQ-hybrid combiner per §H MUST — which Fileverse lacks). | C3 KEM/KEX registry (Durable values, registry per S1) |
| F-S3 | **Walk-away as a versioned artifact with an explicit input manifest.** Their seven-component backup key set is the honest part: recovery is real only if the export ritual names every input. EFS's `.efs-bundle` (§H) should carry a manifest section enumerating exactly what it restores (keys, salts, cap list) and the walk-away page should be a static, SDK-independent verifier. | §H `.efs-bundle` + walk-away gate |
| F-S4 | **Reuse audited browser crypto (noble, Penumbra-style streaming AEAD) rather than hand-rolling** — reaffirmed; the streaming-AEAD worker pattern is the right hot path for large-file encryption before EFSBytes chunking. | SDK boundary |

### REJECT

| # | Reject | Why |
|---|---|---|
| F-R1 | **RSA lock keys.** Legacy in their stack; no PQ path, big blobs, wrong ecosystem fit. EFS C3 registry: x25519 / secp256k1 / ML-KEM-hybrid families only. |
| F-R2 | **Static no-ratchet wraps as the *only* mode without saying so.** EFS already states the forward-only law at grant time; keep that honesty edge. |
| F-R3 | **Minimal-on-chain-footprint instinct.** Their design minimizes exactly the on-chain surface EFS deliberately *is* (unchanged from §7 — missions diverge cleanly). |

### The one lesson

**The closest live product to the EFS OS tier converged on the same key-wrap topology EFS reserved — and its weakest points (unpublished audits, seven-part manual backup, no forward secrecy, RSA legacy) are all UX-and-honesty failures, not cryptographic ones.** The E2EE layer is a solved-shape problem; the differentiators are the export ritual and the honesty of the revocation story.

---

## 3. SIGNAL SEALED SENDER — the authorship-unlinkability analog (deep)

### The design in one paragraph

Sealed sender (2018) hides *who sent a message* from Signal's own servers. Mechanics [VERIFIED — signal.org/blog/sealed-sender/]: clients periodically fetch a **short-lived sender certificate** ("the client's phone number, public identity key, and an expiration timestamp"); the sender's identity + certificate ride *inside* the encrypted envelope; the client then delivers **without authenticating to the server**, handing over the envelope plus the recipient's **delivery token** — "a 96-bit delivery token [derived] from their profile key" — which recipients register with the service. Because "knowledge of a user's profile key is necessary in order to derive that user's delivery token, this restricts 'sealed sender' messages to contacts" — that is the abuse bound: anonymous-to-server sending is a privilege granted by the *recipient* (sharing their profile key), and "blocking a user who has access to a profile key will trigger a profile key rotation." The server still sees: recipient, arrival timestamp, message size, and the sender's IP at connection time; Signal's blog itself flags "additional resistance to traffic correlation via timing attacks and IP addresses" as open work.

### What broke it — the statistical-disclosure literature

- **Martiny, Kaptchuk, Aviv, Roche, Wustrow — "Improving Signal's Sealed Sender," NDSS 2021** [VERIFIED — ndss-symposium.org paper page]: sealed sender's "one-sided anonymity is broken when two parties send multiple messages back and forth; the promise of sealed sender does not compose over a conversation of messages." The attack is a **Statistical Disclosure Attack (SDA)**: the server can't see senders, but it sees *receivers and times*; a conversation makes B receive shortly after A receives, repeatedly; intersecting the anonymity sets across epochs isolates the pair. The killer amplifier is **delivery receipts, enabled by default**: every received message triggers an automatic sealed-sender receipt *back to the original sender*, so the server-visible reception log contains both directions of the conversation. Result: "Signal could link sealed sender users **in as few as 5 messages**," at the application layer, "even against users employing Tor or VPNs." Their fixes ("one-way sealed sender" variants that stop receipt-driven backflow, and **ephemeral mailboxes** — short-lived pseudonymous inboxes) are cheap: "less than $40 per month" of extra cost at millions-of-users scale.
- **Extension to groups** [VERIFIED — arXiv:2305.09799 poster]: "the record of who receives messages can be enough to recover this metadata," scaled from pairs to "deanonymizing entire group conversations" — no safety in numbers.

Real vs marketing: sealed sender genuinely removes the *sender identity field* from the server's per-message view, and the certificate/delivery-token design solves anonymous abuse-bounding elegantly. But it was oversold as conversation privacy; it is per-message unlinkability only, and the interaction pattern re-links in ~5 messages. Signal has (as of my knowledge) shipped receipt-batching-style mitigations but not the paper's full fixes [PLAUSIBLE].

### Mapping onto EFS stealth authorship

What EFS inherits **for free** (no server!):

1. **The entire authentication-without-identification problem vanishes.** Sealed sender's hardest machinery — certificates, delivery tokens, abuse rate-limiting for anonymous senders — exists because a *server* must accept or refuse delivery without knowing the sender. EFS admission is signature-based and permissionless: the envelope signature IS the authorization, anyone can relay. A stealth-authored EFS record needs no certificate and no permission; the "abuse bound" is gas.
2. **No single privileged observer to compel.** Signal's design assumes the server is honest-but-curious and legally compellable. EFS has no operator in that position at all.

What carries over **anyway** — and lands harder:

3. **The chain is a *global, permanent, public* version of Signal's server log.** Signal's SDA adversary sees (recipient, time, size) transiently and privately; the EFS adversary sees (author-or-persona, admittedAt, record shape, targets) forever, retroactively, and *everyone* is that adversary. Every statistical attack in the sealed-sender literature runs better against EFS because the dataset is total and replayable. This is the CHOSEN leakage — say it plainly.
4. **One-sided anonymity does not compose over interaction.** Personas/stealth authorship are per-identity unlinkability, exactly as sealed sender is per-message. Two personas that interact — B's records repeatedly land shortly after A's, wraps appear pairwise, co-occurrence under shared containers — get re-linked by the same SDA family. The 5-message number won't transfer literally, but the shape does: **interaction count, not key hygiene, bounds persona unlinkability.** privacy.md §4's co-occurrence row ("clusters teams regardless of encryption") is the same finding from the other side.
5. **The delivery-receipt anti-lesson is the sharpest transferable item.** Signal's anonymity was defeated *by default-on politeness traffic*. Any EFS convention that echoes reception — on-chain read receipts, "seen" markers, ack edges, auto-counter-signatures, even eager "thanks-for-the-share" re-pins — is an SDA amplifier ratcheted to permanent. This must be a recorded REJECT so silence doesn't decide (Freeze §R3). Collab presence/acks belong on the off-chain encrypted relay, never the spine.
6. **Short-lived certificates → persona rotation hygiene.** Signal bounds compromise with expiring certs. The EFS analog: cheap, disposable, *interaction-scoped* personas (one per collaboration context), with the D2 persona-link pair kept private or unasserted for sensitive personas. Rotation limits the SDA window exactly as cert expiry limits cert abuse.
7. **Sealed sender hides the opposite half from EFS's wraps.** Signal: sender hidden, recipient exposed. EFS private tier: recipient hidden (random occurrence keys, A1 fix), author exposed. A complete unlinkability story needs both halves; the stealth-address lane owns the author half. The literature's warning applies to the composition: even with both halves hidden per-record, *timing correlates the pair*.

### STEAL / REJECT / the one lesson

**STEAL:** the abuse-bounding *pattern* (anonymity as recipient-granted capability) for any future EFS inbox/offer convention — if EFS ever does "anyone can drop me an encrypted offer," the drop-slot key should derive from something only intended senders hold (the recipient's shared secret), which is the delivery-token idea re-expressed in slot-key space (and consistent with E5's random-occurrence-key discipline). **REJECT:** any reception-echo convention on-chain (above). **The one lesson:** **per-record unlinkability is not conversation unlinkability; the interaction graph re-identifies, and default-on convenience traffic is how it happens fastest.** EFS must write persona guidance in interaction terms ("a persona is spent by use") and must never mint politeness traffic.

---

## 4. SKIFF — the failure case (brief but concrete)

**What happened** [VERIFIED — TechCrunch 2024-02-09, Wikipedia, emailexpert]: Skiff — E2EE mail, docs, drive, calendar; ~$14.2M raised ($3.7M seed + $10.5M Series A led by Sequoia, 2022); crypto-adjacent (IPFS storage options, wallet login, MetaMask partnership) — was acquired by Notion on 2024-02-09. Products were announced sunset within six months (extended to twelve after backlash); services mostly shut 2024-08-09, mail forwarding until 2025-02-09. The team was folded into Notion; no Skiff feature shipped as a Notion E2EE product [PLAUSIBLE on the last clause — no evidence of one as of knowledge cutoff].

**What actually killed it economically.** Not a crypto break — nothing was cryptographically wrong. The structural facts: (1) E2EE workspace = high storage + relay opex funded entirely by subscription revenue against free incumbents; (2) privacy-first consumers skew anti-subscription and are expensive to acquire; (3) E2EE *removes* the acquirer's ability to absorb the asset — Notion could buy the team but not the data or the network, so the rational move was exactly what happened: acqui-hire, kill the product; (4) VC funding made that exit the *intended* outcome. The users' encrypted bytes had no independent life: when the company died, availability died, and the only mercy was a migration window.

**The lesson for EFS's no-token private tier.** "Who pays to keep encrypted bytes alive" has a categorical answer in EFS that Skiff couldn't give: **the bytes are prepaid at write time, on-chain, permanent — availability is not an opex stream that dies with a company.** The Skiff failure mode migrates upward, to the layers EFS does *not* prepay: gateways, the OS client, the SDK, key-recovery UX. Concretely: (a) the walk-away artifact must be static and vendor-free (Fileverse F-S3), so a dead client company strands *convenience*, not *data*; (b) never let a hosted EFS-OS operator become the sole holder of anything load-bearing (salts, persona maps, recovery shares) — that recreates Skiff's custody coupling one layer up; (c) the honest marketing line: EFS inverts Skiff — permanence is the substrate's property, mortality is confined to interfaces. One residual Skiff-shaped risk to name: **key loss replaces service shutdown as the way users actually lose everything** — which is why §7 (recovery UX) matters as much as this section.

---

## 5. MLS DEPLOYMENTS — does TreeKEM matter at EFS collab sizes? (Wire, Matrix/MIMI, mid-2026)

**Deployment state (2026-07):** MLS is RFC 9420. Wire declared MLS **generally available 2025-04-24** for Wire Cloud users/teams [VERIFIED — Wire blog announcement]. Google Messages and Apple Messages began rolling out **MLS-based E2EE over RCS in May 2026** [PLAUSIBLE — IETF blog "RCS adopts MLS" per search; not read in full]. Matrix: still *integrating* — decentralized MLS ("MLS in a world with no single delivery service") has been the open problem since their 2023 "giant leap" post; MIMI (IETF interop WG) builds on MLS as the common substrate [VERIFIED that MIMI targets MLS; Matrix production status as of mid-2026: PLAUSIBLE, still not default]. The Matrix delay is itself the finding: **MLS assumes a delivery service that linearizes commits; removing that assumption is a research program, not a port.**

**The crossover question.** TreeKEM's win is re-key cost: O(log n) ciphertexts per membership change vs O(n) for pairwise wrap fan-out (sender-keys re-distribution). The honest numbers:

- Production systems run pairwise-fan-out sender keys at scale: WhatsApp groups to 1024 members, Signal groups to 1000 [PLAUSIBLE — widely documented caps; not re-verified today]. So pairwise is *shippable* three orders of magnitude above EFS collab sizes, just with painful worst-case re-keys.
- Recent measurement work finds MLS's theoretical advantage eroding in practice: "our results show that computation costs **scale linearly in practical settings even in the best-case scenario**" [VERIFIED — arXiv:2502.18303 abstract, "Experimental Analysis of Efficiency of MLS"], because tree state degrades (blank nodes) under realistic churn/concurrency.
- The literature's practical crossover for *when TreeKEM starts mattering* sits in the **hundreds of members with frequent membership churn**; below ~50 members both approaches are trivially cheap in CPU (a wrap is one HPKE seal, microseconds), and the constant factors (tree state management, commit ordering, out-of-sync recovery) dominate against MLS [PLAUSIBLE — synthesis of the evaluation literature; no single canonical number exists].

**Re-derived for EFS, where the cost unit is records, not CPU.** In EFS a wrap is a `keyWrap` TAG record: ~22–27k gas on the spine. Removal-triggered re-key of a 50-member share = re-encrypt + ~49 wraps ≈ **1.1–1.35M gas** — noticeable but occasional. TreeKEM at n=50 would cut that to ~6 ciphertexts, **but**: (1) TreeKEM requires a **totally ordered commit sequence per group** — the delivery-service role. EFS records are confluent, unordered, multi-chain; per-venue chain order (`admittedAt`) is chain-local, so cross-chain replication forks the ratchet tree — the exact class of state the master invariant bans from admission. (2) Group secrecy state on a permanent public ledger burns forward secrecy anyway (every commit ciphertext is retained forever — HNDL applies to the whole commit history, PQ-hybrid or not). (3) The kinds ruling already rejected new-kinds-for-CRDT-ops; a TreeKEM commit log is worse — it's *ordered* CRDT ops.

**Ruling this lane recommends: pairwise wrap is fine below ~50 members — with margin to spare — and TreeKEM is structurally incompatible with EFS's confluence at the protocol layer.** Above ~50 with churn, the fix is not TreeKEM-on-chain but (a) subgroup keys (wrap a team key once per member via C3-published team `encryptionKey`, then wrap file keys to the team key — one record per file, not per member; the Fileverse Portal Lock shape), accepting the coarser revocation granularity, or (b) client-layer CGKA over the encrypted relay with only the *outcome* (new wraps) landing on-chain. **Watch item:** Ink & Switch's **BeeKEM** (Keyhive project) — a TreeKEM variant explicitly designed for concurrency without a central sequencer (local-first setting) [PLAUSIBLE — explainer at meri.garden; not deeply read]. If any CGKA ever fits EFS, it is that family, and it needs **no frozen surface** (all state client-side/Durable; outcomes are ordinary wraps).

**The one lesson:** **MLS's precondition is a sequencer, and its payoff starts where EFS collab ends.** Pairwise wraps + team-key indirection cover EFS's sizes with zero new frozen surface; adopt CGKA-shaped machinery only off-spine, only later, only if group sizes demand it.

---

## 6. SHIELDED-POOL CHAINS — the narrow lesson for a legible archive (brief each)

### Zcash (Orchard)

State (secondary data, Nov 2025): ~29.4% of ZEC supply shielded — Orchard 25.4%, Sapling 3.9%, Sprout 0.2% [VERIFIED as reported figures — Messari/CoinDesk-class sources via search; not independently computed]. After nine years and the best shielded UX yet (unified addresses, light clients), **opt-in shielding remains a minority position even inside a privacy coin** — and the three-generation pool split (Sprout→Sapling→Orchard) means users must actively migrate value across cryptographic eras, fragmenting anonymity sets and requiring perpetual multi-pool tooling. What shielding costs them: every exchange/custodian/regulator interaction needs special-casing; ecosystem legibility (block explorers, analytics, DeFi composability) stops at the pool boundary. **Why "shield everything" is the wrong shape for EFS:** EFS's product *is* the legible graph; a shielded-pool EFS would be Zcash-for-files — a different product, as privacy.md §1 already rules. The Sprout→Orchard treadmill is also the anti-lesson for a frozen kernel: **EFS's crypto agility must live in client-side payload encryption (re-encrypt a file, mint new wraps), never in kernel-level pool generations** — EFS has no mechanism to migrate a "pool," and correctly so. **The steal: viewing keys.** "A key that grants read access but not spend authority… allowing selective disclosure" [VERIFIED — ECC blog + docs] — decade-hardened prior art that read-without-write capability tiers are what auditors, accountants, and courts actually consume. EFS already has the primitive shapes: HKDF-derived subtree salts (D3) + blinded-disclosure records (D4) = per-subtree incoming-viewing-keys; capability grades in the cryptree/Peergos sense. Nothing new to freeze — but the *doctrine* ("selective disclosure is a first-class ritual, with a named artifact") is worth copying loudly.

### Aztec

Seven years from founding to **Ignition mainnet 2025-11-20** — launched deliberately *empty* (500 sequencers, empty blocks, proving live) with transactions enabled early 2026, targeting Stage-2 rollup decentralization at activation [VERIFIED — aztec.network blog + coverage]. Two lessons. (1) **The cost of "shield everything programmable" is measured in half-decades** — EFS should not gate anything on that class of machinery. Also remember **Aztec Connect was sunset in March 2023** — even well-funded privacy infra gets turned off; their redeeming move was open-sourcing and keeping withdrawals live, the protocol-layer walk-away test [PLAUSIBLE — recalled; consistent with their published sunset posts]. (2) **The steal: the private/public function split.** Aztec's model — every contract has explicitly private functions (client-side proven) and public functions (sequencer-executed), composable across the boundary — is the mature articulation of EFS's dual posture: public archive spine + private-tier payloads, with the boundary explicit at write time rather than pretended away. Their note-based private state also re-teaches A1: private state slots must be *unlinkable notes discovered by trial-decryption*, which is exactly the random-occurrence-key + trial-decrypt design E5 landed on. Independent convergence.

### Penumbra

Shielded Cosmos DEX; everything shielded by default, per-account **viewing keys** so "users decrypt only their notes"; the headline novelty is **flow encryption** — swap amounts homomorphically encrypted to a **validator-threshold key**, aggregated, then only the *batch total* threshold-decrypted [VERIFIED — protocol.penumbra.zone docs]. The honest datapoint: **Penumbra launched mainnet v1 *without* threshold cryptography** — flow encryption awaited ABCI 2.0 and remained deferred [VERIFIED — their own docs/blog note]. Two reads for EFS: (1) threshold-committee decryption is a REJECT at the EFS protocol layer regardless — a validator set that can jointly decrypt is a decryption authority, the antithesis of verify-don't-trust and credible neutrality (and even its inventors couldn't ship it on schedule); (2) **the steal is aggregate-before-reveal as a *pattern***: publish individual contributions encrypted, reveal only aggregates. EFS has no protocol home for this (no committee), but lens-layer analytics ("how many attesters deny X" without listing them) could adopt the pattern client-side someday; note it, don't build it. Penumbra's sub-accounts under one viewing key [PLAUSIBLE] also prefigure the EFS persona-fleet-with-owner-labels doctrine (D2).

### The section-level lesson

All three prove the same triangle EFS already drew: **full shielding buys privacy at the price of legibility, composability, and years of engineering — and then adoption fragments anyway (Zcash 29%), or ships late (Aztec), or ships without its crown jewel (Penumbra).** EFS's chosen point — public graph, encrypted payloads, honest bound — is not a compromise of their vision; it is a different product that gets to ship now. The one primitive to import from the whole family is the **viewing-key ritual**: selective disclosure as a named, first-class, user-facing object.

---

## 7. PROTON DRIVE + CRYPTEE + STANDARD NOTES — recovery UX real consumers survive (brief)

**Proton** [VERIFIED — proton.me/support/set-account-recovery-methods]: the recovery matrix is the industry's most mature. Methods that preserve encrypted data: **recovery phrase** ("12-word sequence"), signed-in reset, device data backup ("encrypted backup keychain in your browser's web storage"), **recovery file** (downloadable keychain), and **contact-assisted data recovery** (trusted contacts verify requests). Methods that reset the account but **lose all pre-reset data**: email-only and phone-only password reset. Their doctrine, verbatim: "If you have a password reset method and no data recovery method, you'll lose access to everything that was on your account before the password reset" — the split between *account* recovery and *data* recovery is stated to the user, in advance, as two different ladders. That sentence is the whole design.

**Standard Notes** [VERIFIED — their help docs via search]: the opposite pole — Argon2-stretched password is the only root; "due to zero-knowledge encryption, Standard Notes cannot reset your password or recover your data"; forgotten password + no signed-in device = "delete your account and start over." Honest, survivable only for a self-selected user base. Their instructive bug class: on password change, "items keys can fall into an inconsistent state, where clients encountering an items key they cannot [decrypt] would reach a dead end" — **key-hierarchy state machines grow dead-end states under concurrent rotation**; EFS's monotone wrap model (new wraps supersede; old wraps remain valid for old content; nothing is mutated in place) structurally avoids this — keep it that way.

**Cryptee** [VERIFIED — crypt.ee threat-model/security pages via search]: password-derived client-side keys, and the standout feature: **ghost folders** — folders/albums that "only become visible if you know their exact name… a third party [who] gains access by coercion can't prove that you have a ghost folder unless you reveal the name." This is *shipped consumer plausible-deniability via name-as-capability* — the exact trust shape of EFS's salted TAGDEFs (D3: tagId derives from a salt only holders know; non-holders see nothing to enumerate). Cryptee proves the UX is learnable by civilians. Carry the attack-privacy V2 caveat alongside: a *compelled* salt/name disclosure is self-authenticating — deniability inverts under subpoena; per-folder salts compartmentalize.

**What the EFS OS tier should copy for walk-away recovery** — the composite ladder, each rung on existing surface:
1. **Recovery phrase as master entropy** (Proton/Peergos): BIP-39-class phrase → HKDF → {private-tree salts (D3, already legal), encryption secret keys (C3 registry keys)}. One phrase re-derives the whole private tier on a bare device against any public gateway. This is EFS's *data* recovery; there is no *account* recovery (bare-EOA — the identity key is the account; stated up front, Standard-Notes-honest, until the KEL).
2. **Recovery file** = `.efs-bundle` (§H, already ruled) with an explicit input manifest (Fileverse F-S3's seven-part lesson: name every input or recovery is fiction).
3. **Social recovery, opt-in** (Peergos N-of-M, Proton contact-assisted, Fileverse zkovery): Shamir shares of the **archive root only — never the shred root** (attack-privacy S2 partition) wrapped to friends' `encryptionKey`s via `keyWrap` TAG with random occurrence keys (A1 discipline: the friend set must not be publicly enumerable).
4. **The Proton sentence**, adapted, in the first-run UX: "Your signing key cannot be recovered by anyone. Your *data* can — if you set up a recovery method now."

**The one lesson:** **consumers survive exactly one thing: a single artifact (phrase or file) created at setup, plus optional friends — and they survive it only when the account-vs-data distinction was stated before the loss.** Everything EFS needs for this ladder is already reserved or ruled; the work is UX and doctrine, not freeze surface.

---

## 8. NYM — the transport answer EFS documents but does not build (very brief)

Nym is the Loopix lineage productized: Sphinx packet format, layered mix topology, Poisson mixing delays, **cover traffic** ("mix nodes cannot distinguish whether it is a dummy message or a normal message"), decentralized node set; NymVPN ships cross-platform with a 5-hop mixnet mode (metadata protection) and a 2-hop WireGuard mode (speed) [VERIFIED — nym.com docs + nymtech GitHub, FOSDEM 2026 materials]. For EFS this is the read/write *transport* layer: who fetched which chunks from which gateway, who relayed which envelope — out of protocol scope, exactly as privacy.md's threat-model row already says. The SDK docs should state the ladder plainly: **OHTTP + chunk normalization (P8) is the shipped floor; Tor is the general-purpose middle; a mixnet (Nym-class) is the strong end for hostile-network users; none of it is EFS's to build.** One honest caveat to include: mixnet latency is real and EFS's bulk chunk fetches are a poor fit for mixnet transport — the realistic pairing is mixnet/Tor for *writes and small reads* (envelope relay, key fetches), bulk snapshots (§H) for cold reads. And the Peergos datapoint belongs beside it: even the most privacy-committed cousin lists Tor integration in the future tense — transport privacy is perpetually the unshipped layer, which is an argument for EFS documenting it as external dependency rather than roadmap.

---

## 9. Cross-system synthesis — the five recurring lessons

1. **Everyone converges on the same wrap topology.** Peergos random labels, Fileverse's three locks, Aztec's trial-decrypted notes, E5's random occurrence keys + reserved escrow: per-object symmetric key, wrapped per-audience, slots unlinkable to recipients, owner escrow as a special wrap. EFS's reserved surface is the consensus design. Confidence in E5/C3 as frozen shapes: high.
2. **Metadata privacy is bought with legibility, everywhere, with no exceptions found.** Peergos (opaque CHAMP), Zcash (shielded pool), Aztec (private state) each pay in verifiability/composability/ecosystem tooling. No system in this corpus achieves public verifiability of structure AND structural privacy. EFS's chosen bound is not behind the state of the art; it *is* the state of the art for its mission profile.
3. **Interaction patterns defeat per-record unlinkability** (sealed sender's 5 messages; group-reception traffic analysis; co-occurrence clustering). Persona doctrine must be written in interaction terms, and no reception-echo convention may ever land on-chain.
4. **The company dies; the bytes must not** (Skiff, Aztec Connect, Peergos's future-tense Tor). EFS's prepaid permanence answers the substrate; the walk-away artifact + recovery ladder answer the layers above; both must be treated as conformance gates, not features.
5. **Recovery is the real consumer-grade privacy feature.** Every consumer system that survives (Proton, Peergos, Cryptee) ships a one-artifact data-recovery ritual and says the account-vs-data truth up front. Everything EFS needs for this is already reserved.

---

## Freeze-sensitive reservations

Adversarial check performed: for each autopsy finding I enumerated what *actually shipping it later* requires, then checked each requirement against the existing reserved surface (fs-pass-freeze-reservations.md) — looking specifically for a hidden now-or-never. **Result: this lane demands NO new ROW.** Every steal lands on already-reserved rows or post-freeze-addable conventions; the freeze-relevant output is three explicit REJECTs (recorded so silence doesn't decide), four conventions with sufficiency shown, and two sufficiency confirmations of existing reservations.

| # | Item | Class | Exact content + sufficiency test |
|---|---|---|---|
| R1 | **Private-tier metadata-suppression profile** (Peergos P-S1) | **CONVENTION** | Rule: a private-tier DATA asserts no plaintext `name`/`size`/`contentType` rows; plaintext metadata rides inside the encrypted manifest (Durable format), decrypted with the content cap. Sufficiency: the virtual-anchor rows are opt-in claims — omission needs no kernel change; the manifest format is Durable; `contentEncryption` (E6, cardinality-1 PIN) already folds format into the AEAD header per S4's fix. Post-freeze addable: fully. Nothing to reserve; registry MUST-text only. |
| R2 | **EFSBytes private-tier normalization profile** (Peergos P-S2) | **CONVENTION** | Rule: fixed chunk size + pad-to-bucket before chunking for private files (rides the §H padding MUST). Sufficiency: chunk size is a write-time client choice; the C4 per-chunk SHA-256 word is chunk-size-agnostic; manifests then reveal only padded totals. Requires no EFSBytes ABI change. Post-freeze addable: fully. |
| R3 | **No on-chain reception-echo, ever** — read receipts, "seen"/ack edges, delivery confirmations, auto-counter-signing (Signal SDA + delivery-receipt amplifier) | **REJECT — record loudly** | Any reception-echo convention is a statistical-disclosure amplifier made permanent; it defeated Signal's sealed sender in ~5 messages with a transient private log — EFS's log is total and public. Acks/presence live on the off-chain encrypted relay only. Recording the REJECT is the reservation; there is nothing to mint. |
| R4 | **TreeKEM/MLS group-key state on the spine** — epoch rows, commit sequences, ratchet-tree records (MLS §5) | **REJECT** | TreeKEM requires a totally ordered commit sequence (the delivery-service role); EFS records are confluent and multi-chain — replication forks the tree; also permanent public commit ciphertexts burn the forward secrecy that is TreeKEM's point. Pairwise `keyWrap` TAG (E5) + team-key indirection (wrap a team `encryptionKey` under an org address, C3) cover ≤50-member collab with margin. Sufficiency of existing surface: add-member = 1 wrap TAG; remove = re-encrypt + new wraps (forward-only law, already doctrine); team-key mode = C3 row under org address + E5 wraps — all expressible today. Future CGKA (BeeKEM-class) would be client-layer with outcomes as ordinary wraps: no frozen surface. Post-freeze addable: yes, precisely because nothing kernel-side is needed. |
| R5 | **Threshold-committee decryption** (Penumbra flow encryption) | **REJECT** | A committee that can jointly decrypt is a decryption authority — breaks verify-don't-trust and credible neutrality; Penumbra itself shipped mainnet v1 without it. No EFS row, no reserved committee registry. Client-side aggregate-before-reveal patterns need nothing frozen. |
| R6 | **Server/gateway ciphertext gating at protocol level** (Peergos BATs) | **REJECT** | On-chain state is unconditionally readable; a protocol gate is theater (the class of no-security-theater the honesty norms ban). Gateway-side policies for off-chain mirrors are out of protocol and need nothing reserved. |
| R7 | **Recovery ladder** (Proton/Peergos/Cryptee/Fileverse §7) | **CONVENTION** | (a) recovery phrase → HKDF → {D3 salts + C3 secret keys} — D3 already legalizes deterministic HKDF salts; (b) recovery file = §H `.efs-bundle` + an input-manifest section (Durable format detail); (c) social recovery = Shamir shares of the **archive root only, never the shred root** (attack-privacy S2 partition), wrapped to friends via E5 TAGs with **random occurrence keys** (A1: friend set must not be enumerable). Sufficiency: uses only C3, E5, D3, §H — all reserved/ruled; the shred/archive partition is convention text. Post-freeze addable: fully. |
| R8 | **Viewing-key-style selective disclosure** (Zcash/Penumbra §6) | **CONFIRM SUFFICIENT** | The EFS expression is D3 (HKDF subtree salts = hierarchical incoming-viewing-keys) + D4 (blinded-disclosure record = the disclosure artifact) + capability grades. Checked for hidden gaps: per-subtree disclosure → per-folder salts (already recommended, V2); auditor-grade read-only → read cap without write key (capability structure, Durable); outgoing-viewing-key analog ("prove what I authored/shared") → composable from D4 disclosure records post-freeze. No new reservation. |
| R9 | **Persona rotation hygiene** (sealed-sender cert expiry §3) | **CONVENTION** | Interaction-scoped personas; D2 persona-link pair already reserved for the linkage record (and the link record's visibility question is already James-tracked in privacy.md §11). Nothing new frozen. |
| R10 | **Kernel-generation crypto agility** (Zcash pool-migration anti-lesson §6) | **CONFIRM SUFFICIENT (negative)** | EFS must never need a "pool migration": agility lives in client-side re-encryption + C3's KEM/KEX registry (separate from signature algoTags per S1) + E6's header-folded format. Checked: no autopsy finding requires kernel-level cryptographic state that could age — the kernel stays crypto-free except signature admission (identity lane's PQ path, already a dated obligation). |

**The one place this lane touches a live ceremony item:** R1/R8 lean on E6's S4 fix (format folded into the AEAD header, no plaintext interned format VAL) and E5's A1/A2 fixes (TAG-only, random occurrence keys, reserved self-escrow). Those fixes are already in the reservation set; this lane's autopsies independently re-confirm both from production systems (Peergos random labels; Fileverse lock triple; Aztec trial-decrypted notes). If either fix were dropped at the ceremony, the corpus here is the evidence for reinstating it.

---

## Decisions for James

Plain-English, with examples. None are ceremony-blocking rows; 1–2 ratify REJECTs that should be recorded before the freeze so silence doesn't decide.

### 1. Ban on-chain read receipts and "seen" markers — ratify the REJECT (R3)

Signal hid who sends every message, and researchers still unmasked chat partners in about five messages — because the app automatically sent "delivered ✓" messages back, and those echoes gave the pattern away. On EFS the same echo would be public and permanent, so it's strictly worse. Example: if the future collab app wrote a little "Bob opened this doc" record on-chain, anyone could link Bob to the doc's author forever — even if both used fresh anonymous personas.
- **Option A (recommended):** hard REJECT in the registry: no reception-echo record shapes, ever; acks/presence live only on the off-chain encrypted relay.
- **Option B:** allow opt-in public acks with a loud warning label. (Not recommended — defaults drift, and one polite app un-anonymizes its whole user base.)

### 2. Private files carry no plaintext labels — adopt the suppression profile (R1 + R2)

Even with perfect encryption, a private file that publicly says `name=divorce-settlement.pdf, size=1.2MB` has leaked most of what matters. Peergos hides names/sizes by padding everything to uniform blocks and keeping labels inside the ciphertext; EFS can do the same by *not asserting* those rows on private files and putting them inside the encrypted manifest instead.
- **Option A (recommended):** MUST-level convention — private-tier files assert no `name`/`size`/`contentType` rows and use the normalized chunk/padding profile; the OS does this automatically.
- **Option B:** SHOULD-level guidance only. (Cheaper, but "should" privacy defaults historically lose.)
- **Option C:** allow a padded-bucket `size` row for UX (sorting by approximate size) with the leak named. (Middle ground if the OS needs it.)

### 3. Group sharing engine: pairwise wraps now, team keys at scale — no MLS on-chain (R4)

Sharing a file with 10 people = 10 small "wrapped key" records. Removing someone = re-encrypt + re-wrap to the rest. Fancy group cryptography (MLS/TreeKEM, what WhatsApp-scale messengers use) only pays off in the hundreds-of-members range, and it needs a central sequencer EFS deliberately doesn't have.
- **Option A (recommended):** pairwise wraps as the default; for big teams, one shared "team key" published per org (one wrap per member once, then one wrap per file) — coarser revocation, stated honestly.
- **Option B:** pairwise only, revisit at pain. (Simplest; risks org UX complaints.)
- **Option C:** adopt a CGKA (BeeKEM-class) client-side later if collab groups exceed ~50 with churn — watch item, zero freeze cost either way.

### 4. Ship the recovery ladder as OS-tier doctrine (R7)

Proton's rule worth copying verbatim: account recovery and *data* recovery are different things, and users must hear it before disaster. For EFS: your signing key is unrecoverable (until the KEL era), but your *encrypted data* is recoverable if you make one artifact at setup. Example: at first run the OS says "Write down these 12 words. They restore your private files on any device. Nobody — including us — can do it without them," and optionally "pick 3 of 5 friends who together can restore your archive (never your shredder)."
- **Option A (recommended):** phrase (default, mandatory prompt) + recovery file (`.efs-bundle`, offered) + social recovery (opt-in, archive-root only).
- **Option B:** phrase + file only. (Simpler; loses the one mechanism — friends — that non-technical users actually complete.)
- **Option C:** file only. (Standard-Notes austerity; honest but brutal.)

### 5. Make the walk-away test a versioned, shipped conformance gate (Fileverse F-S3, Skiff §4)

Fileverse ships a static web page that decrypts your documents with zero company infrastructure — but it needs seven manually exported key pieces, which is where such promises quietly fail. Skiff shows why this matters: when the company exits, the migration window is all users get.
- **Option A (recommended):** a static, SDK-independent walk-away page + a CI conformance test: "fresh machine + recovery phrase + any public RPC ⇒ full private-tree recovery," run on every release; the `.efs-bundle` manifest names every required input.
- **Option B:** documented procedure only. (The Fileverse lesson is that un-executed procedures rot.)

### 6. Adopt the "viewing key" ritual as a named product feature (R8)

Zcash's most durable contribution isn't shielding — it's the read-only key you can hand an auditor: they see everything in scope, can change nothing, and you chose the scope. EFS already has the parts (per-folder salts + disclosure records). Naming it — e.g. "Disclosure Key for /taxes/2026" — turns a cryptographic capability into a thing users and courts understand.
- **Option A (recommended):** name it, document it, add to the OS share sheet ("share read-only proof of this folder").
- **Option B:** leave as an implicit capability property. (Free, but selective disclosure unnamed is selective disclosure unused.)

---

## Confidence

**VERIFIED (primary source read today, 2026-07-11):**
- Peergos: cryptree structure + read/write split; capability contents incl. BATs; merkle-CHAMP random-label design; 5 MiB chunks padded to 4 KiB multiples; metadata under separate key (names/size/mtime/thumbnail/mime); scrypt(2^17,8,1) login derivation; mutable-pointer signed CAS + sequence numbers; BAT mechanism; X25519+ML-KEM hybrid for shared files / symmetric-only-is-already-PQ claim; Tor integration future-tense; Cure53 2019 report exists (+ named findings via search of report text); 2024 Radically Open Security audit blog summary. (All from book.peergos.org pages and peergos.org blog.)
- Fileverse: walk-away README (three locks, AES file key, seven-part RSA backup key set, static recovery page); fileverse-cryptography repo tree, README, and raw `src/ecies/config.ts` + `core.ts` (secp256k1, HKDF-SHA256, AES-256-GCM, ephemeral keys, 12-byte nonce); zk-granular-permissions README (vOPRF via @cloudflare/voprf-ts, OZ Merkle tree, IPFS + on-chain hash, audits "pending publication"); org repo list (zkovery, collaboration-server, walk-away).
- Signal: sealed-sender blog (certificates, 96-bit delivery tokens from profile keys, contact restriction, block→key-rotation, open timing/IP work); NDSS 2021 paper page (SDA, delivery-receipt amplification, "as few as 5 messages," works over Tor/VPN, <$40/month fixes); arXiv:2305.09799 abstract (group-level extension).
- Skiff: acquisition 2024-02-09 (TechCrunch), $3.7M seed + $10.5M Sequoia Series A = $14.2M, shutdown 2024-08-09 with forwarding to 2025-02-09 (Wikipedia/coverage).
- MLS: Wire GA 2025-04-24 (Wire blog); arXiv:2502.18303 abstract ("computation costs scale linearly in practical settings even in the best-case scenario"); MIMI-builds-on-MLS (IETF materials).
- Zcash: viewing-key semantics (ECC blog/docs); shielded-supply figures ~29.4%/Orchard 25.4% as of Nov 2025 (reported by research secondaries — figures not independently computed).
- Aztec: Ignition mainnet live 2025-11-20, empty-block phase, transactions early 2026 (aztec.network blog + coverage).
- Penumbra: flow-encryption design (protocol docs) and mainnet-v1-shipped-without-threshold-crypto (their own materials).
- Proton: full recovery-method matrix incl. the data-loss warning sentence (proton.me support doc).
- Standard Notes: Argon2 derivation, no-recovery doctrine, items-key inconsistency dead-end (their help docs/issues via search).
- Cryptee: ghost-folder deniability semantics (crypt.ee threat model via search).
- Nym: Loopix/Sphinx/cover-traffic architecture, NymVPN 5-hop + 2-hop modes (nym.com docs, nymtech GitHub).

**PLAUSIBLE (recalled or secondary; not re-verified today):**
- Peergos N-of-M social recovery mechanism details; Peergos global-username-PKI characterization (chapter exists, not read in full).
- Fileverse: link-key-in-URL-fragment placement; Gnosis Chain as portal home (verified in the 2026-07-10 round, not re-checked); wallet-signature-derived login keys in the apps; the "no forward secrecy / re-encrypt everything" repo quote (structurally true by inspection of the static lock model; quote unlocated).
- Signal shipping partial receipt mitigations post-2021.
- WhatsApp 1024 / Signal 1000 group caps on sender-keys fan-out; "crossover in the low hundreds" as literature synthesis (no single canonical number exists).
- Google/Apple RCS MLS rollout May 2026 (search-level IETF blog reference); Matrix MLS still non-default mid-2026.
- Aztec Connect sunset details (open-sourcing + live withdrawals); Penumbra sub-accounts; BeeKEM design intent (explainer-level).
- Notion never shipping a Skiff-derived E2EE feature (absence claim, as of knowledge cutoff).

**COULD NOT VERIFY (named, searched, not found):**
- Any published Fileverse audit PDF (Nethermind public-reports repo and X41 publication list searched — nothing). §7's "only auditor names are public" remains true as of 2026-07-11.
- A published security audit of transcend-io/penumbra itself — soften privacy.md §7's "audited Penumbra lib" accordingly.
- The zk-granular-permissions README's explicit leak self-admission ("permission existence and update timing") — architecture makes the leaks true by inspection, but the self-admission text wasn't found where I looked today.
- The full NDSS 2021 paper body (PDF fetched but not text-extractable in this environment; abstract, paper page, and follow-on poster used instead) — the "5 messages," receipt-amplification, and fix-cost claims all come from the verified paper page, not the body.
- Peergos social-recovery and PKI book chapters in full; the exact ML-KEM parameter set (768 vs 1024) in Peergos's hybrid.
