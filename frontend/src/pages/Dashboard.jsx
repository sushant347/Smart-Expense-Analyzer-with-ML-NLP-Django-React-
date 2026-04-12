import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Wallet, Zap } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, forecastRes, comparisonRes, recurringRes] = await Promise.all([
        api.get('analytics/summary/'),
        api.get('analytics/forecast/'),
        api.get('analytics/comparison/', { params: { span: 6 } }),
        api.get('analytics/recurring/', { params: { months: 6, min_occurrences: 3 } }),
      ]);

      setData(summaryRes.data);
      setForecast(forecastRes.data);
      setComparison(comparisonRes.data);
      setRecurring(recurringRes.data);
      setError('');
    } catch (err) {
      console.error("Failed to load analytics: ", err);
      setError('Unable to load analytics data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-600 dark:text-slate-300">Loading dashboard...</div>;
  }

  const categoryData = data?.monthly_category_breakdown || [];
  const weeklyData = data?.weekly_trends || [];
  const comparisonSeries = comparison?.series || [];
  const recurringItems = recurring?.recurring_expenses || [];
  const showOnboarding = (data?.total_expense || 0) === 0 && categoryData.length === 0;

  return (
    <div className="h-full min-h-0 space-y-4 overflow-y-auto pr-1">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm dark:border-slate-700">
        <img
          src="https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1600&q=80"
          alt="Smart Expense finance workspace"
          className="h-44 w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/50" />
        <div className="absolute inset-0 flex items-center justify-between gap-4 px-5 py-4 md:px-7">
          <div>
            <h1 className="text-3xl font-semibold text-white">Smart Expense</h1>
            <p className="mt-1 text-sm text-slate-100/90">Track smarter, cut waste, and build savings with AI-backed finance insights.</p>
          </div>
          <Link to="/upload" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
            Import statement
          </Link>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}

      {showOnboarding && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 dark:border-sky-800 dark:bg-sky-900/20">
          <h3 className="text-lg font-semibold text-sky-900 dark:text-sky-200">Start in under 2 minutes</h3>
          <p className="mt-1 text-sm text-sky-800 dark:text-sky-200">Upload a bank or wallet CSV, then review AI categories in Transactions.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/upload" className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">Upload CSV</Link>
            <Link to="/transactions" className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-sky-900/40">Review categories</Link>
          </div>
        </div>
      )}

      {data?.bad_habits?.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="mt-0.5 text-amber-600 dark:text-amber-300" size={20} />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Spending alert</h3>
            <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-200">
              {data.bad_habits.map((habit, idx) => (
                <li key={idx}>- {habit}</li>
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
          {data?.income_mode === 'profile' && (
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Using profile monthly income</div>
          )}
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
          <ResponsiveContainer width="100%" height={260}>
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
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                {categoryData.map((_entry, index) => (
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">6-month comparison</h3>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={comparisonSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.2} dot={false} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Recurring expense watchlist</h3>
          {recurringItems.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No recurring expense pattern detected yet.</p>
          ) : (
            <div className="space-y-2">
              {recurringItems.slice(0, 4).map((item) => (
                <div key={`${item.description}-${item.last_seen}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.description}</span>
                    <span className="text-slate-600 dark:text-slate-300">NPR {Number(item.predicted_monthly_impact).toLocaleString()}/mo</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                    {item.cadence} cadence, next expected {item.estimated_next_date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
