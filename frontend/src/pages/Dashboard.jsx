import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
    return <div className="flex h-screen items-center justify-center">Loading Analytics...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-slate-100">Analytics Overview</h1>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
          Upload CSV
        </button>
      </header>

      {/* Bad Habit Alerts */}
      {data?.bad_habits?.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-4">
          <AlertTriangle className="text-red-400 mt-1" size={24} />
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Attention Required</h3>
            <ul className="text-slate-300 space-y-1">
              {data.bad_habits.map((habit, idx) => (
                <li key={idx}>• {habit}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-2"><TrendingUp size={18}/> Total Expenses</span>
          <span className="text-4xl font-bold text-slate-100">NPR {data?.total_expense.toLocaleString()}</span>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-2"><Wallet size={18}/> Total Income</span>
          <span className="text-4xl font-bold text-emerald-400">NPR {data?.total_income.toLocaleString()}</span>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col gap-2">
          <span className="text-slate-400 font-medium">Savings Rate</span>
          <span className="text-4xl font-bold text-blue-400">{data?.savings_rate}%</span>
        </div>
        <div className="bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 p-6 rounded-2xl border border-fuchsia-500/30 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-20">
            <Zap size={100} />
          </div>
          <span className="text-fuchsia-300 font-medium flex items-center gap-2 relative z-10"><Zap size={18}/> Predicted Next Month</span>
          <span className="text-4xl font-bold text-fuchsia-100 relative z-10">NPR {forecast?.projected_next_month?.toLocaleString() || '0'}</span>
          <span className="text-xs text-fuchsia-400/70 relative z-10 mt-1">Based on {forecast?.data_points_used || 0} historic tracking days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart: Categories */}
        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700 h-96">
          <h3 className="text-xl font-semibold mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={data?.category_breakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                {data?.category_breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Daily Trend */}
        <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700 h-96">
          <h3 className="text-xl font-semibold mb-6">Daily Trend</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={data?.daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
