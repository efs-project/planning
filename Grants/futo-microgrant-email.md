# FUTO Microgrant Email

Exact submitted text for [[futo-microgrant-application]]. Proposal status remains in [[proposals]].

**To:** `grantapps@futo.org`

**Subject:** Microgrant application: portable file verification without platform lock-in

**Submission state:** Sent by James to `grantapps@futo.org` on 2026-07-29.
Preserved here as the submitted text; do not silently revise it.

---

Hello FUTO team,

I'm James Carnley, a cypherpunk open-source developer from Chicago
building the Ethereum File System (EFS). I'm seeking a one-time USD
5,000 microgrant to turn a self-funded feasibility proof into a
maintained EFS Walk-Away Publisher/Verifier. EFS is an open-source
effort to make file references portable across storage systems. This
tool will let a maintainer publish, supersede, or revoke a signed file
reference, then let anyone verify the exact bytes from any surviving
IPFS or Arweave copy without depending on an EFS-operated website or
server.

Open-source release files and their metadata commonly depend on
accounts and URLs controlled by hosting platforms. If a hosting
account is suspended, abandoned, or compromised while the maintainer
still controls the signing key, users may retain copies but lose a
reliable way to determine which publisher signed the reference, which
bytes it identified, where valid copies were published, or whether the
reference was revoked.

Before applying, I built and published a deliberately small v0
demonstrator. It creates deterministic bytes, signs a canonical
manifest with JamesCarnley.eth, retrieves the same artifact through
IPFS and Arweave, and checks 14 EFS attestations across three live
Sepolia transactions. The standalone open-source verifier returns
VERIFIED, INVALID, or UNAVAILABLE without an EFS account or
EFS-operated server.

The artifact is 63,245 bytes with SHA-256
9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. Both
carriers returned those exact bytes. A compact 11,534-byte evidence
bundle containing the signed proof, manifest, verifier source, exact
direct dependency versions, and reproduction instructions is available
from either:

IPFS:
[https://w3s.link/ipfs/bafkreiblww44k5hmyimnlktnyf27rmdazxs7hajk65gcqydqhxsguelwwe](https://w3s.link/ipfs/bafkreiblww44k5hmyimnlktnyf27rmdazxs7hajk65gcqydqhxsguelwwe)

Arweave:
[https://ardrive.net/LwXdLNPkpHMAlDdhfbHnSndkz_5igAW7L8kTkhqoX0U](https://ardrive.net/LwXdLNPkpHMAlDdhfbHnSndkz_5igAW7L8kTkhqoX0U)

The source, exact commands, evidence ledger, and successful public
clean-runner workflow are here:

[https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof)

[https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md](https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md)

[https://github.com/efs-project/contracts/actions/runs/30423222694](https://github.com/efs-project/contracts/actions/runs/30423222694)

This v0 evidence is self-funded and not part of the requested budget.
Its EFS PIN and MIRROR records are individually revocable, but it does
not yet define a coherent manifest-level supersession or revocation
flow.

The six-week grant would fund that remaining work: a threat model and
signed-manifest-only baseline; explicit publish, supersede, and revoke
semantics; a maintained publisher and verifier; stronger failure and
portability tests; reusable test vectors; documentation; a short
video; and a final comparison report.

Ethereum has one narrow, falsifiable role: recording
publisher-authorized events in publicly readable, append-only shared
history that no application vendor controls. It will not store files
or promise permanence. The final report will state where a simpler
signed manifest is sufficient and whether Ethereum adds enough value
to justify its cost and dependencies.

The budget is 100 hours at USD 50 per hour: USD 750 for specification
and threat modeling, USD 2,250 for hardening and generalization, USD
1,250 for failure and portability testing, and USD 750 for
documentation and publication. I will maintain critical defects in the
funded code for at least twelve months.

I have developed EFS publicly since early 2025 and previously
delivered public contracts plus an experimental Sepolia deployment.
The broader EFS v2 architecture is still being designed; this grant
funds only the self-contained experiment described here.

EFS has been self-funded to date, and this proposed work is not funded
elsewhere.

All funded work will be MIT-licensed, independently usable, contain no
advertising or telemetry, and require no proprietary service.

Project and applicant:

[https://efs.eth.limo](https://efs.eth.limo/)
[https://github.com/efs-project](https://github.com/efs-project)

Thank you for considering the application. I would be glad to walk
through the published proof or provide a one-page technical
specification.

JamesCarnley.eth
JamesCarnley@gmail.com
