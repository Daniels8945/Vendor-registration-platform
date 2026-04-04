# Onction Vendor Management System

A complete admin dashboard for managing vendors with React and Tailwind CSS.

## Features

- 📊 Dashboard with statistics and recent vendors
- 👥 Full vendor list with search functionality
- ➕ Add new vendors with comprehensive form
- 👁️ View vendor details in modal
- 🗑️ Delete vendors with confirmation
- 🎨 Professional UI with Tailwind CSS
- 💾 Persistent storage (localStorage/window.storage)
- 🔔 Toast notifications
- 📱 Responsive design

## Project Structure

```
onction-vendor-system/
├── App.jsx                          # Main application component
├── components/
│   ├── Sidebar.jsx                  # Navigation sidebar
│   └── Toast.jsx                    # Toast notification component
├── views/
│   ├── DashboardView.jsx            # Dashboard overview
│   ├── VendorsView.jsx              # Vendor list table
│   ├── AddVendorView.jsx            # Vendor registration form
│   ├── ServicesView.jsx             # Services placeholder
│   └── SettingsView.jsx             # Settings placeholder
├── modals/
│   ├── VendorDetailModal.jsx        # Vendor detail modal
│   └── DeleteConfirmationModal.jsx  # Delete confirmation modal
└── utils/
    ├── vendorUtils.js               # Utility functions
    └── constants.js                 # App constants
```

## Installation

1. Copy all files to your React project's `src` directory
2. Install required dependencies:

```bash
npm install lucide-react
```

3. Make sure you have Tailwind CSS configured in your project

4. Import and use the App component:

```jsx
import App from './onction-vendor-system/App';

function MainApp() {
  return <App />;
}

export default MainApp;
```

## Dependencies

- React 18+
- Tailwind CSS 3+
- lucide-react (for icons)

## Usage

### Navigation

Use the sidebar to navigate between different views:
- **Dashboard**: Overview with stats and recent vendors
- **Vendor List**: Full table of all vendors with search
- **Add Vendor**: Registration form for new vendors
- **Services**: Placeholder for services management
- **Settings**: Placeholder for system settings

### Adding a Vendor

1. Click "Add Vendor" in the sidebar or from the Vendor List
2. Fill in all required fields (marked with *)
3. Click "Register Vendor"
4. Vendor will receive a unique OSL code (e.g., OSL-2026-ABC-1234)

### Managing Vendors

- **View**: Click the "View" button to see full vendor details
- **Delete**: Click the "Delete" button to remove a vendor (with confirmation)
- **Search**: Use the search bar to filter vendors by name, code, or email

## Customization

### Branding

Update branding in:
- `components/Sidebar.jsx` - Footer branding
- `views/DashboardView.jsx` - Welcome message

### Vendor Code Format

Modify in `utils/vendorUtils.js`:

```javascript
const typeCode = {
  'manufacturer': 'OSL',
  'distributor': 'OSL',
  'service-provider': 'OSL'
}[businessType] || 'OSL';
```

### Add More Views

1. Create new view in `views/` directory
2. Add menu item to `utils/constants.js`
3. Add case to `renderView()` in `App.jsx`

## Storage

The system uses either:
- `window.storage` (if available in Claude.ai artifacts)
- `localStorage` (fallback for regular browsers)

All vendor data is stored with the key pattern: `vendor:{vendorCode}`

## License

MIT License - feel free to use in your projects!

## Support

For issues or questions, please contact Onction Service Limited.
