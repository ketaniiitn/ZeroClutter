-- CreateTable
CREATE TABLE "MeetingBot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusDetail" TEXT,
    "botEmail" TEXT,
    "meetingId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingBot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingBot_userId_idx" ON "MeetingBot"("userId");

-- CreateIndex
CREATE INDEX "MeetingBot_status_idx" ON "MeetingBot"("status");

-- AddForeignKey
ALTER TABLE "MeetingBot" ADD CONSTRAINT "MeetingBot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
