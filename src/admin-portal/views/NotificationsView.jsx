import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle, XCircle, Info } from 'lucide-react';
import { formatDate } from '../utils/vendorUtils';

const loadNotifications = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('notification:'));
    return keys
      .map(k => { try { return { _key: k, ...JSON.parse(localStorage.getItem(k)) }; } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch { return []; }
};

const TYPE_ICONS = {
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 border-green-200' },
  error:   { icon: XCircle,     color: 'text-red-500',   bg: 'bg-red-50 border-red-200'   },
  info:    { icon: Info,        color: 'text-blue-500',  bg: 'bg-blue-50 border-blue-200' },
};

const NotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const reload = () => setNotifications(loadNotifications());

  useEffect(() => { reload(); }, []);

  const markRead = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const n = JSON.parse(raw);
      localStorage.setItem(key, JSON.stringify({ ...n, read: true }));
      reload();
    } catch { /* ignore */ }
  };

  const markAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => markRead(n._key));
  };

  const deleteNotification = (key) => {
    localStorage.removeItem(key);
    reload();
  };

  const clearAll = () => {
    notifications.forEach(n => localStorage.removeItem(n._key));
    setNotifications([]);
  };

  const filtered = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition-colors">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 px-3 py-2 rounded-lg transition-colors">
              <Trash2 size={15} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              filter === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {notifications.length === 0 ? 'No notifications yet.' : 'No unread notifications.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.info;
            const TypeIcon = meta.icon;
            return (
              <div key={n._key}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.read ? 'bg-white border-gray-200' : `${meta.bg} border`}`}>
                <TypeIcon size={18} className={`${meta.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-gray-400">{formatDate(n.createdAt)}</p>
                    {n.vendorCode && (
                      <span className="text-xs text-gray-400 font-mono">{n.vendorCode}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markRead(n._key)} title="Mark as read"
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg transition-colors">
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n._key)} title="Delete"
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsView;

export const getUnreadNotificationCount = () => {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('notification:'))
      .reduce((count, k) => {
        try { const n = JSON.parse(localStorage.getItem(k)); return n && !n.read ? count + 1 : count; }
        catch { return count; }
      }, 0);
  } catch { return 0; }
};
