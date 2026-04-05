# Vendor Registration Platform — Feature Audit & Roadmap

> **Last audited:** 2026-04-05  
> **Auditor:** Claude Code  
> **Status key:** ✅ Done · 🔶 Partial · ❌ Missing · 🔧 Bug/Gap

---

## Platform Overview

Two separate React SPAs sharing `localStorage` as the data layer:

| Portal | Entry | Auth |
|---|---|---|
| **Admin** | `src/admin-portal/` | Password gate (optional) + role-based (Super Admin / Admin / Viewer) |
| **Vendor** | `src/vendor-portal/` | Vendor code or email login |

Storage key prefixes: `vendor:` · `invoice:` · `document:` · `notification:` · `audit:` · `service:` · `admin:settings` · `admin:users`

---

## ADMIN PORTAL

### 1. Dashboard (`DashboardView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Vendor status stat cards (total, approved, pending, rejected) | ✅ | |
| Manufacturers / Distributors stat cards | ✅ | |
| Period filter (All Time / Year / Quarter / Month) | ✅ | Applies to vendor counts only |
| Pending Actions alert banner | ✅ | Shows pending vendors, invoices, documents |
| Financial summary (Total Invoiced, Paid, Pending, Overdue) | ✅ | |
| Vendors by Status bar chart | ✅ | |
| Vendors by Type bar chart | ✅ | |
| Recent Vendors list (click to profile) | ✅ | |
| Period filter applied to financial metrics | ✅ | Now re-derives financials from period-filtered invoices |
| Clickable pending-action items navigate to relevant view | ✅ | |
| Top-performing vendors widget | ❌ | |
| Monthly registration trend chart | ❌ | |

---

### 2. Vendor List (`VendorsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Search by company, code, email | ✅ | |
| Filter by status | ✅ | |
| Filter by business type | ✅ | |
| Paginated table (20/page) | ✅ | |
| Bulk select + bulk approve/reject/inactive/review | ✅ | |
| Per-row dropdown: View Profile, Quick View, Approve, Reject, Set Inactive, Set to Review, Delete | ✅ | |
| Rejection reason modal (single vendor) | ✅ | |
| CSV export of filtered vendors | ✅ | |
| CSV import with duplicate detection | ✅ | |
| Role-based access (Viewer hides write actions) | ✅ | |
| Bulk rejection with reason modal | ✅ | |
| Column sort (name, date, status) | ✅ | |
| Bulk delete with confirmation | ✅ | |
| "Date registered" column | ❌ | Column not in table (only in profile) |

---

### 3. Vendor Profile (`VendorProfileView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Full vendor details (contact, address, business info) | ✅ | |
| Status badge + status change actions (Approve/Reject/Inactive/Set to Review) | ✅ | |
| Rejection reason modal | ✅ | |
| Inline edit of all vendor fields | ✅ | |
| Documents tab with file preview (image/PDF) and download | ✅ | |
| Documents tab: approve / reject / reset document status | ✅ | |
| Invoices tab listing vendor's invoices | ✅ | |
| Activity / audit tab for this vendor | ✅ | |
| Notes / comments field per vendor | ❌ | Admins cannot leave internal notes |
| Vendor contact history | ❌ | |

---

### 4. Add Vendor (`AddVendorView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Multi-field registration form | ✅ | |
| Duplicate detection (company name + email) | ✅ | |
| Auto-generate vendor code | ✅ | |
| Audit log on create | ✅ | |
| Form validation (HTML required fields) | 🔶 | No phone/address format validation |
| Country dropdown (ISO list) | 🔶 | Free-text field; no dropdown |

---

### 5. Invoices (`AdminInvoicesView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| List all invoices with search, status filter, vendor filter, date range | ✅ | |
| Paginated table | ✅ | |
| Approve / reject invoice with reason | ✅ | |
| Record payment (date, method, reference, notes) | ✅ | |
| Mark as Under Review | ✅ | |
| Create invoice on behalf of vendor | ✅ | |
| Assign service from catalogue to invoice | ✅ | |
| CSV export | ✅ | |
| Role-based access | ✅ | |
| Bulk select + bulk actions | ✅ | |
| Invoice detail view modal | ✅ | |
| Invoice PDF / print view | ❌ | Download is plain text only |
| Email vendor when invoice status changes | ❌ | No email integration |
| Overdue invoice automatic flagging on list | ✅ | Overdue rows highlighted orange in invoice list |

---

### 6. Documents (`AdminDocumentsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| List all documents with search and status filter | ✅ | |
| Approve / reject with reason | ✅ | |
| Reset document to Pending Review | ✅ | |
| Inline file preview (image / PDF iframe) | ✅ | |
| File download | ✅ | |
| View-details modal | ✅ | |
| Expiry date display | ✅ | |
| Document expiry alert / warning | ❌ | Expired documents not flagged anywhere |
| Bulk approve / reject | ❌ | All actions are per-document only |
| Filter by vendor | ✅ | |
| Filter by document type | ✅ | |
| Export document list as CSV | ❌ | |

---

### 7. Services (`ServicesView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Create / edit / delete services | ✅ | |
| Active / inactive toggle | ✅ | |
| Category + unit price + unit | ✅ | |
| Search services | ✅ | |
| Stats (total, active, inactive) | ✅ | |
| Currency hardcoded to NGN (ignores settings currency) | ✅ | Now uses global `formatCurrency` from vendorUtils |
| Assign services to vendors | ❌ | No per-vendor service mapping |
| Service usage report (how many invoices use each service) | ❌ | |

---

### 8. Audit Log (`AuditLogView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Full action history table | ✅ | |
| Search + action-type filter + date range filter | ✅ | |
| Paginated (50/page) | ✅ | |
| CSV export | ✅ | |
| Clear log | ✅ | |
| Logged actions: vendor created/deleted, status changed, invoice status/payment, document approved/rejected/reset | ✅ | |
| `performedBy` field (shows current admin user) | 🔶 | Defaults to "Admin" — not always attributed to named user |
| Log vendor edit actions | ❌ | Vendor field edits are not audited |
| Log document upload | ❌ | Not currently a tracked action type |

---

### 9. Notifications (`NotificationsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| List all system notifications | ✅ | |
| Mark individual / all as read | ✅ | |
| Delete individual / all | ✅ | |
| Unread count badge in sidebar | ✅ | |
| Filter all / unread | ✅ | |
| Vendor notifications generated on status change | ✅ | |
| Admin-facing notifications (e.g. "new invoice submitted") | ❌ | Notifications are vendor-side only; admins have no inbox |

---

### 10. Settings (`SettingsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Company info (name, email, phone, address) | ✅ | |
| Currency selector (NGN/USD/GBP/EUR) | ✅ | |
| Invoice prefix + max invoice amount | ✅ | |
| Email notifications toggle | ✅ | |
| Workflow: require document approval, auto-approve | ✅ | |
| Admin users list (add / remove) | ✅ | |
| Admin roles (Super Admin / Admin / Viewer) | ✅ | |
| Portal password protection | ✅ | |
| Per-user passwords (not just portal-wide) | ❌ | All users share one portal password |
| Role-based edit restrictions per user | 🔶 | Viewer role hides buttons but is not enforced server-side |
| Email SMTP configuration | ❌ | Email notifications flag exists but no real email send |
| Data export / backup (full system export) | ❌ | |

---

### 11. Global Search (in `App.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Ctrl+K overlay search | ✅ | |
| Search vendors by name/code/email/phone | ✅ | |
| Search invoices by number/vendor/description | ✅ | |
| Search documents by name/vendor | ✅ | |
| Navigate to result (vendor → profile, invoice/doc → view) | ✅ | |
| Keyboard navigation (arrow keys) of results | ✅ | Arrow up/down + Enter supported |
| Search by service name | ❌ | |

---

## VENDOR PORTAL

### 1. Login (`VendorLogin.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Login by vendor code or email | ✅ | |
| Show vendor status on login | ✅ | |
| Rejected vendor sees rejection reason | 🔶 | Status shown, but rejection reason from admin not surfaced |

---

### 2. Dashboard (`VendorDashboardView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Welcome banner with vendor status badge | ✅ | |
| Status-aware alerts (Pending / Approved / Rejected) | ✅ | |
| Invoice stats + financial overview (total, paid, pending) | ✅ | |
| Document stats | ✅ | |
| Quick actions (Submit Invoice, Upload Document, Profile) | ✅ | |
| Recent invoices list | ✅ | |
| Recent activity timeline | ✅ | |
| "Update Profile" quick action links to read-only profile | 🔧 | Button says "Update Profile" but profile page has no edit form |
| Show rejection reason when status is Rejected | ❌ | Alert shows generic message, not the admin-entered reason |
| Invoice status breakdown chart | ❌ | |

---

### 3. Invoices (`VendorInvoicesView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Submit new invoice | ✅ | |
| Edit invoice (only Submitted status) | ✅ | |
| Delete invoice (only Submitted status) | ✅ | |
| Invoice detail view modal | ✅ | |
| Download invoice as text file | ✅ | |
| Search invoices | ✅ | |
| Per-row dropdown (view, edit, download, delete) | ✅ | |
| Invoice number auto-generated | ✅ | |
| Invoice PDF export (formatted) | ❌ | Download is plain `.txt` — not a real PDF |
| Attach files / attachments to invoice | ❌ | |
| Invoice status history log | ❌ | Vendor can't see when/why status changed |

---

### 4. Documents (`VendorDocumentsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| Upload document with type, name, expiry, notes, file | ✅ | |
| File validation (5MB max, PDF/JPG/PNG) | ✅ | |
| View status (Approved / Pending / Rejected) | ✅ | |
| Rejection reason displayed per document | ✅ | |
| File preview (Eye icon → new tab) | ✅ | |
| File download | ✅ | |
| Replace / re-upload a rejected document | ❌ | Must upload a whole new entry |
| Delete / remove a document | ❌ | No delete option in vendor portal |

---

### 5. Profile (`VendorPortalApp.jsx` — inline component)
| Feature | Status | Notes |
|---|---|---|
| Read-only display of all vendor fields | ✅ | |
| Edit / update profile fields | ❌ | Profile is entirely read-only for vendors |
| Change contact email / phone | ❌ | |
| Change login credentials | ❌ | |

---

### 6. Notifications (`VendorNotificationsView.jsx`)
| Feature | Status | Notes |
|---|---|---|
| List notifications | ✅ | |
| Mark as read | ✅ | |
| Delete notification | ✅ | |
| Unread badge in sidebar | ✅ | |
| Mark all read | 🔶 | Button not present in vendor notifications view (only admin's) |

---

## CROSS-CUTTING GAPS

| Area | Gap |
|---|---|
| **Data persistence** | All data in `localStorage` — clears on browser data wipe, no sync across devices |
| **Real email** | Email notification flag exists in settings but no email is actually sent |
| **File storage** | Documents stored as base64 in localStorage — large files will hit storage limits fast |
| **Authentication** | Single shared password; no JWT/session tokens; no per-user credentials |
| **Mobile / responsive** | Sidebar collapses but tables overflow on small screens |
| **Accessibility** | No ARIA labels, keyboard focus management, or screen reader support |

---

## FEATURE BACKLOG (Prioritised)

### Priority 1 — Core Gaps (High Business Value)

| # | Feature | Portal | Effort |
|---|---|---|---|
| P1-1 | Vendor profile edit form (vendor self-service) | Vendor | M |
| P1-2 | Show rejection reason to vendor on dashboard + login | Vendor | S |
| P1-3 | Clickable pending-action items on admin dashboard | Admin | S |
| P1-4 | Audit log entries for vendor edits + document uploads | Admin | S |
| P1-5 | Admin inbox notifications (new invoice, new document submitted) | Admin | M |
| P1-6 | Document expiry warnings on admin documents view | Admin | S |
| P1-7 | Mark-all-read button in vendor notifications | Vendor | S |

### Priority 2 — UX Improvements

| # | Feature | Portal | Effort |
|---|---|---|---|
| P2-1 | Column sort on vendor list table | Admin | S |
| P2-2 | Bulk delete confirmation modal | Admin | S |
| P2-3 | Bulk rejection reason modal | Admin | S |
| P2-4 | Period filter applied to financial metrics on dashboard | Admin | M |
| P2-5 | Keyboard navigation of global search results | Admin | S |
| P2-6 | Overdue invoices highlighted in invoice list | Admin | S |
| P2-7 | Filter documents by vendor + by type | Admin | S |
| P2-8 | Services `formatCurrency` use global settings currency | Admin | S |
| P2-9 | Per-vendor activity/audit tab in vendor profile | Admin | M |

### Priority 3 — Nice-to-Have / Future

| # | Feature | Portal | Effort |
|---|---|---|---|
| P3-1 | Invoice PDF export (formatted, printable) | Both | L |
| P3-2 | Replace/re-upload rejected document | Vendor | M |
| P3-3 | Vendor can delete their own documents | Vendor | S |
| P3-4 | Invoice status history visible to vendor | Vendor | M |
| P3-5 | Country field → ISO dropdown in Add Vendor form | Admin | S |
| P3-6 | Monthly vendor registration trend chart | Admin | M |
| P3-7 | Document bulk approve/reject | Admin | M |
| P3-8 | Document CSV export | Admin | S |
| P3-9 | Service usage stats on Services page | Admin | M |
| P3-10 | Admin notes/comments per vendor | Admin | M |
| P3-11 | Full data backup / export to JSON | Admin | M |

---

## PROGRESS TRACKER

Track session-by-session work here.

| Session | Date | Items Completed |
|---|---|---|
| Session 1 | 2026-04-05 | Audit completed, document created |
| Session 2 | 2026-04-05 | P1-1 through P1-7 — all Priority 1 core gaps implemented |
| Session 3 | 2026-04-05 | P2-1 through P2-9 — all Priority 2 UX gaps implemented + click-to-copy vendor ID |

---

*Update this file as features are completed — change status in the tables above and log sessions at the bottom.*
