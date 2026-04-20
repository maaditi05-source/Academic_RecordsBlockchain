/**
 * Internal Data Routes — node-to-node sync
 * 
 * GET  /api/internal/data/:collection   → returns full JSON array
 * POST /api/internal/data/:collection   → replaces full JSON array
 * 
 * These are called by remote nodes' dataSync.js to keep data in sync.
 * They are NOT protected by auth because they are internal network-only.
 */

const express = require('express');
const router = express.Router();
const { localRead, localWrite } = require('../utils/dataSync');

const ALLOWED = [
    'users', 'departments', 'courses', 'marks',
    'certificate-requests', 'correction_requests',
    'document_requests', 'locked_semesters'
];

router.get('/:collection', (req, res) => {
    const { collection } = req.params;
    if (!ALLOWED.includes(collection)) {
        return res.status(400).json({ success: false, message: 'Unknown collection' });
    }
    res.json({ success: true, data: localRead(collection) });
});

router.post('/:collection', (req, res) => {
    const { collection } = req.params;
    if (!ALLOWED.includes(collection)) {
        return res.status(400).json({ success: false, message: 'Unknown collection' });
    }
    const { data } = req.body;
    if (!Array.isArray(data)) {
        return res.status(400).json({ success: false, message: 'data must be an array' });
    }
    localWrite(collection, data);
    res.json({ success: true, message: `${collection} updated (${data.length} items)` });
});

module.exports = router;
