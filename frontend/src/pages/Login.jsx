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
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
        <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-slate-100">Welcome back</h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">Sign in to manage your expenses and monthly reports.</p>
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
  );
}
