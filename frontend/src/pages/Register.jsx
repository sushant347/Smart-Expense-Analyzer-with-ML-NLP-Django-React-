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
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
        <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-slate-100">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">Set up your profile and start tracking your monthly spending.</p>
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
  );
}
