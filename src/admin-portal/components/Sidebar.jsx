import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { MENU_ITEMS } from '../utils/constants';

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentView, setCurrentView, vendors, currentUser, onLogout, unreadNotifications = 0 }) => {
  const pendingCount = vendors ? vendors.filter(v => v.status === 'Pending Review').length : 0;

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
            const isVendors = item.id === 'vendors';
            const isNotifications = item.id === 'notifications';
            const isActive = currentView === item.id;
            const badge = isVendors ? pendingCount : isNotifications ? unreadNotifications : 0;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Icon size={17} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <span className="flex-1 text-left">{item.label}</span>
                  )}
                  {sidebarOpen && badge > 0 && (
                    <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${isVendors ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200">
        {currentUser && (
          <div className={`px-3 py-2.5 flex items-center gap-2 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
              </div>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors shrink-0"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
        {sidebarOpen && !currentUser && (
          <div className="px-3 py-3">
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-blue-900">Onction Service Limited</p>
              <p className="text-xs text-blue-600 mt-0.5">Vendor Management System</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
