import React from 'react';
import { Users, Bell, Package } from 'lucide-react';
import { getStats, formatDate, getBusinessTypeLabel } from '../utils/vendorUtils';

const DashboardView = ({ vendors }) => {
  const stats = getStats(vendors);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Onction's vendor management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Users className="w-6 h-6 text-blue-600" />
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
              <Users className="w-6 h-6 text-green-600" />
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
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Manufacturers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.manufacturers}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Distributors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.distributors}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vendors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Vendors</h2>
        </div>
        <div className="p-6">
          {vendors.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No vendors registered yet</p>
          ) : (
            <div className="space-y-4">
              {vendors.slice(0, 5).map((vendor) => (
                <div 
                  key={vendor.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {vendor.companyName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{vendor.companyName}</p>
                      <p className="text-sm text-gray-600">{vendor.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getBusinessTypeLabel(vendor.businessType)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(vendor.submittedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
