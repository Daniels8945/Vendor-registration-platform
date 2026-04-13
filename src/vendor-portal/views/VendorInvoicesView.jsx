import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { FileText, Plus, Search, Download, Edit, Trash2, Eye, X, MoreVertical, History, PlusCircle, MinusCircle, Upload } from 'lucide-react';
import { INVOICE_STATUS_COLORS } from '../utils/constants';
import { formatDate, formatCurrency, getVendorSettings } from '../utils/vendorUtils';
import { getInvoice, getVendorToken } from '../../lib/api.js';
import { downloadInvoicePdf } from '../../lib/invoicePdf.js';

const EMPTY_LINE_ITEM = { description: '', quantity: 1, unitPrice: '' };

const emptyForm = () => ({
  dueDate: '',
  description: '',
  notes: '',
  lineItems: [{ ...EMPTY_LINE_ITEM }],
});

const EMPTY_UPLOAD_FORM = { description: '', amount: '', dueDate: '', notes: '' };

const VendorInvoicesView = ({ vendor, invoices, onSubmitInvoice, onUploadInvoiceFile, onEditInvoice, onDeleteInvoice }) => {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'upload'
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [viewHistory, setViewHistory] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [loadingHistory, setLoadingHistory] = useState(false);
  // upload-file state
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_FORM);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileError, setUploadFileError] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const uploadFileRef = useRef(null);

  const settings = getVendorSettings();

  // ── Line-item helpers ───────────────────────────────────────────────────────
  const lineTotal = (item) => (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  const invoiceTotal = (items) => items.reduce((s, i) => s + lineTotal(i), 0);

  const addLineItem = () => setFormData(prev => ({ ...prev, lineItems: [...prev.lineItems, { ...EMPTY_LINE_ITEM }] }));
  const removeLineItem = (idx) => setFormData(prev => ({ ...prev, lineItems: prev.lineItems.filter((_, i) => i !== idx) }));
  const updateLineItem = (idx, field, value) =>
    setFormData(prev => {
      const items = prev.lineItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
      return { ...prev, lineItems: items };
    });

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = invoiceTotal(formData.lineItems);
    const payload = {
      ...formData,
      amount: total,
      lineItems: formData.lineItems.map(item => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        amount: lineTotal(item),
      })),
    };

    let success;
    if (editingInvoice) {
      success = await onEditInvoice(editingInvoice.id, payload);
    } else {
      success = await onSubmitInvoice(payload);
    }
    if (success) { setFormData(emptyForm()); setShowForm(false); setEditingInvoice(null); }
  };

  const handleUploadFileSelect = (e) => {
    const file = e.target.files?.[0];
    setUploadFileError('');
    if (!file) { setUploadFile(null); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadFileError('File must be under 10 MB.'); e.target.value = ''; return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) { setUploadFileError('Only PDF, JPG, and PNG files are allowed.'); e.target.value = ''; return; }
    setUploadFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) { setUploadFileError('Please select an invoice file.'); return; }
    setUploadSubmitting(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('description', uploadForm.description);
    fd.append('amount', uploadForm.amount);
    fd.append('dueDate', uploadForm.dueDate);
    fd.append('notes', uploadForm.notes);
    const success = await onUploadInvoiceFile(fd);
    if (success) {
      setUploadForm(EMPTY_UPLOAD_FORM);
      setUploadFile(null);
      setShowForm(false);
      if (uploadFileRef.current) uploadFileRef.current.value = '';
    }
    setUploadSubmitting(false);
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      dueDate: invoice.dueDate || '',
      description: invoice.description || '',
      notes: invoice.notes || '',
      lineItems: invoice.lineItems?.length
        ? invoice.lineItems.map(li => ({ description: li.description, quantity: li.quantity, unitPrice: li.unit_price ?? li.unitPrice }))
        : [{ ...EMPTY_LINE_ITEM }],
    });
    setFormMode('create');
    setShowForm(true);
    setOpenDropdown(null);
  };

  // ── View with status history ────────────────────────────────────────────────
  const handleView = async (invoice) => {
    setViewingInvoice(invoice);
    setViewHistory([]);
    setLoadingHistory(true);
    setOpenDropdown(null);
    try {
      const full = await getInvoice(invoice.id, getVendorToken());
      setViewingInvoice(full);
      setViewHistory(full.statusHistory || []);
    } catch { /* use local copy */ }
    setLoadingHistory(false);
  };

  const handleDelete = (invoice) => { setDeleteConfirmModal(invoice); setOpenDropdown(null); };
  const confirmDelete = async () => { if (deleteConfirmModal) { await onDeleteInvoice(deleteConfirmModal.id); setDeleteConfirmModal(null); } };

  // ── Download as PDF ──────────────────────────────────────────────────────────
  const handleDownloadPdf = (invoice) => {
    downloadInvoicePdf(
      { ...invoice, vendorName: vendor.companyName, vendorCode: vendor.id },
      settings
    );
    setOpenDropdown(null);
  };

  // ── Download as text ────────────────────────────────────────────────────────
  const handleDownload = (invoice) => {
    const companyName = settings.companyName || 'Vendor Portal';
    const lineItemsText = (invoice.lineItems || []).length > 0
      ? '\nLine Items:\n' + invoice.lineItems.map(li =>
          `  ${li.description} | Qty: ${li.quantity} × ${formatCurrency(li.unit_price ?? li.unitPrice)} = ${formatCurrency(li.amount)}`
        ).join('\n')
      : '';

    const text = `INVOICE

Invoice Number: ${invoice.invoiceNumber}
Due Date: ${formatDate(invoice.dueDate)}
Amount: ${formatCurrency(invoice.amount)}
${lineItemsText}

Vendor: ${vendor.companyName}
Vendor Code: ${vendor.id}

Description:
${invoice.description}
${invoice.notes ? `\nNotes:\n${invoice.notes}` : ''}

Status: ${invoice.status}
Submitted: ${formatDate(invoice.submittedAt)}

---
Generated by ${companyName} Vendor Portal`.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
  };

  const getStatusBadge = (status) => {
    const colors = INVOICE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>{status}</span>;
  };

  const canEdit = (inv) => inv.status === 'Submitted';
  const canDelete = (inv) => inv.status === 'Submitted';

  const filteredInvoices = invoices.filter(inv =>
    (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track your invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowForm(true); setFormMode('create'); setEditingInvoice(null); setFormData(emptyForm()); }}
            disabled={vendor.status !== 'Approved'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} /> Create Invoice
          </button>
          <button
            onClick={() => { setShowForm(true); setFormMode('upload'); setEditingInvoice(null); }}
            disabled={vendor.status !== 'Approved'}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Upload size={20} /> Upload Invoice
          </button>
        </div>
      </div>

      {vendor.status !== 'Approved' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">You need to be approved before submitting invoices.</p>
        </div>
      )}

      {/* Upload Invoice File Form */}
      {showForm && formMode === 'upload' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Upload Invoice File</h2>
          <p className="text-sm text-gray-500 mb-4">Upload a PDF or image of an invoice you created outside the platform.</p>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice File <span className="text-red-500">*</span></label>
                <input type="file" ref={uploadFileRef} onChange={handleUploadFileSelect} accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {uploadFileError && <p className="text-xs text-red-600 mt-1">{uploadFileError}</p>}
                {uploadFile && <p className="text-xs text-green-700 mt-1">Selected: {uploadFile.name}</p>}
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10 MB</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Amount</label>
                <input type="number" min="0" step="0.01" value={uploadForm.amount} onChange={e => setUploadForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                <input type="date" value={uploadForm.dueDate} onChange={e => setUploadForm(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <input type="text" value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the invoice"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea value={uploadForm.notes} onChange={e => setUploadForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                placeholder="Additional notes..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploadSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                {uploadSubmitting ? 'Uploading…' : 'Upload Invoice'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Invoice Create/Edit Form */}
      {showForm && formMode === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingInvoice ? `Edit ${editingInvoice.invoiceNumber}` : 'Submit New Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Line Items (P2-A) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Line Items <span className="text-red-500">*</span></label>
                <button type="button" onClick={addLineItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <PlusCircle size={16} /> Add Line
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Description</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 w-20">Qty</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 w-32">Unit Price</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600 w-32">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <input type="text" required value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)}
                            placeholder="Service or item description"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" required min="1" step="any" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" required min="0" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(lineTotal(item))}
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          {formData.lineItems.length > 1 && (
                            <button type="button" onClick={() => removeLineItem(idx)} className="text-red-400 hover:text-red-600">
                              <MinusCircle size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="3" className="px-3 py-2 text-right font-bold text-gray-700">Total:</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(invoiceTotal(formData.lineItems))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                <input type="date" name="dueDate" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea name="description" required value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3}
                placeholder="Brief description of goods/services rendered..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2}
                placeholder="Additional notes..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                {editingInvoice ? 'Update Invoice' : 'Submit Invoice'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingInvoice(null); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}



      {/* View Invoice Modal with Status History (P2-E) */}
      {viewingInvoice && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
                  <p className="text-xl font-mono font-bold text-blue-600">{viewingInvoice.invoiceNumber}</p>
                </div>
                {getStatusBadge(viewingInvoice.status)}
              </div>

              {/* Line Items */}
              {viewingInvoice.lineItems?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Line Items</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-600 font-semibold">Description</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-semibold">Qty</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-semibold">Unit Price</th>
                          <th className="text-right px-3 py-2 text-gray-600 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewingInvoice.lineItems.map((li, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{li.description}</td>
                            <td className="px-3 py-2 text-right">{li.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(li.unit_price ?? li.unitPrice)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(li.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan="3" className="px-3 py-2 font-bold text-right text-gray-700">Total</td>
                          <td className="px-3 py-2 font-bold text-right text-gray-900">{formatCurrency(viewingInvoice.amount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(viewingInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Due Date</p>
                  <p className="text-gray-900">{formatDate(viewingInvoice.dueDate)}</p>
                </div>
              </div>

              {viewingInvoice.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{viewingInvoice.description}</p>
                </div>
              )}

              {viewingInvoice.fileUrl && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Attached Invoice File</p>
                  <div className="flex items-center gap-3">
                    <a href={viewingInvoice.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <Eye size={15} /> View File
                    </a>
                    <a href={viewingInvoice.fileUrl} download
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Download size={15} /> Download
                    </a>
                    <span className="text-xs text-gray-400">{viewingInvoice.fileOriginalName}</span>
                  </div>
                </div>
              )}

              {viewingInvoice.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600">{viewingInvoice.rejectionReason}</p>
                </div>
              )}

              {/* Status History (P2-E) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={16} className="text-gray-500" />
                  <p className="text-sm font-semibold text-gray-700">Status History</p>
                </div>
                {loadingHistory ? (
                  <p className="text-sm text-gray-400">Loading history…</p>
                ) : viewHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">No status history available.</p>
                ) : (
                  <ol className="relative border-l border-gray-200 ml-3 space-y-3">
                    {viewHistory.map((entry, i) => {
                      const colors = INVOICE_STATUS_COLORS[entry.status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                      return (
                        <li key={i} className="ml-4">
                          <span className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white"></span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{entry.status}</span>
                            <span className="text-xs text-gray-400">{formatDate(entry.changed_at)}</span>
                            {entry.changed_by && <span className="text-xs text-gray-400">by {entry.changed_by}</span>}
                          </div>
                          {entry.reason && <p className="text-xs text-gray-500 mt-0.5">{entry.reason}</p>}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => handleDownloadPdf(viewingInvoice)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                  <Download size={18} /> Download PDF
                </button>
                <button onClick={() => handleDownload(viewingInvoice)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Download size={16} /> .txt
                </button>
                {canEdit(viewingInvoice) && (
                  <button onClick={() => { setViewingInvoice(null); handleEdit(viewingInvoice); }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                    <Edit size={18} /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search invoices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{searchTerm ? 'No invoices found' : 'No invoices submitted yet'}</p>
            {!searchTerm && vendor.status === 'Approved' && (
              <button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-700 font-semibold">Submit your first invoice</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Invoice #</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Due</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(invoice.submittedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      <p className="truncate">{invoice.description}</p>
                      {invoice.lineItems?.length > 0 && <p className="text-xs text-gray-400 mt-0.5">{invoice.lineItems.length} line item{invoice.lineItems.length > 1 ? 's' : ''}</p>}
                      {invoice.fileUrl && (
                        <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <FileText size={11} /> {invoice.fileOriginalName || 'Attached file'}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-end">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              if (openDropdown === invoice.id) { setOpenDropdown(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
                              setOpenDropdown(invoice.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                          >
                            <MoreVertical size={20} />
                          </button>

                          {openDropdown === invoice.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                              <div className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
                                style={{ top: dropdownPosition.top, right: dropdownPosition.right }}>
                                <button onClick={() => handleView(invoice)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                  <Eye size={16} /> View Details
                                </button>
                                <button onClick={() => handleDownloadPdf(invoice)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                  <Download size={16} /> Download PDF
                                </button>
                                <button onClick={() => handleDownload(invoice)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                  <Download size={16} /> Download .txt
                                </button>
                                {canEdit(invoice) && (
                                  <>
                                    <div className="border-t border-gray-100 my-1" />
                                    <button onClick={() => handleEdit(invoice)} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                                      <Edit size={16} /> Edit
                                    </button>
                                  </>
                                )}
                                {canDelete(invoice) && (
                                  <button onClick={() => handleDelete(invoice)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <Trash2 size={16} /> Delete
                                  </button>
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

      {/* Delete Confirm */}
      {deleteConfirmModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Invoice?</h3>
            <p className="text-gray-600 text-center mb-6">
              Delete <span className="font-mono font-semibold">{deleteConfirmModal.invoiceNumber}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmModal(null)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VendorInvoicesView;
