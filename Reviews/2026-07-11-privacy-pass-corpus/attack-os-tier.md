# Red team — the OS private-tier design (Deep Privacy Pass, 2026-07-11)

**Lane:** RED TEAM — OS private tier.
**Charge:** attack the OS private-tier design as a hostile reviewer AND as real users failing — walkthrough audit, cap-URL leaks, races/partial states, persona cross-contamination, recovery honesty, economics, canon consistency.
**Status:** draft — adversarial record. #status/draft #kind/review #topic/privacy #pass/deep-privacy

---

## 0. LOUD METHODOLOGY CAVEAT — read this first

**My mandated target file `Reviews/2026-07-11-privacy-pass-corpus/os-private-tier.md` did not exist at any point during my session window.** The sibling lanes landed in front of me (`metadata-adversary.md`, `read-privacy.md`, `frontier-zk.md`, `frontier-stealth.md`, `law-positioning.md` all appeared); the OS-tier lane file did not. I waited on it with a filesystem monitor and it never arrived before the deliverable was forced.

Consequences for honesty:

- **I could NOT run the literal walkthrough audit the charge asks for** ("replay every numbered walkthrough" against the reserved surface). There were no numbered walkthroughs in front of me to replay.
- **What I did instead:** I reconstructed the canonical OS private-tier walkthroughs from the authoritative sources that a consolidating `os-private-tier.md` would itself be built from — `client-os-pressure-report.md` (P9 private/encrypted tier + P4 personas), `Designs/clientv2/wallet-and-actions.md` (the persona/custody/recovery/private-link doctrine of record), `privacy.md` (Layer 1/2), `fs-pass-freeze-reservations.md` (the reserved surface), `fs-pass-synthesis.md` (canon C1–C14), plus the two sibling adversary lanes — and audited **those** against the reserved surface. Every finding below is anchored to a cited primary source, not to the missing file.
- **What this means for the reader:** treat this as a red team of *the OS private-tier design as it is specified across the corpus today*. When `os-private-tier.md` lands, re-run the walkthrough-bookkeeping section (§1) against its actual numbered steps; my structural findings (§2–§7) do not depend on its phrasing and should transfer, but its specific row citations must be checked line-by-line.

I flag this rather than paper over it, per the pass's honesty norms. A finding built on a file I never read would be exactly the security theater the brief forbids.

**Second-session re-verification (2026-07-11, later run):** the lane was re-run; `os-private-tier.md` is STILL absent from the corpus (only the eight sibling lane files exist). This report's load-bearing citations were independently re-verified against the primaries this second session: wallet-and-actions (persona/custody rung-1, "either alone leaks" §Gas, one-author-per-envelope, Apple/Google-escrowed passkey PRF, promptless-under-`allowedSubtrees`), os-pass-handoff (G4 `submitSubset` tearing + pending/confirmed/final owned by the OS pass; forward-only law at grant time; "born-shreddable files" in private-by-default onboarding), the century-storage review §7 + coherence audit ("Private-century and crypto-shreddable diverge … do not promise both as one property" — verbatim), metadata-adversary (Playbooks 2/3/5/7/8, §7 R1/R2/C1, V2 conventions — all as cited), attack-privacy (A1/A2, S2/S3/S4/S7, V4), fs-pass-freeze-reservations (C3, D3/D4, E5/E6, A2, §H), codex-kinds, identity (G9/amendment 1), privacy.md §3.2 ("activation is post-freeze" — the basis of the W2/W3 finding), fs-pass-synthesis C1–C14, and read-privacy's $0.0005–$0.005/record band. **Every checked citation held.** The findings stand as written; the walkthrough-replay obligation against the real `os-private-tier.md` remains open until that file exists.

---

## 1. Walkthrough audit (reconstructed) — bookkeeping against the actual reserved surface

I replay the six walkthroughs any OS private tier must contain, and check that **every record each step writes actually exists as a mintable/reserved row**, and that steps flagged as shippable are actually shippable at the tier they claim.

### W1 — Create a private file
Steps: write `DATA` (owned, salt) → `contentEncryption` PIN (cardinality-1, format folded into AEAD header) → `keyWrap` TAG(s) (random occurrence keys) → placement PIN under a container. Recipient's `encryptionKey` PIN must already be published (ADDRESS-parent, separate KEM registry).
**Verdict: CLEAN.** Every row is real: `contentEncryption` = fs-pass-freeze-reservations E6/C-virtual-anchor (PIN, card-1); `keyWrap` = TAG-only, C6/E5; `encryptionKey` = C3 (minted). No step writes a nonexistent record. The one nuance (S4 from attack-privacy) — `contentEncryption` must be header-folded, not a plaintext VAL — is a convention, not a bookkeeping error.

### W2 — Create a private *folder* (salted path)
Steps: write a **salted `TAGDEF`** (`DOMAIN_ANCHOR_SALTED`, blinded name in body) → children under it → share a read-cap in the URL fragment.
**Verdict: FATAL-CLASS EXPECTATION BUG if the lane presents private folders as available at v2 launch.** The salted-TAGDEF family is *reserved and fully pinned* (D3) but its **resolver is only reserved into the registry resolver-gate set — activation is explicitly post-freeze** (privacy.md §3.2: "Reserved-and-pinned in v2 … but activation is post-freeze"; attack-privacy S7: without the resolver-gate reservation "the family cannot instantiate"). A salted TAGDEF written at launch targets a resolver that **does not run in the v2 kernel**. So:
- Private *files* (W1) ship at v2 launch (they need no salted resolver — content encryption + wraps are ordinary rows).
- Private *folders / salted paths* (W2) **do not ship at v2 launch** — they are a post-freeze activation.
- **If the OS-tier lane's walkthrough treats "create a private folder" as a day-one flow, that is a FATAL bookkeeping/expectation error** — it writes against a dead resolver. **Repair:** the lane must state the tiering plainly — "confidential *files* at launch; salted private *folders* and salted private *persona-links* are a reserved-but-post-freeze-activation capability" — or the whole private-directory UX is vaporware at ship. This same dependency sinks W3 and the private persona-link default (W5).

### W3 — Private persona link (unlinkable persona)
Steps (wallet-and-actions §Persona privacy): place each side of the persona↔primary pair at a **salted-capability anchor** (handle in the fragment) + **encrypt the link body** with `keyWrap` to a per-link key.
**Verdict: RIDES THE SAME POST-FREEZE DEPENDENCY as W2 (SERIOUS).** The salted anchor is the salted-TAGDEF family again. So the *private* persona-link — the one whose entire purpose is unlinkability — is **not available at launch**; only the *public* plaintext link (the correlated one) ships day one. A user who wants unlinkable personas at launch gets… the fully-correlated public link. **Repair:** say so, or provide a launch-viable private-link encoding that does not depend on salted activation (e.g. an ordinary DATA at an *unpublished* dataId whose id is shared only via the fragment — the dataId salt already hides it; this may sidestep the salted-TAGDEF resolver entirely and is worth a design check).

### W4 — Remove a member (re-key)
Steps: rotate FEK → re-encrypt → re-wrap `keyWrap` TAGs to the remaining set → (optionally) supersede `encryptionKey`/the folder-KEK.
**Verdict: rows exist; but the walkthrough is DISHONEST unless it surfaces lazy-rekey permanence (SERIOUS, = attack-privacy S3).** See §3 race analysis. No nonexistent record, but "removed" is a lie for cold files under lazy re-key.

### W5 — Total-loss recovery
See §5 — this is where the design either sneaks in a trusted third party or stays honest. No bookkeeping-nonexistent record (recovery is off-chain key material), but the *promise* is where the fatal honesty risk lives.

### W6 — Crypto-shred a file
Steps: destroy the FEK and every wrap-target key path → ciphertext survives as noise.
**Verdict: rows exist (revoke placement + key destruction is off-chain); but it COLLIDES with W5 (FATAL honesty risk).** A key hierarchy that W5 can recover after total device loss is a key hierarchy W6 cannot shred. See §5/§7.

**Walkthrough-audit net:** no walkthrough writes a *nonexistent* row. The fatal-class problems are (a) **W2/W3 write against a post-freeze-only resolver** — if presented as launch capabilities that is a real defect; and (b) **W5 vs W6 are mutually exclusive for one key hierarchy** — a promise-level fatal if sold as one tier.

---

## 2. Cap-URL leaks — pricing the fragment-cap surface

The design leans hard on **Tahoe read-caps in the URL fragment** (privacy.md §3.2; read-lens-spec §6.5: fragment "never sent to servers or chain"). That single claim is doing a lot of work. It is true for the *origin server and the chain* and false for a surprising number of other sinks. Real leak surface, priced:

| Sink | Does the fragment leak? | Confidence |
|---|---|---|
| Origin server / gateway (HTTP request) | **No** — fragments are not sent in the request line or `Referer` (attack-privacy V4 — VERIFIED against HTTP semantics). This is the load-bearing true claim. | HIGH |
| Browser history **cloud sync** (Chrome→Google, Safari→Apple) | **YES — full URL incl. fragment is uploaded to the vendor** (attack-privacy V4a). The cap lands on Google/Apple servers. | HIGH |
| Clipboard managers (Paste, Maccy, Windows Cloud Clipboard) | **YES** — cloud clipboard history syncs copied URLs verbatim, fragment included; a shared read-cap copied to send is captured. | MEDIUM-HIGH (product-dependent; cloud-clipboard sync is default-on for many) |
| Screenshots / screen-share of the address bar | **YES** — the cap is rendered plaintext in the URL bar; any screenshot (or an OS screenshot-history feature, or a screen-share) captures it. | HIGH |
| Chat-app **link previews** | **Split — and the design has not priced it.** The *preview fetch* a server makes strips the fragment (servers never get it), so the *unfurl bot* does not see the cap. BUT the **chat app's own client/backend holds the full message text including the fragment** — iMessage/WhatsApp/Signal/Slack store the message (often server-side or in cloud backup) with the cap in it. So the cap leaks to the *messaging provider's message store*, not to the link-preview subsystem. | MEDIUM-HIGH — the distinction matters: "previewers don't fetch fragments" is TRUE and is *not* the leak; the message store is. |
| OS Spotlight / Windows Search indexing | **YES if the URL is saved to a file/note** — Spotlight and Windows Search index note/document contents including pasted URLs with fragments. | MEDIUM |
| QR codes for sharing a cap | **YES** — encodes the whole URL; anyone who photographs it has the cap. | HIGH (if the OS offers QR share, which OS UIs love) |

**Assessment of the design's mitigation.** The corpus mitigation (wallet-and-actions §Persona privacy; attack-privacy V4) is: **"wrap durable caps to the recipient's `encryptionKey`; raw fragments only for ephemeral shares."** This is the *right* mitigation and it defeats every sink above *for durable shares* — because the durable share is a ciphertext blob addressed to the recipient's key, not a bearer cap in a URL. **The residual is entirely on the "ephemeral raw-fragment" path**, and the honest finding is:

- **SERIOUS: a bearer cap in a URL fragment is a bearer cap in your clipboard-sync, your browser-history-sync, and your chat-app message store.** The "ephemeral" framing understates this — users paste "ephemeral" links into exactly the synced, backed-up, screenshot-happy surfaces above. **Repair:** the OS-tier UX law should be *raw fragment caps are for same-device / air-gapped hand-off only* (show-QR-then-clear, or copy-with-auto-expire-from-clipboard), and **any share into a messaging/notes/cloud surface MUST route through the wrapped-to-recipient path**, not the raw cap. The composer should detect "you are pasting a raw cap into a synced surface" and upgrade it. This is a real UX guard, not theater — it moves the clipboard/history/message-store adversary from "has your cap" to "has a ciphertext addressed to someone else."
- **NOTE: the link-preview question specifically resolves in the design's favor** — server-side unfurl bots never receive the fragment, so the widely-feared "Slack previewed my secret link and now Slack's crawler has it" vector does **not** apply to the fragment. Say this explicitly so no one over-rotates on it; the real leak is the message store, not the crawler.

---

## 3. Races and partial states

### 3.1 Remove-member re-key race (removed member reads during the sweep)
**Finding (SERIOUS, = attack-privacy S3, sharpened for the OS UX).** Re-key is **lazy by default** (each file's FEK rotates on its *next content write*; attack-privacy §3.4/S3). Therefore:
- A file **never rewritten never re-keys**, so the removed member's retained FEK/old-KEK wrap decrypts it **forever**. "Removed; N files pending re-key" implies a transient state that *for cold content never resolves*.
- A member who goes **offline mid-sweep** simply retains every key they already pulled; nothing about the sweep reaches into their device.
- The removed member **reading during the sweep** trivially succeeds for any not-yet-rotated file.
**Repair (OS-tier UX law):** the removal UI must say which mode is in force and must NOT render "removed" as clean. Offer **eager re-key** for security-critical removals (rotate every file's FEK now), and render lazy removal as *"removed for future writes; K cold files remain readable by the removed member until each is next edited."* This is the forward-only law wearing an operational face — surface it at *removal* time, the way the FS-pass surfaces it at *grant* time.

### 3.2 Publish-ceremony crash mid-way (half-published private tree)
**Finding (SERIOUS).** Single-envelope writes are atomic (one signature over a Merkle root — fs-pass-synthesis: "atomicity, stronger than POSIX"). But a private *tree* publish is **multi-envelope** by necessity: (a) one author per envelope (wallet-and-actions: "persona and primary records can never share one envelope"), and (b) large trees exceed one envelope. And **batch atomicity is scoped — batches tear at the writing venue mid-resume; `submitSubset` partial admission is first-class** (os-pass-handoff G4). So a crash mid-publish leaves **some salted nodes + wraps admitted, others not**. A cap-holder resolving the tree then sees a **partial tree graded UNKNOWN at the missing positions** (read-lens-spec §2.1 — and correctly, the resolver must STOP, not fall through). Not silent corruption — but the OS-tier UX must own a **pending/confirmed/final taxonomy for private-tree publishes** (os-pass-handoff explicitly hands this to the OS pass) and a resumable commit marker (the manifest-root-in-final-chunk rule). **Repair:** the private-tree publish is a *ceremony with a commit point*; render half-published trees as "publishing (K of N)" and make resume idempotent (deterministic ids make re-submission a no-op).

### 3.3 Two devices re-keying concurrently — the lost-FEK hazard (SERIOUS, sharpest race)
This is the one the charge asks about ("LWW on the wrap rows — lost wraps?") and the answer is subtler than "lost wraps":
- **Wrap rows themselves do not collide.** `keyWrap` is a TAG (cardinality-N); slot key is `(author, keyWrapDef, fileId, occurrenceKey)` with **random occurrence keys**. Two devices generating two wraps get two *different* random occurrence keys → **two distinct slots → both admitted, neither lost.** So at the wrap layer, no LWW loss. Good.
- **But `contentEncryption` and the FEK collide.** If both devices independently rotate the FEK (e.g. both process the same "remove Bob" intent), each re-encrypts the file under a *different* new FEK and each writes a `contentEncryption` PIN (**cardinality-1**). The two PINs LWW-resolve by `(order, recordDigest)` → **one FEK's ciphertext wins; the other is orphaned.** Now the wraps written by the *losing* device are live slots pointing at a **dead FEK** — the recipients who happened to trial-decrypt the losing wrap hold a key that no longer decrypts the winning ciphertext. Effect: **not lost wraps — lost *plaintext access* for a subset of legitimate recipients until they re-fetch and trial-decrypt the winning FEK's wrap.** And if the two devices re-wrapped to *different remaining-member sets* (racy membership view), a member could end up with **no live wrap under the winning FEK at all** → legitimately-still-a-member, silently locked out.
**Repair:** FEK rotation must be **single-writer per file** — serialize re-key through one device (the Kernel's outbox already serializes per author; make re-key a checkpoint operation, not a promptless persona write), or make the new FEK a **deterministic function of (old FEK, membership-epoch)** so concurrent rotations converge on the same FEK and the same ciphertext (a Cryptree/MLS-epoch discipline). Without one of these, concurrent multi-device removals silently lock out real members. **This is a genuine correctness hazard the OS tier must design against, not a mere metadata leak.**

---

## 4. Persona cross-contamination

### 4.1 Wrong-persona write — loud or silent?
**Finding (SERIOUS).** The structural protection is real but partial:
- **Structural freebie (loud where it counts):** an envelope carries **one signature**; persona and primary records **cannot share an envelope** (wallet-and-actions). So you can never *co-batch* a private-tier record with a public-identity record — cross-persona co-batching is impossible (metadata-adversary Playbook 2). Good.
- **The silent gap:** nothing structurally prevents *authoring a private-tier file under the wrong persona*. Personas write **promptlessly under Kernel policy** (wallet-and-actions: "no System Chrome prompt per write"), gated only by `allowedSubtrees`. If a private-tier subtree is writable by a **public-linked** persona (overlapping `allowedSubtrees`, or the user simply has the wrong persona active), a one-click "save" authors a private file under an **identifiable** author word. The file content stays encrypted, but its **existence + exact TID time + device bits are pinned to the public identity** (metadata-adversary Playbook 2/3). The composer groups by author and the outbox shows the author — so it is *inspectable* — but it is **not a loud guard**; a promptless write can land before the human looks at the outbox.
**Repair (UX law):** writing into a *salted / private-tier* subtree under a *public-linked or unlinked-mismatched* persona must trip a **loud, non-promptless guard** — "this private file will be authored by your PUBLIC identity james.eth; switch to an unlinked persona?" — i.e. private-tier writes are a severity class that **breaks the promptless path** (analogous to S3 identity/value writes routing to System Chrome in wallet-and-actions). Private-tier authorship is exactly the case where promptless-under-policy is too weak.

### 4.2 Does the recommended persona-link default survive the metadata lane's linkage attacks?
**Finding (SERIOUS — a default that does not survive its own threat model).** The unlinkable-persona value proposition survives **only if two defaults hold together**, and the corpus is explicit that either alone leaks:
- wallet-and-actions §Gas: *"Persona-pseudonymity is honest only with a **private link AND** relayed/sponsored flush — either alone leaks."*
- metadata-adversary Playbook 7: personas **collapse on funding provenance** (Meiklejohn multi-input/change-address template applied to Ethereum) — funding two persona addresses from one source links them regardless of link privacy.
So the recommended default for an unlinkable persona must be **(private link) AND (relayed/sponsored flush) AND (no funding from a linked wallet)**. If the OS-tier lane recommends the private link but leaves **funding/flush to the user's discretion**, the default **does not survive** — funding provenance re-links the personas with HIGH confidence (metadata-adversary Playbook 7.1). And note §3's finding: the private link *itself* depends on salted-family activation (post-freeze), so at launch even the link half is unavailable.
**Repair / decision (James, §Decisions):** for any persona the user marks "unlinkable," the OS **defaults to sponsored/relayed flush and refuses (or loudly warns on) top-up from a linked wallet** — the funding ceremony warning already exists (wallet-and-actions §Gas) but a *warning* is not a *default*. Make it the default or the unlinkable persona is unlinkable in name only.

---

## 5. Recovery honesty — where does the recovery key LIVE, and does a trusted third party sneak in?

This is the section where the design most tempts a dishonest answer. Tracing the loop against wallet-and-actions rung-1 custody + the two 2026-07-10 cypherpunk audits:

**The custody options the corpus actually offers (wallet-and-actions rung-1):**
1. **Passkey PRF (default)** — vault re-openable after total origin eviction because the PRF output is stable across passkey sync. **But synced passkeys are escrowed by Apple/Google** (wallet-and-actions states this: "synced passkey = recoverable but Apple/Google-escrowed").
2. **Device-bound** — sovereign, **no cloud recovery** (total device loss = key death).
3. **Wallet-derived HKDF (fallback)** — re-derivable from the wallet seed → recovery = whatever recovers the wallet seed (paper/steel backup, or the wallet vendor's escrow).

**The trace (the honest loop):**
- If recovery-after-total-loss is promised, the recovery key must live somewhere that survives losing all your devices. The only somewheres are: **(a) a vendor escrow** (Apple/Google passkey sync — a **trusted third party**, and one subject to lawful-access demands), **(b) a memorized passphrase or paper/steel seed** (sovereign and honest, but then the user can lose it → identity death, and it is phishable/coercible), or **(c) a successor-custodian / Shamir-share scheme** (the century-storage audit's "diversified recovery shares, successor custodians" — **also trusted third parties**, chosen ones).
- **A recovery key wrapped to itself is circular** and recovers nothing — correctly flagged in the charge; none of the corpus options do this, good.

**Findings:**
- **SERIOUS (honesty): the "total-loss recovery" story cannot be simultaneously (sovereign) and (survives losing everything you hold).** Recovery from nothing-you-hold *requires* something-someone-else-holds (escrow/custodian) or something-you-memorize (passphrase). The corpus is actually honest about this in the small (wallet-and-actions names the escrow tradeoff at first-run), but the OS-tier lane must carry the tradeoff into the *tier promise*, not bury it in a custody footnote. **Does a trusted third party sneak in? YES, for the default (passkey PRF = Apple/Google escrow).** That is a defensible product choice — but it must be *named as such at the tier level*, because "cypherpunk, verify-don't-trust" and "your recovery is Apple-escrowed by default" are in visible tension.
- **FATAL (honesty) if the tier promises recovery AND crypto-shred as one property.** This is the century-storage / coherence-audit finding (Reviews/2026-07-10, "private-century and crypto-shreddable diverge"): a key that is **recoverable after total loss** (escrow/custodian/passphrase re-derivation) is a key that **cannot be crypto-shredded** (a re-derivable key means the ciphertext is never permanently inert). W5 and W6 are mutually exclusive **for the same key hierarchy**. If the OS private tier is sold as "private-by-default so it's crypto-shreddable" (privacy.md §3.4 leans on exactly this) *and* "recoverable after you lose all devices," it is promising both halves of a contradiction. **Repair (and it is the century-audit's repair): split the tier.** `private-recoverable` (escrow/custodian, honest that it is NOT shreddable) vs `private-shreddable` (high-entropy enclave-bound key, never escrowed, honest that total device loss = permanent loss). The user picks per file/subtree. A single "private tier" that implies both is the dishonest shape.
- **SERIOUS: passphrase-derived shred-roots are not shreddable (attack-privacy S2).** If any shred-root is passphrase-derived, it survives in memory / password managers / their cloud backups → not destroyable → the "genuinely shredded" render is false. Disqualify passphrase derivation for the *shreddable* root (enclave-bound only); passphrase derivation is legal for the *recoverable* root, where re-derivation is the point.

**Recovery-bundle ceremony verdict:** the corpus mechanism (encrypted vault blob + wrap secret from passkey PRF or wallet HKDF; pre-signed revoke-all ladder stored encrypted beside the persona) is **structurally sound and not circular** — the wrap secret comes from an *independent* source (passkey/wallet), satisfying the G9 "wrap targets independent of the identity signing key" law. The honesty gap is not in the mechanism; it is in the **tier-level promise** (recover ⊕ shred) and the **default trusted third party** (escrow).

---

## 6. Economics / sustainability of a re-key tier

Order-of-magnitude sanity, at the ~22–27k gas/record floor on a cheap L2 (read-privacy.md prices a record at **$0.0005–$0.005**):

- **One private file shared to 5:** DATA + contentEncryption PIN + placement PIN + 5 keyWrap TAGs ≈ **8 records ≈ $0.004–$0.04**.
- **A 5-person team, ~50 new shared files/month:** ~400 records/month ≈ **$0.2–$2/month**. Trivial. Confirms read-privacy's dollar-metered-growth thesis at the team scale.
- **Re-key storm (remove one member, eager re-key of a 500-file shared tree):** re-wrap each file's FEK to the remaining 4 = 500 × 4 = **2,000 wrap records ≈ $1–$10, one-time, paid by the remover.** Order-of-magnitude fine — but note the *shape*:
  - **NOTE→SERIOUS (economics reinforce the security hole):** re-key cost scales as **O(files × remaining members)** and is **paid by whoever performs the removal.** On a large tree this creates a direct economic incentive to choose **lazy re-key** — which is precisely the mode that leaves cold files readable by the removed member forever (§3.1 / attack-privacy S3). So the gas economics *push users toward the insecure removal mode.* This is the honest coupling: the cheap default is the leaky default. **Repair:** make the eager-vs-lazy choice explicit at removal with the security consequence stated ("clean removal now: ~$X in re-key writes; or free lazy removal: K cold files stay readable by the removed member"), so the user is choosing security-vs-cost consciously, not defaulting into a leak to save cents.
- **Who pays for re-key on a permanent chain:** every wrap is a permanent record (~22–27k gas + forever storage). Padding/cover-traffic mitigations (metadata-adversary Playbook 5) impose a **permanent forever-cost** for weak blur — correctly graded weak; the OS tier should not default them on.

**Sustainability verdict:** the private tier is **economically sane at team scale** (single-digit dollars/month), consistent with read-privacy's growth math. The real economic finding is not affordability — it is that **the cost gradient points at the insecure removal mode**, and the UX must counter it.

---

## 7. Canon consistency (against fs-pass-synthesis C1–C14 and the pass canon)

| Canon point | OS-tier requirement | Verdict |
|---|---|---|
| **Forward-only law surfaced at grant time** (os-pass-handoff; five-want W5) | Must appear at *grant* AND (my addition) at *removal* time | The design carries it at grant; §3.1 shows it must ALSO be surfaced at removal. **Consistent, incomplete.** |
| **keyWrap TAG-only, random occurrence keys** (C6) | Private tier uses random occurrence keys by default; `H(recipientEncKeyId)` demoted to public convenience | **Consistent.** Any OS-tier use of the addressable occurrence form for a private file re-opens the O(1) recipient oracle (metadata Playbook 8.4) — flag if the lane does it. |
| **claimedAt = 0 in the private tier** (A2/F13) | Private-tier writes claimedAt=0 | **Consistent but near-theater — do NOT sell it as timing privacy.** metadata-adversary Playbook 2: `order`/TID already leaks author wall-clock microseconds, mandatory+signed. If the OS-tier lane presents claimedAt=0 as a timing-privacy feature, that **contradicts the metadata lane** and must be corrected. The only real timing lever is client-side TID coarsening at a supersession-priority cost. |
| **Crypto-shred honesty / permanent≠public** (C: delete master table; privacy.md §3.4) | Private-by-default so files are shreddable | **CONTRADICTION if paired with total-loss recovery** — see §5 FATAL. The tier must split recoverable vs shreddable. |
| **B3 privacy-tier = availability infrastructure** (C7) | Blinding makes fine-grained collaboration buildable; private containers are stable-membership | **Consistent — and load-bearing.** But note §3.3: concurrent multi-device re-key in a private collab container is a correctness hazard; "stable membership" must include "serialized FEK rotation," or the availability-infra claim has a lost-access footgun. |
| **admittedAt is existence-since only, fenced from folds** (C1/C4) | Private-tier timing UX must not treat admittedAt as freshness or hide it | **Consistent** — but admittedAt is an *unfuzzable coarse timing floor* (metadata Playbook 2); the tier must not imply private-tier writes hide *when*. |
| **No write-time gates / master confluence invariant** | No read-ACL, no membership admission gate | **Consistent** — the tier is encryption+caps, never a permission (privacy.md §1). Any OS-tier "only members can write here" must be curation (read-side), not a write gate. |
| **atime gone (read leaves no trace)** | Read-only recipients invisible on-chain | **Consistent and the tier's strongest honest win** — a recipient who never writes back leaves no on-chain trace (metadata Playbook 8). The OS tier should *market this* (it is undersold) while NOT claiming it hides the off-chain RPC read (read-privacy §2 — the RPC provider sees everything; that is the dominant read leak). |

**Canon net:** the OS tier is consistent with C1–C14 **except** the crypto-shred-vs-recovery contradiction (§5, must split the tier) and the risk of over-selling `claimedAt=0` (§7) and `atime`-gone (must not extend to off-chain reads). No canon is *breached* by the design's structure; two are *at risk from the tier's marketing*.

---

## Freeze-sensitive reservations

The three sibling lanes (metadata-adversary §7, read-privacy §8, frontier-zk §4) independently converge on **"almost nothing new to Etch."** I concur, and add the OS-tier-specific checks. Classification: ROW (mint a frozen row) / CONVENTION (SDK/registry ruling) / REJECT (do not reserve; show sufficiency).

- **[CONVENTION — CONFIRM, linchpin] KEM/KEX algoTag space must be OPEN-ENDED.** The private tier's `keyWrap` blobs, per-link persona keys, and future stealth-recipient meta-addresses all ride the `encryptionKey` KEM registry (C3). If that algoTag field is a closed enum frozen to today's KEMs, the private-link and stealth-recipient upgrades cannot be added post-freeze. **Confirm the KEM algoTag field is an open numeric space with reserved-for-future values** (metadata-adversary C1). This is the one now-or-never bit the OS tier depends on. Sufficiency: with an open KEM space, per-link keys and stealth recipients are Durable registry additions — addable post-freeze ✔.
- **[ROW — CONFIRM SUFFICIENCY, with a launch-timing caveat] Salted-TAGDEF family + resolver-gate reservation (D3).** The OS tier's private *folders* (W2) and private *persona-links* (W3) **require** the salted resolver to be in the frozen resolver-gate set. D3 reserves it. **Sufficiency test:** shipping private folders later requires (a) `DOMAIN_ANCHOR_SALTED` derivation ✔ pinned; (b) blinded-name-in-body rule ✔ D4; (c) salted-family NFC variant ✔ D3; (d) **the resolver admissible to the registry resolver-gate set** ✔ D3 (attack-privacy S7 caught this — without it the family ships dead); (e) HKDF-salt legality for device-loss re-derivation ✔ D3. **All reserved.** **The caveat that is NOT a reservation gap but IS an OS-tier expectation gap:** *activation is post-freeze* (privacy.md §3.2). So the reservation is *sufficient*, but the capability is **not available at v2 launch** — the OS-tier lane must not present salted private folders/links as day-one (§1 W2/W3). Reserving is right; promising launch availability is the error.
- **[REJECT — show sufficiency] No new row for recovery/custodian relationships.** Total-loss recovery (Shamir shares to successor custodians, escrow relationships) is **entirely off-chain key material** — no on-chain record is needed or wanted. Sufficiency: the recovery bundle is an encrypted vault blob + a pre-signed revoke-all ladder (ordinary REVOKE envelopes over precomputed claimIds — pre-revocation is legal, C-envelope). **Nothing to Etch.** A "recovery share held by X" record, if ever wanted for legibility, is expressible as an ordinary encrypted DATA + claim under a convention key — post-freeze-addable via the five kinds ✔. Do **not** reserve a recovery row; it would be junk on the frozen surface.
- **[REJECT — show sufficiency] No new row for the private tier's crypto-shred marker.** `shredded` is a convention (unverifiable courtesy claim), correctly ruled F7 (attack-privacy). REJECT confirmed.
- **[REJECT — over-reservation guard] Do NOT reserve a stealth-recipient derivation domain or a ZK commitment/nullifier row for the OS tier.** The metadata (§7 R1/R2) and frontier lanes prove both are post-freeze-addable (client-side EC math; existing kinds + read-side verification; master no-write-time-gate invariant already frozen). If the OS-tier lane asks for either, that is **over-reservation — flag it.** The private tier needs neither to ship its confidential-files + caps + re-key story.
- **[CONVENTION — CONFIRM] keyWrap random occurrence keys are the private-tier default; `claimedAt=0` rider; separate-envelope-per-tier; distinct-encryptionKey-per-persona (MUST); single-clientId for unlinkable personas.** All are §H conventions (fs-pass-freeze-reservations); the OS tier consumes them. The two that must be **promoted from optional to normative** for the persona story to hold are **distinct-encryptionKey-per-persona** (a shared enc key cross-links personas — metadata V2/attack-privacy V3) and **relayed-flush-default for unlinkable personas** (§4.2). No frozen surface; launch-blocking for the persona tier.

**Net freeze verdict for the OS tier:** the frozen surface is **already sufficient** for the private tier; the only genuinely now-or-never bit is the **open-ended KEM algoTag space** (confirm), and the only reservation the tier *leans* on that could be under-appreciated is the **salted-family resolver-gate** (already reserved, D3 — but its capabilities are post-freeze-activation, not launch). Guard against **over-reservation** (stealth domain / ZK rows) if the lane asks.

---

## Decisions for James

1. **Split the private tier: `private-recoverable` vs `private-shreddable` (recover ⊕ shred is a contradiction for one key hierarchy).** You cannot promise "recover everything after losing all your devices" AND "crypto-shred = truly gone" for the same key. Pick two tiers and let the user choose per file/subtree. This is both a technical ruling and an ecosystem-honesty ruling (the century-storage audit already flagged it). *Recommendation: ship the split; default new personal files to `private-recoverable` (users lose devices far more often than they need erasure), offer `private-shreddable` explicitly for erasure-sensitive content.*

2. **Recovery default = trusted-third-party escrow (passkey PRF → Apple/Google). Ratify or override.** The honest sovereign alternative (memorized passphrase / steel seed, no escrow) trades recoverability-convenience for loss-risk. "Cypherpunk, verify-don't-trust" and "recovery is Apple-escrowed by default" are in visible tension. *Recommendation: keep escrow as the default for adoption, but name it at the tier level ("your recovery is vendor-escrowed unless you choose device-bound/sovereign"), never bury it.*

3. **Unlinkable-persona default must include relayed/sponsored flush + no linked-wallet funding — or drop the "unlinkable" claim.** Private link alone does not survive funding provenance (metadata Playbook 7); the corpus says "either alone leaks." Make relayed flush the *default* (not just a warning) for personas marked unlinkable, or the feature is unlinkable in name only. *Recommendation: default unlinkable personas to sponsored/relayed flush and refuse/loudly-warn on top-up from a linked wallet.*

4. **Private folders / private persona-links are post-freeze-activation, not launch.** They ride the salted-TAGDEF resolver whose activation is post-freeze. Decide and communicate the tiering: confidential *files* + wrapped caps at launch; salted private *folders*/*links* when the salted resolver activates. Do not let the OS-tier UX promise day-one private directories. *(Or: fund a launch-viable private-link encoding that avoids the salted resolver — worth a design spike, §1 W3.)*

5. **Re-key default: lazy (cheap, leaky-for-cold-files) vs eager (costly, clean) — and the economics push toward lazy.** Make it an explicit per-removal choice with the security consequence priced, because the gas gradient silently favors the insecure mode (§6).

---

## Confidence

**VERIFIED (read the primary design docs this session / reproduced the reasoning):**
- The reserved surface I audit against: `contentEncryption` PIN card-1 (E6), `keyWrap` TAG-only + random occurrence keys (C6/E5), `encryptionKey` separate KEM registry (C3), salted-TAGDEF family + resolver-gate reservation + post-freeze activation (D3/D4; privacy.md §3.2), one-signature-per-envelope + cross-persona co-batching impossible (wallet-and-actions), batch atomicity scoped / submitSubset partial admission (os-pass-handoff G4), fragment-never-sent-to-server (read-lens-spec §6.5), persona custody rung-1 + private-link + funding-linkage warning (wallet-and-actions), claimedAt=0 rider (A2/F13), forward-only law + lazy re-key permanence (fs-pass-synthesis, attack-privacy S3), private-century-vs-shreddable divergence (Reviews/2026-07-10 century-storage + coherence audits). All read directly.
- The concurrent-re-key lost-FEK analysis (§3.3), the wrong-persona promptless-write gap (§4.1), the recover⊕shred contradiction (§5/§7), the economics-push-toward-lazy coupling (§6), and the cap-URL sink table (§2) are **my reasoning reproduced from the frozen surface + custody docs** — internally verified, but they are *arguments*; a critic should re-run §3.3's FEK-collision case and §2's per-sink claims.

**PLAUSIBLE (recalled / product-dependent, not re-verified this session):**
- Cloud-clipboard-history sync defaults, Spotlight/Windows-Search URL indexing, chat-app message-store-vs-unfurl-bot fragment handling (§2) — the *direction* is solid (fragments don't reach unfurl crawlers; they do reach synced clipboards/history/message stores), the per-product specifics are recalled.
- Gas dollar figures (§6) inherit read-privacy.md's ±5× L2 fee band — the *structure* (O(files×members), remover pays, gradient favors lazy) is exact; the dollar amounts are order-of-magnitude.

**RE-VERIFIED SECOND SESSION (2026-07-11, later run):** every load-bearing citation listed under VERIFIED above was independently re-checked against the primary docs in a second session (see §0 re-verification note); all held verbatim. The reconstructed-walkthrough findings and the freeze-reservation adjudications are therefore double-checked; only the per-product cap-URL sink specifics (§2) remain PLAUSIBLE.

**COULD-NOT-VERIFY (the load-bearing gap):**
- **The target file `os-private-tier.md` never landed in my session, and was still absent at the second-session re-check** (see §0). I could not run the literal numbered-walkthrough audit against it; §1 reconstructs the canonical walkthroughs from the consolidating sources instead. My structural findings (§2–§7) do not depend on the missing file's phrasing, but **its specific row citations, numbered steps, and any mitigations it already contains MUST be re-checked against this red team when it lands** — some findings here may already be pre-empted by the lane, and the lane may contain walkthroughs I did not reconstruct.
- Whether the OS-tier lane actually over-reserves (stealth domain / ZK rows) or mis-sells claimedAt=0 / recover⊕shred — I flag these as *risks to check*, not confirmed defects in a file I read.
