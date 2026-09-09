# Guest Files: real browser checkpoint

**Status:** corrected local prototype; independent re-review approved at `48338b0`.
No public deployment, main merge, production SDK adoption or full v1 parity.

Implementation `200890c`; corrected explanations `48338b0`. The runtime imports
the published bounded reader unchanged. A finite loopback fixture hosts static
SPA assets plus a bounded read-only relay. Fixture publication and the complete
independent reconstruction oracle remain Node-side and outside the browser's
read path and timers. The server never supplies a precomputed file tree.

## What now works visibly

- Guest opens real metadata listings with no wallet/submitter access.
- A first, B first and Both agree match independent reconstruction at seven
  explicitly pinned observations: agreement, only-A claim, disagreement,
  old-name mask, retraction, malformed selected claim and upgraded U2 host.
- Four positions arrive as PARTIAL; continuation earns terminal enumeration.
  Conflict and unresolved positions remain inspectable without a losing
  claimant's name, icon, preview or action target.
- Lens/observation changes immediately clear prior rows and explanation;
  delayed old work cannot repopulate the new context.
- Missing selected Entry evidence remains unresolved. Failed continuation
  retains only labeled prior sealed rows, never a stale COMPLETE result.
- A drawer opened while a page is pending closes when that observation
  changes. Its lazy raw evidence belongs to one immutable snapshot, with an
  exact attempt count. Technical IDs start collapsed below the plain result.
- Keyboard Load more transfers focus to the first newly displayed position;
  Escape restores the explanation opener. At 320/390 px explanations remain
  reachable without page overflow. The 200% text check proves that 16px row
  text becomes 32px and 14px labels become 28px, rather than merely changing
  a root style while leaving fixed-size text unchanged.

The titles `trip`, A and B are fixture labels. A claim source is not the File
publisher and does not prove a personal signature. These are metadata reads,
not FileRevision/head/content retrieval or a FilesRouter validation receipt.
Prepublished layouts are separate fixture admissions, not executable UI
rename/remove or proof of atomic Files operations.

## Review-driven corrections

Initial independent review found no Critical issue and two Important issues:
the open drawer could keep old presentation while lazily reading newer
evidence, and exact IDs dominated the primary phone explanation. Both were
reproduced with failing regressions before the follow-on fix. Original
[200890c evidence](evidence/200890c/browser.json) and screenshots are retained
in their own subdirectory; they are not the corrected acceptance artifact.

Separately, main's visual/test inspection caught a weak text-enlargement
check. It was strengthened to assert computed font sizes, failed at 16px
versus 32px, and passed after changing text sizes to relative units. No reader
or contract behavior was changed to satisfy a UI test.

Final independent re-review found no remaining Critical, Important or Minor
issue in the fix range, and freshly passed the comprehensive browser test plus
three transport/server tests (**4/4**, about 21.5 s). Parent separately passed
the corrected browser export in 21.498 s and the three server/transport tests.
Main inspected the retained desktop and phone screenshots. No public or
production readiness claim follows from those checks.

## Measured browser cost

[Corrected evidence](evidence/browser.json) pins every screen source at
`48338b0`, the unchanged reader/compiler/deployment resources, all six browser
samples and all seven tested observation bases. All source hashes were checked
against disk after export. [Desktop](evidence/desktop.png) and
[phone explanation](evidence/phone.png) are real Chromium screenshots.

| Phase | 0ms injected delay, median | 50ms injected delay, median | RPC requests | JSON-result bytes |
| --- | --- | --- | --- | --- |
| Fresh navigation through first four visible positions | 126.4 ms | 2,158.0 ms | 94 | 333,754 |
| Next four positions, terminal enumeration | 57.0 ms | 533.0 ms | 34 | 23,860 |

Three fresh browser contexts per arm; one Chromium process, version
148.0.7778.96, normal-limit managed local EVM. Both arms use exactly the same
eight-name/two-File agreeing dataset and pinned U1 observation after U2 has
been installed. Each context starts with no application cache and no-store
HTTP responses. Timing starts before navigation and includes module/config
delivery and DOM-visible results; it is not physical paint, browser-process
cold start, physical-phone speed, WAN bandwidth, finality or an SLA.

Browser Resource Timing reports **1,489,527 non-RPC payload bytes** for the
corrected first load (1,492,527 transferSize bytes including its reported HTTP
overhead), separate from the RPC-result counts above. This includes the
1,009,035-byte unminified installed ethers module and 414,216-byte `/config`
payload. Local loopback delivery is fast; a bandwidth-limited network may not
be. Production bundling and qualification/config reuse need their own design
and matched measurements. No dependency or trust check was removed here.

Zero page errors, external requests and instrumented wallet accesses in the
tested journeys. The relay exposes no browser publication endpoint. This is
guest evidence, not proof of real-wallet prompt counts for writes.

## Scope and remaining work

This completes the bounded guest-screen portion of the
[consumer card](../2026-09-09-v1-parity-overnight/consumer-build-card.md), not
its onchain Files-operation or independent Solidity Files-consumer joins.
The [larger-folder pressure](../2026-09-09-files-reader-scale/README.md) exposes
a concrete read-lifecycle limit; the eight-name screen does not establish
large-directory support. File contents, creation/edit/rename/move/remove/
restore, current tags/filters, nested navigation and real wallet consent
remain visibly unconnected. The two remove/retract cards are explanations,
not executable actions.

## Reproduction

Use the existing installed dependencies; no scaffold, package or lock changes.
The live commands require the upgrade foundation's ignored Forge artifacts.
Build them once with the pinned, installed offline toolchain before a fresh
checkout's first run; the server/transport unit tests do not need them.

```sh
node --input-type=module -e "import {compileUpgrade} from './Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs'; compileUpgrade();"
node --test Reviews/2026-09-09-files-screen/test/server.test.mjs Reviews/2026-09-09-files-screen/test/transport.test.mjs
# Set EFS_LAB_CHROMIUM to an installed compatible Chromium executable if the
# Playwright package's default browser revision is not available locally.
node --test Reviews/2026-09-09-files-screen/test/files-screen.browser.mjs
node Reviews/2026-09-09-files-screen/scripts/serve.mjs
```

The last command publishes the local fixture and prints one loopback URL,
then expires after four minutes. `EFS_FILES_SCREEN_DELAY=50` injects 50 ms
before each RPC. No public deployment or durable data is created. The existing
managed-chain five-minute watchdog and normal EVM limits remain unchanged.
Tests close their browser/HTTP/chain resources. No visible overnight browser
handoff was opened while the user was away.

The optional `EFS_FILES_SCREEN_EVIDENCE=1` exporter writes screenshots and
JSON under `evidence/`; preserve existing results or use a fresh disposable
copy before exporting. Ordinary regression runs do not overwrite evidence.
