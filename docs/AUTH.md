# ZeroClutter — Authentication Architecture Specification

**Document type:** Technical Blueprint  
**Status:** Final — Approved for Implementation  
**Author role:** Founding Staff Architect  
**Scope:** Authentication, Authorization, Session Management, Workspace Lifecycle  
**Last revised:** June 2026

---

## Table of Contents

1. [Current Repository Analysis](#section-1-current-repository-analysis)
2. [Proposed Auth Architecture](#section-2-proposed-auth-architecture)
3. [Database Design](#section-3-database-design)
4. [Role System](#section-4-role-system)
5. [Google OAuth Flow](#section-5-google-oauth-flow)
6. [Email Auth Flow](#section-6-email-auth-flow)
7. [API Contracts](#section-7-api-contracts)
8. [Frontend Architecture](#section-8-frontend-architecture)
9. [Security Review](#section-9-security-review)
10. [Implementation Roadmap](#section-10-implementation-roadmap)
11. [Final Recommendation](#section-11-final-recommendation)

---

## SECTION 1 — CURRENT REPOSITORY ANALYSIS

### 1.1 Current User Model

```
User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String                          ← non-nullable, always required
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  meetings  Meeting[]
}
```

**Critical gaps:**
- `password` is NOT nullable. Any OAuth user (Google, Microsoft) would have no password to store, making the schema structurally incompatible with OAuth out of the box.
- No `googleId`, `avatarUrl`, `emailVerified`, or `authProvider` fields. OAuth identity cannot be linked to an account.
- No workspace concept. Every resource (Meeting, ActionItem) is tied directly to `userId`. This makes multi-team or multi-workspace features impossible without a schema rewrite later.
- No `RefreshToken` model. Tokens cannot be revoked.
- No `Invitation` model. There is no way to invite a teammate to collaborate.

### 1.2 Current Auth Flow

**Register:** `POST /auth/register`
1. Validate input via Joi (name, email, password ≥ 8 chars)
2. Check for duplicate email
3. bcrypt hash password with saltRounds=12
4. `prisma.user.create()`
5. Sign a JWT with `{ id, email, name }` payload
6. Return `{ user, token }` in the JSON response body

**Login:** `POST /auth/login`
1. Validate input
2. Lookup user by email
3. `bcrypt.compare()` against stored hash
4. Sign JWT if match
5. Return `{ user, token }` in the JSON response body

**No logout endpoint exists.** Since tokens are stateless and not stored anywhere server-side, there is no mechanism to invalidate a session. A stolen token remains valid for the full 7-day window with no recourse.

### 1.3 Current JWT Implementation

```typescript
// From auth.service.ts
const signToken = (id: string, email: string, name: string): string =>
  jwt.sign({ id, email, name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

// Default expiry: 7 days (env.JWT_EXPIRES_IN = '7d')
// Algorithm: HS256 (jsonwebtoken default)
// Payload: { id, email, name, iat, exp }
```

**JWT middleware:** Reads `Authorization: Bearer <token>`, verifies against `JWT_SECRET`, attaches `{ id, email, name }` to `req.user`. Standard, correct implementation.

### 1.4 Existing Limitations Summary

| Area | Issue | Severity |
|---|---|---|
| OAuth support | No Google/Microsoft OAuth. `password` non-nullable blocks adding it. | Critical |
| Token lifecycle | No refresh token. 7-day access token cannot be revoked. | Critical |
| Workspace model | No concept of workspace, team, or organization. | Critical |
| Role system | No roles or permissions. All authenticated users are equal. | High |
| Token storage | Token returned in JSON body — frontend will likely use localStorage (XSS risk). | High |
| CORS | `origin: '*'` in `app.ts`. Wildcard CORS is unacceptable in production. | High |
| Invitation system | No invitation model or flow. | High |
| Email verification | No email verification on signup. | Medium |
| Password reset | No password reset flow. | Medium |
| Logout | No server-side logout. No session revocation. | Medium |
| Schema coupling | Meetings tied directly to `userId`, not `workspaceId`. Blocks team features. | High |

---

## SECTION 2 — PROPOSED AUTH ARCHITECTURE

### 2.1 Authentication Providers

**Phase 1 (immediate):**
- Email + Password (existing, to be refactored)
- Google OAuth 2.0 (new)

**Phase 2 (roadmap):**
- Microsoft OAuth 2.0
- Enterprise SAML/OIDC SSO

The architecture must be **provider-agnostic from day one** — meaning the `User` model tracks auth providers in a way that allows multiple providers to link to the same identity without schema breakage.

### 2.2 Authorization Model

ZeroClutter is a **workspace-scoped SaaS**. Every resource (meetings, action items, analytics) belongs to a workspace, not a bare user. Users are members of workspaces with an assigned role.

```
User ─── belongs to many ───► Workspace  (via WorkspaceMember)
                                  │
                                  └─── owns ───► Meeting
                                                     │
                                                     └─► ActionItem
```

This makes multi-workspace, team billing, and enterprise accounts structurally sound from the beginning.

### 2.3 Session Management Strategy

**Decision: Short-lived Access Token + Rotating Refresh Token**

| Token | Type | Storage | Lifespan | Purpose |
|---|---|---|---|---|
| Access Token | JWT (HS256) | In-memory only (React context) | 15 minutes | Authenticate API requests |
| Refresh Token | Opaque (stored as SHA-256 hash in DB) | httpOnly Secure cookie | 7 days | Obtain new access tokens |

**Why not long-lived access tokens (current approach)?**
A 7-day JWT is effectively a password. If stolen, there is no revocation path. Short-lived access tokens mean a stolen token expires in 15 minutes maximum. The refresh token is the long-lived credential, and it lives in an httpOnly cookie — unreachable by JavaScript.

**Why httpOnly cookie for refresh token?**
JavaScript cannot read httpOnly cookies. This eliminates the entire class of XSS token theft attacks. SameSite=Strict prevents CSRF. This is the current industry best practice for SPA authentication (used by GitHub, Stripe, Vercel, Linear).

**Why in-memory for access token?**
Access tokens in localStorage survive XSS attacks — any malicious script can read `localStorage.getItem('token')`. Storing the access token in a React context closure means it lives only in JS memory and is gone on page refresh. Session is restored on reload via the refresh cookie, which is silent and automatic.

### 2.4 Refresh Token Strategy

Refresh tokens are **rotated on every use**:
1. Client sends refresh cookie to `POST /auth/refresh`
2. Server validates the token hash exists in DB, is not expired, is not revoked
3. Server issues a new access token AND a new refresh token
4. Old refresh token is marked `revokedAt = now()` in DB
5. New refresh token is set as cookie

**Rotation benefits:**
- If a refresh token is stolen and used by an attacker first, the legitimate user's next refresh will fail (token already rotated/revoked), triggering a forced logout and security alert
- Full audit trail of all sessions in `RefreshToken` table

**Refresh token family tracking (advanced):**
Each refresh token stores a `familyId`. If a revoked token is replayed, all tokens in the same family are immediately revoked (compromise detection). This prevents refresh token replay attacks.

### 2.5 Workspace Architecture

Every authenticated user must belong to at least one workspace.

**Signup/first OAuth login:**
1. User account is created
2. A personal workspace is auto-created (name: user's name + "'s Workspace", slug: auto-generated from email)
3. User is assigned `OWNER` role in that workspace
4. User is redirected to onboarding to configure the workspace

**Workspace context:**
- The frontend carries a `workspaceId` in context (derived from URL slug or stored preference)
- All API calls to resources (meetings, tasks) include the workspace context
- A user switching workspaces updates their active workspace in context

### 2.6 User Lifecycle

```
Register / First OAuth Login
    ↓
User created
    ↓
Workspace auto-created (slug generated)
    ↓
WorkspaceMember created (role: OWNER)
    ↓
Onboarding flow (workspace name, invite teammates)
    ↓
Dashboard

────────────────────────────────

Invited User
    ↓
Invitation email received (token-signed link)
    ↓
Accept invite → Register or Login
    ↓
WorkspaceMember created (role from invitation)
    ↓
Skip workspace creation
    ↓
Dashboard (in invited workspace)

────────────────────────────────

Returning User
    ↓
Page load → restore session via refresh cookie → /auth/refresh
    ↓
If success: restore user + workspace context in memory
    ↓
Dashboard (last active workspace)

If refresh fails: redirect to /login
```

---

## SECTION 3 — DATABASE DESIGN

### 3.1 Proposed Prisma Schema

```prisma
// ─────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────

enum AuthProvider {
  EMAIL
  GOOGLE
  MICROSOFT
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
}

enum PlanTier {
  FREE
  PRO
  BUSINESS
  ENTERPRISE
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  REVOKED
  EXPIRED
}

// ─────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String
  avatarUrl     String?

  // Auth providers
  password      String?                           // Nullable: OAuth users have no password
  googleId      String?      @unique              // Google OAuth identity
  microsoftId   String?      @unique              // Microsoft OAuth identity (future)
  authProvider  AuthProvider @default(EMAIL)      // Primary auth method used at signup

  // Account state
  emailVerified Boolean      @default(false)
  isActive      Boolean      @default(true)       // Soft disable without deleting

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  // Relations
  workspaces        WorkspaceMember[]
  refreshTokens     RefreshToken[]
  invitationsSent   Invitation[]      @relation("InvitedBy")
  meetings          Meeting[]                     // Kept for backward compat; also query via workspace

  @@index([email])
  @@index([googleId])
}

// ─────────────────────────────────────────────────────────────────
// WORKSPACE
// ─────────────────────────────────────────────────────────────────

model Workspace {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique               // URL-safe identifier: "acme-corp", "mridu-workspace"
  logoUrl     String?
  planTier    PlanTier  @default(FREE)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  members     WorkspaceMember[]
  meetings    Meeting[]
  invitations Invitation[]

  @@index([slug])
}

// ─────────────────────────────────────────────────────────────────
// WORKSPACE MEMBER (junction: User ↔ Workspace with role)
// ─────────────────────────────────────────────────────────────────

model WorkspaceMember {
  id          String        @id @default(cuid())
  userId      String
  workspaceId String
  role        WorkspaceRole @default(MEMBER)
  joinedAt    DateTime      @default(now())

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])              // A user can only be a member once per workspace
  @@index([userId])
  @@index([workspaceId])
  @@index([role])
}

// ─────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────

model RefreshToken {
  id          String    @id @default(cuid())
  tokenHash   String    @unique               // SHA-256 hash of the actual opaque token
  familyId    String                          // Groups related rotations for compromise detection
  userId      String
  expiresAt   DateTime
  revokedAt   DateTime?                       // Non-null = token has been used or invalidated
  userAgent   String?                         // Browser/client for session display
  ipAddress   String?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([familyId])
  @@index([tokenHash])
}

// ─────────────────────────────────────────────────────────────────
// INVITATION
// ─────────────────────────────────────────────────────────────────

model Invitation {
  id            String           @id @default(cuid())
  email         String                                 // Invitee email
  workspaceId   String
  invitedById   String
  role          WorkspaceRole    @default(MEMBER)
  tokenHash     String           @unique               // SHA-256 of signed invite token
  status        InvitationStatus @default(PENDING)
  expiresAt     DateTime                               // 72 hours from creation
  acceptedAt    DateTime?
  createdAt     DateTime         @default(now())

  workspace     Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  invitedBy     User             @relation("InvitedBy", fields: [invitedById], references: [id])

  @@index([email])
  @@index([workspaceId])
  @@index([tokenHash])
  @@index([status])
}

// ─────────────────────────────────────────────────────────────────
// MEETING (modified: add workspaceId)
// ─────────────────────────────────────────────────────────────────

model Meeting {
  id           String   @id @default(cuid())
  title        String
  participants String[]
  meetingDate  DateTime
  userId       String                  // Creator — kept for ownership tracking
  workspaceId  String                  // NEW: workspace this meeting belongs to

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user        User                @relation(fields: [userId], references: [id])
  workspace   Workspace           @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  transcript  TranscriptSegment[]
  analysis    MeetingAnalysis?
  actionItems ActionItem[]

  @@index([userId])
  @@index([workspaceId])
  @@index([meetingDate])
}
```

### 3.2 Relationship Explanations

**User ↔ Workspace (via WorkspaceMember):**
Many-to-many. A user can belong to multiple workspaces (consulting, different employers). A workspace has multiple members. The junction table `WorkspaceMember` carries the role, which is scoped per-workspace — you can be an OWNER in your personal workspace and a MEMBER in a client's workspace simultaneously.

**User ↔ RefreshToken:**
One-to-many. A user may have multiple active sessions (web, mobile, different browsers). Each has its own refresh token. Logout from one device revokes only that session's token.

**Workspace ↔ Invitation:**
One-to-many. An invitation is always tied to a specific workspace and expires in 72 hours. The `tokenHash` stores the SHA-256 of the signed token sent via email — we never store the raw token.

**Meeting ↔ Workspace:**
Meetings now belong to a workspace, not just a user. This enables future features: shared meeting visibility for ADMINs, workspace-level analytics, meeting search across the team.

### 3.3 Migration Strategy

The existing `password` column must become nullable. The migration is non-destructive:

```sql
-- Step 1: Make password nullable (safe, no data loss)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Step 2: Add new columns (safe, all nullable or have defaults)
ALTER TABLE "User" ADD COLUMN "googleId" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Step 3: Create new tables (Workspace, WorkspaceMember, RefreshToken, Invitation)
-- Step 4: Add workspaceId to Meeting (nullable first, then backfill, then non-null)
```

---

## SECTION 4 — ROLE SYSTEM

### 4.1 Role Architecture

Roles are **workspace-scoped**, stored in `WorkspaceMember.role`. A user's role can differ across workspaces.

```
OWNER > ADMIN > MEMBER
```

### 4.2 Permission Matrix

| Permission | OWNER | ADMIN | MEMBER |
|---|:---:|:---:|:---:|
| View all workspace meetings | ✓ | ✓ | ✗ (own only) |
| Create meetings | ✓ | ✓ | ✓ |
| Delete any meeting | ✓ | ✓ | ✗ (own only) |
| View all action items | ✓ | ✓ | ✗ (own only) |
| Manage action items | ✓ | ✓ | ✓ (own only) |
| View execution dashboard | ✓ | ✓ | ✗ |
| Invite members | ✓ | ✓ | ✗ |
| Change member roles | ✓ | ✓ (non-OWNER) | ✗ |
| Remove members | ✓ | ✓ (non-OWNER) | ✗ |
| Edit workspace settings | ✓ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ |
| Transfer ownership | ✓ | ✗ | ✗ |

### 4.3 Role Constraints

- A workspace must always have exactly one OWNER. Ownership transfer is a deliberate, explicit action.
- An OWNER cannot be demoted to ADMIN or MEMBER by another ADMIN — only another OWNER can do this (or the owner themselves via transfer).
- A user cannot change their own role.
- Workspace deletion is only available to OWNER and requires explicit confirmation (not just an API call).

### 4.4 Permission Enforcement

Permissions are enforced at the **service layer**, not the controller. A `requireWorkspaceRole(minRole: WorkspaceRole)` middleware validates membership and role before any handler runs. The hierarchy is encoded as an ordered array:

```
['MEMBER', 'ADMIN', 'OWNER']
```

`requireWorkspaceRole('ADMIN')` passes for ADMIN and OWNER, fails for MEMBER.

---

## SECTION 5 — GOOGLE OAUTH FLOW

### 5.1 Complete Sequence Diagram

```
Browser                     Backend                   Google               Database
   │                           │                          │                    │
   │ Click "Sign in with Google│                          │                    │
   ├──────────────────────────►│                          │                    │
   │                           │ Generate state (CSRF)    │                    │
   │                           │ Store state in Redis     │                    │
   │                           │ (TTL 10 min)             │                    │
   │                           │                          │                    │
   │ 302 redirect to Google    │                          │                    │
   │ ◄─────────────────────────┤                          │                    │
   │                           │                          │                    │
   │ User authenticates at Google                         │                    │
   ├──────────────────────────────────────────────────────►                    │
   │                           │                          │                    │
   │ Google redirects to /auth/google/callback?code=&state=                    │
   ├──────────────────────────►│                          │                    │
   │                           │                          │                    │
   │                           │ Verify state == stored state                  │
   │                           │ If mismatch: abort (CSRF attack)              │
   │                           │                          │                    │
   │                           │ Exchange code for tokens │                    │
   │                           ├─────────────────────────►│                    │
   │                           │◄─────────────────────────┤                    │
   │                           │ { access_token, id_token }                   │
   │                           │                          │                    │
   │                           │ Decode id_token          │                    │
   │                           │ Extract: { sub (googleId), email, name,       │
   │                           │           picture, email_verified }           │
   │                           │                          │                    │
   │                           │ findUser by googleId ────────────────────────►│
   │                           │◄────────────────────────────────────────────  │
   │                           │ (result)                                      │
   │                           │                          │                    │
   │    [CASE A: Existing Google user]                    │                    │
   │                           │ User found by googleId  │                    │
   │                           │ Update avatarUrl if changed                   │
   │                           │                          │                    │
   │    [CASE B: Email match — link accounts]             │                    │
   │                           │ User found by email (different authProvider)  │
   │                           │ Link googleId to existing user                │
   │                           │ Set emailVerified = true │                    │
   │                           │                          │                    │
   │    [CASE C: New user]                                │                    │
   │                           │ Create User (googleId, email, name, avatar)   │
   │                           │ Create Workspace (slug from email domain)     │
   │                           │ Create WorkspaceMember (role: OWNER)          │
   │                           │                          │                    │
   │    [All cases continue here]                         │                    │
   │                           │ Generate opaque refresh token                 │
   │                           │ Hash token (SHA-256)     │                    │
   │                           │ Store RefreshToken record in DB               │
   │                           │ Sign short-lived access token (JWT 15min)     │
   │                           │                          │                    │
   │ Set httpOnly refresh cookie                          │                    │
   │ Redirect to frontend callback URL with:             │                    │
   │   ?accessToken=<jwt>&workspaceSlug=<slug>&          │                    │
   │   isNewUser=<bool>                                   │                    │
   │◄──────────────────────────┤                          │                    │
   │                           │                          │                    │
   │ Frontend reads accessToken from URL                  │                    │
   │ Stores in memory (AuthContext)                       │                    │
   │ Clears token from URL (replaceState)                 │                    │
   │                           │                          │                    │
   │ [If isNewUser] → /onboarding                         │                    │
   │ [If returning] → /[workspaceSlug]/dashboard          │                    │
```

### 5.2 Edge Cases

| Scenario | Handling |
|---|---|
| User denies Google permission | Google redirects with `error=access_denied` → backend redirects to `/login?error=oauth_denied` |
| State mismatch (CSRF attempt) | Abort immediately, log security event, redirect to `/login?error=invalid_state` |
| Google returns unverified email | Reject: only accept `email_verified: true` from Google's id_token |
| Email matches existing user (different auth provider) | Link googleId to existing account; do NOT create duplicate user |
| Google account has no email (edge case) | Reject with error: email is required for ZeroClutter |
| User's Google token expires | Irrelevant — we use Google's id_token only at auth time; we do not store Google's access token |
| Network failure during token exchange | Return 502, retry not automatic (user must click again) |
| Invitation link + Google OAuth | Detect `invitationToken` in state parameter; after OAuth success, auto-accept invitation and assign correct workspace role |

---

## SECTION 6 — EMAIL AUTH FLOW

### 6.1 Signup Flow

```
Browser                    Backend                   Database
   │                          │                          │
   │ POST /auth/signup         │                          │
   │ { name, email, password } │                          │
   ├─────────────────────────►│                          │
   │                          │ Validate (Joi)           │
   │                          │ Check email uniqueness ──────────────────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │                          │ bcrypt.hash(password, 12)│                    │
   │                          │                          │                    │
   │                          │ Create User ─────────────────────────────────►│
   │                          │ Create Workspace ─────────────────────────────►│
   │                          │ Create WorkspaceMember (OWNER) ───────────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │                          │ Generate refresh token (opaque)               │
   │                          │ Hash + store RefreshToken ────────────────────►│
   │                          │ Sign access JWT (15min)  │                    │
   │                          │                          │                    │
   │ Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict          │
   │ 201 { user, accessToken, workspace }                │                    │
   │◄─────────────────────────┤                          │                    │
   │                          │                          │                    │
   │ Store accessToken in memory (AuthContext)            │                    │
   │ → /onboarding            │                          │                    │
```

### 6.2 Login Flow

```
Browser                    Backend                   Database
   │                          │                          │
   │ POST /auth/login          │                          │
   │ { email, password }       │                          │
   ├─────────────────────────►│                          │
   │                          │ Validate (Joi)           │
   │                          │ Lookup user by email ────────────────────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │                          │ If not found OR password is null:              │
   │                          │ → 401 "Invalid email or password"             │
   │                          │ (Do not reveal which field failed)            │
   │                          │                          │                    │
   │                          │ bcrypt.compare(password, user.password)       │
   │                          │ If no match → 401        │                    │
   │                          │                          │                    │
   │                          │ Load WorkspaceMember[] ──────────────────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │                          │ Generate + store RefreshToken                 │
   │                          │ Sign access JWT          │                    │
   │                          │                          │                    │
   │ Set-Cookie: refreshToken (httpOnly)                  │                    │
   │ 200 { user, accessToken, workspaces, activeWorkspace }                   │
   │◄─────────────────────────┤                          │                    │
```

### 6.3 Token Refresh Flow

```
Browser                    Backend                   Database
   │                          │                          │
   │ [Access token expired]   │                          │
   │ POST /auth/refresh        │                          │
   │ Cookie: refreshToken=... │                          │
   ├─────────────────────────►│                          │
   │                          │ Read cookie              │
   │                          │ Hash cookie value        │
   │                          │ Lookup RefreshToken by hash ─────────────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │                          │ If not found: 401        │                    │
   │                          │ If expired: 401, clear cookie                 │
   │                          │ If revokedAt is set:     │                    │
   │                          │   → Token replay detected!                    │
   │                          │   → Revoke all tokens in same familyId        │
   │                          │   → 401 (force full re-login)                 │
   │                          │                          │                    │
   │                          │ Revoke old token (set revokedAt)              │
   │                          │ Generate new refresh token                    │
   │                          │ Store new RefreshToken (same familyId) ───────►│
   │                          │ Sign new access JWT (15min)                   │
   │                          │                          │                    │
   │ New Set-Cookie: refreshToken                         │                    │
   │ 200 { accessToken }      │                          │                    │
   │◄─────────────────────────┤                          │                    │
   │                          │                          │                    │
   │ Update accessToken in AuthContext                    │                    │
   │ Retry original failed request                        │                    │
```

### 6.4 Logout Flow

```
Browser                    Backend                   Database
   │                          │                          │
   │ POST /auth/logout         │                          │
   │ Cookie: refreshToken=... │                          │
   │ Authorization: Bearer ... │                          │
   ├─────────────────────────►│                          │
   │                          │ Hash cookie value        │
   │                          │ Set RefreshToken.revokedAt = now() ──────────►│
   │                          │◄─────────────────────────────────────────────  │
   │                          │                          │                    │
   │ Clear-Cookie: refreshToken                           │                    │
   │ 200 { success: true }    │                          │                    │
   │◄─────────────────────────┤                          │                    │
   │                          │                          │                    │
   │ Clear accessToken from memory                        │                    │
   │ → /login                 │                          │                    │
```

---

## SECTION 7 — API CONTRACTS

All responses follow the existing envelope:

**Success:**
```json
{ "traceId": "...", "success": true, "data": { ... } }
```

**Error:**
```json
{ "traceId": "...", "success": false, "error": { "code": "...", "message": "..." } }
```

---

### `POST /auth/signup`

**Purpose:** Register a new user with email and password. Creates user, workspace, and workspace membership. Issues access token and sets refresh cookie.

**Rate limit:** 10 requests per 15 minutes per IP (existing `authRateLimit`)

**Request:**
```json
{
  "name": "Mridu Dwivedi",
  "email": "mridu@example.com",
  "password": "securepassword123"
}
```

**Validation:**
- `name`: string, 2–100 chars, required
- `email`: valid email format, required
- `password`: minimum 8 chars, required

**Response — 201 Created:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "Mridu Dwivedi",
      "email": "mridu@example.com",
      "avatarUrl": null,
      "emailVerified": false,
      "authProvider": "EMAIL"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "workspace": {
      "id": "clx...",
      "name": "Mridu's Workspace",
      "slug": "mridu-workspace",
      "role": "OWNER",
      "planTier": "FREE"
    },
    "isNewUser": true
  }
}
```
**Set-Cookie header:**
```
Set-Cookie: zc_refresh=<opaque_token>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800
```

**Errors:**
- `400 VALIDATION_ERROR` — missing or invalid fields
- `409 CONFLICT` — email already registered

---

### `POST /auth/login`

**Purpose:** Authenticate with email and password. Returns access token, sets refresh cookie.

**Rate limit:** 10 requests per 15 minutes per IP

**Request:**
```json
{
  "email": "mridu@example.com",
  "password": "securepassword123"
}
```

**Response — 200 OK:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "Mridu Dwivedi",
      "email": "mridu@example.com",
      "avatarUrl": null,
      "authProvider": "EMAIL"
    },
    "accessToken": "eyJ...",
    "workspaces": [
      { "id": "clx...", "name": "Mridu's Workspace", "slug": "mridu-workspace", "role": "OWNER", "planTier": "FREE" }
    ],
    "activeWorkspace": {
      "id": "clx...", "name": "Mridu's Workspace", "slug": "mridu-workspace", "role": "OWNER", "planTier": "FREE"
    }
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — missing fields
- `401 UNAUTHORIZED` — invalid email or password (do not reveal which)
- `403 FORBIDDEN` — account deactivated (`isActive = false`)

---

### `GET /auth/google`

**Purpose:** Initiate Google OAuth 2.0 authorization flow. Generates a CSRF state token, stores it in Redis (10 min TTL), then redirects to Google's authorization endpoint.

**Rate limit:** 20 requests per 15 minutes per IP

**Query params (optional):**
- `invitationToken` — if accepting a workspace invitation via Google OAuth

**Response — 302 Redirect to Google:**
```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=<GOOGLE_CLIENT_ID>
  &redirect_uri=<BACKEND_URL>/auth/google/callback
  &response_type=code
  &scope=openid%20email%20profile
  &state=<csrf_state_token>
  &access_type=offline
  &prompt=select_account
```

**No body. No JSON response.**

---

### `GET /auth/google/callback`

**Purpose:** Handle Google's redirect after user authentication. Verify state, exchange code, resolve user, issue tokens, redirect to frontend.

**Called by Google's servers — never called directly by clients.**

**Query params (from Google):**
- `code` — authorization code
- `state` — CSRF state token
- `error` (optional) — `access_denied` etc.

**Success Response — 302 Redirect to frontend:**
```
Location: <FRONTEND_URL>/auth/callback?
  accessToken=<jwt>
  &workspaceSlug=<slug>
  &isNewUser=<true|false>
```
Cookie is set on the redirect response.

**Error Response — 302 Redirect to frontend:**
```
Location: <FRONTEND_URL>/login?error=<error_code>
```

**Error codes:**
- `oauth_denied` — user denied access
- `invalid_state` — CSRF state mismatch
- `email_not_verified` — Google account email unverified
- `server_error` — unexpected error during token exchange

---

### `POST /auth/refresh`

**Purpose:** Exchange a valid refresh token cookie for a new access token and rotated refresh token.

**Auth:** No Authorization header required. Cookie is the credential.

**Request:** No body. Cookie `zc_refresh` is read automatically.

**Response — 200 OK:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```
New `Set-Cookie: zc_refresh` header is returned with the rotated token.

**Errors:**
- `401 UNAUTHORIZED` — cookie missing, token not found in DB, token expired, or token already used (replay detected — all family tokens revoked)

---

### `POST /auth/logout`

**Purpose:** Revoke the current refresh token. Clears the refresh cookie.

**Auth:** Requires `Authorization: Bearer <accessToken>` (to identify the session)

**Request:** No body.

**Response — 200 OK:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```
`Set-Cookie: zc_refresh=; Max-Age=0; HttpOnly; Secure` (clearing the cookie)

**Errors:**
- `401 UNAUTHORIZED` — access token missing or invalid

---

### `GET /auth/me`

**Purpose:** Return the currently authenticated user with their workspace memberships.

**Auth:** Requires `Authorization: Bearer <accessToken>`

**Response — 200 OK:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "Mridu Dwivedi",
      "email": "mridu@example.com",
      "avatarUrl": "https://...",
      "emailVerified": true,
      "authProvider": "GOOGLE"
    },
    "workspaces": [
      { "id": "clx...", "name": "Mridu's Workspace", "slug": "mridu-workspace", "role": "OWNER", "planTier": "FREE" },
      { "id": "clx...", "name": "Acme Corp", "slug": "acme-corp", "role": "MEMBER", "planTier": "PRO" }
    ]
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` — invalid or expired access token

---

### `POST /auth/logout/all` *(all devices)*

**Purpose:** Revoke ALL refresh tokens for the current user. Signs out of every active session.

**Auth:** Requires `Authorization: Bearer <accessToken>`

**Request:** No body.

**Response — 200 OK:**
```json
{
  "traceId": "abc-123",
  "success": true,
  "data": { "message": "Logged out from all devices", "revokedSessions": 3 }
}
```

---

### `POST /auth/workspace/invite` *(future Phase 2)*

**Purpose:** Invite a user to the current workspace by email.

**Auth:** Requires ADMIN or OWNER role in workspace.

**Request:**
```json
{
  "email": "teammate@example.com",
  "role": "MEMBER",
  "workspaceId": "clx..."
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "invitation": {
      "id": "clx...",
      "email": "teammate@example.com",
      "role": "MEMBER",
      "expiresAt": "2026-06-13T10:00:00Z"
    }
  }
}
```

---

### `POST /auth/workspace/accept-invite` *(future Phase 2)*

**Purpose:** Accept a workspace invitation. Associates the authenticated (or newly registered) user with the workspace.

**Request:**
```json
{ "invitationToken": "eyJ..." }
```

**Response — 200 OK:**
```json
{
  "data": {
    "workspace": { "id": "...", "name": "Acme Corp", "slug": "acme-corp", "role": "MEMBER" }
  }
}
```

---

## SECTION 8 — FRONTEND ARCHITECTURE

### 8.1 Route Structure

```
/ (public)
├── /login
├── /signup
├── /auth/callback          ← Google OAuth callback landing
├── /auth/error             ← OAuth error display

/onboarding                 ← Protected: requires auth, redirected after first signup
├── /onboarding/workspace   ← Name your workspace
└── /onboarding/invite      ← Invite teammates

/[workspaceSlug]/           ← Protected: requires auth + workspace membership
├── /dashboard
├── /meetings
├── /meetings/[id]
├── /tasks
├── /analytics
└── /settings
    ├── /settings/workspace
    ├── /settings/members
    └── /settings/billing
```

### 8.2 Protected Route Behavior

```
Route accessed
    │
    ▼
Is route public (/login, /signup, /auth/*)?
    │
    ├─ Yes → Render without auth check
    │
    └─ No  → Check AuthContext.isAuthenticated
                 │
                 ├─ true  → Render component
                 │
                 └─ false → Attempt silent token refresh (POST /auth/refresh)
                               │
                               ├─ Success → Restore session → Render
                               │
                               └─ Failure → Redirect to /login?next=<current-path>
```

After login, redirect to the `?next` parameter or the user's active workspace dashboard.

### 8.3 AuthContext Design

The AuthContext is the single source of truth for auth state across the application.

```
AuthContext shape:
{
  // State
  user: User | null
  workspaces: WorkspaceMembership[]
  activeWorkspace: WorkspaceMembership | null
  accessToken: string | null          ← lives in closure, not localStorage
  isLoading: boolean                  ← true during initial session restore
  isAuthenticated: boolean            ← derived: !!user && !!accessToken

  // Actions
  login(email, password) → Promise
  loginWithGoogle() → void            ← redirects to /auth/google
  signup(name, email, password) → Promise
  logout() → Promise
  logoutAll() → Promise
  switchWorkspace(workspaceId) → void
  refreshAccessToken() → Promise<string | null>
}
```

### 8.4 Token Storage Strategy

| Token | Storage Location | Rationale |
|---|---|---|
| Access Token (JWT) | React state (AuthContext closure) | Inaccessible to XSS; cleared on page refresh |
| Refresh Token (opaque) | httpOnly Secure cookie | JavaScript cannot read it; automatically sent on `/auth/refresh` |
| Workspace preference | localStorage | Not sensitive; fine in localStorage |
| Theme preference | localStorage | Not sensitive; fine in localStorage |

**The access token is NEVER written to localStorage or sessionStorage.**

### 8.5 Session Restoration on Page Load

When the app first mounts (before any protected route renders):

```
App mounts
    │
    ▼
AuthContext initializes: isLoading = true, isAuthenticated = false
    │
    ▼
Silently POST /auth/refresh (browser sends refresh cookie automatically)
    │
    ├─ 200 → Store accessToken in memory → Set user + workspaces from response
    │         isLoading = false, isAuthenticated = true
    │
    └─ 401 → isLoading = false, isAuthenticated = false
              Protected routes will redirect to /login
```

This restoration call happens once on app load. It is transparent to the user — they don't see a loading screen if already authenticated.

### 8.6 API Client (Axios Interceptor Strategy)

The API client uses two interceptors:

**Request interceptor:** Attach `Authorization: Bearer <accessToken>` from AuthContext to every request.

**Response interceptor (401 handling):**
```
Response received
    │
    ├─ Not 401 → Pass through
    │
    └─ 401 received
           │
           ├─ Is this request already a retry? → Clear auth state, redirect /login
           │
           └─ Not a retry:
                  ├─ POST /auth/refresh
                  ├─ If success: update accessToken in context, retry original request
                  └─ If failure: clear auth state, redirect /login
```

This pattern means the application transparently handles token expiry without requiring user action.

### 8.7 Google OAuth Callback Handling

When Google redirects to `/auth/callback`:

1. Read `accessToken`, `workspaceSlug`, `isNewUser` from URL query params
2. Store `accessToken` in AuthContext memory
3. **Immediately remove the token from the URL** using `window.history.replaceState()` — the token must not persist in browser history or be sent in the `Referer` header
4. If `isNewUser === 'true'` → redirect to `/onboarding`
5. If returning user → redirect to `/[workspaceSlug]/dashboard`

### 8.8 Workspace Onboarding Flow

After first signup (email or Google):

```
/onboarding/workspace
    → User renames their workspace (default: "[Name]'s Workspace")
    → Sets logo (optional)
    → Clicks "Continue"

/onboarding/invite
    → Enter teammate emails + roles
    → "Send invitations" (creates Invitation records, sends emails)
    → OR "Skip for now"

→ /[workspaceSlug]/dashboard
```

---

## SECTION 9 — SECURITY REVIEW

### 9.1 JWT Security

**Algorithm:** HS256 with a strong secret (minimum 256-bit entropy).

**For production consideration:** RS256 (asymmetric) allows public key verification without exposing the signing secret. For ZeroClutter Phase 1, HS256 is sufficient. RS256 migration path: swap algorithm in `signToken()` and update `authenticate` middleware to use public key verification.

**Payload:** `{ sub: userId, email, name, workspaceId (active), role, iat, exp }`

**Access token expiry:** 15 minutes. Not configurable via environment to prevent accidental long-lived tokens in production.

**Token ID (jti):** Consider adding `jti` (JWT ID) for future blocklist capability without full stateful sessions.

### 9.2 Refresh Token Security

- Stored as SHA-256 hash of the opaque token — the raw token is never persisted
- Refresh token is `crypto.randomBytes(32).toString('hex')` — 256 bits of entropy
- Rotation: every refresh call invalidates the old token and issues a new one
- Family-based revocation: if a revoked token is replayed, all sessions for that user in the same family are terminated
- Cookie path is scoped to `/auth/refresh` — the refresh cookie is NOT sent to `/api/*` routes, limiting exposure

### 9.3 OAuth Security

- **State parameter:** Cryptographically random 32-byte hex string, stored in Redis with 10-minute TTL. Verified on callback before any processing.
- **Only accept `email_verified: true`** from Google's id_token
- **No storing of Google's access/refresh tokens** — ZeroClutter does not act as Google OAuth client beyond authentication. Google tokens are discarded after extracting user info.
- **PKCE:** Not applicable for server-side OAuth flow (PKCE is for public/mobile clients). Our backend holds the client secret securely.

### 9.4 Cookie Strategy

```
Set-Cookie: zc_refresh=<token>;
  HttpOnly;          ← JavaScript cannot read this
  Secure;            ← Only sent over HTTPS
  SameSite=Strict;   ← Never sent on cross-site requests (CSRF protection)
  Path=/auth/refresh; ← Only sent to refresh endpoint, not all API routes
  Max-Age=604800;    ← 7 days
```

**For enhanced security in production, use `__Host-` prefix:**
```
Set-Cookie: __Host-zc_refresh=<token>; HttpOnly; Secure; SameSite=Strict; Path=/
```
The `__Host-` prefix enforces that the cookie must be `Secure`, cannot have a `Domain` attribute, and must use `Path=/`.

### 9.5 CSRF Protection

SameSite=Strict on the refresh cookie means it will never be sent in cross-site requests. All state-mutating API calls require the `Authorization: Bearer` header, which a CSRF attacker cannot set (they cannot read the in-memory access token). **No additional CSRF token is required** with this architecture.

### 9.6 XSS Protection

- Access token in memory: not accessible to injected scripts
- Refresh token in httpOnly cookie: not accessible to JavaScript at all
- The only XSS risk is that a script could call `POST /auth/refresh` and get a new access token. Mitigation: `SameSite=Strict` ensures the cookie isn't sent from a cross-origin iframe attack. For additional protection: add a CSRF token for the `/auth/refresh` endpoint.
- Helmet.js sets appropriate `Content-Security-Policy` headers (already in the backend)

### 9.7 Rate Limiting

| Route | Limit | Window | Backend |
|---|---|---|---|
| All routes | 100 req | 15 min | Redis (existing) |
| POST /auth/signup | 10 req | 15 min | Per IP |
| POST /auth/login | 10 req | 15 min | Per IP |
| GET /auth/google | 20 req | 15 min | Per IP |
| POST /auth/refresh | 30 req | 15 min | Per IP |
| POST /auth/workspace/invite | 20 req | 1 hour | Per user |

Add exponential backoff behavior: after 5 consecutive failed login attempts from the same IP, introduce a progressive delay (account lockout without account enumeration).

### 9.8 Password Hashing

bcrypt with `saltRounds=12` is already in place — this is correct and industry-standard. The only addition: enforce password strength requirements on the frontend (minimum 8 chars exists; consider adding: at least one non-letter character for production-grade password policy).

### 9.9 CORS Configuration

**Current:** `origin: '*'` — this must be changed before any OAuth implementation is possible (Google will reject wildcard CORS origins) and is a significant security risk.

**Required configuration:**
```typescript
cors({
  origin: [env.FRONTEND_URL, env.FRONTEND_URL_STAGING].filter(Boolean),
  credentials: true,      // ← Required to send/receive cookies cross-origin
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-ID'],
})
```

`credentials: true` is mandatory for the `Set-Cookie` header to be sent to and received from the frontend origin.

### 9.10 Secrets Management

| Secret | Environment Variable | Notes |
|---|---|---|
| JWT signing secret | `JWT_SECRET` | Minimum 32 chars (existing). For production: 64 hex chars generated by `openssl rand -hex 32` |
| Google OAuth client ID | `GOOGLE_CLIENT_ID` | Public; safe to expose in env |
| Google OAuth client secret | `GOOGLE_CLIENT_SECRET` | Never commit; rotate annually |
| Database URL | `DATABASE_URL` | Never log; use connection pooling in production |

---

## SECTION 10 — IMPLEMENTATION ROADMAP

### Phase 1 — Database (Week 1)

**Objective:** Migrate the schema to support the full auth architecture.

1. **Schema additions:**
   - Add enums: `AuthProvider`, `WorkspaceRole`, `PlanTier`, `InvitationStatus`
   - Modify `User`: make `password` nullable, add `googleId`, `microsoftId`, `avatarUrl`, `emailVerified`, `authProvider`, `isActive`
   - Create `Workspace` model
   - Create `WorkspaceMember` model
   - Create `RefreshToken` model
   - Create `Invitation` model
   - Add `workspaceId` to `Meeting` (nullable first for backfill, then non-null)

2. **Migration execution:**
   - Write migration SQL using Prisma migrate
   - Backfill existing users: create a default workspace for each existing user, assign OWNER role
   - Backfill `workspaceId` on existing meetings (assign to owner's default workspace)
   - Make `workspaceId` non-null after backfill is complete

3. **Prisma client regeneration** and type update across all service files

4. **Verification:** All existing tests must continue to pass after schema migration

**Deliverable:** Migrated schema, updated Prisma client, no breaking changes to existing API behavior

---

### Phase 2 — Backend (Weeks 2–3)

**Objective:** Implement complete auth module and workspace infrastructure.

**Week 2:**
1. Install `passport`, `passport-google-oauth20`, `cookie-parser`
2. Add new environment variables to `env.ts`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `COOKIE_SECRET`
3. Fix CORS: replace `origin: '*'` with whitelist config + `credentials: true`
4. Implement `RefreshToken` service: `createToken()`, `validateToken()`, `revokeToken()`, `revokeFamily()`, `revokeAllForUser()`
5. Implement `Workspace` service: `createWorkspace()`, `generateSlug()`, `getWorkspacesForUser()`
6. Refactor `auth.service.ts`: update `registerUser` to create workspace + membership, update `loginUser` to return workspaces
7. Implement refresh token cookie logic in `auth.controller.ts`
8. Implement `POST /auth/refresh` endpoint
9. Implement `POST /auth/logout` endpoint (single device)
10. Implement `POST /auth/logout/all` endpoint
11. Implement `GET /auth/me` endpoint
12. Update `authenticate` middleware: include `workspaceId` in JWT payload validation

**Week 3:**
1. Implement Google OAuth: Passport strategy, `/auth/google` redirect, `/auth/google/callback` handler
2. Implement `requireWorkspaceRole()` middleware
3. Add `workspaceId` validation to all meeting and action-item endpoints
4. Implement workspace invitation: create invitation, hash token, store in DB
5. Implement accept-invitation endpoint
6. Update all route handlers to use workspace context
7. Update Swagger documentation for all new endpoints

---

### Phase 3 — Frontend (Weeks 3–4)

**Objective:** Implement production-grade frontend auth architecture.

1. Install `axios`; configure API client with interceptors (Bearer token + 401 refresh retry)
2. Implement `AuthContext` with all state and actions defined in Section 8.3
3. Implement `ProtectedRoute` component with silent refresh on load
4. Implement `/login` page (email/password form + Google OAuth button)
5. Implement `/signup` page
6. Implement `/auth/callback` route (Google OAuth token ingestion, URL cleanup)
7. Implement `/onboarding/workspace` step
8. Implement `/onboarding/invite` step
9. Implement workspace switcher component
10. Implement workspace settings → members page (invite, role management)
11. Update all API hooks to include `workspaceId` in request context

---

### Phase 4 — Testing (Week 4)

**Backend test coverage:**
- Unit: `RefreshToken` service (create, validate, rotate, revoke, family revocation)
- Unit: `Workspace` service (create, slug generation, membership)
- Unit: `authenticate` middleware (valid token, expired, tampered, missing)
- Unit: `requireWorkspaceRole` middleware (OWNER, ADMIN, MEMBER, missing membership)
- Integration: `POST /auth/signup` (happy path, duplicate email, weak password)
- Integration: `POST /auth/login` (happy path, wrong password, inactive user)
- Integration: `POST /auth/refresh` (valid rotation, expired token, replay attack)
- Integration: `POST /auth/logout` (cookie cleared, token revoked)
- Integration: `GET /auth/me` (authenticated, unauthenticated)
- Integration: Google OAuth callback (new user, existing user, invalid state, email not verified)

**Frontend test coverage:**
- Unit: `AuthContext` state transitions
- Unit: API interceptor retry logic
- Integration: Login flow (success, failure, redirect)
- Integration: Session restoration on page load
- E2E (Playwright): full signup → onboarding → dashboard flow
- E2E: Google OAuth flow (mocked)
- E2E: Logout + re-login

---

### Phase 5 — Production Deployment

**Pre-deployment checklist:**
- [ ] `CORS` origin whitelist configured with production frontend URL
- [ ] `JWT_SECRET` is 64+ character random hex (not a readable string)
- [ ] `GOOGLE_CLIENT_SECRET` set and NOT committed to git
- [ ] Cookie `__Host-` prefix enabled in production (`isProd()` flag)
- [ ] `HTTPS` is enforced (no HTTP in production — cookies won't transmit without `Secure` flag)
- [ ] Redis configured and healthy (rate limiting + OAuth state storage depend on it)
- [ ] Database connection pool configured (`connection_limit=10` for Render free tier)
- [ ] `LOG_LEVEL=warn` in production (reduce noise, keep error visibility)
- [ ] All environment variables added to Render service
- [ ] Auth rate limiting tested against realistic load
- [ ] Token expiry reviewed: 15min access, 7day refresh — confirm acceptable for product UX

---

## SECTION 11 — FINAL RECOMMENDATION

### Architecture I Would Personally Approve

**The core decision:** Short-lived JWT access tokens (15 min) stored in-memory + opaque rotating refresh tokens in httpOnly Secure cookies.

This is the architecture used by every serious SaaS I am aware of in 2025–2026. It is not the easiest to implement (stateless JWT-only is far simpler), but it is the only architecture that:

1. **Allows session revocation.** Without refresh token storage, you cannot log a user out, respond to a credential compromise, or build multi-device session management. These are not optional features for a B2B product handling sensitive business data.

2. **Survives XSS.** Storing access tokens in localStorage is a vulnerability that has been exploited in real products. The additional implementation complexity of in-memory storage is minimal once an axios interceptor handles silent refresh.

3. **Scales correctly.** Refresh tokens in a database are rows, not load. At 10,000 teams, you have 40,000–80,000 refresh token rows — a trivially small table. The tradeoff (one extra DB read per 15-minute window) is completely acceptable.

### The Workspace Decision

The most important architectural choice in this spec is making `workspaceId` a first-class concept from day one. The current schema where Meetings belong directly to Users will create a painful migration when you add:
- Team visibility (other team members can't see each other's meetings under the current model)
- Workspace analytics
- Billing per workspace
- Multiple teams per user

Introducing workspace now, while the data volume is small and the migration is cheap, avoids a multi-week schema migration later under product pressure.

### Google OAuth Priority

Google OAuth should be considered **the primary auth method** for ZeroClutter's target audience (startup founders, engineering managers, product managers). These users already use Google Workspace. Forcing them through email/password registration is a conversion killer. The email+password path should exist as a fallback, not the primary CTA.

### What I Would Not Do

1. **No JWT-only sessions.** Stateless-only is architecturally clean but operationally indefensible for a B2B SaaS.
2. **No localStorage for access tokens.** The XSS risk is not theoretical — it is a known attack vector.
3. **No wildcard CORS.** It blocks OAuth from working correctly and is a security liability.
4. **No OAuth without state parameter validation.** CSRF against OAuth flows is a real attack.
5. **No single-role flat permission model.** Adding RBAC later requires a schema migration. Adding it now costs one database table and one middleware.

### Tradeoffs Accepted

| Decision | Tradeoff Accepted | Reason |
|---|---|---|
| In-memory access token | Token lost on page refresh (restored silently via cookie) | XSS immunity is worth it |
| Refresh token in DB | One extra DB read per token refresh | Revocability and security are worth it |
| 15-minute access token | More token refresh calls | Smaller blast radius on compromise |
| HS256 over RS256 | Cannot distribute verification to edge | Acceptable for Phase 1; RS256 migration path is clear |
| Workspace required | Every user must have a workspace | Necessary for all future team features; cost is one extra create on signup |
| bcrypt saltRounds=12 | Slower hashing (~350ms) | Correct tradeoff: slows brute force attacks |

### Scaling Path

This architecture handles the growth stages as follows:

- **0–1,000 users:** Single DB, Redis for rate limiting. No changes needed.
- **1,000–50,000 users:** Add read replica for `GET /auth/me` and workspace queries. Refresh token table stays small (~200K rows). No architectural changes.
- **50,000–500,000 users:** Consider Redis-backed session cache for access token introspection at edge. Move to RS256 for JWT verification distribution. Add MFA (TOTP) layer using existing User model (add `mfaSecret` column). These are additive changes, not rewrites.
- **Enterprise:** SAML/OIDC SSO plugs into the existing `authProvider` enum on User. The workspace model already supports enterprise multi-team structures. Billing isolation is already at the workspace level.

This architecture is designed to be **implemented once and extended incrementally**, not rewritten at each growth stage. That is the mark of a production-grade design.

---

*End of ZeroClutter Authentication Architecture Specification*

*This document supersedes all prior auth design discussions. Frontend and backend implementation must conform to the contracts and flows defined here before any auth code is written.*