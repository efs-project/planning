# S10 — Concrete defect verification (2026-08-13 defects vs. the v1 code and the vault)

**Lane:** cross-cutting S10-concrete-defect-verification
**Date of check:** 2026-09-03
**Verdict:** **strained**
**Read-only:** no file under the planning vault was modified.

## Snapshot of what was checked against

| Repo / branch | HEAD | Date | Notes |
|---|---|---|---|
| `contracts` (sibling clone) `main` | `c6b4075308dd37bb36665eabecb66ec8b47fc7dd` | 2026-06-25 | clean tree, `main...origin/main` |
| `client` (sibling clone) `main` | `85796b337669f2f247d28a66060b2468078895fb` | 2026-07-23 | "docs: mark the v1 client as legacy" |
| `sdk` (sibling clone) `chore/scaffold` | `37badc4b84a07e48f72db494c8cef90583a9d572` | 2026-08-09 | `origin/main` tree = `LICENSE` only |
| the planning vault `main` | `234c3e69c9cb6ca2fbfafea90a195e853e014464` | 2026-08-30 | `Milestones.md` was edited on disk **during** this pass (see F5) |

Not cloned here and therefore not checkable: `content/`, `datasets/`, `devnet/`, `hackathon/`
(the sibling repos named by `Onboarding/repo-map.md:7-16`). Live chain state is unreachable:

```
$ curl -sS -m 25 -X POST -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    https://ethereum-sepolia-rpc.publicnode.com
curl: (56) CONNECT tunnel failed, response 403
```

Every "live Sepolia" claim below is therefore **UNVERIFIABLE**; every "code state" claim is
VERIFIED or REFUTED against the hashes above.

---

## Q1 — `verifyContentHash` has zero callers: **VERIFIED, still true**

Full-repo, case-insensitive, all file types, `.git` excluded, tests included:

```
$ grep -rni "verifycontenthash" {contracts,client,sdk}
contracts/packages/nextjs/utils/efs/transports.ts:111:export function verifyContentHash(...)
```

One hit — the definition. Zero in `client`, zero in `sdk@chore/scaffold`. A test file for the
exact module exists (`packages/nextjs/utils/efs/transports.test.ts`) and contains **no**
occurrence of `ContentHash` or `keccak` at all. No wildcard import reaches the module
(the four `import * as` sites in `packages/nextjs` are `viem/chains` and `react`).

**Refinement the original finding did not state:** the *compute* half is fully wired.
`computeContentHash` (`transports.ts:106-108`, `return keccak256(data)`) has four live call
sites — `components/explorer/CreateItemModal.tsx:318,:360` and `lib/efs/uploadOnchainFile.ts:677`.
So the v1 write path hashes bytes on every upload and the read path never checks them. That is
exactly the shape `Designs/arcade/mvp-architecture.md:94` records ("**absent** — zero callers of
any verifier") and `Reviews/2026-08-07-arcade-corpus/verification-execution-mirrors-enumeration.md:11-18`
established. Independently reproduced.

## Q2 — 67 durable Sepolia files with non-canonical keccak: **live count UNVERIFIABLE; code state VERIFIED and worse than reported**

**Spec side (VERIFIED, Accepted).** `contracts/specs/10-file-metadata-encoding.md:1-9`
"**Status: Accepted** (James ratified 2026-06-20 — see ADR-0064)"; §2 "`contentHash` values are
encoded as a multibase-prefixed multihash"; §2.1 sha2-256 (`0x12`) is "**Canonical/default**",
keccak-256 (`0x1b`) "NOT the default"; §2.2 "**Writers MUST emit `base16` (prefix `f`)**".
`docs/adr/0064-content-hash-self-describing-encoding.md:1-3` same, Accepted 2026-06-20.

**Seeder side — the brief's question, answered: neither.** `packages/hardhat/scripts/seed-impl.ts:165-168`:

> `// AGENT-NOTE: DATA is an empty schema — pure identity (ADR-0049). It carries no inline fields;`
> `// contentHash/size are reserved-key PROPERTYs bound to the DATA UID … Attaching them as`
> `// PROPERTYs in the seed is future PROPERTY/SDK work — the seed currently mints empty DATA only.`

So the in-repo seeder emits **no `contentHash` at all** — not canonical `f1220`, not bare keccak.
`packages/hardhat/scripts/seed.ts` is a 23-line CLI wrapper. `deploy/10_seed_demo_tree.ts` has zero
`contentHash`/`keccak` occurrences. **REFUTED** that the seeder at HEAD emits canonical sha2-256;
**REFUTED** that it emits bare keccak.

**The seeder of record does not exist in any cloned repo.** `Designs/arcade/mvp-architecture.md:152`
names the tool as "the **fixed datasets seeder** (`seed-dataset.ts` lineage)". In `contracts`:
`find -iname '*dataset*'` → nothing; `grep -rn "seed-dataset\|--rebind-hash"` → nothing; no
`datasets/` directory. It lives in the uncloned `datasets/` repo. `Designs/arcade/README.md:41`
("the seeder tooling of record was never merged") is therefore consistent with this checkout.

**The writer that actually mints durable values (VERIFIED, non-conformant).**
`utils/efs/transports.ts:106-108` → `lib/efs/uploadOnchainFile.ts:677` (`const contentHash =
computeContentHash(bytes)`) → `:383` `reservedKeys.push({ key: "contentHash", value: contentHash })`,
a bare `0x…` keccak hex bound as a **non-revocable** PROPERTY (ADR-0052). A repo-wide
`grep -rn "f1220\|multihash\|multibase" packages/` returns **zero hits** in the entire contracts
monorepo. The gap is self-documented at `contracts/docs/FUTURE_WORK.md:137-139`:

> "**Remaining gap (Ephemeral writers): the same-repo debug-UI uploader and the SDK still compute a
> bare `keccak256` hex** … the production client (separate repo `efs-project/client`) is the
> conformant writer that matters at launch."

**That escape hatch is false.** At `client` HEAD the repo has 17 source files and
`grep -rn "sha256\|keccak256\|contentHash\|f1220" src/` returns **nothing** — the "conformant writer
that matters at launch" contains no hashing code whatsoever, and the same commit marks the client legacy.

**The only conformant implementation in existence is stranded.** `sdk@chore/scaffold`
`packages/sdk/src/content/hash.ts:44` `hashContent(bytes) → \`f1220${sha256(bytes,'hex').slice(2)}\``,
wired into `mirror/fetch.ts:126` and `reads/fetch.ts:42`, with tests (`test/mirror.test.ts:396-473`).
`docs/adr/0016-content-hash-multibase-multihash.md` Accepted 2026-08-07. Its `origin/main` tree is
`LICENSE` only, and `Kanban.md:62` records that v1 SDK merge work was **stopped** by the 2026-08-08
greenfield ruling. So the fix exists, works, is tested, and is unreachable.

**Consequence nobody has written down.** `content/hash.ts:115-120` `decodeContentHash` returns
`undefined` for anything not prefixed `f`/`b`, and `:158-170` `verifyContent` maps that to
`'malformed-claim'`. `docs/adr/0016…md:17` makes it deliberate: "**Unregistered codes and bare digests
report `malformed-claim`** … the only legacy Sepolia population is debug-UI `0x`-keccak values". So
under the only conformant EFS reader that exists, **every durable Sepolia `contentHash` is
unverifiable by construction** — not "mismatch", not "tampered", but *malformed*. See F3.

**The 67 count itself: UNVERIFIABLE here.** Its source is
`Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md:61` — "/games **15**,
/whitepapers **40**, /standards **10**, /cypherpunk **2** — **67 files** total … all 67 carry
`0x`-keccak `contentHash` PROPERTYs", verified on-chain 2026-08-07. RPC is blocked; I cannot
re-count. Nothing in the repos contradicts it and the write path that would produce it is confirmed.

## Q3 — pins, devnet, faucet

| Claim (`Designs/arcade/README.md:41-42`) | Result | Evidence |
|---|---|---|
| "IPFS pins sit on a single VPS node" | **UNVERIFIABLE directly; independently corroborated in-repo** | Cited source is `datasets/deploy/docs/DEPLOYMENT.md:211-228` via `Reviews/2026-08-07-arcade-corpus/verification-games-deployment.md:50` — `datasets/` is not cloned. But `contracts/docs/FUTURE_WORK.md:157` item (7) says "today the devnet IPFS is a single unauthenticated node", and `:478` "The public devnet's `POST /api/v0/add` endpoint is currently unauthenticated — any browser can pin arbitrary bytes into the devnet's IPFS daemon." `packages/nextjs/.env.example:105,:115` names the same host (`https://178.104.79.94.nip.io`). `contracts` contains **no** pinning script and **no** Sepolia pin-custody record. |
| "devnet 26001993 currently has no contracts deployed" | **UNVERIFIABLE live; artifacts do not support a naive reading** | `packages/nextjs/contracts/deployedContracts.ts:16474` carries a **full 10-contract record for chain 26001993** — the same set as 31337 and 11155111 (AliasResolver, EFSFileView, EFSRouter, EdgeResolver, Indexer, ListEntryResolver, ListReader, ListResolver, MirrorResolver, SystemAccount). `packages/hardhat/deployments/` contains only `sepolia/` (`.chainId` = 11155111). The vault's own evidence reconciles this — `verification-games-deployment.md:66`: the fork predates the real-Sepolia core deploy and no CREATE3 re-deploy has run since the weekly reset, so `eth_getCode = 0x`. The claim is about the *chain*, and the committed artifacts are stale-by-design on a weekly-reset fork. |
| "The Sepolia faucet … is built and integrated but **not deployed**" | **"built and integrated" VERIFIED; "not deployed" UNVERIFIABLE** | There is **no faucet Solidity contract anywhere**: `find -iname '*faucet*'` in `contracts` returns 7 files, all client-side TSX/TS. The faucet is an **HTTP drip service external to every cloned repo**. Client half is complete: `packages/nextjs/utils/scaffold-eth/faucet.ts` (`FAUCET_URL`, `FAUCET_CHAIN_ID` defaulting to sepolia, `isFaucetEnabled`, `normalizeDripResponse`), plus `FaucetStatus.tsx`, `FaucetAutoDrip.tsx`, `useAutoFaucetDrip.ts`, `GasFaucetButton.tsx`, `Faucet.tsx`. `faucet.ts:16-17`: "Active only when `NEXT_PUBLIC_FAUCET_URL` points at a running faucet service; unset ⇒ disabled." Env-gated-off is consistent with "not deployed" but is not proof of it. |
| `docs/LAUNCH_CHECKLIST.md` as a source | **Unusable as evidence** | It is an **April-2026** checklist ("Devnet (April 19, 2026) — bicycle day", `:4`, `:11`; mainnet April 22, `:128`). **Every** box is unchecked, including `:16` "IPFS node running (kubo or similar) for devnet file hosting" and `:34` "Production EFS Client (Vite/Lit, separate repo) reviewed for devnet readiness" — both of which demonstrably happened. It records no faucet item at all. It is not a tracker of what got done and must not be cited as one. |

## Q4 — Are these moot under the 2026-08-08 disposability ruling? **No. Two live plans depend on them, and one was upgraded to a hard commitment yesterday.**

`Decisions.md:23` (2026-08-08, @james): "no v1 support, compatibility, migration, coexistence, or
legacy-read requirement. **The current owner-authored v1 data is disposable and may be reseeded.**"
`Reviews/2026-08-13-claude-evidence-round/CORRECTIONS.md:31` reinforces the boundary: dated v1
limitations "are product-pressure evidence, not facts about the unbuilt greenfield successor."

That ruling disposes of v1 data **as a data-model baseline**. It says nothing about v1 Sepolia as a
**demo substrate**, and two live commitments still stand on it:

**(a) Devcon 2026-11 — now accepted, with hard requirements locked.**
`Milestones.md:17-18`: "**Status:** talk accepted and participation confirmed 2026-09-02". `:40`
"Use the public EFS Sepolia system as the working example." `:41-42` "**Demonstrate independent
retrieval and verification, including corruption and unavailability.**" `:46-55` "Hard requirements"
is no longer "None locked" — five are, incl. `:52` "Keep November 3-6 available" and `:53-54` "Show
only claims and demonstrations that remain accurate at presentation time, with a preverified offline
fallback for the live demonstration." `Devcon/README.md:33-36` thesis: "using live EFS on Sepolia and
its **independently reproducible proof** as the case study."
All four unmerged branches still carry the pre-acceptance text, so this is hours old.

The demanded demo — independent retrieval + verification + corruption rejection over public Sepolia —
is exactly the path that (i) has zero verifier callers, (ii) reads `malformed-claim` under the only
conformant verifier, (iii) depends on pins whose custody is one machine, and (iv) cannot be reseeded
because the seeder of record is in no repo and its canonical-emit gate never landed.

**(b) ETHOnline 2026 — imminent (today).** `Kanban.md:19`: applications close Sept 6, "use the earlier
internal cutoff" of **September 3** — today. "Recommended entry is the one-game Arcade exact-artifact
+ tampered-primary + verified-fallback trace behind a provisional adapter." `ETHOnline-2026.md:51-56`
spells the trace out: "3. It has at least two locators or carriers for those exact bytes. 4. **A
tampered or unavailable primary is rejected; a matching fallback loads.**" `:94` guardrails forbid a
durable seed, so this one does *not* depend on the 67 files — but it depends entirely on a working
verifier, which does not exist in any repo the vault can point an implementer at.

**(c) A live card would make the contamination worse.** `Kanban.md:29`: "Crypto-whitepaper reference
dataset — seed if/when there's demand … Sepolia is live; **only gate is pinning/Arweave creds + a
seeding run**." That names the wrong gate. `Designs/arcade/mvp-architecture.md:154`: "seeder emits
`f1220`-sha256 + the `cid` PROPERTY (specs/10 §4.2) … **No durable seeding before this lands.**"
`Designs/arcade/owner-decision-inbox.md:37` D4(a) calls the seeder fix "**the gate** before any
further durable seeding". And `/whitepapers` is already **40 of the 67** contaminated files
(`verification-contenthash-writers.md:61`). Executing that card as written mints more permanent,
non-revocable, unverifiable-by-construction values.

**What *is* moot:** D2 (comments), D3 (catalog rights), D5 (name/domain), D6 (faucet stand-up),
E1–E5, L1–L3 — all keyed to the dead 2026-09-11 launch, per the hold at
`owner-decision-inbox.md:12` and `Open-Decisions.md:20,:73`. D4's **remediation** half ((d)
`--rebind-hash` of the 67) is moot under disposability. D4's **writer/seeder** half ((a),(b)) is
**not** moot: "disposable and may be reseeded" is only true if a reseeder exists, and it does not.

## Q5 — Dead links in the current spines

Script: `linkcheck2.py`
— resolves `[[wikilinks]]` (with `|alias`, `#heading`, path and folder-note forms, and YAML
`aliases:` frontmatter) and relative markdown links, skipping fenced code blocks.

| Spine | Broken |
|---|---|
| `Designs/efsv2/README.md` | 0 |
| `Designs/web-client-os/README.md` | 0 |
| `Designs/open-web-app-store/README.md` | 0 |
| `Designs/media-library/README.md` | **1** |
| `Designs/arcade/README.md` | 0 |
| `Designs/README.md` | 2 flagged, **0 real** |
| `Reviews/README.md` | 0 |

**Real break — `Designs/media-library/README.md:179`**:
`[the offline-loop specification](../../../experiments/efs-media-library-offline-loop/docs/superpowers/specs/2026-08-14-offline-personal-library-loop-design.md)`
resolves to `/home/user/experiments/…`, which does not exist. `experiments/` is **not** one of the
eight sibling repos in `Onboarding/repo-map.md:7-16` (planning, contracts, sdk, client, content,
devnet, datasets, hackathon), so this link names a location the vault's own repo map does not define.
Same target repeated at `Designs/media-library/plex-jellyfin-app.md:429`. It is the **only** citation
for "**Foundation Slice 0**" — the first implementable step of the media-library build recommendation.

**Not findings (verified false positives):** `Designs/README.md:25` `[[wiki-link]]` and `:29`
`[[filename]]` are illustrative placeholders in prose *about* the wiki-link convention.
`Designs/README.md:3` `[[design-system]]` **resolves** via `Designs/0001-design-system.md` YAML
`aliases: [design-system]` (my first pass wrongly flagged it; corrected). `Designs/README.md:45`
`[ADR-0041](../../contracts/docs/adr/…)` sits inside a ```` ```markdown ```` fence.

---

## Findings

**F1 — DEFECT (blocking, MVP-relevant). `verifyContentHash` still has zero callers; the write half is fully wired.**
Verified at `contracts@c6b4075`, `client@85796b3`, `sdk@chore/scaffold 37badc4`: one repo-wide hit,
the definition at `packages/nextjs/utils/efs/transports.ts:111`; `transports.test.ts` exercises the
module but never the hash functions. Meanwhile `computeContentHash` (`transports.ts:106`) has four
live callers (`CreateItemModal.tsx:318,:360`; `uploadOnchainFile.ts:677`). *Fix:* not a v1 code fix —
the EFS 2.0 sets must state fail-closed verification as a Core read-path requirement with an owner,
so it cannot again be a defined-but-uncalled function. Owning: **efsv2** (read path), **arcade**
(the trace that needs it).

**F2 — DEFECT (blocking, MVP-relevant). The canonical `contentHash` encoding is Accepted and has zero implementations in the contracts monorepo.**
`specs/10-file-metadata-encoding.md:1-9` Accepted 2026-06-20, §2.2 "Writers MUST emit `base16`
(prefix `f`)"; ADR-0064 same. `grep -rn "f1220\|multihash\|multibase" contracts/packages/` → **zero
hits**. The live durable writer emits bare `0x` keccak (`uploadOnchainFile.ts:677` → `:383`), bound as
a non-revocable PROPERTY (ADR-0052). *Fix:* whichever set inherits "authoritative digest claim" must
carry the encoding into its own conformance vectors and a writer test, not a prose spec. Owning:
**efsv2**.

**F3 — DEFECT (blocking, MVP-relevant). Under the only conformant EFS verifier that exists, every durable Sepolia `contentHash` reads `malformed-claim`.**
`sdk@chore/scaffold packages/sdk/src/content/hash.ts:115-120` rejects any non-`f`/`b` prefix;
`:158-170` maps that to `'malformed-claim'`; `docs/adr/0016…md:17` makes it deliberate ("No
bare-digest tolerance on read"), `:27` names the debug UI as the source. So the 67 files are not
"wrong-but-checkable" — they are *unclassifiable*, which is precisely the "confirmed, then
unreadable" failure shape the evidence round named. This is stronger than the 2026-08-13 wording and
was not stated anywhere in the vault. *Fix:* the Devcon and Arcade traces must not claim
"independently verifiable" over this dataset until a canonical value is bound. Owning: **arcade** +
**owner**.

**F4 — DEFECT (important). The only conformant `contentHash` writer/verifier in existence is stranded on an unmerged branch of a repo whose default branch is a LICENSE file.**
`sdk` `origin/main` tree = `LICENSE` only; the working implementation (`hashContent`, `verifyContent`,
`decodeContentHash`, wired at `mirror/fetch.ts:126` and `reads/fetch.ts:42`, tested at
`test/mirror.test.ts:396-473`, ADR-0016 Accepted 2026-08-07) exists only on `chore/scaffold@37badc4`
(2026-08-09), and `Kanban.md:62` records that merging it was **stopped** by the 2026-08-08 ruling.
`Designs/arcade/owner-decision-inbox.md:39` still says "(c) is already in flight … confirm it lands" —
it landed on a branch and was then abandoned by policy. *Fix:* record in the SDK/efsv2 sets that the
one working conformant codec is on `sdk@chore/scaffold` and is reusable as a *pattern* under the
greenfield ruling; stop describing it as "in flight". Owning: **sdk**, **vault-process**.

**F5 — DRIFT (blocking, MVP-relevant). The Devcon talk was accepted on 2026-09-02 with a locked requirement to demonstrate independent verification over public Sepolia — the one thing the code cannot do.**
`Milestones.md:17-18` "talk accepted and participation confirmed 2026-09-02"; `:40-42`; `:46-55`
"Hard requirements" (was "None locked"); `Devcon/README.md:33-36`. Against F1/F2/F3 the accepted
demo cannot be performed today: no verifier is called, the on-chain claims are unclassifiable, the
pins are one machine, and reseeding is impossible (F6). `Milestones.md:53-54` ("preverified offline
fallback") mitigates the *network*, not the *claim*. Nothing in `Designs/`, `Open-Decisions.md`
(Ask now: 0), or `Kanban.md` connects the accepted talk to these defects. *Fix:* open one owner item —
"what exactly does the Devcon Sepolia demonstration verify, and against which value?" — and either
bind canonical `f1220` values for the demo file set or restate the demo claim as digest-from-CIDv1
rather than from the `contentHash` PROPERTY. Owning: **owner**, routed by **vault-process**.

**F6 — DEFECT (blocking, MVP-relevant). "Disposable and may be reseeded" has no reseeder.**
`Decisions.md:23` licenses reseeding, but the seeder of record (`seed-dataset.ts` lineage,
`Designs/arcade/mvp-architecture.md:152`) is in **no cloned repo** (`find -iname '*dataset*'` and
`grep "seed-dataset"` in `contracts` → nothing; `Designs/arcade/README.md:41` "the seeder tooling of
record was never merged"), and the in-repo `seed-impl.ts:165-168` deliberately "mints empty DATA
only". The disposability ruling is therefore load-bearing on a capability that does not exist.
*Fix:* state plainly in the efsv2 set that v1 reseeding is currently impossible with cloned code, so
"disposable" means "abandonable", not "reproducible". Owning: **efsv2**, **arcade**.

**F7 — DRIFT (important, MVP-relevant). A live Kanban card names the wrong gate and would deepen the contamination.**
`Kanban.md:29` "Crypto-whitepaper reference dataset — seed if/when there's demand … Sepolia is live;
**only gate is pinning/Arweave creds + a seeding run**" contradicts
`Designs/arcade/mvp-architecture.md:154` ("**No durable seeding before this lands**") and
`Designs/arcade/owner-decision-inbox.md:37` D4(a) ("**the gate** before any further durable seeding").
`/whitepapers` is already 40 of the 67 contaminated files
(`Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md:61`). PROPERTY is
non-revocable (ADR-0052), so executing the card as written mints permanent unverifiable values.
*Fix:* amend the card to carry the canonical-encoding gate, or mark it blocked. Owning:
**vault-process**.

**F8 — DEFECT (important). `contracts/docs/FUTURE_WORK.md:139` names a "conformant writer" that contains no hashing code, and its "not a permanent-data emergency" framing is falsified in the repo it lives in.**
It says "the production client (separate repo `efs-project/client`) is the conformant writer that
matters at launch" — at `client@85796b3` (the commit that *marks the client legacy*) the whole `src/`
is 17 files with zero `sha256`/`keccak256`/`contentHash` occurrences. The same paragraph's "the debug
UI runs on the weekly-reset devnet, so this is pre-mainnet hardening, not a permanent-data emergency"
is contradicted by 67 durable Sepolia values, as
`Reviews/2026-08-07-arcade-corpus/verification-contenthash-writers.md:67` already recorded. *Fix:*
contracts-repo doc fix (outside the vault); inside the vault, do not cite FUTURE_WORK's framing.
Owning: **arcade** (citation hygiene) — the doc itself is out of vault scope.

**F9 — UNVERIFIABLE (important). The 67-file count, the single-VPS pin custody, and the empty devnet cannot be re-checked from here.**
Public Sepolia RPC is 403 at the proxy (`curl: (56) CONNECT tunnel failed, response 403`); the
`datasets/`, `content/` and `devnet/` repos that hold the pin runbook and the seed receipts are not
cloned. What *is* checkable corroborates each: the write path that produces `0x`-keccak values exists
and is wired (F2); `contracts/docs/FUTURE_WORK.md:157` item (7) and `:478` independently describe a
single unauthenticated devnet IPFS node; `verification-games-deployment.md:66` explains the empty
devnet as a post-reset fork with no re-deploy. *Fix:* none — label these as dated and re-verify from
primary sources before any public claim, exactly as `CORRECTIONS.md:41-44` instructs. Owning: **arcade**.

**F10 — DEFECT (minor). The faucet is an off-repo HTTP service, not an on-chain contract, and no doc says so.**
`find -iname '*faucet*'` in `contracts` returns seven client-side files and **no `.sol`**.
`packages/nextjs/utils/scaffold-eth/faucet.ts:1-27` documents it as an HTTP drip client, env-gated
(`NEXT_PUBLIC_FAUCET_URL` "unset ⇒ disabled"), defaulting to Sepolia. `Designs/arcade/owner-decision-inbox.md:46-49`
(D6) and `mvp-architecture.md:101-102` describe it as "compose profile + funded key", which is
consistent — but `Designs/arcade/README.md:42` "The Sepolia faucet … is built and integrated but not
deployed" reads as if a contract were pending. "Built and integrated" is VERIFIED; "not deployed"
is UNVERIFIABLE (the service is outside every clone). *Fix:* if the arcade README is ever recut,
say "off-chain drip service, client integrated, service not stood up". Owning: **arcade**.

**F11 — DEFECT (minor). `contracts/docs/LAUNCH_CHECKLIST.md` is an April-2026 artifact with every box unchecked and must not be treated as a launch-state record.**
`:4`/`:11` "Devnet (April 19, 2026) — bicycle day"; `:128` "devnet → mainnet timeline (April 19 →
April 22)". Unchecked items include `:16` "IPFS node running (kubo or similar)" and `:34` "Production
EFS Client … reviewed for devnet readiness", both of which demonstrably occurred. It contains no
faucet item. *Fix:* out-of-vault doc; inside the vault, no design cites it — keep it that way.
Owning: **arcade** (do not adopt as evidence).

**F12 — DEFECT (important, MVP-relevant). `Designs/media-library/README.md:179` — the only citation for the media-library's first build slice points outside the documented repo layout.**
`../../../experiments/efs-media-library-offline-loop/docs/superpowers/specs/2026-08-14-offline-personal-library-loop-design.md`
is unresolvable, and `experiments/` is absent from `Onboarding/repo-map.md:7-16`. Repeated at
`Designs/media-library/plex-jellyfin-app.md:429`. "Foundation Slice 0" is thereby uncheckable by any
reader. *Fix:* either add `experiments/` to the repo map with a custody statement, or inline the
slice-0 acceptance trace into the media-library set. Owning: **media-library**, **vault-process**.

**F13 — UNDECIDED (important, MVP-relevant). Nobody owns "v1 Sepolia as a demonstration substrate."**
`Designs/efsv2/README.md:9` scopes Sepolia as "the first development Commons, not a permanent or
canonical venue selection" and `:133` "No Commons venue or canonical EFS home chain is selected".
The arcade set is held (`Open-Decisions.md:20,:73`, 7 items HELD). `Milestones.md:40` nevertheless
commits an accepted talk to "the public EFS Sepolia system as the working example". No set claims
the v1 explorer/dataset as a maintained artifact, and `Open-Decisions.md` reports **Ask now: 0**.
*Fix:* assign one owner for the demo substrate — most naturally **owner** with a routing note in
`Designs/README.md` — before November. Owning: **owner**, **vault-process**.

**F14 — DEFECT (minor). None of the four unmerged branches touches these defects.**
`Designs/arcade/README.md` is byte-identical on `readiness`, `sdkv2` and `data-explorer`
(`diff -q` clean against main); `lab-tournament` is an orphan with no arcade or Milestones content.
The only branch/main divergence in `Milestones.md` is that the branches predate yesterday's Devcon
acceptance. So nothing on a branch resolves, softens, or contradicts F1–F13. *Fix:* none; recorded so
no lane assumes a branch already handled this. Owning: **vault-process**.

---

## Who should fix what

| Set | Action |
|---|---|
| `owner` | Answer one question before November: what does the accepted Devcon Sepolia demonstration actually verify, and against which value (the `contentHash` PROPERTY, which is unclassifiable, or the CIDv1 mirror digest, which is not)? Assign an owner for the v1 demo substrate. |
| `vault-process` | Route F5 into `Open-Decisions.md` (it currently says Ask now: 0 while a hard, dated commitment depends on a broken path). Amend or block `Kanban.md:29` so it carries the canonical-encoding gate. Record that the branches do not resolve any of this. |
| `arcade` | Stop citing `contracts/docs/FUTURE_WORK.md`'s "not a permanent-data emergency" and `LAUNCH_CHECKLIST.md`. Restate `README.md:37-42` as dated 2026-08-07 facts with the F3 sharpening ("malformed-claim", not merely non-canonical) and the F6 correction (no reseeder exists). Keep the ETHOnline verified-fallback trace only if a verifier is actually named. |
| `efsv2` | Make fail-closed byte verification and a self-describing digest encoding *Core requirements with conformance vectors*, not prose — the v1 failure is precisely a ratified spec with zero writers and an uncalled verifier. State that v1 reseeding is not currently possible. |
| `sdk` | Record that the one working conformant codec/verifier is `sdk@chore/scaffold 37badc4` (`packages/sdk/src/content/hash.ts`, `mirror/fetch.ts`, ADR-0016) and is reusable as a pattern under the greenfield ruling; remove the "in flight, confirm it lands" language at `Designs/arcade/owner-decision-inbox.md:39`. |
| `media-library` | Resolve or inline the `experiments/` slice-0 specification (F12). |

## Still undecided between sets

- **Who owns the v1 Sepolia demo substrate** for Devcon: `arcade` (held), `efsv2` (explicitly declines
  a canonical venue), or `owner` directly. Nobody claims it today.
- **Whether the 67-file remediation is required after all.** It is "moot" under disposability
  (`Decisions.md:23`) and simultaneously load-bearing for `Milestones.md:41-42`. No set reconciles these.
- **Where the fail-closed verify obligation lives** in EFS 2.0: `efsv2` Core read path,
  `web-client-os` runtime, or a future SDK. The v1 lane routed it to "SDK (owns fetch/hash per boundary
  ruling)" (`verification-execution-mirrors-enumeration.md:144`); no v2 set has picked it up.
