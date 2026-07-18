import { useState } from 'react'

const STORAGE_KEY = 'zc_sidebar_collapsed'

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // localStorage unavailable
    }
  }

  const toggle = () => setCollapsed(!collapsed)

  return { collapsed, setCollapsed, toggle }
}
