# Presentation versions

James requested Git versions of the presentation on October 13, 2026 after
his first read-through. Keep a dated snapshot here before a substantial
rewrite and after each meaningful rehearsal revision.

The Google Slides rehearsal copy is the editing surface. These files make
each saved revision available independently of Google Slides revision history.
Private organizer links, Google file identifiers and temporary download URLs
stay outside this repository.

## Saved versions

| Snapshot | What it records | Practice |
| --- | --- | --- |
| [October 26 concrete examples](2026-10-26-concrete-examples/README.md) | Current rehearsal deck. Garden DAO connects composed modules, portable EAS/EFS records, stack diagrams and a new worked walk-away drill. Preserves James's theme and latest 29-slide baseline; final version has 30 slides. | 18:40 planned, not measured. Main narration is 2,094 words. |
| [October 26 positive vision](2026-10-26-positive-vision/README.md) | Previous rehearsal deck. Makes the hyperstructure vision visual, adds shared-data examples, explicitly encourages immutable contracts and finishes with eight practical checks. Preserves the official theme and the 28-slide owner-edited baseline. | 18:30 planned, not measured. One spoken route with optional technical detail kept separate. |
| [October 26 theme review](2026-10-26-theme-review/README.md) | Previous rehearsal deck. Preserves James's 27-slide themed arrangement, fills three placeholders, aligns chapter labels and placement, improves readability and adds brief transition cues. Includes the before-cleanup files. | 19:40 planned, not measured. Main narration is 2,173 words. |
| [October 20 integrated spine](2026-10-20-integrated-spine/README.md) | Previous content revision. Combines the user-led story, developer action and shared-infrastructure vision with eight jobs and two walk-away scenarios. Audits the examples and adds Teia's community-continuation story. | 19 minutes planned. Main narration is 2,089 words. No rehearsal recorded. |
| [October 20 practice deck](2026-10-20-practice/README.md) | Previous practice pass. Preserves the opening and three chapters, adds concrete Safe recovery, PoolTogether worker, Uniswap v2 and Safe CLI examples, and shorter alternatives for the dense sections. | 19 minutes planned. Main narration is 2,143 words. Not rehearsed before the integrated revision. |
| [October 13 opening and vision](2026-10-13-opening-vision/README.md) | The introduction states the user and builder problem, durable-app vision and method. CROPS and hyperstructures make the ambition explicit. Same 18 main slides plus a resource page. | 19 minutes planned; no rehearsal recorded for this version. |
| [October 13 content-first revision](2026-10-13-content-flow/README.md) | First rewrite around the problem and vision, eight layers in three chapters, 18 main slides plus a resource page, readable type and spoken notes. Static content only. | 19 minutes planned; not rehearsed before the opening revision. |
| [October 13 first read-through](2026-10-13-first-readthrough/README.md) | October 12 template deck after the color pass, before the proposed story/stack revision. 27 slides with speaker notes. | James reports reading the notes in 17 minutes. |

Each snapshot contains:

- `presentation.pdf`: the exported visual reference, readable without a slide editor.
- `presentation.pptx`: editable exported slides and speaker notes.
- `slides-and-notes.md`: text from the native deck, for readable Git diffs and searches.
- `manifest.json`: file sizes and SHA-256 hashes for the snapshot.

## Saving and recovering revisions

Before changing the live deck substantially, export the current deck to a new
dated folder. Include an identifying suffix if there is more than one version
that day. Extract all slide text and speaker notes, including skipped slides,
and record the revision's purpose and rehearsal result. Check page count,
PowerPoint package integrity and speaker-note coverage. Inspect exports for
private URLs before committing exact paths.

Keep prior snapshot folders intact. Use the PDF to look back at the design and
the Markdown to compare wording. Open the PowerPoint to continue editing an
older revision, or import it into a new Google Slides copy. Check fonts,
layout and notes after import because a format round trip can change them.
Restoring a revision must not overwrite the organizer's delivery deck as an
incidental part of looking at history.

[[Devcon/rehearsal-script]] points to the current saved speaking draft and
retains the older script as history. A rewrite can be implemented without
having been rehearsed; keep those states distinct. Git history and this index
record both transitions.
