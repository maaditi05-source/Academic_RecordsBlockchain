const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

class FabricCAClient {
    /**
     * @param {object} options - CA configuration
     * @param {string} options.caUrl       - CA endpoint URL (default: NITWarangal CA)
     * @param {string} options.caName      - CA name as in connection profile
     * @param {string} options.mspId       - MSP ID for enrolled identity
     * @param {string} options.ccpPath     - Path to connection profile JSON
     * @param {string} options.walletPath  - Wallet storage path
     */
    constructor({ caUrl, caName, mspId, ccpPath, walletPath } = {}) {
        this.walletPath = walletPath || path.join(__dirname, '../wallet');
        this.caURL = caUrl || process.env.CA_URL || 'https://localhost:8054';
        this.caName = caName || process.env.CA_NAME || 'ca-nitwarangal';
        this.mspId = mspId || process.env.MSP_ID || 'NITWarangalMSP';
        this.ccpPath = ccpPath || process.env.CONNECTION_PROFILE_PATH;
    }

    /**
     * Return a FabricCAClient pre-configured for the given user role.
     * - admin / student  → NITWarangalMSP CA (port 8054)
     * - department       → DepartmentsMSP CA (port 9054)
     * - verifier         → VerifiersMSP CA (port 11054)
     */
    static getCAClientForRole(role) {
        const walletPath = path.join(__dirname, '../wallet');
        // Define the base path for organizations relative to the current file
        // Assuming fabricCAClient.js is in 'src/utils', then '../../' points to the project root.
        // So, '../../Academic_RecordsBlockchain/organizations' would be the correct relative path.
        const baseOrgsPath = path.resolve(__dirname, '../../Academic_RecordsBlockchain/organizations');

        switch (role) {
            case 'department':
                return new FabricCAClient({
                    caUrl: 'https://localhost:9054',
                    caName: 'ca.departments.nitw.edu',
                    mspId: 'DepartmentsMSP',
                    ccpPath: path.join(baseOrgsPath, 'peerOrganizations/departments.nitw.edu/connection-departments.json'),
                    walletPath
                });
            case 'verifier':
                return new FabricCAClient({
                    caUrl: 'https://localhost:11054',
                    caName: 'ca.verifiers.nitw.edu',
                    mspId: 'VerifiersMSP',
                    ccpPath: path.join(baseOrgsPath, 'peerOrganizations/verifiers.nitw.edu/connection-verifiers.json'),
                    walletPath
                });
            default: // admin, student
                return new FabricCAClient({
                    caUrl: process.env.CA_URL || 'https://localhost:8054',
                    caName: process.env.CA_NAME || 'ca.nitwarangal.nitw.edu',
                    mspId: process.env.MSP_ID || 'NITWarangalMSP',
                    ccpPath: process.env.CONNECTION_PROFILE_PATH,
                    walletPath
                });
        }
    }

    async getWallet() {
        const wallet = await Wallets.newFileSystemWallet(this.walletPath);
        return wallet;
    }

    async getCaClient() {
        const ccpPath = this.ccpPath;


        if (!fs.existsSync(ccpPath)) {
            throw new Error(`Connection profile not found at ${ccpPath}`);
        }

        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        const caInfo = ccp.certificateAuthorities[this.caName];
        if (!caInfo) {
            throw new Error(`CA "${this.caName}" not found in connection profile`);
        }

        // Handle tlsCACerts.pem as either string or array
        let caTLSCACerts = caInfo.tlsCACerts.pem;
        if (Array.isArray(caTLSCACerts)) {
            caTLSCACerts = caTLSCACerts.join('\n');
        }

        // Create CA client
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false });

        return ca;
    }

    async enrollAdmin(adminUserId = 'admin', adminPassword = 'adminpw') {
        try {
            const wallet = await this.getWallet();

            // Check if admin already enrolled
            const adminIdentity = await wallet.get(adminUserId);
            if (adminIdentity) {
                logger.info(`Admin user "${adminUserId}" already exists in wallet`);
                return { success: true, message: 'Admin already enrolled' };
            }

            // Enroll admin
            const ca = await this.getCaClient();
            const enrollment = await ca.enroll({
                enrollmentID: adminUserId,
                enrollmentSecret: adminPassword
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put(adminUserId, x509Identity);
            logger.info(`Admin user "${adminUserId}" enrolled successfully`);

            return { success: true, message: 'Admin enrolled successfully' };
        } catch (error) {
            logger.error(`Failed to enroll admin: ${error.message}`);
            throw error;
        }
    }

    async registerUser(userId, attributes = {}, role = 'client', affiliation = '', adminUserId = 'admin', adminPassword = 'adminpw') {
        try {
            const wallet = await this.getWallet();

            // Check if user already exists in wallet
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                logger.info(`User "${userId}" already exists in wallet`);
                return { success: true, message: 'User already registered', userId };
            }

            // Get CA client
            const ca = await this.getCaClient();

            // Enroll the CA admin directly using credentials to get a CA-authorized context.
            // We do NOT use the wallet admin identity because it was imported as a peer MSP cert
            // (via importAdmin.js), not as a CA-enrolled identity — using it would cause
            // 'Authorization failure' during ca.register().
            const caAdminEnrollment = await ca.enroll({
                enrollmentID: adminUserId,
                enrollmentSecret: adminPassword
            });

            // Build a proper User instance that fabric-ca-client accepts as a registrar
            const { User } = require('fabric-common');
            const caAdminUser = new User(adminUserId);
            await caAdminUser.setEnrollment(
                caAdminEnrollment.key,
                caAdminEnrollment.certificate,
                this.mspId
            );

            const registerRequest = {
                enrollmentID: userId,
                enrollmentSecret: userId + 'pw', // Generate password
                role: role,
                affiliation: affiliation || 'org1.department1',
                attrs: []
            };

            // Add custom attributes
            if (attributes.role) {
                registerRequest.attrs.push({ name: 'role', value: attributes.role, ecert: true });
            }
            if (attributes.department) {
                registerRequest.attrs.push({ name: 'department', value: attributes.department, ecert: true });
            }
            if (attributes.email) {
                registerRequest.attrs.push({ name: 'email', value: attributes.email, ecert: true });
            }

            let secret;
            try {
                secret = await ca.register(registerRequest, caAdminUser);
            } catch (regErr) {
                if (regErr.message && regErr.message.includes('is already registered')) {
                    logger.info(`User "${userId}" already registered at CA, enrolling only...`);
                    secret = userId + 'pw';
                } else {
                    throw regErr;
                }
            }

            // Enroll the user
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put(userId, x509Identity);
            logger.info(`User "${userId}" registered and enrolled successfully`);

            return {
                success: true,
                message: 'User registered successfully',
                userId: userId,
                secret: secret
            };
        } catch (error) {
            logger.error(`Failed to register user: ${error.message}`);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            const wallet = await this.getWallet();
            const identity = await wallet.get(userId);

            if (!identity) {
                return null;
            }

            return {
                userId: userId,
                mspId: identity.mspId,
                type: identity.type
            };
        } catch (error) {
            logger.error(`Failed to get user: ${error.message}`);
            throw error;
        }
    }

    async listUsers() {
        try {
            const wallet = await this.getWallet();
            const identities = await wallet.list();
            return identities;
        } catch (error) {
            logger.error(`Failed to list users: ${error.message}`);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const wallet = await this.getWallet();
            const identity = await wallet.get(userId);

            if (!identity) {
                return { success: false, message: 'User not found' };
            }

            await wallet.remove(userId);
            logger.info(`User "${userId}" deleted successfully`);

            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            logger.error(`Failed to delete user: ${error.message}`);
            throw error;
        }
    }
}

module.exports = FabricCAClient;
