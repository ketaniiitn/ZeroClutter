import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell, Sun, Moon, Search, ChevronDown, LogOut, User, Building2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useShell } from '../contexts/ShellContext'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn } from '../lib/cn'

// ─── Workspace Switcher ────────────────────────────────────────────────────────

function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace } = useAuth()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)

  const handleSwitch = (wsId: string, wsSlug: string) => {
    switchWorkspace(wsId)
    setOpen(false)
    navigate(`/${wsSlug}/overview`)
  }

  const initial = (activeWorkspace?.name ?? 'W')[0].toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex items-center gap-2 h-8 px-2 rounded-[6px] transition-colors duration-[120ms]',
          'text-[#111827] dark:text-[#F9FAFB]',
          'hover:bg-[#F3F4F6] dark:hover:bg-[#111827]',
          open && 'bg-[#F3F4F6] dark:bg-[#111827]',
        )}
      >
        {/* Workspace avatar */}
        <span className="w-5 h-5 rounded-[4px] bg-[#6366F1] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {initial}
        </span>
        <span className="hidden sm:inline-block text-[13px] font-medium max-w-[140px] truncate">
          {activeWorkspace?.name ?? 'Select workspace'}
        </span>
        <ChevronDown size={12} className="text-[#9CA3AF] dark:text-[#6B7280] flex-shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] }}
          role="listbox"
          aria-label="Your workspaces"
          className={cn(
            'absolute top-full mt-1 left-0 w-56 z-50 py-1',
            'bg-white dark:bg-[#1a2030]',
            'border border-[#E5E7EB] dark:border-[#1F2937]',
            'rounded-[8px]',
            'shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
          )}
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-[0.08em]">
            Your workspaces
          </p>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              role="option"
              aria-selected={ws.slug === workspaceSlug}
              onClick={() => handleSwitch(ws.id, ws.slug)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors duration-[120ms]',
                ws.slug === workspaceSlug
                  ? 'text-[#6366F1] bg-[rgba(99,102,241,0.08)]'
                  : 'text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]',
              )}
            >
              <span className="w-5 h-5 rounded-[4px] bg-[#6366F1] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </span>
              <span className="flex-1 truncate">{ws.name}</span>
              {ws.slug === workspaceSlug && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] flex-shrink-0" />
              )}
            </button>
          ))}
          <div className="my-1 border-t border-[#E5E7EB] dark:border-[#1F2937]" />
          <button
            onClick={() => { setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors duration-[120ms]"
          >
            <Plus size={14} aria-hidden="true" />
            Create workspace
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity duration-[120ms]"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] }}
          role="menu"
          className={cn(
            'absolute top-full mt-2 right-0 w-52 z-50 py-1',
            'bg-white dark:bg-[#1a2030]',
            'border border-[#E5E7EB] dark:border-[#1F2937]',
            'rounded-[8px]',
            'shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
          )}
        >
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
            <p className="text-[13px] font-medium text-[#111827] dark:text-[#F9FAFB] truncate">{user?.name}</p>
            <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] truncate mt-0.5">{user?.email}</p>
          </div>

          {[
            { label: 'Profile', icon: User },
            { label: 'Workspace settings', icon: Building2 },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#111827] dark:text-[#D1D5DB] hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors duration-[120ms]"
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}

          <div className="my-1 border-t border-[#E5E7EB] dark:border-[#1F2937]" />

          <button
            role="menuitem"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors duration-[120ms]"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useShell()
  const unreadCount = 3 // Mock

  return (
    <button
      onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      className="relative w-8 h-8 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors duration-[120ms]"
    >
      <Bell size={16} aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#EF4444] flex items-center justify-center text-[8px] font-bold text-white leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors duration-[120ms]"
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
      >
        {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      </motion.span>
    </button>
  )
}

// ─── Search Trigger ───────────────────────────────────────────────────────────

function SearchTrigger() {
  const { setSearchOverlayOpen } = useShell()

  return (
    <>
      {/* Desktop: visible search bar */}
      <button
        onClick={() => setSearchOverlayOpen(true)}
        className="hidden md:flex items-center gap-2 h-8 px-3 rounded-[6px] text-[13px] text-[#9CA3AF] dark:text-[#6B7280] bg-[#F3F4F6] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1F2937] hover:border-[#D1D5DB] dark:hover:border-[#374151] transition-colors duration-[120ms] w-52"
        aria-label="Open search"
      >
        <Search size={13} aria-hidden="true" />
        <span>Search...</span>
        <span className="ml-auto text-[10px] bg-[#E5E7EB] dark:bg-[#1F2937] px-1.5 py-0.5 rounded-[3px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
          ⌘K
        </span>
      </button>

      {/* Mobile: icon only */}
      <button
        onClick={() => setSearchOverlayOpen(true)}
        aria-label="Open search"
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors duration-[120ms]"
      >
        <Search size={16} aria-hidden="true" />
      </button>
    </>
  )
}

// ─── ZeroClutter Logo ─────────────────────────────────────────────────────────

function ZCLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="#6366F1" />
      <path d="M8 19L14 9L20 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10.5" y1="15.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Main Topbar ──────────────────────────────────────────────────────────────

export function Topbar() {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-4 gap-3',
        'bg-[#FFFFFF] dark:bg-[#0B0F17]',
        'border-b border-[#E5E7EB] dark:border-[#1F2937]',
      )}
    >
      {/* Logo — shown only on mobile (sidebar is hidden) */}
      <div className="flex md:hidden items-center gap-2 mr-1">
        <ZCLogo />
      </div>

      {/* Workspace switcher */}
      <WorkspaceSwitcher />

      {/* Center search */}
      <div className="flex-1 flex justify-center">
        <SearchTrigger />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
        <div className="w-px h-4 bg-[#E5E7EB] dark:bg-[#1F2937] mx-0.5" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  )
}
