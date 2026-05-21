# Architecture

Cross-cutting EFS system documentation. Descriptive ("how X works today"), not deliberative (proposed changes go in [[design-system|Designs/]]). This file is the folder intro + curated content map.

**Source-of-truth note.** Where detailed system behavior is documented in `contracts/specs/`, this folder summarizes and links rather than re-stating. Specs in each owning repo are authoritative for their layer; `Architecture/` is the cross-cutting view.

## Status

This folder is currently a placeholder. Content will be added as agents and the human identify cross-cutting articles worth writing. Candidate topics:

- **System overview** — three-layer model (Paths → Data → Mirrors), how attestations compose, what the kernel does vs. the overlay.
- **Lenses & resolution** — what a lens is (see [[Glossary#Lens]]), how multi-lens resolution composes, default lens chain.
- **Schemas at a glance** — the seven EAS schemas (ANCHOR, DATA, MIRROR, PIN, TAG, PROPERTY, SORT_INFO) and how they relate.
- **Upload flow** — what a user's "save" actually does, step by step.
- **Read flow** — what `web3://<router>/path/file.png` does, step by step.
- **Permanence tiers** — Etched / Durable / Ephemeral as a working model.

Each candidate becomes its own `Architecture/<topic>.md` file when written.

## Existing material

*(none yet — placeholder)*

## What goes here vs. elsewhere

- "How X works today" → here (`Architecture/`).
- "What's a TAG attestation?" (term-level) → [[Glossary]].
- "How do I write a design?" (procedural) → `Onboarding/` (see [[Onboarding/README|its content map]]).
- "We should change how X works" → `Designs/`.
- Solidity-level detail with ABI / function signatures → `contracts/specs/`. Link here, don't duplicate.
