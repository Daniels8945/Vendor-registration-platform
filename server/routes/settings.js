import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// GET /api/settings
router.get('/', (req, res) => {
  res.json(getAllSettings());
});

// PUT /api/settings
router.put('/', requireAdmin, (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const update = db.transaction((entries) => {
    for (const [k, v] of entries) upsert.run(k, String(v ?? ''));
  });
  update(Object.entries(req.body));
  res.json(getAllSettings());
});

// GET /api/settings/admin-users
router.get('/admin-users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, username, role, must_change_pw, created_at FROM admin_users').all();
  res.json(users.map(u => ({ ...u, mustChangePw: !!u.must_change_pw })));
});

// POST /api/settings/admin-users
router.post('/admin-users', requireAdmin, (req, res) => {
  const { name, email, username, password, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'name, username, and password are required' });
  }

  const exists = db.prepare('SELECT id FROM admin_users WHERE username = ? OR email = ?').get(username, email || '');
  if (exists) return res.status(409).json({ error: 'Username or email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO admin_users (name, email, username, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(name, email || null, username, hash, role || 'Admin');
  res.status(201).json({ id: result.lastInsertRowid, name, email, username, role: role || 'Admin' });
});

// DELETE /api/settings/admin-users/:id
router.delete('/admin-users/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const superCount = db.prepare('SELECT COUNT(*) as c FROM admin_users WHERE role = "Super Admin"').get().c;
  if (user.role === 'Super Admin' && superCount <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last Super Admin' });
  }

  db.prepare('DELETE FROM admin_users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// PATCH /api/settings/admin-users/:id/password
router.patch('/admin-users/:id/password', requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admin_users SET password_hash = ?, must_change_pw = 0, updated_at = datetime("now") WHERE id = ?')
    .run(hash, req.params.id);
  res.json({ success: true });
});

export default router;
