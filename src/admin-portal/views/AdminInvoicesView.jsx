import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, DollarSign, Download, MoreVertical, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/vendorUtils';
import { INVOICE_STATUS_COLORS } from '../utils/constants';

const AdminInvoicesView = ({ onShowToast }) => {
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAllInvoices(), loadVendors()]);
    setLoading(false);
  };

  const loadAllInvoices = async () => {
    try {
      if (window.storage) {
        const result = await window.storage.list('invoice:', false);
        if (result && result.keys) {
          const invoiceData = await Promise.all(
            result.keys.map(async (key) => {
              try {
                const data = await window.storage.get(key, false);
                return data ? JSON.parse(data.value) : null;
              } catch {
                return null;
              }
            })
          );
          setInvoices(invoiceData.filter(inv => inv !== null).sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
          ));
        }
      } else {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('invoice:'));
        const invoiceData = keys.map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch {
            return null;
          }
        });
        setInvoices(invoiceData.filter(inv => inv !== null).sort((a, b) => 
          new Date(b.submittedAt) - new Date(a.submittedAt)
        ));
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadVendors = async () => {
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
          setVendors(vendorData.filter(v => v !== null));
        }
      } else {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('vendor:'));
        const vendorData = keys.map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch {
            return null;
          }
        });
        setVendors(vendorData.filter(v => v !== null));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const getVendorName = (vendorCode) => {
    const vendor = vendors.find(v => v.id === vendorCode);
    return vendor ? vendor.companyName : vendorCode;
  };

  const updateInvoiceStatus = async (invoice, newStatus) => {
    try {
      const updatedInvoice = {
        ...invoice,
        status: newStatus,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: 'Admin' // In production, use actual admin name
      };

      const key = `invoice:${invoice.vendorCode}:${invoice.id}`;
      
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updatedInvoice), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updatedInvoice));
      }

      // Create notification for vendor
      await createNotification(invoice.vendorCode, {
        type: newStatus === 'Approved' ? 'success' : newStatus === 'Rejected' ? 'error' : 'info',
        title: `Invoice ${newStatus}`,
        message: `Your invoice ${invoice.invoiceNumber} has been ${newStatus.toLowerCase()} by admin.`
      });

      loadAllInvoices();
      setOpenDropdown(null);
      onShowToast(`Invoice ${invoice.invoiceNumber} ${newStatus.toLowerCase()}`, 'success');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      onShowToast('Failed to update invoice status', 'error');
    }
  };

  const recordPayment = async () => {
    if (!paymentModal) return;

    try {
      const updatedInvoice = {
        ...paymentModal,
        status: 'Paid',
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.referenceNumber,
        paymentNotes: paymentData.notes,
        paidAt: new Date().toISOString(),
        paidBy: 'Admin'
      };

      const key = `invoice:${paymentModal.vendorCode}:${paymentModal.id}`;
      
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updatedInvoice), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updatedInvoice));
      }

      // Create notification for vendor
      await createNotification(paymentModal.vendorCode, {
        type: 'success',
        title: 'Payment Processed',
        message: `Payment of ${formatCurrency(paymentModal.amount)} for invoice ${paymentModal.invoiceNumber} has been processed.`
      });

      loadAllInvoices();
      setPaymentModal(null);
      setPaymentData({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        referenceNumber: '',
        notes: ''
      });
      onShowToast(`Payment recorded for invoice ${paymentModal.invoiceNumber}`, 'success');
    } catch (error) {
      console.error('Error recording payment:', error);
      onShowToast('Failed to record payment', 'error');
    }
  };

  const createNotification = async (vendorCode, notificationData) => {
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
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const downloadInvoice = (invoice) => {
    const vendor = vendors.find(v => v.id === invoice.vendorCode);
    const invoiceText = `
INVOICE

Invoice Number: ${invoice.invoiceNumber}
Invoice Date: ${formatDate(invoice.invoiceDate)}
Due Date: ${formatDate(invoice.dueDate)}
Amount: ${formatCurrency(invoice.amount)}

Vendor: ${vendor?.companyName || invoice.vendorCode}
Vendor Code: ${invoice.vendorCode}
Contact: ${vendor?.email || 'N/A'}

Description:
${invoice.description}

${invoice.notes ? `Notes:\n${invoice.notes}` : ''}

Status: ${invoice.status}
Submitted: ${formatDate(invoice.submittedAt)}
${invoice.statusUpdatedAt ? `Status Updated: ${formatDate(invoice.statusUpdatedAt)}` : ''}

---
Onction Service Limited
Generated by Admin Portal
    `.trim();

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.vendorCode}-${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
  };

  const getStatusBadge = (status) => {
    const colors = INVOICE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVendorName(invoice.vendorCode).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || invoice.vendorCode === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const stats = {
    total: invoices.length,
    submitted: invoices.filter(i => i.status === 'Submitted').length,
    pendingApproval: invoices.filter(i => i.status === 'Pending Approval').length,
    underReview: invoices.filter(i => i.status === 'Under Review').length,
    approved: invoices.filter(i => i.status === 'Approved').length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    rejected: invoices.filter(i => i.status === 'Rejected').length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
    paidAmount: invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0),
    pendingAmount: invoices.filter(i => ['Submitted', 'Pending Approval', 'Under Review', 'Approved'].includes(i.status)).reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
        <p className="text-gray-600 mt-1">Review and manage all vendor invoices</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.submitted + stats.pendingApproval + stats.underReview}
              </p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approved}</p>
              <p className="text-sm text-green-600 mt-1">Ready for payment</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.paid}</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice number, vendor, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="relative min-w-[200px]">
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.companyName} ({vendor.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Invoice #</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Vendor</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getVendorName(invoice.vendorCode)}</div>
                      <div className="text-xs text-gray-500 font-mono">{invoice.vendorCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {invoice.description}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-end">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === invoice.id ? null : invoice.id)}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          {openDropdown === invoice.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setOpenDropdown(null)}
                              ></div>
                              
                              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                                <button
                                  onClick={() => {
                                    setViewingInvoice(invoice);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye size={16} />
                                  View Details
                                </button>
                                
                                <button
                                  onClick={() => downloadInvoice(invoice)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Download size={16} />
                                  Download
                                </button>
                                
                                {(invoice.status === 'Submitted' || invoice.status === 'Pending Approval') && (
                                  <>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice, 'Under Review')}
                                      className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                    >
                                      <Clock size={16} />
                                      Mark Under Review
                                    </button>
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice, 'Approved')}
                                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <Check size={16} />
                                      Approve Invoice
                                    </button>
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice, 'Rejected')}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <X size={16} />
                                      Reject Invoice
                                    </button>
                                  </>
                                )}
                                
                                {invoice.status === 'Under Review' && (
                                  <>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice, 'Approved')}
                                      className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <Check size={16} />
                                      Approve Invoice
                                    </button>
                                    <button
                                      onClick={() => updateInvoiceStatus(invoice, 'Rejected')}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <X size={16} />
                                      Reject Invoice
                                    </button>
                                  </>
                                )}
                                
                                {invoice.status === 'Approved' && (
                                  <>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={() => {
                                        setPaymentModal(invoice);
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                                    >
                                      <DollarSign size={16} />
                                      Record Payment
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Invoice Details</h3>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                <p className="text-xl font-mono font-bold text-blue-600">{viewingInvoice.invoiceNumber}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Vendor</p>
                  <p className="text-gray-900">{getVendorName(viewingInvoice.vendorCode)}</p>
                  <p className="text-xs text-gray-500 font-mono">{viewingInvoice.vendorCode}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(viewingInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  {getStatusBadge(viewingInvoice.status)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Invoice Date</p>
                  <p className="text-gray-900">{formatDate(viewingInvoice.invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Due Date</p>
                  <p className="text-gray-900">{formatDate(viewingInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Submitted</p>
                  <p className="text-gray-900">{formatDate(viewingInvoice.submittedAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingInvoice.description}</p>
              </div>

              {viewingInvoice.notes && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingInvoice.notes}</p>
                </div>
              )}

              {viewingInvoice.status === 'Paid' && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Payment Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Payment Date</p>
                      <p className="text-sm text-gray-900">{formatDate(viewingInvoice.paymentDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Method</p>
                      <p className="text-sm text-gray-900 capitalize">{viewingInvoice.paymentMethod?.replace('_', ' ')}</p>
                    </div>
                    {viewingInvoice.paymentReference && (
                      <div>
                        <p className="text-xs text-gray-500">Reference Number</p>
                        <p className="text-sm text-gray-900 font-mono">{viewingInvoice.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-600 mt-1">Invoice: {paymentModal.invoiceNumber}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(paymentModal.amount)}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="wire_transfer">Wire Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) => setPaymentData({...paymentData, referenceNumber: e.target.value})}
                  placeholder="Transaction reference"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  rows={3}
                  placeholder="Additional payment notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setPaymentModal(null);
                    setPaymentData({
                      paymentDate: new Date().toISOString().split('T')[0],
                      paymentMethod: 'bank_transfer',
                      referenceNumber: '',
                      notes: ''
                    });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={recordPayment}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoicesView;
