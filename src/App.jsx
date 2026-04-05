import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import AdminPortal from './admin-portal/App';
import VendorPortal from './vendor-portal/VendorPortalApp';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/vendor/login" replace />} />
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="/vendor/*" element={<VendorPortal />} />
          <Route path="*" element={<Navigate to="/vendor/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
