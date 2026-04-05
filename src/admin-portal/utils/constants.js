import { LayoutDashboard, Users, UserPlus, FileText, Upload, Package, Settings, ClipboardList, Bell } from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vendors', label: 'Vendor List', icon: Users },
  { id: 'add-vendor', label: 'Add Vendor', icon: UserPlus },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United States',
  'United Kingdom',
  'Other'
];

export const INITIAL_FORM_DATA = {
  companyName: '',
  businessType: 'manufacturer',
  productsServices: '',
  website: '',
  streetAddress: '',
  streetAddress2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  companyInfo: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
};

export const VENDOR_STATUSES = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INACTIVE: 'Inactive'
};

export const STATUS_COLORS = {
  'Pending Review': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Approved': { bg: 'bg-green-100', text: 'text-green-800' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800' },
  'Inactive': { bg: 'bg-gray-100', text: 'text-gray-800' }
};

export const INVOICE_STATUS_COLORS = {
  'Submitted':        { bg: 'bg-blue-100',    text: 'text-blue-800' },
  'Pending Approval': { bg: 'bg-yellow-100',  text: 'text-yellow-800' },
  'Under Review':     { bg: 'bg-purple-100',  text: 'text-purple-800' },
  'Approved':         { bg: 'bg-green-100',   text: 'text-green-800' },
  'Paid':             { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Rejected':         { bg: 'bg-red-100',     text: 'text-red-800' },
};

export const DOC_STATUS_COLORS = {
  'Pending Review': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Approved':       { bg: 'bg-green-100',  text: 'text-green-800' },
  'Rejected':       { bg: 'bg-red-100',    text: 'text-red-800' },
};
