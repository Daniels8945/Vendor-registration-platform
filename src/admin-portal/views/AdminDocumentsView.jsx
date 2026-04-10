import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, Check, X, FileText, Upload, RotateCcw, Download, AlertTriangle, FileDown } from 'lucide-react';
import { formatDate, formatDocumentType, exportToCSV } from '../utils/vendorUtils';
import { DOC_STATUS_COLORS } from '../utils/constants';
import { getDocuments, getVendors, updateDocumentStatus, deleteDocumentAPI } from '../../lib/api.js';

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50', days: daysLeft };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: 'text-orange-600 bg-orange-50', days: daysLeft };
  return null;
};

const AdminDocumentsView = ({ onShowToast }) => {
  const [documents, setDocuments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewingDocument, setViewingDocument] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reload = useCallback(async () => {
    try {
      const [docData, vendorData] = await Promise.all([getDocuments(), getVendors()]);
      setDocuments(docData);
      setVendors(vendorData);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    };
    run();
  }, [reload]);

  const getVendorName = (vendorCode) => {
    const vendor = vendors.find(v => v.id === vendorCode);
    return vendor ? vendor.companyName : vendorCode;
  };

  const approveDocument = async (doc) => {
    try {
      await updateDocumentStatus(doc.id, 'Approved');
      await reload();
      onShowToast(`Document "${doc.documentName}" approved`, 'success');
    } catch {
      onShowToast('Failed to approve document', 'error');
    }
  };

  const resetToReview = async (doc) => {
    try {
      await updateDocumentStatus(doc.id, 'Pending Review');
      await reload();
      onShowToast('Document moved back to Pending Review', 'success');
    } catch {
      onShowToast('Failed to reset document status', 'error');
    }
  };

  const rejectDocument = async () => {
    if (!rejectModal) return;
    try {
      await updateDocumentStatus(rejectModal.id, 'Rejected', rejectionReason);
      await reload();
      setRejectModal(null);
      setRejectionReason('');
      onShowToast(`Document "${rejectModal.documentName}" rejected`, 'success');
    } catch {
      onShowToast('Failed to reject document', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = DOC_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const filteredDocuments = documents.filter(document => {
    const vendorName = getVendorName(document.vendorCode).toLowerCase();
    const matchesSearch =
      (document.documentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendorName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || document.vendorCode === vendorFilter;
    const matchesType = typeFilter === 'all' || document.documentType === typeFilter;
    const matchesFrom = !dateFrom || new Date(document.uploadedAt) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(document.uploadedAt) <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesStatus && matchesVendor && matchesType && matchesFrom && matchesTo;
  });

  const documentTypes = [...new Set(documents.map(d => d.documentType).filter(Boolean))].sort();

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'Pending Review').length,
    approved: documents.filter(d => d.status === 'Approved').length,
    rejected: documents.filter(d => d.status === 'Rejected').length,
  };

  const expiryAlerts = documents
    .filter(d => d.status !== 'Rejected')
    .map(d => ({ ...d, expiry: getExpiryStatus(d.expiryDate) }))
    .filter(d => d.expiry !== null)
    .sort((a, b) => a.expiry.days - b.expiry.days)
    .slice(0, 5);

  const handleExportCSV = () => {
    exportToCSV(
      `documents-${new Date().toISOString().split('T')[0]}.csv`,
      ['Document Name', 'Type', 'Vendor', 'Vendor Code', 'Uploaded', 'Status', 'Rejection Reason'],
      filteredDocuments.map(d => [
        d.documentName, formatDocumentType(d.documentType), getVendorName(d.vendorCode),
        d.vendorCode, formatDate(d.uploadedAt), d.status, d.rejectionReason || '',
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">Review and approve vendor documents</p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors">
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Documents', value: stats.total, icon: FileText, bg: 'bg-blue-100', icon_color: 'text-blue-600' },
          { label: 'Pending Review', value: stats.pending, icon: Upload, bg: 'bg-yellow-100', icon_color: 'text-yellow-600' },
          { label: 'Approved', value: stats.approved, icon: Check, bg: 'bg-green-100', icon_color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, icon: X, bg: 'bg-red-100', icon_color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, bg, icon_color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
              </div>
              <div className={`${bg} rounded-full p-3`}>
                <Icon className={`w-6 h-6 ${icon_color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expiry Warnings */}
      {expiryAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-800">
              {expiryAlerts.filter(d => d.expiry.days < 0).length > 0
                ? `${expiryAlerts.filter(d => d.expiry.days < 0).length} expired · `
                : ''}{expiryAlerts.filter(d => d.expiry.days >= 0).length} expiring soon
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiryAlerts.map(d => (
              <div key={d.id} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${d.expiry.color}`}>
                <AlertTriangle size={12} />
                <span className="font-semibold">{d.documentName}</span>
                <span className="text-gray-500 font-mono text-[10px]">{d.vendorCode}</span>
                <span>— {d.expiry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by document name, type, or vendor..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm">
                <option value="all">All Status</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
              <option value="all">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
              <option value="all">All Types</option>
              {documentTypes.map(t => <option key={t} value={t}>{formatDocumentType(t)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Date range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-blue-600 hover:text-blue-800 text-xs underline">Clear</button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600 mt-4">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No documents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Document Name</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Vendor</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Uploaded</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Expiry</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{doc.documentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatDocumentType(doc.documentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getVendorName(doc.vendorCode)}</div>
                      <div className="text-xs text-gray-500 font-mono">{doc.vendorCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      {(() => {
                        if (!doc.expiryDate) return <span className="text-gray-400">—</span>;
                        const exp = getExpiryStatus(doc.expiryDate);
                        return exp ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${exp.color}`}>
                            <AlertTriangle size={11} /> {exp.label}
                          </span>
                        ) : (
                          <span className="text-gray-600">{new Date(doc.expiryDate).toLocaleDateString()}</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingDocument(doc)} title="View Details"
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors" title="Download file">
                            <Download size={16} />
                          </a>
                        )}
                        {doc.status === 'Pending Review' && (
                          <>
                            <button onClick={() => approveDocument(doc)} title="Approve"
                              className="text-green-600 hover:text-green-800 p-2 rounded-lg transition-colors">
                              <Check size={16} />
                            </button>
                            <button onClick={() => { setRejectModal(doc); setRejectionReason(''); }} title="Reject"
                              className="text-red-600 hover:text-red-800 p-2 rounded-lg transition-colors">
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {(doc.status === 'Approved' || doc.status === 'Rejected') && (
                          <button onClick={() => resetToReview(doc)} title="Move back to Pending Review"
                            className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg transition-colors">
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Document Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Document Details</h3>
              <button onClick={() => setViewingDocument(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Document Name', viewingDocument.documentName],
                  ['Document Type', formatDocumentType(viewingDocument.documentType)],
                  ['Vendor', getVendorName(viewingDocument.vendorCode)],
                  ['Vendor Code', viewingDocument.vendorCode],
                  ['Status', viewingDocument.status],
                  ['Uploaded', formatDate(viewingDocument.uploadedAt)],
                  ['Expiry Date', viewingDocument.expiryDate ? new Date(viewingDocument.expiryDate).toLocaleDateString() : '—'],
                  ['File', viewingDocument.fileOriginalName || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {viewingDocument.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewingDocument.notes}</p>
                </div>
              )}
              {viewingDocument.rejectionReason && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{viewingDocument.rejectionReason}</p>
                </div>
              )}
              {viewingDocument.fileUrl && (
                <a href={viewingDocument.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-fit transition-colors">
                  <Download size={15} /> Download File
                </a>
              )}
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                {viewingDocument.status === 'Pending Review' && (
                  <>
                    <button onClick={() => { approveDocument(viewingDocument); setViewingDocument(null); }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                      Approve
                    </button>
                    <button onClick={() => { setRejectModal(viewingDocument); setViewingDocument(null); }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {(viewingDocument.status === 'Approved' || viewingDocument.status === 'Rejected') && (
                  <button onClick={() => { resetToReview(viewingDocument); setViewingDocument(null); }}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                    Reset to Pending Review
                  </button>
                )}
                <button onClick={() => setViewingDocument(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reject Document</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting <span className="font-semibold text-gray-800">"{rejectModal.documentName}"</span>
            </p>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Rejection Reason <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
                placeholder="Explain why this document is being rejected..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={rejectDocument}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentsView;
