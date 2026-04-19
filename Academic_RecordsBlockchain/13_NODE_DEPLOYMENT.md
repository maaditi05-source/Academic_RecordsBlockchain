13-Node Deployment & Connection Guide

Before starting, the env.sh file is our source of truth for all IP addresses.

Step 1: Setup Environment (Everyone)
Bhargav, Atul, Vindhya, Aditi, Sejal, Shyamashree, Shreya, Manasvi, Saim, Amit, Mousumi, Aakash:
First, download the latest updates: git pull
Next, run: source ./env.sh
Then run: ./update-hosts.sh

Step 2: Start Orderers (Consensus Nodes)
Bhargav (Primary Orderer): Run ./recover-peer.sh
Atul (Raft Follower 1): Run ./recover-peer.sh
Vindhya (Raft Follower 2): Run ./recover-peer.sh

Step 3: Start Peers and Backend Servers
Aditi (Admin): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Sejal (ExamSection): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Shyamashree (Dean): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Shreya (CSE HOD): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Manasvi (CSE Faculty): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Saim (ECE HOD): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Amit (ECE Faculty): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Mousumi (Verifier 1): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start
Aakash (Verifier 2): Run ./recover-peer.sh, then cd Academic-Records-Blockchain-Backend and run npm start

Step 4: Deploy Chaincode (Only if updating to new version)
Aditi: Run ./remote-upgrade-v4.sh

Step 5: Start Frontend Portal
Students / General Users: cd Academic-Records-Blockchain-Backend and run npm start, then cd ../Academic-Records-Blockchain-Frontend and run npm run start -- --host 0.0.0.0

Troubleshooting:
If you see "access denied", run: export NODE_TLS_REJECT_UNAUTHORIZED='0'
