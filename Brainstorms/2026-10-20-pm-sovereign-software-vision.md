---
agent: pm
date: 2026-10-20
status: reference
anchors:
  - area: meta
  - milestone: devcon-2026-11
---

# Software that outlasts us

James's values and ambitions, captured from the Devcon preparation conversation
on October 20, 2026. His words are preserved below. The interpretation and
questions are planning input, not new protocol rulings or implementation claims.

Use [[Devcon/presentation-compass]] when reviewing the talk. Related primary
writing is collected in [[Devcon/vision-research]]. Existing design authority
continues to live in the relevant owner rulings and promoted specifications.

## James's words

> I do want to inspire Ethereum developers to build credibly neutral apps we can all rely on and trust enough to form a foundation of our new digital society. Software that outlasts us. Software that protects the user's right to free expression. Software built on open standards allowing for easy collaboration by default. Software where each important layer can be operated by at least 3 or more participants with no single point of failure. Software where everyone is equal, ensuring helping humans and AI play by the same consensual rules. Software that is always available so it can be relied on for governance, infrastructure, and as a layer for the software components on top. Software that puts the user's needs first and not the needs of the creator or facilitator. Software that is modular where anyone can create a module and the user chooses which module to fit into their system.

> I'm sure there's more but that's my brainstorm of my values. The EFS planning repo might have more.

> My personal goal for this presentation is to convey my vision of a future where we all write software like this and we form an open collaborative super app that everyone can use freely, experts can improve parts with users easily using those parts, every part is decentralized / reliable / configurable so no single entity has the power to alter or shut down the system without consent, and data is verified / useful / valid even as the software grows and upgrades. Sorry I began just listing values again. But if Ethereum developers start fixing portions of their app to be more reliable, replaceable, and decentralized then we will move closer to my vision of a world where devs collaboratively build bigger / more critical things that users can rely on to run their lives and possibly govern a new digital society that we can use to slay Moloch the god of coordination failure (thanks Ameen Solimani)

James also asked us to keep questioning the vision, audience feeling and core
message as we work. Examples, memes and animation are flexible. The underlying
purpose should remain clear and consistent.

### Clarification about consent

Asked whether consent means an individual's ability to refuse changes or a
community's agreed process for changing shared rules, James answered:

> Both. Apps like Linux let users upgrade when they want and doesn't force it. Ethereum obviously needs everyone to upgrade at the same time. Both are important. I don't have a clear rubric but the vast majority of apps are more like Linux where users shouldn't need forced upgrades.

Working interpretation: user-chosen upgrades should be the default for most
application software. Shared-state systems also need legitimate coordination
over common rules. The Linux/Ethereum comparison is an analogy about where
coordination is necessary, not a claim that all Ethereum users install a
release simultaneously. Keeping an old client does not preserve old shared
contract rules after an upgrade. The remaining question is what meaningful
refusal or exit each kind of change permits.

### Clarification about whose story to tell

Asked whether the person, community or developer should carry the opening and
closing, James explained that all three matter. EFS focuses on a person keeping
their life's work. His wider hyperstructure vision concerns communities
building and governing bigger things together. This talk teaches developers
to improve their stacks, so that vision should inspire them rather than become
its main subject. He considered the developer story and ended tentatively:

> So maybe my final answer is a user keeping their data intact as it's easy for the audience to connect with.

Editorial recommendation: start with a person's ability to keep using their
work, make developers the people who can protect that ability, and show
community-scale cooperation as the reward. These are three roles in one
argument, not three equal storylines. James's tentative preference does not
settle the exact persona or anecdote, and the recommendation has not yet been
applied to the slides.

## A coherent statement of the vision

Build an open software commons that people can rely on without surrendering
control over their lives. Its useful capabilities should survive their
creators, support independent implementations, and remain understandable and
usable as tools evolve. Each improvement should give users more choice and
give the next builder a dependable foundation.

The "super app" is a possible user experience of this commons, not necessarily
one application, company, mandatory interface or global administrator. A person
could assemble a coherent system from compatible parts, keep their own data
and permissions, and change parts without starting their life over. This is
editorial synthesis for James to refine, not a selected OS architecture.

## Values and their practical meaning

| Value | What it should mean for a user or builder | Question that keeps the promise honest |
| --- | --- | --- |
| Continuity | Useful work survives a founder, company or service. Other apps can depend on it. | Can another person actually continue the important task? |
| Credible neutrality | Rules do not depend on a favored provider's continuing goodwill. | Who can change, exclude or extract, including through inherited dependencies? |
| Free expression and privacy | People can communicate and choose what they disclose without one mandatory intermediary. | Which layer controls publication, access, discovery or filtering, and can users choose another? |
| Open collaboration | Open code, standards and useful documentation let others build compatible improvements. | Can an independent implementation work without private specifications or permission? |
| Independent operation | Important functions have multiple genuinely independent paths. James's stated ambition is at least three participants. | Are operators, credentials, infrastructure, inputs and funding actually independent? |
| User choice and consent | People normally choose their software, modules and upgrades; shared changes have an explicit process. | What can a user refuse, preserve, migrate or leave, and at what cost? |
| Human and agent participation | Authorized humans and AI can use the same understandable actions and rules. | Does any participant gain hidden authority, or bypass a permission boundary? |
| Dependable availability | Essential functions can support consequential workflows and downstream applications. | What failures are tolerated, how does recovery work, and who keeps supplying resources? |
| Modular improvement | Experts can improve one part without taking control of the whole system. | Can users safely substitute that part while preserving data, permissions and behavior? |
| Verifiable continuity | Data remains interpretable and useful through software changes. | Can readers check provenance, authority, freshness, completeness and meaning, not just bytes? |
| User benefit first | Convenience, funding and growth serve users rather than making them captive. | Can users realistically leave the default provider without losing the useful system? |

Three providers is a concrete aspiration, not a universal fault-tolerance
proof. Some systems need one honest source; others need a quorum or a larger
consensus network. Independence and the operation being protected determine
the useful test. Preserve James's ambition while examining the actual powers.

"Always available" describes the desired foundation. A demonstrated guarantee
must name its conditions, including retained data, connectivity, resources
and the underlying network. The goal is sustained useful operation, not the
claim that a system needs no people, care, energy or money.

## Existing EFS roots

- [[Designs/efsv2/owner-rulings#EFS 2.0 greenfield system boundary]] records the adopted Core / optional Commons / clients boundary. Core must remain useful without EFS OS or a canonical EFS-operated service. Earlier mechanism choices do not survive the reset automatically.
- [[Designs/web-client-os/README#Direct owner direction recorded for this round]] records James's modularity, separate privacy concerns, human/agent actions, roughly 50-year standards horizon, accessibility and explicit update acceptance. These are requirements in a draft baseline, not proof of deployed behavior.
- [[Designs/web-client-os/product-constitution-and-roadmap#Product constitution]] develops inspectable defaults, replaceable modules, explicit authority, honest failure and usable exit. This is a draft synthesis, subordinate to owner direction.
- [[Designs/efsv2/system-constitution]] distinguishes shared evidence from global truth and treats Commons-like services as optional. Its exact mechanisms remain subject to the document's stated authority hierarchy.
- [[Devcon/presentation/2026-10-20-practice/slides-and-notes]] already connects durable capabilities to compounding progress. The next refinement should make that connection recur through the technical chapters.

Two values worth making more visible are accessibility and practical
affordability. An escape path that only an expert can execute, or only a rich
user can afford, is a weaker form of freedom. Privacy also needs explicit
attention: public persistence is useful for some records and harmful for
others. These concerns already have roots in EFS planning.

## Choices still worth discussing

1. **The human story.** Which person should carry the opening and closing: an
   individual preserving their life's work, a community governing itself, or
   a developer building on another team's work? James's response above leans
   toward the individual. The recommendation is a person-led opening, developer
   action through the chapters, and the shared future at the close. Choose a
   concrete task before adding a detailed persona or anecdote.
2. **Consent under shared change.** Individual software choice and collective
   rule changes both matter, as James clarified. The boundary between them
   needs examples rather than a universal rubric invented for this talk.
3. **Expression and moderation.** How should a neutral foundation coexist with
   user-selected filtering, community rules and protection from abuse? A
   replaceable interface need not display or endorse every available record.
4. **Equal standing.** The current direction supports common rules and explicit
   authorization. It does not yet choose voting rights, Sybil defenses,
   allocation of scarce resources, or a theory of AI personhood.
5. **Funding without captivity.** What paid conveniences, incentives or public
   support can sustain independent operators without making one sponsor
   indispensable? This is longer-term design work, not a Devcon deliverable.

Ask these gradually, when an answer would change a sentence, example or
decision. Do not present the list as homework due before the slides.

## Next work

For Devcon, use [[Devcon/presentation-compass]] to tighten the opening, chapter
transitions and closing after James's current read. Keep the existing stack
map, tested distinctions and time budget. Do not add an OS architecture chapter
or promise a maintained decentralization framework.

After the talk, this record could seed a short public essay and a set of
concrete user journeys for EFS and the modular OS. Compare each journey with
existing projects before choosing mechanisms. No new implementation or
publication commitment follows from this brainstorm.
