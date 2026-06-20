#!/usr/bin/env bash
# deploy.sh — Full clean redeploy for manufacturing-platform
# Run this on the server every time you deploy.
# Usage: bash deploy.sh

set -e  # Exit immediately on any error

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_CONTAINER="arkon_backend"
BACKEND_SERVICE="backend"

echo ""
echo "=========================================="
echo "  ARKON MANUFACTURING — DEPLOY SCRIPT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# ── Step 1: Pull latest code ──────────────────────────────────────────────────
echo "[1/5] Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin master
echo "      Commit: $(git log -1 --oneline)"
echo ""

# ── Step 2: Rebuild backend image (no cache) ─────────────────────────────────
echo "[2/5] Rebuilding backend Docker image (no-cache)..."
docker compose build --no-cache "$BACKEND_SERVICE"
echo ""

# ── Step 3: Recreate backend container ───────────────────────────────────────
echo "[3/5] Recreating backend container..."
docker compose up -d --force-recreate "$BACKEND_SERVICE"
echo ""

# ── Step 4: Wait for startup and show logs ───────────────────────────────────
echo "[4/5] Waiting 8 seconds for container startup..."
sleep 8

echo ""
echo "--- Backend startup logs ---"
docker logs "$BACKEND_CONTAINER" --tail=30
echo "----------------------------"
echo ""

# ── Step 5: Verify plan_type column exists in DB ─────────────────────────────
echo "[5/5] Verifying plan_type column in production_plan table..."
COLUMN_EXISTS=$(docker exec arkon_postgres psql -U arkon_user -d arkon_db -tAc \
  "SELECT column_name FROM information_schema.columns WHERE table_name='production_plan' AND column_name='plan_type';")

if [ "$COLUMN_EXISTS" = "plan_type" ]; then
  echo "      ✓ plan_type column EXISTS — migration succeeded"
else
  echo "      ✗ plan_type column MISSING — migration DID NOT RUN"
  echo ""
  echo "      Applying column manually as emergency fallback..."
  docker exec arkon_postgres psql -U arkon_user -d arkon_db -c \
    "ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS plan_type VARCHAR(10) NOT NULL DEFAULT 'TEP';"
  echo "      ✓ Column added manually. Restarting backend..."
  docker restart "$BACKEND_CONTAINER"
  sleep 5
  echo "      Backend restarted."
fi

echo ""
echo "=========================================="
echo "  DEPLOY COMPLETE"
echo "  Backend: $(docker inspect "$BACKEND_CONTAINER" --format='{{.State.Status}}' 2>/dev/null)"
echo "  Image built: $(docker inspect "$BACKEND_CONTAINER" --format='{{.Created}}' 2>/dev/null)"
echo "=========================================="
echo ""
