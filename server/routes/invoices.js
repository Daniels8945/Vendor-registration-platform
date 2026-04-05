import { Router } from 'express';
import db from '../database.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function logAudit(action, details, performedBy = 'Admin') {
  db.prepare('INSERT INTO audit_log (id, action, details, performed_by) VALUES (?, ?, ?, ?)')
    .run(`AUDIT-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, JSON.stringify(details), performedBy);
}

function insertNotification(n) {
  db.prepare('INSERT OR IGNORE INTO notifications (id, vendor_code, is_admin, type, title, message, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)')
    .run(n.id, n.vendorCode || null, n.isAdmin || 0, n.type, n.title, n.message);
}

function getLineItems(invoiceId) {
  return db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY id').all(invoiceId);
}

function formatInvoice(inv, includeLineItems = false) {
  if (!inv) return null;
  const result = {
    id: inv.id,
    vendorCode: inv.vendor_code,
    invoiceNumber: inv.invoice_number,
    description: inv.description,
    amount: inv.amount,
    status: inv.status,
    serviceId: inv.service_id,
    serviceName: inv.service_name,
    dueDate: inv.due_date,
    notes: inv.notes,
    rejectionReason: inv.rejection_reason,
    paymentDate: inv.payment_date,
    paymentMethod: inv.payment_method,
    paymentReference: inv.payment_reference,
    paymentNotes: inv.payment_notes,
    submittedAt: inv.submitted_at,
    updatedAt: inv.updated_at,
  };
  if (includeLineItems) {
    result.lineItems = getLineItems(inv.id);
  }
  return result;
}

function getNextInvoiceNumber(vendorCode) {
  const count = db.prepare('SELECT COUNT(*) as c FROM invoices WHERE vendor_code = ?').get(vendorCode).c;
  const settings = getSettings();
  const prefix = settings.invoicePrefix || 'INV';
  return `${prefix}-${vendorCode}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/invoices — list invoices
router.get('/', requireAuth, (req, res) => {
  let rows;
  if (req.authPayload.type === 'admin') {
    const { vendorCode, status, search, dateFrom, dateTo } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    if (vendorCode) { query += ' AND vendor_code = ?'; params.push(vendorCode); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (search) { query += ' AND (invoice_number LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (dateFrom) { query += ' AND submitted_at >= ?'; params.push(dateFrom); }
    if (dateTo) { query += ' AND submitted_at <= ?'; params.push(dateTo); }
    query += ' ORDER BY submitted_at DESC';
    rows = db.prepare(query).all(...params);
  } else {
    rows = db.prepare('SELECT * FROM invoices WHERE vendor_code = ? ORDER BY submitted_at DESC').all(req.authPayload.vendorCode);
  }
  res.json(rows.map(r => formatInvoice(r, true)));
});

// GET /api/invoices/:id
router.get('/:id', requireAuth, (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  if (req.authPayload.type === 'vendor' && inv.vendor_code !== req.authPayload.vendorCode) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const history = db.prepare('SELECT * FROM invoice_status_history WHERE invoice_id = ? ORDER BY changed_at DESC').all(req.params.id);
  res.json({ ...formatInvoice(inv, true), statusHistory: history });
});

// POST /api/invoices — create invoice
router.post('/', requireAuth, (req, res) => {
  const d = req.body;
  const vendorCode = req.authPayload.type === 'vendor' ? req.authPayload.vendorCode : d.vendorCode;
  if (!vendorCode) return res.status(400).json({ error: 'Vendor code required' });

  // Check max invoice amount
  const settings = getSettings();
  if (settings.maxInvoiceAmount && Number(d.amount) > Number(settings.maxInvoiceAmount)) {
    return res.status(400).json({ error: `Invoice amount exceeds maximum of ${settings.maxInvoiceAmount}` });
  }

  const invoiceId = `INV-${Date.now()}`;
  const invoiceNumber = getNextInvoiceNumber(vendorCode);

  db.prepare(`
    INSERT INTO invoices (id, vendor_code, invoice_number, description, amount, status, service_id, service_name, due_date, notes, submitted_at)
    VALUES (?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, datetime('now'))
  `).run(invoiceId, vendorCode, invoiceNumber, d.description, d.amount || 0, d.serviceId || null, d.serviceName || null, d.dueDate || null, d.notes || null);

  // Save line items
  if (Array.isArray(d.lineItems) && d.lineItems.length > 0) {
    const insertItem = db.prepare('INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)');
    d.lineItems.forEach(item => {
      const amt = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
      insertItem.run(invoiceId, item.description, item.quantity || 1, item.unitPrice || 0, amt);
    });
  }

  // Status history entry
  db.prepare('INSERT INTO invoice_status_history (invoice_id, status, changed_by) VALUES (?, "Submitted", ?)')
    .run(invoiceId, vendorCode);

  // Log activity
  logActivity(vendorCode, { type: 'invoice_created', title: 'Invoice Created', description: `Created invoice ${invoiceNumber}`, metadata: { invoiceId, invoiceNumber, amount: d.amount } });

  // Notify admin
  insertNotification({ id: `NOT-ADMIN-${Date.now()}`, vendorCode, isAdmin: 1, type: 'info', title: 'New Invoice Submitted', message: `${vendorCode} submitted invoice ${invoiceNumber}.` });

  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  res.status(201).json(formatInvoice(inv, true));
});

// PUT /api/invoices/:id — update (vendor: only Submitted status)
router.put('/:id', requireAuth, (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  if (req.authPayload.type === 'vendor') {
    if (inv.vendor_code !== req.authPayload.vendorCode) return res.status(403).json({ error: 'Forbidden' });
    if (inv.status !== 'Submitted') return res.status(400).json({ error: 'Only Submitted invoices can be edited' });
  }

  const d = req.body;
  db.prepare(`
    UPDATE invoices SET description = ?, amount = ?, service_id = ?, service_name = ?, due_date = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(d.description, d.amount, d.serviceId || null, d.serviceName || null, d.dueDate || null, d.notes || null, req.params.id);

  // Replace line items
  if (Array.isArray(d.lineItems)) {
    db.prepare('DELETE FROM invoice_line_items WHERE invoice_id = ?').run(req.params.id);
    const insertItem = db.prepare('INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)');
    d.lineItems.forEach(item => {
      insertItem.run(req.params.id, item.description, item.quantity || 1, item.unitPrice || 0, (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0));
    });
  }

  logActivity(inv.vendor_code, { type: 'invoice_edited', title: 'Invoice Updated', description: `Updated invoice ${inv.invoice_number}`, metadata: { invoiceId: req.params.id } });
  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(formatInvoice(updated, true));
});

// PATCH /api/invoices/:id/status — admin status change
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status, rejectionReason } = req.body;
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  db.prepare('UPDATE invoices SET status = ?, rejection_reason = ?, updated_at = datetime("now") WHERE id = ?')
    .run(status, status === 'Rejected' ? (rejectionReason || '') : null, req.params.id);

  // Status history
  db.prepare('INSERT INTO invoice_status_history (invoice_id, status, reason, changed_by) VALUES (?, ?, ?, ?)')
    .run(req.params.id, status, rejectionReason || null, req.admin?.name || 'Admin');

  logAudit('invoice_status_changed', { invoiceId: req.params.id, invoiceNumber: inv.invoice_number, newStatus: status, reason: rejectionReason }, req.admin?.name || 'Admin');

  // Notify vendor
  const msgs = {
    Approved: { type: 'success', title: 'Invoice Approved', message: `Invoice ${inv.invoice_number} has been approved.` },
    Rejected: { type: 'error', title: 'Invoice Rejected', message: `Invoice ${inv.invoice_number} was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}` },
    Paid: { type: 'success', title: 'Invoice Marked as Paid', message: `Invoice ${inv.invoice_number} has been marked as paid.` },
    'Under Review': { type: 'info', title: 'Invoice Under Review', message: `Invoice ${inv.invoice_number} is under review.` },
  };
  const msg = msgs[status];
  if (msg) insertNotification({ id: `NOT-${Date.now()}`, vendorCode: inv.vendor_code, isAdmin: 0, ...msg });

  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(formatInvoice(updated, true));
});

// PATCH /api/invoices/:id/payment — record payment
router.patch('/:id/payment', requireAdmin, (req, res) => {
  const { paymentDate, paymentMethod, paymentReference, paymentNotes } = req.body;
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  db.prepare(`
    UPDATE invoices SET status = 'Paid', payment_date = ?, payment_method = ?, payment_reference = ?, payment_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(paymentDate, paymentMethod, paymentReference, paymentNotes, req.params.id);

  db.prepare('INSERT INTO invoice_status_history (invoice_id, status, reason, changed_by) VALUES (?, "Paid", ?, ?)')
    .run(req.params.id, `Payment via ${paymentMethod}`, req.admin?.name || 'Admin');

  logAudit('invoice_payment_recorded', { invoiceId: req.params.id, invoiceNumber: inv.invoice_number, paymentDate, paymentMethod }, req.admin?.name || 'Admin');
  insertNotification({ id: `NOT-${Date.now()}`, vendorCode: inv.vendor_code, isAdmin: 0, type: 'success', title: 'Payment Recorded', message: `Payment recorded for invoice ${inv.invoice_number}.` });

  const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(formatInvoice(updated));
});

// DELETE /api/invoices/:id
router.delete('/:id', requireAuth, (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  if (req.authPayload.type === 'vendor') {
    if (inv.vendor_code !== req.authPayload.vendorCode) return res.status(403).json({ error: 'Forbidden' });
    if (inv.status !== 'Submitted') return res.status(400).json({ error: 'Only Submitted invoices can be deleted' });
  }

  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  logActivity(inv.vendor_code, { type: 'invoice_deleted', title: 'Invoice Deleted', description: `Deleted invoice ${inv.invoice_number}`, metadata: { invoiceId: req.params.id } });
  res.json({ success: true });
});

function logActivity(vendorCode, data) {
  db.prepare('INSERT INTO activities (id, vendor_code, type, title, description, metadata) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`ACT-${Date.now()}-${Math.random().toString(36).slice(2)}`, vendorCode, data.type, data.title, data.description, JSON.stringify(data.metadata || {}));
}

export default router;
