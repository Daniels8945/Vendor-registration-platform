import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Mail } from 'lucide-react';

const AdminLoginGate = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onLogin(username, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    } else if (result.mustChangePw) {
      setMustChange(true);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== newPassword2) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { adminChangePassword } = await import('../../lib/api.js');
      await adminChangePassword(username, password, newPassword);
      const result = await onLogin(username, newPassword);
      if (!result.success) setError(result.error || 'Login failed after password change');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { adminForgotPassword } = await import('../../lib/api.js');
      await adminForgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'forgot') {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mx-auto mb-6">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Reset Password</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Enter your admin email to receive a reset link.</p>

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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 text-center">{error}</p>}
              <button type="submit" disabled={loading || !forgotEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (mustChange) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-8">
          <div className="flex items-center justify-center w-14 h-14 bg-yellow-500 rounded-full mx-auto mb-6">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Set New Password</h1>
          <p className="text-sm text-gray-500 text-center mb-6">You must change your password before continuing.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
              <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <button type="submit" disabled={loading || !newPassword || !newPassword2}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? 'Saving…' : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mx-auto mb-6">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Admin Portal</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
              placeholder="admin"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">Password</label>
              <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button type="submit" disabled={loading || !username || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Default: <code className="font-mono bg-gray-100 px-1 rounded">admin</code> / <code className="font-mono bg-gray-100 px-1 rounded">Admin@1234</code>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginGate;
