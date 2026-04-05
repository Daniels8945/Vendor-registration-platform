/**
 * Frontend API client — centralises all HTTP calls to the backend.
 * Tokens are stored in localStorage under 'admin_token' / 'vendor_token'.
 */

const BASE = '/api';

// ── Token helpers ─────────────────────────────────────────────────────────────

export const getAdminToken = () => localStorage.getItem('admin_token');
export const getVendorToken = () => localStorage.getItem('vendor_token');
export const setAdminToken = (t) => localStorage.setItem('admin_token', t);
export const setVendorToken = (t) => localStorage.setItem('vendor_token', t);
export const clearAdminToken = () => localStorage.removeItem('admin_token');
export const clearVendorToken = () => localStorage.removeItem('vendor_token');

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function multipart(method, path, formData, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Settings (public) ─────────────────────────────────────────────────────────

export const getSettings = async () => request('GET', '/settings');
export const updateSettings = async (data) => request('PUT', '/settings', data, getAdminToken());

// ── Admin Auth ────────────────────────────────────────────────────────────────

export const adminLogin = async (username, password) => {
  const data = await request('POST', '/auth/admin/login', { username, password });
  setAdminToken(data.token);
  return data;
};
export const adminLogout = () => clearAdminToken();

export const adminChangePassword = async (username, currentPassword, newPassword) =>
  request('POST', '/auth/admin/change-password', { username, currentPassword, newPassword }, getAdminToken());

export const adminForgotPassword = async (email) =>
  request('POST', '/auth/admin/forgot-password', { email });
export const adminResetPassword = async (token, newPassword) =>
  request('POST', '/auth/admin/reset-password', { token, newPassword });

export const vendorForgotPassword = async (email) =>
  request('POST', '/auth/vendor/forgot-password', { email });
export const vendorResetPassword = async (token, newPassword) =>
  request('POST', '/auth/vendor/reset-password', { token, newPassword });

// ── Admin Users ───────────────────────────────────────────────────────────────

export const getAdminUsers = async () => request('GET', '/settings/admin-users', undefined, getAdminToken());
export const createAdminUser = async (data) => request('POST', '/settings/admin-users', data, getAdminToken());
export const deleteAdminUser = async (id) => request('DELETE', `/settings/admin-users/${id}`, undefined, getAdminToken());
export const resetAdminUserPassword = async (id, newPassword) =>
  request('PATCH', `/settings/admin-users/${id}/password`, { newPassword }, getAdminToken());

// ── Vendor Auth ───────────────────────────────────────────────────────────────

export const vendorLogin = async (vendorCode, password) => {
  const data = await request('POST', '/auth/vendor/login', { vendorCode, password });
  setVendorToken(data.token);
  return data;
};
export const vendorLogout = () => clearVendorToken();

export const vendorSetPassword = async (vendorCode, newPassword, currentPassword) =>
  request('POST', '/auth/vendor/set-password', { vendorCode, newPassword, currentPassword }, getVendorToken());

// ── Vendors ───────────────────────────────────────────────────────────────────

export const getVendors = async () => request('GET', '/vendors', undefined, getAdminToken());
export const getVendor = async (id, token) => request('GET', `/vendors/${id}`, undefined, token || getAdminToken());
export const createVendor = async (data) => request('POST', '/vendors', data, getAdminToken());
export const registerVendor = async (data) => request('POST', '/vendors/register', data);
export const updateVendor = async (id, data, token) => request('PUT', `/vendors/${id}`, data, token || getAdminToken());
export const updateVendorStatus = async (id, status, rejectionReason) =>
  request('PATCH', `/vendors/${id}/status`, { status, rejectionReason }, getAdminToken());
export const deleteVendorAPI = async (id) => request('DELETE', `/vendors/${id}`, undefined, getAdminToken());

// ── Invoices ──────────────────────────────────────────────────────────────────

export const getInvoices = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const token = getAdminToken() || getVendorToken();
  return request('GET', `/invoices${qs ? `?${qs}` : ''}`, undefined, token);
};
export const getInvoice = async (id) => {
  const token = getAdminToken() || getVendorToken();
  return request('GET', `/invoices/${id}`, undefined, token);
};
export const createInvoice = async (data) => {
  const token = getAdminToken() || getVendorToken();
  return request('POST', '/invoices', data, token);
};
export const updateInvoice = async (id, data) => {
  const token = getAdminToken() || getVendorToken();
  return request('PUT', `/invoices/${id}`, data, token);
};
export const updateInvoiceStatus = async (id, status, rejectionReason) =>
  request('PATCH', `/invoices/${id}/status`, { status, rejectionReason }, getAdminToken());
export const recordInvoicePayment = async (id, paymentData) =>
  request('PATCH', `/invoices/${id}/payment`, paymentData, getAdminToken());
export const deleteInvoiceAPI = async (id) => {
  const token = getAdminToken() || getVendorToken();
  return request('DELETE', `/invoices/${id}`, undefined, token);
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const getDocuments = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const token = getAdminToken() || getVendorToken();
  return request('GET', `/documents${qs ? `?${qs}` : ''}`, undefined, token);
};
export const uploadDocumentAPI = async (formData) => {
  const token = getAdminToken() || getVendorToken();
  return multipart('POST', '/documents', formData, token);
};
export const reuploadDocument = async (id, formData) => {
  const token = getVendorToken() || getAdminToken();
  return multipart('PUT', `/documents/${id}/reupload`, formData, token);
};
export const updateDocumentStatus = async (id, status, rejectionReason) =>
  request('PATCH', `/documents/${id}/status`, { status, rejectionReason }, getAdminToken());
export const deleteDocumentAPI = async (id) => {
  const token = getAdminToken() || getVendorToken();
  return request('DELETE', `/documents/${id}`, undefined, token);
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const token = getAdminToken() || getVendorToken();
  return request('GET', '/notifications', undefined, token);
};
export const markNotificationRead = async (id) => {
  const token = getAdminToken() || getVendorToken();
  return request('PATCH', `/notifications/${id}/read`, undefined, token);
};
export const markAllNotificationsRead = async () => {
  const token = getAdminToken() || getVendorToken();
  return request('PATCH', '/notifications/read-all', undefined, token);
};
export const deleteNotification = async (id) => {
  const token = getAdminToken() || getVendorToken();
  return request('DELETE', `/notifications/${id}`, undefined, token);
};

// ── Audit ─────────────────────────────────────────────────────────────────────

export const getAuditLog = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request('GET', `/audit${qs ? `?${qs}` : ''}`, undefined, getAdminToken());
};
export const logAuditAPI = async (action, details) =>
  request('POST', '/audit', { action, details }, getAdminToken());
export const clearAuditLog = async () => request('DELETE', '/audit', undefined, getAdminToken());

// ── Services ──────────────────────────────────────────────────────────────────

export const getServices = async () => {
  const token = getAdminToken() || getVendorToken();
  return request('GET', '/services', undefined, token);
};
export const createService = async (data) => request('POST', '/services', data, getAdminToken());
export const updateService = async (id, data) => request('PUT', `/services/${id}`, data, getAdminToken());
export const deleteService = async (id) => request('DELETE', `/services/${id}`, undefined, getAdminToken());

// ── Activities ────────────────────────────────────────────────────────────────

export const getActivities = async (vendorCode) => {
  const token = getVendorToken() || getAdminToken();
  return request('GET', `/activities?vendorCode=${vendorCode}`, undefined, token);
};

// ── Utility: format currency from settings ────────────────────────────────────
// This is a sync helper; call loadSettings() first to populate the cache.

let _cachedSettings = null;
export const loadSettings = async () => {
  _cachedSettings = await getSettings();
  return _cachedSettings;
};
export const getCachedSettings = () => _cachedSettings || {};

export const formatCurrencyFromSettings = (amount) => {
  const currency = _cachedSettings?.currency || 'NGN';
  const localeMap = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
  return new Intl.NumberFormat(localeMap[currency] || 'en-NG', { style: 'currency', currency }).format(Number(amount) || 0);
};
