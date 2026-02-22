/**
 * Swagger / OpenAPI Configuration
 * Served at: GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Academic Records Blockchain API',
            version: '1.0.0',
            description: `
## NIT Warangal — Blockchain-Powered Academic Certificate System

This API drives the full lifecycle of academic credentials:
- Student registration & profile management
- Document upload with SHA-256 hash anchored on Hyperledger Fabric
- Multi-party sequential approval workflow (Faculty → HOD → DAC → Exam Section → Dean Academic)
- Certificate generation (Puppeteer PDF with QR code)
- Public certificate verification
- Real-time notifications (Socket.io + email)

**Blockchain:** Hyperledger Fabric (Go chaincode)  
**Auth:** JWT Bearer tokens
            `,
            contact: {
                name: 'NIT Warangal Academic Section',
                email: 'academics@nitw.ac.in'
            }
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local Development' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Student: {
                    type: 'object',
                    properties: {
                        rollNumber: { type: 'string', example: 'CS21B001' },
                        name: { type: 'string', example: 'Aditi Mishra' },
                        department: { type: 'string', example: 'CSE' },
                        degree: { type: 'string', example: 'B.Tech' },
                        batchYear: { type: 'string', example: '2021' },
                        email: { type: 'string', example: 'cs21b001@student.nitw.ac.in' }
                    }
                },
                AcademicRecord: {
                    type: 'object',
                    properties: {
                        recordID: { type: 'string' },
                        studentID: { type: 'string' },
                        semester: { type: 'integer' },
                        cgpa: { type: 'number' },
                        status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'DAC_APPROVED', 'ES_APPROVED', 'APPROVED'] },
                        approvalChain: { type: 'array', items: { '$ref': '#/components/schemas/ApprovalStep' } }
                    }
                },
                ApprovalStep: {
                    type: 'object',
                    properties: {
                        role: { type: 'string' },
                        approvedBy: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                        comment: { type: 'string' },
                        txId: { type: 'string' }
                    }
                },
                Certificate: {
                    type: 'object',
                    properties: {
                        certificateID: { type: 'string' },
                        studentID: { type: 'string' },
                        certType: { type: 'string', enum: ['DEGREE', 'TRANSCRIPT', 'BONAFIDE'] },
                        pdfHash: { type: 'string', description: 'SHA-256 of the generated PDF' },
                        ipfsHash: { type: 'string', description: 'IPFS CID of the stored PDF' },
                        issuedAt: { type: 'string', format: 'date-time' }
                    }
                },
                DocumentUpload: {
                    type: 'object',
                    properties: {
                        docId: { type: 'string' },
                        studentID: { type: 'string' },
                        sha256Hash: { type: 'string' },
                        docType: { type: 'string' },
                        semester: { type: 'integer' },
                        academicYear: { type: 'string' },
                        uploadedAt: { type: 'string', format: 'date-time' }
                    }
                },
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Login & registration' },
            { name: 'Students', description: 'Student profile management' },
            { name: 'Records', description: 'Academic records (grades, CGPA)' },
            { name: 'Approval', description: 'Multi-party approval workflow' },
            { name: 'Documents', description: 'Document upload & hash verification' },
            { name: 'Certificates PDF', description: 'PDF certificate generation & download' },
            { name: 'Semester', description: 'Semester registration' },
            { name: 'Certificates', description: 'Certificate issuance (blockchain)' },
            { name: 'Stats', description: 'Dashboard statistics' }
        ]
    },
    apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: `
            .swagger-ui .topbar { background: linear-gradient(135deg, #4c1d95, #1e40af); }
            .swagger-ui .topbar-wrapper a span { display: none; }
            .swagger-ui .topbar-wrapper::before {
                content: '⛓ NIT Warangal Academic Records API';
                color: white; font-weight: 700; font-size: 18px;
            }
        `,
        customSiteTitle: 'NIT Warangal Academic API Docs'
    }));
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

module.exports = setupSwagger;
