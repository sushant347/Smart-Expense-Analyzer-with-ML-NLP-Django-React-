import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowUpDown, Upload, Zap, Settings, LogOut, Lightbulb, Moon, Sun, X } from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/predictions', icon: Zap, label: 'Predictions' },
  { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 shadow-lg backdrop-blur transition-transform duration-200 dark:border-slate-700/80 dark:bg-slate-900/95 md:static md:min-h-screen md:translate-x-0 md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Smart Expense</h1>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Personal Finance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onClose} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 md:hidden" aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const iconElement = React.createElement(item.icon, { size: 18 });
          return (
            <NavLink key={item.to} to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }>
              {iconElement}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-3 py-4 dark:border-slate-700">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/20">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
      </aside>
    </>
  );
}
