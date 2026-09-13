# SDK shortlist: hide choreography, not missing evidence

September 13, 2026 · coordinator intake of SDK PM's source-only review;
not a working SDK, adopted API or new benchmark

The SDK PM reviewed planning `786849d`, B `c5561e2` and C `2ca7349`.
Both candidates expose enough atomic primitives to build a much friendlier
write API. Neither already supplies an elegant, lossless SDK. Most awkwardness
belongs in generated adapters and a small action runtime, but missing required
query or portable-evidence semantics cannot be repaired by presentation.

## Three actionable boundaries

1. **Build one logical operation, not hand-written Action arrays.** Both raw
   ABIs require kind-dependent tuples, aligned bodies and exact identifiers.
   Generate operation-specific builders, hashes, preflight and typed error
   decoding. Preserve an atomic publish-plus-CAS batch; B's separate convenience
   publish/bind calls are not the same operation. Journal the exact plan before
   broadcasting and reconcile actual effects afterward. A lost response remains
   `BROADCAST_UNKNOWN`; an already-admitted/retry error is not proof that all
   intended effects happened. The raw ABI remains an escape hatch.
2. **Return values with the qualifications needed to use them.** Generate
   reader/ledger/index binding, checked Type/reference closure and opaque
   cursors. Preserve positive rows under PARTIAL rather than replacing them
   with an empty list. Presence, support, admission, authorship, selection,
   coverage and raw evidence must not collapse into a single success Boolean.
   An adapter can combine existing facts; it cannot invent authoritative
   completeness. The [[required-index-gap-20260913|required reverse queries]]
   need an actual index/query implementation and its cost, not SDK cosmetics.
3. **Preserve the real contract author.** Native ingress derives authorship
   from the Ledger caller. A normally called deployed writer would become
   that author. Prefer internal Solidity builders compiled into the consuming
   contract, which calls Ledger directly; deployed read helpers do not have
   this write-authorship problem. Neither candidate's generator can create
   historical native-contract proof or the missing
   [[portable-evidence-next-gate|portable-evidence admission route]]. Those
   remain Core/proof-profile work, not a promise of code generation.

## Coordinator clarification: browser and contract reads differ

A browser can explicitly request one available block-hash/state across its
calls. A Solidity contract executing later cannot select that historical EVM
state by passing an old block hash into an adapter. Paid multi-transaction
pagination therefore needs historical reduction, or strict basis rechecks and
discard/restart semantics; B's raw `mutated` flag is insufficient. See the
[[files-shortlist-review-20260913|independent Files clarification]]. Reader
generation must preserve this distinction. RPC-observed consistency still is
not an authenticated state proof.

## Small next SDK experiment

Implement one candidate-bound `planUpdate -> authorize/submit -> reconcile`
journey, plus one internal Solidity writer/direct Ledger call and qualified
consumer read. Exercise a lost response and intervening competing head. Judge
it by correct identity, authorization count and effects, not the chosen method
names. There is no tracked B TypeScript package yet; current snippets are
pseudocode, not shipped SDK compatibility.

Primary surfaces: B `src/Ledger.sol`, `src/LensReader.sol`, `script/measure.mjs`;
C `src/EfsTypes.sol`, `src/Ledger.sol`, `src/Consumer.sol` and
`test/MeasurementConsumer.sol`, beneath each pinned lab root. C's simple
consumer validates far less than its stronger paid measurement consumer;
the simple example is not the SDK contract to copy.

Original scratch report SHA256:
`b77cc149b67304dfc5340dc6808a1d0d359b9faa65baed4b71348d30890434ff`.
This is an edited integration with relative source references and the
coordinator clarification, not a byte-identical copy. No builds, RPC or chain
runs were part of the PM review. Owner approval of the SDK PM's separate
MCP/OpenAPI proposal is unaffected.
