import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Bot, Plus, LogOut, RefreshCw, ExternalLink, Video } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { EmptyState } from '../../ui/EmptyState'
import { SkeletonTableRows } from '../../ui/Skeleton'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'

// ─── Types ─────────────────────────────────────────────────────────────────────

type BotStatus =
  | 'PENDING'
  | 'JOINING'
  | 'WAITING_ADMISSION'
  | 'IN_CALL'
  | 'LEFT'
  | 'FAILED'

interface MeetingBot {
  id: string
  meetingUrl: string
  displayName: string
  status: BotStatus
  statusDetail?: string | null
  createdAt: string
  joinedAt?: string | null
  leftAt?: string | null
}

const TERMINAL: BotStatus[] = ['LEFT', 'FAILED']
const isTerminal = (s: BotStatus) => TERMINAL.includes(s)

// Mirrors the backend Joi rule (backend/src/modules/meeting-bot/meeting-bot.validation.ts)
const GOOGLE_MEET_URL = /^https:\/\/meet\.google\.com\/[a-z0-9-]+(\?.*)?$/i

// ─── Status badge ───────────────────────────────────────────────────────────────

const statusConfig: Record<BotStatus, { bg: string; text: string; dot: string; label: string; pulse?: boolean }> = {
  PENDING: {
    bg: 'bg-[#F9FAFB] dark:bg-[#111827]',
    text: 'text-[#6B7280] dark:text-[#9CA3AF]',
    dot: 'bg-[#9CA3AF] dark:bg-[#6B7280]',
    label: 'Queued',
  },
  JOINING: {
    bg: 'bg-[rgba(99,102,241,0.12)]',
    text: 'text-[#6366F1]',
    dot: 'bg-[#6366F1]',
    label: 'Joining',
    pulse: true,
  },
  WAITING_ADMISSION: {
    bg: 'bg-[rgba(245,158,11,0.12)]',
    text: 'text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
    label: 'Waiting for admission',
    pulse: true,
  },
  IN_CALL: {
    bg: 'bg-[rgba(34,197,94,0.12)]',
    text: 'text-[#22C55E]',
    dot: 'bg-[#22C55E]',
    label: 'In call',
    pulse: true,
  },
  LEFT: {
    bg: 'bg-[#F9FAFB] dark:bg-[#111827]',
    text: 'text-[#6B7280] dark:text-[#9CA3AF]',
    dot: 'bg-[#9CA3AF] dark:bg-[#6B7280]',
    label: 'Left',
  },
  FAILED: {
    bg: 'bg-[rgba(239,68,68,0.12)]',
    text: 'text-[#EF4444]',
    dot: 'bg-[#EF4444]',
    label: 'Failed',
  },
}

function BotStatusBadge({ status }: { status: BotStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      role="status"
      aria-label={cfg.label}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium whitespace-nowrap',
        cfg.bg,
        cfg.text,
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot, cfg.pulse && 'animate-pulse')}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  )
}

// ─── Error extraction ────────────────────────────────────────────────────────────

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined
    if (data?.error?.message) return data.error.message
    if (err.message) return err.message
  }
  return fallback
}

// ─── Dispatch modal ──────────────────────────────────────────────────────────────

function DispatchModal({
  open,
  onClose,
  onDispatched,
}: {
  open: boolean
  onClose: () => void
  onDispatched: () => void
}) {
  const [meetingUrl, setMeetingUrl] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [urlError, setUrlError] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setMeetingUrl('')
    setDisplayName('')
    setUrlError(undefined)
    setSubmitError(undefined)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    setSubmitError(undefined)
    if (!GOOGLE_MEET_URL.test(meetingUrl.trim())) {
      setUrlError('Enter a valid Google Meet link (https://meet.google.com/...)')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/api/bots', {
        meetingUrl: meetingUrl.trim(),
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      })
      reset()
      onDispatched()
      onClose()
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'Could not dispatch the bot. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Send a bot to a meeting"
      size="md"
      preventBackdropClose={submitting}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={submitting}
            icon={<Bot size={14} />}
          >
            {submitting ? 'Dispatching...' : 'Dispatch bot'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 px-4 py-3 rounded-[6px] bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)]">
          <Bot size={14} className="text-[#6366F1] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] leading-[1.6]">
            The bot opens the Google Meet link as a guest named below and asks to join. Admit it
            from the meeting to let it in. It joins with mic and camera off.
          </p>
        </div>

        <Input
          label="Google Meet link"
          placeholder="https://meet.google.com/abc-defg-hij"
          value={meetingUrl}
          onChange={(e) => {
            setMeetingUrl(e.target.value)
            if (urlError) setUrlError(undefined)
          }}
          error={urlError}
          required
        />

        <Input
          label="Bot display name"
          placeholder="ZeroClutter Notetaker"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          hint="Optional — shown in the meeting participant list. Defaults to ZeroClutter Notetaker."
        />

        {submitError && (
          <div className="px-4 py-3 rounded-[6px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)]">
            <p className="text-[13px] text-[#EF4444]">{submitError}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Bot row ─────────────────────────────────────────────────────────────────────

function BotRow({ bot, onLeave, leaving }: { bot: MeetingBot; onLeave: (id: string) => void; leaving: boolean }) {
  const created = new Date(bot.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-4 px-8 py-3.5 border-b border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#0d1117] transition-colors duration-[120ms] group">
      <div className="w-8 h-8 rounded-[6px] bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#6366F1]" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#111827] dark:text-[#F9FAFB] truncate">
          {bot.displayName}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <a
            href={bot.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[12px] text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6366F1] transition-colors truncate max-w-[280px]"
          >
            <ExternalLink size={11} aria-hidden="true" />
            {bot.meetingUrl.replace('https://', '')}
          </a>
          <span className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280] hidden sm:block">{created}</span>
        </div>
        {bot.status === 'FAILED' && bot.statusDetail && (
          <p className="text-[12px] text-[#EF4444] mt-1 truncate max-w-[420px]">{bot.statusDetail}</p>
        )}
      </div>

      <BotStatusBadge status={bot.status} />

      <div className="w-[92px] flex justify-end flex-shrink-0">
        {!isTerminal(bot.status) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onLeave(bot.id)}
            loading={leaving}
            icon={<LogOut size={12} />}
          >
            Leave
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export function Bots() {
  const [bots, setBots] = useState<MeetingBot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | undefined>()
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  const fetchBots = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const res = await api.get<{ data: { items: MeetingBot[] } }>('/api/bots', {
        params: { page: 1, limit: 50 },
      })
      setBots(res.data.data.items)
      setLoadError(undefined)
    } catch (err) {
      if (!opts?.silent) setLoadError(apiErrorMessage(err, 'Could not load bots.'))
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  // Live polling while any bot is still active
  useEffect(() => {
    const hasActive = bots.some((b) => !isTerminal(b.status))
    if (!hasActive) return
    const timer = setInterval(() => fetchBots({ silent: true }), 4000)
    return () => clearInterval(timer)
  }, [bots, fetchBots])

  const handleLeave = async (id: string) => {
    setLeavingId(id)
    try {
      await api.post(`/api/bots/${id}/leave`)
      await fetchBots({ silent: true })
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not send the leave request.'))
    } finally {
      setLeavingId(null)
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
        <div>
          <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
            Meeting Bots
          </h1>
          <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Send a bot to join a Google Meet call and track its status live
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => fetchBots()}
            icon={<RefreshCw size={14} />}
            aria-label="Refresh"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setDispatchOpen(true)}
            icon={<Plus size={14} />}
          >
            Send bot to meeting
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="px-8 py-3 bg-[rgba(239,68,68,0.06)] border-b border-[rgba(239,68,68,0.2)]">
          <p className="text-[13px] text-[#EF4444]">{loadError}</p>
        </div>
      )}

      {/* Body */}
      <div className="flex-1">
        {loading ? (
          <SkeletonTableRows count={4} />
        ) : bots.length === 0 ? (
          <EmptyState
            icon={<Video size={24} />}
            title="No bots yet"
            description="Send a bot to a Google Meet call. It will join as a guest and you can admit it from the meeting."
            action={{ label: 'Send bot to meeting', onClick: () => setDispatchOpen(true) }}
          />
        ) : (
          <div>
            {bots.map((b) => (
              <BotRow key={b.id} bot={b} onLeave={handleLeave} leaving={leavingId === b.id} />
            ))}
          </div>
        )}
      </div>

      <DispatchModal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        onDispatched={() => fetchBots({ silent: true })}
      />
    </div>
  )
}
