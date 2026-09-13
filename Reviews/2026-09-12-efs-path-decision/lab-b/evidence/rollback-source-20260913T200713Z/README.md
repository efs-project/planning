# B rollback source/test evidence

Source `8ddd04cdb12506c663c421c3c588115ca38a93b5`. Root observed intended runtime
RED, then 4 focused / 63 full Forge tests and 42 Node tests passing, followed
by independent changed-range review. No Anvil or mined rollback run occurred.
Forge test gas includes fixture work and is not a product transaction price.

`SHA256.json` covers the twelve copied evidence files. No compiled caches or
node state are retained here. Absolute paths and expired launcher times are
historical provenance, not portable setup or permission to replay a lease.
Reproduction needs an explicitly owned fresh build/run and appropriate paths.

Raw `green-sizes.log` and `red-tracked.diff` contain original trailing whitespace
and are excluded from the otherwise passing whitespace check; their exact bytes
are preserved and hash-checked. Test-harness size/lint warnings are not erased.
The deployable fault fixture is separate from the oversized Foundry test class.

Next: independently pin constructors/runtimes (including inherited immutable
declarations), static/mined inputs and fixed-block pre/post state for the
matched paid control. Current source tests do not establish that later gate.
One nonblocking review suggestion is recorded in `source-review.md`: before
broader fixture reuse, add an A1 success case with a nonzero earlier HEAD-key
poison to protect selectivity against future broadening.
