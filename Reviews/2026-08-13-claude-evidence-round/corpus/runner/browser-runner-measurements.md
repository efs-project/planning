# Recovered Claude memo — Browser-runner behavior matrix

**Status:** dated research evidence; recovered verbatim except for the normalizations disclosed below; not a design or ruling
**Completed:** 2026-08-13T05:06:56.262Z
**Claude task:** `ac93d20095385c963`
**Transcript event:** session `4b3c6db2-cf94-436d-aab2-fe43a36e86b3`, JSONL line 3614
**Original result length:** 16578 characters before rendering normalization
**Recovery normalization:** HTML entities decoded; machine-local workspace and discarded-scratch roots replaced with portable labels; memo body otherwise preserved.

#status/done #kind/research #repo/planning #pass/claude-evidence-round

---
# Browser-runner behavior matrix — opaque `srcdoc` iframe
**Measured 2026-08-12/13 · macOS 26.5 (Darwin 25.5.0), Apple M4, 16 GB, 120 Hz display**
Measurement only. No recommendations, no EFS files touched (verified: nothing modified under `EFS_WORKSPACE`).

## Phone-readable summary

I built a disposable test rig and actually ran it. Five things matter:

1. **Chrome puts an opaque sandboxed iframe in its own renderer process; Safari does not.** A 3-second busy loop inside the frame freezes Safari's whole host page for 3.0 s. In Chrome the host never stutters (51 ms max gap = baseline). Adding `allow-same-origin` *removes* Chrome's isolation and the host freezes too.
2. **A Chrome renderer OOM kills only the child.** I crashed the child frame's process outright; the host page kept its heartbeat running the whole time and got no event — the only signal was the child going silent.
3. **Safari runs the game loop at ~22 fps while the host runs at 60.** This tracks cross-origin-ness, not sandboxing: any cross-origin child gets ~22 rAF/s and ~30 ms timers; same-origin children get 60/60. Chrome throttles nothing (120/120 for every frame type).
4. **`allow="fullscreen"` does not work in Safari, and actively breaks it.** Legacy `allowfullscreen` alone → enabled. `allow="fullscreen"` alone → disabled. **Both together → disabled.** Chrome accepts either or both.
5. **Safari silently accepts cookie writes that go nowhere**, where Chrome throws. And Safari keeps the frame's WebSocket open ~5.6 s after the iframe is removed (Chrome: ~0.3 s).

Storage is uniformly dead across engines; network, WebGL, WebAudio, Workers and WASM are uniformly alive. **The frame can navigate itself to any URL on the internet and stays sandboxed when it lands.**

---

## Method and browser/version tuples

Rig: local Python server on `127.0.0.1:8710` (+`:8712` as a second origin) serving probe pages that self-report to a collector endpoint; CORS-yes/CORS-no/no-CORS endpoints; a raw WebSocket endpoint and a long-lived one. Chromium browsers driven over CDP with a throwaway profile (trusted input via `Input.dispatchMouseEvent`, so user activation is real). Safari driven by `open -a Safari` with pages that self-report — **no synthetic input possible**.

| Label | Engine | Exact version | How driven |
|---|---|---|---|
| `chrome151` | Blink/V8 | Chrome **151.0.7922.109**, V8 15.1.206.16 | CDP, temp profile |
| `safari26` | WebKit | Safari **26.5.2**, AppleWebKit 605.1.15 | `open -a Safari`, self-reporting |
| `brave151` | Blink | Brave **151.1.93.129** (Chromium 151.0.7922.71) | CDP, temp profile |
| *(incidental)* | Blink | Electron 42.7.0 / Chromium 148.0.7778.280 | the Claude preview pane |

Variants constructed purely for measurement: V1 `sandbox="allow-scripts"` (the subject), V2 `+allow-same-origin`, V3 `+allow-pointer-lock allow-popups allow-modals` with `allow="fullscreen; gamepad; autoplay"`, V4 no sandbox attribute, V5 `allow-scripts` + `allow="fullscreen; gamepad; autoplay"`, V6 `allow-scripts` + legacy `allowfullscreen`, V7 both.

---

## The matrix — OBSERVED

All rows are variant **V1 = `sandbox="allow-scripts"`, `srcdoc`, opaque origin**, unless noted.

### Identity and script execution
| Cell | Chrome 151 | Safari 26.5.2 | Brave 151 |
|---|---|---|---|
| Scripts run | yes | yes | yes |
| `self.origin` | `null` | `null` | `null` |
| `location.href` | `about:srcdoc` | same | same |
| `isSecureContext` | true (localhost) | true | true |
| Parent → `contentDocument` | `null` | `null` | `null` |
| Parent → `contentWindow.origin` | SecurityError | SecurityError | SecurityError |
| Child → `top.location.href` | SecurityError | SecurityError | SecurityError |
| `document.featurePolicy.allowedFeatures()` | present; V1 list has `gamepad`, **no** `fullscreen`/`autoplay` | **API absent** | present, shorter list |

### Storage — uniformly unavailable, but the *failure mode* differs
| Cell | Chrome 151 | Safari 26.5.2 |
|---|---|---|
| `localStorage` | SecurityError "sandboxed and lacks the 'allow-same-origin' flag" | SecurityError "The operation is insecure." |
| `sessionStorage` | SecurityError | SecurityError |
| `indexedDB.open()` | SecurityError | SecurityError "invalid security context" |
| CacheStorage | SecurityError on property access | SecurityError |
| ServiceWorker | SecurityError on property access | SecurityError |
| **`document.cookie` write** | **SecurityError** | **no throw — silently accepted** |
| **`document.cookie` read** | **SecurityError** | **returns `""`** |
| `navigator.storage.estimate()` | TypeError | TypeError |

The cookie row is the classic confirms-but-unreadable shape: identical end state, opposite diagnosability.

### Network — wide open, CORS-gated
| Cell | All three engines |
|---|---|
| `fetch` to CORS-enabled endpoint | 200, `type=cors` |
| `fetch` to non-CORS endpoint | **TypeError** (opaque origin is cross-origin to everything) |
| `fetch(..., {mode:'no-cors'})` | status 0, `type=opaque` — **request is sent** |
| `fetch` with `credentials:'include'` | TypeError |
| `fetch('https://example.com', no-cors)` | **status 0, opaque — public internet egress works** |
| XHR / `sendBeacon` | 200 / true |
| `<img>`, `<script>`, `<link rel=stylesheet>` cross-origin | all load |
| **WebSocket** | `open \| msg \| close:1000` — **fully functional, no CORS gate** |
| Blob-URL Worker, `data:` URI Worker | both alive |

Requests carry `Origin: null`, `Sec-Fetch-Site: cross-site`, empty `Referer`.

### Navigation — self-navigation is NOT contained
Measured per case; "blocked" means no HTTP request ever reached the server and the top document survived.

| Attempt (V1) | Chrome 151 | Safari 26.5.2 |
|---|---|---|
| `top.location.href = …` | blocked, SecurityError | blocked, SecurityError |
| `top.location.assign` / `.replace` | blocked | blocked |
| `parent.location.href` | blocked | blocked |
| `<a target="_top">` programmatic click | blocked | blocked |
| form submit `target="_top"` | blocked | blocked |
| `window.open` (no activation), ±`allow-popups` | `null` both ways | `null` both ways |
| **`location.href = 'http://…'` (self)** | **succeeds** | **succeeds** |
| **meta refresh (self)** | **succeeds** | **succeeds** |
| **self-nav to external `https://`** | **navigates** | **navigates** |
| `javascript:` URI (self) | no navigation | no navigation |
| with `allow-top-navigation` added | **top replaced** | **top replaced** |

The landing document **inherits the sandbox and the opaque origin** — confirmed server-side: `docOrigin: null`, `Origin: null`, `Sec-Fetch-Site: cross-site`, `isTop: false`. So the frame can swap its own contents for arbitrary remote code and keep running, still sandboxed.

### Graphics and audio
| Cell | Chrome 151 | Safari 26.5.2 |
|---|---|---|
| Canvas 2D readback | `pixel:255,0,0,255` | same |
| WebGL 1 + 2 | work; `readPixels` `0,255,0,255` | work; same |
| Unmasked renderer | `ANGLE (Apple, ANGLE Metal Renderer: Apple M4)` | `Apple GPU` |
| MAX_TEXTURE_SIZE | 16384 | 16384 |
| `navigator.gpu` | present | present |
| OffscreenCanvas | function | function |
| `new AudioContext()` **without** gesture | `suspended` | `suspended` |
| `new AudioContext()` **inside** a trusted click | **`running` immediately**, no `allow="autoplay"` needed | not measurable |
| OfflineAudioContext render | 127 non-zero samples | identical |
| `SharedArrayBuffer` | undefined (not cross-origin-isolated) | undefined |

### Activation-gated — Chrome only (trusted input)
| Action | V1 `allow-scripts` | V3 `+allow-pointer-lock`, `allow="fullscreen; gamepad"` |
|---|---|---|
| Pointer lock | **rejected**: "frame is sandboxed and the 'allow-pointer-lock' permission is not set"; `pointerlockerror` fires | **resolves**, `pointerLockElement` set |
| Fullscreen | **rejected**: `TypeError: Disallowed by permissions policy`; `fullscreenerror` fires | **resolves**; innerHeight 300→949; parent sees `fullscreenElement` (screenshot confirms full-screen fill) |
| `document.fullscreenEnabled` | `false` | `true` — reliable pre-flight signal |
| Gamepad `getGamepads()` | `len=4, nonnull=0`, **no throw** in either | same |
| Trusted click into frame | `isTrusted=true`, `hasFocus=true` | same |
| Keyboard after click | `keydown` `isTrusted=true` reaches frame | same |
| Focus events | `focus`/`blur` fire correctly as focus moves between frames | same |

**Two different gates**: pointer lock is governed by the **sandbox flag**; fullscreen by **Permissions Policy**.

### Fullscreen enablement — the sharpest cross-engine split
`document.fullscreenEnabled` by variant:

| Variant | Chrome 151 | Brave 151 | **Safari 26.5.2** |
|---|---|---|---|
| V1 nothing | false | false | false |
| V3 `allow="fullscreen; …"` | true | true | **false** |
| V5 `allow="fullscreen; …"` | true | true | **false** |
| V6 legacy `allowfullscreen` | true | true | **true** |
| V7 `allowfullscreen` + `allow="fullscreen"` | true | true | **false** |

Reproduced across three independent Safari runs. In WebKit, adding `allow="fullscreen"` **overrides and disables** the legacy attribute.

### Renderer hangs — 3 s main-thread busy loop, parent's max timer gap
Baseline idle: 51–53 ms both engines.

| Child shape | Chrome 151 | Safari 26.5.2 |
|---|---|---|
| **opaque `srcdoc` sandbox, main thread** | **51 ms (no impact)** | **3027 ms (host frozen)** |
| opaque sandbox, Worker | 51 ms | 53 ms |
| `srcdoc` no sandbox, main thread | **3013 ms** | 3036 ms |
| `sandbox="allow-scripts allow-same-origin"`, main thread | **3019 ms** | 3010 ms |
| cross-site iframe, main thread | 51 ms | 3033 ms |
| cross-site **sandboxed** iframe | 51 ms | 3001 ms |
| same-origin http iframe | 3032 ms | 3001 ms |
| Worker in no-sandbox / `+same-origin` frame | — | 53 ms / 53 ms |

Mechanism confirmed directly: CDP reports the opaque sandboxed frame as a **separate `iframe` target** in Chrome (out-of-process) and as an **in-process child frame** for the same-origin variants. Safari shows a 3 s freeze for every main-thread case — no process isolation observed.

*Correction from my own run:* two earlier Safari passes showed a false 3.0 s stall on the Worker case; a third pass with added controls (H, I) showed 53 ms across all three Worker shapes. The earlier figure was a window-boundary artifact in my harness, not WebKit behavior.

### Crash / OOM (Chrome 151 only)
- **ArrayBuffer exhaustion**: ~248 × 64 MB allocated, then a **catchable `RangeError`**. No crash. Parent heartbeats 50/50.
- **JS heap exhaustion**: `Target.targetCrashed {status:"crashed"}` on the **child iframe target**. Parent survived the full 42 s with unbroken heartbeats; child output froze at `heap-round n=946000`.
- **Parent got no event.** The only observable was the child's message stream stopping — detection requires your own watchdog.

### Timing and liveness — 16 s controlled run, five child types in one page
Median rAF/sec and 10 ms-timer ticks/sec:

| Frame | Chrome 151 | Brave 151 | **Safari 26.5.2** |
|---|---|---|---|
| parent | 120 | 120 | 60 |
| **opaque sandbox `srcdoc`** | **120 / 100** | 120 / 100 | **22 / 34** |
| same-origin `srcdoc`, no sandbox | 120 / 100 | 120 / 100 | 60 / 84 |
| `sandbox` + `allow-same-origin` | 120 / 100 | 120 / 100 | 60 / 84 |
| same-origin http child | 120 / 100 | 120 / 100 | 60 / 84 |
| **cross-site child (not sandboxed)** | 120 / 100 | 120 / 100 | **22 / 34** |

The Safari penalty follows **cross-origin-ness**, not the sandbox attribute. Chrome measured with occlusion-backgrounding disabled so window state didn't confound the parent-vs-child comparison. Separately observed: when the Chrome window *is* occluded, rAF drops to 0 and 10 ms timers to 1–2/sec for parent and children alike; Safari kept 60/22 with `hasFocus=false` and `visibilityState="visible"` throughout.

### Teardown — `iframe.remove()` only
| Cell | Chrome 151 | Safari 26.5.2 |
|---|---|---|
| postMessages before / after removal | 15 / **0** | 15 / **0** |
| Server-side beat requests after removal | 0 | 0 |
| **Live WebSocket closed** | **~0.3 s after removal** (4.31 s from open) | **~5.6 s after removal** (9.63/9.64/9.65 s across 3 trials) |
| AudioContext state at removal | `suspended` | `interrupted` (WebKit-only state) |

The Safari delay is **fixed, not tied to the parent's script**: re-run with the parent's post-removal wait extended 5 s→15 s still closed at 9.63 s.

### Brave 151 vs Chrome 151
Sandbox, storage, network, navigation, WebGL, hang isolation and fullscreen rows are **identical**. Differences are anti-fingerprinting only: `hardwareConcurrency` 3 (vs 10), `deviceMemory` 8 (vs 16), canvas `toDataURL` length differs (farbling), `navigator.keyboard` absent, shorter `allowedFeatures` list.

### Desktop feature-detection traps
`TouchEvent` is `function` in Chromium desktop but `undefined` in Safari desktop. `navigator.getGamepads()` returns a length-4 array of nulls in Chromium, length-0 in Safari. `navigator.vibrate` and `navigator.keyboard` absent in Safari. `performance.now()` resolution: 0.1 ms Chrome, 1 ms Safari.

---

## UNKNOWN — not exercised here

**Whole engines / platforms unavailable on this machine:**
1. **Firefox / Gecko — entirely unmeasured.** Not installed (checked `/Applications`, `mdfind`, Homebrew casks). Every Gecko cell is unknown: process isolation for sandboxed frames, storage failure modes, pointer lock / fullscreen gating, rAF throttling, teardown.
2. **iOS Safari — entirely unmeasured.** No Xcode, no `simctl`, no simulator runtimes, no physical device. Fullscreen on iPhone, WebKit memory/jetsam limits, touch inside cross-origin frames: all unknown.
3. **Chrome on Android — entirely unmeasured.** No emulator or device.
4. Chrome's *device emulation* did not propagate into the out-of-process sandboxed frame (child still reported `maxTouchPoints: 0`), so it yielded no touch data. That is a DevTools artifact, not browser behavior — I am reporting no emulated-touch result at all.

**Cells I could not exercise on the browsers I did have:**
5. **Real touch input.** No touchscreen. `maxTouchPoints` = 0 everywhere; whether touch events actually reach an opaque frame is untested.
6. **Real gamepad input.** No controller attached. I only measured that `getGamepads()` doesn't throw — never that button/axis data flows into an opaque frame, and never `gamepadconnected` behavior with vs without `allow="gamepad"`.
7. **Safari: every activation-gated action.** Fullscreen invocation, pointer lock, audio resume, focus/keyboard delivery. Safari cannot be driven with synthetic input here (browsers are read-tier for computer use; no Safari automation without enabling a system setting). Safari's fullscreen rows are `document.fullscreenEnabled` only — a proxy, not an invocation.
8. **`window.open` with genuine user activation.** All popup results were measured *without* activation, where both engines return `null` regardless of `allow-popups`. The activation case is untested.
9. **Safari and Brave OOM/crash behavior.** Only Chrome was crash-tested.
10. **Parent-side crash detection.** I confirmed no parent event was observed, but did not test whether `iframe` fires `error`/`load` on child crash, nor whether `postMessage` to a crashed frame throws.
11. **`data:` URI self-navigation** — `loadEvents` incremented in both engines but I could not confirm what document actually landed.
12. **Sustained load.** Successive harness variants got progressively slower in Safari (2.8 s → 12.7 s per variant); I did not isolate whether that is leak, throttling, or accumulation of my own probe's live contexts.
13. **Everything here is localhost + HTTP.** `isSecureContext` was true via the localhost exemption. Behavior over real HTTPS, over the public internet, with third-party-cookie blocking active, or with Safari's ITP engaged is untested.
14. **A documentation survey** (spec text and vendor docs for the engines above) was dispatched in parallel and had not returned when I finished. **Nothing in this memo depends on it** — every claim above is a direct observation from a run I performed.

**Sample sizes:** most cells are n=1 per browser. Deliberately repeated: Safari fullscreen variants (3), Safari WebSocket teardown timing (3), Safari hang battery (3), Chrome hang battery (2).

Artifacts — 33 raw JSON/console/log files, screenshots, and the rig itself — are at `DISCARDED_SCRATCH/runner-matrix`. Server stopped, no stray processes, nothing written outside the scratch directory.
