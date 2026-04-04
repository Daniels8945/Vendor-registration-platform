import React from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { formatDate } from '../utils/vendorUtils';

const VendorNotificationsView = ({ notifications }) => {
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">View all messages and updates from Onction</p>
      </div>

      {/* Notifications Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-2">You'll receive updates about your vendor account here</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Notifications */}
            <div className="space-y-6">
              {notifications.map((notification, index) => (
                <div key={notification.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div className="absolute left-4 -ml-2 flex items-center justify-center w-4 h-4 bg-white">
                    <div className={`w-3 h-3 rounded-full ${
                      !notification.read ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                  </div>

                  {/* Notification card */}
                  <div className={`border rounded-lg p-4 ${getNotificationColor(notification.type || 'info')} ${
                    !notification.read ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}>
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type || 'info')}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                          <Clock size={14} />
                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex">
          <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">About Notifications</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• You'll receive notifications when your vendor status changes</li>
              <li>• Invoice and document updates will appear here</li>
              <li>• Important messages from Onction admin will be highlighted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorNotificationsView;
