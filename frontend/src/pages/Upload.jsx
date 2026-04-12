import React, { useState } from 'react';
import api from '../api/axios';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Transfer', 'Other'];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Manual entry form state
  const [manual, setManual] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    transaction_type: 'DEBIT',
    category: 'Other',
    source: 'MANUAL',
  });
  const [manualResult, setManualResult] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('transactions/upload/', formData);
      setResult(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('transactions/', manual);
      setManualResult('Transaction added successfully!');
      setManual({ date: new Date().toISOString().split('T')[0], description: '', amount: '', transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL' });
      setTimeout(() => setManualResult(''), 3000);
    } catch {
      setManualResult('Failed to add transaction.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Import Transactions</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Upload CSV statements or add entries manually.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100"><Upload size={20} /> CSV Upload</h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Supported formats: eSewa, Khalti, and standard bank statements.</p>
        
        <form onSubmit={handleUpload}>
          <label className={`block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${file ? 'border-sky-400 bg-sky-50 dark:border-sky-500 dark:bg-sky-900/20' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            <FileText className="mx-auto mb-3 text-slate-500 dark:text-slate-300" size={40} />
            {file ? (
              <p className="font-medium text-sky-700 dark:text-sky-300">{file.name}</p>
            ) : (
              <p className="text-slate-600 dark:text-slate-300">Click to select a CSV file</p>
            )}
          </label>
          {result && <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"><Check size={18}/>{result}</div>}
          {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"><AlertCircle size={18}/>{error}</div>}
          <button type="submit" disabled={!file || uploading}
            className="mt-5 rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-slate-100">Manual Entry</h2>
        {manualResult && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">{manualResult}</div>}
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Date</label>
            <input type="date" value={manual.date} onChange={e => setManual({...manual, date: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Amount (NPR)</label>
            <input type="number" step="0.01" value={manual.amount} onChange={e => setManual({...manual, amount: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40" required />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Description</label>
            <input type="text" value={manual.description} onChange={e => setManual({...manual, description: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Type</label>
            <select value={manual.transaction_type} onChange={e => setManual({...manual, transaction_type: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40">
              <option value="DEBIT">Debit (Expense)</option>
              <option value="CREDIT">Credit (Income)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700 dark:text-slate-200">Category</label>
            <select value={manual.category} onChange={e => setManual({...manual, category: e.target.value})}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-900/40">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
              Add Entry
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
