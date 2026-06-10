import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  authProvider: 'EMAIL' | 'GOOGLE';
}

export interface WorkspaceMembership {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface AuthState {
  user: AuthUser | null;
  workspaces: WorkspaceMembership[];
  activeWorkspace: WorkspaceMembership | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ workspaceSlug: string }>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  /** Called by /auth/callback after Google OAuth; restores session from cookie */
  restoreSession: () => Promise<{ workspaces: WorkspaceMembership[] } | null>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initDone = useRef(false);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
  }, []);

  // ─── Session restoration (on mount and after Google OAuth callback) ──────────

  const restoreSession = useCallback(async () => {
    try {
      const res = await api.post<{
        data: { accessToken: string; user: AuthUser; workspaces: WorkspaceMembership[] };
      }>('/auth/refresh');

      const { accessToken, user: u, workspaces: ws } = res.data.data;
      setAccessToken(accessToken);
      setUser(u);
      setWorkspaces(ws);

      const saved = localStorage.getItem('zc-active-workspace');
      const preferred = ws.find((w) => w.id === saved) ?? ws[0] ?? null;
      setActiveWorkspace(preferred);

      return { workspaces: ws };
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  // Run once on mount
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    restoreSession().finally(() => setIsLoading(false));
  }, [restoreSession]);

  // Listen for auth:logout events dispatched by the axios interceptor
  useEffect(() => {
    const handler = () => { clearAuth(); };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearAuth]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      data: {
        user: AuthUser;
        accessToken: string;
        workspaces: WorkspaceMembership[];
        activeWorkspace: WorkspaceMembership;
      };
    }>('/auth/login', { email, password });

    const { user: u, accessToken, workspaces: ws, activeWorkspace: aw } = res.data.data;
    setAccessToken(accessToken);
    setUser(u);
    setWorkspaces(ws);
    setActiveWorkspace(aw ?? ws[0] ?? null);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await api.post<{
      data: { user: AuthUser; accessToken: string; workspace: WorkspaceMembership };
    }>('/auth/signup', { name, email, password });

    const { user: u, accessToken, workspace } = res.data.data;
    setAccessToken(accessToken);
    setUser(u);
    setWorkspaces([workspace]);
    setActiveWorkspace(workspace);

    return { workspaceSlug: workspace.slug };
  }, []);

  const loginWithGoogle = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiBase}/auth/google`;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
  }, [clearAuth]);

  const logoutAll = useCallback(async () => {
    try { await api.post('/auth/logout/all'); } catch { /* ignore */ }
    clearAuth();
  }, [clearAuth]);

  const switchWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('zc-active-workspace', workspaceId);
    }
  }, [workspaces]);

  return (
    <AuthContext.Provider value={{
      user, workspaces, activeWorkspace, isLoading,
      isAuthenticated: !!user,
      login, signup, loginWithGoogle, logout, logoutAll,
      switchWorkspace, restoreSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
