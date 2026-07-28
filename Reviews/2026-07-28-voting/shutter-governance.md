# Shutter Governance — mature temporary ballot shielding, not trustless secret voting

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use official Shutter, Snapshot, source, and ecosystem-report materials; recommendations are EFS analysis
**Scope:** deployed Snapshot Shielded Voting, the current Shutter API/keyper network, Permanent Shielded Voting work, and the onchain-governor design

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting

## Bottom line

Shutter’s finished governance product is a useful but narrow privacy layer:

> Encrypt each Snapshot vote while the proposal is open, then have a threshold keyper committee release the decryption key after close.

This prevents voters from seeing a running choice tally and reduces bandwagon, copycat, and last-minute strategic voting. It has been available to Snapshot spaces since 2022.

It is **temporary privacy**, not a permanent secret ballot:

- voter identity, weight, and participation metadata remain visible;
- after close, individual choices are decrypted and become public;
- a threshold of keypers can decrypt early;
- too few responsive keypers can prevent timely decryption; and
- Snapshot still supplies eligibility and tally semantics.

Shutter is therefore neither coordinator-free nor “no humans/trusted systems.” It replaces one decryptor with a threshold committee and makes its assumptions explicit.

Shutter has also built a **Permanent Shielded Voting** proof of concept using homomorphic ElGamal plus ZK proofs so only the aggregate is decrypted. As of this review, the project’s own published roadmap still describes a forked-UI PoC followed by testnet and mainnet stages. A separate onchain-Governor architecture is likewise published as design/PoC work, not the mature deployed Snapshot product.

**EFS verdict:** Shutter is a good optional add-on for a medium-stakes Snapshot poll where “no running tally” matters. It is not the right foundation for a permanently secret EFS organizational election today. EFS can preserve the encrypted-ballot commitment, keyper configuration, release evidence, deterministic tally, and result, but cannot remove keyper or Snapshot trust.

## How the deployed Snapshot integration works

### 1. Proposal setup

A Snapshot space enables Shutter Shielded Voting. The proposal’s ordinary Snapshot rules still define:

- eligibility;
- voting power;
- options;
- opening and closing time; and
- result calculation.

Shutter supplies the encryption/decryption layer, not the political institution.

### 2. Threshold key generation

Shutter keypers run distributed key generation for an epoch/eon and make a public encryption key available. No one keyper should hold the complete secret.

### 3. Local vote encryption

The voter’s browser encrypts the choice before submission. The ciphertext is signed and submitted through the host voting flow. Observers can see participation-related information but not the choice while the vote is open.

### 4. Time/event-based key release

After the proposal closes, keypers publish shares from which the proposal-specific decryption key can be reconstructed. The host decrypts ballots and computes the ordinary result.

The current Shutter API generalizes this pattern: applications register an identity/release condition, encrypt locally, and retrieve a decryption key after the condition. The API and registry are live on Gnosis Chain. [Shutter API documentation](https://docs.shutter.network/docs/protocol/api) · [how it works](https://docs.shutter.network/docs/protocol/api/how_it_works) · [source](https://github.com/shutter-network/shutter-api)

## Exact privacy and trust properties

| Property | Deployed Shutter + Snapshot |
|---|---|
| Choice hidden during voting | Yes, unless keyper threshold colludes |
| Running choice tally hidden | Yes |
| Choice hidden after close | No |
| Voter address hidden | No |
| Voting weight/quorum hidden | No |
| Permanent ballot secrecy | No |
| Receipt-freeness after close | No |
| Eligibility/tally verified by Shutter | No; host responsibility |
| No single decryptor | Yes |
| No trusted group | No; threshold keyper assumption |
| Finish if keypers disappear | Not guaranteed |

The current API documentation is unusually candid: it labels the service early-stage, says the keyper set is small and not yet fully decentralized, and advises against entrusting high-value assets or highly sensitive information to it. That warning should dominate an EFS readiness decision. [Current API documentation](https://docs.shutter.network/docs/protocol/api)

The jointly authored [State of Private Voting 2026](https://pse.dev/articles/state-of-private-voting-2026/state-of-private-voting-2026-v2.pdf) reaches the same structural conclusion: high implementation maturity for the Snapshot product, but temporary privacy, host-controlled eligibility/tally, and keyper threshold assumptions for privacy and liveness.

## What Shutter protects against

Shutter’s strongest current benefit is **fair ordering of information**:

- voters cannot condition a choice on the visible running result;
- prominent early voters reveal less information;
- a whale’s early choice cannot as easily trigger a cascade; and
- last-minute vote manipulation based on exact current totals becomes harder.

This is useful even when ballots eventually become public.

It does not solve:

- voter coercion after results reveal individual choices;
- vote buying conditioned on the final public record;
- retaliation against known voters;
- sybil resistance or personhood;
- a malicious eligibility rule;
- censorship by the host/relayer;
- client compromise; or
- keyper-threshold collusion or unavailability.

## Maturity as of 2026-07-28

### Deployed Shielded Voting

Shutter and Snapshot launched Shielded Voting in 2022, and the option remains present in current Snapshot documentation. Shutter’s project page reports more than 881 DAOs and 372,914 encrypted votes. Those are project-reported usage figures, not an independent census. [2022 integration announcement](https://blog.shutter.network/shutter-brings-shielded-voting-to-snapshot/) · [current project page](https://www.shutter.network/shielded-voting)

The source ecosystem remains active:

- `shutter-api` was active in July 2026;
- `rolling-shutter` published maintained network components and is MIT licensed; and
- the older core Shutter repository is also MIT licensed.

The current `shutter-api` repository did not expose a license file at the revision checked for this review. Do not assume the licensing of older Shutter components applies automatically to every current API component. We also did not find a current public audit index tying the exact deployed API, keyper configuration, Snapshot integration, and contracts to reviewed commits. That is a due-diligence gap for high-stakes use, not a claim that no review exists.

### Current decentralization state

The live service’s own warning that the keyper set is small and not fully decentralized means the product does not yet meet EFS’s aspirational “no humans or trusted operators” criterion. Threshold cryptography reduces unilateral power; it does not abolish operator power.

## Permanent Shielded Voting

Shutter’s permanent design changes the cryptographic shape:

1. each voter encrypts a valid option under a threshold ElGamal key;
2. a ZK proof establishes that the encrypted value is one of the allowed choices;
3. valid ciphertexts are homomorphically added;
4. keypers threshold-decrypt only the aggregate; and
5. a proof makes the result publicly checkable without revealing individual votes.

That would be materially stronger than the deployed temporary product. [Permanent Shielded Voting announcement](https://blog.shutter.network/permanent-shielded-voting-is-coming-to-snapshot/) · [technical PoC description](https://blog.shutter.network/coming-soon-to-daos-permanent-shielded-voting-via-homomorphic-encryption/)

Readiness must not be inferred from the deployed product’s usage. The 2025 announcement states:

- Stage 1: PoC in a forked Snapshot UI;
- Stage 2: Snapshot testnet integration; and
- Stage 3: mainnet release.

We found no later primary release announcement establishing the permanent variant as a generally available mainnet Snapshot feature by 2026-07-28. Current Snapshot settings still describe the temporary reveal-at-close behavior.

The permanent design also retains the threshold committee:

- privacy can fail if enough keypers collude;
- availability can fail if too few release valid shares;
- committee selection and rotation matter;
- ballot validity proofs and tally/decryption proofs need exact-version review; and
- coercion resistance requires more than permanent secrecy unless the scheme also prevents transferable receipts or enables safe vote change.

## Onchain Governor work

Shutter has published an architecture for shielded onchain governance:

- per-proposal encryption;
- encrypted ciphertext votes onchain;
- threshold key release after close; and
- permissionless decryption/tally publication.

That is a promising bridge to OpenZeppelin-style execution, but the project’s own 2025 description is an architecture/PoC direction, not evidence of a production Governor module. [Onchain governance design](https://blog.shutter.network/closing-the-governance-privacy-gap-on-chain/)

EFS should watch it, but not select it today on the assumption that the mature Snapshot integration proves the onchain variant.

## Ideological fit

Shutter is ideologically attractive when the goal is:

> Nobody should learn the live result, and no one operator should hold the decryption key.

It is weaker than MACI on anti-collusion, because the deployed system ultimately exposes individual votes. It is weaker than CRISP’s intended permanent-secret architecture, because individual ciphertexts are decrypted. It is operationally much more mature than CRISP’s current testnet integration.

Compared with public Governor voting, Shutter improves freedom from herd pressure but adds a specialized operator network and decryption liveness dependency.

## EFS integration design

### Recommended boundary

Treat Shutter as an encryption adapter over a poll backend:

```text
EFS poll manifest
      |
      +--> Snapshot eligibility/tally
      |
      +--> Shutter encryption identity + keyper/eon configuration
      |
      +--> encrypted ballots / commitment
      |
      +--> key release + decrypted votes + result
```

EFS records and authenticates the evidence. It does not become a keyper, decryption oracle, or Snapshot Hub.

### Artifacts to preserve

- poll manifest and Snapshot proposal;
- chain, Shutter registry/API addresses, eon and encryption identity;
- keyper set, threshold, public key, and release condition;
- exact client, encryption library, API, and contract versions;
- ciphertext-set commitment or complete public ciphertext set where appropriate;
- accepted-message receipts;
- key shares/decryption-key publication evidence;
- deterministic decryption/tally code and result; and
- any execution payload and receipt.

### Privacy-sensitive publication rule

For a real-person or permanently secret design, do not automatically store each raw ciphertext forever merely because EFS can. Cryptography ages, keys leak, parameter choices become obsolete, and metadata can identify voters.

Prefer:

- a commitment to the accepted ciphertext set;
- the proofs and aggregate necessary for result verification;
- the final tally;
- public protocol/config artifacts; and
- a documented retention policy.

The deployed temporary Snapshot product already intends later decryption, so preserving ciphertexts does not create the same additional long-term secrecy promise—but identity and participation metadata still deserve minimization.

### Can EFS remove Shutter’s trusted roles?

No. EFS can:

- make keyper membership and thresholds unambiguous;
- prevent the organizer from quietly changing rules;
- preserve evidence of which shares appeared and when;
- mirror clients and ciphertext evidence; and
- let independent verifiers reproduce the tally.

EFS cannot:

- force keypers to publish;
- prevent a threshold from colluding;
- make a small operator set decentralized;
- establish voter eligibility;
- hide metadata already exposed to Snapshot/Ethereum; or
- turn temporary privacy into permanent privacy.

## Best pilot

Use deployed Shutter with a Snapshot Classic EFS opinion poll where the research question is specifically:

> Does hiding the live tally change turnout, timing, and preference distribution?

Run paired public and shielded low-stakes polls with the same frozen membership basis. Measure:

- completion and decryption latency;
- keyper/API failure behavior;
- mobile usability;
- independent ciphertext/message recovery;
- replay of the final result; and
- whether voters understand “hidden until close” versus “secret forever.”

Do not attach automatic EFS authority in the first pilot.

## Suitability

| Use case | Suitability | Reason |
|---|---|---|
| Daily harmless folder poll | Good but often unnecessary | Useful only if hidden live totals matter |
| Anonymous non-secret opinion poll | Poor alone | Address remains visible |
| Consequential EFS decision | Moderate with explicit keyper assumptions | Mature temporary fairness layer |
| Ethereum DAO vote | Good Snapshot add-on | Not a native binding Governor today |
| Private organizational election | Insufficient deployed form | Individual choices reveal after close |
| Binding public election | Do not use | Small keyper set, no civic roll/process, temporary secrecy |

**Disposition:** **optional integration for temporary shielded signaling; prototype permanent/onchain variants only after a current release, audit/deployment map, and production network exist.**
