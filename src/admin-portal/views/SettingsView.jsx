import React, { useState, useEffect } from 'react';
import { Settings, Save, User, Bell, Shield, Building2, Plus, Trash2, Lock, Eye, EyeOff } from 'lucide-react';

const SETTING_KEY = 'admin:settings';

const DEFAULT_SETTINGS = {
  companyName: 'Onction',
  companyEmail: 'admin@onction.com',
  companyPhone: '',
  companyAddress: '',
  invoicePrefix: 'INV',
  autoApproveDocuments: false,
  emailNotifications: true,
  requireDocumentApproval: true,
  maxInvoiceAmount: '',
  currency: 'NGN',
  adminPassword: '',
};

const ADMIN_USERS_KEY = 'admin:users';

const loadSettings = () => {
  try {
    const data = localStorage.getItem(SETTING_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

const loadAdminUsers = () => {
  try {
    const data = localStorage.getItem(ADMIN_USERS_KEY);
    return data ? JSON.parse(data) : [{ id: 'admin-1', name: 'Super Admin', email: 'admin@onction.com', role: 'Super Admin', createdAt: new Date().toISOString() }];
  } catch { return []; }
};

const saveAdminUsers = (users) => localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));

const SettingsView = ({ onAuthChange }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(loadSettings());
  const [adminUsers, setAdminUsers] = useState(loadAdminUsers());
  const [toast, setToast] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Admin' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveSettings = () => {
    localStorage.setItem(SETTING_KEY, JSON.stringify(settings));
    if (onAuthChange) onAuthChange();
    showToast('Settings saved successfully');
  };

  const savePassword = () => {
    if (newPassword && newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    const updated = { ...settings, adminPassword: newPassword };
    localStorage.setItem(SETTING_KEY, JSON.stringify(updated));
    setSettings(updated);
    setNewPassword('');
    setConfirmPassword('');
    if (onAuthChange) onAuthChange();
    showToast(newPassword ? 'Admin password updated' : 'Admin password removed');
  };

  const addUser = (e) => {
    e.preventDefault();
    const user = { id: `admin-${Date.now()}`, ...newUser, createdAt: new Date().toISOString() };
    const updated = [...adminUsers, user];
    saveAdminUsers(updated);
    setAdminUsers(updated);
    setNewUser({ name: '', email: '', role: 'Admin' });
    setShowAddUser(false);
    showToast('Admin user added');
  };

  const removeUser = (id) => {
    if (adminUsers.length <= 1) { showToast('Cannot remove the last admin user', 'error'); return; }
    const updated = adminUsers.filter(u => u.id !== id);
    saveAdminUsers(updated);
    setAdminUsers(updated);
    showToast('User removed');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'workflow', label: 'Workflow', icon: Shield },
    { id: 'users', label: 'Admin Users', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

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
          <button onClick={saveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Save size={18} />
            Save Changes
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
              { name: 'companyEmail', label: 'Company Email', type: 'email', placeholder: 'admin@onction.com' },
              { name: 'companyPhone', label: 'Phone Number', type: 'tel', placeholder: '+234 000 000 0000' },
              { name: 'currency', label: 'Currency', type: 'select', options: ['NGN', 'USD', 'GBP', 'EUR'] },
              { name: 'invoicePrefix', label: 'Invoice Number Prefix', type: 'text', placeholder: 'INV' },
              { name: 'maxInvoiceAmount', label: 'Max Invoice Amount (leave blank for no limit)', type: 'number', placeholder: '0' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select name={field.name} value={settings[field.name]} onChange={handleSettingChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} name={field.name} value={settings[field.name]} onChange={handleSettingChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>
            ))}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Company Address</label>
            <textarea name="companyAddress" value={settings.companyAddress} onChange={handleSettingChange}
              rows={2} placeholder="Full company address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
          {[
            { name: 'emailNotifications', label: 'Email Notifications', description: 'Send email notifications to vendors when their status changes' },
          ].map(item => (
            <div key={item.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <input type="checkbox" name={item.name} id={item.name} checked={settings[item.name]} onChange={handleSettingChange}
                className="w-5 h-5 mt-0.5" />
              <div>
                <label htmlFor={item.name} className="font-semibold text-gray-900 cursor-pointer">{item.label}</label>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflow */}
      {activeTab === 'workflow' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Workflow Configuration</h2>
          {[
            { name: 'requireDocumentApproval', label: 'Require Document Approval', description: 'All vendor documents must be approved before they can submit invoices' },
            { name: 'autoApproveDocuments', label: 'Auto-approve Documents', description: 'Automatically approve documents upon upload (not recommended)' },
          ].map(item => (
            <div key={item.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <input type="checkbox" name={item.name} id={item.name} checked={settings[item.name]} onChange={handleSettingChange}
                className="w-5 h-5 mt-0.5" />
              <div>
                <label htmlFor={item.name} className="font-semibold text-gray-900 cursor-pointer">{item.label}</label>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Admin Portal Password</h2>
          <p className="text-sm text-gray-500">Set a password to restrict access to the admin portal. Leave blank to disable the login gate.</p>
          <div className="space-y-3 max-w-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <input type={showPwd ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={savePassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">
                {newPassword ? 'Save Password' : 'Remove Password'}
              </button>
            </div>
            {settings.adminPassword && (
              <p className="text-xs text-green-600 font-medium">Password protection is currently active.</p>
            )}
            {!settings.adminPassword && (
              <p className="text-xs text-gray-400">No password set — portal is accessible without login.</p>
            )}
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
              <Plus size={16} />
              Add User
            </button>
          </div>

          {showAddUser && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">New Admin User</h3>
              <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" required placeholder="Full Name" value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" required placeholder="Email Address" value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Admin</option>
                  <option>Super Admin</option>
                  <option>Viewer</option>
                </select>
                <div className="md:col-span-3 flex gap-3">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors">Add User</button>
                  <button type="button" onClick={() => setShowAddUser(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-semibold text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Role</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adminUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'Super Admin' ? 'bg-purple-100 text-purple-800' : user.role === 'Viewer' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeUser(user.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded transition-colors" title="Remove user">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
