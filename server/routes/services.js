import { Router } from 'express';
import db from '../database.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/services — all users can read
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY name').all();
  res.json(rows.map(s => ({
    id: s.id, name: s.name, category: s.category, unit: s.unit,
    unitPrice: s.unit_price, description: s.description, active: !!s.active,
    createdAt: s.created_at, updatedAt: s.updated_at,
  })));
});

// POST /api/services
router.post('/', requireAdmin, (req, res) => {
  const d = req.body;
  const id = `SVC-${Date.now()}`;
  db.prepare('INSERT INTO services (id, name, category, unit, unit_price, description, active) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, d.name, d.category, d.unit, d.unitPrice || 0, d.description, d.active !== false ? 1 : 0);
  const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json({ id: svc.id, name: svc.name, category: svc.category, unit: svc.unit, unitPrice: svc.unit_price, description: svc.description, active: !!svc.active });
});

// PUT /api/services/:id
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found' });
  const d = req.body;
  db.prepare("UPDATE services SET name = ?, category = ?, unit = ?, unit_price = ?, description = ?, active = ?, updated_at = datetime('now') WHERE id = ?")
    .run(d.name, d.category, d.unit, d.unitPrice || 0, d.description, d.active !== false ? 1 : 0, req.params.id);
  const svc = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json({ id: svc.id, name: svc.name, category: svc.category, unit: svc.unit, unitPrice: svc.unit_price, description: svc.description, active: !!svc.active });
});

// DELETE /api/services/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Service not found' });
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.status(200).json({ success: true });
});

export default router;
