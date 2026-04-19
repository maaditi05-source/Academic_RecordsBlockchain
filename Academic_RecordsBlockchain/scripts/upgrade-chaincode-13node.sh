#!/bin/bash
set -e

NEW_VERSION=$1
SEQUENCE=${2}

CHAINCODE_NAME="academic-records"
CHAINCODE_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go"
CHAINCODE_LANG="golang"
CHAINCODE_LABEL="academic_records_${NEW_VERSION}"
CHANNEL_NAME="academic-records-channel"
ORDERER_ADDR="orderer1.nitw.edu:7050"

echo "=================================================="
echo "📦 Upgrading Chaincode to Version ${NEW_VERSION} (13-Node)"
echo "=================================================="

# 1. Package
echo "📦 Packaging chaincode..."
docker exec cli_temp bash -c "
    cd /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go && GO111MODULE=on go mod vendor
    peer lifecycle chaincode package /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz \
        --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go \
        --lang ${CHAINCODE_LANG} \
        --label ${CHAINCODE_LABEL}
"

# 2. Extract TAR to host so we can copy into all containers
docker cp cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz /tmp/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz

# 3. Install on ALL PEERS
install_cc() {
    local PEER_CONTAINER=$1
    local PEER_ADDR=$2
    local MSP_ID=$3
    local MSP_PATH=$4
    local TLS_ROOT=$5
    
    echo "Installing exactly on ${PEER_CONTAINER}..."
    docker cp /tmp/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz ${PEER_CONTAINER}:/tmp/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz
    docker exec \
      -e CORE_PEER_MSPCONFIGPATH=${MSP_PATH} \
      -e CORE_PEER_ADDRESS=${PEER_ADDR} \
      -e CORE_PEER_LOCALMSPID=${MSP_ID} \
      -e CORE_PEER_TLS_ENABLED=true \
      -e CORE_PEER_TLS_ROOTCERT_FILE=${TLS_ROOT} \
      ${PEER_CONTAINER} peer lifecycle chaincode install /tmp/${CHAINCODE_NAME}_${NEW_VERSION}.tar.gz || true
}

install_cc "peer0.nitwarangal.nitw.edu" "localhost:7051" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "peer1.nitwarangal.nitw.edu" "localhost:7151" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "peer2.nitwarangal.nitw.edu" "localhost:7251" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"

install_cc "peer0.cse.departments.nitw.edu" "localhost:9051" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer1.cse.departments.nitw.edu" "localhost:9151" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer0.ece.departments.nitw.edu" "localhost:9251" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer1.ece.departments.nitw.edu" "localhost:9351" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"

install_cc "peer0.verifiers.nitw.edu" "localhost:11051" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"
install_cc "peer1.verifiers.nitw.edu" "localhost:11151" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"

# 4. Get Package ID
echo "🔍 Getting package ID..."
PACKAGE_ID=$(docker exec cli_temp peer lifecycle chaincode queryinstalled | grep "Package ID: ${CHAINCODE_LABEL}" | sed -n 's/Package ID: \(.*\), Label:.*/\1/p' | head -n 1)
echo "✓ Package ID: ${PACKAGE_ID}"

# 5. Approve for all organizations
echo "✅ Approving chaincode for all organizations..."
docker exec cli_temp bash -c "
    ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem
    
    # Approve for NITWarangal
    export CORE_PEER_LOCALMSPID=NITWarangalMSP
    export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json

    # Approve for Departments
    export CORE_PEER_LOCALMSPID=DepartmentsMSP
    export CORE_PEER_ADDRESS=peer0.cse.departments.nitw.edu:9051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json

    # Approve for Verifiers
    export CORE_PEER_LOCALMSPID=VerifiersMSP
    export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --package-id '${PACKAGE_ID}' --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json
"

# 6. Commit
echo "🚀 Committing chaincode to channel..."
docker exec cli_temp bash -c "
    ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem
    NITW_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    DEPT_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.cse.departments.nitw.edu/tls/ca.crt
    VERI_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    
    peer lifecycle chaincode commit -o orderer1.nitw.edu:7050 --ordererTLSHostnameOverride orderer1.nitw.edu \
        --tls --cafile \$ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${NEW_VERSION} --sequence ${SEQUENCE} --signature-policy \"OR('NITWarangalMSP.member','DepartmentsMSP.member','VerifiersMSP.member')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json \
        --peerAddresses peer0.nitwarangal.nitw.edu:7051 --tlsRootCertFiles \$NITW_TLS \
        --peerAddresses peer0.cse.departments.nitw.edu:9051 --tlsRootCertFiles \$DEPT_TLS \
        --peerAddresses peer0.verifiers.nitw.edu:11051 --tlsRootCertFiles \$VERI_TLS
"
echo "🎉 Update completed to ${NEW_VERSION}!"
