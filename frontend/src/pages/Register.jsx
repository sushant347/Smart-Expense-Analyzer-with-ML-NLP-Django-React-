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
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-lg border border-slate-700">
        <h2 className="text-3xl font-bold text-center text-emerald-400 mb-2">Create Account</h2>
        <p className="text-center text-slate-400 text-sm mb-8">Start tracking your finances in NPR</p>
        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/50 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Username', name: 'username', type: 'text' },
            { label: 'Email', name: 'email', type: 'email' },
            { label: 'Password', name: 'password', type: 'password' },
            { label: 'Monthly Income (NPR)', name: 'monthly_income', type: 'number' },
            { label: 'Savings Goal (NPR)', name: 'savings_goal', type: 'number' },
          ].map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-100"
                required={['username', 'email', 'password'].includes(field.name)}
              />
            </div>
          ))}
          <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg transition-colors">
            Create Account
          </button>
        </form>
        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
