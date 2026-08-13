# Recovered Claude memo — Chrome Android isolation and limits

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T04:51:05.198Z
**Claude task:** `a6139248ba3c10a1b`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3545
**Original result length:** 24468 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
## Method note / limitations

The session's WebSearch budget was already exhausted at my first call, so **every finding below came from direct WebFetch of known-canonical URLs**. Two source classes were unreachable: `issues.chromium.org` (sign-in wall — so I have **no** direct bug-tracker status for any bug) and `chromium.googlesource.com/+log/` (403). I could not free-text search, so absence of a doc below means "not found at the canonical paths I could reach," not "does not exist."

---

## 1. Site Isolation / OOPIF on Android — current documented status

**[chromium source doc]** `docs/process_model_and_site_isolation.md` (last commit to file 2026-02-10; site-isolation prose last substantively edited 2024-09-24 and 2025-06-23)
https://chromium.googlesource.com/chromium/src/+/main/docs/process_model_and_site_isolation.md

Verbatim:
- Partial Site Isolation — "Used on: Chrome for Android (2+ GB RAM)."
- "On platforms like Android with more significant resource constraints, Chromium only uses dedicated (locked) processes for some sites, putting the rest in unlocked processes that can be used for any web site. (Note that there is a threshold of about 2 GB of device RAM required to support any level of Site Isolation on Android.)"
- "Chromium also isolates sites that users tend to log into in general, as well as sites on which a given user has entered a password, logged in via an OAuth provider, or encountered a Cross-Origin-Opener-Policy (COOP) header."
- Full Site Isolation — "This mode can be enabled on Android using `chrome://flags/#enable-site-per-process`." (i.e. **not** the Android default.)
- No Site Isolation — "Used on: Low-memory Chrome for Android (<2 GB RAM), Android WebView, Chrome for iOS." / "On Android devices with less than 2 GB of RAM, Site Isolation is disabled to avoid requiring multiple renderer processes in a given tab (for out-of-process iframes)."
- Origin Isolation — "Available on: Desktop platforms, Chrome for Android (2+ GB RAM)."

**[vendor doc]** https://www.chromium.org/Home/chromium-security/site-isolation/
- "On Android devices with at least 2 GB of RAM, Site Isolation has been enabled for sites that users log into since **Chrome 77**."
- "In **Chrome 92**, this expanded to include sites that use third-party login providers (e.g., OAuth) and sites that adopt Cross-Origin-Opener-Policy headers."
- ⚠️ **Stale-doc flag:** this page carries **no publication or last-updated date**.

Release dates for those milestones **[vendor doc]** (chromiumdash):
- Chrome 77 stable **2019-09-10** — https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=77
- Chrome 92 stable **2021-07-20** — https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=92

**Actual numeric thresholds [chromium source]** — the "2 GB" in prose is 1900 MiB in code:
- `components/site_isolation/site_isolation_policy.cc` — `ShouldDisableSiteIsolationDueToMemorySlow()`: **"3200MB default threshold for strict site isolation"**, **"1900MB default threshold for partial site isolation modes"**; comment says these "thresholds roughly correspond to 2GB+ and 4GB+ devices"; test is `base::SysInfo::AmountOfTotalPhysicalMemory() <= base::MiBU(default_memory_threshold_mb)`.
  https://raw.githubusercontent.com/chromium/chromium/main/components/site_isolation/site_isolation_policy.cc
- `components/site_isolation/features.cc` — `kSiteIsolationEnableMemoryThresholdAndroid` is `FEATURE_ENABLED_BY_DEFAULT` (so the threshold is live); `kSiteIsolationMemoryThresholdsAndroid` ("SiteIsolationMemoryThresholds") is `FEATURE_DISABLED_BY_DEFAULT` and exists only as a Finch override with params `strict_site_isolation_threshold_mb` / `partial_site_isolation_threshold_mb`. `kSiteIsolationForPasswordSites` and `kSiteIsolationForOAuthSites` are `ENABLED_BY_DEFAULT` **on Android only** (disabled on other platforms).
  https://raw.githubusercontent.com/chromium/chromium/main/components/site_isolation/features.cc

**Bottom line:** Android's current documented default is **partial site isolation**, gated at ~1900 MB RAM, isolating only WebUI + login/password/OAuth/COOP sites. OOPIFs exist on Android ≥ ~2 GB, but a given cross-site iframe is only out-of-process if its site qualifies under the heuristics.

---

## 2. IsolateSandboxedIframes on Android

**[chromium source doc]** — the single authoritative statement, `docs/process_model_and_site_isolation.md`, "Special Cases":

> "Documents with the sandbox attribute and without `allow-same-origin` (either iframes or popups) may be same-site with their parent or opener but use an opaque origin. **Since 127.0.6483.0, Desktop Chromium moves these documents into a separate process from their parent or opener. On Android, these documents will only be in a separate process if their parent/opener uses [Partial Site Isolation](#partial-site-isolation).** Sandboxed frames embedded in extension pages are in a separate process if they are listed in the "sandbox" section of the extension's manifest, otherwise they are in the same process as the parent."

- Shipped **desktop-only by default**, from build **127.0.6483.0**. Chrome **M127 stable = 2024-07-23** (branch 2024-06-10) **[vendor doc]** https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=127
- Provenance **[chromium source]**: commit `70bba643fcd8656a479258e36c22ca2d0f9ef06e`, authored **2024-07-24**, message "Update process model docs for IsolatedSandboxedIframes. Update the process model description for sandboxed iframes now that IsolatedSandboxedIframes is on by default." **Bug: 40082497**. The diff replaced the old text "Chromium currently keeps these documents in the same process as their parent or opener, but this may change in bug [510122](https://crbug.com/510122)."
  https://api.github.com/repos/chromium/chromium/commits/70bba643fcd8656a479258e36c22ca2d0f9ef06e
- Tracking bugs **[bug tracker, unverified]**: https://crbug.com/510122 and https://issues.chromium.org/issues/40082497 — I could **not** read either; issues.chromium.org returns a Google sign-in page to WebFetch. **No documented revert was found, but I cannot rule one out from the tracker.**

⚠️ **Ambiguity flag on the Android sentence.** "…only be in a separate process if their **parent/opener uses** Partial Site Isolation" most plausibly means *the parent's site is one of the sites actually locked under partial isolation* (login/password/OAuth/COOP), not merely "the device is ≥2 GB." The doc does not disambiguate, and this sentence has not been edited since 2024-07-24. For a `srcdoc sandbox="allow-scripts"` frame on an ordinary (non-login) site, either reading yields the same practical outcome: **no dedicated process on Android.**

**Could not locate the feature flag** — report as unresolved:
- `kIsolateSandboxedIframes` is **absent** from `content/public/common/content_features.h` and `content/common/features.h` at `main`, and also absent from both at tag `127.0.6533.100`. (`kIsolateFencedFrames`, `kIsolateOrigins`, `kIsolateSubframeErrorPages`, `kStrictOriginIsolation` are present.)
- `chrome/browser/flag-metadata.json` has **no** `isolate-sandboxed-iframes` entry → no live `chrome://flags` toggle.
- `content/public/browser/site_isolation_policy.h` **does** declare `AreIsolatedSandboxedIframesEnabled()` with the comment "Returns true if sandboxed iframes should be isolated." The implementing `.cc` 404'd at every path I tried (`content/browser/site_isolation_policy.cc` on both raw.githubusercontent and googlesource), so **I could not read the Android conditional in code**.
  https://raw.githubusercontent.com/chromium/chromium/main/content/public/browser/site_isolation_policy.h
- The most likely explanation (post-launch flag cleanup) is an **inference I could not verify**.

**[vendor doc] chromestatus has no entry** for this: API queries `q=sandboxed+iframes` and `q=isolate+sandboxed` returned nothing matching (`total_count: 0` for the latter). Expected — it's an internal process-model change, not a web-exposed API — so **do not expect a chromestatus milestone for it**.

⚠️ **Contradictory sibling doc [chromium source doc]:** `docs/security/compromised-renderers.md` still states "Frames with `<iframe sandbox>` attribute are not isolated from their non-opaque precursor origin," which reads as pre-127 and conflicts with the process-model doc on desktop. https://raw.githubusercontent.com/chromium/chromium/main/docs/security/compromised-renderers.md

---

## 3. Renderer memory limits on Android

**Say explicitly: there is essentially no official per-renderer memory-limit number for Chrome on Android.** I checked all of `docs/memory/`:

- `docs/memory/README.md`, `key_concepts.md`, `oom.md`, `android_dev_tips.md` — **none** contain Android renderer memory limits, per-process caps, LMK interaction, `oom_score_adj`, or numeric thresholds. `oom.md` mentions Android only once ("most Android ARM64 systems have only 40 bits of address space as of 2022"); `android_dev_tips.md` is purely build/deploy instructions.
  https://chromium.googlesource.com/chromium/src/+/main/docs/memory/
- **[chromium source doc]** The one documented Android process-management statement, from `process_model_and_site_isolation.md`: "On desktop platforms, Chromium sets a 'soft' process limit based on the memory available on a given client… **Chromium on Android does not set this soft process limit, and instead relies on the OS to discard processes.**" It also notes Android is among the cases where "Chromium will aggressively look for existing same-site processes to reuse even before reaching the process limit."
- **[chromium source]** `content/common/features.h` / `features.cc` declare an Android-only `kSandboxedProcessServiceLimitOnAndroid`, `BASE_FEATURE(..., base::FEATURE_DISABLED_BY_DEFAULT)`, with no FeatureParam — i.e. **off by default**, and undocumented beyond the name.
- **[chromium source doc]** `docs/security/android-sandbox.md`: "Chrome launches its helper processes as Android Services"; sandboxed helpers use `android:isolatedProcess` and run under SELinux `isolated_app`. It explicitly does **not** cover process lifecycle, binding/priority, or kill behavior.
  https://raw.githubusercontent.com/chromium/chromium/main/docs/security/android-sandbox.md

**"Aw, Snap!" — not documented as a memory failure. [vendor doc]** https://support.google.com/chrome/answer/95669 says only: "**'Aw, Snap!:' Chrome is having problems loading the page.**" No causes, no memory attribution, no Android mention.

**Android OS side [vendor doc]** https://developer.android.com/topic/performance/memory-management — documents LMK, not Chrome:
> "If this is not sufficient, the kernel starts killing processes to free up memory. It uses the low-memory killer (LMK) to do this."
> LMK uses `oom_adj_score`; "Processes with a high score are killed first. Background apps are first to be killed, and system processes are last to be killed."
Hierarchy documented: background apps → previous app → home app → services → perceptible apps → foreground app → persistent → system → native. **This page documents no per-app or per-process memory limit.**

**JS heap limits [chromium source, V8]** — partially documented, no Android-specific number retrievable:
- `v8/src/heap/heap.h`: `kDefaultMinHeapSize = 256u * MB`; `kDefaultMaxHeapSize = 4 GB` on 64-bit / `1 GB` on 32-bit; `kPhysicalMemoryToOldGenerationRatio = 4`. Declares, under `#if V8_OS_ANDROID`, `IsHighEndAndroid(uint64_t physical_memory)` and `HeapLimitMultiplier(uint64_t physical_memory)`.
  https://raw.githubusercontent.com/v8/v8/main/src/heap/heap.h
- `v8/src/heap/heap.cc`, inside `OldGenerationSizeFromPhysicalMemory()`: `#if V8_OS_ANDROID || defined(V8_TARGET_ARCH_32_BIT)` / `// Android requires 16GB of physical memory to reach the maximum of 4GB.` / `static constexpr size_t kRatio = 4;` else `// On 64-bit 8GB of physical memory is enough for the maximum of 4GB.` / `kRatio = 2;`
  https://raw.githubusercontent.com/v8/v8/main/src/heap/heap.cc — **the file was truncated by the fetcher before `IsHighEndAndroid`/`HeapLimitMultiplier` bodies, so the concrete Android tier thresholds are not reported here.**

**Explicit non-documentation:** per-renderer memory ceilings on Android, the RAM figure at which a renderer is killed, and the "Aw, Snap!" ↔ OOM mapping are **not officially documented** anywhere I could reach. Any number for these circulating publicly is measured, not vendor-stated.

---

## 4. Fullscreen on Chrome for Android

**Supported. [vendor/compat data]** MDN BCD `api.Element.requestFullscreen`: chrome **71**, `chrome_android: "mirror"`, `webview_android: "mirror"`, safari 16.4, firefox 64. Standard track, not experimental.
https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Element.json

⚠️ **Compat-data caveat:** `"mirror"` is BCD's automatic inheritance from the desktop counterpart, per the BCD schema doc — "contributors may specify a simple string, `mirror`… and the version data will be mirrored from its upstream counterpart." It is a maintenance shortcut, **not an independently verified Android data point**. https://raw.githubusercontent.com/mdn/browser-compat-data/main/schemas/compat-data-schema.md

**iframe requirements [vendor doc, MDN]:**
- https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen — "It must either be located within the top-level document or in an `<iframe>` which has the `allowfullscreen` attribute applied to it." / "**Transient user activation is required.**" / `TypeError` is thrown when "The element is not permitted to use the `fullscreen` feature, either because of Permissions Policy configuration or other access control features."
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy/fullscreen — "The default allowlist for `fullscreen` is `self`. The top-level browsing context and same-origin iframes are allowed access… **but not in cross-origin iframes.** To allow `fullscreen` in a cross-origin iframe, include an `allow` attribute" → `<iframe src="…" allow="fullscreen">`. If both `allow` and `allowfullscreen` are present, the `allow` directive takes precedence.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe — `allowfullscreen` "is considered a legacy attribute and redefined as `allow="fullscreen *"`."

**[spec]-derived consequence for your case:** `sandbox` without `allow-same-origin` gives the document an opaque origin (HTML spec sandboxing flags; mirrored in `kOrigin` below), so it is **not** same-origin with the embedder and the default `self` allowlist does **not** cover it. `allowfullscreen` / `allow="fullscreen"` must be set explicitly. I found no vendor doc stating this for the opaque-origin case specifically — it follows from the two documented rules.

**Android quirks [vendor doc, MDN]** https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide:
- "Fullscreen requests need to be called from within an event handler or otherwise they will be denied."
- "Some mobile browsers while in fullscreen mode ignore viewport meta-tag settings and block user scaling; for example: a 'pinch to zoom' gesture may not work on a page presented in fullscreen mode."
- "In Chrome and newer versions of Opera however, no such warning is generated" when a fullscreen request fails (Firefox logs one) — relevant to debuggability.

⚠️ **MDN doc bug:** the Security-considerations block on the `Element.requestFullscreen` page says "The default allowlist for **`screen-wake-lock`** is `self`" — a copy-paste error in a paragraph that is otherwise about `fullscreen`.

**[chromium source doc]** `docs/security/fullscreen.md` exists but is a desktop-oriented security FAQ (fullscreen toast obscuration, Esc handling). It contains **nothing** on iframes, sandboxed frames, permissions policy, user activation, or Android. https://raw.githubusercontent.com/chromium/chromium/main/docs/security/fullscreen.md

---

## 5. Pointer Lock on Chrome for Android

**The documented answer changed recently — this is the highest-churn item in this survey.**

**Historically: not supported. [vendor doc]** chromestatus feature **6753200417800192**, "Pointer Lock (Mouse Lock)": shipped Desktop **23**; Android / WebView / iOS = **Not supported**; explicit note "**Chrome on Android does not support this API.**"; tracking bug http://crbug.com/72754. **Last updated 2025-08-23** → now stale.
https://chromestatus.com/api/v0/features/6753200417800192

**Now shipped on Android in Chrome 144. [vendor doc]** chromestatus feature **6739764319485952**, "Pointer Lock on Android":
- `browsers.chrome.android: 144`, `desktop: null`, `webview: null`, `status.text: "Proposed"`, `intent_stage: "None"`
- `flag_name: null`, **`finch_name: "PointerLockOnAndroid"`**, blink component `Blink>Input>PointerLock`
- Spec https://www.w3.org/TR/pointerlock-2; tracking bug https://issues.chromium.org/issues/40290045; created 2025-12-02, updated 2026-02-10
https://chromestatus.com/api/v0/features/6739764319485952

**Confirmed by release notes [vendor doc]:** "Pointer lock on Android" is listed under **User input** in https://developer.chrome.com/release-notes/144, described as "Provides access to raw mouse movement by locking the target of mouse events to a single element and hiding the mouse cursor."
**Chrome 144 stable = 2026-01-13** (branch 2025-12-01) — https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=144

⚠️ **Flags:**
- The chromestatus `status.text` is still "Proposed" while the release notes say shipped — internal inconsistency in the vendor data.
- `finch_name: "PointerLockOnAndroid"` with `flag_name: null` indicates a **Finch-controlled rollout**; I found no doc stating the rollout percentage or whether it is fully launched.
- **[compat data, stale/contradictory]** caniuse `pointerlock.json` still records `and_chr: {"151": "n"}` (highest Android version tracked = 151, marked unsupported) and `android: "n"`, `samsung: "n"`, `ios_saf: "n"`. https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/pointerlock.json
- **[compat data, unreliable]** MDN BCD `api.Element.requestPointerLock`: chrome **37**, `chrome_android: "mirror"` — the mirror makes MDN assert Android 37+, which was **never true** historically and is only accidentally in the right direction now. Safari is `false`.
- **[vendor doc]** chromestatus **5142031990259712** "Keyboard Lock and Pointer Lock permissions" — permission prompts for these APIs, status "In developer trial (Behind a flag)", not shipped on any platform. Worth watching: it would add a user prompt in front of pointer lock.
- **[vendor doc]** chromestatus **5723553087356928** "PointerLock unadjustedMovement": Desktop 81; **Android not shipped**.

**Sandbox interaction [vendor doc + chromium source]:** MDN — "The `allow-pointer-lock` sandbox token must be added when calling `requestPointerLock()` in an `<iframe>` element. Also, no other elements in other `<iframe>` elements may be in pointer lock mode." Chromium maps `{"allow-pointer-lock", kPointerLock}` in `services/network/public/cpp/web_sandbox_flags.cc`. With `sandbox="allow-scripts"` only, `kPointerLock` remains set and pointer lock is blocked regardless of platform support.
https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock · https://raw.githubusercontent.com/chromium/chromium/main/services/network/public/cpp/web_sandbox_flags.cc

---

## 6. `screen.orientation.lock()` — support, sandbox flag, fullscreen requirement

**Support [compat data]** MDN BCD `api.ScreenOrientation.lock`:
- `chrome: 38` with **`partial_implementation: true`, note "Always throws `NotSupportedError`"** (i.e. desktop Chrome exposes it but it does not work)
- **`chrome_android: 38`** (real support — an explicit value, not a mirror)
- `webview_android: mirror` (of chrome_android), `samsunginternet_android: mirror`
- `firefox: 43→144 partial ("Always throws NotSupportedError"), then 144` ; `firefox_android: 43 → 79 partial ("The API exists but returns NS_ERROR_UNEXPECTED") → 144`
- `safari: false`, `safari_ios: mirror`
https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/ScreenOrientation.json

**Fullscreen is required on Android — confirmed in code [chromium source]:**
- `content/browser/screen_orientation/screen_orientation_delegate_android.cc`: `bool ScreenOrientationDelegateAndroid::FullScreenRequired(WebContents* web_contents) { return true; }`
  https://raw.githubusercontent.com/chromium/chromium/main/content/browser/screen_orientation/screen_orientation_delegate_android.cc
- `content/browser/screen_orientation/screen_orientation_provider.cc`: `LockOrientation` checks `delegate_->FullScreenRequired(web_contents())` and, if not `IsFullscreen()`, returns `SCREEN_ORIENTATION_LOCK_RESULT_ERROR_FULLSCREEN_REQUIRED`. The file has **no** IS_ANDROID conditionals — the requirement comes entirely from the Android delegate.
  https://raw.githubusercontent.com/chromium/chromium/main/content/browser/screen_orientation/screen_orientation_provider.cc

**[vendor doc, MDN]** https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock — "Typically orientation locking is only enabled on mobile devices, and when the browser context is full screen." `SecurityError` is "Thrown if the document's visibility state is hidden **or if the document is forbidden to use the feature (for example, by omitting the keyword `allow-orientation-lock` of the `sandbox` attribute of the `iframe` element)**." Other rejections: `InvalidStateError` (not fully active), `NotSupportedError`, `AbortError`.

**Sandbox flag is implemented in Chromium [chromium source]:**
- `services/network/public/mojom/web_sandbox_flags.mojom`: `kOrientationLock = 1024, // 1 << 10` with comment "See https://w3c.github.io/screen-orientation/#dfn-sandboxed-orientation-lock-browsing-context-flag." Also `kPointerLock = 256`, `kScripts = 16`, `kOrigin = 4`. **There is no `kFullscreen` sandbox flag** — fullscreen is governed by Permissions Policy, not the sandbox attribute.
  https://raw.githubusercontent.com/chromium/chromium/main/services/network/public/mojom/web_sandbox_flags.mojom
- `services/network/public/cpp/web_sandbox_flags.cc` token table includes `{"allow-orientation-lock", kOrientationLock}` and `{"allow-scripts", kAutomaticFeatures | kScripts}`; no comments marking any token unsupported or flag-gated.
- **[spec]** https://w3c.github.io/screen-orientation/#dfn-sandboxed-orientation-lock-browsing-context-flag (referenced by Chromium's own comment).

**Net for `sandbox="allow-scripts"`:** `kOrientationLock` stays set → `lock()` rejects with `SecurityError` on Android regardless of fullscreen state; adding `allow-orientation-lock` is necessary but not sufficient, since Android additionally requires the document to be in fullscreen, which in turn requires `allowfullscreen`/`allow="fullscreen"` on an opaque-origin frame.

---

## Consolidated staleness / ambiguity flags

| Source | Issue |
|---|---|
| www.chromium.org site-isolation page | No last-updated date; Chrome 77/92 milestones only |
| `process_model_and_site_isolation.md` sandboxed-iframe paragraph | Unedited since 2024-07-24; Android clause ("if their parent/opener uses Partial Site Isolation") is ambiguous |
| `docs/security/compromised-renderers.md` | "Frames with `<iframe sandbox>` … are not isolated from their non-opaque precursor origin" — appears pre-127, conflicts with the process-model doc on desktop |
| chromestatus 6753200417800192 | Says "Chrome on Android does not support this API"; updated 2025-08-23, superseded by M144 |
| chromestatus 6739764319485952 | `status.text: "Proposed"` despite appearing in the M144 release notes; Finch-gated (`PointerLockOnAndroid`) |
| caniuse `pointerlock.json` | `and_chr: {"151":"n"}` — contradicts Chrome 144 release notes |
| MDN BCD `Element.requestPointerLock` | `chrome_android: "mirror"` — auto-inherited, historically wrong |
| MDN `Element.requestFullscreen` | Security section misnames the policy as `screen-wake-lock` |
| `kIsolateSandboxedIframes` base::Feature | Not found in any content feature header at `main` or at tag 127.0.6533.100; no `chrome://flags` metadata entry; implementing `.cc` unreachable — location/current gating **unresolved** |
| All crbug entries | `issues.chromium.org` requires sign-in; **no bug-tracker status verified in this survey** |
