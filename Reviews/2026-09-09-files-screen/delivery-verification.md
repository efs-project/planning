# Same data, fewer HTTP bytes

**Status:** independently reviewed local serving experiment at `b115a63`;
not a WAN speedup, production server or directory-scalability result.

Optional gzip reduces the initial non-RPC body from **1,489,527 to 395,648
bytes (73.4%)** while decoding to exactly the same assets and configuration.
All 128 RPC reads and their 357,614 accepted JSON-result bytes stay unchanged.
The browser still performs all qualification and interpretation itself.

## Fresh retained comparison

[delivery.json](evidence/delivery.json) pins source `b115a63`, 13 source hashes,
the deployed compiler/runtime resources, full pinned basis, 12 browser samples
and ten direct byte-compared resources. Main checked all 13 source pins against
disk immediately after export. The eight-name/two-File dataset and independent
oracle are the existing guest-screen fixture; setup and oracle comparison are
outside the timed interval. Every arm matches its exact final inventory.

| Median phase | Identity, 0ms delay | Gzip, 0ms | Identity, 50ms | Gzip, 50ms |
| --- | --- | --- | --- | --- |
| Navigate to first four DOM-visible positions | 130.8 ms | 154.4 ms | 2,179.2 ms | 2,204.2 ms |
| Next four, terminal enumeration | 56.4 ms | 50.7 ms | 528.0 ms | 536.3 ms |

Three fresh no-store browser contexts per cell, with alternating arm order,
one Chromium 148.0.7778.96 process on loopback. Injection delays each RPC, not
HTTP asset delivery. These results show no material improvement in delayed-RPC
time; CPU compression/decompression also costs work. No network bandwidth
throttle, physical phone, browser-process cold start, real finality, percentile,
v1 fee/latency ratio or production SLA was measured.

Resource Timing body/transfer sizes are separate: identity reports 1,492,527
non-RPC transferSize bytes; gzip reports 398,648. The 50ms config includes one
extra decoded character. Compressed ethers is 261,639 B rather than 1,009,035 B;
config is 110,397 B rather than 414,216 B. No dependency was substituted or
configuration validation skipped. RPC compression was deliberately not tested.

## Checks and review

- Twelve acquisitions have the same request/parameter/result-length multiset,
  pinned canonical block hash and independent final rows. No receipt/oracle tree
  is served as the browser listing.
- Every browser-loaded non-RPC resource is directly byte-compared after
  decompression outside the timer. Matching lengths alone is not the evidence.
- Zero page errors, external requests or instrumented wallet access.
- Identity remains default. Only fixed successful GET bodies at least 1 KiB
  can use gzip. The browser still applies decoded-byte bounds. No settings
  endpoint, write method, broader filesystem path or new package was added.
- Unit RED/GREEN exposed and fixed the review's identity preference/refusal
  case. Independent re-review passed 4/4 server/transport tests (~114 ms), with
  no remaining blocking finding. This is bounded fixture behavior, not full
  HTTP-server conformance; see the [rule and source](delivery-plan.md).
- Main's original guest journey plus server/transport regression passed 5/5
  before the negotiation-only correction. After the correction, fresh units
  passed 4/4 and this full delivery export passed 1/1 in **24.799 s**, with zero
  failures/skips/cancellations.

## Reproduce

Use the [offline build and installed Chromium prerequisite](verification.md#reproduction).
Run without the evidence environment variable to avoid creating a new report:

```sh
node --test Reviews/2026-09-09-files-screen/test/delivery.browser.mjs
EFS_FILES_SCREEN_DELIVERY=gzip node Reviews/2026-09-09-files-screen/scripts/serve.mjs
```

`EFS_FILES_DELIVERY_EVIDENCE=1` uses exclusive creation for `evidence/delivery.json`;
it refuses to overwrite the retained comparison. Existing `evidence/browser.json`
and screenshots remain the original corrected UI checkpoint. This report
describes the exact `b115a63` screen, not a later presentation's byte count.
