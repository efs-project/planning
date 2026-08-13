# Recovered Claude memo — WebKit/iOS Safari behavior docs

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:51:59.708Z
**Claude task:** `a3dcdfae8c32966fa`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3547
**Original result length:** 36575 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
Research complete. WebSearch was unavailable (session budget exhausted at 200/200), so everything below comes from directly-fetched primary URLs — MDN's live BCD endpoint, webkit.org, developer.apple.com, docs.webkit.org, bugs.webkit.org, and the WHATWG/W3C specs. Two pages I could not read are flagged at the end.

---

# Safari / WebKit documented behavior for a game in an opaque-origin iframe

**Framing note:** `<iframe srcdoc sandbox="allow-scripts">` produces a document whose origin is opaque — MDN: *"If this token [`allow-same-origin`] is not used, the resource is treated as being from a special origin that always fails the same-origin policy"* ([MDN/vendor doc](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)). **No vendor document I found ever names "opaque-origin sandboxed iframe" explicitly.** Every WebKit source below talks about "cross-origin" or "cross-domain" frames. Applying those to an opaque-origin frame is an inference, and I flag it each time.

---

## 1. Fullscreen on iOS

### 1a. `Element.requestFullscreen()` — iPhone vs iPad

| Target | Documented state |
|---|---|
| Safari (macOS) | **16.4**, 2023-03-27 (unprefixed). `webkit`-prefixed since 5.1, 2011-07-20 |
| Safari on iOS | **16.4**, 2023-03-27 — but `partial_implementation: true`, **"Only available on iPad, not on iPhone."** Prefixed: iOS 12, 2018-09-17, same iPad-only note |
| WebView on iOS (WKWebView) | `version_added: false` |

[MDN/vendor doc — live BCD] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestFullscreen.json

The second BCD note is directly on point for your use case, verbatim: **"Shows an overlay button which can not be disabled. Swiping down exits fullscreen mode, making it unsuitable for some use cases like games."**

`Document.fullscreenEnabled` and `Document.exitFullscreen` carry **identical** data — Safari 16.4 / Safari iOS 16.4 partial + iPad-only + same two notes / WebView iOS `false`:
- [MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Document.fullscreenEnabled.json
- [MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Document.exitFullscreen.json

**Apple's own wording confirms the iPad/iPhone split by omission.** Safari 16.4 release notes, Web API section: *"Added support for the unprefixed Fullscreen API on macOS and iPadOS."* — while the same notes' Overview says Safari 16.4 shipped for *"macOS Big Sur, macOS Monterey, macOS Ventura, iPadOS 16.4, and iOS 16.4."* iOS is named as a shipping platform but **not** as a fullscreen platform.
[MDN/vendor doc] https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes

Same split in the WebKit blog (published 2023-03-27): *"Safari 16.4 now supports the updated and unprefixed Fullscreen API on macOS and iPadOS."*
[WebKit blog] https://webkit.org/blog/13966/webkit-features-in-safari-16-4/

**Current state (checked through Safari 27 beta):** still no iPhone element fullscreen.
- Bug **206854, "Add Fullscreen API to iOS"** — filed 2020-01-27, **status NEW, unresolved**, P2/Enhancement. Original report: *"the fullscreen API was an experimental setting. It has since been removed entirely on iOS, while iPadOS retains prefixed support."* A **June 2026** comment: *"I've just checked the WWDC26 Safari 27 beta notes and there's still nothing for element fullscreen on iPhone."*
  [bug tracker] https://bugs.webkit.org/show_bug.cgi?id=206854
- Safari 26.0 release notes (2025-09-15) mention fullscreen only as three *Resolved Issues* (focus-triggered exit, event dispatch queueing) — no iPhone support. [MDN/vendor doc] https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes · [WebKit blog] https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- Safari 27 beta (WWDC26, published 2026-06-08): no fullscreen/iPhone item. [WebKit blog] https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/

**Newer fullscreen items worth having in the matrix:**
- Safari **26.4** (2026-03-24) shipped **Keyboard Lock scoped to fullscreen**: *"The Keyboard Lock API lets you request access to specific keys when your application needs it. A game can now use the Escape key for its own menu system"* — `element.requestFullscreen({ keyboardLock: "browser" })`, HTTPS-only, auto-released on fullscreen exit or tab switch. Same notes: *"Fixed `Element.requestFullscreen` on iOS to correctly reflect hardware keyboard attachment state during fullscreen sessions and exit automatically when the keyboard is detached."*
  [WebKit blog] https://webkit.org/blog/17862/webkit-features-for-safari-26-4/
  ⚠️ **Ambiguity:** that fix says "on iOS", not "iPadOS", which reads inconsistently against every other source saying element fullscreen doesn't exist on iPhone. Most likely it means iPadOS (BCD's `safari_ios` bucket covers both). Don't treat it as evidence of iPhone support.

### 1b. WKWebView — sources disagree

BCD says `webview_ios: false` for `requestFullscreen`/`exitFullscreen`/`fullscreenEnabled`. Apple, however, documents an opt-in switch: **`WKPreferences.isElementFullscreenEnabled`**, available **iOS/iPadOS/Mac Catalyst 15.4, macOS 12.3, visionOS 1.0**, **default `false`**, with the warning *"When this value is `true` and a page requests full-screen mode, the system removes the `WKWebView` from your app's view hierarchy."*
[MDN/vendor doc] https://developer.apple.com/documentation/webkit/wkpreferences/iselementfullscreenenabled

⚠️ **Flag this disagreement.** Apple's API exists on iOS since 15.4; MDN records WebView-iOS support as absent. Most probable reconciliation is that the property exists but the underlying capability is still iPad-only — but I found no doc stating that. Treat WKWebView-on-iPhone fullscreen as undocumented.

### 1c. `HTMLVideoElement.webkitEnterFullscreen()`

**Essentially undocumented in current sources.** It is **not in MDN at all**: `/Web/API/HTMLVideoElement/webkitEnterFullscreen` returns HTTP 404, and the BCD `api.HTMLVideoElement` bundle contains **no** `webkitEnterFullscreen`, `webkitExitFullscreen`, `webkitSupportsFullscreen`, or `webkitDisplayingFullscreen` key (the bundle has only `playsInline`, `requestPictureInPicture`, `requestVideoFrameCallback`, etc.).
[MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.HTMLVideoElement.json

What *is* documented is the underlying **video-only fullscreen model on iPhone**:
- WebKit, 2016-07-25: *"`<video playsinline>` elements will now be allowed to play inline, and will not automatically enter fullscreen mode"*; elements without it *"will continue to require fullscreen mode for playback on iPhone."*
  [WebKit blog] https://webkit.org/blog/6784/new-video-policies-for-ios/
- Apple (archived, revised 2016-12-12): *"Safari optimizes video presentation for the smaller screen on iPhone or iPod touch by playing video using the full screen… Video is not presented within the webpage."* vs *"On Mac OS X, Windows, and iPad, Safari plays video inline, embedded in the webpage."*
  [MDN/vendor doc, stale] https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html

So: **native video fullscreen on iPhone is documented; the `webkitEnterFullscreen()` method itself has no live vendor or MDN documentation.** Apple has a legacy WebKitJS reference page for it, but its body was not retrievable (see "Could not read" below).

### 1d. Fullscreen inside an iframe

- [spec] Fullscreen Standard: *"This specification defines a policy-controlled feature identified by the string 'fullscreen'. Its default allowlist is 'self'."* and *"To enable content in a child navigable to go fullscreen, it needs to be specifically allowed via permissions policy, either through the `allowfullscreen` attribute of the HTML iframe element, or an appropriate declaration in the `allow` attribute."* `requestFullscreen()` requires *"the relevant global object has transient activation"*. https://fullscreen.spec.whatwg.org/
- [MDN/vendor doc] `requestFullscreen()`: element *"must either be located within the top-level document or in an `<iframe>` which has the `allowfullscreen` attribute applied to it"*; **"Transient user activation is required."** https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- [MDN/vendor doc] `<iframe>`: *"`allowfullscreen` … **Note:** This attribute is considered a legacy attribute and redefined as `allow="fullscreen *"`."* Also: *"A Permissions Policy specified by the `allow` attribute implements a further restriction on top of the policy specified in the `Permissions-Policy` header. It doesn't replace it."* https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- iframe `allow` attribute support in WebKit: **Safari 11.1 (2018-04-12), Safari iOS 11.3 (2018-03-29), WebView iOS 11.3**. [MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json
- ⚠️ **Internal BCD inconsistency:** `html.elements.iframe.allowfullscreen` reports **WebView iOS 12 (partial, iPad-only, same notes)** — while `api.Element.requestFullscreen` reports WebView iOS `false`. Same dataset, contradictory. https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allowfullscreen.json
- **Undocumented:** how the `'self'` default allowlist resolves for an **opaque** origin. MDN's "redefined as `allow="fullscreen *"`" implies `allowfullscreen` covers any origin including opaque, but no source states this for sandboxed frames. Also note the HTML sandbox flag set has **no** fullscreen token (unlike `allow-pointer-lock`), so sandboxing alone is not documented as a fullscreen blocker.

---

## 2. Pointer Lock

| Target | Documented state |
|---|---|
| Safari (macOS) | **10.1**, 2017-03-27. BCD note: *"From version 18.4, returns a promise instead of undefined. The behavior reflects a specification change."* `options.unadjustedMovement` from **18.4** |
| Safari on iOS | **`version_added: false`** |
| WebView on iOS | **`version_added: false`** |

[MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestPointerLock.json

- **Not behind a flag on macOS** — shipped in Safari 10.1 and referenced in normal release notes since. Safari 18.4 (2025-03-31): *"`HTMLElement.prototype.requestPointerLock` to return a Promise."* [WebKit blog] https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- Safari 18.2 (2024-12-09) fixed *"the Pointer Lock API to work when Fullscreen API is enabled."* [WebKit blog] https://webkit.org/blog/16301/webkit-features-in-safari-18-2/
- **iOS: does not exist.** Bug **216621, "[iOS, iPad and VisionOS] Implement support for Pointer Lock API"** — filed 2020-09-16, **status NEW, unresolved**, most recent comment **July 2026**. Related: bug **297558 "Pointer Lock WPTs should not be skipped on iOS"** (NEW), bug 296955 (`[iOS] Pointer lock should disengage when client windows present a sheet`, NEW).
  [bug tracker] https://bugs.webkit.org/show_bug.cgi?id=216621 · https://bugs.webkit.org/buglist.cgi?quicksearch=pointer%20lock%20iOS

**Sandbox gating** — relevant even on macOS, and it is a hard blocker for `sandbox="allow-scripts"` alone:
- [spec] Pointer Lock 2.0: request fails with `SecurityError` *"If this's node document's active sandboxing flag set has the sandboxed pointer lock browsing context flag set"*. Also *"If the relevant global object does not have transient activation and the Document has not previously released a successful pointer lock"* → `NotAllowedError`; and *"When a single user activation initiates both pointer lock and fullscreen, the `requestPointerLock()` call succeeds only when made before a fullscreen request."* https://w3c.github.io/pointerlock/
- [MDN/vendor doc] *"The `allow-pointer-lock` sandbox token must be added when calling `requestPointerLock()` in an `<iframe>` element"* and *"No other elements in other `<iframe>` elements may be in pointer lock mode simultaneously."* https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock

---

## 3. Gamepad API

| Target | Documented state |
|---|---|
| Safari (macOS) | **10.1**, 2017-03-27 |
| Safari on iOS | **10.3**, 2017-03-27 |
| WebView on iOS | **10.3**, 2017-03-27 |

Identical values for both the `Gamepad` interface and `Navigator.getGamepads()`:
[MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Gamepad.json · https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Navigator.getGamepads.json

WebKit release-note trail:
- Safari 16.4 (2023-03-27): *"Added support for `gamepad.vibrationActuator`."* [MDN/vendor doc + WebKit blog] https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes · https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- Safari 18.0 (2024-09-16), Web Views: *"Fixed Gamepad API in WKWebView"* [WebKit blog] https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- Safari 18.4 (2025-03-31): rumble fix — sequential `playEffect()` requests preventing `reset()` [WebKit blog] https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
- Safari 27 beta (2026-06-08): *"Fixed an issue on visionOS where the `gamepadconnected` event did not fire unless gamepad permission had already been granted."* [WebKit blog] https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/ — the only WebKit note implying a permission gate, and it is visionOS-specific.

**Permissions-Policy `gamepad`:**
- [spec] W3C Gamepad: *"This specification defines a policy-controlled feature identified by the string 'gamepad'. Its default allowlist is `*`."* and *"If disabled in any document, no content in the document will be allowed to use `getGamepads()`, nor will the `gamepadconnected` and `gamepaddisconnected` events fire."* Also, fingerprinting mitigation: *"To mitigate fingerprinting, `getGamepads()` returns an empty list before a gamepad user gesture has been seen."* https://w3c.github.io/gamepad/
- [MDN/vendor doc] Confirms default `*`; when blocked, `getGamepads()` throws `SecurityError`. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/gamepad

Because the default allowlist is `*`, an embedded frame is permitted by default unless the embedder sends a restricting header. **⚠️ Undocumented:** whether WebKit implements the `gamepad` permissions policy at all — I found no BCD entry, release note, or WebKit doc for it.

---

## 4. WebAudio autoplay / user-gesture policy

**AudioContext requires a gesture — documented in BCD, all three WebKit targets carry the same note:**
> Safari **14.1** (2021-04-26), Safari iOS **14.5**, WebView iOS **14.5** — *"New audio contexts are suspended until the `resume()` method is called via user action, such as the click event."*

[MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.AudioContext.json

**WebKit's own autoplay writing does not cover Web Audio or iframes at all** — this is the notable gap:
- *New `<video>` Policies for iOS* (2016-07-25): covers `<video>`/`<audio>` only — muted/no-audio autoplay allowed, `play()` returns a rejecting Promise otherwise, `playsinline`, and gestures must *"directly result from touch, click, double-click, or keydown events"*. No mention of Web Audio, iframes, or cross-origin. [WebKit blog] https://webkit.org/blog/6784/new-video-policies-for-ios/
- *Auto-Play Policy Changes for macOS* (2017-06-08): *"Safari in macOS High Sierra uses an automatic inference engine to block media elements with sound from auto-playing by default on most websites."* Again **no** Web Audio, **no** iframe/cross-origin discussion. [WebKit blog] https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/

**Does a gesture in a cross-origin / sandboxed iframe count? The only authoritative answer is spec-level, not WebKit-level.**

[spec] HTML Standard, *activation notification* steps (run before the input event dispatches):
> *"Let windows be « document's relevant global object ». Extend windows with the active window of each of document's **ancestor** navigables. Extend windows with the active window of each of document's **descendant** navigables, **filtered to include only those navigables whose active document's origin is same origin with document's origin**."*

https://html.spec.whatwg.org/multipage/interaction.html

Consequences for your case, per spec text:
- A tap **inside** the sandboxed frame activates that frame's window **and all ancestors** → the frame can start audio.
- A tap in the **parent** does **not** reach the frame, because an opaque origin is never same-origin with the parent → the frame stays unactivated.

The same page defines *sticky activation* (once true, stays true for the window's lifetime) and *transient activation* (expires after the transient activation duration).

**Permissions-Policy layer, on top of activation:**
- [MDN/vendor doc] `autoplay` default allowlist is **`self`** — so cross-origin (and by extension opaque-origin) frames are not permitted by default; when blocked, `HTMLMediaElement.play()` rejects with a `DOMException` and the `autoplay` attribute is ignored. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/autoplay
- [MDN/vendor doc] Autoplay guide: *"By default, the `autoplay` Permissions Policy is set to `self`"*; *"The specified Permissions Policy applies to the document and every `<iframe>` nested within it, unless those frames include an `allow`, which sets a new Permissions Policy for that frame."* It explicitly does **not** address sandboxed/opaque-origin frames or whether AudioContext is covered. https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

⚠️ **Flag:** I found **no WebKit vendor documentation** on user activation not propagating into cross-origin iframes, and **no** WebKit bug matching "AudioContext + iframe" (the three hits were unrelated test-infrastructure bugs). The cross-origin non-propagation claim rests entirely on the HTML spec. Whether WebKit implements the `autoplay` permissions policy for Web Audio specifically is undocumented.

---

## 5. WebKit process model / site isolation

**Current documented status: in active development, never announced as shipped or default-on, as of Safari 26.6 (2026-07-27) and Safari 27 beta (2026-06-08).**

- [vendor doc] **docs.webkit.org "Site Isolation"** — the authoritative WebKit page. A "Site" is *"the protocol and eTLD+1 (RegistrableDomain)"*, so `http://` vs `https://` are different sites and subdomains share one. *"With site isolation on, though, we put the content from a.com into a different process than the content from example.com."* Status: *"**As of January 2025** are currently on step 2 and looking forward to step 3"* of a three-step project; architecture uses `RemoteFrame`, `BrowsingContextGroup`, `ProvisionalFrameProxy`. https://docs.webkit.org/Deep%20Dive/SiteIsolation.html
- [bug tracker] Public tracking bug **287102, "Process isolation for cross-site frames (Site Isolation)"** — filed **2025-02-05**, assignee achristensen, **P1, status NEW**, keyword InRadar (rdar://22886580). Filed deliberately as non-security architectural work. https://bugs.webkit.org/show_bug.cgi?id=287102
- [bug tracker] Substantial open `[Site Isolation]` backlog with 2026 activity — e.g. **321255** *"Fullscreen state is not cleared across processes when a site-isolated frame in the fullscreen chain unloads"* (NEW, modified this week), **317145** *"[Site Isolation] Iframe back/forward routing misroutes…"* (2026-06-22), 318763, 317762, 311782, 285589, 273847. https://bugs.webkit.org/buglist.cgi?quicksearch=site%20isolation
- [vendor doc] Web Inspector explainer confirms it is a mode, not a default: it distinguishes *"Mode 1: SI-disabled"* and *"Mode 2: SI-enabled"*, and notes *"a `WebPageProxy` may have its frames distributed across several WebContent Processes."* https://docs.webkit.org/Deep%20Dive/Web%20Inspector/SiteIsolationExplainer.html
- [vendor doc] Baseline architecture (no site isolation): *"Web pages are loaded in its own WebContent process"*; *"Multiple WebContent processes can share a browsing session, which lives in a shared network process."* The page explicitly does **not** document per-tab vs per-origin allocation or iframe handling (it carries `FIXME` placeholders). https://docs.webkit.org/Deep%20Dive/Architecture/WebKit2.html
- **Negative evidence:** no mention of site isolation or process model in Safari 18.0 (2024-09-16), 18.2 (2024-12-09), 18.4 (2025-03-31), 26.0 (2025-09-15), 26.4 (2026-03-24), 26.5 (2026-05-11), 26.6 (2026-07-27), or Safari 27 beta (2026-06-08). Nor in the Safari 26.0 release notes on developer.apple.com.

⚠️ **Directly unanswered by any document:** whether a **sandboxed / opaque-origin** iframe gets its own WebContent process. WebKit's definition is keyed to *site* = protocol + eTLD+1; an opaque origin has no registrable domain, and no source addresses that case.

---

## 6. iOS memory limits

**State this plainly in your matrix: Apple does not publish a per-tab or per-WebContent-process memory limit.** I found no Apple or WebKit document giving an MB figure; it is widely described in bug reports as device-dependent. Anything you have seen as a specific number (e.g. "X MB on iPhone") is measured, not documented.

What *is* documented:

- [MDN/vendor doc] **`WKNavigationDelegate.webViewWebContentProcessDidTerminate(_:)`** — iOS/iPadOS **9.0+**, Mac Catalyst 13.1+, macOS 10.11+, visionOS 1.0+. Abstract: *"Tells the delegate that the web view's content process was terminated."* Discussion: *"Web views use a separate process to render and manage web content. WebKit calls this method when the process for the specified web view terminates **for any reason**."* Apple **does not enumerate memory as a cause** anywhere on that page. https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)
- [MDN/vendor doc, **stale**] Apple's archived *"Know iOS Resource Limits"* (Safari Web Content Guide, **updated 2016-12-12**) is qualitative — bandwidth/image-sizing advice plus a maximum of **eight** open documents. The numeric limits table people cite from older editions did not appear in the current archived page. Treat as obsolete. https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html
- [bug tracker] **Bug 300782, "iOS Safari reload loop under memory pressure with WebGL/texture-heavy pages"** — filed **2025-10-15**, NEW, iOS 18, multiple devices. This is the best documented description of the OOM failure mode: *"Pages with heavy WebGL usage and many textures get terminated by iOS memory pressure and immediately reloaded by Safari, causing an endless reload loop until the message 'A problem repeatedly occurred on…'"*. Reporter also states **no explicit OOM error surfaces to JavaScript**, and **WebGL context-loss signals do not reliably fire before termination**; the problem *"occurs more readily on lower-end devices with less available memory."* No MB threshold given. https://bugs.webkit.org/show_bug.cgi?id=300782
- [bug tracker] Jetsam is device-dependent, per bug titles: **316497** *"Convert PDF to images jetsams on iPhone but works on iPad"*; also 312727, 305772, 305622 (*"Fix WebContent jetsam when pinch-zooming reddit.com"*), 298097, 292715 (*"WebKit.GPU crashes due to memory usage on iOS when playing multiple WebM/VP8 video streams"*), 282379, 232122. None state an MB limit. https://bugs.webkit.org/buglist.cgi?quicksearch=jetsam%20memory
- [bug tracker] The **"A problem repeatedly occurred"** string appears only in WebKit bug reports (11 hits: 314551 large WebAssembly + multithreading, 305052 zoom crash on iOS 26, 300782, 285092, 279637, 256703 Wasm jetsam…), **not in any Apple documentation I could find.** https://bugs.webkit.org/buglist.cgi?quicksearch=%22problem%20repeatedly%20occurred%22

**Documented failure chain:** Safari tab → WebContent process jetsammed → Safari auto-reloads → repeats → "A problem repeatedly occurred". WKWebView → `webViewWebContentProcessDidTerminate(_:)` fires, web view goes blank, **no automatic reload** (the delegate exists precisely so the app reloads).

---

## 7. Touch / pointer events, iframes, scrolling

### Baseline support
| API | Safari | Safari iOS | WebView iOS |
|---|---|---|---|
| `PointerEvent` | **13** (2019-09-19) | **13** (2019-09-19) | **13** (2019-09-19) |
| `TouchEvent` | `false` (never on macOS) | **3.2** (2010-04-03) | **3.2** (2010-04-03) |

[MDN/vendor doc] https://bcd.developer.mozilla.org/bcd/api/v0/current/api.PointerEvent.json · https://bcd.developer.mozilla.org/bcd/api/v0/current/api.TouchEvent.json
Later PointerEvent sub-features (`getCoalescedEvents`, `getPredictedEvents`, `altitudeAngle`, `azimuthAngle`) landed **18.2+**.

### Passive listeners — Safari is the outlier
[MDN/vendor doc], verbatim: *"If this option is not specified it defaults to `false` – **except that in browsers other than Safari, it defaults to `true`** for `wheel`, `mousewheel`, `touchstart` and `touchmove` events"* (on `Window`, `Document`, `Document.body`). So on iOS Safari these listeners are **non-passive by default** and can `preventDefault()` — the opposite of Chrome/Firefox. MDN gives no version for when other browsers changed. https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

### `-webkit-overflow-scrolling`
Obsolete since **Safari 13 (2019)**. Safari 13 release notes, *Layout and Rendering → New Features*: *"Added support for one-finger accelerated scrolling to all frames and `overflow:scroll` elements eliminating the need to set `-webkit-overflow-scrolling: touch`."* And under *Removed Features*: *"Disabled `-webkit-overflow-scrolling: touch` on iPad. All frames and scrollable overflow areas now use accelerated one-finger scrolling without changing stacking."*
[MDN/vendor doc] https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes
Note the wording is **iPad-specific** for the removal while the enabling bullet is general — mild ambiguity. MDN has **removed** the property page entirely (404), and BCD has no `css.properties.-webkit-overflow-scrolling` key.

### Documented iOS iframe quirks (all open bugs)
- **Bug 213344 — the most important one for a game in a cross-origin frame.** *"Cross domain `<iframe>` animation throttling doesn't respond to touch events correctly"* — filed **2020-06-18**, **status NEW**, component Animations. WebKit **caps `requestAnimationFrame` at 30fps for cross-origin iframes** until user interaction. The bug is that only taps lift the throttle: *"If you quickly tap on the iFrame, it will start rendering at 60fps. However, if you swipe/drag/pan (as in for a 360 photo for example) it won't mark this as 'interacted' and stays at 30fps."* https://bugs.webkit.org/show_bug.cgi?id=213344
  Corroborating that this throttling is a real shipped WebKit feature with test coverage: layout test `http/tests/frame-throttling/raf-throttle-in-cross-origin-subframe.html`, referenced by bug **211470** (2020-05-05). https://bugs.webkit.org/buglist.cgi?quicksearch=throttle%20requestAnimationFrame%20cross-origin
  ⚠️ Inference flag: the bug says "cross domain"/"cross-origin". Whether an **opaque-origin** srcdoc frame is subject to the same throttle is not documented anywhere I found.
- **Bug 261390, "touchevents don't work correctly in iframes"** — filed **2023-09-10**, **NEW**, reproduced on iOS 16.6 and 17. Dragging inside an iframe fails when the page carries the standard `<meta name="viewport" content="width=device-width, initial-scale=1">`; without those meta tags behavior differs. WebKit engineer Wenson Hsieh: *"This might be related to `UIGestureRecognizer`s on (and under) the web view being in a weird state… Maybe the event regions are not being computed correctly."* Toggling a CSS property via remote debugging temporarily restores it. https://bugs.webkit.org/show_bug.cgi?id=261390
- **Bug 320457** — *"Content that overflows horizontally never paints inside a nested `<iframe>` on iOS Safari"* (NEW).
- **Bug 307737** — *"Click on DIV over IFRAME triggers touchStart on Canvas inside"* (NEW).
- **Bug 301405** — *"Pointer and Touch events lost on iOS when writing"* (NEW).
- Safari 26.4 (2026-03-24) fixed *"an issue where pointer events would fail to dispatch after a parent view's custom gesture recognizer blocked `touchesEnded:` or `touchesCancelled:`."* [WebKit blog] https://webkit.org/blog/17862/webkit-features-for-safari-26-4/

List views: https://bugs.webkit.org/buglist.cgi?quicksearch=iframe%20touch%20iOS

---

## Ambiguities, staleness, and disagreements to carry into the matrix

1. **BCD internally inconsistent on WebView iOS fullscreen**: `Element.requestFullscreen` → `false`, but `iframe.allowfullscreen` → `12 (partial, iPad only)`.
2. **BCD vs Apple on WKWebView fullscreen**: BCD says unsupported on iOS WebView; Apple ships `WKPreferences.isElementFullscreenEnabled` from iOS 15.4.
3. **Safari 26.4's "Fixed `Element.requestFullscreen` on iOS…"** uses "iOS" where every other source says iPadOS-only. Do not read it as iPhone support.
4. **`webkitEnterFullscreen()` has no current documentation** — absent from MDN and BCD; only the iPhone forced-video-fullscreen *behavior* is documented (2016 WebKit post, 2016 Apple archive).
5. **Apple's "Know iOS Resource Limits" is from 2016-12-12** and no longer carries the numeric table.
6. **No published iOS memory limit.** Any MB figure is measured, not documented.
7. **"A problem repeatedly occurred"** exists only in WebKit bug text, not Apple docs.
8. **WebKit has no autoplay documentation touching Web Audio, iframes, or cross-origin activation.** The cross-origin activation rule is HTML-spec-only.
9. **No source anywhere addresses opaque-origin (sandbox-without-`allow-same-origin`) frames** for fullscreen policy resolution, rAF throttling, process assignment, or autoplay. Every WebKit statement is phrased as "cross-origin"/"cross-site".
10. **Site isolation**: the only status statement is *"As of January 2025 … on step 2"* on docs.webkit.org — itself now ~19 months stale, though the open 2026 bug traffic is consistent with it.
11. **Gamepad permissions-policy support in WebKit is undocumented** (no BCD entry, no release note).

### Could not read
- `https://developer.apple.com/documentation/webkitjs/htmlvideoelement/1633500-webkitenterfullscreen` — page exists, body not extractable (legacy WebKitJS reference, JS-rendered).
- `https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-overflow-scrolling` — HTTP 404; MDN removed the page.
- WebKit's `WebPreferences*.yaml` files (would have given the `SiteIsolationEnabled` default) — all guessed raw.githubusercontent paths 404'd.
- MDN HTML compat tables are client-rendered, so all version data above came from MDN's live BCD API endpoint (`bcd.developer.mozilla.org/bcd/api/v0/current/…`) rather than the doc pages.

### Sources

[MDN BCD: Element.requestFullscreen](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestFullscreen.json) · [MDN BCD: Document.fullscreenEnabled](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Document.fullscreenEnabled.json) · [MDN BCD: Document.exitFullscreen](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Document.exitFullscreen.json) · [MDN BCD: iframe.allowfullscreen](https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allowfullscreen.json) · [MDN BCD: iframe.allow](https://bcd.developer.mozilla.org/bcd/api/v0/current/html.elements.iframe.allow.json) · [MDN BCD: HTMLVideoElement](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.HTMLVideoElement.json) · [MDN BCD: Element.requestPointerLock](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Element.requestPointerLock.json) · [MDN BCD: Gamepad](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Gamepad.json) · [MDN BCD: Navigator.getGamepads](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.Navigator.getGamepads.json) · [MDN BCD: AudioContext](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.AudioContext.json) · [MDN BCD: PointerEvent](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.PointerEvent.json) · [MDN BCD: TouchEvent](https://bcd.developer.mozilla.org/bcd/api/v0/current/api.TouchEvent.json) · [MDN: Element.requestFullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen) · [MDN: Document.fullscreenEnabled](https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled) · [MDN: Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) · [MDN: Element.requestPointerLock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock) · [MDN: iframe element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) · [MDN: Permissions-Policy gamepad](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/gamepad) · [MDN: Permissions-Policy autoplay](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/autoplay) · [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) · [MDN: addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) · [WebKit: Safari 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/) · [WebKit: Safari 18.0](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/) · [WebKit: Safari 18.2](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/) · [WebKit: Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/) · [WebKit: Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/) · [WebKit: Safari 26.4](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/) · [WebKit: Safari 26.5](https://webkit.org/blog/17938/webkit-features-for-safari-26-5/) · [WebKit: Safari 26.6](https://webkit.org/blog/18178/webkit-features-for-safari-26-6/) · [WebKit: Safari 27 beta](https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/) · [WebKit: New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) · [WebKit: Auto-play policy changes for macOS](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/) · [docs.webkit.org: Site Isolation](https://docs.webkit.org/Deep%20Dive/SiteIsolation.html) · [docs.webkit.org: WebKit2 architecture](https://docs.webkit.org/Deep%20Dive/Architecture/WebKit2.html) · [docs.webkit.org: Web Inspector site isolation](https://docs.webkit.org/Deep%20Dive/Web%20Inspector/SiteIsolationExplainer.html) · [Apple: Safari 13 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes) · [Apple: Safari 16.4 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes) · [Apple: Safari 26 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes) · [Apple: webViewWebContentProcessDidTerminate](https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)) · [Apple: WKPreferences.isElementFullscreenEnabled](https://developer.apple.com/documentation/webkit/wkpreferences/iselementfullscreenenabled) · [Apple archive: Creating content for Safari on iPhone](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/CreatingContentforSafarioniPhone/CreatingContentforSafarioniPhone.html) · [WebKit bug 206854](https://bugs.webkit.org/show_bug.cgi?id=206854) · [WebKit bug 216621](https://bugs.webkit.org/show_bug.cgi?id=216621) · [WebKit bug 287102](https://bugs.webkit.org/show_bug.cgi?id=287102) · [WebKit bug 213344](https://bugs.webkit.org/show_bug.cgi?id=213344) · [WebKit bug 261390](https://bugs.webkit.org/show_bug.cgi?id=261390) · [WebKit bug 300782](https://bugs.webkit.org/show_bug.cgi?id=300782) · [Fullscreen Standard](https://fullscreen.spec.whatwg.org/) · [Pointer Lock 2.0](https://w3c.github.io/pointerlock/) · [W3C Gamepad](https://w3c.github.io/gamepad/) · [HTML Standard: user activation](https://html.spec.whatwg.org/multipage/interaction.html)
