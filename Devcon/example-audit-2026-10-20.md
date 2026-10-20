# Example audit for the integrated Devcon deck

Checked October 20, 2026 for [[Devcon/presentation/2026-10-20-integrated-spine/README]].
The teaching order is user stakes, developer action and a community horizon.
Examples support a specific mechanism, failure or improvement, not a rating
of an entire project. This pass inspected primary documentation and source.
It did not run wallets, recovery transactions, bots or a fresh EFS retrieval.

## Changes that reached the deck

| Slide | Decision and accurate claim | Primary evidence and boundary |
| --- | --- | --- |
| 3 | Keep CROPS and hyperstructures as the ambition. The walk-away test contributes to it without certifying the whole app. | [EF Mandate](https://ethereum.org/foundation/mandate), [Hyperstructures](https://jacob.energy/hyperstructures.html). The original hyperstructure definition includes economic properties and underlying-chain assumptions beyond longevity. |
| 6 | Keep ENS/IPFS through EFS. Name, accepted release, retained bytes and access route have different jobs. | [ENS contenthash](https://docs.ens.domains/dweb/intro/), [IPFS gateways](https://docs.ipfs.tech/concepts/ipfs-gateway/). HTTP can carry IPFS content. Ordinary gateway use is not automatic browser verification. |
| 6 | Keep the historical shared-operator example. | The [eth.limo operator report](https://discuss.ens.domains/t/eth-limo-update/19707) dates eth.link's migration to September 19, 2024. Two gateway names need not mean independent operation. No current topology or EFS alternate-route audit occurred. |
| 7 | Keep Ledger as the hostile runtime-dependency example. | [Ledger incident report](https://www.ledger.com/blog/security-incident-report): December 14, 2023 incident, December 20 report, malicious Connect Kit releases 1.1.5-1.1.7. Do not imply extraction of hardware-wallet private keys. Retained source alone does not prevent runtime substitution. |
| 8 | Sharpen Safe to signer loss and replacement. Two remaining signers in a basic 2-of-3 account can replace the lost one. | [swapOwner](https://docs.safe.global/reference-smart-account/owners/swapOwner), [RecoveryHub explanation](https://help.safe.global/articles/9622260218-account-recovery-with-saferecoveryhub). The older citation supports this, but it is not the module recovery flow. [Modules](https://docs.safe.global/advanced/smart-account-modules) and [guards](https://docs.safe.global/advanced/smart-account-guards) add account-specific powers. |
| 9 | Move Pocket's brief portability contrast beside retention. Keep the difference between URLs and saved content. | [Pocket export documentation](https://support.mozilla.org/en-US/kb/exporting-your-pocket-list), [shutdown FAQ](https://support.mozilla.org/en-US/kb/future-of-pocket). Avoid the conflicting old export deadline in spoken copy. [IPFS persistence](https://docs.ipfs.tech/concepts/persistence/) independently supports the retention lesson. |
| 10 | Keep the EFS proof sequence as a static explanation of earlier work. | [Pinned proof source](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof). Matching bytes, mismatching bytes and failed retrieval are different outcomes. Accepted reference and chain basis remain separate questions. No fresh execution is implied. |
| 11 | Keep Helios and Graph Node as brief examples of two distinct jobs. | [Helios](https://github.com/a16z/helios) checks supported chain data under stated assumptions. [Graph Node](https://thegraph.com/docs/en/indexing/tooling/graph-node/) needs deployment files, a database and suitable chain access. Required archive/tracing support depends on the subgraph. Neither example establishes arbitrary query completeness or EFS integration. |
| 12 | Name PoolTogether V5 and replace old-hostname references with canonical developer URLs. Keep the permission-plus-incentive lesson and unclaimed-prize consequence. | [Claiming prizes](https://dev.pooltogether.com/protocol/guides/bots/claiming-prizes/), [prize claimer](https://dev.pooltogether.com/protocol/design/prize-claimer/), [bot guide](https://dev.pooltogether.com/protocol/guides/bots/). Claim windows/configuration vary. An old `v4.docs` hostname served V5-style content, so this was a misleading reference, not a disproven mechanism. |
| 13 | Keep Uniswap v2 core as fixed code with bounded fee authority. Add the distinction between choosing software and changing shared rules. | [Factory](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol), [Pair](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol), [interface policy](https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy). `feeToSetter` controls `feeTo` and its successor. This is not arbitrary swap-logic rewriting. No current deployed holder or setting was queried. |
| 14 | Keep OP Stack's documented L1 route around a sequencer outage. Distinguish inclusion, application success and withdrawal. | [Sequencer outages](https://docs.optimism.io/op-stack/protocol/outages), [withdrawal flow](https://docs.optimism.io/op-stack/bridging/withdrawal-flow). Chain configuration, account semantics, data, fees, delays and bridge powers matter. No route was executed. |
| 15 | Add Hic et Nunc/Teia in place of generic community-takeover prose. This supplies a positive continuity story. | [Teia's FAQ](https://docs.teia.art/faqs/general-faqs) supports the history, replacement interfaces and new marketplace contract. Label it Tezos. Do not promise unchanged rules or automatic artwork retention. The linked launch blog returned 403 on direct read, so the accessible FAQ is the stage citation. |
| 16 | Keep Safe CLI's direct-chain route as a concrete alternative interface. | [CLI overview](https://docs.safe.global/advanced/cli-overview), [common commands](https://docs.safe.global/advanced/cli-reference/common-commands). Its [transaction-service mode](https://docs.safe.global/advanced/cli-reference/tx-service-commands) has different dependencies. Enough supported signers, gas and intact account configuration remain necessary. |

The [underethsea bot repository](https://github.com/underethsea/pooltogether-node)
remains linked by PoolTogether's official guide. A different guide link to a
GenerationSoftware Actions repository returned 404. Do not substitute that
broken link or imply a documented bot is profitable in a current deployment.

## Additional candidates and why they are reserves

### dYdX v3: exit and continued operation are different outcomes

The [official sunset notice](https://www.dydx.xyz/blog/v3-product-sunset)
announced an October 28, 2024 trading halt and October 30 frozen-exchange
state, while preserving a USDC withdrawal route. The current
[explorer](https://explorer.dydx.exchange/) identifies the exchange as
discontinued. Its [escape-hatch guide](https://explorer.dydx.exchange/tutorials/escapehatch)
requires balance evidence and Ethereum transactions. These are sources about
the mechanism, not our own successful withdrawal or reconstruction of the
historical freeze transaction.

This is the strongest reserve for slides 14 or 16: a surviving exit does not
mean trading continued. The old L2Beat URL now redirects to the explorer, so
do not claim two currently independent hosts. Keep it in Q&A unless it
replaces another example. The main route already teaches the distinction.

### Async Art: ownership can survive while the artwork stops working

The [restoration team's report](https://karenfranceseng.notion.site/drl)
describes rebuilding a viewer and controls after API-dependent functionality
broke. The [original editor repository](https://github.com/asyncart/classic-art-editor)
includes a database-derived layer-control mapping because some control
information was missing from IPFS metadata. The [restored site](https://async.art/)
lists remaining limitations, including missing layers and music functionality.

Potential replacement for Pocket or part of the retention discussion if James
wants an Ethereum art example. It is unusually relevant to usable data, but
requires more explanation and careful distinction between token survival and
partial restoration. Do not present it as complete recovery or our own audit.

### Liquity V1: third-party interfaces by design

The [frontend documentation](https://docs.liquity.org/liquity-v1/faq/frontend-operators)
describes permissionless registration, tools for operators and rewards. A
Stability Pool deposit retains its frontend tag even when used through another
frontend. This illustrates shared state behind replaceable interfaces.

Keep it as a reserve for slides 6 or 16. It is a design mechanism rather than
a verified shutdown recovery. Keys, gas, oracle dependencies and viable
operators remain. The [local-app article](https://www.liquity.org/blog/decentralizing-frontends-through-local-apps)
described a proof of concept, not a production one-click recovery guarantee.

## The next visual pass

Prioritize visuals that explain a mechanism already in the spoken route:

1. **Slide 6:** compare a hosted release with a content-addressed release that
   another holder can serve. Show ENS naming, the HTTP gateway and retained
   copies as different components. Do not draw HTTP and IPFS as mutually
   exclusive, or equate a different suffix with an independent operator.
2. **Slide 8:** show a 2-of-3 signing threshold, one unavailable signer, and
   replacement by the remaining two. Put decryption recovery on a separate
   path. Label any diagram illustrative, not a transaction record.
3. **Slides 10-11:** keep the accepted reference fixed while the retrieval
   route changes. Then separate integrity from freshness and completeness.
4. **Slide 13:** contrast choosing a client release with changing shared
   contract state. An older client does not reverse the latter.
5. **Slide 15:** use sourced historical interface evidence only if it makes
   the community-continuation story easier to grasp. Preserve chronology and
   attribution. An illustration must not pose as an incident screenshot.

Images, memes and animations remain later choices. They should earn their
space by improving comprehension or pacing, not introduce another argument.
The next content evidence is James's read and a timed rehearsal.
