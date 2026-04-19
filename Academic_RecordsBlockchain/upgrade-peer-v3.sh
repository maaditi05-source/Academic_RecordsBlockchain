#!/bin/bash
set -e

PEER_CONTAINER="${1:?Usage: $0 <peer-container-name> <org-msp>}"
ORG_MSP="${2:?Usage: $0 <peer-container-name> <org-msp>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CC_PKG="${SCRIPT_DIR}/chaincode-go/academic_records_3.0.tar.gz"

case "${ORG_MSP}" in
  NITWarangalMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp"
    ORDERER_TLS="${SCRIPT_DIR}/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/msp/tlscacerts/tlsca.nitw.edu-cert.pem"
    ;;
  DepartmentsMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp"
    ORDERER_TLS="${SCRIPT_DIR}/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt" # Best available if orderer tls not shared
    ;;
  VerifiersMSP)
    ADMIN_MSP="${SCRIPT_DIR}/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp"
    ORDERER_TLS="${SCRIPT_DIR}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt"
    ;;
  *)
    echo "❌ Unknown MSP: ${ORG_MSP}"
    exit 1
    ;;
esac

echo "📦 Copying admin MSP into container..."
docker cp "${ADMIN_MSP}" "${PEER_CONTAINER}:/tmp/admin-msp" 2>/dev/null || true

echo "📦 Copying chaincode v3.0 package into container..."
docker cp "${CC_PKG}" "${PEER_CONTAINER}:/tmp/academic_records_3.0.tar.gz"

echo "⚙️  Installing chaincode..."
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    "${PEER_CONTAINER}" peer lifecycle chaincode install /tmp/academic_records_3.0.tar.gz || true

echo "🔍 Finding Package ID..."
PKG_ID=$(docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
    "${PEER_CONTAINER}" peer lifecycle chaincode queryinstalled 2>&1 | grep "academic_records_3.0:" | awk '{print $3}' | tr -d ',')

if [ -z "$PKG_ID" ]; then
    echo "❌ Failed to find installed package ID!"
    exit 1
fi

echo "✅ Installed! Package ID: ${PKG_ID}"

echo "📝 Approving chaincode sequence 2 for ${ORG_MSP}..."
# Use internal orderer container address if running on Aditi's system, otherwise use the external one
if [ "${ORG_MSP}" = "NITWarangalMSP" ]; then
  docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
      "${PEER_CONTAINER}" peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer1.nitw.edu --channelID academic-records-channel --name academic-records --version 3.0 --package-id ${PKG_ID} --sequence 2 --tls --cafile /etc/hyperledger/fabric/tls/ca.crt
else
  # Cross-organization approval uses the network IP and gossip
  docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/admin-msp \
      "${PEER_CONTAINER}" peer lifecycle chaincode approveformyorg -o 172.20.254.34:7050 --ordererTLSHostnameOverride orderer1.nitw.edu --channelID academic-records-channel --name academic-records --version 3.0 --package-id ${PKG_ID} --sequence 2 --tls --cafile /etc/hyperledger/fabric/tls/ca.crt
fi

echo "🎉 Approval complete for ${PEER_CONTAINER}!"
