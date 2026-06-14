import { useEffect, useRef } from 'react'
import { X, CheckCircle, AlertTriangle, Video, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShell } from '../contexts/ShellContext'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn } from '../lib/cn'

type NotificationType = 'meeting' | 'task' | 'overdue' | 'invite'

interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'meeting',
    title: 'Meeting processed',
    body: 'Sprint Planning Q2 — 4 action items extracted',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'task',
    title: 'Task assigned to you',
    body: 'Finalize API specification — due Jun 15',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'overdue',
    title: 'Task overdue',
    body: 'Update product roadmap deck — was due Jun 8',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'invite',
    title: 'Workspace invitation',
    body: 'Sarah invited you to join Design Team',
    time: '2 days ago',
    read: true,
  },
]

const typeIcon: Record<NotificationType, React.ElementType> = {
  meeting: Video,
  task: CheckCircle,
  overdue: AlertTriangle,
  invite: UserPlus,
}

const typeColor: Record<NotificationType, string> = {
  meeting: 'text-[#6366F1] bg-[rgba(99,102,241,0.12)]',
  task: 'text-[#22C55E] bg-[rgba(34,197,94,0.12)]',
  overdue: 'text-[#EF4444] bg-[rgba(239,68,68,0.12)]',
  invite: 'text-[#3B82F6] bg-[rgba(59,130,246,0.12)]',
}

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useShell()
  const panelRef = useRef<HTMLDivElement>(null)

  useClickOutside(panelRef, () => setNotificationPanelOpen(false), notificationPanelOpen)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && notificationPanelOpen) setNotificationPanelOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [notificationPanelOpen, setNotificationPanelOpen])

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          {/* Backdrop (subtle, panel overlays content) */}
          <div className="fixed inset-0 z-40" aria-hidden="true" />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: [0.0, 0.0, 0.2, 1.0] }}
            className={cn(
              'fixed top-12 right-0 bottom-0 z-50 w-[360px] flex flex-col',
              'bg-[#FFFFFF] dark:bg-[#111827]',
              'border-l border-[#E5E7EB] dark:border-[#1F2937]',
              'shadow-[−4px_0_24px_rgba(0,0,0,0.08)] dark:shadow-none',
            )}
            role="complementary"
            aria-label="Notifications"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
              <h2 className="text-[15px] font-semibold text-[#111827] dark:text-[#F9FAFB]">
                Notifications
              </h2>
              <div className="flex items-center gap-2">
                <button
                  className="text-[12px] text-[#6366F1] hover:text-[#4F46E5] transition-colors duration-[120ms] font-medium"
                  onClick={() => {}}
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setNotificationPanelOpen(false)}
                  aria-label="Close notifications"
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] transition-colors duration-[120ms]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {MOCK_NOTIFICATIONS.map((n) => {
                const Icon = typeIcon[n.type]
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'relative flex items-start gap-3 px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-[120ms] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#0d1117]',
                    )}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-[#6366F1]" aria-hidden="true" />
                    )}

                    {/* Icon */}
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', typeColor[n.type])}>
                      <Icon size={14} aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] font-medium leading-snug',
                        n.read ? 'text-[#6B7280] dark:text-[#9CA3AF]' : 'text-[#111827] dark:text-[#F9FAFB]',
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280] mt-0.5 truncate">{n.body}</p>
                      <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] mt-1">{n.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#E5E7EB] dark:border-[#1F2937]">
              <button className="w-full text-center text-[13px] text-[#6366F1] hover:text-[#4F46E5] font-medium transition-colors duration-[120ms]">
                View all notifications
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
