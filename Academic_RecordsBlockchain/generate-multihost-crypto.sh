#!/bin/bash
# =================================================================
#  Generate Crypto Material and Package for Multihost Deployment
# =================================================================

set -o pipefail

# Add local fabric binaries to PATH
export PATH=${PWD}/bin:$PATH

# Import utils
. scripts/utils.sh

CHANNEL_NAME="academic-records-channel"

printHeader "🧹 Cleaning old network and artifacts..."
if [ -f "docker/docker-compose-orderer1.yaml" ]; then
    docker-compose -f docker/docker-compose-orderer1.yaml down --volumes --remove-orphans 2>/dev/null
    docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml down --volumes --remove-orphans 2>/dev/null
    docker-compose -f docker/docker-compose-depts-cse.yaml down --volumes --remove-orphans 2>/dev/null
    docker-compose -f docker/docker-compose-verifiers-peer0.yaml down --volumes --remove-orphans 2>/dev/null
fi
docker ps -aq | xargs -r docker rm -f 2>/dev/null || true
docker network ls | grep "nit-warangal-network" | awk '{print $1}' | xargs -r docker network rm 2>/dev/null || true
rm -rf organizations channel-artifacts system-genesis-block *.tar.gz multihost-crypto-bundle.tar.gz 2>/dev/null || true
mkdir -p channel-artifacts system-genesis-block

printHeader "🧬 Starting CAs to generate identities..."
# Start the CAs using their respective actual docker compose files
docker-compose -f docker/docker-compose-orderer1.yaml up -d ca_orderer
docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d ca_nitwarangal
docker-compose -f docker/docker-compose-depts-cse.yaml up -d ca_departments
docker-compose -f docker/docker-compose-verifiers-peer0.yaml up -d ca_verifiers

infoln "Waiting for Fabric CAs to initialize..."
sleep 10
sudo chown -R $(whoami):$(whoami) organizations 2>/dev/null || true

chmod +x scripts/registerEnroll.sh
./scripts/registerEnroll.sh

infoln "Generating connection profiles..."
chmod +x generate-connection-profiles.sh
./generate-connection-profiles.sh

printHeader "📜 Generating Genesis Block..."
# Note: we need to run configtxgen locally instead of in the CLI container, 
# because we haven't started the full network yet.
export FABRIC_CFG_PATH=${PWD}/configtx
configtxgen -profile AcademicRecordsChannel -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID ${CHANNEL_NAME}
unset FABRIC_CFG_PATH

printHeader "🛑 Stopping CAs..."
docker-compose -f docker/docker-compose-orderer1.yaml stop ca_orderer
docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml stop ca_nitwarangal
docker-compose -f docker/docker-compose-depts-cse.yaml stop ca_departments
docker-compose -f docker/docker-compose-verifiers-peer0.yaml stop ca_verifiers

printHeader "📦 Packaging crypto material..."
# Package both organizations and channel-artifacts into a single file
tar -czvf multihost-crypto-bundle.tar.gz organizations/ channel-artifacts/

successln "✓ Crypto generation complete! Distributed the 'multihost-crypto-bundle.tar.gz' to all other laptops."
