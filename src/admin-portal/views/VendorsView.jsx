import React, { useState, useRef } from 'react';
import { UserPlus, Search, Filter, Check, X, Ban, MoreVertical, Eye, Trash2, UserCircle, FileDown, Upload, AlertCircle, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown, Copy } from 'lucide-react';
import { getBusinessTypeLabel, exportToCSV, generateVendorCode, saveVendor, logAudit } from '../utils/vendorUtils';
import { STATUS_COLORS, VENDOR_STATUSES } from '../utils/constants';

const PAGE_SIZE = 20;

const VendorsView = ({
  vendors,
  loading,
  onAddVendor,
  onViewVendor,
  onViewProfile,
  onDeleteVendor,
  onUpdateStatus,
  onImportVendors,
  userRole = 'Super Admin',
}) => {
  const isViewer = userRole === 'Viewer';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [copiedId, setCopiedId] = useState(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkRejectModal, setBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesType = typeFilter === 'all' || vendor.businessType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = sortField === 'name' ? a.companyName : sortField === 'status' ? a.status : sortField === 'type' ? a.businessType : sortField === 'date' ? a.submittedAt : '';
    let bVal = sortField === 'name' ? b.companyName : sortField === 'status' ? b.status : sortField === 'type' ? b.businessType : sortField === 'date' ? b.submittedAt : '';
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown size={13} className="text-gray-400 inline ml-1" />;
    return sortDir === 'asc' ? <ChevronUp size={13} className="text-blue-600 inline ml-1" /> : <ChevronDown size={13} className="text-blue-600 inline ml-1" />;
  };

  const totalPages = Math.ceil(sortedVendors.length / PAGE_SIZE);
  const pagedVendors = sortedVendors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected = pagedVendors.length > 0 && pagedVendors.every(v => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); pagedVendors.forEach(v => n.delete(v.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); pagedVendors.forEach(v => n.add(v.id)); return n; });
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkAction = async (action, reason = '') => {
    const targets = sortedVendors.filter(v => selectedIds.has(v.id));
    for (const vendor of targets) {
      if (action === 'delete') {
        onDeleteVendor(vendor);
      } else {
        await onUpdateStatus(vendor.id, action, reason);
      }
    }
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => setBulkDeleteConfirm(true);
  const handleBulkDeleteConfirm = () => { bulkAction('delete'); setBulkDeleteConfirm(false); };
  const handleBulkRejectOpen = () => { setBulkRejectReason(''); setBulkRejectModal(true); };
  const handleBulkRejectConfirm = () => { bulkAction(VENDOR_STATUSES.REJECTED, bulkRejectReason); setBulkRejectModal(false); setBulkRejectReason(''); };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const getStatusBadge = (status) => {
    const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const handleOpenDropdown = (e, vendorId) => {
    if (openDropdown === vendorId) { setOpenDropdown(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 180;
    const top = rect.bottom + DROPDOWN_HEIGHT > window.innerHeight
      ? rect.top - DROPDOWN_HEIGHT
      : rect.bottom + 4;
    setDropdownPosition({ top, right: window.innerWidth - rect.right });
    setOpenDropdown(vendorId);
  };

  const handleExportCSV = () => {
    exportToCSV(
      `vendors-${new Date().toISOString().split('T')[0]}.csv`,
      ['Vendor Code', 'Company Name', 'Business Type', 'Email', 'Phone', 'Country', 'Status', 'Registered'],
      filteredVendors.map(v => [
        v.id, v.companyName, getBusinessTypeLabel(v.businessType),
        v.email, v.phone || '', v.country || '', v.status, v.submittedAt,
      ])
    );
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const [header, ...rows] = lines;
      const headers = header.split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('company'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('business'));
      if (nameIdx === -1 || emailIdx === -1) {
        setImportError('CSV must have "Company Name" and "Email" columns.');
        return;
      }
      let imported = 0;
      for (const row of rows) {
        const cols = row.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        const companyName = cols[nameIdx];
        const email = cols[emailIdx];
        if (!companyName || !email) continue;
        const duplicate = vendors.find(v =>
          v.companyName.toLowerCase() === companyName.toLowerCase() ||
          v.email.toLowerCase() === email.toLowerCase()
        );
        if (duplicate) continue;
        const rawType = typeIdx !== -1 ? cols[typeIdx].toLowerCase() : '';
        const businessType = rawType.includes('dist') ? 'distributor' : rawType.includes('service') ? 'service-provider' : 'manufacturer';
        const code = generateVendorCode(businessType);
        await saveVendor({
          id: code, companyName, email, businessType,
          firstName: '', lastName: '', phone: '', website: '', streetAddress: '',
          streetAddress2: '', city: '', region: '', postalCode: '',
          country: cols[headers.findIndex(h => h.includes('country'))] || '',
          productsServices: '', companyInfo: '',
          status: VENDOR_STATUSES.PENDING,
          submittedAt: new Date().toISOString(),
        });
        logAudit('vendor_created', { vendorId: code, companyName });
        imported++;
      }
      if (onImportVendors) onImportVendors();
      setImportError(imported > 0 ? '' : 'No new vendors imported (duplicates skipped or empty rows).');
      if (imported > 0) fileInputRef.current.value = '';
    } catch {
      setImportError('Failed to parse CSV. Please check the file format.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor List</h1>
          <p className="text-gray-600 mt-1">Manage all registered vendors</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors">
            <FileDown size={16} /> Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors">
            <Upload size={16} /> Import CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <button onClick={onAddVendor}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm">
            <UserPlus size={18} /> Add Vendor
          </button>
        </div>
      </div>

      {importError && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-orange-800">
          <AlertCircle size={16} className="shrink-0" /> {importError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by company name, vendor code, or email..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm">
              <option value="all">All Status</option>
              <option value={VENDOR_STATUSES.PENDING}>Pending Review</option>
              <option value={VENDOR_STATUSES.APPROVED}>Approved</option>
              <option value={VENDOR_STATUSES.REJECTED}>Rejected</option>
              <option value={VENDOR_STATUSES.INACTIVE}>Inactive</option>
            </select>
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
            <option value="all">All Types</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="distributor">Distributor</option>
            <option value="service-provider">Service Provider</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && !isViewer && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.size} vendor{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 ml-2 flex-wrap">
            <button onClick={() => bulkAction(VENDOR_STATUSES.APPROVED)}
              className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg">
              <Check size={13} /> Approve All
            </button>
            <button onClick={handleBulkRejectOpen}
              className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg">
              <X size={13} /> Reject All
            </button>
            <button onClick={() => bulkAction(VENDOR_STATUSES.INACTIVE)}
              className="flex items-center gap-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg">
              <Ban size={13} /> Set Inactive
            </button>
            <button onClick={() => bulkAction(VENDOR_STATUSES.PENDING)}
              className="flex items-center gap-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg">
              <Check size={13} /> Set to Review
            </button>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1 text-sm bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
              <Trash2 size={13} /> Delete All
            </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600 mt-4">Loading vendors...</p>
          </div>
        ) : sortedVendors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' || typeFilter !== 'all' ? 'No vendors match your filters' : 'No vendors found'}
            </p>
            <button onClick={onAddVendor} className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              Add your first vendor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">
                    <button onClick={() => toggleSort('date')} className="flex items-center hover:text-blue-600 transition-colors">
                      Vendor Code <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">
                    <button onClick={() => toggleSort('name')} className="flex items-center hover:text-blue-600 transition-colors">
                      Company Name <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">
                    <button onClick={() => toggleSort('type')} className="flex items-center hover:text-blue-600 transition-colors">
                      Type <SortIcon field="type" />
                    </button>
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Contact Person</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">
                    <button onClick={() => toggleSort('status')} className="flex items-center hover:text-blue-600 transition-colors">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedVendors.map(vendor => (
                  <tr key={vendor.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.has(vendor.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.has(vendor.id)} onChange={() => toggleOne(vendor.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleCopyId(vendor.id)}
                        title="Click to copy vendor ID"
                        className="flex items-center gap-1 group"
                      >
                        <span className="font-mono text-sm font-semibold text-blue-600">{vendor.id}</span>
                        {copiedId === vendor.id
                          ? <Check size={12} className="text-green-500 shrink-0" />
                          : <Copy size={12} className="text-gray-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                        }
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{vendor.companyName}</div>
                      <div className="text-xs text-gray-500">{vendor.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBusinessTypeLabel(vendor.businessType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{vendor.firstName} {vendor.lastName}</td>
                    <td className="px-6 py-4">{getStatusBadge(vendor.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button onClick={e => handleOpenDropdown(e, vendor.id)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                          title="Actions">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, sortedVendors.length)} of {sortedVendors.length} vendors</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
              .map((p, idx) => p === '...' ? (
                <span key={`e${idx}`} className="px-2">…</span>
              ) : (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Delete {selectedIds.size} vendor{selectedIds.size > 1 ? 's' : ''}?</h3>
            <p className="text-gray-500 text-center text-sm mb-6">This action cannot be undone. All vendor data will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleBulkDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Rejection Reason Modal */}
      {bulkRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Reject {selectedIds.size} vendor{selectedIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-gray-500 text-center text-sm mb-4">Optionally provide a rejection reason that will be sent to all selected vendors.</p>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Rejection Reason <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={bulkRejectReason}
                  onChange={e => setBulkRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why these vendors are being rejected..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setBulkRejectModal(false); setBulkRejectReason(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={handleBulkRejectConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Reject All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Reject Vendor</h3>
              <p className="text-gray-500 text-center text-sm mb-4">
                Rejecting <span className="font-semibold text-gray-800">{rejectModal.companyName}</span>
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
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => { onUpdateStatus(rejectModal.id, VENDOR_STATUSES.REJECTED, rejectReason); setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                  Reject Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Dropdown */}
      {openDropdown !== null && (() => {
        const vendor = filteredVendors.find(v => v.id === openDropdown);
        if (!vendor) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
            <div className="fixed w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
              style={{ top: dropdownPosition.top, right: dropdownPosition.right }}>
              <button onClick={() => { onViewProfile(vendor); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <UserCircle size={15} /> View Profile
              </button>
              <button onClick={() => { onViewVendor(vendor); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Eye size={15} /> Quick View
              </button>

              {!isViewer && vendor.status === VENDOR_STATUSES.PENDING && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.APPROVED); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                    <Check size={15} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(vendor); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <X size={15} /> Reject
                  </button>
                </>
              )}
              {!isViewer && vendor.status === VENDOR_STATUSES.APPROVED && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.INACTIVE); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2">
                    <Ban size={15} /> Set Inactive
                  </button>
                </>
              )}
              {!isViewer && (vendor.status === VENDOR_STATUSES.REJECTED || vendor.status === VENDOR_STATUSES.INACTIVE) && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.PENDING); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2">
                    <Check size={15} /> Set to Review
                  </button>
                </>
              )}

              {!isViewer && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onDeleteVendor(vendor); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 size={15} /> Delete Vendor
                  </button>
                </>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default VendorsView;
