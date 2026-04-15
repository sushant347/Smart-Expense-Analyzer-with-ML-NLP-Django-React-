import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Upload from './pages/Upload';
import Predictions from './pages/Predictions';
import Settings from './pages/Settings';
import Suggestions from './pages/Suggestions';
import './App.css';

const isAuthenticated = () => !!localStorage.getItem('access_token');

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden md:flex-row">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="min-w-0 flex flex-1 flex-col overflow-x-hidden overflow-y-auto"
        style={{ background: 'var(--surface-2)' }}
      >
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:hidden"
          style={{
            background: 'var(--surface-1)',
            borderBottom: '1px solid var(--stroke-soft)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 transition"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Kharchi
          </span>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 transition"
            style={{ background: 'var(--surface-hover)', color: 'var(--text-secondary)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <div className="flex min-h-full w-full flex-col px-4 pb-6 pt-5 sm:px-5 md:px-7 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
