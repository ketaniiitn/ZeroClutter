import { User, Building2, Bell, Shield, CreditCard } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '../../lib/cn'

const SETTINGS_NAV = [
  { label: 'Profile', to: 'profile', icon: User },
  { label: 'Workspace', to: 'workspace', icon: Building2 },
  { label: 'Notifications', to: 'notifications', icon: Bell },
  { label: 'Security', to: 'security', icon: Shield },
  { label: 'Billing', to: 'billing', icon: CreditCard },
]

function SettingsSidebar() {
  return (
    <nav
      className="w-[200px] flex-shrink-0 border-r border-[#E5E7EB] dark:border-[#1F2937] pt-2"
      aria-label="Settings navigation"
    >
      {SETTINGS_NAV.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors duration-[120ms] rounded-[6px] mx-2',
              isActive
                ? 'bg-[rgba(99,102,241,0.1)] text-[#6366F1]'
                : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F2937] hover:text-[#111827] dark:hover:text-[#F9FAFB]',
            )
          }
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SettingsPlaceholder({ section }: { section: string }) {
  return (
    <div className="flex-1 px-8 py-6">
      <h2 className="text-[18px] font-semibold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.01em] mb-1">
        {section}
      </h2>
      <p className="text-[14px] text-[#9CA3AF] dark:text-[#6B7280]">
        Settings for {section.toLowerCase()} will be available in an upcoming release.
      </p>
    </div>
  )
}

export function SettingsProfile() { return <SettingsPlaceholder section="Profile" /> }
export function SettingsWorkspace() { return <SettingsPlaceholder section="Workspace" /> }
export function SettingsNotifications() { return <SettingsPlaceholder section="Notifications" /> }
export function SettingsSecurity() { return <SettingsPlaceholder section="Security" /> }
export function SettingsBilling() { return <SettingsPlaceholder section="Billing" /> }

export function Settings() {
  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-[#E5E7EB] dark:border-[#1F2937]">
        <div>
          <h1 className="text-[24px] font-bold text-[#111827] dark:text-[#F9FAFB] tracking-[-0.02em]">
            Settings
          </h1>
          <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Manage your account and workspace preferences
          </p>
        </div>
      </div>

      {/* Two-panel layout: secondary nav + content */}
      <div className="flex h-[calc(100vh-48px-80px)] overflow-hidden">
        <SettingsSidebar />
        <Outlet />
      </div>
    </div>
  )
}
