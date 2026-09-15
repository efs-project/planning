# Core closeout: typed live-backed Files

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** A real mounted File exposes an application's existing contract value to the SDK and another contract, with no duplicate EFS publication on each provider update.

**Architecture:** Ordinary exact descriptor and root/child revision Types, checked references, separate Files profile/read adapter. Immutable Records stay immutable; live outputs are qualified observations. No Ledger identity/storage change or automatic provider execution during admission/indexing.

**Spec:** [[core-design-audit-20260915]], packet4; [[../2026-09-12-efs21-live-contract-files#Compact prototype preflight — September 15|compact source preflight]]. The older native-arm implementation plan is not the compact recipe.

## Global Constraints

- Existing compact prototype after reviewed full index/query work; one source/build/chain worker. Parent owns canonical documents/publication. No owner-demo changes, UI polish, production repo, public transactions, Fable, package installations or unbounded evidence.
- Existing exact Types/Records and stored-byte digest meanings stay unchanged. A descriptor hash is not tomorrow's output hash; registration validation does not validate all future values.
- Preserve Name/Directory/ancestry and checked reference obligations, same-basis reads, unknown/masked selection, ordinary venue/code caps and rollback. Failed selected provider never silently falls through to a lower-priority file.
- First profile is read-only, same-chain, fixed exact provider runtime/interface and bounded typed return. No URL parser, generic arbitrary forwarding/writes, cross-chain synchronous call or proxy-following policy.

## Task 1: Mounted provider, paid consumption and immutable snapshot

**Files:** focused `LiveFilesProfile`/reader/provider/consumer contracts and tests, narrow existing Files index/reader/SDK profile extension, bounded actual Node measurement. Evidence in `core-closeout-live-files-20260915/`.

- [ ] Register ordinary live-descriptor and live-root/live-child revision Types. Descriptor commits chain/venue, exact provider/code/interface/calldata, output Type/representation and resource profile; child has checked descriptor/parent refs and same-File ancestry. Do not hide an untyped descriptor ID inside an inline body and claim admission-checked composition.
- [ ] Extend actual Files index, header/joined reader and SDK profile to recognize the new exact revisions. Reuse the generic reference index without duplicate appends. Mount live File beside stored and external/opaque content. Invalid descriptor/ancestry must fail admission; merely knowing a filename is not proof that its backing is readable.
- [ ] Bounded STATICCALL caps returndata before allocation, requires exact canonical typed return, checks provider identity/context, and validates the observed output shape. Zero/empty success differs from revert/unsupported/oversize/resource exhaustion. A caller-sensitive getter is evaluated through the declared adapter caller, not silently as the app/user. Provider code drift fails closed.
- [ ] Actual provider-only update changes a fresh live read while Ledger admissions and File HEAD/history remain unchanged. A second contract consumes the mounted value through the same profile. Show update→read inside one transaction separately from end-of-block RPC observations. No generic Core noun or hidden EFS write is added.
- [ ] Browser/SDK reads pin a supported block hash; interleave a provider update and verify the old-basis observation remains coherent while fresh reads change. Never concatenate range samples from different states or reclassify failure as an empty File.
- [ ] Snapshot is an explicit immutable publication of exact observed bytes, source read recipe and observation qualification. It does not manufacture source-chain proof. Preserve its bytes through offline export; live descriptor export alone does not keep a vanished provider executable.
- [ ] Show selected-provider failure does not reveal the lower-priority File. Descriptor membership may be COMPLETE while live-value filtering is PARTIAL/UNKNOWN; provider changes do not secretly advance an EFS change feed or revision index.
- [ ] Privacy/external boundary controls: ciphertext digest/shape may be verified without claiming plaintext shape or secrecy of public metadata; unavailable encrypted backing is opaque/unavailable, not empty. Onchain reader cannot fetch HTTP/IPFS and must return typed unsupported/unavailable rather than infer absence. No new encryption/key-management or zero-knowledge system is implied.
- [ ] Matched actual receipts: provider update alone, update+duplicate stored EFS publication, one-time live registration, paid stored/live consumers, snapshot and retained bytes. Report total calls/context/validation/deployment costs—not only a zero EFS-write counter. Include provider revert/large return/caller mismatch/malformed output/unsupported chain controls.
- [ ] Focused affected Files/query/Type/SDK tests, sizes and ordinary Node deployment. Self-review, exact commit/report and independent review; no universal live-provider claim.
