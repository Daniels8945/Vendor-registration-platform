import React, { useState, useEffect } from 'react';
import { Users, Bell, Package, XCircle, AlertTriangle, FileText, Upload, TrendingUp, Calendar, DollarSign, Clock } from 'lucide-react';
import { getStats, formatDate, getBusinessTypeLabel, formatCurrency } from '../utils/vendorUtils';

const getPeriodStart = (period) => {
  const now = new Date();
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') return new Date(now.getFullYear(), 0, 1);
  return null;
};

const DashboardView = ({ vendors, onViewProfile, onNavigate }) => {
  const [period, setPeriod] = useState('all');
  const periodStart = getPeriodStart(period);
  const filteredVendors = periodStart
    ? vendors.filter(v => new Date(v.submittedAt) >= periodStart)
    : vendors;
  const stats = getStats(filteredVendors);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [financials, setFinancials] = useState({ totalInvoiced: 0, totalPaid: 0, pendingAmount: 0, overdueAmount: 0, overdueCount: 0 });

  useEffect(() => {
    const load = () => {
      const invoiceKeys = Object.keys(localStorage).filter(k => k.startsWith('invoice:'));
      const allInvoices = invoiceKeys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean);
      const docKeys = Object.keys(localStorage).filter(k => k.startsWith('document:'));
      const allDocs = docKeys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean);
      return { invoices: allInvoices, docs: allDocs };
    };
    Promise.resolve(load()).then(({ invoices, docs }) => {
      // Always show pending counts from all-time data (for action alerts)
      setPendingInvoices(invoices.filter(i => ['Submitted', 'Pending Approval', 'Under Review'].includes(i.status)).slice(0, 5));
      setPendingDocs(docs.filter(d => d.status === 'Pending Review').slice(0, 5));
      // Apply period filter to financial metrics
      const periodFiltered = periodStart
        ? invoices.filter(i => new Date(i.submittedAt) >= periodStart)
        : invoices;
      const now = new Date();
      const active = periodFiltered.filter(i => i.status !== 'Rejected');
      const overdue = periodFiltered.filter(i => !['Paid', 'Rejected'].includes(i.status) && i.dueDate && new Date(i.dueDate) < now);
      setFinancials({
        totalInvoiced: active.reduce((s, i) => s + Number(i.amount || 0), 0),
        totalPaid: periodFiltered.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.amount || 0), 0),
        pendingAmount: periodFiltered.filter(i => ['Submitted', 'Pending Approval', 'Under Review', 'Approved'].includes(i.status)).reduce((s, i) => s + Number(i.amount || 0), 0),
        overdueAmount: overdue.reduce((s, i) => s + Number(i.amount || 0), 0),
        overdueCount: overdue.length,
      });
    });
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    { label: 'Total Vendors', value: stats.total, icon: Users, color: 'blue' },
    { label: 'Approved', value: stats.approved, icon: Users, color: 'green' },
    { label: 'Pending Review', value: stats.pending, icon: Bell, color: 'yellow' },
    { label: 'Manufacturers', value: stats.manufacturers, icon: Package, color: 'green' },
    { label: 'Distributors', value: stats.distributors, icon: Package, color: 'purple' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
  ];

  // Mini bar chart helper
  const maxVal = Math.max(stats.approved, stats.pending, stats.rejected, stats.inactive || 0, 1);
  const barData = [
    { label: 'Approved', value: stats.approved, color: 'bg-green-500' },
    { label: 'Pending', value: stats.pending, color: 'bg-yellow-400' },
    { label: 'Rejected', value: stats.rejected, color: 'bg-red-400' },
    { label: 'Inactive', value: stats.inactive || 0, color: 'bg-gray-400' },
  ];

  const typeData = [
    { label: 'Manufacturers', value: stats.manufacturers, color: 'bg-blue-500' },
    { label: 'Distributors', value: stats.distributors, color: 'bg-purple-500' },
    { label: 'Service Providers', value: stats.serviceProviders, color: 'bg-teal-500' },
  ];
  const maxType = Math.max(stats.manufacturers, stats.distributors, stats.serviceProviders, 1);

  const pendingActions = [
    stats.pending > 0 && { icon: Bell, color: 'text-yellow-600 bg-yellow-50', label: `${stats.pending} vendor${stats.pending > 1 ? 's' : ''} awaiting review`, view: 'vendors' },
    pendingInvoices.length > 0 && { icon: FileText, color: 'text-blue-600 bg-blue-50', label: `${pendingInvoices.length} invoice${pendingInvoices.length > 1 ? 's' : ''} need attention`, view: 'invoices' },
    pendingDocs.length > 0 && { icon: Upload, color: 'text-orange-600 bg-orange-50', label: `${pendingDocs.length} document${pendingDocs.length > 1 ? 's' : ''} pending review`, view: 'documents' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to Onction's vendor management system</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shrink-0 shadow-sm">
          <Calendar size={14} className="text-gray-400 ml-1.5" />
          {[
            { id: 'all', label: 'All Time' },
            { id: 'year', label: 'This Year' },
            { id: 'quarter', label: 'Quarter' },
            { id: 'month', label: 'This Month' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setPeriod(id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${period === id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Actions Alert */}
      {pendingActions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-sm font-bold text-gray-800">Pending Actions</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {pendingActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onNavigate && onNavigate(action.view)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${action.color} hover:opacity-80 transition-opacity cursor-pointer`}
                >
                  <ActionIcon size={15} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const StatIcon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`bg-${card.color}-100 rounded-full p-2.5`}>
                  <StatIcon className={`w-5 h-5 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial Summary */}
      {(financials.totalInvoiced > 0 || financials.totalPaid > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Invoiced', value: formatCurrency(financials.totalInvoiced), Icon: FileText, color: 'blue' },
            { label: 'Total Paid', value: formatCurrency(financials.totalPaid), Icon: DollarSign, color: 'emerald' },
            { label: 'Pending Payment', value: formatCurrency(financials.pendingAmount), Icon: Clock, color: 'yellow' },
            { label: `Overdue${financials.overdueCount > 0 ? ` (${financials.overdueCount})` : ''}`, value: formatCurrency(financials.overdueAmount), Icon: AlertTriangle, color: financials.overdueCount > 0 ? 'red' : 'gray' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
                </div>
                <div className={`bg-${color}-100 rounded-full p-2`}>
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {periodStart && filteredVendors.length === 0 && vendors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          No vendors registered in this period. Showing totals for all time below.
        </div>
      )}

      {/* Charts Row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700">Vendors by Status</h2>
            </div>
            <div className="space-y-3">
              {barData.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${(value / maxVal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Type Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700">Vendors by Type</h2>
            </div>
            <div className="space-y-3">
              {typeData.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${(value / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Vendors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Recent Vendors</h2>
          <span className="text-xs text-gray-400">Click to view profile</span>
        </div>
        <div className="p-5">
          {vendors.slice(0, 5).length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">No vendors registered yet</p>
          ) : (
            <div className="space-y-2">
              {vendors.slice(0, 5).map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => onViewProfile(vendor)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {vendor.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{vendor.companyName}</p>
                      <p className="text-xs text-gray-500 font-mono">{vendor.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-700">{getBusinessTypeLabel(vendor.businessType)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(vendor.submittedAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
