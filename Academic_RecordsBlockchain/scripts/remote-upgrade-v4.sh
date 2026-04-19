#!/bin/bash
set -e

NEW_VERSION="4.0"
SEQUENCE="4"
CHAINCODE_NAME="academic-records"
CHAINCODE_LANG="golang"
CHAINCODE_LABEL="academic_records_${NEW_VERSION}"
CHANNEL_NAME="academic-records-channel"
ORDERER_ADDR="orderer1.nitw.edu:7050"

cd /home/aditi/workspace/Academic_RecordsBlockchain
tar_file="/tmp/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz"

echo "=================================================="
echo "📦 Upgrading Chaincode to Version ${NEW_VERSION} (13-Node)"
echo "=================================================="

# 1. Provide the pre-packaged chaincode (already locally built via run-cli.sh)
cp ./chaincode-go/temp.tar.gz ${tar_file}
docker cp ${tar_file} peer0.nitwarangal.nitw.edu:/tmp/academic_records_4.0.tar.gz

# 2. Install on ALL PEERS remotely via GRPC
install_cc() {
    local PEER_ADDR=$1
    local MSP_ID=$2
    local MSP_PATH=$3
    local TLS_ROOT=$4
    
    echo "Installing exactly on ${PEER_ADDR}..."
    docker exec \
      -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
      -e CORE_PEER_ADDRESS=${PEER_ADDR} \
      -e CORE_PEER_LOCALMSPID=${MSP_ID} \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${TLS_ROOT} \
      peer0.nitwarangal.nitw.edu peer lifecycle chaincode install /tmp/academic_records_4.0.tar.gz || true
}

source env.sh
echo "Using multi-host IP mappings from env.sh..."

install_cc "${NITWARANGAL_HOST}:7051" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "${NITWARANGAL_PEER1_HOST}:7151" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "${NITWARANGAL_PEER2_HOST}:7251" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"

install_cc "${DEPARTMENTS_HOST}:9051" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "${CSE_FACULTY_HOST}:9151" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "${ECE_HOD_HOST}:9251" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "${ECE_FACULTY_HOST}:9351" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"

install_cc "${VERIFIERS_HOST}:11051" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"
install_cc "${VERIFIERS_PEER1_HOST}:11151" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"

# 3. Get Package ID
echo "🔍 Getting package ID..."
PACKAGE_ID=$(docker exec peer0.nitwarangal.nitw.edu peer lifecycle chaincode queryinstalled | grep "Package ID: ${CHAINCODE_LABEL}" | sed -n 's/Package ID: \(.*\), Label:.*/\1/p' | head -n 1)
echo "✓ Package ID: ${PACKAGE_ID}"

# 4. Approve & Commit for all organizations (using run-cli.sh)
echo "✅ Starting Approval Process using run-cli.sh..."

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem

# Approve for NITWarangal (local peer)
./run-cli.sh bash -c "peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json"

# Approve for Departments
./run-cli.sh bash -c "export CORE_PEER_LOCALMSPID=DepartmentsMSP && export CORE_PEER_ADDRESS=${DEPARTMENTS_HOST}:9051 && export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp && peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json"

# Approve for Verifiers
./run-cli.sh bash -c "export CORE_PEER_LOCALMSPID=VerifiersMSP && export CORE_PEER_ADDRESS=${VERIFIERS_HOST}:11051 && export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp && peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json"

# 5. Commit
echo "🚀 Committing chaincode to channel..."
./run-cli.sh bash -c "
    NITW_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    DEPT_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt
    VERI_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    
    peer lifecycle chaincode commit -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json \
        --peerAddresses ${NITWARANGAL_HOST}:7051 --tlsRootCertFiles \$NITW_TLS \
        --peerAddresses ${DEPARTMENTS_HOST}:9051 --tlsRootCertFiles \$DEPT_TLS \
        --peerAddresses ${VERIFIERS_HOST}:11051 --tlsRootCertFiles \$VERI_TLS
"
echo "🎉 Update completed to ${NEW_VERSION}!"
