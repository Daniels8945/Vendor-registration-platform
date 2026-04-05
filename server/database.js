import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'vendor_platform.db');

// Ensure the data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS vendors (
    id                TEXT PRIMARY KEY,
    company_name      TEXT NOT NULL,
    business_type     TEXT,
    products_services TEXT,
    website           TEXT,
    street_address    TEXT,
    street_address2   TEXT,
    city              TEXT,
    region            TEXT,
    postal_code       TEXT,
    country           TEXT,
    company_info      TEXT,
    first_name        TEXT,
    last_name         TEXT,
    email             TEXT,
    phone             TEXT,
    status            TEXT DEFAULT 'Pending Review',
    rejection_reason  TEXT,
    password_hash     TEXT,
    self_registered   INTEGER DEFAULT 0,
    submitted_at      TEXT DEFAULT (datetime('now')),
    status_updated_at TEXT,
    updated_at        TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT DEFAULT 'Admin',
    must_change_pw INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id                TEXT PRIMARY KEY,
    vendor_code       TEXT NOT NULL,
    invoice_number    TEXT UNIQUE,
    description       TEXT,
    amount            REAL DEFAULT 0,
    status            TEXT DEFAULT 'Submitted',
    service_id        TEXT,
    service_name      TEXT,
    due_date          TEXT,
    notes             TEXT,
    rejection_reason  TEXT,
    payment_date      TEXT,
    payment_method    TEXT,
    payment_reference TEXT,
    payment_notes     TEXT,
    submitted_at      TEXT DEFAULT (datetime('now')),
    updated_at        TEXT,
    FOREIGN KEY (vendor_code) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_line_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id  TEXT NOT NULL,
    description TEXT,
    quantity    REAL DEFAULT 1,
    unit_price  REAL DEFAULT 0,
    amount      REAL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoice_status_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id  TEXT NOT NULL,
    status      TEXT NOT NULL,
    reason      TEXT,
    changed_by  TEXT,
    changed_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id                  TEXT PRIMARY KEY,
    vendor_code         TEXT NOT NULL,
    document_name       TEXT,
    document_type       TEXT,
    expiry_date         TEXT,
    notes               TEXT,
    status              TEXT DEFAULT 'Pending Review',
    rejection_reason    TEXT,
    file_path           TEXT,
    file_original_name  TEXT,
    file_mime_type      TEXT,
    file_size           INTEGER,
    uploaded_at         TEXT DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (vendor_code) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    vendor_code TEXT,
    is_admin    INTEGER DEFAULT 0,
    type        TEXT DEFAULT 'info',
    title       TEXT,
    message     TEXT,
    is_read     INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id           TEXT PRIMARY KEY,
    action       TEXT,
    performed_by TEXT DEFAULT 'Admin',
    details      TEXT,
    timestamp    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT,
    unit        TEXT,
    unit_price  REAL DEFAULT 0,
    description TEXT,
    active      INTEGER DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS activities (
    id          TEXT PRIMARY KEY,
    vendor_code TEXT NOT NULL,
    type        TEXT,
    title       TEXT,
    description TEXT,
    metadata    TEXT,
    timestamp   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vendor_notes (
    id          TEXT PRIMARY KEY,
    vendor_id   TEXT NOT NULL,
    note        TEXT,
    created_by  TEXT DEFAULT 'Admin',
    created_at  TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );
`);

// ── Migrations (add columns if they don't exist) ─────────────────────────────
const existingVendorCols = db.prepare("PRAGMA table_info(vendors)").all().map(c => c.name);
if (!existingVendorCols.includes('reset_token'))   db.exec("ALTER TABLE vendors ADD COLUMN reset_token TEXT");
if (!existingVendorCols.includes('reset_expires')) db.exec("ALTER TABLE vendors ADD COLUMN reset_expires TEXT");

const existingAdminCols = db.prepare("PRAGMA table_info(admin_users)").all().map(c => c.name);
if (!existingAdminCols.includes('reset_token'))   db.exec("ALTER TABLE admin_users ADD COLUMN reset_token TEXT");
if (!existingAdminCols.includes('reset_expires')) db.exec("ALTER TABLE admin_users ADD COLUMN reset_expires TEXT");

// ── Default data ─────────────────────────────────────────────────────────────

// Default super admin (if none exists)
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get();
if (adminCount.c === 0) {
  const hash = bcrypt.hashSync('Admin@1234', 10);
  db.prepare(`
    INSERT INTO admin_users (name, email, username, password_hash, role, must_change_pw)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Super Admin', 'admin@onction.com', 'admin', hash, 'Super Admin', 1);
  console.log('[DB] Default admin created — username: admin, password: Admin@1234');
}

// Default settings
const defaultSettings = {
  companyName: 'Onction Service Limited',
  companyEmail: 'admin@onction.com',
  companyPhone: '',
  companyAddress: '',
  currency: 'NGN',
  invoicePrefix: 'INV',
  requireDocumentApproval: 'true',
  autoApproveDocuments: 'false',
  emailNotifications: 'true',
  maxInvoiceAmount: '',
  supportEmail: 'vendors@onction.com',
  vendorCodePrefix: 'OSL',
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
const insertMany = db.transaction((entries) => {
  for (const [k, v] of entries) insertSetting.run(k, v);
});
insertMany(Object.entries(defaultSettings));

export default db;
