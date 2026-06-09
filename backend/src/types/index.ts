import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  traceId?: string;
}

export interface TranscriptSegmentInput {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface CitedInsight {
  text: string;
  citations: Array<{ timestamp: string; speaker?: string; quote?: string }>;
}

export interface CitedActionItem {
  task: string;
  assignee: string;
  dueDate?: string;
  citations: Array<{ timestamp: string; speaker?: string; quote?: string }>;
}

export interface AnalysisResult {
  summary: CitedInsight[];
  actionItems: CitedActionItem[];
  decisions: CitedInsight[];
  followUps: CitedInsight[];
}

export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ActionItemFilterQuery extends PaginationQuery {
  status?: string;
  assignee?: string;
  meetingId?: string;
}

export interface MeetingFilterQuery extends PaginationQuery {
  from?: string;
  to?: string;
}
