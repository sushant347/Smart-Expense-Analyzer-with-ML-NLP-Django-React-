import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Download } from 'lucide-react';

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
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    api.get('reports/export/', {
      params: { year, month },
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finance_report_${year}_${String(month).padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }).catch(() => {
      setSaved('Failed to download report.');
      setTimeout(() => setSaved(''), 3000);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  if (loading) return <div className="py-20 text-center text-slate-600 dark:text-slate-300">Loading settings...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      {saved && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200">{saved}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><User size={18}/> Profile</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Username</label>
            <input value={profile.username} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Monthly Income (NPR)</label>
            <input type="number" value={profile.monthly_income || ''} onChange={e => setProfile({...profile, monthly_income: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Savings Goal (NPR)</label>
            <input type="number" value={profile.savings_goal || ''} onChange={e => setProfile({...profile, savings_goal: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40" />
          </div>
          <button type="submit" className="rounded-lg bg-sky-600 px-6 py-2.5 font-semibold text-white transition hover:bg-sky-700">
            Save Changes
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><Download size={18}/> Monthly Report</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Download a PDF summary for the current month.</p>
        <button onClick={handleDownloadReport} className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
          <Download size={16} /> Download PDF Report
        </button>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-800 dark:bg-rose-900/20">
        <h2 className="mb-2 text-lg font-semibold text-rose-700 dark:text-rose-300">Account</h2>
        <button onClick={handleLogout} className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700">
          Sign Out
        </button>
      </div>
    </div>
  );
}
