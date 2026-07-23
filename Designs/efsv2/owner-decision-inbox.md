# EFS v2 + OS — owner decision inbox

**Status:** draft decision inventory under sequencing hold; no choice is adopted until James answers and it is copied into [[owner-rulings]]
**Audience:** James first; designers second
**Last reconciled:** 2026-07-23
**Inputs:** [[owner-rulings]], [[assumptions-and-requirements]], [[ethereum-first-efs-and-os]], [[mountable-filesystem-semantics]], [[fs-pass-james-decisions]], [[privacy-james-decisions]], [[read-lens-spec]], [[onchain-completeness]], [[solana]], and [[client-os-pressure-report]]

#status/draft #kind/decision #repo/planning #topic/efsv2 #topic/clientv2 #blocked-on/human-decision

> **This is the sole live owner queue for EFS v2 and cross-cutting OS architecture.** Detailed documents remain the reason trail. Future agents must not revive a source checkbox classified here as settled, evidence-gated, delegated, or superseded.
>
> **2026-07-23 clarified sequencing hold:** this page is presently the canonical **inventory**, not a packet agents should ask James to batch-answer. Re-run the joined KEL/authority and lens/resolver passes against native mounts, Solana/independent realms, required on-chain enumeration, and signed local/network modes before presenting a consolidated packet. Preserve adopted rulings, but revalidate every unanswered option and recommendation first. James may still volunteer an isolated answer; record it without treating adjacent bundled assumptions as adopted. See [[owner-rulings]] and [[ethereum-first-efs-and-os#11. Research-to-MVP sequence]].

## How to answer

After the sequencing hold is lifted, reply with codes, for example `N1A, N2A, N3A, N4A, N5A, N6A, Q1A–Q5A`. James may answer an isolated item during the hold, but bundled codes adopt only the explicitly described dimensions. Add exceptions in plain English. `N2A except N2h` adopts the boundary set except its host-lane item.

Where an item labels option **A** recommended, that is provisional research advice, not an adopted answer. N1A is explicitly a prior recommendation pending decomposition and revalidation.

**Research posture, not another decision code:** [[ethereum-first-efs-and-os]] records James's current desire to make EFS deeply useful to Ethereum while exploring a broader cypherpunk OS and avoiding premature universal abstractions. Its Shapes A–E remain hypotheses until evidence changes a choice in this inbox and James records a ruling.

## Provisional architecture-choice inventory — revalidate before asking

### N1 — Strong authority without a cross-chain empire

**Example:** Alice's phone key is stolen, revoked, and then used to backdate a malicious record. What shared evidence lets a reader reject it without making one EFS operator the universal hub?

> **UNDECIDED and not presently answerable as one bundled code.** The options below are retained as research inventory, not current recommendations. Before N1 is presented again, the joined pass must separate at least:
>
> 1. whether the strongest grade requires admission-time authority at all;
> 2. one fixed EFS profile, permissionless independent realms, or per-principal homes;
> 3. whether v2 includes no cross-chain machinery, only explicit adapters/commitments, or any locator/migration mechanism;
> 4. whether the filesystem and social/OS layer share an authority venue;
> 5. whether portability means one required Ethereum profile with extension-ready seams, several supported realms, or eventual support for any conforming deployment; and
> 6. legacy-EOA commitment, smart-account inception, personal transferability, and signature-suite succession.

- **N1A — One fixed EFS authority profile. Prior research recommendation, not adopted.** Strongest history comes from admission on one measured authority domain; zero-setup EOAs can publish portable evidence immediately but remain evidence-only until admitted. Clients can verify remotely; foreign contracts need an adapter or disclosed local commitment. No universal cross-chain hub and no same-principal home migration in v2.
- **N1B — Permissionless independent EFS realms.** Each realm can offer strong local history. This preserves venue sovereignty but requires profile discovery, realm-aware grades, and explicit non-interoperability between realms.
- **N1C — Portable evidence only.** No canonical admission witness. Simplest and most object-sovereign, but post-revocation backdating and current authorization remain policy-dependent.
- **N1D — Per-principal authority homes.** Every principal chooses a home. This adds locators, multi-home reads, adapters, migration, and a much larger recovery/proof surface.

**The previous N1A bundle also included:** ship the KEL-aware seam before v2 freezes; make legacy-EOA upgrade commitment default-on with an explicit degraded opt-out; let smart-account-only users make one direct inception call; do not treat ERC-1271/6492 as eternal record authority; make personal principals non-transferable while organizations use control succession; and reserve a narrow same-domain successor mechanism for future signature suites. These dimensions must not be silently adopted together merely because one topology is chosen.

**Not chosen here:** actual venue, receipt bytes, finality, or successor ABI. Those wait for E1. [[solana]] supplies the first non-EVM capability map and prototype gates; it does not add another option or decide N1. Details: [[assumptions-and-requirements#Strong-authority hypothesis to prototype next]], [[kel#23. Decisions for James]], and [[fs-pass-james-decisions]].

### N2 — Constitutional system boundaries

**Example:** without one shared boundary, a contract designer may promise global queries, an OS designer may promise anonymity, and a preservation UI may label one uploaded copy “permanent.” Those products cannot all be honest.

- **N2A — Adopt the complete boundary set below. Recommended.**
- **N2B — Adopt with named exceptions.** Reply with the bullet codes to change.
- **N2C — Defer the bundle.** The joined protocol/OS recut remains blocked because later specs can choose incompatible meanings.

| Code | Boundary | Simple example |
|---|---|---|
| **N2a** | “100 years” means active preservation: authoritative reads, exports, reconstruction, repair, migration, and cryptographic renewal | One Arweave upload is not yet a 100-year service |
| **N2b** | “Works on-chain” means complete durable state plus bounded keyed queries on the authority venue; clients compose global/cross-chain views | A contract can resolve a known key, not search every chain |
| **N2c** | Lenses are typed, purpose-scoped policies compiled reproducibly into bounded execution; the risk bearer chooses | An installer uses a stricter lens than a photo viewer |
| **N2d** | Public by default; opted-in/sensitive content can be confidential, but EFS never promises anonymity | Encryption can hide a filename, not necessarily that an author wrote |
| **N2e** | EFS OS is least-authority: apps have no ambient network, wallet, identity, decryption, filesystem, DOM, or trusted-pixel power | A game receives a save handle, not the user's whole drive |
| **N2f** | Packages are reproducible hash-addressed closures; activation makes health-gated rollback generations; policy-sensitive updates fail closed | A compromised channel cannot silently swap the running bytes |
| **N2g** | Recoverable and shreddable private data use independent random roots; shared data is not honestly shreddable; roots never derive from wallet signatures | Recovering family photos must not resurrect a destroyed diary |
| **N2h** | Browser-first is the distribution goal, but confinement claims are per measured host lane; served-header/native lanes are allowed | Safari may need a weaker or differently hosted lane than desktop Chrome |
| **N2i** | Design for 50 principals normally and a provisional 256-principal portable ceiling; benchmark before freezing | A community lens with 200 curators must still work on a mid-range phone |

Details: [[assumptions-and-requirements#Owner decision register]] D-8–D-16, [[ops-doctrine]], and [[web-os-thesis]].

### N3 — Canonical private invitation discovery

**Example:** Bob wants strangers who know his public identity to send an encrypted invitation without first exchanging a secret off-platform.

- **N3A — Reserve a minimal announced-invite feed with an epoch. Recommended.** Preserve the future path without adding a stealth record kind or forcing every user to scan.
- **N3B — Do not reserve it.** Direct sharing and self-derived pseudonyms still work; stranger invitations become a later convention.

This does **not** turn on a stealth meta-address during onboarding; that later default is L13. Details: [[privacy-james-decisions]] JD-8.

### N4 — Honest private-subtree behavior

**Example:** renaming an encrypted folder should not unexpectedly require re-encrypting every descendant—or claim bulk unlock when the formula is broken.

- **N4A — Drop the broken bulk-unlock formula. Recommended.** Keep private dirnodes and explicit child capabilities; add a future opt-in tree scheme only for new trees.
- **N4B — Freeze the repaired construction now.** Accept whole-subtree rekeying when a folder is renamed.

Details: [[privacy-james-decisions]] JD-36.

### N5 — Joined-system anchor application

**Example:** a preserved game must remain retrievable, verifiable, safely runnable, writable, curatable, rollbackable, and exportable. That exposes integration gaps a generic “platform” demo hides.

> **UNDECIDED.** [[playable-archive-requirements]] is a conditional pressure test. Its existence does not select N5A or make the archive a v2 launch requirement.

- **N5A — Make the playable software archive the first joined-system reference app. Recommended.** It sequences work and acceptance tests but does not permanently define EFS OS.
- **N5B — Keep it as only one test fixture.** Choose another daily retention app before sequencing delivery.
- **N5C — Use another anchor.** Name the replacement before proceeding platform-first.

Details: [[playable-archive-requirements]] and [[apps-cookbook]].

### N6 — Ratify the reviewed privacy policy batch

**Example:** designers should not repeatedly ask whether wallet signatures derive archive keys, whether private records leak filenames, or whether shared data is truly shreddable.

- **N6A — Ratify the reviewed product/policy batch, subject to technical gates. Recommended.** This adopts the privacy posture, ceremony choices, honesty language, and future-feature gates summarized below. Exact cryptographic algorithms, encodings, vectors, and maxima still require independent review.
- **N6B — Ratify with named exceptions.** Cite JD numbers or describe the exception.
- **N6C — Keep the batch advisory.** Every item remains potentially reopenable during recut.

The batch includes committing AEAD; random independent roots; encrypted dirnodes at launch; explicit recovery artifacts; no on-chain recipient graph; honest eager/lazy removal semantics; client-side viewing keys; walk-away tests; and gates before shreddable/team/live-session claims. N3, N4, L13, L14, and L15 remain separately timed choices. Details: [[privacy-pass-synthesis]], [[privacy-james-decisions]], and [[privacy-freeze-reservations]].

## Provisional wire and safety inventory — revalidate before asking

Each is independent. These are small, but freezing the opposite accidentally would be expensive.

### Q1 — Rename `seq` to `order`

**Example:** app developers keep treating `seq` as trusted time or a nonce; it is only author-controlled ordering.

- **Q1A — Rename it to `order`. Recommended.** Regenerate the wire type hash, vectors, and wallet label during the freeze.
- **Q1B — Keep `seq`.** Preserve the misleading name forever in the frozen wire format.

Details: [[fs-pass-james-decisions#3. `seq` → `order` rename (freeze-gates A.8a)]].

### Q2 — Always include `claimedAt`

**Example:** a photo can testify “taken Tuesday,” while the venue only proves “this claim existed by Friday.” Neither is authoritative freshness.

- **Q2A — Include an always-present `uint64 claimedAt`; `0` means absent. Recommended.** It is testimony only, never a comparator or authorization input.
- **Q2B — Omit it from v2 forever.** Applications encode any performed-at claim in payloads instead.

Details: [[fs-pass-james-decisions#2. `claimedAt` row (freeze-gates A.8b)]].

### Q3 — Public collaboration model

**Example:** two strangers concurrently edit a public document. A deterministic private-team op fold cannot honestly solve open-world spam, forks, and curation.

- **Q3A — Public/open-world collaboration uses revision DAGs plus curation; deterministic op folds are for private/closed containers. Recommended.** Remove “public” from the op-fold promise.
- **Q3B — Keep one op-fold model for both.** Accept the unresolved open-world governance burden.

Details: [[fs-pass-james-decisions#7. B3 demotion ratification (reverses a blessed pattern)]].

### Q4 — Checkpoints stay ordinary claims

**Example:** a copier proves Alice's state only through order 500. Readers can say “as of 500,” but the kernel does not choose a canonical head among competing checkpoints.

- **Q4A — A checkpoint is an ordinary reserved-key claim. Recommended.** It bounds reads; add no kernel HEAD/current/fork-choice machinery.
- **Q4B — Add special checkpoint machinery.** Specify the consensus/fork-choice semantics before freeze.

Details: [[read-lens-spec#5.2 Checkpoints are ordinary claims (pins P7; critic C4)]].

### Q5 — Reference SDK safety default

**Example:** an installer cannot reach an author's authority home while deciding whether to run an update.

- **Q5A — Fail closed by default; warnings require an explicit override. Recommended.** Safe ecosystem default, with a disclosed escape hatch.
- **Q5B — Warn and continue by default.** More available, but unsafe defaults will become sticky across apps.

Details: [[read-lens-spec#Open questions]].

## Decide after evidence — do not answer yet

These are real owner acceptance gates. Engineers choose exact mechanisms; James chooses whether measured cost, usability, or product degradation is acceptable.

| ID | Example and eventual options | Evidence required | Recommendation after evidence | Details |
|---|---|---|---|---|
| **E1 Authority venue** | Base/L2, Solana, L3, or another fixed profile | admission/rotation/recovery cost; finality/force inclusion; proof latency; independent RPC/state reconstruction; mandatory bounded queries | exactly one measured v2 profile | [[assumptions-and-requirements#Strong-authority hypothesis to prototype next]], [[solana]] |
| **E2 Aggregate kernel cost** | accept full body + indexes + revocation state, trim optional surfaces, or reject the on-chain promise | one combined gas/state snapshot including every mandatory direction | accept only against the complete bill, not isolated cheap calls | [[onchain-completeness]], [[freeze-gates]] |
| **E3 `admittedAt`** | store + batch-read it, or explicitly degrade trustless time | measured incremental state/read cost and two consumers | store if the complete snapshot is tolerable | [[fs-pass-james-decisions#1. The `admittedAt` + index bundle (P1) — the pass's biggest lever]] |
| **E4 Author enumeration** | full author index or roots-forward + orphan-tail | gas/state plus recovery benchmark | smallest mechanism that still guarantees complete discovery | [[onchain-completeness]] |
| **E5 Definition enumeration** | paginated schema/definition index or omit | same snapshot plus two real contract consumers | include only if genuinely cheap | [[onchain-completeness]] |
| **E6 Lens ceiling** | 50, 100, or 256 portable principals | two compilers; cold/warm mobile benchmarks; adversarial fixtures | 50 normal, 256 portable if measured | [[read-lens-spec]] |
| **E7 Host lanes** | static-only, served-header, and/or native support claims | Chrome/Firefox/Safari/iOS cage matrix | browser-first with honest per-lane claims | [[client-os-pressure-report]], [Client evidence queue](../clientv2/owner-decision-inbox.md#decide-after-evidence--do-not-answer-yet) |
| **E8 Render vocabulary** | small declarative schema, constrained HTML, or another IDL | a real Files/archive app; accessibility and frame budget | smallest System-Chrome-owned vocabulary that passes | [[kernel-capability-model]] |
| **E9 Merge-rule location** | protocol word, typed payload, or package convention | collaborative replay prototype + canonical encoding comparison | freeze only irreducible replay semantics | [[fs-pass-james-decisions]], [[apps-cookbook]] |
| **E10 Recovery acceptance** | ship mainstream flow, restrict it, or redesign | formal model plus nontechnical recovery trials | no mainstream claim until ordinary people recover safely | [[kel]], [[privacy-james-decisions]] |
| **E11 Public metadata budget** | accept, coarsen, or redesign KEL/receipt/index/funding metadata | minimization review and adversarial correlation analysis | publish the measured leakage plainly before acceptance | [[privacy-james-decisions]], [[kel]] |

## Decide at launch or when resourcing exists

| ID | Choice with a simple example | Options | Recommendation / trigger | Details |
|---|---|---|---|---|
| **L1 Curators** | who may auto-update the default OS channel? | named first parties; independent set; user-only/manual | independent k-of-n before auto-update | [[packages-and-updates]] |
| **L2 Endpoints + RPC privacy** | first run needs RPC/storage without silently selecting an observer | first-party; community set; user-required; fund OHTTP relay | publish operators/logging/control graph; no silent RPC | [Client network privacy](../clientv2/network-privacy.md), [[privacy-james-decisions]] JD-13 |
| **L3 Denied package boot** | an investigator needs an old revoked game | forbid; manual behind warning; unrestricted | manual only behind System Chrome warning, after harm testing | [[boot-and-profiles]] |
| **L4 Observatory** | detect channel split views and compromised curators | fund/staff; community-only; make no monitored claim | fund before claiming monitoring | [[packages-and-updates]] |
| **L5 Browser liaison** | standards work affects `web3://` and EFSBytes access | name owner; consortium; defer mainstream claim | name before browser-mainstream positioning | [[ops-doctrine]] |
| **L6 Operate infrastructure** | EFS project runs gateways/relays that see abuse and metadata | operate; partner; code-only | only with legal/logging/abuse/succession capacity | [[ops-doctrine]] |
| **L7 Product name** | EFS OS vs Cyphos/Cypher OS | adopt; test shortlist; keep EFS OS | user test and trademark/domain review near launch | [[web-os-thesis#Naming — **[open]**]] |
| **L8 Preservation words** | may UI say “permanent”? | permanent; preserved; reconstructable-with-evidence | use “preserved/reconstructable with current evidence” | [[ops-doctrine]] |
| **L9 Preservation classes** | critical roots need more fault domains than cache data | one class; tiered horizons; user-configured | price separate classes after controller prototype | [[ops-doctrine]] |
| **L10 Renewal after EFS** | signatures/formats age after the project disappears | endowed keeper; consortium; permissionless bounty; hybrid | explicit funded hybrid before long-horizon claims | [[ops-doctrine]] |
| **L11 Publication complete + repair** | one replica says upload succeeded; another is corrupt | first copy; independent full retrieval; quorum | no “preserved” until independent full retrieval; conservative repair | [[ops-doctrine]] |
| **L12 Steward exit** | maintainers vanish | informal fork; signed succession; complete exit package | ship graph/blob exports, vectors, builds, provider state, and succession plan before mainnet | [[ops-doctrine]] |
| **L13 Stealth onboarding** | publish a meta-address for every new user? | default-on; explicit opt-in; omit | explicit opt-in after scanning/privacy costs are known | [[privacy-james-decisions]] JD-9 |
| **L14 Public disclosures** | users may confuse confidentiality with anonymity or quantum safety | concise labels; full ceremony; defer feature | exact privacy/quantum/GDPR/hardware-wallet disclosures before feature claims | [[privacy-james-decisions]] |
| **L15 Timestamp privacy** | fine-grained times correlate a private user's activity | exact; coarsened private tier; user choice | coarsen privacy-tier defaults if it preserves needed semantics | [[privacy-james-decisions]] JD-22 |
| **L16 P-256/WebAuthn** | passkey can sign directly once the profile is safe | activate; keep wrapped software keys; staged opt-in | assign owner/date only after vectors, review, and transition staffing | [[kel]], [[client-os-pressure-report]] |
| **L17 Guardians** | social recovery can help or enable collusion | launch; later opt-in; do not support | mainstream base stays passkey sync + independent cold factor; guardians later | [[kel]] |

## Already settled — do not ask again

- Native envelope kernel; EAS carrier dropped; five-kind tag-core.
- Durable archive: no free ephemeral record tier; writes are paid on-chain, with optional community relayers.
- Chains are assumed to persist and remain queryable. Keep pruning/reconstruction defenses, not chain-death machinery.
- KEL is required; bare EOA is the zero-state path. Passkey sync plus an independent cold factor is the mainstream recovery baseline.
- Durable unlinkable personas are separate KELs grouped locally; disposable stealth addresses are one-shot.
- Public by default plus a client sensitivity layer; contracts consume public data only.
- A read-only mounted EFS projection is required on Linux, macOS, and Windows; Linux FUSE alone is not completion. Exact adapters and support floors are delegated evidence gates. See [[mountable-filesystem-semantics]].
- On-chain plus Arweave, with replaceable optional mirrors.
- Mandatory automatic indexing for admitted on-chain data, including required backlinks, address/list/redirect directions, best-mirror and content-hash lookup, full-body spine, and revocation-aware live counts. Only measured shape/cost remains.
- No universal on-chain collision bit. Untrusted safety-critical authors need challenge-window or tighter policy.
- `act` is provenance only; KEL grants authorize.
- No wallet-signature-derived encryption roots, on-chain read receipts, or plaintext private metadata.
- `contractReadable` is the floor; EFSBytes is immutable at freeze; bytes are L2/L3-first and blob use remains reserved.
- Ranked/full-text/global/unbounded analytics stay off-chain.

## Delegated technical gates — not owner votes

Protocol and security owners must resolve exact index layouts, live-count mechanism, receipt bytes, crypto suite/vectors, WebAuthn/PQ vectors, control maxima, event shapes, EIP-170 splitting, and the cross-platform mount adapters/name/error/metadata profile through prototypes, independent review, and conformance tests. Escalate only if the result changes a boundary, safety promise, product degradation, or irreversible wire choice listed above.

Vault routing mechanics—the inbox hierarchy, generated roll-ups, and historical indexes—are delegated documentation process. They are not EFS architecture rulings and may be improved during consolidation.

## Superseded questions — never revive silently

- Per-principal L1 homes and migration text in [[kel]] is superseded by its correction banner and N1's current authority hypothesis.
- Reserve-KEL-until-2030 and smart-wallet exclusion text in [identity](./identity.md) is superseded by the KEL pass.
- Pre-KEL actor alternatives in [[client-os-pressure-report]] are historical.
- The proposed exact-slot collision summary conflicts with the adopted no-collision-bit ruling.
- Full-body/no-elision and mandatory indexing are adopted; old “pending ratification” labels are stale.
- The dual “public archive/private-by-default OS” posture is superseded by public-by-default plus sensitivity policy.
- EAS substrate and chain-death questions are historical inputs, not live v2 forks.

## Recording rule

When James answers:

1. append the dated answer and caveat to [[owner-rulings]];
2. mark the item here `ADOPTED`, `REJECTED`, or `DEFERRED`; and
3. replace conflicting source checkboxes with a link here instead of copying a second live answer.

`owner-rulings.md` is the authoritative history. This inbox is the authoritative list of what still needs an owner answer.
