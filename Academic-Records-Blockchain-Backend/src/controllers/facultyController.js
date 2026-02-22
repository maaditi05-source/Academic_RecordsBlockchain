const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');

/**
 * FacultyController
 * All blockchain operations use the central FabricGateway class so that
 * CONNECTION_PROFILE_PATH is always loaded from .env — no more hardcoded paths.
 */
class FacultyController {

    /**
     * Get faculty profile by ID
     */
    static async getFacultyProfile(req, res) {
        const gateway = new FabricGateway();
        try {
            const { facultyId } = req.params;
            const role = req.user.role;

            if (role !== 'admin' && req.user.username !== facultyId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('GetFaculty', facultyId);
            const faculty = result;

            logger.info(`Faculty profile retrieved for ${facultyId}`);
            res.status(200).json({ success: true, data: faculty });
        } catch (error) {
            logger.error('Error getting faculty profile:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get all faculty (admin only)
     */
    static async getAllFaculty(req, res) {
        const gateway = new FabricGateway();
        try {
            const role = req.user.role;

            if (role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('GetAllFaculty');

            let faculty = [];
            if (result && typeof result === 'object') {
                try {
                    faculty = result;
                } catch (e) {
                    faculty = [];
                }
            }

            logger.info('All faculty retrieved');
            res.status(200).json({ success: true, data: faculty });
        } catch (error) {
            logger.error('Error getting all faculty:', error);
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
                return res.status(200).json({ success: true, data: [], message: 'No faculty found' });
            }
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get courses assigned to faculty
     */
    static async getFacultyCourses(req, res) {
        const gateway = new FabricGateway();
        try {
            const { facultyId } = req.params;
            const role = req.user.role;

            if (role !== 'admin' && req.user.username !== facultyId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            // Chaincode function may not exist yet; return empty safely
            let courses = [];
            try {
                await gateway.connect(req.user);
                const result = await gateway.evaluateTransaction('GetCoursesByFaculty', facultyId);
                if (result && typeof result === 'object') {
                    courses = result;
                }
            } catch (e) {
                logger.warn(`GetCoursesByFaculty not available or no courses: ${e.message}`);
            }

            res.status(200).json({
                success: true,
                data: courses,
                message: courses.length ? `Found ${courses.length} courses` : 'No courses assigned yet'
            });
        } catch (error) {
            logger.error('Error getting faculty courses:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get students in faculty's department
     */
    static async getStudentsByFaculty(req, res) {
        const gateway = new FabricGateway();
        try {
            const { facultyId } = req.params;
            const role = req.user.role;

            if (role !== 'admin' && role !== 'registrar' && req.user.username !== facultyId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            const facultyDepartment = req.user.department;
            if (!facultyDepartment) {
                return res.status(400).json({ success: false, message: 'Faculty department not found in token' });
            }

            let students = [];
            try {
                await gateway.connect(req.user);
                const result = await gateway.evaluateTransaction('GetStudentsByFaculty', facultyId, facultyDepartment);
                if (result && typeof result === 'object') {
                    students = result;
                }
            } catch (e) {
                // Try QueryStudentsByDepartment as fallback
                try {
                    const result = await gateway.evaluateTransaction('QueryStudentsByDepartment', facultyDepartment, '', '1000');
                    const parsed = result;
                    students = Array.isArray(parsed) ? parsed : (parsed.records || []);
                } catch (e2) {
                    logger.warn(`Could not get students for faculty: ${e2.message}`);
                }
            }

            logger.info(`Students retrieved for faculty ${facultyId}: ${students.length}`);
            res.status(200).json({
                success: true,
                data: students,
                message: `Found ${students.length} students in ${facultyDepartment} department`
            });
        } catch (error) {
            logger.error('Error getting students by faculty:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Update faculty profile
     */
    static async updateFacultyProfile(req, res) {
        const gateway = new FabricGateway();
        try {
            const { facultyId } = req.params;
            const role = req.user.role;
            const updateData = req.body;

            if (role !== 'admin' && req.user.username !== facultyId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            await gateway.submitTransaction('UpdateFaculty', facultyId, JSON.stringify(updateData));

            logger.info(`Faculty profile updated for ${facultyId}`);
            res.status(200).json({ success: true, message: 'Faculty profile updated successfully' });
        } catch (error) {
            logger.error('Error updating faculty profile:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get academic records for faculty
     */
    static async getRecordsByFaculty(req, res) {
        const gateway = new FabricGateway();
        try {
            const { facultyId } = req.params;
            const role = req.user.role;

            if (role !== 'admin' && role !== 'registrar' && req.user.username !== facultyId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            let facultyRecords = [];
            try {
                await gateway.connect(req.user);
                const result = await gateway.evaluateTransaction('GetAllAcademicRecords');
                if (result && typeof result === 'object') {
                    const allRecords = result;
                    facultyRecords = allRecords.filter(r =>
                        r.submittedBy === facultyId || r.submittedBy === req.user.username
                    );
                }
            } catch (e) {
                logger.warn(`Could not get records for faculty: ${e.message}`);
            }

            res.status(200).json({
                success: true,
                data: facultyRecords,
                message: `Found ${facultyRecords.length} records`
            });
        } catch (error) {
            logger.error('Error getting records by faculty:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }
}

module.exports = FacultyController;
