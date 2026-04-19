#!/bin/bash
set -e

PEER_CONTAINER="${1:?Usage: $0 <peer-container-name> <org-msp>}"
ORG_MSP="${2:?Usage: $0 <peer-container-name> <org-msp>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/env.sh"

CC_PKG="${SCRIPT_DIR}/chaincode-go/academic_records_4.0.tar.gz"

# All orgs share the same orderer TLS CA cert (same OrdererOrg)
ORDERER_TLS="${SCRIPT_DIR}/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem"

# Auto-detect the peer's listen port from its container environment
PEER_PORT=$(docker exec "${PEER_CONTAINER}" printenv CORE_PEER_LISTENADDRESS 2>/dev/null | cut -d: -f2)
if [ -z "$PEER_PORT" ]; then
    # Fallback: extract from CORE_PEER_ADDRESS
    PEER_PORT=$(docker exec "${PEER_CONTAINER}" printenv CORE_PEER_ADDRESS 2>/dev/null | cut -d: -f2)
fi
if [ -z "$PEER_PORT" ]; then
    PEER_PORT="7051"
fi
echo "ℹ️  Detected peer port: ${PEER_PORT}"

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

echo "📦 Copying admin MSP into container..."
docker cp "${ADMIN_MSP}" "${PEER_CONTAINER}:/tmp/admin-msp" 2>/dev/null || true

echo "📦 Copying chaincode v4.0 package into container..."
docker cp "${CC_PKG}" "${PEER_CONTAINER}:/tmp/academic_records_4.0.tar.gz"

# KEY FIX: Use localhost because all peers use host networking.
echo "⚙️  Installing chaincode..."
docker exec \
    -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    -e CORE_PEER_ADDRESS=localhost:${PEER_PORT} \
    "${PEER_CONTAINER}" peer lifecycle chaincode install /tmp/academic_records_4.0.tar.gz || true

echo "🔍 Finding Package ID..."
PKG_ID=$(docker exec \
    -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    -e CORE_PEER_ADDRESS=localhost:${PEER_PORT} \
    "${PEER_CONTAINER}" peer lifecycle chaincode queryinstalled 2>&1 | grep "academic_records_4.0:" | awk '{print $3}' | tr -d ',')

if [ -z "$PKG_ID" ]; then
    echo "❌ Failed to find installed package ID!"
    echo "ℹ️  Check that the chaincode package file exists and the peer is running."
    exit 1
fi

echo "✅ Installed! Package ID: ${PKG_ID}"

echo "📦 Copying Orderer TLS cert into container..."
docker cp "${ORDERER_TLS}" "${PEER_CONTAINER}:/tmp/orderer-tls.crt" || true

echo "📦 Copying Collections Config into container..."
docker cp "${SCRIPT_DIR}/collections_config.json" "${PEER_CONTAINER}:/tmp/collections_config.json" || true

# Orderer address: use orderer1's actual hostname (resolved via /etc/hosts on each machine)
ORDERER_ADDR="orderer1.nitw.edu:${ORDERER1_PORT:-7050}"

echo "📝 Approving chaincode sequence 2 for ${ORG_MSP} via ${ORDERER_ADDR}..."
docker exec \
    -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    -e CORE_PEER_ADDRESS=localhost:${PEER_PORT} \
    "${PEER_CONTAINER}" peer lifecycle chaincode approveformyorg \
    -o "${ORDERER_ADDR}" \
    --ordererTLSHostnameOverride orderer1.nitw.edu \
    --channelID academic-records-channel \
    --name academic-records \
    --version 4.0 \
    --package-id "${PKG_ID}" \
    --sequence 4 \
    --tls \
    --cafile /tmp/orderer-tls.crt \
    --collections-config /tmp/collections_config.json

echo "🎉 Approval complete for ${PEER_CONTAINER} (${ORG_MSP})!"
