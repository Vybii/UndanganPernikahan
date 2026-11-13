import { useState } from 'react';
import { useNavigate } from 'react-router';
import adminBackground from '../assets/admin-login-background.png';
import { signIn } from '../lib/remote';
import { pullRemote } from '../lib/store';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      void pullRemote(true);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login min-h-screen flex items-center justify-center px-4">
      <div className="admin-login-image" aria-hidden="true">
        <img src={adminBackground} alt="" />
      </div>
      <div className="admin-login-grain" aria-hidden="true" />
      <div className="admin-login-panel w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a', fontFamily: 'Outfit, sans-serif' }}>Admin Portal</div>
          <h1 className="text-4xl font-normal" style={{ fontFamily: 'Playfair Display, serif', color: '#f5ecd8' }}>Angga & Ayu</h1>
          <p className="text-sm mt-2" style={{ color: '#8a7a65', fontFamily: 'Outfit, sans-serif' }}>Wedding Management System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-login-form p-8 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg text-xs text-center" style={{ background: 'rgba(220,80,80,0.15)', color: '#f08080', border: '1px solid rgba(220,80,80,0.3)' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65', fontFamily: 'Outfit, sans-serif' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,150,90,0.3)', borderRadius: '8px', color: '#f5ecd8', fontFamily: 'Outfit, sans-serif' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65', fontFamily: 'Outfit, sans-serif' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(184,150,90,0.3)', borderRadius: '8px', color: '#f5ecd8', fontFamily: 'Outfit, sans-serif' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn waves-effect w-full py-4 text-sm tracking-widest uppercase font-medium transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', color: '#fff', borderRadius: '8px', fontFamily: 'Outfit, sans-serif' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-xs hover:opacity-80 transition-all" style={{ color: 'rgba(184,150,90,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
            ← Back to Invitation
          </button>
        </div>
      </div>
    </div>
  );
}
