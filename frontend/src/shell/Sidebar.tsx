import { useRef } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Sparkles,
  BarChart2,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useShell } from '../contexts/ShellContext'
import { cn } from '../lib/cn'

const PRIMARY_NAV = [
  { label: 'Overview', icon: LayoutDashboard, path: 'overview' },
  { label: 'Meetings', icon: Video, path: 'meetings' },
  { label: 'Tasks', icon: CheckSquare, path: 'tasks' },
  { label: 'AI Assistant', icon: Sparkles, path: 'assistant' },
]

const SECONDARY_NAV = [
  { label: 'Analytics', icon: BarChart2, path: 'analytics' },
  { label: 'Integrations', icon: Plug, path: 'integrations' },
]

const TERTIARY_NAV = [
  { label: 'Settings', icon: Settings, path: 'settings' },
]

interface NavItemProps {
  label: string
  icon: React.ElementType
  path: string
  workspaceSlug: string
  collapsed: boolean
}

function NavItem({ label, icon: Icon, path, workspaceSlug, collapsed }: NavItemProps) {
  const to = `/${workspaceSlug}/${path}`

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-[6px] transition-colors duration-[120ms] group',
          collapsed ? 'justify-center w-9 h-9 mx-auto' : 'h-8 px-2',
          isActive
            ? [
                'bg-[rgba(99,102,241,0.12)] text-[#6366F1]',
                'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-[#6366F1]',
              ]
            : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F9FAFB] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB]',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            aria-hidden="true"
            className={cn(
              'flex-shrink-0',
              isActive ? 'text-[#6366F1]' : 'text-current',
            )}
          />
          {!collapsed && (
            <span className="text-[14px] font-medium truncate">
              {label}
            </span>
          )}
          {collapsed && (
            <span className="sr-only">{label}</span>
          )}
        </>
      )}
    </NavLink>
  )
}

function Separator() {
  return <div className="my-1.5 border-t border-[#E5E7EB] dark:border-[#1F2937]" />
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useShell()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const slug = workspaceSlug ?? 'workspace'

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 56 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0.0, 0.6, 1.0] }}
      className={cn(
        'fixed left-0 top-[48px] bottom-0 z-40 flex flex-col overflow-hidden',
        'bg-[#FFFFFF] dark:bg-[#0B0F17]',
        'border-r border-[#E5E7EB] dark:border-[#1F2937]',
      )}
      aria-label="Main navigation"
    >
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {/* Primary group */}
        <div className="flex flex-col gap-0.5">
          {PRIMARY_NAV.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              workspaceSlug={slug}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>

        <Separator />

        {/* Secondary group */}
        <div className="flex flex-col gap-0.5">
          {SECONDARY_NAV.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              workspaceSlug={slug}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>

        <Separator />

        {/* Tertiary group */}
        <div className="flex flex-col gap-0.5">
          {TERTIARY_NAV.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              workspaceSlug={slug}
              collapsed={sidebarCollapsed}
            />
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[#E5E7EB] dark:border-[#1F2937] p-2 flex justify-end">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#9CA3AF] dark:text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#111827] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors duration-[120ms]"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </motion.aside>
  )
}
