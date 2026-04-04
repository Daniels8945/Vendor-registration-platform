import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, X, Check } from 'lucide-react';

const SERVICE_CATEGORIES = ['IT & Software', 'Logistics', 'Manufacturing', 'Consulting', 'Maintenance', 'Supply', 'Other'];

const loadServices = () => {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('service:'));
    return keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch { return []; }
};

const saveService = (service) => {
  localStorage.setItem(`service:${service.id}`, JSON.stringify(service));
};

const deleteService = (id) => {
  localStorage.removeItem(`service:${id}`);
};

const EMPTY_FORM = { name: '', category: 'IT & Software', description: '', unitPrice: '', unit: '', active: true };

const ServicesView = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setServices(loadServices());
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingService) {
      const updated = { ...editingService, ...formData, updatedAt: new Date().toISOString() };
      saveService(updated);
      setServices(loadServices());
      showToast('Service updated successfully');
    } else {
      const newService = {
        id: `SVC-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      saveService(newService);
      setServices(loadServices());
      showToast('Service created successfully');
    }
    setFormData(EMPTY_FORM);
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      description: service.description,
      unitPrice: service.unitPrice,
      unit: service.unit,
      active: service.active,
    });
    setShowForm(true);
  };

  const handleDelete = () => {
    deleteService(deleteConfirm.id);
    setServices(loadServices());
    setDeleteConfirm(null);
    showToast('Service deleted');
  };

  const toggleActive = (service) => {
    const updated = { ...service, active: !service.active, updatedAt: new Date().toISOString() };
    saveService(updated);
    setServices(loadServices());
    showToast(`Service ${updated.active ? 'activated' : 'deactivated'}`);
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Manage service catalogue and pricing</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingService(null); setFormData(EMPTY_FORM); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Services', value: services.length, color: 'blue' },
          { label: 'Active', value: services.filter(s => s.active).length, color: 'green' },
          { label: 'Inactive', value: services.filter(s => !s.active).length, color: 'gray' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className={`text-3xl font-bold mt-1 text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Service Name *</label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  placeholder="e.g., Software Development"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <select
                  name="category" required value={formData.category} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Price (NGN)</label>
                <input
                  type="number" name="unitPrice" min="0" step="0.01" value={formData.unitPrice} onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                <input
                  type="text" name="unit" value={formData.unit} onChange={handleChange}
                  placeholder="e.g., per hour, per unit, per month"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                name="description" value={formData.description} onChange={handleChange} rows={3}
                placeholder="Describe this service..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="active" id="active" checked={formData.active} onChange={handleChange} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Active (visible to vendors)</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingService(null); setFormData(EMPTY_FORM); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text" placeholder="Search services..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{searchTerm ? 'No services match your search' : 'No services yet — add one above'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Service</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Unit Price</th>
                  <th className="text-left px-6 py-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(service => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      {service.description && <p className="text-sm text-gray-500 truncate max-w-xs">{service.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {service.unitPrice ? `${formatCurrency(service.unitPrice)}${service.unit ? ` / ${service.unit}` : ''}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(service)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${service.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {service.active ? <><Check size={12} /> Active</> : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded transition-colors" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => setDeleteConfirm(service)}
                          className="text-red-600 hover:text-red-800 p-2 rounded transition-colors" title="Delete">
                          <Trash2 size={18} />
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

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Service?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
