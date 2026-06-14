# ZeroClutter Application Shell Specification

**Version:** 1.0  
**Status:** Approved for Implementation  
**Authors:** Design Systems, Frontend Architecture  
**Last Updated:** 2026-06-11

---

## Preamble

This document defines the global application shell — the permanent, persistent scaffolding within which all ZeroClutter product surfaces live. The shell is not a page. It does not change as the user navigates. It is the invariant frame: sidebar, topbar, notification layer, workspace context, and mobile navigation. Every product screen inherits from this shell.

A well-designed application shell is invisible. The user does not notice it — they notice the content within it. When the shell demands attention, we have failed. This document defines how to make it invisible.

---

## Section 1 — App Shell Architecture

### 1.1 Shell Structure Overview

The application shell has four structural regions:

```
┌──────────────────────────────────────────────────────────────────┐
│                         TOPBAR (48px)                            │
├─────────────────────┬────────────────────────────────────────────┤
│                     │                                            │
│                     │                                            │
│  SIDEBAR            │         CONTENT AREA                       │
│  (240px expanded)   │         (fluid width)                      │
│  (56px collapsed)   │                                            │
│                     │                                            │
│                     │                                            │
└─────────────────────┴────────────────────────────────────────────┘
```

On mobile (below 768px), the topbar remains. The sidebar is hidden and replaced by a bottom navigation bar. The content area fills the full viewport width below the topbar.

---

### 1.2 Topbar

**Height:** 48px  
**Position:** Fixed, `z-index` above all page content  
**Background:** `bg.base` with bottom border `border.subtle`

The topbar is a single horizontal strip that provides workspace context, global search, and user-level controls. It does not repeat the current page title — that belongs in the page's own header.

**Topbar layout (left to right):**

```
[Workspace Switcher]     [Global Search]     [Notifications] [Theme Toggle] [User Menu]
```

*Left anchor — Workspace Switcher:*  
A compact trigger showing the current workspace name and avatar. Clicking opens a dropdown listing all workspaces the user belongs to, with a "Create workspace" item at the bottom. On mobile, the workspace switcher moves to a dedicated settings sub-section to preserve topbar space.

The workspace name is truncated at 200px with an ellipsis. The workspace avatar (first letter of name, `color.primary` background) appears to the left of the name.

*Center — Global Search:*  
A search input that is always visible on desktop. Does not require `Cmd+K` to activate — it is a real visible field, not a keyboard-only feature. Activating the search field opens a full-screen search overlay.

On tablet and below, the search field collapses to a search icon button. Clicking it expands the topbar into search mode (full-width input, cancel button on the right).

*Right anchor — Actions cluster:*

1. **Notifications bell** — Shows unread badge count. Opens a slide-in notification panel on click (not a new page). Badge count disappears when the panel is opened.

2. **Theme toggle** — Sun/moon icon button. Switches between light and dark mode. Transition: 150ms. Tooltip reads "Switch to light/dark mode." Persisted in localStorage and user preferences.

3. **User menu** — Avatar (32px circle, user's initials or photo). Opens a dropdown containing: Profile, Workspace Settings, Keyboard Shortcuts, Help, Sign out. Has a visual separator before Sign out.

**Topbar component rules:**
- No page navigation links in the topbar. The topbar is for workspace-level controls, not routing.
- The topbar never scrolls out of view.
- No breadcrumbs in the topbar. Breadcrumbs live in the page header if needed.

---

### 1.3 Sidebar

**Width (expanded):** 240px  
**Width (collapsed):** 56px  
**Position:** Fixed left, full height below topbar  
**Background:** `bg.base` with right border `border.subtle`

The sidebar is the primary navigation surface. It is always visible on desktop. It collapses to icon-only mode when the user wants more content area. The collapsed/expanded state is persisted per user.

**Sidebar structure (top to bottom):**

```
┌─────────────────────────┐
│  [Nav item: Overview]   │
│  [Nav item: Meetings]   │  ← Primary section
│  [Nav item: Tasks]      │
│  [Nav item: AI Asst.]   │
│  ─────────────────────  │
│  [Nav item: Analytics]  │  ← Secondary section
│  [Nav item: Integrations│
│  ─────────────────────  │
│  [Nav item: Settings]   │  ← Tertiary (bottom)
└─────────────────────────┘
```

**Sidebar padding:** 8px horizontal, 6px vertical between items.

**Nav item anatomy:**

```
[Icon 18px]  [Label]  [Badge count?]
```

Expanded state: icon + label visible. Collapsed state: icon only; tooltip on hover shows label.

**Active state:** `color.primary.muted` background, `color.primary` icon, `text.primary` label, 3px `color.primary` left border.

**Hover state (inactive item):** `bg.surface` background, `text.primary` text. Transition 120ms.

**Badge count:** Appears on the right side of the item label (e.g., "Tasks" showing 5 overdue). `color.danger.muted` background, `color.danger` text. Badge disappears when count is zero.

**Collapse toggle:** Small arrow button at the bottom of the sidebar, above Settings, or anchored to the right edge of the sidebar. Never a visible "Collapse" label — it is icon-only (`chevron-left` when expanded, `chevron-right` when collapsed).

**Sidebar section separators:** 1px `border.subtle` horizontal rule with 8px vertical margin. No section labels in the sidebar — the grouping is communicated by position and separator, not by text headers. (Linear convention: labels add noise when the items are self-evident.)

---

### 1.4 Content Area

**Left offset:** 240px (expanded sidebar) or 56px (collapsed)  
**Top offset:** 48px (topbar height)  
**Right offset:** 0  
**Overflow:** Vertical scroll within the content area, not the whole page

The content area is where every product surface lives. It has a consistent internal structure for all pages:

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER (title + subtitle + page actions)               │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  PAGE CONTENT (tables, cards, detail panels, etc.)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Page header height:** 64px single-line, 80px with subtitle.

**Page header contents:**
- Left: Page title (`text.title.xl`), optional subtitle (`text.secondary`, `text.body.md`)
- Right: Primary page-level actions (at most 1 Primary button + 1 Secondary button + 1 Ghost button)

**Content area max-width:** There is no global max-width constraint on the content area. Individual page templates define their own content width constraints where appropriate (e.g., forms cap at 720px; tables fill the full available width).

**Content area padding:** 32px horizontal on desktop, 24px on tablet, 16px on mobile.

---

### 1.5 Notification Panel

The notification panel is a slide-in panel from the right edge, 360px wide, overlaying the content area (not pushing it). It appears above the topbar layer.

**Panel structure:**

```
┌──────────────────────────────────────────┐
│  Notifications                    [✕]    │
│  ────────────────────────────────────── │
│  [Mark all read]               [Filter]  │
│  ────────────────────────────────────── │
│  [Notification item]                     │
│  [Notification item — unread dot]        │
│  [Notification item]                     │
│  ────────────────────────────────────── │
│  [View all notifications]                │
└──────────────────────────────────────────┘
```

**Notification item anatomy:** 56px tall. Icon (type) + content (title + body truncated to 1 line) + timestamp (relative, e.g., "2 min ago"). Unread items have a 6px `color.primary` dot on the left edge.

**Notification types:** Task assigned to you, Task overdue, Meeting processed (AI complete), Mention in a meeting note, Workspace invitation.

**Backdrop behavior:** Clicking outside the panel closes it. Escape key closes it.

---

### 1.6 Global Search Overlay

When the user activates global search, an overlay appears over the entire page (including sidebar and topbar). The overlay has a dark backdrop (`bg.overlay`) with a centered search dialog.

**Search dialog:**

```
┌───────────────────────────────────────────────────────────┐
│  🔍  Search meetings, tasks, people...         [Esc]       │
│ ──────────────────────────────────────────────────────── │
│  Recent                                                   │
│  [result item]                                            │
│  [result item]                                            │
│  ──────────────────────────────────────────────────────  │
│  Meetings         [result item]   [result item]           │
│  Tasks            [result item]   [result item]           │
└───────────────────────────────────────────────────────────┘
```

**Width:** 600px, centered. Appears at 20% from top of viewport.

**Keyboard behavior:** Typing immediately queries. Arrow keys navigate results. Enter follows the focused result. Escape closes the overlay. `Cmd+K` (Mac) / `Ctrl+K` (Windows) opens the overlay from anywhere in the application.

**Result types:** Meetings (with date and participant count), Tasks (with status and assignee), Team members (with workspace role), Pages (Settings, Integrations).

**Empty search state:** Shows recent activity (last 5 visited pages). Never shows a blank panel.

---

### 1.7 Mobile Navigation

Below 768px, the sidebar is hidden. Navigation is provided by a **bottom navigation bar** fixed to the bottom of the viewport.

**Bottom nav height:** 56px  
**Items:** Maximum 5. Priority order:

1. Overview (home/dashboard)
2. Meetings
3. Tasks
4. AI Assistant
5. More (reveals a full-screen sheet with: Analytics, Integrations, Settings, and any other navigation items)

**Bottom nav item anatomy:** Icon centered (20px) with a label below (10px, `text.caption`). Active item: `color.primary` icon + label, filled indicator dot above icon.

**"More" sheet:** Full-screen bottom sheet with all navigation items not in the primary 4. Same visual treatment as sidebar items. Sheet closes by swipe down or tapping backdrop.

**Topbar on mobile:** Shows workspace switcher (left), search icon (center), notification bell (right). No user menu — the user menu is accessible via the "More" sheet.

---

## Section 2 — Navigation Architecture

### 2.1 Navigation Items

**Primary Group — Daily Workflow**

| Label | Icon | Route | Purpose |
|-------|------|-------|---------|
| Overview | `layout-dashboard` | `/[workspace]/overview` | Dashboard with key metrics, recent meetings, overdue tasks |
| Meetings | `video` | `/[workspace]/meetings` | All meetings list, upload entry point |
| Tasks | `check-square` | `/[workspace]/tasks` | All action items across all meetings |
| AI Assistant | `sparkles` | `/[workspace]/assistant` | Conversational AI over all workspace meeting data |

**Secondary Group — Insight and Configuration**

| Label | Icon | Route | Purpose |
|-------|------|-------|---------|
| Analytics | `bar-chart-2` | `/[workspace]/analytics` | Trends, execution metrics, team performance |
| Integrations | `plug` | `/[workspace]/integrations` | Connected tools: Slack, Jira, Calendar, Zapier |

**Tertiary Group — Administration**

| Label | Icon | Route | Purpose |
|-------|------|-------|---------|
| Settings | `settings` | `/[workspace]/settings` | Profile, workspace, billing, members |

---

### 2.2 Navigation State Rules

**Active route determination:** The sidebar item is "active" when the current route matches the item's base path, including nested routes. Meetings is active for both `/meetings` and `/meetings/[id]`.

**Nested navigation:** Meeting Detail, Task Detail, and Integration Detail pages do not add new sidebar items. The parent item remains active. A breadcrumb in the page header provides the path back.

**Deep linking:** Every view in the product has a unique, bookmarkable URL. Navigation state is never stored in JavaScript state only — it is always derivable from the URL.

**Workspace-scoped routes:** All routes within the application are prefixed with the workspace slug: `/:workspaceSlug/meetings`, `/:workspaceSlug/tasks`, etc. This enables multi-workspace navigation without ambiguity.

---

### 2.3 Future Navigation Scalability

The navigation architecture accommodates growth without redesign:

**Adding a new top-level section:** Insert into the appropriate group in the sidebar. The sidebar can comfortably hold 10–12 items before requiring grouping headers. Current architecture (7 items) has significant headroom.

**Sub-navigation within sections:** If a section grows complex enough to require sub-navigation (e.g., Meetings → All Meetings, Meetings → Templates, Meetings → Recordings), sub-items appear as indented items below the parent when the parent is active. This is preferred over adding a secondary sidebar or tabs at the section level.

**Project/Team scoping:** If the product adds project or team scoping above workspace level, a second switcher appears in the topbar (left of the workspace switcher). The sidebar navigation remains unchanged.

---

## Section 3 — Page Layout System

All page layouts are constructed from the same structural primitives. These are layout templates — not visual designs. They define where regions live and how they behave.

---

### 3.1 Layout Template: List View

Used by: Meetings, Tasks

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  [Page Title]                          [Primary CTA button]  │
├──────────────────────────────────────────────────────────────┤
│  TABLE TOOLBAR                                               │
│  [Search]  [Filter chip] [Filter chip]     [Sort] [View]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  DATA TABLE                                                  │
│  (fills remaining viewport height, internal scroll)         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key behavior:** The table fills the viewport height between the page header and the bottom of the screen. The table body scrolls internally — the page itself does not scroll. This keeps the page header and table toolbar always visible.

**View toggle:** A segmented control (List / Grid) in the toolbar allows switching between table view and card grid view. The active view preference is persisted per section.

---

### 3.2 Layout Template: Detail View

Used by: Meeting Detail, Task Detail (future)

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  [← Back]  [Meeting Title]             [Actions dropdown]    │
├──────────────────────────────────────────────────────────────┤
│  TAB BAR                                                     │
│  [Summary] [Transcript] [Decisions] [Action Items]           │
├──────────────────────────────────────────────────────────────┤
│                         │                                    │
│  PRIMARY PANEL          │  SECONDARY PANEL (optional)        │
│  (main content,         │  (contextual — action items,       │
│   60–65% width)         │   AI chat — 35–40% width)          │
│                         │                                    │
└─────────────────────────┴────────────────────────────────────┘
```

**The secondary panel** is the most important architectural decision in the product. Meeting Detail is a two-panel layout because the Meeting Execution Platform's value comes from simultaneously seeing the content (summary/transcript) and acting on it (action items, AI chat).

The secondary panel is collapsible via a toggle at the panel boundary. When collapsed, the primary panel fills the full width. The collapsed/expanded state is persisted.

On tablet (768–1023px): secondary panel starts collapsed; user expands manually via a slide-in button.

On mobile: secondary panel is accessible via the tab bar as its own tab (e.g., "Actions") — not a side-by-side layout.

---

### 3.3 Layout Template: Dashboard (Overview)

Used by: Overview page

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  Good morning, [Name]          [Date range selector]         │
├──────────────────────────────────────────────────────────────┤
│  METRIC ROW                                                  │
│  [Metric Card] [Metric Card] [Metric Card] [Metric Card]     │
├──────────────────────────────────────────────────────────────┤
│                              │                               │
│  RECENT MEETINGS             │  OVERDUE TASKS                │
│  (list of 5, link to all)    │  (list of 5, link to all)     │
│                              │                               │
├──────────────────────────────┴───────────────────────────────┤
│  ACTIVITY FEED (optional, below the fold)                    │
└──────────────────────────────────────────────────────────────┘
```

**Metric row:** 4 cards. Responsive: collapses to 2×2 grid on tablet, 2×2 then stacked on mobile.

**Two-column section:** 60/40 split. Recent Meetings (primary) gets 60%; Overdue Tasks (urgent) gets 40%. On tablet: stacks vertically (Meetings first, Tasks second).

**Dashboard philosophy:** The dashboard is not a report. It is the morning briefing. It answers three questions: What meetings happened recently? What tasks are overdue? How is the team executing? Everything beyond those three questions belongs on the Analytics page.

---

### 3.4 Layout Template: Analytics

Used by: Analytics page

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  Analytics                     [Date range selector]         │
├──────────────────────────────────────────────────────────────┤
│  METRIC ROW (KPI cards)                                      │
├──────────────────────────────────────────────────────────────┤
│  CHART ROW 1 (full width)                                    │
│  Meetings over time (area chart)                             │
├────────────────────────────┬─────────────────────────────────┤
│  CHART HALF                │  CHART HALF                     │
│  Task completion by owner  │  Meeting duration breakdown     │
├────────────────────────────┴─────────────────────────────────┤
│  TABLE (bottom)                                              │
│  Top action item owners with completion rate                 │
└──────────────────────────────────────────────────────────────┘
```

The analytics layout uses a **12-column grid**. Full-width charts span all 12 columns. Half-width charts span 6 each. The table spans all 12.

Date range selector in the page header controls all charts and the table simultaneously.

---

### 3.5 Layout Template: Settings

Used by: Settings page

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  Settings                                                    │
├─────────────────────────────────┬────────────────────────────┤
│  SETTINGS SIDEBAR               │  SETTINGS CONTENT          │
│  (200px, sticky)                │  (max-width 640px)         │
│  Profile                        │                            │
│  Workspace                      │  [Active section content]  │
│  Members                        │                            │
│  Billing                        │                            │
│  Integrations                   │                            │
│  Notifications                  │                            │
└─────────────────────────────────┴────────────────────────────┘
```

Settings uses a **secondary sidebar** inside the content area. This is distinct from the global navigation sidebar. The settings sidebar is sticky, scrolls with the settings content area rather than the global scroll.

Settings content area is capped at 640px — it is form-heavy and does not benefit from full-width layout.

On mobile: the settings sidebar becomes a full-page list. Selecting a section navigates into it (replaces the list). A back button returns to the settings list. This is the standard iOS/Android settings pattern.

---

### 3.6 Layout Template: AI Assistant

Used by: AI Assistant page

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                 │
│  AI Assistant                                                │
├────────────────────────────┬─────────────────────────────────┤
│  CONTEXT PANEL             │  CONVERSATION PANEL             │
│  (280px, collapsible)      │  (fluid)                        │
│                            │                                 │
│  Scope selector            │  [Message history]              │
│  - All workspaces          │                                 │
│  - This month              │  [User message]                 │
│  - By meeting              │  [AI response]                  │
│  - By team member          │  [User message]                 │
│                            │  [AI response]                  │
│  Suggested questions       │                                 │
│  (pre-built prompts)       │  ─────────────────────────────  │
│                            │  [Input field] [Send]           │
└────────────────────────────┴─────────────────────────────────┘
```

The AI Assistant is a two-panel layout. The context panel allows the user to scope their conversation: querying across all meetings, a specific date range, or a specific meeting. Without scope control, the AI responses are less useful.

The conversation panel is a standard chat UI with one critical difference: AI responses should include **source citations** — inline links to the meeting or action item that the answer was derived from. This is the product's killer feature: the AI is not making things up, it is referencing real decisions your team made.

Input area is fixed to the bottom of the conversation panel, never scrolls out of view.

---

## Section 4 — Meeting Detail Page Architecture

This is the most important screen in the product. A user will visit this page every time a meeting is processed. It must be the best screen in the product.

### 4.1 Meeting Detail — Full Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                     │
│  ← Meetings | Sprint Planning Q2          [Share] [Archive] [...] │
│  Jun 12, 2026 · 47 min · Alex, Sarah, Mike, +3 more              │
├──────────────────────────────────────────────────────────────────┤
│  STATUS BAR                                                      │
│  [AI Complete ✓]  [4 action items]  [2 decisions]  [3 owners]    │
├──────────────────────────────────────────────────────────────────┤
│  TAB BAR                                                         │
│  [Summary]  [Transcript]  [Decisions]  [Action Items]  [Timeline]│
├─────────────────────────────────┬────────────────────────────────┤
│                                 │                                │
│  PRIMARY PANEL                  │  ACTION ITEMS PANEL            │
│  (active tab content)           │  (always visible)              │
│                                 │  ─────────────────────────    │
│  [Tab content renders here]     │  + Add action item             │
│                                 │  ─────────────────────────    │
│                                 │  [ ] API spec · Sarah · Jun 15 │
│                                 │  [!] Roadmap deck · Mike ·OVER │
│                                 │  [ ] User testing · PM · Jun 20│
│                                 │  [✓] Release notes · AR        │
│                                 │                                │
│                                 │  ─────────────────────────    │
│                                 │  AI CHAT                       │
│                                 │  Ask about this meeting...     │
└─────────────────────────────────┴────────────────────────────────┘
```

### 4.2 Tab Content Architecture

**Tab: Summary**

The default tab. First thing a user sees when they open any meeting.

Content hierarchy (top to bottom):

1. **AI-generated executive summary** — 3–5 sentences. Not a list. Written in paragraph form, past tense. Answers: what was discussed, what was decided, what was committed to.

2. **Key Decisions** — A short bulleted list (max 5). Each decision is one sentence. Linked to its position in the transcript on click.

3. **Next Steps** — A short bulleted list drawing from action items. Links to the full action item in the Actions panel. Not a duplicate of the Actions panel — it is a natural language version.

4. **Meeting Quality Signal** (optional, Premium) — A muted section showing engagement indicators: longest speaker time, topics that generated the most discussion.

**Tab: Transcript**

Full meeting transcript. Speaker-attributed, timestamp-linked.

Layout: Single scrollable column. Each speaker block contains: `[Avatar] [Speaker Name] [Timestamp]` header, followed by their words in a monospace-adjacent body font.

Key features:
- Timeline scrubber (if audio playback available)
- Search within transcript (highlights matches with orange background)
- Select-to-annotate: selecting transcript text shows a "Create action item" and "Highlight" option in a floating tooltip
- Jump-to controls that sync with Decisions and Action Items (clicking a decision highlight-scrolls the transcript to where it was said)

**Tab: Decisions**

A clean, scannable list of formal decisions extracted from the meeting.

Each decision item:
```
[Decision text — full sentence]
Made by: [Name] • Approved by: [Names] • [Timestamp link]
```

Empty state: "No formal decisions were recorded in this meeting."

**Tab: Action Items**

A task-list view that mirrors the Action Items panel on the right — they are the same data. This tab is for users who want a full-screen task view without the transcript.

Same visual treatment as the Tasks list page. Supports inline editing of task title, assignee, due date, and status.

**Tab: Timeline**

A chronological log of everything that happened to this meeting record after creation: AI processing started, AI processing completed, action items created, items assigned, items completed, meeting shared, integrations fired (e.g., "Tasks synced to Jira").

Visual treatment: vertical timeline with dots. Timestamps. Brief labels. Not an audit log — not exhaustive. Shows the meaningful events.

---

### 4.3 Action Items Panel — Permanent Right Panel

The Action Items panel remains visible regardless of which primary tab is active. This is a deliberate design decision:

**Why always visible:** The core product value is execution. If a user is reading the transcript and sees something that needs to be actioned, they should be able to create an action item without switching tabs. The right panel is the action layer; the left panel is the information layer.

**Panel behavior:** 320px wide. Collapsible. When collapsed, a floating vertical "4 actions" label appears on the right edge, clickable to re-expand.

**Action item row:**
```
[Checkbox] [Priority dot] [Task title]
           [Assignee avatar] [Due date chip] [Status badge]
```

Overdue items have a red left border (3px). Completed items have strike-through title and are grayed out. Completed items collapse to a "Show 2 completed" disclosure at the bottom.

**Add action item:** A `+` button at the top of the panel opens an inline form within the panel — a text field for the title, an assignee selector, and a date picker. Pressing Enter saves. Escape cancels. No modal required.

---

### 4.4 AI Chat — Meeting-Scoped

Below the action items list in the right panel is a compact AI chat interface, scoped to this meeting.

Suggested starter questions appear as chips (pill-shaped buttons):
- "What were the key risks mentioned?"
- "Who is responsible for the most work?"
- "Summarize the blockers"

The chat history for each meeting is persisted. Users returning to a meeting can continue where the conversation left off.

Chat responses are always attributed to the source — each answer includes a "📍 From transcript [timestamp]" link.

---

## Section 5 — Empty States Architecture

Empty states are not failures. They are product opportunities. Every empty state has a primary message, a supporting message, and a clear action.

### 5.1 Empty State Placement

Empty states occupy the full content area of their parent container, centered vertically and horizontally. They are not relegated to a corner or shown as a small inline message. An empty state is the only content shown when there is nothing to show.

### 5.2 Empty State Hierarchy

**Tier 1 — First-use empty state:** Appears when the user has never used this feature. Tone: welcoming, educational. Shows the feature's value proposition briefly. Primary action drives the first use.

**Tier 2 — Filtered empty state:** Appears when filters or search produced no results. Tone: neutral, problem-solving. Primary action clears the filter.

**Tier 3 — Error empty state:** Appears when content failed to load. Tone: honest, recoverable. Primary action retries. Secondary action links to help.

### 5.3 Meeting Detail Empty States

**When AI is still processing:**

```
[Pulsing logo animation]

"Processing your meeting..."
"AI analysis takes 30–90 seconds. This page will update automatically."

[Animated progress — 3 steps: Transcribing → Extracting → Finalizing]
```

Do not use a generic spinner. Show the steps being performed. This communicates the product's value: it is doing real work.

**When AI processing fails:**

```
[Warning icon]

"Processing encountered an issue"
"We couldn't fully analyze this meeting. Partial results may be available."

[Try again] (primary)  [Contact Support] (ghost)
```

---

## Section 6 — Workspace Switching Architecture

### 6.1 Workspace Switcher Behavior

The workspace switcher in the topbar is a dropdown trigger. It shows:

- Current workspace avatar + name
- A down chevron
- Clicking opens a dropdown panel

**Dropdown panel:**

```
┌────────────────────────────────────────┐
│  YOUR WORKSPACES                       │
│  ────────────────────────────────────  │
│  [●] Acme Corp       (current)         │
│  [○] Personal        (3 unread)        │
│  [○] Side Project                      │
│  ────────────────────────────────────  │
│  + Create workspace                    │
└────────────────────────────────────────┘
```

Switching workspaces navigates to that workspace's Overview page. The URL changes to the new workspace slug.

**When a user has one workspace:** The switcher is still visible but shows only one workspace + "Create workspace." It is never hidden — users grow into multiple workspaces.

---

## Section 7 — Implementation Roadmap

The implementation sequence is not arbitrary. Each phase builds on the previous and delivers testable, shippable product surface.

### Phase 1 — Design System Foundation

**Duration:** 1–2 weeks  
**Deliverable:** Implemented design tokens, base component library

Implement color tokens, typography scale, spacing system, and the core component set (Button, Input, Badge, Card, Modal, Dropdown, Table). No page layouts yet — only building blocks.

**Why first:** Every phase depends on these. Starting with pages before components creates rework. Building tokens before components creates the semantic layer that makes future theming trivial.

Success criteria: Any designer or engineer can build a new screen using only components from the library, with no need to invent new patterns.

---

### Phase 2 — App Shell

**Duration:** 1 week  
**Deliverable:** Sidebar, topbar, mobile nav, routing skeleton

Implement the structural shell: fixed sidebar (expanded + collapsed), topbar (workspace switcher, search field, notification bell, theme toggle, user menu), mobile bottom navigation. Wire up routing so navigation between empty route stubs is functional.

**Why second:** The shell is the frame for everything that follows. Building pages before the shell leads to per-page reinvention of nav chrome, which is expensive to unify later.

Success criteria: A developer can navigate to any route stub through the sidebar. The shell looks and functions correctly at all three breakpoints.

---

### Phase 3 — Dashboard (Overview)

**Duration:** 1–2 weeks  
**Deliverable:** Functional Overview page with real data

Implement the Overview page: metric cards (wired to real API endpoints), recent meetings list, overdue tasks list. This is the first page a user sees after login and onboarding.

**Why third:** The dashboard delivers the first proof-of-value for new users. It also forces the metric card, list card, and empty state components to be implemented — accelerating subsequent pages.

Success criteria: A user who has uploaded 2 meetings sees real meeting cards and metric numbers. A user with no meetings sees the correct Tier 1 empty state.

---

### Phase 4 — Meetings List

**Duration:** 1 week  
**Deliverable:** Meetings list page with sorting, filtering, upload

Implement the Meetings list: table view, grid view toggle, search, filter by date/status, sort by date/duration, empty states, and the meeting upload flow (file upload or URL paste).

**Why fourth:** Meetings are the primary content source. Without meetings, nothing else in the product has data.

Success criteria: A user can see all their meetings, search and filter them, and upload a new meeting from this page.

---

### Phase 5 — Meeting Detail

**Duration:** 2–3 weeks  
**Deliverable:** Complete Meeting Detail page

This is the highest-complexity page. Implement: two-panel layout, all tabs (Summary, Transcript, Decisions, Action Items, Timeline), AI processing state, action items panel (always-visible right panel), inline task creation, AI chat stub.

**Why fifth:** It is the highest-value screen and deserves the most implementation time. The earlier phases provide all necessary components. Implementing it here allows the AI processing pipeline to be QA'd in context.

Success criteria: A user can open any processed meeting and see the AI summary, interact with action items, and navigate the transcript.

---

### Phase 6 — Tasks

**Duration:** 1 week  
**Deliverable:** Tasks list page, cross-meeting task aggregation

Implement the Tasks page: table view, filter by assignee/status/meeting/due date, sort, bulk status update, empty states. Tasks are derived from meetings — no creation from scratch on this page except manual additions.

**Why sixth:** Tasks are most useful once the user has accumulated action items from multiple meetings. The Tasks page aggregates them — this is the value that meetings alone cannot deliver.

---

### Phase 7 — AI Assistant

**Duration:** 1–2 weeks  
**Deliverable:** Workspace-level AI chat with source citation

Implement the AI Assistant page: conversation panel, context panel (scope selector, suggested prompts), message history persistence, source citation links.

**Why seventh:** The AI Assistant requires a meaningful corpus of meetings and tasks to be useful. Shipping it to users with no data is a poor first impression. By Phase 7, most users will have enough meetings for the assistant to demonstrate real value.

---

### Phase 8 — Analytics

**Duration:** 1–2 weeks  
**Deliverable:** Analytics page with core charts

Implement: KPI row, time-series chart (meetings over time), task completion by owner, meeting duration breakdown, top owners table. Date range selector.

**Why eighth:** Analytics requires data volume to be meaningful. Shipping analytics before users have used the product for a period is premature. It is also purely additive — no other product surface depends on it.

---

## Section 8 — Final Architecture Recommendation

This section represents a binding design and architecture decision, not a suggestion. If I am the person responsible for the long-term quality of ZeroClutter's product, this is what I would approve.

### 8.1 The Thesis

ZeroClutter competes on execution clarity. The UI must be the fastest, clearest path from "meeting happened" to "work is done." Every design choice that makes this path longer is a competitive liability.

The architecture I have specified — particularly the two-panel Meeting Detail, the permanent Action Items panel, and the AI chat with source citations — is the product's unique UI signature. No competitor has this. Notion is too flexible (no opinionated structure). Otter is a recorder (no action layer). Linear is for tasks (no meeting origin layer). ZeroClutter is the combination of all three, specialized.

### 8.2 The Non-Negotiables

**1. The permanent right panel in Meeting Detail must not become a tab.**

When the action items panel is a tab, the user has to choose between reading the meeting and acting on it. When it is a permanent right panel, both happen simultaneously. This is the product's thesis made manifest: content and execution coexist. It is also the most defensible product decision — it requires confidence in the product's purpose to justify the reduced primary panel width.

**2. The sidebar must remain fixed, not drawer-based.**

Drawer navigation (hamburger → slide-in) is a mobile pattern applied to desktop out of laziness or design fashion. It is wrong for a daily-use, information-dense B2B tool. Users who open the product 5 times per day should never need to perform 2 interactions to navigate. Fixed sidebar is a commitment to density and respect for the user's time.

**3. Design tokens must be the only way colors, spacing, and typography are referenced.**

When a component or page uses hardcoded hex values or arbitrary pixel values, it creates compounding technical debt. Every theming change, every design system update, every accessibility audit becomes a manual search-and-replace. Tokens are not an aesthetic preference — they are an engineering necessity.

**4. The empty states must be first-class designed artifacts, not afterthoughts.**

ZeroClutter will acquire users who upload their first meeting with genuine curiosity and high expectations. The state they see before any data exists is their first impression of the product. If it is a generic "No data" message on a blank screen, they will not return. If it communicates the product's power and clearly shows the next step, they will be activated.

**5. The app must feel as fast as a native application.**

This means skeleton screens for every content region, no full-page spinners, optimistic UI updates for action item status changes, and route-prefetching for the most common navigation paths (clicking a meeting in the list should feel instant, not like a network call). Perceived performance is as important as actual performance.

### 8.3 The Architecture I Would Refuse

**Refusing: Tab-based shell navigation.** Some products put navigation in tabs across the top of the content area. This is a SaaS antipattern that reflects unclear product direction. The sidebar is the correct pattern for a product with 7+ distinct surfaces.

**Refusing: Full-screen modals for create flows.** Create Meeting, Create Task, Create Workspace — these should be compact modal forms or inline creation patterns, not full page takeovers. Full-screen create flows interrupt the spatial context of where the user was, making "cancel" feel disorienting.

**Refusing: Charts on the Dashboard that show no real insight.** The temptation to put "engagement" charts on the first screen is strong. I would refuse any chart that cannot be described in one sentence as answering a question the user actually has every morning. The dashboard shows three things only: key metrics, recent meetings, and overdue tasks. Everything else goes on the Analytics page.

**Refusing: Dark-mode-only design.** Enterprise buyers — particularly in financial services, legal, and healthcare — use light mode on corporate-issued MacBooks and Windows machines with enforced settings. Shipping a light mode that is clearly a dark-mode afterthought communicates that the product was designed by engineers for engineers, not for the businesses that will actually pay for it.

### 8.4 The Long-Term Bet

The design decisions in this specification are made for a 3-year horizon. The component system, the shell architecture, and the page layout templates are designed to absorb the following product expansions without redesign:

- **Meeting Templates** (standardized meeting formats with pre-defined action item structures) — fits inside Meeting Detail as a new tab
- **Team/Project scoping** (action items scoped to projects, not just meetings) — fits inside the Tasks page filter system
- **Real-time collaboration** (multiple users in a meeting detail page simultaneously) — the two-panel layout accommodates presence avatars in the page header
- **Mobile app** (native iOS/Android) — the component system and token architecture are expressible in React Native with no concept changes
- **API product** (webhooks, third-party integrations) — the Integrations page layout is already structured to accommodate catalog, connected, and configuration views

The architecture bets on ZeroClutter becoming the operating system for how teams make and execute decisions. The UI must be worthy of that ambition from day one.

---

*End of APP_SHELL_SPEC.md*
