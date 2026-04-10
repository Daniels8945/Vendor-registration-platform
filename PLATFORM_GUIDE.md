# Vendor Platform — User Guide

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started](#2-getting-started)
3. [Admin Portal](#3-admin-portal)
   - [Logging In](#31-logging-in)
   - [Dashboard](#32-dashboard)
   - [Vendor Management](#33-vendor-management)
   - [Invoices](#34-invoices)
   - [Documents](#35-documents)
   - [Services](#36-services)
   - [Notifications](#37-notifications)
   - [Audit Log](#38-audit-log)
   - [Settings](#39-settings)
4. [Vendor Portal](#4-vendor-portal)
   - [Self-Registration](#41-self-registration)
   - [Logging In](#42-logging-in)
   - [Dashboard](#43-dashboard)
   - [Submitting Invoices](#44-submitting-invoices)
   - [Managing Documents](#45-managing-documents)
   - [Profile](#46-profile)
   - [Notifications](#47-notifications)
5. [Password & Security](#5-password--security)
6. [API Reference](#6-api-reference)
7. [Platform Completeness Checklist](#7-platform-completeness-checklist)

---

## 1. Platform Overview

This is a full-stack vendor registration and management platform built for **Onction Service Limited**. It has two separate portals:

| Portal | URL | Who uses it |
|--------|-----|-------------|
| Admin Portal | `http://localhost:5173/admin` | Internal staff managing vendors |
| Vendor Portal | `http://localhost:5173/vendor` | Registered vendors |

**Tech stack:** React 19 + Tailwind CSS (frontend) · Express 5 + SQLite (backend) · JWT authentication · File uploads via Multer · PDF generation via jsPDF

---

## 2. Getting Started

### Prerequisites
- Node.js 18 or later
- npm

### Installation

```bash
# Install dependencies
npm install

# Start both the API server and the frontend dev server
npm run dev
```

This starts:
- **API server** on `http://localhost:3001`
- **Frontend** on `http://localhost:5173`

### Environment Variables (optional)

Create a `.env` file in the project root to override defaults:

```env
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
DB_PATH=./server/data/vendor_platform.db
UPLOADS_DIR=./server/uploads

# Email (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@onction.com
```

### Default Admin Account

On first run, a default admin is created automatically:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@1234` |

**You will be prompted to change this password on first login.**

---

## 3. Admin Portal

Access at: `http://localhost:5173/admin`

### 3.1 Logging In

1. Go to `/admin/login`
2. Enter your username (or email) and password
3. On first login with the default account, you will be asked to set a new password before proceeding

The session lasts **8 hours** (configurable). After **30 minutes of inactivity**, you will see a warning and be logged out automatically.

---

### 3.2 Dashboard

The dashboard gives a real-time overview of the platform.

**Period filter** (top right): Switch between All Time, This Year, This Quarter, This Month.

**Stat cards:**
- Total Vendors, Approved, Pending Review, Manufacturers, Distributors, Rejected

**Financial summary** (appears when invoices exist):
- Total Invoiced, Total Paid, Pending Payment, Overdue

**Pending Actions** (orange banner): Quick-links to vendors awaiting review, invoices needing attention, documents pending review.

**Charts:** Vendors by Status · Vendors by Type

**Recent Vendors:** Click any row to open the vendor's full profile.

---

### 3.3 Vendor Management

#### Viewing Vendors (`/admin/vendors`)

The vendor list shows all registered vendors with search, filter by status/type, and sort by any column.

- **Search:** Type in the search bar to filter by company name, email, vendor code, contact name, or products/services
- **Status filter:** Pending Review · Approved · Rejected · Inactive
- **Type filter:** Manufacturer · Distributor · Service Provider
- **Sort:** Click any column header to sort ascending/descending

#### Adding a Vendor (`/admin/vendors/add`)

Fill in the required fields:
- Company Name, Business Type, Products/Services (required)
- Contact details: First Name, Last Name, Email, Phone
- Address fields

A unique **Vendor Code** is auto-generated (e.g. `OSL-2026-XYZ-1234`) and assigned on creation.

The vendor can then log into the Vendor Portal using this code.

#### Vendor Profile (`/admin/vendors/:id`)

Click any vendor row → opens the full vendor profile page with tabs:

| Tab | Contents |
|-----|----------|
| **Overview** | Company info, contact details, status badge, edit button |
| **Invoices** | All invoices submitted by this vendor |
| **Documents** | All documents uploaded by this vendor |
| **Notes** | Internal admin notes (not visible to vendor) |
| **Activity** | Audit trail of actions related to this vendor |

**Changing vendor status:**
- Use the status dropdown on the Overview tab
- Selecting **Rejected** prompts for a rejection reason
- Status options: Pending Review · Approved · Rejected · Inactive

**Editing vendor details:**
- Click the **Edit** button on the Overview tab
- Modify any field and click **Save Changes**

**Adding a note:**
- Go to the Notes tab
- Type in the text area and click **Add Note**
- Notes are timestamped and attributed to the logged-in admin
- Click the trash icon to delete a note

**Deleting a vendor:**
- Use the delete button on the vendor list (with confirmation prompt)
- This permanently removes the vendor and all associated data

---

### 3.4 Invoices

Access at: `/admin/invoices`

Lists all invoices from all vendors. Columns: Invoice #, Vendor, Service, Amount, Status, Due Date, Submitted.

**Filters:** Status · Vendor · Date range

**Invoice statuses and transitions:**

```
Submitted → Under Review → Approved → Paid
                        ↘ Rejected
```

**Actions per invoice (click the ⋮ menu or expand the row):**

| Action | Description |
|--------|-------------|
| View Details | Expand to see line items, notes, status history |
| Approve | Move to Approved; notifies vendor |
| Reject | Requires a rejection reason; notifies vendor |
| Mark as Paid | Records payment date, method, reference |
| Download PDF | Generates and downloads a formatted invoice PDF |

**Creating an invoice on behalf of a vendor:**
- Click **New Invoice** (top right)
- Select vendor, service, fill amounts and line items
- Submit — the invoice appears in the vendor's portal immediately

**Exporting:**
- Click **Export CSV** to download all visible invoices as a spreadsheet

---

### 3.5 Documents

Access at: `/admin/documents`

Lists all documents uploaded by vendors. Columns: Document Name, Type, Vendor, Uploaded, Expiry, Status.

**Document statuses:** Pending Review · Approved · Rejected

**Actions:**

| Action | How |
|--------|-----|
| Approve | Click **Approve** button on the row |
| Reject | Click **Reject** — enter a reason |
| Reset to Pending | Click **Reset** to send back for re-review |
| Download | Click the download icon to get the file |

**Filters:** Status · Document Type · Vendor · Search by name

**Expiry warnings:** Documents with an expiry date show a warning badge when they are within 30 days of expiry or already expired.

---

### 3.6 Services

Access at: `/admin/services`

A catalogue of services that vendors can reference when submitting invoices.

**Adding a service:**
1. Click **Add Service**
2. Fill in: Name (required), Category, Unit Price, Unit (e.g. "per hour"), Description
3. Check **Active** to make it visible to vendors
4. Click **Create Service**

**Editing:** Click the pencil icon on any row.

**Activating / Deactivating:** Click the green/grey status badge to toggle — no page reload needed.

**Deleting:** Click the trash icon → confirm in the modal.

**Categories:** IT & Software · Logistics · Manufacturing · Consulting · Maintenance · Supply · Other

---

### 3.7 Notifications

Access at: `/admin/notifications`

Shows all admin notifications (status changes, document uploads, invoice submissions, etc.).

- **Mark as read:** Click a notification or use **Mark All Read**
- **Delete:** Click the trash icon on a notification
- **Unread count** is shown as a red badge on the sidebar icon

---

### 3.8 Audit Log

Access at: `/admin/audit`

A tamper-evident log of all administrative actions on the platform.

Each entry records: Action type, Who performed it, Timestamp, Details (expandable).

**Search:** Filter by action type or keyword.

**Clear log:** Super Admins can clear the audit log from this page (use with caution — this is irreversible).

**Export CSV:** Download the full audit log for compliance purposes.

---

### 3.9 Settings

Access at: `/admin/settings`

Organized into three tabs:

#### Platform Settings
| Setting | Description |
|---------|-------------|
| Company Name | Displayed in emails and vendor portal |
| Company Email | Contact email shown to vendors |
| Currency | NGN, USD, GBP, EUR — affects all amount formatting |
| Invoice Prefix | Prefix for auto-generated invoice numbers (e.g. `INV`) |
| Vendor Code Prefix | Prefix for vendor codes (e.g. `OSL`) |
| Support Email | Shown in vendor portal for help requests |
| Require Document Approval | If on, documents stay Pending until manually approved |
| Auto-Approve Documents | If on, documents are approved automatically on upload |
| Max Invoice Amount | Optional cap; invoices above this are flagged |

#### Admin Users
Manage who has admin access to the platform.

- **Add User:** Enter name, email, username, password → click Add
- **Reset Password:** Click the key icon on any user row to set a new temporary password
- **Delete User:** Click the trash icon (cannot delete yourself)

**Roles:** Super Admin · Admin

#### Security (Change Your Password)
Enter your current password and a new password to change your own login credentials.

---

## 4. Vendor Portal

Access at: `http://localhost:5173/vendor`

### 4.1 Self-Registration

Vendors can register themselves at `/vendor/register`:

1. Fill in company information (name, type, products/services, website)
2. Fill in contact details (name, email, phone)
3. Fill in address
4. Submit the form

After submission, the account is created with **Pending Review** status. The vendor cannot submit invoices until an admin approves their account.

The vendor's unique **Vendor Code** is displayed after submission — they must save this to log in.

---

### 4.2 Logging In

Go to `/vendor/login`:

1. Enter the **Vendor Code** (e.g. `OSL-2026-XYZ-1234`)
2. If a password has been set, enter it
3. If no password is set yet, the vendor can set one from the profile page after logging in

**Blocked accounts:**
- **Rejected** vendors see the rejection reason and cannot log in
- **Inactive** vendors are told to contact support

Session expires after **8 hours** or **30 minutes of inactivity**.

---

### 4.3 Dashboard

The vendor dashboard shows:

- **Account status** banner (Pending / Approved / Rejected / Inactive)
- **Document expiry alerts** — warns if any uploaded documents are expired or expiring within 30 days
- **Financial summary:** Total invoiced, Total paid, Pending review count
- **Quick actions:** Submit Invoice · Upload Document · Update Profile
- **Recent Invoices** (last 3)
- **Recent Activity** timeline

---

### 4.4 Submitting Invoices

Go to `/vendor/invoices` → click **New Invoice**.

Fill in:
| Field | Notes |
|-------|-------|
| Invoice Number | Auto-generated if left blank |
| Service | Select from the service catalogue |
| Description | What the invoice is for |
| Amount | Total invoice amount |
| Due Date | Optional payment deadline |
| Line Items | Add individual line items (description, qty, unit price) |
| Notes | Internal notes for the admin reviewer |

Click **Submit Invoice**. The invoice appears immediately in the admin portal.

**Editing an invoice:** Only invoices in **Submitted** status can be edited. Click the pencil icon.

**Deleting an invoice:** Only **Submitted** or **Rejected** invoices can be deleted. Click the trash icon.

**Invoice statuses visible to vendor:**

| Status | Meaning |
|--------|---------|
| Submitted | Received by admin, awaiting review |
| Under Review | Admin is reviewing |
| Approved | Approved, awaiting payment |
| Paid | Payment has been processed |
| Rejected | Not approved — reason provided |

**Downloading PDF:** Click the download icon on any invoice to get a formatted PDF.

---

### 4.5 Managing Documents

Go to `/vendor/documents` → click **Upload Document**.

Fill in:
| Field | Notes |
|-------|-------|
| Document Name | Descriptive name |
| Document Type | Certificate of Incorporation, Tax ID, Insurance Certificate, etc. |
| Expiry Date | Optional — the platform will warn when it expires |
| Notes | Any context for the reviewer |
| File | PDF, images, Word docs (max 10 MB) |

Click **Upload**.

**Re-uploading:** If a document is rejected, click the **Re-upload** button to submit a new version.

**Deleting:** Click the trash icon to remove a document.

**Document statuses:**

| Status | Meaning |
|--------|---------|
| Pending Review | Uploaded, admin hasn't reviewed yet |
| Approved | Accepted |
| Rejected | Not accepted — reason provided |

---

### 4.6 Profile

Go to `/vendor/profile`.

Vendors can update:
- Company details (name, website, business type, products/services)
- Contact information (name, email, phone)
- Address

Click **Save Changes** to apply.

**Setting/Changing a password:**
- Enter current password (if one is set) and new password
- Click **Set Password** / **Change Password**

---

### 4.7 Notifications

Go to `/vendor/notifications`.

Vendors receive notifications when:
- Their account status changes (approved, rejected)
- An invoice is approved, rejected, or paid
- A document is approved or rejected

- Click a notification to mark it as read
- **Mark All Read** button at the top
- Delete individual notifications with the trash icon

---

## 5. Password & Security

### Forgot Password (Admin)

1. Go to `/admin/login` → click **Forgot Password**
2. Enter your admin email address
3. Check your email for a reset link (valid for 1 hour)
4. Click the link → enter a new password

### Forgot Password (Vendor)

1. Go to `/vendor/login` → click **Forgot Password**
2. Enter the email address registered with your vendor account
3. Check your email for a reset link (valid for 1 hour)
4. Click the link → enter a new password

> **Note:** Password reset emails require SMTP to be configured in `.env`. Without SMTP config, emails will not be sent.

### JWT Tokens

- Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default: 8 hours)
- A token refresh endpoint at `POST /api/auth/refresh` extends the session without re-login
- The frontend refreshes tokens automatically in the background

---

## 6. API Reference

The platform exposes a REST API at `http://localhost:3001/api`.

Interactive documentation (Swagger UI) is available at:
```
http://localhost:3001/api/docs
```

### Authentication

Include a Bearer token in the `Authorization` header for all protected endpoints:
```
Authorization: Bearer <token>
```

Obtain a token via:
- `POST /api/auth/admin/login` — admin login
- `POST /api/auth/vendor/login` — vendor login

### Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/admin/login` | None | Admin login |
| POST | `/api/auth/vendor/login` | None | Vendor login |
| POST | `/api/auth/vendor/forgot-password` | None | Request password reset |
| POST | `/api/auth/vendor/reset-password` | None | Reset vendor password |
| POST | `/api/auth/admin/forgot-password` | None | Request admin password reset |
| POST | `/api/auth/admin/reset-password` | None | Reset admin password |
| POST | `/api/auth/refresh` | Bearer | Refresh JWT token |
| GET | `/api/vendors` | Admin | List all vendors |
| POST | `/api/vendors` | Admin | Create vendor |
| GET | `/api/vendors/:id` | Auth | Get single vendor |
| PUT | `/api/vendors/:id` | Auth | Update vendor |
| DELETE | `/api/vendors/:id` | Admin | Delete vendor |
| PUT | `/api/vendors/:id/status` | Admin | Update vendor status |
| GET | `/api/vendors/:id/notes` | Admin | Get vendor notes |
| POST | `/api/vendors/:id/notes` | Admin | Add vendor note |
| DELETE | `/api/vendors/notes/:noteId` | Admin | Delete vendor note |
| GET | `/api/invoices` | Auth | List invoices |
| POST | `/api/invoices` | Auth | Create invoice |
| GET | `/api/invoices/:id` | Auth | Get single invoice |
| PUT | `/api/invoices/:id` | Auth | Update invoice |
| DELETE | `/api/invoices/:id` | Auth | Delete invoice |
| PUT | `/api/invoices/:id/status` | Admin | Update invoice status |
| POST | `/api/invoices/:id/payment` | Admin | Record payment |
| GET | `/api/documents` | Auth | List documents |
| POST | `/api/documents` | Auth | Upload document (multipart) |
| PUT | `/api/documents/:id/status` | Admin | Approve/reject document |
| DELETE | `/api/documents/:id` | Auth | Delete document |
| GET | `/api/services` | Auth | List services |
| POST | `/api/services` | Admin | Create service |
| PUT | `/api/services/:id` | Admin | Update service |
| DELETE | `/api/services/:id` | Admin | Delete service |
| GET | `/api/notifications` | Auth | List notifications |
| PUT | `/api/notifications/:id/read` | Auth | Mark notification read |
| PUT | `/api/notifications/read-all` | Auth | Mark all read |
| DELETE | `/api/notifications/:id` | Auth | Delete notification |
| GET | `/api/settings` | None | Get platform settings |
| PUT | `/api/settings` | Admin | Update settings |
| GET | `/api/audit` | Admin | Get audit log |
| DELETE | `/api/audit` | Admin | Clear audit log |
| GET | `/api/activities` | Auth | Get vendor activities |
| GET | `/api/health` | None | Health check |

---

## 7. Platform Completeness Checklist

### Admin Portal
- [x] Authentication (login, logout, forgot/reset password, forced password change on first login)
- [x] Session timeout with warning (30 min inactivity)
- [x] Dashboard with financial metrics and period filtering
- [x] Vendor list with search, filter, sort
- [x] Add vendor (admin-created)
- [x] Vendor profile with edit, status management, notes, invoice/document/activity tabs
- [x] Invoice management (approve, reject, mark paid, create on behalf of vendor, PDF export, CSV export)
- [x] Document management (approve, reject, reset, download)
- [x] Service catalogue (create, edit, activate/deactivate, delete)
- [x] Notifications (read, delete, mark all read)
- [x] Audit log (search, export CSV, clear)
- [x] Settings (platform config, admin user management, password change)
- [x] Global search (vendors, invoices, documents via keyboard shortcut)

### Vendor Portal
- [x] Self-registration form
- [x] Authentication (login with vendor code, forgot/reset password)
- [x] Session timeout with warning
- [x] Dashboard with stats, document expiry alerts, recent invoices, activity feed
- [x] Invoice submission with line items, edit, delete, PDF download
- [x] Document upload with expiry dates, re-upload, delete
- [x] Profile editing and password management
- [x] Notifications (read, mark all read, delete)
- [x] Inactive/Rejected vendor account blocking

### Backend
- [x] SQLite database with full schema (auto-migrates on startup)
- [x] JWT authentication for both admin and vendor
- [x] File uploads stored on disk, served as static files
- [x] Email notifications (password reset) via Nodemailer
- [x] Swagger API documentation at `/api/docs`
- [x] Audit logging for all admin actions
- [x] Activity logging for all vendor actions
- [x] Push notifications to vendor on status changes
