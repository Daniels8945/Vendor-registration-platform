import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, User,
  FileText, Upload, Calendar, Hash, CheckCircle, XCircle, Clock,
  Edit, Save, X, StickyNote, Trash2, Star, Activity, ListChecks,
  Check, Ban, AlertTriangle, RotateCcw, Download, Eye
} from 'lucide-react';
import {
  getBusinessTypeLabel, formatDate, formatCurrency, formatDocumentType,
  updateVendor, saveVendorNote, loadVendorNotes, deleteVendorNote, logAudit,
  updateVendorStatus, notifyVendorStatusChange
} from '../utils/vendorUtils';
import { STATUS_COLORS, INVOICE_STATUS_COLORS, DOC_STATUS_COLORS, COUNTRIES, VENDOR_STATUSES } from '../utils/constants';

const VendorProfileView = ({ vendor, onBack, onVendorUpdated }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [statusChanging, setStatusChanging] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    const load = async () => {
      setLoading(true);
      const prefix = vendor.id;

      // Invoices
      try {
        if (window.storage) {
          const r = await window.storage.list(`invoice:${prefix}:`, false);
          if (r?.keys) {
            const data = await Promise.all(r.keys.map(async k => {
              try { const d = await window.storage.get(k, false); return d ? JSON.parse(d.value) : null; } catch { return null; }
            }));
            setInvoices(data.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
          }
        } else {
          const keys = Object.keys(localStorage).filter(k => k.startsWith(`invoice:${prefix}:`));
          setInvoices(keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
            .filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
        }
      } catch { setInvoices([]); }

      // Documents
      try {
        if (window.storage) {
          const r = await window.storage.list(`document:${prefix}:`, false);
          if (r?.keys) {
            const data = await Promise.all(r.keys.map(async k => {
              try { const d = await window.storage.get(k, false); return d ? JSON.parse(d.value) : null; } catch { return null; }
            }));
            setDocuments(data.filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
          }
        } else {
          const keys = Object.keys(localStorage).filter(k => k.startsWith(`document:${prefix}:`));
          setDocuments(keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
            .filter(Boolean).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
        }
      } catch { setDocuments([]); }

      // Notes
      setNotes(loadVendorNotes(prefix));

      // Activity from audit log
      const auditKeys = Object.keys(localStorage).filter(k => k.startsWith('audit:'));
      const allAudit = auditKeys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean);
      setAuditEntries(allAudit.filter(e => e.details?.vendorId === prefix || e.details?.vendorCode === prefix)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20));

      setLoading(false);
    };
    load();
  }, [vendor]);

  if (!vendor) return null;

  const statusColors = STATUS_COLORS[vendor.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => ['Submitted', 'Pending Approval', 'Under Review'].includes(i.status)).length,
    rejected: invoices.filter(i => i.status === 'Rejected').length,
    totalAmount: invoices.reduce((s, i) => s + Number(i.amount || 0), 0),
    paidAmount: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.amount || 0), 0),
  };

  const docStats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'Approved').length,
    pending: documents.filter(d => d.status === 'Pending Review').length,
    rejected: documents.filter(d => d.status === 'Rejected').length,
  };

  // Performance score (0–100)
  const perfScore = (() => {
    if (invoices.length === 0 && documents.length === 0) return null;
    let score = 0;
    let weight = 0;
    if (documents.length > 0) {
      score += (docStats.approved / documents.length) * 40;
      weight += 40;
    }
    if (invoices.length > 0) {
      score += (invoiceStats.paid / invoices.length) * 40;
      weight += 40;
      const rejRate = invoiceStats.rejected / invoices.length;
      score += (1 - rejRate) * 20;
      weight += 20;
    }
    return weight > 0 ? Math.round((score / weight) * 100) : null;
  })();

  const perfColor = perfScore === null ? 'text-gray-400' : perfScore >= 75 ? 'text-green-600' : perfScore >= 50 ? 'text-yellow-600' : 'text-red-600';
  const perfLabel = perfScore === null ? 'N/A' : perfScore >= 75 ? 'Good' : perfScore >= 50 ? 'Fair' : 'Needs Attention';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'invoices', label: `Invoices (${invoices.length})`, icon: FileText },
    { id: 'documents', label: `Documents (${documents.length})`, icon: Upload },
    { id: 'notes', label: `Notes (${notes.length})`, icon: StickyNote },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'checklist', label: 'Checklist', icon: ListChecks },
  ];

  const checklistItems = (() => {
    const hasAllDocsApproved = docStats.total > 0 && docStats.approved === docStats.total;
    const hasProfileComplete = !!(vendor.email && vendor.phone && vendor.streetAddress && vendor.city);
    return [
      {
        label: 'Vendor Registered',
        description: 'Vendor record created in the system',
        done: true,
        date: vendor.submittedAt,
      },
      {
        label: 'Profile Complete',
        description: 'Email, phone, and address are filled in',
        done: hasProfileComplete,
        date: null,
      },
      {
        label: 'Vendor Approved',
        description: 'Application reviewed and approved by admin',
        done: vendor.status === 'Approved',
        date: vendor.statusUpdatedAt || null,
      },
      {
        label: 'Documents Uploaded',
        description: `${docStats.total} document${docStats.total !== 1 ? 's' : ''} uploaded`,
        done: docStats.total > 0,
        date: null,
      },
      {
        label: 'All Documents Approved',
        description: 'All uploaded documents reviewed and approved',
        done: hasAllDocsApproved,
        date: null,
      },
      {
        label: 'First Invoice Submitted',
        description: `${invoiceStats.total} invoice${invoiceStats.total !== 1 ? 's' : ''} submitted`,
        done: invoiceStats.total > 0,
        date: null,
      },
      {
        label: 'First Invoice Paid',
        description: `${invoiceStats.paid} paid invoice${invoiceStats.paid !== 1 ? 's' : ''}`,
        done: invoiceStats.paid > 0,
        date: null,
      },
    ];
  })();

  const handleEditSave = async () => {
    setSaving(true);
    const result = await updateVendor(vendor.id, editData);
    setSaving(false);
    if (result.success) {
      logAudit('vendor_updated', { vendorId: vendor.id, companyName: editData.companyName || vendor.companyName });
      setEditMode(false);
      if (onVendorUpdated) onVendorUpdated(result.vendor);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const result = await saveVendorNote(vendor.id, newNote.trim());
    setSavingNote(false);
    if (result.success) {
      setNotes(prev => [result.entry, ...prev]);
      setNewNote('');
    }
  };

  const handleDeleteNote = (noteKey) => {
    deleteVendorNote(noteKey);
    setNotes(prev => prev.filter(n => n.id !== noteKey));
  };

  const editField = (name, value) => setEditData(prev => ({ ...prev, [name]: value }));

  const handleStatusChange = async (newStatus, reason = '') => {
    setStatusChanging(true);
    const result = await updateVendorStatus(vendor.id, newStatus, reason);
    setStatusChanging(false);
    if (result.success) {
      logAudit('vendor_status_changed', { vendorId: vendor.id, newStatus });
      await notifyVendorStatusChange(vendor.id, newStatus, reason);
      if (onVendorUpdated) onVendorUpdated(result.vendor);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft size={18} /> Back to Vendor List
      </button>

      {/* Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="shrink-0 w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {vendor.companyName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{vendor.companyName}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                {vendor.status}
              </span>
              {perfScore !== null && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 ${perfColor}`}>
                  <Star size={11} /> {perfScore}% — {perfLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Hash size={12} />{vendor.id}</span>
              <span className="flex items-center gap-1"><Building2 size={12} />{getBusinessTypeLabel(vendor.businessType)}</span>
              <span className="flex items-center gap-1"><Calendar size={12} />Registered {formatDate(vendor.submittedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">{invoiceStats.total}</p>
              <p className="text-xs text-gray-400">Invoices</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{docStats.approved}</p>
              <p className="text-xs text-gray-400">Docs OK</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{invoiceStats.paid}</p>
              <p className="text-xs text-gray-400">Paid</p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            {/* Status Actions */}
            {vendor.status === 'Pending Review' && (
              <div className="flex gap-1.5">
                <button onClick={() => handleStatusChange('Approved')} disabled={statusChanging}
                  className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                  <Check size={13} /> Approve
                </button>
                <button onClick={() => setRejectModal(true)} disabled={statusChanging}
                  className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                  <X size={13} /> Reject
                </button>
              </div>
            )}
            {vendor.status === 'Approved' && (
              <button onClick={() => handleStatusChange('Inactive')} disabled={statusChanging}
                className="flex items-center gap-1 text-xs bg-gray-500 hover:bg-gray-600 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                <Ban size={13} /> Set Inactive
              </button>
            )}
            {(vendor.status === 'Rejected' || vendor.status === 'Inactive') && (
              <button onClick={() => handleStatusChange('Pending Review')} disabled={statusChanging}
                className="flex items-center gap-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
                <RotateCcw size={13} /> Set to Review
              </button>
            )}
            <div className="h-8 w-px bg-gray-200" />
            {!editMode ? (
              <button onClick={() => { setEditData({}); setEditMode(true); }}
                className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors">
                <Edit size={14} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleEditSave} disabled={saving}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditMode(false)}
                  className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg">
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                <h2 className="text-sm font-bold text-gray-700">Contact Information</h2>
                {[
                  { icon: User, label: 'Representative', field: 'firstName', extra: 'lastName', editable: true },
                  { icon: Mail, label: 'Email', field: 'email', editable: true, isEmail: true },
                  { icon: Phone, label: 'Phone', field: 'phone', editable: true, isPhone: true },
                  { icon: Globe, label: 'Website', field: 'website', editable: true, isUrl: true },
                ].map((row) => {
                  const FieldIcon = row.icon;
                  return (
                    <div key={row.field} className="flex items-start gap-3">
                      <FieldIcon size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{row.label}</p>
                        {editMode && row.editable ? (
                          <div className="flex gap-2 mt-0.5">
                            <input value={editData[row.field] ?? vendor[row.field] ?? ''} onChange={e => editField(row.field, e.target.value)}
                              className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            {row.extra && <input value={editData[row.extra] ?? vendor[row.extra] ?? ''} onChange={e => editField(row.extra, e.target.value)}
                              className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {row.extra
                              ? `${vendor[row.field] || ''} ${vendor[row.extra] || ''}`.trim() || '—'
                              : row.isEmail && vendor[row.field]
                                ? <a href={`mailto:${vendor[row.field]}`} className="text-blue-600 hover:underline">{vendor[row.field]}</a>
                                : row.isPhone && vendor[row.field]
                                  ? <a href={`tel:${vendor[row.field]}`} className="text-blue-600 hover:underline">{vendor[row.field]}</a>
                                  : row.isUrl && vendor[row.field]
                                    ? <a href={vendor[row.field].startsWith('http') ? vendor[row.field] : `https://${vendor[row.field]}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{vendor[row.field]}</a>
                                    : vendor[row.field] || '—'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Address</p>
                    {editMode ? (
                      <div className="space-y-1.5 mt-0.5">
                        {['streetAddress', 'city', 'region', 'postalCode'].map(f => (
                          <input key={f} value={editData[f] ?? vendor[f] ?? ''} onChange={e => editField(f, e.target.value)}
                            placeholder={f.replace(/([A-Z])/g, ' $1')}
                            className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        ))}
                        <select value={editData.country ?? vendor.country ?? ''} onChange={e => editField('country', e.target.value)}
                          className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">Select Country</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">
                        {[vendor.streetAddress, vendor.city, vendor.region, vendor.postalCode, vendor.country].filter(Boolean).join(', ') || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
                <h2 className="text-sm font-bold text-gray-700">Business Information</h2>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Business Type</p>
                  {editMode ? (
                    <select value={editData.businessType ?? vendor.businessType} onChange={e => editField('businessType', e.target.value)}
                      className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="manufacturer">Manufacturer</option>
                      <option value="distributor">Distributor</option>
                      <option value="service-provider">Service Provider</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{getBusinessTypeLabel(vendor.businessType)}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Products / Services</p>
                  {editMode ? (
                    <textarea value={editData.productsServices ?? vendor.productsServices ?? ''} onChange={e => editField('productsServices', e.target.value)}
                      rows={3} className="w-full text-sm px-2 py-1 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  ) : (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{vendor.productsServices || '—'}</p>
                  )}
                </div>
                {(vendor.companyInfo || editMode) && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Company Info</p>
                    {editMode ? (
                      <textarea value={editData.companyInfo ?? vendor.companyInfo ?? ''} onChange={e => editField('companyInfo', e.target.value)}
                        rows={3} className="w-full text-sm px-2 py-1 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{vendor.companyInfo || '—'}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Invoice Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Invoice Summary</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Invoices', value: invoiceStats.total, cls: 'bg-blue-50 text-blue-600' },
                    { label: 'Pending', value: invoiceStats.pending, cls: 'bg-yellow-50 text-yellow-600' },
                    { label: 'Paid', value: invoiceStats.paid, cls: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Total Value', value: formatCurrency(invoiceStats.totalAmount), cls: 'bg-gray-50 text-gray-800', small: true },
                  ].map(({ label, value, cls, small }) => (
                    <div key={label} className={`rounded-lg p-3 ${cls.split(' ')[0]}`}>
                      <p className={`${small ? 'text-base' : 'text-xl'} font-bold ${cls.split(' ')[1]}`}>{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Document Summary</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total', value: docStats.total, cls: 'bg-blue-50 text-blue-600' },
                    { label: 'Approved', value: docStats.approved, cls: 'bg-green-50 text-green-600' },
                    { label: 'Pending', value: docStats.pending, cls: 'bg-yellow-50 text-yellow-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className={`rounded-lg p-3 ${cls.split(' ')[0]}`}>
                      <p className={`text-xl font-bold ${cls.split(' ')[1]}`}>{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {invoices.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">No invoices submitted by this vendor yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Invoice #', 'Date', 'Due Date', 'Amount', 'Description', 'Status'].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-sm font-bold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map(invoice => {
                        const colors = INVOICE_STATUS_COLORS[invoice.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                        const overdue = invoice.dueDate && !['Paid', 'Rejected'].includes(invoice.status) && new Date(invoice.dueDate) < new Date();
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</td>
                            <td className={`px-6 py-4 text-sm ${overdue ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>{formatDate(invoice.dueDate)}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(invoice.amount)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{invoice.description}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {invoice.status}
                              </span>
                              {invoice.rejectionReason && (
                                <p className="text-xs text-red-500 mt-1 truncate max-w-xs">{invoice.rejectionReason}</p>
                              )}
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
                <div className="p-12 text-center text-gray-500 text-sm">No documents uploaded by this vendor yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Document Name', 'Type', 'Uploaded', 'Status', 'Notes', ''].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-sm font-bold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documents.map(doc => {
                        const colors = DOC_STATUS_COLORS[doc.status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 text-sm">{doc.documentName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDocumentType(doc.documentType)}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(doc.uploadedAt)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {doc.status === 'Approved' && <CheckCircle size={11} className="mr-1" />}
                                {doc.status === 'Rejected' && <XCircle size={11} className="mr-1" />}
                                {doc.status === 'Pending Review' && <Clock size={11} className="mr-1" />}
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                              {doc.rejectionReason || doc.description || '—'}
                            </td>
                            <td className="px-6 py-4">
                              {doc.fileContent ? (
                                <div className="flex items-center gap-1">
                                  {(doc.fileType?.startsWith('image/') || doc.fileType === 'application/pdf') && (
                                    <a href={doc.fileContent} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 p-1 rounded" title="Preview">
                                      <Eye size={15} />
                                    </a>
                                  )}
                                  <a href={doc.fileContent} download={doc.fileName || doc.documentName}
                                    className="text-gray-600 hover:text-gray-900 p-1 rounded" title="Download">
                                    <Download size={15} />
                                  </a>
                                </div>
                              ) : <span className="text-gray-300 text-xs">—</span>}
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

          {/* NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Add Note</h2>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
                  placeholder="Add an internal note about this vendor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
                <button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {savingNote ? 'Adding…' : 'Add Note'}
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">No notes yet.</div>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{note.note}</p>
                        <button onClick={() => handleDeleteNote(note.id)}
                          className="text-gray-400 hover:text-red-500 shrink-0 p-1 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{note.createdBy} · {formatDate(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {auditEntries.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-400">No activity recorded for this vendor yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {auditEntries.map(entry => {
                    const actionColors = {
                      vendor_created: 'bg-blue-100 text-blue-800',
                      vendor_status_changed: 'bg-yellow-100 text-yellow-800',
                      vendor_deleted: 'bg-red-100 text-red-800',
                      invoice_status_changed: 'bg-purple-100 text-purple-800',
                      invoice_payment: 'bg-emerald-100 text-emerald-800',
                      document_approved: 'bg-green-100 text-green-800',
                      document_rejected: 'bg-red-100 text-red-800',
                      document_reset: 'bg-gray-100 text-gray-800',
                    };
                    const actionLabels = {
                      vendor_created: 'Vendor Created',
                      vendor_status_changed: 'Status Changed',
                      vendor_deleted: 'Vendor Deleted',
                      invoice_status_changed: 'Invoice Status Changed',
                      invoice_payment: 'Payment Recorded',
                      document_approved: 'Document Approved',
                      document_rejected: 'Document Rejected',
                      document_reset: 'Document Reset',
                    };
                    return (
                      <div key={entry.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50">
                        <div className="mt-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[entry.action] || 'bg-gray-100 text-gray-700'}`}>
                            {actionLabels[entry.action] || entry.action}
                          </span>
                        </div>
                        <div className="flex-1">
                          {entry.details?.newStatus && <p className="text-sm text-gray-700">→ {entry.details.newStatus}</p>}
                          {entry.details?.invoiceId && <p className="text-sm text-gray-700">Invoice: {entry.details.invoiceId}</p>}
                          {entry.details?.amount && <p className="text-sm text-gray-700">Amount: {formatCurrency(entry.details.amount)}</p>}
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(entry.timestamp)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-700">Onboarding Checklist</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Track vendor onboarding progress</p>
                </div>
                <span className="text-sm font-bold text-blue-600">
                  {checklistItems.filter(i => i.done).length}/{checklistItems.length} complete
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(checklistItems.filter(i => i.done).length / checklistItems.length) * 100}%` }}
                />
              </div>
              <div className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${item.done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-300'}`}>
                      {item.done && <CheckCircle size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${item.done ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      {item.done && item.date && (
                        <p className="text-xs text-green-600 mt-0.5">{formatDate(item.date)}</p>
                      )}
                    </div>
                    {!item.done && (
                      <span className="shrink-0 text-xs text-gray-400 font-medium px-2 py-0.5 rounded-full bg-gray-200">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {/* Reject Vendor Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Reject Vendor</h3>
              <p className="text-gray-500 text-center text-sm mb-4">
                Rejecting <span className="font-semibold text-gray-800">{vendor.companyName}</span>
              </p>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Rejection Reason <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this vendor is being rejected..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRejectModal(false); setRejectReason(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => { handleStatusChange('Rejected', rejectReason); setRejectModal(false); setRejectReason(''); }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Reject Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProfileView;
