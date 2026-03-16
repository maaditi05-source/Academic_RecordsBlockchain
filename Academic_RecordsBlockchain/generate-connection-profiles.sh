#!/bin/bash
# =================================================================
#  Generate Connection Profiles for All Organizations
#  Purpose: Create connection profile JSON files for SDK clients
#
#  For multi-host: source env.sh first or set HOST env vars
#  Connection profiles include ALL orgs so each backend can discover
#  and interact with peers, endorsers, and verifiers across machines.
# =================================================================

set -e

BASEDIR=$(dirname "$0")
cd "$BASEDIR"

# Source env.sh if available
if [ -f "env.sh" ]; then
    source env.sh
fi

ORGS_DIR="organizations/peerOrganizations"

echo "======================================================"
echo "🔗 Generating Connection Profiles (Multi-Host Aware)"
echo "======================================================"

# Function to generate connection profile for an organization
# Each profile includes ALL orgs so the backend SDK can discover
# all peers for endorsement, commit, and verification.
generate_connection_profile() {
    local ORG_NAME=$1
    local ORG_DOMAIN=$2
    local ORG_MSP=$3
    local PEER_HOST=$4
    local PEER_PORT=$5
    local CA_HOST=$6
    local CA_PORT=$7
    
    echo "Generating connection profile for ${ORG_NAME} (host: ${PEER_HOST})..."
    
    local ORG_DIR="${ORGS_DIR}/${ORG_DOMAIN}"
    local OUTPUT_FILE="${ORG_DIR}/connection-${ORG_NAME}.json"
    
    # Get CA certificate for primary org
    local CA_CERT=$(cat "${ORG_DIR}/ca/ca.${ORG_DOMAIN}-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    local TLSCA_CERT=$(cat "${ORG_DIR}/tlsca/tlsca.${ORG_DOMAIN}-cert.pem" | sed 's/$/\\n/' | tr -d '\n')

    # ----- Collect TLS certs for ALL peer orgs -----
    local NITW_TLSCA=""
    local DEPT_TLSCA=""
    local VERI_TLSCA=""
    
    if [ -f "${ORGS_DIR}/nitwarangal.nitw.edu/tlsca/tlsca.nitwarangal.nitw.edu-cert.pem" ]; then
        NITW_TLSCA=$(cat "${ORGS_DIR}/nitwarangal.nitw.edu/tlsca/tlsca.nitwarangal.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    if [ -f "${ORGS_DIR}/departments.nitw.edu/tlsca/tlsca.departments.nitw.edu-cert.pem" ]; then
        DEPT_TLSCA=$(cat "${ORGS_DIR}/departments.nitw.edu/tlsca/tlsca.departments.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    if [ -f "${ORGS_DIR}/verifiers.nitw.edu/tlsca/tlsca.verifiers.nitw.edu-cert.pem" ]; then
        VERI_TLSCA=$(cat "${ORGS_DIR}/verifiers.nitw.edu/tlsca/tlsca.verifiers.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi

    # Collect CA certs for all peer orgs (for certificateAuthorities)
    local NITW_CA_CERT=""
    local DEPT_CA_CERT=""
    local VERI_CA_CERT=""

    if [ -f "${ORGS_DIR}/nitwarangal.nitw.edu/ca/ca.nitwarangal.nitw.edu-cert.pem" ]; then
        NITW_CA_CERT=$(cat "${ORGS_DIR}/nitwarangal.nitw.edu/ca/ca.nitwarangal.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    if [ -f "${ORGS_DIR}/departments.nitw.edu/ca/ca.departments.nitw.edu-cert.pem" ]; then
        DEPT_CA_CERT=$(cat "${ORGS_DIR}/departments.nitw.edu/ca/ca.departments.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    if [ -f "${ORGS_DIR}/verifiers.nitw.edu/ca/ca.verifiers.nitw.edu-cert.pem" ]; then
        VERI_CA_CERT=$(cat "${ORGS_DIR}/verifiers.nitw.edu/ca/ca.verifiers.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi

    # Use env vars or fallback to localhost
    local _NITWARANGAL_HOST="${NITWARANGAL_HOST:-localhost}"
    local _DEPARTMENTS_HOST="${DEPARTMENTS_HOST:-localhost}"
    local _VERIFIERS_HOST="${VERIFIERS_HOST:-localhost}"
    local _ORDERER_HOST="${ORDERER_HOST:-localhost}"
    local _NITWARANGAL_PEER_PORT="${NITWARANGAL_PEER_PORT:-7051}"
    local _DEPARTMENTS_PEER_PORT="${DEPARTMENTS_PEER_PORT:-9051}"
    local _VERIFIERS_PEER_PORT="${VERIFIERS_PEER_PORT:-11051}"
    local _ORDERER_PORT="${ORDERER_PORT:-7050}"
    local _NITWARANGAL_CA_PORT="${NITWARANGAL_CA_PORT:-8054}"
    local _DEPARTMENTS_CA_PORT="${DEPARTMENTS_CA_PORT:-9054}"
    local _VERIFIERS_CA_PORT="${VERIFIERS_CA_PORT:-11054}"

    # Orderer TLS cert
    local ORDERER_TLSCA=""
    if [ -f "organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem" ]; then
        ORDERER_TLSCA=$(cat "organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    
    # ────────────────────────────────────────────────────────────
    # Build the connection profile JSON with ALL organizations,
    # ALL peers, ALL CAs, and the orderer.
    # This enables:
    #   - Service Discovery across all peers
    #   - Multi-org endorsement (MAJORITY policy)
    #   - Cross-org verification
    # ────────────────────────────────────────────────────────────
    cat > "${OUTPUT_FILE}" <<EOF
{
    "name": "${ORG_NAME}-network",
    "version": "1.0.0",
    "client": {
        "organization": "${ORG_MSP}",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "academic-records-channel": {
            "orderers": ["orderer.nitw.edu"],
            "peers": {
                "peer0.nitwarangal.nitw.edu": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer0.departments.nitw.edu": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer0.verifiers.nitw.edu": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "NITWarangalMSP": {
            "mspid": "NITWarangalMSP",
            "peers": ["peer0.nitwarangal.nitw.edu"],
            "certificateAuthorities": ["ca.nitwarangal.nitw.edu"]
        },
        "DepartmentsMSP": {
            "mspid": "DepartmentsMSP",
            "peers": ["peer0.departments.nitw.edu"],
            "certificateAuthorities": ["ca.departments.nitw.edu"]
        },
        "VerifiersMSP": {
            "mspid": "VerifiersMSP",
            "peers": ["peer0.verifiers.nitw.edu"],
            "certificateAuthorities": ["ca.verifiers.nitw.edu"]
        }
    },
    "orderers": {
        "orderer.nitw.edu": {
            "url": "grpcs://${_ORDERER_HOST}:${_ORDERER_PORT}",
            "tlsCACerts": {
                "pem": "${ORDERER_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "orderer.nitw.edu",
                "hostnameOverride": "orderer.nitw.edu"
            }
        }
    },
    "peers": {
        "peer0.nitwarangal.nitw.edu": {
            "url": "grpcs://${_NITWARANGAL_HOST}:${_NITWARANGAL_PEER_PORT}",
            "tlsCACerts": {
                "pem": "${NITW_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.nitwarangal.nitw.edu",
                "hostnameOverride": "peer0.nitwarangal.nitw.edu"
            }
        },
        "peer0.departments.nitw.edu": {
            "url": "grpcs://${_DEPARTMENTS_HOST}:${_DEPARTMENTS_PEER_PORT}",
            "tlsCACerts": {
                "pem": "${DEPT_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.departments.nitw.edu",
                "hostnameOverride": "peer0.departments.nitw.edu"
            }
        },
        "peer0.verifiers.nitw.edu": {
            "url": "grpcs://${_VERIFIERS_HOST}:${_VERIFIERS_PEER_PORT}",
            "tlsCACerts": {
                "pem": "${VERI_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.verifiers.nitw.edu",
                "hostnameOverride": "peer0.verifiers.nitw.edu"
            }
        }
    },
    "certificateAuthorities": {
        "ca.nitwarangal.nitw.edu": {
            "url": "https://${_NITWARANGAL_HOST}:${_NITWARANGAL_CA_PORT}",
            "caName": "ca-nitwarangal",
            "tlsCACerts": {
                "pem": ["${NITW_CA_CERT}"]
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.departments.nitw.edu": {
            "url": "https://${_DEPARTMENTS_HOST}:${_DEPARTMENTS_CA_PORT}",
            "caName": "ca-departments",
            "tlsCACerts": {
                "pem": ["${DEPT_CA_CERT}"]
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.verifiers.nitw.edu": {
            "url": "https://${_VERIFIERS_HOST}:${_VERIFIERS_CA_PORT}",
            "caName": "ca-verifiers",
            "tlsCACerts": {
                "pem": ["${VERI_CA_CERT}"]
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
EOF
    
    echo "✅ Created: ${OUTPUT_FILE}"
}

# Generate connection profiles for each organization
# Format: generate_connection_profile ORG_NAME ORG_DOMAIN ORG_MSP PEER_HOST PEER_PORT CA_HOST CA_PORT

generate_connection_profile \
    "nitwarangal" \
    "nitwarangal.nitw.edu" \
    "NITWarangalMSP" \
    "${NITWARANGAL_HOST:-localhost}" \
    "${NITWARANGAL_PEER_PORT:-7051}" \
    "${NITWARANGAL_HOST:-localhost}" \
    "${NITWARANGAL_CA_PORT:-8054}"

generate_connection_profile \
    "departments" \
    "departments.nitw.edu" \
    "DepartmentsMSP" \
    "${DEPARTMENTS_HOST:-localhost}" \
    "${DEPARTMENTS_PEER_PORT:-9051}" \
    "${DEPARTMENTS_HOST:-localhost}" \
    "${DEPARTMENTS_CA_PORT:-9054}"

generate_connection_profile \
    "verifiers" \
    "verifiers.nitw.edu" \
    "VerifiersMSP" \
    "${VERIFIERS_HOST:-localhost}" \
    "${VERIFIERS_PEER_PORT:-11051}" \
    "${VERIFIERS_HOST:-localhost}" \
    "${VERIFIERS_CA_PORT:-11054}"

echo ""
echo "======================================================"
echo "✅ All connection profiles generated successfully!"
echo "======================================================"
echo ""
echo "Connection profiles created:"
echo "  - ${ORGS_DIR}/nitwarangal.nitw.edu/connection-nitwarangal.json"
echo "  - ${ORGS_DIR}/departments.nitw.edu/connection-departments.json"
echo "  - ${ORGS_DIR}/verifiers.nitw.edu/connection-verifiers.json"
echo ""
echo "Each profile includes ALL organizations for:"
echo "  📋 Multi-org endorsement (peers as endorsers)"
echo "  🔍 Service discovery across all peers"
echo "  ✅ Cross-org verification"
echo ""
