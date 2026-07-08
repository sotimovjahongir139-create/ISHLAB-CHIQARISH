require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config/config');
const morganLogger = require('./middleware/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const productionRoutes = require('./routes/production.routes');
const qualityRoutes = require('./routes/quality.routes');
const downtimeRoutes = require('./routes/downtime.routes');
const materialRoutes = require('./routes/material.routes');
const employeeRoutes = require('./routes/employee.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const wasteRoutes = require('./routes/waste.routes');
const paintRoutes = require('./routes/paint.routes');
const workhourRoutes = require('./routes/workhour.routes');
const kesishRoutes = require('./routes/kesish.routes');
const charxlashRoutes = require('./routes/charxlash.routes');
const empPerfRoutes = require('./routes/emp-performance.routes');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Request parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging & rate limit
app.use(morganLogger);
app.use('/api', globalLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/production`, productionRoutes);
app.use(`${API}/quality`, qualityRoutes);
app.use(`${API}/downtime`, downtimeRoutes);
app.use(`${API}/materials`, materialRoutes);
app.use(`${API}/employees`, employeeRoutes);
app.use(`${API}/equipment`, equipmentRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/waste`, wasteRoutes);
app.use(`${API}/paint`, paintRoutes);
app.use(`${API}/workhours`, workhourRoutes);
app.use(`${API}/kesish`, kesishRoutes);
app.use(`${API}/charxlash`, charxlashRoutes);
app.use(`${API}/employee-performance`, empPerfRoutes);

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Yo\'l topilmadi' }));

// Error handler
app.use(errorHandler);

module.exports = app;
