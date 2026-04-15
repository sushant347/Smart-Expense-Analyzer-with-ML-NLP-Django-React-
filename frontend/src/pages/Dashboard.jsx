import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Wallet, TrendingDown,
  BarChart2, Plus, RefreshCw, RepeatIcon,
} from 'lucide-react';
import api from '../api/axios';
import D3CategoryPie from '../components/charts/D3CategoryPie';
import { ChartPanelSkeleton, ListPanelSkeleton, SkeletonBlock } from '../components/ui/SkeletonBlocks';

const fmt = new Intl.NumberFormat('en-US');

function formatCurrency(value) {
  return `NPR ${fmt.format(Math.round(Number(value) || 0))}`;
}
function formatShortDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatMonthLabel(value) {
  if (!value) return '';
  return String(value).slice(0, 3);
}

function StatCard({ icon, label, value, hint, accentColor }) {
  const Icon = icon;
  return (
    <div className="stat-card">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: accentColor || 'var(--accent)' }} />
      <div className="pl-3">
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${accentColor || 'var(--accent)'}18`, color: accentColor || 'var(--accent)' }}
          >
            <Icon size={16} />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="mt-1 text-xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {hint && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    </div>
  );
}

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--stroke-soft)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '13px',
};

const CATEGORY_RANGE_OPTIONS = [
  { key: 'one_week', label: '1 Week' },
  { key: 'two_week', label: '2 Weeks' },
  { key: 'six_month', label: '6 Months' },
  { key: 'lifetime', label: 'Lifetime' },
];

function getRangeStartDate(rangeKey) {
  const now = new Date();
  const start = new Date(now);

  if (rangeKey === 'one_week') {
    start.setDate(start.getDate() - 7);
  } else if (rangeKey === 'two_week') {
    start.setDate(start.getDate() - 14);
  } else if (rangeKey === 'six_month') {
    start.setMonth(start.getMonth() - 6);
  } else {
    return null;
  }

  return start.toISOString().split('T')[0];
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [categoryRange, setCategoryRange] = useState('six_month');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);
  useEffect(() => { fetchCategorySplit(categoryRange); }, [categoryRange]);

  const fetchCategorySplit = async (rangeKey) => {
    setCategoryLoading(true);
    try {
      const startDate = getRangeStartDate(rangeKey);
      const totals = new Map();

      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const params = {
          page,
          page_size: 100,
          transaction_type: 'DEBIT',
          ordering: '-date',
        };
        if (startDate) params.start_date = startDate;

        const res = await api.get('transactions/', { params });
        const payload = res.data || {};
        const rows = Array.isArray(payload.results)
          ? payload.results
          : (Array.isArray(payload) ? payload : []);

        rows.forEach((row) => {
          const category = row.category || 'Other';
          const amount = Number(row.amount) || 0;
          totals.set(category, (totals.get(category) || 0) + amount);
        });

        hasNext = Boolean(payload.next);
        page += 1;
        if (page > 200) break;
      }

      const normalized = Array.from(totals.entries())
        .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
        .sort((a, b) => b.total - a.total);

      setCategoryData(normalized);
    } catch (err) {
      console.error('Failed to load category split:', err);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, forecastRes, comparisonRes, recurringRes] = await Promise.all([
        api.get('analytics/summary/'),
        api.get('analytics/forecast/'),
        api.get('analytics/comparison/', { params: { span: 6 } }),
        // Lower min_occurrences to 2 — catches monthly recurring with just 2 months
        api.get('analytics/recurring/', { params: { months: 6, min_occurrences: 2 } }),
      ]);
      setData(summaryRes.data);
      setForecast(forecastRes.data);
      setComparison(comparisonRes.data);
      setRecurring(recurringRes.data);
      setError('');
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = useMemo(() => data?.weekly_trends || [], [data]);
  const comparisonSeries = useMemo(() => comparison?.series || [], [comparison]);
  const recurringItems = useMemo(() => recurring?.recurring_expenses || [], [recurring]);
  const weeklySummary = useMemo(() => {
    const values = weeklyData
      .map((row) => Number(row.amount) || 0)
      .filter((value) => value > 0);

    if (!values.length) return null;

    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      average: total / values.length,
      latest: values[values.length - 1],
      peak: Math.max(...values),
    };
  }, [weeklyData]);
  const showOnboarding = (data?.total_expense || 0) === 0 && categoryData.length === 0;

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-12 w-56" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <div className="space-y-4 sm:space-y-5">
            <ChartPanelSkeleton heightClass="h-64" />
            <ChartPanelSkeleton heightClass="h-52" />
          </div>
          <div className="space-y-4 sm:space-y-5">
            <ChartPanelSkeleton heightClass="h-64" />
            <ListPanelSkeleton rows={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your financial overview for this month</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={fetchAnalytics} className="btn-secondary gap-1.5 py-2 px-2.5 sm:px-3 text-xs sm:text-sm" title="Refresh">
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link to="/upload" className="btn-primary gap-1.5 py-2 px-2.5 sm:px-3 text-xs sm:text-sm">
            <Plus size={13} />
            <span className="hidden sm:inline">Import</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Onboarding ──────────────────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="rounded-xl border p-4 sm:p-5" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(22,163,74,0.25)' }}>
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--accent)' }}>Get started in 2 minutes</h3>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            Upload a bank or wallet CSV, or manually add your first transaction.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/upload" className="btn-primary py-1.5 text-xs">Upload CSV</Link>
            <Link to="/transactions" className="btn-secondary py-1.5 text-xs">Add manually</Link>
          </div>
        </div>
      )}

      {/* ── Spending alert ──────────────────────────────────────────────────── */}
      {data?.bad_habits?.length > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Spending alert</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {data.bad_habits.map((habit, idx) => <li key={idx}>• {habit}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(data?.total_expense)} accentColor="#dc2626" />
        <StatCard
          icon={Wallet} label="Total Income"
          value={formatCurrency(data?.total_income)}
          hint={data?.income_mode === 'profile' ? 'Profile income' : ''}
          accentColor="var(--accent)"
        />
        <StatCard icon={TrendingUp} label="Savings Rate" value={`${data?.savings_rate || 0}%`} accentColor="#d97706" />
        <StatCard
          icon={BarChart2} label="Next Mo. Forecast"
          value={formatCurrency(forecast?.projected_next_month)}
          hint={`${forecast?.data_points_used || 0} days of data`}
          accentColor="#7c3aed"
        />
      </div>

      {/* ── Analytics panels ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="space-y-4 sm:space-y-5">
          {/* Weekly bar chart */}
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">Weekly Spending</h3>
              <span className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                Last 6 weeks
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: 2, bottom: 18 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#15803d" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={formatShortDate}
                  stroke="var(--text-muted)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Week', position: 'insideBottom', offset: -6, fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tickFormatter={(v) => `${Math.round((Number(v) || 0) / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Amount (NPR)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <Tooltip cursor={{ fill: 'var(--surface-hover)' }} labelFormatter={(v) => `Week of ${formatShortDate(v)}`} formatter={(v) => [formatCurrency(v), 'Spending']} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
            {weeklySummary && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-hover)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Latest</p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(weeklySummary.latest)}</p>
                </div>
                <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-hover)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Average</p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(weeklySummary.average)}</p>
                </div>
                <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-hover)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Peak</p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(weeklySummary.peak)}</p>
                </div>
              </div>
            )}
          </div>

          {/* 6-month cashflow */}
          <div className="card p-4 sm:p-5">
            <h3 className="section-title mb-4">6-Month Cashflow</h3>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={comparisonSeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
                <XAxis dataKey="label" tickFormatter={formatMonthLabel} stroke="var(--text-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round((Number(v) || 0) / 1000)}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, name) => [formatCurrency(v), name]} contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2.5} fill="url(#incomeArea)" dot={false} activeDot={{ r: 4, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={2.5} fill="url(#expenseArea)" dot={false} activeDot={{ r: 4, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Category pie */}
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="section-title">Category Split</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_RANGE_OPTIONS.map((option) => {
                  const isActive = categoryRange === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setCategoryRange(option.key)}
                      className="rounded-md px-2.5 py-1 text-xs font-semibold transition"
                      style={{
                        background: isActive ? 'var(--accent-subtle)' : 'var(--surface-hover)',
                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        border: `1px solid ${isActive ? 'rgba(22,163,74,0.3)' : 'var(--stroke-soft)'}`,
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {categoryLoading ? (
              <SkeletonBlock className="h-56" />
            ) : (
              <D3CategoryPie data={categoryData} />
            )}
          </div>

          {/* Recurring expenses watchlist */}
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">
                <RepeatIcon size={15} style={{ color: 'var(--accent)' }} />
                Recurring Expenses
              </h3>
              {recurringItems.length > 0 && (
                <span className="badge badge-amber">{recurringItems.length} detected</span>
              )}
            </div>

            {recurringItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full mb-3"
                  style={{ background: 'var(--surface-hover)' }}
                >
                  <RepeatIcon size={22} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>No recurring patterns yet</p>
                <p className="text-xs mt-1 max-w-[220px]" style={{ color: 'var(--text-muted)' }}>
                  Recurring expenses are detected when the same transaction appears 2+ times across different months.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recurringItems.slice(0, 5).map((item) => (
                  <div
                    key={`${item.description}-${item.last_seen}`}
                    className="flex items-start justify-between rounded-lg p-3 gap-3"
                    style={{ background: 'var(--surface-hover)', border: '1px solid var(--stroke-soft)' }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {item.cadence} · next: {item.estimated_next_date}
                      </p>
                    </div>
                    <span className="badge badge-red ml-1 flex-shrink-0 whitespace-nowrap">
                      {formatCurrency(item.predicted_monthly_impact)}/mo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
