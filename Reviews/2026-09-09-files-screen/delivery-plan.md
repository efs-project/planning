# Same-data HTTP delivery experiment

**Status:** bounded local-only experiment under the overnight prototype
authority. No dependency, client/reader logic, qualification, RPC envelope,
Core ABI, durable data or public hosting change is authorized here.

The corrected browser control transfers 1.49 MB of non-RPC decoded payload.
Possible remedies are ordinary HTTP compression, smaller dependency bundles,
or reuse of qualified configuration. Test compression first: it changes only
transport representation and does not require a new cache/trust contract or
build pipeline. Keep identity delivery as the default reproducible control.

1. Add failing tests for opt-in gzip of fixed GET assets and configuration,
   byte-exact decompression, explicit refusal/absence of gzip support, unchanged
   bounded RPC responses and unchanged security headers. Use installed Node
   zlib only. Keep the finite asset allowlist and loopback lifetime.
2. Implement gzip only for successful GET bodies of at least 1 KiB, with
   Accept-Encoding negotiation, Vary and exact transmitted Content-Length.
   No browser-triggered settings endpoint. Compression occurs server-side;
   readers still enforce decoded-byte limits.
3. In fresh Chromium contexts on the same deployed dataset and pinned basis,
   alternate identity/gzip order for three samples at each 0/50 ms RPC delay.
   Measure navigation-to-four-rows, continuation, encoded/decoded non-RPC
   bodies and RPC counts/bytes. Compare all final rows and exact basis to the
   independent oracle. Directly compare decoded assets/config between arms
   outside the timed interval. Zero wallet/external requests.
4. Retain a separate exclusive-create delivery artifact with source/resource
   pins. Do not overwrite the earlier UI evidence. Re-run the existing guest
   regression, obtain independent review, and checkpoint the experiment branch.

No bandwidth throttle is claimed. Browser timing on loopback may barely change
or worsen because compression/decompression costs CPU. Resource byte reduction
is not a measured WAN speedup, latency percentile or solution to the directory
read-lifetime/churn problem. The static server is a fixture, not a proposed
production web server or content-compression policy.

Review found an identity preference/refusal gap. Main reproduced it with
failing tests and now selects between the available identity/gzip variants;
neither acceptable produces a bodyless 406, including below-threshold assets
and the identity-only control. Independent scoped re-review passed 4/4 and
approved experiment-branch publication. The rule was checked against
[RFC 9110 section 12.5.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.3);
this is not a claim of full production HTTP-server conformance.
