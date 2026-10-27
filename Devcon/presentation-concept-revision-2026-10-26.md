# Concept-first revision, October 26

James's read-through found the recurring Garden DAO too prescriptive. He
approved revising the existing deck around concepts and improvements for
developers' own apps. This supersedes the active storytelling direction in
[[presentation-concrete-revision-2026-10-26]], not its historical record.

## Message and flow

At every layer, reduce one operator's ability to stop the application or
change its rules. Make it possible for users and other developers to carry on.

The opening retains human stakes, the value to future builders and the vision
of dependable public components. The DAO composition diagram remains a
generic illustration of different teams building on each other. The walk-away
test supplies two scenarios: absent maintainers and hostile control.

The three chapters remain Interface, Data and Rules. Each layer explains a
job, a dependency that can stop it, an improvement and a check. There is no
recurring fictional app to learn. Keep each divider/question pair brief.

The practical invitation is: choose one task users already rely on, test it
without the team, fix the first dependency that stops it, and try again.

## Implemented changes

- Data formats come before tools. A small illustrative record makes IDs,
  authorship, text and attachments visible. Its meaning, versions, permissions
  and compatible decryption matter across clients.
- Database-backed apps can begin with documented exports, retained
  relationships and a second reader. Shared ongoing writes also need common
  authorization and synchronization. The talk does not require all data onchain.
- Two mock interfaces display the same note and attachment. They illustrate
  user choice, not a deployed EAS/EFS integration.
- Storage roles are explicit: offchain files/databases need retained copies;
  chain nodes replicate contract state. Keep the history needed to rebuild
  indexes as a separate operational concern.
- EFS teaches a readable path, public file details, retrieval references and
  a content fingerprint. Contracts read metadata; clients retrieve bytes.
- State reads and indexed discovery have separate diagram rows. The Graph
  and Helios have distinct jobs and do not imply automatic EFS integrations.
- Tornado Cash Classic replaces the fictional executor as a scoped example
  of permissionless transaction submission.
- Immutable core contracts, voluntary migration, network recovery, public
  handoff and the eight-check summary remain.
- One final illustrated test shows a note list before an index failure,
  an unavailable view, and the restored task after publishing a recipe,
  enabling endpoint selection and rebuilding from retained records.

## Source checks and speaking boundaries

### EAS and file references

[EAS](https://attest.org/) and its
[schema registry](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol)
make structured statements a useful example. The
[attestation interface](https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol)
separates schema, attester and encoded data. The displayed note is an invented
record, not an adopted schema. EFS's separate mechanism rests on the
[historical proof package](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof).
No fresh retrieval or deployed compatible-client integration was tested.

### The Graph and Helios

The Graph's [indexer documentation](https://thegraph.com/docs/en/indexing/overview/)
describes independent indexing and query services. A rebuild needs published
definitions and suitable retained history. The normal gateway, billing and
API-key path is also a dependency. This is not a blanket reliability verdict
on every subgraph. [Helios](https://github.com/a16z/helios) checks supported
chain responses with checkpoint and provider assumptions. It is not an
offchain-file storage service or an automatic verifier of arbitrary indexes.

### Tornado Cash Classic

The [Classic pool](https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol)
checks a withdrawal proof, known root and unused nullifier rather than a
privileged caller allowlist. The
[ETH implementation](https://github.com/tornadocash/tornado-core/blob/master/contracts/ETHTornado.sol)
pays the authorized recipient and relayer fee. Another submitter can perform
the submission role. The proof binds recipient, relayer address and fee, so
changing a paid relayer may require a new proof. UI registry rules and
governance are separate. No current relayer availability or legal claim is
part of the talk. The lesson is a replaceable service, not an operating guide.

### Uniswap and reuse

[Official Uniswap documentation](https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works)
describes non-upgradeable core contracts. v2 remains the simple example;
bounded fee configuration still exists. v4 hooks can add other behavior and
upgrade powers. Fixed core code is not a whole-application safety rating.

The earlier October 26 research independently checked a successful canonical
v2 USDC/WETH swap receipt: transaction
`0xd5cc225a285adc402669af3930dca1e486e5508feb1289be447a3d1660aaa4f7`,
block `26280293`, `2026-10-26T23:55:59Z`, status `1`, via public Ethereum RPC.
It establishes continued v2 activity, not broad usage or safety statistics.

[Zerion's April 23, 2026 announcement](https://zerion.io/blog/zerion-wallet-now-offers-swaps-powered-by-uniswap-api/)
documents wallet swaps through the Uniswap API, including v2/v3/v4 liquidity.
Use it to illustrate composition. Do not claim Zerion selected it because of
immutability; its stated reasons concern liquidity and execution. The API is
an additional offchain dependency, not proof the wallet passes the test.

### Network recovery

[OP Stack outage documentation](https://docs.optimism.io/op-stack/protocol/outages)
describes submission through L1 under stated conditions. Forced inclusion is
not a universal withdrawal path or protection against every hostile upgrade.
The audience check uses the actual network, account, costs and user task.

## Practice and delivery

The revision has 30 slides including transitions and Q&A, 1,991 main narration
words and an 18:30 cue budget. That is a planning budget, not a measured run.
The before snapshot preserves James's current cover, DNS diagram edits and
Data label. The organizer's deck is outside this edit.

Practice slides 1-29 without reading optional details or sources aloud. The
remaining risk is whether the short layer tour leaves enough time to explain
the diagrams and whether the audience can name one change for their own app.
The strongest next feedback is the least clear diagram and the total duration.
No live demo or product implementation is required.

Saved version: [[Devcon/presentation/2026-10-26-concept-first/README]].
