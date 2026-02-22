/**
 * Report Controller — Sprint 3
 * Generates analytics, CSV/PDF exports, and blockchain explorer data.
 */

const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const { generateCertificatePDF } = require('../utils/pdfService');
const fs = require('fs');
const path = require('path');

// Simple CSV builder
function toCSV(rows, headers) {
    const header = headers.join(',');
    const lines = rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
    return [header, ...lines].join('\n');
}

/**
 * GET /api/v1/reports/summary
 * Dashboard analytics: total students, certs issued, pending approvals per stage, docs uploaded.
 */
const getDashboardSummary = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        await gateway.connect(req.user);

        const summary = {
            generatedAt: new Date().toISOString(),
            students: { total: 0 },
            certificates: { total: 0, byType: {} },
            approvals: { pending: {}, SUBMITTED: 0, FACULTY_APPROVED: 0, HOD_APPROVED: 0, DAC_APPROVED: 0, ES_APPROVED: 0 },
            documents: { total: 0, byStatus: {} }
        };

        // Fetch stats from chaincode
        const fetchStat = async (fn, ...args) => {
            try { return JSON.parse((await gateway.evaluateTransaction(fn, ...args)).toString()); }
            catch { return null; }
        };

        // Students
        const students = await fetchStat('GetAllStudents');
        summary.students.total = Array.isArray(students) ? students.length :
            (students?.students?.length || students?.count || 0);

        // Certs by type
        for (const certType of ['DEGREE', 'TRANSCRIPT', 'BONAFIDE']) {
            const certs = await fetchStat('QueryCertificatesByType', certType);
            const count = Array.isArray(certs) ? certs.length : (certs?.count || 0);
            summary.certificates.byType[certType] = count;
            summary.certificates.total += count;
        }

        // Pending approvals per stage
        for (const status of ['SUBMITTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'DAC_APPROVED', 'ES_APPROVED']) {
            const records = await fetchStat('QueryRecordsByStatus', status, '', '100');
            const count = Array.isArray(records) ? records.length : (records?.records?.length || records?.count || 0);
            summary.approvals[status] = count;
            summary.approvals.pending[status] = count;
        }

        res.json({ success: true, data: summary });
    } catch (error) {
        logger.error(`getDashboardSummary error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/reports/certificates.csv
 * Export all certificates as CSV.
 */
const exportCertificatesCSV = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        await gateway.connect(req.user);
        let certs = [];
        for (const certType of ['DEGREE', 'TRANSCRIPT', 'BONAFIDE']) {
            try {
                const result = JSON.parse((await gateway.evaluateTransaction('QueryCertificatesByType', certType)).toString());
                certs = certs.concat(Array.isArray(result) ? result : (result?.certificates || []));
            } catch { }
        }

        const headers = ['certificateID', 'studentID', 'certType', 'status', 'issuedAt', 'ipfsHash', 'pdfHash'];
        const csv = toCSV(certs, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="certificates-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/reports/students.csv
 * Export all students as CSV.
 */
const exportStudentsCSV = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        await gateway.connect(req.user);
        let students = [];
        try {
            const result = JSON.parse((await gateway.evaluateTransaction('GetAllStudents')).toString());
            students = Array.isArray(result) ? result : (result?.students || []);
        } catch { }

        const headers = ['rollNumber', 'name', 'department', 'degree', 'batchYear', 'cgpa', 'status'];
        const csv = toCSV(students, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="students-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/reports/approvals.csv
 * Export pending approval queue per stage as CSV.
 */
const exportApprovalsCSV = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { status = 'SUBMITTED' } = req.query;
        await gateway.connect(req.user);

        let records = [];
        try {
            const result = JSON.parse((await gateway.evaluateTransaction('QueryRecordsByStatus', status, '', '500')).toString());
            records = Array.isArray(result) ? result : (result?.records || []);
        } catch { }

        const headers = ['recordID', 'studentID', 'semester', 'cgpa', 'status', 'academicYear', 'createdAt'];
        const csv = toCSV(records, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="approvals-${status}-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/reports/explorer
 * Blockchain explorer: browse recent on-chain records with full metadata.
 */
const blockchainExplorer = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { type = 'records', limit = '20', department } = req.query;
        await gateway.connect(req.user);

        let data = [];
        if (type === 'records') {
            const statuses = ['APPROVED', 'ES_APPROVED', 'DAC_APPROVED', 'HOD_APPROVED', 'FACULTY_APPROVED', 'SUBMITTED', 'DRAFT'];
            for (const s of statuses) {
                try {
                    const result = JSON.parse((await gateway.evaluateTransaction('QueryRecordsByStatus', s, department || '', String(limit))).toString());
                    const recs = Array.isArray(result) ? result : (result?.records || []);
                    data = data.concat(recs.map(r => ({ ...r, _type: 'ACADEMIC_RECORD' })));
                } catch { }
                if (data.length >= parseInt(limit)) break;
            }
        } else if (type === 'certificates') {
            for (const certType of ['DEGREE', 'TRANSCRIPT', 'BONAFIDE']) {
                try {
                    const result = JSON.parse((await gateway.evaluateTransaction('QueryCertificatesByType', certType)).toString());
                    const certs = Array.isArray(result) ? result : (result?.certificates || []);
                    data = data.concat(certs.map(c => ({ ...c, _type: 'CERTIFICATE' })));
                } catch { }
            }
        } else if (type === 'students') {
            try {
                const result = JSON.parse((await gateway.evaluateTransaction('GetAllStudents')).toString());
                data = (Array.isArray(result) ? result : (result?.students || [])).map(s => ({ ...s, _type: 'STUDENT' }));
            } catch { }
        }

        // Limit results
        data = data.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: {
                type,
                count: data.length,
                records: data,
                queriedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error(`blockchainExplorer error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * GET /api/v1/reports/audit/:recordId
 * Full immutable audit trail for a specific record.
 */
const getAuditTrail = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        await gateway.connect(req.user);

        const trail = { recordId, record: null, approvalChain: [], certificates: [] };

        try {
            trail.record = JSON.parse((await gateway.evaluateTransaction('GetAcademicRecord', recordId)).toString());
        } catch { }

        try {
            const approval = JSON.parse((await gateway.evaluateTransaction('GetApprovalStatus', recordId)).toString());
            trail.approvalChain = approval?.approvalChain || [];
        } catch { }

        res.json({ success: true, data: trail });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

module.exports = {
    getDashboardSummary,
    exportCertificatesCSV,
    exportStudentsCSV,
    exportApprovalsCSV,
    blockchainExplorer,
    getAuditTrail
};
