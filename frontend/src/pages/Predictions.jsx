import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Zap } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Predictions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('predictions/next-month/').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-3">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Predictions</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Projected vs actual spending for your target month.</p>
      </div>

      {!data?.predictions?.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p>Not enough data yet.</p>
          <p className="mt-1 text-sm">Add more transaction history to improve predictions.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-300">Predicted Total</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">NPR {data.total_projected.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-300">Actual Total</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">NPR {data.total_actual.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-300">Gap</p>
              <p className={`text-3xl font-semibold ${data.gap >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                NPR {Math.abs(data.gap).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-300">Target period: {data.target_year}-{String(data.target_month).padStart(2, '0')}</p>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">Predicted Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.predictions} margin={{ top: 0, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="category" stroke="#64748b" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" />
                <Tooltip
                  formatter={(v) => [`NPR ${v.toLocaleString()}`, 'Predicted']}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="projected_amount" radius={[6, 6, 0, 0]}>
                  {data.predictions.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  <th className="text-left px-5 py-4">Category</th>
                  <th className="text-right px-5 py-4">Predicted Amount</th>
                  <th className="text-right px-5 py-4">Actual Amount</th>
                  <th className="text-right px-5 py-4">Data Points</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.map((p) => (
                  <tr key={p.category} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{p.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">NPR {p.projected_amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">NPR {p.actual_amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{p.data_points} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
