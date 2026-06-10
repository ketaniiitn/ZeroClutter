import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrolled } from '../hooks/useScrolled'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ZeroClutterLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#6366F1" />
      <path d="M8 19L14 9L20 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10.5" y1="15.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const scrolled = useScrolled()
  const { theme, toggle } = useTheme()
  const { isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 dark:bg-[#0B0F17]/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#1F2937]/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-gray-900 dark:text-white font-semibold text-[15px] hover:opacity-90 transition-opacity"
        >
          <ZeroClutterLogo />
          ZeroClutter
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm text-gray-500 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-[#9CA3AF] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </motion.div>
          </button>

          {/* Auth-aware CTA pair */}
          {!isLoading && (
            isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#D1D5DB] border border-gray-300 dark:border-[#1F2937] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-md shadow-indigo-500/25"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-[#D1D5DB] border border-gray-300 dark:border-[#1F2937] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-md shadow-indigo-500/25"
                >
                  Start Free Trial
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#9CA3AF]"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-700 dark:text-[#F9FAFB] hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-gray-200 dark:border-[#1F2937] bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={closeMobile}
                  className="px-3 py-2.5 text-sm text-gray-600 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </a>
              ))}

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1F2937] flex flex-col gap-2">
                {!isLoading && (
                  isAuthenticated ? (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={closeMobile}
                        className="px-4 py-2.5 text-sm font-medium text-center text-gray-700 dark:text-[#F9FAFB] border border-gray-300 dark:border-[#1F2937] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2.5 text-sm font-semibold text-center text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={closeMobile}
                        className="px-4 py-2.5 text-sm font-medium text-center text-gray-700 dark:text-[#F9FAFB] border border-gray-300 dark:border-[#1F2937] rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={closeMobile}
                        className="px-4 py-2.5 text-sm font-semibold text-center text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                      >
                        Start Free Trial
                      </Link>
                    </>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
