import React from 'react';
import { Menu } from 'lucide-react';
import { MENU_ITEMS } from '../utils/constants';

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentView, setCurrentView }) => {
  return (
    <div className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0`}>
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen && <h2 className="text-sm font-bold text-gray-900 tracking-wide">Onction Admin</h2>}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={17} className="flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {sidebarOpen && (
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-blue-900">Onction Service Limited</p>
            <p className="text-xs text-blue-600 mt-0.5">Vendor Management System</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
