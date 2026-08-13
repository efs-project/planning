# Recovered Claude memo — Firefox/Gecko sandbox iframe docs

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T05:01:07.805Z
**Claude task:** `ace89b7b69f932c6c`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3595
**Original result length:** 33549 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
I could not use WebSearch (the session's 200-search budget was already exhausted before I started), so everything below comes from direct WebFetch against known documentation, spec, and Bugzilla REST endpoints. Two sources were unreachable and are flagged: `support.mozilla.org` (returns a bot-challenge page to WebFetch) and `hacks.mozilla.org` (blocked by network policy).

---

# Firefox / Gecko documented behavior — `<iframe srcdoc sandbox="allow-scripts">` (opaque origin)

## 0. Baseline the whole matrix rests on

- **[spec]** The sandboxed origin browsing context flag "forces content into an opaque origin, thus preventing it from accessing other content from the same origin." Opaque origin = "An internal value, with no serialization it can be recreated from (it is serialized as `null`)… for which the only meaningful operation is testing for equality." — https://html.spec.whatwg.org/multipage/browsers.html
- **[MDN]** `allow-same-origin`: "If this token is not used, the resource is treated as being from a special origin that always fails the same-origin policy (potentially preventing access to data storage/cookies and some JavaScript APIs)." — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- **[MDN]** `srcdoc`: "This doc will have `about:srcdoc` as its location." and "The `about:srcdoc` page uses the embedding document's URL as its base URL when resolving any relative URLs." — same URL.
- **[MDN BCD]** Firefox-specific sandbox note on `allow-same-origin`: "Firefox blocks script execution without `allow-scripts` even if `allow-same-origin` is set." Token support in Firefox: `allow-scripts` ≤49, `allow-same-origin` ≤49, `allow-pointer-lock` ≤49, `allow-modals` 49, `allow-downloads` 82, `allow-presentation` 50, `allow-top-navigation-by-user-activation` 79, `allow-top-navigation-to-custom-protocols` 101, `allow-storage-access-by-user-activation` 65. — https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.sandbox.json

---

## 1. Process isolation — no Gecko equivalent of `IsolateSandboxedIframes` has shipped

**Fission / site isolation (what *is* documented):**
- **[vendor doc]** Firefox 95, released **2021-12-07**: "To better protect Firefox users against side-channel attacks such as Spectre, Site Isolation is now enabled for all Firefox 95 users." — https://www.firefox.com/en-US/firefox/95.0/releasenotes/
- **[vendor doc]** "Fission was released to desktop Firefox in version 95"; "pages and frames are executed in processes dedicated to their **origin**." — https://wiki.mozilla.org/Project_Fission
- **[vendor doc]** "Isolated web content processes are used to host web content with Fission which **can be attributed to a specific site**." Process selection at navigation is done by `ProcessIsolation.cpp`; initial tab/worker process selection by `E10SUtils.sys.mjs` ("will likely be removed and replaced with ProcessIsolation.cpp in the future"). — https://firefox-source-docs.mozilla.org/dom/ipc/process_model.html

**Sandboxed-iframe isolation status:**
- **[bug tracker]** **Bug 961689 "Process-isolated sandboxed iframes"** — Core :: DOM: Core & HTML, **status NEW**, P2 / S3, created **2014-01-20**, last changed **2024-12-31**. `depends_on: 961694, 879475, 907892, 1020135`; **`blocks: 1451850`** ("[meta] Project Fission"); `see_also: https://issues.chromium.org/issues/40082497`. Most recent substantive comment, continuation@gmail.com **2024-09-25**: *"Chromium has recently shipped this, looks like."* — https://bugzilla.mozilla.org/rest/bug/961689 and https://bugzilla.mozilla.org/rest/bug/961689/comment
- **[bug tracker]** Bug 961694 (NEW, 2014-01-20 → 2022-10-31): "Investigate if named and indexed access on cross-origin windows are an obstacle to process-isolated sandboxed iframes…" — a still-open prerequisite.
- **[bug tracker]** The only Bugzilla hits containing "IsolateSandboxedIframe" are **Chromium WPT imports, not Gecko implementation**: bug 1779372 "[wpt-sync] Sync PR 34829 - IsolateSandboxedIframe: Add document.baseURI regression test" (FIXED, milestone **106 Branch**) and bug 1719206 "[wpt-sync] Sync PR 29580 - [WIP] Implement sandboxed iframe isolation for fully-restricted sandboxes" (**RESOLVED INVALID**, 2021-07-05 → 2023-05-05). — https://bugzilla.mozilla.org/rest/bug?id=1657599,805301,1508123,1779372,1719206
- **[bug tracker]** The Fission isolation strategy pref (bug 1723797, FIXED 2021-09-08) has only two documented initial values: *"No Isolation — Every website is loaded in the shared `web` content process"* and *"Isolate Everything — Every website is given its own `webIsolated` content process."* No sandbox-specific strategy. Pref name appears in the wild as `fission.webContentIsolationStrategy` (bug 1832341, UNCONFIRMED, 2023-05-10). — https://bugzilla.mozilla.org/rest/bug/1723797/comment

**Verdict:** documented status is **not implemented, tracking bug open since 2014**. Firefox process selection is keyed on *site*; there is no documented rule placing an opaque-origin/sandboxed frame in its own process.

**Documentation gap to flag:** neither `wiki.mozilla.org/Project_Fission`, `firefox-source-docs.mozilla.org/dom/ipc/process_model.html`, nor `firefox-source-docs.mozilla.org/dom/navigation/embedding.html` mentions sandboxed iframes, null principals, opaque origins, or `about:srcdoc` at all. The behavior is undocumented, not merely unimplemented.

---

## 2. Storage APIs in an opaque-origin frame — three *different* failure shapes

| API | Documented failure | Source |
|---|---|---|
| `localStorage` / `sessionStorage` | **throws** `SecurityError` synchronously | spec |
| `document.cookie` | **throws** `SecurityError` (getter *and* setter) | spec |
| `indexedDB.open()` | **throws** `SecurityError` | WPT / spec-derived |
| `caches` (CacheStorage) | property access succeeds; **promises reject** with `SecurityError` | Bugzilla + WPT |
| `navigator.storage.estimate()` / `.persist()` | **rejects with `TypeError`** | MDN + Bugzilla |

- **[spec]** localStorage/sessionStorage getters: obtain the storage bottle map, then "**If map is failure, then throw a `SecurityError` DOMException**." — https://html.spec.whatwg.org/multipage/webstorage.html
- **[spec]** The failure comes from the Storage Standard: "To obtain a local storage shelf… run obtain a storage shelf…"; "Let key be the result of running obtain a storage key… If key is failure, then return failure"; and **"If key's origin is an opaque origin, then return failure."** — https://storage.spec.whatwg.org/
- **[spec]** `document.cookie`: "if the document is a cookie-averse `Document` object, then the user agent must return the empty string. Otherwise, **if the `Document`'s origin is an opaque origin, the user agent must throw a `SecurityError`**" (setter: same, throws). — https://html.spec.whatwg.org/multipage/dom.html
- **[spec/WPT]** `IndexedDB/idbfactory-open-opaque-origin.html` asserts a test named *"IDBFactory.open() in sandboxed iframe should throw SecurityError"* against `sandbox='allow-scripts'`, with `assert_equals(message.result, 'SecurityError', 'Exception should be SecurityError')`. — https://raw.githubusercontent.com/web-platform-tests/wpt/master/IndexedDB/idbfactory-open-opaque-origin.html
- **[bug tracker]** CacheStorage — Firefox deliberately made this *async* rather than throwing. Bug 1182094 (RESOLVED FIXED, 2015-07-09 → 2015-09-16), ben@wanderview.com: *"the CacheStorage should be rejecting operations with SecurityError instead of throwing it directly from the `.caches` attribute"* and *"I previously updated our code to reject Cache operations with SecurityError instead of throwing."* — https://bugzilla.mozilla.org/rest/bug/1182094/comment
- **[spec/WPT]** `service-workers/cache-storage/sandboxed-iframes.https.html`: "Access should be allowed if sandbox has allow-same-origin"; "Access should be denied if sandbox lacks allow-same-origin" → `denied` + `SecurityError`. — https://raw.githubusercontent.com/web-platform-tests/wpt/master/service-workers/cache-storage/sandboxed-iframes.https.html
- **[MDN]** `StorageManager.estimate()` Exceptions: "`TypeError` — Thrown if obtaining a local storage shelf failed. For example, **if the current origin is an opaque origin** or if the user has disabled storage." Secure-context only. — https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
- **[bug tracker]** Bug 1348874 "Timeout `navigator.storage.persist()` in sandboxed iframe" — Core :: Storage: Quota Manager, RESOLVED FIXED 2017-04-17. Comments: *"should reject with TypeError"*, *"Disable the API in opaque origins."* — https://bugzilla.mozilla.org/rest/bug/1348874/comment
- **[MDN]** CacheStorage generally: "`CacheStorage` always rejects with a `SecurityError` on untrusted origins (i.e., those that aren't using HTTPS…)"; Firefox note: "because `CacheStorage` requires file-system access, it may be unavailable in private mode in Firefox." — https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage

**MDN documentation gaps (important — MDN does *not* answer this question):**
- **[MDN]** `Window.localStorage` Exceptions lists only: "The origin is not a valid scheme/host/port tuple. This can happen if the origin uses the `file:` or `data:` schemes" and "The request violates a policy decision." **No mention of sandboxed iframes or opaque origins.** Same for `sessionStorage`. — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage , https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
- **[MDN]** `IDBFactory.open()` Exceptions documents **only** `TypeError` ("Thrown if the value of `version` is not a number greater than zero"). No `SecurityError`, no opaque origin. — https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open
- **[MDN]** `Document.cookie` and `Window.indexedDB` say nothing about sandboxed frames or opaque origins. — https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie , https://developer.mozilla.org/en-US/docs/Web/API/Window/indexedDB
- **[MDN]** The Same-origin policy page notes only that `document.domain` "will throw a `SecurityError` DOMException if the document is in a sandboxed `<iframe>`." — https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy

**Bugzilla inconsistency search:** quicksearch for `localStorage sandboxed`, `indexedDB sandboxed`, and `SecurityError sandboxed` all returned **zero bugs**, so I found no open Firefox-specific storage-in-opaque-origin inconsistency bug. The only live one is bug 1842828 "Investigate wpt failing tests in PBM (`opaque-origin.https.window.html`)" — Core :: Storage: Cache API, **ASSIGNED**, 2023-07-11 (private-browsing-mode specific).

---

## 3. Pointer Lock — `allow-pointer-lock` is required; Firefox does **not** return a Promise

- **[MDN]** "The `allow-pointer-lock` sandbox token **must** be added when calling `requestPointerLock()` in an `<iframe>` element. Also, no other elements in other `<iframe>` elements may be in pointer lock mode." — https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
- **[MDN]** "While `<iframe>` work by default, 'sandboxed' `<iframe>`s block Pointer lock. To avoid this limitation, use `<iframe sandbox="allow-pointer-lock">`." Also: "Pointer lock can only lock one `<iframe>` at a time… pointer lock will error out." — https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
- **[MDN]** Sandbox token definition: `allow-pointer-lock` — "Allows the page to use the Pointer Lock API." — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- **[MDN BCD]** `Element.requestPointerLock`: **Firefox 50** (moz-prefixed 14–49). Chrome notes "from v92, returns promise instead of undefined"; Safari "from v18.4"; Opera "from v78". **There is no promise-return note or entry for Firefox**, i.e. BCD documents Firefox as still returning `undefined`. — https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestPointerLock.json
- **[MDN]** MDN's page documents the Promise version but warns: "this version is **not yet a standard and is not implemented by all browsers**." — same MDN URL. Treat the Promise as unavailable in Firefox unless you verify.
- **[MDN BCD]** `options.unadjustedMovement`: **Firefox 152**; **Firefox Android: not supported**. (Chrome 88 desktop-only — "not Linux"; Safari 18.4.) — same BCD URL. ⚠️ *Flag: Firefox 152 is a very recent version number; confirm against the actual release train before relying on it.*
- **[bug tracker]** Bug 1935524 "New wpt failures in /pointerlock/ [`pointerlock_promise.html`, `pointerlock_unadjustedMovement.html`, `pointerlock_without_gesture.html`]" — Core :: DOM: Events, **NEW**, 2024-12-05 → 2025-09-22. — https://bugzilla.mozilla.org/rest/bug/1935524
- **[bug tracker]** Bug 1732441 "PointerLock inside iframe block page scroll" — Core :: DOM: UI Events & Focus Handling, **NEW**, 2021-09-24 → 2024-07-03. Gecko also carries cross-origin pointer-lock mochitests (`test_pointerlock_xorigin_iframe.html`, bug 1790845, **REOPENED**, last changed 2026-08-10; `test_pointerlock_xorigin_iframe_movementXY.html`, bug 1897207, NEW).

**Note:** there is no `pointer-lock` Permissions-Policy directive; the only gate is the sandbox token.

---

## 4. Fullscreen — `allowfullscreen` works for an opaque child, `allow="fullscreen"` does **not** (per spec)

- **[MDN]** `allowfullscreen`: "Set to `true` if the `<iframe>` can activate fullscreen mode by calling the `requestFullscreen()` method." Note: "**This attribute is considered a legacy attribute and redefined as `allow="fullscreen *"`.**" — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- **[spec]** Container policy algorithm: "If element's `allowfullscreen` attribute is specified, and container policy does not contain an entry for the fullscreen feature," add fullscreen with allowlist **`*`**. — https://w3c.github.io/webappsec-permissions-policy/
- **[spec]** The same spec's allowlist matching runs **`*` first**: "1. If the allowlist is the special value `*`, then return true." … "4. **If origin is an opaque origin, return false.**" And declared origin: "**If node's sandbox attribute is set, and does not contain the `allow-same-origin` keyword, then return a new opaque origin.**" — same URL.
  → **Consequence for your frame:** `allowfullscreen` (allowlist `*`) grants fullscreen to an opaque-origin child. `allow="fullscreen"` alone defaults to `'src'`, `'src'` resolves to a *fresh opaque origin* for a sandbox-without-`allow-same-origin` frame, and the match then falls through to the opaque-origin `false` step. `allow="fullscreen *"` is the explicit form that works.
- **[spec]** Fullscreen spec: "The `allowfullscreen` attribute of the HTML `iframe` element affects the container policy for any document nested in that iframe"; "To enable content in a child navigable to go fullscreen, it needs to be specifically allowed via permissions policy, either through the `allowfullscreen` attribute…, or an appropriate declaration in the `allow` attribute…, or through a `Permissions-Policy` HTTP header." — https://fullscreen.spec.whatwg.org/
- **[MDN]** `Permissions-Policy: fullscreen` — default allowlist `self`; "The top-level browsing context and same-origin iframes are allowed access… by default"; blocked → `requestFullscreen()` "return a `Promise` that rejects with a `TypeError`"; "**If both this directive (i.e., via the `allow` attribute) and the `allowfullscreen` attribute are present on an `<iframe>` element, this directive takes precedence.**" — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/fullscreen
- **[MDN]** `Element.requestFullscreen()`: element "must either be located within the top-level document or in an `<iframe>` which has the `allowfullscreen` attribute applied to it"; TypeError if "The element is not permitted to use the `fullscreen` feature, either because of Permissions Policy configuration or other access control features"; **transient user activation required**. — https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen

**Firefox-specific versions:**
- **[MDN BCD]** `iframe allowfullscreen`: **Firefox 18** (moz-prefixed **9 → 18**). Chrome 38, Safari 10.1. — https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allowfullscreen.json
- **[MDN BCD]** `iframe allow` attribute: **Firefox 74** (2020-03-10). Its `fullscreen` sub-feature: **Firefox 80** (2020-08-25). — https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json
- **[MDN BCD]** `Permissions-Policy: fullscreen` **HTTP header: Firefox `false` (not supported)**; Chrome/Edge 88. And the **`Permissions-Policy` header as a whole is `version_added: false` in Firefox**. — https://bcd.developer.mozilla.org/bcd/api/v0/current/http.headers.Permissions-Policy.fullscreen.json , https://bcd.developer.mozilla.org/bcd/api/v0/current/http.headers.Permissions-Policy.json
- **[bug tracker]** Bug 1694922 "Implement and ship Permissions-Policy header" — Core :: DOM: Core & HTML, **NEW**, created 2021-02-25, **last changed 2026-07-11**. Still open. — https://bugzilla.mozilla.org/rest/bug?quicksearch=Permissions-Policy%20header
  → **In Firefox, the HTTP header is a no-op; only the `<iframe allow>` attribute and `allowfullscreen` do anything.**

**`mozallowfullscreen` history:**
- **[bug tracker]** Bug 805301 "Rename mozallowfullscreen to allowfullscreen" — RESOLVED FIXED, target milestone **mozilla19** (2012-10-25 → 2013-03-23).
- **[bug tracker]** Bug 1657599 "**Remove mozallowfullscreen.**" — RESOLVED FIXED, target milestone **81 Branch**, landed **2020-09-03**. So `mozallowfullscreen` is gone as of Firefox 81. — https://bugzilla.mozilla.org/rest/bug?id=1657599,805301,1508123,1779372,1719206

**⚠️ Open Gecko bug directly on this axis:** Bug 1508123 "Support `'src'` allowList for FeaturePolicy in sandboxed iframes" — Core :: DOM: Security, **status NEW**, created 2018-11-18, last changed **2024-09-25**. The comments describe a design where *"the first nullprincipal load that happens after we set up the inherited policies gets to match all the `'src'` policies"* and end with a review `r=me` — **but the bug is still NEW, so it is ambiguous whether this shipped**. Do not assume `allow="fullscreen"` (implicit `'src'`) behaves the same in Firefox as in the spec. — https://bugzilla.mozilla.org/rest/bug/1508123/comment

**⚠️ MDN error to flag:** MDN's `Element.requestFullscreen` "Security considerations" says *"The default allowlist for `screen-wake-lock` is `self`"* in the middle of a fullscreen discussion — a copy/paste bug on MDN.

---

## 5. Gamepad — Firefox has **no** `gamepad` Permissions-Policy support, and gates on user interaction instead

- **[spec]** Gamepad spec defines a policy-controlled feature `"gamepad"` with **default allowlist `*`**. "A document's permissions policy determines whether any content in that document is allowed to access `getGamepads()`. If disabled in any document, no content in the document will be allowed to use `getGamepads()`, nor will the `gamepadconnected` and `gamepaddisconnected` events fire." — https://w3c.github.io/gamepad/
- **[MDN]** Same, plus: "calls to `Navigator.getGamepads()` will throw a `SecurityError` `DOMException`… the `gamepadconnected` and `gamepaddisconnected` events will not fire." "**The default allowlist for `gamepad` is `*`.**" — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/gamepad
- **[MDN]** `Navigator.getGamepads()` Exceptions: "`SecurityError` `DOMException` — Use of this feature was blocked by a Permissions Policy." (Only documented exception.) — https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getGamepads
- **[MDN BCD]** `Permissions-Policy: gamepad` **HTTP directive: Firefox `false`, Firefox Android `false`**. Chrome 103 (2022-06-21), Edge 103, WebView 103, Opera Android 71, Samsung 20.0; Safari `false`. — https://bcd.developer.mozilla.org/bcd/api/v0/current/http.headers.Permissions-Policy.gamepad.json
- **[MDN BCD]** `<iframe allow="gamepad">`: **Firefox 91** (2021-08-10), `partial_implementation: true`, note *"The default allowlist is `*` instead of `self` (as required by the specification)."* Chrome/Edge/Safari all `false`. — https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json
- **[MDN BCD]** `Navigator.getGamepads()`: **Firefox 29** (2014-04-29). No `secure_context_required` status in BCD. — https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Navigator.getGamepads.json
- **[MDN]** The only documented Firefox-specific gate: "**In Firefox, gamepads are only exposed to a page when the user interacts with one with the page visible.** This helps prevent gamepads from being used for fingerprinting the user. Once one gamepad has been interacted with, other gamepads that are connected will automatically be visible." — https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

**Answers:** No `gamepad` Permissions-Policy *header* in Firefox; Firefox 91+ honors it in the `<iframe allow>` attribute only. **No documented Firefox gating of `getGamepads()` by frame origin** — the documented gate is user-interaction + page-visibility, not cross-origin-ness. Bugzilla quicksearch for `gamepad feature policy` and `gamepad permission` returned **zero bugs**.

**⚠️ Sources disagree:** the BCD note claims the spec's default allowlist is `self`; the current Gamepad spec **and** MDN's own directive page both say **`*`**. The BCD note reads as stale. Either way the effective Firefox default is `*`, and per the Permissions-Policy matching algorithm `*` returns `true` *before* the opaque-origin rejection step — so policy does not block an opaque-origin frame here.

---

## 6. Autoplay / WebAudio — Firefox docs do **not** cover the cross-origin/sandboxed-frame case

**What is documented:**
- **[vendor doc]** Firefox 66, released **2019-03-19**: "Firefox now prevents websites from automatically playing sound. You can add individual sites to an exceptions list or turn blocking off." — https://www.firefox.com/en-US/firefox/66.0/releasenotes/
- **[MDN]** Firefox prefs (Autoplay guide): `media.autoplay.block-webaudio` — "A Boolean preference that indicates whether to apply autoplay blocking to the Web Audio API. If `false`, web audio is always allowed to autoplay. **If `true`, audio contexts are only able to play on pages once there has been Sticky activation. The default is set to `true`.**" Others: `media.autoplay.allow-muted` (default `true`), `media.block-autoplay-until-in-foreground` (default `true`), `media.autoplay.allow-extension-background-pages` (default `true`), `media.allowed-to-play.enabled` (default `false`), `media.autoplay.enabled.user-gestures-needed` (Nightly only), `media.autoplay.default` (0 allowed / 1 blocked / 2 prompt). — https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- **[MDN]** AudioContext state: "if you create the audio context from inside a `click` event the state should automatically be set to `running`"; "If you create the context outside of a user gesture, its state will be set to `suspended` and it will need to be started after user interaction," via `resume()`. — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- **[MDN]** iframe inheritance: "The specified Permissions Policy applies to the document and every `<iframe>` nested within it, unless those frames include an `allow`, which sets a new Permissions Policy for that frame and all frames nested within it." — Autoplay guide URL above.
- **[MDN]** `Permissions-Policy: autoplay` — **default allowlist `self`**; where blocked and with no user gestures, "the `Promise` returned by `HTMLMediaElement.play()` will reject with a `DOMException`. The `autoplay` attribute on `<audio>` and `<video>` elements will be ignored." — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/autoplay
- **[MDN BCD]** `<iframe allow="autoplay">`: **Firefox 74** (2020-03-10); Firefox Android 79. — https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json
  → Same spec mechanics as fullscreen: with `allow="autoplay"` the implicit `'src'` resolves to a fresh opaque origin for a sandbox-without-`allow-same-origin` frame; `allow="autoplay *"` is the form that can match.

**What is *not* documented — flag these as unanswered:**
- **No Mozilla documentation states whether a user gesture inside a cross-origin or sandboxed iframe counts** toward resuming an `AudioContext` in that frame. The MDN Autoplay guide contains **zero occurrences of "sandbox" and zero of "cross-origin"** (I checked explicitly).
- `support.mozilla.org/en-US/kb/block-autoplay` and `hacks.mozilla.org` were both unreachable from this environment, so Firefox's user-facing autoplay KB could not be verified.
- **⚠️ Stale MDN:** the Autoplay guide says `media.autoplay.default` "Default value is `0`" (= allowed), which contradicts Firefox 66 shipping blocking on by default. Treat that pref table as dated.

**Bug-tracker signal (behavior, not docs):**
- **[bug tracker]** Bug 1643619 "block video autoplay in iframe" — Core :: Audio/Video: Playback, **NEW**, 2020-06-05 → 2022-05-12. Reporter: *"any video element, aka `<video>`, can still autoplay when it is placed into an iframe."* — https://bugzilla.mozilla.org/rest/bug/1643619/comment
- **[bug tracker]** Bug 1480738 "Iframe with audio URL autoplays" — RESOLVED FIXED 2018-08-07.
- **[bug tracker]** Gecko carries `browser_autoplay_policy_iframe_hierarchy.js` (bugs 1434173, 1516318, 1536314, 1567361, 1586931, 1592166 "[fission] …") and `browser_delay_autoplay_cross_origin_iframe.js` (bug 1873278) — so the autoplay policy *is* evaluated across a frame hierarchy and has cross-origin-iframe coverage, but this is test-file evidence, not documentation.

---

## 7. Slow-script / "A web page is slowing down your browser"

**The dialog is per-tab in presentation, per-content-process in detection.**

- **[vendor source strings]** `browser/locales/en-US/chrome/browser/browser.properties`, section `# Process hang reporter`:
  - `processHang.selected_tab.label = This page is slowing down %1$S. To speed up your browser, stop this page.`
  - `processHang.nonspecific_tab.label = A web page is slowing down %1$S. To speed up your browser, stop that page.`
  - `processHang.specific_tab.label = "%1$S" is slowing down %2$S. To speed up your browser, stop that page.` (`%1$S` is the tab title)
  - `processHang.add-on.label2 = "%1$S" is slowing down %2$S. To speed up your browser, stop that extension.`
  - Buttons: `Stop` / `Debug Script`.
  — https://hg-edge.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties
  → **Three tab-scoped variants (selected tab / named tab / non-specific tab). There is no per-frame variant.**
- **[vendor source]** `browser/modules/ProcessHangMonitor.sys.mjs` matches a hang report via `report.isReportForBrowserOrChildren(frameLoader)` — the report is attributed to a **top-level browser (tab) and its child frames**, not to an individual iframe. Only one pref is read there: `browser.hangNotification.waitPeriod` (default **10000 ms**). — https://hg-edge.mozilla.org/mozilla-central/raw-file/tip/browser/modules/ProcessHangMonitor.sys.mjs
- **[bug tracker]** The detector is `dom/ipc/ProcessHangMonitor.cpp`, filed under **Core :: DOM: Content Processes** (bugs 1153394, 1321052, 1366845, 1762604, 1842111) — i.e. the parent process monitors **child content processes**. Bug 1980452 (**NEW**, 2025-07-31 → 2025-12-10) asks that it *also* cover extension child processes, implying today's coverage is content processes. — https://bugzilla.mozilla.org/rest/bug?summary=ProcessHangMonitor…
- **[bug tracker]** Bug 397394 "unresponsive script should identify culpable tab" — RESOLVED FIXED (2007-09-24, last changed 2025-11-13).

**Prefs — correct the question's premise:**
- `dom.max_script_run_time` **is real**: bugs 247225 (FIXED 2004), 347365/347476 (UI requests, WONTFIX), 487898 ("Per-site dom.max_script_run_time", **NEW**, 2009 → 2023-11-14), 1150028 (with `dom.max_chrome_script_run_time`, FIXED), 1265000 (telemetry probe, FIXED), 1719720 ("ASSERTION: ENSURE_PARENT_PROCESS: called SetInt on dom.max_script_run_time", **NEW**, 2021-07-08 → 2024-11-19). Bug 1719720 comment 1 (mstange, 2021-07-08): *"It looks like we try to set the pref `dom.max_script_run_time` from the content process"*, traced to `XPCJSContext::InterruptCallback` — confirming the timeout is enforced **inside each content process**. — https://bugzilla.mozilla.org/rest/bug?summary=dom.max_script_run_time , https://bugzilla.mozilla.org/rest/bug/1719720/comment
- **`dom.max_content_script_run_time` returns ZERO hits** in Bugzilla quicksearch, and does not appear in `all.js`, `firefox.js`, or `StaticPrefList.yaml` in the portions I could retrieve. `dom.max_ext_content_script_run_time` also returns zero hits. **Treat `dom.max_content_script_run_time` as probably not a Firefox pref.** The real companion is `dom.max_chrome_script_run_time` (bug 1150028).
- ⚠️ Caveat: I could not retrieve the pref *definitions* — `modules/libpref/init/all.js`, `browser/app/profile/firefox.js`, and `StaticPrefList.yaml` were all truncated by the fetch tool, so I cannot quote default values from a Mozilla source.

**The sandboxed-iframe case — this is the one directly on point:**
- **[bug tracker]** **Bug 919744 "scripts in sandboxed iframes that disallow navigation cannot spawn 'unresponsive script' dialogue"** — Core :: DOM: Core & HTML, **status NEW**, created **2013-09-23**, last changed **2022-10-11**, severity S3. Comment 2 (efaustbmo, 2013-10-08): *"It looks to me like the issue is that when we try to open the new window for the unresponsive script dialog, we fail… the failure is because the document we try to open it on has `SANDBOXED_NAVIGATION` set."* Comment 3: *"the failure mode has nothing to do with baseline jit. Rather, the runtime of any script."* The STR describe two sandbox iframes, one doing long JS computations. — https://bugzilla.mozilla.org/rest/bug/919744 , https://bugzilla.mozilla.org/rest/bug/919744/comment
  ⚠️ **Staleness caveat:** this predates e10s and the notification-bar UI, so the described mechanism (opening a new window for the dialog) no longer matches current code. The bug remains NEW, so the outcome (no warning for a hung sandboxed frame) has never been formally resolved, but the stated cause is likely stale.
- **[bug tracker]** Open e10s-era slow-script bugs, all still **NEW**: 1164286 "The page load stop and refresh buttons do nothing when the E10S slow script notification is being shown" (2015-05-12), 1164926 "Slow/hanging script stops navigation to another page in e10s" (2015-05-14), 1260769 "[e10s] SLOW_SCRIPT_PAGE_COUNT regressed under e10s" (2016-03-30), 1264647 "add 'Don't show this again' checkbox to e10s slow script dialog", 1275723 "Re-enable/implement the 'Debug Script' option in nightly [e10s]'s slow script notification bar." — https://bugzilla.mozilla.org/rest/bug?quicksearch=e10s%20slow%20script

**Same-process vs different-process hung iframe:** **no Mozilla documentation addresses this.** The retrievable artifacts show detection is per content process and presentation is per tab; nothing states what happens when the hung frame shares a process with the top document versus not. Treat this as undocumented.

**Unreachable source:** the SUMO KB article "Warning Unresponsive script" exists (created by bug 401261, FIXED 2008-01-04) but `support.mozilla.org` served WebFetch a client-challenge page on every attempt, so I could not verify its current wording or whether it still names the prefs.

---

## Cross-cutting flags for the matrix

1. **Firefox does not support the `Permissions-Policy` HTTP header at all** (BCD `version_added: false`; bug 1694922 NEW as of 2026-07-11). Every policy decision must go through `<iframe allow>` / `allowfullscreen`.
2. **`'src'` (the implicit default in `allow`) can never match an opaque-origin frame** per spec, and Gecko's corresponding bug 1508123 is still NEW after 8 years with ambiguous partial-implementation comments. Explicit `*` allowlists are the only spec-clean way to grant a policy-controlled feature to a sandboxed frame.
3. **Failure shapes are not uniform**: sync `SecurityError` (web storage, cookies, IndexedDB) vs. async `SecurityError` (CacheStorage, a deliberate Firefox change in 2015) vs. async `TypeError` (`navigator.storage.*`).
4. **Live Gecko bug worth knowing about:** bug 2052581 "Content-process crash loading `about:blank` into a sandboxed iframe" — Core :: DOM: Navigation, **NEW**, 2026-07-03 → 2026-07-28. Also bug 2043981 "[wpt-sync] … Two sandboxed iframes in different agent clusters" (FIXED, 2026-06) if agent-cluster/SharedArrayBuffer semantics matter.
5. **Coverage caveat:** WebSearch was unavailable, so this survey is limited to URLs I could reach directly. `support.mozilla.org` and `hacks.mozilla.org` were unreachable; the IndexedDB, Service Worker, and Permissions-Policy specs and the Firefox pref files were partially truncated by the fetch tool, so a few claims rest on WPT test assertions and Bugzilla comments rather than on the spec prose itself (labeled as such above).
