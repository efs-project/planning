# Bounded polish revision

Saved October 26, 2026. Both versions contain 30 slides, including transitions
and the thank-you/Q&A page. The organizer's deck was not changed or submitted.

The main narration is **2,045 words**, with **18:30 planned**. This is not a
measured rehearsal. Read the opening narration in each speaker note. Optional
technical detail and sources support preparation and questions.

## What changed

The audience's existing app still drives the talk through Interface, Data and
Rules. Slide 6 now asks listeners to choose one important user task. Chapter
openings and the closing checklist return to that task.

Slide 10 adds a concrete hostile-control scenario: a name points to a malicious
release, while a user can open a retained release through its previously trusted
identifier. Slide 23 connects that choice of interface to the value of stable
contract rules. Neither scenario claims that retaining an interface alone
protects every dependency.

The polish also makes privacy and separate encryption-key recovery explicit,
aligns the attachment revision and author across the data examples, names
Ethereum full nodes, asks who can fund replacement services, and spells out
upgrade, pause, redirection and permission powers in the checklist. James's
theme, owner-edited examples and latest problem-slide spacing are preserved.

Slide 18 labels the EFS deployment-archive check with its July 29 date. The
[pinned evidence table](https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md)
records matching IPFS and Arweave copies. This is a historical result summary,
not a fresh retrieval or a screenshot of verifier output. The diagram's note
path is illustrative and is not the archive tested in that record.

No recurring fictional-app tutorial, new public checklist destination, QR code
or live demo was added. The preceding
[[Devcon/presentation/2026-10-26-concept-first/README]] remains intact.

## Files

- [Presentation PDF](presentation.pdf): visual reference.
- [Editable PowerPoint](presentation.pptx): exported slides and notes.
- [Slide text and notes](slides-and-notes.md): current spoken route and sources.
- [Before PDF](before-presentation.pdf) and
  [before PowerPoint](before-presentation.pptx): owner-edited pre-polish deck.
- [Before text and notes](before-slides-and-notes.md): readable comparison.
- [Manifest](manifest.json): hashes, counts and verification boundaries.

## Checks and limits

All 30 initial output pages were rendered and visually inspected. A single
repair pass adjusted the naming and EFS footer positions and tightened two
speaker-note explanations. The two visually changed pages were re-inspected.
The remaining 28 final PNGs match the inspected pages byte for byte.

Native and exported text, order and notes agree. All source slides, backgrounds,
layouts, masters and media are preserved. Diagrams remain editable. The native
output checker reports zero issues; the export-verification helper's 17 tests
and the archive checks pass. Exported PowerPoint theme filenames may change, so
verification compares theme bytes and their effective consumer assignments.

Both PDF exports contain a dangling metadata-object warning. Page rendering
and text checks pass; privacy checks cover extracted text and resolvable
metadata, with the warning retained in the manifest. No fresh runtime test,
deployment, measured rehearsal or organizer delivery is established here.

## Next read-through

Speak through slides 1-29 without stopping to edit. Skip optional detail and
sources. Record elapsed time and the first place a listener might lose the
connection to their own app. Check whether the talk leaves a developer able
to choose one useful improvement without feeling they must rebuild everything.
