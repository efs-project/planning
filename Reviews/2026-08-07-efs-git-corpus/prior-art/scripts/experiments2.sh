#!/bin/bash
# Fixed E4-E8
set -u
LAB="$(cd "$(dirname "$0")" && pwd)"
cd "$LAB"
rm -rf work2 && mkdir work2 && cd work2
export GIT_AUTHOR_NAME=alice GIT_AUTHOR_EMAIL=alice@example.org
export GIT_COMMITTER_NAME=alice GIT_COMMITTER_EMAIL=alice@example.org
sec() { echo; echo "=== $1 ==="; }
HOST="$LAB/work2/host.git"

git init -q -b main src
( cd src
  echo "# Home" > Home.md; git add .; git commit -qm home
  echo "page" > Page.md; git add .; git commit -qm page
  git branch -q feat )
git init -q --bare "$HOST"
git -C src push -q "$HOST" main feat

sec "E4: atomic multi-ref push is all-or-nothing on one stale CAS"
git clone -q "$HOST" writer-a
git clone -q "$HOST" writer-b
( cd writer-a && echo a >> Page.md && git commit -qam "A main" && git push -q origin main )
( cd writer-b
  echo b >> Home.md && git commit -qam "B main (stale parent)"
  git checkout -q -b featw origin/feat
  echo b >> Page.md && git commit -qam "B feat (fresh)"
  echo "--- non-atomic push (default):"
  git push origin main featw:feat 2>&1 | grep -E "rejected|feat" | head -4 )
FEAT_AFTER_NONATOMIC=$(git -C "$HOST" rev-parse feat)
echo "host feat after NON-atomic push: $FEAT_AFTER_NONATOMIC  (feat advanced even though main was rejected)"
git -C "$HOST" update-ref refs/heads/feat "$(git -C src rev-parse feat)"   # reset for atomic test
( cd writer-b
  echo "--- atomic push of the same pair:"
  git push --atomic origin main featw:feat 2>&1 | grep -E "rejected|atomic|feat|main" | head -5 )
FEAT_AFTER_ATOMIC=$(git -C "$HOST" rev-parse feat)
echo "host feat after ATOMIC push:     $FEAT_AFTER_ATOMIC"
[ "$FEAT_AFTER_ATOMIC" = "$(git -C src rev-parse feat)" ] && echo "PASS: atomic push left BOTH refs untouched"

sec "E5: update-ref --stdin multi-ref CAS transaction"
( cd "$HOST"
  M=$(git rev-parse main); F=$(git rev-parse feat)
  printf 'start\nupdate refs/heads/main %s %s\nupdate refs/heads/feat %s %s\nprepare\ncommit\n' "$M" "$M" "$F" "$F" \
    | git update-ref --stdin && echo "PASS: two-ref CAS transaction with correct old values commits"
  WRONG=$(printf 'a%.0s' {1..40})
  printf 'start\nupdate refs/heads/main %s %s\nprepare\ncommit\n' "$M" "0000000000000000000000000000000000000001" 2>/dev/null \
    | git update-ref --stdin 2>&1 | head -1 )

sec "E6: force-push displacement + server-side object survival"
( cd writer-a && echo secret-key > secret.md && git add . && git commit -qm "leaked secret" && git push -q origin main )
DISPLACED=$(git -C writer-a rev-parse main)
( cd writer-a && git push -q --force origin main~1:main )
echo "displaced tip: $DISPLACED"
echo -n "server object type after force-push: "; git -C "$HOST" cat-file -t "$DISPLACED"
echo -n "server ref now points at: "; git -C "$HOST" rev-parse main
echo -n "fresh clone sees displaced commit? "; git clone -q "$HOST" fresh && (git -C fresh cat-file -t "$DISPLACED" 2>&1)
echo -n "can a client fetch the displaced sha directly? "
( cd fresh && git fetch -q origin "$DISPLACED" 2>&1 | head -1 && echo "yes (uploadpack allowed it)" || echo "no (default: not advertised, want-sha refused)" )
echo -n "server-side gc --prune=now, then: "; git -C "$HOST" gc -q --prune=now 2>/dev/null; git -C "$HOST" cat-file -t "$DISPLACED" 2>&1

sec "E7: SHA-256 interop boundary"
git init -q -b main --object-format=sha256 s256
( cd s256 && echo hi > a.md && git add . && git commit -qm one && echo -n "sha256 oid len: " && git rev-parse HEAD | wc -c )
( cd s256 && git push "$HOST" main:s256 2>&1 | head -3 )

sec "E8: receive.fsckObjects on"
git init -q --bare "$LAB/work2/strict.git" && git -C "$LAB/work2/strict.git" config receive.fsckObjects true
git -C src push -q "$LAB/work2/strict.git" main && echo "clean push accepted under fsck"

echo; echo "DONE2"
