import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import NotificationsView from './views/NotificationsView';
import SettingsView from './views/SettingsView';
import {
  getVendors,
  createVendor,
  deleteVendorAPI,
  logAuditAPI,
  getAdminToken,
  adminLogin,
  adminLogout,
  getNotifications,
  getInvoices,
  getDocuments,
} from '../lib/api.js';
import { INITIAL_FORM_DATA } from './utils/constants';
import { useSessionTimeout } from '../lib/useSessionTimeout.js';
import ResetPasswordPage from '../lib/ResetPasswordPage.jsx';
import { adminResetPassword } from '../lib/api.js';

// ── Authenticated wrapper ─────────────────────────────────────────────────────
const RequireAdmin = ({ children, currentUser }) => {
  const token = getAdminToken();
  if (!token || !currentUser) return <Navigate to="/admin/login" replace />;
  return children;
};

// ── Vendor Profile route wrapper ──────────────────────────────────────────────
const VendorProfileRoute = ({ vendors, onVendorUpdated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendor = vendors.find(v => v.id === id);
  if (!vendor) return <Navigate to="/admin/vendors" replace />;
  return (
    <VendorProfileView
      vendor={vendor}
      onBack={() => navigate('/admin/vendors')}
      onVendorUpdated={onVendorUpdated}
    />
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
const App = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; }
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIdx, setSearchIdx] = useState(-1);
  const [searchInvoices, setSearchInvoices] = useState([]);
  const [searchDocs, setSearchDocs] = useState([]);
  const [sessionWarning, setSessionWarning] = useState(false);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const isAuthenticated = !!getAdminToken() && !!currentUser;

  const handleLogout = useCallback(() => {
    adminLogout();
    localStorage.removeItem('admin_user');
    setCurrentUser(null);
    setSessionWarning(false);
    navigate('/admin/login');
  }, [navigate]);

  const fetchVendors = useCallback(async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      if (err?.status === 401) handleLogout();
    }
    setLoading(false);
  }, [handleLogout]);

  const fetchUnread = useCallback(async () => {
    try {
      const notifs = await getNotifications();
      setUnreadNotifications(notifs.filter(n => !n.read).length);
    } catch { /* ignore */ }
  }, []);

  const fetchSearchData = useCallback(async () => {
    try {
      const [invoiceList, docList] = await Promise.all([getInvoices(), getDocuments()]);
      setSearchInvoices(invoiceList);
      setSearchDocs(docList);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchVendors();
    fetchUnread();
    fetchSearchData();
  }, [isAuthenticated, fetchVendors, fetchUnread, fetchSearchData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleLogin = async (username, password) => {
    try {
      const data = await adminLogin(username, password);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      navigate('/admin/dashboard');
      return { success: true, mustChangePw: data.user.mustChangePw };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Session timeout — 30 min inactivity
  useSessionTimeout({
    enabled: isAuthenticated,
    onWarning: () => setSessionWarning(true),
    onExpire: () => {
      setSessionWarning(false);
      handleLogout();
    },
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const duplicate = vendors.find(v =>
      v.companyName.trim().toLowerCase() === formData.companyName.trim().toLowerCase() ||
      v.email.trim().toLowerCase() === formData.email.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(`A vendor with this company name or email already exists (${duplicate.id}).`, 'error');
      return;
    }
    try {
      const vendor = await createVendor(formData);
      await logAuditAPI('vendor_created', { vendorId: vendor.id, companyName: vendor.companyName });
      showToast(`Vendor registered successfully! Code: ${vendor.id}`, 'success');
      setFormData(INITIAL_FORM_DATA);
      await fetchVendors();
      navigate('/admin/vendors');
    } catch (err) {
      showToast(err.message || 'Failed to register vendor.', 'error');
    }
  };

  const handleDeleteVendor = (vendor) => setVendorToDelete(vendor);

  const executeDelete = async () => {
    if (!vendorToDelete) return;
    try {
      await deleteVendorAPI(vendorToDelete.id);
      await logAuditAPI('vendor_deleted', { vendorId: vendorToDelete.id, companyName: vendorToDelete.companyName });
      await fetchVendors();
      showToast('Vendor deleted successfully', 'success');
    } catch {
      showToast('Failed to delete vendor.', 'error');
    }
    setVendorToDelete(null);
  };

  const handleVendorUpdated = async (updatedVendor) => {
    await fetchVendors();
    const msg = updatedVendor?.status
      ? `Vendor status changed to ${updatedVendor.status}`
      : 'Vendor updated successfully';
    showToast(msg, 'success');
  };

  // ── Global search ─────────────────────────────────────────────────────────
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
    searchInvoices.forEach(inv => {
      if (
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.vendorCode || '').toLowerCase().includes(q) ||
        (inv.description || '').toLowerCase().includes(q)
      ) {
        results.push({ type: 'invoice', label: inv.invoiceNumber, sub: `${inv.vendorCode} · ${inv.status}`, data: inv });
      }
    });
    searchDocs.forEach(doc => {
      if (
        (doc.documentName || '').toLowerCase().includes(q) ||
        (doc.vendorCode || '').toLowerCase().includes(q)
      ) {
        results.push({ type: 'document', label: doc.documentName, sub: `${doc.vendorCode} · ${doc.status}`, data: doc });
      }
    });
    return results.slice(0, 12);
  })();

  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(o => !o); setSearchQuery(''); setSearchIdx(-1); }
      if (e.key === 'Escape') { setSearchOpen(false); setSearchIdx(-1); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const handleSearchKeyDown = (e) => {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && searchIdx >= 0) { e.preventDefault(); handleSearchSelect(searchResults[searchIdx]); }
  };

  const handleSearchSelect = (result) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'vendor') navigate(`/admin/vendors/${result.data.id}`);
    else if (result.type === 'invoice') navigate('/admin/invoices');
    else if (result.type === 'document') navigate('/admin/documents');
  };

  const RESULT_ICONS = { vendor: Users, invoice: FileText, document: Upload };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      <DeleteConfirmationModal vendor={vendorToDelete} onConfirm={executeDelete} onCancel={() => setVendorToDelete(null)} />

      {/* Session timeout warning */}
      {sessionWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Expiring Soon</h3>
            <p className="text-sm text-gray-600 mb-5">You will be logged out in 2 minutes due to inactivity. Click below to stay logged in.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSessionWarning(false)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Search Overlay */}
      {isAuthenticated && searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24 px-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input ref={searchInputRef} type="text" value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchIdx(-1); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search vendors, invoices, documents..."
                className="flex-1 text-sm outline-none placeholder-gray-400"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>}
              <span className="text-xs text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono shrink-0">Esc</span>
            </div>
            {!searchQuery.trim() ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Type to search across vendors, invoices, and documents</div>
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
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${r.type === 'vendor' ? 'bg-blue-100 text-blue-600' : r.type === 'invoice' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
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

      <Routes>
        {/* Login */}
        <Route path="login" element={
          isAuthenticated
            ? <Navigate to="/admin/dashboard" replace />
            : <AdminLoginGate onLogin={handleLogin} />
        } />

        {/* Password reset (no auth required) */}
        <Route path="reset-password" element={
          <ResetPasswordPage
            onReset={adminResetPassword}
            backPath="/admin/login"
            portalLabel="Admin Portal"
          />
        } />

        {/* Protected shell with sidebar */}
        <Route path="*" element={
          !isAuthenticated ? <Navigate to="/admin/login" replace /> : (
            <>
              <Sidebar
                currentUser={currentUser}
                onLogout={handleLogout}
                unreadNotifications={unreadNotifications}
                onSearchOpen={() => setSearchOpen(true)}
              />
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={
                      <DashboardView
                        vendors={vendors}
                        onViewProfile={(v) => navigate(`/admin/vendors/${v.id}`)}
                        onNavigate={(view) => navigate(`/admin/${view}`)}
                      />
                    } />
                    <Route path="vendors" element={
                      <VendorsView
                        vendors={vendors}
                        loading={loading}
                        onAddVendor={() => navigate('/admin/add-vendor')}
                        onViewVendor={setSelectedVendor}
                        onViewProfile={(v) => navigate(`/admin/vendors/${v.id}`)}
                        onDeleteVendor={handleDeleteVendor}
                        onUpdateStatus={async (id, status, reason) => {
                          const { updateVendorStatus } = await import('../lib/api.js');
                          await updateVendorStatus(id, status, reason);
                          await fetchVendors();
                          showToast(`Vendor ${status.toLowerCase()} successfully`, 'success');
                        }}
                        onImportVendors={fetchVendors}
                        userRole={currentUser?.role || 'Super Admin'}
                      />
                    } />
                    <Route path="vendors/:id" element={
                      <VendorProfileRoute
                        vendors={vendors}
                        onVendorUpdated={handleVendorUpdated}
                      />
                    } />
                    <Route path="add-vendor" element={
                      <AddVendorView
                        formData={formData}
                        onChange={handleFormChange}
                        onSubmit={handleFormSubmit}
                        onCancel={() => navigate('/admin/vendors')}
                        vendors={vendors}
                      />
                    } />
                    <Route path="invoices" element={<AdminInvoicesView onShowToast={showToast} userRole={currentUser?.role || 'Super Admin'} />} />
                    <Route path="documents" element={<AdminDocumentsView onShowToast={showToast} />} />
                    <Route path="services" element={<ServicesView />} />
                    <Route path="notifications" element={<NotificationsView onUnreadChange={setUnreadNotifications} />} />
                    <Route path="audit-log" element={<AuditLogView />} />
                    <Route path="settings" element={<SettingsView currentUser={currentUser} onAuthChange={handleLogout} />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            </>
          )
        } />
      </Routes>
    </div>
  );
};

export default App;
