# Ethereum and Base account compatibility — bounded EFS review

**Status:** routing and provisional support matrix; specialist replies pending.
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
| 4337/7562 and 5792 batching/sponsorship | Adapter boundary | Adapter boundary | SDK + client: pin account, EntryPoint, wallet RPC versions and capability result. Submission receipt is not EFS effect success; partial batches need per-effect read-back. |
| 7702, 6492, 7913, modular/session permissions | Adapter boundary, enable only tested profiles | Same; verify actual chain/wallet support | SDK + client: bounded validation, exact delegation code, scope/budget/expiry/revocation and no hidden persistent setup during signature verification. No implement-all mandate. |
| 8130 native transaction / keystore | Watch; no activation claim | Watch priority; Base plan is not activation evidence | Ethereum PM + SDK: exact draft/client/account/keystore commits, chain activation and measured fallback required. Native authenticator restrictions are not a ban on arbitrary EVM wallet logic. |
| 8141 native frames | Watch | Watch interoperability, no support assumption | Ethereum PM + SDK: exact draft/client revision, validation/payment rollback boundaries and any working keystore adapter. Do not import older forum atomicity descriptions as current rules. |
| Vendor/bundler/paymaster disappears | Needed now: baseline direct path; adapter-specific escape | Same plus Base inclusion assumptions | Client + SDK: guest reads remain available; sponsor loss does not fabricate successful writes. Distinguish user-funded/account escape from reverting to a different EFS author. |
| Cross-chain identity/policy disagreement | Needed now: explicit chain/basis | Needed now: independent chain/basis | Core: same address or keystore label does not prove same current policy, recovery state or historical authorization. No global “current key” without evidence. |
| EIL funding from another chain | Not needed for MVP; optional adapter boundary | Same | SDK + client: funding/submission only. No shared authority or atomic cross-chain EFS-write claim. |

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

### Smallest new integration packet

Reuse a tiny Files workflow and one **version-pinned smart account** rather than
building native-AA infrastructure. Run equivalent independent scenarios for the
Ethereum and Base execution profiles actually available; label local/forked runs
separately from public-network observations.

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

For Devcon, compare predictable bounded validation/tooling versus permissionless
custom policy and where each design places complexity. Change the assessment on
working pinned interoperable implementations, measured validation/fee differences,
recovery and censorship/exit evidence, or a revised specification. Do not choose
a political camp from affiliation or an aspirational rollout date.

**Next check:** integrate the two specialist replies and send the consolidated
link and any owner decisions to Ethereum PM. Ethereum PM owns ongoing monitoring;
EFS delivery does not wait for either unactivated draft.
