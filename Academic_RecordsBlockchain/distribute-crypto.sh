#!/bin/bash
# =================================================================
#  Distribute Crypto Material to Remote Machines
#  Purpose: Package and SCP org-specific crypto to each machine
#
#  Run this FROM the orderer/genesis machine after running:
#    ./network.sh up   (or just the identity generation step)
#
#  Prerequisites:
#    - SSH access to all machines (key-based recommended)
#    - env.sh configured with correct IPs
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

# Remote user (override with REMOTE_USER env var)
REMOTE_USER="${REMOTE_USER:-$(whoami)}"

# Remote project directory (where the project will live on each machine)
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-~/workspace/Academic_RecordsBlockchain}"

echo "======================================================"
echo "📦 Distributing Crypto Material to Remote Machines"
echo "======================================================"
echo ""
echo "Remote user: ${REMOTE_USER}"
echo "Remote project dir: ${REMOTE_PROJECT_DIR}"
echo ""

# ─── Verify crypto material exists ──────────────────────────────
if [ ! -d "organizations/ordererOrganizations" ]; then
    echo "❌ Crypto material not found. Run './network.sh up' first to generate identities."
    exit 1
fi

# ─── Create distribution packages ──────────────────────────────
DIST_DIR="dist-crypto"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "📋 Creating crypto packages..."

# --- Package for Orderer machine ---
echo "  Packaging orderer crypto..."
mkdir -p "${DIST_DIR}/orderer"
cp -r organizations/ordererOrganizations "${DIST_DIR}/orderer/"
# Orderer also needs all org MSPs for channel creation
cp -r organizations/peerOrganizations "${DIST_DIR}/orderer/"
cp -r organizations/fabric-ca/ordererOrg "${DIST_DIR}/orderer/fabric-ca-ordererOrg"
cp -r configtx "${DIST_DIR}/orderer/"
cp -r scripts "${DIST_DIR}/orderer/"
cp env.sh "${DIST_DIR}/orderer/"
tar -czf "${DIST_DIR}/orderer-crypto.tar.gz" -C "${DIST_DIR}/orderer" .
echo "  ✅ orderer-crypto.tar.gz"

# --- Package for NITWarangal machine ---
echo "  Packaging NITWarangal crypto..."
mkdir -p "${DIST_DIR}/nitwarangal"
# Own org crypto
cp -r organizations/peerOrganizations/nitwarangal.nitw.edu "${DIST_DIR}/nitwarangal/"
cp -r organizations/fabric-ca/nitwarangal "${DIST_DIR}/nitwarangal/fabric-ca-nitwarangal"
# Orderer TLS certs (needed to connect to orderer)
mkdir -p "${DIST_DIR}/nitwarangal/orderer-tls"
cp organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt "${DIST_DIR}/nitwarangal/orderer-tls/"
cp organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem "${DIST_DIR}/nitwarangal/orderer-tls/"
# Other orgs' TLS certs (needed for cross-org endorsement verification)
mkdir -p "${DIST_DIR}/nitwarangal/other-orgs-tls"
cp organizations/peerOrganizations/departments.nitw.edu/tlsca/tlsca.departments.nitw.edu-cert.pem "${DIST_DIR}/nitwarangal/other-orgs-tls/" 2>/dev/null || true
cp organizations/peerOrganizations/verifiers.nitw.edu/tlsca/tlsca.verifiers.nitw.edu-cert.pem "${DIST_DIR}/nitwarangal/other-orgs-tls/" 2>/dev/null || true
# MSP dirs for all orgs (needed for connection profiles)
for org_domain in departments.nitw.edu verifiers.nitw.edu; do
    if [ -d "organizations/peerOrganizations/${org_domain}/msp" ]; then
        mkdir -p "${DIST_DIR}/nitwarangal/peer-msps/${org_domain}"
        cp -r "organizations/peerOrganizations/${org_domain}/msp" "${DIST_DIR}/nitwarangal/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/tlsca" "${DIST_DIR}/nitwarangal/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/ca" "${DIST_DIR}/nitwarangal/peer-msps/${org_domain}/"
    fi
done
cp env.sh "${DIST_DIR}/nitwarangal/"
tar -czf "${DIST_DIR}/nitwarangal-crypto.tar.gz" -C "${DIST_DIR}/nitwarangal" .
echo "  ✅ nitwarangal-crypto.tar.gz"

# --- Package for Departments machine ---
echo "  Packaging Departments crypto..."
mkdir -p "${DIST_DIR}/departments"
cp -r organizations/peerOrganizations/departments.nitw.edu "${DIST_DIR}/departments/"
cp -r organizations/fabric-ca/departments "${DIST_DIR}/departments/fabric-ca-departments"
mkdir -p "${DIST_DIR}/departments/orderer-tls"
cp organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt "${DIST_DIR}/departments/orderer-tls/"
cp organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem "${DIST_DIR}/departments/orderer-tls/"
mkdir -p "${DIST_DIR}/departments/other-orgs-tls"
cp organizations/peerOrganizations/nitwarangal.nitw.edu/tlsca/tlsca.nitwarangal.nitw.edu-cert.pem "${DIST_DIR}/departments/other-orgs-tls/" 2>/dev/null || true
cp organizations/peerOrganizations/verifiers.nitw.edu/tlsca/tlsca.verifiers.nitw.edu-cert.pem "${DIST_DIR}/departments/other-orgs-tls/" 2>/dev/null || true
for org_domain in nitwarangal.nitw.edu verifiers.nitw.edu; do
    if [ -d "organizations/peerOrganizations/${org_domain}/msp" ]; then
        mkdir -p "${DIST_DIR}/departments/peer-msps/${org_domain}"
        cp -r "organizations/peerOrganizations/${org_domain}/msp" "${DIST_DIR}/departments/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/tlsca" "${DIST_DIR}/departments/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/ca" "${DIST_DIR}/departments/peer-msps/${org_domain}/"
    fi
done
cp env.sh "${DIST_DIR}/departments/"
tar -czf "${DIST_DIR}/departments-crypto.tar.gz" -C "${DIST_DIR}/departments" .
echo "  ✅ departments-crypto.tar.gz"

# --- Package for Verifiers machine ---
echo "  Packaging Verifiers crypto..."
mkdir -p "${DIST_DIR}/verifiers"
cp -r organizations/peerOrganizations/verifiers.nitw.edu "${DIST_DIR}/verifiers/"
cp -r organizations/fabric-ca/verifiers "${DIST_DIR}/verifiers/fabric-ca-verifiers"
mkdir -p "${DIST_DIR}/verifiers/orderer-tls"
cp organizations/ordererOrganizations/nitw.edu/orderers/orderer.nitw.edu/tls/ca.crt "${DIST_DIR}/verifiers/orderer-tls/"
cp organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem "${DIST_DIR}/verifiers/orderer-tls/"
mkdir -p "${DIST_DIR}/verifiers/other-orgs-tls"
cp organizations/peerOrganizations/nitwarangal.nitw.edu/tlsca/tlsca.nitwarangal.nitw.edu-cert.pem "${DIST_DIR}/verifiers/other-orgs-tls/" 2>/dev/null || true
cp organizations/peerOrganizations/departments.nitw.edu/tlsca/tlsca.departments.nitw.edu-cert.pem "${DIST_DIR}/verifiers/other-orgs-tls/" 2>/dev/null || true
for org_domain in nitwarangal.nitw.edu departments.nitw.edu; do
    if [ -d "organizations/peerOrganizations/${org_domain}/msp" ]; then
        mkdir -p "${DIST_DIR}/verifiers/peer-msps/${org_domain}"
        cp -r "organizations/peerOrganizations/${org_domain}/msp" "${DIST_DIR}/verifiers/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/tlsca" "${DIST_DIR}/verifiers/peer-msps/${org_domain}/"
        cp -r "organizations/peerOrganizations/${org_domain}/ca" "${DIST_DIR}/verifiers/peer-msps/${org_domain}/"
    fi
done
cp env.sh "${DIST_DIR}/verifiers/"
tar -czf "${DIST_DIR}/verifiers-crypto.tar.gz" -C "${DIST_DIR}/verifiers" .
echo "  ✅ verifiers-crypto.tar.gz"

echo ""
echo "════════════════════════════════════════════════════════"
echo "📦 Crypto packages created in: ${DIST_DIR}/"
echo "════════════════════════════════════════════════════════"

# ─── SCP to remote machines ──────────────────────────────────────
echo ""
echo "📡 Sending packages to remote machines..."
echo ""

# Function to distribute to a machine
distribute_to_machine() {
    local HOST=$1
    local PACKAGE=$2
    local ORG_NAME=$3

    if [ "$HOST" = "localhost" ] || [ "$HOST" = "127.0.0.1" ]; then
        echo "  ⏭️  Skipping ${ORG_NAME} (localhost — already local)"
        return
    fi

    echo "  📡 Sending ${ORG_NAME} crypto to ${REMOTE_USER}@${HOST}..."
    
    # Create remote directory
    ssh "${REMOTE_USER}@${HOST}" "mkdir -p ${REMOTE_PROJECT_DIR}/organizations/peerOrganizations ${REMOTE_PROJECT_DIR}/organizations/ordererOrganizations ${REMOTE_PROJECT_DIR}/organizations/fabric-ca" 2>/dev/null

    # SCP the tarball
    scp "${DIST_DIR}/${PACKAGE}" "${REMOTE_USER}@${HOST}:/tmp/${PACKAGE}"

    # Extract on remote
    ssh "${REMOTE_USER}@${HOST}" "cd /tmp && tar -xzf ${PACKAGE} && echo 'Extracted ${PACKAGE}'"

    echo "  ✅ ${ORG_NAME} crypto distributed to ${HOST}"
}

# Distribute to each machine
distribute_to_machine "$ORDERER_HOST" "orderer-crypto.tar.gz" "Orderer"
distribute_to_machine "$NITWARANGAL_HOST" "nitwarangal-crypto.tar.gz" "NITWarangal"
distribute_to_machine "$DEPARTMENTS_HOST" "departments-crypto.tar.gz" "Departments"
distribute_to_machine "$VERIFIERS_HOST" "verifiers-crypto.tar.gz" "Verifiers"

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Crypto distribution complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. On each machine, run: sudo ./setup-hosts.sh"
echo "  2. On orderer machine: docker-compose -f docker/docker-compose-orderer.yaml up -d"
echo "  3. On each org machine: docker-compose -f docker/docker-compose-<org>.yaml up -d"
echo "  4. Create channel and join peers (from orderer machine)"
echo ""
echo "Or use: ./deploy-multihost.sh to automate all steps."
echo ""
