# Fresh 1,000-File eight-author full-traversal attempt: partial safety stop

**Result: PARTIAL, not complete.** A fresh disposable loopback-Anvil fixture contained 1,000 distinct live Files and 1,001 eight-author folder placements. One read-only child traversed 20 budget-32 SDK pages, scanning **640 / 1,001** raw placement candidates and returning **375** positively qualified selected-revision rows. Every returned File ID, name, header, revision tag and match was checked. Page 20 still reported `PARTIAL`; the runner stopped before page 21 at its 128 MiB combined-Node headroom threshold. The other **361 candidates were not scanned**, so this is not evidence of terminal coverage or all 500 expected tagged Files.

The [runner](../../script/measure-gallery-authors.mjs) seeded 1,000 File IDs. All eight signers authored 125 actual placements each; signer 1 added a same-name placement and competing HEAD for File 0. Alice authored initial HEADs and selected-revision tags on even Files. The unused one-author directory was created by fixture bootstrap but received no placements. The [read-only child](../../script/measure-gallery-authors-child.mjs) created one SDK instance, pinned one context, and requested full cold traversal with `tagScope=revision`, `policy=ordered` and budget 32. There was **no warm pass, paid full traversal, or content-body fetch**.

| Observed local measure | Result |
|---|---:|
| Completed prefix | 20 pages; 640 candidates; 375 qualified rows; 68 logical/HTTP RPCs; 1,161,276 response bytes; 467 ms summed page latency |
| First page | 32 candidates; 32 rows; 11 logical/HTTP RPCs; 95,676 response bytes; `PARTIAL` |
| Child RSS | 102 MiB after pin; 184 MiB page 1; 287 MiB page 3; 411 MiB page 11; 484 MiB page 20 |
| Child cache at page 20 | 1,494,984 bytes; heap ~31 MiB; external ~151 MiB |
| Stop | `COMBINED_NODE_RSS_HEADROOM_STOP`; child terminated before page 21; max observed parent+child RSS 643.4 MiB |
| Setup and resources | 353 signed transactions; 1,475,902,336 setup gas; 12.8 s total; Anvil ~169 MiB at seed completion; scratch output ~9.1 MiB at seed completion |

The supervisor's soft stop was 640 MiB combined Node RSS, leaving 128 MiB below the hard **768 MiB** cap for between-sample/page allocation. The observed combined peak was 643.4 MiB and never reached the hard cap. The original Anvil 1,536 MiB, output 256 MiB, 15-minute and 650-transaction caps were also not approached. The process exited nonzero **because the planned safety stop fired**, not because a page or qualification assertion failed. [Measurement JSON](measurement.json) preserves every completed page's RSS, heap, external, cache size, RPC/HTTP counts, bytes, source/artifact hashes and stop reason; the [manifest](manifest.json) and [signed transaction/receipt log](transactions.jsonl.gz) preserve the setup evidence.

The exact runner source Keccak-256 was `0xb55b00652399ba1d73853d7a0bff4d4d747fc92e39b57d625f1c63a1ae23ed5c`; the child source hash was `0x21ae51bb06c1b98198b85eda6e3c1553a64b15b797dc1e555bdc93cf64f77345`. The artifacts came from an isolated offline solc 0.8.30 build whose source pins matched immediately before this run. Machine-local scratch paths were removed from the committed report copy. This does **not** establish a browser 1,000-File full gallery or an autonomous onchain consumer; the earlier [positive paid first-page packet](../first-page-1000/README.md) measured only one paid page.
