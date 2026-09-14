# Signed-claim archive: Task 1 evidence

Code: `02c34a9` (only the new archive and its tests); prior Ledger/Keys/Core
unchanged. Complete input manifests are in the run JSONs; the RED-only stub is
retained so the before/after test can be inspected without guessing its source.

Root observed successful compilation followed by the expected joined-test RED,
then **93/93 full B tests passed**, including14 archive tests, with no failures
or skips. The compiled archive has6,098-byte runtime and6,299-byte initcode.
Independent Task1 review: PASS/Approved, no actionable findings. Existing
compiler/lint warnings and oversized test harnesses remain visible in the logs;
the actual archive is within ordinary size limits.

`manifest.json` pins nine gzip payloads by raw and compressed SHA-256/length.
They retain RED/GREEN/size logs and reports, the temporary stub, the archive
compiled artifact and the original independent review. Reports contain local
scratch paths as provenance; the compressed contents do not depend on those
paths remaining present. This is build/test evidence, not a paid transaction
run or authenticated chain-state proof.

Earned boundary: an independently imported EOA signed claim can survive expired
authorization, diverged CAS, current destination rejection and missing unrelated
body bytes. The complete ordered signed action tuples are still required;
unavailable tuples, historical native-contract proof and source admission proof
remain unsupported. Destination publication is separately authorized and checked.

Packed-versus-codeblob representation and paid costs are Task2, unmeasured here.
