# Presentation revision after the first read-through

Working revision, October 13, 2026. James read the current speaker notes in
17 minutes. He wants a clearer problem, an inspiring cypherpunk vision, a
formal map of the software stack, and improvements developers can make in
their own apps. EFS should appear where it directly teaches something useful.
The live slides and [[rehearsal-script]] still preserve the earlier draft.
Their Git snapshot is indexed in [[Devcon/presentation/README]].

## The argument

People invest work, relationships and trust in applications. A shutdown can
make that work inaccessible or force a hurried migration. A takeover can
keep the interface looking familiar while changing rules or asking users for
harmful actions. Other apps inherit those risks when they build on the same
services.

The positive goal is software that remains useful across generations of
maintainers. Users can retain their work, understand what it depends on,
choose another operator, refuse unwanted changes and continue elsewhere.
Other developers can build on stable public rules without needing a permanent
relationship with the original team. This is a meaningful foundation for
important shared workflows.

The walk-away test turns that ambition into something a developer can try:
choose one essential task, remove the team's services and help, then test what
happens when the team's authority is in hostile hands. Fix the dependence
that causes the most user harm. [[stack-map]] defines the coverage.

Keep the ambition of apps that outlive their creators. Describe the operating
assumptions once, clearly: somebody must retain data, run infrastructure and
maintain compatibility. The architecture can let those people change without
requiring the founder's permission. Surviving forever is a design ambition;
specific continued-use and refusal claims need evidence.

## Opening candidate

> People can spend years building something inside an app. A research library.
> A community archive. The records they use to run an organization. Then the
> company closes, or somebody takes over an account, and suddenly all that
> work depends on a decision they never got to make.
>
> I want us to build software people can keep using for as long as it matters
> to them. Software another developer can maintain and build on without
> asking the original team. That's part of why I'm building Ethereum File
> System, and it's why I care about the walk-away test.
>
> Can someone still use your app when you're gone? And can they refuse a
> harmful change if someone gets your keys?

This is proposed wording, not a memorization assignment. Attach one brief
real example to the first paragraph so the problem is concrete. Do not imply
James personally lost data in an incident unless he says so.

## Evidence for the stakes and vision

**Pocket is the strongest accessible shutdown example.** Mozilla says Pocket
closed July 8, 2025 and exports/API access ended November 12, 2025, with user
data queued for deletion. Its export documentation says saved URLs did not
include the article text. The lesson is the work of recovering a personal
library and the difference between an export and a continued reading task.
Avoid claiming that every user lost their library. Sources checked October
13: [shutdown FAQ](https://support.mozilla.org/en-US/kb/future-of-pocket) and
[export documentation](https://support.mozilla.org/en-US/kb/exporting-your-pocket-list).

**Ledger Connect Kit makes takeover concrete for Ethereum developers.**
Ledger's December 2023 report describes compromised package publishing and
malicious code loaded by integrating apps, tricking users into signing
transactions that drained assets. It connects the threat to runtime
dependencies and update authority. No hardware-key extraction or loss total
is needed to teach that point. Source checked October 13:
[incident report](https://www.ledger.com/blog/security-incident-report).

**A positive recovery example should follow the failures.** Google's Stadia
controller documentation describes continued USB use and a firmware change
for ordinary Bluetooth use with compatible devices after the service closed.
The teaching point is that a standard interface can preserve useful function
beyond the service. Treat this as historical; the official support page has
stale updater deadlines and does not establish current updater availability.
[Controller documentation](https://support.google.com/stadia/answer/13067284?hl=en),
checked October 13. Alternatively, use Git bundles or the Uniswap
interface/protocol distinction already sourced in [[presentation-examples]].

**Hyperstructures supplies a useful intellectual connection.** Jacob Horne's
2022 essay describes shared protocols that outlast their creators and support
independent interfaces. Use it as inspiration for the vision, with attribution.
The talk examines the dependencies between that protocol ideal and the user's
actual application. It does not certify a whole app as maintenance-free.
[Original essay](https://jacob.energy/hyperstructures.html), checked October 13.

Use one opening incident and a few short comparisons across the layers. The
source bank is a selection tool, not a requirement to name every project.

## Suggested 20-minute structure

These are proposed allocations, not measured timings for a finished rewrite.

| Elapsed time | Story purpose |
| --- | --- |
| 0:00-3:00 | What users lose, one real incident, the future James wants and the two tests. |
| 3:00-4:00 | Show the eight-layer map and choose one task to follow. Introduce EFS briefly where it helps explain that task. |
| 4:00-7:30 | Entering the app: naming, software, identity and recovery. Use Ledger as a brief takeover example. |
| 7:30-11:30 | Continuing the work: data, state and computation. Use a short screenshot sequence to explain the promised IPFS/Arweave verification checks, within this chapter rather than as a standalone demo. |
| 11:30-15:30 | Keeping the rules: contract/governance powers and network/L1/L2 assumptions, including a usable escape route. |
| 15:30-18:30 | A test the audience can run this week, shared operators/funding/documentation, and a concrete improvement with its tradeoff. |
| 18:30-19:00 | Return to the user's work and the vision of infrastructure others can inherit and build upon. |
| 19:00-20:00 | Pauses and timing margin. |

For each taught layer: show its job, one failure, a check, an improvement and
what that improvement still costs. A persistent diagram can highlight the
current part of the stack. A layer does not need a paragraph of narration for
every component in the full inventory.

## Demonstration and presentation method

The earlier 3:30 plan was to establish an accepted public file reference,
retrieve the same artifact from IPFS and Arweave, reject altered bytes, and
distinguish a mismatch from an unavailable response. The fixed historical
fixture and open reproduction work are in [[presentation-evidence]]. This
tests one retrieval and integrity path; it does not establish the entire
app's survival or resistance to every authorized change.

**James's working direction, October 13:** presentation on the organizer's
laptop, using screenshots and multi-step visual explanations inside the three
chapters. No standalone or live demo, required video, browser switching or
terminal performance. EFS supplies concrete examples where they teach a useful
choice. It does not need to be presented as a finished solution to every layer.

Use a repeated visual rhythm: a failure, a usable alternative, then the
dependency that still remains. The following is a proposed storyboard, not
newly tested EFS behavior or an implemented slide revision.

### Chapter 1: Can I still enter the app?

Start with the familiar EFS web client and a small path diagram: name,
gateway, app release. Cross out the chosen gateway path, then reveal access
to the same retained release through an independently operated path. Capture
the actual alternative before showing a success screenshot. Finish with
three remaining requirements: name control, retained bytes and a trusted
release. Opening a retained release still needs its runtime dependencies.

ENS separates the name's content reference from a particular web host.
However, `.eth.link` and `.eth.limo` are conventional DNS/HTTPS gateways, not
independent operators: the eth.limo team reports moving eth.link onto its
service in September 2024. Two addresses make a useful reveal of a shared
dependency. A local ENS gateway or independently retrieved IPFS release is
a candidate improvement, not an EFS recovery path verified in this session.
See the sourced gateway example in [[presentation-examples]].

Suggested line: "I want the website to be a convenient entrance, not the only
way to use the app." Do not claim ENS removes all domain, controller, browser
or networking dependencies. Briefly connect Ledger's runtime-code incident
to why a retained release must include the code it actually executes.

### Chapter 2: Can I still do the work?

Keep one file and its accepted public EFS reference visible. Show an IPFS
retrieval, loss of that selected path, and matching bytes retrieved from
Arweave. Then contrast altered bytes with an unavailable response. Use
freshly captured results, with the record's chain basis and expected digest
visibly connected to the result; detailed commands belong in speaker notes.
An unavailable source does not mean the file is missing everywhere.

A small adjacent diagram separates three jobs: another RPC can answer;
supported chain proofs can help validate that answer; retained copies supply
the actual file. Multiple RPCs improve access but provider agreement is not
independent verification. Light clients such as Helios illustrate validation,
not guaranteed file retention, freshness or complete indexer results. They
still need available providers and a valid verification basis. Neither EFS
RPC failover nor EFS light-client integration has been verified here; describe
these as options until tested. Sources and limits are in
[[presentation-examples]].

This chapter preserves the accepted description's retrieval and verification
lesson without reserving a separate demo segment. No change to the accepted
proposal is being made.

### Chapter 3: Can I keep the rules I accepted?

Show one specific authority arrow, such as the power to change a release
pointer or upgrade a contract. Move the same authorized key from maintainer
to attacker. Then show what the user can refuse or retain. Keeping an old
interface can preserve its code; it cannot undo an upgrade to shared contract
state. Use EFS's actual deployed powers only after inspecting them, with
immutable and upgradeable designs as a clearly labeled comparison.

Finish by revealing inherited chain controls and the user's recovery route.
The documented OP Stack example can distinguish forced inclusion from
withdrawal without promising a universal L2 escape hatch. The question is
whether this user, with this account and available inputs, can actually use
the route. Keep extra authority details in notes or Q&A.

### How to build the visual sequences

Use consecutive slides with the same layout and one meaningful change per
click. These staged builds also make sense as static PDF pages. Prefer this
to timing-dependent animations or autoplay. Native appear effects are an
optional refinement only after testing in the supplied presentation workflow.
Do not make understanding depend on an effect surviving export.

Each frame should have one large screenshot or simple diagram, one highlighted
path and a short conclusion. Use the template's established colors and at
least 24 pt body text. Distinguish captured evidence from explanatory diagrams
and proposed improvements. Capture dates and technical identifiers belong in
notes. Do not manufacture an outage screenshot to look like an observed event.

The native rehearsal copy and archived first read-through remain unchanged
while this storyboard is discussed. Keep the next deck revision, notes and
PDF/PPTX exports in the version history described in [[Devcon/presentation/README]].

Recorded organizer instructions permit the supplied unique Google Slides
deck or James's laptop. The rehearsal copy is separate, so choosing the
organizer workflow includes transferring the final content to the supplied
deck and testing it there. Local PDF/PPTX files provide recovery and revision
history, not an additional organizer-approved submission channel.

Use the recorded **October 15** presentation-method notification target and
**October 27** slide/media deadline. The earlier date reflects a wording
conflict already documented in Personal. The public guideline PDF could not
be freshly retrieved October 13. The source record and personal completion
state belong in the [Personal tracker](../../../Personal/devcon-2026/README.md).
The organizer-laptop direction is recorded above. Notification to organizers
has not been confirmed or sent in this task; keep that personal step separate
from the deck work.

## Editorial feedback and next rehearsal

- Keep the human consequence visible through the technical middle. Being
  unavailable, losing a key, seeing stale state and accepting hostile code
  cause different harms even when the screen says the app is online.
- Give more time to the reason for the work. The earlier draft moved quickly
  into components and spent 3:30 on a narrow retrieval example.
- Use EFS confidently for a specific relevant mechanism. Repeated assurances
  that it is not a product pitch consume time without teaching the audience.
  State material limitations once where they affect the conclusion.
- Move rehearsal instructions and internal validation commentary out of the
  spoken script. The earlier notes mix those with audience narration.
- Keep the ISA/post-quantum discussion in Q&A unless the new argument needs it.
  The general compatibility point can fit in the computation layer.
- Recompose slides with much less text and at least 24 pt body type, matching
  the recorded organizer requirement. The color pass left small template
  body styles in place. Some old notes should become short visible phrases,
  while detail remains available to the speaker.
- A stable contract still needs usable access and state. A replaceable
  service needs code, inputs, permission, knowledge and a reason to operate.
  Avoid making decentralization sound like a list of product substitutions.
- Treat medical, civic and financial workflows as motivation for higher
  assurance. Passing this exercise alone does not certify suitability for
  them or justify permanently publishing private data.

The most useful next practice is a recorded two- or three-minute opening in
James's own words: the harm, the desired future and the two tests. Audio helps
assess pacing, clarity and wording. Video also shows eye contact, gestures and
whether slides pull attention away from the listener. Neither was supplied
with the 17-minute report. Preserve raw recordings outside Git and record
only appropriate observations and timing here.

After that, rehearse one layer using only its visual and short cues. A listener
should be able to say what can fail and name one useful change they could make.
