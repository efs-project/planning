# Who Can Turn Off Your Ethereum App?

Working story for **A Full-Stack Walk-Away Test**. Drafted 2026-09-14 for
James's accepted 20-minute talk plus 5 minutes of Q&A. This is presentation
preparation, not a change to the accepted proposal or an EFS release deadline.

## Current revision, October 20

After a 17-minute read of the speaker notes, James asked to lead with a
clearer problem and inspiring vision, formalize the stack, and teach checks
and improvements for the audience's own apps. EFS belongs where it is
directly useful. His latest instruction is to settle content and flow before
animations or other polish. That revision is now implemented in the native
rehearsal copy. James then approved a sharper introduction: the problem is
fragile apps that strand users and make other apps fragile. The positive
vision is CROPS apps and hyperstructures that people can trust with important
data and future builders can rely on. The latest version is saved in
[[Devcon/presentation/2026-10-20-practice/README]]. It has 18 main slides,
one resource/Q&A page and spoken notes, with 19 minutes planned but no measured
run yet. [[stack-map]] defines the eight functional layers.

The October 20 pass preserves that story and substitutes concrete improvement
paths for generic explanations. Safe 2-of-3 signers illustrate account recovery,
PoolTogether claimers illustrate replaceable work, Uniswap v2 core illustrates
scoped fixed rules, and Safe CLI illustrates continued use through another
interface. Supporting details move to reference notes. Slides 13 and 14 also
have shorter spoken routes. The main route is 2,143 words.

The working delivery direction remains the organizer's laptop, without a
standalone or live demo. This draft uses static text. Screenshots are optional
and do not block today's rehearsal. The Personal tracker owns organizer method
notification and submission. The organizer's original deck has not been changed.

### The current argument

Build apps that people and other apps can depend on beyond the lifetime of
their original teams. Users put years of work into applications that can
disappear, break or change their rules. Users can lose access to their data
and workflows. Every application built on that service inherits its risk.

The positive goal is reliable software people can trust with their most
important work, and useful capabilities other developers can build into their
own apps. Each durable capability gives the next builder something to use.
New applications extend the value of the shared foundation. Progress compounds.

James explicitly wants CROPS apps and hyperstructures. CROPS names censorship
resistance, open source, privacy and security. The hyperstructure ambition is
permanent, permissionless infrastructure that continues on its underlying
blockchain. The talk brings that ambition to the complete user-facing app.
Keeping important data useful includes protecting access and privacy; it does
not mean making sensitive records public. Sources and the distinction between
the ambition and the original protocol definition are in [[presentation-examples]].

The walk-away test is the method for examining that promise. Test one
important user task under two conditions: the team
is absent, or its authority is hostile. The chapters follow what the task
needs: a way into trusted software, data and computation that remain useful,
and rules and settlement the user can still rely on. Shared operators,
funding, documentation and a usable exit connect all eight layers.

EFS makes naming, retained software and file verification concrete. Pocket,
Ledger Connect Kit, Safe, Graph Node, Chainlink, Uniswap, OP Stack and Git
supply short contrasts where their details sharpen the lesson. They are
examples of mechanisms, not whole-project decentralization ratings.

### Implemented flow

These allocations total 19 minutes, with a minute of margin and the separate
five-minute Q&A. They are not a measured rehearsal result.

| Time | Slides | Story purpose |
| --- | --- | --- |
| 0:00-1:00 | 1-2 | State the problem, harm to users and builders, the durable-app ambition and what the talk will teach. |
| 1:00-2:15 | 3 | Make the vision concrete: important work, reusable capabilities, CROPS and the ambition of hyperstructures. |
| 2:15-3:15 | 4 | Introduce absence and hostile control, with Pocket as a brief example after the central argument. |
| 3:15-4:00 | 5 | Map eight jobs into three chapters and introduce the EFS file task. |
| 4:00-7:30 | 6-8 | Entering the app: naming and access, runnable releases and build inputs, accounts and recovery. |
| 7:30-11:30 | 9-12 | Continuing the work: retained data, file verification, trustworthy and complete state, offchain computation. |
| 11:30-15:30 | 13-14 | Keeping the rules: contract and governance powers, inherited protocols, network/L1/L2 dependencies and usable recovery routes. |
| 15:30-18:30 | 15-17 | Shared operators and funding, an exit someone can use, and a safe test developers can run on one task in their own app. |
| 18:30-19:00 | 18 | Return to trustworthy apps and shared capabilities whose usefulness can grow beyond their creators. |
| After the talk | 19 | Questions and EFS resources. |

The EFS verification sequence is explanatory, not a claim of newly observed
retrieval results. Fresh captures remain in [[presentation-evidence]]. The
current spoken text is preserved with the snapshot. Next, James does a timed
run and identifies unclear transitions or wording that is not in his voice.

Everything below is the earlier working spine, retained for comparison. Its
demo timing and stage instructions do not govern the current revision.

## Earlier working direction

James clarified on **2026-09-14**: EFS is the through line, and examples from
other projects should appear wherever they clarify a failure, show another
design choice, or offer a useful improvement. Do not restrict the talk to one
outside example. Use the sourced bank in [[presentation-examples]] as we
develop each layer.

For every layer we teach, explain its job, a failure the developer can
recognize, a way to test or improve it, and the cost or remaining assumption.
The desired result is an informed design choice. A developer should leave
knowing which failures matter to their users and whether to defend against
them, accept them explicitly, or investigate further.

## The story in one page

Someone puts work into an app because they expect that work to matter later.
Imagine a community building a shared archive. Years later, someone needs a
file from it. The person who built the app is gone. Can they still find the
file, retrieve it, and check that it is what they wanted? This is an imagined
user journey, not a claim about an existing EFS customer.

Now change one thing. The maintainer is still there, but someone else has their
keys. The familiar address serves a different app. Its signatures and hashes
are valid. Can users keep using the version they trusted, or refuse the change
and continue elsewhere?

These are two different tests: **can users continue without me, and can they
refuse someone acting as me?** Death, burnout, a closed company, coercion, and
compromised accounts make this a practical question about other people's work.

I built Ethereum File System because I want public infrastructure whose users
do not depend on my continued permission or availability. EFS is an open-source
public good for naming and describing files through onchain records and
verifiable file references. The bytes can live in different places. EFS gives
us one concrete journey to follow through the entire stack.

A familiar comparison makes the distinction clear: Uniswap Labs' interface
can restrict access separately from the underlying protocol. Keeping contracts
alive does not necessarily keep a user's normal way of reaching them alive.
This is an architectural example, not criticism of a team's intentions.
Other projects provide short comparisons along the way, including release
security, wallet authority and recovery below an L2 sequencer.

We follow the EFS user downward: the app and its name, the paths to its files
and records, the contracts and their controllers, and finally the blockchain
and network underneath. At each stop, ask who can interrupt or change the
journey and what a user would actually do next. Then return to the user with
a small demonstration: retrieve the same file through another carrier, check
it against public records, and distinguish bad bytes from a failed retrieval.

The demonstration proves a particular recovery path. It does not prove that
all of EFS, all writes, or all future files survive every failure. The useful
lesson is how to establish that path and expose what still needs someone to
maintain it. A stolen key adds another requirement: preserving an accepted
reference and the ability to reject future changes. A correct hash cannot tell
you whether a correctly published change is good for you.

The audience leaves with one exercise, not a scoring system: choose an
essential task, identify who can stop or redirect it, and ask an outsider to
complete it without the team's services or credentials. Then ask what happens
if those credentials are used against the user. Write down the result, choose
which risks the app should defend against, and improve the path that matters
most to its users.

The reason to do the work is not architectural purity. It is to protect what
users create, let other developers build with confidence, and stop making one
maintainer's life the lifetime of everyone else's work.

## Timed story beats

These are speaking beats, not a required slide count. Aim for 19 minutes of
material, leave one minute for pauses and demonstration friction, and keep
the five-minute Q&A separate. The full inspection list belongs in the notes,
not on a slide full of labels.

Weave outside examples into these time blocks instead of adding project tours.
The first rehearsal can try Uniswap, Ledger Connect Kit, Safe and OP Stack as
brief contrasts. Swap in Graph Node, Git or Chainlink where they explain a
point better. The selection remains adjustable and the full bank can accompany
the talk. Sources and limits are in [[presentation-examples]].

October 12 addition: the proof-system compatibility example in
[[presentation-examples#Immutable programs and changing proof systems]] can
replace 20-30 seconds of generic explanation in the blockchain beat. Its
lesson is that fixed application rules still need usable computation and
maintained compatibility. Keep the ISA debate in supporting notes; the EFS
file journey and demonstration remain the same.

| Time | Beat and suggested headline | What the audience sees or hears |
| --- | --- | --- |
| 0:00-1:15 | If I'm gone tomorrow | One person returning to their work. Ask both questions: absence and hostile control. State the human stakes before naming technologies. |
| 1:15-2:30 | The maintainer should be optional | James's motivation and a 30-second EFS introduction. Show a file, its public reference, and two possible places to retrieve it. No schema tour. |
| 2:30-3:15 | The protocol can survive while the front door closes | Uniswap interface/protocol comparison, with a source in the notes. Establish that an app has more than one access path to inspect. |
| 3:15-5:15 | Can I still open the app I trusted? | EFS client, ENS name, exact app release and its dependencies. Use Ledger Connect Kit to explain why the release pipeline matters. Point to retained builds, deliberate updates and a tested alternative entry point. |
| 5:15-7:15 | Can I reach and check the records? | Gateway, storage provider, RPC, indexer and network access. Distinguish a replaceable access service from a missing copy or missing history. Two URLs need not mean two independent operators. |
| 7:15-9:00 | Who can change the rules? | Wallet and contract authority, plus required computation or oracle inputs. Safe modules show why the signer threshold alone is not the whole permission model. Explain how to inspect powers and test a path that needs no privileged maintainer. Fixed rules also require a plan for bugs. |
| 9:00-11:30 | What is underneath the contract? | Execution and consensus clients, peers, validators, finality and transaction inclusion. A node can replace an RPC vendor, not the network. Add one brief L2 question: what if its sequencer stops, and can this app's users really use the documented recovery path? |
| 11:30-15:00 | Break one path. Keep the file. | Bounded EFS demonstration: known public reference, carrier A, carrier B, corrupt copy, unavailable source. Explain each result in ordinary language. Prepare the recording and offline fallback before delivery. |
| 15:00-16:30 | What if the attacker has the right key? | Contrast corrupt bytes with a validly authorized malicious change. Diagram a redirected name or new release. Can users retain the old trusted reference and continue? Label this threat illustration separately from the verified retrieval demo. |
| 16:30-18:30 | Try this with one task in your app | Give the audience the exercise below. Name the costs: copies, verification, maintenance and a usable recovery path. Ask which failures their app should defend against and which dependencies they will accept openly. |
| 18:30-19:00 | Let their work outlive yours | Return to the person and their archive. End on user freedom and continuation, not a product feature list. Leave the EFS link and notes available. |
| 19:00-20:00 | Timing margin | Breathing room, not permission to add another topic. |

At each layer, keep returning to the same person's task. The visual can follow
one request down the stack and back to the file, with an off switch and a
replacement path appearing where needed. Do not introduce a new system diagram
for every technology.

Check the complete journey rather than a list of product names. Opening an
old frontend, recovering the relevant data and keys, and continuing a useful
operation are different accomplishments. People and budgets cut across all
the layers. Several providers paid through one account can fail together.

## Proposed opening, in James's voice

> If I die tomorrow, I don't want the things people built with my software to
> die with me.
>
> And if somebody steals my keys, I don't want that person to inherit control
> over everyone who trusted me.
>
> That sounds obvious. But we build Ethereum apps where the contracts keep
> running while the interface, the data, or the only usable way to find them
> disappears.
>
> I built Ethereum File System because I care about that gap. Today I want to
> follow one user through the whole stack and ask what they can still do when
> the people behind it are no longer available, or no longer trustworthy.

Read this aloud before polishing it. Keep the death line only if it sounds
natural to James. The warmer alternative is: "I want the things people build
with my software to have a future that doesn't depend on me being there."
Do not add an invented personal tragedy to explain the motivation.

## The audience's take-home exercise

Pick one task that would hurt your users to lose: opening their work,
retrieving a file, publishing an update, or recovering control of an asset.
Reading and writing are separate tests; choose deliberately.

1. Trace everything needed to complete it. Who can stop it or change its rules?
2. Remove the team's accounts, endpoints, keys and help. Give an outsider the
   public instructions. Can they complete the task from a fresh setup?
3. Assume those accounts or keys are hostile. What can change? What can the
   user refuse, retain or take elsewhere?
4. Record what worked, what failed, the time and resources needed, and the
   remaining trust assumptions. Include whether an ordinary user could follow
   the recovery steps without you.
5. Decide what to defend, what to accept explicitly, and what needs more
   evidence. Start with user harm and your recovery goal, then choose the
   simplest improvement that addresses them. Retest the complete task.

This can be a paragraph in an existing README or a small issue in the app's
own repo. No EFS adoption, maintained dashboard, new standard, or certification
is required. EFS is also a possible building block for apps that need its file
records and references; explain the relevant feature when it solves the
problem on screen.

For example, a replaceable read-only gateway may be an acceptable convenience.
A server that alone holds the key needed to decrypt everyone's work is a very
different dependency. A safe read-only mode can be preferable to continuing
sensitive writes with stale inputs. The decision should follow the app's
purpose, rather than a demand to maximize decentralization in every component.

## Proposed closing

> Someone still has to keep copies, run nodes, and make software usable. The
> question is whether it has to be you, and whether your users need your
> permission to carry on.
>
> Pick one thing your users should never lose because you stopped answering.
> Try doing it without your team. Then try it with your team's keys in the
> wrong hands.
>
> I want people to build things with EFS that outlive me. Whatever you're
> building, your users deserve that chance too.

## What stays out of the main talk

- EFS schema internals, exact artifact byte counts and benchmark tables.
- A tour of every storage network, rollup design, or consensus mechanism.
- A second long live demo, fresh onchain writes, or an extended OS pitch.
- Claims that immutable means safe, content addressing means available, or
  a signature means an author is trustworthy.
- A promise to maintain a general decentralization scoring tool.

An EFS overview video thumbnail and a short notes URL can sit on the final
resource slide. The explanation in this talk must stand on its own. Use one
clear link/QR destination rather than several competing calls to action.

## Review and preparation

[[presentation-evidence]] holds sources, the layer inspection list and the
demonstration boundaries. [[presentation-examples]] holds outside comparisons
and their limits. [[preparation-plan]] holds the next rehearsal and
weekly review routine. The accepted copy stays in [[application-draft]].

The first review questions are: does the opening sound like James, can a
developer explain EFS after its introduction, and do they understand how to
apply the two tests without using EFS? Can they name a failure in their own
app, propose an improvement and explain why they would or would not make it?
