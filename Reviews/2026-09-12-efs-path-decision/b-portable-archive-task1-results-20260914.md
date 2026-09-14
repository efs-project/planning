# Portable signed claims: the first implementation works

**Status:** disposable implementation and Task1 review passed; paid archive
costs and Task2 representation selection remain unmeasured. No Core, permanent
Type or production decision changed.

The [[b-portable-evidence-seam-20260914|separate signed-claim archive]] now
retains an author's exact signature and full ordered action vector without
replaying old commands or asking that author to authorize the destination.
Anyone can attach missing bytes whose Type-qualified identity matches a
record-bearing signed leaf. Availability is tracked per claim; a missing body
is not silently promoted to present because another claim cached it.

The joined test demonstrates all three motivating cases against the real lab
Ledger: a destination's changed head makes old CAS replay fail but does not
block archival; current policy rejection leaves archived evidence readable;
and one available file body can be recovered while an unrelated body is
explicitly unavailable. Ordinary destination publication still checks today's
rules and attributes the publication to its actual caller. Archival does not
change that caller into the source author.

## Evidence

- Root observed successful compilation followed by the intended RED assertion,
  then **93/93 full B tests passed**, including14 new archive tests, no skips.
- Tests cover signature/vector tampering, expired signatures, bounds, empty
  bodies, conflicting same-nonce claims, immutable retries, sparse attachment,
  cache/coverage separation and per-leaf discovery.
- Archive runtime6,098bytes and initcode6,299bytes fit ordinary limits. Existing
  warnings and test-harness size warnings are retained, not presented as clean
  production builds. No cost is inferred from Forge test gas.
- Independent Task1 review: PASS/Approved, no actionable findings. Source,
  reports, stub, compiled artifact and review are retained with raw/compressed
  hashes in the [published evidence packet](https://github.com/efs-project/planning/tree/0d28b0f6b9ccd92a9139cbe2f3635ff4b1a46b0f/Reviews/2026-09-12-efs-path-decision/lab-b/archive-task1-20260914).
  Implementation source is `02c34a94f62f76df981237f6973bda6867063b3b`.

## Still not proved

An authentic signed claim is **not** proof that a source chain admitted it, that
a Type is valid, or that a destination must accept it. Historical native/
contract-account source proof remains unsupported. All signed action tuples
must survive; sparse body recovery is not sparse action-vector recovery.

Next: compare packed rows with immutable code vectors on the predeclared
1/2/64-action workload, charging retention and paid reads. That reversible
representation choice does not alter these semantic/proof limits.
