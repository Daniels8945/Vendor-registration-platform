/**
 * Admin-portal utility layer.
 * All data operations now go through the REST API (src/lib/api.js).
 * This file keeps exports that the existing view files import,
 * re-exporting from api.js or providing thin helpers.
 */

import {
  getVendors as loadVendors,
  createVendor as saveVendor,
  deleteVendorAPI as deleteVendor,
  updateVendorStatus,
  updateVendor,
  logAuditAPI as logAudit,
  getAdminToken,
} from '../../lib/api.js';

export { loadVendors, saveVendor, deleteVendor, updateVendorStatus, updateVendor, logAudit, getAdminToken };

// ── Settings ──────────────────────────────────────────────────────────────────

let _settingsCache = null;

export const getSettings = () => {
  // Returns synchronously from cache. Call loadSettingsFromAPI() on app init.
  return _settingsCache || {
    currency: 'NGN',
    invoicePrefix: 'INV',
    requireDocumentApproval: 'true',
    autoApproveDocuments: 'false',
    emailNotifications: 'true',
    maxInvoiceAmount: '',
    companyName: 'Onction Service Limited',
    adminPassword: '',
    supportEmail: 'vendors@onction.com',
    vendorCodePrefix: 'OSL',
  };
};

export const setSettingsCache = (s) => { _settingsCache = s; };

export const loadSettingsFromAPI = async () => {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    _settingsCache = data;
    return data;
  } catch {
    return getSettings();
  }
};

// ── Currency / display helpers ────────────────────────────────────────────────

export const formatCurrency = (amount) => {
  const s = getSettings();
  const currency = s.currency || 'NGN';
  const localeMap = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
  return new Intl.NumberFormat(localeMap[currency] || 'en-NG', { style: 'currency', currency }).format(Number(amount) || 0);
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', '');
};

export const getBusinessTypeLabel = (type) => ({
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  'service-provider': 'Service Provider',
}[type] || type);

export const formatDocumentType = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const getStats = (vendors) => ({
  total: vendors.length,
  pending: vendors.filter(v => v.status === 'Pending Review').length,
  approved: vendors.filter(v => v.status === 'Approved').length,
  rejected: vendors.filter(v => v.status === 'Rejected').length,
  inactive: vendors.filter(v => v.status === 'Inactive').length,
  manufacturers: vendors.filter(v => v.businessType === 'manufacturer').length,
  distributors: vendors.filter(v => v.businessType === 'distributor').length,
  serviceProviders: vendors.filter(v => v.businessType === 'service-provider').length,
});

export const exportToCSV = (filename, headers, rows) => {
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateVendorCode = (_businessType) => {
  const s = getSettings();
  const prefix = s.vendorCodePrefix || 'OSL';
  const year = new Date().getFullYear();
  const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  const numbers = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefix}-${year}-${letters}-${numbers}`;
};

// These now delegate to the API — kept for backwards compatibility in view files
export const notifyVendorStatusChange = async () => { /* handled server-side */ };
export const saveVendorNote = async (vendorId, note) => {
  const token = getAdminToken();
  const res = await fetch(`/api/vendors/${vendorId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ note }),
  });
  return res.ok ? { success: true } : { success: false };
};
export const loadVendorNotes = async (vendorId) => {
  const token = getAdminToken();
  const res = await fetch(`/api/vendors/${vendorId}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok ? res.json() : [];
};
export const deleteVendorNote = async (noteId) => {
  const token = getAdminToken();
  await fetch(`/api/vendor-notes/${noteId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
};
