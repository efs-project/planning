# Positive vision and practical checks revision

October 26, 2026. Implements James's instruction to plan and update the slides
after the recent deck reviews and Ethereum PM resource map. This is an
editorial plan, not an EFS architecture decision or a new application promise.

## Owner direction

- Lead with positive ideas that help the audience understand what to build.
- Put technical qualifications in optional speaker notes unless they directly
  teach a useful solution. Do not make limitations the lesson.
- Explain hyperstructures and their benefits without assuming prior knowledge.
- Make the walk-away checklist a concrete recap of the talk.
- Place EFS mainly in the data chapter, beside EAS and a shared-data social
  example. Show why standards let different apps use the same useful work.
- Explicitly encourage immutable smart contracts.
- Preserve the title, James's official Devcon theme and the three chapters.

## Implementation plan

**Goal:** give developers a clear future to build toward and specific changes
they can make to let users continue without the original team.

**Approach:** edit the existing native rehearsal deck in place. Keep the
organizer's original separate. Retain the owner-designed transitions, colors,
fonts and closing. Use native editable diagrams. The user has explicitly
asked for implementation, so no further design-approval round is needed.

1. [x] Save the current 28-slide baseline as PDF, editable PowerPoint and
   text/notes before mutation. Keep private native identifiers outside Git.
2. [x] Revise the opening. Turn the unused vision slide into a plain-language
   hyperstructure explanation and shared-foundation diagram. Move the
   absence/hostile-control test after the positive vision.
3. [x] Align the stack overview with eight jobs and three chapters. Use the
   purpose, improvement and practical check to guide each explanation.
4. [x] Add one data-standards slide covering EAS, EFS and Nostr. Reuse the
   existing continuation slide for Damus/Amethyst and move it into the data
   chapter. Keep their public identity/posts/follows claim bounded in notes.
5. [x] Replace visible placeholders with naming and EFS retrieval diagrams.
   Retain the EFS expected-reference and alternative-copy lesson in positive
   language, with corruption/unavailability details in optional notes.
6. [x] Make immutable core contracts and user-chosen migration explicit.
   Keep shared protocol coordination distinct in the spoken explanation.
7. [x] Turn the last test slide into eight concrete checks plus one action.
   Rewrite a single spoken route and separate reference/Q&A detail from it.
8. [x] Read back native structure/text/notes, render and inspect every slide,
   independently review clarity, export after files, run repository checks and
   commit/push the intended paths on main. Record timing as planned until James
   measures it aloud.

## Example choices and evidence

- Hyperstructures: [Jacob Horne's original essay](https://jacob.energy/hyperstructures.html).
  Teach the lasting, open-protocol ambition and its composability benefit.
  Keep the full economic definition in reference notes.
- Immutable core: [Uniswap v2 Pair](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol)
  and [Factory](https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol).
  Fixed code is the example; bounded fee configuration stays in private notes.
- EAS: [official site](https://attest.org/),
  [contracts](https://github.com/ethereum-attestation-service/eas-contracts#introduction)
  and [SDK](https://github.com/ethereum-attestation-service/eas-sdk#getting-an-attestation).
  Reusable schemas describe structured attestations. Schema meaning and
  trusted issuers remain application choices.
- EFS: [public site](https://efs.eth.limo/) and the existing historical
  [file proof package](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof).
  Use public paths, provenance and verifiable file references. No new runtime
  test or new deployment claim is made in this edit.
- Nostr: [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md),
  [NIP-02](https://github.com/nostr-protocol/nips/blob/master/02.md) and
  [NIP-10](https://github.com/nostr-protocol/nips/blob/master/10.md).
  [Damus](https://github.com/damus-io/damus#spec-compliance) and
  [Amethyst](https://github.com/vitorpamplona/amethyst#supported-features)
  document compatible identity/public-event conventions. This is a
  documentation-backed illustration, not a fresh migration test. It does not
  depict an EFS, EAS and Nostr integration.

## Review focus

Check the slides as a coherent story, not a catalogue. Technical precision
must not overwhelm the useful idea. Preserve user choice and the reason to
build immutable foundations. Every diagram must make one mechanism easier to
understand, with readable native labels and the existing template colors.
No live demo, new software deliverable, maintained score or proposal change.

## Result

Implemented in the existing rehearsal deck and saved in
[[Devcon/presentation/2026-10-26-positive-vision/README]]. It has 29 slides,
1,961 spoken words and an 18:30 planned route. The 28-slide owner-edited
baseline is included. All final rendered pages were inspected, with crowded
labels and the checklist repaired. Native and exported notes match, and
source theme elements are preserved. The snapshot owns the checks and hashes.

The technical cautions are deliberately separated from the spoken route.
No new EFS behavior, client migration or fresh retrieval was tested. The
organizer's original and accepted proposal remain untouched. Next: James's
timed practice and feedback on whether the opening makes the vision tangible.
