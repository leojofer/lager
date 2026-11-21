#!/bin/sh
# Bumps the workspace version, commits it, and tags the commit `v<version>`,
# the way releases are made.
#
#   scripts/bump.sh           0.1.12 -> 0.1.13
#   scripts/bump.sh 0.2.0     a given version
#   scripts/bump.sh --push    also push the commit to master and the tag
#
# It needs a clean working tree and commits on top of HEAD.
set -eu
cd "$(dirname "$0")/.."

push=
next=
for arg in "$@"; do
  case "$arg" in
    --push) push=1 ;;
    -h | --help) sed -n '2,9s/^# \{0,1\}//p' "$0"; exit 0 ;;
    *) next=$arg ;;
  esac
done

if [ -n "$(git status --porcelain)" ]; then
  echo "bump: the working tree has changes" >&2
  exit 1
fi

current=$(sed -n 's/^version = "\(.*\)"$/\1/p' Cargo.toml | head -n 1)
if [ -z "$next" ]; then
  next=$(echo "$current" | awk -F. '{ printf "%d.%d.%d", $1, $2, $3 + 1 }')
fi
case "$next" in
  *[!0-9.]* | *..* | .* | *.) echo "bump: not a version: $next" >&2; exit 1 ;;
esac
if git rev-parse -q --verify "refs/tags/v$next" >/dev/null; then
  echo "bump: v$next exists already" >&2
  exit 1
fi

sed -i.bak "s/^version = \"$current\"$/version = \"$next\"/" Cargo.toml
rm Cargo.toml.bak
# The workspace's own packages in the lockfile carry the same version.
perl -0pi -e "s/(name = \"lager-[a-z]+\"\nversion = )\"\Q$current\E\"/\$1\"$next\"/g" Cargo.lock

git commit -q -m "Bump version to $next" Cargo.toml Cargo.lock
git tag -a "v$next" -m "v$next"
echo "$current -> $next, tagged v$next"

if [ -n "$push" ]; then
  git push origin HEAD:master "v$next"
else
  echo "push with: git push origin HEAD:master v$next"
fi
