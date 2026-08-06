# GoE security and trust boundaries

**Status:** general production-adoption threat model; not a complete audit or finding register

#kind/review #status/done #repo/planning #topic/git #topic/security #topic/trust

## Bottom line

Treat the observed GoE deployment as a testnet prototype, not production infrastructure for valuable repositories. The system crosses repository-role, forwarding, FlatDirectory, SDK, Ethereum RPC, and EthStorage boundaries and has not yet supplied the complete independent security and migration evidence EFS would need.

Git object IDs can detect many altered Git objects when normal Git validation runs. Integrity detection cannot restore deleted or withheld data, prove complete object closure, or repair a failed storage/control plane.

## Why the gate does not block collaboration

The missing production evidence does not invalidate:

- Git remote helpers as an approach;
- ordinary Git packfiles as storage objects;
- EthStorage as a candidate byte carrier;
- GoE's demonstrated clone/fetch/push experiment;
- the value of contributing fixes and tests upstream.

EFS should not copy or integrate the deployed contracts as trusted infrastructure until:

1. the supported contract and CLI release is source-linked and versioned;
2. all storage-mutating/control interfaces are exhaustively enumerated and gated;
3. negative tests cover unauthorized callers against the real FlatDirectory implementation/SDK ABI;
4. the production candidate deployment is independently reviewed;
5. repository migration from the old deployment is documented;
6. EFS still retains independent object/pack placements.

## Additional policy/security gaps

### Fast-forward enforcement is client-trusted

The official helper performs a native Git ancestry check. The repository contract checks current-head equality but does not prove the new OID descends from the current OID. A modified authorized client can therefore bypass the intended distinction between normal and force push.

This may be acceptable if the contract is deliberately only a CAS/ref log and policy is attributed to a gateway. It is not acceptable to market the contract alone as enforcing Git fast-forward semantics.

### Branch-creator authority survives pusher revocation

The original branch creator remains allowed to force-push/delete that branch even after losing the pusher role. A future policy must state whether branch creation grants permanent branch ownership. If not, revocation is incomplete.

### Force-push history is logically hidden

Force push resets/truncates the active record sequence. Old physical storage and Ethereum history may remain, but the normal repository API does not expose the displaced tail. Auditing and recovery cannot rely only on `getPushRecords()`.

### Ref and pack updates are not atomic

Multiple refs and multi-pack branch pushes occur sequentially. An interruption can leave uploaded orphan packs or partially advanced branch state. An attacker or network failure can exploit inconsistent intermediate states even without breaking cryptography.

### SHA-1-only contract fields

Twenty-byte OID fields exclude SHA-256 repositories and create algorithm-confusion risk if a caller fails to bind the repository's object format. EFS must preserve an explicit algorithm tag rather than treating any 20-byte value as universal Git identity.

### Wallet and key boundary

The helper asks users to manage a dedicated Ethereum private key and requires it even for reads. Repository authority currently lacks a complete path for:

- hardware/SSH/passkey/smart-account interoperability;
- organizational threshold policies;
- lost-key recovery;
- clean authority rotation without changing repository identity;
- scoped, expiring credentials for gateways and CI;
- auditable policy epochs preventing rollback.

EFS KEL/smart-account work may eventually help, but current drafts are not a completed integration.

### Operational centralization

Version 0.2.0 hardcodes one Ethereum RPC, one EthStorage RPC, one Hub, and one network. Direct repository addresses reduce Hub dependence after discovery, but the shipped client remains operationally concentrated.

### Git integrity is not preservation

Git verifies object hashes and pack structure. It cannot recover a pack that every provider deleted or withheld. A credibly neutral service requires complete closure inventories, plural placement, retrieval checks, repair, and clean-room reconstruction.

## Threats a replacement/fixed design must test

- unauthorized mutation, deletion, truncation, ownership transfer, or storage bricking;
- incomplete ABI allowlists and upgrade-added methods;
- reentrancy/callback behavior across repository and FlatDirectory contracts;
- stale refs, replay, reordering, and policy-epoch rollback;
- modified clients lying about ancestry or object closure;
- multi-ref and multi-pack partial completion;
- force-push displacement and unreachable-object retention griefing;
- malicious or malformed packs, thin-pack bases, decompression/object bombs, and hash-algorithm confusion;
- compromised pusher/maintainer/admin keys and incomplete revocation;
- RPC/provider withholding, censorship, equivocation, and stale serving;
- secret leakage into durable public history;
- malicious public repositories or agent skills reaching executable consumers.

## Required pre-adoption evidence

- fixed, source-linked contract and CLI releases;
- independent Solidity and integration security review;
- end-to-end tests against the real storage implementation, not a permissive fallback mock;
- property/fuzz tests that every unauthorized call to every storage mutator/control method fails;
- public migration/recovery procedure for repositories from the old deployment;
- stock Git round-trip and corrupted/missing-pack fixtures;
- authority rotation/revocation tests;
- atomicity/failure-resume specification;
- at least one independent serving and storage path;
- clean-room reconstruction from documented data without project endpoints;
- an explicit remaining-risk statement.
