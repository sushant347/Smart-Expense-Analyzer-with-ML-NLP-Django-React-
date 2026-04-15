import React, { useMemo, useState } from 'react';
import { arc as d3Arc, pie as d3Pie } from 'd3';

const PIE_COLORS = [
  '#16a34a', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#dc2626', // red
  '#0891b2', // cyan
  '#db2777', // pink
  '#65a30d', // lime
  '#ea580c', // orange
];

const currencyFormatter = new Intl.NumberFormat('en-US');
function formatAmount(v) {
  return `NPR ${currencyFormatter.format(Math.round(Number(v) || 0))}`;
}

export default function D3CategoryPie({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const normalizedData = useMemo(() =>
    data
      .map((item) => ({ category: item.category || 'Other', value: Number(item.total) || 0 }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value),
    [data]
  );

  const total = useMemo(() => normalizedData.reduce((sum, item) => sum + item.value, 0), [normalizedData]);

  const arcs = useMemo(() => {
    const pieGen = d3Pie().sort(null).value((d) => d.value).padAngle(0.018);
    return pieGen(normalizedData);
  }, [normalizedData]);

  // Larger radius for a standalone display without repeated list below
  const radius = 100;
  const innerRadius = 60;
  const svgW = 240;
  const svgH = 240;
  const cx = svgW / 2;
  const cy = svgH / 2;

  const baseArc = useMemo(() => d3Arc().innerRadius(innerRadius).outerRadius(radius), []);
  const hoverArc = useMemo(() => d3Arc().innerRadius(innerRadius).outerRadius(radius + 10), []);

  if (normalizedData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed text-center text-sm p-5"
        style={{ borderColor: 'var(--stroke-medium)', color: 'var(--text-muted)' }}
      >
        <span className="text-2xl mb-2">📊</span>
        No category data yet.<br />
        <span className="text-xs mt-1">Add transactions to see the split.</span>
      </div>
    );
  }

  const active = activeIndex !== null ? normalizedData[activeIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Pie + center label */}
      <div className="flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[220px]"
          style={{ flex: '0 0 auto' }}
          role="img"
          aria-label="Category split pie chart"
        >
          <g transform={`translate(${cx},${cy})`}>
            {arcs.map((slice, index) => {
              const isActive = activeIndex === index;
              const path = (isActive ? hoverArc : baseArc)(slice);
              const fill = PIE_COLORS[index % PIE_COLORS.length];
              return (
                <path
                  key={`${slice.data.category}-${index}`}
                  d={path}
                  fill={fill}
                  stroke="var(--surface-1)"
                  strokeWidth={isActive ? 3 : 1.5}
                  style={{ cursor: 'pointer', transition: 'all 160ms ease', opacity: activeIndex === null || isActive ? 1 : 0.5 }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onTouchStart={() => setActiveIndex(index)}
                  onTouchEnd={() => setActiveIndex(null)}
                />
              );
            })}

            {/* Donut hole */}
            <circle r={innerRadius - 4} fill="var(--surface-1)" />

            {/* Center text */}
            {active ? (
              <>
                <text y="-10" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {active.category}
                </text>
                <text y="6" textAnchor="middle" style={{ fill: PIE_COLORS[activeIndex % PIE_COLORS.length], fontSize: '16px', fontWeight: '800' }}>
                  {((active.value / total) * 100).toFixed(1)}%
                </text>
                <text y="22" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '9px' }}>
                  {formatAmount(active.value)}
                </text>
              </>
            ) : (
              <>
                <text y="-8" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total
                </text>
                <text y="10" textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: '13px', fontWeight: '700' }}>
                  {formatAmount(total)}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend grid — replaces the old sidebar legend */}
      <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2">
        {normalizedData.map((item, index) => {
          const isActive = activeIndex === index;
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
          return (
            <button
              key={item.category}
              type="button"
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition w-full"
              style={{
                background: isActive ? 'var(--surface-hover)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--stroke-medium)' : 'transparent'}`,
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="text-sm font-semibold flex-1 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{item.category}</span>
              <span className="flex flex-col items-end leading-tight flex-shrink-0">
                <span
                  className="text-sm font-bold"
                  style={{ color: isActive ? PIE_COLORS[index % PIE_COLORS.length] : 'var(--text-primary)' }}
                >
                  {percent}%
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {formatAmount(item.value)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
