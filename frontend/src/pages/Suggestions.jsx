import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  Info,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import api from '../api/axios';
import { ChartPanelSkeleton, ListPanelSkeleton, SkeletonBlock } from '../components/ui/SkeletonBlocks';

const SIMULATION_CATEGORIES = ['Shopping', 'Entertainment', 'Food', 'Transport', 'Other'];
const SIMULATION_DEBOUNCE_MS = 320;

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-1)',
  border: '1px solid var(--stroke-soft)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  fontSize: '13px',
};

const GOAL_STATUS_STYLE = {
  exceeded: { label: 'Exceeded', bg: 'var(--danger-subtle)', color: 'var(--danger)' },
  reached: { label: 'Reached', bg: 'var(--amber-subtle)', color: 'var(--amber)' },
  approaching: { label: 'Approaching', bg: 'var(--amber-subtle)', color: 'var(--amber)' },
  on_track: { label: 'On Track', bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  not_set: { label: 'Not Set', bg: 'var(--surface-hover)', color: 'var(--text-muted)' },
};

const GOAL_STATUS_ORDER = {
  exceeded: 0,
  reached: 1,
  approaching: 2,
  on_track: 3,
  not_set: 4,
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNpr = (value) => `NPR ${Math.round(toNumber(value)).toLocaleString()}`;

function InsightCard({ item }) {
  const config = {
    warning: {
      icon: Zap,
      bg: 'var(--amber-subtle)',
      border: 'rgba(217,119,6,0.25)',
      iconColor: 'var(--amber)',
      textColor: 'var(--text-secondary)',
    },
    danger: {
      icon: AlertCircle,
      bg: 'var(--danger-subtle)',
      border: 'rgba(220,38,38,0.25)',
      iconColor: 'var(--danger)',
      textColor: 'var(--text-secondary)',
    },
    info: {
      icon: Info,
      bg: 'var(--accent-subtle)',
      border: 'rgba(22,163,74,0.25)',
      iconColor: 'var(--accent)',
      textColor: 'var(--text-secondary)',
    },
  }[item.type] || {
    icon: Info,
    bg: 'var(--surface-hover)',
    border: 'var(--stroke-soft)',
    iconColor: 'var(--text-muted)',
    textColor: 'var(--text-secondary)',
  };

  const Icon = config.icon;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: config.bg, borderColor: config.border }}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} style={{ color: config.iconColor, flexShrink: 0, marginTop: '2px' }} />
        <div>
          {item.title && (
            <p className="text-xs font-semibold mb-0.5" style={{ color: config.iconColor }}>
              {item.title}
            </p>
          )}
          <p className="text-sm leading-relaxed" style={{ color: config.textColor }}>{item.message}</p>
        </div>
      </div>
    </div>
  );
}

function GoalProgressRow({ row }) {
  const statusStyle = GOAL_STATUS_STYLE[row.status] || GOAL_STATUS_STYLE.on_track;
  const usedPctRaw = Math.max(0, toNumber(row.utilization_pct));
  const usedPctClamped = Math.min(100, usedPctRaw);
  const goal = toNumber(row.goal);
  const actual = toNumber(row.actual);
  const remaining = toNumber(row.remaining);

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-1)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{row.category}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {formatNpr(actual)} of {formatNpr(goal)} used
          </p>
        </div>
        <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-3">
        <div
          className="h-2 w-full rounded-full"
          style={{ background: 'var(--surface-hover)' }}
        >
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${usedPctClamped}%`,
              background: statusStyle.color,
            }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Used: {usedPctRaw.toFixed(0)}%</span>
        {remaining >= 0 ? (
          <span>Remaining: {formatNpr(remaining)}</span>
        ) : (
          <span style={{ color: 'var(--danger)' }}>Over by {formatNpr(Math.abs(remaining))}</span>
        )}
      </div>
    </div>
  );
}

export default function Suggestions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [simulationReduction, setSimulationReduction] = useState(0);
  const [simulationCategory, setSimulationCategory] = useState('Shopping');
  const [simulation, setSimulation] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState('');

  const simulationRequestRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setLoadError('');

    api.get('suggestions/')
      .then((res) => {
        if (!isMounted) return;
        setData(res.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadError('Unable to load suggestions right now. Please refresh.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return undefined;

    const requestId = ++simulationRequestRef.current;
    const timer = setTimeout(async () => {
      setSimulationLoading(true);
      setSimulationError('');

      try {
        const res = await api.post('suggestions/simulate/', {
          category: simulationCategory,
          reduce_percent: simulationReduction,
        });

        if (requestId === simulationRequestRef.current) {
          setSimulation(res.data);
        }
      } catch {
        if (requestId === simulationRequestRef.current) {
          setSimulationError('Simulation update failed. Try adjusting again.');
        }
      } finally {
        if (requestId === simulationRequestRef.current) {
          setSimulationLoading(false);
        }
      }
    }, SIMULATION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [data, simulationCategory, simulationReduction]);

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-20" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          <ChartPanelSkeleton heightClass="h-56" />
          <ListPanelSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert alert-danger">
        <AlertCircle size={16} className="flex-shrink-0" />
        {loadError || 'Unable to load suggestions.'}
      </div>
    );
  }

  const {
    budget_actual = { needs: 0, wants: 0, savings: 0 },
    budget_recommended = { needs: 0, wants: 0, savings: 0 },
    tips = [],
    notifications = [],
    category_goal_progress: categoryGoalProgress = [],
  } = data;

  const allInsights = [...notifications, ...tips];

  const sortedGoalRows = [...categoryGoalProgress].sort((a, b) => {
    const aOrder = GOAL_STATUS_ORDER[a.status] ?? 99;
    const bOrder = GOAL_STATUS_ORDER[b.status] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.category).localeCompare(String(b.category));
  });

  const monthsToGoalActual = simulation?.months_to_goal_current ?? Infinity;
  const monthsToGoalSimulated = simulation?.months_to_goal_projected ?? Infinity;

  const chartData = [
    { name: 'Needs', Actual: budget_actual.needs, Recommended: budget_recommended.needs },
    { name: 'Wants', Actual: budget_actual.wants, Recommended: budget_recommended.wants },
    { name: 'Savings', Actual: budget_actual.savings, Recommended: budget_recommended.savings },
  ];

  const timeSaved = (monthsToGoalActual !== Infinity && monthsToGoalSimulated !== Infinity)
    ? (monthsToGoalActual - monthsToGoalSimulated).toFixed(1)
    : null;

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Lightbulb size={22} style={{ color: 'var(--amber)' }} />
          Budget Suggestions
        </h1>
        <p className="page-subtitle">Cleaner insights, goal progress, and a smoother savings simulation.</p>
      </div>

      {loadError && (
        <div className="alert alert-danger">
          <AlertCircle size={16} className="flex-shrink-0" />
          {loadError}
        </div>
      )}

      <div className="card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <BellRing size={16} style={{ color: 'var(--amber)' }} />
          <h2 className="section-title">Smart Suggestion Feed</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Prioritized alerts and recommendations generated from this month&#39;s data.
        </p>

        {allInsights.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {allInsights.map((item, idx) => (
              <InsightCard key={`${item.type || 'info'}-${idx}`} item={item} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border p-5 text-center text-sm"
            style={{ borderColor: 'var(--stroke-soft)', color: 'var(--text-muted)' }}
          >
            No active suggestions right now. Keep tracking to receive more tailored insights.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <h2 className="section-title mb-1">50 / 30 / 20 Budget Split</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Your current month vs recommended allocation
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--stroke-soft)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
              <Bar dataKey="Actual" fill="#dc2626" radius={[5, 5, 0, 0]} maxBarSize={44} />
              <Bar dataKey="Recommended" fill="#16a34a" radius={[5, 5, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Target size={16} style={{ color: 'var(--accent)' }} />
              Savings Simulation
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Simulation updates automatically after you pause slider movement.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select
                value={simulationCategory}
                onChange={(e) => setSimulationCategory(e.target.value)}
                className="input-surface text-sm"
                style={{ width: 'auto', minWidth: '140px' }}
              >
                {SIMULATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Reduce spending by
                </span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: 'var(--accent)' }}
                >
                  {simulationReduction}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simulationReduction}
                onChange={(e) => setSimulationReduction(parseInt(e.target.value, 10))}
                className="w-full"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>0%</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-flex items-center gap-1.5">
                {simulationLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {simulationLoading ? 'Updating simulation…' : 'Simulation synced'}
              </span>
              {simulationError && <span style={{ color: 'var(--danger)' }}>{simulationError}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div
              className="rounded-xl border p-4"
              style={{ background: 'var(--surface-hover)', borderColor: 'var(--stroke-soft)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Current Timeline
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {monthsToGoalActual === Infinity ? '∞' : monthsToGoalActual.toFixed(1)}
                <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>mo</span>
              </p>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'var(--accent-subtle)',
                borderColor: 'rgba(22,163,74,0.25)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
                Simulated
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {monthsToGoalSimulated === Infinity ? '∞' : monthsToGoalSimulated.toFixed(1)}
                <span className="text-sm font-normal ml-1">mo</span>
              </p>
            </div>
          </div>

          {simulationReduction > 0 && timeSaved !== null && (
            <div
              className="flex items-start gap-3 rounded-xl border p-4 text-sm"
              style={{
                background: 'var(--accent-subtle)',
                borderColor: 'rgba(22,163,74,0.25)',
              }}
            >
              <TrendingDown size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Cutting <strong>{simulationCategory}</strong> by {simulationReduction}% saves{' '}
                <strong>NPR {simulation?.monthly_extra_saving?.toLocaleString() || 0}</strong>/month —
                reaching your goal <strong>{timeSaved} months</strong> sooner.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h2 className="section-title mb-1">Category Goal Progress</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Track each category against its monthly goal with clear progress bars.
        </p>

        {sortedGoalRows.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {sortedGoalRows.map((row) => <GoalProgressRow key={row.category} row={row} />)}
          </div>
        ) : (
          <div
            className="rounded-xl border p-5 text-sm"
            style={{ borderColor: 'var(--stroke-soft)', color: 'var(--text-muted)' }}
          >
            No category goals set yet. Add monthly category goals from Settings to see progress here.
          </div>
        )}
      </div>
    </div>
  );
}
