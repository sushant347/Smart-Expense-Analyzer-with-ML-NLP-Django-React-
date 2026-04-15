import React, { useState } from 'react';
import api from '../api/axios';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

const CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Education', 'Transfer', 'Other'];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [manual, setManual] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    transaction_type: 'DEBIT',
    category: 'Other',
    source: 'MANUAL',
  });
  const [manualResult, setManualResult] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const handleFileSelect = (selected) => {
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setResult(null);
      setUploadError('');
    } else if (selected) {
      setUploadError('Please select a valid .csv file.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setResult(null);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('transactions/upload/', formData);
      setResult(res.data.message);
      setFile(null);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please check your file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setManualResult('');
    setManualError('');
    try {
      await api.post('transactions/', manual);
      setManualResult('Transaction added successfully!');
      setManual({
        date: new Date().toISOString().split('T')[0],
        description: '', amount: '',
        transaction_type: 'DEBIT', category: 'Other', source: 'MANUAL',
      });
      setTimeout(() => setManualResult(''), 4000);
    } catch {
      setManualError('Failed to add transaction. Please check your inputs.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="page-title">Import Transactions</h1>
        <p className="page-subtitle">Upload a CSV statement or add entries one by one.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        {/* CSV Upload */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <UploadCloud size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="section-title">CSV Upload</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Supported: eSewa, Khalti, and standard bank statement exports.
          </p>

          <form onSubmit={handleUpload}>
            {/* Drop zone */}
            <label
              className="block rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors"
              style={{
                borderColor: dragOver
                  ? 'var(--accent)'
                  : file
                    ? 'var(--accent)'
                    : 'var(--stroke-medium)',
                background: dragOver || file
                  ? 'var(--accent-subtle)'
                  : 'var(--surface-2)',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileSelect(e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <FileSpreadsheet
                size={40}
                className="mx-auto mb-3"
                style={{ color: file ? 'var(--accent)' : 'var(--text-muted)' }}
              />
              {file ? (
                <>
                  <p className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>{file.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Drag & drop your CSV here
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>or click to browse files</p>
                </>
              )}
            </label>

            {result && (
              <div className="alert alert-info mt-4">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                {result}
              </div>
            )}
            {uploadError && (
              <div className="alert alert-danger mt-4">
                <AlertCircle size={16} className="flex-shrink-0" />
                {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="btn-primary mt-5 gap-2 w-full py-3"
            >
              <UploadCloud size={16} />
              {uploading ? 'Uploading & analyzing…' : 'Upload & Analyze'}
            </button>
          </form>
        </div>

        {/* Manual Entry */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-1">
            <Plus size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="section-title">Manual Entry</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Add a single transaction directly.
          </p>

          {manualResult && (
            <div className="alert alert-info mb-4">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              {manualResult}
            </div>
          )}
          {manualError && (
            <div className="alert alert-danger mb-4">
              <AlertCircle size={16} className="flex-shrink-0" />
              {manualError}
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
              <input
                type="date"
                value={manual.date}
                onChange={(e) => setManual({ ...manual, date: e.target.value })}
                className="input-surface"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount (NPR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={manual.amount}
                onChange={(e) => setManual({ ...manual, amount: e.target.value })}
                className="input-surface"
                placeholder="0.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <input
                type="text"
                value={manual.description}
                onChange={(e) => setManual({ ...manual, description: e.target.value })}
                className="input-surface"
                placeholder="e.g. Grocery mart purchase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select
                value={manual.transaction_type}
                onChange={(e) => setManual({ ...manual, transaction_type: e.target.value })}
                className="input-surface"
              >
                <option value="DEBIT">Debit (Expense)</option>
                <option value="CREDIT">Credit (Income)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
              <select
                value={manual.category}
                onChange={(e) => setManual({ ...manual, category: e.target.value })}
                className="input-surface"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={manualLoading}
                className="btn-primary gap-2 w-full py-3"
              >
                <Plus size={16} />
                {manualLoading ? 'Adding…' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
