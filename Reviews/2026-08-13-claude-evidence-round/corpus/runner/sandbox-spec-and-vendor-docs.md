# Recovered Claude memo — Documented sandbox behavior

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T05:06:16.500Z
**Claude task:** `a9fd883caece165c7`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3608
**Original result length:** 58750 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
All three engine agents are back. Here is the consolidated survey.

---

# Documented behavior: opaque-origin iframe (`srcdoc` + `sandbox="allow-scripts"`)

**Method note:** the session's WebSearch budget (200/200) was exhausted early, so everything below came from direct fetches of canonical URLs (WHATWG/W3C specs, MDN + MDN's live BCD API, caniuse feature JSON, webkit.org, developer.apple.com, bugs.webkit.org, chromium source docs, chromestatus, Bugzilla REST). No browsers were run, no files written, nothing under the project touched. Where a doc could not be reached, that is stated rather than guessed.

---

## 1. HTML spec — the sandboxing flag set

### 1a. Flag definitions (verbatim, [html.spec.whatwg.org/multipage/browsers.html#sandboxing](https://html.spec.whatwg.org/multipage/browsers.html#sandboxing))

| Flag | Spec text |
|---|---|
| **sandboxed navigation** | "prevents content from navigating browsing contexts other than the sandboxed browsing context itself (or browsing contexts further nested inside it), auxiliary browsing contexts …, and the top-level browsing context …" |
| **sandboxed top-level navigation without user activation** | "prevents content from navigating their top-level browsing context and prevents content from closing their top-level browsing context. It is consulted only when the sandboxed browsing context's active window **does not** have transient activation." |
| **sandboxed top-level navigation with user activation** | same, "consulted only when … **has** transient activation." |
| **sandboxed origin** | "forces content into an opaque origin … also prevents script from reading from or writing to the `document.cookie` IDL attribute, and blocks access to `localStorage`." |
| **sandboxed scripts** | "blocks script execution." |
| **sandboxed automatic features** | "blocks features that trigger automatically, such as automatically playing a video or automatically focusing a form control." |
| **sandboxed pointer lock** | "disables the Pointer Lock API." |
| **sandboxed modals** | blocks `alert()`, `confirm()`, `print()`, `prompt()`, the `beforeunload` event |
| **sandboxed orientation lock** | "disables the ability to lock the screen orientation." |
| **sandboxed presentation** | "disables the Presentation API." |
| **sandboxed downloads** | "prevents content from initiating or instantiating downloads …" |
| **sandboxed forms** | "blocks form submission." |
| **sandboxed `document.domain`** | "prevents content from using the `document.domain` setter." |
| **sandbox propagates to auxiliary browsing contexts** | "prevents content from escaping the sandbox by ensuring that any auxiliary browsing context it creates inherits the content's active sandboxing flag set." |
| **sandboxed custom protocols navigation** | "prevents navigations toward non fetch schemes from being handed off to external software." |

### 1b. "Parse a sandboxing directive" — keyword → flag mapping (verbatim, same URL)

Every flag below is **added**, then removed by the named keyword:

- sandboxed navigation — **always added, no keyword removes it**
- sandboxed `document.domain` — **always added, no keyword removes it**
- sandboxed auxiliary navigation — unless `allow-popups`
- sandboxed top-level nav without user activation — unless `allow-top-navigation`
- sandboxed top-level nav with user activation — unless `allow-top-navigation-by-user-activation` **or** `allow-top-navigation`
- sandboxed origin — unless `allow-same-origin`
- sandboxed forms — unless `allow-forms`
- sandboxed pointer lock — unless `allow-pointer-lock`
- sandboxed scripts — unless `allow-scripts`
- **sandboxed automatic features — unless `allow-scripts`** ← note: `allow-scripts` clears *two* flags
- sandbox propagates to auxiliary — unless `allow-popups-to-escape-sandbox`
- sandboxed modals — unless `allow-modals`
- sandboxed orientation lock — unless `allow-orientation-lock`
- sandboxed presentation — unless `allow-presentation`
- sandboxed downloads — unless `allow-downloads`
- sandboxed custom protocols navigation — unless `allow-top-navigation-to-custom-protocols`, `allow-popups`, **or** `allow-top-navigation`

So `sandbox="allow-scripts"` leaves set: navigation, auxiliary-nav, both top-level-nav, origin, forms, pointer-lock, document.domain, sandbox-propagates, modals, orientation-lock, presentation, downloads, custom-protocols. It clears: scripts, automatic features.

### 1c. Can a sandboxed frame navigate ITSELF? **Yes — the spec does not block it.**

This is answered directly by the flag's own text: the sandboxed navigation flag "prevents content from navigating browsing contexts **other than the sandboxed browsing context itself** (or browsing contexts further nested inside it)". Self-navigation and navigation of its own descendants are explicitly outside the flag's scope. The `navigate` algorithm consults [`allowed by sandboxing to navigate`](https://html.spec.whatwg.org/multipage/browsing-the-web.html#allowed-to-navigate) — I could confirm the call site ("If sourceDocument's node navigable is not allowed by sandboxing to navigate navigable given sourceSnapshotParams") in [browsing-the-web.html](https://html.spec.whatwg.org/multipage/browsing-the-web.html), but **the numbered steps of that algorithm were truncated by the fetch tool on every attempt** — the flag definition is the load-bearing quote, not the algorithm body.

Two caveats on "arbitrary URL": the **sandboxed custom protocols navigation flag** remains set, blocking hand-off of non-fetch schemes to external software; and `allow-downloads` is absent, so a navigation "that gets handled as a download" is blocked.

### 1d. Inheritance — yes, flags and opaque origin are re-applied on every navigation

[browsers.html#determining-the-creation-sandboxing-flags](https://html.spec.whatwg.org/multipage/browsers.html#determining-the-creation-sandboxing-flags): every `Document` has an **active sandboxing flag set**, empty at creation and "populated by the navigation algorithm". Creation sandboxing flags = the union of the embedder's **iframe sandboxing flag set** and the embedder's **node document's active sandboxing flag set**. The iframe sandboxing flag set is "determined by the `iframe` element's `sandbox` attribute."

Consequences documented:
- **Ancestors win.** From [iframe-embed-object.html](https://html.spec.whatwg.org/multipage/iframe-embed-object.html): "Page C in this scenario has all the sandboxing flags set. Scripts are disabled, because the `iframe` in A has scripts disabled, and this overrides the `allow-scripts` keyword set on the `iframe` in B."
- **Changes are not retroactive.** "These flags only take effect when the content navigable of the `iframe` element is navigated. Removing them, or removing the entire `sandbox` attribute, has no effect on an already-loaded page."
- **Popups/redirects inherit too** ([MDN iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)): "When redirecting the user, opening a popup window, or opening a new tab from an embedded page within an `<iframe>` with the `sandbox` attribute, the new browsing context is subject to the same `sandbox` restrictions."
- **A fresh opaque origin per load.** Opaque origins have "no serialization it can be recreated from (serialized as `null`)" and each application of the sandboxed origin flag yields *a new* opaque origin. (The `determine the origin` algorithm body was also truncated; the pattern is confirmed by the parallel Permissions Policy algorithm in §6.)

---

## 2. Storage in an opaque origin

The whole picture reduces to one Storage Standard step ([storage.spec.whatwg.org](https://storage.spec.whatwg.org/)), **obtain a storage key**:

> 1. "Let key be the result of running obtain a storage key for non-storage purposes with environment."
> 2. **"If key's origin is an opaque origin, then return failure."**
> 3. "If the user has disabled storage, then return failure."

Registered storage endpoints keyed this way: `caches`, `indexedDB`, `localStorage` (5 MiB), `serviceWorkerRegistrations`, `sessionStorage` (5 MiB).

| API | Spec behavior | Source |
|---|---|---|
| `localStorage` / `sessionStorage` | **Throws `SecurityError`.** Getter "throws a `SecurityError` DOMException if the `Document`'s origin is an opaque origin or if the request violates a policy decision"; steps: "If map is failure, then throw a `SecurityError`." | [webstorage.html](https://html.spec.whatwg.org/multipage/webstorage.html) |
| `document.cookie` | **Throws `SecurityError`**, getter *and* setter: "if the document is a cookie-averse `Document` object, then … return the empty string. Otherwise, if the `Document`'s origin is an opaque origin, the user agent must throw a `SecurityError`." (Note `about:srcdoc` is arguably cookie-averse too — "a `Document` whose URL's scheme is not an HTTP(S) scheme" — which would return `""` instead. Ordering makes the cookie-averse branch win; **this is an ambiguity worth measuring.**) | [dom.html#dom-document-cookie](https://html.spec.whatwg.org/multipage/dom.html#dom-document-cookie) |
| `indexedDB.open()` / `deleteDatabase()` | **Throws `SecurityError`.** Spec source: "Let storageKey be the result of running obtain a storage key given environment. If failure is returned, then throw a `SecurityError` DOMException and abort these steps." `databases()` returns a rejected promise with `SecurityError`. | [IndexedDB bikeshed source](https://raw.githubusercontent.com/w3c/IndexedDB/main/index.bs) — the rendered spec truncated on every fetch |
| `caches` (CacheStorage) | Spec text **not directly verifiable** — the Service Worker spec truncated at every URL and both bikeshed source paths 404'd/truncated. Behavior follows from `caches` being a storage-key endpoint. Empirically-anchored documentation: WPT `service-workers/cache-storage/sandboxed-iframes.https.html` asserts "Access should be denied if sandbox lacks `allow-same-origin`" → `SecurityError`. Firefox deliberately **rejects rather than throws** (below). | [WPT](https://raw.githubusercontent.com/web-platform-tests/wpt/master/service-workers/cache-storage/sandboxed-iframes.https.html) |
| `navigator.storage.estimate()` / `persist()` / `persisted()` | **Rejects with `TypeError`**, not SecurityError: "If shelf is failure, then reject promise with a `TypeError`." | [storage.spec.whatwg.org](https://storage.spec.whatwg.org/) |

**Where it's implementation-defined / undocumented:**
- The spec never says *which* opaque-origin storage failures are sync vs async — that is a per-API spec choice, and vendors diverged (see Firefox's 2015 decision to make CacheStorage reject).
- **MDN does not document any of this.** `Window.localStorage`'s Exceptions section lists only invalid schemes (`file:`, `data:`) and policy decisions — [no mention of sandboxed iframes or opaque origins](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). `IDBFactory.open()` documents **only** `TypeError` for a bad version number — [no `SecurityError` at all](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open). `Window.caches` has [no Exceptions section](https://developer.mozilla.org/en-US/docs/Web/API/Window/caches). If you were relying on MDN for this row of the matrix, it is simply absent.

---

## 3. Firefox / Gecko

### 3a. Process isolation — **no Gecko equivalent of `IsolateSandboxedIframes` has shipped**

- Fission shipped in **Firefox 95, 2021-12-07**: "Site Isolation is now enabled for all Firefox 95 users" ([release notes](https://www.firefox.com/en-US/firefox/95.0/releasenotes/)); "pages and frames are executed in processes dedicated to their **origin**" ([Project Fission wiki](https://wiki.mozilla.org/Project_Fission)). Process selection lives in `ProcessIsolation.cpp` ([process model docs](https://firefox-source-docs.mozilla.org/dom/ipc/process_model.html)).
- **[bug tracker] Bug 961689 "Process-isolated sandboxed iframes" — status NEW**, created **2014-01-20**, last changed 2024-12-31, blocks the Fission meta bug, `see_also` Chromium's 40082497. Latest substantive comment (2024-09-25): "Chromium has recently shipped this, looks like." ([bugzilla](https://bugzilla.mozilla.org/rest/bug/961689))
- The only Bugzilla hits for "IsolateSandboxedIframe" are **WPT imports, not Gecko implementation** — bug 1779372 (FIXED, 106 Branch, a Chromium regression test) and bug 1719206 (**RESOLVED INVALID**).
- **Documentation gap:** the Fission wiki, the process-model doc, and the embedding doc mention sandboxed iframes, null principals, opaque origins, and `about:srcdoc` **zero times**. The behavior is undocumented, not merely unimplemented.

### 3b. Storage — three different failure shapes

- localStorage/sessionStorage, `document.cookie`, `indexedDB.open()`: **sync `SecurityError`** (spec-conformant; IDB corroborated by WPT `IndexedDB/idbfactory-open-opaque-origin.html`, whose test is literally named "IDBFactory.open() in sandboxed iframe should throw SecurityError").
- **CacheStorage: async.** [Bug 1182094](https://bugzilla.mozilla.org/rest/bug/1182094/comment) (RESOLVED FIXED 2015-09-16) — "the CacheStorage should be **rejecting** operations with SecurityError instead of throwing it directly from the `.caches` attribute". This is a deliberate Firefox divergence in *shape*.
- **`navigator.storage.*`: rejects with `TypeError`.** [MDN `StorageManager.estimate()`](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate) explicitly names the case: "Thrown if obtaining a local storage shelf failed. For example, **if the current origin is an opaque origin**." Implemented per [bug 1348874](https://bugzilla.mozilla.org/rest/bug/1348874/comment) (FIXED 2017-04-17, "Disable the API in opaque origins").
- Bugzilla quicksearch for `localStorage sandboxed`, `indexedDB sandboxed`, `SecurityError sandboxed` returned **zero** bugs — no known Firefox-specific inconsistency filed.

### 3c. Pointer lock

- `allow-pointer-lock` is **required**: "While `<iframe>`s work by default, 'sandboxed' `<iframe>`s block Pointer lock. To avoid this limitation, use `<iframe sandbox="allow-pointer-lock">`" ([MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)). Also "no other elements in other `<iframe>` elements may be in pointer lock mode."
- Spec behavior when the flag is set ([Pointer Lock 2.0](https://w3c.github.io/pointerlock/)): fire `pointerlockerror` at the node document **and** reject the promise with `SecurityError`. Separately, no transient activation → `NotAllowedError`.
- **Firefox does not return a Promise.** BCD records `requestPointerLock` as Firefox **50** (moz-prefixed 14–49) with promise-return notes for Chrome (92), Safari (18.4), Opera (78) — **and no such note for Firefox** ([BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestPointerLock.json)). MDN itself warns the Promise version "is not yet a standard and is not implemented by all browsers."
- `unadjustedMovement`: Firefox **152**, **Firefox Android not supported**. ⚠️ 152 is a suspiciously forward version number — verify against the release train.
- Open bugs: [1935524](https://bugzilla.mozilla.org/rest/bug/1935524) (NEW, WPT failures incl. `pointerlock_promise.html`), 1732441 "PointerLock inside iframe block page scroll" (NEW), 1790845 cross-origin pointer-lock mochitest (**REOPENED, last changed 2026-08-10**).
- **There is no `pointer-lock` Permissions-Policy directive anywhere** — the sandbox token is the only gate ([Permissions-Policy directive index](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy) lists 50 directives; `pointer-lock` is not among them; the Pointer Lock spec defines no policy-controlled feature).

### 3d. Fullscreen — **Firefox does not support the `Permissions-Policy` HTTP header at all**

- BCD: `http.headers.Permissions-Policy` → **`version_added: false`** in Firefox, and the `fullscreen` directive likewise `false` ([header BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/http.headers.Permissions-Policy.json)). [Bug 1694922 "Implement and ship Permissions-Policy header"](https://bugzilla.mozilla.org/rest/bug?quicksearch=Permissions-Policy%20header) — **NEW**, created 2021-02-25, **last changed 2026-07-11**. In Firefox only `<iframe allow>` and `allowfullscreen` do anything.
- `iframe allowfullscreen`: Firefox **18** (moz-prefixed 9→18). `iframe allow` attribute: Firefox **74** (2020-03-10); its `fullscreen` sub-feature Firefox **80**.
- `mozallowfullscreen`: renamed in **mozilla19** (bug 805301), **removed in Firefox 81**, landed 2020-09-03 (bug 1657599, RESOLVED FIXED).
- ⚠️ **Directly on point and unresolved:** [Bug 1508123 "Support `'src'` allowList for FeaturePolicy in sandboxed iframes"](https://bugzilla.mozilla.org/rest/bug/1508123/comment) — Core :: DOM: Security, **status NEW**, created 2018-11-18, last changed 2024-09-25. Comments describe a design where "the first nullprincipal load … gets to match all the `'src'` policies" and carry an `r=me`, but the bug is still NEW. **Do not assume Firefox matches the spec here.**

### 3e. Gamepad

- Firefox has **no `gamepad` Permissions-Policy header support** (BCD: Firefox and Firefox Android both `false`; Chrome 103 / 2022-06-21 has it).
- `<iframe allow="gamepad">`: **Firefox 91** (2021-08-10), `partial_implementation: true`, BCD note *"The default allowlist is `*` instead of `self` (as required by the specification)."* ⚠️ **That BCD note is wrong/stale** — both the [Gamepad spec](https://w3c.github.io/gamepad/) and [MDN's own directive page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/gamepad) say the default allowlist **is** `*`.
- `Navigator.getGamepads()`: Firefox **29** (2014-04-29).
- **The documented Firefox gate is not origin-based:** "In Firefox, gamepads are only exposed to a page when the user interacts with one **with the page visible**. This helps prevent gamepads from being used for fingerprinting … Once one gamepad has been interacted with, other gamepads that are connected will automatically be visible." ([Using the Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)). Bugzilla search for `gamepad feature policy` / `gamepad permission`: **zero bugs**.

### 3f. Autoplay / WebAudio

- Blocking shipped in **Firefox 66, 2019-03-19** ([release notes](https://www.firefox.com/en-US/firefox/66.0/releasenotes/)).
- Prefs ([MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)): `media.autoplay.block-webaudio` — "**If `true`, audio contexts are only able to play on pages once there has been Sticky activation. The default is set to `true`.**" Also `media.autoplay.allow-muted` (true), `media.block-autoplay-until-in-foreground` (true), `media.autoplay.default` (0/1/2). ⚠️ **Stale:** the guide says `media.autoplay.default` defaults to `0` (= allowed), contradicting Firefox 66 shipping blocking on by default.
- **The cross-origin/sandboxed case is entirely undocumented by Mozilla.** The Autoplay guide contains **zero occurrences of "sandbox" and zero of "cross-origin"**. `support.mozilla.org` served a bot-challenge page and `hacks.mozilla.org` was network-blocked, so the user-facing KB could not be checked.
- Behavior evidence only from the tree: [bug 1643619](https://bugzilla.mozilla.org/rest/bug/1643619/comment) "block video autoplay in iframe" (**NEW**, 2020-06-05 → 2022-05-12 — "any video element … can still autoplay when it is placed into an iframe"); test files `browser_autoplay_policy_iframe_hierarchy.js` and `browser_delay_autoplay_cross_origin_iframe.js` (bug 1873278) show the policy *is* evaluated across a frame hierarchy.

### 3g. Slow-script dialog — **per-content-process detection, per-tab presentation, no per-frame variant**

- Strings ([browser.properties](https://hg-edge.mozilla.org/mozilla-central/raw-file/tip/browser/locales/en-US/chrome/browser/browser.properties)): three tab-scoped variants — `processHang.selected_tab.label` ("This page is slowing down %1$S"), `processHang.nonspecific_tab.label` ("A web page is slowing down %1$S … stop that page"), `processHang.specific_tab.label` ("%1$S" = tab title), plus an add-on variant. Buttons: Stop / Debug Script. **No per-iframe string exists.**
- [ProcessHangMonitor.sys.mjs](https://hg-edge.mozilla.org/mozilla-central/raw-file/tip/browser/modules/ProcessHangMonitor.sys.mjs) attributes a report via `report.isReportForBrowserOrChildren(frameLoader)` — top-level browser **and its child frames**. Only pref read: `browser.hangNotification.waitPeriod`, default **10000 ms**.
- Detector is `dom/ipc/ProcessHangMonitor.cpp` under Core :: DOM: **Content Processes** — parent monitors child content processes. Bug 1980452 (NEW) asks to extend it to extension child processes, implying today's scope is content processes.
- **Pref correction:** `dom.max_script_run_time` is real (bugs 247225, 487898 NEW, 1150028, 1719720). Bug 1719720 comment 1 confirms enforcement **inside each content process** (`XPCJSContext::InterruptCallback`). **`dom.max_content_script_run_time` returns ZERO Bugzilla hits** and does not appear in the pref files retrieved — treat it as **not a Firefox pref**; the real companion is `dom.max_chrome_script_run_time`.
- ⚠️ **The sandboxed case, still open:** [Bug 919744 "scripts in sandboxed iframes that disallow navigation cannot spawn 'unresponsive script' dialogue"](https://bugzilla.mozilla.org/rest/bug/919744) — **NEW**, created 2013-09-23, last changed 2022-10-11. Comment 2: "the failure is because the document we try to open it on has `SANDBOXED_NAVIGATION` set." **Caveat: this predates e10s and the notification-bar UI, so the stated mechanism is stale — but the bug was never resolved.**
- **Same-process vs different-process hung iframe: no Mozilla documentation addresses this.** Undocumented.

---

## 4. Safari / WebKit, especially iOS

### 4a. Fullscreen on iOS — **iPad yes, iPhone no, still**

BCD `api.Element.requestFullscreen` ([live BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestFullscreen.json)):

| Target | Documented |
|---|---|
| Safari macOS | **16.4** (2023-03-27) unprefixed; webkit-prefixed since 5.1 (2011) |
| Safari iOS | **16.4**, `partial_implementation: true`, note: **"Only available on iPad, not on iPhone."** |
| WebView iOS | `version_added: false` |

Second BCD note, directly relevant: **"Shows an overlay button which can not be disabled. Swiping down exits fullscreen mode, making it unsuitable for some use cases like games."** `Document.fullscreenEnabled` and `Document.exitFullscreen` carry identical data.

Apple confirms by omission: [Safari 16.4 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes) — "Added support for the unprefixed Fullscreen API **on macOS and iPadOS**" — while the same notes list iOS 16.4 as a shipping platform. Same wording in the [WebKit blog](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/).

**Current as of Safari 27 beta:** [Bug 206854 "Add Fullscreen API to iOS"](https://bugs.webkit.org/show_bug.cgi?id=206854) — filed 2020-01-27, **status NEW**, P2. A **June 2026** comment: "I've just checked the WWDC26 Safari 27 beta notes and there's still nothing for element fullscreen on iPhone." No fullscreen/iPhone item in Safari [26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) or [27 beta](https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/).

⚠️ **Conflicting signal:** [Safari 26.4](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/) (2026-03-24) says "Fixed `Element.requestFullscreen` **on iOS** to correctly reflect hardware keyboard attachment state" — "iOS" where every other source says iPadOS. Most likely BCD's `safari_ios` bucket covering both; **do not read as iPhone support.** Same release shipped **Keyboard Lock scoped to fullscreen** (`requestFullscreen({ keyboardLock: "browser" })`, HTTPS-only) — game-relevant, iPad only.

⚠️ **BCD vs Apple on WKWebView:** BCD says WebView-iOS fullscreen `false`; Apple documents [`WKPreferences.isElementFullscreenEnabled`](https://developer.apple.com/documentation/webkit/wkpreferences/iselementfullscreenenabled), available **iOS 15.4+**, default `false`, warning "the system removes the `WKWebView` from your app's view hierarchy." Unreconciled — treat WKWebView-on-iPhone fullscreen as undocumented.

⚠️ **BCD internally inconsistent:** [`html.elements.iframe.allowfullscreen`](https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allowfullscreen.json) reports **WebView iOS 12 (partial, iPad-only)** while `api.Element.requestFullscreen` reports WebView iOS `false`. Same dataset.

**`webkitEnterFullscreen()`:** **has no current documentation.** Absent from MDN (`/Web/API/HTMLVideoElement/webkitEnterFullscreen` → HTTP 404) and absent from the [BCD `HTMLVideoElement` bundle](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.HTMLVideoElement.json) entirely. What *is* documented is the underlying iPhone model: [WebKit 2016-07-25](https://webkit.org/blog/6784/new-video-policies-for-ios/) — "`<video playsinline>` elements will now be allowed to play inline …"; elements without it "will continue to require fullscreen mode for playback on iPhone." Apple's archived guide (revised **2016-12-12**) says iPhone "play[s] video using the full screen … Video is not presented within the webpage," versus inline on "Mac OS X, Windows, and iPad."

**Fullscreen in an iframe on iOS:** `iframe allow` attribute support is Safari **11.1** / Safari iOS **11.3** ([BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json)). Requirements are spec-level (§6). Note the sandbox flag set has **no** fullscreen token, so sandboxing alone is not a documented fullscreen blocker — permissions policy is.

### 4b. Pointer Lock — **desktop only, never on iOS**

| Target | Documented ([BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestPointerLock.json)) |
|---|---|
| Safari macOS | **10.1** (2017-03-27); returns a Promise from **18.4** |
| Safari iOS | **`false`** |
| WebView iOS | **`false`** |

Not behind a flag on macOS. Safari 18.2 (2024-12-09) "Fixed the Pointer Lock API to work when Fullscreen API is enabled" ([WebKit](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/)); Safari 18.4 (2025-03-31) added the Promise return and `unadjustedMovement` ([WebKit](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)).

iOS: [Bug 216621 "[iOS, iPad and VisionOS] Implement support for Pointer Lock API"](https://bugs.webkit.org/show_bug.cgi?id=216621) — filed 2020-09-16, **NEW**, most recent comment **July 2026**. Related open: 297558, 296955.

**Sandbox keyword support matters independently:** BCD `html.elements.iframe.sandbox` gives `allow-pointer-lock` as Safari **10.1**, **Safari iOS: not supported**.

caniuse agrees: [`pointerlock.json`](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/pointerlock.json) `ios_saf: 26.5 → "n"`.

### 4c. Gamepad — supported, long-standing

BCD ([Gamepad](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Gamepad.json), [getGamepads](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Navigator.getGamepads.json)): Safari **10.1**, **Safari iOS 10.3**, WebView iOS 10.3 (all 2017-03-27). `vibrationActuator`: Safari 16.4, **Safari iOS not supported**. caniuse [`gamepad.json`](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/gamepad.json) shows iOS Safari 26.5 = full support.

Release trail: Safari 16.4 added `gamepad.vibrationActuator`; Safari 18.0 (2024-09-16) "Fixed Gamepad API in WKWebView" ([WebKit](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/)); Safari 27 beta fixed a **visionOS** case where "`gamepadconnected` did not fire unless gamepad permission had already been granted" — the only WebKit note implying a permission gate, and it is visionOS-specific.

⚠️ **Undocumented:** whether WebKit implements the `gamepad` Permissions Policy at all. No BCD entry, no release note, no WebKit doc. (Default allowlist is `*`, so it would not block an opaque frame anyway — see §6.)

### 4d. WebAudio / user gesture

BCD [`AudioContext`](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.AudioContext.json) — Safari **14.1** (2021-04-26), Safari iOS **14.5**, WebView iOS **14.5**, all with the note: **"New audio contexts are suspended until the `resume()` method is called via user action, such as the click event."**

**WebKit's own autoplay writing does not cover Web Audio or iframes at all.** [New `<video>` Policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) (2016-07-25) and [Auto-Play Policy Changes for macOS](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/) (2017-06-08) discuss media elements only — no Web Audio, no iframe, no cross-origin.

**Does a gesture inside a cross-origin/sandboxed iframe count? The only authoritative answer is spec-level.** [HTML *activation notification*](https://html.spec.whatwg.org/multipage/interaction.html), verbatim:

> "Let windows be « document's relevant global object ». Extend windows with the active window of each of document's **ancestor** navigables. Extend windows with the active window of each of document's **descendant** navigables, **filtered to include only those navigables whose active document's origin is same origin with document's origin**."

Consequences, per spec text:
- A tap **inside** the opaque frame activates that frame's own window **and every ancestor** → the frame *can* start audio.
- A tap in the **parent** does **not** reach the frame — an opaque origin is never same-origin with anything → the frame stays unactivated.

Note also that `resume()` gating is itself implementation-defined: [Web Audio](https://webaudio.github.io/web-audio-api/) says only "An `AudioContext` is said to be allowed to start if the user agent allows the context state to transition … **A user agent may disallow** this initial transition, and to allow it only when … has sticky activation."

⚠️ **No WebKit vendor doc** states the cross-origin non-propagation rule, and no WebKit bug matching "AudioContext + iframe" was found. This row rests entirely on the HTML spec.

### 4e. WebKit process model / site isolation — **in development, never announced as shipped**

- [docs.webkit.org "Site Isolation"](https://docs.webkit.org/Deep%20Dive/SiteIsolation.html): a "Site" is "the protocol and eTLD+1 (RegistrableDomain)"; "we put the content from a.com into a different process than the content from example.com." Status: **"As of January 2025 are currently on step 2 and looking forward to step 3"** of a three-step project. ⚠️ That status line is itself ~19 months stale.
- [Bug 287102 "Process isolation for cross-site frames (Site Isolation)"](https://bugs.webkit.org/show_bug.cgi?id=287102) — filed 2025-02-05, P1, **NEW**, rdar://22886580.
- The [Web Inspector explainer](https://docs.webkit.org/Deep%20Dive/Web%20Inspector/SiteIsolationExplainer.html) treats it as a mode, distinguishing "Mode 1: SI-disabled" from "Mode 2: SI-enabled" — it is not the default.
- Substantial open `[Site Isolation]` backlog with 2026 activity: 321255 (fullscreen state not cleared across processes), 317145, 318763, 317762, 311782, 285589, 273847.
- **Negative evidence:** no site-isolation or process-model mention in Safari 18.0, 18.2, 18.4, 26.0, 26.4, 26.5, 26.6 (2026-07-27), or 27 beta release notes.
- ⚠️ **Unanswered by any document:** whether a sandboxed/opaque-origin iframe gets its own WebContent process. WebKit's definition is keyed to *site* = protocol + eTLD+1; an opaque origin has no registrable domain, and no source addresses that case.

### 4f. iOS memory limits — **no published number**

State this plainly: **Apple does not publish a per-tab or per-WebContent-process memory limit.** No Apple or WebKit doc gives an MB figure; any number circulating is measured, not documented.

What *is* documented:
- [`webViewWebContentProcessDidTerminate(_:)`](https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)) — iOS 9.0+. "Web views use a separate process to render and manage web content. WebKit calls this method when the process for the specified web view terminates **for any reason**." Apple does **not** enumerate memory as a cause.
- Apple's ["Know iOS Resource Limits"](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html) is **archived, updated 2016-12-12**, and now qualitative (max eight open documents). The numeric table people cite is no longer present. Obsolete.
- Best documented description of the failure mode: [Bug 300782](https://bugs.webkit.org/show_bug.cgi?id=300782) (filed 2025-10-15, **NEW**) — "Pages with heavy WebGL usage and many textures get terminated by iOS memory pressure and immediately reloaded by Safari, causing an endless reload loop until the message 'A problem repeatedly occurred on…'". Reporter notes **no explicit OOM error surfaces to JavaScript** and **WebGL context-loss signals do not reliably fire before termination**; worse on lower-end devices. No MB threshold.
- Jetsam is device-dependent per bug titles: 316497 ("jetsams on iPhone but works on iPad"), 305622, 292715, 312727, 305772, 298097, 282379, 232122.
- ⚠️ The string **"A problem repeatedly occurred"** appears only in WebKit bug reports (11 hits), **not in any Apple documentation**.

**Documented failure chain:** Safari tab → WebContent jetsammed → Safari auto-reloads → repeats → "A problem repeatedly occurred". WKWebView → `webViewWebContentProcessDidTerminate(_:)` fires, view goes blank, **no automatic reload**.

### 4g. Touch / pointer events and iOS iframe quirks

| API | Safari | Safari iOS | WebView iOS |
|---|---|---|---|
| `PointerEvent` | 13 (2019-09-19) | **13** | 13 |
| `TouchEvent` | `false` (never on macOS) | **3.2** (2010-04-03) | 3.2 |

([PointerEvent BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.PointerEvent.json), [TouchEvent BCD](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.TouchEvent.json)). `getCoalescedEvents`/`getPredictedEvents`/`altitudeAngle`/`azimuthAngle` landed 18.2+.

**Passive listeners — Safari is the outlier.** [MDN `addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener), verbatim: "If this option is not specified it defaults to `false` – **except that in browsers other than Safari, it defaults to `true`** for `wheel`, `mousewheel`, `touchstart` and `touchmove` events" (on Window/Document/body). On iOS Safari these are **non-passive by default** and can `preventDefault()`.

**`-webkit-overflow-scrolling` is obsolete since Safari 13 (2019)** — [Safari 13 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes): "Added support for one-finger accelerated scrolling to all frames and `overflow:scroll` elements eliminating the need to set `-webkit-overflow-scrolling: touch`", and under Removed Features "Disabled `-webkit-overflow-scrolling: touch` on iPad." (⚠️ removal bullet says iPad, enabling bullet is general — mild ambiguity.) MDN has removed the property page (404); BCD has no key for it.

**The most important iOS iframe quirk for a game:**
- [Bug 213344 "Cross domain `<iframe>` animation throttling doesn't respond to touch events correctly"](https://bugs.webkit.org/show_bug.cgi?id=213344) — filed 2020-06-18, **NEW**. WebKit **caps `requestAnimationFrame` at 30fps for cross-origin iframes** until user interaction, and **only taps lift the throttle**: "If you quickly tap on the iFrame, it will start rendering at 60fps. However, if you swipe/drag/pan … it won't mark this as 'interacted' and stays at 30fps." Corroborated as shipped behavior by layout test `http/tests/frame-throttling/raf-throttle-in-cross-origin-subframe.html` (bug 211470, 2020-05-05). ⚠️ Whether an **opaque-origin** srcdoc frame is subject to the same throttle is not documented.
- [Bug 261390 "touchevents don't work correctly in iframes"](https://bugs.webkit.org/show_bug.cgi?id=261390) — filed 2023-09-10, **NEW**, reproduced iOS 16.6 and 17. Dragging inside an iframe fails when the page carries the standard `<meta name="viewport" content="width=device-width, initial-scale=1">`. WebKit engineer: "This might be related to `UIGestureRecognizer`s … being in a weird state… Maybe the event regions are not being computed correctly."
- Also open: 320457 (horizontally overflowing content never paints inside a nested iframe on iOS Safari), 307737 (click on DIV over IFRAME triggers touchStart on canvas inside), 301405 (pointer/touch events lost when writing).

---

## 5. Chrome on Android

### 5a. Site Isolation — **partial by default**

[chromium/src/docs/process_model_and_site_isolation.md](https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md), verbatim:
- Partial Site Isolation — "Used on: Chrome for Android (2+ GB RAM)."
- "On platforms like Android with more significant resource constraints, Chromium only uses dedicated (locked) processes for **some** sites, putting the rest in unlocked processes that can be used for any web site. (Note that there is a threshold of about 2 GB of device RAM required to support any level of Site Isolation on Android.)"
- "Chromium also isolates sites that users tend to log into in general, as well as sites on which a given user has entered a password, logged in via an OAuth provider, or encountered a Cross-Origin-Opener-Policy (COOP) header."
- Full Site Isolation — "can be enabled on Android using `chrome://flags/#enable-site-per-process`" (i.e. **not the default**).
- No Site Isolation — "Used on: Low-memory Chrome for Android (<2 GB RAM), Android WebView, Chrome for iOS."

Milestones ([chromium.org](https://www.chromium.org/Home/chromium-security/site-isolation/)): password sites since **Chrome 77** (stable 2019-09-10); OAuth + COOP since **Chrome 92** (stable 2021-07-20). ⚠️ That page carries **no last-updated date**.

Actual code thresholds ([site_isolation_policy.cc](https://raw.githubusercontent.com/chromium/chromium/main/components/site_isolation/site_isolation_policy.cc)): **3200 MB** for strict site isolation, **1900 MB** for partial modes ("thresholds roughly correspond to 2GB+ and 4GB+ devices"). `kSiteIsolationForPasswordSites` and `kSiteIsolationForOAuthSites` are `ENABLED_BY_DEFAULT` **on Android only** ([features.cc](https://raw.githubusercontent.com/chromium/chromium/main/components/site_isolation/features.cc)).

### 5b. `IsolateSandboxedIframes` on Android — **desktop-only by default**

The single authoritative statement, from the same process-model doc, "Special Cases", verbatim:

> "Documents with the sandbox attribute and without `allow-same-origin` (either iframes or popups) may be same-site with their parent or opener but use an opaque origin. **Since 127.0.6483.0, Desktop Chromium moves these documents into a separate process from their parent or opener. On Android, these documents will only be in a separate process if their parent/opener uses [Partial Site Isolation](#partial-site-isolation).**"

- Chrome **M127 stable = 2024-07-23**. Provenance: commit `70bba643fcd8656a479258e36c22ca2d0f9ef06e`, authored 2024-07-24, "IsolatedSandboxedIframes is on by default", **Bug: 40082497**; it replaced the older text "Chromium currently keeps these documents in the same process as their parent or opener, but this may change in bug 510122."
- ⚠️ **Ambiguity:** "if their parent/opener **uses** Partial Site Isolation" most plausibly means the parent's site is one actually locked under the heuristics (login/password/OAuth/COOP), not merely "device ≥2 GB." The doc does not disambiguate and has not been edited since 2024-07-24. **Either reading gives the same outcome for an ordinary non-login site: no dedicated process on Android.**
- **Flag location unresolved:** `kIsolateSandboxedIframes` is **absent** from `content/public/common/content_features.h` and `content/common/features.h` at `main` and at tag 127.0.6533.100; `chrome/browser/flag-metadata.json` has no `isolate-sandboxed-iframes` entry (no `chrome://flags` toggle). [`content/public/browser/site_isolation_policy.h`](https://raw.githubusercontent.com/chromium/chromium/main/content/public/browser/site_isolation_policy.h) *does* declare `AreIsolatedSandboxedIframesEnabled()`; the implementing `.cc` 404'd at every path tried, so the Android conditional could not be read in code. Most likely post-launch flag cleanup — **an inference, not verified.**
- **chromestatus has no entry** (queries returned `total_count: 0`) — expected, it's an internal process-model change, not a web-exposed API. Do not look for a chromestatus milestone.
- ⚠️ **Contradictory sibling doc:** [`docs/security/compromised-renderers.md`](https://raw.githubusercontent.com/chromium/chromium/main/docs/security/compromised-renderers.md) still states "Frames with `<iframe sandbox>` attribute are **not** isolated from their non-opaque precursor origin" — reads as pre-127 and conflicts with the process-model doc on desktop.
- **No bug-tracker status was verified anywhere in this survey:** `issues.chromium.org` returns a Google sign-in wall to automated fetches. crbug 510122 / issues 40082497 could not be read; **no revert can be ruled out.**

### 5c. Memory limits — **essentially undocumented**

- Every file in `docs/memory/` (`README.md`, `key_concepts.md`, `oom.md`, `android_dev_tips.md`) was checked: **none** contain Android renderer memory limits, per-process caps, LMK interaction, `oom_score_adj`, or numeric thresholds.
- The one documented Android statement, from the process-model doc: "On desktop platforms, Chromium sets a 'soft' process limit based on the memory available … **Chromium on Android does not set this soft process limit, and instead relies on the OS to discard processes.**" Android also "aggressively look[s] for existing same-site processes to reuse."
- `content/common/features.h` declares an Android-only `kSandboxedProcessServiceLimitOnAndroid`, `FEATURE_DISABLED_BY_DEFAULT`, undocumented beyond the name.
- **"Aw, Snap!" is not documented as a memory failure.** [Google support](https://support.google.com/chrome/answer/95669) says only "Chrome is having problems loading the page" — no causes, no memory attribution.
- Android OS side ([developer.android.com](https://developer.android.com/topic/performance/memory-management)) documents LMK and `oom_adj_score` ordering (background apps killed first, foreground/persistent/system last) but **no per-app or per-process memory limit**.
- JS heap ([v8/src/heap/heap.h](https://raw.githubusercontent.com/v8/v8/main/src/heap/heap.h)): `kDefaultMaxHeapSize` 4 GB on 64-bit / 1 GB on 32-bit; `kPhysicalMemoryToOldGenerationRatio = 4`. [heap.cc](https://raw.githubusercontent.com/v8/v8/main/src/heap/heap.cc): "`// Android requires 16GB of physical memory to reach the maximum of 4GB.`" with `kRatio = 4` on Android vs 2 elsewhere. The `IsHighEndAndroid`/`HeapLimitMultiplier` bodies were truncated, so concrete Android tier thresholds are not reported.
- **Explicitly not documented:** per-renderer memory ceilings on Android, the kill threshold, and the "Aw, Snap!" ↔ OOM mapping.

### 5d. Fullscreen on Android — supported

BCD `api.Element.requestFullscreen`: chrome **71**, `chrome_android: "mirror"`, `webview_android: "mirror"`. caniuse [`fullscreen.json`](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/fullscreen.json): and_chr 151 = full support.

⚠️ **Compat caveat:** `"mirror"` is BCD's automatic inheritance from the desktop counterpart per the [BCD schema doc](https://raw.githubusercontent.com/mdn/browser-compat-data/main/schemas/compat-data-schema.md) — a maintenance shortcut, **not an independently verified Android data point**.

Android quirks ([MDN Fullscreen guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)): "Fullscreen requests need to be called from within an event handler or otherwise they will be denied"; "Some mobile browsers while in fullscreen mode ignore viewport meta-tag settings and block user scaling"; and — relevant to debugging — "In Chrome and newer versions of Opera however, no such warning is generated" when a request fails (Firefox logs one).

[`docs/security/fullscreen.md`](https://raw.githubusercontent.com/chromium/chromium/main/docs/security/fullscreen.md) exists but is a desktop security FAQ — nothing on iframes, sandboxed frames, permissions policy, activation, or Android.

### 5e. Pointer Lock on Android — **the answer changed in Chrome 144; sources disagree**

- **Historic:** [chromestatus 6753200417800192](https://chromestatus.com/api/v0/features/6753200417800192) "Pointer Lock (Mouse Lock)" — Desktop 23; Android/WebView/iOS **Not supported**; explicit note "**Chrome on Android does not support this API.**" Last updated **2025-08-23** → now stale.
- **Now:** [chromestatus 6739764319485952](https://chromestatus.com/api/v0/features/6739764319485952) "Pointer Lock on Android" — `browsers.chrome.android: 144`, `flag_name: null`, **`finch_name: "PointerLockOnAndroid"`**, tracking bug issues.chromium.org/40290045, created 2025-12-02, updated 2026-02-10.
- **Confirmed by release notes:** "Pointer lock on Android" is listed under *User input* in [developer.chrome.com/release-notes/144](https://developer.chrome.com/release-notes/144). **Chrome 144 stable = 2026-01-13.**
- Corroborated independently by BCD `html.elements.iframe.sandbox` → `allow-pointer-lock` **chrome_android: 144** (an explicit value, not a mirror).
- ⚠️ **Conflicts:** chromestatus `status.text` is still "Proposed" while release notes say shipped. `finch_name` with `flag_name: null` indicates a **Finch-controlled rollout** with no documented rollout percentage. **caniuse [`pointerlock.json`](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/pointerlock.json) still records `and_chr: {"151": "n"}` — stale.** BCD `api.Element.requestPointerLock` says `chrome_android: "mirror"` → asserts Android 37+, which was **never true** historically.
- `unadjustedMovement` on Android: **not shipped** (chromestatus 5723553087356928, Desktop 81 only).
- Watch item: chromestatus 5142031990259712 "Keyboard Lock and Pointer Lock **permissions**" — "In developer trial (Behind a flag)", would add a user prompt in front of pointer lock.
- **Sandbox gate applies regardless of platform support:** Chromium maps `{"allow-pointer-lock", kPointerLock}` in [`web_sandbox_flags.cc`](https://raw.githubusercontent.com/chromium/chromium/main/services/network/public/cpp/web_sandbox_flags.cc); with `sandbox="allow-scripts"` only, `kPointerLock` stays set.

### 5f. `screen.orientation.lock()` on Android

- BCD `api.ScreenOrientation.lock`: **`chrome_android: 38`** (real value). Desktop `chrome: 38` but `partial_implementation: true`, note **"Always throws `NotSupportedError`"**. `safari: false`. Firefox 43→144 partial ("Always throws NotSupportedError"), then 144; Firefox Android 43 → 79 partial → 144.
- **Fullscreen is required on Android, confirmed in code:** [`screen_orientation_delegate_android.cc`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/screen_orientation/screen_orientation_delegate_android.cc) — `bool ScreenOrientationDelegateAndroid::FullScreenRequired(...) { return true; }`; [`screen_orientation_provider.cc`](https://raw.githubusercontent.com/chromium/chromium/main/content/browser/screen_orientation/screen_orientation_provider.cc) returns `SCREEN_ORIENTATION_LOCK_RESULT_ERROR_FULLSCREEN_REQUIRED` if not fullscreen. The requirement comes entirely from the Android delegate — there are no `IS_ANDROID` conditionals in the provider.
- Spec agrees ([Screen Orientation](https://w3c.github.io/screen-orientation/)): "A user agent **MUST** restrict the use of `lock()` to simple fullscreen documents as a pre-lock condition"; and "If document has the sandboxed orientation lock browsing context flag set, throw `SecurityError`."
- Chromium implements the sandbox flag: [`web_sandbox_flags.mojom`](https://raw.githubusercontent.com/chromium/chromium/main/services/network/public/mojom/web_sandbox_flags.mojom) — `kOrientationLock = 1024`, `kPointerLock = 256`, `kScripts = 16`, `kOrigin = 4`. **There is no `kFullscreen` sandbox flag** — fullscreen is governed by Permissions Policy only.
- Sandbox keyword support elsewhere (BCD `iframe.sandbox`): `allow-orientation-lock` — Chrome 68, Firefox ≤49, **Safari: not supported**. `allow-presentation` — **Safari: not supported**.

---

## 6. Permissions Policy defaults for an opaque-origin child frame

### 6a. The mechanism (spec, [w3c.github.io/webappsec-permissions-policy](https://w3c.github.io/webappsec-permissions-policy/))

**Allowlist matching, verbatim — note the step order:**

> 1. "If the allowlist is the special value `*`, then return true."
> 2. "If the allowlist's **self-origin** is not null and it is same origin-domain with origin, then return true."
> 3. "If the allowlist's **src-origin** is not null and it is same origin-domain with origin, then return true."
> 4. **"If origin is an opaque origin, return false."**

**Declared origin (what `'src'` resolves to), verbatim:**

> 1. "If node's node document's sandboxed origin browsing context flag is set, then return a new opaque origin."
> 2. **"If node's `sandbox` attribute is set, and does not contain the `allow-same-origin` keyword, then return a new opaque origin."**
> 3. "If node's `srcdoc` attribute is set, then return node's node document's origin."
> …

Step 2 precedes the `srcdoc` step, so for `<iframe srcdoc sandbox="allow-scripts">` the declared origin is **a new opaque origin** — a *different* opaque origin from the frame's own, and opaque origins are only same-origin with themselves. Two independent mechanisms therefore kill `'src'` matching. The spec's own note: sandboxed iframes get opaque origins, "meaning allowlists using `'src'` or `'self'` won't match — only `*` wildcard allowlists will apply to them."

**For `<iframe>` `allow` attributes the default is always `'src'`** ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy)).

### 6b. The resulting table

| Feature | Default allowlist | Granted to an opaque child with **no** `allow`? | How to grant it |
|---|---|---|---|
| **`fullscreen`** | **`'self'`** — [Fullscreen spec](https://fullscreen.spec.whatwg.org/): "Its default allowlist is `'self'`" | **No** | `allowfullscreen`, which the spec defines as **"equivalent to `<iframe allow="fullscreen *">`"** → allowlist `*` → matches at step 1. Bare `allow="fullscreen"` (≡ `'src'`) does **not**. |
| **`autoplay`** | **`'self'`** ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/autoplay)) | **No** | `allow="autoplay *"`. Bare `allow="autoplay"` does not. |
| **`gamepad`** | **`*`** — [Gamepad spec](https://w3c.github.io/gamepad/): "Its default allowlist is `*`" | **Yes** — `*` returns true at step 1, *before* the opaque check at step 4 | nothing needed |
| **`pointer-lock`** | **does not exist** — not in the [50-directive MDN index](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy); [Pointer Lock 2.0](https://w3c.github.io/pointerlock/) defines no policy-controlled feature | n/a | the `allow-pointer-lock` **sandbox** token is the only gate |
| `screen-wake-lock` | `'self'` (standardized) | No | `allow="screen-wake-lock *"` |

`gamepad` is a **proposed**, not standardized, feature in the [W3C features registry](https://github.com/w3c/webappsec-permissions-policy/blob/main/features.md); `fullscreen`, `autoplay`, `screen-wake-lock` are standardized.

### 6c. Error shapes when blocked

- `fullscreen`: `requestFullscreen()` rejects with **`TypeError`** (not `NotAllowedError`) — Fullscreen spec sets `error` when "element's node document is [not] allowed to use the `fullscreen` feature". Also requires transient activation.
- `gamepad`: "If doc is not allowed to use the 'gamepad' permission, then **throw a `SecurityError`**"; and `gamepadconnected`/`gamepaddisconnected` do not fire. Independently, "To mitigate fingerprinting, `getGamepads()` returns an **empty list** before a gamepad user gesture has been seen."
- `autoplay`: `HTMLMediaElement.play()` rejects with a `DOMException` (MDN does not name the subtype); the `autoplay` attribute is ignored.
- `pointer-lock` (sandbox flag): fire `pointerlockerror` **and** reject with `SecurityError`.
- `orientation lock` (sandbox flag): throw `SecurityError`.

### 6d. Firefox caveat that breaks this table

**Firefox does not implement the `Permissions-Policy` HTTP header at all** (BCD `version_added: false`; [bug 1694922](https://bugzilla.mozilla.org/rest/bug?quicksearch=Permissions-Policy%20header) NEW, last touched 2026-07-11). Only `<iframe allow>` (FF 74+) and `allowfullscreen` (FF 18+) function. And [bug 1508123](https://bugzilla.mozilla.org/rest/bug/1508123/comment) — `'src'` allowlist in sandboxed iframes — has been **NEW since 2018** with ambiguous partial-implementation comments, so Firefox's `'src'` behavior for opaque frames should not be assumed spec-conformant.

---

## 7. Conflicts, staleness, and gaps to carry into the matrix

| # | Item | Nature |
|---|---|---|
| 1 | **Chrome Android pointer lock** — chromestatus + Chrome 144 release notes + BCD `allow-pointer-lock` (chrome_android 144) say **shipped 2026-01-13**; caniuse still says `and_chr 151 = "n"`. Resolution: **caniuse is stale**, but it is Finch-gated (`PointerLockOnAndroid`) with no documented rollout %, and chromestatus still labels it "Proposed" | sources disagree |
| 2 | **BCD internal contradiction on WebView iOS fullscreen**: `Element.requestFullscreen` → `false`; `iframe.allowfullscreen` → `12 (partial, iPad-only)` | sources disagree |
| 3 | **BCD vs Apple on WKWebView fullscreen**: BCD unsupported; Apple ships `isElementFullscreenEnabled` since iOS 15.4 | sources disagree |
| 4 | **Safari 26.4 note says "on iOS"** where every other source says iPadOS-only. Do not read as iPhone support | ambiguous |
| 5 | **Chromium `compromised-renderers.md`** still says sandboxed iframes "are not isolated from their non-opaque precursor origin", contradicting the process-model doc post-127 | stale |
| 6 | **Android `IsolateSandboxedIframes` sentence** ("if their parent/opener uses Partial Site Isolation") unedited since 2024-07-24, two readings — same practical outcome | ambiguous |
| 7 | **BCD gamepad note** claims the spec default allowlist is `'self'`; spec and MDN both say `*` | stale BCD note |
| 8 | **MDN `Element.requestFullscreen` Security section** says "The default allowlist for **`screen-wake-lock`** is `self`" mid-fullscreen discussion — copy-paste bug (independently spotted by two agents) | MDN error |
| 9 | **MDN Autoplay guide** says `media.autoplay.default` defaults to `0` (allowed), contradicting Firefox 66 shipping blocking by default | stale |
| 10 | **`dom.max_content_script_run_time`** — zero Bugzilla hits, absent from pref files. Probably **not a Firefox pref**; the real companion is `dom.max_chrome_script_run_time` | premise correction |
| 11 | **MDN documents none of the opaque-origin storage behavior** — localStorage, IDBFactory.open, Window.caches, Document.cookie all silent on it | doc gap |
| 12 | **WebKit site isolation status line** ("As of January 2025 … step 2") is ~19 months stale, though 2026 bug traffic is consistent | stale |
| 13 | **No published iOS memory limit**; "A problem repeatedly occurred" exists only in WebKit bug text, never in Apple docs; Apple's resource-limits page is from 2016-12-12 | doc gap |
| 14 | **No Chromium doc gives Android per-renderer memory limits**, and "Aw, Snap!" is never attributed to memory | doc gap |
| 15 | **No WebKit doc anywhere addresses opaque-origin frames** — every WebKit statement says "cross-origin"/"cross-site". Fullscreen policy resolution, rAF throttling, process assignment, autoplay: all inference | doc gap |
| 16 | **Gecko: Fission docs never mention sandboxed iframes, null principals, opaque origins, or `about:srcdoc`** | doc gap |
| 17 | **No WebKit or Mozilla doc** states whether a gesture in a cross-origin iframe counts for audio; rests entirely on HTML spec activation-notification text | doc gap |
| 18 | **WebKit's `gamepad` Permissions Policy support is undocumented** — no BCD entry, no release note | doc gap |
| 19 | **`webkitEnterFullscreen()` has no live documentation** — 404 on MDN, absent from BCD | doc gap |
| 20 | **`allowed by sandboxing to navigate` algorithm body could not be retrieved** — spec pages truncated on every attempt; §1c rests on the flag definition | retrieval limit |
| 21 | **CacheStorage `caches` getter spec steps could not be retrieved** — Service Worker spec truncated, both bikeshed paths failed; §2 rests on the Storage spec + WPT | retrieval limit |
| 22 | **No Chromium bug-tracker status verified anywhere** — `issues.chromium.org` requires sign-in. crbug 510122 / 40082497 unread; a revert cannot be ruled out | retrieval limit |

## 8. Two findings worth pulling out

**Sandbox keyword support itself is not universal** (BCD [`html.elements.iframe.sandbox`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/html/elements/iframe.json)) — the token may be silently ignored:
- `allow-pointer-lock`: **Safari iOS not supported**; Chrome Android 144
- `allow-orientation-lock`: **Safari not supported**
- `allow-presentation`: **Safari not supported**
- `allow-top-navigation-to-custom-protocols`: **Chrome not supported**; Firefox 101, Safari 16
- `allow-same-origin` note: "Firefox blocks script execution without `allow-scripts` even if `allow-same-origin` is set"

**User activation direction is asymmetric.** Per [HTML activation notification](https://html.spec.whatwg.org/multipage/interaction.html), activation flows to **all ancestors unconditionally** but to **descendants only when same-origin**. A tap inside the opaque frame activates the frame *and* the whole ancestor chain; a tap in the parent never reaches the frame. This one rule governs the audio, fullscreen, and pointer-lock rows simultaneously, and it is spec-only — no vendor documents it.
