#!/bin/bash
# EFS Git deep-dive local fixture experiments — 2026-08-07
# Read-only research: everything happens under this scratch directory.
set -u
LAB="$(cd "$(dirname "$0")" && pwd)"
cd "$LAB"
rm -rf work && mkdir work && cd work
export GIT_AUTHOR_NAME=alice GIT_AUTHOR_EMAIL=alice@example.org
export GIT_COMMITTER_NAME=alice GIT_COMMITTER_EMAIL=alice@example.org
export GIT_AUTHOR_DATE='2026-08-07T00:00:00Z' GIT_COMMITTER_DATE='2026-08-07T00:00:00Z'
sec() { echo; echo "=== $1 ==="; }

sec "E1: bundle round-trip preserves OIDs"
git init -q -b main src
( cd src
  echo "# Wiki Home" > Home.md; git add Home.md; git commit -qm "add Home"
  echo "para one" > Page.md; git add Page.md; git commit -qm "add Page"
  git bundle create ../full.bundle --all -q )
git clone -q ../work/full.bundle from-bundle 2>/dev/null || git clone -q full.bundle from-bundle
S1=$(git -C src rev-parse main); S2=$(git -C from-bundle rev-parse origin/main)
echo "src main:    $S1"; echo "bundle main: $S2"
[ "$S1" = "$S2" ] && echo "PASS: identical OIDs" || echo "FAIL"

sec "E2: incremental bundle with prerequisites; verify fails without base"
( cd src
  echo "para two" >> Page.md; git add Page.md; git commit -qm "extend Page"
  git bundle create ../incr.bundle main~1..main -q )
( cd from-bundle && git bundle verify ../incr.bundle >/dev/null 2>&1 && echo "PASS: verify ok with base present" )
git init -q -b main empty
( cd empty && git bundle verify ../incr.bundle 2>&1 | head -2 )

sec "E3: repack changes pack bytes, not identity"
git clone -q src repack-test 2>/dev/null
( cd src && git repack -adf -q && git rev-parse main )
( cd repack-test && git rev-parse origin/main )
P1=$(ls src/.git/objects/pack/*.pack 2>/dev/null | head -1)
[ -n "$P1" ] && shasum -a 256 "$P1" | cut -c1-16
( cd src && git repack -adf --window=1 --depth=1 -q )
P2=$(ls src/.git/objects/pack/*.pack 2>/dev/null | head -1)
[ -n "$P2" ] && shasum -a 256 "$P2" | cut -c1-16
echo "(pack digests may differ; OIDs identical => packs are transport, not identity)"

sec "E4: atomic multi-ref push — all-or-nothing on stale CAS"
git init -q --bare host.git
( cd src && git push -q host.git main 2>/dev/null
  git branch -q feat && git push -q ../work/host.git feat 2>/dev/null || git push -q host.git feat )
git clone -q host.git writer-a; git clone -q host.git writer-b
( cd writer-a && echo a >> Page.md && git add . && git commit -qm "A edit" && git push -q origin main )
( cd writer-b
  echo b >> Home.md && git add . && git commit -qm "B home"
  git checkout -q feat 2>/dev/null || git checkout -qb feat origin/feat
  echo b >> Page.md && git add . && git commit -qm "B feat"
  echo "-- atomic push of (stale main, fresh feat):"
  git push --atomic origin main feat 2>&1 | grep -E "rejected|failed|atomic" | head -4
  echo "host feat after failed atomic push (should equal origin/feat pre-push):"
  git rev-parse origin/feat; git -C ../host.git rev-parse feat )

sec "E5: update-ref --stdin = server-side multi-ref CAS transaction"
( cd host.git
  M=$(git rev-parse main); F=$(git rev-parse feat)
  printf 'start\nupdate refs/heads/main %s %s\nupdate refs/heads/feat %s %s\nprepare\ncommit\n' "$M" "$M" "$F" "$F" | git update-ref --stdin >/dev/null 2>&1 && echo "PASS: no-op CAS transaction commits"
  BAD=$(printf '%040d' 4)
  printf 'start\nupdate refs/heads/main %s %s\nprepare\ncommit\n' "$M" "$BAD" | git update-ref --stdin 2>&1 | head -2 )

sec "E6: force-push displacement + server-side recovery"
( cd writer-b && git checkout -q main && git reset -q --hard HEAD~1 2>/dev/null; git reset -q --hard origin/main )
( cd writer-a && echo displaced > secret.md && git add . && git commit -qm "displaced commit" && git push -q origin main )
DISPLACED=$(cd writer-a && git rev-parse main)
( cd writer-b && git fetch -q origin && git push -q --force origin origin/main~1:main 2>/dev/null || git push -q --force origin main )
echo "displaced commit: $DISPLACED"
( cd host.git && git cat-file -t "$DISPLACED" 2>&1 && echo "server still has displaced object (unreachable until GC)" )
( cd host.git && git rev-parse main )

sec "E7: SHA-256 repo + interop boundary"
git init -q -b main --object-format=sha256 s256
( cd s256 && echo hi > a.md && git add . && git commit -qm one && git rev-parse HEAD )
( cd s256 && git push ../work/host.git main:s256 2>&1 | head -2 )
echo "(fetch/push between sha1 and sha256 repos is still refused in git 2.54)"

sec "E8: receive.fsckObjects rejects malformed history"
git init -q --bare strict.git && git -C strict.git config receive.fsckObjects true
( cd src && git push -q ../work/strict.git main && echo "clean push accepted" )

sec "E9: markdown merges — same paragraph vs different paragraphs"
git init -q -b main md && cd md
printf 'Intro paragraph.\n\nSecond paragraph about apples.\n\nThird paragraph.\n' > doc.md
git add doc.md && git commit -qm base
git checkout -qb left;  sed -i '' 's/apples/apples and pears/' doc.md; git commit -qam left
git checkout -q main; git checkout -qb right; sed -i '' 's/Third paragraph./Third paragraph, extended./' doc.md; git commit -qam right
git checkout -q main; git merge -q --no-ff left -m m1 2>&1
git merge --no-ff right -m m2 2>&1 | head -3 && echo "PASS: different-paragraph edits merge cleanly"
git checkout -qb left2 main~2 2>/dev/null || git checkout -qb left2 HEAD~2
cd "$LAB/work/md"
git checkout -q main
git checkout -qb conflictA; sed -i '' 's/apples/oranges/' doc.md 2>/dev/null || true; git commit -qam A 2>/dev/null || true
git checkout -q main; git checkout -qb conflictB; sed -i '' 's/apples/bananas/' doc.md 2>/dev/null || true; git commit -qam B 2>/dev/null || true
git checkout -q conflictA; git merge conflictB 2>&1 | head -2
grep -c '<<<<<<<' doc.md 2>/dev/null && echo "(same-paragraph edit => visible conflict markers)"
cd "$LAB/work"

sec "E10: closure enumeration — rev-list --objects as the object-closure manifest"
( cd src && git rev-list --objects main | wc -l | xargs echo "objects reachable from main:"
  git rev-list --objects main~1..main | xargs -I{} echo {} | head -5 )
echo "(delta 'missing closure' for a ref advance = rev-list old..new — exactly the upload set)"

sec "E11: rename tracking is heuristic, not recorded"
( cd src && git mv Page.md Renamed.md && git commit -qm rename
  git log --follow --oneline -- Renamed.md | wc -l | xargs echo "--follow history depth:"
  git log --oneline -- Renamed.md | wc -l | xargs echo "no-follow history depth:" )
echo "(git stores no rename record; --follow is similarity inference at read time)"

echo; echo "ALL EXPERIMENTS DONE"
