import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { refreshSession } from '../../lib/remote';
import { pullRemote } from '../../lib/store';
import AdminDashboard from './AdminDashboard';

/**
 * Menjaga dashboard: sesi dicek ke server dulu. Selama belum terbukti login,
 * dashboard tidak pernah dirender. (Data admin juga tetap ditolak server tanpa sesi.)
 */
export default function AdminGate() {
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking');

  useEffect(() => {
    let alive = true;
    void refreshSession().then((ok) => {
      if (!alive) return;
      if (ok) void pullRemote(true);
      setState(ok ? 'ok' : 'denied');
    });
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'denied') return <Navigate to="/admin/login" replace />;
  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1410', color: '#b8965a', fontFamily: 'Outfit, sans-serif', fontSize: 13, letterSpacing: '0.3em' }}>
        MEMERIKSA SESI…
      </div>
    );
  }
  return <AdminDashboard />;
}
