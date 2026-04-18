/**
 * IPFS Service
 * Uploads files to IPFS and returns the CID (Content Identifier).
 *
 * Strategy:
 *   1. Try local Kubo daemon (http://localhost:5001) — preferred for production
 *   2. If not available, try Infura IPFS gateway (requires IPFS_PROJECT_ID/SECRET env vars)
 *   3. If neither is configured, fall back to "local-store" mode:
 *      - Stores file in uploads/ipfs-store/ directory
 *      - Returns a deterministic CID: "LOCAL-{sha256[:16]}" for development
 *
 * This means the system works end-to-end in development without running an IPFS node.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger');

const IPFS_STORE = path.join(__dirname, '../../uploads/ipfs-store');
if (!fs.existsSync(IPFS_STORE)) fs.mkdirSync(IPFS_STORE, { recursive: true });

// Public IPFS gateway for fetching files by CID
const PUBLIC_GATEWAY = process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs';

/** Compute SHA-256 of a buffer */
function computeSHA256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Lazily initialize Pinata SDK (only when actually called).
 * Requires PINATA_API_KEY and PINATA_SECRET_API_KEY in .env
 */
let _pinata = null;
function getPinata() {
    if (!_pinata) {
        try {
            const pinataSDK = require('@pinata/sdk');
            const key = process.env.PINATA_API_KEY;
            const secret = process.env.PINATA_SECRET_API_KEY;
            if (!key || !secret) return null;
            _pinata = new pinataSDK(key, secret);
        } catch {
            return null;  // @pinata/sdk not installed
        }
    }
    return _pinata;
}

/**
 * Try to connect to a local Kubo IPFS daemon.
 * Returns a kubo-rpc-client handle or null.
 */
async function getKuboClient() {
    try {
        const { create } = await import('kubo-rpc-client');
        const host = process.env.IPFS_HOST || 'http://localhost:5001';
        const client = create({ url: host });
        // Quick connectivity test
        await client.id();
        logger.info(`[IPFS] Connected to Kubo daemon at ${host}`);
        return client;
    } catch {
        return null;
    }
}

/**
 * Upload a file to IPFS.
 * @param {string} filePath - Absolute path to the file
 * @returns {{ cid: string, url: string, mode: string }}
 */
async function uploadToIPFS(filePath) {
    const buffer = fs.readFileSync(filePath);
    const originalName = path.basename(filePath);
    return uploadBufferToIPFS(buffer, originalName);
}

/**
 * Upload a Buffer to IPFS (used by certificate issuance flow).
 * Strategy order: Pinata → Kubo → Infura → local fallback.
 * @param {Buffer} buffer - File content in memory
 * @param {string} fileName - e.g. "CERT-123.pdf"
 * @returns {{ cid: string, url: string, mode: string }}
 */
async function uploadBufferToIPFS(buffer, fileName) {
    const sha256 = computeSHA256(buffer);

    // 1. Try Pinata (preferred for production — globally pinned + gateway)
    const pinata = getPinata();
    if (pinata) {
        try {
            const { Readable } = require('stream');
            const stream = Readable.from(buffer);
            stream.path = fileName;   // Pinata SDK uses this as file name

            const options = {
                pinataMetadata: {
                    name: fileName,
                    keyvalues: { app: 'nitw-academic-records', env: process.env.NODE_ENV || 'development' }
                },
                pinataOptions: { cidVersion: 0 }
            };

            const result = await pinata.pinFileToIPFS(stream, options);
            const cid = result.IpfsHash;
            logger.info(`[IPFS] Uploaded via Pinata. CID: ${cid}`);
            return { cid, url: `${PUBLIC_GATEWAY}/${cid}`, mode: 'pinata' };
        } catch (err) {
            logger.warn(`[IPFS] Pinata upload failed: ${err.message}`);
        }
    }

    // 2. Try local Kubo
    const client = await getKuboClient();
    if (client) {
        try {
            const result = await client.add(buffer, { pin: true });
            const cid = result.cid.toString();
            logger.info(`[IPFS] Uploaded via Kubo. CID: ${cid}`);
            return { cid, url: `${PUBLIC_GATEWAY}/${cid}`, mode: 'kubo' };
        } catch (err) {
            logger.warn(`[IPFS] Kubo upload failed: ${err.message}`);
        }
    }

    // 3. Try Infura IPFS (if configured)
    if (process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET) {
        try {
            const FormData = require('form-data');
            const fetch = require('node-fetch');
            const form = new FormData();
            form.append('file', buffer, { filename: fileName });

            const auth = Buffer.from(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`).toString('base64');
            const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}` },
                body: form
            });
            const data = await response.json();
            const cid = data.Hash;
            logger.info(`[IPFS] Uploaded via Infura. CID: ${cid}`);
            return { cid, url: `${PUBLIC_GATEWAY}/${cid}`, mode: 'infura' };
        } catch (err) {
            logger.warn(`[IPFS] Infura upload failed: ${err.message}`);
        }
    }

    // 4. Local store fallback (dev mode)
    const localCid = `LOCAL-${sha256.substring(0, 32)}`;
    const storePath = path.join(IPFS_STORE, localCid);
    fs.writeFileSync(storePath, buffer);
    logger.info(`[IPFS] Stored locally (dev fallback). CID: ${localCid}`);
    return {
        cid: localCid,
        url: `/uploads/ipfs-store/${localCid}`,
        mode: 'local-fallback'
    };
}

/**
 * Retrieve a file from IPFS by CID.
 * If it's a local CID, serve from ipfs-store.
 * @param {string} cid
 * @returns {Buffer | null}
 */
async function getFromIPFS(cid) {
    // Local fallback CIDs
    if (cid.startsWith('LOCAL-')) {
        const storePath = path.join(IPFS_STORE, cid);
        if (fs.existsSync(storePath)) {
            return fs.readFileSync(storePath);
        }
        return null;
    }

    // Try local Kubo
    const client = await getKuboClient();
    if (client) {
        const chunks = [];
        for await (const chunk of client.cat(cid)) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    // Fall back to public gateway fetch
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${PUBLIC_GATEWAY}/${cid}`);
        return Buffer.from(await response.arrayBuffer());
    } catch (err) {
        logger.error(`[IPFS] Could not retrieve CID ${cid}: ${err.message}`);
        return null;
    }
}

/**
 * Pin a CID to the local node (ensure it persists).
 */
async function pinCID(cid) {
    if (cid.startsWith('LOCAL-')) return; // no-op for local
    const client = await getKuboClient();
    if (client) {
        await client.pin.add(cid);
        logger.info(`[IPFS] Pinned CID: ${cid}`);
    }
}

/**
 * Unpin a file from IPFS (called on certificate revocation).
 * Tries Pinata first, then Kubo.
 */
async function unpinFromIPFS(cid) {
    if (!cid || cid.startsWith('LOCAL-')) {
        // Local fallback: delete the file
        const storePath = path.join(IPFS_STORE, cid);
        if (cid && fs.existsSync(storePath)) {
            fs.unlinkSync(storePath);
            logger.info(`[IPFS] Removed local file: ${cid}`);
        }
        return;
    }

    // Try Pinata unpin
    const pinata = getPinata();
    if (pinata) {
        try {
            await pinata.unpin(cid);
            logger.info(`[IPFS] Unpinned via Pinata: ${cid}`);
            return;
        } catch (err) {
            logger.warn(`[IPFS] Pinata unpin failed for ${cid}: ${err.message}`);
        }
    }

    // Try Kubo unpin
    const client = await getKuboClient();
    if (client) {
        try {
            await client.pin.rm(cid);
            logger.info(`[IPFS] Unpinned via Kubo: ${cid}`);
        } catch (err) {
            logger.warn(`[IPFS] Kubo unpin failed for ${cid}: ${err.message}`);
        }
    }
}

/**
 * Get the public gateway URL for a CID.
 */
function getIPFSUrl(cid) {
    if (cid.startsWith('LOCAL-')) return `/uploads/ipfs-store/${cid}`;
    return `${PUBLIC_GATEWAY}/${cid}`;
}

/**
 * Test Pinata credentials (call on startup to detect misconfig early).
 */
async function testConnection() {
    const pinata = getPinata();
    if (pinata) {
        try {
            await pinata.testAuthentication();
            logger.info('Pinata IPFS connection: OK');
            return true;
        } catch (err) {
            logger.warn(`Pinata IPFS connection failed: ${err.message}`);
        }
    }
    // Try Kubo
    const client = await getKuboClient();
    if (client) {
        logger.info('[IPFS] Kubo daemon available');
        return true;
    }
    logger.warn('[IPFS] No IPFS provider configured — using local fallback');
    return false;
}

module.exports = { uploadToIPFS, uploadBufferToIPFS, getFromIPFS, pinCID, unpinFromIPFS, getIPFSUrl, testConnection, computeSHA256 };
