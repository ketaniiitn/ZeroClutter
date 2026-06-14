import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AxiosError } from 'axios';

function ZeroClutterLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#6366F1" />
      <path d="M8 19L14 9L20 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10.5" y1="15.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const urlError = new URLSearchParams(location.search).get('error');
  const oauthErrorMsg: Record<string, string> = {
    oauth_denied: 'Google sign-in was cancelled.',
    invalid_state: 'Security check failed. Please try again.',
    email_not_verified: 'Your Google account email is not verified.',
    oauth_failed: 'Google sign-in failed. Please try again.',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { workspaceSlug } = await login(email, password);
      let destination = `/${workspaceSlug}/overview`;
      if (from && from !== '/dashboard') destination = from;
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = (err as AxiosError<{ error: { message: string } }>)
        ?.response?.data?.error?.message ?? 'Sign in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <ZeroClutterLogo />
          <span className="text-white font-semibold text-lg">ZeroClutter</span>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-[#6B7280] mb-6">Sign in to your account</p>

          {/* OAuth error from URL */}
          {urlError && oauthErrorMsg[urlError] && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {oauthErrorMsg[urlError]}
            </div>
          )}

          {/* Form error */}
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-[#1F2937] bg-[#0B0F17] text-[#D1D5DB] text-sm font-medium hover:bg-[#1F2937] hover:border-[#374151] transition-colors mb-5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1F2937]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#111827] text-xs text-[#4B5563]">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2937] text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2937] text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#4B5563] mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
