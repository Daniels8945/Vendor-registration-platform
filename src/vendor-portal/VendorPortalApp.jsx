import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, FileText, Upload, User, Bell, Menu, X } from 'lucide-react';
import VendorLogin from './components/VendorLogin';
import VendorDashboardView from './views/VendorDashboardView';
import VendorInvoicesView from './views/VendorInvoicesView';
import VendorDocumentsView from './views/VendorDocumentsView';
import VendorNotificationsView from './views/VendorNotificationsView';
import VendorProfileView from './views/VendorProfileView';
import {
  getVendorInvoices,
  getVendorDocuments,
  getVendorNotifications,
  getVendorActivities,
  uploadDocumentAPI,
  reuploadDocument,
  deleteDocumentAPI,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  loadVendorSettings,
} from './utils/vendorUtils';
import {
  vendorLogout,
  getVendorToken,
  getVendor,
  createInvoice,
  updateInvoice,
  deleteInvoiceAPI,
} from '../lib/api.js';
import { useSessionTimeout } from '../lib/useSessionTimeout.js';
import ResetPasswordPage from '../lib/ResetPasswordPage.jsx';
import { vendorResetPassword } from '../lib/api.js';

// ── Auth guard ────────────────────────────────────────────────────────────────
const RequireVendor = ({ children, vendor }) => {
  if (!getVendorToken() || !vendor) return <Navigate to="/vendor/login" replace />;
  return children;
};

// ── Shell with sidebar ────────────────────────────────────────────────────────
const VendorShell = ({ vendor, onLogout, children, unreadCount }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/vendor/dashboard' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/vendor/invoices' },
    { id: 'documents', label: 'Documents', icon: Upload, path: '/vendor/documents' },
    { id: 'profile', label: 'Profile', icon: User, path: '/vendor/profile' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/vendor/notifications', badge: unreadCount },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-blue-600">Vendor Portal</h2>}
          <button onClick={() => setSidebarOpen(o => !o)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
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
              <p className="text-xs font-semibold text-blue-900 mb-1 truncate">{vendor?.companyName}</p>
              <p className="text-xs text-blue-700 font-mono truncate">{vendor?.id}</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
const VendorPortalApp = () => {
  const [vendor, setVendor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vendor_user')); } catch { return null; }
  });
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [toast, setToast] = useState(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const navigate = useNavigate();

  const isAuthenticated = !!getVendorToken() && !!vendor;

  const vendorId = vendor?.id;
  const loadData = useCallback(async () => {
    if (!vendorId) return;
    try {
      const [fresh, invData, docData, notifData, actData] = await Promise.all([
        getVendor(vendorId, getVendorToken()).catch(() => null),
        getVendorInvoices().catch(() => []),
        getVendorDocuments().catch(() => []),
        getVendorNotifications().catch(() => []),
        getVendorActivities(vendorId).catch(() => []),
      ]);
      if (fresh) setVendor(fresh);
      setInvoices(invData);
      setDocuments(docData);
      setNotifications(notifData);
      setActivities(actData);
    } catch { /* ignore */ }
  }, [vendorId]); // stable string dep — avoids loop when setVendor updates vendor object

  useEffect(() => {
    if (isAuthenticated) {
      loadVendorSettings();
      (async () => { await loadData(); })();
    }
  }, [isAuthenticated, loadData]);

  // Poll every 30 s to pick up status changes and new notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => { loadData(); }, 30_000);
    return () => clearInterval(id);
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleLogin = (vendorData) => {
    localStorage.setItem('vendor_user', JSON.stringify(vendorData));
    setVendor(vendorData);
    navigate('/vendor/dashboard');
    showToast(`Welcome back, ${vendorData.companyName}!`);
  };

  const handleLogout = useCallback(() => {
    vendorLogout();
    localStorage.removeItem('vendor_user');
    setVendor(null);
    setSessionWarning(false);
    navigate('/vendor/login');
  }, [navigate]);

  // Session timeout — 30 min inactivity
  useSessionTimeout({
    enabled: isAuthenticated,
    onWarning: () => setSessionWarning(true),
    onExpire: () => {
      setSessionWarning(false);
      handleLogout();
    },
  });

  const handleVendorUpdated = (updatedVendor) => {
    localStorage.setItem('vendor_user', JSON.stringify(updatedVendor));
    setVendor(updatedVendor);
    showToast('Profile updated successfully');
  };

  // ── Invoice handlers ──────────────────────────────────────────────────────
  const handleSubmitInvoice = async (invoiceData) => {
    try {
      await createInvoice(invoiceData);
      showToast('Invoice submitted successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to submit invoice', 'error'); return false; }
  };

  const handleEditInvoice = async (invoiceId, updates) => {
    try {
      await updateInvoice(invoiceId, updates);
      showToast('Invoice updated successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to update invoice', 'error'); return false; }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await deleteInvoiceAPI(invoiceId);
      showToast('Invoice deleted successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to delete invoice', 'error'); return false; }
  };

  // ── Document handlers ─────────────────────────────────────────────────────
  const handleUploadDocument = async (formData) => {
    try {
      await uploadDocumentAPI(formData);
      showToast('Document uploaded successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to upload document', 'error'); return false; }
  };

  const handleReuploadDocument = async (docId, formData) => {
    try {
      await reuploadDocument(docId, formData);
      showToast('Document re-uploaded successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to re-upload document', 'error'); return false; }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocumentAPI(docId);
      showToast('Document deleted successfully');
      await loadData();
      return true;
    } catch (err) { showToast(err.message || 'Failed to delete document', 'error'); return false; }
  };

  // ── Notification handlers ─────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    await markNotificationRead(id).catch(() => {});
    await loadData();
  };
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    await loadData();
  };
  const handleDeleteNotification = async (id) => {
    await deleteNotification(id).catch(() => {});
    await loadData();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Common props for views ────────────────────────────────────────────────
  const shellProps = {
    vendor,
    onLogout: handleLogout,
    unreadCount,
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg p-4 min-w-[300px] ${toast.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</p>
          </div>
        </div>
      )}

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

      <Routes>
        <Route path="login" element={
          isAuthenticated ? <Navigate to="/vendor/dashboard" replace /> : <VendorLogin onLogin={handleLogin} />
        } />

        <Route path="reset-password" element={
          <ResetPasswordPage
            onReset={vendorResetPassword}
            backPath="/vendor/login"
            portalLabel="Vendor Portal"
          />
        } />

        <Route path="*" element={
          !isAuthenticated ? <Navigate to="/vendor/login" replace /> : (
            <VendorShell {...shellProps}>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={
                  <VendorDashboardView
                    vendor={vendor}
                    invoices={invoices}
                    documents={documents}
                    notifications={notifications}
                    activities={activities}
                    onNavigate={(view) => navigate(`/vendor/${view}`)}
                  />
                } />
                <Route path="invoices" element={
                  <VendorInvoicesView
                    vendor={vendor}
                    invoices={invoices}
                    onSubmitInvoice={handleSubmitInvoice}
                    onEditInvoice={handleEditInvoice}
                    onDeleteInvoice={handleDeleteInvoice}
                  />
                } />
                <Route path="documents" element={
                  <VendorDocumentsView
                    documents={documents}
                    onUploadDocument={handleUploadDocument}
                    onReuploadDocument={handleReuploadDocument}
                    onDeleteDocument={handleDeleteDocument}
                  />
                } />
                <Route path="profile" element={
                  <VendorProfileView
                    vendor={vendor}
                    onVendorUpdated={handleVendorUpdated}
                    onShowToast={showToast}
                  />
                } />
                <Route path="notifications" element={
                  <VendorNotificationsView
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                    onDelete={handleDeleteNotification}
                  />
                } />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </VendorShell>
          )
        } />
      </Routes>
    </>
  );
};

export default VendorPortalApp;
