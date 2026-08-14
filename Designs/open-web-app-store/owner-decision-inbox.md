# EFS Open Web App Store — owner decision inbox

**Status:** reference — compact live queue; mechanisms remain evidence-gated
**Audience:** James first; designers second
**Last reconciled:** 2026-08-14
**Inputs:** [[README]], [[architecture]], and [[Designs/efsv2/owner-decision-inbox]]

#status/reference #kind/decision #repo/planning #repo/contracts #repo/sdk #repo/client #topic/efsv2 #topic/app-model #topic/trust #topic/content

> **Decide now: nothing.** The current design is a proposed working comparison
> baseline pending James's review. No package model, Core change, catalog,
> runtime, trust root, update policy, registry, or implementation is adopted.

## Decide after evidence — do not answer yet

There is no live owner choice yet. The engineering and research gates are
owned by [[architecture#Open questions and evidence gates]]: canonical Set
encoding, portable authorship, catalog reconstruction, update trust,
profile/capability vocabulary, state rollback, and aggregate economics.

Agents should run those gates and escalate only when evidence leaves materially
different viable products or an expensive permanence choice. Do not copy their
unchecked boxes into this queue merely because they remain open.

## Boundary routing

- EFS Core, Principal, Binding, Lens, Realm, index, and freeze questions route
  to [[Designs/efsv2/owner-decision-inbox]].
- Web Client/OS execution, capability enforcement, installation/rollback UX,
  and Shell presentation questions route to the Client/OS owner.
- Git-native source collaboration and transport questions route to Git/Forge.
- Arcade, Media, Nanda, EAP, Files, and other application meaning stays with
  the relevant product owner.

## Recording rule

A future question appears in only one live queue. After James answers, record
the attributed ruling in the owning history before changing design authority
labels. Permission to research or draft is not approval of the proposed
mechanism or written text.
