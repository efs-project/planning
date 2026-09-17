# Files prototype completion pass

September 17, 2026 · v2 PM · **bounded local prototype pass complete; not a public launch**

This pass finishes the practical Files journey over the compact v2 experiment.
It does not restart the data-model design or turn this scratch implementation
into the production repositories. [[prototype-finish-plan-20260917|Execution plan]].

**Bottom line:** the compact v2 direction now supports a useful Files browser,
not only isolated contract tests. Required indexes stayed enabled. This pass
added no Solidity/Core feature and changed no permanent protocol decision.
The next step is a clean-slate implementation review followed by the upgradeable
MVP vertical, not another open-ended architecture comparison.

## What the actual browser established

Fresh matched deployment, ordinary EVM contract limits and required indexing,
UI `http://127.0.0.1:60627/`, RPC `http://127.0.0.1:8545`, chain31337. The local
chain is disposable and history-pruned; this is not paid/public-chain evidence.

- Guest browsing recovers directory names and file contents directly from RPC.
- `docs/meeting.txt` changes from Alice's10:00 to Bob's11:00 when the ordered
  Lens changes; Alice-only files remain visible under Bob-first fallback.
- Browser-created `finish-check.txt` stored44 onchain bytes and read them back.
  Local gas: **2,040,746**, calldata2,852bytes, block80.
- `meeting-link.txt` points at the same File as `meeting.txt`;
  `meeting-copy.txt` has a new File identity and the selected contents.
- Cold chain-derived ancestry recovered the selected Bob revision and its Alice
  parent at one block. This is selected ancestry, not every author's branch.
- Edited `finish-check.txt`, restored its original contents from cold history,
  and observed all three ancestry entries: original, edit, then restoration.
  Renamed it to `finished.txt` and moved it to `/archive`; its File identity and
  selected revision stayed unchanged. This distinguishes names from contents.
- A public Arweave sample fetched36,795bytes from a gateway, matched the retained
  publisher fingerprint and rendered as a PNG. This is retrieval/integrity
  evidence, not an independent Arweave settlement proof or a newly paid upload.
- Created `release-check/child.txt`, previewed two own placements, then released
  child followed by folder. Both canonical effects verified; zero pending rows.
  Data, tags and other authors are not erased. A delayed receipt was recovered
  by read-only reconciliation without another signature or write.

Independent local RPC receipt reads for that browser journey:

| Action | Block | Gas | Calldata bytes |
| --- | ---: | ---: | ---: |
| Create44-byte file | 80 | 2,040,746 | 2,852 |
| Add second name | 81 | 1,379,952 | 1,700 |
| Copy to new File | 82 | 2,089,049 | 2,916 |
| Create directory | 83 | 1,715,977 | 2,436 |
| Create nested34-byte file | 84 | 2,084,879 | 2,852 |
| Release child placement | 85 | 847,931 | 1,252 |
| Release directory placement | 86 | 857,506 | 1,252 |
| Edit contents | 88 | 1,294,504 | 1,796 |
| Restore original contents as successor | 89 | 1,277,636 | 1,796 |
| Rename placement | 90 | 1,546,287 | 2,148 |
| Move to archive | 91 | 1,317,471 | 1,764 |
| Hide placement | 92 | 869,827 | 1,316 |
| Restore placement | 93 | 1,010,723 | 1,316 |
| ASSERT a new exact Concept on a File | 94 | 1,376,430 | 1,732 |
| Bob DENY on that File/Concept | 95 | 1,042,284 | 1,316 |
| Bob retract to SILENT | 96 | 952,260 | 1,316 |

All listed receipts reported success; UI independently reconciled effects.
Create transaction: `0x5c77ca1904a1b91d5f83d8063f15f203fbda90f021349997af9c67ef8bc2b6d6`.
These are one local sequence, not median benchmarks; fresh versus reused rows
change gas. No browser error/warning entries were captured for this sequence.

The restore-placement action exposed an interaction defect: a native `confirm()`
from the hidden test tab interrupted James's typing. That was not an acceptable
background UX check. Browser testing stopped. Task3 removed native dialogs,
modal editor presentation and automatic focus, retaining an inline checkbox
bound to the observed destination. Background checks resumed only after review;
no native dialogs appeared in the subsequent exact-tag journey. A later actual
browser check confirmed the editor was open but not `:modal`, had no autofocus,
and left focus on the invoking Create button. Cancel closed it without a write.

The live-backed sample read value42/flagtrue at block93 without a duplicate
content write. The encrypted sample stayed key-needed until the public demo key
was supplied, then returned49 verified plaintext bytes; ordinary text editing
remained disabled. These demonstrate the existing live/encrypted profiles,
not private names, secret metadata or automatic key recovery.

Exact tag browser readback: Alice ASSERT on `cost-check.txt` made the `ready`
filter show1/9 folder rows; Bob DENY under Bob-first made it0/9; Alice-first
showed1/9; Bob SILENT restored1/9 under Bob-first. Each step used the ordinary
SDK journal and canonical effect reconciliation. A delayed DENY receipt left
the fee total unknown until the existing read-only reconcile action recovered
it; no second signature or transaction was needed. All ten post-namespace
journal actions then had receipts (12,726,674gas in that browser journal).

Independent review caught and fixed a separate exact-subject bug: conflict
review had silently selected Alice-first for revision-specific stances. At
`ee2821e`, no single qualified selected revision means revision stance UNKNOWN,
while stable File stance remains independently readable. Both ordered views
are covered. Legacy generic tags remain distinct; new exact tag inputs still
carry a conservative label-verification message rather than a global-name claim.

The cost journal previously used chain ID plus the deterministic Ledger address.
A new Anvil genesis could therefore display an old run's saved costs. The new
namespace includes genesis. Old browser storage is preserved but not silently
imported; this one-time upgrade starts a new visible journal without deleting
files from the running chain. The receipt table above retains this pass's earlier
measurements independently.

The integrated widget was checked with a new `cost-check.txt` write after that
namespace change: **2,039,252gas**, showing **$0.4863 L1 / $0.0301 Base /
$0.1002 Arbitrum**, with execution/data/operator components and snapshot labels.
No public calldata estimation request was made. Normalized UI amounts round
very small components rather than pretending they are missing or uncharged.

The fee and wallet slice is independently approved at `bf78260`. A real
ephemeral-Anvil check used an unfunded author, one EIP-1193 typed signature,
zero wallet transaction approvals and a different local payer; the canonical
effect and exact transaction attribution verified. This is development-only
sponsorship, not evidence of James's MetaMask extension completing that journey
or a production relayer. James previously reported creating `try-me.txt` through
his wallet; this finishing pass did not retest the extension on his behalf.
Static output disables sponsorship, faucet and demo
keys. Default fee values passed. The minor manual decimal-entry limitation was
then fixed at `44db867`: exact decimal/exponent input is parsed into integer wei;
invalid or sub-wei values remain Unknown without silently reusing an old price.

## External dependency caught during integration

The existing IPFS sample failed even though its descriptor and fingerprint
remained valid. Both default transports returned429, `Retry-After`, and
`Sunset: 21 Sep 2026`. They were the same retiring infrastructure, not two
independent fallbacks. [IPFS's announcement](https://discuss.ipfs.tech/t/changes-to-ipfs-io-and-dweb-link-gateways/20328)
confirms the move away from programmatic use of those public gateways.

At `48d7ed4`, future fixtures and this running generated config use the explicitly
replaceable Pinata HTTPS gateway. The unchanged public IPFS sample returned
**12,435 verified bytes** and a PNG preview in the actual **built static SPA**,
with no console warnings/errors. Its consent checkbox names the gateway.
Descriptors, fingerprints and the running chain were not reset or rewritten.
This is observed transport and EFS fingerprint success, not CID/DAG proof,
pinning, universal gateway coverage or permanent availability.

This is a concrete reason transport must stay replaceable and outside immutable
content identity. A gateway being unavailable must not mean the file disappeared,
and an address alone does not ensure that someone continues hosting the bytes.

## Static app and wallet boundary

The built output was served beneath `/ipfs/local-workbench/` by a deliberately
plain static server, not Vite: no API routes, signing service, config generation,
RPC proxy or SPA fallback. A fresh guest browser recovered9 folder rows,
`cost-check.txt` and the public IPFS image directly through RPC/gateway access.
`demo-wallets.json`, an API probe and an unknown asset all returned404; production
config has demo signing, faucet and subsidy disabled and no temporary carrier
origin. This validates static-prefix packaging, not an actual IPFS publication
or a public-network wallet journey. The owner-facing dev URL remains60627.

The local development wallet option separately retains its author signature
and uses an unlocked local Anvil payer. A normal static build instead needs
wallet gas and two approvals unless a production transport is explicitly added.
No real MetaMask signature, public transaction or paid Arweave upload was made
on James's behalf.

## Practical costs

September17 public fee/FX observations model the44-byte create at approximately
**$0.49 Ethereum L1, $0.030 Base, $0.101 Arbitrum**. These include the modeled L2
posting component; Base's observed operator component was zero at that snapshot.
They exclude storage-service payments, deployment and setup. They are repriced
local execution, not paid-chain receipts or guaranteed transaction quotations.

Base uses a dated size-only practical bound; Arbitrum uses an explicitly
uncompressed-data scenario. Fees can move. Exact public calldata estimation
would disclose the filename/content carried in that transaction and must not
run silently. Sources: [Base fees](https://docs.base.org/specifications/transactions/network-fees),
[Arbitrum gas estimation](https://docs.arbitrum.io/arbitrum-essentials/how-to-estimate-gas).

## Production handoff boundaries

Keep the split already laid out in [[compact-mvp-build-plan-20260914]]:

1. Contracts: compact admission/identity/Types, separate required indexes,
   bounded readers/Lenses, and application profiles. Decompose the near-limit
   Ledger before adding production features; preserve tested semantics.
2. SDK: qualified values and pinned reads; one normal preparation, authorization,
   submission and reconciliation lifecycle; browser journal, transport and carrier
   adapters. Applications should not assemble internal rows themselves.
3. Static SPA and Files: navigation and views over that SDK, no mandatory EFS
   application server. The rough DOM implementation is disposable.
4. Then one public testnet wallet/carrier journey and a small live-contract or
   Arcade integration. Local sponsorship is not a production relayer service.

Not waived: broader native cross-chain finality/proof costs; normalized Names
and public Concept identities; path-slot tags versus File/revision tags;
production capacity widths and artifact reproducibility. These are explicitly
tracked in the build plan, not secretly promised by a clickable local browser.

An independent `eth_getCode` read of this running deployment measured Ledger
24,524bytes (52bytes spare under EIP-170), required index21,674, Lens16,999,
registry14,914, Files validator15,356, Name validator5,120, joined reader19,012,
live adapter2,618 and final validator5,417. This pass does not add Core features
or use an unlimited-code-size setting. Module decomposition remains real-code
work; the clickable prototype is not an excuse to ignore that headroom.

## Working, limited, and still unproven

| Area | Working evidence | Boundary / next work |
| --- | --- | --- |
| Basic Files | Guest names/bytes; create, edit, rename, move, hide/unhide, own-placement release; second name versus independent copy | Compact restricted-name profile, not production Unicode/path normalization. Removal releases or masks a placement; it does not erase immutable data. |
| Lenses and tags | Both author orders, fallback, explicit ASSERT/DENY/SILENT, File/revision/Directory subjects, with/without folder filtering | Bounded enumerated-folder filter, not global tag search or complete stance history. Exact Concept display labels remain conservatively unverified. Location-tag/public Concept profiles remain production design work. |
| History | Cold, pinned selected ancestry; restoration publishes a successor | Default16/max64 revisions per call, continued at one basis. Not every author's branch or a global change feed. |
| Recursive release | Reviewed preview, one-use capability, per-step guards, root last, partial-progress reporting | Max128 own reachable placement coordinates; separate transactions, not an atomic tree deletion. Other authors, aliases and new unseen descendants survive. |
| Content | Inline bytes, AR/IPFS reference registration and fingerprint-checked retrieval, encrypted sample, live contract-backed value | Inline root content cap8,160bytes; external browser output cap16MiB. No permanent availability guarantee, paid upload adapter, IPFS pinning or CID/DAG verification. |
| Wallet and fees | EIP-1193 real-chain harness; one author signature with separate dev payer; local receipt journal plus L1/Base/Arbitrum model components | Owner MetaMask was not retested in this pass; public paid-chain journey unexercised. Static builds need wallet gas/two approvals absent a production relayer. Modeled prices are not public receipts. |
| Static operation | Built SPA at an IPFS-style prefix; guest reads/PNG without Vite backend; local keys/subsidy absent | Local static hosting, not a public IPFS publication, public-RPC load test or complete browser/wallet compatibility campaign. |

The prior [[core-closeout-results-20260915|Core evidence]] remains the source for
typed contract use, required-index rollback/replay, bounded queries, Type
evolution and portable retained evidence. This Files pass does not re-certify
every earlier experiment. Broad contract search and native state-proof recovery
are still expensive; foreign finality and general proxy-history verification
remain outside the demonstrated slice. None of those requirements was dropped.

## Verification and review record

The implementation workers ran the following bounded checks. Independent
reviewers inspected their diffs/reports rather than duplicating the same suites.
The parent independently operated the actual browser and checked receipts,
static isolation and deployed runtime sizes as recorded above. Counts overlap;
they are not summed into one inflated test total.

| Slice | Source checkpoint | Retained execution evidence | Independent review |
| --- | --- | --- | --- |
| Link/copy/history/release | `bffb409` | Final2/2 new chain workflows; earlier13/13 chain regressions and66/66 SDK/view checks | Spec/quality approved; no Critical/Important |
| Fee components, genesis journal, dev payer | `bf78260` | 29/29 focused checks; one separately owned real-chain sponsored-intent check; static build/key exclusion | Spec/quality approved; manual decimal input minor |
| Exact stance and nonmodal consent | `ed48c0f` → `ee2821e` | 72/72 initial focused checks; final29/29 covering checks after conflict fix; static build | Important false selected-revision qualification found, fixed and independently approved |
| IPFS transport, consent and quickstart | `48d7ed4` | 38/38 focused checks; build169modules; exact public sample through actual loader | Spec/quality approved; no Critical/Important |
| Integration across all slices | `517d335..48d7ed4` | Parent actual-browser chain/static workflows described above | Approved with four minors; no Critical/Important |
| Single final fix wave | `44db867` | Worker38/38 app/fee/workflow,4/4 selected SDK,1/1 owned chain workflow; parent fresh37/37 app/fee and169-module build | Findings1/2/4 addressed and approved; no new consequential breakage |

The [[prototype-finish-review-20260917|independent integration review and scoped re-review]]
are retained with this handoff. Final source is
[`44db8677f85232e72dd97ffaef4ffed91d905cc9`](https://github.com/efs-project/planning/commit/44db8677f85232e72dd97ffaef4ffed91d905cc9).
No source change is hidden outside that checkpoint. Final syntax/diff and
generated-decision checks passed. A last read-only service check returned
UI200 and chain head96 on the unchanged demo.

The fix wave also makes selected ancestry honor the requested Lens policy,
labels its actual order/block and discards obsolete history after a Lens change.
Conflict view cannot silently return Alice-first history. Interrupted recursive
release now carries the same non-atomic/retained-data metadata as other outcomes.
Only the conservative exact Concept display-label projection remains a minor
follow-up; no false authority or tag-presence claim is substituted for it.

Task1's stale app-host warning was addressed by the later app-boundary work;
Task3/4's retained results are the current focused harness evidence. This is
not a claim that every historical prototype test was rerun or is green.

## Choices made during this pass

These are reversible implementation choices, not owner protocol rulings:

1. Close the exact stance UI/SDK seam using the already deployed profile and
   normal signed lifecycle, rather than introduce another Core feature. This
   cost an adapter task; global inverse/history capabilities are still separate.
2. Add an IPFS repair after a real retrieval failure exposed retiring gateways.
   This cost transport work and still cannot guarantee a third-party gateway
   stays available.
3. Keep the tested replaceable HTTPS path rather than add a larger Helia stack
   during this finishing pass. The tradeoff is deferred CID/DAG verification;
   current success means EFS descriptor fingerprint verification only.

## What James or the next engineer should do

1. Use **http://127.0.0.1:60627/**. The existing Hardhat wallet target is
   **http://127.0.0.1:8545**, chain31337. Start in guest mode or use disposable
   Alice/Bob; no real funds are needed for this local chain. The prototype does
   not automatically approve a wallet prompt. Services remain temporary.
2. Review the running workflows and the [[compact-mvp-build-plan-20260914|clean-slate repository/contract/SDK plan]],
   then implement one production vertical.
   Keep contract admission/index atomicity, exact Type/record identity, explicit
   Lens qualification, signed preconditions and canonical read-back. Replace
   the rough code structure rather than promote it wholesale.
3. Run an owner-operated MetaMask check, then a funded public-testnet scenario
   with ordinary RPCs. These are concrete integration gates, not a reason to
   repeat the local architectural tournament.
4. Choose the paid permanent-storage UX before adding its adapter. Current
   external upload followed by verified AR/IPFS registration works; integrated
   Arweave payment/upload does **not** exist yet. The evaluated Turbo path needs
   a funded wallet, an explicit spend cap and consent to non-refundable credits
   and public permanent storage (or encryption before upload).

Code remains on `codex/efs-warroom-b-run`; documentation is on planning/main.
Use the prototype's `lab-b/browser/README.md` current quickstart for reproducible
contract build, separate chain/Vite launch and static build/host. Do not infer
permission for public spending or a permanent deployment from this report.
