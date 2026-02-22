/**
 * Semester Controller
 * Handles semester-wise registration of students on the blockchain.
 */

const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');

/**
 * Register a student for a semester
 * POST /api/semester/register
 * Body: { studentId, semester, academicYear, facultyAdvisor }
 */
const registerForSemester = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId, semester, academicYear, facultyAdvisor = '' } = req.body;

        if (!studentId || !semester || !academicYear) {
            return res.status(400).json({
                success: false,
                message: 'studentId, semester, and academicYear are required'
            });
        }

        const semInt = parseInt(semester);
        if (isNaN(semInt) || semInt < 1 || semInt > 8) {
            return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8' });
        }

        // Generate registration ID
        const regId = `REG-${studentId}-SEM${semInt}-${academicYear.replace(/[^A-Za-z0-9]/g, '')}`;

        await gateway.connect(req.user);
        await gateway.submitTransaction(
            'RegisterForSemester',
            regId,
            studentId,
            academicYear,
            facultyAdvisor,
            semInt.toString()
        );

        logger.info(`Student ${studentId} registered for semester ${semInt} (${academicYear})`);

        res.json({
            success: true,
            message: `Student ${studentId} registered for Semester ${semInt} successfully`,
            data: {
                regId,
                studentId,
                semester: semInt,
                academicYear,
                facultyAdvisor,
                status: 'REGISTERED'
            }
        });
    } catch (error) {
        logger.error(`registerForSemester error: ${error.message}`);
        if (error.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: 'Student already registered for this semester' });
        }
        res.status(500).json({ success: false, message: error.message });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Get a specific semester registration
 * GET /api/semester/:regId
 */
const getSemesterRegistration = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { regId } = req.params;

        await gateway.connect(req.user);
        const result = await gateway.evaluateTransaction('GetSemesterRegistration', regId);

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error(`getSemesterRegistration error: ${error.message}`);
        res.status(404).json({ success: false, message: `Registration ${req.params.regId} not found` });
    } finally {
        await gateway.disconnect();
    }
};

/**
 * Get all semester registrations for a student
 * GET /api/semester/student/:studentId
 */
const getStudentSemesters = async (req, res) => {
    const gateway = new FabricGateway();
    try {
        const { studentId } = req.params;

        await gateway.connect(req.user);
        const result = await gateway.evaluateTransaction('GetSemesterRegistrationsByStudent', studentId);

        res.json({
            success: true,
            data: Array.isArray(result) ? result : []
        });
    } catch (error) {
        logger.error(`getStudentSemesters error: ${error.message}`);
        res.json({ success: true, data: [] });
    } finally {
        await gateway.disconnect();
    }
};

module.exports = {
    registerForSemester,
    getSemesterRegistration,
    getStudentSemesters
};
