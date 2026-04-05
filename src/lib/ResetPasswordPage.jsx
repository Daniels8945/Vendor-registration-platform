import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

/**
 * Shared reset-password page.
 * Works for both vendor (/vendor/reset-password) and admin (/admin/reset-password).
 * Reads `token` from query string.
 */
const ResetPasswordPage = ({ onReset, backPath, portalLabel }) => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <p className="text-red-600 font-medium mb-4">Invalid reset link.</p>
          <button onClick={() => navigate(backPath)} className="text-blue-600 hover:underline text-sm">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await onReset(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset</h2>
          <p className="text-sm text-gray-600 mb-6">Your password has been updated successfully.</p>
          <button
            onClick={() => navigate(backPath)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to {portalLabel} Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mx-auto mb-6">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Set New Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">{portalLabel} — enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password || !password2}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Reset Password'}
          </button>
        </form>

        <button onClick={() => navigate(backPath)} className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4 w-full">
          Back to login
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
