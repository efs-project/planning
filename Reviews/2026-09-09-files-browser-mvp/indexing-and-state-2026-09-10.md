# Indexing, state tiers, dedup and MUD — research synthesis and engineering position

**Status:** experiment document on the files-browser branch, not a design and
not a ruling. Written 2026-09-10 by the integration-test-lead after the owner
asked for a deep dive on index families, content dedup, bytecode-as-storage,
CCIP-Read, MUD and the newest EIPs. Companion to
[gas-engineering-2026-09-10.md](gas-engineering-2026-09-10.md), which this
document amends in three places (§0). Every figure carries **MEASURED**
(run here or by the cited project), **QUOTED** (spec or doc text) or
**ESTIMATED** (arithmetic from the other two).

**Provenance.** Four research strands and one synthesis were produced by
agents under my workflow and are kept verbatim in
[research-2026-09-10/](research-2026-09-10/) (`mud.md`, `filesystems.md`,
`eips.md`, `indexing.md`, `synthesis.md`). I re-verified the six claims that
carry the most weight against primary sources today — EIP-8037 and EIP-8038
(both *Status: Review*, both under *Scheduled for Inclusion* in EIP-7773;
activation table blank), ERC-7813 (*Last Call*, deadline 2026-06-16, not
Final), lattice.xyz ("Redstone is shutting down on May 15, 2026"), and the
GitHub API for `latticexyz/mud` (`pushed_at` 2026-04-10, 510 open issues, MIT,
not archived). Everything else is as the strands report it.

---

## 0. Three amendments to the gas report

1. **Decision A is reframed.** The seven "unqueryable" posting families are
   not speculative: they are the on-chain indexes the owner is asking for. The
   B0 index chapter calls them "Baseline automatic indexes (the mandatory set)"
   ([b0-indexes.md §3](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md)).
   C0 built the write side for all ten families and shipped a read side for
   two: `supported()` is `T == 0 && ordinal == 0 && (kind == 8 || kind == 10)`
   ([StateAuditPages.sol:49](../2026-09-05-c0-core/src/StateAuditPages.sol)).
   *Unfinished, not dead* — but they should be finished as **bitmaps over
   directory-local ordinals**, not as the id-per-entry posting lists that were
   built (§3), because of the next point.
2. **Storage is being repriced.** EIP-8037/8038 (Glamsterdam) make a fresh
   cold slot **110,020** gas (2,100 + 10,000 + 64 B × 1,530; ESTIMATED sum of
   QUOTED parts) instead of 22,100, and a rewrite of an existing cold slot
   **12,100** instead of 5,000. Reads are unchanged. Code deposit goes from
   200 to 1,530 gas/byte. *If* all 94 touched slots of the tag write were
   fresh it would cost ~11.1M on that schedule (ESTIMATED, an upper bound:
   the fresh count is at most ~64 by arithmetic and is being classified in
   [gas-baseline-2026-09-10.md](gas-baseline-2026-09-10.md)). "Reads
   unchanged" means SLOAD pricing; EIP-8038 also raises cold account access
   2,600 → 3,000 and adds a warm-access charge to `EXTCODECOPY`/`EXTCODESIZE`,
   which matters for code-backed bodies. Activation is undated; press tracks L1 for late
   2026 and L2s have historically lagged 6–8 months and may set their own
   numbers. **Every proposal in gas-engineering §5 now has to be scored on
   both schedules**, and the allocate-versus-rewrite gap (4.4× today, 9.1×
   after) is the fact that decides index shape.
3. **Events are cheap but not durable.** A two-topic log costs ~1,600 gas
   (ESTIMATED), but partial history expiry is live (EIP-4444/7642), hosted
   RPCs cap `eth_getLogs` ("10K logs or a 2K block range", QUOTED Alchemy), and
   EIP-7668/8304 point at removing bloom-based log lookup. The "event-only
   tier" I described in chat is valid for data no contract reads, but it
   cannot be the web client's *only* source on a chain with expiry. State is
   the authoritative index; logs serve hot-window sync.

---

## 1. The ten posting families, in plain terms

From the key construction in
[IndexKeys.sol:44-85](../2026-09-05-c0-core/src/IndexKeys.sol):

| Kind | Key | Question it answers | Readable in C0 |
| --- | --- | --- | --- |
| 1 | `(T, –)` | every admission of type T | no |
| 2 | `(T, unique)` | distinct records of type T | no |
| 3 | `(0, recordId)` | every admission of this exact record | writer only |
| 4 | `(0, principalId)` | everything this principal admitted | no |
| 5 | `(0, targetKey)` | everything referencing X, any type/role (general backlink) | no |
| 6 | `(T, role, targetKey)` | records of type T referencing X in role R (typed backlink) | no |
| 7 | `(T, index, scalar(field))` | records of type T whose indexed field equals V | no |
| 8 | binding head | what is bound at position P under principal Q | **yes** |
| 9 | `(0, digest)` | records carrying content digest D | no |
| 10 | `(0, scope(principal, purpose, subject))` | positions ever bound by a principal under a directory, in creation order | **yes** |

The owner's four thought experiments map directly: "tagged `nsfw` in D" is
kind 8/10 to enumerate D, joined with kind 6 (Tags whose subject is each
entry) or kind 7 (all `nsfw` Tags); "`image/png`" is kind 7 on the media-type
field; "images" is a prefix of that field and needs a second posting at write
time; "NOT `nsfw`" needs a closed universe, which a directory listing under a
lens is and the ledger as a whole is not. An MMORPG contract's needs — items
by owner (4 or 6), equipped slot (8), objects on a tile (7), counts (every
head stores `count`/`liveCount`) — are the same families. The shape is right;
the cost and the current-versus-history join are wrong.

**Cost as built.** B0 §9 budgeted the family set at "(D ≤ 3+4+1, plus
unique ≤ 1) × 13,420 ≈ 120,800 max" per occurrence (QUOTED). The ablation in
gas-engineering §4 measured 580,958 for a two-leaf tag, ≈290k per leaf — at
least 2.4× the design's own ceiling, and the ablation left the unique family
in place. Each append is a fresh slot plus a head rewrite. Under
Glamsterdam pricing each fresh posting is ~110k.

---

## 2. The ordinal space already exists: the scope family

The indexing strand's costed design (§3) needs each directory to assign its
entries small, monotonic, never-reused integers so that predicates can be
stored as bits. It asked whether EFS has such a space ("Is the binding table
positional?" — open question 2 in the synthesis). It does, per principal:

- A binding key is `keccak(DOM_BINDING, principalId, positionKey)` where
  `positionKey = keccak(DOM_POSITION, purpose, subject, fieldRole)`
  ([BindingFold.sol:95-101](../2026-09-05-c0-core/src/BindingFold.sol)) —
  a hash, not an ordinal.
- But the first time a binding key goes live (`beforeHead.state == 0`), the
  kernel appends the admission ordinal to the kind-10 posting keyed
  `scope(principal, purpose, subject)`
  ([StateKernel.sol:485-491](../2026-09-05-c0-core/src/StateKernel.sol)),
  exactly once per position, in creation order.

So `scope(principal, DIRECTORY, D)` is an append-only list of every name that
principal ever placed in D, and **the index of an entry within that list is a
directory-local ordinal**: dense, monotonic, never reused, already paid for.
Bitmaps keyed by `(scopeKey, tagId)` over that ordinal give the four queries
at the strand's prices with no new ordinal maps (the cheaper end of its
range). The consequence to state plainly: the ordinal space is per principal,
so a Lens that admits *k* source principals reads *k* words per 256 entries
per predicate. That is the strand's `(D, tag, attester)` keying, and it is the
honest boundary: a lens over an open-ended attester set has no on-chain answer
at any of these prices (synthesis finding 12).

---

## 3. The costed index set for a directory

Adapted from research-2026-09-10/indexing.md §6 to the scope-ordinal above.
Storage per `(scopeKey)`: the existing kind-10 list (closure counter is its
`count`), `alive[word]`, `bits[tagId][word]`, optional two-level summaries
and `tagCount[tagId]`.

**Per write**, adding one file tagged {image, image/png} (ESTIMATED):

| Item | today | Glamsterdam |
| --- | --- | --- |
| scope append (exists today) | 22,100 + head | 110,020 + head |
| `alive` bit | ≈5,070 amortised | ≈12,500 |
| tag bits ×2 | ≈10,140 | ≈25,000 |
| summary transitions | 5,000, once per 256 files per tag | 12,100 |
| optional `tagCount` ×2 | 10,000 | 24,200 |
| **index overhead beyond the scope append** | **≈20–32k** | **≈50–75k** |

Later "nsfw" on an existing entry: ≈5,070. Removing a tag: ≈5,000. Rebinding
a position to a new record: ≈5,070 per differing bit. For comparison MUD's
hook-maintained modules cost +110–128k per write (MEASURED) and EAS's
opt-in `Indexer.sol` ≈135k (ESTIMATED). Under Glamsterdam any id-per-entry
index goes to ≈700k+ per write; the bitmap layer stays in the tens of
thousands because it mostly rewrites existing words.

**Per query** (ESTIMATED; W = ⌈n/256⌉ words, h = hits; reads unchanged by
Glamsterdam):

| Query | words | ordinals | + materialise ids |
| --- | --- | --- | --- |
| tagged image | W | 2,100·W + ~80·h | 2,100·h |
| tagged image/png (second bit written at write time) | W | same | same |
| tagged nsfw (sparse, two-level) | summary + non-empty words | 2,100·(⌈W/256⌉ + nonempty) + 80·h | 2,100·h |
| **NOT** tagged nsfw | 2W (`alive & ~nsfw`) | 4,200·W + 80·h | 2,100·h |
| image AND nsfw | 2W, or sparse-first | 4,200·W | 2,100·h |

n = 1,000: ≈8k for a positive scan, ≈17k for the negation. n = 10,000: ≈84k /
≈168k. n = 100,000: ≈0.8M / ≈1.6M — fine for `eth_call`, marginal inside a
transaction, so the read surface must take a `(fromWord, toWord)` range the
way Uniswap's `tickBitmap` does. Membership ("is *f* tagged nsfw?") is two
SLOADs, ≈4,300 cold — the operation a game contract will actually run most,
and it is O(1). Negative filters cost the same as positive ones; with
arrays or sets the anti-join is ≈4,200 **per file**, 256× worse. The web
client runs the same `eth_call`s with a pinned `blockTag`, comparing the
scope `count` before and after a paged read — no indexer, no Graph, no log
range caps.

**Where on-chain stops** (say so in the design): global cross-directory
predicates over a large corpus (a dense tag over 1M files ≈ 8.2M gas per
scan; only sparse tags via summaries stay in budget); any predicate not
materialised as a bit at write time (prefix or regex over tag strings,
numeric ranges, "any of these N attesters"); ranking beyond insertion order;
history ("nsfw at block B") — only current bindings are indexed; returning
thousands of full bodies in one transaction. Trustless off-chain answers
exist (Brevis ZK coprocessor is live; Axiom's was shut 2025-05-30, QUOTED).

**Current versus history.** The index must be keyed on the *binding
position*, never the record id: on rebind the writer re-derives the new
record's tag set and flips the delta. Superseded records remain resolvable by
id and exportable, but are never in the index. Every production system that
needs on-chain consumers chose write-time maintenance (Farcaster moves keys
between sets; Uniswap clears the bit; MUD's modules re-home the key); the
read-time join (EAS: 2,100–17,000 per hit, stale ratio unbounded) is only
acceptable for off-chain readers.

---

## 4. What should be in state — four tiers, two schedules

EFS holds **facts** (immutable content-addressed records) and **choices**
(bindings: what a principal currently selects at a position). Bindings are
the only mutable thing and are what a Lens resolves over. The state question
is not "which records" but which *tier* each fact lands in:

| Tier | What a contract can do | today | Glamsterdam |
| --- | --- | --- | --- |
| event only | nothing; clients rebuild within the RPC's log window | ≈1,600 | ≈1,600 |
| state by id | fetch it, given the id | 2–3 fresh slots ≈45–66k | ≈220–330k |
| indexed by a property (bitmap) | find it by that property | ≈5k per bit | ≈12.5k per bit |
| indexed by a property (id per entry) | same, ordered, unbounded universe | ≈22–27k | ≈110–137k |
| current under a lens | ask "what is here now" | 1–2 slots ≈22–44k | ≈110–220k |

The rule, in one sentence: *put in state what a contract must read; index
what a contract must search by; everything else is an event — and know that
an event is not durable.* The automatic families promoted every reference
and every declared field of every record to the indexed tier without anyone
deciding it per field. The decision the owner is actually being asked for is
which families are on by default and which are opt-in per Type.

### 4a. Static ids and dynamic names — nothing from EAS is lost

The owner's question (2026-09-10): with EAS a contract could lock to an
attestation UID (static, on-chain forever) *or* point at a dynamic EFS name
and read whatever is currently there; does v2 keep both?

Yes, and the split is cleaner than EAS's:

| | EAS (v1) | EFS v2 |
| --- | --- | --- |
| static reference | attestation UID — immutable payload, but *revocable*, so a locked contract must also check `revocationTime` | record id = keccak(type, body) — immutable, content-verifiable anywhere (a copied record proves itself without the origin chain), and never revocable: the bytes are the bytes |
| dynamic reference | a name whose PIN the resolver reads for one attester | a binding at position `(purpose, subject, fieldRole)` under a principal, read through a Lens — the dynamic reference is `(position, lens)`, and an effectful consumer must pin which Lens/TypeId it trusts (consumer-tournament verdict, 2026-08-26) |
| "still endorsed?" | fused into the UID's revocation flag | a separate fact: the binding. A record can be withdrawn from a position without the record ceasing to exist |

So a contract that wants static trusted data locks to a record id (tier
"state by id" in §4) and gets the same bytes forever; one that wants the
live value reads a binding under a Lens it names; one that wants "the bytes
*and* the author still stands by them" reads both. That is exactly EAS's two
modes, with revocation no longer able to make a static reference dangle.

The clarification I asked for is narrower than this. History *point reads*
already exist and stay: a binding's prior states are retained (the kernel's
binding-history family) and any old record resolves by id forever. What is
open is whether any **contract** needs to *search the past by predicate* —
"every file that was tagged `nsfw` as of block N", or "enumerate everything
that was ever bound here" — because that is a separate, much larger index.
Recommendation: index only the current state for contract search; keep
history as point reads and as verifiable exports; add a history index later
as an opt-in family paid by whoever needs it. Nothing about static ids or
dynamic names changes under that recommendation.

---

## 5. MUD — what to take, what to refuse

Status verified today: Lattice has wound down (Redstone off 2026-05-15; DUST
continued by 0xPARC on its own chain); `main` frozen at 2.2.23, last push
2026-04-10, external PRs closed unmerged; OpenZeppelin audit 2024-02-11; MIT;
ERC-7813 Last Call past its deadline and not Final; Dozer still pushed
2026-08-31; EVE Frontier left the EVM for Sui (announced 2025-10-08). Adopting
MUD means forking ~15 audited Solidity files and a TypeScript toolchain, not
depending on a maintained upstream.

**Take (MIT, no World required).** The `@latticexyz/store` physical layer:
one keccak per record, statics tightly packed across consecutive slots, one
lengths word, ≤5 dynamic fields, on-chain schema registry readable by other
contracts. MEASURED: cold single-slot record 32,095; two-slot 54,603; the
`Mixed` struct 102,753 vs 91,999 native Solidity (the 12% premium buys the
event, the packed lengths word and the schema). And the ERC-7813 event
protocol: `Store_SetRecord` carries the full encoded value, so emitting
compatible logs plus registering schemas inherits `store-sync` (snapshot
from an indexer if present, else `eth_getLogs` replay chunked at 1,000
blocks), `protocol-parser`, `stash`, the SQLite/Postgres indexers, Dozer
point-in-time, the explorer and SQL API — unchanged. That is more client
infrastructure than EFS will write in a year.

**Copy as pattern.** One event per write with the full value; codegen'd typed
accessors in the SDK; "offchain table" as an explicit event-only tier;
modules as on-chain install scripts for optional per-write-paid indexes;
write-once via a before-set hook for content-addressed keys.

**Refuse.** The World: exactly one value per `(table, keyTuple)`, last writer
with access wins (the opposite of Lens); no sender in events and no author
column; no version counter or previous value; writer-chosen keys; root
systems `DELEGATECALL` with unrestricted storage; ~40k routing per call
(MEASURED 39,980). MUD's generic index modules (KeysInTable, KeysWithValue)
cost +110–128k per write and were replaced by hand-maintained tables in Sky
Strife after transactions grew from ~1M to up to 45M gas (QUOTED
retrospective). Both strands land on the same sentence: generic auto-indexes
do not survive production; purpose-specific, write-path-maintained ones do.

**Honest verdict.** MUD is better engineered than EFS today at physical
storage (1–4 slots vs 94), event/replay protocol, client sync, codegen,
access checks, schema registry, audit and incident process. EFS exceeds MUD's
model at pluralistic resolution, retained history, content addressing,
attribution and contract-readable enumerable indexes — MUD has no primitive
for any of these. An EFS tag modelled as Store records (64-byte record 2
slots + binding 1 + posting ~2) is ≈150–200k through a World-style entry
(ESTIMATED), 14–19× cheaper than today and in EAS's band; with the bitmap
layer, ≈180–280k today and ≈0.6–0.95M under Glamsterdam.

---

## 6. Dedup and bytecode-as-storage

**Dedup already exists at two levels.** Records are deduplicated by id (the
kernel skips an existing `RecordRow`,
[StateKernel.sol:263](../2026-09-05-c0-core/src/StateKernel.sol)); whole files
are deduplicated because the tree id is content-derived and staging is
write-once per tree. **It leaks at the chunk key**: staged chunks are keyed
`chunk[treeId][index]`
([AuthorityUpgrade.sol:42](contracts/src/AuthorityUpgrade.sol)) and the B0
byte-store sketch salts `CREATE2` with `keccak(chunkTreeRecordId ‖ index)`,
so identical bytes in two files are stored twice. The filesystem strand's
fix is one line plus one slot: a content-only salt (or a constant, since the
initcode hash already commits the bytes) and a `leaf[treeId][i]` pointer
(22,100 per chunk today, ≈0.5% of a 20 KiB deploy; 110,020 under
Glamsterdam against a ≈31.5M duplicate deploy). Break-even is a 0.35–0.5%
duplicate-chunk rate; Venti measured 27.8–31.3% duplicate blocks and whole-file
dedup alone captures ≈75% of block-level savings (QUOTED). Side effects: the
pointer array replaces the coverage bitmap, contracts read chunk *i* without
a proof, and the manifest becomes contract-readable — the owner's axis.

**Nothing from mutable filesystems' dedup cost applies.** ZFS's DDT, btrfs
backrefs and bcachefs's double lookup all exist to free blocks at refcount
zero. Nothing is deleted here: no refcount, no GC, no free path. On the EVM
the state trie *is* the hash-keyed table; a dedup lookup is one cold SLOAD or
`EXTCODESIZE`. Content-defined chunking (FastCDC, 10–20% more redundancy
than fixed chunks, QUOTED) breaks the O(1) offset→chunk arithmetic and adds
a second identity space; defer it to a `ChunkTree/2` if a fixture of large,
edited, state-tier files ever appears. Delta compression in state is
harmful at 100:1 reads. ChunkTree/1 itself is a sound Venti/Arweave/Bao-family
commitment (count-at-apex, RFC 6962 domain tags, manifest-as-content).

**Bytecode-as-storage (decision C).** Reads decide it: 20 KiB via
`EXTCODECOPY` ≈5.3k gas versus ≈1.6M as cold SLOADs (ESTIMATED), and it is
the cheapest cross-contract read on the EVM — no CALL. Writes are ≈218
gas/byte today (deposit 200 + calldata + overhead) versus ≈690 per slot-byte;
under Glamsterdam 1,530 versus ≈3,440. Durability: EIP-6780 removed
`SELFDESTRUCT`, EOF is Stagnant (no EOF data sections coming, legacy initcode
deploy stays valid), EIP-7954 raises the code limit to 64 KiB (Scheduled). One
correction to my chat framing: Glamsterdam adds a fixed ≈195,600 per new
account (12,000 + 183,600), so the per-chunk fixed cost strongly favours
fewer, larger chunks — ≈39 KB per transaction at a 60M block — and a 20 KiB
chunk becomes ≈31.5M state gas (ESTIMATED), still under a block because
state gas sits outside the EIP-7825 execution cap.

**CCIP-Read** (EIP-3668) is unchanged by any of this: `eth_call` only; a
contract in a transaction cannot follow an `OffchainLookup`. Its EFS use is
verified reads of bytes the user kept off-chain (callback checks the bytes
against the on-chain ChunkTree root) and cross-chain reads via storage
proofs. It does not satisfy the contract-readable index requirement.

---

## 7. EIPs and practices that change what we build (ranked)

1. **EIP-8037/8038** — fresh slot 22,100 → 110,020; rewrite 5,000 → 12,100;
   code 200 → 1,530/byte; new account 25,000 → 183,600; reads unchanged.
   Minimise fresh slots per write; 94 is not survivable.
2. **EIP-7825** (Final, live on L1 and OP Stack; Arbitrum sets 32M) —
   16,777,216 execution gas per transaction. State gas under 8037 rides above
   it.
3. **No EXTSLOAD, ever** (EIP-2330 Stagnant, no successor). Contract
   readability must be built in: Uniswap v4-style `extsload(bytes32)` /
   range / batch raw slot getters for mutable bindings and indexes;
   `EXTCODECOPY` of SSTORE2 bodies for immutable records.
4. **Rewrite-versus-allocate gap 4.4× → 9.1×**, plus EIP-7939 `CLZ` at 5 gas
   (Final, Fusaka; Solidity 0.8.31 Yul `clz`) — bitmaps become the only cheap
   index shape and word scans become first-class.
5. **EIP-7928 block-level access lists** (SFI Glamsterdam) — blocks ship
   touched slots with post-values; a web client can follow contract state
   from blocks without logs or an indexer (applicability ESTIMATED). Also:
   disjoint write sets parallelise, so avoid global head slots.
6. **EIP-8032/8075** (Draft; 8032 declined for Glamsterdam, Base-backed) —
   size-based or adaptive state pricing punishes singleton mega-registries.
   Shard: per-namespace stores, SSTORE2 bodies, not one 100M-slot contract.
7. **History expiry** (4444 partial live, 7642 mandatory) — logs are not
   storage.
8. **State expiry trajectory** (EIP-8188 `last_written_block`, reads do not
   refresh it) — a read-heavy index is exactly the state that would expire
   first; nothing scheduled, but records should be revivable by proof.
9. **EIP-7976** — calldata floor to 64/64 per byte (Scheduled); pure
   "post bytes" transactions get pricier, storage-heavy ones don't.
10. **EIP-7904** — keccak stays 30 + 6/word; the tag's 576 hashes (26k
    MEASURED) will not get cheaper.

---

## 8. Corrections to what I said in chat today

- "SSTORE2 is ~216 gas/byte" — true on today's schedule; 1,530/byte under
  8037, still ≈2.2× cheaper than slots and the only contract-readable bulk
  read. Chunks should get larger, not smaller.
- "Finish the seven families" — finish the *queries*; do not finish the
  posting-list *shape*. Id-per-entry lists are the structure the repricing
  punishes most.
- "Events are the cheap tier" — cheap, not durable; not a sole client source
  on a chain with expiry or capped RPCs.
- "Per-directory ordinals would need a new map" (implicit in my cost
  framing) — they exist per principal via the kind-10 scope list (§2).

---

## 9. Decisions and clarifications for the owner

**A — index families.** Not dead. Finish the read side as bitmaps over the
scope ordinal (§2–3), keyed by `(scope, tag)` and therefore per principal;
make the families opt-in per Type rather than automatic for every field and
reference; state the negation rule (within a listing, never globally) and
the attester boundary (a lens over an open set has no on-chain answer).

**B — dedup.** Yes, and it is nearly free: content-only chunk salt plus a
pointer slot. Chunk-level, not just whole-file. No CDC yet.

**C — bytecode-as-storage.** Yes for record bodies and chunks; the read
asymmetry (≈300× at 20 KiB) and durability both point the same way. Plan for
larger chunks under Glamsterdam.

**Owner direction, 2026-09-10 (chat, not a protocol ruling).** On A, B and
C James said: "1, 2, 3 sound like engineering problems and I guess I say
Yes. I don't fully understand them, the options, or the tradeoffs so I trust
you." This is direction to proceed with the measurements and prototypes in
§9's next steps under the standing constraint that nothing freezes protocol
choices; it is recorded here, not in `owner-rulings.md`. On history versus
current he asked whether v2 loses EAS's "lock to a static UID" property —
answered in §4a below. On tags he asked for a separate deep dive; the result is
[tag-system-2026-09-10.md](tag-system-2026-09-10.md), which also surfaces
that the "opt-in per Type" recommendation in §9 below conflicts with the
2026-07-15 mandatory-indexing ruling (`owner-rulings.md:44-62`) and turns it
into decision D-D there.

**Clarifications that change the index design more than A/B/C:**

1. Do contracts need history, or only current-under-a-lens? Current-only
   lets the index be write-maintained and bitmapped; history-in-contract is a
   different and far more expensive structure (history stays exportable and
   verifiable either way).
2. Are tags free-form strings or typed schema fields? "images" versus
   "image/png" is a prefix relation on one field — cheap if the schema
   declares the extra posting, impossible to add later to opaque strings.
3. Which L2 is the target, and is Glamsterdam pricing assumed? The strands
   could not find MegaETH's storage pricing; OP Stack (Karst) has the 2^24
   cap, Arbitrum 32M; Base says account-creation cost "can be tweaked at the
   L2 level". The design should be scored on both schedules until this is
   known.

---

## 10. Open questions carried from the synthesis

Slot-level profile of the 94-slot tag (which slots go where — needed before
choosing a Store encoding); backfill cost when a Lens is registered on a
directory with *n* existing entries (who pays, is it bounded); whether
SR-18e's 16-reference bound can be raised for closure-typed records or live
directories must be mutable mappings with closures only at snapshot time; the
ChunkTree/2 trigger (chunk groups for one identity across submission sizes,
CDC); who maintains a fork of `store` + `store-sync`; and the state-expiry
exposure of a read-mostly index.

**Could not be found:** MegaETH storage pricing; a first-party Lattice
wind-down post; a MUD maintainer; production on-chain skip lists or treaps;
published gas for on-chain Bloom filters; IPFS UnixFS or Nix dedup ratios.
