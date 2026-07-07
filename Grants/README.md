# EFS Grants

Operational tracker for Ethereum File System grant research, proposal status, reusable application material, and grant-specific funder intel.

This folder is not a design, ADR, or parallel status board. It is the operational home for active funding work; top-level vault files should carry only pointers or durable decisions.

## Source of truth

- `Grants/proposals.md` owns grant proposal status. Do not mirror its table into [[Kanban]], [[For-James]], or [[Decisions]].
- [[Kanban]] carries one pointer card for swarm visibility: "Grants - research + tracker + submissions".
- [[For-James]] gets only real James decisions or deadlines, such as a program pick, submission sign-off, or external profile change he must personally make.
- [[Decisions]] gets only project-positioning calls that outlive a grant, not per-proposal tactics.

## Operating contract

- [[programs]] is the funder landscape: program state, fit gates, caveats, and discovery notes. It is not EFS proposal status.
- [[proposals]] is the single status table for real EFS proposal opportunities.
- [[research-log]] is the dated evidence trail: source checks, rejected leads, funder intel, and lessons learned.
- [[efs-grant-packet]] is reusable copy and application material, not a live status board.

Row graduation rule: a lead becomes a [[proposals]] row only when it has a plausible EFS application path, deadline, office-hours route, submitted proposal, or named RFP worth watching. Everything else stays in [[programs]] or [[research-log]].

## Files

| File | Purpose |
|---|---|
| [[programs]] | Funder landscape and current fit read. |
| [[proposals]] | Submitted, drafting, and watchlist proposals. Single source of truth for status. |
| [[efs-grant-packet]] | Reusable EFS pitch, links, milestones, and budget snippets. |
| [[research-log]] | Dated grant-specific research notes, rejected leads, and community/funder intel. |

## External anchors

- [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about)
- [EFS website](https://efs.eth.limo)
- Pitch deck: available from the KarmaHQ quick link; add exact URL here if we want it mirrored.
- Demo video: available from the KarmaHQ quick link; add exact URL here if we want it mirrored.

The KarmaHQ page is the first public grant-accountability anchor. Keep it updated enough that funders can understand EFS without reading the whole vault.

## Proposal workflow

1. Add candidate programs to [[programs]] with program state, fit, caveats, and next action / graduation gate.
2. Add real proposal opportunities to [[proposals]] only when they pass the row graduation rule.
3. Draft from [[efs-grant-packet]], then adapt to the funder's own language.
4. Keep proposal outcomes, feedback, and rejection notes in [[proposals]] and [[research-log]].
5. Keep rejected and withdrawn rows. Use `archived` only when a row should stop showing prominently.

## Status vocabulary

- `watching` - plausible future route, but no active application path yet.
- `researching` - active fit/evidence check underway.
- `drafting` - proposal or profile is being prepared.
- `needs-signoff` - James must approve, send, or choose; mirror to [[For-James]] only for real forks/deadlines.
- `submitted` - submitted and waiting.
- `follow-up` - submitted and requires a reply, update, office-hours call, milestone, or clarification.
- `accepted` - awarded or otherwise approved.
- `reporting` - awarded and now in milestone/update/report obligations.
- `rejected` - declined; keep feedback.
- `withdrawn` - intentionally stopped by EFS.
- `archived` - no longer active or prominent, retained for history.

## Review cadence

Weekly grant-ops pass:

- Refresh [[proposals]] rows with active deadlines, `follow-up`, or `needs-signoff`.
- Update `Last checked` and tighten `Gate / evidence needed`.
- Move stale `researching` rows to `watching` or `archived`.
- Surface only real James choices/deadlines to [[For-James]].

Monthly landscape pass:

- Refresh [[programs]] from official sources before aggregators.
- Add dated source notes to [[research-log]].
- Promote only qualifying leads into [[proposals]].

Post-decision pass, within 48 hours:

- Update proposal status and decision details.
- Capture rejection/acceptance feedback in [[research-log]].
- Move awarded proposals to `reporting` until milestones and public updates are complete.

## Open grant-ops tasks

- [ ] Update the KarmaHQ page team section; it currently lists no team members.
- [ ] Decide whether the KarmaHQ "Total Funds Raised" value should remain `0` until funds are received or include prior in-kind/self-funded work.
- [ ] Replace the bare KarmaHQ "Path to Success" wording with a sharper sustainability path.
- [ ] Add exact pitch deck URL from the KarmaHQ quick link if we want it mirrored here.
- [ ] Add exact demo video URL from the KarmaHQ quick link if we want it mirrored here.
- [ ] Decide whether EFS needs an Open Collective / Open Source Collective fiscal home before broad donation rounds.
- [ ] Decide whether to claim/configure Drips for EFS repos before Gitcoin or Octant rounds.
- [ ] Decide whether to enable GitHub Sponsors and add `.github/FUNDING.yml` for EFS repos.
- [ ] Decide whether to register EFS repos/projects with OSO for public impact analytics.
- [ ] Decide whether a markdown table is enough for proposal operations or if we need Airtable/Grist/Instrumentl later.
