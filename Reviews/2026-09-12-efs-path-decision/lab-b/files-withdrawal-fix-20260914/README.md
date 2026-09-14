# Retained Files remain readable after withdrawal

September 14. **Three corrective cases passed after a genuine three-case RED;
independent final review Approved.** This is a narrow, reversible prototype
reader fix—not new Core semantics, production readiness, or paid-cost evidence.

## Behavior and exact change

Withdrawing Alice's sole occurrence of selected revision RA still leaves its
exact bytes, authored HEAD, placement, tags and retained parent/history postings
intact. The reader now returns those valid retained contents at count0. File and
selected-revision tag folders remain COMPLETE; conflict inspection preserves
both Alice RA and Bob RB. Zero-count Root and Child parents still support actual
new descendants. Bob's native REUSE cannot toggle Alice's displayed selection or
undo Alice's withdrawn occurrence.

The only consumer change removes the aggregate occurrence-count condition from
profile integrity, removes its unused local/tuple binding, and adds a two-line
qualification comment. Type/body/hash/first-admission/File/parent checks, Lens
selection, Basis checks and completeness guards stay unchanged. Occurrence
maintenance is a separate fact, not current application validity or the number
of distinct maintainers/replicas. No new enum, fallback or maintenance filter.

## Evidence chronology

- Prior characterization remains separately retained in
  `../files-withdrawal-probe-20260914/`: existing E_PROFILE at count0, with Bob
  REUSE restoring readability, was observed before correction and not endorsed.
- Corrective RED input `20a9fdbe7e6f4f6caba836ce95717d2f4f78d9fc97d8bac4e787156befc18db9`
  compiled, then all three cases failed with E_PROFILE on the unchanged reader.
- Guard-only GREEN input
  `a03f75cdc3de9f8db1ccc3aa5fdc66dad5dede451756ac2498545dee17bc9c67`
  passed the complete suite: **158 executions = 124 distinct named cases + 34
  inherited repeats**, zero failures/skips, including all three corrective cases.
  The 17 base Files tests also run in each of two derived test contracts.
- Normal-size build passed at the same frozen GREEN input. All root-owned gates
  recorded processes stopped and slots released. No run was repeated to prepare
  this retention packet.

Source commit: `d60318efbc6b3a71a0914ebb11b2ebeebab08893`.
Corrective test SHA256, unchanged across RED/GREEN:
`f191978d5881a9660ceb58b3424f90bb5361503230905f3cf9dae5c5b2b8e0d2`.
GREEN consumer SHA256:
`0d45a6603f4fd055abe59307d93bcf651b4d66d98d89854a073265d0860713ae`.

The normal Solidity 0.8.30 / viaIR / optimizer200 / Cancun size table reports:

| Component | Runtime bytes | Compiler initcode bytes |
| --- | ---: | ---: |
| FilesJoinedConsumer | 15,865 | 19,976 |
| FilesParentIndex | 5,287 | 8,724 |
| Ledger | 17,280 | 17,670 |

Constructor arguments are excluded from the compiler-initcode column. Oversized
test-harness warnings remain visible; they are not the deployable component sizes.
Test gas in the logs is not an outer-transaction receipt price.

## Retained materials and limits

`manifest.json` records raw/gzip sizes and SHA256 hashes for **18 payloads**:
**40,404,035 raw bytes → 5,282,205 gzip bytes**, excluding README and manifest.
Every compressed file was decompressed and compared byte-for-byte. The packet
includes complete RED/full/size gate reports and logs; full RED and normal-size
compiler inputs/outputs; exact RED/GREEN consumer and unchanged test copies;
frozen configuration/source inventories; the approved plan, complete implementer
report, final review and mechanical retention script. Then-pending statements in
the historical implementer report are closed by the separate final review.

Source inventories are explicitly labeled mechanical UTF-8 escrows, checked
against the execution manifests. No changing live source/configuration or later
Index repair enters this packet. No test, chain, audit or git action was performed
to package it. The original paid Files packet remains separate and prices only
its original pre-fix consumer; **there are no new paid prices here**.

Named state checks are not exhaustive storage diffs or authenticated state
proofs. This result does not choose a universal display policy, application
revocation behavior, advanced placement withdrawal, privacy policy, architecture,
or permanent protocol. Those distinctions remain explicit in the approved plan
and final review.
