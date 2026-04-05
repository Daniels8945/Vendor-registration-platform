import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Check, X, DollarSign, Download, MoreVertical, Clock, CheckCircle, XCircle, AlertTriangle, FileDown, Package, Plus } from 'lucide-react';
import { formatDate, formatCurrency, exportToCSV, logAudit, getSettings } from '../utils/vendorUtils';
import { INVOICE_STATUS_COLORS } from '../utils/constants';

const PAGE_SIZE = 15;

const AdminInvoicesView = ({ onShowToast, userRole = 'Super Admin' }) => {
  const isViewer = userRole === 'Viewer';
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [paymentModal, setPaymentModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: ''
  });
  const [services, setServices] = useState([]);
  const [serviceModal, setServiceModal] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [createData, setCreateData] = useState({
    vendorCode: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    description: '',
    notes: '',
  });

  const loadAllInvoices = async () => {
    try {
      if (window.storage) {
        const result = await window.storage.list('invoice:', false);
        if (result && result.keys) {
          const data = await Promise.all(
            result.keys.map(async (key) => {
              try {
                const d = await window.storage.get(key, false);
                return d ? JSON.parse(d.value) : null;
              } catch { return null; }
            })
          );
          setInvoices(data.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
        }
      } else {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('invoice:'));
        const data = keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } });
        setInvoices(data.filter(Boolean).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadVendors = async () => {
    try {
      if (window.storage) {
        const result = await window.storage.list('vendor:', false);
        if (result && result.keys) {
          const data = await Promise.all(
            result.keys.map(async (key) => {
              try {
                const d = await window.storage.get(key, false);
                return d ? JSON.parse(d.value) : null;
              } catch { return null; }
            })
          );
          setVendors(data.filter(Boolean));
        }
      } else {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('vendor:'));
        const data = keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } });
        setVendors(data.filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await Promise.all([loadAllInvoices(), loadVendors()]);
      setLoading(false);
    };
    run();
    // Load services catalogue
    const svcKeys = Object.keys(localStorage).filter(k => k.startsWith('service:'));
    const svcs = svcKeys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean);
    setServices(svcs.filter(s => s.active).sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const getVendorName = (vendorCode) => {
    const v = vendors.find(v => v.id === vendorCode);
    return v ? v.companyName : vendorCode;
  };

  const isOverdue = (invoice) => {
    if (!invoice.dueDate || ['Paid', 'Rejected'].includes(invoice.status)) return false;
    return new Date(invoice.dueDate) < new Date();
  };

  const updateInvoiceStatus = async (invoice, newStatus, reason = '') => {
    try {
      const updated = {
        ...invoice,
        status: newStatus,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdatedBy: 'Admin',
        ...(reason ? { rejectionReason: reason } : {}),
      };
      const key = `invoice:${invoice.vendorCode}:${invoice.id}`;
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updated), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      await createNotification(invoice.vendorCode, {
        type: newStatus === 'Approved' ? 'success' : newStatus === 'Rejected' ? 'error' : 'info',
        title: `Invoice ${newStatus}`,
        message: `Your invoice ${invoice.invoiceNumber} has been ${newStatus.toLowerCase()}${reason ? '. Reason: ' + reason : ''}.`,
      });
      logAudit('invoice_status_changed', { vendorId: invoice.vendorCode, invoiceId: invoice.invoiceNumber, newStatus });
      await loadAllInvoices();
      setOpenDropdown(null);
      onShowToast(`Invoice ${invoice.invoiceNumber} ${newStatus.toLowerCase()}`, 'success');
    } catch (error) {
      console.error('Error updating invoice status:', error);
      onShowToast('Failed to update invoice status', 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    await updateInvoiceStatus(rejectModal, 'Rejected', rejectReason);
    setRejectModal(null);
    setRejectReason('');
  };

  const bulkAction = async (action) => {
    const targets = filteredInvoices.filter(i => selectedIds.has(i.id));
    for (const invoice of targets) {
      await updateInvoiceStatus(invoice, action);
    }
    setSelectedIds(new Set());
  };

  const recordPayment = async () => {
    if (!paymentModal) return;
    try {
      const updated = {
        ...paymentModal,
        status: 'Paid',
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.referenceNumber,
        paymentNotes: paymentData.notes,
        paidAt: new Date().toISOString(),
        paidBy: 'Admin',
      };
      const key = `invoice:${paymentModal.vendorCode}:${paymentModal.id}`;
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(updated), false);
      } else {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      await createNotification(paymentModal.vendorCode, {
        type: 'success',
        title: 'Payment Processed',
        message: `Payment of ${formatCurrency(paymentModal.amount)} for invoice ${paymentModal.invoiceNumber} has been processed.`,
      });
      logAudit('invoice_payment', { vendorId: paymentModal.vendorCode, invoiceId: paymentModal.invoiceNumber, amount: paymentModal.amount });
      await loadAllInvoices();
      setPaymentModal(null);
      setPaymentData({ paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer', referenceNumber: '', notes: '' });
      onShowToast(`Payment recorded for invoice ${paymentModal.invoiceNumber}`, 'success');
    } catch (error) {
      console.error('Error recording payment:', error);
      onShowToast('Failed to record payment', 'error');
    }
  };

  const createNotification = async (vendorCode, notificationData) => {
    try {
      const notificationId = `NOT-${new Date().getTime()}`;
      const notification = { id: notificationId, vendorCode, read: false, createdAt: new Date().toISOString(), ...notificationData };
      const key = `notification:${vendorCode}:${notificationId}`;
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(notification), false);
      } else {
        localStorage.setItem(key, JSON.stringify(notification));
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const tagService = async () => {
    if (!serviceModal) return;
    const service = services.find(s => s.id === selectedServiceId) || null;
    const updated = {
      ...serviceModal,
      serviceId: service?.id || null,
      serviceName: service?.name || null,
    };
    const key = `invoice:${serviceModal.vendorCode}:${serviceModal.id}`;
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(updated), false);
    } else {
      localStorage.setItem(key, JSON.stringify(updated));
    }
    await loadAllInvoices();
    setServiceModal(null);
    setSelectedServiceId('');
    onShowToast(service ? `Tagged as "${service.name}"` : 'Service tag removed', 'success');
  };

  const openCreateModal = () => {
    const { invoicePrefix } = getSettings();
    const prefix = invoicePrefix || 'INV';
    const now = new Date();
    const num = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getTime()).slice(-5)}`;
    setCreateData({
      vendorCode: vendors.length > 0 ? vendors[0].id : '',
      invoiceNumber: num,
      invoiceDate: now.toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      description: '',
      notes: '',
    });
    setCreateModal(true);
  };

  const createInvoice = async () => {
    if (!createData.vendorCode || !createData.invoiceNumber || !createData.amount || !createData.description) {
      onShowToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      const id = `AINV-${Date.now()}`;
      const invoice = {
        id,
        vendorCode: createData.vendorCode,
        invoiceNumber: createData.invoiceNumber,
        invoiceDate: createData.invoiceDate,
        dueDate: createData.dueDate || null,
        amount: parseFloat(createData.amount),
        description: createData.description,
        notes: createData.notes,
        status: 'Submitted',
        submittedAt: new Date().toISOString(),
        createdByAdmin: true,
      };
      const key = `invoice:${createData.vendorCode}:${id}`;
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(invoice), false);
      } else {
        localStorage.setItem(key, JSON.stringify(invoice));
      }
      logAudit('invoice_created', { vendorId: createData.vendorCode, invoiceId: createData.invoiceNumber, amount: invoice.amount });
      await loadAllInvoices();
      setCreateModal(false);
      onShowToast(`Invoice ${createData.invoiceNumber} created`, 'success');
    } catch (error) {
      console.error('Error creating invoice:', error);
      onShowToast('Failed to create invoice', 'error');
    }
  };

  const downloadInvoice = (invoice) => {
    const vendor = vendors.find(v => v.id === invoice.vendorCode);
    const text = `INVOICE\n\nInvoice Number: ${invoice.invoiceNumber}\nInvoice Date: ${formatDate(invoice.invoiceDate)}\nDue Date: ${formatDate(invoice.dueDate)}\nAmount: ${formatCurrency(invoice.amount)}\n\nVendor: ${vendor?.companyName || invoice.vendorCode}\nVendor Code: ${invoice.vendorCode}\nContact: ${vendor?.email || 'N/A'}\n\nDescription:\n${invoice.description}\n${invoice.notes ? `\nNotes:\n${invoice.notes}` : ''}\n\nStatus: ${invoice.status}${invoice.rejectionReason ? `\nRejection Reason: ${invoice.rejectionReason}` : ''}\nSubmitted: ${formatDate(invoice.submittedAt)}\n\n---\nOnction Service Limited`.trim();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber.replace(/\//g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setOpenDropdown(null);
  };

  const handleExportCSV = () => {
    exportToCSV(
      `invoices-${new Date().toISOString().split('T')[0]}.csv`,
      ['Invoice #', 'Vendor', 'Vendor Code', 'Invoice Date', 'Due Date', 'Amount', 'Description', 'Status', 'Submitted'],
      filteredInvoices.map(i => [
        i.invoiceNumber, getVendorName(i.vendorCode), i.vendorCode,
        formatDate(i.invoiceDate), formatDate(i.dueDate), i.amount,
        i.description, i.status, formatDate(i.submittedAt),
      ])
    );
  };

  const handleOpenDropdown = (e, invoiceId) => {
    if (openDropdown === invoiceId) { setOpenDropdown(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 220;
    const top = rect.bottom + DROPDOWN_HEIGHT > window.innerHeight
      ? rect.top - DROPDOWN_HEIGHT
      : rect.bottom + 4;
    setDropdownPosition({ top, right: window.innerWidth - rect.right });
    setOpenDropdown(invoiceId);
  };

  const getStatusBadge = (status) => {
    const colors = INVOICE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVendorName(invoice.vendorCode).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || invoice.vendorCode === vendorFilter;
    const matchesFrom = !dateFrom || new Date(invoice.submittedAt) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(invoice.submittedAt) <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesStatus && matchesVendor && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE);
  const pagedInvoices = filteredInvoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected = pagedInvoices.length > 0 && pagedInvoices.every(i => selectedIds.has(i.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); pagedInvoices.forEach(i => n.delete(i.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); pagedInvoices.forEach(i => n.add(i.id)); return n; });
    }
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const stats = {
    total: invoices.length,
    submitted: invoices.filter(i => i.status === 'Submitted').length,
    pendingApproval: invoices.filter(i => i.status === 'Pending Approval').length,
    underReview: invoices.filter(i => i.status === 'Under Review').length,
    approved: invoices.filter(i => i.status === 'Approved').length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    rejected: invoices.filter(i => i.status === 'Rejected').length,
    overdue: invoices.filter(isOverdue).length,
    totalAmount: invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    paidAmount: invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + parseFloat(i.amount || 0), 0),
    pendingAmount: invoices.filter(i => ['Submitted', 'Pending Approval', 'Under Review', 'Approved'].includes(i.status)).reduce((s, i) => s + parseFloat(i.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-1">Review and manage all vendor invoices</p>
        </div>
        <div className="flex items-center gap-2">
          {!isViewer && (
            <button onClick={openCreateModal}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium">
              <Plus size={16} /> Create Invoice
            </button>
          )}
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 text-sm bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm transition-colors">
            <FileDown size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: stats.total, sub: formatCurrency(stats.totalAmount), icon: Clock, color: 'blue' },
          { label: 'Pending Review', value: stats.submitted + stats.pendingApproval + stats.underReview, sub: formatCurrency(stats.pendingAmount), icon: Clock, color: 'yellow' },
          { label: 'Approved', value: stats.approved, sub: 'Ready for payment', icon: CheckCircle, color: 'green' },
          { label: 'Paid', value: stats.paid, sub: formatCurrency(stats.paidAmount), icon: DollarSign, color: 'purple' },
        ].map((card) => {
          const CardIcon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                </div>
                <div className={`bg-${card.color}-100 rounded-full p-3`}>
                  <CardIcon className={`w-5 h-5 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue alert */}
      {stats.overdue > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">{stats.overdue} invoice{stats.overdue > 1 ? 's are' : ' is'} past due date and still unpaid.</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search by invoice #, vendor, or description..."
              value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-sm">
              <option value="all">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <select value={vendorFilter} onChange={e => { setVendorFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
            <option value="all">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Date range:</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <span>to</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-blue-600 hover:text-blue-800 text-xs underline">Clear</button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && !isViewer && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-blue-800">{selectedIds.size} selected</span>
          <div className="flex gap-2 flex-wrap ml-2">
            <button onClick={() => bulkAction('Under Review')}
              className="flex items-center gap-1 text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg">
              <Clock size={13} /> Mark Under Review
            </button>
            <button onClick={() => bulkAction('Approved')}
              className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg">
              <Check size={13} /> Approve All
            </button>
            <button onClick={() => bulkAction('Rejected')}
              className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg">
              <X size={13} /> Reject All
            </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-600 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Invoice #</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Vendor</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Due Date</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedInvoices.map(invoice => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(invoice.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.has(invoice.id)} onChange={() => toggleOne(invoice.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                      {isOverdue(invoice) && (
                        <span className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                          <AlertTriangle size={10} /> Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getVendorName(invoice.vendorCode)}</div>
                      <div className="text-xs text-gray-400 font-mono">{invoice.vendorCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</td>
                    <td className={`px-6 py-4 text-sm ${isOverdue(invoice) ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                      {invoice.serviceName && (
                        <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600">
                          <Package size={10} />{invoice.serviceName}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button onClick={e => handleOpenDropdown(e, invoice.id)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, []).map((p, idx) => p === '...' ? (
              <span key={`e${idx}`} className="px-2">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      )}

      {/* Fixed Dropdown */}
      {openDropdown !== null && (() => {
        const invoice = filteredInvoices.find(i => i.id === openDropdown);
        if (!invoice) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
            <div className="fixed w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
              style={{ top: dropdownPosition.top, right: dropdownPosition.right }}>
              <button onClick={() => { setViewingInvoice(invoice); setOpenDropdown(null); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Eye size={15} /> View Details
              </button>
              <button onClick={() => downloadInvoice(invoice)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <Download size={15} /> Download
              </button>
              {services.length > 0 && (
                <button onClick={() => { setSelectedServiceId(invoice.serviceId || ''); setServiceModal(invoice); setOpenDropdown(null); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                  <Package size={15} /> {invoice.serviceName ? 'Change Service' : 'Tag Service'}
                </button>
              )}
              {!isViewer && (invoice.status === 'Submitted' || invoice.status === 'Pending Approval') && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => updateInvoiceStatus(invoice, 'Under Review')}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                    <Clock size={15} /> Mark Under Review
                  </button>
                  <button onClick={() => updateInvoiceStatus(invoice, 'Approved')}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                    <Check size={15} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(invoice); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <X size={15} /> Reject
                  </button>
                </>
              )}
              {!isViewer && invoice.status === 'Under Review' && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => updateInvoiceStatus(invoice, 'Approved')}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2">
                    <Check size={15} /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(invoice); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <X size={15} /> Reject
                  </button>
                </>
              )}
              {!isViewer && invoice.status === 'Approved' && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { setPaymentModal(invoice); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                    <DollarSign size={15} /> Record Payment
                  </button>
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Invoice Details</h3>
              <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Invoice Number</p>
                <p className="text-lg font-mono font-bold text-blue-600">{viewingInvoice.invoiceNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Vendor', value: getVendorName(viewingInvoice.vendorCode) },
                  { label: 'Amount', value: formatCurrency(viewingInvoice.amount) },
                  { label: 'Status', value: getStatusBadge(viewingInvoice.status) },
                  { label: 'Invoice Date', value: formatDate(viewingInvoice.invoiceDate) },
                  { label: 'Due Date', value: formatDate(viewingInvoice.dueDate) },
                  { label: 'Submitted', value: formatDate(viewingInvoice.submittedAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                    <div className="text-gray-900 text-sm">{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingInvoice.description}</p>
              </div>
              {viewingInvoice.serviceName && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Service</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Package size={13} /> {viewingInvoice.serviceName}
                  </span>
                </div>
              )}
              {viewingInvoice.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingInvoice.notes}</p>
                </div>
              )}
              {viewingInvoice.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
                  <p className="text-sm text-gray-900">{viewingInvoice.rejectionReason}</p>
                </div>
              )}
              {viewingInvoice.status === 'Paid' && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Payment Information</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-gray-500">Payment Date</p><p>{formatDate(viewingInvoice.paymentDate)}</p></div>
                    <div><p className="text-xs text-gray-500">Method</p><p className="capitalize">{viewingInvoice.paymentMethod?.replace('_', ' ')}</p></div>
                    {viewingInvoice.paymentReference && <div><p className="text-xs text-gray-500">Reference</p><p className="font-mono">{viewingInvoice.paymentReference}</p></div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Reject Invoice</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500">Invoice</p>
                <p className="font-mono font-semibold text-red-700">{rejectModal.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason <span className="text-gray-400 font-normal">(recommended)</span></label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                  placeholder="Explain why this invoice is being rejected so the vendor can resubmit correctly..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">Cancel</button>
                <button onClick={handleRejectConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Reject Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(paymentModal.amount)}</p>
                <p className="text-xs text-gray-500 mt-1">Invoice: {paymentModal.invoiceNumber}</p>
              </div>
              {[
                { label: 'Payment Date *', type: 'date', field: 'paymentDate' },
              ].map(({ label, type, field }) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                  <input type={type} value={paymentData[field]} onChange={e => setPaymentData(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
                <select value={paymentData.paymentMethod} onChange={e => setPaymentData(p => ({ ...p, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="wire_transfer">Wire Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reference Number</label>
                <input type="text" value={paymentData.referenceNumber} onChange={e => setPaymentData(p => ({ ...p, referenceNumber: e.target.value }))}
                  placeholder="Transaction reference"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={paymentData.notes} onChange={e => setPaymentData(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setPaymentModal(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">Cancel</button>
                <button onClick={recordPayment}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Create Invoice</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vendor *</label>
                <select value={createData.vendorCode} onChange={e => setCreateData(p => ({ ...p, vendorCode: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">— Select vendor —</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.companyName} ({v.id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number *</label>
                  <input type="text" value={createData.invoiceNumber} onChange={e => setCreateData(p => ({ ...p, invoiceNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount *</label>
                  <input type="number" min="0" step="0.01" value={createData.amount} onChange={e => setCreateData(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Date *</label>
                  <input type="date" value={createData.invoiceDate} onChange={e => setCreateData(p => ({ ...p, invoiceDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={createData.dueDate} onChange={e => setCreateData(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
                <textarea value={createData.description} onChange={e => setCreateData(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="Describe the goods or services..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea value={createData.notes} onChange={e => setCreateData(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
              <button onClick={() => setCreateModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">Cancel</button>
              <button onClick={createInvoice}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Create Invoice</button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Service Modal */}
      {serviceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Tag Service</h3>
              <button onClick={() => { setServiceModal(null); setSelectedServiceId(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500">Invoice</p>
                <p className="font-mono font-semibold text-blue-700">{serviceModal.invoiceNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Service from Catalogue</label>
                <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">— No service —</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setServiceModal(null); setSelectedServiceId(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm">Cancel</button>
                <button onClick={tagService}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Save Tag</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoicesView;
