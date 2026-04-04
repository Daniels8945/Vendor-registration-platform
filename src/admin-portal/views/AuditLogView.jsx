import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/vendorUtils';

const ACTION_LABELS = {
  vendor_created:         { label: 'Vendor Created',         color: 'bg-blue-100 text-blue-800' },
  vendor_status_changed:  { label: 'Status Changed',         color: 'bg-yellow-100 text-yellow-800' },
  vendor_deleted:         { label: 'Vendor Deleted',         color: 'bg-red-100 text-red-800' },
  invoice_status_changed: { label: 'Invoice Status Changed', color: 'bg-purple-100 text-purple-800' },
  invoice_payment:        { label: 'Payment Recorded',       color: 'bg-emerald-100 text-emerald-800' },
  document_approved:      { label: 'Document Approved',      color: 'bg-green-100 text-green-800' },
  document_rejected:      { label: 'Document Rejected',      color: 'bg-red-100 text-red-800' },
  document_reset:         { label: 'Document Reset',         color: 'bg-gray-100 text-gray-800' },
};

const loadAuditEntries = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('audit:'));
    return keys
      .map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch { return []; }
};

const AuditLogView = () => {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    setEntries(loadAuditEntries());
  }, []);

  const clearLog = () => {
    Object.keys(localStorage).filter(k => k.startsWith('audit:')).forEach(k => localStorage.removeItem(k));
    setEntries([]);
  };

  const filtered = entries.filter(e => {
    const matchesSearch =
      e.action.includes(searchTerm.toLowerCase()) ||
      JSON.stringify(e.details).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.performedBy || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || e.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatDetails = (details) => {
    if (!details) return '—';
    const parts = [];
    if (details.vendorId)     parts.push(`Vendor: ${details.vendorId}`);
    if (details.companyName)  parts.push(details.companyName);
    if (details.newStatus)    parts.push(`→ ${details.newStatus}`);
    if (details.invoiceId)    parts.push(`Invoice: ${details.invoiceId}`);
    if (details.documentName) parts.push(`Doc: ${details.documentName}`);
    if (details.amount)       parts.push(`Amount: ₦${Number(details.amount).toLocaleString()}`);
    return parts.length ? parts.join(' · ') : JSON.stringify(details);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Full history of all admin actions</p>
        </div>
        {entries.length > 0 && (
          <button onClick={clearLog}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 px-3 py-2 rounded-lg transition-colors">
            <Trash2 size={16} />
            Clear Log
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by action, vendor, or details..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{entries.length === 0 ? 'No audit entries yet — actions will appear here.' : 'No entries match your filter.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Timestamp</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Action</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Details</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(entry => {
                  const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-sm truncate">
                        {formatDetails(entry.details)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.performedBy || 'Admin'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogView;
