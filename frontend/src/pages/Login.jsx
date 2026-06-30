import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';
import { Sparkles, Shield, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@lohithadharma.com', password: 'Admin@1234' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await login(form.email, form.password);
      loginUser(data.data.user, data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-650 to-indigo-755 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight heading-font">LeadScape AI</h1>
          <p className="text-slate-505 text-xs mt-1.5 font-bold uppercase tracking-wider">Autonomous Revenue Intelligence Platform</p>
        </div>

        <div className="card p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 heading-font">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Enter your credentials below to access the command center.</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <Shield size={14} className="shrink-0 text-rose-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="input pl-10 w-full"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="input pl-10 w-full"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-150">
              <p className="text-[10px] text-slate-500 font-semibold">
                Demo Account: <strong className="text-indigo-650 font-bold">admin@lohithadharma.com</strong> / <strong className="text-indigo-650 font-bold">Admin@1234</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

