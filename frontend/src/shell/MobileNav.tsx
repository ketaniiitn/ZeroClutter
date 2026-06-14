import { useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Sparkles,
  BarChart2,
  Plug,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/cn'

const PRIMARY_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, path: 'overview' },
  { label: 'Meetings', icon: Video, path: 'meetings' },
  { label: 'Tasks', icon: CheckSquare, path: 'tasks' },
  { label: 'Assistant', icon: Sparkles, path: 'assistant' },
]

const MORE_ITEMS = [
  { label: 'Analytics', icon: BarChart2, path: 'analytics' },
  { label: 'Integrations', icon: Plug, path: 'integrations' },
  { label: 'Settings', icon: Settings, path: 'settings' },
]

export function MobileNav() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const slug = workspaceSlug ?? 'workspace'
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-14 flex items-center md:hidden bg-[#FFFFFF] dark:bg-[#0B0F17] border-t border-[#E5E7EB] dark:border-[#1F2937]"
        aria-label="Mobile navigation"
      >
        {PRIMARY_ITEMS.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={`/${slug}/${path}`}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors duration-[120ms]',
                isActive ? 'text-[#6366F1]' : 'text-[#9CA3AF] dark:text-[#6B7280]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 w-6 h-0.5 rounded-full bg-[#6366F1]" aria-hidden="true" />
                )}
                <Icon size={20} aria-hidden="true" />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5',
            moreOpen ? 'text-[#6366F1]' : 'text-[#9CA3AF] dark:text-[#6B7280]',
            'transition-colors duration-[120ms]',
          )}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* More sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              onClick={() => setMoreOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.0, 0.0, 0.2, 1.0] }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-[16px] overflow-hidden bg-[#FFFFFF] dark:bg-[#111827] border-t border-[#E5E7EB] dark:border-[#1F2937]"
              role="dialog"
              aria-modal="true"
              aria-label="More navigation"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#1F2937]">
                <span className="text-[14px] font-semibold text-[#111827] dark:text-[#F9FAFB]">More</span>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="py-2 px-3">
                {MORE_ITEMS.map(({ label, icon: Icon, path }) => (
                  <NavLink
                    key={path}
                    to={`/${slug}/${path}`}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-3 rounded-[8px] transition-colors duration-[120ms]',
                        isActive
                          ? 'bg-[rgba(99,102,241,0.12)] text-[#6366F1]'
                          : 'text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937]',
                      )
                    }
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span className="text-[15px] font-medium">{label}</span>
                  </NavLink>
                ))}
              </div>
              {/* Safe area bottom padding */}
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
