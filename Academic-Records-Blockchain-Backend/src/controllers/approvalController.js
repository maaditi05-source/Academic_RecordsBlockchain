/**
 * Approval Controller
 * Handles the multi-party academic record approval workflow:
 * DRAFT → SUBMITTED → FACULTY_APPROVED → HOD_APPROVED → DAC_APPROVED → ES_APPROVED → APPROVED
 */

const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const { notifyApprovalStep, notifyRejection } = require('../utils/notificationService');

/** Helper: look up the student's email from their roll number for notifications */
async function getStudentEmail(gateway, studentId) {
    try {
        const result = await gateway.evaluateTransaction('GetStudent', studentId);
        const student = JSON.parse(result.toString());
        return { email: student.email, name: student.name };
    } catch (_) { return { email: null, name: null }; }
}


/**
 * Submit a DRAFT record for approval (Department triggers this)
 * POST /api/approval/submit/:recordId
 */
const submitForApproval = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        if (!recordId) return res.status(400).json({ success: false, message: 'recordId is required' });

        await gateway.connect(req.user);
        await gateway.submitTransaction('SubmitForApproval', recordId);

        res.json({
            success: true,
            message: 'Record submitted for approval successfully',
            data: { recordId, status: 'SUBMITTED' }
        });
    } catch (error) {
        logger.error(`submitForApproval error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Faculty approves a record (SUBMITTED → FACULTY_APPROVED)
 * POST /api/approval/faculty/:recordId
 */
const facultyApprove = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { comment = '' } = req.body;

        await gateway.connect(req.user);
        // Get student ID from the record for notifications
        let studentId = req.body.studentId;
        if (!studentId) {
            try {
                const rec = JSON.parse((await gateway.evaluateTransaction('GetAcademicRecord', recordId)).toString());
                studentId = rec.studentID;
            } catch (_) { }
        }

        await gateway.submitTransaction('FacultyApprove', recordId, comment);

        // Fire-and-forget notification
        if (studentId) {
            const { email } = await getStudentEmail(gateway, studentId);
            notifyApprovalStep(req.app.get('io'), {
                studentId, studentEmail: email, recordId,
                newStatus: 'FACULTY_APPROVED', approvedBy: req.user.username
            }).catch(() => { });
        }

        res.json({
            success: true,
            message: 'Faculty approval recorded',
            data: { recordId, status: 'FACULTY_APPROVED', approvedBy: req.user.username }
        });
    } catch (error) {
        logger.error(`facultyApprove error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * HOD approves a record (FACULTY_APPROVED → HOD_APPROVED)
 * POST /api/approval/hod/:recordId
 */
const hodApprove = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { comment = '' } = req.body;

        await gateway.connect(req.user);
        await gateway.submitTransaction('HODApprove', recordId, comment);

        res.json({
            success: true,
            message: 'HOD approval recorded',
            data: { recordId, status: 'HOD_APPROVED', approvedBy: req.user.username }
        });
    } catch (error) {
        logger.error(`hodApprove error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Exam Section approves a record (HOD_APPROVED → ES_LOCKED)
 * POST /api/approval/examsection/:recordId
 */
const examSectionApprove = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { comment = '' } = req.body;

        await gateway.connect(req.user);
        await gateway.submitTransaction('ExamSectionApprove', recordId, comment);

        res.json({
            success: true,
            message: 'Exam Section locked the record. Ready for Dean approval.',
            data: { recordId, status: 'EXAM_LOCKED', approvedBy: req.user.username }
        });
    } catch (error) {
        logger.error(`examSectionApprove error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Dean Academic gives approval (ES_LOCKED → DEAN_APPROVED)
 * POST /api/approval/dean/:recordId
 */
const deanApprove = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { comment = '' } = req.body;

        await gateway.connect(req.user);
        await gateway.submitTransaction('DeanAcademicApprove', recordId, comment);

        res.json({
            success: true,
            message: 'Dean Academic approval recorded. Ready for DAC finalization.',
            data: { recordId, status: 'DEAN_APPROVED', approvedBy: req.user.username }
        });
    } catch (error) {
        logger.error(`deanApprove error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * DAC member gives FINAL approval (DEAN_APPROVED → FINALIZED + auto-calculates CGPA)
 * POST /api/approval/dac/:recordId
 */
const dacApprove = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { comment = '', memberRole = 'dac_member' } = req.body;

        await gateway.connect(req.user);

        let studentId = req.body.studentId;
        if (!studentId) {
            try {
                const rec = JSON.parse((await gateway.evaluateTransaction('GetAcademicRecord', recordId)).toString());
                studentId = rec.studentID || rec.studentId;
            } catch (_) { }
        }

        await gateway.submitTransaction('DACApprove', recordId, memberRole, comment);

        // Notify student of final approval
        if (studentId) {
            const { email } = await getStudentEmail(gateway, studentId);
            notifyApprovalStep(req.app.get('io'), {
                studentId, studentEmail: email, recordId,
                newStatus: 'FINALIZED', approvedBy: req.user.username
            }).catch(() => { });
        }

        res.json({
            success: true,
            message: 'DAC approval recorded — record is now FINALIZED and CGPA updated',
            data: { recordId, status: 'FINALIZED', approvedBy: req.user.username }
        });
    } catch (error) {
        logger.error(`dacApprove error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Reject a record and send it back to DRAFT (any approver at any stage)
 * POST /api/approval/reject/:recordId
 */
const rejectRecord = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

        await gateway.connect(req.user);
        let studentId = req.body.studentId;
        if (!studentId) {
            try {
                const rec = JSON.parse((await gateway.evaluateTransaction('GetAcademicRecord', recordId)).toString());
                studentId = rec.studentID;
            } catch (_) { }
        }

        await gateway.submitTransaction('RejectRecord', recordId, reason);

        if (studentId) {
            const { email } = await getStudentEmail(gateway, studentId);
            notifyRejection(req.app.get('io'), {
                studentId, studentEmail: email, recordId,
                rejectedBy: req.user.username, reason
            }).catch(() => { });
        }

        res.json({
            success: true,
            message: 'Record rejected and sent back to DRAFT for correction',
            data: { recordId, status: 'DRAFT', rejectedBy: req.user.username, reason }
        });
    } catch (error) {
        logger.error(`rejectRecord error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Get the full approval chain status for a record
 * GET /api/approval/status/:recordId
 */
const getApprovalStatus = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { recordId } = req.params;

        await gateway.connect(req.user);
        const result = await gateway.evaluateTransaction('GetApprovalStatus', recordId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error(`getApprovalStatus error: ${error.message}`);
        // Return empty scaffold if approval record not yet initialized
        res.json({
            success: true,
            data: {
                recordId: req.params.recordId,
                currentStatus: 'DRAFT',
                approvalChain: [],
                rejections: []
            }
        });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Get all records at a specific approval stage (for role-based dashboards)
 * GET /api/approval/queue/:status
 */
const getApprovalQueue = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { status } = req.params;
        const validStatuses = ['SUBMITTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'DAC_APPROVED', 'ES_APPROVED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
            });
        }

        await gateway.connect(req.user);
        // Use existing QueryRecordsByStatus chaincode function
        const result = await gateway.evaluateTransaction('QueryRecordsByStatus', status, '', '50');

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error(`getApprovalQueue error: ${error.message}`);
        res.json({ success: true, data: { records: [], count: 0 } });
    } finally {
        await gateway.disconnect();
    }
};

module.exports = {
    submitForApproval,
    facultyApprove,
    hodApprove,
    dacApprove,
    examSectionApprove,
    deanApprove,
    rejectRecord,
    getApprovalStatus,
    getApprovalQueue
};
