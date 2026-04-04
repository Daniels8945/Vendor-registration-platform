import React from 'react';
import { Package } from 'lucide-react';

const ServicesView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-600 mt-1">Manage vendor services and offerings</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Services management coming soon...</p>
      </div>
    </div>
  );
};

export default ServicesView;
