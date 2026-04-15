import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react';
import api from '../api/axios';
import kharchiLogo from '../components/image/Kharchi.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();

  // ── Build 4 months of rich demo data ──────────────────────────────────────
  const buildDemoTransactions = () => {
    const today = new Date();
    const rows = [];

    // Helper: Create date relative to today in days
    const daysAgo = (d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      return dt.toISOString().split('T')[0];
    };

    // ── MONTH 1 (oldest, ~90-120 days ago) ─────────────────────────────────
    rows.push(
      { date: daysAgo(118), description: 'Monthly apartment rent', amount: 22000, transaction_type: 'DEBIT', category: 'Rent', source: 'MANUAL' },
      { date: daysAgo(115), description: 'Salary credit', amount: 65000, transaction_type: 'CREDIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(114), description: 'Grocery mart purchase', amount: 7800, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(112), description: 'Ride app commute', amount: 3100, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(111), description: 'Cafe and snacks', amount: 2100, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(109), description: 'Electricity bill', amount: 3400, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(107), description: 'Online shopping order', amount: 5200, transaction_type: 'DEBIT', category: 'Shopping', source: 'MANUAL' },
      { date: daysAgo(105), description: 'Movie night', amount: 1600, transaction_type: 'DEBIT', category: 'Entertainment', source: 'MANUAL' },
      { date: daysAgo(103), description: 'Fuel top up', amount: 2600, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(101), description: 'Health checkup', amount: 2800, transaction_type: 'DEBIT', category: 'Health', source: 'MANUAL' },
      { date: daysAgo(99),  description: 'Grocery mart purchase', amount: 6500, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(97),  description: 'Internet bill', amount: 1500, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(95),  description: 'Cafe and snacks', amount: 1900, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(93),  description: 'Ride app commute', amount: 2900, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(91),  description: 'Savings transfer', amount: 8000, transaction_type: 'DEBIT', category: 'Transfer', source: 'MANUAL' },

      // ── MONTH 2 (~60-89 days ago) ───────────────────────────────────────
      { date: daysAgo(88),  description: 'Monthly apartment rent', amount: 22000, transaction_type: 'DEBIT', category: 'Rent', source: 'MANUAL' },
      { date: daysAgo(86),  description: 'Salary credit', amount: 65000, transaction_type: 'CREDIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(84),  description: 'Grocery mart purchase', amount: 8200, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(82),  description: 'Ride app commute', amount: 3300, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(80),  description: 'Electricity bill', amount: 3700, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(78),  description: 'Cafe and snacks', amount: 2600, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(76),  description: 'Online shopping order', amount: 4800, transaction_type: 'DEBIT', category: 'Shopping', source: 'MANUAL' },
      { date: daysAgo(74),  description: 'Grocery mart purchase', amount: 7100, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(72),  description: 'Fuel top up', amount: 2700, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(70),  description: 'Movie night', amount: 1800, transaction_type: 'DEBIT', category: 'Entertainment', source: 'MANUAL' },
      { date: daysAgo(68),  description: 'Health checkup', amount: 1500, transaction_type: 'DEBIT', category: 'Health', source: 'MANUAL' },
      { date: daysAgo(66),  description: 'Internet bill', amount: 1500, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(64),  description: 'Cafe and snacks', amount: 2200, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(62),  description: 'Ride app commute', amount: 3100, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(60),  description: 'Savings transfer', amount: 8000, transaction_type: 'DEBIT', category: 'Transfer', source: 'MANUAL' },

      // ── MONTH 3 (~30-59 days ago) ───────────────────────────────────────
      { date: daysAgo(58),  description: 'Monthly apartment rent', amount: 22000, transaction_type: 'DEBIT', category: 'Rent', source: 'MANUAL' },
      { date: daysAgo(56),  description: 'Salary credit', amount: 65000, transaction_type: 'CREDIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(54),  description: 'Grocery mart purchase', amount: 9100, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(52),  description: 'Electricity bill', amount: 3600, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(50),  description: 'Ride app commute', amount: 3500, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(48),  description: 'Online shopping order', amount: 6300, transaction_type: 'DEBIT', category: 'Shopping', source: 'MANUAL' },
      { date: daysAgo(46),  description: 'Cafe and snacks', amount: 2400, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(44),  description: 'Grocery mart purchase', amount: 7400, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(42),  description: 'Fuel top up', amount: 2900, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(40),  description: 'Movie night', amount: 2100, transaction_type: 'DEBIT', category: 'Entertainment', source: 'MANUAL' },
      { date: daysAgo(38),  description: 'Internet bill', amount: 1500, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(36),  description: 'Health checkup', amount: 3200, transaction_type: 'DEBIT', category: 'Health', source: 'MANUAL' },
      { date: daysAgo(34),  description: 'Ride app commute', amount: 3200, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(32),  description: 'Cafe and snacks', amount: 1800, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(30),  description: 'Savings transfer', amount: 8000, transaction_type: 'DEBIT', category: 'Transfer', source: 'MANUAL' },

      // ── MONTH 4 (current month, ~0-29 days ago) ─────────────────────────
      { date: daysAgo(28),  description: 'Monthly apartment rent', amount: 22000, transaction_type: 'DEBIT', category: 'Rent', source: 'MANUAL' },
      { date: daysAgo(26),  description: 'Salary credit', amount: 65000, transaction_type: 'CREDIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(24),  description: 'Grocery mart purchase', amount: 8600, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(22),  description: 'Electricity bill', amount: 3800, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(20),  description: 'Ride app commute', amount: 3400, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(18),  description: 'Online shopping order', amount: 5100, transaction_type: 'DEBIT', category: 'Shopping', source: 'MANUAL' },
      { date: daysAgo(16),  description: 'Internet bill', amount: 1500, transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' },
      { date: daysAgo(14),  description: 'Cafe and snacks', amount: 2300, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(12),  description: 'Grocery mart purchase', amount: 7200, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(10),  description: 'Fuel top up', amount: 2800, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(8),   description: 'Movie night', amount: 1900, transaction_type: 'DEBIT', category: 'Entertainment', source: 'MANUAL' },
      { date: daysAgo(6),   description: 'Ride app commute', amount: 3000, transaction_type: 'DEBIT', category: 'Transport', source: 'MANUAL' },
      { date: daysAgo(4),   description: 'Health checkup', amount: 2700, transaction_type: 'DEBIT', category: 'Health', source: 'MANUAL' },
      { date: daysAgo(2),   description: 'Cafe and snacks', amount: 2000, transaction_type: 'DEBIT', category: 'Food', source: 'MANUAL' },
      { date: daysAgo(1),   description: 'Savings transfer', amount: 8000, transaction_type: 'DEBIT', category: 'Transfer', source: 'MANUAL' },
    );

    return rows;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      navigate('/dashboard');
    } catch {
      setError('Incorrect username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setError('');
    setDemoLoading(true);
    const demoId = Date.now().toString().slice(-6);
    const demoUsername = `demo_user_${demoId}`;
    const demoPassword = `DemoPass!${demoId}`;

    try {
      await api.post('users/register/', {
        username: demoUsername,
        email: `demo_${demoId}@kharchi.local`,
        password: demoPassword,
        monthly_income: 65000,
        savings_goal: 180000,
        currency: 'NPR',
      });

      const loginRes = await api.post('auth/login/', { username: demoUsername, password: demoPassword });
      localStorage.setItem('access_token', loginRes.data.access);
      localStorage.setItem('refresh_token', loginRes.data.refresh);

      // Upload all 4-month demo transactions sequentially (avoid rate limit)
      const txns = buildDemoTransactions();
      for (const tx of txns) {
        await api.post('transactions/', tx).catch(() => {});
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login failed', err);
      setError('Demo setup failed. Please try again shortly.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-full items-center justify-center overflow-hidden px-4 py-8"
      style={{ background: '#f3f4f6' }}
    >
      {/* Background dot pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl md:grid md:grid-cols-2"
        style={{ border: '1px solid var(--stroke-soft)' }}
      >
        {/* Left panel */}
        <div className="hidden md:flex md:flex-col md:justify-between p-8" style={{ background: '#111827' }}>
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img
                src={kharchiLogo}
                alt="Kharchi logo"
                className="h-8 w-8 rounded-lg object-cover"
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              />
              <span className="text-sm font-bold text-white">Kharchi</span>
            </div>
            <h1 className="text-2xl font-bold leading-snug text-white">
              Track every rupee.<br />Build real savings.
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
              Upload bank statements, manually log transactions, and get predictive insights on your spending patterns.
            </p>
          </div>
          <div className="space-y-3 mt-8">
            {['Category auto-detection', 'Monthly forecasting', 'Budget simulation', 'PDF reports'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent)' }}>✓</span>
                <span className="text-sm" style={{ color: '#d1d5db' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="p-7 sm:p-8" style={{ background: 'var(--surface-1)' }}>
          <div className="mb-7">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your account to continue.</p>
          </div>

          {error && <div className="error-box mb-5">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-surface"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-surface pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: 'var(--text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button id="btn-login" type="submit" disabled={loading} className="btn-primary w-full gap-2 py-3">
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button id="btn-demo" type="button" onClick={handleTryDemo} disabled={demoLoading} className="btn-secondary w-full gap-2 py-3">
              <Zap size={16} />
              {demoLoading ? 'Setting up demo (this may take ~15s)…' : 'Try Demo Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
