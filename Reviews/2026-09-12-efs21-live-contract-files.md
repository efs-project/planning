# Live contract files: avoid duplicating application state

2026-09-12 · owner-requested analysis / prototype candidate · not implemented or frozen

James explicitly supports investigating Linux/Plan9-style files whose contents come from a contract, alongside IPFS, retained onchain bytes and bespoke stores. This is a useful extension of the Files surface, not a reason to make immutable Records mutable or put URL parsing into the ingestion kernel.

**Economic hypothesis:** register a path/descriptor once, then read the application's existing state. Its ordinary updates need no second EFS publication. The application still pays its own writes; readers pay resolution, execution and validation. Registration, reads and optional snapshots must be priced before claiming a total saving.

## A simple user model

| Backing | What opening the file means | What is retained |
|---|---|---|
| Stored bytes | Retrieve exact committed content from a supported store/carrier | Content identity and whatever bytes the selected retention policy preserves |
| External content | Fetch through a declared locator and verify the expected content | A locator is not a promise of availability; ordinary contracts cannot fetch IPFS/HTTP themselves |
| Live contract value | Resolve the selected descriptor and execute its bounded read interface | The descriptor/history is retained; every returned value is **not** automatically an EFS revision |

The browser can show a small **Live** label and offer **Save snapshot**. A snapshot records exact observed bytes, source/read specification and observation context using ordinary immutable data. It must say whether the observation has chain proof, trusted-RPC evidence or another assurance; saving it does not manufacture proof. Snapshotting is optional paid work, not a hidden write on every open.

## What to borrow

Plan9 deliberately exposes resources through file operations without claiming they are all permanent disk files. Per-process namespaces assemble different services under useful names; ordinary trees can also expose historical snapshots. The transferable idea is a shared naming/read interface plus explicit namespace context, not identical storage or lifetime guarantees. [Original Plan9 namespace paper](https://9p.io/sys/doc/names.html)

Linux sysfs maps small attributes to callbacks and treats their published formats as interfaces. Prefer a simple typed value or tuple onchain, with text/JSON rendering in the SDK, rather than making every contract format and parse text. 9P separately identifies session handles, server objects and attachment/authentication: a pathname or handle does not itself grant write authority. [Linux sysfs](https://docs.kernel.org/filesystems/sysfs.html), [9P introduction](https://9p.io/magic/man2html/5/intro)

Existing EFS [[../Designs/efsv2/mountable-filesystem-semantics|mount/Lens work]] already uses Plan9 as precedent. Keep EFS's stricter unknown/absence distinction: provider failure cannot silently reveal a lower-priority value as though the selected file did not exist. A new read-only live-file profile need not implement 9P, blocking streams, writable device files or a fourth host platform.

## Ethereum standards: adapters, not authority

- **Final ERC-4804** maps `web3://` URLs to read calls. **Draft ERC-6860** clarifies/corrects that format, including returned-byte handling. Pin an adapter version; do not silently mix their defaults. [ERC-4804](https://eips.ethereum.org/EIPS/eip-4804), [ERC-6860](https://eips.ethereum.org/EIPS/eip-6860)
- **Final ERC-5219** supplies an HTTP-like read-only resource request with status/body/headers and describes external-body locators. **Draft ERC-6944** connects that interface to a Web3 resolve mode. These are useful browser/resource adapters, not the minimal Solidity data API or proof of returned data. Existing EFS Files already proposes this adapter separation. [ERC-5219](https://eips.ethereum.org/EIPS/eip-5219), [ERC-6944](https://eips.ethereum.org/EIPS/eip-6944)
- An ordinary contract should use a structured read descriptor: selected chain/venue, exact target, bounded calldata/interface, return Type/representation, execution limits and provider-upgrade policy. Browser names/URLs can resolve to that descriptor; they are not silently re-resolved midway through a pinned read. URL `userinfo`/RPC `from` is not authentication. An onchain CALL/STATICCALL forwarding adapter becomes the target's immediate caller; client-side URL/name resolution does not. Declare and test the complete call context, including caller-dependent output.

Statuses checked against primary sources on September12. The ERC5219 interface was fetched directly after the web renderer rejected its Solidity MIME type; no modified interface is inferred from the URL examples.

## Boundaries that make this useful rather than misleading

1. **Descriptor identity is not value identity.** Hashing a fixed contract-read descriptor does not hash tomorrow's output. Immutable Records stay immutable. A live result carries its exact return shape and observation qualification; it is not automatically an admitted Record or an authored assertion by the namespace owner.
2. **Registration validation is not lifetime value validation.** Validate the returned canonical shape/constraints on each qualified read, or explicitly identify the trusted provider contract/profile that enforces them. Arbitrary type acceptance at admission remains a separate obligation; a live adapter cannot bypass it by relabelling output as admitted data.
3. **Read-only does not mean infallible or pure.** Use actual bounded `STATICCALL`, cap returndata before allocation/copy, require exact decoding and account for recursion/call gas. Static calls prohibit state writes but may read changing state, revert, exhaust their budget, depend on caller/context or observe an in-progress transaction. Do not execute a live provider as an automatic ingestion or index callback. [EIP-214](https://eips.ethereum.org/EIPS/eip-214)
4. **Separate RPC snapshots from onchain call state.** Browser multi-call reads pin a supported block-hash basis and execution parameters. Inside a paid transaction, the target can see earlier writes in that transaction; this is a call-state observation, not necessarily the final state of that block. An ordinary contract cannot request arbitrary historical state or synchronously call another chain. Historical replay needs retained state/provider support or a separately verified witness. [EIP-1898](https://eips.ethereum.org/EIPS/eip-1898)
5. **Provider identity includes its real execution policy.** A proxy's codehash alone does not pin its implementation or dependencies. Distinguish an exact frozen provider profile from explicitly following an upgrade-governed service. A reader must refuse unsupported shape/profile changes. Exporting a descriptor preserves the read recipe, not the ability to execute it after its chain/provider disappears. Snapshots can preserve particular observed values; another deployment or L2 is not automatically the same source merely because its code is similar. A correct reserve read is not thereby a manipulation-resistant financial oracle.
6. **No hidden indexing promise.** If values change without EFS writes, EFS's admission frontier/change feed cannot automatically track those changes. Descriptor/name/tag membership may be complete while a filter over live values is partial or unknown. Such filters need bounded same-basis evaluation or an independently covered provider-state index. Optional caching/indexing must not create a mandatory second write merely to emulate storage semantics.
7. **A failed read is not an empty file.** Missing content, unsupported backing/chain, malformed bytes, provider refusal and resource limits stay distinct. A legitimate zero value or empty payload remains valid. Directory enumeration of descriptors is different from successful evaluation of every live child. Host range reads need one pinned result or explicit streaming coherence, not concatenated samples from different states.
8. **Mounting is not granting authority or privacy.** First prototype is read-only. Future writes require explicit method/arguments, actual application authorization and transaction consent; no generic file write grants arbitrary calls. Rendering executable HTML is a separate sandbox decision. A private workspace namespace does not conceal public chain state.

## Decisive bounded prototype

Use a small quote/reserves provider and an immutable, exact-read adapter. Mount one live value beside one ordinary stored file and one external-content descriptor. No URL parser, proxy-following policy, cross-chain call or writable virtual device in the first slice.

Compare **normal app update + duplicate EFS publication** against **normal app update + no EFS publication**, then include the respective real paid readers. Register the live descriptor only once. Check both browser and unrelated contract consumption through the same declared adapter/caller context; compare after a confirmed update and demonstrate same-transaction update→read separately. Retain all registration/deployment/read/snapshot costs, not just a zero EFS-write counter.

Attack wrong Type/length, empty/zero success, large returndata, revert/budget exhaustion, caller-sensitive getters, missing/substituted provider, partial transaction observation, stale/reorged browser basis and unsupported external backing. Mutate the provider between browser reads: pinned results must stay coherent; fresh Live reads may change. Changing the provider alone must not silently advance EFS revision history or make a live-value filter claim COMPLETE. Snapshot/export preserves a labelled observation, not every past value.

This experiment is a high-leverage follow-up to the active [[2026-09-11-efs21-overnight|cost work]]. It does not interrupt the currently owned compiler/receipt gate or select permanent bytes. Candidate implementation belongs in the existing disposable profile/adapter layer; its result will determine whether any generic Core extension is actually needed.

The source-grounded [[2026-09-12-efs21-live-files-plan|implementation plan]] uses existing native Record/Files contracts unchanged, with a distinct descriptor Type and separate read adapter. It is independently reviewed and staged, not dispatched; raw-byte admission alone does not validate descriptor semantics.

Independent design/source review approved after clarifying that URL resolution is not an onchain forwarding caller. Root checked the original Plan9 paper, sysfs/9P references, primary ERC status/text, actual ERC5219 interface, and EVM static-call/block-basis specifications. No virtual-file implementation, savings measurement, protocol adoption or production deployment is claimed.
