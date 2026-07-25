# 2026-07-25 — EFS v2 joined KEL × authority × lens filesystem pass (record)

**Status:** done
**Target repos:** planning
**Depends on:** [[owner-rulings]], [[owner-decision-inbox]], [[assumptions-and-requirements]], [[kel]], [[ethereum-first-efs-and-os]]

#status/done #kind/review #topic/efsv2

## What ran

The joined reconciliation pass [[ethereum-first-efs-and-os#11. Research-to-MVP sequence]] steps 1–4 + 11 demanded, under the 2026-07-23 sequencing hold's revalidation requirement. James's frame: filesystem focus with OS in mind; universal-smart-accounts headline (minimize EFS identity machinery); nine rulings incl. the L1-pointer candidate (justify or prove unnecessary), the chain-free mode + cannot-do list, first-class large on-chain files, the mount check on every choice; questions in one spot; wiki-dense linking.

**Nine agents, staged:** foundations first — [use-cases](2026-07-25-joined-fs-pass-corpus/use-cases.md) (register + five anchor journeys, verified to predate design) and [aa-inversion](2026-07-25-joined-fs-pass-corpus/aa-inversion.md) (mid-2026 AA state, web-verified; the inversion table) — then four design lanes ([authority-model](2026-07-25-joined-fs-pass-corpus/authority-model.md), [filesystem-core](2026-07-25-joined-fs-pass-corpus/filesystem-core.md), [local-mode](2026-07-25-joined-fs-pass-corpus/local-mode.md), [large-files](2026-07-25-joined-fs-pass-corpus/large-files.md)), two red teams ([attack-authority](2026-07-25-joined-fs-pass-corpus/attack-authority.md), [attack-fs](2026-07-25-joined-fs-pass-corpus/attack-fs.md)), and the binding [critic](2026-07-25-joined-fs-pass-corpus/critic.md). ~560 KB corpus; no agent failures.

## Verdict

**Held.** Zero FATAL; fifteen SERIOUS findings all confirmed-and-repaired (the D-ledger, binding via [[joined-pass-synthesis]] §2); the four seeded tensions (chains-don't-die vs stranded homes; pointer vs stop-rule; first-class bytes vs DA-tier; two-grade vs maximal topology) explicitly reconciled in every lane. Source-precedence audit clean: no adopted ruling contradicted, no settled item revived, the hold honored and made liftable rather than bypassed.

## Headlines

1. **Two-grade authority validated as a theorem about the authorization axis** — strong grade = admission co-ordered with KEL state; portable evidence structurally cannot reject post-revocation backdating — with the binding F-15 rule: a read result is a six-part tuple, never two labels.
2. **The strong grade's honest price is admission timing:** promote-promptly (promotion across a revocation cannot upgrade authorization) and revocation force-inclusion latency as a venue security parameter.
3. **The L1 pointer: designed, judged, shelved conditionally.** Nothing at MUST grade forces it; discovery is a digest-checkable hint convention (not "inside the ID"); a pointer adds discovery, never authority security, and cannot deliver censorship escape.
4. **The residual identity layer = R1–R6 with R1's home field parametric**; everything execution/recovery/ceremony-shaped is consumed from the account layer (7702/4337/7913/7951, verified current).
5. **One absence rule (four sources), one result tuple, and the P-16 mount-profile split** (snapshot/bundle as the ordinary-app profile — the red team proved hosted-RPC live mounts cannot honestly say "not found").
6. **FS-LENS/1** blessed as the read-lens-spec replacement seed; seam-6's equivocation half closed and attack-verified.
7. **Large files first-class via "the manifest is the generation"** + offset-committing leaves + geometry-bound stores; T3 dissolved (state-tier vs DA-tier vocabulary).
8. **The chain-free mode designed as a labeled ladder** (shipping it is the open P-11) with the loss ledger (L1–L10 + the added schema-as-enforcement row) and identity-preserving promotion via in-place upgrade.
9. **The owner packet P-1…P-23** delivered into [[owner-decision-inbox]]; **the sequencing hold is liftable for P-1…P-10.**

## Outputs

[[joined-pass-synthesis]] (ruling record + D-ledger + kill list + gaps) · [[owner-decision-inbox]] (rewritten packet) · [[multichain-dependency-map]] (deliverable 3) · README map updated · this record.

## Owed next (from the synthesis §6)

The lens/resolver pass (G-A) · the coordinated envelope/kernel recut (G-C, consuming the D-ledger) · measurements E1/E2 with the new riders/inputs (G-D) · the `.efs-bundle` normative spec early (G-F) · delegated gates per critic §4 · register hygiene H1–H3.
