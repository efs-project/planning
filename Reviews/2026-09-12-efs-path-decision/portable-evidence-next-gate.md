# Portability must include keeping evidence, not just replaying commands

September 13, 2026 · source-derived challenge for both candidates; not executed
tests, a feature waiver, or a new architecture decision

Both compact candidates currently import a publication by replaying its entire
action batch, including old binding preconditions and current acceptance rules.
That is useful for reproducing a compatible history in a fresh destination. It
is not yet a general way to preserve a file's authored evidence somewhere else.

The distinction matters for a filesystem meant to outlive its original apps
and authors. Our existing [[sdk-fixture]] separates source evidence, destination
admission and current selection; its original import example uses a fresh
destination. The following are stronger follow-on cases, not retroactive
claims that the small paid slice was specified to implement them.

## Three small challenges for the finalist

| Situation | Current source implies | What the proposed follow-on must distinguish |
| --- | --- | --- |
| Copy the latest revision into a destination whose binding history has diverged. | Replaying the old CAS fails; changing it breaks the original signature. | Retain the exact revision and original claim without changing the destination head. Any new binding needs separate current authorization/CAS. |
| Archive an outfit accepted years ago, but rejected by today's state-dependent rule. | Current import revalidation refuses, rolling back evidence retention too. | Keeping historical evidence is not newly accepting or equipping the outfit. A signature alone does not prove its historical admission. |
| Recover one file from a signed two-file batch when the unrelated file's body is unavailable. | Whole-batch import requires both new bodies and fails. | Verify the retained complete action vector, admit only the available selected record under destination rules, and explicitly mark omitted data/history. |

These are source-inferred counterexamples, not observed failing receipts. They
must become one bounded joined portability experiment after the paid comparison,
not three new implementations now.

## The promising repair is smaller than a signature redesign

Existing signatures commit action tuples containing body hashes. If those
tuples survive, a separate evidence-retention/selected-admission route could
verify the **unchanged** full vector while requiring only the selected body's
bytes. It need not replay unrelated bindings or claim omitted actions were
admitted. This needs contract-visible evidence and appropriate discovery;
an SDK-only archive cannot supply a missing onchain admission surface.

If unrelated **action tuples themselves** are lost, the flat hash is a stronger
limitation: succinct independent recovery would require a new membership-proof
signature profile or an authenticated source-state witness. Do not conflate
that stronger promise with recovery when only file bodies are missing.

Historical source admission still requires an authenticated occurrence under
a named source-state/finality verification scheme. Recovering an EOA signature
proves a signed claim, not that a Realm admitted it. Neither candidate currently
supports native contract-source import. This remains a shared proof gate, not
an advantage inferred from one candidate's data hashes.

## Concrete source difference and decision impact

B's current import additionally requires the original EOA's destination
authorization; an unavailable author therefore blocks it unless a usable
authorization was prepared beforehand. C permits an independent importer with
separate packet-specific destination authorization. Evidence-only copying
should not silently inherit B's author-liveness dependency.

The likely repair adds evidence/leaf/coverage bookkeeping and proof costs but
avoids unrelated replay writes and validators. Its price is **unmeasured**.
These findings neither select B/C nor invalidate the current small storage
comparison; they prevent presenting whole-history replay as complete portable
Files. No owner acceptance of weaker portability is inferred.

Source review pins: B `4b6154695c89976a7325cd0c51dc9591dee387c1`, C
`2ca7349e5d683c3ff10651c0fc106c10da946145`. Relevant code beneath each arm's
`Reviews/2026-09-12-efs-path-decision/lab-{b,c}/src/`: B `Ledger.sol` lines
282–328 (authorization/replay), 594–602 (CAS), 109–122 (source evidence);
C `ImportLib.sol` lines 35–74 and 88–171 (authorization/replay/evidence),
`ActionLib.sol` lines 309–335 and 375–379 (acceptance/CAS), `EfsTypes.sol`
lines 102–118 (source metadata). The independent reviewer read pinned source
and common requirements only; no code or chain state was changed.
