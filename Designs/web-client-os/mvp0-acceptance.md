# Web Client MVP0 — File Browser acceptance overlay

**Status:** draft — bounded product-pressure gate over disposable MVP-C0; not implementation, release, conformance, or freeze authorization
**Target repos:** planning, client, sdk
**Depends on:** [[../efsv2/disposable-mvp-profile]], [[../efsv2/mvp-c0-genesis-manifest]], [[../sdkv2/mvp-interface]], [[README]]
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-03

#status/draft #kind/design #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/read-path #topic/coherence

## Purpose

MVP0 is the smallest observable File Browser pressure gate for one exact,
synthetic, local MVP-C0 run. It tests the five SDK seams through a clean guest
journey and three deliberately basic mutations. It does not authorize Web
Client code, a repository, public deployment, durable data, or adoption of the
disposable C0 mechanism.

The broader 929-line [[mvp-and-acceptance]] file remains a roadmap and freeze
catalog. It is not this gate.

## Fixed harness

Every test uses the same run namespace, manifest-pinned Realm/Core/profile,
Route, Mount, Plans, run-local byte carrier and limits, and qualification law
from [[../efsv2/disposable-mvp-profile]]. The ordered G0–G12 bootstrap in
[[../efsv2/mvp-c0-genesis-manifest]] must have activated runtime first, and its
required first post-genesis synthetic file supplies the initial guest fixture.
A test that changes canonical bytes, Type/index capability, `WritePlan`,
genesis, or result interpretation starts a new run rather than patching the
fixture.

The harness records wallet/provider calls, raw canonical inputs and outputs,
all qualification axes, carrier attempts, each distinct receipt, and the exact
read-back basis. Expected IDs and post-state are computed independently of the
SDK under test. Product labels may be friendly, but the Inspector/export keeps
the full evidence.

## Thirteen observable tests

1. **M0-01 — clean guest route.** A fresh browser with no cache, service worker,
   account, wallet, Commons, hosted indexer, OS, or Data Explorer opens an exact
   MVP-C0 nested folder route through the File Browser. A throwing wallet stub
   observes zero access. The UI shows a useful qualified result and the
   Inspector exposes exact route inputs, raw bytes, domain, basis, and evidence.

2. **M0-02 — exact file and verified bytes.** From the same guest context, open
   an exact File/FileRevision, retrieve a bounded full body and nontrivial range
   from the manifest carrier, and independently match the committed
   `ChunkTree`/digest. Semantic identity, carrier, availability, integrity,
   returned-byte state, and range remain separately inspectable.

3. **M0-03 — qualified partial page.** Remove or interrupt one required
   `BindingScope` page in a second controlled read. Already observed entries
   remain visible, but coverage is `PARTIAL`/`UNKNOWN`, the missing continuation
   and cause are shown, and an empty page does not become `ABSENT_PROVEN` or a
   negative cache entry.

4. **M0-04 — qualified unknown.** Make the required committed basis, capability,
   or historical evidence unavailable. Exact read and page read return the
   imported `UNKNOWN` outcome/reason with raw attempts and every independent
   qualification axis intact; no fallback to `latest`, empty, or another Realm
   occurs.

5. **M0-05 — tamper rejection and eligible fallback.** Return wrong bytes from
   the first eligible carrier and correct bytes from a second controlled
   source. The first attempt records available/returned/failed-integrity, only
   the verified fallback reaches presentation, and FileRevision identity does
   not change. With the fallback removed, no bytes are rendered and the
   semantic File still does not become absent.

6. **M0-06 — one-prompt relayed EOA write.** Create one small file through the
   normal path. The wallet sees exactly one EIP-712 signature request for the
   exact imported C0 `WritePlan` and no transaction prompt; a distinct relayer
   submits and pays. Authorship/publication, authorization, submission, EVM,
   admission/effect, byte-store, and read-back evidence remain separate.

7. **M0-07 — direct EOA fallback.** With relay or typed-data support unavailable,
   create one empty directory with exactly one transaction prompt and no prior
   `WritePlan` signature prompt. The result says
   `DIRECT_EOA_TRANSACTION_AUTHORSHIP`, `EXPERIMENTAL_DIRECT_CORE`, and
   `filesPreconditionCertified=false`; it never claims portable authorship or
   certified Files routing.

8. **M0-08 — zero-prompt session after grant.** Canonically establish and
   independently read back one bounded revocable C0 grant, then publish one
   routine revision with zero wallet requests. The session still signs and both
   client and Core check profile, Realm/Core/executor, Principal/root/Route,
   operation, nonce, expiry, revocation, and byte/value/gas ceilings. After
   revocation, the same attempt fails explicitly without widening or silent
   wallet fallback.

9. **M0-09 — folder effect.** Ordinary File Browser controls create an empty
   directory in one atomic C0 transaction. Canonical read-back independently
   matches the planned Object/Record/Occurrence, charter and name-slot Binding
   effects, expected revisions, parent point lookup, and scope-qualified parent
   listing.

10. **M0-10 — file effect.** Ordinary controls create a small file from fixed
    local bytes. Read-back matches the planned File Object/charter,
    `ChunkTree`, initial FileRevision, DirectoryEntry, name-slot/file-head
    Bindings, byte commitment, verified bytes, and listing result.

11. **M0-11 — revision effect.** Ordinary controls publish a second immutable
    revision using the expected file-head revision. Read-back selects the new
    head and verified bytes while the prior revision remains readable by exact
    ID; a stale expected revision rejects rather than silently replanning.

12. **M0-12 — acknowledgement is not success.** For a controlled write, pause
    independently after wallet approval, relay/bundler acknowledgement,
    transaction hash, and successful EVM receipt. At every pause operation
    stage may advance, but semantic `effect` remains `UNKNOWN` and the File
    Browser does not show success. Only an exact matching canonical read-back
    produces `READ_BACK_VERIFIED` and `effect=COMMITTED`; mismatch or unavailable
    evidence remains explicit.

13. **M0-13 — clean-browser reopen.** Delete all browser state and open the
    exact link produced by M0-10/M0-11 with no wallet or Data Explorer. The File
    Browser independently derives the same semantic IDs and returns the same
    qualified selected revision and verified bytes at the cited basis, subject
    only to honestly reported later-basis finality/currentness observations.

## Pass rule

All thirteen tests pass in the declared browsers and independent oracle. Any
missing raw bytes or qualification axis, mixed basis, hidden provider/wallet
touch, unlabelled fallback, non-atomic planned effect, prompt overrun, false
absence, tampered presentation, or success before matching read-back fails the
gate. A passing gate supports only the next disposable experiment review.

## Outside MVP0

- Arcade and all other domain applications;
- rich or executable Views and Data Explorer packaging;
- KEL, recovery, managed-Principal migration, and full account abstraction;
- native mounts and three-host packaging;
- rename, move, delete, sharing, collaboration, batch editing, and offline
  write queues;
- a production large-file carrier or permanent file/range size policy; and
- public/testnet deployment, durable user data, production security,
  compatibility, or protocol freeze.

These are deferred, not silently solved by MVP0. The long-form
[[mvp-and-acceptance]] catalog preserves the relevant future gates.

## Open questions

No new product or protocol choice is requested. The gate stays blocked on the
upstream MVP-C0 execution/evidence questions and explicit implementation
authorization.

## Pre-promotion checklist

- [ ] All thirteen test procedures have deterministic fixtures and independent expected values
- [ ] `**Target repos:**` confirmed
- [ ] Upstream MVP-C0 dependencies accepted or explicitly retained as disposable inputs
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one independent SDK and product review is recorded

## Implementation notes

No product implementation is authorized by this overlay. If a disposable UI
fixture is later approved, it must remain namespaced to the same C0 run and
must be destroyed or retired under the upstream rules.
