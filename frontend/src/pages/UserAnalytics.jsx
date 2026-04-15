import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarClock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Line,
} from 'recharts';
import api from '../api/axios';
import {
  ChartPanelSkeleton,
  ListPanelSkeleton,
  SkeletonBlock,
  TablePanelSkeleton,
} from '../components/ui/SkeletonBlocks';

const RANGE_OPTIONS = [
  { value: 3, label: '3M' },
  { value: 6, label: '6M' },
  { value: 12, label: '12M' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--stroke-soft)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '13px',
};

const numberFormatter = new Intl.NumberFormat('en-US');

function formatCurrency(value) {
  return `NPR ${numberFormatter.format(Math.round(Number(value) || 0))}`;
}

function shiftMonth(year, month, offset) {
  const absolute = (year * 12 + (month - 1)) + offset;
  return {
    year: Math.floor(absolute / 12),
    month: (absolute % 12) + 1,
  };
}

function getRangeStartDate(spanMonths) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (spanMonths - 1), 1);
  return start.toISOString().split('T')[0];
}

function formatMonthTick(value) {
  if (!value || typeof value !== 'string') return value;
  const [yearString, monthString] = value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  if (!year || !month) return value;

  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
  });
}

function StatTile({ icon, label, value, hint, accent }) {
  return (
    <div className="stat-card">
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ background: accent || 'var(--accent)' }}
      />
      <div className="pl-3">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent || 'var(--accent)'}18`, color: accent || 'var(--accent)' }}>
          {React.createElement(icon, { size: 16 })}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="mt-1 text-xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {hint && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    </div>
  );
}

export default function UserAnalytics() {
  const [rangeMonths, setRangeMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comparisonSeries, setComparisonSeries] = useState([]);
  const [recurringItems, setRecurringItems] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [previousSummary, setPreviousSummary] = useState(null);
  const [rangeTransactions, setRangeTransactions] = useState([]);

  const fetchRangeTransactions = useCallback(async (startDate) => {
    const rows = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const params = {
        page,
        page_size: 100,
        transaction_type: 'DEBIT',
        ordering: '-date',
        start_date: startDate,
      };

      const res = await api.get('transactions/', { params });
      const payload = res.data || {};
      const batch = Array.isArray(payload.results)
        ? payload.results
        : (Array.isArray(payload) ? payload : []);

      rows.push(...batch);
      hasNext = Boolean(payload.next);
      page += 1;

      if (page > 200) break;
    }

    return rows;
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const previous = shiftMonth(currentYear, currentMonth, -1);
      const startDate = getRangeStartDate(rangeMonths);

      const [comparisonRes, recurringRes, forecastRes, currentRes, previousRes, txRes] = await Promise.all([
        api.get('analytics/comparison/', {
          params: { year: currentYear, month: currentMonth, span: rangeMonths },
        }),
        api.get('analytics/recurring/', {
          params: { months: rangeMonths, min_occurrences: 2 },
        }),
        api.get('analytics/forecast/'),
        api.get('analytics/summary/', {
          params: { year: currentYear, month: currentMonth },
        }),
        api.get('analytics/summary/', {
          params: { year: previous.year, month: previous.month },
        }),
        fetchRangeTransactions(startDate),
      ]);

      setComparisonSeries(Array.isArray(comparisonRes.data?.series) ? comparisonRes.data.series : []);
      setRecurringItems(Array.isArray(recurringRes.data?.recurring_expenses) ? recurringRes.data.recurring_expenses : []);
      setForecastData(forecastRes.data || null);
      setCurrentSummary(currentRes.data || null);
      setPreviousSummary(previousRes.data || null);
      setRangeTransactions(Array.isArray(txRes) ? txRes : []);
    } catch (err) {
      console.error('Failed to load user analytics:', err);
      setError('Unable to load analytics insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchRangeTransactions, rangeMonths]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const avgExpense = useMemo(() => {
    if (!comparisonSeries.length) return 0;
    const total = comparisonSeries.reduce((sum, row) => sum + (Number(row.expense) || 0), 0);
    return total / comparisonSeries.length;
  }, [comparisonSeries]);

  const avgSavingsRate = useMemo(() => {
    if (!comparisonSeries.length) return 0;
    const total = comparisonSeries.reduce((sum, row) => sum + (Number(row.savings_rate) || 0), 0);
    return total / comparisonSeries.length;
  }, [comparisonSeries]);

  const expenseConsistency = useMemo(() => {
    if (!comparisonSeries.length || avgExpense <= 0) return 0;
    const variance = comparisonSeries.reduce((sum, row) => {
      const value = Number(row.expense) || 0;
      return sum + ((value - avgExpense) ** 2);
    }, 0) / comparisonSeries.length;

    const deviation = Math.sqrt(variance);
    const score = 100 - (deviation / avgExpense) * 100;
    return Math.max(0, Math.min(100, score));
  }, [comparisonSeries, avgExpense]);

  const currentExpense = Number(currentSummary?.total_expense) || 0;
  const previousExpense = Number(previousSummary?.total_expense) || 0;
  const monthDelta = currentExpense - previousExpense;
  const monthDeltaPct = previousExpense > 0 ? (monthDelta / previousExpense) * 100 : null;

  const forecastValue = Number(forecastData?.projected_next_month) || 0;
  const forecastDelta = forecastValue - avgExpense;
  const forecastDeltaPct = avgExpense > 0 ? (forecastDelta / avgExpense) * 100 : null;

  const weekdaySpendData = useMemo(() => {
    const totals = Array(7).fill(0);

    rangeTransactions.forEach((txn) => {
      const amount = Number(txn.amount) || 0;
      if (amount <= 0) return;

      const parsedDate = new Date(txn.date);
      if (Number.isNaN(parsedDate.getTime())) return;

      totals[parsedDate.getDay()] += amount;
    });

    return WEEKDAY_LABELS.map((label, index) => ({
      day: label,
      amount: Math.round(totals[index] * 100) / 100,
    }));
  }, [rangeTransactions]);

  const topMerchants = useMemo(() => {
    const totals = new Map();

    rangeTransactions.forEach((txn) => {
      const description = (txn.description || '').trim() || 'Unknown merchant';
      const amount = Number(txn.amount) || 0;
      if (amount <= 0) return;

      const current = totals.get(description) || { total: 0, count: 0 };
      current.total += amount;
      current.count += 1;
      totals.set(description, current);
    });

    return Array.from(totals.entries())
      .map(([description, values]) => ({
        description,
        total: Math.round(values.total * 100) / 100,
        count: values.count,
        average: values.count > 0 ? values.total / values.count : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [rangeTransactions]);

  const categoryMomentum = useMemo(() => {
    const currentRows = Array.isArray(currentSummary?.monthly_category_breakdown)
      ? currentSummary.monthly_category_breakdown
      : [];
    const previousRows = Array.isArray(previousSummary?.monthly_category_breakdown)
      ? previousSummary.monthly_category_breakdown
      : [];

    const previousMap = new Map(
      previousRows.map((row) => [row.category, Number(row.total) || 0]),
    );

    const totalCurrentExpense = Number(currentSummary?.total_expense) || 0;

    return currentRows
      .map((row) => {
        const currentValue = Number(row.total) || 0;
        const previousValue = previousMap.get(row.category) || 0;
        const delta = currentValue - previousValue;
        const deltaPct = previousValue > 0 ? (delta / previousValue) * 100 : null;

        return {
          category: row.category,
          current: currentValue,
          previous: previousValue,
          delta,
          deltaPct,
          share: totalCurrentExpense > 0 ? (currentValue / totalCurrentExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.current - a.current);
  }, [currentSummary, previousSummary]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-10 w-56 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonBlock key={index} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <ChartPanelSkeleton heightClass="h-64" />
          <ChartPanelSkeleton heightClass="h-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <ListPanelSkeleton rows={6} />
          <ListPanelSkeleton rows={5} />
        </div>
        <TablePanelSkeleton rows={6} headerCount={5} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">User Analytics</h1>
          <p className="page-subtitle">Behavior insights, trend diagnostics, and recurring spend signals.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-1)' }}>
            {RANGE_OPTIONS.map((option) => {
              const isActive = rangeMonths === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRangeMonths(option.value)}
                  className="rounded-md px-2.5 py-1 text-xs font-semibold transition"
                  style={{
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            className="btn-secondary gap-1.5 px-3 py-2 text-xs"
            title="Refresh analytics"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!comparisonSeries.length ? (
        <div className="card p-8 text-center">
          <Activity size={34} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>No analytics yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Add more transactions to unlock trend and behavior insights.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile
              icon={TrendingDown}
              label="Avg Monthly Spend"
              value={formatCurrency(avgExpense)}
              hint={`Across last ${comparisonSeries.length} month(s)`}
              accent="#dc2626"
            />
            <StatTile
              icon={TrendingUp}
              label="Avg Savings Rate"
              value={`${avgSavingsRate.toFixed(1)}%`}
              hint={`Consistency ${expenseConsistency.toFixed(0)} / 100`}
              accent="var(--accent)"
            />
            <StatTile
              icon={CalendarClock}
              label="This vs Last Month"
              value={`${monthDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(monthDelta))}`}
              hint={monthDeltaPct === null ? 'No previous month baseline' : `${monthDeltaPct >= 0 ? '+' : ''}${monthDeltaPct.toFixed(1)}% month-over-month`}
              accent={monthDelta >= 0 ? '#d97706' : 'var(--accent)'}
            />
            <StatTile
              icon={Activity}
              label="Forecast vs Average"
              value={`${forecastDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(forecastDelta))}`}
              hint={forecastDeltaPct === null ? 'Average baseline unavailable' : `${forecastDeltaPct >= 0 ? '+' : ''}${forecastDeltaPct.toFixed(1)}% vs avg monthly spend`}
              accent="#7c3aed"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <h3 className="section-title mb-4">Cashflow Trend</h3>
              <ResponsiveContainer width="100%" height={255}>
                <ComposedChart data={comparisonSeries} margin={{ top: 4, right: 6, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="uaIncomeArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--text-muted)"
                    tickFormatter={formatMonthTick}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round((Number(value) || 0) / 1000)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(Number(value) || 0)}%`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value, name) => {
                      if (name === 'Savings Rate') return [`${Number(value || 0).toFixed(1)}%`, name];
                      return [formatCurrency(value), name];
                    }}
                    labelFormatter={(value) => `Month: ${value}`}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="income" name="Income" stroke="#16a34a" fill="url(#uaIncomeArea)" strokeWidth={2} dot={false} />
                  <Bar yAxisId="left" dataKey="expense" name="Expense" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Line yAxisId="right" type="monotone" dataKey="savings_rate" name="Savings Rate" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4 sm:p-5">
              <h3 className="section-title mb-4">Weekly Rhythm (by Weekday)</h3>
              <ResponsiveContainer width="100%" height={255}>
                <BarChart data={weekdaySpendData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round((Number(value) || 0) / 1000)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [formatCurrency(value), 'Spend']}
                  />
                  <Bar dataKey="amount" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <div className="card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="section-title">Top Merchants</h3>
                <span className="badge badge-neutral">{topMerchants.length} tracked</span>
              </div>

              {topMerchants.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Not enough debit transactions in the selected range.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topMerchants.map((merchant) => (
                    <div
                      key={merchant.description}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3"
                      style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-1)' }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {merchant.description}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {merchant.count} txn(s) | avg {formatCurrency(merchant.average)}
                        </p>
                      </div>
                      <span className="badge badge-amber flex-shrink-0">{formatCurrency(merchant.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="section-title">Recurring Signals</h3>
                <span className="badge badge-neutral">{recurringItems.length} detected</span>
              </div>

              {recurringItems.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No recurring expense patterns found yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recurringItems.slice(0, 6).map((item) => (
                    <div
                      key={`${item.description}-${item.last_seen}`}
                      className="rounded-lg border p-3"
                      style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-1)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {item.description}
                          </p>
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {item.cadence} | next {item.estimated_next_date}
                          </p>
                        </div>
                        <span className="badge badge-red flex-shrink-0">{formatCurrency(item.predicted_monthly_impact)}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--stroke-soft)' }}>
              <h3 className="section-title">Category Momentum</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Current month compared to previous month.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Current</th>
                    <th className="text-right">Previous</th>
                    <th className="text-right">Share</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryMomentum.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No category spending data available for this month.
                      </td>
                    </tr>
                  ) : (
                    categoryMomentum.map((row) => {
                      const isIncrease = row.delta > 0;
                      const hasPrevious = row.previous > 0;
                      const deltaLabel = hasPrevious
                        ? `${isIncrease ? '+' : ''}${row.deltaPct.toFixed(1)}%`
                        : 'New / no baseline';

                      return (
                        <tr key={row.category}>
                          <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.category}</td>
                          <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.current)}</td>
                          <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.previous)}</td>
                          <td className="text-right text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{row.share.toFixed(1)}%</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: isIncrease ? 'var(--amber-subtle)' : 'var(--accent-subtle)',
                                color: isIncrease ? 'var(--amber)' : 'var(--accent)',
                              }}
                            >
                              {isIncrease ? '+' : ''}{formatCurrency(row.delta)} ({deltaLabel})
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
