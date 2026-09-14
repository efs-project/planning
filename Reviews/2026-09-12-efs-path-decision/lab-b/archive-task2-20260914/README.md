# Signed-claim archive representation comparison — September 14

**Standing:** complete disposable comparison; task and final reviews approve
prototype publication. **Keep packed** under the rule chosen before measuring.
This is not source-admission proof, ordinary file-creation pricing or production
adoption. Task1's semantic packet is in `../archive-task1-20260914/`.

| Whole receipt gas | Packed rows | Immutable code vector |
| --- | ---: | ---: |
| Retain 1-action claim | 429,833 | 456,481 |
| Retain 2-action claim | 578,709 | 585,046 |
| Retain 64-action claim | 9,817,718 | 8,571,876 |
| Paid first action read | 50,726 | 36,787 |
| Paid last action read, N2/N64 | 50,738 | 36,799 |
| Archive deployment | 1,387,764 | 1,423,208 |

N1 has two distinct paid transactions for its one leaf, both at the first-read
figures. The consumer deploys for 195,652 gas. Archive runtimes are 6,160 and
6,324 bytes; consumer 658 bytes. Actual code-vector sizes are 353, 641 and
18,497 bytes, under the ordinary runtime limit. No consumer overhead is
subtracted; deployment is separate from retention/read costs.

The predeclared rule requires strictly cheaper retention at **both N2 and N64**.
Code storage loses N2 by 6,337 gas, although it saves 1,245,842 at N64 and 13,939
on each paid action read. That is a disclosed tradeoff, not a universal winner.
The already-packed alias stays unchanged. The fixture retains exact signed
synthetic PUBLISH-only vectors with no bodies; it does not price attached body
recovery, destination admission or the three-action joined recovery test.

## Evidence

One private Cancun Anvil run, chain31337, normal 30M block/runtime/init limits,
finite history and owned cache. All 21 transactions and six same-base branches
were captured before branch restore; source, compiler input/output, runtime,
signed envelopes, receipts/logs/headers and all named getter results are retained.
The node stopped and slot released at 10:10:33 UTC; no measurement retry.

Full B suite: 102/102 including 17 archive tests; compiling behavioral RED and
GREEN logs are retained. Tests also compare rich nonzero 1/2/64 tuples, coverage,
postings, empty bodies and retry no-writes/no-redeployment. The codeblob unknown-
kind tuple regression case remains a minor gap; current support is source-
reviewed, not separately tested for that representation. Intentional test lint
and oversized Forge-only harness warnings remain disclosed in the reviews.

`manifest.json` gives raw/gzip SHA-256 and size for every file. The raw packet
hash is `87e0c642e9d2a923f01c9e2bbc57e28b4a553822c046bdbd98d6457a5c8a3177`.
Root's independent audit recomputes the claim fixtures and checks transaction,
RPC, code, getter and compiler joins; six corrupt-packet variants reject. This
is **OWNED_LOCAL_RPC_OBSERVATION_NOT_STATE_PROOF**. Fabricating a mutually
consistent transcript is not ruled out by transcript consistency checks.

The exact measured runner is retained separately. Commit `08a4d0e` only removes
two trailing comment spaces after measurement; its hash is not substituted for
the measured runner hash. The archive, tests and consumer are unchanged from
the successful semantic/size/paid source pin. Complete compiler input/output is
retained so provenance does not depend on the temporary build directory.

## Offline audit after moving the packet

Decompress `paid-raw.json.gz`, `compiler-build-info.json.gz`, and
`root-audit.mjs.gz` into a fresh directory. With an existing ethers6 installation,
set `EFS_ETHERS_PATH` to its absolute directory and `EFS_ARCHIVE_BUILD_INFO` to
the decompressed compiler JSON; run Node on the auditor with the decompressed
raw packet path and optional new output path. It imports no runner code and
makes no network/chain/compiler calls. Original absolute paths inside the
evidence are provenance, not a requirement to restore that directory layout.
The archived negative-check script records the original run-local falsifiers;
its scratch paths need explicit adjustment to rerun elsewhere.
