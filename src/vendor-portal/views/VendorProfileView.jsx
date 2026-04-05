import React, { useState } from 'react';
import { User, Save, X, CheckCircle, Clock, XCircle, AlertTriangle, Edit } from 'lucide-react';
import { updateVendorProfile } from '../utils/vendorUtils';

const STATUS_CONFIG = {
  Approved:       { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  'Pending Review': { icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  Rejected:       { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50 border-red-200'   },
  Inactive:       { icon: AlertTriangle, color: 'text-gray-600',  bg: 'bg-gray-50 border-gray-200' },
};

const EDITABLE_FIELDS = [
  { group: 'Contact Person', fields: [
    { name: 'firstName', label: 'First Name', required: true },
    { name: 'lastName',  label: 'Last Name',  required: true },
  ]},
  { group: 'Contact Details', fields: [
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'phone', label: 'Phone Number', type: 'tel' },
  ]},
  { group: 'Address', fields: [
    { name: 'streetAddress',  label: 'Street Address', required: true, colSpan: 2 },
    { name: 'streetAddress2', label: 'Street Address 2 (optional)' },
    { name: 'city',           label: 'City',   required: true },
    { name: 'region',         label: 'State / Region' },
    { name: 'postalCode',     label: 'Postal Code' },
    { name: 'country',        label: 'Country' },
  ]},
];

const VendorProfileView = ({ vendor, onVendorUpdated, onShowToast }) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName:      vendor.firstName      || '',
    lastName:       vendor.lastName       || '',
    email:          vendor.email          || '',
    phone:          vendor.phone          || '',
    streetAddress:  vendor.streetAddress  || '',
    streetAddress2: vendor.streetAddress2 || '',
    city:           vendor.city           || '',
    region:         vendor.region         || '',
    postalCode:     vendor.postalCode     || '',
    country:        vendor.country        || '',
  });

  const statusCfg = STATUS_CONFIG[vendor.status] || STATUS_CONFIG['Pending Review'];
  const StatusIcon = statusCfg.icon;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setFormData({
      firstName:      vendor.firstName      || '',
      lastName:       vendor.lastName       || '',
      email:          vendor.email          || '',
      phone:          vendor.phone          || '',
      streetAddress:  vendor.streetAddress  || '',
      streetAddress2: vendor.streetAddress2 || '',
      city:           vendor.city           || '',
      region:         vendor.region         || '',
      postalCode:     vendor.postalCode     || '',
      country:        vendor.country        || '',
    });
    setEditMode(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateVendorProfile(vendor.id, formData);
    setSaving(false);
    if (result.success) {
      if (onVendorUpdated) onVendorUpdated(result.vendor);
      if (onShowToast) onShowToast('Profile updated successfully', 'success');
      setEditMode(false);
    } else {
      if (onShowToast) onShowToast('Failed to update profile. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and update your vendor information</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={16} /> Edit Profile
          </button>
        )}
      </div>

      {/* Status card */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusCfg.bg}`}>
        <StatusIcon className={`w-6 h-6 ${statusCfg.color} shrink-0`} />
        <div>
          <p className="text-sm font-semibold text-gray-800">Account Status: {vendor.status}</p>
          {vendor.status === 'Rejected' && vendor.rejectionReason && (
            <p className="text-sm text-red-700 mt-0.5">
              <span className="font-semibold">Reason:</span> {vendor.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Read-only identity fields */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Business Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</label>
            <p className="text-gray-900 mt-1 font-medium">{vendor.companyName}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor Code</label>
            <p className="text-gray-900 mt-1 font-mono">{vendor.id}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Type</label>
            <p className="text-gray-900 mt-1 capitalize">{(vendor.businessType || '').replace('-', ' ')}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</label>
            <p className="text-gray-900 mt-1">{vendor.submittedAt ? new Date(vendor.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <form onSubmit={handleSave}>
        <div className="space-y-6">
          {EDITABLE_FIELDS.map(({ group, fields }) => (
            <div key={group} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4">{group}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(({ name, label, type, required, colSpan }) => (
                  <div key={name} className={colSpan === 2 ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {label}{required && editMode && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {editMode ? (
                      <input
                        type={type || 'text'}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        required={required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{formData[name] || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {editMode && (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
                <X size={16} /> Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default VendorProfileView;
