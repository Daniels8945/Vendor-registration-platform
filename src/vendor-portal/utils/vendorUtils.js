/**
 * Vendor Portal Utility Layer
 * All data operations now go through the REST API.
 */

import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoiceAPI,
  getDocuments,
  uploadDocumentAPI,
  reuploadDocument,
  deleteDocumentAPI,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getActivities,
  getVendorToken,
} from '../../lib/api.js';

// Re-export for convenience
export {
  getInvoices as getVendorInvoices,
  createInvoice as submitInvoice,
  updateInvoice as editInvoice,
  deleteInvoiceAPI as deleteInvoice,
  getDocuments as getVendorDocuments,
  uploadDocumentAPI,
  reuploadDocument,
  deleteDocumentAPI,
  getNotifications as getVendorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getActivities as getVendorActivities,
};

// Settings cache (populated on app load)
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

// Legacy activity log helper (now goes to API automatically via invoices/documents)
export const logActivity = async () => { /* no-op: handled server-side */ };

// Legacy helpers kept for compatibility
export const getVendorByCode = async (vendorCode) => {
  const token = getVendorToken();
  const res = await fetch(`/api/vendors/${vendorCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : null;
};

export const getNextInvoiceNumber = async () => 'auto'; // server generates this

export const createVendorNotification = async () => { /* server-side */ };
export const notifyVendorStatusChange = async () => { /* server-side */ };
