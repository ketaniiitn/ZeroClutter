import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  traceId?: string;
}

export interface WorkspaceContext {
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface WorkspaceRequest extends AuthenticatedRequest {
  workspace?: WorkspaceContext;
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
