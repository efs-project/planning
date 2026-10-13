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

The speaking draft in [[Devcon/rehearsal-script]] follows the current saved
deck. A proposed rewrite stays separately identified until it is implemented
and rehearsed. Git history and the snapshot index record that transition.
