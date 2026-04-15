#!/bin/bash
# =================================================================
#  Central Environment Configuration — 12-System Distributed Network
#  Purpose: Single source of truth for ALL machine IPs and ports
#
#  MACHINE MAP:
#  ┌─── ORDERER CLUSTER (Raft, 3 nodes) ──────────────────────────┐
#  │  Node 01: orderer1.nitw.edu  (Primary + CA)                  │
#  │  Node 02: orderer2.nitw.edu  (Raft follower)                 │
#  │  Node 03: orderer3.nitw.edu  (Raft follower)                 │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── NITWarangal ORG (Admin + Registry) ───────────────────────┐
#  │  Node 04: peer0.nitwarangal (Admin + ExamSection + Dean)     │
#  │  Node 05: peer1.nitwarangal (Student Portal backend)         │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── DEPARTMENTS ORG (Faculty + HOD + DAC) ────────────────────┐
#  │  Node 06: peer0.cse.departments (CSE Dept)                   │
#  │  Node 07: peer0.ece.departments (ECE Dept)                   │
#  │  Node 08: peer0.me.departments  (ME Dept)                    │
#  │  Node 09: peer0.dac.departments (DAC Committee)              │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── VERIFIERS ORG (External Credential Verifiers) ────────────┐
#  │  Node 10: peer0.verifiers (Primary verifier)                 │
#  │  Node 11: peer1.verifiers (Secondary verifier)               │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── STUDENT PORTAL (SDK-only — no peer) ───────────────────────┐
#  │  Node 12: student-portal  (Light client, read + cert request) │
#  └──────────────────────────────────────────────────────────────┘
#
#  Usage: source ./env.sh before running any other script
# =================================================================

# ─── Node 01: Orderer 1 (Primary Raft Leader) ──────────────────
export ORDERER1_HOST="${ORDERER1_HOST:-localhost}"
export ORDERER1_PORT="${ORDERER1_PORT:-7050}"
export ORDERER1_ADMIN_PORT="${ORDERER1_ADMIN_PORT:-7053}"
export ORDERER1_CA_PORT="${ORDERER1_CA_PORT:-7054}"

# ─── Node 02: Orderer 2 (Raft Follower) ────────────────────────
export ORDERER2_HOST="${ORDERER2_HOST:-localhost}"
export ORDERER2_PORT="${ORDERER2_PORT:-8050}"
export ORDERER2_ADMIN_PORT="${ORDERER2_ADMIN_PORT:-8053}"

# ─── Node 03: Orderer 3 (Raft Follower) ────────────────────────
export ORDERER3_HOST="${ORDERER3_HOST:-localhost}"
export ORDERER3_PORT="${ORDERER3_PORT:-9050}"
export ORDERER3_ADMIN_PORT="${ORDERER3_ADMIN_PORT:-9053}"

# Backward-compat alias (existing scripts use ORDERER_HOST)
export ORDERER_HOST="${ORDERER1_HOST}"
export ORDERER_PORT="${ORDERER1_PORT}"

# ─── Node 04: NITWarangal Peer 0 (Admin/ExamSection/Dean) ──────
export NITW_PEER0_HOST="${NITW_PEER0_HOST:-localhost}"
export NITW_PEER0_PORT="${NITW_PEER0_PORT:-7051}"
export NITW_PEER0_CHAINCODE_PORT="${NITW_PEER0_CHAINCODE_PORT:-7052}"
export NITW_CA_PORT="${NITW_CA_PORT:-8054}"
export NITW_COUCHDB0_PORT="${NITW_COUCHDB0_PORT:-5984}"
export NITW_BACKEND_PORT="${NITW_BACKEND_PORT:-3000}"

# ─── Node 05: NITWarangal Peer 1 (Student Portal backend) ──────
export NITW_PEER1_HOST="${NITW_PEER1_HOST:-localhost}"
export NITW_PEER1_PORT="${NITW_PEER1_PORT:-7151}"
export NITW_COUCHDB1_PORT="${NITW_COUCHDB1_PORT:-5985}"
export NITW_BACKEND1_PORT="${NITW_BACKEND1_PORT:-3001}"

# Backward-compat alias
export NITWARANGAL_HOST="${NITW_PEER0_HOST}"
export NITWARANGAL_PEER_PORT="${NITW_PEER0_PORT}"
export NITWARANGAL_CA_PORT="${NITW_CA_PORT}"

# ─── Node 06: Departments — CSE peer ───────────────────────────
export DEPT_CSE_HOST="${DEPT_CSE_HOST:-localhost}"
export DEPT_CSE_PORT="${DEPT_CSE_PORT:-9051}"
export DEPT_CSE_CHAINCODE_PORT="${DEPT_CSE_CHAINCODE_PORT:-9052}"
export DEPT_CSE_COUCHDB_PORT="${DEPT_CSE_COUCHDB_PORT:-5986}"
export DEPT_CSE_BACKEND_PORT="${DEPT_CSE_BACKEND_PORT:-3002}"

# ─── Node 07: Departments — ECE peer ───────────────────────────
export DEPT_ECE_HOST="${DEPT_ECE_HOST:-localhost}"
export DEPT_ECE_PORT="${DEPT_ECE_PORT:-9151}"
export DEPT_ECE_CHAINCODE_PORT="${DEPT_ECE_CHAINCODE_PORT:-9152}"
export DEPT_ECE_COUCHDB_PORT="${DEPT_ECE_COUCHDB_PORT:-5987}"
export DEPT_ECE_BACKEND_PORT="${DEPT_ECE_BACKEND_PORT:-3003}"

# ─── Node 08: Departments — ME peer ────────────────────────────
export DEPT_ME_HOST="${DEPT_ME_HOST:-localhost}"
export DEPT_ME_PORT="${DEPT_ME_PORT:-9251}"
export DEPT_ME_CHAINCODE_PORT="${DEPT_ME_CHAINCODE_PORT:-9252}"
export DEPT_ME_COUCHDB_PORT="${DEPT_ME_COUCHDB_PORT:-5988}"
export DEPT_ME_BACKEND_PORT="${DEPT_ME_BACKEND_PORT:-3004}"

# ─── Node 09: Departments — DAC Committee peer ─────────────────
export DEPT_DAC_HOST="${DEPT_DAC_HOST:-localhost}"
export DEPT_DAC_PORT="${DEPT_DAC_PORT:-9351}"
export DEPT_DAC_CHAINCODE_PORT="${DEPT_DAC_CHAINCODE_PORT:-9352}"
export DEPT_DAC_COUCHDB_PORT="${DEPT_DAC_COUCHDB_PORT:-5989}"
export DEPT_DAC_BACKEND_PORT="${DEPT_DAC_BACKEND_PORT:-3005}"

# Backward-compat alias (existing scripts use DEPARTMENTS_*)
export DEPARTMENTS_HOST="${DEPT_CSE_HOST}"
export DEPARTMENTS_PEER_PORT="${DEPT_CSE_PORT}"
export DEPARTMENTS_CA_PORT="${DEPT_CA_PORT:-9054}"

# ─── Departments CA (shared across all dept peers) ─────────────
export DEPT_CA_HOST="${DEPT_CA_HOST:-${DEPT_CSE_HOST}}"
export DEPT_CA_PORT="${DEPT_CA_PORT:-9054}"

# ─── Node 10: Verifiers — Peer 0 ───────────────────────────────
export VERI_PEER0_HOST="${VERI_PEER0_HOST:-localhost}"
export VERI_PEER0_PORT="${VERI_PEER0_PORT:-11051}"
export VERI_PEER0_CHAINCODE_PORT="${VERI_PEER0_CHAINCODE_PORT:-11052}"
export VERI_CA_PORT="${VERI_CA_PORT:-11054}"
export VERI_COUCHDB0_PORT="${VERI_COUCHDB0_PORT:-5990}"
export VERI_BACKEND_PORT="${VERI_BACKEND_PORT:-3006}"

# ─── Node 11: Verifiers — Peer 1 ───────────────────────────────
export VERI_PEER1_HOST="${VERI_PEER1_HOST:-localhost}"
export VERI_PEER1_PORT="${VERI_PEER1_PORT:-11151}"
export VERI_COUCHDB1_PORT="${VERI_COUCHDB1_PORT:-5991}"
export VERI_BACKEND1_PORT="${VERI_BACKEND1_PORT:-3007}"

# Backward-compat alias
export VERIFIERS_HOST="${VERI_PEER0_HOST}"
export VERIFIERS_PEER_PORT="${VERI_PEER0_PORT}"
export VERIFIERS_CA_PORT="${VERI_CA_PORT}"

# ─── Node 12: Student Portal (SDK-only, no peer) ───────────────
export STUDENT_PORTAL_HOST="${STUDENT_PORTAL_HOST:-localhost}"
export STUDENT_PORTAL_BACKEND_PORT="${STUDENT_PORTAL_BACKEND_PORT:-3008}"
export STUDENT_PORTAL_FRONTEND_PORT="${STUDENT_PORTAL_FRONTEND_PORT:-4208}"

# ─── Fabric Channel + Chaincode ────────────────────────────────
export CHANNEL_NAME="${CHANNEL_NAME:-academic-records-channel}"
export CHAINCODE_NAME="${CHAINCODE_NAME:-academic-records}"
export CHAINCODE_VERSION="${CHAINCODE_VERSION:-1.0}"
export CHAINCODE_SEQUENCE="${CHAINCODE_SEQUENCE:-1}"

# ─── Multi-Host Detection ───────────────────────────────────────
# If any peer host differs from orderer1, we're in multi-host mode
LOCALHOST_HOSTS=(
    "${ORDERER1_HOST}" "${NITW_PEER0_HOST}" "${DEPT_CSE_HOST}"
    "${VERI_PEER0_HOST}"
)
ALL_LOCALHOST=true
for h in "${LOCALHOST_HOSTS[@]}"; do
    if [ "$h" != "localhost" ] && [ "$h" != "127.0.0.1" ]; then
        ALL_LOCALHOST=false
        break
    fi
done

if [ "$ALL_LOCALHOST" = false ]; then
    export MULTI_HOST_MODE="true"
    export DISCOVERY_AS_LOCALHOST="false"
else
    export MULTI_HOST_MODE="false"
    export DISCOVERY_AS_LOCALHOST="true"
fi

echo "======================================================"
echo "  Academic Records Blockchain — Environment Loaded"
echo "======================================================"
echo "  Orderer Cluster: ${ORDERER1_HOST}:${ORDERER1_PORT} (primary)"
echo "                   ${ORDERER2_HOST}:${ORDERER2_PORT} (raft-2)"
echo "                   ${ORDERER3_HOST}:${ORDERER3_PORT} (raft-3)"
echo ""
echo "  NITWarangal:  peer0=${NITW_PEER0_HOST}:${NITW_PEER0_PORT}"
echo "                peer1=${NITW_PEER1_HOST}:${NITW_PEER1_PORT}"
echo "  Departments:  CSE=${DEPT_CSE_HOST}:${DEPT_CSE_PORT}"
echo "                ECE=${DEPT_ECE_HOST}:${DEPT_ECE_PORT}"
echo "                ME=${DEPT_ME_HOST}:${DEPT_ME_PORT}"
echo "                DAC=${DEPT_DAC_HOST}:${DEPT_DAC_PORT}"
echo "  Verifiers:    peer0=${VERI_PEER0_HOST}:${VERI_PEER0_PORT}"
echo "                peer1=${VERI_PEER1_HOST}:${VERI_PEER1_PORT}"
echo "  Student Portal: ${STUDENT_PORTAL_HOST}:${STUDENT_PORTAL_BACKEND_PORT}"
echo ""
echo "  Multi-Host Mode: ${MULTI_HOST_MODE}"
echo "  GATEWAY_DISCOVERY_AS_LOCALHOST: ${DISCOVERY_AS_LOCALHOST}"
echo "======================================================"
