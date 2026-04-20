13-Node Deployment & Connection Guide

Before starting, the env.sh file is our source of truth for all IP addresses.

Step 1: Setup Environment (Everyone)
Bhargav, Atul, Vindhya, Aditi, Sejal, Shyamashree, Shreya, Manasvi, Saim, Amit, Mousumi, Aakash:
First, download the latest updates: git pull
Next, go to the blockchain folder: cd Academic_RecordsBlockchain
Then run: source ./env.sh
And run: ./update-hosts.sh

Step 2: Start Orderers (Consensus Nodes)
Bhargav (Primary Orderer): Run docker-compose -f docker/docker-compose-orderer1.yaml up -d
Atul (Raft Follower 1): Run docker-compose -f docker/docker-compose-orderer2.yaml up -d
Vindhya (Raft Follower 2): Run docker-compose -f docker/docker-compose-orderer3.yaml up -d

Step 3: Start Peers and Backend Servers
Aditi (Admin): Run `docker-compose -f docker/docker-compose-nitwarangal-peer0.yaml up -d` then `./recover-peer.sh peer0.nitwarangal.nitw.edu NITWarangalMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Sejal (ExamSection): Run `docker-compose -f docker/docker-compose-nitwarangal-peer1.yaml up -d` then `./recover-peer.sh peer1.nitwarangal.nitw.edu NITWarangalMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Shyamashree (Dean): Run `docker-compose -f docker/docker-compose-nitwarangal-peer2.yaml up -d` then `./recover-peer.sh peer2.nitwarangal.nitw.edu NITWarangalMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Shreya (CSE HOD): Run `docker-compose -f docker/docker-compose-depts-cse.yaml up -d` then `./recover-peer.sh peer0.cse.departments.nitw.edu DepartmentsMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Manasvi (CSE Faculty): Run `docker-compose -f docker/docker-compose-depts-cse-faculty.yaml up -d` then `./recover-peer.sh peer1.cse.departments.nitw.edu DepartmentsMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Saim (ECE HOD): Run `docker-compose -f docker/docker-compose-depts-ece.yaml up -d` then `./recover-peer.sh peer0.ece.departments.nitw.edu DepartmentsMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Amit (ECE Faculty): Run `docker-compose -f docker/docker-compose-depts-ece-faculty.yaml up -d` then `./recover-peer.sh peer1.ece.departments.nitw.edu DepartmentsMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Mousumi (Verifier 1): Run `docker-compose -f docker/docker-compose-verifiers-peer0.yaml up -d` then `./recover-peer.sh peer0.verifiers.nitw.edu VerifiersMSP` then `cd Academic-Records-Blockchain-Backend && npm start`
Aakash (Verifier 2): Run `docker-compose -f docker/docker-compose-verifiers-peer1.yaml up -d` then `./recover-peer.sh peer1.verifiers.nitw.edu VerifiersMSP` then `cd Academic-Records-Blockchain-Backend && npm start`

Step 4: Deploy Chaincode (Only if updating to new version)
Aditi: Run ./scripts/remote-upgrade-v4.sh

Step 5: Start Frontend Portal
Students / General Users: cd Academic-Records-Blockchain-Backend and run npm start, then cd ../Academic-Records-Blockchain-Frontend and run npm run start -- --host 0.0.0.0

Troubleshooting:
If you see "access denied", run: export NODE_TLS_REJECT_UNAUTHORIZED='0'
