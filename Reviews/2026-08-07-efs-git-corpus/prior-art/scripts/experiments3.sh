#!/bin/bash
set -eu
LAB="$(cd "$(dirname "$0")" && pwd)"
cd "$LAB"; rm -rf work3; mkdir work3; cd work3
export GIT_AUTHOR_NAME=alice GIT_AUTHOR_EMAIL=alice@example.org
export GIT_COMMITTER_NAME=alice GIT_COMMITTER_EMAIL=alice@example.org
HOST="$PWD/host.git"

git init -q -b main src
( cd src
  echo "# Home" > Home.md; git add .; git commit -qm home
  echo "page" > Page.md; git add .; git commit -qm page
  git branch -q feat )
git init -q --bare -b main "$HOST"
git -C src push -q "$HOST" main feat

git clone -q "$HOST" writer-a
git clone -q "$HOST" writer-b

echo "=== E4: atomic vs non-atomic multi-ref push ==="
( cd writer-a && echo a >> Page.md && git commit -qam "A main" && git push -q origin main )
cd writer-b
echo b >> Home.md; git commit -qam "B main (will be stale)"
git branch -q featw origin/feat
git checkout -q featw; echo b >> Page.md; git add Page.md; git commit -qm "B feat (fresh)"; git checkout -q main
FEAT_BASE=$(git -C "$HOST" rev-parse feat)
echo "--- non-atomic push:"
set +e
git push origin main featw:feat 2>&1 | sed -n '1,6p'
set -e
echo "host feat after non-atomic: $(git -C "$HOST" rev-parse feat)  (base was $FEAT_BASE)"
git -C "$HOST" update-ref refs/heads/feat "$FEAT_BASE"
echo "--- atomic push:"
set +e
git push --atomic origin main featw:feat 2>&1 | sed -n '1,6p'
set -e
echo "host feat after atomic:     $(git -C "$HOST" rev-parse feat)  (base was $FEAT_BASE)"
cd ..

echo
echo "=== E6: force-push displacement + recovery ==="
( cd writer-a && echo secret-key > secret.md && git add . && git commit -qm "leaked secret" && git push -q origin main )
DISPLACED=$(git -C writer-a rev-parse main)
( cd writer-a && git reset -q --hard HEAD~1 && git push -q --force origin main )
echo "displaced tip: $DISPLACED"
echo -n "server has displaced object: "; git -C "$HOST" cat-file -t "$DISPLACED"
echo -n "advertised refs mention it? "; git -C "$HOST" for-each-ref | grep -c "$DISPLACED" || echo "0 (unreachable)"
git clone -q "$HOST" fresh
echo -n "fresh clone got it? "; git -C fresh cat-file -t "$DISPLACED" 2>&1 | head -1
echo -n "explicit want-sha fetch (allowAnySHA1InWant unset): "
( cd fresh && git fetch origin "$DISPLACED" 2>&1 | tail -1 )
echo -n "after host gc --prune=now: "
git -C "$HOST" gc -q --prune=now; git -C "$HOST" cat-file -t "$DISPLACED" 2>&1 | head -1
echo "DONE3"
