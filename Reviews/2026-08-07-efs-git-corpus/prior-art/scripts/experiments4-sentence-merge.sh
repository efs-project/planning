#!/bin/bash
# E9b/E9c/E9d — sentence-per-line merge granularity (adversarial-review follow-up), 2026-08-07
set -eu
LAB="$(mktemp -d)"; cd "$LAB"
export GIT_AUTHOR_NAME=a GIT_AUTHOR_EMAIL=a@x GIT_COMMITTER_NAME=a GIT_COMMITTER_EMAIL=a@x
mk() { git init -q -b main "$1"; cd "$1"
  printf 'Sentence one.\nSentence two.\nSentence three.\nSentence four.\nSentence five.\n' > doc.md
  git add doc.md && git commit -qm base; }
mk adj
git checkout -qb A; sed -i'' -e 's/Sentence two./Sentence two, A-edit./' doc.md; git commit -qam A
git checkout -q main; git checkout -qb B; sed -i'' -e 's/Sentence three./Sentence three, B-edit./' doc.md; git commit -qam B
git checkout -q A
echo "=== concurrent ADJACENT-line edits (sentences 2 and 3): expect CONFLICT"
git merge B -m m 2>&1 | head -2 || true
cd "$LAB"; mk gap
git checkout -qb A; sed -i'' -e 's/Sentence two./Sentence two, A-edit./' doc.md; git commit -qam A
git checkout -q main; git checkout -qb B; sed -i'' -e 's/Sentence four./Sentence four, B-edit./' doc.md; git commit -qam B
git checkout -q A
echo "=== concurrent edits separated by ONE untouched line (sentences 2 and 4): expect clean"
git merge B -m m 2>&1 | head -2
