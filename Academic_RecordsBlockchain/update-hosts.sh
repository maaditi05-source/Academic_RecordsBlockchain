#!/bin/bash
# =================================================================
#  update-hosts.sh
#  Purpose: Safely updates /etc/hosts with current Wi-Fi IPs.
# =================================================================

set -e
source env.sh

echo "Updating /etc/hosts with current Wi-Fi IPs..."

# Remove any existing nitw.edu entries
sudo sed -i '/nitw\.edu/d' /etc/hosts

# Add the current entries
sudo bash -c "cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
${ORDERER1_HOST}  orderer1.nitw.edu
${ORDERER2_HOST}  orderer2.nitw.edu
${ORDERER3_HOST}  orderer3.nitw.edu
${NITW_PEER0_HOST}  peer0.nitwarangal.nitw.edu
${NITW_PEER1_HOST}  peer1.nitwarangal.nitw.edu
${NITW_PEER2_HOST}  peer2.nitwarangal.nitw.edu
${DEPTS_CSE_PEER0_HOST}  peer0.cse.departments.nitw.edu
${DEPTS_CSE_PEER1_HOST}  peer1.cse.departments.nitw.edu
${DEPTS_ECE_PEER0_HOST}  peer0.ece.departments.nitw.edu
${DEPTS_ECE_PEER1_HOST}  peer1.ece.departments.nitw.edu
${VERIFIERS_PEER0_HOST}  peer0.verifiers.nitw.edu
${VERIFIERS_PEER1_HOST}  peer1.verifiers.nitw.edu
# === END ===
EOF"

echo "✅ /etc/hosts updated!"
grep "nitw.edu" /etc/hosts
