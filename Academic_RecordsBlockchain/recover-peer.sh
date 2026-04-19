#!/bin/bash
# =================================================================
#  RECOVERY SCRIPT — Rejoin channel + reinstall chaincode
#  Run this on ANY system whose peer was restarted with -v
#  Usage: ./recover-peer.sh <peer-container-name> <org-msp>
#
#  Examples:
#    ./recover-peer.sh peer0.nitwarangal.nitw.edu NITWarangalMSP
#    ./recover-peer.sh peer0.cse.departments.nitw.edu DepartmentsMSP
#    ./recover-peer.sh peer0.verifiers.nitw.edu VerifiersMSP
# =================================================================
set -e

PEER_CONTAINER="${1:?Usage: $0 <peer-container-name> <org-msp>}"
ORG_MSP="${2:?Usage: $0 <peer-container-name> <org-msp>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BLOCK_FILE="${SCRIPT_DIR}/channel-artifacts/academic-records-channel.block"
CC_PKG="${SCRIPT_DIR}/chaincode-go/academic_records_2.0.tar.gz"

# Determine the admin MSP path based on org
case "${ORG_MSP}" in
  NITWarangalMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp"
    ;;
  DepartmentsMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp"
    ;;
  VerifiersMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp"
    ;;
  *)
    echo "❌ Unknown MSP: ${ORG_MSP}"
    exit 1
    ;;
esac

echo "========================================"
echo "🔧 Peer Recovery Script"
echo "  Peer:  ${PEER_CONTAINER}"
echo "  MSP:   ${ORG_MSP}"
echo "========================================"

# Step 1: Check if peer is running
if ! docker ps --format '{{.Names}}' | grep -q "^${PEER_CONTAINER}$"; then
    echo "❌ Container ${PEER_CONTAINER} is not running!"
    exit 1
fi

# Step 2: Check current channel membership
CHANNELS=$(docker exec "${PEER_CONTAINER}" peer channel list 2>&1 | tail -1)
if echo "${CHANNELS}" | grep -q "academic-records-channel"; then
    echo "✅ Peer is already joined to academic-records-channel"
else
    echo "📦 Copying genesis block into container..."
    docker cp "${BLOCK_FILE}" "${PEER_CONTAINER}:/tmp/academic-records-channel.block"

    echo "📦 Copying admin MSP into container..."
    docker cp "${ADMIN_MSP}" "${PEER_CONTAINER}:/tmp/admin-msp"

    echo "🔗 Joining channel..."
    docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
        "${PEER_CONTAINER}" peer channel join -b /tmp/academic-records-channel.block
    echo "✅ Channel joined! Waiting 10s for block sync..."
    sleep 10
fi

# Step 3: Check chaincode installation
CC_INSTALLED=$(docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    "${PEER_CONTAINER}" peer lifecycle chaincode queryinstalled 2>&1)
if echo "${CC_INSTALLED}" | grep -q "academic_records_2.0"; then
    echo "✅ Chaincode already installed"
else
    echo "📦 Copying chaincode package into container..."
    docker cp "${ADMIN_MSP}" "${PEER_CONTAINER}:/tmp/admin-msp" 2>/dev/null || true
    docker cp "${CC_PKG}" "${PEER_CONTAINER}:/tmp/academic_records_2.0.tar.gz"

    echo "⚙️  Installing chaincode..."
    docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
        "${PEER_CONTAINER}" peer lifecycle chaincode install /tmp/academic_records_2.0.tar.gz
    echo "✅ Chaincode installed!"
fi

# Step 4: Verify
echo ""
echo "📊 Verification:"
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    "${PEER_CONTAINER}" peer channel getinfo -c academic-records-channel 2>&1 | grep -o 'height.*'
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    "${PEER_CONTAINER}" peer lifecycle chaincode queryinstalled 2>&1 | grep "academic_records" || echo "(none)"
echo ""
echo "🎉 Recovery complete for ${PEER_CONTAINER}!"
