/**
 * Consent Controller — Sprint 3
 * Manages student consent for third-party access to their academic records.
 *
 * Consent scopes:
 *   SEMESTER — grants access to a specific semester's records
 *   FULL_RECORD — grants access to the entire academic history
 *
 * All grant/revoke events are logged immutably on the blockchain.
 * The chaincode functions GrantConsent / RevokeConsent / CheckConsent are called.
 * If those functions aren't deployed yet, a local JSON store is used as fallback.
 */

const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONSENT_STORE = path.join(__dirname, '../../data/consents.json');

// ── Local store (fallback when chaincode functions not yet deployed) ───────────
function loadConsents() {
    if (fs.existsSync(CONSENT_STORE)) {
        try { return JSON.parse(fs.readFileSync(CONSENT_STORE, 'utf8')); }
        catch { return []; }
    }
    return [];
}
function saveConsents(consents) {
    fs.writeFileSync(CONSENT_STORE, JSON.stringify(consents, null, 2));
}

/**
 * POST /api/v1/consent/grant
 * Student grants consent to a requester (e.g., employer, institution).
 * Body: { studentId, requesterId, requesterName, scope, semesterNumber? }
 */
const grantConsent = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId, requesterId, requesterName = '', scope = 'FULL_RECORD', semesterNumber } = req.body;

        if (!studentId || !requesterId) {
            return res.status(400).json({ success: false, message: 'studentId and requesterId are required' });
        }
        if (!['SEMESTER', 'FULL_RECORD'].includes(scope)) {
            return res.status(400).json({ success: false, message: 'scope must be SEMESTER or FULL_RECORD' });
        }
        if (scope === 'SEMESTER' && !semesterNumber) {
            return res.status(400).json({ success: false, message: 'semesterNumber required for SEMESTER scope' });
        }

        const consentId = `CONSENT-${studentId}-${requesterId}-${Date.now()}`;
        const consentRecord = {
            consentId,
            studentId,
            requesterId,
            requesterName,
            scope,
            semesterNumber: scope === 'SEMESTER' ? parseInt(semesterNumber) : null,
            grantedAt: new Date().toISOString(),
            grantedBy: req.user?.username || studentId,
            status: 'ACTIVE',
            revokedAt: null
        };

        // Try blockchain first
        await gateway.connect(req.user);
        let onChain = false;
        try {
            await gateway.submitTransaction(
                'GrantConsent',
                consentId, studentId, requesterId,
                scope,
                String(semesterNumber || 0)
            );
            onChain = true;
        } catch (chainErr) {
            logger.warn(`GrantConsent chaincode not available — storing locally: ${chainErr.message}`);
            const consents = loadConsents();
            consents.push(consentRecord);
            saveConsents(consents);
        }

        res.json({
            success: true,
            message: `Consent granted to ${requesterName || requesterId} (${scope})`,
            data: { ...consentRecord, onChain }
        });

    } catch (error) {
        logger.error(`grantConsent error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * POST /api/v1/consent/revoke/:consentId
 * Student revokes a previously granted consent.
 */
const revokeConsent = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { consentId } = req.params;
        const { reason = '' } = req.body;

        await gateway.connect(req.user);
        let onChain = false;
        try {
            await gateway.submitTransaction('RevokeConsent', consentId, reason);
            onChain = true;
        } catch (chainErr) {
            logger.warn(`RevokeConsent chaincode not available — updating locally: ${chainErr.message}`);
            const consents = loadConsents();
            const consent = consents.find(c => c.consentId === consentId);
            if (!consent) return res.status(404).json({ success: false, message: 'Consent not found' });
            consent.status = 'REVOKED';
            consent.revokedAt = new Date().toISOString();
            consent.revokeReason = reason;
            saveConsents(consents);
        }

        res.json({
            success: true,
            message: 'Consent revoked successfully',
            data: { consentId, status: 'REVOKED', revokedAt: new Date().toISOString(), onChain }
        });

    } catch (error) {
        logger.error(`revokeConsent error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/consent/student/:studentId
 * Get all consents granted by a student (active and revoked).
 */
const getStudentConsents = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId } = req.params;

        await gateway.connect(req.user);
        let consents = [];
        try {
            const result = await gateway.evaluateTransaction('GetConsentsByStudent', studentId);
            consents = JSON.parse(result.toString());
        } catch {
            // Fall back to local store
            consents = loadConsents().filter(c => c.studentId === studentId);
        }

        res.json({ success: true, data: consents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/consent/check/:studentId/:requesterId
 * Check if a requester has active consent to access a student's records.
 */
const checkConsent = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId, requesterId } = req.params;

        await gateway.connect(req.user || {});
        let hasConsent = false, consentRecord = null;
        try {
            const result = await gateway.evaluateTransaction('CheckConsent', studentId, requesterId);
            consentRecord = JSON.parse(result.toString());
            hasConsent = consentRecord?.status === 'ACTIVE';
        } catch {
            const consents = loadConsents();
            consentRecord = consents.find(
                c => c.studentId === studentId && c.requesterId === requesterId && c.status === 'ACTIVE'
            ) || null;
            hasConsent = !!consentRecord;
        }

        res.json({
            success: true,
            data: {
                studentId, requesterId,
                hasConsent,
                consent: consentRecord,
                message: hasConsent
                    ? `✅ Active consent found (scope: ${consentRecord?.scope || 'UNKNOWN'})`
                    : '⛔ No active consent — access denied'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

module.exports = { grantConsent, revokeConsent, getStudentConsents, checkConsent };
