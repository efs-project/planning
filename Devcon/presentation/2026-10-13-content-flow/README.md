# Content-first presentation revision

Captured October 13, 2026 from the native rehearsal copy titled
`Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft`.

James asked to settle the spine and main flow before adding animations or
other visual polish. This revision implements that direction. It begins
with harm to users and a cypherpunk vision, teaches eight functional layers
through three chapters, and ends with a test developers can try on their own
apps. EFS supplies useful mechanisms alongside non-EFS examples.

## Contents

- [Visual reference](presentation.pdf)
- [Editable PowerPoint with speaker notes](presentation.pptx)
- [[Devcon/presentation/2026-10-13-content-flow/slides-and-notes|Native slide text and speaker notes]]
- [File hashes and verification record](manifest.json)

There are 18 main slides and one resource/Q&A page, all with speaker notes.
The main talk has 19 minutes of planned material and one minute of margin.
This revision has not been rehearsed. James's earlier 17-minute read belongs
to the [[Devcon/presentation/2026-10-13-first-readthrough/README|previous snapshot]].

## What changed

- Pocket introduces the practical harm of a shutdown. The positive vision is
  software that users and future maintainers can inherit and build upon.
- The three chapters are entering the app, continuing the work and keeping
  the rules. Account recovery and offchain computation now have explicit space.
- Spoken notes explain failures, checks, improvements and remaining costs.
  Public sources follow the narration rather than interrupting it.
- Body text is 24 pt with the supplied template's colors. There is no live
  demo, required video, animation or newly captured EFS screenshot.
- The EFS file-verification slide explains the check sequence. It does not
  present fresh observed results or establish every EFS recovery capability.

## Checks and limits

All 19 pages were rendered and visually inspected. Two wrapping titles were
shortened, and the affected slides were rendered and inspected again. Native
readback matched the intended slide order, visible text and speaker notes.
The PDF has 19 pages at 16:9. PowerPoint ZIP integrity passed; all 19 exported
notes match the native source after whitespace normalization. File hashes
and counts are recorded in the manifest. Private provider references were
checked before capture into Git.

The Slides render helper could not materialize the connector's streamed file
reference. The same native PDF export was downloaded from that reference and
rendered locally for inspection. Raw native JSON, provider identifiers and
temporary download links remain outside the repository.

The organizer's original deck was not edited or submitted. This is a working
rehearsal version, not a final delivery. Fresh evidence captures, spoken timing
and delivery checks remain separate work after James reviews the content.

## Review prompts

1. Does the opening make the harm and the desired future clear?
2. Do the three chapters feel connected, or like an inventory of technologies?
3. What feels unnecessary, missing or unlike something James would say?

Review the notes as well as the short slide text. Settle those questions
before investing in chapter animations or detailed screenshots.
