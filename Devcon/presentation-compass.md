# Presentation compass

Updated October 26, 2026. Keep this beside the deck when reviewing its message.
James's original words and consent clarification are in
[[Brainstorms/2026-10-20-pm-sovereign-software-vision]]. Supporting ideas and
their limits are in [[vision-research]]. This is an editorial guide, not a
new scoring system or EFS architecture specification.

## The central message

We can build software people can trust with important parts of their lives
without making those lives depend on the continued permission or survival of
its creators. When useful capabilities remain open, dependable and compatible,
other people can build on them. Progress can accumulate instead of repeatedly
being lost inside abandoned or captured platforms.

The walk-away test is how this talk turns that ambition into a developer's
next practical step. It asks whether people can continue when a team disappears
and what they can refuse when that team's authority becomes hostile.

## What success looks like

A listener leaves wanting to protect one important user task in their own app.
They can identify its dependencies, name who controls them, test an alternative,
and choose one improvement. They see this work as a contribution to shared
foundations, not just defensive engineering or a decentralization purity test.

The desired feeling is: "My work could become something people keep building
on. I know one thing I can do to make that more likely."

The broader horizon is a user-chosen, interoperable software ecosystem that
could support personal work, communities and governance. Do not imply that
the talk proves a whole digital society safe or settles its political rules.

## Principles to preserve

- Put users' continued agency ahead of a creator's lasting control.
- Carry CROPS together: censorship resistance, open source and freedom,
  privacy, and security. Durable public bytes alone do not fulfill that aim.
- Use open standards and compatible interfaces so independent improvements
  can become useful without rebuilding the entire system.
- Seek genuinely independent operation. James wants at least three participants
  at important layers; the useful test is whether shared control or missing
  inputs can still defeat them together, not whether a diagram has three boxes.
- Preserve user choice over application upgrades and modules. For shared rules,
  explain the agreed change process and the user's actual options afterward.
- Treat authorized humans and agents consistently without giving automation
  extra powers. Keep this as context unless it sharpens a taught example.
- Make verification preserve useful meaning as well as bytes. Authority,
  freshness, completeness, formats and accepted versions matter.
- Keep replacement and exit usable. Time, cost, instructions, privacy and
  accessibility are part of whether a freedom can actually be exercised.

## The story and the technical chapters

Start with the harm: people put years of work into apps, and other developers
build on them. A shutdown or hostile change can strand both. Then show the
alternative: lasting capabilities that people can choose, improve and combine.
Only then introduce the stack as the practical work needed to get there.

Keep the audience's own existing application as the implied subject. The
opening imagines a person keeping years of useful work. Use local examples
where a mechanism needs explanation, rather than a recurring fictional app.
James approved the person-led stakes, developer action and community horizon
after considering all three motivations. The specific research-notes persona
is illustrative, not an EFS customer testimonial or deployed editor.

### One story at three scales

The recommended structure gives all three motivations a different job:

- **The person supplies the stakes.** Years of useful work should not become
  inaccessible when an app disappears or changes its terms.
- **The developer supplies the agency.** Decisions at each layer can let that
  person continue, switch tools, and benefit from someone else's improvements.
- **The community supplies the horizon.** When many developers preserve these
  freedoms, people can build shared workflows and institutions on the results.

For example, imagine someone with years of research notes. The original app
disappears, but they can open and use those notes in another compatible tool.
Another developer can improve that tool without taking over their data. The
same durable formats and accepted rules can support shared work where people
choose to collaborate. This is an illustrative future, not a claimed EFS
deployment. Start with the user's work and earn the larger vision through the
technical chapters. Keeping bytes intact is necessary but not sufficient.

| Chapter | The human promise | The engineering question |
| --- | --- | --- |
| Entering the app | You can reach your tools and choose which software to run. | Can you obtain accepted code, recover authority and use an independent entrance? |
| Continuing the work | Your work remains usable when a provider disappears. | Are bytes, keys, meaning, state and required computation available through a working alternative? |
| Keeping the rules | Your future does not depend on an administrator remaining benevolent. | Who can change the deal, what can you refuse, and which network assumptions remain? |

Use the eight jobs in [[stack-map]] without adding another taxonomy. Shared
operators, funding, documentation and community knowledge cross all chapters.
For each taught layer, connect failure, a check, an improvement, and its cost
back to the user task. Technical detail earns its place by helping that choice.

## EFS and other examples

EFS is James's personal reason to care and a concrete working example. Explain
what he is trying to make possible, then show the mechanism relevant to that
moment. Distinguish a design goal from what the example actually establishes.
Do not apologize for using EFS, promise that it solves every layer, or force it
into a layer another project explains better.

Keep the existing non-EFS examples where they expose a different failure or
choice. A successful replacement path is more useful than another project
name. The newest research is primarily context and Q&A material, not a reason
to expand the spoken example list.

## Positive teaching direction, October 26

James asked for useful ideas on the slides, rather than lists of what each
technology does not do. Lead with the freedom or improvement, explain a
concrete mechanism, and give the developer a check. Keep qualifications in
optional speaker notes unless they are essential to understanding that action.
The notes must preserve accuracy without making the main story defensive.

Give hyperstructures a plain-language introduction and a shared-foundation
diagram. Explain why dependable protocols let different teams build useful
tools that add to one another's work. The original definition remains in
reference notes, not a new taxonomy the audience must memorize.

EFS belongs mainly in the data chapter. James's later October 26 direction
removes Nostr and requests Ethereum examples or clearly invented shared data.
His subsequent read-through found the recurring Garden DAO too close to a
build tutorial. The approved concept-first revision teaches portable formats,
meaning, permissions and compatible readers. EAS illustrates structured
statements. EFS illustrates shared file references and verification. Neither
is a required architecture. Include database exports and restore paths for
existing apps. Two small mock interfaces show the benefit of shared data.

Show actual composition in the hyperstructure vision: separate teams provide
membership, voting and treasury; a DAO app combines them; a social app uses
that DAO plus a moderation module. Give the checklist a worked example with
a visible failure, repair and resumed user task. Preserve useful Ethereum
comparisons without introducing a new unfamiliar project at every layer.

Explicitly encourage immutable core contracts and voluntary migration to new
deployments. Keep this distinct from user-chosen app updates and coordinated
changes to shared network rules. Close with a concrete checklist that recaps
the three chapters and an invitation to improve one important user task.

The through line is reducing single points of failure and control. Teach each
layer's job, the dependency that can stop it, an improvement and a check.
Use the one worked test at the end to show a failed attempt, the repair and
the retry. Keep technical limits in optional notes unless the action needs them.

The concept-first basis is recorded in [[presentation-concept-revision-2026-10-26]].
[[presentation-concrete-revision-2026-10-26]] and
[[presentation-positive-revision-2026-10-26]] preserve the preceding revisions.
The earlier refinements below remain history, not current slide numbering.

## Bounded polish, October 26

The current revision is saved in
[[Devcon/presentation/2026-10-26-polish/README]] from the same native rehearsal
copy. Keep its 30 slides, three chapters, owner theme and 18:30 planned route;
no measured rehearsal is established. This is a clarity pass, not a new story.

- Slide 6 asks listeners to choose their own important user task. The hostile
  name redirect on slide 10 returns on slide 23 as a retained-release and
  stable-contract choice. Slide 27 makes administrator powers explicit.
- Slide 12 keeps privacy visible and separates account recovery from
  encryption-key recovery. Slides 15-16 align attachment revision 2 and author
  identity; slide 17 names Ethereum full nodes. Slide 25 includes funding in
  the handoff, not just instructions and code.
- Slide 18's July 29 EFS archive-results caption reports historical evidence.
  It is not a screenshot, fresh retrieval or whole-app walk-away result.

Keep the concept-first record and owner edits intact. No organizer change,
live demo or public QR is included in this polish pass.

## Approved refinements implemented October 20

James approved the combined vision and technical spine and asked for the deck
update and example audit. [[Devcon/presentation/2026-10-20-integrated-spine/README]]
implements the refinements below within 18 main slides, three chapters and
the planned 19-minute route. This is not a measured rehearsal. New examples
replace generic exposition, with reserves in [[example-audit-2026-10-20]].

1. **Slides 2 and 3:** sharpen the causal link. Fragile dependencies make users
   vulnerable and make it risky for others to build on our work. Dependable,
   open capabilities let their contributions accumulate. Make one user or
   community tangible before naming the ideals.
2. **Chapter transitions:** briefly return to what that person has regained:
   their entrance, their work, and their ability to choose the rules. Avoid
   transitions that merely announce the next infrastructure component.
3. **Slide 13:** use James's consent distinction. Choosing a client version is
   different from changing shared state. Ask who chooses, what changes and
   what users can still do if they disagree. Retain the repair/immutability
   tradeoff and the exact deployment boundary.
4. **Slide 17:** keep the small achievable action. Choose a consequential task,
   test without the team's help, inspect hostile authority, and improve the
   dependency that causes the most harm. No new maintained framework.
5. **Slide 18:** bring the user and the next builder back together. The reward
   is that people retain their work and choices while others inherit something
   dependable enough to extend.

A possible closing, for James to react to:

> I want us to build software people can trust with the important parts of
> their lives. Software they can keep using, improve, and build on without
> asking whether its creator will still be here, or still agree with them.
> Start with one task in your app. Make it survive without you. That is one
> more foundation the next person can build on.

This is a draft invitation, not a demand to promise unconditional permanence.

## Questions to use during review

Ask one or two when they can influence the next revision. Keep answers in this
guide or a dated record, and do not reopen settled choices without new reason.

- **Vision:** Which moment makes the future feel worth building rather than
  merely technically impressive?
- **Human stakes:** Whose loss or regained freedom feels real to you here?
- **Developer feeling:** Does this section leave a builder curious and capable,
  or judged and overwhelmed?
- **Meaning:** What freedom does this mechanism protect? Can we explain that
  before naming the tool?
- **Agency:** What can a listener do next week without rebuilding everything?
- **Voice:** Which sentence sounds like your actual reason for building EFS,
  and which sounds like somebody else's manifesto?

After a rehearsal, ask the listener what the talk was about before explaining
it again. If they remember only gateways and contracts, strengthen the human
connections. If they remember only the dream, make the concrete action clearer.

## Keep the scope manageable

Defer a full theory of AI participation, an OS module tour, governance design,
Moloch history, a universal three-operator rule, and new demos. These belong in
the longer-term vision work unless one sentence improves the existing story.
Screenshots, humor and animation remain optional delivery choices after the
message works aloud. The next evidence we need is James's response to this
version and a measured run, not a larger deck.
