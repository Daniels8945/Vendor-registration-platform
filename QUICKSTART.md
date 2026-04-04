# Quick Start Guide

## Files Overview

✅ **13 files created** - All components properly separated!

### Main Application
- `App.jsx` - Main app component (orchestrates everything)

### Components (3 files)
- `components/Sidebar.jsx` - Navigation sidebar
- `components/Toast.jsx` - Toast notifications

### Views (5 files)
- `views/DashboardView.jsx` - Dashboard with stats
- `views/VendorsView.jsx` - Vendor list table
- `views/AddVendorView.jsx` - Vendor registration form
- `views/ServicesView.jsx` - Services (placeholder)
- `views/SettingsView.jsx` - Settings (placeholder)

### Modals (2 files)
- `modals/VendorDetailModal.jsx` - View vendor details
- `modals/DeleteConfirmationModal.jsx` - Confirm deletions

### Utilities (2 files)
- `utils/vendorUtils.js` - Helper functions & storage
- `utils/constants.js` - App constants & config

## Installation Steps

### 1. Copy Files
Copy the entire `onction-vendor-system` folder into your React project's `src` directory:

```
your-react-app/
└── src/
    └── onction-vendor-system/
        ├── App.jsx
        ├── components/
        ├── views/
        ├── modals/
        └── utils/
```

### 2. Install Dependencies

```bash
npm install lucide-react
```

Make sure Tailwind CSS is already configured in your project.

### 3. Import and Use

In your main `App.js` or `index.js`:

```jsx
import VendorSystem from './onction-vendor-system/App';

function App() {
  return <VendorSystem />;
}

export default App;
```

### 4. Run Your App

```bash
npm start
```

## What You Get

✅ Complete admin dashboard
✅ Vendor management (add, view, delete)
✅ Search functionality
✅ Statistics dashboard
✅ Toast notifications
✅ Modals for actions
✅ Responsive design
✅ Persistent storage

## Component Dependencies

```
App.jsx
├── Sidebar.jsx
├── Toast.jsx
├── VendorDetailModal.jsx
├── DeleteConfirmationModal.jsx
└── Views
    ├── DashboardView.jsx
    ├── VendorsView.jsx
    ├── AddVendorView.jsx
    ├── ServicesView.jsx
    └── SettingsView.jsx
```

All components are properly separated and reusable!

## Customization

- **Branding**: Edit `components/Sidebar.jsx` and `views/DashboardView.jsx`
- **Vendor Codes**: Modify `utils/vendorUtils.js`
- **Menu Items**: Update `utils/constants.js`
- **Styling**: All components use Tailwind - easy to customize!

## Need Help?

Check `README.md` for detailed documentation.

---

**Built for Onction Service Limited** 🚀
