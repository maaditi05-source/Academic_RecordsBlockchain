/**
 * Notification Service
 * Handles both:
 *  - Real-time in-app notifications via Socket.io
 *  - Email notifications via Nodemailer
 *
 * Usage:
 *   const { notifyApprovalStep, notifyCertificateIssued } = require('./notificationService');
 *   notifyApprovalStep(io, studentId, { step, recordId, approvedBy });
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// ─── Email Transport ──────────────────────────────────────────────────────────
// Configure via env vars. Defaults to Ethereal (test SMTP — emails are previewed online, not sent)
let transporter = null;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.EMAIL_HOST) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        logger.info('Email transporter configured from env');
    } else {
        // Use Ethereal test account (no real emails sent — just logged)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass }
        });
        logger.info(`Using Ethereal test email. Preview at: https://ethereal.email`);
    }
    return transporter;
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function approvalStepEmailHTML(step, recordId, approvedBy, nextStep) {
    return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#4c1d95,#1e40af);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
        <h1 style="color:#fff;font-size:20px;margin:0">📋 Approval Update</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">NIT Warangal Academic Records</p>
      </div>
      <p style="color:#374151;font-size:15px">Your academic record has moved to the next stage:</p>
      <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #7c3aed">
        <p style="margin:0;font-size:13px;color:#6b7280">Record ID</p>
        <p style="margin:4px 0 12px;font-weight:700;font-family:monospace">${recordId}</p>
        <p style="margin:0;font-size:13px;color:#6b7280">Stage Completed</p>
        <p style="margin:4px 0 12px;font-weight:700;color:#059669">✓ ${step}</p>
        <p style="margin:0;font-size:13px;color:#6b7280">Approved By</p>
        <p style="margin:4px 0 0;font-weight:600">${approvedBy}</p>
      </div>
      ${nextStep ? `<p style="color:#374151">Next step: <strong>${nextStep}</strong> approval is now pending.</p>` :
            `<p style="color:#059669;font-weight:700">🎉 All approvals complete! Your certificate will be issued shortly.</p>`}
      <p style="color:#9ca3af;font-size:12px;margin-top:20px">This is an automated notification from the NIT Warangal Academic Records System.</p>
    </div>`;
}

function certificateIssuedEmailHTML(certId, studentName, degree) {
    return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#059669,#0d9488);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
        <h1 style="color:#fff;font-size:22px;margin:0">🎓 Certificate Issued!</h1>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">NIT Warangal</p>
      </div>
      <p style="color:#374151;font-size:15px">Dear <strong>${studentName}</strong>,</p>
      <p style="color:#374151">Your <strong>${degree}</strong> certificate has been issued and anchored on the blockchain.</p>
      <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #059669">
        <p style="margin:0;font-size:13px;color:#6b7280">Certificate ID</p>
        <p style="margin:4px 0;font-weight:700;font-family:monospace">${certId}</p>
      </div>
      <p style="color:#374151">Log in to download your certificate and share it with employers or institutions.</p>
    </div>`;
}

// ─── Send Email ───────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
    try {
        const t = await getTransporter();
        const info = await t.sendMail({
            from: process.env.EMAIL_FROM || '"NIT Warangal Academic Records" <noreply@nitw.ac.in>',
            to,
            subject,
            html
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) logger.info(`Email preview: ${previewUrl}`);
        return info;
    } catch (err) {
        logger.error(`Email send failed: ${err.message}`);
    }
}

// ─── Socket.io Helpers ────────────────────────────────────────────────────────
/**
 * Notify a student (by their userId channel) of an approval step.
 * Call this from approvalController after successful blockchain tx.
 * @param {Object} io - socket.io server instance (from req.app.get('io'))
 */
function emitToUser(io, userId, event, data) {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
    logger.info(`[Socket] Emitted '${event}' to user:${userId}`);
}

// ─── High-Level Notification Functions ───────────────────────────────────────
const STEP_LABELS = {
    'FACULTY_APPROVED': 'Faculty',
    'HOD_APPROVED': 'HOD',
    'DAC_APPROVED': 'DAC Committee',
    'ES_APPROVED': 'Exam Section',
    'APPROVED': 'Dean Academic'
};

const NEXT_STEP = {
    'FACULTY_APPROVED': 'HOD',
    'HOD_APPROVED': 'DAC Committee',
    'DAC_APPROVED': 'Exam Section',
    'ES_APPROVED': 'Dean Academic',
    'APPROVED': null
};

async function notifyApprovalStep(io, { studentId, studentEmail, recordId, newStatus, approvedBy }) {
    const stepLabel = STEP_LABELS[newStatus] || newStatus;
    const nextStep = NEXT_STEP[newStatus];

    // In-app socket notification
    emitToUser(io, studentId, 'approval_update', {
        type: 'approval_step',
        recordId,
        status: newStatus,
        stepLabel,
        approvedBy,
        message: `Your record was approved by ${stepLabel}`,
        timestamp: new Date().toISOString()
    });

    // Email
    if (studentEmail) {
        await sendEmail({
            to: studentEmail,
            subject: `[NIT Warangal] Record ${recordId} — ${stepLabel} Approved`,
            html: approvalStepEmailHTML(stepLabel, recordId, approvedBy, nextStep)
        });
    }
}

async function notifyCertificateIssued(io, { studentId, studentEmail, studentName, certId, degree }) {
    emitToUser(io, studentId, 'certificate_issued', {
        type: 'certificate_issued',
        certId,
        degree,
        message: `Your ${degree} certificate has been issued! 🎓`,
        timestamp: new Date().toISOString()
    });

    if (studentEmail) {
        await sendEmail({
            to: studentEmail,
            subject: `[NIT Warangal] Your ${degree} Certificate is Ready!`,
            html: certificateIssuedEmailHTML(certId, studentName, degree)
        });
    }
}

async function notifyRejection(io, { studentId, studentEmail, recordId, reason, rejectedBy }) {
    emitToUser(io, studentId, 'approval_update', {
        type: 'rejection',
        recordId,
        rejectedBy,
        reason,
        message: `Your record was returned for revision by ${rejectedBy}`,
        timestamp: new Date().toISOString()
    });

    if (studentEmail) {
        await sendEmail({
            to: studentEmail,
            subject: `[NIT Warangal] Record ${recordId} — Returned for Revision`,
            html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#dc2626">Record Returned for Revision</h2>
                <p>Your record <strong>${recordId}</strong> was returned by <strong>${rejectedBy}</strong>.</p>
                <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px;margin:12px 0;border-radius:4px">
                    <strong>Reason:</strong> ${reason}
                </div>
                <p>Please address the feedback and resubmit.</p>
            </div>`
        });
    }
}

module.exports = {
    notifyApprovalStep,
    notifyCertificateIssued,
    notifyRejection,
    emitToUser,
    sendEmail
};
