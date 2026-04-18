#!/bin/bash
# =================================================================
#  Join Channel and Deploy Chaincode across Multihost Setup
#  To be executed on the machine with the CLI container
# =================================================================

set -o pipefail
. scripts/utils.sh

CHANNEL_NAME="academic-records-channel"
CHAINCODE_NAME="academic-records"
CHAINCODE_PATH="./chaincode-go"
CHAINCODE_LANG="golang"
CHAINCODE_LABEL="academic_records_2.0"
CHAINCODE_VERSION="2.0"

ORDERER_ADDR="orderer1.nitw.edu:7050"
NITW_PEER0_ADDR="peer0.nitwarangal.nitw.edu:7051"
NITW_PEER1_ADDR="peer1.nitwarangal.nitw.edu:7061"
NITW_PEER2_ADDR="peer2.nitwarangal.nitw.edu:7071"
DEPT_PEER0_ADDR="peer0.departments.nitw.edu:9051"
DEPT_PEER1_ADDR="peer1.departments.nitw.edu:9061"
DEPT_PEER2_ADDR="peer2.departments.nitw.edu:9071"
VERI_PEER0_ADDR="peer0.verifiers.nitw.edu:11051"
VERI_PEER1_ADDR="peer1.verifiers.nitw.edu:11061"
VERI_PEER2_ADDR="peer2.verifiers.nitw.edu:11071"

printHeader "🔗 Creating channel '$CHANNEL_NAME' and joining peers via CLI..."

docker exec cli_nitwarangal bash -c "
    if [ ! -f ./channel-artifacts/${CHANNEL_NAME}.block ]; then
        echo \"Genesis block not found in channel-artifacts!\"
        exit 1
    fi
     
    osnadmin channel join --channelID ${CHANNEL_NAME} --config-block ./channel-artifacts/${CHANNEL_NAME}.block -o orderer1.nitw.edu:7053 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/ca.crt --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/server.key
    

    export CORE_PEER_LOCALMSPID='NITWarangalMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
    echo \"Joining NITWarangal peer0...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='NITWarangalMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer1.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer1.nitwarangal.nitw.edu:7061
    echo \"Joining NITWarangal peer1...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='NITWarangalMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer2.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer2.nitwarangal.nitw.edu:7071
    echo \"Joining NITWarangal peer2...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='DepartmentsMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer0.departments.nitw.edu:9051
    echo \"Joining Departments peer0...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='DepartmentsMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer1.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer1.departments.nitw.edu:9061
    echo \"Joining Departments peer1...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='DepartmentsMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer2.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer2.departments.nitw.edu:9071
    echo \"Joining Departments peer2...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='VerifiersMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
    echo \"Joining Verifiers peer0...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='VerifiersMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer1.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer1.verifiers.nitw.edu:11061
    echo \"Joining Verifiers peer1...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

    export CORE_PEER_LOCALMSPID='VerifiersMSP'
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer2.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_ADDRESS=peer2.verifiers.nitw.edu:11071
    echo \"Joining Verifiers peer2...\"
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block

"
successln "✓ Channel creation and peer joins sent!"

printHeader "📦 Deploying chaincode across all peers..."

(cd ${CHAINCODE_PATH} && GO111MODULE=on go mod vendor)
infoln "✓ Chaincode dependencies vendored"

docker exec cli_nitwarangal bash -c "
    echo \"Packaging chaincode...\"
    peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-go --lang ${CHAINCODE_LANG} --label ${CHAINCODE_LABEL}

    echo \"Installing on NITWarangal peer0...\"
    export CORE_PEER_LOCALMSPID=NITWarangalMSP
    export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on NITWarangal peer1...\"
    export CORE_PEER_LOCALMSPID=NITWarangalMSP
    export CORE_PEER_ADDRESS=peer1.nitwarangal.nitw.edu:7061
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer1.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on NITWarangal peer2...\"
    export CORE_PEER_LOCALMSPID=NITWarangalMSP
    export CORE_PEER_ADDRESS=peer2.nitwarangal.nitw.edu:7071
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer2.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Departments peer0...\"
    export CORE_PEER_LOCALMSPID=DepartmentsMSP
    export CORE_PEER_ADDRESS=peer0.departments.nitw.edu:9051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Departments peer1...\"
    export CORE_PEER_LOCALMSPID=DepartmentsMSP
    export CORE_PEER_ADDRESS=peer1.departments.nitw.edu:9061
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer1.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Departments peer2...\"
    export CORE_PEER_LOCALMSPID=DepartmentsMSP
    export CORE_PEER_ADDRESS=peer2.departments.nitw.edu:9071
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer2.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Verifiers peer0...\"
    export CORE_PEER_LOCALMSPID=VerifiersMSP
    export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Verifiers peer1...\"
    export CORE_PEER_LOCALMSPID=VerifiersMSP
    export CORE_PEER_ADDRESS=peer1.verifiers.nitw.edu:11061
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer1.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Installing on Verifiers peer2...\"
    export CORE_PEER_LOCALMSPID=VerifiersMSP
    export CORE_PEER_ADDRESS=peer2.verifiers.nitw.edu:11071
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer2.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

    echo \"Querying package ID...\"
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep \"Package ID: ${CHAINCODE_LABEL}\" | sed -n 's/Package ID: \(.*\), Label:.*/\1/p')
    echo \"Chaincode Package ID: ${PACKAGE_ID}\"
    
    ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/nitw.edu/orderers/orderer1.nitw.edu/tls/tlscacerts/tls-localhost-7054-ca-orderer.pem

    echo \"Approving for NITWarangal...\"
    export CORE_PEER_LOCALMSPID=NITWarangalMSP
    export CORE_PEER_ADDRESS=peer0.nitwarangal.nitw.edu:7051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDR} --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id \"${PACKAGE_ID}\" --sequence 1 --signature-policy \"OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json

    echo \"Approving for Departments...\"
    export CORE_PEER_LOCALMSPID=DepartmentsMSP
    export CORE_PEER_ADDRESS=peer0.departments.nitw.edu:9051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDR} --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id \"${PACKAGE_ID}\" --sequence 1 --signature-policy \"OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json

    echo \"Approving for Verifiers...\"
    export CORE_PEER_LOCALMSPID=VerifiersMSP
    export CORE_PEER_ADDRESS=peer0.verifiers.nitw.edu:11051
    export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp
    peer lifecycle chaincode approveformyorg -o ${ORDERER_ADDR} --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id \"${PACKAGE_ID}\" --sequence 1 --signature-policy \"OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json

    echo \"Committing chaincode to channel...\"
    NITW_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt
    DEPT_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt
    VERI_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt
    
    peer lifecycle chaincode commit -o ${ORDERER_ADDR} --ordererTLSHostnameOverride orderer1.nitw.edu --tls --cafile $ORDERER_CA --channelID ${CHANNEL_NAME} --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --sequence 1 --signature-policy \"OR('NITWarangalMSP.peer','DepartmentsMSP.peer','VerifiersMSP.peer')\" --collections-config /opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json --peerAddresses ${NITW_PEER0_ADDR} --tlsRootCertFiles $NITW_TLS --peerAddresses ${DEPT_PEER0_ADDR} --tlsRootCertFiles $DEPT_TLS --peerAddresses ${VERI_PEER0_ADDR} --tlsRootCertFiles $VERI_TLS
"

successln "🎉 Network bridge and chaincode deployment completed over VPN!"
