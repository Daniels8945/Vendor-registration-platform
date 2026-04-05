import React, { useState } from 'react';
import { ClipboardList, Search, Trash2, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate, exportToCSV, formatCurrency } from '../utils/vendorUtils';
import { getAuditLog, clearAuditLog } from '../../lib/api.js';

const PAGE_SIZE = 50;

const ACTION_LABELS = {
  vendor_created:         { label: 'Vendor Created',         color: 'bg-blue-100 text-blue-800' },
  invoice_created:        { label: 'Invoice Created',        color: 'bg-blue-100 text-blue-800' },
  vendor_status_changed:  { label: 'Status Changed',         color: 'bg-yellow-100 text-yellow-800' },
  vendor_deleted:         { label: 'Vendor Deleted',         color: 'bg-red-100 text-red-800' },
  invoice_status_changed: { label: 'Invoice Status Changed', color: 'bg-purple-100 text-purple-800' },
  invoice_payment:        { label: 'Payment Recorded',       color: 'bg-emerald-100 text-emerald-800' },
  document_approved:      { label: 'Document Approved',      color: 'bg-green-100 text-green-800' },
  document_rejected:      { label: 'Document Rejected',      color: 'bg-red-100 text-red-800' },
  document_reset:         { label: 'Document Reset',         color: 'bg-gray-100 text-gray-800' },
};

const AuditLogView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const qc = useQueryClient();
  const { data: entries = [] } = useQuery({
    queryKey: ['audit-log'],
    queryFn: getAuditLog,
    staleTime: 30_000,
  });

  const clearMutation = useMutation({
    mutationFn: clearAuditLog,
    onSuccess: () => qc.setQueryData(['audit-log'], []),
  });
  const clearLog = () => clearMutation.mutate();

  const formatDetails = (details) => {
    if (!details) return '—';
    const parts = [];
    if (details.vendorId)     parts.push(`Vendor: ${details.vendorId}`);
    if (details.companyName)  parts.push(details.companyName);
    if (details.newStatus)    parts.push(`→ ${details.newStatus}`);
    if (details.invoiceId)    parts.push(`Invoice: ${details.invoiceId}`);
    if (details.documentName) parts.push(`Doc: ${details.documentName}`);
    if (details.amount)       parts.push(`Amount: ${formatCurrency(details.amount)}`);
    return parts.length ? parts.join(' · ') : JSON.stringify(details);
  };

  // Derive filtered list; reset page when filters change via handler wrappers
  const setSearchTermAndReset = (v) => { setSearchTerm(v); setPage(1); };
  const setActionFilterAndReset = (v) => { setActionFilter(v); setPage(1); };
  const setDateFromAndReset = (v) => { setDateFrom(v); setPage(1); };
  const setDateToAndReset = (v) => { setDateTo(v); setPage(1); };

  const filtered = entries.filter(e => {
    const matchesSearch =
      e.action.includes(searchTerm.toLowerCase()) ||
      JSON.stringify(e.details).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.performedBy || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || e.action === actionFilter;
    const matchesFrom = !dateFrom || new Date(e.timestamp) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(e.timestamp) <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesAction && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportCSV = () => {
    exportToCSV(
      `audit-log-${new Date().toISOString().split('T')[0]}.csv`,
      ['Timestamp', 'Action', 'Details', 'Performed By'],
      filtered.map(e => [
        formatDate(e.timestamp),
        ACTION_LABELS[e.action]?.label || e.action,
        formatDetails(e.details),
        e.performedBy || 'Admin',
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-600 mt-1">Full history of all admin actions</p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition-colors">
              <FileDown size={15} /> Export CSV
            </button>
          )}
          {entries.length > 0 && (
            <button onClick={clearLog}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 px-3 py-2 rounded-lg transition-colors">
              <Trash2 size={15} /> Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by action, vendor, or details..."
              value={searchTerm} onChange={e => setSearchTermAndReset(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilterAndReset(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
            <option value="all">All Actions</option>
            {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Date range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFromAndReset(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => setDateToAndReset(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFromAndReset(''); setDateToAndReset(''); }} className="text-blue-600 hover:text-blue-800 text-xs underline">Clear</button>
          )}
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {entries.length === 0 ? 'No audit entries yet — actions will appear here.' : 'No entries match your filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700 whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Action</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Details</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedEntries.map(entry => {
                  const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
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
                      <td className="px-6 py-4 text-sm text-gray-500">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
              .map((p, idx) => p === '...' ? (
                <span key={`e${idx}`} className="px-2">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogView;
