#!/bin/bash

# shellcheck disable=SC2086

. scripts/utils.sh

# registerEnroll.sh
#
# This script brings up a Fabric CA and uses it to register and enroll identities.
# It also creates the organization MSP folders and copies the CA certificates into them.

function createNITWarangal() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/nitwarangal.nitw.edu/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/

  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-nitwarangal --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-nitwarangal.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-nitwarangal.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-nitwarangal.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-nitwarangal.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/config.yaml"

  for idx in 0 1 2; do
      infoln "Registering peer${idx}"
      fabric-ca-client register --caname ca-nitwarangal --id.name peer${idx} --id.secret peer${idx}pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

      infoln "Generating the peer${idx} msp"
      fabric-ca-client enroll -u https://peer${idx}:peer${idx}pw@localhost:8054 --caname ca-nitwarangal -M "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/msp" --csr.hosts peer${idx}.nitwarangal.nitw.edu --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/msp/config.yaml"

      infoln "Generating the peer${idx}-tls certificates"
      fabric-ca-client enroll -u https://peer${idx}:peer${idx}pw@localhost:8054 --caname ca-nitwarangal -M "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls" --enrollment.profile tls --csr.hosts peer${idx}.nitwarangal.nitw.edu --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/ca.crt"
      cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/server.crt"
      cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/keystore/"* "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/peers/peer${idx}.nitwarangal.nitw.edu/tls/server.key"
  done

  infoln "Registering user"
  fabric-ca-client register --caname ca-nitwarangal --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

  infoln "Registering the org admin"
  fabric-ca-client register --caname ca-nitwarangal --id.name nitwarangaladmin --id.secret nitwarangaladminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

  # Register dean and registrar with specific roles
  infoln "Registering dean and registrar"
  fabric-ca-client register --caname ca-nitwarangal --id.name dean --id.secret deanpw --id.type client --id.attrs '"role=dean:ecert"' --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"
  fabric-ca-client register --caname ca-nitwarangal --id.name registrar --id.secret registrarpw --id.type client --id.attrs '"role=registrar:ecert"' --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"

  infoln "Generating the user msp"
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-nitwarangal -M "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/User1@nitwarangal.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/User1@nitwarangal.nitw.edu/msp/config.yaml"

  infoln "Generating the org admin msp"
  fabric-ca-client enroll -u https://nitwarangaladmin:nitwarangaladminpw@localhost:8054 --caname ca-nitwarangal -M "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/users/Admin@nitwarangal.nitw.edu/msp/config.yaml"

  # Copy the CA cert to the organization MSP
  mkdir -p "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/msp/tlscacerts/ca.crt"

  mkdir -p "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/tlsca"
  cp "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/tlsca/tlsca.nitwarangal.nitw.edu-cert.pem"

  mkdir -p "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/ca"
  cp "${PWD}/organizations/fabric-ca/nitwarangal/ca-cert.pem" "${PWD}/organizations/peerOrganizations/nitwarangal.nitw.edu/ca/ca.nitwarangal.nitw.edu-cert.pem"
}

function createDepartments() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/departments.nitw.edu/
  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/departments.nitw.edu/
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-departments --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-departments.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-departments.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-departments.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-departments.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/config.yaml"

  # We need: peer0.cse, peer1.cse, peer0.ece, peer1.ece
  for PEER_HOST in "peer0.cse" "peer1.cse" "peer0.ece" "peer1.ece"; do
      # Make a safe username from the host (e.g., peer0_cse)
      PEER_USER=$(echo $PEER_HOST | tr '.' '_')
      
      infoln "Registering ${PEER_HOST}"
      fabric-ca-client register --caname ca-departments --id.name ${PEER_USER} --id.secret ${PEER_USER}pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

      infoln "Generating the ${PEER_HOST} msp"
      fabric-ca-client enroll -u https://${PEER_USER}:${PEER_USER}pw@localhost:9054 --caname ca-departments -M "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/msp" --csr.hosts ${PEER_HOST}.departments.nitw.edu --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/msp/config.yaml"

      infoln "Generating the ${PEER_HOST}-tls certificates"
      fabric-ca-client enroll -u https://${PEER_USER}:${PEER_USER}pw@localhost:9054 --caname ca-departments -M "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls" --enrollment.profile tls --csr.hosts ${PEER_HOST}.departments.nitw.edu --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/ca.crt"
      cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/server.crt"
      cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/keystore/"* "${PWD}/organizations/peerOrganizations/departments.nitw.edu/peers/${PEER_HOST}.departments.nitw.edu/tls/server.key"
  done

  infoln "Registering user"
  fabric-ca-client register --caname ca-departments --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

  infoln "Registering the org admin"
  fabric-ca-client register --caname ca-departments --id.name departmentsadmin --id.secret departmentsadminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

  # Register a user with a department attribute
  infoln "Registering cse_user"
  fabric-ca-client register --caname ca-departments --id.name cse_user --id.secret cse_userpw --id.type client --id.attrs '"department=CSE:ecert"' --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"

  infoln "Generating the user msp"
  fabric-ca-client enroll -u https://user1:user1pw@localhost:9054 --caname ca-departments -M "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/User1@departments.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/User1@departments.nitw.edu/msp/config.yaml"

  infoln "Generating the org admin msp"
  fabric-ca-client enroll -u https://departmentsadmin:departmentsadminpw@localhost:9054 --caname ca-departments -M "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/Admin@departments.nitw.edu/msp/config.yaml"

  # Enroll cse_user with department attribute
  infoln "Generating the cse_user msp"
  fabric-ca-client enroll -u https://cse_user:cse_userpw@localhost:9054 --caname ca-departments -M "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/cse_user@departments.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/departments/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/users/cse_user@departments.nitw.edu/msp/config.yaml"

  # Copy the CA cert to the organization MSP
  mkdir -p "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/departments/ca-cert.pem" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/msp/tlscacerts/ca.crt"
  mkdir -p "${PWD}/organizations/peerOrganizations/departments.nitw.edu/tlsca"
  cp "${PWD}/organizations/fabric-ca/departments/ca-cert.pem" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/tlsca/tlsca.departments.nitw.edu-cert.pem"
  mkdir -p "${PWD}/organizations/peerOrganizations/departments.nitw.edu/ca"
  cp "${PWD}/organizations/fabric-ca/departments/ca-cert.pem" "${PWD}/organizations/peerOrganizations/departments.nitw.edu/ca/ca.departments.nitw.edu-cert.pem"
}

function createVerifiers() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/verifiers.nitw.edu/
  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/
  fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-verifiers --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-verifiers.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-verifiers.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-verifiers.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-verifiers.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/config.yaml"

  for idx in 0 1; do
      infoln "Registering peer${idx}"
      fabric-ca-client register --caname ca-verifiers --id.name peer${idx} --id.secret peer${idx}pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

      infoln "Generating the peer${idx} msp"
      fabric-ca-client enroll -u https://peer${idx}:peer${idx}pw@localhost:11054 --caname ca-verifiers -M "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/msp" --csr.hosts peer${idx}.verifiers.nitw.edu --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/msp/config.yaml"

      infoln "Generating the peer${idx}-tls certificates"
      fabric-ca-client enroll -u https://peer${idx}:peer${idx}pw@localhost:11054 --caname ca-verifiers -M "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls" --enrollment.profile tls --csr.hosts peer${idx}.verifiers.nitw.edu --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

      cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/ca.crt"
      cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/server.crt"
      cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/keystore/"* "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/peers/peer${idx}.verifiers.nitw.edu/tls/server.key"
  done

  infoln "Registering user"
  fabric-ca-client register --caname ca-verifiers --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

  infoln "Registering the org admin"
  fabric-ca-client register --caname ca-verifiers --id.name verifiersadmin --id.secret verifiersadminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"

  infoln "Generating the user msp"
  fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-verifiers -M "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/users/User1@verifiers.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/users/User1@verifiers.nitw.edu/msp/config.yaml"

  infoln "Generating the org admin msp"
  fabric-ca-client enroll -u https://verifiersadmin:verifiersadminpw@localhost:11054 --caname ca-verifiers -M "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem"
  cp "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/config.yaml" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/users/Admin@verifiers.nitw.edu/msp/config.yaml"

  # Copy the CA cert to the organization MSP
  mkdir -p "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/msp/tlscacerts/ca.crt"
  mkdir -p "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/tlsca"
  cp "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/tlsca/tlsca.verifiers.nitw.edu-cert.pem"
  mkdir -p "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/ca"
  cp "${PWD}/organizations/fabric-ca/verifiers/ca-cert.pem" "${PWD}/organizations/peerOrganizations/verifiers.nitw.edu/ca/ca.verifiers.nitw.edu-cert.pem"
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/nitw.edu
  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/nitw.edu
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/nitw.edu/msp/config.yaml"

  for idx in 1 2 3; do
      infoln "Registering orderer${idx}"
      fabric-ca-client register --caname ca-orderer --id.name orderer${idx} --id.secret orderer${idx}pw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

      infoln "Generating the orderer${idx} msp"
      fabric-ca-client enroll -u https://orderer${idx}:orderer${idx}pw@localhost:7054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/msp" --csr.hosts orderer${idx}.nitw.edu --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

      cp "${PWD}/organizations/ordererOrganizations/nitw.edu/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/msp/config.yaml"

      infoln "Generating the orderer${idx}-tls certificates"
      fabric-ca-client enroll -u https://orderer${idx}:orderer${idx}pw@localhost:7054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls" --enrollment.profile tls --csr.hosts orderer${idx}.nitw.edu --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

      cp "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/ca.crt"
      cp "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/server.crt"
      cp "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/nitw.edu/orderers/orderer${idx}.nitw.edu/tls/server.key"
  done

  infoln "Registering the orderer admin"
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

  infoln "Generating the admin msp"
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:7054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/nitw.edu/users/Admin@nitw.edu/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"

  cp "${PWD}/organizations/ordererOrganizations/nitw.edu/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/nitw.edu/users/Admin@nitw.edu/msp/config.yaml"

  # Copy the CA cert to the organization MSP
  mkdir -p "${PWD}/organizations/ordererOrganizations/nitw.edu/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/nitw.edu/msp/tlscacerts/tlsca.nitw.edu-cert.pem"

  mkdir -p "${PWD}/organizations/ordererOrganizations/nitw.edu/tlsca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/nitw.edu/tlsca/tlsca.nitw.edu-cert.pem"
}

# Main execution - Call all the functions to create identities
infoln "Creating Orderer Org Identities"
createOrderer

infoln "Creating NITWarangal Org Identities"
createNITWarangal

infoln "Creating Departments Org Identities"
createDepartments

infoln "Creating Verifiers Org Identities"
createVerifiers
