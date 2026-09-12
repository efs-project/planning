# Road B — a compact EFS foundation

**Author:** Fable (Claude Fable 5.1, claude-code, role `integration-test-lead`), Claude lane 1. **Written independently** before reading `mud-source-preflight.md`, any Road A/C material or the `efs21` evidence beyond the README §5 headline numbers (5.06M fuller create; 627,672 / 198,745 native). **Status:** independent proposal v0, 2026-09-12; cost centers are ESTIMATED until the shared fixture runs. Nothing here waives an outcome; §5 names every place where the compact design changes a guarantee's *shape* and asks for that to be judged, not assumed.

## 1. Architecture in one paragraph

Keep every durable fact EFS promises and delete the machinery that exists to *predict* or *re-derive* those facts. Three contracts with one responsibility each: a **Ledger** that admits typed, content-addressed records under an authenticated author, runs the Type's mandatory acceptance, and writes the minimum durable set (record, admission, binding head with revision, the required discovery lists, backlinks, history) in one pass with no journal; an **Index module** (separate contract) that owns every optional index with per-index coverage and is attached through a single post-admission hook; and a **Lens reader** (library plus raw slot getters) that resolves paths and lists scopes under an ordered set of trusted principals for both contracts and a static browser. Identity comes from content (record id = hash of type and body) and from position (a File's stable identity is its head binding key), so nothing needs a dry run to know its ids in advance. Two ingress shapes, one evidence shape: a contract or EOA writes natively (`msg.sender` is the author; portability proof is a chain-state witness) or through a signed envelope (relayable; portability proof is the signature). Both land the same admission row, labelled with which proof they carry.

```
             native call (msg.sender)          signed envelope (relayed)
                       \                          /
                        v                        v
  +--------------------- Ledger (ingestion kernel) -----------------------+
  | 1 validate: ids, refs exist+typed, CAS revision, Type acceptance hook |
  | 2 write:    Record | Admission | Binding(head,rev,prev) | Scope list  |
  |             Backlink list | History list                              |
  | 3 emit:     Admitted(author, scope, recordId, admission)             |
  +-----------------------------+----------------------------------------+
                                | post-admission hook (one call)
                    +-----------v-----------+      +--------------------------+
                    | Index module (config, |      | Lens reader (library +   |
                    | coverage, backfill)   |      | extsload-style getters)  |
                    +-----------------------+      +--------------------------+
                                                         ^            ^
                                                  consuming contract   static browser (eth_call only)
```

## 2. What is persisted, and why each fact is there

| durable fact | shape (ESTIMATED slots) | outcome it serves | fuller-model counterpart |
| --- | --- | --- | --- |
| Record: typeId, body, first admission | 3 + body words | portable data identity; dedup by id | RecordRow (same) |
| Admission: author, proof kind, ordinal, basis | 2 | independently checkable authorship; source admission ≠ destination authority | Envelope (10 words) + Admission + Lifecycle + Batch |
| Binding head: target, revision, previous admission | 2 | stable File identity, CAS, rename/move/remove without erasing evidence | BindingRow (2) + kind-8 posting |
| History list per binding (packed 5 per word) | ~0.4 fresh amortized | as-of reads for contracts (bisection), restore | kind 8 |
| Scope list per folder / tag scope (packed) | ~0.4 fresh amortized + rewrite | required discovery: complete listing with a count | kind 10 |
| Backlink list per target (packed) | ~0.4 fresh amortized | "what points at me", tags-on-file across authors, Lens joins | kinds 5/6 |
| Author nonce / Type cell (cache as code) | rewrite / 3 once per Type | replay protection; acceptance | Authority + TypeRow |
| **not persisted:** journal, canonical envelope bytes, per-record occurrence list, ordinal mirrors, by-type/by-author/field/digest lists | — | moved to events + Index module (declared, coverage-reported) | ~90 slots per file today |

A small note or quote create is therefore about **10–14 fresh slots** (ESTIMATED 0.3–0.4M gas with acceptance and both required lists), a rebind about 3–4 slots plus history and scope rewrites (ESTIMATED 0.12–0.2M), against 5.06M and 627,672 respectively in the README. Those are the numbers the shared fixture must confirm or refute; I will not defend them before then.

## 3. API example (illustrative)

```solidity
// producer contract: native authorship, one logical action
bytes32 rec = efs.publish(QUOTE_TYPE, abi.encode(price, block.timestamp));          // content-addressed id
efs.bind(PATH_PURPOSE, keccak256("/swaps/eth-usdc"), rec, expectedRevision);       // CAS; history kept

// unrelated consumer: Lens = [uniswapAddr] (single trusted author), no off-chain approver
(bytes32 rec2, uint32 rev) = lens.resolve([uniswapAddr], PATH_PURPOSE, keccak256("/swaps/eth-usdc"));
(uint256 price,) = abi.decode(efs.body(rec2), (uint256, uint256));
// folder listing from a contract, complete by construction:
(bytes32[] memory entries, uint64 count) = lens.list([communityA, communityB], FOLDER, folderId, 0, 50);
```

```ts
// browser, public RPC, eth_call only
const head = await lens.resolve([a, b], PATH, subject);       // selected among competing heads
const history = await lens.history(a, PATH, subject, {asOf});  // no archive node, no logs
```

Reused: the v2 identity rules (record/envelope/type ids), the Type schema compiler and acceptance semantics, the Lens plan semantics, the type-cache-as-code result, the index-layer lab's coverage/probe machinery (becomes the Index module). Custom: the single-pass ledger (replaces the journal), the native ingress path, the extsload-style getters, the events.

## 4. Strongest objection (and what I concede)

**Portable contract authorship is not solved by any road, including this one.** A native admission carries no signature; its portability proof is a chain-state witness of the source admission, which a destination cannot verify without a proof of the source chain's state. The compact design makes this honest by labelling the proof kind on every admission, but it does not manufacture portability for contract authors. Second objection: removing the journal moves Type acceptance into the write path; a developer hook is untrusted code inside admission. Mitigation is structural (view-only hook, bounded gas, results committed before any write, whole-publication revert), and it is exactly what the discriminating experiment must attack. Third: history-as-a-packed-list keeps as-of reads cheap for contracts but is an always-on cost some Types never need; I keep it because it cannot be backfilled later.

## 5. Guarantee-shape changes to be judged (not waived)

1. "Rebuild the whole store from state alone" becomes "walk admissions from state, or fold events": still possible, slower, and the by-type/by-author/digest lists are declared indexes with coverage, not kernel facts.
2. Envelope canonical bytes are not stored; the signed envelope's hash and the author's proof kind are. Withdrawal-by-author and reference-to-envelope checks use the admission row instead.
3. A File's identity is its head binding key rather than a separate genesis record; charter rules live in the Type and the scope, not in a per-file record. If a per-file charter turns out to be load-bearing (Lens plans per object), it returns as one record, not three.

## 6. The discriminating experiment

Build the Ledger and Lens reader only (no Index module beyond the hook), on a fresh chain, with the matched 32-byte quote and 41-byte binary fixtures. Run the protocol's **authorship × selection matrix** — {native, signed} × {single author, two competing authors under a Lens} — plus: a checked reference that must reject wrong-Type and missing targets through direct, batch and dedup entrypoints; a stale CAS; a failed acceptance that must roll back the whole publication; a folder listing read by a consuming contract; an as-of history read. Report receipts, fresh slots, the paid consumer-read gas, and the interaction term `cost(both) − cost(authorship) − cost(selection) + cost(neither)`.

**Kill conditions.** If "both" lands within ~20% of the fuller model's matched operation, representation is not the saving and Road A should win. If any entrypoint bypasses acceptance or a failed acceptance leaves state, the design is ineligible regardless of gas. If two-author selection cannot be read completely by a contract without an off-chain party, the required-discovery outcome fails.

## 7. Classification

Demonstrated (elsewhere, reused): identities, type cache as code, index coverage/probe semantics, Lens selection semantics. Designed but untested: single-pass ledger, native+signed dual ingress, history/scope/backlink packed lists in this shape, extsload getters. Unsupported by design: contract-author portability without a state witness. Unknown: the actual interaction term; whether the acceptance hook can be view-only for every promised rule.

## What Road B needs from the coordinator

1. The frozen fixture (quote, binary, two authors, reference case) and its independent expected outputs.
2. Agreement that the matrix in §6 is the compact slice for the hour-8 shortlist.
3. A bounded run slot after the shortlist: one Anvil, finite history, run-owned scratch under 2 GB.
4. Codex's position on §5.2 (envelope bytes) before I build it.
