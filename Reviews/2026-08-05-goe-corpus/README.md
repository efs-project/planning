# GoE / Git-on-Ethereum review corpus

**Date:** 2026-08-05
**Status:** supporting evidence for [`../2026-08-05-goe-deep-dive.md`](../2026-08-05-goe-deep-dive.md); point-in-time review, not an adoption authorization
**Scope:** `goe-cli`, `goe-contracts`, `ethfs-git`, the Sepolia deployment, Git compatibility, credible-neutrality controls, security gates, Markdown workspaces, and the candidate EFS portable Git-profile/library boundary

#kind/review #status/done #repo/planning #topic/efsv2 #topic/git #topic/storage

## Contents

- [`package-and-git-helper.md`](./package-and-git-helper.md) — public source/package status and the exact clone/fetch/push/pack workflow implemented by the custom `goe://` helper.
- [`contracts-and-live-sepolia.md`](./contracts-and-live-sepolia.md) — repository/Hub/FlatDirectory model, roles, refs, push records, force-push behavior, deployment, and bounded observed use.
- [`security-and-trust-boundaries.md`](./security-and-trust-boundaries.md) — general cross-contract threat model, operational centralization, integrity versus availability, and required production-review gates.
- [`efs-git-profile-pressure-test.md`](./efs-git-profile-pressure-test.md) — reuse decision, candidate portable library modules, stock-Git gateway, Markdown workspace model, forge boundary, and acceptance program.

## Evidence snapshot

- [`goe-cli@2ee0cf5`](https://github.com/ethstorage/goe-cli/tree/2ee0cf5abe981e27e102582e451827074f38a793) is public source and corresponds to npm `goe-cli@0.2.0`.
- [`goe-contracts@89bf59a`](https://github.com/ethstorage/goe-contracts/tree/89bf59af4b2a123b2ad6abd761be4ea41a9f7089) contains the Hub/repository contracts deployed for the observed Sepolia prototype.
- The open, unmerged [`ethfs-git` design PR #1 at `0be0b9c`](https://github.com/ethstorage/ethfs-git/blob/0be0b9c5ddedd1e60b6d94edbc35703ef96d023b/design.md) is the earlier design-lineage artifact. Main at [`809ec03`](https://github.com/ethstorage/ethfs-git/tree/809ec03d259f384aa23304fcfa184db5f1dbbded) contains only an empty `design.md`; neither surface is the released implementation.
- npm reported 735 downloads for `goe-cli` from 2025-08-05 through 2026-08-04.
- Bounded Sepolia reads found a small, mostly test-oriented deployment. Counts are preserved in [`contracts-and-live-sepolia.md`](./contracts-and-live-sepolia.md), with their limitations.

## Evidence boundaries

- Installing and exercising a Git remote helper proves a transport path, not standard Git server interoperability or a complete forge.
- Onchain branch heads do not prove the packfiles remain retrievable.
- A Git OID detects altered Git objects when Git validates them; it does not prevent deletion, withholding, ref-policy failure, or provider loss.
- Sepolia events are not production adoption, independent-user counts, or mainnet readiness.
- Marketing claims such as “fully compatible,” “permanently accessible,” and “tamper-proof history” are tested against implementation behavior rather than repeated as facts.
- This was not a complete security audit. Production use requires exhaustive tests against the real deployed ABI, independent review, and a supported migration/recovery story.
- The candidate EFS library/profile is a design handoff. It is not a promoted v2 design or authorization to implement another Git stack.
