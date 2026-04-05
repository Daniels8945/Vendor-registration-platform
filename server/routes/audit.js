import { Router } from 'express';
import db from '../database.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/audit
router.get('/', requireAdmin, (req, res) => {
  const { search, action, dateFrom, dateTo } = req.query;
  let q = 'SELECT * FROM audit_log WHERE 1=1';
  const p = [];
  if (search) { q += ' AND (action LIKE ? OR performed_by LIKE ? OR details LIKE ?)'; p.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (action) { q += ' AND action = ?'; p.push(action); }
  if (dateFrom) { q += ' AND timestamp >= ?'; p.push(dateFrom); }
  if (dateTo) { q += ' AND timestamp <= ?'; p.push(dateTo); }
  q += ' ORDER BY timestamp DESC LIMIT 500';
  const rows = db.prepare(q).all(...p);
  res.json(rows.map(r => ({ ...r, details: r.details ? JSON.parse(r.details) : {} })));
});

// POST /api/audit — log an action
router.post('/', requireAdmin, (req, res) => {
  const { action, details } = req.body;
  const id = `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  db.prepare('INSERT INTO audit_log (id, action, details, performed_by) VALUES (?, ?, ?, ?)')
    .run(id, action, JSON.stringify(details || {}), req.admin?.name || 'Admin');
  res.status(201).json({ id });
});

// DELETE /api/audit — clear log
router.delete('/', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM audit_log').run();
  res.json({ success: true });
});

export default router;
