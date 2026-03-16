#!/bin/bash
# =================================================================
#  Multi-Host Network Management Script
#  Purpose: Start/stop the multi-host Fabric network
#
#  Usage:
#    ./network-multihost.sh up       # Bring up the whole network
#    ./network-multihost.sh down     # Bring down the whole network
#    ./network-multihost.sh restart  # Restart the whole network
#    ./network-multihost.sh status   # Check all containers
#
#  For single-machine development, use the original network.sh
# =================================================================

set -e

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Source env.sh
if [ ! -f "env.sh" ]; then
    echo "❌ env.sh not found. Please create it first."
    exit 1
fi
source env.sh

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

printHeader() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
}

printStep() {
    echo -e "${CYAN}  → $1${NC}"
}

printSuccess() {
    echo -e "${GREEN}  ✅ $1${NC}"
}

printWarn() {
    echo -e "${YELLOW}  ⚠️  $1${NC}"
}

printError() {
    echo -e "${RED}  ❌ $1${NC}"
}

# ─── Run command on remote host or locally ──────────────────────
run_on_host() {
    local HOST=$1
    shift
    local CMD="$@"

    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        eval "$CMD"
    else
        ssh "${REMOTE_USER:-$(whoami)}@${HOST}" "$CMD"
    fi
}

# ─── Docker compose on a specific host ─────────────────────────
compose_on_host() {
    local HOST=$1
    local COMPOSE_FILE=$2
    local ACTION=$3

    local REMOTE_DIR="${REMOTE_PROJECT_DIR:-$(pwd)}"

    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        docker-compose -f "docker/${COMPOSE_FILE}" ${ACTION}
    else
        ssh "${REMOTE_USER:-$(whoami)}@${HOST}" \
            "cd ${REMOTE_DIR} && docker-compose -f docker/${COMPOSE_FILE} ${ACTION}"
    fi
}

# ─── UP: Start the network across machines ─────────────────────
networkUp() {
    printHeader "🚀 Starting Multi-Host Fabric Network"

    echo ""
    echo -e "${CYAN}  Architecture:${NC}"
    echo -e "  ┌─────────── ${ORDERER_HOST} ──────────────┐"
    echo -e "  │  Orderer + CA_Orderer                    │"
    echo -e "  └──────────────────────────────────────────┘"
    echo -e "  ┌─────────── ${NITWARANGAL_HOST} ──────────────┐"
    echo -e "  │  Peer0.NITWarangal + CA + CouchDB        │"
    echo -e "  └──────────────────────────────────────────┘"
    echo -e "  ┌─────────── ${DEPARTMENTS_HOST} ──────────────┐"
    echo -e "  │  Peer0.Departments + CA + CouchDB        │"
    echo -e "  └──────────────────────────────────────────┘"
    echo -e "  ┌─────────── ${VERIFIERS_HOST} ──────────────┐"
    echo -e "  │  Peer0.Verifiers + CA + CouchDB          │"
    echo -e "  └──────────────────────────────────────────┘"
    echo ""

    # Step 1: Start Orderer
    printStep "Starting Orderer on ${ORDERER_HOST}..."
    compose_on_host "$ORDERER_HOST" "docker-compose-orderer.yaml" "up -d"
    printSuccess "Orderer started"

    sleep 5

    # Step 2: Start NITWarangal peer
    printStep "Starting NITWarangal peer on ${NITWARANGAL_HOST}..."
    compose_on_host "$NITWARANGAL_HOST" "docker-compose-nitwarangal.yaml" "up -d"
    printSuccess "NITWarangal peer started"

    # Step 3: Start Departments peer
    printStep "Starting Departments peer on ${DEPARTMENTS_HOST}..."
    compose_on_host "$DEPARTMENTS_HOST" "docker-compose-departments.yaml" "up -d"
    printSuccess "Departments peer started"

    # Step 4: Start Verifiers peer
    printStep "Starting Verifiers peer on ${VERIFIERS_HOST}..."
    compose_on_host "$VERIFIERS_HOST" "docker-compose-verifiers.yaml" "up -d"
    printSuccess "Verifiers peer started"

    echo ""
    printStep "Waiting 15 seconds for all peers to initialize..."
    sleep 15

    # Step 5: Create channel and join peers
    printHeader "📋 Creating Channel & Joining Peers"
    createChannelAndJoin

    # Step 6: Deploy chaincode
    printHeader "📦 Deploying Chaincode"
    deployChaincode

    printHeader "🎉 Multi-Host Network is UP!"
    echo ""
    echo -e "  ${GREEN}Orderer:${NC}      ${ORDERER_HOST}:${ORDERER_PORT}"
    echo -e "  ${GREEN}NITWarangal:${NC}  ${NITWARANGAL_HOST}:${NITWARANGAL_PEER_PORT} (Peer/Endorser)"
    echo -e "  ${GREEN}Departments:${NC} ${DEPARTMENTS_HOST}:${DEPARTMENTS_PEER_PORT} (Peer/Endorser)"
    echo -e "  ${GREEN}Verifiers:${NC}    ${VERIFIERS_HOST}:${VERIFIERS_PEER_PORT} (Peer/Endorser/Verifier)"
    echo ""
    echo -e "  ${YELLOW}Endorsement Policy:${NC} MAJORITY (2-of-3 orgs must endorse)"
    echo -e "  ${YELLOW}All peers are:${NC} Endorsers + Committers + Ledger Query nodes"
    echo -e "  ${YELLOW}Verifiers org:${NC} Also serves as external credential verifiers"
    echo ""
}

# ─── DOWN: Stop the network across machines ────────────────────
networkDown() {
    printHeader "🛑 Stopping Multi-Host Fabric Network"

    printStep "Stopping Verifiers on ${VERIFIERS_HOST}..."
    compose_on_host "$VERIFIERS_HOST" "docker-compose-verifiers.yaml" "down --volumes --remove-orphans" 2>/dev/null || true
    printSuccess "Verifiers stopped"

    printStep "Stopping Departments on ${DEPARTMENTS_HOST}..."
    compose_on_host "$DEPARTMENTS_HOST" "docker-compose-departments.yaml" "down --volumes --remove-orphans" 2>/dev/null || true
    printSuccess "Departments stopped"

    printStep "Stopping NITWarangal on ${NITWARANGAL_HOST}..."
    compose_on_host "$NITWARANGAL_HOST" "docker-compose-nitwarangal.yaml" "down --volumes --remove-orphans" 2>/dev/null || true
    printSuccess "NITWarangal stopped"

    printStep "Stopping Orderer on ${ORDERER_HOST}..."
    compose_on_host "$ORDERER_HOST" "docker-compose-orderer.yaml" "down --volumes --remove-orphans" 2>/dev/null || true
    printSuccess "Orderer stopped"

    printHeader "✅ Network Down"
}

# ─── STATUS: Check all containers across machines ──────────────
networkStatus() {
    printHeader "📊 Network Status"

    for host_info in "Orderer:${ORDERER_HOST}" "NITWarangal:${NITWARANGAL_HOST}" "Departments:${DEPARTMENTS_HOST}" "Verifiers:${VERIFIERS_HOST}"; do
        local name=$(echo "$host_info" | cut -d: -f1)
        local host=$(echo "$host_info" | cut -d: -f2)
        
        echo ""
        echo -e "  ${CYAN}${name} (${host}):${NC}"
        run_on_host "$host" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' --filter 'label=service=hyperledger-fabric' 2>/dev/null" || echo "    (unable to reach)"
    done
    echo ""
}

# ─── Create channel and join all peers ─────────────────────────
createChannelAndJoin() {
    local CHANNEL_NAME="academic-records-channel"
    local ORDERER_ADDR="orderer.nitw.edu:${ORDERER_PORT}"
    local ORDERER_TLS="${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt"
    local ORDERER_ADMIN_TLS="${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls"

    # Create channel genesis block using configtxgen
    printStep "Generating channel genesis block..."
    
    docker exec cli sh -c "
        export FABRIC_CFG_PATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/configtx
        configtxgen -profile AcademicRecordsChannel \
            -outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL_NAME}.block \
            -channelID ${CHANNEL_NAME}
    " 2>&1 || {
        # If CLI container is not running, use local configtxgen
        printWarn "CLI container not available, using local configtxgen..."
        FABRIC_CFG_PATH="${PWD}/configtx" configtxgen \
            -profile AcademicRecordsChannel \
            -outputBlock "${PWD}/channel-artifacts/${CHANNEL_NAME}.block" \
            -channelID ${CHANNEL_NAME}
    }
    printSuccess "Channel genesis block created"

    # Join orderer to channel
    printStep "Joining orderer to channel..."
    osnadmin channel join \
        --channelID ${CHANNEL_NAME} \
        --config-block "${PWD}/channel-artifacts/${CHANNEL_NAME}.block" \
        -o "orderer.nitw.edu:${ORDERER_ADMIN_PORT}" \
        --ca-file "${ORDERER_TLS}" \
        --client-cert "${ORDERER_ADMIN_TLS}/server.crt" \
        --client-key "${ORDERER_ADMIN_TLS}/server.key" 2>&1 || printWarn "Orderer may already be joined"
    printSuccess "Orderer joined channel"

    sleep 3

    # Join NITWarangal peer
    printStep "Joining NITWarangal peer to channel..."
    joinPeerToChannel "NITWarangalMSP" \
        "peer0.nitwarangal.nitw.edu:${NITWARANGAL_PEER_PORT}" \
        "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt" \
        "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp" \
        "${CHANNEL_NAME}"
    printSuccess "NITWarangal peer joined"

    # Join Departments peer
    printStep "Joining Departments peer to channel..."
    joinPeerToChannel "DepartmentsMSP" \
        "peer0.departments.nitw.edu:${DEPARTMENTS_PEER_PORT}" \
        "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt" \
        "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp" \
        "${CHANNEL_NAME}"
    printSuccess "Departments peer joined"

    # Join Verifiers peer
    printStep "Joining Verifiers peer to channel..."
    joinPeerToChannel "VerifiersMSP" \
        "peer0.verifiers.nitw.edu:${VERIFIERS_PEER_PORT}" \
        "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt" \
        "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp" \
        "${CHANNEL_NAME}"
    printSuccess "Verifiers peer joined"

    # Set anchor peers for each org
    printStep "Setting anchor peers..."
    echo "  (Anchor peers enable cross-org gossip discovery)"
    # Anchor peers are defined in configtx.yaml and applied during channel creation
    printSuccess "Anchor peers configured"
}

# Helper: Join a peer to the channel
joinPeerToChannel() {
    local MSP_ID=$1
    local PEER_ADDR=$2
    local TLS_CERT=$3
    local MSP_PATH=$4
    local CHANNEL_NAME=$5

    CORE_PEER_LOCALMSPID="${MSP_ID}" \
    CORE_PEER_ADDRESS="${PEER_ADDR}" \
    CORE_PEER_TLS_ENABLED=true \
    CORE_PEER_TLS_ROOTCERT_FILE="${TLS_CERT}" \
    CORE_PEER_MSPCONFIGPATH="${MSP_PATH}" \
    peer channel join \
        -b "${PWD}/channel-artifacts/${CHANNEL_NAME}.block" 2>&1 || printWarn "Peer may already be in channel"
}

# ─── Deploy chaincode to all peers ─────────────────────────────
deployChaincode() {
    local CC_NAME="academic-records"
    local CC_VERSION="1.0"
    local CC_SEQUENCE=1
    local CC_PATH="${PWD}/chaincode-go"
    local CHANNEL_NAME="academic-records-channel"

    printStep "Packaging chaincode..."
    
    # Package chaincode
    peer lifecycle chaincode package ${CC_NAME}.tar.gz \
        --path "${CC_PATH}" \
        --lang golang \
        --label "${CC_NAME}_${CC_VERSION}" 2>&1 || printWarn "Chaincode may already be packaged"

    # Install on all peers
    for org_info in "NITWarangalMSP:peer0.nitwarangal.nitw.edu:${NITWARANGAL_PEER_PORT}:nitwarangal" \
                    "DepartmentsMSP:peer0.departments.nitw.edu:${DEPARTMENTS_PEER_PORT}:departments" \
                    "VerifiersMSP:peer0.verifiers.nitw.edu:${VERIFIERS_PEER_PORT}:verifiers"; do
        
        local MSP_ID=$(echo "$org_info" | cut -d: -f1)
        local PEER_ADDR=$(echo "$org_info" | cut -d: -f2-3)
        local ORG_LOWER=$(echo "$org_info" | cut -d: -f4)
        local ORG_DOMAIN="${ORG_LOWER}.nitw.edu"

        printStep "Installing chaincode on ${MSP_ID}..."
        
        CORE_PEER_LOCALMSPID="${MSP_ID}" \
        CORE_PEER_ADDRESS="${PEER_ADDR}" \
        CORE_PEER_TLS_ENABLED=true \
        CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/${ORG_DOMAIN}/peers/peer0.${ORG_DOMAIN}/tls/ca.crt" \
        CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}/msp" \
        peer lifecycle chaincode install ${CC_NAME}.tar.gz 2>&1 || printWarn "Chaincode may already be installed on ${MSP_ID}"
        
        printSuccess "Chaincode installed on ${MSP_ID}"
    done

    # Get package ID
    local PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep "${CC_NAME}_${CC_VERSION}" | sed -n 's/.*Package ID: \(.*\), Label.*/\1/p')
    
    if [ -z "$PACKAGE_ID" ]; then
        printWarn "Could not determine package ID. Chaincode approval may need manual intervention."
        return
    fi

    printStep "Package ID: ${PACKAGE_ID}"

    # Approve for each org (endorsement policy: MAJORITY)
    for org_info in "NITWarangalMSP:peer0.nitwarangal.nitw.edu:${NITWARANGAL_PEER_PORT}:nitwarangal" \
                    "DepartmentsMSP:peer0.departments.nitw.edu:${DEPARTMENTS_PEER_PORT}:departments" \
                    "VerifiersMSP:peer0.verifiers.nitw.edu:${VERIFIERS_PEER_PORT}:verifiers"; do
        
        local MSP_ID=$(echo "$org_info" | cut -d: -f1)
        local PEER_ADDR=$(echo "$org_info" | cut -d: -f2-3)
        local ORG_LOWER=$(echo "$org_info" | cut -d: -f4)
        local ORG_DOMAIN="${ORG_LOWER}.nitw.edu"

        printStep "Approving chaincode for ${MSP_ID}..."
        
        CORE_PEER_LOCALMSPID="${MSP_ID}" \
        CORE_PEER_ADDRESS="${PEER_ADDR}" \
        CORE_PEER_TLS_ENABLED=true \
        CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/${ORG_DOMAIN}/peers/peer0.${ORG_DOMAIN}/tls/ca.crt" \
        CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/${ORG_DOMAIN}/users/Admin@${ORG_DOMAIN}/msp" \
        peer lifecycle chaincode approveformyorg \
            -o "orderer.nitw.edu:${ORDERER_PORT}" \
            --tls --cafile "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt" \
            --channelID "${CHANNEL_NAME}" \
            --name "${CC_NAME}" \
            --version "${CC_VERSION}" \
            --package-id "${PACKAGE_ID}" \
            --sequence ${CC_SEQUENCE} \
            --collections-config "${PWD}/collections_config.json" 2>&1 || printWarn "Already approved for ${MSP_ID}"
        
        printSuccess "Approved for ${MSP_ID}"
    done

    sleep 3

    # Commit chaincode (needs MAJORITY endorsement = 2-of-3 orgs)
    printStep "Committing chaincode (MAJORITY endorsement policy)..."
    
    CORE_PEER_LOCALMSPID="NITWarangalMSP" \
    CORE_PEER_ADDRESS="peer0.nitwarangal.nitw.edu:${NITWARANGAL_PEER_PORT}" \
    CORE_PEER_TLS_ENABLED=true \
    CORE_PEER_TLS_ROOTCERT_FILE="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt" \
    CORE_PEER_MSPCONFIGPATH="${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp" \
    peer lifecycle chaincode commit \
        -o "orderer.nitw.edu:${ORDERER_PORT}" \
        --tls --cafile "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt" \
        --channelID "${CHANNEL_NAME}" \
        --name "${CC_NAME}" \
        --version "${CC_VERSION}" \
        --sequence ${CC_SEQUENCE} \
        --collections-config "${PWD}/collections_config.json" \
        --peerAddresses "peer0.nitwarangal.nitw.edu:${NITWARANGAL_PEER_PORT}" \
        --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer0.nitwarangal.nitw.edu/tls/ca.crt" \
        --peerAddresses "peer0.departments.nitw.edu:${DEPARTMENTS_PEER_PORT}" \
        --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/peer0.departments.nitw.edu/tls/ca.crt" \
        --peerAddresses "peer0.verifiers.nitw.edu:${VERIFIERS_PEER_PORT}" \
        --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer0.verifiers.nitw.edu/tls/ca.crt" \
        2>&1 || printWarn "Chaincode may already be committed"

    printSuccess "Chaincode committed with MAJORITY endorsement policy"
    echo ""
    echo -e "  ${CYAN}Endorsement Flow:${NC}"
    echo -e "  1. Client submits TX proposal → sent to endorsing peers"
    echo -e "  2. ≥2 of 3 orgs must endorse (MAJORITY policy)"
    echo -e "  3. Endorsed TX → Orderer → ordered block → all peers commit"
    echo -e "  4. Each peer validates endorsements before committing"
    echo ""
}

# ─── Main ──────────────────────────────────────────────────────
case "$1" in
    up)
        networkUp
        ;;
    down)
        networkDown
        ;;
    restart)
        networkDown
        sleep 3
        networkUp
        ;;
    status)
        networkStatus
        ;;
    *)
        echo ""
        echo "Usage: ./network-multihost.sh {up|down|restart|status}"
        echo ""
        echo "Commands:"
        echo "  up       - Start all containers across all machines"
        echo "  down     - Stop and remove all containers"
        echo "  restart  - Stop then start the network"
        echo "  status   - Show running containers on all machines"
        echo ""
        echo "Before running, configure IPs in env.sh"
        echo ""
        exit 1
        ;;
esac
