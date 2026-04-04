import React from 'react';
import { Settings } from 'lucide-react';

const SettingsView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your system preferences</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Settings configuration coming soon...</p>
      </div>
    </div>
  );
};

export default SettingsView;
