# Rejected-architecture ledger — exact kill criterion per demotion

**DISPOSABLE** · `protocolConformance=false` · `notAdopted=true` · `goCodeAuthorized=false`

| Arm / variant | Disposition | Exact kill criterion fired | Evidence |
|---|---|---|---|
| `EAS_LIKE_CALLBACK` (naive) | **KILLED as portable validation** | "makes portable identity/meaning depend on mutable code"; "callback revert, reentrancy, gas grief" — a reverting or gas-griefing validator kills the consumer's action outright | `effects_results.json`: `callback.naive.revert=ACTION_DEAD`, `callback.naive.gasgrief=OOG_DEAD` |
| `EAS_LIKE_CALLBACK` (guarded: gas-capped, returndata-capped, non-reentrant) | **DEMOTED to Realm/application admission policy only** | "reinterprets historical validity using current code or state" — same record, same call, different answer after the validator mutates | `callback.mutable.reinterpretation=ANSWER_CHANGED`; `address.meaning.mutated=ADDRESS_NOT_MEANING` (vm.etch) — mechanics can be contained, trust cannot |
| `CONSUMER_PREDICATE` (shape-prefix flavor) | **KILLED for effectful consumers** | "lets shape claims self-authorize effects"; "accepts unknown effect-relevant semantics" | `A_PRED.r_act_twin=EFFECT` (gwei twin transfers at wei scale), `A_PRED.r_act_v2_deleg=EFFECT` (hidden delegate authority executed), `N_PRED.r_twin=ACCEPT` (command-execution twin read as note) |
| `CONSUMER_PREDICATE` (exact-shape flavor) | **DEMOTED: it is EXACT in disguise** | no self-authorization, but it rejects every compatible future Type (`N_PRED` rejects NOTE_1_1/1_2 wholesale) and round-1 showed two reasonable generated implementations disagree on extension acceptance until the exact shape is pinned — at which point the predicate has re-derived the TypeId pin | `failure-corpus/round1_triage.md` cluster B |
| `SEMANTIC_VIEW` with issuer-key gate (`*_SEMISS`) for **effectful** consumers | **DEMOTED to explicit opt-in, never default** | "widened authority": binding acceptance reduces to a long-lived key; a stolen issuer key authorizes a same-shape wrong-meaning twin into a real effect | `A_SEMISS.r_act_twin=EFFECT`, `N_SEMISS.r_twin=ACCEPT` (indistinguishable from legitimate issuer signature by construction) |
| `SEMANTIC_VIEW` with **no** gate (caller-supplied binding, `N_SEMOPEN`) | **KILLED** | "lets the caller select the policy that authorizes the caller" | `N_SEMOPEN.r_twin.forge=ACCEPT` (exactConstant author forgery projects successfully) |
| Address-keyed validator meaning | **KILLED** | "portable identity depends on an address" | `address.meaning.mutated=ADDRESS_NOT_MEANING` while `address.identity.stable=IDENTITY_UNCHANGED` |

Survivors (for the next experiment): `EXACT`, `FINITE_SET` (effectful default);
`SEMANTIC_VIEW` **consumer-pinned at deploy** (`*_SEMPIN` — zero attack
acceptances, equals FINITE_SET's trust model with shared decoders);
`SEMANTIC_VIEW` issuer-gated for **inert read/route/display only**; archive/
router (`ARCH`) with unconditional raw retention; guarded-callback *pattern* as
Realm-local policy where receipts bind the policy/code basis.
