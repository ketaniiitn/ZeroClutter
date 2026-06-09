import prisma from '../../config/database';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';
import { paginatedResponse } from '../../utils/response';

export const createActionItem = async (
  userId: string,
  task: string,
  assignee: string,
  meetingId: string,
  citations: object[],
  dueDate?: string | null,
) => {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting');
  if (meeting.userId !== userId) throw new ForbiddenError('You do not have access to this meeting');

  return prisma.actionItem.create({
    data: {
      task,
      assignee,
      meetingId,
      citations,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'PENDING',
    },
  });
};

export const updateActionItemStatus = async (
  id: string,
  userId: string,
  status: string,
) => {
  const item = await prisma.actionItem.findUnique({
    where: { id },
    include: { meeting: true },
  });

  if (!item) throw new NotFoundError('Action item');
  if (item.meeting.userId !== userId) {
    throw new ForbiddenError('You do not have access to this action item');
  }

  return prisma.actionItem.update({
    where: { id },
    data: { status },
  });
};

export const listActionItems = async (
  userId: string,
  page: number,
  limit: number,
  filters: { status?: string; assignee?: string; meetingId?: string },
) => {
  const userMeetings = await prisma.meeting.findMany({
    where: { userId },
    select: { id: true },
  });
  const meetingIds = userMeetings.map((m) => m.id);

  if (meetingIds.length === 0) {
    return paginatedResponse([], 0, page, limit);
  }

  const where: Record<string, unknown> = {
    meetingId: { in: meetingIds },
  };

  if (filters.status) where.status = filters.status;
  if (filters.assignee) where.assignee = { contains: filters.assignee, mode: 'insensitive' };
  if (filters.meetingId) {
    if (!meetingIds.includes(filters.meetingId)) {
      throw new ForbiddenError('You do not have access to this meeting');
    }
    where.meetingId = filters.meetingId;
  }

  const [total, items] = await Promise.all([
    prisma.actionItem.count({ where }),
    prisma.actionItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { meeting: { select: { id: true, title: true } } },
    }),
  ]);

  return paginatedResponse(items, total, page, limit);
};

export const getOverdueActionItems = async (userId: string) => {
  const userMeetings = await prisma.meeting.findMany({
    where: { userId },
    select: { id: true },
  });
  const meetingIds = userMeetings.map((m) => m.id);

  if (meetingIds.length === 0) return [];

  return prisma.actionItem.findMany({
    where: {
      meetingId: { in: meetingIds },
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
    include: { meeting: { select: { id: true, title: true } } },
    orderBy: { dueDate: 'asc' },
  });
};

export const getActionItemById = async (id: string) => {
  const item = await prisma.actionItem.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Action item');
  return item;
};

export const validateMeetingOwnership = async (meetingId: string, userId: string): Promise<void> => {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new NotFoundError('Meeting');
  if (meeting.userId !== userId) throw new ForbiddenError('You do not have access to this meeting');
};
