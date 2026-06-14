import { useNavigate, useParams } from 'react-router-dom'
import { CheckSquare, Video } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

function PageHeader() {
  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          Tasks
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Action items extracted from your meeting transcripts
        </p>
      </div>
    </div>
  )
}

export function Tasks() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-full">
      <PageHeader />
      <div className="flex-1 pt-4">
        <EmptyState
          icon={<CheckSquare size={24} />}
          title="No action items yet"
          description="Once you upload meeting transcripts, ZeroClutter will extract action items and assign them here."
          action={{ label: 'View Meetings', onClick: () => navigate(`/${workspaceSlug}/meetings`) }}
          secondaryAction={{
            label: 'Learn more',
            onClick: () => {},
            variant: 'ghost',
          }}
        />
      </div>
    </div>
  )
}
