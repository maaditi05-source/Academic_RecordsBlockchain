const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const { generateCertificatePDF } = require('../utils/pdfService');
const { uploadBufferToIPFS, unpinFromIPFS, getIPFSUrl, computeSHA256 } = require('../utils/ipfsService');
const dataSync = require('../utils/dataSync');

class CertificateController {
    // Issue certificate — generates PDF, uploads to IPFS, stores hashes on blockchain
    static async issueCertificate(req, res) {
        const gateway = new FabricGateway();

        try {
            const { certificateID, studentID, certType, pdfBase64, ipfsHash: providedIpfsHash } = req.body;
            const userId = req.user.userId;

            // Validate required fields
            if (!certificateID || !studentID || !certType) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: certificateID, studentID, certType'
                });
            }

            await gateway.connect(userId);

            // Step 1: Fetch student from blockchain for PDF generation
            let student = null;
            try {
                const studentResult = await gateway.evaluateTransaction('GetStudent', studentID);
                student = typeof studentResult === 'string' ? JSON.parse(studentResult) : studentResult;
            } catch (err) {
                logger.warn(`Could not fetch student ${studentID}: ${err.message}`);
            }

            let pdfHash = '';
            let ipfsHash = providedIpfsHash || '';
            let ipfsUrl = '';

            // Step 2: Generate PDF if no pdfBase64 was provided
            if (!pdfBase64 && student) {
                try {
                    const pdfResult = await generateCertificatePDF({
                        student,
                        record: null,
                        certificate: { certificateID, certType },
                        approvalChain: []
                    });

                    // Step 3: Compute SHA-256 hash
                    const fs = require('fs');
                    const pdfBuffer = fs.readFileSync(pdfResult.filePath);
                    pdfHash = computeSHA256(pdfBuffer);

                    // Step 4: Upload to IPFS
                    const ipfsResult = await uploadBufferToIPFS(pdfBuffer, `${certificateID}.pdf`);
                    ipfsHash = ipfsResult.cid;
                    ipfsUrl = ipfsResult.url;
                    logger.info(`PDF uploaded to IPFS: ${ipfsUrl} (mode: ${ipfsResult.mode})`);
                } catch (pdfErr) {
                    logger.warn(`PDF generation/IPFS upload failed: ${pdfErr.message}. Proceeding without IPFS.`);
                }
            } else if (pdfBase64) {
                // Hash the provided base64 PDF
                const crypto = require('crypto');
                pdfHash = crypto.createHash('sha256').update(pdfBase64).digest('hex');
            }

            // Step 5: Store hashes on blockchain
            await gateway.submitTransaction(
                'IssueCertificate',
                certificateID,
                studentID,
                certType,
                pdfHash || pdfBase64 || '',
                ipfsHash
            );

            logger.info(`Certificate issued: ${certificateID}`);

            res.status(201).json({
                success: true,
                message: 'Certificate issued successfully',
                data: {
                    certificateID,
                    pdfHash,
                    ipfsHash,
                    ipfsUrl: ipfsUrl || (ipfsHash ? getIPFSUrl(ipfsHash) : ''),
                    downloadUrl: ipfsUrl || (ipfsHash ? getIPFSUrl(ipfsHash) : '')
                }
            });
        } catch (error) {
            logger.error(`Error issuing certificate: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            await gateway.disconnect();
        }
    }

    // Get certificate
    static async getCertificate(req, res) {
        const gateway = new FabricGateway();

        try {
            const { certificateID } = req.params;
            // Use admin for anonymous access, or authenticated user if available
            const userId = req.user ? req.user.userId : 'admin';

            await gateway.connect(userId);

            const result = await gateway.evaluateTransaction('GetCertificate', certificateID);
            const cert = typeof result === 'string' ? JSON.parse(result) : result;

            // Append IPFS URL if available
            if (cert && cert.ipfsHash) {
                cert.ipfsUrl = getIPFSUrl(cert.ipfsHash);
                cert.downloadUrl = cert.ipfsUrl;
            }

            res.status(200).json({
                success: true,
                data: cert
            });
        } catch (error) {
            logger.error(`Error getting certificate: ${error.message}`);
            res.status(404).json({
                success: false,
                message: error.message
            });
        } finally {
            await gateway.disconnect();
        }
    }

    // Download certificate — redirect to IPFS gateway
    static async downloadCertificate(req, res) {
        const gateway = new FabricGateway();
        try {
            const { certificateID } = req.params;
            const userId = req.user ? req.user.userId : 'admin';
            await gateway.connect(userId);

            const result = await gateway.evaluateTransaction('GetCertificate', certificateID);
            const cert = typeof result === 'string' ? JSON.parse(result) : result;

            if (!cert || !cert.ipfsHash) {
                return res.status(404).json({ success: false, message: 'No IPFS file linked to this certificate' });
            }

            // Redirect browser to IPFS gateway — PDF downloads automatically
            res.redirect(getIPFSUrl(cert.ipfsHash));
        } catch (error) {
            logger.error(`Error downloading certificate: ${error.message}`);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    // PDF-Blockchain Cryptographic Verification (verify by file or hash)
    static async verifyCertificate(req, res) {
        const gateway = new FabricGateway();

        try {
            let { pdfHash } = req.body;

            // If user uploaded the file instead of providing the hash directly
            if (!pdfHash && req.file) {
                const crypto = require('crypto');
                const fs = require('fs');
                const fileBuffer = fs.readFileSync(req.file.path);
                pdfHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                fs.unlinkSync(req.file.path); // Clean up the temp file
            }

            if (!pdfHash) {
                return res.status(400).json({
                    success: false,
                    message: "PDF hash or uploaded file is required for verification."
                });
            }

            // Use admin for anonymous verification, or authenticated user if available
            const userId = req.user ? req.user.userId : 'admin';
            await gateway.connect(userId);

            try {
                // Request the blockchain to verify if this cryptographic fingerprint exists
                const result = await gateway.evaluateTransaction('VerifyCertificateByHash', pdfHash);
                const certificate = JSON.parse(result.toString());

                // Condition 2: Authentic but Invalid (Revoked)
                if (certificate.revoked) {
                    return res.status(200).json({
                        success: true,
                        message: "⚠️ Document is Authentic but INVALID (Revoked). " + (certificate.revocationReason || ""),
                        data: {
                            status: "REVOKED",
                            certificate
                        }
                    });
                }

                // Condition 1: Authentic and Valid
                return res.status(200).json({
                    success: true,
                    message: "✅ Document is Authentic and Valid",
                    data: {
                        status: "VALID",
                        certificate
                    }
                });
            } catch (error) {
                // Condition 3: Fake or Modified
                if (error.message.includes("no certificate found matching the provided hash")) {
                    return res.status(200).json({
                        success: false,
                        message: "❌ Document is Fake or has been Modified (Fingerprint not securely registered on ledger).",
                        data: {
                            status: "FAKE"
                        }
                    });
                }
                throw error;
            }
        } catch (error) {
            logger.error(`Error verifying certificate: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            await gateway.disconnect();
        }
    }

    // Get student certificates
    static async getStudentCertificates(req, res) {
        const gateway = new FabricGateway();

        try {
            const { studentID } = req.params;
            const userId = req.user.userId;

            await gateway.connect(userId);

            // Call the correct chaincode function: GetCertificatesByStudent
            const result = await gateway.evaluateTransaction('GetCertificatesByStudent', studentID);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error(`Error getting student certificates: ${error.message}`);

            // If no certificates found, return empty array instead of error
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }

            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            await gateway.disconnect();
        }
    }

    // Revoke certificate — also unpins from IPFS
    static async revokeCertificate(req, res) {
        const gateway = new FabricGateway();

        try {
            const { certificateID } = req.params;
            const { reason } = req.body;
            const userId = req.user.userId;

            await gateway.connect(userId);

            // Fetch ipfsHash BEFORE revoking so we can unpin after
            let ipfsHashToUnpin = '';
            try {
                const certBefore = await gateway.evaluateTransaction('GetCertificate', certificateID);
                const cert = typeof certBefore === 'string' ? JSON.parse(certBefore) : certBefore;
                ipfsHashToUnpin = cert?.ipfsHash || '';
            } catch (err) {
                logger.warn(`Could not fetch certificate before revoke: ${err.message}`);
            }

            const result = await gateway.submitTransaction(
                'RevokeCertificate',
                certificateID,
                reason || ''
            );

            logger.info(`Certificate revoked: ${certificateID}`);

            // Unpin from IPFS so the file becomes inaccessible (non-fatal)
            if (ipfsHashToUnpin) {
                try {
                    await unpinFromIPFS(ipfsHashToUnpin);
                    logger.info(`IPFS file unpinned after revocation: ${ipfsHashToUnpin}`);
                } catch (unpinErr) {
                    logger.warn(`IPFS unpin failed (non-fatal): ${unpinErr.message}`);
                }
            }

            res.status(200).json({
                success: true,
                message: 'Certificate revoked successfully',
                data: result
            });
        } catch (error) {
            logger.error(`Error revoking certificate: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        } finally {
            await gateway.disconnect();
        }
    }

    // Request certificate (Student)
    static async requestCertificate(req, res) {
        try {
            const { certificateType, purpose, additionalDetails } = req.body;
            const userId = req.user.userId;
            const username = req.user.username;
            const role = req.user.role;

            // Validate required fields
            if (!certificateType || !purpose) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: certificateType, purpose'
                });
            }

            // Only students can request certificates
            if (role !== 'student') {
                return res.status(403).json({
                    success: false,
                    message: 'Only students can request certificates'
                });
            }

            // Create certificate request object
            const certificateRequest = {
                requestId: `REQ-${Date.now()}`,
                studentId: username, // Roll number
                certificateType,
                purpose,
                additionalDetails: additionalDetails || '',
                requestDate: new Date().toISOString(),
                status: 'PENDING',
                userId
            };

            // Store request via distributed dataSync
            let requests = await dataSync.readCollection('certificate-requests');

            // Add new request
            requests.push(certificateRequest);

            // Save back
            await dataSync.writeCollection('certificate-requests', requests);

            logger.info(`Certificate request created: ${certificateRequest.requestId} for student ${username}`);

            res.status(201).json({
                success: true,
                message: 'Certificate request submitted successfully',
                data: certificateRequest
            });
        } catch (error) {
            logger.error(`Error requesting certificate: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get certificate requests
    static async getCertificateRequests(req, res) {
        try {
            const role = req.user.role;
            const username = req.user.username;

            // Read requests via distributed dataSync
            let requests = await dataSync.readCollection('certificate-requests');

            // Filter based on role
            if (role === 'student') {
                // Students can only see their own requests
                requests = requests.filter(req => req.studentId === username);
            }
            // Admin and faculty can see all requests

            res.status(200).json({
                success: true,
                data: requests
            });
        } catch (error) {
            logger.error(`Error getting certificate requests: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update certificate request status
    static async updateCertificateRequestStatus(req, res) {
        try {
            const { requestId } = req.params;
            const { status, processedDate, processedBy, certificateId } = req.body;
            const role = req.user.role;

            // Only authorized roles can update request status
            if (!['admin', 'hod', 'department', 'dac_member', 'dean_academic', 'exam_section'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Only HOD, admin, and authorized roles can approve/reject certificate requests'
                });
            }

            // Read requests via distributed dataSync
            let requests = await dataSync.readCollection('certificate-requests');

            // Find and update the request
            const requestIndex = requests.findIndex(r => r.requestId === requestId);
            if (requestIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate request not found'
                });
            }

            if (status === 'APPROVED') {
                const type = requests[requestIndex].certificateType || 'BONAFIDE';
                const currentStatus = (requests[requestIndex].status || 'PENDING').toLowerCase();

                const workflows = {
                    'DEGREE_CERTIFICATE': { pending: 'hod_approved', hod_approved: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
                    'CONSOLIDATED_MARKSHEET': { pending: 'hod_approved', hod_approved: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
                    'SEMESTER_MARKSHEET': { pending: 'hod_approved', hod_approved: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
                    'MIGRATION_CERTIFICATE': { pending: 'hod_approved', hod_approved: 'exam_approved', exam_approved: 'dean_approved', dean_approved: 'issued' },
                    'BONAFIDE': { pending: 'hod_approved', hod_approved: 'dean_approved', dean_approved: 'issued' },
                    'BONAFIDE_CERTIFICATE': { pending: 'hod_approved', hod_approved: 'dean_approved', dean_approved: 'issued' },
                    'TRANSFER': { pending: 'hod_approved', hod_approved: 'dean_approved', dean_approved: 'issued' },
                    'TRANSFER_CERTIFICATE': { pending: 'hod_approved', hod_approved: 'dean_approved', dean_approved: 'issued' }
                };

                const wf = workflows[type] || workflows['BONAFIDE'];
                if (wf && wf[currentStatus]) {
                    requests[requestIndex].status = wf[currentStatus];
                } else {
                    requests[requestIndex].status = 'APPROVED';
                }
            } else {
                requests[requestIndex].status = status;
            }
            requests[requestIndex].processedDate = processedDate || new Date().toISOString();
            requests[requestIndex].processedBy = processedBy || req.user.username;

            // Store the blockchain certificate ID if provided (when approved)
            if (certificateId) {
                requests[requestIndex].certificateId = certificateId;
            }

            // Save back via dataSync
            await dataSync.writeCollection('certificate-requests', requests);

            logger.info(`Certificate request ${requestId} updated to ${status} by ${req.user.username}`);

            res.status(200).json({
                success: true,
                message: 'Certificate request updated successfully',
                data: requests[requestIndex]
            });
        } catch (error) {
            logger.error(`Error updating certificate request: ${error.message}`);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CertificateController;
