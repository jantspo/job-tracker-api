#!/usr/bin/env bash
# PreToolUse (Read|Edit|Write|MultiEdit|Bash): blocks access to secrets, and (once locked)
# edits to already-written migrations. Exit 2 blocks the tool call; stderr goes to Claude.
set -uo pipefail

# Flip to true once any shared/deployed database has run the existing migrations.
# After that, every schema change must be a NEW migration (see CLAUDE.md > Database).
LOCK_MIGRATIONS=false

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")
root="${CLAUDE_PROJECT_DIR:-$PWD}"

block() {
  echo "Blocked by .claude/hooks/protect-files.sh: $1" >&2
  exit 2
}

is_secret() {
  local name
  name=$(basename "$1")
  [[ "$name" == ".env.example" ]] && return 1
  case "$name" in
    .env | .env.* | *.pem | *.key | id_rsa* | id_ed25519* | credentials*.json | *.p12) return 0 ;;
  esac
  return 1
}

if [[ "$tool" == "Bash" ]]; then
  cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
  stripped=${cmd//.env.example/}
  if grep -Eq "(^|[[:space:]/\"'])\.env(\.[[:alnum:]_-]+)?([[:space:]\"';|&]|$)" <<<"$stripped"; then
    block "command touches a .env file. Use .env.example for variable names; ask the user for values."
  fi
  if grep -Eq '\.(pem|key|p12)([[:space:]"'"'"';|&]|$)|id_rsa|id_ed25519' <<<"$cmd"; then
    block "command touches a key/credential file."
  fi
  exit 0
fi

file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
[[ -z "$file" ]] && exit 0

if is_secret "$file"; then
  block "$(basename "$file") may contain secrets. Use .env.example for variable names; ask the user for values."
fi

if [[ "$LOCK_MIGRATIONS" == true && "$tool" != "Read" && -f "$file" &&
  "$file" == "$root"/src/db/migrations/* ]]; then
  block "existing migrations are locked (applied to a shared DB). Create a new migration instead."
fi

exit 0
