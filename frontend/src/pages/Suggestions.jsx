import React, { useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, Target, Zap, Info, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import api from '../api/axios';

export default function Suggestions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulationReduction, setSimulationReduction] = useState(0);

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

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Suggestions...</div>;
  }

  const { budget_actual, budget_recommended, tips, monthly_income, savings_goal } = data;

  // Simulation Logic
  // Assuming the user wants to reduce "Wants" spending
  const currentMonthlySavings = budget_actual.savings;
  const simulatedSavings = currentMonthlySavings + (budget_actual.wants * (simulationReduction / 100));
  const monthsToGoalActual = currentMonthlySavings > 0 ? (savings_goal / currentMonthlySavings) : Infinity;
  const monthsToGoalSimulated = simulatedSavings > 0 ? (savings_goal / simulatedSavings) : Infinity;

  const chartData = [
    { name: 'Needs', Actual: budget_actual.needs, Recommended: budget_recommended.needs },
    { name: 'Wants', Actual: budget_actual.wants, Recommended: budget_recommended.wants },
    { name: 'Savings', Actual: budget_actual.savings, Recommended: budget_recommended.savings },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="pb-6 border-b border-slate-800">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Lightbulb className="text-emerald-400" /> Smart Suggestions
        </h1>
        <p className="text-slate-400 mt-2">Personalized financial advice and budget recommendations based on your habits.</p>
      </header>

      {/* Smart Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tips.map((tip, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border flex items-start gap-4 ${
            tip.type === 'warning' ? 'bg-amber-900/10 border-amber-500/30' : 
            tip.type === 'danger' ? 'bg-red-900/10 border-red-500/30' : 
            'bg-blue-900/10 border-blue-500/30'
          }`}>
            {tip.type === 'warning' ? <Zap className="text-amber-400 mt-1" size={24} /> : 
             tip.type === 'danger' ? <AlertCircle className="text-red-400 mt-1" size={24} /> : 
             <Info className="text-blue-400 mt-1" size={24} />}
            <p className="text-slate-200">{tip.message}</p>
          </div>
        ))}
        {tips.length === 0 && (
          <div className="col-span-2 p-6 bg-slate-800/30 border border-slate-700 rounded-2xl text-slate-400 text-center italic">
            No specific tips at the moment. Keep tracking your expenses to get smarter advice!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 50/30/20 Budget Recommender */}
        <div className="bg-slate-800/40 p-8 rounded-2xl border border-slate-700 space-y-6">
          <h2 className="text-xl font-semibold text-slate-100 italic">50/30/20 Budget Rule</h2>
          <p className="text-sm text-slate-400">Comparing your actual spending this month with the recommended budget for your income level.</p>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Actual" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recommended" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Savings Simulation */}
        <div className="bg-slate-800/40 p-8 rounded-2xl border border-slate-700 space-y-8">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
              <Target className="text-blue-400" /> Savings Simulation
            </h2>
            <p className="text-sm text-slate-400">See how reducing non-essential spending ("Wants") speeds up your savings goal.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Reduce "Wants" by:</span>
              <span className="text-emerald-400 font-bold">{simulationReduction}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={simulationReduction} 
              onChange={(e) => setSimulationReduction(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current Timeline</span>
              <p className="text-2xl font-bold text-slate-200 mt-1">
                {monthsToGoalActual === Infinity ? '∞' : monthsToGoalActual.toFixed(1)} <span className="text-sm font-normal text-slate-500">months</span>
              </p>
            </div>
            <div className="p-4 bg-emerald-900/10 rounded-xl border border-emerald-500/30">
              <span className="text-xs text-emerald-500/70 uppercase font-bold tracking-wider">Simulated Timeline</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {monthsToGoalSimulated === Infinity ? '∞' : monthsToGoalSimulated.toFixed(1)} <span className="text-sm font-normal text-emerald-500">months</span>
              </p>
            </div>
          </div>

          {simulationReduction > 0 && monthsToGoalActual !== Infinity && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm text-blue-300 flex items-start gap-3">
              <TrendingDown size={20} className="shrink-0" />
              <p>By reducing your "Wants" by {simulationReduction}%, you could reach your goal <strong>{(monthsToGoalActual - monthsToGoalSimulated).toFixed(1)} months</strong> sooner!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
