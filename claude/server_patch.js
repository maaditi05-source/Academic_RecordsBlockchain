// ============================================================
// PATCH for server.js
// Find the block where existing routes are imported/registered
// and add the two lines marked NEW below.
// ============================================================

// ── existing route imports (already in your file) ────────────
const authRoutes       = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const studentRoutes    = require('./routes/studentRoutes');

// ── NEW: add these two imports ────────────────────────────────
const courseRoutes     = require('./routes/courseRoutes');   // NEW
const marksRoutes      = require('./routes/marksRoutes');    // NEW

// ── existing app.use() registrations ─────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/students',    studentRoutes);

// ── NEW: register new routes ──────────────────────────────────
app.use('/api/courses',  courseRoutes);   // NEW
app.use('/api/marks',    marksRoutes);    // NEW
