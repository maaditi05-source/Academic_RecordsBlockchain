const FabricGateway = require('../fabricGateway');
const logger = require('../utils/logger');
const { createUser } = require('../utils/userManager');

/**
 * DepartmentController
 * All blockchain operations use the central FabricGateway class so that
 * CONNECTION_PROFILE_PATH is always loaded from .env — no more hardcoded paths.
 */
class DepartmentController {

    /**
     * Get department profile
     */
    static async getDepartmentProfile(req, res) {
        const gateway = new FabricGateway();
        try {
            let { departmentId } = req.params;
            departmentId = departmentId.toUpperCase();

            const userDept = req.user.department ? req.user.department.toUpperCase() : null;
            const role = req.user.role;

            if (role !== 'admin' && userDept !== departmentId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('GetDepartment', departmentId);
            const department = result;

            res.status(200).json({ success: true, data: department });
        } catch (error) {
            logger.error('Error getting department profile:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get all departments (admin or department role)
     */
    static async getAllDepartments(req, res) {
        const gateway = new FabricGateway();
        try {
            const role = req.user.role;

            if (role !== 'admin' && role !== 'department') {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('GetAllDepartments');

            // Handle empty or null response gracefully
            let departments = [];
            if (result && typeof result === 'object') {
                try {
                    departments = result;
                } catch (parseErr) {
                    logger.warn('GetAllDepartments returned non-JSON, returning empty array');
                    departments = [];
                }
            }

            res.status(200).json({ success: true, data: departments });
        } catch (error) {
            logger.error('Error getting all departments:', error);
            // If no departments exist yet, return empty list
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
                return res.status(200).json({ success: true, data: [], message: 'No departments found' });
            }
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get courses offered by department
     */
    static async getDepartmentCourses(req, res) {
        const gateway = new FabricGateway();
        try {
            let { departmentId } = req.params;
            departmentId = departmentId.toUpperCase();

            const userDept = req.user.department ? req.user.department.toUpperCase() : null;
            const role = req.user.role;

            if (role !== 'admin' && userDept !== departmentId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('GetCoursesByDepartment', departmentId);

            let courses = [];
            if (result && typeof result === 'object') {
                try {
                    courses = result;
                } catch (e) {
                    courses = [];
                }
            }

            res.status(200).json({
                success: true,
                data: courses,
                message: `Found ${courses.length} courses`
            });
        } catch (error) {
            logger.error('Error getting department courses:', error);
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
                return res.status(200).json({ success: true, data: [], message: 'No courses found' });
            }
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get students in department
     */
    static async getStudentsByDepartment(req, res) {
        const gateway = new FabricGateway();
        try {
            let { departmentId } = req.params;
            departmentId = departmentId.toUpperCase();

            const userDept = req.user.department ? req.user.department.toUpperCase() : null;
            const role = req.user.role;

            if (role !== 'admin' && userDept !== departmentId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);
            const result = await gateway.evaluateTransaction('QueryStudentsByDepartment', departmentId, '', '1000');

            let students = [];
            if (result && typeof result === 'object') {
                try {
                    const parsed = result;
                    students = Array.isArray(parsed) ? parsed : (parsed.records || []);
                } catch (e) {
                    students = [];
                }
            }

            res.status(200).json({
                success: true,
                data: students,
                message: `Found ${students.length} students in ${departmentId} department`
            });
        } catch (error) {
            logger.error('Error getting students by department:', error);
            if (error.message.includes('does not exist') || error.message.includes('not found')) {
                return res.status(200).json({ success: true, data: [], message: 'No students found' });
            }
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Create new department (admin only)
     */
    static async createDepartment(req, res) {
        const gateway = new FabricGateway();
        try {
            const role = req.user.role;

            if (role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
            }

            let { departmentId, departmentName, hod, email, phone } = req.body;

            if (!departmentId || !departmentName) {
                return res.status(400).json({
                    success: false,
                    message: 'departmentId and departmentName are required'
                });
            }

            departmentId = departmentId.toUpperCase();

            await gateway.connect(req.user);

            await gateway.submitTransaction(
                'CreateDepartment',
                departmentId,
                departmentName,
                hod || 'TBD',
                email || `${departmentId.toLowerCase()}@nitw.ac.in`,
                phone || '0000000000'
            );

            await gateway.disconnect();

            logger.info(`Department ${departmentId} created successfully on blockchain`);

            // Create department login account
            try {
                const departmentPassword = departmentId.length >= 6 ? departmentId : `${departmentId}123`;
                await createUser({
                    username: departmentId,
                    password: departmentPassword,
                    email: email || `${departmentId.toLowerCase()}@nitw.ac.in`,
                    role: 'department',
                    department: departmentId
                });

                logger.info(`Department user account created: ${departmentId}`);

                res.status(201).json({
                    success: true,
                    message: 'Department created successfully',
                    data: {
                        departmentId,
                        departmentName,
                        credentials: {
                            username: departmentId,
                            password: departmentPassword,
                            note: 'Please change password after first login'
                        }
                    }
                });
            } catch (userError) {
                logger.warn(`Department blockchain record created but user account failed: ${userError.message}`);
                res.status(201).json({
                    success: true,
                    message: 'Department created on blockchain. User account already exists or creation failed.',
                    warning: userError.message,
                    data: { departmentId, departmentName }
                });
            }

        } catch (error) {
            logger.error('Error creating department:', error);
            await gateway.disconnect();
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Create course offering
     */
    static async createCourseOffering(req, res) {
        const gateway = new FabricGateway();
        try {
            const userDept = req.user.department ? req.user.department.toUpperCase() : null;
            const role = req.user.role;
            let { departmentId, courseCode, courseName, credits, semester, academicYear } = req.body;

            if (!departmentId || !courseCode || !courseName || !credits || !semester || !academicYear) {
                return res.status(400).json({
                    success: false,
                    message: 'departmentId, courseCode, courseName, credits, semester, and academicYear are required'
                });
            }

            departmentId = departmentId.toUpperCase();

            if (role !== 'admin' && userDept !== departmentId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);

            await gateway.submitTransaction(
                'CreateCourseOffering',
                departmentId,
                courseCode,
                courseName,
                credits.toString(),
                semester.toString(),
                academicYear
            );

            logger.info(`Course ${courseCode} created for department ${departmentId}`);

            res.status(201).json({ success: true, message: 'Course offering created successfully' });
        } catch (error) {
            logger.error('Error creating course offering:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }

    /**
     * Get academic records submitted by department
     */
    static async getRecordsByDepartment(req, res) {
        const gateway = new FabricGateway();
        try {
            let { departmentId } = req.params;
            departmentId = departmentId.toUpperCase();

            const userDept = req.user.department ? req.user.department.toUpperCase() : null;
            const role = req.user.role;

            if (role !== 'admin' && userDept !== departmentId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }

            await gateway.connect(req.user);

            let departmentRecords = [];

            try {
                const pendingResult = await gateway.evaluateTransaction('QueryPendingRecords', '', '1000');
                const pendingData = JSON.parse(pendingResult.toString());
                const pending = Array.isArray(pendingData) ? pendingData : (pendingData.records || []);
                departmentRecords.push(...pending.filter(r => r.department === departmentId));
            } catch (e) { /* no pending records */ }

            try {
                const approvedResult = await gateway.evaluateTransaction('QueryRecordsByStatus', 'APPROVED', '', '1000');
                const approvedData = JSON.parse(approvedResult.toString());
                const approved = Array.isArray(approvedData) ? approvedData : (approvedData.records || []);
                departmentRecords.push(...approved.filter(r => r.department === departmentId));
            } catch (e) { /* no approved records */ }

            res.status(200).json({
                success: true,
                data: departmentRecords,
                message: `Found ${departmentRecords.length} records`
            });
        } catch (error) {
            logger.error('Error getting records by department:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            await gateway.disconnect();
        }
    }
}

module.exports = DepartmentController;
