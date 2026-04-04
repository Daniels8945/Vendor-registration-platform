import React, { useState } from 'react';
import { UserPlus, Search, Filter, Check, X, Ban, MoreVertical, Eye, Trash2, UserCircle } from 'lucide-react';
import { getBusinessTypeLabel } from '../utils/vendorUtils';
import { STATUS_COLORS, VENDOR_STATUSES } from '../utils/constants';

const VendorsView = ({
  vendors,
  loading,
  onAddVendor,
  onViewVendor,
  onViewProfile,
  onDeleteVendor,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allSelected = filteredVendors.length > 0 && filteredVendors.every(v => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map(v => v.id)));
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkAction = async (action) => {
    const targets = filteredVendors.filter(v => selectedIds.has(v.id));
    for (const vendor of targets) {
      if (action === 'delete') {
        onDeleteVendor(vendor);
      } else {
        await onUpdateStatus(vendor.id, action);
      }
    }
    setSelectedIds(new Set());
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
    setDropdownPosition({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
    setOpenDropdown(vendorId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor List</h1>
          <p className="text-gray-600 mt-1">Manage all registered vendors</p>
        </div>
        <button onClick={onAddVendor}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <UserPlus size={20} />
          Add Vendor
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by company name, vendor code, or email..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white">
              <option value="all">All Status</option>
              <option value={VENDOR_STATUSES.PENDING}>Pending Review</option>
              <option value={VENDOR_STATUSES.APPROVED}>Approved</option>
              <option value={VENDOR_STATUSES.REJECTED}>Rejected</option>
              <option value={VENDOR_STATUSES.INACTIVE}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.size} vendor{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2 ml-2 flex-wrap">
            <button onClick={() => bulkAction(VENDOR_STATUSES.APPROVED)}
              className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Check size={14} /> Approve All
            </button>
            <button onClick={() => bulkAction(VENDOR_STATUSES.REJECTED)}
              className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              <X size={14} /> Reject All
            </button>
            <button onClick={() => bulkAction(VENDOR_STATUSES.INACTIVE)}
              className="flex items-center gap-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Ban size={14} /> Set Inactive
            </button>
            <button onClick={() => bulkAction(VENDOR_STATUSES.PENDING)}
              className="flex items-center gap-1 text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition-colors">
              <Check size={14} /> Set to Review
            </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium">
            Clear selection
          </button>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600 mt-4">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' ? `No vendors with status "${statusFilter}"` : 'No vendors found'}
            </p>
            <button onClick={onAddVendor} className="text-blue-600 hover:text-blue-700 font-semibold">
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
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Vendor Code</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Company Name</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Contact Person</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.map(vendor => (
                  <tr key={vendor.id}
                    className={`hover:bg-gray-50 transition-colors ${selectedIds.has(vendor.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.has(vendor.id)} onChange={() => toggleOne(vendor.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-blue-600">{vendor.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{vendor.companyName}</div>
                      <div className="text-sm text-gray-500">{vendor.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getBusinessTypeLabel(vendor.businessType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{vendor.firstName} {vendor.lastName}</td>
                    <td className="px-6 py-4">{getStatusBadge(vendor.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button onClick={e => handleOpenDropdown(e, vendor.id)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                          title="Actions">
                          <MoreVertical size={20} />
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

      {/* Dropdown Menu — fixed position */}
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
                <UserCircle size={16} /> View Profile
              </button>
              <button onClick={() => { onViewVendor(vendor); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Eye size={16} /> Quick View
              </button>

              {vendor.status === VENDOR_STATUSES.PENDING && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.APPROVED); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                    <Check size={16} /> Approve
                  </button>
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.REJECTED); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <X size={16} /> Reject
                  </button>
                </>
              )}
              {vendor.status === VENDOR_STATUSES.APPROVED && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.INACTIVE); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-2">
                    <Ban size={16} /> Set Inactive
                  </button>
                </>
              )}
              {(vendor.status === VENDOR_STATUSES.REJECTED || vendor.status === VENDOR_STATUSES.INACTIVE) && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { onUpdateStatus(vendor.id, VENDOR_STATUSES.PENDING); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center gap-2">
                    <Check size={16} /> Set to Review
                  </button>
                </>
              )}

              <div className="border-t border-gray-200 my-1" />
              <button onClick={() => { onDeleteVendor(vendor); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 size={16} /> Delete Vendor
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default VendorsView;
