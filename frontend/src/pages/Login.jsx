import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden px-4 py-6">
      <img
        src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1600&q=80"
        alt="Smart Expense background"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/95 via-slate-200/80 to-sky-100/80 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-slate-800/85" />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:grid md:grid-cols-2">
        <div className="hidden bg-slate-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Smart Expense</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">A practical way to manage monthly spending.</h1>
          </div>
          <p className="text-sm text-slate-200">Stay on top of income, expenses, recurring costs, and savings goals from one dashboard.</p>
        </div>

        <div className="p-7 sm:p-8">
          <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-slate-100">Welcome back</h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">Sign in to continue with Smart Expense.</p>
          {error && <div className="mb-4 mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Username</label>
              <input type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
                value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
              <input type="password"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700">
              Sign In
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            No account yet? <Link to="/register" className="font-semibold text-sky-700 hover:underline dark:text-sky-300">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
