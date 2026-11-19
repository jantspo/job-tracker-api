#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): Prettier-format the file Claude just changed, then
# ESLint it. Lint errors exit 2, which feeds them back to Claude to fix immediately.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
root="${CLAUDE_PROJECT_DIR:-$PWD}"

[[ -z "$file" || ! -f "$file" ]] && exit 0
[[ "$file" == "$root"/* ]] || exit 0 # only files inside this project
case "$file" in
  "$root"/node_modules/* | "$root"/dist/* | "$root"/coverage/*) exit 0 ;;
esac

cd "$root" || exit 0
bin="$root/node_modules/.bin"
[[ -x "$bin/prettier" ]] || exit 0 # deps not installed; nothing to do

"$bin/prettier" --write --ignore-unknown --log-level warn "$file" >/dev/null 2>&1 || true

case "$file" in
  *.ts | *.js | *.mjs | *.cjs)
    if ! out=$("$bin/eslint" --no-warn-ignored "$file" 2>&1); then
      echo "ESLint errors in ${file#"$root"/} (fix these before moving on):" >&2
      echo "$out" >&2
      exit 2
    fi
    ;;
esac
exit 0
