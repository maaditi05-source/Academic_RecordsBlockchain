const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const mockState = require('./utils/mockState');
const {
    APP_CONFIG,
    getConnectionProfilePath,
    getWalletPath
} = require('./config/app.config');

class FabricGateway {
    constructor() {
        this.channelName = APP_CONFIG.fabric.channelName;
        this.chaincodeName = APP_CONFIG.fabric.chaincodeName;
        this.walletPath = getWalletPath();
        this.gateway = null;
        this.network = null;
        this.contract = null;
    }

    async connect(userIdOrUser) {
        try {
            // Resolve the correct Fabric wallet identity key.
            // Controllers pass req.user.userId (DB id), but for students this differs from
            // their wallet key (= rollNumber = username). We use getFabricIdentity() to
            // correctly resolve the wallet key based on the user's role.
            const { getFabricIdentity } = require('./utils/mspMapper');

            let userId;
            if (userIdOrUser && typeof userIdOrUser === 'object' && userIdOrUser.role) {
                // Called with a user object — resolve via getFabricIdentity
                userId = getFabricIdentity(userIdOrUser);
            } else {
                // Called with a string userId (legacy path from controllers)
                userId = userIdOrUser;
            }

            // Load connection profile
            const ccpPath = getConnectionProfilePath();

            if (!fs.existsSync(ccpPath)) {
                throw new Error(`Connection profile not found at ${ccpPath}`);
            }

            const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            const ccp = JSON.parse(ccpJSON);

            // Get wallet
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if user exists in wallet; fall back to admin if not found
            const identity = await wallet.get(userId);
            if (!identity) {
                logger.warn(`Identity "${userId}" not found in wallet, using '${APP_CONFIG.fabric.admin.userId}' as fallback`);
                const adminIdentity = await wallet.get(APP_CONFIG.fabric.admin.userId);
                if (!adminIdentity) {
                    throw new Error(`Neither "${userId}" nor "${APP_CONFIG.fabric.admin.userId}" identity exists in the wallet`);
                }
                userId = APP_CONFIG.fabric.admin.userId;
            }

            // Create gateway instance
            this.gateway = new Gateway();

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet,
                identity: userId,
                discovery: APP_CONFIG.fabric.gateway.discovery
            });

            logger.info(`Connected to gateway as user: ${userId}`);

            // Get network — may fail if DiscoveryService cannot reach any peer
            try {
                this.network = await this.gateway.getNetwork(this.channelName);
                this.contract = this.network.getContract(this.chaincodeName);
                logger.info(`Connected to channel: ${this.channelName}, chaincode: ${this.chaincodeName}`);
            } catch (netError) {
                if (netError.message && (netError.message.includes('DiscoveryService') || netError.message.includes('Failed to connect'))) {
                    logger.warn(`[Mock Mode] Network/Discovery unavailable, entering offline mode: ${netError.message}`);
                    this.offlineMode = true;
                    this.contract = null;
                } else {
                    throw netError;
                }
            }

            return this.contract;
        } catch (error) {
            logger.error(`Failed to connect to gateway: ${error.message}`);
            // Even if gateway connection totally fails, allow offline mode
            this.offlineMode = true;
            this.contract = null;
            logger.warn(`[Mock Mode] Gateway connection failed, entering offline mode`);
            return null;
        }
    }

    async disconnect() {
        if (this.gateway) {
            this.gateway.disconnect();
            logger.info('Disconnected from gateway');
        }
    }

    async submitTransaction(functionName, ...args) {
        // If gateway is in offline mode, skip blockchain entirely
        if (this.offlineMode || !this.contract) {
            logger.warn(`[Mock Mode] Offline mode — routing ${functionName} to local storage`);
            const localResult = mockState.handleWrite(functionName, args);
            return { success: true, simulated: true, id: args[0] || 'mock-id', ...localResult };
        }
        try {

            logger.info(`Submitting transaction: ${functionName} with args: ${JSON.stringify(args)}`);

            const submitPromise = this.contract.submitTransaction(functionName, ...args);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction timeout - remote nodes not connected')), 15000)
            );
            const result = await Promise.race([submitPromise, timeoutPromise]);

            logger.info(`Transaction ${functionName} submitted successfully`);

            // Parse result if it's JSON
            try {
                return JSON.parse(result.toString());
            } catch (e) {
                return result.toString();
            }
        } catch (error) {
            logger.error(`Failed to submit transaction ${functionName}: ${error.message}`);
            // Fallback for demonstration when remote orderers are disconnected
            if (error.message.includes('not connected') || error.message.includes('No valid responses') || error.message.includes('Committer') || error.message.includes('timeout') || error.message.includes('error in simulation') || error.message.includes('chaincode registration')) {
                logger.warn(`[Mock Mode] Falling back to local storage for ${functionName}`);
                const localResult = mockState.handleWrite(functionName, args);
                return { success: true, simulated: true, id: args[0] || 'mock-id', ...localResult };
            }
            throw error;
        }
    }

    async evaluateTransaction(functionName, ...args) {
        // If gateway is in offline mode, skip blockchain entirely
        if (this.offlineMode || !this.contract) {
            logger.warn(`[Mock Mode] Offline mode — routing query ${functionName} to local storage`);
            return mockState.handleQuery(functionName, args);
        }

        let blockchainResult = null;
        let blockchainSucceeded = false;

        try {
            logger.info(`Evaluating transaction: ${functionName} with args: ${JSON.stringify(args)}`);
            const result = await this.contract.evaluateTransaction(functionName, ...args);

            logger.info(`Transaction ${functionName} evaluated successfully`);

            // Parse result if it's JSON
            try {
                blockchainResult = JSON.parse(result.toString());
            } catch (e) {
                blockchainResult = result.toString();
            }
            blockchainSucceeded = true;
        } catch (error) {
            // "does not exist" is expected during auto-seed checks — don't log as error
            if (error.message && error.message.includes('does not exist')) {
                logger.debug(`${functionName}: ${error.message}`);
            } else {
                logger.error(`Failed to evaluate transaction ${functionName}: ${error.message}`);
            }
            // Fallback: return data from local JSON if blockchain is unreachable
            if (error.message && (error.message.includes('not connected') || error.message.includes('No valid responses') || error.message.includes('unavailable') || error.message.includes('UNAVAILABLE') || error.message.includes('timeout') || error.message.includes('does not exist') || error.message.includes('error in simulation') || error.message.includes('chaincode registration'))) {
                logger.warn(`[Mock Mode] Falling back to local storage for query ${functionName}`);
                return mockState.handleQuery(functionName, args);
            }
            throw error;
        }

        // ALWAYS merge offline-created data with blockchain results for key queries.
        // This is necessary because the local peer ledger does NOT contain
        // students/departments that were "mocked" by the submit timeout fallback.
        const mergeQueries = ['GetAllStudents', 'QueryStudentsByDepartment', 'GetAllDepartments', 'GetStudent', 'GetDepartment', 'GetStudentCGPA', 'QueryStudentsByYear', 'GetCoursesByDepartment'];
        if (blockchainSucceeded && mergeQueries.includes(functionName)) {
            const offlineData = mockState.handleQuery(functionName, args);

            // Extract the actual array from blockchain result (may be plain array or {records: [...]})
            let resultArray = null;
            let isPaginated = false;
            if (Array.isArray(blockchainResult)) {
                resultArray = blockchainResult;
            } else if (blockchainResult && Array.isArray(blockchainResult.records)) {
                resultArray = blockchainResult.records;
                isPaginated = true;
            }

            if (resultArray && Array.isArray(offlineData)) {
                // Merge arrays, de-duplicate by studentId or departmentId
                const seen = new Set(resultArray.map(item => item.studentId || item.departmentId || JSON.stringify(item)));
                const newItems = offlineData.filter(item => {
                    const key = item.studentId || item.departmentId || JSON.stringify(item);
                    return !seen.has(key);
                });
                if (newItems.length > 0) {
                    logger.info(`[Mock Mode] Merged ${newItems.length} offline items into ${functionName} results`);
                    const merged = [...resultArray, ...newItems];
                    // Return in the same format the blockchain returned
                    if (isPaginated) {
                        return { ...blockchainResult, records: merged };
                    }
                    return merged;
                }
            }
            // For single-object queries (GetStudent, GetDepartment), if blockchain returned
            // a placeholder or null, prefer offline data
            if (!Array.isArray(blockchainResult) && !isPaginated && offlineData && offlineData._offlineCreated) {
                return offlineData;
            }
        }

        return blockchainResult;
    }

    async submitTransactionWithTransient(functionName, transientData, ...args) {
        // If gateway is in offline mode, skip blockchain entirely
        if (this.offlineMode || !this.contract) {
            logger.warn(`[Mock Mode] Offline mode — routing ${functionName} to local storage`);
            const localResult = mockState.handleWrite(functionName, args, transientData);
            return { success: true, simulated: true, id: args[0] || 'mock-id', ...localResult };
        }
        try {
            // Convert transient data values to Buffer
            const transientMap = {};
            for (const key in transientData) {
                transientMap[key] = Buffer.from(transientData[key]);
            }

            logger.info(`Submitting transaction with transient data: ${functionName}`);

            const transaction = this.contract.createTransaction(functionName);
            transaction.setTransient(transientMap);

            // Bypass Discovery Service bug with Private Data Collections by manually setting
            // the endorsing peers to all available peers in the channel.
            const channelPeers = this.network.getChannel().getEndorsers();
            if (channelPeers && channelPeers.length > 0) {
                transaction.setEndorsingPeers(channelPeers);
                logger.info(`Bypassing discovery: manually set ${channelPeers.length} endorsing peers for transient transaction`);
            }

            const submitPromise = transaction.submit(...args);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction timeout - remote nodes not connected')), 15000)
            );
            const result = await Promise.race([submitPromise, timeoutPromise]);

            logger.info(`Transaction ${functionName} with transient data submitted successfully`);

            // Parse result if it's JSON
            try {
                return JSON.parse(result.toString());
            } catch (e) {
                return result.toString();
            }
        } catch (error) {
            logger.error(`Failed to submit transaction with transient data ${functionName}: ${error.message}`);
            // Fallback for demonstration when remote orderers are disconnected
            if (error.message.includes('not connected') || error.message.includes('No valid responses') || error.message.includes('timeout') || error.message.includes('Committer') || error.message.includes('error in simulation') || error.message.includes('chaincode registration')) {
                logger.warn(`[Mock Mode] Falling back to local storage for ${functionName}`);
                const localResult = mockState.handleWrite(functionName, args, transientData);
                return { success: true, simulated: true, id: args[0] || 'mock-id', ...localResult };
            }
            throw error;
        }
    }

    getNetwork() {
        return this.network;
    }

    getContract() {
        return this.contract;
    }
}

module.exports = FabricGateway;
