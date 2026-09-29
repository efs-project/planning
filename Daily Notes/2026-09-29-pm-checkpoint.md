# September 29 PM checkpoint

Public-safe coordination snapshot, not a protocol ruling or release approval.

## Project and remote visibility

- Fetched planning: `main` and `origin/main` both at `f96d109` before this PM
  update; no tracked changes. This does **not** mean the checkout was clean.
- Untracked review material remains in
  `Reviews/2026-09-26-contracts-v2-initialization-plan/`,
  `Reviews/2026-09-26-sdk-v2-initialization-plan/`, and
  `Reviews/2026-09-26-efs-v2-naming-reconciliation/`. Numerous `.codex*`
  commit-message scratch files also remain. Preserve these; owning agents
  should review and publish completed planning material on main. This run
  neither staged their work nor deleted scratch files.
- Fetched `sdk-v2`: `chore/s0-scaffold` at `a37630d` equals its remote branch.
  This proves publication of the scaffold, not runtime SDK completion or CI.
- Fetched `client-v2`: `c0-bootstrap` at `c47cdb5` remains local; the only
  remote branch observed is `main` at initial commit `3bce50d`. The
  [[Reviews/2026-09-26-client-v2-initialization-plan/c0-results|C0 report]]
  describes local build/test evidence and a PM/owner publication gate; tests
  were not rerun by this PM review. C1 has not started per that report.
- No `contracts-v2/` checkout was present at the workspace root. This does not
  establish whether a remote repository exists.
- [[Designs/efsv2/prototype-delivery-checklist|The v2 delivery checklist]]
  remains the execution entry point. Prototype evidence and repository
  scaffolding are not the usable MVP or permanent foundation. Arcade is a
  follow-on in that tracker, not a newly dated launch commitment.

## Attention this week

- Devcon: see [[Devcon/attendance-checklist]]. New private organizer
  correspondence requires attention; details stay out of Git. Travel and
  visa completion remain unconfirmed. The October 6 deck/demo draft target
  is an internal preparation guardrail, not an organizer deadline.
- NLnet: office hour September 30 at 16:00 CEST / 09:00 CDT, freshly verified.
  Ask about US-applicant European dimension and the actual agent-heavy
  development workflow before drafting an application. See
  [[Grants/research-log#2026-09-29 - NLnet timing and Arbitrum verification gap]].
- Arbitrum: registered is not submitted. The September 23 verified portal
  cutoff was October 4 23:59 SGT / 10:59 CDT; fresh automated access failed.
  A third-party report of an earlier legal-terms deadline warrants checking
  the controlling terms with the organizer before relying on October 4.
  This is an uncertainty to resolve, not an adopted replacement date.

## Next checks

1. James handles the private Devcon correspondence and confirms completion.
2. NLnet eligibility questions at tomorrow's office hour; no application or
   outreach was sent by this run.
3. Owning repo agents resolve publication/review gates and publish their
   completed documents; no implementation branch was merged or pushed here.
4. Recheck travel bookings and presentation progress next Tuesday, or sooner
   when James supplies an update. Preserve held design queues as inventories.
