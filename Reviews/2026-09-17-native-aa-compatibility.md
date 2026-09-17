# Ethereum and Base account compatibility — bounded EFS review

**Status:** SDK and client/OS reviews integrated. Proposed support posture,
not an adopted wallet policy or verified Ethereum/Base deployment matrix.
**Coordinator:** @v2-pm · September 17, 2026.
**Scope:** planning only. No new prototype work, wallet selection, deployment,
protocol freeze or revival of the old KEL topology.

James's request, relayed by Ethereum PM: Ethereum first; Base is an important L2.
Keep prototype delivery moving while checking smart-wallet and key-continuity
compatibility. This is one support review, not three architecture redesigns.

## Owners and return contract

| Lane | Owner | Deliverable |
|---|---|---|
| Account/signature/submission adapters | @sdk-pm, **EFS v2 SDK PM** | Correct the matrix against current SDK designs and prototype evidence; identify exact version pins and the smallest useful adapter test. |
| Wallet, session, recovery and escape UX | @web-client-os-pm, **EFS Web Client / OS PM** | Check capabilities, approvals, failure disclosure, guest access and fallback; identify one user-visible decision if needed. |
| Author identity, authority history and synthesis | @v2-pm, **EFS v2 PM** | Preserve current authority boundaries, compare key-continuity claims, integrate replies and surface genuine owner choices. |
| Continuing standards/source watch and Devcon opinion research | **Ethereum PM** | Track changed drafts, implementation/deployment evidence and strongest arguments; own source corrections and the ongoing watch. |

Specialists return concise read-only feedback here through the coordinator. No
parallel edits to this shared note, new worker tree, Fable requests or code changes.
Cap the first response at roughly one page; unverified deployment support stays
unverified. Send acceptance is not completed review. No new recurring task.

## Evidence and authority

Intake: Ethereum PM's [native-AA handoff](../../../Ethereum/intelligence/research/2026-09-17-native-aa-efs-devcon.md)
and [EIL review](../../../Ethereum/intelligence/research/2026-09-17-eil-status.md).
Their social-source analysis is attributed prior research, not a new social sweep
by EFS. Derek Chiang's [September 14 account](https://x.com/decentrek/status/2099490351337902392)
and Lukas's [Base response](https://x.com/0xlsr/status/2099571105799258362) do not prove
permanent incompatibility, an activated fork or delivered keystore-on-Frames support.

EFS PM reopened [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130) and
[EIP-8141](https://eips.ethereum.org/EIPS/eip-8141) on September 17. Both are Draft.
8130 distinguishes permissive L1 authentication from its canonical-only L2 native
transaction path; other authenticators remain usable through EVM/4337 paths.
8141 proposes programmable validation/payment/execution frames. These observations
do not establish current Ethereum or Base activation or wallet support.

Authority comes from [[../Designs/efsv2/owner-rulings#2026-08-12]], the
[[../Designs/efsv2/owner-decision-inbox#Superseded questions — never revive silently|superseded-mechanism register]],
and the current [[../Designs/efsv2/core-architecture-candidate#Principal|Principal candidate]].
The historical fixed authority-home/KEL mechanism is not inherited. Account
Principals, historical attribution, rotation/recovery/delegation extension paths
and standalone Realms remain relevant. An 8130 keystore is not an EFS KEL.
Existing [[../Designs/web-client-os/ethereum-standards-and-interop|client standards work]]
and [[../Designs/sdkv2/ethereum-standards-census|SDK census]] are inputs, not proof
that an adapter is shipped.

## Provisional matrix — disposition, not supported-network claims

**Needed now** means preserve/check the MVP obligation. **Adapter boundary** means
retain an extension seam without requiring that adapter for launch. **Watch**
requires new evidence before implementation. **Not needed** means not an MVP
dependency, not permanently forbidden. Chain deployment evidence is independently
required for every support claim.

| Capability / concern | Ethereum | Base | Owner / evidence required |
|---|---|---|---|
| EOA and local contract-account author validation | Needed now | Needed now | Core + SDK: distinguish signer, account, Principal, submitter and payer; pin verifier/account realization and historical basis. Do not infer authority from code presence under 7702. |
| Key rotation, recovery, compromised old key | Needed now: define truthful limits; adapter boundary for managed identity | Same; do not assume synchronized policy | Core: old authorship must survive without treating today's account policy as past authorization. Lost-key recovery and compromise cannot be claimed from a stable address alone. |
| EFS nonce/domain/expiry and stale-plan protection | Needed now | Needed now | SDK + Core: EFS authorization versus transaction/UserOp/delegation authorization remain separate; test cross-Realm replay and policy changes before execution. |
| Provider drift, delegation awareness and approval accounting | Needed now | Needed now | Client: fence provider/account/chain changes; recognize7702 code without silently upgrading or assuming1271 authority; count setup, routine and revocation ceremonies separately. Unsupported profiles stay explicit. |
| 4337 account submission / 7562 bundler rules | Adapter boundary | Adapter boundary | SDK: pin account, EntryPoint version/address/code and bundler-policy compatibility separately. The reviewed Base Account source uses EntryPoint0.6; that is not interchangeable with the reviewed v0.8 reference. |
| 5792 wallet calls / sponsorship | Adapter boundary | Adapter boundary | SDK + client: negotiate actual wallet RPC versions and capability results separately from4337/paymaster support. Batch status is not EFS effect success; partial batches need per-effect read-back. |
| 7702, 6492, 7913, modular/session permissions | Adapter boundary, enable only tested profiles | Same; verify actual chain/wallet support | SDK + client: bounded validation, exact delegation code, scope/budget/expiry/revocation and no hidden persistent setup during signature verification. No implement-all mandate. |
| 8130 native transaction / keystore | Watch; no activation claim | Watch priority; Base plan is not activation evidence | Ethereum PM + SDK: exact draft/client/account/keystore commits, chain activation and measured fallback required. Native authenticator restrictions are not a ban on arbitrary EVM wallet logic. |
| 8141 native frames | Watch | Watch interoperability, no support assumption | Ethereum PM + SDK: exact draft/client revision, validation/payment rollback boundaries and any working keystore adapter. Do not import older forum atomicity descriptions as current rules. |
| Vendor/bundler/paymaster disappears | Needed now: baseline direct path; adapter-specific escape | Same plus Base inclusion assumptions | Client + SDK: guest reads remain available; sponsor loss does not fabricate successful writes. Distinguish user-funded/account escape from reverting to a different EFS author. |
| Cross-chain identity/policy disagreement | Needed now: explicit chain/basis | Needed now: independent chain/basis | Core: same address or keystore label does not prove same current policy, recovery state or historical authorization. No global “current key” without evidence. |
| EIL funding from another chain | Not needed for MVP; optional adapter boundary | Same | SDK + client: funding/submission only. No shared authority or atomic cross-chain EFS-write claim. |

## SDK review — September 17

Keep author/Principal, controller/verifier, signer/key, account sender,7702
authority/delegate, transaction sender, relayer/bundler and payer/sponsor as
separate roles. Roles may legitimately coincide; do not collapse their evidence
or require artificial different actors in every profile. Inclusion is distinct
from canonical EFS effect success.

Realm-bound action authorization retains its own domain, exact consumer/release,
effects, nonce namespace, expiry and basis. A4337 `userOpHash` and7702 delegation
authorization are separate commitments, not substitutes for that authorization.
This does not make portable Record identity or every publication envelope
chain-bound. A7702 outer revert can leave delegation changed: reread delegation
state before retrying. Sponsorship evidence is neither authority nor effect proof.

Source pins reported by SDK PM (not deployed-chain verification):

| Artifact | Pin / finding | Qualification |
|---|---|---|
| Ethereum ERC corpus | `5fc191d6d4da12ee224813871f94ff16e541e3f7`;1271/4337/6492/7913 Final,7562 Review | PM independently rechecked [7562 Review](https://eips.ethereum.org/EIPS/eip-7562); current SDK/client census wording corrected. Status is not implementation support. |
| Ethereum EIP corpus | `2c2da76671d77e7d2f5060b23f8a92cb5d62897e`;5792/7702 Final,8130/8141 Draft | Account, wallet and chain activation need their own evidence. |
| [Account abstraction v0.8.0](https://github.com/eth-infinitism/account-abstraction/tree/4cbc06072cdc19fd60f285c5997f4f7f57a588de) | EntryPoint implementation commit `4cbc06072cdc19fd60f285c5997f4f7f57a588de`; Ethereum metadata names `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108` | Metadata not a current RPC codehash check, Base deployment or wallet result. |
| [Account abstraction v0.9.0](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.9.0) | Client review pin `b36a1ed52ae00da6f8a4c8d50181e2877e4fa410`; release also checked by PM | v0.8 above is a comparison pin, not a latest-release claim. Upstream reports ABI compatibility with0.7/0.8, but new bundler behavior and exact deployment/code still require verification. |
| [Base Account constructor](https://github.com/base/account-sdk/blob/97ca29c7302d223baa428262d460ae5448839f95/packages/account-sdk/src/sign/base-account/utils/createSmartAccount.ts) | `97ca29c7302d223baa428262d460ae5448839f95`, [package](https://github.com/base/account-sdk/blob/97ca29c7302d223baa428262d460ae5448839f95/packages/account-sdk/package.json) `@base-org/account`2.5.10; smart-account constructor selects EntryPoint0.6;5792 methods exposed | PM independently read pinned package and constructor. Source capability only: exact deployed account/EntryPoint, wallet methods, independent submission, sponsorship and Base7702 remain unverified. |

The important result is not “Base incompatible.” It is **pin the account/wallet
and EntryPoint independently**, and test the combination rather than advertising
generic4337 or smart-wallet support. No new SDK enum, adapter or Core code is
introduced by this review.

## Client/OS review — September 17

Guest reads and export stay wallet-free. Explicit connection fences the selected
provider, account and chain; drift invalidates the plan rather than editing a
signed request in place.5792 capability discovery is relevant only on a selected
wallet path, not guest boot and not a requirement that every wallet implement it.

**Approval truth:** one `wallet_sendCalls` request is not necessarily one human
approval. A wallet advertising `atomic: ready` can still require an account-upgrade
ceremony. Measure first setup, routine writes, revocation and full first use
separately.8141's `APPROVE` instruction is not a human ceremony. Primary references:
[5792](https://eips.ethereum.org/EIPS/eip-5792),
[7702](https://eips.ethereum.org/EIPS/eip-7702), and the
[Isthmus7702 execution profile](https://specs.optimism.io/protocol/isthmus/overview.html).
The client review identifies existing Ethereum/Base7702 activation; this does not
establish a chosen wallet's support or authorize EFS to initiate delegation.

**Recovery copy:** “Base: controller B at basis X. Ethereum: controller A at basis
Y [or UNKNOWN]. This change is not synchronized; this action uses Base policy.”
Offer continuing on Base, inspecting Ethereum, or updating Ethereum separately.
Never say “recovered everywhere” from one chain's result. Retained historical
authorization evidence keeps its actual source/proof grade, not an unconditional
cryptographic guarantee for arbitrary account dependency state.

**Failure copy:** “Delegation changed; file write failed/unknown” is a valid7702
outcome. A wallet, UserOperation or sponsor receipt does not mark EFS effects
committed. Read back each expected effect; a lost/partial batch remains qualified.
Independent self-funded submission may require a new paymaster-empty UserOperation,
deposit/funding and re-signing, not blindly rebroadcasting a sponsor-bound payload.
Do not change the EFS author or bypass quorum/recovery policy to manufacture an
escape. If the exact profile has no tested route, show “submission unavailable”
and retain/export the plan while guest reads remain usable.

Client-supplied Base8453 observations found nonempty code at the canonical0.7/0.8/0.9
EntryPoint addresses. For0.9 (`0x433709009B8330FDa32311DF1C2AFA402eD8D009`), the
reported runtime is22,425bytes with locally computed keccak
`0x826b7ec542db9f3345234a25c2a6330a61f99483dedb6e6709928cc97e4e4d5d`.
No block number/hash or independent audit-pinned runtime comparison was retained;
0.7/0.8 runtime hashes were not retained. These remain attributed RPC observations,
not verified deployment versions/support. Its8130 experimental-source pin is
[`812317be00d6829e217e0cc92f75be362fde0711`](https://github.com/base/eip-8130/commit/812317be00d6829e217e0cc92f75be362fde0711);
reported future fork gates, WIP code and an isolated development network do not
prove Base mainnet/Sepolia activation. Ethereum PM retains activation/audit watch.

## Minimum useful test — proposed, not newly authorized implementation

### Existing Core evidence to reuse

At prototype source `517d33598a03d32461157ba85095950c44b9d961`, source inspection
confirms `lab-b/test/Guarded1271.t.sol` retains the rotation, nonce-race, validation
failure and wallet-upgrade checks last changed at
`7e2b5bfda859ca8994c95c5102a920d871d59f6c`. The controller-rotation check admits A's
signature, rotates to B, rejects A's stale signed write and retains the original
signature bytes. It does **not** itself demonstrate B's successful subsequent
write, lost-key recovery or cross-chain synchronization.

The [[2026-09-12-efs-path-decision/core-closeout-results-20260915#Deployed-wallet authority reviewed — September16|retained wallet-authority report]]
pins paid source `9941d3b` and its earlier local validation results. Its bounded
deployed-1271 profile excludes undeployed/6492 and delegated-key accounts. Source-off
retention is not universal historical verification: arbitrary wallet dependency
state and source consensus proof remain distinct. This routing pass inspected
source/reports; it did not rerun or extend those experiments. Existing EOA/deployed
wallet evidence is not native8130/8141, EntryPoint or live Base compatibility.

### Staged integration packet

Reuse a tiny Files workflow and one **version-pinned smart account** rather than
building native-AA infrastructure. Run equivalent independent scenarios for the
Ethereum and Base execution profiles actually available; label local/forked runs
separately from public-network observations. The smallest first step is direct
deployed1271 rotation plus a successful B-controlled, user-funded continuation.
Then add one pinned submission adapter and its failure/escape vector.5792 batching,
4337 submission and sponsorship are independent layers; combining all three is a
later integration step, not a prerequisite for the first continuity result.

1. Create a small file, record author/signer/payer, exact signatures/domains,
   consumed nonces and account/verifier implementation. Verify name, revision and
   bytes independently through EFS reads.
2. Rotate control A → B; verify the account Principal is unchanged where that
   profile promises it, old attribution remains checkable, B can write and A
   cannot issue a fresh authorized write. Reject a stale pre-rotation plan.
3. Change/recover one chain only. Keep the other chain's policy separate; never
   present the successful change as global recovery. Add an old-key compromise
   case to distinguish “was authorized then” from “is authorized now.”
4. Reject cross-chain/Realm replay and duplicate-effect retries. Exercise one
   failed/partial batch; reconcile actual EFS effects rather than trusting the
   wallet's overall receipt or a funding receipt.
5. Remove bundler/paymaster/vendor service. Demonstrate the profile's independent
   user-funded submission/recovery route, or label it unavailable. Keep guest
   reads and data export usable without changing the semantic author.

Required packet: exact repo commit/package/account code hash, EntryPoint and
verifier versions, chain/fork/block, wallet capability transcript, approval count,
cost components and independent effect read-back. Existing prototype tests may
satisfy portions; identify reusable evidence before proposing new work. Neither
native proposal is a prerequisite for this test.

## Assessment and owner questions

No immediate wallet or chain choice is requested. First establish the support
matrix and the cheapest meaningful continuity test. Return an owner question only
if a concrete tradeoff affects MVP scope, authority/exit guarantees, recovery
dependencies or approval UX; include a plain example and recommendation.

**Proposed support-label policy from SDK PM — not adopted, no immediate owner ask:**
reserve “durably supported” for an account profile with a demonstrated user-funded,
vendor-independent write path retaining the same EFS author. Other adapters could
remain explicitly experimental/convenience-only. Example: Base Account's popup,
bundler and sponsor disappear; can Alice still submit an authorized edit without
becoming a different EFS author? A fallback must preserve the account's actual
security policy, not bypass recovery, quorum or scope checks. Decide the product
label when selecting a concrete profile; current standalone Core/guest-access
requirements are already in force and are not reopened here.

Client PM recommends escalating only when a measured candidate lacks an independent
exit **and** the product wants it as the default. Coordinator agrees: first test the
concrete profile, then ask James whether a vendor-dependent convenience default is
acceptable. Do not turn a hypothetical label distinction into a new blocking gate.

For Devcon, compare predictable bounded validation/tooling versus permissionless
custom policy and where each design places complexity. Change the assessment on
working pinned interoperable implementations, measured validation/fee differences,
recovery and censorship/exit evidence, or a revised specification. Do not choose
a political camp from affiliation or an aspirational rollout date.

SDK PM accepted the staged-test correction: start with direct1271 continuity and
independent funding, then a pinned transport. Distinct role fields may resolve to
the same entity. Neither correction reduces the required evidence for a claimed
multi-role/multi-transport profile.

**Next check:** Ethereum PM owns source/activation monitoring; the next selected
wallet implementation task starts with the small continuity/escape test above and
pins its exact profile. Both specialist reviews are complete. No code, public-chain
test or new implementation commitment was made; EFS delivery does not wait for
either unactivated draft. Surface an owner choice only if the concrete default
profile fails the required escape/authority behavior.
