# Wallet, personas, signing ceremony, and the outbox
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[identity]], [[codex-envelope]], [[codex-kinds]], [[read-lens-spec]], [[ops-doctrine]], [[large-file-uploads]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client

> Elaborates thesis rulings **F6** (keys, personas, ceremony) and **F7** (draft-first write lifecycle). Evidence: Reviews/2026-07-07-clientv2-corpus/research/wallet-standards.md and Reviews/2026-07-07-clientv2-corpus/research/secure-ui.md. Where this doc and [[web-os-thesis]] disagree, the thesis wins until amended.

## Problem

Every EFS write is one secp256k1 signature over a Merkle root — total authority over the signer's namespace, no session keys, no on-chain attenuation, forever-portable once signed. The client must build a usable write UX on top of that without lying about any of it: attenuation without protocol session keys, promptless flow without ambient authority, batching without hiding, sponsorship without authorship confusion, and custody of signed artifacts that are live grenades, not drafts. This doc rules the persona architecture, the key custody ladder, the System Chrome signing ceremony, and the outbox/flush surfaces.

## Protocol ground truth (binding, not negotiable here)

| Fact | Source | Client consequence |
|---|---|---|
| author = recovered secp256k1 signer, in the signed struct; kernel checks `recovered == author` | [[codex-envelope]] | any signature by a key is total authority for that author word; attenuation must be a *different key* |
| no session keys; **no ERC-1271, ever**; P-256 (0x02) / WebAuthn (0x03) reserved with frozen layouts | [[identity]], [[codex-envelope]] | smart-account-only users cannot author at year-0 (accepted in [[identity]]); passkey signing is future, not now |
| `seq` = TID minted at sign time; future bound +600s, past unbounded; LWW comparator `(seq, recordDigest)` | [[codex-envelope]] | a leaked old bundle can always land, but cannot beat newer claims in occupied slots |
| REVOKE effective iff `revoker == claim.author`; pre-revocation legal; revokes self-verifying, anyone may submit | [[codex-envelope]], [[ops-doctrine]] C1 | the primary **cannot** revoke a persona's claims; kill switches must be pre-signed by the persona itself |
| `expiresAt` is a claim-body word; storage clock-free; expiry degrades reads to STALE, never blocks admission; appendOnly entries require `expiresAt == 0` | [[codex-envelope]] am.4, [[codex-kinds]] am.1 | "bundle expiry" is currency decay, not an admission fence — say so |
| no signed byte ever names a submission channel (relayer mortality invariant) | [[ops-doctrine]] | submitter ≠ author is structural; sponsorship is economics, never identity |

**Ruled conflict [reasoned]:** the wallet-standards digest (§D2/§E1) recommends ERC-1271/6492 signer polymorphism because "EFS identity is a smart account (per project memory)." That memory is v1-era (the B′ account system). [[identity]] overrules it: bare-EOA, no 1271, ever. This doc follows [[identity]]; the year-0 exclusion of multisig/smart-wallet-only users is acknowledged, not re-litigated.

## The persona architecture

One user = **one primary author** (the identity anchor, per the account doctrine) + N **personas**: independent secp256k1 burner authors created, held, and policied by the Kernel. Personas are how EFS gets promptless app writes and attenuation *without* protocol session keys: the attenuation lives in *which key* signs, and the policy lives in the Kernel that holds it. Multi-address exists **only as lens views** — the persona set is stitched back into "one user" at the read layer, never at the identity layer.

- **Default granularity: persona-per-app** [reasoned]. A workspace persona (one persona shared by several apps in a project space) is an explicit user choice in the persona picker, not a default — per-app is the right failure isolation (one compromised or spammy app burns one author word) and the right privacy default (apps cannot correlate each other's writes by author).
- **Personas sign promptlessly** inside Kernel-enforced policy. No System Chrome prompt per write; the journal accumulates, the outbox shows everything, the ceremony happens at flush checkpoints for the aggregate.
- **The primary signs only at System Chrome checkpoints** (the eight below). The primary key never signs inside an app flow, never signs promptlessly, and is never held by the Kernel if a connected wallet or hardware route exists.

### Persona policy schema

```ts
type PersonaPolicy = {
  persona: Address;                 // the burner author word
  scope: { appId: ManifestHash } | { workspaceId: string };
  allowedKinds: KindTag[];          // e.g. [TAG, PIN, DATA]; REVOKE always allowed for own claims
  allowedSubtrees: TagId[];         // container/path roots the persona may write under
  budgets: {
    recordsPerDay: number;          // default 2_000
    bytesPerDay: number;            // default 32 MiB (VAL tails + chunk manifests)
    newTagdefsPerDay: number;       // default 20 — namespace pollution brake
  };
  forbidden: ["deny-facts", "lens-edits", "reserved-key-identity-rows", "value-transfer"];
  expiresAt: Timestamp;             // policy expiry, default 90d, renewable at a checkpoint
  flushClasses: EndpointClass[];    // which privacy classes may carry its envelopes
};
```

Policy is capability-table state: diffable, snapshotted per generation, shown in install review. Exceeding a budget doesn't error mid-app — the write lands in the journal as `draft` flagged `over-budget`, and flushing it requires the checkpoint ceremony. **Deny by downgrade, not by data loss.**

### Linking convention: persona ↔ primary, revocable, bidirectional

Client-layer key-TAGDEFs (permissionless extension per [[codex-kinds]]), deliberately **not** the reserved `successor` row (that is key succession; this is authorship presentation):

- Primary publishes `efs.os/persona` — a **TAG** (cardinality-N) under the primary's container, target = persona address word. Revocable: revoking it is *un-endorsement*.
- Persona publishes `efs.os/primary` — a **PIN** (cardinality-1) under the persona's container, target = primary. Revocable by the persona.
- **Both directions LIVE or no link.** A one-sided claim is rendered as an unverified assertion (anyone can TAG "this persona is mine" — the pair requirement de-forges it, same shape as the successor-pair doctrine in [[identity]]).
- Links are ordinary claims: they are **graded through the viewer's lens** before stitching. A link from an author outside the lens stitches nothing.

### How lenses stitch personas

The user's own default lens lists `[primary, persona₁ … personaₙ]` in that order. For readers: a conforming client that trusts the primary at lens position *i* MAY expand it to "primary + all bidirectionally-LIVE linked personas" as a **derived lens view**, rendered as one identity with a disclosure affordance ("3 linked authors"). Expansion is a read-layer convenience, never an admission or trust transfer: each persona's claims still grade independently; a REVOKED link drops the persona from the view on next resolution. GATE reads never expand — machine gates consume the exact author set they were configured with ([[read-lens-spec]] §3.3).

### What deserves the primary — doctrine table [reasoned]

| Write class | Author | Why |
|---|---|---|
| identity rows: `home`, checkpoint claims, successor pair, persona links | **primary only** | identity-adjacent; forging these via a persona would launder authority upward |
| lens publications, curation lists, deny/advisory facts | **primary only** | reputation-bearing; readers key trust on the primary |
| long-lived public namespace roots (the user's "site", package releases) | **primary** (default) | portable reputation; survives app churn and persona retirement |
| value transfers, capability grants, app-install attestations | **primary**, at checkpoints, T10 routing above threshold | consequence class |
| app content: documents, posts, saves, annotations, tags | **persona** | high-frequency, app-scoped, promptless |
| collaboration presence, ephemeral state, agent-driven writes | **persona** (agent sessions always) | blast-radius containment |
| bulk imports (photo archives, migrations) | **persona by default**; primary offered when the user marks the tree "reputation-bearing" | volume vs permanence tradeoff, made explicit in the composer |

### Persona compromise, honestly

A persona is a software key; assume it can be stolen. Consequences and mitigations, stated in the Permission Center:

1. **Revoking the link is un-endorsement, not key death.** The thief keeps a valid author key; readers following the pair convention stop stitching; deny facts (primary-authored) advise against the persona.
2. **Delegated revocation does not exist** (`revoker == claim.author`). Therefore: at persona creation the Kernel **pre-signs a revoke-all ladder** — REVOKE envelopes over precomputed claimIds ([[ops-doctrine]] renewal-ladder machinery, pre-revocation legal) — stored encrypted beside the persona. Kill switch = flush the ladder multi-venue.
3. The primary's own compromise is out of scope here — [[identity]]'s THEFT row governs; the client's job is detection surfaces (unexpected-claims monitor in the Sync Center).

## The key custody ladder

| Rung | Key | Holds | At rest | Signs |
|---|---|---|---|---|
| 0 | **connected wallet EOA** (EIP-6963, Kernel-brokered; Ring 3 never sees a provider) | user's wallet | wallet's problem | primary authorship; ceremony via `eth_signTypedData_v4` |
| 1 | **Kernel software keys** (personas; primary only in walletless onboarding, labeled) | Kernel worker memory during session | wrapped by a **non-extractable WebCrypto AES-GCM key**; wrap secret from **passkey PRF (default)** or wallet-derived HKDF (fallback) | persona writes, promptless under policy |
| 2 | **hardware / wallet clear-signing route** | device | device | mandatory above the T10 threshold: large value, admin grants, key/bundle export |
| 3 | **P-256 passkey signer** — *future* | platform authenticator | platform | blocked on 0x02 un-reservation ([[identity]]); EIP-7951 precompile is live on L1 since Fusaka 2025-12, so verification cost is no longer the blocker |

Rung-1 mechanics [research-grounded]: never a raw key in `localStorage`/IndexedDB (XSS jackpot — wallet-standards §C4). Vault blobs live encrypted in Tier-B storage and in export/escrow copies; because the PRF output is stable across passkey sync, the vault is **re-openable after total origin eviction** — restore blob, touch passkey, unwrap. First-run states the escrow tradeoff plainly: synced passkey = recoverable but Apple/Google-escrowed; device-bound = sovereign but no cloud recovery.

**Key-wrap coupling rule** (normative, from [[identity]] am.1/G9): the wrap secret MUST be independent of any author key. So the wallet-derived HKDF fallback (deterministic signature over `"EFS-OS key-wrap v1 | <profileSalt>"` → HKDF-SHA256) MUST derive from an account that is **not** the primary author, or — where the wallet exposes only the author account — is allowed only with the labeled consequence: *theft of your wallet key would also decrypt this vault.* Passkey PRF has no such coupling and is the default for that reason.

## Submission rails: AA is economics, never authorship

7702, 4337, paymasters, bundlers, relayers are **how a signed envelope reaches a venue and who pays** — nothing more. The author is fixed by the envelope signature before any rail is chosen; the mortality invariant guarantees no rail leaves a trace in the signed bytes.

- **Self-pay:** a Kernel-held **submitter account** (gas identity ≠ author identity) or the connected wallet sends the tx. Sovereign; links whatever it submits on-chain via `msg.sender`.
- **Sponsored:** ERC-7677 paymaster flow or an EFS relayer (`/.well-known/relayer` policy). Endpoint class `relayed` or `trusted-paid`.
- **7702/4337:** useful to batch envelope-publish + chunk txs into one atomic submission. Never used to *sign* records; a 7715 session key signing an envelope would recover to the session key's address and author as a stranger — structurally rejected.

Honest labels, rendered on every sponsored flush and in the switchboard: **"This relayer sees these records before anyone else, can decline or delay them, and is not the author. Verification is unaffected."** Sponsorship changes privacy class and liveness, never authenticity — two independent indicators, never conflated (F5).

## The signing ceremony (System Chrome)

### Preflight: derived from the records, equal to the signed bytes

The ceremony consumes **only canonical record bytes from the journal** — never app-supplied prose. System Chrome's kind decoders (one Kernel-owned string catalog) render each record's intent from its bytes; System Chrome independently recomputes every leaf digest and the `recordsRoot` from those same bytes and displays the envelope struct fields (`author` via `<efs-identifier>`, TID time, `count`, root). Equality of preview and signature is by construction *and* by recompute: what you read is a total function of what you sign. This is a strictly stronger position than calldata-guessing wallets [research-grounded — secure-ui T4; Radiant/Bybit are the $2B+ counterexample].

### Digest cross-check and standards alignment

- **ERC-8213-shape cross-check:** the wallet displays the EIP-712 digest; System Chrome displays the same digest chunked by `<efs-identifier>`; ceremony copy: *"Confirm these match. If they differ, someone is between you and your wallet — cancel."* On hardware, the compare happens on-device.
- **ERC-7920:** the envelope is 7920's *shape*, not byte-compatible (positional tree, index-committed leaves, odd-node promotion; N=1 = wrapped leaf digest, deliberately not 7920's byte-identical-single). Divergence is documented as a named profile; we adopt 7920's one normative UX MUST — the wallet always says "you are signing N records at once."
- **ERC-7730:** publish and maintain a clear-signing descriptor for the `Envelope` struct (author, count, root, TID-time) to the EF-stewarded registry (clearsigning.org), so hardware and third-party wallets render header fields legibly. Cheap, high leverage. The descriptor covers the header only; leaf legibility stays the Shell's job — a wallet cannot expand a Merkle root.

### Batch legibility: aggregate, never obscure

The summary aggregates ("312 files into /photos/2026, 4 folders, 1 lens update"), expands on demand, and classifies **every record** into a record severity class (S0–S3). Records above S1 are itemized individually and can never be folded into an aggregate count — one dangerous record cannot hide among 400 harmless ones (the 7702 sweeper wave is the memento mori).

| Class | Contents | Ceremony treatment |
|---|---|---|
| **S0 routine** | persona-scoped revocable claims inside already-granted subtrees | aggregated counts |
| **S1 structural** | new TAGDEFs, first write to a new subtree, DATA/LIST creation, chunk manifests | named lines in summary |
| **S2 sensitive** | REVOKEs, appendOnly entries (permanent), first placement of previously-local data on a public venue, safety-class expiry kinds | individually itemized, never aggregated; 1s activation delay |
| **S3 identity/value** | persona link/unlink, `home`/checkpoint/successor rows, lens-root/deny-set changes, value transfer, capability grants, exports | own checkpoint screen; 3s delay; T10 hardware/passkey routing above threshold |

Each itemized record also carries its **permanence label** (revocable / permanent / signed-and-portable-once-flushed) — the G4 irreversibility-class vocabulary.

**Surface mapping:** S0–S3 are per-record severity classes; [[shell-and-sessions]] keeps R0–R3 for surface/ceremony classes. A batch ceremony runs at the surface class implied by its worst record: any S3 record ⇒ R3 ceremony; any S2 ⇒ at least R2.

### The eight consequential checkpoints

Full System Chrome ceremony (modal chrome, Kernel-derived identity only, no default-focus accept, activation delays, too-fast clicks ignored) is reserved for exactly these; everything else is pickers or quiet chips (prompt budget discipline — UAC's lesson):

| # | Checkpoint | Minimum surface |
|---|---|---|
| 1 | **Sign/flush** an envelope (any author) | System Chrome + wallet digest cross-check |
| 2 | **Publish** — first placement to a public venue / lens publication | System Chrome |
| 3 | **Spend** — value transfer, gas above float | System Chrome; ≥ T10 threshold → hardware/passkey |
| 4 | **Install/update** with capability broadening | System Chrome (capability diff is the review) |
| 5 | **Grant** — admin/capability expansion, endpoint trust changes; includes the **identity/custody subclass**: persona create/link/unlink, primary custody changes, `home`/checkpoint claims | System Chrome; admin grants → T10; persona unlink / custody changes → T10 |
| 6 | **Export** — signed bundle or key material | System Chrome + T10 always |
| 7 | **Destroy** — local data deletion (the only real delete) | System Chrome |
| 8 | **Break-glass** — lethal-trifecta assembly, high-risk device capabilities, Shell activation | System Chrome; 3s delay, full T5 gating |

None of the eight is ever satisfiable by an agent alone (F9). Interaction gating per Chromium's playbook: ~500ms delay on S0/S1 confirms, 1s on S2, 3s on S3/T10.

## Outbox, batch composer, flush center

Three surfaces over one journal, mapped onto the pending-state ladder (`draft → planned → ready_to_sign → signed → queued → flushing → submitted → partially_admitted → complete_on_chain → chain_finalized → replicated`):

- **Outbox** (`draft…ready_to_sign`): everything write-like that hasn't been signed, grouped by author (persona/primary), then by app. Ordinary "save" lands here encrypted; nothing in the outbox is a commitment. Per-group affordance: **Sign now** vs **Keep collecting** — the default is keep-collecting with a nudge when a group crosses a size/age threshold (default: 24h or 200 records) [reasoned].
- **Batch composer** (`planned → ready_to_sign`): assembles envelopes per author (an envelope has one author — persona and primary records can never share one), previews record severity classes, shows per-venue cost estimates and the sponsor alternative side-by-side, and mints the ceremony request.
- **Flush center** (`signed → replicated`): queued signed bundles with custody trail, per-venue submission jobs, retries (at-least-once, idempotent on deterministic claimIds — re-submission is a no-op, so retry is always safe), **per-record per-venue admission tracking** (`partially_admitted` names which records landed where; refusal events render as inert-refused, not errors), resumable chunk uploads, and the sponsor/self-pay switchboard per flush job.

Chunk uploads ride [[large-file-uploads]]: one signed manifest, then `submitChunk` streams that anyone may finish — the flush engine reads the on-chain presence bitmap (`missingChunks`) as the resume state, offset-probe-then-append for off-chain mirrors. A killed upload is a `BYTES-PARTIAL` fact in the Flush center, not a mystery. Background Sync is Chromium-only, so flush-on-foreground + the visible Sync Center is the portable pattern; `navigator.onLine` is never trusted (F7).

## Signed-bundle custody

A signed bundle is a live grenade: anyone holding it can publish it at any venue, forever. Custody rules:

1. **Encrypted at rest, always.** Signed bundles live in the vault tier with the persona keys; they never touch unencrypted storage.
2. **Default `expiresAt` on interactive bundles — with the honest caveat.** Claims minted in an interactive session default to `expiresAt = now + 30d` **for mutable-pointer kinds only**; permanent-class records (registry versions, appendOnly entries — which *require* `expiresAt == 0`) are exempt and the ceremony labels them "no expiry — permanent." **Expiry degrades a late-landed claim to STALE; it does not prevent admission** ([[codex-envelope]] master invariant makes an envelope-level submit-by fence impossible — arrival-time admission is banned divergence). The real mitigations are the next two lines. [research-grounded protocol reading; the "expiry protects you" framing is a truth-trap and MUST NOT appear in UI copy]
3. **Abort artifact, default ON.** At sign time the Kernel co-mints a pre-signed REVOKE envelope over all revocable claimIds in the bundle (pre-revocation is legal and admits before its targets). If custody is lost: flush the abort artifact multi-venue; the revokes win regardless of arrival order. Copy: *"If this bundle ever leaves your control, one click unpublishes everything in it that can be unpublished."* Non-revocable records (objects, appendOnly entries) are enumerated at export as the un-abortable residue.
4. **Export ceremony** (checkpoint #6, T10 always). The `.efs-bundle` export screen carries the grenade warning verbatim: *"Anyone holding this file can publish these records — at any venue, at any time, forever. Expiry only ages them; it does not stop them. Export only if you mean to hand over that power."* Export requires typing the bundle's short digest.
5. **Custody audit.** The journal logs bundle custody events (`created / signed / exported / flushed(venue) / abort-armed / aborted`); the Flush center renders the trail per bundle. An exported-but-unflushed bundle is a standing warning chip, not a silent fact.

## Multi-venue submission and the REVOKE broadcast default

Records are venue-targeted per placement; one envelope may flush to several venues with independent admission tracking (grades stay venue-qualified — `complete_on_chain@venue`, never a global "done"). Two normative defaults:

- **REVOKEs broadcast multi-venue by default** ([[ops-doctrine]] C1): revokes are self-verifying and anyone may submit, so the revoke path submits home AND hands the envelope to couriers/every carrying venue in the same act. UI: "Revoked at home · broadcast to 4 venues · 1 pending." Turning this off is a persistent, disclosed setting, never per-action.
- Ordinary claims default to home-venue-only; additional venues are explicit placements chosen in the composer.

## Gas and funding UX

- **Author ≠ payer, shown as such.** Most personas never hold funds: their envelopes flush via the submitter account, the connected wallet, or a sponsor. A persona gas float exists only for the fully-sovereign self-submit route.
- **Linkability warning [research-grounded — network-privacy lane logic]:** funding a persona from the primary wallet, or submitting many personas' envelopes from one submitter account, **links them on-chain**. The funding ceremony says so: *"Topping up this persona from your main wallet publicly connects them. Use a relayed route to keep them separate."* Persona-pseudonymity is honest only with relayed/sponsored flush classes.
- **Top-ups are spend checkpoints** (#3) with a budgeted auto-renew option: user sets a monthly ceiling once at a checkpoint; refills under the ceiling are quiet-chip events, not modals.
- **Faucet-drip:** on devnet, the gasless faucet-drip route is the zero-cost onboarding rail (hackathon must-have; devnet drain is accepted posture — no auth hardening proposals). On public nets the same UX slot is filled by the sponsored class, honestly labeled.
- **Estimates in preflight:** the ceremony shows per-venue fee estimates (envelope tx + N chunk txs), a variance label ("estimate, not a quote"), and the sponsor alternative side-by-side, before `ready_to_sign` is reachable.

### Agent lens

Agent sessions are the fourth principal (F9) and change nothing structural here — that is the point. Agents author **only through personas** (never the primary, never a raw key: the Kernel signs, the agent enqueues); their writes ride the same journal → outbox → composer path with the persona policy intersected with the session's plan budget (records/bytes/kinds/subtrees, whichever is tighter). Dry-runs exploit deterministic claimIds: the receipt an agent proposes names the exact claimIds that will exist, so preview-vs-outcome equality is checkable. The eight checkpoints are never agent-satisfiable; an agent's flush request parks the bundle at `ready_to_sign` in the human's outbox with the plan and receipts attached. Agent-triggered abort-artifact flushes (kill switches) are the one deliberate exception allowed to *execute* promptlessly — revocation is fail-safe and monotone — but arming them still required a human checkpoint.

### Honesty obligations

- `signed ≠ submitted ≠ admitted ≠ final`: the ladder renders per venue; `signed` visually reads as **committed & portable**, never "private/pending."
- STALE vs REVOKED wording is the shared string catalog's, venue-qualified ([[read-lens-spec]] RR4); a lapsed persona-policy write is not "revoked."
- Expiry copy never claims prevention (custody §2); export copy always states permanence.
- Sponsored and self-paid records render identically at read time — sponsorship is a privacy/liveness label on the *flush job*, never an authenticity signal on the record.
- A stitched persona view always discloses "N linked authors"; stitching failures degrade to unstitched display, never to hiding claims.
- `UNKNOWN because no transport` in flush/read status is rendered as denied-by-policy, never as absence.
- Persona compromise surfaces (unexpected-claims monitor) warn on the bad state; there is no green "your keys are safe" badge.

## Open questions

- [ ] Persona-per-app default vs cheaper persona-per-workspace for storage/gas — needs usage data from the prototype; shares the thesis F6 open item. [open]
- [ ] Should the persona-link pair (`efs.os/persona` / `efs.os/primary`) be promoted from client convention to reserved-key rows or a [[read-lens-spec]] normative section, so stitching cannot fork per client? (Filed as an efsv2 pressure item.) [open]
- [ ] Abort-artifact coverage for VAL-heavy bundles: pre-signing REVOKEs doubles envelope count at sign time — acceptable ceremony cost, or make abort artifacts opt-in above N records? [open]
- [ ] T10 value threshold constant and its denomination (fiat-indexed vs ETH-fixed). [open]
- [ ] Default interactive-bundle expiry (30d proposed) vs the ops-doctrine D2 mutability split — confirm the exempt-kind list with [[ops-doctrine]]'s owner. [open]
- [ ] Walletless onboarding: is a Kernel-held *primary* (rung 1) acceptable at launch with the labeled custody downgrade, or do we require a connected wallet / passkey-PRF vault before any primary authorship? [open]

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Depends-on chain verified against [[web-os-thesis]] and the efsv2 Codex set (no contradictions)
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
