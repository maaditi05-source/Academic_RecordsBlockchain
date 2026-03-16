#!/bin/bash
# =================================================================
#  Setup /etc/hosts for Multi-Host Fabric Network
#  Purpose: Add hostname-to-IP mappings on each machine
#
#  Run with sudo: sudo ./setup-hosts.sh
#  Reads IPs from env.sh
# =================================================================

set -e

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Source env.sh
if [ ! -f "env.sh" ]; then
    echo "❌ env.sh not found. Please create it first."
    exit 1
fi
source env.sh

echo "======================================================"
echo "🔧 Setting up /etc/hosts entries"
echo "======================================================"

# Marker for our entries
MARKER_START="# === Academic Records Blockchain Network START ==="
MARKER_END="# === Academic Records Blockchain Network END ==="

# Remove old entries if they exist
if grep -q "$MARKER_START" /etc/hosts; then
    echo "Removing old blockchain network entries..."
    sudo sed -i "/$MARKER_START/,/$MARKER_END/d" /etc/hosts
fi

# Build new hosts entries
HOSTS_ENTRIES="${MARKER_START}
${ORDERER_HOST}    orderer.nitw.edu ca-orderer
${NITWARANGAL_HOST}    peer0.nitwarangal.nitw.edu ca-nitwarangal
${DEPARTMENTS_HOST}    peer0.departments.nitw.edu ca-departments
${VERIFIERS_HOST}    peer0.verifiers.nitw.edu ca-verifiers
${MARKER_END}"

echo "Adding the following entries to /etc/hosts:"
echo ""
echo "$HOSTS_ENTRIES"
echo ""

# Append to /etc/hosts
echo "$HOSTS_ENTRIES" | sudo tee -a /etc/hosts > /dev/null

echo ""
echo "✅ /etc/hosts updated successfully!"
echo ""
echo "Current blockchain-related entries:"
grep -A6 "$MARKER_START" /etc/hosts || true
echo ""

# Verify resolution
echo "Verifying hostname resolution..."
for host in orderer.nitw.edu peer0.nitwarangal.nitw.edu peer0.departments.nitw.edu peer0.verifiers.nitw.edu; do
    IP=$(getent hosts "$host" 2>/dev/null | awk '{print $1}')
    if [ -n "$IP" ]; then
        echo "  ✅ ${host} → ${IP}"
    else
        echo "  ⚠️  ${host} → (not resolving)"
    fi
done
echo ""
