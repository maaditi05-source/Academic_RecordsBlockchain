#!/bin/bash
# =================================================================
#  Generate Connection Profiles for All Organizations
#  Purpose: Create connection profile JSON files for SDK clients
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

generate_connection_profile() {
    local ORG_NAME=$1
    local ORG_DOMAIN=$2
    local ORG_MSP=$3
    
    echo "Generating connection profile for ${ORG_NAME}..."
    
    local ORG_DIR="${ORGS_DIR}/${ORG_DOMAIN}"
    local OUTPUT_FILE="${ORG_DIR}/connection-${ORG_NAME}.json"
    
    # Collect TLS certs for ALL peer orgs
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

    # Collect CA certs
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

    # Variables for anchor peers
    local _NITW_HOST="${NITW_PEER0_HOST:-localhost}"
    local _DEPT_HOST="${DEPT_CSE_HOD_HOST:-localhost}"
    local _VERI_HOST="${VERI_PEER0_HOST:-localhost}"
    local _ORDERER_HOST="${ORDERER1_HOST:-localhost}"

    local _NITW_PORT="${NITW_PEER0_PORT:-7051}"
    local _DEPT_PORT="${DEPT_CSE_HOD_PORT:-9051}"
    local _VERI_PORT="${VERI_PEER0_PORT:-11051}"
    local _ORDERER_PORT="${ORDERER1_PORT:-7050}"

    local _NITW_CA_PORT="${NITW_CA_PORT:-8054}"
    local _DEPT_CA_PORT="${DEPT_CA_PORT:-9054}"
    local _VERI_CA_PORT="${VERI_CA_PORT:-11054}"

    local ORDERER_TLSCA=""
    if [ -f "organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem" ]; then
        ORDERER_TLSCA=$(cat "organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem" | sed 's/$/\\n/' | tr -d '\n')
    fi
    
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
            "orderers": ["orderer1.nitw.edu"],
            "peers": {
                "peer0.nitwarangal.nitw.edu": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer0.cse.departments.nitw.edu": {
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
            "peers": ["peer0.cse.departments.nitw.edu"],
            "certificateAuthorities": ["ca.departments.nitw.edu"]
        },
        "VerifiersMSP": {
            "mspid": "VerifiersMSP",
            "peers": ["peer0.verifiers.nitw.edu"],
            "certificateAuthorities": ["ca.verifiers.nitw.edu"]
        }
    },
    "orderers": {
        "orderer1.nitw.edu": {
            "url": "grpcs://${_ORDERER_HOST}:${_ORDERER_PORT}",
            "tlsCACerts": {
                "pem": "${ORDERER_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "orderer1.nitw.edu",
                "hostnameOverride": "orderer1.nitw.edu"
            }
        }
    },
    "peers": {
        "peer0.nitwarangal.nitw.edu": {
            "url": "grpcs://${_NITW_HOST}:${_NITW_PORT}",
            "tlsCACerts": {
                "pem": "${NITW_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.nitwarangal.nitw.edu",
                "hostnameOverride": "peer0.nitwarangal.nitw.edu"
            }
        },
        "peer0.cse.departments.nitw.edu": {
            "url": "grpcs://${_DEPT_HOST}:${_DEPT_PORT}",
            "tlsCACerts": {
                "pem": "${DEPT_TLSCA}"
            },
            "grpcOptions": {
                "ssl-target-name-override": "peer0.cse.departments.nitw.edu",
                "hostnameOverride": "peer0.cse.departments.nitw.edu"
            }
        },
        "peer0.verifiers.nitw.edu": {
            "url": "grpcs://${_VERI_HOST}:${_VERI_PORT}",
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
            "url": "https://${_NITW_HOST}:${_NITW_CA_PORT}",
            "caName": "ca-nitwarangal",
            "tlsCACerts": {
                "pem": ["${NITW_CA_CERT}"]
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.departments.nitw.edu": {
            "url": "https://${_DEPT_HOST}:${_DEPT_CA_PORT}",
            "caName": "ca-departments",
            "tlsCACerts": {
                "pem": ["${DEPT_CA_CERT}"]
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.verifiers.nitw.edu": {
            "url": "https://${_VERI_HOST}:${_VERI_CA_PORT}",
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

generate_connection_profile "nitwarangal" "nitwarangal.nitw.edu" "NITWarangalMSP"
generate_connection_profile "departments" "departments.nitw.edu" "DepartmentsMSP"
generate_connection_profile "verifiers" "verifiers.nitw.edu" "VerifiersMSP"

echo "✅ All connection profiles generated successfully!"
