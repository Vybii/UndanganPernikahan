import { createBrowserRouter } from 'react-router';
import GuestSite from './pages/GuestSite';
import AdminLogin from './pages/AdminLogin';
import AdminGate from './pages/admin/AdminGate';

export const router = createBrowserRouter([
  { path: '/', Component: GuestSite },
  { path: '/admin/login', Component: AdminLogin },
  { path: '/admin', Component: AdminGate },
  { path: '/admin/:section', Component: AdminGate },
]);
