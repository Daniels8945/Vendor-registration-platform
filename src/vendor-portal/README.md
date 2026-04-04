# Onction Vendor Portal

A complete vendor portal for Onction Service Limited, separate from the admin system.

## Features

### ✅ For Vendors:
- 🔐 **Login with Vendor Code** - Secure access using unique OSL code
- 📊 **Dashboard** - View status, stats, and quick actions
- 📄 **Invoice Submission** - Submit and track invoices
- 📁 **Document Upload** - Upload certificates and licenses
- 👤 **Profile Management** - View vendor information
- 🔔 **Notifications** - Receive messages from admin

## Project Structure

```
vendor-portal-complete/
├── VendorPortalApp.jsx           # Main app component
├── components/
│   └── VendorLogin.jsx            # Login page
├── views/
│   ├── VendorDashboardView.jsx    # Dashboard
│   ├── VendorInvoicesView.jsx     # Invoice management
│   └── VendorDocumentsView.jsx    # Document uploads
└── utils/
    ├── constants.js               # App constants
    └── vendorUtils.js             # Utility functions
```

## Installation

### 1. Copy Files
Copy the `vendor-portal-complete` folder into your React project:

```
your-react-app/
└── src/
    └── vendor-portal/
        ├── VendorPortalApp.jsx
        ├── components/
        ├── views/
        └── utils/
```

### 2. Install Dependencies

```bash
npm install lucide-react
```

### 3. Set Up Routing

In your main app, set up routing for vendor portal:

```jsx
import VendorPortalApp from './vendor-portal/VendorPortalApp';

// In your router
<Route path="/vendor/*" element={<VendorPortalApp />} />
```

Or use it as standalone:

```jsx
import VendorPortalApp from './vendor-portal/VendorPortalApp';

function App() {
  return <VendorPortalApp />;
}
```

## How It Works

### Vendor Login
- Vendors use their unique vendor code (e.g., OSL-2026-ABC-1234)
- System validates code and loads vendor data
- No password needed (code acts as authentication)

### Dashboard
- Shows vendor status (Pending/Approved/Rejected)
- Displays quick stats (invoices, documents, notifications)
- Quick action buttons for common tasks

### Invoice Submission
- **Only approved vendors can submit invoices**
- Fill in invoice details (number, amount, dates, description)
- Track invoice status (Submitted → Under Review → Approved → Paid)
- View invoice history

### Document Upload
- Upload required business documents
- Track document approval status
- Get notified when documents are reviewed
- Supported: Business Registration, Tax Certificates, Insurance, etc.

### Profile
- View company information
- Check vendor status
- See contact details

## Vendor Workflow

```
1. Vendor registers through admin portal
   ↓
2. Vendor receives OSL code via email
   ↓
3. Vendor logs into portal with code
   ↓
4. Status shows "Pending Review"
   ↓
5. Vendor uploads required documents
   ↓
6. Admin reviews and approves
   ↓
7. Status changes to "Approved"
   ↓
8. Vendor can now submit invoices
```

## Features by Status

### Pending Review
- ✅ View dashboard
- ✅ Upload documents
- ✅ View profile
- ❌ Cannot submit invoices

### Approved
- ✅ All features unlocked
- ✅ Submit invoices
- ✅ Full access

### Rejected/Inactive
- ✅ View dashboard
- ✅ View profile
- ❌ Cannot submit invoices
- ❌ Cannot upload documents

## Admin Integration

The vendor portal integrates with the admin system:

**Admin can:**
- View all vendor invoices
- Approve/reject vendor registrations
- Review uploaded documents
- Send notifications to vendors
- Update invoice status

**Data storage keys:**
- Vendors: `vendor:{vendorCode}`
- Invoices: `invoice:{vendorCode}:{invoiceId}`
- Documents: `document:{vendorCode}:{docId}`
- Notifications: `notification:{vendorCode}:{notifId}`

## Customization

### Branding
Update in `components/VendorLogin.jsx`:
```jsx
<h1>Vendor Portal</h1>
<p>Onction Service Limited</p>
```

### Document Types
Edit `utils/constants.js`:
```javascript
export const DOCUMENT_TYPES = [
  'Business Registration',
  'Tax Certificate',
  // Add more types
];
```

### Invoice Status
Edit `utils/constants.js`:
```javascript
export const INVOICE_STATUS = {
  SUBMITTED: 'Submitted',
  // Add more statuses
};
```

## Security Notes

- Vendor code acts as authentication
- No passwords stored
- Data isolated by vendor code
- Admin system has separate access

## Deployment

### Separate Domains (Recommended)
- Admin: `admin.onction.com`
- Vendor: `vendors.onction.com`

### Same Domain
- Admin: `onction.com/admin`
- Vendor: `onction.com/vendor`

## Support

Vendors can contact: `vendors@onction.com`

---

**Built for Onction Service Limited** 🚀
**Separate from Admin Portal**
