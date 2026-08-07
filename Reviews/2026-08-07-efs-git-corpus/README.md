# EFS Git deep-dive corpus

**Date:** 2026-08-07
**Status:** supporting evidence for [`../2026-08-07-efs-git-deep-dive.md`](../2026-08-07-efs-git-deep-dive.md); research/design pass, not implementation authorization and not an owner ruling
**Scope:** credibly neutral Git hosting, Git-backed EFS Markdown workspaces, Wikipedia-style collaborative editing, agent-artifact releases, and the exact Git/EFS boundary

#kind/review #status/done #repo/planning #repo/sdk #repo/client #topic/efsv2 #topic/git

## Analysis documents

- [`requirements-ledger.md`](./requirements-ledger.md) — adopted rulings vs James's goals vs kickoff hypotheses (with verdicts) vs this pass's proposed requirements (P-G1…P-G8).
- [`state-model.md`](./state-model.md) — the four identity layers, repository descriptor, canonical-state split, the `GIT-REF/1` admission-ordered ref-transaction fold, KEL↔Git authority mapping, wiki branch profile.
- [`primitive-fit-gap.md`](./primitive-fit-gap.md) — capability-by-capability map onto the five-kind kernel/lens/client primitives; the eight genuine (non-kernel) gaps; the differentiation sentence tested clause by clause.
- [`storage-closure-recovery.md`](./storage-closure-recovery.md) — closure manifests, digest-addressed containers, checkpoints/bundle-URI serving, LFS, retention after force-push, SWH alignment, clean-room rebuild.
- [`wiki-and-collab.md`](./wiki-and-collab.md) — the user-verb mapping, sentence-per-line + normalized CommonMark house style, conflict UX, revision-hiding and accepted-head mechanisms, minimal proposal objects, skills rider.
- [`candidate-architectures.md`](./candidate-architectures.md) — four shapes (minimal-additive A, recommended profile B, chain-maximal C, P2P-first D) adversarially compared; recommendation + falsifiers.
- [`threat-and-economics.md`](./threat-and-economics.md) — hostile inputs, ref/authority attacks, secrets/permanence, spam economics, the validity/serving/curation split, who pays, gateway/legal field evidence.
- [`traces.md`](./traces.md) — the fifteen required grounding traces (T1–T15).
- [`freeze-impact.md`](./freeze-impact.md) — generic-substrate riders (all on existing items) vs Durable work; explicit kernel non-asks.
- [`prototype-plan.md`](./prototype-plan.md) — six milestones + the executable acceptance suite.
- [`adversarial-reviews.md`](./adversarial-reviews.md) — the five verbatim pre-publication review reports + disposition of every finding (audit trail for the repairs incorporated above).

## Prior-art lanes (`prior-art/`)

Thirteen web-research lanes (primary/current sources, researched 2026-08-07, implemented-vs-intent labeled) plus one first-hand experiment set:

- [`local-git-experiments.md`](./prior-art/local-git-experiments.md) — E1–E11 + E9b scripted fixture experiments on git 2.54 (scripts committed under `prior-art/scripts/`) (bundles, atomic push, CAS transactions, force-push GC loss, SHA-256 interop refusal, prose merges, closure enumeration, rename heuristics).
- [`git-core-mechanics.md`](./prior-art/git-core-mechanics.md) — object/ref/transaction model, proc-receive, push certs, protocol v2, bundle-URI adoption, partial clone/backfill/LOP, SHA-256 transition, LFS internals, multi-repo hosting, GC/force-push forensics.
- [`radicle.md`](./prior-art/radicle.md) — Heartwood 1.10, sigrefs replay incident (full timeline + fix), canonical-ref quorum stalls, identity-COB evaluation bugs, adoption/funding arc, the unsolved list.
- [`forges-and-formats.md`](./prior-art/forges-and-formats.md) — Forgejo/Gitea storage split, F3, ForgeFed's stall, GitHub/GitLab export losses, Gerrit NoteDb, git-appraise/git-bug/Fossil/Jujutsu change-id.
- [`git-backed-wikis.md`](./prior-art/git-backed-wikis.md) — Gollum/GitHub wikis, Gitit, Wiki.js dual-truth failure, Obsidian-git lessons, MediaWiki revision/revdel/pending-changes model, Everipedia/NIP-54/IPFS-Wikipedia.
- [`markdown-merge-and-collab.md`](./prior-art/markdown-merge-and-collab.md) — diff3 on prose, sembr + mdformat canonicalization, structured-merge state (Mergiraf; ASE-2024 warning), CRDT 2026 (Automerge 3, eg-walker), Wikipedia's actual merge mechanism.
- [`goe-ethstorage-public-state.md`](./prior-art/goe-ethstorage-public-state.md) — EthStorage Mainnet Alpha pins, web3:// stack, GoE mechanism/adoption, git3, the git-on-chain graveyard table.
- [`git-security-and-abuse.md`](./prior-art/git-security-and-abuse.md) — git bombs (materialization-time detonation), pack-parser amplification CVEs in non-C implementations, the fsck WARN/INFO trap, bundle-validation CVE, SHA-1 risk model, secrets/forge-abuse/moderation precedents.
- [`git-signing-and-identity.md`](./prior-art/git-signing-and-identity.md) — SSH signing/allowed_signers, SSH CAs, gitsign/Sigstore, push certificates, author-spoofing, the (negative) Ethereum-key bridge result, KEL-projection synthesis.
- [`nostr-and-p2p-git.md`](./prior-art/nostr-and-p2p-git.md) — NIP-34/grasp/ngit/Buzz, public-inbox/lore at kernel scale, git-ssb and IPFS-git post-mortems, the distilled five-object minimal set.
- [`software-heritage-preservation.md`](./prior-art/software-heritage-preservation.md) — SWH data model, SWHID/ISO 18670, vault rebuild proof, swh-alter takedown design, mirrors/bulk exports, deliberate gaps (LFS, issues/PRs).
- [`browser-git-and-opfs.md`](./prior-art/browser-git-and-opfs.md) — isomorphic-git/wasm-git 2026 state, github.dev's virtual-FS precedent, OPFS durability/quotas, pack-not-loose guidance, the phone envelope.
- [`agent-artifacts-and-skills.md`](./prior-art/agent-artifacts-and-skills.md) — Agent Skills spec gaps, marketplace distribution reality, the ClawHavoc poisoning incident, TUF/gittuf/SLSA/trusted-publishing, capability-diff UX evidence.
- [`credible-neutrality-and-exit.md`](./prior-art/credible-neutrality-and-exit.md) — credible-neutrality doctrine, walk-away case studies, gateway economics (IPFS endgame), anonymous-read funding models, the legal line, operator-independence ingredients.

## Evidence boundaries

- Prior-art lanes were researched by parallel agents against primary sources and reconciled by the synthesizing agent; load-bearing claims cite their sources inline, and implemented behavior is distinguished from documented intent throughout.
- Local experiments used synthetic throwaway repositories only; no live network was written to.
- Nothing here adopts a carrier, dependency, kernel change, or product commitment; the owner decision packet lives in the main review.
