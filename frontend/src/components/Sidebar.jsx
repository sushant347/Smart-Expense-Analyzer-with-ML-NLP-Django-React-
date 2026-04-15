import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpDown,
  Upload,
  TrendingUp,
  Settings,
  LogOut,
  Lightbulb,
  Moon,
  Sun,
  X,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
  { to: '/upload', icon: Upload, label: 'Import' },
  { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col md:static md:min-h-screen md:translate-x-0 md:shadow-none transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none md:pointer-events-auto'
        }`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Brand */}
        <div
          className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #f59e0b 100%)', color: '#fff' }}
            >
              <span className="text-xs font-bold">K</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Kharchi</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--sidebar-text-muted)' }}>Personal Finance</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleTheme}
              className="rounded-md p-1.5 transition"
              style={{
                color: 'var(--sidebar-text)',
                background: 'var(--sidebar-hover)',
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 transition md:hidden"
              style={{
                color: 'var(--sidebar-text)',
                background: 'var(--sidebar-hover)',
              }}
              aria-label="Close menu"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p
            className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            Navigation
          </p>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'sidebar-active-item text-white'
                      : 'sidebar-inactive-item'
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--sidebar-text)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      style={{
                        color: isActive ? 'var(--accent)' : 'var(--sidebar-text-muted)',
                        transition: 'color 150ms',
                      }}
                    />
                    {item.label}
                    {isActive && (
                      <span
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '12px' }}>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              color: '#f87171',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={16} style={{ color: '#f87171' }} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
