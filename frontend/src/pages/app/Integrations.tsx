import { Plug } from 'lucide-react'
import { EmptyState } from '../../ui/EmptyState'

function PageHeader() {
  return (
    <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
      <div>
        <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
          Integrations
        </h1>
        <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          Connect Zoom, Notion, Jira, and more
        </p>
      </div>
    </div>
  )
}

export function Integrations() {
  return (
    <div className="min-h-full">
      <PageHeader />
      <div className="flex-1 pt-4">
        <EmptyState
          icon={<Plug size={24} />}
          title="No integrations connected"
          description="Connect your tools to sync action items, push decisions to Notion, and auto-import Zoom recordings."
          action={{ label: 'Browse Integrations', onClick: () => {} }}
        />
      </div>
    </div>
  )
}
