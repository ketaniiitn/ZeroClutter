import { createContext, useContext, useState, type ReactNode } from 'react'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'

interface ShellContextValue {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  notificationPanelOpen: boolean
  setNotificationPanelOpen: (v: boolean) => void
  searchOverlayOpen: boolean
  setSearchOverlayOpen: (v: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const { collapsed, setCollapsed, toggle } = useSidebarCollapsed()
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ShellContext.Provider
      value={{
        sidebarCollapsed: collapsed,
        setSidebarCollapsed: setCollapsed,
        toggleSidebar: toggle,
        notificationPanelOpen,
        setNotificationPanelOpen,
        searchOverlayOpen,
        setSearchOverlayOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </ShellContext.Provider>
  )
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used inside ShellProvider')
  return ctx
}
