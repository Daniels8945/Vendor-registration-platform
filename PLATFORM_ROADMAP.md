# Vendor Registration Platform — Full Deployment Roadmap

> **Created:** 2026-04-05  
> **Stack:** React 19 · Vite 7 · Tailwind CSS 4 · localStorage (current data layer)  
> **Portals:** Admin (`src/admin-portal/`) · Vendor (`src/vendor-portal/`)  
> **Status key:** ✅ Done · 🔶 Partial · ❌ Missing · 🔧 Bug/Gap · 🚨 Blocker

---

## WHERE WE ARE RIGHT NOW

The platform is a **fully functional prototype** with two React SPAs. All core UI exists
and works end-to-end. The data layer is `localStorage` — meaning nothing persists across
browsers, devices, or server deploys. No backend, no real email, no real file storage,
no real auth. The gap between "working prototype" and "deployable product" is documented
exhaustively below.

---

## AUDIT: WHAT EXISTS TODAY

### Vendor Portal

| Screen | What Works | Gaps |
|---|---|---|
| Login | Code-based login, rejection reason shown, format validation | No password — vendor code is the only credential |
| Register | Full self-registration form, duplicate detection, admin notification | No CAPTCHA, no ToS checkbox, no real email confirmation |
| Dashboard | Stats, financial overview, status alerts with rejection reason, recent invoices, activity timeline | Invoice status badge hardcoded yellow (line 311 VendorDashboardView) |
| Invoices | Submit, edit, delete, view, search, .txt download | Currency label hardcoded "NGN"; no PDF; no invoice status history; no line-items (single amount only) |
| Documents | Upload (PDF/JPG/PNG, 5MB), view status, rejection reason, preview, download | Cannot re-upload rejected doc; no delete; no expiry warning to vendor |
| Profile | Edit contact + address fields, read-only company/code fields | Cannot change business type; no password change (vendor has no password) |
| Notifications | List, mark read, mark all read, delete | — |

### Admin Portal

| Screen | What Works | Gaps |
|---|---|---|
| Dashboard | Stat cards, period filter, financial metrics, charts, pending actions banner, recent vendors | Top vendors widget missing; monthly trend chart missing |
| Vendor List | Search, filter, sort, pagination, bulk actions, CSV import/export, click-to-copy ID | Date Registered column missing from table |
| Vendor Profile | Full detail, edit all fields, status management, docs tab, invoices tab, notes, activity, checklist | — |
| Add Vendor | Full form, duplicate detection, auto code, audit log | — |
| Invoices | Full CRUD, bulk actions, approve/reject, record payment, overdue highlight, CSV export | No formatted PDF export |
| Documents | List, approve/reject, preview, download, vendor + type filter | No bulk approve/reject; no CSV export |
| Services | Create/edit/delete, active toggle, currency from settings | No per-vendor service mapping; no usage stats |
| Audit Log | Full history, search, filter, date range, CSV, clear | Vendor edit actions not logged; document upload not logged by admin |
| Notifications | List all, mark read, delete, unread badge | Admin inbox only gets vendor-triggered events |
| Settings | Company info, currency, invoice config, workflow toggles, admin user management, password gate | No SMTP config; no per-user passwords; no data backup/export |
| Global Search | Ctrl+K, vendors/invoices/documents, keyboard nav | Services not searchable |

---

## BUGS FOUND IN AUDIT

| # | File | Line | Issue | Severity |
|---|---|---|---|---|
| B-1 | `VendorDashboardView.jsx` | 311 | Invoice status badge always uses `bg-yellow-100 text-yellow-800` regardless of status — should use `INVOICE_STATUS_COLORS` | Low |
| B-2 | `VendorInvoicesView.jsx` | 189 | Currency label hardcoded `"NGN"` — should read from settings or use vendor portal's `formatCurrency` | Low |
| B-3 | `vendor-portal/utils/vendorUtils.js` | 13 | `formatCurrency` hardcoded to `NGN` locale — should read global settings currency | Medium |
| B-4 | `VendorLogin.jsx` | 15 | Vendor code regex only accepts current year pattern — will break codes issued in 2027+ without regex update | Low |

---

## GAP ANALYSIS: WHAT IS MISSING FOR PRODUCTION

### TIER 1 — BLOCKERS (platform cannot ship without these)

These are non-negotiable for a real deployment. They are not UI features — they are
infrastructure and security foundations.

| # | Gap | Why It Blocks Deployment |
|---|---|---|
| T1-1 | **Backend API + database** | localStorage is per-browser. No data survives a refresh on a new device. Multi-user admin is impossible. |
| T1-2 | **Real authentication (vendor)** | Vendor logs in with only their code — no password. Anyone who knows a code can impersonate a vendor. |
| T1-3 | **Real authentication (admin)** | Single shared plain-text password in localStorage. No per-user credentials, no sessions, no JWT. |
| T1-4 | **Real file storage** | Documents stored as base64 strings in localStorage. A single 5MB file risks exhausting the ~5–10MB localStorage quota. |
| T1-5 | **Real email delivery** | Registration confirmations, approval/rejection notifications, and admin alerts are all simulated. Vendors receive no actual email. |
| T1-6 | **URL routing** | `react-router-dom` is installed but unused. No page has its own URL. Bookmarking, deep-linking, and browser back/forward are broken. |

---

### TIER 2 — HIGH PRIORITY (required for a usable product)

| # | Gap | Portal | Impact |
|---|---|---|---|
| T2-1 | Vendor password / credential system | Vendor | Security |
| T2-2 | Password reset flow | Both | Usability |
| T2-3 | Session expiry / logout on inactivity | Both | Security |
| T2-4 | Invoice PDF export (formatted, printable) | Both | Core workflow |
| T2-5 | Replace / re-upload a rejected document | Vendor | Blocks workflow loop |
| T2-6 | Vendor can delete their own documents | Vendor | Basic data management |
| T2-7 | Invoice line items (multiple line items per invoice, not just total amount) | Both | Core invoice UX |
| T2-8 | Vendor portal currency reads from global settings | Vendor | Data consistency |
| T2-9 | Company name pulled from settings (remove all hardcoded "Onction") | Both | White-label readiness |
| T2-10 | Document expiry warning banner on vendor dashboard | Vendor | Compliance |
| T2-11 | Invoice status history visible to vendor | Vendor | Transparency |
| T2-12 | Date Registered column in vendor list table | Admin | Basic usability |

---

### TIER 3 — IMPORTANT (polish and completeness)

| # | Gap | Portal | Impact |
|---|---|---|---|
| T3-1 | Monthly vendor registration trend chart | Admin | Analytics |
| T3-2 | Top-performing vendors widget on dashboard | Admin | Analytics |
| T3-3 | Document bulk approve / reject | Admin | Efficiency |
| T3-4 | Document list CSV export | Admin | Reporting |
| T3-5 | Service usage stats (which services appear in invoices) | Admin | Analytics |
| T3-6 | Per-vendor service assignment mapping | Admin | Business logic |
| T3-7 | Search by service name in global search (Ctrl+K) | Admin | UX |
| T3-8 | Full data backup / export to JSON | Admin | Data portability |
| T3-9 | Per-user admin passwords (not shared portal password) | Admin | Security |
| T3-10 | Audit log for vendor field edits | Admin | Compliance |
| T3-11 | Audit log for admin settings changes | Admin | Compliance |
| T3-12 | Fix invoice status badge color in vendor dashboard (B-1) | Vendor | Polish |
| T3-13 | Vendor code regex future-proofed for year change (B-4) | Vendor | Bug |

---

### TIER 4 — NICE TO HAVE

| # | Gap | Portal |
|---|---|---|
| T4-1 | CAPTCHA / rate limiting on self-registration form | Vendor |
| T4-2 | Terms of Service / Privacy Policy checkbox on registration | Vendor |
| T4-3 | Vendor self-service: change business type with admin approval | Vendor |
| T4-4 | Invoice attachment / file upload | Both |
| T4-5 | Mobile-responsive tables (overflow scrolling on small screens) | Both |
| T4-6 | ARIA labels and keyboard focus management (accessibility) | Both |
| T4-7 | Dark mode | Both |
| T4-8 | Email SMTP configuration in settings (host, port, user, pass) | Admin |
| T4-9 | Vendor portal language / locale selector | Vendor |
| T4-10 | Two-factor authentication for admin | Admin |
| T4-11 | Webhook support (notify external systems on status change) | Admin |
| T4-12 | Invoice approval workflow with configurable steps | Admin |
| T4-13 | Bulk vendor import with field mapping UI (not just CSV paste) | Admin |

---

## FULL FEATURE BACKLOG (Ordered)

### Phase 1 — Foundation (make data and auth real)
*Nothing in Phase 2+ is meaningful without this.*

| ID | Task | Effort |
|---|---|---|
| P1-A | Set up backend (Node/Express or Next.js API routes) + PostgreSQL or MongoDB | XL |
| P1-B | Migrate localStorage reads/writes to API calls (vendors, invoices, documents, notifications, audit) | XL |
| P1-C | JWT-based admin authentication with per-user credentials | L |
| P1-D | Vendor authentication: add password field, hash on creation, verify on login | L |
| P1-E | File storage integration (S3/Cloudinary/Supabase Storage) — replace base64 | L |
| P1-F | Email integration (SendGrid/Resend/Nodemailer) — replace localStorage notifications | M |
| P1-G | Wire `react-router-dom` — each view gets its own URL | M |

### Phase 2 — Core Workflow Gaps
*The features vendors and admins need every day.*

| ID | Task | Effort |
|---|---|---|
| P2-A | Invoice line items — multiple line items per invoice with quantity × unit price | M |
| P2-B | Invoice PDF export (formatted, printable, downloadable) | L |
| P2-C | Re-upload rejected document (replace file, reset status to Pending Review) | S |
| P2-D | Vendor can delete their own documents | S |
| P2-E | Invoice status history log — vendor can see when/why status changed | M |
| P2-F | Document expiry warning on vendor dashboard | S |
| P2-G | Vendor portal currency reads from global settings | S |
| P2-H | Company name pulled from settings across both portals | S |
| P2-I | Date Registered column in admin vendor list | S |
| P2-J | Fix invoice status badge color on vendor dashboard | S |
| P2-K | Password reset flow (email link) for both portals | M |
| P2-L | Session timeout with re-login prompt | S |

### Phase 3 — Analytics and Reporting
*Admin visibility and business intelligence.*

| ID | Task | Effort |
|---|---|---|
| P3-A | Monthly vendor registration trend chart (line chart) | M |
| P3-B | Top-performing vendors widget (by invoice value / payment rate) | M |
| P3-C | Document bulk approve / reject with reason | M |
| P3-D | Document list CSV export | S |
| P3-E | Service usage stats on Services page | M |
| P3-F | Full data backup / export to JSON | M |
| P3-G | Audit log for vendor field edits | S |
| P3-H | Audit log for settings changes | S |
| P3-I | Search services in global Ctrl+K search | S |
| P3-J | Per-vendor service assignment mapping | M |

### Phase 4 — Security Hardening
*Before exposing to the internet.*

| ID | Task | Effort |
|---|---|---|
| P4-A | Per-user admin passwords with bcrypt hashing | M |
| P4-B | Rate limiting on login + registration endpoints | S |
| P4-C | CAPTCHA on self-registration | S |
| P4-D | Input sanitization and output encoding (XSS prevention) | M |
| P4-E | CSRF protection on all state-changing API endpoints | M |
| P4-F | HTTPS enforcement + security headers (HSTS, CSP, X-Frame-Options) | S |
| P4-G | Two-factor authentication for admin users | L |

### Phase 5 — Polish and Accessibility

| ID | Task | Effort |
|---|---|---|
| P5-A | ARIA labels on all icon-only buttons | M |
| P5-B | Keyboard focus traps in modals | S |
| P5-C | Mobile-responsive table overflow handling | M |
| P5-D | Terms of Service / Privacy Policy checkbox on registration | S |
| P5-E | Email SMTP configuration UI in admin settings | M |
| P5-F | Invoice attachment support | M |

---

## DEPLOYMENT READINESS SCORECARD

| Dimension | Current | Target | Gap |
|---|---|---|---|
| Data persistence | localStorage only | Database (SQL/NoSQL) | Phase 1-B |
| Admin auth | Shared plain-text password | JWT + per-user bcrypt | Phase 1-C |
| Vendor auth | Vendor code only | Code + password | Phase 1-D |
| File handling | Base64 in localStorage | Object storage (S3) | Phase 1-E |
| Email | Simulated (localStorage) | SMTP / transactional API | Phase 1-F |
| URL routing | None (view state only) | react-router-dom | Phase 1-G |
| Invoice output | Plain .txt download | Formatted PDF | Phase 2-B |
| Security | None | Rate limit, CSRF, HTTPS | Phase 4 |
| Accessibility | Minimal | WCAG AA | Phase 5 |
| Test coverage | Playwright installed, 0 tests written | Core flows covered | Ongoing |

**Current score: 3 / 10 — prototype, not shippable**  
**After Phase 1: 6 / 10 — functional beta**  
**After Phase 2: 8 / 10 — production-ready MVP**  
**After Phases 3–5: 10 / 10 — fully deployable product**

---

## HARDCODED VALUES TO CLEAN UP

All of these need to read from settings or environment config before deployment.

| Value | Files Affected |
|---|---|
| `"Onction"` company name | `VendorDashboardView.jsx`, `VendorInvoicesView.jsx`, `VendorDocumentsView.jsx`, `VendorRegisterForm.jsx`, `SettingsView.jsx`, `VendorNotificationsView.jsx` |
| `"NGN"` currency in vendor portal | `vendor-portal/utils/vendorUtils.js:13`, `VendorInvoicesView.jsx:189` |
| `"OSL"` vendor code prefix | `VendorRegisterForm.jsx:22`, `admin-portal/utils/vendorUtils.js:98` |
| `"vendors@onction.com"` support email | `VendorLogin.jsx:128` |
| Countries list (7 entries) | `VendorRegisterForm.jsx:4`, `admin-portal/utils/constants.js:15` — needs full ISO list |

---

## PROGRESS TRACKER

| Session | Date | Phase | Items Completed |
|---|---|---|---|
| Session 1 | 2026-04-05 | Audit | Initial feature audit — FEATURE_AUDIT.md created |
| Session 2 | 2026-04-05 | P1 Features | P1-1 through P1-7 (all Priority 1 core gaps) |
| Session 3 | 2026-04-05 | P2 Features | P2-1 through P2-9 (all Priority 2 UX gaps) + click-to-copy vendor ID |
| Session 4 | 2026-04-05 | Onboarding | Vendor self-registration form, admin email alert on signup, VendorLogin error fixes |
| Session 5 | 2026-04-05 | Audit | Full deployment audit — this document |
| Session 6 | 2026-04-05 | Phase 1 + 2 | Backend (Node/Express + SQLite), JWT auth, all API routes, react-router-dom, P2-A through P2-J all done |
| Session 7 | 2026-04-05 | Phase 2 complete | P2-L (session timeout 30 min, both portals), P2-K (password reset — backend routes + email + UI), P2-B (invoice PDF export with jsPDF) |

**Currently at:** End of Session 7 — **All of Phase 1 and Phase 2 are complete.**

**Next session should start with:** Phase 3 — Analytics and Reporting
1. **P3-A** — Monthly vendor registration trend chart (line chart on admin dashboard)
2. **P3-B** — Top-performing vendors widget (by invoice value)
3. **P3-C** — Document bulk approve / reject with reason
4. **P3-D** — Document list CSV export
5. **P3-E** — Service usage stats on Services page
6. **P3-G + P3-H** — Audit log for vendor field edits + settings changes
7. **P3-F** — Full data backup / export to JSON
8. **P3-I** — Search services in global Ctrl+K search
9. **P3-J** — Per-vendor service assignment mapping

---

*Keep this file as the single source of truth. Update the Progress Tracker after every session.*
