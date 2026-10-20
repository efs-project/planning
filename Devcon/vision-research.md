# Sources for the software vision

Primary-source research checked October 20, 2026. These connections help James
articulate his own view. They are not endorsements of EFS or proof of its
implementation. The working talk guide is [[presentation-compass]]; the original
owner context is [[Brainstorms/2026-10-20-pm-sovereign-software-vision]].

## Most useful for this talk

### Ethereum Foundation mandate

[The Ethereum Foundation Mandate](https://ethereum.org/foundation/mandate/),
Ethereum Foundation, March 13, 2026.

The mandate connects individual sovereignty with coordination at scale. It
explicitly wants Ethereum's protocol and core application layers to keep
functioning and evolving without the Foundation or today's core developers.
CROPS includes censorship resistance, open source and freedom, privacy, and
security. User agency and resilient institutions are goals, not merely growth.

This is a strong connection to James's ambition for dependable societal
infrastructure. Use it to explain why the question belongs at Devcon. It does
not establish that a particular app has achieved these properties or that
every application should use a blockchain.

### Walk-away and insider-attack tests

[Making Ethereum alignment legible](https://vitalik.eth.limo/general/2024/09/28/alignment.html),
Vitalik Buterin, September 28, 2024.

Vitalik distinguishes the team's disappearance from its deliberate misuse of
power. He favors inspectable properties, open source and interoperable
standards over alignment defined by social connections. Criteria should fit
the application.

The talk extends these two questions across a user's entire task. Keep them
distinct: replicated hosting does not prevent an authorized malicious update,
and removing an upgrade key does not preserve missing data. This is the most
direct intellectual source for the teaching method, not a mandate to maintain
a scorecard or certify whole projects.

### An open internet stack

[Make Ethereum Cypherpunk Again](https://vitalik.eth.limo/general/2023/12/28/cypherpunk.html),
Vitalik Buterin, December 28, 2023.

The essay situates Ethereum within an open internet stack, including storage,
messaging, privacy and interoperating tools. Open code alone does not protect
collaborative data controlled by a corporate server. Auditability, neutrality
and pluralism serve a wider social purpose.

This helps explain James's modular ecosystem vision. A common foundation can
support different tools and community choices without one compulsory front
end. The essay is not evidence of permanent availability, compatible data
semantics or privacy in any specific system. Higher-layer choices about
harmful content are distinct from neutral base infrastructure.

### Hyperstructures

[Hyperstructures](https://jacob.energy/hyperstructures.html), Jacob Horne,
January 16, 2022.

Horne describes permissionless, credibly neutral protocols that persist
without their creators, conditional on the underlying blockchain. His fee
argument distinguishes protocol-wide extraction from gas and participant
incentives. Arbitrary administrative replacement of core rules falls outside
his definition.

James's interest extends this durable-foundation ambition to the whole app.
Horne also anticipates singular utilities; James emphasizes independent
alternatives. Shared authoritative state can coexist with competing clients
and operators. Redundant gateways are not the same as separate incompatible
ledgers. Use the essay for the positive vision, not as a promise that hosting,
retention, users or the underlying chain have no ongoing costs.

### What independence actually means

[Trust Models](https://vitalik.eth.limo/general/2020/08/20/trust.html), Vitalik
Buterin, August 20, 2020, separates trust in particular actors from reliance on
any suitable actor, and distinguishes safety from liveness. For this talk,
ask whether a replacement can preserve the required operation and which
honesty assumptions remain. Verification can reject bad data without causing
anyone to supply good data.

[The Meaning of Decentralization](https://medium.com/@VitalikButerin/the-meaning-of-decentralization-a0c92b76a274),
Vitalik Buterin, February 6, 2017, separates machine distribution, independent
control and logical structure. Shared software or infrastructure can produce
correlated failures. Applied to James's three-participant ambition: inspect
operators, administration and shared dependencies rather than counting URLs.
Neither essay establishes a universal three-node safety threshold.

## Useful for the wider vision and Q&A

### Privacy as chosen disclosure

[A Cypherpunk's Manifesto](https://www.activism.net/cypherpunk/manifesto.html),
Eric Hughes, March 9, 1993.

Hughes treats privacy as control over disclosure and argues for revealing only
what an interaction needs. Cryptography, signatures, open code and social
cooperation help make that possible.

James's durable records must leave room for deliberate privacy. Retaining
public information forever can also retain an unwanted disclosure forever.
Encrypting content does not automatically hide relationships or network
interest. The talk needs the simple user promise; detailed identity, metadata
and encryption design belongs in later work.

### User ownership after the vendor disappears

[Local-first software: You own your data, in spite of the cloud](https://www.inkandswitch.com/essay/local-first/),
Martin Kleppmann, Adam Wiggins, Peter van Hardenberg and Mark McGranaghan,
April 2019; conference publication October 2019.

The authors connect local operation, collaboration, longevity, privacy and
user control. Primary local copies and usable formats can preserve work when
a service disappears. Backups and preservation still require attention.

This supplies a concrete human test: can you keep using your work? Local data
does not itself settle shared authority or contested rights. Conversely,
onchain authority does not ensure offline usability or preserve readable
formats. These approaches can address complementary parts of the task.

### A coherent experience without a captive platform

[About Solid](https://solidproject.org/about), Solid Project, undated page
checked October 20, 2026.

Solid separates personal data from applications and uses interoperable
formats and protocols so people can choose tools that access the same data.
Its current explanation includes user-controlled access by AI agents.

This is a useful comparison for the modular "super app": continuity of data
and user choice need not imply one all-owning product. It does not establish
an EFS integration or prove that a particular Solid deployment has independent
operation, secure authorization or reliable recovery. Compare those mechanisms
separately if the analogy becomes a design input.

### Humans and AI under understandable rules

[AI as the engine, humans as the steering wheel](https://vitalik.eth.limo/general/2025/02/28/aihumans.html),
Vitalik Buterin, February 28, 2025.

Vitalik explores simple, open mechanisms with competing human, AI and hybrid
participants instead of making one model the institutional authority. He
restates credible-neutrality principles around non-favoritism, verifiable
execution, simplicity and limited rule changes. Human judgment supplies goals.

This connects to James's desire for common rules and replaceable intelligence.
It does not settle AI personhood, voting rights or consent. In the talk, use
only if it explains an existing power boundary; a separate AI chapter would
compete with the promised stack walkthrough.

### Resilience as protection of agency

[d/acc: one year later](https://vitalik.eth.limo/general/2025/01/05/dacc2.html),
Vitalik Buterin, January 5, 2025.

The essay favors defensive capability, distributed power and human agency
over safety dependent on benevolent rulers or AIs. It connects cryptographic
tools, privacy, governance and public goods to resilient social infrastructure.

This is a broader motivation for people continuing to cooperate when an
institution fails or turns hostile. It is not simply a demand to remove every
control: the essay also considers governance and restrictive interventions.
Keep this as a wider philosophical connection rather than claiming d/acc
validates a specific EFS design.

### Moloch and the difficulty of cooperation

[The Moloch DAO, DRAFT v1.0](https://github.com/MolochVentures/Whitepaper/blob/aaf5afb64b7cbb8bfee1a70690cc10cda8758086/Whitepaper.pdf),
Ameen Soleimani, Arjun Bhuptani, James Young, Layne Haber and Rahul Sethuram.
The PDF is undated; the pinned repository commit is February 12, 2019.

The paper treats misaligned individual incentives as obstacles to collective
provision. Its experiment uses pooled funding, contribution-weighted votes
and exit protections, while acknowledging unresolved free riding. Membership
is restricted; it is not a demonstration of equal voting power for everyone.

James can thank Ameen for inspiration without implying decentralization alone
solves coordination. The paper credits Scott Alexander's *Meditations on
Moloch* and Allen Ginsberg's *Howl*. For the talk, the useful connection is
cooperation without captivity. Do not add a history lecture or promise to
solve all institutional incentives. Old molochdao.com documentation paths
redirected to unrelated content during this check; use the pinned artifact.

### Multiple centers of governance

[Beyond Markets and States: Polycentric Governance of Complex Economic Systems](https://www.nobelprize.org/uploads/2018/06/ostrom_lecture.pdf),
Elinor Ostrom, Nobel Prize Lecture, December 8, 2009.

Ostrom describes durable arrangements with multiple decision centers,
locally appropriate rules, participation, monitoring and conflict resolution.
She distinguishes public goods from common-pool resources; different
coordination problems need different institutions.

This adds a useful caution to the digital-society ambition: open infrastructure
does not remove disputes, resource constraints or governance. Her research is
not empirical validation of blockchain governance. It is a strong later
reference for designing institutions around software, not another topic to
fit into this 20-minute talk.

## How to use the research

Keep three connections close to the spoken argument: the cypherpunk purpose,
lasting shared foundations, and inspectable trust assumptions. Attribute ideas
briefly where useful, with sources in the notes. Do not replace James's own
reason for caring with a procession of famous names.

The distinctive contribution of this talk is practical: follow an important
user task through all its dependencies, show where creator control still
matters, and make one improvement feel worth doing. The longer-term question
is how many such improvements can become a compatible, user-directed commons.
