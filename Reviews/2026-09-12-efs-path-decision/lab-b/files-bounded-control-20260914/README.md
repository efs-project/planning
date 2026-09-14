# B bounded parent-read control — September 14

**Standing:** six test-only controls pass, independently reviewed. No Core or
acceptance-budget change, paid transaction measurement, stable public layout,
or complete Files workflow is claimed.

The original diagnostic remains in `../files-parent-budget-20260914/`:
full-body reads of a cold 8,192-byte parent reject a valid child under the
300,000-gas validator budget; warm large and cold small parents accept.

This control reads only the parent's exact Type, masked body length and File-ID
word through the existing `Ledger.extsload`. The valid cold large parent now
accepts and indexes its child. Wrong-File and one-byte padded-body cases still
reject with the tested nonce/count/Record/posting rollback. Storage layout is
explicitly pinned to the disposable B Ledger; this is not a proposed SDK API.

RED compiled successfully: five controls passed and the valid positive control
failed against the false acceptor stub. GREEN: all six controls pass inside
the full 102/102 B suite. Executable test bodies were unchanged; one explanatory
comment changed, as disclosed by the independent review. No compiler or chain
was rerun to package these results.

`manifest.json` records every compressed file's raw and retained SHA-256 and
byte count. The packet retains original RED/GREEN reports, complete logs, exact
test sources and independent review. Gzip decompression was compared byte for
byte with the originals. Source-only next work is an actual joined FileRevision
profile and head-first revision-tag query, not repetition of this diagnostic.
