# 2026-07-11 — EFS v2 deep privacy pass (record)

**Status:** done
**Target repos:** planning, contracts, sdk
**Depends on:** [[privacy]], [[fs-pass-synthesis]], [[fs-pass-freeze-reservations]]

#status/done #kind/review #topic/privacy

## What ran

James's charge: a deep privacy pass — cutting-edge crypto research usable on Ethereum/web, app autopsies (Fileverse lead), ZK if wranglable, broad options + deep passes on what they mean for EFS; most data public but OS users need privacy (multi-wallet, collaboration, secret config, specific files); graph privacy nice-to-have; reserve/design-around so privacy/anonymity can be added later; EFS working well is the priority.

**Round 1 (12 agents):** 8 lanes — frontier-stealth, frontier-zk, read-privacy, autopsies, layer1-crypto, metadata-adversary, os-private-tier, law-positioning; 3 red teams — attack-frontier, attack-layer1, attack-os-tier; binding critic. Two agents died on API errors mid-flight (os-private-tier wrote no file; attack-layer1 wrote no file); attack-os-tier honestly reconstructed the missing OS design from the surrounding corpus and audited that; the critic named both holes as GAP-1/GAP-2 and consolidated the rest ([critic.md](2026-07-11-privacy-pass-corpus/critic.md)).

**Repair round (4 agents):** attack-layer1 re-run (found the round's one freeze defect: F-2 does not compose with F-1 — pulled from the ceremony; plus the X-Wing anonymity-is-classical-only honesty finding and the hardware-wallet gap); os-private-tier re-run as the design of record (W1–W6, config classes, R-GAP3 FEK discipline, the §5.6 collab-transport spec); attack-os-tier-2 against the real design (found the shred-ring concurrency FATAL — repaired by gating the shreddable tier, JD-31); critic addendum ([critic-addendum.md](2026-07-11-privacy-pass-corpus/critic-addendum.md)) — final F-batch rulings, gap-closure ledger (all closed or assigned), verdict: complete and consistent to synthesize from.

## Verdict and headline results

**The pass held.** No fatal-and-unrepairable finding; two round-1 critic rulings were corrected by the repair round (F-2 pulled; the arm-(B) FEK sketch withdrawn) — the machinery working as intended.

1. **Privacy demands almost no frozen surface.** Ceremony delta = one pinned derivation function (A-1 blinded-name, four-pinned, with golden vectors) + four row-TEXT amendments (A-3 "opaque" occurrence keys · A-4 self-escrow property · A-5 open `encryptionKey` blob (the linchpin) · A-6 key-privacy + classical qualifier) + two optional James items (JD-8 stealth announce genesis line; JD-36 F-2+F-2b). Both privacy.md §9 "now-or-never" hedges killed (stealth derivation domain, ZK commitment/nullifier row — both Durable/rejected).
2. **Launch tiering:** private files + wrapped sharing + **encrypted dirnodes** (private folders) at launch; salted-TAGDEF family is the post-freeze addressable tier; stealth/ZK/PIR are roadmap. The private tier **splits**: recoverable vs shreddable (mutually exclusive per key hierarchy); shared/team content recoverable-only forever; shreddable gated on the shred-ring single-writer discipline.
3. **Stealth:** self-derived fleets blessed (no announcements, no scanning, seed-recoverable, not quantum-retro-linkable); announced stealth = rare-invite with quantum-expiry honesty; the relay model closes the Umbra-class funding-linkage hole; lens tension solved via client-config lenses; meta-address rides the open blob.
4. **ZK:** narrow-yes as conventions (zero rows); broad-no line written; **Fileverse's "zk-granular-permissions" contains no ZK** (verified from source) — a false premise removed.
5. **Honesty ledger:** the quantum-expiry line (PQ content secrecy, classical-only recipient unlinkability), the hardware-wallet gap, `claimedAt=0` is not timing privacy, the canonical residual sentence, positioning + banned words blessed with four markups.
6. **24-item kill list** across both critic files; 38-decision sheet for James.

## Outputs

- [[privacy-pass-synthesis]] — ruling record (canon PC-1–PC-14, kill list, amendments ledger)
- [[privacy-freeze-reservations]] — ceremony input (exact texts)
- [[privacy-james-decisions]] — JD-1–JD-38
- [[privacy]] — corrected in place (Fileverse claims, §9 hedges, §10 marked run, tiering/tier-split notes)
- Corpus: [2026-07-11-privacy-pass-corpus/](2026-07-11-privacy-pass-corpus/) — 8 lanes + 4 red teams + critic + addendum (~600 KB)

## Owed work (assigned; only codex am.8 is launch-relevant — launch-blocking for private folders, +1-record fallback exists)

- James: JD-8 + JD-36 before the ceremony; the rest of the sheet on his cadence.
- OS/collab lane: JD-31 (shred-ring discipline + fixture), JD-32 (inbound-share recovery), JD-33 (rotation serialization + roster rule), JD-34 (live-session eviction), JD-35 (doc fixes), C-L/C-M clarifying amendments to os-private-tier.md.
- Kinds owner: codex am.8 (`efs.os/dirnode` PIN shape) — **launch-blocking for private folders** (the +1-record fallback exists, so not now-or-never).
- Ceremony sheet: cut A-1/A-3/A-4/A-5/A-6; vector suite gains domain-distinctness + E4 pre-blinding cases.
