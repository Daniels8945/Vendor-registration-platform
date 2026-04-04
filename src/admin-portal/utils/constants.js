import { LayoutDashboard, Users, UserPlus, Package, Settings } from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vendors', label: 'Vendor List', icon: Users },
  { id: 'add-vendor', label: 'Add Vendor', icon: UserPlus },
  { id: 'services', label: 'Services', icon: Package },
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
