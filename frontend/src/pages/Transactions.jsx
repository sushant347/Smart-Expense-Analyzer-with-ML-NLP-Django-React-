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
    <div className="space-y-5">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{toast}</div>
      )}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review imported records and correct category labels.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {transactions.length} entries
        </div>
      </header>

      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
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
                  <tr className="border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{t.date}</td>
                    <td className="max-w-xs truncate px-5 py-3 text-slate-700 dark:text-slate-200">{t.description}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${t.is_manually_corrected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                        {t.category}
                        {t.is_manually_corrected && ' ✓'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${t.is_uncertain ? 'text-amber-600 dark:text-amber-300' : 'text-slate-500 dark:text-slate-300'}`}>
                        {(t.confidence_score * 100).toFixed(0)}%
                        {t.is_uncertain && ' uncertain'}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-right font-semibold ${t.transaction_type === 'CREDIT' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                      {t.transaction_type === 'CREDIT' ? '+' : '-'}NPR {parseFloat(t.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => { setEditId(editId === t.id ? null : t.id); setNewCategory(t.category); }} className="text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
                        <Tag size={16} />
                      </button>
                    </td>
                  </tr>
                  {editId === t.id && (
                    <tr className="bg-slate-50 dark:bg-slate-800/80">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Change category to:</span>
                          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                          <button onClick={() => correctCategory(t.id)} className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-sky-700">
                            Save
                          </button>
                          <button onClick={() => setEditId(null)} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-300">No transactions found. Upload a CSV or add manual entries.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
