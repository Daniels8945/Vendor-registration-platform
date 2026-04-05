import React, { useState } from 'react';
import { ArrowLeft, Building2, CheckCircle, Loader2, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { registerVendor } from '../../lib/api.js';

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa',
  'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'India', 'China', 'Brazil', 'Other',
];

const EMPTY_FORM = {
  companyName: '', businessType: 'manufacturer', productsServices: '',
  website: '', streetAddress: '', streetAddress2: '', city: '', region: '',
  postalCode: '', country: '', companyInfo: '',
  firstName: '', lastName: '', email: '', phone: '',
  password: '', confirmPassword: '',
};

const VendorRegisterForm = ({ onBack }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const { confirmPassword: _confirmPassword, ...submitData } = form;
      const vendor = await registerVendor(submitData);
      setSuccessCode(vendor.id);
    } catch (err) {
      const field = err.data?.field;
      if (field) {
        setErrors({ [field]: err.message });
      } else {
        setErrors({ _form: err.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successCode) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application is <span className="font-semibold text-yellow-700">Pending Review</span>.
            An admin will review and approve your account shortly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-blue-700 mb-1">Your Vendor Code</p>
            <p className="text-2xl font-mono font-bold text-blue-800 tracking-widest">{successCode}</p>
            <p className="text-xs text-blue-600 mt-2">
              Save this code — you will use it along with your password to log in.
            </p>
          </div>

          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
            <Mail className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              A confirmation with your vendor code has been sent to{' '}
              <span className="font-semibold">{form.email}</span>.
              Please check your inbox.
            </p>
          </div>

          <button onClick={onBack} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-y-auto">
    <div className="min-h-full py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6">
            <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft size={16} /> Back to Login
            </button>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-full">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Vendor Registration</h1>
                <p className="text-blue-200 text-sm">Create your vendor account</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {errors._form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{errors._form}</p>
              </div>
            )}

            {/* Company Legal Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Legal Name <span className="text-red-500">*</span></label>
              <input type="text" name="companyName" required value={form.companyName} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.companyName && <p className="flex items-center gap-1 text-sm text-red-600 mt-1"><AlertCircle size={13} /> {errors.companyName}</p>}
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
              <div className="flex flex-wrap gap-4">
                {[{ value: 'manufacturer', label: 'Manufacturer' }, { value: 'distributor', label: 'Distributor' }, { value: 'service-provider', label: 'Service Provider' }].map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="businessType" value={value} checked={form.businessType === value} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700 text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Products / Services */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Products / Services <span className="text-red-500">*</span></label>
              <textarea name="productsServices" required value={form.productsServices} onChange={handleChange} rows={3}
                placeholder="Describe the products or services your company offers..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400" />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Website <span className="text-red-500">*</span></label>
              <input type="url" name="website" required value={form.website} onChange={handleChange} placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company Address <span className="text-red-500">*</span></label>
              <div className="space-y-3">
                <input type="text" name="streetAddress" required value={form.streetAddress} onChange={handleChange} placeholder="Street Address"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                <input type="text" name="streetAddress2" value={form.streetAddress2} onChange={handleChange} placeholder="Street Address Line 2 (optional)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="city" required value={form.city} onChange={handleChange} placeholder="City"
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                  <input type="text" name="region" value={form.region} onChange={handleChange} placeholder="State / Region"
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Postal / Zip Code"
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                  <select name="country" required value={form.country} onChange={handleChange}
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Company Information <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea name="companyInfo" value={form.companyInfo} onChange={handleChange} rows={3}
                placeholder="Year of incorporation, company size, major contracts handled..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400" />
            </div>

            {/* Representative */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Representative Name <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="First Name"
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                <input type="text" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Last Name"
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email <span className="text-red-500">*</span></label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.email && <p className="flex items-center gap-1 text-sm text-red-600 mt-1"><AlertCircle size={13} /> {errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+234 000 000 0000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
            </div>

            {/* Password */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Set Your Password</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" required value={form.password} onChange={handleChange} placeholder="Min. 8 characters"
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-200'}`} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="flex items-center gap-1 text-sm text-red-600 mt-1"><AlertCircle size={13} /> {errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`} />
                  {errors.confirmPassword && <p className="flex items-center gap-1 text-sm text-red-600 mt-1"><AlertCircle size={13} /> {errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                {submitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : 'Submit Registration'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Your application will be reviewed by our team. You'll receive your vendor code upon submission.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default VendorRegisterForm;
