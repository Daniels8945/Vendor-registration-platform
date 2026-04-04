import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, Download, FileText, Upload, RotateCcw } from 'lucide-react';
import { formatDate } from '../utils/vendorUtils';
import { DOC_STATUS_COLORS } from '../utils/constants';

const AdminDocumentsView = ({ onShowToast }) => {
  const [documents, setDocuments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [viewingDocument, setViewingDocument] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAllDocuments(), loadVendors()]);
    setLoading(false);
  };

  const loadAllDocuments = async () => {
    try {
      if (window.storage) {
        const result = await window.storage.list('document:', false);
        if (result && result.keys) {
          const documentData = await Promise.all(
            result.keys.map(async (key) => {
              try {
                const data = await window.storage.get(key, false);
                return data ? JSON.parse(data.value) : null;
              } catch {
                return null;
              }
            })
          );
          setDocuments(documentData.filter(doc => doc !== null).sort((a, b) => 
            new Date(b.uploadedAt) - new Date(a.uploadedAt)
          ));
        }
      } else {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('document:'));
        const documentData = keys.map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch {
            return null;
          }
        });
        setDocuments(documentData.filter(doc => doc !== null).sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        ));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
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

  const approveDocument = async (document) => {
    try {
      const updatedDocument = {
        ...document,
        status: 'Approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin'
      };

      const key = `document:${document.vendorCode}:${document.id}`;
      
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updatedDocument), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updatedDocument));
      }

      // Create notification for vendor
      await createNotification(document.vendorCode, {
        type: 'success',
        title: 'Document Approved',
        message: `Your document "${document.documentName}" has been approved by admin.`
      });

      loadAllDocuments();
      onShowToast(`Document "${document.documentName}" approved`, 'success');
    } catch (error) {
      console.error('Error approving document:', error);
      onShowToast('Failed to approve document', 'error');
    }
  };

  const resetToReview = async (document) => {
    try {
      const updatedDocument = {
        ...document,
        status: 'Pending Review',
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
      };
      const key = `document:${document.vendorCode}:${document.id}`;
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updatedDocument), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updatedDocument));
      }
      await createNotification(document.vendorCode, {
        type: 'info',
        title: 'Document Under Review',
        message: `Your document "${document.documentName}" has been moved back to pending review.`,
      });
      loadAllDocuments();
      onShowToast(`Document moved back to Pending Review`, 'success');
    } catch (error) {
      console.error('Error resetting document:', error);
      onShowToast('Failed to reset document status', 'error');
    }
  };

  const rejectDocument = async () => {
    if (!rejectModal) return;

    try {
      const updatedDocument = {
        ...rejectModal,
        status: 'Rejected',
        rejectionReason: rejectionReason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin'
      };

      const key = `document:${rejectModal.vendorCode}:${rejectModal.id}`;
      
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updatedDocument), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updatedDocument));
      }

      // Create notification for vendor
      await createNotification(rejectModal.vendorCode, {
        type: 'error',
        title: 'Document Rejected',
        message: `Your document "${rejectModal.documentName}" has been rejected. Reason: ${rejectionReason || 'Not specified'}`
      });

      loadAllDocuments();
      setRejectModal(null);
      setRejectionReason('');
      onShowToast(`Document "${rejectModal.documentName}" rejected`, 'success');
    } catch (error) {
      console.error('Error rejecting document:', error);
      onShowToast('Failed to reject document', 'error');
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

  const getStatusBadge = (status) => {
    const colors = DOC_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = 
      document.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVendorName(document.vendorCode).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || document.vendorCode === vendorFilter;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'Pending Review').length,
    approved: documents.filter(d => d.status === 'Approved').length,
    rejected: documents.filter(d => d.status === 'Rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <p className="text-gray-600 mt-1">Review and approve vendor documents</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Upload className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.approved}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <X className="w-6 h-6 text-red-600" />
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
              placeholder="Search by document name, type, or vendor..."
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
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="relative min-w-50">
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

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No documents found</p>
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
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{document.documentName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {document.documentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getVendorName(document.vendorCode)}</div>
                      <div className="text-xs text-gray-500 font-mono">{document.vendorCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(document.uploadedAt)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(document.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingDocument(document)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {document.status === 'Pending Review' && (
                          <>
                            <button
                              onClick={() => approveDocument(document)}
                              className="text-green-600 hover:text-green-800 p-2 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setRejectModal(document)}
                              className="text-red-600 hover:text-red-800 p-2 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        {(document.status === 'Approved' || document.status === 'Rejected') && (
                          <button
                            onClick={() => resetToReview(document)}
                            className="text-yellow-600 hover:text-yellow-800 p-2 rounded transition-colors"
                            title="Move back to Pending Review"
                          >
                            <RotateCcw size={18} />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Document Details</h3>
              <button onClick={() => setViewingDocument(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Document Name</p>
                <p className="text-xl font-bold text-blue-600">{viewingDocument.documentName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Vendor</p>
                  <p className="text-gray-900">{getVendorName(viewingDocument.vendorCode)}</p>
                  <p className="text-xs text-gray-500 font-mono">{viewingDocument.vendorCode}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Document Type</p>
                  <p className="text-gray-900 capitalize">{viewingDocument.documentType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  {getStatusBadge(viewingDocument.status)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Uploaded</p>
                  <p className="text-gray-900">{formatDate(viewingDocument.uploadedAt)}</p>
                </div>
              </div>

              {viewingDocument.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingDocument.description}</p>
                </div>
              )}

              {viewingDocument.status === 'Rejected' && viewingDocument.rejectionReason && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-gray-900">{viewingDocument.rejectionReason}</p>
                </div>
              )}

              {viewingDocument.status === 'Pending Review' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { approveDocument(viewingDocument); setViewingDocument(null); }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModal(viewingDocument); setViewingDocument(null); }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              )}
              {(viewingDocument.status === 'Approved' || viewingDocument.status === 'Rejected') && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { resetToReview(viewingDocument); setViewingDocument(null); }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} />
                    Move Back to Pending Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Document</h3>
              <p className="text-gray-600 text-center mb-4">
                Document: <span className="font-semibold">{rejectModal.documentName}</span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why this document is being rejected..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={rejectDocument}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Reject Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentsView;
