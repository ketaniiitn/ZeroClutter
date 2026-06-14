import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Video, Upload, List, LayoutGrid, Calendar, Clock, Users } from 'lucide-react'
import { Button } from '../../ui/Button'
import { SearchInput } from '../../ui/Input'
import { Input, FileInput } from '../../ui/Input'
import { Modal } from '../../ui/Modal'
import { EmptyState } from '../../ui/EmptyState'
import { StatusBadge } from '../../ui/Badge'
import { SkeletonTableRows } from '../../ui/Skeleton'
import { cn } from '../../lib/cn'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MeetingRow {
  id: string
  title: string
  date: string
  duration?: string
  participants: string[]
  status: 'completed' | 'in-progress' | 'pending' | 'overdue'
  actionItems: number
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadForm {
  title: string
  date: string
  file: File | null
}

interface UploadErrors {
  title?: string
  date?: string
  file?: string
}

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<UploadForm>({ title: '', date: '', file: null })
  const [errors, setErrors] = useState<UploadErrors>({})
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = (): boolean => {
    const e: UploadErrors = {}
    if (!form.title.trim()) e.title = 'Meeting title is required'
    if (!form.date) e.date = 'Meeting date is required'
    if (!form.file) e.file = 'Please select a transcript JSON file'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setUploading(true)

    // Mock handler — replace with real API call in next sprint
    await new Promise((r) => setTimeout(r, 1500))

    setUploading(false)
    setSuccess(true)

    // Reset and close after brief success state
    setTimeout(() => {
      setSuccess(false)
      setForm({ title: '', date: '', file: null })
      setErrors({})
      onClose()
    }, 1200)
  }

  const handleClose = () => {
    if (uploading) return
    setForm({ title: '', date: '', file: null })
    setErrors({})
    setSuccess(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Upload transcript"
      size="md"
      preventBackdropClose={uploading}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={uploading}
            disabled={success}
            icon={success ? <span>✓</span> : <Upload size={14} />}
          >
            {success ? 'Uploaded!' : uploading ? 'Uploading...' : 'Upload transcript'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-[6px] bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)]">
          <Video size={14} className="text-[#6366F1] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] leading-[1.6]">
            Upload a transcript in JSON format. ZeroClutter will parse it, extract action items, decisions, and owners automatically.
          </p>
        </div>

        {/* Meeting title */}
        <Input
          label="Meeting title"
          placeholder="e.g. Sprint Planning Q2, Design Review"
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }))
            if (errors.title) setErrors((e) => ({ ...e, title: undefined }))
          }}
          error={errors.title}
          required
        />

        {/* Meeting date */}
        <Input
          label="Meeting date"
          type="date"
          value={form.date}
          onChange={(e) => {
            setForm((f) => ({ ...f, date: e.target.value }))
            if (errors.date) setErrors((e) => ({ ...e, date: undefined }))
          }}
          error={errors.date}
          required
        />

        {/* File upload */}
        <FileInput
          label="Transcript JSON file"
          accept=".json,application/json"
          onChange={(file) => {
            setForm((f) => ({ ...f, file }))
            if (errors.file) setErrors((e) => ({ ...e, file: undefined }))
          }}
          error={errors.file}
          hint="Accepts .json files only"
          required
        />
      </div>
    </Modal>
  )
}

// ─── Page Header ──────────────────────────────────────────────────────────────

function PageHeader({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          Meetings
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Upload transcripts to extract decisions and action items
        </p>
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={onUpload}
        icon={<Upload size={14} />}
      >
        Upload transcript
      </Button>
    </div>
  )
}

// ─── Table Toolbar ────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'grid'

function TableToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  view: ViewMode
  onViewChange: (v: ViewMode) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-8 py-3 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search meetings..."
          className="w-full"
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-0.5 bg-[#F3F4F6] dark:bg-[#111827] rounded-[6px] p-0.5">
        <button
          onClick={() => onViewChange('list')}
          aria-label="List view"
          aria-pressed={view === 'list'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-[4px] transition-colors duration-[120ms]',
            view === 'list'
              ? 'bg-white dark:bg-[#1a2030] text-[#111827] dark:text-[#F9FAFB] shadow-sm'
              : 'text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF]',
          )}
        >
          <List size={14} aria-hidden="true" />
        </button>
        <button
          onClick={() => onViewChange('grid')}
          aria-label="Grid view"
          aria-pressed={view === 'grid'}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-[4px] transition-colors duration-[120ms]',
            view === 'grid'
              ? 'bg-white dark:bg-[#1a2030] text-[#111827] dark:text-[#F9FAFB] shadow-sm'
              : 'text-[#9CA3AF] dark:text-[#6B7280] hover:text-[#6B7280] dark:hover:text-[#9CA3AF]',
          )}
        >
          <LayoutGrid size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─── Meeting Row (list view) ──────────────────────────────────────────────────

function MeetingRow({ meeting }: { meeting: MeetingRow }) {
  const date = new Date(meeting.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-4 px-8 py-3.5 border-b border-[#E5E7EB] dark:border-[#1F2937] hover:bg-[#F9FAFB] dark:hover:bg-[#0d1117] transition-colors duration-[120ms] cursor-pointer group">
      {/* Icon */}
      <div className="w-8 h-8 rounded-[6px] bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.15)] flex items-center justify-center flex-shrink-0">
        <Video size={14} className="text-[#6366F1]" aria-hidden="true" />
      </div>

      {/* Title + date */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#111827] dark:text-[#F9FAFB] truncate">{meeting.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF] dark:text-[#6B7280]">
            <Calendar size={11} aria-hidden="true" />
            {date}
          </span>
          {meeting.duration && (
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF] dark:text-[#6B7280]">
              <Clock size={11} aria-hidden="true" />
              {meeting.duration}
            </span>
          )}
          {meeting.participants.length > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-[#9CA3AF] dark:text-[#6B7280]">
              <Users size={11} aria-hidden="true" />
              {meeting.participants.length}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <StatusBadge status={meeting.status} />

      {/* Action items count */}
      <span className="text-[12px] text-[#9CA3AF] dark:text-[#6B7280] flex-shrink-0 hidden sm:block">
        {meeting.actionItems} action{meeting.actionItems !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Meetings() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('list')

  // Empty for now — data comes in next sprint
  const meetings: MeetingRow[] = []
  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader onUpload={() => setUploadOpen(true)} />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
      />

      {/* Table body */}
      <div className="flex-1">
        {filtered.length === 0 ? (
          search ? (
            <EmptyState
              icon={<Video size={24} />}
              title={`No results for "${search}"`}
              description="Try different keywords or clear your search."
              action={{ label: 'Clear search', onClick: () => setSearch(''), variant: 'ghost' }}
            />
          ) : (
            <EmptyState
              icon={<Video size={24} />}
              title="No meetings yet"
              description="Upload a transcript JSON file to extract decisions and action items automatically."
              action={{ label: 'Upload transcript', onClick: () => setUploadOpen(true) }}
            />
          )
        ) : (
          <div>
            {filtered.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
