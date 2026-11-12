import { createBrowserRouter } from 'react-router';
import GuestSite from './pages/GuestSite';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  { path: '/', Component: GuestSite },
  { path: '/admin/login', Component: AdminLogin },
  { path: '/admin', Component: AdminDashboard },
  { path: '/admin/:section', Component: AdminDashboard },
]);
