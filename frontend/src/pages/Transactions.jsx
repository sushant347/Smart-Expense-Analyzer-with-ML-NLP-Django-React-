import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Tag } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Transfer', 'Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('transactions/');
      setTransactions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const correctCategory = async (id) => {
    try {
      await api.post(`transactions/${id}/correct_category/`, { category: newCategory });
      showToast(`Category updated to ${newCategory}`);
      setEditId(null);
      fetchTransactions();
    } catch {
      showToast('Failed to update. Please try again.');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 transition-all">{toast}</div>
      )}
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Transactions</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Description</th>
                <th className="text-left px-5 py-4">Category</th>
                <th className="text-left px-5 py-4">Confidence</th>
                <th className="text-right px-5 py-4">Amount</th>
                <th className="text-center px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <React.Fragment key={t.id}>
                  <tr className="border-b border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                    <td className="px-5 py-3 text-slate-300">{t.date}</td>
                    <td className="px-5 py-3 text-slate-200 max-w-xs truncate">{t.description}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_manually_corrected ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                        {t.category}
                        {t.is_manually_corrected && ' ✓'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs ${t.confidence_score < 0.5 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {(t.confidence_score * 100).toFixed(0)}%
                        {t.confidence_score < 0.5 && ' ⚠ uncertain'}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${t.transaction_type === 'CREDIT' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {t.transaction_type === 'CREDIT' ? '+' : '-'}NPR {parseFloat(t.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => { setEditId(editId === t.id ? null : t.id); setNewCategory(t.category); }} className="text-slate-400 hover:text-emerald-400 transition-colors">
                        <Tag size={16} />
                      </button>
                    </td>
                  </tr>
                  {editId === t.id && (
                    <tr className="bg-slate-800/80">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-sm">Change category to:</span>
                          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <button onClick={() => correctCategory(t.id)} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
                            Save
                          </button>
                          <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500">No transactions found. Upload a CSV or add manually.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
