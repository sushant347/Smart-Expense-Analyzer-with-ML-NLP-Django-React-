import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Tag, Filter, RotateCcw, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { TablePanelSkeleton } from '../components/ui/SkeletonBlocks';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Transfer', 'Other'];
const PAGE_SIZE = 12;

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  transaction_type: '',
  ordering: '-date',
};

// Category color map
const CATEGORY_COLORS = {
  Food:          { bg: '#dcfce7', text: '#15803d' },
  Rent:          { bg: '#fee2e2', text: '#b91c1c' },
  Transport:     { bg: '#fef3c7', text: '#92400e' },
  Shopping:      { bg: '#ede9fe', text: '#6d28d9' },
  Entertainment: { bg: '#fce7f3', text: '#9d174d' },
  Health:        { bg: '#dbeafe', text: '#1d4ed8' },
  Education:     { bg: '#e0f2fe', text: '#0369a1' },
  Transfer:      { bg: '#f3f4f6', text: '#374151' },
  Other:         { bg: '#f3f4f6', text: '#374151' },
};

function normalizePaginatedPayload(payload) {
  if (Array.isArray(payload)) {
    return { count: payload.length, next: null, previous: null, results: payload };
  }
  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: payload?.results ?? [],
  };
}

function CategoryBadge({ category, corrected }) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ background: colors.bg, color: colors.text }}
    >
      {category}
      {corrected && <span className="text-[10px]">✓</span>}
    </span>
  );
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
    setTimeout(() => setToast(''), 3200);
  }, []);

  const fetchTransactions = useCallback(async (targetPage, activeFilters) => {
    setLoading(true);
    try {
      const params = { page: targetPage, page_size: PAGE_SIZE };
      if (activeFilters.search.trim()) params.search = activeFilters.search.trim();
      if (activeFilters.category) params.category = activeFilters.category;
      if (activeFilters.transaction_type) params.transaction_type = activeFilters.transaction_type;
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

  useEffect(() => { fetchTransactions(page, filters); }, [page, filters, fetchTransactions]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const correctCategory = async (id) => {
    try {
      const response = await api.post(`transactions/${id}/correct_category/`, { category: newCategory });
      if (response.data?.auto_retrained) {
        showToast(`✓ Category updated · Model retrained (v${response.data.model_version})`);
      } else {
        showToast(`✓ Category changed to ${newCategory}`);
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

  const hasActiveFilters = Object.entries(draftFilters).some(
    ([k, v]) => k !== 'ordering' && v !== DEFAULT_FILTERS[k]
  );

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-5 top-5 z-50 rounded-xl px-5 py-3 text-sm font-medium shadow-lg"
          style={{
            background: 'var(--sidebar-bg)',
            color: '#f9fafb',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle hidden sm:block">Browse, filter, and correct transaction categories.</p>
        </div>
        <div
          className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold flex-shrink-0"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--stroke-soft)', color: 'var(--text-secondary)' }}
        >
          {totalCount} records
        </div>
      </div>

      {/* Filter panel */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Filters</span>
        </div>
        {/* Row 1: search + category + type */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search description…"
              className="input-surface pl-8 text-sm py-2"
            />
          </div>
          <select
            value={draftFilters.category}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="input-surface text-sm py-2"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={draftFilters.transaction_type}
            onChange={(e) => setDraftFilters((prev) => ({ ...prev, transaction_type: e.target.value }))}
            className="input-surface text-sm py-2"
          >
            <option value="">All types</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
          </select>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button onClick={applyFilters} className="btn-primary py-1.5 text-xs gap-1.5">
            <Filter size={12} /> Apply
          </button>
          <button onClick={resetFilters} className="btn-secondary py-1.5 text-xs gap-1.5" disabled={!hasActiveFilters}>
            <RotateCcw size={12} /> Reset
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown size={12} style={{ color: 'var(--text-muted)' }} />
            <select
              value={draftFilters.ordering}
              onChange={(e) => {
                const newDraft = { ...draftFilters, ordering: e.target.value };
                setDraftFilters(newDraft);
                setPage(1);
                setFilters({ ...filters, ordering: e.target.value });
              }}
              className="input-surface py-1.5 text-xs"
              style={{ width: 'auto' }}
            >
              <option value="-date">Newest first</option>
              <option value="date">Oldest first</option>
              <option value="-amount">Highest</option>
              <option value="amount">Lowest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TablePanelSkeleton rows={7} headerCount={6} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="data-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="hidden sm:table-cell">Confidence</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Edit</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr>
                      <td className="whitespace-nowrap">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.date}</span>
                      </td>
                      <td className="max-w-[160px] sm:max-w-[240px]">
                        <p className="truncate font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t.description}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <CategoryBadge category={t.category} corrected={t.is_manually_corrected} />
                      </td>
                      <td className="hidden sm:table-cell whitespace-nowrap">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: t.is_uncertain ? 'var(--amber)' : 'var(--text-muted)' }}
                        >
                          {(t.confidence_score * 100).toFixed(0)}%
                          {t.is_uncertain && <span className="ml-1 text-[10px]">uncertain</span>}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {/* DEBIT = red, CREDIT = green */}
                        <span
                          className="font-bold text-sm"
                          style={{ color: t.transaction_type === 'CREDIT' ? 'var(--accent)' : 'var(--danger)' }}
                        >
                          {t.transaction_type === 'CREDIT' ? '+' : '−'}NPR {parseFloat(t.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => { setEditId(editId === t.id ? null : t.id); setNewCategory(t.category); }}
                          className="rounded-lg p-1.5 transition"
                          style={{ color: editId === t.id ? 'var(--accent)' : 'var(--text-muted)', background: editId === t.id ? 'var(--accent-subtle)' : 'transparent' }}
                          title="Edit category"
                        >
                          <Tag size={15} />
                        </button>
                      </td>
                    </tr>
                    {editId === t.id && (
                      <tr style={{ background: 'var(--surface-hover)' }}>
                        <td colSpan={6} className="px-3 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Change to:</span>
                            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-surface py-1.5 text-xs" style={{ width: 'auto' }}>
                              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                            <button onClick={() => correctCategory(t.id)} className="btn-primary py-1.5 text-xs px-3">Save</button>
                            <button onClick={() => setEditId(null)} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No transactions found. Upload a CSV or adjust filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-3" style={{ borderTop: '1px solid var(--stroke-soft)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{page}</strong>/{totalPages}
              <span className="ml-1.5 hidden sm:inline">({totalCount} total)</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!hasPrevious || page === 1} className="btn-secondary py-1.5 px-2.5 gap-1" style={{ fontSize: '12px' }}>
                <ChevronLeft size={13} /><span className="hidden sm:inline">Prev</span>
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext || page >= totalPages} className="btn-primary py-1.5 px-2.5 gap-1" style={{ fontSize: '12px' }}>
                <span className="hidden sm:inline">Next</span><ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
