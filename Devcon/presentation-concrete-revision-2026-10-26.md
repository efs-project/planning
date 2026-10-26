# Concrete teaching revision, October 26

James asked for Ethereum examples or invented example data instead of Nostr;
an actual use of the walk-away checklist; module composition rather than
unrelated apps on a base; and diagrams for releases, recovery, retained data,
EFS references, chain views, background work and community continuity.

Implemented in [[Devcon/presentation/2026-10-26-concrete-examples/README]].
This updates the rehearsal deck and presentation plan, not EFS architecture,
the accepted proposal or the organizer's deck.

## One concrete thread

Garden DAO and Maya are fictional. Maya wants to find proposal 42, read its
plan and cast a test vote. This task connects the parts of the stack without
requiring the audience to learn a new project at every slide.

The hyperstructure diagram shows teams building membership, voting and
treasury modules, a DAO app composing them, and a social app composing the
DAO with a moderation module. Moderation controls what that interface shows;
it does not rewrite treasury rules or erase every copy of a post. This is
the ambition of dependable composition, not a claim that the illustrated
modules meet every economic property in the original hyperstructure definition.
Source: [Jacob Horne, Hyperstructures](https://jacob.energy/hyperstructures.html).

The new worked test has one observed-in-the-story failure:

1. The saved release opens after the team's services are switched off.
2. The proposal list is missing because it used a private index.
3. A volunteer rebuilds the list from public events and the indexing recipe.
4. Maya selects that replacement index, finds the proposal and checks a copy
   of the plan against its expected digest.
5. She casts a test vote and sees its chain receipt.

The improvement is concrete: ship the index recipe and endpoint-switching
instructions with the handoff. The drill is labeled illustrative, not a fresh
EFS result. It starts with discovery; supplying a direct file path would skip
the failed list. Hostile-control testing remains the second scenario in the
talk, distinct from this absence drill.

## Ethereum shared-data illustration

The example EAS schema is `uint256 proposalId, string title, string
documentRef, string voteRef`. The record says proposal 42 is "Fund the garden."
Its document reference selects an exact EFS revision, including the chain and
deployment. The readable path is `/garden/proposals/42.md`. The voting
reference encodes the chain, contract and proposal identifier.

The DAO portal and community social app read the same statement and document
reference and reach the same voting contract. This is a proposed illustration,
not an existing integration. EAS `refUID` refers to another EAS attestation,
so this example uses its own `documentRef` field. Field meanings, authorship,
authorization and reference conventions are part of the shared format.

Sources: [EAS schema tutorial](https://docs.attest.org/docs/tutorials/create-a-schema),
[referenced attestations](https://docs.attest.org/docs/tutorials/referenced-attestations),
[EAS interface](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol).

The EFS slide teaches a specific handoff: readable path to public file record,
then metadata access or byte retrieval. A contract reads onchain metadata.
A client retrieves IPFS/Arweave bytes and checks the expected digest. The
diagram does not show a contract fetching offchain bytes. The historical
[EFS proof package](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof)
supports the file-check mechanism; the Garden DAO path is illustrative. No
fresh runtime retrieval or new deployment is claimed.

## Real naming values

Checked October 26, 2026 through public DNS and an Ethereum mainnet RPC:

- `ethereum.org` returned `104.18.176.152` and `104.19.239.224` through both
  `1.1.1.1` and `8.8.8.8`. The slide uses the first address. It labels a
  hosted endpoint, not one physical machine: these are Cloudflare addresses.
- At Ethereum mainnet block **26,279,986**, hash
  `0xd812e26824d24b4ef54112803d47e0fdb7b6c5ffabe1631d624ab2cb1c349b0e`,
  `efs.eth` resolved to
  `ipfs://bafybeicrisk74xwozdpx4v5kaqjmimzjqsrp74r5tsrgdyv5kju3dnp5ku`.
  Block time was 22:54:35 UTC. The slide explicitly shortens the CID.
- The resolver was `0xF29100983E058B709F3D539b0c765937B804AC15`, read through
  `https://ethereum-rpc.publicnode.com`. ENS registry:
  `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`.
- Both `efs.eth.limo` and `efs.eth.link` responded during the source check.
  They are gateway entrances and share the eth.limo operator. The three
  retained copies in the diagram are the proposed deployment pattern, not
  a measured count of EFS hosts.

Sources: [ENS decentralized web](https://docs.ens.domains/dweb/intro/),
[ENS contenthash](https://docs.ens.domains/ensip/7/),
[IPFS content addressing](https://docs.ipfs.tech/concepts/content-addressing/),
[IPFS persistence](https://docs.ipfs.tech/concepts/persistence/),
[eth.limo operator update](https://discuss.ens.domains/t/eth-limo-update/19707),
[Cloudflare proxy addresses](https://developers.cloudflare.com/dns/proxy-status/).

## Other mechanisms and editorial choices

- The release slide separates the runnable bundle from source and build
  materials. Its failure is concrete: the homepage opens but a script loaded
  later has disappeared.
- [Safe](https://docs.safe.global/advanced/smart-account-overview) remains
  the real Ethereum recovery example. The illustrative lost-phone arrangement
  preserves the account while two remaining signers replace a lost signer.
  File-decryption key recovery remains a separate check in the notes.
- Retention shows the proposal surviving while its only attachment copy is
  lost, followed by independent retained copies and a restore check.
- The chain-view slide shows public history, a published index recipe, a
  replacement view and its sync position. The displayed block 12345 is
  illustrative. [Graph Node](https://thegraph.com/docs/en/indexing/tooling/graph-node/)
  and [Helios](https://github.com/a16z/helios) remain optional mechanism sources.
- The worker slide now asks who sends the next transaction. A volunteer
  submits an already-approved action, and the treasury checks the rules.
  [PoolTogether V5 claimers](https://dev.pooltogether.com/protocol/design/prize-claimer/)
  remain a real incentive example in optional notes.
- The community slide shows a public handoff and volunteer roles. Hic et Nunc
  and Teia are removed rather than adding an unfamiliar ecosystem story.
- The immutable-contract recommendation and scoped Uniswap v2 example remain.
  Current public sections still avoid EFS version promises.

## Review and next action

All 30 slides were rendered and inspected. Native/PPTX/PDF checks verify order,
text and notes. A second reviewer caught the missing voting-contract reference
and the missing step of selecting the rebuilt index; both are now explicit.
The final route is 2,094 spoken words and **18:40 planned**, not rehearsed.

James's next run should test whether the diagrams explain the task faster than
the prior bullet lists. Ask which arrow or transition needs another sentence.
If time runs long, shorten the overview/checklist repetition before removing
the worked example that makes the audience action concrete.
