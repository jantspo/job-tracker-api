#!/usr/bin/env bash
# SessionStart: stdout is added to Claude's context, so it starts each session knowing
# the branch, what's uncommitted, and recent history.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0

echo "## Repo state at session start"
echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
echo
echo "Uncommitted changes:"
status=$(git status --short 2>/dev/null)
echo "${status:-  (clean)}"
echo
echo "Recent commits:"
git log --oneline -5 2>/dev/null
echo
echo "Migrations on disk: $(find src/db/migrations -name '*.ts' 2>/dev/null | wc -l | tr -d ' ') (run \`npm run db:status\` to see pending)"
exit 0
