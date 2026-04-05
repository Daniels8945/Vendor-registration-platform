import { Router } from 'express';
import db from '../database.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

function fmt(n) {
  return {
    id: n.id,
    vendorCode: n.vendor_code,
    isAdmin: !!n.is_admin,
    type: n.type,
    title: n.title,
    message: n.message,
    read: !!n.is_read,
    createdAt: n.created_at,
  };
}

// GET /api/notifications
router.get('/', requireAuth, (req, res) => {
  if (req.authPayload.type === 'admin') {
    const rows = db.prepare('SELECT * FROM notifications WHERE is_admin = 1 ORDER BY created_at DESC').all();
    return res.json(rows.map(fmt));
  }
  const rows = db.prepare('SELECT * FROM notifications WHERE vendor_code = ? AND is_admin = 0 ORDER BY created_at DESC')
    .all(req.authPayload.vendorCode);
  res.json(rows.map(fmt));
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, (req, res) => {
  if (req.authPayload.type === 'admin') {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE is_admin = 1').run();
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE vendor_code = ? AND is_admin = 0').run(req.authPayload.vendorCode);
  }
  res.json({ success: true });
});

// DELETE /api/notifications/:id
router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/notifications (clear all)
router.delete('/', requireAuth, (req, res) => {
  if (req.authPayload.type === 'admin') {
    db.prepare('DELETE FROM notifications WHERE is_admin = 1').run();
  } else {
    db.prepare('DELETE FROM notifications WHERE vendor_code = ? AND is_admin = 0').run(req.authPayload.vendorCode);
  }
  res.json({ success: true });
});

export default router;
