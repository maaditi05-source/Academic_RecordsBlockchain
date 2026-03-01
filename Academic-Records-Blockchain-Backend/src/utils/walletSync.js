const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const importAdmin = require('../importAdmin');
const { Wallets } = require('fabric-network');

async function syncWalletOnStartup() {
    try {
        const walletPath = path.join(__dirname, '../../wallet');

        // Path to pre-generated admin credentials from the organizations folder
        const adminCertDir = path.resolve(__dirname, '..', '..', '..', 'Academic_RecordsBlockchain', 'organizations', 'peerOrganizations', 'nitwarangal.nitw.edu', 'users', 'Admin@nitwarangal.nitw.edu', 'msp', 'signcerts');

        if (!fs.existsSync(adminCertDir)) {
            logger.warn(`Admin cert directory not found at ${adminCertDir}. Network might not be properly set up yet.`);
            return;
        }

        const certFiles = fs.readdirSync(adminCertDir);
        if (certFiles.length === 0) {
            logger.warn('No certificate files found in the network admin directory.');
            return;
        }

        const networkAdminCert = fs.readFileSync(path.join(adminCertDir, certFiles[0]), 'utf8');

        // Check the wallet directory
        if (!fs.existsSync(walletPath)) {
            logger.info('Wallet directory does not exist. Importing admin...');
            await importAdmin();
            return;
        }

        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const adminIdentity = await wallet.get('admin');

        let isWalletStale = false;

        if (!adminIdentity) {
            logger.info('Admin identity not found in wallet. Importing admin...');
            isWalletStale = true;
        } else {
            // Compare the certificates
            const walletAdminCert = adminIdentity.credentials.certificate;

            // Normalize line endings and trim before comparison
            const normalizeCert = (cert) => cert.replace(/\r\n/g, '\n').trim();

            if (normalizeCert(walletAdminCert) !== normalizeCert(networkAdminCert)) {
                logger.warn('⚠️ Network restart detected: Admin certificate in wallet does not match the current network certificate. Purging stale wallet identities...');
                isWalletStale = true;
            }
        }

        if (isWalletStale) {
            // Clear the entire wallet folder contents
            const files = fs.readdirSync(walletPath);
            for (const file of files) {
                fs.unlinkSync(path.join(walletPath, file));
            }
            logger.info(`Cleared ${files.length} stale identities from wallet.`);

            // Re-import the valid admin identity
            await importAdmin();
        } else {
            logger.info('Wallet admin identity is up to date with the latest network.');
        }

    } catch (error) {
        logger.error(`Error during wallet sync on startup: ${error.message}`);
        logger.error(error.stack);
    }
}

module.exports = syncWalletOnStartup;
