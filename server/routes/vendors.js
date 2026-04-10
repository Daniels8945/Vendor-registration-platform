import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';
import { sendStatusChangeEmail } from '../email/mailer.js';

const router = Router();

function formatVendor(v) {
  if (!v) return null;
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

// GET /api/vendors — list all (admin) or self (vendor)
router.get('/', requireAuth, (req, res) => {
  if (req.authPayload.type === 'admin') {
    const rows = db.prepare('SELECT * FROM vendors ORDER BY submitted_at DESC').all();
    return res.json(rows.map(formatVendor));
  }
  // Vendor can only get themselves
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.authPayload.vendorCode);
  res.json(row ? [formatVendor(row)] : []);
});

// GET /api/vendors/:id
router.get('/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Vendor not found' });

  // Vendor can only see themselves
  if (req.authPayload.type === 'vendor' && req.authPayload.vendorCode !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(formatVendor(row));
});

// POST /api/vendors — create (admin)
router.post('/', requireAdmin, (req, res) => {
  const d = req.body;
  const code = d.id || generateCode(d.businessType, db);

  // Check duplicates
  const dup = db.prepare('SELECT id FROM vendors WHERE company_name = ? OR email = ?')
    .get(d.companyName?.trim() || '', d.email?.trim() || '');
  if (dup) return res.status(409).json({ error: `Duplicate vendor (${dup.id})` });

  const passwordHash = d.password ? bcrypt.hashSync(d.password, 10) : null;

  db.prepare(`
    INSERT INTO vendors (id, company_name, business_type, products_services, website,
      street_address, street_address2, city, region, postal_code, country, company_info,
      first_name, last_name, email, phone, status, password_hash, self_registered, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    code, d.companyName, d.businessType, d.productsServices, d.website,
    d.streetAddress, d.streetAddress2, d.city, d.region, d.postalCode, d.country, d.companyInfo,
    d.firstName, d.lastName, d.email, d.phone,
    d.status || 'Pending Review', passwordHash, 0
  );

  // Audit log
  logAudit('vendor_created', { vendorId: code, companyName: d.companyName }, req.admin?.name || 'Admin');

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(code);
  res.status(201).json(formatVendor(vendor));
});

// POST /api/vendors/register — self-registration (public)
router.post('/register', (req, res) => {
  const d = req.body;
  if (!d.companyName || !d.email) {
    return res.status(400).json({ error: 'Company name and email are required' });
  }

  const dup = db.prepare('SELECT id FROM vendors WHERE company_name = ? OR email = ?')
    .get(d.companyName.trim(), d.email.trim());
  if (dup) {
    const field = db.prepare('SELECT id FROM vendors WHERE email = ?').get(d.email.trim())
      ? 'email' : 'companyName';
    return res.status(409).json({ error: `A vendor with this ${field === 'email' ? 'email' : 'company name'} already exists`, field });
  }

  if (!d.password) return res.status(400).json({ error: 'Password is required for registration' });
  const passwordHash = bcrypt.hashSync(d.password, 10);

  const code = generateCode(d.businessType, db);

  db.prepare(`
    INSERT INTO vendors (id, company_name, business_type, products_services, website,
      street_address, street_address2, city, region, postal_code, country, company_info,
      first_name, last_name, email, phone, status, password_hash, self_registered, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', ?, 1, datetime('now'))
  `).run(
    code, d.companyName, d.businessType, d.productsServices, d.website,
    d.streetAddress, d.streetAddress2, d.city, d.region, d.postalCode, d.country, d.companyInfo,
    d.firstName, d.lastName, d.email, d.phone, passwordHash
  );

  // Audit
  logAudit('vendor_created', { vendorId: code, companyName: d.companyName, email: d.email }, 'Self-registration');

  // Admin notification
  insertNotification({
    id: `NOT-ADMIN-${Date.now()}`,
    vendorCode: code,
    isAdmin: 1,
    type: 'info',
    title: 'New Vendor Self-Registration',
    message: `${d.companyName} (${d.email}) completed self-registration and is pending review. Vendor code: ${code}.`,
  });

  // Vendor welcome notification
  insertNotification({
    id: `NOT-${Date.now()}`,
    vendorCode: code,
    isAdmin: 0,
    type: 'info',
    title: 'Registration Submitted',
    message: 'Your vendor registration has been submitted successfully and is pending review. You will be notified once it has been processed.',
  });

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(code);
  res.status(201).json(formatVendor(vendor));
});

// PUT /api/vendors/:id — update
router.put('/:id', requireAuth, (req, res) => {
  const d = req.body;
  const { id } = req.params;

  // Vendor can only update themselves, and only contact fields
  if (req.authPayload.type === 'vendor') {
    if (req.authPayload.vendorCode !== id) return res.status(403).json({ error: 'Forbidden' });
    db.prepare(`
      UPDATE vendors SET
        first_name = ?, last_name = ?, email = ?, phone = ?,
        street_address = ?, street_address2 = ?, city = ?, region = ?, postal_code = ?, country = ?,
        website = ?, products_services = ?, company_info = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      d.firstName, d.lastName, d.email, d.phone,
      d.streetAddress, d.streetAddress2, d.city, d.region, d.postalCode, d.country,
      d.website, d.productsServices, d.companyInfo, id
    );
  } else {
    // Admin can update all fields
    db.prepare(`
      UPDATE vendors SET
        company_name = ?, business_type = ?, products_services = ?, website = ?,
        street_address = ?, street_address2 = ?, city = ?, region = ?, postal_code = ?, country = ?,
        company_info = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      d.companyName, d.businessType, d.productsServices, d.website,
      d.streetAddress, d.streetAddress2, d.city, d.region, d.postalCode, d.country,
      d.companyInfo, d.firstName, d.lastName, d.email, d.phone, id
    );
    logAudit('vendor_edited', { vendorId: id, changes: Object.keys(d) }, req.admin?.name || 'Admin');
  }

  const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  if (!updated) return res.status(404).json({ error: 'Vendor not found' });
  res.json(formatVendor(updated));
});

// PATCH /api/vendors/:id/status
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status, rejectionReason } = req.body;
  const { id } = req.params;

  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  db.prepare(`
    UPDATE vendors SET status = ?, rejection_reason = ?, status_updated_at = datetime('now'),
    updated_at = datetime('now') WHERE id = ?
  `).run(status, status === 'Rejected' ? (rejectionReason || '') : null, id);

  logAudit('vendor_status_changed', { vendorId: id, newStatus: status, reason: rejectionReason }, req.admin?.name || 'Admin');

  // Send notification to vendor
  const settings = getSettings();
  if (settings.emailNotifications === 'true') {
    const updatedVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
    sendStatusChangeEmail(formatVendor(updatedVendor), status, rejectionReason).catch(() => {});
  }

  // In-app notification
  const msgs = {
    Approved: { type: 'success', title: 'Application Approved', message: 'Congratulations! Your vendor application has been approved. You can now submit invoices and upload documents.' },
    Rejected: { type: 'error', title: 'Application Rejected', message: rejectionReason ? `Your application was rejected. Reason: ${rejectionReason}` : 'Your vendor application has been reviewed. Unfortunately it could not be approved at this time.' },
    Inactive: { type: 'info', title: 'Account Deactivated', message: 'Your vendor account has been set to inactive. Contact support if you believe this is an error.' },
    'Pending Review': { type: 'info', title: 'Application Under Review', message: 'Your vendor application has been set back to pending review. An admin will review it shortly.' },
  };
  const msg = msgs[status];
  if (msg) {
    insertNotification({ id: `NOT-${Date.now()}`, vendorCode: id, isAdmin: 0, ...msg });
  }

  const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
  res.json(formatVendor(updated));
});

// DELETE /api/vendors/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
  db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
  logAudit('vendor_deleted', { vendorId: req.params.id, companyName: vendor.company_name }, req.admin?.name || 'Admin');
  res.json({ success: true });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(businessType, database) {
  const settings = getSettings();
  const prefix = settings.vendorCodePrefix || 'OSL';
  const year = new Date().getFullYear();
  let code;
  let attempts = 0;
  do {
    const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const nums = String(Math.floor(1000 + Math.random() * 9000));
    code = `${prefix}-${year}-${letters}-${nums}`;
    attempts++;
  } while (database.prepare('SELECT id FROM vendors WHERE id = ?').get(code) && attempts < 100);
  return code;
}

function insertNotification(n) {
  db.prepare(`
    INSERT OR IGNORE INTO notifications (id, vendor_code, is_admin, type, title, message, is_read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(n.id, n.vendorCode || null, n.isAdmin || 0, n.type, n.title, n.message);
}

function logAudit(action, details, performedBy = 'Admin') {
  db.prepare('INSERT INTO audit_log (id, action, details, performed_by) VALUES (?, ?, ?, ?)')
    .run(`AUDIT-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, JSON.stringify(details), performedBy);
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// ── Vendor Notes ─────────────────────────────────────────────────────────────

router.get('/:id/notes', requireAdmin, (req, res) => {
  const notes = db.prepare(
    'SELECT id, note, created_by AS createdBy, created_at AS createdAt FROM vendor_notes WHERE vendor_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json(notes);
});

router.post('/:id/notes', requireAdmin, (req, res) => {
  const { note } = req.body;
  if (!note?.trim()) return res.status(400).json({ error: 'Note is required' });
  const entry = {
    id: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    vendor_id: req.params.id,
    note: note.trim(),
    created_by: req.admin?.username || 'Admin',
  };
  db.prepare(
    'INSERT INTO vendor_notes (id, vendor_id, note, created_by) VALUES (?, ?, ?, ?)'
  ).run(entry.id, entry.vendor_id, entry.note, entry.created_by);
  const saved = db.prepare(
    'SELECT id, note, created_by AS createdBy, created_at AS createdAt FROM vendor_notes WHERE id = ?'
  ).get(entry.id);
  res.status(201).json(saved);
});

router.delete('/notes/:noteId', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM vendor_notes WHERE id = ?').run(req.params.noteId);
  res.json({ success: true });
});

export default router;
