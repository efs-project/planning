# Local Git fixture experiments

**Lane:** first-hand behavior checks — run 2026-08-07 on `git version 2.54.0` (macOS), scripted, throwaway local repositories only. These ground load-bearing design claims in observed behavior rather than documentation memory.

#kind/review #status/done #repo/planning #topic/git

## E1 — Bundles round-trip identity

`git bundle create --all` from a two-commit repo, then `git clone` from the bundle: tip OIDs identical byte-for-byte. A bundle is a complete, verifiable, single-file transport of refs + objects. **Claim grounded:** deterministic bundles are a valid archival/exit primitive; the Git profile of `.efs-bundle` can contain an ordinary Git bundle without loss.

## E2 — Incremental bundles carry explicit prerequisites

`git bundle create incr.bundle main~1..main` verifies cleanly (`git bundle verify`) in a repo holding the base commit, and **fails with a named missing prerequisite** in an empty repo. Incremental bundles are self-describing about their required base — the transport-level analogue of a thin pack, with the check built into stock tooling. **Claim grounded:** checkpoint-plus-increment container chains are verifiable without custom code.

## E3 — Repacking changes pack bytes, never identity

Repacking with different delta settings (`--window=1 --depth=1` vs default `-adf`) produces different pack files while every OID and ref is unchanged. **Claim grounded:** pack layout is a transport/cache artifact. Any design that keys storage or identity on a pack digest alone (as GoE keys FlatDirectory entries on an ending-commit OID) confuses cache identity with repository identity; committed *container digests* are fine as availability evidence, but must never be the only path to the objects.

## E4 — Non-atomic multi-ref push partially applies; `--atomic` is all-or-nothing

Two refs pushed where one CAS is stale (`main` behind, `feat` fresh), against a local bare repo:

- default push: **`feat` advanced, `main` rejected** — the host ends in a state neither writer intended (exactly the partial-update failure documented against GoE);
- `git push --atomic`: both refs rejected (`atomic push failed for ref refs/heads/main. status: 5`), host refs untouched.

**Claim grounded:** stock `receive-pack` already implements atomic multi-ref compare-and-swap; a conforming EFS gateway gets Git's atomic capability for free and must simply advertise it honestly. Nothing needs reinventing at the transport.

## E5 — `git update-ref --stdin` is a server-side multi-ref transaction

A `start/update…/prepare/commit` script updating two refs with correct old values commits atomically; a wrong old value aborts the whole transaction. **Claim grounded:** the gateway's materialized bare repo can apply an EFS ref transaction (N refs, each with expected-old) as one native transaction — the reconciliation step from admitted EFS ref claims to a served Git repository is a solved primitive.

## E6 — Force-push displacement survives only until GC; retention is not automatic

After a force-push removing a "leaked secret" commit:

- the displaced commit still existed server-side as an **unadvertised, unreachable object** (`cat-file -t` → `commit`; `for-each-ref` shows nothing pointing at it);
- an explicit fetch by SHA succeeded over the local transport (over smart HTTP this depends on `uploadpack.allowAnySHA1InWant`, off by default);
- `git gc --prune=now` on the host **permanently destroyed it** (`cat-file: could not get object info`).

(Caveat observed on the way: a local-path `git clone` copies the whole object store including unreachable objects — file:// clones over-share relative to protocol clones.)

**Claim grounded:** Git itself gives displaced history *no durable home*. Forges keep it by private convention (reflogs, hidden refs, delayed GC). If EFS promises force-push auditability and recovery, retaining the displaced closure and its ref-transition evidence is an **explicit EFS responsibility** — a retention rule over placement containers plus the ref-claim history — not something the Git layer provides.

## E7 — SHA-1 ↔ SHA-256 repositories still do not interoperate

`git push` from a SHA-256 repo (`--object-format=sha256`, 64-hex OIDs) to a SHA-1 host fails: `fatal: the receiving end does not support this repository's hash algorithm`. In git 2.54 there is no object-format bridge in fetch/push; the interop layer described in the transition plan is not shipped. **Claim grounded:** the object-format algorithm is a per-repository constant that the portable repository descriptor must pin at genesis, and cross-format migration is history rewriting (new OIDs), not a transport concern. `(algorithm, digest)` tagging of every OID in EFS records is mandatory, exactly as the GoE review recommended.

## E8 — `receive.fsckObjects` is a functioning admission gate

A bare host with `receive.fsckObjects=true` accepts a clean push; the option subjects every incoming object to fsck checks at admission. **Claim grounded:** the object-sanitation gate the threat model needs (malformed objects, dangerous tree entries) has a stock enforcement point at `receive-pack`/`index-pack`; EFS gateways enable it plus size/limit controls rather than writing a validator.

## E9 — Prose merge behavior: paragraphs are the conflict unit

Three-way merge of two edits to **different paragraphs** of one Markdown file: clean automatic merge. Two edits to the **same paragraph**: `CONFLICT (content)` with visible markers. Line-based merge is exactly paragraph-based merge for one-line paragraphs; hard-wrapped prose degrades this (reflow turns one edit into many-line churn). **Claim grounded:** for a wiki storing one paragraph per line (soft-wrap convention), stock Git merge yields intuitive "same-paragraph = conflict, different-paragraph = clean" behavior with zero custom merge machinery; the same-paragraph case must surface as a human choice (two-version UI), matching the fs-pass C7 ruling that active conflicts end by curation, not automatic merging.

## E9b — Sentence-per-line merge granularity (adversarial-review follow-up)

Rerun of E9 with a one-sentence-per-line fixture, two branches from one base: concurrent edits to **adjacent** sentences (adjacent lines) → `CONFLICT (content)`; concurrent edits separated by **one untouched sentence** → clean auto-merge. **Claim corrected:** the conflict unit under sentence-per-line is *same-or-adjacent sentences*, not same-sentence-only — Git's 3-way merge conflicts on adjacent changed lines with no separating context. Still far finer than paragraph granularity, and the two-versions conflict UI must expect adjacent-sentence collisions.

## E10 — `rev-list --objects` enumerates the closure

`git rev-list --objects main` lists every object reachable from a ref (9 for the fixture); `git rev-list --objects old..new` lists exactly the objects a ref advance adds — **the upload set for closure-complete publication**. Connectivity checking after `index-pack` is the standard verification of the same property. **Claim grounded:** "publish uploads the missing required object closure before advertising the new ref" is implementable with two stock plumbing commands; the object-closure manifest can commit to this enumeration without inventing a traversal.

## E11 — Renames are read-time inference, not recorded facts

After `git mv Page.md Renamed.md` + commit: `git log --follow` reconstructs 3 commits of history; plain `git log` on the new path sees 1. Git stores no rename record — `--follow` is a similarity heuristic applied at read time. **Claim grounded:** durable page identity across renames cannot be delegated to Git. A stable per-page identity that survives moves needs a sidecar — which EFS already has natively (a DATA identity plus `movedTo` redirect claims). This is a genuine EFS contribution to the wiki experience, not duplication of Git.

## Reproduction

Scripts preserved in the session scratchpad (`gitlab/experiments*.sh`); all fixtures are synthetic throwaway repos. Re-run cost ≈ seconds. No network access, no live deployments touched.
