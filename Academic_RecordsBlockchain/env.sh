#!/bin/bash
# =================================================================
#  Multi-Host Environment Configuration
#  Purpose: Central place to define IPs and ports for all machines
#  Usage: source this file in all other scripts
#
#  UPDATE THESE IPs when deploying to your actual machines.
#  After changing IPs, re-run:
#    ./generate-connection-profiles.sh
#    ./setup-hosts.sh
# =================================================================

# ─── Machine IPs ────────────────────────────────────────────────
# Set these to the actual IPs of your machines.
# For single-machine development, leave everything as localhost.
export ORDERER_HOST="${ORDERER_HOST:-localhost}"
export NITWARANGAL_HOST="${NITWARANGAL_HOST:-localhost}"
export DEPARTMENTS_HOST="${DEPARTMENTS_HOST:-localhost}"
export VERIFIERS_HOST="${VERIFIERS_HOST:-localhost}"

# ─── Orderer Ports ──────────────────────────────────────────────
export ORDERER_PORT="${ORDERER_PORT:-7050}"
export ORDERER_ADMIN_PORT="${ORDERER_ADMIN_PORT:-7053}"
export ORDERER_OPERATIONS_PORT="${ORDERER_OPERATIONS_PORT:-9443}"
export ORDERER_CA_PORT="${ORDERER_CA_PORT:-7054}"
export ORDERER_CA_OPERATIONS_PORT="${ORDERER_CA_OPERATIONS_PORT:-17054}"

# ─── NITWarangal Ports ──────────────────────────────────────────
export NITWARANGAL_PEER_PORT="${NITWARANGAL_PEER_PORT:-7051}"
export NITWARANGAL_CHAINCODE_PORT="${NITWARANGAL_CHAINCODE_PORT:-7052}"
export NITWARANGAL_OPERATIONS_PORT="${NITWARANGAL_OPERATIONS_PORT:-9446}"
export NITWARANGAL_CA_PORT="${NITWARANGAL_CA_PORT:-8054}"
export NITWARANGAL_CA_OPERATIONS_PORT="${NITWARANGAL_CA_OPERATIONS_PORT:-18054}"
export NITWARANGAL_COUCHDB_PORT="${NITWARANGAL_COUCHDB_PORT:-5984}"

# ─── Departments Ports ──────────────────────────────────────────
export DEPARTMENTS_PEER_PORT="${DEPARTMENTS_PEER_PORT:-9051}"
export DEPARTMENTS_CHAINCODE_PORT="${DEPARTMENTS_CHAINCODE_PORT:-9052}"
export DEPARTMENTS_OPERATIONS_PORT="${DEPARTMENTS_OPERATIONS_PORT:-9448}"
export DEPARTMENTS_CA_PORT="${DEPARTMENTS_CA_PORT:-9054}"
export DEPARTMENTS_CA_OPERATIONS_PORT="${DEPARTMENTS_CA_OPERATIONS_PORT:-19054}"
export DEPARTMENTS_COUCHDB_PORT="${DEPARTMENTS_COUCHDB_PORT:-6984}"

# ─── Verifiers Ports ────────────────────────────────────────────
export VERIFIERS_PEER_PORT="${VERIFIERS_PEER_PORT:-11051}"
export VERIFIERS_CHAINCODE_PORT="${VERIFIERS_CHAINCODE_PORT:-11052}"
export VERIFIERS_OPERATIONS_PORT="${VERIFIERS_OPERATIONS_PORT:-9450}"
export VERIFIERS_CA_PORT="${VERIFIERS_CA_PORT:-11054}"
export VERIFIERS_CA_OPERATIONS_PORT="${VERIFIERS_CA_OPERATIONS_PORT:-21054}"
export VERIFIERS_COUCHDB_PORT="${VERIFIERS_COUCHDB_PORT:-7984}"

# ─── Backend / Frontend Ports ───────────────────────────────────
export BACKEND_PORT="${BACKEND_PORT:-3000}"
export FRONTEND_PORT="${FRONTEND_PORT:-4200}"

# ─── Docker Network ─────────────────────────────────────────────
export DOCKER_NETWORK_NAME="${DOCKER_NETWORK_NAME:-fabric_nitw}"

# ─── Derived: Detect if multi-host ──────────────────────────────
# If any host differs from ORDERER_HOST, we're in multi-host mode
if [ "$NITWARANGAL_HOST" != "$ORDERER_HOST" ] || \
   [ "$DEPARTMENTS_HOST" != "$ORDERER_HOST" ] || \
   [ "$VERIFIERS_HOST" != "$ORDERER_HOST" ]; then
    export MULTI_HOST_MODE="true"
    export DISCOVERY_AS_LOCALHOST="false"
else
    export MULTI_HOST_MODE="false"
    export DISCOVERY_AS_LOCALHOST="true"
fi

# ─── CouchDB Credentials ────────────────────────────────────────
export COUCHDB_USER="${COUCHDB_USER:-admin}"
export COUCHDB_PASSWORD="${COUCHDB_PASSWORD:-adminpw}"

# ─── Fabric CA Admin Credentials ─────────────────────────────────
export CA_ADMIN_USER="${CA_ADMIN_USER:-admin}"
export CA_ADMIN_PASSWORD="${CA_ADMIN_PASSWORD:-adminpw}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Multi-Host Environment Configuration Loaded         ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Orderer:      ${ORDERER_HOST}:${ORDERER_PORT}"
echo "║  NITWarangal:  ${NITWARANGAL_HOST}:${NITWARANGAL_PEER_PORT}"
echo "║  Departments:  ${DEPARTMENTS_HOST}:${DEPARTMENTS_PEER_PORT}"
echo "║  Verifiers:    ${VERIFIERS_HOST}:${VERIFIERS_PEER_PORT}"
echo "║  Multi-Host:   ${MULTI_HOST_MODE}"
echo "╚══════════════════════════════════════════════════════╝"
