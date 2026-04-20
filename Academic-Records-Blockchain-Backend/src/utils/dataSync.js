/**
 * Data Sync Utility
 * -----------------
 * Centralises all JSON-file data access.
 * 
 * IF THIS NODE IS THE ADMIN NODE (ADMIN_HOST not set, or points to localhost)
 *    → reads/writes local JSON files (single source of truth)
 * 
 * IF THIS NODE IS A REMOTE NODE (ADMIN_HOST points elsewhere)
 *    → all reads are proxied to the admin node's internal API
 *    → all writes are proxied to the admin node
 *    → a local cache is kept for offline resilience
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '../../data');

// Determine admin node URL
const MY_HOST = process.env.HOST || '0.0.0.0';
const ADMIN_HOST = process.env.ADMIN_HOST || process.env.NITW_PEER0_HOST || '';
const ADMIN_PORT = process.env.ADMIN_BACKEND_PORT || process.env.PORT || '3000';
const IS_ADMIN = !ADMIN_HOST || ADMIN_HOST === 'localhost' || ADMIN_HOST === '127.0.0.1' || ADMIN_HOST === MY_HOST;

if (!IS_ADMIN) {
    logger.info(`[DataSync] Remote mode — admin node at ${ADMIN_HOST}:${ADMIN_PORT}`);
} else {
    logger.info(`[DataSync] Admin mode — I am the data authority`);
}

// ──── Local helpers ──────────────────────────────────────────────

function localRead(collection) {
    const file = path.join(DATA_DIR, `${collection}.json`);
    try {
        if (!fs.existsSync(file)) return [];
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        logger.warn(`[DataSync] Error reading ${collection}.json: ${e.message}`);
        return [];
    }
}

function localWrite(collection, data) {
    const file = path.join(DATA_DIR, `${collection}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ──── HTTP helpers ───────────────────────────────────────────────

function httpGet(urlPath) {
    return new Promise((resolve, reject) => {
        const url = `http://${ADMIN_HOST}:${ADMIN_PORT}${urlPath}`;
        http.get(url, { timeout: 5000 }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) { reject(e); }
            });
        }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
    });
}

function httpPost(urlPath, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const opts = {
            hostname: ADMIN_HOST,
            port: ADMIN_PORT,
            path: urlPath,
            method: 'POST',
            timeout: 5000,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = http.request(opts, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('timeout')));
        req.write(data);
        req.end();
    });
}

// ──── Public API ─────────────────────────────────────────────────

/**
 * Read a collection.  Returns an array.
 * Remote nodes fetch from admin and cache locally.
 */
async function readCollection(collection) {
    if (IS_ADMIN) {
        return localRead(collection);
    }

    // Remote: try admin first, fall back to local cache
    try {
        const resp = await httpGet(`/api/internal/data/${collection}`);
        if (resp.success && Array.isArray(resp.data)) {
            localWrite(collection, resp.data);  // cache locally
            return resp.data;
        }
    } catch (e) {
        logger.warn(`[DataSync] Could not reach admin for ${collection}: ${e.message}, using local cache`);
    }
    return localRead(collection);
}

/**
 *  Write (overwrite) a full collection.
 *  Remote nodes push to admin AND update local cache.
 */
async function writeCollection(collection, data) {
    if (IS_ADMIN) {
        localWrite(collection, data);
        return;
    }

    // Remote: push to admin and write local cache
    try {
        await httpPost(`/api/internal/data/${collection}`, { data });
    } catch (e) {
        logger.warn(`[DataSync] Could not push ${collection} to admin: ${e.message}`);
    }
    localWrite(collection, data);   // always keep local cache updated
}

/**
 * Convenience: read, mutate, write back.
 */
async function addToCollection(collection, item) {
    const arr = await readCollection(collection);
    arr.push(item);
    await writeCollection(collection, arr);
    return arr;
}

async function removeFromCollection(collection, predicate) {
    const arr = await readCollection(collection);
    const filtered = arr.filter(x => !predicate(x));
    await writeCollection(collection, filtered);
    return filtered;
}

async function updateInCollection(collection, predicate, updater) {
    const arr = await readCollection(collection);
    for (let i = 0; i < arr.length; i++) {
        if (predicate(arr[i])) {
            arr[i] = typeof updater === 'function' ? updater(arr[i]) : { ...arr[i], ...updater };
        }
    }
    await writeCollection(collection, arr);
    return arr;
}

module.exports = {
    IS_ADMIN,
    readCollection,
    writeCollection,
    addToCollection,
    removeFromCollection,
    updateInCollection,
    localRead,
    localWrite,
};
