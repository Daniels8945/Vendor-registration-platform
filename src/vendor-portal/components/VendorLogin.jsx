import React, { useState } from 'react';
import { LogIn, Building2, Eye, EyeOff, Mail } from 'lucide-react';
import VendorRegisterForm from './VendorRegisterForm';
import { vendorLogin, vendorForgotPassword } from '../../lib/api.js';

const VendorLogin = ({ onLogin }) => {
  const [view, setView] = useState('login');
  const [vendorCode, setVendorCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await vendorLogin(vendorCode.toUpperCase(), password || undefined);
      onLogin(data.vendor);
    } catch (err) {
      if (err.status === 403) {
        const reason = err.data?.rejectionReason
          ? `Reason: ${err.data.rejectionReason}`
          : 'Please contact support for more information.';
        setError(`Your vendor application was not approved. ${reason}`);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await vendorForgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'register') {
    return <VendorRegisterForm onBack={() => setView('login')} />;
  }

  if (view === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600 text-sm">Enter the email address on your vendor account and we'll send a reset link.</p>
          </div>

          {forgotSent ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 text-sm font-medium">Check your inbox</p>
              <p className="text-green-700 text-sm mt-1">If that email is registered, a reset link has been sent.</p>
              <button onClick={() => { setView('login'); setForgotSent(false); setForgotEmail(''); }} className="mt-4 text-blue-600 hover:underline text-sm">
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading || !forgotEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full text-sm text-gray-500 hover:text-gray-700 py-1">
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Portal</h1>
          <p className="text-gray-600">Sign in to your vendor account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor Code</label>
            <input
              type="text"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
              placeholder="OSL-2026-ABC-1234"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center text-lg"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <button
              onClick={() => setView('register')}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline underline-offset-2"
            >
              Register as a vendor
            </button>
          </p>
          <p className="text-xs text-gray-500 text-center">
            Need help?{' '}
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
