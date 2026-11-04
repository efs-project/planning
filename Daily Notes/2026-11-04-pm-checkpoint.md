# November 4 PM checkpoint

Public-safe weekly coordination evidence. This is not a protocol ruling,
implementation approval, fresh test result or deployment. Personal organizer
mail and travel/identity data are intentionally excluded.

## Immediate priority: the accepted talk

- The [official Pretalx calendar export](https://cfp.devcon.org/devcon8/talk/SPVJV8.ics),
  freshly fetched November 4, still specifies **November 5, 15:30-15:55,
  UTC+05:30, Lotus Stage 3**. Under the recorded 20-minute check-in rule,
  arrive at the stage by **15:10 Mumbai time**. This is not a calendar edit.
- Current published rehearsal snapshot is
  [[Devcon/presentation/2026-10-27-recovery-pass/README]] at planning `4d770bb`:
  30 slides, main route 1-29, 2,015 planned words and 18:30 planned, not measured.
  The owning presentation task still distinguishes the working deck from the
  official copy. This PM run did not inspect live Slides or establish whether
  James has since completed delivery/rehearsal.
- Recommendation: prioritize an uninterrupted spoken run, the correct final
  organizer copy and an offline backup over new content or a product launch.
  Private organizer follow-ups are reported directly, not copied into Git.

## Engineering and remote visibility

- Fetched planning main equals origin/main at `4d770bb` before this session;
  tracked files are clean. The latest presentation revisions are published.
- Fetched contracts-v2 branch `fable/2026-10-13-core-contracts` remains
  `0d1bb807260c16b186167a6c4ca742e4cd920020`, with clean tracked state and no
  upstream divergence. Contracts main remains `90ddbf5`; accepted SDK/client
  mains remain `af11602` / `060c9fd`. The implementation versus integration
  distinction in [[Daily Notes/2026-10-27-pm-checkpoint]] still applies. No
  independent runtime, CI or release-readiness check was performed today.
- Legacy contracts origin/main has advanced to `71f6f38`, including merged
  mobile keyboard and bounded PDF preview changes. The local main checkout is
  clean but **32 commits behind**. Do not use that checkout as proof of the
  current browser behavior or silently update another worker's implementation
  checkout. Remote merge is not proof of public-site deployment.
- Four planning review corpora remain untracked: September 26 contracts/SDK
  initialization and naming reconciliation, and the October 20 contracts
  design/build record. They are preserved, not declared remotely published.
  Owning review/publication remains a post-Devcon coordination item, not a new
  owner decision packet. Scratch files are also preserved.
- Existing evidence/hold queues are not reopened. No architecture, ABI,
  deployment, merge or new deadline is adopted by this checkpoint.

## Opportunity watches

- [[Devcon/ethdenver-2027-watch]] now records the official **March 24-25, 2027**
  dates, replacing earlier unverified February listings. No 2027 CFP/deadline
  verified; next check November 10. Do not reuse historical 2026 rules.
- Optional post-Devcon lead: [EthCC 10](https://ethcc.io/) announces **April
  12-15, 2027, Cannes** and links its [speaker page](https://ethcc.io/forms/speakers).
  That page invites applications, lists 20-minute talks and 35-55-minute
  workshops, and ties tracks to specific days. Deadline and a complete
  submission workflow were not verified. This is a lead, not James's adopted
  speaking/travel goal or permission to apply; revisit only after Devcon.
- [[Grants/research-log]] records NLnet's intake closure and next published
  January 3 deadline, without reopening its workflow/eligibility problem or
  creating an application sprint. This was a bounded watch, not a broad grant
  search.

Next broad review: November 10. First capture the talk's real outcome and useful
follow-ups; then reconcile the contracts-to-SDK/client integration handoff.
No implementation files, deck, calendar, mail, bookings or external commitments
were changed by this run.
