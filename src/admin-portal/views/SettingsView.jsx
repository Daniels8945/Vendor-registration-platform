import React, { useState, useEffect } from 'react';
import { Settings, Save, User, Bell, Shield, Building2, Plus, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import {
  getSettings, updateSettings,
  getAdminUsers, createAdminUser, deleteAdminUser, resetAdminUserPassword,
  adminChangePassword, getAdminToken,
} from '../../lib/api.js';

const DEFAULT_SETTINGS = {
  companyName: 'Onction',
  supportEmail: 'vendors@onction.com',
  companyPhone: '',
  companyAddress: '',
  invoicePrefix: 'INV',
  vendorCodePrefix: 'OSL',
  autoApproveDocuments: 'false',
  emailNotifications: 'true',
  requireDocumentApproval: 'true',
  maxInvoiceAmount: '',
  currency: 'NGN',
};

const SettingsView = ({ currentUser, onAuthChange }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [adminUsers, setAdminUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', username: '', password: '', role: 'Admin' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [resetPasswords, setResetPasswords] = useState({}); // { userId: newPw }

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  // Load settings and admin users on mount
  useEffect(() => {
    getSettings().then(data => {
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    }).catch(() => {});

    getAdminUsers().then(setAdminUsers).catch(() => {});
  }, []);

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? String(checked) : value }));
  };

  const saveSettingsHandler = async () => {
    setSaving(true);
    try {
      const saved = await updateSettings(settings);
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      showToast('Settings saved successfully');
    } catch {
      showToast('Failed to save settings', 'error');
    }
    setSaving(false);
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      const created = await createAdminUser(newUser);
      setAdminUsers(prev => [...prev, created]);
      setNewUser({ name: '', email: '', username: '', password: '', role: 'Admin' });
      setShowAddUser(false);
      showToast('Admin user added');
    } catch (err) {
      showToast(err.message || 'Failed to add user', 'error');
    }
  };

  const removeUser = async (id) => {
    try {
      await deleteAdminUser(id);
      setAdminUsers(prev => prev.filter(u => u.id !== id));
      showToast('User removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove user', 'error');
    }
  };

  const handleResetUserPassword = async (userId) => {
    const pw = resetPasswords[userId];
    if (!pw) return showToast('Enter a new password first', 'error');
    try {
      await resetAdminUserPassword(userId, pw);
      setResetPasswords(prev => ({ ...prev, [userId]: '' }));
      showToast('Password reset successfully');
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleChangeMyPassword = async () => {
    if (!currentPassword || !newPassword) return showToast('All fields required', 'error');
    if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
    try {
      await adminChangePassword(currentUser?.username, currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'workflow', label: 'Workflow', icon: Shield },
    { id: 'users', label: 'Admin Users', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const boolSetting = (key) => settings[key] === 'true' || settings[key] === true;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure system preferences</p>
        </div>
        {activeTab !== 'users' && activeTab !== 'security' && (
          <button onClick={saveSettingsHandler} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Save size={18} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { name: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Onction' },
              { name: 'supportEmail', label: 'Support Email', type: 'email', placeholder: 'vendors@onction.com' },
              { name: 'companyPhone', label: 'Phone Number', type: 'tel', placeholder: '+234 000 000 0000' },
              { name: 'currency', label: 'Currency', type: 'select', options: ['NGN', 'USD', 'GBP', 'EUR'] },
              { name: 'invoicePrefix', label: 'Invoice Number Prefix', type: 'text', placeholder: 'INV' },
              { name: 'vendorCodePrefix', label: 'Vendor Code Prefix', type: 'text', placeholder: 'OSL' },
              { name: 'maxInvoiceAmount', label: 'Max Invoice Amount (blank = no limit)', type: 'number', placeholder: '0' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select name={field.name} value={settings[field.name] || ''} onChange={handleSettingChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} value={settings[field.name] || ''} onChange={handleSettingChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <input type="checkbox" name="emailNotifications" id="emailNotifications"
              checked={boolSetting('emailNotifications')} onChange={handleSettingChange}
              className="w-5 h-5 mt-0.5" />
            <div>
              <label htmlFor="emailNotifications" className="font-semibold text-gray-900 cursor-pointer">Email Notifications</label>
              <p className="text-sm text-gray-500 mt-0.5">Send email notifications to vendors when their status changes</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow */}
      {activeTab === 'workflow' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Workflow Configuration</h2>
          {[
            { name: 'requireDocumentApproval', label: 'Require Document Approval', desc: 'All vendor documents must be approved before they can submit invoices' },
            { name: 'autoApproveDocuments', label: 'Auto-approve Documents', desc: 'Automatically approve documents upon upload (not recommended)' },
          ].map(item => (
            <div key={item.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <input type="checkbox" name={item.name} id={item.name}
                checked={boolSetting(item.name)} onChange={handleSettingChange}
                className="w-5 h-5 mt-0.5" />
              <div>
                <label htmlFor={item.name} className="font-semibold text-gray-900 cursor-pointer">{item.label}</label>
                <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5 max-w-lg">
          <h2 className="text-lg font-bold text-gray-900">Change Your Password</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
              <input type={showPwd ? 'text' : 'password'} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="New password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button onClick={handleChangeMyPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
              Change Password
            </button>
          </div>
        </div>
      )}

      {/* Admin Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Admin Users</h2>
            <button onClick={() => setShowAddUser(!showAddUser)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
              <Plus size={16} /> Add User
            </button>
          </div>

          {showAddUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">New Admin User</h3>
              <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" required placeholder="Full Name" value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <input type="text" required placeholder="Username" value={newUser.username}
                  onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <input type="email" placeholder="Email Address" value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <input type="password" required placeholder="Password" value={newUser.password}
                  onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">Add User</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {adminUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No admin users found.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Username</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Reset Password</th>
                    <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' : user.role === 'Viewer' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input type="password" placeholder="New password"
                            value={resetPasswords[user.id] || ''}
                            onChange={e => setResetPasswords(p => ({ ...p, [user.id]: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          <button onClick={() => handleResetUserPassword(user.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
                            Reset
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => removeUser(user.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg transition-colors" title="Remove user">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
