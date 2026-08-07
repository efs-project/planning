# EFS Git — threat model, abuse/moderation, and economic responsibilities

**Status:** deep-dive analysis, 2026-08-07. Negative-indicator document: every mitigation is paired with its residual. Inherits the clientv2 threat model wholesale; this file covers only what Git adds.

#kind/review #status/done #repo/planning #topic/git #topic/security #topic/trust

## 1. Hostile inputs (packs, objects, algorithms)

| Threat | Mitigation | Residual |
|---|---|---|
| Malicious/thin packs, object bombs, decompression amplification | gateway intake: `receive.fsckObjects` (E8) **with WARN/INFO checks explicitly raised** (`hasDotgit`, `hasDotdot`, symlinked `.gitattributes` et al. are only WARN/INFO by default — the [security lane](./prior-art/git-security-and-abuse.md) trap), `receive.maxInputSize`, `transfer.unpackLimit`, per-object *inflated-size* caps in whatever non-C parser admits packs (dulwich CVE-2026-47734: 174 bytes → hundreds of MB; every non-C implementation has its own class of these), connectivity check before any advertisement; containers verified by digest before index-pack. For a permanent store admission strictness is a one-way door — apply it from day one | **git bombs detonate at materialization, not admission** (CVE-2017-15298: 12 objects → ~1 B files at checkout; no git config bounds tree fan-out) — every surface that renders diffs, walks trees, or materializes working sets from *anyone's proposal* needs its own fan-out/depth/entry budgets; a hostile authorized pusher can still commit garbage content — curation (RESTORE + ejection), not intake |
| SHA-1 collision against pinned OIDs | SHA-1DC screening at every intake (stock Git ships it); dual digest (P-G2) strengthens the **head binding** (exact bytes of the named tip object); container digests bind exact byte sets | the *interior* graph below the head (tree/parent pointers) remains SHA-1 in sha1 repos — detection-only, and a collision served to non-EFS clones remains Git-ecosystem risk; SHA-256 repos close this where the ecosystem lets them exist |
| Algorithm confusion (20-byte value assumed universal) | `(algorithm, digest)` tagging everywhere (P-G2); genesis pins `objectFormat`; E7 shows the formats cannot mix in transport anyway | none meaningful |
| Executable repo content (hooks, config) | hooks/config are not transferred by clone (stock Git); gateway never executes repo content; skills execute only through GATE ceremonies | users running arbitrary cloned code is out of any host's scope; say so |
| Unsafe Markdown/HTML/SVG | render service untrusted-document lane, sandboxed, no capability path; remote images proxied/blocked per existing render policy | metadata leakage to image hosts if a wiki policy allows remote images — default off |

## 2. Ref/authority attacks

| Threat | Mitigation | Residual |
|---|---|---|
| Replayed signed ref transaction | three cases, all closed (state-model §4): re-carriage of an admitted claim is a kernel no-op (one immutable primary ordinal; supplemental receipts ignored); late first admission of a stale envelope fails the predecessor/CAS witness; ABA histories (delete→recreate, force-back, tag moves) are killed by `expectedPriorClaimId` + the one-shot rule | in degraded (no-authority-lane) rungs, replay windows reopen — rung labels carry the honesty |
| Stale-but-valid state served to victim | heads derive from the fold for chain-connected (G2+) readers; derived-head attestations (`refs/efs/attest`) give spot-checkable hints below that | **G0 *and* G1 readers consume head currency as the endpoint's word** — G1 verifies authorship/bytes of what is shown, not that it is current or complete; labeled exactly so (wiki doc §4) |
| Compromised maintainer key | KEL revocation/rotation (prospective, C-5); policy epoch bump; RESTORE for content | window between compromise and revocation is real (KEL's own honesty); admitted vandalism needs curation, history preserves it |
| Policy rollback | monotone `policyEpoch` in an owner-controlled slot; claims bind their epoch | compromise of *control-level* keys is KEL recovery territory, not Git-layer |
| Hostile gateway CAS games (reorder, deny) | gateway can delay/censor its fast path but cannot forge applied state; users can submit ref claims directly on-chain (self-pay escape, R-D8 rails) | censorship of the *convenience* path is a service-quality fact; the sovereign path costs gas |
| Two-device same-author seq collision on ref claims | existing protocol gap (persistence OQ-1); wiki fixture added | unresolved pending that gap's blessed answer |
| Relayer admits a proper subset of a multi-ref envelope | `txnRoot`/`refCount` in every ref claim; incomplete groups derive `TRUNCATED-TXN`, never partially applied (state-model §4) | withheld siblings delay the transaction until re-carried — a liveness, not safety, cost |
| Sequencer/submission-path picks the winner of a race | disclosed limit, not a defect: admission order is tamper-evident but **not neutral** (fs-pass consistency statement); losers stay visible evidence; replay/rollback unaffected | which of two *valid* racing publishes applies is builder/relayer-influenceable; precedence-critical apps go multi-venue per the fs-pass cookbook |
| Gateway omits proposals from its listing | proposal enumeration rides the adopted target-keyed backlink index (chain-derivable); listings carry completeness grades (C-2) | G1 readers still see the endpoint's listing; the index is the auditor's recourse, not the casual reader's |
| Stock `git clone` user (no EFS client at all) | **an explicitly unverified rung**: plain clone runs no fold, no claim verification, no closure check — the gateway is that user's authority and no chrome exists to label it; mitigations: `git efs-verify` (after-the-fact fold + dual-digest + closure check over an existing clone) and signed derived-head attestations served as `refs/efs/attest` | interop's price, stated: perfect stock-Git compatibility and gateway-independent verification cannot coincide on the same read |

## 3. Secrets and permanence

A secret pushed to a public EFS repo must be treated as **unrecoverable disclosure**: containers are placed on durable carriers before advertisement, and RESTORE removes it only from the canonical view. Mitigation stack: client-side push protection (secret scanning at commit/publish time — the one place it still helps), immediate-rotation guidance in the leak flow, retention-policy carve-out is *not* offered (selective un-placing of canonical history would break closure claims; a wiki policy may quarantine *serving* — §5). The honest line ships in product copy at workspace creation (P-23's permanence-hazard guardrails apply verbatim). This is materially harsher than GitHub (where force-push + support ticket mostly works) and must never be soft-pedaled. The same honesty applies to the harder case the wiki will actually face — **third-party PII published by someone else**: revision masking changes default rendering only; the workspace-creation copy and the moderation split (§5) carry that residual explicitly.

## 4. Spam and griefing economics

- **Proposal spam:** proposals live under the proposer's namespace — the repo owner hosts nothing. The spam bound depends on who pays, and the two candidate answers pull opposite ways: self-paid admission is a real economic bound but Wikipedia-fatal onboarding friction; sponsorship restores onboarding but moves the attack surface to the sponsor's budget, which then needs its own defense (per-principal ceilings, refundable deposits, roster-classed or gateway-attested intake at a degraded rung). **This reconciliation is unresolved** — a named unknown and falsifier in the main review, not a solved property. Display is lens-filtered either way; no *global* spam machinery is invented.
- **Unreachable-history griefing:** an authorized pusher force-pushing junk to grow retained displaced closures is bounded by (their own) placement costs + per-repo retention policy ceilings for non-canonical refs.
- **Giant-repo griefing of gateways:** per-repo resource classes at gateways (size/egress quotas) — service policy, disclosed, not protocol.

## 4b. Privacy — pseudonymous-and-permanent, never anonymous

The vault's house rule ("confidential when you choose it; public by default; **anonymous never**") applies with unusual force to a wiki, and the threat model must say so rather than borrow Wikipedia's vocabulary: a Wikipedia IP-anon edit is ephemeral and unlinkable in practice; an EFS proposal or publish is **pseudonymous and permanent** — it durably links a principal to the exact text of an edit, forever.

| Leak | Mechanism | Mitigation / residual |
|---|---|---|
| Proposer ↔ edit-text linkage | every proposal claim is signed and permanent | personas (separate principals per context, per the KEL persona doctrine) *chosen before* proposing; a KYC-funded address makes all its edits retroactively attributable — say so at workspace creation |
| Sponsor ↔ proposer linkage | sponsored admission ties funder to principal | disclosed in the sponsorship design (unresolved, §4); relayers are submission rails, never authors (R-D8) |
| Edit-timing / ordinal correlation | admission ordinals are public and precise | inherent to the strongest rung; batch publishing coarsens it; privacy-tier timestamp coarsening (L15) does not apply to ordinals |
| Cross-repo persona reuse | one principal proposing across communities links them | persona-per-community guidance in the proposal ceremony; never automatic |

Product copy consequence: trace T2 is a *reader without an account*, not an "anonymous" proposer; the workspace-creation ceremony carries the confidential-never-anonymous line next to the permanence hazard (P-23).

## 5. Moderation: validity / serving / curation are three planes

1. **Validity** (protocol): signed, admitted, closure-complete — no operator can alter it.
2. **Serving** (per operator): a gateway may decline to serve content (malware, CSAM, legal orders) without rewriting anything — its caches are its own; policy published (neutrality brief's requirement). Another operator may serve the same verified state: the walk-away property *is* the anti-censorship story, and the legal exposure of operators is real and belongs to whoever operates (L6's capacity gate applies to any EFS-operated gateway).
3. **Curation** (per reader/community): lenses, rosters, RESTORE, whiteout-class masking — visible, attributable, reversible (P-17's visible-tombstone arm extends naturally to wiki masking).

Vandalism after revert (kickoff question): the vandalism remains in history (permanence) but (a) canonical view shows the restored state, (b) the diff/history UI renders reverted spans as reverted, (c) *serving* of specific blobs may be quarantined per-operator on legal classes, (d) the closure/retention ledger records the quarantine honestly (availability ≠ absence, C-2). Leaked-PII cases route to (c) + rotation guidance; no pretense of erasure.

## 6. Who pays (economic responsibilities, named)

| Cost | Payer (v1 posture) | Degradation when unfunded |
|---|---|---|
| Ref-claim admission | author (sponsorable; batched; wiki cadence) | falls to provider-attested rungs — labeled |
| Container placement (checkpoints/increments) | repo owner/community by policy; Arweave pay-once for archival checkpoints | availability decays to fewer carriers; repair possible from any survivor |
| LFS bytes | uploader by default; policy may pool | pointers resolve BYTES-UNAVAILABLE, honestly |
| Gateway operations (serving, LFS API, web views) | operators (self-hosted, community, or paid tiers) | reads degrade to G3 self-clone + on-chain state — slow but sovereign |
| Retention of displaced history | repo retention policy (owner-funded), ceilings disclosed | oldest displaced closures lapse first, ledger says so |
| Anonymous read subsidy | gateway operators; G1 verification keeps them honest, competition keeps them replaceable | the sovereign floor (chain + carriers) never depends on them |

The design never requires an EFS-operated service; every EFS-operated convenience inherits the L6 legal/abuse-capacity gate.

## 7. Field evidence on gateways, law, and money (from the neutrality lane)

[prior-art/credible-neutrality-and-exit](./prior-art/credible-neutrality-and-exit.md) grounds §5–§6 in observed history; the load-bearing facts:

- **The gateway lifecycle always ends the same way.** Cloudflare exited IPFS gateways (2024); ipfs.io/dweb.link now *redirect browsers to an in-browser verifying service-worker gateway* (2026) because 67% of their 614M requests/day was backends free-CDN-ing — donor funding "inherently finite." The flagship dweb project fixed gateways by **moving verification into the client**, not by funding — the strongest external validation of the G1 guest design. Consequence for §6: an anonymous-read subsidy sized to *human* reads is plausible; one sized to programmatic hotlinking is not — push machine traffic to verifying SDK clients from day one.
- **Neutrality does not reduce the legal bill.** eth.limo — a passive resolver — burned ~$250k in months on US federal requests (ENS DAO reimbursed); its registrar account was then social-engineered (2026-04), hijacking resolution for ~2M .eth names. Tornado Cash drew the current line: immutable contracts protected (Fifth Circuit; OFAC delisting), but *operating a service* convicted Storm. Every EFS-branded gateway is an operated service with DMCA/NCMEC-§2258A/DSA duties and unbudgetable defense costs; takedown stays gateway-local (Bad-Bits-pattern denylists), never protocol-level.
- **DNS is where every neutral system got captured** (eth.link auctioned; eth.limo hijacked via registrar; radicle.xyz ISP-blocklisted over gateway-served content; Gitorious survived only by a goodwill domain transfer). The `web3://`/on-chain-naming read path is the fix; every https convenience mirror reintroduces the weakness and must be labeled disposable.
- **Collaboration metadata always dies; code survives.** Google Code, Bitbucket-hg, and GitHub's own Arctic Vault all preserved (at best) the git data and lost issues/PRs/reviews. Portable proposals/reviews-as-records is not a feature — it is the differentiator every shutdown in the record argues for.
- **Operator-independence has known ingredients** (Bitcoin/BitTorrent/Tor): self-certifying artifacts, discovery nobody owns, verifying clients, marginal serving incentives or near-zero cost — plus the lane's "operator-vanish drill": enumerate everything EFS-run and protocol-ize, mirror, or label each item. That drill is prototype milestone M4, run on a calendar, not at shutdown week.
