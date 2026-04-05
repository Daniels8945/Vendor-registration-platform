import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { getSettings } from '../utils/vendorUtils';

const ADMIN_USERS_KEY = 'admin:users';

const loadAdminUsers = () => {
  try {
    const data = localStorage.getItem(ADMIN_USERS_KEY);
    return data
      ? JSON.parse(data)
      : [{ id: 'admin-1', name: 'Super Admin', email: 'admin@onction.com', role: 'Super Admin' }];
  } catch {
    return [{ id: 'admin-1', name: 'Super Admin', email: 'admin@onction.com', role: 'Super Admin' }];
  }
};

const AdminLoginGate = ({ onLogin }) => {
  const [adminUsers] = useState(loadAdminUsers);
  const [selectedUserId, setSelectedUserId] = useState(adminUsers[0]?.id || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const settings = getSettings();

    setTimeout(() => {
      if (password === settings.adminPassword) {
        const user = adminUsers.find(u => u.id === selectedUserId) || adminUsers[0];
        onLogin(user);
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-8">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mx-auto mb-6">
          <Lock className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">Admin Portal</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Who are you?</label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
              >
                {adminUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                autoFocus
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Onction Service Limited · Vendor Management System
        </p>
      </div>
    </div>
  );
};

export default AdminLoginGate;
