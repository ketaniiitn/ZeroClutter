# Sprint 3 — App Shell & Design System Foundation
## Implementation Flow Reference

---

## What Was Built

Sprint 3 established the complete SaaS application shell and design system foundation. No backend was modified.

---

## File Map

```
frontend/src/
│
├── index.css                     # Design tokens as CSS custom properties
│                                 # :root (light) + .dark (dark mode overrides)
│                                 # @keyframes shimmer for skeleton animation
│
├── lib/
│   ├── cn.ts                     # className merger utility
│   └── tokens.ts                 # Design token class strings (t.bg.surface, etc.)
│
├── ui/                           # Reusable design system components
│   ├── Button.tsx                # 5 variants × 4 sizes, loading state, icon slots
│   ├── Badge.tsx                 # StatusBadge + PriorityBadge with dot indicators
│   ├── Input.tsx                 # Input, Textarea, SearchInput, Toggle, FileInput
│   ├── Modal.tsx                 # AnimatePresence modal, Escape/backdrop close
│   ├── Card.tsx                  # Card + MetricCard with trend indicators
│   ├── Table.tsx                 # Generic typed Table<T> with column config
│   ├── EmptyState.tsx            # Icon + title + description + 2 action buttons
│   ├── Skeleton.tsx              # Skeleton shimmer + SkeletonText/Card/Table composites
│   └── index.ts                  # Barrel export
│
├── hooks/
│   ├── useSidebarCollapsed.ts    # Persists sidebar state to localStorage
│   └── useClickOutside.ts        # mousedown/touchstart listener with enabled flag
│
├── contexts/
│   └── ShellContext.tsx          # sidebar/notification/search/mobile menu state
│
├── shell/                        # App shell components
│   ├── Sidebar.tsx               # Fixed 240px/56px sidebar, 3 nav groups, collapse toggle
│   ├── Topbar.tsx                # 48px fixed header: workspace switcher, search, bell, theme, user
│   ├── MobileNav.tsx             # Bottom bar (56px) + "More" sheet for mobile
│   ├── NotificationPanel.tsx     # 360px slide-in panel from right edge
│   ├── SearchOverlay.tsx         # Cmd+K full-screen search dialog (600px)
│   └── AppShell.tsx              # Layout wrapper (Outlet)
│
├── pages/app/                    # SaaS page components
│   ├── Overview.tsx              # Dashboard: greeting, 4 metric cards, 2-column sections
│   ├── Meetings.tsx              # List page: search toolbar, view toggle, Upload modal
│   ├── Tasks.tsx                 # Stub: empty state → navigate to Meetings
│   ├── Assistant.tsx             # Stub: empty state → navigate to Meetings
│   ├── Analytics.tsx             # Stub: empty state → navigate to Meetings
│   ├── Integrations.tsx          # Stub: empty state for future integrations
│   └── Settings.tsx              # Secondary sidebar layout + 5 section stubs
│
└── App.tsx                       # Updated with all workspace-scoped routes
```

---

## Route Architecture

All SaaS routes are workspace-scoped and protected:

```
/                               → Landing page (public)
/login                          → Login (public)
/signup                         → Signup (public)
/auth/callback                  → Auth callback (public)
/onboarding                     → Onboarding (protected, legacy)
/:workspaceSlug                 → AppShell (layout)
/:workspaceSlug/overview        → Overview page
/:workspaceSlug/meetings        → Meetings page
/:workspaceSlug/tasks           → Tasks page
/:workspaceSlug/assistant       → AI Assistant page
/:workspaceSlug/analytics       → Analytics page
/:workspaceSlug/integrations    → Integrations page
/:workspaceSlug/settings        → Settings layout
  ├── /profile                  → Profile settings
  ├── /workspace                → Workspace settings
  ├── /notifications            → Notification settings
  ├── /security                 → Security settings
  └── /billing                  → Billing settings
```

---

## Data Flow

```
AuthProvider
  └── ProtectedRoute
        └── AppShell
              └── ShellProvider (sidebar/search/notifications state)
                    ├── Topbar
                    │     ├── WorkspaceSwitcher → switches active workspace → navigates to /:slug/overview
                    │     ├── SearchTrigger → opens SearchOverlay
                    │     ├── NotificationBell → opens NotificationPanel
                    │     ├── ThemeToggle → ThemeContext.toggle()
                    │     └── UserMenu → logout
                    ├── Sidebar (hidden on mobile)
                    │     └── NavLink per route → active = indigo highlight
                    ├── <Outlet /> → renders current page
                    ├── MobileNav (md:hidden) → bottom bar + More sheet
                    ├── NotificationPanel (slide-in from right)
                    └── SearchOverlay (Cmd+K fullscreen)
```

---

## Meetings Upload Flow

The only meeting ingestion method for MVP is manual transcript JSON upload.

```
User clicks "Upload transcript" (Meetings page header or empty state)
  → UploadModal opens (AnimatePresence)
      Fields:
        - Meeting Title (text, required)
        - Meeting Date (date, required)
        - Transcript JSON (file, required, .json only)
      Validation: runs on submit, inline error messages per field
      Submit:
        → Mock 1.5s upload delay
        → Success state (✓ Uploaded!)
        → Auto-close after 1.2s
        → Reset form
      Cancel/Escape: closes without saving (blocked during upload)
```

**To wire up the real API:** replace the `await new Promise(...)` mock in `UploadModal.handleSubmit()` in [Meetings.tsx](frontend/src/pages/app/Meetings.tsx) with a `fetch`/`axios` call to your transcripts endpoint.

---

## Dark Mode

- Toggled by adding/removing the `.dark` class on `document.documentElement` (ThemeContext)
- CSS custom properties in `:root` (light) and `.dark {}` (dark) drive all surface colors
- Tailwind dark mode uses `dark:` prefix variant (configured via `@custom-variant dark`)
- ThemeToggle in Topbar persists preference via ThemeContext

---

## Sidebar Persistence

- Collapsed state stored in `localStorage` key: `zc_sidebar_collapsed`
- Hook: [useSidebarCollapsed.ts](frontend/src/hooks/useSidebarCollapsed.ts)
- Framer Motion animates `marginLeft` on `<main>` between `56px` (collapsed) and `240px` (expanded)
- On mobile, sidebar is `hidden md:block` — content fills full width

---

## Design Token Quick Reference

| Token | Light | Dark |
|-------|-------|------|
| `--bg-base` | `#FFFFFF` | `#0B0F17` |
| `--bg-surface` | `#F9FAFB` | `#111827` |
| `--bg-elevated` | `#FFFFFF` | `#1a2030` |
| `--border-subtle` | `#E5E7EB` | `#1F2937` |
| `--text-primary` | `#111827` | `#F9FAFB` |
| `--text-secondary` | `#6B7280` | `#9CA3AF` |
| Primary | `#6366F1` | `#6366F1` |
| Danger | `#EF4444` | `#EF4444` |
| Success | `#22C55E` | `#22C55E` |

---

## Next Sprint Scope (Sprint 4)

- Wire `POST /api/meetings/upload` to the upload modal
- Parse transcript JSON → extract action items → populate Tasks page
- Meetings list table with real data
- Meeting detail page (two-panel: transcript + tasks)
- AI Assistant chat interface
