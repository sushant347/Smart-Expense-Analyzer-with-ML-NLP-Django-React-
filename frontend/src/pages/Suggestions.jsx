import React, { useCallback, useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, Target, Zap, Info, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';

const SIMULATION_CATEGORIES = ['Shopping', 'Entertainment', 'Food', 'Transport', 'Other'];

export default function Suggestions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationReduction, setSimulationReduction] = useState(0);
  const [simulationCategory, setSimulationCategory] = useState('Shopping');
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('suggestions/');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load suggestions: ", err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = useCallback(async () => {
    try {
      const res = await api.post('suggestions/simulate/', {
        category: simulationCategory,
        reduce_percent: simulationReduction,
      });
      setSimulation(res.data);
    } catch (err) {
      console.error('Simulation failed', err);
    }
  }, [simulationCategory, simulationReduction]);

  useEffect(() => {
    if (!loading) {
      runSimulation();
    }
  }, [loading, runSimulation]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-600 dark:text-slate-300">Loading suggestions...</div>;
  }

  const { budget_actual, budget_recommended, tips } = data;

  const monthsToGoalActual = simulation?.months_to_goal_current ?? Infinity;
  const monthsToGoalSimulated = simulation?.months_to_goal_projected ?? Infinity;

  const chartData = [
    { name: 'Needs', Actual: budget_actual.needs, Recommended: budget_recommended.needs },
    { name: 'Wants', Actual: budget_actual.wants, Recommended: budget_recommended.wants },
    { name: 'Savings', Actual: budget_actual.savings, Recommended: budget_recommended.savings },
  ];

  return (
    <div className="h-full space-y-6 overflow-y-auto pr-1">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
          <Lightbulb className="text-sky-600 dark:text-sky-300" /> Budget Suggestions
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Recommendations based on your monthly spend distribution.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tips.map((tip, idx) => (
          <div key={idx} className={`flex items-start gap-3 rounded-xl border p-4 ${
            tip.type === 'warning' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 
            tip.type === 'danger' ? 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20' : 
            'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20'
          }`}>
            {tip.type === 'warning' ? <Zap className="mt-0.5 text-amber-600 dark:text-amber-300" size={20} /> : 
             tip.type === 'danger' ? <AlertCircle className="mt-0.5 text-rose-600 dark:text-rose-300" size={20} /> : 
             <Info className="mt-0.5 text-sky-600 dark:text-sky-300" size={20} />}
            <p className="text-sm text-slate-700 dark:text-slate-200">{tip.message}</p>
          </div>
        ))}
        {tips.length === 0 && (
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-6 text-center italic text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No specific tips at the moment. Keep tracking your expenses to get smarter advice!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">50 / 30 / 20 Budget Split</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Compare your current month with a recommended split.</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Actual" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recommended" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              <Target className="text-sky-600 dark:text-sky-300" /> Savings Simulation
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Estimate savings if you reduce a selected category.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-700 dark:text-slate-200">Category:</span>
              <select
                value={simulationCategory}
                onChange={(e) => setSimulationCategory(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
              >
                {SIMULATION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-200">Reduce selected category by:</span>
              <span className="font-semibold text-sky-700 dark:text-sky-300">{simulationReduction}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={simulationReduction} 
              onChange={(e) => setSimulationReduction(parseInt(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300 accent-sky-600 dark:bg-slate-700 dark:accent-sky-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Current Timeline</span>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {monthsToGoalActual === Infinity ? '∞' : monthsToGoalActual.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-300">months</span>
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Simulated Timeline</span>
              <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
                {monthsToGoalSimulated === Infinity ? '∞' : monthsToGoalSimulated.toFixed(1)} <span className="text-sm font-normal text-emerald-600 dark:text-emerald-300">months</span>
              </p>
            </div>
          </div>

          {simulationReduction > 0 && monthsToGoalActual !== Infinity && (
            <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-200">
              <TrendingDown size={20} className="shrink-0" />
              <p>
                Cutting {simulationCategory} by {simulationReduction}% can save about <strong>NPR {simulation?.monthly_extra_saving?.toLocaleString() || 0}</strong> monthly.
                Goal timeline improves by <strong>{(monthsToGoalActual - monthsToGoalSimulated).toFixed(1)} months</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
