import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Target, DollarSign, Download } from 'lucide-react';

export default function Settings() {
  const [profile, setProfile] = useState({ username: '', email: '', monthly_income: '', savings_goal: '', currency: 'NPR' });
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('users/profile/').then(res => setProfile(res.data)).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.patch('users/profile/', {
        monthly_income: profile.monthly_income,
        savings_goal: profile.savings_goal,
        currency: profile.currency,
      });
      setSaved('Profile updated successfully!');
      setTimeout(() => setSaved(''), 3000);
    } catch {
      setSaved('Failed to update profile.');
    }
  };

  const handleDownloadReport = () => {
    const token = localStorage.getItem('access_token');
    const now = new Date();
    window.open(`http://localhost:8000/api/reports/export/?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-100">Settings</h1>

      {saved && <div className="p-3 bg-emerald-900/30 text-emerald-400 rounded-lg">{saved}</div>}

      {/* Profile */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-5 flex items-center gap-2"><User size={18}/> Profile</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input value={profile.username} disabled className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Monthly Income (NPR)</label>
            <input type="number" value={profile.monthly_income || ''} onChange={e => setProfile({...profile, monthly_income: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Savings Goal (NPR)</label>
            <input type="number" value={profile.savings_goal || ''} onChange={e => setProfile({...profile, savings_goal: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-colors">
            Save Changes
          </button>
        </form>
      </div>

      {/* PDF Export */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-2 flex items-center gap-2"><Download size={18}/> Monthly Report</h2>
        <p className="text-slate-400 text-sm mb-4">Download a PDF summary of this month's transactions and analytics.</p>
        <button onClick={handleDownloadReport} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium">
          <Download size={16} /> Download PDF Report
        </button>
      </div>

      {/* Logout */}
      <div className="bg-slate-800/40 rounded-2xl border border-red-900/40 p-6">
        <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
        <button onClick={handleLogout} className="px-5 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors text-sm font-medium">
          Sign Out
        </button>
      </div>
    </div>
  );
}
