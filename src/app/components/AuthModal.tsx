import { useState } from 'react';
import { X, Mail, Lock, User, Sparkles } from 'lucide-react';
import { authAPI, clearUserData, storeUserData } from '../../services/api';

type AuthPayload = {
  accountType: 'user' | 'admin';
  token: string;
  user?: {
    name: string;
    email: string;
  };
  admin?: any;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (payload: AuthPayload) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Validation helper
  const validateForm = () => {
    // Trim whitespace - add nullish checks
    const trimmedName = (name ?? '').trim();
    const trimmedEmail = (email ?? '').trim();
    const trimmedPassword = (password ?? '').trim();

    if (mode === 'signup') {
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
        setError('Name must be between 2 and 50 characters');
        return false;
      }
      if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
        setError('Name can only contain letters and spaces');
        return false;
      }
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address');
      return false;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const response = await authAPI.login(email, password);

        if (response?.data?.accountType === 'admin' && response?.data?.admin && response?.data?.token) {
          localStorage.removeItem('adminToken');
          localStorage.setItem('adminToken', response.data.token);
          onAuth({
            accountType: 'admin',
            token: response.data.token,
            admin: response.data.admin,
          });
          onClose();

          // Reset form
          setName('');
          setEmail('');
          setPassword('');
          return;
        }

        if (!response?.data?.user || !response?.data?.token) {
          setError('Login failed');
          return;
        }

        storeUserData(response.data.token, response.data.user);
        onAuth({
          accountType: 'user',
          token: response.data.token,
          user: {
            name: response.data.user.name,
            email: response.data.user.email,
          },
        });
        onClose();

        // Reset form
        setName('');
        setEmail('');
        setPassword('');
      } else {
        // Regular user login/signup
        // Drop stale user session data before acquiring a fresh user token.
        clearUserData();

        const response = await authAPI.register(name, email, password);

        // Store token and user data
        storeUserData(response.data.token, response.data.user);

        onAuth({
          accountType: 'user',
          token: response.data.token,
          user: {
            name: response.data.user.name,
            email: response.data.user.email,
          },
        });
        onClose();

        // Reset form
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary via-secondary to-accent p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Smart Travel</h2>
              <p className="text-white/80 text-sm">Your Egyptian Adventure Awaits</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-xl transition-all text-sm ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-xl transition-all text-sm ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block mb-2 text-sm">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-input-background border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-all"
                      placeholder="Ahmed Hassan"
                      required={mode === 'signup'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    2-50 characters, letters and spaces only
                  </p>
                </div>
              </>
            )}
            {mode === 'login' && <input type="hidden" value={name} readOnly />}

            <div>
              <label className="block mb-2 text-sm">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-all"
                  placeholder="ahmed@example.com"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Valid email address required
              </p>
            </div>

            <div>
              <label className="block mb-2 text-sm">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                mode === 'login' ? 'Logging in...' : 'Creating Account...'
              ) : (
                mode === 'login' ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
