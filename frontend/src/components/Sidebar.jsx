import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowUpDown,
  Upload,
  TrendingUp,
  Activity,
  Settings,
  LogOut,
  Lightbulb,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import kharchiLogo from './image/Kharchi.png';

const navGroups = [
  {
    title: 'Data',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
      { to: '/analytics', icon: Activity, label: 'User Analytics' },
      { to: '/upload', icon: Upload, label: 'Import' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: '/predictions', icon: TrendingUp, label: 'Predictions' },
      { to: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
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
            <img
              src={kharchiLogo}
              alt="Kharchi logo"
              className="h-8 w-8 rounded-lg object-cover"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            />
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
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title} className={groupIndex > 0 ? 'mt-3' : ''}>
              {groupIndex > 0 && (
                <div className="mx-2 mb-3" style={{ borderTop: '1px solid var(--sidebar-border)' }} />
              )}
              <p
                className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--sidebar-text-muted)' }}
              >
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
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
              </div>
            </div>
          ))}
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
