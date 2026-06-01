# For James — arch-review, ready to read

*Prepared overnight 2026-05-31 by the arch-review thread. Read this top-to-bottom; it's all recommendations, not raw analysis. Two big multi-agent reviews (91 + 38 expert agents) back everything below. Nothing irreversible has happened — no schemas registered, no contracts changed, repo synced, your stash safe.*

## The one-paragraph version

Your two instincts were both right, and one of them turned out even cleaner than expected. **(1) keccak256 is fine to hardcode** — it's not a risk we add, it's one we already live in (EAS UIDs, addresses, the whole state trie are keccak256), so a hash-algorithm tag would protect "a brick whose wall already fell." **(2) "Hash is data, not identity" is the right call — and it needs ZERO change to the frozen DATA schema.** We keep `bytes32 contentHash, uint64 size` exactly, reinterpret `contentHash = 0` as a valid "no inline hash" value (so you can pin a 10 GB IPFS file with zero download), and move the real hash story into self-describing multihash/CID properties. All 8 schemas validated solid-as-is. The proxy plan is sound; it just needs the real refactor built and a disciplined burn.

## Decision 1 — File identity (the thing you flagged last night). RESOLVED, your way.

**Recommendation: freeze DATA as `bytes32 contentHash, uint64 size` unchanged.** Three independent judges converged here.

- A file's identity is the **DATA UID** — that's what mirrors point at and what's pinned to folders. Unaffected by any of this. (You remembered right.)
- `contentHash = 0` becomes a **first-class** value = "no inline byte-hash." Pinning a 10 GB IPFS file: mint `DATA(contentHash=0, size)`, add the `ipfs://CID` mirror, attach the CID as a property. **No download.**
- The durable, agile, trustworthy hash lives in **properties** (`hash:sha2-256`, `hash:keccak256`, `cid`, …) — self-describing, multiple per file, trust-scoped per attester. This is your "hash as data," and because it's in the additive/upgradeable layer, it never touches the frozen schema.
- **Why this is the best outcome:** minimal frozen surface, your instinct honored, no migration, no orphaning — and DATA can be frozen now.

Details + the 10 GB walkthrough: [ADR-0049](../contracts/docs/adr/0049-file-content-identity-hash-as-data.md). **The open sub-question** (a convention, not a schema decision): we must write down a canonical "what exactly gets hashed" spec + reference test vectors, or clients drift over 100 years. I'll handle that in the spec; flagging so you know it's the load-bearing convention.

## Decision 2 — Proxy + burn-to-immutable. Your "make it immutable before mainnet" is exactly the model.

**Recommendation: proxy during dev (safety net for fixing bugs without orphaning seed data) → burn the upgrade key before mainnet → permanently immutable, trusted, resolver-gated.** Burning = renouncing the proxy admin; the address (and UID) stay stable forever, only upgrades stop. Coinbase and Gitcoin run the upgradeable form in production, so we're on a proven path, not novel ground.

What the security review changed in the plan (all folded into [ADR-0048 r2](../contracts/docs/adr/0048-sepolia-freeze-set-and-proxy-ready-resolvers.md)):
- **Register the schema LAST**, after the proxy is deployed+initialized+verified in one atomic step. (Registering first opens an unrecoverable window — a wrong address baked into a UID orphans every file.)
- **Burn is gated** behind a full test suite + a ≥14-day soak + a real upgrade-with-state dry run — not "ship and hope." Burning is the most irreversible action in the project, so it earns the ceremony.
- One governance note: this formally **supersedes ADR-0030's "no proxies on mainnet"** with "proxies allowed *iff* the key is burned before the first mainnet attestation." You already steered this; the ADR just writes it down.

## Decision 3 — Two real bugs the write-time re-check found (neither blocks the freeze)

Your 10 GB insight shook loose two more of the same kind — *the field is fine, but the resolver rejects values people legitimately have.* Both are **upgradeable resolver logic, not frozen schema**, so they don't block freezing:
- **Mirrors reject common URLs [HIGH].** `MirrorResolver` only allows web3/ipfs/ar/https/magnet — so an existing mirror at `ftp://`, `s3://`, BitTorrent, etc. can't be recorded, forcing a re-host (same shape as the 10 GB bug). Fix: drop/widen the allowlist (scheme safety belongs in the client renderer).
- **Folder/anchor names reject spaces & punctuation [MED].** "Q&A: Episode 5" can't be a name, and there's no canonical encoding, so different clients would encode it differently and break the shared-naming property. Fix: define one canonical name encoding in the spec + resolver.

I'll fix both in the resolver refactor; calling them out so you've seen them.

## What I'd like to do next (no action needed from you unless you object)

1. Build the proxy refactor **test-first** (the failure modes are the kind that pass a casual check and only surface on the first real attestation).
2. Deploy to Sepolia, prove the round-trip, fill the [freeze table](../contracts/docs/SEPOLIA_FREEZE_TABLE.md) with real addresses/UIDs, and bring it to you to **sign before anything is registered**.
3. The freeze stays gated on your signature; the burn stays gated on the soak + a second sign-off.

All drafts are on the contracts branch `arch-review`. Tell me if Decision 1 (freeze DATA as-is, hash-as-property) and the proxy/burn model look right, and I'll start the build.
