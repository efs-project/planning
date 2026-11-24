# EFS SDK v0.1: v1 feature-parity matrix

**Status:** SDK dev input for the PM's cross-repo plan. Uncommitted; the PM records it.
**Date:** 2026-11-24
**Sources:**
- v1 inventory: contracts/specs, the legacy SDK, and the v1 Next.js explorer (the working v1 UI; the Lit client was a stub).
- contracts-v2 working tree as of 2026-11-24 15:30: committed release `66b8f80`, local HEAD `249895c`, plus the uncommitted LARGE-FILES work.
- The contracts dev's messages from today.

**Mandate:** James, 2026-11-24. Basic EFS v1 functionality, named "EFS SDK v0.1" as if v1 never existed.

**Columns**
- **On-chain today:** Y = Types, rules and readers exist. P = partial. N = missing.
- **SDK:** what the SDK builds.
- **Contracts ask:** a C-number from the list at the end.

## Files and folders

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Create folder | permanent named folder under a parent | Y: `files-directory/1` + FOLDER bind | `files.plan.mkdir`; `mkdir -p` | — |
| Small file stored on-chain | bytes inline | Y: `files-root/1` form 0, up to `maxBody` (8,192 B) | `plan.put({bytes})` | — |
| Large file stored on-chain | SSTORE2 chunks | P: `files-span/1`, working tree only. The fixture allows 16 KB of bodies per publication, so 1 MB ≈ 64 publications ≈ 64 prompts. | chunker per `efs2/chunking/1`; multi-publication upload labelled non-atomic; resumable via the journal | C11 |
| External link (IPFS, Arweave, https, web3://, magnet) | MIRROR attestation; client hashes the bytes | P: `files-external/1`, any URI, linked by form 1 (working tree; committed allows ar/ipfs only, unlinked) | `plan.put({ external: uri, bytes? })`; hashes the bytes if supplied, else needs length + sha256 | C1 |
| Several mirrors per file, add/remove a mirror | any number per file | P: a revision names one descriptor; more descriptors with the same sha256 are found through the digest index. No removal; nothing is ever erased. | `files.locations(file)` via the digest index; `plan.addLocation`. Transport priority is SDK policy (web3 > ar > ipfs > https). Every byte is verified, so an injected mirror can't corrupt content; fetch safety still applies. | C12 (confirm reader) |
| Read a file, verified | path → winner → mirror → hash check, fail-closed, gateway fallback | Y | `files.open` / `read` / `stream` / `bytes`. Verified against sha256, or per span chunk. Fails over to the next location on a mismatch (v1 didn't). | — |
| Edit = new version | new DATA + PIN at the same slot | Y: `files-child/1` + HEAD CAS | `plan.update` | — |
| Rename / move file | new name + PIN, revoke the old one | Y: atomic UNBIND + BIND | `plan.rename`, `plan.move` | — |
| Rename / move folder | rebuild the subtree (about 50 ops per tx) | Y: same as files, because folders are records (better than v1) | same verbs | — |
| Copy / hardlink | PIN an existing DATA at a second path | Y (hardlink): the same file subject in two folders. P (copy): a new subject reusing the descriptor, no recipe. | `plan.link`, `plan.copy` | — |
| Delete file (own) | revoke the PIN | Y: UNBIND masks it; RELEASE reverts to the inherited entry; BIND restores | `plan.remove`, `plan.restore`, `plan.revertToInherited` | — |
| Hide another author's file (whiteout) | WHITEOUT marker | P: no recipe. UNBIND needs your own BOUND head, so it takes BIND then UNBIND in one publication. | `plan.hide` (two actions, one prompt) | C3 (direct mask) |
| Delete folder | batch revoke | Y: unbinding the folder entry masks the subtree | `plan.remove(folder)` | — |
| History / versions | `previousVersion`, `showRevoked` | Y: child parent chain, `historyAt`, `resolveAt` | `files.history(file)`, `files.at(basis)` | — |
| Folder overview (README) | README.md tagged `system` | Y: a file named README.md; `lookupName` | `files.lookup(dir, "README.md")` | — |

## Names, paths, links

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Path resolution | segment walk; first segment may be an address, UID or name | Y: `lookupName` per segment | `files.resolve(path)` returns the directory chain for breadcrumbs; `files.placements(object)` for the reverse lookup | — |
| Name rules | NFC, percent-encoding | Y: `files-name/2` (UTF-8, byte-exact, 255 B) | `checkName`, NFC normalization, wire and display path codecs (naming reconciliation) | — |
| Typed buckets (a file and a folder can share a name) | yes | N: one entry per (dir, name). Arguably better. | none | — |

## Multiple authors

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Lens (ordered authors, first wins) | max 20 | Y: up to 64 principals, `headsAt`, LensReader, FilesPageReader | one `LensInput` type everywhere; defaults from the manifest's `defaultLensPrincipals` | — |
| Default lens chain | me → viewed address → system | P: manifest defaults only | `lens.default({ me, viewing })` | C8 (homes) |
| Merged listing | union across lenses, deduplicated | Y | `files.list` | — |
| Conflict view | — | Y: `resolveNoTiebreak` | `status: CONFLICT` with `candidates` | — |

## Tags (designed in September; not implemented)

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Tag / untag a file version or folder, ± weight | TAG attestation, weight | N: S3. FOLDER/HEAD/TAG purposes exist; `F_TAGS` returns UNSUPPORTED. | `tags.*` slots return UNSUPPORTED until C6 lands, then: folded concept id (D-B), assert/deny/silent stance (D-C) | **C6** |
| Filter a folder by tag | exclude on-chain, include client-side | N | `files.list(dir, { filter: { tags } })` | C6 (F_TAGS in `listDirectory`) |

## Lists

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Declare a list (duplicates, append-only, target type, per-author cap) | LIST attestation | N (Q30). The prototype had a max-8 whole-snapshot list profile (P1). | `lists.*` | **C7** |
| Membership add / remove, ordering, labels | entries + properties | N | `lists.add/remove/entries/has` | C7 |
| List placed in a folder | yes | N | — | C7 |

## Properties and metadata

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| contentType (MIME) | reserved property | P: `media` is a 0..2 enum with no vocabulary | `mediaType` on file results | **C4** |
| size, contentHash, cid | reserved properties | Y: `length` and `sha256` in the descriptor | exposed on results | — |
| Custom key/value properties (name, description, icon…) | PROPERTY + PIN, lens-scoped | N | `props.*` | **C5** |

## Homes and identity

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Address home `/0xaddr/…` (**"attach files to addresses"**) | see below | N: one shared root, per-principal scopes | `homes.of(principal)`, `files.resolve("/0xAlice/…")` | **C8** |
| ENS names in paths and lenses | client-side resolution | — | `lens` accepts `name.eth` through an injected resolver | — |
| Display name | a `name` property | N | via props | C5 |

**"Attach files to addresses", for the PM to take to James.** In v1, every address had a home path. Alice publishes `/0xAlice/avatar.png` and `/0xAlice/resume.pdf`; anyone who opens `/0xAlice` sees them under Alice's lens. Anyone could write under `/0xAlice/`, but only Alice's lens decides what you see. In v0.1 there is one shared root and no per-address root. Options:
- **(a) recommended:** each principal has a home directory. The principal binds it with a HOME purpose on a deterministic subject derived from their principal id. `homes.of(0xAlice)` is one point read, and `/0xAlice/...` paths resolve through it.
- **(b):** a folder named `0xalice…` under the shared root. No contract work, but it's a naming convention anyone can squat, and only the lens protects it.

## Filter by Type

**For the PM to take to James.** In v1, folder entries were typed: files, folders, lists and property keys sat in separate buckets, and a directory page could be filtered by type. Example: in `/collections`, show only the lists, not the files. In v0.1, `listDirectory` already filters by kind (folders / files / hidden entries), and each row's header carries the revision's Type id. Options:
- **(a) recommended for v0.1:** the SDK filters page rows by the Type in the header. A filtered page stays honestly PARTIAL, never "empty = none". No contract work.
- **(b):** an on-chain Type filter parameter in `listDirectory`. This matters once app-defined Types share folders with files at scale.

## Other

| v1 feature | v1 behaviour | On-chain today | SDK | Contracts ask |
|---|---|---|---|---|
| Permission model (anyone writes, author-owned, nothing erased) | yes | Y | none | — |
| Paged enumerable indexes with cursors | yes | Y: `listDirectory` continuation; COMPLETE only for a scan from the origin | `ResumeToken` ≠ coverage evidence (plan §5.4) | — |
| `web3://` serving (ERC-5219 router) | yes | N: `EfsWeb3Gateway` planned "later" | the SDK reads `web3://` locations through an injected reader | **C10** |
| Redirects / symlinks / aliases | NICE | P: Type exists, can't be placed (Q39) | — | C9 |
| Third-party Solidity read/write as itself | `EFSLib`/`EFSWriter`/`EFSReader` | Y: `EfsNative`, `EfsFiles` recipes, readers | `@efs/solidity` re-exports the `@efs/contracts/` closure; `examples/foundry-consumer` | — |
| Write UX: few signatures, preview, resumable | about 2–3 signatures; preview/resume were never built | Y: one native publication per prompt; staged save up to 64 actions / 16 KB | review payload (effects, gas from `indexFloor`, prompt count); journal + reconcile | C13 later (session lane for zero prompts) |
| Sort overlays, global tag search | EDGE | N | client-side sort only | — |

## Contracts asks (for the PM to sequence)

| # | Ask | Why the SDK needs it | Urgency |
|---|---|---|---|
| C1 | At every push, regenerate `release/*.json` + `artifacts/` + the deploy plan together, so the fixture and the SDK read **one coherent snapshot**. Today the committed release (9 Types), the HEAD and the working tree (10 Types; `deploy-plan.mjs`'s JS twin is behind) disagree. This isn't digest pinning, just coherence. | codegen and fixtures | **now** |
| C2 | Complete `retryClass` in `errors.json`; 56 of 104 entries are null. | the SDK's retry and UX classes | soon |
| C3 | A direct way to mask (whiteout) another author's entry without BIND-then-UNBIND, or bless that two-action recipe in `EfsFiles`. | "hide inherited", v1 CORE | soon |
| C4 | Media type as a MIME string (in the content/external descriptor or as a property). The 0..2 enum has no vocabulary. | rendering, v1 CORE | soon |
| C5 | Properties profile: key/value on file, revision or folder, lens-scoped, with a reader `propertiesOf(target, lens)`. | v1 CORE (name, description, icon, custom) | parity |
| C6 | Tags profile per D-A..D-E: concept record from the folded string; per-author assert/deny/silent stance on a file subject, revision or folder; an index family; `F_TAGS` include/exclude in `listDirectory`; `tagsOf(target, lens)`. | v1 CORE | parity |
| C7 | Lists profile: list record with policy (duplicates, append-only, target kind, cap); entries as bindings; reader length/entries/has; placeable in a folder. | v1 CORE | parity |
| C8 | Homes: principal → home directory (option (a) above), plus a reader. | v1 CORE ("attach files to addresses") | parity, after James's ruling |
| C9 | Aliases in folders (Q39). | redirects, v1 NICE | later |
| C10 | `web3://` gateway contract. | v1 CORE serving | parity |
| C11 | Upload envelope: confirm per-publication body limits and the cost per KB on both gas schedules. Large on-chain files need many publications, which means many prompts on the native lane. | prompt budget (James: 0–2 prompts) | **James-visible tradeoff** |
| C12 | Confirm the digest-index reader (`postingSliceOf`) is the supported way to find every location for a sha256. | multiple mirrors | soon |
| C13 | Session/delegated lane (zero prompts). | James's prompt bar | after M1 |

## Proposed SDK order (each phase is usable by the client)

1. **Reads (client C2):**
   - cold pin + `verifyDeployment`;
   - `resolve`, `list` (lens, pages, kinds), `lookup`;
   - `open` / `read` / `stream` (inline, external, span);
   - `history`;
   - names and links; the eleven recorded fixtures.
   - Needs: C1.
2. **Writes (client C3):**
   - mkdir, put (inline / external / span), update, rename, move, link, remove, restore, hide;
   - staged save; review payload; journal + reconcile on the native lane;
   - Solidity re-export + consumer example.
3. **Parity profiles:** properties and media type, tags, lists, homes, locations. Needs C4–C8.
4. **Reach:** `web3://` serving reads (C10), Node/CLI/MCP, npm publishing.
