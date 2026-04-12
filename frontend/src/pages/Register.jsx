import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', monthly_income: '', savings_goal: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('users/register/', { ...form, currency: 'NPR' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.username?.[0] || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden px-4 py-6">
      <img
        src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1600&q=80"
        alt="Smart Expense registration background"
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/95 via-slate-200/80 to-emerald-100/75 dark:from-slate-950/95 dark:via-slate-900/85 dark:to-slate-800/85" />

      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 md:grid md:grid-cols-2">
        <div className="hidden bg-emerald-900 p-8 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Smart Expense</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">Build better money habits, month by month.</h1>
          </div>
          <p className="text-sm text-emerald-100">Create your account once and start getting categorized insights, forecasts, and savings suggestions.</p>
        </div>

        <div className="p-7 sm:p-8">
          <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-slate-100">Create your account</h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">Set up your Smart Expense profile and begin tracking.</p>
          {error && <div className="mb-4 mt-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {[
              { label: 'Username', name: 'username', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Password', name: 'password', type: 'password' },
              { label: 'Monthly Income (NPR)', name: 'monthly_income', type: 'number' },
              { label: 'Savings Goal (NPR)', name: 'savings_goal', type: 'number' },
            ].map(field => (
              <div key={field.name}>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
                  required={['username', 'email', 'password'].includes(field.name)}
                />
              </div>
            ))}
            <button type="submit" className="w-full rounded-lg bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700">
              Create Account
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Already registered? <Link to="/login" className="font-semibold text-sky-700 hover:underline dark:text-sky-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
