import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/database';
import { env } from '../../config/env';
import { NotFoundError, ForbiddenError, AIError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { buildAnalysisPrompt } from './analysis.prompt';
import { AnalysisResult, CitedInsight, CitedActionItem } from '../../types';
import { cacheDelete, cacheDeletePattern, meetingKey } from '../../utils/cache';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const validateCitation = (
  citation: { timestamp?: string; speaker?: string; quote?: string },
  validTimestamps: string[],
): boolean => {
  if (!citation.timestamp) return false;
  return validTimestamps.includes(citation.timestamp);
};

const validateAndCleanResult = (
  raw: unknown,
  validTimestamps: string[],
): AnalysisResult => {
  if (!raw || typeof raw !== 'object') {
    throw new AIError('AI returned invalid response structure');
  }

  const result = raw as Record<string, unknown>;

  const validateCitedItems = (
    items: unknown[],
    field: string,
  ): CitedInsight[] => {
    return items.map((item, idx) => {
      const obj = item as Record<string, unknown>;

      if (!obj.text || typeof obj.text !== 'string') {
        throw new AIError(`${field}[${idx}].text is missing or not a string`);
      }

      if (!Array.isArray(obj.citations) || obj.citations.length === 0) {
        throw new AIError(`${field}[${idx}] must have at least one citation`);
      }

      const cleanCitations = (obj.citations as unknown[])
        .filter((c) => {
          const citation = c as { timestamp?: string };
          const valid = validateCitation(citation as { timestamp?: string; speaker?: string; quote?: string }, validTimestamps);
          if (!valid) {
            logger.warn(`Invalid citation timestamp "${citation.timestamp}" in ${field}[${idx}] — removing`);
          }
          return valid;
        })
        .map((c) => {
          const citation = c as { timestamp?: string; speaker?: string; quote?: string };
          return {
            timestamp: citation.timestamp!,
            speaker: citation.speaker,
            quote: citation.quote,
          };
        });

      if (cleanCitations.length === 0) {
        throw new AIError(`${field}[${idx}] has no valid citations after validation`);
      }

      return { text: obj.text, citations: cleanCitations };
    });
  };

  const validateActionItems = (items: unknown[]): CitedActionItem[] => {
    return items.map((item, idx) => {
      const obj = item as Record<string, unknown>;

      if (!obj.task || typeof obj.task !== 'string') {
        throw new AIError(`actionItems[${idx}].task is missing`);
      }
      if (!obj.assignee || typeof obj.assignee !== 'string') {
        throw new AIError(`actionItems[${idx}].assignee is missing`);
      }
      if (!Array.isArray(obj.citations) || obj.citations.length === 0) {
        throw new AIError(`actionItems[${idx}] must have at least one citation`);
      }

      const cleanCitations = (obj.citations as unknown[])
        .filter((c) => {
          const citation = c as { timestamp?: string };
          return validateCitation(citation as { timestamp?: string; speaker?: string; quote?: string }, validTimestamps);
        })
        .map((c) => {
          const citation = c as { timestamp?: string; speaker?: string; quote?: string };
          return {
            timestamp: citation.timestamp!,
            speaker: citation.speaker,
            quote: citation.quote,
          };
        });

      if (cleanCitations.length === 0) {
        throw new AIError(`actionItems[${idx}] has no valid citations after validation`);
      }

      return {
        task: obj.task,
        assignee: obj.assignee as string,
        dueDate: obj.dueDate ? String(obj.dueDate) : undefined,
        citations: cleanCitations,
      };
    });
  };

  return {
    summary: Array.isArray(result.summary)
      ? validateCitedItems(result.summary, 'summary')
      : [],
    actionItems: Array.isArray(result.actionItems)
      ? validateActionItems(result.actionItems)
      : [],
    decisions: Array.isArray(result.decisions)
      ? validateCitedItems(result.decisions, 'decisions')
      : [],
    followUps: Array.isArray(result.followUps)
      ? validateCitedItems(result.followUps, 'followUps')
      : [],
  };
};

const callGemini = async (prompt: string): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text;
};

export const analyzeMeetingById = async (meetingId: string, userId: string) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { transcript: { orderBy: { order: 'asc' } } },
  });

  if (!meeting) throw new NotFoundError('Meeting');
  if (meeting.userId !== userId) throw new ForbiddenError('You do not have access to this meeting');

  if (meeting.transcript.length === 0) {
    throw new AIError('Meeting has no transcript segments to analyze');
  }

  const validTimestamps = meeting.transcript.map((s) => s.timestamp);
  const prompt = buildAnalysisPrompt(meeting.title, meeting.participants, meeting.transcript, meeting.meetingDate);

  logger.info('Calling Gemini for meeting analysis', { meetingId });

  let rawText: string;
  try {
    rawText = await callGemini(prompt);
  } catch (err) {
    logger.error('Gemini API call failed', { meetingId, error: (err as Error).message });
    throw new AIError('AI service is temporarily unavailable. Please try again.');
  }

  let parsed: unknown;
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    logger.error('Failed to parse AI JSON response', { meetingId, rawText: rawText.slice(0, 500) });
    throw new AIError('AI returned unparseable response');
  }

  const validated = validateAndCleanResult(parsed, validTimestamps);

  const analysis = await prisma.meetingAnalysis.upsert({
    where: { meetingId },
    create: {
      meetingId,
      summary: validated.summary as unknown as object[],
      decisions: validated.decisions as unknown as object[],
      followUps: validated.followUps as unknown as object[],
    },
    update: {
      summary: validated.summary as unknown as object[],
      decisions: validated.decisions as unknown as object[],
      followUps: validated.followUps as unknown as object[],
      updatedAt: new Date(),
    },
  });

  // Persist action items to the ActionItem table for tracking
  if (validated.actionItems.length > 0) {
    await prisma.actionItem.createMany({
      data: validated.actionItems.map((item) => ({
        task: item.task,
        assignee: item.assignee,
        status: 'PENDING',
        dueDate: item.dueDate ? (isNaN(new Date(item.dueDate).getTime()) ? null : new Date(item.dueDate)) : null,
        meetingId,
        citations: item.citations as unknown as object[],
      })),
    });
  }

  await Promise.all([
    cacheDelete(meetingKey(userId, meetingId)),
    cacheDeletePattern(`meetings:${userId}:*`),
  ]);

  logger.info('Meeting analysis complete', {
    meetingId,
    summaryCount: validated.summary.length,
    actionItemsCount: validated.actionItems.length,
    decisionsCount: validated.decisions.length,
    followUpsCount: validated.followUps.length,
  });

  return {
    analysis,
    actionItems: validated.actionItems,
  };
};
