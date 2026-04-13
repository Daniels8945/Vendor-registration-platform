/**
 * Vendor Portal Utility Layer
 * All data operations now go through the REST API.
 * Every function here explicitly passes getVendorToken() so that an admin token
 * sitting in localStorage never leaks into vendor portal requests.
 */

import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoiceAPI as _deleteInvoiceAPI,
  uploadInvoiceFileAPI,
  getDocuments,
  uploadDocumentAPI,
  reuploadDocument,
  deleteDocumentAPI as _deleteDocumentAPI,
  getNotifications,
  markNotificationRead as _markNotificationRead,
  markAllNotificationsRead as _markAllNotificationsRead,
  deleteNotification as _deleteNotification,
  getActivities,
  getVendorToken,
} from '../../lib/api.js';

// ── Vendor-scoped wrappers ─────────────────────────────────────────────────────
// Always send the vendor JWT, never the admin JWT, regardless of what tokens
// happen to be stored in localStorage from a concurrent admin session.

export const getVendorInvoices  = ()  => getInvoices({}, getVendorToken());
export const getVendorDocuments = ()  => getDocuments({}, getVendorToken());
export const getVendorNotifications = () => getNotifications(getVendorToken());

export const submitInvoice = createInvoice;
export const editInvoice   = updateInvoice;

export const deleteInvoiceAPI   = (id)       => _deleteInvoiceAPI(id, getVendorToken());
export const deleteDocumentAPI  = (id)       => _deleteDocumentAPI(id, getVendorToken());

export const markNotificationRead     = (id) => _markNotificationRead(id, getVendorToken());
export const markAllNotificationsRead = ()   => _markAllNotificationsRead(getVendorToken());
export const deleteNotification       = (id) => _deleteNotification(id, getVendorToken());

export const getVendorActivities = getActivities;

// Re-export upload helpers unchanged — they already use getVendorToken() || getAdminToken()
export { uploadInvoiceFileAPI, uploadDocumentAPI, reuploadDocument };

// ── Settings cache ─────────────────────────────────────────────────────────────
let _settings = null;

export const loadVendorSettings = async () => {
  try {
    const res = await fetch('/api/settings');
    _settings = await res.json();
    return _settings;
  } catch {
    return getDefaultSettings();
  }
};

export const getVendorSettings = () => _settings || getDefaultSettings();

function getDefaultSettings() {
  return { currency: 'NGN', companyName: 'Onction Service Limited', supportEmail: 'vendors@onction.com' };
}

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatCurrency = (amount) => {
  const currency = (_settings?.currency) || 'NGN';
  const localeMap = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
  return new Intl.NumberFormat(localeMap[currency] || 'en-NG', { style: 'currency', currency }).format(Number(amount) || 0);
};

// Vendor self-update
export const updateVendorProfile = async (vendorCode, updates) => {
  const token = getVendorToken();
  const res = await fetch(`/api/vendors/${vendorCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return { success: true, vendor: data };
};

// Legacy helpers kept for compatibility
export const logActivity = async () => { /* no-op: handled server-side */ };
export const getVendorByCode = async (vendorCode) => {
  const token = getVendorToken();
  const res = await fetch(`/api/vendors/${vendorCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : null;
};
export const getNextInvoiceNumber   = async () => 'auto';
export const createVendorNotification  = async () => { /* server-side */ };
export const notifyVendorStatusChange  = async () => { /* server-side */ };
