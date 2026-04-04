import React from 'react';
import { X } from 'lucide-react';
import { formatDate, getBusinessTypeLabel } from '../utils/vendorUtils';

const VendorDetailModal = ({ vendor, onClose }) => {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Vendor Details</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Vendor Code</p>
            <p className="text-xl font-mono font-bold text-blue-600">{vendor.id}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Company Name</p>
              <p className="text-gray-900">{vendor.companyName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Business Type</p>
              <p className="text-gray-900">{getBusinessTypeLabel(vendor.businessType)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Representative</p>
              <p className="text-gray-900">{vendor.firstName} {vendor.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
              <p className="text-gray-900">{vendor.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Phone</p>
              <p className="text-gray-900">{vendor.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Website</p>
              {vendor.website ? (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {vendor.website}
                </a>
              ) : (
                <p className="text-gray-900">N/A</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
            <p className="text-gray-900">
              {vendor.streetAddress}
              {vendor.streetAddress2 && <>, {vendor.streetAddress2}</>}
              <br />
              {vendor.city}{vendor.region && `, ${vendor.region}`}
              {vendor.postalCode && ` ${vendor.postalCode}`}
              <br />
              {vendor.country}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Products/Services</p>
            <p className="text-gray-900">{vendor.productsServices}</p>
          </div>

          {vendor.companyInfo && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Company Information</p>
              <p className="text-gray-900">{vendor.companyInfo}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Registered: {formatDate(vendor.submittedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetailModal;
