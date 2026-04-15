import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Download, LogOut, CheckCircle2, AlertCircle, Shield, Target, BellRing } from 'lucide-react';

const CATEGORY_GOAL_FIELDS = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Other',
  'Rent',
  'Health',
  'Education',
  'Transfer',
];

const NOTIFICATION_STYLE = {
  danger: {
    border: 'rgba(220,38,38,0.28)',
    background: 'var(--danger-subtle)',
    title: 'var(--danger)',
  },
  warning: {
    border: 'rgba(217,119,6,0.28)',
    background: 'var(--amber-subtle)',
    title: 'var(--amber)',
  },
  info: {
    border: 'rgba(22,163,74,0.28)',
    background: 'var(--accent-subtle)',
    title: 'var(--accent)',
  },
};

export default function Settings() {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    monthly_income: '',
    savings_goal: '',
    currency: 'NPR',
    category_savings_goals: CATEGORY_GOAL_FIELDS.reduce((acc, category) => ({ ...acc, [category]: '' }), {}),
  });
  const [saved, setSaved] = useState('');
  const [savedType, setSavedType] = useState('success'); // 'success' | 'error'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const notify = (msg, type = 'success') => {
    setSaved(msg);
    setSavedType(type);
    setTimeout(() => setSaved(''), 4000);
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get('users/profile/'),
      api.get('suggestions/'),
    ])
      .then(([profileRes, suggestionsRes]) => {
        if (!isMounted) return;

        const payload = profileRes.data || {};
        const incomingGoals = payload.category_savings_goals || {};
        const normalizedGoals = {};

        CATEGORY_GOAL_FIELDS.forEach((category) => {
          const value = incomingGoals[category];
          normalizedGoals[category] = value === null || value === undefined ? '' : String(value);
        });

        setProfile({
          username: payload.username || '',
          email: payload.email || '',
          monthly_income: payload.monthly_income ?? '',
          savings_goal: payload.savings_goal ?? '',
          currency: 'NPR',
          category_savings_goals: normalizedGoals,
        });

        setNotifications(Array.isArray(suggestionsRes.data?.notifications) ? suggestionsRes.data.notifications : []);
      })
      .catch(() => notify('Failed to load settings data. Please refresh.', 'error'))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryGoalChange = (category, nextValue) => {
    setProfile((prev) => ({
      ...prev,
      category_savings_goals: {
        ...prev.category_savings_goals,
        [category]: nextValue,
      },
    }));
  };

  const sanitizeCategoryGoals = () => {
    const goals = {};
    Object.entries(profile.category_savings_goals || {}).forEach(([category, rawValue]) => {
      const cleaned = String(rawValue).trim();
      if (cleaned === '') return;

      const numeric = Number(cleaned);
      if (Number.isFinite(numeric) && numeric >= 0) {
        goals[category] = numeric;
      }
    });
    return goals;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const categoryGoals = sanitizeCategoryGoals();

      await api.patch('users/profile/', {
        monthly_income: profile.monthly_income === '' ? null : profile.monthly_income,
        savings_goal: profile.savings_goal === '' ? null : profile.savings_goal,
        currency: 'NPR',
        category_savings_goals: categoryGoals,
      });

      setProfile((prev) => ({
        ...prev,
        currency: 'NPR',
      }));

      const suggestionsRes = await api.get('suggestions/');
      setNotifications(Array.isArray(suggestionsRes.data?.notifications) ? suggestionsRes.data.notifications : []);
      notify('Profile updated successfully!');
    } catch {
      notify('Failed to update profile. Please try again.', 'error');
    }
  };

  const handleDownloadReport = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    api.get('reports/export/', {
      params: { year, month },
      responseType: 'blob',
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `kharchi_report_${year}_${String(month).padStart(2, '0')}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => notify('Failed to generate report. Please try again.', 'error'));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-10 w-32 rounded-lg" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="skeleton h-80 rounded-xl xl:col-span-2" />
          <div className="space-y-5">
            <div className="skeleton h-40 rounded-xl" />
            <div className="skeleton h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile, NPR goals, and account preferences.</p>
      </div>

      {/* Status message */}
      {saved && (
        <div className={savedType === 'error' ? 'alert alert-danger' : 'alert alert-info'}>
          {savedType === 'error'
            ? <AlertCircle size={16} className="flex-shrink-0" />
            : <CheckCircle2 size={16} className="flex-shrink-0" />}
          {saved}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3">
        {/* Profile form */}
        <div className="card p-4 sm:p-6 xl:col-span-2">
          <h2 className="section-title flex items-center gap-2 mb-5">
            <User size={16} style={{ color: 'var(--accent)' }} />
            Profile Settings
          </h2>

          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Username <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(read-only)</span>
              </label>
              <input
                value={profile.username}
                disabled
                className="input-surface"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(read-only)</span>
              </label>
              <input
                value={profile.email}
                disabled
                className="input-surface"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Monthly Income ({profile.currency || 'NPR'})
              </label>
              <input
                type="number"
                min="0"
                value={profile.monthly_income || ''}
                onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value })}
                className="input-surface"
                placeholder="e.g. 65000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Savings Goal ({profile.currency || 'NPR'})
              </label>
              <input
                type="number"
                min="0"
                value={profile.savings_goal || ''}
                onChange={(e) => setProfile({ ...profile, savings_goal: e.target.value })}
                className="input-surface"
                placeholder="e.g. 200000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Preferred Currency
              </label>
              <input
                value="NPR — Nepalese Rupee"
                disabled
                className="input-surface"
                style={{ maxWidth: '240px' }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Currency is fixed to NPR for consistent reporting.
              </p>
            </div>

            <div
              className="md:col-span-2 rounded-xl border p-4 sm:p-5"
              style={{ borderColor: 'var(--stroke-soft)', background: 'var(--surface-2)' }}
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Target size={15} style={{ color: 'var(--accent)' }} />
                  Category Savings Goals (NPR)
                </h3>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Set monthly spend caps by section. Smart alerts trigger when goals are reached or exceeded.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CATEGORY_GOAL_FIELDS.map((category) => (
                  <div key={category}>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      {category}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={profile.category_savings_goals?.[category] ?? ''}
                      onChange={(e) => handleCategoryGoalChange(category, e.target.value)}
                      className="input-surface"
                      placeholder="e.g. 5000"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="btn-primary gap-2">
                <CheckCircle2 size={15} />
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          {/* Report */}
          <div className="card p-4 sm:p-5">
            <h2 className="section-title flex items-center gap-2 mb-1">
              <Download size={16} style={{ color: 'var(--accent)' }} />
              Monthly Report
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Download a PDF summary of your current month's activity.
            </p>
            <button
              onClick={handleDownloadReport}
              className="btn-secondary gap-2 w-full"
            >
              <Download size={15} />
              Download PDF
            </button>
          </div>

          {/* Notifications */}
          <div className="card p-4 sm:p-5">
            <h2 className="section-title flex items-center gap-2 mb-1">
              <BellRing size={16} style={{ color: 'var(--amber)' }} />
              Smart Notifications
            </h2>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Goal and spending alerts generated from your latest month data.
            </p>

            {notifications.length === 0 ? (
              <div
                className="rounded-lg border px-3 py-2.5 text-xs"
                style={{ borderColor: 'var(--stroke-soft)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}
              >
                No active alerts right now.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map((notification, idx) => {
                  const style = NOTIFICATION_STYLE[notification.type] || NOTIFICATION_STYLE.info;
                  return (
                    <div
                      key={`${notification.title || 'notice'}-${idx}`}
                      className="rounded-lg border px-3 py-2.5"
                      style={{ borderColor: style.border, background: style.background }}
                    >
                      {notification.title && (
                        <p className="text-xs font-semibold" style={{ color: style.title }}>{notification.title}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{notification.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security */}
          <div
            className="card p-4 sm:p-5"
            style={{
              borderColor: 'rgba(220,38,38,0.3)',
              background: 'var(--danger-subtle)',
            }}
          >
            <h2
              className="section-title flex items-center gap-2 mb-1"
              style={{ color: 'var(--danger)' }}
            >
              <Shield size={16} />
              Account
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Signing out will end your session on this browser.
            </p>
            <button
              onClick={handleLogout}
              className="btn-danger gap-2 w-full"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
