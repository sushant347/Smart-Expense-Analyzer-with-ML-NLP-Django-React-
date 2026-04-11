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
    } catch (err) {
      setManualResult('Failed to add transaction.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-100">Upload & Add Transactions</h1>

      {/* CSV Upload */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2"><Upload size={20} /> CSV Upload</h2>
        <p className="text-slate-400 text-sm mb-6">Supports eSewa, Khalti, and standard bank CSV formats. AI will auto-categorize your transactions.</p>
        
        <form onSubmit={handleUpload}>
          <label className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${file ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-600 hover:border-slate-500'}`}>
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            <FileText className="mx-auto mb-3 text-slate-400" size={40} />
            {file ? (
              <p className="text-emerald-400 font-medium">{file.name}</p>
            ) : (
              <p className="text-slate-400">Click to select CSV file or drag and drop</p>
            )}
          </label>
          {result && <div className="mt-4 p-3 bg-emerald-900/30 text-emerald-400 rounded-lg flex items-center gap-2"><Check size={18}/>{result}</div>}
          {error && <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2"><AlertCircle size={18}/>{error}</div>}
          <button type="submit" disabled={!file || uploading}
            className="mt-5 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-900 font-bold rounded-xl transition-colors">
            {uploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </form>
      </div>

      {/* Manual Entry */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 p-8">
        <h2 className="text-lg font-semibold text-slate-200 mb-6">Manual Entry</h2>
        {manualResult && <div className="mb-4 p-3 bg-emerald-900/30 text-emerald-400 rounded-lg">{manualResult}</div>}
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input type="date" value={manual.date} onChange={e => setManual({...manual, date: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Amount (NPR)</label>
            <input type="number" step="0.01" value={manual.amount} onChange={e => setManual({...manual, amount: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <input type="text" value={manual.description} onChange={e => setManual({...manual, description: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Type</label>
            <select value={manual.transaction_type} onChange={e => setManual({...manual, transaction_type: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="DEBIT">Debit (Expense)</option>
              <option value="CREDIT">Credit (Income)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Category</label>
            <select value={manual.category} onChange={e => setManual({...manual, category: e.target.value})}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
