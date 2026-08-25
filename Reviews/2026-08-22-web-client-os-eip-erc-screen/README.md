# Web Client / OS EIP and ERC corpus screen

**Status:** complete evidence screen at pinned 2026-08-22 official revisions; this is not an implementation-support survey or adoption ruling
**Scope:** official Ethereum EIP/ERC corpus, with Web Client, modular Web OS, SDK, Files, Type/Data ABI, identity, privacy, app-runtime, and agent implications
**Feeds:** [[Designs/web-client-os/ethereum-standards-and-interop]], [[Designs/web-client-os/technology-foundation]], [[Designs/web-client-os/architecture-and-modules]]
**Reviewed:** 2026-08-22

#status/done #kind/review #repo/planning #repo/client #repo/sdk #topic/efsv2 #topic/cypherpunk-os #topic/web-standards #topic/app-model #topic/privacy #topic/agents

## Outcome

The full official corpus was inventoried after the EIP/ERC repository split,
then screened for EFS relevance. The resulting design direction is deliberately
narrower than “implement Ethereum standards”:

1. EFS should use mature EIPs/ERCs at explicit interoperability boundaries for
   exact-block reads, wallets, typed signing, contract-signature verification,
   chain-qualified citations, ENS/URI/resource adapters, and external contract
   introspection.
2. No EIP/ERC replaces EFS's distinction among chain, Realm, basis, Principal,
   Files path/Binding, immutable content identity, Locator, verified bytes,
   completeness, or execution authority.
3. Several useful Final standards are negative evidence. A script URI,
   contract resource response, agent registry, metadata record, interface bit,
   content hash, proxy slot, or wallet discovery event is not permission to
   trust, install, render actively, sign, or execute.
4. Draft, Review, Last Call, Stagnant, and Withdrawn work can shape seams and
   fixtures. It cannot silently become an EFS protocol or public SDK contract.
5. “Final” means the text is final under EIP-1. It does not prove support on a
   target chain, RPC, wallet, browser, contract, or deployment, and it does not
   certify safety.

The complete classification and resulting client/SDK boundary are in
[[Designs/web-client-os/ethereum-standards-and-interop]]. No generic Core noun
or EFS protocol change was justified by this pass.

## Pinned official sources

| Corpus | Official repository revision | Revision time | Files in repository lane | Canonical substantive documents |
|---|---|---:|---:|---:|
| EIPs | [`ethereum/EIPs@f767a1e`](https://github.com/ethereum/EIPs/commit/f767a1e8078e17c9b381a91d35a09492189ede1b) | 2026-08-22 11:32:22 UTC | 949 | 584 |
| ERCs | [`ethereum/ERCs@9c718c7`](https://github.com/ethereum/ERCs/commit/9c718c7c02372a6b7e300990511cd6fdff7f1dfa) | 2026-08-22 06:27:31 UTC | 612 | 611 |

The EIPs repository retains 365 `status: Moved` ERC migration stubs, and the
ERCs lane carries one support copy of `eip-1.md`. They were read, hashed, and
indexed as source files but not double-counted as substantive proposals. The
official [EIPs repository](https://github.com/ethereum/EIPs),
[ERCs repository](https://github.com/ethereum/ERCs), and
[EIP-1](https://eips.ethereum.org/EIPS/eip-1) establish the split, canonical
publication process, and status meanings. The canonical public proposal URL
remains `https://eips.ethereum.org/EIPS/eip-N`, including ERCs.

## Corpus coverage

The generated [[corpus-index.tsv]] contains one row for every one of the 1,561
source Markdown files. It records corpus, number, canonical/moved status,
canonical URL, title, status, type/category, creation date, dependencies, word
count, full-file SHA-256, coarse high-recall subject tags, and source filename.
Its SHA-256 in this review is:

```text
4315e018d019c409b56e4cb2b60ca708b7dc32d4768faad2a7f4f0293502995f
```

The source files contain 2,103,647 whitespace-delimited words including moved
stubs and the support copy. The 1,195 canonical substantive documents break
down as follows:

| Status at pinned revisions | Count |
|---|---:|
| Final | 279 |
| Draft | 352 |
| Review | 98 |
| Last Call | 19 |
| Stagnant | 400 |
| Withdrawn | 44 |
| Living | 3 |

| Proposal type/category | Count |
|---|---:|
| Core | 432 |
| Interface | 59 |
| Networking | 28 |
| ERC | 611 |
| Meta | 43 |
| Informational | 22 |

## Reading method

This pass used four stages so “all” would be auditable without pretending that
every proposal deserves equal product depth:

1. **Complete ingestion.** Every official Markdown source was opened in full,
   hashed, and front matter was extracted. Moved stubs remained visible.
2. **High-recall semantic screen.** Every full proposal text, including titles,
   metadata, summaries, abstracts, motivations, security sections and
   dependencies, was screened for keyword hits across wallet/signing,
   read/proof/history, URI/content,
   identity/type/data, package/runtime/security, privacy/cross-chain, agents,
   and human-interface domains. Status did not suppress a hit.
3. **Candidate review.** The 178 numbered proposals below received targeted
   specification and security review. Three independent domain passes covered
   accounts/wallets, content/identity/data, and apps/security/agents; a final
   synthesis reconciled overlaps and replacements against the current EFS
   spine.
4. **Negative-evidence pass.** Likely-sounding filesystem, type system,
   package, client-script, metadata, proxy, wallet, agent, and cross-chain
   standards were checked specifically for authority laundering, completeness
   overclaim, active-content risk, mutable-state dependence, and hidden hosted
   infrastructure.

This is a complete **corpus screen**, not a claim that every paragraph of every
unrelated opcode/token/vault proposal received equal manual commentary. The
machine-readable index prevents silent omission; relevance candidates received
human/agent semantic review; the design map exposes what survived. A future
implementation must re-pin status and test actual target support.

### Candidate review set

The prefix reflects the current split, not the canonical URL path.

**EIPs (46):** 1, 155, 234, 658, 695, 712, 1014, 1102, 1186,
1193, 1474, 1559, 1898, 2255, 2696, 2700, 2711, 2718, 2930, 2935,
2938, 3074, 3085, 3326, 3607, 4444, 4788, 4844, 5593, 5749, 5792,
6963, 7642, 7702, 7745, 7749, 7867, 7896, 7910, 7951, 8072, 8123,
8130, 8141, 8197, 8304.

**ERCs (132):** 20, 55, 137, 165, 181, 191, 223, 634, 681, 721,
725, 777, 820, 831, 1046, 1056, 1155, 1167, 1191, 1271, 1319,
1328, 1363, 1387, 1484, 1577, 1710, 1820, 1822, 1900, 1967, 2098,
2157, 2193, 2470, 2477, 2535, 2612, 2771, 2942, 3009, 3448, 3668,
3770, 4337, 4361, 4804, 4906, 4907, 5018, 5094, 5139, 5164, 5169,
5219, 5247, 5267, 5564, 5573, 5625, 5630, 5750, 6170, 6224, 6492,
6538, 6551, 6821, 6860, 6865, 6900, 6944, 7053, 7087, 7201, 7208, 7401,
7562, 7572, 7579, 7588, 7617, 7618, 7662, 7677, 7679, 7682, 7683, 7710, 7715,
7730, 7738, 7739, 7754, 7774, 7785, 7786, 7795, 7813, 7821, 7828, 7836,
7841, 7846, 7857, 7871, 7902, 7913, 7930, 7945, 7950, 7984, 8001, 8004,
8019, 8033, 8041, 8049, 8086, 8100, 8107, 8111, 8122, 8126, 8152,
8183, 8196, 8199, 8217, 8226, 8257, 8273.

An independent SDK v2 census at
[`efs-project/planning@4d3e736`](https://github.com/efs-project/planning/blob/4d3e736524ca04cdadfb26fdd628fcd206fc8084/Designs/sdkv2/ethereum-standards-census.md)
was reconciled after this screen. It independently reached the same boundary
for EIP-1193/6963, EIP-1898, EIP-5792, EIP-7702, account abstraction,
signatures, wallet permissions, clear-signing descriptors, and canonical
read-back, and added targeted review of ERC-7562, ERC-7710, and ERC-7902. Its
reported 612 ERC-lane documents includes the ERC repository's support copy of
`eip-1.md`; both passes agree on 611 unique ERC proposals and 1,195 unique
canonical substantive proposals overall.

## High-value findings

### Exact and qualified reads

- [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898) and
  [EIP-234](https://eips.ethereum.org/EIPS/eip-234) are the strongest direct
  fit. Dependent state calls and log queries can be pinned to a block hash;
  `latest` calls cannot establish one coherent EFS read basis.
- [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186) is useful proof-shape
  evidence, but a returned proof is only as trustworthy as the independently
  obtained block header/state root and finality evidence.
- [EIP-4444](https://eips.ethereum.org/EIPS/eip-4444) and
  [EIP-7642](https://eips.ethereum.org/EIPS/eip-7642) make historical
  unavailability an architectural fact. An RPC/archive miss is never EFS
  absence.
- [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) explicitly supplies
  temporary blob availability, not durable EFS file or release custody.
- Draft [EIP-7745](https://eips.ethereum.org/EIPS/eip-7745) and
  [EIP-8304](https://eips.ethereum.org/EIPS/eip-8304) are high-value watch
  items for proof-oriented log and transaction lookup, not present Core
  dependencies.

### Wallets, signatures, and actions

- [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) is the narrow provider
  API. Its own security section says to treat the provider object as
  adversarial. It belongs only in the explicit write lane.
- [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) is the selected
  multi-provider discovery adapter. Discovery metadata is self-attested and
  carries SVG, imitation, tampering, and fingerprinting risks. Guest boot must
  not dispatch its discovery event.
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712) supplies typed signing,
  not replay protection or EFS semantics. EFS still binds exact action,
  Realm/chain, target, commitments, nonce, expiry, and actual signer.
- [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271),
  [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492),
  [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913), and
  [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) support the existing
  direction that a signer need not be a spendable EOA. Historical verification
  remains chain/basis/code qualified.
- [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792) is the preferred
  supported-wallet batch-call adapter. Its status model explicitly permits
  partial effects, so an EFS ActionReceipt cannot equate “batch submitted” or
  one popup with atomic semantic success.
- [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) and
  [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) confirm that semantic
  Principal, controller, account sender, authorization authority, bundler,
  paymaster, outer transaction sender, and actual EFS signer cannot collapse
  into “connected wallet.”
- Stagnant [EIP-7867](https://eips.ethereum.org/EIPS/eip-7867) makes strict,
  loose and absent atomicity plus continue/halt failure flow explicit. It is
  useful negative evidence: an unknown or downgraded wallet flow cannot satisfy
  an EFS action whose consumer requires atomic effects.
- Stagnant [EIP-7896](https://eips.ethereum.org/EIPS/eip-7896), Draft
  [ERC-6865](https://eips.ethereum.org/EIPS/eip-6865), and Draft
  [ERC-7754](https://eips.ethereum.org/EIPS/eip-7754) may improve wallet display
  or request-tamper evidence, but their App/contract/DNS-supplied descriptions
  remain untrusted presentation input and cannot define trusted EFS semantics.
- Stagnant [EIP-5593](https://eips.ethereum.org/EIPS/eip-5593) supports the
  secure-top-level/no-third-party-provider defense, while Review
  [ERC-8111](https://eips.ethereum.org/EIPS/eip-8111) requires an explicit
  signature encoding/malleability profile. Draft
  [ERC-8199](https://eips.ethereum.org/EIPS/eip-8199) is an external
  smart-wallet blast-radius pattern, not a Web OS App sandbox or capability.

### Content, packages, and active code

- [ERC-3668](https://eips.ethereum.org/EIPS/eip-3668) is strong precedent for
  separating untrusted off-chain transport from contract callback
  verification. Its network privacy and availability risks remain.
- ENS, `contenthash`, Web3 URLs, contract resources, token metadata, and URI
  standards are optional adapters. They do not provide EFS Realm, authority,
  immutable File/Release identity, closure, verified bytes, or completeness.
- Final [ERC-5169](https://eips.ethereum.org/EIPS/eip-5169) is negative
  evidence: even it requires clients to validate immutable/authenticated script
  locations. A script pointer never becomes EFS execution authority.
- Draft [ERC-7087](https://eips.ethereum.org/EIPS/eip-7087) documents the
  active-content risk of accepting contract-selected MIME. EFS keeps MIME and
  presentation hints inert until trusted host policy chooses a safe renderer.
- Stagnant [ERC-5018](https://eips.ethereum.org/EIPS/eip-5018) is a useful
  filesystem analogue but cannot replace Files. It exposes mutable contract
  chunks and names without EFS objects, immutable revisions, qualified
  Bindings, plural untrusted Locators, full enumeration, or honest basis.
- EthPM/package registries, dependency registries, permissionless script
  registries, and content-addressed logic modules are precedent only. EFS's
  inert `PackageHandoff`, exact closure, OS-owned grants, and separate
  activation remain stronger boundaries.

### Arbitrary data and agents

- Stagnant [ERC-1900](https://eips.ethereum.org/EIPS/eip-1900) and its dType
  extensions are historical evidence for a registry-backed data ABI, not an
  adopted replacement for the current layered Type/Data ABI proposal.
- Last Call [ERC-7813](https://eips.ethereum.org/EIPS/eip-7813) is a valuable
  future Data Explorer adapter for table/schema-aware state. Its off-chain
  tables and event replication still require exact basis, coverage, and
  `PARTIAL/UNKNOWN`; “Last Call” remains incomplete under the repository's own
  citation guidance.
- Draft [ERC-8100](https://eips.ethereum.org/EIPS/eip-8100) is useful external
  representation evidence. A contract author's “XML-complete” declaration is
  not EFS query completeness, byte-canonical serialization, or safe rendering.
- [ERC-8001](https://eips.ethereum.org/EIPS/eip-8001) provides useful exact
  multi-agent intent/acceptance evidence. Draft
  [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004), Final
  [ERC-8126](https://eips.ethereum.org/EIPS/eip-8126), and later agent/tool
  registry proposals remain imported identity, reputation, validation, and
  discovery observations—not an EFS agent mandate, capability, install, or
  launch decision.

## Reproduction

From two checkouts at the revisions above:

```sh
node build-index.mjs /path/to/EIPs /path/to/ERCs corpus-index.tsv
shasum -a 256 corpus-index.tsv
```

The generator intentionally has no package dependency. Its subject tags scan
the full source text and remain coarse screening aids, not dispositions. A
proposal's design classification
comes from the reviewed map, never from a keyword hit.

## Limits and refresh rule

- This review establishes proposal text and status only at the pinned
  revisions. It does not prove that Sepolia, another Realm's execution chain,
  a chosen RPC, wallet, bundler, browser, gateway, or contract implements a
  proposal correctly.
- Core EIP activation is chain/fork specific. ERC deployment and ecosystem
  use are separate evidence. Both must be measured in a named execution
  profile.
- ENSIPs, CAIPs, WalletConnect specifications, Ethereum JSON-RPC documents
  outside the EIP corpus, Web standards, and chain-specific specifications
  need their own pinned passes. ERC-7828 and ERC-7930 make the CAIP dependency
  especially visible; no EIP/ERC alone defines the full EFS Realm identifier.
- Refresh this review before freezing a wallet, signature, chain-identity,
  URI, proof, agent, or app-runtime public interface, and record every status
  or normative change rather than silently updating links.
