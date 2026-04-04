import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import VendorDetailModal from './modals/VendorDetailModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import DashboardView from './views/DashboardView';
import VendorsView from './views/VendorsView';
import AddVendorView from './views/AddVendorView';
import AdminInvoicesView from './views/AdminInvoicesView';
import VendorProfileView from './views/VendorProfileView';
import AdminDocumentsView from './views/AdminDocumentsView';
import ServicesView from './views/ServicesView';
import AuditLogView from './views/AuditLogView';
import SettingsView from './views/SettingsView';
import {
  loadVendors,
  saveVendor,
  deleteVendor,
  generateVendorCode,
  updateVendorStatus,
  notifyVendorStatusChange,
  logAudit
} from './utils/vendorUtils';
import { INITIAL_FORM_DATA } from './utils/constants';

const App = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [profileVendor, setProfileVendor] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const fetchVendors = async () => {
    const data = await loadVendors();
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVendors().then((data) => {
      setVendors(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const code = generateVendorCode(formData.businessType);
    const vendorData = {
      id: code,
      ...formData,
      status: 'Pending Review',
      submittedAt: new Date().toISOString()
    };

    const result = await saveVendor(vendorData);
    
    if (result.success) {
      logAudit('vendor_created', { vendorId: code, companyName: formData.companyName });
      showToast(`Vendor registered successfully! Code: ${code}`, 'success');
      setFormData(INITIAL_FORM_DATA);
      await fetchVendors();
      setCurrentView('vendors');
    } else {
      showToast('Failed to register vendor. Please try again.', 'error');
    }
  };

  const handleDeleteVendor = (vendor) => {
    setVendorToDelete(vendor);
  };

  const handleUpdateStatus = async (vendorId, newStatus) => {
    const result = await updateVendorStatus(vendorId, newStatus);

    if (result.success) {
      logAudit('vendor_status_changed', { vendorId, newStatus });
      await notifyVendorStatusChange(vendorId, newStatus);
      await fetchVendors();
      showToast(`Vendor ${newStatus.toLowerCase()} successfully`, 'success');
    } else {
      showToast('Failed to update vendor status. Please try again.', 'error');
    }
  };

  const executeDelete = async () => {
    if (!vendorToDelete) return;
    
    const result = await deleteVendor(vendorToDelete.id);
    
    if (result.success) {
      logAudit('vendor_deleted', { vendorId: vendorToDelete.id, companyName: vendorToDelete.companyName });
      await fetchVendors();
      showToast('Vendor deleted successfully', 'success');
    } else {
      showToast('Failed to delete vendor. Please try again.', 'error');
    }
    
    setVendorToDelete(null);
  };



  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView vendors={vendors} />;
      case 'vendors':
        return (
          <VendorsView
            vendors={vendors}
            loading={loading}
            onAddVendor={() => setCurrentView('add-vendor')}
            onViewVendor={setSelectedVendor}
            onViewProfile={(vendor) => { setProfileVendor(vendor); setCurrentView('vendor-profile'); }}
            onDeleteVendor={handleDeleteVendor}
            onUpdateStatus={handleUpdateStatus}
          />
        );
      case 'vendor-profile':
        return (
          <VendorProfileView
            vendor={profileVendor}
            onBack={() => { setCurrentView('vendors'); setProfileVendor(null); }}
          />
        );
      case 'add-vendor':
        return (
          <AddVendorView
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={() => setCurrentView('vendors')}
          />
        );
      case 'invoices':
        return <AdminInvoicesView onShowToast={showToast} />;
      case 'documents':
        return <AdminDocumentsView onShowToast={showToast} />;
      case 'services':
        return <ServicesView />;
      case 'audit-log':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView vendors={vendors} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toast toast={toast} onClose={() => setToast(null)} />
      
      <VendorDetailModal 
        vendor={selectedVendor} 
        onClose={() => setSelectedVendor(null)} 
      />
      
      <DeleteConfirmationModal
        vendor={vendorToDelete}
        onConfirm={executeDelete}
        onCancel={() => setVendorToDelete(null)}
      />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default App;
