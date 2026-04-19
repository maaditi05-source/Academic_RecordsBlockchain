#!/bin/bash
set -e

# Deploy v3.0 remote upgrade
CC_TAR="/home/aditi/workspace/Academic_RecordsBlockchain/chaincode-go/academic_records_3.0.tar.gz"

echo "Copying package into peer0 container..."
docker cp ${CC_TAR} peer0.nitwarangal.nitw.edu:/tmp/academic_records_3.0.tar.gz

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
      peer0.nitwarangal.nitw.edu peer lifecycle chaincode install /tmp/academic_records_3.0.tar.gz || true
}

# 1. NITWarangal
install_cc "peer0.nitwarangal.nitw.edu:7051" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "peer1.nitwarangal.nitw.edu:7151" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"
install_cc "peer2.nitwarangal.nitw.edu:7251" "NITWarangalMSP" "/tmp/admin-msp" "/etc/hyperledger/fabric/tls/ca.crt"

# 2. Departments
install_cc "peer0.cse.departments.nitw.edu:9051" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer1.cse.departments.nitw.edu:9151" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer0.ece.departments.nitw.edu:9251" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"
install_cc "peer1.ece.departments.nitw.edu:9351" "DepartmentsMSP" "/tmp/dept-admin-msp" "/tmp/dept-tls-ca.crt"

# 3. Verifiers
install_cc "peer0.verifiers.nitw.edu:11051" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"
install_cc "peer1.verifiers.nitw.edu:11151" "VerifiersMSP" "/tmp/verifier-admin-msp" "/tmp/verifier-tls-ca.crt"

echo "✅ All peers upgraded successfully."
