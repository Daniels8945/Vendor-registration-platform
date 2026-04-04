import React, { useState } from 'react';
import { LogIn, Building2 } from 'lucide-react';

const VendorLogin = ({ onLogin }) => {
  const [vendorCode, setVendorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate vendor code format
    if (!vendorCode.match(/^OSL-\d{4}-[A-Z]{3}-\d{4}$/)) {
      setError('Invalid vendor code format. Expected format: OSL-2026-ABC-1234');
      setLoading(false);
      return;
    }

    // Check if vendor exists
    try {
      let vendor;
      if (window.storage) {
        const result = await window.storage.get(`vendor:${vendorCode}`, false);
        vendor = result ? JSON.parse(result.value) : null;
      } else {
        const data = localStorage.getItem(`vendor:${vendorCode}`);
        vendor = data ? JSON.parse(data) : null;
      }

      if (vendor) {
        onLogin(vendor);
      } else {
        setError('Vendor code not found. Please check your code or contact Onction.');
      }
    } catch (err) {
      setError('Error logging in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Portal</h1>
          <p className="text-gray-600">Onction Service Limited</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vendor Code
            </label>
            <input
              type="text"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
              placeholder="OSL-2026-ABC-1234"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter your unique vendor code provided by Onction
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Access Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Don't have a vendor code?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register as a vendor
            </a>
          </p>
          <p className="text-xs text-gray-500 text-center mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:vendors@onction.com" className="text-blue-600">
              vendors@onction.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorLogin;
