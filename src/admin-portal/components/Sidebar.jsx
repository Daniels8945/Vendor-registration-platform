import React from 'react';
import { Menu } from 'lucide-react';
import { MENU_ITEMS } from '../utils/constants';

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentView, setCurrentView }) => {
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen && <h2 className="text-xl font-bold text-gray-900">Onction Admin</h2>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-1">Onction Service Limited</p>
            <p className="text-xs text-blue-700">Vendor Management System</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
