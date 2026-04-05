import React, { useState } from 'react';
import { Menu, LogOut, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MENU_ITEMS } from '../utils/constants';

const Sidebar = ({ vendors, currentUser, onLogout, unreadNotifications = 0, onSearchOpen }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const pendingCount = vendors ? vendors.filter(v => v.status === 'Pending Review').length : 0;

  const isActive = (id) => location.pathname.includes(`/admin/${id}`);

  return (
    <div className={`${open ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0`}>
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
        {open && <h2 className="text-sm font-bold text-gray-900 tracking-wide">Admin Portal</h2>}
        <button onClick={() => setOpen(o => !o)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={18} />
        </button>
      </div>

      {/* Ctrl+K search button */}
      {onSearchOpen && (
        <div className="px-2 pt-2">
          <button
            onClick={onSearchOpen}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 ${!open ? 'justify-center' : ''}`}
          >
            <Search size={14} />
            {open && (
              <>
                <span className="flex-1 text-left text-xs">Search...</span>
                <kbd className="text-[10px] bg-white border border-gray-200 rounded px-1 font-mono">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      )}

      <nav className="flex-1 p-2 overflow-y-auto mt-1">
        <ul className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isVendors = item.id === 'vendors';
            const isNotifications = item.id === 'notifications';
            const active = isActive(item.id);
            const badge = isVendors ? pendingCount : isNotifications ? unreadNotifications : 0;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(`/admin/${item.id}`)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-sm ${
                    active ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
                  {open && <span className="flex-1 text-left">{item.label}</span>}
                  {open && badge > 0 && (
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
          <div className={`px-3 py-2.5 flex items-center gap-2 ${open ? '' : 'justify-center'}`}>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
              </div>
            )}
            {onLogout && (
              <button onClick={onLogout} title="Sign out" className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors shrink-0">
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
