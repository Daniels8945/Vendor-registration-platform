import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminPortal from './admin-portal/App';
import VendorPortal from './vendor-portal/VendorPortalApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminPortal />} />
        <Route path="/vendor/*" element={<VendorPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;