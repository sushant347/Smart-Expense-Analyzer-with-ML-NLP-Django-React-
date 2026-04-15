import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import api from '../api/axios';
import { ChartPanelSkeleton, SkeletonBlock, TablePanelSkeleton } from '../components/ui/SkeletonBlocks';

const CHART_COLORS = ['#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d', '#ea580c'];

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--stroke-soft)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '13px',
};

const formatNpr = (value) => `NPR ${Math.round(Number(value) || 0).toLocaleString()}`;
const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

function PredStat({ label, value, sub, valueColor, note }) {
  return (
    <div className="stat-card">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: valueColor || 'var(--accent)' }} />
      <div className="pl-3">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg sm:text-2xl font-bold tracking-tight" style={{ color: valueColor || 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        {note && (
          <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Info size={10} />{note}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Predictions() {
  const [data, setData] = useState(null);
  const [currentMonthExpense, setCurrentMonthExpense] = useState(null);
  const [currentMonthCategoryMap, setCurrentMonthCategoryMap] = useState({});
  const [currentMonthLabel, setCurrentMonthLabel] = useState('Current Month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    Promise.all([
      api.get('predictions/next-month/'),
      // Also fetch CURRENT month actual spend so the stat card is meaningful
      api.get('analytics/summary/', { params: { year: now.getFullYear(), month: now.getMonth() + 1 } }),
    ])
      .then(([predRes, summaryRes]) => {
        setData(predRes.data);
        const summaryPayload = summaryRes.data || {};
        setCurrentMonthExpense(summaryPayload.total_expense ?? null);

        const categoryRows = Array.isArray(summaryPayload.monthly_category_breakdown)
          ? summaryPayload.monthly_category_breakdown
          : [];
        const baselineByCategory = {};
        categoryRows.forEach((row) => {
          const key = normalizeCategoryKey(row.category);
          if (!key) return;
          baselineByCategory[key] = (baselineByCategory[key] || 0) + (Number(row.total) || 0);
        });
        setCurrentMonthCategoryMap(baselineByCategory);

        setCurrentMonthLabel(
          new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
        );
      })
      .catch(() => setError('Failed to load predictions.'))
      .finally(() => setLoading(false));
  }, []);

  const totalProjected = Number(data?.total_projected || 0);

  const organizedPredictions = useMemo(() => {
    const rows = Array.isArray(data?.predictions) ? data.predictions : [];

    return rows
      .map((row) => {
        const apiActual = Number(row.actual_amount) || 0;
        const baselineActual = Number(currentMonthCategoryMap[normalizeCategoryKey(row.category)]) || 0;
        const effectiveActual = apiActual > 0 ? apiActual : baselineActual;
        const projectedAmount = Number(row.projected_amount) || 0;
        const variance = projectedAmount - effectiveActual;
        return {
          ...row,
          projected_amount: projectedAmount,
          effective_actual_amount: effectiveActual,
          variance,
          projected_share: totalProjected > 0 ? (projectedAmount / totalProjected) * 100 : 0,
          actual_source: apiActual > 0 ? 'target' : (baselineActual > 0 ? 'current' : 'none'),
        };
      })
      .sort((a, b) => b.projected_amount - a.projected_amount);
  }, [data, currentMonthCategoryMap, totalProjected]);

  const usesCurrentMonthBaseline = organizedPredictions.some((row) => row.actual_source === 'current');

  const currentExpenseValue = Number(currentMonthExpense || 0);
  const hasCurrentExpense = currentMonthExpense !== null;
  const gapVsCurrent = hasCurrentExpense ? totalProjected - currentExpenseValue : null;
  const projectionRatio = hasCurrentExpense && currentExpenseValue > 0
    ? totalProjected / currentExpenseValue
    : null;
  const showProjectionWarning = projectionRatio !== null && projectionRatio >= 1.8;
  const gapLabel = !hasCurrentExpense
    ? 'Gap vs This Month'
    : (gapVsCurrent >= 0 ? 'Gap vs This Month' : 'Ahead vs This Month');
  const gapSub = !hasCurrentExpense
    ? 'Current-month actual is unavailable'
    : (gapVsCurrent >= 0 ? 'Projected > current month actual' : 'Projected < current month actual');
  const gapColor = !hasCurrentExpense
    ? 'var(--text-muted)'
    : (gapVsCurrent >= 0 ? '#d97706' : 'var(--accent)');

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
        </div>
        <ChartPanelSkeleton heightClass="h-72" />
        <TablePanelSkeleton rows={6} headerCount={5} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Predictions</h1>
          <p className="page-subtitle">Projected vs actual spending for next month.</p>
        </div>
        {data?.target_year && (
          <span
            className="rounded-lg px-3 py-2 text-xs font-semibold"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--stroke-soft)', color: 'var(--text-muted)' }}
          >
            Target: {data.target_year}-{String(data.target_month).padStart(2, '0')}
          </span>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {!organizedPredictions.length ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-20 text-center"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--stroke-soft)' }}
        >
          <TrendingUp size={40} style={{ color: 'var(--stroke-medium)', marginBottom: '12px' }} />
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Not enough data yet</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Add more transaction history to generate predictions.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <PredStat
              label="Next Month Forecast"
              value={formatNpr(totalProjected)}
              sub="Predicted spend based on history"
              note={`${data?.months_of_data || 0} month(s) of expense history`}
              valueColor="#7c3aed"
            />
            <PredStat
              label="This Month (actual)"
              value={currentMonthExpense !== null ? formatNpr(currentExpenseValue) : '—'}
              sub={`As of today — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
              valueColor="var(--accent)"
            />
            <PredStat
              label={gapLabel}
              value={gapVsCurrent !== null ? formatNpr(Math.abs(gapVsCurrent)) : '—'}
              sub={gapSub}
              note="Comparison: next-month forecast vs this-month actual"
              valueColor={gapColor}
            />
          </div>

          {showProjectionWarning && (
            <div className="alert alert-warning">
              <AlertCircle size={16} className="flex-shrink-0" />
              Forecast is significantly higher than this month. This can happen when recent spending accelerates; review category bars below for drivers.
            </div>
          )}

          {/* Bar chart */}
          <div className="card p-4 sm:p-5">
            <h2 className="section-title mb-5">Predicted Spending by Category</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={organizedPredictions}
                margin={{ top: 4, right: 8, left: -12, bottom: 28 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="var(--text-muted)"
                  angle={-30}
                  textAnchor="end"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v) => [formatNpr(v), 'Predicted']}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Bar dataKey="projected_amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {organizedPredictions.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--stroke-soft)' }}>
              <h2 className="section-title">Category Breakdown</h2>
            </div>
            {usesCurrentMonthBaseline && (
              <div className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--stroke-soft)', background: 'var(--surface-hover)' }}>
                Actual values are shown from {currentMonthLabel} because next-month actuals are not available yet.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="data-table min-w-[780px] table-fixed">
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Projected (Next)</th>
                    <th>Actual ({usesCurrentMonthBaseline ? 'Current' : 'Target'})</th>
                    <th>Share</th>
                    <th>Data Points</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedPredictions.map((p, idx) => {
                    const diff = p.variance;
                    const over = diff > 0;
                    return (
                      <tr key={p.category}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                            />
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.category}</span>
                          </div>
                        </td>
                        <td className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {formatNpr(p.projected_amount)}
                        </td>
                        <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {formatNpr(p.effective_actual_amount)}
                        </td>
                        <td className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {p.projected_share.toFixed(1)}%
                        </td>
                        <td className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {p.data_points} days
                        </td>
                        <td>
                          <span
                            className="badge inline-flex text-xs tabular-nums"
                            style={{
                              background: over ? 'var(--amber-subtle)' : 'var(--accent-subtle)',
                              color: over ? 'var(--amber)' : 'var(--accent)',
                            }}
                          >
                            {over ? '+' : '−'}{formatNpr(Math.abs(diff))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
