import React, { useState } from 'react';
import { COUNTRIES } from '../utils/constants';
import { AlertCircle, Eye, EyeOff, Copy, RefreshCw, Check } from 'lucide-react';

function generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#!$';
  const rand = (s) => s[Math.floor(Math.random() * s.length)];
  // Guarantee at least one of each character class
  const required = [rand(upper), rand(lower), rand(digits), rand(special)];
  const all = upper + lower + digits + special;
  const rest = Array.from({ length: 6 }, () => rand(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join('');
}

const AddVendorView = ({ formData, onChange, onSubmit, onCancel, vendors = [] }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const duplicateName = formData.companyName.trim().length > 2 &&
    vendors.find(v => v.companyName.trim().toLowerCase() === formData.companyName.trim().toLowerCase());
  const duplicateEmail = formData.email.trim().length > 4 &&
    vendors.find(v => v.email.trim().toLowerCase() === formData.email.trim().toLowerCase());

  const handleGenerate = () => {
    onChange({ target: { name: 'password', value: generatePassword() } });
    setShowPassword(true);
  };

  const handleCopy = () => {
    if (!formData.password) return;
    navigator.clipboard.writeText(formData.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
            className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${duplicateName ? 'border-orange-400' : 'border-gray-200'}`}
          />
          {duplicateName && (
            <p className="flex items-center gap-1 text-sm text-orange-600 mt-1">
              <AlertCircle size={14} /> A vendor with this name already exists ({duplicateName.id}).
            </p>
          )}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">Business Type</label>
          <div className="flex flex-wrap gap-4">
            {['manufacturer', 'distributor', 'service-provider'].map(type => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  value={type}
                  checked={formData.businessType === type}
                  onChange={onChange}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-gray-700 capitalize">{type.replace('-', ' ')}</span>
              </label>
            ))}
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
          <label className="block text-gray-900 font-semibold mb-2">Company Website</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={onChange}
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>

        {/* Address Fields */}
        <div>
          <label className="block text-gray-900 font-semibold mb-2">
            Company Address
          </label>
          <div className="space-y-3">
            <input
              type="text"
              name="streetAddress"
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
                placeholder="Region / State"
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
            className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${duplicateEmail ? 'border-orange-400' : 'border-gray-200'}`}
          />
          {duplicateEmail && (
            <p className="flex items-center gap-1 text-sm text-orange-600 mt-1">
              <AlertCircle size={14} /> A vendor with this email already exists ({duplicateEmail.id}).
            </p>
          )}
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

        {/* Password */}
        <div>
          <label className="block text-gray-900 font-semibold mb-1">
            Portal Password<span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Set a password the vendor will use to log in. Share it with them securely after registration.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={onChange}
                placeholder="Enter or generate a password"
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono placeholder-gray-400 placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              title="Generate a random password"
              className="flex items-center gap-1.5 px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <RefreshCw size={15} /> Generate
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!formData.password}
              title="Copy password to clipboard"
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'}`}
            >
              {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
            </button>
          </div>
          {formData.password && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> Remember to copy and share this password with the vendor before leaving this page.
            </p>
          )}
        </div>

        {/* Initial Status */}
        <div>
          <label className="block text-gray-900 font-semibold mb-1">Initial Status</label>
          <p className="text-xs text-gray-500 mb-2">
            Set to <strong>Approved</strong> to grant the vendor immediate portal access, or <strong>Pending Review</strong> if further vetting is needed.
          </p>
          <select
            name="status"
            value={formData.status}
            onChange={onChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Approved">Approved — Vendor can log in immediately</option>
            <option value="Pending Review">Pending Review — Requires admin approval first</option>
            <option value="Inactive">Inactive — Account created but portal access disabled</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-2">
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
