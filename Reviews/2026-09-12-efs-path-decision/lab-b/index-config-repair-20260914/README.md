# Required index declarations cannot silently change

September 14. The approved compact-B repair freezes mandatory declarations in
the constructors of these reviewed direct-deployed modules. An optional setter
can no longer replace a required family/start, and an internal runtime helper
cannot add or promote a mandatory family. Optional declarations, normal
processing, occurrence-related counts and cursor generation remain mutable.

Source commit: `30073fcdeedfdc24a4d54004afc209ab9c8b8773` (root-reported exact
four-file commit). The implementation change after actual RED is only two
conditions and lifecycle comments inside `IndexModule._declare`; the new error
was already declared without enforcement during RED. Ledger, Interfaces, intent
encoding, the corrected Files consumer and withdrawal tests were not changed.

The old address/code-hash blind spot is closed **only through constructor-fixed
required declarations in these reviewed direct modules**. It is not a claim that
codehash commits arbitrary mutable storage. Replacing the attached module changes
the existing obligation and requires a fresh signature. No execution-time
configuration getter or schema change was added.

## Actual evidence

- Initial `index-config-repair-red` compiled but selected **zero tests**. Its
  successful child exit is explicitly **not RED or GREEN**; its complete original
  report/log are retained. Root corrected only harness selectors before retrying.
- `index-config-repair-red-2`, 12:28:55.433–12:29:14.069 UTC, compiled at input
  `1433275f55abdc42bbd29ac9e03a950ec8fdc6a6f1cb2bb20b21d58f68168013` and ran
  exactly **7 cases: 4 PASS controls, 3 intended refusal failures, 0 skipped**.
- Guard-only GREEN/full input
  `62e1f17ff2d3a042078063cab0ca158a40e0e97ef00e686ffcad168ddea67cf9`,
  12:32:18.781–12:33:11.469 UTC, passed **162 executions: 128 distinct named
  cases plus 34 inherited repeats**, zero failures/skips. The 17 base Files
  cases also execute in each of two derived suites. All seven targeted cases
  appear in the full log; their assertions are unchanged from actual RED.
- The normal-size gate, 12:34:35.550–12:35:28.084 UTC, succeeded at the same GREEN
  input. All gates record owned-process stop and slot release.
- Complete independent final review: **SpecCompliant / QualityApproved**, no
  identified Critical, Important or actionable Minor repair issue. Review SHA256:
  `27dc27a3d9c5ce43030aef130ee5159b0f903d5810a23f2ce0a540c0b14a200e`.

Solidity 0.8.30 / optimizer200 / viaIR / Cancun compiled sizes:

| Component | Runtime bytes | Compiler initcode bytes |
| --- | ---: | ---: |
| IndexModule | 4,179 | 6,021 |
| SelectiveReferenceIndexModule | 5,240 | 8,515 |
| FilesParentIndex | 5,339 | 9,325 |
| FilesJoinedConsumer | 15,865 | 19,976 |
| Ledger | 17,280 | 17,670 |

Constructor arguments are excluded from compiled initcode. Existing compiler
warnings and oversized test-harness warnings remain visible. Neither these
lengths nor test gas are new paid outer-transaction prices.

## Retained packet

`manifest.json` records the exact inventory and both raw/gzip SHA256 hashes for
**26 payloads: 42,706,067 raw bytes → 5,548,296 gzip bytes**, excluding this README
and manifest. All compressed payloads were decompressed and compared byte-for-byte.

Included: four complete original gate reports/logs (including the zero-test
attempt); actual RED2 and normal-size full compiler input/output; RED/GREEN Index
copies; unchanged three test files; frozen configuration; full RED2/GREEN UTF-8
source inventories containing all 47 source/config/script files; approved plan;
complete implementer report and independent review; original finding and bounded
remedy review; mechanical retention generator. The outer harness and its test
source are separately labeled **at retention**, not misrepresented as pinned
bytes for every historical attempt. Original gate arguments remain in reports.

The packager verifies frozen inventories, compiler source bytes/settings/sizes,
actual RED/full case counts, unchanged test/consumer/withdrawal pins, only-Index
RED-to-GREEN change, full/size identity, and cleanup. It runs no compiler, Forge,
RPC, Git, or paid experiment. The old paid/query/archive packets are untouched.

## Still not promised

Configuration identity is not COMPLETE-at-write. The actual Files gap control
detaches the module, admits a real signed write, reattaches and processes another
write. The same configuration honestly remains PARTIAL; folder reading refuses
`E_INCOMPLETE` while exact retained bytes/tags remain readable at a fresh basis.
Read qualifications remain necessary; a write-time completeness precondition is
a separate design choice.

This is not proxy-initialization guidance, a permanent upgrade/configuration
policy, optional backfill, arbitrary callback/reentrancy safety, authenticated
state proof, native historical portability, or full EFS readiness. Future
same-address mutable settings may need a separately reviewed semantic commitment
and epoch. **There are no new paid costs here:** prior paid results remain tied
to their original implementation and cannot be silently repriced by this repair.
