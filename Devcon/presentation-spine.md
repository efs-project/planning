# Who Can Turn Off Your Ethereum App?

Working story for **A Full-Stack Walk-Away Test**. Drafted 2026-09-14 for
James's accepted 20-minute talk plus 5 minutes of Q&A. This is presentation
preparation, not a change to the accepted proposal or an EFS release deadline.

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
if those credentials are used against the user. Write down the result and fix
the most consequential dependency first.

The reason to do the work is not architectural purity. It is to protect what
users create, let other developers build with confidence, and stop making one
maintainer's life the lifetime of everyone else's work.

## Timed story beats

These are speaking beats, not a required slide count. Aim for 19 minutes of
material, leave one minute for pauses and demonstration friction, and keep
the five-minute Q&A separate. The full inspection list belongs in the notes,
not on a slide full of labels.

| Time | Beat and suggested headline | What the audience sees or hears |
| --- | --- | --- |
| 0:00-1:15 | If I'm gone tomorrow | One person returning to their work. Ask both questions: absence and hostile control. State the human stakes before naming technologies. |
| 1:15-2:30 | The maintainer should be optional | James's motivation and a 30-second EFS introduction. Show a file, its public reference, and two possible places to retrieve it. No schema tour. |
| 2:30-3:15 | The protocol can survive while the front door closes | Uniswap interface/protocol comparison, with a source in the notes. One example is enough. |
| 3:15-5:15 | Can I still open the app I trusted? | EFS client, ENS name, exact app release, browser dependencies, wallet and local state. A name can move; a retained release gives users something stable to return to. |
| 5:15-7:15 | Can I reach and check the records? | Gateway, storage provider, RPC, indexer and network access. Distinguish a replaceable access service from a missing copy or missing history. Two URLs need not mean two independent operators. |
| 7:15-9:00 | Who can change the rules? | Contract upgrades, pause and configuration roles, plus external oracles or keepers where applicable. Immutability protects fixed rules; it also changes how fixes and migrations must work. |
| 9:00-11:30 | What is underneath the contract? | Execution and consensus clients, peers, validators, finality and transaction inclusion. A node can replace an RPC vendor, not the network. Add one brief L2 question: what if its sequencer stops, and can this app's users really use the documented recovery path? |
| 11:30-15:00 | Break one path. Keep the file. | Bounded EFS demonstration: known public reference, carrier A, carrier B, corrupt copy, unavailable source. Explain each result in ordinary language. Recorded fallback is ready. |
| 15:00-16:30 | What if the attacker has the right key? | Contrast corrupt bytes with a validly authorized malicious change. Diagram a redirected name or new release. Can users retain the old trusted reference and continue? Label this threat illustration separately from the verified retrieval demo. |
| 16:30-18:30 | Try this with one task in your app | Give the audience the exercise below. Name the costs: copies, verification, maintenance and a usable recovery path. Prioritize durable user work instead of freezing every piece of an app. |
| 18:30-19:00 | Let their work outlive yours | Return to the person and their archive. End on user freedom and continuation, not a product feature list. Leave the EFS link and notes available. |
| 19:00-20:00 | Timing margin | Breathing room, not permission to add another topic. |

At each layer, keep returning to the same person's task. The visual can follow
one request down the stack and back to the file, with an off switch and a
replacement path appearing where needed. Do not introduce a new system diagram
for every technology.

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
   remaining trust assumptions. Fix the failure that matters most to users.

This can be a paragraph in an existing README or a small issue in the app's
own repo. No EFS adoption, maintained dashboard, new standard, or certification
is required. EFS is also a possible building block for apps that need its file
records and references; explain the relevant feature when it solves the
problem on screen.

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
demonstration boundaries. [[preparation-plan]] holds the next rehearsal and
weekly review routine. The accepted copy stays in [[application-draft]].

The first review questions are: does the opening sound like James, can a
developer explain EFS after its introduction, and do they understand how to
apply the two tests without using EFS?
