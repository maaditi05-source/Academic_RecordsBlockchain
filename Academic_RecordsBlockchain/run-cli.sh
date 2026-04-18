#!/bin/bash
# =================================================================
#  run-cli.sh
#  Purpose: Executes peer commands against your LOCAL peer running
#           on your specific machine in a completely distributed setup.
# =================================================================

set -e
source env.sh

# Determine the local peer based on the /etc/hosts mapped or which container is up
if docker ps | grep -q "peer0.nitwarangal.nitw.edu"; then
    PEER_ADDRESS="peer0.nitwarangal.nitw.edu:7051"
    PEER_MSP="NITWarangalMSP"
    ORG_DOMAIN="nitwarangal.nitw.edu"
    PEER_DIR="peer0.nitwarangal.nitw.edu"
    USER_MSP="Admin@nitwarangal.nitw.edu"

elif docker ps | grep -q "peer1.nitwarangal.nitw.edu"; then
    PEER_ADDRESS="peer1.nitwarangal.nitw.edu:7151"
    PEER_MSP="NITWarangalMSP"
    ORG_DOMAIN="nitwarangal.nitw.edu"
    PEER_DIR="peer1.nitwarangal.nitw.edu"
    USER_MSP="Admin@nitwarangal.nitw.edu"

elif docker ps | grep -q "peer2.nitwarangal.nitw.edu"; then
    PEER_ADDRESS="peer2.nitwarangal.nitw.edu:7251"
    PEER_MSP="NITWarangalMSP"
    ORG_DOMAIN="nitwarangal.nitw.edu"
    PEER_DIR="peer2.nitwarangal.nitw.edu"
    USER_MSP="Admin@nitwarangal.nitw.edu"

elif docker ps | grep -q "peer0.cse.departments.nitw.edu"; then
    PEER_ADDRESS="peer0.cse.departments.nitw.edu:9051"
    PEER_MSP="DepartmentsMSP"
    ORG_DOMAIN="departments.nitw.edu"
    PEER_DIR="peer0.cse.departments.nitw.edu"
    USER_MSP="Admin@departments.nitw.edu"

elif docker ps | grep -q "peer1.cse.departments.nitw.edu"; then
    PEER_ADDRESS="peer1.cse.departments.nitw.edu:9151"
    PEER_MSP="DepartmentsMSP"
    ORG_DOMAIN="departments.nitw.edu"
    PEER_DIR="peer1.cse.departments.nitw.edu"
    USER_MSP="Admin@departments.nitw.edu"

elif docker ps | grep -q "peer0.ece.departments.nitw.edu"; then
    PEER_ADDRESS="peer0.ece.departments.nitw.edu:9251"
    PEER_MSP="DepartmentsMSP"
    ORG_DOMAIN="departments.nitw.edu"
    PEER_DIR="peer0.ece.departments.nitw.edu"
    USER_MSP="Admin@departments.nitw.edu"

elif docker ps | grep -q "peer1.ece.departments.nitw.edu"; then
    PEER_ADDRESS="peer1.ece.departments.nitw.edu:9351"
    PEER_MSP="DepartmentsMSP"
    ORG_DOMAIN="departments.nitw.edu"
    PEER_DIR="peer1.ece.departments.nitw.edu"
    USER_MSP="Admin@departments.nitw.edu"

elif docker ps | grep -q "peer0.verifiers.nitw.edu"; then
    PEER_ADDRESS="peer0.verifiers.nitw.edu:11051"
    PEER_MSP="VerifiersMSP"
    ORG_DOMAIN="verifiers.nitw.edu"
    PEER_DIR="peer0.verifiers.nitw.edu"
    USER_MSP="Admin@verifiers.nitw.edu"

elif docker ps | grep -q "peer1.verifiers.nitw.edu"; then
    PEER_ADDRESS="peer1.verifiers.nitw.edu:11151"
    PEER_MSP="VerifiersMSP"
    ORG_DOMAIN="verifiers.nitw.edu"
    PEER_DIR="peer1.verifiers.nitw.edu"
    USER_MSP="Admin@verifiers.nitw.edu"

else
    echo "ERROR: Cannot find any active peer containers running on your system."
    echo "Make sure you started your peer via 'docker compose up -d' first!"
    exit 1
fi

FABRIC_NET=$(docker network ls --filter name=fabric_net -q)
if [ -z "$FABRIC_NET" ]; then
    echo "ERROR: Docker network fabric_net not found! Did you start the container?"
    exit 1
fi

echo "Detected local peer: $PEER_ADDRESS"
echo "Executing: $@"
echo "------------------------------------------------------"

docker run --rm \
  --network $FABRIC_NET \
  -v $(pwd)/channel-artifacts:/tmp/channel-artifacts \
  -v $(pwd)/chaincode-go:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go \
  -v $(pwd)/organizations:/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations \
  -e CORE_PEER_TLS_ENABLED=true \
  -e CORE_PEER_LOCALMSPID="${PEER_MSP}" \
  -e CORE_PEER_ADDRESS="${PEER_ADDRESS}" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${ORG_DOMAIN}/peers/${PEER_DIR}/tls/ca.crt" \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/${ORG_DOMAIN}/users/${USER_MSP}/msp" \
  hyperledger/fabric-tools:2.5 "$@"
