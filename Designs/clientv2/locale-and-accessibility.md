# Locale, input, and accessibility as OS services
**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]], [[read-lens-spec]], [[codex-kinds]], [[apps-cookbook]], [[fable-client-v2-handoff]], [[agent-native-os-compass-for-fable]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

> Elaborates thesis **F10** (Locale and accessibility: mediated, canonical, budgeted). Evidence: Reviews/2026-07-07-clientv2-corpus/research/i18n-a11y.md. Where this doc and [[web-os-thesis]] disagree, the thesis wins until amended; the one refinement this doc argues is flagged in Open questions.

## Problem

Locale is not a settings page. It shapes what a user reads (script, direction, plural form), how lists sort, what a timestamp *means*, how text is typed (IME), and whether a receipt two devices render is the same receipt. It is also a ~50–60-bit fingerprint (`navigator.languages` + timezone + calendar + numbering + font set), and its inconsistencies are themselves a signal. Accessibility has the same shape: it is either an OS-structural property (the Shell owns the DOM, so semantics are correct by construction) or an app-by-app aspiration that fails for exactly the users who cannot route around it. EFS's cage (F1: apps own no pixels, no network) makes both solvable *once, centrally* — and makes the dishonest shortcuts (CDN fonts, cloud translation, canvas text fields) structurally unavailable. This doc specifies the services.

## The design

### 1. `LocaleHandle` — methods, not data; format at the edge

Three disclosure tiers, enforced by the Kernel's capability table:

- **Tier 0 — zero-disclosure (default, and the doctrine):** in surface mode, apps do not format at all. The UI tree carries **typed semantic values**; the Shell formats at render time with the *user's* full profile, which never crosses the membrane. This is the only true zero-disclosure path — and it exists *because* of F1. [research-grounded]
- **Tier 1 — string-returning methods (`locale.basic`, promptless, budgeted):** for computation (sorting, search folding, canvas-mode text) apps may call formatting/collation methods. **Honesty note: returned strings and comparison results leak the profile through outputs** — an app that formats `2026-07-07` and reads back `7/7/26` has learned region conventions. Tier 1 therefore *spends the locale entropy budget* (§2); "methods, not data" limits disclosure, it does not eliminate it. [reasoned — refines the thesis wording; see Open questions]
- **Tier 2 — full profile (`locale.profile`, prompted, high-sensitivity):** the raw profile object, for apps that genuinely need it (a calendar app, a locale-testing tool). Separate capability, System Chrome prompt with fingerprint warning, revocable, receipted.

**Why this does not hurt third-party developers (a design goal, not an afterthought).** The overwhelmingly common case — "show dates, numbers, and text correctly for this user" — is **Tier 0: zero disclosure *and* zero effort.** The app emits a typed `SemanticValue`; the Shell formats it with the user's *full* profile, which never crosses the membrane. The app gets perfect localized output, ships no CLDR data, and does no timezone math — while learning nothing. Canvas-mode apps that render their own text use Tier 1, which still formats *with* the real profile, so `formatDate` returns correctly region-formatted output without handing over the region. An app needs Tier 2 only if it does its own locale math (rare, correctly prompted). **Net: EFS gives apps the OAuth `locale` baseline for free — primary language + region — plus a formatting service that means they usually don't need even that. Better DX than the status quo web, not worse.** What we withhold by default is *only* the high-entropy tail (full ordered language list, exact timezone, installed-font enumeration) — which the plain web leaks to every site silently, which OAuth doesn't expose at all, and which is precisely what would re-correlate a user's personas (§2).

```ts
// @efs/os-sdk — surface-mode typed values (Tier 0; preferred)
type SemanticValue =
  | { kind: 'datetime'; value: string /* ISO-8601 instant */; style?: DateStyle; tz?: 'viewer' | string }
  | { kind: 'number'; value: string /* decimal string, not float */; style?: NumberStyle }
  | { kind: 'duration'; value: string /* ISO-8601 duration */; style?: DurationStyle }
  | { kind: 'list'; items: SemanticValue[]; type?: 'conjunction' | 'disjunction' }
  | { kind: 'message'; id: string /* MF2 id from the app's language pack */; args?: Record<string, unknown> }
  | { kind: 'identifier'; value: string; idKind: 'address' | 'hash' | 'cid' | 'path' | 'vanity' }; // → <efs-identifier>

// capability: locale.basic (Tier 1 — budgeted)
interface LocaleHandle {
  readonly primaryLanguage: string;            // language (+ script only when it changes rendering, e.g. "zh-Hant")
  readonly region?: string;                    // e.g. "MX" — free, OAuth-parity (low-entropy AND constant across
                                               // personas, so not a delinking risk). NOT the full language list,
                                               // NOT exact timezone, NOT installed fonts — those stay gated (§2).
  formatDate(iso: string, opts?: DateStyle): Promise<string>;
  formatNumber(dec: string, opts?: NumberStyle): Promise<string>;
  formatDuration(iso: string, opts?: DurationStyle): Promise<string>;
  formatRelative(iso: string): Promise<string>;
  formatList(items: string[], opts?: ListStyle): Promise<string>;
  displayName(code: string, type: 'language' | 'region' | 'script' | 'currency'): Promise<string>;
  compare(a: string, b: string, usage?: 'sort' | 'search'): Promise<-1 | 0 | 1>;
  segment(text: string, g: 'grapheme' | 'word' | 'sentence'): Promise<SegmentRange[]>;
  plural(n: string, type?: 'cardinal' | 'ordinal'): Promise<'zero'|'one'|'two'|'few'|'many'|'other'>;
  direction(text: string): Promise<'ltr' | 'rtl' | 'auto'>;
  t(mf2Id: string, args?: Record<string, unknown>): Promise<string>;  // app's own MF2 catalog; Shell picks locale
}

// capability: locale.profile (Tier 2 — prompted)
interface LocaleProfile {
  languages: string[]; region?: string; timeZone: string;
  calendar: string; numberingSystem: string; hourCycle: 'h11'|'h12'|'h23'|'h24';
}
```

SDK lint rule: a surface-mode app calling Tier-1 `format*` for values it could emit as `SemanticValue` gets a build-time warning. Sorting a file list stays Tier 1 (`compare`), but display formatting belongs at the edge. `String.length`-style truncation is banned in system components: every ellipsis runs through grapheme segmentation (👨‍👩‍👧‍👦 is `.length === 11`). [research-grounded]

### 2. The locale entropy budget

Mirror of the network privacy model (F5): default-deny disclosure, metered spend, receipts.

| Disclosure / inference class | Est. bits | Default policy |
|---|---|---|
| `primaryLanguage` (coarsened) | ~6 | Free; disclosed in install review ("This app will see your primary language: English") |
| `region` (e.g. MX) | ~4 | **Free (OAuth-parity)** — low-entropy and identical across your personas, so it fingerprints you against *other users* but never *de-links your personas*; disclosed in install review |
| Date/number format-output inference | ~4–8 | Tier-1 pool |
| Collation order (comparator probing) | ~5 | Tier-1 pool |
| Segmentation dictionary behavior | ~2 | Tier-1 pool |
| Time zone | ~6 | Prompt (individually grantable) |
| Full language list | ~10 | Prompt (Tier 2 only) |
| Calendar + numbering + hourCycle | ~4 | Prompt (bundled into Tier 2) |
| Font-pack presence probing | ~5+ | Structurally blocked in surface mode; canvas-mode font capability counts as spend |

Per-app-persona Tier-1 pool: **~12 bits promptless**; first spend past the pool raises a System Chrome prompt and every spend writes a **locale receipt** (app, class, bits, timestamp) visible in the Permission Center's Locale pane. Bit estimates and the pool constant are [open] — the mechanism is the ruling, the constants are tuning. Prompt copy (§9) never says "entropy"; it says "makes you more identifiable."

Deliberate consequence: an app cannot cheaply enumerate the profile through outputs without either tripping the meter or asking. `prefers-*` states (§7) ride the same meter when exposed to canvas-mode apps (reduced-motion alone is low-entropy; the combination is not).

### 3. Two-track rendering: display vs canonical

- **Display track:** engine `Intl.*` (offline by construction, zero HTTP — this is why we prefer it over any CLDR-fetching JS library). Used for all ephemeral UI. Never hashed, never signed, never compared across devices. [research-grounded]
- **Canonical track:** pinned **ICU4X-WASM formatter + hash-pinned sliced CLDR pack** (blob provider; per-locale per-component slices are KBs, not MBs) for anything reproducible: receipts, citations, audit-log entries, exported statements, anything an agent quotes into a plan. Every canonical render carries `(cldrVersion, tzVersion, formatterCID, localeUsed)` so any device reproduces it byte-for-byte. [research-grounded]
- **The invariant: the raw machine value is always stored under the localized surface.** ISO-8601 instant + explicit zone, decimal string, raw address — the localized string is presentation, never the datum. Nothing localized is ever signed as truth. (Feeds efsv2 gap G2.)
- **Rendering locale is a lens, and is labeled.** Receipts and audit views carry a quiet chip — `shown in en-US · CLDR 47` — expandable to the full canonical tag tuple and the raw value. Same UI tier as venue/grade chips; invisible until it could change an answer (F13 discipline).

The closure manifest already pins locale-pack, font-pack, and tz-data CIDs (thesis, Adopted primitives). This doc adds the consequence: **pack version is a staleness axis** — when an identifier or safety-critical string was rendered under a superseded pack, the read-grade surface may say "rendered with locale pack N" (efsv2 gap G3).

### 4. Language packs and font packs

Both are ordinary EFS packages: signed, content-addressed DATA + manifest records, distributed through lens channels, health-gated, riding generations — the F4 machinery, no parallel updater. Cached in OPFS, hash-verified before load, **no HTTP fallback, ever**.

- **Language pack** = MF2 message catalogs (MF2 is Unicode-stable since CLDR 47, 2025-03; native `Intl.MessageFormat` is *not* shipping — bundle the `messageformat` 4.x-class runtime, swap native later) + sliced ICU4X data blobs + localized help. One pack per locale; app packs are separate records the app's manifest references, so a user's lens can choose *whose translation* of an app they trust (efsv2 gap G5). Fluent's lesson applies: ship an MF2 catalog validator in the SDK (placeholder parity, plural-category completeness) or translators will ship runtime errors. [research-grounded]
- **Font packs, tiered:** the **core pack** ships in the default closure — Latin, Cyrillic, Greek, Arabic, Hebrew, Devanagari, Thai, a UI emoji subset; one variable UI face + static fallbacks; physical WOFF2 subsets paired with `unicode-range` so pure-Latin pages never pull Arabic bytes. **CJK, Korean, and full emoji are on-demand signed packs** per script block (a Han face is ~8 MB minimum; subsetting does not save CJK) — offered when the user's locale or *content* needs them, downloaded once, cached, generation-pinned. Never depend on user-installed fonts for correctness (WebKit's `local()` restriction broke minority scripts; we ship our own). [research-grounded]
- **Honest tofu:** a missing glyph renders as a visible .notdef box with a hover/tap affordance — "This text uses a script (Han) whose font pack isn't installed. [Install pack (12 MB)]". Never silent blanks, never substituted question marks. Offline with the pack missing: tofu + a queued pack-fetch that runs on next connectivity, surfaced in the Sync Center; last-resort generic-family fallback is allowed for *reading* but the region is marked "approximate rendering" — we do not pretend fidelity we don't have. [reasoned]

### 5. Input: native-first, IME-safe, keyboard-honest

- **Surface-mode text fields are Shell-owned native `<input>`/`<textarea>`/`contenteditable`.** IME composition, dead keys, emoji pickers, password managers, and autofill work by construction. Security bonus: the app receives *committed values* (input/change events over the membrane), never composition keystrokes — composition snooping is structurally gone. [research-grounded]
- **EditContext is reserved for genuine rich editors** (document-mode or canvas-mode editors that own their own text layout). It is Chromium-only (121+); Firefox and Safari have not shipped. Mandatory pattern: feature-detect, fall back to `contenteditable`; an editor that cannot fall back does not pass install review for the default channels. A broken IME path is a *hard block* for CJK/Vietnamese users, not a degradation. [research-grounded]
- **No canvas text fields, ever.** A canvas-mode app requesting text input gets an **input lease**: a Shell-owned native input overlaid at app-declared coordinates, styled to blend, with the value delivered over the membrane on commit. The app draws everything except the text entry itself.
- **Mobile layout is driven by `visualViewport` + `interactive-widget=resizes-content`.** The VirtualKeyboard API is Chromium-Android-only and buggy — not used. Session Shell mobile mode reflows on `visualViewport` geometry events; System Chrome ceremonies must keep their confirm/deny controls inside the visual viewport while the keyboard is up (also a 2.4.11 concern). [research-grounded]

### 6. `<efs-identifier>` — the identifier primitive

Bidi is a security surface (BiDi Swap, Trojan Source; unpatched in browsers a decade on). One system component kills the class; nothing else in the OS may render an address, hash, CID, or path segment. [research-grounded]

```html
<efs-identifier value="0x1Ad8…11D7" idkind="address" ceremony></efs-identifier>
```

Normative behavior:

| Rule | Detail |
|---|---|
| LTR isolation | `direction: ltr; unicode-bidi: isolate` on the host; content cannot inherit or leak direction |
| Monospace + chunking | groups of 4 with hair-space separators (copy still yields the unchunked raw value) |
| Bidi-control stripping | U+202A–202E, U+2066–2069, U+200E/200F removed from identifier positions; if any were present, show the `bidi-stripped` badge — stripping is *flagged*, never silent |
| Invisible/format chars | zero-width and Cf characters rejected in `address`/`hash`/`cid` kinds; flagged in `vanity`/`path` kinds |
| UTS-39 detection | mixed-script and confusable analysis on `vanity`/`path` kinds; skeleton-compare against the user's petname directory and recently-seen identifiers |
| Warning badges | `bidi-stripped`, `mixed-script`, `looks-like <petname>` (confusable match) — negative indicators only, no green checkmark (honesty doctrine) |
| Ceremony mode | `ceremony` attribute forbids truncation entirely — full value, always (address poisoning is a pure truncation failure; $83M+, thesis F3) |
| Copy semantics | clipboard receives the raw canonical value, never the decorated/chunked rendering |

**Design-system default:** every user-controlled string slotted into a system component is bidi-isolated (`unicode-bidi: isolate`), and MF2 interpolation isolates placeholders by default — an RTL display name cannot reorder the sentence around it. Vanity labels always render with the self-certifying root reachable one interaction away (efsv2 gap G4).

### 7. Accessibility foundation

**WCAG 2.2 AA is the floor** (ISO/IEC 40500:2025); WCAG 3.0 is watched, not chased. The criteria that bind OS chrome, named:

- **2.5.8 Target Size:** ≥24×24 CSS px for dock icons, window controls, chips, grade badges, permission buttons — enforced as a design-token minimum, checked in component CI.
- **2.4.11 Focus Not Obscured:** sticky Shell chrome (dock, status bar, Sync Center toasts) must never cover the focused element; the Shell's focus manager scrolls-into-safe-area on focus.
- **2.5.7 Dragging Movements:** every drag (window move, file drag, lens reorder) has a single-pointer non-drag alternative (move-to menu, keyboard reorder).
- **3.3.8 Accessible Authentication:** **paste and password managers are allowed in every secret field** — mnemonics, signed-bundle import, passkey fallback codes. Blocking paste in a seed field is a WCAG violation *and* a security anti-pattern; it never ships.
- **3.2.6 / 3.3.7:** help affordance in a stable position across System Chrome; ceremonies never re-ask for information already granted in-session.

Component discipline (Lit + Web Awesome, heavy shadow DOM — the sharpest trap in our stack):

- Default semantics via **`ElementInternals`** (`role`, `ariaLabel` on the host) in every system component.
- **ARIA relationships stay within one shadow root.** Cross-root `aria-labelledby`/`aria-activedescendant` silently fail; Reference Target is not Baseline. Where cross-root wiring is unavoidable, use light-DOM slotting. Adopt Reference Target when Baseline, not before.
- **Manual screen-reader testing is a release gate, not a nicety:** automated tools cannot see ElementInternals semantics and over-flag ARIA (WebAIM 2026: 59 vs 42 errors). Every release: VoiceOver + NVDA passes over the System Chrome ceremonies (signing, install review, permission prompts, recovery) and one full Session Shell task loop. A ceremony a screen reader cannot complete is a ship blocker — it is the security surface (F3). Web Awesome's built-in a11y claims are audited per component, not trusted.
- **All `prefers-*` queries wired into design tokens day one:** reduced-motion (gates every animation), color-scheme, forced-colors (test chrome under Windows High Contrast, don't override), contrast, reduced-transparency (glass effects), reduced-data (feeds pack-download prompts).
- **SVG over canvas for every custom widget** (charts, graphs, meters) — native semantics, ARIA-able. Canvas-mode apps must supply the **semantic sidecar** (F1): an accessible-tree sidecar the Shell mirrors into real DOM; an interactive canvas surface without one gets a Shell-drawn "this app's canvas region is not accessible" notice rather than silence. [research-grounded]

### 8. Surface mode makes i18n + a11y structural — and exposes a protocol gap

Because the compositor (System Chrome, thesis Amendment 2) reconciles the app's UI tree into real DOM it owns (F1), screen readers see true semantics, focus order is Shell-managed (placement/focus policy stays with the Session Shell), tokens theme uniformly, and **`lang`/`dir` are set per content region** — pronunciation and bidi handling follow the *content's* language, not the UI's.

The gap: **EFS v2 records carry no first-class content-language or direction metadata.** The [[codex-kinds]] reserved-key table has no `lang`/`dir` row, so the OS cannot know a DATA file's language from its signed record. Interim ladder, honestly labeled:

1. Declared metadata (once the protocol reserves it) → authoritative, travels with the signature.
2. Local detection (LanguageDetector-class model, on-device) → `lang` set with a "language detected, not declared" note in the region's info affordance.
3. Unknown → `lang` unset (never silently defaulted to English), `dir="auto"`, first-strong heuristic.

This is filed as the top efsv2 pressure item from this doc (G1): reserve `lang` (BCP-47) and optional `dir` (`ltr`/`rtl`/`auto`) keys — or a blessed TAG schema — so language travels with the record, reproducibly.

### 9. Offline translation and locale privacy chrome

**Translation is an optional, sovereign OS service** — a Bergamot-class NMT engine compiled to WASM plus **signed per-language-pair model packs** through the same package machinery. Fully offline after pack install. Chrome's built-in `Translator` API (138+, on-device after model download) is used opportunistically where present — a progressive enhancement, never a dependency (not Baseline, desktop-Chromium-only). Translated text is a lens: rendered with a "machine translation — not the signed source" label, source one toggle away, never substituted silently. **Cloud translation exists only behind an explicit endpoint capability** with its privacy class shown and the blunt warning: "Sends the text you are reading to <operator>. They will know what you read." [research-grounded]

**Prompt copy** (System Chrome, negative-indicator style, no jargon):

> **Atlas Notes wants to know your time zone.**
> Your time zone makes you more identifiable. 0 of 12 installed apps can see it.
> [ Don't allow ]   [ Allow once ]   [ Allow for this app ]

> **Atlas Notes wants your full locale profile** — languages (3), region, time zone, calendar.
> Together these are close to a unique fingerprint of you.
> [ Don't allow ]   [ Allow once ]   [ Allow for this app ]

Install review shows the free coarse disclosure inline with the capability diff: "Will see your primary language: English." The Permission Center's **Locale pane** lists, per app persona: fields disclosed, inference-class spends with timestamps, and a "revoke + rotate" action (revocation also rotates the persona's Tier-1 pool so accumulated inference doesn't persist across a revoke). [reasoned]

### Agent lens

- **Task locale ≠ user profile.** An agent session carries a `taskLocale` (set by plan intent: "reply to this French email" ⇒ `fr`) as a plan parameter; it never inherits `locale.profile` ambiently. Full-profile access for an agent is the same prompted Tier-2 capability, shown in the plan's capability manifest at approval time.
- **Agents read semantic values, not localized strings.** The agent-visible UI tree (F1/F9: the declarative tree is the agent-visible UI) exposes `SemanticValue` raws — ISO instants, decimal strings, raw addresses — so an agent never parses `1.000,50` and gets it wrong by 1000×. Localized strings are render exhaust; the plan compiler refuses them as action inputs (CaMeL discipline: untrusted rendered text cannot become plan structure).
- **Approval ceremonies render in the user's UI language with canonical values beside:** "Send 1 043,50 € (raw: `1043.50 EUR`) on 7 juil. 2026 (raw: `2026-07-07T14:00:00Z`) to `<efs-identifier ceremony>`." The localized surface is for comprehension; the canonical line is what is signed; receipts store the canonical tuple (§3).
- Agent receipts use the **canonical track only** — a receipt quoted back into a later plan must be byte-stable across devices and time.

### Honesty obligations

- **Never sign or hash localized output;** the raw value is the datum, the localized string is a labeled lens (§3). A receipt's locale chip is a read-grade-adjacent qualifier, rendered by the same surface discipline as venue chips.
- **The grade-string catalog is itself a language pack** — one shared, signed catalog so STALE-vs-REVOKED wording cannot fork per client ([[read-lens-spec]] RR4 depends on wording). Safety-critical strings (grade labels, ceremony verbs, deny-fact notices) are **never machine-translated**: an untranslated safety string falls back to the English source with a "not yet translated" marker rather than an unreviewed NMT guess. Translation sets for these strings need curator endorsement (k-of-n, same F4 quorum shape). [reasoned]
- **Tofu is honest** (§4): missing-pack rendering is visibly degraded and says why; "approximate rendering" is labeled.
- **Detected ≠ declared:** heuristic language tags carry the "detected, not declared" note (§8); unknown language is never silently rendered as English.
- **Pack staleness is disclosed** where it affects safety-critical display: "rendered with locale pack N" on identifier/ceremony surfaces under superseded packs (G3).
- **No positive trust chrome** in any of the above: badges warn (`mixed-script`, `bidi-stripped`, "machine translation"); nothing green-checks a "safe" name.

## Open questions

- [x] **Refinement vs thesis F10 wording:** the thesis says LocaleHandle formats "without disclosing the profile"; this doc argues string-returning methods *do* disclose through outputs, and true zero-disclosure is the Tier-0 format-at-the-edge path with Tier 1 metered. Amend F10's phrasing or reject the refinement. — resolved by [[web-os-thesis]] Amendment 10 (2026-07-07)
- [ ] Entropy-budget constants: per-class bit estimates, the ~12-bit promptless pool, and whether `compare()` results should additionally be coarsened (e.g., locale-bucketed collation) instead of merely metered. [open]
- [ ] Grade-string catalog governance: who curates safety-critical translations, quorum size, and whether fallback-to-English is acceptable locale equity or needs a "reviewed human translation required before pack ships" gate.
- [ ] Launch language/font pack set: which locales get first-party MF2 catalogs at v2 launch; which script blocks beyond core ship as day-one optional packs.
- [ ] Canonical track scope: does the ICU4X pack also own tz-database pinning for Temporal-rendered times, or is tzdata a separate pinned pack in the closure manifest? (G3 interacts.)
- [ ] Input lease ergonomics (§5): app-declared overlay coordinates vs Shell-chosen placement — spoofing surface review needed with the secure-ui lane.
- [ ] MF2 translator tooling: validator scope in the SDK, and whether we fund/adopt a TMS bridge so the Fluent failure mode (syntax breaks translator tooling) doesn't recur.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain verified against current design set (no dangling links)
- [ ] No AGENT-Q comments remain
- [ ] At least one round of `#status/review` with another agent or human comment
