# Fresh 1,000-File eight-author full traversal after SDK decode-once change

**Result: COMPLETE in a bounded read-only Node child.** On a new disposable loopback-Anvil fixture, the SDK traversed all **1,001 / 1,001** raw eight-author placement candidates in **32 budget-32 pages** and returned all **500** expected selected-revision-tagged File IDs. The final page reported `COMPLETE`; every returned ID, name, header, revision tag and match was checked. This closes the *local Node full-cold-traversal* gap left by the [prior partial stop](../child-full-1000/README.md). It does not yet establish actual-browser RSS, public-RPC latency/fees, or an autonomous onchain 1,000-File consumer.

The [fixture runner](../../script/measure-gallery-authors.mjs) seeded 1,000 distinct live Files. Eight signers authored 125 folder placements each, with a second signer adding one same-name overlay and competing HEAD on File 0. Alice authored the initial HEADs and selected-revision tags on even Files. The [read-only child](../../script/measure-gallery-authors-child.mjs) created one SDK instance and pinned basis, then performed one full cold traversal with `tagScope=revision`, `policy=ordered`, budget 32 and no body fetch. There was no warm pass or paid full traversal.

| Observed local measure | Result |
|---|---:|
| SDK pin | 68.0 ms; 95 logical/HTTP RPCs; 337,656 response bytes |
| Full traversal pages | 32; 1,001 scanned; 500 qualified rows; 104 logical/HTTP RPCs; 1,575,548 response bytes; 485 ms summed page latency |
| Total child transport | 199 logical/HTTP RPCs; 1,913,204 response bytes |
| Node memory | Child peak 281.2 MiB; maximum observed parent+child 451.1 MiB; child cache 1,897,064 bytes at terminal page |
| Setup and safety | 353 signed transactions; 1,475,907,928 setup gas; 13.5 s; Anvil RSS 177.4 MiB; scratch output 9.6 MiB |

These values remained under the original 768 MiB combined Node, 1,536 MiB Anvil, 256 MiB output, 650-transaction and 15-minute caps. The supervisor kept a 128 MiB headroom stop while the child ran; it did not fire. The full [measurement JSON](measurement.json) retains per-page RSS, heap/external, cache size, RPC/HTTP counts, response bytes, latency, coverage and exact source/artifact pins. The [manifest](manifest.json) and [signed transaction/receipt log](transactions.jsonl.gz) preserve the deployed fixture and setup execution.

The focused [SDK change](../../browser/compact-sdk.mjs) returns the ABI `Result` already decoded and validated inside the raw-cache validator, rather than decoding the same raw response a second time. Raw-only cache storage and per-caller decoded Results remain intact; a [regression test](../../browser/compact-sdk-decode-once.test.mjs) first failed on the duplicate decode, then passed with miss/hit/inflight caller isolation and corrupt-raw rejection. Fifty-four targeted SDK/cache tests and ten adjacent Node browser-unit tests passed.

The prior partial run used SDK hash `0x6f362f40909b7335d9c5002c463d53495ff823a986e64d302ea88246605049d3` and the earlier IndexWork source hash `0x62960f1d86ab4c8db13f33764dedef9ad84747175aaa4a264524e37630fe244e`. This complete run used SDK hash `0xa0a8f49bb8105d975fe35a4b1f381cf768a7c615d72b4c4dcb4e82662ade2233` and committed IndexWork hash `0x8a780c34d3e98f67bafebc3ecb678c99c7f3fe843cf80b35b217ed9d198d3fe1` (Git `7ac00ae`). The same fixture counts and page response shapes were observed, and the much lower RSS is consistent with removal of redundant decode allocations; **the between-run comparison is not a strict single-variable experiment** because the index-work bytecode/profile also changed. The exact unchanged runner and child source hashes were `0xb55b00652399ba1d73853d7a0bff4d4d747fc92e39b57d625f1c63a1ae23ed5c` and `0x21ae51bb06c1b98198b85eda6e3c1553a64b15b797dc1e555bdc93cf64f77345`.

Artifacts were rebuilt offline with solc 0.8.30 in isolated scratch output. Source pins matched before the run; local scratch paths were removed from this committed report copy. No push or protocol adoption follows from this measurement.
