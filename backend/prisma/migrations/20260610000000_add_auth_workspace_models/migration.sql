-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- AlterTable: make password nullable, add OAuth + account-state columns
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "User"
  ADD COLUMN "googleId"      TEXT,
  ADD COLUMN "avatarUrl"     TEXT,
  ADD COLUMN "authProvider"  "AuthProvider" NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isActive"      BOOLEAN NOT NULL DEFAULT true;

-- Unique index on googleId
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- Index on email (already exists as unique, but add named index)
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_googleId_idx" ON "User"("googleId");

-- CreateTable: Workspace
CREATE TABLE "Workspace" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "logoUrl"   TEXT,
    "planTier"  "PlanTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE INDEX "Workspace_slug_idx" ON "Workspace"("slug");

-- CreateTable: WorkspaceMember
CREATE TABLE "WorkspaceMember" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role"        "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateTable: RefreshToken
CREATE TABLE "RefreshToken" (
    "id"        TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId"  TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- AlterTable: add nullable workspaceId to Meeting
ALTER TABLE "Meeting" ADD COLUMN "workspaceId" TEXT;

CREATE INDEX "Meeting_workspaceId_idx" ON "Meeting"("workspaceId");

-- AddForeignKey: WorkspaceMember → User
ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: WorkspaceMember → Workspace
ALTER TABLE "WorkspaceMember"
  ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: RefreshToken → User
ALTER TABLE "RefreshToken"
  ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Meeting → Workspace (nullable)
ALTER TABLE "Meeting"
  ADD CONSTRAINT "Meeting_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
