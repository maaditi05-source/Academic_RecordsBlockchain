const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { authenticateUser, createUser, findUserByUsername, changePassword } = require('../utils/userManager');
const { getMSPForRole } = require('../utils/mspMapper');
const { Gateway, Wallets } = require('fabric-network');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Store for refresh tokens (in production, use Redis or database)
const refreshTokens = new Map();

/**
 * Generate JWT access token
 * @param {object} user - User object
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role,
            mspId: getMSPForRole(user.role),
            department: user.department,
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

/**
 * Generate JWT refresh token
 * @param {object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(
        {
            userId: user.id,
            username: user.username
        },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRY }
    );

    // Store refresh token
    refreshTokens.set(refreshToken, {
        userId: user.id,
        createdAt: new Date().toISOString()
    });

    return refreshToken;
};

/**
 * Login endpoint
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Accept either username or email
        const loginIdentifier = email || username;

        // Validate input
        if (!loginIdentifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/username and password are required'
            });
        }

        // Authenticate user (try email first, then username)
        let user = await authenticateUser(loginIdentifier, password);

        // If authentication by email failed and email was provided, try finding by username
        if (!user && email) {
            const userByUsername = await findUserByUsername(loginIdentifier);
            if (userByUsername) {
                user = await authenticateUser(userByUsername.username, password);
            }
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Ensure user has a Fabric wallet identity (enroll on-the-fly if missing)
        if (user.role !== 'admin') {
            try {
                const FabricCAClient = require('../fabricCAClient');
                const caClient = FabricCAClient.getCAClientForRole(user.role);
                const wallet = await caClient.getWallet();
                // For students, wallet key = username (= rollNumber)
                // For department/verifier, wallet key = user.id (from auth register flow)
                const walletKey = user.role === 'student' ? user.username : user.id;
                const existingIdentity = await wallet.get(walletKey);
                if (!existingIdentity) {
                    logger.info(`Fabric identity missing for ${walletKey} (${user.role}), enrolling now...`);
                    await caClient.registerUser(
                        walletKey,
                        { role: user.role, department: user.department || '', email: user.email },
                        'client',
                        ''
                    );
                    logger.info(`Fabric identity enrolled on login for: ${walletKey}`);
                }
            } catch (walletErr) {
                // Non-fatal: user can still log in, operations fall back to admin identity
                logger.warn(`Could not enroll Fabric identity on login for ${user.username}: ${walletErr.message}`);
            }
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        logger.info(`User logged in: ${user.username} (${user.role})`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                accessToken,
                refreshToken,
                tokenType: 'Bearer',
                expiresIn: JWT_EXPIRY,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    mspId: getMSPForRole(user.role)
                }
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: error.message
        });
    }
};

/**
 * Register endpoint
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { username, password, email, role, department, name, designation } = req.body;

        // Validate input
        if (!username || !password || !email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, email, and role are required'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Step 1: Create user in database (for authentication)
        const user = await createUser({
            username,
            password,
            email,
            role,
            department: department || null
        });

        logger.info(`User created in database: ${username} (${role})`);

        // Step 2: Enroll user into Fabric CA wallet + create blockchain record
        try {
            const FabricCAClient = require('../fabricCAClient');
            const FabricGateway = require('../fabricGateway');

            // 2a. Enroll the new user in the Fabric CA and store their X.509 identity in the wallet.
            //     Use the role-specific CA (NITWarangalMSP / DepartmentsMSP / VerifiersMSP).
            try {
                const caClient = FabricCAClient.getCAClientForRole(role);
                await caClient.registerUser(
                    user.id,   // wallet key == DB user id
                    {
                        role,
                        department: department || '',
                        email
                    },
                    'client',   // Fabric CA role
                    ''          // affiliation (blank = CA default)
                );
                logger.info(`Fabric identity enrolled for user: ${user.id} (${role})`);
            } catch (enrollErr) {
                // Non-fatal – user can still work, but will fall back to admin identity
                logger.warn(`Could not enroll Fabric identity for ${user.id}: ${enrollErr.message}`);
            }

            // 2b. Create on-chain record (students only; departments use existing dept entities)
            if (role === 'student') {
                const gateway = new FabricGateway();
                try {
                    await gateway.connect('admin'); // admin creates the student record
                    const studentName = name || username;
                    const rollNumber = username;
                    const enrollmentYear = new Date().getFullYear();

                    await gateway.submitTransactionWithTransient(
                        'CreateStudent',
                        { aadhaarHash: `HASH-${rollNumber}`, phone: '0000000000', personalEmail: email },
                        rollNumber,
                        studentName,
                        department || 'CSE',
                        enrollmentYear.toString(),
                        email,
                        'GENERAL'
                    );
                    logger.info(`Student created in blockchain: ${user.id}`);
                } catch (chainErr) {
                    logger.warn(`Blockchain student creation failed for ${user.id}: ${chainErr.message}`);
                } finally {
                    await gateway.disconnect();
                }
            } else if (role === 'department') {
                logger.info(`Department user registered (uses existing department entity): ${user.id}`);
            }

            logger.info(`User registered successfully: ${username} (${role})`);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        department: user.department,
                        mspId: getMSPForRole(user.role)
                    }
                }
            });

        } catch (blockchainError) {
            logger.error(`Blockchain/enrollment error during registration: ${blockchainError.message}`);

            // User is already created in database — still a success
            return res.status(201).json({
                success: true,
                message: 'User registered in database. Blockchain enrollment failed but will retry on first login.',
                warning: blockchainError.message,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        department: user.department,
                        mspId: getMSPForRole(user.role)
                    }
                }
            });
        }

    } catch (error) {
        logger.error(`Registration error: ${error.message}`);

        // Handle specific errors
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Invalid role')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
            error: error.message
        });
    }
};

/**
 * Refresh token endpoint
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Check if refresh token exists in store
        if (!refreshTokens.has(refreshToken)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        // Get user info
        const user = findUserByUsername(decoded.username);

        if (!user || !user.isActive) {
            // Remove invalid refresh token
            refreshTokens.delete(refreshToken);
            return res.status(403).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user);

        logger.info(`Token refreshed for user: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken: newAccessToken,
                tokenType: 'Bearer',
                expiresIn: JWT_EXPIRY
            }
        });
    } catch (error) {
        logger.error(`Token refresh error: ${error.message}`);

        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                success: false,
                message: 'Refresh token expired. Please login again.'
            });
        }

        res.status(403).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken && refreshTokens.has(refreshToken)) {
            refreshTokens.delete(refreshToken);
            logger.info(`User logged out, refresh token removed`);
        }

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred during logout'
        });
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        // req.user is set by authenticateToken middleware
        const user = findUserByUsername(req.user.username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                department: user.department,
                mspId: getMSPForRole(user.role),
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        logger.error(`Get profile error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching profile'
        });
    }
};

/**
 * Change password endpoint
 * POST /api/auth/change-password
 */
const changePasswordEndpoint = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        // Validate input
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Change password
        await changePassword(req.user.userId, oldPassword, newPassword);

        logger.info(`Password changed for user: ${req.user.username}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        logger.error(`Change password error: ${error.message}`);

        if (error.message === 'Current password is incorrect') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while changing password'
        });
    }
};

// Get all users (admin only)
// GET /api/auth/users
const getAllUsers = async (req, res) => {
    try {
        const role = req.user.role;
        if (role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const fs = require('fs');
        const path = require('path');
        const usersFile = path.join(__dirname, '../../data/users.json');

        let users = [];
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            users = JSON.parse(data);
        }

        // Strip passwords before returning
        const safeUsers = users.map(u => ({
            username: u.username,
            name: u.name || u.username,
            email: u.email,
            role: u.role,
            department: u.department || '',
            isActive: u.isActive !== false,
            createdAt: u.createdAt || null
        }));

        res.json({ success: true, data: safeUsers });
    } catch (err) {
        logger.error(`Error getting users: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    login,
    register,
    refresh,
    logout,
    getProfile,
    changePasswordEndpoint,
    getAllUsers
};
