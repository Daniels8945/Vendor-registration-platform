import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, User,
  FileText, Upload, Calendar, Hash, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { getBusinessTypeLabel, formatDate, formatCurrency } from '../utils/vendorUtils';
import { STATUS_COLORS, INVOICE_STATUS_COLORS, DOC_STATUS_COLORS } from '../utils/constants';

const VendorProfileView = ({ vendor, onBack }) => {
  if (!vendor) return null;

  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendorData = async () => {
      setLoading(true);
      const prefix = vendor.id;

      // Load invoices
      try {
        if (window.storage) {
          const result = await window.storage.list(`invoice:${prefix}:`, false);
          if (result && result.keys) {
            const data = await Promise.all(
              result.keys.map(async (key) => {
                try {
                  const d = await window.storage.get(key, false);
                  return d ? JSON.parse(d.value) : null;
                } catch { return null; }
              })
            );
            setInvoices(data.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
          }
        } else {
          const keys = Object.keys(localStorage).filter(k => k.startsWith(`invoice:${prefix}:`));
          const data = keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } });
          setInvoices(data.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
        }
      } catch { setInvoices([]); }

      // Load documents
      try {
        if (window.storage) {
          const result = await window.storage.list(`document:${prefix}:`, false);
          if (result && result.keys) {
            const data = await Promise.all(
              result.keys.map(async (key) => {
                try {
                  const d = await window.storage.get(key, false);
                  return d ? JSON.parse(d.value) : null;
                } catch { return null; }
              })
            );
            setDocuments(data.filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
          }
        } else {
          const keys = Object.keys(localStorage).filter(k => k.startsWith(`document:${prefix}:`));
          const data = keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } });
          setDocuments(data.filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }
      } catch { setDocuments([]); }

      setLoading(false);
    };

    loadVendorData();
  }, [vendor?.id]);

  const statusColors = STATUS_COLORS[vendor.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => ['Submitted', 'Pending Approval', 'Under Review'].includes(i.status)).length,
    totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0),
  };

  const docStats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'Approved').length,
    pending: documents.filter(d => d.status === 'Pending Review').length,
  };

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: Building2 },
    { id: 'invoices',   label: `Invoices (${invoices.length})`,   icon: FileText },
    { id: 'documents',  label: `Documents (${documents.length})`, icon: Upload },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Vendor List</span>
        </button>
      </div>

      {/* Vendor Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {vendor.companyName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{vendor.companyName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                {vendor.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Hash size={14} />
                {vendor.id}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {getBusinessTypeLabel(vendor.businessType)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Registered {formatDate(vendor.submittedAt)}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{invoiceStats.total}</p>
              <p className="text-xs text-gray-500">Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{docStats.approved}</p>
              <p className="text-xs text-gray-500">Docs Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{invoiceStats.paid}</p>
              <p className="text-xs text-gray-500">Invoices Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600 mt-4">Loading vendor data...</p>
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Representative</p>
                      <p className="text-sm font-medium text-gray-900">{vendor.firstName} {vendor.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{vendor.email}</p>
                    </div>
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-3">
                      <Globe size={16} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Website</p>
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                          {vendor.website}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {[vendor.streetAddress, vendor.city, vendor.region, vendor.postalCode, vendor.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Business Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Products / Services</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{vendor.productsServices}</p>
                  </div>
                  {vendor.companyInfo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Information</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{vendor.companyInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Invoice Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-600">{invoiceStats.total}</p>
                    <p className="text-sm text-blue-700">Total Invoices</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-yellow-600">{invoiceStats.pending}</p>
                    <p className="text-sm text-yellow-700">Pending Review</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-emerald-600">{invoiceStats.paid}</p>
                    <p className="text-sm text-emerald-700">Paid</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(invoiceStats.totalAmount)}</p>
                    <p className="text-sm text-gray-600">Total Value</p>
                  </div>
                </div>
              </div>

              {/* Document Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Document Summary</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-600">{docStats.total}</p>
                    <p className="text-sm text-blue-700">Total Docs</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-600">{docStats.approved}</p>
                    <p className="text-sm text-green-700">Approved</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-yellow-600">{docStats.pending}</p>
                    <p className="text-sm text-yellow-700">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No invoices submitted by this vendor yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Invoice #</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Date</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Due Date</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Amount</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Description</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map(invoice => {
                        const colors = INVOICE_STATUS_COLORS[invoice.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{invoice.description}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {invoice.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {documents.length === 0 ? (
                <div className="p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded by this vendor yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Document Name</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Type</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Uploaded</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.map(doc => {
                        const colors = DOC_STATUS_COLORS[doc.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900">{doc.documentName}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                              {doc.documentType?.replace(/_/g, ' ')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.uploadedAt)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {doc.status === 'Approved' && <CheckCircle size={12} className="mr-1" />}
                                {doc.status === 'Rejected' && <XCircle size={12} className="mr-1" />}
                                {doc.status === 'Pending Review' && <Clock size={12} className="mr-1" />}
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                              {doc.rejectionReason || doc.description || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorProfileView;
