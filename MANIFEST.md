# Source-lock and non-adoption manifest — Evolution and Immutable Consumer Tournament

**DISPOSABLE** · `protocolConformance=false` · `notAdopted=true` · `goCodeAuthorized=false`

Lab: `experiments/efs2-consumer-tournament-2026-08-26/`, standalone local git
repo, branch `lab/2026-08-26-fable-consumer-tournament`. Local commits only —
never pushed, merged, PR'd, deployed, or published. No canonical planning /
contracts / SDK / client file is edited by this mission. No permanent protocol
bytes, canonical Type IDs, freeze claims, or owner decisions are produced here.
Every ID, domain, cap, and byte in this lab is **fixture-local**; the production
coordinate for each is `BLOCKED_BY_CORE_INPUT` (V2-F1 owns them).

## Authority source-lock (recorded before work began, 2026-08-26)

Planning vault `/Users/james/Code/EFS/planning-v2-readiness`:
- HEAD `2573f08b170bf3eb855ad5a68c31ee7b0215272d` ("design: recommend EFS v2
  candidate engineering", 2026-08-25 06:34:57 -0400), branch
  `codex/v2-readiness-week`, **working tree clean (0 dirty files)**.
- Matches the HEAD Codex observed (`2573f08`). No drift.

Authority files read in the commissioned order, sha256:

| file | sha256 |
|---|---|
| `AGENTS.md` | `c7335f95a155089caebfe81f07bbddeee6834047803f3ba79ff2fd8333d581a5` |
| `Designs/efsv2/owner-decision-inbox.md` | `3706ad905ac2cc71c0af02cb51641b367845cbd4969cc9874d1a793b307c5b72` |
| `Designs/efsv2/v2-contract-readiness-program.md` | `091ce6d989ce4be0c4659998f200da278211e611f975581cd7f80fb0bf16e19e` |
| `Designs/efsv2/layered-type-system-and-data-abi.md` | `500fd3c95d016e4f458793e7724707b46920fb29873a6cc0f228e28b71370680` |
| `Reviews/2026-08-25-efs2-exp-c0-v0-control/README.md` | `3d2fdf3f5fd43dad79e57bfee2d348e738439232e8199b0064ad99f556427d29` |

Owner state at lock: `V2-C1` pending, `goCodeAuthorized=false`,
`technicalDisposition=RECOMMEND-GO-CODE`. Gate vector G0–G6 all `PARTIAL`.
This mission changes none of that.

## Toolchain lock

- forge 1.7.1 (commit `4072e48705af9d93e3c0f6e29e93b5e9a40caed8`), anvil/cast same install
- Solidity compiler: forge-managed `solc 0.8.30`, EVM `osaka`, optimizer 200,
  via-IR — same disposable profile EXP-C0/v0 pinned, for comparability
- Python 3.14.4 (`/opt/homebrew/bin/python3`), stdlib only (no pip installs)
- Node v24.11.0 (not used by the tournament unless a check needs it)
- macOS Darwin 25.5.0

## Alignment with EXP-C0/v0 (read-only)

The candidate body law exercised here mirrors the C0 selections so results
transfer: outer envelope `abi.encode(uint16 codecVersion, bytes payload)`;
codec 0 = `ABI_TUPLE_V0` (fields as components ascending `fieldKey`; `U64,
BOOL, BYTES, RECORD_ID` → `uint64, bool, bytes, bytes32`; required = bare `T`;
optional = `(bool present, T value)` with absent ⇒ zero; canonical =
decode-then-byte-identical-re-encode before interpretation); unknown codecs
retained raw but `UNSUPPORTED`. No C0 source file is imported, edited, or
executed by this lab; C0 prose only.

## Independence declaration

- The pure Python oracle and the Solidity SUT share only the sealed fixture
  bytes and the pre-registered prose semantics in `HYPOTHESES.md`. They share
  no parser, validator, acceptance function, or generated expected answers.
- Honest limit: both are written by the same agent (Fable) in one night.
  Independence is implementation-level (different language, structure,
  algorithms), not author-level.
- Prior Fable labs (`experiments/efs2-type-lab-2026-08-17`,
  `experiments/efs2-type-fable-overnight-2026-08-22`) are read **only after**
  the `HYPOTHESES.md` seal commit, and only for duplication control. Neither is
  modified. The Task 3 escrow and 3C bundle are not touched.

## Other agents' state at lock

`experiments/` contains 16 sibling labs from concurrent agents; none is
modified by this mission. The planning vault's standing "append an agent-status
line per session" rule conflicts with this mission's "do not edit canonical
planning files" rule; per the established overnight protocol the mission rule
wins and the omission is flagged here and in the morning report for James.
