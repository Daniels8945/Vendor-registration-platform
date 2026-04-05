// Vendor Portal Utility Functions

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

// Get vendor by vendor code
export const getVendorByCode = async (vendorCode) => {
  try {
    if (window.storage) {
      const result = await window.storage.get(`vendor:${vendorCode}`, false);
      return result ? JSON.parse(result.value) : null;
    } else {
      const data = localStorage.getItem(`vendor:${vendorCode}`);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error loading vendor:', error);
    return null;
  }
};

// Update vendor profile
export const updateVendorProfile = async (vendorCode, updates) => {
  try {
    const vendor = await getVendorByCode(vendorCode);
    if (!vendor) return { success: false, error: 'Vendor not found' };

    const updatedVendor = {
      ...vendor,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (window.storage) {
      await window.storage.set(`vendor:${vendorCode}`, JSON.stringify(updatedVendor), false);
    } else {
      localStorage.setItem(`vendor:${vendorCode}`, JSON.stringify(updatedVendor));
    }

    return { success: true, vendor: updatedVendor };
  } catch (error) {
    console.error('Error updating vendor:', error);
    return { success: false, error };
  }
};

// Submit invoice
export const submitInvoice = async (vendorCode, invoiceData) => {
  try {
    const invoiceId = `INV-${Date.now()}`;
    
    // Get next invoice number
    const invoiceNumber = await getNextInvoiceNumber(vendorCode);
    
    const invoice = {
      id: invoiceId,
      vendorCode,
      ...invoiceData,
      invoiceNumber, // Auto-generated
      status: 'Submitted',
      submittedAt: new Date().toISOString()
    };

    const key = `invoice:${vendorCode}:${invoiceId}`;
    
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(invoice), false);
    } else {
      localStorage.setItem(key, JSON.stringify(invoice));
    }

    // Log activity
    await logActivity(vendorCode, {
      type: 'invoice_created',
      title: 'Invoice Created',
      description: `Created invoice ${invoiceNumber}`,
      metadata: { invoiceId, invoiceNumber, amount: invoiceData.amount }
    });

    return { success: true, invoice };
  } catch (error) {
    console.error('Error submitting invoice:', error);
    return { success: false, error };
  }
};

// Get next invoice number (vendor-scoped, e.g. OSL-2024-ABC-1234/001)
export const getNextInvoiceNumber = async (vendorCode) => {
  try {
    const invoices = await getVendorInvoices(vendorCode);
    const count = invoices.length;
    const seq = String(count + 1).padStart(3, '0');
    return `${vendorCode}/${seq}`;
  } catch (error) {
    return `${vendorCode}/001`;
  }
};

// Get vendor invoices
export const getVendorInvoices = async (vendorCode) => {
  try {
    if (window.storage) {
      const result = await window.storage.list(`invoice:${vendorCode}:`, false);
      if (result && result.keys) {
        const invoices = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        return invoices.filter(inv => inv !== null).sort((a, b) => 
          new Date(b.submittedAt) - new Date(a.submittedAt)
        );
      }
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`invoice:${vendorCode}:`));
      const invoices = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      });
      return invoices.filter(inv => inv !== null).sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
    }
    return [];
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
};

// Edit invoice
export const editInvoice = async (vendorCode, invoiceId, updates) => {
  try {
    const key = `invoice:${vendorCode}:${invoiceId}`;
    
    // Get existing invoice
    let invoice;
    if (window.storage) {
      const result = await window.storage.get(key, false);
      invoice = result ? JSON.parse(result.value) : null;
    } else {
      const data = localStorage.getItem(key);
      invoice = data ? JSON.parse(data) : null;
    }

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    // Update invoice
    const updatedInvoice = {
      ...invoice,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Save back
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(updatedInvoice), false);
    } else {
      localStorage.setItem(key, JSON.stringify(updatedInvoice));
    }

    // Log activity
    await logActivity(vendorCode, {
      type: 'invoice_edited',
      title: 'Invoice Updated',
      description: `Updated invoice ${invoice.invoiceNumber}`,
      metadata: { invoiceId, invoiceNumber: invoice.invoiceNumber }
    });

    return { success: true, invoice: updatedInvoice };
  } catch (error) {
    console.error('Error editing invoice:', error);
    return { success: false, error };
  }
};

// Delete invoice
export const deleteInvoice = async (vendorCode, invoiceId) => {
  try {
    const key = `invoice:${vendorCode}:${invoiceId}`;
    
    // Get invoice first for activity log
    let invoice;
    if (window.storage) {
      const result = await window.storage.get(key, false);
      invoice = result ? JSON.parse(result.value) : null;
    } else {
      const data = localStorage.getItem(key);
      invoice = data ? JSON.parse(data) : null;
    }

    // Delete invoice
    if (window.storage) {
      await window.storage.delete(key, false);
    } else {
      localStorage.removeItem(key);
    }

    // Log activity
    if (invoice) {
      await logActivity(vendorCode, {
        type: 'invoice_deleted',
        title: 'Invoice Deleted',
        description: `Deleted invoice ${invoice.invoiceNumber}`,
        metadata: { invoiceId, invoiceNumber: invoice.invoiceNumber }
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error };
  }
};

// Upload document
export const uploadDocument = async (vendorCode, documentData) => {
  try {
    const docId = `DOC-${Date.now()}`;
    const document = {
      id: docId,
      vendorCode,
      ...documentData,
      status: 'Pending Review',
      uploadedAt: new Date().toISOString()
    };

    const key = `document:${vendorCode}:${docId}`;
    
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(document), false);
    } else {
      localStorage.setItem(key, JSON.stringify(document));
    }

    return { success: true, document };
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, error };
  }
};

// Get vendor documents
export const getVendorDocuments = async (vendorCode) => {
  try {
    if (window.storage) {
      const result = await window.storage.list(`document:${vendorCode}:`, false);
      if (result && result.keys) {
        const documents = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        return documents.filter(doc => doc !== null).sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        );
      }
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`document:${vendorCode}:`));
      const documents = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      });
      return documents.filter(doc => doc !== null).sort((a, b) => 
        new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
    }
    return [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
};

// Get notifications for vendor
export const getVendorNotifications = async (vendorCode) => {
  try {
    if (window.storage) {
      const result = await window.storage.list(`notification:${vendorCode}:`, false);
      if (result && result.keys) {
        const notifications = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        return notifications.filter(n => n !== null).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`notification:${vendorCode}:`));
      const notifications = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      });
      return notifications.filter(n => n !== null).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    return [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

// Log activity
export const logActivity = async (vendorCode, activityData) => {
  try {
    const activityId = `ACT-${Date.now()}`;
    const activity = {
      id: activityId,
      vendorCode,
      ...activityData,
      timestamp: new Date().toISOString()
    };

    const key = `activity:${vendorCode}:${activityId}`;
    
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(activity), false);
    } else {
      localStorage.setItem(key, JSON.stringify(activity));
    }

    return { success: true, activity };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
};

// Get vendor activities
export const getVendorActivities = async (vendorCode) => {
  try {
    if (window.storage) {
      const result = await window.storage.list(`activity:${vendorCode}:`, false);
      if (result && result.keys) {
        const activities = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        return activities.filter(a => a !== null).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
      }
    } else {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`activity:${vendorCode}:`));
      const activities = keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch {
          return null;
        }
      });
      return activities.filter(a => a !== null).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    }
    return [];
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
};

// Create notification for vendor (to be called from Admin Portal)
// This function should be imported and used in the admin portal when changing vendor status
export const createVendorNotification = async (vendorCode, notificationData) => {
  try {
    const notificationId = `NOT-${Date.now()}`;
    const notification = {
      id: notificationId,
      vendorCode,
      read: false,
      createdAt: new Date().toISOString(),
      ...notificationData
    };

    const key = `notification:${vendorCode}:${notificationId}`;
    
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(notification), false);
    } else {
      localStorage.setItem(key, JSON.stringify(notification));
    }

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

// Helper function for admin to notify vendor about status changes
// Import this function in your admin portal and call it when approving/rejecting vendors
export const notifyVendorStatusChange = async (vendorCode, newStatus, adminName = 'Admin') => {
  const statusMessages = {
    'Approved': {
      type: 'success',
      title: 'Vendor Account Approved! 🎉',
      message: `Congratulations! Your vendor account has been approved by ${adminName}. You can now submit invoices and upload documents.`
    },
    'Rejected': {
      type: 'error',
      title: 'Vendor Application Not Approved',
      message: `Your vendor application has been reviewed by ${adminName}. Unfortunately, we cannot approve your account at this time. Please contact support for more information.`
    },
    'Inactive': {
      type: 'warning',
      title: 'Account Set to Inactive',
      message: `Your vendor account has been set to inactive by ${adminName}. Please contact support if you believe this is an error.`
    }
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) {
    console.warn(`No notification template for status: ${newStatus}`);
    return { success: false, error: 'Unknown status' };
  }

  return await createVendorNotification(vendorCode, {
    type: statusInfo.type,
    title: statusInfo.title,
    message: statusInfo.message
  });
};
