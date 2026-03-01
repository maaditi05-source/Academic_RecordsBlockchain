require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server: SocketIO } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const FabricGateway = require('./fabricGateway');
const EventListener = require('./eventListener');
const {
    APP_CONFIG,
    validateConfig,
    printConfigSummary,
    isDevelopment
} = require('./config/app.config');

// Validate configuration on startup
try {
    validateConfig();
    if (isDevelopment()) {
        printConfigSummary();
    }
} catch (error) {
    console.error('Configuration validation failed:', error.message);
    process.exit(1);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recordRoutes = require('./routes/recordRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const identityRoutes = require('./routes/identityRoutes');
const statsRoutes = require('./routes/statsRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const documentRoutes = require('./routes/documentRoutes');
const semesterRoutes = require('./routes/semesterRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const consentRoutes = require('./routes/consentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const marksRoutes = require('./routes/marksRoutes');
const coursesRoutes = require('./routes/coursesRoutes');
const setupSwagger = require('./config/swagger');

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new SocketIO(httpServer, {
    cors: {
        origin: APP_CONFIG.security?.cors?.origins || ['http://localhost:4200'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        socket.join(`user:${userId}`);
        logger.info(`[Socket.io] User ${userId} connected (${socket.id})`);
    }
    socket.on('disconnect', () => {
        logger.info(`[Socket.io] Socket ${socket.id} disconnected`);
    });
});

// Global event listener instance
let eventListener = null;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: APP_CONFIG.security.cors.origins,
    credentials: APP_CONFIG.security.cors.credentials,
    methods: APP_CONFIG.security.cors.methods,
    allowedHeaders: APP_CONFIG.security.cors.allowedHeaders
}));
app.use(bodyParser.json({ limit: APP_CONFIG.performance.limits.jsonBodySize }));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: APP_CONFIG.performance.limits.urlEncodedBodySize
}));

// Logging
if (APP_CONFIG.logging.requests.enabled) {
    app.use(morgan(APP_CONFIG.logging.requests.format, {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: APP_CONFIG.security.rateLimit.windowMs,
    max: APP_CONFIG.security.rateLimit.maxRequests,
    message: APP_CONFIG.security.rateLimit.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: APP_CONFIG.security.rateLimit.skipSuccessfulRequests
});
app.use(`${APP_CONFIG.server.apiPrefix}/`, limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        environment: APP_CONFIG.server.nodeEnv,
        timestamp: new Date().toISOString(),
        eventListener: eventListener ? eventListener.getStatus() : { isListening: false }
    });
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.send('OK');
});

// API Routes
app.use(`${APP_CONFIG.server.apiPrefix}/auth`, authRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/students`, studentRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/records`, recordRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/certificates`, certificateRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/identities`, identityRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/stats`, statsRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/department`, departmentRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/departments`, departmentRoutes); // alias
app.use(`${APP_CONFIG.server.apiPrefix}/faculty`, facultyRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/approval`, approvalRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/documents`, documentRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/semester`, semesterRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/pdf`, pdfRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/consent`, consentRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/reports`, reportRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/marks`, marksRoutes);
app.use(`${APP_CONFIG.server.apiPrefix}/courses`, coursesRoutes);


// Serve uploaded files and generated certificates
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Swagger API docs
setupSwagger(app);

// Event listener status endpoint
app.get(`${APP_CONFIG.server.apiPrefix}/events/status`, (req, res) => {
    if (eventListener) {
        res.status(200).json({
            success: true,
            data: eventListener.getStatus()
        });
    } else {
        res.status(200).json({
            success: true,
            data: { isListening: false, message: 'Event listener not initialized' }
        });
    }
});

// Start/stop event listener endpoints
app.post(`${APP_CONFIG.server.apiPrefix}/events/start`, async (req, res) => {
    try {
        if (eventListener && eventListener.getStatus().isListening) {
            return res.status(400).json({
                success: false,
                message: 'Event listener is already running'
            });
        }

        const gateway = new FabricGateway();
        await gateway.connect('admin');
        const network = gateway.getNetwork();
        const contract = gateway.getContract();

        eventListener = new EventListener(network, contract);
        await eventListener.startListening();

        res.status(200).json({
            success: true,
            message: 'Event listener started successfully',
            data: eventListener.getStatus()
        });
    } catch (error) {
        logger.error(`Error starting event listener: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.post(`${APP_CONFIG.server.apiPrefix}/events/stop`, async (req, res) => {
    try {
        if (!eventListener) {
            return res.status(400).json({
                success: false,
                message: 'Event listener is not running'
            });
        }

        await eventListener.stopListening();
        eventListener = null;

        res.status(200).json({
            success: true,
            message: 'Event listener stopped successfully'
        });
    } catch (error) {
        logger.error(`Error stopping event listener: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Initialize event listener on server start
async function initializeEventListener() {
    // Disabled due to SDK compatibility issues
    // Event listener functionality can be added later
    logger.info('Event listener disabled - SDK compatibility issue');
    logger.info('Server running without event notifications');
    return;

    if (APP_CONFIG.events.enabled) {
        try {
            logger.info('Initializing event listener...');
            const gateway = new FabricGateway();
            await gateway.connect(APP_CONFIG.fabric.admin.userId);
            const network = gateway.getNetwork();
            const contract = gateway.getContract();

            eventListener = new EventListener(network, contract);
            await eventListener.startListening();
            logger.info('Event listener initialized successfully');
        } catch (error) {
            logger.error(`Failed to initialize event listener: ${error.message}`);
            logger.warn('Server will start without event listener. You can start it manually via API.');
        }
    }
}

const syncWalletOnStartup = require('./utils/walletSync');

// Auto-seed: re-populate missing student records AND departments on the blockchain after network restart
async function autoSeedBlockchain() {
    try {
        const path = require('path');
        const fs = require('fs');

        const FabricGateway = require('./fabricGateway');
        const gateway = new FabricGateway();
        const adminUser = { userId: 'admin', role: 'admin', username: 'admin' };

        try {
            await gateway.connect(adminUser);
        } catch (err) {
            logger.warn(`Auto-seed skipped (cannot connect to Fabric): ${err.message}`);
            return;
        }

        // ── Seed Students ──────────────────────────────────────
        const USERS_FILE = path.join(__dirname, '../data/users.json');
        const raw = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(raw);
        const students = users.filter(u => u.role === 'student' && u.isActive);

        let created = 0, skipped = 0;
        for (const s of students) {
            const roll = s.username;
            try {
                await gateway.evaluateTransaction('GetStudent', roll);
                skipped++;
            } catch (_) {
                try {
                    const transientData = {
                        aadhaarHash: Buffer.from(`HASH-${roll}`),
                        phone: Buffer.from(s.phone || '0000000000'),
                        personalEmail: Buffer.from(s.email || `${roll}@student.nitw.ac.in`),
                    };
                    await gateway.submitTransactionWithTransient(
                        'CreateStudent', transientData,
                        roll, s.name || roll, s.department || 'CSE',
                        (s.enrollmentYear || new Date().getFullYear()).toString(),
                        s.email || `${roll}@student.nitw.ac.in`,
                        s.admissionCategory || 'GENERAL'
                    );
                    created++;
                } catch (e) {
                    logger.warn(`Auto-seed: could not create student ${roll}: ${e.message}`);
                }
            }
        }
        if (created > 0) logger.info(`🌱 Auto-seed: created ${created} student(s) on blockchain (${skipped} already existed)`);
        else logger.info(`🌱 Auto-seed: all ${skipped} student(s) already on blockchain`);

        // ── Seed Departments ───────────────────────────────────
        const DEPT_FILE = path.join(__dirname, '../data/departments.json');
        if (fs.existsSync(DEPT_FILE)) {
            const depts = JSON.parse(fs.readFileSync(DEPT_FILE, 'utf8'));
            let dCreated = 0, dSkipped = 0;
            for (const d of depts) {
                try {
                    await gateway.evaluateTransaction('GetDepartment', d.departmentId);
                    dSkipped++;
                } catch (_) {
                    try {
                        await gateway.submitTransaction(
                            'CreateDepartment',
                            d.departmentId,
                            d.name,
                            d.hodId || '',
                            d.email || `${d.departmentId.toLowerCase()}@nitw.ac.in`,
                            d.phone || ''
                        );
                        dCreated++;
                    } catch (e) {
                        logger.warn(`Auto-seed: could not create department ${d.departmentId}: ${e.message}`);
                    }
                }
            }
            if (dCreated > 0) logger.info(`🏢 Auto-seed: created ${dCreated} department(s) on blockchain (${dSkipped} already existed)`);
            else if (dSkipped > 0) logger.info(`🏢 Auto-seed: all ${dSkipped} department(s) already on blockchain`);
        }

        // ── Seed Courses ───────────────────────────────────────
        const COURSES_FILE = path.join(__dirname, '../data/courses.json');
        if (fs.existsSync(COURSES_FILE)) {
            const courses = JSON.parse(fs.readFileSync(COURSES_FILE, 'utf8'));
            let cCreated = 0, cSkipped = 0;
            for (const c of courses) {
                try {
                    await gateway.evaluateTransaction('GetCourseOffering', c.code);
                    cSkipped++;
                } catch (_) {
                    try {
                        await gateway.submitTransaction(
                            'CreateCourseOffering',
                            c.code,
                            c.name,
                            c.department || 'CSE',
                            String(c.semester || 1),
                            String(c.credits || 3),
                            c.faculty || '',
                            c.type || 'core'
                        );
                        cCreated++;
                    } catch (e) {
                        logger.warn(`Auto-seed: could not create course ${c.code}: ${e.message}`);
                    }
                }
            }
            if (cCreated > 0) logger.info(`📚 Auto-seed: created ${cCreated} course(s) on blockchain (${cSkipped} already existed)`);
            else if (cSkipped > 0) logger.info(`📚 Auto-seed: all ${cSkipped} course(s) already on blockchain`);
        }

        await gateway.disconnect();
    } catch (err) {
        logger.warn(`Auto-seed skipped: ${err.message}`);
    }
}

// Start server
async function startServer() {
    await syncWalletOnStartup();
    await autoSeedBlockchain();

    httpServer.listen(APP_CONFIG.server.port, APP_CONFIG.server.host, async () => {
        logger.info(`🚀 Academic Records Backend Server running on ${APP_CONFIG.server.host}:${APP_CONFIG.server.port}`);
        logger.info(`📡 Environment: ${APP_CONFIG.server.nodeEnv}`);
        logger.info(`📋 Health check: http://localhost:${APP_CONFIG.server.port}/health`);
        logger.info(`🔗 API Base URL: http://localhost:${APP_CONFIG.server.port}${APP_CONFIG.server.apiPrefix}`);
        logger.info(`📚 Swagger Docs: http://localhost:${APP_CONFIG.server.port}/api-docs`);
        logger.info(`🔗 Channel: ${APP_CONFIG.fabric.channelName}`);
        logger.info(`📦 Chaincode: ${APP_CONFIG.fabric.chaincodeName}`);
        logger.info(`🔔 Socket.io: real-time notifications enabled`);

        // Initialize event listener
        await initializeEventListener();
    });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down gracefully...');

    if (eventListener) {
        await eventListener.stopListening();
    }

    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down gracefully...');

    if (eventListener) {
        await eventListener.stopListening();
    }

    process.exit(0);
});

module.exports = { app, httpServer, io };
