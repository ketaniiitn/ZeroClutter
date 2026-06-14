import { useNavigate, useParams } from 'react-router-dom'
import { BarChart2, Video } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

function PageHeader() {
  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          Analytics
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Meeting trends, task completion rates, and team insights
        </p>
      </div>
    </div>
  )
}

export function Analytics() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      <PageHeader />
      <div className="flex-1 pt-4">
        <EmptyState
          icon={<BarChart2 size={24} />}
          title="Not enough data yet"
          description="Analytics will appear once you have meeting history. Upload transcripts to start tracking trends and completion rates."
          action={{ label: 'Go to Meetings', onClick: () => navigate(`/${workspaceSlug}/meetings`) }}
        />
      </div>
    </div>
  )
}
