# Nostr & Secure Scuttlebutt as signed-record substrates — autopsy for the EFS substrate investigation

**Agent:** nostr-ssb · **Date:** 2026-07-02
**Method note:** Primary sources = the NIPs repo, the SSB protocol guide/handbook, the Planetary/Nos pivot post, the Manyverse/PZP launch post, and the arXiv Nostr measurement study. Adoption numbers come from secondary aggregators and are flagged for staleness where used. All URLs inline.

---

## 0. Verdict in one paragraph each

**Nostr** is the closest existing thing to what EFS's v2 journey is converging on: a *portable signed artifact* whose ID is a pure content hash (no chain, no relay, no domain binding), verifiable anywhere forever, with dumb interchangeable storage servers. It proves the portability property is achievable and cheap. It also proves what you lose without a consensus substrate: deletion is advisory (NIP-09 is a *request*), "what's current" is last-write-wins on a self-asserted timestamp, storage is a courtesy that decays (relay churn, 95% of free relays underwater on costs), and spam defense fragments into per-relay policy because signatures are free. Identity = raw keypair with no rotation; every retrofit (NIP-26, NIP-41) has stalled or been marked unrecommended. Nostr thrived on simplicity + censorship events + Bitcoin money; it has not retained users, and it is *not* an archive — it is a best-effort message bus.

**SSB** is the opposite experiment: it bolted authenticity to a per-author total order (append-only hash-chained log). That bought real per-author consistency — revocation-as-later-log-entry is *provable within a feed*, spam was structurally absent because replication followed the follow-graph — and it killed the protocol. One keypair = one device forever (a second device forks the feed and permanently corrupts it), no deletion ever (GDPR-hostile, users hated it), no partial replication, a broken JSON canonicalization spec that made second implementations nearly impossible, and backwards-compat paralysis that prevented every fix. Its own core developers (Planetary → Nostr in 2023; Staltz → PZP, then exit in 2024) wrote the post-mortems. SSB is the strongest available evidence that **coupling authenticity to a total order you don't need is fatal**, and that **identity/key rigidity cannot be retrofitted away**.

---

## 1. Nostr

### 1.1 Architecture primer (NIP-01)

- One object type: the **event** — `{id, pubkey, created_at, kind, tags, content, sig}`.
- `id = SHA256(serialize([0, pubkey, created_at, kind, tags, content]))`. The serialization **contains no relay or network identifier** — an event is a free-floating signed artifact. Signature is BIP-340 **Schnorr over secp256k1** (64 bytes). ([NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md))
- `created_at` is set by the author; relays *may* reject far-future/past timestamps but there is no trusted time. This matters enormously below.
- **Kind ranges define storage semantics** (this is Nostr's whole data model):
  - *Regular* events: relays store all.
  - *Replaceable* (kinds 0, 3, 10000–19999): per `(pubkey, kind)` only the **latest** event MUST be stored — latest by `created_at`, tiebreak "lowest id (first in lexical order)".
  - *Addressable* (30000–39999): per `(pubkey, kind, d-tag)` only the latest is stored.
  - *Ephemeral* (20000–29999): not stored at all.
- Relays are dumb WebSocket stores answering filter queries (`REQ`), with `OK`/`AUTH` machinery ([NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md) for auth). Anyone can run one; clients talk to many.

**EFS translation:** addressable events are Nostr's version of EFS's *slot* concept — identity = `(author, kind, name)`, current value = latest signed statement. Nostr resolves "latest" by self-asserted timestamp + lexical hash tiebreak, i.e. **it has EFS's PIN-slot supersession semantics but with gameable ordering** — an author (or key thief) can backdate/postdate at will, and two relays can disagree about which version they ever saw. EFS v1/v2 gets real ordering from the chain; this is precisely what a consensus substrate is buying.

### 1.2 Revocation & mutability — the honest answer is "advisory, and it shows"

Primary source: [NIP-09 Event Deletion Request](https://github.com/nostr-protocol/nips/blob/master/09.md).

- Kind 5 event with `e`/`a` tags naming the author's own events. Renamed from "Deletion" to "Deletion **Request**" — the spec is explicit that this is a request, not an operation.
- Relays **SHOULD** delete or stop publishing referenced events with identical pubkey; relays **SHOULD keep publishing the deletion request itself indefinitely**, and clients SHOULD rebroadcast it to relays that missed it. (The tombstone must outlive the corpse — a deletion system where the *retraction* is the permanent artifact.)
- Clients MUST validate pubkey match themselves; "relays… should not be treated as authoritative."
- Spec verbatim limitation: it is "**impossible to delete events from all relays and clients**."
- **Un-deletion is impossible**: "Publishing a deletion request event against a deletion request has no effect." Revocation is monotone.
- For addressable events, `a`-tag deletion applies to all versions up to the request's `created_at`.

Escalation paths that grew later, revealing the pressure:

- [NIP-62 Request to Vanish](https://github.com/nostr-protocol/nips/blob/master/62.md): kind 62, "fully delete any events from the pubkey", optionally `ALL_RELAYS`; relays must also prevent **re-broadcast of deleted events back in** (they must remember what they deleted — a tombstone index), and honor it even for non-paying users. Spec says the procedure is "legally binding in some jurisdictions" — this is the GDPR/right-to-erasure valve. Still purely advisory network-wide.
- [NIP-40 Expiration Timestamp](https://github.com/nostr-protocol/nips/blob/master/40.md): author-declared TTL; relays SHOULD drop after expiry. Advisory again.
- Replaceable/addressable kinds are the *mutability* story: "edit" = publish a newer event at the same address. Old versions are not guaranteed gone (any relay or client may hold them), so this is supersession-without-erasure — structurally identical to EFS's supersededUID pattern, minus any authoritative ordering.

**What actually happens in practice:** every serious client shows "deleted" notes greyed or hidden if it has seen the kind 5; relays vary wildly; mirrors/archives (e.g. relay operators running full archives) simply keep everything. Users are told at signup that delete is best-effort. This is the Nostr community *living with* advisory deletion — tolerable for ephemeral social chatter, and even there NIP-62 had to be invented for legal exposure. For a system of record (EFS's claims: PIN/TAG/MIRROR placement, moderation, lens curation), advisory revocation means **a reader can never distinguish "not revoked" from "revocation withheld"** — the same withholding problem the mission brief flags under hard part (a).

### 1.3 Spam & sybil — signatures are free, so the cost moved to the edge

Key generation is free and instant; there is no protocol-level write cost. Consequences observed:

- **The 2024 "ReplyGuy" wave**: bots on disposable pubkeys replying at scale with near-identical content. Countermeasures were all edge-side: strfry's `enableGlobalDuplicateCheck` (dedupe identical content across pubkeys), write-policy plugin scripts, and Iris marketing a "ReplyGuy-free" experience by hiding replies from outside your social graph. ([strfry](https://github.com/hoytech/strfry), [usenostr relay guide](https://usenostr.org/relay.html))
- **[NIP-13 Proof of Work](https://github.com/nostr-protocol/nips/blob/master/13.md)**: difficulty = leading zero bits of the event id; nonce tag carries a *committed target* (so grinding a low target that luckily hits high difficulty doesn't count); **PoW is outsourceable** because the id doesn't commit to the signature — a phone can buy work from a PoW service. Adoption reality: optional, niche, used by some spam-protected relays; it never became the network's spam answer. PoW prices out phones before it prices out GPU spam farms — the asymmetry Hashcash always had.
- **Paid relays**: exist (87 paid vs 625 free in the 2023 measurement — see §1.4), work locally, and fragment the network into fee islands; the same study found paid relays' uptime was *not* better than free ones.
- **Web-of-trust filtering**: relays and clients that only accept/show events from pubkeys within N follow-hops of a trust anchor. This is the approach that actually works day-to-day — and it is *exactly* EFS's lens concept (per-viewer trusted-attester scoping), applied at both read time and relay-admission time.

**Lesson shape:** with free signatures, spam defense inevitably decomposed into (i) an economic cost at *some* choke point (paid relay / PoW / nothing), plus (ii) trust-graph scoping at read time. Nostr never found a protocol-wide answer; it has a marketplace of relay policies. EFS currently gets (i) from gas — which is a *good, uniform, sybil-proof write cost* — and already has (ii) as lenses. Any move off-chain must consciously re-buy (i).

### 1.4 Consensus on existence / what's current — there is none, measured

There is no global view and no guarantee any event persists anywhere. The empirical picture, from the best measurement study ([arXiv 2402.05709, "An Empirical Analysis of the Nostr Social Network", measurement window Jul–Dec 2023](https://arxiv.org/html/2402.05709v2)):

- 712 relays analyzed (911 identified), 17.8M posts, 1.5M pubkeys, 616M post-replications.
- **Replication is accidental and enormous**: median ~34.6 replicas per post; 93% of posts on multiple relays; 98.2% of client download traffic was redundant re-fetching (144 TiB wasted in six months).
- **Churn is real**: 50% of relays had 99%+ uptime, but 20% were down >40% of the period, and 132 relays died outright (offline >1 week at study end). Storage on a relay is a courtesy; nothing detects or repairs the loss of the *last* copy.
- **Economics**: 95% of free relays could not cover operating costs from donations. Free-rider storage decays.
- Concentration: US hosted 85% of posts; top relay held 73% of posts.

Protocol-level responses:

- **[NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md) / the outbox model** (Mike Dilger, 2023): each user publishes a kind 10002 relay list ("write" relays = where my events live; "read" relays = where to mention me); clients maintain a pubkey→relay routing table and fetch an author's events from *the author's declared* write relays. Spec guidance: keep the list small (2–4 relays). This fixes *routing/discovery* ("where would her events be if they exist") — it does nothing for *existence* ("do they still exist"). Adoption was slow and remains partial; incomplete feeds, orphaned replies and missing quoted notes are the canonical outbox-advocacy complaints ([whynostr on outbox](https://www.whynostr.org/post/8yjqxm4sky-tauwjoflxs/), [nostrify outbox docs](https://nostrify.dev/relay/outbox)).
- **[NIP-77 Negentropy Syncing](https://github.com/nostr-protocol/nips/blob/master/77.md)**: range-based set reconciliation (from strfry) letting two relays/clients diff event sets cheaply. This is the LOCKSS-grade replication primitive — it exists and works, but nothing *mandates* who syncs what; there is no replication contract, only volunteers.
- **[NIP-03 OpenTimestamps Attestations](https://github.com/nostr-protocol/nips/blob/master/03.md)** (marked *unrecommended*): optional Bitcoin anchoring of event existence-time. The one attempt to give events a consensus timestamp is deprecated in the index.
- **"What's current"** for replaceable/addressable events = latest self-asserted `created_at`, lexical-id tiebreak, evaluated independently by every relay/client over whatever subset of events it happened to receive. Two honest clients can permanently disagree. There is no fork *detection* — unlike SSB, equivocation isn't even visible.

**Lesson shape:** Nostr demonstrates the exact failure mode EFS's hard part (c) predicts. Give up the consensus substrate and "exists / is current" becomes (i) probabilistic, (ii) per-observer, and (iii) silently revisable by timestamp games. Set-reconciliation (negentropy) plus content-addressing recovers *convergence of copies* but not *authoritative currentness*.

### 1.5 Portability — Nostr's genuine triumph

- The event id hashes only author/time/kind/tags/content — **no relay, no network, no chainId, no domain separator binding it to any infrastructure**. Any event can be rebroadcast to any relay, archived in a file, verified offline in 20 lines of code, forever. Verification needs only the event bytes + secp256k1 Schnorr. This is precisely the "portable chain-free authorship signature" EFS's journey step (4) is reaching for — and Nostr proves the ergonomics: a whole ecosystem (dozens of interoperable clients/relays in the first year) grew *because* the artifact is this simple.
- Contrast explicitly with EAS: even EAS's *offchain* attestations bind a chainId in their EIP-712 domain; Nostr shows the domain-free design works at scale and is what makes "your data outlives any server" true.
- Blob layer: [Blossom](https://github.com/hzrd149/blossom) stores blobs on plain HTTP servers **addressed by SHA-256 of the bytes** — same blob, same address on every compliant server; clients verify locally and fail over freely. ([NIP-B7](https://nips.nostr.com/B7); older [NIP-96 HTTP File Storage](https://nips.nostr.com/96) is server-assigned-URL based and is being displaced by Blossom's pure content addressing.) Nostr independently converged on EFS's MIRROR pattern: identity-of-bytes = hash, location = fungible, verify-don't-trust at the client.
- One EVM-relevant caveat: BIP-340 Schnorr is **not** `ecrecover`-compatible. A signed artifact standard intended to be *cheaply verifiable on EVM chains as well as offline* should stay with ECDSA/secp256k1 (ecrecover) or budget for an on-chain Schnorr verifier. Portability of the *verification algorithm* across a century (and across substrates, including the EVM itself) is part of hard part (e).

### 1.6 Identity & key management — the unsolved wound

- Identity = the pubkey (npub). **No rotation, no recovery, no revocation of the key itself.** If the nsec leaks: "your account is permanently compromised… no password reset, no account recovery"; a million-follower account cannot be reclaimed ([Soapbox key guide](https://soapbox.pub/blog/managing-nostr-keys/), [D-Central key security](https://d-central.tech/nostr-key-security/)). The only remedy is **social recovery**: sign a "moved to new npub" note with the old key (if you still can) and hope followers migrate.
- **[NIP-26 Delegated Event Signing](https://nips.nostr.com/26)** — delegation token = Schnorr sig by the root key over (delegatee pubkey, conditions like kind/time ranges). Officially marked "**unrecommended: adds unnecessary burden for little gain**" in the NIP index; clients/relays dropped it because *every read path* has to validate delegation conditions forever. Lesson: identity indirection bolted on as an optional overlay imposes O(everything) validation cost and dies of non-adoption.
- **NIP-41 key migration** — two generations of proposals ([fiatjaf's key-invalidation draft, PR #158](https://github.com/nostr-protocol/nips/pull/158); [pablof7z's simple account migration, PR #829](https://github.com/nostr-protocol/nips/pull/829)): pre-commit a successor key (whitelist ahead of time), later publish a migration event; clients treat it as a hint to re-follow. Still not merged/standard as of the Dec 2025 W3C-list discussion ([public-nostr thread](https://lists.w3.org/Archives/Public/public-nostr/2025Dec/0000.html)). Note the load-bearing design point that *did* survive review: **the successor must be committed before compromise** — post-hoc rotation is unauthenticatable, because the thief holds the same key you do.
- **[NIP-46 remote signing / "bunker"](https://github.com/nostr-protocol/nips/blob/master/46.md)** keeps the nsec off client devices (a signing daemon authorizes per-event). This is Nostr's smart-account-shaped UX answer — note it changes *custody*, not *identity*: the identity is still the one unrotatable key.
- **[NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md)** maps pubkeys to DNS names (`name@domain`) — a human-readable alias that quietly reintroduces DNS/webserver trust; widely used precisely because raw keys are unusable as social identity.

**Lesson shape:** Nostr is the clean experiment for hard part (e)'s first horn: maximally portable signatures (raw key, no domain) ⇒ zero identity durability. Everyone in the ecosystem knows it; every fix is either unrecommended, unmerged, or a custody workaround. The one principled mechanism that emerged — *pre-committed successor keys, migration as a signed, replayable event history* — is exactly a portable, chain-free "identity log," i.e., the thing a smart account does on-chain, re-expressed as signed data.

### 1.7 Where Nostr thrived, where it failed, and why

**Thrived:**
- **Censorship moments**: created ~2020 by fiatjaf; Damus hit the App Store Feb 2023 and was removed from China's App Store within two days by government directive — instant credibility for the model; usage spikes around Twitter/X policy shocks and the 2024 Brazil X ban ([Wikipedia](https://en.wikipedia.org/wiki/Nostr)).
- **Money and ideology**: Jack Dorsey gave ~$250k BTC in 2023 and a reported $10M to a Nostr dev collective in 2025 (Wikipedia; secondary). Lightning "zaps" gave it a native micropayment culture.
- **Radical simplicity**: NIP-01 fits in a page; dozens of interoperable clients/relays appeared within a year. Contrast SSB (§2.5): implementability is adoption.
- **Protocol generativity**: "Other Stuff" — long-form, live streams, marketplaces, Blossom file managers ([Bloom](https://github.com/Letdown2491/bloom)) — because the event primitive is generic.

**Failed / failing:**
- **Retention**: cumulative pubkeys ≥18M by May 2023 (Wikipedia — cumulative, misleading), but DAU in the low tens of thousands at best: ~36k WAU / <15k DAU (Oct 2024), ~3.7k DAU by one Oct 2025 tracker; growth "flatlined… may have even declined" through 2025 despite better apps ([stats.nostr.band](https://stats.nostr.band/), [socialcapitalmarkets aggregation](https://socialcapitalmarkets.net/crypto-trading/nostr-statistics/), [glukhov overview](https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/) — all secondary, treat magnitudes not precision). Spike cohorts (Brazil) mostly didn't stay.
- **Spam** (§1.3) and **key UX** (§1.6) are the two self-identified adoption killers.
- **Relay economics** (§1.4): storage altruism decays; the network's persistence story is "someone probably kept a copy."

---

## 2. Secure Scuttlebutt

### 2.1 Architecture primer

Primary source: [Scuttlebutt Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/).

- **Identity = an Ed25519 keypair**, no registration, "typically represents a person, a device, a server or a bot" — note the guide's own phrasing concedes person≈device.
- **Feed = append-only log**: each message carries `previous` (hash of prior message), `sequence` (1-indexed), author, self-asserted timestamp, content, and an Ed25519 signature over the **canonical JSON** of the message. Authenticity and *ordering* are welded together: a signature only validates in its chain position.
- **Blobs**: content-addressed attachments (`&<base64 sha256>.sha256`), fetched on demand, garbage-collectable — the mutable-social-log/immutable-content split EFS also uses (DATA vs MIRROR-ish).
- **Replication = the follow graph**: you replicate feeds you follow, display 2 hops, fetch (but don't show) 3 hops. **Pubs** = always-on peers with public IPs (invite-based) bridging NATs; **EBT** (epidemic broadcast trees + vector clocks) makes gossip efficient. Offline-first: sync over LAN/Bluetooth was a first-class scenario (the founding story: Dominic Tarr on a sailboat with intermittent internet, 2014 — [Wikipedia](https://en.wikipedia.org/wiki/Secure_Scuttlebutt)).

### 2.2 Revocation & mutability — none, by construction, and users punished them for it

- The [handbook FAQ on deletion](https://github.com/ssbc/handbook.scuttlebutt.nz/blob/master/faq/basics/data-delete.md) is explicit: "you cannot change anything that has been published." The sanctioned remedy is posting a message asking peers to *ignore* the earlier one — advisory deletion again, but with no relay layer that could even best-effort comply; every follower's disk keeps the bytes.
- Edits are overlay semantics: later messages reference and patch earlier ones (CRDT-ish app conventions). The log itself never changes.
- Planetary's user research verdict, from their pivot post ([Pivoting Protocols, from SSB to Nostr](https://www.nos.social/blog/pivoting-protocols)): "**There is no delete**… users want the autonomy of control over their data, central to that is delete and edit."
- Staltz's successor protocol PZP made deletion a headline feature — "both whole message deletion, or just the content (preserving tangle metadata)" — and he states it "**would've been very hard to implement**" in SSB because of backwards compatibility ([PZP launch post](https://www.manyver.se/blog/2024-07-03/)).
- The append-only-social critique got its own genre ([Ctrl blog: "Don't record your social life on an append-only social network"](https://www.ctrl.blog/entry/append-only-social.html)); an ordinary user's account of quitting: posts "a li'l too personal" could only be unpublished because they *hadn't propagated yet* ([idiomdrottning](https://idiomdrottning.org/ssb)).

**But note the flip side, because it matters for EFS hard part (a):** *within* a feed, SSB's monotone log makes retraction-as-later-entry **provable and totally ordered**. A reader holding a feed prefix through seq N knows exactly the author's state as-of N; a revocation at N+1 is undeniable once seen; the only attack is **withholding the suffix**, and gossip + vector clocks make stale peers converge. SSB actually solved author-side revocation ordering without any consensus substrate — for the price that the log can never forget and the author can never have two devices. What it never solved is *reader-side certainty of freshness* ("have I seen the latest seq?") — unprovable without a consensus or freshness beacon; you only ever know the max sequence anyone in your gossip neighborhood has seen.

### 2.3 Spam & sybil — solved by accident, at the cost of openness

SSB never had a spam problem worth naming. Reason: **replication *is* the trust graph**. Nothing propagates unless followers pull it; a sybil with no followers is a feed nobody replicates; harassment doesn't reach you because your node never fetches strangers' data (Wikipedia: "invite-only network that naturally resists spam"). This is the strongest known no-gas anti-spam result: **make storage/propagation opt-in per identity, and sybils cost their creator everything and the network nothing.**

The cost: there is no global publish. A newcomer with no social ties is *invisible*. Discovery beyond 2–3 hops doesn't exist. For a social club that's a feature; for EFS's "anyone publishes, permanent archive, credibly neutral" it is disqualifying **as the only mechanism** — but as the *replication-policy* layer of a LOCKSS design ("archives replicate what their lens trusts") it is directly reusable.

### 2.4 Consensus on existence — strong per-author, absent globally, and brittle

- Per-author: the hash chain gives a **total order and tamper-evidence per feed** — far stronger than Nostr. Equivocation is *detectable*: two signed messages at one sequence number is cryptographic proof of misbehavior (or, overwhelmingly in practice, proof you restored from backup / ran two devices).
- **And then it kills you**: the protocol has no fork recovery. "If you post from both computers before the changes of one have replicated… one or both of your feeds will get screwed up and other people won't see some of your own posts ever again" ([handbook multi-device FAQ](https://handbook.scuttlebutt.nz/faq/applications/multiple-devices.html)). Peers halt replication of a forked feed; the identity is effectively dead; the sanctioned advice was "never share your keypair across devices" and (community folklore) never restore from stale backup. Fork *detection* without fork *resolution* turned an integrity feature into a self-destruct.
- Cross-author: no ordering at all beyond self-asserted timestamps and app-level tangles (reply DAGs). No global "exists": you know what your neighborhood replicated.
- **Partial replication was structurally impossible** in classic SSB — validation requires the whole chain from seq 1 (signature covers `previous`), so a new phone had to fetch entire logs; onboarding took hours and gigabytes. The fixes (meta-feeds, partial replication, **fusion identity** for multi-device — see the [NGI-Pointer audit](https://ssb-ngi-pointer.github.io/Audit%20Report_%20Secure%20Scuttlebutt%20Partial%20Replication%20and%20Fusion%20Identity.html)) were designed, audited… and never deployed to the ecosystem (the protocol guide's metafeeds section is archived/unimplemented). Backwards compatibility ate every rescue.
- Network decay: when pubs (the de-facto always-on backbone) rotted and grant funding ended, neighborhoods went dark. Storage: everyone stores everyone-they-follow forever; multi-GB local databases with no GC (PZP's answer: 100MB cap by design).

### 2.5 Portability — poisoned by canonicalization and context-dependence

Two independent failures:

1. **Signatures over canonical JSON.** The spec leaned on ECMA-262 `JSON.stringify` behavior — underspecified key ordering, whitespace ambiguity, float formatting. [Derctuo's analysis](https://derctuo.github.io/notes/secure-scuttlebutt.html): "the same design error as XML canonicalization and ASN.1 DER, only botched. If you google 'How Not To Sign JSON' this is literally what you will find." Practical effect: for years, only the Node.js implementation was fully correct; Go/Rust/Python implementations chased V8's exact serialization quirks. Second implementations are the survival test of a protocol; SSB flunked it on encoding.
2. **A message is not portable alone.** Verification needs its chain position (`previous`, `sequence`) — you can't hand someone one signed record and have it verify; you hand them a log prefix. And the feed as a whole is bound to a single writer *device* in practice (§2.4). Records were portable in principle (no server binding — better than EAS!) but heavy and fragile in practice.

Planetary's pivot post states the strategic conclusion: "**The signing of the entire log makes everything harder and… doesn't provide much value**" and offline-first "**rarely sees use and complicates development**" for what they were building. Nostr's individually-signed, casually-ordered events won on every DX axis: "Nostr users see updates faster than is possible with SSB."

### 2.6 Identity & keys — the single biggest killer

- Keypair = identity; "if a user loses their secret key… they will need to generate a new identity" (protocol guide). No rotation, no recovery, no revocation.
- One identity per device, permanently (§2.4 fork problem). "It's basically impossible to use the same identity on multiple devices" (Planetary). In the smartphone era this alone was fatal.
- Fusion identity (link several device keys into one social identity) was specced and audited in 2021–22, never shipped ecosystem-wide.
- Staltz's PZP redesign shows what the SSB veterans concluded identity should have been: **every device/app has its own keypair; an "account" is a tangle (DAG) of key-membership messages; the identity ID = hash of the tangle's root message**, so "an 'account' is indistinguishable from a 'group' — an individual is just a group of devices" ([PZP launch](https://www.manyver.se/blog/2024-07-03/), [ssb2 discussion #24](https://github.com/ssbc/ssb2-discussion-forum/issues/24)). That is: identity = a stable *name* (root hash) + a signed, replayable, append-only **key-history log**, with device keys doing the signing. Chain-free, portable, rotatable. This is the reconciliation shape for EFS hard part (e).

### 2.7 Rise, fall, and the post-mortems

- 2014 origin (Tarr, sailboat); apps: Patchwork, Patchbay, Manyverse (mobile, Staltz), Planetary (iOS, VC-adjacent). Peak ≈ 2019–2021: ~10k active users reported 2019, "estimated 30,000 people" across apps per Forbes-via-[Wikipedia](https://en.wikipedia.org/wiki/Secure_Scuttlebutt); ICN'19 academic interest ([SSB paper](https://conferences.sigcomm.org/acm-icn/2019/proceedings/icn19-19.pdf)).
- Funding: grants (EU NGI Pointer 2020–22, NLnet, OpenCollective donations, Handshake). When NGI money ended, so did protocol-core engineering; the audited fixes never rolled out.
- 2023: **Planetary pivots to Nostr** (→ Nos.social). Stated reasons, verbatim ([pivot post](https://www.nos.social/blog/pivoting-protocols)): whole-log signing not worth it; offline-first unused; "uneasy relationship with pubs" vs Nostr users choosing their hosting ("more agency and control"); no multi-device; no delete; "implementing an app on ssb is hard" (custom RPC, pull-streams, custom DBs); "it's easier to build on nostr, there's more development happening, and a willingness to write specs." The same wave of SSB-diaspora dissatisfaction seeded Earthstar, p2panda, Chatternet, and informed Farcaster/AT Protocol.
- 2024: **Staltz launches PZP and exits**: "Personally I will not do any more work on Manyverse. And my impression is no one else is planning to either" ([PZP launch](https://www.manyver.se/blog/2024-07-03/)). His stated meta-lesson: "As a protocol grows older… you try to fix [problems]… But since you want to keep backwards compatibility, you can't just replace old functionality with new… before accumulating too much complexity."
- SSB today: a small hobbyist network; protocol effectively frozen.

**Root-cause ranking (mine, from the sources):** (1) keypair-per-device identity rigidity + fork self-destruct; (2) no deletion in an era of GDPR and user expectations; (3) whole-chain coupling → no partial replication → mobile onboarding pain; (4) unimplementable spec (canonical JSON) → monoculture; (5) grant-cliff funding; (6) backwards-compat paralysis blocking all four technical fixes.

---

## 3. Scorecard against EFS's five hard parts

| Hard part | Nostr | SSB |
|---|---|---|
| (a) Revocation w/o consensus substrate | Advisory (NIP-09/62). Tombstones must be permanent & rebroadcast; un-delete impossible; archives ignore it. Works socially, fails as system-of-record. | Per-author *provable* retraction ordering via monotone log; but no forgetting ever, and freshness ("is this the latest seq?") unprovable. Withholding-detection only within gossip reach. |
| (b) Spam/sybil w/o gas | Unsolved at protocol level. Edge marketplace: PoW (niche, outsourceable, prices out phones), paid relays (fragmenting, no reliability gain), WoT filters (the real answer). | Solved structurally: replication follows the follow-graph; sybils propagate nowhere. Cost: no open publish, no stranger discovery. |
| (c) Consensus on existence/current | None. Probabilistic storage (median 34.6 accidental replicas; 20% relays >40% down; relays die). "Current" = self-asserted timestamp LWW, per-observer. Outbox = routing only. Negentropy = convergence tool, no mandate. | Strong per-feed (hash chain, equivocation detectable), zero cross-feed. Fork detection without recovery = identity death. Partial replication impossible; fixes audited but never shipped. |
| (d) On-chain composability | N/A (no chain). Note: BIP-340 Schnorr not ecrecover-able — artifact standard choice constrains EVM verifiability. | N/A. Whole-chain verification makes even *off*-chain light verification heavy. |
| (e) Signature portability vs identity durability | Max portability (domain-free content-hash id), zero durability (no rotation; NIP-26 unrecommended; NIP-41 unmerged; pre-committed successor keys = the surviving idea). | Low portability (canonical-JSON + chain-context), zero durability (key=identity=device; fusion identity never shipped). PZP's account-tangle (identity = root-hash of a signed key-membership DAG) is the synthesis both ecosystems point to. |

---

## 4. Lessons for EFS

### COPY

1. **Domain-free signed artifacts (Nostr NIP-01).** Hash only author+payload(+time); no relay/chain/deployment identifier anywhere in the id or signature domain. Nostr proves this yields "rebroadcast anywhere, verify forever" at scale and that a whole ecosystem can implement it in a weekend. This is the spec for EFS's portable authorship signature — and it vindicates deterministic-ids.md's rule that derivation inputs must never include deployment-dependent values (schema UIDs, resolver addresses).
2. **Addressable-event pattern = slots (Nostr).** Identity `(author, kind, name)` with latest-statement-wins is exactly EFS's slotId design; Nostr validates the ergonomics. But take ordering from a consensus substrate — Nostr shows self-asserted-timestamp LWW produces per-observer state and is gameable by anyone holding the key.
3. **Pure content addressing for bytes with fungible hosts (Blossom; SSB blobs).** Same hash ⇒ same name on every server; client verifies, client fails over. Both ecosystems independently converged on EFS's MIRROR/contentHash split. Keep it.
4. **Set reconciliation as the replication primitive (NIP-77 negentropy, SSB EBT).** For LOCKSS-grade archives, copies converge via range-based set reconciliation over content-addressed records — proven tech in both ecosystems. What both *lack* is a replication *contract*; EFS should make "who must hold what" explicit rather than altruistic.
5. **Trust-graph-scoped propagation as the spam layer (SSB follow-graph; Nostr WoT relays).** SSB is the existence proof that read/replication scoping kills spam without gas. EFS lenses are the same object — extend them from read-time filtering to **replication policy** ("archive what your lens trusts") and EFS gets SSB's spam immunity without SSB's closed-world discovery loss, because chain-side publication stays open.
6. **Identity = stable name over a signed key-history log (PZP account tangles; NIP-41's pre-committed successors).** The synthesis both post-mortems reached: device/app keys sign; the *identity* is the root of an append-only key-membership record (add/remove/rotate as signed events); verification of old artifacts = replay the key log to the artifact's time. Chain-free and portable like ECDSA, durable like a smart account. Critically (NIP-41's surviving insight): **successor/recovery keys must be committed *before* compromise.** A chain is then an optional *checkpoint/ordering service* for the key log, not its home — this is a concrete reconciliation candidate for hard part (e).
7. **Monotone author logs for provable retraction ordering (SSB).** If any part of EFS ever operates without a chain, per-author sequence numbers + hash chaining give undeniable, totally-ordered supersession within an author — the strongest known no-consensus revocation story. Pair with periodic cross-substrate checkpointing to bound the withholding window (which SSB never did).
8. **Tombstones are permanent, forwarded artifacts (NIP-09).** Whatever revocation becomes, the *retraction* record must be at least as replicated and durable as the thing retracted, and revocation must be monotone (no un-delete). EFS's on-chain revocation already has this; keep the invariant across any substrate move.
9. **Radical implementability as a survival property (Nostr vs SSB).** NIP-01 fits on a page → dozens of interop implementations; SSB's canonical-JSON → a Node monoculture and no second chance. EFS's byte-exact, fixed-width `abi.encode` derivation + golden vectors + cross-language differential fuzz (deterministic-ids.md §13) is the right religion. Never sign or hash anything that requires "canonicalization" of a flexible encoding.

### AVOID

10. **Don't couple authenticity to a total order you don't need (SSB's fatal flaw).** Sign statements individually; get ordering from the substrate that's good at it. Planetary verbatim: whole-log signing "makes everything harder and… doesn't provide much value." This *is* EFS's statements-vs-things split — the SSB autopsy is its strongest external validation.
11. **Don't ship fork detection without fork recovery.** SSB turned equivocation-evidence into permanent identity death, and the trigger wasn't malice — it was backups and second devices. Any EFS rule that hard-fails on duplicate/conflicting writes must define the recovery path in the same spec (deterministic-ids.md's owned-kind REVERT + salt-persisted retry is fine *because* the chain serializes; re-audit that story for any off-chain mode).
12. **Don't treat advisory deletion as deletion for a system of record.** Nostr's own trajectory (NIP-09 → NIP-62 "legally binding in some jurisdictions") shows advisory doesn't even satisfy the social case fully. A reader must be able to distinguish "not revoked" from "revocation withheld" — that requires a consensus substrate (or a freshness beacon) for the *claims* layer. Conversely: don't build an archive with **no** forgetting-mechanism at all — SSB's users demanded delete/edit and left over it; EFS's revocable-claims / irrevocable-objects split is the defensible middle and should be defended explicitly in those terms.
13. **Don't assume altruistic storage persists.** 95% of free Nostr relays can't cover costs; relays die (132 in six months); SSB pubs rotted when grants ended. "Lots of copies" needs *funded, contracted* copies — chains-as-DA-substrates is one honest answer; volunteer relays are not.
14. **Don't bolt identity indirection on later.** NIP-26: unrecommended, dead. NIP-41: unmerged after 3+ years. SSB fusion identity: audited, never deployed. Staltz: backwards compat means you *can't* replace old functionality before complexity accumulates. Identity indirection must be in the derivation/verification path from genesis — for EFS this is a **pre-freeze** decision, same class as the ID derivation itself.
15. **Don't rely on PoW for spam, and don't let anti-spam fragment the write path.** NIP-13 stayed niche, is outsourceable, and taxes phones more than spammers. Paid-relay islands fragment reach without buying reliability. Gas is a *better* write-cost than anything Nostr found; if EFS ever relays gasless writes, the cost/queueing story must be designed, not inherited.
16. **Don't confuse cumulative identities with users, or spikes with adoption.** Nostr: ≥18M pubkeys, ~4–15k DAU, spike cohorts (Brazil) churned out. SSB: ~10–30k peak. Both prove ideology + censorship events create *sign-ups*; retention comes from key UX, deletion/edit, and multi-device — the exact three things both protocols fumbled. EFS's account/UX track (smart accounts, gasless onboarding) is on the critical path of the *mission*, not a nicety.
17. **Don't let "offline-first"/P2P purity drive the architecture.** Planetary: rarely used, complicated everything. EFS's chain-mediated model already avoids this; resist any future temptation to make direct peer sync a core invariant rather than an optimization.

---

## 5. Source register (primary vs secondary, staleness)

**Primary (protocol/specs/first-party):**
- NIPs repo: [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md), [NIP-09](https://github.com/nostr-protocol/nips/blob/master/09.md), [NIP-13](https://github.com/nostr-protocol/nips/blob/master/13.md), [NIP-26 (unrecommended)](https://nips.nostr.com/26), [NIP-40](https://github.com/nostr-protocol/nips/blob/master/40.md), [NIP-42](https://github.com/nostr-protocol/nips/blob/master/42.md), [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md), [NIP-62](https://github.com/nostr-protocol/nips/blob/master/62.md), [NIP-65](https://github.com/nostr-protocol/nips/blob/master/65.md), [NIP-77](https://github.com/nostr-protocol/nips/blob/master/77.md), [NIP-03 (unrecommended)](https://github.com/nostr-protocol/nips/blob/master/03.md), [index/README](https://github.com/nostr-protocol/nips/blob/master/README.md); NIP-41 PRs [#158](https://github.com/nostr-protocol/nips/pull/158), [#829](https://github.com/nostr-protocol/nips/pull/829)
- [Scuttlebutt Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/); [SSB handbook: data-delete FAQ](https://github.com/ssbc/handbook.scuttlebutt.nz/blob/master/faq/basics/data-delete.md), [multi-device FAQ](https://handbook.scuttlebutt.nz/faq/applications/multiple-devices.html); [NGI-Pointer partial-replication & fusion-identity audit](https://ssb-ngi-pointer.github.io/Audit%20Report_%20Secure%20Scuttlebutt%20Partial%20Replication%20and%20Fusion%20Identity.html)
- First-party post-mortems: [Planetary/Nos "Pivoting Protocols"](https://www.nos.social/blog/pivoting-protocols) (2023); [Manyverse "Launch of the PZP protocol and the future of Manyverse"](https://www.manyver.se/blog/2024-07-03/) (2024); [ssb2-discussion-forum #24 (tangle auth)](https://github.com/ssbc/ssb2-discussion-forum/issues/24)
- Tooling: [strfry](https://github.com/hoytech/strfry), [Blossom](https://github.com/hzrd149/blossom), [NIP-96](https://nips.nostr.com/96), [NIP-B7](https://nips.nostr.com/B7)

**Peer-reviewed / measurement:**
- [arXiv 2402.05709v2 — Empirical Analysis of Nostr](https://arxiv.org/html/2402.05709v2) (window Jul–Dec 2023; the availability/replication/economics numbers age from there)
- [SSB @ ICN'19](https://conferences.sigcomm.org/acm-icn/2019/proceedings/icn19-19.pdf)

**Secondary/commentary (used with care, flagged):**
- [Derctuo on SSB's fatal flaws](https://derctuo.github.io/notes/secure-scuttlebutt.html) (technical critique, ~2020); [idiomdrottning user account](https://idiomdrottning.org/ssb); [Ctrl blog on append-only social](https://www.ctrl.blog/entry/append-only-social.html)
- [Wikipedia: Nostr](https://en.wikipedia.org/wiki/Nostr), [Wikipedia: SSB](https://en.wikipedia.org/wiki/Secure_Scuttlebutt) (Dorsey funding figures and the 18M/30k user figures are from here; cumulative-vs-active caveat applies)
- Adoption trackers (Oct 2024–Oct 2025 snapshots; noisy, directionally consistent on stagnation): [stats.nostr.band](https://stats.nostr.band/), [socialcapitalmarkets](https://socialcapitalmarkets.net/crypto-trading/nostr-statistics/), [glukhov.org](https://www.glukhov.org/post/2025/10/nostr-overview-and-statistics/), [Bitcoin Magazine "Beyond the Feed"](https://bitcoinmagazine.com/culture/beyond-the-feed-nostr-real-world)
- Key management: [Soapbox](https://soapbox.pub/blog/managing-nostr-keys/), [D-Central](https://d-central.tech/nostr-key-security/), [W3C public-nostr Dec 2025 thread](https://lists.w3.org/Archives/Public/public-nostr/2025Dec/0000.html)
- Outbox commentary: [whynostr](https://www.whynostr.org/post/8yjqxm4sky-tauwjoflxs/), [Nostrify docs](https://nostrify.dev/relay/outbox)
