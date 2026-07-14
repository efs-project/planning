# OS pressure-report adjudication + the OS-facing contract

**Lane:** OS pressure-report adjudication (P1–P13) + the one-page OS-facing contract
**Pass:** EFS v2 filesystem-features (Pass 1), 2026-07-10
**Inputs read in full:** [[client-os-pressure-report]], [[fable-fs-kickoff]], [[codex-envelope]], [[codex-kinds]], [[codex-kernel]], [[read-lens-spec]], [[freeze-gates]], [[identity]], [[ops-doctrine]], [[apps-cookbook]], [[confidence-and-open-decisions]], [[fable-next-pass-scope]], verify-time-model.md, state-brief.md, fs-feature-space.md, and the clientv2 sources of the asks (wallet-and-actions, packages-and-updates, persistence-and-sync, locale-and-accessibility §1–2, kernel-capability-model excerpts).
**Precedence respected:** codex-envelope > codex-kinds > codex-kernel > base texts; read-lens-spec is Durable, not Etched.

**Verdict shape.** Every P1–P13 ask is adjudicated **adopt / adapt / reject** with reasoning traceable to the codex docs. Net: the pressure report is high-quality input — most asks are adopted or adapted — but three of the five P2 reserved-row candidates are **refused as rows** (convention rulings, stated loudly rather than by silence), one P5 sub-ask is **rejected at the wire** (no new envelope word), and several asks dissolve into *disciplines over existing frozen surface* rather than new machinery, which is the correct grain for this protocol.

**Cross-lane dependencies (stated, not duplicated).** This lane does not own:

| Decision | Owning lane | What this lane contributes |
|---|---|---|
| `seq→order` rename, `claimedAt` row-vs-convention, `admittedAt` final field shape/width | **versioning-time lane** | the OS-side requirement statement (§P1, §P2-adjunct) + adoption of the verify-time-model fixes as binding on any shape it picks |
| delegated authorship / delegated revocation / `act` reservation shape | **access-delegation lane** | the OS-side adjudication of P4 paths (a)/(b)/(c) + the reservation requirements the OS needs honored (§P4) |
| multi-tag AND / traversal on-chain line | **search/graph lane** | the contract states the line exists and is that lane's to draw (§Contract N6) |
| encrypted-record convention depth, salted-anchor crypto detail | **privacy lane** | the lens-config roaming design (§P9) consumes only *already-reserved* parts and flags one reservation-wording check to that lane |
| trash/WHITEOUT, snapshots, move-at-scale | deletion/versioning/move lanes | not adjudicated here except where an OS ask touches them |

---

## 1. Adjudication summary

| # | Ask | Verdict | One line |
|---|---|---|---|
| P1.1 | every grade state-provable (getProof, no log scans) | **ADOPT** | already the design's own trajectory; one evidence-discovery caveat stated |
| P1.2 | batched `isAdmitted(claimId[])` | **ADAPT** | view-contract recipe, not Etched ABI — kernel already stores everything needed |
| P1.3 | `admittedAt[claimId]` stored state word | **ADOPT** | with the verify-time-model fence + pricing; final shape = versioning-time lane |
| P2.1 | `lang` + `dir` reserved rows | **ROW — mint both** | content-metadata family parity with `contentType`; accessibility-critical |
| P2.2 | persona-link relation + label | **ROW — reserve pair + label layout** | red-team-confirmed; identity-adjacent; keeps KEL additive |
| P2.3 | handler binding | **CONVENTION, not row** | semantics still moving (Android's decade); no kernel consumer; a row can't fix the real problem |
| P2.4 | freshness beacon | **CONVENTION, not row** | already fully expressible; `expiresAt` + STALE-stops-GATE *is* the mechanism |
| P2.5 | receipt/grant schema | **CONVENTION, not row** | schema too young to freeze; no kernel consumer; pledge-amendment risk accepted explicitly |
| P3 | eight grade-vocabulary extensions | **ADOPT (revision pass)** | all Durable; adopt as qualifiers/composition rules, never new base grades |
| P4 | actor/delegation | **ADOPT (a)+(c), REJECT (b)-as-forever** | reserve; schedule 0x02/0x03; shape owned by access-delegation lane |
| P5.1 | canonical envelope summary | **ADAPT** | recompute-from-bytes yes; hash-into-the-signed-struct **REJECTED** (no new envelope word) |
| P5.2 | per-record risk-class taxonomy | **ADOPT** | deterministic S0–S3 classification function specced below |
| P5.3 | `.efs-bundle` protocol artifact | **ADOPT** | normative venue-neutral container; Durable encoding over Etched contents |
| P5.4 | pre-admission supersession semantics | **ADOPT (doctrine)** | answer derivable from frozen semantics; abort artifact is the real defense |
| P5.5 | ERC-7920/7964 liaison | **ADOPT** | watch-list line |
| P6 | update-channel ops doctrine | **ADOPT wholesale** | plus one guard: quorum stays reader policy, never a grade |
| P7 | app-package convention | **ADOPT as cookbook; RULE no P2 rows** | "atomic closure resolve" dissolves into citation-pinning discipline |
| P8 | read-path privacy normative section | **ADOPT (upgraded)** | privacy is pulled into this pass; normative, not deferred |
| P9 | private tier + lens-config survival | **ADOPT + DESIGN** | lens state lives on-EFS: encrypted PIN at a deterministically-derived salted anchor (full design §P9) |
| P10 | device-bit allocation | **ADOPT + DESIGN** | roster-assigned deviceId + local monotonicity + re-enroll-on-clone (full design §P10) |
| P11.1 | SHA-256 chunk word | **ADOPT** | mint before EFSBytes vectors freeze |
| P11.3 | web3:// on-ramp liaison | **ADOPT** | standards task, named owner needed |
| P12 | v1-stranded doc banners; REVOKED-closure boot | **ADOPT** | boot = yes-behind-interstitial for humans; flat refusal for agents |
| P13 | untrusted-author-time rule + social pattern + tradeoffs section | **ADOPT all three** | social-pattern normative skeleton specced below |

---

## 2. Per-item adjudications

### P1 — Read-ABI: verifiability, admission evidence, admission time [ETCHED-WINDOW]

**P1.1 State-provable grades — ADOPT.** This is not a new demand; it is the design's own pledge made checkable. Bodies-in-state is already normative (read-lens P8), the ERC-7201 storage layout is frozen precisely so `eth_getProof` point reads are a documented trustless path (codex-kernel adopted core), and the enumeration spine exists because hash-keyed mappings can't be reconstructed from a state dump. Adjudication confirms each grade against the state surface:

- **PRESENT / SUPERSEDED / REVOKED / STALE:** pure point reads (`getSlot`, `isRevoked`, `getClaim` + `expiresAt`) — provable today.
- **PROVEN-ABSENT (home):** an empty slot-mapping entry under the frozen layout is a state-trie non-inclusion proof of the default value. Provable, *given* the frozen layout — which is why the layout freeze is load-bearing and must not be weakened.
- **PROVEN-ABSENT (AS-OF N):** checkpoint non-inclusion — SDK-owned proof format (read-lens §5.2), consumes a state-committed checkpoint claim. Provable.
- **EQUIVOCAL — the one honest caveat.** *Verifying* duplicity evidence is state-backed (both colliding claims are admitted state under admit-both; two `getClaim` proofs at one `(author, order)` suffice, or the portable proof pair verifies offline). *Discovering* that evidence exists is an enumeration job, not a point read. The correct contract wording: **every grade is verifiable from state-backed reads plus presented evidence; evidence discovery may be an indexer/spine-walk job.** A light client that is handed the proof pair can verify EQUIVOCAL trustlessly; it cannot cheaply prove "no duplicity exists" — and nothing in the grade table requires it to (LIVE is "no duplicity evidence *known to the resolver*", §2.2). No new kernel surface needed; the wording lands in the read-lens revision.

**P1.2 Batched admission checks — ADAPT (view-contract recipe, not Etched).** `getClaim(claimId)` on the frozen ABI already answers per-claim admission; "batched" is aggregation, and the kernel doctrine is explicit that everything enumerating/paged is evicted to redeployable views (codex-kernel adopted core). Views cannot mint state — but no new state is needed here. Bless `isAdmitted(claimId[]) → bool[]` (and `admittedAtBatch(claimId[]) → uint64[]` once P1.3 lands) as the **first entry in a normative view-contract recipe appendix** of the read-lens spec, with the honesty note that a view contract is redeployable and its address is client config, not protocol. Sync-center honesty (persistence-and-sync panel 3) is fully served. Rejecting the Etched version keeps the frozen ABI minimal at zero capability cost.

**P1.3 `admittedAt[claimId]` stored — ADOPT, with the four fences, priced into A2.** The verify-time-model verdict (SOUND-WITH-FIXES) is adopted as binding:

1. **Stored per-claim state word, not an event** — required for getProof-provability, EIP-4444 log-pruning survival, and the 100-year offline-verify pledge (fix 3.3/5.5). An event-only lane (path c) fails the trust story the OS builds cooldowns and the predate defense on; it is rejected except as a labeled degraded fallback.
2. **Fenced out of every comparator** — mirror the `prev` hard-fence verbatim: *`admittedAt` MUST NOT enter any slot comparator, supersession decision, or cross-chain ordering; it is per-venue evidence only, always venue-qualified* (fix 3.1). This fence text belongs in the Codex next to the `prev` fence.
3. **Non-portable by construction, and correctly so** — a replica stamps its own; the home value travels only inside home's state proof/checkpoint. The cross-chain admission trail (James 2026-07-07) falls out for free: each kernel storing its own `admittedAt` *is* the trail; the earliest known admission is the age upper bound (the predate defense). No trail data structure exists or is needed. The portability ceiling is stated plainly in the contract (§Contract N1/N2): per-chain-trustworthy, venue-labeled, **never a global clock**.
4. **Freshness re-anchoring** — read-lens §5.2/§9.C currently compute checkpoint age from `tidTime(order)` (untrusted). Route freshness through `admittedAt` where home is reachable, `tidTime` as the labeled fallback (fix 3.4). This is the one genuine internal inconsistency the OS ask surfaced; it strengthens §5 and must land in the same revision.

**Cost note:** all records of one envelope admitted in one tx share one `block.timestamp`, but `submitSubset` re-admission at different blocks means the value is genuinely per-claim; whether it is stored as a standalone mapping word or packed into an existing claim-storage slot is a **measurement question for the freeze-gates A2 gas bundle**, not a semantics question. **Dependency:** field width/encoding and its relationship to `claimedAt` are the **versioning-time lane's** ruling; this adjudication binds only the four fences and the store-it-or-lose-it decision. **Sequencing:** P1 precedes the A2 gas snapshot (freeze-gates open question) — confirmed, this is on the critical path.

**Defer-risk if refused:** the fake-prediction footgun (P13) becomes undefendable, update cooldowns degrade to gameable-or-indexer-trusting, and the OS's "verified reads over untrusted endpoints" flagship loses its clock. This is the single highest-leverage Etched decision in the report.

### P2 — Reserved-key rows [ETCHED-WINDOW] — the five-candidate pass

**The row test used** (derived from how the existing 13 rows earned their place): mint a row iff (i) the semantics must be uniform and lens-legible across clients for *signed-data* interpretation (not client chrome), AND (ii) either a frozen read path consumes it (follow-policy/matrix columns) or the shape is stable enough that freezing its vector now is safe, AND (iii) retrofit-after-freeze would be a pledge amendment for a need already demonstrated by multiple independent consumers. Otherwise: an explicit "convention, not row" ruling with a named re-check trigger — never silence.

**P2.1 `lang` (BCP-47) + `dir` (ltr/rtl/auto) — MINT BOTH ROWS.**
- *Family parity:* `contentType`, `contentHash`, `size`, `contentEncoding` are already reserved content-metadata rows; a signed file's language and direction are the same class of fact — required to render signed content *reproducibly* (locale doc G1, the round's top-cited item). A record whose language is a per-client guess renders differently per client; for screen-reader pronunciation and bidi handling that is an accessibility-correctness failure, and for signed content it is a legibility failure of exactly the kind the reserved table exists to prevent.
- *Shape:* VAL-layout PIN rows (cardinality-1 per author) under DATA-parent containers, same attachment pattern as `contentType`; string values. **Value grammar is validated read-side, not at admission** — the kernel stores strings opaquely (a malformed BCP-47 tag must not become an admission refusal; the master invariant's refusal set is closed). The row freezes the key, layout, and attachment matrix; the SDK/lens owns grammar validation and the "declared vs detected vs unknown" ladder (locale doc interim ladder stays as the fallback for unlabeled legacy records).
- *Cost:* two rows + per-row golden vectors. Cheap now; a pledge amendment later.

**P2.2 Persona-link relation (`efs.os/persona` TAG + `efs.os/primary` PIN + label word) — RESERVE THE ROWS; machinery stays client-layer.**
- One of only two red-team-**confirmed** findings of the client round (fable-next-pass-scope: "trust these"); [[identity]]'s own open question already leans reserve ("keeps the future KEL-enforced version additive"); [[codex-kinds]] amendment 3/8 already extended the reserved-key carve-out to TAG-role and ADDRESS-parent rows, so the pair is table-legal.
- *Why a row and not a convention:* the pair is **identity-adjacent** — the same family as `home`/`successor`/`checkpoint`, all of which are rows. Forked stitching dialects are a spoofing surface: if clients disagree on what constitutes a valid pair (both-LIVE rule, label-only-on-owner-side, cardinality), an attacker exploits the most permissive dialect to render a hostile key as "you." Freezing the *shape* (keys, layouts, both-directions-LIVE pair rule, label vocabulary `human|agent|device:*|app:*`) removes the dialect. The row does **not** upgrade the trust story — the label stays owner-asserted, not kernel-enforced; removal stays prospective un-endorsement (wallet doc's three honest limits are restated verbatim in the row's spec text).
- *Keying:* on the **primary's address word** (never rewrites), so the future KEL/delegation backs it additively (P4 path a) — this is the reservation-shape requirement handed to the access-delegation lane.

**P2.3 Handler binding ("type author endorses handler app") — CONVENTION, NOT ROW.** Three independent reasons, any one sufficient:
1. **The semantics are still moving.** The ask's own prior art is the argument: Android spent 2014–2025 retreating from declaration-wins to verified links (assetlinks), and the web platform's `registerProtocolHandler` model is different again. Freezing a handler-binding vector now freezes a guess in the least settled corner of the candidate set; a wrong frozen vector is a pledge amendment, a wrong convention is a cookbook revision.
2. **No kernel or frozen-read consumer exists or is plausible.** Handler routing is client policy end to end (kernel-capability doc: "declaration ≠ default; type-author endorsement or user choice wins" — already specced as Shell chooser policy). It is the definition of Durable surface.
3. **A row cannot fix the named problem.** The squatting concern assumes a "type author" exists to endorse — but content-type TAGDEFs are **unowned Schelling points**; there is no protocol-level type owner for a row to designate. The actual defense is the one the system already has: bindings are ordinary claims graded through the viewer's lens — a squatter's binding is invisible unless the viewer's lens trusts the squatter. First-attester squatting is *already inert* under lens grading.

*The convention* (cookbook + reference SDK, so the dialect risk is bounded): `efs.os/handles` — TAG by the app author, `definitionId` = the app's handles TAGDEF, target = the contentType tagId, VAL tail = intent verbs. The OS default lens ships bindings from the OS vendor + user-chosen apps; user choice always outranks any declaration. **Re-check trigger:** demonstrated cross-client dialect harm in the wild, or a stabilized ecosystem shape worth freezing — revisit at the first post-launch table amendment window, if one ever opens.

**P2.4 Freshness beacon — CONVENTION, NOT ROW (nothing is missing).** The packages doc already built the TUF-timestamp analog entirely from frozen parts: the channel head PIN's `expiresAt` **is** the beacon; expired ⇒ STALE ⇒ GATE reads stop (RR5) ⇒ auto-update refuses with an honest label — the freeze-attack defense, natively. `expiresAt` is already an Etched claim-body word; STALE-stops-GATE is already normative. The only thing a row could pin is the key *name* (`head`) and VAL body layout — which no kernel path consumes and which the cookbook + SDK conformance vectors pin adequately. Minting a row here would spend freeze surface to duplicate an existing guarantee. **Ruling: bless the channel-head/beacon pattern in apps-cookbook §channels with SDK vectors; explicitly "convention, not row."**

**P2.5 Receipt/grant record schema — CONVENTION, NOT ROW, with the risk stated honestly.** The capability model that would emit these receipts is itself still [reasoned] and unshipped (kernel-capability doc); freezing a receipt schema before the capability system has survived one real iteration is freezing the least-tested shape in the whole candidate set. Receipts are consumed by clients and agents, never by the kernel or the frozen read path. As signed ordinary claims under a versioned user-key TAGDEF schema (`efs.os/receipt.v1`), they are portable, third-party-verifiable, and — crucially — **schema-evolvable** (new key versions are free under user keys; frozen rows cannot version). **The accepted cost, stated so it is a decision and not drift:** if cross-client receipt interchange ever genuinely needs a frozen vector, that will be a pledge amendment. We accept that risk because the no-kernel-consumer property means the row would buy uniformity only, and uniformity is purchasable by cookbook + conformance suite at any time.

**P2-adjunct — `claimedAt` (decided *with* the P2 candidates per freeze-gates A.8).** Owned by the **versioning-time lane**; the OS-side input this lane files: **support the blessed envelope-family body word (row-equivalent), not an app convention.** Reasoning: `claimedAt` exists to survive batch-collapse for *every* timeline/journal app; a per-app convention would fork the exact field whose predecessor (`seq`) is being renamed to stop apps mis-trusting it. Uniform placement (trailing optional word, `0=absent`, S7-checked, fixed canonical order with `expiresAt`) is what makes the P13 falsifiability rule (`claimedAt` checkable against `admittedAt`) implementable once, in the SDK, instead of N times per app. All four verify-time-model §2.4 canonicality obligations ride with it.

### P3 — Read-grade vocabulary extensions [DURABLE] — ADOPT the revision pass

All eight items are Durable (read-lens-spec versions freely; only its §0 pins are frozen). Adjudicated per item, with one structural rule imposed across all eight: **the closed base-grade set does not grow.** Extensions land as *qualifiers, causes, composition rules, and output schemas* over the existing grades — because every new base grade multiplies the conformance matrix and re-opens RR1 determinism.

1. **UNKNOWN cause taxonomy — ADOPT** as qualifiers over UNKNOWN (`UNKNOWN/NO-TRANSPORT`, `UNKNOWN/POLICY-DENIED`, `UNKNOWN/VENUE-MISS`), exactly the formulation boot-and-profiles already reached ("a presentation state over the UNKNOWN grade"). Making it protocol-normative (with vectors) is what stops the fork. "Not permitted to look" rendering as "not found" is the cardinal sin six of thirteen docs flagged; a cause word is cheap. The cause never changes resolution behavior — UNKNOWN still stops, whatever its cause.
2. **PENDING-LOCAL overlay composition — ADOPT.** The persistence doc's D4 rebase discipline is the draft; read-lens-spec should own the normative composition table: pending state composes *alongside* venue grades and never substitutes for one; on admission the venue-derived record replaces the speculative row; agents see the ladder state explicitly. Without this, every client invents its own optimistic-overlay honesty — the exact place lying is easiest.
3. **Composite closure grades — ADOPT.** Worst-of-inputs, venue-qualified composition over multi-record resolutions, plus a closure-completeness predicate over `BYTES-*` ("bootable offline" as a defined predicate). Required by P7's resolution discipline (below) and by FM-U10. Pure read-layer function.
4. **Grade→executability table — ADOPT.** LIVE/pinned = runnable; STALE = runnable-with-label (human) / stop (GATE); EQUIVOCAL = never auto-run; REVOKED closure = interactive-boot-behind-interstitial only (P12 posture). This is §3.3 specialized to code loading; it is the single cheapest way to make all conforming clients gate code identically.
5. **Machine-readable provenance tuples — ADOPT.** Resolver output schema `(author, venue, grade, currency, byteVerification, discoveryVsTrusted, lensPosition)` — agent taint-tracking needs data, not rendered strings. SDK surface.
6. **Post-local-state-loss degraded state — ADOPT.** After origin eviction everything falls to venue-qualified UNKNOWN until re-verified (persistence D7 already implements; normalize it so clients don't default optimistic). Pairs with P9.
7. **Rendering-locale-is-a-lens + pack-staleness disclosure — ADOPT** as an informative note plus a staleness-disclosure hook for safety-critical identifier display. Rides P2.1's `lang`/`dir` rows.
8. **§6.5 grammar additions — ADOPT** (lens-excerpt citation form; sender-lens-hint query key), with the privacy note made explicit: lens-excerpt exists precisely to disclose *one* resolving position without publishing the viewer's whole trust order — bounded disclosure is the feature.

### P4 — Actor and delegation [WORKSTREAM; owned by the access-delegation lane]

OS-side adjudication of the three paths, filed as this lane's position for the owning lane to confirm or overturn:

- **(a) Reserve the sibling slot — ADOPT.** Reserve delegated/attenuated signing + an `act` (on-behalf-of) convention word next to the KEL reservation, keyed on the primary's never-rewriting address word; reservation only, zero v2 machinery. The persona convention (P2.2) ships the presentation today; only the reservation ever makes attribution cryptographic. Reserving costs a format chapter + vectors; not reserving makes the eventual credential a pledge amendment.
- **(b) Client-receipt-only *forever* — REJECT as a permanent ruling.** The OS can operate under (b) indefinitely as a *fact*; ruling it *forever* forecloses the only path to verifiable attribution and post-compromise demotion, and contradicts the KEL trajectory the identity doc already dates (~2030). If the access-delegation lane finds the reservation shape unfreezable in time, the honest fallback is "(b) for now, reservation deferred to a named amendment" — not "(b) forever."
- **(c) 0x02/0x03 un-reservation schedule — ADOPT, decoupled from full KEL.** EIP-7951 is live on L1; the remaining 0x03 gate is byte-exact vectors from ≥2 authenticator families (envelope amendment 7). The client's entire key-custody ladder (rung 3) is capped until this lands. Needs an owner and a date on the freeze-gates watch list. Nothing about it requires KEL machinery.

**Requirements handed to the access-delegation lane** (so the reservation shape is right even though the machinery is post-freeze): (i) additive against the shipping persona convention — keyed on the primary word, honoring the P2.2 pair; (ii) **delegated revocation is the sharpest gap** — the OS's only pre-KEL kill switch is pre-signed revoke ladders (fragile, loseable); whatever is reserved should be shaped so a future delegated-revoke credential can subsume the ladder pattern; (iii) bounded pre-authorization (AP2-style mandates) may remain client policy in v2 — do not spend freeze surface on it.

### P5 — Signing legibility and bundle custody [DURABLE + DOCTRINE]

**P5.1 Canonical envelope summary — ADAPT, with one loud rejection.** The *recompute* half is adopted and is already the wallet doc's design: System Chrome derives the preview from canonical record bytes and independently recomputes every leaf digest and `recordsRoot` — preview equals signature by construction. The ERC-7730 descriptor (header fields) and ERC-8213-style digest cross-check are adopted as SDK/registry work. **REJECTED: hashing a summary INTO the signed struct.** The envelope struct `(author, seq/order, prev, recordsRoot, count)` is the byte-pinned Etched crypto surface; a `summaryHash` word is wire-breaking (typeHash change, all golden vectors) and adds nothing verifiable — `recordsRoot` already commits every byte the summary is derived from, so any conforming verifier can recompute the summary; committing a *derived* value buys no integrity and creates a new consistency obligation (summary-algorithm version pinned forever in the signature domain). This is a freeze-sensitive **reject** and is listed in §3.

**P5.2 Per-record risk-class taxonomy — ADOPT**, as an SDK-level conventional taxonomy with a **deterministic classification function** so wallets and Shells cannot fork "dangerous." Normative skeleton (the wallet doc's S0–S3, made record-intrinsic):

```
class(record, ctx):
  S3 if key ∈ {home, checkpoint, successor, persona-link pair, lens-root/deny-list keys}
     or record is a value-transfer / capability-grant shape
  S2 if op == REVOKE
     or (list charter appendOnly ∧ record is an entry edge)        // permanent
     or key ∈ safety-class expiry kinds (app-declared class table)
     or ctx.firstPublicPlacement                                    // context elevation
  S1 if kind ∈ {TAGDEF, DATA, LIST} creation
     or record is a chunk manifest
     or ctx.firstWriteUnderSubtree                                  // context elevation
  else S0
```

The conformance rule that makes it un-forkable: **the record-intrinsic class is a pure function of the signed bytes; context may only elevate, never lower.** Records above S1 are itemized individually, never aggregated (one dangerous record cannot hide among 400 harmless ones). Home: cookbook + SDK string catalog; vectors in the SDK conformance suite.

**P5.3 `.efs-bundle` — ADOPT as a protocol artifact.** Normative, venue-neutral container: versioned header (magic, format version, count) + signed envelope(s) and signatures **verbatim** (byte-preserving — a bundle is exportable protocol truth, never a re-encoding) + optional non-normative sidecar (submission progress, custody trail — mutable, unsigned, ignorable) + optional abort-artifact slot (the pre-signed revoke-all envelope, P5.4). The spec states plainly: **any holder may submit it; admission is clock-free; `expiresAt` decays currency and never blocks admission** (the "expiry protects you" truth-trap is banned from UI copy per the wallet doc). The container encoding is Durable (versionable); its *contents* are Etched signed bytes. Home: envelope-spec appendix. This closes the persistence doc's open protocol gap and P7's export lane with one artifact.

**P5.4 Pre-admission supersession — ADOPT the doctrine write-up; the answer derives from frozen semantics, so write it rather than design it:**
- A later-signed same-slot higher-`(order, recordDigest)` bundle **does** defang a leaked earlier unsubmitted bundle *for slot reads*: whenever the leaked claims land, they read SUPERSEDED, never winners. LWW does the work.
- It does **not** prevent admission (clock-free — banned divergence otherwise), does **not** erase the claims from history/enumeration, and **cannot** defang appendOnly entries at all (accumulation has no supersession, and K1 forces `expiresAt == 0` on them) — the leak-stickiest class, named as the un-abortable residue.
- Therefore the load-bearing defense is the **pre-signed revoke-all abort artifact** (pre-revocation legal; the G-set means the revokes win regardless of arrival order), armed at sign time, default ON for interactive bundles, enumerating the non-revocable residue at export. Doctrine home: envelope-spec appendix + cookbook; the wallet doc's custody rules 2–4 are adopted as the reference client behavior.

**P5.5 ERC-7920/7964 liaison — ADOPT.** One watch-list line in freeze-gates; the Merkle-profile divergence (positional tree, promotion, N=1 wrapped leaf) documented as a named profile. Already half-done in the wallet doc.

### P6 — Update-channel trust operations [DOCTRINE] — ADOPT wholesale

Everything requested is already consistent with frozen semantics and mostly already drafted in packages-and-updates: per-channel monotonic high-watermarks (client state, deliberately not a protocol grade); fast-forward rule (auto-follow never backward; user rollback always legal — rollback among locally-verified generations is a *read*, not a restore); backward-head = suspect-backward stop; the curator-compromise runbook (§8 of packages doc — ships **before** channels, adopted); deny-set freshness floor for auto-update (24h, venue-qualified — distinct from general read freshness); pre-KEL key-compromise incident playbook (currently client folklore — promote to ops-doctrine).

Two adjudication guards added:
1. **k-of-n curator quorum stays reader policy, never a grade.** The grade set cannot say "LIVE but below threshold" and must not learn to — quorum is client policy layered above resolution (the packages doc already places it there). Any future temptation to mint a quorum grade is pre-rejected here.
2. **The channel-monitor role is a commissioning decision for James**, not a doctrine sentence: client-side monitor checks ship at launch as courier duties (equivocation, backward-head, deny-flood on subscribed channels), but the *global observatory* is an unfunded workstream, and CT's lesson (transparency without monitors protected no one) means writing "monitoring exists" without funding it would be a false-confidence entry. Flag for an owner + budget.

### P7 — App-platform primitives [DOCTRINE; ruled: borderline-P2 resolves to NO rows]

**ADOPT** the blessed app-package convention into apps-cookbook; **RULE** that no part hardens into reserved rows for v2 — every record shape in the packages doc's table (app-root DATA, manifest DATA with canonical-CBOR hash, immutable release PIN + appendOnly ledger LIST, channel head PIN, curator attestation TAGs, provenance TAGs, deny facts) is expressible in the five kinds + existing rows, proven end-to-end including the full TUF mapping. App identity = `(authorIdentityWord, appRootDataId)`; version identity = manifest hash — adopted (never key-as-identity; never vanity path).

**The "atomic resolve-closure-at-pinned-root" ask — ADAPT: it dissolves into a resolution discipline, not a kernel operation.** The hazard named (per-record lens resolution mixing versions across an app's records; a partially-upgraded app as a security hole) exists only when closure entries are resolved *by path/lens per entry*. The correct rule, landed as a normative read-lens addition:

> **Closure-resolution discipline:** exactly one step of an app resolution is lens-resolved — the choice of manifest (channel head → release claim → manifest DATA). Every entry inside the manifest is **citation-pinned** (`packageId`, `releaseClaimId`, `contentCid` — the packages doc's `locked` triple) and is dereferenced by id, never re-resolved by path. Version-mixing is thereby impossible by construction. The composite grade of the closure is worst-of-inputs (P3.3); the completeness predicate over `BYTES-*` gates "bootable/installable offline"; any entry failing byte verification fails the whole closure (all-or-nothing, FM-U10).

This is stronger than an "atomic op" ask: it needs no new kernel surface, works on any venue, and is enforceable by the conformance suite. Language/font packs ride the same convention. `.efs-bundle` (P5.3) is the export/sneakernet lane.

### P8 — Read-path privacy as a normative obligation [DURABLE + DOCTRINE] — ADOPT, upgraded

James pulled privacy INTO this pass, so P8 upgrades from "worth adopting" to **normative now**: a read-path-privacy section in read-lens-spec + codex-bytes with SDK conformance items. Adopted contents: **bulk snapshot distribution** for lens lists, deny sets, discovery indexes, checkpoints (the OCSP→CRLite move — per-record live resolution traffic reconstructs the viewer's trust graph from query order alone); **one-head-per-venue revalidation semantics** (normative statement of what a single head/checkpoint fetch proves about N cached records of that author through N — the anti-timing-correlation invariant depends on it; lands in read-lens §5); **chunk-size normalization + prefetch/padding guidance** in codex-bytes (chunk fetch sequences fingerprint files through any relay); **OHTTP-cleanliness** (stateless, identifier-free read protocols) so relaying stays retrofittable. None of it is Etched; chunk-size guidance is parameters, not format. Depth beyond this (encrypted records, unlinkability limits) is the **privacy lane's**; the honest framing line — *privacy-possible, not private-by-default, never anonymous* — is adopted into the contract (§Contract N8).

### P9 — Private/encrypted tier + lens-config survival [WORKSTREAM] — ADOPT + this lane's design

**(a) The NOT-records tier — ADOPT as an explicit ops-doctrine ruling.** Device-local config, endpoint/transport grants, permission ledgers, default handlers: the anti-shape of permanent public data; blessed as encrypted-local/roaming *non-records* so nobody "fixes" a client by publishing them.

**(b) Encrypted-record convention — COMMISSIONED to the privacy lane** (HNDL-aware); this design consumes only already-reserved parts and must remain compatible with whatever it produces.

**(c) Where lens state lives — the design.** The finding being answered: *a silent wipe changing what a user sees is a truth bug* (the round's sharpest storage finding). The ruling: **lens/trust config MUST be restorable through at least one of three lanes, and the client MUST disclose which lane is active:**

1. **Published lens (public lane).** A lens is already data — a LIST (read-lens §1.1); LC2 already requires shipped defaults to be published-on-EFS lens objects. A user MAY publish their personal lens the same way: inspectable, subscribable, diffable, restorable from any device by resolving their own address. Honest cost: a published lens is the user's trust graph in plaintext, forever — a fingerprinting and social-graph gift. Correct for public curator roles; wrong as the default for individuals.
2. **Encrypted roaming record (private lane — the default design).** The user's lens/trust config (lens order, deny subscriptions, pinned lens versions, horizon settings) is one canonical CBOR document, stored as a **VAL-layout PIN at a deterministically-derived salted anchor**:
   - `salt = HKDF(K_root, "efs.os/lens-config.v1")`, where `K_root` is the existing at-rest root (passkey-PRF or wallet-HKDF, persistence D6). The anchor tagId derives under the reserved **`DOMAIN_ANCHOR_SALTED`** family; the salt never appears on chain and the anchor is unenumerable under the user's public tree.
   - Body encrypted under a per-config content key, wrapped via the reserved **`keyWrap`** row to a roaming key derived from `K_root` — never to the identity key (the [[identity]] G9 coupling rule: key-wrap targets independent of the author key, else theft = archive decryption).
   - Cardinality-1 PIN ⇒ LWW supersession ⇒ **lens-config history is a supersession chain** — the user can audit "what did my trust config say last month," a property no local-config design has.
   - **Device-loss recovery is fully deterministic from the identity ceremony alone:** fresh device → passkey/wallet ceremony re-derives `K_root` → re-derives salt → re-derives anchor tagId (offline keccak) → one point read of own slot → unwrap → restore. No directory service, no escrow server, no published correlation. Worked example in §6.1.
   - **Honest residuals, stated:** the claim's existence is public even if unlocatable-by-name (author word + timing on the claim — the P9 irreducible residual); HNDL applies to the wrapped body (long-lived trust metadata — PQ-wrap when the algoTag lands; interim honesty note in the cookbook); losing *both* passkey and wallet loses the lane (which is the identity LOSS row, not a new failure).
3. **Verified local backup** (persistence D8 lane) as the floor when the user refuses both on-EFS lanes.

**One flag to the privacy lane:** confirm the `DOMAIN_ANCHOR_SALTED` reservation wording does not preclude *deterministically derived* salts (HKDF-from-K_root) as opposed to random salts — the recovery property above depends on it. This is a reservation-*wording* check, not new surface.

**Private persona linkage — ADOPT the cookbook blessing** (salted anchor + encrypted link body, per the validated construction in wallet-and-actions §Persona privacy) and the four-layer honesty framing into the substrate doc, as the report asks. Same reserved parts as (c)-lane-2; no new Etched surface.

### P10 — Multi-device authorship [DURABLE/SDK] — ADOPT + this lane's design

The disease: two offline devices of one identity mint the same `order` (TID) ⇒ admit-both ⇒ the user is **self-EQUIVOCAL** — the worst grade in the vocabulary, self-inflicted by the innocent. The TID already carries 10 clockId/device bits (frozen layout; the SSB-death fix); what's missing is purely the allocation convention. Normative SDK-spec design:

1. **DeviceId space:** the 10 bits, values 0–1023. `deviceId` is *per (author word, device)* — the same physical device MAY hold different deviceIds for different author words.
2. **Roster-assigned allocation (default).** At device enrollment (wallet doc: a new device is enrolled *from* an existing one; the primary signs membership once), the enrolling flow assigns the **lowest deviceId not present in the author's device roster** and records it in the roster entry (the `efs.os/persona` label already carries `device:<name>`; extend the label grammar to `device:<name>:<id>`). The roster is the coordination point that already exists — no new record shape.
3. **Random fallback (walletless / single-device bootstrap):** uniform random from [0, 1023] at first sign; for a user's own k devices the self-collision probability is ~k²/2048 (two devices: <0.05%) — acceptable as a fallback, inferior to roster assignment, labeled as such.
4. **Local monotonicity guard (normative):** an SDK MUST never mint an `order` ≤ its own last-minted value for that author word (clock regression ⇒ queue or bump within the device's bit-space). This kills the same-device collision class outright.
5. **Clone/restore rule (the journal-handoff rule):** a device restored from another device's state (backup restore, VM clone) MUST re-enroll for a fresh deviceId before its first signature. Detection: the journal carries deviceId; a restored journal whose deviceId is already live in the roster on another sentinel is a clone until re-enrolled.
6. **Why not seq-range leases** (the persistence doc's alternative): leases require coordination state and fail exactly in the offline-offline case they exist to solve; deviceId partitioning is coordination-free *by construction* after one enrollment-time assignment. **Rejected as the mechanism; not needed as an optimization.**
7. **Honest scope:** per-device *keys* (personas, Axis 1) are the stronger default and make this moot for app writes — distinct author words never collide. The device-bit convention defends the **shared-author-word** case: chiefly the primary signing checkpoints/identity rows from two machines, and any persona a user deliberately runs multi-device.
8. **Vectors:** the conformance suite gains the self-equivocation pair — same microsecond, distinct deviceIds ⇒ distinct `order`s, no collision; same deviceId ⇒ SeqCollision admit-both ⇒ EQUIVOCAL (the prevented disease, demonstrated).

Not freeze-sensitive (the bits are already frozen; this is convention above them) — but it must be **normative-with-vectors in the SDK spec**, or third-party SDKs fork allocation and the collision returns through the side door.

### P11 — Bytes and web-interop [ETCHED-WINDOW for EFSBytes]

1. **SHA-256 digest word alongside keccak in chunk manifests — ADOPT.** Native import-map/SRI integrity speaks SHA-256/384; without the word the client re-hashes every module in the SW and forfeits browser-*enforced* module pinning — a security-posture loss, not just performance. Cheap field now; painful retrofit after the EFSBytes vectors freeze. Owner: codex-bytes/large-file-uploads; freeze-gates open-question line already exists — this adjudication converts it to "adopt, schedule."
2. **Chunk-size normalization** — adopted under P8.
3. **web3:// browser on-ramp — ADOPT the liaison task** (registerProtocolHandler safelist addition, coordinated with the ERC-6860 community; `ipfs`/`ipns`/`dweb` precedent). Client ships https-canonical + `web+efs://` alias meanwhile. Needs a named owner; standards work, not protocol work.

### P12 — Housekeeping — ADOPT

Banner/re-cut the three v1-stranded docs (efs-account-system B′, sdk-wallet-architecture, parts of sdk-vs-client-responsibilities) — they contradict the carrier/identity rulings (no ERC-1271 ever; author = recovered signer; smart accounts cannot author) and future agents keep citing them. Cheap, prevents recurring confusion (project memory already carries the caveat).
**REVOKED-closure boot posture — CONFIRM the client's answer:** a human may boot a REVOKED-but-locally-verified closure behind a loud interstitial (user rollback is a right; permanence makes it a read; deny facts warn-never-block for humans), and **agents get the GATE behavior: flat refusal** (REVOKED is never GATE-consumable, read-lens §3.3). This slots into the P3.4 grade→executability table.

### P13 — Timestamp-free-ID footguns [DURABLE + DOCTRINE; P1 is the enabler] — ADOPT all three

**(a) The normative untrusted-author-time rule** in read-lens-spec, extended per verify-time-model fix 3 to name `claimedAt` alongside the TID: *author-asserted time (`order`-derived tidTime AND `claimedAt`) is untrusted as real time; gate on admission time (P1), expiry, or checkpoints — never the claimed timestamp.* Plus the falsifiability rule: `claimedAt` is checkable against `admittedAt`, **anchored on the earliest/home `admittedAt`** (replica `admittedAt` is late and masks backdating — false negatives otherwise), with the +600s cap-slack tolerance; and the documented limit that **cross-author/cross-chain causal order is establishable only by citation edges**, never by any timestamp field.

**(b) The blessed social-app pattern** (apps-cookbook) — normative skeleton, this lane's deliverable:

1. **Ordering:** feed/comment/thread order = **venue admission order** (the discovery index is admission-ordered and venue-labeled) or an explicit curator list. NEVER the claimed TID or `claimedAt`. Cross-venue feeds interleave per-venue admission streams with venue chips — no total order exists and the UI must not fake one.
2. **Replies cite the exact version:** a reply carries a citation-form REF (`~claim:<claimId>`) to its target, never a bare path. At render, a SUPERSEDED cited claim triggers the "edited since this reply" affordance — supersession is never silently followed for citations (read-lens §4.3).
3. **Edit history is rendered:** the supersession chain (`supersessionCount` + `priorClaimId` walk, spine-reachable) is one interaction away on any edited post. EFS is *better* than centralized platforms here — edits cannot be hidden — but only if apps show them; hiding the chain is a conformance failure of the pattern.
4. **Replica honesty:** a cherry-picked/partial replica grades UNKNOWN-CURRENCY, never LIVE (§5.1); feeds render per-venue as-of ages; **counts ("N likes") are indexer artifacts, never GATE-consumable, never rendered as on-chain truth.**
5. **Precedence/prediction claims** ("said it first," "predicted it") are assertable only via admission time: the earliest known `admittedAt` is a hard upper bound on age; a claimed-early record with no early admission anywhere is rendered with the backdate flag. **Depends on P1** — without it this row of the pattern is unimplementable, which is the sharpest single argument for P1.
6. **Author-time display:** `claimedAt` MAY be displayed as "author says: <t>" — always visually distinct from admission time, never used for ordering, flagged when it fails the falsifiability check.

**(c) The findable tradeoffs section — ADOPT** (one "known tradeoffs of the timestamp-free ID / what this design gives up" section, P13c; the scope doc already leans greenlight). The contract's never-list (§5) is a compressed draft of it.

---

## 3. FREEZE-SENSITIVE RESERVATIONS (the loud section)

Everything this lane's adjudications touch on the frozen surface, each with **row / convention / reject** and why. Items owned by other lanes are marked ⇒.

| # | Item | Disposition | Why |
|---|---|---|---|
| F1 | `admittedAt[claimId]` stored per-claim state word + read-ABI exposure | **ROW-equivalent (Etched storage + ABI word) — ADOPT** | store-it-or-lose-it (views can't mint state; events fail getProof/4444/100-yr); fenced out of all comparators (mirror the `prev` fence); priced into freeze-gates A2. ⇒ final width/encoding: versioning-time lane |
| F2 | `isAdmitted(claimId[])` batch | **NOT Etched — view-contract recipe** | aggregation over existing state; kernel-minimality doctrine |
| F3 | `lang` (BCP-47) reserved key | **ROW — MINT** | content-metadata family parity (`contentType` et al.); reproducible rendering of signed content; accessibility-critical; grammar validated read-side |
| F4 | `dir` (ltr/rtl/auto) reserved key | **ROW — MINT** | rides with F3; trivial vector |
| F5 | persona-link pair (`efs.os/persona` TAG + `efs.os/primary` PIN) + label word | **ROW — RESERVE (layout + vectors; machinery client-layer)** | red-team-confirmed; identity-adjacent family; dialect-forking is a spoofing surface; keyed on primary word so KEL backs it additively |
| F6 | `act` / delegated-signing sibling slot | **RESERVE** ⇒ access-delegation lane owns shape | this lane rejects "client-only forever" (P4b); reservation requirements filed in §P4 |
| F7 | handler-binding key | **CONVENTION, NOT ROW** | semantics unstable (Android's 2014–2025 retreat); no kernel consumer; unowned type TAGDEFs mean a row can't designate a "type author" anyway; lens grading already neutralizes squatting. Re-check trigger named |
| F8 | freshness-beacon key | **CONVENTION, NOT ROW** | fully expressible today: head PIN `expiresAt` + STALE-stops-GATE already Etched/normative; a row would duplicate an existing guarantee |
| F9 | receipt/grant record schema | **CONVENTION, NOT ROW** | capability model itself unshipped — would freeze the least-tested shape; no kernel consumer; schema needs versioning (impossible in a frozen row); pledge-amendment risk accepted explicitly |
| F10 | envelope `summaryHash` word (P5.1 "hashed into") | **REJECT** | wire-breaking (typeHash + 42 vectors) for zero verifiable gain — `recordsRoot` already commits every input byte of any summary |
| F11 | `claimedAt` optional trailing claim-body word | **SUPPORT AS ROW-equivalent (OS input)** ⇒ versioning-time lane owns | uniform placement is what makes the P13 falsifiability rule implementable once in the SDK; inherits the S7/canonical-order/0=absent/fuzz obligations (verify-time-model §2.4) |
| F12 | `seq → order` rename | **SUPPORT** ⇒ versioning-time lane owns | mechanism-inert but wire-breaking (typeHash string); must precede envelope freeze; not restated here |
| F13 | SHA-256 per-chunk word in EFSBytes manifests | **MINT before EFSBytes vectors freeze** | browser-enforced SRI/import-map pinning; cheap now, painful retrofit |
| F14 | `.efs-bundle` container format | **NOT Etched — Durable protocol artifact** | container versions freely; contents are Etched signed bytes verbatim |
| F15 | device-bit allocation convention | **NOT freeze-sensitive — SDK-normative with vectors** | the 10 bits are already frozen; allocation is convention above them |
| F16 | P3 grade qualifiers/causes/composition | **NOT freeze-sensitive — Durable** | stated explicitly to prevent scope creep into the closed Etched set; base grades do not grow |
| F17 | lens-config roaming record | **NO NEW SURFACE — uses reserved `DOMAIN_ANCHOR_SALTED` + `keyWrap`/`contentEncryption` rows** | one wording check ⇒ privacy lane: the salted-TAGDEF reservation must not preclude deterministically-derived (HKDF) salts — device-loss recovery depends on it |
| F18 | quorum / "LIVE-below-threshold" grade | **REJECT (pre-emptive)** | quorum is reader policy above resolution, never a grade — guards the closed set |

**Net new Etched cost of this lane's adjudications:** one stored word per claim (F1, priced in A2), four reserved rows (F3, F4, F5-pair counted as two keys + label vocabulary), one EFSBytes manifest word (F13). Everything else is convention, Durable spec, or rejection. Rows *not* minted (F7, F8, F9) are explicit rulings with named re-check triggers — decisions, not silence, per the kickoff's rule.

---

## 4. Classic-FS dispositions touched by this lane (rule-3 compliance)

| Classic feature | Disposition | How / why |
|---|---|---|
| File timestamps: mtime | **RE-HOMED** → `claimedAt` (author-declared, untrusted, falsifiable against admission) | P13(a); never an ordering input |
| File timestamps: ctime/birthtime | **RE-HOMED** → `admittedAt` (trustworthy, per-chain, venue-labeled) | P1.3; the only real clock |
| File timestamps: atime | **DECLARED GONE** | reads leave no trace — a privacy feature, stated as such |
| File-type associations (open-with) | **RE-HOMED** → lens-graded `efs.os/handles` convention + user choice | P2.3; a write-time registry is an artifact of the one-registry world |
| App installation / package registry ("directory tree as deployable unit") | **NATIVE via convention** | P7: five kinds + existing rows suffice, proven end-to-end incl. TUF mapping; closure-resolution discipline replaces the "atomic op" reflex |
| User profile / dotfiles / trust config | **RE-HOMED (three lanes)** | P9: published lens (public) / encrypted PIN at deterministic salted anchor (private, default) / verified local backup (floor); silent loss is a truth bug |
| Multi-device same-user editing | **RE-HOMED** → per-device keys (default) + device-bit convention for shared author words | P10 |
| watch / inotify (update discovery) | **DECLARED GONE at protocol level; re-homed** → single jittered head/checkpoint fetch + content-addressed snapshot distribution | P6/P8; push is an artifact of the live-server world; ⇒ general poll-pattern blessing: graph lane |
| Quotas on app writes | **DECLARED GONE** → gas is the quota; persona *budgets* are client policy (capability table), never protocol | wallet doc; deny-by-downgrade |
| Atomic multi-file update (the closure) | **NATIVE, stronger than POSIX** — one signature over the DAG; cross-*author* atomicity stays inexpressible | P5/P7; contract N9 |

---

## 5. THE OS-FACING CONTRACT

*The one-page statement the next OS pass designs against. "FS layer" = the Etched kernel + envelope + the Durable read/lens layer as adjudicated in this pass. Each clause is traceable; conditional clauses name their gate.*

### What the FS layer guarantees the OS

- **G1 — Unconditional authenticity.** Every record self-verifies from its bytes alone (one EIP-712 signature over a Merkle root; author = recovered signer), at any venue, offline, and after every chain that carried it is dead. Authenticity never degrades; only currency does.
- **G2 — Deterministic reads.** Same admitted set + lens + deny set + evidence + clock ⇒ byte-identical resolution on every conforming client (RR1; acceptance test 16). The OS may build attribution chrome on this and it will not fork.
- **G3 — Deterministic write identities.** ClaimIds and object ids are client-computable before signing; a dry-run names the exact ids that will exist; re-submission is an idempotent no-op. The OS gets exactly-once *semantics* over at-least-once *transport* for free.
- **G4 — Atomic authored batches.** One signature commits an arbitrarily large single-author record DAG atomically (all-or-nothing per venue), resumable in chunks by anyone.
- **G5 — Inherent history.** Objects are permanent; claims are revocable; a revoked slot reads EMPTY (never resurrects); superseded claims stay reachable with SUPERSEDED disposition. Undo = re-assert. Nothing is ever silently absent.
- **G6 — An honest, closed grade vocabulary.** PRESENT/PROVEN-ABSENT/UNKNOWN with anti-fallthrough (UNKNOWN never resolves as absent); EQUIVOCAL never serves as LIVE; STALE is always distinct from REVOKED; enumeration ≠ endorsement; discovery counts are never machine-consumable. Extensions arrive as qualifiers and composition rules (cause taxonomy, pending-overlay, closure composition, executability table — P3), never as new base grades.
- **G7 — State-provable verification.** Every grade is verifiable from `eth_getProof`-provable state reads plus presented evidence — no log-scan dependence. Light clients over untrusted endpoints are a supported reader class. *(Evidence discovery — finding a duplicity pair — may be an indexer job; verifying it never is.)*
- **G8 — A per-chain trustworthy clock.** *(Gate: P1 adoption + A2 gas sign-off — adopted by this pass.)* `admittedAt[claimId]` is kernel-stamped, stored, provable, venue-labeled. It anchors cooldowns, freshness, backdate detection, and precedence claims. Author-asserted time (`order`-time, `claimedAt`) is falsifiable against it.
- **G9 — Permissionless writes, read-side control.** Nobody can prevent a write; nothing the OS does can be blocked at the write layer either. All control is the reader's: ordered lenses, first-attester-wins, deny-sets that subtract after resolution. Exclusion is a read-fact, never a write-gate.
- **G10 — Replication portability.** Records and revokes replay identically on any venue (clock-free admission; nothing admissible here is permanently rejectable there). Venue plurality splits availability, never authenticity. A `.efs-bundle` in anyone's hands is submittable forever.
- **G11 — Reads leave no trace.** There is no atime, no on-chain read log; read privacy is the client's to protect (P8 obligations) and the protocol's to not undermine.
- **G12 — A stable reserved surface.** The kind table, reserved-key rows (including this pass's `lang`/`dir` and persona-link reservations), derivation math, and envelope shape freeze once. The OS can compile record shapes against them for the life of the system; additive evolution happens only through pre-reserved slots.

### What the FS layer will never give the OS

- **N1 — No global clock, no global order, no global "latest."** Cross-chain currency does not exist and will not be simulated. Every currency statement is venue-qualified (HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY). Design every surface to carry the qualifier.
- **N2 — No trustworthy author-claimed time, ever.** `order` and `claimedAt` are untrusted forever; backdating is unbounded by construction. The only clock is admission — per-chain, non-portable. Anything ordering-sensitive must use admission order or citation edges.
- **N3 — No hard delete, no delete-for-everyone.** Revocation empties the author's own slot; bytes and graph shape persist. Community removal is deny-shaped and per-reader. Crypto-shredding (privacy pass) is the only "truly gone."
- **N4 — No actor below the author key in v2.** Human, agent, device, and app writes are indistinguishable on-chain; attribution is owner-asserted convention (the persona pair) until the reserved delegation/KEL surface activates. **Delegated revocation does not exist** — pre-signed revoke ladders are the only kill switch; plan custody around that.
- **N5 — No push.** Pull/poll world. "Did anything change" is head/checkpoint fetches and snapshot diffs; the protocol will not call you.
- **N6 — No query language.** Point reads, per-tagId enumeration, and (⇒ search lane) a bounded multi-tag line on-chain; everything richer is indexer/The Graph territory, honestly labeled as indexer trust.
- **N7 — No shipped trust roots.** No protocol default lens, no default relayer endpoint. Whatever the OS ships as a default must be a published, inspectable, ejectable EFS object (LC2/LC6).
- **N8 — No authorship privacy.** The author word, timing, and funding/submission trails are public by construction (author = recovered signer *is* the verification model). EFS is privacy-possible, not private-by-default, never anonymous: payload and linkage privacy are buildable (reserved parts); graph/authorship privacy is not.
- **N9 — No cross-author atomicity.** One envelope, one author. "Alice and Bob both sign or neither lands" is not expressible; coordinate above the FS layer.
- **N10 — No write-time schema enforcement** beyond LIST charters and reserved-row typing. Validation is a read-side/lens concern; the kernel will never gain `CREATE CONSTRAINT`.

### Conditional surface the OS should track (gates + owners)

| Clause | Gate | Owner |
|---|---|---|
| G8 trustworthy clock | P1 in the A2 gas bundle | James (freeze-gates) + versioning-time lane shape |
| AS-OF currency / restore-as-of | checkpoint activation (A1) | James, one line |
| Cross-author enumeration (discovery index) | P12 gas sign-off; indexer-lane fallback specced either way | James |
| `order` rename + `claimedAt` word | freeze-gates A.8 (wire-breaking; pre-freeze) | James + versioning-time lane |
| Delegation/`act` reservation shape | this pass | access-delegation lane |
| Multi-tag AND on-chain line | this pass | search/graph lane |
| Encrypted-record depth | this pass (privacy pulled in) | privacy lane |

---

## 6. Worked examples

### 6.1 Lens-config survives total device loss (P9 lane 2)

Alice's phone (her only device) is destroyed. New phone, EFS client fresh install:
1. Alice completes the identity ceremony: passkey (synced) PRF → `K_root` re-derived. (Fallback: deterministic wallet signature → HKDF.)
2. Client derives `salt = HKDF(K_root, "efs.os/lens-config.v1")` → derives the salted anchor tagId offline (keccak, no network).
3. One point read: `getSlot(deriveSlot(alice, anchor))` at her home venue → the winning PIN → `getClaim` → ciphertext body.
4. `keyWrap` unwraps under the K_root-derived roaming key → canonical CBOR → lens order, deny subscriptions, pinned lens versions, horizons restored.
5. The client renders "trust config restored from your own records (as of <admittedAt>, venue-qualified)" — and the restored config's *supersession chain* is available if Alice wants to audit past states.

No third party learned which record was hers by name; the anchor was never enumerable. What an observer always knew: Alice's author word wrote *something* at some time (N8's irreducible residual). Failure mode: passkey AND wallet both lost ⇒ this is the identity LOSS row ([[identity]] amendment 1), not a new failure of this design.

### 6.2 The leaked bundle (P5.4)

Bob signs a 40-record bundle (35 revocable claims, 5 appendOnly entries), exports it, and the file leaks. (a) Bob flushes the pre-signed **abort artifact**: 35 REVOKEs land multi-venue — pre-revocation is legal, so they win even where they arrive *before* the leaked bundle; wherever the leak is later submitted, its 35 claims admit and immediately read EMPTY-on-revoke. (b) The 5 appendOnly entries admit and stick (K1: `expiresAt == 0`, no supersession of accumulation) — exactly the un-abortable residue the export ceremony enumerated at export time. (c) Nothing anywhere *prevented* admission — clock-free admission held; every defense was read-side. This is the honesty shape the `.efs-bundle` spec text must carry.

### 6.3 The social thread under attack (P13 pattern)

Mallory back-dates a comment's `claimedAt` and TID to 2019 to fake a prediction. Under the pattern: the feed orders by admission (her comment renders where it *landed*); her record's earliest known `admittedAt` is 2026 ⇒ the "author says 2019" display carries the backdate flag (falsifiability rule, anchored on earliest admission); her reply-targets are citation-pinned, so editing her own earlier post after Bob replied flips Bob's citation to "edited since this reply" with the supersession chain one tap away. On a replica missing half the thread, everything renders AS-OF/UNKNOWN-CURRENCY with venue chips — never as the complete conversation.

---

## 7. Failure modes register (named, per adjudication)

| # | Failure mode | Defused by | Residual |
|---|---|---|---|
| FM-O1 | Cooldown/freshness anchored on author time ⇒ gameable updates | P1.3 + freshness re-anchoring (verify-time-model fix 6) | until P1 lands: first-observation time, strictly-later so fail-safe |
| FM-O2 | Replica `admittedAt` masks backdating (late admission = huge ceiling) | anchor falsifiability on earliest/home `admittedAt` | needs home reachability or an imported home checkpoint |
| FM-O3 | Grade-vocabulary dialects across clients ("not permitted" rendered as "not found") | P3.1 cause taxonomy made normative + vectors | none if conformance-tested |
| FM-O4 | Persona-stitching dialect exploited to render a hostile key as "you" | P2.2 frozen pair shape + both-LIVE rule | label is still owner-asserted, not cryptographic (until P4/KEL) |
| FM-O5 | Handler-binding convention forks per client | reference convention + SDK + lens grading | accepted; named re-check trigger |
| FM-O6 | One dangerous record hidden in a 400-record batch preflight | P5.2 deterministic S-classes; context-only-elevates rule | client that ignores the SDK taxonomy; conformance suite is the lever |
| FM-O7 | Leaked signed bundle admitted years later | LWW defang (slot reads) + abort artifact | appendOnly residue — permanent by design, enumerated at export |
| FM-O8 | Silent lens-config wipe changes what the user sees | P9 three-lane restorability MUST + disclosure of active lane | user who refuses all three lanes; the client says so |
| FM-O9 | Self-EQUIVOCAL from two offline devices | P10 deviceId allocation + local monotonicity + re-enroll-on-clone | same-deviceId clones pre-re-enrollment |
| FM-O10 | Published lens config = permanent trust-graph fingerprint | P9 private lane as individual default; publication is a choice | claim existence/timing residual (N8) |
| FM-O11 | Closure entries lens-resolved per record ⇒ version-mixed app | P7 citation-pinning discipline + composite grade | apps that bypass the discipline; conformance + executability table |
| FM-O12 | Quorum smuggled into the grade vocabulary, breaking the closed set | F18 pre-emptive reject; quorum = reader policy | — |
| FM-O13 | "Expiry protects you" truth-trap in bundle UX | banned copy (P5.3/P5.4); abort artifact is the real control | — |
| FM-O14 | Transparency-without-monitors (channels nobody watches) | client-side monitor duties at launch; observatory flagged for funding | observatory uncommissioned — James decision |

---

## 8. Handoffs

- **James (freeze-window decisions raised or sharpened here):** F1 admittedAt into the A2 bundle (sequencing: before the gas snapshot); F3/F4 `lang`/`dir` mint; F5 persona-link reservation; F13 SHA-256 chunk word; channel-monitor/observatory commissioning + owner; 0x02/0x03 un-reservation owner + date; P12 banner pass greenlight.
- **Versioning-time lane:** F1 field shape/width; F11 `claimedAt` placement (this lane's OS-side input: blessed word, not convention); F12 rename sequencing; the freshness re-anchoring edit to read-lens §5.2/§9.C.
- **Access-delegation lane:** F6 reservation shape with the three OS requirements (§P4); the P4(b)-not-forever adjudication to confirm or overturn.
- **Privacy lane:** F17 salted-TAGDEF wording check (deterministic salts); encrypted-record convention that P9 lanes 2/persona-privacy consume; HNDL guidance for long-lived wrapped bodies.
- **Search/graph lane:** the N6 line (multi-tag AND / traversal); the blessed poll pattern the OS's "did anything change" rides on.
- **Read-lens-spec next revision (Durable, batched):** P3 items 1–8; P1.1 wording; P1.2 view-recipe appendix; P7 closure-resolution discipline; P8 privacy section; P13(a) rule; P12 executability row.
- **Apps-cookbook:** P2.3 handler convention; P2.4 channel/beacon pattern; P2.5 receipt schema; P7 app-package pattern; P9 private persona-link + lens-config conventions; P13(b) social pattern.
- **Envelope-spec appendix:** P5.3 `.efs-bundle`; P5.4 pre-admission supersession + abort-artifact doctrine; P5.5 liaison line.
- **SDK spec:** P5.2 risk classes + vectors; P10 device-bit convention + self-equivocation vectors; provenance-tuple output schema (P3.5).
