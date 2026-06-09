import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { TranscriptSegmentInput } from '../../types';
import { paginatedResponse } from '../../utils/response';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern, meetingKey, meetingListKey } from '../../utils/cache';

export const createMeeting = async (
  userId: string,
  title: string,
  participants: string[],
  meetingDate: string,
  transcript: TranscriptSegmentInput[],
) => {
  const meeting = await prisma.meeting.create({
    data: {
      title,
      participants,
      meetingDate: new Date(meetingDate),
      userId,
      transcript: {
        create: transcript.map((seg, idx) => ({
          timestamp: seg.timestamp,
          speaker: seg.speaker,
          text: seg.text,
          order: idx,
        })),
      },
    },
    include: {
      transcript: {
        orderBy: { order: 'asc' },
      },
    },
  });

  await cacheDeletePattern(`meetings:${userId}:*`);
  return meeting;
};

export const getMeetingById = async (id: string, userId: string) => {
  const key = meetingKey(userId, id);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      transcript: { orderBy: { order: 'asc' } },
      analysis: true,
      actionItems: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!meeting) throw new NotFoundError('Meeting');
  if (meeting.userId !== userId) throw new ForbiddenError('You do not have access to this meeting');

  await cacheSet(key, meeting);
  return meeting;
};

export const listMeetings = async (
  userId: string,
  page: number,
  limit: number,
  from?: string,
  to?: string,
) => {
  const where: Record<string, unknown> = { userId };

  if (from || to) {
    where.meetingDate = {};
    if (from) (where.meetingDate as Record<string, unknown>).gte = new Date(from);
    if (to) (where.meetingDate as Record<string, unknown>).lte = new Date(to);
  }

  const queryStr = JSON.stringify({ page, limit, from, to });
  const key = meetingListKey(userId, queryStr);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const [total, items] = await Promise.all([
    prisma.meeting.count({ where }),
    prisma.meeting.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { meetingDate: 'desc' },
      include: {
        transcript: { orderBy: { order: 'asc' } },
        _count: { select: { actionItems: true } },
      },
    }),
  ]);

  const result = paginatedResponse(items, total, page, limit);
  await cacheSet(key, result, 120);
  return result;
};
