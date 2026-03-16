#!/bin/bash
# =================================================================
#  Master Multi-Host Deployment Script
#  Purpose: End-to-end deployment across multiple machines
#
#  This script orchestrates the entire deployment:
#    1. Generates crypto material locally
#    2. Distributes to remote machines via SCP
#    3. Updates /etc/hosts on all machines
#    4. Starts Docker containers on all machines
#    5. Creates channel, joins peers, deploys chaincode
#    6. Generates connection profiles
#    7. Starts backend & frontend on each machine
#
#  Prerequisites:
#    - SSH key-based access to all machines
#    - Docker & Docker Compose installed on all machines
#    - Hyperledger Fabric binaries on orderer machine
#    - env.sh configured with correct IPs
#
#  Usage:
#    ./deploy-multihost.sh full      # Full deployment from scratch
#    ./deploy-multihost.sh network   # Only start network + chaincode
#    ./deploy-multihost.sh apps      # Only start backend + frontend
#    ./deploy-multihost.sh reconfigure  # Regenerate configs (IP change)
# =================================================================

set -e

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Source env.sh
if [ ! -f "env.sh" ]; then
    echo "❌ env.sh not found. Please create it first with machine IPs."
    exit 1
fi
source env.sh

REMOTE_USER="${REMOTE_USER:-$(whoami)}"
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-$(pwd)}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

printBanner() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Academic Records Blockchain - Multi-Host Deployment    ║${NC}"
    echo -e "${BLUE}╠══════════════════════════════════════════════════════════╣${NC}"
    echo -e "${BLUE}║  Orderer:      ${ORDERER_HOST}:${ORDERER_PORT}                           ${NC}"
    echo -e "${BLUE}║  NITWarangal:  ${NITWARANGAL_HOST}:${NITWARANGAL_PEER_PORT}  (Peer + Endorser)       ${NC}"
    echo -e "${BLUE}║  Departments:  ${DEPARTMENTS_HOST}:${DEPARTMENTS_PEER_PORT}  (Peer + Endorser)       ${NC}"
    echo -e "${BLUE}║  Verifiers:    ${VERIFIERS_HOST}:${VERIFIERS_PEER_PORT}  (Peer + Endorser + Verifier)${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

printPhase() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  PHASE $1: $2${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Run command on remote or local host
run_on_host() {
    local HOST=$1
    shift
    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        eval "$@"
    else
        ssh "${REMOTE_USER}@${HOST}" "$@"
    fi
}

# ─── PHASE 1: Generate Identities ─────────────────────────────
phase_generate_crypto() {
    printPhase "1" "Generate Crypto Material"
    
    echo -e "  ${YELLOW}Cleaning previous setup...${NC}"
    ./network.sh clean 2>/dev/null || true

    echo -e "  ${YELLOW}Starting CAs to generate identities...${NC}"
    # Use the single-machine compose temporarily to generate all crypto
    docker-compose -f docker/docker-compose-net.yaml up -d ca_orderer ca_nitwarangal ca_departments ca_verifiers
    
    echo "  Waiting 10s for CAs to initialize..."
    sleep 10

    echo -e "  ${YELLOW}Registering and enrolling identities...${NC}"
    # Use existing identity generation scripts
    if [ -d "scripts" ] && [ -f "scripts/registerEnroll.sh" ]; then
        bash scripts/registerEnroll.sh
    else
        echo -e "  ${RED}Identity generation scripts not found. Please generate crypto manually.${NC}"
    fi

    # Stop the temp CAs
    docker-compose -f docker/docker-compose-net.yaml down 2>/dev/null || true

    echo -e "  ${GREEN}✅ Crypto material generated${NC}"
}

# ─── PHASE 2: Distribute Crypto ───────────────────────────────
phase_distribute() {
    printPhase "2" "Distribute Crypto to Remote Machines"
    ./distribute-crypto.sh
    echo -e "  ${GREEN}✅ Crypto distributed${NC}"
}

# ─── PHASE 3: Setup /etc/hosts ────────────────────────────────
phase_hosts() {
    printPhase "3" "Setup /etc/hosts on All Machines"

    for host_info in "Orderer:${ORDERER_HOST}" "NITWarangal:${NITWARANGAL_HOST}" "Departments:${DEPARTMENTS_HOST}" "Verifiers:${VERIFIERS_HOST}"; do
        local name=$(echo "$host_info" | cut -d: -f1)
        local host=$(echo "$host_info" | cut -d: -f2)
        
        echo -e "  Setting up hosts on ${name} (${host})..."
        
        if [ "$host" = "localhost" ] || [ "$host" = "127.0.0.1" ]; then
            sudo ./setup-hosts.sh
        else
            # Copy scripts to remote and run
            scp env.sh setup-hosts.sh "${REMOTE_USER}@${host}:${REMOTE_PROJECT_DIR}/" 2>/dev/null || true
            ssh "${REMOTE_USER}@${host}" "cd ${REMOTE_PROJECT_DIR} && sudo bash setup-hosts.sh" 2>/dev/null || echo "    ⚠️  Could not auto-setup hosts on ${host}"
        fi
    done
    echo -e "  ${GREEN}✅ /etc/hosts configured${NC}"
}

# ─── PHASE 4: Start Network ──────────────────────────────────
phase_network() {
    printPhase "4" "Start Fabric Network"
    ./network-multihost.sh up
    echo -e "  ${GREEN}✅ Network is running${NC}"
}

# ─── PHASE 5: Generate Connection Profiles ────────────────────
phase_profiles() {
    printPhase "5" "Generate Connection Profiles"
    ./generate-connection-profiles.sh
    echo -e "  ${GREEN}✅ Connection profiles generated${NC}"
}

# ─── PHASE 6: Start Applications ─────────────────────────────
phase_apps() {
    printPhase "6" "Start Backend & Frontend on Each Machine"

    local BACKEND_DIR="../Academic-Records-Blockchain-Backend"
    local FRONTEND_DIR="../Academic-Records-Blockchain-Frontend"

    # Start apps for each org
    for org_info in "nitwarangal:${NITWARANGAL_HOST}:NITWarangalMSP" \
                    "departments:${DEPARTMENTS_HOST}:DepartmentsMSP" \
                    "verifiers:${VERIFIERS_HOST}:VerifiersMSP"; do
        
        local ORG_NAME=$(echo "$org_info" | cut -d: -f1)
        local HOST=$(echo "$org_info" | cut -d: -f2)
        local MSP_ID=$(echo "$org_info" | cut -d: -f3)

        echo ""
        echo -e "  ${CYAN}Starting apps for ${ORG_NAME} on ${HOST}...${NC}"

        if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
            # Local deployment
            echo "    Copying .env.${ORG_NAME} → .env"
            cp "${BACKEND_DIR}/.env.${ORG_NAME}" "${BACKEND_DIR}/.env"
            
            # Update GATEWAY_DISCOVERY_AS_LOCALHOST based on mode
            if [ "$MULTI_HOST_MODE" = "true" ]; then
                sed -i 's/GATEWAY_DISCOVERY_AS_LOCALHOST=true/GATEWAY_DISCOVERY_AS_LOCALHOST=false/' "${BACKEND_DIR}/.env"
                sed -i "s|CA_URL=https://localhost|CA_URL=https://${HOST}|" "${BACKEND_DIR}/.env"
                sed -i "s|CORS_ORIGIN=http://localhost:4200|CORS_ORIGIN=http://${HOST}:4200|" "${BACKEND_DIR}/.env"
            fi

            # Import admin and start backend
            echo "    Importing admin identity..."
            cd "${BACKEND_DIR}" && node src/importAdmin.js 2>/dev/null || echo "    ⚠️  Admin import may have failed"
            cd "$BASEDIR"

            echo "    Starting backend..."
            cd "${BACKEND_DIR}"
            lsof -ti :${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
            npm run dev > ../backend-${ORG_NAME}.log 2>&1 &
            cd "$BASEDIR"

            echo -e "    ${GREEN}✅ Backend started for ${ORG_NAME}${NC}"
        else
            # Remote deployment
            echo "    Deploying to remote ${HOST}..."
            scp "${BACKEND_DIR}/.env.${ORG_NAME}" "${REMOTE_USER}@${HOST}:${REMOTE_PROJECT_DIR}/../Academic-Records-Blockchain-Backend/.env"
            ssh "${REMOTE_USER}@${HOST}" "
                cd ${REMOTE_PROJECT_DIR}/../Academic-Records-Blockchain-Backend
                sed -i 's/GATEWAY_DISCOVERY_AS_LOCALHOST=true/GATEWAY_DISCOVERY_AS_LOCALHOST=false/' .env
                sed -i 's|CA_URL=https://localhost|CA_URL=https://${HOST}|' .env
                sed -i 's|CORS_ORIGIN=http://localhost:4200|CORS_ORIGIN=http://${HOST}:4200|' .env
                node src/importAdmin.js 2>/dev/null || true
                lsof -ti :${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
                npm run dev > ../backend-${ORG_NAME}.log 2>&1 &
            "
            echo -e "    ${GREEN}✅ Backend started for ${ORG_NAME} on ${HOST}${NC}"
        fi
    done

    echo ""
    echo -e "  ${GREEN}✅ All applications started${NC}"
}

# ─── RECONFIGURE: Regenerate configs after IP change ──────────
phase_reconfigure() {
    printPhase "R" "Reconfigure Network (IP Change)"
    echo "  This regenerates connection profiles and /etc/hosts after IP change."
    echo ""
    
    # Step 1: Regenerate connection profiles
    echo -e "  ${YELLOW}Regenerating connection profiles...${NC}"
    ./generate-connection-profiles.sh

    # Step 2: Update /etc/hosts
    echo -e "  ${YELLOW}Updating /etc/hosts...${NC}"
    phase_hosts

    # Step 3: Restart backends with new configs
    echo -e "  ${YELLOW}Restarting backends...${NC}"
    phase_apps

    echo ""
    echo -e "  ${GREEN}✅ Reconfiguration complete${NC}"
    echo -e "  ${YELLOW}Note: If peer containers are still running, they keep their gossip config.${NC}"
    echo -e "  ${YELLOW}Restart Docker containers if IPs have changed significantly.${NC}"
}

# ─── Main ──────────────────────────────────────────────────────
printBanner

case "$1" in
    full)
        phase_generate_crypto
        phase_distribute
        phase_hosts
        phase_network
        phase_profiles
        phase_apps

        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║           🎉 DEPLOYMENT COMPLETE! 🎉                    ║${NC}"
        echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Blockchain Roles:                                       ║${NC}"
        echo -e "${GREEN}║    • NITWarangal  → Admin Peer + Endorser                ║${NC}"
        echo -e "${GREEN}║    • Departments  → Department Peer + Endorser           ║${NC}"
        echo -e "${GREEN}║    • Verifiers    → Verifier Peer + Endorser             ║${NC}"
        echo -e "${GREEN}║    • Orderer      → Transaction Ordering Service         ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Endorsement: MAJORITY (2-of-3 orgs must endorse)        ║${NC}"
        echo -e "${GREEN}║  Consensus:   Raft (single orderer)                      ║${NC}"
        echo -e "${GREEN}║  State DB:    CouchDB (rich queries)                     ║${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}║  Access each machine's frontend to interact:             ║${NC}"
        echo -e "${GREEN}║    NITWarangal:  http://${NITWARANGAL_HOST}:4200           ${NC}"
        echo -e "${GREEN}║    Departments:  http://${DEPARTMENTS_HOST}:4200           ${NC}"
        echo -e "${GREEN}║    Verifiers:    http://${VERIFIERS_HOST}:4200             ${NC}"
        echo -e "${GREEN}║                                                          ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
        ;;
    network)
        phase_network
        phase_profiles
        ;;
    apps)
        phase_profiles
        phase_apps
        ;;
    reconfigure)
        phase_reconfigure
        ;;
    *)
        echo "Usage: ./deploy-multihost.sh {full|network|apps|reconfigure}"
        echo ""
        echo "Commands:"
        echo "  full         Full deployment from scratch (crypto → network → apps)"
        echo "  network      Start only network containers + deploy chaincode"
        echo "  apps         Start only backend & frontend on each org's machine"
        echo "  reconfigure  Regenerate configs after IP change (no crypto regen)"
        echo ""
        exit 1
        ;;
esac
