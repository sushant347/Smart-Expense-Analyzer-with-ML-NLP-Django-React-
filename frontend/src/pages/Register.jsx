import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import api from '../api/axios';
import kharchiLogo from '../components/image/Kharchi.png';

const FIELDS = [
  { label: 'Username', name: 'username', type: 'text', placeholder: 'Choose a username', required: true },
  { label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', required: true },
  { label: 'Password', name: 'password', type: 'password', placeholder: 'Min. 8 characters', required: true },
  { label: 'Monthly Income (NPR)', name: 'monthly_income', type: 'number', placeholder: 'e.g. 65000', required: false },
  { label: 'Savings Goal (NPR)', name: 'savings_goal', type: 'number', placeholder: 'e.g. 200000', required: false },
];

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    monthly_income: '', savings_goal: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('users/register/', { ...form, currency: 'NPR' });
      navigate('/login');
    } catch (err) {
      const responsePayload = err?.response?.data;
      const messagePayload = responsePayload?.message;

      let resolvedMessage = 'Registration failed. Please try again.';

      if (typeof messagePayload === 'string' && messagePayload.trim()) {
        resolvedMessage = messagePayload;
      } else if (Array.isArray(messagePayload) && messagePayload.length > 0) {
        resolvedMessage = String(messagePayload[0]);
      } else if (messagePayload && typeof messagePayload === 'object') {
        const firstValue = Object.values(messagePayload)[0];
        if (Array.isArray(firstValue) && firstValue.length > 0) {
          resolvedMessage = String(firstValue[0]);
        } else if (typeof firstValue === 'string' && firstValue.trim()) {
          resolvedMessage = firstValue;
        }
      } else {
        const fallbackFieldError = responsePayload?.username?.[0] || responsePayload?.email?.[0];
        if (fallbackFieldError) {
          resolvedMessage = fallbackFieldError;
        }
      }

      setError(resolvedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex h-full items-center justify-center overflow-hidden overflow-y-auto px-4 py-8"
      style={{ background: '#f3f4f6' }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl md:grid md:grid-cols-2 my-4"
        style={{ border: '1px solid var(--stroke-soft)' }}
      >
        {/* Left branding panel */}
        <div
          className="hidden md:flex md:flex-col md:justify-between p-8"
          style={{ background: '#111827' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-6">
              <img
                src={kharchiLogo}
                alt="Kharchi logo"
                className="h-8 w-8 rounded-lg object-cover"
                style={{ border: '1px solid rgba(255,255,255,0.18)' }}
              />
              <span className="text-sm font-bold text-white">Kharchi</span>
            </div>
            <h1 className="text-2xl font-bold leading-snug text-white">
              Build better money habits, month by month.
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#9ca3af' }}>
              Set up your profile once. Get categorized insights, forecasts, and personalised savings advice automatically.
            </p>
          </div>
          <p className="text-xs mt-8" style={{ color: '#6b7280' }}>
            Your data stays on your server — no third-party financial access.
          </p>
        </div>

        {/* Right form panel */}
        <div className="p-7 sm:p-8" style={{ background: 'var(--surface-1)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Start tracking your expenses today.</p>
          </div>

          {error && <div className="error-box mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {FIELDS.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`register-${field.name}`}
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {field.label}
                  {!field.required && <span className="ml-1 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>}
                </label>
                <div className="relative">
                  <input
                    id={`register-${field.name}`}
                    type={field.name === 'password' && showPassword ? 'text' : field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    className="input-surface"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                  {field.name === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="btn-primary w-full gap-2 py-3 mt-2"
            >
              <UserPlus size={16} />
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
