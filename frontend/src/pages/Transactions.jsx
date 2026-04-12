import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Tag } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Transfer', 'Other'];
const PAGE_SIZE = 12;

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  transaction_type: '',
  start_date: '',
  end_date: '',
  ordering: '-date',
};

function normalizePaginatedPayload(payload) {
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }

  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: payload?.results ?? [],
  };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const fetchTransactions = useCallback(async (targetPage, activeFilters) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        page_size: PAGE_SIZE,
      };

      if (activeFilters.search.trim()) params.search = activeFilters.search.trim();
      if (activeFilters.category) params.category = activeFilters.category;
      if (activeFilters.transaction_type) params.transaction_type = activeFilters.transaction_type;
      if (activeFilters.start_date) params.start_date = activeFilters.start_date;
      if (activeFilters.end_date) params.end_date = activeFilters.end_date;
      if (activeFilters.ordering) params.ordering = activeFilters.ordering;

      const res = await api.get('transactions/', { params });
      const payload = normalizePaginatedPayload(res.data);

      setTransactions(payload.results);
      setTotalCount(payload.count);
      setHasNext(Boolean(payload.next));
      setHasPrevious(Boolean(payload.previous));
    } catch (e) {
      console.error(e);
      showToast('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTransactions(page, filters);
  }, [page, filters, fetchTransactions]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const correctCategory = async (id) => {
    try {
      const response = await api.post(`transactions/${id}/correct_category/`, { category: newCategory });
      if (response.data?.auto_retrained) {
        showToast(`Category updated. Auto retraining triggered (v${response.data.model_version}).`);
      } else {
        showToast(`Category updated to ${newCategory}`);
      }
      setEditId(null);
      fetchTransactions(page, filters);
    } catch {
      showToast('Failed to update. Please try again.');
    }
  };

  const applyFilters = () => {
    setPage(1);
    setFilters({ ...draftFilters, search: draftFilters.search.trim() });
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">{toast}</div>
      )}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Transactions</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review records, apply filters, and correct category labels.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {totalCount} total
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="text"
            value={draftFilters.search}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search description"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          />
          <select
            value={draftFilters.category}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={draftFilters.transaction_type}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, transaction_type: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          >
            <option value="">All types</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
          <input
            type="date"
            value={draftFilters.start_date}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, start_date: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          />
          <input
            type="date"
            value={draftFilters.end_date}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, end_date: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          />
          <select
            value={draftFilters.ordering}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, ordering: e.target.value }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
          >
            <option value="-date">Newest first</option>
            <option value="date">Oldest first</option>
            <option value="-amount">Highest amount</option>
            <option value="amount">Lowest amount</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={applyFilters} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
            Apply filters
          </button>
          <button onClick={resetFilters} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
            Reset
          </button>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  <th className="px-5 py-4 text-left">Date</th>
                  <th className="px-5 py-4 text-left">Description</th>
                  <th className="px-5 py-4 text-left">Category</th>
                  <th className="px-5 py-4 text-left">Confidence</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-center">Action</th>
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
                        <button
                          onClick={() => {
                            setEditId(editId === t.id ? null : t.id);
                            setNewCategory(t.category);
                          }}
                          className="text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                        >
                          <Tag size={16} />
                        </button>
                      </td>
                    </tr>
                    {editId === t.id && (
                      <tr className="bg-slate-50 dark:bg-slate-800/80">
                        <td colSpan={6} className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-slate-600 dark:text-slate-300">Change category to:</span>
                            <select
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40"
                            >
                              {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
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
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-300">
                      No transactions found. Upload a CSV or adjust filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
            <div className="text-slate-600 dark:text-slate-300">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!hasPrevious || page === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasNext || page >= totalPages}
                className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
