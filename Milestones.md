# Milestones

Cross-repo milestone tracking for EFS.

> **Current phase (2026-07-23): design and rebuild.** The pre-v2 contracts,
> SDK, and clients are evidence and reference implementations, not the baseline
> for a mainnet release. EFS v2 is in constitutional reconciliation; no
> mainnet date or v2 implementation deadline has been set.

James owns milestone scope. Agents may record completed outcomes and keep status
honest, but must not invent dates, requirements, or launch commitments.

---

## Devcon presentation (2026-11)

**Status:** the only current dated milestone; scope is not yet locked.

The presentation should describe and demonstrate whatever is genuinely coherent
by Devcon. It must not turn an unfinished v2 design into a launch promise.

### Current inputs

- The v1 Sepolia deployment and explorer are useful evidence about what worked,
  what accumulated complexity, and why EFS is being redesigned.
- The current v2 spine is
  [[Designs/efsv2/README|Designs/efsv2/README.md]]. It is
  reconciliation-ready, not promotion- or implementation-ready.
- The Client v2 design set is
  [[Designs/clientv2/README|Designs/clientv2/README.md]]. Its exact app lane,
  rendering ABI, and implementation target remain evidence-gated.

### Possible presentation shape — not commitments

- What EFS is trying to make possible.
- What the v1 Sepolia system taught us.
- The coherent v2 architecture that exists by then.
- A working demonstration only if it represents the architecture honestly.

### Hard requirements

None locked. James will add them when the v2 research and implementation shape
are concrete enough to make commitments meaningful.

---

## History

### The Forever Files / OnionDAO buildathon (June–July 2026)

**Wound down 2026-07-01.** EFS deployed its v1 system to Sepolia, shipped a
usable explorer path, and produced reusable event and dataset materials. Turnout
was low, so the event did not become an ongoing delivery milestone. The v1 SDK
branch remained unmerged and is now legacy input to the from-scratch v2
redesign. See [[Decisions]] and [[Kanban]] for the detailed record.

---

## Maintenance rule

- Keep only live dated milestones above **History**.
- Move closed or cancelled milestones to **History** with a concise outcome.
- Link execution work to [[Kanban]] rather than copying its cards here.
- Do not convert research directions, design holds, or hoped-for demos into
  milestone requirements without James's explicit decision.
