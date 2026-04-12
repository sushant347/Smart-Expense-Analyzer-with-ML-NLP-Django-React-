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
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="px-6 py-6 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-emerald-400">💰 NPR Finance</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onClose} className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300" aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="px-6 pt-1">
        <p className="text-xs text-slate-500 mt-0.5">AI-Powered Tracker</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const iconElement = React.createElement(item.icon, { size: 18 });
          return (
            <NavLink key={item.to} to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }>
              {iconElement}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
      </aside>
    </>
  );
}
