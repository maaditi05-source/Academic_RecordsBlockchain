#!/bin/bash
# =================================================================
#  Central Environment Configuration — 13-System Distributed Network
#  Purpose: Single source of truth for ALL machine IPs and ports
#
#  MACHINE MAP:
#  ┌─── ORDERER CLUSTER (Raft, 3 nodes) ──────────────────────────┐
#  │  Node 01: orderer1.nitw.edu  (Primary + CA)                  │
#  │  Node 02: orderer2.nitw.edu  (Raft follower)                 │
#  │  Node 03: orderer3.nitw.edu  (Raft follower)                 │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── NITWarangal ORG (Admin + ExamSection + Dean) ─────────────┐
#  │  Node 04: peer0.nitwarangal (Admin + AdminFinalApprove)      │
#  │  Node 05: peer1.nitwarangal (Exam Section approvals)         │
#  │  Node 06: peer2.nitwarangal (Dean Academic approvals)        │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── DEPARTMENTS ORG (CSE + ECE, HOD + Faculty each) ──────────┐
#  │  Node 07: peer0.cse.departments (CSE HOD — Anchor)           │
#  │  Node 08: peer1.cse.departments (CSE Faculty Advisor)        │
#  │  Node 09: peer0.ece.departments (ECE HOD)                    │
#  │  Node 10: peer1.ece.departments (ECE Faculty Advisor)        │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── VERIFIERS ORG (External Credential Verifiers) ────────────┐
#  │  Node 11: peer0.verifiers (Primary verifier)                 │
#  │  Node 12: peer1.verifiers (Secondary verifier)               │
#  └──────────────────────────────────────────────────────────────┘
#  ┌─── STUDENT PORTAL (SDK-only — no peer) ──────────────────────┐
#  │  Node 13: student-portal (Light client, read + cert request) │
#  └──────────────────────────────────────────────────────────────┘
#
#  Usage: source ./env.sh before running any other script
# =================================================================

# ─── Node 01: Orderer 1 (Primary Raft Leader) ──────────────────
export ORDERER1_HOST="${ORDERER1_HOST:-172.20.233.222}"
export ORDERER1_PORT="${ORDERER1_PORT:-7050}"
export ORDERER1_ADMIN_PORT="${ORDERER1_ADMIN_PORT:-7053}"
export ORDERER1_CA_PORT="${ORDERER1_CA_PORT:-7054}"

# ─── Node 02: Orderer 2 (Raft Follower) ────────────────────────
export ORDERER2_HOST="${ORDERER2_HOST:-172.20.242.77}"
export ORDERER2_PORT="${ORDERER2_PORT:-8050}"
export ORDERER2_ADMIN_PORT="${ORDERER2_ADMIN_PORT:-8053}"

# ─── Node 03: Orderer 3 (Raft Follower) ────────────────────────
export ORDERER3_HOST="${ORDERER3_HOST:-172.20.241.65}"
export ORDERER3_PORT="${ORDERER3_PORT:-9050}"
export ORDERER3_ADMIN_PORT="${ORDERER3_ADMIN_PORT:-9053}"

# Backward-compat alias
export ORDERER_HOST="${ORDERER1_HOST}"
export ORDERER_PORT="${ORDERER1_PORT}"

# ─── Node 04: NITWarangal Peer 0 (Admin) ───────────────────────
export NITW_PEER0_HOST="${NITW_PEER0_HOST:-172.20.240.94}"
export NITW_PEER0_PORT="${NITW_PEER0_PORT:-7051}"
export NITW_PEER0_CHAINCODE_PORT="${NITW_PEER0_CHAINCODE_PORT:-7052}"
export NITW_CA_PORT="${NITW_CA_PORT:-8054}"
export NITW_COUCHDB0_PORT="${NITW_COUCHDB0_PORT:-5984}"
export NITW_BACKEND_PORT="${NITW_BACKEND_PORT:-3000}"

# ─── Node 05: NITWarangal Peer 1 (Exam Section) ────────────────
export NITW_PEER1_HOST="${NITW_PEER1_HOST:-172.20.238.52}"
export NITW_PEER1_PORT="${NITW_PEER1_PORT:-7151}"
export NITW_PEER1_CHAINCODE_PORT="${NITW_PEER1_CHAINCODE_PORT:-7152}"
export NITW_COUCHDB1_PORT="${NITW_COUCHDB1_PORT:-5985}"
export NITW_BACKEND1_PORT="${NITW_BACKEND1_PORT:-3001}"

# ─── Node 06: NITWarangal Peer 2 (Dean Academic) ───────────────
export NITW_PEER2_HOST="${NITW_PEER2_HOST:-172.20.255.20}"
export NITW_PEER2_PORT="${NITW_PEER2_PORT:-7251}"
export NITW_PEER2_CHAINCODE_PORT="${NITW_PEER2_CHAINCODE_PORT:-7252}"
export NITW_COUCHDB2_PORT="${NITW_COUCHDB2_PORT:-5986}"
export NITW_BACKEND2_PORT="${NITW_BACKEND2_PORT:-3002}"

# Backward-compat alias
export NITWARANGAL_HOST="${NITW_PEER0_HOST}"
export NITWARANGAL_PEER_PORT="${NITW_PEER0_PORT}"
export NITWARANGAL_CA_PORT="${NITW_CA_PORT}"

# ─── Node 07: Departments — CSE HOD (Anchor Peer) ──────────────
export DEPT_CSE_HOD_HOST="${DEPT_CSE_HOD_HOST:-172.20.253.70}"
export DEPT_CSE_HOD_PORT="${DEPT_CSE_HOD_PORT:-9051}"
export DEPT_CSE_HOD_CHAINCODE_PORT="${DEPT_CSE_HOD_CHAINCODE_PORT:-9052}"
export DEPT_CSE_HOD_COUCHDB_PORT="${DEPT_CSE_HOD_COUCHDB_PORT:-5987}"
export DEPT_CSE_HOD_BACKEND_PORT="${DEPT_CSE_HOD_BACKEND_PORT:-3003}"

# ─── Node 08: Departments — CSE Faculty Advisor ────────────────
export DEPT_CSE_FAC_HOST="${DEPT_CSE_FAC_HOST:-172.20.252.35}"
export DEPT_CSE_FAC_PORT="${DEPT_CSE_FAC_PORT:-9151}"
export DEPT_CSE_FAC_CHAINCODE_PORT="${DEPT_CSE_FAC_CHAINCODE_PORT:-9152}"
export DEPT_CSE_FAC_COUCHDB_PORT="${DEPT_CSE_FAC_COUCHDB_PORT:-5988}"
export DEPT_CSE_FAC_BACKEND_PORT="${DEPT_CSE_FAC_BACKEND_PORT:-3004}"

# ─── Node 09: Departments — ECE HOD ────────────────────────────
export DEPT_ECE_HOD_HOST="${DEPT_ECE_HOD_HOST:-172.20.244.89}"
export DEPT_ECE_HOD_PORT="${DEPT_ECE_HOD_PORT:-9251}"
export DEPT_ECE_HOD_CHAINCODE_PORT="${DEPT_ECE_HOD_CHAINCODE_PORT:-9252}"
export DEPT_ECE_HOD_COUCHDB_PORT="${DEPT_ECE_HOD_COUCHDB_PORT:-5989}"
export DEPT_ECE_HOD_BACKEND_PORT="${DEPT_ECE_HOD_BACKEND_PORT:-3005}"

# ─── Node 10: Departments — ECE Faculty Advisor ────────────────
export DEPT_ECE_FAC_HOST="${DEPT_ECE_FAC_HOST:-172.20.235.77}"
export DEPT_ECE_FAC_PORT="${DEPT_ECE_FAC_PORT:-9351}"
export DEPT_ECE_FAC_CHAINCODE_PORT="${DEPT_ECE_FAC_CHAINCODE_PORT:-9352}"
export DEPT_ECE_FAC_COUCHDB_PORT="${DEPT_ECE_FAC_COUCHDB_PORT:-5990}"
export DEPT_ECE_FAC_BACKEND_PORT="${DEPT_ECE_FAC_BACKEND_PORT:-3006}"

# ─── Departments CA (shared across all dept peers, runs on CSE HOD node) ──
export DEPT_CA_HOST="${DEPT_CA_HOST:-${DEPT_CSE_HOD_HOST}}"
export DEPT_CA_PORT="${DEPT_CA_PORT:-9054}"

# Backward-compat alias
export DEPARTMENTS_HOST="${DEPT_CSE_HOD_HOST}"
export DEPARTMENTS_PEER_PORT="${DEPT_CSE_HOD_PORT}"
export DEPARTMENTS_CA_PORT="${DEPT_CA_PORT}"

# ─── Node 11: Verifiers — Peer 0 (Primary) ─────────────────────
export VERI_PEER0_HOST="${VERI_PEER0_HOST:-172.20.254.157}"
export VERI_PEER0_PORT="${VERI_PEER0_PORT:-11051}"
export VERI_PEER0_CHAINCODE_PORT="${VERI_PEER0_CHAINCODE_PORT:-11052}"
export VERI_CA_PORT="${VERI_CA_PORT:-11054}"
export VERI_COUCHDB0_PORT="${VERI_COUCHDB0_PORT:-5991}"
export VERI_BACKEND_PORT="${VERI_BACKEND_PORT:-3007}"

# ─── Node 12: Verifiers — Peer 1 (Secondary HA) ────────────────
export VERI_PEER1_HOST="${VERI_PEER1_HOST:-172.20.252.188}"
export VERI_PEER1_PORT="${VERI_PEER1_PORT:-11151}"
export VERI_PEER1_CHAINCODE_PORT="${VERI_PEER1_CHAINCODE_PORT:-11152}"
export VERI_COUCHDB1_PORT="${VERI_COUCHDB1_PORT:-5992}"
export VERI_BACKEND1_PORT="${VERI_BACKEND1_PORT:-3008}"

# Backward-compat alias
export VERIFIERS_HOST="${VERI_PEER0_HOST}"
export VERIFIERS_PEER_PORT="${VERI_PEER0_PORT}"
export VERIFIERS_CA_PORT="${VERI_CA_PORT}"

# ─── Node 13: Student Portal (SDK-only, no peer) ───────────────
export STUDENT_PORTAL_HOST="${STUDENT_PORTAL_HOST:-localhost}"
export STUDENT_PORTAL_BACKEND_PORT="${STUDENT_PORTAL_BACKEND_PORT:-3009}"
export STUDENT_PORTAL_FRONTEND_PORT="${STUDENT_PORTAL_FRONTEND_PORT:-4200}"

# ─── Fabric Channel + Chaincode ────────────────────────────────
export CHANNEL_NAME="${CHANNEL_NAME:-academic-records-channel}"
export CHAINCODE_NAME="${CHAINCODE_NAME:-academic-records}"
export CHAINCODE_VERSION="${CHAINCODE_VERSION:-2.0}"
export CHAINCODE_SEQUENCE="${CHAINCODE_SEQUENCE:-1}"

# ─── Multi-Host Detection ───────────────────────────────────────
LOCALHOST_HOSTS=(
    "${ORDERER1_HOST}" "${NITW_PEER0_HOST}" "${DEPT_CSE_HOD_HOST}"
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
echo "  NITWarangal:  peer0=${NITW_PEER0_HOST}:${NITW_PEER0_PORT} (Admin)"
echo "                peer1=${NITW_PEER1_HOST}:${NITW_PEER1_PORT} (ExamSection)"
echo "                peer2=${NITW_PEER2_HOST}:${NITW_PEER2_PORT} (Dean)"
echo "  Departments:  CSE HOD=${DEPT_CSE_HOD_HOST}:${DEPT_CSE_HOD_PORT}"
echo "                CSE Faculty=${DEPT_CSE_FAC_HOST}:${DEPT_CSE_FAC_PORT}"
echo "                ECE HOD=${DEPT_ECE_HOD_HOST}:${DEPT_ECE_HOD_PORT}"
echo "                ECE Faculty=${DEPT_ECE_FAC_HOST}:${DEPT_ECE_FAC_PORT}"
echo "  Verifiers:    peer0=${VERI_PEER0_HOST}:${VERI_PEER0_PORT}"
echo "                peer1=${VERI_PEER1_HOST}:${VERI_PEER1_PORT}"
echo "  Student Portal: ${STUDENT_PORTAL_HOST}:${STUDENT_PORTAL_BACKEND_PORT}"
echo ""
echo "  Multi-Host Mode: ${MULTI_HOST_MODE}"
echo "  GATEWAY_DISCOVERY_AS_LOCALHOST: ${DISCOVERY_AS_LOCALHOST}"
echo "======================================================"
