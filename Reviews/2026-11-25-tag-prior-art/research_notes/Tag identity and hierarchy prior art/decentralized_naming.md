# Decentralized naming prior art: topic identity and hierarchy

Research done 2026-11-25 with about 18 tool calls. Several primary documents were not fetched; see Gaps under each heading.

## Usenet: creation, Great Renaming, alt.*

### Takeaway
Usenet names were hierarchical strings. Whether a group existed at a given site was decided by that site's admin, and in practice by backbone sites. The Great Renaming was a one-time reorganization decided by a small informal group, using the leverage of who carried what. alt.* arose as an escape from that control.

### Cited Findings
- Before the renaming there were three worldwide hierarchies: net.* (unmoderated), mod.* (moderated) and fa.* (from ARPAnet). They did not categorize by subject, and the scheme was becoming hard to administer. — [Wikipedia, Great Renaming](https://en.wikipedia.org/wiki/Great_Renaming); [Bellovin, 2019](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html)
- Stated reasons differ by source. One reason is the difficulty of maintaining a list of all groups. Another is that traffic volume made it necessary to subscribe by category. A third is that European sites objected to paying for high-volume "flame" groups such as net.religion. — [Wikipedia](https://en.wikipedia.org/wiki/Great_Renaming); [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html); [FAQ summary (Hardy history)](https://www.linux.it/~md/usenet/gr.html)
- Rick Adams (seismo, B News maintainer) is generally credited as initiator. He reportedly had leverage because his site was the US-Europe link. — [FAQ](https://www.linux.it/~md/usenet/gr.html)
- The "Backbone Cabal" of high-connectivity site admins did the work. Bellovin says it had no formal authority, but excluding a group would have sharply limited its distribution. — [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html)
- Chuq von Rospach's proposal was the first detailed plan. The process ran roughly July 1986 to March 1987, with discussion on a mailing list and proposed lists posted to net.news. — [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html); [FAQ](https://www.linux.it/~md/usenet/gr.html)
- The result was the comp, misc, news, rec, sci, soc and talk top levels. Protest changed "a dozen or two dozen" groups from the proposed lists. One example is net.religion.jewish, which went to soc.culture.* because a talk.* name was feared to hurt it. — [FAQ](https://www.linux.it/~md/usenet/gr.html)
- Placement in a top-level hierarchy was political. Moving a group to talk.* sharply reduced its reach. The EFF called the renaming censorship, and Bellovin disputes that. — [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html)
- The cost was mostly phone and transmission charges and sysadmin fear of management attention, which drove the sorting of groups. The sources give no cost figure for the renaming itself. — [FAQ](https://www.linux.it/~md/usenet/gr.html)
- alt.* was created soon after, outside Cabal control. It was meant to be free of the Big Seven's formalities. — [Wikipedia](https://en.wikipedia.org/wiki/Great_Renaming); [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html)
- Creation by control message: newgroup and rmgroup are ignored unless the article carries an Approved header, and signed messages are executed automatically. In alt.*, an unsigned newgroup works only as a proposal, and objection is expressed with rmgroup. — [Wikipedia, Control message](https://en.wikipedia.org/wiki/Control_message); [RFC 5537, 2009](https://www.rfc-editor.org/rfc/rfc5537)
- The FAQ says groups were originally created just by posting to them, and some arose from typos. — [FAQ](https://www.linux.it/~md/usenet/gr.html)

### Inferences
- Usenet is evidence that a hierarchy position can carry value: reach and norms depended on the top-level segment. Changing it required a coordinated flag day among carriers. Under a no-authority ledger this is impossible by design, so any reclassification would have to be a per-reader overlay.
- Usenet had no unowned global identity. Each site's admin decided what a name meant by deciding whether to carry it. That is close to a per-reader overlay, with the carrier as the reader.

### Gaps
- I did not fetch the original Bumgarner/Spafford FAQ text, the Spencer or Reid accounts, or the news.announce.newgroups guidelines.
- I did not verify RFC 5537's wording on per-site admin policy.
- I found no sourced case of deep or over-specific hierarchies fragmenting or dying, and no sourced case of a classification that later went wrong beyond the talk.* placement fights above.
- I found no sourced count of Usenet groups at peak.

## Zooko's triangle and petnames

### Takeaway
Zooko's conjecture says a name cannot be human-meaningful, secure and decentralized all at once. Petname systems claim all three by making names local rather than global.

### Cited Findings
- Zooko Wilcox-O'Hearn's 2001 essay "Names: Decentralized, Secure, Human-Meaningful: Choose Two" conjectures that no single kind of name achieves more than two. The original post was later deleted, so Wikipedia's archived reference is the route to it. — [Wikipedia, Zooko's triangle](https://en.wikipedia.org/wiki/Zooko%27s_triangle)
- Namecoin is cited as a counterexample using a separate blockchain. Aaron Swartz's 2011 "Squaring the Triangle" proposed a Bitcoin-based scheme and remains vulnerable to Sybil attacks. — [Wikipedia](https://en.wikipedia.org/wiki/Zooko%27s_triangle)
- Marc Stiegler's 2005 HP Labs paper "An Introduction to Petname Systems" is described as claiming that a petname system achieves all three properties, even though no single name does. Petnames came out of the Electric Communities project. — [Financial Cryptography, 2005](https://www.financialcryptography.com/mt/archives/000499.html); [Wikipedia, Petname](https://en.wikipedia.org/wiki/Petname)

### Inferences
- A name that is the hash of its own text has no owner, so it is secure in the sense of being unspoofable and decentralized. Meaning is then the open question: the same text can be meant differently, and two people can hash different spellings. Whether this falls inside the triangle depends on whether "secure" means "bound to a specific owner". If it does, the trilemma is moot for unowned names.
- The petname model matches the per-reader overlay: each reader keeps their own mapping from global keys to local meanings.

### Gaps
- I did not read Zooko's essay or Stiegler's paper directly, only secondary descriptions.
- I found no source applying the trilemma to ownerless hash-of-text names.

## ENS and DNS: hierarchy in the hash, normalization location

### Takeaway
ENS puts hierarchy into identity: the parent is an input to the child's hash. Normalization is a client-side step before hashing, so the chain never sees raw text.

### Cited Findings
- `namehash('ens.eth') = keccak256(namehash('eth') + labelhash('ens'))`, and the empty name hashes to 32 zero bytes. Docs recommend computing it off chain. — [ENS docs](https://docs.ens.domains/resolution/names)
- The docs say to normalize before hashing, because a case difference gives a different hash. They recommend viem's `normalize`, which wraps `@adraffy/ens-normalize`. A name that cannot be normalized throws. — [ENS docs](https://docs.ens.domains/resolution/names)
- ENSIP-15 defines normalization as split, normalize and join, with published data files and validation tests. It targets Unicode 17.0.0 and keeps about 99% of existing names valid. — [ENSIP-15](https://docs.ens.domains/ensip/15)
- ENSIP-1 (2016) did not state its Unicode version or IDNA flavor. UTS-46 is insufficient for emoji. — [ENSIP-15](https://docs.ens.domains/ensip/15)
- Spoofing techniques that motivated ENSIP-15 include zero-width characters, mixed scripts, and names that normalize differently across algorithms. ENSIP-15 rejects whole-script confusables but addresses only single-character confusables. — [ENSIP-15](https://docs.ens.domains/ensip/15)
- Because registration hashes are immutable, ENSIP-15 keeps the legacy ignoring of emoji presentation characters (FE0F/FE0E), which makes some changes hard to reverse. — [ENSIP-15](https://docs.ens.domains/ensip/15)

### Inferences
- The chain stores only hashes, so a normalization bug cannot be fixed on chain. ENS repaired it by changing client behavior and invalidating some names in clients, which an immutable ledger with per-reader overlays could do similarly.
- In ENS, parent ownership of subnames is separate from the hash identity: the hash is determined by the path, while control comes from the registry. This is a design in which hierarchy is identity but owners exist.

### Gaps
- I did not retrieve named homoglyph incidents (specific spoofed names or dates) or DNS/IDN homograph history. I found no fetched source on ENS subname ownership rules.

## Nostr

### Takeaway
Nostr hashtags are flat, unowned strings, with lowercase required. NIP-32 labels add namespaces by convention, without any resolution rule.

### Cited Findings
- The `t` tag is a hashtag and its value MUST be lowercase. — [NIP-24](https://github.com/nostr-protocol/nips/blob/master/24.md)
- NIP-32 (optional draft) uses kind 1985 with `L` (namespace) and `l` (label) tags. Any string is allowed, and reverse-domain notation is encouraged. `ugc` is the default namespace. Labels may be fully qualified (such as `com.example.vocabulary:my-label`) but publishers shouldn't mix qualified and unqualified. — [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)
- NIP-32 describes no formal hierarchy and no rule for resolving conflicting labelers. Publishers are told to reuse existing ontologies where possible. — [NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)

### Inferences
- Nostr converges on the same hashtag only through lowercase normalization plus convention. Hierarchy lives in label naming convention, not in identity.

### Gaps
- I did not fetch NIP-72 (communities) or any usage statistics.

## Bluesky / AT Protocol

### Takeaway
Labels are scoped to their issuing labeler, and the client chooses which labelers to listen to. The protocol defines no merge rule across labelers.

### Cited Findings
- A label has a source DID, a subject, and a short value "similar to a hashtag". Meaning and policy are communicated elsewhere. Only one set of metadata exists per (source, subject, value). — [AT Protocol label spec](https://atproto.com/specs/label)
- Clients choose labelers through the `atproto-accept-labelers` header. Negation is a new label with `neg` true and a later timestamp, and it means only "disregard the earlier label". Labels may expire. — [AT Protocol label spec](https://atproto.com/specs/label)
- The spec does not define how conflicting labels from different labelers combine. — [AT Protocol label spec](https://atproto.com/specs/label)

### Inferences
- This is the closest deployed analogue to the proposed per-reader overlay. Labels are append-only with negation, and combination is left to the client.

### Gaps
- The Bluesky moderation guide returned no body, so per-user label preference behavior and precedence are unverified. I did not research hashtag or custom feed specifics.

## Farcaster, Mastodon, SSB, Matrix

### Takeaway
All four are flat. They differ in whether a name has an owner. Evidence is thin for three of them.

### Cited Findings
- Farcaster: a channel is identified by its name through a `parentUrl` of the form `https://farcaster.xyz/~/channel/<name>`. Anyone can create one by paying a fee, and the creator is the host. Names are under 16 characters, lowercase letters and numbers. The client may remove a squatted channel. Channel metadata lives in the client, not the protocol, and channels are labeled experimental. No channel hierarchy is described. — [Farcaster docs](https://docs.farcaster.xyz/learn/what-is-farcaster/channels)
- Matrix: aliases are `#localpart:domain`, so the name is owned by the issuing homeserver's domain. A room has one ID and zero or more aliases, and aliases are mutable. — [Matrix spec](https://spec.matrix.org/latest/appendices/#room-aliases)
- Mastodon: federated with "no global shared state between all servers", so tag search covers only what a server has seen. — [Mastodon docs](https://docs.joinmastodon.org/user/network/)
- SSB: a developer proposal noted that channels have no identity beyond their text name and suggested converting them to tags. A commenter opposed it, citing subjectivity. This is a proposal, not shipped behavior. — [SSB Patchwork proposal via search](https://viewer.scuttlebot.io/%25gTHLf3Rlc48RSjwATVDJZpe9VlWGfxMmio1%2Bo3KXvjA%3D.sha256)

### Inferences
- Where there is no owner (Mastodon, SSB, Nostr), convergence relies on case folding and low friction. Where there is an owner (Farcaster, Matrix), the system adds a fee or domain to limit squatting.

### Gaps
- I did not verify Mastodon hashtag case handling, trends review, or followed-tag behavior. I did not verify SSB case handling or Matrix alias case sensitivity or squatting. I found no named squatting incidents.

## Which ownerless schemes scaled, and why people converged

### Takeaway
I could not verify scale figures for any system, so the evidence on what drove convergence is mostly structural.

### Cited Findings
- Usenet converged through a few high-connectivity carriers whose choices others followed. — [Bellovin](https://www.cs.columbia.edu/~smb/blog/2019-12/2019-12-26.html)
- alt.* ran without central approval, with newgroup used as a proposal and rmgroup as an objection. — [Wikipedia](https://en.wikipedia.org/wiki/Control_message)

### Inferences
- Convergence on a name in these systems came from social focal points (carriers, Big Seven, lowercase convention), not from the identity function.
- Evidence for flat ids plus revisable relations: Usenet's placement fights, ENS normalization churn, and AT Protocol's per-labeler scoping. Evidence for path identity: ENS and Usenet both worked with the path as the name, and hierarchy gave a coarse subscription unit (Bellovin). Both readings are from the same facts.

### Gaps
- No sourced scale numbers (group counts, hashtag volumes, ENS name counts, Bluesky labeler counts). No source found on an ownerless path-hashed topic scheme at scale.
