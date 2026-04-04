import React, { useState, useEffect } from 'react';

const VendorRegistrationForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: 'manufacturer',
    productsServices: '',
    website: '',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    companyInfo: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const [showForm, setShowForm] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [latestVendorCode, setLatestVendorCode] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
      // Try window.storage first, fallback to localStorage
      if (window.storage) {
        const result = await window.storage.list('vendor:', false);
        if (result && result.keys) {
          const vendorData = await Promise.all(
            result.keys.map(async (key) => {
              try {
                const data = await window.storage.get(key, false);
                return data ? JSON.parse(data.value) : null;
              } catch {
                return null;
              }
            })
          );
          setVendors(vendorData.filter(v => v !== null).sort((a, b) => 
            new Date(b.submittedAt) - new Date(a.submittedAt)
          ));
        }
      } else {
        // Fallback to localStorage
        const keys = Object.keys(localStorage).filter(key => key.startsWith('vendor:'));
        const vendorData = keys.map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch {
            return null;
          }
        });
        setVendors(vendorData.filter(v => v !== null).sort((a, b) => 
          new Date(b.submittedAt) - new Date(a.submittedAt)
        ));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVendorCode = (businessType) => {
    const typeCode = {
      'manufacturer': 'OSL',
      'distributor': 'OSL',
      'service-provider': 'OSL'
    }[businessType] || 'OSL';

    const year = new Date().getFullYear();
    const randomLetters = Array.from({ length: 3 }, () => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    const randomNumbers = String(Math.floor(1000 + Math.random() * 9000));
    
    return `${typeCode}-${year}-${randomLetters}-${randomNumbers}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const code = generateVendorCode(formData.businessType);
    const vendorData = {
      id: code,
      ...formData,
      status: 'Pending Review',
      submittedAt: new Date().toISOString()
    };

    try {
      // Try window.storage first, fallback to localStorage
      if (window.storage) {
        await window.storage.set(`vendor:${code}`, JSON.stringify(vendorData), false);
      } else {
        // Fallback to localStorage
        localStorage.setItem(`vendor:${code}`, JSON.stringify(vendorData));
      }
      
      setLatestVendorCode(code);
      setJustSubmitted(true);
      
      // Reset form
      setFormData({
        companyName: '',
        businessType: 'manufacturer',
        productsServices: '',
        website: '',
        streetAddress: '',
        streetAddress2: '',
        city: '',
        region: '',
        postalCode: '',
        country: '',
        companyInfo: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      });
      
      // Reload vendors and show table
      await loadVendors();
      setShowForm(false);
      
      // Reset success banner after 5 seconds
      setTimeout(() => {
        setJustSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error saving vendor:', error);
      showToast('Failed to register vendor. Please try again.', 'error');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  const getBusinessTypeLabel = (type) => {
    return {
      'manufacturer': 'Manufacturer',
      'distributor': 'Distributor',
      'service-provider': 'Service Provider'
    }[type] || type;
  };

  const confirmDelete = (vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!vendorToDelete) return;
    
    try {
      // Try window.storage first, fallback to localStorage
      if (window.storage) {
        await window.storage.delete(`vendor:${vendorToDelete.id}`, false);
      } else {
        // Fallback to localStorage
        localStorage.removeItem(`vendor:${vendorToDelete.id}`);
      }
      
      // Reload vendors
      await loadVendors();
      showToast('Vendor deleted successfully', 'success');
      setShowDeleteModal(false);
      setVendorToDelete(null);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showToast('Failed to delete vendor. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-out transform">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' 
              ? 'bg-green-50 border-l-4 border-green-500' 
              : 'bg-red-50 border-l-4 border-red-500'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className={`ml-auto ${
                toast.type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Vendor Details</h3>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Vendor Code</p>
                <p className="text-xl font-mono font-bold text-blue-600">{selectedVendor.id}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Company Name</p>
                  <p className="text-gray-900">{selectedVendor.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Business Type</p>
                  <p className="text-gray-900">{getBusinessTypeLabel(selectedVendor.businessType)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Representative</p>
                  <p className="text-gray-900">{selectedVendor.firstName} {selectedVendor.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900">{selectedVendor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Phone</p>
                  <p className="text-gray-900">{selectedVendor.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Website</p>
                  <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedVendor.website}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                <p className="text-gray-900">
                  {selectedVendor.streetAddress}
                  {selectedVendor.streetAddress2 && <>, {selectedVendor.streetAddress2}</>}
                  <br />
                  {selectedVendor.city}{selectedVendor.region && `, ${selectedVendor.region}`}
                  {selectedVendor.postalCode && ` ${selectedVendor.postalCode}`}
                  <br />
                  {selectedVendor.country}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Products/Services</p>
                <p className="text-gray-900">{selectedVendor.productsServices}</p>
              </div>

              {selectedVendor.companyInfo && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Company Information</p>
                  <p className="text-gray-900">{selectedVendor.companyInfo}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Registered: {formatDate(selectedVendor.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && vendorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Vendor</h3>
              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to delete vendor <span className="font-mono font-semibold">{vendorToDelete.id}</span>?
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVendorToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topographic" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10 10c0 20 10 30 20 30s20-10 20-30-10-30-20-30-20 10-20 30z" 
                    fill="none" stroke="currentColor" strokeWidth="0.5"/>
              <path d="M30 30c0 15 7 22 15 22s15-7 15-22-7-22-15-22-15 7-15 22z" 
                    fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topographic)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Success Banner */}
        {justSubmitted && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Registration successful! Vendor code: <span className="font-mono font-bold">{latestVendorCode}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-white text-gray-700 font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200"
          >
            {showForm ? 'View All Vendors' : 'Register New Vendor'}
          </button>
        </div>

        {showForm ? (
          <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vendor Registration Form
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Thank you for your interest in becoming a vendor for us.
          </p>
          <p className="text-gray-600 leading-relaxed">
            If you wish to sign up, please fill out this online
          </p>
          <p className="text-gray-600 leading-relaxed">
            Vendor Registration Form.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          {/* Company Legal Name */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Your company's legal name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Business type
            </label>
            <div className="flex flex-wrap gap-6 bg-gray-50 px-4 py-4 rounded-lg border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  value="manufacturer"
                  checked={formData.businessType === 'manufacturer'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Manufacturer</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  value="distributor"
                  checked={formData.businessType === 'distributor'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Distributor</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="businessType"
                  value="service-provider"
                  checked={formData.businessType === 'service-provider'}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Service provider</span>
              </label>
            </div>
          </div>

          {/* Products/Services */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              What kind of products / services does your company offer?<span className="text-red-500">*</span>
            </label>
            <textarea
              name="productsServices"
              required
              value={formData.productsServices}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Company Website */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Company website<span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="website"
              required
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Company Address */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Company address<span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <input
                type="text"
                name="streetAddress"
                required
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="Street Address"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              />
              <input
                type="text"
                name="streetAddress2"
                value={formData.streetAddress2}
                onChange={handleChange}
                placeholder="Street Address Line 2"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                />
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="Region"
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Postal / Zip Code"
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                />
                <select
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                >
                  <option value="">Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Please provide the following information: Year of incorporation, company size, major contracts handled
            </label>
            <textarea
              name="companyInfo"
              value={formData.companyInfo}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Representative Name */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Name of person representing the company<span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              />
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last"
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Contact email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-gray-900 font-semibold mb-3">
              Contact phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="##########"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            Register Vendor
          </button>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 pt-4">
            Never submit sensitive information such as passwords. <a href="#" className="text-blue-600 hover:underline">Report abuse</a>
          </p>
        </form>
          </div>
        ) : (
          /* Vendors Table */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Recent Shipments</h2>
              <p className="text-gray-600 mt-1">Registered vendors and their tracking information</p>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading vendors...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 mb-4">No vendors registered yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Register your first vendor
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Tracking</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Destination</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Updated</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{vendor.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">{vendor.status}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">
                            {vendor.city && vendor.region 
                              ? `${vendor.city}, ${vendor.region}` 
                              : vendor.city || vendor.streetAddress || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">{formatDate(vendor.submittedAt)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedVendor(vendor)}
                              className="text-blue-600 hover:text-blue-800 font-medium border border-blue-600 hover:border-blue-800 px-4 py-1 rounded transition-colors"
                            >
                              Open
                            </button>
                            <button
                              onClick={() => confirmDelete(vendor)}
                              className="text-red-600 hover:text-red-800 font-medium border border-red-600 hover:border-red-800 px-4 py-1 rounded transition-colors"
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
        )}
      </div>
    </div>
  );
};

export default VendorRegistrationForm;
