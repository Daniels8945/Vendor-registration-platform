import React, { useState } from 'react';
import { UserPlus, Search, Filter, Check, X, Ban } from 'lucide-react';
import { getBusinessTypeLabel } from '../utils/vendorUtils';
import { STATUS_COLORS, VENDOR_STATUSES } from '../utils/constants';

const VendorsView = ({ 
  vendors, 
  loading, 
  onAddVendor, 
  onViewVendor, 
  onDeleteVendor,
  onUpdateStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const colors = STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor List</h1>
          <p className="text-gray-600 mt-1">Manage all registered vendors</p>
        </div>
        <button
          onClick={onAddVendor}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} />
          Add Vendor
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company name, vendor code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value={VENDOR_STATUSES.PENDING}>Pending Review</option>
              <option value={VENDOR_STATUSES.APPROVED}>Approved</option>
              <option value={VENDOR_STATUSES.REJECTED}>Rejected</option>
              <option value={VENDOR_STATUSES.INACTIVE}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' ? `No vendors with status "${statusFilter}"` : 'No vendors found'}
            </p>
            <button
              onClick={onAddVendor}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Add your first vendor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Vendor Code</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Company Name</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Contact person</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {vendor.id}
                      </span>
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
                    <td className="px-6 py-4 text-gray-700">
                      {vendor.firstName} {vendor.lastName}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(vendor.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Actions - Only show if pending */}
                        {vendor.status === VENDOR_STATUSES.PENDING && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(vendor.id, VENDOR_STATUSES.APPROVED)}
                              className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => onUpdateStatus(vendor.id, VENDOR_STATUSES.REJECTED)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        
                        {/* If approved, can set to inactive */}
                        {vendor.status === VENDOR_STATUSES.APPROVED && (
                          <button
                            onClick={() => onUpdateStatus(vendor.id, VENDOR_STATUSES.INACTIVE)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                            title="Set Inactive"
                          >
                            <Ban size={18} />
                          </button>
                        )}

                        {/* If rejected or inactive, can set back to pending */}
                        {(vendor.status === VENDOR_STATUSES.REJECTED || vendor.status === VENDOR_STATUSES.INACTIVE) && (
                          <button
                            onClick={() => onUpdateStatus(vendor.id, VENDOR_STATUSES.PENDING)}
                            className="text-yellow-600 hover:text-yellow-800 text-xs font-medium border border-yellow-600 hover:border-yellow-800 px-2 py-1 rounded transition-colors"
                          >
                            Review
                          </button>
                        )}
                        
                        {/* View and Delete always available */}
                        <button
                          onClick={() => onViewVendor(vendor)}
                          className="text-blue-600 hover:text-blue-800 font-medium border border-blue-600 hover:border-blue-800 px-3 py-1 rounded transition-colors text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onDeleteVendor(vendor)}
                          className="text-red-600 hover:text-red-800 font-medium border border-red-600 hover:border-red-800 px-3 py-1 rounded transition-colors text-sm"
                        >
                          Delete
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
    </div>
  );
};

export default VendorsView;
