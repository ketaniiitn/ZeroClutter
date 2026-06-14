# ZeroClutter Design System Specification

**Version:** 1.0  
**Status:** Approved for Implementation  
**Authors:** Design Systems, Frontend Architecture  
**Last Updated:** 2026-06-11

---

## Preamble

This document is the single source of truth for every visual and interactive decision in the ZeroClutter product. It exists to answer one question before implementation ever begins: *Why does this look and behave exactly this way?*

ZeroClutter is a Meeting Execution Platform. Not a recorder, not a summarizer, not another AI wrapper. Every design decision must reinforce the core belief that meetings are only as valuable as the work they generate. The UI must feel like a command center for a high-performing team — not a dashboard, not a chat app, not a notes tool.

Inspiration sources: Linear (density and navigation), Stripe (professionalism and polish), Notion (information architecture flexibility), Vercel (restraint and minimalism). The synthesis is something none of them are: a focused execution tool that takes meetings seriously as the origin of decisions and accountability.

---

## Section 1 — Design Principles

### 1.1 The Five Principles

**Principle 1: Execution Over Documentation**

Every screen must answer "what happens next?" The UI serves the person who needs to act, not the person who needs to reflect. Meeting summaries exist not to be read — they exist so that action items can be assigned, tracked, and closed. Design should accelerate that path, never obstruct it.

*In practice:* Action items appear above transcripts. Assigned owners appear on every card. Due dates are always visible without hovering. Status changes are immediate, not modal-gated.

---

**Principle 2: Density Without Compression**

Linear proved that information-dense UIs can be beautiful. The opposite of dense is not clean — it is wasteful. ZeroClutter deals with real work artifacts: meeting lists, task queues, decision logs. These demand density. However, density must never mean clutter (the product name is not ironic).

The test: if a PM can see 12 action items with owners, statuses, and due dates on a single screen without scrolling, we have achieved the right density. If the eye cannot immediately find a priority item, we have failed.

*In practice:* 14px base body size. 12px for secondary metadata. 32px row heights in tables. 8px vertical rhythm between related elements. 24px between unrelated groups.

---

**Principle 3: Information Has Hierarchy**

Every screen has one primary object. Everything else supports it. On the Meetings List, the primary object is the most recent or most critical meeting. On Meeting Detail, the primary object is the action item list. On Task View, the primary object is what is overdue right now.

Secondary information (participants, duration, timestamps) should require a deliberate glance — not a search.

*In practice:* Text weight differentiates hierarchy, not font size alone. Bold carries ownership and titles. Regular carries supporting facts. Muted/secondary color carries metadata. Never use decorative color for hierarchy — color carries semantic meaning only (status, priority, type).

---

**Principle 4: Motion Serves Clarity, Not Delight**

Animations exist to preserve spatial context, communicate state transitions, and confirm that an action was received. They do not exist to be impressive. The product is used daily by people under time pressure. Animations that exceed 250ms on repeated interactions are disrespectful.

*In practice:* Entrance animations for new content: 200–350ms, ease-out. Exit animations: 150ms, ease-in. Hover transitions: 120ms. Page transitions: 200ms, opacity + translate. Skeletons pulse at 1.5s cycle. Never bounce. Never spring unless simulating physical gesture (drag-to-dismiss).

---

**Principle 5: The Light Mode Is Not an Afterthought**

Most design tools favor dark mode. Most enterprise buyers use light mode. The light mode of ZeroClutter must be as premium as the dark. It does not mean "white background with the same elements." It means a fully rethought surface system, shadow system, and border system that reads as professional on a MacBook in a meeting room.

*In practice:* Light surfaces use layered white and near-white (`#FFFFFF`, `#F9FAFB`, `#F3F4F6`). Shadows replace the dark mode's border-only system — surfaces are differentiated by elevation, not just color. Primary text in light mode: `#111827`. Secondary: `#6B7280`.

---

### 1.2 Spacing System

**Base unit:** 4px

All spacing is derived from multiples of 4. Never use arbitrary pixel values. The spacing scale is:

```
xs   — 4px    (tight inline spacing, icon padding)
sm   — 8px    (sibling element gaps, compact padding)
md   — 12px   (standard inline padding)
base — 16px   (standard block padding)
lg   — 20px   (comfortable section gap)
xl   — 24px   (section padding, card padding)
2xl  — 32px   (page section separation)
3xl  — 40px   (major layout separation)
4xl  — 48px   (section headers)
5xl  — 64px   (page-level padding)
```

**Component internal spacing:** Use `sm` (8px) to `xl` (24px).  
**Between cards:** `base` (16px).  
**Page horizontal padding:** `3xl` (40px) on desktop, `base` (16px) on mobile.  
**Section vertical rhythm:** `4xl` (48px) between major page sections.

---

### 1.3 Layout Philosophy

ZeroClutter uses a **fixed-sidebar, fluid-content** layout. The sidebar is a permanent navigation fixture, not a drawer. The content area fills remaining width, respecting a maximum readable width of 1280px for most views.

Layout adapts at three breakpoints:

- **Compact:** below 768px — mobile experience, sidebar replaced by bottom nav
- **Comfortable:** 768px–1279px — collapsed sidebar, full content area
- **Spacious:** 1280px and above — expanded sidebar, optionally three-panel for detail views

Never center content at the expense of information density. Dashboard grids and tables fill their available width. Forms and text-heavy views cap at ~720px reading width.

---

### 1.4 Accessibility Standards

Minimum targets — these are not aspirations:

- **WCAG 2.1 AA** compliance across all text and interactive elements
- **Contrast ratio:** 4.5:1 for body text, 3:1 for large text and UI components
- **Focus management:** visible focus ring on all interactive elements; `outline: 2px solid` using the primary color with 2px offset
- **Keyboard navigation:** full tab order throughout the application, logical DOM order
- **ARIA labels:** all icon-only buttons carry `aria-label`; all status badges carry `role` and `aria-label`
- **Motion:** respect `prefers-reduced-motion` — animations collapse to opacity-only transitions when active
- **Touch targets:** minimum 44×44px hit area on all interactive elements, including on mobile

---

## Section 2 — Token System

### 2.1 Color Tokens

Tokens are named by role, not by value. Never reference a hex code directly in component definitions — reference the token. This allows theming without component rewrites.

#### Background Tokens

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `bg.base` | `#0B0F17` | `#FFFFFF` | Page background |
| `bg.surface` | `#111827` | `#F9FAFB` | Card, panel backgrounds |
| `bg.elevated` | `#1a2030` | `#FFFFFF` | Modal, dropdown, popover |
| `bg.sunken` | `#080c12` | `#F3F4F6` | Code blocks, inset areas |
| `bg.overlay` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` | Modal backdrop |

#### Border Tokens

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `border.subtle` | `#1F2937` | `#E5E7EB` | Card edges, dividers |
| `border.default` | `#374151` | `#D1D5DB` | Input borders, table lines |
| `border.strong` | `#4B5563` | `#9CA3AF` | Emphasized dividers |
| `border.focus` | `#6366F1` | `#6366F1` | Focus rings |

#### Text Tokens

| Token | Dark Value | Light Value | Usage |
|-------|-----------|-------------|-------|
| `text.primary` | `#F9FAFB` | `#111827` | Headings, primary content |
| `text.secondary` | `#9CA3AF` | `#6B7280` | Labels, metadata, captions |
| `text.tertiary` | `#6B7280` | `#9CA3AF` | Placeholders, timestamps, disabled |
| `text.inverse` | `#111827` | `#F9FAFB` | Text on colored backgrounds |
| `text.link` | `#818CF8` | `#4F46E5` | Inline links |

#### Semantic Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `color.primary` | `#6366F1` | Brand actions, selected state, primary CTA |
| `color.primary.hover` | `#4F46E5` | Hover on primary elements |
| `color.primary.muted` | `rgba(99,102,241,0.12)` | Primary tints on surfaces |
| `color.success` | `#22C55E` | Completed tasks, healthy status |
| `color.success.muted` | `rgba(34,197,94,0.12)` | Success tint backgrounds |
| `color.warning` | `#F59E0B` | At-risk items, pending review |
| `color.warning.muted` | `rgba(245,158,11,0.12)` | Warning tint backgrounds |
| `color.danger` | `#EF4444` | Overdue, errors, destructive actions |
| `color.danger.muted` | `rgba(239,68,68,0.12)` | Danger tint backgrounds |
| `color.info` | `#3B82F6` | Neutral informational states |
| `color.info.muted` | `rgba(59,130,246,0.12)` | Info tint backgrounds |

---

### 2.2 Typography Tokens

**Primary typeface:** Inter  
**Monospace:** JetBrains Mono (transcripts, timestamps, code references)

#### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `text.display` | 36px | 800 | 1.08 | -0.03em | Hero, empty state headline |
| `text.title.xl` | 28px | 700 | 1.1 | -0.02em | Page headings |
| `text.title.lg` | 22px | 700 | 1.15 | -0.018em | Section headings |
| `text.title.md` | 18px | 600 | 1.25 | -0.01em | Card titles, modal headings |
| `text.title.sm` | 15px | 600 | 1.35 | -0.005em | Sidebar section labels |
| `text.body.lg` | 15px | 400 | 1.65 | 0 | Primary reading content |
| `text.body.md` | 14px | 400 | 1.6 | 0 | Standard UI text |
| `text.body.sm` | 13px | 400 | 1.5 | 0 | Secondary content, captions |
| `text.label` | 12px | 500 | 1.4 | 0.02em | Form labels, column headers |
| `text.caption` | 11px | 400 | 1.4 | 0.01em | Timestamps, micro-labels |
| `text.mono` | 13px | 400 | 1.6 | 0 | Transcript text, code |

---

### 2.3 Elevation and Shadow Tokens

Dark mode uses borders for surface differentiation. Light mode uses shadows.

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `shadow.none` | `none` | `none` | Flat cards in dark mode |
| `shadow.sm` | `none` | `0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)` | Standard cards |
| `shadow.md` | `none` | `0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)` | Dropdowns, elevated cards |
| `shadow.lg` | `0 0 0 1px rgba(99,102,241,0.15), 0 8px 24px rgba(0,0,0,0.5)` | `0 8px 32px rgba(0,0,0,0.12)` | Modals |
| `shadow.focus` | `0 0 0 2px #6366F1` | `0 0 0 2px #6366F1` | Focus ring |

---

### 2.4 Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `radius.sm` | 4px | Badges, small chips |
| `radius.md` | 6px | Buttons, inputs, small cards |
| `radius.lg` | 8px | Cards, panels |
| `radius.xl` | 12px | Modal dialogs, large cards |
| `radius.2xl` | 16px | Feature cards, onboarding panels |
| `radius.full` | 9999px | Pill badges, avatars |

---

## Section 3 — Component System

### 3.1 Buttons

Buttons communicate intent. Each variant carries a specific semantic meaning. Mixing variants for visual variety is prohibited.

**Anatomy:** `[leading icon?] [label] [trailing icon?]`

**Sizes:**

| Size | Height | Padding H | Font | Usage |
|------|--------|-----------|------|-------|
| `xs` | 24px | 8px | 11px | Inline table actions, compact badges |
| `sm` | 30px | 12px | 12px | Secondary sidebar actions |
| `md` | 36px | 16px | 14px | Standard actions (default) |
| `lg` | 44px | 20px | 15px | Primary page CTAs |

---

**Variant: Primary**

Purpose: The single most important action on a screen. There should be at most one primary button visible at a time. Used for: Save, Create, Confirm, Start.

Visual: Solid `color.primary` background, white text, `radius.md`. Hover: `color.primary.hover`. Active: slightly darker. Disabled: 40% opacity, no pointer events.

Shadow on hover: `0 0 0 3px rgba(99,102,241,0.25)` — not on rest state.

---

**Variant: Secondary**

Purpose: Important but not primary actions on a screen. Used alongside Primary when a secondary path is required: Cancel, Export, Duplicate.

Visual: Transparent background, `border.default` border, `text.primary` text. Hover: `bg.surface` fill. Does not compete visually with Primary.

---

**Variant: Ghost**

Purpose: Low-emphasis actions that appear in-context: Edit, Rename, Copy Link, table row actions. Appears without border until hover.

Visual: No background, no border at rest. Hover: `bg.surface` fill, `border.subtle` border appears. Used heavily in tables and cards.

---

**Variant: Danger**

Purpose: Destructive, irreversible actions only: Delete, Remove, Revoke. Should require confirmation before execution.

Visual: `color.danger` fill (primary danger) or `color.danger` text with transparent background (ghost danger). Danger Ghost is preferred unless the action is the only action on screen.

---

**Variant: Link**

Purpose: Inline navigation actions within copy. Not a navigation element — it exists within text. Not a button — it does not produce side effects.

Visual: `text.link` color, underline on hover only.

---

**Rules:**

- Never use Primary for navigation — navigation is not an action
- Never use icons without labels unless the icon is universally recognized (close `✕`, plus `+`) AND a tooltip is present
- Loading state: replace label with a spinner, keep button width fixed using `min-width`
- Never change button width on state change

---

### 3.2 Inputs

**Anatomy:** `[label above] [input field] [helper text or error below]`

All inputs share the same height (36px standard, 44px large), border (`border.default`), border-radius (`radius.md`), and focus state (`border.focus` + `shadow.focus`).

**Variant: Text Input**

Single-line. Used for: Name, Title, URL, Email, Search within forms.

States: Rest (border.default), Focused (border.focus + focus ring), Error (border.danger + error message below), Disabled (bg.sunken, text.tertiary, no pointer events), Read-only (bg.sunken, normal text).

**Variant: Textarea**

Multi-line. Used for: Notes, descriptions, manual meeting summaries. Minimum 3 rows. Resizable vertically only. Same state system as text input.

**Variant: Select**

Custom dropdown replacing native `<select>`. Renders a trigger button that opens a positioned dropdown panel. Always shows selected value. Searchable when options exceed 8.

**Variant: Search**

Distinct from text input. Contains a leading search icon (not removable). Has a clear `✕` button that appears when the field has content. Triggers filtering or query as the user types after a 200ms debounce. No submit button.

**Variant: Toggle**

For binary on/off settings. Pill-shaped, 40px × 22px. Transitions between states in 150ms. Always paired with a label and, where relevant, a description of what the toggle controls.

**Variant: Checkbox**

16px × 16px. Custom-styled, not native. Indeterminate state supported for parent-child selection groups. Checkmark animates in on check (scale + opacity, 100ms).

---

### 3.3 Cards

Cards are the primary content containers. They are not decorative — every card contains a single distinct entity.

**Card anatomy:**

```
┌─────────────────────────────────────────┐
│  Card Header (title + metadata + action) │
│  ─────────────────────────────────────── │
│  Card Body (primary content)             │
│  ─────────────────────────────────────── │
│  Card Footer (secondary actions)  [opt]  │
└─────────────────────────────────────────┘
```

**Variant: Meeting Card**

Represents a single meeting in list or grid view.

Header row: Meeting title (bold, `text.title.md`) + timestamp (right-aligned, `text.caption`)  
Metadata row: Duration pill + Participant count pill + Status badge  
Body: AI-generated one-sentence summary (`text.body.sm`, `text.secondary`, max 2 lines, truncated)  
Footer: Action item count (with completion ratio) + Primary assignee avatars (max 3, then +N)

Status badge must be the first thing the eye can identify after the title. Color-coded: In Progress (primary), Pending Review (warning), Completed (success), Overdue (danger).

Hover state: subtle border brightening (`border.default` → `border.strong`) + `bg.surface` slight lift. Never move the card on hover.

---

**Variant: Task Card**

Represents a single action item.

Left: checkbox (marks complete) + priority dot (colored by `color.warning` / `color.danger`)  
Center: task title + meeting source (muted, click-navigates to meeting)  
Right: assignee avatar + due date chip

Overdue tasks: danger-tinted left border (3px) as urgency signal. Never change the entire card background — it destroys reading flow in a long list.

---

**Variant: Metric Card**

Used in analytics and dashboard overview sections.

Shows: single numerical value + label + trend indicator (↑ / ↓ / →) + comparison period.

Do not put charts inside metric cards. Charts belong in their own dedicated chart cards. Metric cards are for scannable numbers, not visualization.

---

**Variant: Analytics Card**

Contains a chart (bar, line, or area). Has a title, optional subtitle, optional time-range selector in the header. The chart fills the card body with consistent padding. No decorative gradients below lines unless the line chart needs area fill for multi-series disambiguation.

---

### 3.4 Badges

Badges communicate state, category, or priority. They do not communicate urgency through size — only through color and label.

**Anatomy:** `[dot or icon?] [label]`  
**Size:** 20–24px height, horizontal padding 8px, `radius.sm` or `radius.full` depending on context.

**Status Badges**

| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| Completed | `color.success.muted` | `color.success` | green dot |
| In Progress | `color.primary.muted` | `color.primary` | indigo dot |
| Pending | `bg.surface` | `text.secondary` | gray dot |
| Overdue | `color.danger.muted` | `color.danger` | red dot |
| Blocked | `color.warning.muted` | `color.warning` | amber dot |

**Priority Badges**

| Priority | Color | Visual |
|----------|-------|--------|
| Critical | danger | Filled dot + label |
| High | warning | Filled dot + label |
| Medium | primary (muted) | Outlined dot + label |
| Low | tertiary | Outlined dot + label |

Rules:
- Badge labels are always sentence case, never ALL CAPS
- Do not use badges as navigation elements
- Status badges must always have a matching `aria-label` for screen readers
- Never use more than 2 badges on a single card

---

### 3.5 Tables

Tables are the workhorse of ZeroClutter. Most work surfaces — meetings list, tasks list, integrations — are table-driven.

**Table anatomy:**

```
┌─────────────────────────────────────────────────────┐
│  Table Toolbar (search, filters, sort, bulk actions) │
│ ─────────────────────────────────────────────────── │
│  [✓] │ Column A      │ Column B  │ Column C │ ...   │  ← Header
│ ─────────────────────────────────────────────────── │
│  [✓] │ Row content   │ ...       │ ...      │       │  ← Row
│  [·] │ Row content   │ ...       │ ...      │       │
│  [·] │ Row content   │ ...       │ ...      │       │
└─────────────────────────────────────────────────────┘
```

**Row height:** 40px standard. 52px for rows with multi-line content (e.g., meeting title with participant list below).

**Column behavior:**
- Fixed columns: Checkbox, Title, Status — never scroll off screen
- Scrollable columns: Metadata, Assignee, Date, Actions — scroll horizontally on smaller viewports
- Column widths: Title takes remaining flex space. All others are fixed-width.

**Row interaction:**
- Hover: `bg.surface` tint (not a full background change)
- Selected: `color.primary.muted` left border (3px) + background tint
- Click: navigates to entity detail page
- Row actions: appear on hover in the rightmost column (Ghost buttons: Edit, Delete)

**Table Toolbar:**
- Search field (left)
- Filter chips (left, after search) — active filters shown as dismissible pills
- Sort button (right of center)
- Bulk action bar: appears only when rows are selected, slides in from below the toolbar, contains relevant bulk actions

---

### 3.6 Modals

Modals interrupt the user. They must be used sparingly and only when the action requires isolated focus.

**When to use modals:**
- Destructive confirmation (Delete, Revoke, Archive)
- Create/edit forms that cannot be done inline
- Preview of a secondary entity without navigation

**When NOT to use modals:**
- Navigation — use routes
- Information display — use side panels or inline expansion
- Multi-step flows with more than 3 steps — use a dedicated page

**Modal anatomy:**

```
┌─────────────────────────────────┐
│ Title                      [✕]  │  ← Header
│ ─────────────────────────────── │
│ Body content                    │  ← Body (scrollable if needed)
│                                 │
│ ─────────────────────────────── │
│ [Cancel]           [Primary CTA]│  ← Footer
└─────────────────────────────────┘
```

**Sizes:**
- `sm` — 400px: Confirmations, single-field inputs
- `md` — 560px: Standard create/edit forms
- `lg` — 720px: Complex forms, previews
- `xl` — 960px: Rich content modals (should be rare)

**Behavior:**
- Backdrop click closes non-destructive modals
- Escape key always closes
- Focus traps inside open modal
- Enters with opacity + scale-up (0.95→1.0), exits with opacity only
- Animation: 180ms enter, 120ms exit

---

### 3.7 Dropdowns

Dropdowns are positioned panels triggered by an interactive element. They contain a list of choices, navigation items, or actions.

**Types:**

*Action Dropdown:* Triggered by `...` icon or chevron. Contains 4–12 contextual actions. Items are 32px tall with 12px horizontal padding. Destructive items (Delete, Archive) appear last, separated by a divider, and render in `color.danger` text.

*Navigation Dropdown:* Workspace switcher, user menu. Contains headers, items, and separators. Items can carry icons.

*Select Dropdown:* Triggered by Select input. Searchable. Uses virtualization for lists longer than 50 items.

**Positioning:** Smart positioning — opens upward if insufficient space below. Never clips viewport edge. 8px margin from trigger element.

---

### 3.8 Tabs

Tabs segment a page into views of the same entity. They do not navigate to new pages.

**Correct use:** Meeting Detail tabs (Summary | Transcript | Decisions | Action Items). Settings tabs (Profile | Workspace | Billing | Integrations).

**Incorrect use:** Primary navigation (use sidebar). Filtering data (use filter chips).

**Visual:**
- Underline style: 2px primary color underline on active tab, full-width transition on activation
- Container has bottom border that the active underline overlaps
- Tab height: 40px
- Tab labels: `text.label` (12px, 500 weight, uppercase tracking)
- Active: `text.primary`. Inactive: `text.secondary`. Hover: `text.primary` without underline.

---

### 3.9 Tooltips

Tooltips reveal labels for icon-only buttons and supplemental information on hover.

**Rules:**
- Maximum content: 1 sentence or a short label
- Appear after 400ms hover delay (prevents flicker during mouse movement)
- Disappear immediately on mouse-out
- Position: prefer `top`, fall back to `bottom`, then `right`, then `left`
- Never contain interactive elements (those are popovers, not tooltips)
- Always present on icon-only buttons; optional on labeled buttons

---

### 3.10 Empty States

Empty states are a product opportunity, not a fallback. When there is nothing to show, the product must still communicate what the user should do and why.

**Anatomy:**

```
        [Illustration — icon or subtle graphic]
        
        Title (what is empty)
        
        Supporting copy (why it might be empty, what to do)
        
        [Primary action button]
        
        [Optional: secondary link to docs or example]
```

**Tone:**
- Encouraging, not apologetic
- Specific about the path forward
- Short — 2 sentences maximum for supporting copy

**Empty State Catalog:**

| State | Title | Copy | Action |
|-------|-------|------|--------|
| No meetings | "No meetings yet" | "Upload a recording or paste a transcript to get started." | "Upload Meeting" (primary) |
| No tasks | "No action items" | "Tasks extracted from meetings will appear here." | "View Meetings" (secondary) |
| No analytics | "Not enough data" | "Analytics populate after your first 3 meetings are processed." | "Go to Meetings" (secondary) |
| No integrations | "No integrations connected" | "Connect Slack, Jira, or Calendar to close the loop automatically." | "Browse Integrations" (primary) |
| Search no results | "No results for '[query]'" | "Try different keywords or clear your filters." | "Clear filters" (ghost) |
| No team members | "Just you so far" | "Invite teammates to assign tasks and share meeting insights." | "Invite Team" (primary) |

**Illustration style:** Simple, single-color SVG icons at 48–64px. Using `color.primary.muted` as fill. Not cute or cartoon — professional and subtle.

---

### 3.11 Loading States and Skeletons

**Skeleton screens** replace empty containers while content loads. They must match the approximate layout of the content they represent.

**Rules:**
- Never show a spinner for content that has a known shape — use a skeleton
- Spinner is acceptable for: action feedback (form submit, file upload), indeterminate wait
- Skeleton shimmer direction: left to right
- Shimmer cycle: 1.5 seconds
- Skeleton color: `bg.surface` base, `bg.elevated` highlight
- Respect `prefers-reduced-motion` — replace shimmer with static skeleton on reduced motion

**Page-level loading:** Skeleton renders immediately (under 100ms). Never show a blank white or blank dark screen.

**Action loading:** Button shows spinner in place of label. Width is locked. Disabled pointer events. Duration until feedback appears should not exceed 400ms before skeleton or progress indicator appears.

---

## Section 4 — Motion System

### 4.1 Animation Principles

**Rule 1:** Animations must have a purpose. The question is always: does this animation help the user understand what changed? If the answer is no, it should not animate.

**Rule 2:** Animations should never block interaction. Never make a user wait for an animation to complete before they can act again.

**Rule 3:** Be shorter than you think. Animations that feel great in isolation feel slow in daily use. Every animation should survive 100 repeated exposures without feeling sluggish.

---

### 4.2 Duration Reference

| Category | Duration | Easing | Notes |
|----------|----------|--------|-------|
| Micro (hover, checkbox) | 100–150ms | ease | Immediate feedback |
| Short (button press, tooltip) | 150–200ms | ease-out | Confirming action |
| Standard (modal, dropdown) | 180–250ms | ease-out in / ease-in out | State transitions |
| Page (route change) | 200–300ms | ease-out | Content entrance |
| Skeleton pulse | 1500ms | ease-in-out | Continuous, not distracting |

---

### 4.3 Easing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `ease.standard` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Most transitions |
| `ease.enter` | `cubic-bezier(0.0, 0.0, 0.2, 1.0)` | Elements entering (decelerate in) |
| `ease.exit` | `cubic-bezier(0.4, 0.0, 1.0, 1.0)` | Elements leaving (accelerate out) |
| `ease.sharp` | `cubic-bezier(0.4, 0.0, 0.6, 1.0)` | Quick, precise UI motions |

---

### 4.4 Interaction Animation Catalog

**Hover — Card:** Border opacity increases. Background shifts subtly. Duration: 120ms. No translation.

**Hover — Button:** Background color shift only. Duration: 120ms. No scale change on desktop (scale belongs to touch, where it simulates physical press).

**Press — Button:** Scale to 0.98. Duration: 80ms. Returns to 1.0 on release.

**Dropdown open:** Opacity 0→1 + translate Y by -4px→0. Duration: 180ms ease-enter.

**Dropdown close:** Opacity 1→0. Duration: 120ms ease-exit. No translate needed (already placed).

**Modal open:** Opacity 0→1 + scale 0.97→1.0. Duration: 200ms ease-enter. Backdrop fades in simultaneously.

**Modal close:** Opacity 1→0. Duration: 150ms ease-exit. No scale on exit.

**Toast/notification enter:** Slide in from edge (20px translate → 0) + opacity 0→1. Duration: 280ms.

**Toast/notification exit:** Fade out only. Duration: 200ms.

**Status badge change:** Brief scale pulse (1.0 → 1.06 → 1.0). Duration: 200ms. Purpose: communicate that a live update occurred.

**Sidebar collapse/expand:** Width transitions with `ease.sharp`. Duration: 220ms. Content inside the sidebar fades (opacity only) rather than sliding — prevents disorienting text movement.

**Tab switch:** Active underline slides to the newly selected tab position. Duration: 200ms. Content below fades in: opacity 0→1 at 150ms.

**Skeleton shimmer:** `background-position` animates from `-200%` to `200%` over 1500ms, infinite loop with `ease-in-out`. At `prefers-reduced-motion`, background is static.

---

### 4.5 Page Transition Strategy

ZeroClutter uses **route-level fade transitions** as the default. Translation is used only when navigating directionally (e.g., entering a meeting detail from a list — the detail slides in from the right, list slides out to the left).

**Fade:** Opacity 0→1 on enter, 200ms. Outgoing page does not animate — it disappears as the incoming page fades over it. Prevents the "two pages visible at once" problem.

**Directional slide:** Used only for drill-down navigation (List → Detail). Not for lateral navigation (Meetings → Tasks). Slide distance: 32px. Duration: 250ms.

---

## Section 5 — Responsive Design System

### 5.1 Breakpoints

| Name | Min Width | Max Width | Target Device |
|------|-----------|-----------|---------------|
| `mobile` | 0 | 767px | Phone |
| `tablet` | 768px | 1023px | iPad, small laptop |
| `desktop` | 1024px | 1279px | Standard laptop |
| `wide` | 1280px | — | Desktop, large laptop |

---

### 5.2 Component Responsive Behavior

**Tables on mobile:** Collapse to card-based list view. Each row becomes a card. Fixed header row disappears. Most important columns (title, status, assignee) remain visible. A "Show more" inline expander reveals secondary fields.

**Cards on mobile:** Single column only. Card padding reduces to `base` (16px). Card actions collapse to a `...` menu.

**Modals on mobile:** Full-screen sheet that slides up from the bottom. Follows iOS/Android sheet pattern. Dismissible by swipe down.

**Dropdowns on mobile:** Transform to bottom sheets.

**Navigation on mobile:** Sidebar is hidden. Bottom navigation bar (5 items max) provides primary navigation. "More" item in bottom nav exposes remaining sections.

---

### 5.3 Typography Responsiveness

Title sizes scale down on mobile. The `text.title.xl` (28px desktop) reduces to 22px on mobile. `text.display` (36px) reduces to 28px. All other sizes remain fixed — they are already optimized for density.

---

## Section 6 — Icon System

**Icon library:** Lucide Icons as the baseline. Supplemented by custom SVG icons for ZeroClutter-specific concepts (e.g., the meeting execution flow).

**Sizes:**
- `icon.sm` — 14px (inline with small text)
- `icon.md` — 16px (standard UI, default)
- `icon.lg` — 18px (sidebar navigation)
- `icon.xl` — 20px (feature illustrations, empty states)

**Rules:**
- Icons always inherit `currentColor` — they respond to text color tokens
- Icons are `aria-hidden` unless they are the only label (then require `aria-label` on parent)
- Custom icons must follow the same 24px viewBox convention as Lucide
- Stroke weight: 1.5px at 16px, scale proportionally

**Navigation icon set (reserved):**

| Section | Icon Name |
|---------|-----------|
| Overview | `layout-dashboard` |
| Meetings | `video` |
| Tasks | `check-square` |
| AI Assistant | `sparkles` |
| Analytics | `bar-chart-2` |
| Integrations | `plug` |
| Settings | `settings` |
| Notifications | `bell` |
| Search | `search` |
| User menu | `user-circle` |

---

## Section 7 — Data Visualization Guidelines

Charts appear in Analytics and the Dashboard. They must communicate insight, not decorate.

**Permitted chart types:**

| Type | Usage |
|------|-------|
| Line chart | Trends over time (meeting frequency, completion rate) |
| Bar chart | Comparisons across categories (tasks by owner, meetings by team) |
| Area chart | Cumulative growth (total tasks completed over period) |
| Donut chart | Part-to-whole (task status breakdown) — max 4 segments |
| Sparkline | Compact trend within a Metric Card |

**Prohibited chart types:** Pie charts (use donut), 3D charts, radar/spider charts, stacked bars with more than 4 segments.

**Color palette for charts:** Use `color.primary` as the primary series. Additional series: `#22C55E`, `#F59E0B`, `#3B82F6`, `#8B5CF6`. Maximum 5 series on a single chart. More than 5 means the chart is asking the wrong question.

**Grid lines:** Horizontal only. Dashed, very low opacity (`0.1`). Never vertical grid lines.

**Axes:** Left y-axis only. No right secondary axis unless two metrics with incompatible scales are being compared, which should be avoided.

**Tooltips on charts:** Custom-styled to match the design system (not the chart library's native tooltip). Show value, label, and date on hover.

---

## Section 8 — Notification and Toast System

**Toast notifications** appear in the bottom-right corner (desktop) or top of screen (mobile). They are transient, ephemeral confirmations of system events.

**Toast types:**

| Type | Icon | Color | Auto-dismiss |
|------|------|-------|-------------|
| Success | check-circle | success | 4 seconds |
| Error | x-circle | danger | Never (requires manual dismiss) |
| Warning | alert-triangle | warning | 6 seconds |
| Info | info | info | 5 seconds |

**Notification bell** in the topbar accumulates persistent notifications: assignment events, overdue reminders, workspace activity. Badge count collapses to "9+" after 9. Clicking opens a notification panel (not a page).

---

*End of DESIGN_SYSTEM_SPEC.md*
