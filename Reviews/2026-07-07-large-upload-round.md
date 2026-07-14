# 2026-07-07 — Large on-chain upload design round

**Context:** James pushed on the large-file case: "make the data bytes signatures too so a MetaMask wallet could sign once for a large file," and — for files bigger than one block — "any way to use signatures and make on-chain file uploading easy? A few prompts, or one prompt with chunking? I want large on-chain uploads to be solid as scalability improves." He explicitly asked for expert subagents to map all solutions and let him choose. This record documents that round; ruling doc: [[large-file-uploads]]. Corpus (~490KB, 12 files): `planning/Reviews/2026-07-07-large-upload-corpus/`.

**Method:** 12 agents — 5 discovery (native manifest+chunk submission; authorization schemes; DA/scaling transport; prior-art autopsy; on-chain storage mechanics) → 3 architects each designing a distinct end-to-end approach → 3 red teams (one per architecture) → 1 decision synthesizer. (One discovery agent hit the structured-output retry cap but wrote its file first; covered by the other four.)

## The result

**The three architectures collapse to one genuine fork** — a fat/thin byte-layer dial:
- **A (native manifest + proof-streamed bytes):** one signed `chunks` manifest carrying an apex-count `chunksRoot`, feeding a sibling Etched `EFSBytes` contract; tier-0 SSTORE2 bytes in state, contract-readable, from-state reconstructible.
- **C (thin kernel + auth layer):** the *same* core (chunksRoot + count-at-apex + content-addressed SSTORE2 + presence-set resume + graded reads) but with the byte store as a Durable redeployable contract instead of an Etched sibling.
- **B (DA-transport + promotion):** A's core *plus* an EIP-4844 blob rail *plus* a promotion lifecycle. B ⊇ A on Etched surface.

**No fatal flaw in the shared mechanism** — the crypto core (count-at-apex n-binding, single-leaf proof admission reusing the envelope's already-fuzzed `verifyLeaf`, monotone bitmap accumulator, content-addressed dedup) was traced and could not be broken. The "one signature authorizes all N chunk submissions" claim genuinely holds for bounded files with no hidden second signature.

**Recommendation: A-mechanism + B-lens + C-discipline** — Architecture A with mandatory red-team fixes, B's read/promotion lens, C's one-opaque-row / runtime-chunkSize / byte-machinery-in-a-sibling-contract discipline.

## Red-team outcomes

- **A:** no fatal; crypto sound. Serious framing findings, all fixed in [[large-file-uploads]]: drop `submitChunkRun` (novel un-fuzzed crypto for 5–15%, the whole novel-crypto blast radius); the one signature can't compel permanence tier (the trilemma) or completion/funding; permissionless pool = unattributed permanent unretractable inscription + byte-revocation bypass (two false §11 self-adversarial entries corrected); from-state reconstruction holds only for tiers 0/1.
- **B:** not fatal to safety (never corrupts, never lies at read time — its lens is good and adopted), but its **central novel thesis — the blob rail — is fatal as a shippable mechanism**: 18-day prune makes "bank now, promote to L1 in 2030" impossible (must promote within 18 days at today's prices); no 2026 stock wallet builds a type-3 blob tx (breaks the self-submit floor for that rail); a promoter re-keccak-verifies every chunk regardless of channel, so blobs buy nothing over "any channel + keccak-verify"; `attestBlobPublication` is an attacker-writable, unverifiable (KZG≠keccak), net-negative Etched surface. → reserve tier-3, drop `attestBlobPublication`, ship blobs only when durable (EthStorage-class).
- **C:** buildable, three sound instincts (bytes off the enumeration spine; forgery-impossibility; author/relayer-death survivability), but the *document's* thesis is destroyed on its own terms: "thinner = more permanent" is false (F1: the chunk-Merkle construction **is** the commitment — frozen on first signature whether the verifier lives in an Etched or Durable contract), and its from-state reconstruction is *weaker* than A's (F2: evolving store initcode → same chunksRoot → different addresses; A anchors on a frozen ERC-7201 layout). C's real delta shrinks to a kernel-LoC argument, already neutralized by making `EFSBytes` a sibling contract.

## Decision matrix (5=strong … 1=broken; REC = A+fixes+B-lens+C-discipline)

| Axis | A | B | C | REC |
|---|---|---|---|---|
| Prompts | 4 | 2 | 4 | 4 |
| Permanence / 100yr | 4 | 2 | 3 | 5 |
| Gas | 3 | 3 | 3 | 3 |
| Forward-compat | 4 | 2 | 4 | 5 |
| Etched-surface safety | 3 | 2 | 4 | 4 |
| Portability | 4 | 3 | 4 | 4 |
| Resumability | 5 | 3 | 5 | 5 |
| R1 contract-readability | 5 | 2 | 3 | 5 |
| Neutrality / self-submit floor | 4 | 1 | 3 | 4 |

Illustrative unweighted totals A 36 / B 20 / C 33 / REC 39; mission-weighting (permanence, R1, neutrality) widens REC over C and buries B's rail. B's low scores are almost entirely its novel rail — its lens is good and additive.

## What needs James (carried into [[large-file-uploads]] + [[freeze-gates]])

1. Optional signed `minTier` permanence floor (the trilemma) — recommend add, optional.
2. Manifest-gate permanent tiers 0/1? (liability vs neutrality) — lean gate-permanent, leave-ephemeral-open.
3. Fat/thin dial confirm (A Etched sibling) — contingent on the EIP-170 skeleton compile.
4. L1 vs L2 permanence anchor + LOCKSS-replication scope.
5. Blob-rail trigger + promotion funding (exogenous, unsolved).

## Experiment (a few days, one L2)

One vertical slice: 1 MB file → one signature → relayer submits + streams ~43 tier-0 chunks via `submitChunk` only → kill relayer at 60% → different account finishes from the on-chain bitmap → read back via `extcodecopy` + `isComplete` + `contentHash`. Settles the EIP-170 skeleton compile (the dial), the gas snapshot, the crypto core, one-signature-plus-resume-from-a-different-account, and R1 readback. Excludes `submitChunkRun`, blobs, promotion.
