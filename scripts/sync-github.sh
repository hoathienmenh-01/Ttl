#!/bin/bash
# Automatically syncs the current repo state to GitHub main branch.
# Requires GITHUB_TOKEN environment variable to be set.

set -euo pipefail

GITHUB_REPO="https://github.com/hoathienmenh-01/Ttl.git"

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "[sync-github] ERROR: GITHUB_TOKEN is not set. Skipping sync." >&2
  exit 1
fi

REMOTE_URL="https://${GITHUB_TOKEN}@github.com/hoathienmenh-01/Ttl.git"

CURRENT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "")
if [ -z "$CURRENT_HEAD" ]; then
  echo "[sync-github] No commits yet. Skipping." >&2
  exit 0
fi

LAST_SYNCED_FILE="/tmp/.github-sync-last-head"
LAST_SYNCED=""
if [ -f "$LAST_SYNCED_FILE" ]; then
  LAST_SYNCED=$(cat "$LAST_SYNCED_FILE")
fi

if [ "$CURRENT_HEAD" = "$LAST_SYNCED" ]; then
  echo "[sync-github] No new commits since last sync ($CURRENT_HEAD). Skipping."
  exit 0
fi

echo "[sync-github] Pushing $CURRENT_HEAD → GitHub main..."
if git push "$REMOTE_URL" HEAD:main --force 2>&1; then
  echo "$CURRENT_HEAD" > "$LAST_SYNCED_FILE"
  echo "[sync-github] Synced successfully at $(date -u +%Y-%m-%dT%H:%M:%SZ)."
else
  echo "[sync-github] Push failed. Will retry next cycle." >&2
  exit 1
fi
