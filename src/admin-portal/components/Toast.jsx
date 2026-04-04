import React from 'react';
import { X } from 'lucide-react';

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-50 transition-all duration-300">
      <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] ${
        toast.type === 'success' 
          ? 'bg-green-50 border-l-4 border-green-500' 
          : 'bg-red-50 border-l-4 border-red-500'
      }`}>
        {toast.type === 'success' ? (
          <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <p className={`text-sm font-medium ${
          toast.type === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className={`ml-auto ${
            toast.type === 'success' ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'
          }`}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
