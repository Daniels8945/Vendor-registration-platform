import { Router } from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/activities?vendorCode=xxx
router.get('/', requireAuth, (req, res) => {
  const vendorCode = req.authPayload.type === 'vendor'
    ? req.authPayload.vendorCode
    : req.query.vendorCode;

  if (!vendorCode) return res.status(400).json({ error: 'vendorCode required' });

  const rows = db.prepare('SELECT * FROM activities WHERE vendor_code = ? ORDER BY timestamp DESC LIMIT 100').all(vendorCode);
  res.json(rows.map(r => ({
    id: r.id,
    vendorCode: r.vendor_code,
    type: r.type,
    title: r.title,
    description: r.description,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
    timestamp: r.timestamp,
  })));
});

// POST /api/activities
router.post('/', requireAuth, (req, res) => {
  const { vendorCode, type, title, description, metadata } = req.body;
  const code = req.authPayload.type === 'vendor' ? req.authPayload.vendorCode : vendorCode;
  const id = `ACT-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  db.prepare('INSERT INTO activities (id, vendor_code, type, title, description, metadata) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, code, type, title, description, JSON.stringify(metadata || {}));
  res.status(201).json({ id });
});

export default router;
