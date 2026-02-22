/**
 * PDF Generation Service
 * Uses Puppeteer to render a certificate HTML template and export to PDF.
 * Embeds a QR code that links to the public verification portal.
 */

const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

const CERT_DIR = path.join(__dirname, '../../uploads/certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

const APP_URL = process.env.APP_URL || 'http://localhost:4200';

/**
 * Generate QR Code as a base64 data URI
 */
async function generateQRCode(certId) {
    const verifyUrl = `${APP_URL}/verify?id=${certId}`;
    return await QRCode.toDataURL(verifyUrl, {
        width: 150,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' }
    });
}

/**
 * Build the HTML template for a certificate
 */
function buildCertificateHTML({ student, record, certificate, qrCodeDataUrl, approvalChain }) {
    const approverRows = (approvalChain || []).map(step => `
        <tr>
            <td>${step.role || ''}</td>
            <td>${step.approvedBy || ''}</td>
            <td>${step.timestamp ? new Date(step.timestamp).toLocaleDateString('en-IN') : ''}</td>
            <td class="hash">${(step.txId || '').substring(0, 16)}...</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', sans-serif;
    background: #fff;
    color: #1a1a2e;
    width: 1050px;
    padding: 0;
  }

  .certificate {
    width: 1050px;
    min-height: 740px;
    background: #fff;
    border: 12px solid transparent;
    border-image: linear-gradient(135deg, #4c1d95, #1e40af, #065f46) 1;
    padding: 40px 60px;
    position: relative;
  }

  .corner-ornament {
    position: absolute;
    width: 80px; height: 80px;
    opacity: 0.08;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='none' stroke='%234c1d95' stroke-width='3'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%231e40af' stroke-width='2'/%3E%3C/svg%3E") center/contain no-repeat;
  }
  .corner-tl { top: 10px; left: 10px; }
  .corner-tr { top: 10px; right: 10px; }
  .corner-bl { bottom: 10px; left: 10px; }
  .corner-br { bottom: 10px; right: 10px; }

  /* Header */
  .header {
    text-align: center;
    border-bottom: 3px solid #4c1d95;
    padding-bottom: 24px;
    margin-bottom: 24px;
  }
  .institution-name {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    font-weight: 700;
    color: #1e1b4b;
    letter-spacing: 1px;
  }
  .institution-sub {
    font-size: 13px;
    color: #6b7280;
    margin-top: 4px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: #4c1d95;
    margin-top: 14px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* Body */
  .body-text {
    text-align: center;
    margin: 20px 0;
    font-size: 15px;
    color: #374151;
    line-height: 1.8;
  }
  .student-name {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    color: #1e1b4b;
    margin: 8px 0;
  }
  .highlight {
    color: #4c1d95;
    font-weight: 600;
  }

  /* Details Grid */
  .details-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    margin: 20px 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .detail-cell {
    padding: 12px 16px;
    border-right: 1px solid #e5e7eb;
    text-align: center;
  }
  .detail-cell:last-child { border-right: none; }
  .detail-cell:nth-child(n+5) { border-top: 1px solid #e5e7eb; }
  .detail-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9ca3af;
    margin-bottom: 4px;
  }
  .detail-value {
    font-size: 14px;
    font-weight: 600;
    color: #1e1b4b;
  }

  /* Approval Chain */
  .approval-section {
    margin-top: 20px;
  }
  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #6b7280;
    margin-bottom: 10px;
    font-weight: 600;
  }
  .approval-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .approval-table th {
    background: #f3f4f6;
    padding: 8px 12px;
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #6b7280;
    border: 1px solid #e5e7eb;
  }
  .approval-table td {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    color: #374151;
  }
  .hash { font-family: monospace; color: #6b7280; font-size: 10px; }

  /* Footer Row: Hashes + QR */
  .footer-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    gap: 20px;
  }
  .hash-block { flex: 1; }
  .hash-block p { font-size: 10px; color: #9ca3af; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .hash-value {
    font-family: monospace;
    font-size: 9px;
    color: #374151;
    word-break: break-all;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 6px 8px;
    border-radius: 4px;
  }
  .qr-block { text-align: center; }
  .qr-block p { font-size: 10px; color: #9ca3af; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }

  .validity-banner {
    text-align: center;
    margin-top: 10px;
    font-size: 11px;
    color: #6b7280;
    letter-spacing: 1px;
  }
  .blockchain-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #15803d;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 6px;
  }
</style>
</head>
<body>
<div class="certificate">
  <div class="corner-ornament corner-tl"></div>
  <div class="corner-ornament corner-tr"></div>
  <div class="corner-ornament corner-bl"></div>
  <div class="corner-ornament corner-br"></div>

  <!-- Header -->
  <div class="header">
    <div class="institution-name">National Institute of Technology Warangal</div>
    <div class="institution-sub">Institute of National Importance · Established 1959</div>
    <div class="cert-title">🎓 &nbsp; ${certificate?.certType || 'Academic Certificate'}</div>
  </div>

  <!-- Body -->
  <div class="body-text">
    <p>This is to certify that</p>
    <p class="student-name">${student?.name || student?.rollNumber || 'Student'}</p>
    <p>
      having Roll Number <span class="highlight">${student?.rollNumber || ''}</span>, 
      enrolled in <span class="highlight">${student?.degree || 'B.Tech'}</span> — 
      Department of <span class="highlight">${student?.department || ''}</span>,
      has successfully completed the academic requirements
      with a Cumulative GPA of <span class="highlight">${record?.cgpa || '—'}</span>.
    </p>
  </div>

  <!-- Details Grid -->
  <div class="details-grid">
    <div class="detail-cell">
      <div class="detail-label">Certificate ID</div>
      <div class="detail-value" style="font-size:11px;font-family:monospace">${certificate?.certificateID || ''}</div>
    </div>
    <div class="detail-cell">
      <div class="detail-label">Issue Date</div>
      <div class="detail-value">${certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="detail-cell">
      <div class="detail-label">Academic Year</div>
      <div class="detail-value">${record?.academicYear || '—'}</div>
    </div>
    <div class="detail-cell">
      <div class="detail-label">Status</div>
      <div class="detail-value" style="color:#15803d">✓ Valid & Verified</div>
    </div>
  </div>

  <!-- Approval Chain -->
  ${approverRows ? `
  <div class="approval-section">
    <p class="section-title">Multi-Party Approval Chain (Blockchain-Anchored)</p>
    <table class="approval-table">
      <thead>
        <tr>
          <th>Role</th>
          <th>Approved By</th>
          <th>Date</th>
          <th>Transaction ID</th>
        </tr>
      </thead>
      <tbody>${approverRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Footer: Hashes + QR -->
  <div class="footer-row">
    <div class="hash-block">
      <p>Certificate Hash (SHA-256)</p>
      <div class="hash-value">${certificate?.pdfHash || 'To be computed after PDF generation'}</div>
      <p style="margin-top:8px">IPFS / Blockchain Record</p>
      <div class="hash-value">${certificate?.ipfsHash || record?.id || '—'}</div>
    </div>
    <div class="qr-block">
      <img src="${qrCodeDataUrl}" width="130" height="130" alt="Verify QR Code" />
      <p>Scan to Verify</p>
    </div>
  </div>

  <div class="validity-banner">
    <div class="blockchain-badge">⛓ Anchored on Hyperledger Fabric — Tamper-Proof</div>
    <br>
    <small>Verify at: ${APP_URL}/verify?id=${certificate?.certificateID || ''}</small>
  </div>
</div>
</body>
</html>`;
}

/**
 * Generate a PDF certificate for a given certificate record.
 * @param {Object} params - { student, record, certificate, approvalChain }
 * @returns {Object} { filePath, sha256Hash, filename }
 */
async function generateCertificatePDF({ student, record, certificate, approvalChain }) {
    const certId = certificate?.certificateID || `CERT-${Date.now()}`;
    const filename = `certificate-${certId}.pdf`;
    const filePath = path.join(CERT_DIR, filename);

    logger.info(`Generating PDF certificate for ${certId}`);

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(certId);

    // Build HTML
    const html = buildCertificateHTML({ student, record, certificate, qrCodeDataUrl, approvalChain });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: filePath,
            width: '1050px',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
    } finally {
        await browser.close();
    }

    // Compute SHA-256 of the generated PDF
    const pdfBuffer = fs.readFileSync(filePath);
    const sha256Hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    logger.info(`PDF generated: ${filename}, SHA-256: ${sha256Hash}`);
    return { filePath, filename, sha256Hash };
}

module.exports = { generateCertificatePDF, generateQRCode };
