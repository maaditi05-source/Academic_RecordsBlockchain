const express = require('express');
const router = express.Router();
const ConsentController = require('../controllers/consentController');
const { authenticateToken } = require('../middleware/auth');

// Grant consent (student authorizes a requester)
router.post('/grant', authenticateToken, ConsentController.grantConsent);

// Revoke consent
router.post('/revoke/:consentId', authenticateToken, ConsentController.revokeConsent);

// Get all consents for a student
router.get('/student/:studentId', authenticateToken, ConsentController.getStudentConsents);

// Check if a requester has active consent (public — used by verifier portal)
router.get('/check/:studentId/:requesterId', ConsentController.checkConsent);

module.exports = router;
