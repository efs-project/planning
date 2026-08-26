# Pre-registered hypotheses, comparator semantics, and kill criteria
Sealed BEFORE reading any prior lab or writing any fixture/oracle/SUT code.

**DISPOSABLE** · `protocolConformance=false` · `notAdopted=true` · `goCodeAuthorized=false`

Result vocabulary (only): `SUPPORTED_FOR_NEXT_EXPERIMENT` · `FALSIFIED` ·
`INCONCLUSIVE` · `BLOCKED_BY_CORE_INPUT`.

## Mission hypotheses (verbatim targets to falsify)

- **H1** — Exact immutable Types and Records preserve historical interpretation.
- **H2** — Carefully bounded semantic Views can let inert immutable consumers
  understand compatible future Types.
- **H3** — Effectful, financial, authority-bearing, and game-transition
  consumers should remain exact or use a finite audited Type set by default.
- **H4** — Portable intrinsic validation, Realm admission, current
  effectiveness, and Lens/consumer acceptance remain separate results.
- **H5** — Application Types plus Realm/System behavior support notes, media,
  games, scientific data, and hyperstructures without application-specific
  Core nouns or arbitrary callbacks inside portable Type validity.

## Pre-registered expectations (what I predict before running anything)

- E-H1: PASS. An admitted Record's bytes, TypeId, and acceptance verdict under
  a frozen consumer never change across later Type revisions, Realm policy
  changes, or validator-host changes. Falsifier: any fixture where historical
  verdict depends on current code/state.
- E-H2: **Split verdict predicted.** The SEMANTIC_VIEW mechanism is safe
  exactly insofar as the ViewBinding acceptance rule is (a) consumer-pinned at
  deploy (collapses to FINITE_SET with cheaper decoders), or (b) gated on a
  long-lived issuer key (safe against twins, but widens authority to that key
  for the consumer's whole life — key compromise ⇒ arbitrary future
  acceptance). Prediction: SUPPORTED for inert read/route/archive consumers;
  FALSIFIED as a *default* for effectful consumers via the widened-authority
  kill criterion, not via a decode bug.
- E-H3: PASS. EXACT and FINITE_SET reject every mandatory attack; their cost
  is enumerating revisions (bounded, auditable).
- E-H4: PASS. Demonstrated by two-Realm split receipts, admitted-but-withdrawn,
  and Type-valid-but-Realm-denied fixtures.
- E-H5: PASS for the corpus; EAS_LIKE_CALLBACK (negative control) predicted to
  fire ≥3 kill criteria (historical reinterpretation under code change, gas/
  returndata grief, address-is-not-meaning) and survive only as Realm-local
  admission policy.
- E-PRED: CONSUMER_PREDICATE predicted cheapest in gas and FALSIFIED against
  same-shape/different-meaning twins unless it also pins TypeId/meaning — in
  which case it *is* EXACT with a generated decoder. Predicted verdict:
  "generated predicate = implementation detail of EXACT/FINITE_SET, not a
  distinct trust mode."

## Comparator arms — pre-registered acceptance semantics
This prose is the single shared spec for oracle and SUT. All IDs fixture-local.

Common substrate: Record body = envelope `abi.encode(uint16 codecVersion,
bytes payload)`; codec 0 payload = `ABI_TUPLE_V0` ascending-fieldKey tuple;
canonical = decode + byte-identical re-encode; `TypeId =
keccak256(abi.encode(DOM_TYPE, meaningHash, schemaHash))` with
`DOM_TYPE = keccak256("EFSLAB/TOURN-2026-08-26/TYPE")` (fixture-local).
`SemanticSpecId = keccak256(abi.encode(DOM_SEM, meaningHash))`,
`ViewBindingId = keccak256(abi.encode(DOM_BIND, semanticSpecId, targetTypeId,
mappingBytesHash))`. Every arm decodes canonically first; a non-canonical or
malformed body is rejected by all arms (`STRUCTURAL_INVALID`).

1. **EXACT** — accept iff `typeId == PINNED_TYPE_ID` and canonical decode of
   the pinned tuple succeeds and pinned semantic checks pass (amount ≤ cap,
   slot codes known, etc.). Anything else: reject.
2. **FINITE_SET** — immutable set {v1.0, v1.1} of exact TypeIds, each with its
   own frozen adapter to the internal action struct (v1.1's extra optional
   inert field is decoded and ignored for effects but preserved for raw
   retention). Not-in-set: reject.
3. **SEMANTIC_VIEW** — consumer pins `SemanticSpecId` + a closed mapping
   verifier. A candidate `(typeId, mappingBytes, authorization)` is accepted
   iff the binding commits to the *pinned* SemanticSpecId and the *presented*
   typeId, the mapping is structurally within the closed verifier (field
   extraction + `exactConstant` only, no code), and the binding authorization
   passes the **pin-or-issuer rule**: `ViewBindingId ∈ deploy-frozen pin set`
   OR signed by the deploy-pinned issuer key. Two sub-arms measured:
   `SEMANTIC_VIEW_PINNED` (pin set only) and `SEMANTIC_VIEW_ISSUER` (issuer
   signature allowed). Acceptance authorizes decoding/projection ONLY — the
   effectful consumer still independently checks issuer/authority for the
   action itself.
4. **CONSUMER_PREDICATE** — deploy-frozen straight-line predicate over the
   canonical decoded tuple positions (no typeId pin): shape check + value
   bounds + fixed recipient/slot constants. Accepts any Type whose body
   satisfies it.
5. **EAS_LIKE_CALLBACK** — consumer calls an external validator address
   (`validator.validate(typeId, body)`), trusting its boolean. Negative
   control; also evaluated as Realm-admission policy (where mutability is
   honest because receipts bind the policy/code basis).

## Four separate results (H4 vocabulary)

`portableTypeValidity` (intrinsic, Realm-free) · `realmAdmission` (per-Realm
receipt: realmId, policy revision, state basis, result) · `currentEffect`
(admitted-but-withdrawn/superseded is a *current* fold, never retroactive) ·
`consumerAcceptance` (per-arm above). A fixture passes H4 only if the four can
differ independently and no arm collapses two of them.

## Integrated fixture corpus (one graph)

Notes: Note1.0 / Note1.1 (+optional inert) / Note1.2 (+required
processing-critical) / Note2.0 (meaning+shape break, explicit bridge) /
hostile same-shape twin / unknown codec 1 / cross-version reply + hostile
backlink / empty PARTIAL history page. RPG: ItemDef+revision, ItemInstance,
Inventory, Shirt/Pants/Affix/RaceClass restrictions, EquipState CAS, Equip
intent, QuestReward, RulesetRelease; equip-vs-treasury shared action model;
grandfathering; opt-in migration receipt; ruleset change w/o rewriting items;
forced disable = current-effect only; failed atomic equip; dropped response.
Science: Distance(meters) vs Duration(seconds) same-shape pair. Realms: A
admits / B denies same Record; same logic at two addresses; different logic at
one address (vm.etch) — address never defines meaning.

## Mandatory attack classes → all arms
same-shape-different-meaning; optional/required unknown fields; unknown
variant/codec; retired-key reuse; duplicate/reordered/trailing/malformed/
absent-vs-zero; wrong exact ref target; dishonest View + exactConstant forge;
attacker family/successor claim; beneficiary-supplied policy; Type-valid-but-
Realm-denied; admitted-but-withdrawn; Lens UNKNOWN fall-through; mixed basis +
empty PARTIAL; publisher/catalog disappearance (offline re-derivation);
mutable callback dep; callback revert/reentrancy/gas-grief/returndata-bomb/
recursion; failed leaf in atomic action; channel loss after submission.

## Kill criteria (arm-level, from the mission — applied mechanically)
Self-authorizing shape/family/View claims; caller-selected authorizing policy;
identity depending on Realm/address/time/mutable code; conforming-environment
disagreement; historical reinterpretation; dropped unknown bytes; accepted
unknown effect-relevant semantics; attacker-shaped open traversal/unbounded
work; unavailable→invalid/absent/success coercion; app-specific Core noun;
non-reconstructible after host disappearance; manual canonical bytes for
ordinary developers.

## Stop conditions and scope guards

- Corpus ≤ ~100 cases; no generic validator VM; no rerun of the 50-year sim.
- Any oracle/SUT disagreement: preserve the minimized failing case + seed in
  `RESULTS/failure-corpus/` BEFORE any fix; triage as ORACLE_BUG / SUT_BUG /
  GENUINE_FINDING.
- Safety failures dominate gas/ergonomics; no averaging over a fatal case.
- If forge/solc 0.8.30 unavailable offline → record `BLOCKED_BY_CORE_INPUT`
  is wrong word — record `INCONCLUSIVE(toolchain)` and fall back to 0.8.2x.
- Stretch EVO-100 only after the full core report exists.
