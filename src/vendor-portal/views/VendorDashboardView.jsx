import React from 'react';
import { FileText, Upload, Bell, User, CheckCircle, Clock, XCircle, AlertTriangle, TrendingUp, Calendar, DollarSign, Activity, Edit, Trash2 } from 'lucide-react';
import { VENDOR_STATUS_COLORS } from '../utils/constants';
import { formatDate, formatCurrency } from '../utils/vendorUtils';

const VendorDashboardView = ({ vendor, invoices, documents, notifications, activities, onNavigate }) => {
  const statusInfo = VENDOR_STATUS_COLORS[vendor.status] || VENDOR_STATUS_COLORS['Pending Review'];
  
  const stats = {
    invoicesSubmitted: invoices.length,
    invoicesPending: invoices.filter(inv => inv.status === 'Submitted' || inv.status === 'Under Review').length,
    invoicesApproved: invoices.filter(inv => inv.status === 'Approved').length,
    invoicesPaid: invoices.filter(inv => inv.status === 'Paid').length,
    documentsUploaded: documents.length,
    documentsPending: documents.filter(doc => doc.status === 'Pending Review').length,
    documentsApproved: documents.filter(doc => doc.status === 'Approved').length,
    unreadNotifications: notifications.filter(n => !n.read).length,
    totalInvoiceAmount: invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0),
    paidAmount: invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  };

  const getStatusIcon = () => {
    switch(vendor.status) {
      case 'Approved':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'Pending Review':
        return <Clock className="w-8 h-8 text-yellow-600" />;
      case 'Rejected':
        return <XCircle className="w-8 h-8 text-red-600" />;
      case 'Inactive':
        return <AlertTriangle className="w-8 h-8 text-gray-600" />;
      default:
        return <Clock className="w-8 h-8 text-gray-600" />;
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'invoice_created':
        return { icon: <FileText className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-100' };
      case 'invoice_edited':
        return { icon: <Edit className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-100' };
      case 'invoice_deleted':
        return { icon: <Trash2 className="w-4 h-4 text-red-600" />, bg: 'bg-red-100' };
      case 'document_uploaded':
        return { icon: <Upload className="w-4 h-4 text-green-600" />, bg: 'bg-green-100' };
      default:
        return { icon: <Activity className="w-4 h-4 text-gray-600" />, bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-blue-100 text-lg">{vendor.companyName}</p>
            <p className="text-blue-200 text-sm mt-1 font-mono">{vendor.id}</p>
          </div>
          <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-lg`}>
            {getStatusIcon()}
            <div>
              <p className="text-xs text-gray-600 font-medium">Status</p>
              <p className={`text-sm font-bold ${statusInfo.text}`}>{vendor.status}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-xs font-medium mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-gray-900">{stats.invoicesSubmitted}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-xs font-medium mb-1">Pending</p>
            <p className="text-3xl font-bold text-gray-900">{stats.invoicesPending}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-xs font-medium mb-1">Documents</p>
            <p className="text-3xl font-bold text-gray-900">{stats.documentsUploaded}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="text-gray-600 text-xs font-medium mb-1">Notifications</p>
            <p className="text-3xl font-bold text-gray-900">{stats.unreadNotifications}</p>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {vendor.status === 'Pending Review' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex">
            <Clock className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Registration Under Review</p>
              <p className="text-sm text-yellow-700 mt-1">
                Your vendor registration is being reviewed by Onction. You'll be notified once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {vendor.status === 'Approved' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Account Approved!</p>
              <p className="text-sm text-green-700 mt-1">
                Your vendor account is active. You can now submit invoices and manage your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {vendor.status === 'Rejected' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Registration Not Approved</p>
              <p className="text-sm text-red-700 mt-1">
                Unfortunately, your registration was not approved. Please contact Onction for more information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Total Invoice Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalInvoiceAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.invoicesSubmitted} invoices</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Paid Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.paidAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.invoicesPaid} paid invoices</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 rounded-full p-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.invoicesPending + stats.documentsPending}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.invoicesPending} invoices, {stats.documentsPending} docs</p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Invoices</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.invoicesSubmitted}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.invoicesApproved} approved</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.invoicesPending}</p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.documentsUploaded}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.documentsApproved} approved</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alerts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.unreadNotifications}</p>
              <p className="text-xs text-purple-600 mt-1">New messages</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('invoices')}
            disabled={vendor.status !== 'Approved'}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
          >
            <div className="bg-blue-100 rounded-full p-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Submit Invoice</p>
              <p className="text-xs text-gray-600">Create new invoice</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <div className="bg-green-100 rounded-full p-2">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Upload Document</p>
              <p className="text-xs text-gray-600">Add certificates</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <div className="bg-purple-100 rounded-full p-2">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Update Profile</p>
              <p className="text-xs text-gray-600">Edit information</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Invoices</h2>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All
            </button>
          </div>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No invoices submitted yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => onNavigate('invoices')}>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full p-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-gray-600">{formatDate(invoice.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(invoice.amount)}</p>
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          </div>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => {
                const { icon, bg } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${bg}`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                      {activity.metadata?.amount && (
                        <p className="text-xs font-semibold text-gray-700 mt-1">{formatCurrency(activity.metadata.amount)}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardView;
