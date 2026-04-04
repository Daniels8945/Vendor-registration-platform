import React from 'react';
import { COUNTRIES } from '../utils/constants';

const AddVendorView = ({ formData, onChange, onSubmit, onCancel }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Vendor</h1>
        <p className="text-gray-600 mt-1">Register a new vendor in the system</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        {/* Company Legal Name */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Company Legal Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            required
            value={formData.companyName}
            onChange={onChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Business Type</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="businessType"
                value="manufacturer"
                checked={formData.businessType === 'manufacturer'}
                onChange={onChange}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Manufacturer</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="businessType"
                value="distributor"
                checked={formData.businessType === 'distributor'}
                onChange={onChange}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Distributor</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="businessType"
                value="service-provider"
                checked={formData.businessType === 'service-provider'}
                onChange={onChange}
                className="w-4 h-4 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Service Provider</span>
            </label>
          </div>
        </div>

        {/* Products/Services */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Products/Services<span className="text-red-500">*</span>
          </label>
          <textarea
            name="productsServices"
            required
            value={formData.productsServices}
            onChange={onChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Company Website */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Company Website<span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="website"
            required
            value={formData.website}
            onChange={onChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address Fields */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Company Address<span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <input
              type="text"
              name="streetAddress"
              required
              value={formData.streetAddress}
              onChange={onChange}
              placeholder="Street Address"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            <input
              type="text"
              name="streetAddress2"
              value={formData.streetAddress2}
              onChange={onChange}
              placeholder="Street Address Line 2"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={onChange}
                placeholder="City"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={onChange}
                placeholder="Region"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={onChange}
                placeholder="Postal / Zip Code"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
              <select
                name="country"
                required
                value={formData.country}
                onChange={onChange}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Company Information</label>
          <textarea
            name="companyInfo"
            value={formData.companyInfo}
            onChange={onChange}
            rows={3}
            placeholder="Year of incorporation, company size, major contracts handled..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
          />
        </div>

        {/* Representative Name */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Representative Name<span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={onChange}
              placeholder="First Name"
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={onChange}
              placeholder="Last Name"
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Contact Email<span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={onChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Contact Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="+234 000 000 0000"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Register Vendor
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVendorView;
