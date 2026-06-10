import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Landing page for Google OAuth callback.
 * Backend redirects here with ?workspaceSlug=&isNewUser= after setting the
 * refresh cookie. We call restoreSession() to exchange the cookie for an
 * access token, then route the user to the right place.
 */
export function AuthCallback() {
  const { restoreSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const workspaceSlug = params.get('workspaceSlug');
    const isNewUser = params.get('isNewUser') === 'true';

    restoreSession().then((result) => {
      if (!result) {
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }

      if (isNewUser) {
        navigate('/onboarding', { replace: true });
      } else if (workspaceSlug) {
        navigate(`/${workspaceSlug}/dashboard`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [restoreSession, navigate, params]);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">Completing sign-in…</p>
      </div>
    </div>
  );
}
