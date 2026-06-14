import { useState, useEffect, useRef } from 'react'
import { Search, Video, CheckSquare, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useShell } from '../contexts/ShellContext'
import { cn } from '../lib/cn'

interface SearchResult {
  id: string
  type: 'meeting' | 'task' | 'page'
  title: string
  subtitle?: string
  href: string
}

const RECENT_PAGES: SearchResult[] = [
  { id: 'r1', type: 'page', title: 'Overview', subtitle: 'Dashboard', href: 'overview' },
  { id: 'r2', type: 'page', title: 'Meetings', subtitle: 'All meetings', href: 'meetings' },
  { id: 'r3', type: 'page', title: 'Settings', subtitle: 'Workspace settings', href: 'settings' },
]

const typeIcon: Record<SearchResult['type'], React.ElementType> = {
  meeting: Video,
  task: CheckSquare,
  page: ArrowRight,
}

export function SearchOverlay() {
  const { searchOverlayOpen, setSearchOverlayOpen } = useShell()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Focus input on open
  useEffect(() => {
    if (searchOverlayOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [searchOverlayOpen])

  // Escape to close + Cmd/Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOverlayOpen) {
        setSearchOverlayOpen(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOverlayOpen(!searchOverlayOpen)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOverlayOpen, setSearchOverlayOpen])

  const results: SearchResult[] = query
    ? [
        // Mock search results
        { id: 's1', type: 'meeting', title: `Meetings matching "${query}"`, subtitle: 'No results yet — upload your first meeting', href: 'meetings' },
      ]
    : RECENT_PAGES

  const handleSelect = (result: SearchResult) => {
    setSearchOverlayOpen(false)
    navigate(result.href)
  }

  return (
    <AnimatePresence>
      {searchOverlayOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setSearchOverlayOpen(false)}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.0, 0.0, 0.2, 1.0] }}
              className={cn(
                'w-full max-w-[600px] pointer-events-auto overflow-hidden',
                'bg-[#FFFFFF] dark:bg-[#1a2030]',
                'border border-[#E5E7EB] dark:border-[#1F2937]',
                'rounded-[12px]',
                'shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]',
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Global search"
            >
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <Search size={16} className="text-[#9CA3AF] dark:text-[#6B7280] flex-shrink-0" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search meetings, tasks, people..."
                  className="flex-1 text-[15px] text-[#111827] dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] bg-transparent border-none outline-none"
                />
                <button
                  onClick={() => setSearchOverlayOpen(false)}
                  className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] bg-[#F3F4F6] dark:bg-[#111827] px-1.5 py-0.5 rounded-[4px] font-medium hover:text-[#6B7280] dark:hover:text-[#9CA3AF] transition-colors duration-[120ms]"
                  aria-label="Close search"
                >
                  Esc
                </button>
              </div>

              {/* Results */}
              <div className="py-2 max-h-[400px] overflow-y-auto">
                {!query && (
                  <p className="px-4 py-1.5 text-[11px] font-semibold text-[#9CA3AF] dark:text-[#6B7280] uppercase tracking-[0.08em]">
                    Recent
                  </p>
                )}
                {results.map((result) => {
                  const Icon = typeIcon[result.type]
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors duration-[120ms] text-left"
                    >
                      <div className="w-7 h-7 rounded-[6px] bg-[#F3F4F6] dark:bg-[#111827] flex items-center justify-center flex-shrink-0 text-[#9CA3AF] dark:text-[#6B7280]">
                        <Icon size={14} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-[#111827] dark:text-[#F9FAFB]">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280]">{result.subtitle}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
