# Compact EFS paid-consumer parity evidence

Run September 13, 2026, 18:07:28–18:07:30 UTC. Source
`c5561e2b27c48ca2938695cce7784f1e78564116`; evidence-only retention follows
that source commit. Disposable local `RPC_OBSERVED` consistency evidence, not
authenticated state, matched mandatory-failure rollback, portable import,
full-Files qualification or architecture adoption.

`measure.json` contains the retained candidate transaction/RPC packet;
`independent-inputs/` was prepared before chain execution without reading
candidate fixture/result code. `controller/` and `independent-observations/`
retain the separately gated runtime and raw-state checks. `audit2.json` is
the corrected post-run exact-output/transaction audit; the original audit and
its result remain for history. `audit-red.mjs` demonstrated the metadata-link
omission, and `audit.mjs` adds decoded transaction data/destination/nonce
equalities and a regression refusal. Independent review checks controller
seals and packet linkages beyond the bounded audit script.

The eight receipt rows are Items/Pair 921,085; combined signed A1 1,614,408;
signed A2 658,950; native contract B1 796,542; paid point A/B 167,281/167,513;
paid one-entry list A/B 269,617/277,278. Four paid branches are alternatives
restored from the same post-B1 state, not one cumulative bill. Setup is
17,333,852 gas across 26 transactions including unused diagnostic contracts,
not a minimum production deployment. A1 is not an isolated placement price.

`verification/` preserves the initial seven expected failing regressions,
first GREEN's two test-only regressions, and corrected GREEN2: 59/59 Forge,
42/42 Node (that captured stage used Node 24; root also repeated on Node 26).
Compiler is Solidity 0.8.30/Cancun/via-IR/200. Paid execution used Node 26.0.0,
Anvil 1.7.1, chain31337, 30M block gas and prune256. Consumer runtime17,781;
artifact creation18,218 plus192 constructor bytes gives full initcode18,410.
Oversize Foundry test harness is not a deployed production target. Existing
compiler lint/test-harness warnings remain visible in the raw logs.

All 38 compiled artifact hashes and source hashes were rechecked when retained;
bulky rebuildable artifacts and Anvil caches are not copied. Exact full expected
runtime/initcode bytes are in independent inputs. `SHA256.json` inventories the
byte-preserved copied files. Historical absolute local paths in generated
scripts/manifests/reviews are retained deliberately; rerunning elsewhere needs
path remapping, dependencies and the pinned rebuild. The expired launch lease
must not be replayed. This is a saved experiment, not a portable turnkey runner.
