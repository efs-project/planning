# C mandatory-rule repair: build and unit evidence

Disposable fresh-genesis experiment; no receipt cost or protocol adoption claim.

- Old source: `324e7c4ea3cad0ed294b0cf143743313ba405dbd`.
- Red test (before Core edits): two identity controls passed; the strict-rule /
  permissive-runtime declaration was accepted, producing the expected assertion
  failure. Test SHA256 `c68310f87e41c8c20cb60291a4b89cfa4c2f351061474b183d394916e1e94d97`;
  log SHA256 `fcba39fa2e753bdab6045117795f026398a67729a6d95b1ca6fcdf9bda978122`.
- A first attempt failed setup because artifact-only fixture actors were not
  imported; that is not semantic failure evidence. The explicit import fixed it.
- Repair: the Type body commits its mandatory runtime rule. Declaration checks
  the local runtime against it; all other ingestion still uses the existing
  reference and acceptance checks. Experimental Type-meta/acceptance tags `/2`;
  unchanged Types table layout, Record-ID formula and index obligations.
- Repaired run, September 13 before 10:08 UTC: **47/47 Forge tests** across eight
  suites. Green log SHA256
  `4c99499430968a1f0aea13a78259349230e12decf9dfc7f21daab8c83617514f`.
- Runtime/initcode sizes: Ledger 23,204/37,951 B; ImportLib 19,909/19,941 B;
  IndexModule 10,303/22,790 B; LensReader 10,585/10,843 B. All 99 emitted
  contract artifacts fit 24,576/49,152 B. This is not a block-gas-fit claim.
- Fresh immutable AST identities checked by variable name: IndexModule
  `3835=deployer,3837=poisonConcept`; Ledger
  `4429=index,4431=indexCodehash,4433=realmId`; LensReader
  `5090=ledger,5093=index`. Old range pins failed against the fresh artifacts
  before repinning. Node helper checks then passed **6/6**, with `FOUNDRY_OUT`
  pointing at the fresh output, not the existing `out` symlink.
- Environment: Forge 1.7.1; offline solc 0.8.30 (SHA256
  `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`),
  Cancun, optimizer 200, via-IR, two threads, metadata bytecode hash disabled;
  repaired compile included `--ast`. Node v24.11.0. No Anvil run.
- Run-owned scratch basename `efs-road-c-rule-20260913.zgtMgO`, 28 MB at
  release; 275 GiB free observed. Existing linked `out` and old evidence untouched.

New import tests distinguish substitution refusal, corrected same-rule imports,
and rejection of validly signed but never-source-admitted invalid data. Source
signature verification is not source admission proof. Additive Realm policy,
arbitrary mutable validator dependencies, normalization of equivalent ABI
encodings and relocation of signed declaration targets remain outside this
repair; the tests do not claim those capabilities. Independent Core source
review found no new mandatory-rule bypass. Full paid B/C comparison remains open.
