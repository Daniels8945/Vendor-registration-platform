export const DOCUMENT_TYPES = [
  'Business Registration',
  'Tax Certificate',
  'Insurance Certificate',
  'Product Certification',
  'Bank Details',
  'Company Profile',
  'Other'
];

export const INVOICE_STATUS = {
  SUBMITTED: 'Submitted',
  PENDING_APPROVAL: 'Pending Approval',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  PAID: 'Paid',
  REJECTED: 'Rejected'
};

export const INVOICE_STATUS_COLORS = {
  'Submitted': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Pending Approval': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'Under Review': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'Approved': { bg: 'bg-green-100', text: 'text-green-800' },
  'Paid': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800' }
};

export const VENDOR_STATUS_COLORS = {
  'Pending Review': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
  'Approved': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
  'Inactive': { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⏸️' }
};
