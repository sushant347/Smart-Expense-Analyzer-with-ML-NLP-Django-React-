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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="h-8 w-48 bg-slate-800 animate-pulse rounded mb-6" />
      <div className="h-64 bg-slate-800 animate-pulse rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Expense Predictions</h1>
        <p className="text-slate-400 text-sm mt-1">AI-powered forecast using your last 6 months of spending data</p>
      </div>

      {!data?.predictions?.length ? (
        <div className="text-center py-16 text-slate-500 bg-slate-800/30 rounded-2xl border border-slate-700">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p>Not enough data yet.</p>
          <p className="text-sm mt-1">Upload a few months of transactions to enable predictions.</p>
        </div>
      ) : (
        <>
          {/* Total Card */}
          <div className="bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 p-6 rounded-2xl border border-fuchsia-500/30">
            <p className="text-fuchsia-300 font-medium mb-1 flex items-center gap-2"><Zap size={18}/> Total Predicted Next Month</p>
            <p className="text-5xl font-bold text-fuchsia-100">NPR {data.total_projected.toLocaleString()}</p>
            <p className="text-xs text-fuchsia-400/60 mt-2">Based on {data.months_of_data} months of history</p>
          </div>

          {/* Per-category bar chart */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-6">Predicted Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.predictions} margin={{ top: 0, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" angle={-30} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(v) => [`NPR ${v.toLocaleString()}`, 'Predicted']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
                <Bar dataKey="projected_amount" radius={[6, 6, 0, 0]}>
                  {data.predictions.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table breakdown */}
          <div className="bg-slate-800/40 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left px-5 py-4">Category</th>
                  <th className="text-right px-5 py-4">Predicted Amount</th>
                  <th className="text-right px-5 py-4">Data Points</th>
                </tr>
              </thead>
              <tbody>
                {data.predictions.map((p, i) => (
                  <tr key={p.category} className="border-b border-slate-700/50">
                    <td className="px-5 py-3 text-slate-200">{p.category}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-100">NPR {p.projected_amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-slate-400">{p.data_points} days</td>
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
