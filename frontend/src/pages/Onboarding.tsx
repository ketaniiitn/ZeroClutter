import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
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

export function Onboarding() {
  const { user, activeWorkspace, workspaces } = useAuth();
  const navigate = useNavigate();

  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    setSaving(true);
    setError('');
    try {
      // Rename the workspace if the user changed the default name
      if (workspaceName.trim() && workspaceName.trim() !== activeWorkspace.name) {
        await api.patch(`/api/workspaces/${activeWorkspace.id}`, {
          name: workspaceName.trim(),
        });
      }
      navigate(`/${activeWorkspace.slug}/overview`, { replace: true });
    } catch (err) {
      const msg = (err as AxiosError<{ error: { message: string } }>)
        ?.response?.data?.error?.message;
      if (msg) setError(msg);
      else navigate(`/${activeWorkspace.slug}/overview`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const slug = activeWorkspace?.slug ?? workspaces[0]?.slug;
    navigate(slug ? `/${slug}/overview` : '/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <ZeroClutterLogo />
          <span className="text-white font-semibold text-lg">ZeroClutter</span>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <div className="w-2 h-2 rounded-full bg-[#1F2937]" />
          </div>

          <h1 className="text-xl font-bold text-white mb-1">
            Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-[#6B7280] mb-7">
            Let's set up your workspace. You can always change this later.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleContinue} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                Workspace name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp, My Team"
                required
                minLength={2}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B0F17] border border-[#1F2937] text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
              />
              <p className="mt-1.5 text-xs text-[#4B5563]">
                This is usually your company or team name.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl border border-[#1F2937] text-[#6B7280] text-sm font-medium hover:bg-[#1F2937] hover:text-[#9CA3AF] transition-colors"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {saving ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-[#4B5563] mt-5">
          Your workspace is private until you invite teammates.
        </p>
      </div>
    </div>
  );
}
