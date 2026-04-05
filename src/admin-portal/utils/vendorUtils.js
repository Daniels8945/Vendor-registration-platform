// Utility functions for vendor management

export const getSettings = () => {
  try {
    const data = localStorage.getItem('admin:settings');
    const defaults = {
      currency: 'NGN',
      invoicePrefix: 'INV',
      requireDocumentApproval: true,
      autoApproveDocuments: false,
      emailNotifications: true,
      maxInvoiceAmount: '',
      companyName: 'Onction',
      adminPassword: '',
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  } catch {
    return { currency: 'NGN', invoicePrefix: 'INV', requireDocumentApproval: true, autoApproveDocuments: false, emailNotifications: true, maxInvoiceAmount: '', companyName: 'Onction', adminPassword: '' };
  }
};

export const formatCurrency = (amount) => {
  const { currency } = getSettings();
  const localeMap = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'de-DE' };
  const locale = localeMap[currency] || 'en-NG';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'NGN' }).format(amount);
};

export const formatDocumentType = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

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

export const logAudit = (action, details = {}) => {
  try {
    const entry = {
      id: `AUDIT-${Date.now()}`,
      action,
      details,
      performedBy: 'Admin',
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`audit:${entry.id}`, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
};

export const notifyVendorStatusChange = async (vendorId, newStatus, rejectionReason = '') => {
  try {
    const { emailNotifications } = getSettings();
    if (!emailNotifications) return;

    const rejectedMsg = rejectionReason
      ? `Unfortunately, your vendor application has been rejected. Reason: ${rejectionReason}`
      : 'Unfortunately, your vendor application has been rejected. Please contact support for more information.';
    const messages = {
      'Approved': { type: 'success', title: 'Application Approved', message: 'Congratulations! Your vendor application has been approved. You can now submit invoices and upload documents.' },
      'Rejected': { type: 'error', title: 'Application Rejected', message: rejectedMsg },
      'Inactive': { type: 'info', title: 'Account Deactivated', message: 'Your vendor account has been set to inactive. Please contact support if you believe this is an error.' },
      'Pending Review': { type: 'info', title: 'Application Under Review', message: 'Your vendor application has been set back to pending review. An admin will review it shortly.' },
    };
    const data = messages[newStatus];
    if (!data) return;

    const notificationId = `NOT-${Date.now()}`;
    const notification = {
      id: notificationId,
      vendorCode: vendorId,
      read: false,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const key = `notification:${vendorId}:${notificationId}`;
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(notification), false);
    } else {
      localStorage.setItem(key, JSON.stringify(notification));
    }
  } catch (error) {
    console.error('Error creating status notification:', error);
  }
};

export const generateVendorCode = (businessType) => {
  const typeCode = {
    'manufacturer': 'OSL',
    'distributor': 'OSL',
    'service-provider': 'OSL'
  }[businessType] || 'OSL';

  const year = new Date().getFullYear();
  const randomLetters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  const randomNumbers = String(Math.floor(1000 + Math.random() * 9000));

  return `${typeCode}-${year}-${randomLetters}-${randomNumbers}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
};

export const getBusinessTypeLabel = (type) => {
  return {
    'manufacturer': 'Manufacturer',
    'distributor': 'Distributor',
    'service-provider': 'Service Provider'
  }[type] || type;
};

export const getStats = (vendors) => {
  return {
    total: vendors.length,
    pending: vendors.filter(v => v.status === 'Pending Review').length,
    approved: vendors.filter(v => v.status === 'Approved').length,
    rejected: vendors.filter(v => v.status === 'Rejected').length,
    inactive: vendors.filter(v => v.status === 'Inactive').length,
    manufacturers: vendors.filter(v => v.businessType === 'manufacturer').length,
    distributors: vendors.filter(v => v.businessType === 'distributor').length,
    serviceProviders: vendors.filter(v => v.businessType === 'service-provider').length,
  };
};

// Storage operations
export const saveVendor = async (vendorData) => {
  try {
    if (window.storage) {
      await window.storage.set(`vendor:${vendorData.id}`, JSON.stringify(vendorData), false);
    } else {
      localStorage.setItem(`vendor:${vendorData.id}`, JSON.stringify(vendorData));
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving vendor:', error);
    return { success: false, error };
  }
};

export const loadVendors = async () => {
  try {
    if (window.storage) {
      const result = await window.storage.list('vendor:', false);
      if (result && result.keys) {
        const vendorData = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        return vendorData.filter(v => v !== null).sort((a, b) =>
          new Date(b.submittedAt) - new Date(a.submittedAt)
        );
      }
      return [];
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('vendor:'));
      const vendorData = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      });
      return vendorData.filter(v => v !== null).sort((a, b) =>
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
    }
  } catch (error) {
    console.error('Error loading vendors:', error);
    return [];
  }
};

export const deleteVendor = async (vendorId) => {
  try {
    if (window.storage) {
      await window.storage.delete(`vendor:${vendorId}`, false);
    } else {
      localStorage.removeItem(`vendor:${vendorId}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return { success: false, error };
  }
};

export const updateVendorStatus = async (vendorId, newStatus, rejectionReason = '') => {
  try {
    let vendor;
    if (window.storage) {
      const result = await window.storage.get(`vendor:${vendorId}`, false);
      vendor = result ? JSON.parse(result.value) : null;
    } else {
      const data = localStorage.getItem(`vendor:${vendorId}`);
      vendor = data ? JSON.parse(data) : null;
    }

    if (!vendor) return { success: false, error: 'Vendor not found' };

    vendor.status = newStatus;
    vendor.statusUpdatedAt = new Date().toISOString();
    if (newStatus === 'Rejected' && rejectionReason) {
      vendor.rejectionReason = rejectionReason;
    } else if (newStatus !== 'Rejected') {
      delete vendor.rejectionReason;
    }

    if (window.storage) {
      await window.storage.set(`vendor:${vendorId}`, JSON.stringify(vendor), false);
    } else {
      localStorage.setItem(`vendor:${vendorId}`, JSON.stringify(vendor));
    }

    return { success: true, vendor };
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return { success: false, error };
  }
};

export const updateVendor = async (vendorId, updates) => {
  try {
    let vendor;
    if (window.storage) {
      const result = await window.storage.get(`vendor:${vendorId}`, false);
      vendor = result ? JSON.parse(result.value) : null;
    } else {
      const data = localStorage.getItem(`vendor:${vendorId}`);
      vendor = data ? JSON.parse(data) : null;
    }

    if (!vendor) return { success: false, error: 'Vendor not found' };

    const updated = { ...vendor, ...updates, updatedAt: new Date().toISOString() };

    if (window.storage) {
      await window.storage.set(`vendor:${vendorId}`, JSON.stringify(updated), false);
    } else {
      localStorage.setItem(`vendor:${vendorId}`, JSON.stringify(updated));
    }

    return { success: true, vendor: updated };
  } catch (error) {
    console.error('Error updating vendor:', error);
    return { success: false, error };
  }
};

export const saveVendorNote = async (vendorId, note) => {
  try {
    const key = `note:${vendorId}:${Date.now()}`;
    const entry = { id: key, vendorId, note, createdAt: new Date().toISOString(), createdBy: 'Admin' };
    localStorage.setItem(key, JSON.stringify(entry));
    return { success: true, entry };
  } catch (error) {
    return { success: false, error };
  }
};

export const loadVendorNotes = (vendorId) => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`note:${vendorId}:`));
    return keys
      .map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch { return []; }
};

export const deleteVendorNote = (noteKey) => {
  localStorage.removeItem(noteKey);
};
