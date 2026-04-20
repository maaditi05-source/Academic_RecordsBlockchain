#!/bin/bash
set -e

NEW_VERSION="4.0"
SEQUENCE="4"
CHAINCODE_NAME="academic-records"
CHAINCODE_LABEL="academic_records_${NEW_VERSION}"
CHANNEL_NAME="academic-records-channel"

cd /home/aditi/workspace/Academic_RecordsBlockchain
source env.sh

echo "=================================================="
echo "📦 Upgrading Chaincode to Version ${NEW_VERSION} (13-Node)"
echo "=================================================="

# Paths inside the fabric-tools container (mapped via volume)
ORG_BASE="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations"
PKG_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/temp.tar.gz"
COLLECTIONS="/opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json"

NITW_ADMIN_MSP="${ORG_BASE}/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp"
NITW_TLS="${ORG_BASE}/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt"

DEPT_ADMIN_MSP="${ORG_BASE}/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp"
DEPT_TLS="${ORG_BASE}/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt"

VERI_ADMIN_MSP="${ORG_BASE}/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp"
VERI_TLS="${ORG_BASE}/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt"

ORDERER_CA="${ORG_BASE}/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem"

# Helper: run a command inside a temporary fabric-tools container (same as run-cli.sh)
run_fabric() {
    local PEER_ADDR=$1
    local MSP_ID=$2
    local MSP_PATH=$3
    local TLS_ROOT=$4
    shift 4

    docker run --rm \
      --network host \
      -v $(pwd)/channel-artifacts:/tmp/channel-artifacts \
      -v $(pwd)/chaincode-go:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go \
      -v $(pwd)/organizations:/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations \
      -v $(pwd)/collections_config.json:/opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_LOCALMSPID="${MSP_ID}" \
      -e CORE_PEER_ADDRESS="${PEER_ADDR}" \
      -e CORE_PEER_TLS_ROOTCERT_FILE="${TLS_ROOT}" \
      -e CORE_PEER_MSPCONFIGPATH="${MSP_PATH}" \
      hyperledger/fabric-tools:2.5 "$@"
}

# ── Step 1: Install on one anchor peer per org (using HOSTNAMES, not IPs) ──
echo ""
echo "📦 Installing chaincode on NITWarangal anchor peer..."
run_fabric "peer0.nitwarangal.nitw.edu:7051" "NITWarangalMSP" "${NITW_ADMIN_MSP}" "${NITW_TLS}" \
    peer lifecycle chaincode install ${PKG_FILE} || true

echo "📦 Installing chaincode on Departments anchor peer..."
run_fabric "peer0.cse.departments.nitw.edu:9051" "DepartmentsMSP" "${DEPT_ADMIN_MSP}" "${DEPT_TLS}" \
    peer lifecycle chaincode install ${PKG_FILE} || true

echo "📦 Installing chaincode on Verifiers anchor peer..."
run_fabric "peer0.verifiers.nitw.edu:11051" "VerifiersMSP" "${VERI_ADMIN_MSP}" "${VERI_TLS}" \
    peer lifecycle chaincode install ${PKG_FILE} || true

# ── Step 2: Get Package ID ──
echo ""
echo "🔍 Getting package ID..."
PACKAGE_ID=$(run_fabric "peer0.nitwarangal.nitw.edu:7051" "NITWarangalMSP" "${NITW_ADMIN_MSP}" "${NITW_TLS}" \
    peer lifecycle chaincode queryinstalled 2>&1 | grep "Package ID: ${CHAINCODE_LABEL}" | sed -n 's/Package ID: \(.*\), Label:.*/\1/p' | head -n 1)

echo "✓ Package ID: '${PACKAGE_ID}'"
if [ -z "${PACKAGE_ID}" ]; then
    echo "❌ FATAL: Package ID extraction failed. The chaincode may not have been installed."
    echo "   Make sure peer0.nitwarangal.nitw.edu is running and reachable."
    exit 1
fi

SIG_POLICY="OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')"

# ── Step 3: Approve for each org ──
echo ""
echo "✅ Approving for NITWarangal..."
run_fabric "peer0.nitwarangal.nitw.edu:7051" "NITWarangalMSP" "${NITW_ADMIN_MSP}" "${NITW_TLS}" \
    peer lifecycle chaincode approveformyorg \
        -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile "${ORDERER_CA}" -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -v "${NEW_VERSION}" --package-id "${PACKAGE_ID}" --sequence ${SEQUENCE} \
        --signature-policy "${SIG_POLICY}" --collections-config "${COLLECTIONS}"

echo "✅ Approving for Departments..."
run_fabric "peer0.cse.departments.nitw.edu:9051" "DepartmentsMSP" "${DEPT_ADMIN_MSP}" "${DEPT_TLS}" \
    peer lifecycle chaincode approveformyorg \
        -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile "${ORDERER_CA}" -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -v "${NEW_VERSION}" --package-id "${PACKAGE_ID}" --sequence ${SEQUENCE} \
        --signature-policy "${SIG_POLICY}" --collections-config "${COLLECTIONS}"

echo "✅ Approving for Verifiers..."
run_fabric "peer0.verifiers.nitw.edu:11051" "VerifiersMSP" "${VERI_ADMIN_MSP}" "${VERI_TLS}" \
    peer lifecycle chaincode approveformyorg \
        -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile "${ORDERER_CA}" -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -v "${NEW_VERSION}" --package-id "${PACKAGE_ID}" --sequence ${SEQUENCE} \
        --signature-policy "${SIG_POLICY}" --collections-config "${COLLECTIONS}"

# ── Step 4: Commit ──
echo ""
echo "🚀 Committing chaincode to channel..."
run_fabric "peer0.nitwarangal.nitw.edu:7051" "NITWarangalMSP" "${NITW_ADMIN_MSP}" "${NITW_TLS}" \
    peer lifecycle chaincode commit \
        -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile "${ORDERER_CA}" -C "${CHANNEL_NAME}" -n "${CHAINCODE_NAME}" \
        -v "${NEW_VERSION}" --sequence ${SEQUENCE} \
        --signature-policy "${SIG_POLICY}" --collections-config "${COLLECTIONS}" \
        --peerAddresses peer0.nitwarangal.nitw.edu:7051 --tlsRootCertFiles "${NITW_TLS}" \
        --peerAddresses peer0.cse.departments.nitw.edu:9051 --tlsRootCertFiles "${DEPT_TLS}" \
        --peerAddresses peer0.verifiers.nitw.edu:11051 --tlsRootCertFiles "${VERI_TLS}"

echo ""
echo "🎉 Chaincode upgraded to v${NEW_VERSION} successfully!"
