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
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network ===
172.20.233.222  orderer1.nitw.edu
172.20.242.77   orderer2.nitw.edu
172.20.241.65   orderer3.nitw.edu
172.20.229.166  peer0.nitwarangal.nitw.edu
172.20.238.52   peer1.nitwarangal.nitw.edu
172.20.255.20   peer2.nitwarangal.nitw.edu
172.20.253.70   peer0.cse.departments.nitw.edu
172.20.252.35   peer1.cse.departments.nitw.edu
172.20.244.89   peer0.ece.departments.nitw.edu
172.20.235.77   peer1.ece.departments.nitw.edu
172.20.254.157  peer0.verifiers.nitw.edu
172.20.252.188  peer1.verifiers.nitw.edu
# === END ===
EOF'

echo "✅ /etc/hosts updated!"
grep "nitw.edu" /etc/hosts
