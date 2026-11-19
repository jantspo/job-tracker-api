#!/usr/bin/env bash
# Stop: when Claude finishes a turn with uncommitted .ts changes, run `tsc --noEmit`.
# Errors exit 2 so Claude keeps going and fixes them. `stop_hook_active` prevents loops:
# if Claude is already continuing because of this hook, let it stop.
set -uo pipefail

input=$(cat)
[[ $(jq -r '.stop_hook_active // false' <<<"$input") == "true" ]] && exit 0

root="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$root" || exit 0
[[ -x node_modules/.bin/tsc ]] || exit 0
[[ -z $(git status --porcelain -- '*.ts' 2>/dev/null) ]] && exit 0

if ! out=$(node_modules/.bin/tsc --noEmit 2>&1); then
  echo "Typecheck failed after your changes. Fix these errors:" >&2
  echo "$out" | head -60 >&2
  exit 2
fi
exit 0
