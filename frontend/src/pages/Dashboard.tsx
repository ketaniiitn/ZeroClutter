import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { AxiosError } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meeting {
  id: string;
  title: string;
  meetingDate: string;
  participants: string[];
  _count?: { actionItems: number };
}

interface MeetingsResponse {
  data: {
    items: Meeting[];
    pagination: { total: number; totalPages: number; page: number };
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZeroClutterLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#6366F1" />
      <path d="M8 19L14 9L20 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10.5" y1="15.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function WorkspaceBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    ADMIN: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    MEMBER: 'bg-[#1F2937] text-[#6B7280] border-[#374151]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${colors[role] ?? colors.MEMBER}`}>
      {role}
    </span>
  );
}

function EmptyMeetings() {
  return (
    <div className="text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mx-auto mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <p className="text-[#4B5563] text-sm">No meetings yet</p>
      <p className="text-[#374151] text-xs mt-1">Meetings processed via the API will appear here</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { user, workspaces, activeWorkspace, switchWorkspace, logout, logoutAll } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const fetchMeetings = useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const res = await api.get<MeetingsResponse>('/api/meetings?limit=20&page=1');
      setMeetings(res.data.data.items);
      setTotal(res.data.data.pagination.total);
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      if (status !== 401) setMeetings([]);
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate('/login', { replace: true });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F9FAFB]">
      {/* ─── Top nav ─────────────────────────────────────────────────────── */}
      <nav className="h-14 border-b border-[#1F2937] flex items-center px-5 gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-2">
          <ZeroClutterLogo />
          <span className="text-white font-semibold text-[15px] hidden sm:inline">ZeroClutter</span>
        </Link>

        {/* Workspace switcher */}
        <div className="relative">
          <button
            onClick={() => { setShowWorkspaceMenu((v) => !v); setShowUserMenu(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1F2937] hover:border-[#374151] text-sm text-[#D1D5DB] transition-colors"
          >
            <span className="max-w-[140px] truncate">{activeWorkspace?.name ?? 'Select workspace'}</span>
            {activeWorkspace && <WorkspaceBadge role={activeWorkspace.role} />}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="3,4.5 6,7.5 9,4.5" />
            </svg>
          </button>

          {showWorkspaceMenu && workspaces.length > 1 && (
            <div className="absolute top-full mt-1 left-0 w-56 bg-[#111827] border border-[#1F2937] rounded-xl shadow-xl z-50 py-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { switchWorkspace(ws.id); setShowWorkspaceMenu(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#1F2937] transition-colors ${ws.id === activeWorkspace?.id ? 'text-indigo-400' : 'text-[#D1D5DB]'}`}
                >
                  <span className="truncate">{ws.name}</span>
                  <WorkspaceBadge role={ws.role} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu((v) => !v); setShowWorkspaceMenu(false); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} />
            <span className="hidden sm:inline text-sm text-[#D1D5DB]">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="absolute top-full mt-2 right-0 w-52 bg-[#111827] border border-[#1F2937] rounded-xl shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-[#1F2937]">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-[#4B5563] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-[#D1D5DB] hover:bg-[#1F2937] transition-colors"
              >
                Sign out
              </button>
              <button
                onClick={handleLogoutAll}
                className="w-full text-left px-3 py-2 text-sm text-[#9CA3AF] hover:bg-[#1F2937] transition-colors"
              >
                Sign out all devices
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Page content ────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeWorkspace?.name ?? 'Dashboard'}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {total > 0 ? `${total} meeting${total !== 1 ? 's' : ''} processed` : 'No meetings yet'}
            </p>
          </div>
          <a
            href="https://swagger.io"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add via API
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Meetings', value: total, icon: '📋' },
            { label: 'Workspace', value: activeWorkspace?.planTier ?? '—', icon: '🏢' },
            { label: 'Role', value: activeWorkspace?.role ?? '—', icon: '🔑' },
            { label: 'Auth', value: user?.authProvider ?? '—', icon: '🔐' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
              <p className="text-xs text-[#4B5563] mb-1">{stat.label}</p>
              <p className="text-base font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Meetings table */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent meetings</h2>
            <button
              onClick={fetchMeetings}
              className="text-xs text-[#4B5563] hover:text-[#9CA3AF] transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>

          {loadingMeetings ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : meetings.length === 0 ? (
            <EmptyMeetings />
          ) : (
            <div className="divide-y divide-[#1F2937]">
              {meetings.map((m) => (
                <div key={m.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#0d1117] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.title}</p>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      {formatDate(m.meetingDate)}
                      {m.participants.length > 0 && ` · ${m.participants.length} participant${m.participants.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {m._count !== undefined && (
                    <span className="text-xs text-[#6B7280] flex-shrink-0">
                      {m._count.actionItems} action{m._count.actionItems !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API hint */}
        <div className="mt-6 px-5 py-4 rounded-xl bg-[#111827] border border-[#1F2937] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[#D1D5DB] font-medium">Submit meetings via the API</p>
            <p className="text-xs text-[#4B5563] mt-0.5">
              POST to <code className="text-indigo-400 bg-indigo-500/10 px-1 rounded">/api/meetings</code> with
              your Bearer token to process transcripts and extract action items.
              {' '}
              <a
                href="http://localhost:3000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Open Swagger docs →
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Click-outside overlay to close menus */}
      {(showUserMenu || showWorkspaceMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowUserMenu(false); setShowWorkspaceMenu(false); }}
        />
      )}
    </div>
  );
}
