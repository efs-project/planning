# EFS v2 SDK — owner rulings

**Status:** reference — append-only authority record for this design set
**Audience:** SDK PM, project owner, Core/contracts, Web Client/OS, and Data Explorer teams
**Last reconciled:** 2026-08-22

#status/reference #kind/decision #repo/planning #repo/sdk #repo/contracts #repo/client #topic/efsv2

This file records dated owner direction. It does not turn a draft mechanism,
package name, ABI, experiment result, or generated artifact into an adopted
design. Current EFS-wide rulings in [[../efsv2/owner-rulings]] retain higher
protocol authority.

## 2026-08-22 — SDK PM mandate and durability horizon

**RULED (James, EFS Founder):** the durable SDK PM may read and write project
files, own the SDK developer experience, and undertake the research,
brainstorming, and experimentation needed for high-quality results. Durable SDK
design work may live in the planning repository, with `Designs/sdkv2/` selected
as the current source spine.

The design target is modern, featureful, usable, and future-proof. The founder
initially used a shorter project horizon in this exchange, then issued the
same-day century correction recorded below. The later 100-year direction
governs.

**Boundary retained:** this authorization expands the mandate from a read-only
chat checkpoint to durable draft design and later bounded experimentation. The
current first pass ends at research, architecture, and an experiment program;
each later run begins only from a reviewed packet with an exact disposable
profile, closure, gates, and destruction conditions. The mandate does not by
itself promote a design, freeze protocol bytes/IDs/limits/semantics, select a
package or deployment, publish conformance, or supersede the normal owner gates
in [[../efsv2/owner-decision-inbox]].

## 2026-08-22 — century-preservation correction

**RULED (James, EFS Founder):** once the EFS protocol is frozen, its intended
frozen/preservation horizon is 100 years. Align the SDK program with that
century discipline; do not silently reduce the owner goal to a shorter SDK
horizon. This is a durability rule, not a claim that today's open v2 bytes are
already frozen.

A particular replaceable SDK release may later have a shorter, explicitly
named active-maintenance window, but that does not narrow the preservation
contract. Exact evidence, archived specifications and vectors, reproducible
source/tool/output closure, offline reconstruction, and independent
reimplementation must remain designed for the full century horizon.
