# Road A — retain the meaning, compact the persistence

**Status:** done — independent source proposal, not implementation/adoption. **2026-09-12**, Codex `warroom-road-a`. Planning/main `2552962`, initially clean; source inspected with `git show ebc7d540570827c5f5052af83d2cbd80f54092a7`. No builds, chains, commits or code edits; stopped `f873890` untouched.

## Recommendation and architecture

Test **packed rows and inline posting lists**. Retain Types/Record IDs, independent Files facts, history, every query family, CAS and withdrawal. Start with unchanged interfaces; a later compound-action capsule can reconstruct seven facts without today's separate rows. Seven is not sacred; merging independent authority/history is not compression.

```text
one authored action → authentication + mandatory acceptance → ingestion
                                                         ├─ shared immutable bytes
                                                         ├─ packed admission/authority facts
                                                         └─ mandatory query maintenance → Lens/Files reads
```

Reuse `Preparation`, codecs, `BindingFold`, Lenses and independent reader. Custom: packed storage/accessors, posting codec and qualification. Ingestion and query maintenance remain distinct; the eventual separate query contract is not itself the saving. Optional indexes retain explicit coverage.

Illustrative app surface: `files.create({parent, name, type, value, lens, ifRevision})`; Solidity consumes `readFile(fileId, lens, basis)`. Neither application coordinates seven publications.

## What one existing create actually persists

The SDK's `planOperation(createFile)` emits:

| Facts | Why retained / physical treatment |
|---|---|
| ObjectGenesis; charter Binding | Stable File identity/publisher/salt/meaning; independently selected charter. Share context, preserve distinction. |
| ChunkTree; FileRevision; head Binding | Size/chunk/root commitment; File→content/media/parent-revision relation; author's selected revision. Payload staging is separate. |
| DirectoryEntry; name Binding | Parent/name→File relation and author's selection. Rename/whiteout cannot erase history or expose hidden entries. |
| Seven Record cells + ordinal mirrors | Type, byte reference, Record ordinal, first admission; unique-Record enumeration. Three words/cell; already shared immutable bytes. |
| Envelope cell + ordinal mirror | Unsigned header, committed Record-ID vector, code location, ordinal. The committed vector is not the inventory mirror. |
| Seven Admission rows; seven lifecycle rows | Envelope/leaf/type/principal linkage; ACTIVE/withdrawn state, admission order and withdrawal order. Partial admission, duplicate Records and later withdrawal require occurrence-specific state. |
| Three Binding heads + key mirrors | Charter/head/name state, target, revision and source occurrence; CAS and plural-author selection. |
| Posting heads, ordinal words, key mirrors | Families 1–10: type occurrences/unique Records, Record occurrences, principal, general/typed references, scalar/digest, Binding history/scope. Preserve queries and empty-history inventories. |
| Batch, counts, authority, carrier | Batch first/count/block/revision/authority basis/codehash; high waters; principal nonce/registration; chunk bytes/tree status. Types/cache code, bootstrap and execution configuration are amortized setup. |

**Journal correction:** `StateKernel.put` already applies immediately with EVM rollback; no journal/replay remains. Counts commit last; future callbacks can observe provisional rows. Acceptance/index integration needs an explicit observation policy.

## Largest actionable cuts, and honest quantities

1. **Inline two posting ordinals.** Current head uses 64-bit count/live fields although both are guarded below 2⁴⁸. Repack `count48 | live48 | last48 | flags16 | firstOrdinal48 | secondOrdinal48`; spill remaining entries five per word. Keep all families, mirrors, ordering and lifecycle transitions. Public logical heads/words can be reconstructed; changed physical slots must be authenticated.
2. **Record three→two words.** Put the Type ordinal in the byte reference's reserved 48 bits; derive TypeId through the retained Type inventory. Mask metadata before `ImmutableByteView.length`, whose existing reserved-bit check must remain meaningful. Preserve Record/first-admission ordinals.
3. **Admission two→one word.** Replace repeated EnvelopeId with its guarded 48-bit ordinal alongside existing leaf16/type48/principal48 metadata: 160 bits total. Resolve the ID through the retained Envelope inventory and verify the reverse link.

Retained `body-copy-candidate.json.gz` gives create admissions **73–79**, records **68→75**, posting keys **219→241**. Decoding its append-only ordinal words gives **36 touched keys**, **22 fresh keys**. Applying the proposed list formula to that exact history yields **27→5 newly allocated posting words**; rows add **7+7** fewer words: **36 fewer new words / 1,152 state bytes**, an **estimate from retained logical evidence**, not a receipt saving. The control receipt is **4,914,763 + 149,369 staging = 5,064,132 gas**. No current opcode census supports an exact gas pie chart.

Further hypotheses: immutable descriptor/inventory pages replacing mirrors; per-Envelope lifecycle pages; shared authority context per account/rule epoch. Price bounded reads, partial admission and reconstruction. No family-3 history or mirror disappears without replacement. Authentication already uses one signature/action. U3's chain/Core-bound EOA signature/first-come account claim does **not** demonstrate portable authorship, contract authors or historical validity. Mandatory programmable acceptance is also unjoined: additional costs, not fuller-model advantages.

## One decisive paired experiment

Compare `ebc7d54` with the three packed-layout changes above, identical semantic inputs and module topology. No family removal. Freeze twelve rows: complete setup; 41-byte create including staging; fresh edit; second-author conflict plus two Lens reads; tag plus required query; rename/remove/restore lifecycle; partial→mixed admission; reused-Record new occurrence; exact retry; first-anchor withdrawal plus revival; paid point/list/history reads; reached late CAS/reference/index failure. Exercise posting lengths **0/1/2/3/5/6/7**, 1,000 live entries and 10,000 lifetime-name churn; report unsupported scale instead of changing caps.

Retain every transaction/receipt (including failures), full source/runtime/configuration pins, decoded pre/post counts and postings, new words/code bytes, paid consuming-contract returns/gas, and same-basis clean-browser RPC/bytes. Expect successful receipts for valid operations and status-0 receipts for reached intentional failures; gas is unknown until measured. Independently reconstruct IDs, ordinals, all ten families, CAS, hidden-name behavior and historical values; verify nonce/rows/postings/helper-CREATE rollback. Exact retry creates no new admissions, although renewed local authorization may advance its nonce. Reject ordinal aliases, corrupt metadata and cross-principal withdrawal. Missing-carrier results remain unavailable, never empty. The full mission additionally requires the same graph's portable export/import, genuine contract author and mandatory acceptance through direct/batch/import/dedup; this storage pair alone cannot confer finalist eligibility.

Source changes would concentrate in `2026-09-05-c0-core/src/{StateStore,StateKernel,StateReadPrimitives,StatePointReads,StateBindingReads,StateAuditPages,ImmutableByteView}.sol`, raw adapters and independent `reference/state-reader.mjs`; qualify Foundation/AuthorityUpgrade dependencies and adapt the existing `body-copy` runner/reader fixtures. Preserve historical evidence files. Strongest objection: saved writes may merely purchase extra authenticated reads and codec complexity. Select using measured read-heavy/write-heavy/churn mixes, not write gas alone.

**Typed read facet:** enabling work only. The actual control already fits: U3 **24,141**, Admission **22,392** bytes. The stopped extraction's **24,761** does not block an in-place packing comparison. Check the candidate's complete normal-limit graph first; if it needs decomposition, use the reviewed facet boundary in **both** arms and charge setup/routing. Do not require the entire facet→unchanged-store→extraction sequence before testing persistence, or advertise module separation as the overhead answer.

Evidence: [[../2026-09-11-efs21-overnight]], [[../2026-09-12-efs21-modular-deployment]]; pinned `Reviews/2026-09-11-efs21-pragmatic/{body-copy-results.md,evidence/body-copy-candidate.json.gz}`, `StateKernel`, `StateStore`, `IndexKeys`, `sdk/files-actions.mjs` and `contracts/src/AuthorityUpgrade.sol` under the fuller source above. No new performance result is claimed.
