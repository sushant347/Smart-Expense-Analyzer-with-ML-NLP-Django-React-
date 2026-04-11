import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowUpDown, Upload, Zap, Settings, LogOut, Lightbulb } from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/predictions', icon: Zap, label: 'Predictions' },
  { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <aside className="w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="px-6 py-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-emerald-400">💰 NPR Finance</h1>
        <p className="text-xs text-slate-500 mt-0.5">AI-Powered Tracker</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
