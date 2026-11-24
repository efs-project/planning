# November 17 PM checkpoint

- **V2:** Remote contracts branch remains `0d1bb80`; contracts/SDK/client
  mains remain `90ddbf5` / `af11602` / `060c9fd`. No new integrated product
  result was found. The owning checkpoint remains a packaged SDK and static
  Files client consuming one pinned contracts release, with reload/recovery
  evidence. Existing design holds and cutover boundaries remain unchanged.
- **SDK CI:** [November 16 compat run](https://github.com/efs-project/sdk-v2/actions/runs/43902404497)
  failed one Solidity matrix job during the Foundry installer download (HTTP
  403), before compilation. Treat the cell as unverified, not a demonstrated
  Solidity incompatibility. Recommended maintainer step: retry that failed
  job and investigate toolchain installation if it repeats; no rerun was made.
- **Legacy checkout:** `contracts` remote main is `9a43282`, 55 commits ahead
  of the clean local tracked checkout at `c6b4075`. Merged changes include
  router fixes, Sepolia address-drift checking and read-only Sepolia readback
  ([PR 59](https://github.com/efs-project/contracts/pull/59)). Merge is not a
  live readback result or deployment. Legacy dependency triage remains open;
  no release, code change or public-site exposure determination was made.
- **Visibility:** Planning main matched remote `0f4af98` before this update.
  Four untracked specialist review corpora remain preserved and not published.
- **Conference watch:** [[Devcon/ethdenver-2027-watch]] records the current
  unchanged March 24–25 dates and no verified CFP. [Devcon IX's event page](https://devcon.org/lisbon/)
  and the directly fetched [Devcon homepage](https://devcon.org/en/) both gave
  **October 12–14, 2027, Lisbon** on November 17. An indexed older homepage
  result gave October 11–13; prefer the live dedicated event page and recheck
  before making travel plans. This is an opportunity, not a commitment.
- **Funding:** [[Grants/proposals]] and [[Grants/research-log]] distinguish
  NLnet's confirmed deadline from conflicting official intake wording.

Next broad and ETHDenver review: November 24. No specialist work reclaimed,
no external correspondence, no design promotion, and no deployment.

## November 24 follow-up

- [SDK compat run 45237876857](https://github.com/efs-project/sdk-v2/actions/runs/45237876857),
  scheduled November 23 on unchanged `af11602`, reports **Success**. The prior
  failed installer cell no longer calls for a retry based on that old result.
  This is scaffold compatibility evidence, not a completed SDK integration.
- Remote contracts-v2 branch and all three successor mains remain unchanged
  from the November 17 check. No new integrated Files result was found.
- ETHDenver still has no verified CFP in the bounded check; next review is
  December 1. [[Grants/research-log]] records resolved NLnet intake wording,
  without changing the project's funding posture. No code or external-state
  changes were made.
