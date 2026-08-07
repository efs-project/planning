# EFS Git — object closure, placement, retention, repair, and clean-room recovery

**Status:** deep-dive candidate model, 2026-08-07. The byte-availability half of the profile: what proves an advertised ref is retrievable, how containers and carriers compose, what survives force-push and GC, and how a stranger rebuilds everything.

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git #topic/storage #topic/preservation

## 1. The availability question, stated honestly

A Git OID proves *integrity*, never *retention* (GoE corpus, verbatim lesson). The profile therefore separates three facts per advertised ref:

1. **Closure definition** — which objects are required: `rev-list --objects` reachability (E10). Deterministic, computable by anyone with the objects.
2. **Closure commitment** — a signed statement of what the publisher claims to have placed: `ClosureManifestV1`.
3. **Placement evidence** — receipts/probes that named carriers actually hold the containers (proof-bearing where the carrier supports it — EthStorage proofs; retrieval checks elsewhere; the EthStorage review's capability-honesty axes apply verbatim: commitment ≠ provider proof ≠ retrieval ≠ replica count).

## 2. Containers

All object bytes travel and rest in **immutable, digest-addressed containers**:

- **Checkpoint container:** a full `git bundle --all`-class bundle at a policy-chosen cadence. Self-contained; one file restores the repo to that basis (E1).
- **Increment container:** a bundle/pack covering `checkpointBase..head` or `expectedOld..new` for one transaction. Prerequisites are explicit and machine-checkable (E2).
- **LFS objects:** raw sha256-addressed byte objects (see §5).

Container digest = sha256 over exact container bytes. Containers are *archival evidence*: regenerating a different pack for the same objects is always legal (E3) and produces a new container; old containers stay valid. The mutable-key collision GoE built (same ending-OID key, replaceable content) is impossible under digest addressing.

**Why checkpoints are load-bearing:** they bound the fetch walk (GoE's per-push record walk grows without bound), bound increment-chain fragility (one lost increment breaks the chain only back to the last checkpoint), and give the mount/snapshot profile its basis artifact (P-16's snapshot/bundle-with-closure-manifest shape — the same object, reused).

**Containers are also the serving accelerator, natively:** Git's **bundle-URI** mechanism (`clone --bundle-uri`, protocol-v2 `bundle-uri` command, `creationToken`-ordered incremental lists) lets any modern client bootstrap its object store from static bundle files before topping up — "the single most EFS-shaped transport feature in Git" per the core lane: checkpoint + increment containers on Arweave/EthStorage/HTTP *are* a bundle-URI list, giving near-serverless anonymous cloning with only a thin `ls-refs` oracle for freshness. Client support ships in stock Git; GitLab runs the server side behind flags ([prior-art/git-core-mechanics](./prior-art/git-core-mechanics.md) §4). The IPFS post-mortem is the negative proof of the same design: per-object content addressing forfeits packing and never solved mutable refs — objects-in-containers + signed ref claims is the shape that works ([prior-art/nostr-and-p2p-git](./prior-art/nostr-and-p2p-git.md) §6).

## 3. The closure manifest

```text
ClosureManifestV1 = {
  repoId, algorithm,
  refs[],                    // (refName, oid) set this manifest covers
  objectCount,
  objectSetRoot,             // Merkle root over sorted (type, oid) pairs — spot-check + non-omission evidence
  containers[],              // (containerDigest, byteLen, class: checkpoint|increment|lfs)
  prerequisites[],           // container digests this increment builds on
  lfsOids[],                 // sha256 oids referenced by LFS pointers at these refs
}
```

Verification = fetch containers → `index-pack --strict` + connectivity check (stock Git *is* the closure verifier) → compare derived refs/object set against the manifest. Publication rule (P-G4): place containers, verify one independent retrieval, then admit the ref transaction carrying `closureCommitment = hash(manifest)`. Enforcement honesty: the publication rule is publisher-attested and **the fold never grades availability** (it is pure over chain state — a determinism keystone); enforcement lives at the two object-bearing layers — gateway intake refuses to advertise a head whose closure it cannot fetch, and verifying readers/auditors flag closure failures as availability grades on the head. A branch whose advertised head proves unfetchable is recovered through the policy-epoch recovery ceremony (state-model §4), so a placement mistake can never brick a canonical branch.

Per-object on-chain state is deliberately absent — a monorepo has millions of objects; the manifest commits to the set, containers carry the bytes, and the existing `contentHash → file` index covers only LFS-class whole-file objects where lookup is product-meaningful.

## 4. Retention, force-push, and GC

- **Advertised refs:** every applied ref's closure must remain covered by live placements (checkpoint + increments or a newer checkpoint). Repair = re-place from any surviving copy; `repair()` is an adapter verb (GoE pressure-test interface, kept).
- **Displaced history (force/RESTORE):** the displaced ref's last closure containers are retained under the repo's retention policy (default: retain; policy may name an horizon for non-canonical refs). Git gives displaced objects no home (E6: unreachable → GC destroys); EFS's ref-claim history + retained containers make "auditor recovers the pre-force state" a bounded, supported read: fold history → displaced OID → container set → restore.
- **Deleted branches:** the deletion claim supersedes the slot; history and containers persist per the same policy.
- **What may actually disappear:** bytes whose every placement lapses. That is an availability failure with honest grades (BYTES-UNAVAILABLE ≠ absence, C-2), never an identity change (C-3). Durable *revocation of serving* is a lens/serving-policy act, not byte destruction — permanence economics live in [threat-and-economics](./threat-and-economics.md).

## 5. Git LFS

Standard LFS end to end: pointer files in Git (spec unchanged), sha256 oids, batch API at the gateway. The gateway's LFS server maps `oid → placement` via the adopted contentHash index + mirror claims; bytes live on the same carriers as containers. A non-LFS clone honestly yields pointers (stock behavior). Nothing new is invented — the pointer format, batch protocol, and transfer adapters are the reuse surface; only the storage backend binding is EFS work. Wiki media default: LFS from the first image, so wiki repos stay clonable at text scale.

## 6. Exit and clean-room recovery

**Minimum exit (H-8):** an ordinary `git clone` of any gateway, or the latest checkpoint container alone, yields a complete standard repository a conventional host accepts. No EFS metadata is required for that repository to be valid Git (GoE's one good exit property, kept and hardened).

**Bundle-application security:** bundles fetched from carriers are verified against the chain record (tip OIDs vs derived heads, container digest vs claim) *before* application, and clients keep `transfer.bundleURI` off for the general path — CVE-2025-48385 (bundle validation bypass → arbitrary file writes, fixed 2.50.1) is the standing reason peer-supplied bundles are never trusted unverified ([security lane](./prior-art/git-security-and-abuse.md) §1.5).

**Full exit:** the Git profile of `.efs-bundle` = checkpoint container(s) + increments + LFS objects + EFS sidecar (genesis, policy history, ref-claim history export, closure manifests, placement receipts, collaboration objects). This is input to the delegated `.efs-bundle` normative spec — the Git case is its hardest and best fixture.

**Clean-room rebuild (trace T14):** given chain access + public specs + surviving carriers, a fresh operator: reads genesis + policy + ref claims from state (full-body spine — no logs needed) → runs the `GIT-REF/1` fold → derives heads → fetches containers by digest from any surviving placement → `index-pack` → serves smart-HTTP v2 under a new hostname. Every gateway artifact (bare repos, web views, LFS maps, search) is a derived cache (P-G7). The gateway holds **no** state that is anyone's sole truth — the property GoE lacks (its push-record truncation hides history) and the property that makes the neutrality claim mechanical rather than reputational.

## 6b. SWH alignment (free interop + the takedown pattern)

Software Heritage independently validates this section's whole shape at 2 PB scale: it stores the object DAG + per-visit ref snapshots, discards packs, and regenerates clonable bare repos on demand (`git repack` at export) — objects + snapshot records suffice; packs are caches ([prior-art/software-heritage-preservation](./prior-art/software-heritage-preservation.md) §4). Three imports:

- **SWHID compatibility is free.** SWHIDs (ISO/IEC 18670:2025) hash git-identically — an EFS-hosted commit *is* `swh:1:rev:<oid>`. Exact citations should render/accept SWHID forms; SWH becomes a free cold-storage backstop for the Git half of any public EFS repo.
- **SWH's declared gaps are this design's checklist:** it archives no LFS payloads (silent loss), no issues/PRs, no submodule closure. The closure manifest's `lfsOids` and explicit submodule pinning (origin + exact OID, admitted with the closure) exist precisely to not repeat those.
- **The takedown pattern to copy:** `swh-alter` — closure-aware removal that spares shared objects, a public removed-objects feed, a *separate* reasons channel, and mirror discretion ("inaccessible, not deleted") — is the most complete serving-policy design for an append-only archive found anywhere; the threat doc's serving-plane quarantine should adopt its feed/reasons/discretion split verbatim.

## 7. Carrier adapters

The GoE pressure-test adapter interface is adopted unchanged (`put/get/probe/verify/repair/export`). First adapters: conventional bare-Git/HTTPS (baseline + fastest), EthStorage/GoE-compatible (behind the production-review gates already documented — nothing here relaxes them), Arweave (archival checkpoints; pay-once fits checkpoint cadence), local/OPFS (offline). Per-carrier honesty labels ride the existing durability vocabulary (A-8 tiering; ES review's proof-vs-retrieval split). No default-carrier commitment is made here; the EthStorage validation program remains the gate.
