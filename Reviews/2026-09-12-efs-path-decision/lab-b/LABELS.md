# Label retention — the narrowest experiment that makes names readable from state

**Design note only. UNADOPTED proposal; not a protocol ruling, not an adopted layout, not a measured saving.** 2026-09-13, Road B lab at `dcc7b94` (Core pinned). Revised after the independent review ([road-b-review.md, "Label-retention review — September 13"](../road-b-review.md)); the five corrections are applied inline and marked **[review]**. What IS now scripted (unrun) is the review's "smallest conservative next probe" — candidate (b) with the Ledger unchanged — as cells `label/*` in `script/measure.mjs`, `src/LabAcceptors.sol` (`LabelAcceptor`), `src/JoinedConsumer.sol` (`readLabel`) and `test/LabelType.t.sol`. Candidate (a) stays a separately versioned dictionary probe that has not been built. All slot and gas figures below are ESTIMATED and unpriced.

## The gap

In the lab a placement is the binding `(author, FOLDER, folderId, role = keccak256(name)) → subjectId`, a tag is `(author, TAG, subject, role = keccak256(concept)) → stance`. The only durable trace of the name is its hash: `PositionCell` keeps `purpose/subject/role` **as hashes** (`src/Ledger.sol:86`, written at `src/Ledger.sol:534-538`), the `Action` tuple carries `role` as `bytes32` (`src/Ledger.sol:42`), and the diagnostic cells send **empty bodies** for every BIND action. A cold browser that reads only state can list a folder (positions, targets, revisions) but cannot print `note.txt`; it can only confirm a name it already guesses.

**Until this is closed, a hash-keyed metadata create (subject + record + head + placement with hashed names) must not be called a full Files create.** It is the create *minus* the user-visible name. Every 32-byte/41-byte cell in the measurement is labelled a hash-placement diagnostic for this reason.

## What "retrievable from state" must mean here

- Given a listing entry's `position`, a reader with no cache resolves the exact UTF-8 bytes of the name from Realm state alone, at the listing's basis, with bounded calls.
- The bytes are self-certifying: `keccak256(bytes) == role`, so no author or index is trusted for the mapping.
- Missing bytes are reported as `LABEL_UNAVAILABLE`, never as an empty name.
- Normalization (NFC, case) is a client policy layered on exact bytes; the Realm stores exact bytes.
- **[review] Display-label coordinates are not interchangeable.** A body checked against a FOLDER role supplies the *entry name* of that placement, not its folder subject's preimage. Generic HEAD roles (role 0), subject ids and tag concepts are different coordinates and each needs its own explicit mapping. The mapping the probe implements is exactly: **FOLDER-role body ⇒ entry name; HEAD bodies stay empty; folder ids and tag concepts are NOT labelled** (open: whether a folder is a subject with its own placement, and how tag concepts are named — see the joined Files gate).
- **[review] Optional preimages do not make accepted Files readable.** Required names must be supplied, or already retained at the admission basis, validated, and exported/imported atomically with the placement. A relayer must not be able to omit them while retaining an otherwise valid signature, and an exact retry cannot backfill a missing label. Neither candidate below satisfies this by itself; both are pricing probes.

## Candidate (a) — shared hash → exact-bytes dictionary (NOT built; separately versioned probe)

**Shape.** One write-once map in the Ledger (or a tiny `LabelStore` in the mandatory set): `labels[keccak256(bytes)] = bytes`, deduplicated by hash, at most `MAX_LABEL` (proposal: 255) bytes, non-empty. Two ways to write it:

- *A1 — carry the preimage on the bind.* Today a BIND action must have an empty `bodies[i]`. Relax: a BIND/UNBIND may carry `bodies[i] = nameBytes`; the Ledger requires `keccak256(bodies[i]) == role` and stores the bytes if `labels[role]` is absent.
- *A2 — a LABEL action kind (7)* with `bodyHashOrRecordId = keccak256(bytes)` and the bytes in `bodies[i]`. One extra Admission row per fresh label.

**[review] What changes.** The Action and EIP-712 *formats* can stay, but changing the Ledger changes its checked code commitment (`coreCodeCommitment`, signed inside every `PublicationIntent`) and, in this lab, the native identity derivation (`realmOrigin = keccak(chainId, codehash)` qualifies every contract principal). So the signature/profile semantics are **not** unchanged: every unsent signature and every contract principal is re-keyed by the change. A1 additionally leaves the bytes *unsigned* (only the hash is), so a relayer can drop them while the signature stays valid — exactly the optional-preimage failure named above. A dictionary probe must therefore be versioned as its own profile and must earn the same readability/import guarantees before its lower storage cost can count.

**Durable facts added.** `labels[hash] → bytes` (framed like record bodies). No Admission row, no evidence change, no list. **[review]** The existing Record body-storage helper (`_storeBody/_loadBody`) is not automatically a safe dictionary namespace: it is keyed by record id inside the Record table; a label map needs its own key domain and its own bounds.

**Slots (ESTIMATED, unpriced).** Fresh label ≤ 32 B: 2 fresh slots; 33–64 B: 3. Reused label: no new storage write on reuse (mechanism only; unpriced). No repricing estimate is adopted here.

**Browser resolution.** `list()` → `items[i].position` → `positionCell(position)` → `(purpose, subject, role)` → `labels(role)` for a FOLDER position. One extra `eth_call` per distinct hash; no index, no logs, no archive node. Verifier: `keccak256(bytes) == role`.

## Candidate (b) — a typed Label Record (BUILT as the conservative probe, unrun)

**Shape.** Register `LABEL = keccak256("lab/type/label/1")` with the lab acceptor `LabelAcceptor` (0 refs; body = exact UTF-8 bytes, 1–255 B, well-formed UTF-8). The client publishes the label as a normal PUBLISH action in the same batch as the placement and uses `role = keccak256(bytes)`; the record id is `keccak256(abi.encode(DOM_RECORD, LABEL, role))`, so a reader derives it from the position's role alone.

**[review] Corrections to the earlier text.**
- A Label Record is per `(Type, exact bytes)`, **not per placement**: every placement named `entry` anywhere resolves to the same Record. Its deterministic id allows direct lookup (`record(recordFromHash(LABEL, role))`) without a by-Type scan.
- "No acceptor" does **not** enforce UTF-8 or a 255-byte cap; the probe therefore registers the Type WITH `LabelAcceptor` and calls the cap and UTF-8 check a **lab convention**, not Files semantics.
- Reuse-by-existence (the `existing-omitted` variant) establishes only that the bytes are retained; it is **not** a new author's acceptance or assertion. Only a PUBLISH by that author is that author's evidence.
- Occurrence withdrawal does **not** erase the retained Record (test: `test_label_fresh_republished_omitted_and_hash_only_retrieval` withdraws Alice's occurrence and reads the bytes again).

**Durable facts added.** One Record row (2 slots + one word) per distinct label, one Admission row per publication of it, the by-Type and by-author appends, and that action's share of the Evidence cell. Labels become authored, typed, withdrawable evidence.

**Ledger changes.** **None.** `IndexModule`: none. `LensReader`: none (the consumer resolves the label itself).

**Measurement rows (scripted, unrun).** Four sealed cells from the same post-setup snapshot, all native author `actorA`, all on the `quote3000` fixture so the create batch matches `native-one/quote/create` in action shape and body sizes:

| cell | create batch | consumer row |
|---|---|---|
| `label/hash-only-create` | today's 4-action create | `JoinedConsumer.readLabel(position)` **reverts** `LabelUnavailable` (failure row, selector retained) |
| `label/create+label-fresh` | the same 4 actions + `PUBLISH LABEL "entry"` | `readLabel` commits to `(position, role, bytes)`; hash check on-chain |
| `label/create+label-existing-republished` | setup: `actorB` publishes `"entry"` first (separate row); then the 5-action batch (occurrence 2) | as above; evidence commits `occurrences == 2` |
| `label/create+label-existing-omitted` | setup as above; then the 4-action batch (no PUBLISH) | as above; evidence commits `occurrences == 1`, first admission = B's |

Pre-absence / pre-presence of the label Record are retained raw replies (`baselineRaw` and stage `pre-presence`), not script assertions. Fresh and reused costs are separate rows; nothing is subtracted.

## What this probe is and is not

- It is a **client-convention filename-retention baseline**: it prices the marginal cost of a *retrievable* exact name on top of the hash-only create, under the existing operations, with the Ledger unchanged.
- It is **not** mandatory Files semantics: nothing forces a name to be present, validated at the admission basis, or carried through export/import. Folder and tag display semantics remain part of the joined Files gate.
- **[review] No slot ratio or reused-name premium is asserted.** Comparing (a) against (b), or fresh against reused, requires equivalent exact names, freshness controls, mandatory validation, import and paid retrieval priced on both sides first. The earlier "~3×" and "≈ nothing per reused label" statements are withdrawn; no speculative gas-repricing estimate is adopted.

## Open points for the design author

- Byte cap (255?) and whether empty / non-UTF-8 labels are rejected at the Realm or only by clients (the probe rejects them in a lab acceptor).
- Whether folder ids are labels of their own subject (a folder is a subject with a placement) or remain opaque ids; how tag concepts are named.
- What makes names *required*: a binding role type demanding a LABEL target, a batch-level rule, or the dictionary; and how export/import carries them atomically.
