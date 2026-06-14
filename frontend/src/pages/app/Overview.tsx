import { useNavigate, useParams } from 'react-router-dom'
import { Video, CheckSquare, ArrowRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MetricCard } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { Button } from '../../ui/Button'
import { cn } from '../../lib/cn'

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ name }: { name: string }) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          {greeting}, {name.split(' ')[0]}
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  )
}

// ─── Recent Meetings Empty ─────────────────────────────────────────────────────

function RecentMeetingsEmpty({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      icon={<Video size={24} />}
      title="No meetings yet"
      description="Upload a transcript to get started. Your first meeting will appear here."
      action={{ label: 'Upload Meeting', onClick: onUpload }}
      compact
    />
  )
}

// ─── Overdue Tasks Empty ───────────────────────────────────────────────────────

function OverdueTasksEmpty() {
  return (
    <EmptyState
      icon={<CheckSquare size={24} />}
      title="No action items"
      description="Tasks extracted from meetings will appear here."
      compact
    />
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  linkLabel,
  onLinkClick,
  children,
  className,
}: {
  title: string
  linkLabel?: string
  onLinkClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-[8px] border overflow-hidden',
        'bg-white dark:bg-[#111827]',
        'border-[#E5E7EB] dark:border-[#1F2937]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.07)] dark:shadow-none',
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
        <h2 className="text-[13px] font-semibold text-[#111827] dark:text-[#F9FAFB]">{title}</h2>
        {linkLabel && onLinkClick && (
          <button
            onClick={onLinkClick}
            className="flex items-center gap-1 text-[12px] text-[#6366F1] hover:text-[#4F46E5] transition-colors duration-[120ms] font-medium"
          >
            {linkLabel}
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Overview() {
  const { user } = useAuth()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const navigate = useNavigate()

  const handleUpload = () => navigate(`/${workspaceSlug}/meetings`)

  return (
    <div className="min-h-full">
      <PageHeader name={user?.name ?? 'there'} />

      <div className="px-8 py-6 space-y-6 max-w-[1400px]">
        {/* Metric row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total meetings', value: '0', period: 'all time' },
            { label: 'Action items', value: '0', period: 'all time' },
            { label: 'Completion rate', value: '—', period: 'no data yet' },
            { label: 'Team members', value: '1', period: 'in workspace' },
          ].map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Recent Meetings — 60% width (3/5) */}
          <SectionCard
            title="Recent meetings"
            linkLabel="View all"
            onLinkClick={() => navigate(`/${workspaceSlug}/meetings`)}
            className="lg:col-span-3"
          >
            <RecentMeetingsEmpty onUpload={handleUpload} />
          </SectionCard>

          {/* Overdue Tasks — 40% width (2/5) */}
          <SectionCard
            title="Overdue tasks"
            linkLabel="View all"
            onLinkClick={() => navigate(`/${workspaceSlug}/tasks`)}
            className="lg:col-span-2"
          >
            <OverdueTasksEmpty />
          </SectionCard>
        </div>

        {/* Getting started hint */}
        <div className="flex items-start gap-4 px-5 py-4 rounded-[8px] border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.04)]">
          <div className="w-8 h-8 rounded-full bg-[rgba(99,102,241,0.12)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Video size={14} className="text-[#6366F1]" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#111827] dark:text-[#F9FAFB]">
              Ready to extract action items from your first meeting?
            </p>
            <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              Upload a transcript JSON file and ZeroClutter will extract decisions, action items, and owners automatically.
            </p>
          </div>
          <Button size="sm" onClick={handleUpload} icon={<ArrowRight size={14} />} iconPosition="right">
            Upload transcript
          </Button>
        </div>
      </div>
    </div>
  )
}
