# Read-set evidence output — review fix 2

Input `f758a6f08aeff2b1bbca81f1cf11285a6e2794f4`. Original profile-qualification
P2 was accepted by re-review; this correction addresses the newly identified
default-test overwrite of committed, SHA-pinned evidence. Only the test's output
handling changes. SDK, browser adapter, Solidity, artifacts and paid runner are
unchanged; no build or paid matrix rerun was performed.

Ordinary actual-old test runs write `readset-profile.json.gz` inside their
existing run-specific temporary environment directory and report that path in
the test diagnostic. A durable output requires explicitly setting
`EFS_READSET_PROFILE_EVIDENCE_OUT` to a newly named path. Both paths use atomic
exclusive creation (`writeFile` with `flag: 'wx'`); an existing target causes
`EEXIST`, never replacement. A real-filesystem regression creates an explicit
packet, attempts replacement, and checks the original bytes survive.

## Evidence

- [Output regression RED](carrier-fix2-output-red.tap): 0/1 passed, expected
  `Missing expected rejection` against the extracted previous ordinary-write
  behavior. This touched only a newly created temporary control file, not any
  historical packet.
- [Default profile covering](carrier-fix2-profile-green.tap): **14/14 passed,
  zero skipped**, exit 0. Includes actual BASE old → new → old → new qualification,
  publication/archive/refusal/restoration and the exclusive-output regression.
- [Explicit existing-output refusal](carrier-fix2-existing-output.tap): selected
  actual-old fixture intentionally exits 1 with `EEXIST` at its explicitly
  supplied already-existing temporary output. Its five nested profile controls
  pass. This is the expected refusal, not a protocol regression. Both the
  existing temporary packet and committed original remain byte-identical.

Commands from the lab with existing ethers/Anvil and retained BASE/current
artifact paths set as in the task report:

```sh
node --test --test-reporter=tap --test-name-pattern='read-set evidence output' browser/readset-profile.test.mjs
node --test --test-reporter=tap --test-concurrency=1 browser/readset-profile.test.mjs
EFS_READSET_PROFILE_EVIDENCE_OUT=<already-existing-run-packet> node --test --test-reporter=tap --test-name-pattern='actual old browser transport' browser/readset-profile.test.mjs
```

Original tracked `carrier-fix1-mixed.json.gz` SHA256 before and after both checks:
`2634cdcb1188a9245f9d13b4671cbd2b1c38f734e0a383bab14ae12ffe515db6`.
Default-run temporary packet SHA256 before and after explicit refusal:
`4eadd1758d92ca04230642b2579cab966c76d464258971cf543d420537a15ba1`.
Its SDK/app pins remain those of fix 1; updated test pin is
`0x224466e6a0976a3af5edd50ff1267d1b71964f89fe9176b5c3216e07a1587f8b`.
All three pins were compared with disk. The packet retains 22 receipt summaries
and exact restoration. Its temporary path is in the covering transcript; it is
not substituted for or committed over the historical packet.

After default run and explicit refusal, `git status --porcelain=v1
--untracked-files=no -- core-closeout-sdk-20260915` was empty; the original
packet diff was empty. New transcripts and this note are separately named.
Controller-preserved rerun evidence in its ignored SDK workspace is untouched.
All fixture nodes close via the existing `t.after` path, including refusal.
No new claim changes the existing query failures, codec/downgrade limits,
paid-cost provenance, native-proof gap or independent review requirement.
