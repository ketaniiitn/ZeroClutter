import { useNavigate, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

function PageHeader() {
  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          AI Assistant
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Ask questions across all your meeting data
        </p>
      </div>
    </div>
  )
}

export function Assistant() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      <PageHeader />
      <div className="flex-1 pt-4">
        <EmptyState
          icon={<Sparkles size={24} />}
          title="AI Assistant coming soon"
          description="Upload at least one meeting transcript to unlock the AI assistant. Ask questions, get summaries, and surface insights across all your meeting data."
          action={{ label: 'Upload a Meeting', onClick: () => navigate(`/${workspaceSlug}/meetings`) }}
        />
      </div>
    </div>
  )
}
