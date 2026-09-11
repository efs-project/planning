# Prototype round 2 — K10 measured on the index-layer lab (2026-09-11, small hours)

**Status:** working note on the files-browser branch; not a design and not a
ruling. Follows [prototype-round-1-2026-09-10.md](prototype-round-1-2026-09-10.md).
Built by an agent under the integration-test-lead's workflow, adversarially
reviewed by a second agent (all eight code checks PASS; its report-accuracy
findings are applied), test suites re-run by the lead before committing.
Every number is **MEASURED** (retained artifact under
[../2026-09-10-index-layer-lab/evidence/](../2026-09-10-index-layer-lab/evidence/))
unless marked ESTIMATED or OBSERVED. Full detail:
[../2026-09-10-index-layer-lab/README.md §9](../2026-09-10-index-layer-lab/README.md).

## 1. The position bug is fixed, red → green

A publication that first-binds several positions in the same scope now gets
positions in leaf order from the pre-admission scope count (the kernel's own
order). The new six-leaf test (`entry | bind | whiteout | bind | entry |
bind` in one author-signed publication) fails against the round-1 hook
(`position 1 bucket fileA — false !== true`: all three bits had landed on
the last position) and passes with the fix; the reviewer reproduced both.
Cost: +1,604 gas per placement (position fix plus the locator refactor).

## 2. Codex's K10 patch, applied and measured

The four kernel files from `fe98f18` are byte-identical in the lab's pinned
copy; the shared kernel is untouched. A fresh world selects `scopeLayout = 1`
before `initialize` exactly as Codex's harness does; the populated world
stays on layout 0 as the control; a third run (fresh world, layout 0, same
patched library) isolates the layout from the library. Every place the lab
turned a kind-10 lane into an admission ordinal now goes through one helper
that is layout-aware (in mode 1: kind-8 word 0 of `bindingKeys[lane]`), and
the reviewer audited every read site — no binding-key ordinal is ever
compared with an admission ordinal, and the mode is read from the stored
discriminator, never inferred from values (Codex's two hard rules).

| backfill per entry (64→128 marginal, N = 1,000) | mode 0 (today) | mode 1 (K10) | K10 − today |
| --- | ---: | ---: | ---: |
| receipt gas | **56,425** | **31,384** | **−25,041 (−44.4 %)** |
| SLOADs | 24 (38,775) | 10 (17,375) | −14 (−21,400) |
| interpreter plumbing | 17,550 | 13,908 | −3,641 |

The leg the round-1 estimate priced (admission row → envelope bytes →
BindingSet body → key: 15 reads, ≈21,400) is exactly the SLOAD column; the
plumbing it could not separate is a further 3,641. **Largest backfill chunk
under 16,777,216: 273 today → 491 with K10** (517 out of gas; not bisected
further) — within a few entries of the design's 512 but a 512-entry chunk was
not shown to land. Sparse arm: 79,121 → 54,716 per entry.

**What K10 makes dearer.** Every lane-to-admission comparison costs three
cold reads instead of one, so the log-N derivations pay ≈3×: coverage-slot
init 100,980 → 146,572; the hook's reverse locator on a rebind ≈23k → ≈69k
at N = 1,000 (hook frame +46k per rebind); a born-after-declaration probe
+4,767. Placements, hits, covered misses, pages and declare are unchanged
(0 delta); the K10 kernel's own `scopeLayout` read adds +2,807 per admission.
Codex's hydrated kind-10 page reader at K10 reverts for 256 items (out of gas
under the cap; 64 items ≈4.79M, 16 ≈1.34M) — the hydration is ≈72k per item.

## 3. N = 10,000 — partial

10,000 placements were populated in mode 0 (≈31 minutes; per-transaction
time grew from ≈40 ms to ≈325 ms as anvil's per-block cost rose with state
size — OBSERVED from the console, log not retained). Retained: backfill 32 /
64 / 128 at **56,425 per entry, identical to N = 1,000**, and the reverse
locator at N = 10,000: 14 lane probes instead of 11, hook frame on a
field-change rebind 126,944 → 137,587 (+10,643, ≈3,550 per extra probe).
The traced node dropped the connection on the 256-chunk trace (12 traced
multi-million-gas transactions on an 87 MiB world, machine swapping), and
the remaining 10k items (chunk cap, probes, pages, oracle) were not captured;
every missing item is N-independent by construction and stands at its 1k
value. Mode 1 at 10k was not run (its only N term is the locator; ESTIMATED
≈108k at 10k from the measured per-probe premium).

## 4. What this changes

- K10's value is now a measured −44 % on the backfill walk and a chunk cap
  of ~491, at the price of 3× on every lane-to-admission derivation — the
  trade Codex's handoff predicted (cheaper lookup, dearer history). Whether
  to take it is still the owner's; it must precede `initialize()` on any
  world that wants it.
- The reviewer's remaining findings are accuracy and shape: a
  `firstAdmissionOfKey` returning 0 on an absent history (unreachable under
  the kernel, but the confirms-but-unreadable shape — now reverts), the
  report scripts defaulting an absent world block to layout 0 (now refuse),
  code-size figures and step-1 receipts in the write-up that the later runs
  had overwritten (corrected to the retained values), and the 10k wall-clock
  figures relabelled OBSERVED.
- Still open in the lab: withdrawal-driven tombstones are not hooked; attach
  authority is "anyone"; the mode-1 walk trusts the kernel's kind-10 inventory
  to name keys of the scope (the mode-0 walk re-derives the scope from the
  BindingSet body); 10k mode 1.
