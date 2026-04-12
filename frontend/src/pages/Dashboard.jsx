import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Wallet, Zap } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('analytics/summary/');
      setData(res.data);
      const forecastRes = await api.get('analytics/forecast/');
      setForecast(forecastRes.data);
    } catch (err) {
      console.error("Failed to load analytics: ", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-600 dark:text-slate-300">Loading dashboard...</div>;
  }

  const categoryData = data?.monthly_category_breakdown || [];
  const weeklyData = data?.weekly_trends || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monthly snapshot of your income, spending, and trends.</p>
        </div>
        <Link to="/upload" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
          Import statement
        </Link>
      </header>

      {data?.bad_habits?.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 text-amber-600 dark:text-amber-300" size={20} />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Spending alert</h3>
            <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-200">
              {data.bad_habits.map((habit, idx) => (
                <li key={idx}>• {habit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300"><TrendingUp size={16}/> Total Expenses</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">NPR {data?.total_expense?.toLocaleString() || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300"><Wallet size={16}/> Total Income</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">NPR {data?.total_income?.toLocaleString() || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-300">Savings Rate</div>
          <div className="mt-2 text-3xl font-semibold text-sky-700 dark:text-sky-300">{data?.savings_rate || 0}%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300"><Zap size={16}/> Next Month Forecast</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">NPR {forecast?.projected_next_month?.toLocaleString() || 0}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Based on {forecast?.data_points_used || 0} historical days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-3">
          <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Weekly spending trend</h3>
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="week_start" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
          <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Category split</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 4).map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.category}</span>
                <span className="text-slate-600 dark:text-slate-300">NPR {Number(item.total).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
