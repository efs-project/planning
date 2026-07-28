---
agent: codex-gpt-5
date: 2026-07-28
status: done
anchors:
  - area: governance
  - area: efsv2
  - area: privacy
  - review: 2026-07-28-voting
source: Comparative research rubric requested for Ethereum-aligned voting systems and EFS integration
---

# Voting-system research questions

#kind/research #status/done #repo/planning #topic/governance #topic/privacy #topic/onchain #topic/efsv2

This is the shared rubric for the project files in this folder. It prevents a familiar category error: comparing a complete civic-participation platform, an anonymous-membership primitive, an execution governor, and a secret-ballot protocol as if they were substitutes.

## 1. What is the thing?

1. Is it a complete election application, a protocol, a cryptographic primitive, a governance/execution framework, or a civic-participation platform?
2. Which decisions is it designed for: informal opinion, DAO signaling, grants allocation, organizational elections, participatory budgeting, or statutory public elections?
3. What is explicitly outside its threat model?
4. Which parts are normative protocol and which are one hosted operator's product?

## 2. What does a voter actually get?

1. Is the choice public, pseudonymous, hidden only until close, or permanently secret?
2. Can a voter verify:
   - **cast as intended** — the device encoded the intended choice;
   - **recorded as cast** — the accepted ballot matches what was cast; and
   - **tallied as recorded** — the accepted set produced the announced result?
3. Can an observer link a ballot, participation, timing, network address, or eligibility credential to a person?
4. Does the system issue a transferable receipt?
5. Can a voter safely change a vote after bribery or coercion, and what assumptions make that work?
6. Does the system resist only vote buying, or also surveillance, forced abstention, credential surrender, and a compromised client?

## 3. Who or what can break which property?

For each role—organizer, eligibility issuer, coordinator, sequencer, relayer, key holder, chain validator/sequencer, upgrade administrator, frontend, storage provider, and voter device—ask independently:

1. Can it create a false result?
2. Can it omit eligible ballots or stop the election?
3. Can it learn individual choices?
4. Can it change eligibility or voting weight?
5. Can it present different rules or software to different voters?
6. Is misconduct publicly provable, merely detectable, or invisible?
7. Is there a forced-inclusion, failover, refund, rerun, or recovery path?

“Correct even if the operator cheats,” “private from the operator,” and “finishes without the operator” are three different claims.

## 4. How are eligibility and uniqueness established?

1. Is eligibility based on an address, token snapshot, group Merkle root, anonymous credential, civil voter roll, proof of personhood, or administrator-issued credential?
2. Who decides membership, exclusions, weights, and snapshot time?
3. Does the protocol prove one credential per vote, one account per vote, or actually one human per vote?
4. Can eligibility be proved without publishing sensitive membership?
5. Can identity recovery, delegation, or key rotation accidentally create a second vote?
6. Is the eligible set reproducible from a named finality basis?

## 5. Where does Ethereum matter?

1. Which data and transitions are on an EVM chain, and which are merely referenced from it?
2. Does Ethereum provide ordering, data availability, proof verification, identity, assets, execution, or only a timestamp/commitment?
3. Can the system use an Ethereum L2? If so, which sequencer, data-availability, upgrade, bridge, and finality assumptions are added?
4. Can anyone submit, relay, prove, and finalize, or are some steps permissioned?
5. Can a result automatically execute a precommitted action without giving the voting protocol broader authority?
6. Are contracts immutable, upgradeable, or operator-controlled?

“Ethereum-aligned” in this review means meaningful use of Ethereum/EVM verification, settlement, assets, or composable governance—not merely Ethereum wallet login.

## 6. How expensive and operable is it?

1. What does signup, vote submission, proof generation, proof verification, tallying, and finalization cost?
2. Which costs are paid by voters, the organizer, a relayer, or a public subsidy?
3. What are the demonstrated electorate size, option count, message count, proof time, memory, and finalization time?
4. Is gasless mobile participation supported without making one relayer a censorship point?
5. Can two independent teams deploy and operate it from public instructions?
6. What happens when a deadline arrives during an RPC, chain, sequencer, prover, coordinator, or frontend outage?

## 7. How mature is the exact version?

1. What is the current canonical repository, tagged release, deployment, documentation version, and license?
2. Is the named protocol version actually released, or only described in a paper, branch, starter kit, or roadmap?
3. Which exact commits, circuits, contracts, verification keys, and setup transcripts were audited?
4. Were findings fixed in the deployed version?
5. Which real decisions used it, at what scale and stakes, and who operated them?
6. Is there an independent implementation or verifier?
7. Are maintenance, incident response, and long-term artifact availability credible?

Marketing usage counts are recorded as vendor claims unless a deployment artifact or independent report substantiates them.

## 8. Is it usable as a political institution?

1. Are the question, options, consequences, eligibility, close rule, quorum, tie, cancellation, challenge, and rerun rules immutable before opening?
2. Does the interface meet an appropriate accessibility target, including authentication, recovery, low bandwidth, assistive technology, and reviewed translations?
3. Can ordinary voters understand submitted, admitted, finalized, counted, and result-final states?
4. Does it support observation, dispute, adjudication, recount, and a durable public explanation?
5. Does it preserve secret-ballot norms where secrecy is required?
6. For opinion polls, does it report self-selection and participation honestly instead of implying population representativeness?

## 9. What can EFS add without pretending to be the election?

1. Can EFS package the exact client, verifier, circuits, contracts, setup provenance, translations, and policy as a content-addressed closure?
2. Can it bind a poll manifest to the chain, contract, eligibility root, finality basis, and voting-system version?
3. Which public artifacts are sufficient for independent verification and replay?
4. Which artifacts should **not** be made permanently available because they expose membership, metadata, or harvest-now/decrypt-later ciphertext?
5. Can multiple mirrors and relayers improve availability without becoming authoritative?
6. Can a user export the evidence and verify it without an EFS-operated service?
7. Does integration require only an application/profile, or does it expose a real generic gap in EFS v2?

EFS must not silently become the voter registry, identity authority, ballot box, decryption authority, coordinator, sequencer, official tally authority, or court of appeal.

## 10. Decision questions

Every project review ends with these:

1. What is it best at?
2. What important property does it not provide?
3. What is the smallest honest pilot?
4. Is it suitable now for:
   - a daily harmless folder poll;
   - an anonymous non-secret opinion poll;
   - a consequential EFS community decision;
   - an Ethereum DAO vote;
   - a private organizational election; or
   - a binding public election?
5. Is the disposition **adopt**, **integrate as an optional backend**, **prototype**, **watch**, or **do not use for this purpose**?

## Evidence standard

Use, in order:

1. current protocol specifications, official documentation, source and deployed artifacts;
2. peer-reviewed papers, public audits, standards, and government evaluations;
3. independently reproducible benchmarks and deployment records;
4. project retrospectives and operator reports;
5. project marketing, clearly labeled.

The [State of Private Voting 2026](https://pse.dev/articles/state-of-private-voting-2026/state-of-private-voting-2026-v2.pdf) report is a useful cross-project map, not an independent certification. It was coauthored by Privacy and Scaling Explorations and Shutter, and participating teams reviewed parts of their own project descriptions. Material claims should therefore be checked against project-primary artifacts.
