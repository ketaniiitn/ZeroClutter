import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShellProvider, useShell } from '../contexts/ShellContext'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { NotificationPanel } from './NotificationPanel'
import { SearchOverlay } from './SearchOverlay'
import { cn } from '../lib/cn'

function ShellLayout() {
  const { sidebarCollapsed } = useShell()

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0B0F17]">
      {/* Fixed Topbar */}
      <Topbar />

      {/* Fixed Sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Content area — offset by topbar and sidebar */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 56 : 240,
        }}
        transition={{ duration: 0.22, ease: [0.4, 0.0, 0.6, 1.0] }}
        className={cn(
          'min-h-screen pt-12',
          // On mobile: no left margin, add bottom padding for mobile nav
          'ml-0 md:ml-auto',
          'pb-14 md:pb-0',
        )}
        style={{
          // Override motion animation on mobile
        }}
      >
        {/* Page content with consistent padding */}
        <div className="h-full">
          {/* Route-level fade transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </motion.main>

      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      {/* Overlays */}
      <NotificationPanel />
      <SearchOverlay />
    </div>
  )
}

// Wrapper that provides ShellContext
export function AppShell() {
  return (
    <ShellProvider>
      <ShellLayout />
    </ShellProvider>
  )
}
