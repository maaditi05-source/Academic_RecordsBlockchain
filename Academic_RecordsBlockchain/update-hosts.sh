#!/bin/bash
# =================================================================
#  update-hosts.sh
#  Purpose: Safely updates /etc/hosts with Tailscale IPs (permanent).
# =================================================================

set -e
source env.sh

echo "Updating /etc/hosts with Tailscale IPs..."

# Remove any existing nitw.edu entries
sudo sed -i '/nitw\.edu/d' /etc/hosts

# Add the permanent Tailscale entries
sudo bash -c 'cat >> /etc/hosts << EOF
# === Academic Records Blockchain Network (Tailscale) ===
100.65.71.102   orderer1.nitw.edu
100.88.165.33   orderer2.nitw.edu
100.102.112.54  orderer3.nitw.edu
100.93.235.38   peer0.nitwarangal.nitw.edu
100.102.67.29   peer1.nitwarangal.nitw.edu
100.73.161.99   peer2.nitwarangal.nitw.edu
100.103.144.78  peer0.cse.departments.nitw.edu
100.118.136.16  peer1.cse.departments.nitw.edu
100.75.175.30   peer0.ece.departments.nitw.edu
100.101.132.58  peer1.ece.departments.nitw.edu
100.123.15.33   peer0.verifiers.nitw.edu
100.79.122.76   peer1.verifiers.nitw.edu
# === END ===
EOF'

echo "✅ /etc/hosts updated with permanent Tailscale IPs!"
grep "nitw.edu" /etc/hosts
