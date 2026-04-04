import React, { useState, useEffect } from 'react';
import { LogOut, Home, FileText, Upload, User, Bell, Menu, X } from 'lucide-react';
import VendorLogin from './components/VendorLogin';
import VendorDashboardView from './views/VendorDashboardView';
import VendorInvoicesView from './views/VendorInvoicesView';
import VendorDocumentsView from './views/VendorDocumentsView';
import VendorNotificationsView from './views/VendorNotificationsView';
import { 
  getVendorInvoices, 
  getVendorDocuments, 
  getVendorNotifications,
  getVendorActivities,
  submitInvoice,
  editInvoice,
  deleteInvoice,
  uploadDocument
} from './utils/vendorUtils';

const VendorPortalApp = () => {
  const [vendor, setVendor] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (vendor) {
      loadVendorData();
    }
  }, [vendor]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadVendorData = async () => {
    const [invoiceData, documentData, notificationData, activityData] = await Promise.all([
      getVendorInvoices(vendor.id),
      getVendorDocuments(vendor.id),
      getVendorNotifications(vendor.id),
      getVendorActivities(vendor.id)
    ]);
    setInvoices(invoiceData);
    setDocuments(documentData);
    setNotifications(notificationData);
    setActivities(activityData);
  };

  const handleLogin = (vendorData) => {
    setVendor(vendorData);
    showToast(`Welcome back, ${vendorData.companyName}!`, 'success');
  };

  const handleLogout = () => {
    setVendor(null);
    setCurrentView('dashboard');
    showToast('Logged out successfully', 'success');
  };

  const handleSubmitInvoice = async (invoiceData) => {
    const result = await submitInvoice(vendor.id, invoiceData);
    if (result.success) {
      showToast('Invoice submitted successfully', 'success');
      await loadVendorData();
      return true;
    } else {
      showToast('Failed to submit invoice', 'error');
      return false;
    }
  };

  const handleEditInvoice = async (invoiceId, updates) => {
    const result = await editInvoice(vendor.id, invoiceId, updates);
    if (result.success) {
      showToast('Invoice updated successfully', 'success');
      await loadVendorData();
      return true;
    } else {
      showToast('Failed to update invoice', 'error');
      return false;
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    const result = await deleteInvoice(vendor.id, invoiceId);
    if (result.success) {
      showToast('Invoice deleted successfully', 'success');
      await loadVendorData();
      return true;
    } else {
      showToast('Failed to delete invoice', 'error');
      return false;
    }
  };

  const handleUploadDocument = async (documentData) => {
    const result = await uploadDocument(vendor.id, documentData);
    if (result.success) {
      showToast('Document uploaded successfully', 'success');
      await loadVendorData();
      return true;
    } else {
      showToast('Failed to upload document', 'error');
      return false;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Upload },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <VendorDashboardView
            vendor={vendor}
            invoices={invoices}
            documents={documents}
            notifications={notifications}
            activities={activities}
            onNavigate={setCurrentView}
          />
        );
      case 'invoices':
        return (
          <VendorInvoicesView
            vendor={vendor}
            invoices={invoices}
            onSubmitInvoice={handleSubmitInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
          />
        );
      case 'documents':
        return (
          <VendorDocumentsView
            documents={documents}
            onUploadDocument={handleUploadDocument}
          />
        );
      case 'profile':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Company Name</label>
                <p className="text-gray-900 mt-1">{vendor.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Vendor Code</label>
                <p className="text-gray-900 mt-1 font-mono">{vendor.id}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Business Type</label>
                <p className="text-gray-900 mt-1 capitalize">{vendor.businessType?.replace('-', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{vendor.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Contact Person</label>
                <p className="text-gray-900 mt-1">{vendor.firstName} {vendor.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Phone</label>
                <p className="text-gray-900 mt-1">{vendor.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Address</label>
                <p className="text-gray-900 mt-1">
                  {vendor.streetAddress}
                  {vendor.streetAddress2 && `, ${vendor.streetAddress2}`}
                  <br />
                  {vendor.city}, {vendor.region} {vendor.postalCode}
                  <br />
                  {vendor.country}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Status</label>
                <p className="text-gray-900 mt-1">{vendor.status}</p>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return <VendorNotificationsView notifications={notifications} />;
      default:
        return null;
    }
  };

  // Show login if not authenticated
  if (!vendor) {
    return <VendorLogin onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 transition-all">
          <div className={`rounded-lg shadow-lg p-4 min-w-[300px] ${
            toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
          }`}>
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-blue-600">Vendor Portal</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      currentView === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {!sidebarOpen && item.badge > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-blue-900 mb-1">Onction Service Limited</p>
              <p className="text-xs text-blue-700">Vendor Management Portal</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default VendorPortalApp;
