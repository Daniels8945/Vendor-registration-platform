import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, Clock, X, Download, Eye, Trash2, RefreshCw } from 'lucide-react';
import { DOCUMENT_TYPES } from '../utils/constants';
import { formatDate, getVendorSettings } from '../utils/vendorUtils';

const EMPTY_FORM = { documentType: 'Business Registration', documentName: '', expiryDate: '', notes: '' };

const VendorDocumentsView = ({ documents, onUploadDocument, onReuploadDocument, onDeleteDocument }) => {
  const [showForm, setShowForm] = useState(false);
  const [reuploadingDoc, setReuploadingDoc] = useState(null); // doc being re-uploaded
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const reuploadInputRef = useRef(null);

  const settings = getVendorSettings();
  const companyName = settings.companyName || 'the admin team';

  const handleFileSelect = (e, forReupload = false) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) { if (!forReupload) setSelectedFile(null); return; }
    if (file.size > 5 * 1024 * 1024) { setFileError('File must be under 5MB.'); e.target.value = ''; return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) { setFileError('Only PDF, JPG, and PNG files are allowed.'); e.target.value = ''; return; }
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setFileError('Please select a file to upload.'); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('documentType', formData.documentType);
    fd.append('documentName', formData.documentName);
    fd.append('expiryDate', formData.expiryDate);
    fd.append('notes', formData.notes);
    const success = await onUploadDocument(fd);
    if (success) { setFormData(EMPTY_FORM); setSelectedFile(null); setShowForm(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    setSubmitting(false);
  };

  const handleReupload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setFileError('Please select a replacement file.'); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('notes', formData.notes);
    fd.append('expiryDate', formData.expiryDate);
    const success = await onReuploadDocument(reuploadingDoc.id, fd);
    if (success) { setReuploadingDoc(null); setSelectedFile(null); setFormData(EMPTY_FORM); if (reuploadInputRef.current) reuploadInputRef.current.value = ''; }
    setSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await onDeleteDocument(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const getStatusBadge = (status) => {
    const map = { Approved: 'bg-green-100 text-green-800', 'Pending Review': 'bg-yellow-100 text-yellow-800', Rejected: 'bg-red-100 text-red-800' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const getStatusIcon = (status) => {
    if (status === 'Approved') return <Check className="w-4 h-4 text-green-600" />;
    if (status === 'Rejected') return <X className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-1">Upload and manage your business documents</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setReuploadingDoc(null); setSelectedFile(null); setFormData(EMPTY_FORM); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Upload size={20} /> Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload New Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type <span className="text-red-500">*</span></label>
                <select name="documentType" required value={formData.documentType} onChange={e => setFormData(p => ({ ...p, documentType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.documentName} onChange={e => setFormData(p => ({ ...p, documentName: e.target.value }))}
                  placeholder="e.g., CAC Certificate 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date (if applicable)</label>
                <input type="date" value={formData.expiryDate} onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">File <span className="text-red-500">*</span></label>
                <input type="file" ref={fileInputRef} onChange={e => handleFileSelect(e)} accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
                {selectedFile && <p className="text-xs text-green-700 mt-1">Selected: {selectedFile.name}</p>}
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 5 MB</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2}
                placeholder="Additional information..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                {submitting ? 'Uploading…' : 'Upload Document'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Re-upload Form (P2-C) */}
      {reuploadingDoc && (
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={18} className="text-orange-600" />
            <h2 className="text-lg font-bold text-orange-900">Re-upload: {reuploadingDoc.documentName}</h2>
          </div>
          <p className="text-sm text-orange-700 mb-4">Select a replacement file. The document status will be reset to Pending Review.</p>
          <form onSubmit={handleReupload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Replacement File <span className="text-red-500">*</span></label>
                <input type="file" ref={reuploadInputRef} onChange={e => handleFileSelect(e, true)} accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" />
                {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
                {selectedFile && <p className="text-xs text-green-700 mt-1">Selected: {selectedFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={formData.expiryDate} onChange={e => setFormData(p => ({ ...p, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold">
                {submitting ? 'Uploading…' : 'Submit Re-upload'}
              </button>
              <button type="button" onClick={() => { setReuploadingDoc(null); setSelectedFile(null); setFileError(''); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No documents uploaded yet</p>
            <button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-700 font-semibold">Upload your first document</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Uploaded</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Expiry</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">File</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map(doc => {
                  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900 text-sm">{doc.documentType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{doc.documentName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {doc.expiryDate ? (
                          <span className={isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {formatDate(doc.expiryDate)}{isExpired ? ' (Expired)' : ''}
                          </span>
                        ) : <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          {getStatusBadge(doc.status)}
                        </div>
                        {doc.status === 'Rejected' && doc.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1 max-w-xs"><span className="font-semibold">Reason:</span> {doc.rejectionReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {doc.fileUrl ? (
                          <div className="flex items-center gap-1">
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded transition-colors" title="View file">
                              <Eye size={16} />
                            </a>
                            <a href={doc.fileUrl} download className="text-gray-600 hover:text-gray-900 p-1.5 rounded transition-colors" title="Download">
                              <Download size={16} />
                            </a>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Re-upload rejected doc (P2-C) */}
                          {doc.status === 'Rejected' && (
                            <button
                              onClick={() => { setReuploadingDoc(doc); setShowForm(false); setSelectedFile(null); setFileError(''); setFormData({ ...EMPTY_FORM, expiryDate: doc.expiryDate || '' }); }}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                              title="Re-upload">
                              <RefreshCw size={14} /> Re-upload
                            </button>
                          )}
                          {/* Delete (P2-D) */}
                          <button
                            onClick={() => setDeleteConfirm(doc)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete document">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Document?</h3>
            <p className="text-gray-600 text-center mb-6">
              Delete "<span className="font-semibold">{deleteConfirm.documentName}</span>"? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Document Requirements</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload clear, legible copies — PDF, JPG, or PNG, max 5 MB</li>
          <li>• Ensure documents are current and not expired</li>
          <li>• Rejected documents can be re-uploaded directly from this page</li>
          <li>• All documents are reviewed by {companyName}</li>
        </ul>
      </div>
    </div>
  );
};

export default VendorDocumentsView;
