import React, { useEffect, useMemo, useState } from 'react';
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

const isAuthenticated = () => !!localStorage.getItem('access_token');

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const pageTitle = useMemo(() => 'NPR Finance', []);

  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen relative">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />
      <main className="flex-1 overflow-auto">
        <header className="md:hidden sticky top-0 z-20 px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-200">{pageTitle}</span>
          <button
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="p-2 rounded-lg bg-slate-800 text-slate-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <Outlet />
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
