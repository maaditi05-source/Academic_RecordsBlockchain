#!/bin/bash
# =================================================================
#  nuclear-cleanup.sh
#  Purpose: COMPLETELY wipe ALL Docker state to guarantee a clean
#  restart. Run this on EVERY system before restarting.
# =================================================================
set -e

echo "🔥 NUCLEAR CLEANUP — Wiping ALL Docker state..."

# 1. Stop ALL running containers
echo "[1/5] Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

# 2. Remove ALL containers (including stopped)
echo "[2/5] Removing all containers..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# 3. Remove ALL Docker volumes (this is the critical step!)
echo "[3/5] Removing ALL volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# 4. Remove ALL non-default networks
echo "[4/5] Removing all networks..."
docker network prune -f 2>/dev/null || true

# 5. Final prune
echo "[5/5] Final system prune..."
docker system prune -f 2>/dev/null || true

echo ""
echo "✅ NUCLEAR CLEANUP COMPLETE!"
echo "   Containers: $(docker ps -aq 2>/dev/null | wc -l)"
echo "   Volumes:    $(docker volume ls -q 2>/dev/null | wc -l)"
echo "   Networks:   $(docker network ls --format '{{.Name}}' | grep -v -E '^(bridge|host|none)$' | wc -l)"
echo ""
echo "All three counts should be 0. If not, run again."
