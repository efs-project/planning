# Known recurring issues

Playbook for failure modes the EFS team has hit more than once. Each entry follows the same shape: **Symptom**, **Cause**, **Fix**, **Audit trail**.

If you encounter a failure not listed here that turns out to be a recurrence, add an entry following the same shape so the next agent or human can short-circuit the debug.

---

## Alchemy public default API key gets revoked / rate-limited

**Symptom.** CI's `deploy-pin-check` job (or any local flow that uses the hardhat fork) starts failing with `HH604: HTTP 403 Forbidden for eth-sepolia.g.alchemy.com`. Both PRs and `main` fail with the same error. The followup error is typically `HH108: Cannot connect to the network localhost` — that's a downstream consequence (the hardhat fork couldn't start, so the deploy step can't reach 127.0.0.1:8545).

**Cause.** Both EFS contracts (`packages/hardhat/hardhat.config.ts`) and the Scaffold-ETH-based debug UI (`packages/nextjs/scaffold.config.ts`) hardcode the **Scaffold-ETH-2 community Alchemy key** as a fallback. That key rotates upstream periodically — it's a shared community resource and rotates for usage-cap or maintenance reasons. When upstream rotates and the previous key is revoked, our fallback breaks.

**Fix.**

1. Find the current upstream value. Check this file: [scaffold-eth/scaffold-eth-2/blob/main/packages/hardhat/hardhat.config.ts](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/packages/hardhat/hardhat.config.ts) — look for `providerApiKey`.
2. Grep the EFS contracts repo for the **old** key value (the one that's about to break) to find every occurrence:
   ```bash
   cd /efs/contracts  # or wherever your contracts checkout is
   grep -rn "<old-key>" . --include="*.ts" | grep -v node_modules
   ```
3. Replace each occurrence with the new value. As of 2026-05-21 there are **two files** to update:
   - `packages/hardhat/hardhat.config.ts` — `providerApiKey` fallback.
   - `packages/nextjs/scaffold.config.ts` — `DEFAULT_ALCHEMY_API_KEY` constant.
4. Commit + push. CI's `deploy-pin-check` should turn green within ~5 minutes.

**Avoiding the half-fix.** When rotating any shared default value, grep the **whole repo** for the old value before claiming the fix is done. Scoping to one config file misses sibling occurrences. The 2026-05-21 rotation was half-applied in the first commit (only hardhat config) and required a follow-up commit to update the nextjs side. Don't repeat this — one grep, find all occurrences, single commit.

**Audit trail.** Known rotations to date:

- **2026-05-21** — rotated to `IZYEU2cWBgnFmgiTAgpWD`, mirroring upstream [scaffold-eth/scaffold-eth-2@69828b1](https://github.com/scaffold-eth/scaffold-eth-2/commit/69828b16f429526ff28bbc382b02c98e54e55a44) ("new Alchemy key (#1287)"). EFS contracts commits: `379d485` (hardhat side) + `4d5a5c3` (nextjs side). The half-fix happened here; lesson noted above.
- Earlier rotations exist but were not documented at the time. James confirms: "we've had to update this key a few times."

**Production note.** This shared default is for **dev / CI / hackathon use only**. Production deployments should set `ALCHEMY_API_KEY` (server) and `NEXT_PUBLIC_ALCHEMY_API_KEY` (client) explicitly — never rely on the shared community key in production.

**Related context.** The `deploy-pin-check` job is `continue-on-error: true` per [ADR-0028](../../contracts/docs/adr/0028-ci-graceful-degradation.md) (graceful degradation). A failing `deploy-pin-check` won't block PR merges, but the red X is visible and erodes signal — so it's worth fixing promptly even though it's technically non-blocking.

---

*(Add new recurring failure modes below this line, following the same shape.)*
