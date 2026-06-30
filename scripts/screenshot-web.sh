#!/usr/bin/env bash
# Capture screenshots of the LegacyOps Console web UI.
#
# Prerequisites:
#   - pnpm install --frozen-lockfile
#   - pnpm build
#   - Playwright Chromium installed (npx playwright install chromium)
#
# This script:
#   1. starts the API on :3001
#   2. starts the web preview server on :5174
#   3. waits for both to be ready
#   4. runs the Playwright screenshot spec
#   5. stops both servers
#
# Screenshots are written to artifacts/screenshots/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building packages and apps"
pnpm -r --filter './packages/**' build > /dev/null
pnpm --filter @legacyops/api build > /dev/null
# Build web with VITE_API_BASE pointing at the API server so the SPA
# can fetch from :3001 directly (the preview server has no proxy).
VITE_API_BASE=http://localhost:3001 pnpm --filter @legacyops/web build > /dev/null

echo "==> Starting API on :3001"
PORT=3001 NODE_ENV=production node apps/api/dist/server.js &
API_PID=$!
cleanup() {
  kill $API_PID 2>/dev/null || true
  kill $WEB_PID 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Waiting for API"
for i in $(seq 1 30); do
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    echo "    API ready"
    break
  fi
  sleep 0.5
done

echo "==> Starting web preview on :5174"
pnpm --filter @legacyops/web preview --port 5174 --strictPort > /tmp/legacyops-web-preview.log 2>&1 &
WEB_PID=$!

echo "==> Waiting for web preview"
for i in $(seq 1 30); do
  if curl -sf http://localhost:5174/ > /dev/null 2>&1; then
    echo "    Web preview ready"
    break
  fi
  sleep 0.5
done

echo "==> Ensuring Chromium is installed"
npx playwright install chromium > /dev/null 2>&1 || true

echo "==> Running Playwright screenshot spec"
mkdir -p artifacts/screenshots
cd apps/web
npx playwright test --config=playwright.config.ts

echo "==> Done. Screenshots in artifacts/screenshots/"
