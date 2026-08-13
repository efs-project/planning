# 2026-08-13 — Claude evidence round

**Status:** corrected, fully recovered dated research record; not a design, ruling, or owner packet
**Commissioned by:** @james via @pm, 2026-08-12, from work maps drafted by the Codex EFS PM and Arcade PM
**Method:** four directly launched Opus 5 agents with delegated research; 30 distinct completed memos recovered
**Authority:** observations and analyst interpretations only; existing design gates decide what survives

#status/done #kind/research #repo/planning #repo/contracts #repo/client #pass/claude-evidence-round

## Phone summary

All 30 distinct completed result bodies were recovered after Claude hit its
spend cap. The full [30-memo corpus](corpus/README.md) is now in the vault with task IDs,
timestamps, source-event locations, measurements, links, caveats, and negative
results. [Corrections and scope](CORRECTIONS.md) records where the original PM
compression overstated or conflated those results.

Three evidence families matter:

1. **Arcade:** one adversarial workstream produced two overlapping memos.
   Neither classified a tested benefit as uniquely EFS-specific, while some
   benefits remained unresolved. That challenges the current
   preservation/differentiation hypothesis; it does not decide that Arcade or
   EFS should stop. Andromeda's exact artifact/runtime reproduction is
   favorable, but rights, notice, name, real-mobile, and target-browser gates
   remain open.
2. **Browser runner:** measured desktop results show that a sandboxed iframe is
   not a network cage and does not isolate a hung child from Safari's host
   page. The measurements are useful runner evidence, not a chosen policy, and
   Firefox plus real iOS/Android/touch/gamepad remain unmeasured.
3. **Realm/venue:** venue, L1, dead-chain, governance, DA, cost, and node studies
   reinforce a broad risk: a record can remain confirmed while its practical
   read or reconstruction path disappears. No chain was selected. The evidence
   now feeds the existing Realm and Commons gates.

## What actually ran

Four agents were launched directly:

- Commons/Realm venue matrix;
- Andromeda artifact reproduction;
- Arcade differentiation falsification; and
- browser-runner behavior measurement.

They delegated supporting lanes. The corpus contains 55 completed-result
notifications, deduplicated to 30 distinct bodies totaling 848,254 characters
before HTML-entity decoding. Six reports are the curated entry points: two different Arcade
falsification passes, Andromeda, browser measurements, the Commons/Realm matrix,
and the L1/dead-data report. The L1 report is a venue sub-lane, and both Arcade
passes came from one task at different stops; do not describe these as six
independent experiments.

The later spend-limit notification for the browser task carried no result and
occurred after its complete report had landed. It did not erase or truncate the
earlier result.

## Cross-domain signal: confirmed, then unreadable

Several related lanes independently collected examples in which bytes, chain
state, or commitments survived while normal discovery, reconstruction, RPC,
explorer, index, or runtime paths failed. That is useful cross-domain
corroboration for a failure class EFS already tracks. It is **not** a statistical
finding that every lane independently proved one dominant cause:

- the [venue matrix](corpus/venue/commons-realm-venue-matrix.md) emphasizes
  historical-read, DA, operator, upgrade, and reconstruction dependencies;
- the [L1/dead-data report](corpus/venue/l1-incidents-and-dead-data.md) separates
  durable commitments from expiring blob bytes and records disappearing testnet
  read paths;
- the [indie/jam catalog study](corpus/arcade/indie-jam-catalog-loss.md) finds
  modern index/SPA failure cases; and
- the [Flash-era study](corpus/arcade/flash-era-catalog-loss.md) finds a
  different dominant problem—runtime obsolescence even when bytes survive.

The design implication remains a test, not a ruling: EFS should prove that an
independent implementation can reconstruct useful state and exact content from
the dependencies each Realm explicitly promises.

## Arcade falsification

One adversarial workstream produced [pass 1](corpus/arcade/arcade-falsification-pass-1.md)
and the overlapping [pass 2](corpus/arcade/arcade-falsification-pass-2.md).
Neither classified a tested benefit as uniquely EFS-specific; one or two
items remained unresolved depending on the pass. The workstream found that
Git, signed manifests, ordinary replicated storage,
Software Heritage, and static clients already provide much of the proposed
preservation path; Nostr was cited as a non-chain comparison for attributed
multi-author discovery.

The important scope boundary is “for the catalog it tested.” Public GitHub and
js13k-style games are unusually well replicated. The studies challenge:

- preservation as the current catalog's strongest public rationale;
- whether the proposed video makes an EFS-only property visible; and
- whether a single-operator Arcade surface demonstrates curator plurality.

They do not establish that conventional tools satisfy every EFS use case, that
the guest-game product lacks value, or that the existing Arcade STOP condition
has been owner-triggered. The Arcade queue remains held while its product agent
recuts the one-game evidence and differentiation question.

Supporting reports: [polished portals](corpus/arcade/six-flow-polished-portals.md),
[HN Arcade/js13k/itch](corpus/arcade/six-flow-hn-js13k-itch.md),
[Flash-era cases](corpus/arcade/flash-era-catalog-loss.md), and
[indie/jam cases](corpus/arcade/indie-jam-catalog-loss.md).

## Andromeda Invaders

The [reproduction memo](corpus/arcade/andromeda-evidence-reproduction.md)
verified a strong provisional artifact:

- the published 45,248-byte HTML file matched repository HEAD without a build;
- its SHA-256, Git blob, raw CIDv1, revision, and SWHIDs are recorded;
- static and measured runtime checks found no external request or persistent
  storage use during the tested desktop run;
- art and audio are generated in code; no image, audio, or font file ships; and
- it ran in the tested Chromium opaque `sandbox="allow-scripts"` harness.

That is **not publication clearance**. Still open:

- provenance/licensing of the embedded bitmap glyph data;
- including the full MIT permission notice in the shipped closure;
- the required name/trademark pass;
- independent serving custody rather than several locators controlled by the
  same publisher;
- exact-release identity because “0.9.0” labels different byte sequences; and
- Firefox, real iOS/Android, touch, gamepad, and target-device testing.

The durable-write hold therefore remains correct. This pass does not label the
game “rights-clean,” “mobile-cleared,” or safe for irreversible publication.

## Browser-runner evidence

The [measured matrix](corpus/runner/browser-runner-measurements.md) exercised
Chrome 151, Safari 26.5.2, and Brave 151 on one macOS machine. Among its direct
observations:

- a three-second busy loop in the opaque child froze Safari's host page for the
  same period; Chrome's host remained responsive in the tested process layout;
- the tested Safari cross-origin/opaque child ran about 22 animation frames per
  second while its host ran 60;
- the tested sandbox allowed outbound fetch/WebSocket behavior subject to the
  normal web controls; `sandbox` alone is not a no-egress boundary;
- self-navigation remained possible and inherited the sandbox;
- a crashed Chrome child produced no parent event in the tested harness; and
- Safari's fullscreen attributes behaved differently from Chromium's in the
  tested combinations.

These are small-sample measurements, not universal browser laws. Firefox,
iOS Safari, Chrome Android, real touch, and real gamepad were not measured.
The companion documentation reports are [standards/vendor synthesis](corpus/runner/sandbox-spec-and-vendor-docs.md),
[WebKit/iOS](corpus/runner/webkit-ios-docs.md),
[Firefox/Gecko](corpus/runner/firefox-gecko-docs.md), and
[Chrome Android](corpus/runner/chrome-android-docs.md). They do not complete the
client's separate Worker/CSP cage spike or select runner permissions.

## Realm, venue, and L1 evidence

The [Commons/Realm matrix](corpus/venue/commons-realm-venue-matrix.md) and its
17 venue/L1 reports are inputs to V2-E5/V2-E7, not a chain choice.

High-value findings and their precise limits:

- **Blob retention:** EIP-4844 guarantees blob-sidecar service for 4,096
  epochs (about 18.2 days) and permits longer retention. One tested beacon endpoint served selected
  45-day-old blobs and returned HTTP 403 for selected 60+-day samples; the test
  did not measure an exact global deletion boundary. A six-month-old
  transaction still exposed its commitments. Safe requirement: do not depend
  on protocol blob retrieval beyond the guaranteed window.
- **Upgrade/exit:** no surveyed L2 met the analyst-applied 30-day notice/exit
  bar under every upgrade path. Thirty days is L2BEAT's Stage 2 criterion, not
  an adopted EFS requirement. Some—including Arbitrum—have nonzero regular
  paths, but the reports found zero-delay emergency authority. “Every L2 has
  no exit window” is too broad.
- **Costs:** at one 2026-08-13 snapshot, 200,000 units of L1 execution gas cost
  about $0.020 before payload-specific fees. Applying a separate December 2024
  gas/ETH-price scenario produced $23.43. This is a two-snapshot sensitivity
  illustration, not measured fee history or an actual EFS transaction; the
  historical input still needs an exact date and source. EIP-8037's
  20,000→97,920 comparison is about 4.9× for the net-new 64-byte storage
  component only; whole-transaction impact must be measured, and L2 adoption
  was not verified.
- **Archived versus dead:** L2BEAT counts in the corpus are project slugs, and
  “archived” does not mean technically dead. Separate probes found many frozen
  or unavailable chains/endpoints and should be cited with their actual sample,
  not converted into a universal L3 mortality rate.
- **Polygon zkEVM:** its sequencer stopped producing blocks when it was sunset
  on 2026-07-03. A read-only archive RPC still returned its frozen final block
  while its former explorer domain was gone; that is a
  read-path-after-shutdown case, not a live-mainnet case.
- **L1 sampling:** one report evaluated 5,103 consecutive 2,000-block endpoint
  windows. Its largest aggregate delay above an ideal 12-second schedule was
  59 minutes; under the report's timestamp/slot assumptions, that bounds any
  single missed-slot run within those windows. Dense scans of the two May 2023
  incidents and selected anomalies found a maximum 96-second inter-block gap;
  the pass did not scan every adjacent post-Merge block.

The corpus also records OP's unrecoverable legacy event-log loss, disappearing
testnet/explorer/RPC paths, independent-node costs, force-inclusion differences,
governance and emergency powers, RaaS/offboarding gaps, dead-chain cases,
external/committee DA, and live documentation-versus-contract discrepancies.
Use the [corpus manifest](corpus/README.md) to reach the evidence behind a
specific claim.

## Held routing notes—nothing for James now

The original PM summary turned seven analyst prompts into a shadow owner queue.
That was wrong: the generated owner rollup currently says **Ask now: 0**.

- Questions about mutable execution environments, reconstructibility, chain
  mortality assumptions, durability versus reach, and fee variance feed the
  existing EFS 2.0 Realm/Commons evidence gates V2-E5 and V2-E7.
- The discovery-and-tombstone argument may be evaluated there, but superseded
  L1-pointer item P-5 remains superseded unless the owning design process
  explicitly reopens it.
- Arcade differentiation and STOP criteria remain inside the held Arcade recut.
- Browser observations remain client/runner evidence, not a client owner ask.

No venue, contract mechanism, Arcade disposition, Andromeda publication,
browser permission, or public claim was adopted by this round.

## Honest limits

- Raw memos are preserved research outputs, not independently re-audited truth.
  Their recommendations and occasional overstatements remain visible for
  provenance; this synthesis and [correction register](CORRECTIONS.md) govern
  how the round should be cited.
- Firefox and mobile browser behavior were researched from documentation but
  not directly measured.
- No game was played during the Arcade falsification studies.
- The Andromeda test used one desktop Chromium-family runtime plus emulation;
  it did not complete real-device clearance.
- Sepolia's validator-permission characterization conflicts between raw lanes
  and remains unresolved; do not cite it from this round as settled fact.
- Several economic, client-share, relay, chain-status, and governance readings
  are point-in-time observations dated 2026-08-12/13 and must be refreshed
  before deployment or public claims.
