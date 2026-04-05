import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, FileText, Upload, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import VendorDetailModal from './modals/VendorDetailModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AdminLoginGate from './components/AdminLoginGate';
import DashboardView from './views/DashboardView';
import VendorsView from './views/VendorsView';
import AddVendorView from './views/AddVendorView';
import AdminInvoicesView from './views/AdminInvoicesView';
import VendorProfileView from './views/VendorProfileView';
import AdminDocumentsView from './views/AdminDocumentsView';
import ServicesView from './views/ServicesView';
import AuditLogView from './views/AuditLogView';
import NotificationsView, { getUnreadNotificationCount } from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import {
  loadVendors,
  saveVendor,
  deleteVendor,
  generateVendorCode,
  updateVendorStatus,
  notifyVendorStatusChange,
  logAudit,
  getSettings,
} from './utils/vendorUtils';
import { INITIAL_FORM_DATA } from './utils/constants';

const App = () => {
  const [authenticated, setAuthenticated] = useState(() => {
    const settings = getSettings();
    return !settings.adminPassword || sessionStorage.getItem('admin:auth') === '1';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('admin:currentUser')); } catch { return null; }
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [profileVendor, setProfileVendor] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);
  const searchInputRef = useRef(null);

  const fetchVendors = async () => {
    const data = await loadVendors();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVendors().then(data => {
      setVendors(data);
      setLoading(false);
      setUnreadNotifications(getUnreadNotificationCount());
    });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Duplicate detection
    const duplicate = vendors.find(v =>
      v.companyName.trim().toLowerCase() === formData.companyName.trim().toLowerCase() ||
      v.email.trim().toLowerCase() === formData.email.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(`A vendor with this company name or email already exists (${duplicate.id}).`, 'error');
      return;
    }

    const code = generateVendorCode(formData.businessType);
    const vendorData = {
      id: code,
      ...formData,
      status: 'Pending Review',
      submittedAt: new Date().toISOString(),
    };

    const result = await saveVendor(vendorData);
    if (result.success) {
      logAudit('vendor_created', { vendorId: code, companyName: formData.companyName });
      showToast(`Vendor registered successfully! Code: ${code}`, 'success');
      setFormData(INITIAL_FORM_DATA);
      await fetchVendors();
      setCurrentView('vendors');
    } else {
      showToast('Failed to register vendor. Please try again.', 'error');
    }
  };

  const handleDeleteVendor = (vendor) => setVendorToDelete(vendor);

  const handleUpdateStatus = async (vendorId, newStatus, rejectionReason = '') => {
    const result = await updateVendorStatus(vendorId, newStatus, rejectionReason);
    if (result.success) {
      logAudit('vendor_status_changed', { vendorId, newStatus });
      await notifyVendorStatusChange(vendorId, newStatus, rejectionReason);
      await fetchVendors();
      showToast(`Vendor ${newStatus.toLowerCase()} successfully`, 'success');
    } else {
      showToast('Failed to update vendor status. Please try again.', 'error');
    }
  };

  const executeDelete = async () => {
    if (!vendorToDelete) return;
    const result = await deleteVendor(vendorToDelete.id);
    if (result.success) {
      logAudit('vendor_deleted', { vendorId: vendorToDelete.id, companyName: vendorToDelete.companyName });
      await fetchVendors();
      showToast('Vendor deleted successfully', 'success');
    } else {
      showToast('Failed to delete vendor. Please try again.', 'error');
    }
    setVendorToDelete(null);
  };

  const handleVendorUpdated = async (updatedVendor) => {
    await fetchVendors();
    // Update profileVendor so the profile page reflects changes immediately
    setProfileVendor(prev => prev?.id === updatedVendor.id ? updatedVendor : prev);
    showToast('Vendor updated successfully', 'success');
  };

  const handleLogin = (user) => {
    sessionStorage.setItem('admin:auth', '1');
    if (user) sessionStorage.setItem('admin:currentUser', JSON.stringify(user));
    setAuthenticated(true);
    setCurrentUser(user || null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin:auth');
    sessionStorage.removeItem('admin:currentUser');
    setAuthenticated(false);
    setCurrentUser(null);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            vendors={vendors}
            onViewProfile={(vendor) => { setProfileVendor(vendor); setCurrentView('vendor-profile'); }}
            onNavigate={setCurrentView}
          />
        );
      case 'vendors':
        return (
          <VendorsView
            vendors={vendors}
            loading={loading}
            onAddVendor={() => setCurrentView('add-vendor')}
            onViewVendor={setSelectedVendor}
            onViewProfile={(vendor) => { setProfileVendor(vendor); setCurrentView('vendor-profile'); }}
            onDeleteVendor={handleDeleteVendor}
            onUpdateStatus={handleUpdateStatus}
            onImportVendors={fetchVendors}
            userRole={currentUser?.role || 'Super Admin'}
          />
        );
      case 'vendor-profile':
        return (
          <VendorProfileView
            vendor={profileVendor}
            onBack={() => { setCurrentView('vendors'); setProfileVendor(null); }}
            onVendorUpdated={handleVendorUpdated}
          />
        );
      case 'add-vendor':
        return (
          <AddVendorView
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={() => setCurrentView('vendors')}
            vendors={vendors}
          />
        );
      case 'invoices':
        return <AdminInvoicesView onShowToast={showToast} userRole={currentUser?.role || 'Super Admin'} />;
      case 'documents':
        return <AdminDocumentsView onShowToast={showToast} />;
      case 'services':
        return <ServicesView />;
      case 'notifications':
        return <NotificationsView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView onAuthChange={() => {
          const s = getSettings();
          if (!s.adminPassword) sessionStorage.removeItem('admin:auth');
        }} />;
      default:
        return <DashboardView vendors={vendors} onViewProfile={(vendor) => { setProfileVendor(vendor); setCurrentView('vendor-profile'); }} onNavigate={setCurrentView} />;
    }
  };

  // Global search data
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    vendors.forEach(v => {
      if (
        v.companyName.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q)
      ) {
        results.push({ type: 'vendor', label: v.companyName, sub: v.id, data: v });
      }
    });
    try {
      Object.keys(localStorage).filter(k => k.startsWith('invoice:')).forEach(k => {
        try {
          const inv = JSON.parse(localStorage.getItem(k));
          if (!inv) return;
          if (
            (inv.invoiceNumber || '').toLowerCase().includes(q) ||
            (inv.vendorCode || '').toLowerCase().includes(q) ||
            (inv.description || '').toLowerCase().includes(q)
          ) {
            results.push({ type: 'invoice', label: inv.invoiceNumber, sub: `${inv.vendorCode} · ${inv.status}`, data: inv });
          }
        } catch { /* skip */ }
      });
      Object.keys(localStorage).filter(k => k.startsWith('document:')).forEach(k => {
        try {
          const doc = JSON.parse(localStorage.getItem(k));
          if (!doc) return;
          if (
            (doc.documentName || '').toLowerCase().includes(q) ||
            (doc.vendorCode || '').toLowerCase().includes(q)
          ) {
            results.push({ type: 'document', label: doc.documentName, sub: `${doc.vendorCode} · ${doc.status}`, data: doc });
          }
        } catch { /* skip */ }
      });
    } catch { /* skip */ }
    return results.slice(0, 12);
  })();

  useEffect(() => {
    if (!authenticated) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
        setSearchQuery('');
        setSearchIdx(-1);
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchIdx(-1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [authenticated]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);


  const handleSearchKeyDown = (e) => {
    if (searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchIdx(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && searchIdx >= 0) {
      e.preventDefault();
      handleSearchSelect(searchResults[searchIdx]);
    }
  };

  const handleSearchSelect = (result) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'vendor') {
      setProfileVendor(result.data);
      setCurrentView('vendor-profile');
    } else if (result.type === 'invoice') {
      setCurrentView('invoices');
    } else if (result.type === 'document') {
      setCurrentView('documents');
    }
  };

  const RESULT_ICONS = { vendor: Users, invoice: FileText, document: Upload };

  if (!authenticated) {
    return <AdminLoginGate onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />

      <DeleteConfirmationModal
        vendor={vendorToDelete}
        onConfirm={executeDelete}
        onCancel={() => setVendorToDelete(null)}
      />

      {/* Global Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchIdx(-1); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search vendors, invoices, documents..."
                className="flex-1 text-sm outline-none placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <span className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono shrink-0">Esc</span>
            </div>
            {searchQuery.trim() === '' ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Type to search across vendors, invoices, and documents
                <p className="text-xs mt-1 text-gray-300">Press <kbd className="font-mono bg-gray-100 px-1 rounded">Ctrl+K</kbd> to toggle</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{searchQuery}"</div>
            ) : (
              <ul className="py-2 max-h-80 overflow-y-auto divide-y divide-gray-50">
                {searchResults.map((r, idx) => {
                  const Icon = RESULT_ICONS[r.type] || Search;
                  return (
                    <li key={idx}>
                      <button onClick={() => handleSearchSelect(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === searchIdx ? 'bg-blue-50' : 'hover:bg-blue-50'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          r.type === 'vendor' ? 'bg-blue-100 text-blue-600' :
                          r.type === 'invoice' ? 'bg-green-100 text-green-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                          <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                        </div>
                        <span className="text-xs text-gray-300 capitalize shrink-0">{r.type}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
        vendors={vendors}
        currentUser={currentUser}
        onLogout={handleLogout}
        unreadNotifications={unreadNotifications}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;
