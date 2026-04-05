import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

import './database.js'; // runs schema migrations on import

import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import invoiceRoutes from './routes/invoices.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';
import serviceRoutes from './routes/services.js';
import settingsRoutes from './routes/settings.js';
import activityRoutes from './routes/activities.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads');

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static: serve uploaded files ────────────────────────────────────────────
app.use('/api/uploads', express.static(UPLOADS_DIR));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activities', activityRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 for unknown API routes ────────────────────────────────────────────────
app.use('/api/{*path}', (req, res) => res.status(404).json({ error: `No route: ${req.method} ${req.path}` }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Vendor Platform API running on http://localhost:${PORT}`);
  logger.info(`Uploads directory: ${UPLOADS_DIR}`);
});

export default app;
