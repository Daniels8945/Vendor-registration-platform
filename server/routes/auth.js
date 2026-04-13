import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../database.js';
import { sendPasswordResetEmail } from '../email/mailer.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vendor-platform-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// ── Admin login ──────────────────────────────────────────────────────────────
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ? OR email = ?').get(username, username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { type: 'admin', userId: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role, mustChangePw: !!user.must_change_pw },
  });
});

// ── Admin change password ────────────────────────────────────────────────────
router.post('/admin/change-password', (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE admin_users SET password_hash = ?, must_change_pw = 0, updated_at = datetime('now') WHERE id = ?").run(newHash, user.id);

  res.json({ success: true });
});

// ── Vendor login ─────────────────────────────────────────────────────────────
router.post('/vendor/login', (req, res) => {
  const { vendorCode, password } = req.body;
  if (!vendorCode) return res.status(400).json({ error: 'Vendor code is required' });

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorCode);
  if (!vendor) return res.status(401).json({ error: 'Vendor code not found' });

  // If vendor has a password set, verify it
  if (vendor.password_hash) {
    if (!password) return res.status(400).json({ error: 'Password is required', needsPassword: true });
    const valid = bcrypt.compareSync(password, vendor.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });
  }

  if (vendor.status === 'Rejected') {
    return res.status(403).json({
      error: 'Your vendor application has been rejected.',
      status: vendor.status,
      rejectionReason: vendor.rejection_reason || null,
    });
  }

  if (vendor.status === 'Inactive') {
    return res.status(403).json({
      error: 'Your vendor account has been deactivated. Please contact support.',
      status: vendor.status,
    });
  }

  const token = jwt.sign(
    { type: 'vendor', vendorCode: vendor.id, companyName: vendor.company_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({ token, vendor: formatVendor(vendor) });
});

// ── Vendor set/change password ───────────────────────────────────────────────
router.post('/vendor/set-password', (req, res) => {
  const { vendorCode, password, newPassword, currentPassword } = req.body;
  if (!vendorCode || !newPassword) return res.status(400).json({ error: 'Vendor code and new password required' });

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorCode);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  // If vendor already has a password, require current password to change it
  if (vendor.password_hash && !currentPassword) {
    return res.status(400).json({ error: 'Current password required to change password' });
  }
  if (vendor.password_hash && currentPassword) {
    if (!bcrypt.compareSync(currentPassword, vendor.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  const hash = bcrypt.hashSync(newPassword || password, 10);
  db.prepare("UPDATE vendors SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, vendorCode);
  res.json({ success: true });
});

// ── Vendor forgot password ───────────────────────────────────────────────────
router.post('/vendor/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const vendor = db.prepare('SELECT * FROM vendors WHERE email = ?').get(email);
  // Always respond success to avoid email enumeration
  if (!vendor) return res.json({ success: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  db.prepare('UPDATE vendors SET reset_token = ?, reset_expires = ? WHERE id = ?').run(token, expires, vendor.id);

  await sendPasswordResetEmail(email, token, 'vendor');
  res.json({ success: true });
});

// ── Vendor reset password ────────────────────────────────────────────────────
router.post('/vendor/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

  const vendor = db.prepare('SELECT * FROM vendors WHERE reset_token = ?').get(token);
  if (!vendor) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (!vendor.reset_expires || new Date(vendor.reset_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE vendors SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = datetime('now') WHERE id = ?").run(hash, vendor.id);
  res.json({ success: true });
});

// ── Admin forgot password ────────────────────────────────────────────────────
router.post('/admin/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!user) return res.json({ success: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE admin_users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(token, expires, user.id);

  await sendPasswordResetEmail(email, token, 'admin');
  res.json({ success: true });
});

// ── Admin reset password ─────────────────────────────────────────────────────
router.post('/admin/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

  const user = db.prepare('SELECT * FROM admin_users WHERE reset_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
  if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE admin_users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = datetime('now') WHERE id = ?").run(hash, user.id);
  res.json({ success: true });
});

// ── Refresh token ────────────────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const old = jwt.verify(header.slice(7), JWT_SECRET);
    const token = jwt.sign(
      old.type === 'admin'
        ? { type: 'admin', userId: old.userId, username: old.username, name: old.name, role: old.role }
        : { type: 'vendor', vendorCode: old.vendorCode, companyName: old.companyName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({ token });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

function formatVendor(v) {
  return {
    id: v.id,
    companyName: v.company_name,
    businessType: v.business_type,
    productsServices: v.products_services,
    website: v.website,
    streetAddress: v.street_address,
    streetAddress2: v.street_address2,
    city: v.city,
    region: v.region,
    postalCode: v.postal_code,
    country: v.country,
    companyInfo: v.company_info,
    firstName: v.first_name,
    lastName: v.last_name,
    email: v.email,
    phone: v.phone,
    status: v.status,
    rejectionReason: v.rejection_reason,
    selfRegistered: !!v.self_registered,
    submittedAt: v.submitted_at,
    statusUpdatedAt: v.status_updated_at,
    updatedAt: v.updated_at,
    hasPassword: !!v.password_hash,
  };
}

export default router;
