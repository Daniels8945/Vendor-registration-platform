import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  },
});

function logAudit(action, details, performedBy = 'Admin') {
  db.prepare('INSERT INTO audit_log (id, action, details, performed_by) VALUES (?, ?, ?, ?)')
    .run(`AUDIT-${Date.now()}-${Math.random().toString(36).slice(2)}`, action, JSON.stringify(details), performedBy);
}

function insertNotification(n) {
  db.prepare('INSERT OR IGNORE INTO notifications (id, vendor_code, is_admin, type, title, message, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)')
    .run(n.id, n.vendorCode || null, n.isAdmin || 0, n.type, n.title, n.message);
}

function formatDoc(d) {
  if (!d) return null;
  return {
    id: d.id,
    vendorCode: d.vendor_code,
    documentName: d.document_name,
    documentType: d.document_type,
    expiryDate: d.expiry_date,
    notes: d.notes,
    status: d.status,
    rejectionReason: d.rejection_reason,
    fileUrl: d.file_path ? `/api/uploads/${path.basename(d.file_path)}` : null,
    fileOriginalName: d.file_original_name,
    fileMimeType: d.file_mime_type,
    fileSize: d.file_size,
    uploadedAt: d.uploaded_at,
    updatedAt: d.updated_at,
  };
}

// GET /api/documents
router.get('/', requireAuth, (req, res) => {
  if (req.authPayload.type === 'admin') {
    const { vendorCode, status, type } = req.query;
    let q = 'SELECT * FROM documents WHERE 1=1';
    const p = [];
    if (vendorCode) { q += ' AND vendor_code = ?'; p.push(vendorCode); }
    if (status) { q += ' AND status = ?'; p.push(status); }
    if (type) { q += ' AND document_type = ?'; p.push(type); }
    q += ' ORDER BY uploaded_at DESC';
    return res.json(db.prepare(q).all(...p).map(formatDoc));
  }
  const rows = db.prepare('SELECT * FROM documents WHERE vendor_code = ? ORDER BY uploaded_at DESC').all(req.authPayload.vendorCode);
  res.json(rows.map(formatDoc));
});

// GET /api/documents/:id
router.get('/:id', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (req.authPayload.type === 'vendor' && doc.vendor_code !== req.authPayload.vendorCode) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(formatDoc(doc));
});

// POST /api/documents — upload new document
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  const vendorCode = req.authPayload.type === 'vendor' ? req.authPayload.vendorCode : req.body.vendorCode;
  if (!vendorCode) return res.status(400).json({ error: 'Vendor code required' });

  const docId = `DOC-${Date.now()}`;
  const filePath = req.file ? req.file.path : null;

  db.prepare(`
    INSERT INTO documents (id, vendor_code, document_name, document_type, expiry_date, notes, status, file_path, file_original_name, file_mime_type, file_size, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending Review', ?, ?, ?, ?, datetime('now'))
  `).run(
    docId, vendorCode,
    req.body.documentName || req.file?.originalname,
    req.body.documentType,
    req.body.expiryDate || null,
    req.body.notes || null,
    filePath, req.file?.originalname, req.file?.mimetype, req.file?.size || null
  );

  // Log activity + audit
  db.prepare('INSERT INTO activities (id, vendor_code, type, title, description, metadata) VALUES (?, ?, ?, ?, ?, ?)')
    .run(`ACT-${Date.now()}-${Math.random().toString(36).slice(2)}`, vendorCode, 'document_uploaded', 'Document Uploaded',
      `Uploaded "${req.body.documentName}" (${req.body.documentType})`, JSON.stringify({ docId }));

  logAudit('document_uploaded', { vendorCode, docId, documentName: req.body.documentName, documentType: req.body.documentType }, vendorCode);

  insertNotification({ id: `NOT-ADMIN-${Date.now()}`, vendorCode, isAdmin: 1, type: 'info', title: 'New Document Uploaded', message: `${vendorCode} uploaded "${req.body.documentName}" (${req.body.documentType}) — pending review.` });

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  res.status(201).json(formatDoc(doc));
});

// PUT /api/documents/:id/reupload — re-upload a rejected document (vendor)
router.put('/:id/reupload', requireAuth, upload.single('file'), (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (req.authPayload.type === 'vendor' && doc.vendor_code !== req.authPayload.vendorCode) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (doc.status !== 'Rejected') {
    return res.status(400).json({ error: 'Only rejected documents can be re-uploaded' });
  }

  // Delete old file if it exists
  if (doc.file_path && fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }

  const filePath = req.file ? req.file.path : doc.file_path;

  db.prepare(`
    UPDATE documents SET status = 'Pending Review', rejection_reason = NULL,
    file_path = ?, file_original_name = ?, file_mime_type = ?, file_size = ?,
    notes = ?, expiry_date = ?, updated_at = datetime('now') WHERE id = ?
  `).run(
    filePath, req.file?.originalname || doc.file_original_name,
    req.file?.mimetype || doc.file_mime_type, req.file?.size || doc.file_size,
    req.body.notes || doc.notes, req.body.expiryDate || doc.expiry_date, req.params.id
  );

  insertNotification({ id: `NOT-ADMIN-${Date.now()}`, vendorCode: doc.vendor_code, isAdmin: 1, type: 'info', title: 'Document Re-uploaded', message: `${doc.vendor_code} re-uploaded "${doc.document_name}" — pending review.` });

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json(formatDoc(updated));
});

// PATCH /api/documents/:id/status — admin
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status, rejectionReason } = req.body;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  db.prepare('UPDATE documents SET status = ?, rejection_reason = ?, updated_at = datetime("now") WHERE id = ?')
    .run(status, status === 'Rejected' ? (rejectionReason || '') : null, req.params.id);

  logAudit(`document_${status.toLowerCase().replace(' ', '_')}`, { docId: req.params.id, documentName: doc.document_name, vendorCode: doc.vendor_code, reason: rejectionReason }, req.admin?.name || 'Admin');

  const msgs = {
    Approved: { type: 'success', title: 'Document Approved', message: `Your document "${doc.document_name}" has been approved.` },
    Rejected: { type: 'error', title: 'Document Rejected', message: `Your document "${doc.document_name}" was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}` },
    'Pending Review': { type: 'info', title: 'Document Under Review', message: `Your document "${doc.document_name}" has been reset to pending review.` },
  };
  const msg = msgs[status];
  if (msg) insertNotification({ id: `NOT-${Date.now()}`, vendorCode: doc.vendor_code, isAdmin: 0, ...msg });

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  res.json(formatDoc(updated));
});

// DELETE /api/documents/:id
router.delete('/:id', requireAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (req.authPayload.type === 'vendor' && doc.vendor_code !== req.authPayload.vendorCode) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Delete file from disk
  if (doc.file_path && fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }

  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
