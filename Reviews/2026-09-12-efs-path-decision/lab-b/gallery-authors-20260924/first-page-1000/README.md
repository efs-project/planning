# Fresh 1,000-File, eight-author first-page probe

**Scope:** One new disposable loopback-Anvil fixture, 1,000 distinct live File IDs, eight *actual* placement authors, one cold SDK first page and one signed paid-contract first page. This is deliberately **not** a full traversal, a warm-cache measurement, a paid continuation, a public-RPC SLA, or proof of complete 1,000-File gallery qualification. It follows the [100/250 full-traversal stop](../README.md) without relaxing that stop's 768 MiB Node RSS cap.

The runner's `--first-page-1000` mode gives each author 125 folder placements and signer 1 one additional same-name overlay on File 0. Alice authored the initial HEADs and positive selected-revision tags on even Files; signer 1 authored a competing untagged HEAD on File 0. The unused one-author directory is still created by the shared fixture bootstrap, but receives no File placements in this mode. All eight signers have successful placement transactions in the [signed transaction/receipt log](transactions.jsonl.gz).

| Measurement | Observed local result |
|---|---:|
| Seed | 1,000 File IDs; 1,001 eight-author raw placement candidates; 325 setup transactions; 1,475,902,336 setup gas |
| SDK pin | 46.6 ms; 95 logical/HTTP RPCs; 337,855 response bytes |
| SDK first page (`tagScope=revision`, budget 32) | 53.4 ms; 11 logical/HTTP RPCs; 95,691 response bytes; 32 scanned / 32 positive returned rows; `PARTIAL` with continuation |
| SDK returned-row qualification | All 32 names, headers and selected-revision tags `PRESENT`; all 32 matches `MATCH`; zero body bytes fetched |
| Paid wrapper first page (`tagScope=2`, budget 4) | `SUCCESS`, 1,009,029 gas; `Observed(scanned=4, rows=4, scanStatus=PARTIAL, completeFromOrigin=false, queryAbsent=false)` |
| Final resource checkpoint | 15.5 s; Node peak 328 MiB; Anvil RSS 172 MiB; run output 9.1 MiB; 355 total transactions |

The seed RSS trend was checked every 100 Files; its highest 1,000-File projection was 416 MiB, below the 768 MiB cap. Every actual checkpoint also stayed below the 1,536 MiB Anvil RSS, 256 MiB output, 15-minute and 650-transaction caps. The [measurement JSON](measurement.json) retains exact timings, RPC bytes, source/artifact hashes, query qualifications and checkpoints; the [manifest](manifest.json) and receipt log preserve local deployment and signed execution evidence. The runner source Keccak-256 for this run is `0xffda99f8778cda470544a3ce19aff65d543ba271728ee30b45616e7cbec66be9`.

The positive selected-revision paid page is **not** comparable as an identical query to the earlier 100/250 paid pages: those accidentally used the stable-File tag scope and returned zero rows. Their 973,682-gas first page is a negative-filter control, whereas this corrected positive first page used 1,009,029 gas. Neither isolated first-page result establishes later-page gas, total traversal cost, or whether an onchain consumer can autonomously paginate; the paid wrapper emits a digest, not a next cursor. The index reports `rawTotal=1001`, but only 32 candidates were actually scanned by the SDK here.

Artifacts came from an isolated offline solc 0.8.30 build whose source hashes still matched immediately before this run. The runner exited 0; the emitted event was decoded and required to show four positive rows. Machine-local scratch paths were removed from the committed report copy. No push or owner protocol choice follows from this probe.
