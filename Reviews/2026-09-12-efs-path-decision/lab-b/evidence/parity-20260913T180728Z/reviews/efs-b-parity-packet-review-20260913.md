# B parity packet review — 2026-09-13

**Verdict: the retained packet supports the fresh B whole-transaction gas and exact paid-output agreement claims at `RPC_OBSERVED` only. No current-packet discrepancy found.** This is not authenticated chain state, mandatory-failure rollback, portable import, signature-proof completeness, production approval or complete Files qualification.

Reviewed `/tmp/efs-b-parity-paid-20260913.KJ23qU/` packet, audit, launch record, both controller ACK/context pairs and independent observations against the previously frozen independent inputs. No RPC, compiler, Anvil or repository mutation was performed.

## Raw receipt costs independently confirmed

| Operation | Receipt gasUsed |
|---|---:|
| Bootstrap Items/Pair | 921,085 |
| A1 combined create/publish/head/placement/tag | 1,614,408 |
| A2 | 658,950 |
| B1 | 796,542 |
| Point A-first | 167,281 |
| Point B-first | 167,513 |
| List A-first | 269,617 |
| List B-first | 277,278 |

These numbers were decoded directly from retained `eth_getTransactionReceipt` response gasUsed fields, not accepted from candidate summary rows. A1 is not an isolated marginal placement price. The four paid rows are alternate restored branches, not one canonical cumulative bill.

## Independent packet checks

I decoded all 34 signed raw transactions and directly checked data, destination, sender and nonce against retained transaction fields, transaction/receipt hashes and block inclusion. All 17 deployment transactions independently match full frozen constructor initcode, deployer, nonce and receipt address. All four paid signed transaction calldata, caller/destination, zero value, exact return bytes and PaidResult event topics/data match the frozen vectors—including point zero-Placement commitments and list hydrations 1/2.

I separately rechecked both controller ACKs, canonical context/input hashes, frozen arm/controller/neutral pins, unchanged source hashes and exact build context; all passed. Every runtime was compared byte-for-byte at both independent observation stages (34 comparisons). All 18 before-fixture and 79 after-B1 raw checks match their exact or explicitly partial frozen expectations. No mask was added to runtime comparison.

The sealed post-B1 block is 30, hash `0x69dc9fce8124f6c71e6c6f67ebdeac55b9689a02cbc74715538d8bcdac815e7b`. All paid execution blocks are 31 with that parent, timestamp seal+1 and exactly their single transaction at index 0. Four retained successful reverts reference snapshots `0x2` through `0x5`. Both observation-block rechecks match their seals. Source is `c5561e2b27c48ca2938695cce7784f1e78564116`; input SHA remains `31dbc9e1ad5580fa5b5b119ffba1d209299529227feb82bfedeedd9e4caca3d0`.

## Audit limitations / actionable note

**Minor, current packet closed by supplemental checks:** `audit.mjs:27-28` binds decoded signed data/to/nonce to RPC transaction fields but omits direct equality with `t.data/t.to/t.nonce`, which later expected-vector assertions use at lines 37/44. Add those direct equalities before presenting the audit script alone as complete linkage. My independent direct-byte checks above establish them for this actual packet. Likewise, audit line 39 trusts the retained checkpoint without itself revalidating both controller seals/runtime observations; my separate checks establish those here. The three corruption refusals exercise return/log/displayed-gas changes, not every linkage or adversarial RPC case.

Outer transaction signatures do not establish A1/A2 publication-signature recovery or historical contract-authorship portability. No header/state/receipt proof authenticates the RPC transcript; retained partial publication-word checks remain partial. These are material ceilings, not failures of this narrow paid-cost result.

Launch record reports successful local execution 18:07:28–18:07:30 UTC and owned Anvil PID 76613 stopped at 18:07:30.234; root owns fresh process confirmation. Packet SHA256: `4dd219f6e2fa3672eb4e76a75966c8173ede84875a2bd9929bda8b448f7de5db`. Reviewed audit source SHA256: `a78a2cedc5b01c0197f5e55b69330c2a1d477833b43a7efde93534a59bce9ea2`.

## Follow-up — audit linkage note closed

Read the targeted audit change and new `audit2.json`. The main transaction loop now directly requires decoded signed data/destination/nonce to equal metadata. The retained regression mutates setup transaction metadata data to `0x` and requires rejection. Root reports this regression failed against the old audit and passed under Node 26 after the fix; I verified the new source assertion and exact equality of all paid rows, operation costs and 34 signed-transaction results between audit versions. `audit2.json` records four mutation refusals, 34 transactions and 17 deployments; original `audit.json` remains preserved.

The Minor metadata-linkage note is closed. Verdict and all `RPC_OBSERVED`/state-proof/rollback/import limits remain unchanged; independent seal/runtime rechecks remain evidence from this review, not newly claimed audit functionality. Updated audit source SHA256: `80de3986736f31a9540bd8b1aa8ec1e44741b76881a1b96b6a700114079292ee`; `audit2.json` SHA256: `d5247ce5c337c6aad0943416d1770e4088dd0b61acffa1f12c00b3f07f2d4120`.
