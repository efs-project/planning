# MVP rehearsal progress

Plan: [README.md](README.md). Start: `35113aa`.

## Decisions and coordination

- Use the already authorized isolated experiment for the whole product rehearsal.
  The latest direct user request extends disposable scope to browser/SDK/Arcade
  prototypes. No repeated authorization request is needed.
- Preserve published branch history by merging fetched main. Resolved the two
  append-only conflicts by retaining both review links and status histories.
- Keep the workflow lab separately named from full C0. This gives early real
  contract/UI evidence while the full Type/index/genesis implementation remains
  independently measurable. Cost if wrong: the lab may require replacement;
  no permanent data or compatibility promise depends on it.
- Parallel lanes own disjoint paths. The controller owns integration, local
  server, final verification and source-spine updates. Reviews follow the
  integrated result. No worker commits or changes shared bookkeeping.

| Task | Producer / consumer boundary | State |
|---|---|---|
| Contracts | Versioned lab ABI, events and retained state -> SDK and independent reader | 24 Solidity tests + 128 fuzz cases; review fixes closed |
| SDK | five-seam client API -> browser; raw ABI -> Solidity consumer | real integration, typed consumer; review fixes closed |
| Browser | injected SDK -> Files/data views and explicit sandboxed game | 8 Chromium journeys; lifecycle/qualification hardening |
| C0 input/blueprint | current C0 sources -> next real implementation tickets | delivered; full C0 remains separate work |
| Integration | actual local contracts + SDK + browser -> observed evidence | 42 Node tests + strict TypeScript + 9 measurements |

Each producer must publish its interface before its dependent implementation
starts. Shared package configuration is controller-owned. Prototype pass labels
must not overwrite any of the nine C0 M0 NOT_RUN rows.

## Findings caught and repaired

- Solidity tuple decoding lost named members at the SDK boundary. Decode by
  ABI parameter shape, including unnamed multi-return tuples; joined tests now
  cover real state rather than object mocks alone.
- Read-back previously excluded failed/unknown authority checks from its
  canonical-success predicate. Retain observed state separately; require
  recovered authority for `COMMITTED`. Missing direct transaction bodies and
  contradictory relayed signers now have negative tests and independent closure.
- The first browser test reused an earlier Saved status while a new session
  setup was pending. Wait for operation completion; UI now marks new work
  immediately. The real tests also use unambiguous cell selectors.
- Async Play needed cancellation across pending reads, not just iframe removal.
  Generation-based invalidation and contradictory-basis/qualification cases
  now cover Stop, navigation, superseded Play and late provider rejection.
- Add anti-framing headers to the loopback host and reject wrong Host/origin,
  signer, target, method/channel, value and oversized input before provider use.
- Remove formatter-sensitive nested authorization dispatch and test every
  least-privilege operation-mask bit. A copied formatted tree passes the same
  Solidity suite; no formatter is run on security-sensitive source by default.
- A compiled TypeScript example caught a plain-string/Hex mismatch; the public
  sample and read-back discriminated interface now pass strict compilation.
- The Data Explorer PM found missing descriptor-ID recomputation. Both exact
  schema reads and typed validation now reject a valid-shaped substituted
  descriptor while preserving its raw bytes; the regression and independent
  SDK-review follow-up pass.

## Review and evidence disposition

Independent contract and SDK reviewers closed their Important findings after
source/test deltas. Browser/server review fixes were checked in the final
joined run; [browser review](browser-review.md) records its bounded closure.
[SDK review](sdk-review.md) retains original findings and resolution.
The contract report retains earlier measurements chronologically and its
latest hardening snapshot. Final run totals are in the README, not sums of
earlier and later runs. No failed draft screenshot is published as a success.

Remaining engineering is in [build-readiness.md](build-readiness.md). SDK,
Web Client / OS, Data Explorer and Arcade PMs returned bounded read-only
[consumer handoffs](pm-handoff.md). No new agent task or product repository was created, and
no review was interpreted as main-merge authority.

## 2026-09-04 workflow extension

James requested fleshing out the prototype. Three disjoint agents implemented
Files, Data and Arcade controllers; v2 PM joined them through a native-module
shell, real seeded contract state, pinned routes, responsive styling and browser
fault injection. [Extension results](extension-results.md) record 24 Solidity,
95 Node, strict TypeScript, 8 original plus 19 extended EVM/browser journeys and
9 separate mock-SDK browser regressions. Independent review closed Record-ID
substitution, pre-submit cancellation, skip-link and full-basis findings.
No Core/SDK wire or product-repo change. All nine C0 M0 rows remain NOT_RUN.
